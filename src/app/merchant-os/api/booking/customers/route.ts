import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// GET /api/booking/customers - List customers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const loyaltyTier = searchParams.get('loyaltyTier')

    const where: Prisma.CustomerWhereInput = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }
    if (loyaltyTier) {
      where.loyaltyTier = loyaltyTier
    }

    const customers = await db.customer.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { appointments: true }
        }
      }
    })

    return NextResponse.json({ customers })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}

// POST /api/booking/customers - Create a new customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Check for existing customer by phone
    if (body.phone) {
      const existing = await db.customer.findFirst({
        where: { phone: body.phone }
      })
      if (existing) {
        return NextResponse.json({ customer: existing, isExisting: true })
      }
    }
    
    const customer = await db.customer.create({
      data: {
        name: body.name,
        phone: body.phone,
        email: body.email,
        notes: body.notes,
        tags: body.tags ? JSON.stringify(body.tags) : null
      }
    })

    return NextResponse.json({ customer, isExisting: false }, { status: 201 })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
  }
}
