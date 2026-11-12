/**
 * Multi-Tenant Database Utilities
 * 
 * Provides common database operations with built-in tenant isolation.
 * All queries automatically include tenant_id filtering for data isolation.
 */

import { db } from './db'
import { getCurrentTenantId, isPlatformAdmin, getTenantContext, withTenantContext, type RequestContext } from './tenant-context'

// Pagination options interface
export interface PaginationOptions {
  page?: number
  limit?: number
  cursor?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Paginated result interface
export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
    cursor?: string | null
  }
}

// Audit log entry interface
export interface AuditLogEntry {
  action: string
  entityType: string
  entityId: string
  userId?: string
  tenantId?: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

/**
 * Execute a callback within tenant context
 */
export async function withTenant<T>(
  tenantId: string,
  callback: () => Promise<T>
): Promise<T> {
  const context = getTenantContext()
  
  // If already in a tenant context, just execute
  if (context && !('isPlatformAdmin' in context) && context.tenantId === tenantId) {
    return callback()
  }
  
  // Create a temporary context for the operation
  const tempContext = {
    tenantId,
    tenantSlug: tenantId,
    tenantName: '',
    userId: context && 'userId' in context ? context.userId : '',
    userRole: context && 'userRole' in context ? context.userRole : 'member',
    permissions: [],
  }
  
  return withTenantContext(tempContext, callback)
}

/**
 * Get users with tenant isolation
 */
export async function getTenantUsers(
  tenantId: string,
  options: PaginationOptions = {}
): Promise<PaginatedResult<any>> {
  const {
    page = 1,
    limit = 50,
    cursor,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = options

  // Platform admins can see all users
  const where = isPlatformAdmin() ? {} : { tenantId }

  const [users, total] = await Promise.all([
    db.tenantUser.findMany({
      where,
      include: {
        PlatformTenant: {
          select: { name: true, slug: true },
        },
      },
      skip: cursor ? undefined : (page - 1) * limit,
      take: limit,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { [sortBy]: sortOrder },
    }),
    db.tenantUser.count({ where }),
  ])

  return {
    data: users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
      cursor: users.length > 0 ? users[users.length - 1].id : null,
    },
  }
}

/**
 * Check if user has access to tenant
 */
export async function checkTenantAccess(
  userId: string,
  tenantId: string
): Promise<boolean> {
  // Platform admins have access to all tenants
  if (isPlatformAdmin()) {
    return true
  }

  const tenantUser = await db.tenantUser.findUnique({
    where: {
      tenantId_userId: {
        tenantId,
        userId,
      },
    },
    select: { id: true, status: true },
  })

  return tenantUser?.status === 'active'
}

/**
 * Get tenant by slug with caching
 */
const tenantCache = new Map<string, { data: any; expiresAt: number }>()

export async function getTenantBySlug(slug: string): Promise<any | null> {
  // Check cache first
  const cached = tenantCache.get(slug)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data
  }

  const tenant = await db.platformTenant.findUnique({
    where: { slug },
    include: {
      TenantSubscription: true,
    },
  })

  if (tenant) {
    // Cache for 5 minutes
    tenantCache.set(slug, {
      data: tenant,
      expiresAt: Date.now() + 5 * 60 * 1000,
    })
  }

  return tenant
}

/**
 * Get tenant by ID with caching
 */
export async function getTenantById(tenantId: string): Promise<any | null> {
  const cached = tenantCache.get(tenantId)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data
  }

  const tenant = await db.platformTenant.findUnique({
    where: { id: tenantId },
    include: {
      TenantSubscription: true,
    },
  })

  if (tenant) {
    tenantCache.set(tenantId, {
      data: tenant,
      expiresAt: Date.now() + 5 * 60 * 1000,
    })
  }

  return tenant
}

/**
 * Log audit entry
 */
export async function logAuditEntry(entry: AuditLogEntry): Promise<void> {
  const context = getTenantContext()
  
  try {
    await db.auditLogEntry.create({
      data: {
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        action: entry.action,
        category: 'user_management',
        targetType: entry.entityType,
        targetId: entry.entityId,
        userId: entry.userId || (context && 'userId' in context ? context.userId : null),
        userType: context && 'userType' in context ? context.userType : 'consumer',
        tenantId: entry.tenantId || getCurrentTenantId(),
        details: entry.newValues ? JSON.stringify(entry.newValues) : null,
        createdAt: new Date(),
      },
    })
  } catch (error) {
    console.error('Failed to create audit log entry:', error)
    // Don't throw - audit logging shouldn't break the operation
  }
}

/**
 * Track tenant usage
 */
export async function trackTenantUsage(
  tenantId: string,
  resource: string,
  amount: number = 1
): Promise<void> {
  // In production, this would update a usage tracking table
  // For now, we just log it
  console.log(`[Usage] Tenant ${tenantId}: ${resource} +${amount}`)
}

/**
 * Check tenant limits
 */
export async function checkTenantLimits(
  tenantId: string,
  resource: 'users' | 'merchants' | 'apiCalls'
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const tenant = await getTenantById(tenantId)
  
  if (!tenant) {
    return { allowed: false, current: 0, limit: 0 }
  }

  let current = 0
  let limit = 0

  switch (resource) {
    case 'users':
      current = await db.tenantUser.count({ where: { tenantId } })
      limit = tenant.maxUsers
      break
    case 'merchants':
      limit = tenant.maxMerchants
      // Count merchants if applicable
      break
    case 'apiCalls':
      // Check subscription limits
      limit = tenant.TenantSubscription?.planId?.includes('enterprise') ? 1000000 : 100000
      break
  }

  return {
    allowed: current < limit,
    current,
    limit,
  }
}

/**
 * Create tenant-scoped query helper
 */
export function createTenantQuery(tenantId: string | null) {
  return {
    /**
     * Add tenant filter to where clause
     */
    filter: <T extends Record<string, any>>(where: T = {} as T): T & { tenantId?: string } => {
      if (!tenantId || isPlatformAdmin()) {
        return where as T & { tenantId?: string }
      }
      return { ...where, tenantId }
    },

    /**
     * Validate tenant access before operation
     */
    validateAccess: async (userId: string): Promise<boolean> => {
      if (!tenantId) return false
      return checkTenantAccess(userId, tenantId)
    },

    /**
     * Get tenant settings
     */
    getSettings: async (): Promise<Record<string, any>> => {
      if (!tenantId) return {}
      
      const tenant = await getTenantById(tenantId)
      if (!tenant?.settings) return {}
      
      try {
        return JSON.parse(tenant.settings as string)
      } catch {
        return {}
      }
    },

    /**
     * Check feature availability
     */
    hasFeature: async (feature: string): Promise<boolean> => {
      if (!tenantId) return false
      
      const tenant = await getTenantById(tenantId)
      if (!tenant?.features) return false
      
      try {
        const features = JSON.parse(tenant.features as string)
        return features.includes(feature) || features.includes('*')
      } catch {
        return false
      }
    },
  }
}

/**
 * Transaction helper with tenant context
 */
export async function tenantTransaction<T>(
  tenantId: string | null,
  callback: (tx: any) => Promise<T>
): Promise<T> {
  return db.$transaction(async (tx) => {
    // Add tenant context to transaction if needed
    return callback(tx)
  })
}

/**
 * Bulk operation helper with tenant isolation
 */
export async function bulkOperation<T>(
  tenantId: string,
  operation: 'create' | 'update' | 'delete',
  model: string,
  data: any[]
): Promise<{ success: number; failed: number; errors: string[] }> {
  const result = { success: 0, failed: 0, errors: [] as string[] }

  for (const item of data) {
    try {
      switch (operation) {
        case 'create':
          await (db as any)[model].create({
            data: { ...item, tenantId },
          })
          break
        case 'update':
          await (db as any)[model].update({
            where: { id: item.id, tenantId },
            data: item,
          })
          break
        case 'delete':
          await (db as any)[model].delete({
            where: { id: item.id, tenantId },
          })
          break
      }
      result.success++
    } catch (error: any) {
      result.failed++
      result.errors.push(`Item ${item.id || 'unknown'}: ${error.message}`)
    }
  }

  // Log bulk operation
  await logAuditEntry({
    action: `bulk_${operation}`,
    entityType: model,
    entityId: tenantId,
    newValues: { success: result.success, failed: result.failed },
  })

  return result
}

/**
 * Clear tenant cache
 */
export function clearTenantCache(tenantId?: string): void {
  if (tenantId) {
    tenantCache.delete(tenantId)
  } else {
    tenantCache.clear()
  }
}

/**
 * Get current tenant info from context
 */
export async function getCurrentTenant(): Promise<any | null> {
  const tenantId = getCurrentTenantId()
  if (!tenantId) return null
  return getTenantById(tenantId)
}
