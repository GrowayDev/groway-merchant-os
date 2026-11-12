import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomBytes } from 'crypto'

// Generate QR data
function generateQRData(userId: string, amount?: string): string {
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
    const userId = searchParams.get('userId')
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
        userId,
        qrType: isDynamic ? 'dynamic' : 'static',
        qrData,
        amountCents: amount ? BigInt(amount) : null,
        expiresAt: isDynamic ? expiry : null
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
      const { recipientId, amountCents, note } = body

      if (!userId || !recipientId || !amountCents) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400 }
        )
      }

      // This would call the send payment API internally
      // For now, return success
      return NextResponse.json({
        success: true,
        message: 'QR payment would be processed',
        data: {
          recipientId,
          amount: amountCents,
          note
        }
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
