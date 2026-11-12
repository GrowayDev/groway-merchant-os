/**
 * Inventory Accounting Service
 * 
 * Handles accounting integration for inventory operations:
 * 1. COGS (Cost of Goods Sold) calculation
 * 2. Inventory valuation
 * 3. Journal entry creation for inventory transactions
 * 4. Period-end adjustments
 * 5. Inventory asset tracking
 */

import { db } from '@/lib/db';

// Types
export interface COGSCalculation {
  productId: string;
  productName: string;
  sku: string;
  quantitySold: number;
  unitCost: number;
  totalCOGS: number;
  salesRevenue: number;
  grossProfit: number;
  grossMargin: number;
  period: {
    start: Date;
    end: Date;
  };
}

export interface InventoryValuation {
  totalValue: number;
  totalCost: number;
  totalRetail: number;
  potentialProfit: number;
  byCategory: Array<{
    categoryId: string;
    categoryName: string;
    value: number;
    cost: number;
    itemCount: number;
    percentage: number;
  }>;
  byLocation: Array<{
    locationId: string;
    locationName: string;
    value: number;
    cost: number;
    itemCount: number;
    percentage: number;
  }>;
  byStatus: {
    active: number;
    lowStock: number;
    outOfStock: number;
    expired: number;
  };
  turnoverRate: number;
  daysOfInventory: number;
}

export interface InventoryJournalEntry {
  id: string;
  entryNumber: string;
  type: 'purchase' | 'sale' | 'adjustment' | 'transfer' | 'stocktake' | 'write_off';
  referenceType: string;
  referenceId: string;
  referenceNumber: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  description: string;
  createdAt: Date;
}

// Default account codes for inventory accounting
const INVENTORY_ACCOUNTS = {
  INVENTORY_ASSET: '1300',           // Inventory Asset
  COGS: '5100',                      // Cost of Goods Sold
  PURCHASES: '5200',                 // Purchases
  INVENTORY_ADJUSTMENT: '5300',      // Inventory Adjustment
  FREIGHT_IN: '5400',                // Freight In
  PURCHASE_RETURNS: '5500',          // Purchase Returns & Allowances
  SALES: '4000',                     // Sales Revenue
  SALES_RETURNS: '4100',             // Sales Returns & Allowances
  VAT_INPUT: '2100',                 // VAT Input (Asset)
  VAT_OUTPUT: '2200',                // VAT Output (Liability)
  ACCOUNTS_PAYABLE: '2000',          // Accounts Payable
  CASH: '1000',                      // Cash
  COST_VARIANCE: '5600',             // Cost Variance
};

/**
 * Inventory Accounting Service Class
 */
export class InventoryAccountingService {
  /**
   * Calculate COGS for a period
   */
  static async calculateCOGS(
    merchantId: string,
    startDate: Date,
    endDate: Date,
    options?: {
      productId?: string;
      categoryId?: string;
    }
  ): Promise<{
    items: COGSCalculation[];
    totals: {
      totalCOGS: number;
      totalRevenue: number;
      totalGrossProfit: number;
      avgGrossMargin: number;
    };
  }> {
    // Build where clause for sales movements
    const where: any = {
      merchantId,
      type: 'sale',
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (options?.productId) {
      where.productId = options.productId;
    }

    // Get all sale movements
    const sales = await db.stockMovement.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            categoryId: true,
            sellingPrice: true,
          },
        },
      },
    });

    // Filter by category if specified
    let filteredSales = sales;
    if (options?.categoryId) {
      filteredSales = sales.filter(s => s.product?.categoryId === options.categoryId);
    }

    // Group by product
    const productMap = new Map<string, {
      product: typeof sales[0]['product'];
      quantitySold: number;
      totalCost: number;
      totalRevenue: number;
    }>();

    for (const sale of filteredSales) {
      if (!sale.product) continue;

      const existing = productMap.get(sale.productId) || {
        product: sale.product,
        quantitySold: 0,
        totalCost: 0,
        totalRevenue: 0,
      };

      existing.quantitySold += Math.abs(sale.quantity);
      existing.totalCost += Math.abs(sale.totalCost || 0);
      existing.totalRevenue += Math.abs(sale.quantity) * (sale.product.sellingPrice || 0);

      productMap.set(sale.productId, existing);
    }

    // Build COGS calculations
    const items: COGSCalculation[] = [];

    for (const [productId, data] of productMap) {
      const unitCost = data.quantitySold > 0 ? data.totalCost / data.quantitySold : 0;
      const grossProfit = data.totalRevenue - data.totalCost;
      const grossMargin = data.totalRevenue > 0 
        ? (grossProfit / data.totalRevenue) * 100 
        : 0;

      items.push({
        productId,
        productName: data.product.name,
        sku: data.product.sku,
        quantitySold: data.quantitySold,
        unitCost,
        totalCOGS: data.totalCost,
        salesRevenue: data.totalRevenue,
        grossProfit,
        grossMargin,
        period: { start: startDate, end: endDate },
      });
    }

    // Sort by total COGS descending
    items.sort((a, b) => b.totalCOGS - a.totalCOGS);

    // Calculate totals
    const totals = {
      totalCOGS: items.reduce((sum, i) => sum + i.totalCOGS, 0),
      totalRevenue: items.reduce((sum, i) => sum + i.salesRevenue, 0),
      totalGrossProfit: items.reduce((sum, i) => sum + i.grossProfit, 0),
      avgGrossMargin: 0,
    };

    totals.avgGrossMargin = totals.totalRevenue > 0 
      ? (totals.totalGrossProfit / totals.totalRevenue) * 100 
      : 0;

    return { items, totals };
  }

  /**
   * Get inventory valuation
   */
  static async getInventoryValuation(
    merchantId: string,
    options?: {
      branchId?: string;
      categoryId?: string;
      valuationMethod?: 'cost' | 'retail' | 'lower_of_cost_or_market';
    }
  ): Promise<InventoryValuation> {
    const valuationMethod = options?.valuationMethod || 'cost';

    // Get all batches
    const batchWhere: any = {
      merchantId,
      status: { not: 'depleted' },
    };

    if (options?.branchId) {
      batchWhere.branchId = options.branchId;
    }

    const batches = await db.inventoryBatch.findMany({
      where: batchWhere,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            sellingPrice: true,
            costPrice: true,
            categoryId: true,
            category: {
              select: { id: true, name: true },
            },
          },
        },
        branch: {
          select: { id: true, name: true },
        },
      },
    });

    // Filter by category if specified
    let filteredBatches = batches;
    if (options?.categoryId) {
      filteredBatches = batches.filter(b => b.product?.categoryId === options.categoryId);
    }

    // Calculate totals
    let totalCost = 0;
    let totalRetail = 0;

    for (const batch of filteredBatches) {
      const cost = batch.currentQty * (batch.unitCost || 0);
      const retail = batch.currentQty * (batch.product?.sellingPrice || 0);
      totalCost += cost;
      totalRetail += retail;
    }

    // Determine total value based on valuation method
    let totalValue = totalCost;
    if (valuationMethod === 'retail') {
      totalValue = totalRetail;
    } else if (valuationMethod === 'lower_of_cost_or_market') {
      totalValue = Math.min(totalCost, totalRetail);
    }

    // Group by category
    const categoryMap = new Map<string, {
      categoryId: string;
      categoryName: string;
      value: number;
      cost: number;
      itemCount: number;
    }>();

    for (const batch of filteredBatches) {
      const catId = batch.product?.categoryId || 'uncategorized';
      const catName = batch.product?.category?.name || 'Uncategorized';
      const cost = batch.currentQty * (batch.unitCost || 0);

      const existing = categoryMap.get(catId) || {
        categoryId: catId,
        categoryName: catName,
        value: 0,
        cost: 0,
        itemCount: 0,
      };

      existing.cost += cost;
      existing.value += cost; // Using cost for value
      existing.itemCount++;

      categoryMap.set(catId, existing);
    }

    const byCategory = Array.from(categoryMap.values())
      .map(c => ({
        ...c,
        percentage: totalCost > 0 ? (c.cost / totalCost) * 100 : 0,
      }))
      .sort((a, b) => b.cost - a.cost);

    // Group by location
    const locationMap = new Map<string, {
      locationId: string;
      locationName: string;
      value: number;
      cost: number;
      itemCount: number;
    }>();

    for (const batch of filteredBatches) {
      const locId = batch.branchId || 'unknown';
      const locName = batch.branch?.name || 'Unknown';
      const cost = batch.currentQty * (batch.unitCost || 0);

      const existing = locationMap.get(locId) || {
        locationId: locId,
        locationName: locName,
        value: 0,
        cost: 0,
        itemCount: 0,
      };

      existing.cost += cost;
      existing.value += cost;
      existing.itemCount++;

      locationMap.set(locId, existing);
    }

    const byLocation = Array.from(locationMap.values())
      .map(l => ({
        ...l,
        percentage: totalCost > 0 ? (l.cost / totalCost) * 100 : 0,
      }))
      .sort((a, b) => b.cost - a.cost);

    // Calculate status breakdown
    const products = await db.product.findMany({
      where: {
        merchantId,
        trackInventory: true,
      },
      select: {
        id: true,
        currentStock: true,
        lowStockThreshold: true,
      },
    });

    const byStatus = {
      active: 0,
      lowStock: 0,
      outOfStock: 0,
      expired: 0,
    };

    // Count expired batches
    const now = new Date();
    const expiredBatches = filteredBatches.filter(b => 
      b.expiryDate && new Date(b.expiryDate) < now
    );
    byStatus.expired = expiredBatches.reduce((sum, b) => sum + b.currentQty, 0);

    for (const product of products) {
      if (product.currentStock <= 0) {
        byStatus.outOfStock++;
      } else if (product.currentStock <= (product.lowStockThreshold || 10)) {
        byStatus.lowStock++;
      } else {
        byStatus.active++;
      }
    }

    // Calculate turnover rate
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const salesLast30Days = await db.stockMovement.findMany({
      where: {
        merchantId,
        type: 'sale',
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { totalCost: true },
    });

    const cogsLast30Days = salesLast30Days.reduce((sum, s) => sum + Math.abs(s.totalCost || 0), 0);
    const avgInventory = totalCost;
    const turnoverRate = avgInventory > 0 ? (cogsLast30Days / avgInventory) * 12 : 0; // Annualized
    const daysOfInventory = cogsLast30Days > 0 ? (avgInventory / (cogsLast30Days / 30)) : 999;

    return {
      totalValue,
      totalCost,
      totalRetail,
      potentialProfit: totalRetail - totalCost,
      byCategory,
      byLocation,
      byStatus,
      turnoverRate,
      daysOfInventory,
    };
  }

  /**
   * Create journal entry for inventory movement
   */
  static async createJournalEntry(options: {
    merchantId: string;
    type: 'purchase' | 'sale' | 'adjustment' | 'transfer' | 'stocktake' | 'write_off';
    referenceType: string;
    referenceId: string;
    referenceNumber: string;
    amount: number;
    description: string;
    performedBy?: string;
    performedByName?: string;
    customAccounts?: {
      debitAccount?: string;
      creditAccount?: string;
    };
  }): Promise<{ success: boolean; entryId?: string; error?: string }> {
    const {
      merchantId,
      type,
      referenceType,
      referenceId,
      referenceNumber,
      amount,
      description,
      performedBy,
      performedByName,
      customAccounts,
    } = options;

    try {
      // Determine accounts based on type
      let debitAccount = customAccounts?.debitAccount || INVENTORY_ACCOUNTS.INVENTORY_ASSET;
      let creditAccount = customAccounts?.creditAccount || INVENTORY_ACCOUNTS.COGS;

      switch (type) {
        case 'purchase':
          debitAccount = INVENTORY_ACCOUNTS.INVENTORY_ASSET;
          creditAccount = INVENTORY_ACCOUNTS.ACCOUNTS_PAYABLE;
          break;
        case 'sale':
          debitAccount = INVENTORY_ACCOUNTS.COGS;
          creditAccount = INVENTORY_ACCOUNTS.INVENTORY_ASSET;
          break;
        case 'adjustment':
          debitAccount = INVENTORY_ACCOUNTS.INVENTORY_ADJUSTMENT;
          creditAccount = INVENTORY_ACCOUNTS.INVENTORY_ASSET;
          break;
        case 'transfer':
          // Transfer doesn't affect GL, just location
          return { success: true, entryId: undefined };
        case 'stocktake':
          debitAccount = INVENTORY_ACCOUNTS.INVENTORY_ASSET;
          creditAccount = INVENTORY_ACCOUNTS.INVENTORY_ADJUSTMENT;
          break;
        case 'write_off':
          debitAccount = INVENTORY_ACCOUNTS.INVENTORY_ADJUSTMENT;
          creditAccount = INVENTORY_ACCOUNTS.INVENTORY_ASSET;
          break;
      }

      // Generate entry number
      const count = await db.journalEntry.count();
      const entryNumber = `JE-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

      // Get period
      const period = new Date().toISOString().slice(0, 7); // YYYY-MM

      // Create journal entry with lines
      const entry = await db.journalEntry.create({
        data: {
          merchantId,
          entryNumber,
          period,
          date: new Date(),
          description,
          referenceType,
          referenceId,
          referenceNumber,
          status: 'posted',
          postedAt: new Date(),
          postedBy: performedBy,
          postedByName: performedByName,
          totalDebit: amount,
          totalCredit: amount,
          lines: {
            create: [
              {
                accountCode: debitAccount,
                description,
                debit: amount,
                credit: 0,
              },
              {
                accountCode: creditAccount,
                description,
                debit: 0,
                credit: amount,
              },
            ],
          },
        },
      });

      return { success: true, entryId: entry.id };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create journal entry',
      };
    }
  }

  /**
   * Generate inventory journal entries report
   */
  static async getJournalEntries(
    merchantId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      type?: string;
    }
  ): Promise<InventoryJournalEntry[]> {
    const where: any = {
      merchantId,
      referenceType: { in: ['stock_movement', 'grn', 'stocktake', 'transfer'] },
    };

    if (options?.startDate && options?.endDate) {
      where.date = {
        gte: options.startDate,
        lte: options.endDate,
      };
    }

    if (options?.type) {
      where.referenceType = options.type;
    }

    const entries = await db.journalEntry.findMany({
      where,
      include: {
        lines: true,
      },
      orderBy: { date: 'desc' },
    });

    return entries.map(entry => {
      const debitLine = entry.lines.find(l => l.debit > 0);
      const creditLine = entry.lines.find(l => l.credit > 0);

      return {
        id: entry.id,
        entryNumber: entry.entryNumber,
        type: this.determineEntryType(entry.referenceType),
        referenceType: entry.referenceType,
        referenceId: entry.referenceId,
        referenceNumber: entry.referenceNumber,
        debitAccount: debitLine?.accountCode || '',
        creditAccount: creditLine?.accountCode || '',
        amount: entry.totalDebit,
        description: entry.description || '',
        createdAt: entry.date,
      };
    });
  }

  /**
   * Generate period-end inventory adjustment
   */
  static async generatePeriodEndAdjustment(
    merchantId: string,
    period: string // YYYY-MM format
  ): Promise<{
    success: boolean;
    adjustments?: Array<{
      account: string;
      amount: number;
      type: 'debit' | 'credit';
      description: string;
    }>;
    error?: string;
  }> {
    try {
      // Get current inventory valuation
      const valuation = await this.getInventoryValuation(merchantId);

      // Get COGS for the period
      const [year, month] = period.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0); // Last day of month

      const cogs = await this.calculateCOGS(merchantId, startDate, endDate);

      // Get previous month ending inventory
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      const prevPeriod = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;

      // Calculate adjustments
      const adjustments = [
        {
          account: INVENTORY_ACCOUNTS.COGS,
          amount: cogs.totals.totalCOGS,
          type: 'debit' as const,
          description: `COGS for ${period}`,
        },
        {
          account: INVENTORY_ACCOUNTS.INVENTORY_ASSET,
          amount: valuation.totalCost,
          type: 'debit' as const,
          description: `Ending inventory for ${period}`,
        },
        {
          account: INVENTORY_ACCOUNTS.PURCHASES,
          amount: 0, // Would need to calculate purchases
          type: 'credit' as const,
          description: `Purchases for ${period}`,
        },
      ];

      return {
        success: true,
        adjustments,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate period-end adjustment',
      };
    }
  }

  /**
   * Determine entry type from reference type
   */
  private static determineEntryType(referenceType: string): InventoryJournalEntry['type'] {
    if (referenceType.includes('grn') || referenceType.includes('purchase')) return 'purchase';
    if (referenceType.includes('sale')) return 'sale';
    if (referenceType.includes('transfer')) return 'transfer';
    if (referenceType.includes('stocktake')) return 'stocktake';
    if (referenceType.includes('write_off') || referenceType.includes('adjustment')) return 'write_off';
    return 'adjustment';
  }
}

export default InventoryAccountingService;
