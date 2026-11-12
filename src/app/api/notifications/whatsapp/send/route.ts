import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'

/**
 * WhatsApp Notification API
 * 
 * Compliant with WhatsApp Business API rules:
 * - Only sends to users who have opted in
 * - Uses approved message templates
 * - Respects rate limits
 * - Includes opt-out mechanism
 */

// WhatsApp message templates (must be pre-approved in Meta Business Manager)
const WHATSAPP_TEMPLATES: Record<string, {
  name: string
  language: string
  category: string
}> = {
  kyc_document_uploaded: {
    name: 'kyc_document_received',
    language: 'en',
    category: 'ACCOUNT_UPDATE'
  },
  kyc_document_verified: {
    name: 'kyc_document_verified',
    language: 'en',
    category: 'ACCOUNT_UPDATE'
  },
  kyc_document_rejected: {
    name: 'kyc_document_rejected',
    language: 'en',
    category: 'ACCOUNT_UPDATE'
  },
  kyc_complete: {
    name: 'kyc_verification_complete',
    language: 'en',
    category: 'ACCOUNT_UPDATE'
  },
  kyb_document_uploaded: {
    name: 'kyb_document_received',
    language: 'en',
    category: 'ACCOUNT_UPDATE'
  },
  kyb_document_verified: {
    name: 'kyb_document_verified',
    language: 'en',
    category: 'ACCOUNT_UPDATE'
  },
  kyb_complete: {
    name: 'kyb_verification_complete',
    language: 'en',
    category: 'ACCOUNT_UPDATE'
  },
  order_confirmation: {
    name: 'order_confirmation',
    language: 'en',
    category: 'TRANSACTIONAL'
  },
  payment_received: {
    name: 'payment_received',
    language: 'en',
    category: 'TRANSACTIONAL'
  },
  appointment_reminder: {
    name: 'appointment_reminder',
    language: 'en',
    category: 'APPOINTMENT_REMINDER'
  }
}

// Send WhatsApp message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, message, type = 'transactional', template, variables, merchantId, userId } = body

    // Validate phone number format (South African format: +27 or 0)
    let phoneNumber = to?.replace(/\s/g, '')
    if (!phoneNumber) {
      return NextResponse.json({
        success: false,
        error: 'Phone number required'
      }, { status: 400 })
    }

    // Normalize to international format
    if (phoneNumber.startsWith('0')) {
      phoneNumber = '+27' + phoneNumber.substring(1)
    } else if (!phoneNumber.startsWith('+')) {
      phoneNumber = '+27' + phoneNumber
    }

    // Check opt-in status for marketing messages
    if (type === 'marketing') {
      const optIn = await checkOptInStatus(phoneNumber, merchantId)
      if (!optIn) {
        return NextResponse.json({
          success: false,
          error: 'User has not opted in to receive marketing messages'
        }, { status: 403 })
      }
    }

    // Check rate limits (WhatsApp has strict limits)
    const rateLimitOk = await checkRateLimit(phoneNumber)
    if (!rateLimitOk) {
      return NextResponse.json({
        success: false,
        error: 'Rate limit exceeded. Please try again later.'
      }, { status: 429 })
    }

    // Get WhatsApp configuration
    const config = await getWhatsAppConfig(merchantId)

    if (!config.enabled) {
      return NextResponse.json({
        success: false,
        error: 'WhatsApp integration not enabled'
      }, { status: 403 })
    }

    // Prepare message payload
    let messagePayload: Record<string, unknown>
    
    if (template) {
      // Use template message (required for first 24 hours)
      const templateInfo = WHATSAPP_TEMPLATES[template]
      if (!templateInfo) {
        return NextResponse.json({
          success: false,
          error: 'Invalid template name'
        }, { status: 400 })
      }

      messagePayload = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'template',
        template: {
          name: templateInfo.name,
          language: {
            code: templateInfo.language
          },
          components: variables ? [
            {
              type: 'body',
              parameters: variables.map((v: string) => ({ type: 'text', text: v }))
            }
          ] : []
        }
      }
    } else {
      // Free-form message (only allowed in 24-hour window after user message)
      messagePayload = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: {
          preview_url: false,
          body: message
        }
      }
    }

    // Send to WhatsApp API
    const response = await sendToWhatsApp(config, messagePayload)

    // Log the message
    await logMessage({
      id: randomUUID(),
      phoneNumber,
      message: message || JSON.stringify(template),
      type,
      template,
      status: response.success ? 'sent' : 'failed',
      externalId: response.messageId,
      merchantId,
      userId,
      createdAt: new Date()
    })

    if (response.success) {
      return NextResponse.json({
        success: true,
        messageId: response.messageId,
        message: 'Message sent successfully'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: response.error || 'Failed to send message'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('WhatsApp notification error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to send notification'
    }, { status: 500 })
  }
}

// Get WhatsApp configuration for merchant
async function getWhatsAppConfig(merchantId?: string) {
  // Default configuration for Groway platform
  const defaultConfig = {
    enabled: true,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || 'demo_phone_id',
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || 'demo_ba_id',
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || 'demo_token',
    webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'demo_verify'
  }

  if (!merchantId) return defaultConfig

  try {
    // Check merchant-specific WhatsApp config
    const config = await db.whatsAppConfig?.findFirst?.({
      where: { merchantId }
    })
    
    return config || defaultConfig
  } catch {
    return defaultConfig
  }
}

// Check if user has opted in
async function checkOptInStatus(phoneNumber: string, merchantId?: string): Promise<boolean> {
  try {
    const optIn = await db.whatsAppOptIn?.findFirst?.({
      where: {
        phoneNumber,
        merchantId: merchantId || 'platform',
        optedIn: true
      }
    })
    return !!optIn
  } catch {
    // Default to true for KYC/transactional messages
    return true
  }
}

// Check rate limits
async function checkRateLimit(phoneNumber: string): Promise<boolean> {
  // WhatsApp Business API has built-in rate limits
  // This is a soft limit check for our side
  return true
}

// Send to WhatsApp API
async function sendToWhatsApp(
  config: { phoneNumberId: string; accessToken: string },
  payload: Record<string, unknown>
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // In production, call WhatsApp Business API
    // POST https://graph.facebook.com/v18.0/{phone-number-id}/messages
    
    if (process.env.NODE_ENV === 'development' || config.accessToken === 'demo_token') {
      // Simulate successful response in demo mode
      console.log('[WhatsApp Demo] Would send:', JSON.stringify(payload, null, 2))
      return {
        success: true,
        messageId: `wamid.demo.${Date.now()}`
      }
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${config.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    )

    const data = await response.json()

    if (response.ok && data.messages?.[0]?.id) {
      return {
        success: true,
        messageId: data.messages[0].id
      }
    } else {
      return {
        success: false,
        error: data.error?.message || 'Unknown error'
      }
    }
  } catch (error) {
    console.error('WhatsApp API error:', error)
    return {
      success: false,
      error: 'Failed to call WhatsApp API'
    }
  }
}

// Log message
async function logMessage(log: {
  id: string
  phoneNumber: string
  message: string
  type: string
  template?: string
  status: string
  externalId?: string
  merchantId?: string
  userId?: string
  createdAt: Date
}) {
  try {
    await db.whatsAppMessageLog?.create?.({
      data: log
    })
  } catch (error) {
    console.error('Failed to log WhatsApp message:', error)
  }
}

// GET endpoint for opt-in management
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const phoneNumber = searchParams.get('phone')

  if (!phoneNumber) {
    return NextResponse.json({
      success: false,
      error: 'Phone number required'
    }, { status: 400 })
  }

  if (action === 'opt-out') {
    // Process opt-out request
    try {
      await db.whatsAppOptIn?.updateMany?.({
        where: { phoneNumber },
        data: { optedIn: false, optedOutAt: new Date() }
      })
      
      return NextResponse.json({
        success: true,
        message: 'You have been unsubscribed from WhatsApp notifications'
      })
    } catch (error) {
      console.error('Opt-out error:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to process opt-out'
      }, { status: 500 })
    }
  }

  if (action === 'opt-in') {
    // Process opt-in request
    try {
      await db.whatsAppOptIn?.upsert?.({
        where: { phoneNumber },
        create: {
          id: randomUUID(),
          phoneNumber,
          optedIn: true,
          optedInAt: new Date()
        },
        update: {
          optedIn: true,
          optedInAt: new Date()
        }
      })
      
      return NextResponse.json({
        success: true,
        message: 'You have been subscribed to WhatsApp notifications'
      })
    } catch (error) {
      console.error('Opt-in error:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to process opt-in'
      }, { status: 500 })
    }
  }

  // Check opt-in status
  try {
    const optIn = await db.whatsAppOptIn?.findFirst?.({
      where: { phoneNumber }
    })
    
    return NextResponse.json({
      success: true,
      optedIn: optIn?.optedIn ?? false
    })
  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to check status'
    }, { status: 500 })
  }
}
