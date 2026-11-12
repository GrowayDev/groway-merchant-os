import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomBytes, createHash } from 'crypto'
import { SignJWT } from 'jose'

// Hash PIN for comparison
function hashPIN(pin: string): string {
  return createHash('sha256').update(pin).digest('hex')
}

// Generate refresh token
function generateRefreshToken(): string {
  return randomBytes(32).toString('hex')
}

// JWT secret
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'groway-consumer-wallet-secret-key-2024'
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, pin, deviceId, deviceName, deviceType } = body

    if (!phone || !pin) {
      return NextResponse.json(
        { success: false, error: 'Phone and PIN are required' },
        { status: 400 }
      )
    }

    // Find user
    const user = await db.consumerUser.findUnique({
      where: { phone },
      include: {
        wallet: true,
        loyalty: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 401 }
      )
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60000
      )
      return NextResponse.json(
        { 
          success: false, 
          error: `Account locked. Try again in ${remainingMinutes} minutes.` 
        },
        { status: 401 }
      )
    }

    // Check if account is active
    if (user.accountStatus !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Account is not active' },
        { status: 401 }
      )
    }

    // Verify PIN
    const pinHash = hashPIN(pin)
    if (!user.pinHash || pinHash !== user.pinHash) {
      // Increment failed attempts
      const newAttempts = user.failedPinAttempts + 1
      
      if (newAttempts >= 5) {
        // Lock account for 30 minutes
        await db.consumerUser.update({
          where: { id: user.id },
          data: {
            failedPinAttempts: newAttempts,
            lockedUntil: new Date(Date.now() + 30 * 60 * 1000)
          }
        })
        
        return NextResponse.json(
          { success: false, error: 'Too many failed attempts. Account locked for 30 minutes.' },
          { status: 401 }
        )
      }

      await db.consumerUser.update({
        where: { id: user.id },
        data: { failedPinAttempts: newAttempts }
      })

      return NextResponse.json(
        { success: false, error: `Invalid PIN. ${5 - newAttempts} attempts remaining.` },
        { status: 401 }
      )
    }

    // Reset failed attempts on successful login
    await db.consumerUser.update({
      where: { id: user.id },
      data: { failedPinAttempts: 0, lockedUntil: null }
    })

    // Generate tokens
    const refreshToken = generateRefreshToken()
    const refreshTokenExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    // Create session
    const session = await db.consumerSession.create({
      data: {
        userId: user.id,
        deviceName: deviceName || 'Unknown',
        deviceType: deviceType || 'mobile',
        deviceId: deviceId || null,
        refreshToken,
        refreshTokenExpiry,
        status: 'active'
      }
    })

    // Generate JWT
    const accessToken = await new SignJWT({
      userId: user.id,
      phone: user.phone,
      kycLevel: user.kycLevel,
      sessionId: session.id
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET)

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        expiresIn: 86400, // 24 hours in seconds
        user: {
          id: user.id,
          phone: user.phone,
          firstName: user.firstName,
          lastName: user.lastName,
          kycLevel: user.kycLevel,
          kycStatus: user.kycStatus,
          accountStatus: user.accountStatus,
          languagePreference: user.languagePreference
        },
        wallet: {
          balanceCents: user.wallet?.balanceCents?.toString() || '0',
          currency: user.wallet?.currency || 'ZAR'
        },
        loyalty: {
          tier: user.loyalty?.tier || 'bronze',
          points: user.loyalty?.points || 0
        }
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    )
  }
}
