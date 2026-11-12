import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthContext, getMerchantId, unauthorizedResponse, badRequestResponse } from '@/lib/auth-context';

// GET /api/grocredit/apply - Get application status
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

    const application = await db.creditApplication.findUnique({
      where: { merchantId }
    });

    // Return null if no application exists
    if (!application) {
      return NextResponse.json({
        success: true,
        data: null
      });
    }

    return NextResponse.json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error('Error fetching application:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch application' },
      { status: 500 }
    );
  }
}

// POST /api/grocredit/apply - Submit credit application
export async function POST(request: NextRequest) {
  try {
    // Get authenticated context
    const context = await getAuthContext(request);
    if (!context) {
      return unauthorizedResponse();
    }
    
    const body = await request.json();
    const {
      merchantId: bodyMerchantId,
      businessName,
      tradingName,
      registrationNumber,
      vatNumber,
      businessType,
      industry,
      tradingMonths,
      monthlyRevenue,
      annualRevenue,
      requestedAmount,
      requestedTerm = 12,
      purpose,
      bankName,
      bankAccount,
      bankBranch,
      accountHolder,
      idDocumentUrl,
      proofOfAddressUrl,
      bankStatementUrl,
      financialStatements
    } = body;
    
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

    // Check if application already exists
    const existing = await db.creditApplication.findUnique({
      where: { merchantId }
    });

    if (existing && existing.status === 'approved') {
      return NextResponse.json(
        { success: false, error: 'You already have an approved credit facility' },
        { status: 400 }
      );
    }

    // Determine suggested tier based on requested amount and revenue
    let suggestedTier = 'starter';
    let suggestedRate = 15.5;
    const interestSpread = 5;
    const repoRate = 8.25; // Current SA repo rate

    if (requestedAmount >= 100000 || (monthlyRevenue && monthlyRevenue >= 100000)) {
      suggestedTier = 'enterprise';
      suggestedRate = repoRate + 3.25; // 11.5%
    } else if (requestedAmount >= 25000 || (monthlyRevenue && monthlyRevenue >= 30000)) {
      suggestedTier = 'business';
      suggestedRate = repoRate + 5; // 13.25%
    }

    // For seasonal businesses
    if (purpose === 'seasonal' || purpose === 'stock_build') {
      suggestedTier = 'seasonal';
      suggestedRate = repoRate + 4.5; // 12.75%
    }

    if (existing) {
      // Update existing application
      const updated = await db.creditApplication.update({
        where: { merchantId },
        data: {
          businessName,
          tradingName,
          registrationNumber,
          vatNumber,
          businessType,
          industry,
          tradingMonths,
          monthlyRevenue,
          annualRevenue,
          requestedAmount,
          requestedTerm,
          purpose,
          bankName,
          bankAccount,
          bankBranch,
          accountHolder,
          idDocumentUrl,
          proofOfAddressUrl,
          bankStatementUrl,
          financialStatements,
          status: 'submitted',
          assignedTier: suggestedTier,
          approvedLimit: requestedAmount,
          approvedRate: suggestedRate,
          submittedAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: 'Application updated and submitted successfully'
      });
    }

    // Create new application
    const application = await db.creditApplication.create({
      data: {
        merchantId,
        businessName,
        tradingName,
        registrationNumber,
        vatNumber,
        businessType,
        industry,
        tradingMonths,
        monthlyRevenue,
        annualRevenue,
        requestedAmount,
        requestedTerm,
        purpose,
        bankName,
        bankAccount,
        bankBranch,
        accountHolder,
        idDocumentUrl,
        proofOfAddressUrl,
        bankStatementUrl,
        financialStatements,
        status: 'submitted',
        assignedTier: suggestedTier,
        approvedLimit: requestedAmount,
        approvedRate: suggestedRate,
        submittedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: application,
      message: 'Application submitted successfully. You will be notified within 24-48 hours.'
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}
