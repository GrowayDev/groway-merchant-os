/**
 * Platform Authentication API
 * Unified authentication endpoint for all applications
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  loginConsumer,
  loginMerchant,
  loginAdmin,
  registerConsumer,
  registerMerchant,
  logout,
  getCurrentSession,
  switchTenant,
} from '@/lib/platform/auth-service'
import { getRateLimitHeaders, checkCombinedRateLimit } from '@/lib/platform/rate-limiter'
import { getTenantContext } from '@/lib/platform/tenant-context'

export async function GET(request: NextRequest) {
  try {
    // Get current session
    const session = await getCurrentSession()
    
    if (!session.user) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      )
    }
    
    // Get tenant context
    const tenant = await getTenantContext()
    
    return NextResponse.json({
      authenticated: true,
      user: session.user,
      tenant: session.tenant || tenant,
    })
  } catch (error) {
    console.error('Get session error:', error)
    return NextResponse.json(
      { error: 'Failed to get session' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userType, ...data } = body
    
    // Get tenant for rate limiting
    const tenant = await getTenantContext()
    const tenantId = tenant?.tenantId || 'anonymous'
    const plan = tenant?.plan || 'starter'
    
    // Check rate limit
    const rateLimit = checkCombinedRateLimit(tenantId, '/api/platform/auth', plan)
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
        { 
          status: 429,
          headers: getRateLimitHeaders(rateLimit),
        }
      )
    }
    
    let result
    
    switch (action) {
      case 'login':
        if (userType === 'consumer') {
          result = await loginConsumer(data.phone, data.pin)
        } else if (userType === 'merchant') {
          result = await loginMerchant(data.email, data.password)
        } else if (userType === 'admin') {
          result = await loginAdmin(data.email, data.password, data.mfaCode)
        } else {
          return NextResponse.json(
            { error: 'Invalid user type' },
            { status: 400 }
          )
        }
        break
      
      case 'register':
        if (userType === 'consumer') {
          result = await registerConsumer(data)
        } else if (userType === 'merchant') {
          result = await registerMerchant(data)
        } else {
          return NextResponse.json(
            { error: 'Invalid user type for registration' },
            { status: 400 }
          )
        }
        break
      
      case 'logout':
        result = await logout()
        break
      
      case 'switchTenant':
        result = await switchTenant(data.tenantId)
        break
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
    
    // Determine status code
    let statusCode = 200
    if (!result.success) {
      if (result.error?.includes('not found') || result.error?.includes('Invalid')) {
        statusCode = 401
      } else if (result.error?.includes('Rate limit') || result.error?.includes('limit')) {
        statusCode = 429
      } else {
        statusCode = 400
      }
    }
    
    const response = NextResponse.json(result, { status: statusCode })
    
    // Add rate limit headers
    Object.entries(getRateLimitHeaders(rateLimit)).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    
    // Set session cookie if login successful
    if (result.success && 'token' in result && result.token) {
      response.cookies.set('session_token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      })
      
      // Set tenant cookie if available
      if (result.tenant) {
        response.cookies.set('tenant_id', result.tenant.tenantId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60,
          path: '/',
        })
      }
    }
    
    return response
  } catch (error) {
    console.error('Auth API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
