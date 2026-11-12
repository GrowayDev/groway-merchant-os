import { NextRequest, NextResponse } from 'next/server'

// Mock insurance products for demo
const mockInsuranceProducts = [
  {
    id: 'funeral-basic',
    name: 'Family Funeral Cover',
    category: 'funeral',
    provider: 'Hollard',
    description: 'Affordable funeral cover for you and your family. Quick payout within 48 hours.',
    minCover: 500000,    // R5,000
    maxCover: 5000000,   // R50,000
    minPremium: 2500,    // R25/month
    maxPremium: 25000,   // R250/month
    waitingPeriod: 6,    // 6 months
    features: [
      'Covers main member, spouse, and up to 6 children',
      'Quick 48-hour claim payout',
      'Cash payout for funeral expenses',
      'Transportation benefit included',
      'No medical examination required'
    ],
    exclusions: [
      'Death within first 6 months (natural causes)',
      'Suicide within first 12 months',
      'Pre-existing conditions'
    ],
    premiumRates: {
      500000: 2500,   // R5,000 cover = R25/month
      1000000: 4900,  // R10,000 cover = R49/month
      1500000: 7400,  // R15,000 cover = R74/month
      2000000: 9800,  // R20,000 cover = R98/month
      3000000: 14700, // R30,000 cover = R147/month
      5000000: 24500, // R50,000 cover = R245/month
    }
  },
  {
    id: 'funeral-premium',
    name: 'Premium Funeral Plan',
    category: 'funeral',
    provider: 'Old Mutual',
    description: 'Comprehensive funeral cover with extended family benefits and higher cover amounts.',
    minCover: 1000000,   // R10,000
    maxCover: 10000000,  // R100,000
    minPremium: 4900,    // R49/month
    maxPremium: 49000,   // R490/month
    waitingPeriod: 3,    // 3 months
    features: [
      'Covers main member, spouse, children, and parents',
      '24-hour claim payout',
      'Grocery benefit for 6 months after claim',
      'Tombstone benefit',
      'Policy loan available after 12 months',
      'Premium waiver on retrenchment'
    ],
    exclusions: [
      'Death within first 3 months (natural causes)',
      'Suicide within first 24 months'
    ],
    premiumRates: {
      1000000: 4900,
      2000000: 9800,
      3000000: 14700,
      5000000: 24500,
      7500000: 36750,
      10000000: 49000,
    }
  },
  {
    id: 'device-phone',
    name: 'Smartphone Protection',
    category: 'device',
    provider: 'King Price',
    description: 'Protect your smartphone against accidental damage, theft, and screen breakage.',
    minCover: 3000000,   // R30,000
    maxCover: 50000000,  // R500,000
    minPremium: 5900,    // R59/month
    maxPremium: 99000,   // R990/month
    waitingPeriod: 0,
    features: [
      'Screen breakage cover',
      'Water damage cover',
      'Theft and robbery cover',
      'Accidental damage cover',
      'Worldwide coverage',
      'Quick replacement within 5 days'
    ],
    exclusions: [
      'Wear and tear',
      'Cosmetic damage not affecting functionality',
      'Pre-existing damage'
    ],
    premiumFormula: 'coverAmount * 0.02', // 2% of device value per month
  },
  {
    id: 'device-laptop',
    name: 'Laptop & Tablet Cover',
    category: 'device',
    provider: 'King Price',
    description: 'Complete protection for your laptop, tablet, or other electronic devices.',
    minCover: 5000000,   // R50,000
    maxCover: 100000000, // R1,000,000
    minPremium: 9900,    // R99/month
    maxPremium: 199000,  // R1,990/month
    waitingPeriod: 0,
    features: [
      'Accidental damage cover',
      'Liquid damage cover',
      'Theft cover',
      'Power surge protection',
      'International coverage up to 90 days',
      'Extended warranty option'
    ],
    exclusions: [
      'Wear and tear',
      'Software issues',
      'Viruses and malware'
    ],
    premiumFormula: 'coverAmount * 0.015', // 1.5% of device value per month
  },
  {
    id: 'grocover-purchase',
    name: 'GroCover Purchase Protection',
    category: 'grocover',
    provider: 'Groway Insurance',
    description: 'Protect your purchases from GroTake merchants against damage, theft, and defects.',
    minCover: 10000,     // R100
    maxCover: 1000000,   // R10,000
    minPremium: 500,     // R5/month
    maxPremium: 5000,    // R50/month
    waitingPeriod: 0,
    features: [
      'Covers purchases up to R10,000',
      '90-day protection from purchase date',
      'Accidental damage cover',
      'Theft cover within 30 days',
      'Extended warranty up to 2 years',
      'No excess on claims'
    ],
    exclusions: [
      'Willful damage',
      'Normal wear and tear',
      'Items not purchased from GroTake merchants'
    ],
    premiumFormula: 'coverAmount * 0.005', // 0.5% of purchase value
  },
  {
    id: 'grocover-subscription',
    name: 'GroCover Monthly',
    category: 'grocover',
    provider: 'Groway Insurance',
    description: 'Monthly subscription covering all your GroTake purchases automatically.',
    minCover: 0,
    maxCover: 0,         // Unlimited
    minPremium: 4900,    // R49/month subscription
    maxPremium: 4900,    // R49/month subscription
    waitingPeriod: 0,
    features: [
      'All purchases automatically covered',
      'Up to R5,000 per item',
      'Up to R25,000 total per month',
      'Accidental damage cover',
      'Theft within 30 days',
      'Extended warranty 12 months',
      'Cancel anytime'
    ],
    exclusions: [
      'Items over R5,000 (requires individual cover)',
      'Willful damage'
    ],
    isSubscription: true,
  }
]

// Mock stored quotes and policies
const mockQuotes: Map<string, any[]> = new Map()
const mockPolicies: Map<string, any[]> = new Map()

// Calculate premium based on product and cover amount
function calculatePremium(product: any, coverAmount: number): number {
  if (product.premiumRates) {
    // Find the closest rate
    const rates = Object.keys(product.premiumRates).map(Number).sort((a, b) => a - b)
    for (const rate of rates) {
      if (coverAmount <= rate) {
        return product.premiumRates[rate]
      }
    }
    return product.premiumRates[rates[rates.length - 1]]
  }
  
  if (product.premiumFormula) {
    // Simple formula evaluation
    if (product.premiumFormula.includes('0.02')) {
      return Math.round(coverAmount * 0.02)
    } else if (product.premiumFormula.includes('0.015')) {
      return Math.round(coverAmount * 0.015)
    } else if (product.premiumFormula.includes('0.005')) {
      return Math.round(coverAmount * 0.005)
    }
  }
  
  return product.minPremium
}

// GET /api/consumer/insurance/products - Get insurance products
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const category = searchParams.get('category')
  const userId = searchParams.get('userId') || 'demo-user'

  // Get all products or by category
  if (action === 'products' || !action) {
    let products = mockInsuranceProducts
    
    if (category) {
      products = products.filter(p => p.category === category)
    }
    
    return NextResponse.json({
      success: true,
      data: products.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        provider: p.provider,
        description: p.description,
        minCover: p.minCover,
        maxCover: p.maxCover,
        minPremium: p.minPremium,
        features: p.features,
        waitingPeriod: p.waitingPeriod,
      }))
    })
  }

  // Get single product details
  if (action === 'detail') {
    const productId = searchParams.get('productId')
    const product = mockInsuranceProducts.find(p => p.id === productId)
    
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

  // Get user's policies
  if (action === 'policies') {
    const policies = mockPolicies.get(userId) || []
    return NextResponse.json({
      success: true,
      data: policies
    })
  }

  // Get quote
  if (action === 'quote') {
    const quoteId = searchParams.get('quoteId')
    const quotes = mockQuotes.get(userId) || []
    const quote = quotes.find(q => q.id === quoteId)
    
    if (!quote) {
      return NextResponse.json({
        success: false,
        error: 'Quote not found'
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      data: quote
    })
  }

  // Get categories
  if (action === 'categories') {
    return NextResponse.json({
      success: true,
      data: [
        { id: 'funeral', name: 'Funeral Cover', icon: 'Heart', description: 'Protect your family during difficult times' },
        { id: 'device', name: 'Device Insurance', icon: 'Smartphone', description: 'Cover your phone, laptop, and devices' },
        { id: 'grocover', name: 'GroCover', icon: 'Shield', description: 'Purchase protection for GroTake buys' },
      ]
    })
  }

  return NextResponse.json({
    success: true,
    data: mockInsuranceProducts
  })
}

// POST /api/consumer/insurance/products - Generate quote or purchase
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId = 'demo-user', productId, coverAmount, personalDetails } = body

    // Generate quote
    if (action === 'quote') {
      const product = mockInsuranceProducts.find(p => p.id === productId)
      
      if (!product) {
        return NextResponse.json({
          success: false,
          error: 'Product not found'
        }, { status: 404 })
      }

      // Validate cover amount
      if (coverAmount < product.minCover || coverAmount > product.maxCover) {
        return NextResponse.json({
          success: false,
          error: `Cover amount must be between R${product.minCover / 100} and R${product.maxCover / 100}`
        }, { status: 400 })
      }

      const premium = calculatePremium(product, coverAmount)
      
      const quote = {
        id: `quote-${Date.now()}`,
        userId,
        productId: product.id,
        productName: product.name,
        provider: product.provider,
        category: product.category,
        coverAmount,
        premiumAmount: premium,
        premiumFrequency: 'monthly',
        personalDetails,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        status: 'pending',
        createdAt: new Date().toISOString(),
      }

      // Store quote
      let quotes = mockQuotes.get(userId) || []
      quotes.unshift(quote)
      mockQuotes.set(userId, quotes)

      return NextResponse.json({
        success: true,
        data: quote,
        message: 'Quote generated successfully'
      })
    }

    // Purchase policy
    if (action === 'purchase') {
      const { quoteId } = body
      
      // Get stored quote
      const quotes = mockQuotes.get(userId) || []
      const quoteIndex = quotes.findIndex(q => q.id === quoteId)
      
      if (quoteIndex === -1) {
        return NextResponse.json({
          success: false,
          error: 'Quote not found or expired'
        }, { status: 404 })
      }

      const quote = quotes[quoteIndex]
      
      if (new Date(quote.validUntil) < new Date()) {
        return NextResponse.json({
          success: false,
          error: 'Quote has expired. Please generate a new quote.'
        }, { status: 400 })
      }

      // Create policy
      const policy = {
        id: `policy-${Date.now()}`,
        userId,
        quoteId: quote.id,
        productId: quote.productId,
        productName: quote.productName,
        provider: quote.provider,
        category: quote.category,
        coverAmount: quote.coverAmount,
        premium: quote.premiumAmount,
        premiumFrequency: quote.premiumFrequency,
        status: 'active',
        startDate: new Date().toISOString(),
        nextPayment: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        policyNumber: `GRW-${Date.now().toString(36).toUpperCase()}`,
        personalDetails: quote.personalDetails,
        createdAt: new Date().toISOString(),
      }

      // Store policy
      let policies = mockPolicies.get(userId) || []
      policies.unshift(policy)
      mockPolicies.set(userId, policies)

      // Mark quote as accepted
      quotes[quoteIndex].status = 'accepted'
      mockQuotes.set(userId, quotes)

      return NextResponse.json({
        success: true,
        data: policy,
        message: 'Insurance policy purchased successfully'
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 })
  } catch (error) {
    console.error('Insurance error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process request'
    }, { status: 500 })
  }
}
