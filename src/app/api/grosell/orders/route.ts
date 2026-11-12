import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'
import { getAuthContext, getMerchantId, unauthorizedResponse, badRequestResponse } from '@/lib/auth-context'

// Generate order number
function generateOrderNumber(): string {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const random = nanoid(6).toUpperCase()
  return `GS${year}${month}${day}-${random}`
}

// GET /api/grosell/orders - List orders
export async function GET(request: NextRequest) {
  try {
    // Get authenticated context
    const context = await getAuthContext(request)
    if (!context) {
      return unauthorizedResponse()
    }
    
    const { searchParams } = new URL(request.url)
    
    // Get merchantId from params or context
    const merchantIdResult = getMerchantId(searchParams, context as any)
    if (merchantIdResult instanceof NextResponse) {
      return merchantIdResult
    }
    const merchantId = merchantIdResult
    
    const status = searchParams.get('status')
    const paymentStatus = searchParams.get('paymentStatus')
    const customerId = searchParams.get('customerId')
    const search = searchParams.get('search')

    const where: any = { merchantId }
    if (status) where.status = status
    if (paymentStatus) where.paymentStatus = paymentStatus
    if (customerId) where.customerId = customerId
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
      ]
    }

    const orders = await db.sellOrder.findMany({
      where,
      include: {
        items: {
          include: {
            product: true
          }
        },
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    // Get summary stats
    const stats = await db.sellOrder.aggregate({
      where: { merchantId },
      _count: { id: true },
      _sum: { total: true },
    })

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayOrders = await db.sellOrder.count({
      where: {
        merchantId,
        createdAt: { gte: todayStart }
      }
    })

    const pendingOrders = await db.sellOrder.count({
      where: { merchantId, status: 'pending' }
    })

    return NextResponse.json({
      success: true,
      data: orders,
      stats: {
        total: stats._count.id,
        revenue: stats._sum.total || 0,
        today: todayOrders,
        pending: pendingOrders,
      }
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

// POST /api/grosell/orders - Create order
export async function POST(request: NextRequest) {
  try {
    // Get authenticated context
    const context = await getAuthContext(request)
    if (!context) {
      return unauthorizedResponse()
    }
    
    const body = await request.json()
    const {
      merchantId: bodyMerchantId,
      customerId,
      customerPhone,
      customerName,
      items,
      deliveryAddress,
      deliveryNotes,
      deliveryDate,
      deliveryTime,
      fulfillmentType,
      notes,
    } = body
    
    // Validate merchantId - use body param or context
    let merchantId = bodyMerchantId
    if (!merchantId && 'merchantId' in context) {
      merchantId = context.merchantId
    }
    
    if (!merchantId) {
      return badRequestResponse('merchantId is required')
    }
    
    // Security check: ensure user has access to this merchant
    if ('merchantId' in context && merchantId !== context.merchantId) {
      const allowedRoles = ['platform_admin', 'super_admin', 'admin']
      if (!allowedRoles.includes(context.role)) {
        return NextResponse.json(
          { success: false, error: 'Access denied to this merchant' },
          { status: 403 }
        )
      }
    }

    // Calculate totals
    let subtotal = 0
    let totalVat = 0
    const orderItems = []

    for (const item of items || []) {
      const product = item.productId ? await db.sellProduct.findUnique({
        where: { id: item.productId }
      }) : null

      const unitPrice = product?.price || parseFloat(item.price) || 0
      const quantity = parseInt(item.quantity) || 1
      const vatRate = product?.vatRate || 15.0
      const lineTotal = unitPrice * quantity
      const lineVat = product?.vatInclusive ? 0 : (lineTotal * vatRate / 100)

      subtotal += lineTotal
      totalVat += lineVat

      orderItems.push({
        productId: item.productId,
        productName: product?.name || item.name,
        productSku: product?.sku,
        quantity,
        unitPrice,
        vatRate,
        lineTotal: lineTotal + lineVat,
        notes: item.notes,
      })
    }

    const total = subtotal + totalVat

    const order = await db.sellOrder.create({
      data: {
        merchantId,
        orderNumber: generateOrderNumber(),
        customerId,
        customerPhone,
        customerName,
        status: 'pending',
        paymentStatus: 'pending',
        fulfillmentType: fulfillmentType || 'pickup',
        subtotal,
        vat: totalVat,
        total,
        deliveryAddress,
        deliveryNotes,
        deliveryDate,
        deliveryTime,
        notes,
        items: {
          create: orderItems
        },
        statusHistory: {
          create: {
            status: 'pending',
            notes: 'Order created'
          }
        }
      },
      include: {
        items: true,
        statusHistory: true,
      }
    })

    // Update customer stats if customer exists
    if (customerId) {
      await db.sellCustomer.update({
        where: { id: customerId },
        data: {
          totalOrders: { increment: 1 },
          totalSpent: { increment: total },
          lastOrderAt: new Date(),
        }
      })
    }

    // Update product stock and stats
    for (const item of orderItems) {
      if (item.productId) {
        await db.sellProduct.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
            timesOrdered: { increment: 1 },
            lastOrderedAt: new Date(),
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: order
    })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    )
  }
}
