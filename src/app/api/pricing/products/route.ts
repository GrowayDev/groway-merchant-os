import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission, getSession } from '@/lib/permissions'

// GET /api/pricing/products - Get products with pricing info
export async function GET(request: NextRequest) {
  const permissionCheck = await checkPermission(request, 'can_view_pricing')
  
  if (!permissionCheck.allowed) {
    return permissionCheck.error
  }

  const session = permissionCheck.session!

  try {

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const alertOnly = searchParams.get('alerts') === 'true'
    const search = searchParams.get('search')

    const where: any = {
      merchantId: session.merchantId,
      isActive: true,
    }

    if (category && category !== 'all') {
      where.category = { name: category }
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { barcode: { contains: search } },
      ]
    }

    const products = await db.product.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { name: 'asc' },
    })

    // Calculate margins and identify alerts
    const lowMarginThreshold = 30
    const productsWithMetrics = products.map(product => {
      const costPrice = product.costPrice || 0
      const sellingPrice = product.sellingPrice || 0
      const margin = sellingPrice > 0 
        ? ((sellingPrice - costPrice) / sellingPrice) * 100 
        : 0
      
      const hasLowMarginAlert = margin < lowMarginThreshold
      
      return {
        ...product,
        costPrice,
        sellingPrice,
        margin: Math.round(margin * 10) / 10,
        hasAlert: hasLowMarginAlert,
        alertType: hasLowMarginAlert ? 'low_margin' : null,
        velocity: calculateVelocity(product.timesSold || 0),
      }
    })

    // Filter by alerts if requested
    const filteredProducts = alertOnly 
      ? productsWithMetrics.filter(p => p.hasAlert)
      : productsWithMetrics

    return NextResponse.json({
      success: true,
      products: filteredProducts,
      stats: {
        total: products.length,
        avgMargin: products.length > 0 
          ? productsWithMetrics.reduce((sum, p) => sum + p.margin, 0) / products.length 
          : 0,
        lowMargin: productsWithMetrics.filter(p => p.margin < lowMarginThreshold).length,
        highMargin: productsWithMetrics.filter(p => p.margin >= 50).length,
        alerts: productsWithMetrics.filter(p => p.hasAlert).length,
      },
    })
  } catch (error) {
    console.error('Get pricing products error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// PUT /api/pricing/products - Bulk update prices
export async function PUT(request: NextRequest) {
  const permissionCheck = await checkPermission(request, 'can_edit_prices')
  
  if (!permissionCheck.allowed) {
    return permissionCheck.error
  }

  const session = permissionCheck.session!

  try {

    const body = await request.json()
    const { updates, reason } = body

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Updates array required' },
        { status: 400 }
      )
    }

    const results = []

    for (const update of updates) {
      const { productId, costPrice, sellingPrice } = update

      // Get current product
      const product = await db.product.findFirst({
        where: { id: productId, merchantId: session.merchantId },
      })

      if (!product) continue

      const oldCost = product.costPrice || 0
      const oldPrice = product.sellingPrice || 0
      const newCost = costPrice ?? oldCost
      const newPrice = sellingPrice ?? oldPrice
      const newMargin = newPrice > 0 ? ((newPrice - newCost) / newPrice) * 100 : 0

      // Update product
      const updated = await db.product.update({
        where: { id: productId },
        data: {
          costPrice: newCost,
          sellingPrice: newPrice,
          margin: newMargin,
          updatedAt: new Date(),
        },
      })

      // Create price history if price changed
      if (newPrice !== oldPrice) {
        await db.priceHistory.create({
          data: {
            merchantId: session.merchantId,
            productId,
            previousPrice: oldPrice,
            newPrice: newPrice,
            priceChange: newPrice - oldPrice,
            priceChangePercent: oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice) * 100 : 0,
            costAtChange: newCost,
            previousMargin: oldPrice > 0 ? ((oldPrice - oldCost) / oldPrice) * 100 : 0,
            newMargin: newMargin,
            reason: reason || 'manual',
            changedBy: session.userId,
            changedByName: session.user.name || 'System',
          },
        })
      }

      // Create cost history if cost changed
      if (newCost !== oldCost) {
        await db.costHistory.create({
          data: {
            merchantId: session.merchantId,
            productId,
            previousCost: oldCost,
            newCost: newCost,
            costChange: newCost - oldCost,
            costChangePercent: oldCost > 0 ? ((newCost - oldCost) / oldCost) * 100 : 0,
            priceAtChange: newPrice,
            previousMargin: oldPrice > 0 ? ((oldPrice - oldCost) / oldPrice) * 100 : 0,
            newMargin: newMargin,
            source: 'manual',
            changedBy: session.userId,
            changedByName: session.user.name || 'System',
            priceUpdated: newPrice !== oldPrice,
          },
        })
      }

      results.push(updated)
    }

    return NextResponse.json({
      success: true,
      updated: results.length,
      products: results,
    })
  } catch (error) {
    console.error('Bulk update pricing error:', error)
    return NextResponse.json(
      { error: 'Failed to update prices' },
      { status: 500 }
    )
  }
}

function calculateVelocity(timesSold: number): 'fast' | 'normal' | 'slow' | 'dead' {
  if (timesSold >= 50) return 'fast'
  if (timesSold >= 20) return 'normal'
  if (timesSold >= 5) return 'slow'
  return 'dead'
}
