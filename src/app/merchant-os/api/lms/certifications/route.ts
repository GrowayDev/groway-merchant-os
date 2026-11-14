import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'


// GET /api/lms/certifications - List certifications
export async function GET(request: NextRequest) {
  try {
    const merchantId = 'merchant-001' // Simplified for dev environment
    if (!merchantId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const where: any = { merchantId }
    if (userId) where.userId = userId

    const certifications = await db.certification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: certifications })
  } catch (error) {
    console.error('Error fetching certifications:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch certifications' }, { status: 500 })
  }
}

// POST /api/lms/certifications - Issue a certification
export async function POST(request: NextRequest) {
  try {
    const merchantId = 'merchant-001' // Simplified for dev environment
    if (!merchantId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, courseId, certificateType = 'completion', level = 'bronze', expiryDate } = body

    if (!userId || !courseId) {
      return NextResponse.json({ success: false, error: 'Missing required fields: userId, courseId' }, { status: 400 })
    }

    const certification = await db.certification.create({
      data: {
        id: crypto.randomUUID(),
        merchantId,
        userId,
        courseId,
        certificateNumber: `CERT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        certificateType,
        level,
        issueDate: new Date(),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        status: 'active',
      },
    })

    return NextResponse.json({ success: true, data: certification }, { status: 201 })
  } catch (error) {
    console.error('Error creating certification:', error)
    return NextResponse.json({ success: false, error: 'Failed to create certification' }, { status: 500 })
  }
}
