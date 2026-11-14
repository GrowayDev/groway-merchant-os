import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { SAPE_AUTHORITIES } from '@/lib/sape'

// ============================================
// SAPE Authority Dashboard — aggregate statistics
// GET /merchant-os/api/sape/authority/dashboard
// Handles empty DB gracefully (all zeros).
// ============================================

export async function GET() {
  try {
    const [
      supplierGroups,
      totalIdentities,
      serialGroups,
      posTotal,
      posVerified,
      posAvg,
      activeNetworkBlocks,
      openTipOffs,
      recentFailures,
      notificationGroups,
      consumerScans,
    ] = await Promise.all([
      db.sapeAuthenticatedSupplier.groupBy({ by: ['verificationStatus'], _count: { _all: true } }),
      db.sapeProductIdentity.count(),
      db.sapeProductSerial.groupBy({ by: ['status'], _count: { _all: true } }),
      db.sapePosVerification.count(),
      db.sapePosVerification.count({ where: { verificationResult: true } }),
      db.sapePosVerification.aggregate({ _avg: { responseTimeMs: true } }),
      db.sapeNetworkBlock.count({ where: { active: true } }),
      db.sapeTipOff.count({ where: { status: { notIn: ['CLOSED', 'DISMISSED', 'RESOLVED'] } } }),
      db.sapeVerificationFailure.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          gtin: true,
          failureReason: true,
          actionTaken: true,
          merchantId: true,
          createdAt: true,
        },
      }),
      db.sapeAuthorityNotification.groupBy({ by: ['authority'], _count: { _all: true } }),
      db.sapeConsumerScan.count(),
    ])

    // Suppliers by status
    const suppliersByStatus: Record<string, number> = { VERIFIED: 0, PENDING: 0, SUSPENDED: 0, REVOKED: 0 }
    for (const g of supplierGroups) suppliersByStatus[g.verificationStatus] = g._count._all
    const totalSuppliers = supplierGroups.reduce((sum, g) => sum + g._count._all, 0)

    // Serials by status
    const serialsByStatus: Record<string, number> = {}
    for (const g of serialGroups) serialsByStatus[g.status] = g._count._all
    const totalSerials = serialGroups.reduce((sum, g) => sum + g._count._all, 0)

    const failureRate = posTotal > 0 ? Math.round(((posTotal - posVerified) / posTotal) * 1000) / 10 : 0

    const notificationsPerAuthority: Record<string, number> = {}
    for (const auth of SAPE_AUTHORITIES) notificationsPerAuthority[auth] = 0
    for (const g of notificationGroups) notificationsPerAuthority[g.authority] = g._count._all

    return NextResponse.json({
      success: true,
      suppliers: {
        total: totalSuppliers,
        verified: suppliersByStatus.VERIFIED || 0,
        pending: suppliersByStatus.PENDING || 0,
        suspended: suppliersByStatus.SUSPENDED || 0,
        byStatus: suppliersByStatus,
      },
      productIdentities: { total: totalIdentities },
      serials: { total: totalSerials, byStatus: serialsByStatus },
      posVerifications: {
        total: posTotal,
        verified: posVerified,
        failed: posTotal - posVerified,
        failureRate,
        avgResponseMs: posAvg._avg.responseTimeMs ? Math.round(posAvg._avg.responseTimeMs) : 0,
        slaTargetMs: 500,
      },
      consumerScans: { total: consumerScans },
      networkBlocks: { active: activeNetworkBlocks },
      tipOffs: { open: openTipOffs },
      recentFailures,
      notificationsPerAuthority,
    })
  } catch (error) {
    console.error('SAPE authority dashboard error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load SAPE dashboard' }, { status: 500 })
  }
}
