import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, getUserId, unauthorizedResponse, badRequestResponse } from '@/lib/auth-context'

// In-memory storage for EWA (Earned Wage Access)
const ewaStore: Map<string, any> = new Map()

// GET /api/consumer/ewa - Get EWA status and eligibility
export async function GET(request: NextRequest) {
  // Get authenticated context
  const context = await getAuthContext(request)
  if (!context) {
    return unauthorizedResponse()
  }
  
  const { searchParams } = new URL(request.url)
  
  // Get userId from params or context
  const userIdResult = getUserId(searchParams, context)
  if (userIdResult instanceof NextResponse) {
    return userIdResult
  }
  const userId = userIdResult
  
  // Get or create EWA data
  let ewaData = ewaStore.get(userId)
  
  if (!ewaData) {
    // Demo EWA data
    ewaData = {
      userId,
      employerId: 'employer-001',
      employerName: 'ACME Corp (Pty) Ltd',
      employerLogo: null,
      syncStatus: 'synced',
      lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      
      // Monthly earnings
      monthlySalaryCents: 2500000, // R25,000
      accruedThisMonthCents: 1083300, // R10,833 (earned so far)
      availablePercentage: 60,
      availableCents: 650000, // R6,500 (60% of accrued)
      withdrawnThisMonthCents: 96600, // R966 already withdrawn
      
      // Work days
      totalWorkDaysThisMonth: 28,
      daysWorked: 18,
      daysRemaining: 10,
      
      // Plan
      plan: 'pay_per_use', // 'pay_per_use' or 'unlimited'
      planFee: 0,
      withdrawalFeePercent: 3, // 3% for pay_per_use
      
      // History
      withdrawalHistory: [
        {
          id: 'ewa-wd-1',
          amountCents: 250000,
          feeCents: 7500,
          netAmountCents: 242500,
          reason: 'Emergency expense',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'completed'
        },
        {
          id: 'ewa-wd-2',
          amountCents: 100000,
          feeCents: 3000,
          netAmountCents: 97000,
          reason: 'Groceries',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'completed'
        }
      ],
      
      // Weekly breakdown
      weeklyBreakdown: [
        { week: 1, daysWorked: 5, hoursWorked: 40, earnedCents: 416700 },
        { week: 2, daysWorked: 5, hoursWorked: 40, earnedCents: 416700 },
        { week: 3, daysWorked: 5, hoursWorked: 40, earnedCents: 250000 },
      ],
      
      createdAt: new Date().toISOString()
    }
    ewaStore.set(userId, ewaData)
  }
  
  return NextResponse.json({
    success: true,
    data: ewaData
  })
}

// POST /api/consumer/ewa - Request wage withdrawal
export async function POST(request: NextRequest) {
  try {
    // Get authenticated context
    const context = await getAuthContext(request)
    if (!context) {
      return unauthorizedResponse()
    }
    
    const body = await request.json()
    const { userId: bodyUserId, amountCents, reason } = body
    
    // Validate userId - use body param or context
    let userId = bodyUserId
    if (!userId) {
      userId = context.userId
    }
    
    // Security check: ensure user can only access their own data
    if (userId !== context.userId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }
    
    let ewaData = ewaStore.get(userId)
    if (!ewaData) {
      return NextResponse.json({
        success: false,
        error: 'EWA not set up for this user'
      }, { status: 400 })
    }
    
    // Check eligibility
    const availableAmount = ewaData.accruedThisMonthCents * (ewaData.availablePercentage / 100) - ewaData.withdrawnThisMonthCents
    if (amountCents > availableAmount) {
      return NextResponse.json({
        success: false,
        error: 'Amount exceeds available balance'
      }, { status: 400 })
    }
    
    // Calculate fee
    const feeCents = Math.round(amountCents * (ewaData.withdrawalFeePercent / 100))
    const netAmountCents = amountCents - feeCents
    
    // Create withdrawal record
    const withdrawal = {
      id: `ewa-wd-${Date.now()}`,
      amountCents,
      feeCents,
      netAmountCents,
      reason: reason || 'Wage access',
      createdAt: new Date().toISOString(),
      status: 'completed'
    }
    
    // Update EWA data
    ewaData.withdrawnThisMonthCents += amountCents
    ewaData.availableCents = ewaData.accruedThisMonthCents * (ewaData.availablePercentage / 100) - ewaData.withdrawnThisMonthCents
    ewaData.withdrawalHistory.unshift(withdrawal)
    ewaStore.set(userId, ewaData)
    
    return NextResponse.json({
      success: true,
      data: {
        withdrawal,
        newAvailableCents: ewaData.availableCents,
        message: `R ${(amountCents / 100).toLocaleString('en-ZA')} withdrawn successfully. Fee: R ${(feeCents / 100).toLocaleString('en-ZA')}`
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to process withdrawal'
    }, { status: 500 })
  }
}

// PATCH /api/consumer/ewa - Update EWA plan
export async function PATCH(request: NextRequest) {
  try {
    // Get authenticated context
    const context = await getAuthContext(request)
    if (!context) {
      return unauthorizedResponse()
    }
    
    const body = await request.json()
    const { userId: bodyUserId, plan } = body
    
    // Validate userId - use body param or context
    let userId = bodyUserId
    if (!userId) {
      userId = context.userId
    }
    
    // Security check: ensure user can only access their own data
    if (userId !== context.userId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }
    
    let ewaData = ewaStore.get(userId)
    if (!ewaData) {
      return NextResponse.json({
        success: false,
        error: 'EWA not set up for this user'
      }, { status: 400 })
    }
    
    ewaData.plan = plan
    if (plan === 'unlimited') {
      ewaData.planFee = 9900 // R99/month
      ewaData.withdrawalFeePercent = 0
    } else {
      ewaData.planFee = 0
      ewaData.withdrawalFeePercent = 3
    }
    
    ewaStore.set(userId, ewaData)
    
    return NextResponse.json({
      success: true,
      data: ewaData,
      message: `Plan updated to ${plan === 'unlimited' ? 'Unlimited' : 'Pay Per Use'}`
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to update plan'
    }, { status: 500 })
  }
}
