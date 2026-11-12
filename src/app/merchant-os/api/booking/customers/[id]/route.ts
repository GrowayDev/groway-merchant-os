import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/booking/customers/[id] - Get a specific customer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const customer = await db.customer.findUnique({
      where: { id },
      include: {
        appointments: {
          orderBy: { date: 'desc' },
          take: 20,
          include: {
            service: true,
            staff: true
          }
        },
        memberships: {
          include: {
            plan: true
          }
        },
        packages: {
          include: {
            package: true
          }
        },
        _count: {
          select: { appointments: true }
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

// PUT /api/booking/customers/[id] - Update a customer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const customer = await db.customer.update({
      where: { id },
      data: {
        name: body.name,
        phone: body.phone,
        email: body.email,
        notes: body.notes,
        tags: body.tags ? JSON.stringify(body.tags) : undefined,
        loyaltyTier: body.loyaltyTier,
        loyaltyPoints: body.loyaltyPoints
      }
    })

    return NextResponse.json({ customer })
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
  }
}

// DELETE /api/booking/customers/[id] - Delete a customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await db.customer.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 })
  }
}
