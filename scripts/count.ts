import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() { console.log('Suppliers:', await db.supplier.count()); console.log('CatalogProducts:', await db.catalogProduct.count()) }
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
