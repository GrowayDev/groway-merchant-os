import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Types for payment callback update
interface PaymentCallbackUpdate {
  transactionId?: string
  provider?: string
  rawPayload?: string
  processed?: boolean
  processedAt?: string
  processingResult?: string
  retryCount?: number
  lastRetryAt?: string
}

// Valid payment providers
const VALID_PROVIDERS = ['yoco', 'payfast', 'paystack', 'ozow', 'gropay']

// GET /api/payments/callbacks/[id] - Get a single payment callback
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const callback = await db.paymentCallback.findUnique({
      where: { id },
      include: {
        // Include the related transaction if available
        // Note: We need to query the transaction separately since there's no direct relation
      }
    })

    if (!callback) {
      return NextResponse.json({ error: 'Payment callback not found' }, { status: 404 })
    }

    // Get the related transaction
    const transaction = await db.paymentTransaction.findUnique({
      where: { transactionId: callback.transactionId }
    })

    return NextResponse.json({ 
      data: callback,
      transaction: transaction || null
    })
  } catch (error) {
    console.error('Error fetching payment callback:', error)
    return NextResponse.json({ error: 'Failed to fetch payment callback' }, { status: 500 })
  }
}

// PUT /api/payments/callbacks/[id] - Update a payment callback (for processing)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body: PaymentCallbackUpdate = await request.json()

    // Check if callback exists
    const existingCallback = await db.paymentCallback.findUnique({
      where: { id }
    })

    if (!existingCallback) {
      return NextResponse.json({ error: 'Payment callback not found' }, { status: 404 })
    }

    // Validate provider if provided
    if (body.provider && !VALID_PROVIDERS.includes(body.provider)) {
      return NextResponse.json({ 
        error: `Invalid provider. Must be one of: ${VALID_PROVIDERS.join(', ')}` 
      }, { status: 400 })
    }

    // Build update data object
    const updateData: Record<string, unknown> = {}

    if (body.transactionId !== undefined) updateData.transactionId = body.transactionId
    if (body.provider !== undefined) updateData.provider = body.provider
    if (body.rawPayload !== undefined) updateData.rawPayload = body.rawPayload
    if (body.processed !== undefined) updateData.processed = body.processed
    if (body.processedAt !== undefined) updateData.processedAt = body.processedAt ? new Date(body.processedAt) : null
    if (body.processingResult !== undefined) updateData.processingResult = body.processingResult
    if (body.retryCount !== undefined) updateData.retryCount = body.retryCount
    if (body.lastRetryAt !== undefined) updateData.lastRetryAt = body.lastRetryAt ? new Date(body.lastRetryAt) : null

    const callback = await db.paymentCallback.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ data: callback })
  } catch (error) {
    console.error('Error updating payment callback:', error)
    return NextResponse.json({ error: 'Failed to update payment callback' }, { status: 500 })
  }
}

// POST /api/payments/callbacks/[id] - Retry processing a callback
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if callback exists
    const callback = await db.paymentCallback.findUnique({
      where: { id }
    })

    if (!callback) {
      return NextResponse.json({ error: 'Payment callback not found' }, { status: 404 })
    }

    if (callback.processed) {
      return NextResponse.json({ 
        message: 'Callback already processed',
        data: callback 
      })
    }

    // Get the related transaction
    const transaction = await db.paymentTransaction.findUnique({
      where: { transactionId: callback.transactionId }
    })

    if (!transaction) {
      // Update retry count
      await db.paymentCallback.update({
        where: { id },
        data: {
          retryCount: callback.retryCount + 1,
          lastRetryAt: new Date(),
          processingResult: 'Transaction not found'
        }
      })
      
      return NextResponse.json({ error: 'Related transaction not found' }, { status: 404 })
    }

    // Try to process the callback again
    let processingResult = 'No action taken'
    
    try {
      const payload = JSON.parse(callback.rawPayload)
      
      // Handle different provider callbacks
      if (payload.status || payload.payment_status) {
        const paymentStatus = payload.status || payload.payment_status
        const isSuccess = ['success', 'completed', 'paid', 'approved'].includes(paymentStatus?.toLowerCase())
        const isFailed = ['failed', 'declined', 'cancelled', 'canceled'].includes(paymentStatus?.toLowerCase())
        
        if (isSuccess && transaction.status !== 'completed') {
          await db.paymentTransaction.update({
            where: { transactionId: callback.transactionId },
            data: {
              status: 'completed',
              completedAt: new Date(),
              processedAt: new Date(),
              providerTransactionId: payload.transaction_id || payload.provider_transaction_id || transaction.providerTransactionId,
              providerReference: payload.reference || payload.payment_reference || transaction.providerReference,
            }
          })
          processingResult = 'Transaction marked as completed on retry'
        } else if (isFailed && transaction.status !== 'failed') {
          await db.paymentTransaction.update({
            where: { transactionId: callback.transactionId },
            data: {
              status: 'failed',
              failureReason: payload.message || payload.error_message || 'Payment failed',
              failureCode: payload.code || payload.error_code,
              processedAt: new Date(),
            }
          })
          processingResult = 'Transaction marked as failed on retry'
        }
      }
    } catch (parseError) {
      processingResult = 'Unable to parse callback payload'
    }

    // Update callback as processed
    const updatedCallback = await db.paymentCallback.update({
      where: { id },
      data: {
        processed: true,
        processedAt: new Date(),
        processingResult,
        retryCount: callback.retryCount + 1,
        lastRetryAt: new Date(),
      }
    })

    return NextResponse.json({ 
      message: 'Callback reprocessed',
      data: updatedCallback,
      processingResult
    })
  } catch (error) {
    console.error('Error reprocessing payment callback:', error)
    return NextResponse.json({ error: 'Failed to reprocess payment callback' }, { status: 500 })
  }
}
