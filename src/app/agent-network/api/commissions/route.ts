import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Mock agent ID for authentication (will be replaced with real auth later)
const MOCK_AGENT_ID = 'agent-demo-001'

// GET /api/agent-network/commissions - List commissions with status filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || undefined
    const type = searchParams.get('type') || undefined
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined

    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = {
      agentId: MOCK_AGENT_ID,
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (type && type !== 'all') {
      where.type = type
    }

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {}
      if (startDate) {
        dateFilter.gte = new Date(startDate)
      }
      if (endDate) {
        dateFilter.lte = new Date(endDate)
      }
      where.createdAt = dateFilter
    }

    // Get commissions with count
    const [commissions, totalCount] = await Promise.all([
      db.agentCommission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          referral: {
            select: {
              businessName: true,
              contactName: true,
            },
          },
        },
      }),
      db.agentCommission.count({ where }),
    ])

    // Get summary stats
    const allCommissions = await db.agentCommission.findMany({
      where: { agentId: MOCK_AGENT_ID },
      select: { amount: true, status: true, type: true },
    })

    const stats = {
      total: allCommissions.length,
      totalAmount: allCommissions.reduce((sum, c) => sum + c.amount, 0),
      pending: allCommissions.filter((c) => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0),
      approved: allCommissions.filter((c) => c.status === 'approved').reduce((sum, c) => sum + c.amount, 0),
      paid: allCommissions.filter((c) => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0),
      cancelled: allCommissions.filter((c) => c.status === 'cancelled').reduce((sum, c) => sum + c.amount, 0),
    }

    // Group by type
    const byType = allCommissions.reduce((acc, c) => {
      if (!acc[c.type]) {
        acc[c.type] = 0
      }
      acc[c.type] += c.amount
      return acc
    }, {} as Record<string, number>)

    // Get monthly breakdown
    const monthlyStats = await db.agentCommission.groupBy({
      by: ['status'],
      where: { agentId: MOCK_AGENT_ID },
      _count: { id: true },
      _sum: { amount: true },
    })

    const statusBreakdown = monthlyStats.reduce((acc, item) => {
      acc[item.status] = {
        count: item._count.id,
        amount: item._sum.amount || 0,
      }
      return acc
    }, {} as Record<string, { count: number; amount: number }>)

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      commissions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      stats: {
        ...stats,
        byType,
        statusBreakdown,
      },
    })
  } catch (error) {
    console.error('Error fetching commissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch commissions' },
      { status: 500 }
    )
  }
}
