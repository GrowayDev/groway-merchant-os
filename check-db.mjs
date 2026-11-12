import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const suppliers = await prisma.supplier.count()
  const catalogProducts = await prisma.catalogProduct.count()
  const consumers = await prisma.consumerUser.count()
  const merchants = await prisma.merchant.count()
  const adminUsers = await prisma.adminUser.count()
  const wholesaler = await prisma.wholesaler.count()
  
  console.log('=== Database Counts ===')
  console.log('Suppliers:', suppliers)
  console.log('Catalog Products:', catalogProducts)
  console.log('Consumers:', consumers)
  console.log('Merchants:', merchants)
  console.log('Admin Users:', adminUsers)
  console.log('Wholesalers:', wholesaler)
  console.log('======================')
}

main().catch(console.error).finally(() => prisma.$disconnect())
