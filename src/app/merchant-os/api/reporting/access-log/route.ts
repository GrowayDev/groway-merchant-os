import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'


// GET /api/reporting/access-log - List access logs
export async function GET(request: NextRequest) {
  try {
    const merchantId = 'merchant-001' // Simplified for dev environment
    if (!merchantId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reportId = searchParams.get('reportId')
    const stakeholderId = searchParams.get('stakeholderId')

    const where: any = { merchantId }
    if (reportId) where.reportShareId = reportId
    if (stakeholderId) where.stakeholderId = stakeholderId

    const logs = await db.reportAccessLog.findMany({
      where,
      orderBy: { accessedAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: logs })
  } catch (error) {
    console.error('Error fetching access logs:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch access logs' }, { status: 500 })
  }
}
