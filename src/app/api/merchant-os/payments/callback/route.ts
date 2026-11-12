import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

// POST /api/merchant-os/payments/callback - Handle payment provider webhooks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const rawBody = JSON.stringify(body)
    
    // Get provider from header or body
    const provider = request.headers.get('x-payment-provider') || body.provider || 'unknown'
    
    // Log the callback
    const callback = await prisma.paymentCallback.create({
      data: {
        transactionId: body.transactionId || body.reference || 'unknown',
        provider,
        rawPayload: rawBody,
        processed: false,
      },
    })

    // Validate webhook signature based on provider
    const signature = request.headers.get('x-signature') || request.headers.get('signature')
    const isValid = validateWebhookSignature(provider, rawBody, signature)
    
    if (!isValid) {
      await prisma.paymentCallback.update({
        where: { id: callback.id },
        data: {
          processed: true,
          processedAt: new Date(),
          processingResult: 'Invalid signature',
        },
      })
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Process the callback based on provider
    let processingResult: any = {}
    
    switch (provider.toLowerCase()) {
      case 'yoco':
        processingResult = await processYocoCallback(body)
        break
      case 'payfast':
        processingResult = await processPayfastCallback(body)
        break
      case 'paystack':
        processingResult = await processPaystackCallback(body)
        break
      case 'ozow':
        processingResult = await processOzowCallback(body)
        break
      case 'gropay':
        processingResult = await processGropayCallback(body)
        break
      default:
        processingResult = { success: false, error: 'Unknown provider' }
    }

    // Update callback record
    await prisma.paymentCallback.update({
      where: { id: callback.id },
      data: {
        processed: true,
        processedAt: new Date(),
        processingResult: JSON.stringify(processingResult),
      },
    })

    return NextResponse.json(processingResult)
  } catch (error) {
    console.error('Error processing payment callback:', error)
    return NextResponse.json(
      { error: 'Failed to process callback' },
      { status: 500 }
    )
  }
}

// Validate webhook signature
function validateWebhookSignature(provider: string, payload: string, signature: string | null): boolean {
  if (!signature) return true // Skip validation for demo
  
  // In production, validate using provider-specific keys
  const webhookSecrets: Record<string, string> = {
    yoco: process.env.YOCO_WEBHOOK_SECRET || '',
    payfast: process.env.PAYFAST_WEBHOOK_SECRET || '',
    paystack: process.env.PAYSTACK_WEBHOOK_SECRET || '',
    ozow: process.env.OZOW_WEBHOOK_SECRET || '',
    gropay: process.env.GROPAY_WEBHOOK_SECRET || '',
  }
  
  const secret = webhookSecrets[provider.toLowerCase()]
  if (!secret) return true // Skip if no secret configured
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  
  return signature === expectedSignature
}

// Yoco callback processor
async function processYocoCallback(body: any) {
  const { transactionId, status, metadata } = body
  
  const payment = await prisma.paymentTransaction.findFirst({
    where: { transactionId },
  })
  
  if (!payment) {
    return { success: false, error: 'Payment not found' }
  }
  
  const updateData: any = {
    status: status === 'successful' ? 'completed' : status === 'failed' ? 'failed' : 'pending',
    providerTransactionId: body.id,
  }
  
  if (status === 'successful') {
    updateData.completedAt = new Date()
    updateData.processedAt = new Date()
  } else if (status === 'failed') {
    updateData.failedAt = new Date()
    updateData.failureReason = body.failureReason || 'Payment failed'
    updateData.failureCode = body.failureCode
  }
  
  await prisma.paymentTransaction.update({
    where: { id: payment.id },
    data: updateData,
  })
  
  return { success: true, transactionId }
}

// PayFast callback processor
async function processPayfastCallback(body: any) {
  const { m_payment_id, payment_status, pf_payment_id } = body
  
  const payment = await prisma.paymentTransaction.findFirst({
    where: { transactionId: m_payment_id },
  })
  
  if (!payment) {
    return { success: false, error: 'Payment not found' }
  }
  
  const statusMap: Record<string, string> = {
    'COMPLETE': 'completed',
    'FAILED': 'failed',
    'PENDING': 'pending',
    'CANCELLED': 'cancelled',
  }
  
  await prisma.paymentTransaction.update({
    where: { id: payment.id },
    data: {
      status: statusMap[payment_status] || 'pending',
      providerTransactionId: pf_payment_id,
      completedAt: payment_status === 'COMPLETE' ? new Date() : null,
    },
  })
  
  return { success: true, transactionId: m_payment_id }
}

// Paystack callback processor
async function processPaystackCallback(body: any) {
  const { data } = body
  const { reference, status, id } = data
  
  const payment = await prisma.paymentTransaction.findFirst({
    where: { 
      OR: [
        { transactionId: reference },
        { providerReference: reference },
      ]
    },
  })
  
  if (!payment) {
    return { success: false, error: 'Payment not found' }
  }
  
  const statusMap: Record<string, string> = {
    'success': 'completed',
    'failed': 'failed',
    'abandoned': 'cancelled',
    'reversed': 'reversed',
  }
  
  await prisma.paymentTransaction.update({
    where: { id: payment.id },
    data: {
      status: statusMap[status] || 'pending',
      providerTransactionId: id.toString(),
      completedAt: status === 'success' ? new Date() : null,
    },
  })
  
  return { success: true, transactionId: reference }
}

// Ozow callback processor
async function processOzowCallback(body: any) {
  const { TransactionId, Status, TransactionReference } = body
  
  const payment = await prisma.paymentTransaction.findFirst({
    where: { transactionId: TransactionReference },
  })
  
  if (!payment) {
    return { success: false, error: 'Payment not found' }
  }
  
  const statusMap: Record<string, string> = {
    'Complete': 'completed',
    'Failed': 'failed',
    'Cancelled': 'cancelled',
    'Pending': 'pending',
  }
  
  await prisma.paymentTransaction.update({
    where: { id: payment.id },
    data: {
      status: statusMap[Status] || 'pending',
      providerTransactionId: TransactionId,
      completedAt: Status === 'Complete' ? new Date() : null,
    },
  })
  
  return { success: true, transactionId: TransactionReference }
}

// Gropay callback processor
async function processGropayCallback(body: any) {
  const { transactionId, status, gropayTransactionId } = body
  
  const payment = await prisma.paymentTransaction.findFirst({
    where: { transactionId },
  })
  
  if (!payment) {
    return { success: false, error: 'Payment not found' }
  }
  
  await prisma.paymentTransaction.update({
    where: { id: payment.id },
    data: {
      status,
      providerTransactionId: gropayTransactionId,
      completedAt: status === 'completed' ? new Date() : null,
    },
  })
  
  return { success: true, transactionId }
}
