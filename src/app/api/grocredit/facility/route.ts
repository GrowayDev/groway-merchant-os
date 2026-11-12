import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthContext, getMerchantId, unauthorizedResponse, badRequestResponse } from '@/lib/auth-context';

// GET /api/grocredit/facility - Get merchant's credit facility status
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

    // Get or create facility
    let facility = await db.merchantCredit.findUnique({
      where: { merchantId },
      include: {
        tier: true,
        drawRequests: {
          where: { status: { in: ['pending', 'approved', 'disbursed'] } },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        repayments: {
          where: { status: { in: ['pending', 'overdue'] } },
          orderBy: { dueDate: 'asc' },
          take: 5
        }
      }
    });

    // Return null if no facility exists
    if (!facility) {
      return NextResponse.json({
        success: true,
        data: null,
        tiers: []
      });
    }

    // Calculate additional metrics
    const utilizationRate = facility.approvedLimit > 0 
      ? (facility.drawnAmount / facility.approvedLimit) * 100 
      : 0;

    // Get credit tiers for comparison
    const tiers = await db.creditTier.findMany({
      where: { active: true },
      orderBy: { maxLimit: 'asc' }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...facility,
        utilizationRate: Math.round(utilizationRate * 100) / 100,
        creditHealth: utilizationRate < 50 ? 'healthy' : utilizationRate < 80 ? 'moderate' : 'high'
      },
      tiers
    });
  } catch (error) {
    console.error('Error fetching credit facility:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch credit facility' },
      { status: 500 }
    );
  }
}

// POST /api/grocredit/facility - Apply for credit limit increase
export async function POST(request: NextRequest) {
  try {
    // Get authenticated context
    const context = await getAuthContext(request);
    if (!context) {
      return unauthorizedResponse();
    }
    
    const body = await request.json();
    const { merchantId: bodyMerchantId, requestedLimit, reason, documents } = body;
    
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

    // Create limit increase request
    const existingFacility = await db.merchantCredit.findUnique({
      where: { merchantId }
    });

    if (!existingFacility) {
      return NextResponse.json(
        { success: false, error: 'No existing credit facility found' },
        { status: 404 }
      );
    }

    // Log the request as a notification
    await db.creditNotification.create({
      data: {
        merchantCreditId: existingFacility.id,
        type: 'limit_review',
        title: 'Credit Limit Increase Requested',
        message: `Request for limit increase to R${requestedLimit?.toLocaleString() || 'N/A'} has been submitted for review.`,
        channel: 'in_app'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Credit limit increase request submitted successfully',
      data: {
        currentLimit: existingFacility.approvedLimit,
        requestedLimit,
        status: 'under_review'
      }
    });
  } catch (error) {
    console.error('Error requesting limit increase:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit limit increase request' },
      { status: 500 }
    );
  }
}
