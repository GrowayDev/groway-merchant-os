import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateReference, type ApiResponse } from '@/lib/wallet-utils'
import { nanoid } from 'nanoid'

// Loyalty tier configuration
const LOYALTY_TIERS = {
  bronze: {
    name: 'Bronze',
    minPoints: 0,
    pointsMultiplier: 1.0,
    benefits: ['Basic rewards'],
    color: '#CD7F32'
  },
  silver: {
    name: 'Silver',
    minPoints: 500,
    pointsMultiplier: 1.25,
    benefits: ['25% bonus points', 'Priority support', 'Birthday bonus'],
    color: '#C0C0C0'
  },
  gold: {
    name: 'Gold',
    minPoints: 2000,
    pointsMultiplier: 1.5,
    benefits: ['50% bonus points', 'Priority support', 'Birthday bonus', 'Exclusive offers'],
    color: '#FFD700'
  },
  platinum: {
    name: 'Platinum',
    minPoints: 5000,
    pointsMultiplier: 2.0,
    benefits: ['100% bonus points', 'VIP support', 'Birthday bonus', 'Exclusive offers', 'Free transfers'],
    color: '#E5E4E2'
  },
  diamond: {
    name: 'Diamond',
    minPoints: 10000,
    pointsMultiplier: 2.5,
    benefits: ['150% bonus points', 'Dedicated account manager', 'Birthday bonus', 'Exclusive offers', 'Free transfers', 'Premium rewards'],
    color: '#B9F2FF'
  }
}

// Points conversion rate: 100 points = R1
const POINTS_TO_RAND = 100

// Points earning rules
const EARNING_RULES = {
  send: { pointsPerRand: 1 }, // 1 point per R1 sent
  receive: { pointsPerRand: 1 }, // 1 point per R1 received
  topup: { pointsPerRand: 1 }, // 1 point per R1 topped up
  bill_payment: { pointsPerRand: 2 }, // 2 points per R1 for bills
  merchant_purchase: { pointsPerRand: 2 }, // 2 points per R1 at merchants
  referral: { flatPoints: 500 }, // 500 points per referral
  birthday: { flatPoints: 1000 } // 1000 birthday bonus
}

// GET - Get loyalty points balance and history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const includeHistory = searchParams.get('history') === 'true'
    const includeMerchants = searchParams.get('merchants') === 'true'

    if (!userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'User ID is required'
      }, { status: 400 })
    }

    // Get or create loyalty record
    let loyalty = await db.consumerLoyalty.findUnique({
      where: { userId }
    })

    if (!loyalty) {
      loyalty = await db.consumerLoyalty.create({
        data: {
          id: `loy_${nanoid(12)}`,
          userId,
          tier: 'bronze',
          points: 0,
          totalEarned: 0,
          totalRedeemed: 0,
          tierProgress: 0
        }
      })
    }

    // Calculate tier info
    const currentTier = LOYALTY_TIERS[loyalty.tier as keyof typeof LOYALTY_TIERS] || LOYALTY_TIERS.bronze
    const tierEntries = Object.entries(LOYALTY_TIERS)
    const currentTierIndex = tierEntries.findIndex(([key]) => key === loyalty.tier)
    const nextTier = currentTierIndex < tierEntries.length - 1 
      ? LOYALTY_TIERS[tierEntries[currentTierIndex + 1][0] as keyof typeof LOYALTY_TIERS]
      : null

    // Calculate points value
    const pointsValue = Math.floor(loyalty.points / POINTS_TO_RAND)
    const redeemablePoints = Math.floor(loyalty.points / POINTS_TO_RAND) * POINTS_TO_RAND

    // Build response
    const response: Record<string, unknown> = {
      loyalty: {
        id: loyalty.id,
        tier: loyalty.tier,
        tierName: currentTier.name,
        tierColor: currentTier.color,
        points: loyalty.points,
        pointsValue,
        redeemablePoints,
        totalEarned: loyalty.totalEarned,
        totalRedeemed: loyalty.totalRedeemed,
        pointsMultiplier: currentTier.pointsMultiplier,
        benefits: currentTier.benefits,
        tierProgress: loyalty.tierProgress,
        pointsToNextTier: loyalty.pointsToNextTier,
        nextTier: nextTier ? {
          name: nextTier.name,
          minPoints: nextTier.minPoints,
          pointsNeeded: nextTier.minPoints - loyalty.totalEarned
        } : null
      },
      earningRules: EARNING_RULES,
      conversionRate: {
        points: POINTS_TO_RAND,
        value: 1, // R1
        displayText: `${POINTS_TO_RAND} points = R1`
      }
    }

    // Include transaction history
    if (includeHistory) {
      const history = await db.consumerTransaction.findMany({
        where: {
          userId,
          transactionType: { in: ['send', 'receive', 'topup', 'bill_payment', 'loyalty_redemption', 'loyalty_earned'] }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      })

      // Calculate points earned per transaction
      const historyWithPoints = history.map(tx => ({
        ...tx,
        pointsEarned: calculatePointsForTransaction(tx.transactionType, Number(tx.amountCents))
      }))

      response['history'] = historyWithPoints

      // Monthly summary
      const monthStart = new Date()
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)

      const monthlyEarned = await db.consumerTransaction.aggregate({
        where: {
          userId,
          transactionType: { in: ['send', 'receive', 'topup', 'bill_payment'] },
          createdAt: { gte: monthStart }
        },
        _sum: { amountCents: true }
      })

      response['monthlySummary'] = {
        totalSpent: Number(monthlyEarned._sum.amountCents || 0) / 100,
        pointsEarned: calculatePointsForTransaction('monthly', Number(monthlyEarned._sum.amountCents || 0))
      }
    }

    // Include merchant loyalty programs
    if (includeMerchants) {
      // Get linked merchant loyalty cards
      const merchantCards = await db.consumerTransaction.groupBy({
        by: ['merchantId', 'merchantName'],
        where: {
          userId,
          merchantId: { not: null }
        },
        _count: true,
        _sum: { amountCents: true },
        orderBy: { _sum: { amountCents: 'desc' } },
        take: 10
      })

      response['merchantPrograms'] = merchantCards.map(m => ({
        merchantId: m.merchantId,
        merchantName: m.merchantName,
        transactionCount: m._count,
        totalSpent: Number(m._sum.amountCents || 0) / 100,
        estimatedPoints: Math.floor(Number(m._sum.amountCents || 0) / 100) * EARNING_RULES.merchant_purchase.pointsPerRand
      }))
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: response
    })
  } catch (error) {
    console.error('Error fetching loyalty:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch loyalty information'
    }, { status: 500 })
  }
}

// POST - Convert points, sync with merchant, or claim rewards
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId, pointsToRedeem, merchantId, merchantData, referralCode } = body

    if (!userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'User ID is required'
      }, { status: 400 })
    }

    switch (action) {
      case 'redeem': {
        // Convert points to wallet credit
        if (!pointsToRedeem || pointsToRedeem < POINTS_TO_RAND) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: `Minimum redemption is ${POINTS_TO_RAND} points`
          }, { status: 400 })
        }

        const loyalty = await db.consumerLoyalty.findUnique({
          where: { userId }
        })

        if (!loyalty) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Loyalty account not found'
          }, { status: 404 })
        }

        if (loyalty.points < pointsToRedeem) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: `Insufficient points. Available: ${loyalty.points}, Requested: ${pointsToRedeem}`
          }, { status: 400 })
        }

        // Calculate credit amount
        const creditCents = BigInt(Math.floor(pointsToRedeem / POINTS_TO_RAND) * 100)
        const reference = generateReference('LYR')

        // Create transaction
        const transaction = await db.consumerTransaction.create({
          data: {
            id: `txn_${nanoid(16)}`,
            idempotencyKey: `lyr_redeem_${userId}_${Date.now()}`,
            userId,
            transactionType: 'loyalty_redemption',
            direction: 'credit',
            amountCents: creditCents,
            feeCents: BigInt(0),
            netAmountCents: creditCents,
            currency: 'ZAR',
            status: 'completed',
            description: `Loyalty points redemption: ${pointsToRedeem} points`,
            reference,
            category: 'loyalty',
            completedAt: new Date()
          }
        })

        // Update wallet
        await db.consumerWallet.update({
          where: { userId },
          data: {
            balanceCents: { increment: creditCents }
          }
        })

        // Update loyalty
        await db.consumerLoyalty.update({
          where: { userId },
          data: {
            points: { decrement: pointsToRedeem },
            totalRedeemed: { increment: pointsToRedeem }
          }
        })

        return NextResponse.json<ApiResponse>({
          success: true,
          data: {
            pointsRedeemed: pointsToRedeem,
            creditAmount: Number(creditCents) / 100,
            newPointsBalance: loyalty.points - pointsToRedeem,
            transaction
          },
          transaction: {
            id: transaction.id,
            reference,
            status: 'completed'
          }
        })
      }

      case 'sync_merchant': {
        // Sync loyalty points with merchant POS
        if (!merchantId || !merchantData) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Merchant ID and data are required'
          }, { status: 400 })
        }

        const { transactionAmount, transactionId: externalTxId, pointsEarned } = merchantData

        const loyalty = await db.consumerLoyalty.findUnique({
          where: { userId }
        })

        if (!loyalty) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Loyalty account not found'
          }, { status: 404 })
        }

        const tier = LOYALTY_TIERS[loyalty.tier as keyof typeof LOYALTY_TIERS] || LOYALTY_TIERS.bronze
        
        // Calculate points with tier multiplier
        const basePoints = pointsEarned || Math.floor(transactionAmount * EARNING_RULES.merchant_purchase.pointsPerRand)
        const bonusPoints = Math.floor(basePoints * (tier.pointsMultiplier - 1))
        const totalPoints = basePoints + bonusPoints

        // Create sync record
        const reference = generateReference('MSYNC')
        await db.consumerTransaction.create({
          data: {
            id: `txn_${nanoid(16)}`,
            idempotencyKey: `msync_${externalTxId || Date.now()}`,
            userId,
            transactionType: 'loyalty_earned',
            direction: 'credit',
            amountCents: BigInt(0),
            feeCents: BigInt(0),
            netAmountCents: BigInt(0),
            currency: 'ZAR',
            status: 'completed',
            description: `Loyalty earned at merchant: ${totalPoints} points (${basePoints} base + ${bonusPoints} tier bonus)`,
            reference,
            category: 'loyalty',
            merchantId,
            completedAt: new Date()
          }
        })

        // Update loyalty
        const newTotalEarned = loyalty.totalEarned + totalPoints
        const newTier = determineTier(newTotalEarned)
        
        await db.consumerLoyalty.update({
          where: { userId },
          data: {
            points: { increment: totalPoints },
            totalEarned: { increment: totalPoints },
            tier: newTier.tier,
            tierProgress: newTier.progress,
            pointsToNextTier: newTier.pointsToNext
          }
        })

        return NextResponse.json<ApiResponse>({
          success: true,
          data: {
            synced: true,
            basePoints,
            bonusPoints,
            totalPointsEarned: totalPoints,
            tier: loyalty.tier,
            tierMultiplier: tier.pointsMultiplier,
            newPointsBalance: loyalty.points + totalPoints
          }
        })
      }

      case 'claim_referral': {
        // Claim referral bonus
        if (!referralCode) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Referral code is required'
          }, { status: 400 })
        }

        const loyalty = await db.consumerLoyalty.findUnique({
          where: { userId }
        })

        if (!loyalty) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Loyalty account not found'
          }, { status: 404 })
        }

        // Check if referral already claimed (would check against referral system)
        const existingClaim = await db.consumerTransaction.findFirst({
          where: {
            userId,
            transactionType: 'loyalty_earned',
            description: { contains: 'Referral bonus' }
          }
        })

        if (existingClaim) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Referral bonus already claimed'
          }, { status: 400 })
        }

        const bonusPoints = EARNING_RULES.referral.flatPoints
        const reference = generateReference('REF')

        // Create transaction
        await db.consumerTransaction.create({
          data: {
            id: `txn_${nanoid(16)}`,
            idempotencyKey: `ref_${userId}_${referralCode}`,
            userId,
            transactionType: 'loyalty_earned',
            direction: 'credit',
            amountCents: BigInt(0),
            feeCents: BigInt(0),
            netAmountCents: BigInt(0),
            currency: 'ZAR',
            status: 'completed',
            description: `Referral bonus: ${bonusPoints} points`,
            reference,
            category: 'loyalty',
            completedAt: new Date()
          }
        })

        // Update loyalty
        await db.consumerLoyalty.update({
          where: { userId },
          data: {
            points: { increment: bonusPoints },
            totalEarned: { increment: bonusPoints }
          }
        })

        return NextResponse.json<ApiResponse>({
          success: true,
          data: {
            claimed: true,
            bonusPoints,
            newPointsBalance: loyalty.points + bonusPoints
          }
        })
      }

      case 'claim_birthday': {
        // Claim birthday bonus
        const user = await db.consumerUser.findUnique({
          where: { id: userId }
        })

        if (!user || !user.dateOfBirth) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Date of birth not set'
          }, { status: 400 })
        }

        // Check if birthday month
        const dob = new Date(user.dateOfBirth)
        const now = new Date()
        if (dob.getMonth() !== now.getMonth()) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Birthday bonus can only be claimed in your birthday month'
          }, { status: 400 })
        }

        // Check if already claimed this year
        const yearStart = new Date(now.getFullYear(), 0, 1)
        const existingClaim = await db.consumerTransaction.findFirst({
          where: {
            userId,
            transactionType: 'loyalty_earned',
            description: { contains: 'Birthday bonus' },
            createdAt: { gte: yearStart }
          }
        })

        if (existingClaim) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Birthday bonus already claimed this year'
          }, { status: 400 })
        }

        const loyalty = await db.consumerLoyalty.findUnique({
          where: { userId }
        })

        if (!loyalty) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Loyalty account not found'
          }, { status: 404 })
        }

        const bonusPoints = EARNING_RULES.birthday.flatPoints
        const reference = generateReference('BDAY')

        // Create transaction
        await db.consumerTransaction.create({
          data: {
            id: `txn_${nanoid(16)}`,
            idempotencyKey: `bday_${userId}_${now.getFullYear()}`,
            userId,
            transactionType: 'loyalty_earned',
            direction: 'credit',
            amountCents: BigInt(0),
            feeCents: BigInt(0),
            netAmountCents: BigInt(0),
            currency: 'ZAR',
            status: 'completed',
            description: `Birthday bonus: ${bonusPoints} points`,
            reference,
            category: 'loyalty',
            completedAt: new Date()
          }
        })

        // Update loyalty
        await db.consumerLoyalty.update({
          where: { userId },
          data: {
            points: { increment: bonusPoints },
            totalEarned: { increment: bonusPoints }
          }
        })

        return NextResponse.json<ApiResponse>({
          success: true,
          data: {
            claimed: true,
            bonusPoints,
            newPointsBalance: loyalty.points + bonusPoints
          }
        })
      }

      default:
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Invalid action'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Error processing loyalty action:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to process loyalty action'
    }, { status: 500 })
  }
}

// Helper function to calculate points for transaction
function calculatePointsForTransaction(transactionType: string, amountCents: number): number {
  const rules = EARNING_RULES[transactionType as keyof typeof EARNING_RULES]
  if (!rules) return 0

  if ('flatPoints' in rules) {
    return rules.flatPoints
  }

  const amountRands = amountCents / 100
  return Math.floor(amountRands * rules.pointsPerRand)
}

// Helper function to determine tier based on total earned points
function determineTier(totalEarned: number): { tier: string; progress: number; pointsToNext: number | null } {
  const tiers = Object.entries(LOYALTY_TIERS).reverse()
  
  for (const [key, tier] of tiers) {
    if (totalEarned >= tier.minPoints) {
      // Find next tier
      const nextTierEntry = tiers.find(([k, t]) => t.minPoints > tier.minPoints)
      
      if (nextTierEntry) {
        const nextTier = nextTierEntry[1]
        const progress = ((totalEarned - tier.minPoints) / (nextTier.minPoints - tier.minPoints)) * 100
        return { tier: key, progress, pointsToNext: nextTier.minPoints - totalEarned }
      }
      
      return { tier: key, progress: 100, pointsToNext: null }
    }
  }
  
  return { tier: 'bronze', progress: 0, pointsToNext: LOYALTY_TIERS.silver.minPoints }
}
