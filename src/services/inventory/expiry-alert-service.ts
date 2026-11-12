/**
 * Expiry Alert Service
 * 
 * Monitors batch expiration and generates alerts:
 * - 30 days before expiry (warning)
 * - 14 days before expiry (warning)
 * - 7 days before expiry (critical)
 * - 3 days before expiry (critical)
 * - Already expired (critical)
 */

import { db } from '@/lib/db';

export interface ExpiryAlert {
  id: string;
  type: 'expiring_soon' | 'expired';
  severity: 'info' | 'warning' | 'critical';
  productId: string;
  productName: string;
  productSku: string;
  batchId: string;
  batchNumber: string;
  currentQty: number;
  unitCost: number;
  totalValue: number;
  expiryDate: Date;
  daysUntilExpiry: number;
  branchId: string;
  branchName: string;
  message: string;
  action: string;
}

export interface ExpiryAlertSummary {
  totalAlerts: number;
  criticalCount: number;
  warningCount: number;
  expiredCount: number;
  totalValueAtRisk: number;
  alertsByBranch: Record<string, number>;
}

/**
 * Expiry Alert Service Class
 */
export class ExpiryAlertService {
  // Alert thresholds in days
  static readonly THRESHOLDS = {
    WARNING_30: 30,
    WARNING_14: 14,
    CRITICAL_7: 7,
    CRITICAL_3: 3,
  };

  /**
   * Get all expiry alerts for a merchant
   */
  static async getExpiryAlerts(
    merchantId: string,
    options?: {
      branchId?: string;
      severity?: 'info' | 'warning' | 'critical';
      daysThreshold?: number;
      includeExpired?: boolean;
    }
  ): Promise<ExpiryAlert[]> {
    const now = new Date();
    const thresholdDays = options?.daysThreshold || 30;
    const thresholdDate = new Date(now);
    thresholdDate.setDate(thresholdDate.getDate() + thresholdDays);

    const where: {
      merchantId: string;
      branchId?: string;
      status: string;
      currentQty: { gt: number };
      expiryDate?: { lte?: Date; gte?: Date };
    } = {
      merchantId,
      status: 'active',
      currentQty: { gt: 0 },
    };

    if (options?.branchId) {
      where.branchId = options.branchId;
    }

    if (options?.includeExpired !== false) {
      where.expiryDate = { lte: thresholdDate };
    } else {
      where.expiryDate = { gte: now, lte: thresholdDate };
    }

    const batches = await db.inventoryBatch.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { expiryDate: 'asc' },
    });

    return batches.map((batch) => {
      const daysUntilExpiry = batch.expiryDate
        ? Math.ceil((batch.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      let severity: 'info' | 'warning' | 'critical' = 'info';
      let type: 'expiring_soon' | 'expired' = 'expiring_soon';
      let action = 'Review and consider discounting or returning';

      if (daysUntilExpiry <= 0) {
        severity = 'critical';
        type = 'expired';
        action = 'Remove from sale immediately. Consider disposal or return to supplier.';
      } else if (daysUntilExpiry <= 3) {
        severity = 'critical';
        action = 'URGENT: Discount or donate immediately.';
      } else if (daysUntilExpiry <= 7) {
        severity = 'critical';
        action = 'Apply aggressive discount. Contact food banks for donation.';
      } else if (daysUntilExpiry <= 14) {
        severity = 'warning';
        action = 'Apply discount. Monitor closely.';
      } else if (daysUntilExpiry <= 30) {
        severity = 'warning';
        action = 'Plan promotional pricing.';
      }

      return {
        id: `expiry-${batch.id}`,
        type,
        severity,
        productId: batch.productId,
        productName: batch.product.name,
        productSku: batch.product.sku,
        batchId: batch.id,
        batchNumber: batch.batchNumber,
        currentQty: batch.currentQty,
        unitCost: batch.unitCost,
        totalValue: batch.currentQty * batch.unitCost,
        expiryDate: batch.expiryDate!,
        daysUntilExpiry,
        branchId: batch.branchId,
        branchName: batch.branch.name,
        message: this.generateMessage(batch.product.name, batch.batchNumber, daysUntilExpiry, batch.currentQty),
        action,
      };
    });
  }

  /**
   * Generate expiry alert message
   */
  static generateMessage(
    productName: string,
    batchNumber: string,
    daysUntilExpiry: number,
    quantity: number
  ): string {
    if (daysUntilExpiry <= 0) {
      return `${productName} (Batch ${batchNumber}) has EXPIRED. ${quantity} units need immediate attention.`;
    } else if (daysUntilExpiry === 1) {
      return `${productName} (Batch ${batchNumber}) expires TOMORROW. ${quantity} units at risk.`;
    } else {
      return `${productName} (Batch ${batchNumber}) expires in ${daysUntilExpiry} days. ${quantity} units at risk.`;
    }
  }

  /**
   * Get expiry alert summary
   */
  static async getExpiryAlertSummary(merchantId: string): Promise<ExpiryAlertSummary> {
    const alerts = await this.getExpiryAlerts(merchantId, { daysThreshold: 30 });

    const criticalCount = alerts.filter((a) => a.severity === 'critical' && a.type !== 'expired').length;
    const expiredCount = alerts.filter((a) => a.type === 'expired').length;
    const warningCount = alerts.filter((a) => a.severity === 'warning').length;

    const alertsByBranch: Record<string, number> = {};
    for (const alert of alerts) {
      alertsByBranch[alert.branchName] = (alertsByBranch[alert.branchName] || 0) + 1;
    }

    return {
      totalAlerts: alerts.length,
      criticalCount,
      warningCount,
      expiredCount,
      totalValueAtRisk: alerts.reduce((sum, a) => sum + a.totalValue, 0),
      alertsByBranch,
    };
  }

  /**
   * Quarantine expired batch
   */
  static async quarantineBatch(
    batchId: string,
    reason: string,
    performedBy?: string,
    performedByName?: string
  ): Promise<{ success: boolean; message: string }> {
    const batch = await db.inventoryBatch.findUnique({
      where: { id: batchId },
      include: { product: true },
    });

    if (!batch) {
      return { success: false, message: 'Batch not found' };
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
          reason: `Quarantined: ${reason}`,
          performedBy,
          performedByName,
        },
      });
    });

    return {
      success: true,
      message: `Batch ${batch.batchNumber} has been quarantined`,
    };
  }
}

export default ExpiryAlertService;
