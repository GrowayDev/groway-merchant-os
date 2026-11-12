import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/supplier/orders - Get supplier orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get('supplierId')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!supplierId) {
      return NextResponse.json({ error: 'Supplier ID is required' }, { status: 400 })
    }

    const where: any = { supplierId }

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { number: { contains: search } },
        { trackingNumber: { contains: search } }
      ]
    }

    const [orders, total] = await Promise.all([
      db.purchaseOrder.findMany({
        where,
        include: {
          items: true,
          trackingEvents: {
            orderBy: { timestamp: 'desc' },
            take: 10
          },
          grns: {
            select: { id: true, number: true, status: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      db.purchaseOrder.count({ where })
    ])

    // Calculate stats
    const stats = {
      total,
      pending: await db.purchaseOrder.count({ where: { supplierId, status: 'sent' } }),
      confirmed: await db.purchaseOrder.count({ where: { supplierId, status: 'confirmed' } }),
      dispatched: await db.purchaseOrder.count({ where: { supplierId, status: 'dispatched' } }),
      delivered: await db.purchaseOrder.count({ where: { supplierId, status: 'delivered' } }),
      totalValue: await db.purchaseOrder.aggregate({
        where: { supplierId },
        _sum: { total: true }
      })
    }

    return NextResponse.json({
      orders: orders.map(o => ({
        ...o,
        itemsCount: o.items?.length || 0,
        itemsTotal: o.items?.reduce((sum: number, i: any) => sum + i.totalPrice, 0) || 0
      })),
      total,
      stats: {
        ...stats,
        totalValue: stats.totalValue._sum.total || 0
      }
    })
  } catch (error) {
    console.error('Error fetching supplier orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

// PUT /api/supplier/orders - Update order status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, action, ...updates } = body

    const po = await db.purchaseOrder.findUnique({
      where: { id },
      include: { items: true }
    })

    if (!po) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    let newStatus = po.status
    let trackingEvent: any = null

    switch (action) {
      case 'confirm':
        newStatus = 'confirmed'
        trackingEvent = {
          poId: id,
          stage: 'confirmed',
          status: 'completed',
          title: 'Order Confirmed',
          description: 'Supplier confirmed the order',
          createdBy: updates.confirmedBy
        }
        break

      case 'process':
        newStatus = 'processing'
        trackingEvent = {
          poId: id,
          stage: 'processing',
          status: 'completed',
          title: 'Order Processing',
          description: 'Order is being prepared',
          createdBy: updates.processedBy
        }
        break

      case 'dispatch':
        newStatus = 'dispatched'
        trackingEvent = {
          poId: id,
          stage: 'dispatched',
          status: 'completed',
          title: 'Order Dispatched',
          description: updates.trackingNumber 
            ? `Shipped with tracking: ${updates.trackingNumber}` 
            : 'Order has been dispatched',
          location: updates.location,
          createdBy: updates.dispatchedBy
        }
        break

      case 'in_transit':
        newStatus = 'in_transit'
        trackingEvent = {
          poId: id,
          stage: 'in_transit',
          status: 'in_progress',
          title: 'In Transit',
          description: updates.location ? `Currently at: ${updates.location}` : 'Order is in transit',
          location: updates.location,
          createdBy: updates.updatedBy
        }
        break

      case 'deliver':
        newStatus = 'delivered'
        trackingEvent = {
          poId: id,
          stage: 'delivered',
          status: 'completed',
          title: 'Delivered',
          description: 'Order has been delivered',
          location: updates.deliveryLocation,
          createdBy: updates.deliveredBy
        }
        break

      case 'reject':
        newStatus = 'rejected'
        trackingEvent = {
          poId: id,
          stage: 'rejected',
          status: 'completed',
          title: 'Order Rejected',
          description: updates.rejectionReason || 'Order rejected by supplier',
          createdBy: updates.rejectedBy
        }
        break

      default:
        // Allow direct status update
        if (updates.status) {
          newStatus = updates.status
        }
    }

    // Update the PO
    const updatedPO = await db.purchaseOrder.update({
      where: { id },
      data: {
        status: newStatus,
        trackingNumber: updates.trackingNumber || po.trackingNumber,
        estimatedDelivery: updates.estimatedDelivery || po.estimatedDelivery,
        notes: updates.notes || po.notes,
        confirmedAt: action === 'confirm' ? new Date() : po.confirmedAt,
        confirmedDate: action === 'confirm' ? new Date().toISOString().split('T')[0] : po.confirmedDate
      },
      include: { items: true }
    })

    // Create tracking event
    if (trackingEvent) {
      await db.orderTrackingEvent.create({ data: trackingEvent })
    }

    return NextResponse.json({ order: updatedPO })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}
