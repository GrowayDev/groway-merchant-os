import { NextResponse } from 'next/server'

/**
 * Audit remediation F2.2: seed/demo endpoints must be unreachable outside development.
 * Returns a 404 response when not in development mode (hides endpoint existence),
 * or null when the caller may proceed.
 */
export function devOnlyGuard(): NextResponse | null {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { success: false, error: 'Not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }
  return null
}
