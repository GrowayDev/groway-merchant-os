import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding merchant demo users...')

  // Demo PINs
  const pinHash = await hash('1234', 10)
  const passwordHash = await hash('demo1234', 10)

  // Create demo merchant user 1 - Coffee Shop
  const user1 = await prisma.user.upsert({
    where: { email: 'demo@groway.co.za' },
    update: {
      pinHash, // Update PIN hash if user exists
    },
    create: {
      id: 'user-demo-001',
      email: 'demo@groway.co.za',
      name: 'Demo User',
      phone: '+27821234567',
      passwordHash,
      pinHash,
      emailVerified: new Date(),
      lastLoginAt: new Date(),
      updatedAt: new Date()
    }
  })

  // Create merchant for user 1
  const merchant1 = await prisma.merchant.upsert({
    where: { code: 'DEMO-001' },
    update: {},
    create: {
      code: 'DEMO-001',
      name: 'Demo Coffee Shop',
      tradingName: 'Demo Coffee Shop',
      vertical: 'fnb',
      subVertical: 'coffee_shop',
      phone: '+27821234567',
      email: 'demo@groway.co.za',
      addressLine1: '123 Main Street',
      city: 'Johannesburg',
      province: 'Gauteng',
      postalCode: '2000',
      country: 'South Africa',
      status: 'active',
      onboardingComplete: true,
      onboardingStep: 'complete',
      plan: 'growth',
      planStatus: 'active',
      trialEndsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
    }
  })

  // Link user to merchant
  await prisma.merchantUser.upsert({
    where: {
      merchantId_userId: {
        merchantId: merchant1.id,
        userId: user1.id
      }
    },
    update: {},
    create: {
      merchantId: merchant1.id,
      userId: user1.id,
      role: 'owner',
      isActive: true,
      acceptedAt: new Date()
    }
  })

  // Create default branch
  await prisma.branch.upsert({
    where: {
      merchantId_code: {
        merchantId: merchant1.id,
        code: 'MAIN'
      }
    },
    update: {},
    create: {
      merchantId: merchant1.id,
      name: 'Main Branch',
      code: 'MAIN',
      type: 'headquarters',
      isDefault: true,
      isActive: true
    }
  })

  // Create demo merchant user 2 - Hair Salon
  const user2 = await prisma.user.upsert({
    where: { email: 'salon@groway.co.za' },
    update: {
      pinHash, // Update PIN hash if user exists
    },
    create: {
      id: 'user-demo-002',
      email: 'salon@groway.co.za',
      name: 'Salon Demo',
      phone: '+27829876543',
      passwordHash,
      pinHash,
      emailVerified: new Date(),
      lastLoginAt: new Date(),
      updatedAt: new Date()
    }
  })

  const merchant2 = await prisma.merchant.upsert({
    where: { code: 'DEMO-002' },
    update: {},
    create: {
      code: 'DEMO-002',
      name: 'Demo Hair Salon',
      tradingName: 'Glamour Hair Studio',
      vertical: 'health-beauty',
      subVertical: 'hair_salon',
      phone: '+27829876543',
      email: 'salon@groway.co.za',
      addressLine1: '45 Fashion Street',
      city: 'Cape Town',
      province: 'Western Cape',
      postalCode: '8001',
      country: 'South Africa',
      status: 'active',
      onboardingComplete: true,
      onboardingStep: 'complete',
      plan: 'growth',
      planStatus: 'active',
      trialEndsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    }
  })

  await prisma.merchantUser.upsert({
    where: {
      merchantId_userId: {
        merchantId: merchant2.id,
        userId: user2.id
      }
    },
    update: {},
    create: {
      merchantId: merchant2.id,
      userId: user2.id,
      role: 'owner',
      isActive: true,
      acceptedAt: new Date()
    }
  })

  await prisma.branch.upsert({
    where: {
      merchantId_code: {
        merchantId: merchant2.id,
        code: 'MAIN'
      }
    },
    update: {},
    create: {
      merchantId: merchant2.id,
      name: 'Main Branch',
      code: 'MAIN',
      type: 'headquarters',
      isDefault: true,
      isActive: true
    }
  })

  console.log('')
  console.log('✅ Merchant demo users created/updated!')
  console.log('')
  console.log('Demo credentials:')
  console.log('─'.repeat(50))
  console.log('User 1 (Coffee Shop):')
  console.log('  Email: demo@groway.co.za')
  console.log('  Password: demo1234')
  console.log('  Quick PIN: 1234')
  console.log('')
  console.log('User 2 (Hair Salon):')
  console.log('  Email: salon@groway.co.za')
  console.log('  Password: demo1234')
  console.log('  Quick PIN: 1234')
  console.log('─'.repeat(50))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
