import { NextRequest, NextResponse } from 'next/server'

// Types
interface BulkPricingTier {
  id: string
  name: string
  productCategory: string
  productId?: string
  productName?: string
  minQuantity: number
  maxQuantity: number | null
  discountType: 'percentage' | 'fixed'
  discountValue: number
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

// Sample data
let bulkPricingTiers: BulkPricingTier[] = [
  {
    id: 'bp1',
    name: 'Cement Bulk Discount',
    productCategory: 'Building Materials',
    minQuantity: 50,
    maxQuantity: 99,
    discountType: 'percentage',
    discountValue: 8,
    status: 'active',
    createdAt: '2025-10-15',
    updatedAt: '2026-01-20'
  },
  {
    id: 'bp2',
    name: 'Cement Large Order',
    productCategory: 'Building Materials',
    minQuantity: 100,
    maxQuantity: null,
    discountType: 'percentage',
    discountValue: 12,
    status: 'active',
    createdAt: '2025-10-15',
    updatedAt: '2026-01-20'
  },
  {
    id: 'bp3',
    name: 'Paint Contractor Special',
    productCategory: 'Paint & Finishes',
    minQuantity: 20,
    maxQuantity: 49,
    discountType: 'percentage',
    discountValue: 10,
    status: 'active',
    createdAt: '2025-11-01',
    updatedAt: '2025-11-01'
  },
  {
    id: 'bp4',
    name: 'Paint Bulk Order',
    productCategory: 'Paint & Finishes',
    minQuantity: 50,
    maxQuantity: null,
    discountType: 'percentage',
    discountValue: 15,
    status: 'active',
    createdAt: '2025-11-01',
    updatedAt: '2025-11-01'
  },
  {
    id: 'bp5',
    name: 'Piping Fixed Price',
    productCategory: 'Plumbing',
    productId: 'prod123',
    productName: 'PVC Pipe 110mm x 6m',
    minQuantity: 10,
    maxQuantity: null,
    discountType: 'fixed',
    discountValue: 89.99,
    status: 'active',
    createdAt: '2025-12-10',
    updatedAt: '2025-12-10'
  },
  {
    id: 'bp6',
    name: 'Electrical Cable Discount',
    productCategory: 'Electrical',
    minQuantity: 100,
    maxQuantity: 499,
    discountType: 'percentage',
    discountValue: 5,
    status: 'active',
    createdAt: '2026-01-05',
    updatedAt: '2026-01-05'
  },
  {
    id: 'bp7',
    name: 'Cable Mega Discount',
    productCategory: 'Electrical',
    minQuantity: 500,
    maxQuantity: null,
    discountType: 'percentage',
    discountValue: 10,
    status: 'active',
    createdAt: '2026-01-05',
    updatedAt: '2026-01-05'
  },
  {
    id: 'bp8',
    name: 'Roofing Special',
    productCategory: 'Roofing',
    minQuantity: 50,
    maxQuantity: null,
    discountType: 'percentage',
    discountValue: 7,
    status: 'inactive',
    createdAt: '2025-09-20',
    updatedAt: '2026-02-01'
  }
]

// Product categories for hardware
const productCategories = [
  'Building Materials',
  'Paint & Finishes',
  'Plumbing',
  'Electrical',
  'Roofing',
  'Tools & Equipment',
  'Hardware & Fixings',
  'Timber & Board',
  'Adhesives & Sealants',
  'Safety Equipment'
]

// GET - List all bulk pricing tiers
export async function GET() {
  return NextResponse.json({
    success: true,
    data: bulkPricingTiers,
    categories: productCategories,
    stats: {
      total: bulkPricingTiers.length,
      active: bulkPricingTiers.filter(t => t.status === 'active').length,
      inactive: bulkPricingTiers.filter(t => t.status === 'inactive').length,
      byCategory: productCategories.map(cat => ({
        category: cat,
        count: bulkPricingTiers.filter(t => t.productCategory === cat).length
      }))
    }
  })
}

// POST - Create new bulk pricing tier
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const newTier: BulkPricingTier = {
      id: `bp${Date.now()}`,
      name: body.name,
      productCategory: body.productCategory,
      productId: body.productId,
      productName: body.productName,
      minQuantity: body.minQuantity,
      maxQuantity: body.maxQuantity || null,
      discountType: body.discountType || 'percentage',
      discountValue: body.discountValue,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    }
    
    bulkPricingTiers.push(newTier)
    
    return NextResponse.json({
      success: true,
      data: newTier,
      message: 'Bulk pricing tier created successfully'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create bulk pricing tier' },
      { status: 400 }
    )
  }
}
