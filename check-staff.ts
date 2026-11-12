import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const staff = await prisma.restaurantStaff.findMany()
  console.log('Staff count:', staff.length)
  console.log('Staff:', JSON.stringify(staff, null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
