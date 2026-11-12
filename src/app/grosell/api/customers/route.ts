import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

// GET - List customers for a merchant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId required' }, { status: 400 })
    }

    const where: Record<string, unknown> = { merchantId, blocked: false }
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } }
      ]
    }

    const [customers, total] = await Promise.all([
      db.groSellCustomer.findMany({
        where,
        orderBy: { lastOrderAt: 'desc' },
        take: limit,
        skip: offset
      }),
      db.groSellCustomer.count({ where })
    ])

    return NextResponse.json({ customers, total })
  } catch (error) {
    console.error('Error fetching GroSell customers:', error)
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}

// POST - Create a new customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      merchantId,
      phone,
      name,
      email,
      address,
      city,
      province,
      postalCode,
      deliveryNotes,
      tags,
      notes
    } = body

    if (!merchantId || !phone) {
      return NextResponse.json({ error: 'merchantId and phone are required' }, { status: 400 })
    }

    // Check if customer exists
    const existing = await db.groSellCustomer.findUnique({
      where: { merchantId_phone: { merchantId, phone } }
    })

    if (existing) {
      return NextResponse.json({ error: 'Customer with this phone already exists', customer: existing }, { status: 400 })
    }

    const customer = await db.groSellCustomer.create({
      data: {
        id: `gsc_${nanoid(12)}`,
        merchantId,
        phone,
        name,
        email,
        address,
        city,
        province,
        postalCode,
        deliveryNotes,
        tags,
        notes,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ customer })
  } catch (error) {
    console.error('Error creating GroSell customer:', error)
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
  }
}

// PUT - Update a customer
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 })
    }

    const customer = await db.groSellCustomer.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ customer })
  } catch (error) {
    console.error('Error updating GroSell customer:', error)
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
  }
}

// DELETE - Delete/block a customer
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const block = searchParams.get('block') === 'true'

    if (!id) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 })
    }

    if (block) {
      // Block instead of delete
      await db.groSellCustomer.update({
        where: { id },
        data: { blocked: true, updatedAt: new Date() }
      })
    } else {
      await db.groSellCustomer.delete({ where: { id } })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting GroSell customer:', error)
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 })
  }
}
