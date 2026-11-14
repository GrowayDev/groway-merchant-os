import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const DEMO_USER_ID = 'demo-consumer-user-001';
const DEMO_WALLET_ID = 'demo-wallet-001';

function serialize(obj: any): any {
  if (typeof obj === 'bigint') return Number(obj);
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) return obj.map(serialize);
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, serialize(v)]));
  }
  return obj;
}

function genId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Ensures the demo consumer user, loyalty account, and wallet all exist.
async function ensureDemoUser() {
  let wallet = await db.consumerWallet.findUnique({
    where: { userId: DEMO_USER_ID },
  });
  if (!wallet) {
    const now = new Date();
    await db.consumerUser.upsert({
      where: { id: DEMO_USER_ID },
      create: {
        id: DEMO_USER_ID,
        phone: '+27821234567',
        email: 'thabo.molefe@example.com',
        firstName: 'Thabo',
        lastName: 'Molefe',
        kycLevel: 2,
        kycStatus: 'verified',
        kycVerifiedAt: now,
        accountStatus: 'active',
        createdAt: now,
        updatedAt: now,
      },
      update: {},
    });
    await db.consumerLoyalty.upsert({
      where: { userId: DEMO_USER_ID },
      create: {
        id: 'demo-loyalty-001',
        userId: DEMO_USER_ID,
        tier: 'silver',
        points: 2450,
        totalEarned: 12500,
        totalRedeemed: 10050,
        pointsToNextTier: 550,
        tierProgress: 0.82,
        createdAt: now,
        updatedAt: now,
      },
      update: {},
    });
    wallet = await db.consumerWallet.create({
      data: {
        id: DEMO_WALLET_ID,
        userId: DEMO_USER_ID,
        balanceCents: BigInt(1245000),
        currency: 'ZAR',
        dailySpendLimit: BigInt(500000),
        monthlySpendLimit: BigInt(50000000),
        totalReceivedCents: BigInt(15000000),
        totalSentCents: BigInt(3550000),
        totalTopupsCents: BigInt(20000000),
        createdAt: now,
        updatedAt: now,
      },
    });
  }
  return wallet;
}

// Aggregate a list of WalletTransactions for the statement period.
function aggregateTransactions(txs: any[]) {
  let totalTopupsCents = BigInt(0);
  let totalWithdrawalsCents = BigInt(0);
  let totalReceivedCents = BigInt(0);
  let totalSentCents = BigInt(0);
  let totalFeesCents = BigInt(0);
  let totalInterestCents = BigInt(0);
  let sumCredits = BigInt(0);
  let sumDebits = BigInt(0);

  const receivedTypes = new Set(['transfer_in', 'pos_refund']);
  const sentTypes = new Set(['transfer_out', 'pos_payment', 'bill_payment', 'voucher_purchase']);

  for (const t of txs) {
    const amt = t.amountCents as bigint;
    const fee = (t.feeCents as bigint) || BigInt(0);
    totalFeesCents += fee;

    if (t.direction === 'credit') {
      sumCredits += amt;
      if (t.transactionType === 'topup') totalTopupsCents += amt;
      if (receivedTypes.has(t.transactionType)) totalReceivedCents += amt;
      if (t.transactionType === 'interest') totalInterestCents += amt;
    } else {
      sumDebits += amt;
      if (t.transactionType === 'withdrawal') totalWithdrawalsCents += amt;
      if (sentTypes.has(t.transactionType)) totalSentCents += amt;
    }
  }

  return {
    totalTopupsCents,
    totalWithdrawalsCents,
    totalReceivedCents,
    totalSentCents,
    totalFeesCents,
    totalInterestCents,
    transactionCount: txs.length,
    sumCredits,
    sumDebits,
  };
}

// Escapes a CSV field (wraps in quotes if it contains comma, quote, or newline).
function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year');
    const monthParam = searchParams.get('month');
    const format = searchParams.get('format');

    const wallet = await ensureDemoUser();

    // ---- LIST MODE: no year/month → return all statements for the demo user ----
    if (!yearParam || !monthParam) {
      const statements = await db.walletStatement.findMany({
        where: { userId: DEMO_USER_ID },
        orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
      });
      return NextResponse.json(serialize({ statements }));
    }

    const year = parseInt(yearParam, 10);
    const month = parseInt(monthParam, 10);
    if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
      return NextResponse.json({ error: 'Invalid year/month' }, { status: 400 });
    }

    // ---- SPECIFIC MODE: look up (or generate) the statement for (year, month) ----
    // periodStart = first day of the month; periodEnd = first day of next month
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 1);

    // Fetch the period's WalletTransactions (ordered asc by createdAt)
    const periodTx = await db.walletTransaction.findMany({
      where: {
        userId: DEMO_USER_ID,
        createdAt: { gte: periodStart, lt: periodEnd },
      },
      orderBy: { createdAt: 'asc' },
    });

    // ---- CSV MODE: build CSV and stream as attachment ----
    if (format === 'csv') {
      const header = [
        'date',
        'transactionType',
        'direction',
        'amountCents',
        'feeCents',
        'balanceAfterCents',
        'description',
        'reference',
        'merchantName',
      ];
      const rows = periodTx.map((t) =>
        [
          t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
          t.transactionType,
          t.direction,
          t.amountCents !== null ? String(t.amountCents) : '',
          t.feeCents !== null ? String(t.feeCents) : '',
          t.balanceAfterCents !== null ? String(t.balanceAfterCents) : '',
          t.description || '',
          t.reference || '',
          t.merchantName || '',
        ]
          .map(csvEscape)
          .join(',')
      );
      const csv = [header.join(','), ...rows].join('\n');
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="wallet-statement-${year}-${String(month).padStart(2, '0')}.csv"`,
        },
      });
    }

    // ---- JSON MODE: return existing statement OR generate a new one ----
    const existing = await db.walletStatement.findUnique({
      where: {
        walletId_periodYear_periodMonth: {
          walletId: wallet.id,
          periodYear: year,
          periodMonth: month,
        },
      },
    });

    if (existing) {
      return NextResponse.json(serialize({ statement: existing, lineItems: periodTx }));
    }

    // Compute opening balance:
    // opening = sum of (credit +amt / debit -amt) for ALL WalletTransactions BEFORE periodStart.
    // If no transactions at all exist for the user, fall back to current balance minus
    // the period's net change (so closing = currentBalance, opening = currentBalance - netChange).
    const beforeTx = await db.walletTransaction.findMany({
      where: {
        userId: DEMO_USER_ID,
        createdAt: { lt: periodStart },
      },
      select: { direction: true, amountCents: true },
    });

    let openingBalanceCents: bigint;
    if (beforeTx.length > 0) {
      openingBalanceCents = BigInt(0);
      for (const t of beforeTx) {
        if (t.direction === 'credit') openingBalanceCents += t.amountCents as bigint;
        else openingBalanceCents -= t.amountCents as bigint;
      }
    } else {
      // No prior transactions — derive opening from current balance and the period's net change.
      const agg = aggregateTransactions(periodTx);
      const netChange = agg.sumCredits - agg.sumDebits;
      openingBalanceCents = (wallet.balanceCents as bigint) - netChange;
    }

    // Aggregate the period's transactions
    const agg = aggregateTransactions(periodTx);
    const closingBalanceCents = openingBalanceCents + agg.sumCredits - agg.sumDebits;
    const now = new Date();

    const statement = await db.walletStatement.create({
      data: {
        id: genId('stmt'),
        walletId: wallet.id,
        userId: DEMO_USER_ID,
        periodYear: year,
        periodMonth: month,
        openingBalanceCents,
        closingBalanceCents,
        totalTopupsCents: agg.totalTopupsCents,
        totalWithdrawalsCents: agg.totalWithdrawalsCents,
        totalReceivedCents: agg.totalReceivedCents,
        totalSentCents: agg.totalSentCents,
        totalFeesCents: agg.totalFeesCents,
        totalInterestCents: agg.totalInterestCents,
        transactionCount: agg.transactionCount,
        format: 'json',
        status: 'generated',
        generatedAt: now,
        createdAt: now,
      },
    });

    return NextResponse.json(serialize({ statement, lineItems: periodTx }));
  } catch (error) {
    console.error('Error in statements route:', error);
    return NextResponse.json({ error: 'Failed to fetch statement' }, { status: 500 });
  }
}
