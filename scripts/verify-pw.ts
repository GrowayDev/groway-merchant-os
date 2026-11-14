import { PrismaClient } from '@prisma/client'
import { compare } from 'bcryptjs'
const db = new PrismaClient()
async function main() {
  const u = await db.user.findUnique({ where: { email: 'spaza@groway.co.za' } })
  console.log('user:', u?.email, 'hash:', u?.passwordHash?.substring(0,20))
  if (u?.passwordHash) {
    const match = await compare('demo1234', u.passwordHash)
    console.log('password "demo1234" matches:', match)
  }
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
