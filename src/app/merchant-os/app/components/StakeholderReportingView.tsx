'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileBarChart,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  DollarSign,
  Users,
  Package,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
  Share2,
  FileText,
  Clock,
  ChevronRight,
  Eye,
  CheckCircle,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'

// Types
interface KPI {
  label: string
  value: string
  change: number
  icon: React.ReactNode
  trend: 'up' | 'down'
}

interface ReportType {
  id: string
  name: string
  description: string
  lastGenerated: string
  frequency: 'Monthly' | 'Quarterly' | 'Annual' | 'Custom'
}

interface ReportRecord {
  id: string
  name: string
  type: string
  date: string
  status: 'ready' | 'generating' | 'scheduled'
  size: string
}

interface MonthlyRevenue {
  month: string
  revenue: number
  expenses: number
  profit: number
}

// Mock Data
const kpis: KPI[] = [
  { label: 'Monthly Revenue', value: 'R 85,420', change: 12.5, icon: <DollarSign className="h-5 w-5 text-[#00897B]" />, trend: 'up' },
  { label: 'Growth Rate', value: '18.3%', change: 3.2, icon: <TrendingUp className="h-5 w-5 text-green-600" />, trend: 'up' },
  { label: 'Customer Count', value: '2,847', change: 8.7, icon: <Users className="h-5 w-5 text-blue-600" />, trend: 'up' },
  { label: 'Avg Transaction', value: 'R 30.00', change: -2.1, icon: <BarChart3 className="h-5 w-5 text-purple-600" />, trend: 'down' },
]

const metricCards = [
  { label: 'Revenue', value: 'R 1,025,040', change: 12.5, period: 'Last 12 months', icon: DollarSign, color: 'bg-[#00897B]/10 text-[#00897B]' },
  { label: 'Expenses', value: 'R 718,250', change: 5.2, period: 'Last 12 months', icon: Package, color: 'bg-rose-50 text-rose-600' },
  { label: 'Profit Margin', value: '29.9%', change: 4.1, period: 'vs last year', icon: TrendingUp, color: 'bg-green-50 text-green-600' },
  { label: 'Customer Growth', value: '+342', change: 13.6, period: 'New customers', icon: Users, color: 'bg-blue-50 text-blue-600' },
  { label: 'Stock Turnover', value: '8.4x', change: 0.8, period: 'Rate per month', icon: Package, color: 'bg-amber-50 text-amber-600' },
  { label: 'Staff Productivity', value: '94.2%', change: 2.3, period: 'Efficiency score', icon: CheckCircle, color: 'bg-purple-50 text-purple-600' },
]

const reportTypes: ReportType[] = [
  { id: 'rt1', name: 'Monthly Performance', description: 'Comprehensive monthly sales, expense, and profit analysis', lastGenerated: '2025-01-15', frequency: 'Monthly' },
  { id: 'rt2', name: 'Quarterly Review', description: 'In-depth quarterly business performance and trend analysis', lastGenerated: '2024-12-31', frequency: 'Quarterly' },
  { id: 'rt3', name: 'Annual Summary', description: 'Full year overview with year-over-year comparisons', lastGenerated: '2024-12-31', frequency: 'Annual' },
  { id: 'rt4', name: 'Custom Report', description: 'Generate a report with custom parameters and date ranges', lastGenerated: '2025-01-10', frequency: 'Custom' },
]

const reportHistory: ReportRecord[] = [
  { id: 'r1', name: 'January 2025 Performance Report', type: 'Monthly Performance', date: '2025-01-15', status: 'ready', size: '2.4 MB' },
  { id: 'r2', name: 'Q4 2024 Quarterly Review', type: 'Quarterly Review', date: '2024-12-31', status: 'ready', size: '5.1 MB' },
  { id: 'r3', name: '2024 Annual Summary', type: 'Annual Summary', date: '2024-12-31', status: 'ready', size: '12.8 MB' },
  { id: 'r4', name: 'December 2024 Performance Report', type: 'Monthly Performance', date: '2024-12-15', status: 'ready', size: '2.2 MB' },
  { id: 'r5', name: 'November 2024 Performance Report', type: 'Monthly Performance', date: '2024-11-15', status: 'ready', size: '2.1 MB' },
  { id: 'r6', name: 'Q3 2024 Quarterly Review', type: 'Quarterly Review', date: '2024-09-30', status: 'ready', size: '4.8 MB' },
  { id: 'r7', name: 'Custom: Stock Analysis Jan', type: 'Custom Report', date: '2025-01-10', status: 'ready', size: '1.8 MB' },
  { id: 'r8', name: 'February 2025 Performance Report', type: 'Monthly Performance', date: '2025-02-15', status: 'scheduled', size: '--' },
]

const monthlyRevenue: MonthlyRevenue[] = [
  { month: 'Feb', revenue: 68000, expenses: 48000, profit: 20000 },
  { month: 'Mar', revenue: 72000, expenses: 50000, profit: 22000 },
  { month: 'Apr', revenue: 65000, expenses: 46000, profit: 19000 },
  { month: 'May', revenue: 78000, expenses: 52000, profit: 26000 },
  { month: 'Jun', revenue: 82000, expenses: 55000, profit: 27000 },
  { month: 'Jul', revenue: 79000, expenses: 53000, profit: 26000 },
  { month: 'Aug', revenue: 85000, expenses: 57000, profit: 28000 },
  { month: 'Sep', revenue: 81000, expenses: 56000, profit: 25000 },
  { month: 'Oct', revenue: 88000, expenses: 59000, profit: 29000 },
  { month: 'Nov', revenue: 92000, expenses: 61000, profit: 31000 },
  { month: 'Dec', revenue: 98000, expenses: 65000, profit: 33000 },
  { month: 'Jan', revenue: 85420, expenses: 60000, profit: 25420 },
]

const categoryBreakdown = [
  { label: 'Groceries', value: 42, color: 'bg-[#00897B]' },
  { label: 'Beverages', value: 18, color: 'bg-teal-400' },
  { label: 'Snacks & Sweets', value: 15, color: 'bg-amber-400' },
  { label: 'Personal Care', value: 10, color: 'bg-rose-400' },
  { label: 'Household', value: 8, color: 'bg-blue-400' },
  { label: 'Other', value: 7, color: 'bg-gray-400' },
]

export function StakeholderReportingView() {
  const [activeTab, setActiveTab] = useState('overview')
  const [dateRange, setDateRange] = useState('12months')
  const [reportTypeFilter, setReportTypeFilter] = useState('all')

  const maxRevenue = Math.max(...monthlyRevenue.map((m) => m.revenue))

  const filteredReports = useMemo(() => {
    return reportHistory.filter((r) => {
      const matchesType = reportTypeFilter === 'all' || r.type === reportTypeFilter
      return matchesType
    })
  }, [reportTypeFilter])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileBarChart className="h-7 w-7 text-[#00897B]" />
            Stakeholder Reporting
          </h1>
          <p className="text-gray-500 mt-1">Comprehensive business reports and analytics for stakeholders</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button className="bg-[#00897B] text-white hover:bg-[#00796B]" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Executive Overview</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="reports">Report Generation</TabsTrigger>
          <TabsTrigger value="history">Report History</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Tab: Executive Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-lg bg-gray-50">{kpi.icon}</div>
                    <div className={`flex items-center gap-0.5 text-xs font-medium ${
                      kpi.trend === 'up' ? 'text-green-600' : 'text-red-500'
                    }`}>
                      {kpi.trend === 'up' ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {Math.abs(kpi.change)}%
                    </div>
                  </div>
                  <p className="text-xl font-bold text-gray-900">{kpi.value}</p>
                  <p className="text-xs text-gray-500">{kpi.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {metricCards.map((metric, index) => {
              const IconComp = metric.icon
              return (
                <Card key={index}>
                  <CardContent className="p-3">
                    <div className={`p-1.5 rounded-md w-fit mb-2 ${metric.color}`}>
                      <IconComp className="h-4 w-4" />
                    </div>
                    <p className="text-lg font-bold text-gray-900">{metric.value}</p>
                    <p className="text-[10px] text-gray-500">{metric.label}</p>
                    <div className={`flex items-center gap-0.5 text-[10px] font-medium mt-1 ${
                      metric.change >= 0 ? 'text-green-600' : 'text-red-500'
                    }`}>
                      {metric.change >= 0 ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
                      {Math.abs(metric.change)}% {metric.period}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Revenue & Category Charts Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Revenue Bar Chart */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-[#00897B]" />
                    Monthly Revenue vs Expenses
                  </CardTitle>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-32 h-8 text-xs">
                      <Calendar className="h-3 w-3 mr-1" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3months">3 Months</SelectItem>
                      <SelectItem value="6months">6 Months</SelectItem>
                      <SelectItem value="12months">12 Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {/* Bar Chart */}
                <div className="space-y-2">
                  <div className="flex items-center gap-4 mb-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="h-3 w-3 rounded bg-[#00897B]" />
                      <span className="text-gray-500">Revenue</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-3 w-3 rounded bg-rose-400" />
                      <span className="text-gray-500">Expenses</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-3 w-3 rounded bg-green-400" />
                      <span className="text-gray-500">Profit</span>
                    </div>
                  </div>
                  <div className="flex items-end gap-1 h-48">
                    {monthlyRevenue.map((item) => (
                      <div key={item.month} className="flex-1 flex items-end gap-0.5 group">
                        <div
                          className="flex-1 bg-[#00897B] rounded-t-sm min-h-[4px] hover:opacity-80 transition-opacity relative"
                          style={{ height: `${(item.revenue / maxRevenue) * 100}%` }}
                          title={`Revenue: R ${(item.revenue / 1000).toFixed(0)}k`}
                        />
                        <div
                          className="flex-1 bg-rose-400 rounded-t-sm min-h-[4px] hover:opacity-80 transition-opacity relative"
                          style={{ height: `${(item.expenses / maxRevenue) * 100}%` }}
                          title={`Expenses: R ${(item.expenses / 1000).toFixed(0)}k`}
                        />
                        <div
                          className="flex-1 bg-green-400 rounded-t-sm min-h-[4px] hover:opacity-80 transition-opacity relative"
                          style={{ height: `${(item.profit / maxRevenue) * 100}%` }}
                          title={`Profit: R ${(item.profit / 1000).toFixed(0)}k`}
                        />
                        <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-gray-400 hidden group-hover:block">
                          {item.month}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 pt-1">
                    {monthlyRevenue.map((item) => (
                      <span key={item.month}>{item.month}</span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Category Pie Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-[#00897B]" />
                  Sales by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Simple pie chart using conic-gradient */}
                <div className="flex justify-center mb-4">
                  <div
                    className="h-40 w-40 rounded-full relative"
                    style={{
                      background: `conic-gradient(
                        #00897B 0deg ${(42 / 100) * 360}deg,
                        #2dd4bf ${(42 / 100) * 360}deg ${((42 + 18) / 100) * 360}deg,
                        #fbbf24 ${((42 + 18) / 100) * 360}deg ${((42 + 18 + 15) / 100) * 360}deg,
                        #fb7185 ${((42 + 18 + 15) / 100) * 360}deg ${((42 + 18 + 15 + 10) / 100) * 360}deg,
                        #60a5fa ${((42 + 18 + 15 + 10) / 100) * 360}deg ${((42 + 18 + 15 + 10 + 8) / 100) * 360}deg,
                        #9ca3af ${((42 + 18 + 15 + 10 + 8) / 100) * 360}deg 360deg
                      )`,
                    }}
                  >
                    <div className="absolute inset-6 bg-white rounded-full flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">R 85k</p>
                        <p className="text-[10px] text-gray-500">This Month</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="space-y-2">
                  {categoryBreakdown.map((cat) => (
                    <div key={cat.label} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`h-2.5 w-2.5 rounded-full ${cat.color}`} />
                        <span className="text-xs text-gray-600">{cat.label}</span>
                      </div>
                      <span className="text-xs font-medium text-gray-900">{cat.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Executive Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#00897B]" />
                Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600 leading-relaxed">
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 text-sm">Business Performance</h4>
                  <p>
                    The spaza shop has shown strong revenue growth of 12.5% over the past 12 months,
                    with total revenue reaching R 1,025,040. Monthly revenue averages R 85,420 with
                    December recording the highest at R 98,000 due to holiday season demand.
                  </p>
                  <p>
                    Customer base has expanded by 342 new customers (13.6% growth), driven by improved
                    product range and community engagement initiatives. Average transaction value
                    stabilized at R 30.00 despite slight seasonal fluctuations.
                  </p>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 text-sm">Key Highlights</h4>
                  <ul className="space-y-1.5 list-disc list-inside">
                    <li>Profit margin improved to 29.9% (+4.1% YoY)</li>
                    <li>Stock turnover rate at 8.4x per month (industry benchmark: 6x)</li>
                    <li>Staff productivity at 94.2% efficiency score</li>
                    <li>Groceries remain the strongest category at 42% of total sales</li>
                    <li>Operating expenses controlled within 70% of revenue target</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab: Financials */}
      {activeTab === 'financials' && (
        <div className="space-y-4">
          {/* Detailed Revenue Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-[#00897B]" />
                  Revenue Breakdown
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="text-xs">
                    <Filter className="h-3 w-3 mr-1" />
                    Filter
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs">
                    <Download className="h-3 w-3 mr-1" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Horizontal bar chart */}
              <div className="space-y-3">
                {monthlyRevenue.map((item) => (
                  <div key={item.month} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-8 shrink-0">{item.month}</span>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                          <div
                            className="h-full bg-[#00897B] rounded-full transition-all"
                            style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-700 w-16 text-right shrink-0">
                          R {(item.revenue / 1000).toFixed(0)}k
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-rose-300 rounded-full transition-all"
                            style={{ width: `${(item.expenses / maxRevenue) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-400 w-16 text-right shrink-0">
                          R {(item.expenses / 1000).toFixed(0)}k exp
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] shrink-0 ${
                        item.profit >= 25000 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      Profit: R {(item.profit / 1000).toFixed(0)}k
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Profit Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Profit Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-40">
                {monthlyRevenue.map((item) => {
                  const maxProfit = Math.max(...monthlyRevenue.map((m) => m.profit))
                  return (
                    <div key={item.month} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[9px] text-gray-500">R{(item.profit / 1000).toFixed(0)}k</span>
                      <div
                        className="w-full bg-green-400 rounded-t-sm min-h-[4px] hover:bg-green-500 transition-colors"
                        style={{ height: `${(item.profit / maxProfit) * 100}%` }}
                      />
                      <span className="text-[9px] text-gray-400">{item.month}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Financial Summary Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-[#00897B]" />
                Financial Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-[#00897B]/5 border border-[#00897B]/20">
                  <p className="text-xs text-gray-500">Total Revenue (YTD)</p>
                  <p className="text-xl font-bold text-[#00897B] mt-1">R 1,025,040</p>
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-0.5">
                    <ArrowUpRight className="h-3 w-3" /> 12.5% vs last year
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-rose-50 border border-rose-200">
                  <p className="text-xs text-gray-500">Total Expenses (YTD)</p>
                  <p className="text-xl font-bold text-rose-600 mt-1">R 718,250</p>
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-0.5">
                    <ArrowUpRight className="h-3 w-3" /> 5.2% vs last year
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-xs text-gray-500">Net Profit (YTD)</p>
                  <p className="text-xl font-bold text-green-600 mt-1">R 306,790</p>
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-0.5">
                    <ArrowUpRight className="h-3 w-3" /> 18.3% vs last year
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-xs text-gray-500">Profit Margin</p>
                  <p className="text-xl font-bold text-blue-600 mt-1">29.9%</p>
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-0.5">
                    <ArrowUpRight className="h-3 w-3" /> 4.1% improvement
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab: Report Generation */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileBarChart className="h-4 w-4 text-[#00897B]" />
                Generate Report
              </CardTitle>
              <CardDescription>Select a report type and configure parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportTypes.map((report) => (
                  <div
                    key={report.id}
                    className="p-4 rounded-lg border hover:border-[#00897B]/50 hover:bg-[#00897B]/5 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900 group-hover:text-[#00897B] transition-colors flex items-center gap-2">
                          <FileText className="h-4 w-4 text-[#00897B]" />
                          {report.name}
                        </h4>
                        <Badge variant="secondary" className="text-[10px] mt-1 bg-teal-50 text-teal-700">
                          {report.frequency}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">{report.description}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Last: {report.lastGenerated}
                      </span>
                      <Button size="sm" className="bg-[#00897B] text-white hover:bg-[#00796B] text-xs h-7">
                        Generate
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Custom Report Config */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-4 w-4 text-[#00897B]" />
                Custom Report Parameters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600">Date Range Start</label>
                  <Input type="date" defaultValue="2025-01-01" className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600">Date Range End</label>
                  <Input type="date" defaultValue="2025-01-31" className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600">Report Type</label>
                  <Select defaultValue="performance">
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="financial">Financial</SelectItem>
                      <SelectItem value="inventory">Inventory</SelectItem>
                      <SelectItem value="customer">Customer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600">Format</label>
                  <Select defaultValue="pdf">
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4 pt-4 border-t">
                <Button className="bg-[#00897B] text-white hover:bg-[#00796B]">
                  <FileBarChart className="h-4 w-4 mr-2" />
                  Generate Custom Report
                </Button>
                <Button variant="outline">
                  <Clock className="h-4 w-4 mr-2" />
                  Schedule Recurring
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab: Report History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-3">
            <Select value={reportTypeFilter} onValueChange={setReportTypeFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Report Types</SelectItem>
                <SelectItem value="Monthly Performance">Monthly Performance</SelectItem>
                <SelectItem value="Quarterly Review">Quarterly Review</SelectItem>
                <SelectItem value="Annual Summary">Annual Summary</SelectItem>
                <SelectItem value="Custom Report">Custom Report</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" className="w-40" placeholder="From date" />
            <Input type="date" className="w-40" placeholder="To date" />
          </div>

          {/* Report List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#00897B]" />
                Generated Reports
              </CardTitle>
              <CardDescription>{filteredReports.length} reports found</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredReports.map((report) => (
                  <div key={report.id} className="flex items-center gap-4 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <div className={`p-2 rounded-lg shrink-0 ${
                      report.status === 'ready'
                        ? 'bg-[#00897B]/10'
                        : report.status === 'generating'
                        ? 'bg-amber-50'
                        : 'bg-blue-50'
                    }`}>
                      <FileText className={`h-5 w-5 ${
                        report.status === 'ready'
                          ? 'text-[#00897B]'
                          : report.status === 'generating'
                          ? 'text-amber-500'
                          : 'text-blue-500'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-gray-900 truncate">{report.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-[10px] bg-teal-50 text-teal-700">{report.type}</Badge>
                        <span className="text-xs text-gray-400">{report.date}</span>
                        <span className="text-xs text-gray-400">{report.size}</span>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs shrink-0 ${
                        report.status === 'ready'
                          ? 'border-green-200 text-green-700 bg-green-50'
                          : report.status === 'generating'
                          ? 'border-amber-200 text-amber-700 bg-amber-50'
                          : 'border-blue-200 text-blue-700 bg-blue-50'
                      }`}
                    >
                      {report.status === 'ready' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                    </Badge>
                    {report.status === 'ready' && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4 text-gray-500" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Download className="h-4 w-4 text-gray-500" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Share2 className="h-4 w-4 text-gray-500" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
