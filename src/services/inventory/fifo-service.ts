/**
 * FIFO Service - First-In-First-Out Inventory Consumption
 * 
 * This service handles batch selection for inventory consumption using FIFO logic:
 * 1. Prioritize batches by expiry date (earliest first) if tracking expiry
 * 2. Then by received date (oldest first) for non-expiring items
 * 3. Support partial consumption across multiple batches
 * 4. Generate stock movements and batch transactions
 */

import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// Types
export interface BatchConsumption {
  batchId: string;
  batchNumber: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  expiryDate?: Date | null;
}

export interface FIFOConsumptionResult {
  success: boolean;
  consumptions: BatchConsumption[];
  totalQuantity: number;
  totalCost: number;
  averageUnitCost: number;
  error?: string;
}

export interface FIFOOptions {
  productId: string;
  branchId: string;
  merchantId: string;
  quantity: number;
  type: 'sale' | 'adjustment' | 'recipe' | 'transfer_out';
  referenceType?: string;
  referenceId?: string;
  referenceNumber?: string;
  performedBy?: string;
  performedByName?: string;
  reason?: string;
  notes?: string;
  idempotencyKey: string;
}

/**
 * FIFO Service Class
 */
export class FIFOService {
  /**
   * Get available batches for a product ordered by FIFO
   */
  static async getAvailableBatches(
    productId: string,
    branchId: string,
    merchantId: string
  ): Promise<Array<{
    id: string;
    batchNumber: string;
    currentQty: number;
    availableQty: number;
    unitCost: number;
    expiryDate: Date | null;
    receivedDate: Date;
    status: string;
  }>> {
    const batches = await db.inventoryBatch.findMany({
      where: {
        productId,
        branchId,
        merchantId,
        status: 'active',
        currentQty: { gt: 0 },
      },
      orderBy: [
        // Primary: Expiry date (earliest first, nulls last)
        { expiryDate: 'asc' },
        // Secondary: Created date (oldest first - FIFO)
        { createdAt: 'asc' },
      ],
    });

    return batches.map((batch) => ({
      id: batch.id,
      batchNumber: batch.batchNumber,
      currentQty: batch.currentQty,
      availableQty: batch.availableQty,
      unitCost: batch.unitCost,
      expiryDate: batch.expiryDate,
      receivedDate: batch.createdAt,
      status: batch.status,
    }));
  }

  /**
   * Calculate FIFO consumption for a quantity
   */
  static async calculateFIFOConsumption(
    productId: string,
    branchId: string,
    merchantId: string,
    quantity: number
  ): Promise<FIFOConsumptionResult> {
    const batches = await this.getAvailableBatches(productId, branchId, merchantId);

    if (batches.length === 0) {
      return {
        success: false,
        consumptions: [],
        totalQuantity: 0,
        totalCost: 0,
        averageUnitCost: 0,
        error: 'No available stock for this product',
      };
    }

    const totalAvailable = batches.reduce((sum, b) => sum + b.availableQty, 0);
    
    if (totalAvailable < quantity) {
      return {
        success: false,
        consumptions: [],
        totalQuantity: totalAvailable,
        totalCost: 0,
        averageUnitCost: 0,
        error: `Insufficient stock. Available: ${totalAvailable}, Requested: ${quantity}`,
      };
    }

    const consumptions: BatchConsumption[] = [];
    let remaining = quantity;

    for (const batch of batches) {
      if (remaining <= 0) break;

      const consumeQty = Math.min(batch.availableQty, remaining);
      consumptions.push({
        batchId: batch.id,
        batchNumber: batch.batchNumber,
        quantity: consumeQty,
        unitCost: batch.unitCost,
        totalCost: consumeQty * batch.unitCost,
        expiryDate: batch.expiryDate,
      });

      remaining -= consumeQty;
    }

    const totalCost = consumptions.reduce((sum, c) => sum + c.totalCost, 0);
    const averageUnitCost = quantity > 0 ? totalCost / quantity : 0;

    return {
      success: true,
      consumptions,
      totalQuantity: quantity,
      totalCost,
      averageUnitCost,
    };
  }

  /**
   * Execute FIFO consumption with stock movement creation
   */
  static async consumeFIFO(options: FIFOOptions): Promise<FIFOConsumptionResult & { movementIds: string[] }> {
    const { productId, branchId, merchantId, quantity, idempotencyKey } = options;

    // Check for duplicate idempotency key
    const existingMovement = await db.stockMovement.findUnique({
      where: { idempotencyKey },
    });

    if (existingMovement) {
      // Return existing consumption data
      const existingBatches = await db.stockMovement.findMany({
        where: {
          referenceId: existingMovement.referenceId,
          referenceType: existingMovement.referenceType,
          productId,
          type: options.type,
        },
      });

      return {
        success: true,
        consumptions: existingBatches.map((m) => ({
          batchId: m.batchId || '',
          batchNumber: '',
          quantity: m.quantity,
          unitCost: m.unitCost,
          totalCost: m.totalCost,
        })),
        totalQuantity: existingMovement.quantity,
        totalCost: existingMovement.totalCost,
        averageUnitCost: existingMovement.unitCost,
        movementIds: [existingMovement.id],
      };
    }

    // Calculate FIFO consumption
    const fifoResult = await this.calculateFIFOConsumption(productId, branchId, merchantId, quantity);

    if (!fifoResult.success) {
      return {
        ...fifoResult,
        movementIds: [],
      };
    }

    // Get current product stock
    const product = await db.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return {
        success: false,
        consumptions: [],
        totalQuantity: 0,
        totalCost: 0,
        averageUnitCost: 0,
        error: 'Product not found',
        movementIds: [],
      };
    }

    const previousStock = product.currentStock;
    const newStock = previousStock - quantity;

    // Execute in transaction
    const result = await db.$transaction(async (tx) => {
      const movementIds: string[] = [];

      // Create stock movements for each batch consumption
      for (const consumption of fifoResult.consumptions) {
        // Get batch before update
        const batch = await tx.inventoryBatch.findUnique({
          where: { id: consumption.batchId },
        });

        if (!batch) continue;

        // Create stock movement
        const movement = await tx.stockMovement.create({
          data: {
            merchantId,
            branchId,
            productId,
            batchId: consumption.batchId,
            idempotencyKey: `${idempotencyKey}-${consumption.batchId}`,
            type: options.type,
            direction: 'out',
            quantity: consumption.quantity,
            previousStock,
            newStock,
            unitCost: consumption.unitCost,
            totalCost: consumption.totalCost,
            referenceType: options.referenceType || 'manual',
            referenceId: options.referenceId || null,
            referenceNumber: options.referenceNumber || null,
            reason: options.reason || null,
            notes: options.notes || null,
            performedBy: options.performedBy || null,
            performedByName: options.performedByName || null,
          },
        });

        movementIds.push(movement.id);

        // Update batch quantities
        const newBatchQty = batch.currentQty - consumption.quantity;
        await tx.inventoryBatch.update({
          where: { id: consumption.batchId },
          data: {
            currentQty: newBatchQty,
            availableQty: newBatchQty - batch.reservedQty,
            status: newBatchQty <= 0 ? 'depleted' : batch.status,
            updatedAt: new Date(),
          },
        });

        // Create batch transaction
        await tx.batchTransaction.create({
          data: {
            batchId: consumption.batchId,
            type: options.type === 'sale' ? 'sold' : 
                  options.type === 'adjustment' ? 'adjusted' : 
                  options.type === 'recipe' ? 'sold' : 'transferred_out',
            quantity: -consumption.quantity, // Negative for consumption
            balanceAfter: newBatchQty,
            unitCost: consumption.unitCost,
            totalCost: consumption.totalCost,
            referenceType: options.referenceType || 'manual',
            referenceId: options.referenceId || null,
            referenceNumber: options.referenceNumber || null,
            performedBy: options.performedBy || null,
            performedByName: options.performedByName || null,
            reason: options.reason || null,
            notes: options.notes || null,
          },
        });
      }

      // Update product stock
      await tx.product.update({
        where: { id: productId },
        data: {
          currentStock: newStock,
          lastSoldAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Create stock alert if low
      if (newStock > 0 && newStock <= product.lowStockThreshold) {
        await tx.stockAlert.upsert({
          where: { id: `low-${productId}` },
          create: {
            id: `low-${productId}`,
            merchantId,
            branchId,
            productId,
            type: 'low_stock',
            severity: 'warning',
            message: `${product.name} is low on stock (${newStock} remaining)`,
            currentValue: newStock,
            thresholdValue: product.lowStockThreshold,
          },
          update: {
            currentValue: newStock,
            message: `${product.name} is low on stock (${newStock} remaining)`,
            status: 'active',
            updatedAt: new Date(),
          },
        });
      }

      // Create out of stock alert
      if (newStock <= 0) {
        await tx.stockAlert.upsert({
          where: { id: `oos-${productId}` },
          create: {
            id: `oos-${productId}`,
            merchantId,
            branchId,
            productId,
            type: 'out_of_stock',
            severity: 'critical',
            message: `${product.name} is out of stock`,
            currentValue: 0,
            thresholdValue: 0,
          },
          update: {
            currentValue: 0,
            message: `${product.name} is out of stock`,
            status: 'active',
            updatedAt: new Date(),
          },
        });
      }

      return movementIds;
    });

    return {
      ...fifoResult,
      movementIds: result,
    };
  }

  /**
   * Get FIFO cost for a product (average of available batches)
   */
  static async getFIFOCost(
    productId: string,
    branchId: string,
    merchantId: string
  ): Promise<number> {
    const batches = await this.getAvailableBatches(productId, branchId, merchantId);
    
    if (batches.length === 0) {
      // Fall back to product cost price
      const product = await db.product.findUnique({
        where: { id: productId },
        select: { costPrice: true },
      });
      return product?.costPrice || 0;
    }

    const totalQty = batches.reduce((sum, b) => sum + b.currentQty, 0);
    const totalValue = batches.reduce((sum, b) => sum + b.currentQty * b.unitCost, 0);

    return totalQty > 0 ? totalValue / totalQty : 0;
  }

  /**
   * Reserve stock from batches (for pending orders)
   */
  static async reserveStock(
    productId: string,
    branchId: string,
    merchantId: string,
    quantity: number,
    referenceType: string,
    referenceId: string
  ): Promise<{ success: boolean; reservationId?: string; error?: string }> {
    const batches = await this.getAvailableBatches(productId, branchId, merchantId);

    const totalAvailable = batches.reduce((sum, b) => sum + b.availableQty, 0);
    
    if (totalAvailable < quantity) {
      return {
        success: false,
        error: `Insufficient stock. Available: ${totalAvailable}, Requested: ${quantity}`,
      };
    }

    const result = await db.$transaction(async (tx) => {
      let remaining = quantity;

      for (const batch of batches) {
        if (remaining <= 0) break;

        const reserveQty = Math.min(batch.availableQty, remaining);
        
        await tx.inventoryBatch.update({
          where: { id: batch.id },
          data: {
            reservedQty: { increment: reserveQty },
            availableQty: { decrement: reserveQty },
          },
        });

        // Create batch transaction for reservation
        await tx.batchTransaction.create({
          data: {
            batchId: batch.id,
            type: 'reserved',
            quantity: reserveQty,
            balanceAfter: batch.currentQty,
            unitCost: batch.unitCost,
            totalCost: reserveQty * batch.unitCost,
            referenceType,
            referenceId,
            reason: 'Stock reserved for pending order',
          },
        });

        remaining -= reserveQty;
      }

      return { success: true, reservationId: referenceId };
    });

    return result;
  }

  /**
   * Release reserved stock (cancel order)
   */
  static async releaseReservation(
    productId: string,
    branchId: string,
    quantity: number,
    referenceType: string,
    referenceId: string
  ): Promise<{ success: boolean }> {
    // Get reserved batches for this reference
    const transactions = await db.batchTransaction.findMany({
      where: {
        referenceType,
        referenceId,
        type: 'reserved',
      },
      include: {
        batch: true,
      },
    });

    await db.$transaction(async (tx) => {
      for (const txn of transactions) {
        await tx.inventoryBatch.update({
          where: { id: txn.batchId },
          data: {
            reservedQty: { decrement: txn.quantity },
            availableQty: { increment: txn.quantity },
          },
        });

        // Create release transaction
        await tx.batchTransaction.create({
          data: {
            batchId: txn.batchId,
            type: 'released',
            quantity: txn.quantity,
            balanceAfter: txn.batch.currentQty,
            unitCost: txn.unitCost,
            totalCost: txn.totalCost,
            referenceType,
            referenceId,
            reason: 'Reservation released',
          },
        });
      }
    });

    return { success: true };
  }
}

export default FIFOService;
