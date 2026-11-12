/**
 * Weighted Average Cost Service
 * 
 * Calculates and updates weighted average cost for products:
 * - New cost = (existingQty × oldCost + newQty × newCost) / (existingQty + newQty)
 * - Updates on every GRN completion
 * - Maintains cost history
 */

import { db } from '@/lib/db';

export interface WeightedAverageCostResult {
  previousCost: number;
  newCost: number;
  previousQty: number;
  addedQty: number;
  totalQty: number;
  costChange: number;
  costChangePercent: number;
}

export interface CostHistoryEntry {
  date: Date;
  type: 'grn' | 'adjustment' | 'transfer';
  referenceId: string;
  referenceNumber: string;
  previousCost: number;
  newCost: number;
  quantity: number;
  value: number;
  performedByName: string;
}

/**
 * Weighted Average Cost Service Class
 */
export class WeightedAverageCostService {
  /**
   * Calculate weighted average cost
   * Formula: newCost = (existingQty × oldCost + newQty × newCost) / (existingQty + newQty)
   */
  static calculate(
    existingQty: number,
    existingCost: number,
    addedQty: number,
    addedCost: number
  ): WeightedAverageCostResult {
    const totalQty = existingQty + addedQty;
    const totalValue = existingQty * existingCost + addedQty * addedCost;
    const newCost = totalQty > 0 ? totalValue / totalQty : 0;
    const costChange = newCost - existingCost;
    const costChangePercent = existingCost > 0 ? (costChange / existingCost) * 100 : 0;

    return {
      previousCost: existingCost,
      newCost: Math.round(newCost * 100) / 100, // Round to 2 decimal places
      previousQty: existingQty,
      addedQty,
      totalQty,
      costChange: Math.round(costChange * 100) / 100,
      costChangePercent: Math.round(costChangePercent * 100) / 100,
    };
  }

  /**
   * Update product cost after GRN
   */
  static async updateCostOnGRN(
    productId: string,
    addedQty: number,
    addedCost: number,
    grnId: string,
    grnNumber: string,
    performedBy?: string,
    performedByName?: string
  ): Promise<WeightedAverageCostResult> {
    const product = await db.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    const result = this.calculate(
      product.currentStock,
      product.costPrice,
      addedQty,
      addedCost
    );

    // Only update if there's a meaningful cost change
    if (Math.abs(result.costChange) > 0.001) {
      await db.$transaction(async (tx) => {
        // Update product cost
        await tx.product.update({
          where: { id: productId },
          data: {
            costPrice: result.newCost,
            updatedAt: new Date(),
          },
        });

        // Create cost history entry
        await tx.costHistory.create({
          data: {
            productId,
            type: 'grn',
            previousCost: result.previousCost,
            newCost: result.newCost,
            changeAmount: result.costChange,
            changePercent: result.costChangePercent,
            reason: `GRN ${grnNumber}: Added ${addedQty} units at ${addedCost.toFixed(2)} each`,
            changedBy: performedBy,
            changedByName: performedByName,
          },
        });

        // Check for significant cost increase and create alert
        if (result.costChangePercent > 20) {
          await tx.stockAlert.create({
            data: {
              merchantId: product.merchantId,
              branchId: product.branchId || '',
              productId,
              type: 'overstock', // Using closest type available
              severity: result.costChangePercent > 50 ? 'critical' : 'warning',
              message: `${product.name} cost increased by ${result.costChangePercent.toFixed(1)}% (from ${result.previousCost.toFixed(2)} to ${result.newCost.toFixed(2)})`,
              currentValue: result.newCost,
              thresholdValue: result.previousCost,
            },
          });
        }
      });
    }

    return result;
  }

  /**
   * Update product cost after adjustment
   */
  static async updateCostOnAdjustment(
    productId: string,
    newCost: number,
    reason: string,
    performedBy?: string,
    performedByName?: string
  ): Promise<WeightedAverageCostResult> {
    const product = await db.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    const result: WeightedAverageCostResult = {
      previousCost: product.costPrice,
      newCost,
      previousQty: product.currentStock,
      addedQty: 0,
      totalQty: product.currentStock,
      costChange: newCost - product.costPrice,
      costChangePercent: product.costPrice > 0 
        ? ((newCost - product.costPrice) / product.costPrice) * 100 
        : 0,
    };

    await db.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productId },
        data: {
          costPrice: newCost,
          updatedAt: new Date(),
        },
      });

      await tx.costHistory.create({
        data: {
          productId,
          type: 'adjustment',
          previousCost: result.previousCost,
          newCost,
          changeAmount: result.costChange,
          changePercent: result.costChangePercent,
          reason,
          changedBy: performedBy,
          changedByName: performedByName,
        },
      });
    });

    return result;
  }

  /**
   * Get cost history for a product
   */
  static async getCostHistory(
    productId: string,
    options?: {
      limit?: number;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<CostHistoryEntry[]> {
    const where: {
      productId: string;
      createdAt?: { gte?: Date; lte?: Date };
    } = { productId };

    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = options.startDate;
      if (options.endDate) where.createdAt.lte = options.endDate;
    }

    const history = await db.costHistory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
    });

    return history.map((entry) => ({
      date: entry.createdAt,
      type: entry.type as 'grn' | 'adjustment' | 'transfer',
      referenceId: entry.id,
      referenceNumber: entry.type.toUpperCase(),
      previousCost: entry.previousCost,
      newCost: entry.newCost,
      quantity: 0,
      value: entry.changeAmount,
      performedByName: entry.changedByName || '',
    }));
  }

  /**
   * Calculate cost impact for inventory valuation
   */
  static async calculateInventoryValue(
    merchantId: string,
    branchId?: string
  ): Promise<{
    totalValue: number;
    totalUnits: number;
    averageCost: number;
    productCount: number;
    byCategory: Array<{ categoryName: string; totalValue: number; totalUnits: number }>;
  }> {
    const where: {
      merchantId: string;
      branchId?: string;
      isActive: boolean;
      trackInventory: boolean;
    } = {
      merchantId,
      isActive: true,
      trackInventory: true,
    };

    if (branchId) {
      where.branchId = branchId;
    }

    const products = await db.product.findMany({
      where,
      include: {
        category: {
          select: { name: true },
        },
      },
    });

    const totalValue = products.reduce((sum, p) => sum + p.currentStock * p.costPrice, 0);
    const totalUnits = products.reduce((sum, p) => sum + p.currentStock, 0);

    // Group by category
    const categoryMap = new Map<string, { totalValue: number; totalUnits: number }>();
    for (const product of products) {
      const categoryName = product.category?.name || 'Uncategorized';
      const existing = categoryMap.get(categoryName) || { totalValue: 0, totalUnits: 0 };
      existing.totalValue += product.currentStock * product.costPrice;
      existing.totalUnits += product.currentStock;
      categoryMap.set(categoryName, existing);
    }

    const byCategory = Array.from(categoryMap.entries())
      .map(([categoryName, data]) => ({
        categoryName,
        totalValue: data.totalValue,
        totalUnits: data.totalUnits,
      }))
      .sort((a, b) => b.totalValue - a.totalValue);

    return {
      totalValue,
      totalUnits,
      averageCost: totalUnits > 0 ? totalValue / totalUnits : 0,
      productCount: products.length,
      byCategory,
    };
  }

  /**
   * Recalculate weighted average from all batches
   */
  static async recalculateFromBatches(productId: string): Promise<WeightedAverageCostResult> {
    const batches = await db.inventoryBatch.findMany({
      where: {
        productId,
        status: 'active',
        currentQty: { gt: 0 },
      },
    });

    const product = await db.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    let totalQty = 0;
    let totalValue = 0;

    for (const batch of batches) {
      totalQty += batch.currentQty;
      totalValue += batch.currentQty * batch.unitCost;
    }

    const newCost = totalQty > 0 ? totalValue / totalQty : product.costPrice;

    return {
      previousCost: product.costPrice,
      newCost: Math.round(newCost * 100) / 100,
      previousQty: product.currentStock,
      addedQty: totalQty - product.currentStock,
      totalQty,
      costChange: Math.round((newCost - product.costPrice) * 100) / 100,
      costChangePercent: product.costPrice > 0 
        ? Math.round(((newCost - product.costPrice) / product.costPrice * 100) * 100) / 100 
        : 0,
    };
  }
}

export default WeightedAverageCostService;
