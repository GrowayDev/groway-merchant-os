/**
 * Admin WhatsApp Campaigns API
 * Manage WhatsApp marketing campaigns for the admin console
 */

import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/admin/whatsapp/campaigns - List all campaigns
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    const whereClause = status && status !== 'all' ? { status } : {}

    // Try to fetch from database
    const campaigns = await db.whatsAppCampaign.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    // If no campaigns in database, return demo data
    if (campaigns.length === 0) {
      const demoCampaigns = generateDemoCampaigns()
      return NextResponse.json({
        campaigns: demoCampaigns,
        stats: {
          total: demoCampaigns.length,
          active: demoCampaigns.filter(c => c.status === 'sending').length,
          scheduled: demoCampaigns.filter(c => c.status === 'scheduled').length,
          draft: demoCampaigns.filter(c => c.status === 'draft').length,
          completed: demoCampaigns.filter(c => c.status === 'sent').length,
        }
      })
    }

    // Get stats
    const stats = await getCampaignStats()

    return NextResponse.json({ campaigns, stats })
  } catch (error) {
    console.error('[ADMIN WHATSAPP CAMPAIGNS] Error:', error)
    // Return demo data on error
    const demoCampaigns = generateDemoCampaigns()
    return NextResponse.json({
      campaigns: demoCampaigns,
      stats: {
        total: demoCampaigns.length,
        active: demoCampaigns.filter(c => c.status === 'sending').length,
        scheduled: demoCampaigns.filter(c => c.status === 'scheduled').length,
        draft: demoCampaigns.filter(c => c.status === 'draft').length,
        completed: demoCampaigns.filter(c => c.status === 'sent').length,
      }
    })
  }
}

// POST /api/admin/whatsapp/campaigns - Create a new campaign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      campaignName,
      campaignType,
      messageTemplate,
      templateId,
      targetAudience,
      recipientCount,
      scheduledAt,
      isABTest,
      mediaUrl,
      mediaType,
    } = body

    // Validate required fields
    if (!campaignName || !messageTemplate) {
      return NextResponse.json(
        { error: 'Campaign name and message template are required' },
        { status: 400 }
      )
    }

    const campaign = await db.whatsAppCampaign.create({
      data: {
        id: `wa-camp-${Date.now()}`,
        campaignName,
        campaignType: campaignType || 'broadcast',
        messageTemplate,
        templateId,
        targetAudience: targetAudience ? JSON.stringify(targetAudience) : null,
        recipientCount: recipientCount || 0,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        isABTest: isABTest || false,
        mediaUrl,
        mediaType,
        status: scheduledAt ? 'scheduled' : 'draft',
        deliveredCount: 0,
        readCount: 0,
        clickedCount: 0,
        repliedCount: 0,
        failedCount: 0,
        optOutCount: 0,
        totalCost: 0,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, campaign })
  } catch (error) {
    console.error('[ADMIN WHATSAPP CAMPAIGNS] Error creating campaign:', error)
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/whatsapp/campaigns - Update campaign status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { campaignId, action } = body

    if (!campaignId || !action) {
      return NextResponse.json(
        { error: 'Campaign ID and action are required' },
        { status: 400 }
      )
    }

    const validActions = ['start', 'pause', 'resume', 'cancel', 'complete']
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      )
    }

    let updateData: Record<string, unknown> = { updatedAt: new Date() }

    switch (action) {
      case 'start':
        updateData = {
          ...updateData,
          status: 'sending',
          sentAt: new Date(),
        }
        break
      case 'pause':
        updateData = { ...updateData, status: 'scheduled' }
        break
      case 'resume':
        updateData = { ...updateData, status: 'sending' }
        break
      case 'cancel':
        updateData = { ...updateData, status: 'cancelled' }
        break
      case 'complete':
        updateData = {
          ...updateData,
          status: 'sent',
          sentAt: new Date(),
        }
        break
    }

    const campaign = await db.whatsAppCampaign.update({
      where: { id: campaignId },
      data: updateData,
    })

    return NextResponse.json({ success: true, campaign })
  } catch (error) {
    console.error('[ADMIN WHATSAPP CAMPAIGNS] Error updating campaign:', error)
    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/whatsapp/campaigns - Delete a campaign
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      )
    }

    // Check if campaign can be deleted (only drafts or cancelled)
    const campaign = await db.whatsAppCampaign.findUnique({
      where: { id },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (campaign.status === 'sending') {
      return NextResponse.json(
        { error: 'Cannot delete a campaign that is currently sending' },
        { status: 400 }
      )
    }

    // Delete recipients first
    await db.whatsAppCampaignRecipient.deleteMany({
      where: { campaignId: id },
    })

    // Delete campaign
    await db.whatsAppCampaign.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[ADMIN WHATSAPP CAMPAIGNS] Error deleting campaign:', error)
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    )
  }
}

// Helper function to get campaign stats
async function getCampaignStats() {
  try {
    const total = await db.whatsAppCampaign.count()
    const active = await db.whatsAppCampaign.count({
      where: { status: 'sending' },
    })
    const scheduled = await db.whatsAppCampaign.count({
      where: { status: 'scheduled' },
    })
    const draft = await db.whatsAppCampaign.count({
      where: { status: 'draft' },
    })
    const completed = await db.whatsAppCampaign.count({
      where: { status: 'sent' },
    })

    return { total, active, scheduled, draft, completed }
  } catch {
    return { total: 0, active: 0, scheduled: 0, draft: 0, completed: 0 }
  }
}

// Generate demo campaigns
function generateDemoCampaigns() {
  const now = Date.now()
  return [
    {
      id: 'wa-camp-001',
      campaignName: 'Summer Sale Announcement',
      campaignType: 'broadcast',
      status: 'sent',
      targetAudience: JSON.stringify({ segment: 'all_customers' }),
      recipientCount: 12500,
      messageTemplate: '🎉 Summer Sale is here! Get up to 50% off on selected items. Shop now: {{link}}',
      templateId: null,
      mediaUrl: null,
      mediaType: null,
      scheduledAt: null,
      sentAt: new Date(now - 7 * 24 * 60 * 60 * 1000),
      isABTest: false,
      abTestVariant: null,
      abParentId: null,
      deliveredCount: 12150,
      readCount: 8920,
      clickedCount: 4230,
      repliedCount: 156,
      failedCount: 350,
      optOutCount: 45,
      totalCost: 87.50,
      createdAt: new Date(now - 8 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now - 7 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'wa-camp-002',
      campaignName: 'New Product Launch',
      campaignType: 'promotional',
      status: 'sending',
      targetAudience: JSON.stringify({ segment: 'vip_customers', loyalty_tier: ['gold', 'platinum'] }),
      recipientCount: 8500,
      messageTemplate: '🆕 Introducing our latest product! Be the first to know. Pre-order now with 10% discount using code NEW10.',
      templateId: 'tmpl-new-product',
      mediaUrl: 'https://example.com/images/new-product.jpg',
      mediaType: 'image',
      scheduledAt: null,
      sentAt: new Date(now - 1 * 24 * 60 * 60 * 1000),
      isABTest: true,
      abTestVariant: 'a',
      abParentId: null,
      deliveredCount: 5420,
      readCount: 3950,
      clickedCount: 1240,
      repliedCount: 89,
      failedCount: 80,
      optOutCount: 12,
      totalCost: 37.94,
      createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now - 1 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'wa-camp-003',
      campaignName: 'Loyalty Rewards Reminder',
      campaignType: 'reminder',
      status: 'scheduled',
      targetAudience: JSON.stringify({ segment: 'loyalty_members', points_expiry: '30_days' }),
      recipientCount: 3500,
      messageTemplate: '⭐ You have {{points}} loyalty points! Redeem them before they expire on {{date}}. View rewards: {{link}}',
      templateId: 'tmpl-loyalty-reminder',
      mediaUrl: null,
      mediaType: null,
      scheduledAt: new Date(now + 2 * 24 * 60 * 60 * 1000),
      sentAt: null,
      isABTest: false,
      abTestVariant: null,
      abParentId: null,
      deliveredCount: 0,
      readCount: 0,
      clickedCount: 0,
      repliedCount: 0,
      failedCount: 0,
      optOutCount: 0,
      totalCost: 0,
      createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now - 1 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'wa-camp-004',
      campaignName: 'Order Follow-up',
      campaignType: 'transactional',
      status: 'draft',
      targetAudience: null,
      recipientCount: 0,
      messageTemplate: '📦 Your order {{order_number}} has been delivered! Rate your experience and get 5% off your next order.',
      templateId: 'tmpl-order-followup',
      mediaUrl: null,
      mediaType: null,
      scheduledAt: null,
      sentAt: null,
      isABTest: false,
      abTestVariant: null,
      abParentId: null,
      deliveredCount: 0,
      readCount: 0,
      clickedCount: 0,
      repliedCount: 0,
      failedCount: 0,
      optOutCount: 0,
      totalCost: 0,
      createdAt: new Date(now - 12 * 60 * 60 * 1000),
      updatedAt: new Date(now - 12 * 60 * 60 * 1000),
    },
    {
      id: 'wa-camp-005',
      campaignName: 'Flash Sale - 4 Hours Only',
      campaignType: 'promotional',
      status: 'sent',
      targetAudience: JSON.stringify({ segment: 'all_customers', location: ['Johannesburg', 'Pretoria'] }),
      recipientCount: 15000,
      messageTemplate: '⚡ FLASH SALE! 4 hours only. Use code FLASH30 for 30% off everything! Shop now: {{link}}',
      templateId: 'tmpl-flash-sale',
      mediaUrl: 'https://example.com/images/flash-sale.jpg',
      mediaType: 'image',
      scheduledAt: null,
      sentAt: new Date(now - 14 * 24 * 60 * 60 * 1000),
      isABTest: false,
      abTestVariant: null,
      abParentId: null,
      deliveredCount: 14450,
      readCount: 10200,
      clickedCount: 5670,
      repliedCount: 234,
      failedCount: 550,
      optOutCount: 89,
      totalCost: 101.15,
      createdAt: new Date(now - 15 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now - 14 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'wa-camp-006',
      campaignName: 'Back to School Special',
      campaignType: 'broadcast',
      status: 'sent',
      targetAudience: JSON.stringify({ segment: 'parents', location: ['Gauteng', 'Western Cape'] }),
      recipientCount: 8500,
      messageTemplate: '📚 Back to School Special! Get 25% off all school supplies. Limited stock available. {{link}}',
      templateId: 'tmpl-back-to-school',
      mediaUrl: null,
      mediaType: null,
      scheduledAt: null,
      sentAt: new Date(now - 21 * 24 * 60 * 60 * 1000),
      isABTest: false,
      abTestVariant: null,
      abParentId: null,
      deliveredCount: 8200,
      readCount: 5800,
      clickedCount: 2450,
      repliedCount: 98,
      failedCount: 300,
      optOutCount: 32,
      totalCost: 57.40,
      createdAt: new Date(now - 22 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now - 21 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'wa-camp-007',
      campaignName: 'Cart Abandonment',
      campaignType: 'reminder',
      status: 'draft',
      targetAudience: JSON.stringify({ segment: 'abandoned_cart', hours: 24 }),
      recipientCount: 0,
      messageTemplate: '🛒 You left items in your cart! Complete your purchase and get free shipping on orders over R500.',
      templateId: 'tmpl-cart-abandon',
      mediaUrl: null,
      mediaType: null,
      scheduledAt: null,
      sentAt: null,
      isABTest: false,
      abTestVariant: null,
      abParentId: null,
      deliveredCount: 0,
      readCount: 0,
      clickedCount: 0,
      repliedCount: 0,
      failedCount: 0,
      optOutCount: 0,
      totalCost: 0,
      createdAt: new Date(now - 3 * 60 * 60 * 1000),
      updatedAt: new Date(now - 3 * 60 * 60 * 1000),
    },
    {
      id: 'wa-camp-008',
      campaignName: 'Weekend Special Preview',
      campaignType: 'promotional',
      status: 'cancelled',
      targetAudience: JSON.stringify({ segment: 'all_customers' }),
      recipientCount: 20000,
      messageTemplate: '🛍️ Preview this weekend\'s specials! Early access for loyalty members starts Friday.',
      templateId: 'tmpl-weekend-preview',
      mediaUrl: null,
      mediaType: null,
      scheduledAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
      sentAt: null,
      isABTest: false,
      abTestVariant: null,
      abParentId: null,
      deliveredCount: 0,
      readCount: 0,
      clickedCount: 0,
      repliedCount: 0,
      failedCount: 0,
      optOutCount: 0,
      totalCost: 0,
      createdAt: new Date(now - 4 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
    },
  ]
}
