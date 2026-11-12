import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get single transfer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const transfer = await db.enterpriseTransfer.findUnique({
      where: { id },
      include: {
        fromMerchant: { include: { corporate: true } },
        toMerchant: { include: { corporate: true } },
        corporate: true,
        items: true
      }
    })
    
    if (!transfer) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 })
    }
    
    return NextResponse.json({ transfer })
  } catch (error) {
    console.error('Error fetching transfer:', error)
    return NextResponse.json({ error: 'Failed to fetch transfer' }, { status: 500 })
  }
}

// PUT - Update transfer (status changes)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const updateData: Record<string, unknown> = {
      ...body,
      totalValue: body.totalValue !== undefined ? parseFloat(body.totalValue) : undefined,
      updatedAt: new Date()
    }
    
    // Handle status-specific timestamps
    if (body.status === 'approved') {
      updateData.approvedAt = new Date()
    } else if (body.status === 'in_transit') {
      updateData.dispatchedAt = new Date()
    } else if (body.status === 'completed') {
      updateData.receivedAt = new Date()
    }
    
    const transfer = await db.enterpriseTransfer.update({
      where: { id },
      data: updateData,
      include: {
        fromMerchant: true,
        toMerchant: true,
        items: true
      }
    })

    return NextResponse.json({ transfer })
  } catch (error) {
    console.error('Error updating transfer:', error)
    return NextResponse.json({ error: 'Failed to update transfer' }, { status: 500 })
  }
}

// DELETE - Delete transfer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await db.enterpriseTransfer.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting transfer:', error)
    return NextResponse.json({ error: 'Failed to delete transfer' }, { status: 500 })
  }
}
