import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

// Demo user ID - in production this would come from authentication
const DEMO_USER_ID = 'demo-consumer-user-001';

// Helper to generate card number (mock)
function generateCardNumber(): { pan: string; lastFour: string } {
  // Generate a mock Visa card number (starts with 4)
  const prefix = '4';
  const middle = Array.from({ length: 14 }, () => Math.floor(Math.random() * 10)).join('');
  const pan = prefix + middle + '567'; // Last 3 digits + check digit
  const lastFour = pan.slice(-4);
  return { pan, lastFour };
}

// Helper to generate CVV (mock)
function generateCVV(): string {
  return Math.floor(Math.random() * 900 + 100).toString();
}

// Helper to generate expiry dates
function generateExpiry(): { month: string; year: string } {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear() + 4).slice(-2); // 4 years from now
  return { month, year };
}

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

// Helper to ensure demo card exists
async function ensureDemoCard() {
  await ensureDemoUser();
  
  let card = await db.consumerCard.findFirst({
    where: { userId: DEMO_USER_ID },
    include: { CardSettings: true }
  });
  
  if (!card) {
    const { pan, lastFour } = generateCardNumber();
    const cvv = generateCVV();
    const { month, year } = generateExpiry();
    const cardId = randomUUID();
    const now = new Date();
    
    // Create card
    card = await db.consumerCard.create({
      data: {
        id: cardId,
        userId: DEMO_USER_ID,
        cardType: 'visa',
        cardCategory: 'virtual',
        cardDesign: 'default',
        lastFourDigits: lastFour,
        cardToken: `TKN${randomUUID().replace(/-/g, '').toUpperCase()}`,
        panEncrypted: btoa(pan), // Simple mock encryption
        cvvEncrypted: btoa(cvv), // Simple mock encryption
        expiryMonth: month,
        expiryYear: year,
        cardholderName: 'THABO MOLEFE',
        status: 'active',
        spendingLimitDaily: BigInt(500000), // R5,000
        spendingLimitMonthly: BigInt(2500000), // R25,000
        spentTodayCents: BigInt(125000), // R1,250 spent today
        spentThisMonthCents: BigInt(850000), // R8,500 spent this month
        onlineEnabled: true,
        contactlessEnabled: true,
        atmEnabled: false,
        internationalEnabled: false,
        activatedAt: now,
        createdAt: now,
        updatedAt: now,
      },
      include: { CardSettings: true }
    });
    
    // Create default card settings
    await db.cardSettings.create({
      data: {
        id: randomUUID(),
        cardId: cardId,
        onlineEnabled: true,
        contactlessEnabled: true,
        atmEnabled: false,
        internationalEnabled: false,
        dailyLimit: BigInt(500000),
        monthlyLimit: BigInt(2500000),
        transactionAlerts: true,
        createdAt: now,
        updatedAt: now,
      }
    });
    
    // Create some sample card transactions
    const merchants = [
      { name: 'Takealot.com', category: 'Online Shopping' },
      { name: 'Netflix', category: 'Entertainment' },
      { name: 'Uber', category: 'Transport' },
      { name: 'Checkers', category: 'Groceries' },
      { name: 'Shell', category: 'Fuel' },
    ];
    
    for (let i = 0; i < merchants.length; i++) {
      const txDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      await db.cardTransaction.create({
        data: {
          id: randomUUID(),
          cardId: cardId,
          transactionType: 'purchase',
          amountCents: BigInt(Math.floor(Math.random() * 50000 + 10000)),
          merchantName: merchants[i].name,
          merchantCategory: merchants[i].category,
          status: 'completed',
          reference: `TXN${Date.now() - i * 100000}`,
          processedAt: txDate,
          createdAt: txDate,
          updatedAt: txDate,
        }
      });
    }
    
    // Refetch with settings
    card = await db.consumerCard.findUnique({
      where: { id: cardId },
      include: { CardSettings: true }
    });
  }
  
  return card;
}

// GET - Retrieve card details
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    
    const card = await ensureDemoCard();
    
    if (action === 'transactions') {
      const limit = parseInt(searchParams.get('limit') || '10');
      const transactions = await db.cardTransaction.findMany({
        where: { cardId: card!.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
      
      return NextResponse.json({
        success: true,
        data: {
          transactions: transactions.map(tx => ({
            id: tx.id,
            type: tx.transactionType,
            amount: Number(tx.amountCents) / 100,
            merchant: tx.merchantName,
            category: tx.merchantCategory,
            status: tx.status,
            reference: tx.reference,
            timestamp: tx.createdAt.toISOString(),
          })),
        },
      });
    }
    
    if (action === 'limits') {
      const settings = card!.CardSettings;
      return NextResponse.json({
        success: true,
        data: {
          daily: {
            limit: Number(card!.spendingLimitDaily) / 100,
            spent: Number(card!.spentTodayCents) / 100,
            remaining: (Number(card!.spendingLimitDaily) - Number(card!.spentTodayCents)) / 100,
          },
          monthly: {
            limit: Number(card!.spendingLimitMonthly) / 100,
            spent: Number(card!.spentThisMonthCents) / 100,
            remaining: (Number(card!.spendingLimitMonthly) - Number(card!.spentThisMonthCents)) / 100,
          },
          settings: settings ? {
            onlineEnabled: settings.onlineEnabled,
            contactlessEnabled: settings.contactlessEnabled,
            atmEnabled: settings.atmEnabled,
            internationalEnabled: settings.internationalEnabled,
          } : null,
        },
      });
    }
    
    // Return card details (masked by default)
    const showFull = searchParams.get('showFull') === 'true';
    
    // Serialize settings to handle BigInt
    const serializedSettings = card!.CardSettings ? {
      id: card!.CardSettings.id,
      cardId: card!.CardSettings.cardId,
      onlineEnabled: card!.CardSettings.onlineEnabled,
      contactlessEnabled: card!.CardSettings.contactlessEnabled,
      atmEnabled: card!.CardSettings.atmEnabled,
      internationalEnabled: card!.CardSettings.internationalEnabled,
      dailyLimit: Number(card!.CardSettings.dailyLimit) / 100,
      monthlyLimit: Number(card!.CardSettings.monthlyLimit) / 100,
      transactionAlerts: card!.CardSettings.transactionAlerts,
      createdAt: card!.CardSettings.createdAt.toISOString(),
      updatedAt: card!.CardSettings.updatedAt.toISOString(),
    } : null;
    
    return NextResponse.json({
      success: true,
      data: {
        id: card!.id,
        cardType: card!.cardType,
        cardCategory: card!.cardCategory,
        cardDesign: card!.cardDesign,
        cardNumber: showFull ? atob(card!.panEncrypted) : `**** **** **** ${card!.lastFourDigits}`,
        lastFour: card!.lastFourDigits,
        cvv: showFull ? atob(card!.cvvEncrypted) : '***',
        expiryMonth: card!.expiryMonth,
        expiryYear: card!.expiryYear,
        cardholderName: card!.cardholderName,
        status: card!.status,
        onlineEnabled: card!.onlineEnabled,
        contactlessEnabled: card!.contactlessEnabled,
        atmEnabled: card!.atmEnabled,
        internationalEnabled: card!.internationalEnabled,
        dailyLimit: Number(card!.spendingLimitDaily) / 100,
        monthlyLimit: Number(card!.spendingLimitMonthly) / 100,
        spentToday: Number(card!.spentTodayCents) / 100,
        spentThisMonth: Number(card!.spentThisMonthCents) / 100,
        issuedAt: card!.issuedAt.toISOString(),
        activatedAt: card!.activatedAt?.toISOString(),
        settings: serializedSettings,
      },
    });
  } catch (error) {
    console.error('Card GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch card data' }, { status: 500 });
  }
}

// POST - Create a new virtual card
export async function POST(request: NextRequest) {
  try {
    await ensureDemoUser();
    
    const body = await request.json();
    const { cardType = 'visa', cardDesign = 'default' } = body;
    
    // Check if user already has a card
    const existingCard = await db.consumerCard.findFirst({
      where: { userId: DEMO_USER_ID, status: 'active' }
    });
    
    if (existingCard) {
      return NextResponse.json({ 
        success: false, 
        error: 'User already has an active card' 
      }, { status: 400 });
    }
    
    const { pan, lastFour } = generateCardNumber();
    const cvv = generateCVV();
    const { month, year } = generateExpiry();
    const cardId = randomUUID();
    const now = new Date();
    
    const card = await db.consumerCard.create({
      data: {
        id: cardId,
        userId: DEMO_USER_ID,
        cardType,
        cardCategory: 'virtual',
        cardDesign,
        lastFourDigits: lastFour,
        cardToken: `TKN${randomUUID().replace(/-/g, '').toUpperCase()}`,
        panEncrypted: btoa(pan),
        cvvEncrypted: btoa(cvv),
        expiryMonth: month,
        expiryYear: year,
        cardholderName: 'THABO MOLEFE',
        status: 'active',
        spendingLimitDaily: BigInt(500000),
        spendingLimitMonthly: BigInt(2500000),
        onlineEnabled: true,
        contactlessEnabled: true,
        atmEnabled: false,
        internationalEnabled: false,
        activatedAt: now,
        createdAt: now,
        updatedAt: now,
      }
    });
    
    // Create default card settings
    await db.cardSettings.create({
      data: {
        id: randomUUID(),
        cardId: cardId,
        onlineEnabled: true,
        contactlessEnabled: true,
        atmEnabled: false,
        internationalEnabled: false,
        dailyLimit: BigInt(500000),
        monthlyLimit: BigInt(2500000),
        transactionAlerts: true,
        createdAt: now,
        updatedAt: now,
      }
    });
    
    return NextResponse.json({
      success: true,
      data: {
        cardId: card.id,
        lastFour: card.lastFourDigits,
        status: card.status,
      },
      message: 'Virtual card created successfully',
    });
  } catch (error) {
    console.error('Card POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create card' }, { status: 500 });
  }
}

// PUT - Update card settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, cardId } = body;
    
    const card = await db.consumerCard.findFirst({
      where: { userId: DEMO_USER_ID }
    });
    
    if (!card) {
      return NextResponse.json({ success: false, error: 'Card not found' }, { status: 404 });
    }
    
    switch (action) {
      case 'freeze': {
        const updatedCard = await db.consumerCard.update({
          where: { id: card.id },
          data: {
            status: 'frozen',
            updatedAt: new Date(),
          }
        });
        
        return NextResponse.json({
          success: true,
          data: { status: updatedCard.status },
          message: 'Card frozen successfully',
        });
      }
      
      case 'unfreeze': {
        const updatedCard = await db.consumerCard.update({
          where: { id: card.id },
          data: {
            status: 'active',
            updatedAt: new Date(),
          }
        });
        
        return NextResponse.json({
          success: true,
          data: { status: updatedCard.status },
          message: 'Card unfrozen successfully',
        });
      }
      
      case 'updateLimits': {
        const { dailyLimit, monthlyLimit } = body;
        
        const updatedCard = await db.consumerCard.update({
          where: { id: card.id },
          data: {
            spendingLimitDaily: dailyLimit ? BigInt(Math.round(dailyLimit * 100)) : undefined,
            spendingLimitMonthly: monthlyLimit ? BigInt(Math.round(monthlyLimit * 100)) : undefined,
            updatedAt: new Date(),
          }
        });
        
        return NextResponse.json({
          success: true,
          data: {
            dailyLimit: Number(updatedCard.spendingLimitDaily) / 100,
            monthlyLimit: Number(updatedCard.spendingLimitMonthly) / 100,
          },
          message: 'Limits updated successfully',
        });
      }
      
      case 'updateSettings': {
        const { onlineEnabled, contactlessEnabled, atmEnabled, internationalEnabled } = body;
        
        const updatedCard = await db.consumerCard.update({
          where: { id: card.id },
          data: {
            onlineEnabled: onlineEnabled ?? card.onlineEnabled,
            contactlessEnabled: contactlessEnabled ?? card.contactlessEnabled,
            atmEnabled: atmEnabled ?? card.atmEnabled,
            internationalEnabled: internationalEnabled ?? card.internationalEnabled,
            updatedAt: new Date(),
          }
        });
        
        // Also update CardSettings if it exists
        if (card.CardSettings) {
          await db.cardSettings.update({
            where: { cardId: card.id },
            data: {
              onlineEnabled: onlineEnabled ?? updatedCard.onlineEnabled,
              contactlessEnabled: contactlessEnabled ?? updatedCard.contactlessEnabled,
              atmEnabled: atmEnabled ?? updatedCard.atmEnabled,
              internationalEnabled: internationalEnabled ?? updatedCard.internationalEnabled,
              updatedAt: new Date(),
            }
          });
        }
        
        return NextResponse.json({
          success: true,
          data: {
            onlineEnabled: updatedCard.onlineEnabled,
            contactlessEnabled: updatedCard.contactlessEnabled,
            atmEnabled: updatedCard.atmEnabled,
            internationalEnabled: updatedCard.internationalEnabled,
          },
          message: 'Settings updated successfully',
        });
      }
      
      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Card PUT error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update card' }, { status: 500 });
  }
}

// DELETE - Cancel card
export async function DELETE(request: NextRequest) {
  try {
    const card = await db.consumerCard.findFirst({
      where: { userId: DEMO_USER_ID, status: 'active' }
    });
    
    if (!card) {
      return NextResponse.json({ success: false, error: 'No active card found' }, { status: 404 });
    }
    
    const body = await request.json().catch(() => ({}));
    const { reason = 'User requested cancellation' } = body;
    
    await db.consumerCard.update({
      where: { id: card.id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledReason: reason,
        updatedAt: new Date(),
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Card cancelled successfully',
    });
  } catch (error) {
    console.error('Card DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Failed to cancel card' }, { status: 500 });
  }
}
