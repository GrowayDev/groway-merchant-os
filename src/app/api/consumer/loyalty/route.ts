import { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { getUserId, ok, error } from '../_lib/helpers'

/**
 * /api/consumer/loyalty
 *
 * Replaces the previous hardcoded mock (currentPoints = 2450) with a real
 * Prisma query to ConsumerLoyalty. The loyalty record is created on user
 * registration, but if it's missing we create one with 0 points and a
 * bronze tier so the route is self-healing.
 */

const TIER_THRESHOLDS = {
  bronze: { min: 0, max: 999, multiplier: 1, benefits: ['Basic rewards'] },
  silver: { min: 1000, max: 4999, multiplier: 1.25, benefits: ['Enhanced rewards', 'Priority support'] },
  gold: { min: 5000, max: 19999, multiplier: 1.5, benefits: ['Premium rewards', 'Priority support', 'Exclusive offers'] },
  platinum: { min: 20000, max: Infinity, multiplier: 2, benefits: ['VIP rewards', '24/7 support', 'Exclusive offers', 'Free transfers'] },
} as const

type Tier = keyof typeof TIER_THRESHOLDS

function getTierFromPoints(points: number): Tier {
  if (points >= TIER_THRESHOLDS.platinum.min) return 'platinum'
  if (points >= TIER_THRESHOLDS.gold.min) return 'gold'
  if (points >= TIER_THRESHOLDS.silver.min) return 'silver'
  return 'bronze'
}

function nextTierFor(tier: Tier): Tier | null {
  if (tier === 'bronze') return 'silver'
  if (tier === 'silver') return 'gold'
  if (tier === 'gold') return 'platinum'
  return null
}

// GET - fetch loyalty status for the user
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)

    const loyalty = await db.consumerLoyalty.findUnique({ where: { userId } })

    // Self-heal: create a zero-points bronze account if missing
    const effective = loyalty ?? (await db.consumerLoyalty.create({
      data: {
        id: `loy-${randomBytes(8).toString('hex')}`,
        userId,
        tier: 'bronze',
        points: 0,
        totalEarned: 0,
        totalRedeemed: 0,
        tierProgress: 0,
        updatedAt: new Date(),
      },
    }))

    const currentPoints = effective.points
    const tier = getTierFromPoints(currentPoints)
    const tierConfig = TIER_THRESHOLDS[tier]
    const nextTier = nextTierFor(tier)
    const pointsToNextTier = nextTier ? Math.max(0, TIER_THRESHOLDS[nextTier].min - currentPoints) : 0

    return ok({
      success: true,
      data: {
        id: effective.id,
        points: currentPoints,
        tier,
        tierConfig: {
          multiplier: tierConfig.multiplier,
          benefits: tierConfig.benefits,
        },
        nextTier,
        pointsToNextTier,
        tierProgress: effective.tierProgress,
        tierAchievedAt: effective.tierAchievedAt,
        stats: {
          totalEarned: effective.totalEarned,
          totalRedeemed: effective.totalRedeemed,
          lifetimePoints: effective.totalEarned + 0,
        },
        createdAt: effective.createdAt,
        updatedAt: effective.updatedAt,
      },
    })
  } catch (err) {
    console.error('Get loyalty status error:', err)
    return error('Failed to get loyalty status', 500)
  }
}

// POST - earn or redeem points
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const body = await request.json().catch(() => ({} as Record<string, unknown>))

    const action = body.action as string | undefined
    const points = Number(body.points ?? 0)
    const description = (body.description as string) || (action === 'earn' ? 'Points earned' : 'Points redeemed')

    if (!action || !points || points <= 0) {
      return error('action (earn|redeem) and a positive points value are required')
    }

    const loyalty = await db.consumerLoyalty.findUnique({ where: { userId } })
    const current = loyalty ?? (await db.consumerLoyalty.create({
      data: {
        id: `loy-${randomBytes(8).toString('hex')}`,
        userId,
        tier: 'bronze',
        points: 0,
        totalEarned: 0,
        totalRedeemed: 0,
        tierProgress: 0,
        updatedAt: new Date(),
      },
    }))

    if (action === 'earn') {
      const tierMultiplier = TIER_THRESHOLDS[getTierFromPoints(current.points)].multiplier
      const earned = Math.floor(points * tierMultiplier)
      const newPoints = current.points + earned
      const newTier = getTierFromPoints(newPoints)
      const tierAchievedAt = newTier !== getTierFromPoints(current.points) ? new Date() : current.tierAchievedAt

      const updated = await db.consumerLoyalty.update({
        where: { userId },
        data: {
          points: newPoints,
          totalEarned: current.totalEarned + earned,
          tier: newTier,
          tierAchievedAt,
          tierProgress: 0,
          updatedAt: new Date(),
        },
      })

      return ok({
        success: true,
        message: 'Points earned successfully',
        data: {
          id: `lt-${randomBytes(8).toString('hex')}`,
          userId,
          type: 'earned',
          points: earned,
          description,
          createdAt: new Date(),
          loyalty: updated,
        },
      })
    }

    if (action === 'redeem') {
      if (current.points < points) {
        return error('Insufficient points', 400)
      }
      const newPoints = current.points - points
      const newTier = getTierFromPoints(newPoints)
      const voucherCode = `GROW${Date.now().toString(36).toUpperCase()}`

      const updated = await db.consumerLoyalty.update({
        where: { userId },
        data: {
          points: newPoints,
          totalRedeemed: current.totalRedeemed + points,
          tier: newTier,
          tierProgress: 0,
          updatedAt: new Date(),
        },
      })

      return ok({
        success: true,
        message: 'Points redeemed successfully',
        data: {
          id: `lt-${randomBytes(8).toString('hex')}`,
          userId,
          type: 'redeemed',
          points: -points,
          description,
          createdAt: new Date(),
          voucherCode,
          loyalty: updated,
        },
      })
    }

    return error('Invalid action. Use "earn" or "redeem"', 400)
  } catch (err) {
    console.error('Loyalty action error:', err)
    return error('Failed to process loyalty action', 500)
  }
}
