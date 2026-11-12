import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'
import * as fs from 'fs'

const prisma = new PrismaClient()

// Wholesaler data from the index sheet
const WHOLESALER_INFO: Record<string, { type: string; description: string; website?: string }> = {
  'Makro': { type: 'cash_and_carry', description: 'All SA branches - Full range wholesale', website: 'makro.co.za' },
  'Jumbo Cash & Carry': { type: 'cash_and_carry', description: 'Trade-only. Spaza & tuck shop focus', website: 'jumbo.co.za' },
  'Shoprite Cash & Carry': { type: 'cash_and_carry', description: 'All branches + online Traders Card app', website: 'shoprite.co.za' },
  'Bidfood SA': { type: 'foodservice', description: 'All depots - Account holders only. Cold chain', website: 'bidfood.co.za' },
  'Africa Cash & Carry': { type: 'cash_and_carry', description: 'Crown Mines JHB - 11,500m² floor. Township hair care', website: 'africacc.co.za' },
  'Devland Cash & Carry': { type: 'cash_and_carry', description: '20+ branches nationwide. Township FMCG staples', website: 'devland.co.za' },
  'SPAR Wholesale (SSA)': { type: 'distributor', description: 'All DCs - Members only. Volume-tiered pricing', website: 'spar.co.za' },
  'Metcash Trading Africa': { type: 'distributor', description: 'Shield brand - VBA member pricing', website: 'metcash.co.za' },
  'Freddy Hirsch Group': { type: 'specialist', description: 'National trade accounts - Meat spices, casings. SABS, HACCP certified', website: 'freddyhirsch.co.za' },
  'Norman Goodfellows': { type: 'specialist', description: 'Premium wine & spirits specialist', website: 'normangoodfellows.co.za' },
  'Dibsons Wholesalers': { type: 'specialist', description: 'Confectionery specialist', website: 'dibsons.co.za' },
  'Arrow Cash & Carry': { type: 'cash_and_carry', description: 'Toiletries specialist', website: 'arrowcc.co.za' }
}

async function importWholesalers() {
  console.log('\n📦 Importing Wholesalers...')
  
  const wholesalers = Object.entries(WHOLESALER_INFO).map(([name, info], index) => ({
    name,
    code: `WS-${String(index + 1).padStart(3, '0')}`,
    type: info.type,
    description: info.description,
    website: info.website,
    branchCount: name === 'Makro' ? 22 : name === 'Devland Cash & Carry' ? 20 : 1,
    province: 'National',
    status: 'active'
  }))

  let created = 0
  for (const wholesaler of wholesalers) {
    try {
      await prisma.wholesaler.upsert({
        where: { name: wholesaler.name },
        update: wholesaler,
        create: wholesaler
      })
      created++
    } catch (error) {
      console.error(`Error creating wholesaler ${wholesaler.name}:`, error)
    }
  }
  
  console.log(`✅ Created/Updated ${created} wholesalers`)
  return await prisma.wholesaler.findMany()
}

async function importWholesaleProductList(wholesalers: any[]) {
  console.log('\n📦 Importing Wholesale ProductList...')
  
  const filePath = '/home/z/my-project/upload/Groway_Wholesale_ProductList_v1.0.xlsx'
  const workbook = XLSX.readFile(filePath)
  const sheetName = '📋 All Wholesalers (Master)'
  const worksheet = workbook.Sheets[sheetName]
  
  // Convert to JSON with header row
  const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
  
  // Find header row (row 3 has the actual headers)
  const headers = rawData[2] as string[]
  const dataRows = rawData.slice(3) as any[][]
  
  console.log(`Found ${dataRows.length} product rows`)
  
  // Create wholesaler lookup
  const wholesalerMap = new Map(wholesalers.map(w => [w.name, w]))
  
  let created = 0
  let skipped = 0
  
  for (const row of dataRows) {
    if (!row || !row[0]) continue
    
    const wholesalerName = String(row[0])
    const wholesaler = wholesalerMap.get(wholesalerName)
    
    if (!wholesaler) {
      skipped++
      continue
    }
    
    const pluCode = String(row[3] || '')
    const category = String(row[4] || '')
    const subCategory = String(row[5] || '')
    const description = String(row[6] || '')
    const brand = String(row[7] || '')
    const packSize = String(row[8] || '')
    const unit = String(row[9] || '')
    const vatStr = String(row[10] || '15%')
    const costPrice = parseFloat(String(row[11] || '0')) || 0
    const retailPrice = parseFloat(String(row[12] || '0')) || 0
    const grossMargin = parseFloat(String(row[13] || '0')) || 0
    const minOrderQty = String(row[14] || '1')
    const verticalsServed = String(row[15] || '')
    const notes = String(row[16] || '')
    
    // Parse VAT rate
    let vatRate = 15.0
    if (vatStr.includes('ZR') || vatStr.includes('0%')) {
      vatRate = 0
    } else if (vatStr.includes('15%')) {
      vatRate = 15.0
    }
    
    // Extract vertical from verticals served
    const verticals = verticalsServed.split(',').map(v => v.trim()).filter(Boolean)
    const primaryVertical = verticals[0] || category
    
    try {
      await prisma.catalogProduct.create({
        data: {
          sku: pluCode || `WS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          sourceType: 'wholesale',
          wholesalerId: wholesaler.id,
          vertical: primaryVertical,
          subVertical: subCategory,
          category: category,
          subCategory: subCategory,
          description: description,
          brand: brand || null,
          packSize: packSize,
          unit: unit || 'each',
          vatRate: vatRate,
          costPrice: costPrice,
          retailPrice: retailPrice,
          grossMargin: grossMargin * 100, // Convert to percentage
          minOrderQty: parseInt(minOrderQty.replace(/[^0-9]/g, '')) || 1,
          leadDays: wholesalerName.includes('Bidfood') ? 2 : 3,
          notes: notes || null,
          verticalsServed: verticals.length > 0 ? JSON.stringify(verticals) : null,
          status: 'active'
        }
      })
      created++
      
      if (created % 50 === 0) {
        console.log(`  Imported ${created} products...`)
      }
    } catch (error) {
      console.error(`Error creating product ${pluCode}:`, error)
      skipped++
    }
  }
  
  console.log(`✅ Created ${created} wholesale products, skipped ${skipped}`)
}

async function importSKUCatalog(suppliers: any[]) {
  console.log('\n📦 Importing SKU Catalog...')
  
  const filePath = '/home/z/my-project/upload/Groway_SKU_Catalog_All_Verticals_v1.0.xlsx'
  const workbook = XLSX.readFile(filePath)
  
  // Get all vertical sheets
  const verticalSheets = workbook.SheetNames.filter(name => 
    name.match(/^\d+\.\s/) || name === '1. Food & Beverage'
  )
  
  console.log(`Found ${verticalSheets.length} vertical sheets`)
  
  // Create supplier lookup
  const supplierMap = new Map(suppliers.map(s => [s.name.toLowerCase(), s]))
  
  let created = 0
  let skipped = 0
  
  for (const sheetName of verticalSheets) {
    console.log(`\n  Processing: ${sheetName}`)
    const worksheet = workbook.Sheets[sheetName]
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
    
    // Header row is row 3
    const headers = rawData[2] as string[]
    const dataRows = rawData.slice(3) as any[][]
    
    // Extract vertical name from sheet
    const verticalMatch = sheetName.match(/\d+\.\s+(.+)/)
    const verticalName = verticalMatch ? verticalMatch[1] : sheetName
    
    for (const row of dataRows) {
      if (!row || !row[0]) continue
      
      const skuCode = String(row[0] || '')
      if (!skuCode || !skuCode.match(/^[A-Z]{2,}-/)) {
        skipped++
        continue
      }
      
      const vertical = String(row[1] || verticalName)
      const subVertical = String(row[2] || '')
      const category = String(row[3] || '')
      const description = String(row[4] || '')
      const unit = String(row[5] || '')
      const packSize = String(row[6] || '')
      const vatStr = String(row[7] || '15%')
      const costPrice = parseFloat(String(row[8] || '0')) || 0
      const retailPrice = parseFloat(String(row[9] || '0')) || 0
      const grossMargin = parseFloat(String(row[10] || '0')) || 0
      const supplierName = String(row[11] || '')
      const supplierContact = String(row[12] || '')
      const tier = String(row[13] || 'Bronze')
      const leadDays = parseInt(String(row[14] || '3')) || 3
      const minOrderQty = parseInt(String(row[15] || '1')) || 1
      const notes = String(row[16] || '')
      
      // Find supplier
      const supplier = supplierMap.get(supplierName.toLowerCase())
      
      // Parse VAT rate
      let vatRate = 15.0
      if (vatStr.includes('ZR') || vatStr.includes('0%')) {
        vatRate = 0
      }
      
      try {
        await prisma.catalogProduct.create({
          data: {
            sku: skuCode,
            sourceType: 'sku_catalog',
            supplierId: supplier?.id || null,
            vertical: vertical,
            subVertical: subVertical,
            category: category,
            subCategory: null,
            description: description,
            brand: null,
            packSize: packSize,
            unit: unit || 'each',
            vatRate: vatRate,
            costPrice: costPrice,
            retailPrice: retailPrice,
            grossMargin: grossMargin * 100,
            minOrderQty: minOrderQty,
            leadDays: leadDays,
            notes: notes || null,
            status: 'active'
          }
        })
        created++
        
        if (created % 50 === 0) {
          console.log(`  Imported ${created} SKU products...`)
        }
      } catch (error) {
        skipped++
      }
    }
  }
  
  console.log(`✅ Created ${created} SKU catalog products, skipped ${skipped}`)
}

async function main() {
  console.log('🚀 Starting Catalog Import...')
  console.log('=' .repeat(60))
  
  // Clear existing catalog data
  console.log('\n🗑️  Clearing existing catalog data...')
  await prisma.catalogProduct.deleteMany({})
  await prisma.wholesaler.deleteMany({})
  
  // Import wholesalers first
  const wholesalers = await importWholesalers()
  
  // Import wholesale product list
  await importWholesaleProductList(wholesalers)
  
  // Get suppliers for SKU catalog
  const suppliers = await prisma.supplier.findMany()
  
  // Import SKU catalog
  await importSKUCatalog(suppliers)
  
  // Final count
  const totalProducts = await prisma.catalogProduct.count()
  const totalWholesalers = await prisma.wholesaler.count()
  
  console.log('\n' + '=' .repeat(60))
  console.log('📊 IMPORT SUMMARY')
  console.log('=' .repeat(60))
  console.log(`Wholesalers: ${totalWholesalers}`)
  console.log(`Total Products: ${totalProducts}`)
  console.log(`  - Wholesale: ${await prisma.catalogProduct.count({ where: { sourceType: 'wholesale' } })}`)
  console.log(`  - SKU Catalog: ${await prisma.catalogProduct.count({ where: { sourceType: 'sku_catalog' } })}`)
  console.log('\n✅ Import Complete!')
}

main()
  .catch((e) => {
    console.error('Error importing catalogs:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
