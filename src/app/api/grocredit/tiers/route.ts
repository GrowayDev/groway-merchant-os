import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/grocredit/tiers - List credit tiers
export async function GET(request: NextRequest) {
  try {
    const tiers = await db.creditTier.findMany({
      where: { active: true },
      orderBy: { maxLimit: 'asc' }
    });

    // If no tiers exist, create default ones
    if (tiers.length === 0) {
      const defaultTiers = [
        {
          name: 'starter',
          displayName: 'Starter',
          minLimit: 5000,
          maxLimit: 25000,
          interestRate: 15.5,
          interestSpread: 8,
          termMonths: 6,
          minTermMonths: 1,
          maxTermMonths: 12,
          earlyPayDiscount: 2,
          requireNCA: true,
          requireGuarantee: false,
          minRevenue: 10000,
          minTradingMonths: 3,
          features: JSON.stringify([
            'Quick approval in 24 hours',
            'Flexible repayment terms',
            'No collateral required',
            'Auto-repay from sales'
          ]),
          color: '#94A3B8',
          icon: 'BadgeZAR'
        },
        {
          name: 'business',
          displayName: 'Business',
          minLimit: 25000,
          maxLimit: 100000,
          interestRate: 13.25,
          interestSpread: 6,
          termMonths: 12,
          minTermMonths: 3,
          maxTermMonths: 24,
          earlyPayDiscount: 2.5,
          requireNCA: true,
          requireGuarantee: false,
          minRevenue: 30000,
          minTradingMonths: 6,
          features: JSON.stringify([
            'Higher credit limits',
            'Lower interest rates',
            'Priority support',
            'GroSupply integration',
            'Instant draw facility'
          ]),
          color: '#00897B',
          icon: 'BadgeZAR'
        },
        {
          name: 'enterprise',
          displayName: 'Enterprise',
          minLimit: 100000,
          maxLimit: 500000,
          interestRate: 11.5,
          interestSpread: 5,
          termMonths: 24,
          minTermMonths: 6,
          maxTermMonths: 36,
          earlyPayDiscount: 3,
          requireNCA: true,
          requireGuarantee: true,
          minRevenue: 100000,
          minTradingMonths: 12,
          features: JSON.stringify([
            'Highest credit limits',
            'Best interest rates',
            'Dedicated account manager',
            'Custom repayment schedules',
            'Multi-location support',
            'Seasonal flexibility'
          ]),
          color: '#4CAF50',
          icon: 'BadgeZAR'
        },
        {
          name: 'seasonal',
          displayName: 'Seasonal',
          minLimit: 10000,
          maxLimit: 75000,
          interestRate: 12.75,
          interestSpread: 5.5,
          termMonths: 3,
          minTermMonths: 1,
          maxTermMonths: 6,
          earlyPayDiscount: 3.5,
          requireNCA: true,
          requireGuarantee: false,
          minRevenue: 20000,
          minTradingMonths: 3,
          features: JSON.stringify([
            'Short-term seasonal funding',
            'Quick approval',
            'Flexible draw and repay',
            'Perfect for stock builds',
            'No early payment penalty'
          ]),
          color: '#FF9800',
          icon: 'BadgeZAR'
        }
      ];

      for (const tier of defaultTiers) {
        await db.creditTier.create({ data: tier });
      }

      const createdTiers = await db.creditTier.findMany({
        where: { active: true },
        orderBy: { maxLimit: 'asc' }
      });

      return NextResponse.json({
        success: true,
        data: createdTiers
      });
    }

    return NextResponse.json({
      success: true,
      data: tiers
    });
  } catch (error) {
    console.error('Error fetching tiers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch credit tiers' },
      { status: 500 }
    );
  }
}
