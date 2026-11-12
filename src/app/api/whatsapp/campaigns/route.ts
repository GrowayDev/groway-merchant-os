import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/whatsapp/campaigns - List campaigns
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    const campaigns = await db.groSellBroadcast.findMany({
      where: status && status !== 'all' ? { status } : {},
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    // If no campaigns, return demo data
    if (campaigns.length === 0) {
      const demoCampaigns = generateDemoCampaigns()
      return NextResponse.json({
        campaigns: demoCampaigns,
        stats: {
          total: demoCampaigns.length,
          active: demoCampaigns.filter(c => c.status === 'active').length,
          completed: demoCampaigns.filter(c => c.status === 'completed').length,
          totalRecipients: demoCampaigns.reduce((sum, c) => sum + c.recipientCount, 0),
          totalDelivered: demoCampaigns.reduce((sum, c) => sum + c.deliveredCount, 0),
          totalOpened: demoCampaigns.reduce((sum, c) => sum + c.openedCount, 0)
        }
      })
    }

    return NextResponse.json({ campaigns })
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
  }
}

// POST /api/whatsapp/campaigns - Create campaign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      type,
      message,
      templateId,
      recipientList,
      scheduledAt,
      segments
    } = body

    if (!name || !message) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, message' 
      }, { status: 400 })
    }

    const campaign = await db.groSellBroadcast.create({
      data: {
        id: `campaign-${Date.now()}`,
        name,
        type: type || 'broadcast',
        message,
        templateId,
        recipientList: recipientList ? JSON.stringify(recipientList) : null,
        segments: segments ? JSON.stringify(segments) : null,
        status: scheduledAt ? 'scheduled' : 'draft',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        totalRecipients: recipientList?.length || 0,
        sentCount: 0,
        deliveredCount: 0,
        failedCount: 0,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ success: true, campaign })
  } catch (error) {
    console.error('Error creating campaign:', error)
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
  }
}

// PUT /api/whatsapp/campaigns - Update campaign
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { campaignId, action } = body

    if (!campaignId || !action) {
      return NextResponse.json({ 
        error: 'Missing required fields: campaignId, action' 
      }, { status: 400 })
    }

    const validActions = ['start', 'pause', 'resume', 'cancel', 'complete']
    if (!validActions.includes(action)) {
      return NextResponse.json({ 
        error: `Invalid action. Must be one of: ${validActions.join(', ')}` 
      }, { status: 400 })
    }

    let updateData: Record<string, unknown> = { updatedAt: new Date() }

    switch (action) {
      case 'start':
        updateData = { ...updateData, status: 'active', startedAt: new Date() }
        break
      case 'pause':
        updateData = { ...updateData, status: 'paused' }
        break
      case 'resume':
        updateData = { ...updateData, status: 'active' }
        break
      case 'cancel':
        updateData = { ...updateData, status: 'cancelled', cancelledAt: new Date() }
        break
      case 'complete':
        updateData = { ...updateData, status: 'completed', completedAt: new Date() }
        break
    }

    const campaign = await db.groSellBroadcast.update({
      where: { id: campaignId },
      data: updateData
    })

    return NextResponse.json({ success: true, campaign })
  } catch (error) {
    console.error('Error updating campaign:', error)
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 })
  }
}

// Generate demo campaigns
function generateDemoCampaigns() {
  return [
    {
      id: 'camp-001',
      name: 'Summer Sale Announcement',
      type: 'broadcast',
      message: '🎉 Summer Sale is here! Get up to 50% off on selected items. Shop now: {{link}}',
      status: 'completed',
      totalRecipients: 1250,
      sentCount: 1248,
      deliveredCount: 1195,
      failedCount: 53,
      openedCount: 892,
      clickedCount: 423,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'camp-002',
      name: 'New Product Launch',
      type: 'template',
      message: '🆕 Introducing our latest product! Be the first to know. Pre-order now with 10% discount.',
      status: 'active',
      totalRecipients: 2500,
      sentCount: 1850,
      deliveredCount: 1782,
      failedCount: 68,
      openedCount: 945,
      clickedCount: 312,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      startedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'camp-003',
      name: 'Loyalty Rewards Reminder',
      type: 'broadcast',
      message: '⭐ You have {{points}} loyalty points! Redeem them before they expire on {{date}}.',
      status: 'scheduled',
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      totalRecipients: 3500,
      sentCount: 0,
      deliveredCount: 0,
      failedCount: 0,
      openedCount: 0,
      clickedCount: 0,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'camp-004',
      name: 'Order Follow-up',
      type: 'template',
      message: '📦 Your order {{order_number}} has been delivered! Rate your experience and get 5% off your next order.',
      status: 'draft',
      totalRecipients: 0,
      sentCount: 0,
      deliveredCount: 0,
      failedCount: 0,
      openedCount: 0,
      clickedCount: 0,
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
    },
    {
      id: 'camp-005',
      name: 'Flash Sale - 4 Hours Only',
      type: 'broadcast',
      message: '⚡ FLASH SALE! 4 hours only. Use code FLASH30 for 30% off everything!',
      status: 'completed',
      totalRecipients: 5000,
      sentCount: 4987,
      deliveredCount: 4812,
      failedCount: 175,
      openedCount: 3456,
      clickedCount: 1876,
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      startedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    }
  ]
}
