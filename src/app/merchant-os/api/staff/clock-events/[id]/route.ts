import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/staff/clock-events/[id] - Get a specific clock event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const clockEvent = await db.clockEvent.findUnique({
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

    if (!clockEvent) {
      return NextResponse.json({ error: 'Clock event not found' }, { status: 404 })
    }

    return NextResponse.json({ clockEvent })
  } catch (error) {
    console.error('Error fetching clock event:', error)
    return NextResponse.json({ error: 'Failed to fetch clock event' }, { status: 500 })
  }
}

// PUT /api/staff/clock-events/[id] - Update a clock event (for approvals, corrections)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check if clock event exists
    const existingEvent = await db.clockEvent.findUnique({
      where: { id }
    })

    if (!existingEvent) {
      return NextResponse.json({ error: 'Clock event not found' }, { status: 404 })
    }

    // Build update data
    const updateData: Record<string, unknown> = {}

    // Basic fields that can be updated
    if (body.eventTime !== undefined) {
      const parsedDate = new Date(body.eventTime)
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: 'eventTime must be a valid ISO date string' }, { status: 400 })
      }
      updateData.eventTime = parsedDate
    }
    if (body.scheduledTime !== undefined) {
      updateData.scheduledTime = body.scheduledTime ? new Date(body.scheduledTime) : null
    }
    if (body.notes !== undefined) {
      updateData.notes = body.notes
    }
    if (body.latitude !== undefined) {
      updateData.latitude = body.latitude
    }
    if (body.longitude !== undefined) {
      updateData.longitude = body.longitude
    }
    if (body.ipAddress !== undefined) {
      updateData.ipAddress = body.ipAddress
    }
    if (body.deviceId !== undefined) {
      updateData.deviceId = body.deviceId
    }
    if (body.branchId !== undefined) {
      updateData.branchId = body.branchId
    }

    // Approval fields
    if (body.requiresApproval !== undefined) {
      updateData.requiresApproval = body.requiresApproval
    }
    if (body.approvedBy !== undefined) {
      updateData.approvedBy = body.approvedBy
    }
    if (body.approvedAt !== undefined) {
      updateData.approvedAt = body.approvedAt ? new Date(body.approvedAt) : null
    }
    if (body.approvalNotes !== undefined) {
      updateData.approvalNotes = body.approvalNotes
    }

    // Calculated hours fields
    if (body.hoursWorked !== undefined) {
      updateData.hoursWorked = body.hoursWorked
    }
    if (body.overtimeHours !== undefined) {
      updateData.overtimeHours = body.overtimeHours
    }

    // Update the clock event
    const clockEvent = await db.clockEvent.update({
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

    return NextResponse.json({ clockEvent })
  } catch (error) {
    console.error('Error updating clock event:', error)
    return NextResponse.json({ error: 'Failed to update clock event' }, { status: 500 })
  }
}

// DELETE /api/staff/clock-events/[id] - Delete a clock event
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if clock event exists
    const existingEvent = await db.clockEvent.findUnique({
      where: { id }
    })

    if (!existingEvent) {
      return NextResponse.json({ error: 'Clock event not found' }, { status: 404 })
    }

    await db.clockEvent.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting clock event:', error)
    return NextResponse.json({ error: 'Failed to delete clock event' }, { status: 500 })
  }
}
