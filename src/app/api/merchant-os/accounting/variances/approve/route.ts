import { NextRequest, NextResponse } from 'next/server'

// Types
interface VarianceRecord {
  id: string
  stocktakeId: string
  stocktakeDate: string
  productId: string
  productName: string
  sku: string
  category: string
  systemQty: number
  countedQty: number
  variance: number
  unitCost: number
  varianceValue: number
  status: 'pending' | 'approved' | 'rejected' | 'journal_created'
  approvedBy?: string
  approvedAt?: string
  journalEntryId?: string
  notes?: string
}

// POST /api/merchant-os/accounting/variances/approve - Approve variance(s)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Support single or batch approval
    const varianceIds = Array.isArray(body.varianceIds) ? body.varianceIds : [body.varianceId]

    if (varianceIds.length === 0 || varianceIds[0] === undefined) {
      return NextResponse.json({ error: 'varianceId or varianceIds is required' }, { status: 400 })
    }

    const results: { varianceId: string; status: string; journalEntryId?: string }[] = []

    for (const varianceId of varianceIds) {
      // In production, would update database
      // For now, just return success response
      
      const journalEntryId = `JE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Create journal entry for the approved variance
      const journalEntry = {
        id: journalEntryId,
        date: new Date().toISOString().split('T')[0],
        reference: `JE-2026-${String(Date.now()).slice(-6)}`,
        description: `Stocktake Variance - Approved`,
        eventType: 'stocktake_variance',
        lines: [], // Would be populated from variance data
        totalDebit: 0,
        totalCredit: 0,
        status: 'pending',
        createdBy: body.approvedBy || 'Current User',
        createdAt: new Date().toISOString()
      }

      results.push({
        varianceId,
        status: 'approved',
        journalEntryId
      })
    }

    return NextResponse.json({
      message: `${results.length} variance(s) approved`,
      results
    })
  } catch (error) {
    console.error('Error approving variances:', error)
    return NextResponse.json({ error: 'Failed to approve variances' }, { status: 500 })
  }
}
