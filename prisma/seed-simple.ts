import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const provinces = ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape']
const cities = ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein', 'East London', 'Pietermaritzburg', 'Polokwane', 'Nelspruit']
const banks = ['FNB', 'Standard Bank', 'ABSA', 'Nedbank', 'Capitec', 'Investec']
const categories = ['Food & Beverage', 'FMCG', 'Health & Beauty', 'Electronics', 'Hardware', 'Automotive', 'Textiles', 'Agriculture']
const verticals = ['Retail', 'Hospitality', 'Healthcare', 'Construction', 'Manufacturing']
const supplierTypes = ['distributor', 'manufacturer', 'wholesaler', 'importer']
const tiers = ['bronze', 'silver', 'gold', 'platinum']
const paymentTerms = ['net30', 'net60', 'cod', 'eom']

function genId(): string {
  return 'sup_' + Math.random().toString(36).substring(2, 12)
}

function genPhone(): string {
  return '0' + (Math.floor(Math.random() * 9) + 1) + Math.floor(Math.random() * 90000000 + 10000000)
}

async function main() {
  console.log('Starting seed process...')
  
  // Get current counts
  const currentSuppliers = await prisma.supplier.count()
  const currentProducts = await prisma.catalogProduct.count()
  
  console.log(`Current: ${currentSuppliers} suppliers, ${currentProducts} products`)
  
  // Seed suppliers to reach 350
  const suppliersNeeded = 350 - currentSuppliers
  if (suppliersNeeded > 0) {
    console.log(`Adding ${suppliersNeeded} suppliers...`)
    
    for (let i = 0; i < suppliersNeeded; i++) {
      const prefix = ['Africa', 'South', 'National', 'Premier', 'Global', 'Elite', 'Prime', 'Royal', 'Golden', 'Silver'][Math.floor(Math.random() * 10)]
      const suffix = ['Distributors', 'Suppliers', 'Wholesalers', 'Trading', 'Enterprises', 'Group'][Math.floor(Math.random() * 6)]
      const name = `${prefix} ${suffix} SA ${currentSuppliers + i + 1}`
      
      try {
        await prisma.supplier.create({
          data: {
            id: genId(),
            name,
            code: `SUP${String(currentSuppliers + i + 1).padStart(5, '0')}`,
            contactPerson: `Contact ${i + 1}`,
            email: `supplier${currentSuppliers + i + 1}@example.co.za`,
            phone: genPhone(),
            city: cities[Math.floor(Math.random() * cities.length)],
            province: provinces[Math.floor(Math.random() * provinces.length)],
            bankName: banks[Math.floor(Math.random() * banks.length)],
            supplierType: supplierTypes[Math.floor(Math.random() * supplierTypes.length)],
            tier: tiers[Math.floor(Math.random() * tiers.length)],
            bbbeeLevel: Math.floor(Math.random() * 8) + 1,
            rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
            deliveryDays: Math.floor(Math.random() * 7) + 1,
            minOrderValue: Math.floor(Math.random() * 5000) + 500,
            paymentTerms: paymentTerms[Math.floor(Math.random() * paymentTerms.length)],
            categories: categories[Math.floor(Math.random() * categories.length)],
            verticals: verticals.slice(0, Math.floor(Math.random() * 3) + 1).join(','),
            fulfillmentRate: Math.round((Math.random() * 20 + 80) * 10) / 10,
            status: 'active',
            verificationStatus: ['pending', 'verified', 'under_review'][Math.floor(Math.random() * 3)],
            updatedAt: new Date()
          }
        })
        
        if ((i + 1) % 20 === 0) {
          console.log(`Added ${i + 1} suppliers...`)
        }
      } catch (e) {
        // Skip duplicates
      }
    }
  }
  
  // Get suppliers for product references
  const suppliers = await prisma.supplier.findMany({ select: { id: true }, take: 100 })
  const wholesalers = await prisma.wholesaler.findMany({ select: { id: true } })
  
  // Seed products to reach 150
  const productsNeeded = 150 - currentProducts
  if (productsNeeded > 0) {
    console.log(`Adding ${productsNeeded} products...`)
    
    const productCategories = ['Beverages', 'Snacks', 'Dairy', 'Personal Care', 'Household', 'Hardware', 'Electronics']
    const brands = ['Brand A', 'Brand B', 'Brand C', 'Premium', 'Value', 'Economy']
    const units = ['Each', 'Box', 'Case', 'kg', 'L', 'Pack']
    const packSizes = ['Single', '500ml', '1L', '2L', '500g', '1kg', '5kg', 'Pack of 6', 'Case of 12']
    
    for (let i = 0; i < productsNeeded; i++) {
      const category = productCategories[Math.floor(Math.random() * productCategories.length)]
      const costPrice = Math.round((Math.random() * 500 + 10) * 100) / 100
      const retailPrice = Math.round(costPrice * (Math.random() * 0.5 + 1.3) * 100) / 100
      const sourceType = Math.random() > 0.5 ? 'supplier' : 'wholesale'
      
      try {
        await prisma.catalogProduct.create({
          data: {
            id: 'prod_' + Math.random().toString(36).substring(2, 12),
            sku: `CAT-${String(currentProducts + i + 1).padStart(5, '0')}`,
            sourceType,
            wholesalerId: sourceType === 'wholesale' && wholesalers.length > 0 ? wholesalers[Math.floor(Math.random() * wholesalers.length)].id : null,
            supplierId: sourceType === 'supplier' && suppliers.length > 0 ? suppliers[Math.floor(Math.random() * suppliers.length)].id : null,
            vertical: verticals[Math.floor(Math.random() * verticals.length)],
            category,
            description: `${brands[Math.floor(Math.random() * brands.length)]} ${category} - ${packSizes[Math.floor(Math.random() * packSizes.length)]}`,
            brand: brands[Math.floor(Math.random() * brands.length)],
            packSize: packSizes[Math.floor(Math.random() * packSizes.length)],
            unit: units[Math.floor(Math.random() * units.length)],
            costPrice,
            retailPrice,
            grossMargin: Math.round(((retailPrice - costPrice) / retailPrice) * 100 * 10) / 10,
            minOrderQty: Math.floor(Math.random() * 10) + 1,
            leadDays: Math.floor(Math.random() * 14) + 1,
            inStock: Math.random() > 0.2,
            status: 'active',
            updatedAt: new Date()
          }
        })
        
        if ((i + 1) % 20 === 0) {
          console.log(`Added ${i + 1} products...`)
        }
      } catch (e) {
        // Skip duplicates
      }
    }
  }
  
  // Seed admin users
  const adminCount = await prisma.adminUser.count()
  if (adminCount === 0) {
    console.log('Adding admin users...')
    
    const adminUsers = [
      { email: 'admin@grosupply.com', name: 'System Administrator', role: 'super_admin', department: 'Operations' },
      { email: 'support@grosupply.com', name: 'Support Lead', role: 'admin', department: 'Support' },
      { email: 'compliance@grosupply.com', name: 'Compliance Officer', role: 'compliance', department: 'Compliance' },
      { email: 'finance@grosupply.com', name: 'Finance Manager', role: 'finance', department: 'Finance' },
      { email: 'sales@grosupply.com', name: 'Sales Manager', role: 'sales_manager', department: 'Sales' }
    ]
    
    for (const admin of adminUsers) {
      await prisma.adminUser.create({
        data: {
          id: 'admin_' + Math.random().toString(36).substring(2, 12),
          email: admin.email,
          name: admin.name,
          role: admin.role,
          department: admin.department,
          passwordHash: '$2b$10$demo.hash.not.for.production',
          mfaEnabled: true,
          status: 'active',
          updatedAt: new Date()
        }
      })
    }
    console.log('Added 5 admin users')
  }
  
  // Final counts
  console.log('\n=== Final Database Counts ===')
  console.log('Suppliers:', await prisma.supplier.count())
  console.log('Catalog Products:', await prisma.catalogProduct.count())
  console.log('Admin Users:', await prisma.adminUser.count())
  console.log('Consumer Users:', await prisma.consumerUser.count())
  console.log('Merchants:', await prisma.merchant.count())
  console.log('Wholesalers:', await prisma.wholesaler.count())
  console.log('=============================')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
