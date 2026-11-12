'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import {
  Utensils,
  TrendingUp,
  TrendingDown,
  Package,
  Plus,
  Calendar,
  Loader2,
  RefreshCw,
  DollarSign,
  BarChart3,
  AlertTriangle,
  Target,
  Truck,
} from 'lucide-react'

// ============================================
// TYPES
// ============================================

interface FeedRecord {
  id: string
  animalId?: string
  animalTag?: string
  batchId?: string
  feedType: string
  feedName?: string
  quantity: number
  unit: string
  costPerUnit?: number
  totalCost?: number
  proteinContent?: number
  energyContent?: number
  fedAt: string
  notes?: string
  campId?: string
  campName?: string
}

interface FeedInventory {
  id: string
  feedType: string
  feedName: string
  currentStock: number
  unit: string
  minStock: number
  avgConsumption: number
  daysRemaining: number
  lastRestocked: string
  unitCost: number
  totalValue: number
}

interface FeedStats {
  totalFedToday: number
  totalFedThisMonth: number
  totalCostThisMonth: number
  avgConsumptionPerAnimal: number
  feedConversionRatio: number | null
  lowStockItems: number
}

interface ConsumptionTrend {
  date: string
  quantity: number
  cost: number
}

interface FeedConsumptionPanelProps {
  farmId: string
}

const chartConfig: ChartConfig = {
  quantity: { label: 'Quantity', color: '#8B4513' },
  cost: { label: 'Cost', color: '#22c55e' },
  target: { label: 'Target', color: '#f59e0b' },
}

const feedTypeColors: Record<string, string> = {
  HAY: '#D2B48C',
  SILAGE: '#90EE90',
  GRAIN: '#FFD700',
  PELLETS: '#DDA0DD',
  MINERAL: '#87CEEB',
  MIX: '#F4A460',
}

// ============================================
// MAIN COMPONENT
// ============================================

export function FeedConsumptionPanel({ farmId }: FeedConsumptionPanelProps) {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [feedRecords, setFeedRecords] = useState<FeedRecord[]>([])
  const [inventory, setInventory] = useState<FeedInventory[]>([])
  const [stats, setStats] = useState<FeedStats | null>(null)
  const [trends, setTrends] = useState<ConsumptionTrend[]>([])
  const [addFeedDialogOpen, setAddFeedDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [feedForm, setFeedForm] = useState({
    animalTag: '',
    feedType: 'GRAIN',
    feedName: '',
    quantity: '',
    unit: 'kg',
    costPerUnit: '',
    proteinContent: '',
    energyContent: '',
    campId: '',
    notes: '',
  })

  // Fetch data
  const fetchData = async () => {
    try {
      const sessionStr = localStorage.getItem('groway_session')
      const session = sessionStr ? JSON.parse(sessionStr) : null
      const merchantId = session?.merchantId || 'test-merchant'

      const response = await fetch(
        `/api/merchant-os/agriculture/livestock/feed?merchantId=${merchantId}&farmId=${farmId}`
      )

      if (response.ok) {
        const data = await response.json()
        setFeedRecords(data.records || [])
        setInventory(data.inventory || [])
        setStats(data.stats || null)
        setTrends(data.trends || [])
      }
    } catch (error) {
      console.error('Failed to fetch feed data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [farmId])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const handleAddFeed = async () => {
    setSubmitting(true)
    try {
      const sessionStr = localStorage.getItem('groway_session')
      const session = sessionStr ? JSON.parse(sessionStr) : null
      const merchantId = session?.merchantId || 'test-merchant'

      const response = await fetch(`/api/merchant-os/agriculture/livestock/feed?merchantId=${merchantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmId,
          ...feedForm,
          quantity: parseFloat(feedForm.quantity),
          costPerUnit: feedForm.costPerUnit ? parseFloat(feedForm.costPerUnit) : null,
          proteinContent: feedForm.proteinContent ? parseFloat(feedForm.proteinContent) : null,
          energyContent: feedForm.energyContent ? parseFloat(feedForm.energyContent) : null,
        }),
      })

      if (response.ok) {
        setAddFeedDialogOpen(false)
        setFeedForm({
          animalTag: '',
          feedType: 'GRAIN',
          feedName: '',
          quantity: '',
          unit: 'kg',
          costPerUnit: '',
          proteinContent: '',
          energyContent: '',
          campId: '',
          notes: '',
        })
        fetchData()
      }
    } catch (error) {
      console.error('Failed to add feed record:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Chart data for trends
  const trendChartData = trends.map(t => ({
    date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    quantity: t.quantity,
    cost: t.cost,
  }))

  // Feed type distribution for pie chart
  const feedTypeData = Object.entries(
    feedRecords.reduce((acc, record) => {
      acc[record.feedType] = (acc[record.feedType] || 0) + record.quantity
      return acc
    }, {} as Record<string, number>)
  ).map(([type, quantity]) => ({
    name: type,
    value: quantity,
    color: feedTypeColors[type] || '#888888',
  }))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Utensils className="w-5 h-5" />
            Feed Consumption Tracking
          </h2>
          <p className="text-sm text-gray-500">Monitor feed usage and inventory</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" className="bg-amber-600 hover:bg-amber-700" onClick={() => setAddFeedDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Record Feeding
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">Fed Today</p>
              <p className="text-2xl font-bold">{stats.totalFedToday.toFixed(1)} kg</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">This Month</p>
              <p className="text-2xl font-bold">{stats.totalFedThisMonth.toFixed(0)} kg</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">Monthly Cost</p>
              <p className="text-2xl font-bold text-green-600">R{stats.totalCostThisMonth.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">Per Animal/Day</p>
              <p className="text-2xl font-bold">{stats.avgConsumptionPerAnimal.toFixed(2)} kg</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">FCR</p>
              <p className="text-2xl font-bold">
                {stats.feedConversionRatio?.toFixed(2) || 'N/A'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                {stats.lowStockItems > 0 && <AlertTriangle className="w-3 h-3 text-red-500" />}
                Low Stock Items
              </p>
              <p className={`text-2xl font-bold ${stats.lowStockItems > 0 ? 'text-red-600' : ''}`}>
                {stats.lowStockItems}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="consumption" className="space-y-4">
        <TabsList>
          <TabsTrigger value="consumption">Consumption</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Consumption Tab */}
        <TabsContent value="consumption">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Feedings */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Recent Feedings</CardTitle>
                <CardDescription>Latest feed distribution records</CardDescription>
              </CardHeader>
              <CardContent>
                {feedRecords.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Utensils className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No feed records yet</p>
                    <p className="text-sm">Record feedings to track consumption</p>
                  </div>
                ) : (
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {feedRecords.map((record) => (
                        <div key={record.id} className="flex items-center gap-4 p-3 rounded-lg border hover:bg-gray-50">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: feedTypeColors[record.feedType] + '40' || '#f0f0f0' }}
                          >
                            <Utensils className="w-5 h-5" style={{ color: feedTypeColors[record.feedType] || '#666' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{record.feedName || record.feedType}</p>
                              <Badge variant="outline">{record.feedType}</Badge>
                            </div>
                            <p className="text-sm text-gray-500">
                              {record.quantity} {record.unit}
                              {record.animalTag && ` → ${record.animalTag}`}
                              {record.campName && ` (${record.campName})`}
                            </p>
                          </div>
                          <div className="text-right">
                            {record.totalCost && (
                              <p className="text-sm font-medium text-green-600">R{record.totalCost.toFixed(2)}</p>
                            )}
                            <p className="text-xs text-gray-400">
                              {new Date(record.fedAt).toLocaleDateString()}
                            </p>
                          </div>
                          {record.proteinContent && (
                            <Badge variant="outline" className="text-xs">
                              {record.proteinContent}% Protein
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Feed Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Feed Type Distribution</CardTitle>
                <CardDescription>By quantity consumed</CardDescription>
              </CardHeader>
              <CardContent>
                {feedTypeData.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No data available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={feedTypeData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {feedTypeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2">
                      {feedTypeData.map((item) => (
                        <div key={item.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-sm">{item.name}</span>
                          </div>
                          <span className="text-sm font-medium">{item.value.toFixed(1)} kg</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Feed Inventory</CardTitle>
                  <CardDescription>Current stock levels and reorder alerts</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Truck className="w-4 h-4 mr-2" />
                  Record Delivery
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {inventory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No inventory items</p>
                  <p className="text-sm">Add feed inventory to track stock levels</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {inventory.map((item) => {
                    const stockPercentage = (item.currentStock / (item.minStock * 3)) * 100
                    const isLow = item.currentStock <= item.minStock

                    return (
                      <div key={item.id} className={`p-4 rounded-lg border ${isLow ? 'bg-red-50 border-red-200' : ''}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: feedTypeColors[item.feedType] + '40' || '#f0f0f0' }}
                            >
                              <Package className="w-5 h-5" style={{ color: feedTypeColors[item.feedType] || '#666' }} />
                            </div>
                            <div>
                              <p className="font-medium">{item.feedName}</p>
                              <p className="text-sm text-gray-500">{item.feedType}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">{item.currentStock} {item.unit}</p>
                            <p className="text-xs text-gray-400">
                              Value: R{item.totalValue.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Min Stock</p>
                            <p className="font-medium">{item.minStock} {item.unit}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Daily Use</p>
                            <p className="font-medium">{item.avgConsumption.toFixed(1)} {item.unit}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Days Left</p>
                            <p className={`font-medium ${item.daysRemaining <= 7 ? 'text-red-600' : ''}`}>
                              {item.daysRemaining} days
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Unit Cost</p>
                            <p className="font-medium">R{item.unitCost.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <Progress
                            value={Math.min(stockPercentage, 100)}
                            className={`h-2 ${isLow ? '[&>div]:bg-red-500' : ''}`}
                          />
                        </div>
                        {isLow && (
                          <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Low stock - consider reordering</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Consumption Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Daily Consumption Trend</CardTitle>
                <CardDescription>Feed usage over the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="quantity"
                        stroke="#8B4513"
                        fill="#D2691E"
                        fillOpacity={0.3}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="cost"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-700" />
                    <span>Quantity (kg)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span>Cost (R)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cost Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cost by Feed Type</CardTitle>
                <CardDescription>Monthly expenditure breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { type: 'Hay', cost: 2500, quantity: 5000 },
                        { type: 'Grain', cost: 4200, quantity: 2800 },
                        { type: 'Pellets', cost: 1800, quantity: 1200 },
                        { type: 'Silage', cost: 1500, quantity: 3500 },
                        { type: 'Mineral', cost: 800, quantity: 200 },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="cost" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* FCR by Species */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Feed Conversion Ratio</CardTitle>
                <CardDescription>Efficiency by species</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { species: 'Cattle', fcr: 6.5, target: 6.0 },
                        { species: 'Sheep', fcr: 5.0, target: 4.5 },
                        { species: 'Goats', fcr: 5.5, target: 5.0 },
                        { species: 'Pigs', fcr: 2.8, target: 2.5 },
                        { species: 'Poultry', fcr: 1.8, target: 1.7 },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="species" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="fcr" fill="#8B4513" radius={[4, 4, 0, 0]} name="Actual FCR" />
                      <Bar dataKey="target" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Target" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  FCR = kg feed / kg weight gain (lower is better)
                </p>
              </CardContent>
            </Card>

            {/* Summary Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Feed Budget Summary</CardTitle>
                <CardDescription>Monthly financial overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <span>Monthly Budget</span>
                    </div>
                    <span className="font-bold">R{stats?.totalCostThisMonth ? (stats.totalCostThisMonth * 1.2).toFixed(2) : '0.00'}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      <span>Actual Spend</span>
                    </div>
                    <span className="font-bold">R{stats?.totalCostThisMonth?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Target className="w-5 h-5 text-amber-600" />
                      <span>Variance</span>
                    </div>
                    <span className="font-bold text-green-600">
                      {stats?.totalCostThisMonth ? `-R${(stats.totalCostThisMonth * 0.2).toFixed(2)}` : 'R0.00'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-5 h-5 text-purple-600" />
                      <span>Cost per Animal</span>
                    </div>
                    <span className="font-bold">
                      R{stats?.avgConsumptionPerAnimal ? (stats.avgConsumptionPerAnimal * 3.5).toFixed(2) : '0.00'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Feed Dialog */}
      <Dialog open={addFeedDialogOpen} onOpenChange={setAddFeedDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Feeding</DialogTitle>
            <DialogDescription>Log a feed distribution event</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="feedType">Feed Type</Label>
                <Select
                  value={feedForm.feedType}
                  onValueChange={(value) => setFeedForm({ ...feedForm, feedType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HAY">Hay</SelectItem>
                    <SelectItem value="SILAGE">Silage</SelectItem>
                    <SelectItem value="GRAIN">Grain</SelectItem>
                    <SelectItem value="PELLETS">Pellets</SelectItem>
                    <SelectItem value="MINERAL">Mineral Mix</SelectItem>
                    <SelectItem value="MIX">Mixed Feed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="feedName">Feed Name</Label>
                <Input
                  id="feedName"
                  placeholder="e.g., Lucerne Hay"
                  value={feedForm.feedName}
                  onChange={(e) => setFeedForm({ ...feedForm, feedName: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 50"
                  value={feedForm.quantity}
                  onChange={(e) => setFeedForm({ ...feedForm, quantity: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select
                  value={feedForm.unit}
                  onValueChange={(value) => setFeedForm({ ...feedForm, unit: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">Kilograms (kg)</SelectItem>
                    <SelectItem value="tons">Tons</SelectItem>
                    <SelectItem value="bales">Bales</SelectItem>
                    <SelectItem value="bags">Bags</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="animalTag">Animal Tag (Optional)</Label>
              <Input
                id="animalTag"
                placeholder="Leave blank for batch/camp feeding"
                value={feedForm.animalTag}
                onChange={(e) => setFeedForm({ ...feedForm, animalTag: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="costPerUnit">Cost per Unit (R)</Label>
                <Input
                  id="costPerUnit"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 5.50"
                  value={feedForm.costPerUnit}
                  onChange={(e) => setFeedForm({ ...feedForm, costPerUnit: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proteinContent">Protein %</Label>
                <Input
                  id="proteinContent"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 16"
                  value={feedForm.proteinContent}
                  onChange={(e) => setFeedForm({ ...feedForm, proteinContent: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                placeholder="Any additional notes..."
                value={feedForm.notes}
                onChange={(e) => setFeedForm({ ...feedForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddFeedDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddFeed}
              disabled={submitting || !feedForm.quantity}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Recording...
                </>
              ) : (
                'Record Feeding'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
