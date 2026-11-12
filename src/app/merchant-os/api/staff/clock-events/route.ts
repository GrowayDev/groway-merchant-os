import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// GET /api/staff/clock-events - List clock events with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get('staffId')
    const branchId = searchParams.get('branchId')
    const eventType = searchParams.get('eventType')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: Prisma.ClockEventWhereInput = {}

    if (staffId) {
      where.staffId = staffId
    }
    if (branchId) {
      where.branchId = branchId
    }
    if (eventType) {
      where.eventType = eventType
    }
    if (startDate || endDate) {
      where.eventTime = {}
      if (startDate) {
        where.eventTime.gte = new Date(startDate)
      }
      if (endDate) {
        where.eventTime.lte = new Date(endDate)
      }
    }

    const [clockEvents, total] = await Promise.all([
      db.clockEvent.findMany({
        where,
        orderBy: { eventTime: 'desc' },
        take: limit,
        skip: offset,
        include: {
          staff: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              status: true,
              role: true,
            }
          }
        }
      }),
      db.clockEvent.count({ where })
    ])

    return NextResponse.json({
      clockEvents,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('Error fetching clock events:', error)
    return NextResponse.json({ error: 'Failed to fetch clock events' }, { status: 500 })
  }
}

// POST /api/staff/clock-events - Create a new clock event (clock in/out)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.staffId) {
      return NextResponse.json({ error: 'staffId is required' }, { status: 400 })
    }
    if (!body.eventType) {
      return NextResponse.json({ error: 'eventType is required' }, { status: 400 })
    }

    // Validate eventType
    const validEventTypes = ['clock_in', 'clock_out', 'break_start', 'break_end']
    if (!validEventTypes.includes(body.eventType)) {
      return NextResponse.json(
        { error: `eventType must be one of: ${validEventTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate eventTime is a valid ISO date string if provided
    let eventTime = new Date()
    if (body.eventTime) {
      const parsedDate = new Date(body.eventTime)
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: 'eventTime must be a valid ISO date string' }, { status: 400 })
      }
      eventTime = parsedDate
    }

    // Validate staff exists
    const staff = await db.staff.findUnique({
      where: { id: body.staffId }
    })

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    // Create the clock event
    const clockEvent = await db.clockEvent.create({
      data: {
        staffId: body.staffId,
        branchId: body.branchId,
        eventType: body.eventType,
        eventTime,
        scheduledTime: body.scheduledTime ? new Date(body.scheduledTime) : null,
        latitude: body.latitude,
        longitude: body.longitude,
        ipAddress: body.ipAddress,
        deviceId: body.deviceId,
        notes: body.notes,
        requiresApproval: body.requiresApproval || false,
      },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            role: true,
          }
        }
      }
    })

    // Update staff status based on event type
    let newStatus = staff.status
    if (body.eventType === 'clock_in') {
      newStatus = 'active'
    } else if (body.eventType === 'clock_out') {
      newStatus = 'off'
    } else if (body.eventType === 'break_start') {
      newStatus = 'break'
    } else if (body.eventType === 'break_end') {
      newStatus = 'active'
    }

    if (newStatus !== staff.status) {
      await db.staff.update({
        where: { id: body.staffId },
        data: { status: newStatus }
      })
    }

    return NextResponse.json({ clockEvent }, { status: 201 })
  } catch (error) {
    console.error('Error creating clock event:', error)
    return NextResponse.json({ error: 'Failed to create clock event' }, { status: 500 })
  }
}
