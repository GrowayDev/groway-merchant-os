import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const supplierCount = await prisma.supplier.count()
    const catalogCount = await prisma.catalogProduct.count()
    console.log(`Suppliers: ${supplierCount}`)
    console.log(`Catalog Products: ${catalogCount}`)
  } catch (e) {
    console.error('Error:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
