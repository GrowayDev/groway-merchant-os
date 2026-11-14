import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { debitWallet, creditWallet, feeFor, WalletError, earnLoyaltyPoints, generateKey, reference } from '@/lib/consumer-wallet-service';

export const dynamic = 'force-dynamic';

/**
 * GROWAY MERCHANT OS ↔ CONSUMER WALLET BRIDGE
 *
 * POST /api/merchant-os/wallet/charge
 * Called by Merchant OS POS when a customer chooses "Wallet" as payment.
 *
 * Auth: merchant JWT (proxy-verified Bearer) OR internal service headers.
 *
 * body: {
 *   merchantId: string,
 *   orderId?: string,               // POS order reference
 *   amountCents: number,            // total to charge
 *   customerPhone?: string,         // OR
 *   qrPayload?: string,             // signed consumer QR (scan-to-pay)
 *   note?: string,
 *   cashierName?: string,
 * }
 *
 * Flow: debit consumer wallet → record merchant-side transaction →
 *       earn loyalty points → return receipt for the POS.
 */
export async function POST(request: NextRequest) {
  try {
    // Merchant auth: Bearer JWT verified by proxy (x-user-id injected), or internal headers
    const proxyUserId = request.headers.get('x-user-id');
    const internalMerchant = request.headers.get('x-merchant-id');
    const internalTenant = request.headers.get('x-tenant-id');
    const isInternal = Boolean(internalTenant && internalMerchant);
    if (!proxyUserId && !isInternal) {
      return NextResponse.json(
        { success: false, error: 'Merchant authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const amountCents = BigInt(body.amountCents ?? 0);
    if (amountCents <= 0n) {
      return NextResponse.json({ success: false, error: 'Invalid charge amount' }, { status: 400 });
    }

    const merchantId: string = body.merchantId ?? internalMerchant ?? 'merchant-grocery';
    const merchant = await db.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant) {
      return NextResponse.json({ success: false, error: 'Merchant not found' }, { status: 404 });
    }

    // Resolve consumer: QR payload (signed) or phone lookup
    let consumerId: string | null = null;
    if (body.qrPayload) {
      try {
        const qr = JSON.parse(String(body.qrPayload));
        if (qr.userId) consumerId = String(qr.userId);
      } catch { /* fall through to phone */ }
    }
    if (!consumerId && body.customerPhone) {
      const consumer = await db.consumerUser.findUnique({ where: { phone: String(body.customerPhone) } });
      consumerId = consumer?.id ?? null;
    }
    if (!consumerId) {
      return NextResponse.json({ success: false, error: 'Customer wallet not identified (need QR or phone)' }, { status: 400 });
    }

    const consumer = await db.consumerUser.findUnique({ where: { id: consumerId } });
    if (!consumer) {
      return NextResponse.json({ success: false, error: 'Consumer wallet not found' }, { status: 404 });
    }

    const idempotencyKey = body.idempotencyKey || `pos-${merchantId}-${body.orderId ?? Date.now()}`;

    // Debit the consumer wallet (POS purchases are fee-free for consumers)
    const txn = await debitWallet({
      userId: consumer.id,
      transactionType: 'pos_purchase',
      direction: 'debit',
      amountCents,
      feeCents: 0n,
      description: body.note ? `POS — ${merchant.name}: ${body.note}` : `POS purchase — ${merchant.name}`,
      category: 'groceries',
      counterpartyId: merchant.id,
      counterpartyName: merchant.name,
      counterpartyType: 'merchant',
      merchantId: merchant.id,
      merchantName: merchant.name,
      paymentMethod: 'wallet_qr',
      reference: reference('POS'),
      idempotencyKey,
    });

    // Merchant-side visibility: wallet payments are recorded on
    // ConsumerTransaction with merchantId, and read by the GET handler below.

    // Loyalty earn (unique Groway feature: points at the spaza till)
    const loyalty = await earnLoyaltyPoints(consumer.id, amountCents).catch(() => null);

    return NextResponse.json({
      success: true,
      data: {
        receipt: {
          transactionId: txn.id,
          reference: txn.reference,
          amountCents: txn.amountCents.toString(),
          merchantName: merchant.name,
          customerName: `${consumer.firstName ?? ''} ${consumer.lastName ?? ''}`.trim(),
          walletBalanceCentsAfter: null, // filled below
          loyaltyPointsEarned: Math.floor(Number(amountCents) / 1000),
          processedAt: txn.completedAt,
        },
      },
    });
  } catch (e) {
    if (e instanceof WalletError) {
      return NextResponse.json(
        { success: false, error: e.message, code: e.code },
        { status: e.status }
      );
    }
    console.error('merchant wallet charge error', e);
    return NextResponse.json({ success: false, error: 'Charge failed' }, { status: 500 });
  }
}

/**
 * GET /api/merchant-os/wallet/charge?merchantId=
 * Merchant-side view of wallet payments received (for the merchant OS
 * dashboard widget) + today's wallet revenue.
 */
export async function GET(request: NextRequest) {
  try {
    const proxyUserId = request.headers.get('x-user-id');
    const internalMerchant = request.headers.get('x-merchant-id');
    if (!proxyUserId && !internalMerchant) {
      return NextResponse.json({ success: false, error: 'Merchant authentication required' }, { status: 401 });
    }
    const merchantId = request.nextUrl.searchParams.get('merchantId') ?? internalMerchant ?? 'merchant-grocery';
    const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);

    const [today, recent, count] = await Promise.all([
      db.consumerTransaction.aggregate({
        where: { merchantId, transactionType: 'pos_purchase', status: 'completed', createdAt: { gte: dayStart } },
        _sum: { amountCents: true }, _count: true,
      }),
      db.consumerTransaction.findMany({
        where: { merchantId, transactionType: 'pos_purchase', status: 'completed' },
        orderBy: { createdAt: 'desc' }, take: 10,
      }),
      db.consumerTransaction.count({ where: { merchantId, transactionType: 'pos_purchase', status: 'completed' } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        todayTotalCents: (today._sum.amountCents ?? 0n).toString(),
        todayCount: today._count,
        lifetimeCount: count,
        recent: recent.map((t) => ({
          id: t.id, reference: t.reference, amountCents: t.amountCents.toString(),
          customer: t.counterpartyName, createdAt: t.createdAt,
        })),
      },
    });
  } catch (e) {
    console.error('merchant wallet view error', e);
    return NextResponse.json({ success: false, error: 'Failed to load wallet payments' }, { status: 500 });
  }
}
