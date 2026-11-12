import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Fetch all stock deductions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const recipeId = searchParams.get('recipeId')
    const ingredientId = searchParams.get('ingredientId')

    const where: any = {}
    if (recipeId) {
      where.recipeId = recipeId
    }
    if (ingredientId) {
      where.ingredientId = ingredientId
    }

    const deductions = await db.stockDeduction.findMany({
      where,
      include: {
        Recipe: true,
        Ingredient: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(deductions)
  } catch (error) {
    console.error('Error fetching stock deductions:', error)
    return NextResponse.json({ error: 'Failed to fetch stock deductions' }, { status: 500 })
  }
}

// POST - Create a stock deduction (simulate selling a recipe)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recipeId, quantity, orderId } = body

    if (!recipeId) {
      return NextResponse.json({ error: 'Recipe ID is required' }, { status: 400 })
    }

    // Get the recipe with ingredients
    const recipe = await db.recipe.findUnique({
      where: { id: recipeId },
      include: {
        RecipeIngredient: {
          include: {
            Ingredient: true,
          },
        },
      },
    })

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
    }

    const qty = quantity || 1
    const insufficientStock: string[] = []

    // Check if all ingredients have sufficient stock
    for (const ing of recipe.RecipeIngredient) {
      const ingredient = ing.Ingredient
      if (ingredient.currentStock < ing.quantity * qty) {
        insufficientStock.push(
          `${ingredient.name} (short by ${ing.quantity * qty - ingredient.currentStock} ${ing.unit})`
        )
      }
    }

    if (insufficientStock.length > 0) {
      return NextResponse.json({ 
        error: `Insufficient stock:\n${insufficientStock.join('\n')}` 
      }, { status: 400 })
    }

    // Deduct stock for each ingredient
    const deductions = []
    for (const ing of recipe.RecipeIngredient) {
      // Update ingredient stock
      await db.ingredient.update({
        where: { id: ing.ingredientId },
        data: {
          currentStock: {
            decrement: ing.quantity * qty,
          },
        },
      })

      // Create deduction record
      const deduction = await db.stockDeduction.create({
        data: {
          recipeId: recipe.id,
          ingredientId: ing.ingredientId,
          quantity: ing.quantity * qty,
          unit: ing.unit,
          cost: ing.cost * qty,
          orderId: orderId || `ORD-${Date.now().toString().slice(-6)}`,
        },
        include: {
          Recipe: true,
          Ingredient: true,
        },
      })
      deductions.push(deduction)
    }

    // Update recipe stats
    await db.recipe.update({
      where: { id: recipeId },
      data: {
        timesSold: { increment: qty },
        deductionsLast30Days: { increment: recipe.sellingPrice * qty },
      },
    })

    return NextResponse.json(deductions, { status: 201 })
  } catch (error) {
    console.error('Error creating stock deduction:', error)
    return NextResponse.json({ error: 'Failed to create stock deduction' }, { status: 500 })
  }
}
