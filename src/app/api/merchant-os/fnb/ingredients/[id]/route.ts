import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get ingredient details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        deductions: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            recipe: true,
          },
        },
      },
    })

    if (!ingredient) {
      return NextResponse.json({ error: 'Ingredient not found' }, { status: 404 })
    }

    // Calculate usage statistics
    const totalUsed = ingredient.deductions.reduce((sum, d) => sum + d.quantity, 0)
    const usageLast30Days = ingredient.deductions
      .filter(d => {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        return new Date(d.createdAt) >= thirtyDaysAgo
      })
      .reduce((sum, d) => sum + d.quantity, 0)

    return NextResponse.json({
      ...ingredient,
      stockStatus: ingredient.currentStock <= 0 ? 'out_of_stock' :
        ingredient.currentStock <= ingredient.reorderPoint ? 'low' : 'in_stock',
      stockValue: ingredient.currentStock * ingredient.costPerUnit,
      usageStats: {
        totalUsed,
        usageLast30Days,
        averageDailyUsage: usageLast30Days / 30,
        daysOfStockRemaining: usageLast30Days > 0
          ? Math.floor(ingredient.currentStock / (usageLast30Days / 30))
          : null,
      },
      usedInRecipes: ingredient.recipeItems.map(ri => ({
        recipeId: ri.recipeId,
        recipeName: ri.recipe.name,
        quantity: ri.quantity,
        unit: ri.unit,
        cost: ri.cost,
      })),
    })
  } catch (error) {
    console.error('Error fetching ingredient:', error)
    return NextResponse.json({ error: 'Failed to fetch ingredient' }, { status: 500 })
  }
}

// PATCH - Update ingredient stock
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { currentStock, costPerUnit, reorderPoint, location, adjustmentReason } = body

    const updateData: any = {}
    if (currentStock !== undefined) updateData.currentStock = currentStock
    if (costPerUnit !== undefined) updateData.costPerUnit = costPerUnit
    if (reorderPoint !== undefined) updateData.reorderPoint = reorderPoint
    if (location !== undefined) updateData.location = location

    const ingredient = await db.ingredient.update({
      where: { id },
      data: updateData,
    })

    // In production, would log the adjustment with reason

    return NextResponse.json({
      ...ingredient,
      stockStatus: ingredient.currentStock <= 0 ? 'out_of_stock' :
        ingredient.currentStock <= ingredient.reorderPoint ? 'low' : 'in_stock',
      stockValue: ingredient.currentStock * ingredient.costPerUnit,
    })
  } catch (error) {
    console.error('Error updating ingredient:', error)
    return NextResponse.json({ error: 'Failed to update ingredient' }, { status: 500 })
  }
}

// DELETE - Delete ingredient
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if ingredient is used in any recipes
    const recipeUsage = await db.recipeIngredient.count({
      where: { ingredientId: id },
    })

    if (recipeUsage > 0) {
      return NextResponse.json({
        error: 'Cannot delete ingredient that is used in recipes',
        recipeCount: recipeUsage,
      }, { status: 400 })
    }

    await db.ingredient.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Ingredient deleted' })
  } catch (error) {
    console.error('Error deleting ingredient:', error)
    return NextResponse.json({ error: 'Failed to delete ingredient' }, { status: 500 })
  }
}
