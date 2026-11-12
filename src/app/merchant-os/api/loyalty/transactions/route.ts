import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// GET /api/loyalty/transactions - List loyalty transactions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const where: Prisma.LoyaltyTransactionWhereInput = {}
    
    if (customerId) {
      where.customerId = customerId
    }
    
    if (type) {
      where.type = type
    }

    const [transactions, total] = await Promise.all([
      db.loyaltyTransaction.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              loyaltyTier: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.loyaltyTransaction.count({ where })
    ])

    return NextResponse.json({
      transactions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + transactions.length < total
      }
    })
  } catch (error) {
    console.error('Error fetching loyalty transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch loyalty transactions' },
      { status: 500 }
    )
  }
}

// POST /api/loyalty/transactions - Create a loyalty transaction (earn/redeem points)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const { customerId, points, type, reason, referenceType, referenceId, randValue, pointsRate, expiresAt } = body
    
    if (!customerId) {
      return NextResponse.json(
        { error: 'customerId is required' },
        { status: 400 }
      )
    }
    
    if (points === undefined || points === null) {
      return NextResponse.json(
        { error: 'points is required' },
        { status: 400 }
      )
    }
    
    if (!type) {
      return NextResponse.json(
        { error: 'type is required' },
        { status: 400 }
      )
    }

    // Validate type
    const validTypes = ['earn', 'redeem', 'bonus', 'adjustment', 'expiry', 'transfer']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // For redeem, points should be negative; for earn/bonus, points should be positive
    const pointsValue = parseInt(points, 10)
    if (isNaN(pointsValue)) {
      return NextResponse.json(
        { error: 'points must be a valid integer' },
        { status: 400 }
      )
    }

    // Get the customer and their current points
    const customer = await db.customer.findUnique({
      where: { id: customerId },
      select: { id: true, name: true, loyaltyPoints: true, loyaltyTier: true }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    const balanceBefore = customer.loyaltyPoints
    
    // For redemption, check if customer has enough points
    if (pointsValue < 0 && balanceBefore + pointsValue < 0) {
      return NextResponse.json(
        { error: 'Insufficient loyalty points for redemption' },
        { status: 400 }
      )
    }

    const balanceAfter = balanceBefore + pointsValue

    // Use a transaction to ensure data consistency
    const result = await db.$transaction(async (tx) => {
      // Create the loyalty transaction
      const transaction = await tx.loyaltyTransaction.create({
        data: {
          customerId,
          points: pointsValue,
          balanceBefore,
          balanceAfter,
          type,
          reason: reason || null,
          referenceType: referenceType || null,
          referenceId: referenceId || null,
          randValue: randValue ? parseFloat(randValue) : 0,
          pointsRate: pointsRate ? parseFloat(pointsRate) : 0,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              loyaltyTier: true,
            }
          }
        }
      })

      // Update the customer's loyalty points
      await tx.customer.update({
        where: { id: customerId },
        data: { loyaltyPoints: balanceAfter }
      })

      return transaction
    })

    return NextResponse.json({ transaction: result }, { status: 201 })
  } catch (error) {
    console.error('Error creating loyalty transaction:', error)
    return NextResponse.json(
      { error: 'Failed to create loyalty transaction' },
      { status: 500 }
    )
  }
}
