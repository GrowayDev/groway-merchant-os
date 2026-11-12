import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthContext, getMerchantId, unauthorizedResponse, badRequestResponse } from '@/lib/auth-context';

// Helper to generate reference number
function generateReferenceNumber(prefix: string): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 90000) + 10000;
  return `${prefix}-${year}-${random}`;
}

// Calculate interest and payments
function calculateLoanDetails(amount: number, termMonths: number, annualRate: number) {
  const monthlyRate = annualRate / 100 / 12;
  const monthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
    (Math.pow(1 + monthlyRate, termMonths) - 1);
  const totalRepayable = monthlyPayment * termMonths;
  const totalInterest = totalRepayable - amount;
  
  return {
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalRepayable: Math.round(totalRepayable * 100) / 100
  };
}

// GET /api/grocredit/draw-requests - List draw requests
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
      return NextResponse.json({ success: true, data: [] });
    }

    const whereClause: { merchantCreditId: string; status?: string } = { 
      merchantCreditId: facility.id 
    };
    if (status) {
      whereClause.status = status;
    }

    const drawRequests = await db.creditDrawRequest.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: drawRequests
    });
  } catch (error) {
    console.error('Error fetching draw requests:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch draw requests' },
      { status: 500 }
    );
  }
}

// POST /api/grocredit/draw-requests - Create new draw request
export async function POST(request: NextRequest) {
  try {
    // Get authenticated context
    const context = await getAuthContext(request);
    if (!context) {
      return unauthorizedResponse();
    }
    
    const body = await request.json();
    const { merchantId: bodyMerchantId, amount, purpose, purposeDescription, termMonths, poId, poNumber, supplierId, supplierName } = body;
    
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

    // Get facility
    const facility = await db.merchantCredit.findUnique({
      where: { merchantId }
    });

    if (!facility) {
      return NextResponse.json(
        { success: false, error: 'No credit facility found. Please apply first.' },
        { status: 404 }
      );
    }

    if (facility.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Credit facility is not active' },
        { status: 400 }
      );
    }

    // Validate amount
    if (amount > facility.availableCredit) {
      return NextResponse.json(
        { success: false, error: `Insufficient available credit. Maximum: R${facility.availableCredit.toLocaleString()}` },
        { status: 400 }
      );
    }

    // Calculate loan details
    const loanDetails = calculateLoanDetails(amount, termMonths || 12, facility.interestRate);

    // Calculate repayment dates
    const today = new Date();
    const repaymentStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const firstPaymentDue = new Date(repaymentStart);
    const maturityDate = new Date(today.getFullYear(), today.getMonth() + (termMonths || 12), today.getDate());

    // Create draw request
    const drawRequest = await db.creditDrawRequest.create({
      data: {
        referenceNumber: generateReferenceNumber('GC-DR'),
        merchantCreditId: facility.id,
        amount,
        purpose,
        purposeDescription,
        termMonths: termMonths || 12,
        interestRate: facility.interestRate,
        monthlyPayment: loanDetails.monthlyPayment,
        totalInterest: loanDetails.totalInterest,
        totalRepayable: loanDetails.totalRepayable,
        status: 'pending',
        poId,
        poNumber,
        supplierId,
        supplierName,
        repaymentStart: repaymentStart.toISOString().split('T')[0],
        firstPaymentDue: firstPaymentDue.toISOString().split('T')[0],
        maturityDate: maturityDate.toISOString().split('T')[0],
        requestedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: drawRequest,
      message: 'Draw request submitted successfully'
    });
  } catch (error) {
    console.error('Error creating draw request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create draw request' },
      { status: 500 }
    );
  }
}
