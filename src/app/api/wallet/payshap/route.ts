import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateReference, generateIdempotencyKey, SA_BANKS, type ApiResponse } from '@/lib/wallet-utils'
import { nanoid } from 'nanoid'

// PayShap API Route - South Africa's instant payment system
// Includes BankServ integration simulation

// Mock BankServ Proxy ID Lookup
async function lookupProxyIdBankServ(proxyType: 'phone' | 'sa_id' | 'email', proxyValue: string) {
  // Simulate BankServ API call
  await new Promise(resolve => setTimeout(resolve, 300))
  
  const bank = SA_BANKS.find(b => b.payshap)
  if (!bank) return null
  
  // Simulate successful lookup
  return {
    found: true,
    bankId: bank.id,
    bankName: bank.name,
    bankCode: bank.code,
    accountType: 'cheque',
    accountName: proxyType === 'phone' ? 'Mobile Account' : 'Verified Account',
    verifiedAt: new Date().toISOString()
  }
}

// Mock BankServ Payment Processing
async function processPayShapPaymentBankServ(data: {
  fromBank: string
  fromAccount: string
  toBank: string
  toAccount: string
  amountCents: bigint
  reference: string
  idempotencyKey: string
}) {
  // Simulate BankServ RTP (Real-Time Payments) API call
  await new Promise(resolve => setTimeout(resolve, 500))
  
  const payShapRef = `PS${Date.now().toString(36).toUpperCase()}${nanoid(6).toUpperCase()}`
  
  return {
    success: true,
    payShapRef,
    status: 'completed',
    processedAt: new Date().toISOString(),
    settlementRef: `SET${nanoid(12).toUpperCase()}`,
    bankServRef: `BS${Date.now()}`
  }
}

// GET - Lookup proxy ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const proxyType = searchParams.get('proxyType') as 'phone' | 'sa_id' | 'email'
    const proxyValue = searchParams.get('proxyValue')
    const userId = searchParams.get('userId')

    if (!proxyType || !proxyValue) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Proxy type and value are required'
      }, { status: 400 })
    }

    // Validate proxy format
    if (proxyType === 'phone') {
      const cleaned = proxyValue.replace(/\D/g, '')
      if (cleaned.length < 10 || cleaned.length > 11) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Invalid phone number format'
        }, { status: 400 })
      }
    } else if (proxyType === 'sa_id') {
      if (proxyValue.length !== 13 || !/^\d{13}$/.test(proxyValue)) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Invalid SA ID number format'
        }, { status: 400 })
      }
    } else if (proxyType === 'email') {
      if (!proxyValue.includes('@')) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Invalid email format'
        }, { status: 400 })
      }
    }

    // Check if user has this proxy registered
    const existingRecipient = await db.payShapRecipient.findFirst({
      where: {
        userId: userId || undefined,
        proxyType,
        proxyValue
      }
    })

    // Lookup via BankServ
    const bankServResult = await lookupProxyIdBankServ(proxyType, proxyValue)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        proxyType,
        proxyValue,
        found: bankServResult?.found || false,
        recipient: existingRecipient,
        bankDetails: bankServResult ? {
          bankId: bankServResult.bankId,
          bankName: bankServResult.bankName,
          bankCode: bankServResult.bankCode,
          accountType: bankServResult.accountType,
          accountName: bankServResult.accountName,
          verifiedAt: bankServResult.verifiedAt
        } : null,
        supportedBanks: SA_BANKS.filter(b => b.payshap).map(b => ({
          id: b.id,
          name: b.name,
          code: b.code
        }))
      }
    })
  } catch (error) {
    console.error('Error in PayShap lookup:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to lookup proxy ID'
    }, { status: 500 })
  }
}

// POST - Send PayShap payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      userId,
      toProxyType,
      toProxyValue,
      amountCents,
      reference,
      idempotencyKey,
      fromAccountId
    } = body

    if (!userId || !toProxyType || !toProxyValue || !amountCents) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 })
    }

    // Check idempotency
    const idempKey = idempotencyKey || generateIdempotencyKey()
    const existingTransaction = await db.consumerTransaction.findUnique({
      where: { idempotencyKey: idempKey }
    })

    if (existingTransaction) {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: existingTransaction,
        transaction: {
          id: existingTransaction.id,
          reference: existingTransaction.reference || '',
          status: existingTransaction.status
        }
      })
    }

    // Validate amount (PayShap limits)
    if (BigInt(amountCents) > BigInt(30000000)) { // R300,000 limit
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Amount exceeds PayShap limit of R300,000'
      }, { status: 400 })
    }

    // Lookup recipient
    const bankServResult = await lookupProxyIdBankServ(toProxyType, toProxyValue)
    if (!bankServResult?.found) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Recipient not found'
      }, { status: 404 })
    }

    // Check user wallet balance
    const wallet = await db.consumerWallet.findUnique({
      where: { userId }
    })

    if (!wallet || wallet.balanceCents < BigInt(amountCents)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Insufficient funds'
      }, { status: 400 })
    }

    // Generate reference
    const txReference = generateReference('PS')
    const txId = `txn_${nanoid(16)}`

    // Process via BankServ
    const bankServResult2 = await processPayShapPaymentBankServ({
      fromBank: 'groway',
      fromAccount: fromAccountId || wallet.id,
      toBank: bankServResult.bankId,
      toAccount: toProxyValue,
      amountCents: BigInt(amountCents),
      reference: txReference,
      idempotencyKey: idempKey
    })

    // Create transaction record
    const transaction = await db.consumerTransaction.create({
      data: {
        id: txId,
        idempotencyKey: idempKey,
        userId,
        transactionType: 'payshap_send',
        direction: 'debit',
        amountCents: BigInt(amountCents),
        feeCents: BigInt(0), // PayShap is free for consumers
        netAmountCents: BigInt(amountCents),
        currency: 'ZAR',
        status: bankServResult2.success ? 'completed' : 'failed',
        description: `PayShap payment to ${toProxyValue}`,
        reference: txReference,
        category: 'transfer',
        counterpartyPhone: toProxyType === 'phone' ? toProxyValue : undefined,
        payShapRef: bankServResult2.payShapRef,
        processedAt: new Date(),
        completedAt: bankServResult2.success ? new Date() : undefined
      }
    })

    // Update wallet balance
    if (bankServResult2.success) {
      await db.consumerWallet.update({
        where: { userId },
        data: {
          balanceCents: wallet.balanceCents - BigInt(amountCents),
          totalSentCents: wallet.totalSentCents + BigInt(amountCents)
        }
      })
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        transaction,
        payShapRef: bankServResult2.payShapRef,
        bankServRef: bankServResult2.bankServRef,
        settlementRef: bankServResult2.settlementRef
      },
      transaction: {
        id: transaction.id,
        reference: txReference,
        status: transaction.status
      }
    })
  } catch (error) {
    console.error('Error in PayShap payment:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to process PayShap payment'
    }, { status: 500 })
  }
}

// PUT - Request payment (PayShap Request)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      userId,
      fromProxyType,
      fromProxyValue,
      amountCents,
      reference,
      description,
      expiresInMinutes
    } = body

    if (!userId || !amountCents) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 })
    }

    // Generate request reference
    const requestRef = generateReference('PSR')
    const expiresAt = new Date(Date.now() + (expiresInMinutes || 60) * 60 * 1000)

    // Create payment request record (mock - would store in DB)
    const paymentRequest = {
      id: `psr_${nanoid(12)}`,
      requestRef,
      userId,
      fromProxyType: fromProxyType || 'phone',
      fromProxyValue,
      amountCents: BigInt(amountCents),
      reference,
      description,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      payShapQr: `payshap://request?ref=${requestRef}&amount=${amountCents}`
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: paymentRequest,
      transaction: {
        id: paymentRequest.id,
        reference: requestRef,
        status: 'pending',
        confirmationUrl: paymentRequest.payShapQr
      }
    })
  } catch (error) {
    console.error('Error in PayShap request:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to create payment request'
    }, { status: 500 })
  }
}
