import { NextRequest, NextResponse } from 'next/server'
import { getMerchantIdWithDevFallback } from '@/lib/auth-context'

// GET /api/payments/settlement-reports - List settlement reports
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

    const reports: any[] = []

    return NextResponse.json({
      success: true,
      reports,
    })
  } catch (error) {
    console.error('Error fetching settlement reports:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settlement reports' },
      { status: 500 }
    )
  }
}
