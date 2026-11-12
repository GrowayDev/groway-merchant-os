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

interface ImportRow {
  sku: string
  barcode?: string
  name: string
  description?: string
  category?: string
  costPrice?: number
  sellingPrice?: number
  compareAtPrice?: number
  unit?: string
  isActive?: boolean
}

// POST /api/merchant-os/pricing/import - Import products from CSV data
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { data, updateExisting = false } = body

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: 'No import data provided' },
        { status: 400 }
      )
    }

    // Get existing categories
    const existingCategories = await db.productCategory.findMany({
      where: { merchantId: session.merchantId },
    })
    const categoryMap = new Map(existingCategories.map(c => [c.name.toLowerCase(), c.id]))

    const results = {
      created: [] as any[],
      updated: [] as any[],
      skipped: [] as any[],
      errors: [] as any[],
    }

    for (let i = 0; i < data.length; i++) {
      const row = data[i] as ImportRow
      const rowNum = i + 2 // Excel row number (1-indexed + header)

      try {
        // Validation
        if (!row.sku || !row.name) {
          results.errors.push({
            row: rowNum,
            error: 'SKU and name are required',
            data: row,
          })
          continue
        }

        // Check if product exists
        const existing = await db.product.findFirst({
          where: {
            merchantId: session.merchantId,
            sku: row.sku.trim(),
          },
        })

        // Handle category
        let categoryId: string | null = null
        if (row.category) {
          const categoryLower = row.category.toLowerCase()
          if (categoryMap.has(categoryLower)) {
            categoryId = categoryMap.get(categoryLower)!
          } else {
            // Create new category
            const newCategory = await db.productCategory.create({
              data: {
                merchantId: session.merchantId,
                name: row.category.trim(),
              },
            })
            categoryMap.set(categoryLower, newCategory.id)
            categoryId = newCategory.id
          }
        }

        const costPrice = Number(row.costPrice) || 0
        const sellingPrice = Number(row.sellingPrice) || 0
        const compareAtPrice = row.compareAtPrice ? Number(row.compareAtPrice) : null
        const margin = sellingPrice > 0 
          ? ((sellingPrice - costPrice) / sellingPrice) * 100 
          : 0

        if (existing) {
          if (!updateExisting) {
            results.skipped.push({
              row: rowNum,
              sku: row.sku,
              name: row.name,
              reason: 'Product already exists',
            })
            continue
          }

          // Update existing product
          const oldPrice = existing.sellingPrice || 0
          const oldCost = existing.costPrice || 0

          const updated = await db.product.update({
            where: { id: existing.id },
            data: {
              barcode: row.barcode ?? existing.barcode,
              name: row.name.trim(),
              description: row.description ?? existing.description,
              categoryId: categoryId ?? existing.categoryId,
              costPrice,
              sellingPrice,
              compareAtPrice,
              margin,
              unit: row.unit ?? existing.unit,
              isActive: row.isActive !== undefined ? Boolean(row.isActive) : existing.isActive,
              updatedAt: new Date(),
            },
          })

          // Create price history if price changed
          if (sellingPrice !== oldPrice) {
            await db.priceHistory.create({
              data: {
                merchantId: session.merchantId,
                productId: existing.id,
                previousPrice: oldPrice,
                newPrice: sellingPrice,
                priceChange: sellingPrice - oldPrice,
                priceChangePercent: oldPrice > 0 
                  ? ((sellingPrice - oldPrice) / oldPrice) * 100 
                  : 0,
                costAtChange: costPrice,
                previousMargin: existing.margin || 0,
                newMargin: margin,
                reason: 'import',
                changedBy: session.userId,
                changedByName: session.user.name || 'System',
              },
            })
          }

          // Create cost history if cost changed
          if (costPrice !== oldCost) {
            await db.costHistory.create({
              data: {
                merchantId: session.merchantId,
                productId: existing.id,
                previousCost: oldCost,
                newCost: costPrice,
                costChange: costPrice - oldCost,
                costChangePercent: oldCost > 0 
                  ? ((costPrice - oldCost) / oldCost) * 100 
                  : 0,
                priceAtChange: sellingPrice,
                previousMargin: existing.margin || 0,
                newMargin: margin,
                source: 'import',
                changedBy: session.userId,
                changedByName: session.user.name || 'System',
                priceUpdated: sellingPrice !== oldPrice,
              },
            })
          }

          results.updated.push({
            row: rowNum,
            sku: row.sku,
            name: row.name,
            oldPrice,
            newPrice: sellingPrice,
            margin: Math.round(margin * 10) / 10,
          })
        } else {
          // Create new product
          const created = await db.product.create({
            data: {
              merchantId: session.merchantId,
              sku: row.sku.trim(),
              barcode: row.barcode?.trim(),
              name: row.name.trim(),
              description: row.description?.trim(),
              categoryId,
              costPrice,
              sellingPrice,
              compareAtPrice,
              margin,
              unit: row.unit || 'each',
              isActive: row.isActive !== undefined ? Boolean(row.isActive) : true,
            },
          })

          // Create initial price history
          if (sellingPrice > 0) {
            await db.priceHistory.create({
              data: {
                merchantId: session.merchantId,
                productId: created.id,
                previousPrice: 0,
                newPrice: sellingPrice,
                priceChange: sellingPrice,
                priceChangePercent: 100,
                costAtChange: costPrice,
                previousMargin: 0,
                newMargin: margin,
                reason: 'initial',
                changedBy: session.userId,
                changedByName: session.user.name || 'System',
              },
            })
          }

          results.created.push({
            row: rowNum,
            sku: row.sku,
            name: row.name,
            price: sellingPrice,
            margin: Math.round(margin * 10) / 10,
          })
        }
      } catch (err) {
        results.errors.push({
          row: rowNum,
          error: String(err),
          data: row,
        })
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: data.length,
        created: results.created.length,
        updated: results.updated.length,
        skipped: results.skipped.length,
        errors: results.errors.length,
      },
      details: results,
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Failed to import products' },
      { status: 500 }
    )
  }
}
