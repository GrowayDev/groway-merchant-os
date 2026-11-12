import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import * as bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

// Account lockout tracking (in-memory for simplicity, use Redis in production)
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>()

const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, pin, merchantCode } = body

    // PIN-based login (for terminal users)
    if (pin && merchantCode) {
      return await handlePinLogin(pin, merchantCode, request)
    }

    // Email/Password login
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check for account lockout
    const lockoutStatus = loginAttempts.get(email.toLowerCase())
    if (lockoutStatus && lockoutStatus.lockedUntil > Date.now()) {
      const remainingMinutes = Math.ceil((lockoutStatus.lockedUntil - Date.now()) / 60000)
      return NextResponse.json(
        { success: false, error: `Account locked. Try again in ${remainingMinutes} minutes.` },
        { status: 429 }
      )
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        merchantUsers: {
          where: { isActive: true },
          include: {
            merchant: true,
          },
        },
      },
    })

    if (!user || !user.passwordHash) {
      recordFailedAttempt(email.toLowerCase())
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash)
    if (!isValidPassword) {
      recordFailedAttempt(email.toLowerCase())
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Clear failed attempts on successful login
    loginAttempts.delete(email.toLowerCase())

    // Get the first merchant association (or let user select if multiple)
    const merchantUser = user.merchantUsers[0]
    if (!merchantUser) {
      return NextResponse.json(
        { success: false, error: 'No merchant account associated with this user' },
        { status: 403 }
      )
    }

    // Check merchant status
    if (merchantUser.merchant.status === 'suspended') {
      return NextResponse.json(
        { success: false, error: 'Merchant account is suspended' },
        { status: 403 }
      )
    }

    // Create session
    const sessionToken = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    await db.merchantSession.create({
      data: {
        userId: user.id,
        merchantId: merchantUser.merchantId,
        token: sessionToken,
        deviceType: 'web',
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        userAgent: request.headers.get('user-agent'),
        branchId: merchantUser.branchId,
        expiresAt,
      },
    })

    // Update merchant last login
    await db.merchant.update({
      where: { id: merchantUser.merchantId },
      data: { lastLoginAt: new Date() },
    })

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set('groway_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        phone: user.phone,
      },
      merchant: {
        id: merchantUser.merchant.id,
        code: merchantUser.merchant.code,
        name: merchantUser.merchant.name,
        tradingName: merchantUser.merchant.tradingName,
        vertical: merchantUser.merchant.vertical,
        subVertical: merchantUser.merchant.subVertical,
        logo: merchantUser.merchant.logo,
        currency: merchantUser.merchant.currency,
        vatRate: merchantUser.merchant.vatRate,
        vatRegistered: merchantUser.merchant.vatRegistered,
        plan: merchantUser.merchant.plan,
        planStatus: merchantUser.merchant.planStatus,
        status: merchantUser.merchant.status,
        onboardingComplete: merchantUser.merchant.onboardingComplete,
        onboardingStep: merchantUser.merchant.onboardingStep,
      },
      branchId: merchantUser.branchId,
      role: merchantUser.role,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'An error occurred during login' },
      { status: 500 }
    )
  }
}

async function handlePinLogin(pin: string, merchantCode: string, request: NextRequest) {
  // Find merchant by code
  const merchant = await db.merchant.findUnique({
    where: { code: merchantCode.toUpperCase() },
  })

  if (!merchant) {
    return NextResponse.json(
      { success: false, error: 'Invalid merchant code' },
      { status: 401 }
    )
  }

  // Find user by PIN within this merchant
  const merchantUser = await db.merchantUser.findFirst({
    where: {
      merchantId: merchant.id,
      isActive: true,
      user: {
        pinHash: { not: null },
      },
    },
    include: {
      user: true,
      merchant: true,
    },
  })

  if (!merchantUser || !merchantUser.user.pinHash) {
    return NextResponse.json(
      { success: false, error: 'Invalid PIN' },
      { status: 401 }
    )
  }

  // Verify PIN
  const isValidPin = await bcrypt.compare(pin, merchantUser.user.pinHash)
  if (!isValidPin) {
    return NextResponse.json(
      { success: false, error: 'Invalid PIN' },
      { status: 401 }
    )
  }

  // Create session
  const sessionToken = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000) // 8 hours for terminal sessions

  await db.merchantSession.create({
    data: {
      userId: merchantUser.userId,
      merchantId: merchant.id,
      token: sessionToken,
      deviceType: 'pos_terminal',
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
      userAgent: request.headers.get('user-agent'),
      branchId: merchantUser.branchId,
      expiresAt,
    },
  })

  // Set session cookie
  const cookieStore = await cookies()
  cookieStore.set('groway_session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  })

  return NextResponse.json({
    success: true,
    user: {
      id: merchantUser.user.id,
      email: merchantUser.user.email,
      name: merchantUser.user.name,
      avatar: merchantUser.user.avatar,
      phone: merchantUser.user.phone,
    },
    merchant: {
      id: merchant.id,
      code: merchant.code,
      name: merchant.name,
      tradingName: merchant.tradingName,
      vertical: merchant.vertical,
      subVertical: merchant.subVertical,
      logo: merchant.logo,
      currency: merchant.currency,
      vatRate: merchant.vatRate,
      vatRegistered: merchant.vatRegistered,
      plan: merchant.plan,
      planStatus: merchant.planStatus,
      status: merchant.status,
      onboardingComplete: merchant.onboardingComplete,
      onboardingStep: merchant.onboardingStep,
    },
    branchId: merchantUser.branchId,
    role: merchantUser.role,
  })
}

function recordFailedAttempt(email: string) {
  const current = loginAttempts.get(email) || { count: 0, lockedUntil: 0 }
  const newCount = current.count + 1
  
  if (newCount >= MAX_LOGIN_ATTEMPTS) {
    loginAttempts.set(email, {
      count: newCount,
      lockedUntil: Date.now() + LOCKOUT_DURATION,
    })
  } else {
    loginAttempts.set(email, { ...current, count: newCount })
  }
}
