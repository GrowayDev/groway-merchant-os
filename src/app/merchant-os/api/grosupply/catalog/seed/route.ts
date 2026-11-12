import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'

// South African wholesalers/retailers
const WHOLESALERS = [
  { name: 'Makro', code: 'MAKRO', type: 'cash_and_carry', branches: 22, province: 'National' },
  { name: 'Jumbo/CBW', code: 'JUMBO', type: 'cash_and_carry', branches: 45, province: 'National' },
  { name: 'Shoprite C&C', code: 'SHOPRITE-CC', type: 'cash_and_carry', branches: 68, province: 'National' },
  { name: 'Bidfood', code: 'BIDFOOD', type: 'foodservice', branches: 15, province: 'National' },
  { name: 'Africa C&C', code: 'AFRICA-CC', type: 'cash_and_carry', branches: 12, province: 'Gauteng' },
  { name: 'Devland', code: 'DEVLAND', type: 'cash_and_carry', branches: 8, province: 'Gauteng' },
  { name: 'SPAR Wholesale/Metcash Shield', code: 'SPAR-WS', type: 'distributor', branches: 6, province: 'National' },
  { name: 'Specialists', code: 'SPECIAL', type: 'specialist', branches: 10, province: 'National' }
]

// Product categories and sample products
const VERTICALS = [
  { name: 'Food & Beverage', subVerticals: ['Restaurants', 'Cafes', 'Caterers', 'Fast Food', 'Bakeries'] },
  { name: 'Liquor & Nightlife', subVerticals: ['Bars', 'Clubs', 'Bottle Stores', 'Pubs'] },
  { name: 'Grocery & FMCG', subVerticals: ['Supermarkets', 'Spaza Shops', 'Convenience Stores'] },
  { name: 'Health & Beauty', subVerticals: ['Salons', 'Spas', 'Barbers', 'Wellness Centers'] },
  { name: 'Hardware & Building', subVerticals: ['Hardware Stores', 'Builders', 'Construction'] },
  { name: 'Hospitality', subVerticals: ['Hotels', 'Guesthouses', 'B&Bs', 'Lodges'] },
  { name: 'Health & Pharmacy', subVerticals: ['Pharmacies', 'Clinics', 'Medical Supplies'] },
  { name: 'Electronics & Tech', subVerticals: ['Electronics Retail', 'Computer Stores', 'Mobile'] }
]

const CATEGORIES: Record<string, string[]> = {
  'Food & Beverage': ['Fresh Produce', 'Dairy', 'Meat', 'Beverages', 'Dry Goods', 'Frozen Foods', 'Bakery', 'Spices & Condiments'],
  'Liquor & Nightlife': ['Spirits', 'Wine', 'Beer', 'Ciders', 'Mixers', 'Liqueurs'],
  'Grocery & FMCG': ['Household', 'Personal Care', 'Cleaning', 'Confectionery', 'Pet Food', 'Baby Products'],
  'Health & Beauty': ['Haircare', 'Skincare', 'Cosmetics', 'Nail Products', 'Spa Equipment', 'Salon Furniture'],
  'Hardware & Building': ['Tools', 'Paint', 'Plumbing', 'Electrical', 'Building Materials', 'Garden'],
  'Hospitality': ['Linen', 'Toiletries', 'Cleaning Supplies', 'Furniture', 'Kitchen Equipment'],
  'Health & Pharmacy': ['Medicines', 'Medical Equipment', 'First Aid', 'Vitamins', 'Personal Care'],
  'Electronics & Tech': ['Computers', 'Phones', 'Accessories', 'Audio', 'Networking']
}

const BRANDS: Record<string, string[]> = {
  'Fresh Produce': ['Freshmark', 'Woolworths', 'Checkers', 'Local Farms'],
  'Dairy': ['Clover', 'Danone', 'Fairfield', 'Lancewood', 'Nestle'],
  'Meat': ['Rainbow', 'Fairview', 'Crown National', 'Enterprise'],
  'Beverages': ['Coca-Cola', 'Pepsi', 'ABI', 'Monster', 'Red Bull'],
  'Dry Goods': ['Tiger Brands', 'Pioneer Foods', 'Premier Foods', 'AVI'],
  'Spirits': ['Distell', 'Diageo', 'Pernod Ricard', 'Brandhouse'],
  'Wine': ['Stellenbosch Farmers', 'Distell', 'DGB', 'KWV'],
  'Beer': ['SAB', 'Heineken', 'Castle', 'Windhoek'],
  'Household': ['Unilever', 'P&G', 'Reckitt', 'Henkel'],
  'Cleaning': ['Unilever', 'P&G', 'Ecolab', 'Bloom'],
  'Haircare': ['L\'Oreal', 'Revlon', 'Dark & Lovely', 'Suave'],
  'Skincare': ['Nivea', 'Dove', 'Vaseline', 'Ponds'],
  'Tools': ['Bosch', 'Makita', 'Stanley', 'Ryobi'],
  'Paint': ['Dulux', 'Plascon', 'Prominent Paints', 'Berger'],
  'Electrical': ['Legrand', 'Schneider', 'Crabtree', 'ACDC'],
  'Linen': ['Sheridan', 'Dreamsheets', 'Loza', 'Actil'],
  'Kitchen Equipment': ['Russell Hobbs', 'Defy', 'Samsung', 'LG'],
  'Medicines': ['Adcock Ingram', 'Aspen', 'Cipla', 'Dis-Chem']
}

const UNITS = ['each', 'pack', 'case', 'carton', 'kg', 'litre', 'box', 'bag', 'bottle', 'roll']

function generateSKU(wholesalerCode: string, index: number): string {
  return `${wholesalerCode}-${String(index).padStart(5, '0')}`
}

function generateProducts(wholesalerId: string, wholesalerCode: string, count: number) {
  const products = []
  let skuIndex = 1

  for (let i = 0; i < count; i++) {
    // Pick a random vertical
    const vertical = VERTICALS[Math.floor(Math.random() * VERTICALS.length)]
    const subVertical = vertical.subVerticals[Math.floor(Math.random() * vertical.subVerticals.length)]
    
    // Pick a random category for this vertical
    const categories = CATEGORIES[vertical.name] || ['General']
    const category = categories[Math.floor(Math.random() * categories.length)]
    
    // Pick a brand for this category
    const brands = BRANDS[category] || ['Generic']
    const brand = brands[Math.floor(Math.random() * brands.length)]
    
    // Generate product name
    const productNames: Record<string, string[]> = {
      'Fresh Produce': ['Fresh Vegetables Mix', 'Seasonal Fruits Pack', 'Organic Salad Mix', 'Potatoes 10kg', 'Onions 5kg'],
      'Dairy': ['Full Cream Milk 2L', 'Low Fat Milk 1L', 'Cheddar Cheese Block', 'Greek Yogurt', 'Butter 500g'],
      'Meat': ['Chicken Portions 2kg', 'Beef Mince 1kg', 'Pork Chops', 'Boerewors', 'Lamb Stew'],
      'Beverages': ['Coca-Cola 2L', 'Orange Juice 1L', 'Mineral Water 500ml', 'Energy Drink', 'Iced Tea'],
      'Spirits': ['Brandy 750ml', 'Whisky 750ml', 'Vodka 750ml', 'Gin 750ml', 'Rum 750ml'],
      'Wine': ['Red Wine 750ml', 'White Wine 750ml', 'Rose 750ml', 'Sparkling Wine', 'Box Wine 5L'],
      'Beer': ['Lager 6-pack', 'Ale 6-pack', 'Stout 6-pack', 'Craft Beer', 'Cider 6-pack'],
      'Household': ['Washing Powder 2kg', 'Dishwashing Liquid', 'Fabric Softener', 'Multi-purpose Cleaner'],
      'Cleaning': ['Industrial Cleaner 5L', 'Disinfectant', 'Degreaser', 'Floor Cleaner', 'Glass Cleaner'],
      'Haircare': ['Shampoo 500ml', 'Conditioner 500ml', 'Hair Gel', 'Hair Spray', 'Hair Color'],
      'Skincare': ['Face Cream 50ml', 'Body Lotion 400ml', 'Moisturizer', 'Sunscreen', 'Hand Cream'],
      'Tools': ['Power Drill', 'Angle Grinder', 'Circular Saw', 'Impact Driver', 'Sander'],
      'Paint': ['Interior Paint 20L', 'Exterior Paint 20L', 'Primer 5L', 'Varnish', 'Wood Stain'],
      'Electrical': ['Light Switch', 'Wall Socket', 'Circuit Breaker', 'Cable 100m', 'Distribution Board'],
      'Linen': ['Queen Sheet Set', 'King Duvet Cover', 'Pillow Cases 4pk', 'Mattress Protector', 'Towel Set'],
      'Kitchen Equipment': ['Gas Stove', 'Deep Fryer', 'Microwave', 'Blender', 'Food Processor'],
      'Medicines': ['Pain Relief 20s', 'Cold & Flu', 'Vitamins 60s', 'Antiseptic', 'First Aid Kit']
    }
    
    const names = productNames[category] || ['Generic Product']
    const productName = names[Math.floor(Math.random() * names.length)]
    
    // Generate pack size
    const packSizes = ['1x1', '1x6', '1x12', '1x24', '2x6', '4x6', '10kg', '5kg', '20kg', 'Box of 12']
    const packSize = packSizes[Math.floor(Math.random() * packSizes.length)]
    
    // Generate unit
    const unit = UNITS[Math.floor(Math.random() * UNITS.length)]
    
    // Generate pricing
    const costPrice = Math.round((Math.random() * 500 + 10) * 100) / 100
    const margin = Math.round((Math.random() * 0.4 + 0.15) * 100) / 100 // 15-55% margin
    const retailPrice = Math.round(costPrice * (1 + margin) * 100) / 100
    
    products.push({
      id: randomUUID(),
      sku: generateSKU(wholesalerCode, skuIndex++),
      sourceType: 'wholesale',
      wholesalerId,
      vertical: vertical.name,
      subVertical,
      category,
      description: `${brand} ${productName}`,
      brand,
      packSize,
      unit,
      vatRate: 15.0,
      costPrice,
      retailPrice,
      grossMargin: margin,
      minOrderQty: Math.floor(Math.random() * 10) + 1,
      leadDays: Math.floor(Math.random() * 7) + 1,
      inStock: Math.random() > 0.1,
      status: 'active',
      updatedAt: new Date()
    })
  }
  
  return products
}

// GET /api/grosupply/catalog/seed - Seed catalog products and wholesalers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productsPerWholesaler = parseInt(searchParams.get('productsPerWholesaler') || '50', 10)
    const clear = searchParams.get('clear') === 'true'
    
    // Clear existing data if requested
    if (clear) {
      await db.catalogProduct.deleteMany({})
      await db.wholesaler.deleteMany({})
    }
    
    // Check current counts
    const existingWholesalers = await db.wholesaler.count()
    const existingProducts = await db.catalogProduct.count()
    
    if (existingWholesalers >= WHOLESALERS.length && existingProducts >= WHOLESALERS.length * productsPerWholesaler) {
      return NextResponse.json({
        message: 'Catalog already seeded',
        wholesalers: existingWholesalers,
        products: existingProducts
      })
    }
    
    // Seed wholesalers
    const createdWholesalers = []
    for (const wholesaler of WHOLESALERS) {
      const existing = await db.wholesaler.findFirst({
        where: { code: wholesaler.code }
      })
      
      if (!existing) {
        const created = await db.wholesaler.create({
          data: {
            id: randomUUID(),
            name: wholesaler.name,
            code: wholesaler.code,
            type: wholesaler.type,
            branchCount: wholesaler.branches,
            province: wholesaler.province,
            status: 'active',
            updatedAt: new Date()
          }
        })
        createdWholesalers.push(created)
      } else {
        createdWholesalers.push(existing)
      }
    }
    
    // Seed products for each wholesaler
    let totalProducts = existingProducts
    for (const wholesaler of createdWholesalers) {
      const products = generateProducts(wholesaler.id, wholesaler.code, productsPerWholesaler)
      
      for (const product of products) {
        try {
          await db.catalogProduct.create({
            data: product
          })
          totalProducts++
        } catch {
          // Skip duplicates
        }
      }
    }
    
    return NextResponse.json({
      message: 'Catalog seeded successfully',
      wholesalers: createdWholesalers.length,
      totalProducts
    })
  } catch (error) {
    console.error('Error seeding catalog:', error)
    return NextResponse.json({ error: 'Failed to seed catalog' }, { status: 500 })
  }
}
