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

// Topup methods — fees per Task 3 spec:
// card 1.5% min 200, eft free, capitec_send free, fnb_pay free,
// paypal 2% min 500, voucher_pin free, cash_deposit flat 500, agent 2% min 300.
const TOPUP_METHODS = [
  { id: 'card', name: 'Card Payment', icon: 'CreditCard', feePercent: 1.5, feeMinCents: 200, processingTime: 'Instant' },
  { id: 'eft', name: 'EFT (Electronic Funds Transfer)', icon: 'Building2', feePercent: 0, feeMinCents: 0, processingTime: '1-2 business days' },
  { id: 'capitec_send', name: 'Capitec Send Cash', icon: 'Smartphone', feePercent: 0, feeMinCents: 0, processingTime: 'Instant' },
  { id: 'fnb_pay', name: 'FNB Pay', icon: 'Landmark', feePercent: 0, feeMinCents: 0, processingTime: 'Instant' },
  { id: 'paypal', name: 'PayPal', icon: 'Globe', feePercent: 2, feeMinCents: 500, processingTime: 'Instant' },
  { id: 'voucher_pin', name: 'Voucher PIN', icon: 'Ticket', feePercent: 0, feeMinCents: 0, processingTime: 'Instant' },
  { id: 'cash_deposit', name: 'Cash Deposit', icon: 'Banknote', feePercent: 0, feeMinCents: 500, processingTime: 'Instant' },
  { id: 'agent', name: 'Agent Topup', icon: 'UserCheck', feePercent: 2, feeMinCents: 300, processingTime: 'Instant' },
];

function calculateFee(method: string, amountCents: number): number {
  const m = TOPUP_METHODS.find((t) => t.id === method);
  if (!m) return 0;
  // Flat-fee methods (e.g. cash_deposit) — feeMinCents with feePercent=0
  if (m.feePercent === 0) return m.feeMinCents;
  // Percent-based with a minimum floor
  const percentFee = Math.round(amountCents * (m.feePercent / 100));
  return Math.max(m.feeMinCents, percentFee);
}

export async function GET() {
  try {
    const recentTopups = await db.walletTopup.findMany({
      where: { userId: DEMO_USER_ID },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    return NextResponse.json(serialize({ methods: TOPUP_METHODS, recentTopups }));
  } catch (error) {
    console.error('Error fetching topup methods:', error);
    return NextResponse.json({ error: 'Failed to fetch topup methods' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { method, amountCents, provider, cardLastFour, bankName, voucherPin, agentId } = body;

    if (!method || !amountCents || amountCents <= 0) {
      return NextResponse.json({ error: 'Method and valid amountCents are required' }, { status: 400 });
    }

    const m = TOPUP_METHODS.find((t) => t.id === method);
    if (!m) {
      return NextResponse.json({ error: 'Invalid topup method' }, { status: 400 });
    }

    const feeCents = calculateFee(method, amountCents);
    const netAmountCents = amountCents - feeCents;
    if (netAmountCents <= 0) {
      return NextResponse.json({ error: 'Amount too small — fee exceeds amount' }, { status: 400 });
    }

    // Ensure the demo wallet exists BEFORE entering the transaction.
    await ensureDemoUser();

    const now = new Date();
    const reference = genId('REF');

    const result = await db.$transaction(async (tx) => {
      // 1. Get wallet (lock via findUnique). Create if missing (defensive).
      let wallet = await tx.consumerWallet.findUnique({ where: { userId: DEMO_USER_ID } });
      if (!wallet) {
        wallet = await tx.consumerWallet.create({
          data: {
            id: DEMO_WALLET_ID,
            userId: DEMO_USER_ID,
            balanceCents: BigInt(0),
            currency: 'ZAR',
            createdAt: now,
            updatedAt: now,
          },
        });
      }
      const balanceBefore = wallet.balanceCents;
      const balanceAfter = balanceBefore + BigInt(netAmountCents);

      // 3. Create WalletTopup (status='completed', with reference + completedAt)
      const topup = await tx.walletTopup.create({
        data: {
          id: genId('topup'),
          walletId: wallet.id,
          userId: DEMO_USER_ID,
          amountCents: BigInt(amountCents),
          feeCents: BigInt(feeCents),
          netAmountCents: BigInt(netAmountCents),
          method,
          provider: provider || null,
          cardLastFour: cardLastFour || null,
          bankName: bankName || null,
          voucherPin: voucherPin || null,
          agentId: agentId || null,
          status: 'completed',
          completedAt: now,
          reference,
          createdAt: now,
          updatedAt: now,
        },
      });

      // 4. Create WalletTransaction (credit, topup, sourceChannel='api')
      const walletTransaction = await tx.walletTransaction.create({
        data: {
          id: genId('wtx'),
          walletId: wallet.id,
          userId: DEMO_USER_ID,
          direction: 'credit',
          transactionType: 'topup',
          amountCents: BigInt(netAmountCents),
          feeCents: BigInt(feeCents),
          balanceBeforeCents: balanceBefore,
          balanceAfterCents: balanceAfter,
          status: 'completed',
          paymentMethod: method,
          sourceChannel: 'api',
          completedAt: now,
          reference,
          description: `Topup via ${method}`,
          processedAt: now,
          createdAt: now,
          updatedAt: now,
        },
      });

      // Link topup -> walletTxId for audit trail
      await tx.walletTopup.update({
        where: { id: topup.id },
        data: { walletTxId: walletTransaction.id, updatedAt: now },
      });

      // 5. Update ConsumerWallet: balance, totalTopupsCents
      const updatedWallet = await tx.consumerWallet.update({
        where: { userId: DEMO_USER_ID },
        data: {
          balanceCents: balanceAfter,
          totalTopupsCents: { increment: BigInt(amountCents) },
          updatedAt: now,
        },
      });

      // 6. Create ConsumerTransaction (backward-compat ledger)
      await tx.consumerTransaction.create({
        data: {
          id: genId('ctx'),
          idempotencyKey: genId('idemp'),
          userId: DEMO_USER_ID,
          transactionType: 'topup',
          direction: 'credit',
          amountCents: BigInt(netAmountCents),
          feeCents: BigInt(feeCents),
          netAmountCents: BigInt(netAmountCents),
          status: 'completed',
          description: `Topup via ${method}`,
          reference,
          category: 'topup',
          paymentMethod: method,
          completedAt: now,
          createdAt: now,
          updatedAt: now,
        },
      });

      return {
        topup,
        walletTransaction,
        wallet: { balanceCents: updatedWallet.balanceCents },
      };
    });

    return NextResponse.json(serialize(result));
  } catch (error) {
    console.error('Error processing topup:', error);
    return NextResponse.json({ error: 'Failed to process topup' }, { status: 500 });
  }
}
