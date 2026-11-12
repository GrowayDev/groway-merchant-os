import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Use MerchantCredit instead of creditAccount
    const facility = await db.merchantCredit.findFirst({
      include: {
        transactions: {
          take: 20,
          orderBy: { createdAt: 'desc' }
        }
      }
    })
    
    if (!facility) {
      // Return default mock data if no facility exists
      return NextResponse.json({
        id: 'default',
        tier: 'business',
        facilityType: 'revolving',
        totalLimit: 150000,
        approvedLimit: 150000,
        usedCredit: 37500,
        availableCredit: 112500,
        interestRate: 15.25, // Repo + 7%
        status: 'active',
        creditScore: 78,
        rating: 'good',
        onTimePayments: 24,
        latePayments: 1,
        missedPayments: 0,
        transactions: [],
        utilizationRate: 25,
        paymentHistory: { onTime: 24, late: 1, missed: 0 },
        nextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        businessType: 'pty_ltd',
        ncaCompliant: true
      })
    }
    
    // Transform to match expected format
    return NextResponse.json({
      ...facility,
      totalLimit: facility.approvedLimit,
      usedCredit: facility.drawnAmount,
      utilizationRate: facility.approvedLimit > 0 
        ? Math.round((facility.drawnAmount / facility.approvedLimit) * 100) 
        : 0
    })
  } catch (error) {
    console.error('Error fetching GroCredit account:', error)
    return NextResponse.json({ error: 'Failed to fetch account' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const facility = await db.merchantCredit.findFirst()
    
    if (!facility) {
      return NextResponse.json({ error: 'No facility found' }, { status: 404 })
    }
    
    let newDrawnAmount = facility.drawnAmount
    let newAvailableCredit = facility.availableCredit
    
    if (body.type === 'draw') {
      const amount = parseFloat(body.amount)
      newDrawnAmount += amount
      newAvailableCredit -= amount
    }
    
    if (body.type === 'payment') {
      const amount = parseFloat(body.amount)
      newDrawnAmount = Math.max(0, facility.drawnAmount - amount)
      newAvailableCredit = Math.min(facility.approvedLimit, facility.availableCredit + amount)
    }
    
    // Create transaction record
    const transaction = await db.creditTransaction.create({
      data: {
        merchantCreditId: facility.id,
        type: body.type,
        amount: parseFloat(body.amount),
        balanceBefore: facility.drawnAmount,
        balanceAfter: newDrawnAmount,
        description: body.description || (body.type === 'draw' ? 'Credit draw' : 'Payment received')
      }
    })
    
    // Update facility
    const updated = await db.merchantCredit.update({
      where: { id: facility.id },
      data: {
        drawnAmount: newDrawnAmount,
        availableCredit: newAvailableCredit,
        lastDrawAt: body.type === 'draw' ? new Date() : facility.lastDrawAt,
        lastPaymentAt: body.type === 'payment' ? new Date() : facility.lastPaymentAt,
        activeDraws: body.type === 'draw' ? facility.activeDraws + 1 : facility.activeDraws
      }
    })
    
    return NextResponse.json({
      transaction,
      account: {
        ...updated,
        totalLimit: updated.approvedLimit,
        usedCredit: updated.drawnAmount,
        utilizationRate: updated.approvedLimit > 0 
          ? Math.round((updated.drawnAmount / updated.approvedLimit) * 100) 
          : 0
      }
    })
  } catch (error) {
    console.error('Error processing GroCredit transaction:', error)
    return NextResponse.json({ error: 'Failed to process transaction' }, { status: 500 })
  }
}
