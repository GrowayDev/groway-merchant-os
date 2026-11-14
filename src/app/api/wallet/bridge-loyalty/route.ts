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

// Tier thresholds for the consumer-side loyalty program.
// bronze 0-999, silver 1000-4999, gold 5000-9999, platinum 10000-24999, diamond 25000+
const TIER_THRESHOLDS = [
  { tier: 'diamond', floor: 25000, ceil: 999999 },
  { tier: 'platinum', floor: 10000, ceil: 24999 },
  { tier: 'gold', floor: 5000, ceil: 9999 },
  { tier: 'silver', floor: 1000, ceil: 4999 },
  { tier: 'bronze', floor: 0, ceil: 999 },
];

// Compute the tier for a given points total.
function computeTier(points: number): {
  tier: string;
  floor: number;
  ceil: number;
  tierProgress: number;
  pointsToNextTier: number;
} {
  for (const t of TIER_THRESHOLDS) {
    if (points >= t.floor && points <= t.ceil) {
      const span = t.ceil - t.floor + 1;
      const progress = span > 0 ? (points - t.floor) / span : 0;
      return {
        tier: t.tier,
        floor: t.floor,
        ceil: t.ceil,
        tierProgress: Math.min(1, Math.max(0, progress)),
        pointsToNextTier: Math.max(0, t.ceil + 1 - points),
      };
    }
  }
  // Above the highest threshold — diamond, fully progressed
  return { tier: 'diamond', floor: 25000, ceil: 999999, tierProgress: 1, pointsToNextTier: 0 };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId') || undefined;

    const where: any = { consumerUserId: DEMO_USER_ID };
    if (merchantId) where.merchantId = merchantId;

    const bridges = await db.loyaltyBridge.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(serialize({ bridges }));
  } catch (error) {
    console.error('Error fetching loyalty bridges:', error);
    return NextResponse.json({ error: 'Failed to fetch loyalty bridges' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { merchantId, merchantName, pointsEarned, sourceType, sourceRef, amountCents } = body;

    if (!merchantId || !merchantName || !pointsEarned || pointsEarned <= 0 || !sourceType) {
      return NextResponse.json(
        { error: 'merchantId, merchantName, pointsEarned (>0), and sourceType are required' },
        { status: 400 }
      );
    }

    // Make sure the demo user/wallet exist (so the loyalty FK is valid).
    await ensureDemoUser();

    const now = new Date();

    const result = await db.$transaction(async (tx) => {
      // 1. Get or create ConsumerLoyalty for the demo user
      let loyalty = await tx.consumerLoyalty.findUnique({
        where: { userId: DEMO_USER_ID },
      });
      if (!loyalty) {
        loyalty = await tx.consumerLoyalty.create({
          data: {
            id: genId('loy'),
            userId: DEMO_USER_ID,
            tier: 'bronze',
            points: 0,
            totalEarned: 0,
            totalRedeemed: 0,
            pointsToNextTier: 1000,
            tierProgress: 0,
            createdAt: now,
            updatedAt: now,
          },
        });
      }

      // 2. Create the LoyaltyBridge row
      const bridge = await tx.loyaltyBridge.create({
        data: {
          id: genId('lb'),
          consumerUserId: DEMO_USER_ID,
          merchantId,
          merchantName,
          pointsEarned,
          pointsRedeemed: 0,
          sourceType,
          sourceRef: sourceRef || null,
          amountCents: BigInt(amountCents || 0),
          syncedToConsumer: false,
          createdAt: now,
        },
      });

      // 3. Compute new points + totals
      const newPoints = loyalty.points + pointsEarned;
      const newTotalEarned = loyalty.totalEarned + pointsEarned;

      // 4. Compute tier from new points
      const tierInfo = computeTier(newPoints);
      const tierChanged = tierInfo.tier !== loyalty.tier;

      // 5. Update ConsumerLoyalty
      const updatedLoyalty = await tx.consumerLoyalty.update({
        where: { userId: DEMO_USER_ID },
        data: {
          points: newPoints,
          totalEarned: newTotalEarned,
          tier: tierInfo.tier,
          tierProgress: tierInfo.tierProgress,
          pointsToNextTier: tierInfo.pointsToNextTier,
          ...(tierChanged ? { tierAchievedAt: now } : {}),
          updatedAt: now,
        },
      });

      // 6. Mark bridge as synced
      await tx.loyaltyBridge.update({
        where: { id: bridge.id },
        data: {
          syncedToConsumer: true,
          syncedAt: now,
          consumerLoyaltyId: updatedLoyalty.id,
        },
      });

      return {
        bridge,
        loyalty: {
          points: updatedLoyalty.points,
          tier: updatedLoyalty.tier,
          tierProgress: updatedLoyalty.tierProgress,
          pointsToNextTier: updatedLoyalty.pointsToNextTier,
          totalEarned: updatedLoyalty.totalEarned,
          tierAchievedAt: updatedLoyalty.tierAchievedAt,
        },
      };
    });

    return NextResponse.json(serialize(result));
  } catch (error) {
    console.error('Error creating loyalty bridge:', error);
    return NextResponse.json({ error: 'Failed to create loyalty bridge' }, { status: 500 });
  }
}
