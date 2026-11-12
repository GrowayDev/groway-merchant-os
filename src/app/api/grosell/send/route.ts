/**
 * GroSell Send Message API
 * 
 * Sends WhatsApp messages to customers
 * Uses mock implementation, ready for WhatsApp Business API
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      merchantId, 
      customerPhone, 
      message, 
      messageType = 'text',
      mediaUrl,
      templateCode,
      templateParams 
    } = body

    if (!merchantId || !customerPhone || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: merchantId, customerPhone, message' },
        { status: 400 }
      )
    }

    // Get or create conversation
    let conversation = await db.groSellConversation.findFirst({
      where: { merchantId, customerPhone }
    })

    if (!conversation) {
      conversation = await db.groSellConversation.create({
        data: {
          id: `gsc_${nanoid(12)}`,
          merchantId,
          customerPhone,
          status: 'active',
          updatedAt: new Date()
        }
      })
    }

    // Queue message for sending
    const queuedMessage = await db.groSellMessageQueue.create({
      data: {
        id: `gsq_${nanoid(12)}`,
        merchantId,
        conversationId: conversation.id,
        customerPhone,
        messageContent: message,
        messageType,
        mediaUrl,
        templateCode,
        templateParams: templateParams ? JSON.stringify(templateParams) : null,
        status: 'queued',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    // In production, this would call WhatsApp Business API
    // For now, simulate sending
    const mockWhatsappMessageId = `wamid.${nanoid(20)}`
    
    // Simulate immediate delivery (mock)
    await db.groSellMessageQueue.update({
      where: { id: queuedMessage.id },
      data: {
        status: 'sent',
        whatsappMessageId: mockWhatsappMessageId,
        processedAt: new Date(),
        updatedAt: new Date()
      }
    })

    // Store message in conversation
    await db.groSellMessage.create({
      data: {
        id: `gsm_${nanoid(12)}`,
        conversationId: conversation.id,
        direction: 'outbound',
        messageType,
        content: message,
        mediaUrl,
        templateCode,
        templateParams: templateParams ? JSON.stringify(templateParams) : null,
        status: 'sent',
        whatsappMessageId: mockWhatsappMessageId,
        sentAt: new Date(),
        createdAt: new Date()
      }
    })

    // Update conversation
    await db.groSellConversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        lastMessageText: message,
        lastMessageFrom: 'merchant',
        messageCount: { increment: 1 },
        updatedAt: new Date()
      }
    })

    // Log analytics
    await db.groSellAnalyticsEvent.create({
      data: {
        id: `gsa_${nanoid(12)}`,
        merchantId,
        eventType: 'message_sent',
        conversationId: conversation.id,
        customerPhone,
        createdAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      messageId: queuedMessage.id,
      whatsappMessageId: mockWhatsappMessageId,
      conversationId: conversation.id
    })
  } catch (error) {
    console.error('GroSell send error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}

// Get queued messages for a merchant
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const merchantId = searchParams.get('merchantId')
    const status = searchParams.get('status') || 'queued'

    if (!merchantId) {
      return NextResponse.json(
        { error: 'Missing merchantId' },
        { status: 400 }
      )
    }

    const messages = await db.groSellMessageQueue.findMany({
      where: { merchantId, status },
      orderBy: { createdAt: 'asc' },
      take: 50
    })

    return NextResponse.json({
      success: true,
      messages,
      count: messages.length
    })
  } catch (error) {
    console.error('GroSell get messages error:', error)
    return NextResponse.json(
      { error: 'Failed to get messages' },
      { status: 500 }
    )
  }
}
