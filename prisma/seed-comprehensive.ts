import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// South African provinces
const provinces = ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape']

// Supplier categories/industries
const supplierCategories = [
  'Food & Beverage', 'FMCG', 'Health & Beauty', 'Pharmaceuticals', 'Electronics',
  'Hardware & Building', 'Automotive', 'Textiles & Apparel', 'Agriculture', 'Chemicals',
  'Office Supplies', 'Packaging', 'Cleaning Supplies', 'Industrial Equipment', 'Medical Supplies',
  'Telecommunications', 'Energy & Power', 'Water & Sanitation', 'Logistics', 'Safety Equipment'
]

// Supplier name prefixes
const supplierPrefixes = [
  'Africa', 'South', 'National', 'Continental', 'Global', 'Premier', 'Elite', 'Prime', 'Royal', 'Golden',
  'Silver', 'Bronze', 'Diamond', 'Platinum', 'Crown', 'Star', 'Sun', 'Moon', 'Mountain', 'Valley',
  'River', 'Ocean', 'Desert', 'Forest', 'Savanna', 'Delta', 'Coastal', 'Inland', 'Urban', 'Rural'
]

// Supplier name suffixes
const supplierSuffixes = [
  'Distributors', 'Suppliers', 'Wholesalers', 'Trading', 'Enterprises', 'Group', 'Holdings', 'Solutions',
  'Logistics', 'Supply Chain', 'Merchandise', 'Imports', 'Exports', 'International', 'SA', 'Pty Ltd',
  'Corporation', 'Industries', 'Manufacturing', 'Processing', 'Foods', 'Products', 'Services', 'Networks'
]

// Cities in South Africa
const cities = [
  'Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein', 'East London',
  'Pietermaritzburg', 'Polokwane', 'Nelspruit', 'Rustenburg', 'Kimberley', 'George', 'East Rand',
  'West Rand', 'Centurion', 'Midrand', 'Sandton', 'Randburg', 'Roodepoort', 'Benoni', 'Boksburg',
  'Germiston', 'Kempton Park', 'Springs', 'Vereeniging', 'Vanderbijlpark', 'Soweto', 'Tembisa',
  'Katlehong', 'Umlazi', 'Soshanguve', 'Mamelodi', 'Mitchells Plain', 'Khayelitsha'
]

// Banks in South Africa
const banks = ['FNB', 'Standard Bank', 'ABSA', 'Nedbank', 'Capitec', 'Investec', 'African Bank', 'Bidvest Bank']

// Vertical markets
const verticals = ['Retail', 'Hospitality', 'Healthcare', 'Construction', 'Manufacturing', 'Agriculture', 'Automotive', 'Education']

// Product categories
const productCategories = {
  'Food & Beverage': [
    'Beverages', 'Snacks', 'Dairy', 'Bakery', 'Frozen Foods', 'Canned Goods', 'Condiments', 'Cereals',
    'Confectionery', 'Fresh Produce', 'Meat & Poultry', 'Seafood', 'Spices & Herbs', 'Oils & Fats'
  ],
  'FMCG': [
    'Personal Care', 'Household Cleaning', 'Toiletries', 'Baby Products', 'Pet Care', 'Laundry', 'Air Fresheners',
    'Disposables', 'Paper Products', 'Plastic Products'
  ],
  'Health & Beauty': [
    'Skincare', 'Haircare', 'Cosmetics', 'Fragrances', 'Wellness', 'Supplements', 'Personal Care', 'Salon Equipment'
  ],
  'Pharmaceuticals': [
    'Medicines', 'Medical Devices', 'First Aid', 'Vitamins', 'Medical Supplies', 'Diagnostic Equipment', 'Surgical Supplies'
  ],
  'Electronics': [
    'Consumer Electronics', 'Computer Accessories', 'Mobile Accessories', 'Audio Equipment', 'Video Equipment', 
    'Gaming', 'Smart Home', 'Security Systems'
  ],
  'Hardware & Building': [
    'Power Tools', 'Hand Tools', 'Paint', 'Plumbing', 'Electrical', 'Flooring', 'Roofing', 'Cement & Concrete',
    'Timber', 'Steel & Metal', 'Safety Equipment', 'Garden Equipment'
  ]
}

// Brands by category
const brandsByCategory: Record<string, string[]> = {
  'Beverages': ['Coca-Cola', 'Pepsi', 'Castle', 'Windhoek', 'Red Bull', 'Monster', 'Nescafe', 'Five Roses', 'Joko', 'Freshpak'],
  'Snacks': ['Simba', 'Lays', 'Doritos', 'NikNaks', 'Ghost Pops', 'Provita', 'Bakers', 'Mondelez', 'Cadbury', 'Nestle'],
  'Dairy': ['Clover', 'Fair Cape', 'Danone', 'Parmalat', 'Lancewood', 'Woolworths', 'Pick n Pay', 'Clover'],
  'Personal Care': ['Dove', 'Nivea', 'Palmolive', 'Colgate', 'Aquafresh', 'Head & Shoulders', 'Pantene', 'Garnier'],
  'Household Cleaning': ['Sunlight', 'Omo', 'Surf', 'Domestos', 'Jik', 'Mr Min', 'Handy Andy', 'Lemon'],
  'Hardware': ['Bosch', 'Makita', 'Stanley', 'Ryobi', 'DeWalt', 'Talbot', 'Plascon', 'Dulux'],
  'Electronics': ['Samsung', 'LG', 'Sony', 'Hisense', 'JVC', 'TP-Link', 'Logitech', 'Belkin']
}

function generateId(): string {
  return 'id_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

function generatePhone(): string {
  const prefixes = ['010', '011', '012', '021', '031', '041', '051', '081', '082', '083', '084', '085', '086', '087']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  return prefix + Math.floor(Math.random() * 9000000 + 1000000).toString()
}

function generateEmail(name: string): string {
  const domains = ['co.za', 'com', 'net', 'org']
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '')
  return `${cleanName}@${cleanName}.${domains[Math.floor(Math.random() * domains.length)]}`
}

async function seedSuppliers(targetCount: number = 350) {
  console.log('Seeding suppliers...')
  const existingCount = await prisma.supplier.count()
  const needed = targetCount - existingCount
  
  if (needed <= 0) {
    console.log(`Already have ${existingCount} suppliers, target reached.`)
    return
  }
  
  console.log(`Adding ${needed} more suppliers...`)
  
  const suppliers = []
  for (let i = 0; i < needed; i++) {
    const prefix = supplierPrefixes[Math.floor(Math.random() * supplierPrefixes.length)]
    const suffix = supplierSuffixes[Math.floor(Math.random() * supplierSuffixes.length)]
    const name = `${prefix} ${suffix} ${i + 1}`
    const city = cities[Math.floor(Math.random() * cities.length)]
    const province = provinces[Math.floor(Math.random() * provinces.length)]
    const category = supplierCategories[Math.floor(Math.random() * supplierCategories.length)]
    
    suppliers.push({
      id: generateId(),
      name,
      code: `SUP${String(existingCount + i + 1).padStart(5, '0')}`,
      contactPerson: `Contact Person ${i + 1}`,
      email: generateEmail(name),
      phone: generatePhone(),
      website: `www.${name.toLowerCase().replace(/\s+/g, '')}.co.za`,
      address: `${Math.floor(Math.random() * 999) + 1} ${['Main', 'Church', 'Market', 'High', 'Kerk', 'Voortrekker'][Math.floor(Math.random() * 6)]} Street`,
      city,
      province,
      postalCode: String(Math.floor(Math.random() * 9000) + 1000),
      bankName: banks[Math.floor(Math.random() * banks.length)],
      bankAccount: String(Math.floor(Math.random() * 9000000000) + 1000000000),
      bankBranch: String(Math.floor(Math.random() * 90000) + 10000),
      supplierType: ['distributor', 'manufacturer', 'wholesaler', 'importer'][Math.floor(Math.random() * 4)],
      tier: ['bronze', 'silver', 'gold', 'platinum'][Math.floor(Math.random() * 4)],
      bbbeeLevel: Math.floor(Math.random() * 8) + 1,
      rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0 to 5.0
      reviewCount: Math.floor(Math.random() * 100),
      deliveryDays: Math.floor(Math.random() * 7) + 1,
      minOrderValue: Math.floor(Math.random() * 5000) + 500,
      paymentTerms: ['net30', 'net60', 'cod', 'eom'][Math.floor(Math.random() * 4)],
      categories: category,
      verticals: verticals.slice(0, Math.floor(Math.random() * 4) + 1).join(','),
      fulfillmentRate: Math.round((Math.random() * 20 + 80) * 10) / 10, // 80% to 100%
      status: 'active',
      verificationStatus: ['pending', 'verified', 'under_review'][Math.floor(Math.random() * 3)],
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    // Insert in batches of 50
    if (suppliers.length >= 50) {
      await prisma.supplier.createMany({ data: suppliers, skipDuplicates: true })
      console.log(`Inserted ${suppliers.length} suppliers...`)
      suppliers.length = 0
    }
  }
  
  // Insert remaining suppliers
  if (suppliers.length > 0) {
    await prisma.supplier.createMany({ data: suppliers, skipDuplicates: true })
    console.log(`Inserted final ${suppliers.length} suppliers`)
  }
  
  const finalCount = await prisma.supplier.count()
  console.log(`Total suppliers: ${finalCount}`)
}

async function seedCatalogProducts(targetCount: number = 150) {
  console.log('Seeding catalog products...')
  const existingCount = await prisma.catalogProduct.count()
  const needed = targetCount - existingCount
  
  if (needed <= 0) {
    console.log(`Already have ${existingCount} catalog products, target reached.`)
    return
  }
  
  console.log(`Adding ${needed} catalog products...`)
  
  // Get all suppliers and wholesalers
  const suppliers = await prisma.supplier.findMany({ select: { id: true } })
  const wholesalers = await prisma.wholesaler.findMany({ select: { id: true } })
  
  const products = []
  const categories = Object.keys(productCategories)
  
  for (let i = 0; i < needed; i++) {
    const mainCategory = categories[Math.floor(Math.random() * categories.length)]
    const subCategories = productCategories[mainCategory as keyof typeof productCategories] || ['General']
    const subCategory = subCategories[Math.floor(Math.random() * subCategories.length)]
    
    const brands = brandsByCategory[subCategory] || brandsByCategory[mainCategory] || ['Generic', 'Store Brand', 'Private Label']
    const brand = brands[Math.floor(Math.random() * brands.length)]
    
    const packSizes = ['Single', 'Pack of 6', 'Pack of 12', '500ml', '1L', '2L', '500g', '1kg', '5kg', '10kg', 'Case', 'Box', 'Carton']
    const packSize = packSizes[Math.floor(Math.random() * packSizes.length)]
    
    const units = ['Each', 'Box', 'Case', 'Carton', 'Pack', 'kg', 'L', 'ml', 'g']
    const unit = units[Math.floor(Math.random() * units.length)]
    
    const costPrice = Math.round((Math.random() * 500 + 10) * 100) / 100
    const retailPrice = Math.round(costPrice * (Math.random() * 0.5 + 1.3) * 100) / 100 // 30-80% markup
    const grossMargin = Math.round(((retailPrice - costPrice) / retailPrice) * 100 * 10) / 10
    
    const sourceType = Math.random() > 0.5 ? 'supplier' : 'wholesale'
    const supplierId = suppliers.length > 0 ? suppliers[Math.floor(Math.random() * suppliers.length)].id : null
    const wholesalerId = wholesalers.length > 0 ? wholesalers[Math.floor(Math.random() * wholesalers.length)].id : null
    
    products.push({
      id: generateId(),
      sku: `CAT-${String(i + 1).padStart(5, '0')}`,
      sourceType,
      wholesalerId: sourceType === 'wholesale' ? wholesalerId : null,
      supplierId: sourceType === 'supplier' ? supplierId : null,
      vertical: verticals[Math.floor(Math.random() * verticals.length)],
      subVertical: verticals[Math.floor(Math.random() * verticals.length)],
      category: mainCategory,
      subCategory,
      description: `${brand} ${subCategory} - ${packSize}`,
      brand,
      packSize,
      unit,
      vatRate: 15.0,
      costPrice,
      retailPrice,
      grossMargin,
      minOrderQty: Math.floor(Math.random() * 10) + 1,
      leadDays: Math.floor(Math.random() * 14) + 1,
      inStock: Math.random() > 0.2, // 80% in stock
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    // Insert in batches of 30
    if (products.length >= 30) {
      await prisma.catalogProduct.createMany({ data: products, skipDuplicates: true })
      console.log(`Inserted ${products.length} products...`)
      products.length = 0
    }
  }
  
  // Insert remaining products
  if (products.length > 0) {
    await prisma.catalogProduct.createMany({ data: products, skipDuplicates: true })
    console.log(`Inserted final ${products.length} products`)
  }
  
  const finalCount = await prisma.catalogProduct.count()
  console.log(`Total catalog products: ${finalCount}`)
}

async function seedAdminUsers() {
  console.log('Seeding admin users...')
  
  const existingCount = await prisma.adminUser.count()
  if (existingCount > 0) {
    console.log(`Already have ${existingCount} admin users`)
    return
  }
  
  const adminUsers = [
    {
      id: generateId(),
      email: 'admin@grosupply.com',
      name: 'System Administrator',
      role: 'super_admin',
      department: 'Operations',
      phone: '+27123456789',
      passwordHash: '$2b$10$dummy.hash.for.demo.purposes.only',
      mfaEnabled: true,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: generateId(),
      email: 'support@grosupply.com',
      name: 'Support Team Lead',
      role: 'admin',
      department: 'Support',
      phone: '+27123456790',
      passwordHash: '$2b$10$dummy.hash.for.demo.purposes.only',
      mfaEnabled: true,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: generateId(),
      email: 'compliance@grosupply.com',
      name: 'Compliance Officer',
      role: 'compliance',
      department: 'Compliance',
      phone: '+27123456791',
      passwordHash: '$2b$10$dummy.hash.for.demo.purposes.only',
      mfaEnabled: true,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: generateId(),
      email: 'finance@grosupply.com',
      name: 'Finance Manager',
      role: 'finance',
      department: 'Finance',
      phone: '+27123456792',
      passwordHash: '$2b$10$dummy.hash.for.demo.purposes.only',
      mfaEnabled: true,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: generateId(),
      email: 'sales@grosupply.com',
      name: 'Sales Manager',
      role: 'sales_manager',
      department: 'Sales',
      phone: '+27123456793',
      passwordHash: '$2b$10$dummy.hash.for.demo.purposes.only',
      mfaEnabled: true,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
  
  await prisma.adminUser.createMany({ data: adminUsers, skipDuplicates: true })
  console.log(`Created ${adminUsers.length} admin users`)
}

async function seedConsumerUsers(count: number = 100) {
  console.log('Seeding consumer users...')
  
  const existingCount = await prisma.consumerUser.count()
  if (existingCount >= count) {
    console.log(`Already have ${existingCount} consumer users`)
    return
  }
  
  const needed = count - existingCount
  const consumers = []
  
  const firstNames = ['Thabo', 'Mpho', 'Lerato', 'Sipho', 'Nomsa', 'Johan', 'Pieter', 'Maria', 'David', 'Sarah',
    'James', 'Nomvula', 'Michael', 'Elizabeth', 'Daniel', 'Grace', 'Peter', 'Faith', 'John', 'Hope',
    'Sizwe', 'Pulane', 'Kagiso', 'Mpho', 'Themba', 'Zanele', 'Bongani', 'Precious', 'Sibusiso', 'Nokuthula']
  
  const lastNames = ['Mokoena', 'Nkosi', 'Dlamini', 'Ndlovu', 'Zulu', 'Van der Merwe', 'Botha', 'Mahlangu', 'Mabaso', 'Naidoo',
    'Pillay', 'Singh', 'Moodley', 'Ndaba', 'Mthembu', 'Zwane', 'Mkhize', 'Khumalo', 'Molefe', 'Radebe']
  
  for (let i = 0; i < needed; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
    const phone = `+27${Math.floor(Math.random() * 900000000 + 100000000)}`
    
    consumers.push({
      id: generateId(),
      phone,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.co.za`,
      firstName,
      lastName,
      idNumber: `${String(Math.floor(Math.random() * 99)).padStart(2, '0')}${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}${Math.floor(Math.random() * 9000) + 1000}${Math.floor(Math.random() * 10) % 2 === 0 ? Math.floor(Math.random() * 5000) + 1000 : Math.floor(Math.random() * 5000) + 5000}${Math.floor(Math.random() * 10)}`,
      idType: 'sa_id',
      dateOfBirth: `${1970 + Math.floor(Math.random() * 40)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      nationality: 'ZA',
      kycLevel: Math.floor(Math.random() * 4),
      kycStatus: ['pending', 'verified', 'under_review', 'rejected'][Math.floor(Math.random() * 4)],
      languagePreference: Math.random() > 0.7 ? 'zu' : 'en',
      accountStatus: 'active',
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)),
      updatedAt: new Date()
    })
    
    if (consumers.length >= 50) {
      await prisma.consumerUser.createMany({ data: consumers, skipDuplicates: true })
      console.log(`Inserted ${consumers.length} consumers...`)
      consumers.length = 0
    }
  }
  
  if (consumers.length > 0) {
    await prisma.consumerUser.createMany({ data: consumers, skipDuplicates: true })
    console.log(`Inserted final ${consumers.length} consumers`)
  }
  
  const finalCount = await prisma.consumerUser.count()
  console.log(`Total consumer users: ${finalCount}`)
}

async function main() {
  console.log('Starting comprehensive database seed...')
  console.log('========================================')
  
  await seedSuppliers(350)
  await seedCatalogProducts(150)
  await seedAdminUsers()
  await seedConsumerUsers(100)
  
  console.log('========================================')
  console.log('Database seed complete!')
  
  // Final counts
  console.log('\nFinal Database Counts:')
  console.log('Suppliers:', await prisma.supplier.count())
  console.log('Catalog Products:', await prisma.catalogProduct.count())
  console.log('Admin Users:', await prisma.adminUser.count())
  console.log('Consumer Users:', await prisma.consumerUser.count())
  console.log('Merchants:', await prisma.merchant.count())
  console.log('Wholesalers:', await prisma.wholesaler.count())
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
