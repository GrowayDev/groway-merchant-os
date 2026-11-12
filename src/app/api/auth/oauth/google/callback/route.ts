import { NextRequest, NextResponse } from 'next/server'
import { oauthConfig, getOAuthState, isGoogleOAuthConfigured, getBaseUrl } from '@/lib/oauth-config'
import { db } from '@/lib/db'
import { randomBytes } from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle user denial or errors
    if (error) {
      console.error('Google OAuth error:', error)
      return NextResponse.redirect(`${getBaseUrl()}/merchant-os/signup?error=${error}`)
    }

    if (!code || !state) {
      return NextResponse.redirect(`${getBaseUrl()}/merchant-os/signup?error=invalid_request`)
    }

    // Verify state
    const stateData = getOAuthState(state)
    if (!stateData || stateData.provider !== 'google') {
      return NextResponse.redirect(`${getBaseUrl()}/merchant-os/signup?error=invalid_state`)
    }

    // Get plan code from cookie
    const planCode = request.cookies.get('oauth_plan_code')?.value || 'pro'

    // Check if Google OAuth is configured
    if (!isGoogleOAuthConfigured()) {
      // Development fallback - should not reach here, but just in case
      const signupUrl = new URL('/merchant-os/signup', getBaseUrl())
      signupUrl.searchParams.set('plan', planCode)
      signupUrl.searchParams.set('oauth_provider', 'google')
      signupUrl.searchParams.set('oauth_email', `dev.user.${Date.now()}@gmail.com`)
      signupUrl.searchParams.set('oauth_name', 'Dev User')
      return NextResponse.redirect(signupUrl.toString())
    }

    // Exchange code for tokens
    const callbackUrl = `${getBaseUrl()}/api/auth/oauth/google/callback`
    const tokenResponse = await fetch(oauthConfig.google.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: oauthConfig.google.clientId,
        client_secret: oauthConfig.google.clientSecret,
        code: code,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Google token exchange failed:', errorText)
      return NextResponse.redirect(`${getBaseUrl()}/merchant-os/signup?error=token_exchange_failed`)
    }

    const tokenData = await tokenResponse.json()
    const { access_token, id_token } = tokenData

    // Get user info from Google
    const userInfoResponse = await fetch(oauthConfig.google.userInfoUrl, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    })

    if (!userInfoResponse.ok) {
      console.error('Failed to fetch Google user info')
      return NextResponse.redirect(`${getBaseUrl()}/merchant-os/signup?error=user_info_failed`)
    }

    const userInfo = await userInfoResponse.json()
    const { email, name, picture, sub: googleId } = userInfo

    if (!email) {
      return NextResponse.redirect(`${getBaseUrl()}/merchant-os/signup?error=no_email`)
    }

    // Check if user already exists
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { authProvider: 'google', authProviderId: googleId }
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
    signupUrl.searchParams.set('oauth_provider', 'google')
    signupUrl.searchParams.set('oauth_email', email.toLowerCase())
    signupUrl.searchParams.set('oauth_name', name || 'Google User')
    signupUrl.searchParams.set('oauth_id', googleId)
    if (picture) {
      signupUrl.searchParams.set('oauth_avatar', picture)
    }

    // Store OAuth data temporarily in cookies for form submission
    const response = NextResponse.redirect(signupUrl.toString())
    response.cookies.set('oauth_google_id', googleId, { maxAge: 600, path: '/', httpOnly: true })
    if (picture) {
      response.cookies.set('oauth_avatar', picture, { maxAge: 600, path: '/', httpOnly: true })
    }

    return response
  } catch (error) {
    console.error('Google OAuth callback error:', error)
    return NextResponse.redirect(`${getBaseUrl()}/merchant-os/signup?error=callback_failed`)
  }
}
