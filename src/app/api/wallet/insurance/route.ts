import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateReference, generateIdempotencyKey, INSURANCE_TYPES, INSURANCE_PROVIDERS, type ApiResponse } from '@/lib/wallet-utils'
import { nanoid } from 'nanoid'

// Insurance Products Mock Data
const INSURANCE_PRODUCTS = [
  // Funeral Cover Products
  {
    id: 'hollard_funeral_1',
    providerId: 'hollard',
    type: 'funeral',
    name: 'Hollard Family Funeral Cover',
    description: 'Comprehensive funeral cover for you and your family',
    minCoverCents: BigInt(5000000),   // R50,000
    maxCoverCents: BigInt(100000000), // R1,000,000
    premiumFromCents: BigInt(8500),   // From R85/month
    premiumToCents: BigInt(450000),   // To R4,500/month
    benefits: ['Family cover up to 10 members', 'Immediate cover', 'Cash payout within 48 hours', 'Groceries benefit'],
    exclusions: ['Suicide within 12 months', 'Pre-existing conditions within 6 months'],
    waitingPeriod: 6,
    maxAge: 75,
    fspNumber: '17673'
  },
  {
    id: 'oldmutual_funeral_1',
    providerId: 'oldmutual',
    type: 'funeral',
    name: 'Old Mutual Funeral Plan',
    description: 'Affordable funeral insurance with extended family benefits',
    minCoverCents: BigInt(5000000),
    maxCoverCents: BigInt(150000000),
    premiumFromCents: BigInt(10000),
    premiumToCents: BigInt(600000),
    benefits: ['Extended family cover', 'Transport benefit', 'Memorial benefit', 'Groceries benefit'],
    exclusions: ['Suicide within 24 months', 'War or terrorism'],
    waitingPeriod: 6,
    maxAge: 80,
    fspNumber: '18042'
  },
  {
    id: 'clientele_funeral_1',
    providerId: 'clientele',
    type: 'funeral',
    name: 'Clientèle Funeral Insurance',
    description: 'Simple and affordable funeral cover',
    minCoverCents: BigInt(3000000),
    maxCoverCents: BigInt(50000000),
    premiumFromCents: BigInt(6000),
    premiumToCents: BigInt(250000),
    benefits: ['Immediate family cover', 'No medical exams', 'Fixed premiums'],
    exclusions: ['Suicide within 12 months'],
    waitingPeriod: 3,
    maxAge: 70,
    fspNumber: '15268'
  },
  // Life Insurance Products
  {
    id: 'sanlam_life_1',
    providerId: 'sanlam',
    type: 'life',
    name: 'Sanlam Life Cover',
    description: 'Comprehensive life insurance for your family\'s future',
    minCoverCents: BigInt(10000000),   // R100,000
    maxCoverCents: BigInt(1000000000), // R10,000,000
    premiumFromCents: BigInt(15000),
    premiumToCents: BigInt(2000000),
    benefits: ['Death benefit', 'Terminal illness benefit', 'Accidental death benefit', 'Premium waiver'],
    exclusions: ['Suicide within 24 months', 'Fraud'],
    waitingPeriod: 0,
    maxAge: 65,
    fspNumber: '16928'
  },
  {
    id: 'discovery_life_1',
    providerId: 'discovery',
    type: 'life',
    name: 'Discovery Life Cover',
    description: 'Life insurance with wellness rewards',
    minCoverCents: BigInt(20000000),
    maxCoverCents: BigInt(500000000),
    premiumFromCents: BigInt(25000),
    premiumToCents: BigInt(1500000),
    benefits: ['Death benefit', 'Vitality integration', 'Premium discounts up to 40%', 'Severe illness benefit'],
    exclusions: ['Suicide within 24 months'],
    waitingPeriod: 0,
    maxAge: 60,
    fspNumber: '47318'
  },
  // Health Insurance Products
  {
    id: 'discovery_health_1',
    providerId: 'discovery',
    type: 'health',
    name: 'Discovery KeyCare',
    description: 'Affordable health insurance with hospital cover',
    minCoverCents: BigInt(0),
    maxCoverCents: BigInt(0),
    premiumFromCents: BigInt(80000),  // R800/month
    premiumToCents: BigInt(250000),   // R2,500/month
    benefits: ['Hospital cover', 'GP visits', 'Chronic medication', 'Specialist cover'],
    exclusions: ['Pre-existing conditions 12 months', 'Cosmetic procedures'],
    waitingPeriod: 3,
    maxAge: 65,
    fspNumber: '47318'
  },
  // Vehicle Insurance Products
  {
    id: 'kingprice_vehicle_1',
    providerId: 'kingprice',
    type: 'vehicle',
    name: 'King Price Car Insurance',
    description: 'Car insurance with decreasing premiums',
    minCoverCents: BigInt(0),
    maxCoverCents: BigInt(0),
    premiumFromCents: BigInt(30000),  // R300/month
    premiumToCents: BigInt(500000),   // R5,000/month
    benefits: ['Comprehensive cover', 'Decreasing premiums', 'Roadside assist', 'Car hire'],
    exclusions: ['Driver under influence', 'Unlicensed driver', 'Off-road use'],
    waitingPeriod: 0,
    maxAge: 0,
    fspNumber: '44632'
  },
  {
    id: 'hollard_vehicle_1',
    providerId: 'hollard',
    type: 'vehicle',
    name: 'Hollard Comprehensive Car Insurance',
    description: 'Full vehicle protection with excellent benefits',
    minCoverCents: BigInt(0),
    maxCoverCents: BigInt(0),
    premiumFromCents: BigInt(45000),
    premiumToCents: BigInt(800000),
    benefits: ['Comprehensive cover', 'Windscreen cover', 'Sound system cover', 'Roadside assist'],
    exclusions: ['Driver under influence', 'Racing', 'Overloading'],
    waitingPeriod: 0,
    maxAge: 0,
    fspNumber: '17673'
  },
  // Device Insurance Products
  {
    id: 'kingprice_device_1',
    providerId: 'kingprice',
    type: 'device',
    name: 'King Price Device Insurance',
    description: 'Protect your smartphone, laptop and gadgets',
    minCoverCents: BigInt(50000),     // R500 device value
    maxCoverCents: BigInt(100000000), // R100,000 device value
    premiumFromCents: BigInt(5000),   // R50/month
    premiumToCents: BigInt(50000),    // R500/month
    benefits: ['Accidental damage', 'Theft cover', 'Water damage', 'Screen repair'],
    exclusions: ['Intentional damage', 'Cosmetic damage only'],
    waitingPeriod: 0,
    maxAge: 0,
    fspNumber: '44632'
  },
  {
    id: 'hollard_device_1',
    providerId: 'hollard',
    type: 'device',
    name: 'Hollard Gadget Cover',
    description: 'Complete protection for all your devices',
    minCoverCents: BigInt(100000),
    maxCoverCents: BigInt(150000000),
    premiumFromCents: BigInt(8000),
    premiumToCents: BigInt(100000),
    benefits: ['Worldwide cover', 'Accidental damage', 'Theft and loss', 'Quick replacement'],
    exclusions: ['Unattended theft', 'Intentional damage'],
    waitingPeriod: 14,
    maxAge: 0,
    fspNumber: '17673'
  }
]

// GET - List insurance products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all'
    const providerId = searchParams.get('provider')
    const userId = searchParams.get('userId')

    // Filter products
    let products = INSURANCE_PRODUCTS.filter(p => {
      if (type !== 'all' && p.type !== type) return false
      if (providerId && p.providerId !== providerId) return false
      return true
    })

    // Get existing policies for user
    let existingPolicies: unknown[] = []
    if (userId) {
      // Would query from DB in production
      existingPolicies = []
    }

    // Format response
    const formattedProducts = products.map(p => ({
      id: p.id,
      providerId: p.providerId,
      providerName: INSURANCE_PROVIDERS.find(ip => ip.name.toLowerCase() === p.providerId)?.name || p.providerId,
      type: p.type,
      typeName: INSURANCE_TYPES.find(it => it.id === p.type)?.name || p.type,
      name: p.name,
      description: p.description,
      minCover: p.minCoverCents ? Number(p.minCoverCents) / 100 : null,
      maxCover: p.maxCoverCents ? Number(p.maxCoverCents) / 100 : null,
      premiumFrom: Number(p.premiumFromCents) / 100,
      premiumTo: Number(p.premiumToCents) / 100,
      benefits: p.benefits,
      exclusions: p.exclusions,
      waitingPeriod: p.waitingPeriod,
      maxAge: p.maxAge,
      fspNumber: p.fspNumber
    }))

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        products: formattedProducts,
        types: INSURANCE_TYPES,
        providers: INSURANCE_PROVIDERS,
        existingPolicies
      }
    })
  } catch (error) {
    console.error('Error fetching insurance:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch insurance products'
    }, { status: 500 })
  }
}

// POST - Get quote or apply for insurance
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId, productId, coverAmount, personalDetails, beneficiaries } = body

    if (!action || !userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Action and user ID are required'
      }, { status: 400 })
    }

    // Find product
    const product = INSURANCE_PRODUCTS.find(p => p.id === productId)
    if (!product && action !== 'list') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Product not found'
      }, { status: 404 })
    }

    if (action === 'quote') {
      // Calculate premium quote
      const coverCents = BigInt(coverAmount * 100)
      
      // Simple premium calculation (in production would use actuarial tables)
      const basePremiumRate = product.type === 'funeral' ? 0.015 : 
                              product.type === 'life' ? 0.008 :
                              product.type === 'vehicle' ? 0.05 : 0.03
      
      const ageFactor = personalDetails?.age ? 
        (personalDetails.age > 50 ? 1.5 : personalDetails.age > 40 ? 1.2 : 1.0) : 1.0
      
      const monthlyPremium = Math.round(Number(coverCents) * basePremiumRate * ageFactor / 12)
      
      const quote = {
        id: `quote_${nanoid(12)}`,
        productId: product.id,
        productName: product.name,
        providerName: INSURANCE_PROVIDERS.find(ip => ip.name.toLowerCase() === product.providerId)?.name,
        coverAmount,
        monthlyPremium,
        yearlyPremium: monthlyPremium * 12,
        coverAmountCents: coverCents.toString(),
        premiumCents: (monthlyPremium * 100).toString(),
        benefits: product.benefits,
        exclusions: product.exclusions,
        waitingPeriod: product.waitingPeriod,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        createdAt: new Date().toISOString()
      }

      return NextResponse.json<ApiResponse>({
        success: true,
        data: quote,
        transaction: {
          id: quote.id,
          reference: `QUOTE-${quote.id}`,
          status: 'quoted'
        }
      })
    }

    if (action === 'apply') {
      // Create insurance application
      const applicationNumber = generateReference('INS')
      const applicationId = `insapp_${nanoid(12)}`
      
      const coverCents = BigInt(coverAmount * 100)
      const basePremiumRate = product.type === 'funeral' ? 0.015 : 
                              product.type === 'life' ? 0.008 : 0.03
      const ageFactor = personalDetails?.age ? 
        (personalDetails.age > 50 ? 1.5 : personalDetails.age > 40 ? 1.2 : 1.0) : 1.0
      const monthlyPremium = Math.round(Number(coverCents) * basePremiumRate * ageFactor / 12)

      const application = {
        id: applicationId,
        applicationNumber,
        userId,
        productId: product.id,
        productName: product.name,
        providerId: product.providerId,
        providerName: INSURANCE_PROVIDERS.find(ip => ip.name.toLowerCase() === product.providerId)?.name,
        type: product.type,
        typeName: INSURANCE_TYPES.find(it => it.id === product.type)?.name,
        coverAmountCents: coverCents.toString(),
        monthlyPremiumCents: (monthlyPremium * 100).toString(),
        status: 'pending_underwriting',
        personalDetails,
        beneficiaries: beneficiaries || [],
        fspNumber: product.fspNumber,
        createdAt: new Date().toISOString()
      }

      // In production, would save to database
      // await db.insuranceApplication.create({ data: application })

      return NextResponse.json<ApiResponse>({
        success: true,
        data: application,
        transaction: {
          id: application.id,
          reference: applicationNumber,
          status: 'pending_underwriting'
        }
      })
    }

    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Invalid action'
    }, { status: 400 })
  } catch (error) {
    console.error('Error in insurance POST:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to process insurance request'
    }, { status: 500 })
  }
}

// PUT - Update application or make payment
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, applicationId, policyId, paymentMethod } = body

    if (action === 'pay_premium') {
      // Process premium payment
      const paymentRef = generateReference('INSPAY')
      
      const payment = {
        id: `inspay_${nanoid(12)}`,
        paymentRef,
        policyId,
        amountCents: 0,
        status: 'completed',
        paidAt: new Date().toISOString(),
        paymentMethod
      }

      return NextResponse.json<ApiResponse>({
        success: true,
        data: payment,
        transaction: {
          id: payment.id,
          reference: paymentRef,
          status: 'completed'
        }
      })
    }

    if (action === 'cancel') {
      const cancellationRef = generateReference('INSCANC')
      
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          applicationId,
          status: 'cancelled',
          cancelledAt: new Date().toISOString(),
          cancellationRef
        },
        transaction: {
          id: applicationId,
          reference: cancellationRef,
          status: 'cancelled'
        }
      })
    }

    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Invalid action'
    }, { status: 400 })
  } catch (error) {
    console.error('Error in insurance PUT:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to process request'
    }, { status: 500 })
  }
}
