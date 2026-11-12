import { NextRequest, NextResponse } from 'next/server'

// Loyalty tier thresholds
const TIER_THRESHOLDS = {
  bronze: { min: 0, max: 999, multiplier: 1, benefits: ['Basic rewards'] },
  silver: { min: 1000, max: 4999, multiplier: 1.25, benefits: ['Enhanced rewards', 'Priority support'] },
  gold: { min: 5000, max: 19999, multiplier: 1.5, benefits: ['Premium rewards', 'Priority support', 'Exclusive offers'] },
  platinum: { min: 20000, max: Infinity, multiplier: 2, benefits: ['VIP rewards', '24/7 support', 'Exclusive offers', 'Free transfers'] },
}

// Determine tier from points
function getTierFromPoints(points: number): 'bronze' | 'silver' | 'gold' | 'platinum' {
  if (points >= TIER_THRESHOLDS.platinum.min) return 'platinum'
  if (points >= TIER_THRESHOLDS.gold.min) return 'gold'
  if (points >= TIER_THRESHOLDS.silver.min) return 'silver'
  return 'bronze'
}

// Calculate points earned from transaction
function calculatePointsEarned(amountCents: bigint, tier: string): number {
  const basePoints = Math.floor(Number(amountCents) / 100) // 1 point per R1
  const multiplier = TIER_THRESHOLDS[tier as keyof typeof TIER_THRESHOLDS]?.multiplier || 1
  return Math.floor(basePoints * multiplier)
}

// GET - Fetch user's loyalty status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // In production, fetch from database
    // const loyalty = await db.loyaltyAccount.findUnique({
    //   where: { userId },
    //   include: { transactions: { orderBy: { createdAt: 'desc' }, take: 10 } }
    // })

    // Mock loyalty data
    const currentPoints = 2450
    const tier = getTierFromPoints(currentPoints)
    const tierConfig = TIER_THRESHOLDS[tier]
    const nextTier = tier === 'bronze' ? 'silver' : tier === 'silver' ? 'gold' : tier === 'gold' ? 'platinum' : null
    const pointsToNextTier = nextTier ? TIER_THRESHOLDS[nextTier].min - currentPoints : 0

    const recentTransactions = [
      {
        id: 'lt-001',
        type: 'earned',
        points: 45,
        description: 'Purchase at Sipho Spaza Shop',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        id: 'lt-002',
        type: 'earned',
        points: 127,
        description: 'Purchase at Checkers Hyper',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      {
        id: 'lt-003',
        type: 'redeemed',
        points: -100,
        description: 'Airtime voucher',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    ]

    const offers = [
      {
        id: 'offer-001',
        merchant: 'Checkers',
        title: '15% off groceries',
        description: 'Spend R200 or more and get 15% off',
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        category: 'groceries',
      },
      {
        id: 'offer-002',
        merchant: 'Engen',
        title: 'R2/L off fuel',
        description: 'Valid on all fuel types',
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        category: 'fuel',
      },
      {
        id: 'offer-003',
        merchant: 'Vodacom',
        title: 'Double data',
        description: 'Get 2x data on bundles R100+',
        validUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        category: 'airtime',
      },
    ]

    return NextResponse.json({
      success: true,
      data: {
        points: currentPoints,
        tier,
        tierConfig: {
          multiplier: tierConfig.multiplier,
          benefits: tierConfig.benefits,
        },
        nextTier,
        pointsToNextTier,
        recentTransactions,
        offers,
        stats: {
          totalEarned: 4500,
          totalRedeemed: 2050,
          lifetimePoints: 6550,
        }
      }
    })

  } catch (error) {
    console.error('Get loyalty status error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get loyalty status' },
      { status: 500 }
    )
  }
}

// POST - Earn or redeem points
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, action, points, transactionId, description } = body

    if (!userId || !action || !points) {
      return NextResponse.json(
        { success: false, error: 'User ID, action, and points are required' },
        { status: 400 }
      )
    }

    if (action === 'earn') {
      // In production:
      // 1. Get user's current tier
      // 2. Calculate points with multiplier
      // 3. Add to loyalty account
      // 4. Check for tier upgrade
      
      const result = {
        id: `lt-${Date.now()}`,
        userId,
        type: 'earned',
        points,
        description: description || 'Points earned',
        createdAt: new Date(),
      }

      return NextResponse.json({
        success: true,
        message: 'Points earned successfully',
        data: result
      })
    }

    if (action === 'redeem') {
      // In production:
      // 1. Check user has enough points
      // 2. Deduct points
      // 3. Create voucher/reward
      
      const result = {
        id: `lt-${Date.now()}`,
        userId,
        type: 'redeemed',
        points: -points,
        description: description || 'Points redeemed',
        createdAt: new Date(),
        voucherCode: `GROW${Date.now().toString(36).toUpperCase()}`,
      }

      return NextResponse.json({
        success: true,
        message: 'Points redeemed successfully',
        data: result
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "earn" or "redeem"' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Loyalty action error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process loyalty action' },
      { status: 500 }
    )
  }
}
