/**
 * Audit Logging Library
 * Persistent audit logging for compliance and security
 */

import { db } from './db';
import { headers } from 'next/headers';

// Types
export type AuditAction = 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'login' 
  | 'logout' 
  | 'view' 
  | 'export' 
  | 'print'
  | 'payment'
  | 'refund'
  | 'void'
  | 'adjustment'
  | 'transfer'
  | 'sync'
  | 'api_call';

export type AuditCategory = 
  | 'auth' 
  | 'transaction' 
  | 'user' 
  | 'merchant' 
  | 'payment' 
  | 'compliance'
  | 'inventory'
  | 'report'
  | 'settings'
  | 'integration';

export type ActorType = 'user' | 'merchant' | 'system' | 'api' | 'consumer';

export interface AuditLogInput {
  // Actor
  actorType: ActorType;
  actorId?: string;
  actorName?: string;
  actorEmail?: string;
  
  // Action
  action: AuditAction;
  category: AuditCategory;
  
  // Target
  targetType?: string;
  targetId?: string;
  targetName?: string;
  
  // Details
  description: string;
  metadata?: Record<string, any>;
  
  // Context
  merchantId?: string;
  branchId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  
  // Status
  status?: 'success' | 'failure' | 'pending';
}

/**
 * Log an audit event
 */
export async function logAudit(input: AuditLogInput): Promise<string> {
  // Get request context if available
  let ipAddress = input.ipAddress;
  let userAgent = input.userAgent;
  
  try {
    const headersList = await headers();
    ipAddress = ipAddress || headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || undefined;
    userAgent = userAgent || headersList.get('user-agent') || undefined;
  } catch {
    // Headers not available (e.g., in background tasks)
  }
  
  const audit = await db.systemAuditLog.create({
    data: {
      actorType: input.actorType,
      actorId: input.actorId,
      actorName: input.actorName,
      actorEmail: input.actorEmail,
      action: input.action,
      category: input.category,
      targetType: input.targetType,
      targetId: input.targetId,
      targetName: input.targetName,
      description: input.description,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      merchantId: input.merchantId,
      branchId: input.branchId,
      ipAddress,
      userAgent,
      requestId: input.requestId,
      status: input.status || 'success',
    }
  });
  
  return audit.id;
}

/**
 * Log user login
 */
export async function logUserLogin(
  userId: string,
  userName: string,
  userEmail: string,
  merchantId?: string,
  success: boolean = true
): Promise<string> {
  return logAudit({
    actorType: 'user',
    actorId: userId,
    actorName: userName,
    actorEmail: userEmail,
    action: 'login',
    category: 'auth',
    description: success ? 'User logged in successfully' : 'Failed login attempt',
    merchantId,
    status: success ? 'success' : 'failure',
  });
}

/**
 * Log user logout
 */
export async function logUserLogout(
  userId: string,
  userName: string,
  merchantId?: string
): Promise<string> {
  return logAudit({
    actorType: 'user',
    actorId: userId,
    actorName: userName,
    action: 'logout',
    category: 'auth',
    description: 'User logged out',
    merchantId,
  });
}

/**
 * Log transaction event
 */
export async function logTransaction(
  action: 'create' | 'payment' | 'refund' | 'void',
  transactionId: string,
  transactionNumber: string,
  amount: number,
  merchantId: string,
  branchId?: string,
  actorId?: string,
  actorName?: string,
  metadata?: Record<string, any>
): Promise<string> {
  const actionDescriptions = {
    create: 'Transaction created',
    payment: 'Payment processed',
    refund: 'Refund processed',
    void: 'Transaction voided',
  };
  
  return logAudit({
    actorType: actorId ? 'user' : 'system',
    actorId,
    actorName,
    action,
    category: 'transaction',
    targetType: 'transaction',
    targetId: transactionId,
    targetName: transactionNumber,
    description: `${actionDescriptions[action]}: ${transactionNumber} (R${amount.toFixed(2)})`,
    metadata: { amount, ...metadata },
    merchantId,
    branchId,
  });
}

/**
 * Log inventory adjustment
 */
export async function logInventoryAdjustment(
  productId: string,
  productName: string,
  sku: string,
  quantity: number,
  reason: string,
  merchantId: string,
  branchId?: string,
  actorId?: string,
  actorName?: string
): Promise<string> {
  return logAudit({
    actorType: actorId ? 'user' : 'system',
    actorId,
    actorName,
    action: 'adjustment',
    category: 'inventory',
    targetType: 'product',
    targetId: productId,
    targetName: `${productName} (${sku})`,
    description: `Inventory adjusted by ${quantity > 0 ? '+' : ''}${quantity} - ${reason}`,
    metadata: { sku, quantity, reason },
    merchantId,
    branchId,
  });
}

/**
 * Log payment event
 */
export async function logPayment(
  action: 'payment' | 'refund',
  paymentId: string,
  amount: number,
  method: string,
  status: 'success' | 'failure',
  merchantId: string,
  actorId?: string,
  actorName?: string,
  metadata?: Record<string, any>
): Promise<string> {
  return logAudit({
    actorType: actorId ? 'user' : 'system',
    actorId,
    actorName,
    action,
    category: 'payment',
    targetType: 'payment',
    targetId: paymentId,
    targetName: `${method} payment`,
    description: `${action === 'payment' ? 'Payment' : 'Refund'} of R${amount.toFixed(2)} via ${method} - ${status}`,
    metadata: { amount, method, ...metadata },
    merchantId,
    status,
  });
}

/**
 * Log settings change
 */
export async function logSettingsChange(
  settingType: string,
  settingName: string,
  oldValue: any,
  newValue: any,
  merchantId: string,
  actorId: string,
  actorName: string
): Promise<string> {
  return logAudit({
    actorType: 'user',
    actorId,
    actorName,
    action: 'update',
    category: 'settings',
    targetType: 'setting',
    targetId: settingType,
    targetName: settingName,
    description: `Setting "${settingName}" changed`,
    metadata: { oldValue, newValue },
    merchantId,
  });
}

/**
 * Log data export
 */
export async function logExport(
  exportType: string,
  recordCount: number,
  format: string,
  merchantId: string,
  actorId: string,
  actorName: string
): Promise<string> {
  return logAudit({
    actorType: 'user',
    actorId,
    actorName,
    action: 'export',
    category: 'report',
    targetType: 'export',
    targetName: `${exportType} export`,
    description: `Exported ${recordCount} ${exportType} records as ${format}`,
    metadata: { exportType, recordCount, format },
    merchantId,
  });
}

/**
 * Log API call (for integrations)
 */
export async function logApiCall(
  endpoint: string,
  method: string,
  statusCode: number,
  responseTime: number,
  merchantId?: string,
  apiKey?: string
): Promise<string> {
  return logAudit({
    actorType: 'api',
    actorId: apiKey,
    action: 'api_call',
    category: 'integration',
    targetType: 'api_endpoint',
    targetName: endpoint,
    description: `${method} ${endpoint} - ${statusCode} (${responseTime}ms)`,
    metadata: { method, statusCode, responseTime },
    merchantId,
    status: statusCode < 400 ? 'success' : 'failure',
  });
}

/**
 * Query audit logs
 */
export async function queryAuditLogs(options: {
  merchantId?: string;
  actorId?: string;
  targetType?: string;
  targetId?: string;
  action?: AuditAction;
  category?: AuditCategory;
  status?: 'success' | 'failure' | 'pending';
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}): Promise<{
  logs: any[];
  total: number;
}> {
  const where: any = {};
  
  if (options.merchantId) where.merchantId = options.merchantId;
  if (options.actorId) where.actorId = options.actorId;
  if (options.targetType) where.targetType = options.targetType;
  if (options.targetId) where.targetId = options.targetId;
  if (options.action) where.action = options.action;
  if (options.category) where.category = options.category;
  if (options.status) where.status = options.status;
  
  if (options.startDate || options.endDate) {
    where.createdAt = {};
    if (options.startDate) where.createdAt.gte = options.startDate;
    if (options.endDate) where.createdAt.lte = options.endDate;
  }
  
  const [logs, total] = await Promise.all([
    db.systemAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options.limit || 50,
      skip: options.offset || 0,
    }),
    db.systemAuditLog.count({ where }),
  ]);
  
  // Parse metadata JSON
  const parsedLogs = logs.map(log => ({
    ...log,
    metadata: log.metadata ? JSON.parse(log.metadata) : null,
  }));
  
  return { logs: parsedLogs, total };
}

/**
 * Get audit summary for merchant
 */
export async function getAuditSummary(
  merchantId: string,
  days: number = 30
): Promise<{
  totalActions: number;
  byCategory: Record<string, number>;
  byAction: Record<string, number>;
  byActor: Array<{ actorName: string; count: number }>;
  recentFailures: number;
}> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const logs = await db.systemAuditLog.findMany({
    where: {
      merchantId,
      createdAt: { gte: startDate }
    },
    select: {
      category: true,
      action: true,
      actorName: true,
      status: true,
    }
  });
  
  const byCategory: Record<string, number> = {};
  const byAction: Record<string, number> = {};
  const actorCounts: Record<string, number> = {};
  let recentFailures = 0;
  
  for (const log of logs) {
    byCategory[log.category] = (byCategory[log.category] || 0) + 1;
    byAction[log.action] = (byAction[log.action] || 0) + 1;
    
    if (log.actorName) {
      actorCounts[log.actorName] = (actorCounts[log.actorName] || 0) + 1;
    }
    
    if (log.status === 'failure') {
      recentFailures++;
    }
  }
  
  const byActor = Object.entries(actorCounts)
    .map(([actorName, count]) => ({ actorName, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  return {
    totalActions: logs.length,
    byCategory,
    byAction,
    byActor,
    recentFailures,
  };
}

/**
 * Clean up old audit logs (retention policy)
 */
export async function cleanupOldAuditLogs(
  retentionDays: number = 365
): Promise<{ deleted: number }> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  
  const result = await db.systemAuditLog.deleteMany({
    where: {
      createdAt: { lt: cutoffDate }
    }
  });
  
  return { deleted: result.count };
}

export default {
  logAudit,
  logUserLogin,
  logUserLogout,
  logTransaction,
  logInventoryAdjustment,
  logPayment,
  logSettingsChange,
  logExport,
  logApiCall,
  queryAuditLogs,
  getAuditSummary,
  cleanupOldAuditLogs,
};
