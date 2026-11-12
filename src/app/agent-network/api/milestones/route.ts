import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Mock agent ID for authentication (will be replaced with real auth later)
const MOCK_AGENT_ID = 'agent-demo-001'

// GET /api/agent-network/milestones - List agent milestones with progress
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const includeCompleted = searchParams.get('completed') === 'true'

    // Get agent profile
    const agent = await db.agentProfile.findUnique({
      where: { id: MOCK_AGENT_ID },
      select: {
        totalReferrals: true,
        activeReferrals: true,
        totalNetworkRevenue: true,
        totalCommissionEarned: true,
        tier: true,
      },
    })

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent profile not found' },
        { status: 404 }
      )
    }

    // Get milestones
    const where: Record<string, unknown> = {
      agentId: MOCK_AGENT_ID,
    }

    if (!includeCompleted) {
      where.completed = false
    }

    const milestones = await db.agentMilestone.findMany({
      where,
      orderBy: [
        { completed: 'asc' },
        { targetValue: 'asc' },
      ],
    })

    // Update milestone progress based on current stats
    const updatedMilestones = await Promise.all(
      milestones.map(async (milestone) => {
        let currentValue = milestone.currentValue

        // Update progress based on milestone key
        switch (milestone.milestoneKey) {
          case 'first_referral':
          case 'first_5_merchants':
          case 'first_10_merchants':
          case 'first_15_merchants':
          case 'first_30_merchants':
          case 'first_50_merchants':
            currentValue = agent.totalReferrals
            break
          case 'r10k_revenue':
          case 'r50k_revenue':
          case 'r100k_revenue':
          case 'r250k_revenue':
            currentValue = agent.totalNetworkRevenue
            break
          case 'r5k_commission':
          case 'r10k_commission':
          case 'r25k_commission':
          case 'r50k_commission':
            currentValue = agent.totalCommissionEarned
            break
          case 'first_5_active':
          case 'first_10_active':
            currentValue = agent.activeReferrals
            break
        }

        // Check if milestone is completed
        const isCompleted = currentValue >= milestone.targetValue

        // Update in database if changed
        if (currentValue !== milestone.currentValue || isCompleted !== milestone.completed) {
          await db.agentMilestone.update({
            where: { id: milestone.id },
            data: {
              currentValue,
              completed: isCompleted,
              completedAt: isCompleted && !milestone.completedAt ? new Date() : milestone.completedAt,
              updatedAt: new Date(),
            },
          })
        }

        // Calculate progress percentage
        const progressPercentage = Math.min(100, Math.round((currentValue / milestone.targetValue) * 100))

        return {
          ...milestone,
          currentValue,
          completed: isCompleted,
          progressPercentage,
          remainingValue: Math.max(0, milestone.targetValue - currentValue),
        }
      })
    )

    // Group milestones by category
    const groupedMilestones = {
      referrals: updatedMilestones.filter((m) =>
        m.milestoneKey.includes('referral') || m.milestoneKey.includes('merchant')
      ),
      revenue: updatedMilestones.filter((m) =>
        m.milestoneKey.includes('revenue') && !m.milestoneKey.includes('commission')
      ),
      commission: updatedMilestones.filter((m) =>
        m.milestoneKey.includes('commission')
      ),
      activity: updatedMilestones.filter((m) =>
        m.milestoneKey.includes('active')
      ),
    }

    // Get stats
    const completedCount = updatedMilestones.filter((m) => m.completed).length
    const totalCount = updatedMilestones.length
    const totalRewardAmount = updatedMilestones
      .filter((m) => m.completed && m.rewardType === 'bonus' && m.rewardAmount)
      .reduce((sum, m) => sum + (m.rewardAmount || 0), 0)

    const pendingRewardAmount = updatedMilestones
      .filter((m) => !m.completed && m.rewardType === 'bonus' && m.rewardAmount)
      .reduce((sum, m) => sum + (m.rewardAmount || 0), 0)

    // Get next milestone
    const nextMilestone = updatedMilestones
      .filter((m) => !m.completed)
      .sort((a, b) => a.targetValue - b.targetValue)[0]

    return NextResponse.json({
      milestones: updatedMilestones,
      grouped: groupedMilestones,
      stats: {
        completed: completedCount,
        total: totalCount,
        progressPercentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
        totalRewardEarned: totalRewardAmount,
        pendingRewardAmount,
      },
      nextMilestone: nextMilestone ? {
        name: nextMilestone.name,
        description: nextMilestone.description,
        progress: nextMilestone.progressPercentage,
        remaining: nextMilestone.remainingValue,
        reward: nextMilestone.rewardAmount,
      } : null,
    })
  } catch (error) {
    console.error('Error fetching milestones:', error)
    return NextResponse.json(
      { error: 'Failed to fetch milestones' },
      { status: 500 }
    )
  }
}
