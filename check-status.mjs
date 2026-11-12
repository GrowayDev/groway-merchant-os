import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('=== DATABASE STATUS ===')
  console.log('Suppliers:', await prisma.supplier.count())
  console.log('Catalog Products:', await prisma.catalogProduct.count())
  console.log('Consumer Users:', await prisma.consumerUser.count())
  console.log('Merchants:', await prisma.merchant.count())
  console.log('Admin Users:', await prisma.adminUser.count())
  console.log('Wholesalers:', await prisma.wholesaler.count())
  console.log('Platform Tenants:', await prisma.platformTenant.count())
  console.log('Tenant Users:', await prisma.tenantUser.count())
  console.log('User Roles:', await prisma.userRole.count())
}

main().catch(console.error).finally(() => prisma.$disconnect())
