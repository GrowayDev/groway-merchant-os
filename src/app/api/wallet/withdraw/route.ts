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
// Returns the wallet (so the route handler can read/mutate balance).
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

// Withdrawal methods — fees + min/max per Task 3 spec.
const WITHDRAW_METHODS = [
  {
    id: 'bank_transfer',
    name: 'Bank Transfer (EFT)',
    feeCents: 1000,
    processingTime: '1-2 business days',
    minAmountCents: 1000,
    maxAmountCents: 50000000,
  },
  {
    id: 'capitec_send',
    name: 'Capitec Send Cash',
    feeCents: 500,
    processingTime: 'Instant',
    minAmountCents: 500,
    maxAmountCents: 5000000,
  },
  {
    id: 'fnb_pay',
    name: 'FNB Pay',
    feeCents: 500,
    processingTime: 'Instant',
    minAmountCents: 500,
    maxAmountCents: 5000000,
  },
  {
    id: 'atm',
    name: 'ATM Withdrawal',
    feeCents: 1200,
    processingTime: 'Instant',
    minAmountCents: 200,
    maxAmountCents: 300000,
  },
  {
    id: 'agent',
    name: 'Agent Cash Out',
    feeCents: 0, // calculated dynamically (2% min 500)
    feePercent: 2,
    feeMinCents: 500,
    processingTime: 'Instant',
    minAmountCents: 500,
    maxAmountCents: 5000000,
  },
  {
    id: 'voucher_issue',
    name: 'Voucher Issue (Send to unbanked)',
    feeCents: 0,
    processingTime: 'Instant',
    minAmountCents: 500,
    maxAmountCents: 5000000,
  },
];

// Returns the fee for a given withdrawal method + amount.
function calculateFee(methodId: string, amountCents: number): number {
  const m = WITHDRAW_METHODS.find((w) => w.id === methodId);
  if (!m) return 0;
  // Agent uses percent-based fee (2% min 500); everything else uses flat feeCents.
  if ((m as any).feePercent && (m as any).feePercent > 0) {
    const pct = Math.round(amountCents * ((m as any).feePercent / 100));
    return Math.max((m as any).feeMinCents, pct);
  }
  return m.feeCents;
}

export async function GET() {
  try {
    const recentWithdrawals = await db.walletWithdrawal.findMany({
      where: { userId: DEMO_USER_ID },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    return NextResponse.json(serialize({ methods: WITHDRAW_METHODS, recentWithdrawals }));
  } catch (error) {
    console.error('Error fetching withdrawal methods:', error);
    return NextResponse.json({ error: 'Failed to fetch withdrawal methods' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      method,
      amountCents,
      bankName,
      accountNumber,
      accountType,
      accountHolder,
      branchCode,
      agentId,
    } = body;

    if (!method || !amountCents || amountCents <= 0) {
      return NextResponse.json({ error: 'method and valid amountCents are required' }, { status: 400 });
    }

    const m = WITHDRAW_METHODS.find((w) => w.id === method);
    if (!m) {
      return NextResponse.json({ error: 'Invalid withdrawal method' }, { status: 400 });
    }
    if (amountCents < m.minAmountCents || amountCents > m.maxAmountCents) {
      return NextResponse.json(
        {
          error: `Amount must be between R${m.minAmountCents / 100} and R${m.maxAmountCents / 100}`,
        },
        { status: 400 }
      );
    }

    const feeCents = calculateFee(method, amountCents);
    const totalDebit = amountCents + feeCents;

    // Ensure demo wallet exists before the transaction.
    await ensureDemoUser();

    const now = new Date();
    const reference = genId('REF');

    const result = await db.$transaction(async (tx) => {
      // 1. Get wallet (lock via findUnique).
      const wallet = await tx.consumerWallet.findUnique({ where: { userId: DEMO_USER_ID } });
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // 1b. Insufficient funds check
      if (wallet.balanceCents < BigInt(totalDebit)) {
        const available = Number(wallet.balanceCents);
        const err = new Error(
          `Insufficient wallet balance. Available: R${(available / 100).toFixed(2)}, required: R${(totalDebit / 100).toFixed(2)} (incl. fee)`
        ) as Error & { statusCode?: number; availableBalanceCents?: number; requiredCents?: number };
        err.statusCode = 400;
        err.availableBalanceCents = available;
        err.requiredCents = totalDebit;
        throw err;
      }

      // 2. Daily spend limit check (only if limit configured)
      if (wallet.dailySpendLimit && wallet.dailySpentCents + BigInt(amountCents) > wallet.dailySpendLimit) {
        const err = new Error(
          `Daily spend limit exceeded. Daily limit: R${Number(wallet.dailySpendLimit) / 100}, already spent today: R${Number(wallet.dailySpentCents) / 100}`
        ) as Error & { statusCode?: number };
        err.statusCode = 400;
        throw err;
      }

      // 3. Compute balances
      const balanceBefore = wallet.balanceCents;
      const balanceAfter = balanceBefore - BigInt(totalDebit);

      // 4. Create WalletWithdrawal
      const withdrawal = await tx.walletWithdrawal.create({
        data: {
          id: genId('wd'),
          walletId: wallet.id,
          userId: DEMO_USER_ID,
          amountCents: BigInt(amountCents),
          feeCents: BigInt(feeCents),
          netAmountCents: BigInt(amountCents),
          method,
          status: 'completed',
          completedAt: now,
          reference,
          bankName: bankName || null,
          accountNumber: accountNumber || null,
          accountType: accountType || null,
          accountHolder: accountHolder || null,
          branchCode: branchCode || null,
          agentId: agentId || null,
          createdAt: now,
          updatedAt: now,
        },
      });

      // 5. Create WalletTransaction (debit, withdrawal)
      const walletTransaction = await tx.walletTransaction.create({
        data: {
          id: genId('wtx'),
          walletId: wallet.id,
          userId: DEMO_USER_ID,
          direction: 'debit',
          transactionType: 'withdrawal',
          amountCents: BigInt(amountCents),
          feeCents: BigInt(feeCents),
          balanceBeforeCents: balanceBefore,
          balanceAfterCents: balanceAfter,
          status: 'completed',
          paymentMethod: method,
          sourceChannel: 'api',
          completedAt: now,
          reference,
          description: `Withdrawal via ${method}`,
          processedAt: now,
          createdAt: now,
          updatedAt: now,
        },
      });

      // Link withdrawal -> walletTxId
      await tx.walletWithdrawal.update({
        where: { id: withdrawal.id },
        data: { walletTxId: walletTransaction.id, updatedAt: now },
      });

      // 6. Update ConsumerWallet
      const updatedWallet = await tx.consumerWallet.update({
        where: { userId: DEMO_USER_ID },
        data: {
          balanceCents: balanceAfter,
          totalWithdrawalsCents: { increment: BigInt(amountCents) },
          dailySpentCents: { increment: BigInt(amountCents) },
          updatedAt: now,
        },
      });

      // 7. Create ConsumerTransaction
      await tx.consumerTransaction.create({
        data: {
          id: genId('ctx'),
          idempotencyKey: genId('idemp'),
          userId: DEMO_USER_ID,
          transactionType: 'withdrawal',
          direction: 'debit',
          amountCents: BigInt(amountCents),
          feeCents: BigInt(feeCents),
          netAmountCents: BigInt(amountCents),
          status: 'completed',
          description: `Withdrawal via ${method}`,
          reference,
          category: 'withdrawal',
          paymentMethod: method,
          completedAt: now,
          createdAt: now,
          updatedAt: now,
        },
      });

      return {
        withdrawal,
        walletTransaction,
        wallet: { balanceCents: updatedWallet.balanceCents },
      };
    });

    return NextResponse.json(serialize(result));
  } catch (error: any) {
    console.error('Error processing withdrawal:', error);
    // Distinguish insufficient funds / daily limit (400) from other errors (500)
    const msg: string = error?.message || '';
    if (msg.includes('Insufficient') || msg.includes('daily limit') || msg.includes('Daily spend')) {
      return NextResponse.json(
        {
          error: msg,
          availableBalanceCents: error?.availableBalanceCents,
          requiredCents: error?.requiredCents,
        },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Failed to process withdrawal' }, { status: 500 });
  }
}
