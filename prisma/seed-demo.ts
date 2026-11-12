import { hash } from 'bcryptjs'
import { nanoid } from 'nanoid'

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

async function main() {
  const { PrismaClient } = await import('@prisma/client')
  const db = new PrismaClient()
  
  const now = new Date()
  const results = { users: 0, merchants: 0, admins: 0 }

  console.log('Seeding demo data...')

  // Seed admin users
  for (const admin of DEMO_ADMINS) {
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
          status: 'active',
          updatedAt: now
        }
      })
      results.admins++
      console.log(`Created admin: ${admin.email}`)
    } else {
      console.log(`Admin already exists: ${admin.email}`)
    }
  }

  // Seed merchant users
  for (const user of DEMO_USERS) {
    const existingUser = await db.user.findUnique({
      where: { email: user.email }
    })

    let userId: string

    if (!existingUser) {
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
          emailVerified: now,
          updatedAt: now
        }
      })
      userId = newUser.id
      results.users++
      console.log(`Created user: ${user.email}`)
    } else {
      userId = existingUser.id
      console.log(`User already exists: ${user.email}`)
    }

    const existingMerchant = await db.merchant.findFirst({
      where: { email: user.email }
    })

    if (!existingMerchant) {
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
          trialEndsAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
          updatedAt: now
        }
      })
      
      const branch = await db.branch.create({
        data: {
          id: `branch_${nanoid(12)}`,
          merchantId: newMerchant.id,
          code: 'MAIN',
          name: 'Main Branch',
          type: 'headquarters',
          isDefault: true,
          isActive: true,
          updatedAt: now
        }
      })

      await db.merchantUser.create({
        data: {
          id: `mu_${nanoid(12)}`,
          merchantId: newMerchant.id,
          userId,
          role: user.role,
          branchId: branch.id,
          isActive: true,
          acceptedAt: now,
          updatedAt: now
        }
      })
      
      results.merchants++
      console.log(`Created merchant: ${user.merchantName}`)
    } else {
      console.log(`Merchant already exists: ${user.merchantName}`)
    }
  }

  await db.$disconnect()
  
  console.log('\n=== Seed Results ===')
  console.log(`Users created: ${results.users}`)
  console.log(`Merchants created: ${results.merchants}`)
  console.log(`Admins created: ${results.admins}`)
  console.log('\nDemo credentials:')
  console.log('Merchant OS: demo@groway.co.za / demo1234 (PIN: 1234)')
  console.log('Admin Console: admin@groway.co.za / admin1234')
}

main().catch(console.error)
