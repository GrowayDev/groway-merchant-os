import { NextRequest, NextResponse } from 'next/server'
import { getMerchantIdWithDevFallback } from '@/lib/auth-context'
import { evoucherService } from '@/lib/grocore/evoucher/shared-instance'
export async function GET(request: NextRequest) {
  try { const t = await getMerchantIdWithDevFallback(request); if (!t) return NextResponse.json({ success: false, error: 'Auth required' }, { status: 401 })
    const products = evoucherService.listDeviceProducts({ country: new URL(request.url).searchParams.get('country') || undefined })
    return NextResponse.json({ success: true, devices: products.map(p => ({ ...p, retailPriceMinor: p.retailPriceMinor.toString(), depositMinor: p.depositMinor.toString(), dailyPaymentMinor: p.dailyPaymentMinor.toString() })) })
  } catch { return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 }) }
}
