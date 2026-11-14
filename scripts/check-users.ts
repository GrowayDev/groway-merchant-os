import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  const count = await db.user.count()
  console.log('Total users:', count)
  const spaza = await db.user.findUnique({ where: { email: 'spaza@groway.co.za' } })
  console.log('spaza user:', spaza ? 'FOUND' : 'NOT FOUND')
  if (spaza) {
    console.log('  passwordHash length:', spaza.passwordHash?.length)
  }
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
