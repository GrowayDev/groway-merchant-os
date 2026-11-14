import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getMerchantIdWithDevFallback } from '@/lib/auth-context'
import {
  normalizePhone,
  randsToCents,
  centsToRands,
  creditConsumerWallet,
  WalletBridgeError,
} from '@/lib/wallet-bridge'

const CREDIT_TYPES = ['cashback', 'reward', 'refund'] as const
type CreditType = (typeof CREDIT_TYPES)[number]

const TYPE_LABELS: Record<CreditType, { title: string; tx: string }> = {
  cashback: { title: 'Cashback received', tx: 'cashback' },
  reward: { title: 'Loyalty reward received', tx: 'reward' },
  refund: { title: 'Refund received', tx: 'refund' },
}

// POST /merchant-os/api/wallet/credit
// Merchant credits a linked consumer wallet (cashback / reward / refund).
// Body: { phone? , linkId?, amount (ZAR rands), type, note?, idempotencyKey? }
export async function POST(request: NextRequest) {
  try {
    const merchantId = await getMerchantIdWithDevFallback(request)
    if (!merchantId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const amountRands = Number(body?.amount)
    const type = (CREDIT_TYPES as readonly string[]).includes(body?.type)
      ? (body.type as CreditType)
      : 'cashback'
    const note = typeof body?.note === 'string' ? body.note.slice(0, 280) : null

    if (!Number.isFinite(amountRands) || amountRands <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be a positive number (ZAR)' },
        { status: 400 }
      )
    }
    if (amountRands > 10000) {
      return NextResponse.json(
        { success: false, error: 'Single wallet credit limited to R10,000' },
        { status: 400 }
      )
    }

    // Resolve the link + consumer
    let link = null
    if (body?.linkId) {
      link = await db.consumerWalletLink.findFirst({
        where: { id: String(body.linkId), merchantId, status: 'active' },
      })
    } else {
      const phone = normalizePhone(body?.phone)
      if (!phone) {
        return NextResponse.json(
          { success: false, error: 'Provide a valid phone or linkId' },
          { status: 400 }
        )
      }
      const consumer = await db.consumerUser.findUnique({ where: { phone } })
      if (!consumer) {
        return NextResponse.json(
          { success: false, error: `No GoPay wallet for ${phone}`, code: 'WALLET_NOT_FOUND' },
          { status: 404 }
        )
      }
      link = await db.consumerWalletLink.findFirst({
        where: { merchantId, consumerUserId: consumer.id, status: 'active' },
      })
    }
    if (!link) {
      return NextResponse.json(
        {
          success: false,
          error: 'Wallet is not linked to your store. Link it first, then credit.',
          code: 'NOT_LINKED',
        },
        { status: 409 }
      )
    }

    const consumer = await db.consumerUser.findUnique({
      where: { id: link.consumerUserId },
      select: { id: true, firstName: true, lastName: true, phone: true },
    })
    if (!consumer) {
      return NextResponse.json(
        { success: false, error: 'Consumer not found' },
        { status: 404 }
      )
    }

    const merchant = await db.merchant.findUnique({
      where: { id: merchantId },
      select: { name: true, tradingName: true },
    })
    const merchantName = merchant?.tradingName || merchant?.name || 'Merchant'
    const consumerName =
      [consumer.firstName, consumer.lastName].filter(Boolean).join(' ') ||
      consumer.phone

    const amountCents = randsToCents(amountRands)
    const label = TYPE_LABELS[type]

    const result = await creditConsumerWallet({
      consumerUserId: consumer.id,
      amountCents,
      activityType: type,
      title: label.title,
      description: note ? `${merchantName}: ${note}` : `From ${merchantName}`,
      merchantId,
      merchantName,
      referenceType: 'merchant_credit',
      idempotencyKey: body?.idempotencyKey
        ? String(body.idempotencyKey)
        : undefined,
      paymentMethod: 'merchant_credit',
    })

    await db.consumerWalletLink.update({
      where: { id: link.id },
      data: { lastActivityAt: new Date(), updatedAt: new Date() },
    })

    // NOTE: no mirror activity row — the consumer-side activity already
    // carries merchantId, so the merchant feed shows it once with a
    // store-perspective title computed by /wallet/activities.

    return NextResponse.json({
      success: true,
      credit: {
        transactionId: result.transactionId,
        amount: centsToRands(amountCents),
        newBalance: centsToRands(result.balanceCents),
        consumerName,
        consumerPhone: consumer.phone,
        type,
      },
      message: `R${amountRands.toFixed(2)} ${type} credited to ${consumerName}'s wallet`,
    })
  } catch (error) {
    if (error instanceof WalletBridgeError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      )
    }
    console.error('[wallet/credit POST] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to credit wallet' },
      { status: 500 }
    )
  }
}
