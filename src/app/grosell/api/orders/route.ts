import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

// Generate order number
function generateOrderNumber(): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `GS${dateStr}${random}`
}

// GET - List orders for a merchant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const status = searchParams.get('status')
    const customerPhone = searchParams.get('customerPhone')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId required' }, { status: 400 })
    }

    const where: Record<string, unknown> = { merchantId }
    if (status) where.status = status
    if (customerPhone) where.customerPhone = customerPhone

    const [orders, total] = await Promise.all([
      db.groSellOrder.findMany({
        where,
        include: {
          GroSellOrderItem: true
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      db.groSellOrder.count({ where })
    ])

    return NextResponse.json({ orders, total })
  } catch (error) {
    console.error('Error fetching GroSell orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

// POST - Create a new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      merchantId,
      customerPhone,
      customerName,
      customerAddress,
      customerCity,
      deliveryNotes,
      items,
      deliveryFee,
      discount,
      notes,
      paymentMethod
    } = body

    if (!merchantId || !customerPhone || !items || items.length === 0) {
      return NextResponse.json({ error: 'merchantId, customerPhone, and items are required' }, { status: 400 })
    }

    // Calculate totals
    let subtotal = 0
    const orderItems = items.map((item: { productId?: string; productName: string; quantity: number; unitPrice: number; notes?: string }) => {
      const total = item.quantity * item.unitPrice
      subtotal += total
      return {
        id: `gsi_${nanoid(12)}`,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total
      }
    })

    const taxAmount = subtotal * 0.15 // 15% VAT
    const total = subtotal + (deliveryFee || 0) + taxAmount - (discount || 0)

    // Find or create customer
    let customer = await db.groSellCustomer.findUnique({
      where: { merchantId_phone: { merchantId, phone: customerPhone } }
    })

    if (!customer) {
      customer = await db.groSellCustomer.create({
        data: {
          id: `gsc_${nanoid(12)}`,
          merchantId,
          phone: customerPhone,
          name: customerName,
          address: customerAddress,
          city: customerCity,
          updatedAt: new Date()
        }
      })
    }

    // Create order
    const order = await db.groSellOrder.create({
      data: {
        id: `gso_${nanoid(12)}`,
        orderNumber: generateOrderNumber(),
        merchantId,
        customerId: customer.id,
        customerPhone,
        customerName,
        customerAddress,
        customerCity,
        deliveryNotes,
        subtotal,
        deliveryFee: deliveryFee || 0,
        discount: discount || 0,
        taxAmount,
        total,
        notes,
        paymentMethod,
        updatedAt: new Date()
      }
    })

    // Create order items separately
    await db.groSellOrderItem.createMany({
      data: orderItems.map(item => ({
        ...item,
        orderId: order.id
      }))
    })

    // Update customer stats
    await db.groSellCustomer.update({
      where: { id: customer.id },
      data: {
        totalOrders: { increment: 1 },
        totalSpent: { increment: total },
        lastOrderAt: new Date(),
        name: customerName || customer.name,
        address: customerAddress || customer.address,
        city: customerCity || customer.city,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Error creating GroSell order:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}

// PUT - Update order status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, paymentStatus, paymentMethod, paymentReference, internalNotes } = body

    if (!id) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() }
    
    if (status) {
      updateData.status = status
      // Set timestamps for status changes
      if (status === 'confirmed') updateData.confirmedAt = new Date()
      if (status === 'preparing') updateData.preparingAt = new Date()
      if (status === 'ready') updateData.readyAt = new Date()
      if (status === 'delivered') updateData.deliveredAt = new Date()
      if (status === 'cancelled') updateData.cancelledAt = new Date()
    }
    
    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus
      if (paymentStatus === 'paid') updateData.paidAt = new Date()
    }
    
    if (paymentMethod) updateData.paymentMethod = paymentMethod
    if (paymentReference) updateData.paymentReference = paymentReference
    if (internalNotes !== undefined) updateData.internalNotes = internalNotes

    const order = await db.groSellOrder.update({
      where: { id },
      data: updateData,
      include: { GroSellOrderItem: true }
    })

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Error updating GroSell order:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}
