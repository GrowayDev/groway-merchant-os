/**
 * Inventory seed — imports catalog products into each merchant's Product table.
 * Each merchant gets products from their vertical's catalog, with:
 * - Stock levels (random 20-500 units)
 * - Reorder points and quantities
 * - Barcodes (EAN-13 format)
 * - Selling prices with margins
 * - Product categories per merchant
 *
 * Run with: bun run scripts/seed-inventory.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Merchant → vertical mapping (from comprehensive-seed)
const MERCHANTS = [
  { id: 'merchant-demo', name: 'Demo Spaza Shop', vertical: 'grocery', subVertical: 'spaza', email: 'demo@groway.co.za', phone: '+27123456789' },
  { id: 'merchant-spaza', name: 'Mama Thandi Spaza', vertical: 'grocery', subVertical: 'spaza', email: 'spaza@groway.co.za', phone: '+27123456790' },
  { id: 'merchant-restaurant', name: 'The Coffee Corner', vertical: 'fnb', subVertical: 'coffee_shop', email: 'restaurant@groway.co.za', phone: '+27123456791' },
  { id: 'merchant-salon', name: 'Demo Salon', vertical: 'health-beauty', subVertical: 'hair_salon', email: 'salon@groway.co.za', phone: '+27123456792' },
  { id: 'merchant-pharmacy', name: 'Demo Pharmacy', vertical: 'health-pharmacy', subVertical: 'pharmacy', email: 'pharmacy@groway.co.za', phone: '+27123456793' },
]

// Default categories per vertical
const VERTICAL_CATEGORIES: Record<string, string[]> = {
  grocery: ['Staples', 'Dairy & Eggs', 'Bakery', 'Beverages', 'Snacks', 'Household', 'Personal Care', 'Frozen', 'Tobacco', 'Services'],
  fnb: ['Ingredients', 'Meat & Poultry', 'Produce', 'Dairy', 'Bakery', 'Beverages', 'Condiments', 'Packaging', 'Cleaning', 'Supplies'],
  'health-beauty': ['Hair Care', 'Treatments', 'Color', 'Styling', 'Tools', 'Equipment', 'Supplies', 'Products'],
  'health-pharmacy': ['OTC Medication', 'Supplements', 'First Aid', 'Antiseptic', 'Personal Care', 'Supplies', 'Vitamins'],
  liquor: ['Beer', 'Wine', 'Spirits', 'Cider', 'Coolers', 'Sparkling', 'Mixers', 'Supplies'],
  fashion: ['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Accessories', 'Basics', 'Footwear'],
  hospitality: ['Linens', 'Amenities', 'Room Supplies', 'Minibar', 'Food', 'Beverages', 'Cleaning'],
  hardware: ['Building', 'Fixings', 'Ironmongery', 'Plumbing', 'Electrical', 'Painting', 'Tools'],
  electronics: ['Phones', 'Computers', 'Audio', 'Accessories', 'Chargers', 'Cables', 'Storage'],
  'sport-leisure': ['Equipment', 'Accessories', 'Supplements', 'Apparel', 'Balls'],
  childcare: ['Stationery', 'Books', 'Toys', 'Art', 'Safety', 'Food', 'Supplies'],
  'professional-services': ['Supplies', 'Tools', 'Equipment', 'Forms', 'PPE', 'Consumables'],
  agriculture: ['Feed', 'Supplements', 'Veterinary', 'Equipment', 'Chemicals', 'Fencing', 'Irrigation', 'Seed'],
}

function generateEAN13(): string {
  // South African prefix: 600-601
  let code = '600'
  for (let i = 0; i < 9; i++) {
    code += Math.floor(Math.random() * 10)
  }
  // Calculate check digit
  const digits = code.split('').map(Number)
  const sum = digits.reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 1 : 3), 0)
  const checkDigit = (10 - (sum % 10)) % 10
  return code + checkDigit
}

async function main() {
  console.log('Starting inventory seed...\n')

  let totalProducts = 0
  let totalCategories = 0

  for (const merchant of MERCHANTS) {
    console.log(`Processing merchant: ${merchant.id} (${merchant.vertical}/${merchant.subVertical})`)

    // Create merchant if not exists
    try {
      await prisma.merchant.upsert({
        where: { id: merchant.id },
        update: {},
        create: {
          id: merchant.id,
          code: `MCH-${merchant.id.substring(9).toUpperCase()}`,
          name: merchant.name,
          vertical: merchant.vertical,
          subVertical: merchant.subVertical,
          email: merchant.email,
          phone: merchant.phone,
          addressLine1: '123 Business Street',
          city: 'Johannesburg',
          province: 'Gauteng',
          postalCode: '2000',
          country: 'South Africa',
          currency: 'ZAR',
          timezone: 'Africa/Johannesburg',
          vatRate: 15.0,
          vatRegistered: true,
          posEnabled: true,
          onboardingComplete: true,
          status: 'active',
          kycStatus: 'verified',
          plan: 'professional',
          updatedAt: new Date(),
        },
      })
    } catch (e: any) {
      // May already exist with different code
    }

    // Create default branch if not exists
    const branchId = `branch-${merchant.id}-main`
    try {
      await prisma.branch.upsert({
        where: { id: branchId },
        update: {},
        create: {
          id: branchId,
          merchantId: merchant.id,
          code: `BR-${merchant.id.substring(9, 12).toUpperCase()}`,
          name: `${merchant.name} - Main`,
          addressLine1: '123 Business Street',
          city: 'Johannesburg',
          province: 'Gauteng',
          postalCode: '2000',
          phone: merchant.phone,
          email: merchant.email,
          isDefault: true,
          isActive: true,
          updatedAt: new Date(),
        },
      })
    } catch (e: any) {
      // May already exist
    }

    // Find the merchant's default branch
    const branch = await prisma.branch.findFirst({
      where: { merchantId: merchant.id, isDefault: true },
    })

    if (!branch) {
      console.log(`  No branch found for ${merchant.id}, skipping`)
      continue
    }

    // Create product categories for this merchant
    const categories = VERTICAL_CATEGORIES[merchant.vertical] || ['General']
    const categoryMap = new Map<string, string>()

    for (let i = 0; i < categories.length; i++) {
      const catId = `cat-${merchant.id}-${i + 1}`
      try {
        await prisma.productCategory.create({
          data: {
            id: catId,
            merchantId: merchant.id,
            name: categories[i],
            sortOrder: i + 1,
            isActive: true,
            updatedAt: new Date(),
          },
        })
        categoryMap.set(categories[i].toLowerCase(), catId)
        totalCategories++
      } catch (e) {
        // Skip duplicates
      }
    }

    // Find catalog products for this vertical
    const catalogProducts = await prisma.catalogProduct.findMany({
      where: { vertical: merchant.vertical },
      take: 100, // Up to 100 products per merchant
    })

    console.log(`  Found ${catalogProducts.length} catalog products for ${merchant.vertical}`)

    let productCount = 0
    for (const cp of catalogProducts) {
      const productId = `inv-${merchant.id}-${cp.id}`
      
      // Map catalog category to merchant category
      const catName = cp.category.toLowerCase()
      let matchedCatId: string | null = null
      for (const [catKey, catId] of categoryMap.entries()) {
        if (catName.includes(catKey.split(' ')[0].toLowerCase()) || catKey.includes(catName)) {
          matchedCatId = catId
          break
        }
      }
      // Fallback: first category
      if (!matchedCatId && categoryMap.size > 0) {
        matchedCatId = Array.from(categoryMap.values())[0]
      }

      // Calculate selling price with 25-40% margin
      const marginPercent = Math.random() * 15 + 25 // 25-40%
      const sellingPrice = Math.round(cp.costPrice * (1 + marginPercent / 100) * 100) / 100

      // Random stock levels
      const currentStock = Math.floor(Math.random() * 480) + 20
      const lowStockThreshold = Math.floor(Math.random() * 10) + 5
      const reorderPoint = lowStockThreshold + Math.floor(Math.random() * 5)
      const reorderQuantity = Math.floor(Math.random() * 30) + 20

      try {
        await prisma.product.create({
          data: {
            id: productId,
            merchantId: merchant.id,
            branchId: branch.id,
            categoryId: matchedCatId,
            sku: cp.sku,
            barcode: generateEAN13(),
            name: cp.description.split('—')[0].trim() || cp.description,
            description: cp.description,
            type: 'standard',
            unit: cp.unit,
            costPrice: cp.costPrice,
            sellingPrice,
            compareAtPrice: Math.round(sellingPrice * 1.15 * 100) / 100,
            margin: Math.round(marginPercent * 100) / 100,
            vatRate: cp.vatRate,
            trackInventory: true,
            currentStock,
            lowStockThreshold,
            reorderPoint,
            reorderQuantity,
            hasVariants: false,
            isActive: true,
            isFeatured: Math.random() > 0.7,
            isAvailableOnline: true,
            timesSold: Math.floor(Math.random() * 200),
            lastSoldAt: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
            updatedAt: new Date(),
          },
        })
        productCount++
        totalProducts++
      } catch (e) {
        // Skip duplicates
      }
    }

    console.log(`  Created ${productCount} inventory products with ${categories.length} categories`)
  }

  // Final count
  console.log('\n=== Final Database Counts ===')
  const counts = {
    Products: await prisma.product.count(),
    ProductCategories: await prisma.productCategory.count(),
    Suppliers: await prisma.supplier.count(),
    CatalogProducts: await prisma.catalogProduct.count(),
    Merchants: await prisma.merchant.count(),
    Branches: await prisma.branch.count(),
  }
  console.table(counts)
  console.log(`\nTotal: ${totalProducts} inventory products, ${totalCategories} categories created`)
  console.log('Seed completed successfully!')
}

main()
  .catch((e) => { console.error('Seed error:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
