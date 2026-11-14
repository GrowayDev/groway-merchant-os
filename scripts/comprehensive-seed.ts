/**
 * Comprehensive database seed — creates all demo data
 * Run with: bun run scripts/comprehensive-seed.ts
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()
const SALT_ROUNDS = 10

const DEMO_USERS = [
  { email: 'demo@groway.co.za', name: 'Demo User', role: 'owner' },
  { email: 'spaza@groway.co.za', name: 'Spaza Shop Owner', role: 'owner' },
  { email: 'restaurant@groway.co.za', name: 'Restaurant Owner', role: 'owner' },
  { email: 'salon@groway.co.za', name: 'Salon Owner', role: 'owner' },
  { email: 'pharmacy@groway.co.za', name: 'Pharmacy Owner', role: 'owner' },
  { email: 'admin@groway.co.za', name: 'Admin User', role: 'admin' },
  { email: 'staff@groway.co.za', name: 'Staff Member', role: 'staff' },
]

const MERCHANTS = [
  { id: 'merchant-demo', name: 'Demo Business', vertical: 'grocery', subVertical: 'spaza', email: 'demo@groway.co.za' },
  { id: 'merchant-spaza', name: 'Mama Thandi Spaza', vertical: 'grocery', subVertical: 'spaza', email: 'spaza@groway.co.za' },
  { id: 'merchant-restaurant', name: 'The Coffee Corner', vertical: 'fnb', subVertical: 'coffee_shop', email: 'restaurant@groway.co.za' },
  { id: 'merchant-salon', name: 'Demo Salon', vertical: 'health_beauty', subVertical: 'hair_salon', email: 'salon@groway.co.za' },
  { id: 'merchant-pharmacy', name: 'Demo Pharmacy', vertical: 'health_pharmacy', subVertical: 'pharmacy', email: 'pharmacy@groway.co.za' },
]

const SUPPLIER_NAMES = [
  'Premier Foods', 'Tiger Brands', 'Willowton Group', 'Tongaat Hulett', 'RCL Foods',
  'Pioneer Foods', 'Nestle SA', 'Unilever SA', 'Procter & Gamble', 'Coca-Cola SA',
  'AB InBev', 'Distell', 'Clover', 'Danone SA', 'Kelloggs SA',
  'Mars Africa', 'Mondelez SA', 'Lancewood', 'Robertson Spices', 'Knorr',
]

const SUPPLIER_CATEGORIES = ['grocery', 'beverages', 'household', 'personal_care', 'frozen', 'dairy', 'bakery', 'butchery', 'produce', 'hardware']

const PRODUCT_NAMES = [
  'Rice 5kg', 'Flour 10kg', 'Sugar 2kg', 'Cooking Oil 2L', 'Pasta 500g',
  'Tomato Sauce 500ml', 'Baked Beans 400g', 'Corn Flakes 500g', 'Milk 1L', 'Bread Loaf',
  'Cheese 250g', 'Butter 250g', 'Chicken 1kg', 'Beef Mince 500g', 'Apples 1kg',
  'Bananas 1kg', 'Potatoes 1kg', 'Onions 1kg', 'Tomatoes 500g', 'Cabbage',
  'Frozen Peas 500g', 'Ice Cream 2L', 'Coffee 250g', 'Tea Bags 100s', 'Cola 2L',
  'Soap 6-pack', 'Toothpaste 100ml', 'Toilet Paper 9-roll', 'Detergent 2kg', 'Bleach 1L',
  'Shampoo 500ml', 'Body Lotion 400ml', 'Sunscreen 100ml', 'Diapers 30s', 'Baby Wipes 80s',
  'Dog Food 2kg', 'Cat Food 1kg', 'Nails 500g', 'Light Bulb LED', 'Batteries AA 4-pack',
  'Wine Bottle', 'Beer 6-pack', 'Snack Chips 150g', 'Chocolate Bar', 'Nuts 200g',
  'Vitamins 30s', 'Pain Relief 20s', 'Bandages 20s', 'First Aid Kit', 'Antiseptic 100ml',
]

const PRODUCT_CATEGORIES = ['grocery', 'beverages', 'household', 'personal_care', 'health', 'pet_care', 'hardware', 'alcohol', 'snacks']

async function main() {
  console.log('Starting comprehensive database seed...\n')

  // 1. Create demo users
  console.log('Creating demo users...')
  const passwordHash = await bcrypt.hash('demo1234', SALT_ROUNDS)
  let userCount = 0
  for (const user of DEMO_USERS) {
    try {
      await prisma.user.upsert({
        where: { email: user.email },
        update: {},
        create: {
          id: `user-${user.email.split('@')[0]}`,
          email: user.email,
          passwordHash,
          name: user.name,
          role: user.role,
          phone: '+27123456789',
          updatedAt: new Date(),
        },
      })
      userCount++
    } catch (e: any) {
      console.log(`  User ${user.email} error: ${e.message?.substring(0, 80)}`)
    }
  }
  console.log(`Created ${userCount} users\n`)

  // 2. Create merchants
  console.log('Creating merchants...')
  let merchantCount = 0
  for (const m of MERCHANTS) {
    try {
      await prisma.merchant.upsert({
        where: { id: m.id },
        update: {},
        create: {
          id: m.id,
          code: `MCH-${m.vertical.substring(0, 6).toUpperCase()}-${merchantCount + 1}`,
          name: m.name,
          vertical: m.vertical,
          subVertical: m.subVertical,
          email: m.email,
          phone: '+27123456789',
          addressLine1: '123 Business Street',
          city: 'Johannesburg',
          province: 'Gauteng',
          postalCode: '2000',
          country: 'South Africa',
          currency: 'ZAR',
          timezone: 'Africa/Johannesburg',
          vatRate: 15.0,
          vatRegistered: true,
          posEnabled: true,
          onboardingComplete: true,
          status: 'active',
          kycStatus: 'verified',
          plan: 'professional',
          updatedAt: new Date(),
        },
      })

      // Create default branch
      await prisma.branch.upsert({
        where: { id: `branch-${m.vertical}-main` },
        update: {},
        create: {
          id: `branch-${m.vertical}-main`,
          merchantId: m.id,
          code: `BR-${m.vertical.substring(0, 6).toUpperCase()}`,
          name: `${m.name} - Main`,
          addressLine1: '123 Business Street',
          city: 'Johannesburg',
          province: 'Gauteng',
          postalCode: '2000',
          phone: '+27123456789',
          email: m.email,
          isDefault: true,
          isActive: true,
          updatedAt: new Date(),
        },
      })

      // Link user to merchant
      const userEmail = m.email
      const user = await prisma.user.findUnique({ where: { email: userEmail } })
      if (user) {
        await prisma.merchantUser.upsert({
          where: { userId_merchantId: { userId: user.id, merchantId: m.id } },
          update: {},
          create: {
            id: `mu-${user.id}-${m.id}`,
            userId: user.id,
            merchantId: m.id,
            role: 'owner',
            isActive: true,
            acceptedAt: new Date(),
            updatedAt: new Date(),
          },
        }).catch(() => {})
      }

      merchantCount++
    } catch (e: any) {
      console.log(`  Merchant ${m.name} error: ${e.message?.substring(0, 80)}`)
    }
  }
  console.log(`Created ${merchantCount} merchants\n`)

  // 3. Create suppliers (50)
  console.log('Creating suppliers...')
  let supplierCount = 0
  for (let i = 0; i < 50; i++) {
    try {
      const nameIndex = i % SUPPLIER_NAMES.length
      const catIndex = i % SUPPLIER_CATEGORIES.length
      await prisma.supplier.create({
        data: {
          id: `supplier-${i + 1}`,
          name: `${SUPPLIER_NAMES[nameIndex]} ${i + 1}`,
          code: `SUP-${String(i + 1).padStart(4, '0')}`,
          contactPerson: `Contact Person ${i + 1}`,
          email: `supplier${i + 1}@example.com`,
          phone: `+27${Math.floor(Math.random() * 900000000) + 100000000}`,
          address: `${Math.floor(Math.random() * 999) + 1} Supplier Street`,
          city: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth'][i % 5],
          province: ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State'][i % 5],
          postalCode: `${Math.floor(Math.random() * 9000) + 1000}`,
          supplierType: SUPPLIER_CATEGORIES[catIndex],
          tier: ['bronze', 'silver', 'gold'][i % 3],
          rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
          reviewCount: Math.floor(Math.random() * 100),
          deliveryDays: Math.floor(Math.random() * 5) + 1,
          status: 'active',
          updatedAt: new Date(),
        },
      })
      supplierCount++
    } catch (e) {
      // Skip duplicates
    }
  }
  console.log(`Created ${supplierCount} suppliers\n`)

  // 4. Create catalog products (50)
  console.log('Creating catalog products...')
  let productCount = 0
  for (let i = 0; i < 50; i++) {
    try {
      const nameIndex = i % PRODUCT_NAMES.length
      const catIndex = i % PRODUCT_CATEGORIES.length
      const costPrice = Math.round((Math.random() * 400 + 8) * 100) / 100
      const retailPrice = Math.round((costPrice * 1.3) * 100) / 100
      await prisma.catalogProduct.create({
        data: {
          id: `product-${i + 1}`,
          sku: `SKU-${String(i + 1).padStart(6, '0')}`,
          sourceType: 'wholesale',
          supplierId: `supplier-${(i % 50) + 1}`,
          vertical: 'grocery',
          subVertical: 'spaza',
          category: PRODUCT_CATEGORIES[catIndex],
          description: `High quality ${PRODUCT_NAMES[nameIndex].toLowerCase()}`,
          packSize: '1 unit',
          unit: ['each', 'kg', 'L', 'pack', 'box'][i % 5],
          vatRate: 15.0,
          costPrice,
          retailPrice,
          grossMargin: Math.round((retailPrice - costPrice) / retailPrice * 100 * 100) / 100,
          minOrderQty: 1,
          leadDays: 3,
          inStock: true,
          status: 'active',
          updatedAt: new Date(),
        },
      })
      productCount++
    } catch (e) {
      // Skip duplicates
    }
  }
  console.log(`Created ${productCount} catalog products\n`)

  // 5. Create consumer user + wallet + loyalty + card
  console.log('Creating consumer wallet data...')
  try {
    const userId = 'demo-consumer-user'
    const existing = await prisma.consumerUser.findFirst({ where: { OR: [{ id: userId }, { phone: '+27820000001' }] } })

    let consumerUserId = existing?.id || userId
    if (!existing) {
      await prisma.consumerUser.create({
        data: {
          id: userId,
          phone: '+27820000001',
          email: 'demo@wallet.co.za',
          firstName: 'Demo',
          lastName: 'User',
          idType: 'passport',
          nationality: 'South African',
          kycLevel: 4,
          kycStatus: 'verified',
          kycVerifiedAt: new Date(),
          failedPinAttempts: 0,
          languagePreference: 'en',
          accountStatus: 'active',
          updatedAt: new Date(),
        },
      })
    }

    // Create wallet if not exists
    const wallet = await prisma.consumerWallet.findUnique({ where: { userId: consumerUserId } })
    if (!wallet) {
      await prisma.consumerWallet.create({
        data: {
          id: 'wallet-demo-consumer',
          userId: consumerUserId,
          balanceCents: BigInt(1245000),
          reservedCents: BigInt(0),
          pendingCents: BigInt(0),
          currency: 'ZAR',
          dailySpendLimit: BigInt(100000),
          updatedAt: new Date(),
        },
      })
    } else {
      await prisma.consumerWallet.update({
        where: { userId: consumerUserId },
        data: { balanceCents: BigInt(1245000), updatedAt: new Date() },
      })
    }

    // Create loyalty if not exists
    const loyalty = await prisma.consumerLoyalty.findUnique({ where: { userId: consumerUserId } })
    if (!loyalty) {
      await prisma.consumerLoyalty.create({
        data: {
          id: 'loy-demo-consumer',
          userId: consumerUserId,
          tier: 'silver',
          points: 1500,
          totalEarned: 1500,
          totalRedeemed: 0,
          tierProgress: 50,
          tierAchievedAt: new Date(),
          updatedAt: new Date(),
        },
      })
    }

    // Create a demo card
    const card = await prisma.consumerCard.findFirst({ where: { userId: consumerUserId } })
    if (!card) {
      await prisma.consumerCard.create({
        data: {
          id: `card-${Date.now()}`,
          userId: consumerUserId,
          cardType: 'silver',
          cardCategory: 'virtual',
          cardDesign: 'silver',
          lastFourDigits: '4242',
          cardToken: `GC-${Date.now()}`,
          panEncrypted: '4242424242424242',
          cvvEncrypted: '123',
          expiryMonth: '12',
          expiryYear: '29',
          cardholderName: 'DEMO USER',
          status: 'active',
          spendingLimitDaily: BigInt(50000),
          spendingLimitMonthly: BigInt(250000),
          onlineEnabled: true,
          contactlessEnabled: true,
          atmEnabled: false,
          internationalEnabled: false,
          activatedAt: new Date(),
          updatedAt: new Date(),
        },
      })
    }

    console.log('Consumer wallet data created\n')
  } catch (e: any) {
    console.log(`Consumer wallet error: ${e.message?.substring(0, 100)}\n`)
  }

  // 6. Create wholesalers (10)
  console.log('Creating wholesalers...')
  let wholesalerCount = 0
  for (let i = 1; i <= 10; i++) {
    try {
      await prisma.wholesaler.create({
        data: {
          id: `wholesaler-${i}`,
          name: `Wholesaler ${i}`,
          code: `WS-${String(i).padStart(4, '0')}`,
          type: 'cash_and_carry',
          phone: `+27${Math.floor(Math.random() * 900000000) + 100000000}`,
          email: `wholesaler${i}@example.com`,
          branchCount: Math.floor(Math.random() * 5) + 1,
          province: ['Gauteng', 'Western Cape', 'KwaZulu-Natal'][i % 3],
          deliveryDays: Math.floor(Math.random() * 5) + 1,
          status: 'active',
          updatedAt: new Date(),
        },
      })
      wholesalerCount++
    } catch (e) {
      // Skip duplicates
    }
  }
  console.log(`Created ${wholesalerCount} wholesalers\n`)

  // Final count
  console.log('=== Final Database Counts ===')
  const counts = {
    Users: await prisma.user.count(),
    Merchants: await prisma.merchant.count(),
    Branches: await prisma.branch.count(),
    Suppliers: await prisma.supplier.count(),
    CatalogProducts: await prisma.catalogProduct.count(),
    ConsumerUsers: await prisma.consumerUser.count(),
    ConsumerWallets: await prisma.consumerWallet.count(),
    ConsumerCards: await prisma.consumerCard.count(),
    ConsumerLoyalty: await prisma.consumerLoyalty.count(),
    Wholesalers: await prisma.wholesaler.count(),
    MerchantUsers: await prisma.merchantUser.count(),
  }
  console.table(counts)
  console.log('\nSeed completed successfully!')
}

main()
  .catch((e) => { console.error('Seed error:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
