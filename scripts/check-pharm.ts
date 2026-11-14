import { PrismaClient } from '@prisma/client'
import { hash, compare } from 'bcryptjs'
const db = new PrismaClient()
async function main() {
  const u = await db.user.findUnique({ where: { email: 'pharmacy@groway.co.za' } })
  console.log('User:', u?.email)
  console.log('  passwordHash:', u?.passwordHash ? `${u.passwordHash.substring(0,20)}... (len ${u.passwordHash.length})` : 'MISSING/NULL')
  console.log('  lockedUntil:', u?.lockedUntil)
  console.log('  loginAttempts:', u?.loginAttempts)

  if (u?.passwordHash) {
    const match = await compare('demo1234', u.passwordHash)
    console.log('  password "demo1234" matches:', match)
  }

  // Also test a known-working user for comparison
  const spaza = await db.user.findUnique({ where: { email: 'spaza@groway.co.za' } })
  console.log('Spaza user hash len:', spaza?.passwordHash?.length, 'prefix:', spaza?.passwordHash?.substring(0,20))
  if (spaza?.passwordHash) {
    const match = await compare('demo1234', spaza.passwordHash)
    console.log('  spaza password matches:', match)
  }
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
