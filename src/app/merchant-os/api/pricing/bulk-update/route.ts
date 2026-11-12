import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper to get session
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

// POST /api/merchant-os/pricing/bulk-update - Bulk update prices
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { updates, reason } = body

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      )
    }

    const results = []
    const errors = []

    for (const update of updates) {
      const { productId, costPrice, sellingPrice } = update

      try {
        // Get current product
        const product = await db.product.findFirst({
          where: {
            id: productId,
            merchantId: session.merchantId,
          },
        })

        if (!product) {
          errors.push({ productId, error: 'Product not found' })
          continue
        }

        const oldCost = product.costPrice || 0
        const oldPrice = product.sellingPrice || 0
        const newCost = costPrice ?? oldCost
        const newPrice = sellingPrice ?? oldPrice
        const newMargin = newPrice > 0 
          ? ((newPrice - newCost) / newPrice) * 100 
          : 0

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
              priceChangePercent: oldPrice > 0 
                ? ((newPrice - oldPrice) / oldPrice) * 100 
                : 0,
              costAtChange: newCost,
              previousMargin: product.margin || 0,
              newMargin: newMargin,
              reason: reason || 'bulk_update',
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
              costChangePercent: oldCost > 0 
                ? ((newCost - oldCost) / oldCost) * 100 
                : 0,
              priceAtChange: newPrice,
              previousMargin: product.margin || 0,
              newMargin: newMargin,
              source: 'bulk_update',
              changedBy: session.userId,
              changedByName: session.user.name || 'System',
              priceUpdated: newPrice !== oldPrice,
            },
          })
        }

        results.push({
          productId,
          sku: product.sku,
          name: product.name,
          oldPrice,
          newPrice,
          oldCost,
          newCost,
          margin: Math.round(newMargin * 10) / 10,
        })
      } catch (err) {
        errors.push({ productId, error: String(err) })
      }
    }

    return NextResponse.json({
      success: true,
      updated: results.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Bulk update error:', error)
    return NextResponse.json(
      { error: 'Failed to bulk update prices' },
      { status: 500 }
    )
  }
}
