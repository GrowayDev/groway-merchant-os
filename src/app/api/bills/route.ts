import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Demo user ID - in production this would come from authentication
const DEMO_USER_ID = 'demo-consumer-user-001';

// South African Bill Providers
const billProviders = [
  { id: 'eskom', name: 'Eskom', category: 'electricity', logo: '⚡', minAmount: 10, maxAmount: 5000 },
  { id: 'citypower', name: 'City Power', category: 'electricity', logo: '💡', minAmount: 10, maxAmount: 5000 },
  { id: 'dstv', name: 'DStv/MultiChoice', category: 'tv', logo: '📺', minAmount: 50, maxAmount: 2000 },
  { id: 'jhb_water', name: 'Johannesburg Water', category: 'water', logo: '💧', minAmount: 50, maxAmount: 10000 },
  { id: 'ct_water', name: 'Cape Town Water', category: 'water', logo: '💧', minAmount: 50, maxAmount: 10000 },
  { id: 'vodacom', name: 'Vodacom', category: 'telecom', logo: '📱', minAmount: 10, maxAmount: 5000 },
  { id: 'mtn', name: 'MTN', category: 'telecom', logo: '📱', minAmount: 10, maxAmount: 5000 },
  { id: 'telkom', name: 'Telkom', category: 'telecom', logo: '📞', minAmount: 50, maxAmount: 5000 },
  { id: 'sars', name: 'SARS', category: 'government', logo: '🏛️', minAmount: 1, maxAmount: 100000 },
  { id: 'traffic_jhb', name: 'JHB Traffic Fines', category: 'traffic', logo: '🚗', minAmount: 50, maxAmount: 10000 },
  { id: 'traffic_ct', name: 'Cape Town Traffic', category: 'traffic', logo: '🚗', minAmount: 50, maxAmount: 10000 },
  { id: 'sanral', name: 'SANRAL e-Tolls', category: 'tolls', logo: '🛣️', minAmount: 10, maxAmount: 50000 },
  { id: 'old_mutual', name: 'Old Mutual', category: 'insurance', logo: '🛡️', minAmount: 100, maxAmount: 50000 },
  { id: 'discovery', name: 'Discovery', category: 'insurance', logo: '🛡️', minAmount: 100, maxAmount: 50000 },
  { id: 'hollard', name: 'Hollard', category: 'insurance', logo: '🛡️', minAmount: 100, maxAmount: 50000 },
  { id: 'up', name: 'University of Pretoria', category: 'education', logo: '🎓', minAmount: 100, maxAmount: 100000 },
  { id: 'uct', name: 'UCT', category: 'education', logo: '🎓', minAmount: 100, maxAmount: 100000 },
  { id: 'wits', name: 'Wits University', category: 'education', logo: '🎓', minAmount: 100, maxAmount: 100000 },
  { id: 'nedbank', name: 'Nedbank Loan', category: 'banking', logo: '🏦', minAmount: 100, maxAmount: 50000 },
  { id: 'fnb', name: 'FNB Loan', category: 'banking', logo: '🏦', minAmount: 100, maxAmount: 50000 },
  { id: 'capitec', name: 'Capitec Loan', category: 'banking', logo: '🏦', minAmount: 100, maxAmount: 50000 },
  { id: 'standard', name: 'Standard Bank Loan', category: 'banking', logo: '🏦', minAmount: 100, maxAmount: 50000 },
  { id: 'absa', name: 'Absa Loan', category: 'banking', logo: '🏦', minAmount: 100, maxAmount: 50000 },
  { id: 'african_bank', name: 'African Bank', category: 'banking', logo: '🏦', minAmount: 100, maxAmount: 50000 },
  { id: 'netcare', name: 'Netcare', category: 'health', logo: '🏥', minAmount: 100, maxAmount: 50000 },
  { id: 'mediclinic', name: 'Mediclinic', category: 'health', logo: '🏥', minAmount: 100, maxAmount: 50000 },
  { id: 'life_healthcare', name: 'Life Healthcare', category: 'health', logo: '🏥', minAmount: 100, maxAmount: 50000 },
  { id: 'gautrain', name: 'Gautrain', category: 'transport', logo: '🚄', minAmount: 20, maxAmount: 5000 },
  { id: 'myciti', name: 'MyCiTi Bus', category: 'transport', logo: '🚌', minAmount: 10, maxAmount: 1000 },
  { id: 'rea_vaya', name: 'Rea Vaya', category: 'transport', logo: '🚌', minAmount: 10, maxAmount: 500 },
  { id: 'etv', name: 'e.tv TV Licence', category: 'tv', logo: '📺', minAmount: 265, maxAmount: 265 },
  { id: 'sabc', name: 'SABC TV Licence', category: 'tv', logo: '📺', minAmount: 265, maxAmount: 265 },
  { id: 'multichoice', name: 'MultiChoice', category: 'tv', logo: '📺', minAmount: 50, maxAmount: 2000 },
  { id: 'openview', name: 'Openview', category: 'tv', logo: '📺', minAmount: 50, maxAmount: 500 },
  { id: 'showmax', name: 'Showmax', category: 'streaming', logo: '🎬', minAmount: 39, maxAmount: 1000 },
  { id: 'netflix', name: 'Netflix SA', category: 'streaming', logo: '🎬', minAmount: 49, maxAmount: 2000 },
];

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

// GET - List providers or payment history
export async function GET(request: NextRequest) {
  try {
    await ensureDemoUser();
    
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const category = searchParams.get('category');
    const providerId = searchParams.get('providerId');

    if (action === 'providers') {
      let filtered = billProviders;
      if (category) {
        filtered = billProviders.filter(p => p.category === category);
      }
      return NextResponse.json({ success: true, data: filtered, total: filtered.length });
    }

    if (action === 'categories') {
      const categories = [...new Set(billProviders.map(p => p.category))];
      return NextResponse.json({ success: true, data: categories });
    }

    if (action === 'history') {
      // Get bill payments from database
      const transactions = await db.consumerTransaction.findMany({
        where: {
          userId: DEMO_USER_ID,
          category: 'Bill Payment',
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
      
      return NextResponse.json({
        success: true,
        data: transactions.map(tx => ({
          id: tx.id,
          provider: tx.counterpartyName?.toLowerCase().replace(/\s+/g, '_') || 'unknown',
          providerName: tx.counterpartyName || 'Unknown',
          accountNumber: tx.reference?.slice(-8) || '****',
          amount: Math.abs(Number(tx.netAmountCents)) / 100,
          date: tx.createdAt.toISOString(),
          status: tx.status,
          reference: tx.reference,
        })),
        total: transactions.length,
      });
    }

    if (action === 'lookup' && providerId) {
      const provider = billProviders.find(p => p.id === providerId);
      if (!provider) {
        return NextResponse.json({ success: false, error: 'Provider not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: provider });
    }

    // Get recent bill payments
    const recentTransactions = await db.consumerTransaction.findMany({
      where: {
        userId: DEMO_USER_ID,
        category: 'Bill Payment',
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return NextResponse.json({
      success: true,
      data: {
        providers: billProviders,
        recentPayments: recentTransactions.map(tx => ({
          id: tx.id,
          provider: tx.counterpartyName?.toLowerCase().replace(/\s+/g, '_') || 'unknown',
          providerName: tx.counterpartyName || 'Unknown',
          accountNumber: tx.reference?.slice(-8) || '****',
          amount: Math.abs(Number(tx.netAmountCents)) / 100,
          date: tx.createdAt.toISOString(),
          status: tx.status,
          reference: tx.reference,
        })),
        categories: [...new Set(billProviders.map(p => p.category))],
      },
    });
  } catch (error) {
    console.error('Bills GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch bills data' }, { status: 500 });
  }
}

// POST - Pay a bill
export async function POST(request: NextRequest) {
  try {
    await ensureDemoUser();
    
    const body = await request.json();
    const { providerId, accountNumber, amount, meterNumber } = body;

    const provider = billProviders.find(p => p.id === providerId);
    if (!provider) {
      return NextResponse.json({ success: false, error: 'Invalid provider' }, { status: 400 });
    }

    if (amount < provider.minAmount || amount > provider.maxAmount) {
      return NextResponse.json({
        success: false,
        error: `Amount must be between R${provider.minAmount} and R${provider.maxAmount}`,
      }, { status: 400 });
    }
    
    // Get wallet
    const wallet = await db.consumerWallet.findUnique({
      where: { userId: DEMO_USER_ID }
    });
    
    if (!wallet) {
      return NextResponse.json({ success: false, error: 'Wallet not found' }, { status: 404 });
    }
    
    const amountCents = BigInt(Math.round(amount * 100));
    
    // Check balance
    if (wallet.balanceCents < amountCents) {
      return NextResponse.json({ success: false, error: 'Insufficient funds' }, { status: 400 });
    }

    // Generate token for prepaid electricity
    let token = null;
    let description = `Bill payment to ${provider.name}`;
    
    if (provider.category === 'electricity' && meterNumber) {
      token = `${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      description = `Electricity - ${provider.name} (Meter: ${meterNumber})`;
    }

    // Create transaction
    const txn = await db.consumerTransaction.create({
      data: {
        id: `BIL${Date.now()}`,
        idempotencyKey: `IDM${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: DEMO_USER_ID,
        transactionType: 'bill_payment',
        direction: 'debit',
        amountCents: -amountCents,
        feeCents: BigInt(0),
        netAmountCents: -amountCents,
        currency: 'ZAR',
        status: 'completed',
        description,
        reference: `${providerId.toUpperCase()}-${Date.now()}`,
        category: 'Bill Payment',
        counterpartyName: provider.name,
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
      const points = Math.round(amount * 10); // 10 points per R1
      await db.consumerLoyalty.update({
        where: { userId: DEMO_USER_ID },
        data: {
          points: loyalty.points + points,
          totalEarned: loyalty.totalEarned + points,
          updatedAt: new Date(),
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: txn.id,
        provider: providerId,
        providerName: provider.name,
        accountNumber: accountNumber || meterNumber,
        amount,
        date: txn.createdAt.toISOString(),
        status: txn.status,
        reference: txn.reference,
        token,
        newBalance: Number(wallet.balanceCents - amountCents) / 100,
      },
      message: `Successfully paid R ${amount.toFixed(2)} to ${provider.name}${token ? `\n\nToken: ${token}` : ''}`,
    });
  } catch (error) {
    console.error('Bills POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process bill payment' }, { status: 500 });
  }
}
