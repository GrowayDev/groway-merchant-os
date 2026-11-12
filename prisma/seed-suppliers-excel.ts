import { PrismaClient } from '@prisma/client'
import { nanoid } from 'nanoid'

const prisma = new PrismaClient()

// Load suppliers data
// eslint-disable-next-line @typescript-eslint/no-require-imports
const suppliersData = require('./suppliers-from-excel.json')

// Map vertical names to match our system
const verticalMapping: Record<string, string> = {
  'Food & Bev': 'Food & Beverage',
  'Food & Beverage': 'Food & Beverage',
  'Liquor & Nightlife': 'Liquor & Nightlife',
  'Grocery & FMCG': 'Grocery & FMCG',
  'Health & Beauty': 'Health & Beauty',
  'Fashion & Apparel': 'Fashion & Apparel',
  'Health & Pharmacy': 'Health & Pharmacy',
  'Hospitality': 'Hospitality',
  'Hardware & Building': 'Hardware & Building',
  'Electronics & Tech': 'Electronics & Tech',
  'Sport & Leisure': 'Sport & Leisure',
  'Childcare & Education': 'Childcare & Education',
  'Professional Services': 'Professional Services',
}

// Parse verticals from comma-separated string
function parseVerticals(verticalsStr: string): string[] {
  if (!verticalsStr) return []
  
  const verticals = verticalsStr.split(',').map(v => v.trim())
  const mappedVerticals: string[] = []
  
  for (const v of verticals) {
    const mapped = verticalMapping[v]
    if (mapped && !mappedVerticals.includes(mapped)) {
      mappedVerticals.push(mapped)
    }
  }
  
  return mappedVerticals
}

// Determine supplier type based on name and verticals
function determineSupplierType(name: string, verticals: string[]): string {
  const nameLower = name.toLowerCase()
  
  if (nameLower.includes('farm') || nameLower.includes('fresh') || nameLower.includes('agri')) {
    return 'farmer'
  }
  if (nameLower.includes('import') || nameLower.includes('distribut')) {
    return 'distributor'
  }
  if (nameLower.includes('manufactur') || nameLower.includes('industrial') || 
      nameLower.includes('breweries') || nameLower.includes('pharmacare') ||
      nameLower.includes('foods') && !nameLower.includes('fresh')) {
    return 'manufacturer'
  }
  if (nameLower.includes('wholesale') || nameLower.includes('cash') || nameLower.includes('trade')) {
    return 'wholesaler'
  }
  
  // Default based on verticals
  if (verticals.includes('Food & Beverage') || verticals.includes('Grocery & FMCG')) {
    return 'distributor'
  }
  
  return 'distributor'
}

// Map tier strings
function mapTier(tier: string): string {
  const tierLower = tier?.toLowerCase() || 'bronze'
  if (['platinum', 'gold', 'silver', 'bronze'].includes(tierLower)) {
    return tierLower
  }
  return 'bronze'
}

// Generate unique supplier code
function generateSupplierCode(name: string, index: number): string {
  const prefix = name.substring(0, 3).toUpperCase()
  const suffix = nanoid(4).toUpperCase()
  return `SUP-${prefix}-${suffix}`
}

async function main() {
  console.log('Starting supplier import from Excel...')
  console.log(`Total suppliers to import: ${suppliersData.length}`)

  // Clear existing suppliers
  console.log('Clearing existing suppliers...')
  await prisma.supplierDocument.deleteMany({})
  await prisma.supplier.deleteMany({})
  console.log('Existing suppliers cleared.')

  // Import suppliers
  let imported = 0
  let skipped = 0

  for (let i = 0; i < suppliersData.length; i++) {
    const data = suppliersData[i] as {
      name: string
      website?: string
      verticals?: string
      tier: string
      bbbeeLevel?: number
      leadDays: number
      minOrder?: string
      notes?: string
    }

    if (!data.name) {
      skipped++
      continue
    }

    try {
      const verticals = parseVerticals(data.verticals || '')
      const supplierType = determineSupplierType(data.name, verticals)
      const tier = mapTier(data.tier)
      const code = generateSupplierCode(data.name, i)

      // Create website URL if not already a URL
      let website = data.website || null
      if (website && !website.startsWith('http')) {
        website = `https://${website}`
      }

      await prisma.supplier.create({
        data: {
          id: `sup_${nanoid(12)}`,
          code,
          name: data.name,
          website,
          tier,
          bbbeeLevel: data.bbbeeLevel || null,
          deliveryDays: data.leadDays || 3,
          minOrderUnit: data.minOrder || null,
          supplierType,
          categories: null,
          verticals: verticals.length > 0 ? JSON.stringify(verticals) : null,
          subVerticals: null,
          fulfillmentRate: 95.0 + Math.random() * 5, // 95-100%
          rating: 4.0 + Math.random() * 1, // 4.0-5.0
          reviewCount: Math.floor(Math.random() * 200) + 10, // 10-210 reviews
          notes: data.notes || null,
          status: 'active',
          verificationStatus: 'verified',
          updatedAt: new Date(),
        },
      })
      imported++

      if (imported % 50 === 0) {
        console.log(`Imported ${imported} suppliers...`)
      }
    } catch (error) {
      console.error(`Error importing supplier: ${data.name}`, error)
      skipped++
    }
  }

  console.log('\n=== Import Complete ===')
  console.log(`Total imported: ${imported}`)
  console.log(`Skipped: ${skipped}`)

  // Verify count
  const count = await prisma.supplier.count()
  console.log(`\nTotal suppliers in database: ${count}`)

  // Show sample suppliers by tier
  const goldCount = await prisma.supplier.count({ where: { tier: 'gold' } })
  const silverCount = await prisma.supplier.count({ where: { tier: 'silver' } })
  const bronzeCount = await prisma.supplier.count({ where: { tier: 'bronze' } })
  const platinumCount = await prisma.supplier.count({ where: { tier: 'platinum' } })

  console.log('\nBy Tier:')
  console.log(`  Platinum: ${platinumCount}`)
  console.log(`  Gold: ${goldCount}`)
  console.log(`  Silver: ${silverCount}`)
  console.log(`  Bronze: ${bronzeCount}`)

  // Show vertical distribution
  const allSuppliers = await prisma.supplier.findMany({
    select: { verticals: true },
  })

  const verticalCount: Record<string, number> = {}
  for (const s of allSuppliers) {
    if (s.verticals) {
      const verts = JSON.parse(s.verticals) as string[]
      for (const v of verts) {
        verticalCount[v] = (verticalCount[v] || 0) + 1
      }
    }
  }

  console.log('\nBy Vertical:')
  for (const [vertical, cnt] of Object.entries(verticalCount).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${vertical}: ${cnt}`)
  }
}

main()
  .catch((e) => {
    console.error('Error during import:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
