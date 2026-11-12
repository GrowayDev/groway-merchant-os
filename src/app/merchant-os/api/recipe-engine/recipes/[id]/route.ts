import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
}

// GET - Fetch a single recipe
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const recipe = await db.recipe.findUnique({
      where: { id },
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
    return NextResponse.json(recipe)
  } catch (error) {
    console.error('Error fetching recipe:', error)
    return NextResponse.json({ error: 'Failed to fetch recipe' }, { status: 500 })
  }
}

// PUT - Update a recipe
export async function PUT(request: NextRequest, { params }: Params) {
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

    const recipe = await db.recipe.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(category !== undefined && { category }),
        ...(description !== undefined && { description }),
        ...(preparationTime !== undefined && { preparationTime }),
        ...(yieldQty !== undefined && { yield: yieldQty }),
        ...(yieldUnit !== undefined && { yieldUnit }),
        ...(sellingPrice !== undefined && { sellingPrice }),
        ...(station !== undefined && { station }),
        ...(active !== undefined && { active }),
        ...(allergens !== undefined && { allergens: JSON.stringify(allergens) }),
        ...(dietary !== undefined && { dietary: JSON.stringify(dietary) }),
        ...(preparationSteps !== undefined && { preparationSteps: JSON.stringify(preparationSteps) }),
      },
      include: {
        RecipeIngredient: {
          include: {
            Ingredient: true,
          },
        },
      },
    })
    return NextResponse.json(recipe)
  } catch (error) {
    console.error('Error updating recipe:', error)
    return NextResponse.json({ error: 'Failed to update recipe' }, { status: 500 })
  }
}

// DELETE - Delete a recipe
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    // Delete related ingredients
    await db.recipeIngredient.deleteMany({
      where: { recipeId: id },
    })

    await db.recipe.delete({
      where: { id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting recipe:', error)
    return NextResponse.json({ error: 'Failed to delete recipe' }, { status: 500 })
  }
}
