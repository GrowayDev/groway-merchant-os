import { NextRequest, NextResponse } from 'next/server'
import { getMerchantIdWithDevFallback } from '@/lib/auth-context'
import { settleSale, GoPayConfig } from '@/lib/grocore/gopay/settlement'
import { evoucherLedger } from '@/lib/grocore/evoucher/shared-instance'
const cfg: GoPayConfig = { goPayLive: false, route: 'debit', shareBps: 1000 }
export async function POST(request: NextRequest) {
  try { const t = await getMerchantIdWithDevFallback(request); if (!t) return NextResponse.json({ success: false, error: 'Auth required' }, { status: 401 })
    const { amountMinor, rail, merchantId, saleId } = await request.json()
    if (!amountMinor || amountMinor <= 0) return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 })
    const r = await settleSale(evoucherLedger, cfg, { tenantId: t, merchantId: merchantId || t, saleId: saleId || `sale:${Date.now()}`, amount: BigInt(amountMinor), rail })
    const fmt = (c: bigint) => { const n = c < 0n; const a = n ? -c : c; const w = (a / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); return `${n ? '-' : ''}R${w}.${(a % 100n).toString().padStart(2, '0')}` }
    return NextResponse.json({ success: true, data: { feeDisplay: fmt(r.fee), netDisplay: fmt(r.net), repaidDisplay: fmt(r.repaid), payoutDisplay: fmt(r.payout), feeMinor: r.fee.toString(), netMinor: r.net.toString(), repaidMinor: r.repaid.toString(), payoutMinor: r.payout.toString(), replayed: r.replayed, goPayLive: cfg.goPayLive, route: cfg.route } })
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }) }
}
