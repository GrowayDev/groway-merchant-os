import { NextRequest, NextResponse } from 'next/server'
import { oauthConfig, generateOAuthState, storeOAuthState, isAppleOAuthConfigured, getBaseUrl } from '@/lib/oauth-config'

export async function GET(request: NextRequest) {
  try {
    // Check if Apple OAuth is configured
    if (!isAppleOAuthConfigured()) {
      // For demo/development, return a simulated response
      const devEmail = `apple.user.${Date.now()}@icloud.com`
      const devName = 'Apple User'
      
      // Redirect back to signup with pre-filled data
      const redirectUrl = request.nextUrl.searchParams.get('redirect') || '/merchant-os/signup'
      const planCode = request.nextUrl.searchParams.get('plan') || 'pro'
      
      const signupUrl = new URL('/merchant-os/signup', getBaseUrl())
      signupUrl.searchParams.set('plan', planCode)
      signupUrl.searchParams.set('oauth_provider', 'apple')
      signupUrl.searchParams.set('oauth_email', devEmail)
      signupUrl.searchParams.set('oauth_name', devName)
      
      return NextResponse.redirect(signupUrl.toString())
    }

    // Real OAuth flow
    const redirectUrl = request.nextUrl.searchParams.get('redirect') || '/merchant-os/signup'
    const planCode = request.nextUrl.searchParams.get('plan') || 'pro'
    
    // Generate state for CSRF protection
    const state = generateOAuthState()
    storeOAuthState(state, { provider: 'apple', redirectUrl })
    
    // Build authorization URL
    const callbackUrl = `${getBaseUrl()}/api/auth/oauth/apple/callback`
    const params = new URLSearchParams({
      client_id: oauthConfig.apple.clientId,
      redirect_uri: callbackUrl,
      response_type: 'code id_token',
      scope: 'email name',
      response_mode: 'form_post',
      state: state,
    })
    
    // Store plan code in a cookie for the callback
    const response = NextResponse.redirect(`${oauthConfig.apple.authorizeUrl}?${params.toString()}`)
    response.cookies.set('oauth_plan_code', planCode, { 
      maxAge: 600, // 10 minutes
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    })
    
    return response
  } catch (error) {
    console.error('Apple OAuth authorize error:', error)
    return NextResponse.redirect('/merchant-os/signup?error=oauth_failed')
  }
}
