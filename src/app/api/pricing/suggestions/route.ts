import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

async function getSession(request: NextRequest) {
  const sessionToken = request.cookies.get('groway_session')?.value
  if (!sessionToken) return null
  
  try {
    return await db.merchantSession.findFirst({
      where: { 
        token: sessionToken,
        expiresAt: { gt: new Date() }
      },
      include: { user: true, merchant: true },
    })
  } catch {
    return null
  }
}

// GET /api/pricing/suggestions - Get GroAI pricing suggestions
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get products with pricing issues
    const products = await db.product.findMany({
      where: {
        merchantId: session.merchantId,
        isActive: true,
      },
      include: {
        category: true,
      },
    })

    const insights: PricingInsight[] = []
    const LOW_MARGIN_THRESHOLD = 30
    const TARGET_MARGIN = 45

    // Analyze each product
    for (const product of products) {
      const cost = product.costPrice || 0
      const price = product.sellingPrice || 0
      const currentMargin = price > 0 ? ((price - cost) / price) * 100 : 0
      const timesSold = product.timesSold || 0

      // Low Margin Alert
      if (currentMargin < LOW_MARGIN_THRESHOLD && cost > 0) {
        const suggestedPrice = calculateSuggestedPrice(cost, TARGET_MARGIN)
        const potentialRevenue = (suggestedPrice - price) * timesSold

        insights.push({
          id: `low_margin_${product.id}`,
          type: 'warning',
          title: 'Low Margin Alert',
          description: `${product.name} has a margin of ${currentMargin.toFixed(1)}% which is below your ${LOW_MARGIN_THRESHOLD}% threshold.`,
          impact: `Potential: +R${potentialRevenue.toFixed(0)}/month`,
          products: [product.name],
          action: `Increase price to R${suggestedPrice.toFixed(2)}`,
          productId: product.id,
          suggestedPrice,
          suggestedMargin: TARGET_MARGIN,
          potentialRevenue,
          severity: currentMargin < 20 ? 'critical' : 'high',
        })
      }

      // Price Increase Opportunity (based on competitor data if available)
      // For now, identify products with good margins that could be priced higher
      if (currentMargin >= 40 && currentMargin < 55 && timesSold >= 30) {
        // Fast-moving product with room for optimization
        const suggestedPrice = price * 1.05 // 5% increase
        const potentialRevenue = (suggestedPrice - price) * timesSold

        insights.push({
          id: `opportunity_${product.id}`,
          type: 'opportunity',
          title: 'Price Increase Opportunity',
          description: `${product.name} is selling well with ${timesSold} units. Consider a small price increase.`,
          impact: `Potential: +R${potentialRevenue.toFixed(0)}/month`,
          products: [product.name],
          action: `Increase price to R${suggestedPrice.toFixed(2)} (+5%)`,
          productId: product.id,
          suggestedPrice,
          suggestedMargin: ((suggestedPrice - cost) / suggestedPrice) * 100,
          potentialRevenue,
          severity: 'low',
        })
      }
    }

    // Aggregate insights
    const totalPotentialRevenue = insights.reduce((sum, i) => sum + (i.potentialRevenue || 0), 0)
    
    const summaryInsights = [
      {
        id: 'summary_low_margin',
        type: 'warning' as const,
        title: 'Low Margin Products',
        description: `${insights.filter(i => i.type === 'warning').length} products have margins below ${LOW_MARGIN_THRESHOLD}%`,
        impact: `Risk: losing profit on ${insights.filter(i => i.type === 'warning').length} items`,
        action: 'Review pricing strategy',
      },
      {
        id: 'summary_opportunity',
        type: 'opportunity' as const,
        title: 'Revenue Opportunity',
        description: `Potential additional revenue from price optimization`,
        impact: `+R${totalPotentialRevenue.toFixed(0)}/month potential`,
        action: 'Apply suggested prices',
      },
    ]

    // Add cost-saving suggestions from GroSupply
    const costSavingOpportunities = await identifyBulkSavings(session.merchantId)
    if (costSavingOpportunities.length > 0) {
      insights.push(...costSavingOpportunities)
    }

    return NextResponse.json({
      success: true,
      insights,
      summaryInsights,
      stats: {
        totalInsights: insights.length,
        critical: insights.filter(i => i.severity === 'critical').length,
        warnings: insights.filter(i => i.type === 'warning').length,
        opportunities: insights.filter(i => i.type === 'opportunity').length,
        totalPotentialRevenue,
      },
    })
  } catch (error) {
    console.error('Get pricing suggestions error:', error)
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    )
  }
}

// POST /api/pricing/suggestions/apply - Apply suggested prices
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { insightIds } = body

    // Get the insights to apply
    const suggestionsResponse = await GET(request)
    const suggestionsData = await suggestionsResponse.json()
    
    const insightsToApply = suggestionsData.insights.filter(
      (i: PricingInsight) => insightIds.includes(i.id) && i.productId && i.suggestedPrice
    )

    const results = []

    for (const insight of insightsToApply) {
      const product = await db.product.findFirst({
        where: { id: insight.productId, merchantId: session.merchantId },
      })

      if (!product) continue

      const oldPrice = product.sellingPrice
      const newPrice = insight.suggestedPrice

      // Update product price
      await db.product.update({
        where: { id: insight.productId },
        data: {
          sellingPrice: newPrice,
          margin: insight.suggestedMargin,
          updatedAt: new Date(),
        },
      })

      // Record price history
      await db.priceHistory.create({
        data: {
          merchantId: session.merchantId,
          productId: insight.productId,
          previousPrice: oldPrice,
          newPrice: newPrice,
          priceChange: newPrice - oldPrice,
          priceChangePercent: oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice) * 100 : 0,
          costAtChange: product.costPrice,
          previousMargin: product.margin,
          newMargin: insight.suggestedMargin,
          reason: 'groai_suggestion',
          reasonDetails: insight.title,
          changedBy: session.userId,
          changedByName: session.user.name || 'System',
        },
      })

      results.push({
        productId: insight.productId,
        productName: product.name,
        oldPrice,
        newPrice,
        insightId: insight.id,
      })
    }

    return NextResponse.json({
      success: true,
      applied: results.length,
      changes: results,
    })
  } catch (error) {
    console.error('Apply suggestions error:', error)
    return NextResponse.json(
      { error: 'Failed to apply suggestions' },
      { status: 500 }
    )
  }
}

interface PricingInsight {
  id: string
  type: 'opportunity' | 'warning' | 'recommendation'
  title: string
  description: string
  impact: string
  products: string[]
  action?: string
  productId?: string
  suggestedPrice?: number
  suggestedMargin?: number
  potentialRevenue?: number
  severity?: 'critical' | 'high' | 'medium' | 'low'
}

function calculateSuggestedPrice(cost: number, targetMargin: number): number {
  if (targetMargin >= 100) return cost * 2
  return cost / (1 - targetMargin / 100)
}

async function identifyBulkSavings(merchantId: string): Promise<PricingInsight[]> {
  try {
    // Check for products that could benefit from bulk ordering
    const products = await db.product.findMany({
      where: {
        merchantId,
        isActive: true,
        timesSold: { gte: 20 }, // Fast moving items
      },
      include: {
        category: true,
      },
      take: 5,
    })

    if (products.length === 0) return []

    return [{
      id: 'bulk_savings_opportunity',
      type: 'recommendation',
      title: 'Bulk Order Savings',
      description: `${products.length} fast-moving products qualify for bulk pricing discounts on GroSupply.`,
      impact: 'Save up to 8% on procurement costs',
      products: products.map(p => p.name),
      action: 'Check GroSupply marketplace',
    }]
  } catch {
    return []
  }
}
