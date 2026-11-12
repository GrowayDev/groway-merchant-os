import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { nanoid } from 'nanoid'

// Demo users configuration
const DEMO_USERS = [
  {
    email: 'demo@groway.co.za',
    password: 'demo1234',
    name: 'Coffee Shop Demo',
    merchantName: 'The Coffee Corner',
    tradingName: 'The Coffee Corner',
    vertical: 'fnb',
    subVertical: 'coffee_shop',
    role: 'owner'
  },
  {
    email: 'salon@groway.co.za',
    password: 'demo1234',
    name: 'Hair Salon Demo',
    merchantName: 'Glamour Hair Studio',
    tradingName: 'Glamour Hair Studio',
    vertical: 'health-beauty',
    subVertical: 'hair_salon',
    role: 'owner'
  },
  {
    email: 'restaurant@groway.co.za',
    password: 'demo1234',
    name: 'Restaurant Demo',
    merchantName: 'The Hungry Fork',
    tradingName: 'The Hungry Fork Restaurant',
    vertical: 'fnb',
    subVertical: 'restaurant',
    role: 'owner'
  },
  {
    email: 'spaza@groway.co.za',
    password: 'demo1234',
    name: 'Spaza Shop Demo',
    merchantName: 'Mama Thandi Spaza',
    tradingName: 'Mama Thandi Spaza Shop',
    vertical: 'grocery',
    subVertical: 'spaza',
    role: 'owner'
  },
  {
    email: 'barber@groway.co.za',
    password: 'demo1234',
    name: 'Barber Demo',
    merchantName: 'Fresh Cuts Barbershop',
    tradingName: 'Fresh Cuts Barbershop',
    vertical: 'health-beauty',
    subVertical: 'barber',
    role: 'owner'
  }
]

const DEMO_ADMINS = [
  {
    email: 'admin@groway.co.za',
    password: 'admin1234',
    name: 'System Admin',
    role: 'super_admin',
    department: 'Operations'
  }
]

// POST /api/seed-demo - Seed demo users
export async function POST(request: NextRequest) {
  try {
    const { db } = await import('@/lib/db')
    const now = new Date()
    const results = {
      users: 0,
      merchants: 0,
      admins: 0,
      errors: [] as string[]
    }

    // Seed admin users
    for (const admin of DEMO_ADMINS) {
      try {
        const existingAdmin = await db.adminUser.findUnique({
          where: { email: admin.email }
        })

        if (!existingAdmin) {
          const passwordHash = await hash(admin.password, 10)
          await db.adminUser.create({
            data: {
              id: `admin_${nanoid(12)}`,
              email: admin.email.toLowerCase(),
              name: admin.name,
              passwordHash,
              role: admin.role,
              department: admin.department,
              mfaEnabled: false,
              status: 'active'
            }
          })
          results.admins++
        }
      } catch (error) {
        results.errors.push(`Failed to create admin ${admin.email}: ${error}`)
      }
    }

    // Seed merchant users
    for (const user of DEMO_USERS) {
      try {
        // Check if user exists
        const existingUser = await db.user.findUnique({
          where: { email: user.email }
        })

        let userId: string

        if (!existingUser) {
          // Create user
          const passwordHash = await hash(user.password, 10)
          const pinHash = await hash('1234', 10)
          
          const newUser = await db.user.create({
            data: {
              id: `user_${nanoid(12)}`,
              email: user.email.toLowerCase(),
              name: user.name,
              passwordHash,
              pinHash,
              role: user.role,
              emailVerified: now
            }
          })
          userId = newUser.id
          results.users++
        } else {
          userId = existingUser.id
        }

        // Check if merchant exists
        const existingMerchant = await db.merchant.findFirst({
          where: { email: user.email }
        })

        let merchantId: string

        if (!existingMerchant) {
          // Create merchant
          const newMerchant = await db.merchant.create({
            data: {
              id: `merchant_${nanoid(12)}`,
              code: `MCH-${String(Math.floor(Math.random() * 900000) + 100000).padStart(6, '0')}`,
              name: user.merchantName,
              tradingName: user.tradingName,
              vertical: user.vertical,
              subVertical: user.subVertical,
              email: user.email,
              country: 'South Africa',
              currency: 'ZAR',
              status: 'active',
              onboardingComplete: true,
              plan: 'starter',
              planStatus: 'trial',
              trialEndsAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
            }
          })
          merchantId = newMerchant.id
          results.merchants++

          // Create default branch
          const branch = await db.branch.create({
            data: {
              id: `branch_${nanoid(12)}`,
              merchantId,
              code: 'MAIN',
              name: 'Main Branch',
              type: 'headquarters',
              isDefault: true,
              isActive: true
            }
          })

          // Create merchant-user relationship
          await db.merchantUser.create({
            data: {
              id: `mu_${nanoid(12)}`,
              merchantId,
              userId,
              role: user.role,
              branchId: branch.id,
              isActive: true,
              acceptedAt: now
            }
          })
        } else {
          merchantId = existingMerchant.id
        }
      } catch (error) {
        results.errors.push(`Failed to create user ${user.email}: ${error}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Demo data seeded successfully',
      results
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to seed demo data' },
      { status: 500 }
    )
  }
}

// GET /api/seed-demo - Check seed status
export async function GET() {
  try {
    const { db } = await import('@/lib/db')
    
    const userCount = await db.user.count()
    const merchantCount = await db.merchant.count()
    const adminCount = await db.adminUser.count()

    return NextResponse.json({
      success: true,
      status: {
        users: userCount,
        merchants: merchantCount,
        admins: adminCount,
        seeded: userCount > 0
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      status: {
        users: 0,
        merchants: 0,
        admins: 0,
        seeded: false
      }
    })
  }
}
