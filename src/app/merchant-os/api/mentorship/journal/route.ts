import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'


// GET /api/mentorship/journal - List journal entries
export async function GET(request: NextRequest) {
  try {
    const merchantId = 'merchant-001' // Simplified for dev environment
    if (!merchantId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const matchId = searchParams.get('matchId')
    const authorId = searchParams.get('authorId')

    const where: any = { merchantId }
    if (matchId) where.matchId = matchId
    if (authorId) where.authorId = authorId

    const entries = await db.mentorshipJournal.findMany({
      where,
      include: { match: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: entries })
  } catch (error) {
    console.error('Error fetching journal entries:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch journal entries' }, { status: 500 })
  }
}

// POST /api/mentorship/journal - Create journal entry
export async function POST(request: NextRequest) {
  try {
    const merchantId = 'merchant-001' // Simplified for dev environment
    if (!merchantId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { matchId, authorId, authorRole = 'mentee', entryType = 'reflection', title, content, mood, tags, isPrivate = true, sharedWithMatchPartner = false } = body

    if (!matchId) {
      return NextResponse.json({ success: false, error: 'Missing required field: matchId' }, { status: 400 })
    }

    const entry = await db.mentorshipJournal.create({
      data: {
        id: crypto.randomUUID(),
        merchantId,
        matchId,
        authorId,
        authorRole,
        entryType,
        title,
        content,
        mood,
        tags: tags ? JSON.stringify(tags) : null,
        isPrivate,
        sharedWithMatchPartner,
      },
    })

    return NextResponse.json({ success: true, data: entry }, { status: 201 })
  } catch (error) {
    console.error('Error creating journal entry:', error)
    return NextResponse.json({ success: false, error: 'Failed to create journal entry' }, { status: 500 })
  }
}
