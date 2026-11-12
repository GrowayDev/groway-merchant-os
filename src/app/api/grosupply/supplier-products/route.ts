import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { products as catalogProducts } from '@/lib/merchant-os-data'

// GET /api/grosupply/supplier-products - List supplier products with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get('supplierId')
    const vertical = searchParams.get('vertical')
    const subVertical = searchParams.get('subVertical')
    const sku = searchParams.get('sku')
    const limit = parseInt(searchParams.get('limit') || '200')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: Record<string, unknown> = {}
    
    if (supplierId) {
      where.supplierId = supplierId
    }
    
    if (vertical && vertical !== 'all') {
      where.vertical = vertical
    }
    
    if (subVertical && subVertical !== 'all') {
      where.subVertical = subVertical
    }
    
    if (sku) {
      where.sku = { contains: sku }
    }

    // Check if we have any supplier products, if not seed from catalog
    const existingCount = await db.supplierProduct.count()
    
    if (existingCount === 0) {
      // Auto-seed supplier products from catalog
      await seedSupplierProducts()
    }

    const [supplierProducts, total] = await Promise.all([
      db.supplierProduct.findMany({
        where,
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              tier: true,
              deliveryDays: true
            }
          }
        },
        orderBy: [
          { isPrimary: 'desc' },
          { costPrice: 'asc' }
        ],
        take: limit,
        skip: offset
      }),
      db.supplierProduct.count({ where })
    ])

    return NextResponse.json({
      products: supplierProducts,
      total,
      limit,
      offset
    })
  } catch (error) {
    console.error('Error fetching supplier products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch supplier products' },
      { status: 500 }
    )
  }
}

// POST /api/grosupply/supplier-products - Create a new supplier product mapping
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const supplierProduct = await db.supplierProduct.create({
      data: {
        supplierId: data.supplierId,
        sku: data.sku,
        skuName: data.skuName,
        category: data.category,
        vertical: data.vertical,
        subVertical: data.subVertical,
        costPrice: data.costPrice,
        leadDays: data.leadDays,
        minOrderQty: data.minOrderQty,
        isPrimary: data.isPrimary || false,
        inStock: data.inStock ?? true
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            tier: true
          }
        }
      }
    })

    return NextResponse.json({ product: supplierProduct }, { status: 201 })
  } catch (error) {
    console.error('Error creating supplier product:', error)
    return NextResponse.json(
      { error: 'Failed to create supplier product' },
      { status: 500 }
    )
  }
}

// Helper function to seed supplier products from catalog
async function seedSupplierProducts() {
  // Get all suppliers
  const suppliers = await db.supplier.findMany({
    where: { status: 'active' }
  })
  
  if (suppliers.length === 0) return
  
  // Map suppliers by their verticals
  const supplierByVertical: Record<string, typeof suppliers> = {}
  
  for (const supplier of suppliers) {
    const verticals = supplier.verticals ? JSON.parse(supplier.verticals) : []
    for (const v of verticals) {
      if (!supplierByVertical[v]) supplierByVertical[v] = []
      supplierByVertical[v].push(supplier)
    }
  }
  
  // Create supplier products for each catalog product
  const supplierProducts: Array<{
    supplierId: string
    sku: string
    skuName: string
    category: string
    vertical: string
    subVertical: string
    costPrice: number
    leadDays: number
    minOrderQty: number
    isPrimary: boolean
    inStock: boolean
  }> = []
  
  for (const product of catalogProducts) {
    // Find matching vertical
    const verticalName = getVerticalName(product.vertical)
    const matchingSuppliers = supplierByVertical[verticalName] || []
    
    if (matchingSuppliers.length > 0) {
      // Assign 1-3 random suppliers for each product
      const numSuppliers = Math.min(Math.floor(Math.random() * 3) + 1, matchingSuppliers.length)
      const shuffled = matchingSuppliers.sort(() => Math.random() - 0.5)
      
      for (let i = 0; i < numSuppliers; i++) {
        const supplier = shuffled[i]
        const costModifier = 0.8 + Math.random() * 0.4 // 80% - 120% of cost
        
        supplierProducts.push({
          supplierId: supplier.id,
          sku: product.sku,
          skuName: product.name,
          category: product.category,
          vertical: verticalName,
          subVertical: getSubVerticalName(product.subVertical),
          costPrice: Math.round(product.costPrice * costModifier) / 100,
          leadDays: supplier.deliveryDays + Math.floor(Math.random() * 3),
          minOrderQty: Math.max(1, Math.floor(Math.random() * 10)),
          isPrimary: i === 0,
          inStock: Math.random() > 0.1 // 90% in stock
        })
      }
    }
  }
  
  // Batch insert
  if (supplierProducts.length > 0) {
    await db.supplierProduct.createMany({
      data: supplierProducts,
      skipDuplicates: true
    })
    console.log(`Seeded ${supplierProducts.length} supplier products`)
  }
}

function getVerticalName(code: string): string {
  const mapping: Record<string, string> = {
    'food-beverage': 'Food & Beverage',
    'liquor-nightlife': 'Liquor & Nightlife',
    'grocery-fmcg': 'Grocery & FMCG',
    'health-beauty': 'Health & Beauty',
    'fashion-apparel': 'Fashion & Apparel',
    'health-pharmacy': 'Health & Pharmacy',
    'hospitality': 'Hospitality',
    'hardware-building': 'Hardware & Building',
    'electronics-tech': 'Electronics & Tech',
    'sport-leisure': 'Sport & Leisure',
    'childcare-education': 'Childcare & Education',
    'professional-services': 'Professional Services'
  }
  return mapping[code] || code
}

function getSubVerticalName(code: string): string {
  const mapping: Record<string, string> = {
    'qsr': 'Quick Service Restaurant',
    'sit-down': 'Sit-Down Restaurant',
    'shisa-nyama': 'Shisa Nyama',
    'tavern': 'Tavern',
    'coffee-shop': 'Coffee & Tea',
    'bakery': 'Bakery',
    'food-truck': 'Food Truck',
    'catering': 'Catering',
    'liquor-store': 'Liquor Store',
    'bar-pub': 'Bar & Pub',
    'nightclub': 'Nightclub',
    'shebeen': 'Shebeen',
    'bottle-store': 'Bottle Store',
    'wine-farm': 'Wine Farm',
    'superette': 'Superette',
    'spaza-shop': 'Spaza Shop',
    'butchery': 'Butchery',
    'deli': 'Deli',
    'farm-stall': 'Farm Stall',
    'cash-carry': 'Cash & Carry',
    'bakery-retail': 'Bakery Retail',
    'hair-salon': 'Hair Salon',
    'barber': 'Barber Shop',
    'nail-salon': 'Nail Salon',
    'spa-wellness': 'Spa & Wellness',
    'aesthetic-clinic': 'Aesthetic Clinic',
    'tattoo-studio': 'Tattoo Studio',
    'lash-brow': 'Lash & Brow',
    'clothing-boutique': 'Clothing Boutique',
    'shoe-store': 'Shoe Store',
    'accessories': 'Accessories',
    'uniform-supplier': 'Uniform Supplier',
    'thrift': 'Second-hand',
    'tailor': 'Tailor',
    'pharmacy': 'Full Pharmacy',
    'health-shop': 'Health Shop',
    'traditional-medicine': 'Traditional Medicine',
    'optometry': 'Optometry',
    'dentistry': 'Dentistry',
    'veterinary': 'Veterinary',
    'hotel': 'Hotel',
    'guest-house': 'Guest House',
    'b-and-b': 'B&B',
    'backpackers': 'Backpackers',
    'lodge': 'Lodge',
    'self-catering': 'Self-Catering',
    'airbnb': 'Airbnb-style',
    'hardware-store': 'Hardware Store',
    'building-supplies': 'Building Supplies',
    'paint-shop': 'Paint Shop',
    'plumbing': 'Plumbing',
    'electrical': 'Electrical',
    'agri-supply': 'Agri-Supply',
    'phone-store': 'Phone & Accessories',
    'computer-it': 'Computer & IT',
    'electronics-retail': 'Electronics Retail',
    'repair-workshop': 'Repair Workshop',
    'gym': 'Gym',
    'fitness-studio': 'Fitness Studio',
    'sports-club': 'Sports Club',
    'events-venue': 'Events Venue',
    'entertainment': 'Entertainment Centre',
    'escape-room': 'Escape Room',
    'creche': 'Crèche',
    'after-school': 'After-School Care',
    'tutoring': 'Tutoring',
    'driving-school': 'Driving School',
    'skills-training': 'Skills Training',
    'auto-repair': 'Auto Repair',
    'dry-cleaning': 'Dry Cleaning',
    'funeral-home': 'Funeral Home',
    'legal-services': 'Legal Services',
    'accounting': 'Accounting',
    'tutoring-school': 'Tutoring School'
  }
  return mapping[code] || code
}
