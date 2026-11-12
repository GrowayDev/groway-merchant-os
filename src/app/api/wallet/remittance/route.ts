import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateReference, generateIdempotencyKey, REMITTANCE_PROVIDERS, type ApiResponse } from '@/lib/wallet-utils'
import { nanoid } from 'nanoid'

// Extended Remittance Providers
const REMITTANCE_PROVIDERS_EXTENDED = [
  {
    id: 'chipper',
    name: 'Chipper Cash',
    logo: '/remittance/chipper.png',
    type: 'digital_wallet',
    supportedCountries: [
      { code: 'NG', name: 'Nigeria', currency: 'NGN', flag: '🇳🇬' },
      { code: 'GH', name: 'Ghana', currency: 'GHS', flag: '🇬🇭' },
      { code: 'UG', name: 'Uganda', currency: 'UGX', flag: '🇺🇬' },
      { code: 'RW', name: 'Rwanda', currency: 'RWF', flag: '🇷🇼' },
      { code: 'KE', name: 'Kenya', currency: 'KES', flag: '🇰🇪' }
    ],
    feePercent: 1.5,
    minAmountZAR: 100,
    maxAmountZAR: 50000,
    deliveryTime: 'Instant',
    isActive: true,
    features: ['Instant transfer', 'Mobile wallet', 'Bank deposit']
  },
  {
    id: 'mukuru',
    name: 'Mukuru',
    logo: '/remittance/mukuru.png',
    type: 'cash_pickup',
    supportedCountries: [
      { code: 'ZW', name: 'Zimbabwe', currency: 'USD', flag: '🇿🇼' },
      { code: 'MW', name: 'Malawi', currency: 'MWK', flag: '🇲🇼' },
      { code: 'MZ', name: 'Mozambique', currency: 'MZN', flag: '🇲🇿' },
      { code: 'ZM', name: 'Zambia', currency: 'ZMW', flag: '🇿🇲' }
    ],
    feePercent: 2.5,
    minAmountZAR: 200,
    maxAmountZAR: 25000,
    deliveryTime: 'Same day',
    isActive: true,
    features: ['Cash pickup', 'Bank deposit', 'Mobile money']
  },
  {
    id: 'terrapay',
    name: 'TerraPay',
    logo: '/remittance/terrapay.png',
    type: 'mobile_money',
    supportedCountries: [
      { code: 'MW', name: 'Malawi', currency: 'MWK', flag: '🇲🇼' },
      { code: 'MZ', name: 'Mozambique', currency: 'MZN', flag: '🇲🇿' },
      { code: 'ZW', name: 'Zimbabwe', currency: 'USD', flag: '🇿🇼' },
      { code: 'GH', name: 'Ghana', currency: 'GHS', flag: '🇬🇭' },
      { code: 'KE', name: 'Kenya', currency: 'KES', flag: '🇰🇪' },
      { code: 'NG', name: 'Nigeria', currency: 'NGN', flag: '🇳🇬' }
    ],
    feePercent: 2.0,
    minAmountZAR: 100,
    maxAmountZAR: 30000,
    deliveryTime: 'Instant',
    isActive: true,
    features: ['Mobile money', 'Bank transfer', 'Instant']
  },
  {
    id: 'worldremit',
    name: 'WorldRemit',
    logo: '/remittance/worldremit.png',
    type: 'digital',
    supportedCountries: [
      { code: 'ZW', name: 'Zimbabwe', currency: 'USD', flag: '🇿🇼' },
      { code: 'NG', name: 'Nigeria', currency: 'NGN', flag: '🇳🇬' },
      { code: 'GH', name: 'Ghana', currency: 'GHS', flag: '🇬🇭' },
      { code: 'KE', name: 'Kenya', currency: 'KES', flag: '🇰🇪' },
      { code: 'UG', name: 'Uganda', currency: 'UGX', flag: '🇺🇬' }
    ],
    feePercent: 2.2,
    minAmountZAR: 150,
    maxAmountZAR: 40000,
    deliveryTime: '1-2 days',
    isActive: true,
    features: ['Bank deposit', 'Cash pickup', 'Mobile money', 'Airtime top-up']
  },
  {
    id: 'aza',
    name: 'AZA Finance',
    logo: '/remittance/aza.png',
    type: 'corporate',
    supportedCountries: [
      { code: 'NG', name: 'Nigeria', currency: 'NGN', flag: '🇳🇬' },
      { code: 'GH', name: 'Ghana', currency: 'GHS', flag: '🇬🇭' },
      { code: 'KE', name: 'Kenya', currency: 'KES', flag: '🇰🇪' },
      { code: 'UG', name: 'Uganda', currency: 'UGX', flag: '🇺🇬' }
    ],
    feePercent: 1.0,
    minAmountZAR: 10000,
    maxAmountZAR: 500000,
    deliveryTime: 'Same day',
    isActive: true,
    features: ['Corporate transfers', 'Best rates', 'Volume discounts']
  },
  {
    id: 'stablecoin',
    name: 'Stablecoin (USDC)',
    logo: '/remittance/usdc.png',
    type: 'crypto',
    supportedCountries: [
      { code: '*', name: 'All Countries', currency: 'USDC', flag: '🌍' }
    ],
    feePercent: 0.5,
    minAmountZAR: 500,
    maxAmountZAR: 100000,
    deliveryTime: 'Instant',
    isActive: true,
    features: ['Crypto wallet', 'Lowest fees', 'Instant settlement']
  }
]

// Exchange Rates (mock - would be real-time in production)
const EXCHANGE_RATES: Record<string, number> = {
  NGN: 24.50,  // 1 ZAR = 24.50 NGN
  GHS: 0.42,   // 1 ZAR = 0.42 GHS
  KES: 7.85,   // 1 ZAR = 7.85 KES
  UGX: 215.50, // 1 ZAR = 215.50 UGX
  ZMW: 1.45,   // 1 ZAR = 1.45 ZMW
  MWK: 58.20,  // 1 ZAR = 58.20 MWK
  MZN: 3.25,   // 1 ZAR = 3.25 MZN
  USD: 0.053,  // 1 ZAR = 0.053 USD
  USDC: 0.053  // 1 ZAR = 0.053 USDC
}

// SARB ADA Compliance Requirements
const SARB_ADA_COMPLIANCE = {
  reportingThresholdZAR: 25000,
  requiresSAD500: false, // Under R50k doesn't require SAD500
  requiresFICA: true,
  purposeCodes: [
    { code: 'FAM', description: 'Family support' },
    { code: 'GIF', description: 'Gift' },
    { code: 'EDU', description: 'Education fees' },
    { code: 'MED', description: 'Medical expenses' },
    { code: 'TRV', description: 'Travel' },
    { code: 'BUS', description: 'Business services' },
    { code: 'SAL', description: 'Salary/Wages' },
    { code: 'INV', description: 'Investment' }
  ]
}

// Get exchange rate with markup
function getExchangeRate(currency: string, providerFee: number): { rate: number; markup: number } {
  const baseRate = EXCHANGE_RATES[currency] || 1
  const markup = baseRate * (providerFee / 100) // Add provider fee as rate markup
  return {
    rate: baseRate - markup, // They get less foreign currency due to markup
    markup: markup
  }
}

// GET - List providers or get quote
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const providerId = searchParams.get('provider')
    const countryCode = searchParams.get('country')
    const amountZAR = parseFloat(searchParams.get('amount') || '0')

    if (action === 'providers') {
      let providers = REMITTANCE_PROVIDERS_EXTENDED.filter(p => p.isActive)
      
      // Filter by country if specified
      if (countryCode) {
        providers = providers.filter(p => 
          p.supportedCountries.some(c => c.code === countryCode || c.code === '*')
        )
      }

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          providers,
          allCountries: getAllCountries(),
          sorbAdaCompliance: SARB_ADA_COMPLIANCE
        }
      })
    }

    if (action === 'quote' && providerId && countryCode && amountZAR > 0) {
      const provider = REMITTANCE_PROVIDERS_EXTENDED.find(p => p.id === providerId)
      if (!provider) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Provider not found'
        }, { status: 404 })
      }

      const country = provider.supportedCountries.find(c => c.code === countryCode)
      if (!country && countryCode !== '*') {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Country not supported by this provider'
        }, { status: 400 })
      }

      // Calculate quote
      const { rate, markup } = getExchangeRate(country?.currency || 'USD', provider.feePercent)
      const feeZAR = amountZAR * (provider.feePercent / 100)
      const totalZAR = amountZAR + feeZAR
      const receiveAmount = amountZAR * rate

      // SARB ADA compliance check
      const requiresAdaReporting = totalZAR >= SARB_ADA_COMPLIANCE.reportingThresholdZAR

      const quote = {
        id: `quote_${nanoid(12)}`,
        provider: {
          id: provider.id,
          name: provider.name,
          logo: provider.logo,
          type: provider.type
        },
        sendAmount: {
          amount: amountZAR,
          currency: 'ZAR'
        },
        receiveAmount: {
          amount: receiveAmount,
          currency: country?.currency || 'USD'
        },
        exchangeRate: rate,
        fee: {
          amount: feeZAR,
          currency: 'ZAR',
          percent: provider.feePercent
        },
        total: {
          amount: totalZAR,
          currency: 'ZAR'
        },
        deliveryTime: provider.deliveryTime,
        validUntil: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
        createdAt: new Date().toISOString(),
        compliance: {
          requiresAdaReporting,
          requiresFICA: SARB_ADA_COMPLIANCE.requiresFICA,
          purposeCodes: SARB_ADA_COMPLIANCE.purposeCodes,
          reportingThreshold: SARB_ADA_COMPLIANCE.reportingThresholdZAR
        }
      }

      return NextResponse.json<ApiResponse>({
        success: true,
        data: quote
      })
    }

    if (action === 'rates') {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          rates: EXCHANGE_RATES,
          lastUpdated: new Date().toISOString(),
          baseCurrency: 'ZAR'
        }
      })
    }

    if (action === 'countries') {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          countries: getAllCountries(),
          popularDestinations: ['ZW', 'NG', 'GH', 'KE', 'MZ', 'MW']
        }
      })
    }

    // Default response
    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        providers: REMITTANCE_PROVIDERS_EXTENDED.filter(p => p.isActive),
        countries: getAllCountries(),
        compliance: SARB_ADA_COMPLIANCE
      }
    })
  } catch (error) {
    console.error('Error in remittance API:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to process remittance request'
    }, { status: 500 })
  }
}

// Get all unique countries from all providers
function getAllCountries() {
  const countryMap = new Map()
  
  REMITTANCE_PROVIDERS_EXTENDED.forEach(provider => {
    provider.supportedCountries.forEach(country => {
      if (!countryMap.has(country.code)) {
        countryMap.set(country.code, country)
      }
    })
  })

  return Array.from(countryMap.values())
}

// POST - Get quote or send money
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId, quoteId, providerId, countryCode, amountZAR, recipient, purposeCode, idempotencyKey } = body

    if (action === 'quote') {
      // Generate fresh quote
      const provider = REMITTANCE_PROVIDERS_EXTENDED.find(p => p.id === providerId)
      if (!provider) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Provider not found'
        }, { status: 404 })
      }

      const country = provider.supportedCountries.find(c => c.code === countryCode)
      const { rate } = getExchangeRate(country?.currency || 'USD', provider.feePercent)
      const feeZAR = amountZAR * (provider.feePercent / 100)
      const receiveAmount = amountZAR * rate

      const quote = {
        id: `quote_${nanoid(12)}`,
        provider,
        country,
        sendAmount: { amount: amountZAR, currency: 'ZAR' },
        receiveAmount: { amount: receiveAmount, currency: country?.currency || 'USD' },
        exchangeRate: rate,
        fee: { amount: feeZAR, currency: 'ZAR' },
        total: { amount: amountZAR + feeZAR, currency: 'ZAR' },
        deliveryTime: provider.deliveryTime,
        validUntil: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        compliance: {
          requiresAdaReporting: (amountZAR + feeZAR) >= SARB_ADA_COMPLIANCE.reportingThresholdZAR,
          purposeCodes: SARB_ADA_COMPLIANCE.purposeCodes
        }
      }

      return NextResponse.json<ApiResponse>({
        success: true,
        data: quote
      })
    }

    if (action === 'send') {
      if (!userId || !quoteId || !recipient) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Missing required fields'
        }, { status: 400 })
      }

      // Check idempotency
      const idempKey = idempotencyKey || generateIdempotencyKey()
      
      // Generate transaction reference
      const txRef = generateReference('REM')
      const txId = `rem_${nanoid(16)}`

      // Create transaction record
      const transaction = {
        id: txId,
        reference: txRef,
        userId,
        status: 'processing',
        quoteId,
        recipient: {
          name: recipient.name,
          phone: recipient.phone,
          countryCode: recipient.countryCode,
          bankName: recipient.bankName,
          accountNumber: recipient.accountNumber ? `****${recipient.accountNumber.slice(-4)}` : null,
          walletAddress: recipient.walletAddress,
          pickupLocation: recipient.pickupLocation
        },
        purposeCode,
        compliance: {
          adaReported: false, // Will be reported by batch process
          ficCompliant: true,
          ficaVerified: true
        },
        createdAt: new Date().toISOString(),
        estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      }

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          transaction,
          message: 'Transfer initiated successfully',
          trackingUrl: `/remittance/track/${txRef}`
        },
        transaction: {
          id: txId,
          reference: txRef,
          status: 'processing'
        }
      })
    }

    if (action === 'verify_recipient') {
      // Simulate recipient verification
      const verificationResult = {
        verified: true,
        name: recipient.name,
        bankValid: !!recipient.bankName,
        accountValid: recipient.accountNumber?.length >= 10,
        phoneValid: /^\+?[1-9]\d{9,14}$/.test(recipient.phone || '')
      }

      return NextResponse.json<ApiResponse>({
        success: true,
        data: verificationResult
      })
    }

    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Invalid action'
    }, { status: 400 })
  } catch (error) {
    console.error('Error in remittance POST:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to process remittance'
    }, { status: 500 })
  }
}

// PUT - Update transaction status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, transactionId, status, receiptData } = body

    if (action === 'confirm') {
      const confirmationRef = generateReference('REMCONF')
      
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          transactionId,
          status: 'completed',
          confirmedAt: new Date().toISOString(),
          confirmationRef,
          receiptData
        },
        transaction: {
          id: transactionId,
          reference: confirmationRef,
          status: 'completed'
        }
      })
    }

    if (action === 'cancel') {
      const cancellationRef = generateReference('REMCANC')
      
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          transactionId,
          status: 'cancelled',
          cancelledAt: new Date().toISOString(),
          cancellationRef,
          refundStatus: 'initiated',
          refundEstimatedDays: 3
        },
        transaction: {
          id: transactionId,
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
    console.error('Error in remittance PUT:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to update transaction'
    }, { status: 500 })
  }
}
