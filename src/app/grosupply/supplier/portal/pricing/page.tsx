'use client'

import { useState, useMemo } from 'react'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Package,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Percent,
  Calculator,
  Target,
  History,
  Undo2,
  Filter,
  RefreshCw,
  CheckSquare,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Save,
  X,
  Eye,
  Settings2,
  Layers,
  Timer,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { useSupplierAuth } from '../layout'
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'

// ============================================
// TYPES & INTERFACES
// ============================================

interface Product {
  id: string
  sku: string
  name: string
  category: string
  supplier: string
  currentPrice: number
  costPrice: number
  newPrice: number | null
  stock: number
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock'
  lastUpdated: string
  margin?: number
}

interface PriceHistoryItem {
  id: string
  date: string
  time: string
  type: 'percentage' | 'fixed' | 'set_value' | 'margin'
  method: string
  affectedProducts: number
  avgChange: number
  totalChange: number
  user: string
  canRevert: boolean
  products: string[]
}

interface ScheduledUpdate {
  id: string
  scheduledDate: string
  scheduledTime: string
  type: 'once' | 'recurring'
  frequency?: 'daily' | 'weekly' | 'monthly'
  method: string
  value: number
  affectedProducts: number
  status: 'pending' | 'completed' | 'cancelled'
}

// ============================================
// MOCK DATA
// ============================================

const categories = [
  { id: 'all', name: 'All Categories' },
  { id: 'fresh', name: 'Fresh Produce' },
  { id: 'dairy', name: 'Dairy' },
  { id: 'beverages', name: 'Beverages' },
  { id: 'grocery', name: 'Grocery' },
  { id: 'cleaning', name: 'Cleaning Supplies' },
  { id: 'packaging', name: 'Packaging' },
  { id: 'frozen', name: 'Frozen Foods' },
]

const suppliers = [
  { id: 'all', name: 'All Suppliers' },
  { id: 'sup_001', name: 'Demo Wholesale SA' },
  { id: 'sup_002', name: 'Fresh Farms Co.' },
  { id: 'sup_003', name: 'Dairy Direct Ltd.' },
]

const mockProducts: Product[] = [
  { id: 'PRD-001', sku: 'FP-VEG-001', name: 'Fresh Vegetables Mix', category: 'fresh', supplier: 'sup_001', currentPrice: 45.00, costPrice: 28.00, newPrice: null, stock: 150, stockStatus: 'in_stock', lastUpdated: '2026-01-10' },
  { id: 'PRD-002', sku: 'FP-FRU-002', name: 'Seasonal Fruit Selection', category: 'fresh', supplier: 'sup_001', currentPrice: 120.00, costPrice: 75.00, newPrice: null, stock: 80, stockStatus: 'in_stock', lastUpdated: '2026-01-12' },
  { id: 'PRD-003', sku: 'DR-MLK-001', name: 'Full Cream Milk 2L', category: 'dairy', supplier: 'sup_001', currentPrice: 32.50, costPrice: 22.00, newPrice: null, stock: 200, stockStatus: 'in_stock', lastUpdated: '2026-01-14' },
  { id: 'PRD-004', sku: 'DR-CHS-001', name: 'Cheddar Cheese Block', category: 'dairy', supplier: 'sup_001', currentPrice: 145.00, costPrice: 95.00, newPrice: null, stock: 45, stockStatus: 'in_stock', lastUpdated: '2026-01-11' },
  { id: 'PRD-005', sku: 'CL-IND-001', name: 'Industrial Cleaner 5L', category: 'cleaning', supplier: 'sup_002', currentPrice: 85.00, costPrice: 52.00, newPrice: null, stock: 0, stockStatus: 'out_of_stock', lastUpdated: '2026-01-08' },
  { id: 'PRD-006', sku: 'BV-SFT-001', name: 'Coca-Cola 2L Case', category: 'beverages', supplier: 'sup_001', currentPrice: 220.00, costPrice: 165.00, newPrice: null, stock: 60, stockStatus: 'in_stock', lastUpdated: '2026-01-13' },
  { id: 'PRD-007', sku: 'PK-BAG-001', name: 'Vacuum Pack Rolls 500pcs', category: 'packaging', supplier: 'sup_003', currentPrice: 450.00, costPrice: 320.00, newPrice: null, stock: 25, stockStatus: 'in_stock', lastUpdated: '2026-01-09' },
  { id: 'PRD-008', sku: 'FP-VEG-002', name: 'Organic Carrots 5kg', category: 'fresh', supplier: 'sup_002', currentPrice: 65.00, costPrice: 42.00, newPrice: null, stock: 8, stockStatus: 'low_stock', lastUpdated: '2026-01-07' },
  { id: 'PRD-009', sku: 'DR-YOG-001', name: 'Greek Yogurt Bulk', category: 'dairy', supplier: 'sup_001', currentPrice: 78.00, costPrice: 52.00, newPrice: null, stock: 35, stockStatus: 'in_stock', lastUpdated: '2026-01-10' },
  { id: 'PRD-010', sku: 'BV-JUI-001', name: 'Orange Juice 1L Case', category: 'beverages', supplier: 'sup_002', currentPrice: 185.00, costPrice: 130.00, newPrice: null, stock: 42, stockStatus: 'in_stock', lastUpdated: '2026-01-11' },
  { id: 'PRD-011', sku: 'GR-CER-001', name: 'Rice Basmati 10kg', category: 'grocery', supplier: 'sup_001', currentPrice: 195.00, costPrice: 145.00, newPrice: null, stock: 120, stockStatus: 'in_stock', lastUpdated: '2026-01-12' },
  { id: 'PRD-012', sku: 'FR-ZN-001', name: 'Frozen Mixed Berries', category: 'frozen', supplier: 'sup_003', currentPrice: 95.00, costPrice: 68.00, newPrice: null, stock: 5, stockStatus: 'low_stock', lastUpdated: '2026-01-06' },
  { id: 'PRD-013', sku: 'CL-KIT-001', name: 'Kitchen Degreaser', category: 'cleaning', supplier: 'sup_001', currentPrice: 55.00, costPrice: 35.00, newPrice: null, stock: 88, stockStatus: 'in_stock', lastUpdated: '2026-01-13' },
  { id: 'PRD-014', sku: 'FP-HERB-001', name: 'Fresh Herb Bundle', category: 'fresh', supplier: 'sup_002', currentPrice: 28.00, costPrice: 18.00, newPrice: null, stock: 0, stockStatus: 'out_of_stock', lastUpdated: '2026-01-05' },
  { id: 'PRD-015', sku: 'DR-MLK-002', name: 'Low Fat Milk 1L', category: 'dairy', supplier: 'sup_001', currentPrice: 18.50, costPrice: 12.00, newPrice: null, stock: 180, stockStatus: 'in_stock', lastUpdated: '2026-01-14' },
]

const mockPriceHistory: PriceHistoryItem[] = [
  { id: 'HIST-001', date: '2026-01-14', time: '09:32', type: 'percentage', method: '+5% increase', affectedProducts: 8, avgChange: 8.50, totalChange: 68.00, user: 'John Smith', canRevert: true, products: ['PRD-001', 'PRD-002', 'PRD-003', 'PRD-004', 'PRD-006', 'PRD-007', 'PRD-009', 'PRD-010'] },
  { id: 'HIST-002', date: '2026-01-12', time: '14:15', type: 'fixed', method: '-R10 discount', affectedProducts: 3, avgChange: -10.00, totalChange: -30.00, user: 'Sarah Johnson', canRevert: true, products: ['PRD-005', 'PRD-008', 'PRD-012'] },
  { id: 'HIST-003', date: '2026-01-10', time: '11:45', type: 'margin', method: '35% margin', affectedProducts: 5, avgChange: 15.20, totalChange: 76.00, user: 'John Smith', canRevert: false, products: ['PRD-011', 'PRD-013', 'PRD-014', 'PRD-015'] },
  { id: 'HIST-004', date: '2026-01-08', time: '16:20', type: 'set_value', method: 'Set to R200', affectedProducts: 2, avgChange: 25.00, totalChange: 50.00, user: 'Mike Davis', canRevert: false, products: ['PRD-006', 'PRD-010'] },
  { id: 'HIST-005', date: '2026-01-05', time: '08:00', type: 'percentage', method: '-3% seasonal discount', affectedProducts: 10, avgChange: -5.80, totalChange: -58.00, user: 'Sarah Johnson', canRevert: false, products: ['PRD-001', 'PRD-002', 'PRD-003', 'PRD-004', 'PRD-006', 'PRD-007', 'PRD-009', 'PRD-010', 'PRD-011', 'PRD-013'] },
]

const mockScheduledUpdates: ScheduledUpdate[] = [
  { id: 'SCH-001', scheduledDate: '2026-01-20', scheduledTime: '00:00', type: 'once', method: '+2% monthly adjustment', value: 2, affectedProducts: 15, status: 'pending' },
  { id: 'SCH-002', scheduledDate: '2026-02-01', scheduledTime: '06:00', type: 'recurring', frequency: 'monthly', method: 'Set margin to 30%', value: 30, affectedProducts: 15, status: 'pending' },
]

// ============================================
// MAIN COMPONENT
// ============================================

export default function BulkPriceUpdatePage() {
  const { supplier } = useSupplierAuth()
  
  // State
  const [products, setProducts] = useState<Product[]>(mockProducts)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [priceHistory] = useState<PriceHistoryItem[]>(mockPriceHistory)
  const [scheduledUpdates, setScheduledUpdates] = useState<ScheduledUpdate[]>(mockScheduledUpdates)
  
  // Filter state
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [supplierFilter, setSupplierFilter] = useState('all')
  const [priceRangeMin, setPriceRangeMin] = useState('')
  const [priceRangeMax, setPriceRangeMax] = useState('')
  const [stockStatusFilter, setStockStatusFilter] = useState('all')
  
  // Update method state
  const [updateMethod, setUpdateMethod] = useState<'percentage' | 'fixed' | 'set_value' | 'margin'>('percentage')
  const [updateValue, setUpdateValue] = useState('')
  const [isIncrease, setIsIncrease] = useState(true)
  const [marginValue, setMarginValue] = useState(30)
  
  // Dialogs
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [historyDetailOpen, setHistoryDetailOpen] = useState(false)
  const [selectedHistory, setSelectedHistory] = useState<PriceHistoryItem | null>(null)
  
  // Schedule state
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('00:00')
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringFrequency, setRecurringFrequency] = useState<'daily' | 'weekly' | 'monthly'>('monthly')
  
  // Confirmation state
  const [confirmText, setConfirmText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Format currency
  const formatCurrency = (amount: number) => 
    `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  
  // Format percentage
  const formatPercent = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
  
  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false
      if (supplierFilter !== 'all' && p.supplier !== supplierFilter) return false
      if (priceRangeMin && p.currentPrice < parseFloat(priceRangeMin)) return false
      if (priceRangeMax && p.currentPrice > parseFloat(priceRangeMax)) return false
      if (stockStatusFilter !== 'all' && p.stockStatus !== stockStatusFilter) return false
      return true
    })
  }, [products, categoryFilter, supplierFilter, priceRangeMin, priceRangeMax, stockStatusFilter])
  
  // Calculate new price for a product
  const calculateNewPrice = (product: Product): number => {
    const value = parseFloat(updateValue) || 0
    
    switch (updateMethod) {
      case 'percentage':
        const percentChange = isIncrease ? value : -value
        return product.currentPrice * (1 + percentChange / 100)
      case 'fixed':
        const fixedChange = isIncrease ? value : -value
        return Math.max(0, product.currentPrice + fixedChange)
      case 'set_value':
        return value
      case 'margin':
        return product.costPrice * (1 + marginValue / 100)
      default:
        return product.currentPrice
    }
  }
  
  // Preview products with calculated new prices
  const productsWithPreview = useMemo(() => {
    return filteredProducts.map(p => ({
      ...p,
      newPrice: selectedProducts.includes(p.id) ? calculateNewPrice(p) : null
    }))
  }, [filteredProducts, selectedProducts, updateMethod, updateValue, isIncrease, marginValue])
  
  // Stats
  const stats = useMemo(() => {
    const selected = productsWithPreview.filter(p => selectedProducts.includes(p.id))
    const totalProducts = products.length
    const productsToUpdate = selected.length
    
    const avgPriceChange = selected.length > 0 
      ? selected.reduce((sum, p) => sum + ((p.newPrice || p.currentPrice) - p.currentPrice), 0) / selected.length 
      : 0
    
    const lastUpdate = priceHistory[0]
    
    return {
      totalProducts,
      productsToUpdate,
      avgPriceChange,
      lastUpdate: lastUpdate ? `${lastUpdate.date} ${lastUpdate.time}` : 'Never'
    }
  }, [productsWithPreview, selectedProducts, priceHistory])
  
  // Handlers
  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id))
    }
  }
  
  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }
  
  const handlePreviewUpdate = () => {
    if (selectedProducts.length === 0) return
    setPreviewDialogOpen(true)
  }
  
  const handleConfirmUpdate = () => {
    setPreviewDialogOpen(false)
    setConfirmDialogOpen(true)
  }
  
  const handleApplyUpdate = async () => {
    if (confirmText !== 'CONFIRM') return
    
    setIsProcessing(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Apply the update
    setProducts(prev => prev.map(p => {
      if (selectedProducts.includes(p.id)) {
        const newPrice = calculateNewPrice(p)
        return {
          ...p,
          currentPrice: newPrice,
          newPrice: null,
          lastUpdated: new Date().toISOString().split('T')[0],
          margin: updateMethod === 'margin' ? marginValue : undefined
        }
      }
      return p
    }))
    
    setIsProcessing(false)
    setConfirmDialogOpen(false)
    setConfirmText('')
    setSelectedProducts([])
    setUpdateValue('')
  }
  
  const handleScheduleUpdate = () => {
    if (!scheduleDate || selectedProducts.length === 0) return
    
    const newSchedule: ScheduledUpdate = {
      id: `SCH-${Date.now()}`,
      scheduledDate: scheduleDate,
      scheduledTime: scheduleTime,
      type: isRecurring ? 'recurring' : 'once',
      frequency: isRecurring ? recurringFrequency : undefined,
      method: getMethodDescription(),
      value: updateMethod === 'margin' ? marginValue : parseFloat(updateValue) || 0,
      affectedProducts: selectedProducts.length,
      status: 'pending'
    }
    
    setScheduledUpdates(prev => [...prev, newSchedule])
    setScheduleDialogOpen(false)
    setScheduleDate('')
    setScheduleTime('00:00')
    setIsRecurring(false)
  }
  
  const handleRevert = async (historyItem: PriceHistoryItem) => {
    // Simulate revert
    await new Promise(resolve => setTimeout(resolve, 1000))
    // In real implementation, this would restore previous prices
    setSelectedHistory(null)
    setHistoryDetailOpen(false)
  }
  
  const handleCancelSchedule = (scheduleId: string) => {
    setScheduledUpdates(prev => prev.map(s => 
      s.id === scheduleId ? { ...s, status: 'cancelled' } : s
    ))
  }
  
  const getMethodDescription = () => {
    const value = parseFloat(updateValue) || marginValue
    switch (updateMethod) {
      case 'percentage':
        return `${isIncrease ? '+' : '-'}${value}% adjustment`
      case 'fixed':
        return `${isIncrease ? '+' : '-'}R${value} adjustment`
      case 'set_value':
        return `Set to R${value}`
      case 'margin':
        return `${marginValue}% margin`
      default:
        return ''
    }
  }
  
  const stockStatusConfig = {
    in_stock: { color: 'text-green-700', bgColor: 'bg-green-100', label: 'In Stock' },
    low_stock: { color: 'text-amber-700', bgColor: 'bg-amber-100', label: 'Low Stock' },
    out_of_stock: { color: 'text-red-700', bgColor: 'bg-red-100', label: 'Out of Stock' },
  }
  
  const updateMethodConfig = {
    percentage: { icon: Percent, label: 'Percentage', description: 'Increase/decrease by X%' },
    fixed: { icon: DollarSign, label: 'Fixed Amount', description: 'Add/subtract fixed amount' },
    set_value: { icon: Target, label: 'Set to Value', description: 'Set all to specific price' },
    margin: { icon: Calculator, label: 'Margin Based', description: 'Set price based on cost + margin %' },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Bulk Price Update</h1>
          <p className="text-[#757575]">Update prices across multiple products at once</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setScheduleDialogOpen(true)} disabled={selectedProducts.length === 0}>
            <Timer className="h-4 w-4 mr-2" />
            Schedule Update
          </Button>
          <Button 
            onClick={handlePreviewUpdate} 
            disabled={selectedProducts.length === 0 || (updateMethod !== 'margin' && !updateValue)}
            className="bg-[#00897B] hover:bg-[#00695C]"
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview Changes
          </Button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[#00897B]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#E0F2F1] flex items-center justify-center">
                <Package className="h-5 w-5 text-[#00897B]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1A1A1A]">{stats.productsToUpdate}</p>
                <p className="text-xs text-[#757575]">Products to Update</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-400">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                {stats.avgPriceChange >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                )}
              </div>
              <div>
                <p className={`text-2xl font-bold ${stats.avgPriceChange >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatCurrency(Math.abs(stats.avgPriceChange))}
                </p>
                <p className="text-xs text-[#757575]">Avg Price Change</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Layers className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1A1A1A]">{stats.totalProducts}</p>
                <p className="text-xs text-[#757575]">Total Products</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <History className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-[#1A1A1A]">{stats.lastUpdate}</p>
                <p className="text-xs text-[#757575]">Last Bulk Update</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Filters & Update Methods */}
        <div className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filter Products
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-[#757575]">Category</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-[#757575]">Supplier</Label>
                <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(sup => (
                      <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-[#757575]">Price Range</Label>
                <div className="flex gap-2 mt-1">
                  <Input 
                    placeholder="Min" 
                    type="number" 
                    value={priceRangeMin}
                    onChange={(e) => setPriceRangeMin(e.target.value)}
                  />
                  <Input 
                    placeholder="Max" 
                    type="number" 
                    value={priceRangeMax}
                    onChange={(e) => setPriceRangeMax(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-[#757575]">Stock Status</Label>
                <Select value={stockStatusFilter} onValueChange={setStockStatusFilter}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="in_stock">In Stock</SelectItem>
                    <SelectItem value="low_stock">Low Stock</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => {
                  setCategoryFilter('all')
                  setSupplierFilter('all')
                  setPriceRangeMin('')
                  setPriceRangeMax('')
                  setStockStatusFilter('all')
                }}
              >
                <RefreshCw className="h-3 w-3 mr-2" />
                Reset Filters
              </Button>
            </CardContent>
          </Card>

          {/* Update Method */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Update Method
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(updateMethodConfig) as [keyof typeof updateMethodConfig, typeof updateMethodConfig.percentage][]).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => setUpdateMethod(key)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      updateMethod === key 
                        ? 'border-[#00897B] bg-[#E0F2F1]' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <config.icon className={`h-4 w-4 ${updateMethod === key ? 'text-[#00897B]' : 'text-[#757575]'}`} />
                    <p className={`text-sm font-medium mt-1 ${updateMethod === key ? 'text-[#00897B]' : 'text-[#1A1A1A]'}`}>
                      {config.label}
                    </p>
                  </button>
                ))}
              </div>

              {updateMethod === 'percentage' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant={isIncrease ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setIsIncrease(true)}
                      className={isIncrease ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                      <TrendingUp className="h-4 w-4 mr-1" /> Increase
                    </Button>
                    <Button
                      variant={!isIncrease ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setIsIncrease(false)}
                      className={!isIncrease ? 'bg-red-600 hover:bg-red-700' : ''}
                    >
                      <TrendingDown className="h-4 w-4 mr-1" /> Decrease
                    </Button>
                  </div>
                  <div>
                    <Label className="text-xs text-[#757575]">Percentage Value</Label>
                    <div className="relative mt-1">
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        value={updateValue}
                        onChange={(e) => setUpdateValue(e.target.value)}
                        className="pr-8"
                      />
                      <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
                    </div>
                  </div>
                </div>
              )}

              {updateMethod === 'fixed' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant={isIncrease ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setIsIncrease(true)}
                      className={isIncrease ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                      <ArrowUpRight className="h-4 w-4 mr-1" /> Add
                    </Button>
                    <Button
                      variant={!isIncrease ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setIsIncrease(false)}
                      className={!isIncrease ? 'bg-red-600 hover:bg-red-700' : ''}
                    >
                      <ArrowDownRight className="h-4 w-4 mr-1" /> Subtract
                    </Button>
                  </div>
                  <div>
                    <Label className="text-xs text-[#757575]">Amount (R)</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#757575]">R</span>
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        value={updateValue}
                        onChange={(e) => setUpdateValue(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                </div>
              )}

              {updateMethod === 'set_value' && (
                <div>
                  <Label className="text-xs text-[#757575]">Set Price To (R)</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#757575]">R</span>
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      value={updateValue}
                      onChange={(e) => setUpdateValue(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <p className="text-xs text-[#757575] mt-2">All selected products will be set to this price</p>
                </div>
              )}

              {updateMethod === 'margin' && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs text-[#757575]">Target Margin</Label>
                      <span className="text-sm font-medium text-[#00897B]">{marginValue}%</span>
                    </div>
                    <Slider
                      value={[marginValue]}
                      onValueChange={(v) => setMarginValue(v[0])}
                      min={5}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-[#757575] mt-1">
                      <span>5%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-700">
                      <Info className="h-3 w-3 inline mr-1" />
                      Price = Cost Price × (1 + {marginValue}%)
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Product Selection Table */}
        <div className="col-span-2 space-y-6">
          {/* Product Selection */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Select Products</CardTitle>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-[#757575]">
                    {filteredProducts.length} products found
                  </span>
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    <CheckSquare 
                      className="mr-2 h-3 w-3"
                    />
                    {selectedProducts.length === filteredProducts.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-white">
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Current Price</TableHead>
                      <TableHead className="text-right">New Price</TableHead>
                      <TableHead className="text-center">Change</TableHead>
                      <TableHead className="text-center">Stock</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productsWithPreview.map((product) => {
                      const stockConfig = stockStatusConfig[product.stockStatus]
                      const isSelected = selectedProducts.includes(product.id)
                      const priceChange = isSelected && product.newPrice !== null 
                        ? product.newPrice - product.currentPrice 
                        : 0
                      const percentChange = isSelected && product.newPrice !== null 
                        ? ((product.newPrice - product.currentPrice) / product.currentPrice) * 100 
                        : 0

                      return (
                        <TableRow 
                          key={product.id}
                          className={isSelected ? 'bg-[#E0F2F1]/50' : ''}
                        >
                          <TableCell>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleSelectProduct(product.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{product.name}</p>
                              <p className="text-xs text-[#757575]">{product.sku}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs capitalize">
                              {product.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(product.currentPrice)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {isSelected && product.newPrice !== null ? (
                              <span className={priceChange >= 0 ? 'text-blue-600' : 'text-red-600'}>
                                {formatCurrency(product.newPrice)}
                              </span>
                            ) : (
                              <span className="text-[#757575]">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {isSelected && product.newPrice !== null ? (
                              <div className="flex items-center justify-center gap-1">
                                {priceChange > 0 ? (
                                  <ArrowUpRight className="h-3 w-3 text-blue-600" />
                                ) : priceChange < 0 ? (
                                  <ArrowDownRight className="h-3 w-3 text-red-600" />
                                ) : (
                                  <Minus className="h-3 w-3 text-gray-400" />
                                )}
                                <span className={`text-xs font-medium ${priceChange >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                  {formatPercent(percentChange)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[#757575] text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={`${stockConfig.bgColor} ${stockConfig.color} border-0 text-xs`}>
                              {product.stock}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Price History */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4" />
                Recent Bulk Updates
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[200px]">
                <div className="divide-y">
                  {priceHistory.map((item) => (
                    <div 
                      key={item.id} 
                      className="p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => { setSelectedHistory(item); setHistoryDetailOpen(true); }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            item.avgChange >= 0 ? 'bg-blue-100' : 'bg-red-100'
                          }`}>
                            {item.avgChange >= 0 ? (
                              <TrendingUp className={`h-4 w-4 text-blue-600`} />
                            ) : (
                              <TrendingDown className={`h-4 w-4 text-red-600`} />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{item.method}</p>
                            <p className="text-xs text-[#757575]">{item.date} at {item.time} • by {item.user}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className={`text-sm font-medium ${item.avgChange >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                              {item.avgChange >= 0 ? '+' : ''}{formatCurrency(item.avgChange)}
                            </p>
                            <p className="text-xs text-[#757575]">{item.affectedProducts} products</p>
                          </div>
                          {item.canRevert && (
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleRevert(item); }}>
                              <Undo2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Scheduled Updates */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Timer className="h-4 w-4" />
                Scheduled Updates
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {scheduledUpdates.filter(s => s.status === 'pending').length === 0 ? (
                <div className="p-6 text-center text-[#757575]">
                  <Timer className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No scheduled updates</p>
                </div>
              ) : (
                <div className="divide-y">
                  {scheduledUpdates.filter(s => s.status === 'pending').map((schedule) => (
                    <div key={schedule.id} className="p-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                            {schedule.type === 'recurring' ? (
                              <RotateCcw className="h-4 w-4 text-purple-600" />
                            ) : (
                              <Calendar className="h-4 w-4 text-purple-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{schedule.method}</p>
                            <p className="text-xs text-[#757575]">
                              {schedule.scheduledDate} at {schedule.scheduledTime}
                              {schedule.frequency && ` • ${schedule.frequency}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {schedule.affectedProducts} products
                          </Badge>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleCancelSchedule(schedule.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Preview Price Changes</DialogTitle>
            <DialogDescription>
              Review the changes before applying them to {selectedProducts.length} products
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-[#E0F2F1] border-[#00897B]">
                <CardContent className="p-4">
                  <p className="text-sm text-[#757575]">Products Affected</p>
                  <p className="text-2xl font-bold text-[#00897B]">{selectedProducts.length}</p>
                </CardContent>
              </Card>
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <p className="text-sm text-[#757575]">Avg Price Change</p>
                  <p className={`text-2xl font-bold ${stats.avgPriceChange >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {formatCurrency(Math.abs(stats.avgPriceChange))}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-4">
                  <p className="text-sm text-[#757575]">Update Method</p>
                  <p className="text-lg font-bold text-purple-600">{getMethodDescription()}</p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Price Change Details</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[300px]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white">
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Current Price</TableHead>
                        <TableHead className="text-right">New Price</TableHead>
                        <TableHead className="text-right">Change</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productsWithPreview
                        .filter(p => selectedProducts.includes(p.id))
                        .map((product) => {
                          const change = (product.newPrice || 0) - product.currentPrice
                          const percentChange = (change / product.currentPrice) * 100

                          return (
                            <TableRow key={product.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium text-sm">{product.name}</p>
                                  <p className="text-xs text-[#757575]">{product.sku}</p>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(product.currentPrice)}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                <span className={change >= 0 ? 'text-blue-600' : 'text-red-600'}>
                                  {formatCurrency(product.newPrice || 0)}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {change > 0 ? (
                                    <ArrowUpRight className="h-3 w-3 text-blue-600" />
                                  ) : change < 0 ? (
                                    <ArrowDownRight className="h-3 w-3 text-red-600" />
                                  ) : (
                                    <Minus className="h-3 w-3 text-gray-400" />
                                  )}
                                  <span className={`text-xs font-medium ${change >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                    {formatCurrency(Math.abs(change))} ({formatPercent(percentChange)})
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmUpdate} className="bg-[#00897B] hover:bg-[#00695C]">
              <ArrowRight className="h-4 w-4 mr-2" />
              Proceed to Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Price Update</DialogTitle>
            <DialogDescription>
              This action will update prices for {selectedProducts.length} products
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                This action cannot be undone. Please type <strong>CONFIRM</strong> to proceed.
              </AlertDescription>
            </Alert>

            <div>
              <Label>Type CONFIRM to proceed</Label>
              <Input 
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type CONFIRM"
                className="mt-2"
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#757575]">Update Method:</span>
                <span className="font-medium">{getMethodDescription()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#757575]">Products Affected:</span>
                <span className="font-medium">{selectedProducts.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#757575]">Avg Change:</span>
                <span className={`font-medium ${stats.avgPriceChange >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatCurrency(Math.abs(stats.avgPriceChange))}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button 
              onClick={handleApplyUpdate} 
              disabled={confirmText !== 'CONFIRM' || isProcessing}
              className="bg-[#00897B] hover:bg-[#00695C]"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Apply Update
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Price Update</DialogTitle>
            <DialogDescription>
              Schedule this update to run at a future date
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input 
                  type="date" 
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Time</Label>
                <Input 
                  type="time" 
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-purple-600" />
                <Label className="cursor-pointer">Recurring Update</Label>
              </div>
              <Switch
                checked={isRecurring}
                onCheckedChange={setIsRecurring}
              />
            </div>

            {isRecurring && (
              <div>
                <Label>Frequency</Label>
                <Select value={recurringFrequency} onValueChange={(v: any) => setRecurringFrequency(v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#757575]">Update Method:</span>
                <span className="font-medium">{getMethodDescription()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#757575]">Products Affected:</span>
                <span className="font-medium">{selectedProducts.length}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleScheduleUpdate} 
              disabled={!scheduleDate}
              className="bg-[#00897B] hover:bg-[#00695C]"
            >
              <Timer className="h-4 w-4 mr-2" />
              Schedule Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Detail Dialog */}
      <Dialog open={historyDetailOpen} onOpenChange={setHistoryDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Update Details</DialogTitle>
            <DialogDescription>
              {selectedHistory?.date} at {selectedHistory?.time}
            </DialogDescription>
          </DialogHeader>

          {selectedHistory && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-3">
                    <p className="text-xs text-[#757575]">Method</p>
                    <p className="font-medium">{selectedHistory.method}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <p className="text-xs text-[#757575]">By</p>
                    <p className="font-medium">{selectedHistory.user}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-[#E0F2F1]">
                  <CardContent className="p-3 text-center">
                    <p className="text-xl font-bold text-[#00897B]">{selectedHistory.affectedProducts}</p>
                    <p className="text-xs text-[#757575]">Products</p>
                  </CardContent>
                </Card>
                <Card className={selectedHistory.avgChange >= 0 ? 'bg-blue-50' : 'bg-red-50'}>
                  <CardContent className="p-3 text-center">
                    <p className={`text-xl font-bold ${selectedHistory.avgChange >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {formatCurrency(Math.abs(selectedHistory.avgChange))}
                    </p>
                    <p className="text-xs text-[#757575]">Avg Change</p>
                  </CardContent>
                </Card>
                <Card className={selectedHistory.totalChange >= 0 ? 'bg-blue-50' : 'bg-red-50'}>
                  <CardContent className="p-3 text-center">
                    <p className={`text-xl font-bold ${selectedHistory.totalChange >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {formatCurrency(Math.abs(selectedHistory.totalChange))}
                    </p>
                    <p className="text-xs text-[#757575]">Total Change</p>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Label className="text-xs text-[#757575]">Affected Products ({selectedHistory.products.length})</Label>
                <ScrollArea className="h-[150px] mt-2 border rounded-lg">
                  <div className="p-2 space-y-1">
                    {selectedHistory.products.map((productId, i) => {
                      const product = products.find(p => p.id === productId)
                      return (
                        <div key={productId} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                          <span>{product?.name || productId}</span>
                          <span className="text-[#757575]">{product?.sku}</span>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </div>

              {selectedHistory.canRevert && (
                <Alert className="bg-amber-50 border-amber-200">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-800">Revert Available</AlertTitle>
                  <AlertDescription className="text-amber-700">
                    This update can be reverted to restore previous prices.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setHistoryDetailOpen(false)}>
              Close
            </Button>
            {selectedHistory?.canRevert && (
              <Button onClick={() => handleRevert(selectedHistory)} variant="outline" className="border-amber-400 text-amber-700">
                <Undo2 className="h-4 w-4 mr-2" />
                Revert Changes
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
