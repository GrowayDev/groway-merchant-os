import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface SalesVelocity {
  ingredientId: string
  ingredientName: string
  currentStock: number
  unit: string
  avgDailyUsage: number
  daysOfStock: number
  reorderPoint: number
  suggestedOrderQty: number
  urgency: 'critical' | 'high' | 'medium' | 'low'
  lastOrdered?: string
  leadTime: number
  predictedStockout: string
}

// GET - Get predictive ordering suggestions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const daysToAnalyze = parseInt(searchParams.get('days') || '30')
    const minimumStockDays = parseInt(searchParams.get('minStockDays') || '7')
    const category = searchParams.get('category')

    // Get all ingredients
    const where: any = {}
    if (category && category !== 'all') {
      where.category = category
    }
    
    const ingredients = await db.ingredient.findMany({ where })

    // Get stock deductions for the period
    const periodStart = new Date()
    periodStart.setDate(periodStart.getDate() - daysToAnalyze)

    let deductions: any[] = []
    try {
      deductions = await db.stockDeduction.findMany({
        where: {
          createdAt: { gte: periodStart }
        },
        include: {
          ingredient: { select: { id: true, name: true } }
        }
      })
    } catch {
      deductions = []
    }

    // Calculate velocity for each ingredient
    const velocityData: SalesVelocity[] = ingredients.map(ing => {
      // Get deductions for this ingredient
      const ingDeductions = deductions.filter(d => d.ingredientId === ing.id)
      
      // Calculate average daily usage
      const totalUsed = ingDeductions.reduce((sum, d) => sum + d.quantity, 0)
      const avgDailyUsage = totalUsed / daysToAnalyze

      // Calculate days of stock remaining
      const daysOfStock = avgDailyUsage > 0 ? ing.currentStock / avgDailyUsage : Infinity

      // Calculate suggested order quantity (enough for minimum stock days + lead time)
      const leadTime = ing.leadDays || 3
      const safetyStock = avgDailyUsage * (leadTime + 2) // 2 days safety buffer
      const reorderPoint = Math.max(safetyStock, ing.reorderPoint || 0)
      
      // Suggested order = (minStockDays + leadTime) * avgDaily - currentStock
      const suggestedOrderQty = Math.max(0, 
        Math.ceil((minimumStockDays + leadTime) * avgDailyUsage - ing.currentStock)
      )

      // Determine urgency
      let urgency: 'critical' | 'high' | 'medium' | 'low'
      if (daysOfStock <= leadTime) {
        urgency = 'critical'
      } else if (daysOfStock <= leadTime + 2) {
        urgency = 'high'
      } else if (daysOfStock <= minimumStockDays) {
        urgency = 'medium'
      } else {
        urgency = 'low'
      }

      // Predict stockout date
      const predictedStockout = avgDailyUsage > 0 
        ? new Date(Date.now() + daysOfStock * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : 'N/A'

      return {
        ingredientId: ing.id,
        ingredientName: ing.name,
        currentStock: ing.currentStock,
        unit: ing.unit,
        avgDailyUsage: Math.round(avgDailyUsage * 100) / 100,
        daysOfStock: Math.round(daysOfStock * 10) / 10,
        reorderPoint: Math.round(reorderPoint),
        suggestedOrderQty,
        urgency,
        leadTime,
        predictedStockout,
        category: ing.category,
      }
    })

    // Sort by urgency and days of stock
    const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    velocityData.sort((a, b) => {
      if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
      }
      return a.daysOfStock - b.daysOfStock
    })

    // Calculate summary
    const criticalItems = velocityData.filter(v => v.urgency === 'critical')
    const highPriorityItems = velocityData.filter(v => v.urgency === 'high')
    const totalSuggestedCost = velocityData.reduce((sum, v) => {
      const ing = ingredients.find(i => i.id === v.ingredientId)
      return sum + (v.suggestedOrderQty * (ing?.costPerUnit || 0))
    }, 0)

    // Generate order suggestions grouped by category
    const orderSuggestions = velocityData
      .filter(v => v.suggestedOrderQty > 0)
      .reduce((acc, v) => {
        const category = v.category || 'Other'
        if (!acc[category]) acc[category] = []
        acc[category].push(v)
        return acc
      }, {} as Record<string, SalesVelocity[]>)

    return NextResponse.json({
      velocityData,
      orderSuggestions,
      summary: {
        totalIngredients: ingredients.length,
        criticalCount: criticalItems.length,
        highPriorityCount: highPriorityItems.length,
        totalSuggestedOrderQty: velocityData.reduce((sum, v) => sum + v.suggestedOrderQty, 0),
        totalSuggestedCost,
        analysisPeriod: daysToAnalyze,
        minimumStockDays,
      },
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error generating predictive orders:', error)
    return NextResponse.json({ error: 'Failed to generate predictive orders' }, { status: 500 })
  }
}

// POST - Generate purchase order from predictions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, supplierId, notes } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ 
        error: 'Items array is required' 
      }, { status: 400 })
    }

    // Calculate total
    let totalCost = 0
    const orderItems = []

    for (const item of items) {
      const ingredient = await db.ingredient.findUnique({
        where: { id: item.ingredientId }
      })
      
      if (ingredient) {
        const lineTotal = ingredient.costPerUnit * item.quantity
        totalCost += lineTotal
        orderItems.push({
          ingredientId: item.ingredientId,
          ingredientName: ingredient.name,
          quantity: item.quantity,
          unit: ingredient.unit,
          unitCost: ingredient.costPerUnit,
          lineTotal,
        })
      }
    }

    // Create purchase order (would integrate with GroSupply)
    const purchaseOrder = {
      id: `PO-${Date.now()}`,
      items: orderItems,
      totalCost,
      supplierId,
      notes,
      status: 'draft',
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      purchaseOrder,
      message: 'Purchase order generated successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Error generating purchase order:', error)
    return NextResponse.json({ error: 'Failed to generate purchase order' }, { status: 500 })
  }
}
