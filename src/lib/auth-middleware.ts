import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { db } from './db'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export interface AuthUser {
  userId: string
  merchantId: string
  branchId?: string
  role: string
}

export interface AuthResult {
  authenticated: boolean
  user?: AuthUser
  error?: string
}

/**
 * Verify JWT token and extract user info
 */
export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = verify(token, JWT_SECRET) as AuthUser
    return decoded
  } catch (error) {
    return null
  }
}

/**
 * Extract Bearer token from Authorization header
 */
export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  return authHeader.slice(7)
}

/**
 * Authenticate API request - validates JWT and session
 * Returns AuthResult with user info if valid
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  try {
    // Extract token from Authorization header
    const token = extractBearerToken(request)
    
    if (!token) {
      return { authenticated: false, error: 'No authentication token provided' }
    }

    // Verify JWT
    const user = verifyToken(token)
    if (!user) {
      return { authenticated: false, error: 'Invalid or expired token' }
    }

    // Verify session exists in database
    const session = await db.session.findFirst({
      where: {
        token,
        expiresAt: { gt: new Date() }
      },
      include: {
        User: {
          include: {
            MerchantUser: {
              where: { merchantId: user.merchantId },
              select: { role: true, isActive: true }
            }
          }
        }
      }
    })

    if (!session) {
      return { authenticated: false, error: 'Session not found or expired' }
    }

    // Verify merchant user is still active
    const merchantUser = session.User?.MerchantUser?.[0]
    if (!merchantUser?.isActive) {
      return { authenticated: false, error: 'User no longer has access to this merchant' }
    }

    return { authenticated: true, user }
  } catch (error) {
    console.error('Authentication error:', error)
    return { authenticated: false, error: 'Authentication failed' }
  }
}

/**
 * Middleware wrapper for API routes that require authentication
 * Usage:
 * 
 * export const GET = withAuth(async (request, { user }) => {
 *   // user is typed as AuthUser
 *   return NextResponse.json({ success: true, data: ... })
 * })
 */
export function withAuth<T>(
  handler: (request: NextRequest, context: { user: AuthUser; params?: T }) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: { params?: T }) => {
    const authResult = await authenticateRequest(request)
    
    if (!authResult.authenticated) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Unauthorized' },
        { status: 401 }
      )
    }

    return handler(request, { user: authResult.user!, params: context?.params })
  }
}

/**
 * Optional auth middleware - passes through if no token, but validates if present
 */
export function withOptionalAuth<T>(
  handler: (request: NextRequest, context: { user?: AuthUser; params?: T }) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: { params?: T }) => {
    const token = extractBearerToken(request)
    
    if (!token) {
      return handler(request, { params: context?.params })
    }

    const authResult = await authenticateRequest(request)
    
    return handler(request, { 
      user: authResult.authenticated ? authResult.user : undefined, 
      params: context?.params 
    })
  }
}

/**
 * Require specific role for API route
 */
export function withRole<T>(
  allowedRoles: string[],
  handler: (request: NextRequest, context: { user: AuthUser; params?: T }) => Promise<NextResponse>
) {
  return withAuth(async (request, context) => {
    if (!allowedRoles.includes(context.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
    return handler(request, context)
  })
}

/**
 * Development mode bypass - allows unauthenticated access in development
 * WARNING: Only use for testing/development routes
 */
export function withDevModeBypass<T>(
  handler: (request: NextRequest, context: { user?: AuthUser; params?: T; isDevBypass: boolean }) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: { params?: T }) => {
    // Check for dev mode bypass via environment
    const isDevMode = process.env.NODE_ENV === 'development'
    
    // Try to authenticate first
    const token = extractBearerToken(request)
    
    if (token) {
      const authResult = await authenticateRequest(request)
      if (authResult.authenticated) {
        return handler(request, { 
          user: authResult.user, 
          params: context?.params,
          isDevBypass: false 
        })
      }
    }

    // If in dev mode, allow bypass with default merchant
    if (isDevMode) {
      // Check for dev-merchant header or use default
      const devMerchantId = request.headers.get('x-dev-merchant-id') || 'merchant-001'
      
      return handler(request, { 
        user: {
          userId: 'dev-user',
          merchantId: devMerchantId,
          role: 'owner'
        },
        params: context?.params,
        isDevBypass: true
      })
    }

    // Not authenticated and not in dev mode
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    )
  }
}

/**
 * Helper to get merchant ID from request (either authenticated or from query params for public routes)
 */
export function getMerchantIdFromRequest(request: NextRequest, user?: AuthUser): string | null {
  // Priority 1: Authenticated user's merchant
  if (user?.merchantId) {
    return user.merchantId
  }
  
  // Priority 2: Query parameter (for public routes)
  const { searchParams } = new URL(request.url)
  return searchParams.get('merchantId')
}
