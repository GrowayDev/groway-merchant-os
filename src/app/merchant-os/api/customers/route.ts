import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'
import { getMerchantIdWithDevFallback, requireAuth } from '@/lib/auth-context'

// GET /api/customers - List all customers
export async function GET(request: NextRequest) {
  try {
    // Get merchant ID from auth context with dev fallback
    const merchantId = getMerchantIdWithDevFallback(request)
    if (!merchantId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const segment = searchParams.get('segment')
    const tier = searchParams.get('tier')

    const where: any = { merchantId }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (segment && segment !== 'all') {
      where.segment = segment
    }
    
    if (tier && tier !== 'all') {
      where.loyaltyTier = tier
    }

    const customers = await db.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    // Parse tags from comma-separated string
    const customersWithParsedTags = customers.map(customer => ({
      ...customer,
      tags: customer.tags ? customer.tags.split(',').filter(Boolean) : [],
      lastVisit: customer.lastVisit?.toISOString().split('T')[0] || null
    }))

    return NextResponse.json({
      success: true,
      data: customersWithParsedTags,
      count: customersWithParsedTags.length
    })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

// POST /api/customers - Create new customer
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const auth = requireAuth(request)
    if (auth.error) return auth.error
    const merchantId = auth.context.merchantId
    
    const body = await request.json()
    const {
      name,
      phone,
      email,
      notes,
      tags,
      segment = 'new'
    } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Customer name is required' },
        { status: 400 }
      )
    }

    // Check for duplicate phone number for same merchant
    if (phone) {
      const existing = await db.customer.findFirst({
        where: { merchantId, phone }
      })
      
      if (existing) {
        return NextResponse.json(
          { success: false, error: 'A customer with this phone number already exists' },
          { status: 400 }
        )
      }
    }

    // Create customer
    const customer = await db.customer.create({
      data: {
        id: randomUUID(),
        merchantId,
        name,
        phone: phone || null,
        email: email || null,
        notes: notes || null,
        tags: Array.isArray(tags) ? tags.join(',') : (tags || null),
        segment,
        totalSpent: 0,
        visitCount: 0,
        loyaltyPoints: 0,
        loyaltyTier: 'bronze',
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        ...customer,
        tags: customer.tags ? customer.tags.split(',').filter(Boolean) : []
      },
      message: 'Customer created successfully'
    })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create customer' },
      { status: 500 }
    )
  }
}
