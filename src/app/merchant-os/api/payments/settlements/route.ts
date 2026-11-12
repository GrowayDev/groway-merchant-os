import { NextRequest, NextResponse } from 'next/server'
import { getMerchantIdWithDevFallback } from '@/lib/auth-context'

// GET /api/payments/settlements - List settlements
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

    const settlements: any[] = []

    return NextResponse.json({
      success: true,
      settlements,
      summary: {
        totalSettlements: 0,
        pendingAmount: 0,
        completedAmount: 0,
      }
    })
  } catch (error) {
    console.error('Error fetching settlements:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settlements' },
      { status: 500 }
    )
  }
}
