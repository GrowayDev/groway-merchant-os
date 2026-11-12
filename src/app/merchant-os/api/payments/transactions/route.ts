import { NextRequest, NextResponse } from 'next/server'
import { getMerchantIdWithDevFallback } from '@/lib/auth-context'

// GET /api/payments/transactions - List payment transactions
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

    // Return empty transactions for now
    const transactions: any[] = []

    return NextResponse.json({
      success: true,
      transactions,
      summary: {
        totalTransactions: 0,
        totalAmount: 0,
        totalFees: 0,
        approvedCount: 0,
        declinedCount: 0,
      }
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}
