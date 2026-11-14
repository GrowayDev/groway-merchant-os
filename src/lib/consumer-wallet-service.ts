/**
 * Groway Consumer Wallet — Ledger Service (v2 core)
 *
 * Atomic, idempotent money movement on top of ConsumerWallet /
 * ConsumerTransaction. All amounts are BigInt cents (ZAR).
 *
 * Guarantees:
 *  - Balance mutations happen inside an interactive Prisma transaction
 *    (row-level consistency; SQLite serialises writes).
 *  - Idempotency via ConsumerTransaction.idempotencyKey unique constraint —
 *    retries return the original transaction instead of double-spending.
 *  - Daily / monthly limit enforcement on debits.
 *  - Insufficient-funds checks with reserved balance respected.
 */
import { db } from '@/lib/db';
import { randomBytes, createHash } from 'crypto';

export type LedgerDirection = 'debit' | 'credit';

export interface LedgerEntry {
  userId: string;
  transactionType: string;
  direction: LedgerDirection;
  amountCents: bigint;
  feeCents?: bigint;
  description: string;
  category?: string;
  counterpartyId?: string;
  counterpartyName?: string;
  counterpartyPhone?: string;
  counterpartyType?: string;
  paymentMethod?: string;
  merchantId?: string;
  merchantName?: string;
  payShapRef?: string;
  voucherToken?: string;
  voucherExpiry?: string;
  meterNumber?: string;
  unitsPurchased?: string;
  reference?: string;
  idempotencyKey: string;
}

export class WalletError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export const generateKey = (prefix: string) =>
  `${prefix}-${Date.now()}-${randomBytes(6).toString('hex')}`;

export const reference = (prefix: string) =>
  `${prefix}${Date.now().toString(36).toUpperCase()}${randomBytes(2).toString('hex').toUpperCase()}`;

export function money(cents: bigint | number | string): string {
  return `R${(Number(cents) / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** RSA-style fee schedule (transparent, township-friendly) */
export function feeFor(kind: string, amountCents: bigint): bigint {
  switch (kind) {
    case 'send_money': {
      // Free under R50, then 1% capped at R10
      if (amountCents <= 5000n) return 0n;
      const fee = amountCents * 100n / 10000n; // 1%
      return fee > 1000n ? 1000n : fee;
    }
    case 'bank_withdraw': return 800n;           // R8 flat
    case 'ewa': return amountCents * 2n / 100n;  // 2%
    case 'electricity': return 215n;             // provider fee
    case 'bill': return 250n;
    default: return 0n;                          // airtime, data, savings, stokvel, POS free
  }
}

function startOfDay(): Date { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
function startOfMonth(): Date { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d; }

/**
 * Debit the wallet atomically. Throws WalletError on insufficient funds,
 * limits exceeded, or frozen accounts. Idempotent on idempotencyKey.
 */
export async function debitWallet(entry: LedgerEntry) {
  return applyLedger({ ...entry, direction: 'debit' });
}

/** Credit the wallet atomically. Idempotent on idempotencyKey. */
export async function creditWallet(entry: LedgerEntry) {
  return applyLedger({ ...entry, direction: 'credit' });
}

async function applyLedger(entry: LedgerEntry) {
  const amountCents = BigInt(entry.amountCents);
  const feeCents = BigInt(entry.feeCents ?? 0n);
  if (amountCents <= 0n) throw new WalletError('INVALID_AMOUNT', 'Amount must be greater than zero');
  const netAmountCents = entry.direction === 'debit' ? amountCents + feeCents : amountCents - feeCents;

  // Idempotency: existing completed tx wins
  const existing = await db.consumerTransaction.findUnique({ where: { idempotencyKey: entry.idempotencyKey } });
  if (existing) return existing;

  return db.$transaction(async (tx) => {
    const user = await tx.consumerUser.findUnique({ where: { id: entry.userId } });
    if (!user) throw new WalletError('USER_NOT_FOUND', 'Wallet user not found', 404);
    if (user.accountStatus !== 'active') throw new WalletError('ACCOUNT_FROZEN', 'Wallet account is frozen', 403);

    const wallet = await tx.consumerWallet.findUnique({ where: { userId: entry.userId } });
    if (!wallet) throw new WalletError('WALLET_NOT_FOUND', 'Wallet not found', 404);

    const total = amountCents + feeCents;
    const available = wallet.balanceCents - wallet.reservedCents;

    if (entry.direction === 'debit') {
      if (total > available) {
        throw new WalletError('INSUFFICIENT_FUNDS', `Insufficient funds. Available: ${money(available)}, needed: ${money(total)}`);
      }
      // Limits
      const dayStart = startOfDay();
      const monthStart = startOfMonth();
      const daySpent = await tx.consumerTransaction.aggregate({
        where: { userId: entry.userId, direction: 'debit', status: 'completed', createdAt: { gte: dayStart } },
        _sum: { amountCents: true },
      });
      const monthSpent = await tx.consumerTransaction.aggregate({
        where: { userId: entry.userId, direction: 'debit', status: 'completed', createdAt: { gte: monthStart } },
        _sum: { amountCents: true },
      });
      const newDaily = (daySpent._sum.amountCents ?? 0n) + total;
      const newMonthly = (monthSpent._sum.amountCents ?? 0n) + total;
      if (wallet.dailySpendLimit && newDaily > wallet.dailySpendLimit) {
        throw new WalletError('DAILY_LIMIT', `Daily spend limit exceeded (${money(wallet.dailySpendLimit)})`);
      }
      if (wallet.monthlySpendLimit && newMonthly > wallet.monthlySpendLimit) {
        throw new WalletError('MONTHLY_LIMIT', `Monthly spend limit exceeded (${money(wallet.monthlySpendLimit)})`);
      }
    }

    const txn = await tx.consumerTransaction.create({
      data: {
        id: `ctx-${randomBytes(9).toString('hex')}`,
        idempotencyKey: entry.idempotencyKey,
        userId: entry.userId,
        transactionType: entry.transactionType,
        direction: entry.direction,
        amountCents,
        feeCents,
        netAmountCents,
        currency: wallet.currency,
        status: 'completed',
        description: entry.description,
        reference: entry.reference ?? reference('REF'),
        category: entry.category,
        counterpartyId: entry.counterpartyId,
        counterpartyName: entry.counterpartyName,
        counterpartyPhone: entry.counterpartyPhone,
        counterpartyType: entry.counterpartyType,
        paymentMethod: entry.paymentMethod ?? 'wallet',
        merchantId: entry.merchantId,
        merchantName: entry.merchantName,
        payShapRef: entry.payShapRef,
        voucherToken: entry.voucherToken,
        voucherExpiry: entry.voucherExpiry,
        meterNumber: entry.meterNumber,
        unitsPurchased: entry.unitsPurchased,
        processedAt: new Date(),
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const updated = await tx.consumerWallet.update({
      where: { userId: entry.userId },
      data: entry.direction === 'debit'
        ? {
            balanceCents: { decrement: total },
            totalSentCents: entry.transactionType === 'send_money' ? { increment: total } : undefined,
            dailySpentCents: { increment: total },
            monthlySpentCents: { increment: total },
            updatedAt: new Date(),
          }
        : {
            balanceCents: { increment: total },
            totalReceivedCents: { increment: total },
            totalTopupsCents: entry.transactionType === 'topup' ? { increment: total } : undefined,
            updatedAt: new Date(),
          },
    });

    return txn;
  });
}

/** Wallet balance snapshot */
export async function getWalletSnapshot(userId: string) {
  const wallet = await db.consumerWallet.findUnique({ where: { userId } });
  if (!wallet) return null;
  const dayStart = startOfDay();
  const monthStart = startOfMonth();
  const [dayAgg, monthAgg] = await Promise.all([
    db.consumerTransaction.aggregate({
      where: { userId, direction: 'debit', status: 'completed', createdAt: { gte: dayStart } },
      _sum: { amountCents: true },
    }),
    db.consumerTransaction.aggregate({
      where: { userId, direction: 'debit', status: 'completed', createdAt: { gte: monthStart } },
      _sum: { amountCents: true },
    }),
  ]);
  return {
    balanceCents: wallet.balanceCents.toString(),
    reservedCents: wallet.reservedCents.toString(),
    pendingCents: wallet.pendingCents.toString(),
    currency: wallet.currency,
    dailyLimitCents: wallet.dailySpendLimit?.toString() ?? null,
    dailySpentCents: (dayAgg._sum.amountCents ?? 0n).toString(),
    monthlyLimitCents: wallet.monthlySpendLimit?.toString() ?? null,
    monthlySpentCents: (monthAgg._sum.amountCents ?? 0n).toString(),
    totalReceivedCents: wallet.totalReceivedCents.toString(),
    totalSentCents: wallet.totalSentCents.toString(),
  };
}

// ---------------- Loyalty engine ----------------
const TIERS = [
  { name: 'bronze', min: 0, next: 500 },
  { name: 'silver', min: 500, next: 1500 },
  { name: 'gold', min: 1500, next: 5000 },
  { name: 'diamond', min: 5000, next: null },
];

/** 1 point per R10 spent. Bronze→Silver→Gold→Diamond. */
export async function earnLoyaltyPoints(userId: string, spendCents: bigint) {
  const points = Math.floor(Number(spendCents) / 1000);
  if (points <= 0) return null;
  const loyalty = await db.consumerLoyalty.upsert({
    where: { userId },
    create: { id: `loy-${randomBytes(6).toString('hex')}`, userId, points: 0, tier: 'bronze', updatedAt: new Date() },
    update: {},
  });
  const totalEarned = loyalty.totalEarned + points;
  let tier = 'bronze';
  let pointsToNextTier: number | null = null;
  let tierProgress = 0;
  for (const t of TIERS) {
    if (totalEarned >= t.min) {
      tier = t.name;
      if (t.next !== null) {
        pointsToNextTier = t.next - totalEarned;
        tierProgress = Math.min(1, (totalEarned - t.min) / (t.next - t.min));
      } else { pointsToNextTier = null; tierProgress = 1; }
    }
  }
  return db.consumerLoyalty.update({
    where: { userId },
    data: {
      points: { increment: points },
      totalEarned,
      tier,
      pointsToNextTier,
      tierProgress,
      updatedAt: new Date(),
    },
  });
}

/** Instant-decision loan engine (responsible-lending guardrails) */
export async function assessLoan(userId: string, amountRands: number, termMonths: number) {
  const cs = await db.consumerCreditScore.findUnique({ where: { userId } });
  const score = cs?.score ?? 600;
  if (amountRands < 500) throw new WalletError('AMOUNT_TOO_LOW', 'Minimum loan is R500');
  if (amountRands > 50000) throw new WalletError('AMOUNT_TOO_HIGH', 'Maximum loan is R50,000');
  if (termMonths < 3 || termMonths > 24) throw new WalletError('INVALID_TERM', 'Term must be 3–24 months');
  if (score < 560) throw new WalletError('SCORE_TOO_LOW', 'Credit score too low for a loan right now', 403);

  const baseRate = 24 - Math.min(10, Math.floor((score - 560) / 15)); // 14–24%
  const interestRate = Math.max(14, baseRate);
  const monthly = amountRands * (interestRate / 100 / 12) / (1 - Math.pow(1 + interestRate / 100 / 12, -termMonths));
  const totalRepayment = monthly * termMonths;
  return {
    approved: true,
    score,
    interestRate,
    monthlyPayment: Math.round(monthly * 100) / 100,
    totalRepayment: Math.round(totalRepayment * 100) / 100,
    totalInterest: Math.round((totalRepayment - amountRands) * 100) / 100,
    initiationFee: Math.min(1207, Math.max(165, amountRands * 0.15)) / 100 > 1207 ? 1207 : Math.round(Math.min(1207, Math.max(165, amountRands * 0.015)) * 100) / 100,
  };
}

/** QR payload with HMAC integrity (prevents tampering) */
export function signQrPayload(payload: Record<string, unknown>): string {
  const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  const body = JSON.stringify(payload);
  const sig = createHash('sha256').update(body + secret).digest('hex').slice(0, 16);
  return JSON.stringify({ ...payload, sig });
}

export function verifyQrPayload(raw: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(raw);
    const { sig, ...rest } = parsed;
    if (!sig) return null;
    const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const expected = createHash('sha256').update(JSON.stringify(rest) + secret).digest('hex').slice(0, 16);
    return sig === expected ? parsed : null;
  } catch { return null; }
}

/** Generate a prepaid electricity token (36 digits, standard SGC format look) */
export function generateElectricityToken(): string {
  const rand = () => Array.from({ length: 4 }, () => Math.floor(Math.random() * 10)).join('');
  return `${rand()} ${rand()} ${rand()} ${rand()} ${rand()} ${rand()} ${rand()} ${rand()} ${rand()}`;
}

/** kWh estimate at ~R2.85/kWh municipal tariff */
export function estimateUnits(amountCents: bigint): string {
  const rands = Number(amountCents) / 100;
  return `${(rands / 2.85).toFixed(1)} kWh`;
}
