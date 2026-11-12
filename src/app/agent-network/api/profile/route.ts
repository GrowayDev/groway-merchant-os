import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Mock agent ID for authentication (will be replaced with real auth later)
const MOCK_AGENT_ID = 'agent-demo-001'

// GET /api/agent-network/profile - Get agent profile with stats
export async function GET(request: NextRequest) {
  try {
    // Find or create agent profile
    let profile = await db.agentProfile.findUnique({
      where: { id: MOCK_AGENT_ID },
      include: {
        referrals: {
          select: {
            id: true,
            status: true,
            totalRevenue: true,
            totalCommission: true,
          },
        },
        commissions: {
          select: {
            id: true,
            amount: true,
            status: true,
            type: true,
          },
        },
        payouts: {
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        milestones: {
          where: { completed: false },
          orderBy: { currentValue: 'desc' },
        },
        _count: {
          select: {
            referrals: true,
            networkDownline: true,
          },
        },
      },
    })

    // If no profile exists, create a demo profile
    if (!profile) {
      profile = await db.agentProfile.create({
        data: {
          id: MOCK_AGENT_ID,
          referralCode: 'GROW-DEMO-001',
          firstName: 'Demo',
          lastName: 'Agent',
          email: 'demo@groway.co.za',
          phone: '+27123456789',
          tier: 'silver',
          status: 'active',
          applicationStatus: 'approved',
          totalReferrals: 12,
          activeReferrals: 8,
          totalNetworkSize: 12,
          totalNetworkRevenue: 125000,
          totalCommissionEarned: 12500,
          pendingCommission: 3500,
          lifetimeCommission: 45000,
          trainingCompleted: true,
          trainingCompletedAt: new Date('2025-01-15'),
          approvedAt: new Date('2025-01-01'),
        },
        include: {
          referrals: true,
          commissions: true,
          payouts: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          milestones: {
            where: { completed: false },
            orderBy: { currentValue: 'desc' },
          },
          _count: {
            select: {
              referrals: true,
              networkDownline: true,
            },
          },
        },
      })
    }

    // Calculate additional stats
    const totalCommissionPaid = profile.commissions
      .filter((c) => c.status === 'paid')
      .reduce((sum, c) => sum + c.amount, 0)

    const totalCommissionPending = profile.commissions
      .filter((c) => c.status === 'pending')
      .reduce((sum, c) => sum + c.amount, 0)

    const totalCommissionApproved = profile.commissions
      .filter((c) => c.status === 'approved')
      .reduce((sum, c) => sum + c.amount, 0)

    // Get tier info
    const tierInfo = getTierInfo(profile.tier)

    // Calculate tier progress
    const tierProgress = calculateTierProgress(profile.totalReferrals, profile.tier)

    const response = {
      profile: {
        id: profile.id,
        referralCode: profile.referralCode,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        businessName: profile.businessName,
        tier: profile.tier,
        tierInfo,
        status: profile.status,
        applicationStatus: profile.applicationStatus,
        trainingCompleted: profile.trainingCompleted,
        certificationLevel: profile.certificationLevel,
        bankName: profile.bankName,
        bankAccountNumber: profile.bankAccountNumber ? '****' + profile.bankAccountNumber.slice(-4) : null,
      },
      stats: {
        totalReferrals: profile.totalReferrals,
        activeReferrals: profile.activeReferrals,
        totalNetworkSize: profile.totalNetworkSize,
        totalNetworkRevenue: profile.totalNetworkRevenue,
        totalCommissionEarned: profile.totalCommissionEarned,
        pendingCommission: profile.pendingCommission,
        lifetimeCommission: profile.lifetimeCommission,
        totalCommissionPaid,
        totalCommissionPending,
        totalCommissionApproved,
        downlineCount: profile._count.networkDownline,
      },
      tierProgress,
      recentPayouts: profile.payouts,
      activeMilestones: profile.milestones,
      createdAt: profile.createdAt,
      approvedAt: profile.approvedAt,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching agent profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agent profile' },
      { status: 500 }
    )
  }
}

// POST /api/agent-network/profile - Create or update agent profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      firstName,
      lastName,
      email,
      phone,
      idNumber,
      businessName,
      bankName,
      bankAccountNumber,
      bankAccountType,
    } = body

    // Validate required fields
    if (!firstName || !lastName || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, email, phone' },
        { status: 400 }
      )
    }

    // Check if profile exists
    const existingProfile = await db.agentProfile.findUnique({
      where: { id: MOCK_AGENT_ID },
    })

    if (existingProfile) {
      // Update existing profile
      const updatedProfile = await db.agentProfile.update({
        where: { id: MOCK_AGENT_ID },
        data: {
          firstName,
          lastName,
          email,
          phone,
          idNumber,
          businessName,
          bankName,
          bankAccountNumber,
          bankAccountType,
          updatedAt: new Date(),
        },
      })

      return NextResponse.json({
        message: 'Profile updated successfully',
        profile: updatedProfile,
      })
    }

    // Create new profile
    const referralCode = await generateReferralCode()

    const newProfile = await db.agentProfile.create({
      data: {
        id: MOCK_AGENT_ID,
        referralCode,
        firstName,
        lastName,
        email,
        phone,
        idNumber,
        businessName,
        bankName,
        bankAccountNumber,
        bankAccountType,
        tier: 'starter',
        status: 'active',
        applicationStatus: 'pending',
      },
    })

    // Create default milestones for new agent
    await createDefaultMilestones(newProfile.id)

    return NextResponse.json({
      message: 'Profile created successfully',
      profile: newProfile,
    })
  } catch (error) {
    console.error('Error creating/updating agent profile:', error)
    return NextResponse.json(
      { error: 'Failed to create/update agent profile' },
      { status: 500 }
    )
  }
}

// Helper functions
function getTierInfo(tier: string) {
  const tiers: Record<string, { commission: number; minReferrals: number; benefits: string[] }> = {
    starter: {
      commission: 0.05,
      minReferrals: 0,
      benefits: ['Basic commission rate', 'Referral code', 'Dashboard access', 'Email support'],
    },
    bronze: {
      commission: 0.07,
      minReferrals: 5,
      benefits: ['Higher commission', 'Priority support', 'Marketing materials', 'Training access'],
    },
    silver: {
      commission: 0.10,
      minReferrals: 15,
      benefits: ['Premium commission', 'Dedicated account manager', 'Custom referral links', 'Advanced analytics'],
    },
    gold: {
      commission: 0.12,
      minReferrals: 30,
      benefits: ['Elite commission', 'Network override (2nd level)', 'Exclusive events', 'Priority payouts'],
    },
    platinum: {
      commission: 0.15,
      minReferrals: 50,
      benefits: ['Maximum commission', 'Network override (3 levels)', 'Enterprise preview', 'VIP support'],
    },
  }
  return tiers[tier] || tiers.starter
}

function calculateTierProgress(totalReferrals: number, currentTier: string) {
  const tierThresholds = [
    { tier: 'starter', min: 0, max: 4 },
    { tier: 'bronze', min: 5, max: 14 },
    { tier: 'silver', min: 15, max: 29 },
    { tier: 'gold', min: 30, max: 49 },
    { tier: 'platinum', min: 50, max: Infinity },
  ]

  const currentIndex = tierThresholds.findIndex((t) => t.tier === currentTier)
  const current = tierThresholds[currentIndex]
  const next = tierThresholds[currentIndex + 1]

  if (!next) {
    return {
      currentTier,
      nextTier: null,
      currentReferrals: totalReferrals,
      referralsToNext: 0,
      progressPercentage: 100,
    }
  }

  const rangeStart = current.min
  const rangeEnd = next.min - 1
  const rangeSize = rangeEnd - rangeStart + 1
  const progressInRange = totalReferrals - rangeStart
  const progressPercentage = Math.min(100, Math.round((progressInRange / rangeSize) * 100))

  return {
    currentTier,
    nextTier: next.tier,
    currentReferrals: totalReferrals,
    referralsToNext: next.min - totalReferrals,
    progressPercentage,
  }
}

async function generateReferralCode(): Promise<string> {
  const prefix = 'GROW'
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = prefix + '-'
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  // Ensure uniqueness
  const existing = await db.agentProfile.findUnique({
    where: { referralCode: code },
  })

  if (existing) {
    return generateReferralCode()
  }

  return code
}

async function createDefaultMilestones(agentId: string) {
  const defaultMilestones = [
    {
      milestoneKey: 'first_referral',
      name: 'First Referral',
      description: 'Refer your first merchant',
      targetValue: 1,
      rewardType: 'bonus',
      rewardAmount: 100,
    },
    {
      milestoneKey: 'first_5_merchants',
      name: 'Getting Started',
      description: 'Refer 5 merchants to reach Bronze tier',
      targetValue: 5,
      rewardType: 'tier_upgrade',
      rewardAmount: null,
    },
    {
      milestoneKey: 'first_10_merchants',
      name: 'Building Momentum',
      description: 'Refer 10 merchants',
      targetValue: 10,
      rewardType: 'bonus',
      rewardAmount: 500,
    },
    {
      milestoneKey: 'r10k_revenue',
      name: 'Revenue Generator',
      description: 'Generate R10,000 in total network revenue',
      targetValue: 10000,
      rewardType: 'bonus',
      rewardAmount: 1000,
    },
    {
      milestoneKey: 'r50k_revenue',
      name: 'Network Builder',
      description: 'Generate R50,000 in total network revenue',
      targetValue: 50000,
      rewardType: 'bonus',
      rewardAmount: 2500,
    },
  ]

  for (const milestone of defaultMilestones) {
    await db.agentMilestone.create({
      data: {
        agentId,
        ...milestone,
      },
    })
  }
}
