import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Mock agent ID for authentication
const MOCK_AGENT_ID = 'sales-demo-001'

export async function GET(request: NextRequest) {
  try {
    // Fetch agent with related data
    const agent = await db.salesforceAgent.findUnique({
      where: { id: MOCK_AGENT_ID },
      include: {
        team: true,
        teamLead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            tier: true,
          }
        },
        teamMembers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            tier: true,
          }
        },
        _count: {
          select: {
            leads: true,
            visits: true,
          }
        }
      }
    })

    if (!agent) {
      // Create a demo agent if not exists
      const newAgent = await db.salesforceAgent.create({
        data: {
          id: MOCK_AGENT_ID,
          employeeId: 'SF-2024-0156',
          firstName: 'Thabo',
          lastName: 'Molefe',
          email: 'thabo@groway.co.za',
          phone: '0821234567',
          status: 'active',
          tier: 'senior',
          role: 'field_agent',
          territoryName: 'Pretoria CBD & Surrounds',
          territoryProvince: 'Gauteng',
          territoryCity: 'Pretoria',
          totalMerchants: 47,
          activeMerchants: 42,
          monthlyRevenue: 185000,
          totalCommission: 22200,
          pendingCommission: 6500,
          conversionRate: 28,
          visitsThisMonth: 23,
          demosThisMonth: 12,
          monthlyTarget: 200000,
          quarterlyTarget: 600000,
          targetProgress: 92.5,
          startDate: new Date('2024-03-15'),
          baseSalary: 15000,
          commissionRate: 0.12,
          hasVehicle: true,
          vehicleReg: 'CA123456',
          driversLicense: 'C',
          trainingCompleted: true,
          trainingCompletedAt: new Date('2024-04-01'),
          certificationLevel: 'Certified Sales Agent',
          trainingProgress: 100,
          applicationStatus: 'approved',
          hiredAt: new Date('2024-03-15'),
        },
        include: {
          team: true,
          teamLead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              tier: true,
            }
          },
          teamMembers: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              tier: true,
            }
          },
          _count: {
            select: {
              leads: true,
              visits: true,
            }
          }
        }
      })
      
      return NextResponse.json({
        success: true,
        data: formatAgentResponse(newAgent)
      })
    }

    // Calculate territory stats
    const territoryStats = await calculateTerritoryStats(agent.id)

    // Calculate pipeline value
    const pipelineValue = await calculatePipelineValue(agent.id)

    return NextResponse.json({
      success: true,
      data: {
        ...formatAgentResponse(agent),
        territory: territoryStats,
        pipeline: pipelineValue,
      }
    })
  } catch (error) {
    console.error('Error fetching agent profile:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch agent profile' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      firstName,
      lastName,
      email,
      phone,
      territoryName,
      territoryProvince,
      territoryCity,
      hasVehicle,
      vehicleReg,
      driversLicense,
    } = body

    const updatedAgent = await db.salesforceAgent.update({
      where: { id: MOCK_AGENT_ID },
      data: {
        firstName,
        lastName,
        email,
        phone,
        territoryName,
        territoryProvince,
        territoryCity,
        hasVehicle,
        vehicleReg,
        driversLicense,
        updatedAt: new Date(),
      },
      include: {
        team: true,
        teamLead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            tier: true,
          }
        },
      }
    })

    return NextResponse.json({
      success: true,
      data: formatAgentResponse(updatedAgent),
      message: 'Profile updated successfully'
    })
  } catch (error) {
    console.error('Error updating agent profile:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update agent profile' },
      { status: 500 }
    )
  }
}

// Helper function to format agent response
function formatAgentResponse(agent: any) {
  return {
    id: agent.id,
    employeeId: agent.employeeId,
    name: `${agent.firstName} ${agent.lastName}`,
    firstName: agent.firstName,
    lastName: agent.lastName,
    email: agent.email,
    phone: agent.phone,
    status: agent.status,
    tier: agent.tier,
    role: agent.role,
    team: agent.team ? {
      id: agent.team.id,
      name: agent.team.name,
      region: agent.team.region,
      province: agent.team.province,
    } : null,
    teamLead: agent.teamLead ? {
      id: agent.teamLead.id,
      name: `${agent.teamLead.firstName} ${agent.teamLead.lastName}`,
      tier: agent.teamLead.tier,
    } : null,
    territory: {
      name: agent.territoryName,
      province: agent.territoryProvince,
      city: agent.territoryCity,
    },
    stats: {
      totalMerchants: agent.totalMerchants,
      activeMerchants: agent.activeMerchants,
      monthlyRevenue: agent.monthlyRevenue,
      totalCommission: agent.totalCommission,
      pendingCommission: agent.pendingCommission,
      conversionRate: agent.conversionRate,
      visitsThisMonth: agent.visitsThisMonth,
      demosThisMonth: agent.demosThisMonth,
    },
    targets: {
      monthly: agent.monthlyTarget,
      quarterly: agent.quarterlyTarget,
      progress: agent.targetProgress,
    },
    employment: {
      startDate: agent.startDate,
      baseSalary: agent.baseSalary,
      commissionRate: agent.commissionRate,
    },
    vehicle: {
      hasVehicle: agent.hasVehicle,
      vehicleReg: agent.vehicleReg,
      driversLicense: agent.driversLicense,
    },
    training: {
      completed: agent.trainingCompleted,
      completedAt: agent.trainingCompletedAt,
      certificationLevel: agent.certificationLevel,
      progress: agent.trainingProgress,
    },
    joinedAt: agent.startDate,
    totalLeads: agent._count?.leads || 0,
    totalVisits: agent._count?.visits || 0,
  }
}

// Calculate territory coverage stats
async function calculateTerritoryStats(agentId: string) {
  try {
    // Get unique merchants visited
    const visits = await db.salesforceVisit.findMany({
      where: { agentId },
      select: { merchantId: true, leadId: true }
    })
    
    const uniqueMerchants = new Set(
      visits.filter((v: any) => v.merchantId).map((v: any) => v.merchantId)
    )
    const uniqueLeads = new Set(
      visits.filter((v: any) => v.leadId).map((v: any) => v.leadId)
    )
    
    return {
      targetMerchants: 150,
      coveredMerchants: uniqueMerchants.size + uniqueLeads.size,
      percentage: Math.round(((uniqueMerchants.size + uniqueLeads.size) / 150) * 100),
    }
  } catch (error) {
    return {
      targetMerchants: 150,
      coveredMerchants: 89,
      percentage: 59,
    }
  }
}

// Calculate pipeline value by stage
async function calculatePipelineValue(agentId: string) {
  try {
    const leads = await db.salesforceLead.groupBy({
      by: ['status'],
      where: { agentId },
      _count: { id: true },
      _sum: { estimatedRevenue: true },
    })
    
    const stages = leads.map((l: any) => ({
      stage: l.status,
      count: l._count.id,
      value: l._sum.estimatedRevenue || 0,
    }))
    
    // Add missing stages
    const allStages = ['new', 'contacted', 'meeting', 'demo', 'proposal', 'won', 'lost']
    for (const stage of allStages) {
      if (!stages.find((s: any) => s.stage === stage)) {
        stages.push({ stage, count: 0, value: 0 })
      }
    }
    
    return stages
  } catch (error) {
    return [
      { stage: 'new', count: 8, value: 40000 },
      { stage: 'contacted', count: 5, value: 25000 },
      { stage: 'meeting', count: 3, value: 15000 },
      { stage: 'proposal', count: 2, value: 10000 },
      { stage: 'closing', count: 1, value: 5000 },
    ]
  }
}
