import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomBytes } from 'crypto'

// Generate MOMO reference
function generateMomoRef(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = randomBytes(4).toString('hex').toUpperCase()
  return `MOMO${timestamp}${random}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId, phone, amountCents, reference } = body

    // Link MOMO account
    if (action === 'link') {
      if (!userId || !phone) {
        return NextResponse.json(
          { success: false, error: 'User ID and phone required' },
          { status: 400 }
        )
      }

      // Check if already linked
      const existing = await db.mtnMomoAccount.findUnique({
        where: { userId }
      })

      if (existing) {
        return NextResponse.json(
          { success: false, error: 'MTN MOMO already linked' },
          { status: 400 }
        )
      }

      // Create MOMO account link
      const momoCustomerId = `momo_${randomBytes(8).toString('hex')}`
      
      await db.mtnMomoAccount.create({
        data: {
          id: `momo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          userId,
          phone,
          momoCustomerId,
          status: 'linked',
          linkedAt: new Date(),
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        message: 'MTN MOMO account linked successfully',
        data: {
          phone,
          status: 'linked'
        }
      })
    }

    // Push to MOMO (deposit to wallet from MOMO)
    if (action === 'push') {
      if (!userId || !amountCents) {
        return NextResponse.json(
          { success: false, error: 'User ID and amount required' },
          { status: 400 }
        )
      }

      const amount = BigInt(amountCents)
      if (amount <= 0) {
        return NextResponse.json(
          { success: false, error: 'Invalid amount' },
          { status: 400 }
        )
      }

      // Get MOMO account
      const momoAccount = await db.mtnMomoAccount.findUnique({
        where: { userId }
      })

      if (!momoAccount || momoAccount.status !== 'linked') {
        return NextResponse.json(
          { success: false, error: 'MTN MOMO not linked' },
          { status: 400 }
        )
      }

      // In production, call MTN MOMO API to initiate collection
      // POST to https://momodeveloper.mtn.com/collection/v1_0/requesttopay
      
      const momoRef = generateMomoRef()
      
      // Create pending transaction
      const transaction = await db.consumerTransaction.create({
        data: {
          id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          idempotencyKey: momoRef,
          userId,
          transactionType: 'topup',
          direction: 'credit',
          amountCents: amount,
          feeCents: BigInt(0),
          netAmountCents: amount,
          currency: 'ZAR',
          status: 'pending',
          updatedAt: new Date(),
          description: 'MTN MOMO Top-up',
          reference: reference || momoRef,
          category: 'topup',
          paymentMethod: 'mtn_momo',
          externalRef: momoRef
        }
      })

      return NextResponse.json({
        success: true,
        message: 'MOMO payment request sent. Check your phone to approve.',
        data: {
          transactionId: transaction.id,
          momoRef,
          amount: amount.toString(),
          status: 'pending',
          updatedAt: new Date(),
        }
      })
    }

    // Pull from MOMO (withdraw to MOMO)
    if (action === 'pull') {
      if (!userId || !amountCents) {
        return NextResponse.json(
          { success: false, error: 'User ID and amount required' },
          { status: 400 }
        )
      }

      const amount = BigInt(amountCents)
      if (amount <= 0) {
        return NextResponse.json(
          { success: false, error: 'Invalid amount' },
          { status: 400 }
        )
      }

      // Get user wallet
      const user = await db.consumerUser.findUnique({
        where: { id: userId },
      })
      const wallet = await db.consumerWallet.findUnique({ where: { userId } })

      if (!user || !wallet) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        )
      }

      // Check balance
      if (wallet.balanceCents < amount) {
        return NextResponse.json(
          { success: false, error: 'Insufficient funds' },
          { status: 400 }
        )
      }

      // Get MOMO account
      const momoAccount = await db.mtnMomoAccount.findUnique({
        where: { userId }
      })

      if (!momoAccount || momoAccount.status !== 'linked') {
        return NextResponse.json(
          { success: false, error: 'MTN MOMO not linked' },
          { status: 400 }
        )
      }

      // In production, call MTN MOMO API to initiate disbursement
      // POST to https://momodeveloper.mtn.com/disbursement/v1_0/transfer

      const momoRef = generateMomoRef()
      
      // Create transaction
      const transaction = await db.consumerTransaction.create({
        data: {
          id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          idempotencyKey: momoRef,
          userId,
          transactionType: 'withdrawal',
          direction: 'debit',
          amountCents: amount,
          feeCents: BigInt(0),
          netAmountCents: amount,
          currency: 'ZAR',
          status: 'pending',
          updatedAt: new Date(),
          description: 'Withdraw to MTN MOMO',
          reference: reference || momoRef,
          category: 'withdrawal',
          paymentMethod: 'mtn_momo',
          externalRef: momoRef
        }
      })

      // Deduct from wallet
      await db.consumerWallet.update({
        where: { userId },
        data: {
          balanceCents: { decrement: amount },
          totalWithdrawalsCents: { increment: amount }
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Withdrawal initiated to MTN MOMO',
        data: {
          transactionId: transaction.id,
          momoRef,
          amount: amount.toString(),
          status: 'pending'
        }
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('MTN MOMO error:', error)
    return NextResponse.json(
      { success: false, error: 'MTN MOMO operation failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      )
    }

    const momoAccount = await db.mtnMomoAccount.findUnique({
      where: { userId }
    })

    if (!momoAccount) {
      return NextResponse.json({
        success: true,
        data: {
          linked: false
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        linked: true,
        phone: momoAccount.phone,
        status: momoAccount.status,
        balance: momoAccount.balanceCents.toString(),
        linkedAt: momoAccount.linkedAt
      }
    })

  } catch (error) {
    console.error('Get MOMO account error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get MOMO account' },
      { status: 500 }
    )
  }
}
