import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verify } from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// GET /merchant-os/api/auth/session - Get current session info
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, authenticated: false },
        { status: 401 }
      )
    }

    // Verify token
    let decoded: any
    try {
      decoded = verify(token, JWT_SECRET)
    } catch {
      return NextResponse.json(
        { success: false, authenticated: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Find session
    const session = await db.session.findFirst({
      where: {
        token,
        expiresAt: { gt: new Date() }
      },
      include: {
        user: {
          include: {
            merchantUsers: {
              where: { merchantId: decoded.merchantId },
              include: {
                merchant: {
                  include: {
                    branches: {
                      where: { status: 'active' },
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
        { success: false, authenticated: false, error: 'Session expired' },
        { status: 401 }
      )
    }

    const merchantUser = session.user.merchantUsers[0]

    if (!merchantUser?.merchant) {
      return NextResponse.json(
        { success: false, authenticated: false, error: 'Merchant not found' },
        { status: 401 }
      )
    }

    const merchant = merchantUser.merchant
    const primaryBranch = merchant.branches?.find((b: any) => b.id === decoded.branchId) 
      || merchant.branches?.[0]

    return NextResponse.json({
      success: true,
      authenticated: true,
      data: {
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
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
          onboardingComplete: merchant.onboardingComplete,
          onboardingStep: merchant.onboardingStep,
          status: merchant.status,
          plan: merchant.plan,
          planStatus: merchant.planStatus || 'trial',
          trialEndsAt: merchant.trialEndsAt,
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
          status: primaryBranch.status
        } : null,
        permissions: merchantUser.permissions ? JSON.parse(merchantUser.permissions) : []
      }
    })
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json(
      { success: false, authenticated: false, error: 'Failed to get session' },
      { status: 500 }
    )
  }
}

// DELETE /merchant-os/api/auth/session - Logout
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value

    if (token) {
      // Delete session
      await db.session.deleteMany({
        where: { token }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to logout' },
      { status: 500 }
    )
  }
}
