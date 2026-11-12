import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
}

// PUT - Update a kitchen order item status
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, startedAt, completedAt } = body

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    const updateData: any = { 
      status,
      updatedAt: new Date(),
    }
    
    if (status === 'preparing') {
      updateData.startedAt = startedAt || new Date()
    } else if (status === 'ready' || status === 'completed') {
      updateData.completedAt = completedAt || new Date()
    }

    const item = await db.kitchenOrderItem.update({
      where: { id },
      data: updateData,
      include: {
        KitchenOrder: {
          include: {
            KitchenOrderItem: true,
          },
        },
      },
    })

    // Transform to expected format
    const transformedItem = {
      ...item,
      order: item.KitchenOrder,
    }

    // Update order status based on items
    const order = item.KitchenOrder
    const allItems = order.KitchenOrderItem
    
    if (allItems.some(i => i.status === 'preparing')) {
      await db.kitchenOrder.update({
        where: { id: order.id },
        data: { status: 'in-progress', updatedAt: new Date() },
      })
    }
    
    if (allItems.every(i => i.status === 'ready' || i.status === 'served' || i.status === 'completed')) {
      await db.kitchenOrder.update({
        where: { id: order.id },
        data: { status: 'ready', updatedAt: new Date() },
      })
    }

    return NextResponse.json(transformedItem)
  } catch (error) {
    console.error('Error updating kitchen order item:', error)
    return NextResponse.json({ error: 'Failed to update kitchen order item' }, { status: 500 })
  }
}
