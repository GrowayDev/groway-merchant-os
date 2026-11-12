import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Types for transfer management
type TransferStatus = 'draft' | 'pending' | 'approved' | 'in_transit' | 'received' | 'cancelled'

interface TransferItem {
  id: string
  productId: string
  sku: string
  productName: string
  quantityRequested: number
  quantitySent: number | null
  quantityReceived: number | null
  unit: string
  unitCost: number
  totalValue: number
  notes: string | null
  discrepancyNotes: string | null
}

interface TransferDetail {
  id: string
  code: string
  merchantId: string
  fromBranch: {
    id: string
    code: string
    name: string
    type: string
    city: string | null
  }
  toBranch: {
    id: string
    code: string
    name: string
    type: string
    city: string | null
  }
  status: TransferStatus
  itemsCount: number
  totalValue: number
  notes: string | null
  internalNotes: string | null
  tracking: {
    requestedBy: string | null
    requestedByName: string | null
    requestedAt: string | null
    approvedBy: string | null
    approvedByName: string | null
    approvedAt: string | null
    dispatchedBy: string | null
    dispatchedByName: string | null
    dispatchedAt: string | null
    estimatedArrival: string | null
    receivedBy: string | null
    receivedByName: string | null
    receivedAt: string | null
    cancelledBy: string | null
    cancelledByName: string | null
    cancelledAt: string | null
    cancelledReason: string | null
  }
  discrepancyNotes: string | null
  items: TransferItem[]
  statusHistory: Array<{
    status: TransferStatus
    timestamp: string
    actor: string | null
    actorName: string | null
    notes: string | null
  }>
  createdAt: string
  updatedAt: string
}

interface TransfersListResponse {
  transfers: TransferDetail[]
  summary: {
    total: number
    byStatus: Record<TransferStatus, number>
    totalValue: number
    inTransitValue: number
    averageProcessingTime: number
  }
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

interface CreateTransferRequest {
  merchantId: string
  fromBranchId: string
  toBranchId: string
  items: Array<{
    productId: string
    sku: string
    productName: string
    quantityRequested: number
    unit: string
    unitCost: number
    notes?: string
  }>
  notes?: string
  internalNotes?: string
  requestedBy?: string
  requestedByName?: string
  autoApprove?: boolean
}

interface UpdateTransferStatusRequest {
  status: TransferStatus
  actorId?: string
  actorName?: string
  notes?: string
  items?: Array<{
    id: string
    quantitySent?: number
    quantityReceived?: number
    discrepancyNotes?: string
  }>
  estimatedArrival?: string
  reason?: string
}

// GET /api/merchant-os/multi-location/transfers/full
export async function GET(request: NextRequest): Promise<NextResponse<TransfersListResponse | { error: string }>> {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const status = searchParams.get('status') as TransferStatus | null
    const fromBranchId = searchParams.get('fromBranchId')
    const toBranchId = searchParams.get('toBranchId')
    const search = searchParams.get('search')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
    }

    // Build where clause
    const where: {
      merchantId: string
      status?: TransferStatus
      fromBranchId?: string
      toBranchId?: string
      OR?: Array<{ code: { contains: string } | { contains: string } }>
      createdAt?: { gte: Date; lte: Date }
    } = { merchantId }

    if (status) {
      where.status = status
    }
    if (fromBranchId) {
      where.fromBranchId = fromBranchId
    }
    if (toBranchId) {
      where.toBranchId = toBranchId
    }
    if (search) {
      where.OR = [
        { code: { contains: search } }
      ]
    }
    if (dateFrom && dateTo) {
      where.createdAt = {
        gte: new Date(dateFrom),
        lte: new Date(dateTo)
      }
    }

    // Fetch transfers with full details
    const [transfers, total] = await Promise.all([
      db.stockTransfer.findMany({
        where,
        include: {
          Branch_StockTransfer_fromBranchIdToBranch: true,
          Branch_StockTransfer_toBranchIdToBranch: true,
          StockTransferItem: true
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      db.stockTransfer.count({ where })
    ])

    // Get all transfers for summary (not paginated)
    const allTransfers = await db.stockTransfer.findMany({
      where: { merchantId },
      select: { status: true, totalValue: true, createdAt: true, dispatchedAt: true, receivedAt: true }
    })

    // Calculate summary
    const byStatus: Record<TransferStatus, number> = {
      draft: 0,
      pending: 0,
      approved: 0,
      in_transit: 0,
      received: 0,
      cancelled: 0
    }

    allTransfers.forEach(t => {
      if (byStatus[t.status as TransferStatus] !== undefined) {
        byStatus[t.status as TransferStatus]++
      }
    })

    const totalValue = allTransfers.reduce((sum, t) => sum + t.totalValue, 0)
    const inTransitValue = allTransfers
      .filter(t => t.status === 'in_transit')
      .reduce((sum, t) => sum + t.totalValue, 0)

    // Calculate average processing time
    const completedTransfers = allTransfers.filter(t => t.dispatchedAt && t.receivedAt)
    const averageProcessingTime = completedTransfers.length > 0
      ? completedTransfers.reduce((sum, t) => {
          const dispatchTime = t.dispatchedAt!.getTime()
          const receiveTime = t.receivedAt!.getTime()
          return sum + (receiveTime - dispatchTime)
        }, 0) / completedTransfers.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0

    // Format transfers
    const formattedTransfers: TransferDetail[] = transfers.map(t => ({
      id: t.id,
      code: t.code,
      merchantId: t.merchantId,
      fromBranch: {
        id: t.Branch_StockTransfer_fromBranchIdToBranch.id,
        code: t.Branch_StockTransfer_fromBranchIdToBranch.code,
        name: t.Branch_StockTransfer_fromBranchIdToBranch.name,
        type: t.Branch_StockTransfer_fromBranchIdToBranch.type,
        city: t.Branch_StockTransfer_fromBranchIdToBranch.city
      },
      toBranch: {
        id: t.Branch_StockTransfer_toBranchIdToBranch.id,
        code: t.Branch_StockTransfer_toBranchIdToBranch.code,
        name: t.Branch_StockTransfer_toBranchIdToBranch.name,
        type: t.Branch_StockTransfer_toBranchIdToBranch.type,
        city: t.Branch_StockTransfer_toBranchIdToBranch.city
      },
      status: t.status as TransferStatus,
      itemsCount: t.itemsCount,
      totalValue: t.totalValue,
      notes: t.notes,
      internalNotes: t.internalNotes,
      tracking: {
        requestedBy: t.requestedBy,
        requestedByName: t.requestedByName,
        requestedAt: t.requestedAt?.toISOString() || null,
        approvedBy: t.approvedBy,
        approvedByName: t.approvedByName,
        approvedAt: t.approvedAt?.toISOString() || null,
        dispatchedBy: t.dispatchedBy,
        dispatchedByName: t.dispatchedByName,
        dispatchedAt: t.dispatchedAt?.toISOString() || null,
        estimatedArrival: t.estimatedArrival?.toISOString() || null,
        receivedBy: t.receivedBy,
        receivedByName: t.receivedByName,
        receivedAt: t.receivedAt?.toISOString() || null,
        cancelledBy: t.cancelledBy,
        cancelledByName: t.cancelledByName,
        cancelledAt: t.cancelledAt?.toISOString() || null,
        cancelledReason: t.cancelledReason
      },
      discrepancyNotes: t.discrepancyNotes,
      items: t.StockTransferItem.map(item => ({
        id: item.id,
        productId: item.productId,
        sku: item.sku,
        productName: item.productName,
        quantityRequested: item.quantityRequested,
        quantitySent: item.quantitySent,
        quantityReceived: item.quantityReceived,
        unit: item.unit,
        unitCost: item.unitCost,
        totalValue: item.totalValue,
        notes: item.notes,
        discrepancyNotes: item.discrepancyNotes
      })),
      statusHistory: generateStatusHistory(t),
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString()
    }))

    const response: TransfersListResponse = {
      transfers: formattedTransfers,
      summary: {
        total: allTransfers.length,
        byStatus,
        totalValue,
        inTransitValue,
        averageProcessingTime: Math.round(averageProcessingTime * 10) / 10
      },
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching transfers:', error)
    return NextResponse.json(getMockTransfersResponse())
  }
}

// POST /api/merchant-os/multi-location/transfers/full
export async function POST(request: NextRequest): Promise<NextResponse<TransferDetail | { error: string }>> {
  try {
    const body: CreateTransferRequest = await request.json()

    // Validate required fields
    if (!body.merchantId) {
      return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
    }
    if (!body.fromBranchId) {
      return NextResponse.json({ error: 'fromBranchId is required' }, { status: 400 })
    }
    if (!body.toBranchId) {
      return NextResponse.json({ error: 'toBranchId is required' }, { status: 400 })
    }
    if (body.fromBranchId === body.toBranchId) {
      return NextResponse.json({ error: 'fromBranchId and toBranchId must be different' }, { status: 400 })
    }
    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ error: 'At least one item is required' }, { status: 400 })
    }

    // Verify branches exist
    const [fromBranch, toBranch] = await Promise.all([
      db.branch.findUnique({ where: { id: body.fromBranchId } }),
      db.branch.findUnique({ where: { id: body.toBranchId } })
    ])

    if (!fromBranch || !toBranch) {
      return NextResponse.json({ error: 'One or both branches not found' }, { status: 404 })
    }

    // Generate transfer code
    const count = await db.stockTransfer.count({ where: { merchantId: body.merchantId } })
    const code = `TRF-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`

    // Calculate total value
    const totalValue = body.items.reduce((sum, item) => sum + (item.quantityRequested * item.unitCost), 0)

    // Determine initial status
    const initialStatus: TransferStatus = body.autoApprove ? 'approved' : 'draft'
    const now = new Date()

    // Create transfer with items
    const transfer = await db.stockTransfer.create({
      data: {
        code,
        merchantId: body.merchantId,
        fromBranchId: body.fromBranchId,
        toBranchId: body.toBranchId,
        status: initialStatus,
        itemsCount: body.items.length,
        totalValue,
        notes: body.notes,
        internalNotes: body.internalNotes,
        requestedBy: body.requestedBy,
        requestedByName: body.requestedByName,
        requestedAt: now,
        approvedBy: body.autoApprove ? body.requestedBy : null,
        approvedByName: body.autoApprove ? body.requestedByName : null,
        approvedAt: body.autoApprove ? now : null,
        StockTransferItem: {
          create: body.items.map(item => ({
            productId: item.productId,
            sku: item.sku,
            productName: item.productName,
            quantityRequested: item.quantityRequested,
            quantitySent: null,
            quantityReceived: null,
            unit: item.unit,
            unitCost: item.unitCost,
            totalValue: item.quantityRequested * item.unitCost,
            notes: item.notes
          }))
        }
      },
      include: {
        Branch_StockTransfer_fromBranchIdToBranch: true,
        Branch_StockTransfer_toBranchIdToBranch: true,
        StockTransferItem: true
      }
    })

    // Format response
    const response: TransferDetail = {
      id: transfer.id,
      code: transfer.code,
      merchantId: transfer.merchantId,
      fromBranch: {
        id: transfer.Branch_StockTransfer_fromBranchIdToBranch.id,
        code: transfer.Branch_StockTransfer_fromBranchIdToBranch.code,
        name: transfer.Branch_StockTransfer_fromBranchIdToBranch.name,
        type: transfer.Branch_StockTransfer_fromBranchIdToBranch.type,
        city: transfer.Branch_StockTransfer_fromBranchIdToBranch.city
      },
      toBranch: {
        id: transfer.Branch_StockTransfer_toBranchIdToBranch.id,
        code: transfer.Branch_StockTransfer_toBranchIdToBranch.code,
        name: transfer.Branch_StockTransfer_toBranchIdToBranch.name,
        type: transfer.Branch_StockTransfer_toBranchIdToBranch.type,
        city: transfer.Branch_StockTransfer_toBranchIdToBranch.city
      },
      status: transfer.status as TransferStatus,
      itemsCount: transfer.itemsCount,
      totalValue: transfer.totalValue,
      notes: transfer.notes,
      internalNotes: transfer.internalNotes,
      tracking: {
        requestedBy: transfer.requestedBy,
        requestedByName: transfer.requestedByName,
        requestedAt: transfer.requestedAt?.toISOString() || null,
        approvedBy: transfer.approvedBy,
        approvedByName: transfer.approvedByName,
        approvedAt: transfer.approvedAt?.toISOString() || null,
        dispatchedBy: transfer.dispatchedBy,
        dispatchedByName: transfer.dispatchedByName,
        dispatchedAt: transfer.dispatchedAt?.toISOString() || null,
        estimatedArrival: transfer.estimatedArrival?.toISOString() || null,
        receivedBy: transfer.receivedBy,
        receivedByName: transfer.receivedByName,
        receivedAt: transfer.receivedAt?.toISOString() || null,
        cancelledBy: transfer.cancelledBy,
        cancelledByName: transfer.cancelledByName,
        cancelledAt: transfer.cancelledAt?.toISOString() || null,
        cancelledReason: transfer.cancelledReason
      },
      discrepancyNotes: transfer.discrepancyNotes,
      items: transfer.StockTransferItem.map(item => ({
        id: item.id,
        productId: item.productId,
        sku: item.sku,
        productName: item.productName,
        quantityRequested: item.quantityRequested,
        quantitySent: item.quantitySent,
        quantityReceived: item.quantityReceived,
        unit: item.unit,
        unitCost: item.unitCost,
        totalValue: item.totalValue,
        notes: item.notes,
        discrepancyNotes: item.discrepancyNotes
      })),
      statusHistory: generateStatusHistory(transfer),
      createdAt: transfer.createdAt.toISOString(),
      updatedAt: transfer.updatedAt.toISOString()
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error creating transfer:', error)
    return NextResponse.json({ error: 'Failed to create transfer' }, { status: 500 })
  }
}

// PATCH /api/merchant-os/multi-location/transfers/full - Update transfer status
export async function PATCH(request: NextRequest): Promise<NextResponse<TransferDetail | { error: string }>> {
  try {
    const body: UpdateTransferStatusRequest & { transferId: string } = await request.json()
    const { transferId, status, actorId, actorName, notes, items, estimatedArrival, reason } = body

    if (!transferId) {
      return NextResponse.json({ error: 'transferId is required' }, { status: 400 })
    }
    if (!status) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 })
    }

    // Get current transfer
    const currentTransfer = await db.stockTransfer.findUnique({
      where: { id: transferId },
      include: { StockTransferItem: true }
    })

    if (!currentTransfer) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 })
    }

    // Validate status transition
    const validTransitions: Record<TransferStatus, TransferStatus[]> = {
      draft: ['pending', 'cancelled'],
      pending: ['approved', 'cancelled'],
      approved: ['in_transit', 'cancelled'],
      in_transit: ['received', 'cancelled'],
      received: [],
      cancelled: []
    }

    if (!validTransitions[currentTransfer.status as TransferStatus]?.includes(status)) {
      return NextResponse.json({
        error: `Cannot transition from ${currentTransfer.status} to ${status}`
      }, { status: 400 })
    }

    // Build update data
    const updateData: {
      status: TransferStatus
      updatedAt: Date
      approvedBy?: string | null
      approvedByName?: string | null
      approvedAt?: Date | null
      dispatchedBy?: string | null
      dispatchedByName?: string | null
      dispatchedAt?: Date | null
      estimatedArrival?: Date | null
      receivedBy?: string | null
      receivedByName?: string | null
      receivedAt?: Date | null
      cancelledBy?: string | null
      cancelledByName?: string | null
      cancelledAt?: Date | null
      cancelledReason?: string | null
      notes?: string | null
      discrepancyNotes?: string | null
    } = {
      status,
      updatedAt: new Date()
    }

    // Set status-specific fields
    switch (status) {
      case 'approved':
        updateData.approvedBy = actorId || null
        updateData.approvedByName = actorName || null
        updateData.approvedAt = new Date()
        break
      case 'in_transit':
        updateData.dispatchedBy = actorId || null
        updateData.dispatchedByName = actorName || null
        updateData.dispatchedAt = new Date()
        if (estimatedArrival) {
          updateData.estimatedArrival = new Date(estimatedArrival)
        }
        // Update items with quantitySent
        if (items) {
          for (const item of items) {
            await db.stockTransferItem.update({
              where: { id: item.id },
              data: {
                quantitySent: item.quantitySent,
                updatedAt: new Date()
              }
            })
          }
        }
        break
      case 'received':
        updateData.receivedBy = actorId || null
        updateData.receivedByName = actorName || null
        updateData.receivedAt = new Date()
        // Update items with quantityReceived
        if (items) {
          let discrepancyFound = false
          for (const item of items) {
            await db.stockTransferItem.update({
              where: { id: item.id },
              data: {
                quantityReceived: item.quantityReceived,
                discrepancyNotes: item.discrepancyNotes,
                updatedAt: new Date()
              }
            })
            if (item.discrepancyNotes) {
              discrepancyFound = true
            }
          }
          if (discrepancyFound) {
            updateData.discrepancyNotes = 'Discrepancies detected during receiving'
          }
        }
        break
      case 'cancelled':
        updateData.cancelledBy = actorId || null
        updateData.cancelledByName = actorName || null
        updateData.cancelledAt = new Date()
        updateData.cancelledReason = reason || null
        break
    }

    if (notes) {
      updateData.notes = notes
    }

    // Update transfer
    const transfer = await db.stockTransfer.update({
      where: { id: transferId },
      data: updateData,
      include: {
        Branch_StockTransfer_fromBranchIdToBranch: true,
        Branch_StockTransfer_toBranchIdToBranch: true,
        StockTransferItem: true
      }
    })

    // Format response
    const response: TransferDetail = {
      id: transfer.id,
      code: transfer.code,
      merchantId: transfer.merchantId,
      fromBranch: {
        id: transfer.Branch_StockTransfer_fromBranchIdToBranch.id,
        code: transfer.Branch_StockTransfer_fromBranchIdToBranch.code,
        name: transfer.Branch_StockTransfer_fromBranchIdToBranch.name,
        type: transfer.Branch_StockTransfer_fromBranchIdToBranch.type,
        city: transfer.Branch_StockTransfer_fromBranchIdToBranch.city
      },
      toBranch: {
        id: transfer.Branch_StockTransfer_toBranchIdToBranch.id,
        code: transfer.Branch_StockTransfer_toBranchIdToBranch.code,
        name: transfer.Branch_StockTransfer_toBranchIdToBranch.name,
        type: transfer.Branch_StockTransfer_toBranchIdToBranch.type,
        city: transfer.Branch_StockTransfer_toBranchIdToBranch.city
      },
      status: transfer.status as TransferStatus,
      itemsCount: transfer.itemsCount,
      totalValue: transfer.totalValue,
      notes: transfer.notes,
      internalNotes: transfer.internalNotes,
      tracking: {
        requestedBy: transfer.requestedBy,
        requestedByName: transfer.requestedByName,
        requestedAt: transfer.requestedAt?.toISOString() || null,
        approvedBy: transfer.approvedBy,
        approvedByName: transfer.approvedByName,
        approvedAt: transfer.approvedAt?.toISOString() || null,
        dispatchedBy: transfer.dispatchedBy,
        dispatchedByName: transfer.dispatchedByName,
        dispatchedAt: transfer.dispatchedAt?.toISOString() || null,
        estimatedArrival: transfer.estimatedArrival?.toISOString() || null,
        receivedBy: transfer.receivedBy,
        receivedByName: transfer.receivedByName,
        receivedAt: transfer.receivedAt?.toISOString() || null,
        cancelledBy: transfer.cancelledBy,
        cancelledByName: transfer.cancelledByName,
        cancelledAt: transfer.cancelledAt?.toISOString() || null,
        cancelledReason: transfer.cancelledReason
      },
      discrepancyNotes: transfer.discrepancyNotes,
      items: transfer.StockTransferItem.map(item => ({
        id: item.id,
        productId: item.productId,
        sku: item.sku,
        productName: item.productName,
        quantityRequested: item.quantityRequested,
        quantitySent: item.quantitySent,
        quantityReceived: item.quantityReceived,
        unit: item.unit,
        unitCost: item.unitCost,
        totalValue: item.totalValue,
        notes: item.notes,
        discrepancyNotes: item.discrepancyNotes
      })),
      statusHistory: generateStatusHistory(transfer),
      createdAt: transfer.createdAt.toISOString(),
      updatedAt: transfer.updatedAt.toISOString()
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error updating transfer:', error)
    return NextResponse.json({ error: 'Failed to update transfer' }, { status: 500 })
  }
}

// Helper function to generate status history
function generateStatusHistory(transfer: {
  status: string
  createdAt: Date
  requestedAt: Date | null
  requestedBy: string | null
  requestedByName: string | null
  approvedAt: Date | null
  approvedBy: string | null
  approvedByName: string | null
  dispatchedAt: Date | null
  dispatchedBy: string | null
  dispatchedByName: string | null
  receivedAt: Date | null
  receivedBy: string | null
  receivedByName: string | null
  cancelledAt: Date | null
  cancelledBy: string | null
  cancelledByName: string | null
  cancelledReason: string | null
}): Array<{
  status: TransferStatus
  timestamp: string
  actor: string | null
  actorName: string | null
  notes: string | null
}> {
  const history: Array<{
    status: TransferStatus
    timestamp: string
    actor: string | null
    actorName: string | null
    notes: string | null
  }> = []

  // Draft (created)
  history.push({
    status: 'draft',
    timestamp: transfer.createdAt.toISOString(),
    actor: transfer.requestedBy,
    actorName: transfer.requestedByName,
    notes: 'Transfer created'
  })

  // Requested
  if (transfer.requestedAt) {
    history.push({
      status: 'pending',
      timestamp: transfer.requestedAt.toISOString(),
      actor: transfer.requestedBy,
      actorName: transfer.requestedByName,
      notes: null
    })
  }

  // Approved
  if (transfer.approvedAt) {
    history.push({
      status: 'approved',
      timestamp: transfer.approvedAt.toISOString(),
      actor: transfer.approvedBy,
      actorName: transfer.approvedByName,
      notes: null
    })
  }

  // Dispatched (in_transit)
  if (transfer.dispatchedAt) {
    history.push({
      status: 'in_transit',
      timestamp: transfer.dispatchedAt.toISOString(),
      actor: transfer.dispatchedBy,
      actorName: transfer.dispatchedByName,
      notes: null
    })
  }

  // Received
  if (transfer.receivedAt) {
    history.push({
      status: 'received',
      timestamp: transfer.receivedAt.toISOString(),
      actor: transfer.receivedBy,
      actorName: transfer.receivedByName,
      notes: null
    })
  }

  // Cancelled
  if (transfer.cancelledAt) {
    history.push({
      status: 'cancelled',
      timestamp: transfer.cancelledAt.toISOString(),
      actor: transfer.cancelledBy,
      actorName: transfer.cancelledByName,
      notes: transfer.cancelledReason
    })
  }

  return history
}

// Mock data for development/testing
function getMockTransfersResponse(): TransfersListResponse {
  return {
    transfers: [
      {
        id: 'trf-1',
        code: 'TRF-2024-001',
        merchantId: 'mer-1',
        fromBranch: { id: 'br-3', code: 'WH-001', name: 'Central Warehouse', type: 'warehouse', city: 'Johannesburg' },
        toBranch: { id: 'br-1', code: 'BR-001', name: 'Main Street Store', type: 'store', city: 'Johannesburg' },
        status: 'in_transit',
        itemsCount: 25,
        totalValue: 15000,
        notes: 'Monthly restocking',
        internalNotes: null,
        tracking: {
          requestedBy: 'user-3',
          requestedByName: 'John Smith',
          requestedAt: '2024-11-25T10:00:00Z',
          approvedBy: 'user-1',
          approvedByName: 'Thabo Molefe',
          approvedAt: '2024-11-25T11:30:00Z',
          dispatchedBy: 'user-3',
          dispatchedByName: 'John Smith',
          dispatchedAt: '2024-11-26T08:00:00Z',
          estimatedArrival: '2024-11-28T17:00:00Z',
          receivedBy: null,
          receivedByName: null,
          receivedAt: null,
          cancelledBy: null,
          cancelledByName: null,
          cancelledAt: null,
          cancelledReason: null
        },
        discrepancyNotes: null,
        items: [
          { id: 'ti-1', productId: 'p-1', sku: 'SKU-001', productName: 'Coca-Cola 500ml', quantityRequested: 100, quantitySent: 100, quantityReceived: null, unit: 'each', unitCost: 8.5, totalValue: 850, notes: null, discrepancyNotes: null },
          { id: 'ti-2', productId: 'p-2', sku: 'SKU-002', productName: 'Bread White', quantityRequested: 50, quantitySent: 50, quantityReceived: null, unit: 'each', unitCost: 12, totalValue: 600, notes: null, discrepancyNotes: null }
        ],
        statusHistory: [
          { status: 'draft', timestamp: '2024-11-25T09:00:00Z', actor: 'user-3', actorName: 'John Smith', notes: 'Transfer created' },
          { status: 'pending', timestamp: '2024-11-25T10:00:00Z', actor: 'user-3', actorName: 'John Smith', notes: null },
          { status: 'approved', timestamp: '2024-11-25T11:30:00Z', actor: 'user-1', actorName: 'Thabo Molefe', notes: null },
          { status: 'in_transit', timestamp: '2024-11-26T08:00:00Z', actor: 'user-3', actorName: 'John Smith', notes: null }
        ],
        createdAt: '2024-11-25T09:00:00Z',
        updatedAt: '2024-11-26T08:00:00Z'
      },
      {
        id: 'trf-2',
        code: 'TRF-2024-002',
        merchantId: 'mer-1',
        fromBranch: { id: 'br-3', code: 'WH-001', name: 'Central Warehouse', type: 'warehouse', city: 'Johannesburg' },
        toBranch: { id: 'br-4', code: 'BR-003', name: 'Cape Town Branch', type: 'store', city: 'Cape Town' },
        status: 'approved',
        itemsCount: 40,
        totalValue: 28000,
        notes: 'Quarterly stock transfer',
        internalNotes: 'Priority shipment - express delivery',
        tracking: {
          requestedBy: 'user-4',
          requestedByName: 'Pieter van der Merwe',
          requestedAt: '2024-11-26T14:00:00Z',
          approvedBy: 'user-1',
          approvedByName: 'Thabo Molefe',
          approvedAt: '2024-11-27T09:00:00Z',
          dispatchedBy: null,
          dispatchedByName: null,
          dispatchedAt: null,
          estimatedArrival: null,
          receivedBy: null,
          receivedByName: null,
          receivedAt: null,
          cancelledBy: null,
          cancelledByName: null,
          cancelledAt: null,
          cancelledReason: null
        },
        discrepancyNotes: null,
        items: [],
        statusHistory: [
          { status: 'draft', timestamp: '2024-11-26T13:00:00Z', actor: 'user-4', actorName: 'Pieter van der Merwe', notes: 'Transfer created' },
          { status: 'pending', timestamp: '2024-11-26T14:00:00Z', actor: 'user-4', actorName: 'Pieter van der Merwe', notes: null },
          { status: 'approved', timestamp: '2024-11-27T09:00:00Z', actor: 'user-1', actorName: 'Thabo Molefe', notes: null }
        ],
        createdAt: '2024-11-26T13:00:00Z',
        updatedAt: '2024-11-27T09:00:00Z'
      },
      {
        id: 'trf-3',
        code: 'TRF-2024-003',
        merchantId: 'mer-1',
        fromBranch: { id: 'br-2', code: 'BR-002', name: 'Sandton City Mall', type: 'store', city: 'Sandton' },
        toBranch: { id: 'br-5', code: 'BR-004', name: 'Durban Beach Front', type: 'kiosk', city: 'Durban' },
        status: 'pending',
        itemsCount: 15,
        totalValue: 8500,
        notes: 'Surplus stock transfer',
        internalNotes: null,
        tracking: {
          requestedBy: 'user-2',
          requestedByName: 'Nomsa Dlamini',
          requestedAt: '2024-11-27T16:00:00Z',
          approvedBy: null,
          approvedByName: null,
          approvedAt: null,
          dispatchedBy: null,
          dispatchedByName: null,
          dispatchedAt: null,
          estimatedArrival: null,
          receivedBy: null,
          receivedByName: null,
          receivedAt: null,
          cancelledBy: null,
          cancelledByName: null,
          cancelledAt: null,
          cancelledReason: null
        },
        discrepancyNotes: null,
        items: [],
        statusHistory: [
          { status: 'draft', timestamp: '2024-11-27T15:00:00Z', actor: 'user-2', actorName: 'Nomsa Dlamini', notes: 'Transfer created' },
          { status: 'pending', timestamp: '2024-11-27T16:00:00Z', actor: 'user-2', actorName: 'Nomsa Dlamini', notes: null }
        ],
        createdAt: '2024-11-27T15:00:00Z',
        updatedAt: '2024-11-27T16:00:00Z'
      },
      {
        id: 'trf-4',
        code: 'TRF-2024-004',
        merchantId: 'mer-1',
        fromBranch: { id: 'br-3', code: 'WH-001', name: 'Central Warehouse', type: 'warehouse', city: 'Johannesburg' },
        toBranch: { id: 'br-2', code: 'BR-002', name: 'Sandton City Mall', type: 'store', city: 'Sandton' },
        status: 'received',
        itemsCount: 30,
        totalValue: 18000,
        notes: 'Bi-weekly restocking',
        internalNotes: null,
        tracking: {
          requestedBy: 'user-2',
          requestedByName: 'Nomsa Dlamini',
          requestedAt: '2024-11-20T10:00:00Z',
          approvedBy: 'user-1',
          approvedByName: 'Thabo Molefe',
          approvedAt: '2024-11-20T14:00:00Z',
          dispatchedBy: 'user-3',
          dispatchedByName: 'John Smith',
          dispatchedAt: '2024-11-21T08:00:00Z',
          estimatedArrival: '2024-11-21T16:00:00Z',
          receivedBy: 'user-2',
          receivedByName: 'Nomsa Dlamini',
          receivedAt: '2024-11-21T15:30:00Z',
          cancelledBy: null,
          cancelledByName: null,
          cancelledAt: null,
          cancelledReason: null
        },
        discrepancyNotes: null,
        items: [],
        statusHistory: [
          { status: 'draft', timestamp: '2024-11-20T09:00:00Z', actor: 'user-2', actorName: 'Nomsa Dlamini', notes: 'Transfer created' },
          { status: 'pending', timestamp: '2024-11-20T10:00:00Z', actor: 'user-2', actorName: 'Nomsa Dlamini', notes: null },
          { status: 'approved', timestamp: '2024-11-20T14:00:00Z', actor: 'user-1', actorName: 'Thabo Molefe', notes: null },
          { status: 'in_transit', timestamp: '2024-11-21T08:00:00Z', actor: 'user-3', actorName: 'John Smith', notes: null },
          { status: 'received', timestamp: '2024-11-21T15:30:00Z', actor: 'user-2', actorName: 'Nomsa Dlamini', notes: null }
        ],
        createdAt: '2024-11-20T09:00:00Z',
        updatedAt: '2024-11-21T15:30:00Z'
      }
    ],
    summary: {
      total: 15,
      byStatus: { draft: 5, pending: 3, approved: 2, in_transit: 1, received: 3, cancelled: 1 },
      totalValue: 125000,
      inTransitValue: 15000,
      averageProcessingTime: 2.3
    },
    pagination: {
      total: 15,
      limit: 20,
      offset: 0,
      hasMore: false
    }
  }
}
