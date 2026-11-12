import { NextRequest, NextResponse } from 'next/server'
import { sign } from 'jsonwebtoken'
import {
  getMerchantWithUser,
  verifyPassword,
  createSession,
  updateUserLoginInfo,
  updateMerchantLastLogin,
  updateFailedLoginAttempts
} from '@/lib/auth-hybrid'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

// POST /merchant-os/api/auth/login - Login with email and password (Hybrid)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, pin } = body

    if (!email || (!password && !pin)) {
      return NextResponse.json(
        { success: false, error: 'Email and password (or PIN) are required' },
        { status: 400 }
      )
    }

    // Get user with merchant info using hybrid auth
    const result = await getMerchantWithUser(email)

    if (!result || !result.user.passwordHash) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const { user, merchantUser, merchant, branch } = result

    // Check if account is locked
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      const remainingMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000)
      return NextResponse.json(
        { 
          success: false, 
          error: `Account locked. Try again in ${remainingMinutes} minutes.` 
        },
        { status: 403 }
      )
    }

    // Verify password or PIN
    let isValid = false
    if (pin && user.pinHash) {
      isValid = await verifyPassword(pin, user.pinHash)
    } else if (password && user.passwordHash) {
      isValid = await verifyPassword(password, user.passwordHash)
    }

    if (!isValid) {
      // Increment failed attempts
      const newAttempts = (user.loginAttempts || 0) + 1
      
      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        await updateFailedLoginAttempts(user.id, newAttempts, new Date(Date.now() + LOCKOUT_DURATION))
        
        return NextResponse.json(
          { 
            success: false, 
            error: 'Too many failed attempts. Account locked for 15 minutes.' 
          },
          { status: 403 }
        )
      }

      await updateFailedLoginAttempts(user.id, newAttempts)

      const attemptsLeft = MAX_LOGIN_ATTEMPTS - newAttempts
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid credentials. ${attemptsLeft} attempts remaining.` 
        },
        { status: 401 }
      )
    }

    // Generate session token
    const token = sign(
      { 
        userId: user.id, 
        merchantId: merchant.id,
        branchId: branch?.id,
        role: merchantUser.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Create session record using hybrid auth
    await createSession(
      user.id,
      token,
      request.headers.get('user-agent') || undefined,
      request.headers.get('x-forwarded-for')?.split(',')[0] || undefined
    )

    // Update user login info
    await updateUserLoginInfo(user.id)

    // Update merchant last login
    await updateMerchantLastLogin(merchant.id)

    // Build the response with user/merchant/token data
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: merchantUser.role
      },
      merchant: {
        id: merchant.id,
        code: merchant.code,
        name: merchant.name,
        tradingName: merchant.tradingName,
        vertical: merchant.vertical,
        subVertical: merchant.subVertical,
        logo: merchant.logo,
        onboardingComplete: merchant.onboardingComplete
      },
      branchId: branch?.id,
      token
    })

    // Set the session cookie so the proxy middleware recognises the user
    // on subsequent requests. The proxy checks `groway_session` on every
    // protected route (see src/proxy.ts line ~511).
    response.cookies.set('groway_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days, matches JWT expiry
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to login' },
      { status: 500 }
    )
  }
}
