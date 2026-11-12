import { PrismaClient } from '@prisma/client'
import { nanoid } from 'nanoid'

const prisma = new PrismaClient()

// South African wholesalers/retailers
const WHOLESALERS = [
  { name: 'Makro', code: 'MAKRO', type: 'cash_and_carry', branches: 22, province: 'National' },
  { name: 'Jumbo/CBW', code: 'JUMBO', type: 'cash_and_carry', branches: 45, province: 'National' },
  { name: 'Shoprite C&C', code: 'SHOPRITE-CC', type: 'cash_and_carry', branches: 68, province: 'National' },
  { name: 'Bidfood', code: 'BIDFOOD', type: 'foodservice', branches: 15, province: 'National' },
  { name: 'Africa C&C', code: 'AFRICA-CC', type: 'cash_and_carry', branches: 12, province: 'Gauteng' },
  { name: 'Devland', code: 'DEVLAND', type: 'cash_and_carry', branches: 8, province: 'Gauteng' },
  { name: 'SPAR Wholesale', code: 'SPAR-WS', type: 'distributor', branches: 6, province: 'National' },
  { name: 'Specialists', code: 'SPECIAL', type: 'specialist', branches: 10, province: 'National' }
]

const VERTICALS = [
  'Food & Beverage', 'Liquor & Nightlife', 'Grocery & FMCG', 'Health & Beauty',
  'Hardware & Building', 'Hospitality', 'Health & Pharmacy', 'Electronics & Tech'
]

const CATEGORIES: Record<string, string[]> = {
  'Food & Beverage': ['Fresh Produce', 'Dairy', 'Meat', 'Beverages', 'Dry Goods', 'Frozen Foods'],
  'Liquor & Nightlife': ['Spirits', 'Wine', 'Beer', 'Ciders', 'Mixers'],
  'Grocery & FMCG': ['Household', 'Personal Care', 'Cleaning', 'Confectionery'],
  'Health & Beauty': ['Haircare', 'Skincare', 'Cosmetics', 'Spa Equipment'],
  'Hardware & Building': ['Tools', 'Paint', 'Plumbing', 'Electrical'],
  'Hospitality': ['Linen', 'Toiletries', 'Cleaning Supplies', 'Kitchen Equipment'],
  'Health & Pharmacy': ['Medicines', 'Medical Equipment', 'First Aid', 'Vitamins'],
  'Electronics & Tech': ['Computers', 'Phones', 'Accessories', 'Audio']
}

const BRANDS = ['Clover', 'Danone', 'Coca-Cola', 'Distell', 'SAB', 'Unilever', 'Nivea', 'Bosch', 'Dulux', 'Adcock Ingram']

function generateSKU(code: string, i: number): string {
  return `${code}-${String(i).padStart(5, '0')}`
}

async function main() {
  console.log('Starting catalog seed...')
  
  // Seed wholesalers
  console.log('Seeding wholesalers...')
  for (const w of WHOLESALERS) {
    await prisma.wholesaler.upsert({
      where: { code: w.code },
      update: { updatedAt: new Date() },
      create: {
        id: `whl_${nanoid(12)}`,
        name: w.name,
        code: w.code,
        type: w.type,
        branchCount: w.branches,
        province: w.province,
        status: 'active',
        updatedAt: new Date()
      }
    })
  }
  console.log('Wholesalers seeded')
  
  // Get wholesalers
  const wholesalers = await prisma.wholesaler.findMany()
  
  // Seed products
  console.log('Seeding products...')
  let count = 0
  
  for (const w of wholesalers) {
    for (let i = 1; i <= 50; i++) {
      const vertical = VERTICALS[Math.floor(Math.random() * VERTICALS.length)]
      const categories = CATEGORIES[vertical] || ['General']
      const category = categories[Math.floor(Math.random() * categories.length)]
      const brand = BRANDS[Math.floor(Math.random() * BRANDS.length)]
      const costPrice = Math.round((Math.random() * 500 + 10) * 100) / 100
      const margin = Math.round((Math.random() * 0.4 + 0.15) * 100) / 100
      const retailPrice = Math.round(costPrice * (1 + margin) * 100) / 100
      
      try {
        await prisma.catalogProduct.create({
          data: {
            id: `cp_${nanoid(12)}`,
            sku: generateSKU(w.code, i),
            sourceType: 'wholesale',
            wholesalerId: w.id,
            vertical,
            category,
            description: `${brand} ${category} Product ${i}`,
            brand,
            packSize: '1x1',
            unit: 'each',
            vatRate: 15.0,
            costPrice,
            retailPrice,
            grossMargin: margin,
            minOrderQty: 1,
            leadDays: Math.floor(Math.random() * 7) + 1,
            inStock: Math.random() > 0.1,
            status: 'active',
            updatedAt: new Date()
          }
        })
        count++
      } catch {
        // Skip duplicates
      }
    }
  }
  
  console.log(`Seeded ${count} products`)
  
  const total = await prisma.catalogProduct.count()
  console.log(`Total products: ${total}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
