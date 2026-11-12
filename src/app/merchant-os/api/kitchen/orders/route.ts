import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Fetch all kitchen orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const station = searchParams.get('station')

    const where: any = {}
    if (status && status !== 'all') {
      where.status = status
    }
    if (station && station !== 'all') {
      where.KitchenOrderStation = {
        some: { station }
      }
    }

    const orders = await db.kitchenOrder.findMany({
      where,
      include: {
        KitchenOrderItem: true,
        KitchenOrderStation: true,
      },
      orderBy: [
        { priority: 'asc' },
        { createdAt: 'asc' },
      ],
    })

    // Transform to expected format
    const transformedOrders = orders.map(order => ({
      ...order,
      items: order.KitchenOrderItem,
      stationRoutings: order.KitchenOrderStation,
    }))

    return NextResponse.json(transformedOrders)
  } catch (error) {
    console.error('Error fetching kitchen orders:', error)
    return NextResponse.json({ error: 'Failed to fetch kitchen orders' }, { status: 500 })
  }
}

// POST - Create a new kitchen order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      orderNumber, 
      type, 
      priority, 
      tableNumber, 
      customerName, 
      estimatedTime, 
      notes, 
      waiterName,
      items,
      stationRoutings 
    } = body

    if (!orderNumber) {
      return NextResponse.json({ error: 'Order number is required' }, { status: 400 })
    }

    const order = await db.kitchenOrder.create({
      data: {
        id: `ko-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        orderNumber,
        type: type || 'dine-in',
        priority: priority || 'normal',
        tableNumber,
        customerName,
        estimatedTime: estimatedTime || 15,
        notes,
        waiterName,
        updatedAt: new Date(),
        KitchenOrderItem: items ? {
          create: items.map((item: any) => ({
            id: `koi-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            name: item.name,
            quantity: item.quantity || 1,
            notes: item.notes,
            modifiers: item.modifiers ? JSON.stringify(item.modifiers) : null,
            status: item.status || 'pending',
            station: item.station || 'grill',
            preparationTime: item.preparationTime || 15,
            dietary: item.dietary ? JSON.stringify(item.dietary) : null,
            allergens: item.allergens ? JSON.stringify(item.allergens) : null,
            spicyLevel: item.spicyLevel,
            updatedAt: new Date(),
          }))
        } : undefined,
        KitchenOrderStation: stationRoutings ? {
          create: stationRoutings.map((station: string) => ({
            id: `kos-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            station,
          }))
        } : undefined,
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

    return NextResponse.json(transformedOrder, { status: 201 })
  } catch (error) {
    console.error('Error creating kitchen order:', error)
    return NextResponse.json({ error: 'Failed to create kitchen order' }, { status: 500 })
  }
}
