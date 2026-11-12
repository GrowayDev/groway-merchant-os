import { NextRequest, NextResponse } from 'next/server';
import { performFraudCheck, recordVelocity } from '@/lib/fraud-detection-service';

/**
 * POST /api/fraud/check
 * Perform a fraud check for a transaction or action
 */
export async function POST(request: NextRequest) {
  try {
    const context = await request.json();

    // Validate required fields
    if (!context.entityType || !context.entityId || !context.sourceApp) {
      return NextResponse.json(
        { error: 'Missing required fields: entityType, entityId, sourceApp' },
        { status: 400 }
      );
    }

    // Perform fraud check
    const result = await performFraudCheck(context);

    // Record velocity if it's a transaction
    if (context.entityType === 'transaction' || context.amount) {
      await recordVelocity(context);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Fraud check error:', error);
    
    // Return a safe default - allow but with zero risk score
    return NextResponse.json({
      passed: true,
      riskScore: 0,
      alerts: [],
      blocked: false,
      recommendation: 'allow'
    });
  }
}
