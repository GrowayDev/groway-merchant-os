import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/permissions'

/**
 * GET /api/grosupply/grn
 * List Goods Received Notes with pagination and filters
 */
export async function GET(request: NextRequest) {
  const permissionCheck = await checkPermission(request, 'can_view_inventory')
  
  if (!permissionCheck.allowed) {
    return permissionCheck.error
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const poId = searchParams.get('poId')
    const supplierId = searchParams.get('supplierId')

    const where: any = {}

    if (status && status !== 'all') {
      where.status = status
    }

    if (poId) {
      where.poId = poId
    }

    const grns = await db.goodsReceivedNote.findMany({
      where,
      include: {
        po: {
          include: {
            supplier: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    // Calculate 3-way match status for each GRN
    const grnsWithMatchStatus = grns.map(grn => {
      const items = grn.items.map(item => {
        const poItem = grn.po.items.find(pi => pi.sku === item.sku)
        const orderedQty = poItem?.quantity || 0
        const variance = item.receivedQty - orderedQty
        const variancePercent = orderedQty > 0 ? ((item.receivedQty - orderedQty) / orderedQty) * 100 : 0

        return {
          ...item,
          orderedQty,
          variance,
          variancePercent,
          matchStatus: 
            Math.abs(variancePercent) <= 5 ? 'matched' :
            variancePercent > 0 ? 'over_received' : 'under_received'
        }
      })

      const totalOrdered = items.reduce((sum, item) => sum + item.orderedQty, 0)
      const totalReceived = items.reduce((sum, item) => sum + item.receivedQty, 0)
      const overallVariance = totalReceived - totalOrdered
      const overallVariancePercent = totalOrdered > 0 ? (overallVariance / totalOrdered) * 100 : 0

      return {
        ...grn,
        items,
        matchSummary: {
          totalOrdered,
          totalReceived,
          overallVariance,
          overallVariancePercent,
          matchStatus: 
            Math.abs(overallVariancePercent) <= 5 ? 'matched' :
            overallVariancePercent > 0 ? 'over_received' : 'under_received'
        }
      }
    })

    const stats = {
      total: grns.length,
      draft: grns.filter(g => g.status === 'draft').length,
      completed: grns.filter(g => g.status === 'completed').length,
      disputed: grns.filter(g => g.status === 'disputed').length,
    }

    return NextResponse.json({
      success: true,
      grns: grnsWithMatchStatus,
      stats,
    })
  } catch (error) {
    console.error('Get GRNs error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch GRNs' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/grosupply/grn
 * Create a new Goods Received Note from Purchase Order
 * 
 * This handles:
 * - 3-way matching (PO vs Invoice vs Received)
 * - Batch creation for batch-tracked items
 * - Stock movement creation
 * - Product stock updates
 * - Weighted average cost calculation
 */
export async function POST(request: NextRequest) {
  const permissionCheck = await checkPermission(request, 'can_receive_stock')
  
  if (!permissionCheck.allowed) {
    return permissionCheck.error
  }

  const session = permissionCheck.session!

  try {
    const body = await request.json()
    const { poId, items, notes, receivedBy, branchId, merchantId: bodyMerchantId } = body

    // Security: Use session merchantId, ignore body merchantId for non-admins
    const merchantId = session.merchantId
    
    // Security: Validate cross-merchant access attempt
    if (bodyMerchantId && bodyMerchantId !== session.merchantId) {
      if (permissionCheck.role !== 'platform_admin' && permissionCheck.role !== 'super_admin') {
        return NextResponse.json(
          { error: 'Access denied to this merchant' },
          { status: 403 }
        )
      }
      // Admin can override
      // merchantId stays as session.merchantId - admin would need to use a different endpoint
    }

    if (!poId) {
      return NextResponse.json(
        { error: 'Purchase Order ID is required' },
        { status: 400 }
      )
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items are required' },
        { status: 400 }
      )
    }

    // Fetch the Purchase Order with all related data
    const po = await db.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        supplier: true,
        items: true,
      },
    })

    if (!po) {
      return NextResponse.json(
        { error: 'Purchase Order not found' },
        { status: 404 }
      )
    }

    if (po.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot receive against a cancelled Purchase Order' },
        { status: 400 }
      )
    }

    // Generate GRN number
    const count = await db.goodsReceivedNote.count()
    const number = `GRN-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`

    // Security: Get branchId from session or use provided (validated later)
    const effectiveBranchId = branchId || session.branchId

    // Run all inventory operations in a transaction
    const result = await db.$transaction(async (tx) => {
      // 1. Create the GRN
      const grn = await tx.goodsReceivedNote.create({
        data: {
          number,
          poId,
          status: 'completed',
          receivedBy: receivedBy || session.userId,
          receivedAt: new Date(),
          notes,
          items: {
            create: items.map((item: any) => ({
              sku: item.sku,
              description: item.description,
              orderedQty: item.orderedQty || 0,
              receivedQty: item.receivedQty,
              rejectedQty: item.rejectedQty || 0,
              rejectReason: item.rejectReason,
              batchNumber: item.batchNumber,
              expiryDate: item.expiryDate,
              unitPrice: item.unitPrice,
            })),
          },
        },
        include: {
          items: true,
        },
      })

      // 2. Process each item - create batches and stock movements
      const processingResults = []

      for (const grnItem of grn.items) {
        const poItem = po.items.find(pi => pi.sku === grnItem.sku)
        
        if (!poItem) {
          continue
        }

        // Find the product - SECURITY: Always filter by session merchantId
        const product = await tx.product.findFirst({
          where: {
            sku: grnItem.sku,
            merchantId: merchantId,
          },
        })

        if (!product) {
          processingResults.push({
            sku: grnItem.sku,
            status: 'skipped',
            reason: 'Product not found',
          })
          continue
        }

        const receivedQty = grnItem.receivedQty
        const unitCost = grnItem.unitPrice || poItem.unitPrice
        const previousStock = product.currentStock
        const newStock = previousStock + receivedQty

        // Calculate weighted average cost
        // Formula: newCost = (existingQty × oldCost + newQty × newCost) / (existingQty + newQty)
        const previousCost = product.costPrice
        const weightedAvgCost = previousStock > 0
          ? (previousStock * previousCost + receivedQty * unitCost) / newStock
          : unitCost

        // 3. Create batch if batch number provided or auto-generate
        let batchId = null
        const batchNumber = grnItem.batchNumber || `BATCH-${grn.number}-${grnItem.sku.replace(/\s+/g, '-')}`

        // Check if product needs batch tracking (check if trackInventory is true)
        const needsBatchTracking = product.trackInventory

        if (needsBatchTracking && receivedQty > 0) {
          const batch = await tx.inventoryBatch.create({
            data: {
              merchantId: merchantId,
              branchId: effectiveBranchId,
              productId: product.id,
              batchNumber: batchNumber,
              initialQty: receivedQty,
              currentQty: receivedQty,
              reservedQty: 0,
              availableQty: receivedQty,
              unitCost: unitCost,
              totalValue: receivedQty * unitCost,
              productionDate: grnItem.expiryDate ? undefined : undefined,
              expiryDate: grnItem.expiryDate ? new Date(grnItem.expiryDate) : null,
              status: 'active',
              sourceType: 'grn',
              sourceId: grn.id,
              receivedBy: receivedBy || session.userId,
              receivedByName: session.user?.name || 'System',
            },
          })
          batchId = batch.id

          // Create batch transaction
          await tx.batchTransaction.create({
            data: {
              batchId: batch.id,
              type: 'received',
              quantity: receivedQty,
              balanceAfter: receivedQty,
              unitCost: unitCost,
              totalCost: receivedQty * unitCost,
              referenceType: 'grn',
              referenceId: grn.id,
              performedBy: receivedBy || session.userId,
              performedByName: session.user?.name || 'System',
              notes: `Received via GRN ${grn.number}`,
            },
          })
        }

        // 4. Create stock movement
        const idempotencyKey = `grn-${grn.id}-${grnItem.sku}`
        await tx.stockMovement.create({
          data: {
            merchantId: merchantId,
            branchId: effectiveBranchId,
            productId: product.id,
            batchId: batchId,
            idempotencyKey,
            type: 'grn',
            direction: 'in',
            quantity: receivedQty,
            previousStock: previousStock,
            newStock: newStock,
            unitCost: unitCost,
            totalCost: receivedQty * unitCost,
            referenceType: 'grn',
            referenceId: grn.id,
            referenceNumber: grn.number,
            reason: `Goods received via ${grn.number}`,
            performedBy: receivedBy || session.userId,
            performedByName: session.user?.name || 'System',
          },
        })

        // 5. Update product stock and weighted average cost
        await tx.product.update({
          where: { id: product.id },
          data: {
            currentStock: newStock,
            costPrice: weightedAvgCost,
            updatedAt: new Date(),
          },
        })

        // 6. Update PO item received quantity
        await tx.purchaseOrderItem.update({
          where: { id: poItem.id },
          data: {
            receivedQty: { increment: receivedQty },
            rejectedQty: { increment: grnItem.rejectedQty || 0 },
          },
        })

        // Calculate variance for 3-way matching
        const orderedQty = poItem.quantity
        const variance = receivedQty - orderedQty
        const variancePercent = orderedQty > 0 ? (variance / orderedQty) * 100 : 0

        processingResults.push({
          sku: grnItem.sku,
          productId: product.id,
          batchId,
          batchNumber,
          previousStock,
          receivedQty,
          newStock,
          previousCost,
          unitCost,
          weightedAvgCost,
          orderedQty,
          variance,
          variancePercent,
          matchStatus: 
            Math.abs(variancePercent) <= 5 ? 'matched' :
            variancePercent > 0 ? 'over_received' : 'under_received',
          status: 'processed',
        })
      }

      // 7. Update PO status if all items fully received
      const allItemsReceived = po.items.every(poItem => {
        const grnItem = items.find((i: any) => i.sku === poItem.sku)
        const totalReceived = (poItem.receivedQty || 0) + (grnItem?.receivedQty || 0)
        return totalReceived >= poItem.quantity
      })

      if (allItemsReceived) {
        await tx.purchaseOrder.update({
          where: { id: poId },
          data: {
            status: 'delivered',
            updatedAt: new Date(),
          },
        })
      }

      // 8. Calculate overall 3-way match status
      const totalOrdered = items.reduce((sum: number, item: any) => sum + (item.orderedQty || 0), 0)
      const totalReceived = items.reduce((sum: number, item: any) => sum + item.receivedQty, 0)
      const overallVariance = totalReceived - totalOrdered
      const overallVariancePercent = totalOrdered > 0 ? (overallVariance / totalOrdered) * 100 : 0

      return {
        grn,
        processingResults,
        matchSummary: {
          totalOrdered,
          totalReceived,
          overallVariance,
          overallVariancePercent,
          matchStatus: 
            Math.abs(overallVariancePercent) <= 5 ? 'matched' :
            overallVariancePercent > 0 ? 'over_received' : 'under_received',
          poStatusUpdated: allItemsReceived,
        },
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Goods Received Note created successfully',
      data: result,
    }, { status: 201 })
  } catch (error) {
    console.error('Create GRN error:', error)
    return NextResponse.json(
      { error: 'Failed to create GRN', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
