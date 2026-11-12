import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
}

// PUT - Update a kitchen station
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, icon, color, active } = body

    const station = await db.kitchenStation.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(icon !== undefined && { icon }),
        ...(color !== undefined && { color }),
        ...(active !== undefined && { active }),
      },
    })
    return NextResponse.json(station)
  } catch (error) {
    console.error('Error updating kitchen station:', error)
    return NextResponse.json({ error: 'Failed to update kitchen station' }, { status: 500 })
  }
}

// DELETE - Delete a kitchen station
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    await db.kitchenStation.delete({
      where: { id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting kitchen station:', error)
    return NextResponse.json({ error: 'Failed to delete kitchen station' }, { status: 500 })
  }
}
