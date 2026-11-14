import { NextRequest, NextResponse } from 'next/server'
import { getMerchantIdWithDevFallback } from '@/lib/auth-context'
import { evoucherService } from '@/lib/grocore/evoucher/shared-instance'
import { ALL_PROVIDERS, SA_MNOS, MW_MNOS, SA_UTILITIES, MW_UTILITIES, SA_ISPS } from '@/lib/grocore/evoucher/catalogue'
export async function GET(request: NextRequest) {
  try { const t = await getMerchantIdWithDevFallback(request); if (!t) return NextResponse.json({ success: false, error: 'Auth required' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const products = evoucherService.listProducts({ country: searchParams.get('country') || undefined, category: searchParams.get('category') || undefined })
    const deviceProducts = evoucherService.listDeviceProducts({ country: searchParams.get('country') || undefined })
    return NextResponse.json({ success: true, products: products.map(p => ({ ...p, faceValueMinor: p.faceValueMinor.toString(), costMinor: p.costMinor.toString() })), deviceProducts: deviceProducts.map(p => ({ ...p, retailPriceMinor: p.retailPriceMinor.toString(), depositMinor: p.depositMinor.toString(), dailyPaymentMinor: p.dailyPaymentMinor.toString() })), providers: ALL_PROVIDERS, saMnos: SA_MNOS, mwMnos: MW_MNOS, saUtilities: SA_UTILITIES, mwUtilities: MW_UTILITIES, saIsps: SA_ISPS })
  } catch { return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 }) }
}
