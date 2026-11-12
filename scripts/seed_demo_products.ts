import { db } from '../src/lib/db'
import { nanoid } from 'nanoid'

async function seedDemoSupplierProducts() {
  console.log('🌱 Seeding demo supplier products...\n')

  // Find or create demo supplier
  let supplier = await db.supplier.findFirst({
    where: { code: 'SUP-DEMO-001' }
  })

  if (!supplier) {
    supplier = await db.supplier.create({
      data: {
        name: 'Demo Wholesale SA',
        code: 'SUP-DEMO-001',
        contactPerson: 'John Demo',
        email: 'supplier@grosupply.co.za',
        phone: '+27 11 123 4567',
        website: 'https://demowholesale.co.za',
        address: '123 Industrial Road',
        city: 'Johannesburg',
        province: 'Gauteng',
        postalCode: '2001',
        bankName: 'First National Bank',
        bankAccount: '1234567890',
        bankBranch: 'Sandton',
        supplierType: 'distributor',
        tier: 'gold',
        bbbeeLevel: 2,
        rating: 4.5,
        reviewCount: 127,
        deliveryDays: 3,
        minOrderValue: 500,
        paymentTerms: 'net30',
        categories: JSON.stringify(['Fresh Produce', 'Dairy', 'Beverages', 'Cleaning', 'Packaging']),
        verticals: JSON.stringify(['Food & Beverage', 'Hospitality']),
        fulfillmentRate: 98.5,
        notes: 'Demo supplier for testing',
        status: 'active',
        verificationStatus: 'verified'
      }
    })
    console.log('✅ Created demo supplier')
  } else {
    console.log('✅ Found existing demo supplier')
  }

  // Sample products
  const products = [
    {
      sku: 'FP-VEG-001',
      name: 'Fresh Vegetables Mix',
      description: 'Premium mixed seasonal vegetables, perfect for restaurants and catering. Includes carrots, beans, peas, and corn.',
      category: 'Fresh Produce',
      unit: 'kg',
      basePrice: 45.00,
      costPrice: 28.00,
      minOrderQty: 10,
      maxOrderQty: 500,
      leadTime: 2,
      inStock: true,
      stockQty: 150,
      specifications: JSON.stringify([
        { key: 'Origin', value: 'South Africa' },
        { key: 'Storage', value: 'Keep refrigerated 2-4°C' },
        { key: 'Shelf Life', value: '7 days' }
      ])
    },
    {
      sku: 'FP-FRU-002',
      name: 'Seasonal Fruit Selection',
      description: 'Fresh seasonal fruits including apples, oranges, bananas, and pears. Sourced from local farms.',
      category: 'Fresh Produce',
      unit: 'box',
      basePrice: 120.00,
      costPrice: 75.00,
      minOrderQty: 5,
      maxOrderQty: 200,
      leadTime: 1,
      inStock: true,
      stockQty: 80,
      specifications: JSON.stringify([
        { key: 'Origin', value: 'Local Farms SA' },
        { key: 'Storage', value: 'Cool dry place' },
        { key: 'Shelf Life', value: '5-7 days' }
      ])
    },
    {
      sku: 'DR-MLK-001',
      name: 'Full Cream Milk 2L',
      description: 'Fresh pasteurized full cream milk. Perfect for cafes, restaurants, and catering businesses.',
      category: 'Dairy',
      unit: 'bottle',
      basePrice: 32.50,
      costPrice: 22.00,
      minOrderQty: 20,
      maxOrderQty: 400,
      leadTime: 1,
      inStock: true,
      stockQty: 200,
      specifications: JSON.stringify([
        { key: 'Fat Content', value: '3.5%' },
        { key: 'Pasteurized', value: 'Yes' },
        { key: 'Storage', value: 'Refrigerate 2-4°C' }
      ])
    },
    {
      sku: 'DR-CHS-001',
      name: 'Cheddar Cheese Block 1kg',
      description: 'Premium aged cheddar cheese. Sharp flavor, perfect for cooking or sandwiches.',
      category: 'Dairy',
      unit: 'block',
      basePrice: 145.00,
      costPrice: 95.00,
      minOrderQty: 5,
      maxOrderQty: 100,
      leadTime: 2,
      inStock: true,
      stockQty: 45,
      specifications: JSON.stringify([
        { key: 'Aging', value: '12 months' },
        { key: 'Type', value: 'Sharp Cheddar' },
        { key: 'Storage', value: 'Refrigerate 4-8°C' }
      ])
    },
    {
      sku: 'CL-IND-001',
      name: 'Industrial Cleaner 5L',
      description: 'Multi-surface industrial cleaner. Effective on grease, grime, and dirt. SABS approved.',
      category: 'Cleaning Supplies',
      unit: 'container',
      basePrice: 85.00,
      costPrice: 52.00,
      minOrderQty: 6,
      maxOrderQty: 50,
      leadTime: 3,
      inStock: false,
      stockQty: 0,
      specifications: JSON.stringify([
        { key: 'Dilution', value: '1:10 with water' },
        { key: 'pH Level', value: 'Neutral' },
        { key: 'Scent', value: 'Lemon' }
      ])
    },
    {
      sku: 'BV-SFT-001',
      name: 'Coca-Cola 2L Case',
      description: 'Case of 12 x 2L Coca-Cola bottles. Perfect for restaurants and catering.',
      category: 'Beverages',
      unit: 'case',
      basePrice: 220.00,
      costPrice: 165.00,
      minOrderQty: 5,
      maxOrderQty: 100,
      leadTime: 1,
      inStock: true,
      stockQty: 60,
      specifications: JSON.stringify([
        { key: 'Pack Size', value: '12 x 2L' },
        { key: 'Storage', value: 'Cool dry place' }
      ])
    },
    {
      sku: 'PK-BAG-001',
      name: 'Vacuum Pack Rolls 500pcs',
      description: 'Food-grade vacuum packaging rolls. Suitable for commercial vacuum sealers.',
      category: 'Packaging',
      unit: 'roll',
      basePrice: 450.00,
      costPrice: 320.00,
      minOrderQty: 2,
      maxOrderQty: 50,
      leadTime: 3,
      inStock: true,
      stockQty: 25,
      specifications: JSON.stringify([
        { key: 'Width', value: '30cm' },
        { key: 'Length', value: '500m' },
        { key: 'Material', value: 'PA/PE' }
      ])
    },
    {
      sku: 'BV-JUI-001',
      name: 'Orange Juice 1L Case',
      description: 'Freshly squeezed orange juice. Case of 12 x 1L bottles. 100% pure juice.',
      category: 'Beverages',
      unit: 'case',
      basePrice: 180.00,
      costPrice: 120.00,
      minOrderQty: 5,
      maxOrderQty: 100,
      leadTime: 1,
      inStock: true,
      stockQty: 40,
      specifications: JSON.stringify([
        { key: 'Pack Size', value: '12 x 1L' },
        { key: 'Type', value: '100% Pure' },
        { key: 'Storage', value: 'Refrigerate' }
      ])
    },
    {
      sku: 'FP-HERB-001',
      name: 'Fresh Herb Bundle',
      description: 'Assorted fresh herbs including parsley, coriander, mint, and basil. Perfect for restaurants.',
      category: 'Fresh Produce',
      unit: 'bundle',
      basePrice: 35.00,
      costPrice: 20.00,
      minOrderQty: 10,
      maxOrderQty: 200,
      leadTime: 1,
      inStock: true,
      stockQty: 120,
      specifications: JSON.stringify([
        { key: 'Contents', value: 'Parsley, Coriander, Mint, Basil' },
        { key: 'Storage', value: 'Refrigerate' }
      ])
    },
    {
      sku: 'DR-YOG-001',
      name: 'Greek Yogurt 1kg',
      description: 'Thick and creamy Greek yogurt. High protein, low fat. Perfect for breakfast menus.',
      category: 'Dairy',
      unit: 'tub',
      basePrice: 65.00,
      costPrice: 42.00,
      minOrderQty: 10,
      maxOrderQty: 100,
      leadTime: 2,
      inStock: true,
      stockQty: 85,
      specifications: JSON.stringify([
        { key: 'Fat Content', value: '2%' },
        { key: 'Protein', value: '10g per 100g' },
        { key: 'Storage', value: 'Refrigerate 2-4°C' }
      ])
    }
  ]

  // Create products
  for (const productData of products) {
    const existing = await db.supplierProduct.findFirst({
      where: { supplierId: supplier.id, sku: productData.sku }
    })

    if (!existing) {
      await db.supplierProduct.create({
        data: {
          supplierId: supplier.id,
          ...productData,
          active: true
        }
      })
      console.log(`✅ Created product: ${productData.name}`)
    } else {
      console.log(`⏭️  Product already exists: ${productData.name}`)
    }
  }

  // Create bulk pricing for some products
  const productsWithPricing = await db.supplierProduct.findMany({
    where: { supplierId: supplier.id }
  })

  for (const product of productsWithPricing.slice(0, 4)) {
    const existingPricing = await db.supplierBulkPricing.findFirst({
      where: { productId: product.id }
    })

    if (!existingPricing && product.basePrice > 50) {
      await db.supplierBulkPricing.createMany({
        data: [
          {
            productId: product.id,
            minQty: 10,
            maxQty: 49,
            discountPercent: 5,
            discountedPrice: product.basePrice * 0.95,
            label: 'Buy 10+ save 5%',
            active: true
          },
          {
            productId: product.id,
            minQty: 50,
            maxQty: null,
            discountPercent: 10,
            discountedPrice: product.basePrice * 0.90,
            label: 'Buy 50+ save 10%',
            active: true
          }
        ]
      })
      console.log(`✅ Created bulk pricing for: ${product.name}`)
    }
  }

  // Create sample catalogs
  const existingCatalog = await db.supplierCatalog.findFirst({
    where: { supplierId: supplier.id }
  })

  if (!existingCatalog) {
    const catalog = await db.supplierCatalog.create({
      data: {
        supplierId: supplier.id,
        name: 'Restaurant Essentials',
        description: 'Essential products for restaurants and catering businesses',
        visibility: 'public',
        shareCode: nanoid(10).toUpperCase(),
        status: 'published',
        publishedAt: new Date(),
        productCount: productsWithPricing.length
      }
    })

    // Add products to catalog
    await db.supplierCatalogProduct.createMany({
      data: productsWithPricing.map((p, i) => ({
        catalogId: catalog.id,
        productId: p.id,
        sortOrder: i,
        featured: i < 3
      }))
    })
    console.log('✅ Created sample catalog')
  }

  // Final count
  const productCount = await db.supplierProduct.count({
    where: { supplierId: supplier.id }
  })
  const catalogCount = await db.supplierCatalog.count({
    where: { supplierId: supplier.id }
  })

  console.log(`\n=== Summary ===`)
  console.log(`Products: ${productCount}`)
  console.log(`Catalogs: ${catalogCount}`)
  console.log('\n✅ Done!')

  await db.$disconnect()
}

seedDemoSupplierProducts().catch(console.error)
