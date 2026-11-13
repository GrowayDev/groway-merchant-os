import { NextRequest, NextResponse } from 'next/server'
import { GroCoreError, httpStatusFor } from '@/lib/grocore'

export function getTenantId(request: NextRequest): string {
  return request.headers.get('x-tenant-id') || 'demo-tenant'
}

export function serializeBigInt(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj
  if (typeof obj === 'bigint') return obj.toString()
  if (Array.isArray(obj)) return obj.map(serializeBigInt)
  if (obj instanceof Date) return obj.toISOString()
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = serializeBigInt(value)
    }
    return result
  }
  return obj
}

export function parseMoney(input: unknown): { cents: bigint; currency: 'ZAR' | 'MWK' | 'USD' } {
  if (!input || typeof input !== 'object') throw new GroCoreError('VALIDATION_ERROR', 'Money amount is required')
  const m = input as { cents?: string | number | bigint; currency?: string }
  if (m.cents === undefined || m.cents === null) throw new GroCoreError('VALIDATION_ERROR', 'Money.cents is required')
  let cents: bigint
  try {
    cents = typeof m.cents === 'bigint' ? m.cents : typeof m.cents === 'number' ? BigInt(Math.trunc(m.cents)) : BigInt(String(m.cents).trim())
  } catch { throw new GroCoreError('VALIDATION_ERROR', `Invalid cents: ${m.cents}`) }
  const currency = (m.currency === 'MWK' || m.currency === 'USD' ? m.currency : 'ZAR') as 'ZAR' | 'MWK' | 'USD'
  return { cents, currency }
}

export function handleError(e: unknown): NextResponse {
  if (e instanceof GroCoreError) {
    return NextResponse.json({ error: e.message, code: e.code, details: e.details ?? null }, { status: httpStatusFor(e.code) })
  }
  console.error('GroCore API error:', e)
  return NextResponse.json({ error: 'Internal server error', message: String(e) }, { status: 500 })
}

export function ok(data: unknown, status = 200): NextResponse {
  return NextResponse.json(serializeBigInt(data), { status })
}
