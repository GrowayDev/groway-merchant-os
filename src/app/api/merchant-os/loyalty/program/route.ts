import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/merchant-os/loyalty/program - Get loyalty program details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const includeRewards = searchParams.get('includeRewards') === 'true'
    const includeTiers = searchParams.get('includeTiers') === 'true'
    const includeRules = searchParams.get('includeRules') === 'true'

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
    }

    const program = await db.loyaltyProgram.findUnique({
      where: { merchantId },
      include: {
        LoyaltyTier: includeTiers ? {
          orderBy: { level: 'asc' }
        } : false,
        LoyaltyReward: includeRewards ? {
          where: { active: true },
          orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }]
        } : false,
        LoyaltyEarningRule: includeRules ? {
          where: { active: true },
          orderBy: { priority: 'desc' }
        } : false,
      }
    })

    if (!program) {
      // Return default program structure
      return NextResponse.json({
        program: null,
        defaultProgram: {
          name: 'Loyalty Rewards',
          pointsPerRand: 1,
          pointsValue: 0.01,
          minRedemption: 100,
          tierSystemEnabled: true,
          tiers: [
            { name: 'Bronze', level: 1, minPoints: 0, pointsMultiplier: 1.0, color: '#CD7F32' },
            { name: 'Silver', level: 2, minPoints: 500, pointsMultiplier: 1.25, color: '#C0C0C0' },
            { name: 'Gold', level: 3, minPoints: 2000, pointsMultiplier: 1.5, color: '#FFD700' },
            { name: 'Platinum', level: 4, minPoints: 5000, pointsMultiplier: 2.0, color: '#E5E4E2' },
          ],
          rewards: [
            { name: 'R50 Voucher', pointsCost: 500, rewardType: 'voucher', rewardValue: 50 },
            { name: 'R100 Voucher', pointsCost: 900, rewardType: 'voucher', rewardValue: 100 },
            { name: '10% Discount', pointsCost: 300, rewardType: 'discount', discountPercent: 10 },
            { name: 'Free Dessert', pointsCost: 200, rewardType: 'free_item' },
          ]
        }
      })
    }

    return NextResponse.json({ program })
  } catch (error) {
    console.error('Error fetching loyalty program:', error)
    return NextResponse.json(
      { error: 'Failed to fetch loyalty program' },
      { status: 500 }
    )
  }
}

// POST /api/merchant-os/loyalty/program - Create loyalty program
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      merchantId,
      name,
      description,
      pointsPerRand = 1,
      pointsValue = 0.01,
      minRedemption = 100,
      maxRedemption,
      tierSystemEnabled = true,
      pointsExpiryMonths = 24,
      referralEnabled = false,
      referrerBonus = 500,
      refereeBonus = 250,
      birthdayBonus = 100,
      birthdayEnabled = true,
      tiers = [],
    } = body

    if (!merchantId || !name) {
      return NextResponse.json(
        { error: 'merchantId and name are required' },
        { status: 400 }
      )
    }

    // Check if program already exists
    const existing = await db.loyaltyProgram.findUnique({
      where: { merchantId }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Loyalty program already exists for this merchant' },
        { status: 400 }
      )
    }

    // Create program
    const program = await db.loyaltyProgram.create({
      data: {
        merchantId,
        name,
        description,
        pointsPerRand,
        pointsValue,
        minRedemption,
        maxRedemption,
        tierSystemEnabled,
        pointsExpiryMonths,
        referralEnabled,
        referrerBonus,
        refereeBonus,
        birthdayBonus,
        birthdayEnabled,
      },
    })

    // Create default tiers if tier system enabled
    if (tierSystemEnabled && tiers.length === 0) {
      const defaultTiers = [
        { programId: program.id, name: 'Bronze', level: 1, minPoints: 0, pointsMultiplier: 1.0, color: '#CD7F32', discountPercent: 0 },
        { programId: program.id, name: 'Silver', level: 2, minPoints: 500, pointsMultiplier: 1.25, color: '#C0C0C0', discountPercent: 2 },
        { programId: program.id, name: 'Gold', level: 3, minPoints: 2000, pointsMultiplier: 1.5, color: '#FFD700', discountPercent: 5 },
        { programId: program.id, name: 'Platinum', level: 4, minPoints: 5000, pointsMultiplier: 2.0, color: '#E5E4E2', discountPercent: 10 },
      ]

      for (const tier of defaultTiers) {
        await db.loyaltyTier.create({ data: tier })
      }
    } else if (tiers.length > 0) {
      // Create provided tiers
      for (const tier of tiers) {
        await db.loyaltyTier.create({
          data: {
            programId: program.id,
            ...tier
          }
        })
      }
    }

    // Fetch the complete program
    const completeProgram = await db.loyaltyProgram.findUnique({
      where: { id: program.id },
      include: {
        LoyaltyTier: {
          orderBy: { level: 'asc' }
        }
      }
    })

    return NextResponse.json({ program: completeProgram }, { status: 201 })
  } catch (error) {
    console.error('Error creating loyalty program:', error)
    return NextResponse.json(
      { error: 'Failed to create loyalty program' },
      { status: 500 }
    )
  }
}

// PUT /api/merchant-os/loyalty/program - Update loyalty program
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { merchantId, ...updates } = body

    if (!merchantId) {
      return NextResponse.json(
        { error: 'merchantId is required' },
        { status: 400 }
      )
    }

    const program = await db.loyaltyProgram.update({
      where: { merchantId },
      data: {
        ...updates,
        updatedAt: new Date()
      },
      include: {
        LoyaltyTier: {
          orderBy: { level: 'asc' }
        }
      }
    })

    return NextResponse.json({ program })
  } catch (error) {
    console.error('Error updating loyalty program:', error)
    return NextResponse.json(
      { error: 'Failed to update loyalty program' },
      { status: 500 }
    )
  }
}

// DELETE /api/merchant-os/loyalty/program - Delete loyalty program
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')

    if (!merchantId) {
      return NextResponse.json(
        { error: 'merchantId is required' },
        { status: 400 }
      )
    }

    await db.loyaltyProgram.delete({
      where: { merchantId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting loyalty program:', error)
    return NextResponse.json(
      { error: 'Failed to delete loyalty program' },
      { status: 500 }
    )
  }
}
