import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createHash } from 'crypto'

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
    const { phone, purpose } = body

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Rate limiting: Check if there are recent OTPs (max 5 per hour)
    const recentOtps = await db.otpVerification.count({
      where: {
        phone,
        createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) }
      }
    })

    if (recentOtps >= 5) {
      return NextResponse.json(
        { success: false, error: 'Too many OTP requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Generate OTP
    const otp = generateOTP()
    const otpHash = hashOTP(otp)
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Store OTP
    await db.otpVerification.create({
      data: {
        id: `otp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        phone,
        otpCode: otpHash,
        purpose: purpose || 'login',
        expiresAt: otpExpiry,
      }
    })

    // TODO: Send OTP via SMS (integrate with SMS provider like Twilio, Africa's Talking, etc.)
    // For development, we return the OTP in response
    console.log(`[DEV] OTP for ${phone}: ${otp}`)

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        expiresIn: 300, // 5 minutes
        // Remove otp in production
        ...(process.env.NODE_ENV === 'development' && { otp })
      }
    })

  } catch (error) {
    console.error('Send OTP error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send OTP' },
      { status: 500 }
    )
  }
}
