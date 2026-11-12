import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Mock agent ID for authentication
const MOCK_AGENT_ID = 'sales-demo-001'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const periodType = searchParams.get('periodType') || 'monthly'

    // Get current date info
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()
    
    // Calculate period dates
    const periodStart = new Date(currentYear, currentMonth - 1, 1)
    const periodEnd = new Date(currentYear, currentMonth, 0)

    // Fetch targets for current period
    const targets = await db.salesforceTarget.findMany({
      where: {
        OR: [
          { agentId: MOCK_AGENT_ID },
          { teamId: null, agentId: null }, // Global targets
        ],
        periodType,
        periodStart: periodStart.toISOString().split('T')[0],
      },
    })

    // Get agent data for actual values
    const agent = await db.salesforceAgent.findUnique({
      where: { id: MOCK_AGENT_ID },
      include: {
        team: true,
      },
    })

    // If no targets exist, create or return demo data
    if (targets.length === 0) {
      const demoTargets = await createDemoTargets(periodType, periodStart, periodEnd)
      return NextResponse.json({
        success: true,
        data: {
          current: formatTargetResponse(demoTargets, agent),
          history: [],
          teamTargets: null,
        }
      })
    }

    // Get historical targets (last 3 months)
    const historicalTargets = await db.salesforceTarget.findMany({
      where: {
        agentId: MOCK_AGENT_ID,
        periodType,
        periodStart: { not: periodStart.toISOString().split('T')[0] },
      },
      orderBy: { periodStart: 'desc' },
      take: 3,
    })

    // Get team targets if agent belongs to a team
    let teamTargets = null
    if (agent?.teamId) {
      const teamTarget = await db.salesforceTarget.findFirst({
        where: {
          teamId: agent.teamId,
          periodType,
          periodStart: periodStart.toISOString().split('T')[0],
        },
      })
      if (teamTarget) {
        teamTargets = {
          periodType: teamTarget.periodType,
          period: {
            start: teamTarget.periodStart,
            end: teamTarget.periodEnd,
          },
          targets: {
            merchants: teamTarget.merchantsTarget,
            revenue: teamTarget.revenueTarget,
            visits: teamTarget.visitsTarget,
            demos: teamTarget.demosTarget,
            conversion: teamTarget.conversionTarget,
          },
          actuals: {
            merchants: teamTarget.merchantsActual,
            revenue: teamTarget.revenueActual,
            visits: teamTarget.visitsActual,
            demos: teamTarget.demosActual,
            conversion: teamTarget.conversionActual,
          },
          progress: {
            merchants: teamTarget.merchantsTarget > 0 
              ? Math.round((teamTarget.merchantsActual / teamTarget.merchantsTarget) * 100) : 0,
            revenue: teamTarget.revenueTarget > 0 
              ? Math.round((teamTarget.revenueActual / teamTarget.revenueTarget) * 100) : 0,
            visits: teamTarget.visitsTarget > 0 
              ? Math.round((teamTarget.visitsActual / teamTarget.visitsTarget) * 100) : 0,
            demos: teamTarget.demosTarget > 0 
              ? Math.round((teamTarget.demosActual / teamTarget.demosTarget) * 100) : 0,
          },
        }
      }
    }

    // Calculate actual values from data
    const actuals = await calculateActuals(MOCK_AGENT_ID, periodStart, periodEnd)

    // Update target with actuals
    const currentTarget = targets.find(t => t.agentId === MOCK_AGENT_ID) || targets[0]
    if (currentTarget) {
      await db.salesforceTarget.update({
        where: { id: currentTarget.id },
        data: {
          merchantsActual: actuals.merchants,
          revenueActual: actuals.revenue,
          visitsActual: actuals.visits,
          demosActual: actuals.demos,
          conversionActual: actuals.conversion,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        current: formatTargetResponse(targets, agent, actuals),
        history: historicalTargets.map(formatHistoryTarget),
        teamTargets,
      }
    })
  } catch (error) {
    console.error('Error fetching targets:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch targets' },
      { status: 500 }
    )
  }
}

// Helper function to calculate actual values
async function calculateActuals(agentId: string, startDate: Date, endDate: Date) {
  try {
    // Get won leads (new merchants)
    const wonLeads = await db.salesforceLead.count({
      where: {
        agentId,
        status: 'won',
        wonAt: {
          gte: startDate,
          lte: endDate,
        }
      }
    })

    // Get revenue from commissions
    const commissions = await db.salesforceCommission.aggregate({
      where: {
        agentId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        }
      },
      _sum: {
        revenueBase: true,
      }
    })

    // Get visits
    const visits = await db.salesforceVisit.count({
      where: {
        agentId,
        status: 'completed',
        completedAt: {
          gte: startDate,
          lte: endDate,
        }
      }
    })

    // Get demos (completed demo visits)
    const demos = await db.salesforceVisit.count({
      where: {
        agentId,
        type: 'demo',
        demoCompleted: true,
        completedAt: {
          gte: startDate,
          lte: endDate,
        }
      }
    })

    // Calculate conversion rate
    const totalLeads = await db.salesforceLead.count({
      where: {
        agentId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        }
      }
    })
    
    const conversion = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0

    return {
      merchants: wonLeads,
      revenue: commissions._sum.revenueBase || 0,
      visits,
      demos,
      conversion,
    }
  } catch (error) {
    return {
      merchants: 0,
      revenue: 0,
      visits: 0,
      demos: 0,
      conversion: 0,
    }
  }
}

// Helper function to format target response
function formatTargetResponse(targets: any[], agent: any, actuals?: any) {
  const target = targets.find((t: any) => t.agentId === MOCK_AGENT_ID) || targets[0]
  
  if (!target && !agent) {
    return null
  }

  const merchantsTarget = target?.merchantsTarget || agent?.monthlyTarget ? Math.round(agent.monthlyTarget / 5000) : 10
  const revenueTarget = target?.revenueTarget || agent?.monthlyTarget || 200000
  const visitsTarget = target?.visitsTarget || 30
  const demosTarget = target?.demosTarget || 15
  const conversionTarget = target?.conversionTarget || 25

  const merchantsActual = actuals?.merchants || target?.merchantsActual || 8
  const revenueActual = actuals?.revenue || target?.revenueActual || agent?.monthlyRevenue || 185000
  const visitsActual = actuals?.visits || target?.visitsActual || agent?.visitsThisMonth || 23
  const demosActual = actuals?.demos || target?.demosActual || agent?.demosThisMonth || 12
  const conversionActual = actuals?.conversion || target?.conversionActual || agent?.conversionRate || 28

  return {
    periodType: target?.periodType || 'monthly',
    period: {
      start: target?.periodStart || getCurrentMonthStart(),
      end: target?.periodEnd || getCurrentMonthEnd(),
    },
    targets: {
      merchants: merchantsTarget,
      revenue: revenueTarget,
      visits: visitsTarget,
      demos: demosTarget,
      conversion: conversionTarget,
    },
    actuals: {
      merchants: merchantsActual,
      revenue: revenueActual,
      visits: visitsActual,
      demos: demosActual,
      conversion: conversionActual,
    },
    progress: {
      merchants: merchantsTarget > 0 ? Math.round((merchantsActual / merchantsTarget) * 100) : 0,
      revenue: revenueTarget > 0 ? Math.round((revenueActual / revenueTarget) * 100) : 0,
      visits: visitsTarget > 0 ? Math.round((visitsActual / visitsTarget) * 100) : 0,
      demos: demosTarget > 0 ? Math.round((demosActual / demosTarget) * 100) : 0,
      conversion: conversionActual >= conversionTarget ? 100 : Math.round((conversionActual / conversionTarget) * 100),
    },
    daysRemaining: getDaysRemainingInMonth(),
    projectedRevenue: calculateProjectedRevenue(revenueActual, getDaysRemainingInMonth()),
  }
}

// Helper function to format historical target
function formatHistoryTarget(target: any) {
  return {
    periodType: target.periodType,
    period: {
      start: target.periodStart,
      end: target.periodEnd,
    },
    targets: {
      merchants: target.merchantsTarget,
      revenue: target.revenueTarget,
      visits: target.visitsTarget,
      demos: target.demosTarget,
      conversion: target.conversionTarget,
    },
    actuals: {
      merchants: target.merchantsActual,
      revenue: target.revenueActual,
      visits: target.visitsActual,
      demos: target.demosActual,
      conversion: target.conversionActual,
    },
    achieved: {
      merchants: target.merchantsActual >= target.merchantsTarget,
      revenue: target.revenueActual >= target.revenueTarget,
      visits: target.visitsActual >= target.visitsTarget,
      demos: target.demosActual >= target.demosTarget,
      conversion: target.conversionActual >= target.conversionTarget,
    },
  }
}

// Create demo targets
async function createDemoTargets(periodType: string, periodStart: Date, periodEnd: Date) {
  const target = await db.salesforceTarget.create({
    data: {
      id: `target-${Date.now()}`,
      agentId: MOCK_AGENT_ID,
      periodType,
      periodStart: periodStart.toISOString().split('T')[0],
      periodEnd: periodEnd.toISOString().split('T')[0],
      merchantsTarget: 10,
      revenueTarget: 200000,
      visitsTarget: 30,
      demosTarget: 15,
      conversionTarget: 25,
      merchantsActual: 8,
      revenueActual: 185000,
      visitsActual: 23,
      demosActual: 12,
      conversionActual: 28,
    }
  })

  return [target]
}

// Helper functions for date calculations
function getCurrentMonthStart(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
}

function getCurrentMonthEnd(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
}

function getDaysRemainingInMonth(): number {
  const now = new Date()
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return lastDay.getDate() - now.getDate()
}

function calculateProjectedRevenue(currentRevenue: number, daysRemaining: number): number {
  const now = new Date()
  const dayOfMonth = now.getDate()
  const dailyRate = dayOfMonth > 0 ? currentRevenue / dayOfMonth : 0
  return Math.round(currentRevenue + (dailyRate * daysRemaining))
}
