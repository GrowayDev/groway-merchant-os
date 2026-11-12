import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...\n');
  
  const passwordHash = await hash('demo1234', 10);
  
  // 1. Create demo users
  console.log('Creating demo users...');
  const users = [
    { id: 'user-demo', email: 'demo@groway.co.za', name: 'Demo User', role: 'admin' },
    { id: 'user-salon', email: 'salon@groway.co.za', name: 'Salon Manager', role: 'merchant' },
    { id: 'user-restaurant', email: 'restaurant@groway.co.za', name: 'Restaurant Owner', role: 'merchant' },
    { id: 'user-spaza', email: 'spaza@groway.co.za', name: 'Spaza Shop', role: 'merchant' },
    { id: 'user-barber', email: 'barber@groway.co.za', name: 'Barber Shop', role: 'merchant' },
    { id: 'user-admin', email: 'admin@groway.co.za', name: 'Admin User', role: 'admin' },
  ];
  
  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        id: user.id,
        email: user.email,
        name: user.name,
        passwordHash,
        role: user.role,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }
  console.log(`Created ${users.length} demo users\n`);
  
  // 2. Create merchants
  console.log('Creating merchants...');
  const merchants = [
    { id: 'merchant-food', code: 'REST001', name: 'Demo Restaurant', tradingName: 'Demo Restaurant', vertical: 'food_beverage', email: 'restaurant@groway.co.za' },
    { id: 'merchant-salon', code: 'SAL001', name: 'Demo Salon', tradingName: 'Demo Salon', vertical: 'salon_spa', email: 'salon@groway.co.za' },
    { id: 'merchant-barber', code: 'BAR001', name: 'Demo Barber Shop', tradingName: 'Demo Barber', vertical: 'barber', email: 'barber@groway.co.za' },
    { id: 'merchant-retail', code: 'SHP001', name: 'Demo Spaza Shop', tradingName: 'Demo Spaza', vertical: 'retail', email: 'spaza@groway.co.za' },
    { id: 'merchant-grocery', code: 'GRO001', name: 'Demo Grocery Store', tradingName: 'Demo Grocery', vertical: 'grocery', email: 'demo@groway.co.za' },
  ];
  
  for (const m of merchants) {
    await prisma.merchant.upsert({
      where: { id: m.id },
      update: {},
      create: {
        id: m.id,
        code: m.code,
        name: m.name,
        tradingName: m.tradingName,
        vertical: m.vertical,
        email: m.email,
        phone: '+27123456789',
        addressLine1: '123 Business Street',
        city: 'Johannesburg',
        province: 'Gauteng',
        postalCode: '2000',
        currency: 'ZAR',
        timezone: 'Africa/Johannesburg',
        status: 'active',
        plan: 'professional',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    
    // Create branch
    await prisma.branch.upsert({
      where: { id: `branch-${m.id}` },
      update: {},
      create: {
        id: `branch-${m.id}`,
        merchantId: m.id,
        code: `${m.code}-BR1`,
        name: `${m.name} - Main`,
        addressLine1: '123 Business Street',
        city: 'Johannesburg',
        province: 'Gauteng',
        postalCode: '2000',
        phone: '+27123456789',
        email: m.email,
        isActive: true,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }
  console.log(`Created ${merchants.length} merchants with branches\n`);
  
  // 3. Create suppliers (350)
  console.log('Creating 350 suppliers...');
  const supplierNames = [
    'South African Breweries', 'Clover Industries', 'Tiger Brands', 'Pioneer Foods', 'RCL Foods',
    'Rainbow Chicken', 'Astral Foods', 'Woolworths Suppliers', 'Shoprite Distribution', 'Pick n Pay Distribution',
    'Massmart Wholesale', 'Bidvest Group', 'Imperial Logistics', 'Barloworld', 'Bidcorp',
    'Nampak', 'Mondi Group', 'Sappi', 'Sasol', 'Engen Petroleum',
  ];
  
  let supplierCount = 0;
  for (let i = 1; i <= 350; i++) {
    const nameIndex = (i - 1) % supplierNames.length;
    const name = i <= supplierNames.length ? supplierNames[nameIndex] : `${supplierNames[nameIndex]} ${Math.ceil(i / supplierNames.length)}`;
    
    try {
      await prisma.supplier.create({
        data: {
          id: `supplier-${i}`,
          name,
          code: `SUP${String(i).padStart(4, '0')}`,
          contactPerson: `Contact ${i}`,
          email: `supplier${i}@example.com`,
          phone: `+27${Math.floor(Math.random() * 900000000) + 100000000}`,
          address: `${i} Supplier Street`,
          city: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth'][i % 5],
          province: ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State'][i % 5],
          postalCode: String(1000 + (i % 9000)),
          supplierType: ['distributor', 'manufacturer', 'wholesaler'][i % 3],
          tier: ['bronze', 'silver', 'gold', 'platinum'][i % 4],
          rating: Number((Math.random() * 2 + 3).toFixed(1)),
          deliveryDays: Math.floor(Math.random() * 7) + 1,
          minOrderValue: Math.floor(Math.random() * 1000) + 100,
          paymentTerms: ['net30', 'net60', 'cod'][i % 3],
          status: i <= 300 ? 'active' : 'pending',
          verificationStatus: i <= 200 ? 'verified' : 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      supplierCount++;
    } catch (e) {
      // Skip duplicates
    }
  }
  console.log(`Created ${supplierCount} suppliers\n`);
  
  // 4. Create Supplier Products (150)
  console.log('Creating 150 supplier products...');
  const productNames = [
    'Rice 5kg', 'Flour 10kg', 'Sugar 2kg', 'Cooking Oil 2L', 'Pasta 500g',
    'Milk 1L', 'Bread Loaf', 'Chicken 1kg', 'Beef Mince 500g', 'Apples 1kg',
    'Coffee 250g', 'Tea Bags 100s', 'Cola 2L', 'Detergent 2kg', 'Soap 6-pack',
  ];
  
  let productCount = 0;
  for (let i = 1; i <= 150; i++) {
    const nameIndex = (i - 1) % productNames.length;
    const name = i <= productNames.length ? productNames[nameIndex] : `${productNames[nameIndex]} ${Math.ceil(i / productNames.length)}`;
    const supplierId = `supplier-${((i - 1) % 350) + 1}`;
    
    try {
      await prisma.supplierProduct.create({
        data: {
          id: `sprod-${i}`,
          supplierId,
          sku: `SKU-${String(i).padStart(6, '0')}`,
          name,
          description: `High quality ${name.toLowerCase()}`,
          category: ['Beverages', 'Dairy', 'Bakery', 'Meat', 'Produce', 'Dry Goods', 'Household'][i % 7],
          unit: ['each', 'kg', 'L', 'pack'][i % 4],
          basePrice: Number((Math.random() * 500 + 10).toFixed(2)),
          costPrice: Number((Math.random() * 400 + 5).toFixed(2)),
          minOrderQty: Math.floor(Math.random() * 10) + 1,
          leadTime: Math.floor(Math.random() * 7) + 1,
          inStock: Math.random() > 0.1,
          stockQty: Math.floor(Math.random() * 1000),
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      productCount++;
    } catch (e) {
      // Skip duplicates
    }
  }
  console.log(`Created ${productCount} supplier products\n`);
  
  // 5. Create kitchen stations
  console.log('Creating kitchen stations...');
  const stations = [
    { id: 'station-grill', name: 'Grill Station', type: 'hot', color: '#ef4444', sortOrder: 1 },
    { id: 'station-fryer', name: 'Fryer Station', type: 'hot', color: '#f97316', sortOrder: 2 },
    { id: 'station-cold', name: 'Cold Station', type: 'cold', color: '#06b6d4', sortOrder: 3 },
    { id: 'station-dessert', name: 'Dessert Station', type: 'cold', color: '#a855f7', sortOrder: 4 },
    { id: 'station-bar-hot', name: 'Bar - Hot Drinks', type: 'bar', color: '#84cc16', sortOrder: 5 },
    { id: 'station-bar-cold', name: 'Bar - Cold Drinks', type: 'bar', color: '#22c55e', sortOrder: 6 },
    { id: 'station-salad', name: 'Salad Station', type: 'cold', color: '#10b981', sortOrder: 7 },
    { id: 'station-pizza', name: 'Pizza Station', type: 'hot', color: '#f59e0b', sortOrder: 8 },
  ];
  
  for (const s of stations) {
    try {
      await prisma.kitchenStation.create({
        data: {
          id: s.id,
          merchantId: 'merchant-food',
          branchId: 'branch-merchant-food',
          name: s.name,
          type: s.type,
          color: s.color,
          sortOrder: s.sortOrder,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } catch (e) {
      // Skip
    }
  }
  console.log(`Created ${stations.length} kitchen stations\n`);
  
  // 6. Create floor sections
  console.log('Creating floor sections...');
  const sections = [
    { id: 'section-indoor', name: 'Indoor Dining', color: '#3b82f6', sortOrder: 1 },
    { id: 'section-outdoor', name: 'Outdoor Patio', color: '#22c55e', sortOrder: 2 },
    { id: 'section-vip', name: 'VIP Area', color: '#a855f7', sortOrder: 3 },
    { id: 'section-bar', name: 'Bar Area', color: '#f59e0b', sortOrder: 4 },
    { id: 'section-private', name: 'Private Room', color: '#ef4444', sortOrder: 5 },
  ];
  
  for (const sec of sections) {
    try {
      await prisma.floorSection.create({
        data: {
          id: sec.id,
          merchantId: 'merchant-food',
          branchId: 'branch-merchant-food',
          name: sec.name,
          color: sec.color,
          sortOrder: sec.sortOrder,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } catch (e) {
      // Skip
    }
  }
  console.log(`Created ${sections.length} floor sections\n`);
  
  // 7. Create restaurant tables (10 per section)
  console.log('Creating restaurant tables...');
  let tableCount = 0;
  for (const sec of sections) {
    for (let i = 1; i <= 10; i++) {
      try {
        await prisma.restaurantTable.create({
          data: {
            id: `table-${sec.id}-${i}`,
            merchantId: 'merchant-food',
            branchId: 'branch-merchant-food',
            sectionId: sec.id,
            number: `${sec.name.charAt(0)}${i}`,
            capacity: [2, 4, 6, 8][i % 4],
            shape: ['square', 'round', 'rectangle'][i % 3],
            status: 'available',
            positionX: (i % 5) * 100 + 50,
            positionY: Math.floor(i / 5) * 100 + 50,
            width: 80,
            height: 80,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        tableCount++;
      } catch (e) {
        // Skip
      }
    }
  }
  console.log(`Created ${tableCount} restaurant tables\n`);
  
  // 8. Update consumer wallet with R 12,450.00 balance
  console.log('Updating consumer wallet...');
  try {
    let consumerUser = await prisma.consumerUser.findFirst();
    
    if (!consumerUser) {
      consumerUser = await prisma.consumerUser.create({
        data: {
          id: 'consumer-demo-001',
          phone: '+27820000001',
          email: 'demo@wallet.co.za',
          firstName: 'Demo',
          lastName: 'User',
          idType: 'passport',
          nationality: 'South African',
          kycLevel: 'full',
          kycStatus: 'verified',
          kycVerifiedAt: new Date(),
          failedPinAttempts: 0,
          languagePreference: 'en',
          accountStatus: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }
    
    // R 12,450.00 = 1,245,000 cents
    const balanceCents = BigInt(1245000);
    
    await prisma.consumerWallet.upsert({
      where: { userId: consumerUser.id },
      update: {
        balanceCents,
        reservedCents: BigInt(0),
        pendingCents: BigInt(0),
        currency: 'ZAR',
        updatedAt: new Date(),
      },
      create: {
        id: 'wallet-demo-001',
        userId: consumerUser.id,
        balanceCents,
        reservedCents: BigInt(0),
        pendingCents: BigInt(0),
        currency: 'ZAR',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log('Consumer wallet updated with R 12,450.00\n');
  } catch (e) {
    console.log('Wallet update error:', (e as Error).message);
  }
  
  // 9. Create wholesalers
  console.log('Creating wholesalers...');
  for (let i = 1; i <= 10; i++) {
    try {
      await prisma.wholesaler.create({
        data: {
          id: `wholesaler-${i}`,
          name: `Wholesaler ${i}`,
          contactEmail: `wholesaler${i}@example.com`,
          contactPhone: `+27${Math.floor(Math.random() * 900000000) + 100000000}`,
          address: `${i} Wholesaler Street`,
          city: ['Johannesburg', 'Cape Town', 'Durban'][i % 3],
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } catch (e) {
      // Skip
    }
  }
  console.log('Created 10 wholesalers\n');
  
  // Final count
  console.log('=== Final Database Counts ===');
  const counts = {
    Users: await prisma.user.count(),
    Merchants: await prisma.merchant.count(),
    Branches: await prisma.branch.count(),
    Suppliers: await prisma.supplier.count(),
    SupplierProducts: await prisma.supplierProduct.count(),
    ConsumerUsers: await prisma.consumerUser.count(),
    ConsumerWallets: await prisma.consumerWallet.count(),
    KitchenStations: await prisma.kitchenStation.count(),
    FloorSections: await prisma.floorSection.count(),
    RestaurantTables: await prisma.restaurantTable.count(),
    Wholesalers: await prisma.wholesaler.count(),
  };
  
  console.table(counts);
  console.log('\nSeed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
