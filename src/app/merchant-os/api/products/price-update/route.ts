import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// POST /merchant-os/api/products/price-update
// Bulk update prices for multiple products at once
// Merchants can adjust prices across their entire inventory
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { merchantId, updates, updateType } = body

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
    }

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: 'updates array is required' }, { status: 400 })
    }

    const results = { updated: 0, skipped: 0 }

    for (const update of updates) {
      try {
        const product = await db.product.findFirst({
          where: {
            merchantId,
            OR: [
              { id: update.id },
              { sku: update.sku },
              ...(update.barcode ? [{ barcode: update.barcode }] : []),
            ],
          },
        })

        if (!product) {
          results.skipped++
          continue
        }

        const data: any = { updatedAt: new Date() }

        if (update.sellingPrice !== undefined) {
          data.sellingPrice = parseFloat(update.sellingPrice)
        }
        if (update.costPrice !== undefined) {
          data.costPrice = parseFloat(update.costPrice)
        }
        if (update.compareAtPrice !== undefined) {
          data.compareAtPrice = parseFloat(update.compareAtPrice)
        }
        if (update.stock !== undefined) {
          data.currentStock = parseFloat(update.stock)
        }
        
        // Auto-calculate margin if both prices provided
        if (data.costPrice !== undefined && data.sellingPrice !== undefined && data.sellingPrice > 0) {
          data.margin = Math.round(((data.sellingPrice - data.costPrice) / data.sellingPrice) * 100 * 100) / 100
        }

        // Apply bulk update type (percentage increase/decrease)
        if (updateType === 'percentage' && update.percentage !== undefined) {
          const factor = 1 + (parseFloat(update.percentage) / 100)
          data.sellingPrice = Math.round(product.sellingPrice * factor * 100) / 100
          if (product.costPrice > 0) {
            data.margin = Math.round(((data.sellingPrice - product.costPrice) / data.sellingPrice) * 100 * 100) / 100
          }
        }

        await db.product.update({ where: { id: product.id }, data })
        results.updated++
      } catch (e) {
        results.skipped++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${results.updated} products, skipped ${results.skipped}`,
      ...results,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
