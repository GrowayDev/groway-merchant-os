import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/reporting/stakeholders/[id] - Get stakeholder with shared reports
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const stakeholder = await db.stakeholder.findUnique({
      where: { id },
      include: {
        reportShares: { include: { report: true } },
        reportAccessLogs: { orderBy: { accessedAt: 'desc' }, take: 50 },
      },
    })

    if (!stakeholder) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: stakeholder })
  } catch (error) {
    console.error('Error fetching stakeholder:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch stakeholder' }, { status: 500 })
  }
}

// PATCH /api/reporting/stakeholders/[id] - Update stakeholder
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const stakeholder = await db.stakeholder.update({
      where: { id },
      data: body,
    })

    return NextResponse.json({ success: true, data: stakeholder })
  } catch (error) {
    console.error('Error updating stakeholder:', error)
    return NextResponse.json({ success: false, error: 'Failed to update stakeholder' }, { status: 500 })
  }
}

// DELETE /api/reporting/stakeholders/[id] - Remove stakeholder
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.stakeholder.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Stakeholder removed' })
  } catch (error) {
    console.error('Error deleting stakeholder:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete stakeholder' }, { status: 500 })
  }
}
