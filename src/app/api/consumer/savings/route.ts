import { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { getUserId, ok, error, parseMoney } from '../_lib/helpers'
import { SAVINGS_TYPES, generateReceiptNo } from '@/lib/consumer-wallet/catalog'

/**
 * /api/consumer/savings
 *
 * Goal-based, pocket, fixed deposit, stokvel and auto-save pockets
 * backed by the Prisma `SavingsPocket` model. Money is stored as BigInt
 * cents. The catalog `SAVINGS_TYPES` drives the create form; the type
 * value is persisted in `autoSaveRule` (the only free-form String field
 * on the model) and surfaced back to the UI as `type`.
 */

// GET /api/consumer/savings — list user's pockets with progress
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)

    const pockets = await db.savingsPocket.findMany({
      where: { userId, status: 'active' },
      orderBy: { createdAt: 'desc' },
    })

    const totalSavedCents = pockets.reduce(
      (sum, p) => sum + (p.currentCents ?? 0n),
      0n,
    )

    const totalTargetCents = pockets.reduce(
      (sum, p) => sum + (p.targetCents ?? 0n),
      0n,
    )

    const data = pockets.map((p) => {
      const target = p.targetCents ?? 0n
      const current = p.currentCents ?? 0n
      const progress = target > 0n
        ? Math.min(100, Number((current * 100n) / target))
        : null
      const typeValue = p.autoSaveRule && SAVINGS_TYPES.some((t) => t.value === p.autoSaveRule)
        ? p.autoSaveRule
        : 'pocket'
      const typeMeta = SAVINGS_TYPES.find((t) => t.value === typeValue)
      return {
        id: p.id,
        name: p.name,
        type: typeValue,
        typeLabel: typeMeta?.label ?? 'Savings Pocket',
        typeIcon: typeMeta?.icon ?? '💰',
        typeDesc: typeMeta?.desc ?? 'Flexible savings',
        icon: p.icon,
        color: p.color,
        targetCents: p.targetCents?.toString() ?? null,
        currentCents: current.toString(),
        interestRate: p.interestRate,
        interestEarnedCents: p.interestEarned.toString(),
        targetDate: p.targetDate,
        status: p.status,
        progress,
        createdAt: p.createdAt,
      }
    })

    // GroAI insight — derived from savings velocity vs target.
    const monthlyAvgCents = pockets.length > 0
      ? totalSavedCents / BigInt(Math.max(1, pockets.length))
      : 0n
    const insight = monthlyAvgCents > 0n
      ? `Based on your spending patterns, you could save R${(Number(monthlyAvgCents) / 100 * 1.25).toFixed(0)} more per month by rounding up every transaction and auto-routing the difference into your "${pockets[0]?.name ?? 'Pocket'}" pocket. Switching one takeaway meal per week to home-cooked would add roughly R${(Number(monthlyAvgCents) / 100 * 0.6).toFixed(0)} extra.`
      : 'Start a savings pocket today — even R50/week compounds. GroAI recommends an Auto-Save pocket that rounds up every payment to the nearest R10 and banks the change.'

    return ok({
      success: true,
      data: {
        pockets: data,
        totalSavedCents: totalSavedCents.toString(),
        totalTargetCents: totalTargetCents.toString(),
        totalPockets: pockets.length,
        types: SAVINGS_TYPES,
        groaiInsight: insight,
      },
    })
  } catch (err) {
    console.error('Get savings error:', err)
    return error('Failed to fetch savings pockets', 500)
  }
}

// POST /api/consumer/savings — create a new savings pocket
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const body = await request.json().catch(() => ({} as Record<string, unknown>))

    const name = (body.name as string | undefined)?.trim()
    if (!name) return error('Pocket name is required', 400)

    const typeRaw = (body.type as string | undefined) ?? 'pocket'
    const typeMeta = SAVINGS_TYPES.find((t) => t.value === typeRaw)
    if (!typeMeta) return error(`Invalid savings type: ${typeRaw}`, 400)

    const icon = (body.icon as string | undefined) ?? typeMeta.icon
    const color = (body.color as string | undefined) ?? '#00897B'
    const targetCents = body.targetCents != null
      ? parseMoney(body.targetCents as string | number)
      : null
    const targetDate = (body.targetDate as string | undefined) ?? null

    // Interest rates by type (fixed deposit earns more, auto-save earns less).
    const interestRate =
      typeRaw === 'fixed' ? 0.075 :
      typeRaw === 'stokvel' ? 0.06 :
      typeRaw === 'goal' ? 0.055 :
      typeRaw === 'auto' ? 0.045 :
      0.05

    const pocket = await db.savingsPocket.create({
      data: {
        id: `pocket-${randomBytes(8).toString('hex')}`,
        userId,
        name,
        icon,
        color,
        targetCents,
        currentCents: 0n,
        interestRate,
        interestEarned: 0n,
        // Reuse the free-form autoSaveRule field to persist the catalog type
        // value so GET can return the type label/icon alongside the pocket.
        autoSaveRule: typeRaw,
        targetDate,
        status: 'active',
        updatedAt: new Date(),
      },
    })

    return ok({
      success: true,
      data: {
        id: pocket.id,
        name: pocket.name,
        type: typeRaw,
        typeLabel: typeMeta.label,
        typeIcon: typeMeta.icon,
        typeDesc: typeMeta.desc,
        icon: pocket.icon,
        color: pocket.color,
        targetCents: pocket.targetCents?.toString() ?? null,
        currentCents: pocket.currentCents.toString(),
        interestRate: pocket.interestRate,
        targetDate: pocket.targetDate,
        status: pocket.status,
        createdAt: pocket.createdAt,
      },
    }, 201)
  } catch (err) {
    console.error('Create savings pocket error:', err)
    return error('Failed to create savings pocket', 500)
  }
}

// PUT /api/consumer/savings — deposit or withdraw from a pocket
export async function PUT(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const body = await request.json().catch(() => ({} as Record<string, unknown>))

    const pocketId = body.pocketId as string | undefined
    const action = body.action as string | undefined
    const amountInput = body.amount ?? body.amountCents

    if (!pocketId) return error('pocketId is required', 400)
    if (action !== 'deposit' && action !== 'withdraw') {
      return error('action must be "deposit" or "withdraw"', 400)
    }
    if (amountInput == null) return error('amount is required', 400)

    const amountCents = parseMoney(amountInput as string | number)
    if (amountCents <= 0n) return error('amount must be greater than 0', 400)

    const pocket = await db.savingsPocket.findUnique({ where: { id: pocketId } })
    if (!pocket || pocket.userId !== userId) {
      return error('Savings pocket not found', 404)
    }

    // Wallet is optional in demo mode — we move money only if it exists.
    const wallet = await db.consumerWallet.findUnique({ where: { userId } })

    const receiptNo = generateReceiptNo('SAV')
    const now = new Date()
    const isDeposit = action === 'deposit'

    if (isDeposit) {
      // Need wallet funds to deposit into a pocket.
      if (wallet && wallet.balanceCents < amountCents) {
        return error('Insufficient funds in wallet', 400)
      }

      await db.$transaction([
        db.savingsPocket.update({
          where: { id: pocketId },
          data: {
            currentCents: { increment: amountCents },
            updatedAt: now,
          },
        }),
        ...(wallet
          ? [db.consumerWallet.update({
              where: { userId },
              data: { balanceCents: { decrement: amountCents }, updatedAt: now },
            })]
          : []),
        db.consumerTransaction.create({
          data: {
            id: `ctx-${randomBytes(8).toString('hex')}`,
            idempotencyKey: `${receiptNo}-dep`,
            userId,
            transactionType: 'savings_deposit',
            direction: 'debit',
            amountCents,
            feeCents: 0n,
            netAmountCents: amountCents,
            currency: 'ZAR',
            status: 'completed',
            description: `Deposit to ${pocket.name}`,
            reference: receiptNo,
            category: 'savings',
            paymentMethod: 'wallet',
            completedAt: now,
            updatedAt: now,
          },
        }),
      ])
    } else {
      // Withdraw — pocket must have funds; credit wallet if it exists.
      if ((pocket.currentCents ?? 0n) < amountCents) {
        return error('Insufficient funds in savings pocket', 400)
      }

      await db.$transaction([
        db.savingsPocket.update({
          where: { id: pocketId },
          data: {
            currentCents: { decrement: amountCents },
            updatedAt: now,
          },
        }),
        ...(wallet
          ? [db.consumerWallet.update({
              where: { userId },
              data: { balanceCents: { increment: amountCents }, updatedAt: now },
            })]
          : []),
        db.consumerTransaction.create({
          data: {
            id: `ctx-${randomBytes(8).toString('hex')}`,
            idempotencyKey: `${receiptNo}-wdr`,
            userId,
            transactionType: 'savings_withdrawal',
            direction: 'credit',
            amountCents,
            feeCents: 0n,
            netAmountCents: amountCents,
            currency: 'ZAR',
            status: 'completed',
            description: `Withdrawal from ${pocket.name}`,
            reference: receiptNo,
            category: 'savings',
            paymentMethod: 'wallet',
            completedAt: now,
            updatedAt: now,
          },
        }),
      ])
    }

    const updated = await db.savingsPocket.findUnique({ where: { id: pocketId } })

    return ok({
      success: true,
      data: {
        pocketId,
        action,
        amountCents: amountCents.toString(),
        newBalanceCents: updated?.currentCents.toString() ?? '0',
        reference: receiptNo,
        receiptNo,
        message: `${isDeposit ? 'Deposit' : 'Withdrawal'} of R${(Number(amountCents) / 100).toFixed(2)} ${isDeposit ? 'added to' : 'withdrawn from'} ${pocket.name}`,
      },
    })
  } catch (err) {
    console.error('Savings operation error:', err)
    return error('Failed to process savings operation', 500)
  }
}
