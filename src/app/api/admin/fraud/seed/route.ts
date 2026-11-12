import { NextRequest, NextResponse } from 'next/server';
import { seedFraudRules } from '@/lib/fraud-detection-service';

// POST /api/admin/fraud/seed - Seed default fraud rules
export async function POST(request: NextRequest) {
  try {
    await seedFraudRules();
    return NextResponse.json({ success: true, message: 'Fraud rules seeded successfully' });
  } catch (error) {
    console.error('Error seeding fraud rules:', error);
    return NextResponse.json({ error: 'Failed to seed fraud rules' }, { status: 500 });
  }
}
