import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
}

// GET - Fetch a single ingredient
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const ingredient = await db.ingredient.findUnique({
      where: { id },
      include: {
        recipeItems: {
          include: {
            recipe: true,
          },
        },
      },
    })
    
    if (!ingredient) {
      return NextResponse.json({ error: 'Ingredient not found' }, { status: 404 })
    }
    return NextResponse.json(ingredient)
  } catch (error) {
    console.error('Error fetching ingredient:', error)
    return NextResponse.json({ error: 'Failed to fetch ingredient' }, { status: 500 })
  }
}

// PUT - Update an ingredient
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const { 
      name, 
      category, 
      currentStock, 
      unit, 
      costPerUnit, 
      reorderPoint, 
      location 
    } = body

    const ingredient = await db.ingredient.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(category !== undefined && { category }),
        ...(currentStock !== undefined && { currentStock }),
        ...(unit !== undefined && { unit }),
        ...(costPerUnit !== undefined && { costPerUnit }),
        ...(reorderPoint !== undefined && { reorderPoint }),
        ...(location !== undefined && { location }),
      },
    })
    return NextResponse.json(ingredient)
  } catch (error) {
    console.error('Error updating ingredient:', error)
    return NextResponse.json({ error: 'Failed to update ingredient' }, { status: 500 })
  }
}

// DELETE - Delete an ingredient
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    // Check if ingredient is used in any recipes
    const recipeItems = await db.recipeIngredient.findMany({
      where: { ingredientId: id },
      include: { recipe: true },
    })

    if (recipeItems.length > 0) {
      return NextResponse.json({ 
        error: `Cannot delete. Used in ${recipeItems.length} recipes.` 
      }, { status: 400 })
    }

    await db.ingredient.delete({
      where: { id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting ingredient:', error)
    return NextResponse.json({ error: 'Failed to delete ingredient' }, { status: 500 })
  }
}
