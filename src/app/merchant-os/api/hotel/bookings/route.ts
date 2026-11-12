import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: List bookings with guest details
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const guestId = searchParams.get('guestId')
    const roomId = searchParams.get('roomId')
    const checkInFrom = searchParams.get('checkInFrom')
    const checkInTo = searchParams.get('checkInTo')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}

    if (status) {
      where.status = status
    }

    if (guestId) {
      where.guestId = guestId
    }

    if (roomId) {
      where.roomId = roomId
    }

    if (checkInFrom || checkInTo) {
      const dateFilter: Record<string, unknown> = {}
      if (checkInFrom) dateFilter.gte = checkInFrom
      if (checkInTo) dateFilter.lte = checkInTo
      where.checkIn = dateFilter
    }

    if (search) {
      where.OR = [
        { confirmationCode: { contains: search } },
        { HotelGuest: { name: { contains: search } } }
      ]
    }

    const bookings = await db.hotelReservation.findMany({
      where,
      include: {
        HotelGuest: true,
        HotelRoom: true,
        HotelFolio: {
          include: {
            HotelFolioCharge: true,
            HotelFolioPayment: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate summary statistics
    const summary = {
      total: bookings.length,
      confirmed: 0,
      checked_in: 0,
      checked_out: 0,
      cancelled: 0,
      no_show: 0,
      totalRevenue: 0,
      totalNights: 0,
      averageStay: 0,
      upcomingCheckIns: 0,
      upcomingCheckOuts: 0
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const bookingsWithDetails = bookings.map(booking => {
      // Count by status
      switch (booking.status) {
        case 'confirmed': summary.confirmed++; break
        case 'checked_in': summary.checked_in++; break
        case 'checked_out': summary.checked_out++; break
        case 'cancelled': summary.cancelled++; break
        case 'no_show': summary.no_show++; break
      }

      // Calculate nights
      const checkIn = new Date(booking.checkIn)
      const checkOut = new Date(booking.checkOut)
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
      summary.totalNights += nights

      // Sum revenue (only confirmed/checked_in/checked_out)
      if (['confirmed', 'checked_in', 'checked_out'].includes(booking.status)) {
        summary.totalRevenue += booking.totalAmount
      }

      // Check upcoming check-ins and check-outs
      const checkInDate = new Date(booking.checkIn)
      const checkOutDate = new Date(booking.checkOut)
      checkInDate.setHours(0, 0, 0, 0)
      checkOutDate.setHours(0, 0, 0, 0)

      if (booking.status === 'confirmed' && checkInDate.getTime() === today.getTime()) {
        summary.upcomingCheckIns++
      }
      if (booking.status === 'checked_in' && checkOutDate.getTime() === today.getTime()) {
        summary.upcomingCheckOuts++
      }

      // Calculate folio balance
      const folio = booking.HotelFolio
      const totalCharges = folio?.HotelFolioCharge?.reduce((sum: number, c) => sum + c.amount, 0) || 0
      const totalPayments = folio?.HotelFolioPayment?.reduce((sum: number, p) => sum + p.amount, 0) || 0
      const folioBalance = totalCharges - totalPayments

      return {
        ...booking,
        nights,
        guest: booking.HotelGuest,
        room: booking.HotelRoom,
        folio: folio ? {
          ...folio,
          totalCharges,
          totalPayments,
          balance: folioBalance
        } : null,
        isTodayCheckIn: checkInDate.getTime() === today.getTime() && booking.status === 'confirmed',
        isTodayCheckOut: checkOutDate.getTime() === today.getTime() && booking.status === 'checked_in'
      }
    })

    // Calculate average stay
    summary.averageStay = bookings.length > 0 ? summary.totalNights / bookings.length : 0

    return NextResponse.json({
      success: true,
      data: bookingsWithDetails,
      summary,
      statusOptions: [
        { value: 'confirmed', label: 'Confirmed', color: 'blue' },
        { value: 'checked_in', label: 'Checked In', color: 'green' },
        { value: 'checked_out', label: 'Checked Out', color: 'gray' },
        { value: 'cancelled', label: 'Cancelled', color: 'red' },
        { value: 'no_show', label: 'No Show', color: 'orange' }
      ],
      sources: [
        { value: 'direct', label: 'Direct Booking' },
        { value: 'booking.com', label: 'Booking.com' },
        { value: 'airbnb', label: 'Airbnb' },
        { value: 'expedia', label: 'Expedia' },
        { value: 'phone', label: 'Phone' },
        { value: 'walk_in', label: 'Walk-in' }
      ]
    })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}

// POST: Create new booking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      guestId,
      roomId,
      roomType,
      checkIn,
      checkOut,
      adults,
      children,
      source,
      channelBookingId,
      specialRequests,
      totalAmount,
      commission
    } = body

    if (!guestId || !checkIn || !checkOut) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: guestId, checkIn, checkOut' },
        { status: 400 }
      )
    }

    // Generate confirmation code
    const confirmationCode = `HB-${Date.now().toString(36).toUpperCase()}`

    // Check room availability
    if (roomId) {
      const existingBooking = await db.hotelReservation.findFirst({
        where: {
          roomId,
          status: { in: ['confirmed', 'checked_in'] },
          OR: [
            {
              checkIn: { lte: checkOut },
              checkOut: { gte: checkIn }
            }
          ]
        }
      })

      if (existingBooking) {
        return NextResponse.json(
          { success: false, error: 'Room is not available for the selected dates' },
          { status: 400 }
        )
      }
    }

    // Get room details if roomId provided
    let roomData = null
    if (roomId) {
      roomData = await db.hotelRoom.findUnique({
        where: { id: roomId }
      })
      if (!roomData) {
        return NextResponse.json(
          { success: false, error: 'Room not found' },
          { status: 404 }
        )
      }
    }

    // Calculate total amount if not provided
    let calculatedTotal = totalAmount
    if (!calculatedTotal && roomData) {
      const nights = Math.ceil(
        (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
      )
      calculatedTotal = roomData.price * nights
    }

    // Create booking
    const booking = await db.hotelReservation.create({
      data: {
        confirmationCode,
        guestId,
        roomId,
        roomType: roomType || roomData?.type || 'double',
        checkIn,
        checkOut,
        adults: adults || 1,
        children: children || 0,
        status: 'confirmed',
        source: source || 'direct',
        channelBookingId,
        specialRequests,
        totalAmount: calculatedTotal || 0,
        commission: commission || 0,
        paid: false
      },
      include: {
        HotelGuest: true,
        HotelRoom: true
      }
    })

    // Create folio
    await db.hotelFolio.create({
      data: {
        folioNumber: `FOL-${confirmationCode}`,
        guestId,
        reservationId: booking.id,
        roomNumber: roomData?.number || 'TBD',
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        status: 'open',
        balance: calculatedTotal || 0
      }
    })

    return NextResponse.json({
      success: true,
      data: booking,
      message: 'Booking created successfully',
      confirmationCode
    })
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}

// PATCH: Update booking status (check-in, check-out, cancel)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookingId, status, notes } = body

    if (!bookingId || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: bookingId, status' },
        { status: 400 }
      )
    }

    // Get booking
    const booking = await db.hotelReservation.findUnique({
      where: { id: bookingId },
      include: { HotelRoom: true }
    })

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = { status }

    // Handle status-specific actions
    switch (status) {
      case 'checked_in':
        // Update room status to occupied
        if (booking.roomId) {
          await db.hotelRoom.update({
            where: { id: booking.roomId },
            data: { status: 'occupied' }
          })
        }
        break

      case 'checked_out':
        // Update room status to cleaning
        if (booking.roomId) {
          await db.hotelRoom.update({
            where: { id: booking.roomId },
            data: { status: 'cleaning' }
          })
        }
        // Close folio if open
        await db.hotelFolio.updateMany({
          where: { reservationId: bookingId, status: 'open' },
          data: { status: 'closed' }
        })
        break

      case 'cancelled':
        // Release room
        if (booking.roomId) {
          await db.hotelRoom.update({
            where: { id: booking.roomId },
            data: { status: 'available' }
          })
        }
        break
    }

    const updatedBooking = await db.hotelReservation.update({
      where: { id: bookingId },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: updatedBooking,
      message: `Booking ${status.replace('_', ' ')} successfully`
    })
  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update booking' },
      { status: 500 }
    )
  }
}
