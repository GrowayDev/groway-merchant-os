import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomBytes } from 'crypto'

// Generate idempotency key
function generateIdempotencyKey(): string {
  return randomBytes(16).toString('hex')
}

// Generate transaction reference
function generateTxRef(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = randomBytes(4).toString('hex').toUpperCase()
  return `GWP${timestamp}${random}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      userId, 
      recipientPhone, 
      amountCents, 
      note, 
      idempotencyKey: providedKey 
    } = body

    if (!userId || !recipientPhone || !amountCents) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate amount
    const amount = BigInt(amountCents)
    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be greater than 0' },
        { status: 400 }
      )
    }

    const minAmount = BigInt(100) // R1.00 minimum
    const maxAmount = BigInt(100000000) // R1,000,000 maximum
    if (amount < minAmount || amount > maxAmount) {
      return NextResponse.json(
        { success: false, error: `Amount must be between R1.00 and R1,000,000` },
        { status: 400 }
      )
    }

    // Use provided idempotency key or generate one
    const idempotencyKey = providedKey || generateIdempotencyKey()

    // Check for duplicate transaction using idempotency key
    const existingTx = await db.consumerTransaction.findUnique({
      where: { idempotencyKey }
    })

    if (existingTx) {
      return NextResponse.json({
        success: true,
        message: 'Transaction already processed',
        data: {
          transactionId: existingTx.id,
          status: existingTx.status
        }
      })
    }

    // Get sender
    const sender = await db.consumerUser.findUnique({
      where: { id: userId },
      include: { wallet: true }
    })

    if (!sender || !sender.wallet) {
      return NextResponse.json(
        { success: false, error: 'Sender not found' },
        { status: 404 }
      )
    }

    // Check if sender account is active
    if (sender.accountStatus !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Account is not active' },
        { status: 400 }
      )
    }

    // Check balance
    const feeCents = BigInt(0) // Free P2P transfers
    const totalDebit = amount + feeCents

    if (sender.wallet.balanceCents < totalDebit) {
      return NextResponse.json(
        { success: false, error: 'Insufficient funds' },
        { status: 400 }
      )
    }

    // Check daily spend limit
    if (sender.wallet.dailySpendLimit && 
        sender.wallet.dailySpentCents + totalDebit > sender.wallet.dailySpendLimit) {
      return NextResponse.json(
        { success: false, error: 'Daily spend limit exceeded' },
        { status: 400 }
      )
    }

    // Find recipient
    const recipient = await db.consumerUser.findUnique({
      where: { phone: recipientPhone },
      include: { wallet: true }
    })

    if (!recipient) {
      return NextResponse.json(
        { success: false, error: 'Recipient not found. They need to register first.' },
        { status: 404 }
      )
    }

    if (recipient.id === sender.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot send to yourself' },
        { status: 400 }
      )
    }

    // Create transaction record
    const txRef = generateTxRef()
    
    const transaction = await db.consumerTransaction.create({
      data: {
        idempotencyKey,
        userId: sender.id,
        transactionType: 'p2p_send',
        direction: 'debit',
        amountCents: amount,
        feeCents,
        netAmountCents: totalDebit,
        currency: 'ZAR',
        status: 'pending',
        description: note || 'P2P Transfer',
        reference: txRef,
        category: 'transfer',
        counterpartyId: recipient.id,
        counterpartyName: `${recipient.firstName} ${recipient.lastName}`,
        counterpartyPhone: recipient.phone,
        counterpartyType: 'user',
        paymentMethod: 'wallet'
      }
    })

    // Update sender wallet
    await db.consumerWallet.update({
      where: { userId: sender.id },
      data: {
        balanceCents: { decrement: totalDebit },
        dailySpentCents: { increment: totalDebit },
        totalSentCents: { increment: amount }
      }
    })

    // Update recipient wallet
    await db.consumerWallet.update({
      where: { userId: recipient.id },
      data: {
        balanceCents: { increment: amount },
        totalReceivedCents: { increment: amount }
      }
    })

    // Create receive transaction for recipient
    await db.consumerTransaction.create({
      data: {
        idempotencyKey: `${idempotencyKey}-recv`,
        userId: recipient.id,
        transactionType: 'p2p_receive',
        direction: 'credit',
        amountCents: amount,
        feeCents: BigInt(0),
        netAmountCents: amount,
        currency: 'ZAR',
        status: 'completed',
        description: note || 'P2P Transfer',
        reference: txRef,
        category: 'transfer',
        counterpartyId: sender.id,
        counterpartyName: `${sender.firstName} ${sender.lastName}`,
        counterpartyPhone: sender.phone,
        counterpartyType: 'user',
        paymentMethod: 'wallet',
        completedAt: new Date()
      }
    })

    // Update original transaction to completed
    await db.consumerTransaction.update({
      where: { id: transaction.id },
      data: {
        status: 'completed',
        completedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Transfer successful',
      data: {
        transactionId: transaction.id,
        reference: txRef,
        amount: amount.toString(),
        fee: feeCents.toString(),
        recipient: {
          name: `${recipient.firstName} ${recipient.lastName}`,
          phone: recipient.phone
        },
        status: 'completed',
        completedAt: new Date()
      }
    })

  } catch (error) {
    console.error('Send money error:', error)
    return NextResponse.json(
      { success: false, error: 'Transfer failed' },
      { status: 500 }
    )
  }
}
