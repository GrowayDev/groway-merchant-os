import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Demo user ID - in production this would come from authentication
const DEMO_USER_ID = 'demo-consumer-user-001';

// Laybye Configuration
const laybyeConfig = {
  maxTerm: 6, // months
  minDeposit: 0.10, // 10%
  gracePeriod: 7, // days
  cancellationFee: 0.10, // 10% of total item price
  ncaThreshold: 500, // NCA applies over R500
};

// Helper to ensure demo user exists
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

// Helper to generate payment schedule
function generatePaymentSchedule(
  itemPrice: number, 
  deposit: number, 
  startDate: Date,
  totalInstalments: number
): Array<{
  instalmentNumber: number;
  amount: number;
  dueDate: Date;
  status: 'pending' | 'paid' | 'overdue';
}> {
  const schedule = [];
  const remainingBalance = itemPrice - deposit;
  const monthlyAmount = Math.ceil(remainingBalance / totalInstalments * 100) / 100;
  
  for (let i = 1; i <= totalInstalments; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);
    
    // Last instalment may have different amount due to rounding
    const amount = i === totalInstalments 
      ? Math.round((remainingBalance - (monthlyAmount * (totalInstalments - 1))) * 100) / 100
      : monthlyAmount;
    
    schedule.push({
      instalmentNumber: i,
      amount,
      dueDate,
      status: 'pending' as const,
    });
  }
  
  return schedule;
}

// Helper to get merchants from Grosell network
async function getGrosellMerchants() {
  try {
    const merchants = await db.merchant.findMany({
      where: {
        OR: [
          { posEnabled: true },
          { onlineStoreEnabled: true }
        ]
      },
      select: {
        id: true,
        name: true,
        tradingName: true,
        logo: true,
        vertical: true,
        city: true,
        province: true,
      },
      take: 50,
    });
    
    return merchants.map(m => ({
      id: m.id,
      name: m.tradingName || m.name,
      logo: m.logo,
      category: m.vertical,
      location: m.city && m.province ? `${m.city}, ${m.province}` : undefined,
    }));
  } catch {
    // Return sample merchants if database is empty
    return [
      { id: 'merch-001', name: 'Game', logo: null, category: 'retail', location: 'Johannesburg, Gauteng' },
      { id: 'merch-002', name: 'Makro', logo: null, category: 'retail', location: 'Pretoria, Gauteng' },
      { id: 'merch-003', name: 'Shoprite', logo: null, category: 'grocery', location: 'Cape Town, Western Cape' },
      { id: 'merch-004', name: 'TAFELBERG Furnishers', logo: null, category: 'furniture', location: 'Johannesburg, Gauteng' },
      { id: 'merch-005', name: 'Bradlows', logo: null, category: 'furniture', location: 'Durban, KwaZulu-Natal' },
      { id: 'merch-006', name: 'JET Mart', logo: null, category: 'retail', location: 'Johannesburg, Gauteng' },
      { id: 'merch-007', name: 'Peek & Cloppenburg', logo: null, category: 'fashion', location: 'Cape Town, Western Cape' },
      { id: 'merch-008', name: 'HiFi Corp', logo: null, category: 'electronics', location: 'Pretoria, Gauteng' },
    ];
  }
}

// GET - Laybye status, plans, and merchants
export async function GET(request: NextRequest) {
  try {
    await ensureDemoUser();
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const laybyeId = searchParams.get('laybyeId');

    if (action === 'config') {
      return NextResponse.json({
        success: true,
        data: {
          ...laybyeConfig,
          terms: {
            maximumTerm: '6 months from deposit date',
            minimumDeposit: '10% of item price',
            latePayment: '7-day grace period before cancellation',
            cancellation: '10% cancellation fee of total item price forfeited',
            ncaProtection: 'Applies to laybyes over R500 or terms exceeding 12 months',
            autoRelease: 'Item released automatically upon full payment',
            itemReservation: 'Item reserved for duration of laybye agreement',
          },
        },
      });
    }

    if (action === 'merchants') {
      const merchants = await getGrosellMerchants();
      return NextResponse.json({
        success: true,
        data: merchants,
      });
    }

    if (action === 'stats') {
      const laybyes = await db.consumerLaybye.findMany({
        where: { userId: DEMO_USER_ID, status: 'active' }
      });
      
      return NextResponse.json({
        success: true,
        data: {
          activeCount: laybyes.length,
          totalReserved: laybyes.reduce((sum, l) => sum + l.itemPrice, 0),
          totalPaid: laybyes.reduce((sum, l) => sum + l.totalPaid, 0),
          totalRemaining: laybyes.reduce((sum, l) => sum + l.remainingBalance, 0),
          limits: {
            maxActiveLaybyes: 5,
            maxItemValue: 50000,
            minItemValue: 100,
          },
        },
      });
    }

    if (action === 'laybye' && laybyeId) {
      const laybye = await db.consumerLaybye.findUnique({
        where: { id: laybyeId },
        include: { 
          ConsumerLaybyePayment: { 
            orderBy: { createdAt: 'desc' } 
          } 
        }
      });
      
      if (!laybye) {
        return NextResponse.json({ success: false, error: 'Laybye not found' }, { status: 404 });
      }
      
      // Generate full payment schedule
      const schedule = generatePaymentSchedule(
        laybye.itemPrice,
        laybye.deposit,
        laybye.createdAt,
        laybye.totalInstalments
      );
      
      // Mark paid instalments
      const paidPayments = laybye.ConsumerLaybyePayment.filter(p => p.type === 'instalment' && p.status === 'completed');
      paidPayments.forEach((_, idx) => {
        if (schedule[idx]) {
          schedule[idx].status = 'paid';
        }
      });
      
      // Check for overdue
      const now = new Date();
      schedule.forEach(s => {
        if (s.status === 'pending' && new Date(s.dueDate) < now) {
          s.status = 'overdue';
        }
      });
      
      return NextResponse.json({ 
        success: true, 
        data: {
          ...laybye,
          nextDueDate: laybye.nextDueDate?.toISOString(),
          expiresAt: laybye.expiresAt?.toISOString(),
          createdAt: laybye.createdAt.toISOString(),
          paymentSchedule: schedule,
          payments: laybye.ConsumerLaybyePayment.map(p => ({
            id: p.id,
            amount: p.amount,
            type: p.type,
            status: p.status,
            createdAt: p.createdAt.toISOString()
          })),
          progress: {
            percentage: Math.round((laybye.totalPaid / laybye.itemPrice) * 100),
            paidInstalments: laybye.instalmentsPaid,
            totalInstalments: laybye.totalInstalments,
            daysRemaining: laybye.expiresAt 
              ? Math.max(0, Math.ceil((new Date(laybye.expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
              : null,
          },
          cancellationInfo: {
            fee: laybye.itemPrice * laybyeConfig.cancellationFee,
            refundAmount: Math.max(0, laybye.totalPaid - (laybye.itemPrice * laybyeConfig.cancellationFee)),
          },
        }
      });
    }

    // Get all laybyes with enhanced data
    const laybyes = await db.consumerLaybye.findMany({
      where: { userId: DEMO_USER_ID },
      orderBy: { createdAt: 'desc' },
      include: {
        ConsumerLaybyePayment: {
          where: { status: 'completed' },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }
      }
    });
    
    const activeLaybyes = laybyes.filter(l => l.status === 'active');
    const completedLaybyes = laybyes.filter(l => l.status === 'completed');
    const cancelledLaybyes = laybyes.filter(l => l.status === 'cancelled');

    return NextResponse.json({
      success: true,
      data: laybyes.map(l => ({
        id: l.id,
        merchant: l.merchant,
        item: l.item,
        itemPrice: l.itemPrice,
        deposit: l.deposit,
        totalPaid: l.totalPaid,
        remainingBalance: l.remainingBalance,
        instalmentAmount: l.instalmentAmount,
        instalmentsPaid: l.instalmentsPaid,
        totalInstalments: l.totalInstalments,
        nextDueDate: l.nextDueDate?.toISOString(),
        expiresAt: l.expiresAt?.toISOString(),
        status: l.status,
        ncaProtected: l.ncaProtected,
        createdAt: l.createdAt.toISOString(),
        progress: Math.round((l.totalPaid / l.itemPrice) * 100),
        recentPayments: l.ConsumerLaybyePayment.map(p => ({
          id: p.id,
          amount: p.amount,
          type: p.type,
          createdAt: p.createdAt.toISOString(),
        })),
      })),
      config: laybyeConfig,
      stats: {
        activeCount: activeLaybyes.length,
        completedCount: completedLaybyes.length,
        cancelledCount: cancelledLaybyes.length,
        totalReserved: activeLaybyes.reduce((sum, l) => sum + l.itemPrice, 0),
        totalPaid: activeLaybyes.reduce((sum, l) => sum + l.totalPaid, 0),
        totalRemaining: activeLaybyes.reduce((sum, l) => sum + l.remainingBalance, 0),
      },
    });
  } catch (error) {
    console.error('Laybye GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch laybye data' }, { status: 500 });
  }
}

// POST - Create laybye agreement
export async function POST(request: NextRequest) {
  try {
    await ensureDemoUser();
    const body = await request.json();
    const { merchant, merchantId, item, itemPrice, deposit, termMonths } = body;

    if (!merchant || !item || !itemPrice) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: merchant, item, and itemPrice are required' 
      }, { status: 400 });
    }

    // Validate item price
    if (itemPrice < 100) {
      return NextResponse.json({
        success: false,
        error: 'Minimum item price is R100',
      }, { status: 400 });
    }

    if (itemPrice > 50000) {
      return NextResponse.json({
        success: false,
        error: 'Maximum item price is R50,000 for laybye',
      }, { status: 400 });
    }

    // Check active laybye limit
    const activeLaybyes = await db.consumerLaybye.count({
      where: { userId: DEMO_USER_ID, status: 'active' }
    });

    if (activeLaybyes >= 5) {
      return NextResponse.json({
        success: false,
        error: 'Maximum of 5 active laybyes allowed. Please complete or cancel an existing laybye.',
      }, { status: 400 });
    }

    const minDeposit = itemPrice * laybyeConfig.minDeposit;
    const actualDeposit = deposit || minDeposit;
    const actualTerm = Math.min(termMonths || laybyeConfig.maxTerm, laybyeConfig.maxTerm);

    if (actualDeposit < minDeposit) {
      return NextResponse.json({
        success: false,
        error: `Minimum deposit is R${Math.ceil(minDeposit).toLocaleString('en-ZA')} (10% of item price)`,
      }, { status: 400 });
    }

    const remainingBalance = itemPrice - actualDeposit;
    const monthlyInstalment = Math.ceil(remainingBalance / actualTerm);
    const now = new Date();
    const expiryDate = new Date(now.getTime() + (actualTerm * 30 * 24 * 60 * 60 * 1000));
    const laybyeIdNew = `LYB${Date.now()}`;

    // Generate payment schedule
    const schedule = generatePaymentSchedule(itemPrice, actualDeposit, now, actualTerm);

    // Create laybye with initial payment
    const laybye = await db.consumerLaybye.create({
      data: {
        id: laybyeIdNew,
        userId: DEMO_USER_ID,
        merchant,
        item,
        itemPrice,
        deposit: actualDeposit,
        totalPaid: actualDeposit,
        remainingBalance,
        instalmentAmount: monthlyInstalment,
        instalmentsPaid: 1,
        totalInstalments: actualTerm,
        nextDueDate: schedule[0]?.dueDate || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        expiresAt: expiryDate,
        status: 'active',
        ncaProtected: itemPrice >= laybyeConfig.ncaThreshold,
        updatedAt: now,
        ConsumerLaybyePayment: {
          create: [{
            id: `${laybyeIdNew}-DEP`,
            amount: actualDeposit,
            type: 'deposit',
            status: 'completed',
            updatedAt: now,
          }]
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: laybye.id,
        merchant: laybye.merchant,
        item: laybye.item,
        itemPrice: laybye.itemPrice,
        deposit: laybye.deposit,
        remainingBalance: laybye.remainingBalance,
        instalmentAmount: laybye.instalmentAmount,
        totalInstalments: laybye.totalInstalments,
        nextDueDate: laybye.nextDueDate?.toISOString(),
        expiresAt: laybye.expiresAt?.toISOString(),
        status: laybye.status,
        ncaProtected: laybye.ncaProtected,
        paymentSchedule: schedule,
      },
      message: `Laybye agreement created! Deposit of R${actualDeposit.toLocaleString('en-ZA')} received. Pay R${monthlyInstalment.toLocaleString('en-ZA')}/month for ${actualTerm} months.`,
    });
  } catch (error) {
    console.error('Laybye POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create laybye agreement' }, { status: 500 });
  }
}

// PUT - Make laybye payment
export async function PUT(request: NextRequest) {
  try {
    await ensureDemoUser();
    const body = await request.json();
    const { laybyeId, paymentAmount, paymentMethod } = body;

    if (!laybyeId || !paymentAmount) {
      return NextResponse.json({ 
        success: false, 
        error: 'laybyeId and paymentAmount are required' 
      }, { status: 400 });
    }

    const laybye = await db.consumerLaybye.findUnique({
      where: { id: laybyeId }
    });
    
    if (!laybye) {
      return NextResponse.json({ success: false, error: 'Laybye not found' }, { status: 404 });
    }

    if (laybye.status !== 'active') {
      return NextResponse.json({ 
        success: false, 
        error: 'Laybye is not active' 
      }, { status: 400 });
    }

    if (paymentAmount <= 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Payment amount must be greater than 0' 
      }, { status: 400 });
    }

    // Check for late payment (grace period)
    const now = new Date();
    const nextDueDate = laybye.nextDueDate ? new Date(laybye.nextDueDate) : null;
    const isLatePayment = nextDueDate && now > new Date(nextDueDate.getTime() + laybyeConfig.gracePeriod * 24 * 60 * 60 * 1000);

    const newTotalPaid = laybye.totalPaid + paymentAmount;
    const newRemainingBalance = Math.max(0, laybye.remainingBalance - paymentAmount);
    const newInstalmentsPaid = laybye.instalmentsPaid + 1;
    const newStatus = newRemainingBalance <= 0 ? 'completed' : 'active';

    // Create payment record
    const paymentId = `LYB-PAY-${Date.now()}`;
    await db.consumerLaybyePayment.create({
      data: {
        id: paymentId,
        laybyeId,
        amount: paymentAmount,
        type: 'instalment',
        status: 'completed',
        updatedAt: now,
      }
    });

    // Calculate next due date
    const nextDue = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Update laybye
    const updatedLaybye = await db.consumerLaybye.update({
      where: { id: laybyeId },
      data: {
        totalPaid: newTotalPaid,
        remainingBalance: newRemainingBalance,
        instalmentsPaid: newInstalmentsPaid,
        nextDueDate: newStatus === 'active' ? nextDue : null,
        status: newStatus,
        updatedAt: now,
      }
    });

    // If completed, item is released
    if (newStatus === 'completed') {
      return NextResponse.json({
        success: true,
        data: {
          id: updatedLaybye.id,
          totalPaid: updatedLaybye.totalPaid,
          remainingBalance: updatedLaybye.remainingBalance,
          status: updatedLaybye.status,
          completedAt: now.toISOString(),
        },
        message: '🎉 Congratulations! Your laybye is complete! The item has been released and is ready for collection.',
        releaseStatus: {
          released: true,
          releaseDate: now.toISOString(),
          collectionInfo: 'Please visit the merchant with your ID to collect your item.',
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedLaybye.id,
        totalPaid: updatedLaybye.totalPaid,
        remainingBalance: updatedLaybye.remainingBalance,
        instalmentsPaid: updatedLaybye.instalmentsPaid,
        totalInstalments: updatedLaybye.totalInstalments,
        nextDueDate: updatedLaybye.nextDueDate?.toISOString(),
        status: updatedLaybye.status,
        progress: Math.round((newTotalPaid / laybye.itemPrice) * 100),
      },
      message: `Payment of R${paymentAmount.toLocaleString('en-ZA')} recorded successfully! Remaining: R${newRemainingBalance.toLocaleString('en-ZA')}`,
      latePaymentWarning: isLatePayment ? 'Note: This payment was made after the grace period. Please try to pay on time to avoid cancellation.' : null,
    });
  } catch (error) {
    console.error('Laybye PUT error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process payment' }, { status: 500 });
  }
}

// DELETE - Cancel laybye (with forfeit warning)
export async function DELETE(request: NextRequest) {
  try {
    await ensureDemoUser();
    const searchParams = request.nextUrl.searchParams;
    const laybyeId = searchParams.get('laybyeId');
    const confirm = searchParams.get('confirm') === 'true';

    if (!laybyeId) {
      return NextResponse.json({ 
        success: false, 
        error: 'laybyeId is required' 
      }, { status: 400 });
    }

    const laybye = await db.consumerLaybye.findUnique({
      where: { id: laybyeId }
    });
    
    if (!laybye) {
      return NextResponse.json({ success: false, error: 'Laybye not found' }, { status: 404 });
    }

    if (laybye.status !== 'active') {
      return NextResponse.json({ 
        success: false, 
        error: 'Only active laybyes can be cancelled' 
      }, { status: 400 });
    }

    // Calculate cancellation details
    const cancellationFee = laybye.itemPrice * laybyeConfig.cancellationFee;
    const totalPaid = laybye.totalPaid;
    const refundAmount = Math.max(0, totalPaid - cancellationFee);

    // If not confirmed, return cancellation preview
    if (!confirm) {
      return NextResponse.json({
        success: true,
        data: {
          laybyeId: laybye.id,
          item: laybye.item,
          merchant: laybye.merchant,
          itemPrice: laybye.itemPrice,
          totalPaid,
          cancellationFee,
          refundAmount,
          warning: `Cancelling this laybye will forfeit R${cancellationFee.toLocaleString('en-ZA')} (10% of item price) as a cancellation fee.`,
        },
        requiresConfirmation: true,
        message: 'Please confirm cancellation. This action cannot be undone.',
      });
    }

    // Proceed with cancellation
    const now = new Date();
    
    // Create cancellation payment record
    await db.consumerLaybyePayment.create({
      data: {
        id: `LYB-CANCEL-${Date.now()}`,
        laybyeId,
        amount: -refundAmount, // Negative for refund
        type: 'refund',
        status: 'completed',
        updatedAt: now,
      }
    });

    // Update laybye status
    await db.consumerLaybye.update({
      where: { id: laybyeId },
      data: { 
        status: 'cancelled', 
        remainingBalance: 0,
        updatedAt: now 
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        laybyeId: laybye.id,
        status: 'cancelled',
        cancelledAt: now.toISOString(),
        summary: {
          totalPaid,
          cancellationFee,
          refundAmount,
        }
      },
      message: `Laybye cancelled. A refund of R${refundAmount.toLocaleString('en-ZA')} will be processed to your original payment method within 5-7 business days.`,
    });
  } catch (error) {
    console.error('Laybye DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Failed to cancel laybye' }, { status: 500 });
  }
}
