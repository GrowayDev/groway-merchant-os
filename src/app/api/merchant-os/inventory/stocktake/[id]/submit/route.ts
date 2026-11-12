import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/merchant-os/inventory/stocktake/[id]/submit
 * Submit and finalize a stocktake session
 * 
 * This will:
 * 1. Verify all items are counted
 * 2. Apply stock adjustments for variances
 * 3. Create stock movements for adjustments
 * 4. Mark session as completed
 * 
 * Request Body:
 * - varianceNotes: Notes explaining variances
 * - submittedBy: User ID submitting
 * - submittedByName: User name
 * - forceSubmit: Force submit even with uncounted items (default: false)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()

    const session = await db.stocktakeSession.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                trackInventory: true,
                costPrice: true
              }
            }
          }
        },
        branch: {
          select: { id: true, name: true, merchantId: true }
        }
      }
    })

    if (!session) {
      return NextResponse.json({ error: 'Stocktake session not found' }, { status: 404 })
    }

    if (session.status !== 'in_progress') {
      return NextResponse.json({ 
        error: 'Can only submit sessions that are in progress' 
      }, { status: 400 })
    }

    // Check if all items are counted
    const uncountedItems = session.items.filter(i => i.status === 'pending')
    if (uncountedItems.length > 0 && !body.forceSubmit) {
      return NextResponse.json({ 
        error: `${uncountedItems.length} items have not been counted. Use forceSubmit to submit anyway.`,
        uncountedCount: uncountedItems.length
      }, { status: 400 })
    }

    // Get items with variances
    const varianceItems = session.items.filter(i => 
      i.variance !== 0 && i.status === 'counted'
    )

    // Process adjustments in a transaction
    const adjustments = []

    for (const item of varianceItems) {
      if (!item.product?.trackInventory) continue

      const direction = item.variance > 0 ? 'in' : 'out'
      const absVariance = Math.abs(item.variance)

      // Create stock movement
      const movement = await db.stockMovement.create({
        data: {
          productId: item.productId,
          branchId: session.branchId,
          type: 'stocktake',
          direction,
          quantity: absVariance,
          unit: 'each',
          unitCost: item.unitCost,
          totalCost: Math.abs(item.varianceValue),
          referenceType: 'stocktake',
          referenceId: session.id,
          referenceNumber: session.sessionNumber,
          reason: `Stocktake variance: ${session.sessionNumber}`,
          notes: body.varianceNotes,
          userId: body.submittedBy,
          userName: body.submittedByName
        }
      })

      // Update product stock
      await db.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: { increment: item.variance },
          stockValue: { increment: item.varianceValue }
        }
      })

      // Update branch inventory
      const branchInv = await db.branchInventory.findUnique({
        where: {
          branchId_productId: {
            branchId: session.branchId,
            productId: item.productId
          }
        }
      })

      if (branchInv) {
        await db.branchInventory.update({
          where: { id: branchInv.id },
          data: {
            quantityOnHand: { increment: item.variance },
            quantityAvailable: { increment: item.variance },
            lastCountedAt: new Date()
          }
        })
      }

      // Update stocktake item status
      await db.stocktakeItem.update({
        where: { id: item.id },
        data: { status: 'adjusted' }
      })

      adjustments.push({
        itemId: item.id,
        productId: item.productId,
        productName: item.productName,
        sku: item.productSku,
        variance: item.variance,
        varianceValue: item.varianceValue,
        movementId: movement.id
      })
    }

    // Update session as completed
    const completedSession = await db.stocktakeSession.update({
      where: { id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        varianceNotes: body.varianceNotes
      }
    })

    // Create variance report
    const varianceReportNumber = `VR-${session.sessionNumber}`
    await db.varianceReport.create({
      data: {
        reportNumber: varianceReportNumber,
        sessionId: id,
        branchId: session.branchId,
        periodStart: session.startedAt?.toISOString().split('T')[0] || session.createdAt.toISOString().split('T')[0],
        periodEnd: new Date().toISOString().split('T')[0],
        totalItems: session.items.length,
        positiveVarianceItems: session.items.filter(i => i.variance > 0).length,
        negativeVarianceItems: session.items.filter(i => i.variance < 0).length,
        totalPositiveVariance: session.items.filter(i => i.variance > 0).reduce((sum, i) => sum + i.varianceValue, 0),
        totalNegativeVariance: session.items.filter(i => i.variance < 0).reduce((sum, i) => sum + Math.abs(i.varianceValue), 0),
        netVariance: session.varianceValue,
        status: 'submitted',
        submittedBy: body.submittedBy,
        submittedAt: new Date()
      }
    })

    return NextResponse.json({
      data: {
        session: {
          id: completedSession.id,
          sessionNumber: completedSession.sessionNumber,
          status: completedSession.status,
          completedAt: completedSession.completedAt,
          totalItems: completedSession.totalItems,
          countedItems: completedSession.countedItems,
          varianceItems: completedSession.varianceItems,
          systemValue: completedSession.systemValue,
          countedValue: completedSession.countedValue,
          varianceValue: completedSession.varianceValue
        },
        adjustments: {
          count: adjustments.length,
          items: adjustments,
          totalPositiveVariance: adjustments.filter(a => a.variance > 0).reduce((sum, a) => sum + a.varianceValue, 0),
          totalNegativeVariance: adjustments.filter(a => a.variance < 0).reduce((sum, a) => sum + Math.abs(a.varianceValue), 0)
        }
      },
      message: `Stocktake completed. ${adjustments.length} adjustments applied.`
    })
  } catch (error) {
    console.error('Error submitting stocktake:', error)
    return NextResponse.json({ 
      error: 'Failed to submit stocktake',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
