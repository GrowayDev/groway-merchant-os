import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { calculateDeposit } from '@/lib/booking-types'

// GET /api/booking/deposits - List deposits
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // pending, paid, failed, refunded
    const date = searchParams.get('date')

    const appointments = await db.appointment.findMany({
      where: {
        depositAmount: { not: null },
        ...(status && { depositPaid: status === 'paid' }),
        ...(date && { date })
      },
      orderBy: { createdAt: 'desc' },
      include: {
        service: true,
        staff: true,
        customer: true
      }
    })

    const deposits = appointments.map(apt => ({
      id: apt.id,
      customerName: apt.customerName,
      customerPhone: apt.customerPhone,
      serviceName: apt.service.name,
      staffName: apt.staff.name,
      date: apt.date,
      time: apt.time,
      depositAmount: apt.depositAmount,
      depositPaid: apt.depositPaid,
      depositMethod: apt.depositMethod,
      depositReference: apt.depositReference,
      total: apt.total,
      status: apt.status,
      createdAt: apt.createdAt
    }))

    // Calculate summary stats
    const stats = {
      total: deposits.length,
      pending: deposits.filter(d => !d.depositPaid).length,
      paid: deposits.filter(d => d.depositPaid).length,
      totalPendingAmount: deposits
        .filter(d => !d.depositPaid)
        .reduce((sum, d) => sum + (d.depositAmount || 0), 0),
      totalPaidAmount: deposits
        .filter(d => d.depositPaid)
        .reduce((sum, d) => sum + (d.depositAmount || 0), 0)
    }

    return NextResponse.json({ deposits, stats })
  } catch (error) {
    console.error('Error fetching deposits:', error)
    return NextResponse.json({ error: 'Failed to fetch deposits' }, { status: 500 })
  }
}

// POST /api/booking/deposits - Create a deposit payment request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { appointmentId } = body

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'appointmentId is required' },
        { status: 400 }
      )
    }

    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
      include: { service: true }
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    if (appointment.depositPaid) {
      return NextResponse.json(
        { error: 'Deposit already paid' },
        { status: 400 }
      )
    }

    // In production, this would create a payment link via payment gateway
    // For now, we'll generate a mock payment reference
    const paymentReference = `DEP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    // Update appointment with payment reference
    await db.appointment.update({
      where: { id: appointmentId },
      data: {
        depositReference: paymentReference
      }
    })

    return NextResponse.json({
      success: true,
      deposit: {
        appointmentId,
        amount: appointment.depositAmount,
        currency: 'ZAR',
        paymentReference,
        paymentUrl: `/pay/deposit/${appointmentId}?ref=${paymentReference}`,
        customerPhone: appointment.customerPhone,
        customerEmail: appointment.customerEmail
      }
    })
  } catch (error) {
    console.error('Error creating deposit request:', error)
    return NextResponse.json({ error: 'Failed to create deposit request' }, { status: 500 })
  }
}

// PUT /api/booking/deposits - Mark deposit as paid (webhook endpoint)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { appointmentId, paymentReference, method = 'online' } = body

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'appointmentId is required' },
        { status: 400 }
      )
    }

    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId }
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Update appointment
    const updated = await db.appointment.update({
      where: { id: appointmentId },
      data: {
        depositPaid: true,
        depositMethod: method,
        depositReference: paymentReference || appointment.depositReference,
        status: 'confirmed'
      },
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
