import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getConsumerAuth, isAuthError, ok, serverError } from '@/lib/consumer-auth';
import { getWalletSnapshot, earnLoyaltyPoints } from '@/lib/consumer-wallet-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/consumer/v2/overview
 * One call powering the Home tab: profile, wallet, loyalty, recent txs,
 * spending breakdown (30d), upcoming payments, quick stats.
 */
export async function GET(request: NextRequest) {
  const auth = await getConsumerAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const user = await db.consumerUser.findUnique({
      where: { id: auth.userId },
      include: { ConsumerWallet: true, ConsumerLoyalty: true, ConsumerBNPL: true },
    });
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

    const wallet = await getWalletSnapshot(user.id);

    const [recent, monthTxs, pockets, stokvels, bnplPlans, loans, sassa, insurance, cards, ewa] = await Promise.all([
      db.consumerTransaction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
      db.consumerTransaction.findMany({
        where: { userId: user.id, createdAt: { gte: new Date(Date.now() - 30 * 86400000) } },
        select: { amountCents: true, direction: true, category: true },
      }),
      db.savingsPocket.findMany({ where: { userId: user.id, status: 'active' } }),
      db.stokvelMember.findMany({ where: { userId: user.id, status: 'active' }, include: { StokvelGroup: true } }),
      db.consumerBNPLPlan.findMany({ where: { userId: user.ConsumerBNPL?.id ?? user.id, status: 'active' } }),
      db.consumerLoan.findMany({ where: { userId: user.id, status: 'active' } }),
      db.consumerSASSAGrant.findMany({ where: { ConsumerSASSA: { userId: user.id } } }),
      db.consumerInsurance.findMany({ where: { userId: user.id, status: 'active' } }),
      db.consumerCard.findMany({ where: { userId: user.id, status: 'active' } }),
      db.consumerEWA.findUnique({ where: { userId: user.id } }),
    ]);

    // Spending breakdown (30d debits by category)
    const byCategory: Record<string, number> = {};
    let monthIncome = 0;
    let monthSpend = 0;
    for (const t of monthTxs) {
      const amt = Number(t.amountCents);
      if (t.direction === 'debit') {
        monthSpend += amt;
        const cat = t.category || 'other';
        byCategory[cat] = (byCategory[cat] || 0) + amt;
      } else monthIncome += amt;
    }
    const topCategories = Object.entries(byCategory)
      .map(([category, cents]) => ({ category, cents }))
      .sort((a, b) => b.cents - a.cents)
      .slice(0, 5);

    // Upcoming payments (next 14 days)
    const upcoming: { type: string; label: string; amountCents: string; dueDate: string }[] = [];
    for (const p of bnplPlans) {
      if (p.nextDueDate && new Date(p.nextDueDate) <= new Date(Date.now() + 14 * 86400000)) {
        upcoming.push({ type: 'bnpl', label: `BNPL instalment — ${p.merchant}`, amountCents: String(p.instalmentAmount * 100), dueDate: p.nextDueDate.toISOString() });
      }
    }
    for (const g of sassa) {
      if (g.nextPayment) {
        upcoming.push({ type: 'sassa', label: `SASSA ${g.grantName}`, amountCents: String(g.totalAmount * 100), dueDate: g.nextPayment.toISOString() });
      }
    }
    if (ewa?.nextPayDay) {
      upcoming.push({ type: 'salary', label: `Salary — ${ewa.employer ?? 'employer'}`, amountCents: String(Math.round(ewa.monthlySalary * 100)), dueDate: ewa.nextPayDay.toISOString() });
    }
    upcoming.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    return ok({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        initials: `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`,
        phone: user.phone,
        kycLevel: user.kycLevel,
        kycStatus: user.kycStatus,
      },
      wallet,
      loyalty: {
        tier: user.ConsumerLoyalty?.tier ?? 'bronze',
        points: user.ConsumerLoyalty?.points ?? 0,
        pointsToNextTier: user.ConsumerLoyalty?.pointsToNextTier ?? null,
        tierProgress: user.ConsumerLoyalty?.tierProgress ?? 0,
      },
      insights: {
        monthIncomeCents: monthIncome,
        monthSpendCents: monthSpend,
        topCategories,
      },
      recent: recent.map((t) => ({
        id: t.id,
        type: t.transactionType,
        direction: t.direction,
        amountCents: t.amountCents.toString(),
        feeCents: t.feeCents.toString(),
        status: t.status,
        description: t.description,
        category: t.category,
        counterpartyName: t.counterpartyName,
        merchantName: t.merchantName,
        paymentMethod: t.paymentMethod,
        voucherToken: t.voucherToken,
        createdAt: t.createdAt,
      })),
      stats: {
        savingsTotalCents: pockets.reduce((s, p) => s + p.currentCents, 0n).toString(),
        pocketsCount: pockets.length,
        stokvelsCount: stokvels.length,
        activeLoans: loans.length,
        bnplPlans: bnplPlans.length,
        insurancePolicies: insurance.length,
        activeCards: cards.length,
        ewaAvailable: ewa?.availableAdvance ?? 0,
      },
      upcoming,
    });
  } catch (e) {
    console.error('overview error', e);
    return serverError();
  }
}

/** POST /api/consumer/v2/overview — refresh wallet snapshot only */
export async function POST(request: NextRequest) {
  const auth = await getConsumerAuth(request);
  if (isAuthError(auth)) return auth;
  try {
    const wallet = await getWalletSnapshot(auth.userId);
    return ok({ wallet });
  } catch {
    return serverError();
  }
}
