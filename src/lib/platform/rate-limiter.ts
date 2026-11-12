/**
 * Platform Rate Limiting Service
 * Tenant-aware rate limiting for API protection
 */

// In-memory rate limit store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>()

interface RateLimitEntry {
  count: number
  resetAt: number
  blocked: boolean
  blockedUntil?: number
}

// Rate limit configurations per plan
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  starter: {
    requestsPerMinute: 60,
    requestsPerHour: 1000,
    requestsPerDay: 10000,
    burstLimit: 20,
  },
  professional: {
    requestsPerMinute: 120,
    requestsPerHour: 5000,
    requestsPerDay: 50000,
    burstLimit: 50,
  },
  enterprise: {
    requestsPerMinute: 300,
    requestsPerHour: 20000,
    requestsPerDay: 200000,
    burstLimit: 100,
  },
}

interface RateLimitConfig {
  requestsPerMinute: number
  requestsPerHour: number
  requestsPerDay: number
  burstLimit: number
}

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetAt: number
  retryAfter?: number
}

/**
 * Get rate limit key for tenant and endpoint
 */
function getRateLimitKey(tenantId: string, endpoint: string, window: 'minute' | 'hour' | 'day'): string {
  return `${tenantId}:${endpoint}:${window}`
}

/**
 * Get current time window
 */
function getCurrentWindow(window: 'minute' | 'hour' | 'day'): number {
  const now = Date.now()
  switch (window) {
    case 'minute':
      return Math.floor(now / 60000) * 60000 + 60000
    case 'hour':
      return Math.floor(now / 3600000) * 3600000 + 3600000
    case 'day':
      return Math.floor(now / 86400000) * 86400000 + 86400000
  }
}

/**
 * Check rate limit for tenant
 */
export function checkRateLimit(
  tenantId: string,
  endpoint: string,
  plan: string = 'starter'
): RateLimitResult {
  const config = RATE_LIMITS[plan] || RATE_LIMITS.starter
  
  // Check all windows
  const windows: Array<{ window: 'minute' | 'hour' | 'day'; limit: number }> = [
    { window: 'minute', limit: config.requestsPerMinute },
    { window: 'hour', limit: config.requestsPerHour },
    { window: 'day', limit: config.requestsPerDay },
  ]
  
  const now = Date.now()
  
  for (const { window, limit } of windows) {
    const key = getRateLimitKey(tenantId, endpoint, window)
    const resetAt = getCurrentWindow(window)
    
    let entry = rateLimitStore.get(key)
    
    // Reset if window expired
    if (!entry || entry.resetAt < now) {
      entry = { count: 0, resetAt, blocked: false }
    }
    
    // Check if blocked
    if (entry.blocked && entry.blockedUntil && entry.blockedUntil > now) {
      return {
        allowed: false,
        limit,
        remaining: 0,
        resetAt: entry.blockedUntil,
        retryAfter: Math.ceil((entry.blockedUntil - now) / 1000),
      }
    }
    
    // Check limit
    if (entry.count >= limit) {
      // Block for remainder of window
      entry.blocked = true
      entry.blockedUntil = resetAt
      rateLimitStore.set(key, entry)
      
      return {
        allowed: false,
        limit,
        remaining: 0,
        resetAt,
        retryAfter: Math.ceil((resetAt - now) / 1000),
      }
    }
  }
  
  // All checks passed - increment counters
  for (const { window } of windows) {
    const key = getRateLimitKey(tenantId, endpoint, window)
    const resetAt = getCurrentWindow(window)
    
    const entry = rateLimitStore.get(key) || { count: 0, resetAt, blocked: false }
    
    if (entry.resetAt === resetAt) {
      entry.count++
    } else {
      entry.count = 1
      entry.resetAt = resetAt
      entry.blocked = false
    }
    
    rateLimitStore.set(key, entry)
  }
  
  // Get remaining from minute window
  const minuteKey = getRateLimitKey(tenantId, endpoint, 'minute')
  const minuteEntry = rateLimitStore.get(minuteKey)
  const remaining = Math.max(0, config.requestsPerMinute - (minuteEntry?.count || 0))
  
  return {
    allowed: true,
    limit: config.requestsPerMinute,
    remaining,
    resetAt: getCurrentWindow('minute'),
  }
}

/**
 * Burst rate limiter for rapid requests
 */
export function checkBurstLimit(
  tenantId: string,
  endpoint: string,
  plan: string = 'starter'
): RateLimitResult {
  const config = RATE_LIMITS[plan] || RATE_LIMITS.starter
  const key = `${tenantId}:${endpoint}:burst`
  const now = Date.now()
  const resetAt = now + 1000 // 1 second burst window
  
  let entry = rateLimitStore.get(key)
  
  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt, blocked: false }
  }
  
  if (entry.count >= config.burstLimit) {
    return {
      allowed: false,
      limit: config.burstLimit,
      remaining: 0,
      resetAt,
      retryAfter: Math.ceil((resetAt - now) / 1000),
    }
  }
  
  entry.count++
  rateLimitStore.set(key, entry)
  
  return {
    allowed: true,
    limit: config.burstLimit,
    remaining: config.burstLimit - entry.count,
    resetAt,
  }
}

/**
 * Clean up expired entries
 */
export function cleanupRateLimits(): void {
  const now = Date.now()
  
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now && (!entry.blockedUntil || entry.blockedUntil < now)) {
      rateLimitStore.delete(key)
    }
  }
}

// Cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimits, 5 * 60 * 1000)
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetAt.toString(),
    ...(result.retryAfter ? { 'Retry-After': result.retryAfter.toString() } : {}),
  }
}

/**
 * API endpoint rate limits
 */
export const ENDPOINT_LIMITS: Record<string, { multiplier: number }> = {
  // High-traffic endpoints
  '/api/wallet/balance': { multiplier: 1 },
  '/api/wallet/transactions': { multiplier: 1 },
  '/api/pos/orders': { multiplier: 2 },
  '/api/pos/products': { multiplier: 1 },
  
  // Medium-traffic endpoints
  '/api/inventory/items': { multiplier: 1 },
  '/api/customers': { multiplier: 1 },
  '/api/reports': { multiplier: 2 },
  
  // Low-traffic / heavy endpoints
  '/api/reports/custom': { multiplier: 5 },
  '/api/export': { multiplier: 10 },
  '/api/analytics': { multiplier: 3 },
}

/**
 * Check combined rate limit (burst + sustained)
 */
export function checkCombinedRateLimit(
  tenantId: string,
  endpoint: string,
  plan: string = 'starter'
): RateLimitResult {
  // Check burst first
  const burstResult = checkBurstLimit(tenantId, endpoint, plan)
  
  if (!burstResult.allowed) {
    return burstResult
  }
  
  // Apply endpoint multiplier
  const endpointConfig = ENDPOINT_LIMITS[endpoint]
  const effectiveEndpoint = endpointConfig 
    ? `${endpoint}:weight_${endpointConfig.multiplier}`
    : endpoint
  
  // For weighted endpoints, increment multiple times
  if (endpointConfig && endpointConfig.multiplier > 1) {
    for (let i = 0; i < endpointConfig.multiplier - 1; i++) {
      checkRateLimit(tenantId, effectiveEndpoint, plan)
    }
  }
  
  return checkRateLimit(tenantId, endpoint, plan)
}

/**
 * Tenant quota tracking
 */
interface TenantQuota {
  apiCalls: number
  storageUsed: number
  activeUsers: number
  periodStart: Date
}

const tenantQuotas = new Map<string, TenantQuota>()

/**
 * Check tenant quota
 */
export function checkTenantQuota(
  tenantId: string,
  quotaType: 'apiCalls' | 'storageUsed' | 'activeUsers',
  current: number,
  limit: number
): { exceeded: boolean; current: number; limit: number; remaining: number } {
  const quota = tenantQuotas.get(tenantId) || {
    apiCalls: 0,
    storageUsed: 0,
    activeUsers: 0,
    periodStart: new Date(),
  }
  
  const used = quota[quotaType]
  const remaining = Math.max(0, limit - used)
  
  return {
    exceeded: used >= limit,
    current: used,
    limit,
    remaining,
  }
}

/**
 * Increment tenant quota usage
 */
export function incrementQuotaUsage(
  tenantId: string,
  quotaType: 'apiCalls' | 'storageUsed' | 'activeUsers',
  amount: number = 1
): void {
  const quota = tenantQuotas.get(tenantId) || {
    apiCalls: 0,
    storageUsed: 0,
    activeUsers: 0,
    periodStart: new Date(),
  }
  
  quota[quotaType] += amount
  tenantQuotas.set(tenantId, quota)
}
