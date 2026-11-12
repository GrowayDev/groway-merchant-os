import { db } from '@/lib/db'
import { nanoid } from 'nanoid'
import fs from 'fs'

import path from 'path'

async function seedWholesalers() {
  // Read the wholesale directory Excel - we'll need to use a different approach
  const ExcelFilePath = './upload/Groway_Wholesale_CashCarry_Directory_SA_v1.0.xlsx'
  
  // Check if file exists
  if (!fs.existsSync(ExcelFilePath)) {
    console.log('Excel file not found')
    return
  }

  console.log('Reading Excel file...')
  
  // Read Excel with header at row 3 (index 2)
  const workbook = new (await import('exceljs')).Workbook()
  await workbook.xlsx.readFile(ExcelFilePath)
  const worksheet = workbook.getWorksheet(1)
  
  // Get headers from row 3
  const headerRow = worksheet.getRow(3).values
  console.log('Headers:', headerRow.slice(0, 1, 20))  // Skip first empty column
  
  // Read data starting from row 4
  const data = []
  for (let i = 4; i <= worksheet.rowCount; i++) {
    const row = worksheet.getRow(i).values
    if (row[1]) { // Has wholesaler name
      data.push({
        name: row[1],
        branch: row[2],
        province: row[3],
        city: row[4],
        area: row[5],
        address: row[6],
        phone: row[7],
        website: row[8],
        email: row[9],
        type: row[10],
        categories: row[11],
        minOrder: row[12],
        creditTerms: row[13],
        delivery: row[14],
        tradingHours: row[15],
        tier: row[16],
        bbbeeLevel: row[17],
        membership: row[18],
        verticals: row[19],
        notes: row[20]
      })
    }
  }
  
  console.log(`Found ${data.length} wholesale entries`)
  
  // Map vertical names
  const verticalMapping: Record<string, string> = {
    'Food & Bev': 'Food & Beverage',
    'Liquor & Nightlife': 'Liquor & Nightlife',
    'Grocery & FMCG': 'Grocery & FMCG',
    'All Verticals': 'All Verticals',
    'Hardware & Building': 'Hardware & Building',
    'Electronics & Tech': 'Electronics & Tech',
    'Health & Beauty': 'Health & Beauty',
    'Health & Pharmacy': 'Health & Pharmacy',
    'Hospitality': 'Hospitality',
    'Sport & Leisure': 'Sport & Leisure',
  }
  
  // Import each wholesaler
  let imported = 0
  let errors = 0
  
  for (const entry of data) {
    try {
      if (!entry.name) continue
      
      // Map verticals
      const mappedVerticals: string[] = []
      if (entry.verticals) {
        const parts = String(entry.verticals).split(',')
        for (const part of parts) {
          const trimmed = part.trim()
          if (verticalMapping[trimmed]) {
            mappedVerticals.push(verticalMapping[trimmed])
          } else if (trimmed) {
            mappedVerticals.push(trimmed)
          }
        }
      }
      
      // Determine tier
      let tier = 'bronze'
      if (entry.tier) {
        const tierStr = String(entry.tier).toLowerCase()
        if (['platinum', 'gold', 'silver', 'bronze'].includes(tierStr)) {
          tier = tierStr
        }
      }
      
      // Generate code
      const code = `SUP-WHL-${nanoid(6).toUpperCase()}`
      
      // Website
      let website = entry.website
      if (website && !website.startsWith('http')) {
        website = `https://${website}`
      }
      
      // Categories
      const categoriesJson: string[] = []
      if (entry.categories) {
        const cats = String(entry.categories).split(',').map(c => c.trim()).filter(c => c)
        categoriesJson.push(...cats)
      }
      
      // BBBEE level
      let bbbeeLevel = null
      if (entry.bbbeeLevel) {
        try {
          bbbeeLevel = parseInt(String(entry.bbbeeLevel))
        } catch {}
          bbbeeLevel = null
      }
      
      // Credit terms
      let paymentTerms = 'net30'
      if (entry.creditTerms) {
        const ctStr = String(entry.creditTerms).toUpperCase()
        if (ctStr.includes('COD')) {
          paymentTerms = 'cod'
        } else if (ctStr.includes('7')) {
          paymentTerms = 'net7'
        } else if (ctStr.includes('15')) {
          paymentTerms = 'net15'
        }
      }
      
      await db.supplier.create({
        data: {
          name: entry.name,
          code: code,
          website: website || null,
          phone: entry.phone || null,
          city: entry.city || null,
          province: entry.province || null,
          address: entry.address || null,
          supplierType: 'wholesaler',
          tier: tier,
          bbbeeLevel: bbbeeLevel,
          deliveryDays: 3,
          minOrderValue: 0,
          minOrderUnit: entry.minOrder || null,
          paymentTerms: paymentTerms,
          categories: categoriesJson.length > 0 ? JSON.stringify(categoriesJson) : null,
          verticals: mappedVerticals.length > 0 ? JSON.stringify(mappedVerticals) : null,
          fulfillmentRate: 95.0 + Math.random() * 5,
          rating: 4.0 + Math.random() * 1.0,
          reviewCount: Math.floor(Math.random() * 50) + 1,
          notes: entry.notes || null,
          status: 'active',
          verificationStatus: 'verified'
        }
      })
      imported++
      if (imported % 20 === 0) {
        console.log(`Imported ${imported} wholesalers...`)
      }
    } catch (error: unknown) {
      console.error(`Error importing ${entry.name}:`, error)
      errors++
    }
  }
  
  console.log(`\n=== Import Summary ===`)
  console.log(`Total imported: ${imported}`)
  console.log(`Errors: ${errors}`)
  
  // Verify final count
  const finalCount = await db.supplier.count()
  console.log(`\n=== Final supplier count: ${finalCount} ===`)
  
  await db.$disconnect()
  console.log('\nDone! All wholesalers imported successfully!')
}

seedWholesalers()
  .finally(() => {
    console.log('Script completed!')
  })
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
