/**
 * Multi-Tenant Context Management
 * 
 * Provides tenant isolation and context management for the platform.
 * Supports tenant extraction from subdomains, headers, and JWT tokens.
 */

import { AsyncLocalStorage } from 'async_hooks'

// Tenant context interface
export interface TenantContext {
  tenantId: string
  tenantSlug: string
  tenantName: string
  userId: string
  userRole: string
  permissions: string[]
  features?: string[]
  settings?: Record<string, unknown>
}

// Platform admin context (can access all tenants)
export interface PlatformAdminContext {
  adminId: string
  adminEmail: string
  adminRole: string
  permissions: string[]
  isPlatformAdmin: true
}

// Combined context type
export type RequestContext = TenantContext | PlatformAdminContext | null

// AsyncLocalStorage for tenant context
const tenantStorage = new AsyncLocalStorage<RequestContext>()

// Rate limit tracking per tenant
const tenantRateLimits = new Map<string, { count: number; resetAt: number }>()

// Default rate limits per tenant
const DEFAULT_RATE_LIMITS = {
  requestsPerMinute: 100,
  requestsPerHour: 1000,
}

/**
 * Extract tenant context from a request
 * Priority: X-Tenant-ID header > Subdomain > JWT token claims
 */
export function getTenantFromRequest(request: Request): RequestContext | null {
  // 1. Check for X-Tenant-ID header (for API calls)
  const tenantHeader = request.headers.get('X-Tenant-ID')
  const userId = request.headers.get('X-User-ID')
  const userRole = request.headers.get('X-User-Role')
  
  if (tenantHeader && userId) {
    return {
      tenantId: tenantHeader,
      tenantSlug: tenantHeader,
      tenantName: '', // Will be populated from DB if needed
      userId,
      userRole: userRole || 'member',
      permissions: parsePermissionsHeader(request.headers.get('X-Permissions')),
    }
  }

  // 2. Check for subdomain (tenantSlug.platform.com)
  const host = request.headers.get('host') || ''
  const subdomain = extractSubdomain(host)
  
  if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
    return {
      tenantId: '', // Will be resolved from slug
      tenantSlug: subdomain,
      tenantName: '',
      userId: userId || '',
      userRole: userRole || 'member',
      permissions: parsePermissionsHeader(request.headers.get('X-Permissions')),
    }
  }

  // 3. Check for platform admin token
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    // Token parsing would be done here in production
    // For now, we return null and let auth middleware handle it
  }

  return null
}

/**
 * Set tenant context for the current request
 */
export function setTenantContext(context: RequestContext): void {
  // This is handled by the AsyncLocalStorage run method
  // The context is passed to the run callback
}

/**
 * Get current tenant context from AsyncLocalStorage
 */
export function getTenantContext(): RequestContext {
  return tenantStorage.getStore() ?? null
}

/**
 * Get tenant ID from current context
 */
export function getCurrentTenantId(): string | null {
  const context = getTenantContext()
  if (!context) return null
  if ('isPlatformAdmin' in context) return null
  return context.tenantId
}

/**
 * Check if current context is platform admin
 */
export function isPlatformAdmin(): boolean {
  const context = getTenantContext()
  return context !== null && 'isPlatformAdmin' in context
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(permission: string): boolean {
  const context = getTenantContext()
  if (!context) return false
  
  // Platform admins have all permissions
  if ('isPlatformAdmin' in context) return true
  
  return context.permissions.includes(permission) || 
         context.permissions.includes('*')
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(permissions: string[]): boolean {
  return permissions.some(hasPermission)
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(permissions: string[]): boolean {
  return permissions.every(hasPermission)
}

/**
 * Execute a callback with tenant context
 */
export async function withTenantContext<T>(
  context: RequestContext,
  callback: () => Promise<T>
): Promise<T> {
  return tenantStorage.run(context, callback)
}

/**
 * Check rate limit for tenant
 */
export function checkTenantRateLimit(
  tenantId: string, 
  limits = DEFAULT_RATE_LIMITS
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const minuteKey = `${tenantId}:minute`
  
  let rateLimit = tenantRateLimits.get(minuteKey)
  
  if (!rateLimit || rateLimit.resetAt < now) {
    rateLimit = { count: 0, resetAt: now + 60000 }
    tenantRateLimits.set(minuteKey, rateLimit)
  }
  
  const remaining = Math.max(0, limits.requestsPerMinute - rateLimit.count)
  
  if (rateLimit.count >= limits.requestsPerMinute) {
    return { allowed: false, remaining: 0, resetAt: rateLimit.resetAt }
  }
  
  rateLimit.count++
  
  return { allowed: true, remaining: remaining - 1, resetAt: rateLimit.resetAt }
}

/**
 * Validate tenant access for a user
 */
export async function validateTenantAccess(
  userId: string, 
  tenantId: string
): Promise<boolean> {
  // This would typically query the database
  // For now, we return true if both values are present
  return Boolean(userId && tenantId)
}

/**
 * Extract subdomain from host
 */
function extractSubdomain(host: string): string | null {
  // Remove port if present
  const hostname = host.split(':')[0]
  
  // Check for localhost development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return null
  }
  
  // Split by dots
  const parts = hostname.split('.')
  
  // If we have at least 3 parts (subdomain.domain.tld)
  if (parts.length >= 3) {
    return parts[0]
  }
  
  return null
}

/**
 * Parse permissions from header
 */
function parsePermissionsHeader(header: string | null): string[] {
  if (!header) return []
  try {
    const parsed = JSON.parse(header)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return header.split(',').map(p => p.trim()).filter(Boolean)
  }
}

/**
 * Tenant feature flags
 */
export const TENANT_FEATURES = {
  MERCHANT_OS: 'merchant_os',
  GOPAY: 'gopay',
  GROSELL: 'grosell',
  CONSUMER_WALLET: 'consumer_wallet',
  MULTI_LOCATION: 'multi_location',
  ADVANCED_REPORTING: 'advanced_reporting',
  API_ACCESS: 'api_access',
  WEBHOOKS: 'webhooks',
  WHITE_LABEL: 'white_label',
  SSO: 'sso',
  AUDIT_LOGS: 'audit_logs',
  CUSTOM_ROLES: 'custom_roles',
} as const

export type TenantFeature = typeof TENANT_FEATURES[keyof typeof TENANT_FEATURES]

/**
 * Check if tenant has a feature enabled
 */
export function hasFeature(feature: TenantFeature): boolean {
  const context = getTenantContext()
  if (!context) return false
  
  // Platform admins have all features
  if ('isPlatformAdmin' in context) return true
  
  return context.features?.includes(feature) ?? false
}

/**
 * Get tenant setting
 */
export function getTenantSetting<T = unknown>(key: string, defaultValue: T): T {
  const context = getTenantContext()
  if (!context || 'isPlatformAdmin' in context) return defaultValue
  
  return (context.settings?.[key] as T) ?? defaultValue
}

/**
 * Create a platform admin context
 */
export function createPlatformAdminContext(
  adminId: string,
  adminEmail: string,
  adminRole: string = 'super_admin'
): PlatformAdminContext {
  return {
    adminId,
    adminEmail,
    adminRole,
    permissions: ['*'],
    isPlatformAdmin: true,
  }
}

/**
 * Create a tenant context from database data
 */
export function createTenantContext(
  tenantId: string,
  tenantSlug: string,
  tenantName: string,
  userId: string,
  userRole: string,
  permissions: string[],
  features?: string[],
  settings?: Record<string, unknown>
): TenantContext {
  return {
    tenantId,
    tenantSlug,
    tenantName,
    userId,
    userRole,
    permissions,
    features,
    settings,
  }
}

/**
 * Tenant context middleware helper
 */
export function tenantContextMiddleware(
  request: Request,
  next: () => Promise<Response>
): Promise<Response> {
  const context = getTenantFromRequest(request)
  
  if (!context) {
    return next()
  }
  
  return withTenantContext(context, next)
}

/**
 * Export the tenant storage for advanced use cases
 */
export { tenantStorage }
