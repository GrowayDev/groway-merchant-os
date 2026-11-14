/**
 * Authentication & Authorization Context Helper
 * 
 * This module provides a unified way for API routes to:
 * 1. Get authenticated user context
 * 2. Enforce tenant isolation
 * 3. Validate merchant/user IDs against authenticated context
 * 
 * IMPORTANT: All API routes should use these helpers instead of
 * hardcoded defaults to ensure proper security.
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { db } from '@/lib/db'

// Context types
export interface AuthenticatedContext {
  userId: string
  merchantId: string
  tenantId?: string
  branchId?: string
  role: string
  permissions: string[]
  isAuthenticated: true
}

export interface ConsumerContext {
  userId: string
  phone: string
  email?: string
  kycStatus: string
  tenantId?: string
  isAuthenticated: true
  userType: 'consumer'
}

export interface AdminContext {
  adminId: string
  email: string
  role: string
  permissions: string[]
  isAuthenticated: true
  userType: 'admin'
}

export type RequestContext = AuthenticatedContext | ConsumerContext | AdminContext | null

/**
 * Response helper for unauthorized access
 */
export function unauthorizedResponse(message: string = 'Authentication required'): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code: 'AUTH_REQUIRED',
    },
    { status: 401 }
  )
}

/**
 * Response helper for forbidden access
 */
export function forbiddenResponse(message: string = 'Access denied'): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code: 'FORBIDDEN',
    },
    { status: 403 }
  )
}

/**
 * Response helper for bad request (missing required params)
 */
export function badRequestResponse(message: string, code: string = 'BAD_REQUEST'): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code,
    },
    { status: 400 }
  )
}

/**
 * Get authenticated context from request headers
 * This should be called at the start of every protected API route
 */
export async function getAuthContext(request?: NextRequest): Promise<RequestContext> {
  try {
    const headerStore = await headers()
    
    // Check for authenticated headers set by proxy.ts
    const isAuthenticated = headerStore.get('x-authenticated') === 'true'
    const userId = headerStore.get('x-user-id')
    const merchantId = headerStore.get('x-merchant-id')
    const tenantId = headerStore.get('x-tenant-id')
    const branchId = headerStore.get('x-branch-id')
    const role = headerStore.get('x-user-role') || 'member'
    
    if (isAuthenticated && userId && merchantId) {
      return {
        userId,
        merchantId,
        tenantId: tenantId || undefined,
        branchId: branchId || undefined,
        role,
        permissions: [],
        isAuthenticated: true,
      }
    }
    
    // Fallback: Check for session token in cookies
    const sessionToken = headerStore.get('authorization')?.replace('Bearer ', '') ||
                         request?.cookies.get('session_token')?.value ||
                         request?.cookies.get('auth_token')?.value
    
    if (sessionToken) {
      // Validate session in database
      const merchantSession = await db.merchantSession.findFirst({
        where: {
          token: sessionToken,
          expiresAt: { gt: new Date() },
        },
        include: {
          MerchantUser: {
            include: {
              Merchant: true,
            },
          },
        },
      })
      
      if (merchantSession?.MerchantUser) {
        return {
          userId: merchantSession.MerchantUser.id,
          merchantId: merchantSession.MerchantUser.merchantId,
          tenantId: merchantSession.MerchantUser.Merchant?.tenantId || undefined,
          branchId: merchantSession.MerchantUser.branchId || undefined,
          role: merchantSession.MerchantUser.role,
          permissions: [],
          isAuthenticated: true,
        }
      }
      
      // Check consumer session
      const consumerSession = await db.consumerSession.findFirst({
        where: {
          refreshToken: sessionToken,
          status: 'active',
          refreshTokenExpiry: { gt: new Date() },
        },
        include: {
          ConsumerUser: true,
        },
      })
      
      if (consumerSession?.ConsumerUser) {
        const user = consumerSession.ConsumerUser
        // Get tenant membership
        const tenantUser = await db.tenantUser.findFirst({
          where: { userId: user.id, status: 'active' },
        })
        
        return {
          userId: user.id,
          phone: user.phone,
          email: user.email || undefined,
          kycStatus: user.kycStatus,
          tenantId: tenantUser?.tenantId || undefined,
          isAuthenticated: true,
          userType: 'consumer',
        }
      }
    }
    
    return null
  } catch (error) {
    console.error('Error getting auth context:', error)
    return null
  }
}

/**
 * Require authentication - returns context or throws error response
 * Use this at the start of protected API routes
 */
export async function requireAuth(request?: NextRequest): Promise<AuthenticatedContext | NextResponse> {
  const context = await getAuthContext(request)
  
  if (!context) {
    return unauthorizedResponse()
  }
  
  if (!('merchantId' in context)) {
    return forbiddenResponse('Merchant context required')
  }
  
  return context
}

/**
 * Require consumer authentication
 */
export async function requireConsumerAuth(request?: NextRequest): Promise<ConsumerContext | NextResponse> {
  const context = await getAuthContext(request)
  
  if (!context) {
    return unauthorizedResponse()
  }
  
  if (!('userType' in context) || context.userType !== 'consumer') {
    return forbiddenResponse('Consumer authentication required')
  }
  
  return context
}

/**
 * Require admin authentication
 */
export async function requireAdminAuth(request?: NextRequest): Promise<AdminContext | NextResponse> {
  const context = await getAuthContext(request)
  
  if (!context) {
    return unauthorizedResponse()
  }
  
  if (!('userType' in context) || context.userType !== 'admin') {
    return forbiddenResponse('Admin authentication required')
  }
  
  return context
}

/**
 * Validate and get merchantId from params or context
 * IMPORTANT: This replaces hardcoded defaults like `|| 'default'`
 * 
 * @param searchParams - URL search params
 * @param context - Authenticated context
 * @returns merchantId string or NextResponse error
 */
export function getMerchantId(
  searchParams: URLSearchParams,
  context: AuthenticatedContext
): string | NextResponse {
  const paramMerchantId = searchParams.get('merchantId')
  
  // If merchantId is provided in params, validate it matches context
  if (paramMerchantId) {
    // Security: Ensure the merchantId matches the authenticated user's merchant
    // This prevents IDOR attacks
    if (paramMerchantId !== context.merchantId) {
      // Check if user has cross-merchant access (platform admin or multi-location)
      if (context.role !== 'platform_admin' && context.role !== 'super_admin') {
        return forbiddenResponse('Access denied to this merchant')
      }
    }
    return paramMerchantId
  }
  
  // Use authenticated merchantId
  return context.merchantId
}

/**
 * Validate and get userId from params or context
 * IMPORTANT: This replaces hardcoded defaults like `|| 'demo-user'`
 * 
 * @param searchParams - URL search params
 * @param context - Authenticated context
 * @returns userId string or NextResponse error
 */
export function getUserId(
  searchParams: URLSearchParams,
  context: AuthenticatedContext | ConsumerContext
): string | NextResponse {
  const paramUserId = searchParams.get('userId')
  
  // If userId is provided in params, validate it matches context
  if (paramUserId) {
    // Security: Ensure the userId matches the authenticated user
    // This prevents IDOR attacks
    if (paramUserId !== context.userId) {
      // Check if user has admin access
      if ('role' in context && (context.role !== 'platform_admin' && context.role !== 'super_admin')) {
        return forbiddenResponse('Access denied to this user\'s data')
      }
    }
    return paramUserId
  }
  
  // Use authenticated userId
  return context.userId
}

/**
 * Validate tenant access for a resource
 * Ensures the resource belongs to the authenticated user's tenant
 */
export async function validateTenantAccess(
  resourceTenantId: string | null | undefined,
  context: AuthenticatedContext
): Promise<boolean> {
  // Platform admins can access all tenants
  if (context.role === 'platform_admin' || context.role === 'super_admin') {
    return true
  }
  
  // If resource has no tenant, deny access
  if (!resourceTenantId) {
    return false
  }
  
  // Check if user's tenant matches resource tenant
  if (context.tenantId && resourceTenantId !== context.tenantId) {
    return false
  }
  
  return true
}

/**
 * Require merchant ID in params - no fallback
 * Use this when merchantId must be explicitly provided
 */
export function requireMerchantId(searchParams: URLSearchParams): string | NextResponse {
  const merchantId = searchParams.get('merchantId')
  
  if (!merchantId) {
    return badRequestResponse('merchantId parameter is required', 'MISSING_MERCHANT_ID')
  }
  
  return merchantId
}

/**
 * Require user ID in params - no fallback
 * Use this when userId must be explicitly provided
 */
export function requireUserId(searchParams: URLSearchParams): string | NextResponse {
  const userId = searchParams.get('userId')
  
  if (!userId) {
    return badRequestResponse('userId parameter is required', 'MISSING_USER_ID')
  }
  
  return userId
}

/**
 * Optional merchant filter - uses context if available
 * Use this for routes that can work with or without merchant context
 */
export async function getOptionalMerchantId(
  searchParams: URLSearchParams,
  request?: NextRequest
): Promise<string | null> {
  const paramMerchantId = searchParams.get('merchantId')
  
  if (paramMerchantId) {
    return paramMerchantId
  }
  
  const context = await getAuthContext(request)
  if (context && 'merchantId' in context) {
    return context.merchantId
  }
  
  return null
}

/**
 * Development mode check with warning
 */
export function isDevelopmentMode(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * Create a development context for testing
 * Only works in development mode
 */
export function getDevContext(): AuthenticatedContext | null {
  if (!isDevelopmentMode()) {
    return null
  }
  
  return {
    userId: 'dev-user',
    merchantId: 'merchant-001',
    tenantId: 'tenant-dev',
    role: 'admin',
    permissions: ['*'],
    isAuthenticated: true,
  }
}

/**
 * Safe context getter that works in development
 * In production: requires real authentication
 * In development: allows dev context
 */
export async function getSafeContext(request?: NextRequest): Promise<RequestContext> {
  const context = await getAuthContext(request)
  
  if (context) {
    return context
  }
  
  // Fallback to dev context in development mode
  if (isDevelopmentMode()) {
    return getDevContext()
  }
  
  return null
}

/**
 * Check if user has specific permission
 */
export function hasPermission(context: RequestContext, permission: string): boolean {
  if (!context) return false
  
  if ('permissions' in context) {
    if (context.permissions.includes('*')) return true
    if (context.permissions.includes(permission)) return true
    
    // Check wildcard permissions
    const wildcardPerms = context.permissions.filter(p => p.endsWith('.*'))
    for (const wild of wildcardPerms) {
      if (permission.startsWith(wild.slice(0, -1))) return true
    }
  }
  
  // Admin users have all permissions
  if ('userType' in context && context.userType === 'admin') return true
  if ('role' in context && (context.role === 'platform_admin' || context.role === 'super_admin')) return true
  
  return false
}

/**
 * Require specific permission
 */
export function requirePermission(
  context: RequestContext,
  permission: string
): NextResponse | null {
  if (!hasPermission(context, permission)) {
    return forbiddenResponse(`Permission '${permission}' required`)
  }
  return null
}

/**
 * Get merchant ID with development fallback
 * This is used by API routes that need to work in both dev and production
 * In development: returns 'merchant-001' if no auth context
 * In production: requires valid authentication
 */
export async function getMerchantIdWithDevFallback(request?: NextRequest): Promise<string | null> {
  const context = await getAuthContext(request)
  
  if (context && 'merchantId' in context) {
    return context.merchantId
  }
  
  // Fallback to dev context in development mode
  if (isDevelopmentMode()) {
    return 'merchant-001'
  }
  
  return null
}
