import { PrismaClient } from '@prisma/client'
import { nanoid } from 'nanoid'
const db = new PrismaClient()
async function main() {
  const u = await db.user.findUnique({ where: { email: 'spaza@groway.co.za' } })
  const m = await db.merchant.findFirst({ where: { email: 'spaza@groway.co.za' } })
  console.log('user id:', u?.id)
  console.log('merchant id:', m?.id)
  // Try creating MerchantUser with just the minimum fields
  try {
    const mu = await db.merchantUser.create({
      data: {
        id: `mu_test_${nanoid(8)}`,
        merchantId: m!.id,
        userId: u!.id,
        role: 'owner',
        updatedAt: new Date(),
      }
    })
    console.log('SUCCESS! MU created:', mu.id)
  } catch (e: any) {
    console.log('FAILED:', e.message?.substring(0, 200))
    console.log('Code:', e.code)
    console.log('Meta:', JSON.stringify(e.meta))
  }
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
