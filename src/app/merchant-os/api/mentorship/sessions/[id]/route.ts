import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/mentorship/sessions/[id] - Get session
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await db.mentorshipSession.findUnique({
      where: { id },
      include: { match: true, mentor: true, mentee: true },
    })

    if (!session) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: session })
  } catch (error) {
    console.error('Error fetching session:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch session' }, { status: 500 })
  }
}

// PATCH /api/mentorship/sessions/[id] - Update session (complete, cancel, add notes)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const session = await db.mentorshipSession.update({
      where: { id },
      data: {
        ...body,
        completedAt: body.status === 'completed' ? new Date() : undefined,
      },
    })

    return NextResponse.json({ success: true, data: session })
  } catch (error) {
    console.error('Error updating session:', error)
    return NextResponse.json({ success: false, error: 'Failed to update session' }, { status: 500 })
  }
}
