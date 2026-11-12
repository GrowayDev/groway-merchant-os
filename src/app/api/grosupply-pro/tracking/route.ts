import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/grosupply-pro/tracking - Get order tracking events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const poId = searchParams.get('poId')
    const grnId = searchParams.get('grnId')
    const stage = searchParams.get('stage')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    const where: any = {}
    
    if (poId) {
      where.poId = poId
    }
    
    if (grnId) {
      where.grnId = grnId
    }
    
    if (stage) {
      where.stage = stage
    }
    
    const events = await db.orderTrackingEvent.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: {
        po: {
          select: {
            id: true,
            number: true,
            supplierId: true,
            status: true,
            trackingNumber: true,
            estimatedDelivery: true,
            supplier: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })
    
    return NextResponse.json({ events })
  } catch (error) {
    console.error('Error fetching tracking events:', error)
    return NextResponse.json({ error: 'Failed to fetch tracking events' }, { status: 500 })
  }
}

// POST /api/grosupply-pro/tracking - Create a tracking event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const event = await db.orderTrackingEvent.create({
      data: {
        poId: body.poId,
        grnId: body.grnId,
        stage: body.stage,
        status: body.status || 'pending',
        title: body.title,
        description: body.description,
        location: body.location,
        latitude: body.latitude,
        longitude: body.longitude,
        createdBy: body.createdBy,
        metadata: body.metadata
      }
    })
    
    // Update PO status if this is a status-changing event
    if (body.poId && body.updatePOStatus) {
      await db.purchaseOrder.update({
        where: { id: body.poId },
        data: { status: body.stage }
      })
    }
    
    return NextResponse.json({ event })
  } catch (error) {
    console.error('Error creating tracking event:', error)
    return NextResponse.json({ error: 'Failed to create tracking event' }, { status: 500 })
  }
}

// PUT /api/grosupply-pro/tracking - Update order status with tracking
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { poId, newStatus, notes, location, createdBy } = body
    
    // Get the current PO
    const po = await db.purchaseOrder.findUnique({
      where: { id: poId },
      include: { supplier: true }
    })
    
    if (!po) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }
    
    // Status stage mapping
    const stageTitles: Record<string, string> = {
      'submitted': 'Order Submitted',
      'confirmed': 'Order Confirmed',
      'processing': 'Processing',
      'dispatched': 'Dispatched',
      'in_transit': 'In Transit',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    }
    
    // Create tracking event
    const event = await db.orderTrackingEvent.create({
      data: {
        poId,
        stage: newStatus,
        status: 'completed',
        title: stageTitles[newStatus] || newStatus,
        description: notes,
        location,
        createdBy
      }
    })
    
    // Update PO status
    const updatedPO = await db.purchaseOrder.update({
      where: { id: poId },
      data: { 
        status: newStatus,
        ...(newStatus === 'confirmed' && { confirmedAt: new Date(), confirmedDate: new Date().toISOString().split('T')[0] })
      }
    })
    
    return NextResponse.json({ event, purchaseOrder: updatedPO })
  } catch (error) {
    console.error('Error updating order status:', error)
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 })
  }
}
