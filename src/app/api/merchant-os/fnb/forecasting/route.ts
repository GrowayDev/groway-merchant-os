import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface ForecastData {
  date: string
  predictedSales: number
  predictedOrders: number
  confidence: number
  lowerBound: number
  upperBound: number
  factors: string[]
}

interface IngredientForecast {
  ingredientId: string
  ingredientName: string
  currentStock: number
  unit: string
  predictedDemand: number
  stockAfterDemand: number
  orderRequired: boolean
  suggestedOrderQty: number
}

// GET - Get sales forecast
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const daysToForecast = parseInt(searchParams.get('days') || '14')
    const includeIngredients = searchParams.get('ingredients') !== 'false'
    const recipeId = searchParams.get('recipeId')

    // Get historical sales data (last 30 days)
    const historicalPeriod = new Date()
    historicalPeriod.setDate(historicalPeriod.getDate() - 30)

    let transactions: any[] = []
    try {
      transactions = await db.transaction.findMany({
        where: {
          createdAt: { gte: historicalPeriod },
          status: 'completed',
        },
        include: {
          TransactionItem: true,
        },
        orderBy: { createdAt: 'asc' },
      })
    } catch {
      transactions = []
    }

    // Calculate daily sales averages
    const dailySales: Record<string, { sales: number; orders: number }> = {}
    transactions.forEach(t => {
      const date = new Date(t.createdAt).toISOString().split('T')[0]
      if (!dailySales[date]) {
        dailySales[date] = { sales: 0, orders: 0 }
      }
      dailySales[date].sales += t.total
      dailySales[date].orders += 1
    })

    // Calculate day-of-week patterns
    const dayOfWeekStats: Record<number, { totalSales: number; totalOrders: number; count: number }> = {}
    for (let i = 0; i < 7; i++) {
      dayOfWeekStats[i] = { totalSales: 0, totalOrders: 0, count: 0 }
    }

    Object.entries(dailySales).forEach(([date, data]) => {
      const dayOfWeek = new Date(date).getDay()
      dayOfWeekStats[dayOfWeek].totalSales += data.sales
      dayOfWeekStats[dayOfWeek].totalOrders += data.orders
      dayOfWeekStats[dayOfWeek].count += 1
    })

    // Calculate averages
    const avgDailySales = Object.values(dailySales).reduce((sum, d) => sum + d.sales, 0) / 
      Math.max(Object.keys(dailySales).length, 1)
    const avgDailyOrders = Object.values(dailySales).reduce((sum, d) => sum + d.orders, 0) / 
      Math.max(Object.keys(dailySales).length, 1)

    // Generate forecast
    const forecast: ForecastData[] = []
    const today = new Date()
    
    for (let i = 1; i <= daysToForecast; i++) {
      const forecastDate = new Date(today)
      forecastDate.setDate(forecastDate.getDate() + i)
      const dayOfWeek = forecastDate.getDay()
      const dateStr = forecastDate.toISOString().split('T')[0]

      // Get day-of-week multiplier
      const dowStat = dayOfWeekStats[dayOfWeek]
      const dowMultiplier = dowStat.count > 0 
        ? (dowStat.totalSales / dowStat.count) / avgDailySales 
        : 1

      // Apply trend (slight growth assumption)
      const trendMultiplier = 1 + (i * 0.002) // 0.2% daily growth trend

      // Base prediction
      const basePrediction = avgDailySales * dowMultiplier * trendMultiplier
      const baseOrders = avgDailyOrders * dowMultiplier * trendMultiplier

      // Confidence interval (wider for further dates)
      const confidence = Math.max(0.5, 1 - (i * 0.03)) // Decreases 3% per day
      const variance = (1 - confidence) * basePrediction

      // Factors affecting prediction
      const factors: string[] = []
      if (dowMultiplier > 1.1) factors.push('High-demand day of week')
      if (dowMultiplier < 0.9) factors.push('Low-demand day of week')
      if (i <= 3) factors.push('Short-term forecast (higher confidence)')
      if (i > 7) factors.push('Long-term forecast (lower confidence)')

      // Check for special days (weekends, holidays, etc.)
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        factors.push('Weekend')
      }

      forecast.push({
        date: dateStr,
        predictedSales: Math.round(basePrediction * 100) / 100,
        predictedOrders: Math.round(baseOrders),
        confidence: Math.round(confidence * 100),
        lowerBound: Math.round((basePrediction - variance * 1.5) * 100) / 100,
        upperBound: Math.round((basePrediction + variance * 1.5) * 100) / 100,
        factors,
      })
    }

    // Calculate ingredient demand forecast
    let ingredientForecast: IngredientForecast[] = []
    if (includeIngredients) {
      const ingredients = await db.ingredient.findMany()
      
      // Get recipe ingredient usage
      let recipeIngredients: any[] = []
      try {
        recipeIngredients = await db.recipeIngredient.findMany({
          include: {
            ingredient: true,
            recipe: true,
          }
        })
      } catch {
        recipeIngredients = []
      }

      // Calculate expected ingredient demand based on forecast
      const totalPredictedOrders = forecast.reduce((sum, f) => sum + f.predictedOrders, 0)
      
      // Group ingredient usage
      const ingredientDemand: Record<string, number> = {}
      recipeIngredients.forEach(ri => {
        if (!ingredientDemand[ri.ingredientId]) {
          ingredientDemand[ri.ingredientId] = 0
        }
        // Assume each recipe is ordered proportionally
        const avgOrdersPerRecipe = totalPredictedOrders / (recipeIngredients.length / ingredients.length || 1)
        ingredientDemand[ri.ingredientId] += ri.quantity * avgOrdersPerRecipe * 0.1 // Scale factor
      })

      ingredientForecast = ingredients.map(ing => {
        const predictedDemand = ingredientDemand[ing.id] || 0
        const stockAfterDemand = ing.currentStock - predictedDemand
        const orderRequired = stockAfterDemand < (ing.reorderPoint || 0)
        const suggestedOrderQty = orderRequired 
          ? Math.ceil((ing.reorderPoint || 0) - stockAfterDemand + (predictedDemand * 0.2))
          : 0

        return {
          ingredientId: ing.id,
          ingredientName: ing.name,
          currentStock: ing.currentStock,
          unit: ing.unit,
          predictedDemand: Math.round(predictedDemand),
          stockAfterDemand: Math.round(stockAfterDemand * 100) / 100,
          orderRequired,
          suggestedOrderQty,
        }
      }).filter(f => f.orderRequired || f.predictedDemand > 0)
    }

    // Summary statistics
    const totalPredictedSales = forecast.reduce((sum, f) => sum + f.predictedSales, 0)
    const totalPredictedOrders = forecast.reduce((sum, f) => sum + f.predictedOrders, 0)
    const avgConfidence = forecast.reduce((sum, f) => sum + f.confidence, 0) / forecast.length

    return NextResponse.json({
      forecast,
      ingredientForecast,
      summary: {
        totalPredictedSales: Math.round(totalPredictedSales * 100) / 100,
        totalPredictedOrders,
        avgConfidence: Math.round(avgConfidence),
        forecastDays: daysToForecast,
        historicalDataDays: Object.keys(dailySales).length,
        avgDailySales: Math.round(avgDailySales * 100) / 100,
        avgDailyOrders: Math.round(avgDailyOrders * 10) / 10,
        dayOfWeekPatterns: Object.entries(dayOfWeekStats).map(([day, stats]) => ({
          day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][parseInt(day)],
          avgSales: stats.count > 0 ? Math.round(stats.totalSales / stats.count) : 0,
          avgOrders: stats.count > 0 ? Math.round(stats.totalOrders / stats.count) : 0,
          sampleDays: stats.count,
        })),
      },
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error generating forecast:', error)
    return NextResponse.json({ error: 'Failed to generate forecast' }, { status: 500 })
  }
}
