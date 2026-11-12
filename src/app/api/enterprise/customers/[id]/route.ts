import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get single customer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const customer = await db.enterpriseCustomer.findUnique({
      where: { id },
      include: {
        merchant: {
          include: { corporate: true }
        }
      }
    })
    
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }
    
    return NextResponse.json({ customer })
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 })
  }
}

// PUT - Update customer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const customer = await db.enterpriseCustomer.update({
      where: { id },
      data: {
        ...body,
        totalSpent: body.totalSpent !== undefined ? parseFloat(body.totalSpent) : undefined,
        tags: body.tags ? JSON.stringify(body.tags) : undefined,
        lastVisit: body.lastVisit ? new Date(body.lastVisit) : undefined,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ customer })
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
  }
}

// DELETE - Delete customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await db.enterpriseCustomer.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 })
  }
}
