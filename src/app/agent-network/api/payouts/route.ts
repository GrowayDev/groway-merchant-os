import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Mock agent ID for authentication (will be replaced with real auth later)
const MOCK_AGENT_ID = 'agent-demo-001'

// Minimum payout amount
const MIN_PAYOUT_AMOUNT = 500

// GET /api/agent-network/payouts - List payout history
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') || undefined

    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = {
      agentId: MOCK_AGENT_ID,
    }

    if (status && status !== 'all') {
      where.status = status
    }

    // Get payouts with count
    const [payouts, totalCount] = await Promise.all([
      db.agentPayout.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.agentPayout.count({ where }),
    ])

    // Get agent profile for pending commission balance
    const agent = await db.agentProfile.findUnique({
      where: { id: MOCK_AGENT_ID },
      select: {
        pendingCommission: true,
        totalCommissionEarned: true,
        lifetimeCommission: true,
        bankName: true,
        bankAccountNumber: true,
      },
    })

    // Get approved commissions that haven't been paid
    const unpaidCommissions = await db.agentCommission.count({
      where: {
        agentId: MOCK_AGENT_ID,
        status: 'approved',
        payoutId: null,
      },
    })

    const unpaidCommissionsAmount = await db.agentCommission.aggregate({
      where: {
        agentId: MOCK_AGENT_ID,
        status: 'approved',
        payoutId: null,
      },
      _sum: { amount: true },
    })

    // Get payout stats
    const payoutStats = await db.agentPayout.groupBy({
      by: ['status'],
      where: { agentId: MOCK_AGENT_ID },
      _count: { id: true },
      _sum: { amount: true },
    })

    const statusBreakdown = payoutStats.reduce((acc, item) => {
      acc[item.status] = {
        count: item._count.id,
        amount: item._sum.amount || 0,
      }
      return acc
    }, {} as Record<string, { count: number; amount: number }>)

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      payouts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      summary: {
        pendingCommission: agent?.pendingCommission || 0,
        totalCommissionEarned: agent?.totalCommissionEarned || 0,
        lifetimeCommission: agent?.lifetimeCommission || 0,
        unpaidCommissionsCount: unpaidCommissions,
        unpaidCommissionsAmount: unpaidCommissionsAmount._sum.amount || 0,
        availableForPayout: Math.max(0, (agent?.pendingCommission || 0) - MIN_PAYOUT_AMOUNT),
        minPayoutAmount: MIN_PAYOUT_AMOUNT,
        canRequestPayout: (agent?.pendingCommission || 0) >= MIN_PAYOUT_AMOUNT,
        hasBankDetails: !!(agent?.bankName && agent?.bankAccountNumber),
        bankName: agent?.bankName,
        bankAccountNumber: agent?.bankAccountNumber ? '****' + agent.bankAccountNumber.slice(-4) : null,
      },
      stats: {
        statusBreakdown,
      },
    })
  } catch (error) {
    console.error('Error fetching payouts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payouts' },
      { status: 500 }
    )
  }
}

// POST /api/agent-network/payouts - Request a new payout
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, bankName, bankAccountNumber, bankAccountType } = body

    // Get agent profile
    const agent = await db.agentProfile.findUnique({
      where: { id: MOCK_AGENT_ID },
    })

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent profile not found' },
        { status: 404 }
      )
    }

    // Check if agent can request payout
    const availableAmount = agent.pendingCommission

    // Validate minimum amount
    if (availableAmount < MIN_PAYOUT_AMOUNT) {
      return NextResponse.json(
        { error: `Minimum payout amount is R${MIN_PAYOUT_AMOUNT}` },
        { status: 400 }
      )
    }

    // Determine payout amount
    const payoutAmount = amount || availableAmount

    if (payoutAmount > availableAmount) {
      return NextResponse.json(
        { error: 'Requested amount exceeds available commission' },
        { status: 400 }
      )
    }

    // Check bank details
    const payoutBankName = bankName || agent.bankName
    const payoutBankAccount = bankAccountNumber || agent.bankAccountNumber

    if (!payoutBankName || !payoutBankAccount) {
      return NextResponse.json(
        { error: 'Bank details required. Please update your profile with banking information.' },
        { status: 400 }
      )
    }

    // Check for pending payouts
    const pendingPayout = await db.agentPayout.findFirst({
      where: {
        agentId: MOCK_AGENT_ID,
        status: { in: ['pending', 'processing'] },
      },
    })

    if (pendingPayout) {
      return NextResponse.json(
        { error: 'You already have a pending payout request. Please wait for it to be processed.' },
        { status: 400 }
      )
    }

    // Get approved commissions to include in payout
    const approvedCommissions = await db.agentCommission.findMany({
      where: {
        agentId: MOCK_AGENT_ID,
        status: 'approved',
        payoutId: null,
      },
    })

    // Calculate period
    const now = new Date()
    const periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    // Generate reference number
    const referenceNumber = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

    // Create payout
    const payout = await db.agentPayout.create({
      data: {
        agentId: MOCK_AGENT_ID,
        referenceNumber,
        amount: payoutAmount,
        status: 'pending',
        bankName: payoutBankName,
        bankAccount: payoutBankAccount,
        periodStart: periodStart.toISOString().split('T')[0],
        periodEnd: periodEnd.toISOString().split('T')[0],
        commissionsCount: approvedCommissions.length,
      },
    })

    // Update commissions to link to payout
    await db.agentCommission.updateMany({
      where: {
        agentId: MOCK_AGENT_ID,
        status: 'approved',
        payoutId: null,
      },
      data: {
        payoutId: payout.id,
      },
    })

    // Update agent pending commission
    await db.agentProfile.update({
      where: { id: MOCK_AGENT_ID },
      data: {
        pendingCommission: { decrement: payoutAmount },
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      message: 'Payout request submitted successfully',
      payout: {
        id: payout.id,
        referenceNumber: payout.referenceNumber,
        amount: payout.amount,
        status: payout.status,
        createdAt: payout.createdAt,
        estimatedProcessingTime: '3-5 business days',
      },
    })
  } catch (error) {
    console.error('Error creating payout:', error)
    return NextResponse.json(
      { error: 'Failed to create payout request' },
      { status: 500 }
    )
  }
}
