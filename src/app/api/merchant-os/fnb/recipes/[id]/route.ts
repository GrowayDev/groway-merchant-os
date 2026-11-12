import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get recipe details with ingredients
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const recipe = await db.recipe.findUnique({
      where: { id },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
        deductions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            ingredient: true,
          },
        },
      },
    })

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
    }

    const costPrice = recipe.ingredients.reduce((sum, i) => sum + i.cost, 0)
    const margin = recipe.sellingPrice > 0
      ? ((recipe.sellingPrice - costPrice) / recipe.sellingPrice) * 100
      : 0

    return NextResponse.json({
      ...recipe,
      allergens: recipe.allergens ? JSON.parse(recipe.allergens) : [],
      dietary: recipe.dietary ? JSON.parse(recipe.dietary) : [],
      preparationSteps: recipe.preparationSteps ? JSON.parse(recipe.preparationSteps) : [],
      costPrice,
      margin,
      priceWithVAT: recipe.sellingPrice * 1.15,
      vatAmount: recipe.sellingPrice * 0.15,
      profitPerServing: recipe.sellingPrice - costPrice,
      // Stock availability check
      canPrepare: recipe.ingredients.every(i =>
        i.ingredient && i.ingredient.currentStock >= i.quantity
      ),
      ingredientAvailability: recipe.ingredients.map(i => ({
        ingredientId: i.ingredientId,
        name: i.ingredient?.name || 'Unknown',
        required: i.quantity,
        available: i.ingredient?.currentStock || 0,
        unit: i.unit,
        sufficient: (i.ingredient?.currentStock || 0) >= i.quantity,
      })),
    })
  } catch (error) {
    console.error('Error fetching recipe:', error)
    return NextResponse.json({ error: 'Failed to fetch recipe' }, { status: 500 })
  }
}

// PUT - Update recipe
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const {
      name,
      category,
      description,
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

    // Update recipe
    const recipe = await db.recipe.update({
      where: { id },
      data: {
        name,
        category,
        description,
        preparationTime,
        yield: yieldQty,
        yieldUnit,
        sellingPrice,
        station,
        active,
        allergens: allergens ? JSON.stringify(allergens) : null,
        dietary: dietary ? JSON.stringify(dietary) : null,
        preparationSteps: preparationSteps ? JSON.stringify(preparationSteps) : null,
      },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
    })

    // Update ingredients if provided
    if (ingredients) {
      // Delete existing ingredients
      await db.recipeIngredient.deleteMany({
        where: { recipeId: id },
      })

      // Create new ingredients
      await db.recipeIngredient.createMany({
        data: ingredients.map((ing: any) => ({
          recipeId: id,
          ingredientId: ing.ingredientId,
          quantity: ing.quantity,
          unit: ing.unit,
          cost: ing.cost,
          optional: ing.optional || false,
          substitute: ing.substitute,
        })),
      })
    }

    return NextResponse.json({
      ...recipe,
      allergens: recipe.allergens ? JSON.parse(recipe.allergens) : [],
      dietary: recipe.dietary ? JSON.parse(recipe.dietary) : [],
    })
  } catch (error) {
    console.error('Error updating recipe:', error)
    return NextResponse.json({ error: 'Failed to update recipe' }, { status: 500 })
  }
}

// DELETE - Delete recipe
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if recipe has deductions
    const deductions = await db.stockDeduction.count({
      where: { recipeId: id },
    })

    if (deductions > 0) {
      // Soft delete - just deactivate
      await db.recipe.update({
        where: { id },
        data: { active: false },
      })
      return NextResponse.json({ message: 'Recipe deactivated (has deduction history)' })
    }

    await db.recipe.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Recipe deleted' })
  } catch (error) {
    console.error('Error deleting recipe:', error)
    return NextResponse.json({ error: 'Failed to delete recipe' }, { status: 500 })
  }
}
