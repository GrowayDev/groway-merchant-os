/**
 * SAPE dashboard stats (merchant auth).
 * GET /api/sape/stats
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSapeAuth, isNextResponse } from '@/lib/sape/auth'

export async function GET(request: NextRequest) {
  const auth = requireSapeAuth(request)
  if (isNextResponse(auth)) return auth

  try {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const [
      suppliers,
      verifiedSuppliers,
      products,
      serials,
      activeSerials,
      soldSerials,
      posVerifications24h,
      authentic24h,
      failures24h,
      openAnomalies,
      consumerScans,
      consumerReports,
      openReports,
      authorityQueue,
      blockCount,
      lastBlock,
    ] = await Promise.all([
      db.authenticatedSupplier.count({ where: { merchantId: auth.merchantId } }),
      db.authenticatedSupplier.count({ where: { merchantId: auth.merchantId, verificationStatus: 'verified' } }),
      db.productIdentity.count({ where: { merchantId: auth.merchantId } }),
      db.productSerial.count({ where: { merchantId: auth.merchantId } }),
      db.productSerial.count({ where: { merchantId: auth.merchantId, status: 'active' } }),
      db.productSerial.count({ where: { merchantId: auth.merchantId, status: 'sold' } }),
      db.pOSVerification.count({ where: { merchantId: auth.merchantId, checkedAt: { gte: since24h } } }),
      db.pOSVerification.count({ where: { merchantId: auth.merchantId, result: 'AUTHENTIC', checkedAt: { gte: since24h } } }),
      db.verificationFailure.count({ where: { merchantId: auth.merchantId, attemptedAt: { gte: since24h } } }),
      db.custodyAnomaly.count({ where: { merchantId: auth.merchantId, resolved: false } }),
      db.consumerScan.count({}),
      db.consumerReport.count({ where: { merchantId: auth.merchantId } }),
      db.consumerReport.count({ where: { merchantId: auth.merchantId, status: 'submitted' } }),
      db.authorityNotification.count({ where: { merchantId: auth.merchantId, status: 'pending' } }),
      db.networkBlock.count({}),
      db.networkBlock.findFirst({ orderBy: { blockNumber: 'desc' } }),
    ])

    const latencyAgg = await db.pOSVerification.aggregate({
      where: { merchantId: auth.merchantId, checkedAt: { gte: since24h } },
      _avg: { latencyMs: true },
      _max: { latencyMs: true },
    })

    return NextResponse.json({
      success: true,
      data: {
        suppliers: { total: suppliers, verified: verifiedSuppliers },
        products,
        serials: { total: serials, active: activeSerials, sold: soldSerials },
        pos: {
          verifications24h: posVerifications24h,
          authentic24h,
          failures24h,
          authenticityRate: posVerifications24h > 0 ? Math.round((authentic24h / posVerifications24h) * 100) : 100,
          avgLatencyMs: Math.round(latencyAgg._avg.latencyMs ?? 0),
          maxLatencyMs: latencyAgg._max.latencyMs ?? 0,
          slaCompliant: (latencyAgg._avg.latencyMs ?? 0) < 500,
        },
        integrity: { openAnomalies, consumerScans, consumerReports, openReports },
        authority: { pendingNotifications: authorityQueue },
        chain: {
          blocks: blockCount,
          headHash: lastBlock?.blockHash?.slice(0, 16) ?? null,
          headNumber: lastBlock?.blockNumber ?? 0,
        },
      },
    })
  } catch (error) {
    console.error('SAPE stats error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load SAPE stats' }, { status: 500 })
  }
}
