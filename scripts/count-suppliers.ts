import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  const suppliers = await db.supplier.count()
  const products = await db.catalogProduct.count()
  console.log(`Suppliers: ${suppliers}, Catalog Products: ${products}`)
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
