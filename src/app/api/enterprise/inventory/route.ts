import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - List all inventory
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const category = searchParams.get('category')
    const lowStock = searchParams.get('lowStock')
    
    const where: Record<string, unknown> = {}
    if (merchantId) where.merchantId = merchantId
    if (category) where.category = category
    
    const inventory = await db.enterpriseInventory.findMany({
      where,
      include: {
        merchant: {
          select: { id: true, name: true, location: true, corporate: { select: { id: true, name: true } } }
        }
      },
      orderBy: { name: 'asc' }
    })
    
    // Filter by low stock if requested
    let filteredInventory = inventory
    if (lowStock === 'true') {
      filteredInventory = inventory.filter(item => item.stock <= item.lowStock)
    }
    
    return NextResponse.json({ inventory: filteredInventory })
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
  }
}

// POST - Create new inventory item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      merchantId,
      sku,
      name,
      category,
      stock = 0,
      unit = 'units',
      lowStock = 0,
      value = 0,
      costPrice = 0,
      sellingPrice,
      reorderPoint = 0,
      reorderQty = 0,
      supplier,
      notes
    } = body

    const item = await db.enterpriseInventory.create({
      data: {
        sku,
        name,
        merchantId,
        category,
        stock: parseFloat(stock) || 0,
        unit,
        lowStock: parseFloat(lowStock) || 0,
        value: parseFloat(value) || 0,
        costPrice: parseFloat(costPrice) || 0,
        sellingPrice: sellingPrice ? parseFloat(sellingPrice) : null,
        reorderPoint: parseFloat(reorderPoint) || 0,
        reorderQty: parseFloat(reorderQty) || 0,
        supplier,
        notes
      },
      include: {
        merchant: true
      }
    })

    return NextResponse.json({ item })
  } catch (error) {
    console.error('Error creating inventory item:', error)
    return NextResponse.json({ error: 'Failed to create inventory item' }, { status: 500 })
  }
}
