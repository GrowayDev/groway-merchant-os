import { NextRequest, NextResponse } from 'next/server'
import { getMerchantIdWithDevFallback } from '@/lib/auth-context'
import { evoucherService } from '@/lib/grocore/evoucher/shared-instance'
export async function GET(request: NextRequest) {
  try { const t = await getMerchantIdWithDevFallback(request); if (!t) return NextResponse.json({ success: false, error: 'Auth required' }, { status: 401 })
    return NextResponse.json({ success: true, stats: evoucherService.stats(), sales: evoucherService.listSales(10).map(s => ({ ...s, faceValueMinor: s.faceValueMinor.toString(), salePriceMinor: s.salePriceMinor.toString(), costMinor: s.costMinor.toString(), profitMinor: s.profitMinor.toString() })) })
  } catch { return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 }) }
}
