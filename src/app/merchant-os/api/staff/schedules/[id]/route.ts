import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/staff/schedules/[id] - Get a specific schedule
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const schedule = await db.staffSchedule.findUnique({
      where: { id },
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

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }

    return NextResponse.json({ schedule })
  } catch (error) {
    console.error('Error fetching schedule:', error)
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 })
  }
}

// PUT /api/staff/schedules/[id] - Update a schedule
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check if schedule exists
    const existingSchedule = await db.staffSchedule.findUnique({
      where: { id }
    })

    if (!existingSchedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }

    // Validate time format if provided
    const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/
    if (body.startTime && !timeRegex.test(body.startTime)) {
      return NextResponse.json(
        { error: 'startTime must be in HH:mm format' },
        { status: 400 }
      )
    }
    if (body.endTime && !timeRegex.test(body.endTime)) {
      return NextResponse.json(
        { error: 'endTime must be in HH:mm format' },
        { status: 400 }
      )
    }

    // Validate date format if provided
    if (body.scheduleDate) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(body.scheduleDate)) {
        return NextResponse.json(
          { error: 'scheduleDate must be in YYYY-MM-DD format' },
          { status: 400 }
        )
      }

      // Check if changing to a date that already has a schedule
      if (body.scheduleDate !== existingSchedule.scheduleDate || body.staffId !== existingSchedule.staffId) {
        const conflictingSchedule = await db.staffSchedule.findUnique({
          where: {
            staffId_scheduleDate: {
              staffId: body.staffId || existingSchedule.staffId,
              scheduleDate: body.scheduleDate
            }
          }
        })

        if (conflictingSchedule && conflictingSchedule.id !== id) {
          return NextResponse.json(
            { error: 'Schedule already exists for this staff member on this date' },
            { status: 400 }
          )
        }
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {}

    if (body.branchId !== undefined) {
      updateData.branchId = body.branchId
    }
    if (body.scheduleDate !== undefined) {
      updateData.scheduleDate = body.scheduleDate
    }
    if (body.startTime !== undefined) {
      updateData.startTime = body.startTime
    }
    if (body.endTime !== undefined) {
      updateData.endTime = body.endTime
    }
    if (body.breakMinutes !== undefined) {
      updateData.breakMinutes = body.breakMinutes
    }
    if (body.status !== undefined) {
      updateData.status = body.status
    }
    if (body.notes !== undefined) {
      updateData.notes = body.notes
    }

    // Update the schedule
    const schedule = await db.staffSchedule.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ schedule })
  } catch (error) {
    console.error('Error updating schedule:', error)
    return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 })
  }
}

// DELETE /api/staff/schedules/[id] - Delete a schedule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if schedule exists
    const existingSchedule = await db.staffSchedule.findUnique({
      where: { id }
    })

    if (!existingSchedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }

    await db.staffSchedule.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting schedule:', error)
    return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 })
  }
}
