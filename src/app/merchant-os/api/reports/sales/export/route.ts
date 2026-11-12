import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface ReportData {
  period: string
  periodStart: string
  periodEnd: string
  metrics: {
    totalSales: number
    transactionCount: number
    avgTransaction: number
    growth: number
  }
  hourlyBreakdown: { hour: string; amount: number; count: number }[]
  paymentMethods: { method: string; amount: number; count: number; percentage: number }[]
  topProducts: { id: string; name: string; sold: number; revenue: number }[]
  topCategories: { category: string; revenue: number; percentage: number }[]
  dailyBreakdown: { date: string; sales: number; transactions: number }[]
  monthlyBreakdown: { month: string; year: number; monthName: string; sales: number; transactions: number; growth: number }[]
  quarterlyBreakdown: { quarter: number; year: number; label: string; sales: number; transactions: number; growth: number }[]
  comparison: { current: number; previous: number; change: number }
  generatedAt: string
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

// Format currency
function formatCurrency(amount: number): string {
  return `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Generate CSV content
function generateCSV(data: ReportData): string {
  const rows: string[][] = []
  
  // Header
  rows.push(['Sales Report', '', '', '', ''])
  rows.push(['Period', data.period.toUpperCase(), '', '', ''])
  rows.push(['Generated', new Date(data.generatedAt).toLocaleString('en-ZA'), '', '', ''])
  rows.push(['', '', '', '', ''])
  
  // Summary Metrics
  rows.push(['SUMMARY METRICS', '', '', '', ''])
  rows.push(['Total Sales', formatCurrency(data.metrics.totalSales), '', '', ''])
  rows.push(['Transaction Count', data.metrics.transactionCount.toString(), '', '', ''])
  rows.push(['Average Transaction', formatCurrency(data.metrics.avgTransaction), '', '', ''])
  rows.push(['Growth', `${data.metrics.growth.toFixed(1)}%`, '', '', ''])
  rows.push(['', '', '', '', ''])
  
  // Comparison
  rows.push(['PERIOD COMPARISON', '', '', '', ''])
  rows.push(['Current Period', formatCurrency(data.comparison.current), '', '', ''])
  rows.push(['Previous Period', formatCurrency(data.comparison.previous), '', '', ''])
  rows.push(['Change', `${data.comparison.change.toFixed(1)}%`, '', '', ''])
  rows.push(['', '', '', '', ''])
  
  // Payment Methods
  if (data.paymentMethods.length > 0) {
    rows.push(['PAYMENT METHODS', '', '', '', ''])
    rows.push(['Method', 'Amount', 'Count', 'Percentage', ''])
    data.paymentMethods.forEach(pm => {
      rows.push([pm.method, formatCurrency(pm.amount), pm.count.toString(), `${pm.percentage.toFixed(1)}%`, ''])
    })
    rows.push(['', '', '', '', ''])
  }
  
  // Top Products
  if (data.topProducts.length > 0) {
    rows.push(['TOP PRODUCTS', '', '', '', ''])
    rows.push(['Product', 'Quantity Sold', 'Revenue', '', ''])
    data.topProducts.forEach(p => {
      rows.push([p.name, p.sold.toString(), formatCurrency(p.revenue), '', ''])
    })
    rows.push(['', '', '', '', ''])
  }
  
  // Daily Breakdown
  if (data.dailyBreakdown.length > 0) {
    rows.push(['DAILY BREAKDOWN', '', '', '', ''])
    rows.push(['Date', 'Sales', 'Transactions', '', ''])
    data.dailyBreakdown.forEach(d => {
      rows.push([d.date, formatCurrency(d.sales), d.transactions.toString(), '', ''])
    })
    rows.push(['', '', '', '', ''])
  }
  
  // Monthly Breakdown
  if (data.monthlyBreakdown.length > 0) {
    rows.push(['MONTHLY BREAKDOWN', '', '', '', ''])
    rows.push(['Month', 'Sales', 'Transactions', 'Growth', ''])
    data.monthlyBreakdown.forEach(m => {
      rows.push([`${m.monthName} ${m.year}`, formatCurrency(m.sales), m.transactions.toString(), `${m.growth.toFixed(1)}%`, ''])
    })
    rows.push(['', '', '', '', ''])
  }
  
  // Quarterly Breakdown
  if (data.quarterlyBreakdown.length > 0) {
    rows.push(['QUARTERLY BREAKDOWN', '', '', '', ''])
    rows.push(['Quarter', 'Sales', 'Transactions', 'Growth', ''])
    data.quarterlyBreakdown.forEach(q => {
      rows.push([q.label, formatCurrency(q.sales), q.transactions.toString(), `${q.growth.toFixed(1)}%`, ''])
    })
  }
  
  // Convert to CSV string
  return rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n')
}

// Generate simple HTML report for PDF conversion
function generateHTML(data: ReportData): string {
  const periodLabel = {
    daily: 'Daily Report',
    weekly: 'Weekly Report',
    monthly: 'Monthly Report',
    quarterly: 'Quarterly Report',
    yearly: 'Yearly Report'
  }[data.period] || 'Sales Report'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Sales Report</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
    h1 { color: #00897B; border-bottom: 2px solid #00897B; padding-bottom: 10px; }
    h2 { color: #424242; margin-top: 30px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
    .meta { color: #757575; font-size: 14px; margin-bottom: 20px; }
    .metrics { display: flex; gap: 20px; flex-wrap: wrap; margin: 20px 0; }
    .metric-box { background: #f5f5f5; padding: 15px; border-radius: 8px; min-width: 150px; }
    .metric-label { font-size: 12px; color: #757575; }
    .metric-value { font-size: 24px; font-weight: bold; color: #1A1A1A; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #f5f5f5; font-weight: 600; }
    .positive { color: #4CAF50; }
    .negative { color: #f44336; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #757575; }
  </style>
</head>
<body>
  <h1>${periodLabel}</h1>
  <div class="meta">
    <p>Period: ${new Date(data.periodStart).toLocaleDateString('en-ZA')} - ${new Date(data.periodEnd).toLocaleDateString('en-ZA')}</p>
    <p>Generated: ${new Date(data.generatedAt).toLocaleString('en-ZA')}</p>
  </div>
  
  <div class="metrics">
    <div class="metric-box">
      <div class="metric-label">Total Sales</div>
      <div class="metric-value">${formatCurrency(data.metrics.totalSales)}</div>
    </div>
    <div class="metric-box">
      <div class="metric-label">Transactions</div>
      <div class="metric-value">${data.metrics.transactionCount}</div>
    </div>
    <div class="metric-box">
      <div class="metric-label">Avg. Transaction</div>
      <div class="metric-value">${formatCurrency(data.metrics.avgTransaction)}</div>
    </div>
    <div class="metric-box">
      <div class="metric-label">Growth</div>
      <div class="metric-value ${data.metrics.growth >= 0 ? 'positive' : 'negative'}">
        ${data.metrics.growth >= 0 ? '+' : ''}${data.metrics.growth.toFixed(1)}%
      </div>
    </div>
  </div>
  
  <h2>Period Comparison</h2>
  <table>
    <tr>
      <th>Previous Period</th>
      <th>Change</th>
      <th>Current Period</th>
    </tr>
    <tr>
      <td>${formatCurrency(data.comparison.previous)}</td>
      <td class="${data.comparison.change >= 0 ? 'positive' : 'negative'}">
        ${data.comparison.change >= 0 ? '+' : ''}${data.comparison.change.toFixed(1)}%
      </td>
      <td><strong>${formatCurrency(data.comparison.current)}</strong></td>
    </tr>
  </table>
  
  ${data.paymentMethods.length > 0 ? `
  <h2>Payment Methods</h2>
  <table>
    <tr><th>Method</th><th>Amount</th><th>Count</th><th>Percentage</th></tr>
    ${data.paymentMethods.map(pm => `
      <tr>
        <td>${pm.method}</td>
        <td>${formatCurrency(pm.amount)}</td>
        <td>${pm.count}</td>
        <td>${pm.percentage.toFixed(1)}%</td>
      </tr>
    `).join('')}
  </table>
  ` : ''}
  
  ${data.topProducts.length > 0 ? `
  <h2>Top Products</h2>
  <table>
    <tr><th>Product</th><th>Qty Sold</th><th>Revenue</th></tr>
    ${data.topProducts.map(p => `
      <tr>
        <td>${p.name}</td>
        <td>${p.sold}</td>
        <td>${formatCurrency(p.revenue)}</td>
      </tr>
    `).join('')}
  </table>
  ` : ''}
  
  ${data.dailyBreakdown.length > 0 ? `
  <h2>Daily Breakdown</h2>
  <table>
    <tr><th>Date</th><th>Sales</th><th>Transactions</th></tr>
    ${data.dailyBreakdown.map(d => `
      <tr>
        <td>${d.date}</td>
        <td>${formatCurrency(d.sales)}</td>
        <td>${d.transactions}</td>
      </tr>
    `).join('')}
  </table>
  ` : ''}
  
  ${data.monthlyBreakdown.length > 0 ? `
  <h2>Monthly Breakdown</h2>
  <table>
    <tr><th>Month</th><th>Sales</th><th>Transactions</th><th>Growth</th></tr>
    ${data.monthlyBreakdown.map(m => `
      <tr>
        <td>${m.monthName} ${m.year}</td>
        <td>${formatCurrency(m.sales)}</td>
        <td>${m.transactions}</td>
        <td class="${m.growth >= 0 ? 'positive' : 'negative'}">${m.growth >= 0 ? '+' : ''}${m.growth.toFixed(1)}%</td>
      </tr>
    `).join('')}
  </table>
  ` : ''}
  
  ${data.quarterlyBreakdown.length > 0 ? `
  <h2>Quarterly Breakdown</h2>
  <table>
    <tr><th>Quarter</th><th>Sales</th><th>Transactions</th><th>Growth</th></tr>
    ${data.quarterlyBreakdown.map(q => `
      <tr>
        <td>${q.label}</td>
        <td>${formatCurrency(q.sales)}</td>
        <td>${q.transactions}</td>
        <td class="${q.growth >= 0 ? 'positive' : 'negative'}">${q.growth >= 0 ? '+' : ''}${q.growth.toFixed(1)}%</td>
      </tr>
    `).join('')}
  </table>
  ` : ''}
  
  <div class="footer">
    <p>Generated by Merchant OS - Sales Report</p>
  </div>
</body>
</html>
`
}

// Generate Excel-compatible XML (SpreadsheetML)
function generateExcel(data: ReportData): string {
  const escapeXml = (str: string) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  
  let rows = ''
  
  // Title
  rows += `<Row><Cell><Data ss:Type="String">Sales Report - ${data.period.toUpperCase()}</Data></Cell></Row>`
  rows += `<Row><Cell><Data ss:Type="String">Generated: ${new Date(data.generatedAt).toLocaleString('en-ZA')}</Data></Cell></Row>`
  rows += `<Row></Row>`
  
  // Metrics
  rows += `<Row><Cell><Data ss:Type="String">SUMMARY METRICS</Data></Cell></Row>`
  rows += `<Row>`
  rows += `<Cell><Data ss:Type="String">Total Sales</Data></Cell>`
  rows += `<Cell><Data ss:Type="Number">${data.metrics.totalSales}</Data></Cell>`
  rows += `</Row>`
  rows += `<Row>`
  rows += `<Cell><Data ss:Type="String">Transactions</Data></Cell>`
  rows += `<Cell><Data ss:Type="Number">${data.metrics.transactionCount}</Data></Cell>`
  rows += `</Row>`
  rows += `<Row>`
  rows += `<Cell><Data ss:Type="String">Avg Transaction</Data></Cell>`
  rows += `<Cell><Data ss:Type="Number">${data.metrics.avgTransaction}</Data></Cell>`
  rows += `</Row>`
  rows += `<Row>`
  rows += `<Cell><Data ss:Type="String">Growth</Data></Cell>`
  rows += `<Cell><Data ss:Type="Number">${data.metrics.growth}</Data></Cell>`
  rows += `</Row>`
  rows += `<Row></Row>`
  
  // Payment Methods
  if (data.paymentMethods.length > 0) {
    rows += `<Row><Cell><Data ss:Type="String">PAYMENT METHODS</Data></Cell></Row>`
    rows += `<Row>`
    rows += `<Cell><Data ss:Type="String">Method</Data></Cell>`
    rows += `<Cell><Data ss:Type="String">Amount</Data></Cell>`
    rows += `<Cell><Data ss:Type="Number">Count</Data></Cell>`
    rows += `<Cell><Data ss:Type="Number">Percentage</Data></Cell>`
    rows += `</Row>`
    data.paymentMethods.forEach(pm => {
      rows += `<Row>`
      rows += `<Cell><Data ss:Type="String">${pm.method}</Data></Cell>`
      rows += `<Cell><Data ss:Type="Number">${pm.amount}</Data></Cell>`
      rows += `<Cell><Data ss:Type="Number">${pm.count}</Data></Cell>`
      rows += `<Cell><Data ss:Type="Number">${pm.percentage}</Data></Cell>`
      rows += `</Row>`
    })
    rows += `<Row></Row>`
  }
  
  // Top Products
  if (data.topProducts.length > 0) {
    rows += `<Row><Cell><Data ss:Type="String">TOP PRODUCTS</Data></Cell></Row>`
    rows += `<Row>`
    rows += `<Cell><Data ss:Type="String">Product</Data></Cell>`
    rows += `<Cell><Data ss:Type="String">Quantity</Data></Cell>`
    rows += `<Cell><Data ss:Type="String">Revenue</Data></Cell>`
    rows += `</Row>`
    data.topProducts.forEach(p => {
      rows += `<Row>`
      rows += `<Cell><Data ss:Type="String">${escapeXml(p.name)}</Data></Cell>`
      rows += `<Cell><Data ss:Type="Number">${p.sold}</Data></Cell>`
      rows += `<Cell><Data ss:Type="Number">${p.revenue}</Data></Cell>`
      rows += `</Row>`
    })
    rows += `<Row></Row>`
  }
  
  // Daily Breakdown
  if (data.dailyBreakdown.length > 0) {
    rows += `<Row><Cell><Data ss:Type="String">DAILY BREAKDOWN</Data></Cell></Row>`
    rows += `<Row>`
    rows += `<Cell><Data ss:Type="String">Date</Data></Cell>`
    rows += `<Cell><Data ss:Type="String">Sales</Data></Cell>`
    rows += `<Cell><Data ss:Type="Number">Transactions</Data></Cell>`
    rows += `</Row>`
    data.dailyBreakdown.forEach(d => {
      rows += `<Row>`
      rows += `<Cell><Data ss:Type="String">${d.date}</Data></Cell>`
      rows += `<Cell><Data ss:Type="Number">${d.sales}</Data></Cell>`
      rows += `<Cell><Data ss:Type="Number">${d.transactions}</Data></Cell>`
      rows += `</Row>`
    })
    rows += `<Row></Row>`
  }
  
  // Monthly Breakdown
  if (data.monthlyBreakdown.length > 0) {
    rows += `<Row><Cell><Data ss:Type="String">MONTHLY BREAKDOWN</Data></Cell></Row>`
    rows += `<Row>`
    rows += `<Cell><Data ss:Type="String">Month</Data></Cell>`
    rows += `<Cell><Data ss:Type="String">Sales</Data></Cell>`
    rows += `<Cell><Data ss:Type="Number">Transactions</Data></Cell>`
    rows += `<Cell><Data ss:Type="Number">Growth</Data></Cell>`
    rows += `</Row>`
    data.monthlyBreakdown.forEach(m => {
      rows += `<Row>`
      rows += `<Cell><Data ss:Type="String">${m.monthName} ${m.year}</Data></Cell>`
      rows += `<Cell><Data ss:Type="Number">${m.sales}</Data></Cell>`
      rows += `<Cell><Data ss:Type="Number">${m.transactions}</Data></Cell>`
      rows += `<Cell><Data ss:Type="Number">${m.growth}</Data></Cell>`
      rows += `</Row>`
    })
    rows += `<Row></Row>`
  }
  
  // Quarterly Breakdown
  if (data.quarterlyBreakdown.length > 0) {
    rows += `<Row><Cell><Data ss:Type="String">QUARTERLY BREAKDOWN</Data></Cell></Row>`
    rows += `<Row>`
    rows += `<Cell><Data ss:Type="String">Quarter</Data></Cell>`
    rows += `<Cell><Data ss:Type="String">Sales</Data></Cell>`
    rows += `<Cell><Data ss:Type="Number">Transactions</Data></Cell>`
    rows += `<Cell><Data ss:Type="Number">Growth</Data></Cell>`
    rows += `</Row>`
    data.quarterlyBreakdown.forEach(q => {
      rows += `<Row>`
      rows += `<Cell><Data ss:Type="String">${q.label}</Data></Cell>`
      rows += `<Cell><Data ss:Type="Number">${q.sales}</Data></Cell>`
      rows += `<Cell><Data ss:Type="Number">${q.transactions}</Data></Cell>`
      rows += `<Cell><Data ss:Type="Number">${q.growth}</Data></Cell>`
      rows += `</Row>`
    })
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Sales Report">
    <Table>
      ${rows}
    </Table>
  </Worksheet>
</Workbook>`
}

// GET /api/reports/sales/export - Export sales report
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const format = searchParams.get('format') || 'csv' // csv, excel, pdf
    const period = searchParams.get('period') || 'daily'
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

    // Fetch transactions
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

    // Build report data
    const totalSales = transactions.reduce((sum, t) => sum + t.total, 0)
    const previousSales = previousTransactions.reduce((sum, t) => sum + t.total, 0)
    const transactionCount = transactions.length
    const avgTransaction = transactionCount > 0 ? totalSales / transactionCount : 0
    const growth = previousSales > 0 ? ((totalSales - previousSales) / previousSales) * 100 : 0

    // Payment methods
    const paymentMethodData: Record<string, { amount: number; count: number }> = {}
    transactions.forEach(t => {
      const method = t.paymentMethod || 'cash'
      if (!paymentMethodData[method]) {
        paymentMethodData[method] = { amount: 0, count: 0 }
      }
      paymentMethodData[method].amount += t.total
      paymentMethodData[method].count += 1
    })
    
    const paymentMethods = Object.entries(paymentMethodData)
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
    
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map((p, i) => ({ id: `prod-${i}`, ...p }))

    // Daily breakdown
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
        .map(([date, data]) => ({ date, sales: data.sales, transactions: data.transactions }))
        .sort((a, b) => a.date.localeCompare(b.date))
    }

    // Monthly breakdown
    let monthlyBreakdown: { month: string; year: number; monthName: string; sales: number; transactions: number; growth: number }[] = []
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
        const growth = prevData && prevData.sales > 0 ? ((data.sales - prevData.sales) / prevData.sales) * 100 : 0
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

    // Quarterly breakdown
    let quarterlyBreakdown: { quarter: number; year: number; label: string; sales: number; transactions: number; growth: number }[] = []
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
        const growth = prevData && prevData.sales > 0 ? ((data.sales - prevData.sales) / prevData.sales) * 100 : 0
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

    const reportData: ReportData = {
      period,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      metrics: {
        totalSales,
        transactionCount,
        avgTransaction,
        growth: Math.round(growth * 10) / 10
      },
      hourlyBreakdown: [],
      paymentMethods,
      topProducts,
      topCategories: [],
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

    // Generate file content and headers based on format
    let content: string
    let contentType: string
    let filename: string

    switch (format) {
      case 'excel':
        content = generateExcel(reportData)
        contentType = 'application/vnd.ms-excel'
        filename = `sales-report-${period}-${new Date().toISOString().split('T')[0]}.xls`
        break
      case 'pdf':
        content = generateHTML(reportData)
        contentType = 'text/html'
        filename = `sales-report-${period}-${new Date().toISOString().split('T')[0]}.html`
        break
      case 'csv':
      default:
        content = generateCSV(reportData)
        contentType = 'text/csv'
        filename = `sales-report-${period}-${new Date().toISOString().split('T')[0]}.csv`
    }

    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    })
  } catch (error) {
    console.error('Error exporting sales report:', error)
    return NextResponse.json({ error: 'Failed to export sales report' }, { status: 500 })
  }
}
