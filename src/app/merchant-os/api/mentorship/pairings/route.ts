import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getMerchantIdWithDevFallback } from '@/lib/auth-context'

// GET /api/mentorship/pairings
export async function GET(request: NextRequest) {
  try {
    const merchantId = getMerchantIdWithDevFallback(request)
    const { searchParams } = new URL(request.url)
    const programId = searchParams.get('programId')

    const where: any = { merchantId }
    if (programId) where.programId = programId

    const pairings = await db.mentorshipPairing.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { sessions: true, feedback: true } },
      },
    })

    return NextResponse.json({ pairings })
  } catch (error) {
    console.error('Error fetching pairings:', error)
    return NextResponse.json({ error: 'Failed to fetch pairings' }, { status: 500 })
  }
}

// POST /api/mentorship/pairings
export async function POST(request: NextRequest) {
  try {
    const merchantId = getMerchantIdWithDevFallback(request)
    const body = await request.json()

    if (!body.programId || !body.mentorId || !body.menteeId) {
      return NextResponse.json({ error: 'programId, mentorId, and menteeId are required' }, { status: 400 })
    }

    const pairing = await db.mentorshipPairing.create({
      data: {
        id: `pairing_${Date.now()}`,
        merchantId,
        programId: body.programId,
        mentorId: body.mentorId,
        mentorName: body.mentorName || '',
        menteeId: body.menteeId,
        menteeName: body.menteeName || '',
        goals: body.goals || '',
      },
    })

    return NextResponse.json({ pairing }, { status: 201 })
  } catch (error) {
    console.error('Error creating pairing:', error)
    return NextResponse.json({ error: 'Failed to create pairing' }, { status: 500 })
  }
}
