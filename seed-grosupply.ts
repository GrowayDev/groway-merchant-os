import { db } from './src/lib/db'

async function seedGroSupply() {
  console.log('🌱 Seeding GroSupply data...')

  // Create suppliers
  const supplier1 = await db.supplier.create({
    data: {
      name: 'Cape Fresh Produce',
      code: 'SUP-001',
      contactPerson: 'John Smith',
      email: 'john@capefresh.co.za',
      phone: '021 123 4567',
      address: '123 Market Street',
      city: 'Cape Town',
      province: 'Western Cape',
      postalCode: '8000',
      tier: 'gold',
      rating: 4.8,
      reviewCount: 45,
      deliveryDays: 1,
      paymentTerms: 'net30',
      categories: JSON.stringify(['Fresh Produce', 'Dairy', 'Vegetables']),
      status: 'active',
      verificationStatus: 'verified',
      verifiedAt: new Date()
    }
  })
  console.log('✅ Created supplier:', supplier1.name)

  const supplier2 = await db.supplier.create({
    data: {
      name: 'Metro Wholesale',
      code: 'SUP-002',
      contactPerson: 'Sarah Johnson',
      email: 'sarah@metro.co.za',
      phone: '011 987 6543',
      address: '456 Industrial Road',
      city: 'Johannesburg',
      province: 'Gauteng',
      postalCode: '2000',
      tier: 'preferred',
      rating: 4.9,
      reviewCount: 78,
      deliveryDays: 2,
      paymentTerms: 'net30',
      categories: JSON.stringify(['Grocery', 'Beverages', 'Snacks', 'Dry Goods']),
      status: 'active',
      verificationStatus: 'verified',
      verifiedAt: new Date()
    }
  })
  console.log('✅ Created supplier:', supplier2.name)

  const supplier3 = await db.supplier.create({
    data: {
      name: 'Pride Milling Co',
      code: 'SUP-003',
      contactPerson: 'Michael Brown',
      email: 'michael@pridemilling.co.za',
      phone: '012 345 6789',
      address: '789 Factory Lane',
      city: 'Pretoria',
      province: 'Gauteng',
      postalCode: '0001',
      tier: 'gold',
      rating: 4.7,
      reviewCount: 32,
      deliveryDays: 2,
      paymentTerms: 'net30',
      categories: JSON.stringify(['Dry Goods', 'Grains', 'Flour']),
      status: 'active',
      verificationStatus: 'verified',
      verifiedAt: new Date()
    }
  })
  console.log('✅ Created supplier:', supplier3.name)

  // Create RFQ
  const rfq = await db.rFQ.create({
    data: {
      number: 'RFQ-202603-TEST1',
      status: 'quoted',
      requiredBy: '2026-03-25',
      deliveryAddress: '123 Main Street, Johannesburg',
      notes: 'Monthly dry goods order',
      totalQuotes: 2,
      items: {
        create: [
          { sku: 'MAIZE-1KG', description: 'Maize Meal 1kg', quantity: 50, unit: 'bags' },
          { sku: 'RICE-2KG', description: 'Rice 2kg', quantity: 30, unit: 'bags' },
          { sku: 'SUGAR-1KG', description: 'White Sugar 1kg', quantity: 40, unit: 'bags' }
        ]
      }
    }
  })
  console.log('✅ Created RFQ:', rfq.number)

  // Create quotes for the RFQ
  const quote1 = await db.supplierQuote.create({
    data: {
      rfqId: rfq.id,
      supplierId: supplier3.id,
      status: 'submitted',
      subtotal: 2765,
      vat: 414.75,
      deliveryCost: 0,
      total: 3179.75,
      deliveryDays: 2,
      paymentTerms: 'net30',
      validUntil: '2026-03-22',
      items: {
        create: [
          { sku: 'MAIZE-1KG', unitPrice: 18.50, quantity: 50, totalPrice: 925, inStock: true },
          { sku: 'RICE-2KG', unitPrice: 32.00, quantity: 30, totalPrice: 960, inStock: true },
          { sku: 'SUGAR-1KG', unitPrice: 22.00, quantity: 40, totalPrice: 880, inStock: true }
        ]
      }
    }
  })
  console.log('✅ Created quote from:', supplier3.name)

  const quote2 = await db.supplierQuote.create({
    data: {
      rfqId: rfq.id,
      supplierId: supplier2.id,
      status: 'submitted',
      subtotal: 2790,
      vat: 418.50,
      deliveryCost: 150,
      total: 3358.50,
      deliveryDays: 1,
      paymentTerms: 'net30',
      validUntil: '2026-03-22',
      items: {
        create: [
          { sku: 'MAIZE-1KG', unitPrice: 19.00, quantity: 50, totalPrice: 950, inStock: true },
          { sku: 'RICE-2KG', unitPrice: 30.00, quantity: 30, totalPrice: 900, inStock: true },
          { sku: 'SUGAR-1KG', unitPrice: 23.50, quantity: 40, totalPrice: 940, inStock: true }
        ]
      }
    }
  })
  console.log('✅ Created quote from:', supplier2.name)

  // Create a Purchase Order
  const po = await db.purchaseOrder.create({
    data: {
      number: 'PO-202603-TEST1',
      supplierId: supplier1.id,
      status: 'dispatched',
      subtotal: 770,
      vat: 115.50,
      deliveryCost: 0,
      total: 885.50,
      deliveryAddress: '123 Main Street, Johannesburg',
      requestedDate: '2026-03-18',
      trackingNumber: 'TRK-123456',
      estimatedDelivery: '2026-03-19',
      items: {
        create: [
          { sku: 'TOMATO-1KG', description: 'Fresh Tomatoes', quantity: 20, unitPrice: 25, totalPrice: 500, unit: 'kg' },
          { sku: 'ONION-1KG', description: 'Brown Onions', quantity: 15, unitPrice: 18, totalPrice: 270, unit: 'kg' }
        ]
      }
    }
  })
  console.log('✅ Created PO:', po.number)

  // Create a GRN
  const grn = await db.goodsReceivedNote.create({
    data: {
      number: 'GRN-202603-TEST1',
      poId: po.id,
      status: 'completed',
      receivedBy: 'John Dlamini',
      receivedAt: new Date('2026-03-19T09:30:00'),
      items: {
        create: [
          { sku: 'TOMATO-1KG', description: 'Fresh Tomatoes', orderedQty: 20, receivedQty: 20, rejectedQty: 0, unitPrice: 25 },
          { sku: 'ONION-1KG', description: 'Brown Onions', orderedQty: 15, receivedQty: 14, rejectedQty: 1, rejectReason: 'Damaged', unitPrice: 18 }
        ]
      }
    }
  })
  console.log('✅ Created GRN:', grn.number)

  console.log('\n🎉 GroSupply seeding complete!')
  console.log('\nSummary:')
  console.log('- Suppliers: 3')
  console.log('- RFQs: 1 (with 2 quotes)')
  console.log('- POs: 1')
  console.log('- GRNs: 1')
}

seedGroSupply()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
