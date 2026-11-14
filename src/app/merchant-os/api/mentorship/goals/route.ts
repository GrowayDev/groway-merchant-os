import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'


// GET /api/mentorship/goals - List goals
export async function GET(request: NextRequest) {
  try {
    const merchantId = 'merchant-001' // Simplified for dev environment
    if (!merchantId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const matchId = searchParams.get('matchId')
    const category = searchParams.get('category')
    const status = searchParams.get('status')

    const where: any = { merchantId }
    if (matchId) where.matchId = matchId
    if (category) where.category = category
    if (status) where.status = status

    const goals = await db.mentorshipGoal.findMany({
      where,
      include: { match: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: goals })
  } catch (error) {
    console.error('Error fetching goals:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch goals' }, { status: 500 })
  }
}

// POST /api/mentorship/goals - Create a goal
export async function POST(request: NextRequest) {
  try {
    const merchantId = 'merchant-001' // Simplified for dev environment
    if (!merchantId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { matchId, title, description, category = 'business_skills', targetMetric, currentValue, targetValue, deadline } = body

    if (!matchId || !title) {
      return NextResponse.json({ success: false, error: 'Missing required fields: matchId, title' }, { status: 400 })
    }

    const goal = await db.mentorshipGoal.create({
      data: {
        id: crypto.randomUUID(),
        merchantId,
        matchId,
        title,
        description,
        category,
        targetMetric,
        currentValue,
        targetValue,
        deadline,
        status: 'not_started',
        progress: 0,
      },
    })

    return NextResponse.json({ success: true, data: goal }, { status: 201 })
  } catch (error) {
    console.error('Error creating goal:', error)
    return NextResponse.json({ success: false, error: 'Failed to create goal' }, { status: 500 })
  }
}
