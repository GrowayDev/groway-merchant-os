import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// Valid status values
const VALID_STATUSES = ['pending', 'active', 'error'] as const

// GET /api/whatsapp/config/[id] - Get a single WhatsApp configuration
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const config = await db.whatsAppConfig.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 20
        },
        templates: {
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { messages: true, templates: true }
        }
      }
    })

    if (!config) {
      return NextResponse.json({ error: 'WhatsApp configuration not found' }, { status: 404 })
    }

    // Mask sensitive data in response
    const sanitizedConfig = {
      ...config,
      accessToken: config.accessToken ? '***MASKED***' : null,
      permanentToken: config.permanentToken ? '***MASKED***' : null
    }

    return NextResponse.json({ config: sanitizedConfig })
  } catch (error) {
    console.error('Error fetching WhatsApp config:', error)
    return NextResponse.json({ error: 'Failed to fetch WhatsApp configuration' }, { status: 500 })
  }
}

// PUT /api/whatsapp/config/[id] - Update a WhatsApp configuration
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check if config exists
    const existingConfig = await db.whatsAppConfig.findUnique({
      where: { id }
    })

    if (!existingConfig) {
      return NextResponse.json({ error: 'WhatsApp configuration not found' }, { status: 404 })
    }

    // Validate status if provided
    if (body.status && !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status. Must be one of: pending, active, error' }, { status: 400 })
    }

    // If phone number is being changed, check for duplicates
    if (body.phoneNumber && body.phoneNumber !== existingConfig.phoneNumber) {
      const phoneExists = await db.whatsAppConfig.findUnique({
        where: { phoneNumber: body.phoneNumber }
      })
      if (phoneExists) {
        return NextResponse.json({ error: 'Phone number is already registered' }, { status: 400 })
      }
    }

    // Build update data
    const updateData: Prisma.WhatsAppConfigUpdateInput = {}
    
    if (body.phoneNumber !== undefined) updateData.phoneNumber = body.phoneNumber
    if (body.phoneNumberId !== undefined) updateData.phoneNumberId = body.phoneNumberId
    if (body.businessAccountId !== undefined) updateData.businessAccountId = body.businessAccountId
    if (body.accessToken !== undefined) updateData.accessToken = body.accessToken
    if (body.permanentToken !== undefined) updateData.permanentToken = body.permanentToken
    if (body.status !== undefined) updateData.status = body.status
    if (body.webhookVerifyToken !== undefined) updateData.webhookVerifyToken = body.webhookVerifyToken
    if (body.webhookUrl !== undefined) updateData.webhookUrl = body.webhookUrl
    if (body.autoReply !== undefined) updateData.autoReply = body.autoReply
    if (body.autoReplyMessage !== undefined) updateData.autoReplyMessage = body.autoReplyMessage
    if (body.businessHoursOnly !== undefined) updateData.businessHoursOnly = body.businessHoursOnly
    if (body.dailyMessageLimit !== undefined) updateData.dailyMessageLimit = body.dailyMessageLimit
    if (body.messagesSentToday !== undefined) updateData.messagesSentToday = body.messagesSentToday

    const config = await db.whatsAppConfig.update({
      where: { id },
      data: updateData
    })

    // Mask sensitive data in response
    const sanitizedConfig = {
      ...config,
      accessToken: config.accessToken ? '***MASKED***' : null,
      permanentToken: config.permanentToken ? '***MASKED***' : null
    }

    return NextResponse.json({ config: sanitizedConfig })
  } catch (error) {
    console.error('Error updating WhatsApp config:', error)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({ error: 'Duplicate entry. Phone number already registered' }, { status: 400 })
      }
    }
    return NextResponse.json({ error: 'Failed to update WhatsApp configuration' }, { status: 500 })
  }
}

// DELETE /api/whatsapp/config/[id] - Delete a WhatsApp configuration
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if config exists
    const existingConfig = await db.whatsAppConfig.findUnique({
      where: { id },
      include: {
        _count: {
          select: { messages: true, templates: true }
        }
      }
    })

    if (!existingConfig) {
      return NextResponse.json({ error: 'WhatsApp configuration not found' }, { status: 404 })
    }

    // Delete associated messages and templates first (cascade)
    await db.whatsAppMessage.deleteMany({
      where: { configId: id }
    })

    await db.whatsAppTemplate.deleteMany({
      where: { configId: id }
    })

    // Delete the config
    await db.whatsAppConfig.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'WhatsApp configuration deleted successfully' })
  } catch (error) {
    console.error('Error deleting WhatsApp config:', error)
    return NextResponse.json({ error: 'Failed to delete WhatsApp configuration' }, { status: 500 })
  }
}
