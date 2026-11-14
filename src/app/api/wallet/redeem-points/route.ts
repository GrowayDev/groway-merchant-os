import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const DEMO_USER_ID = 'demo-consumer-user-001';
const DEMO_WALLET_ID = 'demo-wallet-001';

function serialize(obj: unknown): unknown {
  if (typeof obj === 'bigint') return Number(obj);
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) return obj.map(serialize);
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(Object.entries(obj as Record<string, unknown>).map(([k, v]) => [k, serialize(v)]));
  }
  return obj;
}

async function ensureDemoWallet() {
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

export async function GET() {
  try {
    const loyalty = await db.consumerLoyalty.findUnique({
      where: { userId: DEMO_USER_ID },
    });
    if (!loyalty) {
      return NextResponse.json({
        points: 0,
        cashValueCents: 0,
        minRedemptionPoints: 1000,
        conversionRate: 1,
      });
    }
    return NextResponse.json({
      points: loyalty.points,
      cashValueCents: loyalty.points,
      minRedemptionPoints: 1000,
      conversionRate: 1,
    });
  } catch (error) {
    console.error('Error fetching redemption options:', error);
    return NextResponse.json({ error: 'Failed to fetch redemption options' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pointsToRedeem } = body;

    if (!pointsToRedeem || pointsToRedeem < 1000) {
      return NextResponse.json({ error: 'Minimum redemption is 1000 points (R10)' }, { status: 400 });
    }

    const wallet = await ensureDemoWallet();
    const loyalty = await db.consumerLoyalty.findUnique({
      where: { userId: DEMO_USER_ID },
    });
    if (!loyalty) {
      return NextResponse.json({ error: 'No loyalty account found' }, { status: 400 });
    }
    if (loyalty.points < pointsToRedeem) {
      return NextResponse.json({
        error: 'Insufficient points',
        availablePoints: loyalty.points,
        requestedPoints: pointsToRedeem,
      }, { status: 400 });
    }

    const cashValueCents = pointsToRedeem;
    const balanceBefore = wallet.balanceCents;
    const balanceAfter = balanceBefore + BigInt(cashValueCents);
    const now = new Date();
    const wtxId = `wtx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const idemKey = `idem_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    const result = await db.$transaction(async (tx) => {
      await tx.walletTransaction.create({
        data: {
          id: wtxId,
          walletId: wallet.id,
          userId: DEMO_USER_ID,
          direction: 'credit',
          transactionType: 'loyalty_redemption',
          amountCents: BigInt(cashValueCents),
          feeCents: BigInt(0),
          balanceBeforeCents: balanceBefore,
          balanceAfterCents: balanceAfter,
          description: `Loyalty points redemption: ${pointsToRedeem} points`,
          paymentMethod: 'loyalty',
          status: 'completed',
          processedAt: now,
          completedAt: now,
          createdAt: now,
          updatedAt: now,
        },
      });

      const updatedWallet = await tx.consumerWallet.update({
        where: { userId: DEMO_USER_ID },
        data: {
          balanceCents: balanceAfter,
          updatedAt: now,
        },
      });

      const updatedLoyalty = await tx.consumerLoyalty.update({
        where: { userId: DEMO_USER_ID },
        data: {
          points: { decrement: pointsToRedeem },
          totalRedeemed: { increment: pointsToRedeem },
          updatedAt: now,
        },
      });

      await tx.consumerTransaction.create({
        data: {
          id: `ctxn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          idempotencyKey: idemKey,
          userId: DEMO_USER_ID,
          transactionType: 'loyalty_redemption',
          direction: 'credit',
          amountCents: BigInt(cashValueCents),
          feeCents: BigInt(0),
          netAmountCents: BigInt(cashValueCents),
          status: 'completed',
          description: `Loyalty points redemption: ${pointsToRedeem} points`,
          category: 'other',
          paymentMethod: 'loyalty',
          completedAt: now,
          createdAt: now,
          updatedAt: now,
        },
      });

      return {
        redeemedPoints: pointsToRedeem,
        cashValueCents,
        newPointsBalance: updatedLoyalty.points,
        newWalletBalance: updatedWallet.balanceCents,
      };
    });

    return NextResponse.json(serialize(result));
  } catch (error) {
    console.error('Error redeeming points:', error);
    return NextResponse.json({ error: 'Failed to redeem points' }, { status: 500 });
  }
}
