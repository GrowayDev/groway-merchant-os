import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Fetch all recipes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const active = searchParams.get('active')

    const where: any = {}
    if (category && category !== 'all') {
      where.category = category
    }
    if (active !== null && active !== 'all') {
      where.active = active === 'true'
    }

    const recipes = await db.recipe.findMany({
      where,
      include: {
        RecipeIngredient: {
          include: {
            Ingredient: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(recipes)
  } catch (error) {
    console.error('Error fetching recipes:', error)
    return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 })
  }
}

// POST - Create a new recipe
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      name, 
      category, 
      description, 
      sku, 
      preparationTime, 
      yield: yieldQty, 
      yieldUnit, 
      sellingPrice, 
      station, 
      active, 
      allergens, 
      dietary, 
      preparationSteps,
      ingredients 
    } = body

    if (!name || !sku) {
      return NextResponse.json({ error: 'Recipe name and SKU are required' }, { status: 400 })
    }

    // Check if SKU already exists
    const existingRecipe = await db.recipe.findUnique({
      where: { sku },
    })
    if (existingRecipe) {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 400 })
    }

    const recipe = await db.recipe.create({
      data: {
        name,
        category: category || 'mains',
        description,
        sku,
        preparationTime: preparationTime || 15,
        yield: yieldQty || 1,
        yieldUnit: yieldUnit || 'serving',
        sellingPrice: sellingPrice || 0,
        station: station || 'grill',
        active: active ?? true,
        allergens: allergens ? JSON.stringify(allergens) : null,
        dietary: dietary ? JSON.stringify(dietary) : null,
        preparationSteps: preparationSteps ? JSON.stringify(preparationSteps) : null,
        RecipeIngredient: ingredients ? {
          create: ingredients.map((ing: any) => ({
            ingredientId: ing.ingredientId,
            quantity: ing.quantity,
            unit: ing.unit,
            cost: ing.cost,
            optional: ing.optional || false,
            substitute: ing.substitute,
          }))
        } : undefined,
      },
      include: {
        RecipeIngredient: {
          include: {
            Ingredient: true,
          },
        },
      },
    })
    return NextResponse.json(recipe, { status: 201 })
  } catch (error) {
    console.error('Error creating recipe:', error)
    return NextResponse.json({ error: 'Failed to create recipe' }, { status: 500 })
  }
}
