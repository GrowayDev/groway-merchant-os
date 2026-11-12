import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateReference, generateIdempotencyKey, SA_NETWORKS, type ApiResponse } from '@/lib/wallet-utils'
import { nanoid } from 'nanoid'

// SA Mobile Network Providers Extended
const SA_PROVIDERS = [
  {
    id: 'vodacom',
    name: 'Vodacom',
    logo: '/networks/vodacom.png',
    color: '#E60000',
    prefixes: ['082', '072', '060', '065'],
    coverage: '99%',
    isMobile: true,
    isActive: true,
    features: ['VodaPay', 'eSchools', 'Just4You', 'Nokia Offers']
  },
  {
    id: 'mtn',
    name: 'MTN',
    logo: '/networks/mtn.png',
    color: '#FFCC00',
    prefixes: ['083', '073', '063', '066'],
    coverage: '99%',
    isMobile: true,
    isActive: true,
    features: ['mPulse', 'Ayoba', 'MTN Rewards', 'Pulse Points']
  },
  {
    id: 'cellc',
    name: 'Cell C',
    logo: '/networks/cellc.png',
    color: '#000000',
    prefixes: ['084', '074', '061'],
    coverage: '95%',
    isMobile: true,
    isActive: true,
    features: ['Straight Up', 'ChatMore', 'Cmovies']
  },
  {
    id: 'telkom',
    name: 'Telkom',
    logo: '/networks/telkom.png',
    color: '#0066B3',
    prefixes: ['081', '071', '068'],
    coverage: '90%',
    isMobile: true,
    isActive: true,
    features: ['FreeMe', 'TelkomONE', 'Fibre', 'LTE']
  },
  {
    id: 'rain',
    name: 'Rain',
    logo: '/networks/rain.png',
    color: '#00A0E3',
    prefixes: ['063', '066'],
    coverage: '70%',
    isMobile: true,
    isActive: true,
    features: ['Data-only', '5G', 'Rain SIM', 'Unlimited Off-Peak']
  }
]

// Airtime Products
const AIRTIME_PRODUCTS = [
  // Vodacom Airtime
  { id: 'vodacom_5', providerId: 'vodacom', type: 'airtime', amount: 500, bonus: 0, description: 'R5 Airtime' },
  { id: 'vodacom_10', providerId: 'vodacom', type: 'airtime', amount: 1000, bonus: 0, description: 'R10 Airtime' },
  { id: 'vodacom_15', providerId: 'vodacom', type: 'airtime', amount: 1500, bonus: 0, description: 'R15 Airtime' },
  { id: 'vodacom_20', providerId: 'vodacom', type: 'airtime', amount: 2000, bonus: 500, description: 'R20 Airtime + R5 Bonus' },
  { id: 'vodacom_30', providerId: 'vodacom', type: 'airtime', amount: 3000, bonus: 1000, description: 'R30 Airtime + R10 Bonus' },
  { id: 'vodacom_50', providerId: 'vodacom', type: 'airtime', amount: 5000, bonus: 2500, description: 'R50 Airtime + R25 Bonus' },
  { id: 'vodacom_100', providerId: 'vodacom', type: 'airtime', amount: 10000, bonus: 10000, description: 'R100 Airtime + R100 Bonus' },
  
  // MTN Airtime
  { id: 'mtn_5', providerId: 'mtn', type: 'airtime', amount: 500, bonus: 0, description: 'R5 Airtime' },
  { id: 'mtn_10', providerId: 'mtn', type: 'airtime', amount: 1000, bonus: 0, description: 'R10 Airtime' },
  { id: 'mtn_20', providerId: 'mtn', type: 'airtime', amount: 2000, bonus: 500, description: 'R20 Airtime + R5 Bonus' },
  { id: 'mtn_30', providerId: 'mtn', type: 'airtime', amount: 3000, bonus: 1500, description: 'R30 Airtime + R15 Bonus' },
  { id: 'mtn_50', providerId: 'mtn', type: 'airtime', amount: 5000, bonus: 5000, description: 'R50 Airtime + R50 Bonus' },
  { id: 'mtn_100', providerId: 'mtn', type: 'airtime', amount: 10000, bonus: 15000, description: 'R100 Airtime + R150 Bonus' },
  
  // Cell C Airtime
  { id: 'cellc_5', providerId: 'cellc', type: 'airtime', amount: 500, bonus: 0, description: 'R5 Airtime' },
  { id: 'cellc_10', providerId: 'cellc', type: 'airtime', amount: 1000, bonus: 0, description: 'R10 Airtime' },
  { id: 'cellc_20', providerId: 'cellc', type: 'airtime', amount: 2000, bonus: 0, description: 'R20 Airtime' },
  { id: 'cellc_50', providerId: 'cellc', type: 'airtime', amount: 5000, bonus: 2500, description: 'R50 Airtime + R25 Bonus' },
  { id: 'cellc_100', providerId: 'cellc', type: 'airtime', amount: 10000, bonus: 5000, description: 'R100 Airtime + R50 Bonus' },
  
  // Telkom Airtime
  { id: 'telkom_5', providerId: 'telkom', type: 'airtime', amount: 500, bonus: 0, description: 'R5 Airtime' },
  { id: 'telkom_10', providerId: 'telkom', type: 'airtime', amount: 1000, bonus: 0, description: 'R10 Airtime' },
  { id: 'telkom_25', providerId: 'telkom', type: 'airtime', amount: 2500, bonus: 0, description: 'R25 Airtime' },
  { id: 'telkom_50', providerId: 'telkom', type: 'airtime', amount: 5000, bonus: 5000, description: 'R50 Airtime + R50 Bonus' },
  { id: 'telkom_100', providerId: 'telkom', type: 'airtime', amount: 10000, bonus: 15000, description: 'R100 Airtime + R150 Bonus' }
]

// Data Bundles
const DATA_BUNDLES = [
  // Vodacom Data Bundles
  { id: 'vodacom_data_100mb', providerId: 'vodacom', type: 'data', name: '100MB', dataMB: 100, priceCents: 1500, validity: '1 day', description: '100MB for 1 day' },
  { id: 'vodacom_data_250mb', providerId: 'vodacom', type: 'data', name: '250MB', dataMB: 250, priceCents: 2500, validity: '7 days', description: '250MB for 7 days' },
  { id: 'vodacom_data_500mb', providerId: 'vodacom', type: 'data', name: '500MB', dataMB: 500, priceCents: 4900, validity: '30 days', description: '500MB for 30 days' },
  { id: 'vodacom_data_1gb', providerId: 'vodacom', type: 'data', name: '1GB', dataMB: 1024, priceCents: 8500, validity: '30 days', description: '1GB for 30 days' },
  { id: 'vodacom_data_2gb', providerId: 'vodacom', type: 'data', name: '2GB', dataMB: 2048, priceCents: 14900, validity: '30 days', description: '2GB for 30 days' },
  { id: 'vodacom_data_5gb', providerId: 'vodacom', type: 'data', name: '5GB', dataMB: 5120, priceCents: 29900, validity: '30 days', description: '5GB for 30 days' },
  { id: 'vodacom_data_10gb', providerId: 'vodacom', type: 'data', name: '10GB', dataMB: 10240, priceCents: 49900, validity: '30 days', description: '10GB for 30 days' },
  { id: 'vodacom_data_20gb', providerId: 'vodacom', type: 'data', name: '20GB', dataMB: 20480, priceCents: 79900, validity: '30 days', description: '20GB for 30 days' },
  
  // MTN Data Bundles
  { id: 'mtn_data_100mb', providerId: 'mtn', type: 'data', name: '100MB', dataMB: 100, priceCents: 1200, validity: '1 day', description: '100MB for 1 day' },
  { id: 'mtn_data_250mb', providerId: 'mtn', type: 'data', name: '250MB', dataMB: 250, priceCents: 2000, validity: '7 days', description: '250MB for 7 days' },
  { id: 'mtn_data_500mb', providerId: 'mtn', type: 'data', name: '500MB', dataMB: 500, priceCents: 4500, validity: '30 days', description: '500MB for 30 days' },
  { id: 'mtn_data_1gb', providerId: 'mtn', type: 'data', name: '1GB', dataMB: 1024, priceCents: 7900, validity: '30 days', description: '1GB for 30 days' },
  { id: 'mtn_data_2gb', providerId: 'mtn', type: 'data', name: '2GB', dataMB: 2048, priceCents: 13900, validity: '30 days', description: '2GB for 30 days' },
  { id: 'mtn_data_5gb', providerId: 'mtn', type: 'data', name: '5GB', dataMB: 5120, priceCents: 27900, validity: '30 days', description: '5GB for 30 days' },
  { id: 'mtn_data_10gb', providerId: 'mtn', type: 'data', name: '10GB', dataMB: 10240, priceCents: 46900, validity: '30 days', description: '10GB for 30 days' },
  { id: 'mtn_data_25gb', providerId: 'mtn', type: 'data', name: '25GB', dataMB: 25600, priceCents: 89900, validity: '30 days', description: '25GB for 30 days' },
  
  // Cell C Data Bundles
  { id: 'cellc_data_100mb', providerId: 'cellc', type: 'data', name: '100MB', dataMB: 100, priceCents: 1000, validity: '1 day', description: '100MB for 1 day' },
  { id: 'cellc_data_500mb', providerId: 'cellc', type: 'data', name: '500MB', dataMB: 500, priceCents: 3900, validity: '30 days', description: '500MB for 30 days' },
  { id: 'cellc_data_1gb', providerId: 'cellc', type: 'data', name: '1GB', dataMB: 1024, priceCents: 6900, validity: '30 days', description: '1GB for 30 days' },
  { id: 'cellc_data_2gb', providerId: 'cellc', type: 'data', name: '2GB', dataMB: 2048, priceCents: 12900, validity: '30 days', description: '2GB for 30 days' },
  { id: 'cellc_data_5gb', providerId: 'cellc', type: 'data', name: '5GB', dataMB: 5120, priceCents: 24900, validity: '30 days', description: '5GB for 30 days' },
  
  // Telkom Data Bundles
  { id: 'telkom_data_100mb', providerId: 'telkom', type: 'data', name: '100MB', dataMB: 100, priceCents: 900, validity: '1 day', description: '100MB for 1 day' },
  { id: 'telkom_data_500mb', providerId: 'telkom', type: 'data', name: '500MB', dataMB: 500, priceCents: 3500, validity: '30 days', description: '500MB for 30 days' },
  { id: 'telkom_data_1gb', providerId: 'telkom', type: 'data', name: '1GB', dataMB: 1024, priceCents: 5900, validity: '30 days', description: '1GB for 30 days' },
  { id: 'telkom_data_2gb', providerId: 'telkom', type: 'data', name: '2GB', dataMB: 2048, priceCents: 9900, validity: '30 days', description: '2GB for 30 days' },
  { id: 'telkom_data_5gb', providerId: 'telkom', type: 'data', name: '5GB', dataMB: 5120, priceCents: 19900, validity: '30 days', description: '5GB for 30 days' },
  { id: 'telkom_data_10gb', providerId: 'telkom', type: 'data', name: '10GB', dataMB: 10240, priceCents: 34900, validity: '30 days', description: '10GB for 30 days' },
  
  // Rain Data Bundles (Data-only network)
  { id: 'rain_data_1gb', providerId: 'rain', type: 'data', name: '1GB', dataMB: 1024, priceCents: 5000, validity: '30 days', description: '1GB for 30 days' },
  { id: 'rain_data_5gb', providerId: 'rain', type: 'data', name: '5GB', dataMB: 5120, priceCents: 15900, validity: '30 days', description: '5GB for 30 days' },
  { id: 'rain_data_10gb', providerId: 'rain', type: 'data', name: '10GB', dataMB: 10240, priceCents: 25900, validity: '30 days', description: '10GB for 30 days' },
  { id: 'rain_data_unlimited', providerId: 'rain', type: 'data', name: 'Unlimited Off-Peak', dataMB: 999999, priceCents: 25000, validity: '30 days', description: 'Unlimited 11pm-6pm' }
]

// SMS Bundles
const SMS_BUNDLES = [
  { id: 'vodacom_sms_10', providerId: 'vodacom', type: 'sms', name: '10 SMS', smsCount: 10, priceCents: 500, validity: '7 days' },
  { id: 'vodacom_sms_50', providerId: 'vodacom', type: 'sms', name: '50 SMS', smsCount: 50, priceCents: 1500, validity: '30 days' },
  { id: 'vodacom_sms_100', providerId: 'vodacom', type: 'sms', name: '100 SMS', smsCount: 100, priceCents: 2500, validity: '30 days' },
  { id: 'mtn_sms_10', providerId: 'mtn', type: 'sms', name: '10 SMS', smsCount: 10, priceCents: 500, validity: '7 days' },
  { id: 'mtn_sms_50', providerId: 'mtn', type: 'sms', name: '50 SMS', smsCount: 50, priceCents: 1200, validity: '30 days' },
  { id: 'mtn_sms_100', providerId: 'mtn', type: 'sms', name: '100 SMS', smsCount: 100, priceCents: 2000, validity: '30 days' }
]

// Detect network from phone number
function detectNetwork(phone: string): string | null {
  const cleaned = phone.replace(/\D/g, '')
  const prefix = cleaned.startsWith('27') ? '0' + cleaned.slice(2, 4) : cleaned.slice(0, 3)
  
  for (const provider of SA_PROVIDERS) {
    if (provider.prefixes.includes(prefix)) {
      return provider.id
    }
  }
  return null
}

// GET - List providers or products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const providerId = searchParams.get('provider')
    const phone = searchParams.get('phone')
    const type = searchParams.get('type') || 'all'

    if (action === 'providers') {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          providers: SA_PROVIDERS.filter(p => p.isActive),
          popularAmounts: [500, 1000, 2000, 5000, 10000] // in cents
        }
      })
    }

    if (action === 'products') {
      let products = [...AIRTIME_PRODUCTS, ...DATA_BUNDLES, ...SMS_BUNDLES]
      
      // Filter by provider
      if (providerId) {
        products = products.filter(p => p.providerId === providerId)
      }
      
      // Filter by type
      if (type !== 'all') {
        products = products.filter(p => p.type === type)
      }

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          products,
          categories: [
            { id: 'airtime', name: 'Airtime', icon: 'Phone' },
            { id: 'data', name: 'Data Bundles', icon: 'Wifi' },
            { id: 'sms', name: 'SMS Bundles', icon: 'MessageSquare' }
          ]
        }
      })
    }

    if (action === 'detect' && phone) {
      const detectedNetwork = detectNetwork(phone)
      const provider = SA_PROVIDERS.find(p => p.id === detectedNetwork)
      
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          phone,
          networkId: detectedNetwork,
          network: provider || null,
          isValid: detectedNetwork !== null
        }
      })
    }

    if (action === 'bundles' && providerId) {
      const bundles = DATA_BUNDLES.filter(b => b.providerId === providerId)
      
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          providerId,
          bundles,
          recommended: bundles.slice(2, 5) // Middle options
        }
      })
    }

    // Default response
    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        providers: SA_PROVIDERS.filter(p => p.isActive),
        airtimeProducts: AIRTIME_PRODUCTS,
        dataBundles: DATA_BUNDLES,
        smsBundles: SMS_BUNDLES
      }
    })
  } catch (error) {
    console.error('Error in airtime API:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to process airtime request'
    }, { status: 500 })
  }
}

// POST - Purchase airtime/data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId, phone, productId, amountCents, providerId, idempotencyKey } = body

    if (action === 'purchase') {
      if (!userId || !phone || !productId) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Missing required fields'
        }, { status: 400 })
      }

      // Check idempotency
      const idempKey = idempotencyKey || generateIdempotencyKey()
      
      // Find product - allow fallback for airtime amounts not in predefined list
      let product = [...AIRTIME_PRODUCTS, ...DATA_BUNDLES, ...SMS_BUNDLES].find(p => p.id === productId)
      
      // If product not found and it's an airtime purchase, create a dynamic product
      if (!product) {
        const provider = SA_PROVIDERS.find(p => p.id === providerId)
        if (provider && amountCents) {
          // Create a dynamic airtime product for any amount
          product = {
            id: productId,
            providerId: providerId,
            type: 'airtime',
            amount: amountCents,
            bonus: 0,
            description: `R${amountCents / 100} Airtime`
          }
        } else {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Product not found. Please select a valid amount.'
          }, { status: 404 })
        }
      }
      
      // Detect network
      const detectedNetwork = detectNetwork(phone)
      if (detectedNetwork !== product.providerId) {
        // Still allow but warn
        console.warn(`Phone ${phone} detected as ${detectedNetwork}, but product is for ${product.providerId}`)
      }

      // Check user wallet balance
      const wallet = await db.consumerWallet.findUnique({
        where: { userId }
      })

      const totalCents = product.priceCents || amountCents || 0
      if (wallet && wallet.balanceCents < BigInt(totalCents)) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Insufficient funds'
        }, { status: 400 })
      }

      // Generate transaction reference
      const txRef = generateReference('AIR')
      const txId = `airtime_${nanoid(12)}`

      // Generate voucher PIN (16-digit code for airtime/data vouchers)
      const voucherPin = Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join('')

      // Process purchase (would call actual provider API in production)
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 500))

      // Create purchase record
      const purchase = {
        id: txId,
        reference: txRef,
        userId,
        status: 'completed',
        phone,
        network: SA_PROVIDERS.find(p => p.id === product.providerId)?.name || product.providerId,
        product: {
          id: product.id,
          type: product.type,
          name: product.type === 'data' ? (product as typeof DATA_BUNDLES[0]).name :
                product.type === 'sms' ? (product as typeof SMS_BUNDLES[0]).name :
                `R${(product as typeof AIRTIME_PRODUCTS[0]).amount / 100} Airtime`,
          description: product.description
        },
        amount: {
          cents: totalCents,
          currency: 'ZAR'
        },
        voucherPin, // Include voucher PIN in response
        createdAt: new Date().toISOString(),
        receiptNumber: `RCP${Date.now().toString(36).toUpperCase()}`
      }

      // Update wallet if exists
      if (wallet) {
        await db.consumerWallet.update({
          where: { userId },
          data: {
            balanceCents: wallet.balanceCents - BigInt(totalCents)
          }
        })

        // Create transaction record with voucher PIN for traceability
        const now = new Date();
        const voucherExpiry = new Date();
        voucherExpiry.setDate(voucherExpiry.getDate() + 30); // 30 days validity

        await db.consumerTransaction.create({
          data: {
            id: txId,
            idempotencyKey: idempKey,
            userId,
            transactionType: 'airtime_purchase',
            direction: 'debit',
            amountCents: BigInt(totalCents),
            feeCents: BigInt(0),
            netAmountCents: BigInt(totalCents),
            currency: 'ZAR',
            status: 'completed',
            description: `${product.type === 'data' ? 'Data' : product.type === 'sms' ? 'SMS' : 'Airtime'} Voucher for ${phone}`,
            reference: txRef,
            category: 'Airtime & Data',
            counterpartyName: SA_PROVIDERS.find(p => p.id === product.providerId)?.name || product.providerId,
            voucherToken: voucherPin,
            voucherExpiry: voucherExpiry.toISOString(),
            completedAt: now,
            createdAt: now,
            updatedAt: now
          }
        })
      }

      return NextResponse.json<ApiResponse>({
        success: true,
        data: purchase,
        transaction: {
          id: txId,
          reference: txRef,
          status: 'completed'
        }
      })
    }

    if (action === 'quick_airtime') {
      // Quick airtime purchase without selecting product
      if (!userId || !phone || !amountCents) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Missing required fields'
        }, { status: 400 })
      }

      const detectedNetwork = detectNetwork(phone)
      const provider = SA_PROVIDERS.find(p => p.id === detectedNetwork)
      
      if (!detectedNetwork || !provider) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Could not detect network for this phone number'
        }, { status: 400 })
      }

      const txRef = generateReference('AIR')
      const txId = `airtime_${nanoid(12)}`
      const idempKey = generateIdempotencyKey()

      // Generate voucher PIN (16-digit code for airtime/data vouchers)
      const voucherPin = Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join('')

      // Check wallet balance
      const wallet = await db.consumerWallet.findUnique({
        where: { userId }
      })

      if (wallet && wallet.balanceCents < BigInt(amountCents)) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Insufficient funds'
        }, { status: 400 })
      }

      const now = new Date();
      const voucherExpiry = new Date();
      voucherExpiry.setDate(voucherExpiry.getDate() + 30); // 30 days validity

      // Update wallet if exists
      if (wallet) {
        await db.consumerWallet.update({
          where: { userId },
          data: {
            balanceCents: wallet.balanceCents - BigInt(amountCents)
          }
        })

        // Create transaction record with voucher PIN for traceability
        await db.consumerTransaction.create({
          data: {
            id: txId,
            idempotencyKey: idempKey,
            userId,
            transactionType: 'airtime_purchase',
            direction: 'debit',
            amountCents: BigInt(amountCents),
            feeCents: BigInt(0),
            netAmountCents: BigInt(amountCents),
            currency: 'ZAR',
            status: 'completed',
            description: `Airtime Voucher for ${phone}`,
            reference: txRef,
            category: 'Airtime & Data',
            counterpartyName: provider.name,
            voucherToken: voucherPin,
            voucherExpiry: voucherExpiry.toISOString(),
            completedAt: now,
            createdAt: now,
            updatedAt: now
          }
        })
      }

      const purchase = {
        id: txId,
        reference: txRef,
        userId,
        status: 'completed',
        phone,
        network: provider.name,
        product: {
          type: 'airtime',
          name: `R${amountCents / 100} Airtime`,
          description: `${provider.name} Airtime`
        },
        amount: {
          cents: amountCents,
          currency: 'ZAR'
        },
        voucherPin, // Include voucher PIN
        createdAt: now.toISOString(),
        receiptNumber: `RCP${Date.now().toString(36).toUpperCase()}`
      }

      return NextResponse.json<ApiResponse>({
        success: true,
        data: purchase,
        transaction: {
          id: txId,
          reference: txRef,
          status: 'completed'
        }
      })
    }

    if (action === 'validate_phone') {
      const detectedNetwork = detectNetwork(phone)
      const isValid = detectedNetwork !== null
      const provider = SA_PROVIDERS.find(p => p.id === detectedNetwork)

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          phone,
          isValid,
          networkId: detectedNetwork,
          network: provider,
          formattedPhone: formatPhoneNumber(phone)
        }
      })
    }

    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Invalid action'
    }, { status: 400 })
  } catch (error) {
    console.error('Error in airtime POST:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to process airtime purchase'
    }, { status: 500 })
  }
}

// Format phone number to standard SA format
function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('27')) {
    return `+${cleaned}`
  }
  if (cleaned.startsWith('0')) {
    return `+27${cleaned.slice(1)}`
  }
  return `+27${cleaned}`
}

// PUT - Get purchase history
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId, limit = 10 } = body

    if (action === 'history') {
      // Would query from database in production
      const history = []

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          purchases: history,
          total: 0
        }
      })
    }

    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Invalid action'
    }, { status: 400 })
  } catch (error) {
    console.error('Error in airtime PUT:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to process request'
    }, { status: 500 })
  }
}
