import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { 
  createRecurringAppointment, 
  generateAppointments,
  cancelRecurringAppointment 
} from '@/lib/recurring-appointment-service'

// GET /api/booking/recurring - List recurring appointments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const staffId = searchParams.get('staffId')
    const activeOnly = searchParams.get('active') === 'true'

    const where: {
      customerId?: string
      staffId?: string
      active?: boolean
    } = {}

    if (customerId) where.customerId = customerId
    if (staffId) where.staffId = staffId
    if (activeOnly) where.active = true

    const recurring = await db.recurringAppointment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        staff: true,
        service: true
      }
    })

    return NextResponse.json({ recurring })
  } catch (error) {
    console.error('Error fetching recurring appointments:', error)
    return NextResponse.json({ error: 'Failed to fetch recurring appointments' }, { status: 500 })
  }
}

// POST /api/booking/recurring - Create a recurring appointment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const requiredFields = ['customerId', 'staffId', 'serviceId', 'frequency', 'time', 'startDate']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        )
      }
    }

    // Validate frequency
    const validFrequencies = ['weekly', 'biweekly', 'monthly']
    if (!validFrequencies.includes(body.frequency)) {
      return NextResponse.json(
        { error: 'Invalid frequency. Must be weekly, biweekly, or monthly' },
        { status: 400 }
      )
    }

    // Validate dayOfWeek for weekly/biweekly
    if ((body.frequency === 'weekly' || body.frequency === 'biweekly') && 
        (body.dayOfWeek === undefined || body.dayOfWeek < 0 || body.dayOfWeek > 6)) {
      return NextResponse.json(
        { error: 'dayOfWeek (0-6, where 0 is Sunday) is required for weekly/biweekly frequency' },
        { status: 400 }
      )
    }

    // Validate dayOfMonth for monthly
    if (body.frequency === 'monthly' && 
        (body.dayOfMonth === undefined || body.dayOfMonth < 1 || body.dayOfMonth > 31)) {
      return NextResponse.json(
        { error: 'dayOfMonth (1-31) is required for monthly frequency' },
        { status: 400 }
      )
    }

    // Create recurring appointment and generate initial appointments
    const result = await createRecurringAppointment({
      customerId: body.customerId,
      staffId: body.staffId,
      serviceId: body.serviceId,
      frequency: body.frequency,
      dayOfWeek: body.dayOfWeek,
      dayOfMonth: body.dayOfMonth,
      time: body.time,
      startDate: body.startDate,
      endDate: body.endDate
    })

    // Get the created recurring with relations
    const recurring = await db.recurringAppointment.findUnique({
      where: { id: result.recurringId },
      include: {
        customer: true,
        staff: true,
        service: true
      }
    })

    return NextResponse.json({ 
      recurring,
      generatedAppointments: result.appointmentIds.length,
      appointmentIds: result.appointmentIds
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating recurring appointment:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to create recurring appointment' 
    }, { status: 500 })
  }
}

// PUT /api/booking/recurring - Generate more appointments for a recurring series
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { recurringId, count = 4 } = body

    if (!recurringId) {
      return NextResponse.json(
        { error: 'recurringId is required' },
        { status: 400 }
      )
    }

    const appointmentIds = await generateAppointments(recurringId, count)

    return NextResponse.json({ 
      message: `Generated ${appointmentIds.length} appointments`,
      appointmentIds 
    })
  } catch (error) {
    console.error('Error generating appointments:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to generate appointments' 
    }, { status: 500 })
  }
}

// DELETE /api/booking/recurring - Cancel a recurring series
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const recurringId = searchParams.get('id')
    const cancelFuture = searchParams.get('cancelFuture') === 'true'

    if (!recurringId) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    const result = await cancelRecurringAppointment(recurringId, cancelFuture)

    return NextResponse.json({ 
      message: 'Recurring appointment cancelled',
      cancelledAppointments: result.cancelledAppointments
    })
  } catch (error) {
    console.error('Error cancelling recurring appointment:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to cancel recurring appointment' 
    }, { status: 500 })
  }
}
