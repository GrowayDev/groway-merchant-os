import { NextRequest, NextResponse } from 'next/server'

// Types for 3-way matching
interface MatchItem {
  sku: string
  description: string
  // PO data
  poQuantity: number
  poUnitPrice: number
  poTotal: number
  // Quote data
  quotedQuantity: number
  quotedUnitPrice: number
  quotedTotal: number
  // GRN data
  receivedQuantity: number
  rejectedQuantity: number
  receivedTotal: number
  // Match calculations
  quantityMatch: 'match' | 'within_tolerance' | 'mismatch'
  priceMatch: 'match' | 'within_tolerance' | 'mismatch'
  quantityVariance: number
  priceVariance: number
}

interface ThreeWayMatch {
  id: string
  poId: string
  poNumber: string
  status: 'matched' | 'partial' | 'mismatch' | 'pending'
  supplier: string
  orderDate: string
  items: MatchItem[]
  overallMatch: number
  variances: {
    type: 'quantity' | 'price' | 'product'
    sku: string
    description: string
    expected: number | string
    actual: number | string
    variance: number | string
    percentage: number
    requiresAction: boolean
  }[]
  requiresApproval: boolean
}

// Tolerance thresholds (South African standard)
const QUANTITY_TOLERANCE = 0.05 // 5%
const PRICE_TOLERANCE = 0.02 // 2%

// Calculate match status for quantity
function calculateQuantityMatch(ordered: number, received: number): 'match' | 'within_tolerance' | 'mismatch' {
  if (ordered === received) return 'match'
  
  const variance = Math.abs(received - ordered) / ordered
  if (variance <= QUANTITY_TOLERANCE) return 'within_tolerance'
  return 'mismatch'
}

// Calculate match status for price
function calculatePriceMatch(ordered: number, quoted: number): 'match' | 'within_tolerance' | 'mismatch' {
  if (ordered === quoted) return 'match'
  
  const variance = Math.abs(quoted - ordered) / ordered
  if (variance <= PRICE_TOLERANCE) return 'within_tolerance'
  return 'mismatch'
}

// GET /api/merchant-os/grosupply/three-way-match - Get pending matches
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const supplierId = searchParams.get('supplierId')

    // In production, fetch from database with actual PO, Quote, GRN data
    const matches: ThreeWayMatch[] = [
      {
        id: 'twm-001',
        poId: 'po-001',
        poNumber: 'PO-2026-0023',
        status: 'matched',
        supplier: 'Cape Fresh Produce',
        orderDate: '2026-02-17',
        items: [
          {
            sku: 'TOMATO-1KG',
            description: 'Fresh Tomatoes',
            poQuantity: 20,
            poUnitPrice: 25.00,
            poTotal: 500,
            quotedQuantity: 20,
            quotedUnitPrice: 25.00,
            quotedTotal: 500,
            receivedQuantity: 20,
            rejectedQuantity: 0,
            receivedTotal: 500,
            quantityMatch: 'match',
            priceMatch: 'match',
            quantityVariance: 0,
            priceVariance: 0,
          },
          {
            sku: 'ONION-1KG',
            description: 'Brown Onions',
            poQuantity: 15,
            poUnitPrice: 18.00,
            poTotal: 270,
            quotedQuantity: 15,
            quotedUnitPrice: 18.00,
            quotedTotal: 270,
            receivedQuantity: 14,
            rejectedQuantity: 1,
            receivedTotal: 252,
            quantityMatch: 'within_tolerance',
            priceMatch: 'match',
            quantityVariance: -1,
            priceVariance: 0,
          },
        ],
        overallMatch: 100,
        variances: [],
        requiresApproval: false,
      },
      {
        id: 'twm-002',
        poId: 'po-002',
        poNumber: 'PO-2026-0024',
        status: 'mismatch',
        supplier: 'Metro Wholesale',
        orderDate: '2026-02-18',
        items: [
          {
            sku: 'COKE-330',
            description: 'Coca-Cola 330ml',
            poQuantity: 100,
            poUnitPrice: 8.50,
            poTotal: 850,
            quotedQuantity: 100,
            quotedUnitPrice: 8.50,
            quotedTotal: 850,
            receivedQuantity: 95,
            rejectedQuantity: 5,
            receivedTotal: 807.50,
            quantityMatch: 'within_tolerance',
            priceMatch: 'match',
            quantityVariance: -5,
            priceVariance: 0,
          },
        ],
        overallMatch: 85,
        variances: [
          {
            type: 'quantity',
            sku: 'COKE-330',
            description: 'Coca-Cola 330ml',
            expected: 100,
            actual: 95,
            variance: -5,
            percentage: 5,
            requiresAction: true,
          },
        ],
        requiresApproval: true,
      },
    ]

    // Filter by status if provided
    const filteredMatches = status 
      ? matches.filter(m => m.status === status)
      : matches

    // Stats
    const stats = {
      total: filteredMatches.length,
      matched: filteredMatches.filter(m => m.status === 'matched').length,
      partial: filteredMatches.filter(m => m.status === 'partial').length,
      mismatch: filteredMatches.filter(m => m.status === 'mismatch').length,
      pendingApproval: filteredMatches.filter(m => m.requiresApproval).length,
      averageMatchScore: filteredMatches.length > 0 
        ? Math.round(filteredMatches.reduce((sum, m) => sum + m.overallMatch, 0) / filteredMatches.length)
        : 0,
    }

    return NextResponse.json({
      matches: filteredMatches,
      stats,
      tolerances: {
        quantity: `${QUANTITY_TOLERANCE * 100}%`,
        price: `${PRICE_TOLERANCE * 100}%`,
      },
    })
  } catch (error) {
    console.error('Error fetching 3-way matches:', error)
    return NextResponse.json({ error: 'Failed to fetch 3-way matches' }, { status: 500 })
  }
}

// POST /api/merchant-os/grosupply/three-way-match - Process match
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Create new 3-way match from PO, Quote, and GRN data
    if (body.action === 'create') {
      const { poId, quoteId, grnId } = body

      // In production:
      // 1. Fetch PO, Quote, and GRN from database
      // 2. Compare items
      // 3. Calculate match scores
      // 4. Identify variances
      // 5. Store match record

      const match: ThreeWayMatch = {
        id: `twm-${Date.now()}`,
        poId,
        poNumber: body.poNumber,
        status: 'pending',
        supplier: body.supplier,
        orderDate: body.orderDate,
        items: body.items.map((item: any) => ({
          ...item,
          quantityMatch: calculateQuantityMatch(item.poQuantity, item.receivedQuantity),
          priceMatch: calculatePriceMatch(item.poUnitPrice, item.quotedUnitPrice),
          quantityVariance: item.receivedQuantity - item.poQuantity,
          priceVariance: item.quotedUnitPrice - item.poUnitPrice,
        })),
        overallMatch: 0,
        variances: [],
        requiresApproval: false,
      }

      // Calculate overall match score
      const totalItems = match.items.length
      const matchedItems = match.items.filter(i => 
        i.quantityMatch === 'match' && i.priceMatch === 'match'
      ).length
      const partialItems = match.items.filter(i => 
        i.quantityMatch === 'within_tolerance' || i.priceMatch === 'within_tolerance'
      ).length

      match.overallMatch = Math.round((matchedItems + (partialItems * 0.8)) / totalItems * 100)
      match.status = match.overallMatch >= 95 ? 'matched' : match.overallMatch >= 80 ? 'partial' : 'mismatch'
      match.requiresApproval = match.status === 'mismatch'

      return NextResponse.json({ match }, { status: 201 })
    }

    // Approve mismatch
    if (body.action === 'approve') {
      const { matchId, approvedBy, notes } = body

      // In production, update match status in database
      console.log(`Match ${matchId} approved by ${approvedBy}`)

      return NextResponse.json({
        message: 'Match approved',
        matchId,
        approvedBy,
        approvedAt: new Date().toISOString(),
      })
    }

    // Reject and create dispute
    if (body.action === 'dispute') {
      const { matchId, reason, disputeDetails } = body

      // In production:
      // 1. Create dispute record
      // 2. Notify supplier
      // 3. Update match status

      return NextResponse.json({
        message: 'Dispute created',
        matchId,
        disputeId: `dispute-${Date.now()}`,
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error processing 3-way match:', error)
    return NextResponse.json({ error: 'Failed to process 3-way match' }, { status: 500 })
  }
}
