import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getAuthContext, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-context'

const prisma = new PrismaClient()

// GET /api/merchant-os/whatsapp - Get WhatsApp configuration and messages
// Security: Requires authentication. merchantId must match authenticated user's merchant.
export async function GET(request: NextRequest) {
  // Authentication check
  const context = await getAuthContext(request)
  if (!context) {
    return unauthorizedResponse('Authentication required')
  }

  try {
    const { searchParams } = new URL(request.url)
    const queryMerchantId = searchParams.get('merchantId')
    const type = searchParams.get('type') || 'config'
    
    // Security: Validate merchantId
    let merchantId: string
    if ('merchantId' in context) {
      if (queryMerchantId && queryMerchantId !== context.merchantId) {
        if (context.role !== 'platform_admin' && context.role !== 'super_admin') {
          return forbiddenResponse('Access denied to this merchant')
        }
        merchantId = queryMerchantId
      } else {
        merchantId = context.merchantId
      }
    } else {
      if (!queryMerchantId) {
        return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
      }
      merchantId = queryMerchantId
    }
    
    switch (type) {
      case 'config':
        const config = await prisma.whatsAppConfig.findUnique({
          where: { merchantId },
          include: {
            templates: { where: { status: 'approved' } },
          },
        })
        return NextResponse.json({ config })
        
      case 'messages':
        const messages = await prisma.whatsAppMessage.findMany({
          where: { config: { merchantId } },
          orderBy: { createdAt: 'desc' },
          take: 100,
        })
        return NextResponse.json({ messages })
        
      case 'templates':
        const templates = await prisma.whatsAppTemplate.findMany({
          where: { config: { merchantId } },
        })
        return NextResponse.json({ templates })
        
      case 'stats':
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const stats = await prisma.whatsAppMessage.groupBy({
          by: ['status', 'direction'],
          where: {
            config: { merchantId },
            createdAt: { gte: today },
          },
          _count: true,
        })
        
        return NextResponse.json({ stats })
        
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error fetching WhatsApp data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch WhatsApp data' },
      { status: 500 }
    )
  }
}

// POST /api/merchant-os/whatsapp - Send message or configure
// Security: Requires authentication. merchantId must match authenticated user's merchant.
export async function POST(request: NextRequest) {
  // Authentication check
  const context = await getAuthContext(request)
  if (!context) {
    return unauthorizedResponse('Authentication required')
  }

  try {
    const body = await request.json()
    const { action, merchantId: bodyMerchantId } = body
    
    // Security: Validate merchantId
    let merchantId: string
    if ('merchantId' in context) {
      if (bodyMerchantId && bodyMerchantId !== context.merchantId) {
        if (context.role !== 'platform_admin' && context.role !== 'super_admin') {
          return forbiddenResponse('Access denied to this merchant')
        }
        merchantId = bodyMerchantId
      } else {
        merchantId = context.merchantId
      }
    } else {
      if (!bodyMerchantId) {
        return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
      }
      merchantId = bodyMerchantId
    }
    
    switch (action) {
      case 'configure':
        return await configureWhatsApp(body, merchantId)
      case 'send':
        return await sendWhatsAppMessage(body, merchantId)
      case 'template':
        return await createTemplate(body, merchantId)
      case 'verify':
        return await verifyWebhook(body, merchantId)
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error processing WhatsApp request:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

// Configure WhatsApp Business
async function configureWhatsApp(body: any, merchantId: string) {
  const { phoneNumber, phoneNumberId, businessAccountId, accessToken } = body
  
  // Upsert configuration
  const config = await prisma.whatsAppConfig.upsert({
    where: { merchantId },
    update: {
      phoneNumber,
      phoneNumberId,
      businessAccountId,
      accessToken,
      status: 'active',
    },
    create: {
      merchantId,
      phoneNumber,
      phoneNumberId,
      businessAccountId,
      accessToken,
      status: 'active',
    },
  })
  
  return NextResponse.json({ 
    success: true, 
    config: {
      ...config,
      accessToken: '***hidden***', // Don't return the actual token
    }
  })
}

// Send WhatsApp message
async function sendWhatsAppMessage(body: any, merchantId: string) {
  const { to, message, messageType, templateName, templateLanguage, customerId } = body
  
  // Get config
  const config = await prisma.whatsAppConfig.findUnique({
    where: { merchantId },
  })
  
  if (!config) {
    return NextResponse.json({ error: 'WhatsApp not configured' }, { status: 400 })
  }
  
  // Check rate limits
  if (config.messagesSentToday >= config.dailyMessageLimit) {
    return NextResponse.json({ 
      error: 'Daily message limit reached',
      limit: config.dailyMessageLimit,
    }, { status: 429 })
  }
  
  // Create message record
  const messageRecord = await prisma.whatsAppMessage.create({
    data: {
      configId: config.id,
      toNumber: to,
      customerId,
      messageType: messageType || 'text',
      content: JSON.stringify(message),
      templateName,
      templateLanguage,
      status: 'pending',
    },
  })
  
  try {
    // Simulate sending via WhatsApp API
    const result = await sendViaWhatsAppAPI(config, {
      to,
      type: messageType,
      text: message,
      template: templateName ? { name: templateName, language: templateLanguage } : undefined,
    })
    
    // Update message status
    await prisma.whatsAppMessage.update({
      where: { id: messageRecord.id },
      data: {
        status: 'sent',
        whatsappMessageId: result.messageId,
        sentAt: new Date(),
      },
    })
    
    // Increment daily counter
    await prisma.whatsAppConfig.update({
      where: { id: config.id },
      data: {
        messagesSentToday: { increment: 1 },
      },
    })
    
    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      status: 'sent',
    })
  } catch (error) {
    // Update as failed
    await prisma.whatsAppMessage.update({
      where: { id: messageRecord.id },
      data: {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    })
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send message',
    }, { status: 500 })
  }
}

// Simulate WhatsApp API call
async function sendViaWhatsAppAPI(config: any, message: any) {
  // In production, this would call the actual WhatsApp Business API
  // POST to https://graph.facebook.com/v18.0/{phone-number-id}/messages
  
  await new Promise(resolve => setTimeout(resolve, 200))
  
  return {
    messageId: `wamid.${Date.now()}`,
    status: 'sent',
  }
}

// Create message template
async function createTemplate(body: any, merchantId: string) {
  const { name, language, category, bodyText, headerText, footerText, buttons } = body
  
  const config = await prisma.whatsAppConfig.findUnique({
    where: { merchantId },
  })
  
  if (!config) {
    return NextResponse.json({ error: 'WhatsApp not configured' }, { status: 400 })
  }
  
  const template = await prisma.whatsAppTemplate.create({
    data: {
      configId: config.id,
      name,
      language: language || 'en',
      category: category || 'utility',
      bodyText,
      headerText,
      footerText,
      buttons: buttons ? JSON.stringify(buttons) : null,
      status: 'pending', // Needs WhatsApp approval
    },
  })
  
  // In production, submit to WhatsApp for approval
  // POST to https://graph.facebook.com/v18.0/{business-account-id}/message_templates
  
  return NextResponse.json({ 
    success: true, 
    template,
    note: 'Template submitted for WhatsApp approval',
  })
}

// Verify webhook
async function verifyWebhook(body: any, merchantId: string) {
  const { verifyToken } = body
  
  const config = await prisma.whatsAppConfig.findUnique({
    where: { merchantId },
  })
  
  if (!config) {
    return NextResponse.json({ error: 'WhatsApp not configured' }, { status: 400 })
  }
  
  // Generate verify token if not set
  const newVerifyToken = verifyToken || `verify_${Math.random().toString(36).substr(2, 16)}`
  
  const updatedConfig = await prisma.whatsAppConfig.update({
    where: { id: config.id },
    data: {
      webhookVerifyToken: newVerifyToken,
      webhookUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/merchant-os/whatsapp/webhook`,
    },
  })
  
  return NextResponse.json({
    success: true,
    webhookUrl: updatedConfig.webhookUrl,
    verifyToken: newVerifyToken,
    instructions: 'Configure this URL and token in your WhatsApp Business Manager',
  })
}
