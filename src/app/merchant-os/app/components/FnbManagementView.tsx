'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ChefHat,
  Trash2,
  FileText,
  Package,
  ShoppingCart,
  Clock,
  DollarSign,
  BarChart3,
  Activity,
  RefreshCw,
  Plus,
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar,
  Filter,
  Download,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Target,
  LineChart,
  PieChart,
} from 'lucide-react'
import { toast } from 'sonner'

// Types
interface WastageRecord {
  id: string
  ingredientId: string
  ingredient: { name: string; sku: string; unit: string }
  quantity: number
  unit: string
  cost: number
  reason: string
  notes?: string
  station?: string
  createdAt: string
}

interface Anomaly {
  id: string
  type: string
  severity: 'critical' | 'warning' | 'info'
  entityType: string
  entityName: string
  description: string
  metrics: { expected: number; actual: number; deviationPercent: number }
  recommendation: string
  status: string
}

interface ForecastData {
  date: string
  predictedSales: number
  predictedOrders: number
  confidence: number
  lowerBound: number
  upperBound: number
  factors: string[]
}

interface PredictiveItem {
  ingredientId: string
  ingredientName: string
  currentStock: number
  unit: string
  avgDailyUsage: number
  daysOfStock: number
  suggestedOrderQty: number
  urgency: 'critical' | 'high' | 'medium' | 'low'
  predictedStockout: string
}

interface AuditLog {
  id: string
  action: string
  entityType: string
  entityId: string
  details: any
  createdAt: string
  performedBy?: { name: string }
}

const formatCurrency = (amount: number) => `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const severityColors = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  warning: 'bg-amber-100 text-amber-700 border-amber-200',
  info: 'bg-blue-100 text-blue-700 border-blue-200',
}

const urgencyColors = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-500',
  low: 'bg-green-500',
}

export function FnbManagementView() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  
  // Wastage state
  const [wastageRecords, setWastageRecords] = useState<WastageRecord[]>([])
  const [wastageSummary, setWastageSummary] = useState<any>(null)
  const [wastageDialogOpen, setWastageDialogOpen] = useState(false)
  const [newWastage, setNewWastage] = useState<any>({})
  
  // Anomaly state
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [anomalySummary, setAnomalySummary] = useState<any>(null)
  
  // Forecast state
  const [forecast, setForecast] = useState<ForecastData[]>([])
  const [forecastSummary, setForecastSummary] = useState<any>(null)
  
  // Predictive ordering state
  const [predictiveItems, setPredictiveItems] = useState<PredictiveItem[]>([])
  const [predictiveSummary, setPredictiveSummary] = useState<any>(null)
  
  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [auditSummary, setAuditSummary] = useState<any>(null)
  
  // Ingredients for dropdown
  const [ingredients, setIngredients] = useState<any[]>([])

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchWastage(),
        fetchAnomalies(),
        fetchForecast(),
        fetchPredictiveOrders(),
        fetchAuditLogs(),
        fetchIngredients(),
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load F&B data')
    } finally {
      setLoading(false)
    }
  }

  const fetchWastage = async () => {
    try {
      const res = await fetch('/api/merchant-os/fnb/wastage?period=month')
      const data = await res.json()
      if (data.records) {
        setWastageRecords(data.records)
        setWastageSummary(data.summary)
      }
    } catch (error) {
      console.error('Error fetching wastage:', error)
    }
  }

  const fetchAnomalies = async () => {
    try {
      const res = await fetch('/api/merchant-os/fnb/anomaly-detection?days=7')
      const data = await res.json()
      if (data.anomalies) {
        setAnomalies(data.anomalies)
        setAnomalySummary(data.summary)
      }
    } catch (error) {
      console.error('Error fetching anomalies:', error)
    }
  }

  const fetchForecast = async () => {
    try {
      const res = await fetch('/api/merchant-os/fnb/forecasting?days=14')
      const data = await res.json()
      if (data.forecast) {
        setForecast(data.forecast)
        setForecastSummary(data.summary)
      }
    } catch (error) {
      console.error('Error fetching forecast:', error)
    }
  }

  const fetchPredictiveOrders = async () => {
    try {
      const res = await fetch('/api/merchant-os/fnb/predictive-ordering?days=30')
      const data = await res.json()
      if (data.velocityData) {
        setPredictiveItems(data.velocityData.filter((v: PredictiveItem) => v.urgency !== 'low'))
        setPredictiveSummary(data.summary)
      }
    } catch (error) {
      console.error('Error fetching predictive orders:', error)
    }
  }

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/merchant-os/fnb/audit-logs?period=week')
      const data = await res.json()
      if (data.logs) {
        setAuditLogs(data.logs)
        setAuditSummary(data.summary)
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    }
  }

  const fetchIngredients = async () => {
    try {
      const res = await fetch('/api/merchant-os/fnb/ingredients')
      const data = await res.json()
      setIngredients(data)
    } catch (error) {
      console.error('Error fetching ingredients:', error)
    }
  }

  const handleCreateWastage = async () => {
    if (!newWastage.ingredientId || !newWastage.quantity || !newWastage.reason) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const res = await fetch('/api/merchant-os/fnb/wastage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWastage),
      })

      if (!res.ok) throw new Error('Failed to record wastage')

      toast.success('Wastage recorded successfully')
      setWastageDialogOpen(false)
      setNewWastage({})
      fetchWastage()
    } catch (error) {
      toast.error('Failed to record wastage')
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#00897B]" />
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A] flex items-center gap-2">
              <ChefHat className="h-6 w-6 text-[#00897B]" />
              F&B Management
            </h1>
            <p className="text-sm text-[#757575]">Wastage, audits, predictive ordering & forecasting</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchAllData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-red-50 to-white border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span className="text-xs text-red-600 font-medium">Critical Issues</span>
              </div>
              <p className="text-2xl font-bold text-red-700">{anomalySummary?.criticalCount || 0}</p>
              <p className="text-xs text-red-500">Require attention</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trash2 className="h-5 w-5 text-amber-500" />
                <span className="text-xs text-amber-600 font-medium">Wastage (Month)</span>
              </div>
              <p className="text-2xl font-bold text-amber-700">{formatCurrency(wastageSummary?.totalCost || 0)}</p>
              <p className="text-xs text-amber-500">{wastageSummary?.totalRecords || 0} incidents</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart className="h-5 w-5 text-blue-500" />
                <span className="text-xs text-blue-600 font-medium">To Order</span>
              </div>
              <p className="text-2xl font-bold text-blue-700">{predictiveSummary?.criticalCount || 0}</p>
              <p className="text-xs text-blue-500">Critical items</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-white border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span className="text-xs text-green-600 font-medium">Forecast Sales</span>
              </div>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(forecastSummary?.totalPredictedSales || 0)}</p>
              <p className="text-xs text-green-500">Next 14 days</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-5 w-5 text-purple-500" />
                <span className="text-xs text-purple-600 font-medium">Confidence</span>
              </div>
              <p className="text-2xl font-bold text-purple-700">{forecastSummary?.avgConfidence || 0}%</p>
              <p className="text-xs text-purple-500">Forecast accuracy</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-50 to-white border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-gray-500" />
                <span className="text-xs text-gray-600 font-medium">Audit Events</span>
              </div>
              <p className="text-2xl font-bold text-gray-700">{auditSummary?.totalLogs || 0}</p>
              <p className="text-xs text-gray-500">This week</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="wastage">Wastage</TabsTrigger>
            <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
            <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Critical Anomalies */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    Critical Anomalies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {anomalies.filter(a => a.severity === 'critical').slice(0, 5).map(anomaly => (
                      <div key={anomaly.id} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-800">{anomaly.entityName}</p>
                          <p className="text-xs text-red-600">{anomaly.description}</p>
                          <p className="text-xs text-red-500 mt-1">{anomaly.recommendation}</p>
                        </div>
                        <Badge className="bg-red-100 text-red-700">Critical</Badge>
                      </div>
                    ))}
                    {anomalies.filter(a => a.severity === 'critical').length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <p>No critical anomalies detected</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Predictive Ordering Alerts */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-blue-500" />
                    Items to Order
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {predictiveItems.filter(p => p.urgency === 'critical' || p.urgency === 'high').slice(0, 6).map(item => (
                      <div key={item.ingredientId} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${urgencyColors[item.urgency]}`} />
                          <div>
                            <p className="text-sm font-medium">{item.ingredientName}</p>
                            <p className="text-xs text-gray-500">{item.daysOfStock} days of stock left</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-blue-600">Order {item.suggestedOrderQty} {item.unit}</p>
                        </div>
                      </div>
                    ))}
                    {predictiveItems.filter(p => p.urgency === 'critical' || p.urgency === 'high').length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <p>Stock levels healthy</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sales Forecast Mini Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <LineChart className="h-4 w-4 text-green-500" />
                  14-Day Sales Forecast
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-32 flex items-end gap-1">
                  {forecast.slice(0, 14).map((day, i) => {
                    const maxSales = Math.max(...forecast.map(f => f.predictedSales))
                    const height = maxSales > 0 ? (day.predictedSales / maxSales) * 100 : 0
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                        <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 z-10">
                          {formatCurrency(day.predictedSales)}
                        </div>
                        <div 
                          className="w-full bg-gradient-to-t from-[#00897B] to-[#4CAF50] rounded-t-sm min-h-[4px] transition-all cursor-pointer hover:from-[#00695C] hover:to-[#388E3C]"
                          style={{ height: `${height}%` }}
                        />
                        <span className="text-[9px] text-gray-400">
                          {new Date(day.date).toLocaleDateString('en-ZA', { weekday: 'short' }).charAt(0)}
                        </span>
                      </div>
                    )
                  })}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>Total: {formatCurrency(forecastSummary?.totalPredictedSales || 0)}</span>
                  <span>Avg: {formatCurrency(forecastSummary?.avgDailySales || 0)}/day</span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Audit Activity */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-500" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {auditLogs.slice(0, 10).map(log => (
                    <div key={log.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg text-sm">
                      <Activity className="h-4 w-4 text-gray-400" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-700">{log.action.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-gray-500">
                          {log.entityType}: {log.details?.ingredientName || log.entityId}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(log.createdAt).toLocaleString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Wastage Tab */}
          <TabsContent value="wastage" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Wastage Records</h3>
                <p className="text-sm text-gray-500">Track and analyze ingredient wastage</p>
              </div>
              <Button onClick={() => setWastageDialogOpen(true)} className="bg-[#00897B]">
                <Plus className="h-4 w-4 mr-2" />
                Record Wastage
              </Button>
            </div>

            {/* Wastage Summary */}
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(wastageSummary?.totalCost || 0)}</p>
                  <p className="text-xs text-gray-500">Total Cost</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-amber-600">{wastageSummary?.totalRecords || 0}</p>
                  <p className="text-xs text-gray-500">Total Records</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(wastageSummary?.averageCostPerRecord || 0)}
                  </p>
                  <p className="text-xs text-gray-500">Avg per Record</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {Object.keys(wastageSummary?.byReason || {}).length}
                  </p>
                  <p className="text-xs text-gray-500">Reason Types</p>
                </CardContent>
              </Card>
            </div>

            {/* Wastage Records List */}
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {wastageRecords.slice(0, 20).map(record => (
                    <div key={record.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                          <Trash2 className="h-5 w-5 text-red-500" />
                        </div>
                        <div>
                          <p className="font-medium">{record.ingredient?.name || 'Unknown'}</p>
                          <p className="text-sm text-gray-500">
                            {record.quantity} {record.unit} · {record.reason.replace(/_/g, ' ')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-red-600">{formatCurrency(record.cost)}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(record.createdAt).toLocaleDateString('en-ZA')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Anomalies Tab */}
          <TabsContent value="anomalies" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Anomaly Detection</h3>
                <p className="text-sm text-gray-500">Identify unusual patterns and issues</p>
              </div>
              <div className="flex gap-2">
                <Select defaultValue="all">
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Card className="border-red-200">
                <CardContent className="p-4 text-center">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
                  <p className="text-3xl font-bold text-red-600">{anomalySummary?.criticalCount || 0}</p>
                  <p className="text-sm text-red-500">Critical</p>
                </CardContent>
              </Card>
              <Card className="border-amber-200">
                <CardContent className="p-4 text-center">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                  <p className="text-3xl font-bold text-amber-600">{anomalySummary?.warningCount || 0}</p>
                  <p className="text-sm text-amber-500">Warnings</p>
                </CardContent>
              </Card>
              <Card className="border-blue-200">
                <CardContent className="p-4 text-center">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-3xl font-bold text-blue-600">{anomalySummary?.infoCount || 0}</p>
                  <p className="text-sm text-blue-500">Info</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {anomalies.map(anomaly => (
                    <div key={anomaly.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          anomaly.severity === 'critical' ? 'bg-red-100' :
                          anomaly.severity === 'warning' ? 'bg-amber-100' : 'bg-blue-100'
                        }`}>
                          {anomaly.severity === 'critical' ? (
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          ) : (
                            <AlertTriangle className={`h-5 w-5 ${
                              anomaly.severity === 'warning' ? 'text-amber-500' : 'text-blue-500'
                            }`} />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{anomaly.entityName}</p>
                            <Badge className={severityColors[anomaly.severity]}>
                              {anomaly.severity}
                            </Badge>
                            <Badge variant="outline">{anomaly.type.replace(/_/g, ' ')}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{anomaly.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Expected: {anomaly.metrics.expected.toFixed(2)}</span>
                            <span>Actual: {anomaly.metrics.actual.toFixed(2)}</span>
                            <span className={anomaly.metrics.deviationPercent > 0 ? 'text-red-500' : 'text-green-500'}>
                              {anomaly.metrics.deviationPercent > 0 ? '+' : ''}{anomaly.metrics.deviationPercent.toFixed(1)}%
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-2">
                            💡 {anomaly.recommendation}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Forecasting Tab */}
          <TabsContent value="forecasting" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Sales Forecasting</h3>
                <p className="text-sm text-gray-500">AI-powered predictions for the next 14 days</p>
              </div>
            </div>

            {/* Forecast Summary */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="col-span-2">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-500 mb-1">Total Predicted Sales</p>
                  <p className="text-3xl font-bold text-[#00897B]">
                    {formatCurrency(forecastSummary?.totalPredictedSales || 0)}
                  </p>
                  <p className="text-xs text-gray-400">Next 14 days</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-500 mb-1">Avg Daily Sales</p>
                  <p className="text-2xl font-bold text-gray-700">
                    {formatCurrency(forecastSummary?.avgDailySales || 0)}
                  </p>
                  <p className="text-xs text-gray-400">Based on 30-day history</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-500 mb-1">Confidence Level</p>
                  <p className="text-2xl font-bold text-purple-600">{forecastSummary?.avgConfidence || 0}%</p>
                  <Progress value={forecastSummary?.avgConfidence || 0} className="h-2 mt-2" />
                </CardContent>
              </Card>
            </div>

            {/* Daily Forecast Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Daily Forecast Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {forecast.map((day, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="w-20">
                        <p className="text-sm font-medium">
                          {new Date(day.date).toLocaleDateString('en-ZA', { weekday: 'short' })}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(day.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold">{formatCurrency(day.predictedSales)}</span>
                          <span className="text-xs text-gray-500">{day.predictedOrders} orders</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#00897B] to-[#4CAF50]"
                            style={{ 
                              width: `${(day.predictedSales / Math.max(...forecast.map(f => f.predictedSales))) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{day.confidence}% confidence</p>
                        <p className="text-[10px] text-gray-400">
                          Range: {formatCurrency(day.lowerBound)} - {formatCurrency(day.upperBound)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Log Tab */}
          <TabsContent value="audit" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Audit Log</h3>
                <p className="text-sm text-gray-500">Complete activity history</p>
              </div>
              <div className="flex gap-2">
                <Select defaultValue="week">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="divide-y max-h-[600px] overflow-y-auto">
                  {auditLogs.map(log => (
                    <div key={log.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <Activity className="h-4 w-4 text-gray-500" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-700">{log.action.replace(/_/g, ' ')}</p>
                            <Badge variant="outline" className="text-xs">{log.entityType}</Badge>
                          </div>
                          <p className="text-sm text-gray-500">
                            {log.details?.ingredientName || log.details?.recipeName || log.entityId}
                          </p>
                          {log.details && (
                            <pre className="text-xs text-gray-400 mt-1 bg-gray-50 p-2 rounded overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">
                            {new Date(log.createdAt).toLocaleDateString('en-ZA')}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(log.createdAt).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {log.performedBy && (
                            <p className="text-xs text-gray-500 mt-1">{log.performedBy.name}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Wastage Dialog */}
        <Dialog open={wastageDialogOpen} onOpenChange={setWastageDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Wastage</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Ingredient</Label>
                <Select onValueChange={(v) => setNewWastage({ ...newWastage, ingredientId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ingredient" />
                  </SelectTrigger>
                  <SelectContent>
                    {ingredients.map(ing => (
                      <SelectItem key={ing.id} value={ing.id}>
                        {ing.name} ({ing.currentStock} {ing.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Quantity</Label>
                  <Input 
                    type="number" 
                    value={newWastage.quantity || ''} 
                    onChange={(e) => setNewWastage({ ...newWastage, quantity: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Reason</Label>
                  <Select onValueChange={(v) => setNewWastage({ ...newWastage, reason: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="spoiled">Spoiled</SelectItem>
                      <SelectItem value="overcooked">Overcooked</SelectItem>
                      <SelectItem value="dropped">Dropped</SelectItem>
                      <SelectItem value="quality_rejection">Quality Rejection</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Notes (optional)</Label>
                <Textarea 
                  value={newWastage.notes || ''} 
                  onChange={(e) => setNewWastage({ ...newWastage, notes: e.target.value })}
                  placeholder="Add any additional details..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setWastageDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateWastage} className="bg-[#00897B]">Record Wastage</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ScrollArea>
  )
}
