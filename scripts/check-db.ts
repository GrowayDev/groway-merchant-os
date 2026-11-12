import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking database counts...\n');
  
  const tables = [
    { name: 'User', model: prisma.user },
    { name: 'Merchant', model: prisma.merchant },
    { name: 'Supplier', model: prisma.supplier },
    { name: 'CatalogProduct', model: prisma.catalogProduct },
    { name: 'ConsumerUser', model: prisma.consumerUser },
    { name: 'ConsumerWallet', model: prisma.consumerWallet },
    { name: 'Branch', model: prisma.branch },
    { name: 'Wholesaler', model: prisma.wholesaler },
    { name: 'Product', model: prisma.product },
    { name: 'KitchenStation', model: prisma.kitchenStation },
    { name: 'FloorSection', model: prisma.floorSection },
    { name: 'RestaurantTable', model: prisma.restaurantTable },
  ];
  
  for (const table of tables) {
    try {
      const count = await table.model.count();
      console.log(`${table.name}: ${count}`);
    } catch (e) {
      console.log(`${table.name}: ERROR - ${(e as Error).message}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
