/**
 * GroSell Webhook - WhatsApp Business API Integration
 * 
 * Handles incoming messages from WhatsApp Business API
 * Currently uses mock data, ready for real integration
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

// Verify webhook (GET request from WhatsApp)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  // Verify token (in production, use environment variable)
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'grosell_verify_token_2024'

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
}

// Handle incoming messages (POST request from WhatsApp)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Parse WhatsApp webhook payload
    const entry = body.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value

    // Handle different webhook events
    if (value?.messages) {
      const message = value.messages[0]
      const from = message.from // Customer phone number
      const messageId = message.id
      const messageType = message.type
      const timestamp = new Date(parseInt(message.timestamp) * 1000)

      // Extract message content based on type
      let content = ''
      let mediaUrl = null

      switch (messageType) {
        case 'text':
          content = message.text?.body || ''
          break
        case 'image':
          content = message.image?.caption || ''
          mediaUrl = message.image?.id
          break
        case 'interactive':
          content = message.interactive?.button_reply?.title ||
            message.interactive?.list_reply?.title || ''
          break
      }

      // Get or create conversation
      const merchantId = value.metadata?.phone_number_id || 'demo_merchant'
      
      let conversation = await db.groSellConversation.findFirst({
        where: { merchantId, customerPhone: from }
      })

      if (!conversation) {
        conversation = await db.groSellConversation.create({
          data: {
            id: `gsc_${nanoid(12)}`,
            merchantId,
            customerPhone: from,
            status: 'active',
            updatedAt: new Date()
          }
        })
      }

      // Store message
      await db.groSellMessage.create({
        data: {
          id: `gsm_${nanoid(12)}`,
          conversationId: conversation.id,
          direction: 'inbound',
          messageType,
          content,
          mediaUrl,
          status: 'delivered',
          whatsappMessageId: messageId,
          sentAt: timestamp,
          createdAt: new Date()
        }
      })

      // Update conversation
      await db.groSellConversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: timestamp,
          lastMessageText: content,
          lastMessageFrom: 'customer',
          messageCount: { increment: 1 },
          updatedAt: new Date()
        }
      })

      // Log analytics event
      await db.groSellAnalyticsEvent.create({
        data: {
          id: `gsa_${nanoid(12)}`,
          merchantId,
          eventType: 'message_received',
          conversationId: conversation.id,
          customerPhone: from,
          createdAt: new Date()
        }
      })

      // Process message through flow engine (mock for now)
      // In production, this would trigger the AI/Flow engine
      const autoResponse = await generateAutoResponse(conversation, content, messageType)

      if (autoResponse) {
        // Queue response message
        await db.groSellMessageQueue.create({
          data: {
            id: `gsq_${nanoid(12)}`,
            merchantId,
            conversationId: conversation.id,
            customerPhone: from,
            messageContent: autoResponse,
            messageType: 'text',
            status: 'queued',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })
      }

      return NextResponse.json({ success: true, messageId })
    }

    // Handle status updates
    if (value?.statuses) {
      const status = value.statuses[0]
      const messageId = status.id
      const statusType = status.status

      // Update message status
      await db.groSellMessage.updateMany({
        where: { whatsappMessageId: messageId },
        data: {
          status: statusType,
          deliveredAt: statusType === 'delivered' ? new Date() : undefined,
          readAt: statusType === 'read' ? new Date() : undefined
        }
      })

      return NextResponse.json({ success: true, status: statusType })
    }

    return NextResponse.json({ success: true, message: 'Webhook received' })
  } catch (error) {
    console.error('GroSell webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Generate auto-response based on conversation state
async function generateAutoResponse(
  conversation: any,
  content: string,
  messageType: string
): Promise<string | null> {
  const lowerContent = content.toLowerCase()

  // Mock flow responses - in production this would use AI/Flow engine
  if (lowerContent.includes('hi') || lowerContent.includes('hello') || lowerContent === 'start') {
    return `Welcome! 👋

I'm here to help you shop. You can:

1️⃣ View our catalogue
2️⃣ Place an order
3️⃣ Check order status
4️⃣ Apply for BNPL (Buy Now, Pay Later)

Reply with a number or tell me what you need!`
  }

  if (lowerContent.includes('catalogue') || lowerContent.includes('1')) {
    return `📋 **Our Catalogue**

Here are our popular categories:

• Fresh Produce
• Groceries
• Beverages
• Household Items

Reply with a category name to browse items, or type "search [item]" to find specific products.`
  }

  if (lowerContent.includes('bnpl') || lowerContent.includes('4')) {
    return `💳 **Buy Now, Pay Later (BNPL)**

Split your purchase into 2 interest-free installments!

Example: Buy R500 worth of goods
• Pay R250 now
• Pay R250 in 2 weeks

*SASSA beneficiaries get flexible payment dates aligned to grant payment days!*

Reply "apply bnpl" to apply or "bnpl info" for more details.`
  }

  // Default acknowledgment
  return `Thanks for your message! Our team will respond shortly.

In the meantime:
• Type "catalogue" to browse products
• Type "order" to check your orders
• Type "bnpl" for payment options`
}
