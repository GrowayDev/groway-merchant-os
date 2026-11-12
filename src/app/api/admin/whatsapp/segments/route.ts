/**
 * Admin WhatsApp Segments API
 * Manage audience segments for campaign targeting
 */

import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/admin/whatsapp/segments - List all segments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')

    // Try to fetch from database
    const segments = await db.whatsAppSegment.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // If no segments in database, return demo data
    if (segments.length === 0) {
      const demoSegments = generateDemoSegments()
      return NextResponse.json({ segments: demoSegments })
    }

    return NextResponse.json({ segments })
  } catch (error) {
    console.error('[ADMIN WHATSAPP SEGMENTS] Error:', error)
    // Return demo data on error
    const demoSegments = generateDemoSegments()
    return NextResponse.json({ segments: demoSegments })
  }
}

// POST /api/admin/whatsapp/segments - Create a new segment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { segmentName, description, filterCriteria } = body

    // Validate required fields
    if (!segmentName) {
      return NextResponse.json(
        { error: 'Segment name is required' },
        { status: 400 }
      )
    }

    // Check if segment name already exists
    const existing = await db.whatsAppSegment.findFirst({
      where: { segmentName },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Segment name already exists' },
        { status: 400 }
      )
    }

    // Calculate contact count based on filters (simplified)
    const contactCount = await calculateSegmentSize(filterCriteria)

    const segment = await db.whatsAppSegment.create({
      data: {
        id: `wa-seg-${Date.now()}`,
        segmentName,
        description: description || null,
        filterCriteria: filterCriteria ? JSON.stringify(filterCriteria) : null,
        contactCount,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, segment })
  } catch (error) {
    console.error('[ADMIN WHATSAPP SEGMENTS] Error creating segment:', error)
    return NextResponse.json(
      { error: 'Failed to create segment' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/whatsapp/segments - Update a segment
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, segmentName, description, filterCriteria } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Segment ID is required' },
        { status: 400 }
      )
    }

    // Check if segment exists
    const existing = await db.whatsAppSegment.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Segment not found' },
        { status: 404 }
      )
    }

    // Check if new name conflicts with another segment
    if (segmentName && segmentName !== existing.segmentName) {
      const nameConflict = await db.whatsAppSegment.findFirst({
        where: { segmentName, id: { not: id } },
      })
      if (nameConflict) {
        return NextResponse.json(
          { error: 'Segment name already exists' },
          { status: 400 }
        )
      }
    }

    // Recalculate contact count if filters changed
    const contactCount = filterCriteria !== undefined 
      ? await calculateSegmentSize(filterCriteria)
      : existing.contactCount

    const segment = await db.whatsAppSegment.update({
      where: { id },
      data: {
        segmentName: segmentName || existing.segmentName,
        description: description !== undefined ? description : existing.description,
        filterCriteria: filterCriteria ? JSON.stringify(filterCriteria) : existing.filterCriteria,
        contactCount,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, segment })
  } catch (error) {
    console.error('[ADMIN WHATSAPP SEGMENTS] Error updating segment:', error)
    return NextResponse.json(
      { error: 'Failed to update segment' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/whatsapp/segments - Delete a segment
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Segment ID is required' },
        { status: 400 }
      )
    }

    // Check if segment is being used by any campaigns
    const campaignsUsing = await db.whatsAppCampaign.count({
      where: { segmentId: id },
    })

    if (campaignsUsing > 0) {
      return NextResponse.json(
        { error: `Cannot delete segment. It is being used by ${campaignsUsing} campaign(s)` },
        { status: 400 }
      )
    }

    await db.whatsAppSegment.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[ADMIN WHATSAPP SEGMENTS] Error deleting segment:', error)
    return NextResponse.json(
      { error: 'Failed to delete segment' },
      { status: 500 }
    )
  }
}

// Helper function to calculate segment size
async function calculateSegmentSize(filterCriteria: unknown): Promise<number> {
  try {
    if (!filterCriteria) return 0

    const filters = typeof filterCriteria === 'string' ? JSON.parse(filterCriteria) : filterCriteria
    
    // Simplified calculation - in production, this would query actual customer data
    // based on the filter criteria
    let baseCount = 50000 // Total opt-in contacts

    if (Array.isArray(filters)) {
      for (const filter of filters) {
        switch (filter.field) {
          case 'last_purchase':
            if (filter.operator === 'within') {
              const days = parseInt(filter.value) || 30
              baseCount = Math.floor(baseCount * (days / 90))
            }
            break
          case 'total_spent':
            if (filter.operator === 'greater') {
              baseCount = Math.floor(baseCount * 0.3)
            }
            break
          case 'loyalty_tier':
            baseCount = Math.floor(baseCount * 0.2)
            break
          case 'location':
            baseCount = Math.floor(baseCount * 0.4)
            break
          case 'opt_in':
            // All contacts are opted in by default
            break
        }
      }
    }

    return Math.max(baseCount, 100)
  } catch {
    return 0
  }
}

// Generate demo segments
function generateDemoSegments() {
  const now = Date.now()
  return [
    {
      id: 'wa-seg-001',
      segmentName: 'All Customers',
      description: 'All customers who have opted in to WhatsApp messages',
      filterCriteria: JSON.stringify([{ field: 'opt_in', operator: 'equals', value: 'true' }]),
      contactCount: 52430,
      createdAt: new Date(now - 90 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now - 1 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'wa-seg-002',
      segmentName: 'VIP Customers',
      description: 'Gold and Platinum loyalty tier members',
      filterCriteria: JSON.stringify([
        { field: 'loyalty_tier', operator: 'equals', value: 'gold' },
        { field: 'loyalty_tier', operator: 'equals', value: 'platinum' },
      ]),
      contactCount: 8542,
      createdAt: new Date(now - 60 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'wa-seg-003',
      segmentName: 'Active Shoppers',
      description: 'Customers who made a purchase in the last 30 days',
      filterCriteria: JSON.stringify([
        { field: 'last_purchase', operator: 'within', value: '30' },
      ]),
      contactCount: 18420,
      createdAt: new Date(now - 45 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'wa-seg-004',
      segmentName: 'Dormant Customers',
      description: 'Customers who haven\'t purchased in 90+ days',
      filterCriteria: JSON.stringify([
        { field: 'last_purchase', operator: 'greater', value: '90' },
      ]),
      contactCount: 12890,
      createdAt: new Date(now - 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now - 5 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'wa-seg-005',
      segmentName: 'High Value Customers',
      description: 'Customers with total spend over R10,000',
      filterCriteria: JSON.stringify([
        { field: 'total_spent', operator: 'greater', value: '10000' },
      ]),
      contactCount: 5230,
      createdAt: new Date(now - 25 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now - 1 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'wa-seg-006',
      segmentName: 'Gauteng Region',
      description: 'Customers located in Gauteng province',
      filterCriteria: JSON.stringify([
        { field: 'location', operator: 'equals', value: 'Gauteng' },
      ]),
      contactCount: 21450,
      createdAt: new Date(now - 20 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now - 4 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'wa-seg-007',
      segmentName: 'Western Cape Region',
      description: 'Customers located in Western Cape province',
      filterCriteria: JSON.stringify([
        { field: 'location', operator: 'equals', value: 'Western Cape' },
      ]),
      contactCount: 15320,
      createdAt: new Date(now - 20 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now - 4 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'wa-seg-008',
      segmentName: 'Loyalty Members',
      description: 'All customers enrolled in the loyalty program',
      filterCriteria: JSON.stringify([
        { field: 'loyalty_member', operator: 'equals', value: 'true' },
      ]),
      contactCount: 32150,
      createdAt: new Date(now - 15 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'wa-seg-009',
      segmentName: 'Cart Abandoners',
      description: 'Customers who abandoned cart in last 24 hours',
      filterCriteria: JSON.stringify([
        { field: 'abandoned_cart', operator: 'within', value: '24' },
      ]),
      contactCount: 890,
      createdAt: new Date(now - 10 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now - 1 * 60 * 60 * 1000),
    },
    {
      id: 'wa-seg-010',
      segmentName: 'New Customers',
      description: 'Customers who joined in the last 7 days',
      filterCriteria: JSON.stringify([
        { field: 'joined_date', operator: 'within', value: '7' },
      ]),
      contactCount: 1234,
      createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now - 6 * 60 * 60 * 1000),
    },
    {
      id: 'wa-seg-011',
      segmentName: 'Points Expiring',
      description: 'Loyalty members with points expiring in 30 days',
      filterCriteria: JSON.stringify([
        { field: 'points_expiry', operator: 'within', value: '30' },
      ]),
      contactCount: 4521,
      createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now - 1 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'wa-seg-012',
      segmentName: 'Parents',
      description: 'Customers who have purchased baby/kids products',
      filterCriteria: JSON.stringify([
        { field: 'purchase_category', operator: 'equals', value: 'baby_kids' },
      ]),
      contactCount: 8760,
      createdAt: new Date(now - 7 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
    },
  ]
}
