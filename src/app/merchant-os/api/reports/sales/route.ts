import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface SalesMetrics {
  totalSales: number
  transactionCount: number
  avgTransaction: number
  growth: number
}

interface HourlyBreakdown {
  hour: string
  amount: number
  count: number
}

interface PaymentMethodBreakdown {
  method: string
  amount: number
  count: number
  percentage: number
}

interface TopProduct {
  id: string
  name: string
  sold: number
  revenue: number
}

interface MonthlyBreakdown {
  month: string
  year: number
  monthName: string
  sales: number
  transactions: number
  growth: number
}

interface QuarterlyBreakdown {
  quarter: number
  year: number
  label: string
  sales: number
  transactions: number
  growth: number
}

// Helper to get quarter from month
function getQuarter(month: number): number {
  return Math.floor(month / 3) + 1
}

// Helper to get quarter start/end dates
function getQuarterDates(year: number, quarter: number): { start: Date; end: Date } {
  const startMonth = (quarter - 1) * 3
  const start = new Date(year, startMonth, 1)
  const end = new Date(year, startMonth + 3, 0, 23, 59, 59, 999)
  return { start, end }
}

// GET /api/reports/sales - Get sales report data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const period = searchParams.get('period') || 'daily' // daily, weekly, monthly, quarterly, yearly
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear()
    const quarter = searchParams.get('quarter') ? parseInt(searchParams.get('quarter')!) : getQuarter(new Date().getMonth())

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
    }

    // Calculate date ranges
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    let periodStart: Date
    let periodEnd: Date = now
    let previousPeriodStart: Date
    let previousPeriodEnd: Date

    switch (period) {
      case 'daily':
        periodStart = today
        previousPeriodStart = new Date(today)
        previousPeriodStart.setDate(previousPeriodStart.getDate() - 1)
        previousPeriodEnd = new Date(previousPeriodStart)
        previousPeriodEnd.setHours(23, 59, 59, 999)
        break
      case 'weekly':
        periodStart = new Date(today)
        periodStart.setDate(periodStart.getDate() - 6)
        previousPeriodStart = new Date(periodStart)
        previousPeriodStart.setDate(previousPeriodStart.getDate() - 7)
        previousPeriodEnd = new Date(periodStart)
        previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1)
        break
      case 'monthly':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
        previousPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        previousPeriodEnd = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      case 'quarterly':
        const quarterDates = getQuarterDates(year, quarter)
        periodStart = quarterDates.start
        periodEnd = quarterDates.end
        // Previous quarter
        const prevQuarter = quarter === 1 ? 4 : quarter - 1
        const prevYear = quarter === 1 ? year - 1 : year
        const prevQuarterDates = getQuarterDates(prevYear, prevQuarter)
        previousPeriodStart = prevQuarterDates.start
        previousPeriodEnd = prevQuarterDates.end
        break
      case 'yearly':
        periodStart = new Date(year, 0, 1)
        periodEnd = new Date(year, 11, 31, 23, 59, 59, 999)
        previousPeriodStart = new Date(year - 1, 0, 1)
        previousPeriodEnd = new Date(year - 1, 11, 31, 23, 59, 59, 999)
        break
      default:
        periodStart = today
        previousPeriodStart = new Date(today)
        previousPeriodStart.setDate(previousPeriodStart.getDate() - 1)
        previousPeriodEnd = new Date(previousPeriodStart)
    }

    // Fetch transactions for the period
    const transactions = await db.transaction.findMany({
      where: {
        merchantId,
        createdAt: {
          gte: periodStart,
          lte: periodEnd
        },
        status: 'completed'
      },
      include: {
        TransactionItem: true
      }
    })

    // Fetch previous period transactions for comparison
    const previousTransactions = await db.transaction.findMany({
      where: {
        merchantId,
        createdAt: {
          gte: previousPeriodStart,
          lte: previousPeriodEnd
        },
        status: 'completed'
      }
    })

    // Calculate metrics
    const totalSales = transactions.reduce((sum, t) => sum + t.total, 0)
    const previousSales = previousTransactions.reduce((sum, t) => sum + t.total, 0)
    const transactionCount = transactions.length
    const avgTransaction = transactionCount > 0 ? totalSales / transactionCount : 0
    const growth = previousSales > 0 
      ? ((totalSales - previousSales) / previousSales) * 100 
      : 0

    // Hourly breakdown (for daily reports)
    let hourlyBreakdown: HourlyBreakdown[] = []
    if (period === 'daily') {
      const hourlyData: Record<number, { amount: number; count: number }> = {}
      
      for (let h = 0; h < 24; h++) {
        hourlyData[h] = { amount: 0, count: 0 }
      }
      
      transactions.forEach(t => {
        const hour = new Date(t.createdAt).getHours()
        hourlyData[hour].amount += t.total
        hourlyData[hour].count += 1
      })
      
      hourlyBreakdown = Object.entries(hourlyData)
        .filter(([_, data]) => data.count > 0)
        .map(([hour, data]) => ({
          hour: `${hour.padStart(2, '0')}:00`,
          amount: data.amount,
          count: data.count
        }))
    }

    // Payment method breakdown
    const paymentMethodData: Record<string, { amount: number; count: number }> = {}
    transactions.forEach(t => {
      const method = t.paymentMethod || 'cash'
      if (!paymentMethodData[method]) {
        paymentMethodData[method] = { amount: 0, count: 0 }
      }
      paymentMethodData[method].amount += t.total
      paymentMethodData[method].count += 1
    })
    
    const paymentMethods: PaymentMethodBreakdown[] = Object.entries(paymentMethodData)
      .map(([method, data]) => ({
        method,
        amount: data.amount,
        count: data.count,
        percentage: totalSales > 0 ? (data.amount / totalSales) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount)

    // Top products
    const productSales: Record<string, { name: string; sold: number; revenue: number }> = {}
    transactions.forEach(t => {
      t.TransactionItem?.forEach(item => {
        const name = item.name || 'Unknown'
        if (!productSales[name]) {
          productSales[name] = { name, sold: 0, revenue: 0 }
        }
        productSales[name].sold += item.quantity
        productSales[name].revenue += item.total
      })
    })
    
    const topProducts: TopProduct[] = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map((p, i) => ({ id: `prod-${i}`, ...p }))

    // Daily breakdown (for weekly/monthly reports)
    let dailyBreakdown: { date: string; sales: number; transactions: number }[] = []
    if (period === 'weekly' || period === 'monthly') {
      const dailyData: Record<string, { sales: number; transactions: number }> = {}
      
      transactions.forEach(t => {
        const date = new Date(t.createdAt).toISOString().split('T')[0]
        if (!dailyData[date]) {
          dailyData[date] = { sales: 0, transactions: 0 }
        }
        dailyData[date].sales += t.total
        dailyData[date].transactions += 1
      })
      
      dailyBreakdown = Object.entries(dailyData)
        .map(([date, data]) => ({
          date,
          sales: data.sales,
          transactions: data.transactions
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
    }

    // Monthly breakdown (for quarterly/yearly reports)
    let monthlyBreakdown: MonthlyBreakdown[] = []
    if (period === 'quarterly' || period === 'yearly') {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December']
      const monthlyData: Record<string, { sales: number; transactions: number; year: number; month: number }> = {}
      
      transactions.forEach(t => {
        const date = new Date(t.createdAt)
        const key = `${date.getFullYear()}-${date.getMonth()}`
        if (!monthlyData[key]) {
          monthlyData[key] = { sales: 0, transactions: 0, year: date.getFullYear(), month: date.getMonth() }
        }
        monthlyData[key].sales += t.total
        monthlyData[key].transactions += 1
      })
      
      const monthlyArray = Object.values(monthlyData).sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year
        return a.month - b.month
      })
      
      monthlyBreakdown = monthlyArray.map((data, i) => {
        const prevData = i > 0 ? monthlyArray[i - 1] : null
        const growth = prevData && prevData.sales > 0 
          ? ((data.sales - prevData.sales) / prevData.sales) * 100 
          : 0
        return {
          month: `${data.year}-${String(data.month + 1).padStart(2, '0')}`,
          year: data.year,
          monthName: monthNames[data.month],
          sales: data.sales,
          transactions: data.transactions,
          growth: Math.round(growth * 10) / 10
        }
      })
    }

    // Quarterly breakdown (for yearly reports)
    let quarterlyBreakdown: QuarterlyBreakdown[] = []
    if (period === 'yearly') {
      const quarterlyData: Record<string, { sales: number; transactions: number; quarter: number; year: number }> = {}
      
      transactions.forEach(t => {
        const date = new Date(t.createdAt)
        const quarter = getQuarter(date.getMonth())
        const key = `${date.getFullYear()}-Q${quarter}`
        if (!quarterlyData[key]) {
          quarterlyData[key] = { sales: 0, transactions: 0, quarter, year: date.getFullYear() }
        }
        quarterlyData[key].sales += t.total
        quarterlyData[key].transactions += 1
      })
      
      const quarterlyArray = Object.values(quarterlyData).sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year
        return a.quarter - b.quarter
      })
      
      quarterlyBreakdown = quarterlyArray.map((data, i) => {
        const prevData = i > 0 ? quarterlyArray[i - 1] : null
        const growth = prevData && prevData.sales > 0 
          ? ((data.sales - prevData.sales) / prevData.sales) * 100 
          : 0
        return {
          quarter: data.quarter,
          year: data.year,
          label: `Q${data.quarter} ${data.year}`,
          sales: data.sales,
          transactions: data.transactions,
          growth: Math.round(growth * 10) / 10
        }
      })
    }

    // Category breakdown
    const categorySales: Record<string, { category: string; revenue: number; count: number }> = {}
    transactions.forEach(t => {
      t.TransactionItem?.forEach(item => {
        // Use product category if available, otherwise use 'Uncategorized'
        const category = 'Uncategorized' // Would need to join with Product to get actual category
        if (!categorySales[category]) {
          categorySales[category] = { category, revenue: 0, count: 0 }
        }
        categorySales[category].revenue += item.total
        categorySales[category].count += item.quantity
      })
    })
    
    const topCategories = Object.values(categorySales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map(cat => ({
        category: cat.category,
        revenue: cat.revenue,
        percentage: totalSales > 0 ? (cat.revenue / totalSales) * 100 : 0
      }))

    const response = {
      period,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      year,
      quarter: period === 'quarterly' ? quarter : undefined,
      metrics: {
        totalSales,
        transactionCount,
        avgTransaction,
        growth: Math.round(growth * 10) / 10
      },
      hourlyBreakdown,
      paymentMethods,
      topProducts,
      topCategories,
      dailyBreakdown,
      monthlyBreakdown,
      quarterlyBreakdown,
      comparison: {
        current: totalSales,
        previous: previousSales,
        change: growth
      },
      generatedAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: response
    })
  } catch (error) {
    console.error('Error generating sales report:', error)
    return NextResponse.json({ error: 'Failed to generate sales report' }, { status: 500 })
  }
}
