import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/inventory/items/[id] - Get single inventory item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const item = await db.product.findUnique({
      where: { id },
      include: {
        ProductCategory: true,
        StockMovement: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // Calculate additional fields
    const itemWithCalculated = {
      ...item,
      margin: item.sellingPrice > 0 
        ? ((item.sellingPrice - item.costPrice) / item.sellingPrice) * 100 
        : 0,
      markup: item.costPrice > 0 
        ? ((item.sellingPrice - item.costPrice) / item.costPrice) * 100 
        : 0,
      stockValue: item.currentStock * item.costPrice,
      retailValue: item.currentStock * item.sellingPrice,
      status: item.currentStock <= 0 
        ? 'out_of_stock' 
        : item.currentStock <= (item.reorderPoint || 10) 
          ? 'low_stock' 
          : 'in_stock'
    }

    return NextResponse.json({
      success: true,
      data: itemWithCalculated
    })
  } catch (error) {
    console.error('Error fetching inventory item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inventory item' },
      { status: 500 }
    )
  }
}

// PUT /api/inventory/items/[id] - Update inventory item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check if product exists
    const existing = await db.product.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // Prepare update data with correct Prisma field names
    const updateData: any = {
      updatedAt: new Date()
    }

    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.barcode !== undefined) updateData.barcode = body.barcode
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId
    if (body.costPrice !== undefined) updateData.costPrice = body.costPrice
    if (body.sellingPrice !== undefined) updateData.sellingPrice = body.sellingPrice
    if (body.compareAtPrice !== undefined) updateData.compareAtPrice = body.compareAtPrice
    if (body.unit !== undefined) updateData.unit = body.unit
    if (body.vatRate !== undefined) updateData.vatRate = body.vatRate
    if (body.vatExempt !== undefined) updateData.vatExempt = body.vatExempt
    if (body.isActive !== undefined) updateData.isActive = body.isActive
    if (body.isFeatured !== undefined) updateData.isFeatured = body.isFeatured
    if (body.isAvailableOnline !== undefined) updateData.isAvailableOnline = body.isAvailableOnline
    if (body.trackInventory !== undefined) updateData.trackInventory = body.trackInventory
    if (body.lowStockThreshold !== undefined) updateData.lowStockThreshold = body.lowStockThreshold
    if (body.reorderPoint !== undefined) updateData.reorderPoint = body.reorderPoint
    if (body.reorderQuantity !== undefined) updateData.reorderQuantity = body.reorderQuantity
    
    // Handle stock update separately to create stock movement
    const previousStock = existing.currentStock
    let newStock = previousStock
    
    if (body.currentStock !== undefined) {
      newStock = body.currentStock
      updateData.currentStock = newStock
    }

    // Update product
    const product = await db.product.update({
      where: { id },
      data: updateData
    })

    // Create stock movement if stock changed
    if (body.currentStock !== undefined && newStock !== previousStock) {
      const adjustment = newStock - previousStock
      await db.stockMovement.create({
        data: {
          id: crypto.randomUUID(),
          merchantId: existing.merchantId,
          branchId: existing.branchId,
          productId: id,
          type: adjustment > 0 ? 'purchase' : 'adjustment',
          quantity: adjustment,
          previousStock,
          newStock,
          unitCost: existing.costPrice,
          totalValue: Math.abs(adjustment) * existing.costPrice,
          reason: body.stockChangeReason || 'Stock update',
          referenceType: 'manual_update',
          createdAt: new Date()
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...product,
        stockValue: product.currentStock * product.costPrice,
        retailValue: product.currentStock * product.sellingPrice
      },
      message: 'Product updated successfully'
    })
  } catch (error) {
    console.error('Error updating inventory item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update inventory item' },
      { status: 500 }
    )
  }
}

// DELETE /api/inventory/items/[id] - Delete inventory item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if product exists
    const existing = await db.product.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // Delete related stock movements first
    await db.stockMovement.deleteMany({
      where: { productId: id }
    })

    // Delete product
    await db.product.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting inventory item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete inventory item' },
      { status: 500 }
    )
  }
}
