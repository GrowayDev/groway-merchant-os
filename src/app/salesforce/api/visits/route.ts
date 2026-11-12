import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Mock agent ID for authentication
const MOCK_AGENT_ID = 'sales-demo-001'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const date = searchParams.get('date')
    const upcoming = searchParams.get('upcoming') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: any = {
      agentId: MOCK_AGENT_ID,
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (type && type !== 'all') {
      where.type = type
    }

    if (date) {
      const startDate = new Date(date)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(date)
      endDate.setHours(23, 59, 59, 999)
      
      where.scheduledAt = {
        gte: startDate,
        lte: endDate,
      }
    }

    if (upcoming) {
      where.status = 'scheduled'
      where.scheduledAt = {
        gte: new Date(),
      }
    }

    // Fetch visits
    const visits = await db.salesforceVisit.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
      take: limit,
      skip: offset,
    })

    // Get total count
    const total = await db.salesforceVisit.count({ where })

    // Get counts by status for filters
    const statusCounts = await db.salesforceVisit.groupBy({
      by: ['status'],
      where: { agentId: MOCK_AGENT_ID },
      _count: { id: true },
    })

    const formattedStatusCounts = statusCounts.reduce((acc: any, item: any) => {
      acc[item.status] = item._count.id
      return acc
    }, {} as Record<string, number>)

    // If no visits exist, return demo data
    if (visits.length === 0 && !status && !date) {
      const demoVisits = await seedDemoVisits()
      return NextResponse.json({
        success: true,
        data: demoVisits,
        pagination: {
          total: demoVisits.length,
          limit,
          offset,
          hasMore: false,
        },
        filters: {
          statusCounts: {
            scheduled: 3,
            completed: 5,
            cancelled: 1,
            no_show: 0,
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: visits.map(formatVisit),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + visits.length < total,
      },
      filters: {
        statusCounts: formattedStatusCounts,
      }
    })
  } catch (error) {
    console.error('Error fetching visits:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch visits' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      type,
      leadId,
      merchantId,
      scheduledAt,
      address,
      latitude,
      longitude,
      notes,
      // Check-in specific fields
      checkInLatitude,
      checkInLongitude,
      checkInPhoto,
      // For creating a visit with immediate check-in
      checkInNow,
    } = body

    // Validate required fields
    if (!type) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: type' },
        { status: 400 }
      )
    }

    // Validate visit type
    const validTypes = ['prospecting', 'demo', 'follow_up', 'training', 'closing']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Invalid visit type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Create visit
    const visit = await db.salesforceVisit.create({
      data: {
        id: `visit-${Date.now()}`,
        agentId: MOCK_AGENT_ID,
        type,
        leadId: leadId || null,
        merchantId: merchantId || null,
        status: checkInNow ? 'completed' : 'scheduled',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
        address: address || null,
        latitude: latitude || null,
        longitude: longitude || null,
        checkInAt: checkInNow ? new Date() : null,
        checkInLatitude: checkInNow ? checkInLatitude : null,
        checkInLongitude: checkInNow ? checkInLongitude : null,
        checkInPhoto: checkInNow ? checkInPhoto : null,
        checkOutAt: checkInNow ? new Date() : null,
        notes: notes || null,
      }
    })

    // If check-in now, update agent stats
    if (checkInNow) {
      await db.salesforceAgent.update({
        where: { id: MOCK_AGENT_ID },
        data: {
          visitsThisMonth: { increment: 1 },
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: formatVisit(visit),
      message: checkInNow ? 'Check-in recorded successfully' : 'Visit scheduled successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating visit:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create visit' },
      { status: 500 }
    )
  }
}

// PATCH for updating visit status (check-in, check-out, complete)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { visitId, action, data } = body

    if (!visitId || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: visitId, action' },
        { status: 400 }
      )
    }

    const validActions = ['check_in', 'check_out', 'complete', 'cancel']
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { success: false, error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      )
    }

    const visit = await db.salesforceVisit.findUnique({
      where: { id: visitId, agentId: MOCK_AGENT_ID },
    })

    if (!visit) {
      return NextResponse.json(
        { success: false, error: 'Visit not found' },
        { status: 404 }
      )
    }

    let updateData: any = {}

    switch (action) {
      case 'check_in':
        updateData = {
          checkInAt: new Date(),
          checkInLatitude: data?.latitude,
          checkInLongitude: data?.longitude,
          checkInPhoto: data?.photo,
          status: 'in_progress',
        }
        break

      case 'check_out':
        updateData = {
          checkOutAt: new Date(),
          notes: data?.notes,
        }
        break

      case 'complete':
        updateData = {
          status: 'completed',
          completedAt: new Date(),
          outcome: data?.outcome,
          notes: data?.notes,
          nextAction: data?.nextAction,
          nextActionDate: data?.nextActionDate ? new Date(data.nextActionDate) : null,
          demoCompleted: data?.demoCompleted || false,
          demoDuration: data?.demoDuration,
          demoFeatures: data?.demoFeatures,
        }
        // Update agent stats
        await db.salesforceAgent.update({
          where: { id: MOCK_AGENT_ID },
          data: {
            visitsThisMonth: { increment: 1 },
          }
        })
        break

      case 'cancel':
        updateData = {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancelReason: data?.reason,
        }
        break
    }

    const updatedVisit = await db.salesforceVisit.update({
      where: { id: visitId },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      data: formatVisit(updatedVisit),
      message: `Visit ${action.replace('_', ' ')} successful`
    })
  } catch (error) {
    console.error('Error updating visit:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update visit' },
      { status: 500 }
    )
  }
}

// Helper function to format visit response
function formatVisit(visit: any) {
  return {
    id: visit.id,
    type: visit.type,
    status: visit.status,
    leadId: visit.leadId,
    merchantId: visit.merchantId,
    schedule: {
      scheduledAt: visit.scheduledAt,
      completedAt: visit.completedAt,
      cancelledAt: visit.cancelledAt,
    },
    location: {
      address: visit.address,
      latitude: visit.latitude,
      longitude: visit.longitude,
    },
    checkIn: visit.checkInAt ? {
      at: visit.checkInAt,
      latitude: visit.checkInLatitude,
      longitude: visit.checkInLongitude,
      photo: visit.checkInPhoto,
      checkOutAt: visit.checkOutAt,
    } : null,
    outcome: {
      result: visit.outcome,
      notes: visit.notes,
      nextAction: visit.nextAction,
      nextActionDate: visit.nextActionDate,
    },
    demo: {
      completed: visit.demoCompleted,
      duration: visit.demoDuration,
      features: visit.demoFeatures ? JSON.parse(visit.demoFeatures) : [],
    },
    cancelReason: visit.cancelReason,
    createdAt: visit.createdAt,
    updatedAt: visit.updatedAt,
  }
}

// Seed demo visits if none exist
async function seedDemoVisits() {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const demoVisits = [
    {
      id: 'v-001',
      type: 'demo',
      status: 'scheduled',
      scheduledAt: new Date(now.setHours(10, 0, 0, 0)),
      address: '12 DF Malan Dr, Mamelodi',
      latitude: -25.7461,
      longitude: 28.2181,
    },
    {
      id: 'v-002',
      type: 'follow_up',
      status: 'scheduled',
      scheduledAt: new Date(now.setHours(14, 0, 0, 0)),
      address: '45 Stanza Bopape St, Sunnyside',
      latitude: -25.7479,
      longitude: 28.2263,
    },
    {
      id: 'v-003',
      type: 'closing',
      status: 'scheduled',
      scheduledAt: new Date(tomorrow.setHours(9, 0, 0, 0)),
      address: '78 Steve Biko Rd, Arcadia',
      latitude: -25.7489,
      longitude: 28.2134,
    },
  ]

  for (const visit of demoVisits) {
    try {
      await db.salesforceVisit.create({
        data: {
          ...visit,
          agentId: MOCK_AGENT_ID,
          notes: null,
        }
      })
    } catch (e) {
      // Visit may already exist
    }
  }

  return demoVisits.map(formatVisit)
}
