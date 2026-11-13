import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verify } from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

interface TokenPayload {
  userId: string
  merchantId: string
  branchId?: string
  role: string
  tenantId?: string
  iat?: number
  exp?: number
}

// Routes that don't require authentication
const publicRoutes = [
  '/',
  '/landing',
  '/merchant-os/login',
  '/merchant-os/signup',
  '/gopay',
  '/grosupply',
  '/grocredit',
  '/grocore',
  '/grocore/login',
  '/consumer-wallet',
  '/admin-console/login',
  '/enterprise/login',
  '/agent-network',
  '/myappoint',
  '/download',
  '/salesforce',
]

// Routes that require authentication but not onboarding
const authOnlyRoutes = [
  '/merchant-os/onboarding',
]

// API routes that don't require authentication (legitimately public)
const publicApiRoutes = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/qr-status',
  '/api/auth/oauth/', // Google/Apple OAuth routes
  '/api/auth/refresh',
  '/api/auth/otp',
  '/api/auth/pin',
  '/api/public/', // Public booking, etc.
  '/api/contact',
  '/api/docs', // API documentation
  '/api/download', // Document downloads
  '/api/download-pitch-deck',
  '/api/pitch-deck',
  '/api/platform/health',
  '/api/whatsapp/webhook', // Webhook endpoints
  '/api/grosell/webhook',
  '/api/merchant-os/payments/callback', // Payment callbacks
  '/merchant-os/api/auth/', // Merchant OS auth routes
  '/merchant-os/api/auto-seed', // Auto-seed for demo
  '/merchant-os/api/grocore/', // GroCore API (tenant-scoped via x-tenant-id header)
  '/api/subscription-plans', // Public for signup form - list plans only
  '/api/merchant-os/agriculture/', // Agriculture API (farm management)
]

// API routes that require authentication but allow dev mode bypass
const protectedApiRoutes = [
  // Consumer routes - require consumer auth
  '/api/consumer/',
  '/api/loyalty',
  '/api/send-money',
  '/api/airtime',
  '/api/bills',
  '/api/savings',
  '/api/transport',
  '/api/vouchers',
  '/api/qr',
  '/api/card',
  '/api/credit',
  '/api/bnpl',
  '/api/insurance',
  '/api/sassa',
  '/api/payplus',
  '/api/laybye',
  '/api/fraud',
  
  // Merchant routes - require merchant auth
  '/api/grosell/',
  '/api/grocredit/',
  '/api/gopay/',
  '/api/grosupply/',
  '/api/merchant-os/',
  '/api/inventory/',
  '/api/products/',
  '/api/branches/',
  '/api/categories/',
  '/api/notifications/',
  '/api/integrations/',
  '/api/reports/',
  '/api/enterprise/',
  '/api/users/',
  '/api/tenants/',
  '/api/reminders/',
  '/api/pricing/',
  '/api/transfers/',
  '/api/whatsapp/',
  '/api/merchants/',
  '/api/roles/',
  '/api/audit/',
  '/api/settlements/',
  '/api/subscription-plans/',
  
  // Platform routes - require platform auth
  '/api/platform/auth',
  '/api/platform/users',
  '/api/platform/tenants',
  '/api/platform/stats',
  '/api/platform/config',
  
  // Admin routes - require admin auth
  '/api/admin/',
  
  // Merchant OS internal APIs
  '/merchant-os/api/pos/',
  '/merchant-os/api/floorplan/',
  '/merchant-os/api/kitchen/',
  '/merchant-os/api/recipe-engine/',
  '/merchant-os/api/inventory/',
  '/merchant-os/api/products/',
  '/merchant-os/api/accounting/',
  '/merchant-os/api/grosupply/',
  '/merchant-os/api/customers/',
  '/merchant-os/api/reports/',
  '/merchant-os/api/dashboard/',
  '/merchant-os/api/staff/',
  '/merchant-os/api/booking/',
  '/merchant-os/api/couriers/',
  '/merchant-os/api/payments/',
  '/merchant-os/api/branches/',
  '/merchant-os/api/transfers/',
  '/merchant-os/api/locations/',
  '/merchant-os/api/hardware/',
  '/merchant-os/api/health-beauty/',
  '/merchant-os/api/hotel/',
  '/merchant-os/api/loyalty/',
  '/merchant-os/api/marketing/',
  '/merchant-os/api/whatsapp/',
  '/merchant-os/api/grocredit/',
  '/merchant-os/api/bank-feeds/',
  '/merchant-os/api/vat/',
  '/merchant-os/api/sars/',
  '/merchant-os/api/pricing/',
  '/merchant-os/api/floorplan/',
  '/merchant-os/api/merchants/',
  '/merchant-os/api/subscriptions/',
  '/merchant-os/api/budgets/',
  '/merchant-os/api/liquor-compliance/',
  '/merchant-os/api/pharmacy/',
  '/merchant-os/api/electronics/',
  '/merchant-os/api/fnb/',
  '/merchant-os/api/jax-ai/',
]

// Routes that require platform admin access
const platformAdminRoutes = [
  '/api/platform/tenants',
  '/api/admin/',
  '/api/platform/users',
  '/api/platform/stats',
  '/api/platform/config',
]

// Development bypass routes
const devBypassRoutes = [
  '/api/seed',
  '/api/seed-data',
  '/api/seed-demo',
  '/api/merchant-os/agriculture/',
]

// Role-based route access
const roleRoutes: Record<string, string[]> = {
  'owner': ['/merchant-os', '/admin-console', '/enterprise'],
  'admin': ['/merchant-os', '/admin-console'],
  'manager': ['/merchant-os'],
  'staff': ['/merchant-os'],
}

// Rate limiting configuration
const rateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute per IP
  authMaxRequests: 10, // Stricter limit for auth endpoints
}

// In-memory rate limit store (for production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

// Cleanup rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

function checkRateLimit(
  identifier: string,
  maxRequests: number = rateLimitConfig.maxRequests
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const resetAt = now + rateLimitConfig.windowMs
  const stored = rateLimitStore.get(identifier)

  if (!stored || stored.resetAt < now) {
    rateLimitStore.set(identifier, { count: 1, resetAt })
    return { allowed: true, remaining: maxRequests - 1, resetAt }
  }

  stored.count++
  return {
    allowed: stored.count <= maxRequests,
    remaining: Math.max(0, maxRequests - stored.count),
    resetAt: stored.resetAt,
  }
}

// Security headers - Note: X-Frame-Options and HSTS removed for Preview Panel compatibility
const securityHeaders: Record<string, string> = {
  'X-DNS-Prefetch-Control': 'on',
  'X-XSS-Protection': '1; mode=block',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(geolocation=())',
}

/**
 * Extract Bearer token from Authorization header
 */
function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  return authHeader.slice(7)
}

/**
 * Extract token from cookies as fallback
 */
function getTokenFromCookies(request: NextRequest): string | null {
  const sessionToken = request.cookies.get('session_token')?.value
  const authToken = request.cookies.get('auth_token')?.value
  return sessionToken || authToken || null
}

/**
 * Verify JWT token and extract payload
 */
function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = verify(token, JWT_SECRET) as TokenPayload
    return decoded
  } catch {
    return null
  }
}

/**
 * Check if a path matches any route in the list
 */
function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some(route => {
    if (route.endsWith('/')) {
      return pathname.startsWith(route)
    }
    return pathname === route || pathname.startsWith(route + '?')
  })
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isDevelopment = process.env.NODE_ENV === 'development'
  const response = NextResponse.next()
  
  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  // Allow Preview Panel iframe embedding - use permissive frame-ancestors
  response.headers.delete('Content-Security-Policy')
  response.headers.set(
    'Content-Security-Policy',
    "frame-ancestors *;"
  )
  
  // Get client IP for rate limiting
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  
  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/') || pathname.startsWith('/merchant-os/api/')) {
    // Stricter rate limit for auth endpoints
    const isAuthEndpoint = pathname.includes('/auth/login') || pathname.includes('/auth/register')
    const maxRequests = isAuthEndpoint ? rateLimitConfig.authMaxRequests : rateLimitConfig.maxRequests
    
    const rateLimitKey = `${clientIp}:${pathname.split('/').slice(0, 4).join('/')}`
    const rateLimit = checkRateLimit(rateLimitKey, maxRequests)
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', maxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString())
    response.headers.set('X-RateLimit-Reset', rateLimit.resetAt.toString())
    
    if (!rateLimit.allowed) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Too many requests. Please try again later.',
          code: 'RATE_LIMITED',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
            ...securityHeaders,
          },
        }
      )
    }
  }
  
  // Allow public routes
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    // Check if trying to access protected sub-route
    const isProtectedSubRoute = publicRoutes.some(route => 
      pathname.startsWith(route + '/app') || 
      pathname.startsWith(route + '/portal')
    )
    
    if (!isProtectedSubRoute) {
      return response
    }
  }
  
  // Allow public API routes
  if (publicApiRoutes.some(route => pathname.startsWith(route))) {
    return response
  }
  
  // Check if this is a protected API route
  const isProtectedApiRoute = protectedApiRoutes.some(route => pathname.startsWith(route))
  const isApiRoute = pathname.startsWith('/api/') || pathname.startsWith('/merchant-os/api/')
  
  // For protected API routes, validate authentication and inject tenant context
  if (isProtectedApiRoute || isApiRoute) {
    // Allow dev bypass routes in development mode
    if (isDevelopment && matchesRoute(pathname, devBypassRoutes)) {
      response.headers.set('x-dev-mode', 'true')
      return response
    }
    
    // Check for service-to-service headers (internal platform calls)
    const headerTenantId = request.headers.get('X-Tenant-ID')
    const headerMerchantId = request.headers.get('X-Merchant-ID')
    const headerUserId = request.headers.get('X-User-ID')
    const headerUserRole = request.headers.get('X-User-Role')
    
    if (headerTenantId && headerMerchantId && headerUserId) {
      // Internal service call - pass through with context
      response.headers.set('x-tenant-id', headerTenantId)
      response.headers.set('x-merchant-id', headerMerchantId)
      response.headers.set('x-user-id', headerUserId)
      response.headers.set('x-user-role', headerUserRole || 'member')
      response.headers.set('x-authenticated', 'true')
      return response
    }
    
    // Try to get token from Authorization header or cookies
    let token = extractBearerToken(request)
    if (!token) {
      token = getTokenFromCookies(request)
    }
    
    // Development mode bypass with dev header
    if (!token && isDevelopment) {
      const devBypass = request.headers.get('X-Dev-Bypass')
      if (devBypass === 'true') {
        const devMerchantId = request.headers.get('X-Dev-Merchant-ID') || 'merchant-001'
        response.headers.set('x-dev-mode', 'true')
        response.headers.set('x-merchant-id', devMerchantId)
        response.headers.set('x-warning', 'Development bypass active - not for production use')
        return response
      }
    }
    
    // No token - return 401 for API routes
    if (!token) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
          message: 'Please provide a valid Bearer token in the Authorization header'
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...securityHeaders,
          },
        }
      )
    }
    
    // Verify the token
    const payload = verifyToken(token)
    if (!payload) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Invalid or expired token',
          code: 'INVALID_TOKEN',
          message: 'The provided token is invalid or has expired. Please login again.'
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...securityHeaders,
          },
        }
      )
    }
    
    // Check if token is expired
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Token expired',
          code: 'TOKEN_EXPIRED',
          message: 'Your session has expired. Please login again.'
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...securityHeaders,
          },
        }
      )
    }
    
    // Check platform admin routes
    if (matchesRoute(pathname, platformAdminRoutes)) {
      if (payload.role !== 'platform_admin' && payload.role !== 'super_admin') {
        return new NextResponse(
          JSON.stringify({
            success: false,
            error: 'Platform admin access required',
            code: 'FORBIDDEN',
            message: 'This route requires platform administrator privileges'
          }),
          {
            status: 403,
            headers: {
              'Content-Type': 'application/json',
              ...securityHeaders,
            },
          }
        )
      }
    }
    
    // Inject authenticated user context headers
    response.headers.set('x-authenticated', 'true')
    response.headers.set('x-user-id', payload.userId)
    response.headers.set('x-merchant-id', payload.merchantId)
    response.headers.set('x-user-role', payload.role)
    
    if (payload.tenantId) {
      response.headers.set('x-tenant-id', payload.tenantId)
    }
    
    if (payload.branchId) {
      response.headers.set('x-branch-id', payload.branchId)
    }
    
    return response
  }
  
  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/images') ||
    pathname.includes('.') // Static files
  ) {
    return response
  }
  
  // Check for session token
  const sessionToken = request.cookies.get('groway_session')?.value
  
  // If no session, redirect to appropriate login
  if (!sessionToken) {
    const loginUrl = getLoginUrl(pathname, request)
    return NextResponse.redirect(loginUrl)
  }
  
  // For protected routes, let the request through
  // Actual session validation happens in API route handlers
  return response
}

function getLoginUrl(pathname: string, request: NextRequest) {
  const url = request.nextUrl.clone()
  
  // Determine which login page to redirect to
  if (pathname.startsWith('/admin-console')) {
    url.pathname = '/admin-console/login'
  } else if (pathname.startsWith('/enterprise')) {
    url.pathname = '/enterprise/login'
  } else if (pathname.startsWith('/consumer-wallet')) {
    url.pathname = '/consumer-wallet'
  } else if (pathname.startsWith('/grocore')) {
    url.pathname = '/grocore/login'
  } else if (pathname.startsWith('/merchant-os') || pathname.startsWith('/api/merchant-os')) {
    url.pathname = '/merchant-os/login'
  } else {
    url.pathname = '/merchant-os/login'
  }
  
  // Add redirect URL for post-login redirect
  if (pathname !== url.pathname) {
    url.searchParams.set('redirect', pathname)
  }
  
  return url
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
