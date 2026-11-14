import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateReference, generateIdempotencyKey, type ApiResponse } from '@/lib/wallet-utils'

// GET - List laybyes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status') || 'active'

    if (!userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'User ID is required'
      }, { status: 400 })
    }

    const laybyes = await db.consumerLaybye.findMany({
      where: {
        userId,
        status: status === 'all' ? undefined : status
      },
      include: {
        ConsumerLaybyePayment: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: laybyes.map(laybye => ({
        ...laybye,
        progress: Number(laybye.totalPaidCents) / Number(laybye.totalAmountCents) * 100
      }))
    })
  } catch (error) {
    console.error('Error fetching laybyes:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch laybyes'
    }, { status: 500 })
  }
}

// POST - Create laybye or make payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId, laybyeData } = body

    if (!userId || !action) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'User ID and action are required'
      }, { status: 400 })
    }

    switch (action) {
      case 'create': {
        const { itemDescription, itemImage, totalAmountCents, depositAmountCents, installmentCount, frequency, merchantId, merchantName } = laybyeData

        // Validate deposit (minimum 10%)
        const minDeposit = Number(totalAmountCents) * 0.1
        if (Number(depositAmountCents) < minDeposit) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: `Minimum deposit is R ${(minDeposit / 100).toFixed(2)} (10%)`
          }, { status: 400 })
        }

        // Calculate installment amount
        const balanceCents = BigInt(totalAmountCents) - BigInt(depositAmountCents)
        const installmentAmountCents = balanceCents / BigInt(installmentCount || 6)

        // Calculate next due date based on frequency
        const now = new Date()
        let nextDueDate = new Date()
        switch (frequency) {
          case 'weekly':
            nextDueDate.setDate(now.getDate() + 7)
            break
          case 'biweekly':
            nextDueDate.setDate(now.getDate() + 14)
            break
          case 'monthly':
          default:
            nextDueDate.setMonth(now.getMonth() + 1)
            break
        }

        const laybyeNumber = generateReference('LYB')

        // Create laybye
        const laybye = await db.consumerLaybye.create({
          data: {
            id: `lyb_${Date.now()}`,
            userId,
            laybyeNumber,
            merchantId,
            merchantName,
            itemDescription,
            itemImage,
            totalAmountCents: BigInt(totalAmountCents),
            depositAmountCents: BigInt(depositAmountCents),
            balanceAmountCents: balanceCents,
            installmentCount: installmentCount || 6,
            installmentsPaid: 0,
            installmentAmountCents,
            frequency: frequency || 'monthly',
            nextDueDate: nextDueDate.toISOString().split('T')[0],
            status: 'active',
            totalPaidCents: BigInt(depositAmountCents)
          }
        })

        // Record deposit payment
        await db.consumerLaybyePayment.create({
          data: {
            id: `lybp_${Date.now()}`,
            laybyeId: laybye.id,
            amountCents: BigInt(depositAmountCents),
            paymentMethod: 'wallet',
            reference: `${laybyeNumber}-DEP`,
            status: 'completed',
            paidAt: new Date()
          }
        })

        return NextResponse.json<ApiResponse>({
          success: true,
          data: laybye,
          transaction: {
            id: laybye.id,
            reference: laybye.laybyeNumber,
            status: laybye.status
          }
        })
      }

      case 'payment': {
        const { laybyeId, amountCents, paymentMethod } = laybyeData

        if (!laybyeId || !amountCents) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Laybye ID and amount are required'
          }, { status: 400 })
        }

        const laybye = await db.consumerLaybye.findFirst({
          where: { id: laybyeId, userId, status: 'active' }
        })

        if (!laybye) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Laybye not found or not active'
          }, { status: 404 })
        }

        // Create payment record
        const payment = await db.consumerLaybyePayment.create({
          data: {
            id: `lybp_${Date.now()}`,
            laybyeId: laybye.id,
            amountCents: BigInt(amountCents),
            paymentMethod: paymentMethod || 'wallet',
            reference: generateReference('LYP'),
            status: 'completed',
            paidAt: new Date()
          }
        })

        // Update laybye totals
        const newTotalPaid = laybye.totalPaidCents + BigInt(amountCents)
        const newBalance = laybye.totalAmountCents - newTotalPaid
        const newInstallmentsPaid = laybye.installmentsPaid + 1

        // Calculate next due date
        const now = new Date()
        let nextDueDate = new Date()
        switch (laybye.frequency) {
          case 'weekly':
            nextDueDate.setDate(now.getDate() + 7)
            break
          case 'biweekly':
            nextDueDate.setDate(now.getDate() + 14)
            break
          default:
            nextDueDate.setMonth(now.getMonth() + 1)
        }

        // Check if laybye is complete
        const isComplete = newTotalPaid >= laybye.totalAmountCents

        await db.consumerLaybye.update({
          where: { id: laybye.id },
          data: {
            totalPaidCents: newTotalPaid,
            balanceAmountCents: newBalance,
            installmentsPaid: newInstallmentsPaid,
            nextDueDate: isComplete ? null : nextDueDate.toISOString().split('T')[0],
            status: isComplete ? 'completed' : 'active'
          }
        })

        return NextResponse.json<ApiResponse>({
          success: true,
          data: {
            payment,
            laybye: {
              id: laybye.id,
              totalPaidCents: newTotalPaid,
              balanceAmountCents: newBalance,
              installmentsPaid: newInstallmentsPaid,
              status: isComplete ? 'completed' : 'active'
            }
          },
          transaction: {
            id: payment.id,
            reference: payment.reference || '',
            status: 'completed'
          }
        })
      }

      default:
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Invalid action'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Error processing laybye:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to process laybye'
    }, { status: 500 })
  }
}

// PUT - Update laybye
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, laybyeId, action } = body

    if (!userId || !laybyeId || !action) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'User ID, laybye ID, and action are required'
      }, { status: 400 })
    }

    const laybye = await db.consumerLaybye.findFirst({
      where: { id: laybyeId, userId }
    })

    if (!laybye) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Laybye not found'
      }, { status: 404 })
    }

    switch (action) {
      case 'cancel': {
        // Calculate refund (total paid - 15% cancellation fee)
        const cancelFeePercent = 0.15
        const cancelFeeCents = laybye.totalPaidCents * BigInt(Math.floor(cancelFeePercent * 100)) / BigInt(100)
        const refundAmount = laybye.totalPaidCents - cancelFeeCents

        await db.consumerLaybye.update({
          where: { id: laybyeId },
          data: {
            status: 'cancelled',
            cancelledAt: new Date(),
            cancelFeeCents,
            refundAmountCents: refundAmount
          }
        })

        return NextResponse.json<ApiResponse>({
          success: true,
          data: {
            status: 'cancelled',
            cancelFeeCents,
            refundAmountCents: refundAmount
          }
        })
      }

      default:
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Invalid action'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Error updating laybye:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to update laybye'
    }, { status: 500 })
  }
}
