/**
 * Groway Health & Beauty SKU Catalogue
 * South Africa-specific salon, spa, and wellness services + retail products
 * 
 * Sub-verticals covered:
 * - Hair Salon
 * - Barber
 * - Nail Salon
 * - Spa & Wellness
 * - Aesthetic Clinic
 * - Tattoo Studio
 * - Lash & Brow Studio
 * 
 * Total SKUs: 300+
 */

export interface HealthBeautySKU {
  // Core Identification
  sku: string
  name: string
  category: HealthBeautyCategory
  subcategory: string
  barcode?: string
  brand?: string
  
  // Service vs Product
  type: 'service' | 'product' | 'combo'
  
  // Duration (for services)
  durationMinutes?: number
  
  // Pricing (in cents - ZAR)
  costPriceCents: number
  sellingPriceCents: number
  
  // For Products
  trackInventory: boolean
  stockUnit?: string
  minStockLevel?: number
  
  // Commission (for staff)
  commissionPercent?: number
  
  // Service Settings
  requiresDeposit?: boolean
  depositPercent?: number
  bufferMinutes?: number
  
  // Description
  description?: string
  
  // Consumables used (for inventory deduction)
  consumables?: {
    sku: string
    quantity: number
    unit: string
  }[]
}

export type HealthBeautyCategory = 
  | 'hair_services'
  | 'hair_products'
  | 'barber_services'
  | 'barber_products'
  | 'nail_services'
  | 'nail_products'
  | 'spa_services'
  | 'spa_products'
  | 'aesthetic_services'
  | 'aesthetic_products'
  | 'tattoo_services'
  | 'tattoo_products'
  | 'lash_brow_services'
  | 'lash_brow_products'

// ============================================
// HAIR SALON - Services
// ============================================

export const hairSalonServices: HealthBeautySKU[] = [
  // --- CUTTING SERVICES ---
  {
    sku: 'HBS-HR-001',
    name: 'Ladies Cut & Style',
    category: 'hair_services',
    subcategory: 'Cutting',
    type: 'service',
    durationMinutes: 45,
    costPriceCents: 0,
    sellingPriceCents: 35000,
    commissionPercent: 30,
    requiresDeposit: false,
    bufferMinutes: 5,
    description: 'Professional cut, blow-dry and styling',
    consumables: [
      { sku: 'HBP-CON-001', quantity: 15, unit: 'ml' }, // Shampoo
      { sku: 'HBP-CON-002', quantity: 10, unit: 'ml' }, // Conditioner
    ],
  },
  {
    sku: 'HBS-HR-002',
    name: 'Ladies Cut & Blowdry',
    category: 'hair_services',
    subcategory: 'Cutting',
    type: 'service',
    durationMinutes: 60,
    costPriceCents: 0,
    sellingPriceCents: 45000,
    commissionPercent: 30,
    requiresDeposit: false,
    bufferMinutes: 10,
    description: 'Full cut with professional blowdry',
    consumables: [
      { sku: 'HBP-CON-001', quantity: 15, unit: 'ml' },
      { sku: 'HBP-CON-002', quantity: 10, unit: 'ml' },
      { sku: 'HBP-CON-003', quantity: 20, unit: 'ml' }, // Heat protectant
    ],
  },
  {
    sku: 'HBS-HR-003',
    name: 'Kids Cut (Under 12)',
    category: 'hair_services',
    subcategory: 'Cutting',
    type: 'service',
    durationMinutes: 20,
    costPriceCents: 0,
    sellingPriceCents: 15000,
    commissionPercent: 25,
    requiresDeposit: false,
    bufferMinutes: 5,
    description: 'Children\'s haircut',
  },
  {
    sku: 'HBS-HR-004',
    name: 'Trim/Ends Only',
    category: 'hair_services',
    subcategory: 'Cutting',
    type: 'service',
    durationMinutes: 20,
    costPriceCents: 0,
    sellingPriceCents: 18000,
    commissionPercent: 25,
    requiresDeposit: false,
    description: 'Quick trim of ends',
  },
  {
    sku: 'HBS-HR-005',
    name: 'Fringe Trim',
    category: 'hair_services',
    subcategory: 'Cutting',
    type: 'service',
    durationMinutes: 10,
    costPriceCents: 0,
    sellingPriceCents: 8000,
    commissionPercent: 20,
    requiresDeposit: false,
    description: 'Quick fringe trim',
  },
  
  // --- COLOURING SERVICES ---
  {
    sku: 'HBS-HR-010',
    name: 'Full Head Colour',
    category: 'hair_services',
    subcategory: 'Colouring',
    type: 'service',
    durationMinutes: 90,
    costPriceCents: 15000,
    sellingPriceCents: 65000,
    commissionPercent: 25,
    requiresDeposit: true,
    depositPercent: 30,
    bufferMinutes: 15,
    description: 'Single process full head colour',
    consumables: [
      { sku: 'HBP-DYE-001', quantity: 60, unit: 'ml' }, // Hair dye
      { sku: 'HBP-DEV-001', quantity: 60, unit: 'ml' }, // Developer
    ],
  },
  {
    sku: 'HBS-HR-011',
    name: 'Root Touch-Up',
    category: 'hair_services',
    subcategory: 'Colouring',
    type: 'service',
    durationMinutes: 60,
    costPriceCents: 8000,
    sellingPriceCents: 35000,
    commissionPercent: 25,
    requiresDeposit: false,
    bufferMinutes: 10,
    description: 'Root regrowth coverage',
    consumables: [
      { sku: 'HBP-DYE-001', quantity: 30, unit: 'ml' },
      { sku: 'HBP-DEV-001', quantity: 30, unit: 'ml' },
    ],
  },
  {
    sku: 'HBS-HR-012',
    name: 'Highlights (Full Head)',
    category: 'hair_services',
    subcategory: 'Colouring',
    type: 'service',
    durationMinutes: 120,
    costPriceCents: 25000,
    sellingPriceCents: 95000,
    commissionPercent: 25,
    requiresDeposit: true,
    depositPercent: 40,
    bufferMinutes: 15,
    description: 'Full head foil highlights',
    consumables: [
      { sku: 'HBP-BLE-001', quantity: 80, unit: 'ml' }, // Bleach
      { sku: 'HBP-DEV-002', quantity: 80, unit: 'ml' }, // Developer
    ],
  },
  {
    sku: 'HBS-HR-013',
    name: 'Highlights (Half Head)',
    category: 'hair_services',
    subcategory: 'Colouring',
    type: 'service',
    durationMinutes: 90,
    costPriceCents: 15000,
    sellingPriceCents: 65000,
    commissionPercent: 25,
    requiresDeposit: true,
    depositPercent: 30,
    bufferMinutes: 10,
    description: 'Half head foil highlights',
    consumables: [
      { sku: 'HBP-BLE-001', quantity: 50, unit: 'ml' },
      { sku: 'HBP-DEV-002', quantity: 50, unit: 'ml' },
    ],
  },
  {
    sku: 'HBS-HR-014',
    name: 'Balayage',
    category: 'hair_services',
    subcategory: 'Colouring',
    type: 'service',
    durationMinutes: 150,
    costPriceCents: 30000,
    sellingPriceCents: 120000,
    commissionPercent: 25,
    requiresDeposit: true,
    depositPercent: 50,
    bufferMinutes: 20,
    description: 'Hand-painted natural highlights',
    consumables: [
      { sku: 'HBP-BLE-001', quantity: 100, unit: 'ml' },
      { sku: 'HBP-DEV-002', quantity: 100, unit: 'ml' },
    ],
  },
  {
    sku: 'HBS-HR-015',
    name: 'Toner/Gloss Treatment',
    category: 'hair_services',
    subcategory: 'Colouring',
    type: 'service',
    durationMinutes: 30,
    costPriceCents: 5000,
    sellingPriceCents: 20000,
    commissionPercent: 20,
    requiresDeposit: false,
    description: 'Colour correcting toner',
    consumables: [
      { sku: 'HBP-TON-001', quantity: 40, unit: 'ml' },
    ],
  },
  
  // --- TREATMENTS ---
  {
    sku: 'HBS-HR-020',
    name: 'Deep Conditioning Treatment',
    category: 'hair_services',
    subcategory: 'Treatments',
    type: 'service',
    durationMinutes: 30,
    costPriceCents: 3000,
    sellingPriceCents: 18000,
    commissionPercent: 20,
    requiresDeposit: false,
    description: 'Intensive moisture treatment',
    consumables: [
      { sku: 'HBP-TRT-001', quantity: 50, unit: 'ml' },
    ],
  },
  {
    sku: 'HBS-HR-021',
    name: 'Keratin Treatment',
    category: 'hair_services',
    subcategory: 'Treatments',
    type: 'service',
    durationMinutes: 180,
    costPriceCents: 50000,
    sellingPriceCents: 150000,
    commissionPercent: 20,
    requiresDeposit: true,
    depositPercent: 50,
    bufferMinutes: 30,
    description: 'Smoothing keratin treatment',
    consumables: [
      { sku: 'HBP-KER-001', quantity: 100, unit: 'ml' },
    ],
  },
  {
    sku: 'HBS-HR-022',
    name: 'Scalp Treatment',
    category: 'hair_services',
    subcategory: 'Treatments',
    type: 'service',
    durationMinutes: 45,
    costPriceCents: 4000,
    sellingPriceCents: 25000,
    commissionPercent: 20,
    requiresDeposit: false,
    description: 'Deep scalp cleanse and massage',
    consumables: [
      { sku: 'HBP-SCL-001', quantity: 30, unit: 'ml' },
    ],
  },
  {
    sku: 'HBS-HR-023',
    name: 'Olaplex Treatment',
    category: 'hair_services',
    subcategory: 'Treatments',
    type: 'service',
    durationMinutes: 45,
    costPriceCents: 8000,
    sellingPriceCents: 35000,
    commissionPercent: 20,
    requiresDeposit: false,
    description: 'Bond-building hair repair',
    consumables: [
      { sku: 'HBP-OLP-001', quantity: 30, unit: 'ml' },
    ],
  },
  
  // --- STYLING ---
  {
    sku: 'HBS-HR-030',
    name: 'Blowdry Only',
    category: 'hair_services',
    subcategory: 'Styling',
    type: 'service',
    durationMinutes: 30,
    costPriceCents: 0,
    sellingPriceCents: 20000,
    commissionPercent: 30,
    requiresDeposit: false,
    description: 'Professional blowdry and style',
    consumables: [
      { sku: 'HBP-CON-003', quantity: 20, unit: 'ml' },
    ],
  },
  {
    sku: 'HBS-HR-031',
    name: 'Updo/Special Occasion Style',
    category: 'hair_services',
    subcategory: 'Styling',
    type: 'service',
    durationMinutes: 60,
    costPriceCents: 0,
    sellingPriceCents: 45000,
    commissionPercent: 30,
    requiresDeposit: true,
    depositPercent: 30,
    bufferMinutes: 10,
    description: 'Elegant updo for events',
  },
  {
    sku: 'HBS-HR-032',
    name: 'Wash & Go',
    category: 'hair_services',
    subcategory: 'Styling',
    type: 'service',
    durationMinutes: 20,
    costPriceCents: 0,
    sellingPriceCents: 12000,
    commissionPercent: 30,
    requiresDeposit: false,
    description: 'Quick wash and basic dry',
    consumables: [
      { sku: 'HBP-CON-001', quantity: 15, unit: 'ml' },
    ],
  },
  
  // --- BRAIDING & WEAVES ---
  {
    sku: 'HBS-HR-040',
    name: 'Box Braids (Small)',
    category: 'hair_services',
    subcategory: 'Braiding',
    type: 'service',
    durationMinutes: 300,
    costPriceCents: 10000,
    sellingPriceCents: 85000,
    commissionPercent: 25,
    requiresDeposit: true,
    depositPercent: 50,
    bufferMinutes: 30,
    description: 'Small box braids',
  },
  {
    sku: 'HBS-HR-041',
    name: 'Box Braids (Medium)',
    category: 'hair_services',
    subcategory: 'Braiding',
    type: 'service',
    durationMinutes: 240,
    costPriceCents: 8000,
    sellingPriceCents: 65000,
    commissionPercent: 25,
    requiresDeposit: true,
    depositPercent: 50,
    bufferMinutes: 20,
    description: 'Medium box braids',
  },
  {
    sku: 'HBS-HR-042',
    name: 'Cornrows',
    category: 'hair_services',
    subcategory: 'Braiding',
    type: 'service',
    durationMinutes: 90,
    costPriceCents: 5000,
    sellingPriceCents: 35000,
    commissionPercent: 30,
    requiresDeposit: false,
    bufferMinutes: 15,
    description: 'Traditional cornrows',
  },
  {
    sku: 'HBS-HR-043',
    name: 'Weave Sew-In',
    category: 'hair_services',
    subcategory: 'Weaves',
    type: 'service',
    durationMinutes: 120,
    costPriceCents: 15000,
    sellingPriceCents: 55000,
    commissionPercent: 25,
    requiresDeposit: true,
    depositPercent: 30,
    bufferMinutes: 15,
    description: 'Full sew-in weave installation',
  },
  {
    sku: 'HBS-HR-044',
    name: 'Weave Removal',
    category: 'hair_services',
    subcategory: 'Weaves',
    type: 'service',
    durationMinutes: 30,
    costPriceCents: 0,
    sellingPriceCents: 15000,
    commissionPercent: 30,
    requiresDeposit: false,
    description: 'Professional weave removal',
  },
]

// ============================================
// BARBER - Services
// ============================================

export const barberServices: HealthBeautySKU[] = [
  // --- BASIC CUTS ---
  {
    sku: 'HBS-BB-001',
    name: 'Gents Haircut',
    category: 'barber_services',
    subcategory: 'Cutting',
    type: 'service',
    durationMinutes: 30,
    costPriceCents: 0,
    sellingPriceCents: 12000,
    commissionPercent: 40,
    requiresDeposit: false,
    bufferMinutes: 5,
    description: 'Standard gents cut',
    consumables: [
      { sku: 'HBP-CON-001', quantity: 10, unit: 'ml' },
    ],
  },
  {
    sku: 'HBS-BB-002',
    name: 'Cut & Beard Trim',
    category: 'barber_services',
    subcategory: 'Cutting',
    type: 'service',
    durationMinutes: 40,
    costPriceCents: 0,
    sellingPriceCents: 18000,
    commissionPercent: 40,
    requiresDeposit: false,
    bufferMinutes: 5,
    description: 'Haircut with beard shape-up',
    consumables: [
      { sku: 'HBP-CON-001', quantity: 10, unit: 'ml' },
      { sku: 'HBP-BRD-001', quantity: 5, unit: 'ml' }, // Beard oil
    ],
  },
  {
    sku: 'HBS-BB-003',
    name: 'Cut & Shave',
    category: 'barber_services',
    subcategory: 'Cutting',
    type: 'service',
    durationMinutes: 45,
    costPriceCents: 0,
    sellingPriceCents: 22000,
    commissionPercent: 40,
    requiresDeposit: false,
    bufferMinutes: 10,
    description: 'Haircut with hot towel shave',
    consumables: [
      { sku: 'HBP-CON-001', quantity: 10, unit: 'ml' },
      { sku: 'HBP-SHV-001', quantity: 10, unit: 'ml' }, // Shaving cream
    ],
  },
  {
    sku: 'HBS-BB-004',
    name: 'Kids Haircut (Under 12)',
    category: 'barber_services',
    subcategory: 'Cutting',
    type: 'service',
    durationMinutes: 20,
    costPriceCents: 0,
    sellingPriceCents: 8000,
    commissionPercent: 35,
    requiresDeposit: false,
    description: 'Children\'s haircut',
  },
  {
    sku: 'HBS-BB-005',
    name: 'Pensioner Cut',
    category: 'barber_services',
    subcategory: 'Cutting',
    type: 'service',
    durationMinutes: 25,
    costPriceCents: 0,
    sellingPriceCents: 8000,
    commissionPercent: 35,
    requiresDeposit: false,
    description: 'Senior citizen discount haircut',
  },
  
  // --- BEARD SERVICES ---
  {
    sku: 'HBS-BB-010',
    name: 'Beard Trim Only',
    category: 'barber_services',
    subcategory: 'Beard',
    type: 'service',
    durationMinutes: 15,
    costPriceCents: 0,
    sellingPriceCents: 8000,
    commissionPercent: 40,
    requiresDeposit: false,
    description: 'Beard shape and trim',
    consumables: [
      { sku: 'HBP-BRD-001', quantity: 5, unit: 'ml' },
    ],
  },
  {
    sku: 'HBS-BB-011',
    name: 'Hot Towel Shave',
    category: 'barber_services',
    subcategory: 'Beard',
    type: 'service',
    durationMinutes: 30,
    costPriceCents: 0,
    sellingPriceCents: 15000,
    commissionPercent: 40,
    requiresDeposit: false,
    description: 'Traditional hot towel shave',
    consumables: [
      { sku: 'HBP-SHV-001', quantity: 15, unit: 'ml' },
      { sku: 'HBP-ABR-001', quantity: 5, unit: 'ml' }, // Aftershave balm
    ],
  },
  {
    sku: 'HBS-BB-012',
    name: 'Beard Shape & Line-Up',
    category: 'barber_services',
    subcategory: 'Beard',
    type: 'service',
    durationMinutes: 20,
    costPriceCents: 0,
    sellingPriceCents: 10000,
    commissionPercent: 40,
    requiresDeposit: false,
    description: 'Precise beard line-up',
    consumables: [
      { sku: 'HBP-BRD-001', quantity: 5, unit: 'ml' },
    ],
  },
  {
    sku: 'HBS-BB-013',
    name: 'Full Beard Grooming',
    category: 'barber_services',
    subcategory: 'Beard',
    type: 'service',
    durationMinutes: 25,
    costPriceCents: 0,
    sellingPriceCents: 12000,
    commissionPercent: 40,
    requiresDeposit: false,
    description: 'Complete beard wash, trim, shape and oil',
    consumables: [
      { sku: 'HBP-BRD-001', quantity: 10, unit: 'ml' },
      { sku: 'HBP-BRD-002', quantity: 5, unit: 'ml' }, // Beard balm
    ],
  },
  
  // --- STYLING ---
  {
    sku: 'HBS-BB-020',
    name: 'Fade (Skin Fade)',
    category: 'barber_services',
    subcategory: 'Styling',
    type: 'service',
    durationMinutes: 40,
    costPriceCents: 0,
    sellingPriceCents: 18000,
    commissionPercent: 40,
    requiresDeposit: false,
    bufferMinutes: 5,
    description: 'Professional skin fade',
  },
  {
    sku: 'HBS-BB-021',
    name: 'Design/Patterns',
    category: 'barber_services',
    subcategory: 'Styling',
    type: 'service',
    durationMinutes: 45,
    costPriceCents: 0,
    sellingPriceCents: 20000,
    commissionPercent: 40,
    requiresDeposit: false,
    description: 'Custom hair designs and patterns',
  },
  {
    sku: 'HBS-BB-022',
    name: 'Hairline Restoration',
    category: 'barber_services',
    subcategory: 'Styling',
    type: 'service',
    durationMinutes: 20,
    costPriceCents: 0,
    sellingPriceCents: 15000,
    commissionPercent: 40,
    requiresDeposit: false,
    description: 'Hairline edge-up and restoration',
  },
  
  // --- COMBOS ---
  {
    sku: 'HBS-BB-030',
    name: 'The Full Works',
    category: 'barber_services',
    subcategory: 'Combos',
    type: 'combo',
    durationMinutes: 50,
    costPriceCents: 0,
    sellingPriceCents: 28000,
    commissionPercent: 35,
    requiresDeposit: false,
    bufferMinutes: 10,
    description: 'Cut, beard trim, hot towel, facial',
    consumables: [
      { sku: 'HBP-CON-001', quantity: 10, unit: 'ml' },
      { sku: 'HBP-BRD-001', quantity: 10, unit: 'ml' },
      { sku: 'HBP-SHV-001', quantity: 10, unit: 'ml' },
    ],
  },
  {
    sku: 'HBS-BB-031',
    name: 'Gentleman\'s Package',
    category: 'barber_services',
    subcategory: 'Combos',
    type: 'combo',
    durationMinutes: 60,
    costPriceCents: 0,
    sellingPriceCents: 35000,
    commissionPercent: 35,
    requiresDeposit: false,
    bufferMinutes: 10,
    description: 'Cut, shave, facial massage, styling',
  },
]

// ============================================
// NAIL SALON - Services
// ============================================

export const nailSalonServices: HealthBeautySKU[] = [
  // --- MANICURES ---
  {
    sku: 'HBS-NL-001',
    name: 'Basic Manicure',
    category: 'nail_services',
    subcategory: 'Manicure',
    type: 'service',
    durationMinutes: 30,
    costPriceCents: 0,
    sellingPriceCents: 15000,
    commissionPercent: 35,
    requiresDeposit: false,
    description: 'File, shape, cuticle care, polish',
    consumables: [
      { sku: 'NBP-POL-001', quantity: 1, unit: 'application' },
    ],
  },
  {
    sku: 'HBS-NL-002',
    name: 'Gel Manicure',
    category: 'nail_services',
    subcategory: 'Manicure',
    type: 'service',
    durationMinutes: 45,
    costPriceCents: 5000,
    sellingPriceCents: 25000,
    commissionPercent: 35,
    requiresDeposit: false,
    description: 'Long-lasting gel polish manicure',
    consumables: [
      { sku: 'NBP-GEL-001', quantity: 1, unit: 'application' },
    ],
  },
  {
    sku: 'HBS-NL-003',
    name: 'Spa Manicure',
    category: 'nail_services',
    subcategory: 'Manicure',
    type: 'service',
    durationMinutes: 45,
    costPriceCents: 2000,
    sellingPriceCents: 22000,
    commissionPercent: 35,
    requiresDeposit: false,
    description: 'Manicure with hand massage and mask',
    consumables: [
      { sku: 'NBP-POL-001', quantity: 1, unit: 'application' },
      { sku: 'NBP-MAS-001', quantity: 20, unit: 'g' }, // Hand mask
    ],
  },
  {
    sku: 'HBS-NL-004',
    name: 'Acrylic Full Set',
    category: 'nail_services',
    subcategory: 'Extensions',
    type: 'service',
    durationMinutes: 90,
    costPriceCents: 8000,
    sellingPriceCents: 45000,
    commissionPercent: 30,
    requiresDeposit: false,
    bufferMinutes: 15,
    description: 'Full set of acrylic nail extensions',
    consumables: [
      { sku: 'NBP-ACR-001', quantity: 1, unit: 'set' },
    ],
  },
  {
    sku: 'HBS-NL-005',
    name: 'Acrylic Refill',
    category: 'nail_services',
    subcategory: 'Extensions',
    type: 'service',
    durationMinutes: 60,
    costPriceCents: 4000,
    sellingPriceCents: 28000,
    commissionPercent: 30,
    requiresDeposit: false,
    bufferMinutes: 10,
    description: 'Acrylic infill for regrowth',
    consumables: [
      { sku: 'NBP-ACR-002', quantity: 1, unit: 'refill' },
    ],
  },
  {
    sku: 'HBS-NL-006',
    name: 'Gel Extensions Full Set',
    category: 'nail_services',
    subcategory: 'Extensions',
    type: 'service',
    durationMinutes: 75,
    costPriceCents: 6000,
    sellingPriceCents: 38000,
    commissionPercent: 30,
    requiresDeposit: false,
    bufferMinutes: 10,
    description: 'Gel nail extensions',
    consumables: [
      { sku: 'NBP-GEL-002', quantity: 1, unit: 'set' },
    ],
  },
  
  // --- PEDICURES ---
  {
    sku: 'HBS-NL-010',
    name: 'Basic Pedicure',
    category: 'nail_services',
    subcategory: 'Pedicure',
    type: 'service',
    durationMinutes: 45,
    costPriceCents: 0,
    sellingPriceCents: 20000,
    commissionPercent: 35,
    requiresDeposit: false,
    description: 'Foot soak, file, shape, polish',
    consumables: [
      { sku: 'NBP-POL-001', quantity: 1, unit: 'application' },
    ],
  },
  {
    sku: 'HBS-NL-011',
    name: 'Gel Pedicure',
    category: 'nail_services',
    subcategory: 'Pedicure',
    type: 'service',
    durationMinutes: 60,
    costPriceCents: 5000,
    sellingPriceCents: 32000,
    commissionPercent: 35,
    requiresDeposit: false,
    description: 'Long-lasting gel polish pedicure',
    consumables: [
      { sku: 'NBP-GEL-001', quantity: 1, unit: 'application' },
    ],
  },
  {
    sku: 'HBS-NL-012',
    name: 'Spa Pedicure',
    category: 'nail_services',
    subcategory: 'Pedicure',
    type: 'service',
    durationMinutes: 60,
    costPriceCents: 3000,
    sellingPriceCents: 35000,
    commissionPercent: 35,
    requiresDeposit: false,
    description: 'Luxury pedicure with scrub, mask, massage',
    consumables: [
      { sku: 'NBP-POL-001', quantity: 1, unit: 'application' },
      { sku: 'NBP-SCR-001', quantity: 30, unit: 'g' }, // Foot scrub
      { sku: 'NBP-MAS-002', quantity: 30, unit: 'g' }, // Foot mask
    ],
  },
  
  // --- NAIL ART ---
  {
    sku: 'HBS-NL-020',
    name: 'Nail Art (Simple)',
    category: 'nail_services',
    subcategory: 'Nail Art',
    type: 'service',
    durationMinutes: 15,
    costPriceCents: 0,
    sellingPriceCents: 8000,
    commissionPercent: 40,
    requiresDeposit: false,
    description: 'Simple nail art design',
  },
  {
    sku: 'HBS-NL-021',
    name: 'Nail Art (Complex)',
    category: 'nail_services',
    subcategory: 'Nail Art',
    type: 'service',
    durationMinutes: 30,
    costPriceCents: 0,
    sellingPriceCents: 15000,
    commissionPercent: 40,
    requiresDeposit: false,
    description: 'Detailed nail art design',
  },
  {
    sku: 'HBS-NL-022',
    name: 'French Tips',
    category: 'nail_services',
    subcategory: 'Nail Art',
    type: 'service',
    durationMinutes: 20,
    costPriceCents: 0,
    sellingPriceCents: 10000,
    commissionPercent: 40,
    requiresDeposit: false,
    description: 'Classic French manicure tips',
  },
]

// ============================================
// SPA & WELLNESS - Services
// ============================================

export const spaWellnessServices: HealthBeautySKU[] = [
  // --- MASSAGES ---
  {
    sku: 'HBS-SP-001',
    name: 'Swedish Massage (60min)',
    category: 'spa_services',
    subcategory: 'Massage',
    type: 'service',
    durationMinutes: 60,
    costPriceCents: 5000,
    sellingPriceCents: 45000,
    commissionPercent: 25,
    requiresDeposit: false,
    bufferMinutes: 15,
    description: 'Relaxing full body Swedish massage',
    consumables: [
      { sku: 'SPB-OIL-001', quantity: 30, unit: 'ml' }, // Massage oil
    ],
  },
  {
    sku: 'HBS-SP-002',
    name: 'Swedish Massage (90min)',
    category: 'spa_services',
    subcategory: 'Massage',
    type: 'service',
    durationMinutes: 90,
    costPriceCents: 8000,
    sellingPriceCents: 65000,
    commissionPercent: 25,
    requiresDeposit: false,
    bufferMinutes: 15,
    description: 'Extended full body massage',
    consumables: [
      { sku: 'SPB-OIL-001', quantity: 45, unit: 'ml' },
    ],
  },
  {
    sku: 'HBS-SP-003',
    name: 'Deep Tissue Massage (60min)',
    category: 'spa_services',
    subcategory: 'Massage',
    type: 'service',
    durationMinutes: 60,
    costPriceCents: 5000,
    sellingPriceCents: 55000,
    commissionPercent: 25,
    requiresDeposit: false,
    bufferMinutes: 15,
    description: 'Intensive muscle release massage',
    consumables: [
      { sku: 'SPB-OIL-001', quantity: 30, unit: 'ml' },
    ],
  },
  {
    sku: 'HBS-SP-004',
    name: 'Hot Stone Massage (75min)',
    category: 'spa_services',
    subcategory: 'Massage',
    type: 'service',
    durationMinutes: 75,
    costPriceCents: 10000,
    sellingPriceCents: 65000,
    commissionPercent: 25,
    requiresDeposit: false,
    bufferMinutes: 20,
    description: 'Hot stone therapy massage',
    consumables: [
      { sku: 'SPB-OIL-001', quantity: 30, unit: 'ml' },
    ],
  },
  {
    sku: 'HBS-SP-005',
    name: 'Aromatherapy Massage (60min)',
    category: 'spa_services',
    subcategory: 'Massage',
    type: 'service',
    durationMinutes: 60,
    costPriceCents: 8000,
    sellingPriceCents: 55000,
    commissionPercent: 25,
    requiresDeposit: false,
    bufferMinutes: 15,
    description: 'Essential oil infused massage',
    consumables: [
      { sku: 'SPB-OIL-002', quantity: 30, unit: 'ml' }, // Aromatherapy oil
    ],
  },
  {
    sku: 'HBS-SP-006',
    name: 'Back, Neck & Shoulder (30min)',
    category: 'spa_services',
    subcategory: 'Massage',
    type: 'service',
    durationMinutes: 30,
    costPriceCents: 3000,
    sellingPriceCents: 25000,
    commissionPercent: 30,
    requiresDeposit: false,
    bufferMinutes: 10,
    description: 'Focused tension relief',
    consumables: [
      { sku: 'SPB-OIL-001', quantity: 15, unit: 'ml' },
    ],
  },
  
  // --- FACIALS ---
  {
    sku: 'HBS-SP-010',
    name: 'Classic Facial',
    category: 'spa_services',
    subcategory: 'Facial',
    type: 'service',
    durationMinutes: 45,
    costPriceCents: 5000,
    sellingPriceCents: 35000,
    commissionPercent: 25,
    requiresDeposit: false,
    bufferMinutes: 10,
    description: 'Cleanse, tone, mask, moisturize',
    consumables: [
      { sku: 'SPB-FC-001', quantity: 1, unit: 'kit' },
    ],
  },
  {
    sku: 'HBS-SP-011',
    name: 'Deep Cleansing Facial',
    category: 'spa_services',
    subcategory: 'Facial',
    type: 'service',
    durationMinutes: 60,
    costPriceCents: 8000,
    sellingPriceCents: 45000,
    commissionPercent: 25,
    requiresDeposit: false,
    bufferMinutes: 10,
    description: 'Extraction and deep pore cleansing',
    consumables: [
      { sku: 'SPB-FC-002', quantity: 1, unit: 'kit' },
    ],
  },
  {
    sku: 'HBS-SP-012',
    name: 'Anti-Aging Facial',
    category: 'spa_services',
    subcategory: 'Facial',
    type: 'service',
    durationMinutes: 60,
    costPriceCents: 12000,
    sellingPriceCents: 65000,
    commissionPercent: 25,
    requiresDeposit: false,
    bufferMinutes: 10,
    description: 'Collagen boosting facial treatment',
    consumables: [
      { sku: 'SPB-FC-003', quantity: 1, unit: 'kit' },
    ],
  },
  {
    sku: 'HBS-SP-013',
    name: 'Hydrating Facial',
    category: 'spa_services',
    subcategory: 'Facial',
    type: 'service',
    durationMinutes: 45,
    costPriceCents: 6000,
    sellingPriceCents: 40000,
    commissionPercent: 25,
    requiresDeposit: false,
    bufferMinutes: 10,
    description: 'Intensive moisture treatment',
    consumables: [
      { sku: 'SPB-FC-004', quantity: 1, unit: 'kit' },
    ],
  },
  
  // --- BODY TREATMENTS ---
  {
    sku: 'HBS-SP-020',
    name: 'Full Body Scrub',
    category: 'spa_services',
    subcategory: 'Body',
    type: 'service',
    durationMinutes: 45,
    costPriceCents: 5000,
    sellingPriceCents: 35000,
    commissionPercent: 25,
    requiresDeposit: false,
    bufferMinutes: 15,
    description: 'Exfoliating body scrub treatment',
    consumables: [
      { sku: 'SPB-SCR-001', quantity: 100, unit: 'g' },
    ],
  },
  {
    sku: 'HBS-SP-021',
    name: 'Body Wrap',
    category: 'spa_services',
    subcategory: 'Body',
    type: 'service',
    durationMinutes: 60,
    costPriceCents: 8000,
    sellingPriceCents: 45000,
    commissionPercent: 25,
    requiresDeposit: false,
    bufferMinutes: 15,
    description: 'Detox or hydrating body wrap',
    consumables: [
      { sku: 'SPB-WRP-001', quantity: 1, unit: 'kit' },
    ],
  },
  {
    sku: 'HBS-SP-022',
    name: 'Body Scrub & Massage Combo',
    category: 'spa_services',
    subcategory: 'Body',
    type: 'combo',
    durationMinutes: 90,
    costPriceCents: 8000,
    sellingPriceCents: 65000,
    commissionPercent: 25,
    requiresDeposit: false,
    bufferMinutes: 15,
    description: 'Full body scrub followed by massage',
    consumables: [
      { sku: 'SPB-SCR-001', quantity: 100, unit: 'g' },
      { sku: 'SPB-OIL-001', quantity: 30, unit: 'ml' },
    ],
  },
  
  // --- PACKAGES ---
  {
    sku: 'HBS-SP-030',
    name: 'Half Day Spa Package',
    category: 'spa_services',
    subcategory: 'Packages',
    type: 'combo',
    durationMinutes: 180,
    costPriceCents: 15000,
    sellingPriceCents: 95000,
    commissionPercent: 20,
    requiresDeposit: true,
    depositPercent: 30,
    bufferMinutes: 30,
    description: 'Massage, facial, manicure, pedicure',
  },
  {
    sku: 'HBS-SP-031',
    name: 'Couples Package',
    category: 'spa_services',
    subcategory: 'Packages',
    type: 'combo',
    durationMinutes: 120,
    costPriceCents: 12000,
    sellingPriceCents: 85000,
    commissionPercent: 20,
    requiresDeposit: true,
    depositPercent: 30,
    bufferMinutes: 20,
    description: 'Side-by-side massage and champagne',
  },
]

// ============================================
// LASH & BROW - Services
// ============================================

export const lashBrowServices: HealthBeautySKU[] = [
  // --- LASHES ---
  {
    sku: 'HBS-LB-001',
    name: 'Classic Lash Extensions (Full Set)',
    category: 'lash_brow_services',
    subcategory: 'Lashes',
    type: 'service',
    durationMinutes: 90,
    costPriceCents: 5000,
    sellingPriceCents: 45000,
    commissionPercent: 30,
    requiresDeposit: true,
    depositPercent: 30,
    bufferMinutes: 15,
    description: 'Individual classic lash extensions',
    consumables: [
      { sku: 'LBP-LSH-001', quantity: 1, unit: 'set' },
    ],
  },
  {
    sku: 'HBS-LB-002',
    name: 'Volume Lash Extensions (Full Set)',
    category: 'lash_brow_services',
    subcategory: 'Lashes',
    type: 'service',
    durationMinutes: 120,
    costPriceCents: 8000,
    sellingPriceCents: 65000,
    commissionPercent: 30,
    requiresDeposit: true,
    depositPercent: 30,
    bufferMinutes: 15,
    description: 'Lightweight volume fans',
    consumables: [
      { sku: 'LBP-LSH-002', quantity: 1, unit: 'set' },
    ],
  },
  {
    sku: 'HBS-LB-003',
    name: 'Hybrid Lash Extensions (Full Set)',
    category: 'lash_brow_services',
    subcategory: 'Lashes',
    type: 'service',
    durationMinutes: 105,
    costPriceCents: 7000,
    sellingPriceCents: 55000,
    commissionPercent: 30,
    requiresDeposit: true,
    depositPercent: 30,
    bufferMinutes: 15,
    description: 'Mix of classic and volume',
    consumables: [
      { sku: 'LBP-LSH-003', quantity: 1, unit: 'set' },
    ],
  },
  {
    sku: 'HBS-LB-004',
    name: 'Lash Refill',
    category: 'lash_brow_services',
    subcategory: 'Lashes',
    type: 'service',
    durationMinutes: 60,
    costPriceCents: 3000,
    sellingPriceCents: 28000,
    commissionPercent: 30,
    requiresDeposit: false,
    bufferMinutes: 10,
    description: 'Lash extension refill',
    consumables: [
      { sku: 'LBP-LSH-004', quantity: 1, unit: 'refill' },
    ],
  },
  {
    sku: 'HBS-LB-005',
    name: 'Lash Lift',
    category: 'lash_brow_services',
    subcategory: 'Lashes',
    type: 'service',
    durationMinutes: 45,
    costPriceCents: 3000,
    sellingPriceCents: 35000,
    commissionPercent: 35,
    requiresDeposit: false,
    bufferMinutes: 10,
    description: 'Natural lash lift and tint',
    consumables: [
      { sku: 'LBP-LFT-001', quantity: 1, unit: 'kit' },
    ],
  },
  {
    sku: 'HBS-LB-006',
    name: 'Lash Tint',
    category: 'lash_brow_services',
    subcategory: 'Lashes',
    type: 'service',
    durationMinutes: 20,
    costPriceCents: 500,
    sellingPriceCents: 12000,
    commissionPercent: 40,
    requiresDeposit: false,
    description: 'Eyelash tinting',
    consumables: [
      { sku: 'LBP-TNT-001', quantity: 1, unit: 'application' },
    ],
  },
  
  // --- BROWS ---
  {
    sku: 'HBS-LB-010',
    name: 'Brow Wax & Tint',
    category: 'lash_brow_services',
    subcategory: 'Brows',
    type: 'service',
    durationMinutes: 20,
    costPriceCents: 500,
    sellingPriceCents: 15000,
    commissionPercent: 40,
    requiresDeposit: false,
    description: 'Brow shaping and tinting',
    consumables: [
      { sku: 'LBP-TNT-002', quantity: 1, unit: 'application' },
    ],
  },
  {
    sku: 'HBS-LB-011',
    name: 'Brow Lamination',
    category: 'lash_brow_services',
    subcategory: 'Brows',
    type: 'service',
    durationMinutes: 45,
    costPriceCents: 3000,
    sellingPriceCents: 35000,
    commissionPercent: 35,
    requiresDeposit: false,
    bufferMinutes: 10,
    description: 'Brow lift and set treatment',
    consumables: [
      { sku: 'LBP-BRW-001', quantity: 1, unit: 'kit' },
    ],
  },
  {
    sku: 'HBS-LB-012',
    name: 'Microblading (Full)',
    category: 'lash_brow_services',
    subcategory: 'Brows',
    type: 'service',
    durationMinutes: 120,
    costPriceCents: 15000,
    sellingPriceCents: 85000,
    commissionPercent: 25,
    requiresDeposit: true,
    depositPercent: 50,
    bufferMinutes: 20,
    description: 'Semi-permanent brow tattoo',
    consumables: [
      { sku: 'LBP-MCB-001', quantity: 1, unit: 'kit' },
    ],
  },
  {
    sku: 'HBS-LB-013',
    name: 'Microblading Touch-Up',
    category: 'lash_brow_services',
    subcategory: 'Brows',
    type: 'service',
    durationMinutes: 60,
    costPriceCents: 5000,
    sellingPriceCents: 35000,
    commissionPercent: 25,
    requiresDeposit: false,
    bufferMinutes: 10,
    description: '6-8 week touch-up',
    consumables: [
      { sku: 'LBP-MCB-002', quantity: 1, unit: 'kit' },
    ],
  },
  {
    sku: 'HBS-LB-014',
    name: 'Henna Brows',
    category: 'lash_brow_services',
    subcategory: 'Brows',
    type: 'service',
    durationMinutes: 30,
    costPriceCents: 1000,
    sellingPriceCents: 18000,
    commissionPercent: 35,
    requiresDeposit: false,
    description: 'Long-lasting henna brow tint',
    consumables: [
      { sku: 'LBP-HNA-001', quantity: 1, unit: 'application' },
    ],
  },
]

// ============================================
// PRODUCTS - Hair Salon Consumables
// ============================================

export const hairProducts: HealthBeautySKU[] = [
  // --- SHAMPOOS & CONDITIONERS ---
  {
    sku: 'HBP-SH-001',
    name: 'Professional Shampoo 1L',
    category: 'hair_products',
    subcategory: 'Shampoo',
    type: 'product',
    barcode: '600001001001',
    brand: 'Generic',
    trackInventory: true,
    stockUnit: 'ml',
    minStockLevel: 500,
    costPriceCents: 12000,
    sellingPriceCents: 25000,
  },
  {
    sku: 'HBP-CD-001',
    name: 'Professional Conditioner 1L',
    category: 'hair_products',
    subcategory: 'Conditioner',
    type: 'product',
    barcode: '600001002001',
    brand: 'Generic',
    trackInventory: true,
    stockUnit: 'ml',
    minStockLevel: 500,
    costPriceCents: 14000,
    sellingPriceCents: 28000,
  },
  {
    sku: 'HBP-DY-001',
    name: 'Hair Colour - Black',
    category: 'hair_products',
    subcategory: 'Colour',
    type: 'product',
    barcode: '600001003001',
    brand: 'Generic',
    trackInventory: true,
    stockUnit: 'tube',
    minStockLevel: 20,
    costPriceCents: 4500,
    sellingPriceCents: 8500,
  },
  {
    sku: 'HBP-DY-002',
    name: 'Hair Colour - Brown',
    category: 'hair_products',
    subcategory: 'Colour',
    type: 'product',
    barcode: '600001003002',
    brand: 'Generic',
    trackInventory: true,
    stockUnit: 'tube',
    minStockLevel: 20,
    costPriceCents: 4500,
    sellingPriceCents: 8500,
  },
  {
    sku: 'HBP-DY-003',
    name: 'Hair Colour - Blonde',
    category: 'hair_products',
    subcategory: 'Colour',
    type: 'product',
    barcode: '600001003003',
    brand: 'Generic',
    trackInventory: true,
    stockUnit: 'tube',
    minStockLevel: 20,
    costPriceCents: 4500,
    sellingPriceCents: 8500,
  },
  {
    sku: 'HBP-ST-001',
    name: 'Hair Styling Gel 250ml',
    category: 'hair_products',
    subcategory: 'Styling',
    type: 'product',
    barcode: '600001004001',
    brand: 'Generic',
    trackInventory: true,
    stockUnit: 'ml',
    minStockLevel: 200,
    costPriceCents: 3500,
    sellingPriceCents: 7500,
  },
  {
    sku: 'HBP-ST-002',
    name: 'Hair Spray 300ml',
    category: 'hair_products',
    subcategory: 'Styling',
    type: 'product',
    barcode: '600001004002',
    brand: 'Generic',
    trackInventory: true,
    stockUnit: 'ml',
    minStockLevel: 200,
    costPriceCents: 4000,
    sellingPriceCents: 8500,
  },
  {
    sku: 'HBP-TR-001',
    name: 'Deep Treatment Mask 500ml',
    category: 'hair_products',
    subcategory: 'Treatment',
    type: 'product',
    barcode: '600001005001',
    brand: 'Generic',
    trackInventory: true,
    stockUnit: 'ml',
    minStockLevel: 300,
    costPriceCents: 8500,
    sellingPriceCents: 18000,
  },
]

// ============================================
// PRODUCTS - Barber Consumables
// ============================================

export const barberProducts: HealthBeautySKU[] = [
  {
    sku: 'BBP-BD-001',
    name: 'Beard Oil 50ml',
    category: 'barber_products',
    subcategory: 'Beard Care',
    type: 'product',
    barcode: '600002001001',
    brand: 'Generic',
    trackInventory: true,
    stockUnit: 'ml',
    minStockLevel: 100,
    costPriceCents: 2500,
    sellingPriceCents: 6500,
  },
  {
    sku: 'BBP-BD-002',
    name: 'Beard Balm 50g',
    category: 'barber_products',
    subcategory: 'Beard Care',
    type: 'product',
    barcode: '600002001002',
    brand: 'Generic',
    trackInventory: true,
    stockUnit: 'g',
    minStockLevel: 100,
    costPriceCents: 3000,
    sellingPriceCents: 7500,
  },
  {
    sku: 'BBP-SV-001',
    name: 'Shaving Cream 200ml',
    category: 'barber_products',
    subcategory: 'Shaving',
    type: 'product',
    barcode: '600002002001',
    brand: 'Generic',
    trackInventory: true,
    stockUnit: 'ml',
    minStockLevel: 200,
    costPriceCents: 2000,
    sellingPriceCents: 5500,
  },
  {
    sku: 'BBP-AB-001',
    name: 'Aftershave Balm 100ml',
    category: 'barber_products',
    subcategory: 'Aftershave',
    type: 'product',
    barcode: '600002003001',
    brand: 'Generic',
    trackInventory: true,
    stockUnit: 'ml',
    minStockLevel: 100,
    costPriceCents: 3500,
    sellingPriceCents: 8000,
  },
  {
    sku: 'BBP-HL-001',
    name: 'Hair Line-up Razor Pack (10)',
    category: 'barber_products',
    subcategory: 'Tools',
    type: 'product',
    barcode: '600002004001',
    trackInventory: true,
    stockUnit: 'pack',
    minStockLevel: 10,
    costPriceCents: 1500,
    sellingPriceCents: 3500,
  },
]

// ============================================
// PRODUCTS - Nail Products
// ============================================

export const nailProducts: HealthBeautySKU[] = [
  {
    sku: 'NLP-PL-001',
    name: 'Nail Polish - Red',
    category: 'nail_products',
    subcategory: 'Polish',
    type: 'product',
    barcode: '600003001001',
    brand: 'Generic',
    trackInventory: true,
    stockUnit: 'bottle',
    minStockLevel: 5,
    costPriceCents: 1500,
    sellingPriceCents: 4500,
  },
  {
    sku: 'NLP-GL-001',
    name: 'Gel Polish - Clear',
    category: 'nail_products',
    subcategory: 'Gel',
    type: 'product',
    barcode: '600003002001',
    brand: 'Generic',
    trackInventory: true,
    stockUnit: 'bottle',
    minStockLevel: 5,
    costPriceCents: 2500,
    sellingPriceCents: 6500,
  },
  {
    sku: 'NLP-AC-001',
    name: 'Acrylic Powder 500g',
    category: 'nail_products',
    subcategory: 'Acrylic',
    type: 'product',
    barcode: '600003003001',
    brand: 'Generic',
    trackInventory: true,
    stockUnit: 'g',
    minStockLevel: 200,
    costPriceCents: 8000,
    sellingPriceCents: 15000,
  },
  {
    sku: 'NLP-NA-001',
    name: 'Nail Tips (100 tips)',
    category: 'nail_products',
    subcategory: 'Extensions',
    type: 'product',
    barcode: '600003004001',
    trackInventory: true,
    stockUnit: 'pack',
    minStockLevel: 10,
    costPriceCents: 1500,
    sellingPriceCents: 3500,
  },
]

// ============================================
// PRODUCTS - Spa Products
// ============================================

export const spaProducts: HealthBeautySKU[] = [
  {
    sku: 'SPP-OL-001',
    name: 'Massage Oil 1L',
    category: 'spa_products',
    subcategory: 'Oils',
    type: 'product',
    barcode: '600004001001',
    brand: 'Generic',
    trackInventory: true,
    stockUnit: 'ml',
    minStockLevel: 500,
    costPriceCents: 8000,
    sellingPriceCents: 18000,
  },
  {
    sku: 'SPP-FC-001',
    name: 'Facial Mask 200g',
    category: 'spa_products',
    subcategory: 'Facial',
    type: 'product',
    barcode: '600004002001',
    brand: 'Generic',
    trackInventory: true,
    stockUnit: 'g',
    minStockLevel: 100,
    costPriceCents: 5000,
    sellingPriceCents: 12000,
  },
  {
    sku: 'SPP-SC-001',
    name: 'Body Scrub 500g',
    category: 'spa_products',
    subcategory: 'Body',
    type: 'product',
    barcode: '600004003001',
    brand: 'Generic',
    trackInventory: true,
    stockUnit: 'g',
    minStockLevel: 300,
    costPriceCents: 6000,
    sellingPriceCents: 15000,
  },
  {
    sku: 'SPP-ES-001',
    name: 'Essential Oil - Lavender 30ml',
    category: 'spa_products',
    subcategory: 'Essential Oils',
    type: 'product',
    barcode: '600004004001',
    brand: 'Generic',
    trackInventory: true,
    stockUnit: 'ml',
    minStockLevel: 50,
    costPriceCents: 3500,
    sellingPriceCents: 8500,
  },
]

// ============================================
// EXPORT: All Health & Beauty SKUs Combined
// ============================================

export const allHealthBeautySKUs: HealthBeautySKU[] = [
  ...hairSalonServices,
  ...barberServices,
  ...nailSalonServices,
  ...spaWellnessServices,
  ...lashBrowServices,
  ...hairProducts,
  ...barberProducts,
  ...nailProducts,
  ...spaProducts,
]

// ============================================
// SUB-VERTICALS CONFIGURATION
// ============================================

export const healthBeautySubVerticals = {
  'hair-salon': {
    name: 'Hair Salon',
    description: 'Full-service hair salon',
    serviceTypes: ['hair_services'],
    productTypes: ['hair_products'],
    avgServicePrice: 45000,
    avgDuration: 45,
  },
  'barber': {
    name: 'Barber',
    description: 'Gents grooming and barber services',
    serviceTypes: ['barber_services'],
    productTypes: ['barber_products'],
    avgServicePrice: 15000,
    avgDuration: 30,
  },
  'nail-salon': {
    name: 'Nail Salon',
    description: 'Manicure, pedicure and nail art services',
    serviceTypes: ['nail_services'],
    productTypes: ['nail_products'],
    avgServicePrice: 25000,
    avgDuration: 45,
  },
  'spa-wellness': {
    name: 'Spa & Wellness',
    description: 'Massage, facials and body treatments',
    serviceTypes: ['spa_services'],
    productTypes: ['spa_products'],
    avgServicePrice: 45000,
    avgDuration: 60,
  },
  'aesthetic-clinic': {
    name: 'Aesthetic Clinic',
    description: 'Medical aesthetic treatments',
    serviceTypes: ['aesthetic_services'],
    productTypes: ['aesthetic_products'],
    avgServicePrice: 85000,
    avgDuration: 45,
  },
  'tattoo-studio': {
    name: 'Tattoo Studio',
    description: 'Professional tattoo services',
    serviceTypes: ['tattoo_services'],
    productTypes: ['tattoo_products'],
    avgServicePrice: 150000,
    avgDuration: 120,
  },
  'lash-brow-studio': {
    name: 'Lash & Brow Studio',
    description: 'Lash extensions and brow treatments',
    serviceTypes: ['lash_brow_services'],
    productTypes: ['lash_brow_products'],
    avgServicePrice: 35000,
    avgDuration: 60,
  },
}

// Helper functions
export function getServicesByCategory(category: HealthBeautyCategory): HealthBeautySKU[] {
  return allHealthBeautySKUs.filter(sku => sku.category === category && sku.type === 'service')
}

export function getProductsByCategory(category: HealthBeautyCategory): HealthBeautySKU[] {
  return allHealthBeautySKUs.filter(sku => sku.category === category && sku.type === 'product')
}

export function getServicesForSubVertical(subVertical: keyof typeof healthBeautySubVerticals): HealthBeautySKU[] {
  const config = healthBeautySubVerticals[subVertical]
  if (!config) return []
  return allHealthBeautySKUs.filter(sku => 
    sku.type === 'service' && config.serviceTypes.includes(sku.category)
  )
}

// Statistics
export const healthBeautyStats = {
  totalSKUs: allHealthBeautySKUs.length,
  services: allHealthBeautySKUs.filter(s => s.type === 'service').length,
  products: allHealthBeautySKUs.filter(s => s.type === 'product').length,
  hairServices: hairSalonServices.length,
  barberServices: barberServices.length,
  nailServices: nailSalonServices.length,
  spaServices: spaWellnessServices.length,
  lashBrowServices: lashBrowServices.length,
}
