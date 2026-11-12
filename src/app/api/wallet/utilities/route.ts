import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

interface ApiResponse {
  success: boolean
  data?: unknown
  error?: string
  transaction?: {
    id: string
    reference: string
    status: string
    token?: string
  }
}

const DEMO_USER_ID = 'demo-consumer-user-001'

// Utility providers
const ELECTRICITY_PROVIDERS = [
  { id: 'eskom', name: 'Eskom', regions: 'National' },
  { id: 'citypower', name: 'City Power', regions: 'Johannesburg' },
  { id: 'ekurhuleni', name: 'Ekurhuleni Electricity', regions: 'Ekurhuleni' },
  { id: 'ctelectricity', name: 'Cape Town Electricity', regions: 'Cape Town' },
  { id: 'durbanelectricity', name: 'eThekwini Electricity', regions: 'Durban' },
]

const WATER_PROVIDERS = [
  { id: 'jhbwater', name: 'Johannesburg Water', regions: 'Johannesburg' },
  { id: 'ctwater', name: 'Cape Town Water', regions: 'Cape Town' },
  { id: 'ekurhuleniwater', name: 'Ekurhuleni Water', regions: 'Ekurhuleni' },
  { id: 'durbanwater', name: 'eThekwini Water', regions: 'Durban' },
]

const BILL_PROVIDERS = [
  { id: 'dstv', name: 'DStv', type: 'tv' },
  { id: 'multichoice', name: 'MultiChoice', type: 'tv' },
  { id: 'showmax', name: 'Showmax', type: 'streaming' },
  { id: 'netflix', name: 'Netflix', type: 'streaming' },
  { id: 'telkom', name: 'Telkom', type: 'telecom' },
  { id: 'vodacom', name: 'Vodacom', type: 'telecom' },
]

// Generate reference
const generateReference = (prefix: string) => {
  return `${prefix}${Date.now().toString(36).toUpperCase()}${nanoid(4).toUpperCase()}`
}

// Generate electricity token (20 digits)
const generateElectricityToken = () => {
  const digits = Array.from({ length: 20 }, () => Math.floor(Math.random() * 10)).join('')
  return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8, 12)}-${digits.slice(12, 16)}-${digits.slice(16, 20)}`
}

// GET - List providers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all'

    let providers: unknown[] = []
    
    if (type === 'electricity' || type === 'all') {
      providers = [...providers, ...ELECTRICITY_PROVIDERS.map(p => ({ ...p, utilityType: 'electricity' }))]
    }
    if (type === 'water' || type === 'all') {
      providers = [...providers, ...WATER_PROVIDERS.map(p => ({ ...p, utilityType: 'water' }))]
    }
    if (type === 'bills' || type === 'all') {
      providers = [...providers, ...BILL_PROVIDERS.map(p => ({ ...p, utilityType: 'bills' }))]
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { providers }
    })
  } catch (error) {
    console.error('Error fetching providers:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch providers'
    }, { status: 500 })
  }
}

// POST - Purchase utility / Pay bill
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      type, // 'electricity' | 'water' | 'bills'
      userId = DEMO_USER_ID,
      meterNumber,
      accountNumber,
      providerId,
      amountCents,
      amount,
      idempotencyKey 
    } = body

    // Validate required fields
    if (!type) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Missing required field: type'
      }, { status: 400 })
    }

    const totalCents = amountCents || (amount ? Math.round(parseFloat(amount) * 100) : 0)
    if (!totalCents || totalCents <= 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Invalid amount'
      }, { status: 400 })
    }

    // Get wallet
    const wallet = await db.consumerWallet.findUnique({
      where: { userId }
    })

    if (!wallet) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Wallet not found'
      }, { status: 404 })
    }

    // Check balance
    if (wallet.balanceCents < BigInt(totalCents)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Insufficient funds'
      }, { status: 400 })
    }

    // Generate transaction details
    const txId = `util_${nanoid(12)}`
    const idempKey = idempotencyKey || nanoid(16)
    const txRef = generateReference(type === 'electricity' ? 'PWR' : type === 'water' ? 'H2O' : 'BIL')
    
    let txType: string
    let category: string
    let description: string
    let counterpartyName: string
    let token: string | undefined = undefined
    let kwh: number | undefined = undefined

    if (type === 'electricity') {
      if (!meterNumber) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Meter number is required for electricity purchase'
        }, { status: 400 })
      }

      txType = 'electricity_purchase'
      category = 'Electricity'
      const provider = ELECTRICITY_PROVIDERS.find(p => p.id === providerId) || ELECTRICITY_PROVIDERS[0]
      counterpartyName = provider.name
      token = generateElectricityToken()
      // Include token in description for traceability
      description = `Electricity Token ${token} - Meter ${meterNumber}`
      // Approximate kWh calculation (R1.50 per kWh average)
      kwh = Math.round((totalCents / 100) * 1.5)

    } else if (type === 'water') {
      if (!meterNumber && !accountNumber) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Meter or account number is required for water payment'
        }, { status: 400 })
      }

      txType = 'water_purchase'
      category = 'Water'
      const provider = WATER_PROVIDERS.find(p => p.id === providerId) || WATER_PROVIDERS[0]
      counterpartyName = provider.name
      token = generateReference('WTR')
      // Include token in description for traceability
      description = `Water Token ${token} - Meter ${meterNumber || accountNumber}`
      
    } else if (type === 'bills') {
      if (!accountNumber && !meterNumber) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Account number is required for bill payment'
        }, { status: 400 })
      }
      
      txType = 'bill_payment'
      const provider = BILL_PROVIDERS.find(p => p.id === providerId) || { name: providerId || 'Bill Payment', type: 'other' }
      counterpartyName = provider.name
      category = 'Bill Payments'
      description = `${provider.name} - ${accountNumber || meterNumber}`
      
    } else {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Invalid transaction type'
      }, { status: 400 })
    }

    // Process transaction
    const now = new Date();
    const voucherExpiry = new Date();
    voucherExpiry.setDate(voucherExpiry.getDate() + 30); // 30 days validity for tokens

    await db.$transaction(async (tx) => {
      // Update wallet balance
      await tx.consumerWallet.update({
        where: { userId },
        data: {
          balanceCents: wallet.balanceCents - BigInt(totalCents),
          updatedAt: now
        }
      })

      // Create transaction record
      await tx.consumerTransaction.create({
        data: {
          id: txId,
          idempotencyKey: idempKey,
          userId,
          transactionType: txType,
          direction: 'debit',
          amountCents: BigInt(totalCents),
          feeCents: BigInt(0),
          netAmountCents: BigInt(totalCents),
          currency: 'ZAR',
          status: 'completed',
          description,
          reference: txRef,
          category,
          counterpartyName,
          voucherToken: token,
          voucherExpiry: voucherExpiry.toISOString(),
          meterNumber: meterNumber || accountNumber || undefined,
          unitsPurchased: kwh ? `${kwh} kWh` : undefined,
          completedAt: now,
          createdAt: now,
          updatedAt: now
        }
      })
    })

    // Build response
    const receipt = {
      id: txId,
      reference: txRef,
      status: 'completed',
      type,
      amount: totalCents / 100,
      currency: 'ZAR',
      description,
      provider: counterpartyName,
      meterNumber: meterNumber || undefined,
      accountNumber: accountNumber || undefined,
      token,
      kwh,
      timestamp: new Date().toISOString(),
      receiptNumber: `RCP${Date.now().toString(36).toUpperCase()}`
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: receipt,
      transaction: {
        id: txId,
        reference: txRef,
        status: 'completed',
        token
      }
    })

  } catch (error) {
    console.error('Utility purchase error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to process transaction'
    return NextResponse.json<ApiResponse>({
      success: false,
      error: errorMessage
    }, { status: 500 })
  }
}
