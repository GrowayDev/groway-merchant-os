import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUserId, ok, error, serialize } from '../../_lib/helpers'

/**
 * /api/consumer/wallet/balance
 *
 * Returns the user's wallet balance. Mock fallback removed: if there is
 * no wallet in the DB, we return { balance: 0, currency: 'ZAR' }.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)

    const wallet = await db.consumerWallet.findUnique({
      where: { userId },
      include: {
        ConsumerUser: {
          select: {
            id: true,
            phone: true,
            firstName: true,
            lastName: true,
            kycLevel: true,
            accountStatus: true,
          },
        },
      },
    })

    if (!wallet) {
      return ok({
        success: true,
        data: {
          balance: {
            available: '0',
            reserved: '0',
            pending: '0',
            currency: 'ZAR',
          },
          limits: {
            dailyLimit: null,
            dailySpent: '0',
            monthlyLimit: null,
            monthlySpent: '0',
          },
          totals: {
            received: '0',
            sent: '0',
            topups: '0',
            withdrawals: '0',
          },
          user: null,
        },
      })
    }

    return ok({
      success: true,
      data: serialize({
        balance: {
          available: wallet.balanceCents,
          reserved: wallet.reservedCents,
          pending: wallet.pendingCents,
          currency: wallet.currency,
        },
        limits: {
          dailyLimit: wallet.dailySpendLimit,
          dailySpent: wallet.dailySpentCents,
          monthlyLimit: wallet.monthlySpendLimit,
          monthlySpent: wallet.monthlySpentCents,
        },
        totals: {
          received: wallet.totalReceivedCents,
          sent: wallet.totalSentCents,
          topups: wallet.totalTopupsCents,
          withdrawals: wallet.totalWithdrawalsCents,
        },
        user: wallet.ConsumerUser,
      }),
    })
  } catch (err) {
    console.error('Get wallet balance error:', err)
    return error('Failed to fetch wallet balance', 500)
  }
}
