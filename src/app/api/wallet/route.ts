import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { performFraudCheck, recordVelocity } from '@/lib/fraud-detection-service';

// Demo user ID - in production this would come from authentication
const DEMO_USER_ID = 'demo-consumer-user-001';

// Transaction categories with icons and colors
export const TRANSACTION_CATEGORIES = [
  { id: 'airtime', name: 'Airtime & Data', icon: 'Smartphone', color: '#E91E63' },
  { id: 'electricity', name: 'Electricity', icon: 'Zap', color: '#FF9800' },
  { id: 'water', name: 'Water', icon: 'Droplets', color: '#2196F3' },
  { id: 'transfer', name: 'Transfers (P2P)', icon: 'ArrowLeftRight', color: '#9C27B0' },
  { id: 'bills', name: 'Bill Payments', icon: 'FileText', color: '#00BCD4' },
  { id: 'bnpl', name: 'BNPL Payments', icon: 'CreditCard', color: '#E91E63' },
  { id: 'payplus', name: 'Pay+ Advances', icon: 'TrendingUp', color: '#FF9800' },
  { id: 'card', name: 'Card Transactions', icon: 'CreditCard', color: '#607D8B' },
  { id: 'voucher', name: 'Vouchers', icon: 'Ticket', color: '#FF5722' },
  { id: 'insurance', name: 'Insurance', icon: 'Shield', color: '#4CAF50' },
  { id: 'topup', name: 'Top Up', icon: 'Plus', color: '#009688' },
  { id: 'other', name: 'Other', icon: 'MoreHorizontal', color: '#9E9E9E' },
];

// Helper to ensure demo user exists
async function ensureDemoUser() {
  let user = await db.consumerUser.findUnique({
    where: { id: DEMO_USER_ID }
  });
  
  if (!user) {
    // Create demo user
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
    
    // Create wallet for user
    const walletNow = new Date();
    await db.consumerWallet.create({
      data: {
        id: 'demo-wallet-001',
        userId: DEMO_USER_ID,
        balanceCents: BigInt(1245000), // R12,450.00
        currency: 'ZAR',
        dailySpendLimit: BigInt(500000), // R5,000
        monthlySpendLimit: BigInt(50000000), // R500,000
        totalReceivedCents: BigInt(15000000),
        totalSentCents: BigInt(3550000),
        totalTopupsCents: BigInt(20000000),
        createdAt: walletNow,
        updatedAt: walletNow,
      }
    });
    
    // Create loyalty for user
    const loyaltyNow = new Date();
    await db.consumerLoyalty.create({
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

    // Create sample transactions for demo
    await createSampleTransactions();
  }
  
  // Ensure wallet exists
  let wallet = await db.consumerWallet.findUnique({
    where: { userId: DEMO_USER_ID }
  });
  
  if (!wallet) {
    const fallbackNow = new Date();
    wallet = await db.consumerWallet.create({
      data: {
        id: `wallet-${DEMO_USER_ID}`,
        userId: DEMO_USER_ID,
        balanceCents: BigInt(1245000),
        currency: 'ZAR',
        createdAt: fallbackNow,
        updatedAt: fallbackNow,
      }
    });
  }
  
  return user;
}

// Create sample transactions for demo
async function createSampleTransactions() {
  const sampleTransactions = [
    { type: 'airtime', merchant: 'Vodacom', amount: -5000, category: 'Airtime & Data', desc: 'Vodacom Airtime R50' },
    { type: 'electricity', merchant: 'Eskom', amount: -35000, category: 'Electricity', desc: 'Electricity Token - 350 kWh' },
    { type: 'transfer', merchant: 'Lerato Mokoena', amount: -150000, category: 'Transfer', desc: 'P2P Payment' },
    { type: 'topup', merchant: 'FNB', amount: 500000, category: 'Top Up', desc: 'Wallet Top-up via EFT' },
    { type: 'bills', merchant: 'City of Johannesburg', amount: -125000, category: 'Bill Payments', desc: 'Water & Rates' },
    { type: 'airtime', merchant: 'MTN', amount: -10000, category: 'Airtime & Data', desc: 'MTN Data Bundle 1GB' },
    { type: 'transfer', merchant: 'Sipho Khumalo', amount: -75000, category: 'Transfer', desc: 'P2P Payment' },
    { type: 'card', merchant: 'Shoprite', amount: -45000, category: 'Card Transactions', desc: 'Groceries' },
    { type: 'bnpl', merchant: 'Game', amount: -12000, category: 'BNPL Payments', desc: 'BNPL Installment - TV' },
    { type: 'voucher', merchant: 'Netflix', amount: -15900, category: 'Vouchers', desc: 'Netflix Subscription' },
    { type: 'payplus', merchant: 'Pay+', amount: -250000, category: 'Pay+ Advances', desc: 'Early Wage Access Repayment' },
    { type: 'insurance', merchant: 'Hollard', amount: -35000, category: 'Insurance', desc: 'Funeral Cover Premium' },
    { type: 'water', merchant: 'Rand Water', amount: -18000, category: 'Water', desc: 'Water Bill Payment' },
    { type: 'transfer', merchant: 'Nomsa Dlamini', amount: 200000, category: 'Transfer', desc: 'Payment Received' },
    { type: 'airtime', merchant: 'Cell C', amount: -2500, category: 'Airtime & Data', desc: 'Cell C Airtime R25' },
    { type: 'bills', merchant: 'DStv', amount: -89900, category: 'Bill Payments', desc: 'DStv Premium' },
    { type: 'card', merchant: 'Spar', amount: -32000, category: 'Card Transactions', desc: 'Groceries' },
    { type: 'transfer', merchant: 'John Smith', amount: -50000, category: 'Transfer', desc: 'P2P Payment' },
    { type: 'electricity', merchant: 'City Power', amount: -50000, category: 'Electricity', desc: 'Prepaid Electricity' },
    { type: 'topup', merchant: 'Capitec', amount: 300000, category: 'Top Up', desc: 'Wallet Top-up' },
  ];

  for (let i = 0; i < sampleTransactions.length; i++) {
    const tx = sampleTransactions[i];
    const daysAgo = i + 1;
    const txDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    const direction = tx.amount >= 0 ? 'credit' : 'debit';
    
    await db.consumerTransaction.create({
      data: {
        id: `TXN${Date.now()}-${i}`,
        idempotencyKey: `IDM${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
        userId: DEMO_USER_ID,
        transactionType: tx.type,
        direction,
        amountCents: BigInt(Math.abs(tx.amount)),
        feeCents: BigInt(0),
        netAmountCents: BigInt(tx.amount),
        currency: 'ZAR',
        status: 'completed',
        description: tx.desc,
        reference: `REF${Date.now()}-${i}`,
        category: tx.category,
        counterpartyName: tx.merchant,
        merchantName: tx.merchant,
        paymentMethod: tx.type === 'topup' ? 'bank_transfer' : tx.type === 'card' ? 'card' : 'wallet',
        processedAt: txDate,
        completedAt: txDate,
        createdAt: txDate,
        updatedAt: txDate,
      }
    });
  }
}

// GET - Retrieve wallet balance and transactions with filtering, search, and pagination
export async function GET(request: NextRequest) {
  try {
    await ensureDemoUser();
    
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    
    const wallet = await db.consumerWallet.findUnique({
      where: { userId: DEMO_USER_ID }
    });
    
    if (!wallet) {
      return NextResponse.json({ success: false, error: 'Wallet not found' }, { status: 404 });
    }
    
    if (action === 'balance') {
      return NextResponse.json({
        success: true,
        data: {
          balance: Number(wallet.balanceCents) / 100,
          currency: wallet.currency,
          lastUpdated: wallet.updatedAt.toISOString(),
        },
      });
    }
    
    if (action === 'categories') {
      return NextResponse.json({
        success: true,
        data: TRANSACTION_CATEGORIES,
      });
    }
    
    if (action === 'transactions' || action === 'history') {
      // Pagination parameters
      const limit = parseInt(searchParams.get('limit') || '20');
      const cursor = searchParams.get('cursor'); // Cursor-based pagination
      const offset = parseInt(searchParams.get('offset') || '0');
      
      // Search and filter parameters
      const search = searchParams.get('search')?.toLowerCase() || '';
      const category = searchParams.get('category') || '';
      const status = searchParams.get('status') || '';
      const dateFrom = searchParams.get('dateFrom');
      const dateTo = searchParams.get('dateTo');
      const minAmount = searchParams.get('minAmount');
      const maxAmount = searchParams.get('maxAmount');
      const direction = searchParams.get('direction'); // 'credit' or 'debit'
      
      // Build where clause
      const where: any = { userId: DEMO_USER_ID };
      
      // Category filter (SQLite is case-insensitive by default)
      if (category && category !== 'all') {
        where.category = category;
      }
      
      // Status filter
      if (status && status !== 'all') {
        where.status = status;
      }
      
      // Direction filter
      if (direction && direction !== 'all') {
        where.direction = direction;
      }
      
      // Date range filter
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) {
          where.createdAt.gte = new Date(dateFrom);
        }
        if (dateTo) {
          where.createdAt.lte = new Date(dateTo + 'T23:59:59.999Z');
        }
      }
      
      // Amount range filter (convert to cents)
      if (minAmount || maxAmount) {
        const minCents = minAmount ? BigInt(Math.round(parseFloat(minAmount) * 100)) : null;
        const maxCents = maxAmount ? BigInt(Math.round(parseFloat(maxAmount) * 100)) : null;
        
        if (minCents || maxCents) {
          where.netAmountCents = {};
          if (minCents) {
            where.netAmountCents.gte = minCents;
          }
          if (maxCents) {
            where.netAmountCents.lte = maxCents;
          }
        }
      }
      
      // Get total count
      const total = await db.consumerTransaction.count({ where });
      
      // Build query
      let query: any = {
        where,
        orderBy: { createdAt: 'desc' },
        take: limit + 1, // Take one extra to determine if there's more
      };
      
      // Cursor-based pagination
      if (cursor) {
        query.cursor = { id: cursor };
        query.skip = 1; // Skip the cursor
      } else if (action === 'history') {
        // Use offset for history view
        query.skip = offset;
      }
      
      const transactions = await db.consumerTransaction.findMany(query);
      
      // Apply search filter in-memory (since Prisma doesn't support full-text search on all fields)
      let filteredTransactions = transactions;
      if (search) {
        filteredTransactions = transactions.filter((tx: any) => {
          const searchFields = [
            tx.description,
            tx.counterpartyName,
            tx.merchantName,
            tx.reference,
            tx.category,
          ].filter(Boolean).map(f => f.toLowerCase());
          
          return searchFields.some(f => f.includes(search)) ||
            (Math.abs(Number(tx.netAmountCents)) / 100).toString().includes(search);
        });
      }
      
      // Determine if there's more data
      const hasMore = filteredTransactions.length > limit;
      const results = hasMore ? filteredTransactions.slice(0, limit) : filteredTransactions;
      
      // Get next cursor
      const nextCursor = hasMore && results.length > 0 ? results[results.length - 1].id : null;
      
      return NextResponse.json({
        success: true,
        data: {
          transactions: results.map((tx: any) => ({
            id: tx.id,
            type: tx.direction,
            transactionType: tx.transactionType,
            amount: Number(tx.netAmountCents) / 100,
            absoluteAmount: Math.abs(Number(tx.netAmountCents)) / 100,
            fee: Number(tx.feeCents) / 100,
            category: tx.category || 'Other',
            description: tx.description,
            merchant: tx.counterpartyName || tx.merchantName || 'Unknown',
            merchantName: tx.merchantName,
            counterpartyName: tx.counterpartyName,
            counterpartyPhone: tx.counterpartyPhone,
            timestamp: tx.createdAt.toISOString(),
            date: tx.createdAt.toISOString().split('T')[0],
            time: tx.createdAt.toISOString().split('T')[1]?.substring(0, 5),
            status: tx.status,
            reference: tx.reference,
            paymentMethod: tx.paymentMethod,
            cardLastFour: tx.cardLastFour,
            // Voucher/Token information for traceability
            voucherToken: tx.voucherToken,
            voucherExpiry: tx.voucherExpiry,
            meterNumber: tx.meterNumber,
            unitsPurchased: tx.unitsPurchased,
          })),
          pagination: {
            total,
            limit,
            offset: cursor ? 0 : offset,
            hasMore,
            nextCursor,
          },
          filters: {
            search,
            category,
            status,
            dateFrom,
            dateTo,
            minAmount,
            maxAmount,
            direction,
          },
        },
      });
    }
    
    // Get recent transactions
    const recentTransactions = await db.consumerTransaction.findMany({
      where: { userId: DEMO_USER_ID },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    
    // Return full wallet data
    return NextResponse.json({
      success: true,
      data: {
        balance: Number(wallet.balanceCents) / 100,
        currency: wallet.currency,
        lastUpdated: wallet.updatedAt.toISOString(),
        dailySpent: Number(wallet.dailySpentCents || 0) / 100,
        monthlySpent: Number(wallet.monthlySpentCents || 0) / 100,
        recentTransactions: recentTransactions.map(tx => ({
          id: tx.id,
          type: tx.direction,
          transactionType: tx.transactionType,
          amount: Number(tx.netAmountCents) / 100,
          absoluteAmount: Math.abs(Number(tx.netAmountCents)) / 100,
          category: tx.category || 'Other',
          description: tx.description,
          merchant: tx.counterpartyName || tx.merchantName || 'Unknown',
          timestamp: tx.createdAt.toISOString(),
          status: tx.status,
          reference: tx.reference,
          // Voucher/Token information for traceability
          voucherToken: tx.voucherToken,
          voucherExpiry: tx.voucherExpiry,
          meterNumber: tx.meterNumber,
          unitsPurchased: tx.unitsPurchased,
        })),
      },
    });
  } catch (error) {
    console.error('Wallet GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch wallet data' }, { status: 500 });
  }
}

// POST - Perform wallet actions
export async function POST(request: NextRequest) {
  try {
    await ensureDemoUser();
    
    const body = await request.json();
    const { action, amount, recipient, reference, paymentMethod, counterpartyPhone, deviceId, ipAddress, location } = body;
    
    const wallet = await db.consumerWallet.findUnique({
      where: { userId: DEMO_USER_ID }
    });
    
    if (!wallet) {
      return NextResponse.json({ success: false, error: 'Wallet not found' }, { status: 404 });
    }
    
    switch (action) {
      case 'topup': {
        if (!amount || amount <= 0) {
          return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 });
        }
        
        const amountCents = BigInt(Math.round(amount * 100));
        
        // Create transaction
        const txnNow = new Date();
        const txn = await db.consumerTransaction.create({
          data: {
            id: `TXN${Date.now()}`,
            idempotencyKey: `IDM${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            userId: DEMO_USER_ID,
            transactionType: 'topup',
            direction: 'credit',
            amountCents,
            feeCents: BigInt(0),
            netAmountCents: amountCents,
            currency: 'ZAR',
            status: 'completed',
            description: 'Wallet Top-up',
            reference: reference || `TOP${Date.now()}`,
            category: 'Top Up',
            counterpartyName: paymentMethod || 'Bank Transfer',
            paymentMethod: paymentMethod || 'bank_transfer',
            processedAt: txnNow,
            completedAt: txnNow,
            createdAt: txnNow,
            updatedAt: txnNow,
          }
        });
        
        // Update wallet balance
        await db.consumerWallet.update({
          where: { userId: DEMO_USER_ID },
          data: {
            balanceCents: wallet.balanceCents + amountCents,
            totalTopupsCents: wallet.totalTopupsCents + amountCents,
            updatedAt: new Date(),
          }
        });
        
        return NextResponse.json({
          success: true,
          data: {
            transaction: {
              id: txn.id,
              type: txn.direction,
              amount: Number(txn.netAmountCents) / 100,
              description: txn.description,
              timestamp: txn.createdAt.toISOString(),
              status: txn.status,
            },
            newBalance: Number(wallet.balanceCents + amountCents) / 100,
          },
          message: `Successfully topped up R ${amount.toFixed(2)}`,
        });
      }
      
      case 'send': {
        if (!amount || amount <= 0) {
          return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 });
        }
        if (!recipient && !counterpartyPhone) {
          return NextResponse.json({ success: false, error: 'Recipient required' }, { status: 400 });
        }
        
        const amountCents = BigInt(Math.round(amount * 100));
        
        if (wallet.balanceCents < amountCents) {
          return NextResponse.json({ success: false, error: 'Insufficient funds' }, { status: 400 });
        }
        
        // === FRAUD DETECTION CHECK ===
        const fraudCheckResult = await performFraudCheck({
          entityType: 'consumer',
          entityId: DEMO_USER_ID,
          amount: amount,
          currency: 'ZAR',
          userId: DEMO_USER_ID,
          deviceId: deviceId,
          ipAddress: ipAddress,
          location: location,
          sourceApp: 'consumer_wallet',
          metadata: {
            transactionType: 'p2p_send',
            recipient: recipient || counterpartyPhone,
          }
        });
        
        // Block transaction if fraud check fails
        if (fraudCheckResult.blocked || fraudCheckResult.recommendation === 'block') {
          return NextResponse.json({ 
            success: false, 
            error: 'Transaction blocked due to security concerns',
            fraudCheck: {
              riskScore: fraudCheckResult.riskScore,
              alerts: fraudCheckResult.alerts.map(a => ({
                type: a.type,
                severity: a.severity,
                description: a.description
              }))
            }
          }, { status: 403 });
        }
        
        // Flag for review but allow
        const requiresReview = fraudCheckResult.recommendation === 'review';
        
        // Create transaction
        const sendNow = new Date();
        const txn = await db.consumerTransaction.create({
          data: {
            id: `TXN${Date.now()}`,
            idempotencyKey: `IDM${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            userId: DEMO_USER_ID,
            transactionType: 'p2p_send',
            direction: 'debit',
            amountCents: -amountCents,
            feeCents: BigInt(0),
            netAmountCents: -amountCents,
            currency: 'ZAR',
            status: 'completed',
            description: `Payment to ${recipient || counterpartyPhone}`,
            reference: reference || `P2P${Date.now()}`,
            category: 'Transfer',
            counterpartyName: recipient,
            counterpartyPhone: counterpartyPhone,
            paymentMethod: paymentMethod || 'wallet',
            processedAt: sendNow,
            completedAt: sendNow,
            createdAt: sendNow,
            updatedAt: sendNow,
          }
        });
        
        // Update wallet balance
        await db.consumerWallet.update({
          where: { userId: DEMO_USER_ID },
          data: {
            balanceCents: wallet.balanceCents - amountCents,
            totalSentCents: wallet.totalSentCents + amountCents,
            dailySpentCents: wallet.dailySpentCents + amountCents,
            monthlySpentCents: wallet.monthlySpentCents + amountCents,
            updatedAt: new Date(),
          }
        });
        
        // Record velocity for fraud detection
        await recordVelocity({
          entityType: 'consumer',
          entityId: DEMO_USER_ID,
          amount: amount,
          transactionId: txn.id,
          sourceApp: 'consumer_wallet'
        });
        
        // Award loyalty points (10 points per R1)
        await awardLoyaltyPoints(amount);
        
        return NextResponse.json({
          success: true,
          data: {
            transaction: {
              id: txn.id,
              type: txn.direction,
              amount: Math.abs(Number(txn.netAmountCents)) / 100,
              description: txn.description,
              timestamp: txn.createdAt.toISOString(),
              status: txn.status,
              reference: txn.reference,
            },
            newBalance: Number(wallet.balanceCents - amountCents) / 100,
            securityWarning: requiresReview ? 'Transaction flagged for review due to unusual activity' : undefined,
            riskScore: fraudCheckResult.riskScore,
          },
          message: `Successfully sent R ${amount.toFixed(2)} to ${recipient || counterpartyPhone}`,
        });
      }
      
      case 'receive': {
        if (!amount || amount <= 0) {
          return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 });
        }
        
        const amountCents = BigInt(Math.round(amount * 100));
        const sender = body.sender || 'Unknown';
        
        // Create transaction
        const receiveNow = new Date();
        const txn = await db.consumerTransaction.create({
          data: {
            id: `TXN${Date.now()}`,
            idempotencyKey: `IDM${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            userId: DEMO_USER_ID,
            transactionType: 'p2p_receive',
            direction: 'credit',
            amountCents,
            feeCents: BigInt(0),
            netAmountCents: amountCents,
            currency: 'ZAR',
            status: 'completed',
            description: 'Payment Received',
            reference: reference || `RCV${Date.now()}`,
            category: 'Transfer',
            counterpartyName: sender,
            paymentMethod: 'wallet',
            processedAt: receiveNow,
            completedAt: receiveNow,
            createdAt: receiveNow,
            updatedAt: receiveNow,
          }
        });
        
        // Update wallet balance
        await db.consumerWallet.update({
          where: { userId: DEMO_USER_ID },
          data: {
            balanceCents: wallet.balanceCents + amountCents,
            totalReceivedCents: wallet.totalReceivedCents + amountCents,
            updatedAt: new Date(),
          }
        });
        
        return NextResponse.json({
          success: true,
          data: {
            transaction: {
              id: txn.id,
              type: txn.direction,
              amount: Number(txn.netAmountCents) / 100,
              description: txn.description,
              timestamp: txn.createdAt.toISOString(),
              status: txn.status,
              reference: txn.reference,
            },
            newBalance: Number(wallet.balanceCents + amountCents) / 100,
          },
          message: `Successfully received R ${amount.toFixed(2)}`,
        });
      }
      
      case 'dispute': {
        const { transactionId, reason } = body;
        
        if (!transactionId) {
          return NextResponse.json({ success: false, error: 'Transaction ID required' }, { status: 400 });
        }
        
        // Update transaction with dispute info
        const disputedTx = await db.consumerTransaction.update({
          where: { id: transactionId },
          data: {
            disputedAt: new Date(),
            disputeReason: reason || 'Customer dispute',
            disputeStatus: 'pending',
            updatedAt: new Date(),
          }
        });
        
        return NextResponse.json({
          success: true,
          data: {
            transaction: {
              id: disputedTx.id,
              disputeStatus: disputedTx.disputeStatus,
            }
          },
          message: 'Dispute submitted successfully. Our team will review within 48 hours.',
        });
      }
      
      case 'export': {
        const { format, filters } = body;
        
        // Get all transactions matching filters
        const where: any = { userId: DEMO_USER_ID };
        
        if (filters?.category && filters.category !== 'all') {
          where.category = filters.category;
        }
        if (filters?.dateFrom || filters?.dateTo) {
          where.createdAt = {};
          if (filters.dateFrom) {
            where.createdAt.gte = new Date(filters.dateFrom);
          }
          if (filters.dateTo) {
            where.createdAt.lte = new Date(filters.dateTo + 'T23:59:59.999Z');
          }
        }
        
        const exportTransactions = await db.consumerTransaction.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: 1000, // Limit exports to 1000 transactions
        });
        
        if (format === 'csv') {
          // Generate CSV
          const headers = ['Date', 'Time', 'Reference', 'Description', 'Category', 'Merchant', 'Amount', 'Fee', 'Status'];
          const rows = exportTransactions.map((tx: any) => [
            tx.createdAt.toISOString().split('T')[0],
            tx.createdAt.toISOString().split('T')[1]?.substring(0, 8),
            tx.reference || '',
            tx.description || '',
            tx.category || 'Other',
            tx.counterpartyName || tx.merchantName || 'Unknown',
            (Number(tx.netAmountCents) / 100).toFixed(2),
            (Number(tx.feeCents) / 100).toFixed(2),
            tx.status,
          ]);
          
          const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
          
          return NextResponse.json({
            success: true,
            data: {
              csv,
              filename: `transactions_${new Date().toISOString().split('T')[0]}.csv`,
              count: exportTransactions.length,
            }
          });
        }
        
        if (format === 'pdf') {
          // Return PDF data for frontend generation
          return NextResponse.json({
            success: true,
            data: {
              transactions: exportTransactions.map((tx: any) => ({
                date: tx.createdAt.toISOString().split('T')[0],
                time: tx.createdAt.toISOString().split('T')[1]?.substring(0, 5),
                reference: tx.reference,
                description: tx.description,
                category: tx.category || 'Other',
                merchant: tx.counterpartyName || tx.merchantName || 'Unknown',
                amount: Number(tx.netAmountCents) / 100,
                fee: Number(tx.feeCents) / 100,
                status: tx.status,
              })),
              filename: `transactions_${new Date().toISOString().split('T')[0]}.pdf`,
              count: exportTransactions.length,
              generatedAt: new Date().toISOString(),
            }
          });
        }
        
        return NextResponse.json({ success: false, error: 'Invalid export format' }, { status: 400 });
      }
      
      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Wallet POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process request' }, { status: 500 });
  }
}

// Helper function to award loyalty points
async function awardLoyaltyPoints(amount: number) {
  const loyalty = await db.consumerLoyalty.findUnique({
    where: { userId: DEMO_USER_ID }
  });
  
  if (!loyalty) return;
  
  // Calculate points based on tier multiplier
  const multiplier = loyalty.tier === 'platinum' ? 3 : loyalty.tier === 'gold' ? 2 : loyalty.tier === 'silver' ? 1.5 : 1;
  const points = Math.round(amount * multiplier * 10); // 10 points per R1 base
  
  // Update loyalty
  await db.consumerLoyalty.update({
    where: { userId: DEMO_USER_ID },
    data: {
      points: loyalty.points + points,
      totalEarned: loyalty.totalEarned + points,
      updatedAt: new Date(),
    }
  });
}
