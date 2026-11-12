/**
 * GroSell BNPL API
 * 
 * Buy Now, Pay Later - 2 installments, interest-free
 * SASSA beneficiary optimization
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const merchantId = searchParams.get('merchantId')
    const planId = searchParams.get('planId')
    const customerPhone = searchParams.get('customerPhone')
    const status = searchParams.get('status')

    if (planId) {
      const plan = await db.groSellBNPLPlan.findUnique({
        where: { id: planId },
        include: {
          GroSellOrder: true
        }
      })

      if (!plan) {
        return NextResponse.json({ error: 'BNPL plan not found' }, { status: 404 })
      }

      return NextResponse.json({ success: true, plan })
    }

    if (!merchantId) {
      return NextResponse.json({ error: 'Missing merchantId' }, { status: 400 })
    }

    const where: any = { merchantId }
    if (customerPhone) where.customerPhone = customerPhone
    if (status) where.status = status

    const plans = await db.groSellBNPLPlan.findMany({
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
    console.error('GroSell BNPL get error:', error)
    return NextResponse.json({ error: 'Failed to get BNPL plans' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      planId,
      action,
      installmentNumber,
      paymentReference,
      paymentMethod
    } = body

    if (!planId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: planId, action' },
        { status: 400 }
      )
    }

    const plan = await db.groSellBNPLPlan.findUnique({
      where: { id: planId },
      include: { GroSellOrder: true }
    })

    if (!plan) {
      return NextResponse.json({ error: 'BNPL plan not found' }, { status: 404 })
    }

    if (action === 'pay_installment') {
      if (!installmentNumber || ![1, 2].includes(installmentNumber)) {
        return NextResponse.json(
          { error: 'Invalid installment number (must be 1 or 2)' },
          { status: 400 }
        )
      }

      const updateData: any = { updatedAt: new Date() }
      const orderUpdateData: any = { updatedAt: new Date() }

      if (installmentNumber === 1) {
        updateData.firstPaidAt = new Date()
        updateData.firstPaymentRef = paymentReference
        updateData.status = 'partially_paid'
      } else {
        updateData.secondPaidAt = new Date()
        updateData.secondPaymentRef = paymentReference
        updateData.status = 'paid_in_full'
        orderUpdateData.paymentStatus = 'paid'
        orderUpdateData.paidAt = new Date()
      }

      // Update plan
      const updatedPlan = await db.groSellBNPLPlan.update({
        where: { id: planId },
        data: updateData
      })

      // Update order if fully paid
      if (updateData.status === 'paid_in_full') {
        await db.groSellOrder.update({
          where: { id: plan.orderId },
          data: orderUpdateData
        })
      }

      // Create transaction record
      await db.groCreditBNPLTransaction.create({
        data: {
          id: `txn_${nanoid(12)}`,
          applicationId: planId,
          merchantId: plan.merchantId,
          customerPhone: plan.customerPhone,
          orderId: plan.orderId,
          transactionType: 'repayment',
          amount: installmentNumber === 1 ? plan.firstInstallment : plan.secondInstallment,
          installmentNumber,
          totalInstallments: 2,
          paidAt: new Date(),
          paymentReference,
          paymentMethod,
          status: 'paid',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        plan: updatedPlan,
        message: `Installment ${installmentNumber} paid successfully`
      })
    }

    if (action === 'check_eligibility') {
      const { customerPhone, amount, isSassaBeneficiary, monthlyIncome } = body

      // Basic eligibility check
      const eligible = checkBNPLEligibility(amount, isSassaBeneficiary, monthlyIncome)

      return NextResponse.json({
        success: true,
        eligible: eligible.approved,
        reason: eligible.reason,
        maxAmount: eligible.maxAmount,
        suggestedInstallments: eligible.suggestedInstallments
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('GroSell BNPL post error:', error)
    return NextResponse.json({ error: 'Failed to process BNPL action' }, { status: 500 })
  }
}

// BNPL Eligibility Check (SASSA Optimized)
function checkBNPLEligibility(
  amount: number,
  isSassaBeneficiary: boolean = false,
  monthlyIncome?: number
): { approved: boolean; reason: string; maxAmount: number; suggestedInstallments: number[] } {
  // Minimum purchase for BNPL
  const MIN_BNPL_AMOUNT = 100
  
  // Maximum BNPL amounts
  const MAX_STANDARD = 5000
  const MAX_SASSA = 2000  // Lower for SASSA beneficiaries

  if (amount < MIN_BNPL_AMOUNT) {
    return {
      approved: false,
      reason: `Minimum purchase amount is R${MIN_BNPL_AMOUNT}`,
      maxAmount: 0,
      suggestedInstallments: []
    }
  }

  const maxAmount = isSassaBeneficiary ? MAX_SASSA : MAX_STANDARD

  if (amount > maxAmount) {
    return {
      approved: false,
      reason: `Maximum BNPL amount is R${maxAmount} for ${isSassaBeneficiary ? 'SASSA beneficiaries' : 'standard customers'}`,
      maxAmount,
      suggestedInstallments: []
    }
  }

  // For SASSA beneficiaries, we optimize for grant payment days
  if (isSassaBeneficiary) {
    // SASSA grants are typically paid on specific days of the month
    // We offer 2 installments aligned to grant payment dates
    return {
      approved: true,
      reason: 'Approved - Installments aligned to SASSA payment dates',
      maxAmount,
      suggestedInstallments: [
        Math.ceil(amount / 2),  // First installment (rounded up)
        Math.floor(amount / 2)  // Second installment (rounded down)
      ]
    }
  }

  // Standard eligibility
  if (monthlyIncome && monthlyIncome < amount * 0.5) {
    return {
      approved: false,
      reason: 'Insufficient income for this purchase amount',
      maxAmount: monthlyIncome * 2,
      suggestedInstallments: []
    }
  }

  return {
    approved: true,
    reason: 'Approved for 2 interest-free installments',
    maxAmount,
    suggestedInstallments: [
      Math.ceil(amount / 2),
      Math.floor(amount / 2)
    ]
  }
}
