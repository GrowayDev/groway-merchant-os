import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/permissions'

/**
 * GET /api/inventory/transfers/approval
 * Get pending transfer approvals for current user
 * 
 * Query params:
 * - merchantId: required
 * - status: optional (pending, approved, rejected)
 */
export async function GET(request: NextRequest) {
  const permissionCheck = await checkPermission(request, 'can_view_inventory')
  
  if (!permissionCheck.allowed) {
    return permissionCheck.error
  }

  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const status = searchParams.get('status') || 'pending'

    if (!merchantId) {
      return NextResponse.json(
        { error: 'merchantId is required' },
        { status: 400 }
      )
    }

    // Get transfers pending approval
    const where: any = { merchantId }
    
    if (status === 'pending') {
      where.status = { in: ['pending', 'draft'] }
    } else if (status === 'approved') {
      where.status = 'approved'
    } else if (status === 'rejected') {
      where.status = 'cancelled'
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
                currentStock: true,
                lowStockThreshold: true,
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
    })

    // Calculate approval metrics
    const metrics = {
      totalPending: transfers.filter(t => t.status === 'pending' || t.status === 'draft').length,
      totalValue: transfers.reduce((sum, t) => sum + (t.totalValue || 0), 0),
      urgentCount: transfers.filter(t => {
        const isUrgent = t.notes?.toLowerCase().includes('urgent') || 
                        t.notes?.toLowerCase().includes('critical')
        return isUrgent && (t.status === 'pending' || t.status === 'draft')
      }).length,
      highValueCount: transfers.filter(t => 
        (t.totalValue || 0) > 10000 && (t.status === 'pending' || t.status === 'draft')
      ).length,
    }

    // Add validation info for each transfer
    const validatedTransfers = transfers.map(transfer => {
      const validationIssues: string[] = []
      
      // Check source stock availability
      transfer.items.forEach(item => {
        if (item.product && item.product.currentStock < item.quantityRequested) {
          validationIssues.push(
            `Insufficient stock for ${item.product.name}: Need ${item.quantityRequested}, Have ${item.product.currentStock}`
          )
        }
      })

      return {
        ...transfer,
        validationIssues,
        canApprove: validationIssues.length === 0 && transfer.status !== 'cancelled',
        isUrgent: transfer.notes?.toLowerCase().includes('urgent') || 
                  transfer.notes?.toLowerCase().includes('critical'),
        isHighValue: (transfer.totalValue || 0) > 10000,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        transfers: validatedTransfers,
        metrics,
      },
    })
  } catch (error) {
    console.error('Get transfer approvals error:', error)
    return NextResponse.json(
      { error: 'Failed to get transfer approvals', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/inventory/transfers/approval
 * Approve or reject a transfer request
 * 
 * Body:
 * - transferId: required
 * - action: required (approve, reject)
 * - notes: optional
 */
export async function POST(request: NextRequest) {
  const permissionCheck = await checkPermission(request, 'can_approve_transfer')
  
  if (!permissionCheck.allowed) {
    return permissionCheck.error
  }

  const session = permissionCheck.session!

  try {
    const body = await request.json()
    const { transferId, action, notes } = body

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
            product: {
              select: { currentStock: true, name: true },
            },
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

    if (transfer.status !== 'pending' && transfer.status !== 'draft') {
      return NextResponse.json(
        { error: `Cannot approve/reject transfer with status: ${transfer.status}` },
        { status: 400 }
      )
    }

    if (action === 'reject') {
      const updated = await db.stockTransfer.update({
        where: { id: transferId },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancelledBy: session.userId,
          cancelledByName: session.user?.name || 'System',
          cancelledReason: notes || 'Rejected by approver',
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Transfer rejected',
        data: updated,
      })
    }

    if (action === 'approve') {
      // Validate stock availability before approving
      const stockIssues: string[] = []
      
      for (const item of transfer.items) {
        if (item.product && item.product.currentStock < item.quantityRequested) {
          stockIssues.push(
            `Insufficient stock for ${item.product.name}: Need ${item.quantityRequested}, Have ${item.product.currentStock}`
          )
        }
      }

      if (stockIssues.length > 0) {
        return NextResponse.json(
          { error: 'Cannot approve due to stock issues', details: stockIssues },
          { status: 400 }
        )
      }

      const updated = await db.stockTransfer.update({
        where: { id: transferId },
        data: {
          status: 'approved',
          approvedAt: new Date(),
          approvedBy: session.userId,
          approvedByName: session.user?.name || 'System',
          notes: notes ? `${transfer.notes || ''}\nApproval: ${notes}` : transfer.notes,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Transfer approved',
        data: updated,
      })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use: approve or reject' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Process transfer approval error:', error)
    return NextResponse.json(
      { error: 'Failed to process approval', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
