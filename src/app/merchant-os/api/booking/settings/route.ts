import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/booking/settings - Get booking settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId') || 'default'

    let settings = await db.bookingSettings.findUnique({
      where: { merchantId }
    })

    // Create default settings if not exist
    if (!settings) {
      settings = await db.bookingSettings.create({
        data: { merchantId }
      })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error fetching booking settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// PUT /api/booking/settings - Update booking settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const merchantId = body.merchantId || 'default'

    const settings = await db.bookingSettings.upsert({
      where: { merchantId },
      create: {
        merchantId,
        onlineBookingEnabled: body.onlineBookingEnabled ?? true,
        requireDeposit: body.requireDeposit ?? false,
        defaultDepositPct: body.defaultDepositPct ?? 20,
        sendConfirmationSMS: body.sendConfirmationSMS ?? true,
        sendReminder24h: body.sendReminder24h ?? true,
        sendReminder2h: body.sendReminder2h ?? true,
        sendWhatsApp: body.sendWhatsApp ?? false,
        allowOnlineReschedule: body.allowOnlineReschedule ?? true,
        allowOnlineCancel: body.allowOnlineCancel ?? true,
        cancellationPolicy: body.cancellationPolicy ?? 'moderate',
        cancellationHours: body.cancellationHours ?? 24,
        minBookingNotice: body.minBookingNotice ?? 2,
        maxAdvanceBooking: body.maxAdvanceBooking ?? 30,
        autoConfirmBookings: body.autoConfirmBookings ?? false,
        bufferBetweenSlots: body.bufferBetweenSlots ?? 0,
        workingHoursStart: body.workingHoursStart ?? '08:00',
        workingHoursEnd: body.workingHoursEnd ?? '18:00',
        workingDays: body.workingDays ?? '1,2,3,4,5,6',
        whatsappNumber: body.whatsappNumber
      },
      update: {
        onlineBookingEnabled: body.onlineBookingEnabled,
        requireDeposit: body.requireDeposit,
        defaultDepositPct: body.defaultDepositPct,
        sendConfirmationSMS: body.sendConfirmationSMS,
        sendReminder24h: body.sendReminder24h,
        sendReminder2h: body.sendReminder2h,
        sendWhatsApp: body.sendWhatsApp,
        allowOnlineReschedule: body.allowOnlineReschedule,
        allowOnlineCancel: body.allowOnlineCancel,
        cancellationPolicy: body.cancellationPolicy,
        cancellationHours: body.cancellationHours,
        minBookingNotice: body.minBookingNotice,
        maxAdvanceBooking: body.maxAdvanceBooking,
        autoConfirmBookings: body.autoConfirmBookings,
        bufferBetweenSlots: body.bufferBetweenSlots,
        workingHoursStart: body.workingHoursStart,
        workingHoursEnd: body.workingHoursEnd,
        workingDays: body.workingDays,
        whatsappNumber: body.whatsappNumber
      }
    })

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error updating booking settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
