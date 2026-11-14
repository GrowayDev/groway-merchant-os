import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  const p = await db.product.findUnique({
    where: { id: 'prod_1794291030638_xlm92me' },
    select: { id: true, name: true, image: true, images: true }
  })
  console.log('Product:', p?.name)
  console.log('  image:', p?.image)
  console.log('  images:', p?.images)
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
