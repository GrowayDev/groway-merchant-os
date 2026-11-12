import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PUT - Update RSA certification
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const cert = await db.rSACertification.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    })
    
    return NextResponse.json(cert)
  } catch (error) {
    console.error('Error updating RSA certification:', error)
    return NextResponse.json({ error: 'Failed to update RSA certification' }, { status: 500 })
  }
}

// DELETE - Delete RSA certification
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.rSACertification.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting RSA certification:', error)
    return NextResponse.json({ error: 'Failed to delete RSA certification' }, { status: 500 })
  }
}
