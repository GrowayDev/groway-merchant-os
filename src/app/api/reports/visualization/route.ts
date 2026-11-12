import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

// Types for visualization
type ChartType = 'line' | 'bar' | 'pie' | 'funnel' | 'heatmap' | 'gauge' | 'treemap' | 'scatter' | 'area' | 'radar'

interface ChartConfig {
  title?: string
  subtitle?: string
  xAxis?: { label?: string; type?: string }
  yAxis?: { label?: string; type?: string }
  legend?: { position?: string; visible?: boolean }
  colors?: string[]
  showGrid?: boolean
  showDataLabels?: boolean
  animation?: boolean
}

interface DrillDownConfig {
  enabled: boolean
  levels: DrillDownLevel[]
}

interface DrillDownLevel {
  field: string
  label: string
  chartType?: ChartType
}

interface ComparisonConfig {
  type: 'period_over_period' | 'target' | 'previous_year'
  period?: string
  targetValue?: number
  showVariance?: boolean
  showPercentChange?: boolean
}

// GET /api/reports/visualization - Get visualization data or configs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const action = searchParams.get('action') || 'dashboard'
    const chartType = searchParams.get('chartType') as ChartType
    const dataSource = searchParams.get('dataSource') || 'transactions'
    const period = searchParams.get('period') || '30'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const groupBy = searchParams.get('groupBy') || 'day'
    const metric = searchParams.get('metric') || 'total'
    const visualizationId = searchParams.get('visualizationId')
    const comparison = searchParams.get('comparison') === 'true'
    const drillDown = searchParams.get('drillDown')

    // Get saved visualization configurations
    if (action === 'saved') {
      if (!merchantId) {
        return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
      }

      const visualizations = await db.visualizationConfig.findMany({
        where: {
          merchantId,
          isActive: true
        },
        orderBy: { name: 'asc' }
      })

      return NextResponse.json({
        success: true,
        data: visualizations
      })
    }

    // Get single visualization config
    if (visualizationId) {
      const viz = await db.visualizationConfig.findUnique({
        where: { id: visualizationId }
      })

      if (!viz) {
        return NextResponse.json({ error: 'Visualization not found' }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        data: viz
      })
    }

    // Get KPI scorecards
    if (action === 'kpis') {
      if (!merchantId) {
        return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
      }

      const kpis = await db.kPIScorecard.findMany({
        where: {
          merchantId,
          isActive: true
        },
        orderBy: [{ category: 'asc' }, { name: 'asc' }]
      })

      // Calculate current values for each KPI
      const kpiData = await Promise.all(kpis.map(async (kpi) => {
        const value = await calculateKPIValue(merchantId, kpi.metric, kpi.dataSource, period)
        const target = kpi.targetValue
        const variance = target ? ((value - target) / target) * 100 : null
        
        return {
          ...kpi,
          currentValue: value,
          targetValue: target,
          variance,
          status: getKPIStatus(value, target, kpi.warningThreshold, kpi.criticalThreshold)
        }
      }))

      return NextResponse.json({
        success: true,
        data: kpiData
      })
    }

    // Get dashboard data
    if (action === 'dashboard') {
      if (!merchantId) {
        return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
      }

      const days = parseInt(period)
      const end = endDate ? new Date(endDate) : new Date()
      const start = startDate ? new Date(startDate) : new Date(end.getTime() - days * 24 * 60 * 60 * 1000)

      // Get dashboard widgets
      const dashboards = await db.reportDashboard.findMany({
        where: {
          merchantId,
          status: 'active'
        }
      })

      // Generate dashboard data
      const dashboardData = await generateDashboardData(merchantId, start, end, days)

      return NextResponse.json({
        success: true,
        data: {
          dashboards,
          widgets: dashboardData,
          period: { start: start.toISOString(), end: end.toISOString(), days }
        }
      })
    }

    // Get chart data
    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
    }

    const chartData = await generateChartData(
      merchantId,
      chartType || 'line',
      dataSource,
      parseInt(period),
      startDate,
      endDate,
      groupBy,
      metric,
      comparison
    )

    return NextResponse.json({
      success: true,
      data: chartData
    })
  } catch (error) {
    console.error('Error in visualization API:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}

// POST /api/reports/visualization - Create or save visualization
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      action, 
      merchantId, 
      name, 
      description,
      chartType,
      chartConfig,
      dataSource,
      queryConfig,
      aggregationConfig,
      drillDownEnabled,
      drillDownConfig,
      comparisonEnabled,
      comparisonConfig,
      isRealtime,
      refreshInterval,
      createdBy,
      createdByName
    } = body

    // Create KPI scorecard
    if (action === 'kpi') {
      const kpi = await db.kPIScorecard.create({
        data: {
          id: nanoid(),
          merchantId,
          name: body.kpiName,
          category: body.category,
          metric: body.metric,
          calculationType: body.calculationType || 'sum',
          dataSource: body.dataSource || 'transactions',
          targetType: body.targetType || 'absolute',
          targetValue: body.targetValue,
          unit: body.unit,
          decimals: body.decimals || 2,
          warningThreshold: body.warningThreshold,
          criticalThreshold: body.criticalThreshold,
          showTrend: body.showTrend ?? true,
          isActive: true
        }
      })

      return NextResponse.json({
        success: true,
        data: kpi
      })
    }

    // Create dashboard
    if (action === 'dashboard') {
      const dashboard = await db.reportDashboard.create({
        data: {
          id: nanoid(),
          merchantId,
          name: body.dashboardName,
          description: body.dashboardDescription,
          widgets: JSON.stringify(body.widgets || []),
          layout: body.layout ? JSON.stringify(body.layout) : null,
          isDefault: body.isDefault || false,
          refreshInterval: body.refreshInterval || 300,
          createdBy,
          createdByName
        }
      })

      return NextResponse.json({
        success: true,
        data: dashboard
      })
    }

    // Create visualization config
    if (!merchantId || !name || !chartType) {
      return NextResponse.json({ 
        error: 'merchantId, name, and chartType are required' 
      }, { status: 400 })
    }

    const visualization = await db.visualizationConfig.create({
      data: {
        id: nanoid(),
        merchantId,
        name,
        description,
        chartType,
        chartConfig: JSON.stringify(chartConfig || {}),
        dataSource: dataSource || 'transactions',
        queryConfig: JSON.stringify(queryConfig || {}),
        aggregationConfig: aggregationConfig ? JSON.stringify(aggregationConfig) : null,
        drillDownEnabled: drillDownEnabled || false,
        drillDownConfig: drillDownConfig ? JSON.stringify(drillDownConfig) : null,
        comparisonEnabled: comparisonEnabled || false,
        comparisonConfig: comparisonConfig ? JSON.stringify(comparisonConfig) : null,
        isRealtime: isRealtime || false,
        refreshInterval: refreshInterval || 60,
        createdBy,
        createdByName
      }
    })

    return NextResponse.json({
      success: true,
      data: visualization
    })
  } catch (error) {
    console.error('Error creating visualization:', error)
    return NextResponse.json({ error: 'Failed to create visualization' }, { status: 500 })
  }
}

// PUT /api/reports/visualization - Update visualization
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { visualizationId, dashboardId, kpiId, ...data } = body

    // Update KPI
    if (kpiId) {
      const kpi = await db.kPIScorecard.update({
        where: { id: kpiId },
        data: {
          ...data,
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        data: kpi
      })
    }

    // Update dashboard
    if (dashboardId) {
      const updateData: Record<string, unknown> = { updatedAt: new Date() }
      
      if (data.widgets) {
        updateData.widgets = JSON.stringify(data.widgets)
      }
      if (data.layout) {
        updateData.layout = JSON.stringify(data.layout)
      }

      const dashboard = await db.reportDashboard.update({
        where: { id: dashboardId },
        data: updateData
      })

      return NextResponse.json({
        success: true,
        data: dashboard
      })
    }

    // Update visualization
    if (!visualizationId) {
      return NextResponse.json({ error: 'visualizationId is required' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() }
    
    const jsonFields = ['chartConfig', 'queryConfig', 'aggregationConfig', 'drillDownConfig', 'comparisonConfig']
    const directFields = ['name', 'description', 'chartType', 'dataSource', 'drillDownEnabled', 
                         'comparisonEnabled', 'isRealtime', 'refreshInterval', 'isActive']

    for (const field of directFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field]
      }
    }

    for (const field of jsonFields) {
      if (data[field] !== undefined) {
        updateData[field] = JSON.stringify(data[field])
      }
    }

    const visualization = await db.visualizationConfig.update({
      where: { id: visualizationId },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: visualization
    })
  } catch (error) {
    console.error('Error updating visualization:', error)
    return NextResponse.json({ error: 'Failed to update visualization' }, { status: 500 })
  }
}

// DELETE /api/reports/visualization - Delete visualization
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const visualizationId = searchParams.get('visualizationId')
    const dashboardId = searchParams.get('dashboardId')
    const kpiId = searchParams.get('kpiId')

    if (kpiId) {
      await db.kPIScorecard.update({
        where: { id: kpiId },
        data: { isActive: false }
      })

      return NextResponse.json({
        success: true,
        message: 'KPI deleted successfully'
      })
    }

    if (dashboardId) {
      await db.reportDashboard.update({
        where: { id: dashboardId },
        data: { status: 'deleted' }
      })

      return NextResponse.json({
        success: true,
        message: 'Dashboard deleted successfully'
      })
    }

    if (!visualizationId) {
      return NextResponse.json({ error: 'visualizationId is required' }, { status: 400 })
    }

    await db.visualizationConfig.update({
      where: { id: visualizationId },
      data: { isActive: false }
    })

    return NextResponse.json({
      success: true,
      message: 'Visualization deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting visualization:', error)
    return NextResponse.json({ error: 'Failed to delete visualization' }, { status: 500 })
  }
}

// Helper function to generate chart data
async function generateChartData(
  merchantId: string,
  chartType: ChartType,
  dataSource: string,
  periodDays: number,
  startDate?: string | null,
  endDate?: string | null,
  groupBy?: string,
  metric?: string,
  comparison?: boolean
): Promise<Record<string, unknown>> {
  const end = endDate ? new Date(endDate) : new Date()
  const start = startDate ? new Date(startDate) : new Date(end.getTime() - periodDays * 24 * 60 * 60 * 1000)

  // Base response structure
  const response: Record<string, unknown> = {
    chartType,
    dataSource,
    period: { start: start.toISOString(), end: end.toISOString() },
    generatedAt: new Date().toISOString()
  }

  switch (chartType) {
    case 'line':
    case 'area':
      response['data'] = await generateTimeSeriesData(merchantId, dataSource, start, end, groupBy || 'day')
      response['config'] = {
        xAxis: { type: 'date', label: 'Date' },
        yAxis: { type: 'number', label: metric === 'count' ? 'Count' : 'Amount (R)' },
        showGrid: true,
        showDataPoints: true
      }
      break

    case 'bar':
      response['data'] = await generateBarChartData(merchantId, dataSource, start, end, metric || 'total')
      response['config'] = {
        xAxis: { type: 'category' },
        yAxis: { type: 'number', label: 'Amount (R)' },
        showGrid: true
      }
      break

    case 'pie':
      response['data'] = await generatePieChartData(merchantId, dataSource, start, end)
      response['config'] = {
        showLabels: true,
        showPercentages: true,
        innerRadius: 0.4
      }
      break

    case 'funnel':
      response['data'] = await generateFunnelData(merchantId, start, end)
      response['config'] = {
        showValues: true,
        showPercentages: true
      }
      break

    case 'heatmap':
      response['data'] = await generateHeatmapData(merchantId, start, end)
      response['config'] = {
        xAxis: { label: 'Hour of Day' },
        yAxis: { label: 'Day of Week' },
        colorScale: ['#f0f9ff', '#0ea5e9']
      }
      break

    case 'gauge':
      const value = await calculateKPIValue(merchantId, metric || 'total_sales', dataSource, String(periodDays))
      response['data'] = {
        value,
        min: 0,
        max: 100000,
        thresholds: [
          { value: 30000, color: '#ef4444' },
          { value: 60000, color: '#f59e0b' },
          { value: 100000, color: '#10b981' }
        ]
      }
      break

    case 'scatter':
      response['data'] = await generateScatterData(merchantId, start, end)
      response['config'] = {
        xAxis: { label: 'Transaction Amount (R)' },
        yAxis: { label: 'Items in Transaction' }
      }
      break

    case 'treemap':
      response['data'] = await generateTreemapData(merchantId, dataSource, start, end)
      response['config'] = {
        showLabels: true
      }
      break

    case 'radar':
      response['data'] = await generateRadarData(merchantId, start, end)
      response['config'] = {
        categories: ['Sales', 'Transactions', 'Customers', 'Products', 'Staff'],
        maxValue: 100
      }
      break
  }

  // Add comparison data if requested
  if (comparison) {
    const previousStart = new Date(start)
    previousStart.setDate(previousStart.getDate() - periodDays)
    const previousEnd = new Date(start)

    response['comparison'] = {
      period: { start: previousStart.toISOString(), end: previousEnd.toISOString() },
      data: await generateTimeSeriesData(merchantId, dataSource, previousStart, previousEnd, groupBy || 'day')
    }
  }

  return response
}

// Helper functions for different chart types
async function generateTimeSeriesData(
  merchantId: string,
  dataSource: string,
  start: Date,
  end: Date,
  groupBy: string
): Promise<{ date: string; value: number; count: number }[]> {
  const transactions = await db.transaction.findMany({
    where: {
      merchantId,
      createdAt: { gte: start, lte: end },
      status: 'completed'
    },
    select: { total: true, createdAt: true }
  })

  // Group by day/week/month
  const grouped = new Map<string, { value: number; count: number }>()
  
  for (const tx of transactions) {
    let key: string
    const date = new Date(tx.createdAt)
    
    switch (groupBy) {
      case 'hour':
        key = `${date.toISOString().split('T')[0]}T${String(date.getHours()).padStart(2, '0')}:00`
        break
      case 'day':
        key = date.toISOString().split('T')[0]
        break
      case 'week':
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = weekStart.toISOString().split('T')[0]
        break
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        break
      default:
        key = date.toISOString().split('T')[0]
    }

    const existing = grouped.get(key) || { value: 0, count: 0 }
    existing.value += tx.total
    existing.count += 1
    grouped.set(key, existing)
  }

  return Array.from(grouped.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

async function generateBarChartData(
  merchantId: string,
  dataSource: string,
  start: Date,
  end: Date,
  metric: string
): Promise<{ category: string; value: number }[]> {
  // Get transactions with items
  const transactions = await db.transaction.findMany({
    where: {
      merchantId,
      createdAt: { gte: start, lte: end },
      status: 'completed'
    },
    include: {
      items: {
        select: { productName: true, quantity: true, total: true }
      }
    }
  })

  // Aggregate by product category
  const categoryTotals = new Map<string, number>()
  
  for (const tx of transactions) {
    for (const item of tx.items) {
      const category = item.productName || 'Unknown'
      const existing = categoryTotals.get(category) || 0
      categoryTotals.set(category, existing + (metric === 'count' ? item.quantity : item.total))
    }
  }

  return Array.from(categoryTotals.entries())
    .map(([category, value]) => ({ category, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)
}

async function generatePieChartData(
  merchantId: string,
  dataSource: string,
  start: Date,
  end: Date
): Promise<{ name: string; value: number; percentage: number }[]> {
  const transactions = await db.transaction.findMany({
    where: {
      merchantId,
      createdAt: { gte: start, lte: end },
      status: 'completed'
    },
    select: { paymentMethod: true, total: true }
  })

  const methodTotals = new Map<string, number>()
  let total = 0

  for (const tx of transactions) {
    const method = tx.paymentMethod || 'cash'
    const existing = methodTotals.get(method) || 0
    methodTotals.set(method, existing + tx.total)
    total += tx.total
  }

  return Array.from(methodTotals.entries())
    .map(([name, value]) => ({
      name,
      value,
      percentage: total > 0 ? (value / total) * 100 : 0
    }))
    .sort((a, b) => b.value - a.value)
}

async function generateFunnelData(
  merchantId: string,
  start: Date,
  end: Date
): Promise<{ stage: string; value: number; percentage: number }[]> {
  // Sales funnel stages
  const transactions = await db.transaction.findMany({
    where: {
      merchantId,
      createdAt: { gte: start, lte: end }
    },
    select: { status: true, total: true }
  })

  const stages = [
    { name: 'Visitors', count: 1000, value: 0 },
    { name: 'Product Views', count: 600, value: 0 },
    { name: 'Add to Cart', count: 300, value: 0 },
    { name: 'Checkout Started', count: 200, value: 0 },
    { name: 'Payment Completed', count: 0, value: 0 }
  ]

  const completed = transactions.filter(t => t.status === 'completed')
  stages[4].count = completed.length
  stages[4].value = completed.reduce((sum, t) => sum + t.total, 0)

  const maxCount = stages[0].count
  return stages.map(stage => ({
    stage: stage.name,
    value: stage.count,
    percentage: (stage.count / maxCount) * 100
  }))
}

async function generateHeatmapData(
  merchantId: string,
  start: Date,
  end: Date
): Promise<{ day: number; hour: number; value: number }[]> {
  const transactions = await db.transaction.findMany({
    where: {
      merchantId,
      createdAt: { gte: start, lte: end },
      status: 'completed'
    },
    select: { createdAt: true, total: true }
  })

  const heatmap = new Map<string, number>()
  
  for (const tx of transactions) {
    const date = new Date(tx.createdAt)
    const key = `${date.getDay()}-${date.getHours()}`
    const existing = heatmap.get(key) || 0
    heatmap.set(key, existing + tx.total)
  }

  const data: { day: number; hour: number; value: number }[] = []
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const key = `${day}-${hour}`
      data.push({
        day,
        hour,
        value: heatmap.get(key) || 0
      })
    }
  }

  return data
}

async function generateScatterData(
  merchantId: string,
  start: Date,
  end: Date
): Promise<{ x: number; y: number; size?: number }[]> {
  const transactions = await db.transaction.findMany({
    where: {
      merchantId,
      createdAt: { gte: start, lte: end },
      status: 'completed'
    },
    include: {
      items: true
    }
  })

  return transactions.map(tx => ({
    x: tx.total,
    y: tx.items.length,
    size: tx.total / 100
  }))
}

async function generateTreemapData(
  merchantId: string,
  dataSource: string,
  start: Date,
  end: Date
): Promise<{ name: string; value: number; children?: { name: string; value: number }[] }[]> {
  const transactions = await db.transaction.findMany({
    where: {
      merchantId,
      createdAt: { gte: start, lte: end },
      status: 'completed'
    },
    include: {
      items: { select: { productName: true, total: true } }
    }
  })

  const categoryMap = new Map<string, { total: number; products: Map<string, number> }>()

  for (const tx of transactions) {
    for (const item of tx.items) {
      const category = 'Products'
      const product = item.productName || 'Unknown'
      
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { total: 0, products: new Map() })
      }
      
      const cat = categoryMap.get(category)!
      cat.total += item.total
      const prodTotal = cat.products.get(product) || 0
      cat.products.set(product, prodTotal + item.total)
    }
  }

  return Array.from(categoryMap.entries()).map(([name, data]) => ({
    name,
    value: data.total,
    children: Array.from(data.products.entries())
      .map(([prodName, prodValue]) => ({ name: prodName, value: prodValue }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }))
}

async function generateRadarData(
  merchantId: string,
  start: Date,
  end: Date
): Promise<{ category: string; value: number }[]> {
  const transactions = await db.transaction.findMany({
    where: {
      merchantId,
      createdAt: { gte: start, lte: end },
      status: 'completed'
    },
    include: { items: true }
  })

  const totalSales = transactions.reduce((sum, tx) => sum + tx.total, 0)
  const totalTransactions = transactions.length
  const totalItems = transactions.reduce((sum, tx) => sum + tx.items.length, 0)

  // Normalize to 0-100 scale
  return [
    { category: 'Sales', value: Math.min((totalSales / 100000) * 100, 100) },
    { category: 'Transactions', value: Math.min((totalTransactions / 1000) * 100, 100) },
    { category: 'Customers', value: Math.min((transactions.length / 500) * 100, 100) },
    { category: 'Products', value: Math.min((totalItems / 2000) * 100, 100) },
    { category: 'Avg Basket', value: Math.min(((totalSales / Math.max(totalTransactions, 1)) / 200) * 100, 100) }
  ]
}

async function calculateKPIValue(
  merchantId: string,
  metric: string,
  dataSource: string,
  period: string
): Promise<number> {
  const days = parseInt(period) || 30
  const end = new Date()
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)

  switch (metric) {
    case 'total_sales':
      const sales = await db.transaction.aggregate({
        where: {
          merchantId,
          createdAt: { gte: start, lte: end },
          status: 'completed'
        },
        _sum: { total: true }
      })
      return sales._sum.total || 0

    case 'transaction_count':
      return await db.transaction.count({
        where: {
          merchantId,
          createdAt: { gte: start, lte: end },
          status: 'completed'
        }
      })

    case 'avg_basket':
      const result = await db.transaction.aggregate({
        where: {
          merchantId,
          createdAt: { gte: start, lte: end },
          status: 'completed'
        },
        _avg: { total: true }
      })
      return result._avg.total || 0

    case 'customer_count':
      return await db.customer.count({
        where: {
          merchantId,
          createdAt: { gte: start, lte: end }
        }
      })

    case 'product_count':
      return await db.product.count({
        where: { merchantId }
      })

    default:
      return 0
  }
}

function getKPIStatus(
  value: number,
  target: number | null,
  warningThreshold: number | null,
  criticalThreshold: number | null
): 'good' | 'warning' | 'critical' {
  if (!target) return 'good'
  
  const percentage = (value / target) * 100

  if (criticalThreshold !== null && percentage < criticalThreshold) {
    return 'critical'
  }
  if (warningThreshold !== null && percentage < warningThreshold) {
    return 'warning'
  }
  return 'good'
}

async function generateDashboardData(
  merchantId: string,
  start: Date,
  end: Date,
  days: number
): Promise<Record<string, unknown>> {
  // Get key metrics
  const [
    salesData,
    transactions,
    customers,
    topProducts,
    paymentMethods,
    hourlyData
  ] = await Promise.all([
    db.transaction.findMany({
      where: {
        merchantId,
        createdAt: { gte: start, lte: end },
        status: 'completed'
      },
      select: { total: true, createdAt: true }
    }),
    db.transaction.count({
      where: {
        merchantId,
        createdAt: { gte: start, lte: end },
        status: 'completed'
      }
    }),
    db.customer.count({
      where: { merchantId }
    }),
    db.transactionItem.groupBy({
      by: ['productName'],
      where: {
        transaction: {
          merchantId,
          createdAt: { gte: start, lte: end },
          status: 'completed'
        }
      },
      _sum: { total: true },
      _count: true,
      orderBy: { _sum: { total: 'desc' } },
      take: 5
    }),
    db.transaction.groupBy({
      by: ['paymentMethod'],
      where: {
        merchantId,
        createdAt: { gte: start, lte: end },
        status: 'completed'
      },
      _sum: { total: true },
      _count: true
    }),
    db.transaction.findMany({
      where: {
        merchantId,
        createdAt: { gte: start, lte: end },
        status: 'completed'
      },
      select: { createdAt: true, total: true }
    })
  ])

  // Calculate totals
  const totalSales = salesData.reduce((sum, tx) => sum + tx.total, 0)
  const avgBasket = transactions > 0 ? totalSales / transactions : 0

  // Group hourly data
  const hourly: Record<number, number> = {}
  for (let h = 0; h < 24; h++) hourly[h] = 0
  for (const tx of hourlyData) {
    const hour = new Date(tx.createdAt).getHours()
    hourly[hour] += tx.total
  }

  return {
    summary: {
      totalSales,
      transactions,
      avgBasket,
      customers,
      periodDays: days
    },
    salesTrend: salesData.map(tx => ({
      date: tx.createdAt.toISOString().split('T')[0],
      value: tx.total
    })),
    topProducts: topProducts.map(p => ({
      name: p.productName || 'Unknown',
      revenue: p._sum.total || 0,
      count: p._count
    })),
    paymentMethods: paymentMethods.map(pm => ({
      method: pm.paymentMethod || 'cash',
      amount: pm._sum.total || 0,
      count: pm._count
    })),
    hourlySales: Object.entries(hourly).map(([hour, value]) => ({
      hour: parseInt(hour),
      value
    }))
  }
}
