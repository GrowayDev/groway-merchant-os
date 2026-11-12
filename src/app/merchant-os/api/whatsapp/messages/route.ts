import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// Valid message types
const VALID_MESSAGE_TYPES = ['text', 'template', 'image', 'document'] as const

// Valid message statuses
const VALID_STATUSES = ['pending', 'sent', 'delivered', 'read', 'failed'] as const

// Valid directions
const VALID_DIRECTIONS = ['inbound', 'outbound'] as const

// GET /api/whatsapp/messages - List all WhatsApp messages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const configId = searchParams.get('configId')
    const status = searchParams.get('status')
    const direction = searchParams.get('direction')
    const messageType = searchParams.get('messageType')
    const customerId = searchParams.get('customerId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: Prisma.WhatsAppMessageWhereInput = {}
    
    if (configId) {
      where.configId = configId
    }
    if (status && VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
      where.status = status
    }
    if (direction && VALID_DIRECTIONS.includes(direction as typeof VALID_DIRECTIONS[number])) {
      where.direction = direction
    }
    if (messageType && VALID_MESSAGE_TYPES.includes(messageType as typeof VALID_MESSAGE_TYPES[number])) {
      where.messageType = messageType
    }
    if (customerId) {
      where.customerId = customerId
    }

    const [messages, total] = await Promise.all([
      db.whatsAppMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          config: {
            select: {
              phoneNumber: true,
              merchantId: true
            }
          }
        }
      }),
      db.whatsAppMessage.count({ where })
    ])

    return NextResponse.json({ 
      messages,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('Error fetching WhatsApp messages:', error)
    return NextResponse.json({ error: 'Failed to fetch WhatsApp messages' }, { status: 500 })
  }
}

// POST /api/whatsapp/messages - Send a new WhatsApp message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.configId) {
      return NextResponse.json({ error: 'configId is required' }, { status: 400 })
    }
    if (!body.toNumber) {
      return NextResponse.json({ error: 'toNumber is required' }, { status: 400 })
    }
    if (!body.messageType) {
      return NextResponse.json({ error: 'messageType is required' }, { status: 400 })
    }

    // Validate message type
    if (!VALID_MESSAGE_TYPES.includes(body.messageType)) {
      return NextResponse.json({ 
        error: `Invalid messageType. Must be one of: ${VALID_MESSAGE_TYPES.join(', ')}` 
      }, { status: 400 })
    }

    // Get the WhatsApp config
    const config = await db.whatsAppConfig.findUnique({
      where: { id: body.configId }
    })

    if (!config) {
      return NextResponse.json({ error: 'WhatsApp configuration not found' }, { status: 404 })
    }

    // Check if config is active
    if (config.status !== 'active') {
      return NextResponse.json({ error: 'WhatsApp configuration is not active' }, { status: 400 })
    }

    // Check daily message limit
    if (config.messagesSentToday >= config.dailyMessageLimit) {
      return NextResponse.json({ error: 'Daily message limit reached' }, { status: 400 })
    }

    // Validate content based on message type
    let content = body.content
    if (body.messageType === 'text') {
      if (!content || typeof content !== 'string') {
        return NextResponse.json({ error: 'content is required for text messages' }, { status: 400 })
      }
      // Store as JSON string for consistency
      content = JSON.stringify({ text: content })
    } else if (body.messageType === 'template') {
      if (!body.templateName) {
        return NextResponse.json({ error: 'templateName is required for template messages' }, { status: 400 })
      }
      // Validate template exists and is approved
      const template = await db.whatsAppTemplate.findFirst({
        where: {
          configId: body.configId,
          name: body.templateName,
          language: body.templateLanguage || 'en',
          status: 'approved'
        }
      })
      if (!template) {
        return NextResponse.json({ error: 'Template not found or not approved' }, { status: 400 })
      }
      // Build template content
      content = JSON.stringify({
        templateName: body.templateName,
        language: body.templateLanguage || 'en',
        components: body.components || []
      })
    } else if (body.messageType === 'image') {
      if (!body.mediaUrl) {
        return NextResponse.json({ error: 'mediaUrl is required for image messages' }, { status: 400 })
      }
      content = JSON.stringify({
        mediaUrl: body.mediaUrl,
        caption: body.caption
      })
    } else if (body.messageType === 'document') {
      if (!body.mediaUrl) {
        return NextResponse.json({ error: 'mediaUrl is required for document messages' }, { status: 400 })
      }
      content = JSON.stringify({
        mediaUrl: body.mediaUrl,
        filename: body.filename,
        caption: body.caption
      })
    }

    // Create the message
    const message = await db.whatsAppMessage.create({
      data: {
        configId: body.configId,
        toNumber: body.toNumber,
        customerId: body.customerId,
        messageType: body.messageType,
        content,
        templateName: body.templateName,
        templateLanguage: body.templateLanguage || 'en',
        status: 'pending',
        direction: 'outbound'
      }
    })

    // Increment daily message count
    await db.whatsAppConfig.update({
      where: { id: body.configId },
      data: { 
        messagesSentToday: { increment: 1 }
      }
    })

    // In a real implementation, you would call the WhatsApp API here
    // For now, we'll simulate a successful send
    const whatsappMessageId = `wamid.${Date.now()}`
    
    const updatedMessage = await db.whatsAppMessage.update({
      where: { id: message.id },
      data: {
        status: 'sent',
        whatsappMessageId,
        sentAt: new Date()
      }
    })

    return NextResponse.json({ 
      message: updatedMessage,
      whatsappMessageId 
    }, { status: 201 })
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    return NextResponse.json({ error: 'Failed to send WhatsApp message' }, { status: 500 })
  }
}
