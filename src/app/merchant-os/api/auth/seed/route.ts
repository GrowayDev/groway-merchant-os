import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hash } from 'bcryptjs'

// POST /merchant-os/api/auth/seed - Create demo users (DISABLED IN PRODUCTION)
// Demo credentials have been removed for security. Users must register with their own email.
export async function POST(request: NextRequest) {
  try {
    // Always disable in production - no demo users
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: 'Demo seeding is disabled in production. Please register a new account.' },
        { status: 403 }
      )
    }

    // Require a secret key for development seeding
    const secretKey = request.headers.get('x-seed-key')
    if (secretKey !== process.env.SEED_SECRET && process.env.SEED_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const passwordHash = await hash('demo1234', 10)
    const pinHash = await hash('1234', 10)

    const demoUsers = [
      {
        email: 'demo@groway.co.za',
        name: 'Demo Coffee Shop',
        phone: '+27111111111',
        businessName: 'Coffee Shop Demo',
        tradingName: 'Demo Coffee Shop',
        vertical: 'fnb',
        subVertical: 'Coffee Shop',
        city: 'Johannesburg',
        province: 'Gauteng',
      },
      {
        email: 'salon@groway.co.za',
        name: 'Demo Hair Salon',
        phone: '+27222222222',
        businessName: 'Hair Salon Demo',
        tradingName: 'Demo Hair Salon',
        vertical: 'health-beauty',
        subVertical: 'Hair Salon',
        city: 'Cape Town',
        province: 'Western Cape',
      },
      {
        email: 'restaurant@groway.co.za',
        name: 'Demo Restaurant',
        phone: '+27333333333',
        businessName: 'Restaurant Demo',
        tradingName: 'Demo Restaurant & Bar',
        vertical: 'fnb',
        subVertical: 'Sit-down Restaurant',
        city: 'Durban',
        province: 'KwaZulu-Natal',
      },
      {
        email: 'spaza@groway.co.za',
        name: 'Demo Spaza Shop',
        phone: '+27444444444',
        businessName: 'Spaza Shop Demo',
        tradingName: 'Demo Spaza',
        vertical: 'grocery_fmcg',
        subVertical: 'Spaza Shop',
        city: 'Soweto',
        province: 'Gauteng',
      },
      {
        email: 'barber@groway.co.za',
        name: 'Demo Barber',
        phone: '+27555555555',
        businessName: 'Barber Shop Demo',
        tradingName: 'Demo Barber',
        vertical: 'health-beauty',
        subVertical: 'Barber',
        city: 'Pretoria',
        province: 'Gauteng',
      },
    ]

    const results = []

    for (const demo of demoUsers) {
      // Check if exists
      const existing = await db.user.findUnique({
        where: { email: demo.email }
      })

      if (existing) {
        // Update PIN if exists
        await db.user.update({
          where: { id: existing.id },
          data: { pinHash }
        })
        results.push({ email: demo.email, status: 'updated', message: 'PIN updated' })
        continue
      }

      // Create new user and merchant
      const merchantCount = await db.merchant.count()
      const merchantCode = `MCH-${String(merchantCount + 1001).padStart(6, '0')}`

      await db.$transaction(async (tx: any) => {
        const user = await tx.user.create({
          data: {
            email: demo.email,
            passwordHash,
            pinHash,
            name: demo.name,
            phone: demo.phone,
            emailVerified: new Date()
          }
        })

        const merchant = await tx.merchant.create({
          data: {
            code: merchantCode,
            name: demo.businessName,
            tradingName: demo.tradingName,
            vertical: demo.vertical,
            subVertical: demo.subVertical,
            phone: demo.phone,
            email: demo.email,
            city: demo.city,
            province: demo.province,
            country: 'South Africa',
            status: 'active',
            onboardingComplete: false,
            onboardingStep: 'vertical_select',
            plan: 'starter',
            planStatus: 'trial',
            trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
          }
        })

        await tx.merchantUser.create({
          data: {
            merchantId: merchant.id,
            userId: user.id,
            role: 'owner',
            isActive: true,
            acceptedAt: new Date()
          }
        })

        await tx.branch.create({
          data: {
            merchantId: merchant.id,
            name: 'Main Branch',
            code: 'MAIN',
            type: 'headquarters',
            isDefault: true,
            isActive: true
          }
        })
      })

      results.push({ email: demo.email, status: 'created', password: 'demo1234', pin: '1234' })
    }

    return NextResponse.json({
      success: true,
      message: 'Demo users seeded successfully',
      users: results,
      credentials: {
        password: 'demo1234',
        pin: '1234'
      }
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to seed demo users' },
      { status: 500 }
    )
  }
}
