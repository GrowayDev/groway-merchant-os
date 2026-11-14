import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/lms/enrollments/[id] - Get enrollment with progress
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const enrollment = await db.courseEnrollment.findUnique({
      where: { id },
      include: {
        course: true,
        lessonProgress: { include: { module: true } },
      },
    })

    if (!enrollment) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: enrollment })
  } catch (error) {
    console.error('Error fetching enrollment:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch enrollment' }, { status: 500 })
  }
}

// PATCH /api/lms/enrollments/[id] - Update enrollment status/progress
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const enrollment = await db.courseEnrollment.update({
      where: { id },
      data: body,
    })

    return NextResponse.json({ success: true, data: enrollment })
  } catch (error) {
    console.error('Error updating enrollment:', error)
    return NextResponse.json({ success: false, error: 'Failed to update enrollment' }, { status: 500 })
  }
}
