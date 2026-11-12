import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// GET /api/booking/services - List all booking services
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const active = searchParams.get('active')

    const where: Prisma.BookingServiceWhereInput = {}
    
    if (category) {
      where.category = category
    }
    if (active !== null) {
      where.active = active === 'true'
    }

    const services = await db.bookingService.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ],
      include: {
        _count: {
          select: { appointments: true, staffServices: true }
        }
      }
    })

    return NextResponse.json({ services })
  } catch (error) {
    console.error('Error fetching booking services:', error)
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 })
  }
}

// POST /api/booking/services - Create a new service
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const service = await db.bookingService.create({
      data: {
        name: body.name,
        category: body.category || 'general',
        duration: body.duration || 30,
        price: body.price || 0,
        description: body.description,
        depositRequired: body.depositRequired || false,
        depositAmount: body.depositAmount,
        depositPercentage: body.depositPercentage,
        bufferAfter: body.bufferAfter || 0,
        maxPerDay: body.maxPerDay,
        active: body.active ?? true
      }
    })

    return NextResponse.json({ service }, { status: 201 })
  } catch (error) {
    console.error('Error creating booking service:', error)
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 })
  }
}
