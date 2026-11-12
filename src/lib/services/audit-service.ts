/**
 * Audit Service
 * 
 * Comprehensive audit logging for compliance, security, and debugging.
 * All actions are logged to database for persistent trail.
 */

import { db } from '@/lib/db'

// Types
export type AuditAction = 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'login' 
  | 'logout' 
  | 'view' 
  | 'export' 
  | 'import'
  | 'approve'
  | 'reject'
  | 'refund'
  | 'void'
  | 'adjust'
  | 'transfer'
  | 'print'
  | 'download'

export type AuditEntity = 
  | 'product'
  | 'transaction'
  | 'user'
  | 'customer'
  | 'supplier'
  | 'order'
  | 'invoice'
  | 'payment'
  | 'appointment'
  | 'staff'
  | 'stock'
  | 'price'
  | 'report'
  | 'setting'
  | 'merchant'
  | 'branch'
  | 'rfq'
  | 'purchase_order'
  | 'credit_facility'

export interface AuditContext {
  merchantId?: string
  userId?: string
  ipAddress?: string
  userAgent?: string
  deviceType?: 'web' | 'mobile' | 'pos_terminal' | 'api'
  location?: string
  requestId?: string
  requestMethod?: string
  requestPath?: string
}

export interface AuditPayload {
  action: AuditAction
  entity: AuditEntity
  entityId?: string
  
  oldValue?: Record<string, unknown>
  newValue?: Record<string, unknown>
  changes?: Record<string, { old: unknown; new: unknown }>
  
  context?: AuditContext
  
  status?: 'success' | 'failed' | 'denied'
  errorMessage?: string
  
  metadata?: Record<string, unknown>
}

/**
 * Log an audit event
 */
export async function auditLog(payload: AuditPayload): Promise<string> {
  const {
    action,
    entity,
    entityId,
    oldValue,
    newValue,
    changes,
    context,
    status = 'success',
    errorMessage,
    metadata,
  } = payload
  
  const log = await db.auditLog.create({
    data: {
      merchantId: context?.merchantId,
      userId: context?.userId,
      action,
      entity,
      entityId,
      oldValue: oldValue ? JSON.stringify(oldValue) : null,
      newValue: newValue ? JSON.stringify(newValue) : null,
      changes: changes ? JSON.stringify(changes) : null,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      deviceType: context?.deviceType,
      location: context?.location,
      requestId: context?.requestId,
      requestMethod: context?.requestMethod,
      requestPath: context?.requestPath,
      status,
      errorMessage,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  })
  
  return log.id
}

/**
 * Log a create action
 */
export async function auditCreate(
  entity: AuditEntity,
  entityId: string,
  newValue: Record<string, unknown>,
  context?: AuditContext,
  metadata?: Record<string, unknown>
): Promise<string> {
  return auditLog({
    action: 'create',
    entity,
    entityId,
    newValue,
    context,
    metadata,
  })
}

/**
 * Log an update action with change tracking
 */
export async function auditUpdate(
  entity: AuditEntity,
  entityId: string,
  oldValue: Record<string, unknown>,
  newValue: Record<string, unknown>,
  context?: AuditContext,
  metadata?: Record<string, unknown>
): Promise<string> {
  // Calculate specific changes
  const changes: Record<string, { old: unknown; new: unknown }> = {}
  
  const allKeys = new Set([...Object.keys(oldValue), ...Object.keys(newValue)])
  
  for (const key of allKeys) {
    const oldVal = oldValue[key]
    const newVal = newValue[key]
    
    // Skip if unchanged
    if (JSON.stringify(oldVal) === JSON.stringify(newVal)) continue
    
    changes[key] = { old: oldVal, new: newVal }
  }
  
  return auditLog({
    action: 'update',
    entity,
    entityId,
    oldValue,
    newValue,
    changes,
    context,
    metadata,
  })
}

/**
 * Log a delete action
 */
export async function auditDelete(
  entity: AuditEntity,
  entityId: string,
  oldValue: Record<string, unknown>,
  context?: AuditContext,
  metadata?: Record<string, unknown>
): Promise<string> {
  return auditLog({
    action: 'delete',
    entity,
    entityId,
    oldValue,
    context,
    metadata,
  })
}

/**
 * Log a login action
 */
export async function auditLogin(
  userId: string,
  merchantId: string,
  context?: AuditContext,
  status: 'success' | 'failed' = 'success',
  errorMessage?: string
): Promise<string> {
  return auditLog({
    action: 'login',
    entity: 'user',
    entityId: userId,
    context: { ...context, merchantId, userId },
    status,
    errorMessage,
  })
}

/**
 * Log a logout action
 */
export async function auditLogout(
  userId: string,
  merchantId: string,
  context?: AuditContext
): Promise<string> {
  return auditLog({
    action: 'logout',
    entity: 'user',
    entityId: userId,
    context: { ...context, merchantId, userId },
  })
}

/**
 * Log a view action (for sensitive data)
 */
export async function auditView(
  entity: AuditEntity,
  entityId: string,
  context?: AuditContext,
  metadata?: Record<string, unknown>
): Promise<string> {
  return auditLog({
    action: 'view',
    entity,
    entityId,
    context,
    metadata,
  })
}

/**
 * Log an export action
 */
export async function auditExport(
  entity: AuditEntity,
  recordCount: number,
  format: string,
  context?: AuditContext,
  metadata?: Record<string, unknown>
): Promise<string> {
  return auditLog({
    action: 'export',
    entity,
    context,
    metadata: {
      recordCount,
      format,
      ...metadata,
    },
  })
}

/**
 * Log a refund action
 */
export async function auditRefund(
  entityId: string,
  amount: number,
  reason: string,
  context?: AuditContext
): Promise<string> {
  return auditLog({
    action: 'refund',
    entity: 'transaction',
    entityId,
    context,
    metadata: {
      amount,
      reason,
    },
  })
}

/**
 * Log a void action
 */
export async function auditVoid(
  entity: AuditEntity,
  entityId: string,
  reason: string,
  context?: AuditContext
): Promise<string> {
  return auditLog({
    action: 'void',
    entity,
    entityId,
    context,
    metadata: { reason },
  })
}

/**
 * Log a stock adjustment
 */
export async function auditStockAdjustment(
  productId: string,
  productName: string,
  previousStock: number,
  newStock: number,
  reason: string,
  context?: AuditContext
): Promise<string> {
  return auditLog({
    action: 'adjust',
    entity: 'stock',
    entityId: productId,
    oldValue: { stock: previousStock },
    newValue: { stock: newStock },
    context,
    metadata: {
      productName,
      adjustment: newStock - previousStock,
      reason,
    },
  })
}

/**
 * Get audit trail for an entity
 */
export async function getAuditTrail(
  entity: AuditEntity,
  entityId: string,
  options?: {
    limit?: number
    offset?: number
  }
): Promise<{
  logs: Array<{
    id: string
    action: string
    changes: Record<string, { old: unknown; new: unknown }> | null
    userId: string | null
    createdAt: Date
  }>
  total: number
}> {
  const limit = options?.limit || 50
  const offset = options?.offset || 0
  
  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where: { entity, entityId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        action: true,
        changes: true,
        userId: true,
        createdAt: true,
      },
    }),
    db.auditLog.count({ where: { entity, entityId } }),
  ])
  
  return {
    logs: logs.map(log => ({
      ...log,
      changes: log.changes ? JSON.parse(log.changes) : null,
    })),
    total,
  }
}

/**
 * Get audit logs for a merchant
 */
export async function getMerchantAuditLogs(
  merchantId: string,
  options?: {
    entity?: AuditEntity
    action?: AuditAction
    userId?: string
    startDate?: Date
    endDate?: Date
    limit?: number
    offset?: number
  }
): Promise<{
  logs: Array<{
    id: string
    action: string
    entity: string
    entityId: string | null
    changes: Record<string, { old: unknown; new: unknown }> | null
    userId: string | null
    status: string
    createdAt: Date
  }>
  total: number
}> {
  const limit = options?.limit || 50
  const offset = options?.offset || 0
  
  const where: Record<string, unknown> = { merchantId }
  
  if (options?.entity) where.entity = options.entity
  if (options?.action) where.action = options.action
  if (options?.userId) where.userId = options.userId
  if (options?.startDate || options?.endDate) {
    where.createdAt = {}
    if (options?.startDate) where.createdAt.gte = options.startDate
    if (options?.endDate) where.createdAt.lte = options.endDate
  }
  
  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    db.auditLog.count({ where }),
  ])
  
  return {
    logs: logs.map(log => ({
      ...log,
      changes: log.changes ? JSON.parse(log.changes) : null,
    })),
    total,
  }
}

/**
 * Get user action summary
 */
export async function getUserActionSummary(
  merchantId: string,
  userId: string,
  days: number = 30
): Promise<{
  totalActions: number
  actionsByType: Record<string, number>
  entitiesByType: Record<string, number>
  lastActive: Date | null
}> {
  const since = new Date()
  since.setDate(since.getDate() - days)
  
  const logs = await db.auditLog.findMany({
    where: {
      merchantId,
      userId,
      createdAt: { gte: since },
    },
    select: {
      action: true,
      entity: true,
      createdAt: true,
    },
  })
  
  const actionsByType: Record<string, number> = {}
  const entitiesByType: Record<string, number> = {}
  let lastActive: Date | null = null
  
  for (const log of logs) {
    actionsByType[log.action] = (actionsByType[log.action] || 0) + 1
    entitiesByType[log.entity] = (entitiesByType[log.entity] || 0) + 1
    
    if (!lastActive || log.createdAt > lastActive) {
      lastActive = log.createdAt
    }
  }
  
  return {
    totalActions: logs.length,
    actionsByType,
    entitiesByType,
    lastActive,
  }
}
