import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  const m = await db.merchant.findFirst({ where: { email: 'spaza@groway.co.za' }, include: { MerchantUser: true } })
  console.log('spaza merchant:', { id: m?.id, name: m?.name, MerchantUser: m?.MerchantUser?.length })
  if (m?.MerchantUser?.[0]) {
    console.log('  MerchantUser merchantId:', m.MerchantUser[0].merchantId)
  }
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
