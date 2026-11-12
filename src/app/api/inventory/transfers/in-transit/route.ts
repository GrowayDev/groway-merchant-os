import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/permissions'

/**
 * GET /api/inventory/transfers/in-transit
 * Get all in-transit transfers with batch visibility
 * 
 * Query params:
 * - merchantId: required
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
    const branchId = searchParams.get('branchId')

    if (!merchantId) {
      return NextResponse.json(
        { error: 'merchantId is required' },
        { status: 400 }
      )
    }

    // Build where clause
    const where: any = {
      merchantId,
      status: 'in_transit',
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
                barcode: true,
                unit: true,
                costPrice: true,
              },
            },
          },
        },
        fromBranch: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
            address: true,
            city: true,
            phone: true,
          },
        },
        toBranch: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
            address: true,
            city: true,
            phone: true,
          },
        },
      },
      orderBy: { dispatchedAt: 'desc' },
    })

    // Get batch information for each item
    const inTransitBatches = await db.inventoryBatch.findMany({
      where: {
        merchantId,
        sourceType: 'transfer',
        status: 'active',
      },
      select: {
        id: true,
        batchNumber: true,
        productId: true,
        sourceId: true,
        currentQty: true,
        unitCost: true,
        branchId: true,
      },
    })

    // Calculate metrics
    const now = new Date()
    const metrics = {
      totalInTransit: transfers.length,
      totalItems: transfers.reduce((sum, t) => sum + t.items.length, 0),
      totalValue: transfers.reduce((sum, t) => sum + (t.totalValue || 0), 0),
      overdueCount: transfers.filter(t => {
        if (!t.estimatedArrival) return false
        return new Date(t.estimatedArrival) < now
      }).length,
      arrivingToday: transfers.filter(t => {
        if (!t.estimatedArrival) return false
        const eta = new Date(t.estimatedArrival)
        return eta.toDateString() === now.toDateString()
      }).length,
      byDestination: {} as Record<string, number>,
      bySource: {} as Record<string, number>,
    }

    // Count by destination and source
    transfers.forEach(t => {
      const destName = t.toBranch?.name || 'Unknown'
      const sourceName = t.fromBranch?.name || 'Unknown'
      metrics.byDestination[destName] = (metrics.byDestination[destName] || 0) + 1
      metrics.bySource[sourceName] = (metrics.bySource[sourceName] || 0) + 1
    })

    // Enrich transfers with transit information
    const enrichedTransfers = transfers.map(transfer => {
      const itemsWithBatches = transfer.items.map(item => {
        // Find batches created for this transfer item
        const relatedBatches = inTransitBatches.filter(
          b => b.productId === item.productId && b.sourceId === transfer.id
        )

        // Calculate transit time
        const dispatchedAt = transfer.dispatchedAt ? new Date(transfer.dispatchedAt) : null
        const estimatedArrival = transfer.estimatedArrival ? new Date(transfer.estimatedArrival) : null
        
        let transitHours = 0
        let remainingHours = 0
        let isOverdue = false
        
        if (dispatchedAt) {
          transitHours = Math.round((now.getTime() - dispatchedAt.getTime()) / (1000 * 60 * 60))
        }
        
        if (estimatedArrival) {
          remainingHours = Math.round((estimatedArrival.getTime() - now.getTime()) / (1000 * 60 * 60))
          isOverdue = remainingHours < 0
        }

        return {
          ...item,
          batches: relatedBatches,
          transitHours,
          remainingHours,
          isOverdue,
          quantityInTransit: item.quantitySent || item.quantityRequested,
          value: (item.quantitySent || item.quantityRequested) * (item.unitCost || 0),
        }
      })

      // Calculate progress percentage
      let progressPercent = 0
      const dispatchedAt = transfer.dispatchedAt ? new Date(transfer.dispatchedAt) : null
      const estimatedArrival = transfer.estimatedArrival ? new Date(transfer.estimatedArrival) : null
      
      if (dispatchedAt && estimatedArrival) {
        const totalTime = estimatedArrival.getTime() - dispatchedAt.getTime()
        const elapsed = now.getTime() - dispatchedAt.getTime()
        progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / totalTime) * 100)))
      }

      return {
        ...transfer,
        itemsWithBatches,
        progressPercent,
        isOverdue: itemsWithBatches.some(i => i.isOverdue),
        totalTransitHours: itemsWithBatches[0]?.transitHours || 0,
        totalRemainingHours: itemsWithBatches[0]?.remainingHours || 0,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        transfers: enrichedTransfers,
        metrics,
      },
    })
  } catch (error) {
    console.error('Get in-transit transfers error:', error)
    return NextResponse.json(
      { error: 'Failed to get in-transit transfers', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
