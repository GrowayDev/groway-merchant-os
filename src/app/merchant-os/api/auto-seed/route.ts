import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

// Auto-seed check endpoint - called by frontend to ensure data exists
export async function GET(request: NextRequest) {
  try {
    // Check if data already exists
    const [supplierCount, productCount, userCount] = await Promise.all([
      db.supplier.count(),
      db.catalogProduct.count(),
      db.user.count()
    ])

    const needsSeeding = supplierCount === 0 || productCount === 0
    const needsDemoUsers = userCount === 0

    return NextResponse.json({
      status: 'checked',
      data: {
        suppliers: supplierCount,
        products: productCount,
        users: userCount
      },
      needsSeeding,
      needsDemoUsers
    })
  } catch (error) {
    console.error('Auto-seed check error:', error)
    return NextResponse.json({ error: 'Auto-seed check failed' }, { status: 500 })
  }
}

// Trigger seeding
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const seedType = searchParams.get('type') || 'all'

    const results: { suppliers?: number; products?: number; users?: number } = {}

    if (seedType === 'all' || seedType === 'suppliers') {
      // Check and seed suppliers if needed
      const existingSuppliers = await db.supplier.count()
      if (existingSuppliers === 0) {
        await seedSuppliers()
      }
      results.suppliers = await db.supplier.count()
    }

    if (seedType === 'all' || seedType === 'products') {
      // Check and seed products if needed
      const existingProducts = await db.catalogProduct.count()
      if (existingProducts === 0) {
        await seedProducts()
      }
      results.products = await db.catalogProduct.count()
    }

    if (seedType === 'all' || seedType === 'users') {
      // Demo users are seeded via separate endpoint
      results.users = await db.user.count()
    }

    return NextResponse.json({
      success: true,
      message: 'Auto-seed completed',
      results
    })
  } catch (error) {
    console.error('Auto-seed error:', error)
    return NextResponse.json({ error: 'Auto-seed failed' }, { status: 500 })
  }
}

// Helper functions for seeding
async function seedSuppliers() {
  const provinces = ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape']
  const cities = ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein', 'Polokwane', 'Nelspruit', 'Rustenburg']
  const supplierTypes = ['manufacturer', 'distributor', 'wholesaler', 'farmer']
  const tiers = ['platinum', 'gold', 'silver', 'bronze']
  const verticals = ['Food & Beverage', 'Grocery & FMCG', 'Health & Beauty', 'Hospitality', 'Hardware & Building', 'Electronics & Tech', 'Liquor & Nightlife', 'Sport & Leisure']
  const categories = ['Fresh Produce', 'Dairy', 'Beverages', 'Snacks', 'Cleaning', 'Packaging', 'Frozen', 'Dry Goods', 'Meat', 'Bakery']

  const suppliers = []
  for (let i = 0; i < 350; i++) {
    const province = provinces[Math.floor(Math.random() * provinces.length)]
    const city = cities[Math.floor(Math.random() * cities.length)]
    const type = supplierTypes[Math.floor(Math.random() * supplierTypes.length)]
    const tier = tiers[Math.floor(Math.random() * tiers.length)]
    
    const supplierVerticals = verticals.slice(0, 2 + Math.floor(Math.random() * 3))
    const supplierCategories = categories.slice(0, 3 + Math.floor(Math.random() * 4))

    suppliers.push({
      id: `sup_${nanoid(12)}`,
      name: `${getSupplierPrefix(type)} ${getCategoryName(supplierCategories[0])} ${getSuffix(i)}`,
      code: `SUP-${String(i + 1001).padStart(5, '0')}`,
      supplierType: type,
      tier,
      status: 'active',
      verificationStatus: Math.random() > 0.15 ? 'verified' : 'pending',
      province,
      city,
      phone: `+27${Math.floor(Math.random() * 900000000 + 100000000)}`,
      email: `supplier${i}@example.com`,
      rating: 3.5 + Math.random() * 1.5,
      reviewCount: Math.floor(Math.random() * 100) + 5,
      deliveryDays: 1 + Math.floor(Math.random() * 7),
      minOrderValue: Math.floor(Math.random() * 5) * 500,
      paymentTerms: ['cod', 'net7', 'net15', 'net30'][Math.floor(Math.random() * 4)],
      fulfillmentRate: 85 + Math.random() * 15,
      bbbeeLevel: Math.random() > 0.3 ? 1 + Math.floor(Math.random() * 8) : null,
      categories: JSON.stringify(supplierCategories),
      verticals: JSON.stringify(supplierVerticals),
      subVerticals: JSON.stringify([]),
      updatedAt: new Date()
    })
  }

  // Insert in batches
  for (let i = 0; i < suppliers.length; i += 50) {
    const batch = suppliers.slice(i, i + 50)
    await db.supplier.createMany({ data: batch, skipDuplicates: true })
  }
}

async function seedProducts() {
  // First seed wholesalers
  const wholesalers = [
    { id: `whl_${nanoid(12)}`, name: 'Makro', code: 'MAKRO', province: 'Gauteng', city: 'Johannesburg', status: 'active', updatedAt: new Date() },
    { id: `whl_${nanoid(12)}`, name: 'Jumbo/CBW', code: 'JUMBO', province: 'Western Cape', city: 'Cape Town', status: 'active', updatedAt: new Date() },
    { id: `whl_${nanoid(12)}`, name: 'Shoprite C&C', code: 'SHOPRITE', province: 'Gauteng', city: 'Johannesburg', status: 'active', updatedAt: new Date() },
    { id: `whl_${nanoid(12)}`, name: 'Bidfood', code: 'BIDFOOD', province: 'Gauteng', city: 'Johannesburg', status: 'active', updatedAt: new Date() },
    { id: `whl_${nanoid(12)}`, name: 'Africa C&C', code: 'AFRICA', province: 'KwaZulu-Natal', city: 'Durban', status: 'active', updatedAt: new Date() },
    { id: `whl_${nanoid(12)}`, name: 'Devland', code: 'DEVLAND', province: 'Gauteng', city: 'Johannesburg', status: 'active', updatedAt: new Date() },
    { id: `whl_${nanoid(12)}`, name: 'SPAR Wholesale', code: 'SPAR', province: 'Gauteng', city: 'Pretoria', status: 'active', updatedAt: new Date() },
    { id: `whl_${nanoid(12)}`, name: 'Specialists', code: 'SPEC', province: 'Western Cape', city: 'Cape Town', status: 'active', updatedAt: new Date() },
  ]

  await db.wholesaler.createMany({ data: wholesalers, skipDuplicates: true })

  // Seed products
  const productCategories = [
    { name: 'Fresh Produce', items: ['Apples', 'Bananas', 'Oranges', 'Tomatoes', 'Potatoes', 'Onions', 'Carrots', 'Cabbage', 'Spinach', 'Peppers'] },
    { name: 'Dairy', items: ['Milk 1L', 'Milk 2L', 'Cheese', 'Butter', 'Yoghurt', 'Cream', 'Eggs 12pk', 'Eggs 30pk'] },
    { name: 'Beverages', items: ['Coca-Cola 2L', 'Sprite 2L', 'Fanta 2L', 'Water 500ml', 'Juice 1L', 'Energy Drink', 'Tea Bags', 'Coffee'] },
    { name: 'Snacks', items: ['Chips', 'Biscuits', 'Chocolate', 'Nuts', 'Sweets', 'Popcorn', 'Crackers', 'Pretzels'] },
    { name: 'Bakery', items: ['Bread White', 'Bread Brown', 'Rolls', 'Buns', 'Cakes', 'Pastries', 'Muffins', 'Croissants'] },
    { name: 'Frozen', items: ['Ice Cream', 'Frozen Veggies', 'Frozen Chicken', 'Frozen Fish', 'Frozen Pizza', 'Frozen Meals'] },
    { name: 'Dry Goods', items: ['Rice 5kg', 'Pasta', 'Flour', 'Sugar', 'Oil', 'Salt', 'Spices', 'Sauce'] },
    { name: 'Cleaning', items: ['Detergent', 'Bleach', 'Soap', 'Disinfectant', 'Mops', 'Brooms', 'Bins', 'Bags'] },
  ]

  const products: any[] = []
  let productIndex = 0

  for (const category of productCategories) {
    for (const itemName of category.items) {
      for (let w = 0; w < 5; w++) {
        const wholesaler = wholesalers[Math.floor(Math.random() * wholesalers.length)]
        const basePrice = 10 + Math.random() * 100
        const price = Math.round(basePrice * 100) / 100

        products.push({
          id: `cp_${nanoid(12)}`,
          name: `${itemName} - ${wholesaler.name}`,
          sku: `${category.name.substring(0, 3).toUpperCase()}-${String(productIndex++).padStart(4, '0')}`,
          category: category.name,
          barcode: `600${String(Math.floor(Math.random() * 10000000000)).padStart(11, '0')}`,
          price,
          cost: Math.round(price * 0.7 * 100) / 100,
          stock: Math.floor(Math.random() * 1000) + 50,
          minStock: 10,
          unit: 'unit',
          wholesalerId: wholesaler.id,
          updatedAt: new Date()
        })
      }
    }
  }

  // Insert in batches
  for (let i = 0; i < products.length; i += 50) {
    const batch = products.slice(i, i + 50)
    await db.catalogProduct.createMany({ data: batch, skipDuplicates: true })
  }
}

function getSupplierPrefix(type: string): string {
  switch (type) {
    case 'manufacturer': return 'Mfg'
    case 'distributor': return 'Dist'
    case 'wholesaler': return 'WS'
    case 'farmer': return 'Farm'
    default: return 'Supp'
  }
}

function getCategoryName(category: string): string {
  return category.split(' ')[0]
}

function getSuffix(index: number): string {
  const suffixes = ['Prime', 'Quality', 'Fresh', 'Best', 'Top', 'Choice', 'Select', 'Premium', 'Value', 'Essentials']
  return suffixes[index % suffixes.length]
}
