import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get single inventory item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const item = await db.enterpriseInventory.findUnique({
      where: { id },
      include: {
        merchant: {
          include: { corporate: true }
        }
      }
    })
    
    if (!item) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 })
    }
    
    return NextResponse.json({ item })
  } catch (error) {
    console.error('Error fetching inventory item:', error)
    return NextResponse.json({ error: 'Failed to fetch inventory item' }, { status: 500 })
  }
}

// PUT - Update inventory item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const item = await db.enterpriseInventory.update({
      where: { id },
      data: {
        ...body,
        stock: body.stock !== undefined ? parseFloat(body.stock) : undefined,
        lowStock: body.lowStock !== undefined ? parseFloat(body.lowStock) : undefined,
        value: body.value !== undefined ? parseFloat(body.value) : undefined,
        costPrice: body.costPrice !== undefined ? parseFloat(body.costPrice) : undefined,
        sellingPrice: body.sellingPrice !== undefined ? parseFloat(body.sellingPrice) : undefined,
        reorderPoint: body.reorderPoint !== undefined ? parseFloat(body.reorderPoint) : undefined,
        reorderQty: body.reorderQty !== undefined ? parseFloat(body.reorderQty) : undefined,
        lastRestocked: body.stock !== undefined ? new Date() : undefined,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ item })
  } catch (error) {
    console.error('Error updating inventory item:', error)
    return NextResponse.json({ error: 'Failed to update inventory item' }, { status: 500 })
  }
}

// DELETE - Delete inventory item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await db.enterpriseInventory.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting inventory item:', error)
    return NextResponse.json({ error: 'Failed to delete inventory item' }, { status: 500 })
  }
}
