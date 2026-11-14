import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getConsumerAuth, isAuthError, ok, serverError } from '@/lib/consumer-auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/consumer/v2/transactions
 * ?category=&direction=&limit=&cursor=&days=
 * Cursor-paginated transaction history with filters.
 */
export async function GET(request: NextRequest) {
  const auth = await getConsumerAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const sp = request.nextUrl.searchParams;
    const limit = Math.min(50, Math.max(1, Number(sp.get('limit') ?? 25)));
    const cursor = sp.get('cursor');
    const category = sp.get('category');
    const direction = sp.get('direction');
    const days = sp.get('days');

    const where: Record<string, unknown> = { userId: auth.userId };
    if (category) where.category = category;
    if (direction) where.direction = direction;
    if (days) where.createdAt = { gte: new Date(Date.now() - Number(days) * 86400000) };

    const txns = await db.consumerTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = txns.length > limit;
    const page = hasMore ? txns.slice(0, limit) : txns;

    return ok({
      transactions: page.map((t) => ({
        id: t.id,
        type: t.transactionType,
        direction: t.direction,
        amountCents: t.amountCents.toString(),
        feeCents: t.feeCents.toString(),
        status: t.status,
        description: t.description,
        category: t.category,
        counterpartyName: t.counterpartyName,
        counterpartyPhone: t.counterpartyPhone,
        merchantName: t.merchantName,
        paymentMethod: t.paymentMethod,
        reference: t.reference,
        voucherToken: t.voucherToken,
        meterNumber: t.meterNumber,
        unitsPurchased: t.unitsPurchased,
        createdAt: t.createdAt,
      })),
      nextCursor: hasMore ? page[page.length - 1].id : null,
      hasMore,
    });
  } catch (e) {
    console.error('transactions error', e);
    return serverError();
  }
}
