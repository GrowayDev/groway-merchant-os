import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  console.log('Users:', await db.user.count().catch(() => 'ERR'))
  console.log('Merchants:', await db.merchant.count().catch(() => 'ERR'))
  console.log('Suppliers:', await db.supplier.count().catch(() => 'ERR'))
  console.log('CatalogProducts:', await db.catalogProduct.count().catch(() => 'ERR'))
  console.log('SapeProducts:', await db.sapeProduct.count().catch(() => 'ERR'))
  console.log('Employees:', await db.employee.count().catch(() => 'ERR'))
  console.log('Payslips:', await db.payslip.count().catch(() => 'ERR'))
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
