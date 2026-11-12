import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthContext, getMerchantId, unauthorizedResponse, badRequestResponse } from '@/lib/auth-context';

// Helper to generate reference number
function generateReferenceNumber(prefix: string): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 90000) + 10000;
  return `${prefix}-${year}-${random}`;
}

// GET /api/grocredit/repayments - List repayments
export async function GET(request: NextRequest) {
  try {
    // Get authenticated context
    const context = await getAuthContext(request);
    if (!context) {
      return unauthorizedResponse();
    }
    
    const { searchParams } = new URL(request.url);
    
    // Get merchantId from params or context
    const merchantIdResult = getMerchantId(searchParams, context as any);
    if (merchantIdResult instanceof NextResponse) {
      return merchantIdResult;
    }
    const merchantId = merchantIdResult;
    
    const status = searchParams.get('status');

    const facility = await db.merchantCredit.findUnique({
      where: { merchantId }
    });

    if (!facility) {
      // Return empty for merchants without facility
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    const whereClause: { merchantCreditId: string; status?: string } = { 
      merchantCreditId: facility.id 
    };
    if (status) {
      whereClause.status = status;
    }

    const repayments = await db.creditRepayment.findMany({
      where: whereClause,
      orderBy: { dueDate: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: repayments
    });
  } catch (error) {
    console.error('Error fetching repayments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch repayments' },
      { status: 500 }
    );
  }
}

// POST /api/grocredit/repayments - Make a repayment
export async function POST(request: NextRequest) {
  try {
    // Get authenticated context
    const context = await getAuthContext(request);
    if (!context) {
      return unauthorizedResponse();
    }
    
    const body = await request.json();
    const { merchantId: bodyMerchantId, amount, paymentMethod, drawRequestId } = body;
    
    // Validate merchantId - use body param or context
    let merchantId = bodyMerchantId;
    if (!merchantId && 'merchantId' in context) {
      merchantId = context.merchantId;
    }
    
    if (!merchantId) {
      return badRequestResponse('merchantId is required');
    }
    
    // Security check: ensure user has access to this merchant
    if ('merchantId' in context && merchantId !== context.merchantId) {
      const allowedRoles = ['platform_admin', 'super_admin', 'admin'];
      if (!allowedRoles.includes(context.role)) {
        return NextResponse.json(
          { success: false, error: 'Access denied to this merchant' },
          { status: 403 }
        );
      }
    }

    const facility = await db.merchantCredit.findUnique({
      where: { merchantId }
    });

    if (!facility) {
      return NextResponse.json(
        { success: false, error: 'No credit facility found' },
        { status: 404 }
      );
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Get the next pending repayment
    const nextRepayment = await db.creditRepayment.findFirst({
      where: {
        merchantCreditId: facility.id,
        status: 'pending'
      },
      orderBy: { dueDate: 'asc' }
    });

    if (!nextRepayment) {
      return NextResponse.json(
        { success: false, error: 'No pending repayments found' },
        { status: 404 }
      );
    }

    // Calculate principal vs interest split
    const paymentAmount = amount || nextRepayment.amount;
    const principalPortion = Math.min(paymentAmount * 0.85, nextRepayment.principalAmount);
    const interestPortion = paymentAmount - principalPortion;

    // Update repayment
    const updatedRepayment = await db.creditRepayment.update({
      where: { id: nextRepayment.id },
      data: {
        status: 'paid',
        paidDate: todayStr,
        paymentMethod,
        principalAmount: principalPortion,
        interestAmount: interestPortion,
        balanceAfter: facility.drawnAmount - principalPortion
      }
    });

    // Update facility
    await db.merchantCredit.update({
      where: { id: facility.id },
      data: {
        drawnAmount: facility.drawnAmount - principalPortion,
        availableCredit: facility.availableCredit + principalPortion,
        totalRepaid: facility.totalRepaid + principalPortion,
        totalInterestPaid: facility.totalInterestPaid + interestPortion,
        lastPaymentAt: new Date()
      }
    });

    // Create transaction record
    await db.creditTransaction.create({
      data: {
        merchantCreditId: facility.id,
        type: 'repayment',
        referenceId: nextRepayment.id,
        referenceNumber: nextRepayment.referenceNumber,
        amount: paymentAmount,
        balanceBefore: facility.drawnAmount,
        balanceAfter: facility.drawnAmount - principalPortion,
        description: `Repayment via ${paymentMethod}`
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedRepayment,
      message: 'Payment processed successfully'
    });
  } catch (error) {
    console.error('Error processing repayment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process repayment' },
      { status: 500 }
    );
  }
}
