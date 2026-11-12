import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PUT - Resolve a violation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const violation = await db.tradingViolation.update({
      where: { id },
      data: {
        resolved: body.resolved ?? true,
        resolvedAt: body.resolved ? new Date() : null,
        resolvedBy: body.resolvedBy,
        notes: body.notes,
        updatedAt: new Date(),
      },
    })
    
    return NextResponse.json(violation)
  } catch (error) {
    console.error('Error updating violation:', error)
    return NextResponse.json({ error: 'Failed to update violation' }, { status: 500 })
  }
}
