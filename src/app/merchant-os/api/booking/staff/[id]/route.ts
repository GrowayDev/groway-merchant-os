import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/booking/staff/[id] - Get a specific staff member
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const staff = await db.staff.findUnique({
      where: { id },
      include: {
        services: {
          include: {
            service: true
          }
        },
        breaks: {
          where: {
            date: {
              gte: new Date().toISOString().split('T')[0]
            }
          },
          orderBy: { date: 'asc' }
        },
        _count: {
          select: { appointments: true }
        }
      }
    })

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    return NextResponse.json({ staff })
  } catch (error) {
    console.error('Error fetching staff:', error)
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 })
  }
}

// PUT /api/booking/staff/[id] - Update a staff member
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const staff = await db.staff.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        avatar: body.avatar,
        color: body.color,
        status: body.status,
        role: body.role,
        specialties: body.specialties ? JSON.stringify(body.specialties) : undefined,
        workingHours: body.workingHours ? JSON.stringify(body.workingHours) : undefined,
        rating: body.rating,
        reviewCount: body.reviewCount
      }
    })

    return NextResponse.json({ staff })
  } catch (error) {
    console.error('Error updating staff:', error)
    return NextResponse.json({ error: 'Failed to update staff' }, { status: 500 })
  }
}

// DELETE /api/booking/staff/[id] - Delete a staff member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await db.staff.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting staff:', error)
    return NextResponse.json({ error: 'Failed to delete staff' }, { status: 500 })
  }
}
