import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateReference, generateIdempotencyKey, formatSAPhone, isValidSAPhone, type ApiResponse } from '@/lib/wallet-utils'

// GET - Get transfer history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'User ID is required'
      }, { status: 400 })
    }

    // Get user's transactions
    const transactions = await db.consumerTransaction.findMany({
      where: {
        userId,
        transactionType: { in: ['send', 'receive', 'transfer'] }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    // Get total count
    const total = await db.consumerTransaction.count({
      where: {
        userId,
        transactionType: { in: ['send', 'receive', 'transfer'] }
      }
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        transactions,
        total,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('Error fetching transfer history:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch transfer history'
    }, { status: 500 })
  }
}

// POST - Send money
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      recipientType, // phone, email, qr, beneficiary
      recipientIdentifier,
      amountCents,
      note,
      idempotencyKey = generateIdempotencyKey()
    } = body

    // Validation
    if (!userId || !recipientType || !recipientIdentifier || !amountCents) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 })
    }

    if (amountCents <= 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Amount must be greater than zero'
      }, { status: 400 })
    }

    // Check idempotency
    const existingTransaction = await db.consumerTransaction.findUnique({
      where: { idempotencyKey }
    })

    if (existingTransaction) {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: existingTransaction,
        transaction: {
          id: existingTransaction.id,
          reference: existingTransaction.reference || '',
          status: existingTransaction.status
        }
      })
    }

    // Get sender's wallet
    const wallet = await db.consumerWallet.findUnique({
      where: { userId }
    })

    if (!wallet) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Wallet not found'
      }, { status: 404 })
    }

    // Check balance
    const availableBalance = wallet.balanceCents - wallet.reservedCents
    if (availableBalance < BigInt(amountCents)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Insufficient funds'
      }, { status: 400 })
    }

    // Find or create recipient
    let recipientId: string | null = null
    let recipientName = recipientIdentifier
    let recipientPhone: string | null = null

    switch (recipientType) {
      case 'phone': {
        const formattedPhone = formatSAPhone(recipientIdentifier)
        if (!isValidSAPhone(formattedPhone)) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Invalid phone number'
          }, { status: 400 })
        }
        const recipient = await db.consumerUser.findUnique({
          where: { phone: formattedPhone }
        })
        if (recipient) {
          recipientId = recipient.id
          recipientName = recipient.firstName ? `${recipient.firstName} ${recipient.lastName || ''}` : formattedPhone
        }
        recipientPhone = formattedPhone
        break
      }
      case 'email': {
        const recipient = await db.consumerUser.findFirst({
          where: { email: recipientIdentifier.toLowerCase() }
        })
        if (recipient) {
          recipientId = recipient.id
          recipientName = recipient.firstName ? `${recipient.firstName} ${recipient.lastName || ''}` : recipientIdentifier
          recipientPhone = recipient.phone
        }
        break
      }
      case 'beneficiary': {
        const beneficiary = await db.beneficiary.findFirst({
          where: {
            id: recipientIdentifier,
            userId
          }
        })
        if (!beneficiary) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Beneficiary not found'
          }, { status: 404 })
        }
        recipientId = beneficiary.id
        recipientName = beneficiary.name
        recipientPhone = beneficiary.identifier
        break
      }
      case 'qr': {
        // Parse QR data
        try {
          const qrData = JSON.parse(Buffer.from(recipientIdentifier, 'base64').toString())
          if (qrData.userId) {
            const recipient = await db.consumerUser.findUnique({
              where: { id: qrData.userId }
            })
            if (recipient) {
              recipientId = recipient.id
              recipientName = recipient.firstName ? `${recipient.firstName} ${recipient.lastName || ''}` : recipient.phone
              recipientPhone = recipient.phone
            }
          }
        } catch {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Invalid QR code'
          }, { status: 400 })
        }
        break
      }
    }

    // Generate reference
    const reference = generateReference('SEND')

    // Create pending transaction
    const transaction = await db.consumerTransaction.create({
      data: {
        id: `txn_${Date.now()}`,
        idempotencyKey,
        userId,
        transactionType: 'send',
        direction: 'debit',
        amountCents: BigInt(amountCents),
        feeCents: BigInt(0),
        netAmountCents: BigInt(amountCents),
        status: 'pending',
        description: note || 'Money transfer',
        reference,
        counterpartyId: recipientId,
        counterpartyName: recipientName,
        counterpartyPhone: recipientPhone,
        counterpartyType: recipientType
      }
    })

    // Reserve funds
    await db.consumerWallet.update({
      where: { userId },
      data: {
        reservedCents: { increment: BigInt(amountCents) }
      }
    })

    // Process transaction (simulate processing)
    // In production, this would go through payment gateway
    setTimeout(async () => {
      try {
        // Update transaction to processing
        await db.consumerTransaction.update({
          where: { id: transaction.id },
          data: { status: 'processing' }
        })

        // Deduct from sender's wallet
        await db.consumerWallet.update({
          where: { userId },
          data: {
            balanceCents: { decrement: BigInt(amountCents) },
            reservedCents: { decrement: BigInt(amountCents) },
            totalSentCents: { increment: BigInt(amountCents) }
          }
        })

        // If recipient is in the system, credit their wallet
        if (recipientId) {
          const recipientWallet = await db.consumerWallet.findUnique({
            where: { userId: recipientId }
          })
          if (recipientWallet) {
            await db.consumerWallet.update({
              where: { userId: recipientId },
              data: {
                balanceCents: { increment: BigInt(amountCents) },
                totalReceivedCents: { increment: BigInt(amountCents) }
              }
            })

            // Create receive transaction for recipient
            await db.consumerTransaction.create({
              data: {
                id: `txn_${Date.now()}_rcv`,
                idempotencyKey: `${idempotencyKey}_rcv`,
                userId: recipientId,
                transactionType: 'receive',
                direction: 'credit',
                amountCents: BigInt(amountCents),
                feeCents: BigInt(0),
                netAmountCents: BigInt(amountCents),
                status: 'completed',
                description: note || 'Money received',
                reference: `RCV${reference.slice(4)}`,
                counterpartyId: userId,
                counterpartyName: 'You',
                counterpartyPhone: null,
                completedAt: new Date()
              }
            })
          }
        }

        // Mark sender transaction as completed
        await db.consumerTransaction.update({
          where: { id: transaction.id },
          data: {
            status: 'completed',
            completedAt: new Date()
          }
        })
      } catch (err) {
        console.error('Error processing transaction:', err)
        // Mark as failed
        await db.consumerTransaction.update({
          where: { id: transaction.id },
          data: {
            status: 'failed',
            failedAt: new Date(),
            failureReason: 'Processing error'
          }
        })
        // Release reserved funds
        await db.consumerWallet.update({
          where: { userId },
          data: {
            reservedCents: { decrement: BigInt(amountCents) }
          }
        })
      }
    }, 2000) // 2 second processing delay

    return NextResponse.json<ApiResponse>({
      success: true,
      data: transaction,
      transaction: {
        id: transaction.id,
        reference: transaction.reference || '',
        status: transaction.status,
        confirmationUrl: `/wallet/confirmation/${transaction.id}`
      }
    })
  } catch (error) {
    console.error('Error sending money:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to send money'
    }, { status: 500 })
  }
}
