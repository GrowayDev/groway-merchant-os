import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Fetch all table orders
export async function GET(request: NextRequest) {
  try {
    const orders = await db.tableOrder.findMany({
      include: {
        RestaurantTable: {
          include: {
            FloorSection: true,
            Server: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    
    // Transform to match expected format
    const transformedOrders = orders.map(order => ({
      ...order,
      table: {
        ...order.RestaurantTable,
        section: order.RestaurantTable?.FloorSection,
        server: order.RestaurantTable?.Server,
      },
    }))
    
    return NextResponse.json(transformedOrders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

// POST - Create a new order (seat guests)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tableId, orderId, items, total, startTime, guests } = body

    if (!tableId) {
      return NextResponse.json({ error: 'Table ID is required' }, { status: 400 })
    }

    // Create order and update table status
    const order = await db.tableOrder.create({
      data: {
        id: `order-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        tableId,
        orderId: orderId || `ORD-${Date.now().toString().slice(-6)}`,
        items: items || 0,
        total: total || 0,
        startTime: startTime || new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }),
        guests: guests || 1,
        updatedAt: new Date(),
      },
      include: {
        RestaurantTable: true,
      },
    })

    // Update table status to occupied
    await db.restaurantTable.update({
      where: { id: tableId },
      data: { status: 'occupied' },
    })

    // Delete any existing reservation
    await db.tableReservation.deleteMany({
      where: { tableId },
    })
    
    // Transform to match expected format
    const transformedOrder = {
      ...order,
      table: order.RestaurantTable,
    }

    return NextResponse.json(transformedOrder, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
