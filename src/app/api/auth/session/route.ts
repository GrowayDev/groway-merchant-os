import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { verify } from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// Rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000
const RATE_LIMIT_MAX = 300 // Higher limit for session checks

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const record = rateLimitStore.get(ip)
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetTime: now + RATE_LIMIT_WINDOW }
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime }
  }
  
  record.count++
  return { allowed: true, remaining: RATE_LIMIT_MAX - record.count, resetTime: record.resetTime }
}

// GET /api/auth/session - Get current session with full context
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 'unknown'
    const rateLimit = checkRateLimit(ip)
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetTime.toString()
          }
        }
      )
    }

    const cookieStore = await cookies()
    
    // Try multiple sources for session token
    const authHeader = request.headers.get('authorization')
    let sessionToken = authHeader?.replace('Bearer ', '') || 
                       cookieStore.get('groway_session')?.value ||
                       cookieStore.get('auth_token')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, authenticated: false, error: 'No session token found' },
        { status: 401 }
      )
    }

    // Verify JWT if it's a JWT token
    let decoded: { userId?: string; merchantId?: string; sessionId?: string } | null = null
    try {
      decoded = verify(sessionToken, JWT_SECRET) as { userId?: string; merchantId?: string; sessionId?: string }
    } catch {
      // Not a JWT, try database lookup directly
    }

    // Find session in database
    const session = await db.merchantSession.findFirst({
      where: {
        OR: [
          { token: sessionToken },
          { id: decoded?.sessionId }
        ].filter(Boolean)
      },
      include: {
        user: {
          include: {
            merchantUsers: {
              where: { isActive: true },
              include: {
                merchant: {
                  include: {
                    branches: {
                      where: { isActive: true },
                      take: 10
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!session) {
      return NextResponse.json(
        { success: false, authenticated: false, error: 'Invalid session' },
        { status: 401 }
      )
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      await db.merchantSession.delete({ where: { id: session.id } })
      return NextResponse.json(
        { success: false, authenticated: false, error: 'Session expired' },
        { status: 401 }
      )
    }

    // Get merchant user
    const merchantUser = session.user.merchantUsers.find(
      mu => mu.merchantId === session.merchantId
    )

    if (!merchantUser) {
      return NextResponse.json(
        { success: false, authenticated: false, error: 'User not associated with merchant' },
        { status: 401 }
      )
    }

    // Update session last active
    await db.merchantSession.update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() }
    })

    // Get user's permissions
    const permissions = merchantUser.permissions 
      ? JSON.parse(merchantUser.permissions) 
      : getDefaultPermissions(merchantUser.role)

    const merchant = merchantUser.merchant
    const primaryBranch = merchant.branches?.find(b => b.id === session.branchId) || 
                          merchant.branches?.[0]

    return NextResponse.json({
      success: true,
      authenticated: true,
      data: {
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          avatar: session.user.avatar,
          phone: session.user.phone,
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
          coverImage: merchant.coverImage,
          status: merchant.status,
          plan: merchant.plan,
          planStatus: merchant.planStatus,
          onboardingComplete: merchant.onboardingComplete,
          onboardingStep: merchant.onboardingStep,
          settings: {
            currency: merchant.currency || 'ZAR',
            vatRate: merchant.vatRate || 15,
            vatRegistered: merchant.vatRegistered || false,
            posEnabled: merchant.posEnabled ?? true,
            onlineStoreEnabled: merchant.onlineStoreEnabled ?? false,
            bookingEnabled: merchant.bookingEnabled ?? false,
            deliveryEnabled: merchant.deliveryEnabled ?? false,
            loyaltyEnabled: merchant.loyaltyEnabled ?? true
          }
        },
        branch: primaryBranch ? {
          id: primaryBranch.id,
          name: primaryBranch.name,
          code: primaryBranch.code,
          type: primaryBranch.type,
          status: primaryBranch.isActive ? 'active' : 'inactive'
        } : null,
        permissions,
        session: {
          id: session.id,
          deviceType: session.deviceType,
          ipAddress: session.ipAddress,
          lastActiveAt: session.lastActiveAt,
          expiresAt: session.expiresAt
        }
      }
    }, {
      headers: {
        'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString(),
        'Cache-Control': 'no-store'
      }
    })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json(
      { success: false, authenticated: false, error: 'Failed to verify session' },
      { status: 500 }
    )
  }
}

// DELETE /api/auth/session - Logout (delete session)
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    
    // Try multiple sources for session token
    const authHeader = request.headers.get('authorization')
    const sessionToken = authHeader?.replace('Bearer ', '') || 
                         cookieStore.get('groway_session')?.value ||
                         cookieStore.get('auth_token')?.value

    if (sessionToken) {
      // Get session info before deleting for audit log
      const session = await db.merchantSession.findFirst({
        where: { token: sessionToken },
        select: { id: true, userId: true, merchantId: true }
      })

      if (session) {
        // Delete session
        await db.merchantSession.delete({ where: { id: session.id } })

        // Create audit log
        await db.auditLogEntry.create({
          data: {
            id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: session.userId,
            action: 'logout',
            category: 'auth',
            targetType: 'session',
            targetId: session.id,
            details: JSON.stringify({
              merchantId: session.merchantId,
              logoutAt: new Date().toISOString()
            }),
            ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || 
                       request.headers.get('x-real-ip'),
            userAgent: request.headers.get('user-agent'),
            createdAt: new Date()
          }
        })
      }
    }

    // Clear all session cookies
    cookieStore.delete('groway_session')
    cookieStore.delete('auth_token')

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })
  } catch (error) {
    console.error('Logout error:', error)
    // Still clear cookies even if there's an error
    const cookieStore = await cookies()
    cookieStore.delete('groway_session')
    cookieStore.delete('auth_token')
    
    return NextResponse.json({ success: true, message: 'Logged out' })
  }
}

function getDefaultPermissions(role: string): string[] {
  const rolePermissions: Record<string, string[]> = {
    owner: [
      'can_view_dashboard', 'can_view_reports', 'can_view_inventory',
      'can_manage_inventory', 'can_view_transactions', 'can_manage_transactions',
      'can_view_customers', 'can_manage_customers', 'can_view_staff',
      'can_manage_staff', 'can_view_settings', 'can_manage_settings',
      'can_process_payments', 'can_issue_refunds', 'can_view_analytics'
    ],
    manager: [
      'can_view_dashboard', 'can_view_reports', 'can_view_inventory',
      'can_manage_inventory', 'can_view_transactions', 'can_manage_transactions',
      'can_view_customers', 'can_manage_customers', 'can_view_staff',
      'can_process_payments', 'can_issue_refunds', 'can_view_analytics'
    ],
    staff: [
      'can_view_dashboard', 'can_view_inventory', 'can_view_transactions',
      'can_view_customers', 'can_process_payments'
    ],
    cashier: [
      'can_view_dashboard', 'can_view_transactions', 'can_process_payments'
    ]
  }

  return rolePermissions[role] || rolePermissions.staff
}
