import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// GET /api/merchant-os/products/[id] - Get a specific product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const product = await db.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: {
          orderBy: { name: 'asc' }
        },
        stockMovements: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        inventory: {
          include: {
            branch: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
        },
        _count: {
          select: { 
            variants: true, 
            stockMovements: true,
            inventory: true
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Parse JSON fields
    const productResponse = {
      ...product,
      tags: product.tags ? JSON.parse(product.tags) : null,
      variantAttributes: product.variantAttributes ? JSON.parse(product.variantAttributes) : null,
      additionalImages: product.additionalImages ? JSON.parse(product.additionalImages) : null,
      variants: product.variants.map(v => ({
        ...v,
        attributes: v.attributes ? JSON.parse(v.attributes) : null,
        attributeValues: v.attributeValues ? JSON.parse(v.attributeValues) : null
      }))
    }

    return NextResponse.json({ product: productResponse })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}

// PUT /api/merchant-os/products/[id] - Update a product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check if product exists
    const existingProduct = await db.product.findUnique({
      where: { id }
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // If SKU is being changed, check for duplicates
    if (body.sku && body.sku !== existingProduct.sku) {
      const duplicateSku = await db.product.findFirst({
        where: {
          merchantId: existingProduct.merchantId,
          sku: body.sku,
          id: { not: id }
        }
      })
      if (duplicateSku) {
        return NextResponse.json({ 
          error: 'Product with this SKU already exists' 
        }, { status: 409 })
      }
    }

    // If barcode is being changed, check for duplicates
    if (body.barcode && body.barcode !== existingProduct.barcode) {
      const duplicateBarcode = await db.product.findFirst({
        where: {
          merchantId: existingProduct.merchantId,
          barcode: body.barcode,
          id: { not: id }
        }
      })
      if (duplicateBarcode) {
        return NextResponse.json({ 
          error: 'Product with this barcode already exists' 
        }, { status: 409 })
      }
    }

    // Calculate margin and markup if prices are provided
    const costPrice = body.costPrice ?? existingProduct.costPrice
    const sellingPrice = body.sellingPrice ?? existingProduct.sellingPrice
    let markupPercent = existingProduct.markupPercent
    let marginPercent = existingProduct.marginPercent

    if (costPrice > 0 && sellingPrice > 0) {
      markupPercent = ((sellingPrice - costPrice) / costPrice) * 100
      marginPercent = ((sellingPrice - costPrice) / sellingPrice) * 100
    }

    // Calculate stock value
    const stockQuantity = body.stockQuantity ?? existingProduct.stockQuantity
    const stockValue = costPrice * stockQuantity

    const product = await db.product.update({
      where: { id },
      data: {
        sku: body.sku,
        barcode: body.barcode,
        name: body.name,
        description: body.description,
        categoryId: body.categoryId,
        subcategory: body.subcategory,
        tags: body.tags ? JSON.stringify(body.tags) : undefined,
        costPrice: body.costPrice,
        sellingPrice: body.sellingPrice,
        vatRate: body.vatRate,
        vatIncluded: body.vatIncluded,
        markupPercent,
        marginPercent,
        trackInventory: body.trackInventory,
        stockQuantity: body.stockQuantity,
        stockValue,
        minStockLevel: body.minStockLevel,
        maxStockLevel: body.maxStockLevel,
        reorderPoint: body.reorderPoint,
        reorderQuantity: body.reorderQuantity,
        unit: body.unit,
        unitSize: body.unitSize,
        unitMeasure: body.unitMeasure,
        packSize: body.packSize,
        packUnit: body.packUnit,
        brand: body.brand,
        manufacturer: body.manufacturer,
        origin: body.origin,
        status: body.status,
        isSellable: body.isSellable,
        isPurchasable: body.isPurchasable,
        isDigital: body.isDigital,
        isService: body.isService,
        batchTracking: body.batchTracking,
        expiryTracking: body.expiryTracking,
        shelfLife: body.shelfLife,
        hasVariants: body.hasVariants,
        variantAttributes: body.variantAttributes ? JSON.stringify(body.variantAttributes) : undefined,
        imageUrl: body.imageUrl,
        thumbnailUrl: body.thumbnailUrl,
        additionalImages: body.additionalImages ? JSON.stringify(body.additionalImages) : undefined,
        supplierId: body.supplierId,
        supplierCode: body.supplierCode,
        leadTimeDays: body.leadTimeDays
      },
      include: {
        category: true,
        variants: true
      }
    })

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Error updating product:', error)
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({ 
          error: 'Product with this SKU already exists' 
        }, { status: 409 })
      }
    }
    
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

// DELETE /api/merchant-os/products/[id] - Soft delete a product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if product exists
    const existingProduct = await db.product.findUnique({
      where: { id }
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Soft delete by setting status to 'inactive'
    // This preserves the product data for historical records
    const product = await db.product.update({
      where: { id },
      data: {
        status: 'inactive',
        isSellable: false,
        isPurchasable: false
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Product has been deactivated',
      product 
    })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
