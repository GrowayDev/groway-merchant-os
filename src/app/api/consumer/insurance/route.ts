import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Insurance product categories
const INSURANCE_PRODUCTS = [
  {
    id: 'funeral-cover',
    name: 'Funeral Cover',
    category: 'funeral',
    provider: 'Old Mutual',
    description: 'Comprehensive funeral cover for you and your family',
    minPremium: 5000, // R50
    maxPremium: 500000, // R5000
    maxCover: 10000000, // R100,000
    waitingPeriod: 6, // months
    icon: 'shield'
  },
  {
    id: 'life-cover',
    name: 'Life Cover',
    category: 'life',
    provider: 'Discovery',
    description: 'Protect your loved ones financial future',
    minPremium: 10000, // R100
    maxPremium: 1000000, // R10,000
    maxCover: 50000000, // R500,000
    waitingPeriod: 3,
    icon: 'heart'
  },
  {
    id: 'hospital-plan',
    name: 'Hospital Plan',
    category: 'health',
    provider: 'OUTsurance',
    description: 'Daily cash benefit when hospitalized',
    minPremium: 8000, // R80
    maxPremium: 300000, // R3,000
    maxCover: 1000000, // R10,000 per day
    waitingPeriod: 1,
    icon: 'activity'
  },
  {
    id: 'accident-cover',
    name: 'Accident Cover',
    category: 'accident',
    provider: 'Hollard',
    description: 'Coverage for accidental injuries and disability',
    minPremium: 3000, // R30
    maxPremium: 200000, // R2,000
    maxCover: 20000000, // R200,000
    waitingPeriod: 0,
    icon: 'umbrella'
  },
  {
    id: 'device-insurance',
    name: 'Device Insurance',
    category: 'gadget',
    provider: 'King Price',
    description: 'Protect your phone, laptop, and other devices',
    minPremium: 2500, // R25
    maxPremium: 50000, // R500
    maxCover: 3000000, // R30,000
    waitingPeriod: 0,
    icon: 'smartphone'
  }
]

// GET - Fetch available insurance products and user's policies
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const category = searchParams.get('category')

    // Get user's existing policies if userId provided
    let userPolicies: any[] = []
    if (userId) {
      userPolicies = await db.consumerInsurance.findMany({
        where: { userId, status: 'active' }
      })
    }

    // Filter products by category if specified
    let products = INSURANCE_PRODUCTS
    if (category) {
      products = products.filter(p => p.category === category)
    }

    // Add user-specific pricing based on profile (simplified)
    const productsWithPricing = products.map(product => ({
      ...product,
      recommendedPremium: Math.floor((product.minPremium + product.maxPremium) / 2),
      estimatedCover: Math.floor(product.maxCover * 0.5),
      hasPolicy: userPolicies.some(p => p.productType === product.id)
    }))

    return NextResponse.json({
      success: true,
      data: {
        products: productsWithPricing,
        userPolicies: userPolicies.map(p => ({
          id: p.id,
          productType: p.productType,
          provider: p.provider,
          coverAmount: p.coverAmount.toString(),
          premium: p.premium.toString(),
          status: p.status,
          startDate: p.startDate,
          nextPaymentDate: p.nextPaymentDate,
          beneficiaries: p.beneficiaries ? JSON.parse(p.beneficiaries) : []
        })),
        categories: [...new Set(INSURANCE_PRODUCTS.map(p => p.category))]
      }
    })

  } catch (error) {
    console.error('Get insurance products error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get insurance products' },
      { status: 500 }
    )
  }
}

// POST - Purchase insurance policy
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      userId, 
      productId, 
      coverAmount, 
      premiumAmount,
      beneficiaries 
    } = body

    if (!userId || !productId || !coverAmount || !premiumAmount) {
      return NextResponse.json(
        { success: false, error: 'User ID, product, cover amount, and premium are required' },
        { status: 400 }
      )
    }

    // Find product
    const product = INSURANCE_PRODUCTS.find(p => p.id === productId)
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Invalid insurance product' },
        { status: 400 }
      )
    }

    // Validate amounts
    const cover = BigInt(coverAmount)
    const premium = BigInt(premiumAmount)

    if (cover < 10000 || cover > BigInt(product.maxCover)) {
      return NextResponse.json(
        { success: false, error: `Cover amount must be between R100 and R${Number(product.maxCover) / 100}` },
        { status: 400 }
      )
    }

    if (premium < BigInt(product.minPremium) || premium > BigInt(product.maxPremium)) {
      return NextResponse.json(
        { success: false, error: `Premium must be between R${Number(product.minPremium) / 100} and R${Number(product.maxPremium) / 100}` },
        { status: 400 }
      )
    }

    // Get user
    const user = await db.consumerUser.findUnique({
      where: { id: userId },
      include: { wallet: true }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Check wallet balance for first premium
    if (user.wallet && user.wallet.balanceCents < premium) {
      return NextResponse.json(
        { success: false, error: 'Insufficient funds for first premium' },
        { status: 400 }
      )
    }

    // Calculate next payment date (1 month from now)
    const now = new Date()
    const nextPaymentDate = new Date(now)
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1)

    // Create policy
    const policy = await db.consumerInsurance.create({
      data: {
        id: `ins-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        userId,
        productType: productId,
        provider: product.provider,
        coverAmount: cover,
        premium: premium,
        status: 'active',
        startDate: now.toISOString().split('T')[0],
        nextPaymentDate: nextPaymentDate.toISOString().split('T')[0],
        beneficiaries: beneficiaries ? JSON.stringify(beneficiaries) : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    })

    // Deduct first premium from wallet
    if (user.wallet) {
      await db.consumerWallet.update({
        where: { userId },
        data: {
          balanceCents: { decrement: premium }
        }
      })

      // Create transaction
      await db.consumerTransaction.create({
        data: {
          id: `ctx-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          idempotencyKey: `ins-${policy.id}`,
          userId,
          transactionType: 'insurance_premium',
          direction: 'debit',
          amountCents: premium,
          feeCents: BigInt(0),
          netAmountCents: premium,
          currency: 'ZAR',
          status: 'completed',
          description: `${product.name} - First Premium`,
          reference: `INS${Date.now()}`,
          category: 'insurance',
          counterpartyName: product.provider,
          paymentMethod: 'wallet',
          completedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Insurance policy created successfully',
      data: {
        policyId: policy.id,
        product: product.name,
        provider: product.provider,
        coverAmount: cover.toString(),
        premium: premium.toString(),
        startDate: policy.startDate,
        nextPaymentDate: policy.nextPaymentDate,
        status: 'active',
        waitingPeriod: product.waitingPeriod > 0 ? `${product.waitingPeriod} months` : 'None'
      }
    })

  } catch (error) {
    console.error('Purchase insurance error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to purchase insurance' },
      { status: 500 }
    )
  }
}

// PUT - Update policy (change cover, add beneficiaries)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { policyId, userId, action, data } = body

    if (!policyId || !userId || !action) {
      return NextResponse.json(
        { success: false, error: 'Policy ID, User ID, and action are required' },
        { status: 400 }
      )
    }

    // Get policy
    const policy = await db.consumerInsurance.findUnique({
      where: { id: policyId }
    })

    if (!policy || policy.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Policy not found' },
        { status: 404 }
      )
    }

    switch (action) {
      case 'updateBeneficiaries':
        await db.consumerInsurance.update({
          where: { id: policyId },
          data: {
            beneficiaries: JSON.stringify(data.beneficiaries),
            updatedAt: new Date()
          }
        })
        break

      case 'updateCover':
        const newCover = BigInt(data.coverAmount)
        await db.consumerInsurance.update({
          where: { id: policyId },
          data: {
            coverAmount: newCover,
            updatedAt: new Date()
          }
        })
        break

      case 'cancel':
        await db.consumerInsurance.update({
          where: { id: policyId },
          data: {
            status: 'cancelled',
            updatedAt: new Date()
          }
        })
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      message: `Policy ${action} completed successfully`
    })

  } catch (error) {
    console.error('Update insurance policy error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update policy' },
      { status: 500 }
    )
  }
}
