import { PrismaClient } from '@prisma/client'
import { nanoid } from 'nanoid'
const db = new PrismaClient()
async function main() {
  const users = await db.user.findMany({ where: { email: { contains: '@groway.co.za' } } })
  console.log(`Found ${users.length} demo users`)
  for (const u of users) {
    const m = await db.merchant.findFirst({ where: { email: u.email } })
    if (!m) { console.log(`  ${u.email}: no merchant`); continue }
    console.log(`  ${u.email}: user=${u.id} merchant=${m.id}`)
    const existingMU = await db.merchantUser.findFirst({ where: { userId: u.id, merchantId: m.id } })
    if (existingMU) { console.log(`    MU already exists: ${existingMU.id}`); continue }
    try {
      const mu = await db.merchantUser.create({
        data: {
          id: `mu_${nanoid(12)}`,
          merchantId: m.id,
          userId: u.id,
          role: 'owner',
          isActive: true,
          acceptedAt: new Date(),
          updatedAt: new Date(),
        }
      })
      console.log(`    created MU: ${mu.id}`)
    } catch (e: any) {
      console.log(`    FAILED: ${e.message?.substring(0, 100)}`)
    }
  }
}
main().then(() => process.exit(0)).catch(e => { console.error('FATAL:', e); process.exit(1) })
