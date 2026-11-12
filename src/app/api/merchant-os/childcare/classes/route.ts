import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

// GET /api/merchant-os/childcare/classes - Get all classes for a merchant
export async function GET(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id') || 
                       request.nextUrl.searchParams.get('merchantId')

    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID required' }, { status: 400 })
    }

    const classes = await db.childcareClass.findMany({
      where: { merchantId },
      include: {
        _count: {
          select: { ChildcareChild: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    // Transform to match frontend interface
    const transformedClasses = classes.map(cls => ({
      id: cls.id,
      name: cls.name,
      ageGroup: cls.ageGroup,
      minAge: cls.minAge,
      maxAge: cls.maxAge,
      capacity: cls.capacity,
      currentEnrollment: cls._count.ChildcareChild,
      staffRatio: cls.staffRatio,
      assignedStaff: [],
      schedule: {
        openTime: cls.openTime || '07:00',
        closeTime: cls.closeTime || '18:00'
      },
      roomNumber: cls.roomNumber,
      status: cls.status
    }))

    return NextResponse.json({ classes: transformedClasses })
  } catch (error) {
    console.error('Error fetching classes:', error)
    return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 })
  }
}

// POST /api/merchant-os/childcare/classes - Create a new class
export async function POST(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id') ||
                       request.nextUrl.searchParams.get('merchantId')

    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID required' }, { status: 400 })
    }

    const body = await request.json()
    const classId = `CLS-${nanoid(8).toUpperCase()}`

    const newClass = await db.childcareClass.create({
      data: {
        id: classId,
        merchantId,
        name: body.name,
        ageGroup: body.ageGroup || 'preschool',
        minAge: body.minAge || 0,
        maxAge: body.maxAge || 6,
        capacity: body.capacity || 20,
        currentEnrollment: 0,
        staffRatio: body.staffRatio,
        openTime: body.openTime || '07:00',
        closeTime: body.closeTime || '18:00',
        roomNumber: body.roomNumber,
        status: body.status || 'active'
      }
    })

    return NextResponse.json({ success: true, class: newClass })
  } catch (error) {
    console.error('Error creating class:', error)
    return NextResponse.json({ error: 'Failed to create class' }, { status: 500 })
  }
}
