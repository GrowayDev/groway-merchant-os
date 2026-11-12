import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/agents/commissions - List commissions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId')
    const status = searchParams.get('status')
    const period = searchParams.get('period')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = {}
    
    if (agentId) where.agentId = agentId
    if (status && status !== 'all') where.status = status

    const commissions = await db.agentCommission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        Agent: {
          select: {
            id: true,
            name: true,
            tier: true
          }
        }
      }
    })

    // Get commission summary
    const summary = await db.agentCommission.groupBy({
      by: ['status'],
      _sum: { amount: true },
      _count: { id: true }
    })

    // If no commissions exist, return demo data
    if (commissions.length === 0) {
      const demoCommissions = generateDemoCommissions()
      return NextResponse.json({
        commissions: demoCommissions,
        summary: {
          pending: { amount: 12500, count: 15 },
          approved: { amount: 8500, count: 10 },
          paid: { amount: 45000, count: 52 },
          cancelled: { amount: 0, count: 0 }
        }
      })
    }

    return NextResponse.json({
      commissions,
      summary: summary.reduce((acc, s) => {
        acc[s.status] = { amount: s._sum.amount || 0, count: s._count }
        return acc
      }, {} as Record<string, { amount: number; count: number }>)
    })
  } catch (error) {
    console.error('Error fetching commissions:', error)
    return NextResponse.json({ error: 'Failed to fetch commissions' }, { status: 500 })
  }
}

// POST /api/agents/commissions - Create commission
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { agentId, referralId, amount, commissionType, description } = body

    if (!agentId || !amount || !commissionType) {
      return NextResponse.json({ 
        error: 'Missing required fields: agentId, amount, commissionType' 
      }, { status: 400 })
    }

    // Get agent tier for commission calculation
    const agent = await db.agent.findUnique({
      where: { id: agentId }
    })

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Calculate commission based on tier
    const tierRates: Record<string, number> = {
      bronze: 0.05,
      silver: 0.07,
      gold: 0.10,
      platinum: 0.12
    }
    const rate = tierRates[agent.tier] || 0.05
    const calculatedAmount = amount * rate

    const commission = await db.agentCommission.create({
      data: {
        id: `comm-${Date.now()}`,
        agentId,
        referralId,
        amount: calculatedAmount,
        commissionType,
        description,
        status: 'pending',
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ success: true, commission })
  } catch (error) {
    console.error('Error creating commission:', error)
    return NextResponse.json({ error: 'Failed to create commission' }, { status: 500 })
  }
}

// PUT /api/agents/commissions - Update commission status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { commissionId, action, approvedBy, approvedByName } = body

    if (!commissionId || !action) {
      return NextResponse.json({ 
        error: 'Missing required fields: commissionId, action' 
      }, { status: 400 })
    }

    const validActions = ['approve', 'pay', 'cancel']
    if (!validActions.includes(action)) {
      return NextResponse.json({ 
        error: `Invalid action. Must be one of: ${validActions.join(', ')}` 
      }, { status: 400 })
    }

    let updateData: Record<string, unknown> = { updatedAt: new Date() }

    switch (action) {
      case 'approve':
        updateData = {
          ...updateData,
          status: 'approved',
          approvedBy,
          approvedByName,
          approvedAt: new Date()
        }
        break
      case 'pay':
        updateData = {
          ...updateData,
          status: 'paid',
          paidAt: new Date(),
          payoutReference: `PAY-${Date.now()}`
        }
        break
      case 'cancel':
        updateData = {
          ...updateData,
          status: 'cancelled'
        }
        break
    }

    const commission = await db.agentCommission.update({
      where: { id: commissionId },
      data: updateData
    })

    return NextResponse.json({ success: true, commission })
  } catch (error) {
    console.error('Error updating commission:', error)
    return NextResponse.json({ error: 'Failed to update commission' }, { status: 500 })
  }
}

// Generate demo commissions
function generateDemoCommissions() {
  const agents = [
    { id: 'agent-001', name: 'Thabo Molefe', tier: 'gold' },
    { id: 'agent-002', name: 'Nomsa Dlamini', tier: 'platinum' },
    { id: 'agent-003', name: 'Johan van der Berg', tier: 'silver' },
    { id: 'agent-004', name: 'Priya Naidoo', tier: 'gold' },
    { id: 'agent-005', name: 'Sipho Zulu', tier: 'bronze' }
  ]

  const types = ['signup', 'transaction', 'override']
  const statuses = ['pending', 'approved', 'paid']

  return Array.from({ length: 20 }, (_, i) => {
    const agent = agents[i % agents.length]
    const type = types[Math.floor(Math.random() * types.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const amount = Math.floor(Math.random() * 500 + 50)

    return {
      id: `comm-${i + 1}`,
      agentId: agent.id,
      referralId: `ref-${Math.floor(Math.random() * 100)}`,
      amount,
      commissionType: type,
      description: `${type} commission for referral`,
      status,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      Agent: agent
    }
  })
}
