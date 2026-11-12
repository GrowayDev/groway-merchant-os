import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { timeToMinutes, minutesToTime } from '@/lib/booking-types'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

// GET /api/public/booking/[merchantId]/slots - Get available time slots
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  try {
    const { merchantId } = await params
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const staffId = searchParams.get('staffId')
    const serviceId = searchParams.get('serviceId')

    if (!date || !serviceId) {
      return NextResponse.json(
        { error: 'Date and serviceId are required' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Get booking settings
    const settings = await db.bookingSettings.findUnique({
      where: { merchantId }
    }) || await db.bookingSettings.create({
      data: { merchantId }
    })

    // Get service duration
    const service = await db.bookingService.findUnique({
      where: { id: serviceId }
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    const duration = service.duration + (service.bufferAfter || 0)

    // Parse working hours
    const startMinutes = timeToMinutes(settings.workingHoursStart)
    const endMinutes = timeToMinutes(settings.workingHoursEnd)

    // Check if the date is a working day
    const dayOfWeek = new Date(date).getDay()
    const workingDays = settings.workingDays.split(',').map(Number)

    if (!workingDays.includes(dayOfWeek)) {
      return NextResponse.json(
        { slots: [], message: 'Not a working day' },
        { headers: corsHeaders }
      )
    }

    // Generate all possible time slots (30 min intervals)
    const slotInterval = 30
    const allSlots: string[] = []

    for (let mins = startMinutes; mins + duration <= endMinutes; mins += slotInterval) {
      allSlots.push(minutesToTime(mins))
    }

    // Get existing appointments for the date
    const existingAppointments = await db.appointment.findMany({
      where: {
        date,
        status: { notIn: ['cancelled', 'no-show'] },
        ...(staffId && staffId !== 'any' ? { staffId } : {})
      },
      select: {
        staffId: true,
        time: true,
        duration: true
      }
    })

    // Get staff breaks
    const staffBreaks = await db.staffBreak.findMany({
      where: { date }
    })

    // Get active staff
    const activeStaff = await db.staff.findMany({
      where: { 
        status: 'active',
        ...(staffId && staffId !== 'any' ? { id: staffId } : {})
      },
      include: {
        services: {
          where: { serviceId }
        }
      }
    })

    // Filter staff that can perform this service
    const eligibleStaff = activeStaff.filter(s => s.services.length > 0)

    // Calculate available slots
    const availableSlots = allSlots.map(slot => {
      const slotStart = timeToMinutes(slot)
      const slotEnd = slotStart + duration

      // Check availability per staff member
      const staffAvailability = eligibleStaff.map(staff => {
        // Check for appointment conflicts
        const hasConflict = existingAppointments
          .filter(apt => apt.staffId === staff.id)
          .some(apt => {
            const aptStart = timeToMinutes(apt.time)
            const aptEnd = aptStart + apt.duration
            return slotStart < aptEnd && slotEnd > aptStart
          })

        // Check for staff breaks
        const hasBreak = staffBreaks
          .filter(brk => brk.staffId === staff.id)
          .some(brk => {
            const breakStart = timeToMinutes(brk.startTime)
            const breakEnd = timeToMinutes(brk.endTime)
            return slotStart < breakEnd && slotEnd > breakStart
          })

        return {
          staffId: staff.id,
          staffName: staff.name,
          available: !hasConflict && !hasBreak
        }
      })

      const anyAvailable = staffAvailability.some(s => s.available)

      return {
        time: slot,
        available: anyAvailable,
        availableStaff: staffAvailability.filter(s => s.available)
      }
    })

    // Filter to only show available slots
    const slots = availableSlots.filter(s => s.available)

    return NextResponse.json({ 
      slots,
      date,
      service: {
        id: service.id,
        name: service.name,
        duration: service.duration
      }
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('Error fetching available slots:', error)
    return NextResponse.json(
      { error: 'Failed to fetch available slots' },
      { status: 500, headers: corsHeaders }
    )
  }
}
