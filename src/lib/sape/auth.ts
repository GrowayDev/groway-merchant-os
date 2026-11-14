/**
 * SAPE route auth — strict variant (audit remediation aligned).
 * Relies on proxy-injected x-authenticated headers ONLY. No dev fallback.
 * For public consumer endpoints use requirePublicSapeAccess (none needed —
 * public routes are explicitly allowlisted in proxy.ts).
 */
import { NextRequest, NextResponse } from 'next/server'

export interface SapeAuth {
  merchantId: string
  userId: string
  role: string
}

export function requireSapeAuth(request: NextRequest): SapeAuth | NextResponse {
  const authenticated = request.headers.get('x-authenticated') === 'true'
  const merchantId = request.headers.get('x-merchant-id')
  const userId = request.headers.get('x-user-id')
  const role = request.headers.get('x-user-role') || 'member'

  if (!authenticated || !merchantId || !userId) {
    return NextResponse.json(
      {
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      },
      { status: 401 }
    )
  }

  return { merchantId, userId, role }
}

export function isNextResponse(x: unknown): x is NextResponse {
  return x instanceof NextResponse
}

/** Internal service calls (authority feeds) must carry the internal API key. */
export function hasInternalKey(request: NextRequest): boolean {
  const expected = process.env.INTERNAL_API_KEY
  const provided = request.headers.get('X-Internal-Api-Key')
  if (!expected || !provided) return false
  if (provided.length !== expected.length) return false
  return provided === expected
}
