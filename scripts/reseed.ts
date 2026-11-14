import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  // Delete all demo data to force a clean re-seed
  console.log('Cleaning existing demo data...')
  await db.merchantUser.deleteMany({})
  await db.branch.deleteMany({})
  await db.merchant.deleteMany({ where: { email: { contains: '@groway.co.za' } } })
  await db.user.deleteMany({ where: { email: { contains: '@groway.co.za' } } })
  console.log('Cleaned. Now re-seeding...')
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
