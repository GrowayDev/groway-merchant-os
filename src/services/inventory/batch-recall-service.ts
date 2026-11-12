/**
 * Batch Recall Service
 * 
 * Handles batch quarantine and recall workflows:
 * - Initiate recall for a batch
 * - Block sales of recalled batches
 * - Track recall resolution
 */

import { db } from '@/lib/db';

export type RecallStatus = 'initiated' | 'in_progress' | 'resolved' | 'cleared';
export type QuarantineReason = 'quality_issue' | 'expiry' | 'damage' | 'contamination' | 'regulatory' | 'supplier_recall' | 'other';

export interface BatchRecallResult {
  success: boolean;
  message: string;
  recallId?: string;
  affectedProducts?: number;
  affectedLocations?: number;
}

/**
 * Batch Recall Service Class
 */
export class BatchRecallService {
  /**
   * Quarantine a single batch
   */
  static async quarantineBatch(
    batchId: string,
    reason: QuarantineReason,
    description: string,
    performedBy?: string,
    performedByName?: string
  ): Promise<BatchRecallResult> {
    const batch = await db.inventoryBatch.findUnique({
      where: { id: batchId },
      include: { product: true },
    });

    if (!batch) {
      return { success: false, message: 'Batch not found' };
    }

    if (batch.status === 'quarantined') {
      return { success: false, message: 'Batch is already quarantined' };
    }

    await db.$transaction(async (tx) => {
      await tx.inventoryBatch.update({
        where: { id: batchId },
        data: {
          status: 'quarantined',
          updatedAt: new Date(),
        },
      });

      await tx.batchTransaction.create({
        data: {
          batchId,
          type: 'adjusted',
          quantity: 0,
          balanceAfter: batch.currentQty,
          unitCost: batch.unitCost,
          totalCost: 0,
          reason: `Quarantined (${reason}): ${description}`,
          performedBy,
          performedByName,
        },
      });
    });

    return {
      success: true,
      recallId: `quarantine-${batchId}`,
      message: `Batch ${batch.batchNumber} has been quarantined`,
    };
  }

  /**
   * Initiate a batch recall (all locations)
   */
  static async initiateRecall(request: {
    batchId: string;
    reason: QuarantineReason;
    description: string;
    initiatedBy: string;
    initiatedByName: string;
  }): Promise<BatchRecallResult> {
    const batch = await db.inventoryBatch.findUnique({
      where: { id: request.batchId },
    });

    if (!batch) {
      return { success: false, message: 'Batch not found' };
    }

    if (batch.status === 'recalled') {
      return { success: false, message: 'Batch is already recalled' };
    }

    // Find all instances of this batch number across branches
    const batchInstances = await db.inventoryBatch.findMany({
      where: {
        productId: batch.productId,
        batchNumber: batch.batchNumber,
        status: { notIn: ['depleted', 'recalled'] },
        currentQty: { gt: 0 },
      },
    });

    const result = await db.$transaction(async (tx) => {
      let count = 0;
      for (const instance of batchInstances) {
        await tx.inventoryBatch.update({
          where: { id: instance.id },
          data: {
            status: 'recalled',
            updatedAt: new Date(),
          },
        });

        await tx.batchTransaction.create({
          data: {
            batchId: instance.id,
            type: 'recalled',
            quantity: 0,
            balanceAfter: instance.currentQty,
            unitCost: instance.unitCost,
            totalCost: 0,
            reason: `Recall initiated: ${request.reason} - ${request.description}`,
            performedBy: request.initiatedBy,
            performedByName: request.initiatedByName,
          },
        });
        count++;
      }
      return count;
    });

    return {
      success: true,
      recallId: `recall-${request.batchId}`,
      message: `Recall initiated for batch ${batch.batchNumber} across ${result} locations`,
      affectedProducts: 1,
      affectedLocations: result,
    };
  }

  /**
   * Clear a batch from quarantine or recall
   */
  static async clearBatch(
    batchId: string,
    resolutionNotes: string,
    performedBy?: string,
    performedByName?: string
  ): Promise<BatchRecallResult> {
    const batch = await db.inventoryBatch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      return { success: false, message: 'Batch not found' };
    }

    if (!['quarantined', 'recalled'].includes(batch.status)) {
      return { success: false, message: 'Batch is not in quarantine or recall status' };
    }

    await db.$transaction(async (tx) => {
      await tx.inventoryBatch.update({
        where: { id: batchId },
        data: {
          status: 'active',
          updatedAt: new Date(),
        },
      });

      await tx.batchTransaction.create({
        data: {
          batchId,
          type: 'adjusted',
          quantity: 0,
          balanceAfter: batch.currentQty,
          unitCost: batch.unitCost,
          totalCost: 0,
          reason: `Cleared: ${resolutionNotes}`,
          performedBy,
          performedByName,
        },
      });
    });

    return {
      success: true,
      message: `Batch ${batch.batchNumber} has been cleared and is now active`,
    };
  }

  /**
   * Dispose of a recalled/quarantined batch
   */
  static async disposeBatch(
    batchId: string,
    disposalMethod: 'destroyed' | 'returned' | 'donated' | 'other',
    notes: string,
    performedBy?: string,
    performedByName?: string
  ): Promise<BatchRecallResult> {
    const batch = await db.inventoryBatch.findUnique({
      where: { id: batchId },
      include: { product: true },
    });

    if (!batch) {
      return { success: false, message: 'Batch not found' };
    }

    const quantityDisposed = batch.currentQty;

    await db.$transaction(async (tx) => {
      await tx.inventoryBatch.update({
        where: { id: batchId },
        data: {
          status: 'depleted',
          currentQty: 0,
          availableQty: 0,
          updatedAt: new Date(),
        },
      });

      await tx.batchTransaction.create({
        data: {
          batchId,
          type: 'adjusted',
          quantity: -quantityDisposed,
          balanceAfter: 0,
          unitCost: batch.unitCost,
          totalCost: quantityDisposed * batch.unitCost,
          reason: `Disposed (${disposalMethod}): ${notes}`,
          performedBy,
          performedByName,
        },
      });

      // Update product stock
      await tx.product.update({
        where: { id: batch.productId },
        data: {
          currentStock: { decrement: quantityDisposed },
          updatedAt: new Date(),
        },
      });

      // Create stock movement
      await tx.stockMovement.create({
        data: {
          merchantId: batch.merchantId,
          branchId: batch.branchId,
          productId: batch.productId,
          batchId,
          idempotencyKey: `disposal-${batchId}-${Date.now()}`,
          type: 'waste',
          direction: 'out',
          quantity: quantityDisposed,
          previousStock: batch.product.currentStock,
          newStock: batch.product.currentStock - quantityDisposed,
          unitCost: batch.unitCost,
          totalCost: quantityDisposed * batch.unitCost,
          referenceType: 'disposal',
          reason: `Batch disposed: ${disposalMethod} - ${notes}`,
          performedBy,
          performedByName,
        },
      });
    });

    return {
      success: true,
      message: `Batch ${batch.batchNumber} disposed. ${quantityDisposed} units removed from inventory.`,
    };
  }

  /**
   * Check if a batch can be sold
   */
  static async canSellBatch(batchId: string): Promise<{ canSell: boolean; reason?: string }> {
    const batch = await db.inventoryBatch.findUnique({
      where: { id: batchId },
      select: {
        status: true,
        currentQty: true,
        availableQty: true,
        expiryDate: true,
      },
    });

    if (!batch) {
      return { canSell: false, reason: 'Batch not found' };
    }

    if (batch.status === 'recalled') {
      return { canSell: false, reason: 'Batch is under recall - sale blocked' };
    }

    if (batch.status === 'quarantined') {
      return { canSell: false, reason: 'Batch is quarantined - sale blocked' };
    }

    if (batch.status === 'expired') {
      return { canSell: false, reason: 'Batch has expired - sale blocked' };
    }

    if (batch.currentQty <= 0) {
      return { canSell: false, reason: 'Batch is depleted' };
    }

    if (batch.expiryDate && batch.expiryDate < new Date()) {
      return { canSell: false, reason: 'Batch has expired - sale blocked' };
    }

    return { canSell: true };
  }

  /**
   * Get all recalled/quarantined batches
   */
  static async getRecalledBatches(merchantId: string): Promise<Array<{
    id: string;
    batchNumber: string;
    productName: string;
    status: string;
    currentQty: number;
    totalValue: number;
    reason: string;
    branchName: string;
    createdAt: Date;
  }>> {
    const batches = await db.inventoryBatch.findMany({
      where: {
        merchantId,
        status: { in: ['recalled', 'quarantined'] },
        currentQty: { gt: 0 },
      },
      include: {
        product: { select: { name: true } },
        branch: { select: { name: true } },
        batchTransactions: {
          where: { type: { in: ['recalled', 'adjusted'] } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return batches.map((batch) => ({
      id: batch.id,
      batchNumber: batch.batchNumber,
      productName: batch.product.name,
      status: batch.status,
      currentQty: batch.currentQty,
      totalValue: batch.currentQty * batch.unitCost,
      reason: batch.batchTransactions[0]?.reason || 'Unknown',
      branchName: batch.branch.name,
      createdAt: batch.createdAt,
    }));
  }
}

export default BatchRecallService;
