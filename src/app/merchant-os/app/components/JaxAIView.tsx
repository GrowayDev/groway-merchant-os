'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Package,
  ShoppingCart,
  BarChart3,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Lightbulb,
  ArrowRight,
  Zap,
  RefreshCw,
  Send,
  FileText,
  DollarSign,
  Percent,
  AlertCircle,
  Info,
  ChevronRight,
  Sparkles,
  Target,
  Clock4,
  Building2,
  Truck,
  Trash2,
  Tag,
  ArrowDown,
  History,
  Filter,
  Search,
  MoreHorizontal,
  LucideIcon,
} from 'lucide-react'

// Types
interface DemandForecast {
  productId: string
  productName: string
  sku: string
  category: string
  currentStock: number
  predictedDemand: number
  confidence: number
  trend: 'up' | 'down' | 'stable'
  seasonalFactor: number
  daysOfStock: number
  recommendedOrder: number
  accuracy: number
}

interface ReorderSuggestion {
  id: string
  productId: string
  productName: string
  sku: string
  currentStock: number
  reorderPoint: number
  suggestedQty: number
  eoq: number
  leadTime: number
  supplierId: string
  supplierName: string
  unitCost: number
  totalCost: number
  savingsVsRetail: number
  urgency: 'critical' | 'high' | 'normal' | 'low'
  confidence: number
  reason: string
}

interface DeadStockPrediction {
  id: string
  productId: string
  productName: string
  sku: string
  category: string
  stockQuantity: number
  stockValue: number
  daysSinceLastSale: number
  deadStockProbability: number
  holdingCostPerMonth: number
  suggestedAction: 'markdown' | 'clearance' | 'liquidate' | 'donate' | 'return'
  markdownPercent: number
  projectedRecovery: number
}

interface AIInsight {
  id: string
  type: 'demand' | 'reorder' | 'dead_stock' | 'anomaly' | 'opportunity' | 'warning'
  priority: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  recommendation: string
  confidence: number
  impact: string
  actionRequired: boolean
  actionLabel?: string
  productId?: string
  productName?: string
  createdAt: string
  category: string
}

interface AnomalyAlert {
  id: string
  type: 'unusual_spike' | 'unusual_drop' | 'pattern_break' | 'seasonal_deviation'
  productId: string
  productName: string
  description: string
  severity: 'high' | 'medium' | 'low'
  detectedAt: string
  expectedValue: number
  actualValue: number
  deviationPercent: number
}

// South African Holidays for seasonal analysis
const SA_HOLIDAYS = [
  { name: 'Christmas', date: '2024-12-25', impact: 'high', categories: ['all'] },
  { name: 'Easter', date: '2024-03-29', impact: 'high', categories: ['all'] },
  { name: 'Heritage Day', date: '2024-09-24', impact: 'medium', categories: ['all'] },
  { name: 'Freedom Day', date: '2024-04-27', impact: 'medium', categories: ['all'] },
  { name: 'Youth Day', date: '2024-06-16', impact: 'medium', categories: ['all'] },
  { name: 'Workers Day', date: '2024-05-01', impact: 'medium', categories: ['all'] },
]

// Mock data generators
const generateMockForecasts = (): DemandForecast[] => {
  const products = [
    { name: 'Coca-Cola 340ml', sku: 'BEV-001', category: 'Beverages' },
    { name: 'White Bread', sku: 'BAK-001', category: 'Bakery' },
    { name: 'Sunflower Oil 750ml', sku: 'GRO-001', category: 'Groceries' },
    { name: 'Chicken Portions 1kg', sku: 'FRO-001', category: 'Frozen' },
    { name: 'Milk 2L', sku: 'DAI-001', category: 'Dairy' },
    { name: 'Rice 5kg', sku: 'GRO-002', category: 'Groceries' },
    { name: 'Washing Powder 2kg', sku: 'HOU-001', category: 'Household' },
    { name: 'Bread Rolls (6pk)', sku: 'BAK-002', category: 'Bakery' },
  ]

  return products.map((p, i) => ({
    productId: `prod-${i + 1}`,
    productName: p.name,
    sku: p.sku,
    category: p.category,
    currentStock: Math.floor(Math.random() * 100) + 10,
    predictedDemand: Math.floor(Math.random() * 50) + 20,
    confidence: Math.floor(Math.random() * 20) + 75,
    trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable',
    seasonalFactor: Math.random() * 0.4 + 0.8,
    daysOfStock: Math.floor(Math.random() * 30) + 3,
    recommendedOrder: Math.floor(Math.random() * 100) + 20,
    accuracy: Math.floor(Math.random() * 15) + 80,
  }))
}

const generateMockReorderSuggestions = (): ReorderSuggestion[] => {
  const suppliers = [
    { id: 'sup-1', name: 'Tiger Brands', leadTime: 3 },
    { id: 'sup-2', name: 'Clover SA', leadTime: 2 },
    { id: 'sup-3', name: 'Nampak Distribution', leadTime: 5 },
    { id: 'sup-4', name: 'Freshmark', leadTime: 1 },
    { id: 'sup-5', name: 'Unilever SA', leadTime: 4 },
  ]

  const products = [
    { name: 'Coca-Cola 340ml (Case)', sku: 'BEV-001-C', cost: 180, retail: 220 },
    { name: 'White Bread (Bulk)', sku: 'BAK-001-B', cost: 45, retail: 55 },
    { name: 'Sunflower Oil 750ml', sku: 'GRO-001', cost: 32, retail: 42 },
    { name: 'Chicken Portions 1kg', sku: 'FRO-001', cost: 85, retail: 105 },
    { name: 'Milk 2L (Crate)', sku: 'DAI-001-C', cost: 280, retail: 340 },
  ]

  const urgencies: ('critical' | 'high' | 'normal' | 'low')[] = ['critical', 'high', 'normal', 'low']
  const reasons = [
    'Stock below reorder point',
    'High demand forecast',
    'Seasonal preparation',
    'Lead time buffer needed',
    'Supplier promotion ending',
  ]

  return products.map((p, i) => {
    const supplier = suppliers[i % suppliers.length]
    const suggestedQty = Math.floor(Math.random() * 50) + 10
    return {
      id: `ro-${i + 1}`,
      productId: `prod-${i + 1}`,
      productName: p.name,
      sku: p.sku,
      currentStock: Math.floor(Math.random() * 20) + 2,
      reorderPoint: Math.floor(Math.random() * 15) + 10,
      suggestedQty,
      eoq: Math.floor(suggestedQty * 1.2),
      leadTime: supplier.leadTime,
      supplierId: supplier.id,
      supplierName: supplier.name,
      unitCost: p.cost,
      totalCost: suggestedQty * p.cost,
      savingsVsRetail: suggestedQty * (p.retail - p.cost),
      urgency: urgencies[Math.floor(Math.random() * urgencies.length)],
      confidence: Math.floor(Math.random() * 20) + 75,
      reason: reasons[Math.floor(Math.random() * reasons.length)],
    }
  })
}

const generateMockDeadStock = (): DeadStockPrediction[] => {
  const products = [
    { name: 'Premium Gift Set', sku: 'GFT-001', category: 'Gifts', stock: 15, value: 4500 },
    { name: 'Seasonal Decor', sku: 'DEC-001', category: 'Seasonal', stock: 30, value: 2100 },
    { name: 'Old Brand Cereal', sku: 'GRO-050', category: 'Groceries', stock: 25, value: 875 },
    { name: 'Discontinued Snack', sku: 'SNK-020', category: 'Snacks', stock: 40, value: 1200 },
    { name: 'Export Batch Wine', sku: 'BEV-100', category: 'Beverages', stock: 12, value: 3600 },
    { name: 'Summer Collection', sku: 'APP-015', category: 'Apparel', stock: 20, value: 5800 },
  ]

  const actions: ('markdown' | 'clearance' | 'liquidate' | 'donate' | 'return')[] = 
    ['markdown', 'clearance', 'liquidate', 'donate', 'return']

  return products.map((p, i) => ({
    id: `ds-${i + 1}`,
    productId: `prod-${100 + i}`,
    productName: p.name,
    sku: p.sku,
    category: p.category,
    stockQuantity: p.stock,
    stockValue: p.value,
    daysSinceLastSale: Math.floor(Math.random() * 180) + 60,
    deadStockProbability: Math.floor(Math.random() * 30) + 65,
    holdingCostPerMonth: p.value * 0.02,
    suggestedAction: actions[Math.floor(Math.random() * actions.length)],
    markdownPercent: Math.floor(Math.random() * 40) + 20,
    projectedRecovery: p.value * (0.4 + Math.random() * 0.3),
  }))
}

const generateMockInsights = (): AIInsight[] => {
  const insights: AIInsight[] = [
    {
      id: 'ins-1',
      type: 'demand',
      priority: 'critical',
      title: 'Demand Surge Expected',
      description: 'Coca-Cola products showing 45% demand increase trend for upcoming week. Historical patterns indicate month-end purchasing spike.',
      recommendation: 'Increase stock levels by 30% before 25th of the month. Consider bulk order from Tiger Brands.',
      confidence: 92,
      impact: 'Potential revenue gain: R15,000+ if stocked appropriately',
      actionRequired: true,
      actionLabel: 'Create Order',
      productId: 'prod-1',
      productName: 'Coca-Cola 340ml',
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      category: 'Demand Forecasting',
    },
    {
      id: 'ins-2',
      type: 'anomaly',
      priority: 'high',
      title: 'Unusual Sales Pattern Detected',
      description: 'Bread sales dropped 35% compared to typical Tuesday patterns. This deviation is outside normal variance.',
      recommendation: 'Check competitor pricing, verify product freshness, and review shelf placement.',
      confidence: 88,
      impact: 'Potential revenue loss: R2,500 daily',
      actionRequired: true,
      actionLabel: 'Investigate',
      productId: 'prod-2',
      productName: 'White Bread',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      category: 'Anomaly Detection',
    },
    {
      id: 'ins-3',
      type: 'reorder',
      priority: 'high',
      title: 'Stock-Out Risk Alert',
      description: 'Sunflower Oil will reach stock-out in 4 days based on current velocity. Lead time from supplier is 5 days.',
      recommendation: 'Place emergency order immediately or arrange transfer from nearby branch.',
      confidence: 95,
      impact: 'Potential lost sales: R8,000+ if stock-out occurs',
      actionRequired: true,
      actionLabel: 'Order Now',
      productId: 'prod-3',
      productName: 'Sunflower Oil 750ml',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      category: 'Reorder Alerts',
    },
    {
      id: 'ins-4',
      type: 'dead_stock',
      priority: 'medium',
      title: 'Dead Stock Opportunity',
      description: '12 items identified with <5% chance of selling at current price. Total holding cost: R420/month.',
      recommendation: 'Implement 30% markdown on seasonal items. Projected recovery: R8,400.',
      confidence: 85,
      impact: 'Recover R8,400 vs R0 if left unsold',
      actionRequired: true,
      actionLabel: 'Apply Markdown',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      category: 'Dead Stock Prevention',
    },
    {
      id: 'ins-5',
      type: 'opportunity',
      priority: 'medium',
      title: 'Bulk Order Savings',
      description: 'Combining orders for Milk, Bread, and Oil from Clover SA saves R1,200 in delivery fees.',
      recommendation: 'Consolidate weekly orders to Thursday delivery schedule.',
      confidence: 91,
      impact: 'Monthly savings: R4,800',
      actionRequired: false,
      actionLabel: 'View Order Plan',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
      category: 'Cost Optimization',
    },
    {
      id: 'ins-6',
      type: 'warning',
      priority: 'low',
      title: 'Seasonal Preparation',
      description: 'Easter holiday in 3 weeks. Historical data shows 60% increase in chocolate and beverage sales.',
      recommendation: 'Begin building stock for holiday items. Suggested order quantities calculated.',
      confidence: 78,
      impact: 'Potential revenue opportunity: R25,000+',
      actionRequired: false,
      actionLabel: 'View Forecast',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      category: 'Seasonal Planning',
    },
  ]
  return insights
}

const generateMockAnomalies = (): AnomalyAlert[] => {
  return [
    {
      id: 'anom-1',
      type: 'unusual_spike',
      productId: 'prod-1',
      productName: 'Coca-Cola 340ml',
      description: 'Sales 150% above normal for this time of day',
      severity: 'high',
      detectedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      expectedValue: 12,
      actualValue: 30,
      deviationPercent: 150,
    },
    {
      id: 'anom-2',
      type: 'unusual_drop',
      productId: 'prod-5',
      productName: 'Milk 2L',
      description: 'Morning sales 60% below usual pattern',
      severity: 'medium',
      detectedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      expectedValue: 25,
      actualValue: 10,
      deviationPercent: -60,
    },
    {
      id: 'anom-3',
      type: 'pattern_break',
      productId: 'prod-3',
      productName: 'Sunflower Oil 750ml',
      description: 'Weekend sales pattern not matching historical trend',
      severity: 'low',
      detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      expectedValue: 8,
      actualValue: 3,
      deviationPercent: -62.5,
    },
  ]
}

// Priority color mapping
const getPriorityColor = (priority: string) => {
  const colors = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-green-100 text-green-700 border-green-200',
  }
  return colors[priority as keyof typeof colors] || colors.medium
}

const getPriorityBg = (priority: string) => {
  const colors = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500',
  }
  return colors[priority as keyof typeof colors] || colors.medium
}

const getUrgencyColor = (urgency: string) => {
  const colors = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    normal: 'bg-blue-100 text-blue-700',
    low: 'bg-gray-100 text-gray-700',
  }
  return colors[urgency as keyof typeof colors] || colors.normal
}

const getTrendIcon = (trend: string) => {
  if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />
  if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />
  return <Minus className="h-4 w-4 text-gray-500" />
}

const getInsightIcon = (type: string): LucideIcon => {
  const icons: Record<string, LucideIcon> = {
    demand: TrendingUp,
    reorder: ShoppingCart,
    dead_stock: Trash2,
    anomaly: AlertTriangle,
    opportunity: Lightbulb,
    warning: AlertCircle,
  }
  return icons[type] || Info
}

export function JaxAIView() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isLoading, setIsLoading] = useState(false)
  const [forecasts, setForecasts] = useState<DemandForecast[]>([])
  const [reorderSuggestions, setReorderSuggestions] = useState<ReorderSuggestion[]>([])
  const [deadStockPredictions, setDeadStockPredictions] = useState<DeadStockPrediction[]>([])
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [anomalies, setAnomalies] = useState<AnomalyAlert[]>([])
  const [selectedForecast, setSelectedForecast] = useState<DemandForecast | null>(null)
  const [selectedReorder, setSelectedReorder] = useState<ReorderSuggestion | null>(null)
  const [selectedDeadStock, setSelectedDeadStock] = useState<DeadStockPrediction | null>(null)
  const [rfqDialogOpen, setRfqDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')

  // Load data function - defined at component level for reuse
  const loadData = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    setForecasts(generateMockForecasts())
    setReorderSuggestions(generateMockReorderSuggestions())
    setDeadStockPredictions(generateMockDeadStock())
    setInsights(generateMockInsights())
    setAnomalies(generateMockAnomalies())
    setIsLoading(false)
  }

  // Load data on mount - using void to explicitly indicate fire-and-forget
  useEffect(() => {
    void (async () => {
      setIsLoading(true)
      await new Promise(resolve => setTimeout(resolve, 500))
      setForecasts(generateMockForecasts())
      setReorderSuggestions(generateMockReorderSuggestions())
      setDeadStockPredictions(generateMockDeadStock())
      setInsights(generateMockInsights())
      setAnomalies(generateMockAnomalies())
      setIsLoading(false)
    })()
  }, [])

  const generateForecast = async () => {
    setIsLoading(true)
    // In production, this would call the API
    await new Promise(resolve => setTimeout(resolve, 1000))
    setForecasts(generateMockForecasts())
    setIsLoading(false)
  }

  const generateInsights = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setInsights(generateMockInsights())
    setIsLoading(false)
  }

  // Calculate summary stats
  const stats = {
    totalForecasts: forecasts.length,
    avgConfidence: forecasts.length > 0 
      ? Math.round(forecasts.reduce((sum, f) => sum + f.confidence, 0) / forecasts.length)
      : 0,
    criticalReorders: reorderSuggestions.filter(r => r.urgency === 'critical').length,
    totalReorderValue: reorderSuggestions.reduce((sum, r) => sum + r.totalCost, 0),
    potentialSavings: reorderSuggestions.reduce((sum, r) => sum + r.savingsVsRetail, 0),
    deadStockValue: deadStockPredictions.reduce((sum, d) => sum + d.stockValue, 0),
    deadStockItems: deadStockPredictions.length,
    totalHoldingCost: deadStockPredictions.reduce((sum, d) => sum + d.holdingCostPerMonth, 0),
    criticalInsights: insights.filter(i => i.priority === 'critical').length,
    activeAnomalies: anomalies.length,
  }

  // Dashboard Tab Content
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1A1A] flex items-center gap-2">
            <Brain className="h-7 w-7 text-[#00897B]" />
            JAX AI Intelligence Dashboard
          </h2>
          <p className="text-gray-500 mt-1">AI-powered inventory optimization for South African retail</p>
        </div>
        <Button 
          onClick={loadData}
          disabled={isLoading}
          className="bg-[#00897B] hover:bg-[#00695C]"
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh Analysis
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-[#00897B]/10 to-[#00897B]/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-[#00897B]" />
              <span className="text-xs text-gray-500">Avg Confidence</span>
            </div>
            <p className="text-2xl font-bold text-[#00897B]">{stats.avgConfidence}%</p>
            <p className="text-xs text-green-600 mt-1">High accuracy</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-25">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-xs text-gray-500">Critical Reorders</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.criticalReorders}</p>
            <p className="text-xs text-gray-500 mt-1">Need immediate action</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-25">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-gray-500">Reorder Value</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">R{stats.totalReorderValue.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Suggested orders</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-25">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-xs text-gray-500">Potential Savings</span>
            </div>
            <p className="text-2xl font-bold text-green-600">R{stats.potentialSavings.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">vs retail pricing</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-25">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trash2 className="h-4 w-4 text-orange-500" />
              <span className="text-xs text-gray-500">Dead Stock Risk</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">R{stats.deadStockValue.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">{stats.deadStockItems} items at risk</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-25">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-gray-500">Active Anomalies</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">{stats.activeAnomalies}</p>
            <p className="text-xs text-gray-500 mt-1">Unusual patterns</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Demand Forecast Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#00897B]" />
                7-Day Demand Forecast
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => setActiveTab('forecast')}>
                View Details
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Forecast Chart */}
            <div className="h-64 flex items-end justify-between gap-2 px-4">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                const height = 40 + Math.random() * 50
                return (
                  <div key={day} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-gray-100 rounded-t-lg relative" style={{ height: '100%' }}>
                      <div 
                        className="absolute bottom-0 w-full bg-gradient-to-t from-[#00897B] to-[#00897B]/70 rounded-t-lg transition-all duration-300"
                        style={{ height: `${height}%` }}
                      >
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium text-[#00897B]">
                          {Math.floor(20 + Math.random() * 30)}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{day}</span>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-[#00897B] rounded" />
                <span>Predicted Demand (units)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-200 rounded" />
                <span>Maximum Capacity</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Anomaly Alerts */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Anomaly Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {anomalies.map((anomaly) => (
                  <div 
                    key={anomaly.id}
                    className="p-3 rounded-lg border border-gray-200 hover:border-[#00897B] cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        anomaly.severity === 'high' ? 'bg-red-100 text-red-600' :
                        anomaly.severity === 'medium' ? 'bg-orange-100 text-orange-600' :
                        'bg-yellow-100 text-yellow-600'
                      }`}>
                        <Zap className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-[#1A1A1A] truncate">{anomaly.productName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{anomaly.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-[10px]">
                            {anomaly.deviationPercent > 0 ? '+' : ''}{anomaly.deviationPercent}%
                          </Badge>
                          <span className="text-[10px] text-gray-400">
                            {new Date(anomaly.detectedAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row - Reorder Suggestions & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reorder Suggestions Preview */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-blue-500" />
                Urgent Reorder Suggestions
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => setActiveTab('reorder')}>
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reorderSuggestions.slice(0, 3).map((suggestion) => (
                <div 
                  key={suggestion.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer"
                  onClick={() => setSelectedReorder(suggestion)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-[#1A1A1A] truncate">{suggestion.productName}</p>
                      <Badge className={getUrgencyColor(suggestion.urgency)}>
                        {suggestion.urgency}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Stock: {suggestion.currentStock} | Suggested: {suggestion.suggestedQty} units
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#00897B]">R{suggestion.totalCost.toLocaleString()}</p>
                    <p className="text-xs text-green-600">Save R{suggestion.savingsVsRetail.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Insights Preview */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                AI Insights
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => setActiveTab('insights')}>
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.slice(0, 3).map((insight) => {
                const Icon = getInsightIcon(insight.type)
                return (
                  <div 
                    key={insight.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-[#00897B] cursor-pointer"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      insight.priority === 'critical' ? 'bg-red-100' :
                      insight.priority === 'high' ? 'bg-orange-100' :
                      insight.priority === 'medium' ? 'bg-yellow-100' :
                      'bg-green-100'
                    }`}>
                      <Icon className={`h-4 w-4 ${
                        insight.priority === 'critical' ? 'text-red-600' :
                        insight.priority === 'high' ? 'text-orange-600' :
                        insight.priority === 'medium' ? 'text-yellow-600' :
                        'text-green-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-[#1A1A1A]">{insight.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{insight.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-[10px]">{insight.confidence}% confidence</Badge>
                        <Badge className={getPriorityColor(insight.priority)}>{insight.priority}</Badge>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* South African Context Banner */}
      <Card className="bg-gradient-to-r from-[#00897B]/10 via-[#00897B]/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#00897B]/20 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-[#00897B]" />
            </div>
            <div>
              <p className="font-medium text-[#1A1A1A]">South African Seasonal Factors Active</p>
              <p className="text-sm text-gray-500">
                Accounting for: Month-end payday cycles, Load shedding patterns, Upcoming: Easter (Mar 29), Freedom Day (Apr 27)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Demand Forecast Tab Content
  const renderForecastTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1A1A1A]">Demand Forecasting</h2>
          <p className="text-gray-500">AI-powered 7-day demand predictions with confidence intervals</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button onClick={generateForecast} disabled={isLoading} className="bg-[#00897B] hover:bg-[#00695C]">
            {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Generate Forecast
          </Button>
        </div>
      </div>

      {/* Forecast Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Products</p>
            <p className="text-2xl font-bold text-[#1A1A1A]">{forecasts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Avg Accuracy</p>
            <p className="text-2xl font-bold text-green-600">
              {forecasts.length > 0 ? Math.round(forecasts.reduce((sum, f) => sum + f.accuracy, 0) / forecasts.length) : 0}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Trending Up</p>
            <p className="text-2xl font-bold text-green-600">{forecasts.filter(f => f.trend === 'up').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Trending Down</p>
            <p className="text-2xl font-bold text-red-600">{forecasts.filter(f => f.trend === 'down').length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Forecast Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-gray-500">Product</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-500">Category</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-500">Current Stock</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-500">Predicted Demand</th>
                  <th className="text-center p-4 text-sm font-medium text-gray-500">Trend</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-500">Confidence</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-500">Days of Stock</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-500">Recommended Order</th>
                  <th className="text-center p-4 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {forecasts.map((forecast) => (
                  <tr key={forecast.productId} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-[#1A1A1A]">{forecast.productName}</p>
                        <p className="text-xs text-gray-500">{forecast.sku}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline">{forecast.category}</Badge>
                    </td>
                    <td className="p-4 text-right font-medium">{forecast.currentStock}</td>
                    <td className="p-4 text-right font-medium text-[#00897B]">{forecast.predictedDemand}</td>
                    <td className="p-4 text-center">{getTrendIcon(forecast.trend)}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Progress value={forecast.confidence} className="w-16 h-2" />
                        <span className="text-sm font-medium">{forecast.confidence}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <span className={`font-medium ${
                        forecast.daysOfStock <= 7 ? 'text-red-600' :
                        forecast.daysOfStock <= 14 ? 'text-orange-600' :
                        'text-gray-900'
                      }`}>
                        {forecast.daysOfStock} days
                      </span>
                    </td>
                    <td className="p-4 text-right font-medium text-blue-600">{forecast.recommendedOrder}</td>
                    <td className="p-4 text-center">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedForecast(forecast)}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Seasonal Pattern Detection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#00897B]" />
            Seasonal Pattern Detection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {SA_HOLIDAYS.map((holiday) => (
              <div key={holiday.name} className="p-4 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-sm">{holiday.name}</p>
                  <Badge className={holiday.impact === 'high' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}>
                    {holiday.impact} impact
                  </Badge>
                </div>
                <p className="text-xs text-gray-500">{new Date(holiday.date).toLocaleDateString()}</p>
                <p className="text-xs text-[#00897B] mt-2">Demand forecast adjusted</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Reorder Suggestions Tab Content
  const renderReorderTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1A1A1A]">Reorder Suggestions</h2>
          <p className="text-gray-500">AI-optimized reorder recommendations with EOQ calculations</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            onClick={() => setRfqDialogOpen(true)}
          >
            <Send className="h-4 w-4 mr-2" />
            Generate RFQ
          </Button>
          <Button className="bg-[#00897B] hover:bg-[#00695C]">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Order All Critical
          </Button>
        </div>
      </div>

      {/* Reorder Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="bg-red-50">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Critical</p>
            <p className="text-2xl font-bold text-red-600">{reorderSuggestions.filter(r => r.urgency === 'critical').length}</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">High Priority</p>
            <p className="text-2xl font-bold text-orange-600">{reorderSuggestions.filter(r => r.urgency === 'high').length}</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Normal</p>
            <p className="text-2xl font-bold text-blue-600">{reorderSuggestions.filter(r => r.urgency === 'normal').length}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Value</p>
            <p className="text-2xl font-bold text-green-600">R{stats.totalReorderValue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Potential Savings</p>
            <p className="text-2xl font-bold text-purple-600">R{stats.potentialSavings.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Reorder Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reorderSuggestions.map((suggestion) => (
          <Card 
            key={suggestion.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              suggestion.urgency === 'critical' ? 'border-red-300' :
              suggestion.urgency === 'high' ? 'border-orange-300' :
              'border-gray-200'
            }`}
            onClick={() => setSelectedReorder(suggestion)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-medium text-[#1A1A1A]">{suggestion.productName}</p>
                  <p className="text-xs text-gray-500">{suggestion.sku}</p>
                </div>
                <Badge className={getUrgencyColor(suggestion.urgency)}>{suggestion.urgency}</Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Current Stock:</span>
                  <span className="font-medium">{suggestion.currentStock} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Suggested Order:</span>
                  <span className="font-medium text-[#00897B]">{suggestion.suggestedQty} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">EOQ:</span>
                  <span className="font-medium">{suggestion.eoq} units</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-500">Lead Time:</span>
                  <span className="font-medium">{suggestion.leadTime} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Supplier:</span>
                  <span className="font-medium text-[#00897B]">{suggestion.supplierName}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-lg font-bold text-[#1A1A1A]">R{suggestion.totalCost.toLocaleString()}</p>
                    <p className="text-xs text-green-600">Save R{suggestion.savingsVsRetail.toLocaleString()} vs retail</p>
                  </div>
                  <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C]">
                    Order Now
                  </Button>
                </div>
              </div>

              <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                <p className="text-gray-600">
                  <span className="font-medium">Reason:</span> {suggestion.reason}
                </p>
                <p className="text-[#00897B] mt-1">
                  <span className="font-medium">AI Confidence:</span> {suggestion.confidence}%
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  // Dead Stock Tab Content
  const renderDeadStockTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1A1A1A]">Dead Stock Prediction</h2>
          <p className="text-gray-500">AI-identified slow-moving and at-risk inventory</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button className="bg-[#00897B] hover:bg-[#00695C]">
            <Tag className="h-4 w-4 mr-2" />
            Apply All Markdowns
          </Button>
        </div>
      </div>

      {/* Dead Stock Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-orange-50">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Items at Risk</p>
            <p className="text-2xl font-bold text-orange-600">{stats.deadStockItems}</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Value at Risk</p>
            <p className="text-2xl font-bold text-red-600">R{stats.deadStockValue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Monthly Holding Cost</p>
            <p className="text-2xl font-bold text-yellow-600">R{stats.totalHoldingCost.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Potential Recovery</p>
            <p className="text-2xl font-bold text-green-600">
              R{deadStockPredictions.reduce((sum, d) => sum + d.projectedRecovery, 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Dead Stock Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-gray-500">Product</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-500">Category</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-500">Stock Qty</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-500">Stock Value</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-500">Days Since Sale</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-500">Dead Stock %</th>
                  <th className="text-center p-4 text-sm font-medium text-gray-500">Suggested Action</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-500">Recovery</th>
                </tr>
              </thead>
              <tbody>
                {deadStockPredictions.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-[#1A1A1A]">{item.productName}</p>
                        <p className="text-xs text-gray-500">{item.sku}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline">{item.category}</Badge>
                    </td>
                    <td className="p-4 text-right font-medium">{item.stockQuantity}</td>
                    <td className="p-4 text-right font-medium">R{item.stockValue.toLocaleString()}</td>
                    <td className="p-4 text-right">
                      <span className={`font-medium ${
                        item.daysSinceLastSale > 120 ? 'text-red-600' :
                        item.daysSinceLastSale > 60 ? 'text-orange-600' :
                        'text-yellow-600'
                      }`}>
                        {item.daysSinceLastSale} days
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Progress value={item.deadStockProbability} className="w-16 h-2" />
                        <span className="text-sm font-medium text-red-600">{item.deadStockProbability}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <Badge className={
                        item.suggestedAction === 'liquidate' ? 'bg-red-100 text-red-700' :
                        item.suggestedAction === 'clearance' ? 'bg-orange-100 text-orange-700' :
                        item.suggestedAction === 'markdown' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }>
                        {item.suggestedAction === 'markdown' && `${item.markdownPercent}% `}
                        {item.suggestedAction}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <p className="font-medium text-green-600">R{Math.round(item.projectedRecovery).toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Holding: R{item.holdingCostPerMonth.toFixed(2)}/mo</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Liquidation Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowDown className="h-5 w-5 text-orange-500" />
            Liquidation Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
              <h4 className="font-medium text-yellow-800">30% Markdown</h4>
              <p className="text-sm text-gray-600 mt-1">Items with 60-90 days since last sale</p>
              <p className="text-2xl font-bold text-yellow-600 mt-2">
                {deadStockPredictions.filter(d => d.suggestedAction === 'markdown').length} items
              </p>
            </div>
            <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
              <h4 className="font-medium text-orange-800">Clearance Sale</h4>
              <p className="text-sm text-gray-600 mt-1">Items with 90-120 days since last sale</p>
              <p className="text-2xl font-bold text-orange-600 mt-2">
                {deadStockPredictions.filter(d => d.suggestedAction === 'clearance').length} items
              </p>
            </div>
            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <h4 className="font-medium text-red-800">Liquidation Partner</h4>
              <p className="text-sm text-gray-600 mt-1">Items with 120+ days since last sale</p>
              <p className="text-2xl font-bold text-red-600 mt-2">
                {deadStockPredictions.filter(d => d.suggestedAction === 'liquidate').length} items
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Insights Feed Tab Content
  const renderInsightsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1A1A1A]">AI Insights Feed</h2>
          <p className="text-gray-500">Real-time inventory intelligence and recommendations</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={generateInsights}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate
          </Button>
          <Button className="bg-[#00897B] hover:bg-[#00695C]">
            <Sparkles className="h-4 w-4 mr-2" />
            New Analysis
          </Button>
        </div>
      </div>

      {/* Priority Filters */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Filter by priority:</span>
        {['all', 'critical', 'high', 'medium', 'low'].map((priority) => (
          <Button
            key={priority}
            variant={filterCategory === priority ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterCategory(priority)}
            className={filterCategory === priority ? 'bg-[#00897B] hover:bg-[#00695C]' : ''}
          >
            {priority.charAt(0).toUpperCase() + priority.slice(1)}
          </Button>
        ))}
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        {insights
          .filter(i => filterCategory === 'all' || i.priority === filterCategory)
          .map((insight) => {
            const Icon = getInsightIcon(insight.type)
            return (
              <Card 
                key={insight.id} 
                className={`overflow-hidden ${
                  insight.priority === 'critical' ? 'border-l-4 border-l-red-500' :
                  insight.priority === 'high' ? 'border-l-4 border-l-orange-500' :
                  insight.priority === 'medium' ? 'border-l-4 border-l-yellow-500' :
                  'border-l-4 border-l-green-500'
                }`}
              >
                <CardContent className="p-0">
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        insight.priority === 'critical' ? 'bg-red-100' :
                        insight.priority === 'high' ? 'bg-orange-100' :
                        insight.priority === 'medium' ? 'bg-yellow-100' :
                        'bg-green-100'
                      }`}>
                        <Icon className={`h-6 w-6 ${
                          insight.priority === 'critical' ? 'text-red-600' :
                          insight.priority === 'high' ? 'text-orange-600' :
                          insight.priority === 'medium' ? 'text-yellow-600' :
                          'text-green-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-[#1A1A1A]">{insight.title}</h3>
                            <Badge className={getPriorityColor(insight.priority)}>{insight.priority}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock4 className="h-3 w-3" />
                            {new Date(insight.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{insight.description}</p>
                        
                        <div className="mt-4 p-3 bg-[#00897B]/5 rounded-lg">
                          <div className="flex items-start gap-2">
                            <Target className="h-4 w-4 text-[#00897B] mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-[#00897B]">Recommendation</p>
                              <p className="text-sm text-gray-600 mt-1">{insight.recommendation}</p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Badge variant="outline" className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                              {insight.confidence}% confidence
                            </Badge>
                            <Badge variant="outline">{insight.category}</Badge>
                            <span className="text-sm text-gray-500">{insight.impact}</span>
                          </div>
                          {insight.actionRequired && (
                            <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C]">
                              {insight.actionLabel || 'Take Action'}
                              <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
      </div>
    </div>
  )

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b px-6">
          <TabsList className="h-12">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-[#00897B]/10">
              <Brain className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="forecast" className="data-[state=active]:bg-[#00897B]/10">
              <TrendingUp className="h-4 w-4 mr-2" />
              Demand Forecast
            </TabsTrigger>
            <TabsTrigger value="reorder" className="data-[state=active]:bg-[#00897B]/10">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Reorder Suggestions
            </TabsTrigger>
            <TabsTrigger value="deadstock" className="data-[state=active]:bg-[#00897B]/10">
              <Trash2 className="h-4 w-4 mr-2" />
              Dead Stock
            </TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:bg-[#00897B]/10">
              <Lightbulb className="h-4 w-4 mr-2" />
              Insights Feed
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 text-[#00897B] animate-spin mx-auto" />
                <p className="text-gray-500 mt-2">Analyzing inventory data...</p>
              </div>
            </div>
          ) : (
            <>
              <TabsContent value="dashboard" className="mt-0">{renderDashboard()}</TabsContent>
              <TabsContent value="forecast" className="mt-0">{renderForecastTab()}</TabsContent>
              <TabsContent value="reorder" className="mt-0">{renderReorderTab()}</TabsContent>
              <TabsContent value="deadstock" className="mt-0">{renderDeadStockTab()}</TabsContent>
              <TabsContent value="insights" className="mt-0">{renderInsightsTab()}</TabsContent>
            </>
          )}
        </div>
      </Tabs>

      {/* Forecast Detail Dialog */}
      <Dialog open={!!selectedForecast} onOpenChange={() => setSelectedForecast(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Demand Forecast Details</DialogTitle>
            <DialogDescription>
              AI-generated demand prediction for {selectedForecast?.productName}
            </DialogDescription>
          </DialogHeader>
          {selectedForecast && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Predicted Demand (7 days)</p>
                  <p className="text-2xl font-bold text-[#00897B]">{selectedForecast.predictedDemand} units</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">AI Confidence</p>
                  <p className="text-2xl font-bold text-green-600">{selectedForecast.confidence}%</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Current Stock</p>
                  <p className="font-medium">{selectedForecast.currentStock} units</p>
                </div>
                <div>
                  <p className="text-gray-500">Days of Stock</p>
                  <p className={`font-medium ${
                    selectedForecast.daysOfStock <= 7 ? 'text-red-600' :
                    selectedForecast.daysOfStock <= 14 ? 'text-orange-600' : ''
                  }`}>{selectedForecast.daysOfStock} days</p>
                </div>
                <div>
                  <p className="text-gray-500">Recommended Order</p>
                  <p className="font-medium text-blue-600">{selectedForecast.recommendedOrder} units</p>
                </div>
              </div>
              <div className="p-4 bg-[#00897B]/5 rounded-lg">
                <p className="text-sm text-[#00897B]">Historical Accuracy: {selectedForecast.accuracy}%</p>
                <p className="text-sm text-gray-500 mt-1">Seasonal Factor: {selectedForecast.seasonalFactor.toFixed(2)}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedForecast(null)}>Close</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]">
              Create Reorder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reorder Detail Dialog */}
      <Dialog open={!!selectedReorder} onOpenChange={() => setSelectedReorder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reorder Suggestion Details</DialogTitle>
            <DialogDescription>
              AI-optimized reorder recommendation
            </DialogDescription>
          </DialogHeader>
          {selectedReorder && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{selectedReorder.productName}</h3>
                <Badge className={getUrgencyColor(selectedReorder.urgency)}>{selectedReorder.urgency}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Suggested Quantity</p>
                  <p className="text-2xl font-bold text-[#00897B]">{selectedReorder.suggestedQty} units</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Economic Order Quantity (EOQ)</p>
                  <p className="text-2xl font-bold text-blue-600">{selectedReorder.eoq} units</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Supplier</p>
                  <p className="font-medium text-[#00897B]">{selectedReorder.supplierName}</p>
                </div>
                <div>
                  <p className="text-gray-500">Lead Time</p>
                  <p className="font-medium">{selectedReorder.leadTime} days</p>
                </div>
                <div>
                  <p className="text-gray-500">Unit Cost</p>
                  <p className="font-medium">R{selectedReorder.unitCost.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Total Cost</p>
                  <p className="font-medium text-[#00897B]">R{selectedReorder.totalCost.toLocaleString()}</p>
                </div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">
                  <span className="font-medium">Savings vs Retail:</span> R{selectedReorder.savingsVsRetail.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mt-1">{selectedReorder.reason}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReorder(null)}>Close</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]">
              <Send className="h-4 w-4 mr-2" />
              Send RFQ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* RFQ Dialog */}
      <Dialog open={rfqDialogOpen} onOpenChange={setRfqDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Request for Quotation (RFQ)</DialogTitle>
            <DialogDescription>
              Create RFQ for suggested reorder items
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              This will generate RFQ documents for {reorderSuggestions.filter(r => r.urgency === 'critical' || r.urgency === 'high').length} items 
              across {new Set(reorderSuggestions.map(r => r.supplierId)).size} suppliers.
            </p>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-medium">Total Estimated Value</p>
              <p className="text-2xl font-bold text-[#00897B]">
                R{reorderSuggestions.reduce((sum, r) => sum + r.totalCost, 0).toLocaleString()}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRfqDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]">
              <FileText className="h-4 w-4 mr-2" />
              Generate RFQ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
