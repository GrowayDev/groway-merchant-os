/**
 * GroSell Order API
 * 
 * Manages orders with BNPL and Layby support
 * Supports transaction and payment flow
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const merchantId = searchParams.get('merchantId')
    const orderId = searchParams.get('orderId')
    const customerPhone = searchParams.get('customerPhone')
    const status = searchParams.get('status')

    if (!merchantId) {
      return NextResponse.json({ error: 'Missing merchantId' }, { status: 400 })
    }

    if (orderId) {
      const order = await db.groSellOrder.findUnique({
        where: { id: orderId },
        include: {
          GroSellBNPLPlan: true,
          GroSellLaybyPlan: true
        }
      })

      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }

      return NextResponse.json({ success: true, order })
    }

    const where: any = { merchantId }
    if (customerPhone) where.customerPhone = customerPhone
    if (status) where.status = status

    const orders = await db.groSellOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    return NextResponse.json({
      success: true,
      orders,
      count: orders.length
    })
  } catch (error) {
    console.error('GroSell order get error:', error)
    return NextResponse.json({ error: 'Failed to get orders' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      merchantId,
      customerPhone,
      customerName,
      customerEmail,
      items,
      deliveryAddress,
      deliveryNotes,
      fulfillmentType = 'delivery',
      paymentMethod = 'pay_now',
      conversationId
    } = body

    if (!merchantId || !customerPhone || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Missing required fields: merchantId, customerPhone, items' },
        { status: 400 }
      )
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => 
      sum + (item.price * item.quantity), 0)
    const deliveryFee = fulfillmentType === 'delivery' ? 30 : 0
    const total = subtotal + deliveryFee
    const itemCount = items.reduce((sum: number, item: any) => 
      sum + item.quantity, 0)

    // Generate order number
    const orderNumber = `GS-${new Date().getFullYear()}-${nanoid(8).toUpperCase()}`

    // Create order
    const order = await db.groSellOrder.create({
      data: {
        id: `gso_${nanoid(12)}`,
        orderNumber,
        conversationId,
        merchantId,
        customerPhone,
        customerName,
        customerEmail,
        deliveryAddress,
        deliveryNotes,
        items: JSON.stringify(items),
        itemCount,
        subtotal,
        deliveryFee,
        total,
        currency: 'ZAR',
        status: 'pending',
        paymentStatus: 'unpaid',
        paymentMethod,
        fulfillmentType,
        complianceChecked: false,
        source: 'whatsapp',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    // Update conversation if exists
    if (conversationId) {
      await db.groSellConversation.update({
        where: { id: conversationId },
        data: {
          orderCount: { increment: 1 },
          totalSpent: { increment: total },
          updatedAt: new Date()
        }
      })
    }

    // Convert cart to order if exists
    const cart = await db.groSellCartSession.findFirst({
      where: { merchantId, customerPhone, status: 'active' }
    })
    if (cart) {
      await db.groSellCartSession.update({
        where: { id: cart.id },
        data: {
          status: 'converted',
          convertedAt: new Date(),
          updatedAt: new Date()
        }
      })
    }

    // Log analytics
    await db.groSellAnalyticsEvent.create({
      data: {
        id: `gsa_${nanoid(12)}`,
        merchantId,
        eventType: 'order_created',
        conversationId,
        orderId: order.id,
        customerPhone,
        value: total,
        createdAt: new Date()
      }
    })

    // Handle payment method
    if (paymentMethod === 'bnpl') {
      // Create BNPL plan (2 installments, interest-free)
      const bnplPlan = await createBNPLPlan(order, body.isSassaBeneficiary, body.sassaPaymentDay)
      return NextResponse.json({
        success: true,
        order,
        bnplPlan,
        message: 'Order created with BNPL payment'
      })
    }

    if (paymentMethod === 'layby') {
      // Create Layby plan
      const laybyPlan = await createLaybyPlan(order, body.depositAmount, body.installmentFrequency)
      return NextResponse.json({
        success: true,
        order,
        laybyPlan,
        message: 'Order created with Layby payment'
      })
    }

    return NextResponse.json({
      success: true,
      order,
      message: 'Order created successfully'
    })
  } catch (error) {
    console.error('GroSell order post error:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, action, data } = body

    if (!orderId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, action' },
        { status: 400 }
      )
    }

    const order = await db.groSellOrder.findUnique({ where: { id: orderId } })
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    let updateData: any = { updatedAt: new Date() }

    switch (action) {
      case 'confirm':
        updateData.status = 'confirmed'
        updateData.confirmedAt = new Date()
        break
      case 'ready':
        updateData.status = 'ready'
        updateData.readyAt = new Date()
        break
      case 'deliver':
        updateData.status = 'delivered'
        updateData.deliveredAt = new Date()
        break
      case 'cancel':
        updateData.status = 'cancelled'
        updateData.cancelledAt = new Date()
        updateData.cancelReason = data?.reason
        break
      case 'pay':
        updateData.paymentStatus = 'paid'
        updateData.paidAt = new Date()
        updateData.paymentReference = data?.reference
        updateData.paymentMethod = data?.method
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const updatedOrder = await db.groSellOrder.update({
      where: { id: orderId },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      order: updatedOrder
    })
  } catch (error) {
    console.error('GroSell order put error:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}

// Create BNPL Plan (2 installments, interest-free)
async function createBNPLPlan(order: any, isSassaBeneficiary: boolean = false, sassaPaymentDay: number | null = null) {
  // Calculate installments (50% each)
  const firstInstallment = order.total / 2
  const secondInstallment = order.total / 2

  // Calculate due dates
  const now = new Date()
  const firstDueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days
  
  // For SASSA beneficiaries, align second payment to grant day
  let secondDueDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) // Default 14 days
  if (isSassaBeneficiary && sassaPaymentDay) {
    const nextGrantDate = getNextGrantDate(sassaPaymentDay)
    secondDueDate = nextGrantDate
  }

  const bnplPlan = await db.groSellBNPLPlan.create({
    data: {
      id: `bnpl_${nanoid(12)}`,
      orderId: order.id,
      merchantId: order.merchantId,
      customerPhone: order.customerPhone,
      customerName: order.customerName,
      isSassaBeneficiary,
      sassaPaymentDay,
      totalAmount: order.total,
      currency: 'ZAR',
      installments: 2,
      firstInstallment,
      secondInstallment,
      firstDueDate: firstDueDate.toISOString().split('T')[0],
      secondDueDate: secondDueDate.toISOString().split('T')[0],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })

  return bnplPlan
}

// Create Layby Plan
async function createLaybyPlan(order: any, depositAmount: number = 0, frequency: string = 'weekly') {
  const now = new Date()
  const balanceAmount = order.total - depositAmount
  const installmentCount = 6
  const installmentAmount = balanceAmount / installmentCount

  // Calculate end date based on frequency
  const weeksToAdd = frequency === 'weekly' ? 6 : frequency === 'biweekly' ? 12 : 24
  const endDate = new Date(now.getTime() + weeksToAdd * 7 * 24 * 60 * 60 * 1000)

  const laybyPlan = await db.groSellLaybyPlan.create({
    data: {
      id: `layby_${nanoid(12)}`,
      laybyNumber: `LY-${new Date().getFullYear()}-${nanoid(8).toUpperCase()}`,
      orderId: order.id,
      merchantId: order.merchantId,
      customerPhone: order.customerPhone,
      customerName: order.customerName,
      totalAmount: order.total,
      depositAmount,
      balanceAmount,
      currency: 'ZAR',
      installmentAmount,
      installmentCount,
      frequency,
      startDate: now.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      nextDueDate: getNextDueDate(frequency).toISOString().split('T')[0],
      nextDueAmount: depositAmount > 0 ? installmentAmount : installmentAmount,
      totalPaid: depositAmount,
      itemsDescription: `Order ${order.orderNumber}`,
      status: depositAmount >= order.total * 0.1 ? 'active' : 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })

  return laybyPlan
}

// Helper: Get next SASSA grant payment date
function getNextGrantDate(paymentDay: number): Date {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  // Grant dates in SA: Older persons (1st), Disability (2nd), Children (3rd)
  // Simplified: use provided paymentDay
  let grantDate = new Date(year, month, paymentDay)
  if (grantDate <= now) {
    grantDate = new Date(year, month + 1, paymentDay)
  }

  return grantDate
}

// Helper: Get next due date based on frequency
function getNextDueDate(frequency: string): Date {
  const now = new Date()
  switch (frequency) {
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    case 'biweekly':
      return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
    case 'monthly':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    default:
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  }
}
