import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/merchant-os/branches/[id] - Get a single branch
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const branch = await db.branch.findUnique({
      where: { id },
      include: {
        merchant: {
          select: {
            id: true,
            name: true,
            tradingName: true,
            vatRate: true,
            currency: true,
          }
        },
        _count: {
          select: {
            inventory: true,
            stockTransfersFrom: true,
            stockTransfersTo: true,
          }
        }
      }
    })

    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 })
    }

    // Get inventory summary
    const inventorySummary = await db.branchInventory.aggregate({
      where: { branchId: id },
      _sum: {
        quantityOnHand: true,
        totalValue: true,
      },
      _count: true,
    })

    // Get recent transfers
    const recentTransfers = await db.stockTransfer.findMany({
      where: {
        OR: [
          { fromBranchId: id },
          { toBranchId: id }
        ]
      },
      include: {
        fromBranch: { select: { id: true, name: true, code: true } },
        toBranch: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    return NextResponse.json({
      ...branch,
      inventorySummary: {
        totalItems: inventorySummary._count,
        totalQuantity: inventorySummary._sum.quantityOnHand || 0,
        totalValue: inventorySummary._sum.totalValue || 0,
      },
      recentTransfers,
    })
  } catch (error) {
    console.error('Error fetching branch:', error)
    return NextResponse.json({ error: 'Failed to fetch branch' }, { status: 500 })
  }
}

// PUT /api/merchant-os/branches/[id] - Update a branch
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check if branch exists
    const existingBranch = await db.branch.findUnique({
      where: { id }
    })

    if (!existingBranch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 })
    }

    // If code is being changed, check for duplicates
    if (body.code && body.code !== existingBranch.code) {
      const duplicateCode = await db.branch.findFirst({
        where: {
          merchantId: existingBranch.merchantId,
          code: body.code,
          id: { not: id }
        }
      })
      if (duplicateCode) {
        return NextResponse.json({ 
          error: 'Branch code already exists for this merchant' 
        }, { status: 400 })
      }
    }

    // If setting as default, unset other defaults
    if (body.isDefault && !existingBranch.isDefault) {
      await db.branch.updateMany({
        where: {
          merchantId: existingBranch.merchantId,
          isDefault: true,
          id: { not: id }
        },
        data: { isDefault: false }
      })
    }

    const branch = await db.branch.update({
      where: { id },
      data: {
        code: body.code,
        name: body.name,
        type: body.type,
        phone: body.phone,
        email: body.email,
        addressLine1: body.addressLine1,
        addressLine2: body.addressLine2,
        city: body.city,
        province: body.province,
        postalCode: body.postalCode,
        country: body.country,
        managerId: body.managerId,
        managerName: body.managerName,
        operatingHours: body.operatingHours,
        status: body.status,
        isDefault: body.isDefault,
        isWarehouse: body.isWarehouse,
        terminalPrefix: body.terminalPrefix,
        receiptHeader: body.receiptHeader,
        receiptFooter: body.receiptFooter,
        updatedAt: new Date(),
      },
      include: {
        merchant: {
          select: {
            id: true,
            name: true,
            tradingName: true,
          }
        }
      }
    })

    return NextResponse.json(branch)
  } catch (error) {
    console.error('Error updating branch:', error)
    return NextResponse.json({ 
      error: 'Failed to update branch',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE /api/merchant-os/branches/[id] - Soft delete a branch
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if branch exists
    const existingBranch = await db.branch.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            inventory: true,
            stockTransfersFrom: true,
            stockTransfersTo: true,
          }
        }
      }
    })

    if (!existingBranch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 })
    }

    // Check if this is the default branch
    if (existingBranch.isDefault) {
      return NextResponse.json({ 
        error: 'Cannot delete the default branch. Set another branch as default first.' 
      }, { status: 400 })
    }

    // Check for pending transfers
    const pendingTransfers = await db.stockTransfer.count({
      where: {
        OR: [
          { fromBranchId: id, status: { in: ['draft', 'pending', 'approved', 'in_transit'] } },
          { toBranchId: id, status: { in: ['draft', 'pending', 'approved', 'in_transit'] } }
        ]
      }
    })

    if (pendingTransfers > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete branch with pending transfers. Complete or cancel transfers first.' 
      }, { status: 400 })
    }

    // Soft delete by setting status to inactive
    const branch = await db.branch.update({
      where: { id },
      data: {
        status: 'inactive',
        updatedAt: new Date(),
      }
    })

    // Update merchant's totalBranches count
    await db.merchant.update({
      where: { id: existingBranch.merchantId },
      data: { totalBranches: { decrement: 1 } }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Branch has been deactivated',
      branch 
    })
  } catch (error) {
    console.error('Error deleting branch:', error)
    return NextResponse.json({ 
      error: 'Failed to delete branch',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
