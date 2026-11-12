import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// GET /api/booking/staff - List all staff members
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const serviceId = searchParams.get('serviceId')

    const where: Prisma.StaffWhereInput = {}
    
    if (status) {
      where.status = status
    }
    if (serviceId) {
      where.services = {
        some: { serviceId }
      }
    }

    const staff = await db.staff.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        services: {
          include: {
            service: true
          }
        },
        _count: {
          select: { appointments: true }
        }
      }
    })

    return NextResponse.json({ staff })
  } catch (error) {
    console.error('Error fetching staff:', error)
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 })
  }
}

// POST /api/booking/staff - Create a new staff member
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const staff = await db.staff.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        avatar: body.avatar,
        color: body.color || '#00897B',
        status: body.status || 'active',
        role: body.role || 'staff',
        specialties: body.specialties ? JSON.stringify(body.specialties) : null,
        workingHours: body.workingHours ? JSON.stringify(body.workingHours) : null
      }
    })

    // If services are provided, create staff-service relations
    if (body.serviceIds && body.serviceIds.length > 0) {
      await db.staffService.createMany({
        data: body.serviceIds.map((serviceId: string) => ({
          staffId: staff.id,
          serviceId
        }))
      })
    }

    return NextResponse.json({ staff }, { status: 201 })
  } catch (error) {
    console.error('Error creating staff:', error)
    return NextResponse.json({ error: 'Failed to create staff' }, { status: 500 })
  }
}
