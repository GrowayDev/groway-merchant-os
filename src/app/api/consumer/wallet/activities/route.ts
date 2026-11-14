import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getConsumerAuth } from '@/lib/consumer-auth'
import { serializeActivity, serializeWallet } from '@/lib/wallet-bridge'

// GET /api/consumer/wallet/activities
// Consumer wallet activity feed — top-ups, payments, cashback, rewards,
// refunds, link events. Auth: Bearer JWT (or ?userId= in dev).
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const auth = await getConsumerAuth(request, searchParams.get('userId'))
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const limit = Math.min(
      Math.max(parseInt(searchParams.get('limit') || '50', 10) || 50, 1),
      100
    )

    const [user, wallet, activities, loyalty] = await Promise.all([
      db.consumerUser.findUnique({
        where: { id: auth.userId },
        select: {
          id: true,
          phone: true,
          firstName: true,
          lastName: true,
          kycLevel: true,
          accountStatus: true,
        },
      }),
      db.consumerWallet.findUnique({ where: { userId: auth.userId } }),
      db.consumerWalletActivity.findMany({
        where: { consumerUserId: auth.userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      db.consumerLoyalty.findFirst({ where: { userId: auth.userId } }).catch(() => null),
    ])

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Consumer not found' },
        { status: 404 }
      )
    }

    const spentThisMonth = activities
      .filter(
        (a) =>
          a.direction === 'debit' &&
          a.activityType === 'payment' &&
          a.createdAt.getMonth() === new Date().getMonth()
      )
      .reduce((s, a) => s + Number(a.amountCents ?? 0n), 0)

    return NextResponse.json({
      success: true,
      user,
      wallet: serializeWallet(wallet),
      loyalty: loyalty
        ? {
            pointsBalance: loyalty.points,
            tier: loyalty.tier,
          }
        : null,
      activities: activities.map(serializeActivity),
      stats: {
        activityCount: activities.length,
        spentThisMonth: Math.round(spentThisMonth) / 100,
      },
    })
  } catch (error) {
    console.error('[consumer/wallet/activities GET] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load wallet activities' },
      { status: 500 }
    )
  }
}
