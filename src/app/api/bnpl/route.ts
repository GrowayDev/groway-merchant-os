import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

// Create Prisma client
const prisma = new PrismaClient();

// BNPL Configuration - NCA Compliant
const bnplConfig = {
  instalments: 3,
  interestRate: 0, // 0% interest
  coolingOffDays: 5,
  lateFeePercent: 5, // 5% of instalment amount
  minPurchase: 500, // R500 minimum
  tierLimits: {
    bronze: 500,
    silver: 2000,
    gold: 5000,
    platinum: 10000,
  },
  ncaDisclosure: {
    creditProvider: 'Groway BNPL (NCR CP XXXX)',
    agreementType: 'Incidental Credit Agreement',
    interestRate: '0% (Interest-Free)',
    initiationFee: 'R0',
    monthlyServiceFee: 'R0',
    coolingOffPeriod: '5 Business Days',
    latePaymentInterest: 'Repo Rate + 21% (max)',
  },
};

// Demo user ID
const DEMO_USER_ID = 'demo-consumer-user-001';

// Generate agreement number
function generateAgreementNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `BNPL-${year}${month}-${random}`;
}

// Calculate due dates for instalments
function calculateInstalmentDates(startDate: Date, instalments: number): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < instalments; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);
    dates.push(dueDate);
  }
  return dates;
}

// Ensure demo user exists
async function ensureDemoUser() {
  let user = await prisma.consumerUser.findUnique({
    where: { id: DEMO_USER_ID },
  });

  if (!user) {
    const now = new Date();
    user = await prisma.consumerUser.create({
      data: {
        id: DEMO_USER_ID,
        phone: '+27821234567',
        email: 'thabo.molefe@example.com',
        firstName: 'Thabo',
        lastName: 'Molefe',
        kycLevel: 3,
        kycStatus: 'verified',
        kycVerifiedAt: now,
        accountStatus: 'active',
        createdAt: now,
        updatedAt: now,
      },
    });
    
    // Create wallet
    await prisma.consumerWallet.create({
      data: {
        id: `wallet-${DEMO_USER_ID}`,
        userId: DEMO_USER_ID,
        balanceCents: BigInt(500000), // R5000
        totalReceivedCents: BigInt(1000000),
        totalTopupsCents: BigInt(800000),
        updatedAt: now,
      },
    });
  }

  return user;
}

// Check BNPL eligibility
async function checkEligibility(userId: string): Promise<{
  eligible: boolean;
  creditScore: number;
  limit: number;
  available: number;
  tier: string;
  requirements: { text: string; met: boolean }[];
}> {
  // Get or create BNPL user profile
  let bnplUser = await prisma.bNPLUser.findUnique({
    where: { userId },
  });

  if (!bnplUser) {
    // Create initial BNPL profile
    const wallet = await prisma.consumerWallet.findFirst({
      where: { userId },
    });
    
    const transactions = await prisma.consumerTransaction.count({
      where: { userId, status: 'completed' },
    });

    const user = await ensureDemoUser();

    const accountAge = user ? 
      Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    // Calculate credit score based on wallet history
    let creditScore = 550; // Base score
    if (transactions > 10) creditScore += 20;
    if (transactions > 50) creditScore += 30;
    if (accountAge > 30) creditScore += 20;
    if (accountAge > 90) creditScore += 30;
    if (user?.kycLevel && user.kycLevel >= 3) creditScore += 50;

    // Determine tier
    let tier = 'bronze';
    if (creditScore >= 750) tier = 'platinum';
    else if (creditScore >= 680) tier = 'gold';
    else if (creditScore >= 620) tier = 'silver';

    const limit = bnplConfig.tierLimits[tier as keyof typeof bnplConfig.tierLimits] || 500;

    bnplUser = await prisma.bNPLUser.create({
      data: {
        id: randomUUID(),
        userId,
        eligible: creditScore >= 550,
        creditScore,
        creditLimit: limit,
        creditUsed: 0,
        creditAvailable: limit,
        kycLevel: user?.kycLevel || 0,
        accountAgeDays: accountAge,
        transactionCount: transactions,
        tier,
        tierLimit: limit,
        lastAssessmentAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  // Check requirements
  const requirements = [
    { text: 'Credit score 550+', met: bnplUser.creditScore >= 550 },
    { text: 'KYC Level 3 verified', met: bnplUser.kycLevel >= 3 },
    { text: 'Active for 30+ days', met: bnplUser.accountAgeDays >= 30 },
    { text: 'No outstanding defaults', met: bnplUser.status === 'active' },
  ];

  return {
    eligible: bnplUser.eligible && bnplUser.status === 'active',
    creditScore: bnplUser.creditScore,
    limit: bnplUser.creditLimit,
    available: bnplUser.creditAvailable,
    tier: bnplUser.tier,
    requirements,
  };
}

// GET - BNPL status, eligibility, and plans
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');
  const userId = searchParams.get('userId') || DEMO_USER_ID;
  const planId = searchParams.get('planId');

  try {
    // Ensure demo user exists
    await ensureDemoUser();

    // Get eligibility and limits
    if (action === 'eligibility') {
      const eligibility = await checkEligibility(userId);
      return NextResponse.json({
        success: true,
        data: eligibility,
      });
    }

    // Get BNPL configuration
    if (action === 'config') {
      return NextResponse.json({
        success: true,
        data: {
          ...bnplConfig,
        },
      });
    }

    // Get merchants from Grosell network
    if (action === 'merchants') {
      const merchants = await prisma.bNPLMerchant.findMany({
        where: { status: 'active', bnplEnabled: true },
        take: 50,
        orderBy: { businessName: 'asc' },
      });

      // If no merchants, return demo merchants
      if (merchants.length === 0) {
        const demoMerchants = [
          { id: '1', businessName: 'Fashion Hub', category: 'Fashion', logo: null, province: 'Gauteng' },
          { id: '2', businessName: 'TechStore SA', category: 'Electronics', logo: null, province: 'Western Cape' },
          { id: '3', businessName: 'Home & Living', category: 'Furniture', logo: null, province: 'KwaZulu-Natal' },
          { id: '4', businessName: 'SportZone', category: 'Sports', logo: null, province: 'Gauteng' },
          { id: '5', businessName: 'Beauty Bar', category: 'Beauty', logo: null, province: 'Western Cape' },
        ];
        return NextResponse.json({ success: true, data: demoMerchants });
      }

      return NextResponse.json({ success: true, data: merchants });
    }

    // Get user's active plans
    if (action === 'plans') {
      const plans = await prisma.bNPLAgreement.findMany({
        where: { userId, status: { in: ['active', 'defaulted'] } },
        include: {
          BNPLInstalment: { orderBy: { instalmentNumber: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({ success: true, data: plans, total: plans.length });
    }

    // Get specific plan
    if (action === 'plan' && planId) {
      const plan = await prisma.bNPLAgreement.findUnique({
        where: { id: planId },
        include: {
          BNPLInstalment: { orderBy: { instalmentNumber: 'asc' } },
          BNPLMerchant: true,
        },
      });

      if (!plan) {
        return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: plan });
    }

    // Get all BNPL status for user
    const eligibility = await checkEligibility(userId);
    const plans = await prisma.bNPLAgreement.findMany({
      where: { userId, status: { in: ['active', 'defaulted'] } },
      include: { BNPLInstalment: true },
    });

    const totalOwing = plans.reduce((sum, p) => sum + p.outstandingAmount, 0);

    return NextResponse.json({
      success: true,
      data: {
        ...eligibility,
        config: bnplConfig,
        activePlans: plans.length,
        totalOwing,
        plans,
      },
    });
  } catch (error) {
    console.error('BNPL GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch BNPL data' }, { status: 500 });
  }
}

// POST - Create BNPL agreement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, merchantId, merchantName, purchaseAmount, purchaseDescription, grosellOrderId, merchantOsOrderId } = body;

    const effectiveUserId = userId || DEMO_USER_ID;

    // Ensure demo user exists
    await ensureDemoUser();

    // Pay instalment
    if (action === 'pay') {
      const { instalmentId, paymentMethod } = body;

      const instalment = await prisma.bNPLInstalment.findUnique({
        where: { id: instalmentId },
        include: { BNPLAgreement: true },
      });

      if (!instalment || instalment.BNPLAgreement.userId !== effectiveUserId) {
        return NextResponse.json({ success: false, error: 'Instalment not found' }, { status: 404 });
      }

      if (instalment.status === 'paid') {
        return NextResponse.json({ success: false, error: 'Instalment already paid' }, { status: 400 });
      }

      // Update instalment
      const updatedInstalment = await prisma.bNPLInstalment.update({
        where: { id: instalmentId },
        data: {
          status: 'paid',
          paidAmount: instalment.amount + instalment.lateFeeApplied,
          paidAt: new Date(),
          paymentMethod: paymentMethod || 'wallet',
          paymentReference: `PAY-${Date.now()}`,
          updatedAt: new Date(),
        },
      });

      // Update agreement
      const agreement = await prisma.bNPLAgreement.update({
        where: { id: instalment.agreementId },
        data: {
          paidInstalments: { increment: 1 },
          outstandingAmount: { decrement: instalment.amount },
          updatedAt: new Date(),
        },
      });

      // Check if completed
      if (agreement.paidInstalments + 1 >= agreement.totalInstalments) {
        await prisma.bNPLAgreement.update({
          where: { id: agreement.id },
          data: { status: 'completed', completedAt: new Date() },
        });

        // Update user's credit available
        await prisma.bNPLUser.update({
          where: { userId: effectiveUserId },
          data: {
            creditUsed: { decrement: agreement.purchaseAmount },
            creditAvailable: { increment: agreement.purchaseAmount },
          },
        });
      }

      return NextResponse.json({
        success: true,
        data: updatedInstalment,
        message: `Instalment ${instalment.instalmentNumber} of R${instalment.amount.toFixed(2)} paid successfully`,
      });
    }

    // Create new BNPL agreement
    if (action === 'create') {
      if (!merchantName || !purchaseAmount) {
        return NextResponse.json({ success: false, error: 'Merchant and purchase amount required' }, { status: 400 });
      }

      // Check eligibility
      const eligibility = await checkEligibility(effectiveUserId);

      if (!eligibility.eligible) {
        return NextResponse.json({ success: false, error: 'Not eligible for BNPL' }, { status: 400 });
      }

      if (purchaseAmount < bnplConfig.minPurchase) {
        return NextResponse.json({ success: false, error: `Minimum purchase is R${bnplConfig.minPurchase}` }, { status: 400 });
      }

      if (purchaseAmount > eligibility.available) {
        return NextResponse.json({ success: false, error: 'Insufficient BNPL limit' }, { status: 400 });
      }

      // Calculate instalment details
      const instalmentAmount = Math.round((purchaseAmount / bnplConfig.instalments) * 100) / 100;
      const now = new Date();
      const instalmentDates = calculateInstalmentDates(now, bnplConfig.instalments);
      const agreementNumber = generateAgreementNumber();
      const coolingOffExpiry = new Date(now);
      coolingOffExpiry.setDate(coolingOffExpiry.getDate() + bnplConfig.coolingOffDays);

      // Create agreement with instalments
      const agreement = await prisma.bNPLAgreement.create({
        data: {
          id: randomUUID(),
          agreementNumber,
          userId: effectiveUserId,
          merchantId: merchantId || null,
          merchantName,
          purchaseAmount,
          instalmentAmount,
          totalInstalments: bnplConfig.instalments,
          paidInstalments: 0,
          outstandingAmount: purchaseAmount,
          firstPaymentDue: instalmentDates[0].toISOString(),
          nextDueDate: instalmentDates[0].toISOString(),
          status: 'active',
          interestFree: true,
          ncaDisclosureShown: true,
          creditScoreAtCreation: eligibility.creditScore,
          coolingOffExpiry,
          grosellOrderId: grosellOrderId || null,
          merchantOsOrderId: merchantOsOrderId || null,
          purchaseDescription: purchaseDescription || null,
          updatedAt: now,
          BNPLInstalment: {
            create: instalmentDates.map((date, index) => ({
              id: randomUUID(),
              instalmentNumber: index + 1,
              amount: instalmentAmount,
              dueDate: date.toISOString(),
              status: index === 0 ? 'pending' : 'pending',
              updatedAt: now,
            })),
          },
        },
        include: { BNPLInstalment: true },
      });

      // Update user's credit usage
      await prisma.bNPLUser.update({
        where: { userId: effectiveUserId },
        data: {
          creditUsed: { increment: purchaseAmount },
          creditAvailable: { decrement: purchaseAmount },
        },
      });

      return NextResponse.json({
        success: true,
        data: agreement,
        message: `BNPL agreement created. Pay R${instalmentAmount.toFixed(2)} today, then ${bnplConfig.instalments - 1} more instalments of R${instalmentAmount.toFixed(2)}`,
      });
    }

    // Sync merchants from Grosell
    if (action === 'sync-merchants') {
      // In production, this would fetch from Grosell API
      // For now, create demo merchants if they don't exist
      const existingCount = await prisma.bNPLMerchant.count();
      
      if (existingCount === 0) {
        const demoMerchants = [
          { businessName: 'Fashion Hub SA', category: 'Fashion', province: 'Gauteng', city: 'Johannesburg' },
          { businessName: 'TechStore SA', category: 'Electronics', province: 'Western Cape', city: 'Cape Town' },
          { businessName: 'Home & Living', category: 'Furniture', province: 'KwaZulu-Natal', city: 'Durban' },
          { businessName: 'SportZone', category: 'Sports', province: 'Gauteng', city: 'Pretoria' },
          { businessName: 'Beauty Bar', category: 'Beauty', province: 'Western Cape', city: 'Cape Town' },
          { businessName: 'Gadget World', category: 'Electronics', province: 'Gauteng', city: 'Johannesburg' },
          { businessName: 'Style Studio', category: 'Fashion', province: 'Eastern Cape', city: 'Port Elizabeth' },
          { businessName: 'Kids Kingdom', category: 'Children', province: 'Gauteng', city: 'Johannesburg' },
        ];

        for (const merchant of demoMerchants) {
          await prisma.bNPLMerchant.create({
            data: {
              id: randomUUID(),
              ...merchant,
              bnplEnabled: true,
              maxTransactionLimit: 5000,
              minTransactionAmount: 500,
              updatedAt: new Date(),
            },
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Merchants synced successfully',
        count: await prisma.bNPLMerchant.count(),
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('BNPL POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process request' }, { status: 500 });
  }
}

// PUT - Update BNPL agreement (accept terms, cancel, etc.)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, agreementId, userId } = body;
    const effectiveUserId = userId || DEMO_USER_ID;

    // Ensure demo user exists
    await ensureDemoUser();

    // Accept NCA terms
    if (action === 'accept-terms') {
      const agreement = await prisma.bNPLAgreement.findUnique({
        where: { id: agreementId },
      });

      if (!agreement || agreement.userId !== effectiveUserId) {
        return NextResponse.json({ success: false, error: 'Agreement not found' }, { status: 404 });
      }

      const updated = await prisma.bNPLAgreement.update({
        where: { id: agreementId },
        data: {
          ncaAccepted: true,
          ncaAcceptedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({ success: true, data: updated });
    }

    // Cancel during cooling-off period
    if (action === 'cancel') {
      const agreement = await prisma.bNPLAgreement.findUnique({
        where: { id: agreementId },
      });

      if (!agreement || agreement.userId !== effectiveUserId) {
        return NextResponse.json({ success: false, error: 'Agreement not found' }, { status: 404 });
      }

      if (agreement.paidInstalments > 0) {
        return NextResponse.json({ success: false, error: 'Cannot cancel after payment made' }, { status: 400 });
      }

      const now = new Date();
      if (agreement.coolingOffExpiry && now > agreement.coolingOffExpiry) {
        return NextResponse.json({ success: false, error: 'Cooling-off period has expired' }, { status: 400 });
      }

      const updated = await prisma.bNPLAgreement.update({
        where: { id: agreementId },
        data: {
          status: 'cancelled',
          cancelledAt: now,
          cancelledReason: 'Cooling-off cancellation',
          updatedAt: now,
        },
      });

      // Restore credit
      await prisma.bNPLUser.update({
        where: { userId: effectiveUserId },
        data: {
          creditUsed: { decrement: agreement.purchaseAmount },
          creditAvailable: { increment: agreement.purchaseAmount },
        },
      });

      return NextResponse.json({ success: true, data: updated, message: 'Agreement cancelled successfully' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('BNPL PUT error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update agreement' }, { status: 500 });
  }
}
