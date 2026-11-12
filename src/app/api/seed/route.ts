import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { nanoid } from 'nanoid';

// This endpoint seeds critical data if it's missing
// Can be called on app startup or manually

export async function GET() {
  try {
    const results = {
      suppliers: { seeded: 0, existing: 0 },
      catalogProducts: { seeded: 0, existing: 0 },
      merchants: { seeded: 0, existing: 0 },
      users: { seeded: 0, existing: 0 },
    };

    // Check and seed suppliers
    const existingSuppliers = await db.supplier.count();
    if (existingSuppliers === 0) {
      const suppliers = generateSuppliers();
      for (const supplier of suppliers) {
        await db.supplier.create({ data: supplier });
        results.suppliers.seeded++;
      }
    } else {
      results.suppliers.existing = existingSuppliers;
    }

    // Check and seed catalog products
    const existingProducts = await db.catalogProduct.count();
    if (existingProducts === 0) {
      const products = generateCatalogProducts();
      for (const product of products) {
        await db.catalogProduct.create({ data: product });
        results.catalogProducts.seeded++;
      }
    } else {
      results.catalogProducts.existing = existingProducts;
    }

    // Check and seed demo merchant
    const existingMerchants = await db.merchant.count();
    if (existingMerchants === 0) {
      const merchantId = `mer_${nanoid(12)}`;
      await db.merchant.create({
        data: {
          id: merchantId,
          businessName: 'Demo Merchant',
          tradingName: 'Demo Coffee Shop',
          vertical: 'food_beverage',
          subVertical: 'coffee_shop',
          tier: 'professional',
          status: 'active',
          updatedAt: new Date(),
        },
      });

      // Create default branch
      await db.branch.create({
        data: {
          id: `br_${nanoid(12)}`,
          merchantId,
          code: 'HQ',
          name: 'Headquarters',
          type: 'store',
          isDefault: true,
          isActive: true,
          updatedAt: new Date(),
        },
      });

      results.merchants.seeded = 1;
    } else {
      results.merchants.existing = existingMerchants;
    }

    // Check and seed demo users
    const existingUsers = await db.user.count();
    if (existingUsers === 0) {
      const demoUsers = [
        { email: 'demo@groway.co.za', name: 'Demo User', role: 'owner' },
        { email: 'manager@groway.co.za', name: 'Manager User', role: 'manager' },
        { email: 'staff@groway.co.za', name: 'Staff User', role: 'staff' },
      ];

      for (const user of demoUsers) {
        await db.user.create({
          data: {
            id: `usr_${nanoid(12)}`,
            email: user.email,
            name: user.name,
            role: user.role,
            pin: '1234',
            updatedAt: new Date(),
          },
        });
        results.users.seeded++;
      }
    } else {
      results.users.existing = existingUsers;
    }

    return NextResponse.json({
      success: true,
      message: 'Seed check completed',
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// Generate suppliers data
function generateSuppliers() {
  const suppliers = [];
  const types = ['manufacturer', 'distributor', 'wholesaler', 'farmer'];
  const tiers = ['platinum', 'gold', 'silver', 'bronze'];
  const provinces = ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape'];
  const categories = ['Beverages', 'Dairy', 'Fresh Produce', 'Grocery', 'Frozen', 'Cleaning', 'Packaging', 'Bakery', 'Butchery', 'Dry Goods'];

  for (let i = 1; i <= 100; i++) {
    suppliers.push({
      id: `sup_${nanoid(12)}`,
      name: `Supplier ${i} ${types[i % 4].charAt(0).toUpperCase() + types[i % 4].slice(1)}`,
      code: `SUP${String(i).padStart(4, '0')}`,
      contactPerson: `Contact ${i}`,
      email: `supplier${i}@example.com`,
      phone: `+27 ${Math.floor(Math.random() * 900000000 + 100000000)}`,
      province: provinces[i % 9],
      supplierType: types[i % 4],
      tier: tiers[i % 4],
      rating: Math.floor(Math.random() * 20 + 80) / 10,
      reviewCount: Math.floor(Math.random() * 100 + 10),
      deliveryDays: Math.floor(Math.random() * 5 + 1),
      minOrderValue: Math.floor(Math.random() * 500 + 100),
      paymentTerms: ['Net 30', 'Net 60', 'COD', 'EOM'][i % 4],
      categories: `${categories[i % 10]},${categories[(i + 1) % 10]}`,
      status: 'active',
      verificationStatus: 'verified',
      updatedAt: new Date(),
    });
  }

  return suppliers;
}

// Generate catalog products
function generateCatalogProducts() {
  const products = [];
  const verticals = ['food_beverage', 'grocery', 'hospitality', 'health_beauty', 'retail'];
  const categories = ['Beverages', 'Dairy', 'Fresh Produce', 'Grocery', 'Frozen', 'Cleaning', 'Packaging', 'Bakery', 'Butchery', 'Snacks'];
  const brands = ['Nestle', 'Unilever', 'P&G', 'Coca-Cola', 'PepsiCo', 'Mondelez', 'Kelloggs', 'Mars', 'Danone', 'Clover'];

  for (let i = 1; i <= 200; i++) {
    const costPrice = Math.floor(Math.random() * 500 + 10);
    const retailPrice = costPrice * (1 + Math.random() * 0.5 + 0.2);

    products.push({
      id: `cat_${nanoid(12)}`,
      sku: `SKU${String(i).padStart(6, '0')}`,
      sourceType: 'wholesale',
      vertical: verticals[i % 5],
      category: categories[i % 10],
      description: `${brands[i % 10]} Product ${i} - Quality wholesale item`,
      brand: brands[i % 10],
      packSize: ['1x24', '1x12', '1x6', '1x48', 'Bulk'][i % 5],
      unit: ['each', 'case', 'kg', 'litre', 'pack'][i % 5],
      costPrice,
      retailPrice: Math.round(retailPrice * 100) / 100,
      grossMargin: Math.round((retailPrice - costPrice) / retailPrice * 100),
      minOrderQty: [1, 6, 12, 24, 48][i % 5],
      leadDays: [1, 2, 3, 5, 7][i % 5],
      inStock: i % 10 !== 0,
      status: 'active',
      updatedAt: new Date(),
    });
  }

  return products;
}
