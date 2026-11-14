import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomBytes } from 'crypto'

// Generate QR data
function generateQRData(userId: string, amount?: string | null): string {
  const data = {
    v: '1', // Version
    t: amount ? 'd' : 's', // Type: dynamic or static
    u: userId,
    a: amount ? parseInt(amount) : null,
    ts: Date.now()
  }
  return Buffer.from(JSON.stringify(data)).toString('base64url')
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || request.headers.get('x-user-id') || 'demo-consumer-user'
    const amount = searchParams.get('amount')
    const expiresIn = parseInt(searchParams.get('expiresIn') || '300') // 5 min default

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      )
    }

    // Get user
    const user = await db.consumerUser.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Determine QR type
    const isDynamic = !!amount
    const expiry = new Date(Date.now() + expiresIn * 1000)

    // Generate QR data
    const qrData = generateQRData(userId, amount)

    // Save QR to database
    const qr = await db.consumerQR.create({
      data: {
        id: `qr-${randomBytes(8).toString('hex')}`,
        userId,
        qrType: isDynamic ? 'dynamic' : 'static',
        qrData,
        amountCents: amount ? BigInt(amount) : null,
        expiresAt: isDynamic ? expiry : null,
        updatedAt: new Date(),
      }
    })

    // Generate QR image URL (would use a QR library in production)
    // For now, we return the data that can be rendered by frontend

    return NextResponse.json({
      success: true,
      data: {
        qrId: qr.id,
        qrType: qr.qrType,
        qrData,
        qrUrl: `groway://pay/${qrData}`, // Deep link format
        amount: amount || null,
        expiresIn: isDynamic ? expiresIn : null,
        expiresAt: isDynamic ? expiry : null,
        user: {
          name: `${user.firstName} ${user.lastName}`,
          phone: user.phone
        }
      }
    })

  } catch (error) {
    console.error('Generate QR error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate QR' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, qrData, userId, amount } = body

    // Scan QR
    if (action === 'scan') {
      if (!qrData) {
        return NextResponse.json(
          { success: false, error: 'QR data required' },
          { status: 400 }
        )
      }

      // Decode QR data
      try {
        const decoded = JSON.parse(Buffer.from(qrData, 'base64url').toString())
        
        // Get the user who generated this QR
        const qrOwner = await db.consumerUser.findUnique({
          where: { id: decoded.u }
        })

        if (!qrOwner) {
          return NextResponse.json(
            { success: false, error: 'Invalid QR code' },
            { status: 400 }
          )
        }

        // Check if dynamic QR has expired
        if (decoded.t === 'd' && decoded.ts) {
          const qrAge = Date.now() - decoded.ts
          if (qrAge > 60000) { // 60 seconds
            return NextResponse.json(
              { success: false, error: 'QR code has expired' },
              { status: 400 }
            )
          }
        }

        // Update QR scan count
        await db.consumerQR.updateMany({
          where: { qrData },
          data: {
            scanCount: { increment: 1 },
            lastScannedAt: new Date()
          }
        })

        return NextResponse.json({
          success: true,
          data: {
            recipient: {
              id: qrOwner.id,
              name: `${qrOwner.firstName} ${qrOwner.lastName}`,
              phone: qrOwner.phone
            },
            isFixedAmount: decoded.t === 'd',
            fixedAmount: decoded.a ? decoded.a.toString() : null,
            qrVersion: decoded.v
          }
        })

      } catch {
        return NextResponse.json(
          { success: false, error: 'Invalid QR code format' },
          { status: 400 }
        )
      }
    }

    // Pay QR
    if (action === 'pay') {
      const { recipientId, amountCents, note, qrId } = body

      if (!userId || !recipientId || !amountCents) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400 }
        )
      }

      const amount = BigInt(amountCents)
      if (amount <= 0) {
        return NextResponse.json(
          { success: false, error: 'Amount must be greater than 0' },
          { status: 400 }
        )
      }

      const idempotencyKey = body.idempotencyKey || randomBytes(16).toString('hex')

      // Idempotency check
      const existingTx = await db.consumerTransaction.findUnique({
        where: { idempotencyKey },
      })
      if (existingTx) {
        return NextResponse.json({
          success: true,
          message: 'QR payment already processed',
          data: { transactionId: existingTx.id, status: existingTx.status },
        })
      }

      // Look up the QR code (by qrId if provided, otherwise by decoded data)
      const qr = qrId
        ? await db.consumerQR.findUnique({ where: { id: qrId } })
        : qrData
          ? await db.consumerQR.findFirst({ where: { qrData }, orderBy: { createdAt: 'desc' } })
          : null

      if (!qr) {
        return NextResponse.json(
          { success: false, error: 'QR code not found' },
          { status: 404 }
        )
      }

      // Verify the recipient matches the QR owner
      if (qr.userId !== recipientId) {
        return NextResponse.json(
          { success: false, error: 'QR recipient mismatch' },
          { status: 400 }
        )
      }

      // Fetch the payer's wallet and the recipient (for naming)
      const [payer, recipient] = await Promise.all([
        db.consumerUser.findUnique({
          where: { id: userId },
          include: { ConsumerWallet: true },
        }),
        db.consumerUser.findUnique({
          where: { id: recipientId },
          select: { id: true, firstName: true, lastName: true, phone: true },
        }),
      ])
      if (!payer || !payer.ConsumerWallet) {
        return NextResponse.json(
          { success: false, error: 'Payer wallet not found' },
          { status: 404 }
        )
      }

      const recipientName = qr.merchantName || (recipient
        ? `${recipient.firstName ?? ''} ${recipient.lastName ?? ''}`.trim() || recipient.phone
        : recipientId)

      // If the QR has a fixed amount, validate the payer matches it
      if (qr.amountCents !== null && qr.amountCents > BigInt(0) && qr.amountCents !== amount) {
        return NextResponse.json(
          { success: false, error: `Amount must be exactly R${Number(qr.amountCents) / 100}` },
          { status: 400 }
        )
      }

      const feeCents = BigInt(0)
      const totalDebit = amount + feeCents
      if (payer.ConsumerWallet.balanceCents < totalDebit) {
        return NextResponse.json(
          { success: false, error: 'Insufficient funds' },
          { status: 400 }
        )
      }

      // Process in a single transaction:
      //  - debit the payer's wallet
      //  - credit the recipient's wallet (if it exists)
      //  - create a ConsumerTransaction row (direction='debit') for the payer
      //  - create a QRTransaction row
      //  - bump the QR scan count
      const reference = `QR${Date.now().toString(36).toUpperCase()}${randomBytes(2).toString('hex').toUpperCase()}`
      const receiptNumber = `RCP-${Date.now().toString(36).toUpperCase()}`
      const txId = `tx-${randomBytes(8).toString('hex')}`
      const qrTxId = `qrtx-${randomBytes(8).toString('hex')}`

      const transaction = await db.$transaction(async (tx) => {
        // Debit payer
        await tx.consumerWallet.update({
          where: { userId },
          data: {
            balanceCents: { decrement: totalDebit },
            totalSentCents: { increment: amount },
            updatedAt: new Date(),
          },
        })

        // Credit recipient if they have a wallet
        const recipientWallet = await tx.consumerWallet.findUnique({ where: { userId: recipientId } })
        if (recipientWallet) {
          await tx.consumerWallet.update({
            where: { userId: recipientId },
            data: {
              balanceCents: { increment: amount },
              totalReceivedCents: { increment: amount },
              updatedAt: new Date(),
            },
          })
        }

        // Payer-facing ledger entry
        const consumerTx = await tx.consumerTransaction.create({
          data: {
            id: txId,
            idempotencyKey,
            userId,
            transactionType: 'qr_payment',
            direction: 'debit',
            amountCents: amount,
            feeCents,
            netAmountCents: totalDebit,
            currency: 'ZAR',
            status: 'completed',
            description: note ? `QR Payment: ${note}` : 'QR Payment',
            reference,
            category: 'qr_pay',
            counterpartyId: recipientId,
            counterpartyName: recipientName,
            counterpartyType: qr.merchantId ? 'merchant' : 'consumer',
            paymentMethod: 'qr_code',
            qrType: qr!.qrType,
            merchantId: qr!.merchantId,
            merchantName: qr!.merchantName,
            externalRef: receiptNumber,
            completedAt: new Date(),
            updatedAt: new Date(),
          },
        })

        // QR-specific transaction row
        await tx.qRTransaction.create({
          data: {
            id: qrTxId,
            qrId: qr!.id,
            payerId: userId,
            payerName: `${payer.firstName ?? ''} ${payer.lastName ?? ''}`.trim() || null,
            payerPhone: payer.phone,
            payeeId: recipientId,
            amountCents: amount,
            tipAmountCents: BigInt(0),
            feeCents,
            netAmountCents: amount,
            currency: 'ZAR',
            transactionType: 'qr_payment',
            status: 'completed',
            paymentMethod: 'qr_code',
            reference,
            receiptNumber,
            completedAt: new Date(),
            updatedAt: new Date(),
          },
        })

        // Bump scan count
        await tx.consumerQR.update({
          where: { id: qr!.id },
          data: {
            scanCount: { increment: 1 },
            lastScannedAt: new Date(),
            updatedAt: new Date(),
          },
        })

        return consumerTx
      })

      return NextResponse.json({
        success: true,
        message: 'QR payment processed successfully',
        data: {
          transactionId: transaction.id,
          reference,
          receiptNumber,
          amountCents: amount.toString(),
          feeCents: feeCents.toString(),
          recipientId,
          note,
          status: transaction.status,
          createdAt: transaction.createdAt,
        },
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('QR operation error:', error)
    return NextResponse.json(
      { success: false, error: 'QR operation failed' },
      { status: 500 }
    )
  }
}
