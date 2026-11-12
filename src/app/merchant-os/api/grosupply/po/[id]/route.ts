import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/grosupply/po/[id] - Get Purchase Order details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const purchaseOrder = await db.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: {
          orderBy: { createdAt: 'asc' }
        },
        rfq: {
          include: {
            items: true
          }
        },
        quote: {
          include: {
            items: true
          }
        },
        grns: {
          include: {
            items: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!purchaseOrder) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    // Calculate receiving progress
    const totalOrdered = purchaseOrder.items.reduce((sum, item) => sum + item.quantity, 0)
    const totalReceived = purchaseOrder.items.reduce((sum, item) => sum + item.receivedQty, 0)
    const receivingProgress = totalOrdered > 0 ? (totalReceived / totalOrdered) * 100 : 0

    // Identify discrepancies
    const discrepancies = purchaseOrder.items
      .filter(item => item.receivedQty > 0 && item.receivedQty !== item.quantity)
      .map(item => ({
        sku: item.sku,
        description: item.description,
        ordered: item.quantity,
        received: item.receivedQty,
        rejected: item.rejectedQty,
        variance: item.receivedQty - item.quantity
      }))

    return NextResponse.json({ 
      purchaseOrder,
      receivingProgress,
      discrepancies
    })
  } catch (error) {
    console.error('Error fetching purchase order:', error)
    return NextResponse.json({ error: 'Failed to fetch purchase order' }, { status: 500 })
  }
}

// PUT /api/grosupply/po/[id] - Update Purchase Order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check if PO can be modified (only draft status)
    const existing = await db.purchaseOrder.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    // Update basic fields
    const purchaseOrder = await db.purchaseOrder.update({
      where: { id },
      data: {
        deliveryAddress: body.deliveryAddress,
        requestedDate: body.requestedDate,
        notes: body.notes,
        internalNotes: body.internalNotes,
        trackingNumber: body.trackingNumber,
        estimatedDelivery: body.estimatedDelivery
      },
      include: {
        items: true,
        supplier: true
      }
    })

    return NextResponse.json({ purchaseOrder })
  } catch (error) {
    console.error('Error updating purchase order:', error)
    return NextResponse.json({ error: 'Failed to update purchase order' }, { status: 500 })
  }
}

// DELETE /api/grosupply/po/[id] - Delete Purchase Order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const po = await db.purchaseOrder.findUnique({
      where: { id },
      include: {
        _count: {
          select: { grns: true }
        }
      }
    })

    if (!po) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    // Only allow deletion if draft
    if (po.status !== 'draft') {
      return NextResponse.json({ 
        error: 'Cannot delete PO that has been sent. Cancel instead.' 
      }, { status: 400 })
    }

    // Check for GRNs
    if (po._count.grns > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete PO with GRNs. Cancel instead.' 
      }, { status: 400 })
    }

    await db.purchaseOrder.delete({ where: { id } })
    return NextResponse.json({ message: 'Purchase order deleted successfully' })
  } catch (error) {
    console.error('Error deleting purchase order:', error)
    return NextResponse.json({ error: 'Failed to delete purchase order' }, { status: 500 })
  }
}
