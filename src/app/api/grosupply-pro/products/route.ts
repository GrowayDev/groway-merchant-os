import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/grosupply-pro/products - Get supplier products with bulk pricing
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get('supplierId')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    
    const where: any = { active: true }
    
    if (supplierId) {
      where.supplierId = supplierId
    }
    
    if (category) {
      where.category = category
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { description: { contains: search } }
      ]
    }
    
    const products = await db.supplierProduct.findMany({
      where,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            tier: true,
            supplierType: true,
            rating: true,
            deliveryDays: true,
            fulfillmentRate: true
          }
        },
        bulkPricing: {
          where: { active: true },
          orderBy: { minQty: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    })
    
    return NextResponse.json({ products })
  } catch (error) {
    console.error('Error fetching supplier products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

// POST /api/grosupply-pro/products - Create a new supplier product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
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
        images: body.images,
        specifications: body.specifications,
        active: true
      },
      include: {
        supplier: true,
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
          discountPercent: bp.discountPercent,
          discountedPrice: bp.discountedPrice,
          label: bp.label,
          active: true
        }))
      })
    }
    
    return NextResponse.json({ product })
  } catch (error) {
    console.error('Error creating supplier product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
