import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createHash } from 'crypto'

// Hash OTP for comparison
function hashOTP(otp: string): string {
  return createHash('sha256').update(otp).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, otp, purpose } = body

    if (!phone || !otp) {
      return NextResponse.json(
        { success: false, error: 'Phone and OTP are required' },
        { status: 400 }
      )
    }

    // Find the most recent unused OTP for this phone and purpose
    const otpRecord = await db.otpVerification.findFirst({
      where: {
        phone,
        purpose: purpose || 'register',
        verified: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired OTP' },
        { status: 400 }
      )
    }

    // Check attempts
    if (otpRecord.attempts >= 5) {
      return NextResponse.json(
        { success: false, error: 'Too many attempts. Please request a new OTP.' },
        { status: 400 }
      )
    }

    // Verify OTP
    const otpHash = hashOTP(otp)
    if (otpHash !== otpRecord.otpCode) {
      // Increment attempts
      await db.otpVerification.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } }
      })
      
      return NextResponse.json(
        { success: false, error: 'Invalid OTP' },
        { status: 400 }
      )
    }

    // Mark OTP as verified
    await db.otpVerification.update({
      where: { id: otpRecord.id },
      data: {
        verified: true,
        verifiedAt: new Date()
      }
    })

    // Update user KYC level based on purpose
    if (purpose === 'register') {
      await db.consumerUser.update({
        where: { phone },
        data: {
          kycLevel: 1, // Phone + OTP verified
          kycStatus: 'verified'
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully'
    })

  } catch (error) {
    console.error('OTP verification error:', error)
    return NextResponse.json(
      { success: false, error: 'Verification failed' },
      { status: 500 }
    )
  }
}
