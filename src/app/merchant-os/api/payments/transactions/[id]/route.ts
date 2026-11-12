import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Types for payment transaction update
interface PaymentTransactionUpdate {
  saleId?: string
  branchId?: string
  amount?: number
  currency?: string
  paymentMethod?: string
  paymentProvider?: string
  providerReference?: string
  providerTransactionId?: string
  providerMerchantId?: string
  cardType?: string
  cardLastFour?: string
  cardHolder?: string
  status?: string
  failureReason?: string
  failureCode?: string
  providerFee?: number
  platformFee?: number
  netAmount?: number
  settlementStatus?: string
  settlementDate?: string
  settlementReference?: string
  refundAmount?: number
  refundReason?: string
  refundedAt?: string
  processedAt?: string
  completedAt?: string
}

// GET /api/payments/transactions/[id] - Get a single payment transaction
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Try to find by ID first, then by transactionId
    let transaction = await db.paymentTransaction.findUnique({
      where: { id }
    })

    if (!transaction) {
      transaction = await db.paymentTransaction.findUnique({
        where: { transactionId: id }
      })
    }

    if (!transaction) {
      return NextResponse.json({ error: 'Payment transaction not found' }, { status: 404 })
    }

    return NextResponse.json({ data: transaction })
  } catch (error) {
    console.error('Error fetching payment transaction:', error)
    return NextResponse.json({ error: 'Failed to fetch payment transaction' }, { status: 500 })
  }
}

// PUT /api/payments/transactions/[id] - Update a payment transaction
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body: PaymentTransactionUpdate = await request.json()

    // Try to find by ID first, then by transactionId
    let existingTransaction = await db.paymentTransaction.findUnique({
      where: { id }
    })

    if (!existingTransaction) {
      existingTransaction = await db.paymentTransaction.findUnique({
        where: { transactionId: id }
      })
    }

    if (!existingTransaction) {
      return NextResponse.json({ error: 'Payment transaction not found' }, { status: 404 })
    }

    // Validate payment method if provided
    if (body.paymentMethod) {
      const validPaymentMethods = ['cash', 'card', 'qr', 'wallet', 'eft', 'voucher']
      if (!validPaymentMethods.includes(body.paymentMethod)) {
        return NextResponse.json({ 
          error: `Invalid payment method. Must be one of: ${validPaymentMethods.join(', ')}` 
        }, { status: 400 })
      }
    }

    // Validate payment provider if provided
    if (body.paymentProvider) {
      const validProviders = ['yoco', 'payfast', 'paystack', 'ozow', 'gropay']
      if (!validProviders.includes(body.paymentProvider)) {
        return NextResponse.json({ 
          error: `Invalid payment provider. Must be one of: ${validProviders.join(', ')}` 
        }, { status: 400 })
      }
    }

    // Validate status if provided
    if (body.status) {
      const validStatuses = ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled']
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json({ 
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
        }, { status: 400 })
      }
    }

    // Validate settlement status if provided
    if (body.settlementStatus) {
      const validSettlementStatuses = ['pending', 'settled', 'processing']
      if (!validSettlementStatuses.includes(body.settlementStatus)) {
        return NextResponse.json({ 
          error: `Invalid settlement status. Must be one of: ${validSettlementStatuses.join(', ')}` 
        }, { status: 400 })
      }
    }

    // Build update data object
    const updateData: Record<string, unknown> = {}

    // References
    if (body.saleId !== undefined) updateData.saleId = body.saleId
    if (body.branchId !== undefined) updateData.branchId = body.branchId

    // Amount
    if (body.amount !== undefined) updateData.amount = body.amount
    if (body.currency !== undefined) updateData.currency = body.currency

    // Payment method
    if (body.paymentMethod !== undefined) updateData.paymentMethod = body.paymentMethod
    if (body.paymentProvider !== undefined) updateData.paymentProvider = body.paymentProvider

    // Provider details
    if (body.providerReference !== undefined) updateData.providerReference = body.providerReference
    if (body.providerTransactionId !== undefined) updateData.providerTransactionId = body.providerTransactionId
    if (body.providerMerchantId !== undefined) updateData.providerMerchantId = body.providerMerchantId

    // Card details
    if (body.cardType !== undefined) updateData.cardType = body.cardType
    if (body.cardLastFour !== undefined) updateData.cardLastFour = body.cardLastFour
    if (body.cardHolder !== undefined) updateData.cardHolder = body.cardHolder

    // Status
    if (body.status !== undefined) updateData.status = body.status
    if (body.failureReason !== undefined) updateData.failureReason = body.failureReason
    if (body.failureCode !== undefined) updateData.failureCode = body.failureCode

    // Fees
    if (body.providerFee !== undefined) updateData.providerFee = body.providerFee
    if (body.platformFee !== undefined) updateData.platformFee = body.platformFee
    if (body.netAmount !== undefined) updateData.netAmount = body.netAmount

    // Settlement
    if (body.settlementStatus !== undefined) updateData.settlementStatus = body.settlementStatus
    if (body.settlementDate !== undefined) updateData.settlementDate = body.settlementDate
    if (body.settlementReference !== undefined) updateData.settlementReference = body.settlementReference

    // Refund
    if (body.refundAmount !== undefined) updateData.refundAmount = body.refundAmount
    if (body.refundReason !== undefined) updateData.refundReason = body.refundReason
    if (body.refundedAt !== undefined) updateData.refundedAt = body.refundedAt ? new Date(body.refundedAt) : null

    // Timestamps
    if (body.processedAt !== undefined) updateData.processedAt = body.processedAt ? new Date(body.processedAt) : null
    if (body.completedAt !== undefined) updateData.completedAt = body.completedAt ? new Date(body.completedAt) : null

    const transaction = await db.paymentTransaction.update({
      where: { id: existingTransaction.id },
      data: updateData
    })

    return NextResponse.json({ data: transaction })
  } catch (error) {
    console.error('Error updating payment transaction:', error)
    return NextResponse.json({ error: 'Failed to update payment transaction' }, { status: 500 })
  }
}

// DELETE /api/payments/transactions/[id] - Delete a payment transaction (soft delete by setting status to cancelled)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Try to find by ID first, then by transactionId
    let existingTransaction = await db.paymentTransaction.findUnique({
      where: { id }
    })

    if (!existingTransaction) {
      existingTransaction = await db.paymentTransaction.findUnique({
        where: { transactionId: id }
      })
    }

    if (!existingTransaction) {
      return NextResponse.json({ error: 'Payment transaction not found' }, { status: 404 })
    }

    // Check if transaction can be cancelled
    if (existingTransaction.status === 'completed') {
      return NextResponse.json({ 
        error: 'Cannot delete a completed transaction. Use refund instead.' 
      }, { status: 400 })
    }

    // Perform soft delete by updating status to 'cancelled'
    const transaction = await db.paymentTransaction.update({
      where: { id: existingTransaction.id },
      data: {
        status: 'cancelled',
        failureReason: 'Transaction cancelled by user'
      }
    })

    return NextResponse.json({
      message: 'Payment transaction cancelled successfully',
      data: transaction
    })
  } catch (error) {
    console.error('Error deleting payment transaction:', error)
    return NextResponse.json({ error: 'Failed to delete payment transaction' }, { status: 500 })
  }
}
