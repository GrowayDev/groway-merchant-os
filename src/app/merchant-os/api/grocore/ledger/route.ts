import { NextRequest, NextResponse } from 'next/server'
import { getMerchantIdWithDevFallback } from '@/lib/auth-context'
import { evoucherLedger } from '@/lib/grocore/evoucher/shared-instance'
export async function GET(request: NextRequest) {
  try { const t = await getMerchantIdWithDevFallback(request); if (!t) return NextResponse.json({ success: false, error: 'Auth required' }, { status: 401 })
    const entries = await evoucherLedger.repo.entries(t)
    return NextResponse.json({ success: true, entries: entries.map(e => ({ id: e.id, reason: e.reason, correlationId: e.correlationId, currency: e.currency, postedAt: e.postedAt, lineCount: e.lines.length, lines: e.lines })) })
  } catch { return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 }) }
}
export async function POST(request: NextRequest) {
  try { const t = await getMerchantIdWithDevFallback(request); if (!t) return NextResponse.json({ success: false, error: 'Auth required' }, { status: 401 })
    const { idempotencyKey, reason, correlationId, currency, lines } = await request.json()
    if (!idempotencyKey || !reason || !lines) return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 })
    const r = await evoucherLedger.post({ tenantId: t, idempotencyKey, reason, correlationId: correlationId || idempotencyKey, currency: currency || 'ZAR', lines: lines.map((l: any) => ({ account: l.account, amount: BigInt(l.amount) })) })
    return NextResponse.json({ success: true, entry: { id: r.entry.id, postedAt: r.entry.postedAt }, replayed: r.replayed })
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }) }
}
