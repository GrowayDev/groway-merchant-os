import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getMerchantIdWithDevFallback } from '@/lib/auth-context'

// GET /api/mentorship/programs
export async function GET(request: NextRequest) {
  try {
    const merchantId = getMerchantIdWithDevFallback(request)

    const programs = await db.mentorshipProgram.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { pairings: true } },
      },
    })

    return NextResponse.json({ programs })
  } catch (error) {
    console.error('Error fetching programs:', error)
    return NextResponse.json({ error: 'Failed to fetch programs' }, { status: 500 })
  }
}

// POST /api/mentorship/programs
export async function POST(request: NextRequest) {
  try {
    const merchantId = getMerchantIdWithDevFallback(request)
    const body = await request.json()

    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const program = await db.mentorshipProgram.create({
      data: {
        id: `mentor_prog_${Date.now()}`,
        merchantId,
        title: body.title,
        description: body.description || '',
        maxMentees: body.maxMentees || 1,
        status: body.status || 'active',
      },
    })

    return NextResponse.json({ program }, { status: 201 })
  } catch (error) {
    console.error('Error creating program:', error)
    return NextResponse.json({ error: 'Failed to create program' }, { status: 500 })
  }
}
