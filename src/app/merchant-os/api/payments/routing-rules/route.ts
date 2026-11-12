import { NextRequest, NextResponse } from 'next/server'
import { getMerchantIdWithDevFallback } from '@/lib/auth-context'

// GET /api/payments/routing-rules - List routing rules
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

    const rules: any[] = []

    return NextResponse.json({
      success: true,
      rules,
    })
  } catch (error) {
    console.error('Error fetching routing rules:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch routing rules' },
      { status: 500 }
    )
  }
}
