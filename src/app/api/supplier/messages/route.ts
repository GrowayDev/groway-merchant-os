import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/supplier/messages - Get supplier conversations/messages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get('supplierId')
    const conversationId = searchParams.get('conversationId')
    const buyerId = searchParams.get('buyerId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!supplierId) {
      return NextResponse.json({ error: 'Supplier ID is required' }, { status: 400 })
    }

    // If conversationId is provided, get messages for that conversation
    if (conversationId) {
      const conversation = await db.supplierConversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset
          },
          dispute: true
        }
      })

      if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
      }

      // Mark messages as read
      await db.supplierMessage.updateMany({
        where: {
          conversationId,
          senderType: 'buyer',
          read: false
        },
        data: {
          read: true,
          readAt: new Date()
        }
      })

      return NextResponse.json({ conversation })
    }

    // Otherwise, get all conversations for this supplier
    const where: any = { supplierId }

    if (buyerId) {
      where.buyerId = buyerId
    }

    if (status) {
      where.status = status
    }

    const [conversations, total] = await Promise.all([
      db.supplierConversation.findMany({
        where,
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          dispute: {
            select: { number: true, type: true, status: true }
          }
        },
        orderBy: { lastMessageAt: 'desc' },
        take: limit,
        skip: offset
      }),
      db.supplierConversation.count({ where })
    ])

    // Get unread counts
    const unreadCounts = await db.supplierMessage.groupBy({
      by: ['conversationId'],
      where: {
        conversation: { supplierId },
        senderType: 'buyer',
        read: false
      },
      _count: true
    })

    const unreadMap = Object.fromEntries(
      unreadCounts.map((uc: any) => [uc.conversationId, uc._count])
    )

    // Stats
    const stats = {
      total,
      open: await db.supplierConversation.count({ where: { supplierId, status: 'open' } }),
      closed: await db.supplierConversation.count({ where: { supplierId, status: 'closed' } }),
      unread: await db.supplierMessage.count({
        where: {
          conversation: { supplierId },
          senderType: 'buyer',
          read: false
        }
      })
    }

    return NextResponse.json({
      conversations: conversations.map((c: any) => ({
        ...c,
        unreadCount: unreadMap[c.id] || 0,
        lastMessage: c.messages?.[0] || null
      })),
      total,
      stats
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

// POST /api/supplier/messages - Send a message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { supplierId, conversationId, buyerId, buyerName, content, attachments, subject, disputeId, poId, invoiceId } = body

    let conversation

    // If conversationId provided, use existing conversation
    if (conversationId) {
      conversation = await db.supplierConversation.findUnique({
        where: { id: conversationId }
      })

      if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
      }
    } else {
      // Create new conversation
      conversation = await db.supplierConversation.create({
        data: {
          supplierId,
          buyerId,
          buyerName,
          subject,
          disputeId,
          poId,
          invoiceId,
          status: 'open'
        }
      })
    }

    // Create message
    const message = await db.supplierMessage.create({
      data: {
        conversationId: conversation.id,
        senderType: 'supplier',
        senderId: supplierId,
        senderName: 'Supplier',
        content,
        attachments: attachments ? JSON.stringify(attachments) : null
      }
    })

    // Update conversation lastMessageAt
    await db.supplierConversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() }
    })

    return NextResponse.json({ message, conversation })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}

// PUT /api/supplier/messages - Update conversation/message
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { conversationId, action } = body

    const conversation = await db.supplierConversation.findUnique({
      where: { id: conversationId }
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    let updateData: any = {}

    switch (action) {
      case 'close':
        updateData.status = 'closed'
        break

      case 'reopen':
        updateData.status = 'open'
        break

      case 'mark_read':
        await db.supplierMessage.updateMany({
          where: {
            conversationId,
            senderType: 'buyer',
            read: false
          },
          data: {
            read: true,
            readAt: new Date()
          }
        })
        break
    }

    const updated = await db.supplierConversation.update({
      where: { id: conversationId },
      data: updateData,
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 50 }
      }
    })

    return NextResponse.json({ conversation: updated })
  } catch (error) {
    console.error('Error updating conversation:', error)
    return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 })
  }
}
