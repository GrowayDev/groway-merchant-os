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

export async function apiPost<T = any>(path: string, body: unknown): Promise<T> {
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

export function formatMoney(cents: string | bigint | number, currency = 'ZAR'): string {
  const c = typeof cents === 'string' ? BigInt(cents) : BigInt(cents)
  const n = Number(c) / 100
  try {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency }).format(n)
  } catch {
    return `${currency} ${n.toFixed(2)}`
  }
}
