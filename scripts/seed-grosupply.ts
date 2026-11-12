import { db } from '../src/lib/db'
import { randomUUID } from 'crypto'

const provinces = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
  'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'
]

// Supplier Types
const supplierTypes = ['farmer', 'distributor', 'manufacturer', 'wholesaler']

// Tiers with weights for distribution
const tiers = ['platinum', 'gold', 'silver', 'bronze']
const tierWeights = [0.26, 0.27, 0.23, 0.24] // Approximate distribution

// Business Verticals
const verticals = [
  'Food & Beverage', 'Liquor & Nightlife', 'Grocery & FMCG',
  'Health & Beauty', 'Health & Pharmacy', 'Hospitality',
  'Hardware & Building', 'Electronics & Tech', 'Sport & Leisure',
  'Childcare & Education', 'Professional Services', 'Fashion & Apparel'
]

// Categories per vertical
const categoriesByVertical: Record<string, string[]> = {
  'Food & Beverage': ['Fresh Produce', 'Dairy', 'Meat', 'Bakery', 'Beverages', 'Frozen Foods', 'Dry Goods', 'Canned Goods'],
  'Liquor & Nightlife': ['Spirits', 'Wine', 'Beer', 'Ciders', 'Mixers', 'Glassware', 'Bar Supplies'],
  'Grocery & FMCG': ['Personal Care', 'Household', 'Cleaning', 'Snacks', 'Confectionery', 'Beverages', 'Dry Goods'],
  'Health & Beauty': ['Haircare', 'Skincare', 'Nail Products', 'Cosmetics', 'Salon Equipment', 'Spa Products'],
  'Health & Pharmacy': ['Medicines', 'Vitamins', 'Medical Supplies', 'Personal Care', 'Baby Products', 'First Aid'],
  'Hospitality': ['Linens', 'Toiletries', 'Cleaning', 'Kitchen', 'Guest Amenities', 'Maintenance'],
  'Hardware & Building': ['Tools', 'Paint', 'Plumbing', 'Electrical', 'Building Materials', 'Safety Equipment'],
  'Electronics & Tech': ['Audio', 'Video', 'Accessories', 'Computers', 'Phones', 'Networking'],
  'Sport & Leisure': ['Fitness Equipment', 'Sports Gear', 'Outdoor', 'Games', 'Apparel', 'Accessories'],
  'Childcare & Education': ['Toys', 'Educational', 'Furniture', 'Safety', 'Art Supplies', 'Books'],
  'Professional Services': ['Office Supplies', 'Printing', 'Furniture', 'Technology', 'Cleaning', 'Safety'],
  'Fashion & Apparel': ['Clothing', 'Footwear', 'Accessories', 'Fabrics', 'Jewelry', 'Bags']
}

// SA Company Name Prefixes and Suffixes
const companyPrefixes = [
  'African', 'South', 'Cape', 'Johannesburg', 'Durban', 'Pretoria', 'Eastern',
  'Western', 'Northern', 'Southern', 'Central', 'Metro', 'Royal', 'Premier',
  'Golden', 'Silver', 'Diamond', 'Unity', 'Rainbow', 'Sunrise', 'Horizon',
  'Global', 'Continental', 'National', 'Provincial', 'City', 'Town'
]

const companySuffixes = [
  'Foods', 'Produce', 'Supplies', 'Distributors', 'Wholesale', 'Traders',
  'Merchants', 'Enterprises', 'Industries', 'Manufacturing', 'Products',
  'Logistics', 'Solutions', 'Holdings', 'Group', 'Co.', 'Ltd.', 'SA',
  'Africa', 'Fresh', 'Quality', 'Premium', 'Direct', 'Source'
]

// SA Banks
const banks = ['FNB', 'Standard Bank', 'Absa', 'Capitec', 'Nedbank', 'Investec', 'African Bank', 'TymeBank']

// Brands for products
const brands = [
  'Distell', 'Unilever', 'Clover', 'Nestle', 'Tiger Brands', 'Pioneer Foods',
  'AVI', 'Premier Foods', 'RCL Foods', 'Astral', 'Rainbow', 'Enterprise',
  'Bokomo', 'Snowflake', 'Iwisa', 'White Star', 'Ace', 'Koo', 'Lancewood',
  'Simonsberg', 'Woolworths', 'Pick n Pay', 'Shoprite', 'Checkers', 'Makro',
  'Game', 'Jumbo', 'CBW', 'Africa C&C', 'Devland', 'SPAR', 'Bidfood'
]

// Wholesalers - SA's major wholesale operators
const wholesalers = [
  { name: 'Makro', code: 'MAKRO', type: 'cash_and_carry', branchCount: 22, province: 'National' },
  { name: 'Jumbo/CBW', code: 'JUMBO', type: 'cash_and_carry', branchCount: 45, province: 'National' },
  { name: 'Shoprite C&C', code: 'SHOPRITE-CC', type: 'cash_and_carry', branchCount: 68, province: 'National' },
  { name: 'Bidfood', code: 'BIDFOOD', type: 'foodservice', branchCount: 15, province: 'National' },
  { name: 'Africa C&C', code: 'AFRICA-CC', type: 'cash_and_carry', branchCount: 12, province: 'Gauteng' },
  { name: 'Devland', code: 'DEVLAND', type: 'cash_and_carry', branchCount: 8, province: 'Gauteng' },
  { name: 'SPAR Wholesale', code: 'SPAR-WS', type: 'cash_and_carry', branchCount: 25, province: 'National' },
  { name: 'Specialists Wholesalers', code: 'SPECIAL', type: 'specialist', branchCount: 10, province: 'National' }
]

function generateSupplierName(index: number): string {
  const prefix = companyPrefixes[Math.floor(Math.random() * companyPrefixes.length)]
  const suffix = companySuffixes[Math.floor(Math.random() * companySuffixes.length)]
  return `${prefix} ${suffix}`
}

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function getRandomSubset<T>(arr: T[], min: number, max: number): T[] {
  const count = Math.floor(Math.random() * (max - min + 1)) + min
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

function generatePhone(): string {
  const prefixes = ['011', '021', '031', '041', '051', '012', '013', '014', '015', '016']
  const prefix = getRandomElement(prefixes)
  const number = Math.floor(Math.random() * 9000000) + 1000000
  return `${prefix}-${String(number).slice(0,3)}-${String(number).slice(3)}`
}

function generateEmail(name: string): string {
  const clean = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15)
  const domains = ['mail.co.za', 'company.co.za', 'org.za', 'africa.com', 'web.co.za']
  return `${clean}${Math.floor(Math.random() * 99)}@${getRandomElement(domains)}`
}

async function main() {
  console.log('Starting GroSupply database seeding...')
  
  // Clear existing data
  await db.catalogProduct.deleteMany({})
  await db.wholesaler.deleteMany({})
  await db.supplier.deleteMany({})
  console.log('Cleared existing data')

  // Seed Wholesalers
  console.log('Seeding 8 wholesalers...')
  for (const wholesaler of wholesalers) {
    await db.wholesaler.create({
      data: {
        id: randomUUID(),
        name: wholesaler.name,
        code: wholesaler.code,
        type: wholesaler.type,
        branchCount: wholesaler.branchCount,
        province: wholesaler.province,
        status: 'active',
        updatedAt: new Date(),
      }
    })
  }
  
  // Seed 350 Suppliers
  console.log('Seeding 350 suppliers...')
  const suppliers = []
  
  for (let i = 0; i < 350; i++) {
    const name = generateSupplierName(i)
    const province = getRandomElement(provinces)
    const tier = tierWeights.findIndex((w, idx) => {
      const cumulative = tierWeights.slice(0, idx + 1).reduce((a, b) => a + b, 0)
      return (i / 350) < cumulative
    }) + 1
    const actualTier = tiers[tier - 1] || 'bronze'
    
    const supplierVerticals = getRandomSubset(verticals, 1, 3)
    const supplierCategories = getRandomElement(supplierTypes) === 'farmer' 
      ? getRandomSubset(categoriesByVertical['Food & Beverage'], 1, 3)
      : getRandomSubset(Object.values(categoriesByVertical).flat(), 2, 5)

    suppliers.push({
      id: randomUUID(),
      name,
      code: `SUP-${String(i + 1).padStart(4, '0')}`,
      contactPerson: `${getRandomElement(['John', 'Jane', 'Peter', 'Mary', 'David', 'Sarah', 'Michael', 'Nomsa', 'Johan', 'Pieter'])} ${getRandomElement(['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Kunene', 'Van der Berg', 'Maharaj'])}`,
      email: generateEmail(name),
      phone: generatePhone(),
      website: `www.${name.toLowerCase().replace(/[^a-z]/g, '')}.co.za`,
      address: `${Math.floor(Math.random() * 9000) + 1000} ${getRandomElement(['Pretorius', 'Church', 'Main', 'Voortrekker', 'Kerk', 'Long', 'Short', 'Market'])} ${getRandomElement(['Street', 'Road', 'Avenue', 'Drive', 'Close'])}`,
      city: getRandomElement(['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein', 'East London', 'Pietermaritzburg', 'Polokwane', 'Rustenburg']),
      province,
      supplierType: getRandomElement(supplierTypes),
      tier: actualTier,
      bbbeeLevel: Math.floor(Math.random() * 4) + 1,
      rating: Number((3.5 + Math.random() * 1.5).toFixed(1)),
      reviewCount: Math.floor(Math.random() * 200) + 10,
      deliveryDays: Math.floor(Math.random() * 5) + 1,
      minOrderValue: [0, 500, 1000, 2500, 5000, 10000][Math.floor(Math.random() * 6)],
      paymentTerms: getRandomElement(['net7', 'net15', 'net30', 'net45', 'net60', 'cod']),
      categories: JSON.stringify(supplierCategories),
      verticals: JSON.stringify(supplierVerticals),
      subVerticals: JSON.stringify(getRandomSubset(['QSR', 'Restaurant', 'Coffee Shop', 'Bakery', 'Catering'], 0, 2)),
      fulfillmentRate: Number((90 + Math.random() * 9).toFixed(1)),
      status: 'active',
      verificationStatus: Math.random() > 0.15 ? 'verified' : 'pending',
      updatedAt: new Date(),
    })
  }

  // Batch insert suppliers
  for (const supplier of suppliers) {
    await db.supplier.create({ data: supplier })
  }
  console.log(`Created ${suppliers.length} suppliers`)

  // Seed 400 Catalog Products
  console.log('Seeding 400 catalog products...')
  const createdWholesalers = await db.wholesaler.findMany()
  const products = []
  
  for (let i = 0; i < 400; i++) {
    const wholesaler = getRandomElement(createdWholesalers)
    const vertical = getRandomElement(verticals)
    const category = getRandomElement(categoriesByVertical[vertical] || ['General'])
    const brand = getRandomElement(brands)
    const costPrice = Number((20 + Math.random() * 500).toFixed(2))
    const margin = Number((0.15 + Math.random() * 0.40).toFixed(2))
    
    products.push({
      id: randomUUID(),
      sku: `${wholesaler.code}-${String(i + 1).padStart(5, '0')}`,
      sourceType: 'wholesale',
      wholesalerId: wholesaler.id,
      vertical,
      category,
      description: `${brand} ${category} Product ${i + 1}`,
      brand,
      packSize: '1x1',
      unit: 'each',
      vatRate: 15.0,
      costPrice,
      retailPrice: Number((costPrice * (1 + margin)).toFixed(2)),
      grossMargin: margin,
      minOrderQty: Math.floor(Math.random() * 10) + 1,
      leadDays: Math.floor(Math.random() * 6) + 2,
      inStock: Math.random() > 0.1,
      status: 'active',
      updatedAt: new Date(),
    })
  }

  // Batch insert products
  for (const product of products) {
    await db.catalogProduct.create({ data: product })
  }
  console.log(`Created ${products.length} catalog products`)

  // Final summary
  const finalCount = {
    suppliers: await db.supplier.count(),
    wholesalers: await db.wholesaler.count(),
    products: await db.catalogProduct.count()
  }
  
  console.log('\n=== Seeding Complete ===')
  console.log(`Suppliers: ${finalCount.suppliers}`)
  console.log(`Wholesalers: ${finalCount.wholesalers}`)
  console.log(`Catalog Products: ${finalCount.products}`)
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
