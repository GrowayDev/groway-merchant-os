import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding remaining data...\n');
  
  // 1. Create kitchen stations
  console.log('Creating kitchen stations...');
  const stations = [
    { id: 'station-grill', name: 'Grill Station', icon: 'Flame', color: '#ef4444' },
    { id: 'station-fryer', name: 'Fryer Station', icon: 'Flame', color: '#f97316' },
    { id: 'station-cold', name: 'Cold Station', icon: 'Snowflake', color: '#06b6d4' },
    { id: 'station-dessert', name: 'Dessert Station', icon: 'Cake', color: '#a855f7' },
    { id: 'station-bar-hot', name: 'Bar - Hot Drinks', icon: 'Coffee', color: '#84cc16' },
    { id: 'station-bar-cold', name: 'Bar - Cold Drinks', icon: 'Wine', color: '#22c55e' },
    { id: 'station-salad', name: 'Salad Station', icon: 'Salad', color: '#10b981' },
    { id: 'station-pizza', name: 'Pizza Station', icon: 'Pizza', color: '#f59e0b' },
  ];
  
  for (const s of stations) {
    try {
      await prisma.kitchenStation.create({
        data: {
          id: s.id,
          name: s.name,
          icon: s.icon,
          color: s.color,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } catch (e) {
      // Skip
    }
  }
  console.log(`Created ${await prisma.kitchenStation.count()} kitchen stations\n`);
  
  // 2. Create floor sections
  console.log('Creating floor sections...');
  const sections = [
    { id: 'section-indoor', name: 'Indoor Dining', color: '#3b82f6' },
    { id: 'section-outdoor', name: 'Outdoor Patio', color: '#22c55e' },
    { id: 'section-vip', name: 'VIP Area', color: '#a855f7' },
    { id: 'section-bar', name: 'Bar Area', color: '#f59e0b' },
    { id: 'section-private', name: 'Private Room', color: '#ef4444' },
  ];
  
  for (const sec of sections) {
    try {
      await prisma.floorSection.create({
        data: {
          id: sec.id,
          name: sec.name,
          color: sec.color,
          merchantId: 'merchant-food',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } catch (e) {
      // Skip
    }
  }
  console.log(`Created ${await prisma.floorSection.count()} floor sections\n`);
  
  // 3. Create restaurant tables (10 per section)
  console.log('Creating restaurant tables...');
  let tableCount = 0;
  for (const sec of sections) {
    for (let i = 1; i <= 10; i++) {
      try {
        await prisma.restaurantTable.create({
          data: {
            id: `table-${sec.id}-${i}`,
            number: `${sec.name.charAt(0)}${i}`,
            shape: ['square', 'round', 'rectangle'][i % 3],
            x: (i % 5) * 100 + 50,
            y: Math.floor(i / 5) * 100 + 50,
            width: 80,
            height: 80,
            seats: [2, 4, 6, 8][i % 4],
            status: 'available',
            sectionId: sec.id,
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
  
  // 4. Create wholesalers
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
  console.log(`Created ${await prisma.wholesaler.count()} wholesalers\n`);
  
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
