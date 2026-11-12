import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Demo user ID - in production this would come from authentication
const DEMO_USER_ID = 'demo-consumer-user-001';

// Loyalty Tiers
const tiers = [
  { id: 'bronze', name: 'Bronze', minPoints: 0, maxPoints: 999, color: '#CD7F32', benefits: ['1x points on all transactions', 'Birthday bonus'] },
  { id: 'silver', name: 'Silver', minPoints: 1000, maxPoints: 2999, color: '#C0C0C0', benefits: ['1.5x points on all transactions', 'Birthday bonus', 'Exclusive offers', 'Priority support'] },
  { id: 'gold', name: 'Gold', minPoints: 3000, maxPoints: 9999, color: '#FFD700', benefits: ['2x points on all transactions', 'Birthday bonus', 'Exclusive offers', 'Priority support', 'Free transfers', 'Cashback 1%'] },
  { id: 'platinum', name: 'Platinum', minPoints: 10000, maxPoints: 999999, color: '#E5E4E2', benefits: ['3x points on all transactions', 'Birthday bonus', 'Exclusive offers', 'VIP support', 'Free transfers', 'Cashback 2%', 'Lounge access'] },
];

// Helper to ensure demo user and loyalty data exist
async function ensureDemoData() {
  let user = await db.consumerUser.findUnique({
    where: { id: DEMO_USER_ID }
  });
  
  if (!user) {
    const now = new Date();
    user = await db.consumerUser.create({
      data: {
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
      }
    });
  }
  
  let loyalty = await db.consumerLoyalty.findUnique({
    where: { userId: DEMO_USER_ID }
  });
  
  if (!loyalty) {
    const loyaltyNow = new Date();
    loyalty = await db.consumerLoyalty.create({
      data: {
        id: 'demo-loyalty-001',
        userId: DEMO_USER_ID,
        tier: 'silver',
        points: 2450,
        totalEarned: 12500,
        totalRedeemed: 10050,
        pointsToNextTier: 550,
        tierProgress: 0.82,
        tierAchievedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        createdAt: loyaltyNow,
        updatedAt: loyaltyNow,
      }
    });
  }
  
  return loyalty;
}

// Flash Sales
const flashSales = [
  { id: 'FS001', title: 'Flash Sale: Checkers', discount: '40% OFF', timeLeft: 7200, merchant: 'Checkers', category: 'groceries' },
  { id: 'FS002', title: 'Flash Sale: Takealot', discount: '25% OFF', timeLeft: 14400, merchant: 'Takealot', category: 'shopping' },
  { id: 'FS003', title: 'Flash Sale: Dis-Chem', discount: '30% OFF', timeLeft: 28800, merchant: 'Dis-Chem', category: 'health' },
];

// Offers
const offers = [
  { id: 'OFF001', title: '30% off at Checkers', description: 'On groceries over R200', category: 'groceries', discount: 30, minSpend: 200, expiresAt: new Date(Date.now() + 86400000).toISOString(), merchant: 'Checkers', terms: 'Valid until end of month', clipped: false },
  { id: 'OFF002', title: 'Free coffee at Mugg & Bean', description: 'Any size coffee', category: 'food', discount: 100, minSpend: 0, expiresAt: new Date(Date.now() + 2592000000).toISOString(), merchant: 'Mugg & Bean', terms: 'One per customer', clipped: true },
  { id: 'OFF003', title: 'R50 off at Dis-Chem', description: 'Health & beauty', category: 'health', discount: 50, minSpend: 300, expiresAt: new Date(Date.now() + 5184000000).toISOString(), merchant: 'Dis-Chem', terms: 'Excludes prescriptions', clipped: true },
  { id: 'OFF004', title: '20% off Vodacom data', description: '1GB and above', category: 'airtime', discount: 20, minSpend: 0, expiresAt: new Date(Date.now() + 172800000).toISOString(), merchant: 'Vodacom', terms: 'Valid for new bundles', clipped: false },
  { id: 'OFF005', title: '2 for 1 at Nando\'s', description: 'On burgers', category: 'food', discount: 50, minSpend: 100, expiresAt: new Date(Date.now() + 604800000).toISOString(), merchant: "Nando's", terms: 'Dine-in only', clipped: true },
];

// GET - Loyalty and offers data
export async function GET(request: NextRequest) {
  try {
    const loyalty = await ensureDemoData();
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const category = searchParams.get('category');
    
    if (action === 'tiers') {
      return NextResponse.json({ success: true, data: tiers });
    }
    
    if (action === 'status') {
      const currentTier = tiers.find(t => t.id === loyalty.tier);
      const nextTier = tiers[tiers.findIndex(t => t.id === loyalty.tier) + 1];
      
      return NextResponse.json({
        success: true,
        data: {
          ...loyalty,
          tierName: currentTier?.name || 'Silver',
          currentTier,
          nextTier,
          progress: Math.round((loyalty.points % 3000) / 3000 * 100),
        },
      });
    }
    
    if (action === 'history') {
      // In a real app, this would come from a points history table
      const history = [
        { id: 'PTS001', type: 'earned', amount: 50, description: 'Airtime purchase', date: new Date(Date.now() - 3600000).toISOString() },
        { id: 'PTS002', type: 'earned', amount: 120, description: 'Checkers purchase', date: new Date(Date.now() - 7200000).toISOString() },
        { id: 'PTS003', type: 'redeemed', amount: -500, description: 'R5 discount redeemed', date: new Date(Date.now() - 86400000).toISOString() },
        { id: 'PTS004', type: 'bonus', amount: 100, description: 'Weekly streak bonus', date: new Date(Date.now() - 172800000).toISOString() },
        { id: 'PTS005', type: 'earned', amount: 75, description: 'Bill payment', date: new Date(Date.now() - 259200000).toISOString() },
      ];
      
      return NextResponse.json({ success: true, data: history });
    }
    
    if (action === 'offers') {
      let filtered = offers;
      if (category) {
        filtered = offers.filter(o => o.category === category);
      }
      return NextResponse.json({
        success: true,
        data: {
          offers: filtered,
          clipped: offers.filter(o => o.clipped),
          categories: [...new Set(offers.map(o => o.category))],
        },
      });
    }
    
    if (action === 'flash-sales') {
      return NextResponse.json({ success: true, data: flashSales });
    }
    
    if (action === 'rewards') {
      // Available rewards to redeem
      const rewards = [
        { id: 'RWD001', name: 'R5 Discount', points: 500, type: 'discount', value: 5 },
        { id: 'RWD002', name: 'R10 Discount', points: 900, type: 'discount', value: 10 },
        { id: 'RWD003', name: 'R25 Discount', points: 2000, type: 'discount', value: 25 },
        { id: 'RWD004', name: 'R50 Discount', points: 3500, type: 'discount', value: 50 },
        { id: 'RWD005', name: 'Free Airtime R20', points: 1500, type: 'airtime', value: 20 },
        { id: 'RWD006', name: 'Free Electricity R50', points: 3000, type: 'electricity', value: 50 },
      ];
      
      return NextResponse.json({
        success: true,
        data: rewards.filter(r => r.points <= loyalty.points),
      });
    }
    
    // Get current tier info
    const currentTier = tiers.find(t => t.id === loyalty.tier) || tiers[1]; // Default to silver
    const nextTierIndex = tiers.findIndex(t => t.id === loyalty.tier) + 1;
    const nextTier = nextTierIndex < tiers.length ? tiers[nextTierIndex] : null;
    
    return NextResponse.json({
      success: true,
      data: {
        loyalty: {
          ...loyalty,
          tierName: currentTier.name,
          nextTier: nextTier?.id || 'platinum',
        },
        tiers,
        offers: offers.slice(0, 5),
        flashSales,
        recentPoints: [
          { id: 'PTS001', type: 'earned', amount: 50, description: 'Airtime purchase', date: new Date(Date.now() - 3600000).toISOString() },
          { id: 'PTS002', type: 'earned', amount: 120, description: 'Checkers purchase', date: new Date(Date.now() - 7200000).toISOString() },
          { id: 'PTS003', type: 'redeemed', amount: -500, description: 'R5 discount redeemed', date: new Date(Date.now() - 86400000).toISOString() },
          { id: 'PTS004', type: 'bonus', amount: 100, description: 'Weekly streak bonus', date: new Date(Date.now() - 172800000).toISOString() },
          { id: 'PTS005', type: 'earned', amount: 75, description: 'Bill payment', date: new Date(Date.now() - 259200000).toISOString() },
        ].slice(0, 5),
      },
    });
  } catch (error) {
    console.error('Loyalty GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch loyalty data' }, { status: 500 });
  }
}

// POST - Actions
export async function POST(request: NextRequest) {
  try {
    const loyalty = await ensureDemoData();
    const body = await request.json();
    const { action, offerId, rewardId, amount } = body;
    
    // Clip offer
    if (action === 'clip' && offerId) {
      const offer = offers.find(o => o.id === offerId);
      if (!offer) {
        return NextResponse.json({ success: false, error: 'Offer not found' }, { status: 404 });
      }
      
      offer.clipped = true;
      return NextResponse.json({
        success: true,
        data: offer,
        message: `"${offer.title}" clipped! It will be applied automatically at checkout.`,
      });
    }
    
    // Redeem points
    if (action === 'redeem' && rewardId) {
      const rewards = [
        { id: 'RWD001', points: 500, value: 5 },
        { id: 'RWD002', points: 900, value: 10 },
        { id: 'RWD003', points: 2000, value: 25 },
        { id: 'RWD004', points: 3500, value: 50 },
        { id: 'RWD005', points: 1500, value: 20 },
        { id: 'RWD006', points: 3000, value: 50 },
      ];
      
      const reward = rewards.find(r => r.id === rewardId);
      if (!reward) {
        return NextResponse.json({ success: false, error: 'Reward not found' }, { status: 404 });
      }
      
      if (loyalty.points < reward.points) {
        return NextResponse.json({ success: false, error: 'Insufficient points' }, { status: 400 });
      }
      
      // Update loyalty in database
      await db.consumerLoyalty.update({
        where: { userId: DEMO_USER_ID },
        data: {
          points: loyalty.points - reward.points,
          totalRedeemed: loyalty.totalRedeemed + reward.points,
          updatedAt: new Date(),
        }
      });
      
      return NextResponse.json({
        success: true,
        data: {
          reward: rewardId,
          pointsRemaining: loyalty.points - reward.points,
          discount: reward.value,
        },
        message: `R${reward.value} discount redeemed! Applied to your next transaction.`,
      });
    }
    
    // Earn points (from transaction)
    if (action === 'earn' && amount) {
      const multiplier = loyalty.tier === 'platinum' ? 3 : loyalty.tier === 'gold' ? 2 : loyalty.tier === 'silver' ? 1.5 : 1;
      const points = Math.round(amount * multiplier * 10); // 10 points per R1 base
      
      const newPoints = loyalty.points + points;
      
      // Determine new tier
      let newTier = loyalty.tier;
      for (const tier of tiers) {
        if (newPoints >= tier.minPoints && newPoints <= tier.maxPoints) {
          newTier = tier.id;
          break;
        }
      }
      
      // Update loyalty in database
      await db.consumerLoyalty.update({
        where: { userId: DEMO_USER_ID },
        data: {
          points: newPoints,
          totalEarned: loyalty.totalEarned + points,
          tier: newTier,
          tierAchievedAt: newTier !== loyalty.tier ? new Date() : undefined,
          updatedAt: new Date(),
        }
      });
      
      return NextResponse.json({
        success: true,
        data: {
          pointsEarned: points,
          totalPoints: newPoints,
          tier: newTier,
          tierUpgraded: newTier !== loyalty.tier,
        },
        message: `You earned ${points} points!${newTier !== loyalty.tier ? ` Congratulations! You've been upgraded to ${newTier}!` : ''}`,
      });
    }
    
    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Loyalty POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process request' }, { status: 500 });
  }
}
