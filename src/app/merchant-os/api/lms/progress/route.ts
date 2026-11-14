import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'


// POST /api/lms/progress - Update lesson progress
export async function POST(request: NextRequest) {
  try {
    const merchantId = 'merchant-001' // Simplified for dev environment
    if (!merchantId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { enrollmentId, moduleId, status, score } = body

    if (!enrollmentId || !moduleId || !status) {
      return NextResponse.json({ success: false, error: 'Missing required fields: enrollmentId, moduleId, status' }, { status: 400 })
    }

    // Upsert lesson progress
    const progress = await db.lessonProgress.upsert({
      where: { enrollmentId_moduleId: { enrollmentId, moduleId } },
      create: {
        id: crypto.randomUUID(),
        enrollmentId,
        moduleId,
        merchantId,
        status,
        score: score ?? null,
        completedAt: status === 'completed' ? new Date() : null,
      },
      update: {
        status,
        score: score ?? undefined,
        timeSpentMinutes: { increment: 1 },
        attempts: { increment: 1 },
        completedAt: status === 'completed' ? new Date() : undefined,
      },
    })

    return NextResponse.json({ success: true, data: progress })
  } catch (error) {
    console.error('Error updating lesson progress:', error)
    return NextResponse.json({ success: false, error: 'Failed to update lesson progress' }, { status: 500 })
  }
}
