import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

// GET - List products for a merchant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const category = searchParams.get('category')
    const activeOnly = searchParams.get('activeOnly') === 'true'

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId required' }, { status: 400 })
    }

    const where: Record<string, unknown> = { merchantId }
    if (category) where.category = category
    if (activeOnly) where.isActive = true

    const products = await db.groSellProduct.findMany({
      where,
      orderBy: [
        { isFeatured: 'desc' },
        { sortOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Error fetching GroSell products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

// POST - Create a new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      merchantId,
      sku,
      name,
      description,
      category,
      price,
      compareAtPrice,
      costPrice,
      stockQuantity,
      lowStockAlert,
      images,
      videoUrl,
      isActive,
      isFeatured,
      variants,
      tags
    } = body

    if (!merchantId || !name || price === undefined) {
      return NextResponse.json({ error: 'merchantId, name, and price are required' }, { status: 400 })
    }

    const product = await db.groSellProduct.create({
      data: {
        id: `gsp_${nanoid(12)}`,
        merchantId,
        sku,
        name,
        description,
        category,
        price: parseFloat(price),
        compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
        costPrice: costPrice ? parseFloat(costPrice) : null,
        stockQuantity: stockQuantity || 0,
        lowStockAlert: lowStockAlert || 5,
        images,
        videoUrl,
        isActive: isActive !== undefined ? isActive : true,
        isFeatured: isFeatured || false,
        variants,
        tags,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Error creating GroSell product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}

// PUT - Bulk update products
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { merchantId, products } = body

    if (!merchantId || !products || !Array.isArray(products)) {
      return NextResponse.json({ error: 'merchantId and products array are required' }, { status: 400 })
    }

    const results = await Promise.all(
      products.map(async (p) => {
        return db.groSellProduct.update({
          where: { id: p.id },
          data: {
            ...p,
            price: p.price ? parseFloat(p.price) : undefined,
            compareAtPrice: p.compareAtPrice ? parseFloat(p.compareAtPrice) : null,
            costPrice: p.costPrice ? parseFloat(p.costPrice) : null,
            updatedAt: new Date()
          }
        })
      })
    )

    return NextResponse.json({ updated: results.length })
  } catch (error) {
    console.error('Error updating GroSell products:', error)
    return NextResponse.json({ error: 'Failed to update products' }, { status: 500 })
  }
}

// DELETE - Delete a product
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }

    await db.groSellProduct.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting GroSell product:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
