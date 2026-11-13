import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUserId, ok, error } from '../_lib/helpers'

/**
 * /api/consumer/disputes
 *
 * Uses the disputedAt / disputeReason / disputeStatus / disputeResolvedAt
 * fields on the ConsumerTransaction model.
 */

// GET /api/consumer/disputes - list disputed transactions for the user
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {
      userId,
      disputedAt: { not: null },
    }
    if (status) where.disputeStatus = status

    const disputes = await db.consumerTransaction.findMany({
      where,
      orderBy: { disputedAt: 'desc' },
    })

    return ok({ success: true, data: disputes })
  } catch (err) {
    console.error('List disputes error:', err)
    return error('Failed to fetch disputes', 500)
  }
}

// POST /api/consumer/disputes - open a dispute on an existing transaction
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const body = await request.json().catch(() => ({} as Record<string, unknown>))

    const transactionId = body.transactionId as string | undefined
    const reason = (body.reason as string | undefined) || ''

    if (!transactionId) return error('transactionId is required')
    if (!reason.trim()) return error('reason is required')

    const tx = await db.consumerTransaction.findUnique({ where: { id: transactionId } })
    if (!tx || tx.userId !== userId) {
      return error('Transaction not found', 404)
    }
    if (tx.disputedAt) {
      return error('Transaction is already disputed', 400)
    }

    const updated = await db.consumerTransaction.update({
      where: { id: transactionId },
      data: {
        disputedAt: new Date(),
        disputeReason: reason,
        disputeStatus: 'open',
        updatedAt: new Date(),
      },
    })

    return ok({
      success: true,
      data: updated,
      message: 'Dispute opened successfully. Our team will review it.',
    }, 201)
  } catch (err) {
    console.error('Open dispute error:', err)
    return error('Failed to open dispute', 500)
  }
}
