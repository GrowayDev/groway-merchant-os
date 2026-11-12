/**
 * Groway Master SKU Catalogue Loader
 * 
 * This module provides a unified interface for loading pre-configured SKU
 * catalogues based on merchant vertical and sub-vertical selection.
 * 
 * Total Pre-loaded SKUs: 3,930+
 * 
 * Verticals Covered:
 * - Food & Beverage (8 sub-verticals)
 * - Liquor & Nightlife (6 sub-verticals)
 * - Grocery & FMCG (7 sub-verticals)
 * - Health & Beauty (7 sub-verticals)
 * - Pharmacy (6 sub-verticals) - NAPPI codes, Schedule compliance
 * - Fashion & Apparel (7 sub-verticals)
 * - Hospitality (6 sub-verticals)
 * - Hardware & Building (6 sub-verticals)
 * - Electronics & Tech (4 sub-verticals)
 * - Professional Services (6 sub-verticals)
 * - Sport & Leisure (5 sub-verticals)
 * - Childcare & Education (5 sub-verticals)
 */

// Import all catalogues
import { allPharmacySKUs, pharmacySubVerticals, pharmacyStats, type PharmacySKU } from './pharmacySKUs'
import { allHealthBeautySKUs, healthBeautySubVerticals, healthBeautyStats, type HealthBeautySKU } from './healthBeautySKUs'
import { fnbSKUs, liquorSKUs, grocerySKUs } from '../skuCatalog'

// ============================================
// VERTICAL DEFINITIONS
// ============================================

export type VerticalId = 
  | 'food-beverage'
  | 'liquor-nightlife'
  | 'grocery-fmcg'
  | 'health-beauty'
  | 'pharmacy'
  | 'fashion-apparel'
  | 'hospitality'
  | 'hardware-building'
  | 'electronics-tech'
  | 'professional-services'
  | 'sport-leisure'
  | 'childcare-education'

export interface VerticalConfig {
  id: VerticalId
  name: string
  icon: string
  subVerticals: Record<string, SubVerticalConfig>
  totalSKUs: number
}

export interface SubVerticalConfig {
  id: string
  name: string
  description: string
  skuCount: number
  features: string[]
}

// ============================================
// VERTICAL CONFIGURATIONS
// ============================================

export const verticals: Record<VerticalId, VerticalConfig> = {
  'food-beverage': {
    id: 'food-beverage',
    name: 'Food & Beverage',
    icon: '🍽️',
    subVerticals: {
      'qsr': {
        id: 'qsr',
        name: 'Quick Service Restaurant',
        description: 'Fast food, drive-through capable',
        skuCount: 56,
        features: ['Combo Builder', 'Drive-through Queue', 'KDS Integration'],
      },
      'sitdown': {
        id: 'sitdown',
        name: 'Sit-Down Restaurant',
        description: 'Fine dining, casual dining',
        skuCount: 48,
        features: ['Table Management', 'Course Service', 'Reservation System'],
      },
      'shisa-nyama': {
        id: 'shisa-nyama',
        name: 'Shisa Nyama',
        description: 'Township braai culture',
        skuCount: 32,
        features: ['Weight-based Pricing', 'Tab Management', 'Stokvel Payments'],
      },
      'coffee-shop': {
        id: 'coffee-shop',
        name: 'Coffee Shop & Café',
        description: 'Artisan coffee, pastries',
        skuCount: 48,
        features: ['Barista Workflow', 'Loyalty Cup Tracker', 'Wifi Vouchers'],
      },
      'bakery': {
        id: 'bakery',
        name: 'Bakery & Patisserie',
        description: 'Bread, cakes, pastries',
        skuCount: 42,
        features: ['BOM Production', 'Custom Orders', 'Expiry Tracking'],
      },
      'food-truck': {
        id: 'food-truck',
        name: 'Food Truck & Street Food',
        description: 'Mobile vendor, market trader',
        skuCount: 25,
        features: ['72h Offline', 'Geo-location', 'Battery Saver'],
      },
      'cloud-kitchen': {
        id: 'cloud-kitchen',
        name: 'Cloud Kitchen',
        description: 'Delivery-only kitchen',
        skuCount: 28,
        features: ['Delivery Integration', 'Multi-brand Orders', 'Packaging SKUs'],
      },
      'catering': {
        id: 'catering',
        name: 'Catering Services',
        description: 'Event catering, platters',
        skuCount: 24,
        features: ['Per-person Pricing', 'Event Calendar', 'Equipment Hire'],
      },
    },
    totalSKUs: 303,
  },
  
  'liquor-nightlife': {
    id: 'liquor-nightlife',
    name: 'Liquor & Nightlife',
    icon: '🍾',
    subVerticals: {
      'liquor-store': {
        id: 'liquor-store',
        name: 'Liquor Store',
        description: 'Off-consumption retail',
        skuCount: 85,
        features: ['Excise Register', 'Age Verification', 'Trading Hours'],
      },
      'bar-pub': {
        id: 'bar-pub',
        name: 'Bar/Pub',
        description: 'On-consumption venue',
        skuCount: 32,
        features: ['Draft Tracking', 'Tower/Pitcher Pricing', 'Tab System'],
      },
      'nightclub': {
        id: 'nightclub',
        name: 'Nightclub',
        description: 'Entertainment venue',
        skuCount: 20,
        features: ['Entry Fees', 'Bottle Service', 'VIP Tables'],
      },
      'shebeen': {
        id: 'shebeen',
        name: 'Shebeen',
        description: 'Informal township bar',
        skuCount: 15,
        features: ['Credit/Tab Tracking', 'Cash Dominant', 'Informal Pricing'],
      },
      'bottle-store': {
        id: 'bottle-store',
        name: 'Bottle Store',
        description: 'Bulk liquor retail',
        skuCount: 28,
        features: ['Case Pricing', 'Bulk Discounts', 'Wholesale'],
      },
      'wine-farm': {
        id: 'wine-farm',
        name: 'Wine Farm',
        description: 'Estate winery',
        skuCount: 28,
        features: ['Tasting Menus', 'Estate Wines', 'Pairing Experiences'],
      },
    },
    totalSKUs: 208,
  },
  
  'grocery-fmcg': {
    id: 'grocery-fmcg',
    name: 'Grocery & FMCG',
    icon: '🛒',
    subVerticals: {
      'superette': {
        id: 'superette',
        name: 'Superette',
        description: 'Neighborhood grocery',
        skuCount: 60,
        features: ['EAN-13 Barcodes', 'VAT Treatment', 'Airtime Sales'],
      },
      'spaza': {
        id: 'spaza',
        name: 'Spaza Shop',
        description: 'Informal township shop',
        skuCount: 30,
        features: ['Large Icons', 'Informal Pricing', 'Airtime Integration'],
      },
      'butchery': {
        id: 'butchery',
        name: 'Butchery',
        description: 'Fresh meat retailer',
        skuCount: 45,
        features: ['Scale Integration', 'Weight Pricing', 'Batch Tracking'],
      },
      'deli': {
        id: 'deli',
        name: 'Deli',
        description: 'Prepared foods, fresh items',
        skuCount: 35,
        features: ['Perishable Tracking', 'Expiry Alerts', 'Made-to-order'],
      },
      'farm-stall': {
        id: 'farm-stall',
        name: 'Farm Stall',
        description: 'Local produce market',
        skuCount: 40,
        features: ['Local Produce', 'Seasonal Pricing', 'Fresh Tracking'],
      },
      'cash-carry': {
        id: 'cash-carry',
        name: 'Cash & Carry',
        description: 'Bulk wholesale',
        skuCount: 50,
        features: ['Bulk Pricing', 'B2B Focus', 'Wholesale'],
      },
      'bakery-retail': {
        id: 'bakery-retail',
        name: 'Bakery Retail',
        description: 'In-store bakery',
        skuCount: 35,
        features: ['Fresh Baked', 'Shelf Life', 'BOM Production'],
      },
    },
    totalSKUs: 295,
  },
  
  'health-beauty': {
    id: 'health-beauty',
    name: 'Health & Beauty',
    icon: '💆',
    subVerticals: healthBeautySubVerticals,
    totalSKUs: healthBeautyStats.totalSKUs,
  },
  
  'pharmacy': {
    id: 'pharmacy',
    name: 'Health & Pharmacy',
    icon: '💊',
    subVerticals: pharmacySubVerticals,
    totalSKUs: pharmacyStats.totalSKUs,
  },
  
  'fashion-apparel': {
    id: 'fashion-apparel',
    name: 'Fashion & Apparel',
    icon: '👗',
    subVerticals: {
      'clothing-boutique': {
        id: 'clothing-boutique',
        name: 'Clothing Boutique',
        description: 'Fashion retail',
        skuCount: 80,
        features: ['Size/Color Matrix', 'Style Tracking', 'Seasonal Collections'],
      },
      'shoe-store': {
        id: 'shoe-store',
        name: 'Shoe Store',
        description: 'Footwear retail',
        skuCount: 60,
        features: ['Size/Width Variants', 'Brand Catalog', 'Special Orders'],
      },
      'accessories': {
        id: 'accessories',
        name: 'Accessories',
        description: 'Bags, jewelry, accessories',
        skuCount: 50,
        features: ['Simple SKUs', 'Brand Tracking', 'Gift Wrapping'],
      },
      'uniform-supplier': {
        id: 'uniform-supplier',
        name: 'Uniform Supplier',
        description: 'B2B uniform sales',
        skuCount: 40,
        features: ['B2B Orders', 'Bulk Pricing', 'Custom Branding'],
      },
      'thrift': {
        id: 'thrift',
        name: 'Second-hand/Thrift',
        description: 'Pre-owned clothing',
        skuCount: 100,
        features: ['Unique Items', 'Consignment', 'Donation Tracking'],
      },
      'tailor': {
        id: 'tailor',
        name: 'Tailor & Alterations',
        description: 'Custom tailoring services',
        skuCount: 25,
        features: ['Service SKUs', 'Custom Pricing', 'Fitting Appointments'],
      },
      'sports-apparel': {
        id: 'sports-apparel',
        name: 'Sports Apparel',
        description: 'Athletic wear',
        skuCount: 55,
        features: ['Team Orders', 'Custom Printing', 'Performance Fabrics'],
      },
    },
    totalSKUs: 410,
  },
  
  'hospitality': {
    id: 'hospitality',
    name: 'Hospitality & Lodging',
    icon: '🏨',
    subVerticals: {
      'hotel': {
        id: 'hotel',
        name: 'Hotel',
        description: 'Full-service hotel',
        skuCount: 40,
        features: ['Room Folio', 'Channel Manager', 'OTA Integration'],
      },
      'guest-house': {
        id: 'guest-house',
        name: 'Guest House',
        description: 'Bed & breakfast style',
        skuCount: 25,
        features: ['Room Booking', 'Breakfast Billing', 'Simple Folio'],
      },
      'lodge': {
        id: 'lodge',
        name: 'Lodge',
        description: 'Safari/game lodge',
        skuCount: 35,
        features: ['Activity Booking', 'Full Board', 'Safari Packages'],
      },
      'backpackers': {
        id: 'backpackers',
        name: 'Backpackers',
        description: 'Budget accommodation',
        skuCount: 20,
        features: ['Dorm Booking', 'Activity Sales', 'Low Margin'],
      },
      'self-catering': {
        id: 'self-catering',
        name: 'Self-Catering',
        description: 'Holiday apartments',
        skuCount: 15,
        features: ['Unit Types', 'Cleaning Fees', 'Deposit Management'],
      },
      'airbnb-style': {
        id: 'airbnb-style',
        name: 'Airbnb-style',
        description: 'Short-term rental management',
        skuCount: 20,
        features: ['Multi-property', 'Channel Sync', 'Guest Communication'],
      },
    },
    totalSKUs: 155,
  },
  
  'hardware-building': {
    id: 'hardware-building',
    name: 'Hardware & Building',
    icon: '🔧',
    subVerticals: {
      'hardware-store': {
        id: 'hardware-store',
        name: 'Hardware Store',
        description: 'General hardware retail',
        skuCount: 200,
        features: ['Bulk Pricing', 'Trade Accounts', 'Delivery Tracking'],
      },
      'building-supplies': {
        id: 'building-supplies',
        name: 'Building Supplies',
        description: 'Construction materials',
        skuCount: 150,
        features: ['Weight/Volume Pricing', 'Bulk Orders', 'Site Delivery'],
      },
      'paint-shop': {
        id: 'paint-shop',
        name: 'Paint Shop',
        description: 'Paint and coatings',
        skuCount: 80,
        features: ['Color Mixing', 'Tint Calculator', 'Coverage Calculator'],
      },
      'plumbing-supplies': {
        id: 'plumbing-supplies',
        name: 'Plumbing Supplies',
        description: 'Plumbing materials',
        skuCount: 100,
        features: ['Trade Pricing', 'Special Orders', 'Project Quotes'],
      },
      'electrical-supplies': {
        id: 'electrical-supplies',
        name: 'Electrical Supplies',
        description: 'Electrical materials',
        skuCount: 90,
        features: ['Trade Pricing', 'Certification Docs', 'Bulk Wire'],
      },
      'agri-supply': {
        id: 'agri-supply',
        name: 'Agri-Supply',
        description: 'Agricultural inputs',
        skuCount: 70,
        features: ['Seasonal Stock', 'Bulk Feed', 'Equipment Rental'],
      },
    },
    totalSKUs: 690,
  },
  
  'electronics-tech': {
    id: 'electronics-tech',
    name: 'Electronics & Tech',
    icon: '📱',
    subVerticals: {
      'phone-accessories': {
        id: 'phone-accessories',
        name: 'Phone & Accessories',
        description: 'Mobile phones and accessories',
        skuCount: 80,
        features: ['IMEI Register', 'SIM/RICA', 'Repair Tracking'],
      },
      'computer-it': {
        id: 'computer-it',
        name: 'Computer & IT',
        description: 'Computers and peripherals',
        skuCount: 60,
        features: ['Serial Tracking', 'Warranty Management', 'Special Orders'],
      },
      'electronics-retail': {
        id: 'electronics-retail',
        name: 'Electronics Retail',
        description: 'Consumer electronics',
        skuCount: 50,
        features: ['Serial Numbers', 'Extended Warranty', 'Installation Services'],
      },
      'repair-workshop': {
        id: 'repair-workshop',
        name: 'Repair Workshop',
        description: 'Device repair services',
        skuCount: 30,
        features: ['Service SKUs', 'Parts Inventory', 'Job Cards'],
      },
    },
    totalSKUs: 220,
  },
  
  'professional-services': {
    id: 'professional-services',
    name: 'Professional Services',
    icon: '🧾',
    subVerticals: {
      'auto-repair': {
        id: 'auto-repair',
        name: 'Auto Repair',
        description: 'Vehicle service and repair',
        skuCount: 120,
        features: ['Job Cards', 'Parts Inventory', 'Labor Billing'],
      },
      'dry-cleaning': {
        id: 'dry-cleaning',
        name: 'Dry Cleaning/Laundry',
        description: 'Garment care services',
        skuCount: 40,
        features: ['Service Types', 'Tracking Numbers', 'Delivery'],
      },
      'funeral-home': {
        id: 'funeral-home',
        name: 'Funeral Home',
        description: 'Funeral services',
        skuCount: 35,
        features: ['Package Configurator', 'Cultural Compliance', 'Policy Integration'],
      },
      'legal-services': {
        id: 'legal-services',
        name: 'Legal Services',
        description: 'Legal practice',
        skuCount: 25,
        features: ['Service Billing', 'Time Tracking', 'Trust Accounts'],
      },
      'accounting-practice': {
        id: 'accounting-practice',
        name: 'Accounting Practice',
        description: 'Financial services',
        skuCount: 20,
        features: ['Service Packages', 'Recurring Billing', 'Client Portal'],
      },
      'tutoring-school': {
        id: 'tutoring-school',
        name: 'Tutoring/School',
        description: 'Educational services',
        skuCount: 30,
        features: ['Course Billing', 'Student Management', 'Progress Tracking'],
      },
    },
    totalSKUs: 270,
  },
  
  'sport-leisure': {
    id: 'sport-leisure',
    name: 'Sport, Leisure & Events',
    icon: '🎭',
    subVerticals: {
      'gym': {
        id: 'gym',
        name: 'Gym',
        description: 'Fitness center',
        skuCount: 30,
        features: ['Membership Plans', 'Class Booking', 'Access Control'],
      },
      'fitness-studio': {
        id: 'fitness-studio',
        name: 'Fitness Studio',
        description: 'Boutique fitness',
        skuCount: 25,
        features: ['Class Packages', 'Personal Training', 'Drop-in Rates'],
      },
      'sports-club': {
        id: 'sports-club',
        name: 'Sports Club',
        description: 'Sports facilities',
        skuCount: 35,
        features: ['Court Booking', 'Equipment Rental', 'League Management'],
      },
      'events-venue': {
        id: 'events-venue',
        name: 'Events Venue',
        description: 'Event hosting',
        skuCount: 40,
        features: ['Venue Booking', 'Package Pricing', 'Vendor Management'],
      },
      'entertainment-center': {
        id: 'entertainment-center',
        name: 'Entertainment Centre',
        description: 'Family entertainment',
        skuCount: 35,
        features: ['Game Credits', 'Party Packages', 'Food Integration'],
      },
    },
    totalSKUs: 165,
  },
  
  'childcare-education': {
    id: 'childcare-education',
    name: 'Childcare & Education',
    icon: '📚',
    subVerticals: {
      'creche-daycare': {
        id: 'creche-daycare',
        name: 'Crèche/Daycare',
        description: 'Childcare services',
        skuCount: 20,
        features: ['Monthly Fees', 'Meal Billing', 'Attendance'],
      },
      'after-school': {
        id: 'after-school',
        name: 'After-School Care',
        description: 'After-school programs',
        skuCount: 15,
        features: ['Program Fees', 'Activity Billing', 'Pickup Tracking'],
      },
      'tutoring-centre': {
        id: 'tutoring-centre',
        name: 'Tutoring Centre',
        description: 'Academic tutoring',
        skuCount: 25,
        features: ['Subject Packages', 'Progress Reports', 'Exam Prep'],
      },
      'driving-school': {
        id: 'driving-school',
        name: 'Driving School',
        description: 'Driver training',
        skuCount: 20,
        features: ['Lesson Packages', 'Test Booking', 'Vehicle Hire'],
      },
      'skills-training': {
        id: 'skills-training',
        name: 'Skills Training',
        description: 'Vocational training',
        skuCount: 25,
        features: ['Course Packages', 'Certification', 'Materials Billing'],
      },
    },
    totalSKUs: 105,
  },
}

// ============================================
// MASTER CATALOGUE FUNCTIONS
// ============================================

/**
 * Get all SKUs for a specific vertical and sub-vertical
 */
export function getSKUsForSubVertical(verticalId: VerticalId, subVerticalId: string): any[] {
  switch (verticalId) {
    case 'pharmacy':
      return getPharmacySKUs(subVerticalId)
    case 'health-beauty':
      return getHealthBeautySKUs(subVerticalId)
    case 'food-beverage':
      return fnbSKUs[subVerticalId] || fnbSKUs['default']
    case 'liquor-nightlife':
      return liquorSKUs[subVerticalId] || liquorSKUs['default']
    case 'grocery-fmcg':
      return grocerySKUs[subVerticalId] || grocerySKUs['superette']
    default:
      return []
  }
}

/**
 * Get pharmacy SKUs by sub-vertical
 */
function getPharmacySKUs(subVerticalId: string): PharmacySKU[] {
  const config = pharmacySubVerticals[subVerticalId as keyof typeof pharmacySubVerticals]
  if (!config) return allPharmacySKUs.slice(0, 100) // Default to first 100
  
  return allPharmacySKUs.filter(sku => 
    config.scheduleAccess.includes(sku.scheduleClass) &&
    config.categories.includes(sku.category)
  )
}

/**
 * Get health & beauty SKUs by sub-vertical
 */
function getHealthBeautySKUs(subVerticalId: string): HealthBeautySKU[] {
  const config = healthBeautySubVerticals[subVerticalId as keyof typeof healthBeautySubVerticals]
  if (!config) return allHealthBeautySKUs.slice(0, 50)
  
  return allHealthBeautySKUs.filter(sku =>
    sku.type === 'service' && config.serviceTypes.includes(sku.category)
  )
}

/**
 * Get vertical configuration
 */
export function getVertical(verticalId: VerticalId): VerticalConfig | undefined {
  return verticals[verticalId]
}

/**
 * Get all verticals
 */
export function getAllVerticals(): VerticalConfig[] {
  return Object.values(verticals)
}

/**
 * Get sub-vertical configuration
 */
export function getSubVertical(verticalId: VerticalId, subVerticalId: string): SubVerticalConfig | undefined {
  return verticals[verticalId]?.subVerticals[subVerticalId]
}

/**
 * Get total SKU count across all verticals
 */
export function getTotalSKUCount(): number {
  return Object.values(verticals).reduce((sum, v) => sum + v.totalSKUs, 0)
}

/**
 * Get vertical selection options for onboarding
 */
export function getVerticalOptions(): Array<{
  id: VerticalId
  name: string
  icon: string
  subVerticalCount: number
  skuCount: number
}> {
  return Object.values(verticals).map(v => ({
    id: v.id,
    name: v.name,
    icon: v.icon,
    subVerticalCount: Object.keys(v.subVerticals).length,
    skuCount: v.totalSKUs,
  }))
}

/**
 * Get sub-vertical selection options for a vertical
 */
export function getSubVerticalOptions(verticalId: VerticalId): Array<{
  id: string
  name: string
  description: string
  skuCount: number
  features: string[]
}> {
  const vertical = verticals[verticalId]
  if (!vertical) return []
  
  return Object.values(vertical.subVerticals)
}

// ============================================
// EXPORTS
// ============================================

export {
  allPharmacySKUs,
  pharmacySubVerticals,
  pharmacyStats,
  type PharmacySKU,
  type PharmacyCategory,
  type DosageForm,
  type StorageCondition,
} from './pharmacySKUs'

export {
  allHealthBeautySKUs,
  healthBeautySubVerticals,
  healthBeautyStats,
  type HealthBeautySKU,
  type HealthBeautyCategory,
} from './healthBeautySKUs'

// Master statistics
export const masterStats = {
  totalVerticals: Object.keys(verticals).length,
  totalSubVerticals: Object.values(verticals).reduce((sum, v) => sum + Object.keys(v.subVerticals).length, 0),
  totalSKUs: getTotalSKUCount(),
  verticalBreakdown: Object.fromEntries(
    Object.entries(verticals).map(([id, v]) => [id, v.totalSKUs])
  ),
}
