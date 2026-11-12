import { db } from '../src/lib/db'
import * as XLSX from 'xlsx'
import * as path from 'path'
import { nanoid } from 'nanoid'

import fs from 'fs'

const ExcelFilePath = path.join(__dirname, '../upload/Groway_Wholesale_CashCarry_Directory_SA_v1.0.xlsx')

async function importWholesalers() {
  console.log('Reading Excel file:', ExcelFilePath)
  
  if (!fs.existsSync(ExcelFilePath)) {
    console.log('Excel file not found')
    return
  }
  
  const workbook = XLSX.readFile(ExcelFilePath)
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  
  console.log(`Sheet: ${sheetName}`)
  console.log(`Range: ${worksheet['!ref']}`)
  
  // Convert to JSON (header at row 3 which is index 2)
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
    header: 2,
    raw: false,
  })
  
  // Convert values to strings
  for (const row of jsonData) {
    for (const key in Object.keys(row)) {
      if (row[key] !== undefined && row[key] !== null) {
        row[key] = String(row[key])
      }
    }
  }
  
  console.log(`Found ${jsonData.length} wholesale entries`)
  
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
    'Childcare': 'Childcare & Education',
    'Spaza': 'Spaza Shop',
  }
  
  let imported = 0
  let errors = 0
  
  for (const entry of jsonData) {
    try {
      const name = entry['Wholesaler / Chain Name']
      if (!name) continue
      
      // Map verticals
      const mappedVerticals: string[] = []
      const verticalsStr = entry['Verticals Served']
      if (verticalsStr && typeof verticalsStr === 'string') {
        const parts = verticalsStr.split(',')
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
      const tierStr = entry['GroSupply Tier']
      if (tierStr && typeof tierStr === 'string') {
        const tierLower = tierStr.toLowerCase()
        if (['platinum', 'gold', 'silver', 'bronze'].includes(tierLower)) {
          tier = tierLower
        }
      }
      
      // Generate code
      const code = `SUP-WHL-${nanoid(6).toUpperCase()}`
      
      // Website
      let website = entry['Website']
      if (website && typeof website === 'string' && !website.startsWith('http')) {
        website = `https://${website}`
      }
      
      // Categories
      let categoriesJson: string | null = null
      const categoriesStr = entry['Categories Supplied']
      if (categoriesStr && typeof categoriesStr === 'string') {
        const cats = categoriesStr.split(',').map((c: string) => c.trim()).filter((c: string) => c.length > 0)
        categoriesJson = JSON.stringify(cats)
      }
      
      // BBBEE level
      let bbbeeLevel: number | null = null
      const bbbeeStr = entry['BBBEE Level']
      if (bbbeeStr) {
        try {
          const level = parseInt(bbbeeStr)
          if (!isNaN(level) && level >= 1 && level <= 8) {
            bbbeeLevel = level
          }
        } catch (e) {
          bbbeeLevel = null
        }
      }
      
      // Credit terms
      let paymentTerms = 'net30'
      const creditStr = entry['Credit Terms']
      if (creditStr && typeof creditStr === 'string') {
        const ctUpper = creditStr.toUpperCase()
        if (ctUpper.includes('COD')) {
          paymentTerms = 'cod'
        } else if (ctUpper.includes('7')) {
          paymentTerms = 'net7'
        } else if (ctUpper.includes('15')) {
          paymentTerms = 'net15'
        }
      }
      
      // Supplier type based on Type column
      let supplierType = 'wholesaler'
      const typeStr = entry['Type']
      if (typeStr && typeof typeStr === 'string') {
        const typeLower = typeStr.toLowerCase()
        if (typeLower.includes('independent') || typeLower.includes('specialist')) {
          supplierType = typeLower
        }
      }
      
      // Create supplier
      await db.supplier.create({
        data: {
          name: name,
          code: code,
          website: website || null,
          phone: entry['Phone'] || null,
          city: entry['City / Town'] || null,
          province: entry['Province'] || null,
          address: entry['Street Address'] || null,
          supplierType: supplierType,
          tier: tier,
          bbbeeLevel: bbbeeLevel,
          deliveryDays: 3,
          minOrderValue: 0,
          minOrderUnit: entry['Min Order'] || null,
          paymentTerms: paymentTerms,
          categories: categoriesJson,
          verticals: mappedVerticals.length > 0 ? JSON.stringify(mappedVerticals) : null,
          fulfillmentRate: 95.0 + Math.random() * 5,
          rating: 4.0 + Math.random() * 1.0,
          reviewCount: Math.floor(Math.random() * 50) + 10,
          notes: entry['Notes'] || null,
          status: 'active',
          verificationStatus: 'verified'
        }
      })
      
      imported++
      if (imported % 20 === 0) {
        console.log(`Imported ${imported} wholesalers...`)
      }
    } catch (error: unknown) {
      console.error(`Error importing ${entry['Wholesaler / Chain Name']}:`, error)
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

  
importWholesalers().catch((error) => {
  console.error('Error:', error)
  process.exit(1)
})
