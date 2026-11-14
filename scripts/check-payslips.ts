import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  const count = await db.payslip.count()
  console.log('Total payslips:', count)
  const ps = await db.payslip.findMany({ include: { employee: { select: { name: true } } } })
  ps.forEach(p => console.log(`  ${p.employee.name}: gross=R${p.totalEarnings} PAYE=R${p.payeTax} UIF=R${p.uif} net=R${p.netPay} merchantId=${p.merchantId}`))
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
