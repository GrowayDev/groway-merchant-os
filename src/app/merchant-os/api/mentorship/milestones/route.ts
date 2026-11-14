import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'


// GET /api/mentorship/milestones - List milestones
export async function GET(request: NextRequest) {
  try {
    const merchantId = 'merchant-001' // Simplified for dev environment
    if (!merchantId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const matchId = searchParams.get('matchId')

    const where: any = { merchantId }
    if (matchId) where.matchId = matchId

    const milestones = await db.mentorshipMilestone.findMany({
      where,
      include: { match: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: milestones })
  } catch (error) {
    console.error('Error fetching milestones:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch milestones' }, { status: 500 })
  }
}

// POST /api/mentorship/milestones - Create milestone
export async function POST(request: NextRequest) {
  try {
    const merchantId = 'merchant-001' // Simplified for dev environment
    if (!merchantId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { matchId, achievedById, authorRole, title, description, milestoneType = 'skill_acquired' } = body

    if (!title) {
      return NextResponse.json({ success: false, error: 'Missing required field: title' }, { status: 400 })
    }

    const milestone = await db.mentorshipMilestone.create({
      data: {
        id: crypto.randomUUID(),
        merchantId,
        matchId,
        achievedById,
        authorRole,
        title,
        description,
        milestoneType,
        achievementDate: new Date(),
        celebrated: false,
      },
    })

    return NextResponse.json({ success: true, data: milestone }, { status: 201 })
  } catch (error) {
    console.error('Error creating milestone:', error)
    return NextResponse.json({ success: false, error: 'Failed to create milestone' }, { status: 500 })
  }
}
