import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const products = await prisma.catalogProduct.count()
  const wholesalers = await prisma.wholesaler.count()
  console.log(`Catalog Products: ${products}`)
  console.log(`Wholesalers: ${wholesalers}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
