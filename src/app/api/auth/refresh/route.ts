import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { verify, sign } from 'jsonwebtoken'
import { randomBytes } from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days
const EXTENSION_THRESHOLD = 24 * 60 * 60 * 1000 // Extend if less than 24 hours left

// Rate limiting - stricter for refresh
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000
const RATE_LIMIT_MAX = 20

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

// POST /api/auth/refresh - Refresh session token
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 'unknown'
    const rateLimit = checkRateLimit(ip)
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many refresh requests' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString()
          }
        }
      )
    }

    const cookieStore = await cookies()
    
    // Try multiple sources for session token
    const authHeader = request.headers.get('authorization')
    const currentToken = authHeader?.replace('Bearer ', '') || 
                         cookieStore.get('groway_session')?.value ||
                         cookieStore.get('auth_token')?.value

    if (!currentToken) {
      return NextResponse.json(
        { success: false, error: 'No session token provided' },
        { status: 401 }
      )
    }

    // Verify current token
    let decoded: { userId?: string; merchantId?: string; branchId?: string; role?: string }
    try {
      decoded = verify(currentToken, JWT_SECRET) as typeof decoded
    } catch (error) {
      // Token might be from database, not JWT
      const dbSession = await db.merchantSession.findFirst({
        where: { token: currentToken },
        include: { user: { include: { merchantUsers: true } } }
      })

      if (!dbSession) {
        return NextResponse.json(
          { success: false, error: 'Invalid session token' },
          { status: 401 }
        )
      }

      // Check if session is expired
      if (dbSession.expiresAt < new Date()) {
        await db.merchantSession.delete({ where: { id: dbSession.id } })
        return NextResponse.json(
          { success: false, error: 'Session expired' },
          { status: 401 }
        )
      }

      // Create decoded from database session
      const merchantUser = dbSession.user.merchantUsers.find(
        mu => mu.merchantId === dbSession.merchantId
      )
      
      decoded = {
        userId: dbSession.userId,
        merchantId: dbSession.merchantId,
        branchId: dbSession.branchId || undefined,
        role: merchantUser?.role
      }
    }

    // Find existing session
    const existingSession = await db.merchantSession.findFirst({
      where: {
        OR: [
          { token: currentToken },
          { userId: decoded.userId, merchantId: decoded.merchantId }
        ]
      },
      orderBy: { createdAt: 'desc' }
    })

    if (!existingSession) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 401 }
      )
    }

    // Check if session is still valid (not expired)
    if (existingSession.expiresAt < new Date()) {
      await db.merchantSession.delete({ where: { id: existingSession.id } })
      return NextResponse.json(
        { success: false, error: 'Session expired' },
        { status: 401 }
      )
    }

    // Check if session should be extended
    const timeUntilExpiry = existingSession.expiresAt.getTime() - Date.now()
    const shouldExtend = timeUntilExpiry < EXTENSION_THRESHOLD

    // Generate new token
    const newToken = sign(
      {
        userId: decoded.userId,
        merchantId: decoded.merchantId,
        branchId: decoded.branchId,
        role: decoded.role,
        sessionId: existingSession.id
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Calculate new expiry
    const newExpiresAt = new Date(Date.now() + SESSION_DURATION)

    // Update session
    const updatedSession = await db.merchantSession.update({
      where: { id: existingSession.id },
      data: {
        token: newToken,
        expiresAt: newExpiresAt,
        lastActiveAt: new Date(),
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || 
                   request.headers.get('x-real-ip') || existingSession.ipAddress,
        userAgent: request.headers.get('user-agent') || existingSession.userAgent
      }
    })

    // Set new session cookie
    cookieStore.set('groway_session', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: newExpiresAt,
      path: '/'
    })

    // Create audit log
    await db.auditLogEntry.create({
      data: {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: decoded.userId,
        action: shouldExtend ? 'session_extended' : 'token_refreshed',
        category: 'auth',
        targetType: 'session',
        targetId: existingSession.id,
        details: JSON.stringify({
          merchantId: decoded.merchantId,
          previousExpiry: existingSession.expiresAt.toISOString(),
          newExpiry: newExpiresAt.toISOString(),
          extended: shouldExtend
        }),
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || 
                   request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
        createdAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        token: newToken,
        expiresAt: newExpiresAt.toISOString(),
        extended: shouldExtend,
        message: shouldExtend 
          ? 'Session extended successfully' 
          : 'Token refreshed successfully'
      }
    }, {
      headers: {
        'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString()
      }
    })
  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to refresh token' },
      { status: 500 }
    )
  }
}
