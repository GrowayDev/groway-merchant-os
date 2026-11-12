import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/marketing/campaigns/[id] - Get single campaign
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const campaign = await db.marketingCampaign.findUnique({
      where: { id }
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...campaign,
        channels: campaign.channels ? JSON.parse(campaign.channels) : [],
        scheduledAt: campaign.scheduledAt?.toISOString() || null,
        sentAt: campaign.sentAt?.toISOString() || null,
        createdAt: campaign.createdAt.toISOString(),
        updatedAt: campaign.updatedAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Error fetching marketing campaign:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch marketing campaign' },
      { status: 500 }
    )
  }
}

// PUT /api/marketing/campaigns/[id] - Update campaign
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check if campaign exists
    const existing = await db.marketingCampaign.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    }

    if (body.name !== undefined) updateData.name = body.name
    if (body.type !== undefined) updateData.type = body.type
    if (body.targetSegment !== undefined) updateData.targetSegment = body.targetSegment || null
    if (body.status !== undefined) updateData.status = body.status
    if (body.content !== undefined) updateData.content = body.content || null
    if (body.subject !== undefined) updateData.subject = body.subject || null
    if (body.channels !== undefined) {
      updateData.channels = Array.isArray(body.channels) ? JSON.stringify(body.channels) : body.channels
    }
    if (body.scheduledAt !== undefined) {
      updateData.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null
    }
    if (body.sentAt !== undefined) {
      updateData.sentAt = body.sentAt ? new Date(body.sentAt) : null
    }
    if (body.targetCount !== undefined) updateData.targetCount = body.targetCount
    if (body.sentCount !== undefined) updateData.sentCount = body.sentCount
    if (body.deliveredCount !== undefined) updateData.deliveredCount = body.deliveredCount
    if (body.openedCount !== undefined) updateData.openedCount = body.openedCount
    if (body.clickedCount !== undefined) updateData.clickedCount = body.clickedCount
    if (body.convertedCount !== undefined) updateData.convertedCount = body.convertedCount
    if (body.revenue !== undefined) updateData.revenue = body.revenue
    if (body.cost !== undefined) updateData.cost = body.cost

    // Update campaign
    const campaign = await db.marketingCampaign.update({
      where: { id },
      data: updateData
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
      message: 'Campaign updated successfully'
    })
  } catch (error) {
    console.error('Error updating marketing campaign:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update marketing campaign' },
      { status: 500 }
    )
  }
}

// DELETE /api/marketing/campaigns/[id] - Delete campaign
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if campaign exists
    const existing = await db.marketingCampaign.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Delete campaign
    await db.marketingCampaign.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Campaign deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting marketing campaign:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete marketing campaign' },
      { status: 500 }
    )
  }
}
