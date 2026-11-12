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

// Generate session number
async function generateSessionNumber(merchantId: string) {
  const count = await db.stocktakeSession.count({
    where: { merchantId },
  })
  return `STK-${String(count + 1).padStart(6, '0')}`
}

// GET /api/merchant-os/inventory/stocktake - Get stocktake sessions
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const status = searchParams.get('status')
    const branchId = searchParams.get('branchId')

    // If sessionId provided, get specific session with items
    if (sessionId) {
      const stocktakeSession = await db.stocktakeSession.findFirst({
        where: {
          id: sessionId,
          merchantId: session.merchantId,
        },
        include: {
          branch: true,
          items: {
            include: {
              product: {
                include: { category: true },
              },
            },
            orderBy: { product: { name: 'asc' } },
          },
        },
      })

      if (!stocktakeSession) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      }

      // Hide system quantities for blind count during count
      const items = stocktakeSession.isBlind && stocktakeSession.status === 'in_progress'
        ? stocktakeSession.items.map(item => ({
            ...item,
            systemQty: null,
            varianceQty: null,
            varianceValue: null,
          }))
        : stocktakeSession.items

      return NextResponse.json({
        success: true,
        session: { ...stocktakeSession, items },
      })
    }

    // Build where clause for listing
    const where: Record<string, unknown> = {
      merchantId: session.merchantId,
    }

    if (status && status !== 'all') where.status = status
    if (branchId) where.branchId = branchId

    // Get sessions
    const sessions = await db.stocktakeSession.findMany({
      where,
      include: {
        branch: true,
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({
      success: true,
      sessions: sessions.map(s => ({
        ...s,
        itemCount: s._count.items,
      })),
    })
  } catch (error) {
    console.error('Get stocktake sessions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stocktake sessions' },
      { status: 500 }
    )
  }
}

// POST /api/merchant-os/inventory/stocktake - Create new stocktake session
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      type,
      branchId,
      categoryId,
      isBlind,
      productIds,
    } = body

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      )
    }

    // Get target branch
    let targetBranchId = branchId
    if (!targetBranchId) {
      const defaultBranch = await db.branch.findFirst({
        where: { merchantId: session.merchantId, isDefault: true },
      })
      targetBranchId = defaultBranch?.id
    }

    if (!targetBranchId) {
      return NextResponse.json(
        { error: 'No branch found for stocktake' },
        { status: 400 }
      )
    }

    // Build product query based on type
    const productWhere: Record<string, unknown> = {
      merchantId: session.merchantId,
      isActive: true,
      trackInventory: true,
    }

    switch (type) {
      case 'category':
        if (!categoryId) {
          return NextResponse.json(
            { error: 'Category ID required for category stocktake' },
            { status: 400 }
          )
        }
        productWhere.categoryId = categoryId
        break
      
      case 'low_stock':
        productWhere.currentStock = { lte: db.product.fields.lowStockThreshold }
        break
    }

    // Specific products override
    if (productIds && productIds.length > 0) {
      productWhere.id = { in: productIds }
    }

    // Get products for stocktake
    const products = await db.product.findMany({
      where: productWhere,
      include: { category: true },
    })

    if (products.length === 0) {
      return NextResponse.json(
        { error: 'No products found for this stocktake' },
        { status: 400 }
      )
    }

    // Generate session number
    const sessionNumber = await generateSessionNumber(session.merchantId)

    // Calculate system value
    const systemValue = products.reduce(
      (sum, p) => sum + (p.currentStock || 0) * (p.costPrice || 0),
      0
    )

    // Create stocktake session with items
    const stocktakeSession = await db.stocktakeSession.create({
      data: {
        merchantId: session.merchantId,
        branchId: targetBranchId,
        sessionNumber,
        name,
        type,
        categoryId: type === 'category' ? categoryId : null,
        status: 'draft',
        totalItems: products.length,
        isBlind: isBlind ?? false,
        systemValue,
        systemValue: systemValue,
      },
    })

    // Create items
    await db.stocktakeItem.createMany({
      data: products.map(product => ({
        sessionId: stocktakeSession.id,
        productId: product.id,
        systemQty: product.currentStock || 0,
        unitCost: product.costPrice || 0,
        isCounted: false,
      })),
    })

    // Return created session with items
    const createdSession = await db.stocktakeSession.findUnique({
      where: { id: stocktakeSession.id },
      include: {
        branch: true,
        items: {
          include: {
            product: {
              include: { category: true },
            },
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      session: createdSession,
    })
  } catch (error) {
    console.error('Create stocktake session error:', error)
    return NextResponse.json(
      { error: 'Failed to create stocktake session' },
      { status: 500 }
    )
  }
}

// PUT /api/merchant-os/inventory/stocktake - Update session
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, sessionId, itemId, countedQty, notes } = body

    if (!action || !sessionId) {
      return NextResponse.json(
        { error: 'Action and session ID are required' },
        { status: 400 }
      )
    }

    // Get session
    const stocktakeSession = await db.stocktakeSession.findFirst({
      where: {
        id: sessionId,
        merchantId: session.merchantId,
      },
      include: { items: true },
    })

    if (!stocktakeSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    switch (action) {
      case 'start':
        if (stocktakeSession.status !== 'draft') {
          return NextResponse.json(
            { error: 'Session can only be started from draft status' },
            { status: 400 }
          )
        }

        const startedSession = await db.stocktakeSession.update({
          where: { id: sessionId },
          data: {
            status: 'in_progress',
            startedAt: new Date(),
            startedBy: session.userId,
            startedByName: session.user.name || 'System',
          },
        })

        return NextResponse.json({ success: true, session: startedSession })

      case 'count':
        if (stocktakeSession.status !== 'in_progress') {
          return NextResponse.json(
            { error: 'Session must be in progress to record counts' },
            { status: 400 }
          )
        }

        if (!itemId || countedQty === undefined) {
          return NextResponse.json(
            { error: 'Item ID and counted quantity are required' },
            { status: 400 }
          )
        }

        const item = stocktakeSession.items.find(i => i.id === itemId)
        if (!item) {
          return NextResponse.json({ error: 'Item not found' }, { status: 404 })
        }

        const varianceQty = countedQty - item.systemQty
        const varianceValue = varianceQty * item.unitCost

        const updatedItem = await db.stocktakeItem.update({
          where: { id: itemId },
          data: {
            countedQty,
            varianceQty,
            varianceValue,
            notes,
            isCounted: true,
            countedAt: new Date(),
            countedBy: session.userId,
            countedByName: session.user.name || 'System',
          },
        })

        return NextResponse.json({ success: true, item: updatedItem })

      case 'complete':
        if (stocktakeSession.status !== 'in_progress') {
          return NextResponse.json(
            { error: 'Session must be in progress to complete' },
            { status: 400 }
          )
        }

        // Calculate final values
        const allItems = await db.stocktakeItem.findMany({
          where: { sessionId },
        })

        const countedValue = allItems.reduce(
          (sum, i) => sum + (i.countedQty || 0) * i.unitCost,
          0
        )
        const totalVariance = allItems.reduce(
          (sum, i) => sum + (i.varianceQty || 0) * i.unitCost,
          0
        )
        const countedItems = allItems.filter(i => i.isCounted).length
        const varianceItems = allItems.filter(i => i.varianceQty !== 0).length

        const completedSession = await db.stocktakeSession.update({
          where: { id: sessionId },
          data: {
            status: 'pending_review',
            completedAt: new Date(),
            completedBy: session.userId,
            completedByName: session.user.name || 'System',
            countedValue,
            varianceValue: totalVariance,
            countedItems,
            varianceItems,
          },
        })

        return NextResponse.json({ success: true, session: completedSession })

      case 'approve':
        if (stocktakeSession.status !== 'pending_review') {
          return NextResponse.json(
            { error: 'Session must be pending review to approve' },
            { status: 400 }
          )
        }

        // Get variance items
        const varianceItemsData = await db.stocktakeItem.findMany({
          where: {
            sessionId,
            varianceQty: { not: 0 },
          },
          include: { product: true },
        })

        // Create stock movements for variances
        for (const vItem of varianceItemsData) {
          const previousStock = vItem.product.currentStock || 0
          const newStock = vItem.countedQty || 0

          await db.stockMovement.create({
            data: {
              merchantId: session.merchantId,
              branchId: stocktakeSession.branchId,
              productId: vItem.productId,
              type: vItem.varianceQty > 0 ? 'purchase' : 'adjustment',
              quantity: vItem.varianceQty,
              previousStock,
              newStock,
              unitCost: vItem.unitCost,
              totalValue: Math.abs(vItem.varianceValue),
              reason: 'Stocktake variance',
              notes: `Stocktake: ${stocktakeSession.name}`,
              referenceType: 'manual',
              referenceId: sessionId,
              performedBy: session.userId,
              performedByName: session.user.name || 'System',
            },
          })

          // Update product stock
          await db.product.update({
            where: { id: vItem.productId },
            data: { currentStock: newStock },
          })
        }

        // Mark session as completed
        const approvedSession = await db.stocktakeSession.update({
          where: { id: sessionId },
          data: {
            status: 'completed',
            approvedBy: session.userId,
            approvedByName: session.user.name || 'System',
            approvedAt: new Date(),
          },
        })

        return NextResponse.json({
          success: true,
          session: approvedSession,
          variancesApplied: varianceItemsData.length,
        })

      case 'cancel':
        if (!['draft', 'in_progress', 'pending_review'].includes(stocktakeSession.status)) {
          return NextResponse.json(
            { error: 'Session cannot be cancelled' },
            { status: 400 }
          )
        }

        const cancelledSession = await db.stocktakeSession.update({
          where: { id: sessionId },
          data: {
            status: 'cancelled',
            notes: notes || stocktakeSession.notes,
          },
        })

        return NextResponse.json({ success: true, session: cancelledSession })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Update stocktake session error:', error)
    return NextResponse.json(
      { error: 'Failed to update stocktake session' },
      { status: 500 }
    )
  }
}
