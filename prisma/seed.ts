import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

function generateId() {
  return randomUUID()
}

function now() {
  return new Date()
}

async function main() {
  console.log('Seeding database...')

  // Create Enterprise Corporate Clients
  const client1 = await prisma.enterpriseCorporateClient.upsert({
    where: { code: 'CC001' },
    update: {},
    create: {
      id: generateId(),
      code: 'CC001',
      name: 'Spaza Holdings (Pty) Ltd',
      tier: 'Enterprise',
      creditLimit: 5000000,
      creditUsed: 1500000,
      monthlyVolume: 8500000,
      contactPerson: 'Thabo Molefe',
      contactEmail: 'thabo@spazaholdings.co.za',
      contactPhone: '+27112345678',
      address: '123 Commissioner Street',
      city: 'Johannesburg',
      province: 'Gauteng',
      postalCode: '2001',
      registrationNumber: '2018/123456/07',
      vatNumber: '4567890123',
      createdAt: now(),
      updatedAt: now(),
    }
  })

  const client2 = await prisma.enterpriseCorporateClient.upsert({
    where: { code: 'CC002' },
    update: {},
    create: {
      id: generateId(),
      code: 'CC002',
      name: 'Cape Fresh Markets',
      tier: 'Gold',
      creditLimit: 2000000,
      creditUsed: 500000,
      monthlyVolume: 3200000,
      contactPerson: 'Sarah van der Merwe',
      contactEmail: 'sarah@capefresh.co.za',
      contactPhone: '+27219876543',
      address: '45 Long Street',
      city: 'Cape Town',
      province: 'Western Cape',
      postalCode: '8001',
      createdAt: now(),
      updatedAt: now(),
    }
  })

  console.log('Created/verified corporate clients')

  // Create Enterprise Merchants
  const merchant1 = await prisma.enterpriseMerchant.upsert({
    where: { code: 'M001' },
    update: {},
    create: {
      id: generateId(),
      code: 'M001',
      name: 'Spaza Holdings - Sandton',
      corporateId: client1.id,
      location: 'Sandton City Mall',
      vertical: 'Grocery',
      monthlyRevenue: 2500000,
      status: 'active',
      createdAt: now(),
      updatedAt: now(),
    }
  })

  const merchant2 = await prisma.enterpriseMerchant.upsert({
    where: { code: 'M002' },
    update: {},
    create: {
      id: generateId(),
      code: 'M002',
      name: 'Spaza Holdings - Rosebank',
      corporateId: client1.id,
      location: 'Rosebank Mall',
      vertical: 'Grocery',
      monthlyRevenue: 1800000,
      status: 'active',
      createdAt: now(),
      updatedAt: now(),
    }
  })

  const merchant3 = await prisma.enterpriseMerchant.upsert({
    where: { code: 'M003' },
    update: {},
    create: {
      id: generateId(),
      code: 'M003',
      name: 'Cape Fresh - V&A Waterfront',
      corporateId: client2.id,
      location: 'V&A Waterfront',
      vertical: 'Grocery',
      monthlyRevenue: 3200000,
      status: 'active',
      createdAt: now(),
      updatedAt: now(),
    }
  })

  console.log('Created merchants')

  // Create Enterprise Users
  const existingUsers = await prisma.enterpriseUser.count()
  if (existingUsers === 0) {
    await prisma.enterpriseUser.createMany({
      data: [
        {
          id: generateId(),
          name: 'Thabo Molefe',
          email: 'thabo@spazaholdings.co.za',
          phone: '+27821234567',
          role: 'Owner',
          corporateId: client1.id,
          status: 'active',
          createdAt: now(),
          updatedAt: now(),
        },
        {
          id: generateId(),
          name: 'Nomsa Dlamini',
          email: 'nomsa@spazaholdings.co.za',
          phone: '+27829876543',
          role: 'Admin',
          corporateId: client1.id,
          status: 'active',
          createdAt: now(),
          updatedAt: now(),
        },
        {
          id: generateId(),
          name: 'Sarah van der Merwe',
          email: 'sarah@capefresh.co.za',
          phone: '+27834567890',
          role: 'Owner',
          corporateId: client2.id,
          status: 'active',
          createdAt: now(),
          updatedAt: now(),
        },
      ]
    })
    console.log('Created users')
  } else {
    console.log('Users already exist, skipping...')
  }

  // Create Enterprise Inventory
  const existingInventory = await prisma.enterpriseInventory.count()
  if (existingInventory === 0) {
    await prisma.enterpriseInventory.createMany({
      data: [
        {
          id: generateId(),
          sku: 'SKU001',
          name: 'Milk 2L',
          category: 'Dairy',
          stock: 500,
          unit: 'units',
          lowStock: 100,
          value: 12500,
          merchantId: merchant1.id,
          createdAt: now(),
          updatedAt: now(),
        },
        {
          id: generateId(),
          sku: 'SKU002',
          name: 'Bread White',
          category: 'Bakery',
          stock: 300,
          unit: 'units',
          lowStock: 50,
          value: 4500,
          merchantId: merchant1.id,
          createdAt: now(),
          updatedAt: now(),
        },
        {
          id: generateId(),
          sku: 'SKU003',
          name: 'Rice 5kg',
          category: 'Dry Goods',
          stock: 200,
          unit: 'units',
          lowStock: 30,
          value: 24000,
          merchantId: merchant1.id,
          createdAt: now(),
          updatedAt: now(),
        },
      ]
    })
    console.log('Created inventory')
  } else {
    console.log('Inventory already exists, skipping...')
  }

  // Create Kitchen Stations
  const existingStations = await prisma.kitchenStation.count()
  if (existingStations === 0) {
    await prisma.kitchenStation.createMany({
      data: [
        { id: generateId(), name: 'Grill', icon: 'Flame', color: '#EF4444', active: true, createdAt: now(), updatedAt: now() },
        { id: generateId(), name: 'Fryer', icon: 'Flame', color: '#F59E0B', active: true, createdAt: now(), updatedAt: now() },
        { id: generateId(), name: 'Cold Station', icon: 'Snowflake', color: '#3B82F6', active: true, createdAt: now(), updatedAt: now() },
        { id: generateId(), name: 'Pizza', icon: 'Pizza', color: '#10B981', active: true, createdAt: now(), updatedAt: now() },
      ]
    })
    console.log('Created kitchen stations')
  } else {
    console.log('Kitchen stations already exist, skipping...')
  }

  // Create Booking Staff
  const existingStaff = await prisma.staff.count()
  if (existingStaff === 0) {
    await prisma.staff.createMany({
      data: [
        { id: generateId(), name: 'Precious Mbeki', email: 'precious@salon.co.za', phone: '+27821234567', status: 'active', role: 'manager', color: '#00897B', rating: 4.9, reviewCount: 156, createdAt: now(), updatedAt: now() },
        { id: generateId(), name: 'Lerato Mokoena', email: 'lerato@salon.co.za', phone: '+27839876543', status: 'active', role: 'staff', color: '#E91E63', rating: 4.7, reviewCount: 89, createdAt: now(), updatedAt: now() },
        { id: generateId(), name: 'Sipho Nkosi', email: 'sipho@salon.co.za', phone: '+27841234567', status: 'active', role: 'staff', color: '#9C27B0', rating: 4.8, reviewCount: 112, createdAt: now(), updatedAt: now() },
      ]
    })
    console.log('Created staff')
  } else {
    console.log('Staff already exist, skipping...')
  }

  // Create Booking Services
  const existingServices = await prisma.bookingService.count()
  if (existingServices === 0) {
    await prisma.bookingService.createMany({
      data: [
        { id: generateId(), name: 'Haircut - Men', category: 'barber', duration: 30, price: 150, description: 'Classic mens haircut', active: true, createdAt: now(), updatedAt: now() },
        { id: generateId(), name: 'Haircut & Beard', category: 'barber', duration: 45, price: 250, description: 'Haircut with beard trim', active: true, createdAt: now(), updatedAt: now() },
        { id: generateId(), name: 'Hair Wash & Style', category: 'hair', duration: 60, price: 350, description: 'Full wash and styling', active: true, createdAt: now(), updatedAt: now() },
        { id: generateId(), name: 'Hair Color', category: 'hair', duration: 120, price: 850, description: 'Full hair coloring', active: true, createdAt: now(), updatedAt: now() },
        { id: generateId(), name: 'Manicure', category: 'nails', duration: 45, price: 250, description: 'Classic manicure', active: true, createdAt: now(), updatedAt: now() },
        { id: generateId(), name: 'Pedicure', category: 'nails', duration: 60, price: 350, description: 'Spa pedicure', active: true, createdAt: now(), updatedAt: now() },
      ]
    })
    console.log('Created services')
  } else {
    console.log('Services already exist, skipping...')
  }

  // Create Wholesalers
  const existingWholesalers = await prisma.wholesaler.count()
  if (existingWholesalers === 0) {
    await prisma.wholesaler.createMany({
      data: [
        {
          id: generateId(),
          code: 'WS001',
          name: 'Makro Wholesale',
          type: 'cash_and_carry',
          province: 'Gauteng',
          status: 'active',
          createdAt: now(),
          updatedAt: now(),
        },
        {
          id: generateId(),
          code: 'WS002',
          name: 'Game Stores',
          type: 'cash_and_carry',
          province: 'Gauteng',
          status: 'active',
          createdAt: now(),
          updatedAt: now(),
        },
        {
          id: generateId(),
          code: 'WS003',
          name: 'Jumbo Cash & Carry',
          type: 'cash_and_carry',
          province: 'Gauteng',
          status: 'active',
          createdAt: now(),
          updatedAt: now(),
        },
      ]
    })
    console.log('Created wholesalers')
  } else {
    console.log('Wholesalers already exist, skipping...')
  }

  // Create a Merchant for the system
  const existingMerchants = await prisma.merchant.count()
  let merchant;
  if (existingMerchants === 0) {
    merchant = await prisma.merchant.create({
      data: {
        id: generateId(),
        code: 'MERCH001',
        name: 'Demo Merchant Store',
        tradingName: 'Demo Store',
        registrationNumber: '2024/123456/07',
        vatNumber: '4876543210',
        vertical: 'Grocery & FMCG',
        phone: '+27821234567',
        email: 'demo@merchant.co.za',
        addressLine1: '123 Main Street',
        city: 'Johannesburg',
        province: 'Gauteng',
        postalCode: '2001',
        createdAt: now(),
        updatedAt: now(),
      }
    })
    console.log('Created merchant')
  } else {
    merchant = await prisma.merchant.findFirst()
    console.log('Merchant already exists, skipping...')
  }

  // Create a User for the system
  const existingSystemUsers = await prisma.user.count()
  if (existingSystemUsers === 0) {
    await prisma.user.create({
      data: {
        id: generateId(),
        email: 'demo@merchant.co.za',
        name: 'Demo User',
        role: 'admin',
        createdAt: now(),
        updatedAt: now(),
      }
    })
    console.log('Created user')
  } else {
    console.log('System user already exists, skipping...')
  }

  // Final counts
  console.log('\n=== Database Status ===')
  console.log('Suppliers:', await prisma.supplier.count())
  console.log('Merchants:', await prisma.merchant.count())
  console.log('Users:', await prisma.user.count())
  console.log('Wholesalers:', await prisma.wholesaler.count())
  console.log('Enterprise Clients:', await prisma.enterpriseCorporateClient.count())
  console.log('========================')

  console.log('\n✅ Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
