import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/permissions'
import { FIFOService } from '@/services/inventory/fifo-service'

/**
 * GET /api/inventory/transfers
 * Get stock transfer history
 * 
 * Query params:
 * - merchantId: required
 * - status: optional (draft, pending, approved, in_transit, received, cancelled)
 * - branchId: optional (filter by source or destination)
 */
export async function GET(request: NextRequest) {
  const permissionCheck = await checkPermission(request, 'can_view_inventory')
  
  if (!permissionCheck.allowed) {
    return permissionCheck.error
  }

  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const status = searchParams.get('status')
    const branchId = searchParams.get('branchId')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    if (!merchantId) {
      return NextResponse.json(
        { error: 'merchantId is required' },
        { status: 400 }
      )
    }

    const where: any = { merchantId }

    if (status && status !== 'all') {
      where.status = status
    }

    if (branchId) {
      where.OR = [
        { fromBranchId: branchId },
        { toBranchId: branchId },
      ]
    }

    const transfers = await db.stockTransfer.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
        fromBranch: {
          select: { id: true, name: true, code: true, type: true },
        },
        toBranch: {
          select: { id: true, name: true, code: true, type: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    const total = await db.stockTransfer.count({ where })

    // Calculate stats
    const stats = {
      draft: await db.stockTransfer.count({ where: { merchantId, status: 'draft' } }),
      pending: await db.stockTransfer.count({ where: { merchantId, status: 'pending' } }),
      inTransit: await db.stockTransfer.count({ where: { merchantId, status: 'in_transit' } }),
      received: await db.stockTransfer.count({ where: { merchantId, status: 'received' } }),
    }

    return NextResponse.json({
      success: true,
      data: {
        transfers,
        stats,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('Get transfers error:', error)
    return NextResponse.json(
      { error: 'Failed to get transfers', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/inventory/transfers
 * Create a new stock transfer request
 */
export async function POST(request: NextRequest) {
  const permissionCheck = await checkPermission(request, 'can_create_transfer')
  
  if (!permissionCheck.allowed) {
    return permissionCheck.error
  }

  const session = permissionCheck.session!

  try {
    const body = await request.json()
    const {
      merchantId,
      fromBranchId,
      toBranchId,
      items,
      notes,
    } = body

    if (!merchantId || !fromBranchId || !toBranchId || !items || !items.length) {
      return NextResponse.json(
        { error: 'Missing required fields: merchantId, fromBranchId, toBranchId, items' },
        { status: 400 }
      )
    }

    if (fromBranchId === toBranchId) {
      return NextResponse.json(
        { error: 'Source and destination cannot be the same' },
        { status: 400 }
      )
    }

    // Validate stock availability
    for (const item of items) {
      const batches = await db.inventoryBatch.findMany({
        where: {
          merchantId,
          branchId: fromBranchId,
          productId: item.productId,
          status: 'active',
        },
        select: { availableQty: true },
      })

      const availableStock = batches.reduce((sum, b) => sum + b.availableQty, 0)

      if (availableStock < item.quantity) {
        const product = await db.product.findUnique({
          where: { id: item.productId },
          select: { name: true },
        })

        return NextResponse.json(
          { error: `Insufficient stock for ${product?.name || item.productId}. Available: ${availableStock}` },
          { status: 400 }
        )
      }
    }

    // Generate transfer code
    const count = await db.stockTransfer.count()
    const code = `TRF-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`

    // Calculate totals
    let totalValue = 0
    const itemsData = []

    for (const item of items) {
      const product = await db.product.findUnique({
        where: { id: item.productId },
        select: { name: true, sku: true, costPrice: true },
      })

      const unitCost = product?.costPrice || 0
      const lineTotal = item.quantity * unitCost
      totalValue += lineTotal

      itemsData.push({
        productId: item.productId,
        sku: product?.sku || '',
        productName: product?.name || '',
        quantityRequested: item.quantity,
        unit: item.unit || 'each',
        unitCost,
        totalValue: lineTotal,
      })
    }

    const transfer = await db.stockTransfer.create({
      data: {
        merchantId,
        code,
        fromBranchId,
        toBranchId,
        status: 'draft',
        itemsCount: items.length,
        totalValue,
        notes,
        requestedBy: session.userId,
        requestedByName: session.user?.name || 'System',
        requestedAt: new Date(),
        items: {
          create: itemsData,
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true },
            },
          },
        },
        fromBranch: true,
        toBranch: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Transfer request created',
      data: transfer,
    }, { status: 201 })
  } catch (error) {
    console.error('Create transfer error:', error)
    return NextResponse.json(
      { error: 'Failed to create transfer', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/inventory/transfers
 * Update transfer status (approve, ship, receive, cancel)
 */
export async function PUT(request: NextRequest) {
  const permissionCheck = await checkPermission(request, 'can_approve_transfer')
  
  if (!permissionCheck.allowed) {
    return permissionCheck.error
  }

  const session = permissionCheck.session!

  try {
    const body = await request.json()
    const { transferId, action, items, discrepancyNotes } = body

    if (!transferId || !action) {
      return NextResponse.json(
        { error: 'transferId and action are required' },
        { status: 400 }
      )
    }

    const transfer = await db.stockTransfer.findUnique({
      where: { id: transferId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!transfer) {
      return NextResponse.json(
        { error: 'Transfer not found' },
        { status: 404 }
      )
    }

    // Handle different actions
    switch (action) {
      case 'approve':
        return await handleApprove(transfer, session)

      case 'ship':
        return await handleShip(transfer, items, session)

      case 'receive':
        return await handleReceive(transfer, items, discrepancyNotes, session)

      case 'cancel':
        return await handleCancel(transfer, session)

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: approve, ship, receive, or cancel' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Update transfer error:', error)
    return NextResponse.json(
      { error: 'Failed to update transfer', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * Handle transfer approval
 */
async function handleApprove(transfer: any, session: any) {
  if (transfer.status !== 'draft' && transfer.status !== 'pending') {
    return NextResponse.json(
      { error: `Cannot approve transfer with status: ${transfer.status}` },
      { status: 400 }
    )
  }

  const updated = await db.stockTransfer.update({
    where: { id: transfer.id },
    data: {
      status: 'approved',
      approvedBy: session.userId,
      approvedByName: session.user?.name || 'System',
      approvedAt: new Date(),
    },
  })

  return NextResponse.json({
    success: true,
    message: 'Transfer approved',
    data: updated,
  })
}

/**
 * Handle transfer shipment - deduct from source
 */
async function handleShip(transfer: any, items: any[], session: any) {
  if (transfer.status !== 'approved') {
    return NextResponse.json(
      { error: `Cannot ship transfer with status: ${transfer.status}` },
      { status: 400 }
    )
  }

  const merchantId = transfer.merchantId
  const fromBranchId = transfer.fromBranchId

  try {
    await db.$transaction(async (tx) => {
      for (const transferItem of transfer.items) {
        const shippedQty = items?.find((i: any) => i.productId === transferItem.productId)?.quantity || transferItem.quantityRequested

        // Use FIFO to consume from source
        const fifoResult = await FIFOService.consumeFIFO({
          productId: transferItem.productId,
          branchId: fromBranchId,
          merchantId,
          quantity: shippedQty,
          type: 'transfer_out',
          referenceType: 'transfer',
          referenceId: transfer.id,
          referenceNumber: transfer.code,
          reason: `Transfer to ${transfer.toBranch?.name || 'another location'}`,
          performedBy: session.userId,
          performedByName: session.user?.name || 'System',
          idempotencyKey: `transfer-${transfer.id}-${transferItem.productId}`,
        })

        if (!fifoResult.success) {
          throw new Error(fifoResult.error || 'Failed to deduct stock')
        }

        // Update transfer item
        await tx.stockTransferItem.update({
          where: { id: transferItem.id },
          data: {
            quantitySent: shippedQty,
            unitCost: fifoResult.averageUnitCost,
            totalValue: shippedQty * fifoResult.averageUnitCost,
          },
        })
      }

      // Update transfer status
      await tx.stockTransfer.update({
        where: { id: transfer.id },
        data: {
          status: 'in_transit',
          dispatchedBy: session.userId,
          dispatchedByName: session.user?.name || 'System',
          dispatchedAt: new Date(),
          estimatedArrival: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day default
        },
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Transfer shipped successfully',
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to ship transfer' },
      { status: 500 }
    )
  }
}

/**
 * Handle transfer receipt - add to destination
 */
async function handleReceive(transfer: any, items: any[], discrepancyNotes: string, session: any) {
  if (transfer.status !== 'in_transit') {
    return NextResponse.json(
      { error: `Cannot receive transfer with status: ${transfer.status}` },
      { status: 400 }
    )
  }

  const merchantId = transfer.merchantId
  const toBranchId = transfer.toBranchId

  try {
    await db.$transaction(async (tx) => {
      for (const transferItem of transfer.items) {
        const receivedQty = items?.find((i: any) => i.productId === transferItem.productId)?.quantity || transferItem.quantitySent || 0

        if (receivedQty <= 0) continue

        const unitCost = transferItem.unitCost || 0

        // Create batch at destination
        const batchNumber = `TRF-${transfer.code}-${transferItem.sku}`
        const batch = await tx.inventoryBatch.create({
          data: {
            merchantId,
            branchId: toBranchId,
            productId: transferItem.productId,
            batchNumber,
            initialQty: receivedQty,
            currentQty: receivedQty,
            reservedQty: 0,
            availableQty: receivedQty,
            unitCost,
            totalValue: receivedQty * unitCost,
            status: 'active',
            sourceType: 'transfer',
            sourceId: transfer.id,
            receivedBy: session.userId,
            receivedByName: session.user?.name || 'System',
          },
        })

        // Create stock movement
        const product = await tx.product.findUnique({
          where: { id: transferItem.productId },
          select: { currentStock: true },
        })

        const previousStock = product?.currentStock || 0

        await tx.stockMovement.create({
          data: {
            merchantId,
            branchId: toBranchId,
            productId: transferItem.productId,
            batchId: batch.id,
            idempotencyKey: `transfer-receive-${transfer.id}-${transferItem.productId}`,
            type: 'transfer_in',
            direction: 'in',
            quantity: receivedQty,
            previousStock,
            newStock: previousStock + receivedQty,
            unitCost,
            totalCost: receivedQty * unitCost,
            referenceType: 'transfer',
            referenceId: transfer.id,
            referenceNumber: transfer.code,
            reason: `Received from ${transfer.fromBranch?.name || 'transfer'}`,
            performedBy: session.userId,
            performedByName: session.user?.name || 'System',
          },
        })

        // Update product stock
        await tx.product.update({
          where: { id: transferItem.productId },
          data: {
            currentStock: { increment: receivedQty },
          },
        })

        // Update transfer item
        await tx.stockTransferItem.update({
          where: { id: transferItem.id },
          data: {
            quantityReceived: receivedQty,
            discrepancyNotes,
          },
        })
      }

      // Update transfer status
      await tx.stockTransfer.update({
        where: { id: transfer.id },
        data: {
          status: 'received',
          receivedBy: session.userId,
          receivedByName: session.user?.name || 'System',
          receivedAt: new Date(),
          discrepancyNotes,
        },
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Transfer received successfully',
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to receive transfer' },
      { status: 500 }
    )
  }
}

/**
 * Handle transfer cancellation
 */
async function handleCancel(transfer: any, session: any) {
  if (transfer.status === 'received' || transfer.status === 'cancelled') {
    return NextResponse.json(
      { error: `Cannot cancel transfer with status: ${transfer.status}` },
      { status: 400 }
    )
  }

  const updateData: any = {
    status: 'cancelled',
    cancelledBy: session.userId,
    cancelledByName: session.user?.name || 'System',
    cancelledAt: new Date(),
  }

  // If in transit, we need to reverse the stock deduction
  if (transfer.status === 'in_transit') {
    // This would require reversing FIFO consumption - simplified here
    updateData.internalNotes = 'Cancelled after shipment - stock reversal required'
  }

  const updated = await db.stockTransfer.update({
    where: { id: transfer.id },
    data: updateData,
  })

  return NextResponse.json({
    success: true,
    message: 'Transfer cancelled',
    data: updated,
  })
}
