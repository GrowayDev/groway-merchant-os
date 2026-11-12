import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Mock agent ID for authentication
const MOCK_AGENT_ID = 'sales-demo-001'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const periodMonth = searchParams.get('month')
    const periodYear = searchParams.get('year')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: any = {
      agentId: MOCK_AGENT_ID,
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (type && type !== 'all') {
      where.type = type
    }

    if (periodMonth) {
      where.periodMonth = periodMonth
    }

    if (periodYear) {
      where.periodYear = periodYear
    }

    // Fetch commissions
    const commissions = await db.salesforceCommission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    // Get total count
    const total = await db.salesforceCommission.count({ where })

    // Calculate summary statistics
    const summary = await db.salesforceCommission.aggregate({
      where: { agentId: MOCK_AGENT_ID },
      _sum: {
        amount: true,
        revenueBase: true,
      },
      _count: { id: true },
    })

    // Get pending commissions
    const pending = await db.salesforceCommission.aggregate({
      where: { agentId: MOCK_AGENT_ID, status: 'pending' },
      _sum: { amount: true },
    })

    // Get paid commissions
    const paid = await db.salesforceCommission.aggregate({
      where: { agentId: MOCK_AGENT_ID, status: 'paid' },
      _sum: { amount: true },
    })

    // Get counts by status
    const statusCounts = await db.salesforceCommission.groupBy({
      by: ['status'],
      where: { agentId: MOCK_AGENT_ID },
      _count: { id: true },
      _sum: { amount: true },
    })

    const formattedStatusCounts = statusCounts.reduce((acc: any, item: any) => {
      acc[item.status] = {
        count: item._count.id,
        total: item._sum.amount || 0,
      }
      return acc
    }, {} as Record<string, { count: number; total: number }>)

    // Get counts by type
    const typeCounts = await db.salesforceCommission.groupBy({
      by: ['type'],
      where: { agentId: MOCK_AGENT_ID },
      _count: { id: true },
      _sum: { amount: true },
    })

    const formattedTypeCounts = typeCounts.reduce((acc: any, item: any) => {
      acc[item.type] = {
        count: item._count.id,
        total: item._sum.amount || 0,
      }
      return acc
    }, {} as Record<string, { count: number; total: number }>)

    // If no commissions exist, return demo data
    if (commissions.length === 0 && !status && !type) {
      const demoCommissions = await seedDemoCommissions()
      return NextResponse.json({
        success: true,
        data: demoCommissions,
        pagination: {
          total: demoCommissions.length,
          limit,
          offset,
          hasMore: false,
        },
        summary: {
          totalEarned: 22200,
          pending: 6500,
          paid: 15700,
          commissionRate: 12,
        },
        filters: {
          statusCounts: {
            pending: { count: 2, total: 6500 },
            approved: { count: 0, total: 0 },
            paid: { count: 2, total: 15700 },
          },
          typeCounts: {
            signup: { count: 4, total: 22200 },
            transaction: { count: 0, total: 0 },
            bonus: { count: 0, total: 0 },
            override: { count: 0, total: 0 },
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: commissions.map(formatCommission),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + commissions.length < total,
      },
      summary: {
        totalEarned: summary._sum.amount || 0,
        pending: pending._sum.amount || 0,
        paid: paid._sum.amount || 0,
        totalRevenue: summary._sum.revenueBase || 0,
        totalTransactions: summary._count.id,
      },
      filters: {
        statusCounts: formattedStatusCounts,
        typeCounts: formattedTypeCounts,
      }
    })
  } catch (error) {
    console.error('Error fetching commissions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch commissions' },
      { status: 500 }
    )
  }
}

// Helper function to format commission response
function formatCommission(commission: any) {
  return {
    id: commission.id,
    type: commission.type,
    merchantId: commission.merchantId,
    merchantName: commission.merchantName,
    amount: commission.amount,
    rate: commission.rate,
    revenueBase: commission.revenueBase,
    status: commission.status,
    approvedAt: commission.approvedAt,
    paidAt: commission.paidAt,
    period: {
      month: commission.periodMonth,
      year: commission.periodYear,
    },
    level: commission.level,
    sourceAgentId: commission.sourceAgentId,
    createdAt: commission.createdAt,
    updatedAt: commission.updatedAt,
  }
}

// Seed demo commissions if none exist
async function seedDemoCommissions() {
  const demoCommissions = [
    {
      id: 'c-001',
      type: 'signup',
      merchantName: 'Cafe Bliss',
      amount: 1500,
      rate: 12,
      revenueBase: 12500,
      status: 'paid',
      periodMonth: '11',
      periodYear: '2024',
    },
    {
      id: 'c-002',
      type: 'signup',
      merchantName: 'Tech Hub',
      amount: 2800,
      rate: 12,
      revenueBase: 23333,
      status: 'paid',
      periodMonth: '11',
      periodYear: '2024',
    },
    {
      id: 'c-003',
      type: 'signup',
      merchantName: 'Fresh Mart',
      amount: 1200,
      rate: 12,
      revenueBase: 10000,
      status: 'pending',
      periodMonth: '12',
      periodYear: '2024',
    },
    {
      id: 'c-004',
      type: 'signup',
      merchantName: 'Style Studio',
      amount: 2000,
      rate: 12,
      revenueBase: 16667,
      status: 'pending',
      periodMonth: '12',
      periodYear: '2024',
    },
  ]

  for (const commission of demoCommissions) {
    try {
      await db.salesforceCommission.create({
        data: {
          ...commission,
          id: commission.id,
          agentId: MOCK_AGENT_ID,
          merchantId: null,
        }
      })
    } catch (e) {
      // Commission may already exist
    }
  }

  return demoCommissions.map(formatCommission)
}
