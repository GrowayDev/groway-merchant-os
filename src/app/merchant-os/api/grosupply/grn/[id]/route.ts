import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/grosupply/grn/[id] - Get GRN details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const grn = await db.goodsReceivedNote.findUnique({
      where: { id },
      include: {
        po: {
          include: {
            supplier: true,
            items: true
          }
        },
        items: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!grn) {
      return NextResponse.json({ error: 'GRN not found' }, { status: 404 })
    }

    // Calculate variance analysis
    const varianceAnalysis = grn.items.map(item => {
      const poItem = grn.po.items.find(pi => pi.sku === item.sku)
      return {
        sku: item.sku,
        description: item.description,
        ordered: item.orderedQty,
        received: item.receivedQty,
        rejected: item.rejectedQty,
        variance: item.receivedQty - item.orderedQty,
        variancePercentage: item.orderedQty > 0 
          ? ((item.receivedQty - item.orderedQty) / item.orderedQty) * 100 
          : 0,
        rejectReason: item.rejectReason,
        unitPrice: item.unitPrice,
        totalValue: item.receivedQty * item.unitPrice,
        unit: poItem?.unit || 'each'
      }
    })

    // Summary
    const summary = {
      totalOrdered: grn.items.reduce((sum, i) => sum + i.orderedQty, 0),
      totalReceived: grn.items.reduce((sum, i) => sum + i.receivedQty, 0),
      totalRejected: grn.items.reduce((sum, i) => sum + i.rejectedQty, 0),
      totalValue: grn.items.reduce((sum, i) => sum + (i.receivedQty * i.unitPrice), 0),
      itemsWithVariance: varianceAnalysis.filter(v => v.variance !== 0).length,
      itemsRejected: varianceAnalysis.filter(v => v.rejected > 0).length
    }

    return NextResponse.json({ 
      grn,
      varianceAnalysis,
      summary
    })
  } catch (error) {
    console.error('Error fetching GRN:', error)
    return NextResponse.json({ error: 'Failed to fetch GRN' }, { status: 500 })
  }
}

// PUT /api/grosupply/grn/[id] - Update GRN items
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check GRN status
    const existing = await db.goodsReceivedNote.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'GRN not found' }, { status: 404 })
    }

    if (existing.status === 'completed') {
      return NextResponse.json({ 
        error: 'Cannot modify completed GRN' 
      }, { status: 400 })
    }

    // Update GRN
    const grn = await db.goodsReceivedNote.update({
      where: { id },
      data: {
        receivedBy: body.receivedBy,
        notes: body.notes,
        discrepancyNotes: body.discrepancyNotes
      }
    })

    // Update items if provided
    if (body.items && Array.isArray(body.items)) {
      for (const itemUpdate of body.items) {
        await db.gRNItem.update({
          where: { id: itemUpdate.id },
          data: {
            receivedQty: itemUpdate.receivedQty,
            rejectedQty: itemUpdate.rejectedQty || 0,
            rejectReason: itemUpdate.rejectReason,
            batchNumber: itemUpdate.batchNumber,
            expiryDate: itemUpdate.expiryDate
          }
        })
      }
    }

    const updatedGrn = await db.goodsReceivedNote.findUnique({
      where: { id },
      include: {
        items: true,
        po: {
          include: { supplier: true }
        }
      }
    })

    return NextResponse.json({ grn: updatedGrn })
  } catch (error) {
    console.error('Error updating GRN:', error)
    return NextResponse.json({ error: 'Failed to update GRN' }, { status: 500 })
  }
}

// DELETE /api/grosupply/grn/[id] - Delete GRN (draft only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const grn = await db.goodsReceivedNote.findUnique({
      where: { id }
    })

    if (!grn) {
      return NextResponse.json({ error: 'GRN not found' }, { status: 404 })
    }

    if (grn.status !== 'draft') {
      return NextResponse.json({ 
        error: 'Cannot delete non-draft GRN' 
      }, { status: 400 })
    }

    await db.goodsReceivedNote.delete({ where: { id } })
    return NextResponse.json({ message: 'GRN deleted successfully' })
  } catch (error) {
    console.error('Error deleting GRN:', error)
    return NextResponse.json({ error: 'Failed to delete GRN' }, { status: 500 })
  }
}
