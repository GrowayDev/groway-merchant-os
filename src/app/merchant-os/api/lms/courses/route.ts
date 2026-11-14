import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getMerchantIdWithDevFallback } from '@/lib/auth-context'

// GET /api/lms/courses - List courses
export async function GET(request: NextRequest) {
  try {
    const merchantId = getMerchantIdWithDevFallback(request)
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: any = { merchantId }
    if (category) where.category = category
    if (status) where.status = status
    if (search) where.title = { contains: search }

    const courses = await db.course.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { modules: true, enrollments: true, assignments: true } },
      },
    })

    return NextResponse.json({ courses })
  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
  }
}

// POST /api/lms/courses - Create a course
export async function POST(request: NextRequest) {
  try {
    const merchantId = getMerchantIdWithDevFallback(request)
    const body = await request.json()

    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const course = await db.course.create({
      data: {
        id: `course_${Date.now()}`,
        merchantId,
        title: body.title,
        description: body.description || '',
        category: body.category || 'general',
        level: body.level || 'beginner',
        duration: body.duration || '',
        instructor: body.instructor || '',
        status: body.status || 'draft',
      },
    })

    return NextResponse.json({ course }, { status: 201 })
  } catch (error) {
    console.error('Error creating course:', error)
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 })
  }
}
