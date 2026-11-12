import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Tier rates configuration
const tierRates: Record<string, number> = {
  starter: 0.03,
  bronze: 0.05,
  silver: 0.07,
  gold: 0.10,
  platinum: 0.12
}

// Tier multipliers configuration
const tierMultipliers: Record<string, number> = {
  bronze: 1.0,
  silver: 1.25,
  gold: 1.5,
  platinum: 2.0,
  starter: 1.0
}

// POST /api/admin/commissions/calculate - Calculate commission
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { agentId, amount, type = 'signup' } = body

    // Validation
    if (!agentId || !amount) {
      return NextResponse.json({ 
        error: 'Missing required fields: agentId, amount' 
      }, { status: 400 })
    }

    if (amount <= 0) {
      return NextResponse.json({ 
        error: 'Amount must be greater than 0' 
      }, { status: 400 })
    }

    // Get agent details
    let agent = await db.agent.findUnique({
      where: { id: agentId }
    })

    // If agent not found, use demo data
    if (!agent) {
      agent = {
        id: agentId,
        tier: agentId.includes('platinum') ? 'platinum' : 
              agentId.includes('gold') ? 'gold' : 
              agentId.includes('silver') ? 'silver' : 'bronze',
        commissionRate: tierRates[agentId.includes('platinum') ? 'platinum' : 
                                   agentId.includes('gold') ? 'gold' : 
                                   agentId.includes('silver') ? 'silver' : 'bronze'] || 0.05
      } as any
    }

    // Get applicable rule
    const rules = await db.commissionRule.findMany({
      where: {
        ruleType: type,
        active: true,
        OR: [
          { minAmount: { lte: amount } },
          { minAmount: 0 }
        ]
      },
      orderBy: { minAmount: 'desc' }
    })

    let rule = rules[0]
    
    // Use default rule if none found
    if (!rule) {
      rule = {
        commissionRate: tierRates[agent.tier] || 0.05,
        fixedAmount: 0,
        capAmount: null,
        bronzeMultiplier: tierMultipliers.bronze,
        silverMultiplier: tierMultipliers.silver,
        goldMultiplier: tierMultipliers.gold,
        platinumMultiplier: tierMultipliers.platinum
      } as any
    }

    // Calculate base commission
    let baseCommission = 0
    
    // Use rule rate or agent's personal rate
    const rate = rule.commissionRate || agent.commissionRate || tierRates[agent.tier] || 0.05
    
    // Calculate percentage-based commission
    baseCommission = amount * (rate / 100)
    
    // Add fixed amount if any
    baseCommission += rule.fixedAmount || 0

    // Get tier multiplier
    const tierMultiplier = agent.tier === 'platinum' ? rule.platinumMultiplier :
                          agent.tier === 'gold' ? rule.goldMultiplier :
                          agent.tier === 'silver' ? rule.silverMultiplier :
                          rule.bronzeMultiplier || 1.0

    // Apply tier multiplier
    let finalCommission = baseCommission * tierMultiplier

    // Apply cap if exists
    if (rule.capAmount && finalCommission > rule.capAmount) {
      finalCommission = rule.capAmount
    }

    // Build breakdown
    const breakdown = [
      { label: 'Transaction Amount', amount },
      { label: `Base Rate (${rate}%)`, amount: amount * (rate / 100) },
    ]

    if (rule.fixedAmount && rule.fixedAmount > 0) {
      breakdown.push({ label: 'Fixed Bonus', amount: rule.fixedAmount })
    }

    breakdown.push({ label: `Tier Multiplier (${tierMultiplier}x)`, amount: baseCommission * (tierMultiplier - 1) })

    if (rule.capAmount && finalCommission === rule.capAmount) {
      breakdown.push({ label: 'Cap Applied', amount: -(baseCommission * tierMultiplier - rule.capAmount) })
    }

    return NextResponse.json({
      agentId,
      agentTier: agent.tier,
      transactionAmount: amount,
      commissionType: type,
      baseCommission,
      tierMultiplier,
      finalCommission,
      breakdown,
      rule: {
        id: (rule as any).id,
        name: (rule as any).ruleName || 'Default Rule',
        rate: rule.commissionRate || rate,
        fixedAmount: rule.fixedAmount,
        capAmount: rule.capAmount
      }
    })
  } catch (error) {
    console.error('Error calculating commission:', error)
    return NextResponse.json({ error: 'Failed to calculate commission' }, { status: 500 })
  }
}

// GET /api/admin/commissions/calculate - Get preview for multiple agents
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const amount = parseFloat(searchParams.get('amount') || '1000')
    const type = searchParams.get('type') || 'signup'

    // Get all active agents
    const agents = await db.agent.findMany({
      where: { status: 'active' },
      take: 100
    })

    // If no agents, use demo data
    const demoAgents = agents.length > 0 ? agents : [
      { id: 'agent-001', firstName: 'Nomsa', lastName: 'Dlamini', tier: 'platinum' },
      { id: 'agent-002', firstName: 'Thabo', lastName: 'Molefe', tier: 'gold' },
      { id: 'agent-003', firstName: 'Priya', lastName: 'Naidoo', tier: 'gold' },
      { id: 'agent-004', firstName: 'Johan', lastName: 'van der Berg', tier: 'silver' },
      { id: 'agent-005', firstName: 'Sipho', lastName: 'Zulu', tier: 'bronze' }
    ] as any[]

    // Calculate commissions for each tier
    const tierCalculations = Object.keys(tierRates).map(tier => {
      const rate = tierRates[tier]
      const multiplier = tierMultipliers[tier] || 1.0
      const baseCommission = amount * rate
      const finalCommission = baseCommission * multiplier

      return {
        tier,
        rate,
        multiplier,
        baseCommission,
        finalCommission
      }
    })

    // Calculate for each agent
    const agentCalculations = demoAgents.map(agent => {
      const tier = agent.tier || 'bronze'
      const rate = tierRates[tier] || 0.05
      const multiplier = tierMultipliers[tier] || 1.0
      const baseCommission = amount * rate
      const finalCommission = baseCommission * multiplier

      return {
        agentId: agent.id,
        agentName: `${agent.firstName} ${agent.lastName}`,
        tier,
        commission: finalCommission
      }
    })

    return NextResponse.json({
      amount,
      type,
      tierCalculations,
      agentCalculations
    })
  } catch (error) {
    console.error('Error in bulk calculation:', error)
    return NextResponse.json({ error: 'Failed to calculate commissions' }, { status: 500 })
  }
}
