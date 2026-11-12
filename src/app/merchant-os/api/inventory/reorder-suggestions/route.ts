import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface ReorderSuggestion {
  id: string
  productId: string
  productName: string
  sku: string
  currentStock: number
  reorderPoint: number
  suggestedOrderQty: number
  supplierId?: string
  supplierName: string
  leadTime: number
  estimatedCost: number
  urgency: 'critical' | 'high' | 'normal'
  reason: string
  daysOfStockLeft: number
  averageDailyUsage: number
  catalogMatch?: {
    catalogProductId: string
    costPrice: number
    inStock: boolean
  }
}

// GET /api/inventory/reorder-suggestions - Get smart reorder suggestions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const includeCatalogMatch = searchParams.get('includeCatalogMatch') === 'true'

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
    }

    // Get products that are at or below reorder point
    const lowStockProducts = await db.product.findMany({
      where: {
        merchantId,
        isActive: true,
        OR: [
          { currentStock: { lte: db.product.fields.lowStockThreshold } },
          { currentStock: { equals: 0 } }
        ]
      },
      include: {
        category: true
      }
    })

    // Get stock movements to calculate average daily usage
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentMovements = await db.stockMovement.findMany({
      where: {
        merchantId,
        createdAt: { gte: thirtyDaysAgo },
        type: 'sale'
      }
    })

    // Calculate average daily usage per product
    const usageByProduct: Record<string, { total: number; days: number }> = {}
    recentMovements.forEach(movement => {
      // This would need adjustment based on actual schema
      const productId = movement.reference?.toString() || ''
      if (!usageByProduct[productId]) {
        usageByProduct[productId] = { total: 0, days: 30 }
      }
      usageByProduct[productId].total += Math.abs(movement.quantity || 0)
    })

    // Get catalog products for matching
    const catalogProducts = includeCatalogMatch ? await db.catalogProduct.findMany({
      where: { status: 'active' },
      take: 100
    }) : []

    // Generate suggestions
    const suggestions: ReorderSuggestion[] = []

    for (const product of lowStockProducts) {
      const usage = usageByProduct[product.id] || { total: 30, days: 30 } // Default 1/day
      const avgDailyUsage = usage.total / usage.days
      const daysOfStockLeft = avgDailyUsage > 0 ? Math.floor(product.currentStock / avgDailyUsage) : 999

      // Determine urgency
      let urgency: 'critical' | 'high' | 'normal'
      let reason: string

      if (product.currentStock === 0) {
        urgency = 'critical'
        reason = 'Out of stock - immediate reorder required'
      } else if (daysOfStockLeft <= 3) {
        urgency = 'critical'
        reason = `Only ${daysOfStockLeft} days of stock left`
      } else if (product.currentStock <= product.lowStockThreshold) {
        urgency = 'high'
        reason = 'Below reorder point'
      } else {
        urgency = 'normal'
        reason = 'Running low on stock'
      }

      // Calculate suggested order quantity (cover 30 days + safety buffer)
      const suggestedOrderQty = Math.ceil((avgDailyUsage * 45) - product.currentStock)

      // Try to match with catalog
      let catalogMatch = undefined
      if (includeCatalogMatch && catalogProducts.length > 0) {
        const matched = catalogProducts.find(cp => 
          cp.sku === product.sku || 
          cp.description.toLowerCase().includes(product.name.toLowerCase())
        )
        if (matched) {
          catalogMatch = {
            catalogProductId: matched.id,
            costPrice: matched.costPrice,
            inStock: matched.inStock
          }
        }
      }

      // Get supplier info
      const supplier = product.supplierId ? await db.supplier.findUnique({
        where: { id: product.supplierId }
      }) : null

      suggestions.push({
        id: `reorder-${product.id}`,
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        currentStock: product.currentStock,
        reorderPoint: product.lowStockThreshold,
        suggestedOrderQty: Math.max(suggestedOrderQty, product.lowStockThreshold * 2),
        supplierId: supplier?.id,
        supplierName: supplier?.name || 'Unknown Supplier',
        leadTime: supplier?.deliveryDays || 3,
        estimatedCost: suggestedOrderQty * (catalogMatch?.costPrice || product.costPrice || product.sellingPrice * 0.6),
        urgency,
        reason,
        daysOfStockLeft,
        averageDailyUsage: Math.round(avgDailyUsage * 10) / 10,
        catalogMatch
      })
    }

    // Sort by urgency (critical first) then by days of stock left
    suggestions.sort((a, b) => {
      const urgencyOrder = { critical: 0, high: 1, normal: 2 }
      if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
      }
      return a.daysOfStockLeft - b.daysOfStockLeft
    })

    // Summary stats
    const stats = {
      totalLowStock: lowStockProducts.length,
      outOfStock: lowStockProducts.filter(p => p.currentStock === 0).length,
      criticalItems: suggestions.filter(s => s.urgency === 'critical').length,
      estimatedOrderValue: suggestions.reduce((sum, s) => sum + s.estimatedCost, 0),
      potentialSavings: suggestions.reduce((sum, s) => sum + (s.estimatedCost * 0.15), 0) // 15% avg savings
    }

    return NextResponse.json({
      success: true,
      data: {
        suggestions,
        stats,
        generatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error generating reorder suggestions:', error)
    return NextResponse.json({ error: 'Failed to generate reorder suggestions' }, { status: 500 })
  }
}
