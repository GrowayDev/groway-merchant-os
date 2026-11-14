import { NextRequest, NextResponse } from 'next/server'
import { getMerchantIdWithDevFallback } from '@/lib/auth-context'
import { LedgerService, InMemoryLedgerRepo } from '@/lib/grocore/ledger/ledger'
import { evoucherService, evoucherLedger } from '@/lib/grocore/evoucher/shared-instance'

export async function GET(request: NextRequest) {
  try {
    const t = await getMerchantIdWithDevFallback(request)
    if (!t) return NextResponse.json({ success: false, error: 'Auth required' }, { status: 401 })
    const entries = await evoucherLedger.repo.entries(t)
    const tb = await evoucherLedger.trialBalanceTotal(t)
    const accts = new Set<string>()
    for (const e of entries) for (const l of e.lines) accts.add(l.account)
    const evStats = evoucherService.stats()
    return NextResponse.json({ success: true, stats: { totalEntries: entries.length, totalAccounts: accts.size, trialBalance: fmt(tb), recentEntriesCount: entries.slice(-10).length, voucherSales: evStats.totalSales, deviceContracts: evStats.activeContracts }, recentEntries: entries.slice(-10).reverse().map(e => ({ id: e.id, reason: e.reason, correlationId: e.correlationId, currency: e.currency, postedAt: e.postedAt, lineCount: e.lines.length })) })
  } catch (e) { console.error('[grocore/stats]', e); return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 }) }
}
function fmt(c: bigint) { const n = c < 0n; const a = n ? -c : c; const w = (a / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); return `${n ? '-' : ''}R${w}.${(a % 100n).toString().padStart(2, '0')}` }
