import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/mentorship/matches/[id] - Get match detail
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const match = await db.mentorshipMatch.findUnique({
      where: { id },
      include: {
        mentor: true,
        mentee: true,
        program: true,
        sessions: { orderBy: { scheduledDate: 'desc' } },
        goals: { orderBy: { createdAt: 'desc' } },
        journals: { orderBy: { createdAt: 'desc' } },
        milestones: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!match) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: match })
  } catch (error) {
    console.error('Error fetching match:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch match' }, { status: 500 })
  }
}

// PATCH /api/mentorship/matches/[id] - Update match
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const match = await db.mentorshipMatch.update({
      where: { id },
      data: body,
    })

    return NextResponse.json({ success: true, data: match })
  } catch (error) {
    console.error('Error updating match:', error)
    return NextResponse.json({ success: false, error: 'Failed to update match' }, { status: 500 })
  }
}
