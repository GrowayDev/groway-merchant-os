import { NextRequest, NextResponse } from 'next/server'
import { getMerchantIdWithDevFallback } from '@/lib/auth-context'

// GET /api/payments/methods - List payment methods
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

    const methods: any[] = []

    return NextResponse.json({
      success: true,
      methods,
    })
  } catch (error) {
    console.error('Error fetching payment methods:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payment methods' },
      { status: 500 }
    )
  }
}
