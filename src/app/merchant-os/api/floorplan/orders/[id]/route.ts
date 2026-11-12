import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
}

// PUT - Update an order
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const { items, total, guests } = body

    const order = await db.tableOrder.update({
      where: { id },
      data: {
        ...(items !== undefined && { items }),
        ...(total !== undefined && { total }),
        ...(guests !== undefined && { guests }),
      },
      include: {
        RestaurantTable: {
          include: {
            FloorSection: true,
            Server: true,
          },
        },
      },
    })
    
    // Transform to match expected format
    const transformedOrder = {
      ...order,
      table: {
        ...order.RestaurantTable,
        section: order.RestaurantTable?.FloorSection,
        server: order.RestaurantTable?.Server,
      },
    }
    
    return NextResponse.json(transformedOrder)
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}

// DELETE - Close an order
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    
    // Get the order to find the table
    const order = await db.tableOrder.findUnique({
      where: { id },
    })
    
    if (order) {
      // Update table status to cleaning
      await db.restaurantTable.update({
        where: { id: order.tableId },
        data: { status: 'cleaning' },
      })
      
      // Delete the order
      await db.tableOrder.delete({
        where: { id },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error closing order:', error)
    return NextResponse.json({ error: 'Failed to close order' }, { status: 500 })
  }
}
