import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PUT - Update customer alert
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const alert = await db.customerAlert.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    })
    
    return NextResponse.json(alert)
  } catch (error) {
    console.error('Error updating customer alert:', error)
    return NextResponse.json({ error: 'Failed to update customer alert' }, { status: 500 })
  }
}

// DELETE - Delete customer alert
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.customerAlert.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting customer alert:', error)
    return NextResponse.json({ error: 'Failed to delete customer alert' }, { status: 500 })
  }
}
