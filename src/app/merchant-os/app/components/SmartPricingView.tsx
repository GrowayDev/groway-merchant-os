'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  RefreshCw,
  Plus,
  Settings,
  Eye,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Activity,
  Search,
  ChevronRight,
  Store,
  ShoppingCart,
  Tag,
  Percent,
  Sparkles,
  Bot,
  Target,
  Lightbulb,
  AlertTriangle,
  Info,
  X,
  Package,
  Link2,
  Unlink,
  Edit2,
  Copy,
  Zap,
  Layers,
  Calculator,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet,
  Upload,
  Download,
  Scan,
  Check,
  Minus,
  GripVertical,
  MoreHorizontal,
  Save,
  XCircle,
} from 'lucide-react'
import { useMerchantData } from '../hooks/useMerchantData'
import { EmptyState, NoDataEmptyState } from './EmptyState'
import { useEffect, useCallback } from 'react'

// ============================================
// TYPES
// ============================================

interface PricingItem {
  id: string
  name: string
  sku: string
  barcode: string
  category: string
  currentPrice: number
  costPrice: number
  suggestedPrice: number | null
  margin: number
  marginPercent: number
  competitorPrice: number | null
  groSupplyPrice: number | null
  groSupplySupplier: string | null
  priceHistory: { date: string; price: number }[]
  linkedToGroSupply: boolean
  lastPriceUpdate: string
  velocity: 'fast' | 'medium' | 'slow' | 'dead'
  stockLevel: number
  reorderPoint: number
  autoPricing: boolean
  status: 'active' | 'inactive' | 'discontinued'
}

interface PriceRule {
  id: string
  name: string
  type: 'margin' | 'markup' | 'fixed' | 'competitor'
  value: number
  categoryId: string | null
  active: boolean
}

interface GroSupplyProduct {
  id: string
  name: string
  sku: string
  supplier: string
  unitPrice: number
  bulkPrice: number | null
  minBulkQty: number | null
  moq: number
  leadTime: string
  category: string
  inStock: boolean
}

interface ImportItem {
  groSupplyProduct: GroSupplyProduct
  selectedMargin: number
  calculatedPrice: number
  importQty: number
  willLink: boolean
}

// ============================================
// COMPONENT
// ============================================

export function SmartPricingView() {
  // Get merchant data from session
  const { merchantId, isLoading: isLoadingMerchant } = useMerchantData()
  
  // State
  const [activeTab, setActiveTab] = useState('overview')
  const [pricingItems, setPricingItems] = useState<PricingItem[]>([])
  const [groSupplyProducts, setGroSupplyProducts] = useState<GroSupplyProduct[]>([])
  const [priceRules, setPriceRules] = useState<PriceRule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [marginFilter, setMarginFilter] = useState('all')
  const [selectedItem, setSelectedItem] = useState<PricingItem | null>(null)
  const [editPriceOpen, setEditPriceOpen] = useState(false)
  const [editPriceValue, setEditPriceValue] = useState(0)
  const [importOpen, setImportOpen] = useState(false)
  const [importItems, setImportItems] = useState<ImportItem[]>([])
  const [importSearch, setImportSearch] = useState('')
  const [bulkUpdateOpen, setBulkUpdateOpen] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [bulkMargin, setBulkMargin] = useState(60)

  // Fetch data from API
  const fetchData = useCallback(async () => {
    if (!merchantId) return
    setIsLoading(true)
    try {
      // Fetch pricing items, GroSupply products, and price rules from APIs
      const [pricingRes, groSupplyRes, rulesRes] = await Promise.all([
        fetch(`/merchant-os/api/pricing/items?merchantId=${merchantId}`),
        fetch('/merchant-os/api/grosupply/catalog?status=active&limit=100'),
        fetch(`/merchant-os/api/pricing/rules?merchantId=${merchantId}`)
      ])
      
      if (pricingRes.ok) {
        const data = await pricingRes.json()
        setPricingItems(data.items || [])
      }
      
      if (groSupplyRes.ok) {
        const data = await groSupplyRes.json()
        // Transform catalog products to GroSupply products format
        const products = (data.products || []).map((p: any) => ({
          id: p.id,
          name: p.description,
          sku: p.sku,
          supplier: p.Supplier?.name || p.Wholesaler?.name || 'Unknown',
          unitPrice: p.costPrice,
          bulkPrice: null,
          minBulkQty: null,
          moq: p.minOrderQty || 1,
          leadTime: `${p.leadDays || 3} days`,
          category: p.category,
          inStock: p.inStock
        }))
        setGroSupplyProducts(products)
      }
      
      if (rulesRes.ok) {
        const data = await rulesRes.json()
        setPriceRules(data.rules || [])
      }
    } catch (error) {
      console.error('Error fetching pricing data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [merchantId])
  
  useEffect(() => {
    if (merchantId) {
      fetchData()
    } else if (!isLoadingMerchant) {
      setIsLoading(false)
    }
  }, [merchantId, isLoadingMerchant, fetchData])

  // Categories
  const categories = ['all', ...new Set(pricingItems.map(p => p.category))]

  // Filter items
  const filteredItems = useMemo(() => {
    return pricingItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
      let matchesMargin = true
      if (marginFilter === 'low') matchesMargin = item.marginPercent < 50
      if (marginFilter === 'healthy') matchesMargin = item.marginPercent >= 50 && item.marginPercent <= 70
      if (marginFilter === 'high') matchesMargin = item.marginPercent > 70
      return matchesSearch && matchesCategory && matchesMargin
    })
  }, [pricingItems, searchQuery, categoryFilter, marginFilter])

  // Stats
  const stats = {
    totalItems: pricingItems.length,
    avgMargin: pricingItems.reduce((sum, p) => sum + p.marginPercent, 0) / pricingItems.length,
    linkedToGroSupply: pricingItems.filter(p => p.linkedToGroSupply).length,
    priceAlerts: pricingItems.filter(p => p.suggestedPrice !== null).length,
    autoPricingEnabled: pricingItems.filter(p => p.autoPricing).length,
    lowStockItems: pricingItems.filter(p => p.stockLevel <= p.reorderPoint).length,
  }

  // Format currency
  const formatCurrency = (amount: number) => `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // Get velocity color
  const getVelocityColor = (velocity: string) => {
    switch (velocity) {
      case 'fast': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-amber-600 bg-amber-100'
      case 'slow': return 'text-orange-600 bg-orange-100'
      case 'dead': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  // Get margin color
  const getMarginColor = (margin: number) => {
    if (margin < 40) return 'text-red-600'
    if (margin < 50) return 'text-orange-600'
    if (margin <= 70) return 'text-green-600'
    return 'text-amber-600'
  }

  // Handle price update
  const handleUpdatePrice = () => {
    if (!selectedItem) return
    
    const newMargin = editPriceValue - selectedItem.costPrice
    const newMarginPercent = (newMargin / editPriceValue) * 100
    
    setPricingItems(prev => prev.map(item => 
      item.id === selectedItem.id 
        ? { 
            ...item, 
            currentPrice: editPriceValue, 
            margin: newMargin, 
            marginPercent: newMarginPercent,
            lastPriceUpdate: new Date().toISOString().split('T')[0],
            priceHistory: [...item.priceHistory, { date: new Date().toISOString().split('T')[0], price: editPriceValue }]
          } 
        : item
    ))
    
    setEditPriceOpen(false)
    setSelectedItem(null)
  }

  // Handle bulk price update
  const handleBulkUpdate = () => {
    setPricingItems(prev => prev.map(item => {
      if (!selectedItems.includes(item.id)) return item
      
      const newPrice = item.costPrice / (1 - bulkMargin / 100)
      const newMargin = newPrice - item.costPrice
      
      return {
        ...item,
        currentPrice: newPrice,
        margin: newMargin,
        marginPercent: bulkMargin,
        lastPriceUpdate: new Date().toISOString().split('T')[0],
      }
    }))
    
    setBulkUpdateOpen(false)
    setSelectedItems([])
  }

  // Handle apply suggested price
  const handleApplySuggested = (item: PricingItem) => {
    if (!item.suggestedPrice) return
    
    const newMargin = item.suggestedPrice - item.costPrice
    const newMarginPercent = (newMargin / item.suggestedPrice) * 100
    
    setPricingItems(prev => prev.map(p => 
      p.id === item.id 
        ? { 
            ...p, 
            currentPrice: item.suggestedPrice!, 
            margin: newMargin, 
            marginPercent: newMarginPercent,
            suggestedPrice: null,
            lastPriceUpdate: new Date().toISOString().split('T')[0],
          } 
        : p
    ))
  }

  // Handle add to import list
  const handleAddToImport = (product: GroSupplyProduct) => {
    const exists = importItems.find(i => i.groSupplyProduct.id === product.id)
    if (exists) return
    
    const defaultMargin = 60
    setImportItems(prev => [...prev, {
      groSupplyProduct: product,
      selectedMargin: defaultMargin,
      calculatedPrice: product.unitPrice / (1 - defaultMargin / 100),
      importQty: product.moq,
      willLink: true,
    }])
  }

  // Handle update import item
  const handleUpdateImportItem = (index: number, field: 'margin' | 'qty' | 'link', value: number | boolean) => {
    setImportItems(prev => prev.map((item, i) => {
      if (i !== index) return item
      
      if (field === 'margin') {
        const newPrice = item.groSupplyProduct.unitPrice / (1 - (value as number) / 100)
        return { ...item, selectedMargin: value as number, calculatedPrice: newPrice }
      }
      if (field === 'qty') return { ...item, importQty: value as number }
      if (field === 'link') return { ...item, willLink: value as boolean }
      return item
    }))
  }

  // Handle import products
  const handleImportProducts = () => {
    const newItems: PricingItem[] = importItems.map((importItem, i) => ({
      id: `PRI-${String(pricingItems.length + i + 1).padStart(3, '0')}`,
      name: importItem.groSupplyProduct.name,
      sku: importItem.groSupplyProduct.sku,
      barcode: '',
      category: importItem.groSupplyProduct.category,
      currentPrice: importItem.calculatedPrice,
      costPrice: importItem.groSupplyProduct.unitPrice,
      suggestedPrice: null,
      margin: importItem.calculatedPrice - importItem.groSupplyProduct.unitPrice,
      marginPercent: importItem.selectedMargin,
      competitorPrice: null,
      groSupplyPrice: importItem.groSupplyProduct.bulkPrice || importItem.groSupplyProduct.unitPrice,
      groSupplySupplier: importItem.groSupplyProduct.supplier,
      priceHistory: [{ date: new Date().toISOString().split('T')[0], price: importItem.calculatedPrice }],
      linkedToGroSupply: importItem.willLink,
      lastPriceUpdate: new Date().toISOString().split('T')[0],
      velocity: 'medium' as const,
      stockLevel: importItem.importQty,
      reorderPoint: Math.floor(importItem.importQty * 0.3),
      autoPricing: importItem.willLink,
      status: 'active' as const,
    }))
    
    setPricingItems(prev => [...prev, ...newItems])
    setImportItems([])
    setImportOpen(false)
  }

  // Toggle auto pricing
  const handleToggleAutoPricing = (item: PricingItem) => {
    setPricingItems(prev => prev.map(p => 
      p.id === item.id ? { ...p, autoPricing: !p.autoPricing } : p
    ))
  }

  // Toggle GroSupply link
  const handleToggleLink = (item: PricingItem) => {
    setPricingItems(prev => prev.map(p => 
      p.id === item.id ? { ...p, linkedToGroSupply: !p.linkedToGroSupply } : p
    ))
  }

  // Render Overview Tab
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="border-l-4 border-l-[#00897B]">
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Total Products</p>
            <p className="text-2xl font-bold">{stats.totalItems}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Avg Margin</p>
            <p className={`text-2xl font-bold ${getMarginColor(stats.avgMargin)}`}>
              {stats.avgMargin.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-[#00897B]" />
              <p className="text-xs text-[#757575]">GroSupply Linked</p>
            </div>
            <p className="text-2xl font-bold">{stats.linkedToGroSupply}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <p className="text-xs text-[#757575]">Price Alerts</p>
            </div>
            <p className="text-2xl font-bold text-amber-600">{stats.priceAlerts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-500" />
              <p className="text-xs text-[#757575]">Auto-Pricing</p>
            </div>
            <p className="text-2xl font-bold">{stats.autoPricingEnabled}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Low Stock</p>
            <p className="text-2xl font-bold text-red-500">{stats.lowStockItems}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 flex-wrap">
        <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setImportOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />Import from GroSupply
        </Button>
        <Button variant="outline" onClick={() => setBulkUpdateOpen(true)} disabled={selectedItems.length === 0}>
          <Edit2 className="h-4 w-4 mr-2" />Bulk Update ({selectedItems.length})
        </Button>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />Export Pricing
        </Button>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />Import Pricing
        </Button>
      </div>

      {/* AI Insights */}
      <Card className="border-l-4 border-l-[#00897B]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bot className="h-4 w-4 text-[#00897B]" />
            GroAI Pricing Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pricingItems.filter(p => p.suggestedPrice).slice(0, 3).map(item => (
              <div key={item.id} className="p-3 rounded-lg border border-amber-200 bg-amber-50">
                <div className="flex items-start gap-3">
                  <Lightbulb className="h-5 w-5 text-amber-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{item.name}</h4>
                    <p className="text-xs text-[#757575] mt-1">
                      Current: {formatCurrency(item.currentPrice)} → Suggested: {formatCurrency(item.suggestedPrice!)}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Button 
                        size="sm" 
                        className="h-7 text-xs bg-[#00897B] hover:bg-[#00695C]"
                        onClick={() => handleApplySuggested(item)}
                      >
                        Apply
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => {
                        setSelectedItem(item)
                        setEditPriceValue(item.suggestedPrice || item.currentPrice)
                        setEditPriceOpen(true)
                      }}>
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {stats.lowStockItems > 0 && (
              <div className="p-3 rounded-lg border border-red-200 bg-red-50">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">Low Stock Alert</h4>
                    <p className="text-xs text-[#757575] mt-1">
                      {stats.lowStockItems} items below reorder point. Order from GroSupply to restock.
                    </p>
                    <Button size="sm" variant="outline" className="h-7 text-xs mt-2" onClick={() => setActiveTab('import')}>
                      Order Now
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Margin Distribution Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Margin Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { range: '<40%', label: 'Low Margin', count: pricingItems.filter(p => p.marginPercent < 40).length, color: 'bg-red-500' },
                { range: '40-50%', label: 'Below Target', count: pricingItems.filter(p => p.marginPercent >= 40 && p.marginPercent < 50).length, color: 'bg-orange-500' },
                { range: '50-70%', label: 'Healthy', count: pricingItems.filter(p => p.marginPercent >= 50 && p.marginPercent <= 70).length, color: 'bg-green-500' },
                { range: '>70%', label: 'High Margin', count: pricingItems.filter(p => p.marginPercent > 70).length, color: 'bg-amber-500' },
              ].map((bucket, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-20 text-xs text-[#757575]">{bucket.range}</div>
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${bucket.color} transition-all`}
                      style={{ width: `${(bucket.count / pricingItems.length) * 100}%` }}
                    />
                  </div>
                  <div className="w-8 text-xs font-medium">{bucket.count}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              GroSupply Integration Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-[#E0F2F1] rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#00897B]" />
                  <span className="text-sm font-medium">Linked Products</span>
                </div>
                <span className="text-lg font-bold">{stats.linkedToGroSupply}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium">Unlinked Products</span>
                </div>
                <span className="text-lg font-bold">{stats.totalItems - stats.linkedToGroSupply}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-500" />
                  <span className="text-sm font-medium">Auto-Pricing Active</span>
                </div>
                <span className="text-lg font-bold">{stats.autoPricingEnabled}</span>
              </div>
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
          <Input placeholder="Search products..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c === 'all' ? 'All Categories' : c}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={marginFilter} onValueChange={setMarginFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Margin" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Margins</SelectItem>
            <SelectItem value="low">Low (&lt;50%)</SelectItem>
            <SelectItem value="healthy">Healthy (50-70%)</SelectItem>
            <SelectItem value="high">High (&gt;70%)</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => setImportOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />Import
        </Button>
      </div>

      {/* Products Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input 
                    type="checkbox" 
                    checked={selectedItems.length === filteredItems.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(filteredItems.map(i => i.id))
                      } else {
                        setSelectedItems([])
                      }
                    }}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Cost</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Margin</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">GroSupply</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[#757575]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input 
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems(prev => [...prev, item.id])
                        } else {
                          setSelectedItems(prev => prev.filter(id => id !== item.id))
                        }
                      }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-[#757575]">{item.sku}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{formatCurrency(item.costPrice)}</td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-sm">{formatCurrency(item.currentPrice)}</p>
                      {item.suggestedPrice && (
                        <p className="text-xs text-amber-600">Suggest: {formatCurrency(item.suggestedPrice)}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${getMarginColor(item.marginPercent)}`}>
                        {item.marginPercent.toFixed(1)}%
                      </span>
                      {item.marginPercent >= 50 && item.marginPercent <= 70 && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <p className="text-xs text-[#757575]">{formatCurrency(item.margin)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {item.linkedToGroSupply ? (
                        <>
                          <Link2 className="h-4 w-4 text-[#00897B]" />
                          <div>
                            <p className="text-xs font-medium">{item.groSupplySupplier}</p>
                            <p className="text-xs text-[#757575]">{item.groSupplyPrice ? formatCurrency(item.groSupplyPrice) : '-'}</p>
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-[#757575]">Not linked</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <Badge className={`text-[10px] ${getVelocityColor(item.velocity)}`}>
                        {item.velocity}
                      </Badge>
                      {item.autoPricing && (
                        <Badge className="text-[10px] bg-purple-100 text-purple-700">Auto</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedItem(item)
                          setEditPriceValue(item.currentPrice)
                          setEditPriceOpen(true)
                        }}>
                          <Edit2 className="h-4 w-4 mr-2" />Edit Price
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleAutoPricing(item)}>
                          <Zap className="h-4 w-4 mr-2" />
                          {item.autoPricing ? 'Disable Auto-Pricing' : 'Enable Auto-Pricing'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleLink(item)}>
                          {item.linkedToGroSupply ? (
                            <><Unlink className="h-4 w-4 mr-2" />Unlink from GroSupply</>
                          ) : (
                            <><Link2 className="h-4 w-4 mr-2" />Link to GroSupply</>
                          )}
                        </DropdownMenuItem>
                        {item.suggestedPrice && (
                          <DropdownMenuItem onClick={() => handleApplySuggested(item)}>
                            <CheckCircle2 className="h-4 w-4 mr-2" />Apply Suggested Price
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )

  // Render Import Tab
  const renderImport = () => {
    const filteredGroSupply = groSupplyProducts.filter(p => 
      p.name.toLowerCase().includes(importSearch.toLowerCase()) ||
      p.supplier.toLowerCase().includes(importSearch.toLowerCase())
    )

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GroSupply Catalog */}
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Store className="h-5 w-5 text-[#00897B]" />
              GroSupply Catalog
            </CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
              <Input 
                placeholder="Search products..." 
                className="pl-9"
                value={importSearch}
                onChange={(e) => setImportSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-[500px]">
              <div className="p-4 space-y-2">
                {filteredGroSupply.map(product => (
                  <div key={product.id} className="p-3 border rounded-lg hover:border-[#00897B] cursor-pointer transition-all"
                    onClick={() => handleAddToImport(product)}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-[#757575]">{product.supplier} • {product.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#00897B]">{formatCurrency(product.unitPrice)}</p>
                        {product.bulkPrice && (
                          <p className="text-xs text-green-600">Bulk: {formatCurrency(product.bulkPrice)}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-[#757575]">
                      <span>MOQ: {product.moq}</span>
                      <span>•</span>
                      <span>{product.leadTime}</span>
                      <Badge variant="outline" className="ml-auto text-[10px]">Click to add</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Import Queue */}
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-[#00897B]" />
                Import Queue ({importItems.length})
              </CardTitle>
              {importItems.length > 0 && (
                <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleImportProducts}>
                  <Plus className="h-4 w-4 mr-2" />Import All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            {importItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-[#757575]">
                <Package className="h-12 w-12 mb-4 opacity-30" />
                <p className="text-sm">No products in queue</p>
                <p className="text-xs">Click products from GroSupply to add them</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="p-4 space-y-3">
                  {importItems.map((item, index) => (
                    <div key={item.groSupplyProduct.id} className="p-3 border rounded-lg bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium text-sm">{item.groSupplyProduct.name}</p>
                          <p className="text-xs text-[#757575]">{item.groSupplyProduct.supplier}</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setImportItems(prev => prev.filter((_, i) => i !== index))}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div>
                          <Label className="text-xs text-[#757575]">Cost</Label>
                          <p className="font-medium">{formatCurrency(item.groSupplyProduct.unitPrice)}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-[#757575]">Margin %</Label>
                          <Select 
                            value={String(item.selectedMargin)} 
                            onValueChange={(v) => handleUpdateImportItem(index, 'margin', Number(v))}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[40, 50, 55, 60, 65, 70, 75, 80].map(m => (
                                <SelectItem key={m} value={String(m)}>{m}%</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs text-[#757575]">Qty</Label>
                          <Input 
                            type="number"
                            className="h-8"
                            value={item.importQty}
                            onChange={(e) => handleUpdateImportItem(index, 'qty', Number(e.target.value))}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-2 bg-white rounded">
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox"
                            checked={item.willLink}
                            onChange={(e) => handleUpdateImportItem(index, 'link', e.target.checked)}
                          />
                          <span className="text-xs">Link to GroSupply for auto-pricing</span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-[#757575]">Selling Price</p>
                          <p className="text-lg font-bold text-[#00897B]">{formatCurrency(item.calculatedPrice)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Render Rules Tab
  const renderRules = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Pricing Rules</CardTitle>
            <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C]">
              <Plus className="h-4 w-4 mr-2" />Add Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {priceRules.map(rule => (
              <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    rule.type === 'margin' ? 'bg-green-100 text-green-600' :
                    rule.type === 'markup' ? 'bg-blue-100 text-blue-600' :
                    rule.type === 'competitor' ? 'bg-purple-100 text-purple-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {rule.type === 'margin' && <Percent className="h-5 w-5" />}
                    {rule.type === 'markup' && <TrendingUp className="h-5 w-5" />}
                    {rule.type === 'competitor' && <Target className="h-5 w-5" />}
                    {rule.type === 'fixed' && <DollarSign className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-medium">{rule.name}</p>
                    <p className="text-sm text-[#757575]">
                      {rule.type === 'margin' && `${rule.value}% margin`}
                      {rule.type === 'markup' && `${rule.value}% markup`}
                      {rule.type === 'competitor' && `Competitor price +${rule.value}%`}
                      {rule.type === 'fixed' && `R${rule.value} fixed`}
                      {rule.categoryId && ` • ${rule.categoryId}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={rule.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                    {rule.active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Auto-Pricing Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Sync with GroSupply Costs</p>
              <p className="text-sm text-[#757575]">Automatically update prices when supplier costs change</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Competitor Price Tracking</p>
              <p className="text-sm text-[#757575]">Monitor competitor prices and suggest adjustments</p>
            </div>
            <input type="checkbox" className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Margin Alerts</p>
              <p className="text-sm text-[#757575]">Get notified when margins fall below threshold</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-[#00897B]" />
          <span className="ml-2 text-[#757575]">Loading pricing data...</span>
        </div>
      )}
      
      {!isLoading && (
        <>
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#1A1A1A] flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#00897B]" />
              Smart Pricing Center
            </h1>
            <p className="text-sm text-[#757575]">Unified pricing linked with Inventory & GroSupply</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setImportOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Products
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-12 bg-transparent">
            <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] data-[state=active]:shadow-none rounded-none">
              Overview
            </TabsTrigger>
            <TabsTrigger value="products" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] data-[state=active]:shadow-none rounded-none">
              Products
            </TabsTrigger>
            <TabsTrigger value="import" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] data-[state=active]:shadow-none rounded-none">
              Import from GroSupply
            </TabsTrigger>
            <TabsTrigger value="rules" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] data-[state=active]:shadow-none rounded-none">
              Pricing Rules
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'products' && renderProducts()}
          {activeTab === 'import' && renderImport()}
          {activeTab === 'rules' && renderRules()}
        </div>
      </ScrollArea>

      {/* Edit Price Dialog */}
      <Dialog open={editPriceOpen} onOpenChange={setEditPriceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Price</DialogTitle>
            <DialogDescription>
              {selectedItem?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-[#757575]">Cost Price</Label>
                <p className="font-medium">{selectedItem && formatCurrency(selectedItem.costPrice)}</p>
              </div>
              <div>
                <Label className="text-sm text-[#757575]">Current Price</Label>
                <p className="font-medium">{selectedItem && formatCurrency(selectedItem.currentPrice)}</p>
              </div>
            </div>
            <div>
              <Label>New Selling Price</Label>
              <Input 
                type="number"
                value={editPriceValue}
                onChange={(e) => setEditPriceValue(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            {editPriceValue > 0 && selectedItem && (
              <div className="p-3 bg-[#E0F2F1] rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>New Margin:</span>
                  <span className={`font-bold ${getMarginColor((editPriceValue - selectedItem.costPrice) / editPriceValue * 100)}`}>
                    {((editPriceValue - selectedItem.costPrice) / editPriceValue * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Profit per unit:</span>
                  <span className="font-bold">{formatCurrency(editPriceValue - selectedItem.costPrice)}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPriceOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleUpdatePrice}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Update Dialog */}
      <Dialog open={bulkUpdateOpen} onOpenChange={setBulkUpdateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Price Update</DialogTitle>
            <DialogDescription>
              Update prices for {selectedItems.length} selected products
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Target Margin %</Label>
              <Select value={String(bulkMargin)} onValueChange={(v) => setBulkMargin(Number(v))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[40, 45, 50, 55, 60, 65, 70, 75, 80].map(m => (
                    <SelectItem key={m} value={String(m)}>{m}%</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-[#757575]">
              Prices will be calculated as: Cost ÷ (1 - Margin%)
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkUpdateOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleBulkUpdate}>
              Update {selectedItems.length} Products
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Import Dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Import Products from GroSupply</DialogTitle>
            <DialogDescription>
              Select products from GroSupply marketplace and set your pricing
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {renderImport()}
          </div>
        </DialogContent>
      </Dialog>
        </>
      )}
    </div>
  )
}

// Missing Label component
function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <label className={`text-sm font-medium ${className}`}>{children}</label>
}
