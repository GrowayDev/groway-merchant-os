import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { db } from '@/lib/db'

/**
 * JWT Token Payload interface
 */
export interface JwtPayload {
  userId: string
  merchantId: string
  branchId?: string
  role: string
  iat?: number
  exp?: number
}

/**
 * Auth Context interface - injected into request
 */
export interface AuthContext {
  user: {
    id: string
    email?: string
    name?: string
  }
  merchant: {
    id: string
    role: string
  }
  branch?: {
    id: string
  }
  session: {
    id: string
    token: string
  }
}

/**
 * Extended Request interface with auth context
 */
export interface AuthenticatedRequest extends NextRequest {
  auth?: AuthContext
}

/**
 * Verify JWT token and return decoded payload
 * @param token - JWT token string
 * @returns Decoded JWT payload
 * @throws Error if JWT_SECRET is not set or token is invalid
 */
export function verifyAuthToken(token: string): JwtPayload {
  const JWT_SECRET = process.env.JWT_SECRET
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required')
  }

  try {
    const decoded = verify(token, JWT_SECRET) as JwtPayload
    return decoded
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token has expired')
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token')
      }
    }
    throw new Error('Token verification failed')
  }
}

/**
 * Extract and verify token from request
 * Checks Authorization header and cookies
 * @param request - NextRequest object
 * @returns Auth context with user, merchant, branch, and session info
 * @throws NextResponse with 401 status for invalid/expired tokens
 */
export async function getAuthFromRequest(request: NextRequest): Promise<AuthContext> {
  // Extract token from Authorization header or cookie
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value

  if (!token) {
    throw NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    )
  }

  // Verify JWT token
  let decoded: JwtPayload
  try {
    decoded = verifyAuthToken(token)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid token'
    throw NextResponse.json(
      { success: false, error: message, authenticated: false },
      { status: 401 }
    )
  }

  // Check session validity in database
  const session = await db.session.findFirst({
    where: {
      token,
      expiresAt: { gt: new Date() }
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true
        }
      }
    }
  })

  if (!session) {
    throw NextResponse.json(
      { success: false, error: 'Session expired or invalid', authenticated: false },
      { status: 401 }
    )
  }

  // Verify user still has access to the merchant
  const merchantUser = await db.merchantUser.findFirst({
    where: {
      userId: decoded.userId,
      merchantId: decoded.merchantId,
      isActive: true
    },
    select: {
      role: true,
      permissions: true
    }
  })

  if (!merchantUser) {
    throw NextResponse.json(
      { success: false, error: 'Access denied to merchant', authenticated: false },
      { status: 403 }
    )
  }

  // Return auth context
  return {
    user: {
      id: session.user.id,
      email: session.user.email ?? undefined,
      name: session.user.name ?? undefined
    },
    merchant: {
      id: decoded.merchantId,
      role: merchantUser.role
    },
    branch: decoded.branchId ? { id: decoded.branchId } : undefined,
    session: {
      id: session.id,
      token
    }
  }
}

/**
 * Higher-order function that wraps API handlers with authentication protection
 * Automatically extracts and verifies auth, injects context into request
 * @param handler - API route handler function
 * @returns Wrapped handler with auth protection
 */
export function withAuth(
  handler: (request: AuthenticatedRequest, context?: any) => Promise<NextResponse>
): (request: NextRequest, context?: any) => Promise<NextResponse> {
  return async (request: NextRequest, context?: any) => {
    try {
      // Get and validate auth context
      const authContext = await getAuthFromRequest(request)
      
      // Create authenticated request with auth context
      const authenticatedRequest = request as AuthenticatedRequest
      authenticatedRequest.auth = authContext

      // Call the original handler with authenticated request
      return handler(authenticatedRequest, context)
    } catch (error) {
      // If error is a NextResponse (thrown from getAuthFromRequest), return it
      if (error instanceof NextResponse) {
        return error
      }

      // Handle unexpected errors
      console.error('Auth middleware error:', error)
      return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 401 }
      )
    }
  }
}

/**
 * Optional auth wrapper - doesn't require authentication but injects context if available
 * @param handler - API route handler function
 * @returns Wrapped handler with optional auth
 */
export function withOptionalAuth(
  handler: (request: AuthenticatedRequest, context?: any) => Promise<NextResponse>
): (request: NextRequest, context?: any) => Promise<NextResponse> {
  return async (request: NextRequest, context?: any) => {
    const authenticatedRequest = request as AuthenticatedRequest
    
    try {
      // Try to get auth context, but don't fail if not available
      const authContext = await getAuthFromRequest(request)
      authenticatedRequest.auth = authContext
    } catch {
      // Auth not available, continue without it
      authenticatedRequest.auth = undefined
    }

    return handler(authenticatedRequest, context)
  }
}

/**
 * Check if user has required role
 * @param auth - Auth context
 * @param allowedRoles - Array of allowed roles
 * @returns boolean indicating if user has required role
 */
export function hasRole(auth: AuthContext, allowedRoles: string[]): boolean {
  return allowedRoles.includes(auth.merchant.role)
}

/**
 * Middleware factory for role-based access control
 * @param allowedRoles - Array of allowed roles
 * @returns Middleware function that checks role
 */
export function requireRoles(allowedRoles: string[]) {
  return async (request: AuthenticatedRequest): Promise<NextResponse | null> => {
    if (!request.auth) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (!hasRole(request.auth, allowedRoles)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    return null // No error, proceed
  }
}

/**
 * Combined middleware with auth and role check
 * @param handler - API route handler function
 * @param allowedRoles - Array of allowed roles
 * @returns Wrapped handler with auth and role protection
 */
export function withAuthAndRoles(
  handler: (request: AuthenticatedRequest, context?: any) => Promise<NextResponse>,
  allowedRoles: string[]
): (request: NextRequest, context?: any) => Promise<NextResponse> {
  return withAuth(async (request: AuthenticatedRequest, context?: any) => {
    const roleError = await requireRoles(allowedRoles)(request)
    if (roleError) {
      return roleError
    }
    return handler(request, context)
  })
}
