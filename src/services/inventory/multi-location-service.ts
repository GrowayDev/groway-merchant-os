/**
 * Multi-Location Inventory Service
 * 
 * Handles inventory management across multiple locations:
 * 1. Location-based stock queries
 * 2. Transfer request workflow
 * 3. In-transit tracking
 * 4. Consolidated inventory view
 */

import { db } from '@/lib/db';
import { FIFOService } from './fifo-service';

// Types
export interface LocationStock {
  locationId: string;
  locationName: string;
  locationType: string;
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  inTransitQty: number;
  batches: Array<{
    id: string;
    batchNumber: string;
    currentQty: number;
    expiryDate: Date | null;
    status: string;
  }>;
}

export interface TransferRequest {
  id: string;
  number: string;
  sourceLocationId: string;
  sourceLocationName: string;
  destLocationId: string;
  destLocationName: string;
  status: 'draft' | 'pending' | 'approved' | 'in_transit' | 'received' | 'cancelled' | 'partial';
  items: Array<{
    productId: string;
    productName: string;
    sku: string;
    requestedQty: number;
    shippedQty: number;
    receivedQty: number;
    batchId?: string;
    batchNumber?: string;
  }>;
  requestedBy?: string;
  requestedByName?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: Date;
  shippedAt?: Date;
  receivedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsolidatedInventory {
  productId: string;
  productName: string;
  sku: string;
  totalStock: number;
  totalReserved: number;
  totalAvailable: number;
  totalInTransit: number;
  totalValue: number;
  locations: Array<{
    locationId: string;
    locationName: string;
    stock: number;
    reserved: number;
    available: number;
    value: number;
  }>;
}

/**
 * Multi-Location Inventory Service Class
 */
export class MultiLocationService {
  /**
   * Get stock levels for a product across all locations
   */
  static async getProductStockByLocation(
    merchantId: string,
    productId: string
  ): Promise<LocationStock[]> {
    // Get all branches for the merchant
    const branches = await db.branch.findMany({
      where: {
        merchantId,
        isActive: true,
      },
    });

    const results: LocationStock[] = [];

    for (const branch of branches) {
      // Get batches for this product at this location
      const batches = await db.inventoryBatch.findMany({
        where: {
          merchantId,
          branchId: branch.id,
          productId,
          status: { not: 'depleted' },
        },
        select: {
          id: true,
          batchNumber: true,
          currentQty: true,
          reservedQty: true,
          availableQty: true,
          expiryDate: true,
          status: true,
        },
      });

      const currentStock = batches.reduce((sum, b) => sum + b.currentQty, 0);
      const reservedStock = batches.reduce((sum, b) => sum + b.reservedQty, 0);
      const availableStock = batches.reduce((sum, b) => sum + b.availableQty, 0);

      // Get in-transit quantity
      const inTransitMovements = await db.stockMovement.findMany({
        where: {
          merchantId,
          productId,
          sourceLocationId: branch.id,
          type: 'transfer_out',
          referenceType: 'transfer',
        },
      });

      const inTransitQty = inTransitMovements.reduce((sum, m) => sum + m.quantity, 0);

      const product = await db.product.findUnique({
        where: { id: productId },
        select: { name: true, sku: true },
      });

      if (currentStock > 0 || inTransitQty > 0) {
        results.push({
          locationId: branch.id,
          locationName: branch.name,
          locationType: branch.type,
          productId,
          productName: product?.name || '',
          sku: product?.sku || '',
          currentStock,
          reservedStock,
          availableStock,
          inTransitQty,
          batches: batches.map((b) => ({
            id: b.id,
            batchNumber: b.batchNumber,
            currentQty: b.currentQty,
            expiryDate: b.expiryDate,
            status: b.status,
          })),
        });
      }
    }

    return results;
  }

  /**
   * Get all inventory for a specific location
   */
  static async getLocationInventory(
    merchantId: string,
    branchId: string,
    options?: {
      categoryId?: string;
      lowStockOnly?: boolean;
      search?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{
    items: LocationStock[];
    total: number;
    stats: {
      totalProducts: number;
      totalStockValue: number;
      lowStockCount: number;
      outOfStockCount: number;
    };
  }> {
    const page = options?.page || 1;
    const limit = options?.limit || 50;
    const skip = (page - 1) * limit;

    // Build where clause for products
    const productWhere: any = {
      merchantId,
      trackInventory: true,
      isActive: true,
    };

    if (options?.categoryId) {
      productWhere.categoryId = options.categoryId;
    }

    if (options?.search) {
      productWhere.OR = [
        { name: { contains: options.search } },
        { sku: { contains: options.search } },
      ];
    }

    // Get products
    const products = await db.product.findMany({
      where: productWhere,
      select: {
        id: true,
        name: true,
        sku: true,
        lowStockThreshold: true,
      },
      skip,
      take: limit,
    });

    const branch = await db.branch.findUnique({
      where: { id: branchId },
      select: { id: true, name: true, type: true },
    });

    const items: LocationStock[] = [];
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalStockValue = 0;

    for (const product of products) {
      const batches = await db.inventoryBatch.findMany({
        where: {
          merchantId,
          branchId,
          productId: product.id,
          status: { not: 'depleted' },
        },
        select: {
          id: true,
          batchNumber: true,
          currentQty: true,
          reservedQty: true,
          availableQty: true,
          unitCost: true,
          totalValue: true,
          expiryDate: true,
          status: true,
        },
      });

      const currentStock = batches.reduce((sum, b) => sum + b.currentQty, 0);
      const reservedStock = batches.reduce((sum, b) => sum + b.reservedQty, 0);
      const availableStock = batches.reduce((sum, b) => sum + b.availableQty, 0);
      const stockValue = batches.reduce((sum, b) => sum + (b.totalValue || 0), 0);

      // Filter by low stock if requested
      if (options?.lowStockOnly && currentStock > (product.lowStockThreshold || 10)) {
        continue;
      }

      if (currentStock <= 0) {
        outOfStockCount++;
      } else if (currentStock <= (product.lowStockThreshold || 10)) {
        lowStockCount++;
      }

      totalStockValue += stockValue;

      items.push({
        locationId: branchId,
        locationName: branch?.name || '',
        locationType: branch?.type || 'store',
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        currentStock,
        reservedStock,
        availableStock,
        inTransitQty: 0,
        batches: batches.map((b) => ({
          id: b.id,
          batchNumber: b.batchNumber,
          currentQty: b.currentQty,
          expiryDate: b.expiryDate,
          status: b.status,
        })),
      });
    }

    const totalProducts = await db.product.count({
      where: productWhere,
    });

    return {
      items,
      total: totalProducts,
      stats: {
        totalProducts,
        totalStockValue,
        lowStockCount,
        outOfStockCount,
      },
    };
  }

  /**
   * Get consolidated inventory view across all locations
   */
  static async getConsolidatedInventory(
    merchantId: string,
    options?: {
      categoryId?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{
    items: ConsolidatedInventory[];
    total: number;
  }> {
    const page = options?.page || 1;
    const limit = options?.limit || 50;
    const skip = (page - 1) * limit;

    // Build where clause
    const productWhere: any = {
      merchantId,
      trackInventory: true,
      isActive: true,
    };

    if (options?.categoryId) {
      productWhere.categoryId = options.categoryId;
    }

    if (options?.search) {
      productWhere.OR = [
        { name: { contains: options.search } },
        { sku: { contains: options.search } },
      ];
    }

    // Get products
    const products = await db.product.findMany({
      where: productWhere,
      select: {
        id: true,
        name: true,
        sku: true,
      },
      skip,
      take: limit,
    });

    // Get all branches
    const branches = await db.branch.findMany({
      where: {
        merchantId,
        isActive: true,
      },
      select: { id: true, name: true },
    });

    const items: ConsolidatedInventory[] = [];

    for (const product of products) {
      // Get all batches across all locations
      const batches = await db.inventoryBatch.findMany({
        where: {
          merchantId,
          productId: product.id,
          status: { not: 'depleted' },
        },
        select: {
          branchId: true,
          currentQty: true,
          reservedQty: true,
          availableQty: true,
          totalValue: true,
        },
      });

      // Aggregate by location
      const locationMap = new Map<string, { stock: number; reserved: number; available: number; value: number }>();

      for (const batch of batches) {
        const existing = locationMap.get(batch.branchId) || { stock: 0, reserved: 0, available: 0, value: 0 };
        existing.stock += batch.currentQty;
        existing.reserved += batch.reservedQty;
        existing.available += batch.availableQty;
        existing.value += batch.totalValue || 0;
        locationMap.set(batch.branchId, existing);
      }

      const locations = Array.from(locationMap.entries()).map(([locationId, data]) => {
        const branch = branches.find((b) => b.id === locationId);
        return {
          locationId,
          locationName: branch?.name || 'Unknown',
          stock: data.stock,
          reserved: data.reserved,
          available: data.available,
          value: data.value,
        };
      });

      const totalStock = locations.reduce((sum, l) => sum + l.stock, 0);
      const totalReserved = locations.reduce((sum, l) => sum + l.reserved, 0);
      const totalAvailable = locations.reduce((sum, l) => sum + l.available, 0);
      const totalValue = locations.reduce((sum, l) => sum + l.value, 0);

      // Get in-transit quantity
      const inTransitMovements = await db.stockMovement.findMany({
        where: {
          merchantId,
          productId: product.id,
          type: 'transfer_out',
          referenceType: 'transfer',
        },
      });
      const totalInTransit = inTransitMovements.reduce((sum, m) => sum + m.quantity, 0);

      if (totalStock > 0 || totalInTransit > 0) {
        items.push({
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          totalStock,
          totalReserved,
          totalAvailable,
          totalInTransit,
          totalValue,
          locations,
        });
      }
    }

    const total = await db.product.count({ where: productWhere });

    return { items, total };
  }

  /**
   * Create a stock transfer request
   */
  static async createTransferRequest(options: {
    merchantId: string;
    sourceBranchId: string;
    destBranchId: string;
    items: Array<{
      productId: string;
      quantity: number;
      batchId?: string;
    }>;
    notes?: string;
    performedBy?: string;
    performedByName?: string;
  }): Promise<{
    success: boolean;
    transferId?: string;
    transferNumber?: string;
    error?: string;
  }> {
    const { merchantId, sourceBranchId, destBranchId, items, notes, performedBy, performedByName } = options;

    if (sourceBranchId === destBranchId) {
      return { success: false, error: 'Source and destination cannot be the same' };
    }

    // Generate transfer number
    const count = await db.stockTransfer.count();
    const number = `TRF-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    try {
      const result = await db.$transaction(async (tx) => {
        // Create transfer record
        const transfer = await tx.stockTransfer.create({
          data: {
            merchantId,
            number,
            sourceLocationId: sourceBranchId,
            destLocationId: destBranchId,
            status: 'draft',
            requestedBy: performedBy,
            requestedByName: performedByName,
            notes,
            items: {
              create: items.map((item) => ({
                productId: item.productId,
                requestedQty: item.quantity,
                shippedQty: 0,
                receivedQty: 0,
                batchId: item.batchId,
              })),
            },
          },
          include: {
            items: true,
          },
        });

        return transfer;
      });

      return {
        success: true,
        transferId: result.id,
        transferNumber: result.number,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create transfer',
      };
    }
  }

  /**
   * Approve and ship a transfer
   */
  static async shipTransfer(options: {
    transferId: string;
    merchantId: string;
    items: Array<{
      productId: string;
      quantity: number;
      batchId?: string;
    }>;
    performedBy?: string;
    performedByName?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const { transferId, merchantId, items, performedBy, performedByName } = options;

    try {
      await db.$transaction(async (tx) => {
        const transfer = await tx.stockTransfer.findUnique({
          where: { id: transferId },
          include: { items: true },
        });

        if (!transfer) {
          throw new Error('Transfer not found');
        }

        if (transfer.status !== 'approved' && transfer.status !== 'pending') {
          throw new Error(`Cannot ship transfer with status: ${transfer.status}`);
        }

        // Process each item
        for (const item of items) {
          const transferItem = transfer.items.find((i) => i.productId === item.productId);
          if (!transferItem) continue;

          // Deduct from source location using FIFO
          const fifoResult = await FIFOService.consumeFIFO({
            productId: item.productId,
            branchId: transfer.sourceLocationId,
            merchantId,
            quantity: item.quantity,
            type: 'transfer_out',
            referenceType: 'transfer',
            referenceId: transferId,
            referenceNumber: transfer.number,
            performedBy,
            performedByName,
            idempotencyKey: `transfer-${transferId}-${item.productId}`,
          });

          if (!fifoResult.success) {
            throw new Error(`Failed to deduct stock: ${fifoResult.error}`);
          }

          // Update transfer item
          await tx.stockTransferItem.update({
            where: { id: transferItem.id },
            data: {
              shippedQty: item.quantity,
              batchId: item.batchId || fifoResult.consumptions[0]?.batchId,
            },
          });

          // Create in-transit movement for destination
          await tx.stockMovement.create({
            data: {
              merchantId,
              branchId: transfer.destLocationId,
              productId: item.productId,
              batchId: item.batchId || fifoResult.consumptions[0]?.batchId,
              idempotencyKey: `transfer-in-transit-${transferId}-${item.productId}`,
              type: 'transfer_in',
              direction: 'in',
              quantity: item.quantity,
              previousStock: 0,
              newStock: item.quantity,
              unitCost: fifoResult.averageUnitCost,
              totalCost: fifoResult.totalCost,
              referenceType: 'transfer',
              referenceId: transferId,
              referenceNumber: transfer.number,
              reason: `In transit from ${transfer.number}`,
              performedBy,
              performedByName,
            },
          });
        }

        // Update transfer status
        await tx.stockTransfer.update({
          where: { id: transferId },
          data: {
            status: 'in_transit',
            shippedAt: new Date(),
            shippedBy: performedBy,
            shippedByName: performedByName,
          },
        });
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to ship transfer',
      };
    }
  }

  /**
   * Receive transfer at destination
   */
  static async receiveTransfer(options: {
    transferId: string;
    merchantId: string;
    items: Array<{
      productId: string;
      quantity: number;
      batchId?: string;
      variance?: number;
      varianceReason?: string;
    }>;
    performedBy?: string;
    performedByName?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const { transferId, merchantId, items, performedBy, performedByName } = options;

    try {
      await db.$transaction(async (tx) => {
        const transfer = await tx.stockTransfer.findUnique({
          where: { id: transferId },
          include: { items: true },
        });

        if (!transfer) {
          throw new Error('Transfer not found');
        }

        if (transfer.status !== 'in_transit') {
          throw new Error(`Cannot receive transfer with status: ${transfer.status}`);
        }

        // Process each item
        for (const item of items) {
          const transferItem = transfer.items.find((i) => i.productId === item.productId);
          if (!transferItem) continue;

          // Get in-transit movement
          const inTransitMovement = await tx.stockMovement.findFirst({
            where: {
              referenceId: transferId,
              referenceType: 'transfer',
              productId: item.productId,
              type: 'transfer_in',
              branchId: transfer.destLocationId,
            },
          });

          const unitCost = inTransitMovement?.unitCost || 0;

          // Create batch at destination if batch-tracked
          let batchId = item.batchId;
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (product?.trackInventory && !batchId) {
            // Create new batch at destination
            const batchNumber = `TRF-${transfer.number}-${item.productId.slice(-6)}`;
            const batch = await tx.inventoryBatch.create({
              data: {
                merchantId,
                branchId: transfer.destLocationId,
                productId: item.productId,
                batchNumber,
                initialQty: item.quantity,
                currentQty: item.quantity,
                reservedQty: 0,
                availableQty: item.quantity,
                unitCost,
                totalValue: item.quantity * unitCost,
                status: 'active',
                sourceType: 'transfer',
                sourceId: transferId,
                receivedBy: performedBy,
                receivedByName: performedByName,
              },
            });
            batchId = batch.id;
          } else if (batchId) {
            // Update existing batch
            await tx.inventoryBatch.update({
              where: { id: batchId },
              data: {
                currentQty: { increment: item.quantity },
                availableQty: { increment: item.quantity },
              },
            });
          }

          // Create stock movement for receipt
          const productStock = await tx.product.findUnique({
            where: { id: item.productId },
            select: { currentStock: true },
          });

          const previousStock = productStock?.currentStock || 0;
          const newStock = previousStock + item.quantity;

          await tx.stockMovement.create({
            data: {
              merchantId,
              branchId: transfer.destLocationId,
              productId: item.productId,
              batchId,
              idempotencyKey: `transfer-receive-${transferId}-${item.productId}`,
              type: 'transfer_in',
              direction: 'in',
              quantity: item.quantity,
              previousStock,
              newStock,
              unitCost,
              totalCost: item.quantity * unitCost,
              referenceType: 'transfer',
              referenceId: transferId,
              referenceNumber: transfer.number,
              reason: `Received from ${transfer.number}`,
              performedBy,
              performedByName,
            },
          });

          // Update product stock
          await tx.product.update({
            where: { id: item.productId },
            data: {
              currentStock: { increment: item.quantity },
            },
          });

          // Update transfer item
          await tx.stockTransferItem.update({
            where: { id: transferItem.id },
            data: {
              receivedQty: item.quantity,
              batchId,
            },
          });
        }

        // Update transfer status
        await tx.stockTransfer.update({
          where: { id: transferId },
          data: {
            status: 'received',
            receivedAt: new Date(),
            receivedBy: performedBy,
            receivedByName: performedByName,
          },
        });
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to receive transfer',
      };
    }
  }

  /**
   * Get transfer history
   */
  static async getTransferHistory(
    merchantId: string,
    options?: {
      status?: string;
      branchId?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{
    transfers: TransferRequest[];
    total: number;
  }> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { merchantId };

    if (options?.status && options.status !== 'all') {
      where.status = options.status;
    }

    if (options?.branchId) {
      where.OR = [
        { sourceLocationId: options.branchId },
        { destLocationId: options.branchId },
      ];
    }

    const transfers = await db.stockTransfer.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    const total = await db.stockTransfer.count({ where });

    // Get branch names
    const branchIds = new Set<string>();
    transfers.forEach((t) => {
      branchIds.add(t.sourceLocationId);
      branchIds.add(t.destLocationId);
    });

    const branches = await db.branch.findMany({
      where: { id: { in: Array.from(branchIds) } },
      select: { id: true, name: true },
    });

    const branchMap = new Map(branches.map((b) => [b.id, b.name]));

    const formattedTransfers: TransferRequest[] = transfers.map((t) => ({
      id: t.id,
      number: t.number,
      sourceLocationId: t.sourceLocationId,
      sourceLocationName: branchMap.get(t.sourceLocationId) || 'Unknown',
      destLocationId: t.destLocationId,
      destLocationName: branchMap.get(t.destLocationId) || 'Unknown',
      status: t.status as TransferRequest['status'],
      items: t.items.map((i) => ({
        productId: i.productId,
        productName: i.product?.name || '',
        sku: i.product?.sku || '',
        requestedQty: i.requestedQty,
        shippedQty: i.shippedQty,
        receivedQty: i.receivedQty,
        batchId: i.batchId || undefined,
        batchNumber: undefined,
      })),
      requestedBy: t.requestedBy || undefined,
      requestedByName: t.requestedByName || undefined,
      approvedBy: t.approvedBy || undefined,
      approvedByName: t.approvedByName || undefined,
      approvedAt: t.approvedAt || undefined,
      shippedAt: t.shippedAt || undefined,
      receivedAt: t.receivedAt || undefined,
      notes: t.notes || undefined,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    return { transfers: formattedTransfers, total };
  }
}

export default MultiLocationService;
