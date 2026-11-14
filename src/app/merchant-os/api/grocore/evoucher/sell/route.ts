import { NextRequest, NextResponse } from 'next/server'
import { getMerchantIdWithDevFallback } from '@/lib/auth-context'
import { evoucherService } from '@/lib/grocore/evoucher/shared-instance'
export async function POST(request: NextRequest) {
  try { const t = await getMerchantIdWithDevFallback(request); if (!t) return NextResponse.json({ success: false, error: 'Auth required' }, { status: 401 })
    const { productId, customerMsisdn, meterNumber, paymentMethod, channel } = await request.json()
    if (!productId || !customerMsisdn) return NextResponse.json({ success: false, error: 'productId and customerMsisdn required' }, { status: 400 })
    const result = await evoucherService.sell({ productId, customerMsisdn, meterNumber, paymentMethod: paymentMethod || 'wallet', channel: channel || 'grocore_app', tenantId: t })
    return NextResponse.json({ success: true, data: result })
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }) }
}
