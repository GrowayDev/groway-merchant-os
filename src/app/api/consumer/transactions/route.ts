import { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { getUserId, ok, error, parseMoney } from '../_lib/helpers'

/**
 * /api/consumer/transactions
 *
 * Replaces the previous in-memory transactionsStore Map with Prisma
 * ConsumerTransaction. All money is BigInt cents.
 */

// GET /api/consumer/transactions - list transactions with optional filters
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const { searchParams } = new URL(request.url)

    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate') || searchParams.get('from')
    const endDate = searchParams.get('endDate') || searchParams.get('to')

    const where: Record<string, unknown> = { userId }
    if (type) where.transactionType = type
    if (status) where.status = status
    if (startDate || endDate) {
      const createdAtFilter: Record<string, Date> = {}
      if (startDate) createdAtFilter.gte = new Date(startDate)
      if (endDate) createdAtFilter.lte = new Date(endDate)
      where.createdAt = createdAtFilter
    }

    const [total, transactions] = await Promise.all([
      db.consumerTransaction.count({ where }),
      db.consumerTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
    ])

    return ok({
      success: true,
      data: {
        transactions,
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (err) {
    console.error('List transactions error:', err)
    return error('Failed to fetch transactions', 500)
  }
}

// POST /api/consumer/transactions - create a manual transaction (for testing)
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const body = await request.json().catch(() => ({} as Record<string, unknown>))

    const transactionType = body.transactionType as string | undefined
    const direction = body.direction as string | undefined

    if (!transactionType || !direction) {
      return error('transactionType and direction are required')
    }
    if (direction !== 'credit' && direction !== 'debit') {
      return error('direction must be "credit" or "debit"')
    }

    const amount = parseMoney((body.amountCents ?? body.amount ?? 0) as string | number)
    if (amount <= 0) {
      return error('amountCents must be greater than 0')
    }
    const fee = parseMoney((body.feeCents ?? 0) as string | number)
    const netAmount = direction === 'credit' ? amount - fee : amount + fee

    const idempotencyKey =
      (body.idempotencyKey as string | undefined) || randomBytes(16).toString('hex')

    // Idempotency check
    const existing = await db.consumerTransaction.findUnique({ where: { idempotencyKey } })
    if (existing) {
      return ok({ success: true, data: existing, message: 'Transaction already processed' })
    }

    const reference =
      (body.reference as string | undefined) ||
      `${transactionType.slice(0, 3).toUpperCase()}${Date.now().toString(36).toUpperCase()}`

    const tx = await db.consumerTransaction.create({
      data: {
        id: `tx-${randomBytes(8).toString('hex')}`,
        idempotencyKey,
        userId,
        transactionType,
        direction,
        amountCents: amount,
        feeCents: fee,
        netAmountCents: netAmount,
        currency: (body.currency as string) || 'ZAR',
        status: (body.status as string) || 'completed',
        description: (body.description as string) || null,
        reference,
        category: (body.category as string) || null,
        counterpartyId: (body.counterpartyId as string) || null,
        counterpartyName: (body.counterpartyName as string) || null,
        counterpartyPhone: (body.counterpartyPhone as string) || null,
        counterpartyType: (body.counterpartyType as string) || null,
        paymentMethod: (body.paymentMethod as string) || null,
        completedAt: body.status === 'completed' || !body.status ? new Date() : null,
        updatedAt: new Date(),
      },
    })

    return ok({ success: true, data: tx }, 201)
  } catch (err) {
    console.error('Create transaction error:', err)
    return error('Failed to create transaction', 500)
  }
}
