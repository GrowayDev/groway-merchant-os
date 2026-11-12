import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get deduction history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const recipeId = searchParams.get('recipeId')
    const ingredientId = searchParams.get('ingredientId')
    const orderId = searchParams.get('orderId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const period = searchParams.get('period') // 'today', 'week', 'month'

    const where: any = {}
    if (recipeId) where.recipeId = recipeId
    if (ingredientId) where.ingredientId = ingredientId
    if (orderId) where.orderId = orderId

    // Date filtering
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    } else if (period) {
      const now = new Date()
      where.createdAt = {}
      switch (period) {
        case 'today':
          where.createdAt.gte = new Date(now.setHours(0, 0, 0, 0))
          break
        case 'week':
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          where.createdAt.gte = weekAgo
          break
        case 'month':
          const monthAgo = new Date()
          monthAgo.setMonth(monthAgo.getMonth() - 1)
          where.createdAt.gte = monthAgo
          break
      }
    }

    const deductions = await db.stockDeduction.findMany({
      where,
      include: {
        recipe: {
          select: { id: true, name: true, sku: true, category: true },
        },
        ingredient: {
          select: { id: true, name: true, unit: true, costPerUnit: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    // Summary statistics
    const totalCost = deductions.reduce((sum, d) => sum + d.cost, 0)
    const totalQuantity = deductions.length

    return NextResponse.json({
      deductions: deductions.map(d => ({
        ...d,
        costPerUnit: d.ingredient.costPerUnit,
      })),
      summary: {
        totalDeductions: totalQuantity,
        totalCost,
        averageCostPerDeduction: totalQuantity > 0 ? totalCost / totalQuantity : 0,
      },
    })
  } catch (error) {
    console.error('Error fetching deductions:', error)
    return NextResponse.json({ error: 'Failed to fetch deductions' }, { status: 500 })
  }
}

// POST - Trigger a stock deduction (sale or manual adjustment)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recipeId, quantity, orderId, type = 'sale', notes } = body

    if (!recipeId) {
      return NextResponse.json({ error: 'Recipe ID is required' }, { status: 400 })
    }

    // Get the recipe with ingredients
    const recipe = await db.recipe.findUnique({
      where: { id: recipeId },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
    })

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
    }

    const qty = quantity || 1
    const insufficientStock: string[] = []

    // Check stock availability
    for (const ing of recipe.ingredients) {
      if (!ing.ingredient) continue
      if (ing.ingredient.currentStock < ing.quantity * qty) {
        insufficientStock.push(
          `${ing.ingredient.name} (need ${ing.quantity * qty} ${ing.unit}, have ${ing.ingredient.currentStock} ${ing.ingredient.unit})`
        )
      }
    }

    if (insufficientStock.length > 0) {
      return NextResponse.json({
        error: 'Insufficient stock',
        details: insufficientStock,
      }, { status: 400 })
    }

    // Process deductions
    const deductions: any[] = []
    for (const ing of recipe.ingredients) {
      if (!ing.ingredient) continue

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
          recipe: true,
          ingredient: true,
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

    return NextResponse.json({
      success: true,
      deductions,
      summary: {
        recipeName: recipe.name,
        quantity: qty,
        totalCost: deductions.reduce((sum, d) => sum + d.cost, 0),
        orderId: deductions[0]?.orderId,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Error processing deduction:', error)
    return NextResponse.json({ error: 'Failed to process deduction' }, { status: 500 })
  }
}
