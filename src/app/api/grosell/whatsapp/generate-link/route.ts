import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthContext, getMerchantId, unauthorizedResponse, badRequestResponse } from '@/lib/auth-context'

// GET /api/grosell/whatsapp/generate-link - Generate WhatsApp click-to-chat link
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
    
    const phone = searchParams.get('phone') // Customer phone (optional)
    const message = searchParams.get('message') // Custom message (optional)
    const type = searchParams.get('type') || 'order' // order, inquiry, support

    // Get merchant's WhatsApp settings
    const settings = await db.whatsAppSettings.findUnique({
      where: { merchantId }
    })

    if (!settings?.phoneNumber) {
      return NextResponse.json({
        success: false,
        error: 'WhatsApp not configured for this merchant'
      }, { status: 400 })
    }

    // Format phone number (remove + and spaces)
    const formattedPhone = settings.phoneNumber.replace(/[\+\s\-\(\)]/g, '')

    // Determine message based on type
    let defaultMessage = message
    if (!defaultMessage) {
      switch (type) {
        case 'order':
          defaultMessage = settings.defaultMessage || 'Hi! I would like to place an order.'
          break
        case 'inquiry':
          defaultMessage = 'Hi! I have a question about your products.'
          break
        case 'support':
          defaultMessage = 'Hi! I need some help with my order.'
          break
        default:
          defaultMessage = settings.defaultMessage || 'Hi!'
      }
    }

    // Generate click-to-chat link
    const encodedMessage = encodeURIComponent(defaultMessage)
    const whatsappLink = `https://wa.me/${formattedPhone}?text=${encodedMessage}`

    return NextResponse.json({
      success: true,
      data: {
        link: whatsappLink,
        phone: settings.phoneNumber,
        businessName: settings.businessName,
        message: defaultMessage,
        qrLink: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(whatsappLink)}`,
      }
    })
  } catch (error) {
    console.error('Error generating WhatsApp link:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate WhatsApp link' },
      { status: 500 }
    )
  }
}

// POST /api/grosell/whatsapp/generate-link - Generate custom order link
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
      orderId,
      customerId,
      message,
      includeOrderDetails,
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

    // Get merchant's WhatsApp settings
    const settings = await db.whatsAppSettings.findUnique({
      where: { merchantId }
    })

    if (!settings?.phoneNumber) {
      return NextResponse.json({
        success: false,
        error: 'WhatsApp not configured'
      }, { status: 400 })
    }

    // Get customer phone if customerId provided
    let customerPhone = null
    if (customerId) {
      const customer = await db.sellCustomer.findUnique({
        where: { id: customerId }
      })
      customerPhone = customer?.phone
    }

    // Get order details if orderId provided
    let orderMessage = message
    if (orderId && includeOrderDetails) {
      const order = await db.sellOrder.findUnique({
        where: { id: orderId },
        include: { items: true }
      })
      if (order) {
        const itemList = order.items.map(i => 
          `• ${i.productName} x${i.quantity} - R${i.lineTotal.toFixed(2)}`
        ).join('\n')
        
        orderMessage = `*Order #${order.orderNumber}*\n\n${itemList}\n\n*Total: R${order.total.toFixed(2)}*`
        customerPhone = order.customerPhone
      }
    }

    // Format phone number
    const formattedPhone = settings.phoneNumber.replace(/[\+\s\-\(\)]/g, '')

    // Generate link
    const finalMessage = orderMessage || settings.defaultMessage || 'Hi!'
    const encodedMessage = encodeURIComponent(finalMessage)
    const whatsappLink = `https://wa.me/${formattedPhone}?text=${encodedMessage}`

    // Generate customer link if we have their phone
    let customerLink = null
    if (customerPhone) {
      const formattedCustomerPhone = customerPhone.replace(/[\+\s\-\(\)]/g, '')
      customerLink = `https://wa.me/${formattedCustomerPhone}?text=${encodedMessage}`
    }

    return NextResponse.json({
      success: true,
      data: {
        link: whatsappLink,
        customerLink,
        phone: settings.phoneNumber,
        businessName: settings.businessName,
        message: finalMessage,
        qrLink: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(whatsappLink)}`,
      }
    })
  } catch (error) {
    console.error('Error generating WhatsApp link:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate WhatsApp link' },
      { status: 500 }
    )
  }
}
