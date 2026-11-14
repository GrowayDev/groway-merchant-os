import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getConsumerAuth } from '@/lib/consumer-auth'
import {
  randsToCents,
  centsToRands,
  debitConsumerWallet,
  findMerchant,
  ensureMerchantCustomer,
  awardLoyaltyForSpend,
  WalletBridgeError,
} from '@/lib/wallet-bridge'

// POST /api/consumer/wallet/pay-merchant
// Consumer pays a Groway merchant from their GoPay wallet.
// Body: { merchantId? | merchantPhone?, amount (ZAR rands), note?, reference? }
//
// This is the core bridge action — one call:
//  1. debits the consumer wallet (ConsumerTransaction + consumer activity)
//  2. the activity carries merchantId, so it appears instantly in the
//     Merchant OS Consumer Wallets activity feed (money IN)
//  3. creates a completed POS Transaction for the merchant (Transactions view)
//  4. awards CRM loyalty points (1 pt / R10) and updates customer stats
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
    if (!Number.isFinite(amountRands) || amountRands <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be a positive number (ZAR)' },
        { status: 400 }
      )
    }
    if (amountRands > 50000) {
      return NextResponse.json(
        { success: false, error: 'Maximum wallet payment is R50,000' },
        { status: 400 }
      )
    }

    const merchant = await findMerchant(
      body?.merchantId ? String(body.merchantId) : String(body?.merchantPhone || '')
    )
    if (!merchant) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Merchant not found — pay using the store\'s GoPay merchant code or registered phone number',
          code: 'MERCHANT_NOT_FOUND',
        },
        { status: 404 }
      )
    }

    const merchantName = merchant.tradingName || merchant.name
    const amountCents = randsToCents(amountRands)
    const note = typeof body?.note === 'string' ? body.note.slice(0, 280) : null

    // 1) Debit the wallet (writes ConsumerTransaction + consumer activity
    //    stamped with merchantId -> appears in the merchant feed)
    const result = await debitConsumerWallet({
      consumerUserId: auth.userId,
      amountCents,
      activityType: 'payment',
      title: `Payment to ${merchantName}`,
      description: note ?? 'GoPay wallet payment in-store',
      merchantId: merchant.id,
      merchantName,
      referenceType: 'wallet_payment',
      idempotencyKey: body?.idempotencyKey
        ? String(body.idempotencyKey)
        : undefined,
      transactionType: 'wallet_pay',
      paymentMethod: 'gopay_wallet',
    })

    // 2) Keep the merchant-side link fresh + award CRM loyalty
    const link = await db.consumerWalletLink.findFirst({
      where: { merchantId: merchant.id, consumerUserId: auth.userId, status: 'active' },
    })
    if (link) {
      await db.consumerWalletLink.update({
        where: { id: link.id },
        data: { lastActivityAt: new Date(), updatedAt: new Date() },
      })
    }

    let customer: { id: string; name: string } | null = null
    try {
      const consumer = await db.consumerUser.findUnique({
        where: { id: auth.userId },
        select: { id: true, phone: true, firstName: true, lastName: true },
      })
      if (consumer) {
        customer = await ensureMerchantCustomer(merchant.id, consumer)
        await awardLoyaltyForSpend({
          merchantId: merchant.id,
          merchantCustomerId: customer.id,
          amountRands,
          referenceType: 'wallet_payment',
          referenceId: result.transactionId,
        })
      }
    } catch (crmError) {
      console.error('[pay-merchant] CRM update failed (payment still recorded):', crmError)
    }

    // 3) POS Transaction so the payment shows in the merchant's Transactions view
    let posTransactionId: string | null = null
    try {
      const branch = await db.branch.findFirst({ where: { merchantId: merchant.id } })
      if (branch) {
        const consumer = await db.consumerUser.findUnique({
          where: { id: auth.userId },
          select: { firstName: true, lastName: true, phone: true },
        })
        const posTx = await db.transaction.create({
          data: {
            id: `tx_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
            merchantId: merchant.id,
            branchId: branch.id,
            number: `W-${Date.now().toString(36).toUpperCase()}`,
            type: 'sale',
            status: 'completed',
            customerId: customer?.id ?? null,
            customerName: customer?.name ?? [consumer?.firstName, consumer?.lastName].filter(Boolean).join(' ') ?? 'Wallet customer',
            customerPhone: consumer?.phone ?? null,
            subtotal: amountRands,
            total: amountRands,
            paymentMethod: 'gopay_wallet',
            paymentReference: result.transactionId,
            notes: note ?? 'GoPay consumer wallet payment',
            completedAt: new Date(),
            updatedAt: new Date(),
          },
        })
        posTransactionId = posTx.id
      }
    } catch (posError) {
      console.error('[pay-merchant] POS transaction create failed (payment still recorded):', posError)
    }

    return NextResponse.json({
      success: true,
      payment: {
        transactionId: result.transactionId,
        amount: centsToRands(amountCents),
        newBalance: centsToRands(result.balanceCents),
        merchant: {
          id: merchant.id,
          name: merchantName,
        },
        posTransactionId,
        loyaltyPointsEarned: Math.floor(amountRands / 10),
      },
      message: `R${amountRands.toFixed(2)} paid to ${merchantName}`,
    })
  } catch (error) {
    if (error instanceof WalletBridgeError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      )
    }
    console.error('[consumer/wallet/pay-merchant POST] error:', error)
    return NextResponse.json(
      { success: false, error: 'Wallet payment failed' },
      { status: 500 }
    )
  }
}
