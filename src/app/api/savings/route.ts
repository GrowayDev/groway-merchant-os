import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const DEMO_USER_ID = 'demo-consumer-user-001';

// Savings pocket types
const pocketTypes = [
  { id: 'emergency', name: 'Emergency Fund', icon: '🛡️', color: '#EF4444', targetMultiplier: 3, description: '3 months of expenses' },
  { id: 'vacation', name: 'Vacation', icon: '🏖️', color: '#3B82F6', targetMultiplier: 1, description: 'Dream getaway' },
  { id: 'education', name: 'Education', icon: '📚', color: '#8B5CF6', targetMultiplier: 1, description: 'Learning & courses' },
  { id: 'home', name: 'Home Deposit', icon: '🏠', color: '#10B981', targetMultiplier: 1, description: 'Your dream home' },
  { id: 'car', name: 'Car Fund', icon: '🚗', color: '#F59E0B', targetMultiplier: 1, description: 'New wheels' },
  { id: 'wedding', name: 'Wedding', icon: '💍', color: '#EC4899', targetMultiplier: 1, description: 'Special day' },
  { id: 'gadget', name: 'Gadget', icon: '📱', color: '#6366F1', targetMultiplier: 1, description: 'Latest tech' },
  { id: 'custom', name: 'Custom Goal', icon: '🎯', color: '#14B8A6', targetMultiplier: 1, description: 'Your own goal' },
];

// Interest rates based on term
const interestRates = [
  { term: 'flexible', rate: 4.5, name: 'Flexible', description: 'Access anytime' },
  { term: '32-day', rate: 6.25, name: '32-Day Notice', description: '32 days notice to withdraw' },
  { term: '90-day', rate: 7.0, name: '90-Day Fixed', description: 'Fixed for 90 days' },
  { term: '12-month', rate: 8.5, name: '12-Month Fixed', description: 'Fixed for 12 months' },
];

// Round-up settings
const roundUpOptions = [
  { id: 'nearest-1', label: 'Nearest R1', example: 'R12.40 → R13.00 (save R0.60)' },
  { id: 'nearest-5', label: 'Nearest R5', example: 'R12.40 → R15.00 (save R2.60)' },
  { id: 'nearest-10', label: 'Nearest R10', example: 'R12.40 → R20.00 (save R7.60)' },
  { id: 'multiplier-2', label: '2x Round-up', example: 'R12.40 → R13.00 (save R1.20)' },
];

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

// GET - List savings data
export async function GET(request: NextRequest) {
  try {
    await ensureDemoUser();
    
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    if (action === 'pocket-types') {
      return NextResponse.json({ success: true, data: pocketTypes });
    }

    if (action === 'interest-rates') {
      return NextResponse.json({ success: true, data: interestRates });
    }

    if (action === 'roundup-options') {
      return NextResponse.json({ success: true, data: roundUpOptions });
    }

    // Get savings pockets from database
    const pockets = await db.savingsPocket.findMany({
      where: { userId: DEMO_USER_ID },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate totals
    const totalSaved = pockets.reduce((sum, p) => sum + Number(p.balance), 0);
    const totalInterest = pockets.reduce((sum, p) => sum + Number(p.interestEarned || 0), 0);

    // Check for auto-save settings (from user preferences)
    const autoSaveEnabled = true; // Demo value
    const roundUpSetting = roundUpOptions[0]; // Demo value

    return NextResponse.json({
      success: true,
      data: {
        pockets: pockets.map(p => ({
          id: p.id,
          name: p.name,
          type: p.pocketType,
          icon: pocketTypes.find(t => t.id === p.pocketType)?.icon || '💰',
          color: pocketTypes.find(t => t.id === p.pocketType)?.color || '#00897B',
          balance: Number(p.balance),
          target: Number(p.targetAmount),
          progress: p.targetAmount ? (Number(p.balance) / Number(p.targetAmount)) * 100 : 0,
          interestRate: Number(p.interestRate || 4.5),
          interestEarned: Number(p.interestEarned || 0),
          autoSave: p.autoSaveEnabled || false,
          createdAt: p.createdAt.toISOString(),
        })),
        totalSaved,
        totalInterest,
        autoSave: {
          enabled: autoSaveEnabled,
          roundUp: roundUpSetting,
          totalRoundUpThisMonth: 127.50, // Demo value
        },
        pocketTypes,
        interestRates,
        insights: [
          { type: 'tip', message: 'You\'re 67% of the way to your Emergency Fund goal!', icon: '💡' },
          { type: 'success', message: 'You earned R45.23 in interest this month', icon: '📈' },
          { type: 'suggestion', message: 'Consider a 32-day notice account for better interest', icon: '💭' },
        ],
      },
    });
  } catch (error) {
    console.error('Savings GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch savings data' }, { status: 500 });
  }
}

// POST - Create savings pocket or deposit
export async function POST(request: NextRequest) {
  try {
    await ensureDemoUser();
    
    const body = await request.json();
    const { action, pocketType, name, targetAmount, initialDeposit, interestRate, autoSave, pocketId, amount } = body;

    // Create new pocket
    if (action === 'create') {
      const pocket = await db.savingsPocket.create({
        data: {
          id: `SP${Date.now()}`,
          userId: DEMO_USER_ID,
          name: name || pocketTypes.find(t => t.id === pocketType)?.name || 'Savings',
          pocketType: pocketType || 'custom',
          balance: initialDeposit || 0,
          targetAmount: targetAmount || 0,
          interestRate: interestRate || 4.5,
          interestEarned: 0,
          autoSaveEnabled: autoSave || false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          id: pocket.id,
          name: pocket.name,
          type: pocket.pocketType,
          balance: Number(pocket.balance),
          target: Number(pocket.targetAmount),
        },
        message: `Created ${pocket.name} savings pocket`,
      });
    }

    // Deposit to pocket
    if (action === 'deposit' && pocketId && amount) {
      const pocket = await db.savingsPocket.findUnique({
        where: { id: pocketId }
      });

      if (!pocket) {
        return NextResponse.json({ success: false, error: 'Pocket not found' }, { status: 404 });
      }

      // Check wallet balance
      const wallet = await db.consumerWallet.findUnique({
        where: { userId: DEMO_USER_ID }
      });

      if (!wallet || wallet.balanceCents < BigInt(Math.round(amount * 100))) {
        return NextResponse.json({ success: false, error: 'Insufficient funds' }, { status: 400 });
      }

      // Update pocket
      const newBalance = Number(pocket.balance) + amount;
      await db.savingsPocket.update({
        where: { id: pocketId },
        data: {
          balance: newBalance,
          updatedAt: new Date(),
        }
      });

      // Deduct from wallet
      await db.consumerWallet.update({
        where: { userId: DEMO_USER_ID },
        data: {
          balanceCents: wallet.balanceCents - BigInt(Math.round(amount * 100)),
          updatedAt: new Date(),
        }
      });

      // Create transaction record
      await db.consumerTransaction.create({
        data: {
          id: `SAV${Date.now()}`,
          idempotencyKey: `IDMSAV${Date.now()}`,
          userId: DEMO_USER_ID,
          transactionType: 'savings_deposit',
          direction: 'debit',
          amountCents: -BigInt(Math.round(amount * 100)),
          feeCents: BigInt(0),
          netAmountCents: -BigInt(Math.round(amount * 100)),
          currency: 'ZAR',
          status: 'completed',
          description: `Deposit to ${pocket.name}`,
          reference: `SAV-${Date.now()}`,
          category: 'Savings',
          processedAt: new Date(),
          completedAt: new Date(),
          updatedAt: new Date(),
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          pocketId,
          deposited: amount,
          newBalance,
        },
        message: `Deposited R${amount.toFixed(2)} to ${pocket.name}`,
      });
    }

    // Withdraw from pocket
    if (action === 'withdraw' && pocketId && amount) {
      const pocket = await db.savingsPocket.findUnique({
        where: { id: pocketId }
      });

      if (!pocket) {
        return NextResponse.json({ success: false, error: 'Pocket not found' }, { status: 404 });
      }

      if (Number(pocket.balance) < amount) {
        return NextResponse.json({ success: false, error: 'Insufficient funds in pocket' }, { status: 400 });
      }

      const newBalance = Number(pocket.balance) - amount;
      await db.savingsPocket.update({
        where: { id: pocketId },
        data: {
          balance: newBalance,
          updatedAt: new Date(),
        }
      });

      // Credit wallet
      const wallet = await db.consumerWallet.findUnique({
        where: { userId: DEMO_USER_ID }
      });

      if (wallet) {
        await db.consumerWallet.update({
          where: { userId: DEMO_USER_ID },
          data: {
            balanceCents: wallet.balanceCents + BigInt(Math.round(amount * 100)),
            updatedAt: new Date(),
          }
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          pocketId,
          withdrawn: amount,
          newBalance,
        },
        message: `Withdrew R${amount.toFixed(2)} from ${pocket.name}`,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Savings POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process savings request' }, { status: 500 });
  }
}

// PUT - Update auto-save settings
export async function PUT(request: NextRequest) {
  try {
    await ensureDemoUser();
    
    const body = await request.json();
    const { pocketId, autoSaveEnabled, roundUpSetting } = body;

    if (pocketId) {
      const pocket = await db.savingsPocket.update({
        where: { id: pocketId },
        data: {
          autoSaveEnabled,
          updatedAt: new Date(),
        }
      });

      return NextResponse.json({
        success: true,
        message: autoSaveEnabled ? 'Auto-save enabled' : 'Auto-save disabled',
      });
    }

    // Update global round-up settings
    return NextResponse.json({
      success: true,
      message: 'Round-up settings updated',
    });
  } catch (error) {
    console.error('Savings PUT error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update savings settings' }, { status: 500 });
  }
}

// DELETE - Delete savings pocket
export async function DELETE(request: NextRequest) {
  try {
    await ensureDemoUser();
    
    const searchParams = request.nextUrl.searchParams;
    const pocketId = searchParams.get('pocketId');

    if (!pocketId) {
      return NextResponse.json({ success: false, error: 'Pocket ID required' }, { status: 400 });
    }

    const pocket = await db.savingsPocket.findUnique({
      where: { id: pocketId }
    });

    if (!pocket) {
      return NextResponse.json({ success: false, error: 'Pocket not found' }, { status: 404 });
    }

    // Transfer balance back to wallet before deleting
    if (Number(pocket.balance) > 0) {
      const wallet = await db.consumerWallet.findUnique({
        where: { userId: DEMO_USER_ID }
      });

      if (wallet) {
        await db.consumerWallet.update({
          where: { userId: DEMO_USER_ID },
          data: {
            balanceCents: wallet.balanceCents + BigInt(Math.round(Number(pocket.balance) * 100)),
            updatedAt: new Date(),
          }
        });
      }
    }

    await db.savingsPocket.delete({
      where: { id: pocketId }
    });

    return NextResponse.json({
      success: true,
      message: 'Savings pocket deleted and balance transferred to wallet',
    });
  } catch (error) {
    console.error('Savings DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete savings pocket' }, { status: 500 });
  }
}
