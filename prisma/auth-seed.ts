import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Creating demo users...')

  // Create demo merchant
  const merchant = await prisma.merchant.upsert({
    where: { code: 'DEMO001' },
    update: {},
    create: {
      code: 'DEMO001',
      name: 'Demo Merchant Ltd',
      tradingName: 'Demo Store',
      email: 'demo@groway.co.za',
      phone: '+27111234567',
      currency: 'ZAR',
      timezone: 'Africa/Johannesburg',
      language: 'en-ZA',
      vatRate: 15.0,
      vatRegistered: true,
      status: 'active',
      vertical: 'fnb',
      subVertical: 'qsr',
      plan: 'growth',
      planStatus: 'active',
      onboardingComplete: true,
      kycStatus: 'verified',
    },
  })
  console.log('Created merchant:', merchant.code)

  // Hash passwords
  const passwordHash = await bcrypt.hash('demo1234', 10)
  const pinHash = await bcrypt.hash('1234', 10)

  // Create demo user with both password and PIN
  const user = await prisma.user.upsert({
    where: { email: 'demo@groway.co.za' },
    update: {
      passwordHash,
      pinHash,
    },
    create: {
      email: 'demo@groway.co.za',
      name: 'Demo User',
      phone: '+27821234567',
      passwordHash,
      pinHash,
    },
  })
  console.log('Created user:', user.email)

  // Create merchant user association
  const merchantUser = await prisma.merchantUser.upsert({
    where: {
      merchantId_userId: {
        userId: user.id,
        merchantId: merchant.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      merchantId: merchant.id,
      role: 'owner',
      isActive: true,
    },
  })
  console.log('Created merchant user association')

  // Create a second test user
  const passwordHash2 = await bcrypt.hash('admin1234', 10)
  const pinHash2 = await bcrypt.hash('5678', 10)

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@groway.co.za' },
    update: {
      passwordHash: passwordHash2,
      pinHash: pinHash2,
    },
    create: {
      email: 'admin@groway.co.za',
      name: 'Admin User',
      phone: '+27839876543',
      passwordHash: passwordHash2,
      pinHash: pinHash2,
    },
  })
  console.log('Created admin user:', adminUser.email)

  await prisma.merchantUser.upsert({
    where: {
      merchantId_userId: {
        userId: adminUser.id,
        merchantId: merchant.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      merchantId: merchant.id,
      role: 'admin',
      isActive: true,
    },
  })
  console.log('Created admin merchant user association')

  console.log('')
  console.log('✅ Demo users created successfully!')
  console.log('')
  console.log('Login Credentials:')
  console.log('==================')
  console.log('User 1:')
  console.log('  Email: demo@groway.co.za')
  console.log('  Password: demo1234')
  console.log('  Quick PIN: 1234')
  console.log('  Merchant Code: DEMO001')
  console.log('')
  console.log('User 2:')
  console.log('  Email: admin@groway.co.za')
  console.log('  Password: admin1234')
  console.log('  Quick PIN: 5678')
  console.log('  Merchant Code: DEMO001')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
