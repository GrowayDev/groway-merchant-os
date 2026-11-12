import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: List guests with stay history
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const vipStatus = searchParams.get('vipStatus')
    const limit = parseInt(searchParams.get('limit') || '100')

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
        { idNumber: { contains: search } }
      ]
    }

    if (vipStatus) {
      where.vipStatus = vipStatus
    }

    const guests = await db.hotelGuest.findMany({
      where,
      include: {
        HotelReservation: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      },
      take: limit,
      orderBy: { name: 'asc' }
    })

    // Calculate summary statistics
    const summary = {
      total: guests.length,
      regular: 0,
      silver: 0,
      gold: 0,
      platinum: 0,
      totalStays: 0,
      totalRevenue: 0
    }

    const guestsWithHistory = guests.map(guest => {
      // Count by VIP status
      switch (guest.vipStatus) {
        case 'regular': summary.regular++; break
        case 'silver': summary.silver++; break
        case 'gold': summary.gold++; break
        case 'platinum': summary.platinum++; break
      }

      // Sum totals
      summary.totalStays += guest.totalStays
      summary.totalRevenue += guest.totalSpent

      // Calculate last stay info
      const lastReservation = guest.HotelReservation[0]
      const lastStay = lastReservation ? {
        confirmationCode: lastReservation.confirmationCode,
        checkIn: lastReservation.checkIn,
        checkOut: lastReservation.checkOut,
        roomType: lastReservation.roomType
      } : null

      return {
        ...guest,
        lastStay,
        recentStays: guest.HotelReservation.length,
        lifetimeValue: guest.totalSpent,
        isVip: guest.vipStatus !== 'regular'
      }
    })

    return NextResponse.json({
      success: true,
      data: guestsWithHistory,
      summary,
      vipLevels: [
        { value: 'regular', label: 'Regular', minStays: 0, discount: 0 },
        { value: 'silver', label: 'Silver', minStays: 5, discount: 5 },
        { value: 'gold', label: 'Gold', minStays: 15, discount: 10 },
        { value: 'platinum', label: 'Platinum', minStays: 30, discount: 15 }
      ]
    })
  } catch (error) {
    console.error('Error fetching guests:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch guests' },
      { status: 500 }
    )
  }
}

// POST: Register new guest
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      phone,
      email,
      idNumber,
      idType,
      nationality,
      address,
      notes
    } = body

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Guest name is required' },
        { status: 400 }
      )
    }

    // Check for duplicate by ID number or email
    if (idNumber) {
      const existingById = await db.hotelGuest.findFirst({
        where: { idNumber }
      })
      if (existingById) {
        return NextResponse.json({
          success: true,
          data: existingById,
          message: 'Guest already exists',
          isExisting: true
        })
      }
    }

    if (email) {
      const existingByEmail = await db.hotelGuest.findFirst({
        where: { email }
      })
      if (existingByEmail) {
        return NextResponse.json({
          success: true,
          data: existingByEmail,
          message: 'Guest already exists',
          isExisting: true
        })
      }
    }

    const guest = await db.hotelGuest.create({
      data: {
        name,
        phone,
        email,
        idNumber,
        idType: idType || 'sa_id',
        nationality,
        address,
        notes,
        vipStatus: 'regular',
        totalStays: 0,
        totalSpent: 0
      }
    })

    return NextResponse.json({
      success: true,
      data: guest,
      message: 'Guest registered successfully'
    })
  } catch (error) {
    console.error('Error registering guest:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to register guest' },
      { status: 500 }
    )
  }
}

// PATCH: Update guest info or VIP status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      guestId,
      name,
      phone,
      email,
      idNumber,
      idType,
      nationality,
      address,
      vipStatus,
      notes
    } = body

    if (!guestId) {
      return NextResponse.json(
        { success: false, error: 'guestId is required' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (email !== undefined) updateData.email = email
    if (idNumber !== undefined) updateData.idNumber = idNumber
    if (idType !== undefined) updateData.idType = idType
    if (nationality !== undefined) updateData.nationality = nationality
    if (address !== undefined) updateData.address = address
    if (vipStatus !== undefined) updateData.vipStatus = vipStatus
    if (notes !== undefined) updateData.notes = notes

    const updatedGuest = await db.hotelGuest.update({
      where: { id: guestId },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: updatedGuest,
      message: 'Guest updated successfully'
    })
  } catch (error) {
    console.error('Error updating guest:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update guest' },
      { status: 500 }
    )
  }
}

// GET /guests/[id] - Get guest details with full history
export async function getGuestDetails(guestId: string) {
  const guest = await db.hotelGuest.findUnique({
    where: { id: guestId },
    include: {
      HotelReservation: {
        include: {
          HotelRoom: true
        },
        orderBy: { createdAt: 'desc' }
      },
      HotelFolio: {
        include: {
          HotelFolioCharge: {
            orderBy: { date: 'desc' }
          },
          HotelFolioPayment: {
            orderBy: { date: 'desc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!guest) {
    return null
  }

  // Calculate statistics
  const totalBookings = guest.HotelReservation.length
  const completedStays = guest.HotelReservation.filter(r => r.status === 'checked_out').length
  const cancelledBookings = guest.HotelReservation.filter(r => r.status === 'cancelled').length
  const totalNights = guest.HotelReservation.reduce((sum, r) => {
    const nights = Math.ceil(
      (new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) / (1000 * 60 * 60 * 24)
    )
    return sum + (r.status === 'checked_out' ? nights : 0)
  }, 0)

  // Favorite room type
  const roomTypes: Record<string, number> = {}
  guest.HotelReservation.forEach(r => {
    roomTypes[r.roomType] = (roomTypes[r.roomType] || 0) + 1
  })
  const favoriteRoomType = Object.entries(roomTypes).sort((a, b) => b[1] - a[1])[0]?.[0]

  return {
    ...guest,
    statistics: {
      totalBookings,
      completedStays,
      cancelledBookings,
      totalNights,
      averageStayLength: completedStays > 0 ? totalNights / completedStays : 0,
      favoriteRoomType
    }
  }
}

// PUT: Record payment for guest
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { guestId, folioId, amount, method, reference, notes } = body

    if (!guestId || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: guestId, amount' },
        { status: 400 }
      )
    }

    // Create payment record
    const payment = await db.hotelFolioPayment.create({
      data: {
        folioId: folioId || 'unknown',
        date: new Date(),
        amount: parseFloat(amount),
        method: method || 'cash',
        reference,
        notes
      }
    })

    // Update guest total spent
    await db.hotelGuest.update({
      where: { id: guestId },
      data: {
        totalSpent: {
          increment: parseFloat(amount)
        }
      }
    })

    // Update folio balance if folioId provided
    if (folioId && folioId !== 'unknown') {
      const folio = await db.hotelFolio.findUnique({
        where: { id: folioId }
      })
      if (folio) {
        const newBalance = folio.balance - parseFloat(amount)
        await db.hotelFolio.update({
          where: { id: folioId },
          data: {
            balance: newBalance,
            status: newBalance <= 0 ? 'closed' : 'open'
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: payment,
      message: 'Payment recorded successfully'
    })
  } catch (error) {
    console.error('Error recording payment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to record payment' },
      { status: 500 }
    )
  }
}
