import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, getUserId, unauthorizedResponse } from '@/lib/auth-context'

// PayShap configuration and storage
const payshapStore: Map<string, any> = new Map()

// PayShap participating banks
const participatingBanks = [
  { code: 'FNB', name: 'First National Bank', color: '#00A651' },
  { code: 'STD', name: 'Standard Bank', color: '#003399' },
  { code: 'ABSA', name: 'Absa', color: '#E31837' },
  { code: 'NED', name: 'Nedbank', color: '#007236' },
  { code: 'CAP', name: 'Capitec Bank', color: '#E31837' },
  { code: 'INV', name: 'Investec', color: '#003366' },
  { code: 'TYM', name: 'TymeBank', color: '#FF6600' },
  { code: 'AFR', name: 'African Bank', color: '#8B0000' },
]

// GET /api/consumer/payshap - Get PayShap details
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
  
  let payshapData = payshapStore.get(userId)
  
  if (!payshapData) {
    // Create PayShap data
    payshapData = {
      userId,
      shapId: `SHAP-${userId.slice(-4).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      phoneProxy: '+27821234567',
      emailProxy: 'user@payshap.co.za',
      idProxy: '8501015800081',
      
      // Default receiving account
      defaultBank: 'FNB',
      defaultAccountType: 'cheque',
      
      // Status
      status: 'active',
      verifiedAt: new Date().toISOString(),
      
      // Pending payments
      pendingPayments: [],
      
      // Recent requests
      recentRequests: [],
      
      // Limits
      dailyLimitCents: 5000000, // R50,000
      monthlyLimitCents: 100000000, // R1,000,000
      usedTodayCents: 0,
      usedThisMonthCents: 0,
      
      createdAt: new Date().toISOString()
    }
    payshapStore.set(userId, payshapData)
  }
  
  return NextResponse.json({
    success: true,
    data: {
      ...payshapData,
      participatingBanks
    }
  })
}

// POST /api/consumer/payshap - Send via PayShap
export async function POST(request: NextRequest) {
  try {
    // Get authenticated context
    const context = await getAuthContext(request)
    if (!context) {
      return unauthorizedResponse()
    }
    
    const body = await request.json()
    const { userId: bodyUserId, proxyType, proxyId, amountCents, reference } = body
    
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
    
    const payshapData = payshapStore.get(userId)
    if (!payshapData) {
      return NextResponse.json({
        success: false,
        error: 'PayShap not configured'
      }, { status: 400 })
    }
    
    // Check limits
    if (amountCents > payshapData.dailyLimitCents - payshapData.usedTodayCents) {
      return NextResponse.json({
        success: false,
        error: 'Amount exceeds daily limit'
      }, { status: 400 })
    }
    
    // Simulate PayShap transfer
    const transaction = {
      id: `ps-tx-${Date.now()}`,
      type: 'payshap_send',
      direction: 'debit',
      amountCents,
      feeCents: 0,
      counterpartyName: 'PayShap Recipient',
      counterpartyProxy: proxyId,
      counterpartyBank: 'FNB',
      description: reference || 'PayShap Transfer',
      status: 'completed',
      reference: `PS${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      createdAt: new Date().toISOString(),
    }
    
    // Update usage
    payshapData.usedTodayCents += amountCents
    payshapData.usedThisMonthCents += amountCents
    payshapStore.set(userId, payshapData)
    
    return NextResponse.json({
      success: true,
      data: {
        transaction,
        message: `R ${(amountCents / 100).toLocaleString('en-ZA')} sent successfully via PayShap`
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'PayShap transfer failed'
    }, { status: 500 })
  }
}

// PATCH /api/consumer/payshap - Request payment or update settings
export async function PATCH(request: NextRequest) {
  try {
    // Get authenticated context
    const context = await getAuthContext(request)
    if (!context) {
      return unauthorizedResponse()
    }
    
    const body = await request.json()
    const { userId: bodyUserId, action, data } = body
    
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
    
    const payshapData = payshapStore.get(userId)
    if (!payshapData) {
      return NextResponse.json({
        success: false,
        error: 'PayShap not configured'
      }, { status: 400 })
    }
    
    if (action === 'request_payment') {
      // Create payment request
      const request = {
        id: `pr-${Date.now()}`,
        requesterName: data.requesterName || 'Groway User',
        amountCents: data.amountCents,
        reference: data.reference || '',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        shapId: payshapData.shapId
      }
      
      return NextResponse.json({
        success: true,
        data: {
          request,
          shareLink: `https://payshap.co.za/pay/${request.id}`,
          message: 'Payment request created'
        }
      })
    }
    
    if (action === 'accept_pending') {
      // Accept pending payment
      const pendingPayment = payshapData.pendingPayments.find(p => p.id === data.paymentId)
      if (!pendingPayment) {
        return NextResponse.json({
          success: false,
          error: 'Pending payment not found'
        }, { status: 404 })
      }
      
      pendingPayment.status = 'accepted'
      
      return NextResponse.json({
        success: true,
        data: {
          payment: pendingPayment,
          message: `R ${(pendingPayment.amountCents / 100).toLocaleString('en-ZA')} received`
        }
      })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Operation failed'
    }, { status: 500 })
  }
}
