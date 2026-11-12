import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

// Real South African suppliers from the SKU catalog
const realSuppliers = [
  { name: 'SAB (AB InBev SA)', code: 'SAB', website: 'sabmiller.co.za', verticals: ['Food & Beverage', 'Liquor & Nightlife'], tier: 'gold', bbbeeLevel: 2, deliveryDays: 1, minOrderUnit: '1 case', notes: 'Castle, Hansa, Carling Black Label. Excise duty compliant.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Heineken Beverages SA', code: 'HEINEKEN', website: 'heineken.co.za', verticals: ['Food & Beverage', 'Liquor & Nightlife'], tier: 'gold', bbbeeLevel: 2, deliveryDays: 1, minOrderUnit: '1 case', notes: 'Heineken, Amstel, Windhoek, Tafel. SARB excise reg.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Distell Group', code: 'DISTELL', website: 'distell.co.za', verticals: ['Liquor & Nightlife'], tier: 'gold', bbbeeLevel: 2, deliveryDays: 2, minOrderUnit: '1 case', notes: 'KWV, Klipdrift, Savanna, Hunter\'s, Durbanville Hills.', supplierType: 'manufacturer', city: 'Stellenbosch', province: 'Western Cape' },
  { name: 'Tiger Brands', code: 'TIGER', website: 'tigerbrands.co.za', verticals: ['Grocery & FMCG', 'Food & Beverage'], tier: 'gold', bbbeeLevel: 4, deliveryDays: 1, minOrderUnit: '1 case', notes: 'All Gold, Ace, Koo, Purity, Tastic, Oros. Category leader.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Pioneer Foods (PepsiCo)', code: 'PIONEER', website: 'pioneerfoodssa.co.za', verticals: ['Grocery & FMCG', 'Food & Beverage'], tier: 'gold', bbbeeLevel: 3, deliveryDays: 1, minOrderUnit: '5 units', notes: 'Sasko, Spekko, Ceres, Bokomo, Weet-Bix, Corn Flakes.', supplierType: 'manufacturer', city: 'Cape Town', province: 'Western Cape' },
  { name: 'Premier Foods', code: 'PREMIER', website: 'premierfm.co.za', verticals: ['Grocery & FMCG', 'Food & Beverage'], tier: 'gold', bbbeeLevel: 4, deliveryDays: 1, minOrderUnit: '5 units', notes: 'Snowflake, Albany, Iwisa, Blue Ribbon. Bread & flour leader.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Clover SA', code: 'CLOVER', website: 'clover.co.za', verticals: ['Grocery & FMCG', 'Hospitality'], tier: 'gold', bbbeeLevel: 3, deliveryDays: 1, minOrderUnit: '6 units', notes: 'Milk, cheese, yogurt, Tropika, Aquartz. Chilled delivery.', supplierType: 'manufacturer', city: 'Pretoria', province: 'Gauteng' },
  { name: 'Coca-Cola Beverages SA', code: 'CCBSA', website: 'coca-colabeverages.co.za', verticals: ['Food & Beverage', 'Grocery & FMCG'], tier: 'gold', bbbeeLevel: 2, deliveryDays: 1, minOrderUnit: '1 tray', notes: 'Coke, Fanta, Sprite, Powerade, Schweppes, Minute Maid.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Unilever SA', code: 'UNILEVER', website: 'unilever.co.za', verticals: ['Grocery & FMCG', 'Health & Beauty'], tier: 'gold', bbbeeLevel: 1, deliveryDays: 1, minOrderUnit: '1 case', notes: 'Dove, Sunlight, Omo, Stork, Lifebuoy, Knorr, Rajah.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Illovo Sugar (Huletts)', code: 'ILLOVO', website: 'illovo.co.za', verticals: ['Grocery & FMCG', 'Food & Beverage'], tier: 'gold', bbbeeLevel: 3, deliveryDays: 2, minOrderUnit: '2 bags', notes: 'Huletts, White Sugar, Brown Sugar. Major SA refiner.', supplierType: 'manufacturer', city: 'Durban', province: 'KwaZulu-Natal' },
  { name: 'Astral Foods / County Fair', code: 'ASTRAL', website: 'astralfoods.com', verticals: ['Food & Beverage', 'Grocery & FMCG'], tier: 'gold', bbbeeLevel: 4, deliveryDays: 1, minOrderUnit: '5 kg', notes: 'Goldi, County Fair, Festive. SA\'s largest poultry producer.', supplierType: 'manufacturer', city: 'Centurion', province: 'Gauteng' },
  { name: 'Rainbow Chicken', code: 'RAINBOW', website: 'rainbowchicken.co.za', verticals: ['Food & Beverage', 'Grocery & FMCG'], tier: 'gold', bbbeeLevel: 3, deliveryDays: 1, minOrderUnit: '5 kg', notes: 'Fresh and frozen chicken products. National distribution.', supplierType: 'manufacturer', city: 'Hammarsdale', province: 'KwaZulu-Natal' },
  { name: 'PPC Cement', code: 'PPC', website: 'ppc.co.za', verticals: ['Hardware & Building'], tier: 'gold', bbbeeLevel: 2, deliveryDays: 2, minOrderUnit: '1 bag', notes: 'Ordinary Portland Cement. Nationwide. Bulk pricing.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Plascon SA', code: 'PLASCON', website: 'plascon.co.za', verticals: ['Hardware & Building'], tier: 'gold', bbbeeLevel: 2, deliveryDays: 3, minOrderUnit: '1 bucket', notes: 'Interior/exterior paint. Major SA paint brand.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'L\'Oréal SA Professional', code: 'LOREAL', website: 'loreal.co.za', verticals: ['Health & Beauty'], tier: 'silver', bbbeeLevel: 1, deliveryDays: 5, minOrderUnit: '12 tubes', notes: 'Majirel, Inoa, Kérastase, Wella professional.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Adcock Ingram', code: 'ADCOCK', website: 'adcock.co.za', verticals: ['Health & Pharmacy'], tier: 'gold', bbbeeLevel: 2, deliveryDays: 3, minOrderUnit: '24 units', notes: 'Panado, Corenza, Betadine, Bioplus. SAHPRA registered.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Aspen Pharmacare', code: 'ASPEN', website: 'aspenpharma.com', verticals: ['Health & Pharmacy'], tier: 'gold', bbbeeLevel: 2, deliveryDays: 3, minOrderUnit: '24 units', notes: 'Generic medicines, Allergex. SAHPRA. SA manufacturer.', supplierType: 'manufacturer', city: 'Durban', province: 'KwaZulu-Natal' },
  { name: 'Samsung SA', code: 'SAMSUNG', website: 'samsung.com/za', verticals: ['Electronics & Tech'], tier: 'gold', bbbeeLevel: 1, deliveryDays: 3, minOrderUnit: '1 unit', notes: 'Phones, TVs, appliances. ICASA certified.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Bidvest Catering Supplies', code: 'BIDVEST', website: 'bidvest.co.za', verticals: ['Food & Beverage', 'Hospitality'], tier: 'gold', bbbeeLevel: 1, deliveryDays: 5, minOrderUnit: '1 unit', notes: 'Full catering equipment, disposables. National.', supplierType: 'distributor', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Kimberly-Clark SA', code: 'KIMBERLY', website: 'huggies.co.za', verticals: ['Childcare & Education'], tier: 'gold', bbbeeLevel: 1, deliveryDays: 1, minOrderUnit: '1 pack', notes: 'Huggies nappies, wipes, Kleenex, Scott.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
]

async function seedSuppliers() {
  console.log('Seeding suppliers...')
  
  // Check existing count
  const existingCount = await prisma.supplier.count()
  console.log(`Existing suppliers: ${existingCount}`)
  
  // Insert real suppliers first
  for (const supplier of realSuppliers) {
    try {
      await prisma.supplier.upsert({
        where: { code: supplier.code },
        update: {
          name: supplier.name,
          website: supplier.website,
          verticals: JSON.stringify(supplier.verticals),
          tier: supplier.tier,
          bbbeeLevel: supplier.bbbeeLevel,
          deliveryDays: supplier.deliveryDays,
          minOrderUnit: supplier.minOrderUnit,
          notes: supplier.notes,
          supplierType: supplier.supplierType,
          city: supplier.city,
          province: supplier.province,
          status: 'active',
          verificationStatus: 'verified',
          verifiedAt: new Date(),
          updatedAt: new Date(),
          rating: supplier.tier === 'gold' ? 4.7 : 4.4,
          fulfillmentRate: supplier.tier === 'gold' ? 97.5 : 95.0,
        },
        create: {
          id: randomUUID(),
          name: supplier.name,
          code: supplier.code,
          website: supplier.website,
          verticals: JSON.stringify(supplier.verticals),
          tier: supplier.tier,
          bbbeeLevel: supplier.bbbeeLevel,
          deliveryDays: supplier.deliveryDays,
          minOrderUnit: supplier.minOrderUnit,
          notes: supplier.notes,
          supplierType: supplier.supplierType,
          city: supplier.city,
          province: supplier.province,
          status: 'active',
          verificationStatus: 'verified',
          verifiedAt: new Date(),
          updatedAt: new Date(),
          rating: supplier.tier === 'gold' ? 4.7 : 4.4,
          fulfillmentRate: supplier.tier === 'gold' ? 97.5 : 95.0,
        },
      })
    } catch (e) {
      console.log(`Skipped ${supplier.name} (may already exist)`)
    }
  }
  
  // Generate additional suppliers to reach 350
  const currentCount = await prisma.supplier.count()
  const needed = 350 - currentCount
  
  if (needed > 0) {
    console.log(`Adding ${needed} more suppliers...`)
    
    const prefixes = ['Africa', 'South', 'National', 'Continental', 'Global', 'Premier', 'Elite', 'Prime', 'Royal', 'Golden', 'Silver', 'Diamond', 'Crown', 'Star', 'Coastal', 'Inland', 'Urban', 'Rural', 'Delta', 'Valley']
    const suffixes = ['Distributors', 'Suppliers', 'Wholesalers', 'Trading', 'Enterprises', 'Group', 'Holdings', 'Solutions', 'Logistics', 'Merchandise', 'Imports', 'Exports', 'SA', 'Pty Ltd']
    const provinces = ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape']
    const cities = ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein', 'East London', 'Pietermaritzburg', 'Polokwane', 'Nelspruit']
    const types = ['distributor', 'manufacturer', 'wholesaler', 'importer']
    const tiers = ['bronze', 'silver', 'gold', 'platinum']
    const categories = ['Food & Beverage', 'FMCG', 'Health & Beauty', 'Pharmaceuticals', 'Electronics', 'Hardware & Building', 'Automotive', 'Textiles & Apparel', 'Agriculture', 'Chemicals']
    
    for (let i = 0; i < needed; i++) {
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
      const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]
      const name = `${prefix} ${suffix} ${currentCount + i + 1}`
      const code = `SUP${String(currentCount + i + 1).padStart(5, '0')}`
      
      try {
        await prisma.supplier.create({
          data: {
            id: randomUUID(),
            name,
            code,
            website: `www.${name.toLowerCase().replace(/\s+/g, '')}.co.za`,
            city: cities[Math.floor(Math.random() * cities.length)],
            province: provinces[Math.floor(Math.random() * provinces.length)],
            supplierType: types[Math.floor(Math.random() * types.length)] as 'distributor' | 'manufacturer' | 'wholesaler' | 'importer',
            tier: tiers[Math.floor(Math.random() * tiers.length)] as 'bronze' | 'silver' | 'gold' | 'platinum',
            bbbeeLevel: Math.floor(Math.random() * 8) + 1,
            deliveryDays: Math.floor(Math.random() * 7) + 1,
            minOrderValue: Math.floor(Math.random() * 5000) + 500,
            categories: categories[Math.floor(Math.random() * categories.length)],
            verticals: 'Retail,Hospitality',
            rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
            fulfillmentRate: Math.round((Math.random() * 20 + 80) * 10) / 10,
            status: 'active',
            verificationStatus: 'verified',
            updatedAt: new Date(),
          },
        })
      } catch (e) {
        // Skip duplicates
      }
      
      if ((i + 1) % 50 === 0) {
        console.log(`Inserted ${i + 1} suppliers...`)
      }
    }
  }
  
  const finalCount = await prisma.supplier.count()
  console.log(`Total suppliers: ${finalCount}`)
}

async function seedCatalogProducts() {
  console.log('Seeding catalog products...')
  
  const existingCount = await prisma.catalogProduct.count()
  console.log(`Existing catalog products: ${existingCount}`)
  
  if (existingCount >= 150) {
    console.log('Already have enough catalog products')
    return
  }
  
  const suppliers = await prisma.supplier.findMany({ select: { id: true } })
  const needed = 150 - existingCount
  
  const categories = ['Beverages', 'Snacks', 'Dairy', 'Bakery', 'Frozen Foods', 'Personal Care', 'Household', 'Hardware', 'Electronics', 'Automotive']
  const brands = ['Coca-Cola', 'Pepsi', 'Simba', 'Lays', 'Clover', 'Danone', 'Albany', ' Sasko', 'Dove', 'Sunlight', 'Bosch', 'Samsung', 'Castrol']
  const packSizes = ['Single', 'Pack of 6', 'Pack of 12', '500ml', '1L', '2L', '500g', '1kg', '5kg', 'Case']
  const units = ['Each', 'Box', 'Case', 'Pack', 'kg', 'L']
  const verticals = ['Food & Beverage', 'Grocery & FMCG', 'Health & Beauty', 'Hardware & Building', 'Electronics & Tech']
  
  for (let i = 0; i < needed; i++) {
    const costPrice = Math.round((Math.random() * 500 + 10) * 100) / 100
    const retailPrice = Math.round(costPrice * (Math.random() * 0.5 + 1.3) * 100) / 100
    const grossMargin = Math.round(((retailPrice - costPrice) / retailPrice) * 100 * 10) / 10
    
    try {
      await prisma.catalogProduct.create({
        data: {
          id: randomUUID(),
          sku: `CAT-${String(existingCount + i + 1).padStart(5, '0')}`,
          sourceType: 'supplier',
          supplierId: suppliers.length > 0 ? suppliers[Math.floor(Math.random() * suppliers.length)].id : null,
          vertical: verticals[Math.floor(Math.random() * verticals.length)],
          category: categories[Math.floor(Math.random() * categories.length)],
          description: `${brands[Math.floor(Math.random() * brands.length)]} Product ${i + 1}`,
          brand: brands[Math.floor(Math.random() * brands.length)],
          packSize: packSizes[Math.floor(Math.random() * packSizes.length)],
          unit: units[Math.floor(Math.random() * units.length)],
          vatRate: 15.0,
          costPrice,
          retailPrice,
          grossMargin,
          minOrderQty: Math.floor(Math.random() * 10) + 1,
          leadDays: Math.floor(Math.random() * 14) + 1,
          inStock: Math.random() > 0.2,
          status: 'active',
          updatedAt: new Date(),
        },
      })
    } catch (e) {
      // Skip duplicates
    }
    
    if ((i + 1) % 50 === 0) {
      console.log(`Inserted ${i + 1} products...`)
    }
  }
  
  const finalCount = await prisma.catalogProduct.count()
  console.log(`Total catalog products: ${finalCount}`)
}

async function main() {
  console.log('Starting data restoration...')
  console.log('========================================')
  
  await seedSuppliers()
  await seedCatalogProducts()
  
  console.log('========================================')
  console.log('Data restoration complete!')
  
  console.log('\nFinal Database Counts:')
  console.log('Suppliers:', await prisma.supplier.count())
  console.log('Catalog Products:', await prisma.catalogProduct.count())
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
