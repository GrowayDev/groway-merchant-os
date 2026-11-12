import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface StockAlert {
  type: 'stockout' | 'critical' | 'low' | 'forecast'
  productId: string
  productName: string
  sku: string
  currentStock: number
  daysRemaining: number
  dailyUsage: number
  suggestedAction: string
  urgency: 'critical' | 'high' | 'medium' | 'low'
  estimatedStockoutDate?: string
  recommendedOrderQty?: number
  recommendedOrderDate?: string
  supplierName?: string
  leadTime?: number
}

interface ReorderRecommendation {
  productId: string
  productName: string
  sku: string
  currentStock: number
  recommendedOrderQty: number
  estimatedCost: number
  supplierId?: string
  supplierName: string
  leadTime: number
  reasoning: string
  savingsOpportunity: number
  catalogPrice?: number
  currentPrice?: number
}

interface SupplierInsight {
  supplierId: string
  supplierName: string
  tier: string
  onTimeDeliveryRate: number
  averageLeadTime: number
  priceCompetitiveness: number
  qualityScore: number
  recommended: boolean
  recommendation: string
}

// GET /api/grosupply/intelligence - Get supply chain intelligence
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const includeRecommendations = searchParams.get('recommendations') !== 'false'
    const includeSupplierInsights = searchParams.get('supplierInsights') === 'true'

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
    }

    // Get products with stock information
    const products = await db.product.findMany({
      where: {
        merchantId,
        isActive: true
      }
    })

    // Get stock movements for the last 30 days to calculate usage
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const movements = await db.stockMovement.findMany({
      where: {
        merchantId,
        createdAt: { gte: thirtyDaysAgo },
        type: 'sale'
      }
    })

    // Calculate daily usage per product
    const usageByProduct: Record<string, { total: number; days: number }> = {}
    movements.forEach(m => {
      const productId = m.productId || m.reference?.toString() || ''
      if (!usageByProduct[productId]) {
        usageByProduct[productId] = { total: 0, days: 30 }
      }
      usageByProduct[productId].total += Math.abs(m.quantity || 0)
    })

    // Generate stock alerts
    const alerts: StockAlert[] = []
    const recommendations: ReorderRecommendation[] = []
    
    for (const product of products) {
      const usage = usageByProduct[product.id] || { total: 30, days: 30 }
      const dailyUsage = usage.total / usage.days
      const daysRemaining = dailyUsage > 0 ? Math.floor(product.currentStock / dailyUsage) : 999

      // Get supplier info
      const supplier = product.supplierId ? await db.supplier.findUnique({
        where: { id: product.supplierId }
      }) : null

      // Generate alerts based on stock levels and usage
      if (product.currentStock === 0) {
        alerts.push({
          type: 'stockout',
          productId: product.id,
          productName: product.name,
          sku: product.sku || '',
          currentStock: 0,
          daysRemaining: 0,
          dailyUsage,
          suggestedAction: 'Immediate reorder required',
          urgency: 'critical',
          estimatedStockoutDate: new Date().toISOString().split('T')[0],
          recommendedOrderQty: Math.ceil(dailyUsage * 45),
          recommendedOrderDate: new Date().toISOString().split('T')[0],
          supplierName: supplier?.name,
          leadTime: supplier?.deliveryDays || 3
        })
      } else if (daysRemaining <= (supplier?.deliveryDays || 3)) {
        alerts.push({
          type: 'critical',
          productId: product.id,
          productName: product.name,
          sku: product.sku || '',
          currentStock: product.currentStock,
          daysRemaining,
          dailyUsage,
          suggestedAction: `Order now - will stockout before delivery arrives`,
          urgency: 'critical',
          estimatedStockoutDate: new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          recommendedOrderQty: Math.ceil(dailyUsage * 45),
          recommendedOrderDate: new Date().toISOString().split('T')[0],
          supplierName: supplier?.name,
          leadTime: supplier?.deliveryDays || 3
        })
      } else if (product.currentStock <= (product.lowStockThreshold || 10)) {
        alerts.push({
          type: 'low',
          productId: product.id,
          productName: product.name,
          sku: product.sku || '',
          currentStock: product.currentStock,
          daysRemaining,
          dailyUsage,
          suggestedAction: 'Consider placing order soon',
          urgency: 'high',
          recommendedOrderQty: Math.ceil(dailyUsage * 30),
          supplierName: supplier?.name,
          leadTime: supplier?.deliveryDays || 3
        })
      } else if (daysRemaining <= 14) {
        alerts.push({
          type: 'forecast',
          productId: product.id,
          productName: product.name,
          sku: product.sku || '',
          currentStock: product.currentStock,
          daysRemaining,
          dailyUsage,
          suggestedAction: `Will need reorder in ~${daysRemaining} days`,
          urgency: 'medium',
          recommendedOrderDate: new Date(Date.now() + (daysRemaining - (supplier?.deliveryDays || 3)) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          supplierName: supplier?.name,
          leadTime: supplier?.deliveryDays || 3
        })
      }

      // Generate reorder recommendations for low stock items
      if (product.currentStock <= (product.lowStockThreshold || 10) * 1.5 && includeRecommendations) {
        // Try to find catalog match for better pricing
        const catalogMatch = await db.catalogProduct.findFirst({
          where: {
            OR: [
              { sku: product.sku || '' },
              { description: { contains: product.name } }
            ],
            status: 'active'
          }
        })

        const suggestedQty = Math.ceil(dailyUsage * 45) - product.currentStock
        const estimatedCost = suggestedQty * (catalogMatch?.costPrice || product.costPrice || product.sellPrice * 0.6)

        recommendations.push({
          productId: product.id,
          productName: product.name,
          sku: product.sku || '',
          currentStock: product.currentStock,
          recommendedOrderQty: Math.max(suggestedQty, (product.lowStockThreshold || 10) * 2),
          estimatedCost,
          supplierId: supplier?.id,
          supplierName: supplier?.name || 'Unknown Supplier',
          leadTime: supplier?.deliveryDays || 3,
          reasoning: product.currentStock === 0 
            ? 'Out of stock'
            : `${daysRemaining} days of stock remaining`,
          savingsOpportunity: catalogMatch 
            ? Math.abs((catalogMatch.costPrice - (product.costPrice || 0)) * suggestedQty)
            : estimatedCost * 0.1,
          catalogPrice: catalogMatch?.costPrice,
          currentPrice: product.costPrice
        })
      }
    }

    // Sort alerts by urgency
    const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    alerts.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency])

    // Get supplier insights if requested
    let supplierInsights: SupplierInsight[] = []
    if (includeSupplierInsights) {
      const suppliers = await db.supplier.findMany({
        where: { status: 'active' },
        take: 10
      })

      supplierInsights = suppliers.map(s => ({
        supplierId: s.id,
        supplierName: s.name,
        tier: s.tier,
        onTimeDeliveryRate: s.fulfillmentRate,
        averageLeadTime: s.deliveryDays,
        priceCompetitiveness: 85 + Math.random() * 15,
        qualityScore: s.rating * 20,
        recommended: s.tier === 'platinum' || s.tier === 'gold',
        recommendation: s.tier === 'platinum' 
          ? 'Top tier supplier with excellent track record'
          : s.tier === 'gold'
          ? 'Reliable supplier with good performance'
          : 'Standard supplier - compare pricing before ordering'
      }))
    }

    // Summary statistics
    const stats = {
      totalProducts: products.length,
      outOfStock: products.filter(p => p.currentStock === 0).length,
      criticalLow: alerts.filter(a => a.urgency === 'critical').length,
      lowStock: alerts.filter(a => a.urgency === 'high').length,
      forecastAlerts: alerts.filter(a => a.type === 'forecast').length,
      estimatedLostSales: alerts
        .filter(a => a.type === 'stockout')
        .reduce((sum, a) => sum + a.dailyUsage * a.recommendedOrderQty! * 0.5, 0),
      recommendedOrderValue: recommendations.reduce((sum, r) => sum + r.estimatedCost, 0),
      potentialSavings: recommendations.reduce((sum, r) => sum + r.savingsOpportunity, 0)
    }

    return NextResponse.json({
      success: true,
      data: {
        alerts,
        recommendations,
        supplierInsights,
        stats,
        generatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error generating supply intelligence:', error)
    return NextResponse.json({ error: 'Failed to generate intelligence' }, { status: 500 })
  }
}

// POST /api/grosupply/intelligence - Trigger automatic reorders
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { merchantId, autoOrderThreshold = 'critical' } = body

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
    }

    // Get critical alerts
    const intelResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || ''}/merchant-os/api/grosupply/intelligence?merchantId=${merchantId}`
    )
    const intelData = await intelResponse.json()

    const alertsToProcess = intelData.data?.alerts?.filter(
      (a: StockAlert) => autoOrderThreshold === 'all' || 
        (autoOrderThreshold === 'critical' && a.urgency === 'critical') ||
        (autoOrderThreshold === 'high' && (a.urgency === 'critical' || a.urgency === 'high'))
    ) || []

    const ordersCreated: string[] = []
    const ordersFailed: string[] = []

    // Group by supplier
    const bySupplier: Record<string, typeof alertsToProcess> = {}
    alertsToProcess.forEach((alert: StockAlert) => {
      const supplierKey = alert.supplierName || 'Unknown'
      if (!bySupplier[supplierKey]) bySupplier[supplierKey] = []
      bySupplier[supplierKey].push(alert)
    })

    // Create POs
    for (const [supplierName, alerts] of Object.entries(bySupplier)) {
      try {
        // Find supplier
        const suppliers = await db.supplier.findMany({
          where: { name: { contains: supplierName } }
        })
        const supplier = suppliers[0]

        // Create PO
        const po = await db.purchaseOrder.create({
          data: {
            number: `PO-AUTO-${Date.now()}`,
            supplierId: supplier?.id,
            status: 'draft',
            subtotal: alerts.reduce((sum: number, a: StockAlert) => sum + (a.recommendedOrderQty || 0) * 50, 0), // Estimate
            total: alerts.reduce((sum: number, a: StockAlert) => sum + (a.recommendedOrderQty || 0) * 50 * 1.15, 0),
            notes: `Auto-generated order for ${alerts.length} critical items`,
            items: {
              create: alerts.map((a: StockAlert) => ({
                sku: a.sku,
                description: a.productName,
                quantity: a.recommendedOrderQty || 0,
                unitPrice: 50, // Estimate
                totalPrice: (a.recommendedOrderQty || 0) * 50
              }))
            }
          }
        })

        ordersCreated.push(po.number)
      } catch (err) {
        ordersFailed.push(supplierName)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${ordersCreated.length} automatic purchase orders`,
      ordersCreated,
      ordersFailed,
      itemsProcessed: alertsToProcess.length
    })
  } catch (error) {
    console.error('Error creating automatic orders:', error)
    return NextResponse.json({ error: 'Failed to create automatic orders' }, { status: 500 })
  }
}
