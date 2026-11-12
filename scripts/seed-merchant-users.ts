import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating merchant-user links...\n');
  
  // Create merchant-user relationships
  const merchantUsers = [
    { userId: 'user-demo', merchantId: 'merchant-grocery', role: 'owner', branchId: 'branch-merchant-grocery' },
    { userId: 'user-salon', merchantId: 'merchant-salon', role: 'owner', branchId: 'branch-merchant-salon' },
    { userId: 'user-restaurant', merchantId: 'merchant-food', role: 'owner', branchId: 'branch-merchant-food' },
    { userId: 'user-spaza', merchantId: 'merchant-retail', role: 'owner', branchId: 'branch-merchant-retail' },
    { userId: 'user-barber', merchantId: 'merchant-barber', role: 'owner', branchId: 'branch-merchant-barber' },
    { userId: 'user-admin', merchantId: 'merchant-grocery', role: 'admin', branchId: 'branch-merchant-grocery' },
  ];
  
  for (const mu of merchantUsers) {
    try {
      await prisma.merchantUser.upsert({
        where: { id: `mu-${mu.userId}-${mu.merchantId}` },
        update: {},
        create: {
          id: `mu-${mu.userId}-${mu.merchantId}`,
          userId: mu.userId,
          merchantId: mu.merchantId,
          role: mu.role,
          branchId: mu.branchId,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      console.log(`Created merchant user: ${mu.userId} -> ${mu.merchantId}`);
    } catch (e) {
      console.log(`Error creating merchant user: ${(e as Error).message}`);
    }
  }
  
  // Also set up PIN for demo users (1234)
  const pinHash = await hash('1234', 10);
  
  for (const user of ['user-demo', 'user-salon', 'user-restaurant', 'user-spaza', 'user-barber']) {
    try {
      await prisma.user.update({
        where: { id: user },
        data: { pinHash },
      });
      console.log(`Set PIN for ${user}`);
    } catch (e) {
      console.log(`Error setting PIN: ${(e as Error).message}`);
    }
  }
  
  console.log('\nMerchant users created successfully!');
  console.log('Final count:', await prisma.merchantUser.count());
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
