import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/merchant-os/inventory/stocktake/[id]
 * Get stocktake session details with items
 * 
 * Query Parameters:
 * - includeItems: Include all items (default: true)
 * - itemStatus: Filter items by status (pending, counted, verified, adjusted)
 * - page: Page number for items pagination (default: 1)
 * - limit: Items per page (default: 100)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    
    const includeItems = searchParams.get('includeItems') !== 'false'
    const itemStatus = searchParams.get('itemStatus')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = (page - 1) * limit

    const session = await db.stocktakeSession.findUnique({
      where: { id },
      include: {
        branch: {
          select: { id: true, name: true, merchantId: true }
        },
        items: includeItems ? {
          where: itemStatus ? { status: itemStatus } : undefined,
          include: {
            product: {
              select: { 
                id: true, 
                name: true, 
                sku: true,
                category: { select: { id: true, name: true } }
              }
            }
          },
          orderBy: { productName: 'asc' },
          take: limit,
          skip
        } : false
      }
    })

    if (!session) {
      return NextResponse.json({ error: 'Stocktake session not found' }, { status: 404 })
    }

    // Get total items count if paginating
    let itemsTotal = session.totalItems
    if (includeItems && itemStatus) {
      itemsTotal = await db.stocktakeItem.count({
        where: { sessionId: id, status: itemStatus }
      })
    }

    // Calculate variance summary
    const varianceSummary = await db.stocktakeItem.groupBy({
      by: ['status'],
      where: { sessionId: id },
      _count: { id: true },
      _sum: { 
        variance: true, 
        varianceValue: true 
      }
    })

    return NextResponse.json({
      data: {
        id: session.id,
        sessionNumber: session.sessionNumber,
        branchId: session.branchId,
        branchName: session.branch?.name,
        sessionType: session.sessionType,
        status: session.status,
        scheduledDate: session.scheduledDate,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
        totalItems: session.totalItems,
        countedItems: session.countedItems,
        varianceItems: session.varianceItems,
        systemValue: session.systemValue,
        countedValue: session.countedValue,
        varianceValue: session.varianceValue,
        createdBy: session.createdBy,
        supervisorId: session.supervisorId,
        counters: session.counters ? JSON.parse(session.counters) : null,
        notes: session.notes,
        varianceNotes: session.varianceNotes,
        progress: session.totalItems > 0 ? Math.round((session.countedItems / session.totalItems) * 100) : 0,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        items: includeItems ? (session.items as any[])?.map(item => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku,
          variantId: item.variantId,
          variantName: item.variantName,
          category: item.product?.category?.name,
          location: {
            aisle: item.locationAisle,
            shelf: item.locationShelf,
            bin: item.locationBin
          },
          systemQuantity: item.systemQuantity,
          countedQuantity: item.countedQuantity,
          variance: item.variance,
          unitCost: item.unitCost,
          systemValue: item.systemValue,
          countedValue: item.countedValue,
          varianceValue: item.varianceValue,
          status: item.status,
          countedBy: item.countedBy,
          countedAt: item.countedAt,
          recountRequired: item.recountRequired,
          recountQuantity: item.recountQuantity,
          notes: item.notes
        })) : undefined
      },
      meta: includeItems ? {
        itemsTotal,
        page,
        limit,
        totalPages: Math.ceil(itemsTotal / limit)
      } : undefined,
      varianceSummary: varianceSummary.map(v => ({
        status: v.status,
        count: v._count.id,
        totalVariance: v._sum.variance || 0,
        totalVarianceValue: v._sum.varianceValue || 0
      }))
    })
  } catch (error) {
    console.error('Error fetching stocktake session:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch stocktake session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * PUT /api/merchant-os/inventory/stocktake/[id]
 * Update stocktake session (start, add counts, etc.)
 * 
 * Request Body:
 * - action: Action to perform (start, update_item, complete_count)
 * - itemId: Item ID (for update_item action)
 * - countedQuantity: Counted quantity
 * - notes: Item notes
 * - countedBy: Counter name
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()

    const session = await db.stocktakeSession.findUnique({
      where: { id }
    })

    if (!session) {
      return NextResponse.json({ error: 'Stocktake session not found' }, { status: 404 })
    }

    if (session.status === 'completed' || session.status === 'cancelled') {
      return NextResponse.json({ 
        error: 'Cannot update completed or cancelled session' 
      }, { status: 400 })
    }

    // Handle different actions
    switch (body.action) {
      case 'start':
        // Start the stocktake
        const startedSession = await db.stocktakeSession.update({
          where: { id },
          data: {
            status: 'in_progress',
            startedAt: new Date()
          }
        })
        return NextResponse.json({ 
          data: startedSession, 
          message: 'Stocktake started' 
        })

      case 'update_item':
        // Update a single item count
        if (!body.itemId) {
          return NextResponse.json({ error: 'itemId is required for update_item' }, { status: 400 })
        }
        if (body.countedQuantity === undefined) {
          return NextResponse.json({ error: 'countedQuantity is required' }, { status: 400 })
        }

        const item = await db.stocktakeItem.findUnique({
          where: { id: body.itemId }
        })

        if (!item || item.sessionId !== id) {
          return NextResponse.json({ error: 'Item not found in this session' }, { status: 404 })
        }

        const variance = body.countedQuantity - item.systemQuantity
        const countedValue = body.countedQuantity * item.unitCost
        const varianceValue = variance * item.unitCost

        const updatedItem = await db.stocktakeItem.update({
          where: { id: body.itemId },
          data: {
            countedQuantity: body.countedQuantity,
            variance,
            countedValue,
            varianceValue,
            status: 'counted',
            countedBy: body.countedBy,
            countedAt: new Date(),
            notes: body.notes
          }
        })

        // Update session counts
        const allItems = await db.stocktakeItem.findMany({
          where: { sessionId: id }
        })
        
        const countedItems = allItems.filter(i => i.status !== 'pending').length
        const varianceItems = allItems.filter(i => i.variance !== 0).length
        
        await db.stocktakeSession.update({
          where: { id },
          data: {
            countedItems,
            varianceItems,
            countedValue: allItems.reduce((sum, i) => sum + (i.countedValue || 0), 0),
            varianceValue: allItems.reduce((sum, i) => sum + (i.varianceValue || 0), 0)
          }
        })

        return NextResponse.json({ 
          data: updatedItem, 
          message: 'Item count recorded' 
        })

      case 'batch_update':
        // Update multiple items at once
        if (!body.items || !Array.isArray(body.items)) {
          return NextResponse.json({ error: 'items array is required for batch_update' }, { status: 400 })
        }

        for (const itemUpdate of body.items) {
          const existingItem = await db.stocktakeItem.findUnique({
            where: { id: itemUpdate.itemId }
          })

          if (existingItem && existingItem.sessionId === id) {
            const variance = itemUpdate.countedQuantity - existingItem.systemQuantity
            await db.stocktakeItem.update({
              where: { id: itemUpdate.itemId },
              data: {
                countedQuantity: itemUpdate.countedQuantity,
                variance,
                countedValue: itemUpdate.countedQuantity * existingItem.unitCost,
                varianceValue: variance * existingItem.unitCost,
                status: 'counted',
                countedBy: body.countedBy,
                countedAt: new Date(),
                notes: itemUpdate.notes
              }
            })
          }
        }

        // Refresh session totals
        const refreshedItems = await db.stocktakeItem.findMany({
          where: { sessionId: id }
        })

        await db.stocktakeSession.update({
          where: { id },
          data: {
            countedItems: refreshedItems.filter(i => i.status !== 'pending').length,
            varianceItems: refreshedItems.filter(i => i.variance !== 0).length,
            countedValue: refreshedItems.reduce((sum, i) => sum + (i.countedValue || 0), 0),
            varianceValue: refreshedItems.reduce((sum, i) => sum + (i.varianceValue || 0), 0)
          }
        })

        return NextResponse.json({ 
          message: `Updated ${body.items.length} items` 
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error updating stocktake session:', error)
    return NextResponse.json({ 
      error: 'Failed to update stocktake session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/merchant-os/inventory/stocktake/[id]
 * Cancel/delete a stocktake session
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const session = await db.stocktakeSession.findUnique({
      where: { id }
    })

    if (!session) {
      return NextResponse.json({ error: 'Stocktake session not found' }, { status: 404 })
    }

    if (session.status === 'completed') {
      return NextResponse.json({ 
        error: 'Cannot delete completed stocktake session' 
      }, { status: 400 })
    }

    // Cancel instead of delete to preserve audit trail
    await db.stocktakeSession.update({
      where: { id },
      data: { status: 'cancelled' }
    })

    return NextResponse.json({ 
      message: 'Stocktake session cancelled' 
    })
  } catch (error) {
    console.error('Error cancelling stocktake session:', error)
    return NextResponse.json({ 
      error: 'Failed to cancel stocktake session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
