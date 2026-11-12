import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

/**
 * GET /api/merchant-os/inventory/analytics/velocity
 * Get stock velocity analysis for products
 * 
 * Query Parameters:
 * - merchantId: (required) Filter by merchant
 * - branchId: Filter by branch
 * - categoryId: Filter by category
 * - period: Analysis period in days (default: 30)
 * - minVelocity: Minimum velocity threshold
 * - maxVelocity: Maximum velocity threshold
 * - sortBy: Sort field (velocity, daysOfStock, name)
 * - sortOrder: Sort order (asc, desc)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const merchantId = searchParams.get('merchantId')
    const branchId = searchParams.get('branchId')
    const categoryId = searchParams.get('categoryId')
    const period = parseInt(searchParams.get('period') || '30')
    const minVelocity = searchParams.get('minVelocity') ? parseFloat(searchParams.get('minVelocity')!) : undefined
    const maxVelocity = searchParams.get('maxVelocity') ? parseFloat(searchParams.get('maxVelocity')!) : undefined
    const sortBy = searchParams.get('sortBy') || 'velocity'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
    }

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - period)

    // Get products with stock movements
    const productWhere: Prisma.ProductWhereInput = {
      merchantId,
      categoryId: categoryId || undefined,
      trackInventory: true
    }

    const products = await db.product.findMany({
      where: productWhere,
      include: {
        category: { select: { id: true, name: true } }
      }
    })

    // Get movements for the period
    const movements = await db.stockMovement.findMany({
      where: {
        product: { merchantId },
        branchId: branchId || undefined,
        type: 'sale',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        productId: true,
        quantity: true,
        createdAt: true
      }
    })

    // Aggregate movement data by product
    const movementByProduct = movements.reduce((acc, m) => {
      if (!acc[m.productId]) {
        acc[m.productId] = { totalQty: 0, count: 0, dates: [] }
      }
      acc[m.productId].totalQty += m.quantity
      acc[m.productId].count += 1
      acc[m.productId].dates.push(m.createdAt)
      return acc
    }, {} as Record<string, { totalQty: number; count: number; dates: Date[] }>)

    // Calculate velocity for each product
    const productVelocity = products.map(p => {
      const mvmt = movementByProduct[p.id] || { totalQty: 0, count: 0, dates: [] }
      
      // Daily velocity (units sold per day)
      const dailyVelocity = mvmt.totalQty / period
      
      // Days of stock remaining
      const daysOfStock = dailyVelocity > 0 ? Math.round(p.stockQuantity / dailyVelocity) : null
      
      // Stock turn rate (times inventory turned over in period)
      const avgStock = p.stockQuantity + (mvmt.totalQty / 2) // Approximate average
      const turnRate = avgStock > 0 ? mvmt.totalQty / avgStock : 0
      
      // Velocity classification
      let velocityClass: 'fast' | 'normal' | 'slow' | 'dead'
      if (dailyVelocity === 0 && mvmt.count === 0) {
        velocityClass = p.stockQuantity > 0 ? 'dead' : 'normal'
      } else if (dailyVelocity >= 2) {
        velocityClass = 'fast'
      } else if (dailyVelocity >= 0.5) {
        velocityClass = 'normal'
      } else {
        velocityClass = 'slow'
      }

      // Reorder urgency
      let reorderUrgency: 'critical' | 'high' | 'normal' | 'low' | null = null
      if (daysOfStock !== null && p.trackInventory) {
        if (daysOfStock <= 7) {
          reorderUrgency = 'critical'
        } else if (daysOfStock <= 14) {
          reorderUrgency = 'high'
        } else if (daysOfStock <= 30) {
          reorderUrgency = 'normal'
        } else {
          reorderUrgency = 'low'
        }
      }

      return {
        productId: p.id,
        sku: p.sku,
        name: p.name,
        categoryId: p.categoryId,
        categoryName: p.category?.name,
        currentStock: p.stockQuantity,
        stockValue: p.stockValue,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        reorderPoint: p.reorderPoint,
        reorderQuantity: p.reorderQuantity,
        
        // Movement data
        unitsSold: mvmt.totalQty,
        saleCount: mvmt.count,
        avgSaleSize: mvmt.count > 0 ? mvmt.totalQty / mvmt.count : 0,
        
        // Velocity metrics
        dailyVelocity: Math.round(dailyVelocity * 100) / 100,
        weeklyVelocity: Math.round(dailyVelocity * 7 * 100) / 100,
        monthlyVelocity: Math.round(dailyVelocity * 30 * 100) / 100,
        velocityClass,
        turnRate: Math.round(turnRate * 100) / 100,
        
        // Stock projections
        daysOfStock,
        projectedStockIn7Days: Math.max(0, p.stockQuantity - (dailyVelocity * 7)),
        projectedStockIn30Days: Math.max(0, p.stockQuantity - (dailyVelocity * 30)),
        
        // Reorder analysis
        reorderUrgency,
        needsReorder: p.stockQuantity <= p.reorderPoint,
        suggestedOrderQty: dailyVelocity > 0 
          ? Math.ceil(Math.max(p.reorderQuantity, dailyVelocity * 30) - p.stockQuantity)
          : p.reorderQuantity,
        suggestedOrderValue: dailyVelocity > 0
          ? Math.ceil(Math.max(p.reorderQuantity, dailyVelocity * 30) - p.stockQuantity) * p.costPrice
          : p.reorderQuantity * p.costPrice
      }
    })

    // Filter by velocity thresholds
    let filteredProducts = productVelocity
    if (minVelocity !== undefined) {
      filteredProducts = filteredProducts.filter(p => p.dailyVelocity >= minVelocity)
    }
    if (maxVelocity !== undefined) {
      filteredProducts = filteredProducts.filter(p => p.dailyVelocity <= maxVelocity)
    }

    // Sort results
    filteredProducts.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'velocity':
          comparison = a.dailyVelocity - b.dailyVelocity
          break
        case 'daysOfStock':
          comparison = (a.daysOfStock || Infinity) - (b.daysOfStock || Infinity)
          break
        case 'unitsSold':
          comparison = a.unitsSold - b.unitsSold
          break
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        default:
          comparison = a.dailyVelocity - b.dailyVelocity
      }
      return sortOrder === 'desc' ? -comparison : comparison
    })

    // Paginate
    const total = filteredProducts.length
    const paginatedProducts = filteredProducts.slice(skip, skip + limit)

    // Get summary statistics
    const summary = {
      totalProducts: productVelocity.length,
      fastMoving: productVelocity.filter(p => p.velocityClass === 'fast').length,
      normalMoving: productVelocity.filter(p => p.velocityClass === 'normal').length,
      slowMoving: productVelocity.filter(p => p.velocityClass === 'slow').length,
      deadStock: productVelocity.filter(p => p.velocityClass === 'dead').length,
      totalUnitsSold: productVelocity.reduce((sum, p) => sum + p.unitsSold, 0),
      totalRevenue: productVelocity.reduce((sum, p) => sum + (p.unitsSold * p.sellingPrice), 0),
      avgVelocity: productVelocity.reduce((sum, p) => sum + p.dailyVelocity, 0) / productVelocity.length,
      needsReorder: productVelocity.filter(p => p.needsReorder).length,
      criticalReorder: productVelocity.filter(p => p.reorderUrgency === 'critical').length
    }

    return NextResponse.json({
      data: paginatedProducts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      },
      summary,
      period: {
        days: period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    })
  } catch (error) {
    console.error('Error calculating stock velocity:', error)
    return NextResponse.json({ 
      error: 'Failed to calculate stock velocity',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
