import { PrismaClient } from '@prisma/client'
import { nanoid } from 'nanoid'
const db = new PrismaClient()
async function main() {
  const merchant = await db.merchant.findFirst({ where: { email: 'spaza@groway.co.za' } })
  if (!merchant) { console.log('No spaza merchant found'); return }
  const existing = await db.employee.count({ where: { merchantId: merchant.id } })
  if (existing > 0) { console.log(`Already ${existing} employees`); return }
  const employees = [
    { name: 'Thandiwe Nkosi', role: 'Manager', monthlySalary: 25000, employmentType: 'permanent', department: 'Operations' },
    { name: 'Sipho Mthembu', role: 'Cashier', monthlySalary: 8500, employmentType: 'permanent', department: 'Front of House' },
    { name: 'Lerato Dlamini', role: 'Shop Assistant', monthlySalary: 6500, employmentType: 'permanent', department: 'Sales' },
    { name: 'Bongani Khumalo', role: 'Stock Controller', monthlySalary: 9500, employmentType: 'permanent', department: 'Inventory' },
    { name: 'Nomsa Zulu', role: 'Cleaner', monthlySalary: 4500, employmentType: 'casual', department: 'Maintenance' },
  ]
  for (const e of employees) {
    await db.employee.create({
      data: { id: `emp_${nanoid(10)}`, merchantId: merchant.id, ...e, payFrequency: 'monthly', updatedAt: new Date() }
    })
    console.log(`  ✓ Created: ${e.name} (${e.role}) — R${e.monthlySalary}/month`)
  }
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
