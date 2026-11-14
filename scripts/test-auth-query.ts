import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  const dbUser = await db.user.findUnique({
    where: { email: 'spaza@groway.co.za' },
    include: {
      MerchantUser: {
        where: { isActive: true },
        include: {
          Merchant: {
            include: {
              Branch: {
                where: { isActive: true },
                take: 1
              }
            }
          }
        }
      }
    }
  })
  console.log('User found:', !!dbUser)
  console.log('MerchantUser count:', dbUser?.MerchantUser?.length || 0)
  if (dbUser?.MerchantUser?.[0]) {
    console.log('Merchant:', dbUser.MerchantUser[0].Merchant?.name)
    console.log('Merchant ID:', dbUser.MerchantUser[0].Merchant?.id)
  }
}
main().then(() => process.exit(0)).catch(e => { console.error('QUERY ERROR:', e); process.exit(1) })
