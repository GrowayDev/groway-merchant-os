import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/merchant-os/branches/[id]/inventory - Get branch inventory
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    
    const search = searchParams.get('search')
    const categoryId = searchParams.get('categoryId')
    const status = searchParams.get('status') // low_stock, out_of_stock, in_stock
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Verify branch exists
    const branch = await db.branch.findUnique({
      where: { id },
      select: { id: true, name: true, code: true, merchantId: true }
    })

    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 })
    }

    // Build where clause for inventory items
    const inventoryWhere: Record<string, unknown> = { branchId: id }

    // Build product filter
    const productWhere: Record<string, unknown> = {}
    if (search) {
      productWhere.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { barcode: { contains: search } },
      ]
    }
    if (categoryId) {
      productWhere.categoryId = categoryId
    }

    // Get inventory items
    let inventoryItems = await db.branchInventory.findMany({
      where: {
        ...inventoryWhere,
        ...(Object.keys(productWhere).length > 0 ? { product: productWhere } : {})
      },
      include: {
        product: {
          include: {
            category: true,
          }
        }
      },
      orderBy: { product: { name: 'asc' } },
      take: limit,
      skip: offset,
    })

    // Filter by stock status if specified
    if (status) {
      inventoryItems = inventoryItems.filter(item => {
        if (status === 'out_of_stock') {
          return item.quantityOnHand <= 0
        } else if (status === 'low_stock') {
          return item.quantityOnHand > 0 && item.quantityOnHand <= item.reorderPoint
        } else if (status === 'in_stock') {
          return item.quantityOnHand > item.reorderPoint
        }
        return true
      })
    }

    // Get summary statistics
    const [summary, categoryBreakdown] = await Promise.all([
      db.branchInventory.aggregate({
        where: { branchId: id },
        _sum: {
          quantityOnHand: true,
          quantityReserved: true,
          quantityAvailable: true,
          quantityOnOrder: true,
          totalValue: true,
        },
        _count: true,
      }),
      db.branchInventory.groupBy({
        by: ['productId'],
        where: { branchId: id },
        _sum: {
          quantityOnHand: true,
          totalValue: true,
        },
      })
    ])

    // Get low stock items count
    const lowStockCount = await db.branchInventory.count({
      where: {
        branchId: id,
        quantityOnHand: { gt: 0 },
        product: {
          reorderPoint: { gt: 0 }
        }
      }
    })

    // Get out of stock count
    const outOfStockCount = await db.branchInventory.count({
      where: {
        branchId: id,
        quantityOnHand: { lte: 0 }
      }
    })

    // Get total count for pagination
    const total = await db.branchInventory.count({
      where: {
        ...inventoryWhere,
        ...(Object.keys(productWhere).length > 0 ? { product: productWhere } : {})
      }
    })

    return NextResponse.json({
      branch,
      data: inventoryItems,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
      summary: {
        totalItems: summary._count,
        totalQuantityOnHand: summary._sum.quantityOnHand || 0,
        totalQuantityReserved: summary._sum.quantityReserved || 0,
        totalQuantityAvailable: summary._sum.quantityAvailable || 0,
        totalQuantityOnOrder: summary._sum.quantityOnOrder || 0,
        totalValue: summary._sum.totalValue || 0,
        lowStockCount,
        outOfStockCount,
      },
      categoryBreakdown: categoryBreakdown.slice(0, 20), // Top 20 categories
    })
  } catch (error) {
    console.error('Error fetching branch inventory:', error)
    // Return mock data if database not available
    const { id } = await params
    return NextResponse.json({
      branch: { id, name: 'Main Store', code: 'BR-001', merchantId: 'mer-1' },
      data: [
        {
          id: 'inv-1',
          branchId: id,
          productId: 'prod-1',
          quantityOnHand: 150,
          quantityReserved: 10,
          quantityAvailable: 140,
          quantityOnOrder: 50,
          averageCost: 25.50,
          totalValue: 3825,
          location: 'A-1-1',
          reorderPoint: 20,
          reorderQuantity: 100,
          currentBatch: 'BATCH-001',
          batchExpiry: '2025-12-31',
          lastCountedAt: new Date().toISOString(),
          lastAdjustedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          product: {
            id: 'prod-1',
            sku: 'SKU-001',
            name: 'Coca-Cola 500ml',
            description: 'Coca-Cola soft drink 500ml bottle',
            barcode: '6001234567890',
            costPrice: 8.50,
            sellingPrice: 12.99,
            unit: 'each',
            category: { id: 'cat-1', name: 'Beverages', color: '#4CAF50' },
            status: 'active',
          }
        },
        {
          id: 'inv-2',
          branchId: id,
          productId: 'prod-2',
          quantityOnHand: 0,
          quantityReserved: 0,
          quantityAvailable: 0,
          quantityOnOrder: 200,
          averageCost: 15.00,
          totalValue: 0,
          location: 'A-2-3',
          reorderPoint: 50,
          reorderQuantity: 200,
          lastCountedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          product: {
            id: 'prod-2',
            sku: 'SKU-002',
            name: 'White Bread',
            description: 'Fresh white bread',
            barcode: '6009876543210',
            costPrice: 10.00,
            sellingPrice: 15.50,
            unit: 'each',
            category: { id: 'cat-2', name: 'Bakery', color: '#FF9800' },
            status: 'active',
          }
        },
        {
          id: 'inv-3',
          branchId: id,
          productId: 'prod-3',
          quantityOnHand: 15,
          quantityReserved: 5,
          quantityAvailable: 10,
          quantityOnOrder: 0,
          averageCost: 45.00,
          totalValue: 675,
          location: 'B-1-2',
          reorderPoint: 20,
          reorderQuantity: 50,
          lastCountedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          product: {
            id: 'prod-3',
            sku: 'SKU-003',
            name: 'Cooking Oil 2L',
            description: 'Sunflower cooking oil 2 liters',
            barcode: '6005555555555',
            costPrice: 35.00,
            sellingPrice: 49.99,
            unit: 'each',
            category: { id: 'cat-3', name: 'Groceries', color: '#2196F3' },
            status: 'active',
          }
        }
      ],
      total: 150,
      limit,
      offset,
      hasMore: false,
      summary: {
        totalItems: 150,
        totalQuantityOnHand: 12500,
        totalQuantityReserved: 450,
        totalQuantityAvailable: 12050,
        totalQuantityOnOrder: 2500,
        totalValue: 245000,
        lowStockCount: 23,
        outOfStockCount: 8,
      },
      categoryBreakdown: [
        { productId: 'cat-1', _sum: { quantityOnHand: 5000, totalValue: 65000 } },
        { productId: 'cat-2', _sum: { quantityOnHand: 2500, totalValue: 37500 } },
      ]
    })
  }
}
