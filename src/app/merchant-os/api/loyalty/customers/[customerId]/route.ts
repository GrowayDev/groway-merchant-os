import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/loyalty/customers/[customerId] - Get customer loyalty balance
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params

    const customer = await db.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        loyaltyPoints: true,
        loyaltyTier: true,
        totalSpent: true,
        visitCount: true,
        lastVisit: true,
        createdAt: true,
        _count: {
          select: { loyaltyTransactions: true }
        }
      }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Calculate points statistics
    const pointsStats = await db.loyaltyTransaction.aggregate({
      where: { customerId },
      _sum: {
        points: true,
        randValue: true,
      },
      _count: true,
    })

    // Get earned points (positive)
    const earnedStats = await db.loyaltyTransaction.aggregate({
      where: { 
        customerId,
        points: { gt: 0 }
      },
      _sum: { points: true },
    })

    // Get redeemed points (negative - get absolute value)
    const redeemedStats = await db.loyaltyTransaction.aggregate({
      where: { 
        customerId,
        points: { lt: 0 }
      },
      _sum: { points: true },
    })

    // Get points by type
    const pointsByType = await db.loyaltyTransaction.groupBy({
      by: ['type'],
      where: { customerId },
      _sum: { points: true },
      _count: true,
    })

    // Calculate tier progress
    const tierThresholds = {
      bronze: 0,
      silver: 500,
      gold: 1500,
      platinum: 5000,
    }
    
    const tierNames = Object.keys(tierThresholds)
    const currentTierIndex = tierNames.indexOf(customer.loyaltyTier)
    const nextTier = tierNames[currentTierIndex + 1] || null
    const nextTierThreshold = nextTier ? tierThresholds[nextTier as keyof typeof tierThresholds] : null
    
    let tierProgress = 100
    let pointsToNextTier = 0
    
    if (nextTier && nextTierThreshold !== null) {
      const currentTierThreshold = tierThresholds[customer.loyaltyTier as keyof typeof tierThresholds]
      const pointsInCurrentTier = customer.loyaltyPoints - currentTierThreshold
      const pointsNeededForNext = nextTierThreshold - currentTierThreshold
      tierProgress = Math.min(100, Math.round((pointsInCurrentTier / pointsNeededForNext) * 100))
      pointsToNextTier = Math.max(0, nextTierThreshold - customer.loyaltyPoints)
    }

    // Get recent transactions
    const recentTransactions = await db.loyaltyTransaction.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    // Check for expiring points
    const expiringPoints = await db.loyaltyTransaction.aggregate({
      where: {
        customerId,
        expiresAt: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
        },
        expiredAt: null,
        points: { gt: 0 },
      },
      _sum: { points: true },
    })

    return NextResponse.json({
      customer: {
        ...customer,
        tierProgress,
        pointsToNextTier,
        nextTier,
      },
      loyalty: {
        currentBalance: customer.loyaltyPoints,
        totalEarned: earnedStats._sum.points || 0,
        totalRedeemed: Math.abs(redeemedStats._sum.points || 0),
        totalTransactions: pointsStats._count,
        totalRandValue: pointsStats._sum.randValue || 0,
        pointsByType: pointsByType.map(p => ({
          type: p.type,
          points: p._sum.points || 0,
          count: p._count,
        })),
        expiringPoints: expiringPoints._sum.points || 0,
      },
      recentTransactions,
    })
  } catch (error) {
    console.error('Error fetching customer loyalty balance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer loyalty balance' },
      { status: 500 }
    )
  }
}
