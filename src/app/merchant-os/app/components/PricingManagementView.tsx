'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Search,
  Coins,
  TrendingUp,
  TrendingDown,
  Package,
  Calculator,
  Percent,
  Edit2,
  Save,
  X,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
  Upload,
  Filter,
  BarChart3,
  Tag,
  Clock,
  History,
  ChevronRight,
  Layers,
  Target,
  Zap,
  Info,
} from 'lucide-react'
import { useMerchantData } from '../hooks/useMerchantData'
import { EmptyState, NoDataEmptyState } from './EmptyState'

// Types
interface PricingItem {
  id: string
  name: string
  sku: string
  category: string
  costPrice: number
  sellingPrice: number
  margin: number
  marginPercent: number
  markup: number
  stock: number
  velocity: number
  lastPriceChange: string
  priceHistory: PriceHistoryEntry[]
  competitorPrice?: number
  suggestedPrice?: number
  demandLevel: 'high' | 'medium' | 'low'
}

interface PriceHistoryEntry {
  date: string
  oldPrice: number
  newPrice: number
  reason: string
  user: string
}

interface BulkPriceUpdate {
  ids: string[]
  field: 'sellingPrice' | 'costPrice'
  operation: 'set' | 'increase' | 'decrease' | 'margin'
  value: number
  reason: string
}

// Mock data generator removed - data now fetched from API

// Margin Calculator Component
function MarginCalculator() {
  const [cost, setCost] = useState<number>(0)
  const [sellPrice, setSellPrice] = useState<number>(0)
  const [marginPercent, setMarginPercent] = useState<number>(0)
  const [markupPercent, setMarkupPercent] = useState<number>(0)
  const [calcMode, setCalcMode] = useState<'cost-sell' | 'cost-margin' | 'sell-margin'>('cost-sell')

  const calculateFromCostSell = () => {
    if (cost > 0 && sellPrice > 0) {
      const margin = ((sellPrice - cost) / sellPrice) * 100
      const markup = ((sellPrice - cost) / cost) * 100
      setMarginPercent(Number(margin.toFixed(1)))
      setMarkupPercent(Number(markup.toFixed(1)))
    }
  }

  const calculateFromCostMargin = () => {
    if (cost > 0 && marginPercent > 0) {
      const sell = cost / (1 - marginPercent / 100)
      const markup = ((sell - cost) / cost) * 100
      setSellPrice(Number(sell.toFixed(2)))
      setMarkupPercent(Number(markup.toFixed(1)))
    }
  }

  const calculateFromSellMargin = () => {
    if (sellPrice > 0 && marginPercent > 0) {
      const c = sellPrice * (1 - marginPercent / 100)
      const markup = ((sellPrice - c) / c) * 100
      setCost(Number(c.toFixed(2)))
      setMarkupPercent(Number(markup.toFixed(1)))
    }
  }

  const handleCalculate = () => {
    switch (calcMode) {
      case 'cost-sell':
        calculateFromCostSell()
        break
      case 'cost-margin':
        calculateFromCostMargin()
        break
      case 'sell-margin':
        calculateFromSellMargin()
        break
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calculator className="h-4 w-4 text-[#00897B]" />
          Margin Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={calcMode === 'cost-sell' ? 'default' : 'outline'}
            className={calcMode === 'cost-sell' ? 'bg-[#00897B] hover:bg-[#00695C]' : ''}
            onClick={() => setCalcMode('cost-sell')}
          >
            Cost + Sell
          </Button>
          <Button
            size="sm"
            variant={calcMode === 'cost-margin' ? 'default' : 'outline'}
            className={calcMode === 'cost-margin' ? 'bg-[#00897B] hover:bg-[#00695C]' : ''}
            onClick={() => setCalcMode('cost-margin')}
          >
            Cost + Margin
          </Button>
          <Button
            size="sm"
            variant={calcMode === 'sell-margin' ? 'default' : 'outline'}
            className={calcMode === 'sell-margin' ? 'bg-[#00897B] hover:bg-[#00695C]' : ''}
            onClick={() => setCalcMode('sell-margin')}
          >
            Sell + Margin
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-[#757575]">Cost Price (R)</label>
            <Input
              type="number"
              value={cost || ''}
              onChange={(e) => setCost(Number(e.target.value))}
              placeholder="0.00"
              disabled={calcMode === 'sell-margin'}
            />
          </div>
          <div>
            <label className="text-xs text-[#757575]">Selling Price (R)</label>
            <Input
              type="number"
              value={sellPrice || ''}
              onChange={(e) => setSellPrice(Number(e.target.value))}
              placeholder="0.00"
              disabled={calcMode === 'cost-margin'}
            />
          </div>
          <div>
            <label className="text-xs text-[#757575]">Margin %</label>
            <Input
              type="number"
              value={marginPercent || ''}
              onChange={(e) => setMarginPercent(Number(e.target.value))}
              placeholder="0"
              disabled={calcMode === 'cost-sell'}
            />
          </div>
          <div>
            <label className="text-xs text-[#757575]">Markup %</label>
            <Input
              type="number"
              value={markupPercent || ''}
              disabled
              className="bg-gray-50"
            />
          </div>
        </div>

        <Button onClick={handleCalculate} className="w-full bg-[#00897B] hover:bg-[#00695C]">
          Calculate
        </Button>

        {cost > 0 && sellPrice > 0 && (
          <div className="p-3 bg-[#E0F2F1] rounded-lg">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-[#757575]">Profit per unit:</span>
                <span className="font-bold text-[#00897B] ml-2">R{(sellPrice - cost).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[#757575]">Margin:</span>
                <span className="font-bold text-[#00897B] ml-2">{marginPercent}%</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Main Component
export function PricingManagementView() {
  // Get merchant data from session
  const { merchantId, isLoading: isLoadingMerchant } = useMerchantData()
  
  const [pricingData, setPricingData] = useState<PricingItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [marginFilter, setMarginFilter] = useState<string>('all')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [editItem, setEditItem] = useState<PricingItem | null>(null)
  const [bulkUpdateOpen, setBulkUpdateOpen] = useState(false)
  const [bulkUpdate, setBulkUpdate] = useState<BulkPriceUpdate>({
    ids: [],
    field: 'sellingPrice',
    operation: 'increase',
    value: 0,
    reason: ''
  })
  const [toast, setToast] = useState<{ show: boolean; title: string; message: string; type: 'success' | 'error' } | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  // Computed
  const categories = ['all', ...new Set(pricingData.map(i => i.category))]
  
  const filteredItems = useMemo(() => pricingData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.sku.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
    let matchesMargin = true
    if (marginFilter === 'low') matchesMargin = item.marginPercent < 40
    else if (marginFilter === 'healthy') matchesMargin = item.marginPercent >= 40 && item.marginPercent < 60
    else if (marginFilter === 'high') matchesMargin = item.marginPercent >= 60
    return matchesSearch && matchesCategory && matchesMargin
  }), [pricingData, searchQuery, categoryFilter, marginFilter])

  // KPIs
  const avgMargin = pricingData.reduce((sum, i) => sum + i.marginPercent, 0) / pricingData.length
  const totalStockValue = pricingData.reduce((sum, i) => sum + (i.costPrice * i.stock), 0)
  const totalRetailValue = pricingData.reduce((sum, i) => sum + (i.sellingPrice * i.stock), 0)
  const lowMarginItems = pricingData.filter(i => i.marginPercent < 40).length
  const priceAlerts = pricingData.filter(i => i.suggestedPrice && i.suggestedPrice !== i.sellingPrice).length

  // Helpers
  const getMarginColor = (margin: number) => {
    if (margin < 30) return 'text-red-500'
    if (margin < 40) return 'text-orange-500'
    if (margin < 50) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getDemandBadge = (demand: string) => {
    switch (demand) {
      case 'high':
        return <Badge className="bg-green-100 text-green-700">High Demand</Badge>
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-700">Medium</Badge>
      case 'low':
        return <Badge className="bg-gray-100 text-gray-700">Low Demand</Badge>
      default:
        return null
    }
  }

  const showToast = (title: string, message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, title, message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Handlers
  const handleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(filteredItems.map(i => i.id))
    }
  }

  const handleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleUpdatePrice = (item: PricingItem, field: 'sellingPrice' | 'costPrice', value: number) => {
    const newData = pricingData.map(i => {
      if (i.id === item.id) {
        const newCost = field === 'costPrice' ? value : i.costPrice
        const newSell = field === 'sellingPrice' ? value : i.sellingPrice
        const newMargin = newSell - newCost
        const newMarginPercent = (newMargin / newSell) * 100
        const newMarkup = (newMargin / newCost) * 100
        
        return {
          ...i,
          costPrice: newCost,
          sellingPrice: newSell,
          margin: newMargin,
          marginPercent: newMarginPercent,
          markup: newMarkup,
          lastPriceChange: new Date().toISOString().split('T')[0],
          priceHistory: [
            { date: new Date().toISOString().split('T')[0], oldPrice: i[field], newPrice: value, reason: 'Manual update', user: 'Current User' },
            ...i.priceHistory
          ]
        }
      }
      return i
    })
    setPricingData(newData)
    setEditItem(null)
    showToast('Price Updated', `${item.name} price updated successfully`, 'success')
  }

  const handleBulkUpdate = () => {
    if (selectedItems.length === 0) {
      showToast('No Selection', 'Please select items to update', 'error')
      return
    }
    if (!bulkUpdate.reason.trim()) {
      showToast('Reason Required', 'Please provide a reason for the price change', 'error')
      return
    }

    const newData = pricingData.map(item => {
      if (selectedItems.includes(item.id)) {
        let newPrice = bulkUpdate.field === 'sellingPrice' ? item.sellingPrice : item.costPrice
        
        switch (bulkUpdate.operation) {
          case 'set':
            newPrice = bulkUpdate.value
            break
          case 'increase':
            newPrice = newPrice * (1 + bulkUpdate.value / 100)
            break
          case 'decrease':
            newPrice = newPrice * (1 - bulkUpdate.value / 100)
            break
          case 'margin':
            const cost = item.costPrice
            newPrice = cost / (1 - bulkUpdate.value / 100)
            break
        }

        const newCost = bulkUpdate.field === 'costPrice' ? newPrice : item.costPrice
        const newSell = bulkUpdate.field === 'sellingPrice' ? newPrice : item.sellingPrice
        const newMargin = newSell - newCost
        const newMarginPercent = (newMargin / newSell) * 100
        const newMarkup = (newMargin / newCost) * 100

        return {
          ...item,
          costPrice: newCost,
          sellingPrice: newSell,
          margin: newMargin,
          marginPercent: newMarginPercent,
          markup: newMarkup,
          lastPriceChange: new Date().toISOString().split('T')[0],
          priceHistory: [
            { 
              date: new Date().toISOString().split('T')[0], 
              oldPrice: bulkUpdate.field === 'sellingPrice' ? item.sellingPrice : item.costPrice, 
              newPrice, 
              reason: bulkUpdate.reason, 
              user: 'Current User' 
            },
            ...item.priceHistory
          ]
        }
      }
      return item
    })

    setPricingData(newData)
    setSelectedItems([])
    setBulkUpdateOpen(false)
    setBulkUpdate({ ids: [], field: 'sellingPrice', operation: 'increase', value: 0, reason: '' })
    showToast('Bulk Update Complete', `${selectedItems.length} items updated`, 'success')
  }

  const handleExport = () => {
    const csv = [
      'SKU,Name,Category,Cost Price,Selling Price,Margin %,Markup %,Stock',
      ...filteredItems.map(i => 
        `${i.sku},"${i.name}",${i.category},${i.costPrice},${i.sellingPrice},${i.marginPercent.toFixed(1)},${i.markup.toFixed(1)},${i.stock}`
      )
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pricing-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Export Complete', `${filteredItems.length} items exported to CSV`, 'success')
  }

  // Render Overview Tab
  const renderOverview = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-[#00897B]">
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Avg Margin</p>
            <p className={`text-xl font-bold ${getMarginColor(avgMargin)}`}>{avgMargin.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Stock Value (Cost)</p>
            <p className="text-xl font-bold">R{totalStockValue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Retail Value</p>
            <p className="text-xl font-bold text-[#00897B]">R{totalRetailValue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Low Margin Items</p>
            <p className="text-xl font-bold text-orange-500">{lowMarginItems}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Price Suggestions</p>
            <p className="text-xl font-bold text-blue-500">{priceAlerts}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 flex-wrap">
        <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setActiveTab('products')}>
          <Coins className="h-4 w-4 mr-2" />Manage Prices
        </Button>
        <Button variant="outline" onClick={() => { setBulkUpdateOpen(true); setSelectedItems(filteredItems.map(i => i.id)) }}>
          <Edit2 className="h-4 w-4 mr-2" />Bulk Update
        </Button>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />Export
        </Button>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Margin Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#00897B]" />
              Margin Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { range: '< 30%', count: pricingData.filter(i => i.marginPercent < 30).length, color: 'bg-red-500' },
                { range: '30-40%', count: pricingData.filter(i => i.marginPercent >= 30 && i.marginPercent < 40).length, color: 'bg-orange-500' },
                { range: '40-50%', count: pricingData.filter(i => i.marginPercent >= 40 && i.marginPercent < 50).length, color: 'bg-yellow-500' },
                { range: '50-60%', count: pricingData.filter(i => i.marginPercent >= 50 && i.marginPercent < 60).length, color: 'bg-green-400' },
                { range: '> 60%', count: pricingData.filter(i => i.marginPercent >= 60).length, color: 'bg-green-600' },
              ].map((bucket) => (
                <div key={bucket.range} className="flex items-center gap-3">
                  <span className="w-16 text-xs text-[#757575]">{bucket.range}</span>
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${bucket.color} rounded-full transition-all duration-500`}
                      style={{ width: `${(bucket.count / pricingData.length) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-sm font-medium text-right">{bucket.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Price Suggestions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Price Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pricingData
                .filter(i => i.suggestedPrice && i.suggestedPrice !== i.sellingPrice)
                .slice(0, 5)
                .map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-[#757575]">Current: R{item.sellingPrice.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#00897B]">R{item.suggestedPrice?.toFixed(2)}</p>
                      <p className="text-xs text-[#757575]">Suggested</p>
                    </div>
                    <Button 
                      size="sm" 
                      className="ml-2 bg-[#00897B] hover:bg-[#00695C]"
                      onClick={() => handleUpdatePrice(item, 'sellingPrice', item.suggestedPrice!)}
                    >
                      Apply
                    </Button>
                  </div>
                ))}
              {pricingData.filter(i => i.suggestedPrice && i.suggestedPrice !== i.sellingPrice).length === 0 && (
                <div className="text-center py-6 text-[#757575]">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-sm">All prices are optimized</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Margin Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MarginCalculator />
        
        {/* Quick Stats */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-[#00897B]" />
              Category Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(
                pricingData.reduce((acc, item) => {
                  if (!acc[item.category]) {
                    acc[item.category] = { count: 0, totalMargin: 0, totalStock: 0 }
                  }
                  acc[item.category].count++
                  acc[item.category].totalMargin += item.marginPercent
                  acc[item.category].totalStock += item.stock
                  return acc
                }, {} as Record<string, { count: number; totalMargin: number; totalStock: number }>)
              ).map(([category, data]) => (
                <div key={category} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-[#757575]">{category}</p>
                  <p className={`text-lg font-bold ${getMarginColor(data.totalMargin / data.count)}`}>
                    {(data.totalMargin / data.count).toFixed(1)}%
                  </p>
                  <p className="text-xs text-[#757575]">{data.count} items • {data.totalStock} units</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // Render Products Tab
  const renderProducts = () => (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
          <Input 
            placeholder="Search products..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            className="pl-9" 
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(c => (
              <SelectItem key={c} value={c}>{c === 'all' ? 'All Categories' : c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={marginFilter} onValueChange={setMarginFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Margin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Margins</SelectItem>
            <SelectItem value="low">Low (&lt;40%)</SelectItem>
            <SelectItem value="healthy">Healthy (40-60%)</SelectItem>
            <SelectItem value="high">High (&gt;60%)</SelectItem>
          </SelectContent>
        </Select>
        {selectedItems.length > 0 && (
          <Button 
            variant="outline" 
            className="border-[#00897B] text-[#00897B]"
            onClick={() => setBulkUpdateOpen(true)}
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Update {selectedItems.length} Selected
          </Button>
        )}
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />Export
        </Button>
      </div>

      {/* Products Table */}
      <Card>
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Selling Price</TableHead>
                <TableHead>Margin</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Demand</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map(item => (
                <TableRow 
                  key={item.id}
                  className={selectedItems.includes(item.id) ? 'bg-[#E0F2F1]' : ''}
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => handleSelectItem(item.id)}
                      className="rounded border-gray-300"
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-[#757575]">{item.sku} • {item.category}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {editItem?.id === item.id ? (
                      <Input
                        type="number"
                        defaultValue={item.costPrice}
                        className="w-24"
                        onBlur={(e) => handleUpdatePrice(item, 'costPrice', Number(e.target.value))}
                        autoFocus
                      />
                    ) : (
                      <span>R{item.costPrice.toFixed(2)}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editItem?.id === item.id ? (
                      <Input
                        type="number"
                        defaultValue={item.sellingPrice}
                        className="w-24"
                        onBlur={(e) => handleUpdatePrice(item, 'sellingPrice', Number(e.target.value))}
                      />
                    ) : (
                      <span className="font-medium">R{item.sellingPrice.toFixed(2)}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${getMarginColor(item.marginPercent)}`}>
                        {item.marginPercent.toFixed(1)}%
                      </span>
                      {item.marginPercent < 30 && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <p className="text-xs text-[#757575]">R{item.margin.toFixed(2)} profit</p>
                  </TableCell>
                  <TableCell>
                    <span className={item.stock === 0 ? 'text-red-500' : item.stock < 20 ? 'text-orange-500' : ''}>
                      {item.stock}
                    </span>
                  </TableCell>
                  <TableCell>{getDemandBadge(item.demandLevel)}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditItem(editItem?.id === item.id ? null : item)}
                    >
                      {editItem?.id === item.id ? (
                        <X className="h-4 w-4" />
                      ) : (
                        <Edit2 className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>
    </div>
  )

  // Render History Tab
  const renderHistory = () => {
    const allHistory = pricingData.flatMap(item => 
      item.priceHistory.map(h => ({ ...h, productName: item.name, sku: item.sku }))
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="h-4 w-4 text-[#00897B]" />
              Price Change History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              {allHistory.length === 0 ? (
                <div className="text-center py-12 text-[#757575]">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No price changes recorded yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allHistory.map((entry, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        entry.newPrice > entry.oldPrice ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {entry.newPrice > entry.oldPrice ? (
                          <ArrowUpRight className="h-5 w-5" />
                        ) : (
                          <ArrowDownRight className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{entry.productName}</p>
                        <p className="text-xs text-[#757575]">
                          R{entry.oldPrice.toFixed(2)} → R{entry.newPrice.toFixed(2)} • {entry.reason}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-[#757575]">{entry.date}</p>
                        <p className="text-xs text-[#757575]">by {entry.user}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
              <Coins className="h-5 w-5 text-[#00897B]" />
              Pricing Management
            </h2>
            <p className="text-xs text-[#757575]">Manage cost prices, selling prices, and margins</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-4 pt-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 p-4 overflow-auto">
          <TabsContent value="overview" className="mt-0">
            {renderOverview()}
          </TabsContent>
          <TabsContent value="products" className="mt-0">
            {renderProducts()}
          </TabsContent>
          <TabsContent value="history" className="mt-0">
            {renderHistory()}
          </TabsContent>
        </div>
      </Tabs>

      {/* Bulk Update Dialog */}
      <Dialog open={bulkUpdateOpen} onOpenChange={setBulkUpdateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Price Update</DialogTitle>
            <DialogDescription>
              Update prices for {selectedItems.length} selected items
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Update Field</label>
              <Select 
                value={bulkUpdate.field} 
                onValueChange={(v) => setBulkUpdate(prev => ({ ...prev, field: v as 'sellingPrice' | 'costPrice' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sellingPrice">Selling Price</SelectItem>
                  <SelectItem value="costPrice">Cost Price</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Operation</label>
              <Select 
                value={bulkUpdate.operation} 
                onValueChange={(v) => setBulkUpdate(prev => ({ ...prev, operation: v as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="set">Set to value</SelectItem>
                  <SelectItem value="increase">Increase by %</SelectItem>
                  <SelectItem value="decrease">Decrease by %</SelectItem>
                  <SelectItem value="margin">Set margin %</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">
                {bulkUpdate.operation === 'set' ? 'Value (R)' : 
                 bulkUpdate.operation === 'margin' ? 'Target Margin %' : 'Percentage %'}
              </label>
              <Input
                type="number"
                value={bulkUpdate.value || ''}
                onChange={(e) => setBulkUpdate(prev => ({ ...prev, value: Number(e.target.value) }))}
                placeholder={bulkUpdate.operation === 'set' ? '0.00' : '0'}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Reason *</label>
              <Input
                value={bulkUpdate.reason}
                onChange={(e) => setBulkUpdate(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="e.g., Supplier price increase, inflation adjustment"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkUpdateOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleBulkUpdate}>
              Update {selectedItems.length} Items
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toast */}
      {toast?.show && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
          toast.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <p className={`font-medium ${toast.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
            {toast.title}
          </p>
          <p className={`text-sm ${toast.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {toast.message}
          </p>
        </div>
      )}
    </div>
  )
}
