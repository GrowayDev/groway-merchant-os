import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Fetch all ingredients
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const lowStock = searchParams.get('lowStock')

    const where: any = {}
    if (category && category !== 'all') {
      where.category = category
    }
    if (lowStock === 'true') {
      // Filter for low stock items (currentStock <= reorderPoint)
      const allIngredients = await db.ingredient.findMany()
      const lowStockIds = allIngredients
        .filter(i => i.currentStock <= i.reorderPoint)
        .map(i => i.id)
      where.id = { in: lowStockIds }
    }

    const ingredients = await db.ingredient.findMany({
      where,
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(ingredients)
  } catch (error) {
    console.error('Error fetching ingredients:', error)
    return NextResponse.json({ error: 'Failed to fetch ingredients' }, { status: 500 })
  }
}

// POST - Create a new ingredient
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      name, 
      sku, 
      category, 
      currentStock, 
      unit, 
      costPerUnit, 
      reorderPoint, 
      location 
    } = body

    if (!name || !sku) {
      return NextResponse.json({ error: 'Ingredient name and SKU are required' }, { status: 400 })
    }

    // Check if SKU already exists
    const existingIngredient = await db.ingredient.findUnique({
      where: { sku },
    })
    if (existingIngredient) {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 400 })
    }

    const ingredient = await db.ingredient.create({
      data: {
        name,
        sku,
        category: category || 'Other',
        currentStock: currentStock || 0,
        unit: unit || 'g',
        costPerUnit: costPerUnit || 0,
        reorderPoint: reorderPoint || 0,
        location,
      },
    })
    return NextResponse.json(ingredient, { status: 201 })
  } catch (error) {
    console.error('Error creating ingredient:', error)
    return NextResponse.json({ error: 'Failed to create ingredient' }, { status: 500 })
  }
}
