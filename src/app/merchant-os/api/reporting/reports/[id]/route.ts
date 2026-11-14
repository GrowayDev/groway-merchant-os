import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/reporting/reports/[id] - Get report detail
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const report = await db.stakeholderReport.findUnique({
      where: { id },
      include: {
        reportShares: { include: { stakeholder: true } },
        reportSnapshots: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!report) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: report })
  } catch (error) {
    console.error('Error fetching report:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch report' }, { status: 500 })
  }
}

// PATCH /api/reporting/reports/[id] - Update report
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const report = await db.stakeholderReport.update({
      where: { id },
      data: body,
    })

    return NextResponse.json({ success: true, data: report })
  } catch (error) {
    console.error('Error updating report:', error)
    return NextResponse.json({ success: false, error: 'Failed to update report' }, { status: 500 })
  }
}

// DELETE /api/reporting/reports/[id] - Delete report
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.stakeholderReport.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Report deleted' })
  } catch (error) {
    console.error('Error deleting report:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete report' }, { status: 500 })
  }
}
