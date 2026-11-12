import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/grosupply/supplier-products - List supplier products with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get('supplierId')
    const sku = searchParams.get('sku')
    const vertical = searchParams.get('vertical')
    const subVertical = searchParams.get('subVertical')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const isPrimary = searchParams.get('isPrimary')

    const where: Record<string, unknown> = {}

    if (supplierId) where.supplierId = supplierId
    if (sku) where.sku = { contains: sku }
    if (vertical) where.vertical = { contains: vertical }
    if (subVertical) where.subVertical = { contains: subVertical }
    if (category) where.category = { contains: category }
    if (isPrimary === 'true') where.isPrimary = true
    if (isPrimary === 'false') where.isPrimary = false
    
    if (search) {
      where.OR = [
        { sku: { contains: search, mode: 'insensitive' } },
        { skuName: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ]
    }

    const products = await db.supplierProduct.findMany({
      where,
      orderBy: [{ vertical: 'asc' }, { category: 'asc' }, { sku: 'asc' }],
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            tier: true,
            bbbeeLevel: true,
            website: true,
            deliveryDays: true,
            minOrderUnit: true
          }
        }
      },
      take: 100
    })

    return NextResponse.json({ 
      products,
      total: products.length 
    })
  } catch (error) {
    console.error('Error fetching supplier products:', error)
    return NextResponse.json({ error: 'Failed to fetch supplier products' }, { status: 500 })
  }
}

// POST /api/grosupply/supplier-products - Create supplier product mapping
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const product = await db.supplierProduct.create({
      data: {
        supplierId: body.supplierId,
        sku: body.sku,
        skuName: body.skuName,
        category: body.category,
        vertical: body.vertical,
        subVertical: body.subVertical,
        costPrice: body.costPrice || 0,
        leadDays: body.leadDays,
        minOrderQty: body.minOrderQty,
        isPrimary: body.isPrimary || false,
        inStock: body.inStock !== false
      }
    })

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('Error creating supplier product:', error)
    return NextResponse.json({ error: 'Failed to create supplier product' }, { status: 500 })
  }
}
