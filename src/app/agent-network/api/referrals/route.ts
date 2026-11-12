import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Mock agent ID for authentication (will be replaced with real auth later)
const MOCK_AGENT_ID = 'agent-demo-001'

// GET /api/agent-network/referrals - List all referrals with pagination
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') || undefined
    const search = searchParams.get('search') || undefined

    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = {
      agentId: MOCK_AGENT_ID,
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (search) {
      where.OR = [
        { businessName: { contains: search } },
        { contactName: { contains: search } },
        { contactEmail: { contains: search } },
        { contactPhone: { contains: search } },
      ]
    }

    // Get referrals with count
    const [referrals, totalCount] = await Promise.all([
      db.agentReferral.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.agentReferral.count({ where }),
    ])

    // Get summary stats
    const stats = await db.agentReferral.aggregate({
      where: { agentId: MOCK_AGENT_ID },
      _count: { id: true },
      _sum: { totalRevenue: true, totalCommission: true },
    })

    const statusCounts = await db.agentReferral.groupBy({
      by: ['status'],
      where: { agentId: MOCK_AGENT_ID },
      _count: { id: true },
    })

    const statusBreakdown = statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count.id
      return acc
    }, {} as Record<string, number>)

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      referrals,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      stats: {
        total: stats._count.id || 0,
        totalRevenue: stats._sum.totalRevenue || 0,
        totalCommission: stats._sum.totalCommission || 0,
        statusBreakdown,
      },
    })
  } catch (error) {
    console.error('Error fetching referrals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch referrals' },
      { status: 500 }
    )
  }
}

// POST /api/agent-network/referrals - Create a new referral
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      businessName,
      contactName,
      contactEmail,
      contactPhone,
      businessType,
      address,
      city,
      province,
      referralSource,
      utmSource,
      utmCampaign,
      notes,
    } = body

    // Validate required fields
    if (!businessName || !contactName || !contactPhone) {
      return NextResponse.json(
        { error: 'Missing required fields: businessName, contactName, contactPhone' },
        { status: 400 }
      )
    }

    // Check if agent profile exists
    const agent = await db.agentProfile.findUnique({
      where: { id: MOCK_AGENT_ID },
    })

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent profile not found' },
        { status: 404 }
      )
    }

    // Create referral
    const referral = await db.agentReferral.create({
      data: {
        agentId: MOCK_AGENT_ID,
        businessName,
        contactName,
        contactEmail,
        contactPhone,
        businessType,
        address,
        city,
        province,
        referralSource: referralSource || 'direct',
        utmSource,
        utmCampaign,
        notes,
        status: 'pending',
        commissionRate: getCommissionRateForTier(agent.tier),
      },
    })

    // Update agent stats
    await db.agentProfile.update({
      where: { id: MOCK_AGENT_ID },
      data: {
        totalReferrals: { increment: 1 },
        totalNetworkSize: { increment: 1 },
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      message: 'Referral created successfully',
      referral,
    })
  } catch (error) {
    console.error('Error creating referral:', error)
    return NextResponse.json(
      { error: 'Failed to create referral' },
      { status: 500 }
    )
  }
}

// Helper function to get commission rate based on tier
function getCommissionRateForTier(tier: string): number {
  const rates: Record<string, number> = {
    starter: 0.05,
    bronze: 0.07,
    silver: 0.10,
    gold: 0.12,
    platinum: 0.15,
  }
  return rates[tier] || 0.05
}
