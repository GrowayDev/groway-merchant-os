import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/booking/appointments/[id] - Get a specific appointment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const appointment = await db.appointment.findUnique({
      where: { id },
      include: {
        service: true,
        staff: true,
        customer: true,
        reminders: {
          orderBy: { sentAt: 'desc' }
        }
      }
    })

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    return NextResponse.json({ appointment })
  } catch (error) {
    console.error('Error fetching appointment:', error)
    return NextResponse.json({ error: 'Failed to fetch appointment' }, { status: 500 })
  }
}

// PUT /api/booking/appointments/[id] - Update an appointment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const appointment = await db.appointment.update({
      where: { id },
      data: {
        customerId: body.customerId,
        customerName: body.customerName,
        customerPhone: body.customerPhone,
        customerEmail: body.customerEmail,
        staffId: body.staffId,
        serviceId: body.serviceId,
        date: body.date,
        time: body.time,
        duration: body.duration,
        status: body.status,
        total: body.total,
        depositAmount: body.depositAmount,
        depositPaid: body.depositPaid,
        depositMethod: body.depositMethod,
        notes: body.notes,
        reminder24hSent: body.reminder24hSent,
        reminder2hSent: body.reminder2hSent,
        confirmationSent: body.confirmationSent,
        cancelledAt: body.status === 'cancelled' ? new Date() : undefined,
        cancelledReason: body.cancelledReason,
        completedAt: body.status === 'completed' ? new Date() : undefined
      },
      include: {
        service: true,
        staff: true,
        customer: true
      }
    })

    return NextResponse.json({ appointment })
  } catch (error) {
    console.error('Error updating appointment:', error)
    return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 })
  }
}

// DELETE /api/booking/appointments/[id] - Cancel an appointment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Soft delete by setting status to cancelled
    const appointment = await db.appointment.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date()
      }
    })

    return NextResponse.json({ success: true, appointment })
  } catch (error) {
    console.error('Error cancelling appointment:', error)
    return NextResponse.json({ error: 'Failed to cancel appointment' }, { status: 500 })
  }
}
