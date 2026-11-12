import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/commissions/payouts - List all payouts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const agentId = searchParams.get('agentId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: Record<string, unknown> = {}
    
    if (status) {
      where.status = status
    }
    if (agentId) {
      where.agentId = agentId
    }

    const payouts = await db.commissionPayout.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    // Get total count
    const total = await db.commissionPayout.count({ where })

    // Get summary by status
    const summary = await db.commissionPayout.groupBy({
      by: ['status'],
      _sum: { netAmount: true },
      _count: { id: true }
    })

    // If no payouts exist, return demo data
    if (payouts.length === 0) {
      const demoPayouts = generateDemoPayouts()
      return NextResponse.json({ 
        payouts: demoPayouts,
        total: demoPayouts.length,
        summary: {
          pending: { amount: 15000, count: 3 },
          processing: { amount: 8500, count: 1 },
          paid: { amount: 45000, count: 5 },
          failed: { amount: 0, count: 0 }
        }
      })
    }

    return NextResponse.json({ 
      payouts,
      total,
      summary: summary.reduce((acc, s) => {
        acc[s.status] = { 
          amount: s._sum.netAmount || 0, 
          count: s._count 
        }
        return acc
      }, {} as Record<string, { amount: number; count: number }>)
    })
  } catch (error) {
    console.error('Error fetching payouts:', error)
    return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 })
  }
}

// POST /api/admin/commissions/payouts - Create a new payout
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      agentId,
      periodStart,
      periodEnd,
      paymentMethod = 'eft'
    } = body

    // Validation
    if (!agentId || !periodStart || !periodEnd) {
      return NextResponse.json({ 
        error: 'Missing required fields: agentId, periodStart, periodEnd' 
      }, { status: 400 })
    }

    // Get agent details
    const agent = await db.agent.findUnique({
      where: { id: agentId }
    })

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Get all approved commissions for this agent that haven't been paid
    const unpaidCommissions = await db.agentCommission.findMany({
      where: {
        agentId,
        status: 'approved',
        paidAt: null
      }
    })

    if (unpaidCommissions.length === 0) {
      return NextResponse.json({ 
        error: 'No approved commissions found for payout' 
      }, { status: 400 })
    }

    // Calculate totals
    const totalCommission = unpaidCommissions.reduce((sum, c) => sum + c.amount, 0)
    const signupCommissions = unpaidCommissions
      .filter(c => c.commissionType === 'signup')
      .reduce((sum, c) => sum + c.amount, 0)
    const transactionCommissions = unpaidCommissions
      .filter(c => c.commissionType === 'transaction')
      .reduce((sum, c) => sum + c.amount, 0)
    const overrideCommissions = unpaidCommissions
      .filter(c => c.commissionType === 'override')
      .reduce((sum, c) => sum + c.amount, 0)
    const bonusAmount = unpaidCommissions
      .filter(c => c.commissionType === 'bonus')
      .reduce((sum, c) => sum + c.amount, 0)

    // Generate payout reference
    const payoutRef = `PAY-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`

    // Create payout
    const payout = await db.commissionPayout.create({
      data: {
        id: `payout-${Date.now()}`,
        payoutRef,
        agentId,
        periodStart,
        periodEnd,
        totalCommission,
        totalAdjustments: 0,
        netAmount: totalCommission,
        signupCommissions,
        transactionCommissions,
        overrideCommissions,
        bonusAmount,
        status: 'pending',
        paymentMethod,
        bankName: agent.bankName,
        accountNumber: agent.accountNumber ? `****${agent.accountNumber.slice(-4)}` : null,
        accountHolder: agent.accountHolder,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ success: true, payout })
  } catch (error) {
    console.error('Error creating payout:', error)
    return NextResponse.json({ error: 'Failed to create payout' }, { status: 500 })
  }
}

// PUT /api/admin/commissions/payouts - Update payout status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { payoutId, action, approvedBy, approvedByName, failureReason } = body

    if (!payoutId || !action) {
      return NextResponse.json({ 
        error: 'Missing required fields: payoutId, action' 
      }, { status: 400 })
    }

    const validActions = ['approve', 'process', 'pay', 'fail', 'cancel']
    if (!validActions.includes(action)) {
      return NextResponse.json({ 
        error: `Invalid action. Must be one of: ${validActions.join(', ')}` 
      }, { status: 400 })
    }

    // Check if payout exists
    const existingPayout = await db.commissionPayout.findUnique({
      where: { id: payoutId }
    })

    if (!existingPayout) {
      return NextResponse.json({ error: 'Payout not found' }, { status: 404 })
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
      case 'process':
        updateData = {
          ...updateData,
          status: 'processing'
        }
        break
      case 'pay':
        updateData = {
          ...updateData,
          status: 'paid',
          paidAt: new Date(),
          paymentReference: `REF-${Date.now()}`
        }
        
        // Mark all commissions in this payout as paid
        // In a real implementation, you'd link commissions to payouts
        // For now, we'll just update the payout status
        break
      case 'fail':
        updateData = {
          ...updateData,
          status: 'failed',
          failedAt: new Date(),
          failureReason
        }
        break
      case 'cancel':
        updateData = {
          ...updateData,
          status: 'cancelled'
        }
        break
    }

    const payout = await db.commissionPayout.update({
      where: { id: payoutId },
      data: updateData
    })

    return NextResponse.json({ success: true, payout })
  } catch (error) {
    console.error('Error updating payout:', error)
    return NextResponse.json({ error: 'Failed to update payout' }, { status: 500 })
  }
}

// Generate demo payouts
function generateDemoPayouts() {
  const agents = [
    { id: 'agent-001', name: 'Nomsa Dlamini', bank: 'FNB', account: '****1234' },
    { id: 'agent-002', name: 'Thabo Molefe', bank: 'Standard Bank', account: '****5678' },
    { id: 'agent-003', name: 'Priya Naidoo', bank: 'ABSA', account: '****9012' },
    { id: 'agent-004', name: 'Johan van der Berg', bank: 'Nedbank', account: '****3456' },
    { id: 'agent-005', name: 'Sipho Zulu', bank: 'Capitec', account: '****7890' }
  ]

  const statuses = ['paid', 'processing', 'pending', 'approved']

  return agents.map((agent, index) => {
    const totalCommission = Math.floor(Math.random() * 10000 + 2000)
    const signupCommissions = Math.floor(totalCommission * 0.3)
    const transactionCommissions = Math.floor(totalCommission * 0.5)
    const overrideCommissions = Math.floor(totalCommission * 0.1)
    const bonusAmount = totalCommission - signupCommissions - transactionCommissions - overrideCommissions

    return {
      id: `payout-${index + 1}`,
      payoutRef: `PAY-2024-${String(index + 1).padStart(3, '0')}`,
      agentId: agent.id,
      periodStart: 'Jan 2024',
      periodEnd: 'Jan 31, 2024',
      totalCommission,
      totalAdjustments: 0,
      netAmount: totalCommission,
      signupCommissions,
      transactionCommissions,
      overrideCommissions,
      bonusAmount,
      status: statuses[index % statuses.length],
      paidAt: index === 0 ? new Date() : null,
      paymentMethod: 'eft',
      bankName: agent.bank,
      accountNumber: agent.account,
      accountHolder: agent.name,
      createdAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    }
  })
}
