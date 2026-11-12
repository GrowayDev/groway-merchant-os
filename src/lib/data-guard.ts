/**
 * Data Guard - Ensures data persistence across server restarts
 * This module checks data integrity and automatically restores if needed
 */

import { existsSync, copyFileSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { db } from './db';
import { nanoid } from 'nanoid';

const DB_PATH = join(process.cwd(), 'dev.db');
const BACKUP_PATH = join(process.cwd(), 'dev-backup.db');
const FLAG_FILE = join(process.cwd(), 'db', '.seeded');

interface TableCheck {
  name: string;
  count: number;
  minRequired: number;
  isHealthy: boolean;
}

const CRITICAL_TABLES = [
  { name: 'Supplier', minCount: 100 },
  { name: 'CatalogProduct', minCount: 100 },
  { name: 'Wholesaler', minCount: 5 },
  { name: 'Merchant', minCount: 1 },
  { name: 'User', minCount: 1 },
  { name: 'Product', minCount: 10 }, // For POS inventory
  { name: 'FloorSection', minCount: 1 }, // For floor plan
  { name: 'RestaurantTable', minCount: 1 }, // For floor plan
];

async function getTableCount(tableName: string): Promise<number> {
  try {
    switch (tableName) {
      case 'Supplier':
        return await db.supplier.count();
      case 'CatalogProduct':
        return await db.catalogProduct.count();
      case 'Wholesaler':
        return await db.wholesaler.count();
      case 'Merchant':
        return await db.merchant.count();
      case 'User':
        return await db.user.count();
      case 'Product':
        return await db.product.count();
      case 'FloorSection':
        return await db.floorSection.count();
      case 'RestaurantTable':
        return await db.restaurantTable.count();
      default:
        return -1;
    }
  } catch (error) {
    console.error(`[DataGuard] Error counting ${tableName}:`, error);
    return -1;
  }
}

function createBackup(): boolean {
  try {
    if (existsSync(DB_PATH)) {
      copyFileSync(DB_PATH, BACKUP_PATH);
      console.log('[DataGuard] Backup created');
      return true;
    }
    return false;
  } catch (error) {
    console.error('[DataGuard] Backup failed:', error);
    return false;
  }
}

function restoreFromBackup(): boolean {
  try {
    if (existsSync(BACKUP_PATH)) {
      copyFileSync(BACKUP_PATH, DB_PATH);
      console.log('[DataGuard] Restored from backup');
      return true;
    }
    return false;
  } catch (error) {
    console.error('[DataGuard] Restore failed:', error);
    return false;
  }
}

// Quick seed functions for essential data
async function quickSeedSuppliers(count: number = 350): Promise<number> {
  const SUPPLIER_TYPES = ['manufacturer', 'distributor', 'wholesaler', 'farmer'];
  const TIERS = ['platinum', 'gold', 'silver', 'bronze'];
  const PROVINCES = ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Limpopo', 'Mpumalanga'];
  const VERTICALS = ['Food & Beverage', 'Liquor & Nightlife', 'Grocery & FMCG', 'Health & Beauty', 'Hardware & Building'];

  let inserted = 0;
  for (let i = 1; i <= count; i++) {
    try {
      await db.supplier.create({
        data: {
          id: `sup_${nanoid(12)}`,
          name: `Supplier ${i} Pty Ltd`,
          code: `SUP-${String(i).padStart(4, '0')}`,
          contactPerson: 'Contact Person',
          email: `supplier${i}@example.com`,
          phone: `010-${String(Math.floor(Math.random() * 9000000) + 1000000)}`,
          address: `${Math.floor(Math.random() * 999) + 1} Main Street`,
          city: 'Johannesburg',
          province: PROVINCES[Math.floor(Math.random() * PROVINCES.length)],
          postalCode: String(Math.floor(Math.random() * 9000) + 1000),
          supplierType: SUPPLIER_TYPES[Math.floor(Math.random() * SUPPLIER_TYPES.length)],
          tier: TIERS[Math.floor(Math.random() * TIERS.length)],
          bbbeeLevel: Math.floor(Math.random() * 8) + 1,
          rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
          reviewCount: Math.floor(Math.random() * 200) + 10,
          deliveryDays: Math.floor(Math.random() * 5) + 1,
          minOrderValue: [0, 500, 1000, 2000][Math.floor(Math.random() * 4)],
          paymentTerms: ['cod', 'net7', 'net15', 'net30'][Math.floor(Math.random() * 4)],
          categories: JSON.stringify(['General']),
          verticals: JSON.stringify([VERTICALS[Math.floor(Math.random() * VERTICALS.length)]]),
          fulfillmentRate: Math.round((85 + Math.random() * 15) * 10) / 10,
          status: 'active',
          verificationStatus: 'verified',
          updatedAt: new Date()
        }
      });
      inserted++;
    } catch {
      // Skip duplicates
    }
  }
  return inserted;
}

async function quickSeedWholesalers(): Promise<number> {
  const WHOLESALERS = [
    { name: 'Makro', code: 'MAKRO', type: 'cash_and_carry', branches: 22 },
    { name: 'Jumbo/CBW', code: 'JUMBO', type: 'cash_and_carry', branches: 45 },
    { name: 'Shoprite C&C', code: 'SHOPRITE-CC', type: 'cash_and_carry', branches: 68 },
    { name: 'Bidfood', code: 'BIDFOOD', type: 'foodservice', branches: 15 },
    { name: 'Africa C&C', code: 'AFRICA-CC', type: 'cash_and_carry', branches: 12 },
    { name: 'Devland', code: 'DEVLAND', type: 'cash_and_carry', branches: 8 },
    { name: 'SPAR Wholesale', code: 'SPAR-WS', type: 'distributor', branches: 6 },
    { name: 'Specialists', code: 'SPECIAL', type: 'specialist', branches: 10 },
  ];

  let inserted = 0;
  for (const w of WHOLESALERS) {
    try {
      await db.wholesaler.create({
        data: {
          id: `whl_${nanoid(12)}`,
          name: w.name,
          code: w.code,
          type: w.type,
          branchCount: w.branches,
          province: 'National',
          status: 'active',
          updatedAt: new Date()
        }
      });
      inserted++;
    } catch {
      // Skip duplicates
    }
  }
  return inserted;
}

async function quickSeedProducts(count: number = 400): Promise<number> {
  const wholesalers = await db.wholesaler.findMany();
  if (wholesalers.length === 0) return 0;

  const VERTICALS = ['Food & Beverage', 'Liquor & Nightlife', 'Grocery & FMCG', 'Health & Beauty'];
  const BRANDS = ['Clover', 'Danone', 'Coca-Cola', 'Distell', 'SAB', 'Unilever', 'Nivea'];

  let inserted = 0;
  for (const w of wholesalers) {
    for (let i = 1; i <= Math.ceil(count / wholesalers.length); i++) {
      const vertical = VERTICALS[Math.floor(Math.random() * VERTICALS.length)];
      const brand = BRANDS[Math.floor(Math.random() * BRANDS.length)];
      const costPrice = Math.round((Math.random() * 500 + 10) * 100) / 100;
      const retailPrice = Math.round(costPrice * 1.3 * 100) / 100;

      try {
        await db.catalogProduct.create({
          data: {
            id: `cp_${nanoid(12)}`,
            sku: `${w.code}-${String(i).padStart(5, '0')}`,
            sourceType: 'wholesale',
            wholesalerId: w.id,
            vertical,
            category: 'General',
            description: `${brand} Product ${i}`,
            brand,
            packSize: '1x1',
            unit: 'each',
            vatRate: 15.0,
            costPrice,
            retailPrice,
            grossMargin: 0.3,
            minOrderQty: 1,
            leadDays: Math.floor(Math.random() * 7) + 1,
            inStock: Math.random() > 0.1,
            status: 'active',
            updatedAt: new Date()
          }
        });
        inserted++;
      } catch {
        // Skip duplicates
      }
    }
  }
  return inserted;
}

async function quickSeedMerchant(): Promise<boolean> {
  try {
    await db.merchant.create({
      data: {
        id: `mer_${nanoid(12)}`,
        businessName: 'Demo Merchant',
        tradingName: 'Demo Store',
        email: 'demo@example.com',
        phone: '010-000-0000',
        tier: 'starter',
        status: 'active',
        updatedAt: new Date()
      }
    });
    return true;
  } catch {
    return false;
  }
}

async function quickSeedUser(): Promise<boolean> {
  try {
    await db.user.create({
      data: {
        id: `usr_${nanoid(12)}`,
        email: 'demo@example.com',
        name: 'Demo User',
        passwordHash: '$2a$10$dummyhash',
        role: 'admin',
        status: 'active',
        updatedAt: new Date()
      }
    });
    return true;
  } catch {
    return false;
  }
}

// Seed POS products with inventory tracking
async function quickSeedPOSProducts(merchantId: string): Promise<number> {
  const PRODUCTS = [
    { name: 'Coca-Cola 340ml', category: 'Beverages', price: 15.99, cost: 10.50, stock: 100, sku: 'BEV-001' },
    { name: 'Sprite 340ml', category: 'Beverages', price: 15.99, cost: 10.50, stock: 80, sku: 'BEV-002' },
    { name: 'Fanta Orange 340ml', category: 'Beverages', price: 15.99, cost: 10.50, stock: 60, sku: 'BEV-003' },
    { name: 'Bread White', category: 'Bakery', price: 18.50, cost: 12.00, stock: 50, sku: 'BAK-001' },
    { name: 'Milk 1L', category: 'Dairy', price: 22.99, cost: 18.00, stock: 40, sku: 'DAI-001' },
    { name: 'Butter 500g', category: 'Dairy', price: 65.00, cost: 48.00, stock: 30, sku: 'DAI-002' },
    { name: 'Eggs 6pk', category: 'Dairy', price: 35.00, cost: 25.00, stock: 45, sku: 'DAI-003' },
    { name: 'Rice 2kg', category: 'Groceries', price: 45.99, cost: 32.00, stock: 60, sku: 'GRO-001' },
    { name: 'Sugar 1kg', category: 'Groceries', price: 28.50, cost: 20.00, stock: 55, sku: 'GRO-002' },
    { name: 'Cooking Oil 750ml', category: 'Groceries', price: 42.00, cost: 30.00, stock: 35, sku: 'GRO-003' },
    { name: 'Chips Salted 150g', category: 'Snacks', price: 18.99, cost: 12.00, stock: 70, sku: 'SNK-001' },
    { name: 'Chocolate Bar', category: 'Snacks', price: 22.50, cost: 15.00, stock: 65, sku: 'SNK-002' },
    { name: 'Coffee 250g', category: 'Beverages', price: 55.00, cost: 38.00, stock: 25, sku: 'BEV-004' },
    { name: 'Tea Bags 50pk', category: 'Beverages', price: 35.00, cost: 24.00, stock: 30, sku: 'BEV-005' },
    { name: 'Chicken Breast 1kg', category: 'Fresh', price: 95.00, cost: 70.00, stock: 20, sku: 'FRS-001' },
  ];

  let inserted = 0;
  for (const p of PRODUCTS) {
    try {
      await db.product.create({
        data: {
          id: `prod_${nanoid(12)}`,
          merchantId,
          sku: p.sku,
          name: p.name,
          category: p.category,
          sellPrice: p.price,
          costPrice: p.cost,
          currentStock: p.stock,
          minStock: 10,
          maxStock: 200,
          status: 'active',
          updatedAt: new Date()
        }
      });
      inserted++;
    } catch {
      // Skip duplicates
    }
  }
  return inserted;
}

// Seed floor plan with tables
async function quickSeedFloorPlan(): Promise<{ sections: number; tables: number }> {
  let sectionsCount = 0;
  let tablesCount = 0;

  // Check if already exists
  const existingSections = await db.floorSection.count();
  if (existingSections > 0) {
    return { sections: existingSections, tables: await db.restaurantTable.count() };
  }

  // Create sections
  const sections = [
    { id: `section_${nanoid(12)}`, name: 'Main Dining', color: '#00897B' },
    { id: `section_${nanoid(12)}`, name: 'Patio', color: '#4CAF50' },
    { id: `section_${nanoid(12)}`, name: 'Bar Area', color: '#FF9800' },
  ];

  for (const section of sections) {
    try {
      await db.floorSection.create({
        data: {
          id: section.id,
          name: section.name,
          color: section.color,
          updatedAt: new Date()
        }
      });
      sectionsCount++;
    } catch {
      // Skip duplicates
    }
  }

  // Create tables for Main Dining
  const mainSectionId = sections[0].id;
  const mainTables = [
    { number: '1', shape: 'circle', x: 80, y: 80, width: 55, height: 55, seats: 4 },
    { number: '2', shape: 'circle', x: 200, y: 80, width: 55, height: 55, seats: 4 },
    { number: '3', shape: 'circle', x: 320, y: 80, width: 55, height: 55, seats: 4 },
    { number: '4', shape: 'circle', x: 440, y: 80, width: 55, height: 55, seats: 4 },
    { number: '5', shape: 'square', x: 80, y: 200, width: 50, height: 50, seats: 2 },
    { number: '6', shape: 'square', x: 200, y: 200, width: 50, height: 50, seats: 2 },
    { number: '7', shape: 'square', x: 320, y: 200, width: 50, height: 50, seats: 2 },
    { number: '8', shape: 'square', x: 440, y: 200, width: 50, height: 50, seats: 2 },
    { number: '9', shape: 'rectangle', x: 80, y: 320, width: 80, height: 50, seats: 6 },
    { number: '10', shape: 'rectangle', x: 200, y: 320, width: 80, height: 50, seats: 6 },
    { number: '11', shape: 'rectangle', x: 320, y: 320, width: 80, height: 50, seats: 6 },
    { number: '12', shape: 'rectangle', x: 440, y: 320, width: 80, height: 50, seats: 6 },
  ];

  for (const table of mainTables) {
    try {
      await db.restaurantTable.create({
        data: {
          id: `table_${nanoid(12)}`,
          number: table.number,
          shape: table.shape,
          x: table.x,
          y: table.y,
          width: table.width,
          height: table.height,
          seats: table.seats,
          status: 'available',
          sectionId: mainSectionId,
          updatedAt: new Date()
        }
      });
      tablesCount++;
    } catch {
      // Skip duplicates
    }
  }

  // Create tables for Patio
  const patioSectionId = sections[1].id;
  const patioTables = [
    { number: 'P1', shape: 'circle', x: 80, y: 80, width: 60, height: 60, seats: 4 },
    { number: 'P2', shape: 'circle', x: 200, y: 80, width: 60, height: 60, seats: 4 },
    { number: 'P3', shape: 'circle', x: 80, y: 200, width: 60, height: 60, seats: 4 },
    { number: 'P4', shape: 'circle', x: 200, y: 200, width: 60, height: 60, seats: 4 },
    { number: 'P5', shape: 'rectangle', x: 80, y: 320, width: 100, height: 60, seats: 8 },
  ];

  for (const table of patioTables) {
    try {
      await db.restaurantTable.create({
        data: {
          id: `table_${nanoid(12)}`,
          number: table.number,
          shape: table.shape,
          x: table.x,
          y: table.y,
          width: table.width,
          height: table.height,
          seats: table.seats,
          status: 'available',
          sectionId: patioSectionId,
          updatedAt: new Date()
        }
      });
      tablesCount++;
    } catch {
      // Skip duplicates
    }
  }

  // Create tables for Bar
  const barSectionId = sections[2].id;
  const barTables = [
    { number: 'BAR1', shape: 'square', x: 80, y: 80, width: 35, height: 35, seats: 1 },
    { number: 'BAR2', shape: 'square', x: 130, y: 80, width: 35, height: 35, seats: 1 },
    { number: 'BAR3', shape: 'square', x: 180, y: 80, width: 35, height: 35, seats: 1 },
    { number: 'BAR4', shape: 'square', x: 230, y: 80, width: 35, height: 35, seats: 1 },
    { number: 'BAR5', shape: 'square', x: 280, y: 80, width: 35, height: 35, seats: 1 },
    { number: 'BAR6', shape: 'square', x: 330, y: 80, width: 35, height: 35, seats: 1 },
  ];

  for (const table of barTables) {
    try {
      await db.restaurantTable.create({
        data: {
          id: `table_${nanoid(12)}`,
          number: table.number,
          shape: table.shape,
          x: table.x,
          y: table.y,
          width: table.width,
          height: table.height,
          seats: table.seats,
          status: 'available',
          sectionId: barSectionId,
          updatedAt: new Date()
        }
      });
      tablesCount++;
    } catch {
      // Skip duplicates
    }
  }

  // Create some servers
  const servers = ['Thabo M.', 'Nomsa K.', 'Johan P.', 'Sarah L.'];
  for (const name of servers) {
    try {
      await db.server.create({
        data: {
          id: `server_${nanoid(12)}`,
          name,
          status: 'active',
          updatedAt: new Date()
        }
      });
    } catch {
      // Skip duplicates
    }
  }

  return { sections: sectionsCount, tables: tablesCount };
}

async function performQuickSeed(): Promise<void> {
  console.log('[DataGuard] Performing quick seed...');

  // Seed wholesalers first (needed for products)
  const wholesalers = await quickSeedWholesalers();
  console.log(`[DataGuard] Seeded ${wholesalers} wholesalers`);

  // Seed suppliers
  const suppliers = await quickSeedSuppliers(350);
  console.log(`[DataGuard] Seeded ${suppliers} suppliers`);

  // Seed catalog products
  const products = await quickSeedProducts(400);
  console.log(`[DataGuard] Seeded ${products} catalog products`);

  // Seed merchant
  await quickSeedMerchant();
  console.log(`[DataGuard] Seeded merchant`);

  // Seed user
  await quickSeedUser();
  console.log(`[DataGuard] Seeded user`);

  // Get the merchant ID for POS products
  const merchant = await db.merchant.findFirst();
  if (merchant) {
    // Seed POS products with inventory
    const posProducts = await quickSeedPOSProducts(merchant.id);
    console.log(`[DataGuard] Seeded ${posProducts} POS products with inventory`);
  }

  // Seed floor plan with tables
  const floorPlan = await quickSeedFloorPlan();
  console.log(`[DataGuard] Seeded floor plan: ${floorPlan.sections} sections, ${floorPlan.tables} tables`);

  // Mark as seeded
  writeFileSync(FLAG_FILE, new Date().toISOString());
}

export async function checkAndRestoreData(): Promise<{
  wasHealthy: boolean;
  wasRestored: boolean;
  tables: TableCheck[];
}> {
  const tables: TableCheck[] = [];
  let wasHealthy = true;
  let wasRestored = false;

  // Check each critical table
  for (const table of CRITICAL_TABLES) {
    const count = await getTableCount(table.name);
    const isHealthy = count >= table.minCount;
    tables.push({
      name: table.name,
      count,
      minRequired: table.minCount,
      isHealthy
    });

    if (!isHealthy) {
      console.log(`[DataGuard] ${table.name}: ${count} (min: ${table.minCount}) - UNHEALTHY`);
      wasHealthy = false;
    } else {
      console.log(`[DataGuard] ${table.name}: ${count} - OK`);
    }
  }

  // If not healthy, try restore
  if (!wasHealthy) {
    console.log('[DataGuard] Data integrity failed, attempting restore...');

    // Try backup first
    if (restoreFromBackup()) {
      // Re-check after restore
      let restoredHealthy = true;
      for (const table of CRITICAL_TABLES) {
        const count = await getTableCount(table.name);
        if (count < table.minCount) {
          restoredHealthy = false;
          break;
        }
      }

      if (restoredHealthy) {
        wasRestored = true;
        console.log('[DataGuard] Successfully restored from backup');
      } else {
        console.log('[DataGuard] Backup restore incomplete, performing quick seed...');
        await performQuickSeed();
        wasRestored = true;
      }
    } else {
      console.log('[DataGuard] No backup available, performing quick seed...');
      await performQuickSeed();
      wasRestored = true;
    }
  } else {
    // Data is healthy, create backup
    createBackup();
  }

  return { wasHealthy, wasRestored, tables };
}

export function getDataStatus(): {
  dbExists: boolean;
  backupExists: boolean;
  lastSeeded: string | null;
} {
  return {
    dbExists: existsSync(DB_PATH),
    backupExists: existsSync(BACKUP_PATH),
    lastSeeded: existsSync(FLAG_FILE) ? readFileSync(FLAG_FILE, 'utf-8') : null
  };
}
