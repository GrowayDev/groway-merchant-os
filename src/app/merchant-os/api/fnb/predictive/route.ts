import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/fnb/predictive - Get demand forecasts and reorder suggestions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const branchId = searchParams.get('branchId')
    const action = searchParams.get('action') || 'forecasts'
    const period = searchParams.get('period') || 'weekly'

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
    }

    switch (action) {
      case 'forecasts':
        return getForecasts(merchantId, branchId, period)
      case 'reorder':
        return getReorderSuggestions(merchantId, branchId)
      case 'anomalies':
        return getAnomalies(merchantId, branchId)
      case 'trends':
        return getSalesTrends(merchantId, branchId)
      default:
        return getForecasts(merchantId, branchId, period)
    }
  } catch (error) {
    console.error('Error in predictive API:', error)
    return NextResponse.json({ error: 'Failed to process predictive request' }, { status: 500 })
  }
}

// Get demand forecasts
async function getForecasts(merchantId: string, branchId: string | null, period: string) {
  const where: any = { merchantId }
  if (branchId) where.branchId = branchId
  where.forecastPeriod = period

  const forecasts = await db.demandForecast.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({
    success: true,
    data: forecasts,
    period,
  })
}

// Get reorder suggestions based on sales velocity and stock levels
async function getReorderSuggestions(merchantId: string, branchId: string | null) {
  // Get products with their current stock
  const where: any = { merchantId }
  if (branchId) where.branchId = branchId

  const products = await db.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      sku: true,
      currentStock: true,
      minStock: true,
      costPrice: true,
      Category: true,
    },
  })

  // Get recent sales velocity (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const salesWhere: any = {
    merchantId,
    createdAt: { gte: thirtyDaysAgo },
    status: 'completed',
  }
  if (branchId) salesWhere.branchId = branchId

  const transactions = await db.transaction.findMany({
    where: salesWhere,
    include: {
      TransactionItem: true,
    },
  })

  // Calculate sales velocity per product
  const salesVelocity: Record<string, { quantity: number; revenue: number }> = {}
  transactions.forEach(tx => {
    tx.TransactionItem?.forEach(item => {
      const productId = item.productId
      if (productId) {
        if (!salesVelocity[productId]) {
          salesVelocity[productId] = { quantity: 0, revenue: 0 }
        }
        salesVelocity[productId].quantity += item.quantity
        salesVelocity[productId].revenue += item.total
      }
    })
  })

  // Calculate reorder suggestions
  const suggestions = products
    .filter(p => p.currentStock !== null)
    .map(product => {
      const velocity = salesVelocity[product.id!] || { quantity: 0, revenue: 0 }
      const dailyVelocity = velocity.quantity / 30
      const weeklyVelocity = dailyVelocity * 7

      // Calculate days of stock remaining
      const daysOfStock = dailyVelocity > 0 ? product.currentStock! / dailyVelocity : 999

      // Calculate reorder point (lead time * daily velocity + safety stock)
      const leadTime = 3 // days
      const safetyStock = weeklyVelocity * 0.5 // 3.5 days safety
      const reorderPoint = (dailyVelocity * leadTime) + safetyStock

      // Calculate suggested order quantity (EOQ-like calculation)
      const targetStock = weeklyVelocity * 2 // 2 weeks of stock
      const suggestedQty = Math.max(0, Math.ceil(targetStock - product.currentStock! + reorderPoint))

      const needsReorder = product.currentStock! <= reorderPoint

      return {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        currentStock: product.currentStock,
        minStock: product.minStock || 0,
        dailyVelocity: Math.round(dailyVelocity * 10) / 10,
        weeklyVelocity: Math.round(weeklyVelocity * 10) / 10,
        daysOfStock: Math.round(daysOfStock),
        reorderPoint: Math.round(reorderPoint),
        suggestedOrderQty: suggestedQty,
        estimatedCost: suggestedQty * (product.costPrice || 0),
        priority: daysOfStock < 3 ? 'critical' : daysOfStock < 7 ? 'high' : daysOfStock < 14 ? 'medium' : 'low',
        needsReorder,
      }
    })
    .filter(s => s.needsReorder || s.daysOfStock < 14)
    .sort((a, b) => a.daysOfStock - b.daysOfStock)

  return NextResponse.json({
    success: true,
    data: suggestions,
    summary: {
      criticalCount: suggestions.filter(s => s.priority === 'critical').length,
      highCount: suggestions.filter(s => s.priority === 'high').length,
      mediumCount: suggestions.filter(s => s.priority === 'medium').length,
      totalEstimatedCost: suggestions.reduce((sum, s) => sum + s.estimatedCost, 0),
    },
  })
}

// Detect anomalies in sales patterns
async function getAnomalies(merchantId: string, branchId: string | null) {
  // Get last 60 days of transactions
  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  const where: any = {
    merchantId,
    createdAt: { gte: sixtyDaysAgo },
    status: 'completed',
  }
  if (branchId) where.branchId = branchId

  const transactions = await db.transaction.findMany({
    where,
    select: {
      id: true,
      total: true,
      createdAt: true,
      TransactionItem: {
        select: {
          productId: true,
          productName: true,
          quantity: true,
          total: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  // Group by day
  const dailyData: Record<string, { total: number; count: number; items: Record<string, number> }> = {}
  transactions.forEach(tx => {
    const date = tx.createdAt.toISOString().split('T')[0]
    if (!dailyData[date]) {
      dailyData[date] = { total: 0, count: 0, items: {} }
    }
    dailyData[date].total += tx.total
    dailyData[date].count += 1

    tx.TransactionItem?.forEach(item => {
      if (item.productId) {
        dailyData[date].items[item.productId] = (dailyData[date].items[item.productId] || 0) + item.quantity
      }
    })
  })

  // Calculate mean and std deviation
  const dailyTotals = Object.values(dailyData).map(d => d.total)
  const mean = dailyTotals.reduce((a, b) => a + b, 0) / dailyTotals.length
  const variance = dailyTotals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / dailyTotals.length
  const stdDev = Math.sqrt(variance)

  // Detect anomalies (values more than 2 std devs from mean)
  const anomalies: any[] = []
  Object.entries(dailyData).forEach(([date, data]) => {
    const zScore = stdDev > 0 ? (data.total - mean) / stdDev : 0
    if (Math.abs(zScore) > 2) {
      anomalies.push({
        date,
        total: data.total,
        transactionCount: data.count,
        zScore: Math.round(zScore * 100) / 100,
        type: zScore > 0 ? 'spike' : 'drop',
        expectedRange: {
          min: Math.round(mean - 2 * stdDev),
          max: Math.round(mean + 2 * stdDev),
        },
        deviation: Math.round(Math.abs(data.total - mean)),
      })
    }
  })

  // Product-level anomalies
  const productAnomalies: any[] = []
  const productDailySales: Record<string, number[]> = {}

  transactions.forEach(tx => {
    const date = tx.createdAt.toISOString().split('T')[0]
    tx.TransactionItem?.forEach(item => {
      if (!productDailySales[item.productId!]) {
        productDailySales[item.productId!] = []
      }
      productDailySales[item.productId!].push(item.quantity)
    })
  })

  Object.entries(productDailySales).forEach(([productId, quantities]) => {
    const prodMean = quantities.reduce((a, b) => a + b, 0) / quantities.length
    const prodVariance = quantities.reduce((a, b) => a + Math.pow(b - prodMean, 2), 0) / quantities.length
    const prodStdDev = Math.sqrt(prodVariance)

    // Check last 7 days for anomalies
    const recent = quantities.slice(-7)
    const recentMean = recent.reduce((a, b) => a + b, 0) / recent.length
    const recentZScore = prodStdDev > 0 ? (recentMean - prodMean) / prodStdDev : 0

    if (Math.abs(recentZScore) > 1.5) {
      productAnomalies.push({
        productId,
        productName: transactions.find(t => t.TransactionItem?.some(i => i.productId === productId))?.TransactionItem?.[0]?.productName,
        averageDaily: Math.round(prodMean * 10) / 10,
        recentAverage: Math.round(recentMean * 10) / 10,
        zScore: Math.round(recentZScore * 100) / 100,
        type: recentZScore > 0 ? 'increasing_demand' : 'decreasing_demand',
      })
    }
  })

  return NextResponse.json({
    success: true,
    data: {
      dailyAnomalies: anomalies.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore)),
      productAnomalies: productAnomalies.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore)),
      stats: {
        mean: Math.round(mean),
        stdDev: Math.round(stdDev),
        totalDays: dailyTotals.length,
        anomalyDays: anomalies.length,
      },
    },
  })
}

// Get sales trends and insights
async function getSalesTrends(merchantId: string, branchId: string | null) {
  // Get last 90 days of data
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const where: any = {
    merchantId,
    createdAt: { gte: ninetyDaysAgo },
    status: 'completed',
  }
  if (branchId) where.branchId = branchId

  const transactions = await db.transaction.findMany({
    where,
    select: {
      total: true,
      createdAt: true,
      paymentMethod: true,
      TransactionItem: {
        select: {
          productId: true,
          productName: true,
          quantity: true,
          total: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  // Weekly trends
  const weeklyTrends: Record<string, { total: number; count: number }> = {}
  transactions.forEach(tx => {
    const date = new Date(tx.createdAt)
    const weekStart = new Date(date)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const weekKey = weekStart.toISOString().split('T')[0]

    if (!weeklyTrends[weekKey]) {
      weeklyTrends[weekKey] = { total: 0, count: 0 }
    }
    weeklyTrends[weekKey].total += tx.total
    weeklyTrends[weekKey].count += 1
  })

  // Calculate growth rates
  const weeklyArray = Object.entries(weeklyTrends)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([week, data], idx, arr) => ({
      week,
      ...data,
      growth: idx > 0 ? ((data.total - arr[idx - 1][1].total) / arr[idx - 1][1].total) * 100 : 0,
    }))

  // Day of week patterns
  const dayPatterns: Record<number, { total: number; count: number }> = {}
  transactions.forEach(tx => {
    const day = new Date(tx.createdAt).getDay()
    if (!dayPatterns[day]) dayPatterns[day] = { total: 0, count: 0 }
    dayPatterns[day].total += tx.total
    dayPatterns[day].count += 1
  })

  // Hour of day patterns
  const hourlyPatterns: Record<number, { total: number; count: number }> = {}
  transactions.forEach(tx => {
    const hour = new Date(tx.createdAt).getHours()
    if (!hourlyPatterns[hour]) hourlyPatterns[hour] = { total: 0, count: 0 }
    hourlyPatterns[hour].total += tx.total
    hourlyPatterns[hour].count += 1
  })

  // Top products
  const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {}
  transactions.forEach(tx => {
    tx.TransactionItem?.forEach(item => {
      if (item.productId) {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { name: item.productName || 'Unknown', quantity: 0, revenue: 0 }
        }
        productSales[item.productId].quantity += item.quantity
        productSales[item.productId].revenue += item.total
      }
    })
  })

  const topProducts = Object.entries(productSales)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 10)
    .map(([id, data]) => ({ productId: id, ...data }))

  return NextResponse.json({
    success: true,
    data: {
      weeklyTrends: weeklyArray.slice(-12), // Last 12 weeks
      dayPatterns: Object.entries(dayPatterns).map(([day, data]) => ({
        day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][parseInt(day)],
        ...data,
        avgTransaction: data.total / data.count,
      })),
      hourlyPatterns: Object.entries(hourlyPatterns).map(([hour, data]) => ({
        hour: parseInt(hour),
        ...data,
      })).sort((a, b) => parseInt(a.hour) - parseInt(b.hour)),
      topProducts,
      insights: {
        bestDay: Object.entries(dayPatterns).sort((a, b) => b[1].total - a[1].total)[0]?.[0],
        bestHour: Object.entries(hourlyPatterns).sort((a, b) => b[1].total - a[1].total)[0]?.[0],
        avgWeeklyGrowth: weeklyArray.length > 1
          ? weeklyArray.slice(-4).reduce((sum, w) => sum + w.growth, 0) / 4
          : 0,
      },
    },
  })
}
