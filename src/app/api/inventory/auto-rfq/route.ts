import { NextRequest, NextResponse } from 'next/server'
import { 
  processAutoRFQ,
  getReorderSuggestions,
  checkReorderPoints
} from '@/lib/auto-rfq-service'

/**
 * GET /api/inventory/auto-rfq
 * Get reorder suggestions and products at reorder point
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const branchId = searchParams.get('branchId')
    const includeSuppliers = searchParams.get('includeSuppliers') === 'true'

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
    }

    if (includeSuppliers) {
      const suggestions = await getReorderSuggestions(merchantId)
      return NextResponse.json({ 
        suggestions,
        count: suggestions.length,
        critical: suggestions.filter(s => s.urgency === 'critical').length,
        high: suggestions.filter(s => s.urgency === 'high').length
      })
    }

    const reorderItems = await checkReorderPoints(merchantId, branchId || undefined)
    
    // Calculate summary stats
    const summary = {
      total: reorderItems.length,
      outOfStock: reorderItems.filter(i => i.currentStock <= 0).length,
      critical: reorderItems.filter(i => i.urgency === 'critical').length,
      high: reorderItems.filter(i => i.urgency === 'high').length,
      normal: reorderItems.filter(i => i.urgency === 'normal').length,
      estimatedValue: reorderItems.reduce((sum, i) => sum + (i.estimatedCost || 0), 0)
    }

    return NextResponse.json({
      items: reorderItems,
      summary
    })
  } catch (error) {
    console.error('Error fetching reorder suggestions:', error)
    return NextResponse.json({ error: 'Failed to fetch reorder suggestions' }, { status: 500 })
  }
}

/**
 * POST /api/inventory/auto-rfq
 * Process auto-RFQ generation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      merchantId, 
      branchId, 
      minUrgency,
      autoCreate = false,
      userId,
      userName
    } = body

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
    }

    // Validate minUrgency if provided
    const validUrgencies = ['critical', 'high', 'normal']
    const urgency = minUrgency && validUrgencies.includes(minUrgency) 
      ? minUrgency as 'critical' | 'high' | 'normal'
      : undefined

    const result = await processAutoRFQ(merchantId, {
      branchId,
      minUrgency: urgency,
      autoCreate,
      userId,
      userName
    })

    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error) {
    console.error('Error processing auto-RFQ:', error)
    return NextResponse.json({ error: 'Failed to process auto-RFQ' }, { status: 500 })
  }
}
