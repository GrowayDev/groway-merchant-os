import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Generate unique PO number
async function generatePONumber() {
  const date = new Date()
  const year = date.getFullYear()
  
  const lastPO = await db.purchaseOrder.findFirst({
    where: { number: { startsWith: `PO-${year}` } },
    orderBy: { number: 'desc' }
  })
  
  if (lastPO) {
    const lastNum = parseInt(lastPO.number.split('-').pop() || '0')
    return `PO-${year}-${String(lastNum + 1).padStart(4, '0')}`
  }
  
  return `PO-${year}-0001`
}

// GET /api/grosupply-pro/orders - Get purchase orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const supplierId = searchParams.get('supplierId')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    const where: any = {}
    
    if (status) {
      where.status = status
    }
    
    if (supplierId) {
      where.supplierId = supplierId
    }
    
    if (search) {
      where.OR = [
        { number: { contains: search } },
        { trackingNumber: { contains: search } },
        { supplier: { name: { contains: search } } }
      ]
    }
    
    const [orders, total] = await Promise.all([
      db.purchaseOrder.findMany({
        where,
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              tier: true,
              contactPerson: true,
              email: true,
              phone: true
            }
          },
          items: true,
          trackingEvents: {
            orderBy: { timestamp: 'desc' },
            take: 5
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      db.purchaseOrder.count({ where })
    ])
    
    return NextResponse.json({ orders, total })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

// POST /api/grosupply-pro/orders - Create purchase order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const number = await generatePONumber()
    
    // Calculate totals
    const subtotal = body.items?.reduce((sum: number, item: any) => 
      sum + item.total, 0) || 0
    const vat = subtotal * 0.15
    const total = subtotal + vat + (body.deliveryCost || 0)
    
    // Create the purchase order
    const order = await db.purchaseOrder.create({
      data: {
        number,
        supplierId: body.supplierId,
        status: body.status || 'draft',
        subtotal,
        vat,
        deliveryCost: body.deliveryCost || 0,
        total,
        deliveryAddress: body.deliveryAddress,
        requestedDate: body.requestedDate,
        notes: body.notes,
        internalNotes: body.internalNotes,
        createdBy: body.createdBy,
        isAutoOrder: body.isAutoOrder || false,
        items: {
          create: body.items?.map((item: any) => ({
            sku: item.sku,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.total
          })) || []
        }
      },
      include: {
        supplier: true,
        items: true
      }
    })
    
    // Create initial tracking event
    await db.orderTrackingEvent.create({
      data: {
        poId: order.id,
        stage: 'draft',
        status: 'completed',
        title: 'Order Created',
        description: body.isAutoOrder ? 'Auto-generated from stock alerts' : 'Manual order created',
        createdBy: body.createdBy
      }
    })
    
    return NextResponse.json({ order })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}

// PUT /api/grosupply-pro/orders - Update order status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, action, ...updates } = body
    
    const po = await db.purchaseOrder.findUnique({
      where: { id },
      include: { supplier: true }
    })
    
    if (!po) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }
    
    let newStatus = po.status
    let trackingEvent: any = null
    
    switch (action) {
      case 'approve':
        newStatus = 'approved'
        trackingEvent = {
          poId: id,
          stage: 'approved',
          status: 'completed',
          title: 'Order Approved',
          description: `Approved by ${updates.approvedBy || 'system'}`,
          createdBy: updates.approvedBy
        }
        break
      case 'send':
        newStatus = 'sent'
        trackingEvent = {
          poId: id,
          stage: 'submitted',
          status: 'completed',
          title: 'Order Sent to Supplier',
          description: 'PO sent to supplier for confirmation',
          createdBy: updates.sentBy
        }
        break
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
      case 'dispatch':
        newStatus = 'dispatched'
        trackingEvent = {
          poId: id,
          stage: 'dispatched',
          status: 'completed',
          title: 'Order Dispatched',
          description: updates.trackingNumber ? `Tracking: ${updates.trackingNumber}` : undefined,
          location: updates.location,
          createdBy: updates.dispatchedBy
        }
        break
      case 'deliver':
        newStatus = 'delivered'
        trackingEvent = {
          poId: id,
          stage: 'delivered',
          status: 'completed',
          title: 'Order Delivered',
          description: 'Order has been delivered',
          location: updates.deliveryLocation,
          createdBy: updates.deliveredBy
        }
        // Create stock movement for inventory update
        if (updates.createStockMovements) {
          const poItems = await db.purchaseOrderItem.findMany({
            where: { poId: id }
          })
          
          for (const item of poItems) {
            await db.stockMovementOrder.create({
              data: {
                poId: id,
                sku: item.sku,
                productName: item.description,
                quantity: item.quantity,
                unitCost: item.unitPrice,
                totalValue: item.totalPrice,
                movementType: 'in',
                reason: `PO ${po.number} delivery`,
                reference: po.number
              }
            })
          }
        }
        break
      case 'cancel':
        newStatus = 'cancelled'
        trackingEvent = {
          poId: id,
          stage: 'cancelled',
          status: 'completed',
          title: 'Order Cancelled',
          description: updates.cancelReason || 'Order cancelled',
          createdBy: updates.cancelledBy
        }
        break
    }
    
    // Update the PO
    const updatedPO = await db.purchaseOrder.update({
      where: { id },
      data: {
        status: newStatus,
        trackingNumber: updates.trackingNumber || po.trackingNumber,
        estimatedDelivery: updates.estimatedDelivery || po.estimatedDelivery,
        notes: updates.notes || po.notes,
        ...(action === 'approve' && { 
          approvedBy: updates.approvedBy,
          approvedAt: new Date()
        }),
        ...(action === 'send' && { sentAt: new Date() }),
        ...(action === 'confirm' && { confirmedAt: new Date(), confirmedDate: new Date().toISOString().split('T')[0] })
      }
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
