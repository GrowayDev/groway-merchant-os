import { NextRequest, NextResponse } from 'next/server'
import { getMerchantIdWithDevFallback } from '@/lib/auth-context'

// GET /api/payments/processors - List payment processors
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

    // Return empty processors for now
    // This can be enhanced with actual processor configuration from database
    const processors: any[] = []

    return NextResponse.json({
      success: true,
      processors,
      summary: {
        totalProcessors: 0,
        activeProcessors: 0,
        totalVolume: 0,
        totalTransactions: 0,
      }
    })
  } catch (error) {
    console.error('Error fetching processors:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch processors' },
      { status: 500 }
    )
  }
}
