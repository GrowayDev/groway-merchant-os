import { NextRequest, NextResponse } from 'next/server'
import { getMerchantIdWithDevFallback } from '@/lib/auth-context'

// GET /api/accounting/vat-returns - List VAT returns
export async function GET(request: NextRequest) {
  try {
    // Get merchant ID from auth context with dev fallback
    const merchantId = getMerchantIdWithDevFallback(request)
    if (!merchantId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      }, { status: 401 })
    }

    // For now, return empty VAT returns
    // This can be enhanced with actual VAT return tracking model
    const vatReturns: any[] = []

    return NextResponse.json({
      success: true,
      vatReturns,
      summary: {
        totalReturns: 0,
        pendingReturns: 0,
        totalLiability: 0,
        totalRefunds: 0,
      }
    })
  } catch (error) {
    console.error('Error fetching VAT returns:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch VAT returns' },
      { status: 500 }
    )
  }
}
