import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
}

// PUT - Update a reservation
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const { customerName, phone, time, guests, notes } = body

    const reservation = await db.tableReservation.update({
      where: { id },
      data: {
        ...(customerName !== undefined && { customerName }),
        ...(phone !== undefined && { phone }),
        ...(time !== undefined && { time }),
        ...(guests !== undefined && { guests }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        RestaurantTable: true,
      },
    })
    
    // Transform to match expected format
    const transformedReservation = {
      ...reservation,
      table: reservation.RestaurantTable,
    }
    
    return NextResponse.json(transformedReservation)
  } catch (error) {
    console.error('Error updating reservation:', error)
    return NextResponse.json({ error: 'Failed to update reservation' }, { status: 500 })
  }
}

// DELETE - Cancel a reservation
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    
    // Get the reservation to find the table
    const reservation = await db.tableReservation.findUnique({
      where: { id },
    })
    
    if (reservation) {
      // Update table status to available
      await db.restaurantTable.update({
        where: { id: reservation.tableId },
        data: { status: 'available' },
      })
      
      // Delete the reservation
      await db.tableReservation.delete({
        where: { id },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error cancelling reservation:', error)
    return NextResponse.json({ error: 'Failed to cancel reservation' }, { status: 500 })
  }
}
