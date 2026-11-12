import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - List all recipes with F&B-specific filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const station = searchParams.get('station')
    const dietary = searchParams.get('dietary')
    const allergenFree = searchParams.get('allergenFree')
    const active = searchParams.get('active')

    const where: any = {}
    if (category && category !== 'all') {
      where.category = category
    }
    if (station && station !== 'all') {
      where.station = station
    }
    if (active !== null && active !== 'all') {
      where.active = active === 'true'
    }

    let recipes = await db.recipe.findMany({
      where,
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    // Filter by dietary preference
    if (dietary) {
      recipes = recipes.filter(r => {
        const recipeDietary = r.dietary ? JSON.parse(r.dietary) : []
        return recipeDietary.includes(dietary)
      })
    }

    // Filter by allergen-free
    if (allergenFree) {
      const allergensToAvoid = allergenFree.split(',')
      recipes = recipes.filter(r => {
        const recipeAllergens = r.allergens ? JSON.parse(r.allergens) : []
        return !allergensToAvoid.some(a => recipeAllergens.includes(a))
      })
    }

    return NextResponse.json(recipes.map(r => ({
      ...r,
      allergens: r.allergens ? JSON.parse(r.allergens) : [],
      dietary: r.dietary ? JSON.parse(r.dietary) : [],
      preparationSteps: r.preparationSteps ? JSON.parse(r.preparationSteps) : [],
      costPrice: r.ingredients.reduce((sum, i) => sum + i.cost, 0),
      margin: r.sellingPrice > 0 
        ? ((r.sellingPrice - r.ingredients.reduce((sum, i) => sum + i.cost, 0)) / r.sellingPrice) * 100 
        : 0,
      priceWithVAT: r.sellingPrice * 1.15,
    })))
  } catch (error) {
    console.error('Error fetching recipes:', error)
    return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 })
  }
}

// POST - Create a new recipe with F&B-specific validation
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

    // Validate allergens against SA list
    const validAllergens = ['milk', 'eggs', 'fish', 'shellfish', 'tree_nuts', 'peanuts', 'wheat', 'soy', 'sesame', 'sulphites']
    if (allergens && Array.isArray(allergens)) {
      const invalidAllergens = allergens.filter((a: string) => !validAllergens.includes(a))
      if (invalidAllergens.length > 0) {
        return NextResponse.json({ 
          error: `Invalid allergens: ${invalidAllergens.join(', ')}` 
        }, { status: 400 })
      }
    }

    // Validate dietary preferences
    const validDietary = ['vegetarian', 'vegan', 'gluten_free', 'halaal', 'kosher']
    if (dietary && Array.isArray(dietary)) {
      const invalidDietary = dietary.filter((d: string) => !validDietary.includes(d))
      if (invalidDietary.length > 0) {
        return NextResponse.json({ 
          error: `Invalid dietary preferences: ${invalidDietary.join(', ')}` 
        }, { status: 400 })
      }
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
        ingredients: ingredients ? {
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
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
    })
    
    return NextResponse.json({
      ...recipe,
      allergens: recipe.allergens ? JSON.parse(recipe.allergens) : [],
      dietary: recipe.dietary ? JSON.parse(recipe.dietary) : [],
      costPrice: recipe.ingredients.reduce((sum, i) => sum + i.cost, 0),
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating recipe:', error)
    return NextResponse.json({ error: 'Failed to create recipe' }, { status: 500 })
  }
}
