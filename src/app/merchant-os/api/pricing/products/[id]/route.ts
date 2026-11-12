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

// GET /api/merchant-os/pricing/products/[id] - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const product = await db.product.findFirst({
      where: {
        id,
        merchantId: session.merchantId,
      },
      include: {
        category: true,
        priceHistory: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        costHistory: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Calculate metrics
    const margin = product.sellingPrice > 0 
      ? ((product.sellingPrice - (product.costPrice || 0)) / product.sellingPrice) * 100 
      : 0

    return NextResponse.json({
      success: true,
      product: {
        ...product,
        margin: Math.round(margin * 10) / 10,
        marginAmount: product.sellingPrice - (product.costPrice || 0),
      },
    })
  } catch (error) {
    console.error('Get product error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

// PUT /api/merchant-os/pricing/products/[id] - Update product pricing
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const {
      sku,
      barcode,
      name,
      description,
      categoryId,
      costPrice,
      sellingPrice,
      compareAtPrice,
      unit,
      isActive,
      reason,
    } = body

    // Get existing product
    const existing = await db.product.findFirst({
      where: {
        id,
        merchantId: session.merchantId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check for duplicate SKU if changing
    if (sku && sku !== existing.sku) {
      const duplicateSku = await db.product.findFirst({
        where: {
          merchantId: session.merchantId,
          sku,
          id: { not: id },
        },
      })

      if (duplicateSku) {
        return NextResponse.json(
          { error: 'A product with this SKU already exists' },
          { status: 400 }
        )
      }
    }

    const newCostPrice = costPrice ?? existing.costPrice
    const newSellingPrice = sellingPrice ?? existing.sellingPrice
    const newMargin = newSellingPrice > 0 
      ? ((newSellingPrice - newCostPrice) / newSellingPrice) * 100 
      : 0

    // Update product
    const product = await db.product.update({
      where: { id },
      data: {
        sku: sku ?? existing.sku,
        barcode: barcode ?? existing.barcode,
        name: name ?? existing.name,
        description: description ?? existing.description,
        categoryId: categoryId ?? existing.categoryId,
        costPrice: newCostPrice,
        sellingPrice: newSellingPrice,
        compareAtPrice: compareAtPrice ?? existing.compareAtPrice,
        margin: newMargin,
        unit: unit ?? existing.unit,
        isActive: isActive ?? existing.isActive,
        updatedAt: new Date(),
      },
      include: {
        category: true,
      },
    })

    // Create price history if price changed
    if (newSellingPrice !== existing.sellingPrice) {
      await db.priceHistory.create({
        data: {
          merchantId: session.merchantId,
          productId: id,
          previousPrice: existing.sellingPrice,
          newPrice: newSellingPrice,
          priceChange: newSellingPrice - existing.sellingPrice,
          priceChangePercent: existing.sellingPrice > 0 
            ? ((newSellingPrice - existing.sellingPrice) / existing.sellingPrice) * 100 
            : 0,
          costAtChange: newCostPrice,
          previousMargin: existing.margin || 0,
          newMargin: newMargin,
          reason: reason || 'manual',
          changedBy: session.userId,
          changedByName: session.user.name || 'System',
        },
      })
    }

    // Create cost history if cost changed
    if (newCostPrice !== existing.costPrice) {
      await db.costHistory.create({
        data: {
          merchantId: session.merchantId,
          productId: id,
          previousCost: existing.costPrice || 0,
          newCost: newCostPrice,
          costChange: newCostPrice - (existing.costPrice || 0),
          costChangePercent: existing.costPrice && existing.costPrice > 0 
            ? ((newCostPrice - existing.costPrice) / existing.costPrice) * 100 
            : 0,
          priceAtChange: newSellingPrice,
          previousMargin: existing.margin || 0,
          newMargin: newMargin,
          source: 'manual',
          changedBy: session.userId,
          changedByName: session.user.name || 'System',
          priceUpdated: newSellingPrice !== existing.sellingPrice,
        },
      })
    }

    return NextResponse.json({
      success: true,
      product: {
        ...product,
        margin: Math.round(newMargin * 10) / 10,
        marginAmount: newSellingPrice - newCostPrice,
      },
    })
  } catch (error) {
    console.error('Update product error:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

// DELETE /api/merchant-os/pricing/products/[id] - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if product exists and belongs to merchant
    const existing = await db.product.findFirst({
      where: {
        id,
        merchantId: session.merchantId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Delete product (cascade will handle related records)
    await db.product.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    })
  } catch (error) {
    console.error('Delete product error:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
