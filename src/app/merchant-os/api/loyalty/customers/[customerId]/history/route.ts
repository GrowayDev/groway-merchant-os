import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// GET /api/loyalty/customers/[customerId]/history - Get transaction history for customer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params
    const { searchParams } = new URL(request.url)
    
    const type = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Verify customer exists
    const customer = await db.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        name: true,
        loyaltyPoints: true,
        loyaltyTier: true,
      }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Build where clause
    const where: Prisma.LoyaltyTransactionWhereInput = {
      customerId,
    }

    if (type) {
      where.type = type
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.createdAt.lte = end
      }
    }

    // Get transactions and total count
    const [transactions, total] = await Promise.all([
      db.loyaltyTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.loyaltyTransaction.count({ where })
    ])

    // Get summary statistics
    const summary = await db.loyaltyTransaction.aggregate({
      where,
      _sum: {
        points: true,
        randValue: true,
      },
      _count: true,
    })

    // Get breakdown by type
    const breakdownByType = await db.loyaltyTransaction.groupBy({
      by: ['type'],
      where,
      _sum: {
        points: true,
        randValue: true,
      },
      _count: true,
    })

    // Get monthly breakdown (last 12 months)
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
    
    const monthlyTransactions = await db.loyaltyTransaction.findMany({
      where: {
        customerId,
        createdAt: { gte: twelveMonthsAgo },
      },
      select: {
        points: true,
        type: true,
        createdAt: true,
      },
    })

    // Group by month
    const monthlyStats: Record<string, { earned: number; redeemed: number; count: number }> = {}
    
    monthlyTransactions.forEach(t => {
      const monthKey = t.createdAt.toISOString().slice(0, 7) // YYYY-MM
      
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { earned: 0, redeemed: 0, count: 0 }
      }
      
      monthlyStats[monthKey].count++
      if (t.points > 0) {
        monthlyStats[monthKey].earned += t.points
      } else {
        monthlyStats[monthKey].redeemed += Math.abs(t.points)
      }
    })

    return NextResponse.json({
      customer,
      transactions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + transactions.length < total,
      },
      summary: {
        totalPoints: summary._sum.points || 0,
        totalRandValue: summary._sum.randValue || 0,
        totalTransactions: summary._count,
        breakdownByType: breakdownByType.map(b => ({
          type: b.type,
          points: b._sum.points || 0,
          randValue: b._sum.randValue || 0,
          count: b._count,
        })),
      },
      monthlyStats: Object.entries(monthlyStats)
        .map(([month, stats]) => ({
          month,
          ...stats,
          net: stats.earned - stats.redeemed,
        }))
        .sort((a, b) => a.month.localeCompare(b.month)),
    })
  } catch (error) {
    console.error('Error fetching customer loyalty history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer loyalty history' },
      { status: 500 }
    )
  }
}
