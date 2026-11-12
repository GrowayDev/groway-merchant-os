import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/customers/[id] - Get single customer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const customer = await db.customer.findUnique({
      where: { id }
    })

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...customer,
        tags: customer.tags ? customer.tags.split(',').filter(Boolean) : [],
        lastVisit: customer.lastVisit?.toISOString().split('T')[0] || null
      }
    })
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customer' },
      { status: 500 }
    )
  }
}

// PUT /api/customers/[id] - Update customer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check if customer exists
    const existing = await db.customer.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    }

    if (body.name !== undefined) updateData.name = body.name
    if (body.phone !== undefined) updateData.phone = body.phone || null
    if (body.email !== undefined) updateData.email = body.email || null
    if (body.notes !== undefined) updateData.notes = body.notes || null
    if (body.tags !== undefined) {
      updateData.tags = Array.isArray(body.tags) ? body.tags.join(',') : (body.tags || null)
    }
    if (body.segment !== undefined) updateData.segment = body.segment
    if (body.totalSpent !== undefined) updateData.totalSpent = body.totalSpent
    if (body.visitCount !== undefined) updateData.visitCount = body.visitCount
    if (body.loyaltyPoints !== undefined) updateData.loyaltyPoints = body.loyaltyPoints
    if (body.loyaltyTier !== undefined) updateData.loyaltyTier = body.loyaltyTier
    if (body.lastVisit !== undefined) {
      updateData.lastVisit = body.lastVisit ? new Date(body.lastVisit) : null
    }

    // Update customer
    const customer = await db.customer.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: {
        ...customer,
        tags: customer.tags ? customer.tags.split(',').filter(Boolean) : [],
        lastVisit: customer.lastVisit?.toISOString().split('T')[0] || null
      },
      message: 'Customer updated successfully'
    })
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update customer' },
      { status: 500 }
    )
  }
}

// DELETE /api/customers/[id] - Delete customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if customer exists
    const existing = await db.customer.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Delete customer
    await db.customer.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Customer deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete customer' },
      { status: 500 }
    )
  }
}
