import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/popia/stats - Get POPIA statistics
export async function GET() {
  try {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    let stats = {
      totalRequests: 0,
      pendingRequests: 0,
      overdueRequests: 0,
      completedThisMonth: 0,
      totalConsents: 0,
      activeConsents: 0,
      withdrawnConsents: 0,
      documentAccessCount: 0,
      avgResponseTime: 0,
    }

    try {
      // Get request stats
      const [
        totalRequests,
        pendingRequests,
        overdueRequests,
        completedThisMonth,
      ] = await Promise.all([
        db.popiaRequest.count(),
        db.popiaRequest.count({ where: { status: 'pending' } }),
        db.popiaRequest.count({
          where: {
            status: { in: ['pending', 'processing'] },
            dueDate: { lt: now },
          },
        }),
        db.popiaRequest.count({
          where: {
            status: 'completed',
            completedAt: { gte: monthStart },
          },
        }),
      ])

      stats.totalRequests = totalRequests
      stats.pendingRequests = pendingRequests
      stats.overdueRequests = overdueRequests
      stats.completedThisMonth = completedThisMonth
    } catch {
      // Table might not exist
    }

    try {
      // Get consent stats
      const [totalConsents, activeConsents, withdrawnConsents] = await Promise.all([
        db.consentRecord.count(),
        db.consentRecord.count({ where: { status: 'active' } }),
        db.consentRecord.count({ where: { status: 'withdrawn' } }),
      ])

      stats.totalConsents = totalConsents
      stats.activeConsents = activeConsents
      stats.withdrawnConsents = withdrawnConsents
    } catch {
      // Table might not exist
    }

    try {
      // Get document access count
      stats.documentAccessCount = await db.documentAccessLog.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      })
    } catch {
      // Table might not exist
    }

    try {
      // Calculate average response time
      const completedRequests = await db.popiaRequest.findMany({
        where: {
          status: 'completed',
          completedAt: { not: null },
          submittedAt: { not: null },
        },
        select: {
          submittedAt: true,
          completedAt: true,
        },
        take: 100,
      })

      if (completedRequests.length > 0) {
        const totalDays = completedRequests.reduce((acc, req) => {
          if (req.submittedAt && req.completedAt) {
            const diffTime = new Date(req.completedAt).getTime() - new Date(req.submittedAt).getTime()
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            return acc + diffDays
          }
          return acc
        }, 0)
        stats.avgResponseTime = Math.round(totalDays / completedRequests.length)
      }
    } catch {
      // Table might not exist
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Error fetching POPIA stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch POPIA statistics' },
      { status: 500 }
    )
  }
}
