import { NextRequest, NextResponse } from 'next/server'
import { getConsumerAuth } from '@/lib/consumer-auth'
import {
  randsToCents,
  centsToRands,
  creditConsumerWallet,
  getOrCreateWallet,
  WalletBridgeError,
} from '@/lib/wallet-bridge'

const METHODS = ['card', 'eft', 'cash_at_teller', 'airtime_transfer', 'sassa'] as const

// POST /api/consumer/wallet/topup
// Top up the consumer wallet. Body: { amount (ZAR rands), method, reference? }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const auth = await getConsumerAuth(request, body?.userId ?? null)
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const amountRands = Number(body?.amount)
    const method = (METHODS as readonly string[]).includes(body?.method)
      ? (body.method as (typeof METHODS)[number])
      : 'card'
    const reference = typeof body?.reference === 'string' ? body.reference.slice(0, 100) : null

    if (!Number.isFinite(amountRands) || amountRands < 10) {
      return NextResponse.json(
        { success: false, error: 'Minimum top-up is R10' },
        { status: 400 }
      )
    }
    if (amountRands > 50000) {
      return NextResponse.json(
        { success: false, error: 'Maximum top-up is R50,000' },
        { status: 400 }
      )
    }

    const amountCents = randsToCents(amountRands)
    const result = await creditConsumerWallet({
      consumerUserId: auth.userId,
      amountCents,
      activityType: 'topup',
      title: 'Wallet top-up',
      description: reference ? `Top-up via ${method.replace(/_/g, ' ')}` : `Via ${method.replace(/_/g, ' ')}`,
      referenceType: 'topup',
      idempotencyKey: body?.idempotencyKey
        ? String(body.idempotencyKey)
        : undefined,
      transactionType: 'topup',
      paymentMethod: method,
    })

    const wallet = await getOrCreateWallet(auth.userId)

    return NextResponse.json({
      success: true,
      topup: {
        amount: centsToRands(amountCents),
        method,
        newBalance: centsToRands(result.balanceCents),
        transactionId: result.transactionId,
        activityId: result.activityId,
      },
      wallet: {
        balanceCents: Number(wallet.balanceCents),
        balance: centsToRands(Number(wallet.balanceCents)),
        currency: wallet.currency,
      },
      message: `Wallet topped up with R${amountRands.toFixed(2)}`,
    })
  } catch (error) {
    if (error instanceof WalletBridgeError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      )
    }
    console.error('[consumer/wallet/topup POST] error:', error)
    return NextResponse.json(
      { success: false, error: 'Top-up failed' },
      { status: 500 }
    )
  }
}
