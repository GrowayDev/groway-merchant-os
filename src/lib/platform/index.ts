/**
 * Platform Services Index
 * Export all platform services
 */

export * from './tenant-context'
export * from './auth-service'
export * from './user-directory'
export * from './rate-limiter'

// Re-export types
export type { TenantContext, UserContext, ApplicationId } from './tenant-context'
export type { AuthResult, RegisterResult, PlatformUser } from './auth-service'
export type { UnifiedUser, UserSearchParams, UserStats } from './user-directory'
export type { RateLimitResult } from './rate-limiter'
