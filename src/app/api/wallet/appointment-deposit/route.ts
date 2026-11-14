import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  generateIdempotencyKey,
  formatSAPhone,
  type ApiResponse,
} from '@/lib/wallet-utils'

// Demo consumer user fallback used when no consumerId/phone is provided.
// This lets the merchant-facing flow exercise the wallet deduction even when
// the booking record was created without a linked consumer account.
const DEMO_CONSUMER_USER_ID = 'demo-consumer-user-001'

// Helper: BigInt-safe JSON serialization
function bigIntReplacer(_key: string, value: unknown): unknown {
  if (typeof value === 'bigint') {
    return value.toString()
  }
  return value
}

function jsonWithBigInt(data: unknown, init?: ResponseInit): NextResponse {
  return new NextResponse(JSON.stringify(data, bigIntReplacer), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })
}

// Resolve consumer userId from consumerId or consumerPhone, else fall back to demo user.
async function resolveConsumerUserId(
  consumerId: string | undefined,
  consumerPhone: string | undefined,
): Promise<{ userId: string; source: 'consumerId' | 'phone' | 'demo' }> {
  if (consumerId) {
    const consumer = await db.consumerUser.findUnique({
      where: { id: consumerId },
      select: { id: true },
    })
    if (consumer) {
      return { userId: consumer.id, source: 'consumerId' }
    }
  }

  if (consumerPhone) {
    const formatted = formatSAPhone(consumerPhone)
    const consumer = await db.consumerUser.findUnique({
      where: { phone: formatted },
      select: { id: true },
    })
    if (consumer) {
      return { userId: consumer.id, source: 'phone' }
    }
  }

  return { userId: DEMO_CONSUMER_USER_ID, source: 'demo' }
}

// GET - List recent appointment deposit transactions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: {
      transactionType: string
      merchantId?: string
    } = {
      transactionType: 'appointment_deposit',
    }
    if (merchantId) {
      where.merchantId = merchantId
    }

    const [deposits, count, totalAgg] = await Promise.all([
      db.walletTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.walletTransaction.count({ where }),
      db.walletTransaction.aggregate({
        where,
        _sum: { amountCents: true },
      }),
    ])

    return jsonWithBigInt({
      success: true,
      deposits,
      count,
      totalCollectedCents: totalAgg._sum.amountCents ?? BigInt(0),
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error fetching appointment deposits:', error)
    return jsonWithBigInt(
      {
        success: false,
        error: 'Failed to fetch appointment deposits',
      },
      { status: 500 },
    )
  }
}

// POST - Collect an appointment deposit from a consumer wallet
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      merchantId,
      merchantName,
      appointmentId,
      consumerPhone,
      consumerId,
      amountCents,
      service,
      reference,
    } = body as {
      merchantId?: string
      merchantName?: string
      appointmentId?: string
      consumerPhone?: string
      consumerId?: string
      amountCents?: number | string
      service?: string
      reference?: string
    }

    // 1. Validate amount
    const amountBigInt = BigInt(amountCents ?? 0)
    if (amountBigInt <= BigInt(0)) {
      return jsonWithBigInt(
        {
          success: false,
          error: 'Amount must be greater than zero',
        },
        { status: 400 },
      )
    }

    if (!appointmentId) {
      return jsonWithBigInt(
        {
          success: false,
          error: 'appointmentId is required',
        },
        { status: 400 },
      )
    }

    if (!merchantId) {
      return jsonWithBigInt(
        {
          success: false,
          error: 'merchantId is required',
        },
        { status: 400 },
      )
    }

    // 2. Resolve the consumer wallet
    const { userId, source } = await resolveConsumerUserId(
      consumerId,
      consumerPhone,
    )

    const wallet = await db.consumerWallet.findUnique({
      where: { userId },
    })

    if (!wallet) {
      return jsonWithBigInt(
        {
          success: false,
          error:
            source === 'demo'
              ? 'Consumer wallet not found. No consumer linked and demo wallet missing.'
              : 'Consumer wallet not found',
          availableBalanceCents: 0,
        },
        { status: 400 },
      )
    }

    // 3. Check balance
    if (wallet.balanceCents < amountBigInt) {
      return jsonWithBigInt(
        {
          success: false,
          error: 'Insufficient wallet balance',
          availableBalanceCents: wallet.balanceCents,
          requestedCents: amountBigInt,
        },
        { status: 400 },
      )
    }

    // 4. Prepare transaction data
    const balanceBeforeCents = wallet.balanceCents
    const balanceAfterCents = balanceBeforeCents - amountBigInt
    const receiptNumber = `APT-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    const idempotencyKey = generateIdempotencyKey()
    const description = `Appointment deposit: ${service || appointmentId}`
    const now = new Date()
    const walletTxId = `wtx_${Date.now()}_${Math.floor(Math.random() * 10000)}`
    const consumerTxId = `txn_${Date.now()}_${Math.floor(Math.random() * 10000)}`

    // Resolve counterparty info (for WalletTransaction counterparty fields)
    const counterpartyId: string | null = merchantId || null
    const counterpartyName: string | null = merchantName || null
    let counterpartyPhone: string | null = null
    if (consumerPhone) {
      try {
        counterpartyPhone = formatSAPhone(consumerPhone)
      } catch {
        counterpartyPhone = consumerPhone
      }
    }

    // 5. Run as a single DB transaction (atomic)
    const [walletTx] = await db.$transaction([
      // Create WalletTransaction (ledger entry)
      db.walletTransaction.create({
        data: {
          id: walletTxId,
          walletId: wallet.id,
          userId: wallet.userId,
          direction: 'debit',
          transactionType: 'appointment_deposit',
          amountCents: amountBigInt,
          feeCents: BigInt(0),
          balanceBeforeCents,
          balanceAfterCents,
          currency: wallet.currency || 'ZAR',
          status: 'completed',
          description,
          reference: reference || appointmentId,
          category: 'appointment',
          counterpartyId,
          counterpartyName,
          counterpartyPhone,
          counterpartyType: 'merchant',
          merchantId: merchantId || null,
          merchantName: merchantName || null,
          paymentMethod: 'wallet',
          sourceChannel: 'pos',
          processedAt: now,
          completedAt: now,
        },
      }),
      // Update wallet balance + totals
      db.consumerWallet.update({
        where: { userId: wallet.userId },
        data: {
          balanceCents: { decrement: amountBigInt },
          totalSentCents: { increment: amountBigInt },
          updatedAt: now,
        },
      }),
      // Create ConsumerTransaction (backward-compat ledger)
      db.consumerTransaction.create({
        data: {
          id: consumerTxId,
          idempotencyKey,
          userId: wallet.userId,
          transactionType: 'appointment_deposit',
          direction: 'debit',
          amountCents: amountBigInt,
          feeCents: BigInt(0),
          netAmountCents: amountBigInt,
          currency: wallet.currency || 'ZAR',
          status: 'completed',
          description,
          reference: reference || appointmentId,
          category: 'appointment',
          counterpartyId,
          counterpartyName,
          counterpartyPhone,
          counterpartyType: 'merchant',
          paymentMethod: 'wallet',
          merchantId: merchantId || null,
          merchantName: merchantName || null,
          completedAt: now,
          updatedAt: now,
        },
      }),
    ])

    return jsonWithBigInt({
      success: true,
      transaction: walletTx,
      walletBalance: balanceAfterCents,
      receiptNumber,
      consumerUserId: wallet.userId,
      consumerSource: source,
    })
  } catch (error) {
    console.error('Error collecting appointment deposit:', error)
    return jsonWithBigInt(
      {
        success: false,
        error: 'Failed to collect appointment deposit',
      },
      { status: 500 },
    )
  }
}

// Keep ApiResponse type imported for future typed responses
export type { ApiResponse }
