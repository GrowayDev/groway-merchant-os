import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - List all ingredients with stock levels
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const lowStock = searchParams.get('lowStock')
    const location = searchParams.get('location')

    const where: any = {}
    if (category && category !== 'all') {
      where.category = category
    }
    if (location && location !== 'all') {
      where.location = location
    }
    if (lowStock === 'true') {
      // Get all ingredients and filter in JS for low stock
      const allIngredients = await db.ingredient.findMany({
        where: { ...where },
        orderBy: { name: 'asc' },
      })
      const lowStockIngredients = allIngredients.filter(i => i.currentStock <= i.reorderPoint)
      return NextResponse.json(lowStockIngredients.map(i => ({
        ...i,
        stockStatus: i.currentStock <= 0 ? 'out_of_stock' :
          i.currentStock <= i.reorderPoint ? 'low' : 'in_stock',
        stockValue: i.currentStock * i.costPerUnit,
      })))
    }

    const ingredients = await db.ingredient.findMany({
      where,
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(ingredients.map(i => ({
      ...i,
      stockStatus: i.currentStock <= 0 ? 'out_of_stock' :
        i.currentStock <= i.reorderPoint ? 'low' : 'in_stock',
      stockValue: i.currentStock * i.costPerUnit,
    })))
  } catch (error) {
    console.error('Error fetching ingredients:', error)
    return NextResponse.json({ error: 'Failed to fetch ingredients' }, { status: 500 })
  }
}

// POST - Add new ingredient
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
      location,
      allergens, // Array of allergen IDs this ingredient contains
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

    return NextResponse.json({
      ...ingredient,
      stockStatus: ingredient.currentStock <= 0 ? 'out_of_stock' :
        ingredient.currentStock <= ingredient.reorderPoint ? 'low' : 'in_stock',
      stockValue: ingredient.currentStock * ingredient.costPerUnit,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating ingredient:', error)
    return NextResponse.json({ error: 'Failed to create ingredient' }, { status: 500 })
  }
}
