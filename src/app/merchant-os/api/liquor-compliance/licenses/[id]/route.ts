import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get single license
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const license = await db.liquorLicense.findUnique({
      where: { id },
      include: {
        documents: { orderBy: { createdAt: 'desc' } },
        audits: { orderBy: { auditDate: 'desc' } },
      },
    })
    
    if (!license) {
      return NextResponse.json({ error: 'License not found' }, { status: 404 })
    }
    
    const today = new Date().toISOString().split('T')[0]
    const licenseWithStatus = {
      ...license,
      isExpired: license.expiryDate < today,
      daysUntilExpiry: Math.ceil((new Date(license.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
    }
    
    return NextResponse.json(licenseWithStatus)
  } catch (error) {
    console.error('Error fetching license:', error)
    return NextResponse.json({ error: 'Failed to fetch license' }, { status: 500 })
  }
}

// PUT - Update license
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const license = await db.liquorLicense.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    })
    
    return NextResponse.json(license)
  } catch (error) {
    console.error('Error updating license:', error)
    return NextResponse.json({ error: 'Failed to update license' }, { status: 500 })
  }
}

// DELETE - Delete license
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.liquorLicense.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting license:', error)
    return NextResponse.json({ error: 'Failed to delete license' }, { status: 500 })
  }
}
