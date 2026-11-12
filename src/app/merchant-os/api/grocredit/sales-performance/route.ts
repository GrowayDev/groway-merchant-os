import { NextRequest, NextResponse } from 'next/server'
import { getMerchantIdWithDevFallback } from '@/lib/auth-context'

// GET /api/grocredit/sales-performance
export async function GET(request: NextRequest) {
  try {
    const merchantId = getMerchantIdWithDevFallback(request)
    if (!merchantId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    // Return null for new tenants - actual sales data comes from POS/Analytics integration
    return NextResponse.json({
      success: true,
      salesPerformance: null
    })
  } catch (error) {
    console.error('Error fetching sales performance:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch sales performance' }, { status: 500 })
  }
}
