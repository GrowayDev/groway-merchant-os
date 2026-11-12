import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

// This endpoint re-seeds essential data if it gets lost due to turbo cache
// Call this endpoint to restore: 350 suppliers + 400 catalog products + 8 wholesalers
// Usage: GET /api/seed-data?secret=groway-seed-2024

const SUPPLIER_TYPES = ['manufacturer', 'distributor', 'wholesaler', 'farmer'] as const
const TIERS = ['platinum', 'gold', 'silver', 'bronze'] as const
const PROVINCES = ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Limpopo', 'Mpumalanga', 'North West', 'Free State', 'Northern Cape']

const DEFAULT_WHOLESALERS = [
  { name: 'Metro Cash & Carry', code: 'METRO', verticals: ['Food & Beverage', 'Grocery & FMCG'] },
  { name: 'Massmart Wholesale', code: 'MASSMART', verticals: ['Food & Beverage', 'Hardware & Building'] },
  { name: 'Bidvest Wholesale', code: 'BIDVEST', verticals: ['Food & Beverage', 'Liquor & Nightlife'] },
  { name: 'Unitrade Wholesalers', code: 'UNITRADE', verticals: ['Grocery & FMCG', 'Health & Beauty'] },
  { name: 'Africa Cash & Carry', code: 'ACC', verticals: ['Food & Beverage', 'Grocery & FMCG'] },
  { name: 'Makro Wholesale', code: 'MAKRO', verticals: ['Hardware & Building', 'Food & Beverage'] },
  { name: 'Imperial Logistics', code: 'IMPERIAL', verticals: ['Food & Beverage', 'Liquor & Nightlife'] },
  { name: 'Capital Wholesalers', code: 'CAPITAL', verticals: ['Grocery & FMCG', 'Health & Beauty'] },
]

function randomItem<T>(arr: readonly T[] | T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  
  // Basic security check
  if (secret !== 'groway-seed-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Check current counts
    const [currentSuppliers, currentProducts, currentWholesalers] = await Promise.all([
      db.supplier.count(),
      db.catalogProduct.count(),
      db.wholesaler.count()
    ])
    
    let suppliersSeeded = 0
    let productsSeeded = 0
    let wholesalersSeeded = 0

    // Seed wholesalers first (products depend on them)
    if (currentWholesalers < 8) {
      const needed = 8 - currentWholesalers
      
      for (let i = 0; i < needed; i++) {
        const wholesalerData = DEFAULT_WHOLESALERS[currentWholesalers + i] || {
          name: `Wholesale Co ${currentWholesalers + i + 1}`,
          code: `WSC-${String(currentWholesalers + i + 1).padStart(3, '0')}`,
          verticals: ['Food & Beverage']
        }
        
        await db.wholesaler.create({
          data: {
            id: `wh_${nanoid(12)}`,
            name: wholesalerData.name,
            code: wholesalerData.code,
            contactEmail: `info@${wholesalerData.code.toLowerCase()}.co.za`,
            contactPhone: `011-${String(Math.floor(Math.random() * 9000000) + 1000000)}`,
            province: randomItem(PROVINCES),
            verticals: JSON.stringify(wholesalerData.verticals),
            minOrderValue: Math.random() > 0.5 ? 1000 : 500,
            deliveryDays: Math.floor(Math.random() * 5) + 1,
            rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
            active: true,
            updatedAt: new Date()
          }
        })
        wholesalersSeeded++
      }
    }
    
    // Seed suppliers if under 350
    if (currentSuppliers < 350) {
      const needed = 350 - currentSuppliers
      
      for (let i = 0; i < needed; i++) {
        const type = randomItem(SUPPLIER_TYPES)
        const tier = randomItem(TIERS)
        const province = randomItem(PROVINCES)
        
        await db.supplier.create({
          data: {
            id: `sup_${nanoid(12)}`,
            name: `${type.charAt(0).toUpperCase() + type.slice(1)} Supply Co ${currentSuppliers + i + 1}`,
            code: `SUP-${String(currentSuppliers + i + 1).padStart(4, '0')}`,
            contactPerson: 'Contact Person',
            email: `supplier${currentSuppliers + i + 1}@example.com`,
            phone: `011-${String(Math.floor(Math.random() * 9000000) + 1000000)}`,
            province,
            supplierType: type,
            tier,
            bbbeeLevel: Math.floor(Math.random() * 8) + 1,
            rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
            reviewCount: Math.floor(Math.random() * 500),
            deliveryDays: Math.floor(Math.random() * 7) + 1,
            minOrderValue: [0, 500, 1000, 2000][Math.floor(Math.random() * 4)],
            paymentTerms: randomItem(['cod', 'net7', 'net15', 'net30']),
            categories: '[]',
            verticals: '[]',
            fulfillmentRate: Math.round((85 + Math.random() * 15) * 10) / 10,
            status: 'active',
            verificationStatus: 'verified',
            updatedAt: new Date()
          }
        })
        suppliersSeeded++
      }
    }
    
    // Seed products if under 400
    if (currentProducts < 400) {
      const wholesalers = await db.wholesaler.findMany()
      const needed = 400 - currentProducts
      
      const verticals = ['Food & Beverage', 'Liquor & Nightlife', 'Grocery & FMCG', 'Health & Beauty', 'Hardware & Building']
      const categories: Record<string, string[]> = {
        'Food & Beverage': ['Fresh Produce', 'Dairy', 'Meat', 'Beverages'],
        'Liquor & Nightlife': ['Spirits', 'Wine', 'Beer'],
        'Grocery & FMCG': ['Household', 'Personal Care', 'Cleaning'],
        'Health & Beauty': ['Haircare', 'Skincare', 'Cosmetics'],
        'Hardware & Building': ['Tools', 'Paint', 'Plumbing']
      }
      
      for (let i = 0; i < needed; i++) {
        const vertical = randomItem(verticals)
        const category = randomItem(categories[vertical] || ['General'])
        const wholesaler = wholesalers.length > 0 ? randomItem(wholesalers) : null
        const costPrice = Math.round((Math.random() * 500 + 10) * 100) / 100
        const margin = Math.round((Math.random() * 0.4 + 0.15) * 100) / 100
        
        await db.catalogProduct.create({
          data: {
            id: `cp_${nanoid(12)}`,
            sku: `SKU-${String(currentProducts + i + 1).padStart(5, '0')}`,
            sourceType: wholesaler ? 'wholesale' : 'supplier',
            wholesalerId: wholesaler?.id || null,
            vertical,
            category,
            description: `Product ${currentProducts + i + 1}`,
            brand: 'Generic Brand',
            packSize: '1x1',
            unit: 'each',
            vatRate: 15.0,
            costPrice,
            retailPrice: Math.round(costPrice * (1 + margin) * 100) / 100,
            grossMargin: margin,
            minOrderQty: 1,
            leadDays: Math.floor(Math.random() * 7) + 1,
            inStock: Math.random() > 0.1,
            status: 'active',
            updatedAt: new Date()
          }
        })
        productsSeeded++
      }
    }
    
    // Get final counts
    const [finalSuppliers, finalProducts, finalWholesalers] = await Promise.all([
      db.supplier.count(),
      db.catalogProduct.count(),
      db.wholesaler.count()
    ])
    
    return NextResponse.json({
      success: true,
      before: {
        suppliers: currentSuppliers,
        products: currentProducts,
        wholesalers: currentWholesalers
      },
      seeded: {
        suppliers: suppliersSeeded,
        products: productsSeeded,
        wholesalers: wholesalersSeeded
      },
      after: {
        suppliers: finalSuppliers,
        products: finalProducts,
        wholesalers: finalWholesalers
      },
      message: `Restored ${wholesalersSeeded} wholesalers, ${suppliersSeeded} suppliers and ${productsSeeded} products`
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ 
      error: 'Seed failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
