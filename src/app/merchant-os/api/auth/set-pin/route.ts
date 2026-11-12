import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hash, compare } from 'bcryptjs'
import { verify } from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// POST /merchant-os/api/auth/set-pin - Set or update PIN for logged-in user
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Verify token
    let decoded: any
    try {
      decoded = verify(token, JWT_SECRET)
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { pin, currentPassword } = body

    // Validate PIN
    if (!pin || !/^\d{4,6}$/.test(pin)) {
      return NextResponse.json(
        { success: false, error: 'PIN must be 4-6 digits' },
        { status: 400 }
      )
    }

    // Get user
    const user = await db.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // If user has password, verify it for security
    if (user.passwordHash && currentPassword) {
      const isValid = await compare(currentPassword, user.passwordHash)
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: 'Invalid password' },
          { status: 401 }
        )
      }
    }

    // Hash and save PIN
    const pinHash = await hash(pin, 10)

    await db.user.update({
      where: { id: user.id },
      data: { pinHash }
    })

    return NextResponse.json({
      success: true,
      message: 'PIN set successfully'
    })
  } catch (error) {
    console.error('Set PIN error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to set PIN' },
      { status: 500 }
    )
  }
}
