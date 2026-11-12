import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/merchant-os/kds/orders - Get kitchen orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const station = searchParams.get('station')
    const status = searchParams.get('status') || 'new,preparing,ready'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const statuses = status.split(',')

    // Build where clause
    const where: any = {
      status: { in: statuses }
    }

    // If station is specified, filter by station routing
    if (station && station !== 'all') {
      where.KitchenOrderStation = {
        some: { station }
      }
    }

    // Fetch orders with items and station routings
    const orders = await db.kitchenOrder.findMany({
      where,
      include: {
        KitchenOrderItem: {
          orderBy: { createdAt: 'asc' }
        },
        KitchenOrderStation: true,
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' }
      ],
      take: limit,
      skip: offset,
    })

    // Get stats
    const stats = await db.kitchenOrder.groupBy({
      by: ['status'],
      _count: { id: true },
      where: { status: { in: ['new', 'preparing', 'ready'] } }
    })

    const formattedStats = {
      new: stats.find(s => s.status === 'new')?._count?.id || 0,
      preparing: stats.find(s => s.status === 'preparing')?._count?.id || 0,
      ready: stats.find(s => s.status === 'ready')?._count?.id || 0,
    }

    return NextResponse.json({
      orders: orders.map(order => ({
        ...order,
        items: order.KitchenOrderItem,
        stationRoutings: order.KitchenOrderStation,
      })),
      stats: formattedStats,
      total: orders.length,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error fetching kitchen orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch kitchen orders' },
      { status: 500 }
    )
  }
}

// POST /api/merchant-os/kds/orders - Create kitchen order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      orderNumber,
      type = 'dine-in',
      priority = 'normal',
      tableNumber,
      customerName,
      estimatedTime = 15,
      notes,
      waiterName,
      items = [],
      stationRoutings = [],
    } = body

    if (!orderNumber) {
      return NextResponse.json(
        { error: 'orderNumber is required' },
        { status: 400 }
      )
    }

    // Create order
    const order = await db.kitchenOrder.create({
      data: {
        orderNumber,
        type,
        priority,
        tableNumber,
        customerName,
        estimatedTime,
        notes,
        waiterName,
        status: 'new',
      },
    })

    // Create order items
    if (items.length > 0) {
      for (const item of items) {
        await db.kitchenOrderItem.create({
          data: {
            orderId: order.id,
            name: item.name,
            quantity: item.quantity || 1,
            notes: item.notes,
            modifiers: item.modifiers,
            station: item.station || 'grill',
            preparationTime: item.preparationTime || 15,
            dietary: item.dietary,
            allergens: item.allergens,
            spicyLevel: item.spicyLevel,
            status: 'pending',
          },
        })
      }
    }

    // Create station routings
    if (stationRoutings.length > 0) {
      for (const station of stationRoutings) {
        await db.kitchenOrderStation.create({
          data: {
            orderId: order.id,
            station,
          },
        })
      }
    }

    // Fetch complete order
    const completeOrder = await db.kitchenOrder.findUnique({
      where: { id: order.id },
      include: {
        KitchenOrderItem: true,
        KitchenOrderStation: true,
      },
    })

    return NextResponse.json({
      ...completeOrder,
      items: completeOrder?.KitchenOrderItem,
      stationRoutings: completeOrder?.KitchenOrderStation,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating kitchen order:', error)
    return NextResponse.json(
      { error: 'Failed to create kitchen order' },
      { status: 500 }
    )
  }
}

// PUT /api/merchant-os/kds/orders - Update kitchen order
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, ...updates } = body

    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId is required' },
        { status: 400 }
      )
    }

    const order = await db.kitchenOrder.update({
      where: { id: orderId },
      data: {
        ...updates,
        updatedAt: new Date()
      },
      include: {
        KitchenOrderItem: true,
        KitchenOrderStation: true,
      },
    })

    return NextResponse.json({
      ...order,
      items: order.KitchenOrderItem,
      stationRoutings: order.KitchenOrderStation,
    })
  } catch (error) {
    console.error('Error updating kitchen order:', error)
    return NextResponse.json(
      { error: 'Failed to update kitchen order' },
      { status: 500 }
    )
  }
}

// DELETE /api/merchant-os/kds/orders - Delete kitchen order
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId is required' },
        { status: 400 }
      )
    }

    // Delete related items and station routings first
    await db.kitchenOrderItem.deleteMany({
      where: { orderId }
    })

    await db.kitchenOrderStation.deleteMany({
      where: { orderId }
    })

    await db.kitchenOrder.delete({
      where: { id: orderId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting kitchen order:', error)
    return NextResponse.json(
      { error: 'Failed to delete kitchen order' },
      { status: 500 }
    )
  }
}
