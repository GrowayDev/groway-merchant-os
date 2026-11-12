import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

function genId(prefix: string = 'id'): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 12)}`
}

async function main() {
  console.log('Seeding additional data...')
  
  // Create demo merchant
  const existingMerchant = await prisma.merchant.count()
  if (existingMerchant === 0) {
    await prisma.merchant.create({
      data: {
        id: genId('mch'),
        code: 'DEMO001',
        name: 'Demo Business SA',
        tradingName: 'Demo Store',
        phone: '+27123456789',
        email: 'demo@business.co.za',
        plan: 'growth',
        planStatus: 'active',
        status: 'active',
        vertical: 'food_beverage',
        subVertical: 'restaurant',
        currency: 'ZAR',
        timezone: 'Africa/Johannesburg',
        onboardingComplete: true,
        kycStatus: 'verified',
        updatedAt: new Date()
      }
    })
    console.log('Created demo merchant')
  }

  // Create demo consumer user
  const existingConsumer = await prisma.consumerUser.count()
  if (existingConsumer === 0) {
    await prisma.consumerUser.create({
      data: {
        id: 'consumer_demo_001',
        phone: '+27821234567',
        email: 'demo@consumer.co.za',
        firstName: 'Demo',
        lastName: 'User',
        idType: 'sa_id',
        nationality: 'ZA',
        kycLevel: 2,
        kycStatus: 'verified',
        accountStatus: 'active',
        updatedAt: new Date()
      }
    })
    console.log('Created demo consumer user')
  }

  // Create demo wholesalers
  const existingWholesaler = await prisma.wholesaler.count()
  if (existingWholesaler === 0) {
    const wholesalers = [
      { name: 'Metro Wholesale', code: 'METRO', categories: 'FMCG' },
      { name: 'FoodCorp Distributors', code: 'FOODCORP', categories: 'Food & Beverage' },
      { name: 'Prime Supplies', code: 'PRIME', categories: 'General' }
    ]
    
    for (const w of wholesalers) {
      await prisma.wholesaler.create({
        data: {
          id: genId('ws'),
          name: w.name,
          code: w.code,
          categories: w.categories,
          status: 'active',
          updatedAt: new Date()
        }
      })
    }
    console.log('Created 3 wholesalers')
  }

  // Create demo tenants
  const existingTenants = await prisma.platformTenant.count()
  if (existingTenants === 0) {
    const tenants = [
      { name: 'Merchant OS Demo', slug: 'merchant-os-demo', plan: 'enterprise' },
      { name: 'GoPay Demo', slug: 'gopay-demo', plan: 'enterprise' },
      { name: 'GroSell Demo', slug: 'grosell-demo', plan: 'growth' }
    ]
    
    for (const t of tenants) {
      await prisma.platformTenant.create({
        data: {
          id: genId('tenant'),
          name: t.name,
          slug: t.slug,
          plan: t.plan,
          status: 'active',
          maxUsers: 1000,
          updatedAt: new Date()
        }
      })
    }
    console.log('Created 3 platform tenants')
  }

  console.log('\n=== FINAL DATABASE STATUS ===')
  console.log('Suppliers:', await prisma.supplier.count())
  console.log('Catalog Products:', await prisma.catalogProduct.count())
  console.log('Merchants:', await prisma.merchant.count())
  console.log('Consumer Users:', await prisma.consumerUser.count())
  console.log('Wholesalers:', await prisma.wholesaler.count())
  console.log('Admin Users:', await prisma.adminUser.count())
  console.log('Platform Tenants:', await prisma.platformTenant.count())
}

main().catch(console.error).finally(() => prisma.$disconnect())
