import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getMerchantIdWithDevFallback } from '@/lib/auth-context'
import { serializeActivity } from '@/lib/wallet-bridge'

// GET /merchant-os/api/wallet/activities — wallet activity feed for this merchant
// Shows wallet payments received, cashback/rewards issued and link events.
export async function GET(request: NextRequest) {
  try {
    const merchantId = await getMerchantIdWithDevFallback(request)
    if (!merchantId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10) || 50, 1), 100)

    const activities = await db.consumerWalletActivity.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    const userIds = Array.from(
      new Set(activities.map((a) => a.consumerUserId))
    )
    const users = userIds.length
      ? await db.consumerUser.findMany({
          where: { id: { in: userIds } },
          select: { id: true, firstName: true, lastName: true, phone: true },
        })
      : []
    const userMap = new Map(users.map((u) => [u.id, u]))

    // Merchant-side perspective: a consumer debit (payment) is money IN
    // for the store; a consumer credit (cashback) is money OUT.
    const feed = activities.map((a) => {
      const user = userMap.get(a.consumerUserId)
      const base = serializeActivity(a)
      let merchantDirection: 'in' | 'out' | 'info' = 'info'
      if (a.direction === 'debit' && a.merchantId) merchantDirection = 'in'
      else if (a.direction === 'credit' && a.merchantId) merchantDirection = 'out'
      const who = user
        ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.phone
        : 'Wallet customer'
      // Store-perspective titles: consumer debit = payment IN, consumer credit = money OUT
      const issuedLabel =
        a.activityType === 'cashback'
          ? 'Cashback issued to'
          : a.activityType === 'reward'
            ? 'Reward issued to'
            : a.activityType === 'refund'
              ? 'Refund issued to'
              : 'Credited to'
      const merchantTitle =
        a.activityType === 'payment'
          ? `Wallet payment from ${who}`
          : merchantDirection === 'out'
            ? `${issuedLabel} ${who}`
            : a.title
      return {
        ...base,
        merchantDirection,
        consumerName: who,
        consumerPhone: user?.phone ?? null,
        merchantTitle,
      }
    })

    const paymentsIn = feed
      .filter((f) => f.merchantDirection === 'in')
      .reduce((sum, f) => sum + (f.amount ?? 0), 0)

    return NextResponse.json({
      success: true,
      activities: feed,
      totals: {
        paymentsReceived: paymentsIn,
        count: feed.length,
      },
    })
  } catch (error) {
    console.error('[wallet/activities GET] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load wallet activities' },
      { status: 500 }
    )
  }
}
