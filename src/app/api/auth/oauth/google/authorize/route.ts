import { NextRequest, NextResponse } from 'next/server'
import { oauthConfig, generateOAuthState, storeOAuthState, isGoogleOAuthConfigured, getBaseUrl } from '@/lib/oauth-config'

export async function GET(request: NextRequest) {
  try {
    // Check if Google OAuth is configured
    if (!isGoogleOAuthConfigured()) {
      // For demo/development, return a simulated response
      const devEmail = `google.user.${Date.now()}@gmail.com`
      const devName = 'Google User'
      
      // Redirect back to signup with pre-filled data
      const redirectUrl = request.nextUrl.searchParams.get('redirect') || '/merchant-os/signup'
      const planCode = request.nextUrl.searchParams.get('plan') || 'pro'
      
      const signupUrl = new URL('/merchant-os/signup', getBaseUrl())
      signupUrl.searchParams.set('plan', planCode)
      signupUrl.searchParams.set('oauth_provider', 'google')
      signupUrl.searchParams.set('oauth_email', devEmail)
      signupUrl.searchParams.set('oauth_name', devName)
      
      return NextResponse.redirect(signupUrl.toString())
    }

    // Real OAuth flow
    const redirectUrl = request.nextUrl.searchParams.get('redirect') || '/merchant-os/signup'
    const planCode = request.nextUrl.searchParams.get('plan') || 'pro'
    
    // Generate state for CSRF protection
    const state = generateOAuthState()
    storeOAuthState(state, { provider: 'google', redirectUrl })
    
    // Build authorization URL
    const callbackUrl = `${getBaseUrl()}/api/auth/oauth/google/callback`
    const params = new URLSearchParams({
      client_id: oauthConfig.google.clientId,
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope: oauthConfig.google.scopes.join(' '),
      state: state,
      access_type: 'offline',
      prompt: 'select_account',
    })
    
    // Store plan code in a cookie for the callback
    const response = NextResponse.redirect(`${oauthConfig.google.authorizeUrl}?${params.toString()}`)
    response.cookies.set('oauth_plan_code', planCode, { 
      maxAge: 600, // 10 minutes
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    })
    
    return response
  } catch (error) {
    console.error('Google OAuth authorize error:', error)
    return NextResponse.redirect('/merchant-os/signup?error=oauth_failed')
  }
}
