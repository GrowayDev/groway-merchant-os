import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

/**
 * GET /api/merchant-os/inventory/analytics/dead-stock
 * Get dead stock analysis - products with no or very low movement
 * 
 * Query Parameters:
 * - merchantId: (required) Filter by merchant
 * - branchId: Filter by branch
 * - categoryId: Filter by category
 * - period: Analysis period in days (default: 90)
 * - includeSlowMoving: Include slow moving items (default: false)
 * - minStockValue: Minimum stock value to include (default: 0)
 * - sortBy: Sort field (stockValue, daysSinceLastSale, name)
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
    const period = parseInt(searchParams.get('period') || '90')
    const includeSlowMoving = searchParams.get('includeSlowMoving') === 'true'
    const minStockValue = parseFloat(searchParams.get('minStockValue') || '0')
    const sortBy = searchParams.get('sortBy') || 'stockValue'
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

    // Get products with stock but no/low sales
    const productWhere: Prisma.ProductWhereInput = {
      merchantId,
      categoryId: categoryId || undefined,
      trackInventory: true,
      stockQuantity: { gt: 0 }
    }

    const products = await db.product.findMany({
      where: productWhere,
      include: {
        category: { select: { id: true, name: true } }
      }
    })

    // Get sales movements for the period
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

    // Aggregate sales by product
    const salesByProduct = movements.reduce((acc, m) => {
      if (!acc[m.productId]) {
        acc[m.productId] = { totalQty: 0, lastSale: m.createdAt }
      }
      acc[m.productId].totalQty += m.quantity
      if (m.createdAt > acc[m.productId].lastSale) {
        acc[m.productId].lastSale = m.createdAt
      }
      return acc
    }, {} as Record<string, { totalQty: number; lastSale: Date }>)

    // Get last sale date for each product
    const lastSales = await db.stockMovement.groupBy({
      by: ['productId'],
      where: {
        product: { merchantId },
        type: 'sale'
      },
      _max: {
        createdAt: true
      }
    })

    const lastSaleMap = lastSales.reduce((acc, s) => {
      acc[s.productId] = s._max.createdAt
      return acc
    }, {} as Record<string, Date | null>)

    // Calculate dead stock for each product
    const deadStockItems = products.map(p => {
      const sales = salesByProduct[p.id]
      const lastSale = lastSaleMap[p.id]
      const daysSinceLastSale = lastSale 
        ? Math.floor((endDate.getTime() - lastSale.getTime()) / (1000 * 60 * 60 * 24))
        : period // No sales ever
      
      const stockValue = p.stockQuantity * p.costPrice
      
      // Determine stock category
      let category: 'dead' | 'slow' | 'aging'
      const avgDailySales = sales ? sales.totalQty / period : 0
      
      if (avgDailySales === 0 && daysSinceLastSale >= period) {
        category = 'dead'
      } else if (avgDailySales < 0.1 && daysSinceLastSale >= 60) {
        category = 'slow'
      } else {
        category = 'aging'
      }

      // Calculate holding cost (approximate)
      const monthlyHoldingCost = stockValue * 0.02 // 2% per month
      const totalHoldingCost = monthlyHoldingCost * (daysSinceLastSale / 30)

      // Suggested action
      let suggestedAction: 'markdown' | 'clearance' | 'donate' | 'dispose' | 'return' | 'keep'
      if (category === 'dead') {
        if (p.expiryTracking && daysSinceLastSale > 180) {
          suggestedAction = 'dispose'
        } else if (stockValue > 1000) {
          suggestedAction = 'clearance'
        } else {
          suggestedAction = 'markdown'
        }
      } else if (category === 'slow') {
        suggestedAction = 'markdown'
      } else {
        suggestedAction = 'keep'
      }

      // Calculate markdown recommendation
      const markdownPercent = category === 'dead' ? 50 : (category === 'slow' ? 30 : 15)
      const markdownPrice = p.sellingPrice * (1 - markdownPercent / 100)
      const projectedRecovery = p.stockQuantity * markdownPrice

      return {
        productId: p.id,
        sku: p.sku,
        name: p.name,
        categoryId: p.categoryId,
        categoryName: p.category?.name,
        brand: p.brand,
        
        // Stock info
        stockQuantity: p.stockQuantity,
        stockValue,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        unit: p.unit,
        
        // Sales info
        unitsSoldInPeriod: sales?.totalQty || 0,
        avgDailySales: Math.round(avgDailySales * 1000) / 1000,
        lastSaleDate: lastSale,
        daysSinceLastSale,
        
        // Category
        stockCategory: category,
        
        // Costs
        holdingCostPerMonth: Math.round(monthlyHoldingCost * 100) / 100,
        totalHoldingCost: Math.round(totalHoldingCost * 100) / 100,
        
        // Recommendations
        suggestedAction,
        markdownRecommendation: {
          percent: markdownPercent,
          originalPrice: p.sellingPrice,
          markdownPrice: Math.round(markdownPrice * 100) / 100,
          projectedRecovery: Math.round(projectedRecovery * 100) / 100,
          lossAmount: Math.round((stockValue - projectedRecovery) * 100) / 100
        },
        
        // Age
        productAge: {
          createdAt: p.createdAt,
          daysSinceCreation: Math.floor((endDate.getTime() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        },
        
        // Batch info if applicable
        hasBatches: p.batchTracking,
        hasExpiry: p.expiryTracking,
        shelfLife: p.shelfLife
      }
    })

    // Filter by category
    let filteredItems = deadStockItems
    if (!includeSlowMoving) {
      filteredItems = filteredItems.filter(item => item.stockCategory === 'dead')
    }

    // Filter by minimum stock value
    if (minStockValue > 0) {
      filteredItems = filteredItems.filter(item => item.stockValue >= minStockValue)
    }

    // Sort results
    filteredItems.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'stockValue':
          comparison = a.stockValue - b.stockValue
          break
        case 'daysSinceLastSale':
          comparison = a.daysSinceLastSale - b.daysSinceLastSale
          break
        case 'holdingCost':
          comparison = a.totalHoldingCost - b.totalHoldingCost
          break
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        default:
          comparison = a.stockValue - b.stockValue
      }
      return sortOrder === 'desc' ? -comparison : comparison
    })

    // Paginate
    const total = filteredItems.length
    const paginatedItems = filteredItems.slice(skip, skip + limit)

    // Calculate summary statistics
    const summary = {
      totalItems: deadStockItems.length,
      deadStockItems: deadStockItems.filter(i => i.stockCategory === 'dead').length,
      slowMovingItems: deadStockItems.filter(i => i.stockCategory === 'slow').length,
      agingItems: deadStockItems.filter(i => i.stockCategory === 'aging').length,
      
      totalDeadStockValue: deadStockItems
        .filter(i => i.stockCategory === 'dead')
        .reduce((sum, i) => sum + i.stockValue, 0),
      totalSlowMovingValue: deadStockItems
        .filter(i => i.stockCategory === 'slow')
        .reduce((sum, i) => sum + i.stockValue, 0),
      
      totalHoldingCost: deadStockItems.reduce((sum, i) => sum + i.totalHoldingCost, 0),
      potentialRecovery: deadStockItems
        .filter(i => i.stockCategory === 'dead' || i.stockCategory === 'slow')
        .reduce((sum, i) => sum + i.markdownRecommendation.projectedRecovery, 0),
      potentialLoss: deadStockItems
        .filter(i => i.stockCategory === 'dead' || i.stockCategory === 'slow')
        .reduce((sum, i) => sum + i.markdownRecommendation.lossAmount, 0),
      
      itemsNeedingAction: deadStockItems
        .filter(i => i.suggestedAction !== 'keep').length,
      itemsForClearance: deadStockItems
        .filter(i => i.suggestedAction === 'clearance').length,
      itemsForMarkdown: deadStockItems
        .filter(i => i.suggestedAction === 'markdown').length,
      itemsForDisposal: deadStockItems
        .filter(i => i.suggestedAction === 'dispose').length
    }

    // Group by category
    const byCategory = deadStockItems.reduce((acc, item) => {
      const cat = item.categoryName || 'Uncategorized'
      if (!acc[cat]) {
        acc[cat] = { count: 0, value: 0, deadCount: 0, deadValue: 0 }
      }
      acc[cat].count += 1
      acc[cat].value += item.stockValue
      if (item.stockCategory === 'dead') {
        acc[cat].deadCount += 1
        acc[cat].deadValue += item.stockValue
      }
      return acc
    }, {} as Record<string, { count: number; value: number; deadCount: number; deadValue: number }>)

    return NextResponse.json({
      data: paginatedItems,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      },
      summary,
      byCategory: Object.entries(byCategory).map(([category, data]) => ({
        category,
        itemCount: data.count,
        totalValue: Math.round(data.value * 100) / 100,
        deadStockCount: data.deadCount,
        deadStockValue: Math.round(data.deadValue * 100) / 100
      })),
      period: {
        days: period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    })
  } catch (error) {
    console.error('Error analyzing dead stock:', error)
    return NextResponse.json({ 
      error: 'Failed to analyze dead stock',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
