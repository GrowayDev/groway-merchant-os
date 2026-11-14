import { db } from '@/lib/db'
import { randomBytes } from 'crypto'

/**
 * GoPay Consumer Wallet ↔ Groway Merchant OS bridge service.
 *
 * All money values are ZAR cents stored as BigInt in Prisma and
 * converted to plain Numbers at the API edge (JSON-safe).
 *
 * Flow model:
 *  - Merchant OS links a CRM customer (by mobile number) to the
 *    consumer's GoPay wallet  -> ConsumerWalletLink
 *  - Every wallet movement writes a ConsumerWalletActivity row
 *    (single feed powering BOTH the consumer app activity list and
 *    the merchant-side activity feed, keyed by merchantId).
 *  - Consumer payments to a merchant debit the wallet, write a
 *    ConsumerTransaction, a consumer activity (debit) AND a
 *    merchant activity (credit), optionally create a POS
 *    Transaction, and earn CRM loyalty points.
 */

export type ActivityType =
  | 'topup'
  | 'payment'
  | 'cashback'
  | 'reward'
  | 'refund'
  | 'loyalty_earn'
  | 'loyalty_redeem'
  | 'link'
  | 'unlink'
  | 'transfer'

export type WalletDirection = 'credit' | 'debit' | 'info'

const genId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}${randomBytes(4).toString('hex')}`

/** Normalize SA mobile numbers: `+27 82 123 4567`, `082 123 4567`, `27821234567` -> `+27821234567` */
export function normalizePhone(input: string | null | undefined): string | null {
  if (!input) return null
  const digits = String(input).replace(/[^\d+]/g, '')
  let msisdn = digits.replace(/^\+/, '')
  if (msisdn.startsWith('0') && msisdn.length === 10) msisdn = `27${msisdn.slice(1)}`
  if (msisdn.length !== 11 || !msisdn.startsWith('27')) return null
  return `+${msisdn}`
}

export const centsToRands = (cents: number | null | undefined): number =>
  Math.round(cents ?? 0) / 100

export const randsToCents = (rands: number): number => Math.round(rands * 100)

export function serializeWallet(wallet: {
  id: string
  balanceCents: bigint
  currency: string
  totalTopupsCents?: bigint
  totalReceivedCents?: bigint
  totalSentCents?: bigint
} | null) {
  if (!wallet) return null
  return {
    id: wallet.id,
    balanceCents: Number(wallet.balanceCents),
    balance: centsToRands(Number(wallet.balanceCents)),
    currency: wallet.currency,
    totalTopups: centsToRands(Number(wallet.totalTopupsCents ?? 0n)),
    totalReceived: centsToRands(Number(wallet.totalReceivedCents ?? 0n)),
    totalSent: centsToRands(Number(wallet.totalSentCents ?? 0n)),
  }
}

export function serializeActivity(a: {
  id: string
  activityType: string
  title: string
  description: string | null
  direction: string
  amountCents: bigint | null
  balanceAfterCents: bigint | null
  merchantId: string | null
  merchantName: string | null
  referenceType: string | null
  referenceId: string | null
  createdAt: Date
}) {
  return {
    id: a.id,
    activityType: a.activityType,
    title: a.title,
    description: a.description,
    direction: a.direction,
    amountCents: a.amountCents === null ? null : Number(a.amountCents),
    amount: a.amountCents === null ? null : centsToRands(Number(a.amountCents)),
    balanceAfter:
      a.balanceAfterCents === null ? null : centsToRands(Number(a.balanceAfterCents)),
    merchantId: a.merchantId,
    merchantName: a.merchantName,
    referenceType: a.referenceType,
    referenceId: a.referenceId,
    createdAt: a.createdAt.toISOString(),
  }
}

export async function getOrCreateWallet(userId: string) {
  const existing = await db.consumerWallet.findUnique({ where: { userId } })
  if (existing) return existing
  return db.consumerWallet.create({
    data: { id: genId('wal'), userId, updatedAt: new Date() },
  })
}

export async function createActivity(params: {
  consumerUserId: string
  activityType: ActivityType
  title: string
  description?: string | null
  direction?: WalletDirection
  amountCents?: number | null
  balanceAfterCents?: number | null
  merchantId?: string | null
  merchantName?: string | null
  referenceType?: string | null
  referenceId?: string | null
  metadata?: Record<string, unknown> | null
}) {
  return db.consumerWalletActivity.create({
    data: {
      id: genId('wla'),
      consumerUserId: params.consumerUserId,
      activityType: params.activityType,
      title: params.title,
      description: params.description ?? null,
      direction: params.direction ?? 'info',
      amountCents:
        params.amountCents === null || params.amountCents === undefined
          ? null
          : BigInt(params.amountCents),
      balanceAfterCents:
        params.balanceAfterCents === null || params.balanceAfterCents === undefined
          ? null
          : BigInt(params.balanceAfterCents),
      merchantId: params.merchantId ?? null,
      merchantName: params.merchantName ?? null,
      referenceType: params.referenceType ?? null,
      referenceId: params.referenceId ?? null,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    },
  })
}

export interface WalletMovementResult {
  balanceCents: number
  activityId: string
  transactionId: string
  duplicate?: boolean
}

/**
 * Credit a consumer wallet (topup, merchant cashback, refund, reward).
 * Writes ConsumerTransaction + activity atomically.
 */
export async function creditConsumerWallet(params: {
  consumerUserId: string
  amountCents: number
  activityType: ActivityType
  title: string
  description?: string | null
  merchantId?: string | null
  merchantName?: string | null
  referenceType?: string | null
  referenceId?: string | null
  transactionType?: string
  idempotencyKey?: string
  paymentMethod?: string
}): Promise<WalletMovementResult> {
  if (!Number.isFinite(params.amountCents) || params.amountCents <= 0) {
    throw new WalletBridgeError('Amount must be greater than zero', 400)
  }
  const wallet = await getOrCreateWallet(params.consumerUserId)
  const txId = genId('ctx')
  const now = new Date()

  const result = await db.$transaction(async (tx) => {
    const updated = await tx.consumerWallet.update({
      where: { id: wallet.id },
      data: {
        balanceCents: { increment: BigInt(params.amountCents) },
        totalTopupsCents:
          params.activityType === 'topup'
            ? { increment: BigInt(params.amountCents) }
            : undefined,
        totalReceivedCents:
          params.activityType !== 'topup'
            ? { increment: BigInt(params.amountCents) }
            : undefined,
        updatedAt: now,
      },
    })

    const created = await tx.consumerTransaction.create({
      data: {
        id: txId,
        idempotencyKey:
          params.idempotencyKey || `${params.activityType}:${txId}`,
        userId: params.consumerUserId,
        transactionType: params.transactionType || params.activityType,
        direction: 'credit',
        amountCents: BigInt(params.amountCents),
        netAmountCents: BigInt(params.amountCents),
        status: 'completed',
        description: params.description ?? params.title,
        reference: params.referenceId ?? null,
        counterpartyId: params.merchantId ?? null,
        counterpartyName: params.merchantName ?? null,
        counterpartyType: params.merchantId ? 'merchant' : null,
        paymentMethod: params.paymentMethod ?? 'wallet',
        merchantId: params.merchantId ?? null,
        merchantName: params.merchantName ?? null,
        completedAt: now,
        processedAt: now,
        updatedAt: now,
      },
    })

    const activity = await tx.consumerWalletActivity.create({
      data: {
        id: genId('wla'),
        consumerUserId: params.consumerUserId,
        activityType: params.activityType,
        title: params.title,
        description: params.description ?? null,
        direction: 'credit',
        amountCents: BigInt(params.amountCents),
        balanceAfterCents: updated.balanceCents,
        merchantId: params.merchantId ?? null,
        merchantName: params.merchantName ?? null,
        referenceType: params.referenceType ?? null,
        referenceId: created.id,
        createdAt: now,
      },
    })

    return { balance: updated.balanceCents, activityId: activity.id }
  })

  return {
    balanceCents: Number(result.balance),
    activityId: result.activityId,
    transactionId: txId,
  }
}

/** Custom error carrying an HTTP status for route handlers. */
export class WalletBridgeError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

/**
 * Debit a consumer wallet (pay merchant, transfer out).
 * Enforces available balance; writes ConsumerTransaction + activity atomically.
 */
export async function debitConsumerWallet(params: {
  consumerUserId: string
  amountCents: number
  activityType: ActivityType
  title: string
  description?: string | null
  merchantId?: string | null
  merchantName?: string | null
  referenceType?: string | null
  referenceId?: string | null
  transactionType?: string
  idempotencyKey?: string
  paymentMethod?: string
}): Promise<WalletMovementResult> {
  if (!Number.isFinite(params.amountCents) || params.amountCents <= 0) {
    throw new WalletBridgeError('Amount must be greater than zero', 400)
  }
  const wallet = await getOrCreateWallet(params.consumerUserId)
  const balance = Number(wallet.balanceCents)
  if (balance < params.amountCents) {
    throw new WalletBridgeError(
      `Insufficient funds: wallet balance is R${centsToRands(balance).toFixed(2)}`,
      409
    )
  }
  const txId = genId('ctx')
  const now = new Date()

  const result = await db.$transaction(async (tx) => {
    const updated = await tx.consumerWallet.update({
      where: { id: wallet.id },
      data: {
        balanceCents: { decrement: BigInt(params.amountCents) },
        totalSentCents: { increment: BigInt(params.amountCents) },
        updatedAt: now,
      },
    })

    const created = await tx.consumerTransaction.create({
      data: {
        id: txId,
        idempotencyKey:
          params.idempotencyKey || `${params.activityType}:${txId}`,
        userId: params.consumerUserId,
        transactionType: params.transactionType || params.activityType,
        direction: 'debit',
        amountCents: BigInt(params.amountCents),
        netAmountCents: BigInt(params.amountCents),
        status: 'completed',
        description: params.description ?? params.title,
        reference: params.referenceId ?? null,
        counterpartyId: params.merchantId ?? null,
        counterpartyName: params.merchantName ?? null,
        counterpartyType: params.merchantId ? 'merchant' : 'consumer',
        paymentMethod: params.paymentMethod ?? 'wallet',
        merchantId: params.merchantId ?? null,
        merchantName: params.merchantName ?? null,
        completedAt: now,
        processedAt: now,
        updatedAt: now,
      },
    })

    const activity = await tx.consumerWalletActivity.create({
      data: {
        id: genId('wla'),
        consumerUserId: params.consumerUserId,
        activityType: params.activityType,
        title: params.title,
        description: params.description ?? null,
        direction: 'debit',
        amountCents: BigInt(params.amountCents),
        balanceAfterCents: updated.balanceCents,
        merchantId: params.merchantId ?? null,
        merchantName: params.merchantName ?? null,
        referenceType: params.referenceType ?? null,
        referenceId: created.id,
        createdAt: now,
      },
    })

    return { balance: updated.balanceCents, activityId: activity.id }
  })

  return {
    balanceCents: Number(result.balance),
    activityId: result.activityId,
    transactionId: txId,
  }
}

/** Find a Groway merchant by phone (normalized) or explicit id. */
export async function findMerchant(phoneOrId: string) {
  const normalized = normalizePhone(phoneOrId)
  if (!normalized) {
    const byId = await db.merchant.findUnique({ where: { id: phoneOrId } })
    return byId
  }
  const byPhone = await db.merchant.findFirst({ where: { phone: normalized } })
  if (byPhone) return byPhone
  // Fallback: compare stripped digits (merchants may store spaced numbers)
  const candidates = await db.merchant.findMany({
    where: { phone: { not: null } },
    select: { id: true, name: true, tradingName: true, phone: true },
    take: 500,
  })
  return (
    candidates.find(
      (m) => m.phone && normalizePhone(m.phone) === normalized
    ) ?? null
  )
}

/** Ensure a MerchantCustomer CRM record (and loyalty account) exists for the link. */
export async function ensureMerchantCustomer(
  merchantId: string,
  consumer: { id: string; phone: string; firstName?: string | null; lastName?: string | null }
) {
  const name =
    [consumer.firstName, consumer.lastName].filter(Boolean).join(' ') ||
    `Wallet customer ${consumer.phone.slice(-4)}`
  const existing = await db.merchantCustomer.findFirst({
    where: { merchantId, phone: consumer.phone },
  })
  if (existing) return existing
  const created = await db.merchantCustomer.create({
    data: {
      id: genId('mc'),
      merchantId,
      name,
      phone: consumer.phone,
      email: null,
      segment: 'wallet',
      tags: JSON.stringify(['GoPay Wallet']),
      updatedAt: new Date(),
    },
  })
  await db.loyaltyAccount
    .create({
      data: {
        id: genId('la'),
        merchantId,
        customerId: created.id,
        updatedAt: new Date(),
      },
    })
    .catch(() => null) // unique(merchantId, customerId) may already exist
  return created
}

/** Award CRM loyalty points (1 pt per R10 spent) + update customer stats. */
export async function awardLoyaltyForSpend(params: {
  merchantId: string
  merchantCustomerId: string | null | undefined
  amountRands: number
  referenceType: string
  referenceId: string
}) {
  if (!params.merchantCustomerId) return
  const points = Math.floor(params.amountRands / 10)
  if (points <= 0) return
  const account = await db.loyaltyAccount.findUnique({
    where: { customerId: params.merchantCustomerId },
  })
  if (account) {
    await db.$transaction([
      db.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          pointsBalance: { increment: points },
          pointsEarned: { increment: points },
          updatedAt: new Date(),
        },
      }),
      db.loyaltyTransaction.create({
        data: {
          id: genId('lt'),
          loyaltyAccountId: account.id,
          type: 'earn',
          points,
          balance: account.pointsBalance + points,
          referenceType: params.referenceType,
          referenceId: params.referenceId,
          description: 'GoPay wallet payment',
          monetaryValue: params.amountRands,
        },
      }),
      db.merchantCustomer.update({
        where: { id: params.merchantCustomerId },
        data: {
          loyaltyPoints: { increment: points },
          totalSpent: { increment: params.amountRands },
          visitCount: { increment: 1 },
          lastVisitAt: new Date(),
        },
      }),
    ])
  } else {
    await db.merchantCustomer
      .update({
        where: { id: params.merchantCustomerId },
        data: {
          loyaltyPoints: { increment: points },
          totalSpent: { increment: params.amountRands },
          visitCount: { increment: 1 },
          lastVisitAt: new Date(),
        },
      })
      .catch(() => null)
  }
}

/** Aggregate numbers for the Merchant OS wallet dashboard. */
export async function getMerchantWalletSummary(merchantId: string) {
  const [links, activities, payments] = await Promise.all([
    db.consumerWalletLink.findMany({
      where: { merchantId, status: 'active' },
      select: { consumerUserId: true },
    }),
    db.consumerWalletActivity.findFirst({
      where: { merchantId },
      orderBy: { createdAt: 'desc' },
    }),
    db.consumerTransaction.aggregate({
      where: {
        merchantId,
        direction: 'debit', // consumer-side debit = merchant-side receipt
        status: 'completed',
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      _sum: { amountCents: true },
      _count: true,
    }),
  ])

  const userIds = links.map((l) => l.consumerUserId)
  const wallets = userIds.length
    ? await db.consumerWallet.findMany({ where: { userId: { in: userIds } } })
    : []
  const heldCents = wallets.reduce(
    (sum, w) => sum + Number(w.balanceCents),
    0
  )

  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)
  const creditsIssued = await db.consumerWalletActivity.aggregate({
    where: {
      merchantId,
      activityType: { in: ['cashback', 'reward', 'refund'] },
      direction: 'credit',
      createdAt: { gte: monthStart },
    },
    _sum: { amountCents: true },
    _count: true,
  })

  return {
    linkedWallets: links.length,
    totalBalanceHeld: centsToRands(heldCents),
    walletPayments30d: {
      count: payments._count,
      total: centsToRands(Number(payments._sum.amountCents ?? 0n)),
    },
    creditsIssuedThisMonth: {
      count: creditsIssued._count,
      total: centsToRands(Number(creditsIssued._sum.amountCents ?? 0n)),
    },
  }
}
