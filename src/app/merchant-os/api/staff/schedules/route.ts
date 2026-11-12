import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// GET /api/staff/schedules - List staff schedules with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get('staffId')
    const branchId = searchParams.get('branchId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: Prisma.StaffScheduleWhereInput = {}

    if (staffId) {
      where.staffId = staffId
    }
    if (branchId) {
      where.branchId = branchId
    }
    if (status) {
      where.status = status
    }
    if (startDate || endDate) {
      // Note: scheduleDate is a string in YYYY-MM-DD format
      if (startDate && endDate) {
        where.scheduleDate = {
          gte: startDate,
          lte: endDate
        }
      } else if (startDate) {
        where.scheduleDate = { gte: startDate }
      } else if (endDate) {
        where.scheduleDate = { lte: endDate }
      }
    }

    const [schedules, total] = await Promise.all([
      db.staffSchedule.findMany({
        where,
        orderBy: { scheduleDate: 'asc' },
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
      db.staffSchedule.count({ where })
    ])

    return NextResponse.json({
      schedules,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('Error fetching schedules:', error)
    return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 })
  }
}

// POST /api/staff/schedules - Create a new staff schedule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.staffId) {
      return NextResponse.json({ error: 'staffId is required' }, { status: 400 })
    }
    if (!body.scheduleDate) {
      return NextResponse.json({ error: 'scheduleDate is required' }, { status: 400 })
    }
    if (!body.startTime) {
      return NextResponse.json({ error: 'startTime is required' }, { status: 400 })
    }
    if (!body.endTime) {
      return NextResponse.json({ error: 'endTime is required' }, { status: 400 })
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(body.scheduleDate)) {
      return NextResponse.json(
        { error: 'scheduleDate must be in YYYY-MM-DD format' },
        { status: 400 }
      )
    }

    // Validate time format (HH:mm)
    const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/
    if (!timeRegex.test(body.startTime)) {
      return NextResponse.json(
        { error: 'startTime must be in HH:mm format' },
        { status: 400 }
      )
    }
    if (!timeRegex.test(body.endTime)) {
      return NextResponse.json(
        { error: 'endTime must be in HH:mm format' },
        { status: 400 }
      )
    }

    // Validate staff exists
    const staff = await db.staff.findUnique({
      where: { id: body.staffId }
    })

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    // Check if schedule already exists for this staff and date
    const existingSchedule = await db.staffSchedule.findUnique({
      where: {
        staffId_scheduleDate: {
          staffId: body.staffId,
          scheduleDate: body.scheduleDate
        }
      }
    })

    if (existingSchedule) {
      return NextResponse.json(
        { error: 'Schedule already exists for this staff member on this date' },
        { status: 400 }
      )
    }

    // Create the schedule
    const schedule = await db.staffSchedule.create({
      data: {
        staffId: body.staffId,
        branchId: body.branchId,
        scheduleDate: body.scheduleDate,
        startTime: body.startTime,
        endTime: body.endTime,
        breakMinutes: body.breakMinutes || 0,
        status: body.status || 'scheduled',
        notes: body.notes,
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

    return NextResponse.json({ schedule }, { status: 201 })
  } catch (error) {
    console.error('Error creating schedule:', error)
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 })
  }
}
