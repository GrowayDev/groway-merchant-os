import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getMerchantIdWithDevFallback } from '@/lib/auth-context'

// GET /api/reporting/stakeholders
export async function GET(request: NextRequest) {
  try {
    const merchantId = getMerchantIdWithDevFallback(request)
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')

    const where: any = { merchantId }
    if (role) where.role = role

    const stakeholders = await db.stakeholder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ stakeholders })
  } catch (error) {
    console.error('Error fetching stakeholders:', error)
    return NextResponse.json({ error: 'Failed to fetch stakeholders' }, { status: 500 })
  }
}

// POST /api/reporting/stakeholders
export async function POST(request: NextRequest) {
  try {
    const merchantId = getMerchantIdWithDevFallback(request)
    const body = await request.json()

    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const stakeholder = await db.stakeholder.create({
      data: {
        id: `stakeholder_${Date.now()}`,
        merchantId,
        name: body.name,
        email: body.email || '',
        phone: body.phone || '',
        role: body.role || 'investor',
        company: body.company || '',
        stake: body.stake || 0,
      },
    })

    return NextResponse.json({ stakeholder }, { status: 201 })
  } catch (error) {
    console.error('Error creating stakeholder:', error)
    return NextResponse.json({ error: 'Failed to create stakeholder' }, { status: 500 })
  }
}
