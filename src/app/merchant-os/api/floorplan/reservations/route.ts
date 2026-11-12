import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Fetch all reservations
export async function GET(request: NextRequest) {
  try {
    const reservations = await db.tableReservation.findMany({
      include: {
        RestaurantTable: {
          include: {
            FloorSection: true,
          },
        },
      },
      orderBy: { time: 'asc' },
    })
    
    // Transform to match expected format
    const transformedReservations = reservations.map(reservation => ({
      ...reservation,
      table: {
        ...reservation.RestaurantTable,
        section: reservation.RestaurantTable?.FloorSection,
      },
    }))
    
    return NextResponse.json(transformedReservations)
  } catch (error) {
    console.error('Error fetching reservations:', error)
    return NextResponse.json({ error: 'Failed to fetch reservations' }, { status: 500 })
  }
}

// POST - Create a new reservation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tableId, customerName, phone, time, guests, notes } = body

    if (!tableId || !customerName || !time) {
      return NextResponse.json({ error: 'Table, customer name, and time are required' }, { status: 400 })
    }

    // Create reservation and update table status
    const reservation = await db.tableReservation.create({
      data: {
        id: `reservation-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        tableId,
        customerName,
        phone,
        time,
        guests: guests || 2,
        notes,
        updatedAt: new Date(),
      },
      include: {
        RestaurantTable: true,
      },
    })

    // Update table status to reserved
    await db.restaurantTable.update({
      where: { id: tableId },
      data: { status: 'reserved' },
    })
    
    // Transform to match expected format
    const transformedReservation = {
      ...reservation,
      table: reservation.RestaurantTable,
    }

    return NextResponse.json(transformedReservation, { status: 201 })
  } catch (error) {
    console.error('Error creating reservation:', error)
    return NextResponse.json({ error: 'Failed to create reservation' }, { status: 500 })
  }
}
