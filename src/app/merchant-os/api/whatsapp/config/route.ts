import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// Valid status values
const VALID_STATUSES = ['pending', 'active', 'error'] as const

// GET /api/whatsapp/config - List all WhatsApp configurations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const status = searchParams.get('status')

    const where: Prisma.WhatsAppConfigWhereInput = {}
    
    if (merchantId) {
      where.merchantId = merchantId
    }
    if (status && VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
      where.status = status
    }

    const configs = await db.whatsAppConfig.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { messages: true, templates: true }
        }
      }
    })

    // Mask sensitive data in response
    const sanitizedConfigs = configs.map(config => ({
      ...config,
      accessToken: config.accessToken ? '***MASKED***' : null,
      permanentToken: config.permanentToken ? '***MASKED***' : null
    }))

    return NextResponse.json({ configs: sanitizedConfigs })
  } catch (error) {
    console.error('Error fetching WhatsApp configs:', error)
    return NextResponse.json({ error: 'Failed to fetch WhatsApp configurations' }, { status: 500 })
  }
}

// POST /api/whatsapp/config - Create a new WhatsApp configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.merchantId) {
      return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
    }
    if (!body.phoneNumber) {
      return NextResponse.json({ error: 'phoneNumber is required' }, { status: 400 })
    }

    // Check if merchant already has a config
    const existingConfig = await db.whatsAppConfig.findUnique({
      where: { merchantId: body.merchantId }
    })

    if (existingConfig) {
      return NextResponse.json({ error: 'WhatsApp configuration already exists for this merchant' }, { status: 400 })
    }

    // Check if phone number is already taken
    const existingPhone = await db.whatsAppConfig.findUnique({
      where: { phoneNumber: body.phoneNumber }
    })

    if (existingPhone) {
      return NextResponse.json({ error: 'Phone number is already registered' }, { status: 400 })
    }

    // Validate status if provided
    if (body.status && !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status. Must be one of: pending, active, error' }, { status: 400 })
    }

    const config = await db.whatsAppConfig.create({
      data: {
        merchantId: body.merchantId,
        phoneNumber: body.phoneNumber,
        phoneNumberId: body.phoneNumberId,
        businessAccountId: body.businessAccountId,
        accessToken: body.accessToken,
        permanentToken: body.permanentToken,
        status: body.status || 'pending',
        webhookVerifyToken: body.webhookVerifyToken,
        webhookUrl: body.webhookUrl,
        autoReply: body.autoReply ?? false,
        autoReplyMessage: body.autoReplyMessage,
        businessHoursOnly: body.businessHoursOnly ?? true,
        dailyMessageLimit: body.dailyMessageLimit || 1000,
        messagesSentToday: 0
      }
    })

    // Mask sensitive data in response
    const sanitizedConfig = {
      ...config,
      accessToken: config.accessToken ? '***MASKED***' : null,
      permanentToken: config.permanentToken ? '***MASKED***' : null
    }

    return NextResponse.json({ config: sanitizedConfig }, { status: 201 })
  } catch (error) {
    console.error('Error creating WhatsApp config:', error)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({ error: 'Duplicate entry. Phone number or merchant already registered' }, { status: 400 })
      }
    }
    return NextResponse.json({ error: 'Failed to create WhatsApp configuration' }, { status: 500 })
  }
}
