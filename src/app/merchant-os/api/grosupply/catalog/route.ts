import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/grosupply/catalog - List catalog products with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'active'
    const sourceType = searchParams.get('sourceType') // wholesale, sku_catalog
    const vertical = searchParams.get('vertical')
    const category = searchParams.get('category')
    const wholesalerId = searchParams.get('wholesalerId')
    const supplierId = searchParams.get('supplierId')
    const search = searchParams.get('search')
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

    const where: {
      status?: string
      sourceType?: string
      vertical?: string
      category?: string
      wholesalerId?: string
      supplierId?: string
      OR?: Array<{
        description?: { contains: string; mode: 'insensitive' }
        sku?: { contains: string; mode: 'insensitive' }
        brand?: { contains: string; mode: 'insensitive' }
      }>
      costPrice?: { gte: number; lte: number }
    } = {}

    if (status) where.status = status
    if (sourceType) where.sourceType = sourceType
    if (vertical) where.vertical = vertical
    if (category) where.category = category
    if (wholesalerId) where.wholesalerId = wholesalerId
    if (supplierId) where.supplierId = supplierId

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.costPrice = {}
      if (minPrice !== undefined) (where.costPrice as any).gte = minPrice
      if (maxPrice !== undefined) (where.costPrice as any).lte = maxPrice
    }

    const [products, total] = await Promise.all([
      db.catalogProduct.findMany({
        where,
        orderBy: { description: 'asc' },
        skip: offset,
        take: limit,
        include: {
          Wholesaler: true,
          Supplier: {
            select: {
              name: true,
              tier: true
            }
          }
        }
      }),
      db.catalogProduct.count({ where })
    ])

    // Transform products to parse JSON fields
    const transformedProducts = products.map(product => ({
      ...product,
      verticalsServed: product.verticalsServed ? JSON.parse(product.verticalsServed) : [],
      wholesaler: product.Wholesaler,
      supplier: product.Supplier
    }))

    // Get aggregations - only if there are products
    let verticalsAgg: { vertical: string | null; _count: { vertical: number } }[] = []
    let categoriesAgg: { category: string | null; _count: { category: number } }[] = []

    if (total > 0) {
      try {
        verticalsAgg = await db.catalogProduct.groupBy({
          by: ['vertical'],
          where: { status: 'active' },
          _count: { vertical: true }
        })
      } catch (e) {
        console.error('Error grouping by vertical:', e)
      }

      try {
        categoriesAgg = await db.catalogProduct.groupBy({
          by: ['category'],
          where: { status: 'active' },
          _count: { category: true }
        })
      } catch (e) {
        console.error('Error grouping by category:', e)
      }
    }

    let wholesalers: { id: string; name: string; code: string; type: string }[] = []
    try {
      wholesalers = await db.wholesaler.findMany({
        where: { status: 'active' },
        select: { id: true, name: true, code: true, type: true }
      })
    } catch (e) {
      console.error('Error fetching wholesalers:', e)
    }

    return NextResponse.json({
      products: transformedProducts,
      total,
      aggregations: {
        verticals: verticalsAgg.filter(v => v.vertical).map(v => ({ name: v.vertical, count: v._count.vertical })),
        categories: categoriesAgg.filter(c => c.category).map(c => ({ name: c.category, count: c._count.category }))
      },
      wholesalers: wholesalers
    })
  } catch (error) {
    console.error('Error fetching catalog:', error)
    return NextResponse.json({ error: 'Failed to fetch catalog' }, { status: 500 })
  }
}
