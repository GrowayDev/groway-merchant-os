import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: Get housekeeping schedule
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get('date')
    const status = searchParams.get('status')
    const assignedTo = searchParams.get('assignedTo')
    const taskType = searchParams.get('taskType')

    // Get all rooms with their current status
    const rooms = await db.hotelRoom.findMany({
      include: {
        HotelReservation: {
          where: {
            status: { in: ['checked_out', 'checked_in'] }
          },
          include: {
            HotelGuest: true
          }
        }
      },
      orderBy: [
        { floor: 'asc' },
        { number: 'asc' }
      ]
    })

    // Get existing tasks
    const taskWhere: Record<string, unknown> = {}
    if (status) taskWhere.status = status
    if (assignedTo) taskWhere.assignedTo = assignedTo
    if (taskType) taskWhere.taskType = taskType

    if (date) {
      const startDate = new Date(date)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(date)
      endDate.setHours(23, 59, 59, 999)
      taskWhere.createdAt = {
        gte: startDate,
        lte: endDate
      }
    }

    const existingTasks = await db.hotelHousekeepingTask.findMany({
      where: taskWhere,
      include: {
        HotelRoom: true
      }
    })

    // Create task map for quick lookup
    const taskMap = new Map(existingTasks.map(t => [t.roomId, t]))

    // Build housekeeping schedule
    const schedule = rooms.map(room => {
      const currentReservation = room.HotelReservation[0]
      const task = taskMap.get(room.id)

      // Determine required task type based on room status
      let requiredTask = 'cleaning'
      let priority = 'normal'

      if (room.status === 'occupied') {
        // Guest still in room - service clean
        requiredTask = 'service_clean'
        priority = 'low'
      } else if (room.status === 'cleaning') {
        // Just checked out - full clean
        requiredTask = 'cleaning'
        priority = 'high'
      } else if (room.status === 'maintenance') {
        requiredTask = 'maintenance'
        priority = 'urgent'
      } else if (room.status === 'available') {
        // Check if last cleaned more than 24 hours ago
        const needsCleaning = !room.lastCleaned ||
          (Date.now() - new Date(room.lastCleaned).getTime() > 24 * 60 * 60 * 1000)
        requiredTask = needsCleaning ? 'inspection' : 'none'
        priority = needsCleaning ? 'low' : 'none'
      }

      // Check-out room (guest leaving today)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const isCheckOutToday = currentReservation?.status === 'checked_in' &&
        new Date(currentReservation.checkOut).getTime() <= today.getTime() + 24 * 60 * 60 * 1000

      if (isCheckOutToday) {
        priority = 'high'
      }

      return {
        roomId: room.id,
        roomNumber: room.number,
        floor: room.floor,
        roomType: room.type,
        roomStatus: room.status,
        currentGuest: currentReservation?.status === 'checked_in' ? {
          name: currentReservation.HotelGuest?.name,
          checkOut: currentReservation.checkOut
        } : null,
        lastCleaned: room.lastCleaned,
        requiredTask,
        priority,
        existingTask: task ? {
          id: task.id,
          taskType: task.taskType,
          status: task.status,
          assignedTo: task.assignedTo,
          assignedName: task.assignedName,
          startedAt: task.startedAt,
          completedAt: task.completedAt,
          issuesFound: task.issuesFound
        } : null,
        needsAttention: room.status === 'cleaning' || room.status === 'maintenance'
      }
    })

    // Calculate summary
    const summary = {
      totalRooms: schedule.length,
      pending: schedule.filter(s => s.requiredTask !== 'none' && !s.existingTask).length,
      inProgress: existingTasks.filter(t => t.status === 'in_progress').length,
      completed: existingTasks.filter(t => t.status === 'completed').length,
      urgent: schedule.filter(s => s.priority === 'urgent').length,
      high: schedule.filter(s => s.priority === 'high').length,
      normal: schedule.filter(s => s.priority === 'normal').length,
      low: schedule.filter(s => s.priority === 'low').length
    }

    // Get staff list for assignment
    const staffList = await db.staff.findMany({
      where: { isActive: true },
      select: { id: true, name: true }
    })

    return NextResponse.json({
      success: true,
      data: schedule,
      summary,
      staffList,
      taskTypes: [
        { value: 'cleaning', label: 'Full Clean', description: 'Complete room cleaning after check-out' },
        { value: 'service_clean', label: 'Service Clean', description: 'Light clean for occupied rooms' },
        { value: 'maintenance', label: 'Maintenance', description: 'Repairs or maintenance required' },
        { value: 'inspection', label: 'Inspection', description: 'Quality check for ready rooms' },
        { value: 'restock', label: 'Restock', description: 'Restock amenities and supplies' }
      ],
      priorities: [
        { value: 'urgent', label: 'Urgent', color: 'red' },
        { value: 'high', label: 'High', color: 'orange' },
        { value: 'normal', label: 'Normal', color: 'blue' },
        { value: 'low', label: 'Low', color: 'gray' }
      ]
    })
  } catch (error) {
    console.error('Error fetching housekeeping schedule:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch housekeeping schedule' },
      { status: 500 }
    )
  }
}

// POST: Update room cleaning status / Create task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      roomId,
      taskType,
      priority,
      assignedTo,
      assignedName,
      notes
    } = body

    if (!roomId) {
      return NextResponse.json(
        { success: false, error: 'roomId is required' },
        { status: 400 }
      )
    }

    // Check for existing pending task for this room
    const existingTask = await db.hotelHousekeepingTask.findFirst({
      where: {
        roomId,
        status: { in: ['pending', 'in_progress'] }
      }
    })

    if (existingTask) {
      return NextResponse.json(
        { success: false, error: 'There is already an active task for this room', existingTask },
        { status: 400 }
      )
    }

    // Create new task
    const task = await db.hotelHousekeepingTask.create({
      data: {
        roomId,
        taskType: taskType || 'cleaning',
        status: 'pending',
        priority: priority || 'normal',
        assignedTo,
        assignedName,
        notes
      }
    })

    return NextResponse.json({
      success: true,
      data: task,
      message: 'Housekeeping task created'
    })
  } catch (error) {
    console.error('Error creating housekeeping task:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create housekeeping task' },
      { status: 500 }
    )
  }
}

// PATCH: Update task status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      taskId,
      status,
      issuesFound,
      notes,
      actualDuration
    } = body

    if (!taskId || !status) {
      return NextResponse.json(
        { success: false, error: 'taskId and status are required' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = { status }

    // Handle status transitions
    switch (status) {
      case 'in_progress':
        updateData.startedAt = new Date()
        break

      case 'completed':
        updateData.completedAt = new Date()
        if (actualDuration) updateData.actualDuration = actualDuration
        if (issuesFound) updateData.issuesFound = issuesFound
        if (notes) updateData.notes = notes

        // Update room status to available and last cleaned
        const task = await db.hotelHousekeepingTask.findUnique({
          where: { id: taskId },
          include: { HotelRoom: true }
        })
        if (task) {
          await db.hotelRoom.update({
            where: { id: task.roomId },
            data: {
              status: 'available',
              lastCleaned: new Date()
            }
          })
        }
        break

      case 'failed':
        if (issuesFound) updateData.issuesFound = issuesFound
        if (notes) updateData.notes = notes

        // Update room status to maintenance if issues found
        const failedTask = await db.hotelHousekeepingTask.findUnique({
          where: { id: taskId },
          include: { HotelRoom: true }
        })
        if (failedTask && issuesFound) {
          await db.hotelRoom.update({
            where: { id: failedTask.roomId },
            data: { status: 'maintenance' }
          })
        }
        break
    }

    const updatedTask = await db.hotelHousekeepingTask.update({
      where: { id: taskId },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: updatedTask,
      message: `Task status updated to ${status}`
    })
  } catch (error) {
    console.error('Error updating housekeeping task:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

// PUT: Assign task to staff member
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { taskId, assignedTo, assignedName } = body

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'taskId is required' },
        { status: 400 }
      )
    }

    const updatedTask = await db.hotelHousekeepingTask.update({
      where: { id: taskId },
      data: {
        assignedTo,
        assignedName
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedTask,
      message: `Task assigned to ${assignedName || assignedTo}`
    })
  } catch (error) {
    console.error('Error assigning task:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to assign task' },
      { status: 500 }
    )
  }
}

// DELETE: Cancel task
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const taskId = searchParams.get('taskId')

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'taskId is required' },
        { status: 400 }
      )
    }

    await db.hotelHousekeepingTask.delete({
      where: { id: taskId }
    })

    return NextResponse.json({
      success: true,
      message: 'Task cancelled'
    })
  } catch (error) {
    console.error('Error cancelling task:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to cancel task' },
      { status: 500 }
    )
  }
}
