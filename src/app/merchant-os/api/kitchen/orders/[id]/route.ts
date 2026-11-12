import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
}

// GET - Fetch a single kitchen order
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const order = await db.kitchenOrder.findUnique({
      where: { id },
      include: {
        KitchenOrderItem: true,
        KitchenOrderStation: true,
      },
    })
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Transform to expected format
    const transformedOrder = {
      ...order,
      items: order.KitchenOrderItem,
      stationRoutings: order.KitchenOrderStation,
    }

    return NextResponse.json(transformedOrder)
  } catch (error) {
    console.error('Error fetching kitchen order:', error)
    return NextResponse.json({ error: 'Failed to fetch kitchen order' }, { status: 500 })
  }
}

// PUT - Update a kitchen order
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const { 
      priority, 
      tableNumber, 
      customerName, 
      status, 
      estimatedTime, 
      notes, 
      waiterName 
    } = body

    const order = await db.kitchenOrder.update({
      where: { id },
      data: {
        ...(priority !== undefined && { priority }),
        ...(tableNumber !== undefined && { tableNumber }),
        ...(customerName !== undefined && { customerName }),
        ...(status !== undefined && { status }),
        ...(estimatedTime !== undefined && { estimatedTime }),
        ...(notes !== undefined && { notes }),
        ...(waiterName !== undefined && { waiterName }),
        updatedAt: new Date(),
      },
      include: {
        KitchenOrderItem: true,
        KitchenOrderStation: true,
      },
    })

    // Transform to expected format
    const transformedOrder = {
      ...order,
      items: order.KitchenOrderItem,
      stationRoutings: order.KitchenOrderStation,
    }

    return NextResponse.json(transformedOrder)
  } catch (error) {
    console.error('Error updating kitchen order:', error)
    return NextResponse.json({ error: 'Failed to update kitchen order' }, { status: 500 })
  }
}

// DELETE - Delete a kitchen order
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    // Delete related items and station routings first (cascade should handle this, but being explicit)
    await db.kitchenOrderItem.deleteMany({
      where: { orderId: id },
    })
    await db.kitchenOrderStation.deleteMany({
      where: { orderId: id },
    })

    await db.kitchenOrder.delete({
      where: { id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting kitchen order:', error)
    return NextResponse.json({ error: 'Failed to delete kitchen order' }, { status: 500 })
  }
}
