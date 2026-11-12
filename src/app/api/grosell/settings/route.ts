import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthContext, getMerchantId, unauthorizedResponse, badRequestResponse } from '@/lib/auth-context'

// GET /api/grosell/settings - Get WhatsApp settings
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

    let settings = await db.whatsAppSettings.findUnique({
      where: { merchantId }
    })

    if (!settings) {
      // Create default settings
      settings = await db.whatsAppSettings.create({
        data: {
          merchantId,
          clickToChatEnabled: true,
          defaultMessage: 'Hi! I would like to place an order.',
          businessName: 'My Business',
          apiStatus: 'not_configured',
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: settings
    })
  } catch (error) {
    console.error('Error fetching WhatsApp settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// POST /api/grosell/settings - Update WhatsApp settings
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
      phoneNumber,
      businessName,
      defaultMessage,
      clickToChatEnabled,
      autoReplyEnabled,
      orderConfirmationEnabled,
      deliveryUpdatesEnabled,
      businessHoursEnabled,
      businessHoursStart,
      businessHoursEnd,
      businessDays,
      awayMessage,
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

    const settings = await db.whatsAppSettings.upsert({
      where: { merchantId },
      create: {
        merchantId,
        phoneNumber,
        businessName,
        defaultMessage,
        clickToChatEnabled: clickToChatEnabled ?? true,
        autoReplyEnabled: autoReplyEnabled ?? false,
        orderConfirmationEnabled: orderConfirmationEnabled ?? true,
        deliveryUpdatesEnabled: deliveryUpdatesEnabled ?? true,
        businessHoursEnabled: businessHoursEnabled ?? false,
        businessHoursStart: businessHoursStart || '08:00',
        businessHoursEnd: businessHoursEnd || '18:00',
        businessDays: businessDays || '1,2,3,4,5',
        awayMessage,
      },
      update: {
        phoneNumber,
        businessName,
        defaultMessage,
        clickToChatEnabled,
        autoReplyEnabled,
        orderConfirmationEnabled,
        deliveryUpdatesEnabled,
        businessHoursEnabled,
        businessHoursStart,
        businessHoursEnd,
        businessDays,
        awayMessage,
      }
    })

    return NextResponse.json({
      success: true,
      data: settings
    })
  } catch (error) {
    console.error('Error updating WhatsApp settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
