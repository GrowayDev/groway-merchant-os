import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/mentorship/goals/[id] - Get goal
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const goal = await db.mentorshipGoal.findUnique({
      where: { id },
      include: { match: true },
    })

    if (!goal) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: goal })
  } catch (error) {
    console.error('Error fetching goal:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch goal' }, { status: 500 })
  }
}

// PATCH /api/mentorship/goals/[id] - Update goal progress/status
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const goal = await db.mentorshipGoal.update({
      where: { id },
      data: body,
    })

    return NextResponse.json({ success: true, data: goal })
  } catch (error) {
    console.error('Error updating goal:', error)
    return NextResponse.json({ success: false, error: 'Failed to update goal' }, { status: 500 })
  }
}

// DELETE /api/mentorship/goals/[id] - Delete goal
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.mentorshipGoal.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Goal deleted' })
  } catch (error) {
    console.error('Error deleting goal:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete goal' }, { status: 500 })
  }
}
