import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/staff/[staffId]/clock-status - Get current clock status for a staff member
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ staffId: string }> }
) {
  try {
    const { staffId } = await params

    // Check if staff exists
    const staff = await db.staff.findUnique({
      where: { id: staffId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        role: true,
      }
    })

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    // Get today's date range (start and end of day)
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

    // Get all clock events for today
    const todayEvents = await db.clockEvent.findMany({
      where: {
        staffId,
        eventTime: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      orderBy: { eventTime: 'asc' }
    })

    // Determine current status
    // Status can be: clocked_out, clocked_in, on_break
    let currentStatus = 'clocked_out'
    let lastClockIn: Date | null = null
    let lastBreakStart: Date | null = null
    let totalWorkMinutes = 0
    let totalBreakMinutes = 0
    let currentClockEventId: string | null = null

    // Process events to determine current state
    for (const event of todayEvents) {
      switch (event.eventType) {
        case 'clock_in':
          currentStatus = 'clocked_in'
          lastClockIn = event.eventTime
          currentClockEventId = event.id
          break
        case 'clock_out':
          currentStatus = 'clocked_out'
          if (lastClockIn) {
            // Calculate work time
            const workMinutes = Math.round((event.eventTime.getTime() - lastClockIn.getTime()) / (1000 * 60))
            totalWorkMinutes += workMinutes
          }
          lastClockIn = null
          currentClockEventId = null
          break
        case 'break_start':
          if (currentStatus === 'clocked_in') {
            currentStatus = 'on_break'
            lastBreakStart = event.eventTime
          }
          break
        case 'break_end':
          if (currentStatus === 'on_break') {
            currentStatus = 'clocked_in'
            if (lastBreakStart) {
              // Calculate break time
              const breakMinutes = Math.round((event.eventTime.getTime() - lastBreakStart.getTime()) / (1000 * 60))
              totalBreakMinutes += breakMinutes
            }
            lastBreakStart = null
          }
          break
      }
    }

    // Calculate current session time if clocked in
    let currentSessionMinutes = 0
    if (currentStatus === 'clocked_in' && lastClockIn) {
      currentSessionMinutes = Math.round((now.getTime() - lastClockIn.getTime()) / (1000 * 60))
    }

    // Get the latest clock event
    const latestEvent = todayEvents.length > 0 ? todayEvents[todayEvents.length - 1] : null

    // Get today's schedule if exists
    const todayDateStr = now.toISOString().split('T')[0]
    const todaySchedule = await db.staffSchedule.findUnique({
      where: {
        staffId_scheduleDate: {
          staffId,
          scheduleDate: todayDateStr
        }
      }
    })

    // Calculate scheduled vs actual hours
    let scheduledMinutes = 0
    let isLate = false
    let leftEarly = false

    if (todaySchedule) {
      // Parse scheduled times
      const [startHour, startMin] = todaySchedule.startTime.split(':').map(Number)
      const [endHour, endMin] = todaySchedule.endTime.split(':').map(Number)
      scheduledMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin) - todaySchedule.breakMinutes

      // Check if late (first clock in after scheduled start time)
      const firstClockIn = todayEvents.find(e => e.eventType === 'clock_in')
      if (firstClockIn && todaySchedule) {
        const scheduledStartTime = new Date(now)
        scheduledStartTime.setHours(startHour, startMin, 0, 0)
        if (firstClockIn.eventTime > scheduledStartTime) {
          isLate = true
        }
      }

      // Check if leaving early (clocked out before scheduled end)
      const clockOutEvent = todayEvents.find(e => e.eventType === 'clock_out')
      if (clockOutEvent && todaySchedule) {
        const scheduledEndTime = new Date(now)
        scheduledEndTime.setHours(endHour, endMin, 0, 0)
        if (clockOutEvent.eventTime < scheduledEndTime) {
          leftEarly = true
        }
      }
    }

    // Calculate overtime
    const totalMinutes = totalWorkMinutes + currentSessionMinutes
    const overtimeMinutes = Math.max(0, totalMinutes - scheduledMinutes)

    return NextResponse.json({
      staff,
      status: {
        current: currentStatus, // clocked_out, clocked_in, on_break
        currentClockEventId,
        lastEventTime: latestEvent?.eventTime || null,
        lastEventType: latestEvent?.eventType || null,
      },
      today: {
        events: todayEvents,
        totalWorkMinutes,
        totalBreakMinutes,
        currentSessionMinutes,
        totalMinutes,
        scheduledMinutes,
        overtimeMinutes,
      },
      schedule: todaySchedule ? {
        id: todaySchedule.id,
        date: todaySchedule.scheduleDate,
        startTime: todaySchedule.startTime,
        endTime: todaySchedule.endTime,
        breakMinutes: todaySchedule.breakMinutes,
        status: todaySchedule.status,
      } : null,
      flags: {
        isLate,
        leftEarly,
        hasOvertime: overtimeMinutes > 0,
      }
    })
  } catch (error) {
    console.error('Error fetching clock status:', error)
    return NextResponse.json({ error: 'Failed to fetch clock status' }, { status: 500 })
  }
}
