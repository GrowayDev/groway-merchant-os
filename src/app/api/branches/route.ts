import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - List branches for a merchant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Required: merchantId
    const merchantId = searchParams.get('merchantId')
    
    if (!merchantId) {
      return NextResponse.json(
        { error: 'merchantId is required' },
        { status: 400 }
      )
    }
    
    // Optional filters
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const search = searchParams.get('search') || ''
    
    // Build where clause
    const where: Record<string, unknown> = {
      merchantId
    }
    
    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }
    
    if (type) {
      where.type = type
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { city: { contains: search } }
      ]
    }
    
    // Get branches with stats
    const branches = await db.branch.findMany({
      where,
      include: {
        _count: {
          select: {
            products: true,
            transactions: true,
            stockMovements: true
          }
        }
      },
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' }
      ]
    })
    
    // Calculate additional stats for each branch
    const branchesWithStats = await Promise.all(
      branches.map(async (branch) => {
        // Get transaction totals for the last 30 days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        const transactions = await db.transaction.findMany({
          where: {
            branchId: branch.id,
            createdAt: { gte: thirtyDaysAgo },
            status: 'completed'
          },
          select: { total: true }
        })
        
        const revenue30Days = transactions.reduce((sum, t) => sum + t.total, 0)
        
        // Get current inventory value
        const products = await db.product.findMany({
          where: {
            branchId: branch.id,
            isActive: true
          },
          select: {
            currentStock: true,
            costPrice: true
          }
        })
        
        const inventoryValue = products.reduce(
          (sum, p) => sum + p.currentStock * p.costPrice,
          0
        )
        
        return {
          ...branch,
          stats: {
            revenue30Days,
            inventoryValue,
            transactionCount: branch._count.transactions,
            productCount: branch._count.products
          }
        }
      })
    )
    
    return NextResponse.json({
      branches: branchesWithStats,
      total: branchesWithStats.length
    })
  } catch (error) {
    console.error('Error fetching branches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch branches' },
      { status: 500 }
    )
  }
}

// POST - Create a new branch/location
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      merchantId,
      code,
      name,
      type = 'store',
      
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
      
      // Operating hours (JSON string)
      operatingHours,
      
      // Settings
      isDefault = false
    } = body
    
    // Validate required fields
    if (!merchantId || !code || !name) {
      return NextResponse.json(
        { error: 'merchantId, code, and name are required' },
        { status: 400 }
      )
    }
    
    // Check if merchant exists
    const merchant = await db.merchant.findUnique({
      where: { id: merchantId }
    })
    
    if (!merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      )
    }
    
    // Check if branch code already exists for this merchant
    const existingBranch = await db.branch.findFirst({
      where: {
        merchantId,
        code
      }
    })
    
    if (existingBranch) {
      return NextResponse.json(
        { error: 'Branch code already exists for this merchant' },
        { status: 409 }
      )
    }
    
    // If this is the default branch, unset other defaults
    if (isDefault) {
      await db.branch.updateMany({
        where: {
          merchantId,
          isDefault: true
        },
        data: { isDefault: false }
      })
    }
    
    // Create the branch
    const branch = await db.branch.create({
      data: {
        merchantId,
        code,
        name,
        type,
        phone,
        email,
        managerName,
        managerPhone,
        addressLine1,
        addressLine2,
        city,
        province,
        postalCode,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        operatingHours,
        isDefault,
        isActive: true
      },
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
    
    return NextResponse.json({ branch }, { status: 201 })
  } catch (error) {
    console.error('Error creating branch:', error)
    
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Branch with this code already exists' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create branch' },
      { status: 500 }
    )
  }
}
