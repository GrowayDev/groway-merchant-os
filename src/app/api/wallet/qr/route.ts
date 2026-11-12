import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateReference, generateIdempotencyKey, generateQRData, type ApiResponse } from '@/lib/wallet-utils'

// GET - Get user's QR code
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'User ID is required'
      }, { status: 400 })
    }

    // Get user
    const user = await db.consumerUser.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    // Get existing static QR
    let qr = await db.consumerQR.findFirst({
      where: {
        userId,
        qrType: 'static',
        status: 'active'
      }
    })

    if (!qr) {
      // Create static QR
      const qrData = generateQRData(userId)
      qr = await db.consumerQR.create({
        data: {
          id: `qr_${Date.now()}`,
          userId,
          qrType: 'static',
          qrData,
          status: 'active'
        }
      })
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        id: qr.id,
        qrType: qr.qrType,
        qrData: qr.qrData,
        growayId: user.phone, // Use phone as Groway ID
        scanCount: qr.scanCount
      }
    })
  } catch (error) {
    console.error('Error fetching QR:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch QR code'
    }, { status: 500 })
  }
}

// POST - Scan QR or Generate dynamic QR
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId, qrData, amountCents, reference } = body

    if (!userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'User ID is required'
      }, { status: 400 })
    }

    switch (action) {
      case 'scan': {
        // Scan and process QR payment
        if (!qrData) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'QR data is required for scanning'
          }, { status: 400 })
        }

        // Parse QR data
        let parsedQR
        try {
          parsedQR = JSON.parse(Buffer.from(qrData, 'base64').toString())
        } catch {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Invalid QR code format'
          }, { status: 400 })
        }

        // Validate QR
        if (parsedQR.type !== 'groway_pay') {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Invalid QR code type'
          }, { status: 400 })
        }

        // Check if QR is expired (dynamic QRs expire)
        if (parsedQR.expiresAt && new Date(parsedQR.expiresAt) < new Date()) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'QR code has expired'
          }, { status: 400 })
        }

        // Get merchant/recipient info
        const recipient = await db.consumerUser.findUnique({
          where: { id: parsedQR.userId }
        })

        if (!recipient) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Recipient not found'
          }, { status: 404 })
        }

        // Update scan count on QR
        await db.consumerQR.updateMany({
          where: { qrData },
          data: {
            scanCount: { increment: 1 },
            lastScannedAt: new Date()
          }
        })

        return NextResponse.json<ApiResponse>({
          success: true,
          data: {
            recipientId: recipient.id,
            recipientName: `${recipient.firstName} ${recipient.lastName}`,
            recipientPhone: recipient.phone,
            amount: parsedQR.amount || null,
            reference: parsedQR.reference || null,
            requiresAmount: !parsedQR.amount
          }
        })
      }

      case 'generate': {
        // Generate dynamic QR for receiving payment
        if (!amountCents || amountCents <= 0) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Amount is required for dynamic QR'
          }, { status: 400 })
        }

        const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
        const dynamicQRData = generateQRData(userId, amountCents)
        const qrReference = reference || generateReference('QR')

        // Create dynamic QR
        const qr = await db.consumerQR.create({
          data: {
            id: `qr_${Date.now()}`,
            userId,
            qrType: 'dynamic',
            qrData: dynamicQRData,
            amountCents: BigInt(amountCents),
            reference: qrReference,
            expiresAt,
            status: 'active'
          }
        })

        return NextResponse.json<ApiResponse>({
          success: true,
          data: {
            id: qr.id,
            qrData: qr.qrData,
            amountCents: qr.amountCents,
            reference: qr.reference,
            expiresAt: qr.expiresAt
          }
        })
      }

      case 'pay': {
        // Confirm and pay scanned QR
        const { recipientId, amountCents: paymentAmount, note } = body

        if (!recipientId || !paymentAmount) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Recipient and amount are required'
          }, { status: 400 })
        }

        const idempotencyKey = generateIdempotencyKey()

        // Check for duplicate transaction
        const existingTx = await db.consumerTransaction.findUnique({
          where: { idempotencyKey }
        })

        if (existingTx) {
          return NextResponse.json<ApiResponse>({
            success: true,
            data: existingTx,
            transaction: {
              id: existingTx.id,
              reference: existingTx.reference || '',
              status: existingTx.status
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
        if (availableBalance < BigInt(paymentAmount)) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Insufficient funds'
          }, { status: 400 })
        }

        // Get recipient
        const recipient = await db.consumerUser.findUnique({
          where: { id: recipientId }
        })

        const txReference = generateReference('QR')

        // Create pending transaction
        const transaction = await db.consumerTransaction.create({
          data: {
            id: `txn_${Date.now()}`,
            idempotencyKey,
            userId,
            transactionType: 'send',
            direction: 'debit',
            amountCents: BigInt(paymentAmount),
            feeCents: BigInt(0),
            netAmountCents: BigInt(paymentAmount),
            status: 'pending',
            description: note || 'QR Payment',
            reference: txReference,
            counterpartyId: recipientId,
            counterpartyName: recipient ? `${recipient.firstName} ${recipient.lastName}` : recipientId,
            qrType: 'dynamic'
          }
        })

        // Reserve funds
        await db.consumerWallet.update({
          where: { userId },
          data: {
            reservedCents: { increment: BigInt(paymentAmount) }
          }
        })

        // Process payment (async)
        processQRPayment(transaction.id, userId, recipientId, paymentAmount)

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
      }

      default:
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Invalid action'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Error processing QR:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to process QR'
    }, { status: 500 })
  }
}

// Helper function to process QR payment
async function processQRPayment(
  transactionId: string,
  senderId: string,
  recipientId: string,
  amountCents: number
) {
  try {
    // Update to processing
    await db.consumerTransaction.update({
      where: { id: transactionId },
      data: { status: 'processing' }
    })

    // Deduct from sender
    await db.consumerWallet.update({
      where: { userId: senderId },
      data: {
        balanceCents: { decrement: BigInt(amountCents) },
        reservedCents: { decrement: BigInt(amountCents) },
        totalSentCents: { increment: BigInt(amountCents) }
      }
    })

    // Credit recipient
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
    }

    // Mark completed
    await db.consumerTransaction.update({
      where: { id: transactionId },
      data: {
        status: 'completed',
        completedAt: new Date()
      }
    })
  } catch (error) {
    console.error('Error processing QR payment:', error)
    await db.consumerTransaction.update({
      where: { id: transactionId },
      data: {
        status: 'failed',
        failedAt: new Date(),
        failureReason: 'Processing error'
      }
    })
  }
}
