import { NextRequest, NextResponse } from 'next/server'

interface KPI {
  label: string
  value: string
  change: number
  changeLabel: string
  icon: string
}

interface Report {
  id: string
  title: string
  type: 'monthly' | 'quarterly' | 'annual' | 'custom'
  date: string
  status: 'ready' | 'generating' | 'scheduled' | 'failed'
  size: string
  downloadUrl: string
  description: string
}

interface MonthlyRevenue {
  month: string
  revenue: number
  expenses: number
  profit: number
}

interface CategorySales {
  category: string
  value: number
  percentage: number
  color: string
}

const mockKPIs: KPI[] = [
  { label: 'Monthly Revenue', value: 'R 127,450', change: 12.5, changeLabel: 'vs last month', icon: 'DollarSign' },
  { label: 'Growth Rate', value: '12.5%', change: 3.2, changeLabel: 'vs last month', icon: 'TrendingUp' },
  { label: 'Customer Count', value: '1,847', change: 8.3, changeLabel: 'vs last month', icon: 'Users' },
  { label: 'Avg Transaction', value: 'R 69.02', change: -2.1, changeLabel: 'vs last month', icon: 'BarChart3' },
  { label: 'Stock Turnover', value: '4.2x', change: 0.3, changeLabel: 'vs last month', icon: 'Package' },
  { label: 'Profit Margin', value: '23.4%', change: 1.8, changeLabel: 'vs last month', icon: 'PieChart' },
]

const mockMonthlyRevenue: MonthlyRevenue[] = [
  { month: 'Jan', revenue: 95200, expenses: 72000, profit: 23200 },
  { month: 'Feb', revenue: 101500, expenses: 75800, profit: 25700 },
  { month: 'Mar', revenue: 98700, expenses: 74100, profit: 24600 },
  { month: 'Apr', revenue: 108300, expenses: 79200, profit: 29100 },
  { month: 'May', revenue: 112800, expenses: 82400, profit: 30400 },
  { month: 'Jun', revenue: 105200, expenses: 78600, profit: 26600 },
  { month: 'Jul', revenue: 118900, expenses: 86400, profit: 32500 },
  { month: 'Aug', revenue: 115600, expenses: 84200, profit: 31400 },
  { month: 'Sep', revenue: 121400, expenses: 88100, profit: 33300 },
  { month: 'Oct', revenue: 119800, expenses: 87500, profit: 32300 },
  { month: 'Nov', revenue: 124300, expenses: 89900, profit: 34400 },
  { month: 'Dec', revenue: 127450, expenses: 97600, profit: 29850 },
]

const mockCategorySales: CategorySales[] = [
  { category: 'Groceries', value: 52400, percentage: 41.1, color: '#00897B' },
  { category: 'Beverages', value: 28300, percentage: 22.2, color: '#F57C00' },
  { category: 'Snacks', value: 19500, percentage: 15.3, color: '#5E35B1' },
  { category: 'Personal Care', value: 14200, percentage: 11.1, color: '#D81B60' },
  { category: 'Household', value: 13050, percentage: 10.3, color: '#455A64' },
]

const mockReports: Report[] = [
  {
    id: 'report-001',
    title: 'Monthly Performance Report - February 2025',
    type: 'monthly',
    date: '2025-03-01',
    status: 'ready',
    size: '2.4 MB',
    downloadUrl: '/api/reports/download/report-001',
    description: 'Comprehensive monthly performance overview including sales, expenses, and KPIs.',
  },
  {
    id: 'report-002',
    title: 'Q4 2024 Quarterly Review',
    type: 'quarterly',
    date: '2025-01-10',
    status: 'ready',
    size: '5.8 MB',
    downloadUrl: '/api/reports/download/report-002',
    description: 'Quarterly business review covering revenue trends, growth metrics, and strategic insights.',
  },
  {
    id: 'report-003',
    title: 'Annual Performance Summary 2024',
    type: 'annual',
    date: '2025-01-15',
    status: 'ready',
    size: '12.1 MB',
    downloadUrl: '/api/reports/download/report-003',
    description: 'Full year performance summary with year-over-year comparisons and annual KPIs.',
  },
  {
    id: 'report-004',
    title: 'Monthly Performance Report - January 2025',
    type: 'monthly',
    date: '2025-02-01',
    status: 'ready',
    size: '2.1 MB',
    downloadUrl: '/api/reports/download/report-004',
    description: 'Monthly performance overview for January 2025.',
  },
  {
    id: 'report-005',
    title: 'Inventory Analysis Report',
    type: 'custom',
    date: '2025-02-20',
    status: 'ready',
    size: '3.2 MB',
    downloadUrl: '/api/reports/download/report-005',
    description: 'Detailed inventory analysis including turnover rates, dead stock, and reorder recommendations.',
  },
  {
    id: 'report-006',
    title: 'Customer Insights Report',
    type: 'custom',
    date: '2025-02-25',
    status: 'ready',
    size: '1.8 MB',
    downloadUrl: '/api/reports/download/report-006',
    description: 'Customer behavior analysis, segmentation, and purchasing patterns.',
  },
  {
    id: 'report-007',
    title: 'Monthly Performance Report - March 2025',
    type: 'monthly',
    date: '2025-03-28',
    status: 'scheduled',
    size: '--',
    downloadUrl: '',
    description: 'Upcoming monthly performance report for March 2025.',
  },
  {
    id: 'report-008',
    title: 'Q1 2025 Quarterly Review',
    type: 'quarterly',
    date: '2025-04-05',
    status: 'scheduled',
    size: '--',
    downloadUrl: '',
    description: 'Upcoming quarterly review for Q1 2025.',
  },
]

export async function GET() {
  try {
    const latestRevenue = mockMonthlyRevenue[mockMonthlyRevenue.length - 1]
    const previousRevenue = mockMonthlyRevenue[mockMonthlyRevenue.length - 2]
    const totalAnnualRevenue = mockMonthlyRevenue.reduce((sum, m) => sum + m.revenue, 0)
    const totalAnnualExpenses = mockMonthlyRevenue.reduce((sum, m) => sum + m.expenses, 0)
    const totalAnnualProfit = mockMonthlyRevenue.reduce((sum, m) => sum + m.profit, 0)
    const avgMonthlyRevenue = Math.round(totalAnnualRevenue / 12)
    const revenueGrowth =
      ((latestRevenue.revenue - previousRevenue.revenue) / previousRevenue.revenue) * 100

    return NextResponse.json({
      success: true,
      data: {
        kpis: mockKPIs,
        financials: {
          monthlyRevenue: mockMonthlyRevenue,
          categorySales: mockCategorySales,
          summary: {
            totalAnnualRevenue,
            totalAnnualExpenses,
            totalAnnualProfit,
            avgMonthlyRevenue,
            revenueGrowth: Math.round(revenueGrowth * 10) / 10,
            profitMargin: Math.round((totalAnnualProfit / totalAnnualRevenue) * 1000) / 10,
          },
        },
        reports: mockReports,
        reportStats: {
          totalReports: mockReports.length,
          readyReports: mockReports.filter(r => r.status === 'ready').length,
          scheduledReports: mockReports.filter(r => r.status === 'scheduled').length,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching reporting data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reporting data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, title } = body

    if (!type || !title) {
      return NextResponse.json(
        { success: false, error: 'type and title are required' },
        { status: 400 }
      )
    }

    const validTypes = ['monthly', 'quarterly', 'annual', 'custom']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const newReport: Report = {
      id: `report-${Date.now()}`,
      title,
      type: type as Report['type'],
      date: new Date().toISOString().split('T')[0],
      status: 'generating',
      size: '--',
      downloadUrl: '',
      description: `Custom ${type} report generated on ${new Date().toLocaleDateString()}.`,
    }

    return NextResponse.json({
      success: true,
      data: {
        report: newReport,
        message: `Report "${title}" is being generated. It will be available shortly.`,
        estimatedReadyTime: '2-5 minutes',
      },
    })
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}
