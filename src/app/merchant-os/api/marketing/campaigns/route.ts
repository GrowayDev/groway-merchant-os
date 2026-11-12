import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'
import { getMerchantIdWithDevFallback, requireAuth } from '@/lib/auth-context'

// GET /api/marketing/campaigns - List all marketing campaigns
export async function GET(request: NextRequest) {
  try {
    // Get merchant ID from auth context with dev fallback
    const merchantId = getMerchantIdWithDevFallback(request)
    if (!merchantId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    const where: any = { merchantId }
    
    if (search) {
      where.name = { contains: search, mode: 'insensitive' }
    }
    
    if (status && status !== 'all') {
      where.status = status
    }
    
    if (type && type !== 'all') {
      where.type = type
    }

    const campaigns = await db.marketingCampaign.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    // Parse channels from JSON string
    const parsedCampaigns = campaigns.map(campaign => ({
      ...campaign,
      channels: campaign.channels ? JSON.parse(campaign.channels) : [],
      scheduledAt: campaign.scheduledAt?.toISOString() || null,
      sentAt: campaign.sentAt?.toISOString() || null,
      createdAt: campaign.createdAt.toISOString(),
      updatedAt: campaign.updatedAt.toISOString()
    }))

    return NextResponse.json({
      success: true,
      data: parsedCampaigns,
      count: parsedCampaigns.length
    })
  } catch (error) {
    console.error('Error fetching marketing campaigns:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch marketing campaigns' },
      { status: 500 }
    )
  }
}

// POST /api/marketing/campaigns - Create new marketing campaign
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const auth = requireAuth(request)
    if (auth.error) return auth.error
    const merchantId = auth.context.merchantId
    
    const body = await request.json()
    const {
      name,
      type,
      targetSegment,
      status = 'draft',
      content,
      subject,
      channels,
      scheduledAt,
      targetCount = 0
    } = body

    // Validate required fields
    if (!name || !type) {
      return NextResponse.json(
        { success: false, error: 'Campaign name and type are required' },
        { status: 400 }
      )
    }

    // Create campaign
    const campaign = await db.marketingCampaign.create({
      data: {
        id: randomUUID(),
        merchantId,
        name,
        type,
        targetSegment: targetSegment || null,
        status,
        content: content || null,
        subject: subject || null,
        channels: channels ? JSON.stringify(channels) : null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        targetCount,
        sentCount: 0,
        deliveredCount: 0,
        openedCount: 0,
        clickedCount: 0,
        convertedCount: 0,
        revenue: 0,
        cost: 0,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        ...campaign,
        channels: campaign.channels ? JSON.parse(campaign.channels) : [],
        scheduledAt: campaign.scheduledAt?.toISOString() || null,
        sentAt: campaign.sentAt?.toISOString() || null,
        createdAt: campaign.createdAt.toISOString(),
        updatedAt: campaign.updatedAt.toISOString()
      },
      message: 'Campaign created successfully'
    })
  } catch (error) {
    console.error('Error creating marketing campaign:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create marketing campaign' },
      { status: 500 }
    )
  }
}
