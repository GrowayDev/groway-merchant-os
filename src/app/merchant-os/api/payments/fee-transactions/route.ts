import { NextRequest, NextResponse } from 'next/server'
import { getMerchantIdWithDevFallback } from '@/lib/auth-context'

// GET /api/payments/fee-transactions - List fee transactions
export async function GET(request: NextRequest) {
  try {
    const merchantId = getMerchantIdWithDevFallback(request)
    if (!merchantId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      }, { status: 401 })
    }

    const fees: any[] = []

    return NextResponse.json({
      success: true,
      fees,
      summary: {
        totalFees: 0,
        feeCount: 0,
      }
    })
  } catch (error) {
    console.error('Error fetching fee transactions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch fee transactions' },
      { status: 500 }
    )
  }
}
