import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/grosupply/demand-forecast - Get demand forecasts and patterns
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const sku = searchParams.get('sku')
    const forecastPeriod = searchParams.get('forecastPeriod') || 'monthly'
    const includeHistory = searchParams.get('includeHistory') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build where clause
    const where: Record<string, unknown> = { forecastPeriod }
    if (merchantId) where.merchantId = merchantId
    if (sku) where.sku = sku

    // Get forecasts
    const forecasts = await db.demandForecast.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    // Get sales patterns
    const patterns = await db.salesPattern.findMany({
      where: sku ? { sku } : {},
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    // Get overall forecasting stats
    const forecastStats = {
      totalForecasts: await db.demandForecast.count({ where }),
      avgConfidence: await db.demandForecast.aggregate({
        where,
        _avg: { confidenceScore: true }
      }),
      byPeriod: await db.demandForecast.groupBy({
        by: ['forecastPeriod'],
        _count: { id: true },
        _avg: { confidenceScore: true }
      })
    }

    // Get top recommendations
    const topRecommendations = await db.demandForecast.findMany({
      where: {
        recommendedStock: { gt: 0 },
        confidenceScore: { gte: 0.7 }
      },
      orderBy: [
        { confidenceScore: 'desc' },
        { recommendedStock: 'desc' }
      ],
      take: 10
    })

    // Historical data if requested
    let historicalData = null
    if (includeHistory && sku) {
      historicalData = await getHistoricalSalesData(merchantId, sku)
    }

    return NextResponse.json({
      forecasts,
      patterns,
      stats: {
        totalForecasts: forecastStats.totalForecasts,
        avgConfidence: forecastStats.avgConfidence._avg.confidenceScore || 0,
        byPeriod: forecastStats.byPeriod.map(p => ({
          period: p.forecastPeriod,
          count: p._count.id,
          avgConfidence: p._avg.confidenceScore || 0
        }))
      },
      topRecommendations,
      historicalData
    })
  } catch (error) {
    console.error('Error fetching demand forecasts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch demand forecasts' },
      { status: 500 }
    )
  }
}

// POST /api/grosupply/demand-forecast - Generate new demand forecast
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      merchantId, 
      branchId,
      sku, 
      productName,
      forecastPeriod = 'monthly',
      forecastDate,
      historicalDataPoints = []
    } = body

    if (!sku) {
      return NextResponse.json(
        { error: 'SKU is required' },
        { status: 400 }
      )
    }

    // Generate forecast using mock ML model
    const forecast = generateDemandForecast({
      sku,
      productName,
      forecastPeriod,
      forecastDate: forecastDate || getNextPeriodDate(forecastPeriod),
      historicalData: historicalDataPoints.length > 0 
        ? historicalDataPoints 
        : await getHistoricalSalesData(merchantId, sku)
    })

    // Save forecast to database
    const savedForecast = await db.demandForecast.create({
      data: {
        id: `forecast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        merchantId,
        branchId,
        sku,
        productName,
        forecastPeriod,
        forecastDate: forecast.forecastDate,
        predictedUnits: forecast.predictedUnits,
        predictedRevenue: forecast.predictedRevenue,
        confidenceScore: forecast.confidenceScore,
        seasonalFactor: forecast.seasonalFactor,
        trendFactor: forecast.trendFactor,
        cyclicalFactor: forecast.cyclicalFactor,
        historicalUnits: forecast.historicalUnits,
        variancePercent: forecast.variancePercent,
        recommendedStock: forecast.recommendedStock,
        reorderPoint: forecast.reorderPoint,
        safetyStock: forecast.safetyStock,
        modelVersion: 'v2.1.0',
        features: JSON.stringify(forecast.features)
      }
    })

    // Also update/create sales pattern
    await updateSalesPattern({
      merchantId,
      sku,
      productName,
      historicalData: forecast.historicalDataPoints
    })

    return NextResponse.json({
      success: true,
      forecast: savedForecast,
      insights: {
        trend: forecast.trendDirection,
        seasonality: forecast.hasSeasonality,
        recommendation: forecast.recommendation
      }
    })
  } catch (error) {
    console.error('Error generating demand forecast:', error)
    return NextResponse.json(
      { error: 'Failed to generate demand forecast' },
      { status: 500 }
    )
  }
}

// PUT /api/grosupply/demand-forecast - Batch generate forecasts for multiple SKUs
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { merchantId, skus, forecastPeriod = 'monthly' } = body

    if (!Array.isArray(skus) || skus.length === 0) {
      return NextResponse.json(
        { error: 'Array of SKUs is required' },
        { status: 400 }
      )
    }

    const results = {
      success: 0,
      failed: 0,
      forecasts: [] as Record<string, unknown>[]
    }

    for (const skuItem of skus) {
      try {
        const sku = typeof skuItem === 'string' ? skuItem : skuItem.sku
        const productName = typeof skuItem === 'object' ? skuItem.productName : null
        
        const historicalData = await getHistoricalSalesData(merchantId, sku)
        const forecast = generateDemandForecast({
          sku,
          productName,
          forecastPeriod,
          forecastDate: getNextPeriodDate(forecastPeriod),
          historicalData
        })

        const savedForecast = await db.demandForecast.create({
          data: {
            id: `forecast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            merchantId,
            sku,
            productName,
            forecastPeriod,
            forecastDate: forecast.forecastDate,
            predictedUnits: forecast.predictedUnits,
            predictedRevenue: forecast.predictedRevenue,
            confidenceScore: forecast.confidenceScore,
            seasonalFactor: forecast.seasonalFactor,
            trendFactor: forecast.trendFactor,
            cyclicalFactor: forecast.cyclicalFactor,
            recommendedStock: forecast.recommendedStock,
            reorderPoint: forecast.reorderPoint,
            safetyStock: forecast.safetyStock,
            modelVersion: 'v2.1.0'
          }
        })

        results.forecasts.push(savedForecast)
        results.success++
      } catch (error) {
        results.failed++
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: skus.length,
        success: results.success,
        failed: results.failed
      },
      forecasts: results.forecasts
    })
  } catch (error) {
    console.error('Error batch generating forecasts:', error)
    return NextResponse.json(
      { error: 'Failed to generate batch forecasts' },
      { status: 500 }
    )
  }
}

// Helper function to get next period date
function getNextPeriodDate(period: string): string {
  const now = new Date()
  switch (period) {
    case 'weekly':
      now.setDate(now.getDate() + 7)
      break
    case 'monthly':
      now.setMonth(now.getMonth() + 1)
      break
    case 'quarterly':
      now.setMonth(now.getMonth() + 3)
      break
    default:
      now.setMonth(now.getMonth() + 1)
  }
  return now.toISOString().split('T')[0]
}

// Helper function to get historical sales data
async function getHistoricalSalesData(merchantId: string | null, sku: string) {
  // In a real implementation, this would query Transaction and TransactionItem tables
  // For demo, we'll generate mock historical data
  
  const months = 12
  const data = []
  
  // Base patterns for different product types
  const seasonalBase = Math.sin(new Date().getMonth() * Math.PI / 6) * 0.3 + 0.7
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    
    // Generate realistic-looking sales data
    const baseUnits = 50 + Math.random() * 100
    const seasonalEffect = Math.sin(i * Math.PI / 6) * 0.2 + 0.9
    const trend = 1 + (months - i) * 0.02 // Slight upward trend
    const randomNoise = 0.8 + Math.random() * 0.4
    
    const units = Math.round(baseUnits * seasonalEffect * trend * randomNoise)
    
    data.push({
      date: date.toISOString().split('T')[0],
      units,
      revenue: units * (50 + Math.random() * 50)
    })
  }
  
  return data
}

// Mock ML forecasting function
function generateDemandForecast(params: {
  sku: string
  productName: string | null
  forecastPeriod: string
  forecastDate: string
  historicalData: Array<{ date: string; units: number; revenue: number }>
}) {
  const { sku, productName, forecastPeriod, forecastDate, historicalData } = params
  
  // Calculate basic statistics from historical data
  const totalUnits = historicalData.reduce((sum, d) => sum + d.units, 0)
  const avgUnits = totalUnits / historicalData.length
  const lastPeriodUnits = historicalData[historicalData.length - 1]?.units || avgUnits
  
  // Calculate trend
  const firstHalf = historicalData.slice(0, Math.floor(historicalData.length / 2))
  const secondHalf = historicalData.slice(Math.floor(historicalData.length / 2))
  const firstHalfAvg = firstHalf.reduce((s, d) => s + d.units, 0) / firstHalf.length
  const secondHalfAvg = secondHalf.reduce((s, d) => s + d.units, 0) / secondHalf.length
  const trendFactor = secondHalfAvg / (firstHalfAvg || 1)
  
  // Calculate seasonality
  const monthlyAvg = new Map<number, number[]>()
  historicalData.forEach(d => {
    const month = new Date(d.date).getMonth()
    if (!monthlyAvg.has(month)) monthlyAvg.set(month, [])
    monthlyAvg.get(month)!.push(d.units)
  })
  
  const currentMonth = new Date().getMonth()
  const forecastMonth = new Date(forecastDate).getMonth()
  
  let seasonalFactor = 1
  if (monthlyAvg.has(forecastMonth)) {
    const monthData = monthlyAvg.get(forecastMonth)!
    const monthAvg = monthData.reduce((s, v) => s + v, 0) / monthData.length
    seasonalFactor = monthAvg / avgUnits
  }
  
  // Generate prediction
  let predictedUnits = avgUnits * trendFactor * seasonalFactor
  
  // Add some controlled randomness
  const variance = avgUnits * 0.15
  predictedUnits += (Math.random() - 0.5) * variance
  predictedUnits = Math.max(0, Math.round(predictedUnits))
  
  // Calculate confidence based on data quality
  const dataPoints = historicalData.length
  const consistencyScore = 1 - (Math.abs(trendFactor - 1) * 0.5)
  const confidenceScore = Math.min(0.95, Math.max(0.4, 
    (dataPoints / 12) * 0.3 + consistencyScore * 0.4 + 0.3
  ))
  
  // Calculate recommended stock levels
  const avgDailySales = avgUnits / 30
  const leadTime = 7 // days
  const safetyStockDays = 14 // 2 weeks safety buffer
  
  const recommendedStock = Math.ceil(predictedUnits * 1.1) // 10% buffer
  const reorderPoint = Math.ceil(avgDailySales * (leadTime + safetyStockDays))
  const safetyStock = Math.ceil(avgDailySales * safetyStockDays)
  
  // Determine trend direction
  const trendDirection = trendFactor > 1.05 ? 'increasing' 
    : trendFactor < 0.95 ? 'decreasing' 
    : 'stable'
  
  // Determine recommendation
  let recommendation = 'maintain_current_levels'
  if (predictedUnits > lastPeriodUnits * 1.2) {
    recommendation = 'increase_stock_levels'
  } else if (predictedUnits < lastPeriodUnits * 0.8) {
    recommendation = 'reduce_stock_levels'
  }
  
  return {
    sku,
    forecastDate,
    forecastPeriod,
    predictedUnits,
    predictedRevenue: predictedUnits * (50 + Math.random() * 50),
    confidenceScore,
    seasonalFactor,
    trendFactor,
    cyclicalFactor: 1.0,
    historicalUnits: totalUnits,
    historicalDataPoints: historicalData,
    variancePercent: Math.abs(trendFactor - 1) * 100,
    recommendedStock,
    reorderPoint,
    safetyStock,
    trendDirection,
    hasSeasonality: Math.abs(seasonalFactor - 1) > 0.1,
    recommendation,
    features: {
      avgUnits: Math.round(avgUnits),
      trendStrength: Math.abs(trendFactor - 1),
      dataQuality: dataPoints / 12,
      seasonalVariance: Math.abs(seasonalFactor - 1)
    }
  }
}

// Helper function to update sales pattern
async function updateSalesPattern(params: {
  merchantId: string | null
  sku: string
  productName: string | null
  historicalData: Array<{ date: string; units: number; revenue: number }>
}) {
  const { merchantId, sku, productName, historicalData } = params
  
  if (historicalData.length === 0) return
  
  const totalUnits = historicalData.reduce((s, d) => s + d.units, 0)
  const totalRevenue = historicalData.reduce((s, d) => s + d.revenue, 0)
  
  // Calculate daily/weekly/monthly averages
  const days = historicalData.length * 30
  const avgUnitsPerDay = totalUnits / days
  const avgUnitsPerWeek = avgUnitsPerDay * 7
  const avgUnitsPerMonth = avgUnitsPerDay * 30
  
  // Find peak patterns (mock analysis)
  const peakDayOfWeek = Math.floor(Math.random() * 7) // 0-6, Sunday-Saturday
  const peakHourOfDay = Math.floor(Math.random() * 12) + 10 // 10am-10pm
  const peakMonth = Math.floor(Math.random() * 12) // 0-11
  
  // Calculate trend
  const firstHalf = historicalData.slice(0, Math.floor(historicalData.length / 2))
  const secondHalf = historicalData.slice(Math.floor(historicalData.length / 2))
  const firstHalfAvg = firstHalf.reduce((s, d) => s + d.units, 0) / (firstHalf.length || 1)
  const secondHalfAvg = secondHalf.reduce((s, d) => s + d.units, 0) / (secondHalf.length || 1)
  const trendStrength = (secondHalfAvg - firstHalfAvg) / (firstHalfAvg || 1)
  const trendDirection = trendStrength > 0.05 ? 'increasing' 
    : trendStrength < -0.05 ? 'decreasing' 
    : 'stable'
  
  // Detect seasonality
  const monthlyValues = new Map<number, number[]>()
  historicalData.forEach(d => {
    const month = new Date(d.date).getMonth()
    if (!monthlyValues.has(month)) monthlyValues.set(month, [])
    monthlyValues.get(month)!.push(d.units)
  })
  
  const monthlyAvgs = Array.from(monthlyValues.values()).map(
    arr => arr.reduce((s, v) => s + v, 0) / arr.length
  )
  const overallAvg = monthlyAvgs.reduce((s, v) => s + v, 0) / monthlyAvgs.length
  const seasonalityVariance = Math.sqrt(
    monthlyAvgs.reduce((s, v) => s + Math.pow(v - overallAvg, 2), 0) / monthlyAvgs.length
  ) / overallAvg
  const hasSeasonality = seasonalityVariance > 0.1
  
  // Calculate period
  const periodStart = historicalData[0]?.date || new Date().toISOString().split('T')[0]
  const periodEnd = historicalData[historicalData.length - 1]?.date || new Date().toISOString().split('T')[0]
  
  // Upsert pattern
  await db.salesPattern.upsert({
    where: {
      id: `pattern_${merchantId || 'global'}_${sku}_monthly`
    },
    create: {
      id: `pattern_${merchantId || 'global'}_${sku}_monthly`,
      merchantId,
      sku,
      patternType: 'monthly',
      periodStart,
      periodEnd,
      avgUnitsPerDay,
      avgUnitsPerWeek,
      avgUnitsPerMonth,
      peakDayOfWeek,
      peakHourOfDay,
      peakMonth,
      trendDirection,
      trendStrength: Math.abs(trendStrength),
      hasSeasonality,
      seasonalityStrength: seasonalityVariance,
      totalUnitsSold: totalUnits,
      totalRevenue,
      transactionCount: historicalData.length
    },
    update: {
      avgUnitsPerDay,
      avgUnitsPerWeek,
      avgUnitsPerMonth,
      peakDayOfWeek,
      peakHourOfDay,
      peakMonth,
      trendDirection,
      trendStrength: Math.abs(trendStrength),
      hasSeasonality,
      seasonalityStrength: seasonalityVariance,
      totalUnitsSold: totalUnits,
      totalRevenue,
      transactionCount: historicalData.length,
      periodStart,
      periodEnd
    }
  })
}
