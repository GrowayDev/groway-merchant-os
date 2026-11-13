import { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { getUserId, ok, error } from '../_lib/helpers'

/**
 * /api/consumer/ewa
 *
 * Replaces the previous in-memory ewaStore Map with Prisma ConsumerEWA
 * and ConsumerEWATransaction records.
 *
 * Money in the EWA model is stored as Float (ZAR, not cents) per the
 * Prisma schema, so no BigInt conversion is needed here.
 */

// GET /api/consumer/ewa - fetch or create the user's EWA account
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)

    const user = await db.consumerUser.findUnique({ where: { id: userId }, select: { id: true } })
    if (!user) {
      return error('User not found', 404)
    }

    let ewa = await db.consumerEWA.findUnique({
      where: { userId },
      include: {
        ConsumerEWATransaction: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    })

    // If the user has no EWA account yet, create one with mock employer data.
    if (!ewa) {
      ewa = await db.consumerEWA.create({
        data: {
          id: `ewa-${randomBytes(8).toString('hex')}`,
          userId,
          employeeId: `emp-${randomBytes(6).toString('hex')}`,
          employer: 'ACME Corp (Pty) Ltd',
          monthlySalary: 25000, // R25,000
          payDay: 25,
          accruedSalary: 10833, // earned so far this month
          availableAdvance: 6500, // R6,500
          usedThisMonth: 966,
          limit: 15000,
          eligible: true,
          nextPayDay: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
        include: {
          ConsumerEWATransaction: true,
        },
      })
    }

    return ok({ success: true, data: ewa })
  } catch (err) {
    console.error('Get EWA error:', err)
    return error('Failed to fetch EWA account', 500)
  }
}

// POST /api/consumer/ewa - request a wage advance
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const body = await request.json().catch(() => ({} as Record<string, unknown>))

    const amount = Number(body.amount ?? body.amountCents ?? 0)
    const reason = (body.reason as string | undefined) || 'Wage access'

    if (!amount || amount <= 0) {
      return error('Amount must be greater than 0')
    }

    const ewa = await db.consumerEWA.findUnique({ where: { userId } })
    if (!ewa) {
      return error('EWA not set up for this user', 400)
    }
    if (!ewa.eligible) {
      return error('User is not eligible for EWA advances', 403)
    }
    if (amount > ewa.availableAdvance) {
      return error('Amount exceeds available balance', 400)
    }

    // Flat 3% fee for pay-per-use plan (simplified).
    const feeRate = 0.03
    const fee = Math.round(amount * feeRate * 100) / 100
    const netAmount = Math.round((amount - fee) * 100) / 100

    const [tx, updated] = await db.$transaction([
      db.consumerEWATransaction.create({
        data: {
          id: `ewa-tx-${randomBytes(8).toString('hex')}`,
          userId,
          amount,
          fee,
          netAmount,
          reason,
          status: 'settled',
          requestedAt: new Date(),
          settledAt: new Date(),
          updatedAt: new Date(),
        },
      }),
      db.consumerEWA.update({
        where: { userId },
        data: {
          availableAdvance: ewa.availableAdvance - amount,
          usedThisMonth: ewa.usedThisMonth + amount,
          updatedAt: new Date(),
        },
      }),
    ])

    return ok({
      success: true,
      data: {
        transaction: tx,
        newAvailableAdvance: updated.availableAdvance,
        message: `R ${amount.toLocaleString('en-ZA')} withdrawn successfully. Fee: R ${fee.toLocaleString('en-ZA')}`,
      },
    })
  } catch (err) {
    console.error('EWA advance error:', err)
    return error('Failed to process withdrawal', 500)
  }
}

// PATCH /api/consumer/ewa - mark an EWA transaction as settled (employer repayment)
// or update the EWA plan.
export async function PATCH(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const body = await request.json().catch(() => ({} as Record<string, unknown>))

    // Action 1: settle a specific transaction (employer repayment)
    const transactionId = body.transactionId as string | undefined
    if (transactionId) {
      const tx = await db.consumerEWATransaction.findUnique({ where: { id: transactionId } })
      if (!tx || tx.userId !== userId) {
        return error('EWA transaction not found', 404)
      }
      if (tx.status === 'settled') {
        return error('Transaction is already settled', 400)
      }

      const updated = await db.consumerEWATransaction.update({
        where: { id: transactionId },
        data: {
          status: 'settled',
          settledAt: new Date(),
          updatedAt: new Date(),
        },
      })

      return ok({ success: true, data: updated, message: 'EWA transaction settled' })
    }

    // Action 2: update the EWA account (eligibility, employer info, etc.)
    const data: Record<string, unknown> = { updatedAt: new Date() }
    if (typeof body.eligible === 'boolean') data.eligible = body.eligible
    if (typeof body.employer === 'string') data.employer = body.employer
    if (typeof body.employeeId === 'string') data.employeeId = body.employeeId
    if (typeof body.monthlySalary === 'number') data.monthlySalary = body.monthlySalary
    if (typeof body.limit === 'number') data.limit = body.limit

    const updated = await db.consumerEWA.update({
      where: { userId },
      data,
    })

    return ok({ success: true, data: updated, message: 'EWA account updated' })
  } catch (err) {
    console.error('Update EWA error:', err)
    return error('Failed to update EWA', 500)
  }
}
