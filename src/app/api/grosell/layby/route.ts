/**
 * GroSell Layby API
 * 
 * Layby payment plans with flexible installment options
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const merchantId = searchParams.get('merchantId')
    const planId = searchParams.get('planId')
    const laybyNumber = searchParams.get('laybyNumber')
    const customerPhone = searchParams.get('customerPhone')
    const status = searchParams.get('status')

    if (planId || laybyNumber) {
      const where = planId ? { id: planId } : { laybyNumber }
      const plan = await db.groSellLaybyPlan.findUnique({
        where,
        include: {
          GroSellOrder: true
        }
      })

      if (!plan) {
        return NextResponse.json({ error: 'Layby plan not found' }, { status: 404 })
      }

      // Parse payments history
      const paymentsHistory = plan.paymentsHistory ? JSON.parse(plan.paymentsHistory) : []

      return NextResponse.json({
        success: true,
        plan: {
          ...plan,
          paymentsHistory
        }
      })
    }

    if (!merchantId) {
      return NextResponse.json({ error: 'Missing merchantId' }, { status: 400 })
    }

    const where: any = { merchantId }
    if (customerPhone) where.customerPhone = customerPhone
    if (status) where.status = status

    const plans = await db.groSellLaybyPlan.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    return NextResponse.json({
      success: true,
      plans,
      count: plans.length
    })
  } catch (error) {
    console.error('GroSell Layby get error:', error)
    return NextResponse.json({ error: 'Failed to get Layby plans' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      planId,
      action,
      amount,
      paymentReference,
      paymentMethod
    } = body

    if (!planId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: planId, action' },
        { status: 400 }
      )
    }

    const plan = await db.groSellLaybyPlan.findUnique({
      where: { id: planId }
    })

    if (!plan) {
      return NextResponse.json({ error: 'Layby plan not found' }, { status: 404 })
    }

    if (action === 'make_payment') {
      if (!amount || amount <= 0) {
        return NextResponse.json(
          { error: 'Invalid payment amount' },
          { status: 400 }
        )
      }

      // Get current payments history
      const paymentsHistory = plan.paymentsHistory ? JSON.parse(plan.paymentsHistory) : []

      // Add new payment
      const newPayment = {
        id: `pay_${nanoid(8)}`,
        amount,
        date: new Date().toISOString(),
        reference: paymentReference,
        method: paymentMethod
      }
      paymentsHistory.push(newPayment)

      // Calculate new totals
      const newTotalPaid = plan.totalPaid + amount
      const newBalance = plan.totalAmount - newTotalPaid
      const newInstallmentsPaid = Math.floor(newTotalPaid / plan.installmentAmount)

      // Determine new status
      let newStatus = plan.status
      if (newBalance <= 0) {
        newStatus = 'completed'
      }

      // Calculate next due date
      const nextDueDate = calculateNextDueDate(plan.frequency, plan.installmentsPaid + 1)

      // Update plan
      const updatedPlan = await db.groSellLaybyPlan.update({
        where: { id: planId },
        data: {
          totalPaid: newTotalPaid,
          balanceAmount: Math.max(0, newBalance),
          installmentsPaid: newInstallmentsPaid,
          nextDueDate: newStatus === 'completed' ? null : nextDueDate,
          nextDueAmount: newStatus === 'completed' ? 0 : plan.installmentAmount,
          paymentsHistory: JSON.stringify(paymentsHistory),
          status: newStatus,
          updatedAt: new Date()
        }
      })

      // If completed, update order
      if (newStatus === 'completed' && plan.orderId) {
        await db.groSellOrder.update({
          where: { id: plan.orderId },
          data: {
            paymentStatus: 'paid',
            paidAt: new Date(),
            updatedAt: new Date()
          }
        })
      }

      return NextResponse.json({
        success: true,
        plan: updatedPlan,
        payment: newPayment,
        message: newStatus === 'completed' 
          ? 'Layby completed! Your items are ready for collection.'
          : 'Payment recorded successfully'
      })
    }

    if (action === 'cancel') {
      const { reason } = body

      // Calculate refund (total paid minus cancellation fee)
      const cancellationFeePercent = 10 // 10% cancellation fee
      const refundAmount = plan.totalPaid * (1 - cancellationFeePercent / 100)

      const updatedPlan = await db.groSellLaybyPlan.update({
        where: { id: planId },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancelReason: reason || 'Customer requested cancellation',
          refundAmount,
          itemsReserved: false,
          updatedAt: new Date()
        }
      })

      // Update order
      if (plan.orderId) {
        await db.groSellOrder.update({
          where: { id: plan.orderId },
          data: {
            status: 'cancelled',
            cancelledAt: new Date(),
            cancelReason: 'Layby plan cancelled',
            paymentStatus: 'partially_refunded',
            updatedAt: new Date()
          }
        })
      }

      return NextResponse.json({
        success: true,
        plan: updatedPlan,
        refundAmount,
        message: 'Layby cancelled. Refund will be processed within 5-7 business days.'
      })
    }

    if (action === 'calculate_plan') {
      const { totalAmount, depositPercent = 10, installmentCount = 6, frequency = 'weekly' } = body

      const depositAmount = totalAmount * (depositPercent / 100)
      const balanceAmount = totalAmount - depositAmount
      const installmentAmount = balanceAmount / installmentCount

      // Calculate end date
      const weeksPerPeriod = frequency === 'weekly' ? 1 : frequency === 'biweekly' ? 2 : 4
      const totalWeeks = installmentCount * weeksPerPeriod
      const endDate = new Date(Date.now() + totalWeeks * 7 * 24 * 60 * 60 * 1000)

      return NextResponse.json({
        success: true,
        calculation: {
          totalAmount,
          depositAmount,
          balanceAmount,
          installmentCount,
          installmentAmount,
          frequency,
          duration: `${totalWeeks} weeks`,
          endDate: endDate.toISOString().split('T')[0],
          schedule: generatePaymentSchedule(depositAmount, installmentAmount, installmentCount, frequency)
        }
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('GroSell Layby post error:', error)
    return NextResponse.json({ error: 'Failed to process Layby action' }, { status: 500 })
  }
}

// Helper: Calculate next due date
function calculateNextDueDate(frequency: string, installmentNumber: number): string {
  const now = new Date()
  const daysToAdd = frequency === 'weekly' ? 7 : frequency === 'biweekly' ? 14 : 30
  const nextDate = new Date(now.getTime() + installmentNumber * daysToAdd * 24 * 60 * 60 * 1000)
  return nextDate.toISOString().split('T')[0]
}

// Helper: Generate payment schedule
function generatePaymentSchedule(
  depositAmount: number,
  installmentAmount: number,
  installmentCount: number,
  frequency: string
): Array<{ paymentNumber: number; amount: number; dueDate: string }> {
  const schedule: Array<{ paymentNumber: number; amount: number; dueDate: string }> = []
  const now = new Date()
  const daysPerPeriod = frequency === 'weekly' ? 7 : frequency === 'biweekly' ? 14 : 30

  // Deposit
  schedule.push({
    paymentNumber: 0,
    amount: depositAmount,
    dueDate: now.toISOString().split('T')[0]
  })

  // Installments
  for (let i = 1; i <= installmentCount; i++) {
    const dueDate = new Date(now.getTime() + i * daysPerPeriod * 24 * 60 * 60 * 1000)
    schedule.push({
      paymentNumber: i,
      amount: installmentAmount,
      dueDate: dueDate.toISOString().split('T')[0]
    })
  }

  return schedule
}
