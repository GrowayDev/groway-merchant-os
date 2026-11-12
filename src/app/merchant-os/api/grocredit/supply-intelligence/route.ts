import { NextRequest, NextResponse } from 'next/server'
import { getMerchantIdWithDevFallback } from '@/lib/auth-context'

export async function GET(request: NextRequest) {
  try {
    const merchantId = getMerchantIdWithDevFallback(request)
    if (!merchantId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ success: true, supplyIntelligence: null })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch supply intelligence' }, { status: 500 })
  }
}
