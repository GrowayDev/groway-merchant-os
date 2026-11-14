import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'


// GET /api/reporting/shares - List shares
export async function GET(request: NextRequest) {
  try {
    const merchantId = 'merchant-001' // Simplified for dev environment
    if (!merchantId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const stakeholderId = searchParams.get('stakeholderId')

    const where: any = { merchantId }
    if (stakeholderId) where.stakeholderId = stakeholderId

    const shares = await db.reportShare.findMany({
      where,
      include: { report: true, stakeholder: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: shares })
  } catch (error) {
    console.error('Error fetching shares:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch shares' }, { status: 500 })
  }
}

// POST /api/reporting/shares - Share a report with stakeholder(s)
export async function POST(request: NextRequest) {
  try {
    const merchantId = 'merchant-001' // Simplified for dev environment
    if (!merchantId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { reportId, stakeholderIds, expiresAt } = body

    if (!reportId || !stakeholderIds || !Array.isArray(stakeholderIds)) {
      return NextResponse.json({ success: false, error: 'Missing required fields: reportId, stakeholderIds' }, { status: 400 })
    }

    const shares = await db.reportShare.createMany({
      data: stakeholderIds.map((stakeholderId: string) => ({
        id: crypto.randomUUID(),
        merchantId,
        reportId,
        stakeholderId,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        sharedAt: new Date(),
      })),
    })

    return NextResponse.json({ success: true, data: { count: shares.count } }, { status: 201 })
  } catch (error) {
    console.error('Error creating shares:', error)
    return NextResponse.json({ success: false, error: 'Failed to create shares' }, { status: 500 })
  }
}
