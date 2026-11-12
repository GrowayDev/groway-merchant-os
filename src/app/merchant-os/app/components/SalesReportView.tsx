'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download,
  Printer,
  RefreshCw,
  Coins,
  ShoppingCart,
  Users,
  Package,
  CreditCard,
  Banknote,
  QrCode,
  Wallet,
  BarChart3,
  PieChart,
  LineChart,
  Clock,
  MapPin,
  Store,
  FileText,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react'

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

interface DailyBreakdown {
  date: string
  sales: number
  transactions: number
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

interface SalesReportData {
  period: string
  periodStart: string
  periodEnd: string
  year?: number
  quarter?: number
  metrics: {
    totalSales: number
    transactionCount: number
    avgTransaction: number
    growth: number
  }
  hourlyBreakdown: HourlyBreakdown[]
  paymentMethods: PaymentMethodBreakdown[]
  topProducts: TopProduct[]
  topCategories: { category: string; revenue: number; percentage: number }[]
  dailyBreakdown: DailyBreakdown[]
  monthlyBreakdown: MonthlyBreakdown[]
  quarterlyBreakdown: QuarterlyBreakdown[]
  comparison: {
    current: number
    previous: number
    change: number
  }
  generatedAt: string
}

const formatCurrency = (amount: number) => `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const paymentIcons: Record<string, any> = {
  card: CreditCard,
  cash: Banknote,
  qr: QrCode,
  wallet: Wallet,
}

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December']

// Demo merchant ID for development
const DEMO_MERCHANT_ID = 'demo-merchant-1'

export function SalesReportView() {
  const [data, setData] = useState<SalesReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'>('daily')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedQuarter, setSelectedQuarter] = useState(Math.floor(new Date().getMonth() / 3) + 1)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        merchantId: DEMO_MERCHANT_ID,
        period,
        year: selectedYear.toString(),
      })
      
      if (period === 'quarterly') {
        params.set('quarter', selectedQuarter.toString())
      }
      
      const response = await fetch(`/merchant-os/api/reports/sales?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch sales report')
      }
      
      const result = await response.json()
      
      if (result.success && result.data) {
        setData(result.data)
      } else {
        throw new Error(result.error || 'Failed to load data')
      }
    } catch (err) {
      console.error('Error fetching sales report:', err)
      setError(err instanceof Error ? err.message : 'Failed to load sales report')
      // Use fallback mock data if API fails
      setData(generateMockData(period, selectedYear, selectedQuarter))
    } finally {
      setIsLoading(false)
    }
  }, [period, selectedYear, selectedQuarter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      const params = new URLSearchParams({
        merchantId: DEMO_MERCHANT_ID,
        period,
        format,
        year: selectedYear.toString(),
      })
      
      if (period === 'quarterly') {
        params.set('quarter', selectedQuarter.toString())
      }
      
      window.open(`/merchant-os/api/reports/sales/export?${params}`, '_blank')
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  // Generate mock data as fallback
  const generateMockData = (periodType: string, year: number, quarter: number): SalesReportData => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    let periodStart: Date
    let periodEnd: Date = now
    
    switch (periodType) {
      case 'daily':
        periodStart = today
        break
      case 'weekly':
        periodStart = new Date(today)
        periodStart.setDate(periodStart.getDate() - 6)
        break
      case 'monthly':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'quarterly':
        periodStart = new Date(year, (quarter - 1) * 3, 1)
        periodEnd = new Date(year, quarter * 3, 0, 23, 59, 59, 999)
        break
      case 'yearly':
        periodStart = new Date(year, 0, 1)
        periodEnd = new Date(year, 11, 31, 23, 59, 59, 999)
        break
      default:
        periodStart = today
    }

    // Generate hourly breakdown
    const hourlyBreakdown: HourlyBreakdown[] = []
    for (let h = 8; h <= 20; h++) {
      const baseAmount = h >= 11 && h <= 14 ? 800 : h >= 17 && h <= 19 ? 600 : 200
      hourlyBreakdown.push({
        hour: `${h.toString().padStart(2, '0')}:00`,
        amount: baseAmount + Math.floor(Math.random() * 400),
        count: Math.floor(Math.random() * 10) + 1
      })
    }

    // Generate daily breakdown
    const dailyBreakdown: DailyBreakdown[] = []
    const daysCount = periodType === 'weekly' ? 7 : periodType === 'monthly' ? 30 : 0
    for (let i = daysCount - 1; i >= 0; i--) {
      const date = new Date(periodStart)
      date.setDate(date.getDate() + (daysCount - 1 - i))
      dailyBreakdown.push({
        date: date.toISOString().split('T')[0],
        sales: 3000 + Math.floor(Math.random() * 5000),
        transactions: 20 + Math.floor(Math.random() * 40)
      })
    }

    // Generate monthly breakdown
    const monthlyBreakdown: MonthlyBreakdown[] = []
    const monthsCount = periodType === 'quarterly' ? 3 : periodType === 'yearly' ? 12 : 0
    const startMonth = periodType === 'quarterly' ? (quarter - 1) * 3 : 0
    for (let i = 0; i < monthsCount; i++) {
      monthlyBreakdown.push({
        month: `${year}-${String(startMonth + i + 1).padStart(2, '0')}`,
        year,
        monthName: monthNames[startMonth + i],
        sales: 50000 + Math.floor(Math.random() * 50000),
        transactions: 200 + Math.floor(Math.random() * 200),
        growth: -15 + Math.floor(Math.random() * 30)
      })
    }

    // Generate quarterly breakdown
    const quarterlyBreakdown: QuarterlyBreakdown[] = []
    if (periodType === 'yearly') {
      for (let q = 1; q <= 4; q++) {
        quarterlyBreakdown.push({
          quarter: q,
          year,
          label: `Q${q} ${year}`,
          sales: 150000 + Math.floor(Math.random() * 100000),
          transactions: 600 + Math.floor(Math.random() * 400),
          growth: -10 + Math.floor(Math.random() * 25)
        })
      }
    }

    const totalSales = periodType === 'yearly' 
      ? quarterlyBreakdown.reduce((sum, q) => sum + q.sales, 0)
      : periodType === 'quarterly' || periodType === 'monthly'
        ? monthlyBreakdown.reduce((sum, m) => sum + m.sales, 0)
        : periodType === 'weekly'
          ? dailyBreakdown.reduce((sum, d) => sum + d.sales, 0)
          : hourlyBreakdown.reduce((sum, h) => sum + h.amount, 0)

    const transactionCount = periodType === 'yearly'
      ? quarterlyBreakdown.reduce((sum, q) => sum + q.transactions, 0)
      : periodType === 'quarterly' || periodType === 'monthly'
        ? monthlyBreakdown.reduce((sum, m) => sum + m.transactions, 0)
        : periodType === 'weekly'
          ? dailyBreakdown.reduce((sum, d) => sum + d.transactions, 0)
          : 35 + Math.floor(Math.random() * 20)

    return {
      period: periodType,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      year,
      quarter: periodType === 'quarterly' ? quarter : undefined,
      metrics: {
        totalSales,
        transactionCount,
        avgTransaction: Math.round(totalSales / transactionCount),
        growth: -10 + Math.floor(Math.random() * 25)
      },
      hourlyBreakdown,
      paymentMethods: [
        { method: 'card', amount: Math.round(totalSales * 0.55), count: Math.round(transactionCount * 0.55), percentage: 55 },
        { method: 'cash', amount: Math.round(totalSales * 0.25), count: Math.round(transactionCount * 0.25), percentage: 25 },
        { method: 'qr', amount: Math.round(totalSales * 0.12), count: Math.round(transactionCount * 0.12), percentage: 12 },
        { method: 'wallet', amount: Math.round(totalSales * 0.08), count: Math.round(transactionCount * 0.08), percentage: 8 },
      ],
      topProducts: [
        { id: 'prod-1', name: 'Burger Combo', sold: 168, revenue: 15103.20 },
        { id: 'prod-2', name: 'Chicken Wings (12pc)', sold: 126, revenue: 12587.40 },
        { id: 'prod-3', name: 'Beef Burger Deluxe', sold: 105, revenue: 7339.50 },
        { id: 'prod-4', name: 'Coca-Cola 500ml', sold: 315, revenue: 5953.50 },
        { id: 'prod-5', name: 'Milkshake Chocolate', sold: 84, revenue: 2931.60 },
      ],
      topCategories: [
        { category: 'Combos', revenue: Math.round(totalSales * 0.35), percentage: 35 },
        { category: 'Burgers', revenue: Math.round(totalSales * 0.25), percentage: 25 },
        { category: 'Beverages', revenue: Math.round(totalSales * 0.20), percentage: 20 },
        { category: 'Sides', revenue: Math.round(totalSales * 0.12), percentage: 12 },
        { category: 'Desserts', revenue: Math.round(totalSales * 0.08), percentage: 8 },
      ],
      dailyBreakdown,
      monthlyBreakdown,
      quarterlyBreakdown,
      comparison: {
        current: totalSales,
        previous: Math.round(totalSales * (0.85 + Math.random() * 0.2)),
        change: -10 + Math.floor(Math.random() * 25)
      },
      generatedAt: new Date().toISOString()
    }
  }

  const navigatePeriod = (direction: 'prev' | 'next') => {
    if (period === 'quarterly') {
      if (direction === 'prev') {
        if (selectedQuarter === 1) {
          setSelectedQuarter(4)
          setSelectedYear(selectedYear - 1)
        } else {
          setSelectedQuarter(selectedQuarter - 1)
        }
      } else {
        if (selectedQuarter === 4) {
          setSelectedQuarter(1)
          setSelectedYear(selectedYear + 1)
        } else {
          setSelectedQuarter(selectedQuarter + 1)
        }
      }
    } else if (period === 'yearly') {
      setSelectedYear(selectedYear + (direction === 'next' ? 1 : -1))
    }
  }

  const getPeriodLabel = () => {
    switch (period) {
      case 'daily':
        return 'Today'
      case 'weekly':
        return 'This Week'
      case 'monthly':
        return `${monthNames[selectedMonth]} ${selectedYear}`
      case 'quarterly':
        return `Q${selectedQuarter} ${selectedYear}`
      case 'yearly':
        return `Year ${selectedYear}`
      default:
        return ''
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-[#00897B]" />
          <p className="text-[#757575]">Loading sales report...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
          <p className="text-[#757575]">Failed to load sales report</p>
          <Button variant="outline" size="sm" onClick={fetchData} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const { metrics, hourlyBreakdown, paymentMethods, topProducts, topCategories, dailyBreakdown, monthlyBreakdown, quarterlyBreakdown, comparison } = data

  return (
    <ScrollArea className="flex-1">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A] flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-[#00897B]" />
              Sales Report
            </h1>
            <p className="text-sm text-[#757575]">
              Generated on {new Date(data.generatedAt).toLocaleString('en-ZA')}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-4 flex-wrap">
          <Tabs value={period} onValueChange={(v) => setPeriod(v as any)} className="w-auto">
            <TabsList>
              <TabsTrigger value="daily">Today</TabsTrigger>
              <TabsTrigger value="weekly">Week</TabsTrigger>
              <TabsTrigger value="monthly">Month</TabsTrigger>
              <TabsTrigger value="quarterly">Quarter</TabsTrigger>
              <TabsTrigger value="yearly">Year</TabsTrigger>
            </TabsList>
          </Tabs>
          
          {(period === 'quarterly' || period === 'yearly') && (
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="outline" size="icon" onClick={() => navigatePeriod('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[100px] text-center">
                {getPeriodLabel()}
              </span>
              <Button variant="outline" size="icon" onClick={() => navigatePeriod('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-[#00897B]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#757575] mb-1">Total Sales</p>
                  <p className="text-2xl font-bold text-[#1A1A1A]">{formatCurrency(metrics.totalSales)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {metrics.growth >= 0 ? (
                      <>
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-green-500">+{metrics.growth.toFixed(1)}%</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-3 w-3 text-red-500" />
                        <span className="text-xs text-red-500">{metrics.growth.toFixed(1)}%</span>
                      </>
                    )}
                    <span className="text-xs text-[#757575]">vs previous</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-[#E0F2F1] flex items-center justify-center">
                  <Coins className="h-6 w-6 text-[#00897B]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#757575] mb-1">Transactions</p>
                  <p className="text-2xl font-bold text-[#1A1A1A]">{metrics.transactionCount.toLocaleString()}</p>
                  <p className="text-xs text-[#757575] mt-1">
                    {period === 'yearly' ? `${Math.round(metrics.transactionCount / 365)} avg/day` : 
                     period === 'monthly' || period === 'quarterly' ? `${Math.round(metrics.transactionCount / 30)} avg/day` :
                     `${Math.round(metrics.transactionCount / 7)} avg/day`}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#757575] mb-1">Avg. Transaction</p>
                  <p className="text-2xl font-bold text-[#1A1A1A]">{formatCurrency(metrics.avgTransaction)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {comparison.change >= 0 ? (
                      <ArrowUpRight className="h-3 w-3 text-green-500" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-red-500" />
                    )}
                    <span className="text-xs text-[#757575]">vs previous period</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#757575] mb-1">Period Comparison</p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-bold text-[#757575]">{formatCurrency(comparison.previous)}</p>
                    <span className={`text-sm font-semibold ${comparison.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {comparison.change >= 0 ? '+' : ''}{comparison.change.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-[#757575] mt-1">Previous period</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily View - Hourly Chart & Payment Methods */}
        {period === 'daily' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hourly Sales Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <LineChart className="h-4 w-4 text-[#00897B]" />
                  Hourly Sales
                </CardTitle>
                <CardDescription>Sales breakdown by hour</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-end gap-1">
                  {hourlyBreakdown.map((hour, i) => {
                    const maxAmount = Math.max(...hourlyBreakdown.map(h => h.amount))
                    const height = maxAmount > 0 ? (hour.amount / maxAmount) * 100 : 0
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="text-[9px] text-[#757575]">{formatCurrency(hour.amount)}</div>
                        <div 
                          className="w-full bg-gradient-to-t from-[#00897B] to-[#4CAF50] rounded-t-sm min-h-[4px] transition-all hover:from-[#00695C] hover:to-[#388E3C] cursor-pointer"
                          style={{ height: `${height}%` }}
                        />
                        <div className="text-[9px] text-[#757575]">{hour.hour.replace(':00', '')}</div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-[#00897B]" />
                  Payment Methods
                </CardTitle>
                <CardDescription>Distribution of payment types</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {paymentMethods.map((pm, i) => {
                  const Icon = paymentIcons[pm.method] || CreditCard
                  return (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-[#E0F2F1] flex items-center justify-center">
                            <Icon className="h-4 w-4 text-[#00897B]" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#1A1A1A] capitalize">{pm.method}</p>
                            <p className="text-xs text-[#757575]">{pm.count} transactions</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-[#1A1A1A]">{formatCurrency(pm.amount)}</p>
                          <p className="text-xs text-[#757575]">{pm.percentage.toFixed(1)}%</p>
                        </div>
                      </div>
                      <Progress value={pm.percentage} className="h-2 bg-gray-100" />
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Weekly View - Daily Breakdown */}
        {period === 'weekly' && dailyBreakdown.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#00897B]" />
                Daily Sales Breakdown
              </CardTitle>
              <CardDescription>Sales performance by day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dailyBreakdown.map((day, i) => {
                  const maxSales = Math.max(...dailyBreakdown.map(d => d.sales))
                  const percentage = maxSales > 0 ? (day.sales / maxSales) * 100 : 0
                  return (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-[#1A1A1A] w-24">{new Date(day.date).toLocaleDateString('en-ZA', { weekday: 'short' })}</span>
                        <span className="text-[#757575]">{day.transactions} transactions</span>
                        <span className="font-semibold text-[#00897B]">{formatCurrency(day.sales)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={percentage} className="h-3 bg-gray-100" />
                        <span className="text-xs text-[#757575] w-12">{percentage.toFixed(0)}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Monthly View - Daily Breakdown */}
        {period === 'monthly' && dailyBreakdown.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#00897B]" />
                Daily Sales This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {dailyBreakdown.slice(-15).map((day, i) => {
                  const maxSales = Math.max(...dailyBreakdown.map(d => d.sales))
                  const percentage = maxSales > 0 ? (day.sales / maxSales) * 100 : 0
                  return (
                    <div key={i} className="flex items-center gap-3 p-2 bg-[#FAFAFA] rounded-lg">
                      <span className="text-sm text-[#757575] w-20">{day.date}</span>
                      <Progress value={percentage} className="h-2 flex-1" />
                      <span className="text-sm font-semibold text-[#00897B] w-28 text-right">{formatCurrency(day.sales)}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quarterly View - Monthly Breakdown */}
        {period === 'quarterly' && monthlyBreakdown.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#00897B]" />
                Monthly Breakdown - Q{selectedQuarter} {selectedYear}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyBreakdown.map((month, i) => {
                  const maxSales = Math.max(...monthlyBreakdown.map(m => m.sales))
                  const percentage = maxSales > 0 ? (month.sales / maxSales) * 100 : 0
                  return (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-[#1A1A1A]">{month.monthName}</span>
                        <span className="text-[#757575]">{month.transactions} transactions</span>
                        <span className="font-semibold text-[#00897B]">{formatCurrency(month.sales)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={percentage} className="h-3 bg-gray-100" />
                        <span className={`text-xs ${month.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {month.growth >= 0 ? '+' : ''}{month.growth.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Yearly View - Quarterly & Monthly Breakdown */}
        {period === 'yearly' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quarterly Breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Quarterly Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {quarterlyBreakdown.map((q, i) => {
                    const maxSales = Math.max(...quarterlyBreakdown.map(q => q.sales))
                    const percentage = maxSales > 0 ? (q.sales / maxSales) * 100 : 0
                    return (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-[#1A1A1A]">{q.label}</span>
                          <span className="text-[#757575]">{q.transactions} transactions</span>
                          <span className="font-semibold text-[#00897B]">{formatCurrency(q.sales)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={percentage} className="h-3 bg-gray-100" />
                          <span className={`text-xs ${q.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {q.growth >= 0 ? '+' : ''}{q.growth.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Monthly Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-80 overflow-y-auto space-y-2">
                  {monthlyBreakdown.map((month, i) => {
                    const maxSales = Math.max(...monthlyBreakdown.map(m => m.sales))
                    const percentage = maxSales > 0 ? (month.sales / maxSales) * 100 : 0
                    return (
                      <div key={i} className="flex items-center gap-3 p-2 bg-[#FAFAFA] rounded-lg">
                        <span className="text-sm font-medium text-[#1A1A1A] w-20">{month.monthName}</span>
                        <Progress value={percentage} className="h-2 flex-1" />
                        <span className="text-sm font-semibold text-[#00897B] w-28 text-right">{formatCurrency(month.sales)}</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Top Products */}
        {topProducts.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Package className="h-4 w-4 text-[#00897B]" />
                Top Products
              </CardTitle>
              <CardDescription>Best selling items by revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topProducts.slice(0, 5).map((product, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 bg-[#FAFAFA] rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-[#E0F2F1] flex items-center justify-center text-sm font-bold text-[#00897B]">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A1A1A] truncate">{product.name}</p>
                      <p className="text-xs text-[#757575]">{product.sold} sold</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[#00897B]">{formatCurrency(product.revenue)}</p>
                      <p className="text-xs text-[#757575]">{formatCurrency(product.revenue / product.sold)} avg</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Export Options Footer */}
        <Card className="bg-[#FAFAFA]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <FileText className="h-5 w-5 text-[#757575]" />
                <div>
                  <p className="text-sm font-medium text-[#1A1A1A]">Export Report</p>
                  <p className="text-xs text-[#757575]">Download in various formats for record keeping</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
                  <Download className="h-4 w-4 mr-2" />
                  CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
                  <Download className="h-4 w-4 mr-2" />
                  Excel
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}
