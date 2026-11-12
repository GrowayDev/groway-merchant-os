import { NextRequest, NextResponse } from 'next/server'
import { oauthConfig, getOAuthState, isAppleOAuthConfigured, getBaseUrl } from '@/lib/oauth-config'
import { db } from '@/lib/db'
import { randomBytes } from 'crypto'
import * as jwt from 'jsonwebtoken'

// Generate Apple client secret (JWT)
function generateAppleClientSecret(): string {
  const { clientId, teamId, keyId, privateKey } = oauthConfig.apple
  
  const token = jwt.sign(
    {
      iss: teamId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 15777000, // 6 months
      aud: 'https://appleid.apple.com',
      sub: clientId,
    },
    privateKey.replace(/\\n/g, '\n'),
    {
      algorithm: 'ES256',
      header: {
        alg: 'ES256',
        kid: keyId,
      },
    }
  )
  
  return token
}

// Apple uses form_post, so we handle POST
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const code = formData.get('code') as string
    const idToken = formData.get('id_token') as string
    const state = formData.get('state') as string
    const error = formData.get('error') as string

    // Handle user denial or errors
    if (error) {
      console.error('Apple OAuth error:', error)
      return NextResponse.redirect(`${getBaseUrl()}/merchant-os/signup?error=${error}`)
    }

    if (!code || !state) {
      return NextResponse.redirect(`${getBaseUrl()}/merchant-os/signup?error=invalid_request`)
    }

    // Verify state
    const stateData = getOAuthState(state)
    if (!stateData || stateData.provider !== 'apple') {
      return NextResponse.redirect(`${getBaseUrl()}/merchant-os/signup?error=invalid_state`)
    }

    // Get plan code from cookie
    const planCode = request.cookies.get('oauth_plan_code')?.value || 'pro'

    // Check if Apple OAuth is configured
    if (!isAppleOAuthConfigured()) {
      // Development fallback
      const signupUrl = new URL('/merchant-os/signup', getBaseUrl())
      signupUrl.searchParams.set('plan', planCode)
      signupUrl.searchParams.set('oauth_provider', 'apple')
      signupUrl.searchParams.set('oauth_email', `dev.user.${Date.now()}@icloud.com`)
      signupUrl.searchParams.set('oauth_name', 'Dev User')
      return NextResponse.redirect(signupUrl.toString())
    }

    // Decode the ID token to get user info
    const decodedToken = jwt.decode(idToken) as { email?: string; sub?: string; email_verified?: boolean }
    const email = decodedToken?.email
    const appleUserId = decodedToken?.sub

    if (!email || !appleUserId) {
      return NextResponse.redirect(`${getBaseUrl()}/merchant-os/signup?error=no_email`)
    }

    // Exchange code for tokens (optional, mainly for refresh token)
    const callbackUrl = `${getBaseUrl()}/api/auth/oauth/apple/callback`
    try {
      const clientSecret = generateAppleClientSecret()
      await fetch(oauthConfig.apple.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: oauthConfig.apple.clientId,
          client_secret: clientSecret,
          code: code,
          redirect_uri: callbackUrl,
          grant_type: 'authorization_code',
        }),
      })
      // We don't strictly need the tokens for signup, so we continue even if this fails
    } catch (tokenError) {
      console.warn('Apple token exchange warning:', tokenError)
    }

    // Get user info from form data (Apple only provides name on first sign in)
    const userStr = formData.get('user') as string
    let name = 'Apple User'
    if (userStr) {
      try {
        const userData = JSON.parse(userStr)
        if (userData.name) {
          name = `${userData.name.firstName || ''} ${userData.name.lastName || ''}`.trim() || 'Apple User'
        }
      } catch {
        // Ignore JSON parse errors
      }
    }

    // Check if user already exists
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { authProvider: 'apple', authProviderId: appleUserId }
        ]
      },
      include: {
        MerchantUser: {
          include: { merchant: true, branch: true },
          take: 1,
        }
      }
    })

    if (existingUser && existingUser.MerchantUser.length > 0) {
      // User exists - log them in
      const merchantUser = existingUser.MerchantUser[0]
      
      // Create session
      const sessionToken = randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      await db.merchantSession.create({
        data: {
          userId: existingUser.id,
          merchantId: merchantUser.merchantId,
          token: sessionToken,
          deviceType: 'web',
          branchId: merchantUser.branchId,
          expiresAt,
        }
      })

      // Set session cookie and redirect to app
      const response = NextResponse.redirect(`${getBaseUrl()}/merchant-os/app`)
      response.cookies.set('groway_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: expiresAt,
        path: '/',
      })

      return response
    }

    // New user - redirect to signup with pre-filled data
    const signupUrl = new URL('/merchant-os/signup', getBaseUrl())
    signupUrl.searchParams.set('plan', planCode)
    signupUrl.searchParams.set('oauth_provider', 'apple')
    signupUrl.searchParams.set('oauth_email', email.toLowerCase())
    signupUrl.searchParams.set('oauth_name', name)
    signupUrl.searchParams.set('oauth_id', appleUserId)

    // Store OAuth data temporarily in cookies
    const response = NextResponse.redirect(signupUrl.toString())
    response.cookies.set('oauth_apple_id', appleUserId, { maxAge: 600, path: '/', httpOnly: true })

    return response
  } catch (error) {
    console.error('Apple OAuth callback error:', error)
    return NextResponse.redirect(`${getBaseUrl()}/merchant-os/signup?error=callback_failed`)
  }
}

// Also handle GET for redirect-based flow (fallback)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  // If we get here, Apple might be using redirect mode
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  
  if (code && state) {
    // Simulate form post handling
    return POST(new NextRequest(request.url, {
      method: 'POST',
      body: new URLSearchParams({ code, state }),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }))
  }
  
  return NextResponse.redirect(`${getBaseUrl()}/merchant-os/signup?error=invalid_request`)
}
