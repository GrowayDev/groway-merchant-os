import { NextRequest, NextResponse } from 'next/server'

// Mock investment products for demo
const mockInvestmentProducts = [
  {
    id: 'fixed-3-month',
    name: '3-Month Fixed Term Savings',
    type: 'fixed_term',
    description: 'Lock your money for 3 months and earn competitive interest. Great for short-term goals.',
    minAmount: 100000,     // R1,000
    maxAmount: 100000000,  // R1,000,000
    termMonths: 3,
    interestRate: 7.5,
    interestType: 'fixed',
    interestPayout: 'maturity',
    features: [
      'Guaranteed returns',
      'Interest paid at maturity',
      'Early withdrawal penalty: 2%',
      'Automatic renewal option'
    ],
    risks: [
      'Early withdrawal penalty applies',
      'Fixed rate - no benefit if rates rise'
    ]
  },
  {
    id: 'fixed-6-month',
    name: '6-Month Fixed Term Savings',
    type: 'fixed_term',
    description: 'Higher interest rate for a 6-month commitment. Perfect for medium-term savings.',
    minAmount: 100000,     // R1,000
    maxAmount: 500000000,  // R5,000,000
    termMonths: 6,
    interestRate: 8.25,
    interestType: 'fixed',
    interestPayout: 'maturity',
    features: [
      'Guaranteed returns',
      'Interest paid at maturity',
      'Early withdrawal penalty: 3%',
      'Compound interest option'
    ],
    risks: [
      'Early withdrawal penalty applies',
      'Fixed rate - no benefit if rates rise'
    ]
  },
  {
    id: 'fixed-12-month',
    name: '12-Month Fixed Term Savings',
    type: 'fixed_term',
    description: 'Our best rates for a year-long commitment. Ideal for long-term savings goals.',
    minAmount: 100000,     // R1,000
    maxAmount: 1000000000, // R10,000,000
    termMonths: 12,
    interestRate: 9.5,
    interestType: 'fixed',
    interestPayout: 'quarterly',
    features: [
      'Best guaranteed rates',
      'Quarterly interest payouts option',
      'Early withdrawal penalty: 4%',
      'Auto-renewal with rate adjustment',
      'Ideal for goal-based savings'
    ],
    risks: [
      'Early withdrawal penalty applies',
      'Fixed rate - no benefit if rates rise'
    ]
  },
  {
    id: 'goal-emergency',
    name: 'Emergency Fund Goal',
    type: 'goal_based',
    description: 'Build your emergency fund with automatic savings. Access funds when you need them.',
    minAmount: 50000,      // R500
    maxAmount: 50000000,   // R500,000
    termMonths: null,
    interestRate: 6.5,
    interestType: 'variable',
    interestPayout: 'monthly',
    features: [
      'Flexible deposits anytime',
      'Withdraw anytime (1 day notice)',
      'Auto-save rules available',
      'Goal tracking dashboard',
      'Interest paid monthly',
      'Recommended: 3 months expenses'
    ],
    risks: [
      'Variable rate - may decrease'
    ]
  },
  {
    id: 'goal-holiday',
    name: 'Holiday Savings Goal',
    type: 'goal_based',
    description: 'Save for your dream vacation with targeted savings. Track progress towards your goal.',
    minAmount: 25000,      // R250
    maxAmount: 100000000,  // R1,000,000
    termMonths: null,
    interestRate: 7.0,
    interestType: 'variable',
    interestPayout: 'monthly',
    features: [
      'Set target date and amount',
      'Track progress visually',
      'Flexible contributions',
      'Early withdrawal allowed',
      'Interest paid monthly'
    ],
    risks: [
      'Variable rate - may decrease'
    ]
  },
  {
    id: 'goal-education',
    name: 'Education Savings Goal',
    type: 'goal_based',
    description: 'Invest in education for yourself or loved ones. Higher rates for education goals.',
    minAmount: 100000,     // R1,000
    maxAmount: 500000000,  // R5,000,000
    termMonths: null,
    interestRate: 8.0,
    interestType: 'variable',
    interestPayout: 'monthly',
    features: [
      'Higher education bonus rate',
      'Flexible contributions',
      'Beneficiary designation',
      'Progress tracking',
      'Interest paid monthly'
    ],
    risks: [
      'Variable rate - may decrease'
    ]
  },
  {
    id: 'stokvel-savings',
    name: 'Stokvel Savings Account',
    type: 'stokvel',
    description: 'Join a stokvel or create your own. Pool savings with friends and family for better returns.',
    minAmount: 50000,      // R500
    maxAmount: 50000000,   // R500,000
    termMonths: 12,        // Typical stokvel cycle
    interestRate: 10.0,
    interestType: 'fixed',
    interestPayout: 'maturity',
    features: [
      'Create or join a stokvel group',
      'Monthly contributions',
      'Rotating payouts',
      'Group chat and coordination',
      'Higher interest for groups',
      'Transparency for all members'
    ],
    risks: [
      'Group dependency',
      'Fixed commitment schedule'
    ]
  },
  {
    id: 'notice-32-day',
    name: '32-Day Notice Account',
    type: 'notice',
    description: 'Higher interest with just 32 days notice. Balance between access and returns.',
    minAmount: 50000,      // R500
    maxAmount: 200000000,  // R2,000,000
    noticeDays: 32,
    interestRate: 7.75,
    interestType: 'variable',
    interestPayout: 'monthly',
    features: [
      'Give 32 days notice to withdraw',
      'No penalty for notice withdrawals',
      'Competitive rates',
      'Interest paid monthly',
      'Multiple notice requests allowed'
    ],
    risks: [
      'Variable rate - may decrease',
      'Notice period required for access'
    ]
  }
]

// Mock stored investments
const mockInvestments: Map<string, any[]> = new Map()
const mockStokvelGroups: Map<string, any[]> = new Map()

// Calculate interest for an investment
function calculateInterest(principal: number, rate: number, months: number): number {
  // Simple interest calculation (annual rate, compounded monthly)
  const monthlyRate = rate / 100 / 12
  return Math.round(principal * monthlyRate * months)
}

// Calculate maturity value
function calculateMaturityValue(principal: number, rate: number, months: number): number {
  const interest = calculateInterest(principal, rate, months)
  return principal + interest
}

// GET /api/consumer/investments - Get investment products and user investments
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const type = searchParams.get('type')
  const userId = searchParams.get('userId') || 'demo-user'

  // Get all products or by type
  if (action === 'products' || !action) {
    let products = mockInvestmentProducts
    
    if (type) {
      products = products.filter(p => p.type === type)
    }
    
    return NextResponse.json({
      success: true,
      data: products.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        description: p.description,
        minAmount: p.minAmount,
        maxAmount: p.maxAmount,
        termMonths: p.termMonths,
        interestRate: p.interestRate,
        interestType: p.interestType,
        features: p.features?.slice(0, 3),
      }))
    })
  }

  // Get product details
  if (action === 'detail') {
    const productId = searchParams.get('productId')
    const product = mockInvestmentProducts.find(p => p.id === productId)
    
    if (!product) {
      return NextResponse.json({
        success: false,
        error: 'Product not found'
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      data: product
    })
  }

  // Get user's investments
  if (action === 'my-investments') {
    const investments = mockInvestments.get(userId) || []
    return NextResponse.json({
      success: true,
      data: investments
    })
  }

  // Get stokvel groups
  if (action === 'stokvels') {
    const stokvels = mockStokvelGroups.get(userId) || []
    const publicStokvels = [
      {
        id: 'stokvel-1',
        name: 'Family Savings Club',
        description: 'Monthly savings for family goals',
        memberCount: 8,
        contributionAmount: 500000, // R5,000
        currentTotal: 40000000, // R400,000
        status: 'open',
      },
      {
        id: 'stokvel-2',
        name: 'Holiday Fund',
        description: 'December holiday savings',
        memberCount: 12,
        contributionAmount: 100000, // R1,000
        currentTotal: 12000000, // R120,000
        status: 'open',
      }
    ]
    
    return NextResponse.json({
      success: true,
      data: {
        myGroups: stokvels,
        publicGroups: publicStokvels
      }
    })
  }

  // Calculate investment projection
  if (action === 'calculate') {
    const productId = searchParams.get('productId')
    const amount = parseInt(searchParams.get('amount') || '0')
    
    const product = mockInvestmentProducts.find(p => p.id === productId)
    
    if (!product) {
      return NextResponse.json({
        success: false,
        error: 'Product not found'
      }, { status: 404 })
    }

    const months = product.termMonths || 12
    const interest = calculateInterest(amount, product.interestRate, months)
    const maturityValue = calculateMaturityValue(amount, product.interestRate, months)
    
    return NextResponse.json({
      success: true,
      data: {
        principal: amount,
        interestRate: product.interestRate,
        term: months,
        interestEarned: interest,
        maturityValue,
        monthlyInterest: calculateInterest(amount, product.interestRate, 1),
        effectiveAnnualRate: product.interestRate,
      }
    })
  }

  // Get investment types
  if (action === 'types') {
    return NextResponse.json({
      success: true,
      data: [
        { id: 'fixed_term', name: 'Fixed Term Savings', icon: 'Lock', description: 'Lock funds for a set period for higher returns' },
        { id: 'goal_based', name: 'Goal-Based Savings', icon: 'Target', description: 'Save towards specific financial goals' },
        { id: 'stokvel', name: 'Stokvel', icon: 'Users', description: 'Group savings with family and friends' },
        { id: 'notice', name: 'Notice Savings', icon: 'Clock', description: 'Higher interest with notice period for withdrawals' },
      ]
    })
  }

  return NextResponse.json({
    success: true,
    data: mockInvestmentProducts
  })
}

// POST /api/consumer/investments - Create investment or deposit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId = 'demo-user', productId, amount, goalName, goalTarget, autoRenew } = body

    // Create new investment
    if (action === 'create') {
      const product = mockInvestmentProducts.find(p => p.id === productId)
      
      if (!product) {
        return NextResponse.json({
          success: false,
          error: 'Product not found'
        }, { status: 404 })
      }

      // Validate amount
      if (amount < product.minAmount || (product.maxAmount && amount > product.maxAmount)) {
        return NextResponse.json({
          success: false,
          error: `Amount must be between R${product.minAmount / 100} and R${(product.maxAmount || 0) / 100}`
        }, { status: 400 })
      }

      const months = product.termMonths || 12
      const maturityDate = new Date()
      maturityDate.setMonth(maturityDate.getMonth() + months)

      const investment = {
        id: `inv-${Date.now()}`,
        userId,
        productId: product.id,
        productName: product.name,
        productType: product.type,
        principalCents: amount,
        currentCents: amount,
        interestEarned: 0,
        interestRate: product.interestRate,
        startDate: new Date().toISOString(),
        maturityDate: product.termMonths ? maturityDate.toISOString() : null,
        status: 'active',
        goalName: goalName || null,
        goalTargetCents: goalTarget || null,
        autoRenew: autoRenew || false,
        transactions: [
          {
            type: 'deposit',
            amountCents: amount,
            description: 'Initial deposit',
            createdAt: new Date().toISOString(),
          }
        ],
        createdAt: new Date().toISOString(),
      }

      // Store investment
      let investments = mockInvestments.get(userId) || []
      investments.unshift(investment)
      mockInvestments.set(userId, investments)

      return NextResponse.json({
        success: true,
        data: investment,
        message: 'Investment created successfully'
      })
    }

    // Deposit to existing investment
    if (action === 'deposit') {
      const { investmentId, amount: depositAmount } = body
      
      const investments = mockInvestments.get(userId) || []
      const investmentIndex = investments.findIndex(i => i.id === investmentId)
      
      if (investmentIndex === -1) {
        return NextResponse.json({
          success: false,
          error: 'Investment not found'
        }, { status: 404 })
      }

      const investment = investments[investmentIndex]
      
      // Update investment
      investment.currentCents += depositAmount
      investment.principalCents += depositAmount
      investment.transactions.push({
        type: 'deposit',
        amountCents: depositAmount,
        description: 'Additional deposit',
        createdAt: new Date().toISOString(),
      })
      
      mockInvestments.set(userId, investments)

      return NextResponse.json({
        success: true,
        data: investment,
        message: 'Deposit successful'
      })
    }

    // Withdraw from investment
    if (action === 'withdraw') {
      const { investmentId, amount: withdrawAmount } = body
      
      const investments = mockInvestments.get(userId) || []
      const investmentIndex = investments.findIndex(i => i.id === investmentId)
      
      if (investmentIndex === -1) {
        return NextResponse.json({
          success: false,
          error: 'Investment not found'
        }, { status: 404 })
      }

      const investment = investments[investmentIndex]
      
      // Check if withdrawal is allowed (for fixed term, apply penalty)
      if (investment.productType === 'fixed_term') {
        const penaltyRate = 0.04 // 4% penalty
        const penaltyAmount = Math.round(withdrawAmount * penaltyRate)
        const netAmount = withdrawAmount - penaltyAmount
        
        investment.currentCents -= withdrawAmount
        investment.principalCents -= withdrawAmount
        investment.transactions.push({
          type: 'withdrawal',
          amountCents: netAmount,
          description: `Early withdrawal (penalty: R${penaltyAmount / 100})`,
          createdAt: new Date().toISOString(),
        })
      } else {
        investment.currentCents -= withdrawAmount
        investment.principalCents -= withdrawAmount
        investment.transactions.push({
          type: 'withdrawal',
          amountCents: withdrawAmount,
          description: 'Withdrawal',
          createdAt: new Date().toISOString(),
        })
      }
      
      // Update status if fully withdrawn
      if (investment.currentCents <= 0) {
        investment.status = 'withdrawn'
        investment.withdrawnAt = new Date().toISOString()
      }
      
      mockInvestments.set(userId, investments)

      return NextResponse.json({
        success: true,
        data: investment,
        message: 'Withdrawal successful'
      })
    }

    // Create stokvel group
    if (action === 'create-stokvel') {
      const { name, description, contributionAmount, memberPhones } = body
      
      const stokvel = {
        id: `stokvel-${Date.now()}`,
        name,
        description,
        creatorId: userId,
        contributionAmount,
        members: [
          { userId, role: 'admin', payoutPosition: 1 }
        ],
        currentCycle: 1,
        totalSaved: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
      }
      
      let stokvels = mockStokvelGroups.get(userId) || []
      stokvels.unshift(stokvel)
      mockStokvelGroups.set(userId, stokvels)

      return NextResponse.json({
        success: true,
        data: stokvel,
        message: 'Stokvel created successfully'
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 })
  } catch (error) {
    console.error('Investment error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process request'
    }, { status: 500 })
  }
}
