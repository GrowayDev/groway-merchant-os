import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/supplier/products - Get supplier products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get('supplierId')
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!supplierId) {
      return NextResponse.json({ error: 'Supplier ID is required' }, { status: 400 })
    }

    const where: any = { supplierId }

    if (category) {
      where.category = category
    }

    if (status === 'active') {
      where.active = true
      where.inStock = true
    } else if (status === 'out_of_stock') {
      where.inStock = false
    } else if (status === 'inactive') {
      where.active = false
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { description: { contains: search } }
      ]
    }

    const [products, total] = await Promise.all([
      db.supplierProduct.findMany({
        where,
        orderBy: { name: 'asc' },
        take: limit,
        skip: offset
      }),
      db.supplierProduct.count({ where })
    ])

    // Calculate stats
    const activeCount = await db.supplierProduct.count({
      where: { supplierId, active: true, inStock: true }
    })

    const outOfStockCount = await db.supplierProduct.count({
      where: { supplierId, inStock: false }
    })

    return NextResponse.json({
      products: products.map(p => ({
        ...p,
        images: p.images ? JSON.parse(p.images) : [],
        specifications: p.specifications ? JSON.parse(p.specifications) : null,
        catalogCount: 0
      })),
      total,
      stats: {
        total,
        active: activeCount,
        outOfStock: outOfStockCount
      }
    })
  } catch (error) {
    console.error('Error fetching supplier products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

// POST /api/supplier/products - Create a new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Check if SKU already exists for this supplier
    const existing = await db.supplierProduct.findFirst({
      where: {
        supplierId: body.supplierId,
        sku: body.sku
      }
    })

    if (existing) {
      return NextResponse.json({ error: 'SKU already exists for this supplier' }, { status: 400 })
    }

    const product = await db.supplierProduct.create({
      data: {
        supplierId: body.supplierId,
        sku: body.sku,
        name: body.name,
        description: body.description,
        category: body.category,
        unit: body.unit || 'each',
        basePrice: body.basePrice || 0,
        costPrice: body.costPrice || 0,
        minOrderQty: body.minOrderQty || 1,
        maxOrderQty: body.maxOrderQty,
        leadTime: body.leadTime || 3,
        inStock: body.inStock ?? true,
        stockQty: body.stockQty,
        barcode: body.barcode,
        images: body.images ? JSON.stringify(body.images) : null,
        specifications: body.specifications ? JSON.stringify(body.specifications) : null,
        active: true
      },
      include: {
        bulkPricing: true
      }
    })

    // Create bulk pricing tiers if provided
    if (body.bulkPricing && body.bulkPricing.length > 0) {
      await db.supplierBulkPricing.createMany({
        data: body.bulkPricing.map((bp: any) => ({
          productId: product.id,
          minQty: bp.minQty,
          maxQty: bp.maxQty,
          discountPercent: bp.discountPercent || 0,
          discountedPrice: bp.discountedPrice,
          label: bp.label,
          active: true
        }))
      })
    }

    return NextResponse.json({
      product: {
        ...product,
        images: product.images ? JSON.parse(product.images) : [],
        specifications: product.specifications ? JSON.parse(product.specifications) : null
      }
    })
  } catch (error) {
    console.error('Error creating supplier product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}

// PUT /api/supplier/products - Update a product
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, bulkPricing, images, specifications, ...updates } = body

    const existing = await db.supplierProduct.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Update product
    const product = await db.supplierProduct.update({
      where: { id },
      data: {
        ...updates,
        images: images ? JSON.stringify(images) : existing.images,
        specifications: specifications ? JSON.stringify(specifications) : existing.specifications,
        updatedAt: new Date()
      },
      include: {
        bulkPricing: { where: { active: true } }
      }
    })

    // Update bulk pricing if provided
    if (bulkPricing !== undefined) {
      // Deactivate existing pricing
      await db.supplierBulkPricing.updateMany({
        where: { productId: id },
        data: { active: false }
      })

      // Create new pricing tiers
      if (bulkPricing && bulkPricing.length > 0) {
        await db.supplierBulkPricing.createMany({
          data: bulkPricing.map((bp: any) => ({
            productId: id,
            minQty: bp.minQty,
            maxQty: bp.maxQty,
            discountPercent: bp.discountPercent || 0,
            discountedPrice: bp.discountedPrice,
            label: bp.label,
            active: true
          }))
        })
      }
    }

    return NextResponse.json({
      product: {
        ...product,
        images: product.images ? JSON.parse(product.images) : [],
        specifications: product.specifications ? JSON.parse(product.specifications) : null
      }
    })
  } catch (error) {
    console.error('Error updating supplier product:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

// DELETE /api/supplier/products - Delete a product
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // Check if product is used in any catalogs
    const catalogUsage = await db.supplierCatalogProduct.count({
      where: { productId: id }
    })

    if (catalogUsage > 0) {
      // Soft delete - just mark as inactive
      await db.supplierProduct.update({
        where: { id },
        data: { active: false }
      })
      return NextResponse.json({ message: 'Product deactivated (used in catalogs)' })
    }

    // Hard delete
    await db.supplierProduct.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Error deleting supplier product:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
