import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Types for payment callback
interface PaymentCallbackCreate {
  transactionId: string
  provider: string
  rawPayload: string
  processed?: boolean
  processedAt?: string
  processingResult?: string
  retryCount?: number
}

// Valid payment providers
const VALID_PROVIDERS = ['yoco', 'payfast', 'paystack', 'ozow', 'gropay']

// GET /api/payments/callbacks - List all payment callbacks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('transactionId')
    const provider = searchParams.get('provider')
    const processed = searchParams.get('processed')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build where clause
    const where: {
      transactionId?: string
      provider?: string
      processed?: boolean
      createdAt?: {
        gte?: Date
        lte?: Date
      }
    } = {}

    if (transactionId) where.transactionId = transactionId
    if (provider) where.provider = provider
    if (processed !== null && processed !== undefined) {
      where.processed = processed === 'true'
    }

    // Date filtering
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    const take = limit ? parseInt(limit) : undefined
    const skip = offset ? parseInt(offset) : undefined

    const [callbacks, total] = await Promise.all([
      db.paymentCallback.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      db.paymentCallback.count({ where })
    ])

    return NextResponse.json({
      data: callbacks,
      total,
      limit: take,
      offset: skip
    })
  } catch (error) {
    console.error('Error fetching payment callbacks:', error)
    return NextResponse.json({ error: 'Failed to fetch payment callbacks' }, { status: 500 })
  }
}

// POST /api/payments/callbacks - Create a new payment callback (for webhooks)
export async function POST(request: NextRequest) {
  try {
    const body: PaymentCallbackCreate = await request.json()

    // Validate required fields
    if (!body.transactionId) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 })
    }
    if (!body.provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 })
    }
    if (!body.rawPayload) {
      return NextResponse.json({ error: 'Raw payload is required' }, { status: 400 })
    }

    // Validate provider
    if (!VALID_PROVIDERS.includes(body.provider)) {
      return NextResponse.json({ 
        error: `Invalid provider. Must be one of: ${VALID_PROVIDERS.join(', ')}` 
      }, { status: 400 })
    }

    // Check if the transaction exists
    const transaction = await db.paymentTransaction.findUnique({
      where: { transactionId: body.transactionId }
    })

    if (!transaction) {
      return NextResponse.json({ 
        error: 'Transaction not found. Callback rejected.' 
      }, { status: 404 })
    }

    // Create the callback record
    const callback = await db.paymentCallback.create({
      data: {
        transactionId: body.transactionId,
        provider: body.provider,
        rawPayload: body.rawPayload,
        processed: body.processed ?? false,
        processedAt: body.processedAt ? new Date(body.processedAt) : null,
        processingResult: body.processingResult,
        retryCount: body.retryCount ?? 0,
      }
    })

    // Try to parse the payload and update transaction if it's a success callback
    try {
      const payload = JSON.parse(body.rawPayload)
      
      // Handle different provider callbacks
      if (payload.status || payload.payment_status) {
        const paymentStatus = payload.status || payload.payment_status
        const isSuccess = ['success', 'completed', 'paid', 'approved'].includes(paymentStatus?.toLowerCase())
        const isFailed = ['failed', 'declined', 'cancelled', 'canceled'].includes(paymentStatus?.toLowerCase())
        
        if (isSuccess && !transaction.completedAt) {
          await db.paymentTransaction.update({
            where: { transactionId: body.transactionId },
            data: {
              status: 'completed',
              completedAt: new Date(),
              processedAt: new Date(),
              providerTransactionId: payload.transaction_id || payload.provider_transaction_id || transaction.providerTransactionId,
              providerReference: payload.reference || payload.payment_reference || transaction.providerReference,
            }
          })
          
          // Mark callback as processed
          await db.paymentCallback.update({
            where: { id: callback.id },
            data: {
              processed: true,
              processedAt: new Date(),
              processingResult: 'Transaction marked as completed'
            }
          })
        } else if (isFailed) {
          await db.paymentTransaction.update({
            where: { transactionId: body.transactionId },
            data: {
              status: 'failed',
              failureReason: payload.message || payload.error_message || 'Payment failed',
              failureCode: payload.code || payload.error_code,
              processedAt: new Date(),
            }
          })
          
          // Mark callback as processed
          await db.paymentCallback.update({
            where: { id: callback.id },
            data: {
              processed: true,
              processedAt: new Date(),
              processingResult: 'Transaction marked as failed'
            }
          })
        }
      }
    } catch (parseError) {
      // Payload is not valid JSON, just log the callback
      console.log('Callback payload is not valid JSON, storing as-is')
    }

    return NextResponse.json({ 
      message: 'Callback received and stored',
      data: callback 
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating payment callback:', error)
    return NextResponse.json({ error: 'Failed to process payment callback' }, { status: 500 })
  }
}
