import { NextRequest, NextResponse } from 'next/server'

// Sample data (in a real app, this would come from a database)
let bulkPricingTiers = [
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

// GET - Get single bulk pricing tier
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const tier = bulkPricingTiers.find(t => t.id === id)
  
  if (!tier) {
    return NextResponse.json(
      { success: false, error: 'Bulk pricing tier not found' },
      { status: 404 }
    )
  }
  
  return NextResponse.json({
    success: true,
    data: tier
  })
}

// PUT - Update bulk pricing tier
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const index = bulkPricingTiers.findIndex(t => t.id === id)
    
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: 'Bulk pricing tier not found' },
        { status: 404 }
      )
    }
    
    bulkPricingTiers[index] = {
      ...bulkPricingTiers[index],
      ...body,
      updatedAt: new Date().toISOString().split('T')[0]
    }
    
    return NextResponse.json({
      success: true,
      data: bulkPricingTiers[index],
      message: 'Bulk pricing tier updated successfully'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update bulk pricing tier' },
      { status: 400 }
    )
  }
}

// DELETE - Delete bulk pricing tier
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const index = bulkPricingTiers.findIndex(t => t.id === id)
    
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: 'Bulk pricing tier not found' },
        { status: 404 }
      )
    }
    
    bulkPricingTiers.splice(index, 1)
    
    return NextResponse.json({
      success: true,
      message: 'Bulk pricing tier deleted successfully'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete bulk pricing tier' },
      { status: 400 }
    )
  }
}
