/**
 * Consumer wallet authentication helpers.
 *
 * Phase 4 hardening: JWT scope enforcement.
 * Consumer tokens are issued at /api/consumer/auth/login with a `scope: 'consumer'`
 * claim. Merchant tokens don't have this claim. The proxy rejects merchant tokens
 * on /api/consumer/* routes.
 */

import { verify, sign, JwtPayload } from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export interface ConsumerTokenPayload extends JwtPayload {
  userId: string
  walletId?: string
  phone?: string
  kycLevel?: number
  scope: 'consumer'
}

/**
 * Verify a consumer JWT from the request.
 * Returns the payload if valid, or null if invalid/missing/wrong scope.
 */
export function verifyConsumerToken(request: NextRequest): ConsumerTokenPayload | null {
  const authHeader = request.headers.get('authorization')
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  const sessionToken = request.cookies.get('groway_session')?.value
  const token = bearerToken || sessionToken

  if (!token) return null

  try {
    const payload = verify(token, JWT_SECRET) as ConsumerTokenPayload
    if (payload.scope !== 'consumer') return null
    return payload
  } catch {
    return null
  }
}

/**
 * Sign a consumer JWT with the 'consumer' scope.
 */
export function signConsumerToken(payload: Omit<ConsumerTokenPayload, 'scope' | 'iat' | 'exp'>): string {
  return sign({ ...payload, scope: 'consumer' }, JWT_SECRET, { expiresIn: '7d' })
}

/**
 * Middleware-style guard for consumer API routes.
 * Returns the payload if authenticated, or a 401 response if not.
 */
export function requireConsumerAuth(request: NextRequest): ConsumerTokenPayload | NextResponse {
  const payload = verifyConsumerToken(request)
  if (!payload) {
    return NextResponse.json(
      { error: 'Consumer authentication required', code: 'CONSUMER_AUTH_REQUIRED' },
      { status: 401 }
    )
  }
  return payload
}
