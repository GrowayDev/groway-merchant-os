import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get single device
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const device = await db.GopayDevice.findUnique({
      where: { id },
      include: {
        transactions: {
          take: 20,
          orderBy: { createdAt: 'desc' }
        },
        _count: { select: { transactions: true } }
      }
    })
    
    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 })
    }
    
    return NextResponse.json({ device })
  } catch (error) {
    console.error('Error fetching device:', error)
    return NextResponse.json({ error: 'Failed to fetch device' }, { status: 500 })
  }
}

// PUT - Update device
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const device = await db.GopayDevice.update({
      where: { id },
      data: {
        ...body,
        batteryLevel: body.batteryLevel !== undefined ? parseInt(body.batteryLevel) : undefined,
        signalStrength: body.signalStrength !== undefined ? parseInt(body.signalStrength) : undefined,
        totalRevenue: body.totalRevenue ? parseFloat(body.totalRevenue) : undefined,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ device })
  } catch (error) {
    console.error('Error updating device:', error)
    return NextResponse.json({ error: 'Failed to update device' }, { status: 500 })
  }
}

// DELETE - Delete device
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await db.GopayDevice.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting device:', error)
    return NextResponse.json({ error: 'Failed to delete device' }, { status: 500 })
  }
}
