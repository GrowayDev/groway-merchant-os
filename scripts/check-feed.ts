import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  const suppliers = await db.supplier.count()
  const catalogProducts = await db.catalogProduct.count()
  console.log(`Suppliers: ${suppliers} (should be 0 in production — no auto-seed)`)
  console.log(`Catalog Products: ${catalogProducts} (should be 0 in production — no auto-seed)`)
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
