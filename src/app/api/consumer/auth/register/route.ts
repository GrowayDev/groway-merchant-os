import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomBytes, createHash } from 'crypto'

// Generate OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Hash OTP for storage
function hashOTP(otp: string): string {
  return createHash('sha256').update(otp).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, firstName, lastName, email } = body

    // Validate phone number (E.164 format)
    if (!phone || !phone.match(/^\+27[0-9]{9}$/)) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number. Use format +27XXXXXXXXX' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db.consumerUser.findUnique({
      where: { phone }
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Phone number already registered' },
        { status: 400 }
      )
    }

    // Generate OTP
    const otp = generateOTP()
    const otpHash = hashOTP(otp)
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Create pending user (unverified)
    const user = await db.consumerUser.create({
      data: {
        phone,
        firstName: firstName || null,
        lastName: lastName || null,
        email: email || null,
        kycLevel: 0,
        kycStatus: 'pending',
        accountStatus: 'active',
      }
    })

    // Create wallet
    await db.consumerWallet.create({
      data: {
        userId: user.id,
        balanceCents: BigInt(0),
        reservedCents: BigInt(0),
        pendingCents: BigInt(0),
      }
    })

    // Create loyalty account
    await db.consumerLoyalty.create({
      data: {
        userId: user.id,
        tier: 'bronze',
        points: 0,
        totalEarned: 0,
        totalRedeemed: 0,
        tierProgress: 0,
      }
    })

    // Store OTP
    await db.otpVerification.create({
      data: {
        phone,
        otpCode: otpHash,
        purpose: 'register',
        expiresAt: otpExpiry,
      }
    })

    // TODO: Send OTP via SMS (integrate with SMS provider)
    // For development, we return the OTP in response
    console.log(`[DEV] OTP for ${phone}: ${otp}`)

    return NextResponse.json({
      success: true,
      message: 'Registration initiated. Please verify OTP.',
      data: {
        userId: user.id,
        phone: user.phone,
        expiresIn: 300, // 5 minutes
        // Remove otp in production
        ...(process.env.NODE_ENV === 'development' && { otp })
      }
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    )
  }
}
