import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/booking/services/[id] - Get a specific service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const service = await db.bookingService.findUnique({
      where: { id },
      include: {
        staffServices: {
          include: {
            staff: true
          }
        },
        _count: {
          select: { appointments: true }
        }
      }
    })

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    return NextResponse.json({ service })
  } catch (error) {
    console.error('Error fetching service:', error)
    return NextResponse.json({ error: 'Failed to fetch service' }, { status: 500 })
  }
}

// PUT /api/booking/services/[id] - Update a service
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const service = await db.bookingService.update({
      where: { id },
      data: {
        name: body.name,
        category: body.category,
        duration: body.duration,
        price: body.price,
        description: body.description,
        depositRequired: body.depositRequired,
        depositAmount: body.depositAmount,
        depositPercentage: body.depositPercentage,
        bufferAfter: body.bufferAfter,
        maxPerDay: body.maxPerDay,
        active: body.active
      }
    })

    return NextResponse.json({ service })
  } catch (error) {
    console.error('Error updating service:', error)
    return NextResponse.json({ error: 'Failed to update service' }, { status: 500 })
  }
}

// DELETE /api/booking/services/[id] - Delete a service
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await db.bookingService.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting service:', error)
    return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 })
  }
}
