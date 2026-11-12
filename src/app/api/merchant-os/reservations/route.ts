import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/merchant-os/reservations - Get reservations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'list'
    const date = searchParams.get('date')
    const status = searchParams.get('status')
    const phone = searchParams.get('phone')
    const reservationId = searchParams.get('id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    switch (type) {
      case 'list':
        return await getReservations(date, status, limit, offset)
      case 'availability':
        return await checkAvailability(date, searchParams.get('time'), searchParams.get('partySize'))
      case 'detail':
        return await getReservationDetail(reservationId)
      case 'search':
        return await searchReservations(phone)
      case 'settings':
        return await getReservationSettings(searchParams.get('merchantId'))
      case 'slots':
        return await getTimeSlots(date, searchParams.get('partySize'))
      default:
        return await getReservations(date, status, limit, offset)
    }
  } catch (error) {
    console.error('Error in reservations API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reservations data' },
      { status: 500 }
    )
  }
}

// Get reservations list
async function getReservations(date: string | null, status: string | null, limit: number, offset: number) {
  const where: any = {}
  
  if (date) {
    where.reservationDate = date
  }
  
  if (status) {
    where.status = status
  }

  const [reservations, total] = await Promise.all([
    db.tableReservationSystem.findMany({
      where,
      orderBy: [
        { reservationDate: 'asc' },
        { reservationTime: 'asc' }
      ],
      take: limit,
      skip: offset,
    }),
    db.tableReservationSystem.count({ where })
  ])

  // Get stats
  const today = new Date().toISOString().split('T')[0]
  const stats = await db.tableReservationSystem.groupBy({
    by: ['status'],
    _count: { id: true },
    where: { reservationDate: today }
  })

  return NextResponse.json({
    reservations,
    total,
    limit,
    offset,
    stats: {
      pending: stats.find(s => s.status === 'pending')?._count?.id || 0,
      confirmed: stats.find(s => s.status === 'confirmed')?._count?.id || 0,
      seated: stats.find(s => s.status === 'seated')?._count?.id || 0,
      completed: stats.find(s => s.status === 'completed')?._count?.id || 0,
      cancelled: stats.find(s => s.status === 'cancelled')?._count?.id || 0,
      noShow: stats.find(s => s.status === 'no_show')?._count?.id || 0,
    }
  })
}

// Check table availability
async function checkAvailability(date: string | null, time: string | null, partySize: string | null) {
  if (!date) {
    return NextResponse.json(
      { error: 'date is required for availability check' },
      { status: 400 }
    )
  }

  // Get all tables
  const tables = await db.restaurantTable.findMany({
    include: {
      FloorSection: true,
    },
    orderBy: { number: 'asc' }
  })

  // Get existing reservations for the date
  const reservations = await db.tableReservationSystem.findMany({
    where: {
      reservationDate: date,
      status: { in: ['pending', 'confirmed', 'seated'] }
    }
  })

  // Calculate availability for each time slot
  const timeSlots = generateTimeSlots()
  const availability = timeSlots.map(slot => {
    const slotReservations = reservations.filter(r => {
      const resTime = r.reservationTime
      const slotTime = slot.time
      // Check if reservation overlaps with this slot (90 min duration)
      const resMinutes = timeToMinutes(resTime)
      const slotMinutes = timeToMinutes(slotTime)
      return Math.abs(resMinutes - slotMinutes) < 90
    })

    const bookedTables = slotReservations.map(r => r.tableId).filter(Boolean)
    const availableTables = tables.filter(t => !bookedTables.includes(t.id))
    
    const requestedPartySize = partySize ? parseInt(partySize) : 0
    const suitableTables = availableTables.filter(t => t.seats >= requestedPartySize || requestedPartySize === 0)

    return {
      time: slot.time,
      available: suitableTables.length,
      total: tables.length,
      booked: bookedTables.length,
      tables: suitableTables.map(t => ({
        id: t.id,
        number: t.number,
        seats: t.seats,
        section: t.FloorSection?.name
      }))
    }
  })

  return NextResponse.json({
    date,
    availability,
    partySize: partySize ? parseInt(partySize) : null
  })
}

// Get reservation detail
async function getReservationDetail(reservationId: string | null) {
  if (!reservationId) {
    return NextResponse.json(
      { error: 'id is required for detail' },
      { status: 400 }
    )
  }

  const reservation = await db.tableReservationSystem.findUnique({
    where: { id: reservationId }
  })

  if (!reservation) {
    return NextResponse.json(
      { error: 'Reservation not found' },
      { status: 404 }
    )
  }

  return NextResponse.json({ reservation })
}

// Search reservations by phone
async function searchReservations(phone: string | null) {
  if (!phone) {
    return NextResponse.json(
      { error: 'phone is required for search' },
      { status: 400 }
    )
  }

  const reservations = await db.tableReservationSystem.findMany({
    where: {
      customerPhone: { contains: phone }
    },
    orderBy: { createdAt: 'desc' },
    take: 20
  })

  return NextResponse.json({ reservations })
}

// Get reservation settings
async function getReservationSettings(merchantId: string | null) {
  if (!merchantId) {
    // Return default settings
    return NextResponse.json({
      settings: {
        onlineBookingEnabled: true,
        minAdvanceHours: 2,
        maxAdvanceDays: 30,
        bookingOpenTime: '09:00',
        bookingCloseTime: '21:00',
        slotDuration: 30,
        defaultReservationDuration: 90,
        maxPartySize: 20,
        depositEnabled: false,
        depositAmount: 0,
        depositPercent: 0,
        largePartyThreshold: 8,
        cancellationHours: 24,
        cancellationFee: 0,
        noShowFee: 0,
        reminderHours: 24,
        confirmationHours: 2,
        notifyOnBooking: true,
        notifyOnCancellation: true,
        notifyOnModification: true,
        notifyOnNoShow: true,
        holdTablesFor: 15,
      }
    })
  }

  const settings = await db.reservationSettings.findUnique({
    where: { merchantId }
  })

  return NextResponse.json({ settings })
}

// Get time slots
async function getTimeSlots(date: string | null, partySize: string | null) {
  if (!date) {
    return NextResponse.json(
      { error: 'date is required for slots' },
      { status: 400 }
    )
  }

  const slots = await db.reservationTimeSlot.findMany({
    where: {
      date,
      OR: [
        { tableId: null },
        { status: { not: 'closed' } }
      ]
    },
    orderBy: { time: 'asc' }
  })

  if (slots.length === 0) {
    // Generate default slots
    const defaultSlots = generateTimeSlots().map(slot => ({
      date,
      time: slot.time,
      duration: 90,
      maxCovers: 20,
      bookedCovers: 0,
      availableCovers: 20,
      status: 'available'
    }))

    return NextResponse.json({ slots: defaultSlots })
  }

  const requestedPartySize = partySize ? parseInt(partySize) : 0
  const filteredSlots = slots.filter(slot => 
    slot.availableCovers >= requestedPartySize || requestedPartySize === 0
  )

  return NextResponse.json({ slots: filteredSlots })
}

// Helper: Generate time slots
function generateTimeSlots() {
  const slots = []
  const startHour = 9
  const endHour = 21
  const interval = 30 // minutes

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += interval) {
      slots.push({
        time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      })
    }
  }

  return slots
}

// Helper: Convert time string to minutes
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// POST /api/merchant-os/reservations - Create reservation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      type = 'reservation',
      ...data
    } = body

    switch (type) {
      case 'reservation':
        return await createReservation(data)
      case 'settings':
        return await updateReservationSettings(data)
      case 'check-in':
        return await checkInReservation(data)
      case 'check-out':
        return await checkOutReservation(data)
      case 'cancel':
        return await cancelReservation(data)
      case 'confirm':
        return await confirmReservation(data)
      case 'reminder':
        return await sendReminder(data)
      default:
        return await createReservation(data)
    }
  } catch (error) {
    console.error('Error in reservations POST:', error)
    return NextResponse.json(
      { error: 'Failed to process reservation request' },
      { status: 500 }
    )
  }
}

// Create new reservation
async function createReservation(data: any) {
  const {
    customerName,
    customerPhone,
    customerEmail,
    reservationDate,
    reservationTime,
    partySize = 2,
    duration = 90,
    tableId,
    tableNumber,
    sectionId,
    sectionName,
    source = 'online',
    specialRequests,
    dietaryRequirements,
    occasion,
    depositRequired = false,
    depositAmount = 0,
    assignedWaiterId,
    assignedWaiterName,
  } = data

  if (!customerName || !customerPhone || !reservationDate || !reservationTime) {
    return NextResponse.json(
      { error: 'customerName, customerPhone, reservationDate, and reservationTime are required' },
      { status: 400 }
    )
  }

  // Generate reservation number
  const reservationNumber = `RES-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`

  // Check if time slot is available
  if (tableId) {
    const existingReservation = await db.tableReservationSystem.findFirst({
      where: {
        tableId,
        reservationDate,
        status: { in: ['pending', 'confirmed', 'seated'] },
        OR: [
          {
            reservationTime: {
              gte: reservationTime,
              lt: addMinutes(reservationTime, duration)
            }
          },
          {
            AND: [
              { reservationTime: { lte: reservationTime } },
              { reservationTime: { gte: subtractMinutes(reservationTime, 90) } }
            ]
          }
        ]
      }
    })

    if (existingReservation) {
      return NextResponse.json(
        { error: 'Table is not available for this time slot' },
        { status: 400 }
      )
    }
  }

  const reservation = await db.tableReservationSystem.create({
    data: {
      reservationNumber,
      customerName,
      customerPhone,
      customerEmail,
      reservationDate,
      reservationTime,
      partySize,
      duration,
      tableId,
      tableNumber,
      sectionId,
      sectionName,
      status: 'pending',
      source,
      specialRequests,
      dietaryRequirements,
      occasion,
      depositRequired,
      depositAmount,
      assignedWaiterId,
      assignedWaiterName,
    }
  })

  // Update time slot if applicable
  if (tableId) {
    await db.reservationTimeSlot.upsert({
      where: {
        tableId_date_time: {
          tableId,
          date: reservationDate,
          time: reservationTime
        }
      },
      create: {
        tableId,
        date: reservationDate,
        time: reservationTime,
        duration,
        maxCovers: 20,
        bookedCovers: partySize,
        availableCovers: 20 - partySize,
        status: partySize >= 15 ? 'limited' : 'available'
      },
      update: {
        bookedCovers: { increment: partySize },
        availableCovers: { decrement: partySize },
        status: 'limited'
      }
    })
  }

  return NextResponse.json({
    reservation,
    message: 'Reservation created successfully'
  }, { status: 201 })
}

// Update reservation settings
async function updateReservationSettings(data: any) {
  const { merchantId, ...settings } = data

  if (!merchantId) {
    return NextResponse.json(
      { error: 'merchantId is required' },
      { status: 400 }
    )
  }

  const updatedSettings = await db.reservationSettings.upsert({
    where: { merchantId },
    create: {
      merchantId,
      ...settings
    },
    update: {
      ...settings,
      updatedAt: new Date()
    }
  })

  return NextResponse.json({ settings: updatedSettings })
}

// Check in reservation
async function checkInReservation(data: any) {
  const { reservationId } = data

  if (!reservationId) {
    return NextResponse.json(
      { error: 'reservationId is required' },
      { status: 400 }
    )
  }

  const reservation = await db.tableReservationSystem.update({
    where: { id: reservationId },
    data: {
      status: 'seated',
      checkedInAt: new Date()
    }
  })

  // Update table status
  if (reservation.tableId) {
    await db.restaurantTable.update({
      where: { id: reservation.tableId },
      data: { status: 'occupied' }
    })
  }

  return NextResponse.json({
    reservation,
    message: 'Guest checked in successfully'
  })
}

// Check out reservation
async function checkOutReservation(data: any) {
  const { reservationId, actualDuration } = data

  if (!reservationId) {
    return NextResponse.json(
      { error: 'reservationId is required' },
      { status: 400 }
    )
  }

  const reservation = await db.tableReservationSystem.update({
    where: { id: reservationId },
    data: {
      status: 'completed',
      checkedOutAt: new Date(),
      actualDuration
    }
  })

  // Update table status
  if (reservation.tableId) {
    await db.restaurantTable.update({
      where: { id: reservation.tableId },
      data: { status: 'cleaning' }
    })
  }

  return NextResponse.json({
    reservation,
    message: 'Reservation completed'
  })
}

// Cancel reservation
async function cancelReservation(data: any) {
  const { reservationId, reason, cancelledBy } = data

  if (!reservationId) {
    return NextResponse.json(
      { error: 'reservationId is required' },
      { status: 400 }
    )
  }

  const reservation = await db.tableReservationSystem.update({
    where: { id: reservationId },
    data: {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelledBy,
      cancellationReason: reason
    }
  })

  // Process refund if deposit was paid
  if (reservation.depositPaid && reservation.depositRefundable) {
    await db.tableReservationSystem.update({
      where: { id: reservationId },
      data: {
        refundProcessed: true,
        refundAmount: reservation.depositAmount,
        refundedAt: new Date()
      }
    })
  }

  // Free up time slot
  if (reservation.tableId) {
    await db.reservationTimeSlot.updateMany({
      where: {
        tableId: reservation.tableId,
        date: reservation.reservationDate,
        time: reservation.reservationTime
      },
      data: {
        bookedCovers: { decrement: reservation.partySize },
        availableCovers: { increment: reservation.partySize },
        status: 'available'
      }
    })
  }

  return NextResponse.json({
    reservation,
    message: 'Reservation cancelled successfully'
  })
}

// Confirm reservation
async function confirmReservation(data: any) {
  const { reservationId } = data

  if (!reservationId) {
    return NextResponse.json(
      { error: 'reservationId is required' },
      { status: 400 }
    )
  }

  const reservation = await db.tableReservationSystem.update({
    where: { id: reservationId },
    data: {
      status: 'confirmed',
      confirmationSent: true,
      confirmationSentAt: new Date()
    }
  })

  return NextResponse.json({
    reservation,
    message: 'Reservation confirmed'
  })
}

// Send reminder
async function sendReminder(data: any) {
  const { reservationId } = data

  if (!reservationId) {
    return NextResponse.json(
      { error: 'reservationId is required' },
      { status: 400 }
    )
  }

  const reservation = await db.tableReservationSystem.update({
    where: { id: reservationId },
    data: {
      reminderSent: true,
      reminderSentAt: new Date()
    }
  })

  return NextResponse.json({
    success: true,
    message: 'Reminder sent successfully'
  })
}

// PUT /api/merchant-os/reservations - Update reservation
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { reservationId, ...updates } = body

    if (!reservationId) {
      return NextResponse.json(
        { error: 'reservationId is required' },
        { status: 400 }
      )
    }

    const reservation = await db.tableReservationSystem.update({
      where: { id: reservationId },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ reservation })
  } catch (error) {
    console.error('Error updating reservation:', error)
    return NextResponse.json(
      { error: 'Failed to update reservation' },
      { status: 500 }
    )
  }
}

// DELETE /api/merchant-os/reservations - Delete reservation
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reservationId = searchParams.get('reservationId')

    if (!reservationId) {
      return NextResponse.json(
        { error: 'reservationId is required' },
        { status: 400 }
      )
    }

    await db.tableReservationSystem.delete({
      where: { id: reservationId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting reservation:', error)
    return NextResponse.json(
      { error: 'Failed to delete reservation' },
      { status: 500 }
    )
  }
}

// Helper: Add minutes to time string
function addMinutes(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number)
  const totalMinutes = hours * 60 + mins + minutes
  const newHours = Math.floor(totalMinutes / 60) % 24
  const newMins = totalMinutes % 60
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`
}

// Helper: Subtract minutes from time string
function subtractMinutes(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number)
  let totalMinutes = hours * 60 + mins - minutes
  if (totalMinutes < 0) totalMinutes += 24 * 60
  const newHours = Math.floor(totalMinutes / 60) % 24
  const newMins = totalMinutes % 60
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`
}
