import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getMerchantIdWithDevFallback } from '@/lib/auth-context'

// GET /api/lms/enrollments
export async function GET(request: NextRequest) {
  try {
    const merchantId = getMerchantIdWithDevFallback(request)
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const staffId = searchParams.get('staffId')

    const where: any = { merchantId }
    if (courseId) where.courseId = courseId
    if (staffId) where.staffId = staffId

    const enrollments = await db.courseEnrollment.findMany({
      where,
      orderBy: { enrolledAt: 'desc' },
    })

    return NextResponse.json({ enrollments })
  } catch (error) {
    console.error('Error fetching enrollments:', error)
    return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 })
  }
}

// POST /api/lms/enrollments
export async function POST(request: NextRequest) {
  try {
    const merchantId = getMerchantIdWithDevFallback(request)
    const body = await request.json()

    if (!body.courseId || !body.staffId || !body.staffName) {
      return NextResponse.json({ error: 'courseId, staffId, and staffName are required' }, { status: 400 })
    }

    const enrollment = await db.courseEnrollment.create({
      data: {
        id: `enrollment_${Date.now()}`,
        merchantId,
        courseId: body.courseId,
        staffId: body.staffId,
        staffName: body.staffName,
      },
    })

    return NextResponse.json({ enrollment }, { status: 201 })
  } catch (error) {
    console.error('Error creating enrollment:', error)
    return NextResponse.json({ error: 'Failed to create enrollment' }, { status: 500 })
  }
}
