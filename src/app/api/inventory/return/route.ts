import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/permissions'

/**
 * POST /api/inventory/return
 * Process a customer return and restore inventory
 * 
 * Body:
 * - originalTransactionId: required
 * - items: Array of returned items
 * - merchantId: required
 * - branchId: required
 * - returnTransactionId: required
 * - reason: optional
 */
export async function POST(request: NextRequest) {
  const permissionCheck = await checkPermission(request, 'can_process_returns')
  
  if (!permissionCheck.allowed) {
    return permissionCheck.error
  }

  const session = permissionCheck.session!

  try {
    const body = await request.json()
    const {
      originalTransactionId,
      items,
      merchantId,
      branchId,
      returnTransactionId,
      reason,
    } = body

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items array is required' },
        { status: 400 }
      )
    }

    if (!merchantId || !branchId || !returnTransactionId) {
      return NextResponse.json(
        { error: 'Missing required fields: merchantId, branchId, returnTransactionId' },
        { status: 400 }
      )
    }

    // Check if already processed (idempotency)
    const existingReturn = await db.stockMovement.findFirst({
      where: {
        referenceId: returnTransactionId,
        type: 'return',
      },
    })

    if (existingReturn) {
      return NextResponse.json({
        success: true,
        message: 'Return already processed',
        data: {
          returnTransactionId,
          alreadyProcessed: true,
        },
      })
    }

    const restorations = []

    // Process return in transaction
    await db.$transaction(async (tx) => {
      for (const item of items) {
        const quantity = parseFloat(item.quantity) || 1
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        })

        if (!product) {
          continue
        }

        // Try to find the original batch this was sold from
        const originalMovement = await tx.stockMovement.findFirst({
          where: {
            productId: item.productId,
            referenceId: originalTransactionId,
            type: 'sale',
            direction: 'out',
          },
          orderBy: { createdAt: 'desc' },
        })

        const previousStock = product.currentStock
        const newStock = previousStock + quantity
        const unitCost = originalMovement?.unitCost || product.costPrice
        const batchId = item.originalBatchId || originalMovement?.batchId

        // Create return movement
        await tx.stockMovement.create({
          data: {
            merchantId,
            branchId,
            productId: item.productId,
            batchId,
            idempotencyKey: `return-${returnTransactionId}-${item.productId}`,
            type: 'return',
            direction: 'in',
            quantity,
            previousStock,
            newStock,
            unitCost,
            totalCost: quantity * unitCost,
            referenceType: 'return',
            referenceId: returnTransactionId,
            referenceNumber: `RET-${returnTransactionId}`,
            reason: reason || 'Customer return',
            performedBy: session.userId,
            performedByName: session.user?.name || 'System',
          },
        })

        // Restore batch if found
        if (batchId) {
          const batch = await tx.inventoryBatch.findUnique({
            where: { id: batchId },
          })

          if (batch) {
            const newBatchQty = batch.currentQty + quantity
            await tx.inventoryBatch.update({
              where: { id: batchId },
              data: {
                currentQty: newBatchQty,
                availableQty: newBatchQty - batch.reservedQty,
                status: 'active', // Reactivate if was depleted
              },
            })

            // Create batch transaction
            await tx.batchTransaction.create({
              data: {
                batchId,
                type: 'adjusted',
                quantity,
                balanceAfter: newBatchQty,
                unitCost,
                totalCost: quantity * unitCost,
                referenceType: 'return',
                referenceId: returnTransactionId,
                performedBy: session.userId,
                performedByName: session.user?.name || 'System',
                notes: reason || 'Customer return',
              },
            })
          }
        }

        // Update product stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            currentStock: newStock,
            updatedAt: new Date(),
          },
        })

        // Clear out of stock alert if applicable
        if (previousStock <= 0 && newStock > 0) {
          await tx.stockAlert.updateMany({
            where: {
              productId: item.productId,
              type: 'out_of_stock',
              status: 'active',
            },
            data: {
              status: 'resolved',
              resolvedAt: new Date(),
              resolvedBy: session.userId,
              resolutionNotes: 'Stock restored via return',
            },
          })
        }

        restorations.push({
          productId: item.productId,
          productName: product.name,
          quantity,
          batchId,
          previousStock,
          newStock,
          unitCost,
          totalCost: quantity * unitCost,
        })
      }
    })

    const totalValue = restorations.reduce((sum, r) => sum + r.totalCost, 0)

    return NextResponse.json({
      success: true,
      message: 'Return processed and inventory restored',
      data: {
        returnTransactionId,
        restorations,
        totalValue,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Process return error:', error)
    return NextResponse.json(
      { error: 'Failed to process return', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/inventory/return
 * Get return history for a transaction
 * 
 * Query params:
 * - transactionId: required (original transaction ID)
 */
export async function GET(request: NextRequest) {
  const permissionCheck = await checkPermission(request, 'can_view_inventory')
  
  if (!permissionCheck.allowed) {
    return permissionCheck.error
  }

  try {
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('transactionId')

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Missing required param: transactionId' },
        { status: 400 }
      )
    }

    // Get all returns for this transaction
    const returns = await db.stockMovement.findMany({
      where: {
        referenceId: transactionId,
        type: 'return',
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
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get original sale movements
    const originalSale = await db.stockMovement.findMany({
      where: {
        referenceId: transactionId,
        type: 'sale',
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

    // Calculate returnable quantities
    const returnableItems = originalSale.map(sale => {
      const returnedQty = returns
        .filter(r => r.productId === sale.productId)
        .reduce((sum, r) => sum + r.quantity, 0)

      return {
        productId: sale.productId,
        productName: sale.product?.name,
        sku: sale.product?.sku,
        originalQty: sale.quantity,
        returnedQty,
        returnableQty: sale.quantity - returnedQty,
        batchId: sale.batchId,
      }
    }).filter(item => item.returnableQty > 0)

    return NextResponse.json({
      success: true,
      data: {
        transactionId,
        originalSale,
        returns,
        returnableItems,
      },
    })
  } catch (error) {
    console.error('Get return history error:', error)
    return NextResponse.json(
      { error: 'Failed to get return history', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
