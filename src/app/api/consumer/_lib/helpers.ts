import { NextRequest, NextResponse } from 'next/server'

export function getUserId(request: NextRequest): string {
  return request.headers.get('x-user-id') ||
         request.headers.get('x-consumer-id') ||
         new URL(request.url).searchParams.get('userId') ||
         'demo-consumer-user'
}

export function serialize(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj
  if (typeof obj === 'bigint') return obj.toString()
  if (obj instanceof Date) return obj.toISOString()
  if (Array.isArray(obj)) return obj.map(serialize)
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = serialize(value)
    }
    return result
  }
  return obj
}

export function ok(data: unknown, status = 200) {
  return NextResponse.json(serialize(data), { status })
}

export function error(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export function parseMoney(cents: string | number | bigint): bigint {
  if (typeof cents === 'bigint') return cents
  return BigInt(Math.trunc(Number(cents)))
}
