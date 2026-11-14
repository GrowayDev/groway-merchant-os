import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  const spaza = await db.user.findUnique({ where: { email: 'spaza@groway.co.za' } })
  console.log('spaza user id:', spaza?.id)
  const mu = await db.merchantUser.findMany({ where: { userId: spaza?.id || 'x' } })
  console.log('MerchantUser records:', mu.length)
  mu.forEach((m, i) => console.log(`  [${i}] merchantId=${m.merchantId} userId=${m.userId} isActive=${m.isActive}`))
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
