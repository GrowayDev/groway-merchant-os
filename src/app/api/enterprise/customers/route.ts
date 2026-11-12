import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - List all customers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const tier = searchParams.get('tier')
    
    const where: Record<string, unknown> = {}
    if (merchantId) where.merchantId = merchantId
    if (tier) where.tier = tier
    
    const customers = await db.enterpriseCustomer.findMany({
      where,
      include: {
        merchant: {
          select: { id: true, name: true, location: true, corporate: { select: { id: true, name: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({ customers })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}

// POST - Create new customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      merchantId,
      name,
      email,
      phone,
      tier = 'Bronze',
      tags,
      notes
    } = body

    // Generate unique code
    const count = await db.enterpriseCustomer.count()
    const code = `C${String(count + 1).padStart(3, '0')}`

    const customer = await db.enterpriseCustomer.create({
      data: {
        code,
        name,
        email,
        phone,
        merchantId,
        tier,
        tags: tags ? JSON.stringify(tags) : null,
        notes,
        firstVisit: new Date()
      },
      include: {
        merchant: true
      }
    })

    return NextResponse.json({ customer })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
  }
}
