import { db } from '../src/lib/db'

async function check() {
  const count = await db.supplier.count()
  console.log('Total suppliers:', count)
  
  const wholesalers = await db.supplier.findMany({
    where: { supplierType: 'wholesaler' },
    take: 5
  })
  console.log('Sample wholesalers:', wholesalers.map((s: any) => ({ name: s.name, type: s.supplierType, tier: s.tier, city: s.city })))
  
  const byType = await db.supplier.groupBy({
    by: ['supplierType'],
    _count: true
  })
  console.log('By supplier type:', byType)
  
  await db.$disconnect()
}

check()
