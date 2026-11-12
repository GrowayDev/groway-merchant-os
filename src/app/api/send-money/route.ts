import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Demo user ID - in production this would come from authentication
const DEMO_USER_ID = 'demo-consumer-user-001';

// PayShap participating banks
const PAYSHAP_BANKS = [
  { id: 'fnb', name: 'FNB', shortCode: '250655', limits: { min: 10, max: 3000, daily: 25000 } },
  { id: 'standard', name: 'Standard Bank', shortCode: '051001', limits: { min: 10, max: 3000, daily: 25000 } },
  { id: 'absa', name: 'ABSA', shortCode: '632005', limits: { min: 10, max: 3000, daily: 25000 } },
  { id: 'nedbank', name: 'Nedbank', shortCode: '198765', limits: { min: 10, max: 3000, daily: 25000 } },
  { id: 'capitec', name: 'Capitec', shortCode: '470010', limits: { min: 10, max: 3000, daily: 25000 } },
  { id: 'investec', name: 'Investec', shortCode: '580105', limits: { min: 10, max: 5000, daily: 50000 } },
  { id: 'african', name: 'African Bank', shortCode: '430000', limits: { min: 10, max: 3000, daily: 25000 } },
  { id: 'tdbank', name: 'TymeBank', shortCode: '678999', limits: { min: 10, max: 3000, daily: 25000 } },
  { id: 'discovery', name: 'Discovery Bank', shortCode: '679000', limits: { min: 10, max: 5000, daily: 50000 } },
];

// MTN MoMo configuration
const MTN_MOMO_CONFIG = {
  provider: 'MTN Mobile Money',
  currency: 'ZAR',
  limits: { min: 10, max: 5000, daily: 25000 },
  feeStructure: [
    { min: 0, max: 100, fee: 0 },
    { min: 101, max: 500, fee: 5 },
    { min: 501, max: 1000, fee: 10 },
    { min: 1001, max: 2000, fee: 15 },
    { min: 2001, max: 5000, fee: 25 },
  ],
};

// PayShap identifier types
const PAYSHAP_IDENTIFIER_TYPES = [
  { id: 'phone', label: 'Phone Number', description: 'Send to mobile number', format: '+27 XX XXX XXXX' },
  { id: 'shapid', label: 'ShapID', description: 'Send to ShapID (email-like)', format: 'name@bank' },
  { id: 'qr', label: 'QR Code', description: 'Scan to pay', format: 'QR' },
];

// Helper to ensure demo user
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

// Calculate MoMo fee
function calculateMoMoFee(amount: number): number {
  for (const tier of MTN_MOMO_CONFIG.feeStructure) {
    if (amount >= tier.min && amount <= tier.max) {
      return tier.fee;
    }
  }
  return 25; // Default fee for larger amounts
}

// Validate South African phone number
function validateSAPhone(phone: string): { valid: boolean; formatted?: string; error?: string } {
  // Remove spaces and dashes
  const cleaned = phone.replace(/[\s-]/g, '');
  
  // Check for valid SA phone formats
  const patterns = [
    /^(\+27|0)(\d{9})$/, // +27 or 0 followed by 9 digits
    /^27(\d{9})$/, // 27 followed by 9 digits
  ];
  
  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match) {
      // Format to +27 XX XXX XXXX
      const digits = match[match.length - 1];
      const formatted = `+27 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
      return { valid: true, formatted };
    }
  }
  
  return { valid: false, error: 'Invalid South African phone number' };
}

// GET - Get PayShap banks, MoMo config, and recipient validation
export async function GET(request: NextRequest) {
  try {
    await ensureDemoUser();
    
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    
    if (action === 'banks') {
      return NextResponse.json({
        success: true,
        data: PAYSHAP_BANKS,
      });
    }
    
    if (action === 'momo-config') {
      return NextResponse.json({
        success: true,
        data: MTN_MOMO_CONFIG,
      });
    }
    
    if (action === 'identifier-types') {
      return NextResponse.json({
        success: true,
        data: PAYSHAP_IDENTIFIER_TYPES,
      });
    }
    
    if (action === 'validate-phone') {
      const phone = searchParams.get('phone');
      if (!phone) {
        return NextResponse.json({ success: false, error: 'Phone number required' }, { status: 400 });
      }
      
      const validation = validateSAPhone(phone);
      return NextResponse.json({
        success: true,
        data: validation,
      });
    }
    
    if (action === 'estimate') {
      const method = searchParams.get('method'); // 'payshap' or 'momo'
      const amount = parseFloat(searchParams.get('amount') || '0');
      
      if (!amount || amount <= 0) {
        return NextResponse.json({ success: false, error: 'Valid amount required' }, { status: 400 });
      }
      
      let fee = 0;
      let total = amount;
      let limits = { min: 10, max: 5000, daily: 25000 };
      
      if (method === 'payshap') {
        fee = 0; // PayShap is typically free for small amounts
        limits = { min: 10, max: 3000, daily: 25000 };
      } else if (method === 'momo') {
        fee = calculateMoMoFee(amount);
        limits = MTN_MOMO_CONFIG.limits;
      }
      
      total = amount + fee;
      
      return NextResponse.json({
        success: true,
        data: {
          amount,
          fee,
          total,
          limits,
          withinLimits: amount >= limits.min && amount <= limits.max,
        },
      });
    }
    
    if (action === 'recipients') {
      // Get recent recipients from transaction history
      const transactions = await db.consumerTransaction.findMany({
        where: {
          userId: DEMO_USER_ID,
          transactionType: { in: ['p2p_send', 'payshap_send', 'momo_send'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
      
      // Deduplicate by counterparty
      const seenNames = new Set<string>();
      const recentRecipients = transactions
        .filter((tx: any) => {
          if (!tx.counterpartyName || seenNames.has(tx.counterpartyName)) return false;
          seenNames.add(tx.counterpartyName);
          return true;
        })
        .map((tx: any) => ({
          name: tx.counterpartyName,
          phone: tx.counterpartyPhone,
          lastSent: tx.createdAt.toISOString(),
          bank: tx.paymentMethod?.includes('payshap') ? tx.paymentMethod.split('-')[1] : null,
        }));
      
      return NextResponse.json({
        success: true,
        data: recentRecipients,
      });
    }
    
    if (action === 'history') {
      const limit = parseInt(searchParams.get('limit') || '20');
      
      const transactions = await db.consumerTransaction.findMany({
        where: {
          userId: DEMO_USER_ID,
          transactionType: { in: ['p2p_send', 'payshap_send', 'momo_send', 'p2p_receive'] },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
      
      return NextResponse.json({
        success: true,
        data: transactions.map((tx: any) => ({
          id: tx.id,
          type: tx.transactionType,
          direction: tx.direction,
          amount: Math.abs(Number(tx.netAmountCents)) / 100,
          fee: Number(tx.feeCents) / 100,
          recipient: tx.counterpartyName,
          recipientPhone: tx.counterpartyPhone,
          method: tx.paymentMethod,
          status: tx.status,
          reference: tx.reference,
          timestamp: tx.createdAt.toISOString(),
        })),
      });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        payshapBanks: PAYSHAP_BANKS,
        momoConfig: MTN_MOMO_CONFIG,
        identifierTypes: PAYSHAP_IDENTIFIER_TYPES,
      },
    });
  } catch (error) {
    console.error('Send Money GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch send money data' }, { status: 500 });
  }
}

// POST - Send money via PayShap or MTN MoMo
export async function POST(request: NextRequest) {
  try {
    await ensureDemoUser();
    
    const body = await request.json();
    const { method, amount, recipientName, recipientPhone, recipientBank, shapId, note, pin } = body;
    
    // Validate required fields
    if (!method || !amount || !recipientName) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: method, amount, recipientName',
      }, { status: 400 });
    }
    
    if (amount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 });
    }
    
    // Get wallet
    const wallet = await db.consumerWallet.findUnique({
      where: { userId: DEMO_USER_ID }
    });
    
    if (!wallet) {
      return NextResponse.json({ success: false, error: 'Wallet not found' }, { status: 404 });
    }
    
    let fee = 0;
    let limits = { min: 10, max: 5000, daily: 25000 };
    let transactionType = 'p2p_send';
    let paymentMethod = 'wallet';
    let description = `Payment to ${recipientName}`;
    
    // Configure based on method
    if (method === 'payshap') {
      // PayShap specific validation
      if (!recipientPhone && !shapId) {
        return NextResponse.json({
          success: false,
          error: 'Either recipientPhone or shapId is required for PayShap',
        }, { status: 400 });
      }
      
      const bank = PAYSHAP_BANKS.find(b => b.id === recipientBank);
      if (recipientBank && !bank) {
        return NextResponse.json({ success: false, error: 'Invalid bank' }, { status: 400 });
      }
      
      limits = bank?.limits || { min: 10, max: 3000, daily: 25000 };
      fee = 0; // PayShap is free
      transactionType = 'payshap_send';
      paymentMethod = recipientBank ? `payshap-${recipientBank}` : 'payshap';
      description = `PayShap to ${recipientName}${bank ? ` (${bank.name})` : ''}`;
      
    } else if (method === 'momo') {
      // MTN MoMo specific validation
      if (!recipientPhone) {
        return NextResponse.json({
          success: false,
          error: 'Phone number is required for MTN MoMo',
        }, { status: 400 });
      }
      
      const phoneValidation = validateSAPhone(recipientPhone);
      if (!phoneValidation.valid) {
        return NextResponse.json({ success: false, error: phoneValidation.error }, { status: 400 });
      }
      
      fee = calculateMoMoFee(amount);
      limits = MTN_MOMO_CONFIG.limits;
      transactionType = 'momo_send';
      paymentMethod = 'mtn-momo';
      description = `MTN MoMo to ${recipientName}`;
      
    } else if (method === 'wallet') {
      // Standard wallet-to-wallet transfer
      if (!recipientPhone) {
        return NextResponse.json({
          success: false,
          error: 'Phone number is required',
        }, { status: 400 });
      }
      
      fee = 0;
      limits = { min: 1, max: 50000, daily: 100000 };
      transactionType = 'p2p_send';
      paymentMethod = 'wallet';
      description = `Wallet transfer to ${recipientName}`;
      
    } else {
      return NextResponse.json({ success: false, error: 'Invalid method' }, { status: 400 });
    }
    
    // Validate limits
    if (amount < limits.min || amount > limits.max) {
      return NextResponse.json({
        success: false,
        error: `Amount must be between R${limits.min} and R${limits.max} for ${method}`,
      }, { status: 400 });
    }
    
    const totalAmount = amount + fee;
    const totalCents = BigInt(Math.round(totalAmount * 100));
    
    // Check balance
    if (wallet.balanceCents < totalCents) {
      return NextResponse.json({ success: false, error: 'Insufficient funds' }, { status: 400 });
    }
    
    // Mask phone number for privacy
    const maskedPhone = recipientPhone?.replace(/(\+27\s?\d{2})\s?\d{3}\s?(\d{4})/, '$1 *** $2');
    
    // Create transaction
    const txn = await db.consumerTransaction.create({
      data: {
        id: `TXN${Date.now()}`,
        idempotencyKey: `IDM${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: DEMO_USER_ID,
        transactionType,
        direction: 'debit',
        amountCents: -BigInt(Math.round(amount * 100)),
        feeCents: BigInt(Math.round(fee * 100)),
        netAmountCents: -totalCents,
        currency: 'ZAR',
        status: 'completed',
        description: note ? `${description} - ${note}` : description,
        reference: `${method.toUpperCase()}-${Date.now()}`,
        category: 'Transfer',
        counterpartyName: recipientName,
        counterpartyPhone: maskedPhone,
        paymentMethod,
        processedAt: new Date(),
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });
    
    // Update wallet balance
    await db.consumerWallet.update({
      where: { userId: DEMO_USER_ID },
      data: {
        balanceCents: wallet.balanceCents - totalCents,
        totalSentCents: wallet.totalSentCents + BigInt(Math.round(amount * 100)),
        dailySpentCents: (wallet.dailySpentCents || BigInt(0)) + totalCents,
        monthlySpentCents: (wallet.monthlySpentCents || BigInt(0)) + totalCents,
        updatedAt: new Date(),
      }
    });
    
    // Award loyalty points
    const loyalty = await db.consumerLoyalty.findUnique({
      where: { userId: DEMO_USER_ID }
    });
    
    if (loyalty) {
      const points = Math.round(amount * 10);
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
        transaction: {
          id: txn.id,
          type: txn.transactionType,
          amount,
          fee,
          total: totalAmount,
          recipient: recipientName,
          recipientPhone: maskedPhone,
          method,
          status: txn.status,
          reference: txn.reference,
          timestamp: txn.createdAt.toISOString(),
        },
        newBalance: Number(wallet.balanceCents - totalCents) / 100,
      },
      message: `Successfully sent R ${amount.toFixed(2)} to ${recipientName} via ${method === 'payshap' ? 'PayShap' : method === 'momo' ? 'MTN MoMo' : 'Wallet'}`,
    });
  } catch (error) {
    console.error('Send Money POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to send money' }, { status: 500 });
  }
}
