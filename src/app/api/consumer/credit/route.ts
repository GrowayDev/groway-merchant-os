import { NextRequest, NextResponse } from 'next/server'

// Credit score factors and their weights
const SCORE_FACTORS = {
  payment_reliability: { weight: 0.35, maxPoints: 297 },
  transaction_history: { weight: 0.25, maxPoints: 212 },
  account_age: { weight: 0.15, maxPoints: 127 },
  wallet_behavior: { weight: 0.15, maxPoints: 127 },
  kyc_level: { weight: 0.10, maxPoints: 85 },
}

// Determine credit tier from score
function getCreditTier(score: number): { tier: string; color: string; label: string } {
  if (score >= 750) return { tier: 'excellent', color: '#4CAF50', label: 'Excellent' }
  if (score >= 670) return { tier: 'good', color: '#8BC34A', label: 'Good' }
  if (score >= 580) return { tier: 'fair', color: '#FFC107', label: 'Fair' }
  if (score >= 500) return { tier: 'poor', color: '#FF9800', label: 'Poor' }
  return { tier: 'very_poor', color: '#F44336', label: 'Very Poor' }
}

// Calculate BNPL eligibility
function calculateBNPLEligibility(score: number, kycLevel: number): { 
  eligible: boolean
  maxLimit: number 
  reason?: string 
} {
  if (kycLevel < 2) {
    return { eligible: false, maxLimit: 0, reason: 'KYC Level 2 required' }
  }
  if (score < 500) {
    return { eligible: false, maxLimit: 0, reason: 'Credit score too low (minimum 500)' }
  }
  
  // Limits based on score
  if (score >= 750) return { eligible: true, maxLimit: 50000 } // R500
  if (score >= 670) return { eligible: true, maxLimit: 30000 } // R300
  if (score >= 580) return { eligible: true, maxLimit: 15000 } // R150
  return { eligible: true, maxLimit: 5000 } // R50
}

// GET - Fetch credit score and eligibility
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get credit score overview
    if (action === 'score' || !action) {
      // In production, fetch from database and ML model
      // const creditData = await db.creditScore.findUnique({ where: { userId } })
      
      const score = 672
      const tier = getCreditTier(score)
      const bnplEligibility = calculateBNPLEligibility(score, 3)

      const scoreBreakdown = [
        { factor: 'Payment Reliability', score: 85, maxScore: 100, weight: '35%', status: 'excellent' },
        { factor: 'Transaction History', score: 72, maxScore: 100, weight: '25%', status: 'good' },
        { factor: 'Account Age', score: 58, maxScore: 100, weight: '15%', status: 'building' },
        { factor: 'Wallet Behavior', score: 80, maxScore: 100, weight: '15%', status: 'good' },
        { factor: 'KYC Verification', score: 100, maxScore: 100, weight: '10%', status: 'complete' },
      ]

      const improvementTips = [
        { tip: 'Make 3 more on-time payments', impact: '+15 points', timeframe: '1 month' },
        { tip: 'Keep wallet balance above R100', impact: '+8 points', timeframe: '2 weeks' },
        { tip: 'Complete KYC Level 4 (proof of address)', impact: '+12 points', timeframe: 'Immediate' },
      ]

      return NextResponse.json({
        success: true,
        data: {
          score,
          tier: tier.tier,
          tierLabel: tier.label,
          tierColor: tier.color,
          lastUpdated: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
          nextUpdate: new Date(Date.now() + 18 * 60 * 60 * 1000), // 18 hours from now
          scoreBreakdown,
          bnplEligibility,
          improvementTips,
          history: [
            { month: 'Feb 2026', score: 645 },
            { month: 'Jan 2026', score: 638 },
            { month: 'Dec 2025', score: 620 },
            { month: 'Nov 2025', score: 605 },
          ],
        }
      })
    }

    // Get BNPL active plans
    if (action === 'bnpl') {
      const activePlans = [
        {
          id: 'bnpl-001',
          merchant: 'Checkers Hyper',
          originalAmount: 45000, // R450
          remainingAmount: 15000, // R150
          instalmentsTotal: 3,
          instalmentsPaid: 2,
          nextPaymentDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          nextPaymentAmount: 15000,
          status: 'active',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      ]

      return NextResponse.json({
        success: true,
        data: {
          activePlans,
          totalOwed: 15000,
          availableLimit: 35000, // R50k - R15k
          totalLimit: 50000,
        }
      })
    }

    // Get EWA (Earned Wage Access) status
    if (action === 'ewa') {
      const ewaData = {
        eligible: true,
        employer: 'ABC Corporation',
        employerVerified: true,
        monthlySalary: 2500000, // R25,000
        accruedAmount: 1250000, // R12,500 (half month)
        maxAccess: 750000, // R7,500 (60% of accrued)
        fee: 2500, // R25 flat fee
        lastAccess: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        nextAccess: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Can access once per week
        canAccessNow: true,
      }

      return NextResponse.json({
        success: true,
        data: ewaData
      })
    }

    // Get laybye plans
    if (action === 'laybye') {
      const laybyes = [
        {
          id: 'laybye-001',
          merchant: 'Game Stores',
          item: 'Samsung 65" Smart TV',
          originalAmount: 1599900, // R15,999
          paidAmount: 800000, // R8,000
          remainingAmount: 799900, // R7,999
          depositPaid: 320000, // R3,200 (20%)
          instalmentAmount: 133300, // R1,333/month
          nextPaymentDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          monthsRemaining: 6,
          status: 'active',
          expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        },
      ]

      return NextResponse.json({
        success: true,
        data: { laybyes }
      })
    }

    // Get credit marketplace offers
    if (action === 'marketplace') {
      const offers = [
        {
          id: 'offer-001',
          lender: 'African Bank',
          lenderLogo: '/lenders/african-bank.png',
          productType: 'personal_loan',
          amount: 5000000, // R50,000
          termMonths: 24,
          interestRate: 21.5,
          monthlyPayment: 271500, // R2,715
          totalRepayment: 6516000, // R65,160
          apr: 24.5,
          features: ['No early settlement fee', 'Credit life included'],
          matchScore: 95,
          recommended: true,
        },
        {
          id: 'offer-002',
          lender: 'Capitec Bank',
          lenderLogo: '/lenders/capitec.png',
          productType: 'personal_loan',
          amount: 5000000,
          termMonths: 36,
          interestRate: 19.5,
          monthlyPayment: 187300,
          totalRepayment: 6742800,
          apr: 22.8,
          features: ['Flexible repayment', 'Mobile app management'],
          matchScore: 88,
        },
        {
          id: 'offer-003',
          lender: 'FNB',
          lenderLogo: '/lenders/fnb.png',
          productType: 'personal_loan',
          amount: 5000000,
          termMonths: 24,
          interestRate: 18.9,
          monthlyPayment: 267800,
          totalRepayment: 6427200,
          apr: 21.5,
          features: ['eBucks rewards', 'Instant approval'],
          matchScore: 82,
        },
      ]

      return NextResponse.json({
        success: true,
        data: {
          prequalified: true,
          softCheckPerformed: true,
          offers,
          requestedAmount: 5000000,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }
      })
    }

    // Get DebiCheck mandates
    if (action === 'debicheck') {
      const mandates = [
        {
          id: 'mandate-001',
          creditor: 'Game Stores',
          amount: 133300,
          frequency: 'monthly',
          nextCollectionDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          status: 'active',
          reference: 'LAYBYE-SAM-TV-001',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
        {
          id: 'mandate-002',
          creditor: 'Vodacom Contract',
          amount: 89900,
          frequency: 'monthly',
          nextCollectionDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
          status: 'active',
          reference: 'VODACOM-CELL-12345',
          createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
        },
      ]

      return NextResponse.json({
        success: true,
        data: { mandates }
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Credit GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get credit data' },
      { status: 500 }
    )
  }
}

// POST - Credit actions (BNPL, EWA, Marketplace applications)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, action, amount, merchantId, itemId, termMonths } = body

    if (!userId || !action) {
      return NextResponse.json(
        { success: false, error: 'User ID and action are required' },
        { status: 400 }
      )
    }

    // Initiate BNPL
    if (action === 'bnpl_initiate') {
      if (!amount || !merchantId) {
        return NextResponse.json(
          { success: false, error: 'Amount and merchant ID required for BNPL' },
          { status: 400 }
        )
      }

      // In production:
      // 1. Check BNPL eligibility
      // 2. Create NCA pre-agreement disclosure
      // 3. Return disclosure for user acceptance

      const disclosure = {
        id: `bnpl-disc-${Date.now()}`,
        userId,
        merchantId,
        amount,
        instalments: 3,
        instalmentAmount: Math.ceil(amount / 3),
        firstPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        secondPaymentDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        thirdPaymentDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        totalRepayment: amount, // Interest-free for BNPL
        ncaDisclosure: 'This is a credit agreement under the National Credit Act. Your rights are protected.',
        coolingOffPeriod: 5, // days
        status: 'pending_acceptance',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }

      return NextResponse.json({
        success: true,
        message: 'BNPL disclosure generated. User must accept before proceeding.',
        data: { disclosure }
      })
    }

    // Accept BNPL agreement
    if (action === 'bnpl_accept') {
      const { disclosureId } = body
      
      if (!disclosureId) {
        return NextResponse.json(
          { success: false, error: 'Disclosure ID required' },
          { status: 400 }
        )
      }

      // In production:
      // 1. Verify disclosure exists and not expired
      // 2. Create credit agreement record
      // 3. Set up DebiCheck mandates
      // 4. Process payment to merchant

      return NextResponse.json({
        success: true,
        message: 'BNPL agreement accepted. Payment sent to merchant.',
        data: {
          agreementId: `bnpl-agr-${Date.now()}`,
          status: 'active',
          firstPaymentDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }
      })
    }

    // Request EWA (Earned Wage Access)
    if (action === 'ewa_request') {
      if (!amount) {
        return NextResponse.json(
          { success: false, error: 'Amount required for EWA' },
          { status: 400 }
        )
      }

      // In production:
      // 1. Verify employer and accrued amount
      // 2. Check within limits
      // 3. Process transfer to wallet
      // 4. Schedule repayment from next salary

      const fee = Math.ceil(amount * 0.005) // 0.5% fee

      return NextResponse.json({
        success: true,
        message: 'EWA approved. Funds transferred to your wallet.',
        data: {
          transactionId: `ewa-${Date.now()}`,
          amount,
          fee,
          netAmount: amount - fee,
          repaymentDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // Next payday
          status: 'completed',
        }
      })
    }

    // Apply for marketplace loan
    if (action === 'marketplace_apply') {
      const { offerId } = body

      if (!offerId) {
        return NextResponse.json(
          { success: false, error: 'Offer ID required' },
          { status: 400 }
        )
      }

      // In production:
      // 1. Submit formal application to lender
      // 2. Hard credit check (with consent)
      // 3. Final approval from lender

      return NextResponse.json({
        success: true,
        message: 'Application submitted to lender. You will receive a response within 24 hours.',
        data: {
          applicationId: `loan-app-${Date.now()}`,
          offerId,
          status: 'submitted',
          estimatedResponse: new Date(Date.now() + 24 * 60 * 60 * 1000),
        }
      })
    }

    // Create laybye
    if (action === 'laybye_create') {
      const { depositAmount, instalmentAmount } = body

      if (!itemId || !merchantId || !amount || !depositAmount) {
        return NextResponse.json(
          { success: false, error: 'Item, merchant, amount, and deposit required' },
          { status: 400 }
        )
      }

      // Minimum deposit 10%
      if (depositAmount < amount * 0.1) {
        return NextResponse.json(
          { success: false, error: 'Minimum deposit is 10% of item price' },
          { status: 400 }
        )
      }

      const monthsToPay = Math.ceil((amount - depositAmount) / (instalmentAmount || amount * 0.1))

      return NextResponse.json({
        success: true,
        message: 'Laybye created successfully',
        data: {
          laybyeId: `laybye-${Date.now()}`,
          itemId,
          merchantId,
          totalAmount: amount,
          depositAmount,
          remainingAmount: amount - depositAmount,
          monthsToPay,
          expiresAt: new Date(Date.now() + monthsToPay * 30 * 24 * 60 * 60 * 1000),
          status: 'active',
        }
      })
    }

    // Manage DebiCheck mandate
    if (action === 'debicheck_pause' || action === 'debicheck_cancel') {
      const { mandateId } = body

      if (!mandateId) {
        return NextResponse.json(
          { success: false, error: 'Mandate ID required' },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        message: `DebiCheck mandate ${action === 'debicheck_pause' ? 'paused' : 'cancelled'} successfully`,
        data: {
          mandateId,
          status: action === 'debicheck_pause' ? 'paused' : 'cancelled',
        }
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Credit POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process credit action' },
      { status: 500 }
    )
  }
}
