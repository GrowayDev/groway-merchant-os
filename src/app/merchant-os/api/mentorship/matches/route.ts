import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'


// GET /api/mentorship/matches - List mentorship matches
export async function GET(request: NextRequest) {
  try {
    const merchantId = 'merchant-001' // Simplified for dev environment
    if (!merchantId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const mentorId = searchParams.get('mentorId')
    const menteeId = searchParams.get('menteeId')

    const where: any = { merchantId }
    if (status) where.status = status
    if (mentorId) where.mentorId = mentorId
    if (menteeId) where.menteeId = menteeId

    const matches = await db.mentorshipMatch.findMany({
      where,
      include: { mentor: true, mentee: true, program: true, sessions: true, goals: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: matches })
  } catch (error) {
    console.error('Error fetching matches:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch matches' }, { status: 500 })
  }
}

// POST /api/mentorship/matches - Create a mentorship match
export async function POST(request: NextRequest) {
  try {
    const merchantId = 'merchant-001' // Simplified for dev environment
    if (!merchantId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { mentorId, menteeId, programId, matchScore, mentorshipStyle, focusAreas, communicationFrequency = 'weekly' } = body

    if (!mentorId || !menteeId) {
      return NextResponse.json({ success: false, error: 'Missing required fields: mentorId, menteeId' }, { status: 400 })
    }

    const match = await db.mentorshipMatch.create({
      data: {
        id: crypto.randomUUID(),
        merchantId,
        mentorId,
        menteeId,
        programId,
        status: 'pending',
        matchScore,
        mentorshipStyle,
        focusAreas: focusAreas ? JSON.stringify(focusAreas) : null,
        communicationFrequency,
      },
    })

    return NextResponse.json({ success: true, data: match }, { status: 201 })
  } catch (error) {
    console.error('Error creating match:', error)
    return NextResponse.json({ success: false, error: 'Failed to create match' }, { status: 500 })
  }
}
