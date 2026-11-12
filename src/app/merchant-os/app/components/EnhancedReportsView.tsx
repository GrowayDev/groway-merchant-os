'use client'

import { useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  DollarSign,
  Calendar,
  Download,
  FileText,
  PieChart,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Target,
  Award,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Activity,
  ShoppingCart,
  CreditCard,
  Banknote,
  QrCode,
  Wallet,
  Printer,
  RefreshCw,
  Filter,
  ChevronRight,
  Minus,
  BarChart2,
  UserCheck,
  Timer,
  Percent,
  Layers,
  Box,
  Truck,
  Building2,
  Sparkles,
  Settings,
  Bell,
  Mail,
  Webhook,
  Play,
  Pause,
  RotateCcw,
  Save,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  Copy,
  Zap,
  Gauge,
  Funnel,
  ScatterChart,
  LayoutDashboard,
  FileSpreadsheet,
  FileDown,
} from 'lucide-react'

// Types for new features
interface CustomReport {
  id: string
  name: string
  description?: string
  reportType: string
  dataSource: string
  status: string
  lastRunAt?: string
  runCount: number
}

interface ScheduledReport {
  id: string
  name: string
  frequency: string
  nextRunAt?: string
  lastRunAt?: string
  lastRunStatus?: string
  isActive: boolean
}

interface ReportExecution {
  id: string
  status: string
  startedAt: string
  completedAt?: string
  recordCount: number
  duration?: number
}

interface KPIWidget {
  id: string
  name: string
  category: string
  currentValue: number
  targetValue?: number
  unit?: string
  status: 'good' | 'warning' | 'critical'
  variance?: number
}

interface ChartWidget {
  id: string
  name: string
  chartType: 'line' | 'bar' | 'pie' | 'funnel' | 'heatmap' | 'gauge'
  data: { label: string; value: number }[]
}

// Mock data generators for demo
const generateCustomReports = (): CustomReport[] => [
  { id: '1', name: 'Daily Sales Summary', reportType: 'sales', dataSource: 'transactions', status: 'active', lastRunAt: new Date().toISOString(), runCount: 45 },
  { id: '2', name: 'Weekly Staff Performance', reportType: 'staff', dataSource: 'staff', status: 'active', lastRunAt: new Date(Date.now() - 86400000).toISOString(), runCount: 12 },
  { id: '3', name: 'Monthly Inventory Audit', reportType: 'inventory', dataSource: 'inventory', status: 'active', lastRunAt: new Date(Date.now() - 172800000).toISOString(), runCount: 6 },
  { id: '4', name: 'Customer Retention Analysis', reportType: 'customers', dataSource: 'customers', status: 'active', lastRunAt: new Date(Date.now() - 259200000).toISOString(), runCount: 3 },
]

const generateScheduledReports = (): ScheduledReport[] => [
  { id: '1', name: 'Daily Sales Report', frequency: 'daily', nextRunAt: new Date(Date.now() + 3600000).toISOString(), lastRunAt: new Date(Date.now() - 82800000).toISOString(), lastRunStatus: 'completed', isActive: true },
  { id: '2', name: 'Weekly Performance Review', frequency: 'weekly', nextRunAt: new Date(Date.now() + 172800000).toISOString(), lastRunAt: new Date(Date.now() - 604800000).toISOString(), lastRunStatus: 'completed', isActive: true },
  { id: '3', name: 'Monthly Financial Report', frequency: 'monthly', nextRunAt: new Date(Date.now() + 2592000000).toISOString(), lastRunAt: new Date(Date.now() - 2592000000).toISOString(), lastRunStatus: 'completed', isActive: true },
  { id: '4', name: 'Quarterly Analysis', frequency: 'quarterly', nextRunAt: new Date(Date.now() + 7776000000).toISOString(), isActive: true },
  { id: '5', name: 'Paused Report', frequency: 'daily', lastRunStatus: 'failed', isActive: false },
]

const generateExecutionHistory = (): ReportExecution[] => [
  { id: '1', status: 'completed', startedAt: new Date(Date.now() - 3600000).toISOString(), completedAt: new Date(Date.now() - 3500000).toISOString(), recordCount: 1542, duration: 100 },
  { id: '2', status: 'completed', startedAt: new Date(Date.now() - 86400000).toISOString(), completedAt: new Date(Date.now() - 86390000).toISOString(), recordCount: 1489, duration: 100 },
  { id: '3', status: 'failed', startedAt: new Date(Date.now() - 172800000).toISOString(), recordCount: 0 },
  { id: '4', status: 'completed', startedAt: new Date(Date.now() - 259200000).toISOString(), completedAt: new Date(Date.now() - 259190000).toISOString(), recordCount: 1678, duration: 100 },
]

const generateKPIWidgets = (): KPIWidget[] => [
  { id: '1', name: 'Total Revenue', category: 'sales', currentValue: 125456.78, targetValue: 120000, unit: 'ZAR', status: 'good', variance: 4.5 },
  { id: '2', name: 'Transaction Count', category: 'sales', currentValue: 1542, targetValue: 1500, unit: '', status: 'good', variance: 2.8 },
  { id: '3', name: 'Average Basket Size', category: 'sales', currentValue: 81.40, targetValue: 85, unit: 'ZAR', status: 'warning', variance: -4.2 },
  { id: '4', name: 'Customer Retention', category: 'customers', currentValue: 78.5, targetValue: 80, unit: '%', status: 'warning', variance: -1.9 },
  { id: '5', name: 'Inventory Turnover', category: 'inventory', currentValue: 4.2, targetValue: 5, unit: 'x', status: 'warning', variance: -16 },
  { id: '6', name: 'Staff Productivity', category: 'staff', currentValue: 92, targetValue: 85, unit: '%', status: 'good', variance: 8.2 },
]

const generateChartData = () => ({
  line: [
    { label: 'Mon', value: 12500 },
    { label: 'Tue', value: 15200 },
    { label: 'Wed', value: 14800 },
    { label: 'Thu', value: 18500 },
    { label: 'Fri', value: 22000 },
    { label: 'Sat', value: 28500 },
    { label: 'Sun', value: 19200 },
  ],
  bar: [
    { label: 'Card', value: 45 },
    { label: 'Cash', value: 28 },
    { label: 'QR', value: 15 },
    { label: 'Wallet', value: 12 },
  ],
  pie: [
    { label: 'Food', value: 45 },
    { label: 'Beverages', value: 25 },
    { label: 'Desserts', value: 15 },
    { label: 'Sides', value: 15 },
  ],
  funnel: [
    { label: 'Visitors', value: 10000 },
    { label: 'Browsers', value: 6000 },
    { label: 'Cart Added', value: 3000 },
    { label: 'Checkout', value: 1500 },
    { label: 'Completed', value: 1200 },
  ],
  heatmap: Array.from({ length: 7 }, (_, day) =>
    Array.from({ length: 24 }, (_, hour) => ({
      day,
      hour,
      value: Math.floor(Math.random() * 1000),
    }))
  ).flat(),
})

// Format helpers
const formatCurrency = (amount: number) => `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const formatPercent = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
const formatDate = (dateString?: string) => {
  if (!dateString) return 'Never'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function EnhancedReportsView() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [periodFilter, setPeriodFilter] = useState('30')
  
  // Dialog states
  const [reportBuilderOpen, setReportBuilderOpen] = useState(false)
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  
  // Report builder state
  const [builderStep, setBuilderStep] = useState(1)
  const [selectedDataSource, setSelectedDataSource] = useState('transactions')
  const [selectedFields, setSelectedFields] = useState<string[]>([])
  const [reportName, setReportName] = useState('')
  const [reportDescription, setReportDescription] = useState('')
  
  // Data
  const customReports = useMemo(() => generateCustomReports(), [])
  const scheduledReports = useMemo(() => generateScheduledReports(), [])
  const executionHistory = useMemo(() => generateExecutionHistory(), [])
  const kpiWidgets = useMemo(() => generateKPIWidgets(), [])
  const chartData = useMemo(() => generateChartData(), [])

  // Available fields by data source
  const dataSourceFields: Record<string, { name: string; type: string; aggregatable: boolean }[]> = {
    transactions: [
      { name: 'id', type: 'string', aggregatable: false },
      { name: 'total', type: 'currency', aggregatable: true },
      { name: 'subtotal', type: 'currency', aggregatable: true },
      { name: 'tax', type: 'currency', aggregatable: true },
      { name: 'paymentMethod', type: 'string', aggregatable: false },
      { name: 'status', type: 'string', aggregatable: false },
      { name: 'createdAt', type: 'date', aggregatable: false },
      { name: 'branchId', type: 'string', aggregatable: false },
    ],
    products: [
      { name: 'id', type: 'string', aggregatable: false },
      { name: 'name', type: 'string', aggregatable: false },
      { name: 'sku', type: 'string', aggregatable: false },
      { name: 'price', type: 'currency', aggregatable: true },
      { name: 'cost', type: 'currency', aggregatable: true },
      { name: 'quantity', type: 'number', aggregatable: true },
      { name: 'category', type: 'string', aggregatable: false },
    ],
    customers: [
      { name: 'id', type: 'string', aggregatable: false },
      { name: 'name', type: 'string', aggregatable: false },
      { name: 'email', type: 'string', aggregatable: false },
      { name: 'totalSpent', type: 'currency', aggregatable: true },
      { name: 'visitCount', type: 'number', aggregatable: true },
      { name: 'lastVisitAt', type: 'date', aggregatable: false },
    ],
  }

  // Render KPI Scorecard
  const renderKPIScorecard = (kpi: KPIWidget) => (
    <Card key={kpi.id} className={`border-l-4 ${kpi.status === 'good' ? 'border-l-green-500' : kpi.status === 'warning' ? 'border-l-yellow-500' : 'border-l-red-500'}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[#757575]">{kpi.name}</p>
            <p className="text-2xl font-bold text-[#1A1A1A]">
              {kpi.unit === 'ZAR' ? formatCurrency(kpi.currentValue) : `${kpi.currentValue}${kpi.unit ? ` ${kpi.unit}` : ''}`}
            </p>
            {kpi.targetValue && (
              <p className="text-xs text-[#757575]">Target: {kpi.unit === 'ZAR' ? formatCurrency(kpi.targetValue) : `${kpi.targetValue}${kpi.unit ? ` ${kpi.unit}` : ''}`}</p>
            )}
          </div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            kpi.status === 'good' ? 'bg-green-50' : kpi.status === 'warning' ? 'bg-yellow-50' : 'bg-red-50'
          }`}>
            {kpi.status === 'good' ? (
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            ) : kpi.status === 'warning' ? (
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600" />
            )}
          </div>
        </div>
        {kpi.variance !== undefined && (
          <div className="flex items-center gap-1 mt-2">
            {kpi.variance >= 0 ? (
              <ArrowUpRight className="h-3 w-3 text-green-600" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-red-600" />
            )}
            <span className={`text-xs ${kpi.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercent(kpi.variance)} vs target
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )

  // Render Chart Widget
  const renderChartWidget = (type: string, data: { label: string; value: number }[], title: string) => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          {type === 'line' && <LineChart className="h-4 w-4 text-[#00897B]" />}
          {type === 'bar' && <BarChart3 className="h-4 w-4 text-[#00897B]" />}
          {type === 'pie' && <PieChart className="h-4 w-4 text-[#00897B]" />}
          {type === 'funnel' && <Funnel className="h-4 w-4 text-[#00897B]" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {type === 'line' && (
          <div className="h-40 flex items-end gap-2">
            {data.map((item, i) => {
              const maxValue = Math.max(...data.map(d => d.value))
              const height = (item.value / maxValue) * 100
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-gradient-to-t from-[#00897B] to-[#4DB6AC] rounded-t transition-all hover:from-[#00695C] hover:to-[#00897B] cursor-pointer"
                    style={{ height: `${height}%` }}
                    title={`${item.label}: ${formatCurrency(item.value)}`}
                  />
                  <span className="text-[9px] text-[#757575]">{item.label}</span>
                </div>
              )
            })}
          </div>
        )}
        {type === 'bar' && (
          <div className="space-y-3">
            {data.map((item, i) => {
              const maxValue = Math.max(...data.map(d => d.value))
              const width = (item.value / maxValue) * 100
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{item.label}</span>
                    <span className="font-medium">{item.value}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#00897B] rounded-full" style={{ width: `${width}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {type === 'pie' && (
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-full border-8 border-[#00897B]" style={{
              background: `conic-gradient(#00897B 0deg ${data[0].value * 3.6}deg, #4DB6AC ${data[0].value * 3.6}deg ${(data[0].value + data[1].value) * 3.6}deg, #80CBC4 ${(data[0].value + data[1].value) * 3.6}deg ${(data[0].value + data[1].value + data[2].value) * 3.6}deg, #B2DFDB ${(data[0].value + data[1].value + data[2].value) * 3.6}deg 360deg)`
            }} />
            <div className="flex-1 space-y-1">
              {data.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className={`w-3 h-3 rounded-full ${['bg-[#00897B]', 'bg-[#4DB6AC]', 'bg-[#80CBC4]', 'bg-[#B2DFDB]'][i]}`} />
                  <span>{item.label}</span>
                  <span className="ml-auto font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {type === 'funnel' && (
          <div className="space-y-1">
            {data.map((item, i) => {
              const width = 100 - (i * 15)
              return (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className="h-6 bg-[#00897B] rounded flex items-center justify-center text-white text-xs font-medium"
                    style={{ width: `${width}%` }}
                  >
                    {item.value.toLocaleString()}
                  </div>
                  <span className="text-xs text-[#757575]">{item.label}</span>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )

  // Render Dashboard Tab
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* KPI Scorecards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">KPI Scorecards</h2>
          <Button variant="outline" size="sm" onClick={() => setReportBuilderOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add KPI
          </Button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {kpiWidgets.map(renderKPIScorecard)}
        </div>
      </div>

      {/* Chart Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderChartWidget('line', chartData.line, 'Weekly Sales Trend')}
        {renderChartWidget('bar', chartData.bar, 'Payment Methods')}
        {renderChartWidget('pie', chartData.pie, 'Sales by Category')}
        {renderChartWidget('funnel', chartData.funnel, 'Sales Funnel')}
      </div>

      {/* Heatmap */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#00897B]" />
            Sales Heatmap (Day x Hour)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-25 gap-0.5">
            <div></div>
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} className="text-[8px] text-[#757575] text-center">{h}</div>
            ))}
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, di) => (
              <>
                <div key={day} className="text-[8px] text-[#757575] flex items-center">{day}</div>
                {Array.from({ length: 24 }, (_, h) => {
                  const value = Math.floor(Math.random() * 1000)
                  const intensity = value / 1000
                  return (
                    <div
                      key={`${di}-${h}`}
                      className="w-4 h-4 rounded-sm cursor-pointer"
                      style={{ backgroundColor: `rgba(0, 137, 123, ${intensity})` }}
                      title={`${day} ${h}:00 - R${value}`}
                    />
                  )
                })}
              </>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Render Custom Reports Tab
  const renderCustomReports = () => (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#1A1A1A]">Custom Reports</h2>
          <p className="text-sm text-[#757575]">Build and save custom reports with drag-and-drop fields</p>
        </div>
        <Button onClick={() => setReportBuilderOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Create Report
        </Button>
      </div>

      {/* Report Templates */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Quick Start Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { name: 'Daily Sales', icon: DollarSign, color: 'bg-green-50 text-green-600' },
              { name: 'Staff Performance', icon: Users, color: 'bg-blue-50 text-blue-600' },
              { name: 'Inventory Status', icon: Package, color: 'bg-purple-50 text-purple-600' },
              { name: 'Customer Analysis', icon: Target, color: 'bg-orange-50 text-orange-600' },
            ].map((template) => (
              <Button key={template.name} variant="outline" className="h-auto py-3 flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full ${template.color} flex items-center justify-center`}>
                  <template.icon className="h-5 w-5" />
                </div>
                <span className="text-xs">{template.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Saved Reports */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Saved Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {customReports.map((report) => (
              <div key={report.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-[#E0F2F1] flex items-center justify-center">
                  <FileText className="h-5 w-5 text-[#00897B]" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{report.name}</p>
                  <p className="text-xs text-[#757575]">{report.dataSource} • {report.runCount} runs • Last: {formatDate(report.lastRunAt)}</p>
                </div>
                <Badge variant={report.status === 'active' ? 'default' : 'secondary'}>{report.status}</Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem><Play className="h-4 w-4 mr-2" /> Run Now</DropdownMenuItem>
                    <DropdownMenuItem><Copy className="h-4 w-4 mr-2" /> Duplicate</DropdownMenuItem>
                    <DropdownMenuItem><Calendar className="h-4 w-4 mr-2" /> Schedule</DropdownMenuItem>
                    <DropdownMenuItem><Download className="h-4 w-4 mr-2" /> Export</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600"><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Render Scheduled Reports Tab
  const renderScheduledReports = () => (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#1A1A1A]">Scheduled Reports</h2>
          <p className="text-sm text-[#757575]">Automate report delivery via email or webhook</p>
        </div>
        <Button onClick={() => setScheduleDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Schedule Report
        </Button>
      </div>

      {/* Upcoming Runs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#00897B]" />
            Upcoming Runs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {scheduledReports.filter(s => s.isActive).slice(0, 3).map((schedule) => (
              <div key={schedule.id} className="p-3 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-sm">{schedule.name}</p>
                  <Badge variant="outline">{schedule.frequency}</Badge>
                </div>
                <p className="text-xs text-[#757575]">Next run: {formatDate(schedule.nextRunAt)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* All Scheduled Reports */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">All Scheduled Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {scheduledReports.map((schedule) => (
              <div key={schedule.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${schedule.isActive ? 'bg-green-50' : 'bg-gray-100'}`}>
                  {schedule.isActive ? (
                    <Clock className="h-5 w-5 text-green-600" />
                  ) : (
                    <Pause className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{schedule.name}</p>
                    <Badge variant="outline">{schedule.frequency}</Badge>
                  </div>
                  <p className="text-xs text-[#757575]">
                    Next: {formatDate(schedule.nextRunAt)} • Last: {formatDate(schedule.lastRunAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {schedule.lastRunStatus && (
                    <Badge variant={schedule.lastRunStatus === 'completed' ? 'default' : 'destructive'}>
                      {schedule.lastRunStatus}
                    </Badge>
                  )}
                  <Switch checked={schedule.isActive} />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Filter className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem><Play className="h-4 w-4 mr-2" /> Run Now</DropdownMenuItem>
                      <DropdownMenuItem><Settings className="h-4 w-4 mr-2" /> Edit Schedule</DropdownMenuItem>
                      <DropdownMenuItem><Mail className="h-4 w-4 mr-2" /> Update Recipients</DropdownMenuItem>
                      <DropdownMenuItem><RotateCcw className="h-4 w-4 mr-2" /> Retry Failed</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600"><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Execution History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#00897B]" />
            Execution History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 font-medium text-[#757575]">Started</th>
                  <th className="text-left py-2 px-2 font-medium text-[#757575]">Status</th>
                  <th className="text-right py-2 px-2 font-medium text-[#757575]">Records</th>
                  <th className="text-right py-2 px-2 font-medium text-[#757575]">Duration</th>
                  <th className="text-right py-2 px-2 font-medium text-[#757575]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {executionHistory.map((execution) => (
                  <tr key={execution.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2">{formatDate(execution.startedAt)}</td>
                    <td className="py-2 px-2">
                      <Badge variant={execution.status === 'completed' ? 'default' : 'destructive'}>
                        {execution.status}
                      </Badge>
                    </td>
                    <td className="py-2 px-2 text-right">{execution.recordCount.toLocaleString()}</td>
                    <td className="py-2 px-2 text-right">{execution.duration ? `${execution.duration}ms` : '-'}</td>
                    <td className="py-2 px-2 text-right">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Render Visualization Tab
  const renderVisualizations = () => (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#1A1A1A]">Advanced Visualizations</h2>
          <p className="text-sm text-[#757575]">Create interactive charts with drill-down and comparison views</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <LayoutDashboard className="h-4 w-4 mr-2" /> Manage Dashboards
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" /> Create Chart
          </Button>
        </div>
      </div>

      {/* Chart Type Selector */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Chart Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { type: 'line', name: 'Line Chart', icon: LineChart },
              { type: 'bar', name: 'Bar Chart', icon: BarChart3 },
              { type: 'pie', name: 'Pie Chart', icon: PieChart },
              { type: 'funnel', name: 'Funnel', icon: Funnel },
              { type: 'heatmap', name: 'Heatmap', icon: Activity },
              { type: 'gauge', name: 'Gauge', icon: Gauge },
            ].map((chart) => (
              <Button key={chart.type} variant="outline" className="h-auto py-3 flex flex-col items-center gap-2">
                <chart.icon className="h-6 w-6 text-[#00897B]" />
                <span className="text-xs">{chart.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comparison View */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#00897B]" />
              Period Comparison View
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select defaultValue="previous_period">
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="previous_period">Previous Period</SelectItem>
                  <SelectItem value="previous_year">Previous Year</SelectItem>
                  <SelectItem value="target">vs Target</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" /> Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end gap-2">
            {chartData.line.map((item, i) => {
              const maxValue = Math.max(...chartData.line.map(d => d.value))
              const currentHeight = (item.value / maxValue) * 100
              const previousValue = item.value * (0.8 + Math.random() * 0.3)
              const previousHeight = (previousValue / maxValue) * 100
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex gap-0.5" style={{ height: `${Math.max(currentHeight, previousHeight)}%` }}>
                    <div
                      className="flex-1 bg-[#00897B] rounded-t transition-all hover:bg-[#00695C] cursor-pointer"
                      title={`Current: ${formatCurrency(item.value)}`}
                    />
                    <div
                      className="flex-1 bg-[#80CBC4] rounded-t transition-all hover:bg-[#4DB6AC] cursor-pointer"
                      title={`Previous: ${formatCurrency(previousValue)}`}
                    />
                  </div>
                  <span className="text-[9px] text-[#757575]">{item.label}</span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#00897B] rounded" />
              <span>Current Period</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#80CBC4] rounded" />
              <span>Previous Period</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drill-down Example */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Layers className="h-4 w-4 text-[#00897B]" />
            Drill-down Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4 text-sm">
            <Badge variant="outline" className="cursor-pointer hover:bg-[#E0F2F1]">All Sales</Badge>
            <ChevronRight className="h-4 w-4 text-[#757575]" />
            <Badge variant="outline" className="cursor-pointer hover:bg-[#E0F2F1]">Food Category</Badge>
            <ChevronRight className="h-4 w-4 text-[#757575]" />
            <Badge variant="secondary" className="cursor-pointer">Burgers</Badge>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="h-40 flex items-end gap-1">
              {['Beef', 'Chicken', 'Veggie', 'Double'].map((type, i) => {
                const values = [8500, 6200, 3400, 4800]
                const maxValue = Math.max(...values)
                const height = (values[i] / maxValue) * 100
                return (
                  <div key={type} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-[#00897B] rounded-t cursor-pointer hover:bg-[#00695C]"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-[9px] text-[#757575]">{type}</span>
                  </div>
                )
              })}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Burger Sales Breakdown</p>
              <div className="space-y-2">
                {['Beef', 'Chicken', 'Double', 'Veggie'].map((type, i) => {
                  const values = [8500, 6200, 4800, 3400]
                  const total = values.reduce((a, b) => a + b, 0)
                  const percent = (values[i] / total) * 100
                  return (
                    <div key={type}>
                      <div className="flex justify-between text-xs mb-1">
                        <span>{type}</span>
                        <span>{formatCurrency(values[i])} ({percent.toFixed(1)}%)</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#00897B] rounded-full" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Render Export Dialog
  const renderExportDialog = () => (
    <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Report</DialogTitle>
          <DialogDescription>Choose your export format and options</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { format: 'PDF', icon: FileText, desc: 'Best for printing' },
              { format: 'Excel', icon: FileSpreadsheet, desc: 'For data analysis' },
              { format: 'CSV', icon: FileDown, desc: 'Universal format' },
            ].map((option) => (
              <Button key={option.format} variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
                <option.icon className="h-6 w-6 text-[#00897B]" />
                <span className="font-medium">{option.format}</span>
                <span className="text-[10px] text-[#757575]">{option.desc}</span>
              </Button>
            ))}
          </div>
          <div className="space-y-2">
            <Label>Include Options</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Switch id="include-charts" defaultChecked />
                <Label htmlFor="include-charts" className="text-sm font-normal">Include charts and visualizations</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="include-summary" defaultChecked />
                <Label htmlFor="include-summary" className="text-sm font-normal">Include executive summary</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="include-raw" />
                <Label htmlFor="include-raw" className="text-sm font-normal">Include raw data sheet</Label>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setExportDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => setExportDialogOpen(false)}>
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  // Render Report Builder Dialog
  const renderReportBuilderDialog = () => (
    <Dialog open={reportBuilderOpen} onOpenChange={setReportBuilderOpen}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Report Builder</DialogTitle>
          <DialogDescription>Create a custom report with drag-and-drop fields</DialogDescription>
        </DialogHeader>
        
        {/* Steps */}
        <div className="flex items-center gap-2 mb-4">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                builderStep >= step ? 'bg-[#00897B] text-white' : 'bg-gray-100 text-[#757575]'
              }`}>
                {step}
              </div>
              {step < 4 && <div className={`w-12 h-0.5 ${builderStep > step ? 'bg-[#00897B]' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[300px]">
          {builderStep === 1 && (
            <div className="space-y-4">
              <div>
                <Label>Report Name</Label>
                <Input placeholder="Enter report name..." value={reportName} onChange={(e) => setReportName(e.target.value)} />
              </div>
              <div>
                <Label>Description (Optional)</Label>
                <Input placeholder="Brief description..." value={reportDescription} onChange={(e) => setReportDescription(e.target.value)} />
              </div>
              <div>
                <Label>Data Source</Label>
                <Select value={selectedDataSource} onValueChange={setSelectedDataSource}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transactions">Transactions</SelectItem>
                    <SelectItem value="products">Products</SelectItem>
                    <SelectItem value="customers">Customers</SelectItem>
                    <SelectItem value="inventory">Inventory</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {builderStep === 2 && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">Available Fields</Label>
                <ScrollArea className="h-64 border rounded-lg p-2">
                  <div className="space-y-1">
                    {dataSourceFields[selectedDataSource]?.map((field) => (
                      <div
                        key={field.name}
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-50 ${
                          selectedFields.includes(field.name) ? 'bg-[#E0F2F1]' : ''
                        }`}
                        onClick={() => {
                          if (selectedFields.includes(field.name)) {
                            setSelectedFields(selectedFields.filter(f => f !== field.name))
                          } else {
                            setSelectedFields([...selectedFields, field.name])
                          }
                        }}
                      >
                        <GripVertical className="h-4 w-4 text-[#757575]" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{field.name}</p>
                          <p className="text-xs text-[#757575]">{field.type}</p>
                        </div>
                        {selectedFields.includes(field.name) && (
                          <CheckCircle2 className="h-4 w-4 text-[#00897B]" />
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              <div>
                <Label className="mb-2 block">Selected Fields ({selectedFields.length})</Label>
                <ScrollArea className="h-64 border rounded-lg p-2">
                  <div className="space-y-1">
                    {selectedFields.map((field) => (
                      <div key={field} className="flex items-center gap-2 p-2 rounded bg-[#E0F2F1]">
                        <GripVertical className="h-4 w-4 text-[#757575]" />
                        <span className="text-sm flex-1">{field}</span>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedFields(selectedFields.filter(f => f !== field))}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {selectedFields.length === 0 && (
                      <p className="text-sm text-[#757575] text-center py-8">Click fields to add them</p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}

          {builderStep === 3 && (
            <div className="space-y-4">
              <div>
                <Label>Filters</Label>
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Field" /></SelectTrigger>
                      <SelectContent>
                        {selectedFields.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Operator" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="contains">Contains</SelectItem>
                        <SelectItem value="greater">Greater than</SelectItem>
                        <SelectItem value="less">Less than</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input placeholder="Value" />
                  </div>
                  <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-2" /> Add Filter</Button>
                </div>
              </div>
              <div>
                <Label>Grouping</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Group by..." /></SelectTrigger>
                  <SelectContent>
                    {selectedFields.filter(f => !['total', 'amount', 'price', 'quantity'].includes(f)).map(f => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Aggregation</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Field" /></SelectTrigger>
                    <SelectContent>
                      {selectedFields.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Function" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sum">Sum</SelectItem>
                      <SelectItem value="avg">Average</SelectItem>
                      <SelectItem value="count">Count</SelectItem>
                      <SelectItem value="min">Min</SelectItem>
                      <SelectItem value="max">Max</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {builderStep === 4 && (
            <div className="space-y-4">
              <div>
                <Label>Export Formats</Label>
                <div className="flex gap-3">
                  {['PDF', 'Excel', 'CSV'].map((format) => (
                    <div key={format} className="flex items-center gap-2">
                      <Switch id={`format-${format}`} defaultChecked={format === 'PDF'} />
                      <Label htmlFor={`format-${format}`}>{format}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label>Save Options</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Switch id="save-template" />
                    <Label htmlFor="save-template" className="text-sm font-normal">Save as template for future use</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="schedule-report" />
                    <Label htmlFor="schedule-report" className="text-sm font-normal">Schedule automatic delivery</Label>
                  </div>
                </div>
              </div>
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <p className="text-sm font-medium mb-2">Report Summary</p>
                  <div className="text-xs text-[#757575] space-y-1">
                    <p>Name: {reportName || 'Untitled Report'}</p>
                    <p>Data Source: {selectedDataSource}</p>
                    <p>Fields: {selectedFields.length} selected</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <DialogFooter>
          {builderStep > 1 && (
            <Button variant="outline" onClick={() => setBuilderStep(builderStep - 1)}>Previous</Button>
          )}
          {builderStep < 4 ? (
            <Button onClick={() => setBuilderStep(builderStep + 1)}>Next</Button>
          ) : (
            <Button onClick={() => {
              setReportBuilderOpen(false)
              setBuilderStep(1)
              setReportName('')
              setSelectedFields([])
            }}>
              <Save className="h-4 w-4 mr-2" /> Save Report
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  // Render Schedule Dialog
  const renderScheduleDialog = () => (
    <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Report</DialogTitle>
          <DialogDescription>Configure automatic report delivery</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Report</Label>
            <Select>
              <SelectTrigger><SelectValue placeholder="Select report..." /></SelectTrigger>
              <SelectContent>
                {customReports.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Frequency</Label>
            <Select defaultValue="daily">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Run At</Label>
            <Input type="time" defaultValue="08:00" />
          </div>
          <div>
            <Label>Delivery Channels</Label>
            <div className="space-y-2 mt-2">
              <div className="flex items-center gap-2">
                <Switch id="channel-email" defaultChecked />
                <Mail className="h-4 w-4 text-[#757575]" />
                <Label htmlFor="channel-email" className="text-sm font-normal">Email</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="channel-webhook" />
                <Webhook className="h-4 w-4 text-[#757575]" />
                <Label htmlFor="channel-webhook" className="text-sm font-normal">Webhook</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="channel-app" defaultChecked />
                <Bell className="h-4 w-4 text-[#757575]" />
                <Label htmlFor="channel-app" className="text-sm font-normal">In-App Notification</Label>
              </div>
            </div>
          </div>
          <div>
            <Label>Email Recipients</Label>
            <Input placeholder="email@example.com, another@example.com" />
          </div>
          <div className="flex items-center gap-2">
            <Switch id="retry-failure" defaultChecked />
            <Label htmlFor="retry-failure" className="text-sm font-normal">Retry on failure (up to 3 attempts)</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => setScheduleDialogOpen(false)}>
            <Calendar className="h-4 w-4 mr-2" /> Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-[#00897B]" />
              Reports & Analytics
            </h1>
            <p className="text-sm text-[#757575]">Comprehensive business intelligence and reporting</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 14 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" /> Export All
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setExportDialogOpen(true)}>
                  <FileText className="h-4 w-4 mr-2" /> Export to PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setExportDialogOpen(true)}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" /> Export to Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setExportDialogOpen(true)}>
                  <FileDown className="h-4 w-4 mr-2" /> Export to CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline">
              <Printer className="h-4 w-4 mr-2" /> Print
            </Button>
          </div>
        </div>
        
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-transparent p-0 h-auto">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="custom" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <FileText className="h-4 w-4 mr-2" /> Custom Reports
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <Clock className="h-4 w-4 mr-2" /> Scheduled
            </TabsTrigger>
            <TabsTrigger value="visualizations" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <BarChart3 className="h-4 w-4 mr-2" /> Visualizations
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'custom' && renderCustomReports()}
          {activeTab === 'scheduled' && renderScheduledReports()}
          {activeTab === 'visualizations' && renderVisualizations()}
        </div>
      </ScrollArea>

      {/* Dialogs */}
      {renderReportBuilderDialog()}
      {renderScheduleDialog()}
      {renderExportDialog()}
    </div>
  )
}
