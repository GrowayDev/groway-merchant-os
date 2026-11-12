import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Demo user ID - in production this would come from authentication
const DEMO_USER_ID = 'demo-consumer-user-001';

// International Transfer Providers
const providers = [
  { id: 'chipper', name: 'Chipper Cash', logo: '🟢', rate: 1, fee: 0, minAmount: 50, maxAmount: 50000, countries: ['NG', 'GH', 'KE', 'UG', 'RW', 'TZ'] },
  { id: 'mukuru', name: 'Mukuru', logo: '🟠', rate: 0.98, fee: 25, minAmount: 100, maxAmount: 100000, countries: ['ZW', 'MW', 'ZM', 'MZ', 'BW', 'SZ'] },
  { id: 'terrapay', name: 'TerraPay', logo: '🔵', rate: 0.99, fee: 35, minAmount: 100, maxAmount: 50000, countries: ['NG', 'GH', 'KE', 'UG', 'TZ', 'RW', 'ZM', 'MW'] },
  { id: 'worldremit', name: 'WorldRemit', logo: '🟣', rate: 0.97, fee: 29, minAmount: 50, maxAmount: 75000, countries: ['NG', 'GH', 'KE', 'UG', 'TZ', 'RW', 'ZM', 'ZW', 'MW', 'MZ'] },
  { id: 'aza', name: 'AZA Finance', logo: '🟡', rate: 0.985, fee: 20, minAmount: 500, maxAmount: 200000, countries: ['NG', 'GH', 'KE', 'UG', 'TZ', 'RW', 'ZM', 'MW'] },
  { id: 'stablecoin', name: 'USDC/Stellar', logo: '⚪', rate: 1, fee: 5, minAmount: 50, maxAmount: 100000, countries: ['*'] },
];

// Supported Countries
const countries = [
  { code: 'NG', name: 'Nigeria', currency: 'NGN', flag: '🇳🇬' },
  { code: 'GH', name: 'Ghana', currency: 'GHS', flag: '🇬🇭' },
  { code: 'KE', name: 'Kenya', currency: 'KES', flag: '🇰🇪' },
  { code: 'UG', name: 'Uganda', currency: 'UGX', flag: '🇺🇬' },
  { code: 'TZ', name: 'Tanzania', currency: 'TZS', flag: '🇹🇿' },
  { code: 'RW', name: 'Rwanda', currency: 'RWF', flag: '🇷🇼' },
  { code: 'ZW', name: 'Zimbabwe', currency: 'USD', flag: '🇿🇼' },
  { code: 'ZM', name: 'Zambia', currency: 'ZMW', flag: '🇿🇲' },
  { code: 'MW', name: 'Malawi', currency: 'MWK', flag: '🇲🇼' },
  { code: 'MZ', name: 'Mozambique', currency: 'MZN', flag: '🇲🇿' },
  { code: 'BW', name: 'Botswana', currency: 'BWP', flag: '🇧🇼' },
  { code: 'SZ', name: 'Eswatini', currency: 'SZL', flag: '🇸🇿' },
  { code: 'IN', name: 'India', currency: 'INR', flag: '🇮🇳' },
  { code: 'CN', name: 'China', currency: 'CNY', flag: '🇨🇳' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', flag: '🇬🇧' },
  { code: 'US', name: 'United States', currency: 'USD', flag: '🇺🇸' },
  { code: 'AE', name: 'UAE', currency: 'AED', flag: '🇦🇪' },
];

// Exchange rates (ZAR to destination)
const exchangeRates: Record<string, number> = {
  NGN: 25.5, GHS: 0.45, KES: 7.2, UGX: 210, TZS: 135,
  RWF: 75, USD: 0.053, ZMW: 1.35, MWK: 90, MZN: 3.4,
  BWP: 0.72, SZL: 1.0, INR: 4.4, CNY: 0.38, GBP: 0.042, AED: 0.19,
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

// GET - List providers, countries, rates
export async function GET(request: NextRequest) {
  try {
    await ensureDemoUser();
    
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const countryCode = searchParams.get('country');
    const amount = parseFloat(searchParams.get('amount') || '1000');

    if (action === 'providers') {
      return NextResponse.json({ success: true, data: providers });
    }

    if (action === 'countries') {
      return NextResponse.json({ success: true, data: countries });
    }

    if (action === 'rates') {
      return NextResponse.json({ success: true, data: exchangeRates });
    }

    if (action === 'quote' && countryCode) {
      const country = countries.find(c => c.code === countryCode);
      if (!country) {
        return NextResponse.json({ success: false, error: 'Country not found' }, { status: 404 });
      }

      const rate = exchangeRates[country.currency] || 1;
      const availableProviders = providers.filter(p => 
        p.countries.includes('*') || p.countries.includes(countryCode)
      );

      const quotes = availableProviders.map(p => ({
        provider: p,
        zarAmount: amount,
        fee: p.fee,
        rate: p.rate * rate,
        totalZar: amount + p.fee,
        receiveAmount: Math.round(amount * p.rate * rate * 100) / 100,
        currency: country.currency,
      }));

      return NextResponse.json({
        success: true,
        data: {
          country,
          amount,
          quotes: quotes.sort((a, b) => b.receiveAmount - a.receiveAmount),
        },
      });
    }

    if (action === 'history') {
      // Get international transfers from database
      const transactions = await db.consumerTransaction.findMany({
        where: {
          userId: DEMO_USER_ID,
          category: 'International Transfer',
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
      
      return NextResponse.json({
        success: true,
        data: transactions.map(tx => ({
          id: tx.id,
          provider: tx.paymentMethod || 'unknown',
          providerName: tx.counterpartyName || 'Unknown',
          destination: tx.description?.match(/to (.+?) in/)?.[1] || 'Unknown',
          countryCode: tx.description?.match(/\(([A-Z]{2})\)/)?.[1] || '',
          amount: Math.abs(Number(tx.netAmountCents)) / 100,
          fee: Number(tx.feeCents) / 100,
          rate: 1,
          totalZar: Math.abs(Number(tx.amountCents)) / 100,
          receiveAmount: 0,
          currency: 'ZAR',
          recipient: tx.counterpartyName,
          recipientPhone: tx.counterpartyPhone,
          date: tx.createdAt.toISOString(),
          status: tx.status,
          reference: tx.reference,
        }))
      });
    }

    // Get recent transfers
    const recentTransactions = await db.consumerTransaction.findMany({
      where: {
        userId: DEMO_USER_ID,
        category: 'International Transfer',
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return NextResponse.json({
      success: true,
      data: {
        providers,
        countries,
        recentTransfers: recentTransactions.map(tx => ({
          id: tx.id,
          provider: tx.paymentMethod || 'unknown',
          destination: tx.description?.match(/to (.+?) in/)?.[1] || 'Unknown',
          amount: Math.abs(Number(tx.netAmountCents)) / 100,
          recipient: tx.counterpartyName,
          date: tx.createdAt.toISOString(),
          status: tx.status,
          reference: tx.reference,
        })),
      },
    });
  } catch (error) {
    console.error('Transfers GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch transfers data' }, { status: 500 });
  }
}

// POST - Create international transfer
export async function POST(request: NextRequest) {
  try {
    await ensureDemoUser();
    
    const body = await request.json();
    const { providerId, countryCode, amount, recipientName, recipientPhone, paymentMethod } = body;

    const provider = providers.find(p => p.id === providerId);
    if (!provider) {
      return NextResponse.json({ success: false, error: 'Invalid provider' }, { status: 400 });
    }

    const country = countries.find(c => c.code === countryCode);
    if (!country) {
      return NextResponse.json({ success: false, error: 'Invalid country' }, { status: 400 });
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
    
    const totalAmount = amount + provider.fee;
    const totalCents = BigInt(Math.round(totalAmount * 100));
    
    // Check balance
    if (wallet.balanceCents < totalCents) {
      return NextResponse.json({ success: false, error: 'Insufficient funds' }, { status: 400 });
    }

    const rate = exchangeRates[country.currency] || 1;
    const receiveAmount = Math.round(amount * provider.rate * rate * 100) / 100;
    
    const maskedPhone = recipientPhone?.replace(/(\d{3})(\d{3})(\d{4})/, '*** *** $3');
    const description = `International transfer to ${recipientName} in ${country.name} (${countryCode})`;

    // Create transaction
    const txn = await db.consumerTransaction.create({
      data: {
        id: `INT${Date.now()}`,
        idempotencyKey: `IDM${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: DEMO_USER_ID,
        transactionType: 'international_transfer',
        direction: 'debit',
        amountCents: -totalCents,
        feeCents: BigInt(Math.round(provider.fee * 100)),
        netAmountCents: -BigInt(Math.round(amount * 100)),
        currency: 'ZAR',
        status: 'processing',
        description,
        reference: `${providerId.toUpperCase().slice(0, 3)}-${Date.now()}`,
        category: 'International Transfer',
        counterpartyName: recipientName,
        counterpartyPhone: maskedPhone,
        paymentMethod: providerId,
        processedAt: new Date(),
        updatedAt: new Date(),
      }
    });
    
    // Update wallet balance
    await db.consumerWallet.update({
      where: { userId: DEMO_USER_ID },
      data: {
        balanceCents: wallet.balanceCents - totalCents,
        dailySpentCents: wallet.dailySpentCents + totalCents,
        monthlySpentCents: wallet.monthlySpentCents + totalCents,
        totalSentCents: wallet.totalSentCents + totalCents,
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
        destination: country.name,
        countryCode,
        amount,
        fee: provider.fee,
        rate: provider.rate * rate,
        totalZar: totalAmount,
        receiveAmount,
        currency: country.currency,
        recipient: recipientName,
        recipientPhone: maskedPhone,
        paymentMethod,
        date: txn.createdAt.toISOString(),
        status: txn.status,
        reference: txn.reference,
        newBalance: Number(wallet.balanceCents - totalCents) / 100,
      },
      message: `Transfer of R${amount.toFixed(2)} to ${recipientName} in ${country.name} initiated. Expected delivery: 24-48 hours.`,
    });
  } catch (error) {
    console.error('Transfers POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process transfer' }, { status: 500 });
  }
}
