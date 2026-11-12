import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get single merchant
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const merchant = await db.enterpriseMerchant.findUnique({
      where: { id },
      include: {
        corporate: true,
        inventory: {
          take: 50,
          orderBy: { name: 'asc' }
        },
        customers: {
          take: 20,
          orderBy: { createdAt: 'desc' }
        }
      }
    })
    
    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
    }
    
    return NextResponse.json({ merchant })
  } catch (error) {
    console.error('Error fetching merchant:', error)
    return NextResponse.json({ error: 'Failed to fetch merchant' }, { status: 500 })
  }
}

// PUT - Update merchant
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const merchant = await db.enterpriseMerchant.update({
      where: { id },
      data: {
        ...body,
        monthlyRevenue: body.monthlyRevenue ? parseFloat(body.monthlyRevenue) : undefined,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ merchant })
  } catch (error) {
    console.error('Error updating merchant:', error)
    return NextResponse.json({ error: 'Failed to update merchant' }, { status: 500 })
  }
}

// DELETE - Delete merchant
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const merchant = await db.enterpriseMerchant.findUnique({
      where: { id },
      select: { corporateId: true }
    })
    
    if (merchant) {
      await db.enterpriseCorporateClient.update({
        where: { id: merchant.corporateId },
        data: { merchantsCount: { decrement: 1 } }
      })
    }
    
    await db.enterpriseMerchant.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting merchant:', error)
    return NextResponse.json({ error: 'Failed to delete merchant' }, { status: 500 })
  }
}
