import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getMerchantIdWithDevFallback } from '@/lib/auth-context'

// GET /api/mentorship/sessions
export async function GET(request: NextRequest) {
  try {
    const merchantId = getMerchantIdWithDevFallback(request)
    const { searchParams } = new URL(request.url)
    const pairingId = searchParams.get('pairingId')

    const where: any = { merchantId }
    if (pairingId) where.pairingId = pairingId

    const sessions = await db.mentorshipSession.findMany({
      where,
      orderBy: { date: 'desc' },
    })

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }
}

// POST /api/mentorship/sessions
export async function POST(request: NextRequest) {
  try {
    const merchantId = getMerchantIdWithDevFallback(request)
    const body = await request.json()

    if (!body.pairingId || !body.date) {
      return NextResponse.json({ error: 'pairingId and date are required' }, { status: 400 })
    }

    const session = await db.mentorshipSession.create({
      data: {
        id: `session_${Date.now()}`,
        merchantId,
        pairingId: body.pairingId,
        date: body.date,
        duration: body.duration || 30,
        topic: body.topic || '',
        notes: body.notes || '',
        status: body.status || 'completed',
      },
    })

    return NextResponse.json({ session }, { status: 201 })
  } catch (error) {
    console.error('Error creating session:', error)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}
