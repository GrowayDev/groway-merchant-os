import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Demo user ID - in production this would come from authentication
const DEMO_USER_ID = 'demo-consumer-user-001';

// South African Mobile Networks
const networks = [
  { id: 'vodacom', name: 'Vodacom', logo: '🔴', color: '#E60000' },
  { id: 'mtn', name: 'MTN', logo: '🟡', color: '#FFCC00' },
  { id: 'cellc', name: 'Cell C', logo: '⚫', color: '#000000' },
  { id: 'telkom', name: 'Telkom', logo: '🔵', color: '#0066CC' },
  { id: 'rain', name: 'Rain', logo: '🌧️', color: '#00A3E0' },
];

// Bundle Types
const bundleTypes = [
  { id: 'data', name: 'Data Bundles', icon: '📶' },
  { id: 'voice', name: 'Voice Bundles', icon: '📞' },
  { id: 'sms', name: 'SMS Bundles', icon: '💬' },
  { id: 'social', name: 'Social Media', icon: '📱' },
  { id: 'night', name: 'Night Data', icon: '🌙' },
  { id: 'allnet', name: 'All-Network', icon: '🌐' },
];

// Bundle offerings per network
const bundles = {
  vodacom: [
    { id: 'VOD-DATA-1', type: 'data', name: 'MyMeg 100', amount: 100, price: 12, validity: '1 day' },
    { id: 'VOD-DATA-2', type: 'data', name: 'MyMeg 500', amount: 500, price: 39, validity: '30 days' },
    { id: 'VOD-DATA-3', type: 'data', name: 'MyGig 1', amount: 1024, price: 85, validity: '30 days' },
    { id: 'VOD-DATA-4', type: 'data', name: 'MyGig 2', amount: 2048, price: 149, validity: '30 days' },
    { id: 'VOD-DATA-5', type: 'data', name: 'MyGig 5', amount: 5120, price: 299, validity: '30 days' },
    { id: 'VOD-VOICE-1', type: 'voice', name: '100 Minutes', amount: 100, price: 50, validity: '30 days' },
    { id: 'VOD-SOCIAL-1', type: 'social', name: 'Social Media 1GB', amount: 1024, price: 25, validity: '30 days' },
    { id: 'VOD-NIGHT-1', type: 'night', name: 'Night Owl 1GB', amount: 1024, price: 15, validity: '7 days' },
  ],
  mtn: [
    { id: 'MTN-DATA-1', type: 'data', name: '100MB', amount: 100, price: 10, validity: '1 day' },
    { id: 'MTN-DATA-2', type: 'data', name: '500MB', amount: 500, price: 35, validity: '30 days' },
    { id: 'MTN-DATA-3', type: 'data', name: '1GB', amount: 1024, price: 79, validity: '30 days' },
    { id: 'MTN-DATA-4', type: 'data', name: '2GB', amount: 2048, price: 139, validity: '30 days' },
    { id: 'MTN-DATA-5', type: 'data', name: '5GB', amount: 5120, price: 279, validity: '30 days' },
    { id: 'MTN-VOICE-1', type: 'voice', name: 'MTN-to-MTN 100', amount: 100, price: 40, validity: '30 days' },
    { id: 'MTN-SOCIAL-1', type: 'social', name: 'Ayoba 500MB', amount: 512, price: 20, validity: '30 days' },
  ],
  cellc: [
    { id: 'CELLC-DATA-1', type: 'data', name: '100MB', amount: 100, price: 12, validity: '1 day' },
    { id: 'CELLC-DATA-2', type: 'data', name: '500MB', amount: 500, price: 39, validity: '30 days' },
    { id: 'CELLC-DATA-3', type: 'data', name: '1GB', amount: 1024, price: 75, validity: '30 days' },
    { id: 'CELLC-DATA-4', type: 'data', name: '2GB', amount: 2048, price: 135, validity: '30 days' },
  ],
  telkom: [
    { id: 'TELKOM-DATA-1', type: 'data', name: '100MB', amount: 100, price: 8, validity: '1 day' },
    { id: 'TELKOM-DATA-2', type: 'data', name: '1GB', amount: 1024, price: 59, validity: '30 days' },
    { id: 'TELKOM-DATA-3', type: 'data', name: '2GB', amount: 2048, price: 99, validity: '30 days' },
    { id: 'TELKOM-DATA-4', type: 'data', name: '5GB', amount: 5120, price: 199, validity: '30 days' },
    { id: 'TELKOM-NIGHT-1', type: 'night', name: 'Night Surfer 2GB', amount: 2048, price: 49, validity: '30 days' },
  ],
  rain: [
    { id: 'RAIN-DATA-1', type: 'data', name: '1GB', amount: 1024, price: 50, validity: '30 days' },
    { id: 'RAIN-DATA-2', type: 'data', name: '5GB', amount: 5120, price: 250, validity: '30 days' },
    { id: 'RAIN-DATA-3', type: 'data', name: 'Unlimited Off-Peak', amount: -1, price: 250, validity: 'Monthly' },
  ],
};

// Helper to ensure demo user has wallet
async function ensureDemoUser() {
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
  
  return user;
}

// GET - List networks, bundles, or history
export async function GET(request: NextRequest) {
  try {
    await ensureDemoUser();
    
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const networkId = searchParams.get('network');
    const bundleType = searchParams.get('type');

    if (action === 'networks') {
      return NextResponse.json({ success: true, data: networks });
    }

    if (action === 'bundles' && networkId) {
      const networkBundles = bundles[networkId as keyof typeof bundles] || [];
      let filtered = networkBundles;
      if (bundleType) {
        filtered = networkBundles.filter(b => b.type === bundleType);
      }
      return NextResponse.json({ success: true, data: filtered, network: networks.find(n => n.id === networkId) });
    }

    if (action === 'types') {
      return NextResponse.json({ success: true, data: bundleTypes });
    }

    if (action === 'history') {
      // Get airtime transactions from database
      const transactions = await db.consumerTransaction.findMany({
        where: {
          userId: DEMO_USER_ID,
          category: 'Airtime & Data',
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
      
      return NextResponse.json({
        success: true,
        data: transactions.map(tx => ({
          id: tx.id,
          network: tx.counterpartyName?.toLowerCase() || 'unknown',
          networkName: tx.counterpartyName || 'Unknown',
          phoneNumber: tx.description?.match(/\*\*\* \*\*\* \d{4}/)?.[0] || '*** *** ****',
          bundle: tx.description?.replace(/ for \*\*\* \*\*\* \d{4}/, '') || 'Airtime',
          amount: Math.abs(Number(tx.netAmountCents)) / 100,
          date: tx.createdAt.toISOString(),
          status: tx.status,
        }))
      });
    }

    // Get recent purchases
    const recentTransactions = await db.consumerTransaction.findMany({
      where: {
        userId: DEMO_USER_ID,
        category: 'Airtime & Data',
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return NextResponse.json({
      success: true,
      data: {
        networks,
        bundleTypes,
        recentPurchases: recentTransactions.map(tx => ({
          id: tx.id,
          network: tx.counterpartyName?.toLowerCase() || 'unknown',
          networkName: tx.counterpartyName || 'Unknown',
          phoneNumber: tx.description?.match(/\*\*\* \*\*\* \d{4}/)?.[0] || '*** *** ****',
          bundle: tx.description?.replace(/ for \*\*\* \*\*\* \d{4}/, '') || 'Airtime',
          amount: Math.abs(Number(tx.netAmountCents)) / 100,
          date: tx.createdAt.toISOString(),
          status: tx.status,
        })),
      },
    });
  } catch (error) {
    console.error('Airtime GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch airtime data' }, { status: 500 });
  }
}

// POST - Purchase airtime or data
export async function POST(request: NextRequest) {
  try {
    await ensureDemoUser();
    
    const body = await request.json();
    const { networkId, phoneNumber, bundleId, amount, customAmount } = body;

    const network = networks.find(n => n.id === networkId);
    if (!network) {
      return NextResponse.json({ success: false, error: 'Invalid network' }, { status: 400 });
    }
    
    // Get wallet
    const wallet = await db.consumerWallet.findUnique({
      where: { userId: DEMO_USER_ID }
    });
    
    if (!wallet) {
      return NextResponse.json({ success: false, error: 'Wallet not found' }, { status: 404 });
    }
    
    let purchaseAmount = 0;
    let description = '';
    let bundleInfo: any = null;

    // Simple airtime purchase (no bundle)
    if (!bundleId && (amount || customAmount)) {
      purchaseAmount = amount || customAmount;
      description = `Airtime R${purchaseAmount} for ${phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '*** *** $3')}`;
    }
    
    // Bundle purchase
    if (bundleId) {
      const networkBundles = bundles[networkId as keyof typeof bundles] || [];
      bundleInfo = networkBundles.find(b => b.id === bundleId);
      
      if (!bundleInfo) {
        return NextResponse.json({ success: false, error: 'Invalid bundle' }, { status: 400 });
      }
      
      purchaseAmount = bundleInfo.price;
      description = `${bundleInfo.name} for ${phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '*** *** $3')}`;
    }
    
    if (purchaseAmount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 });
    }
    
    const amountCents = BigInt(Math.round(purchaseAmount * 100));
    
    // Check balance
    if (wallet.balanceCents < amountCents) {
      return NextResponse.json({ success: false, error: 'Insufficient funds' }, { status: 400 });
    }
    
    // Create transaction
    const txn = await db.consumerTransaction.create({
      data: {
        id: `AIR${Date.now()}`,
        idempotencyKey: `IDM${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: DEMO_USER_ID,
        transactionType: 'airtime',
        direction: 'debit',
        amountCents: -amountCents,
        feeCents: BigInt(0),
        netAmountCents: -amountCents,
        currency: 'ZAR',
        status: 'completed',
        description,
        reference: `AIR${Date.now()}`,
        category: 'Airtime & Data',
        counterpartyName: network.name,
        counterpartyPhone: phoneNumber,
        paymentMethod: 'wallet',
        processedAt: new Date(),
        completedAt: new Date(),
        updatedAt: new Date(),
      }
    });
    
    // Update wallet balance
    await db.consumerWallet.update({
      where: { userId: DEMO_USER_ID },
      data: {
        balanceCents: wallet.balanceCents - amountCents,
        dailySpentCents: wallet.dailySpentCents + amountCents,
        monthlySpentCents: wallet.monthlySpentCents + amountCents,
        updatedAt: new Date(),
      }
    });
    
    // Award loyalty points
    const loyalty = await db.consumerLoyalty.findUnique({
      where: { userId: DEMO_USER_ID }
    });
    
    if (loyalty) {
      const points = Math.round(purchaseAmount * 10); // 10 points per R1
      await db.consumerLoyalty.update({
        where: { userId: DEMO_USER_ID },
        data: {
          points: loyalty.points + points,
          totalEarned: loyalty.totalEarned + points,
          updatedAt: new Date(),
        }
      });
    }
    
    const maskedPhone = phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '*** *** $3');
    
    return NextResponse.json({
      success: true,
      data: {
        id: txn.id,
        network: networkId,
        networkName: network.name,
        phoneNumber: maskedPhone,
        bundle: bundleInfo?.name || `Airtime R${purchaseAmount}`,
        amount: purchaseAmount,
        dataAmount: bundleInfo?.amount,
        validity: bundleInfo?.validity,
        date: txn.createdAt.toISOString(),
        status: txn.status,
        newBalance: Number(wallet.balanceCents - amountCents) / 100,
      },
      message: `Successfully purchased ${bundleInfo?.name || `R${purchaseAmount} airtime`} for ${maskedPhone}`,
    });
  } catch (error) {
    console.error('Airtime POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process airtime purchase' }, { status: 500 });
  }
}
