import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get branch details with stats
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
            code: true,
            vertical: true,
            subVertical: true
          }
        },
        _count: {
          select: {
            products: true,
            transactions: true,
            stockMovements: true,
            transfersFrom: true,
            transfersTo: true
          }
        }
      }
    })
    
    if (!branch) {
      return NextResponse.json(
        { error: 'Branch not found' },
        { status: 404 }
      )
    }
    
    // Calculate detailed stats
    
    // Transaction stats for different periods
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    // Last 30 days transactions
    const transactions30Days = await db.transaction.findMany({
      where: {
        branchId: id,
        createdAt: { gte: thirtyDaysAgo },
        status: 'completed'
      },
      select: { total: true, createdAt: true }
    })
    
    // Last 7 days transactions
    const transactions7Days = await db.transaction.findMany({
      where: {
        branchId: id,
        createdAt: { gte: sevenDaysAgo },
        status: 'completed'
      },
      select: { total: true }
    })
    
    // Today's transactions
    const transactionsToday = await db.transaction.findMany({
      where: {
        branchId: id,
        createdAt: { gte: todayStart },
        status: 'completed'
      },
      select: { total: true }
    })
    
    // Calculate revenues
    const revenue30Days = transactions30Days.reduce((sum, t) => sum + t.total, 0)
    const revenue7Days = transactions7Days.reduce((sum, t) => sum + t.total, 0)
    const revenueToday = transactionsToday.reduce((sum, t) => sum + t.total, 0)
    
    // Inventory stats
    const products = await db.product.findMany({
      where: {
        branchId: id,
        isActive: true
      },
      select: {
        currentStock: true,
        costPrice: true,
        sellingPrice: true,
        lowStockThreshold: true
      }
    })
    
    const inventoryValue = products.reduce(
      (sum, p) => sum + p.currentStock * p.costPrice,
      0
    )
    
    const retailValue = products.reduce(
      (sum, p) => sum + p.currentStock * p.sellingPrice,
      0
    )
    
    const lowStockProducts = products.filter(
      p => p.currentStock <= p.lowStockThreshold
    ).length
    
    const outOfStockProducts = products.filter(p => p.currentStock === 0).length
    
    // Recent stock movements
    const recentMovements = await db.stockMovement.findMany({
      where: { branchId: id },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: { id: true, name: true, sku: true }
        }
      }
    })
    
    // Pending transfers
    const pendingTransfersOut = await db.stockTransfer.count({
      where: {
        fromBranchId: id,
        status: { in: ['draft', 'pending', 'approved'] }
      }
    })
    
    const pendingTransfersIn = await db.stockTransfer.count({
      where: {
        toBranchId: id,
        status: { in: ['approved', 'in_transit'] }
      }
    })
    
    return NextResponse.json({
      branch,
      stats: {
        revenue: {
          today: revenueToday,
          last7Days: revenue7Days,
          last30Days: revenue30Days,
          transactionCount30Days: transactions30Days.length
        },
        inventory: {
          totalProducts: products.length,
          inventoryValue,
          retailValue,
          lowStockCount: lowStockProducts,
          outOfStockCount: outOfStockProducts
        },
        transfers: {
          pendingOut: pendingTransfersOut,
          pendingIn: pendingTransfersIn
        }
      },
      recentMovements
    })
  } catch (error) {
    console.error('Error fetching branch:', error)
    return NextResponse.json(
      { error: 'Failed to fetch branch' },
      { status: 500 }
    )
  }
}

// PUT - Update branch details
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
      return NextResponse.json(
        { error: 'Branch not found' },
        { status: 404 }
      )
    }
    
    const {
      code,
      name,
      type,
      
      // Contact
      phone,
      email,
      managerName,
      managerPhone,
      
      // Address
      addressLine1,
      addressLine2,
      city,
      province,
      postalCode,
      latitude,
      longitude,
      
      // Operating hours
      operatingHours,
      
      // Settings
      isDefault,
      isActive
    } = body
    
    // If changing the code, check for duplicates
    if (code && code !== existingBranch.code) {
      const duplicateCode = await db.branch.findFirst({
        where: {
          merchantId: existingBranch.merchantId,
          code,
          id: { not: id }
        }
      })
      
      if (duplicateCode) {
        return NextResponse.json(
          { error: 'Branch code already exists for this merchant' },
          { status: 409 }
        )
      }
    }
    
    // If setting as default, unset other defaults
    if (isDefault && !existingBranch.isDefault) {
      await db.branch.updateMany({
        where: {
          merchantId: existingBranch.merchantId,
          isDefault: true,
          id: { not: id }
        },
        data: { isDefault: false }
      })
    }
    
    // Build update data
    const updateData: Record<string, unknown> = {}
    
    if (code !== undefined) updateData.code = code
    if (name !== undefined) updateData.name = name
    if (type !== undefined) updateData.type = type
    if (phone !== undefined) updateData.phone = phone
    if (email !== undefined) updateData.email = email
    if (managerName !== undefined) updateData.managerName = managerName
    if (managerPhone !== undefined) updateData.managerPhone = managerPhone
    if (addressLine1 !== undefined) updateData.addressLine1 = addressLine1
    if (addressLine2 !== undefined) updateData.addressLine2 = addressLine2
    if (city !== undefined) updateData.city = city
    if (province !== undefined) updateData.province = province
    if (postalCode !== undefined) updateData.postalCode = postalCode
    if (latitude !== undefined) updateData.latitude = latitude ? parseFloat(latitude) : null
    if (longitude !== undefined) updateData.longitude = longitude ? parseFloat(longitude) : null
    if (operatingHours !== undefined) updateData.operatingHours = operatingHours
    if (isDefault !== undefined) updateData.isDefault = isDefault
    if (isActive !== undefined) updateData.isActive = isActive
    
    // Update the branch
    const branch = await db.branch.update({
      where: { id },
      data: updateData,
      include: {
        merchant: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    })
    
    return NextResponse.json({ branch })
  } catch (error) {
    console.error('Error updating branch:', error)
    return NextResponse.json(
      { error: 'Failed to update branch' },
      { status: 500 }
    )
  }
}

// DELETE - Soft delete branch (set isActive = false)
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
            products: true,
            transactions: true
          }
        }
      }
    })
    
    if (!existingBranch) {
      return NextResponse.json(
        { error: 'Branch not found' },
        { status: 404 }
      )
    }
    
    // Prevent deletion of default branch
    if (existingBranch.isDefault) {
      return NextResponse.json(
        { error: 'Cannot delete the default branch. Set another branch as default first.' },
        { status: 400 }
      )
    }
    
    // Check for active inventory or transactions
    if (existingBranch._count.products > 0 || existingBranch._count.transactions > 0) {
      // Soft delete instead of hard delete
      const branch = await db.branch.update({
        where: { id },
        data: { isActive: false }
      })
      
      return NextResponse.json({
        branch,
        message: 'Branch has been deactivated (soft deleted) due to existing data'
      })
    }
    
    // If no dependencies, we can still soft delete
    const branch = await db.branch.update({
      where: { id },
      data: { isActive: false }
    })
    
    return NextResponse.json({
      branch,
      message: 'Branch has been deactivated'
    })
  } catch (error) {
    console.error('Error deleting branch:', error)
    return NextResponse.json(
      { error: 'Failed to delete branch' },
      { status: 500 }
    )
  }
}
