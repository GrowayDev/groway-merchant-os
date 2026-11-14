import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getMerchantIdWithDevFallback } from '@/lib/auth-context'

// GET /api/lms/courses/[id]
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const merchantId = getMerchantIdWithDevFallback(request)
    const course = await db.course.findFirst({
      where: { id: params.id, merchantId },
      include: {
        modules: { orderBy: { order: 'asc' } },
        enrollments: { orderBy: { enrolledAt: 'desc' } },
        assignments: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }
    return NextResponse.json({ course })
  } catch (error) {
    console.error('Error fetching course:', error)
    return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 })
  }
}

// PUT /api/lms/courses/[id]
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const merchantId = getMerchantIdWithDevFallback(request)
    const body = await request.json()

    await db.course.updateMany({
      where: { id: params.id, merchantId },
      data: {
        title: body.title,
        description: body.description,
        category: body.category,
        level: body.level,
        duration: body.duration,
        instructor: body.instructor,
        status: body.status,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating course:', error)
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 })
  }
}

// DELETE /api/lms/courses/[id]
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const merchantId = getMerchantIdWithDevFallback(request)
    await db.course.deleteMany({ where: { id: params.id, merchantId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting course:', error)
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 })
  }
}
