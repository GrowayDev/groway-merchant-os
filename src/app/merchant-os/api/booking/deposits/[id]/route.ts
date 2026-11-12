import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/booking/deposits/[id] - Get deposit details
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
        reminders: true
      }
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'Deposit/Appointment not found' },
        { status: 404 }
      )
    }

    const deposit = {
      id: appointment.id,
      customer: {
        name: appointment.customerName,
        phone: appointment.customerPhone,
        email: appointment.customerEmail
      },
      service: {
        name: appointment.service.name,
        price: appointment.service.price,
        duration: appointment.service.duration
      },
      staff: {
        name: appointment.staff.name
      },
      appointment: {
        date: appointment.date,
        time: appointment.time,
        status: appointment.status
      },
      deposit: {
        amount: appointment.depositAmount,
        paid: appointment.depositPaid,
        method: appointment.depositMethod,
        reference: appointment.depositReference,
        balanceDue: appointment.total - (appointment.depositAmount || 0)
      },
      total: appointment.total,
      createdAt: appointment.createdAt,
      confirmationSent: appointment.confirmationSent,
      remindersSent: appointment.reminders.map(r => ({
        type: r.type,
        channel: r.channel,
        sentAt: r.sentAt
      }))
    }

    return NextResponse.json({ deposit })
  } catch (error) {
    console.error('Error fetching deposit:', error)
    return NextResponse.json({ error: 'Failed to fetch deposit' }, { status: 500 })
  }
}

// PUT /api/booking/deposits/[id] - Update deposit status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { 
      depositPaid, 
      depositMethod, 
      depositReference,
      status 
    } = body

    const appointment = await db.appointment.findUnique({
      where: { id }
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    const updateData: {
      depositPaid?: boolean
      depositMethod?: string
      depositReference?: string
      status?: string
    } = {}

    if (typeof depositPaid === 'boolean') updateData.depositPaid = depositPaid
    if (depositMethod) updateData.depositMethod = depositMethod
    if (depositReference) updateData.depositReference = depositReference
    if (status) updateData.status = status

    // If marking as paid, also confirm the appointment
    if (depositPaid === true && !appointment.depositPaid) {
      updateData.status = 'confirmed'
    }

    const updated = await db.appointment.update({
      where: { id },
      data: updateData,
      include: {
        service: true,
        staff: true,
        customer: true
      }
    })

    return NextResponse.json({
      success: true,
      appointment: updated
    })
  } catch (error) {
    console.error('Error updating deposit:', error)
    return NextResponse.json({ error: 'Failed to update deposit' }, { status: 500 })
  }
}

// DELETE /api/booking/deposits/[id] - Refund deposit
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const appointment = await db.appointment.findUnique({
      where: { id }
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    if (!appointment.depositPaid) {
      return NextResponse.json(
        { error: 'No deposit to refund' },
        { status: 400 }
      )
    }

    // In production, this would trigger a refund via payment gateway
    // For now, we'll just update the status

    const updated = await db.appointment.update({
      where: { id },
      data: {
        depositPaid: false,
        depositMethod: null,
        depositReference: `REFUNDED-${appointment.depositReference}`,
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledReason: 'Deposit refunded'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Deposit refunded',
      refundAmount: appointment.depositAmount,
      appointment: updated
    })
  } catch (error) {
    console.error('Error refunding deposit:', error)
    return NextResponse.json({ error: 'Failed to refund deposit' }, { status: 500 })
  }
}
