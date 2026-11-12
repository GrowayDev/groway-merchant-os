import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper to get session
async function getSession(request: NextRequest) {
  const sessionToken = request.cookies.get('groway_session')?.value
  if (!sessionToken) return null
  
  try {
    return await db.merchantSession.findFirst({
      where: { 
        token: sessionToken,
        expiresAt: { gt: new Date() }
      },
      include: { user: true, merchant: true },
    })
  } catch {
    return null
  }
}

// GET /api/merchant-os/inventory/batches - Get all batches with expiry tracking
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const branchId = searchParams.get('branchId')
    const status = searchParams.get('status')
    const expiringWithin = searchParams.get('expiringWithin')

    // Build where clause
    const where: Record<string, unknown> = {
      merchantId: session.merchantId,
    }

    if (productId) where.productId = productId
    if (branchId) where.branchId = branchId
    if (status && status !== 'all') {
      where.status = status
    }

    // Get batches
    const batches = await db.inventoryBatch.findMany({
      where,
      include: {
        product: {
          include: { category: true },
        },
        branch: true,
      },
      orderBy: [
        { expiryDate: 'asc' },
        { createdAt: 'asc' },
      ],
    })

    // Calculate metrics for each batch
    const now = new Date()
    const batchesWithMetrics = batches.map(batch => {
      // Days until expiry
      let daysUntilExpiry: number | null = null
      if (batch.expiryDate) {
        daysUntilExpiry = Math.ceil((batch.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      }

      // Expiry status
      let expiryStatus = 'no_expiry'
      if (daysUntilExpiry !== null) {
        if (daysUntilExpiry < 0) expiryStatus = 'expired'
        else if (daysUntilExpiry <= 7) expiryStatus = 'critical'
        else if (daysUntilExpiry <= 30) expiryStatus = 'warning'
        else expiryStatus = 'ok'
      }

      // Calculate total value
      const totalValue = batch.currentQty * batch.unitCost

      // Utilization rate
      const utilizationRate = batch.initialQty > 0 
        ? ((batch.initialQty - batch.currentQty) / batch.initialQty) * 100 
        : 0

      return {
        ...batch,
        daysUntilExpiry,
        expiryStatus,
        totalValue,
        utilizationRate: Math.round(utilizationRate * 10) / 10,
      }
    })

    // Filter by expiry if requested
    let filteredBatches = batchesWithMetrics
    if (expiringWithin) {
      const days = parseInt(expiringWithin)
      filteredBatches = batchesWithMetrics.filter(b => 
        b.daysUntilExpiry !== null && 
        b.daysUntilExpiry <= days && 
        b.daysUntilExpiry >= 0 &&
        b.status === 'active'
      )
    }

    // Calculate summary stats
    const stats = {
      total: batches.length,
      active: batches.filter(b => b.status === 'active').length,
      expired: batchesWithMetrics.filter(b => b.expiryStatus === 'expired').length,
      expiring7Days: batchesWithMetrics.filter(b => 
        b.expiryStatus === 'critical' && b.status === 'active'
      ).length,
      expiring30Days: batchesWithMetrics.filter(b => 
        (b.expiryStatus === 'warning' || b.expiryStatus === 'critical') && b.status === 'active'
      ).length,
      totalValue: batchesWithMetrics.reduce((sum, b) => sum + b.totalValue, 0),
      expiredValue: batchesWithMetrics
        .filter(b => b.daysUntilExpiry !== null && b.daysUntilExpiry < 0)
        .reduce((sum, b) => sum + b.totalValue, 0),
    }

    return NextResponse.json({
      success: true,
      batches: filteredBatches,
      stats,
    })
  } catch (error) {
    console.error('Get batches error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch batches' },
      { status: 500 }
    )
  }
}

// POST /api/merchant-os/inventory/batches - Create new batch
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      productId,
      branchId,
      batchNumber,
      lotNumber,
      initialQty,
      unitCost,
      productionDate,
      expiryDate,
      shelfLifeDays,
      sourceType,
      sourceId,
      locationAisle,
      locationShelf,
      locationBin,
    } = body

    // Validation
    if (!productId || !batchNumber || initialQty === undefined) {
      return NextResponse.json(
        { error: 'Product ID, batch number, and quantity are required' },
        { status: 400 }
      )
    }

    // Check for duplicate batch number
    const existing = await db.inventoryBatch.findFirst({
      where: {
        merchantId: session.merchantId,
        productId,
        batchNumber,
        status: { notIn: ['depleted', 'expired'] },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A batch with this number already exists for this product' },
        { status: 400 }
      )
    }

    // Get default branch if not specified
    let targetBranchId = branchId
    if (!targetBranchId) {
      const defaultBranch = await db.branch.findFirst({
        where: { merchantId: session.merchantId, isDefault: true },
      })
      targetBranchId = defaultBranch?.id
    }

    if (!targetBranchId) {
      return NextResponse.json(
        { error: 'No branch found' },
        { status: 400 }
      )
    }

    // Calculate total value
    const cost = unitCost || 0
    const totalValue = initialQty * cost

    // Create batch
    const batch = await db.inventoryBatch.create({
      data: {
        merchantId: session.merchantId,
        branchId: targetBranchId,
        productId,
        batchNumber,
        lotNumber,
        initialQty,
        currentQty: initialQty,
        availableQty: initialQty,
        reservedQty: 0,
        unitCost: cost,
        totalValue,
        productionDate: productionDate ? new Date(productionDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        shelfLifeDays,
        status: 'active',
        sourceType,
        sourceId,
        locationAisle,
        locationShelf,
        locationBin,
        receivedBy: session.userId,
        receivedByName: session.user.name || 'System',
      },
      include: {
        product: true,
        branch: true,
      },
    })

    // Create stock movement
    await db.stockMovement.create({
      data: {
        merchantId: session.merchantId,
        branchId: targetBranchId,
        productId,
        type: 'purchase',
        quantity: initialQty,
        previousStock: 0,
        newStock: initialQty,
        unitCost: cost,
        totalValue,
        referenceType: 'batch_creation',
        referenceId: batch.id,
        performedBy: session.userId,
        performedByName: session.user.name || 'System',
      },
    })

    // Update product current stock
    const product = await db.product.findUnique({
      where: { id: productId },
      select: { currentStock: true },
    })
    
    await db.product.update({
      where: { id: productId },
      data: {
        currentStock: (product?.currentStock || 0) + initialQty,
      },
    })

    return NextResponse.json({
      success: true,
      batch,
    })
  } catch (error) {
    console.error('Create batch error:', error)
    return NextResponse.json(
      { error: 'Failed to create batch' },
      { status: 500 }
    )
  }
}

// PUT /api/merchant-os/inventory/batches - Update batch status
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { batchId, action, notes } = body

    if (!batchId || !action) {
      return NextResponse.json(
        { error: 'Batch ID and action are required' },
        { status: 400 }
      )
    }

    // Get batch
    const batch = await db.inventoryBatch.findFirst({
      where: {
        id: batchId,
        merchantId: session.merchantId,
      },
    })

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
    }

    let updatedBatch
    const currentNotes = batch.notes || ''

    switch (action) {
      case 'quarantine':
        updatedBatch = await db.inventoryBatch.update({
          where: { id: batchId },
          data: {
            status: 'quarantined',
            notes: notes ? `${currentNotes}\n${notes}` : currentNotes,
          },
        })
        break

      case 'recall':
        updatedBatch = await db.inventoryBatch.update({
          where: { id: batchId },
          data: {
            status: 'recalled',
            notes: notes ? `${currentNotes}\nRECALL: ${notes}` : currentNotes,
          },
        })
        
        // Create adjustment movement for recall
        if (batch.currentQty > 0) {
          await db.stockMovement.create({
            data: {
              merchantId: session.merchantId,
              branchId: batch.branchId,
              productId: batch.productId,
              type: 'adjustment',
              quantity: -batch.currentQty,
              previousStock: batch.currentQty,
              newStock: 0,
              unitCost: batch.unitCost,
              totalValue: batch.currentQty * batch.unitCost,
              reason: 'Batch recall',
              notes: notes || 'Batch recalled',
              referenceType: 'batch_recall',
              referenceId: batchId,
              performedBy: session.userId,
              performedByName: session.user.name || 'System',
            },
          })

          // Update product stock
          const product = await db.product.findUnique({
            where: { id: batch.productId },
            select: { currentStock: true },
          })
          
          await db.product.update({
            where: { id: batch.productId },
            data: {
              currentStock: Math.max(0, (product?.currentStock || 0) - batch.currentQty),
            },
          })
        }
        break

      case 'mark_expired':
        updatedBatch = await db.inventoryBatch.update({
          where: { id: batchId },
          data: { status: 'expired' },
        })
        break

      case 'clear':
        updatedBatch = await db.inventoryBatch.update({
          where: { id: batchId },
          data: {
            status: 'depleted',
            currentQty: 0,
            availableQty: 0,
            totalValue: 0,
          },
        })
        break

      case 'restore':
        updatedBatch = await db.inventoryBatch.update({
          where: { id: batchId },
          data: { status: 'active' },
        })
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      batch: updatedBatch,
    })
  } catch (error) {
    console.error('Update batch error:', error)
    return NextResponse.json(
      { error: 'Failed to update batch' },
      { status: 500 }
    )
  }
}
