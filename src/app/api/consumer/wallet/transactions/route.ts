import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUserId, ok, error, serialize } from '../../_lib/helpers'

/**
 * /api/consumer/wallet/transactions
 *
 * Returns the user's wallet transactions. Mock fallback removed: returns
 * an empty array if no transactions exist for the user.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const type = searchParams.get('type')
    const direction = searchParams.get('direction')

    const where: Record<string, unknown> = { userId }
    if (type) where.transactionType = type
    if (direction) where.direction = direction

    const [total, transactions] = await Promise.all([
      db.consumerTransaction.count({ where }),
      db.consumerTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return ok({
      success: true,
      data: serialize({
        transactions: transactions.map((tx) => ({
          id: tx.id,
          type: tx.transactionType,
          direction: tx.direction,
          amount: tx.amountCents,
          fee: tx.feeCents,
          netAmount: tx.netAmountCents,
          currency: tx.currency,
          status: tx.status,
          description: tx.description,
          reference: tx.reference,
          category: tx.category,
          counterparty: {
            id: tx.counterpartyId,
            name: tx.counterpartyName,
            phone: tx.counterpartyPhone,
            type: tx.counterpartyType,
          },
          paymentMethod: tx.paymentMethod,
          createdAt: tx.createdAt,
          completedAt: tx.completedAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 0,
        },
      }),
    })
  } catch (err) {
    console.error('Get wallet transactions error:', err)
    return error('Failed to fetch transactions', 500)
  }
}
