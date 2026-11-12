import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// GET /api/merchant-os/products/[id]/variants/[variantId] - Get a specific variant
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    const { id, variantId } = await params
    
    // Check if product exists
    const product = await db.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        sku: true,
        costPrice: true,
        sellingPrice: true,
        vatRate: true,
        vatIncluded: true,
        unit: true,
        status: true
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Get the variant
    const variant = await db.productVariant.findFirst({
      where: {
        id: variantId,
        productId: id
      }
    })

    if (!variant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
    }

    // Parse JSON fields
    const variantResponse = {
      ...variant,
      attributes: variant.attributes ? JSON.parse(variant.attributes) : null,
      attributeValues: variant.attributeValues ? JSON.parse(variant.attributeValues) : null
    }

    return NextResponse.json({ 
      product,
      variant: variantResponse 
    })
  } catch (error) {
    console.error('Error fetching product variant:', error)
    return NextResponse.json({ error: 'Failed to fetch product variant' }, { status: 500 })
  }
}

// PUT /api/merchant-os/products/[id]/variants/[variantId] - Update a variant
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    const { id, variantId } = await params
    const body = await request.json()

    // Check if product exists
    const product = await db.product.findUnique({
      where: { id }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check if variant exists and belongs to this product
    const existingVariant = await db.productVariant.findFirst({
      where: {
        id: variantId,
        productId: id
      }
    })

    if (!existingVariant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
    }

    // If SKU is being changed, check for duplicates
    if (body.sku && body.sku !== existingVariant.sku) {
      const duplicateSku = await db.productVariant.findFirst({
        where: {
          productId: id,
          sku: body.sku,
          id: { not: variantId }
        }
      })
      if (duplicateSku) {
        return NextResponse.json({ 
          error: 'Variant with this SKU already exists' 
        }, { status: 409 })
      }
    }

    // If barcode is being changed, check for duplicates
    if (body.barcode && body.barcode !== existingVariant.barcode) {
      const duplicateBarcode = await db.productVariant.findFirst({
        where: {
          productId: id,
          barcode: body.barcode,
          id: { not: variantId }
        }
      })
      if (duplicateBarcode) {
        return NextResponse.json({ 
          error: 'Variant with this barcode already exists' 
        }, { status: 409 })
      }
    }

    // Update variant
    const variant = await db.productVariant.update({
      where: { id: variantId },
      data: {
        sku: body.sku,
        barcode: body.barcode,
        name: body.name,
        attributes: body.attributes 
          ? (typeof body.attributes === 'string' 
              ? body.attributes 
              : JSON.stringify(body.attributes))
          : undefined,
        attributeValues: body.attributeValues 
          ? (typeof body.attributeValues === 'string' 
              ? body.attributeValues 
              : JSON.stringify(body.attributeValues))
          : undefined,
        costPrice: body.costPrice,
        sellingPrice: body.sellingPrice,
        stockQuantity: body.stockQuantity,
        minStockLevel: body.minStockLevel,
        reorderPoint: body.reorderPoint,
        status: body.status,
        imageUrl: body.imageUrl
      }
    })

    // Parse JSON fields for response
    const variantResponse = {
      ...variant,
      attributes: variant.attributes ? JSON.parse(variant.attributes) : null,
      attributeValues: variant.attributeValues ? JSON.parse(variant.attributeValues) : null
    }

    return NextResponse.json({ variant: variantResponse })
  } catch (error) {
    console.error('Error updating product variant:', error)
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({ 
          error: 'Variant with this SKU already exists' 
        }, { status: 409 })
      }
    }
    
    return NextResponse.json({ error: 'Failed to update product variant' }, { status: 500 })
  }
}

// DELETE /api/merchant-os/products/[id]/variants/[variantId] - Delete a variant
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    const { id, variantId } = await params

    // Check if product exists
    const product = await db.product.findUnique({
      where: { id }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check if variant exists and belongs to this product
    const existingVariant = await db.productVariant.findFirst({
      where: {
        id: variantId,
        productId: id
      }
    })

    if (!existingVariant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
    }

    // Soft delete by setting status to 'inactive'
    const variant = await db.productVariant.update({
      where: { id: variantId },
      data: {
        status: 'inactive'
      }
    })

    // Check if there are any remaining active variants
    const activeVariantsCount = await db.productVariant.count({
      where: {
        productId: id,
        status: 'active'
      }
    })

    // If no active variants remain, update parent product
    if (activeVariantsCount === 0) {
      await db.product.update({
        where: { id },
        data: { hasVariants: false }
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Variant has been deactivated',
      variant 
    })
  } catch (error) {
    console.error('Error deleting product variant:', error)
    return NextResponse.json({ error: 'Failed to delete product variant' }, { status: 500 })
  }
}
