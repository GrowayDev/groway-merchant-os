import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'

// Helper to verify password
function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':')
  if (!salt || !hash) return false
  const verifyHash = scryptSync(password, salt, 64).toString('hex')
  return timingSafeEqual(Buffer.from(hash), Buffer.from(verifyHash))
}

// Helper to generate session token
function generateToken(): string {
  return randomBytes(32).toString('hex')
}

// POST /api/supplier/auth/login - Supplier user login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, deviceName, deviceType } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Find user
    const user = await db.supplierUser.findUnique({
      where: { email },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            code: true,
            status: true,
            verificationStatus: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Check if account is locked
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      return NextResponse.json({ 
        error: 'Account is temporarily locked. Please try again later.' 
      }, { status: 423 })
    }

    // Check if user is active
    if (user.status !== 'active') {
      return NextResponse.json({ 
        error: 'Account is not active. Please contact your administrator.' 
      }, { status: 403 })
    }

    // Verify password
    if (!user.passwordHash || !verifyPassword(password, user.passwordHash)) {
      // Increment login attempts
      const newAttempts = user.loginAttempts + 1
      const updateData: any = { loginAttempts: newAttempts }
      
      // Lock account after 5 failed attempts for 30 minutes
      if (newAttempts >= 5) {
        const lockUntil = new Date()
        lockUntil.setMinutes(lockUntil.getMinutes() + 30)
        updateData.lockedUntil = lockUntil
      }
      
      await db.supplierUser.update({
        where: { id: user.id },
        data: updateData
      })

      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Generate session token
    const token = generateToken()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

    // Get IP and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Create session
    await db.supplierSession.create({
      data: {
        userId: user.id,
        token,
        deviceName,
        deviceType,
        ipAddress: ipAddress.toString(),
        userAgent,
        expiresAt
      }
    })

    // Update user login info
    await db.supplierUser.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        loginAttempts: 0,
        lockedUntil: null
      }
    })

    // Create audit log
    await db.supplierAuditLog.create({
      data: {
        supplierId: user.supplierId,
        userId: user.id,
        action: 'login',
        category: 'auth',
        description: `User logged in from ${deviceName || 'unknown device'}`,
        ipAddress: ipAddress.toString(),
        userAgent
      }
    })

    // Parse permissions
    const permissions = user.permissions ? JSON.parse(user.permissions) : []

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        status: user.status,
        avatar: user.avatar,
        jobTitle: user.jobTitle,
        department: user.department,
        permissions,
        twoFactorEnabled: user.twoFactorEnabled
      },
      supplier: user.supplier,
      session: {
        token,
        expiresAt
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}

// DELETE /api/supplier/auth/logout - Supplier user logout
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (token) {
      // Delete session
      await db.supplierSession.deleteMany({
        where: { token }
      })
    }

    return NextResponse.json({ message: 'Logged out successfully' })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
  }
}

// GET /api/supplier/auth/me - Get current user
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    // Find session
    const session = await db.supplierSession.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            supplier: {
              select: {
                id: true,
                name: true,
                code: true,
                status: true,
                verificationStatus: true,
                tier: true,
                rating: true
              }
            }
          }
        }
      }
    })

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }

    // Update last active
    await db.supplierSession.update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() }
    })

    const permissions = session.user.permissions ? JSON.parse(session.user.permissions) : []

    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        phone: session.user.phone,
        role: session.user.role,
        status: session.user.status,
        avatar: session.user.avatar,
        jobTitle: session.user.jobTitle,
        department: session.user.department,
        permissions,
        twoFactorEnabled: session.user.twoFactorEnabled
      },
      supplier: session.user.supplier
    })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json({ error: 'Authentication check failed' }, { status: 500 })
  }
}
