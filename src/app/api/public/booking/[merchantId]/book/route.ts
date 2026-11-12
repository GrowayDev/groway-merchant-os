import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { 
  timeToMinutes, 
  generateConfirmationMessage,
  calculateDeposit 
} from '@/lib/booking-types'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

// POST /api/public/booking/[merchantId]/book - Create a booking
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  try {
    const { merchantId } = await params
    const body = await request.json()

    // Validate required fields
    const requiredFields = ['customerName', 'customerPhone', 'staffId', 'serviceId', 'date', 'time']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400, headers: corsHeaders }
        )
      }
    }

    // Get booking settings
    const settings = await db.bookingSettings.findUnique({
      where: { merchantId }
    }) || await db.bookingSettings.create({
      data: { merchantId }
    })

    // Get service details
    const service = await db.bookingService.findUnique({
      where: { id: body.serviceId }
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    // Get staff details
    const staff = await db.staff.findUnique({
      where: { id: body.staffId }
    })

    if (!staff || staff.status !== 'active') {
      return NextResponse.json(
        { error: 'Staff member not available' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Check minimum booking notice
    const bookingDateTime = new Date(`${body.date}T${body.time}`)
    const now = new Date()
    const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (hoursUntilBooking < settings.minBookingNotice) {
      return NextResponse.json(
        { error: `Bookings must be made at least ${settings.minBookingNotice} hours in advance` },
        { status: 400, headers: corsHeaders }
      )
    }

    // Check for time conflicts
    const existingAppointments = await db.appointment.findMany({
      where: {
        staffId: body.staffId,
        date: body.date,
        status: { notIn: ['cancelled', 'no-show'] }
      }
    })

    const newStart = timeToMinutes(body.time)
    const newEnd = newStart + service.duration

    const hasConflict = existingAppointments.some(apt => {
      const aptStart = timeToMinutes(apt.time)
      const aptEnd = aptStart + apt.duration
      return newStart < aptEnd && newEnd > aptStart
    })

    if (hasConflict) {
      return NextResponse.json(
        { error: 'This time slot is no longer available' },
        { status: 409, headers: corsHeaders }
      )
    }

    // Calculate deposit
    const depositAmount = calculateDeposit(
      service.price,
      service.depositRequired || settings.requireDeposit,
      service.depositAmount,
      service.depositPercentage,
      settings.defaultDepositPct
    )

    // Find or create customer
    let customer = await db.customer.findFirst({
      where: {
        OR: [
          { phone: body.customerPhone },
          ...(body.customerEmail ? [{ email: body.customerEmail }] : [])
        ]
      }
    })

    if (!customer) {
      customer = await db.customer.create({
        data: {
          name: body.customerName,
          phone: body.customerPhone,
          email: body.customerEmail,
          source: 'online'
        }
      })
    } else {
      // Update customer info
      await db.customer.update({
        where: { id: customer.id },
        data: {
          name: body.customerName,
          ...(body.customerEmail && { email: body.customerEmail })
        }
      })
    }

    // Create appointment
    const appointment = await db.appointment.create({
      data: {
        customerId: customer.id,
        customerName: body.customerName,
        customerPhone: body.customerPhone,
        customerEmail: body.customerEmail,
        staffId: body.staffId,
        serviceId: body.serviceId,
        date: body.date,
        time: body.time,
        duration: service.duration,
        status: settings.autoConfirmBookings ? 'confirmed' : 'scheduled',
        total: service.price,
        depositAmount: depositAmount > 0 ? depositAmount : null,
        depositPaid: false,
        notes: body.notes,
        source: 'online',
        confirmationSent: false,
        reminder24hSent: false,
        reminder2hSent: false
      },
      include: {
        service: true,
        staff: true,
        customer: true
      }
    })

    // Send confirmation SMS (in background - don't wait)
    const confirmationMessage = generateConfirmationMessage({
      clientName: body.customerName,
      serviceName: service.name,
      staffName: staff.name,
      date: body.date,
      time: body.time,
      businessName: 'Groway Salon & Spa',
      depositAmount: depositAmount > 0 ? depositAmount : undefined
    })

    // Log the SMS (in production, actually send via SMS gateway)
    console.log('SMS to send:', {
      to: body.customerPhone,
      message: confirmationMessage
    })

    // Create reminder record
    await db.appointmentReminder.create({
      data: {
        appointmentId: appointment.id,
        type: 'confirmation',
        channel: 'sms',
        sentAt: new Date(),
        status: 'sent',
        message: confirmationMessage
      }
    })

    // Update appointment confirmation flag
    await db.appointment.update({
      where: { id: appointment.id },
      data: { confirmationSent: true }
    })

    // Generate response
    const response = {
      success: true,
      appointment: {
        id: appointment.id,
        customerName: appointment.customerName,
        serviceName: service.name,
        staffName: staff.name,
        date: appointment.date,
        time: appointment.time,
        duration: appointment.duration,
        total: appointment.total,
        depositAmount: appointment.depositAmount,
        depositRequired: depositAmount > 0,
        status: appointment.status
      },
      deposit: depositAmount > 0 ? {
        amount: depositAmount,
        paymentUrl: `/pay/deposit/${appointment.id}`,
        message: `A deposit of R${depositAmount} is required to secure your booking.`
      } : null
    }

    return NextResponse.json(response, { 
      status: 201, 
      headers: corsHeaders 
    })
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500, headers: corsHeaders }
    )
  }
}
