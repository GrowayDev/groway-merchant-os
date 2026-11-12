import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/permissions'

/**
 * POST /api/inventory/transfers/reversal
 * Reverse a completed or in-transit transfer
 * 
 * Body:
 * - transferId: required
 * - reason: required
 * - items: optional (array of { productId, quantity } for partial reversal)
 */
export async function POST(request: NextRequest) {
  const permissionCheck = await checkPermission(request, 'can_reverse_transfer')
  
  if (!permissionCheck.allowed) {
    return permissionCheck.error
  }

  const session = permissionCheck.session!

  try {
    const body = await request.json()
    const { transferId, reason, items } = body

    if (!transferId || !reason) {
      return NextResponse.json(
        { error: 'transferId and reason are required' },
        { status: 400 }
      )
    }

    const transfer = await db.stockTransfer.findUnique({
      where: { id: transferId },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, currentStock: true },
            },
          },
        },
        fromBranch: { select: { id: true, name: true } },
        toBranch: { select: { id: true, name: true } },
      },
    })

    if (!transfer) {
      return NextResponse.json(
        { error: 'Transfer not found' },
        { status: 404 }
      )
    }

    // Only allow reversal of in_transit or received transfers
    if (transfer.status !== 'in_transit' && transfer.status !== 'received') {
      return NextResponse.json(
        { error: `Cannot reverse transfer with status: ${transfer.status}. Only in_transit or received transfers can be reversed.` },
        { status: 400 }
      )
    }

    // Generate reversal number
    const reversalCount = await db.stockTransfer.count()
    const reversalNumber = `REV-${new Date().getFullYear()}-${String(reversalCount + 1).padStart(5, '0')}`

    const result = await db.$transaction(async (tx) => {
      // Process each item
      for (const transferItem of transfer.items) {
        // Determine quantity to reverse
        let reverseQty = transferItem.quantityReceived || transferItem.quantitySent || 0
        
        // If specific items provided, use those quantities
        if (items && items.length > 0) {
          const itemOverride = items.find((i: any) => i.productId === transferItem.productId)
          if (itemOverride) {
            reverseQty = itemOverride.quantity
          } else {
            continue // Skip items not in the reversal list
          }
        }

        if (reverseQty <= 0) continue

        const unitCost = transferItem.unitCost || 0

        // If transfer was received, we need to:
        // 1. Deduct from destination branch
        // 2. Create a batch at source branch
        if (transfer.status === 'received') {
          // Deduct from destination
          const destProduct = await tx.product.findFirst({
            where: {
              id: transferItem.productId,
              branchId: transfer.toBranchId,
            },
          })

          if (destProduct) {
            await tx.stockMovement.create({
              data: {
                merchantId: transfer.merchantId,
                branchId: transfer.toBranchId,
                productId: transferItem.productId,
                idempotencyKey: `reversal-${transferId}-${transferItem.productId}-out`,
                type: 'adjustment_out',
                direction: 'out',
                quantity: reverseQty,
                previousStock: destProduct.currentStock,
                newStock: destProduct.currentStock - reverseQty,
                unitCost,
                totalCost: reverseQty * unitCost,
                referenceType: 'transfer_reversal',
                referenceId: transferId,
                referenceNumber: reversalNumber,
                reason: `Reversal: ${reason}`,
                performedBy: session.userId,
                performedByName: session.user?.name || 'System',
              },
            })

            await tx.product.update({
              where: { id: transferItem.productId },
              data: {
                currentStock: { decrement: reverseQty },
              },
            })
          }

          // Restore to source
          const sourceProduct = await tx.product.findFirst({
            where: {
              id: transferItem.productId,
              branchId: transfer.fromBranchId,
            },
          })

          if (sourceProduct) {
            // Create reversal batch
            const batchNumber = `REV-${transfer.code}-${transferItem.sku || transferItem.productId.slice(-6)}`
            
            await tx.inventoryBatch.create({
              data: {
                merchantId: transfer.merchantId,
                branchId: transfer.fromBranchId,
                productId: transferItem.productId,
                batchNumber,
                initialQty: reverseQty,
                currentQty: reverseQty,
                reservedQty: 0,
                availableQty: reverseQty,
                unitCost,
                totalValue: reverseQty * unitCost,
                status: 'active',
                sourceType: 'transfer_reversal',
                sourceId: transferId,
                receivedBy: session.userId,
                receivedByName: session.user?.name || 'System',
              },
            })

            await tx.stockMovement.create({
              data: {
                merchantId: transfer.merchantId,
                branchId: transfer.fromBranchId,
                productId: transferItem.productId,
                idempotencyKey: `reversal-${transferId}-${transferItem.productId}-in`,
                type: 'adjustment_in',
                direction: 'in',
                quantity: reverseQty,
                previousStock: sourceProduct.currentStock,
                newStock: sourceProduct.currentStock + reverseQty,
                unitCost,
                totalCost: reverseQty * unitCost,
                referenceType: 'transfer_reversal',
                referenceId: transferId,
                referenceNumber: reversalNumber,
                reason: `Reversal: ${reason}`,
                performedBy: session.userId,
                performedByName: session.user?.name || 'System',
              },
            })

            await tx.product.update({
              where: { id: transferItem.productId },
              data: {
                currentStock: { increment: reverseQty },
              },
            })
          }
        }

        // If transfer was in transit, just mark as cancelled
        // Stock was already deducted from source but not added to destination
        if (transfer.status === 'in_transit') {
          // Restore to source
          const sourceProduct = await tx.product.findFirst({
            where: {
              id: transferItem.productId,
              branchId: transfer.fromBranchId,
            },
          })

          if (sourceProduct) {
            await tx.stockMovement.create({
              data: {
                merchantId: transfer.merchantId,
                branchId: transfer.fromBranchId,
                productId: transferItem.productId,
                idempotencyKey: `reversal-${transferId}-${transferItem.productId}-restore`,
                type: 'adjustment_in',
                direction: 'in',
                quantity: reverseQty,
                previousStock: sourceProduct.currentStock,
                newStock: sourceProduct.currentStock + reverseQty,
                unitCost,
                totalCost: reverseQty * unitCost,
                referenceType: 'transfer_reversal',
                referenceId: transferId,
                referenceNumber: reversalNumber,
                reason: `Reversal (in-transit): ${reason}`,
                performedBy: session.userId,
                performedByName: session.user?.name || 'System',
              },
            })

            await tx.product.update({
              where: { id: transferItem.productId },
              data: {
                currentStock: { increment: reverseQty },
              },
            })
          }
        }
      }

      // Update transfer status
      const updated = await tx.stockTransfer.update({
        where: { id: transferId },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancelledBy: session.userId,
          cancelledByName: session.user?.name || 'System',
          cancelledReason: `Reversed: ${reason}`,
          internalNotes: `Reversal Number: ${reversalNumber}`,
        },
      })

      return updated
    })

    return NextResponse.json({
      success: true,
      message: 'Transfer reversed successfully',
      data: {
        reversalNumber,
        transfer: result,
      },
    })
  } catch (error) {
    console.error('Reverse transfer error:', error)
    return NextResponse.json(
      { error: 'Failed to reverse transfer', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
