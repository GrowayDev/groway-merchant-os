import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  const count = await db.employee.count()
  console.log('Total employees in DB:', count)
  const emps = await db.employee.findMany({ select: { name: true, merchantId: true } })
  emps.forEach(e => console.log(`  ${e.name} — merchantId: ${e.merchantId}`))
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
