// Master SKU Seed File
// Imports and combines all vertical SKU catalogues
// Run with: bun run prisma/seed-skus.ts

import { pharmacySKUs, pharmacySKUStats } from './seed-data/pharmacy-skus';
import { healthBeautySKUs, healthBeautySKUStats } from './seed-data/health-beauty-skus';
import { hardwareSKUs, hardwareSKUStats } from './seed-data/hardware-skus';
import { electronicsSKUs, electronicsSKUStats } from './seed-data/electronics-skus';
import { autoWorkshopSKUs, autoWorkshopSKUStats } from './seed-data/auto-workshop-skus';

// ============================================
// COMBINED SKU EXPORTS
// ============================================

export const allSKUs = {
  pharmacy: pharmacySKUs,
  healthBeauty: healthBeautySKUs,
  hardware: hardwareSKUs,
  electronics: electronicsSKUs,
  autoWorkshop: autoWorkshopSKUs,
};

// ============================================
// STATISTICS
// ============================================

export const skuStats = {
  pharmacy: pharmacySKUStats,
  healthBeauty: healthBeautySKUStats,
  hardware: hardwareSKUStats,
  electronics: electronicsSKUStats,
  autoWorkshop: autoWorkshopSKUStats,
  totalSKUs: 
    pharmacySKUStats.totalSKUs + 
    healthBeautySKUStats.totalSKUs + 
    hardwareSKUStats.totalSKUs + 
    electronicsSKUStats.totalSKUs + 
    autoWorkshopSKUStats.totalSKUs,
  byVertical: {
    pharmacy: pharmacySKUStats.totalSKUs,
    healthBeauty: healthBeautySKUStats.totalSKUs,
    hardware: hardwareSKUStats.totalSKUs,
    electronics: electronicsSKUStats.totalSKUs,
    autoWorkshop: autoWorkshopSKUStats.totalSKUs,
  },
};

// ============================================
// VERTICAL TO CATEGORY MAPPING
// ============================================

export const verticalCategories = {
  pharmacy: {
    name: 'Pharmacy',
    subVerticals: [
      'Full Pharmacy',
      'Health Shop (OTC)',
      'Herbal/Traditional',
      'Optometry',
      'Dentistry',
      'Veterinary',
    ],
    features: [
      'NAPPI Code Validation',
      'Schedule 0-6 Classification',
      'Prescription Linking',
      'Cold Chain Tracking',
      'Recall Management',
    ],
  },
  healthBeauty: {
    name: 'Health & Beauty',
    subVerticals: [
      'Hair Salon',
      'Barber',
      'Nail Salon',
      'Spa & Wellness',
      'Aesthetic Clinic',
      'Lash & Brow Studio',
      'General Beauty',
    ],
    features: [
      'Service + Product SKUs',
      'Appointment Integration',
      'Staff Commission Tracking',
    ],
  },
  hardware: {
    name: 'Hardware & Building',
    subVerticals: [
      'General Hardware',
      'Building Supplies',
      'Paint Shop',
      'Plumbing Supplies',
      'Electrical Supplies',
      'Agri-Supply',
    ],
    features: [
      'Bulk Pricing',
      'Project Estimation',
      'Delivery Scheduling',
    ],
  },
  electronics: {
    name: 'Electronics & Tech',
    subVerticals: [
      'Smartphones',
      'Feature Phones',
      'Phone Accessories',
      'Tablets',
      'Audio Equipment',
      'Wearables',
      'Gaming',
      'TVs & Entertainment',
    ],
    features: [
      'IMEI Tracking',
      'Serial Number Tracking',
      'RICA Compliance',
      'Warranty Registration',
    ],
  },
  autoWorkshop: {
    name: 'Auto Workshop',
    subVerticals: [
      'Engine Parts',
      'Brakes',
      'Suspension',
      'Electrical',
      'Fluids & Lubricants',
      'Body Parts',
      'Tools & Equipment',
      'Car Care',
    ],
    features: [
      'Vehicle Compatibility',
      'OEM Part Number Cross-Reference',
      'Service History Integration',
    ],
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getSKUsByVertical(vertical: string) {
  return allSKUs[vertical as keyof typeof allSKUs] || [];
}

export function getSKUsByCategory(vertical: string, category: string) {
  const skus = getSKUsByVertical(vertical);
  return skus.filter((sku: any) => sku.category === category);
}

export function getSKUsBySubcategory(vertical: string, subcategory: string) {
  const skus = getSKUsByVertical(vertical);
  return skus.filter((sku: any) => sku.subcategory === subcategory);
}

export function searchSKUs(query: string) {
  const results: any[] = [];
  const lowerQuery = query.toLowerCase();
  
  for (const [vertical, skus] of Object.entries(allSKUs)) {
    for (const sku of skus as any[]) {
      if (
        sku.name.toLowerCase().includes(lowerQuery) ||
        sku.sku.toLowerCase().includes(lowerQuery) ||
        sku.description?.toLowerCase().includes(lowerQuery)
      ) {
        results.push({ ...sku, vertical });
      }
    }
  }
  
  return results;
}

// ============================================
// PRINT SUMMARY
// ============================================

function printSummary() {
  console.log('\n========================================');
  console.log('SKU CATALOGUE SUMMARY');
  console.log('========================================\n');
  
  console.log('Total SKUs by Vertical:');
  console.log('-----------------------');
  for (const [vertical, count] of Object.entries(skuStats.byVertical)) {
    console.log(`  ${vertical.padEnd(15)}: ${count} SKUs`);
  }
  console.log('-----------------------');
  console.log(`  ${'TOTAL'.padEnd(15)}: ${skuStats.totalSKUs} SKUs\n`);
  
  console.log('Vertical Details:');
  console.log('-----------------');
  for (const [vertical, details] of Object.entries(verticalCategories)) {
    console.log(`\n${(details as any).name}:`);
    console.log(`  Sub-verticals: ${(details as any).subVerticals.join(', ')}`);
    console.log(`  Features: ${(details as any).features.join(', ')}`);
  }
  
  console.log('\n========================================\n');
}

// Print summary when run directly
printSummary();

export default allSKUs;
