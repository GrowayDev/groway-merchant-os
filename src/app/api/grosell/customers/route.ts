import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthContext, getMerchantId, unauthorizedResponse, badRequestResponse } from '@/lib/auth-context'

// GET /api/grosell/customers - List customers
export async function GET(request: NextRequest) {
  try {
    // Get authenticated context
    const context = await getAuthContext(request)
    if (!context) {
      return unauthorizedResponse()
    }
    
    const { searchParams } = new URL(request.url)
    
    // Get merchantId from params or context
    const merchantIdResult = getMerchantId(searchParams, context as any)
    if (merchantIdResult instanceof NextResponse) {
      return merchantIdResult
    }
    const merchantId = merchantIdResult
    
    const search = searchParams.get('search')
    const tag = searchParams.get('tag')

    const where: any = { merchantId }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (tag) {
      where.tags = { contains: tag }
    }

    const customers = await db.sellCustomer.findMany({
      where,
      include: {
        _count: {
          select: { orders: true }
        }
      },
      orderBy: [
        { totalSpent: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 100,
    })

    // Get stats
    const totalCustomers = await db.sellCustomer.count({
      where: { merchantId }
    })

    const activeCustomers = await db.sellCustomer.count({
      where: {
        merchantId,
        lastOrderAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 days
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: customers.map(c => ({
        ...c,
        orderCount: c._count.orders
      })),
      stats: {
        total: totalCustomers,
        active: activeCustomers,
      }
    })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

// POST /api/grosell/customers - Create or update customer
export async function POST(request: NextRequest) {
  try {
    // Get authenticated context
    const context = await getAuthContext(request)
    if (!context) {
      return unauthorizedResponse()
    }
    
    const body = await request.json()
    const {
      merchantId: bodyMerchantId,
      phone,
      name,
      email,
      notes,
      tags,
    } = body
    
    // Validate merchantId - use body param or context
    let merchantId = bodyMerchantId
    if (!merchantId && 'merchantId' in context) {
      merchantId = context.merchantId
    }
    
    if (!merchantId) {
      return badRequestResponse('merchantId is required')
    }
    
    // Security check: ensure user has access to this merchant
    if ('merchantId' in context && merchantId !== context.merchantId) {
      const allowedRoles = ['platform_admin', 'super_admin', 'admin']
      if (!allowedRoles.includes(context.role)) {
        return NextResponse.json(
          { success: false, error: 'Access denied to this merchant' },
          { status: 403 }
        )
      }
    }
    
    if (!phone) {
      return badRequestResponse('phone is required')
    }

    // Check if customer exists
    const existing = await db.sellCustomer.findUnique({
      where: {
        merchantId_phone: {
          merchantId,
          phone: phone.replace(/\D/g, ''), // Clean phone number
        }
      }
    })

    if (existing) {
      // Update existing customer
      const customer = await db.sellCustomer.update({
        where: { id: existing.id },
        data: {
          name: name || existing.name,
          email: email || existing.email,
          notes: notes || existing.notes,
          tags: tags || existing.tags,
        }
      })
      return NextResponse.json({ success: true, data: customer, isNew: false })
    }

    // Create new customer
    const customer = await db.sellCustomer.create({
      data: {
        merchantId,
        phone: phone.replace(/\D/g, ''),
        name,
        email,
        notes,
        tags: Array.isArray(tags) ? JSON.stringify(tags) : tags,
      }
    })

    return NextResponse.json({ success: true, data: customer, isNew: true })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create customer' },
      { status: 500 }
    )
  }
}
