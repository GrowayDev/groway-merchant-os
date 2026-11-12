'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Sparkles,
  Target,
  Zap,
  DollarSign,
  Package,
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Info,
  Lightbulb,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  RefreshCw,
  Download,
  Eye,
  ShoppingCart,
  Box,
  Award,
  Gauge,
  Badge as BadgeIcon
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart,
  Bar,
  ReferenceLine,
  Scatter
} from 'recharts'
import { useSupplierAuth } from '../layout'

// GroAI Brand Colors
const GROAI_GRADIENT = 'bg-gradient-to-r from-purple-600 to-teal-500'
const GROAI_TEXT_GRADIENT = 'bg-gradient-to-r from-purple-600 to-teal-500 bg-clip-text text-transparent'

// Mock AI-generated insights and predictions
const groaiInsight = {
  insight: 'Your Fresh Produce category is showing strong momentum with 23% growth potential next month based on seasonal patterns and market demand.',
  confidence: 94,
  recommendationsCount: 7,
  revenueOpportunity: 128500,
  lastUpdated: '2 minutes ago'
}

const aiRecommendations = [
  {
    id: 1,
    title: 'Increase Fresh Produce Stock by 15%',
    description: 'Historical data shows 34% demand increase in the next 30 days for seasonal fruits. Stock up on citrus and berries.',
    impact: '+R45,200',
    impactType: 'revenue',
    confidence: 92,
    priority: 'high',
    category: 'Inventory',
    action: 'Update Stock'
  },
  {
    id: 2,
    title: 'Optimize Pricing for Dairy Products',
    description: 'Competitor analysis suggests 8% price adjustment opportunity on premium dairy items without affecting demand.',
    impact: '+R28,400',
    impactType: 'revenue',
    confidence: 87,
    priority: 'medium',
    category: 'Pricing',
    action: 'Review Prices'
  },
  {
    id: 3,
    title: 'Respond to QuickSpar RFQ',
    description: 'High probability (89%) of winning this R18,500 RFQ based on your competitive pricing and delivery reliability.',
    impact: 'R18,500',
    impactType: 'potential',
    confidence: 89,
    priority: 'high',
    category: 'Sales',
    action: 'Submit Quote'
  }
]

const predictiveMetrics = {
  nextMonthRevenue: {
    predicted: 52400,
    current: 45230,
    confidence: 91,
    trend: 'up',
    range: { min: 48200, max: 56600 }
  },
  stockoutRisk: [
    { product: 'Fresh Produce Bundle', daysUntilStockout: 5, risk: 'high', confidence: 94 },
    { product: 'Dairy Products Mix', daysUntilStockout: 12, risk: 'medium', confidence: 88 },
    { product: 'Cleaning Supplies', daysUntilStockout: 18, risk: 'low', confidence: 82 }
  ],
  risingDemand: [
    { product: 'Organic Vegetables', trend: 34, confidence: 91 },
    { product: 'Premium Cheese', trend: 28, confidence: 86 },
    { product: 'Craft Beverages', trend: 22, confidence: 83 }
  ],
  optimalInventory: [
    { product: 'Fresh Produce Bundle', current: 45, optimal: 62, unit: 'packs' },
    { product: 'Dairy Products', current: 38, optimal: 52, unit: 'units' },
    { product: 'Beverages', current: 52, optimal: 48, unit: 'cases' }
  ]
}

const performanceBenchmarks = {
  overallScore: 87,
  categoryRank: 12,
  totalSuppliers: 156,
  metrics: [
    { name: 'Order Fulfillment Rate', yourScore: 96, avgScore: 89, topScore: 99, status: 'above' },
    { name: 'On-Time Delivery', yourScore: 94, avgScore: 85, topScore: 98, status: 'above' },
    { name: 'Price Competitiveness', yourScore: 78, avgScore: 82, topScore: 95, status: 'below' },
    { name: 'Product Quality Rating', yourScore: 92, avgScore: 88, topScore: 97, status: 'above' },
    { name: 'Response Time', yourScore: 88, avgScore: 76, topScore: 95, status: 'above' }
  ],
  improvements: [
    { area: 'Pricing Strategy', potential: '+15% orders', effort: 'medium' },
    { area: 'Product Catalog Expansion', potential: '+R8,500/month', effort: 'low' },
    { area: 'Delivery Speed', potential: '+8% customer retention', effort: 'high' }
  ]
}

const anomalyAlerts = [
  {
    id: 1,
    type: 'demand_spike',
    severity: 'high',
    title: 'Unusual Demand Spike Detected',
    description: 'Fresh Produce orders increased 47% above normal in the last 48 hours. Consider expedited restocking.',
    timestamp: '2 hours ago',
    affected: 'Fresh Produce Category'
  },
  {
    id: 2,
    type: 'price_deviation',
    severity: 'medium',
    title: 'Competitor Price Change Alert',
    description: '3 competitors lowered dairy prices by 5-8%. Your pricing may need adjustment to remain competitive.',
    timestamp: '5 hours ago',
    affected: 'Dairy Products'
  },
  {
    id: 3,
    type: 'pattern_anomaly',
    severity: 'low',
    title: 'Order Pattern Shift',
    description: 'Weekend orders from QuickSpar Foods shifted to weekdays. Monitor for trend continuation.',
    timestamp: '1 day ago',
    affected: 'QuickSpar Foods'
  }
]

// Revenue chart data with AI predictions
const revenueChartData = [
  { month: 'Jul', actual: 38500, predicted: null, anomaly: false, lower: null, upper: null },
  { month: 'Aug', actual: 41200, predicted: null, anomaly: false, lower: null, upper: null },
  { month: 'Sep', actual: 39800, predicted: null, anomaly: true, lower: null, upper: null },
  { month: 'Oct', actual: 43600, predicted: null, anomaly: false, lower: null, upper: null },
  { month: 'Nov', actual: 45230, predicted: null, anomaly: false, lower: null, upper: null },
  { month: 'Dec', actual: null, predicted: 52400, anomaly: false, lower: 48200, upper: 56600 },
  { month: 'Jan', actual: null, predicted: 55800, anomaly: false, lower: 49500, upper: 62100 },
]

// Demand forecast chart data
const demandForecastData = [
  { week: 'W1', actual: 124, predicted: null, seasonal: 118, anomaly: false },
  { week: 'W2', actual: 138, predicted: null, seasonal: 125, anomaly: false },
  { week: 'W3', actual: 145, predicted: null, seasonal: 132, anomaly: true },
  { week: 'W4', actual: 152, predicted: null, seasonal: 140, anomaly: false },
  { week: 'W5', actual: null, predicted: 168, seasonal: 145, anomaly: false },
  { week: 'W6', actual: null, predicted: 175, seasonal: 150, anomaly: false },
  { week: 'W7', actual: null, predicted: 182, seasonal: 158, anomaly: false },
  { week: 'W8', actual: null, predicted: 178, seasonal: 162, anomaly: false },
]

// Category performance data
const categoryPerformanceData = [
  { category: 'Fresh Produce', revenue: 22500, growth: 23, prediction: '+18%', confidence: 91 },
  { category: 'Dairy Products', revenue: 18200, growth: 12, prediction: '+8%', confidence: 86 },
  { category: 'Beverages', revenue: 15600, growth: -3, prediction: '+5%', confidence: 78 },
  { category: 'Cleaning Supplies', revenue: 8700, growth: 8, prediction: '+12%', confidence: 83 },
  { category: 'Packaging', revenue: 12300, growth: 15, prediction: '+10%', confidence: 88 },
]

const chartConfig = {
  actual: { label: 'Actual', color: '#00897B' },
  predicted: { label: 'AI Predicted', color: '#9333ea' },
  lower: { label: 'Lower Bound', color: '#c4b5fd' },
  upper: { label: 'Upper Bound', color: '#c4b5fd' },
  seasonal: { label: 'Seasonal Pattern', color: '#14b8a6' },
  anomaly: { label: 'Anomaly', color: '#f59e0b' },
}

export default function SupplierAnalyticsPage() {
  const { supplier } = useSupplierAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')
  const [selectedRecommendation, setSelectedRecommendation] = useState<number | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600)
    return () => clearTimeout(timer)
  }, [supplier])

  const formatCurrency = (amount: number) => 
    `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 0 })}`

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200'
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'demand_spike': return TrendingUp
      case 'price_deviation': return DollarSign
      case 'pattern_anomaly': return Activity
      default: return AlertCircle
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin h-10 w-10 border-2 border-purple-500 border-t-transparent rounded-full mx-auto" />
            <Brain className="h-5 w-5 text-purple-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-[#757575] mt-4 text-sm">GroAI is analyzing your data...</p>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#1A1A1A]">Analytics & Insights</h1>
              <p className="text-[#757575] text-sm">AI-powered business intelligence for your supplier portal</p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="12m">Last 12 months</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* GroAI Summary Card */}
          <Card className={`${GROAI_GRADIENT} text-white overflow-hidden relative`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                      <Brain className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">GroAI Summary</h2>
                      <p className="text-white/80 text-sm">AI-powered insights • Updated {groaiInsight.lastUpdated}</p>
                    </div>
                  </div>
                  
                  <div className="bg-white/10 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <p className="text-sm leading-relaxed">{groaiInsight.insight}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white/10 rounded-lg p-3">
                      <p className="text-white/70 text-xs mb-1">AI Confidence</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold">{groaiInsight.confidence}%</p>
                        <Progress value={groaiInsight.confidence} className="h-2 flex-1 bg-white/20" />
                      </div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3">
                      <p className="text-white/70 text-xs mb-1">Recommendations</p>
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        <p className="text-2xl font-bold">{groaiInsight.recommendationsCount}</p>
                        <span className="text-sm text-white/70">actions</span>
                      </div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3">
                      <p className="text-white/70 text-xs mb-1">Revenue Opportunity</p>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        <p className="text-2xl font-bold">{formatCurrency(groaiInsight.revenueOpportunity)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Link href="/grosupply/supplier/portal/analytics">
                  <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Full Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Anomaly Alerts */}
          {anomalyAlerts.length > 0 && (
            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Anomaly Alerts
                    <Badge className="bg-amber-100 text-amber-700 ml-2">{anomalyAlerts.length} active</Badge>
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-[#00897B]">
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {anomalyAlerts.map((alert) => {
                    const AlertIcon = getAlertIcon(alert.type)
                    return (
                      <div 
                        key={alert.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}
                      >
                        <AlertIcon className="h-5 w-5 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">{alert.title}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs capitalize">{alert.severity}</Badge>
                              <span className="text-xs opacity-70">{alert.timestamp}</span>
                            </div>
                          </div>
                          <p className="text-xs opacity-80 mt-1">{alert.description}</p>
                          <p className="text-xs opacity-60 mt-1">Affected: {alert.affected}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI-Enhanced Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Forecast Chart */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-[#00897B]" />
                      Revenue Forecast
                    </CardTitle>
                    <CardDescription className="text-xs">Actual vs AI-predicted with confidence bands</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-[#757575]" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs max-w-xs">Dotted lines show AI predictions. Shaded areas indicate 95% confidence intervals. Orange dots mark detected anomalies.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-64">
                  <ComposedChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R${(v/1000)}k`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="upper"
                      stroke="none"
                      fill="#c4b5fd"
                      fillOpacity={0.2}
                    />
                    <Area
                      type="monotone"
                      dataKey="lower"
                      stroke="none"
                      fill="#c4b5fd"
                      fillOpacity={0.2}
                    />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke="#00897B"
                      strokeWidth={2}
                      dot={{ r: 4, fill: '#00897B' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="predicted"
                      stroke="#9333ea"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 4, fill: '#9333ea' }}
                    />
                    <Scatter 
                      dataKey="anomaly" 
                      fill="#f59e0b" 
                      shape="circle"
                      data={revenueChartData.filter(d => d.anomaly)}
                    />
                  </ComposedChart>
                </ChartContainer>
                <div className="flex items-center justify-center gap-6 mt-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-[#00897B]" />
                    <span className="text-[#757575]">Actual</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-purple-500 border-dashed" style={{ borderTop: '2px dashed #9333ea' }} />
                    <span className="text-[#757575]">AI Predicted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-[#757575]">Anomaly</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-3 bg-purple-200 opacity-50" />
                    <span className="text-[#757575]">Confidence Band</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Demand Forecast Chart */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5 text-[#00897B]" />
                      Demand Forecast
                    </CardTitle>
                    <CardDescription className="text-xs">Weekly order volume with seasonal patterns</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-[#757575]" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs max-w-xs">Teal line shows seasonal baseline. Purple dotted line is AI prediction for future weeks.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-64">
                  <ComposedChart data={demandForecastData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="seasonal"
                      stroke="#14b8a6"
                      strokeWidth={2}
                      strokeDasharray="3 3"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke="#00897B"
                      strokeWidth={2}
                      dot={{ r: 4, fill: '#00897B' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="predicted"
                      stroke="#9333ea"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 4, fill: '#9333ea' }}
                    />
                    <ReferenceLine y={150} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Capacity', fontSize: 10 }} />
                  </ComposedChart>
                </ChartContainer>
                <div className="flex items-center justify-center gap-6 mt-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-[#00897B]" />
                    <span className="text-[#757575]">Actual Orders</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-teal-500" style={{ borderTop: '2px dashed #14b8a6' }} />
                    <span className="text-[#757575]">Seasonal Pattern</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-purple-500" style={{ borderTop: '2px dashed #9333ea' }} />
                    <span className="text-[#757575]">AI Forecast</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Smart Recommendations Panel */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className={`${GROAI_GRADIENT} p-1.5 rounded-lg`}>
                    <Brain className="h-4 w-4 text-white" />
                  </div>
                  Smart Recommendations
                  <Badge className="bg-purple-100 text-purple-700 ml-2">Powered by GroAI</Badge>
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-purple-600">
                  View All ({aiRecommendations.length})
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {aiRecommendations.map((rec, idx) => (
                  <div 
                    key={rec.id}
                    className={`p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
                      selectedRecommendation === idx 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                    onClick={() => setSelectedRecommendation(selectedRecommendation === idx ? null : idx)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Badge className={`${
                        rec.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      } text-xs`}>
                        {rec.priority} priority
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-purple-600">
                        <Zap className="h-3 w-3" />
                        {rec.confidence}% confidence
                      </div>
                    </div>
                    <h4 className="font-semibold text-sm text-[#1A1A1A] mb-1">{rec.title}</h4>
                    <p className="text-xs text-[#757575] mb-3 line-clamp-2">{rec.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-semibold text-green-600">{rec.impact}</span>
                      </div>
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white text-xs">
                        {rec.action}
                      </Button>
                    </div>

                    {selectedRecommendation === idx && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-[#757575] mb-2">
                          <strong>Why this recommendation?</strong>
                        </p>
                        <p className="text-xs text-[#757575]">
                          Based on analysis of {rec.confidence > 90 ? 'over 10,000' : '5,000+'} similar scenarios, 
                          this action has a {rec.confidence}% success rate for suppliers in your category.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Predictive Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Next Month Revenue Prediction */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-purple-600" />
                  Revenue Prediction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <p className="text-3xl font-bold text-[#1A1A1A]">
                    {formatCurrency(predictiveMetrics.nextMonthRevenue.predicted)}
                  </p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {predictiveMetrics.nextMonthRevenue.trend === 'up' ? (
                      <ArrowUpRight className="h-4 w-4 text-green-600" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`text-sm ${
                      predictiveMetrics.nextMonthRevenue.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {predictiveMetrics.nextMonthRevenue.predicted > predictiveMetrics.nextMonthRevenue.current ? '+' : ''}
                      {Math.round(((predictiveMetrics.nextMonthRevenue.predicted - predictiveMetrics.nextMonthRevenue.current) / predictiveMetrics.nextMonthRevenue.current) * 100)}%
                    </span>
                    <span className="text-xs text-[#757575]">vs current</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#757575]">AI Confidence</span>
                    <span className="font-medium">{predictiveMetrics.nextMonthRevenue.confidence}%</span>
                  </div>
                  <Progress value={predictiveMetrics.nextMonthRevenue.confidence} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-[#757575] mt-2">
                    <span>Range: {formatCurrency(predictiveMetrics.nextMonthRevenue.range.min)}</span>
                    <span>- {formatCurrency(predictiveMetrics.nextMonthRevenue.range.max)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stockout Risk */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Stockout Risk
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {predictiveMetrics.stockoutRisk.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-[#1A1A1A] truncate">{item.product}</p>
                        <p className="text-xs text-[#757575]">{item.daysUntilStockout} days left</p>
                      </div>
                      <Badge className={`${
                        item.risk === 'high' ? 'bg-red-100 text-red-700' :
                        item.risk === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-green-100 text-green-700'
                      } text-xs`}>
                        {item.risk}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Rising Demand */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Rising Demand
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {predictiveMetrics.risingDemand.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-[#1A1A1A] truncate">{item.product}</p>
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <ArrowUpRight className="h-3 w-3" />
                          +{item.trend}% trend
                        </p>
                      </div>
                      <div className="text-xs text-purple-600">
                        {item.confidence}% conf.
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Optimal Inventory */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Box className="h-5 w-5 text-[#00897B]" />
                  Optimal Inventory
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {predictiveMetrics.optimalInventory.map((item, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-gray-50">
                      <p className="text-xs font-medium text-[#1A1A1A] truncate">{item.product}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-[#757575]">Current: {item.current} {item.unit}</span>
                        <span className="text-xs text-purple-600 font-medium">
                          Optimal: {item.optimal}
                        </span>
                      </div>
                      <Progress 
                        value={(item.current / item.optimal) * 100} 
                        className="h-1.5 mt-1" 
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Benchmarks */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-5 w-5 text-[#00897B]" />
                  Performance Benchmarks
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-100 text-purple-700">
                    Rank #{performanceBenchmarks.categoryRank} of {performanceBenchmarks.totalSuppliers}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Metrics Comparison */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-[#1A1A1A]">Your Performance vs Category Average</h4>
                  {performanceBenchmarks.metrics.map((metric, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#757575]">{metric.name}</span>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${
                            metric.status === 'above' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {metric.yourScore}%
                          </span>
                          {metric.status === 'above' ? (
                            <ArrowUpRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                      </div>
                      <div className="relative h-2 bg-gray-200 rounded-full">
                        {/* Category average */}
                        <div 
                          className="absolute h-full bg-gray-400 rounded-full"
                          style={{ width: `${metric.avgScore}%` }}
                        />
                        {/* Your score */}
                        <div 
                          className={`absolute h-full rounded-full ${
                            metric.status === 'above' ? 'bg-green-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${metric.yourScore}%`, opacity: 0.7 }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-[#757575]">
                        <span>Category Avg: {metric.avgScore}%</span>
                        <span>Top Score: {metric.topScore}%</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Improvement Opportunities */}
                <div>
                  <h4 className="text-sm font-semibold text-[#1A1A1A] mb-4">Improvement Opportunities</h4>
                  <div className="space-y-3">
                    {performanceBenchmarks.improvements.map((improvement, idx) => (
                      <div 
                        key={idx}
                        className="p-3 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm text-[#1A1A1A]">{improvement.area}</span>
                          <Badge variant="outline" className={`text-xs ${
                            improvement.effort === 'low' ? 'border-green-500 text-green-600' :
                            improvement.effort === 'medium' ? 'border-amber-500 text-amber-600' :
                            'border-red-500 text-red-600'
                          }`}>
                            {improvement.effort} effort
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-green-600">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-sm font-medium">{improvement.potential}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Overall Score */}
                  <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-purple-50 to-teal-50 border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-[#1A1A1A]">Overall GroAI Score</p>
                        <p className="text-xs text-[#757575]">Based on all performance metrics</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-purple-600">{performanceBenchmarks.overallScore}</p>
                        <p className="text-xs text-green-600">+5 from last month</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Performance */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <PieChart className="h-5 w-5 text-[#00897B]" />
                Category Performance with AI Predictions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-[#757575] border-b">
                      <th className="text-left pb-3 font-medium">Category</th>
                      <th className="text-right pb-3 font-medium">Revenue</th>
                      <th className="text-right pb-3 font-medium">Growth</th>
                      <th className="text-right pb-3 font-medium">AI Prediction</th>
                      <th className="text-right pb-3 font-medium">Confidence</th>
                      <th className="text-right pb-3 font-medium">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {categoryPerformanceData.map((cat, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="py-3">
                          <span className="font-medium text-sm text-[#1A1A1A]">{cat.category}</span>
                        </td>
                        <td className="py-3 text-right text-sm font-medium text-[#1A1A1A]">
                          {formatCurrency(cat.revenue)}
                        </td>
                        <td className="py-3 text-right">
                          <span className={`text-sm flex items-center justify-end gap-1 ${
                            cat.growth > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {cat.growth > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {Math.abs(cat.growth)}%
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <span className="text-sm text-purple-600 font-medium">{cat.prediction}</span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Progress value={cat.confidence} className="h-1.5 w-12" />
                            <span className="text-xs text-[#757575]">{cat.confidence}%</span>
                          </div>
                        </td>
                        <td className="py-3 text-right">
                          <div className="w-16 h-6 ml-auto">
                            <svg viewBox="0 0 64 24" className="w-full h-full">
                              <polyline
                                points={cat.growth > 0 
                                  ? "0,20 16,18 32,14 48,10 64,4" 
                                  : "0,4 16,6 32,10 48,14 64,20"}
                                fill="none"
                                stroke={cat.growth > 0 ? "#16a34a" : "#dc2626"}
                                strokeWidth="2"
                              />
                            </svg>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-[#757575]">
              <Brain className="h-4 w-4 text-purple-600" />
              <span>Powered by GroAI • Last analysis: {groaiInsight.lastUpdated}</span>
            </div>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Analysis
            </Button>
          </div>
        </div>
      </ScrollArea>
    </TooltipProvider>
  )
}
