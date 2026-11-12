import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/whatsapp/messages/[id] - Get a single WhatsApp message
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const message = await db.whatsAppMessage.findUnique({
      where: { id },
      include: {
        config: {
          select: {
            id: true,
            phoneNumber: true,
            merchantId: true,
            status: true
          }
        }
      }
    })

    if (!message) {
      return NextResponse.json({ error: 'WhatsApp message not found' }, { status: 404 })
    }

    // Parse content for display
    let parsedContent
    try {
      parsedContent = JSON.parse(message.content)
    } catch {
      parsedContent = message.content
    }

    return NextResponse.json({ 
      message: {
        ...message,
        parsedContent
      }
    })
  } catch (error) {
    console.error('Error fetching WhatsApp message:', error)
    return NextResponse.json({ error: 'Failed to fetch WhatsApp message' }, { status: 500 })
  }
}
