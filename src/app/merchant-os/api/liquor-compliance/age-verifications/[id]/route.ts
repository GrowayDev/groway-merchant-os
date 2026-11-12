import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get single age verification
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const verification = await db.ageVerification.findUnique({
      where: { id },
    })
    
    if (!verification) {
      return NextResponse.json({ error: 'Age verification not found' }, { status: 404 })
    }
    
    return NextResponse.json(verification)
  } catch (error) {
    console.error('Error fetching age verification:', error)
    return NextResponse.json({ error: 'Failed to fetch age verification' }, { status: 500 })
  }
}

// PUT - Update age verification
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const verification = await db.ageVerification.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    })
    
    return NextResponse.json(verification)
  } catch (error) {
    console.error('Error updating age verification:', error)
    return NextResponse.json({ error: 'Failed to update age verification' }, { status: 500 })
  }
}

// DELETE - Delete age verification
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.ageVerification.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting age verification:', error)
    return NextResponse.json({ error: 'Failed to delete age verification' }, { status: 500 })
  }
}
