import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// GET /api/merchant-os/products/[id]/variants - List all variants for a product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check if product exists
    const product = await db.product.findUnique({
      where: { id },
      select: { 
        id: true, 
        name: true, 
        sku: true,
        hasVariants: true,
        variantAttributes: true,
        costPrice: true,
        sellingPrice: true
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Get query params for filtering
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // Build where clause for variants
    const where: Prisma.ProductVariantWhereInput = {
      productId: id
    }

    if (status) {
      where.status = status
    }

    const variants = await db.productVariant.findMany({
      where,
      orderBy: { name: 'asc' }
    })

    // Parse JSON fields
    const variantsResponse = variants.map(v => ({
      ...v,
      attributes: v.attributes ? JSON.parse(v.attributes) : null,
      attributeValues: v.attributeValues ? JSON.parse(v.attributeValues) : null
    }))

    // Parse variant attributes template
    const variantAttributes = product.variantAttributes 
      ? JSON.parse(product.variantAttributes) 
      : null

    return NextResponse.json({ 
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        hasVariants: product.hasVariants,
        variantAttributes,
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice
      },
      variants: variantsResponse,
      total: variants.length
    })
  } catch (error) {
    console.error('Error fetching product variants:', error)
    return NextResponse.json({ error: 'Failed to fetch product variants' }, { status: 500 })
  }
}

// POST /api/merchant-os/products/[id]/variants - Create a new variant
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check if product exists
    const product = await db.product.findUnique({
      where: { id }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Validate required fields
    if (!body.sku) {
      return NextResponse.json({ error: 'sku is required for variant' }, { status: 400 })
    }
    if (!body.name) {
      return NextResponse.json({ error: 'name is required for variant' }, { status: 400 })
    }
    if (!body.attributes) {
      return NextResponse.json({ error: 'attributes is required for variant' }, { status: 400 })
    }

    // Check for duplicate variant SKU within the product
    const existingVariant = await db.productVariant.findFirst({
      where: {
        productId: id,
        sku: body.sku
      }
    })

    if (existingVariant) {
      return NextResponse.json({ 
        error: 'Variant with this SKU already exists for this product' 
      }, { status: 409 })
    }

    // Check for duplicate barcode if provided
    if (body.barcode) {
      const existingBarcode = await db.productVariant.findFirst({
        where: {
          productId: id,
          barcode: body.barcode
        }
      })

      if (existingBarcode) {
        return NextResponse.json({ 
          error: 'Variant with this barcode already exists for this product' 
        }, { status: 409 })
      }
    }

    // Create variant
    const variant = await db.productVariant.create({
      data: {
        productId: id,
        sku: body.sku,
        barcode: body.barcode,
        name: body.name,
        attributes: typeof body.attributes === 'string' 
          ? body.attributes 
          : JSON.stringify(body.attributes),
        attributeValues: body.attributeValues 
          ? (typeof body.attributeValues === 'string' 
              ? body.attributeValues 
              : JSON.stringify(body.attributeValues))
          : undefined,
        costPrice: body.costPrice ?? product.costPrice,
        sellingPrice: body.sellingPrice ?? product.sellingPrice,
        stockQuantity: body.stockQuantity || 0,
        minStockLevel: body.minStockLevel,
        reorderPoint: body.reorderPoint,
        status: body.status || 'active',
        imageUrl: body.imageUrl
      }
    })

    // Update parent product to indicate it has variants
    await db.product.update({
      where: { id },
      data: { hasVariants: true }
    })

    // Parse JSON fields for response
    const variantResponse = {
      ...variant,
      attributes: variant.attributes ? JSON.parse(variant.attributes) : null,
      attributeValues: variant.attributeValues ? JSON.parse(variant.attributeValues) : null
    }

    return NextResponse.json({ variant: variantResponse }, { status: 201 })
  } catch (error) {
    console.error('Error creating product variant:', error)
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({ 
          error: 'Variant with this SKU already exists' 
        }, { status: 409 })
      }
    }
    
    return NextResponse.json({ error: 'Failed to create product variant' }, { status: 500 })
  }
}
