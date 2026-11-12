import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPermission } from '@/lib/permissions'
import { RecipeInventoryService } from '@/services/inventory/recipe-inventory-service'

/**
 * POST /api/inventory/recipe-deduction
 * Deduct ingredients from inventory when a recipe/dish is sold
 * 
 * Body:
 * - recipeId: required
 * - quantity: required (number of servings)
 * - merchantId: required
 * - branchId: required
 * - referenceType: required (sale, adjustment, waste)
 * - referenceId: required (transaction ID)
 * - referenceNumber: optional
 */
export async function POST(request: NextRequest) {
  const permissionCheck = await checkPermission(request, 'can_process_sales')
  
  if (!permissionCheck.allowed) {
    return permissionCheck.error
  }

  const session = permissionCheck.session!

  try {
    const body = await request.json()
    const {
      recipeId,
      quantity,
      merchantId,
      branchId,
      referenceType,
      referenceId,
      referenceNumber,
    } = body

    if (!recipeId || !quantity || !merchantId || !branchId || !referenceId) {
      return NextResponse.json(
        { error: 'Missing required fields: recipeId, quantity, merchantId, branchId, referenceId' },
        { status: 400 }
      )
    }

    const result = await RecipeInventoryService.deductRecipeIngredients({
      recipeId,
      merchantId,
      branchId,
      quantity: parseFloat(quantity),
      referenceType: referenceType || 'sale',
      referenceId,
      referenceNumber,
      performedBy: session.userId,
      performedByName: session.user?.name || 'System',
      idempotencyKey: `recipe-${recipeId}-ref-${referenceId}`,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Recipe deduction failed' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Recipe ingredients deducted successfully',
      data: result,
    })
  } catch (error) {
    console.error('Recipe deduction error:', error)
    return NextResponse.json(
      { error: 'Failed to process recipe deduction', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/inventory/recipe-deduction
 * Get recipe COGS and ingredient costs
 * 
 * Query params:
 * - recipeId: required
 * - merchantId: required
 * - branchId: required
 */
export async function GET(request: NextRequest) {
  const permissionCheck = await checkPermission(request, 'can_view_inventory')
  
  if (!permissionCheck.allowed) {
    return permissionCheck.error
  }

  try {
    const { searchParams } = new URL(request.url)
    const recipeId = searchParams.get('recipeId')
    const merchantId = searchParams.get('merchantId')
    const branchId = searchParams.get('branchId')

    if (!recipeId || !merchantId || !branchId) {
      return NextResponse.json(
        { error: 'Missing required params: recipeId, merchantId, branchId' },
        { status: 400 }
      )
    }

    const cogs = await RecipeInventoryService.getRecipeCOGS(recipeId, merchantId, branchId)

    return NextResponse.json({
      success: true,
      data: cogs,
    })
  } catch (error) {
    console.error('Get recipe COGS error:', error)
    return NextResponse.json(
      { error: 'Failed to get recipe COGS', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
