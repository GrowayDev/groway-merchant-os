import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getMerchantIdWithDevFallback } from '@/lib/auth-context'

// GET /api/reporting/reports
export async function GET(request: NextRequest) {
  try {
    const merchantId = getMerchantIdWithDevFallback(request)
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type')

    const where: any = { merchantId }
    if (reportType) where.reportType = reportType

    const reports = await db.stakeholderReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ reports })
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}

// POST /api/reporting/reports
export async function POST(request: NextRequest) {
  try {
    const merchantId = getMerchantIdWithDevFallback(request)
    const body = await request.json()

    if (!body.title || !body.period) {
      return NextResponse.json({ error: 'Title and period are required' }, { status: 400 })
    }

    const report = await db.stakeholderReport.create({
      data: {
        id: `report_${Date.now()}`,
        merchantId,
        title: body.title,
        description: body.description || '',
        reportType: body.reportType || 'summary',
        period: body.period,
        status: body.status || 'draft',
      },
    })

    return NextResponse.json({ report }, { status: 201 })
  } catch (error) {
    console.error('Error creating report:', error)
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 })
  }
}
