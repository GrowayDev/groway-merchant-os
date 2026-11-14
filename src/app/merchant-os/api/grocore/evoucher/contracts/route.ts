import { NextRequest, NextResponse } from 'next/server'
import { getMerchantIdWithDevFallback } from '@/lib/auth-context'
import { evoucherService } from '@/lib/grocore/evoucher/shared-instance'
export async function GET(request: NextRequest) {
  try { const t = await getMerchantIdWithDevFallback(request); if (!t) return NextResponse.json({ success: false, error: 'Auth required' }, { status: 401 })
    const msisdn = new URL(request.url).searchParams.get('msisdn')
    const contracts = evoucherService.listContracts(msisdn || undefined)
    return NextResponse.json({ success: true, contracts: contracts.map(c => ({ ...c, depositPaidMinor: c.depositPaidMinor.toString(), dailyPaymentMinor: c.dailyPaymentMinor.toString(), totalPaidMinor: c.totalPaidMinor.toString(), outstandingMinor: c.outstandingMinor.toString() })) })
  } catch { return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 }) }
}
export async function POST(request: NextRequest) {
  try { const t = await getMerchantIdWithDevFallback(request); if (!t) return NextResponse.json({ success: false, error: 'Auth required' }, { status: 401 })
    const { productId, customerMsisdn, customerName, customerNationalId, depositMinor } = await request.json()
    if (!productId || !customerMsisdn || !depositMinor) return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 })
    const result = await evoucherService.createDeviceContract({ productId, customerMsisdn, customerName: customerName || 'Customer', customerNationalId, depositMinor: BigInt(depositMinor), tenantId: t })
    return NextResponse.json({ success: true, data: { ...result, dailyPayment: result.dailyPayment.toString(), outstanding: result.outstanding.toString() } })
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }) }
}
