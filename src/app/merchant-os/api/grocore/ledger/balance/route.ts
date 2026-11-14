import { NextRequest, NextResponse } from 'next/server'
import { getMerchantIdWithDevFallback } from '@/lib/auth-context'
import { evoucherLedger } from '@/lib/grocore/evoucher/shared-instance'
export async function GET(request: NextRequest) {
  try { const t = await getMerchantIdWithDevFallback(request); if (!t) return NextResponse.json({ success: false, error: 'Auth required' }, { status: 401 })
    const account = new URL(request.url).searchParams.get('account')
    if (!account) return NextResponse.json({ success: false, error: 'account required' }, { status: 400 })
    const balance = await evoucherLedger.balance(t, account)
    return NextResponse.json({ success: true, account, balance: balance.toString() })
  } catch { return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 }) }
}
