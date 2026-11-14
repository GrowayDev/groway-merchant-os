import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  console.log('Suppliers:', await db.supplier.count())
  console.log('CatalogProducts:', await db.catalogProduct.count())
  console.log('Users:', await db.user.count())
  console.log('Merchants:', await db.merchant.count())
  console.log('Employees:', await db.employee.count())
  console.log('Payslips:', await db.payslip.count())
  console.log('GroCoreDecisions:', await db.groCoreDecision.count())
  console.log('SapeProducts:', await db.sapeProduct.count())
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
