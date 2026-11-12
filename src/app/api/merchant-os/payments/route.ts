import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getAuthContext, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-context'

const prisma = new PrismaClient()

// GET /api/merchant-os/payments - List payments
// Security: Requires authentication. merchantId must match authenticated user's merchant.
export async function GET(request: NextRequest) {
  // Authentication check
  const context = await getAuthContext(request)
  if (!context) {
    return unauthorizedResponse('Authentication required')
  }

  try {
    const { searchParams } = new URL(request.url)
    const queryMerchantId = searchParams.get('merchantId')
    const branchId = searchParams.get('branchId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Security: Validate merchantId
    let merchantId: string
    if ('merchantId' in context) {
      if (queryMerchantId && queryMerchantId !== context.merchantId) {
        if (context.role !== 'platform_admin' && context.role !== 'super_admin') {
          return forbiddenResponse('Access denied to this merchant')
        }
        merchantId = queryMerchantId
      } else {
        merchantId = context.merchantId
      }
    } else {
      if (!queryMerchantId) {
        return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
      }
      merchantId = queryMerchantId
    }

    const where: any = { merchantId }
    if (branchId) where.branchId = branchId
    if (status) where.status = status

    const [payments, total] = await Promise.all([
      prisma.paymentTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.paymentTransaction.count({ where }),
    ])

    return NextResponse.json({
      payments,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}

// POST /api/merchant-os/payments - Create payment
// Security: Requires authentication. merchantId must match authenticated user's merchant.
export async function POST(request: NextRequest) {
  // Authentication check
  const context = await getAuthContext(request)
  if (!context) {
    return unauthorizedResponse('Authentication required')
  }

  try {
    const body = await request.json()
    const {
      merchantId: bodyMerchantId,
      branchId,
      saleId,
      amount,
      currency = 'ZAR',
      paymentMethod,
      paymentProvider,
      cardLastFour,
      cardType,
      cardHolder,
    } = body

    // Security: Validate merchantId
    let merchantId: string
    if ('merchantId' in context) {
      if (bodyMerchantId && bodyMerchantId !== context.merchantId) {
        if (context.role !== 'platform_admin' && context.role !== 'super_admin') {
          return forbiddenResponse('Access denied to this merchant')
        }
        merchantId = bodyMerchantId
      } else {
        merchantId = context.merchantId
      }
    } else {
      if (!bodyMerchantId) {
        return NextResponse.json(
          { error: 'merchantId, amount, and paymentMethod are required' },
          { status: 400 }
        )
      }
      merchantId = bodyMerchantId
    }

    if (!amount || !paymentMethod) {
      return NextResponse.json(
        { error: 'amount and paymentMethod are required' },
        { status: 400 }
      )
    }

    // Generate unique transaction ID
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    const payment = await prisma.paymentTransaction.create({
      data: {
        transactionId,
        merchantId,
        branchId,
        saleId,
        amount,
        currency,
        paymentMethod,
        paymentProvider,
        cardLastFour,
        cardType,
        cardHolder,
        status: 'pending',
      },
    })

    // Simulate payment processing based on provider
    const processingResult = await processPayment(payment)

    // Update payment with result
    const updatedPayment = await prisma.paymentTransaction.update({
      where: { id: payment.id },
      data: processingResult,
    })

    return NextResponse.json(updatedPayment, { status: 201 })
  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    )
  }
}

// Simulate payment processing
async function processPayment(payment: any) {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 500))

  const updateData: any = {
    status: 'completed',
    processedAt: new Date(),
    completedAt: new Date(),
  }

  // Calculate fees based on provider
  const feeRates: Record<string, number> = {
    yoco: 0.0295,
    payfast: 0.025,
    paystack: 0.015,
    ozow: 0.015,
    gropay: 0.0125,
  }

  const provider = payment.paymentProvider || 'default'
  const rate = feeRates[provider] || 0.02

  if (payment.paymentMethod === 'card') {
    updateData.providerFee = payment.amount * rate
    updateData.platformFee = payment.amount * 0.005
  } else if (payment.paymentMethod === 'qr') {
    updateData.providerFee = payment.amount * 0.0125
    updateData.platformFee = payment.amount * 0.003
  } else if (payment.paymentMethod === 'eft') {
    updateData.providerFee = 2.00
    updateData.platformFee = 0.50
  } else {
    updateData.providerFee = 0
    updateData.platformFee = 0
  }

  updateData.netAmount = payment.amount - updateData.providerFee - updateData.platformFee
  updateData.providerTransactionId = `${provider.toUpperCase()}-${Date.now()}`
  updateData.providerReference = `REF-${Math.random().toString(36).substr(2, 8).toUpperCase()}`

  return updateData
}
