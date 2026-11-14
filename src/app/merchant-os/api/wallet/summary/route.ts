import { NextRequest, NextResponse } from 'next/server'
import { getMerchantIdWithDevFallback } from '@/lib/auth-context'
import { getMerchantWalletSummary } from '@/lib/wallet-bridge'

// GET /merchant-os/api/wallet/summary — KPI tiles for the Consumer Wallets view
export async function GET(request: NextRequest) {
  try {
    const merchantId = await getMerchantIdWithDevFallback(request)
    if (!merchantId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }
    const summary = await getMerchantWalletSummary(merchantId)
    return NextResponse.json({ success: true, summary })
  } catch (error) {
    console.error('[wallet/summary GET] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load wallet summary' },
      { status: 500 }
    )
  }
}
