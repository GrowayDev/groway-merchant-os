import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomBytes } from 'crypto'

// Generate PayShap reference
function generatePayShapRef(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = randomBytes(6).toString('hex').toUpperCase()
  return `PS${timestamp}${random}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      userId, 
      proxyId, 
      proxyType, 
      amountCents, 
      reference,
      idempotencyKey: providedKey 
    } = body

    if (!userId || !proxyId || !amountCents) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate proxy type
    if (!['phone', 'id_number', 'email'].includes(proxyType || 'phone')) {
      return NextResponse.json(
        { success: false, error: 'Invalid proxy type' },
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

    // PayShap limits
    const minAmount = BigInt(100) // R1.00
    const maxAmount = BigInt(3000000) // R30,000 max for PayShap
    if (amount < minAmount || amount > maxAmount) {
      return NextResponse.json(
        { success: false, error: 'PayShap amount must be between R1.00 and R30,000' },
        { status: 400 }
      )
    }

    const idempotencyKey = providedKey || randomBytes(16).toString('hex')

    // Check for duplicate
    const existingTx = await db.consumerTransaction.findUnique({
      where: { idempotencyKey }
    })
    if (existingTx) {
      return NextResponse.json({
        success: true,
        data: { transactionId: existingTx.id, status: existingTx.status }
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

    // Check balance
    const feeCents = BigInt(250) // R2.50 PayShap fee
    const totalDebit = amount + feeCents

    if (sender.wallet.balanceCents < totalDebit) {
      return NextResponse.json(
        { success: false, error: 'Insufficient funds' },
        { status: 400 }
      )
    }

    // Look up recipient in PayShap registry (simulated)
    // In production, this would call the actual BankServ PayShap API
    let recipientName = 'Bank Account Holder'
    let recipientBank = 'Unknown Bank'

    // Check if we have this recipient cached
    const cachedRecipient = await db.payShapRecipient.findFirst({
      where: {
        proxyId,
        proxyType: proxyType || 'phone',
        verified: true
      }
    })

    if (cachedRecipient) {
      recipientName = cachedRecipient.accountHolderName || recipientName
      recipientBank = cachedRecipient.bankName || recipientBank
    }

    // Create transaction
    const payShapRef = generatePayShapRef()
    const transaction = await db.consumerTransaction.create({
      data: {
        idempotencyKey,
        userId: sender.id,
        transactionType: 'payshap_send',
        direction: 'debit',
        amountCents: amount,
        feeCents,
        netAmountCents: totalDebit,
        currency: 'ZAR',
        status: 'processing',
        description: 'PayShap Transfer',
        reference,
        category: 'transfer',
        counterpartyName: recipientName,
        counterpartyType: 'bank',
        paymentMethod: 'payshap',
        payShapRef,
        externalRef: payShapRef
      }
    })

    // Deduct from wallet
    await db.consumerWallet.update({
      where: { userId: sender.id },
      data: {
        balanceCents: { decrement: totalDebit },
        dailySpentCents: { increment: totalDebit },
        totalSentCents: { increment: amount }
      }
    })

    // Simulate PayShap processing (in production, call BankServ API)
    // For demo, we'll mark as completed immediately
    setTimeout(async () => {
      await db.consumerTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'completed',
          completedAt: new Date()
        }
      })
    }, 1000)

    return NextResponse.json({
      success: true,
      message: 'PayShap transfer initiated',
      data: {
        transactionId: transaction.id,
        payShapRef,
        amount: amount.toString(),
        fee: feeCents.toString(),
        recipient: {
          name: recipientName,
          bank: recipientBank,
          proxyId
        },
        status: 'processing',
        estimatedCompletion: '60 seconds'
      }
    })

  } catch (error) {
    console.error('PayShap error:', error)
    return NextResponse.json(
      { success: false, error: 'PayShap transfer failed' },
      { status: 500 }
    )
  }
}

// GET endpoint for PayShap lookup
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const proxyId = searchParams.get('proxyId')
    const proxyType = searchParams.get('proxyType') || 'phone'

    if (!proxyId) {
      return NextResponse.json(
        { success: false, error: 'Proxy ID required' },
        { status: 400 }
      )
    }

    // In production, this would query the BankServ PayShap proxy registry
    // For demo, we return simulated data
    const simulatedBanks = [
      'FNB', 'Standard Bank', 'Absa', 'Nedbank', 'Capitec', 
      'Investec', 'African Bank', 'TymeBank', 'Discovery Bank'
    ]
    
    const randomBank = simulatedBanks[Math.floor(Math.random() * simulatedBanks.length)]

    return NextResponse.json({
      success: true,
      data: {
        proxyId,
        proxyType,
        accountHolderName: 'Account Holder', // Would come from bank
        bankName: randomBank, // Would come from bank
        verified: true
      }
    })

  } catch (error) {
    console.error('PayShap lookup error:', error)
    return NextResponse.json(
      { success: false, error: 'Lookup failed' },
      { status: 500 }
    )
  }
}
