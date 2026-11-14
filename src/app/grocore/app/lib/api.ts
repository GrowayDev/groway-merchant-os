const BASE = '/merchant-os/api/grocore'

function getTenantId(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('grocore_tenant_id') || 'demo-tenant'
  }
  return 'demo-tenant'
}

export async function apiGet<T = any>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: { 'x-tenant-id': getTenantId() } })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function apiPost<T = any>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-tenant-id': getTenantId() },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function apiDelete<T = any>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: 'DELETE', headers: { 'x-tenant-id': getTenantId() } })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export function formatMoney(cents: string | bigint | number | undefined | null, currency = 'ZAR'): string {
  if (cents === undefined || cents === null) return `${currency} 0.00`
  const c = typeof cents === 'string' ? BigInt(cents) : BigInt(cents)
  const n = Number(c) / 100
  try {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency }).format(n)
  } catch {
    return `${currency} ${n.toFixed(2)}`
  }
}

/** Helper to extract cents from either flat (fieldCents) or nested (field.cents) money objects */
export function moneyCents(obj: any, field: string): string {
  if (!obj) return '0'
  if (obj[`${field}Cents`] !== undefined) return String(obj[`${field}Cents`])
  if (obj[field]?.cents !== undefined) return String(obj[field].cents)
  return '0'
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
