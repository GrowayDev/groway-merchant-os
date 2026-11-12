import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('groway_session')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'No session found' },
        { status: 401 }
      )
    }

    // Find session with user and merchant data
    const session = await db.merchantSession.findUnique({
      where: { token: sessionToken },
      include: {
        user: true,
        merchant: true,
      },
    })

    if (!session) {
      // Clear invalid session cookie
      cookieStore.delete('groway_session')
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      )
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      // Delete expired session
      await db.merchantSession.delete({ where: { id: session.id } })
      cookieStore.delete('groway_session')
      return NextResponse.json(
        { success: false, error: 'Session expired' },
        { status: 401 }
      )
    }

    // Get user's role in this merchant
    const merchantUser = await db.merchantUser.findFirst({
      where: {
        userId: session.userId,
        merchantId: session.merchantId,
        isActive: true,
      },
    })

    // Update session last active
    await db.merchantSession.update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() },
    })

    return NextResponse.json({
      success: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        avatar: session.user.avatar,
        phone: session.user.phone,
      },
      merchant: {
        id: session.merchant.id,
        code: session.merchant.code,
        name: session.merchant.name,
        tradingName: session.merchant.tradingName,
        vertical: session.merchant.vertical,
        subVertical: session.merchant.subVertical,
        logo: session.merchant.logo,
        currency: session.merchant.currency,
        vatRate: session.merchant.vatRate,
        vatRegistered: session.merchant.vatRegistered,
        plan: session.merchant.plan,
        planStatus: session.merchant.planStatus,
        status: session.merchant.status,
        onboardingComplete: session.merchant.onboardingComplete,
        onboardingStep: session.merchant.onboardingStep,
      },
      branchId: session.branchId,
      role: merchantUser?.role || 'staff',
    })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to verify session' },
      { status: 500 }
    )
  }
}
