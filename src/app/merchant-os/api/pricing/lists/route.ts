import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper to get session
async function getSession(request: NextRequest) {
  const sessionToken = request.cookies.get('groway_session')?.value
  if (!sessionToken) return null
  
  try {
    return await db.merchantSession.findFirst({
      where: { 
        token: sessionToken,
        expiresAt: { gt: new Date() }
      },
      include: { user: true, merchant: true },
    })
  } catch {
    return null
  }
}

// GET /api/merchant-os/pricing/lists - Get all price lists
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get price lists with their items
    const priceLists = await db.priceList.findMany({
      where: {
        merchantId: session.merchantId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      priceLists: priceLists.map(list => ({
        ...list,
        itemCount: list._count.items,
      })),
    })
  } catch (error) {
    console.error('Get price lists error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch price lists' },
      { status: 500 }
    )
  }
}

// POST /api/merchant-os/pricing/lists - Create new price list
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      description,
      type, // retail, wholesale, trade, promotional
      currency = 'ZAR',
      markupPercentage,
      discountPercentage,
      validFrom,
      validTo,
      customerIds,
      isActive = true,
    } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Price list name is required' },
        { status: 400 }
      )
    }

    // Check for duplicate name
    const existing = await db.priceList.findFirst({
      where: {
        merchantId: session.merchantId,
        name,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A price list with this name already exists' },
        { status: 400 }
      )
    }

    // Create price list
    const priceList = await db.priceList.create({
      data: {
        merchantId: session.merchantId,
        name,
        description,
        type: type || 'retail',
        currency,
        markupPercentage: markupPercentage || 0,
        discountPercentage: discountPercentage || 0,
        validFrom: validFrom ? new Date(validFrom) : null,
        validTo: validTo ? new Date(validTo) : null,
        customerIds: customerIds || [],
        isActive,
        createdBy: session.userId,
        createdByName: session.user.name || 'System',
      },
    })

    return NextResponse.json({
      success: true,
      priceList,
    })
  } catch (error) {
    console.error('Create price list error:', error)
    return NextResponse.json(
      { error: 'Failed to create price list' },
      { status: 500 }
    )
  }
}
