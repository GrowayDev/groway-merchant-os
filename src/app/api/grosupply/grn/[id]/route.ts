import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/permissions'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * GET /api/grosupply/grn/[id]
 * Get a single Goods Received Note with full details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const permissionCheck = await checkPermission(request, 'can_view_inventory')
  
  if (!permissionCheck.allowed) {
    return permissionCheck.error
  }

  try {
    const { id } = params

    const grn = await db.goodsReceivedNote.findUnique({
      where: { id },
      include: {
        po: {
          include: {
            supplier: true,
            items: true,
          },
        },
        items: true,
      },
    })

    if (!grn) {
      return NextResponse.json(
        { error: 'GRN not found' },
        { status: 404 }
      )
    }

    // Calculate 3-way match status for each item
    const itemsWithMatchStatus = grn.items.map(item => {
      const poItem = grn.po.items.find(pi => pi.sku === item.sku)
      const orderedQty = poItem?.quantity || 0
      const invoiceQty = orderedQty // In real implementation, this would come from invoice
      const receivedQty = item.receivedQty

      // 3-way match: PO vs Invoice vs Received
      const poVsInvoiceVariance = invoiceQty - orderedQty
      const invoiceVsReceivedVariance = receivedQty - invoiceQty
      const poVsReceivedVariance = receivedQty - orderedQty

      return {
        ...item,
        orderedQty,
        invoiceQty,
        receivedQty,
        poVsInvoiceVariance,
        invoiceVsReceivedVariance,
        poVsReceivedVariance,
        matchStatus: {
          poVsInvoice: Math.abs(poVsInvoiceVariance) <= 0 ? 'matched' : 'discrepancy',
          invoiceVsReceived: Math.abs(invoiceVsReceivedVariance) <= 0 ? 'matched' : 'discrepancy',
          overall: Math.abs(poVsReceivedVariance) <= orderedQty * 0.05 ? 'matched' :
                   poVsReceivedVariance > 0 ? 'over_received' : 'under_received'
        }
      }
    })

    // Get related stock movements
    const stockMovements = await db.stockMovement.findMany({
      where: {
        referenceType: 'grn',
        referenceId: grn.id,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
        batch: {
          select: {
            id: true,
            batchNumber: true,
            expiryDate: true,
          },
        },
      },
    })

    // Get related batches
    const batches = await db.inventoryBatch.findMany({
      where: {
        sourceType: 'grn',
        sourceId: grn.id,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      grn: {
        ...grn,
        items: itemsWithMatchStatus,
        stockMovements,
        batches,
      },
    })
  } catch (error) {
    console.error('Get GRN error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch GRN' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/grosupply/grn/[id]
 * Update GRN status or mark as disputed
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const permissionCheck = await checkPermission(request, 'can_edit_grn')
  
  if (!permissionCheck.allowed) {
    return permissionCheck.error
  }

  try {
    const { id } = params
    const body = await request.json()
    const { status, discrepancyNotes } = body

    const grn = await db.goodsReceivedNote.findUnique({
      where: { id },
    })

    if (!grn) {
      return NextResponse.json(
        { error: 'GRN not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (status) updateData.status = status
    if (discrepancyNotes) updateData.discrepancyNotes = discrepancyNotes

    const updatedGrn = await db.goodsReceivedNote.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      grn: updatedGrn,
    })
  } catch (error) {
    console.error('Update GRN error:', error)
    return NextResponse.json(
      { error: 'Failed to update GRN' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/grosupply/grn/[id]
 * Reverse a GRN and rollback inventory changes
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const permissionCheck = await checkPermission(request, 'can_reverse_grn')
  
  if (!permissionCheck.allowed) {
    return permissionCheck.error
  }

  try {
    const { id } = params

    const grn = await db.goodsReceivedNote.findUnique({
      where: { id },
      include: {
        items: true,
      },
    })

    if (!grn) {
      return NextResponse.json(
        { error: 'GRN not found' },
        { status: 404 }
      )
    }

    // Run rollback in transaction
    await db.$transaction(async (tx) => {
      // Get all stock movements for this GRN
      const movements = await tx.stockMovement.findMany({
        where: {
          referenceType: 'grn',
          referenceId: grn.id,
        },
      })

      // Reverse each movement
      for (const movement of movements) {
        // Create reversal movement
        await tx.stockMovement.create({
          data: {
            merchantId: movement.merchantId,
            branchId: movement.branchId,
            productId: movement.productId,
            batchId: movement.batchId,
            idempotencyKey: `grn-reversal-${grn.id}-${movement.id}`,
            type: 'adjustment',
            direction: 'out',
            quantity: movement.quantity,
            previousStock: movement.newStock,
            newStock: movement.previousStock,
            unitCost: movement.unitCost,
            totalCost: movement.totalCost,
            referenceType: 'grn_reversal',
            referenceId: grn.id,
            referenceNumber: `REVERSAL-${grn.number}`,
            reason: `GRN ${grn.number} reversed`,
            performedBy: permissionCheck.session?.userId,
            performedByName: permissionCheck.session?.user?.name || 'System',
          },
        })

        // Update product stock
        await tx.product.update({
          where: { id: movement.productId },
          data: {
            currentStock: { decrement: movement.quantity },
          },
        })

        // If batch exists, update batch
        if (movement.batchId) {
          await tx.inventoryBatch.update({
            where: { id: movement.batchId },
            data: {
              currentQty: { decrement: movement.quantity },
              availableQty: { decrement: movement.quantity },
              status: 'depleted',
            },
          })
        }
      }

      // Mark GRN as cancelled
      await db.goodsReceivedNote.update({
        where: { id: grn.id },
        data: {
          status: 'cancelled',
          discrepancyNotes: 'GRN reversed - stock returned',
        },
      })
    })

    return NextResponse.json({
      success: true,
      message: 'GRN reversed successfully',
    })
  } catch (error) {
    console.error('Reverse GRN error:', error)
    return NextResponse.json(
      { error: 'Failed to reverse GRN', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
