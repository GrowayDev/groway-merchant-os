'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { getAllSKUs } from '../data/skuCatalog'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Search,
  Plus,
  Edit,
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  BarChart3,
  Grid,
  List,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Download,
  Scan,
  ClipboardList,
  History,
  Truck,
  PackagePlus,
  Minus,
  Coins,
  Layers,
  Calendar,
  Zap,
  Brain,
  LineChart,
  Activity,
  Target,
  Lightbulb,
  ShoppingCart,
  ArrowRight,
  Sparkles,
  Bot,
  Store,
  Link2,
  X,
  Eye,
  EyeOff,
  Trash2,
  FileText,
  Clock,
  Users,
  Save,
  ChevronRight,
  Play,
  Pause,
  Upload,
  Bell,
  BellRing,
  ArrowLeftRight,
  Building2,
  AlertCircle,
  Timer,
  Info,
  Camera,
} from 'lucide-react'
import { BulkImportModal } from './BulkImportDialog'

// Types
interface InventoryItem {
  id: string
  name: string
  category: string
  sku: string
  barcode: string
  price: number
  cost: number
  stock: number
  minStock: number
  reorderPoint: number
  reorderQty: number
  unit: string
  location: string
  batchTracked: boolean
  expiryTracked: boolean
  lastUpdated: string
  batches?: Batch[]
  velocity?: number
  daysOfStock?: number
  forecast7Days?: number
  supplier?: string
  supplierLeadTime?: number
}

interface Batch {
  batchNo: string
  qty: number
  expiry: string
  status: 'active' | 'expired' | 'expiring_soon' | 'depleted'
  receivedDate: string
  cost: number
}

interface StockMovement {
  id: string
  type: 'sale' | 'return' | 'grn' | 'adjustment' | 'transfer_in' | 'transfer_out' | 'stocktake'
  direction: 'in' | 'out'
  productName: string
  sku: string
  quantity: number
  reason?: string
  user: string
  timestamp: string
  value: number
  fromLocation?: string
  toLocation?: string
  batchNo?: string
}

interface GroSupplySuggestion {
  id: string
  productName: string
  sku: string
  currentStock: number
  suggestedOrder: number
  supplier: string
  leadTime: number
  estimatedCost: number
  reason: string
  urgency: 'critical' | 'high' | 'normal'
  savings?: number
}

interface StocktakeSession {
  id: string
  type: 'full' | 'category' | 'low_stock' | 'blind'
  status: 'pending' | 'in_progress' | 'completed'
  categoryName?: string
  items: { item: InventoryItem; systemQty: number; countedQty: number | null; notes: string }[]
  startedAt: string
  completedAt?: string
}

interface GRNItem {
  item: InventoryItem
  quantity: number
  batchNo?: string
  expiry?: string
  cost: number
}

interface StockTransfer {
  id: string
  fromLocation: string
  toLocation: string
  items: { item: InventoryItem; quantity: number; batchNo?: string }[]
  status: 'draft' | 'pending' | 'in_transit' | 'completed' | 'cancelled'
  requestedBy: string
  approvedBy?: string
  createdAt: string
  notes?: string
}

interface ReorderAlert {
  id: string
  item: InventoryItem
  type: 'out_of_stock' | 'low_stock' | 'expiring_soon' | 'reorder_point'
  message: string
  createdAt: string
  acknowledged: boolean
}

interface StockSnapshot {
  id: string
  name: string
  createdAt: string
  itemCount: number
  totalValue: number
  notes?: string
}

// Locations for transfers
const stockLocations = [
  'Main Storage',
  'Back Room',
  'Counter Area',
  'Storage A',
  'Storage B',
  'Cold Storage',
  'Display Area',
  'Safe',
  'Office',
  'Warehouse'
]

// Stock value history data
const stockValueHistory = [
  { day: 'Mon', value: 24500, trend: 'up' },
  { day: 'Tue', value: 22800, trend: 'down' },
  { day: 'Wed', value: 26100, trend: 'up' },
  { day: 'Thu', value: 25400, trend: 'down' },
  { day: 'Fri', value: 27800, trend: 'up' },
  { day: 'Sat', value: 23900, trend: 'down' },
  { day: 'Sun', value: 26500, trend: 'up' },
]

// Generate inventory from SKU catalog based on vertical/sub-vertical
const generateInventoryFromSKUs = (verticalId: string, subVerticalId: string): InventoryItem[] => {
  const skus = getAllSKUs(verticalId, subVerticalId)
  
  // Supplier pools by vertical type
  const supplierPools: Record<string, string[]> = {
    'fnb': ['Crown National', 'Clover SA', 'Coca-Cola Peninsula', 'McCain SA', 'Nestle SA', 'Albany Bakery', 'Rainbow Chicken', 'Nola Oils', 'Tiger Brands', 'Freshmark'],
    'liquor': ['Distell SA', 'Brandhouse', 'SAB Miller', 'DGB', 'KWV', 'Heineken SA', 'SA breweries'],
    'grocery': ['Shoprite DC', 'Pick n Pay DC', 'Tiger Brands', 'Clover SA', 'Nestle SA', 'Unilever SA', 'Premier Foods'],
    'health-beauty': ['Salon Supplies SA', 'L\'Oreal SA', 'Unilever SA', 'Estee Lauder', 'Generic Beauty Supply', 'Professional Hair Supply'],
    'fashion': ['The Foschini Group', 'Edcon', 'Mr Price Group', 'Truworths', 'Pepkor', 'Generic Clothing Supply'],
    'health-pharmacy': ['Pharmacy Direct', 'Unichem', 'Alpha Pharm', 'Kagiso Health', 'Generic Pharma Supply'],
    'hospitality': ['Bidvest Foodservice', 'Caterers Warehouse', 'Hotel Supplies SA', 'Brits Food Equipment'],
    'hardware': ['Builders Warehouse', 'Cashbuild', 'Chamberlains', 'Build it', 'BUCO', 'Hardware Distributors SA'],
    'electronics': ['Rectron', 'Esquire', 'Core Group', 'Miro SA', 'Drive Control Corp', 'Electronic Distributors'],
    'sport-leisure': ['Sportsmans Warehouse', 'Total Sports', 'Sports Authority SA', 'Generic Sports Supply'],
    'childcare': ['Educational Suppliers SA', 'Toy Kingdom', 'ETV Supplies', 'Generic Education Supply'],
    'professional': ['Generic Service Supply', 'Local Suppliers', 'Service Industry Supply Co'],
  }
  
  const suppliers = supplierPools[verticalId] || ['Generic Supplier']
  const locations = stockLocations.slice(0, 6)
  
  return skus.map((sku, index) => {
    const stock = Math.floor(Math.random() * 100) + (index % 5 === 0 ? 0 : 5)
    const cost = sku.price * (0.4 + Math.random() * 0.3)
    const minStock = Math.floor(Math.random() * 15) + 5
    const reorderPoint = minStock * 2
    const velocity = Math.floor(Math.random() * 30) + 5
    const isBatchTracked = index % 3 === 0
    const isExpiryTracked = index % 4 === 0
    
    // Generate batches for batch-tracked items
    const batches: Batch[] = isBatchTracked ? [
      {
        batchNo: `B${Date.now().toString().slice(-6)}-${index}`,
        qty: Math.floor(stock * 0.6),
        expiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'active',
        receivedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        cost: cost
      },
      {
        batchNo: `B${Date.now().toString().slice(-6)}-${index + 1}`,
        qty: Math.floor(stock * 0.4),
        expiry: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'expiring_soon',
        receivedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        cost: cost * 0.95
      }
    ] : undefined
    
    return {
      id: `INV-${String(index + 1).padStart(4, '0')}`,
      name: sku.name,
      category: sku.category,
      sku: `${sku.category.substring(0, 3).toUpperCase()}-${String(index + 1).padStart(3, '0')}`,
      barcode: `600${String(Math.floor(Math.random() * 10000000000)).padStart(11, '0')}`,
      price: sku.price,
      cost: Math.round(cost * 100) / 100,
      stock,
      minStock,
      reorderPoint,
      reorderQty: reorderPoint * 2,
      unit: 'unit',
      location: locations[index % locations.length],
      batchTracked: isBatchTracked,
      expiryTracked: isExpiryTracked,
      lastUpdated: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      batches,
      velocity,
      daysOfStock: stock > 0 ? Math.round((stock / velocity) * 10) / 10 : 0,
      forecast7Days: Math.round(velocity * 7 * (0.8 + Math.random() * 0.4)),
      supplier: suppliers[index % suppliers.length],
      supplierLeadTime: Math.floor(Math.random() * 5) + 1,
    }
  })
}

// Generate movements based on inventory
const generateMovementsFromInventory = (inventory: InventoryItem[]): StockMovement[] => {
  const types: StockMovement['type'][] = ['sale', 'return', 'grn', 'adjustment', 'transfer_in', 'transfer_out', 'stocktake']
  const productNames = inventory.slice(0, 5).map(i => i.name)
  const users = ['Thandi M.', 'Sipho K.', 'System', 'Johan P.', 'Maria S.', 'Peter N.']
  const reasons = ['Stock correction', 'Damaged goods', 'Theft reported', 'Found during stocktake', 'Supplier return', 'Quality issue']
  
  return Array.from({ length: 30 }, (_, i) => {
    const type = types[Math.floor(Math.random() * types.length)]
    const isOut = ['sale', 'transfer_out'].includes(type)
    const randomProduct = productNames[Math.floor(Math.random() * productNames.length)] || 'Product'
    const item = inventory.find(p => p.name === randomProduct)
    
    return {
      id: `MOV-${String(i + 1).padStart(6, '0')}`,
      type,
      direction: isOut ? 'out' : 'in',
      productName: randomProduct,
      sku: item?.sku || `SKU-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      quantity: 1 + Math.floor(Math.random() * 50),
      reason: type === 'adjustment' ? reasons[Math.floor(Math.random() * reasons.length)] : undefined,
      user: users[Math.floor(Math.random() * users.length)],
      timestamp: new Date(Date.now() - i * 3600000).toISOString(),
      value: Math.floor(Math.random() * 5000) / 100,
      fromLocation: type === 'transfer_out' ? stockLocations[Math.floor(Math.random() * 5)] : undefined,
      toLocation: type === 'transfer_in' ? stockLocations[Math.floor(Math.random() * 5)] : undefined,
      batchNo: item?.batchTracked ? `B${Date.now().toString().slice(-6)}` : undefined,
    }
  })
}

// Generate GroSupply suggestions based on inventory
const generateGroSupplySuggestionsFromInventory = (inventory: InventoryItem[]): GroSupplySuggestion[] => {
  const lowStockItems = inventory.filter(i => i.stock <= i.reorderPoint).slice(0, 4)
  
  return lowStockItems.map((item, index) => ({
    id: `GS-${String(index + 1).padStart(3, '0')}`,
    productName: item.name,
    sku: item.sku,
    currentStock: item.stock,
    suggestedOrder: item.reorderQty,
    supplier: item.supplier || 'Unknown Supplier',
    leadTime: item.supplierLeadTime || 3,
    estimatedCost: Math.round(item.reorderQty * (item.cost || item.price * 0.5) * 100) / 100,
    reason: item.stock === 0 ? 'Out of stock' : 'Below reorder point',
    urgency: item.stock === 0 ? 'critical' as const : 'high' as const,
    savings: Math.round(Math.random() * 150),
  }))
}

// Generate reorder alerts
const generateReorderAlerts = (inventory: InventoryItem[]): ReorderAlert[] => {
  const alerts: ReorderAlert[] = []
  
  inventory.forEach(item => {
    if (item.stock === 0) {
      alerts.push({
        id: `ALERT-${item.id}-OOS`,
        item,
        type: 'out_of_stock',
        message: `${item.name} is out of stock and needs immediate reorder`,
        createdAt: new Date().toISOString(),
        acknowledged: false
      })
    } else if (item.stock <= item.reorderPoint) {
      alerts.push({
        id: `ALERT-${item.id}-LOW`,
        item,
        type: 'low_stock',
        message: `${item.name} is below reorder point (${item.stock}/${item.reorderPoint})`,
        createdAt: new Date().toISOString(),
        acknowledged: false
      })
    }
    
    // Check for expiring batches
    if (item.batches) {
      item.batches.forEach(batch => {
        if (batch.status === 'expiring_soon') {
          alerts.push({
            id: `ALERT-${item.id}-${batch.batchNo}`,
            item,
            type: 'expiring_soon',
            message: `${item.name} batch ${batch.batchNo} expires on ${batch.expiry}`,
            createdAt: new Date().toISOString(),
            acknowledged: false
          })
        }
      })
    }
  })
  
  return alerts
}

// Generate stock snapshots
const generateStockSnapshots = (): StockSnapshot[] => [
  { id: 'SNAP-001', name: 'Month End - January 2026', createdAt: '2026-01-31', itemCount: 245, totalValue: 156780, notes: 'Month end stock count' },
  { id: 'SNAP-002', name: 'Quarterly Audit Q4 2025', createdAt: '2025-12-31', itemCount: 312, totalValue: 189450, notes: 'Quarterly audit' },
  { id: 'SNAP-003', name: 'Year End 2025', createdAt: '2025-12-28', itemCount: 298, totalValue: 178900 },
]

// Props interface
interface InventoryViewProps {
  verticalId?: string
  subVerticalId?: string
}

// Component
export function InventoryView({ verticalId = 'fnb', subVerticalId = 'qsr' }: InventoryViewProps) {
  // Track the current vertical/subVertical to detect changes
  const [currentVertical, setCurrentVertical] = useState(`${verticalId}-${subVerticalId}`)
  
  // Use state for mutable inventory that can be modified
  const [inventory, setInventory] = useState<InventoryItem[]>(() => generateInventoryFromSKUs(verticalId, subVerticalId))
  const [movements, setMovements] = useState<StockMovement[]>(() => generateMovementsFromInventory([]))
  const [groSupplySuggestions, setGroSupplySuggestions] = useState<GroSupplySuggestion[]>(() => generateGroSupplySuggestionsFromInventory([]))
  const [reorderAlerts, setReorderAlerts] = useState<ReorderAlert[]>(() => [])
  const [stockSnapshots] = useState<StockSnapshot[]>(() => generateStockSnapshots())
  const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>([])
  
  // Initialize/reset inventory when vertical/subVertical changes
  if (`${verticalId}-${subVerticalId}` !== currentVertical) {
    const newInventory = generateInventoryFromSKUs(verticalId, subVerticalId)
    setInventory(newInventory)
    setMovements(generateMovementsFromInventory(newInventory))
    setGroSupplySuggestions(generateGroSupplySuggestionsFromInventory(newInventory))
    setReorderAlerts(generateReorderAlerts(newInventory))
    setCurrentVertical(`${verticalId}-${subVerticalId}`)
  }
  
  const [activeTab, setActiveTab] = useState<string>('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [stockFilter, setStockFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [adjustmentOpen, setAdjustmentOpen] = useState(false)
  const [adjustmentItem, setAdjustmentItem] = useState<InventoryItem | null>(null)
  const [adjustmentQty, setAdjustmentQty] = useState(0)
  const [adjustmentReason, setAdjustmentReason] = useState('')
  const [grnOpen, setGrnOpen] = useState(false)
  const [grnScanInput, setGrnScanInput] = useState('')
  const [grnItems, setGrnItems] = useState<GRNItem[]>([])
  const [stocktakeOpen, setStocktakeOpen] = useState(false)
  const [stocktakeSession, setStocktakeSession] = useState<StocktakeSession | null>(null)
  const [stocktakeTypeSelect, setStocktakeTypeSelect] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [addProductOpen, setAddProductOpen] = useState(false)
  const [newProduct, setNewProduct] = useState<Partial<InventoryItem>>({ 
    name: '', category: '', sku: '', barcode: '', price: 0, cost: 0, stock: 0, unit: 'unit',
    minStock: 5, reorderPoint: 10, reorderQty: 20, location: '', supplier: ''
  })
  const [toast, setToast] = useState<{ show: boolean; title: string; message: string; type: 'success' | 'error' } | null>(null)
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)
  const [selectedOrderItem, setSelectedOrderItem] = useState<GroSupplySuggestion | null>(null)
  const [orderQuantity, setOrderQuantity] = useState(0)
  const [bulkImportOpen, setBulkImportOpen] = useState(false)
  
  // New state for enhanced features
  const [transferOpen, setTransferOpen] = useState(false)
  const [newTransfer, setNewTransfer] = useState<{ fromLocation: string; toLocation: string; items: { item: InventoryItem; quantity: number }[] }>({
    fromLocation: '', toLocation: '', items: []
  })
  const [batchDetailOpen, setBatchDetailOpen] = useState(false)
  const [selectedBatchItem, setSelectedBatchItem] = useState<InventoryItem | null>(null)
  const [snapshotOpen, setSnapshotOpen] = useState(false)
  const [snapshotName, setSnapshotName] = useState('')
  const [snapshotNotes, setSnapshotNotes] = useState('')

  // Computed
  const categories = ['all', ...new Set(inventory.map(i => i.category))]
  const filteredItems = useMemo(() => inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.sku.toLowerCase().includes(searchQuery.toLowerCase()) || item.barcode?.includes(searchQuery)
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
    let matchesStock = true
    if (stockFilter === 'low') matchesStock = item.stock > 0 && item.stock <= item.reorderPoint
    else if (stockFilter === 'out') matchesStock = item.stock === 0
    return matchesSearch && matchesCategory && matchesStock
  }), [inventory, searchQuery, categoryFilter, stockFilter])

  // KPIs
  const totalSKUs = inventory.length
  const totalValue = inventory.reduce((sum, i) => sum + i.cost * i.stock, 0)
  const outOfStock = inventory.filter(i => i.stock === 0).length
  const lowStock = inventory.filter(i => i.stock > 0 && i.stock <= i.reorderPoint).length
  const expiringBatches = inventory.filter(i => i.batches?.some(b => b.status === 'expiring_soon')).length
  const unacknowledgedAlerts = reorderAlerts.filter(a => !a.acknowledged).length

  // Helpers
  const getStockStatus = (item: InventoryItem) => {
    if (item.stock === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-700' }
    if (item.stock <= item.reorderPoint) return { label: 'Low Stock', color: 'bg-orange-100 text-orange-700' }
    return { label: 'In Stock', color: 'bg-green-100 text-green-700' }
  }

  const showToast = (title: string, message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, title, message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Handlers
  const handleAdjustStock = (item: InventoryItem) => {
    setAdjustmentItem(item)
    setAdjustmentQty(0)
    setAdjustmentReason('')
    setAdjustmentOpen(true)
  }

  const handleSaveAdjustment = () => {
    if (!adjustmentItem || adjustmentQty === 0) {
      showToast('Invalid Adjustment', 'Please enter a quantity adjustment', 'error')
      return
    }
    if (!adjustmentReason) {
      showToast('Reason Required', 'Please select a reason for the adjustment', 'error')
      return
    }
    
    // Update inventory
    setInventory(prev => prev.map(item => 
      item.id === adjustmentItem.id 
        ? { ...item, stock: Math.max(0, item.stock + adjustmentQty), lastUpdated: new Date().toISOString().split('T')[0] }
        : item
    ))
    
    // Add movement record
    const newMovement: StockMovement = {
      id: `MOV-${Date.now()}`,
      type: 'adjustment',
      direction: adjustmentQty > 0 ? 'in' : 'out',
      productName: adjustmentItem.name,
      sku: adjustmentItem.sku,
      quantity: Math.abs(adjustmentQty),
      reason: adjustmentReason,
      user: 'Current User',
      timestamp: new Date().toISOString(),
      value: Math.abs(adjustmentQty) * adjustmentItem.cost,
    }
    setMovements(prev => [newMovement, ...prev])
    
    // Update alerts
    setReorderAlerts(prev => generateReorderAlerts(inventory.map(i => 
      i.id === adjustmentItem.id ? { ...i, stock: Math.max(0, i.stock + adjustmentQty) } : i
    )))
    
    showToast('Stock Adjusted', `${adjustmentItem.name} adjusted by ${adjustmentQty > 0 ? '+' : ''}${adjustmentQty}`, 'success')
    setAdjustmentOpen(false)
  }

  const handleExport = () => {
    const csv = ['SKU,Name,Category,Stock,Price,Cost,Location', 
      ...filteredItems.map(i => `${i.sku},"${i.name}",${i.category},${i.stock},${i.price},${i.cost},"${i.location}"`)].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventory-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Export Complete', `${filteredItems.length} items exported to CSV`, 'success')
  }

  const handleSaveProduct = () => {
    // Validation
    if (!newProduct.name?.trim()) {
      showToast('Name Required', 'Please enter a product name', 'error')
      return
    }
    if (!newProduct.sku?.trim()) {
      showToast('SKU Required', 'Please enter a SKU', 'error')
      return
    }
    if (inventory.some(i => i.sku === newProduct.sku)) {
      showToast('Duplicate SKU', 'A product with this SKU already exists', 'error')
      return
    }
    if (!newProduct.category) {
      showToast('Category Required', 'Please select a category', 'error')
      return
    }
    if (!newProduct.price || newProduct.price <= 0) {
      showToast('Invalid Price', 'Please enter a valid selling price', 'error')
      return
    }
    
    // Create new product
    const newId = `INV-${String(inventory.length + 1).padStart(4, '0')}`
    const product: InventoryItem = {
      id: newId,
      name: newProduct.name.trim(),
      sku: newProduct.sku.trim(),
      barcode: newProduct.barcode || '',
      category: newProduct.category,
      price: newProduct.price,
      cost: newProduct.cost || 0,
      stock: newProduct.stock || 0,
      minStock: newProduct.minStock || 5,
      reorderPoint: newProduct.reorderPoint || 10,
      reorderQty: newProduct.reorderQty || 20,
      unit: newProduct.unit || 'unit',
      location: newProduct.location || '',
      batchTracked: false,
      expiryTracked: false,
      lastUpdated: new Date().toISOString().split('T')[0],
      supplier: newProduct.supplier,
      velocity: 0,
      daysOfStock: newProduct.stock && newProduct.stock > 0 ? 999 : 0,
      forecast7Days: 0,
    }
    
    setInventory(prev => [...prev, product])
    
    // Add GRN movement if stock was added
    if (product.stock > 0) {
      const movement: StockMovement = {
        id: `MOV-${Date.now()}`,
        type: 'grn',
        direction: 'in',
        productName: product.name,
        sku: product.sku,
        quantity: product.stock,
        user: 'Current User',
        timestamp: new Date().toISOString(),
        value: product.stock * product.cost,
      }
      setMovements(prev => [movement, ...prev])
    }
    
    showToast('Product Added', `${product.name} has been added successfully`, 'success')
    setAddProductOpen(false)
    setNewProduct({ name: '', category: '', sku: '', barcode: '', price: 0, cost: 0, stock: 0, unit: 'unit', minStock: 5, reorderPoint: 10, reorderQty: 20, location: '', supplier: '' })
  }

  const handleStartStocktake = (type: 'full' | 'category' | 'low_stock' | 'blind') => {
    let items: StocktakeSession['items'] = []
    
    if (type === 'full') {
      items = inventory.map(item => ({ item, systemQty: item.stock, countedQty: null, notes: '' }))
    } else if (type === 'category' && selectedCategory) {
      items = inventory.filter(i => i.category === selectedCategory).map(item => ({ item, systemQty: item.stock, countedQty: null, notes: '' }))
    } else if (type === 'low_stock') {
      items = inventory.filter(i => i.stock <= i.reorderPoint).map(item => ({ item, systemQty: item.stock, countedQty: null, notes: '' }))
    } else if (type === 'blind') {
      items = inventory.map(item => ({ item, systemQty: item.stock, countedQty: null, notes: '' }))
    }
    
    if (items.length === 0) {
      showToast('No Items', 'No items match the selected criteria', 'error')
      return
    }
    
    const session: StocktakeSession = {
      id: `ST-${Date.now()}`,
      type,
      status: 'in_progress',
      categoryName: type === 'category' ? selectedCategory : undefined,
      items,
      startedAt: new Date().toISOString(),
    }
    
    setStocktakeSession(session)
    setStocktakeTypeSelect(false)
    setStocktakeOpen(true)
  }

  const handleUpdateStocktakeCount = (index: number, countedQty: number, notes: string = '') => {
    if (!stocktakeSession) return
    setStocktakeSession(prev => {
      if (!prev) return prev
      const newItems = [...prev.items]
      newItems[index] = { ...newItems[index], countedQty, notes }
      return { ...prev, items: newItems }
    })
  }

  const handleCompleteStocktake = () => {
    if (!stocktakeSession) return
    
    const countedItems = stocktakeSession.items.filter(i => i.countedQty !== null)
    if (countedItems.length === 0) {
      showToast('No Counts', 'Please count at least one item', 'error')
      return
    }
    
    // Process variances
    const variances: { item: InventoryItem; variance: number }[] = []
    
    stocktakeSession.items.forEach(({ item, systemQty, countedQty }) => {
      if (countedQty !== null && countedQty !== systemQty) {
        const variance = countedQty - systemQty
        variances.push({ item, variance })
        
        // Update inventory
        setInventory(prev => prev.map(i => 
          i.id === item.id ? { ...i, stock: countedQty, lastUpdated: new Date().toISOString().split('T')[0] } : i
        ))
        
        // Add movement
        const movement: StockMovement = {
          id: `MOV-${Date.now()}-${item.id}`,
          type: 'stocktake',
          direction: variance > 0 ? 'in' : 'out',
          productName: item.name,
          sku: item.sku,
          quantity: Math.abs(variance),
          reason: `Stocktake variance (${stocktakeSession.type})`,
          user: 'Current User',
          timestamp: new Date().toISOString(),
          value: Math.abs(variance) * item.cost,
        }
        setMovements(prev => [movement, ...prev])
      }
    })
    
    showToast('Stocktake Complete', `${countedItems.length} items counted, ${variances.length} variances found`, 'success')
    setStocktakeSession(null)
    setStocktakeOpen(false)
    setSelectedCategory('')
  }

  const handleCancelStocktake = () => {
    setStocktakeSession(null)
    setStocktakeOpen(false)
    setStocktakeTypeSelect(false)
    setSelectedCategory('')
    showToast('Stocktake Cancelled', 'Stocktake session has been cancelled', 'success')
  }

  // GRN Handlers
  const handleGrnScan = () => {
    const input = grnScanInput.trim()
    if (!input) return
    
    // Find item by barcode or SKU
    const item = inventory.find(i => i.barcode === input || i.sku === input)
    if (!item) {
      showToast('Not Found', `No product found for: ${input}`, 'error')
      setGrnScanInput('')
      return
    }
    
    // Check if already in list
    const existingIndex = grnItems.findIndex(g => g.item.id === item.id)
    if (existingIndex >= 0) {
      // Increase quantity
      setGrnItems(prev => prev.map((g, i) => 
        i === existingIndex ? { ...g, quantity: g.quantity + 1 } : g
      ))
    } else {
      // Add new
      setGrnItems(prev => [...prev, { item, quantity: 1, cost: item.cost }])
    }
    
    setGrnScanInput('')
    showToast('Item Added', `${item.name} added to GRN`, 'success')
  }

  const handleUpdateGrnItem = (index: number, field: 'quantity' | 'batchNo' | 'expiry' | 'cost', value: string | number) => {
    setGrnItems(prev => prev.map((g, i) => 
      i === index ? { ...g, [field]: value } : g
    ))
  }

  const handleRemoveGrnItem = (index: number) => {
    setGrnItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleCompleteGrn = () => {
    if (grnItems.length === 0) {
      showToast('No Items', 'Please add items to the GRN', 'error')
      return
    }
    
    // Update inventory and create movements
    grnItems.forEach(({ item, quantity, cost, batchNo, expiry }) => {
      setInventory(prev => prev.map(i => {
        if (i.id === item.id) {
          // Add batch if batch tracking enabled
          let newBatches = i.batches || []
          if (i.batchTracked && batchNo) {
            newBatches = [...newBatches, {
              batchNo,
              qty: quantity,
              expiry: expiry || '',
              status: 'active' as const,
              receivedDate: new Date().toISOString().split('T')[0],
              cost
            }]
          }
          return { 
            ...i, 
            stock: i.stock + quantity, 
            lastUpdated: new Date().toISOString().split('T')[0], 
            cost,
            batches: newBatches
          }
        }
        return i
      }))
      
      const movement: StockMovement = {
        id: `MOV-${Date.now()}-${item.id}`,
        type: 'grn',
        direction: 'in',
        productName: item.name,
        sku: item.sku,
        quantity,
        user: 'Current User',
        timestamp: new Date().toISOString(),
        value: quantity * cost,
        batchNo,
      }
      setMovements(prev => [movement, ...prev])
    })
    
    const totalValue = grnItems.reduce((sum, g) => sum + g.quantity * g.cost, 0)
    showToast('GRN Complete', `${grnItems.length} items received (R${totalValue.toFixed(2)})`, 'success')
    setGrnItems([])
    setGrnOpen(false)
  }

  // GroSupply Order Handlers
  const handleOpenOrderDialog = (suggestion: GroSupplySuggestion) => {
    setSelectedOrderItem(suggestion)
    setOrderQuantity(suggestion.suggestedOrder)
    setOrderDialogOpen(true)
  }

  const handleCreateOrder = async () => {
    if (!selectedOrderItem) return
    if (orderQuantity <= 0) {
      showToast('Invalid Quantity', 'Please enter a valid order quantity', 'error')
      return
    }
    
    try {
      // Get session for merchant ID
      const sessionStr = localStorage.getItem('groway_session')
      const session = sessionStr ? JSON.parse(sessionStr) : null
      
      // Find supplier ID from name
      const suppliers = await fetch('/merchant-os/api/grosupply/suppliers?limit=100').then(r => r.json())
      const supplier = suppliers.suppliers?.find((s: any) => s.name === selectedOrderItem.supplier)
      
      // Create purchase order via API
      const response = await fetch('/merchant-os/api/grosupply/po', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: supplier?.id,
          status: 'draft',
          items: [{
            sku: selectedOrderItem.sku,
            description: selectedOrderItem.productName,
            quantity: orderQuantity,
            unitPrice: selectedOrderItem.estimatedCost / orderQuantity,
            totalPrice: selectedOrderItem.estimatedCost,
            unit: 'each'
          }],
          notes: `Auto-generated from low stock alert - ${selectedOrderItem.reason}`,
          createdBy: session?.userId
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        
        // Remove from suggestions
        setGroSupplySuggestions(prev => prev.filter(s => s.id !== selectedOrderItem.id))
        
        showToast('Order Created', `PO ${result.purchaseOrder?.number || 'created'} for ${selectedOrderItem.productName} (${orderQuantity} units)`, 'success')
      } else {
        throw new Error('Failed to create PO')
      }
    } catch (error) {
      console.error('Error creating order:', error)
      showToast('Order Failed', 'Could not create purchase order. Please try again.', 'error')
    }
    
    setOrderDialogOpen(false)
    setSelectedOrderItem(null)
  }

  const handleCreateAllOrders = async () => {
    const totalItems = groSupplySuggestions.length
    const totalValue = groSupplySuggestions.reduce((sum, s) => sum + s.estimatedCost, 0)
    
    try {
      // Get session for merchant ID
      const sessionStr = localStorage.getItem('groway_session')
      const session = sessionStr ? JSON.parse(sessionStr) : null
      
      // Group suggestions by supplier
      const bySupplier: Record<string, GroSupplySuggestion[]> = {}
      groSupplySuggestions.forEach(s => {
        if (!bySupplier[s.supplier]) bySupplier[s.supplier] = []
        bySupplier[s.supplier].push(s)
      })
      
      let successCount = 0
      
      // Create one PO per supplier
      for (const [supplierName, items] of Object.entries(bySupplier)) {
        const suppliers = await fetch('/merchant-os/api/grosupply/suppliers?limit=100').then(r => r.json())
        const supplier = suppliers.suppliers?.find((s: any) => s.name === supplierName)
        
        const response = await fetch('/merchant-os/api/grosupply/po', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            supplierId: supplier?.id,
            status: 'draft',
            items: items.map(item => ({
              sku: item.sku,
              description: item.productName,
              quantity: item.suggestedOrder,
              unitPrice: item.estimatedCost / item.suggestedOrder,
              totalPrice: item.estimatedCost,
              unit: 'each'
            })),
            notes: 'Bulk reorder from low stock alerts',
            createdBy: session?.userId
          })
        })
        
        if (response.ok) successCount++
      }
      
      setGroSupplySuggestions([])
      showToast('Orders Created', `${successCount} purchase orders created (R${totalValue.toFixed(2)})`, 'success')
    } catch (error) {
      console.error('Error creating orders:', error)
      showToast('Orders Failed', 'Could not create some purchase orders.', 'error')
    }
  }

  // Bulk Import Handler
  const handleBulkImport = (products: any[]) => {
    products.forEach((product, i) => {
      const newId = `INV-${String(inventory.length + i + 1).padStart(4, '0')}`
      const newItem: InventoryItem = {
        id: newId,
        name: product.name,
        sku: product.sku,
        barcode: product.barcode || '',
        category: product.category,
        price: product.sellingPrice,
        cost: product.costPrice,
        stock: product.stock || 0,
        minStock: product.minStock || 5,
        reorderPoint: (product.minStock || 5) * 2,
        reorderQty: (product.minStock || 5) * 4,
        unit: product.unit || 'unit',
        location: product.location || '',
        batchTracked: false,
        expiryTracked: false,
        lastUpdated: new Date().toISOString().split('T')[0],
        supplier: product.supplier,
        velocity: 0,
        daysOfStock: product.stock && product.stock > 0 ? 999 : 0,
        forecast7Days: 0,
      }
      setInventory(prev => [...prev, newItem])
    })
    
    showToast('Import Complete', `${products.length} products imported successfully`, 'success')
  }

  // Stock Transfer Handlers
  const handleAddTransferItem = (item: InventoryItem) => {
    setNewTransfer(prev => ({
      ...prev,
      items: [...prev.items, { item, quantity: 1 }]
    }))
  }

  const handleUpdateTransferQty = (index: number, quantity: number) => {
    setNewTransfer(prev => ({
      ...prev,
      items: prev.items.map((it, i) => i === index ? { ...it, quantity } : it)
    }))
  }

  const handleRemoveTransferItem = (index: number) => {
    setNewTransfer(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const handleCreateTransfer = () => {
    if (!newTransfer.fromLocation || !newTransfer.toLocation) {
      showToast('Locations Required', 'Please select both from and to locations', 'error')
      return
    }
    if (newTransfer.fromLocation === newTransfer.toLocation) {
      showToast('Invalid Transfer', 'Source and destination cannot be the same', 'error')
      return
    }
    if (newTransfer.items.length === 0) {
      showToast('No Items', 'Please add items to transfer', 'error')
      return
    }
    
    const transfer: StockTransfer = {
      id: `TRF-${Date.now()}`,
      fromLocation: newTransfer.fromLocation,
      toLocation: newTransfer.toLocation,
      items: newTransfer.items,
      status: 'pending',
      requestedBy: 'Current User',
      createdAt: new Date().toISOString(),
    }
    
    setStockTransfers(prev => [...prev, transfer])
    
    // Add movements for transfer
    newTransfer.items.forEach(({ item, quantity }) => {
      const movement: StockMovement = {
        id: `MOV-${Date.now()}-${item.id}`,
        type: 'transfer_out',
        direction: 'out',
        productName: item.name,
        sku: item.sku,
        quantity,
        user: 'Current User',
        timestamp: new Date().toISOString(),
        value: quantity * item.cost,
        fromLocation: newTransfer.fromLocation,
        toLocation: newTransfer.toLocation,
      }
      setMovements(prev => [movement, ...prev])
    })
    
    showToast('Transfer Created', `Stock transfer from ${newTransfer.fromLocation} to ${newTransfer.toLocation}`, 'success')
    setNewTransfer({ fromLocation: '', toLocation: '', items: [] })
    setTransferOpen(false)
  }

  // Alert handlers
  const handleAcknowledgeAlert = (alertId: string) => {
    setReorderAlerts(prev => prev.map(a => 
      a.id === alertId ? { ...a, acknowledged: true } : a
    ))
  }

  // Snapshot handler
  const handleCreateSnapshot = () => {
    if (!snapshotName.trim()) {
      showToast('Name Required', 'Please enter a name for the snapshot', 'error')
      return
    }
    showToast('Snapshot Created', `Stock snapshot "${snapshotName}" has been saved`, 'success')
    setSnapshotOpen(false)
    setSnapshotName('')
    setSnapshotNotes('')
  }

  // Stock Value Trend Graph
  const renderStockValueGraph = () => {
    const maxValue = Math.max(...stockValueHistory.map(h => h.value))
    const minValue = Math.min(...stockValueHistory.map(h => h.value))
    const avgValue = stockValueHistory.reduce((s, h) => s + h.value, 0) / stockValueHistory.length
    const lastValue = stockValueHistory[stockValueHistory.length - 1].value
    const prevValue = stockValueHistory[stockValueHistory.length - 2].value
    const changePercent = ((lastValue - prevValue) / prevValue * 100).toFixed(1)
    const isUp = lastValue > prevValue

    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Stock Value Trend</CardTitle>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium flex items-center gap-1 ${isUp ? 'text-green-600' : 'text-red-600'}`}>
                {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {changePercent}%
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-2xl font-bold">R{lastValue.toLocaleString()}</span>
            <span className="text-xs text-[#757575]">current value</span>
          </div>
          
          <div className="relative h-40">
            <svg className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="stockGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#00897B" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#00897B" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d={`M 0 ${140 - ((stockValueHistory[0].value - minValue) / (maxValue - minValue)) * 130}
                  ${stockValueHistory.map((h, i) => {
                    const x = (i / (stockValueHistory.length - 1)) * 100
                    const y = 140 - ((h.value - minValue) / (maxValue - minValue)) * 130
                    return `L ${x} ${y}`
                  }).join(' ')}
                  L 100 140 L 0 140 Z`}
                fill="url(#stockGradient)"
              />
              <path
                d={`M 0 ${140 - ((stockValueHistory[0].value - minValue) / (maxValue - minValue)) * 130}
                  ${stockValueHistory.map((h, i) => {
                    const x = (i / (stockValueHistory.length - 1)) * 100
                    const y = 140 - ((h.value - minValue) / (maxValue - minValue)) * 130
                    return `L ${x} ${y}`
                  }).join(' ')}`}
                fill="none"
                stroke="#00897B"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
              {stockValueHistory.map((h, i) => {
                const x = (i / (stockValueHistory.length - 1)) * 100
                const y = 140 - ((h.value - minValue) / (maxValue - minValue)) * 130
                return <circle key={i} cx={`${x}%`} cy={y} r="4" fill="#00897B" />
              })}
            </svg>
          </div>
          
          <div className="flex justify-between mt-2 text-xs text-[#757575]">
            {stockValueHistory.map(h => <span key={h.day}>{h.day}</span>)}
          </div>
          
          <div className="flex justify-between mt-4 pt-4 border-t text-center">
            <div>
              <p className="text-lg font-bold text-[#00897B]">R{avgValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              <p className="text-[10px] text-[#757575]">Avg Value</p>
            </div>
            <div>
              <p className="text-lg font-bold">R{minValue.toLocaleString()}</p>
              <p className="text-[10px] text-[#757575]">Low</p>
            </div>
            <div>
              <p className="text-lg font-bold">R{maxValue.toLocaleString()}</p>
              <p className="text-[10px] text-[#757575]">High</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render Dashboard
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-7 gap-4">
        <Card className="border-l-4 border-l-[#00897B]">
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Total SKUs</p>
            <p className="text-xl font-bold">{totalSKUs}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Stock Value</p>
            <p className="text-xl font-bold">R{totalValue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Out of Stock</p>
            <p className="text-xl font-bold text-red-500">{outOfStock}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Low Stock</p>
            <p className="text-xl font-bold text-orange-500">{lowStock}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Expiring Soon</p>
            <p className="text-xl font-bold text-amber-500">{expiringBatches}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setActiveTab('alerts')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575]">Active Alerts</p>
                <p className="text-xl font-bold text-red-600">{unacknowledgedAlerts}</p>
              </div>
              {unacknowledgedAlerts > 0 && <BellRing className="h-5 w-5 text-red-500 animate-pulse" />}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Units Out Today</p>
            <p className="text-xl font-bold text-blue-600">156</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 flex-wrap">
        <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setAddProductOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />Add Product
        </Button>
        <Button variant="outline" onClick={() => setBulkImportOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />Bulk Import
        </Button>
        <Button variant="outline" onClick={() => setGrnOpen(true)}>
          <Truck className="h-4 w-4 mr-2" />Receive Stock
        </Button>
        <Button variant="outline" onClick={() => setStocktakeTypeSelect(true)}>
          <ClipboardList className="h-4 w-4 mr-2" />New Stocktake
        </Button>
        <Button variant="outline" onClick={() => setTransferOpen(true)}>
          <ArrowLeftRight className="h-4 w-4 mr-2" />Transfer Stock
        </Button>
        <Button variant="outline" onClick={() => setActiveTab('alerts')}>
          <Bell className="h-4 w-4 mr-2" />Alerts {unacknowledgedAlerts > 0 && `(${unacknowledgedAlerts})`}
        </Button>
        <Button variant="outline" onClick={() => setActiveTab('grosupply')}>
          <Store className="h-4 w-4 mr-2" />Order from GroSupply
        </Button>
        <Button variant="outline" onClick={() => setActiveTab('groai')}>
          <Brain className="h-4 w-4 mr-2" />Gro AI
        </Button>
      </div>

      {/* Fast Movers & Needs Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />Top Fast Movers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[...inventory].sort((a, b) => (b.velocity || 0) - (a.velocity || 0)).slice(0, 5).map((item, i) => (
              <div key={item.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer" onClick={() => setSelectedItem(item)}>
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-600">{i + 1}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-[#757575]">{item.velocity}/day • {item.daysOfStock?.toFixed(1)} days left</p>
                </div>
                <p className="text-sm font-semibold">{item.stock}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {inventory.filter(i => i.stock <= i.reorderPoint).slice(0, 5).map(item => (
              <div key={item.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer" onClick={() => setSelectedItem(item)}>
                <Badge className={getStockStatus(item).color}>{getStockStatus(item).label}</Badge>
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-[#757575]">{item.stock}/{item.reorderPoint}</p>
                </div>
                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setActiveTab('grosupply') }}>Order</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // Render Products
  const renderProducts = () => (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
          <Input placeholder="Search products..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            {categories.map(c => <SelectItem key={c} value={c}>{c === 'all' ? 'All Categories' : c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={stockFilter} onValueChange={setStockFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Stock" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stock</SelectItem>
            <SelectItem value="low">Low Stock</SelectItem>
            <SelectItem value="out">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}>
          {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
        </Button>
        <Button variant="outline" onClick={handleExport}><Download className="h-4 w-4 mr-2" />Export</Button>
        <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setAddProductOpen(true)}><Plus className="h-4 w-4 mr-2" />Add Product</Button>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map(item => (
            <Card key={item.id} className="cursor-pointer hover:shadow-md transition-all" onClick={() => setSelectedItem(item)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-[#757575]">{item.sku}</p>
                  </div>
                  <Badge className={getStockStatus(item).color}>{getStockStatus(item).label}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold">R{item.price.toFixed(2)}</p>
                    <p className="text-xs text-[#757575]">{item.stock} in stock • {item.category}</p>
                  </div>
                  {item.batchTracked && <Layers className="h-4 w-4 text-blue-500" title="Batch tracked" />}
                </div>
                {item.batches && item.batches.length > 0 && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-[10px] text-[#757575]">{item.batches.length} batch(es) • Next expiry: {item.batches.sort((a, b) => new Date(a.expiry).getTime() - new Date(b.expiry).getTime())[0]?.expiry}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-300px)]">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">SKU</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Stock</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-[#757575]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredItems.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedItem(item)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {item.batchTracked && <Layers className="h-4 w-4 text-blue-500" />}
                          <span className="font-medium">{item.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{item.sku}</td>
                      <td className="px-4 py-3 text-sm">{item.category}</td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${item.stock === 0 ? 'text-red-500' : item.stock <= item.reorderPoint ? 'text-orange-500' : ''}`}>
                          {item.stock}
                        </span>
                        <span className="text-xs text-[#757575]"> / {item.reorderPoint}</span>
                      </td>
                      <td className="px-4 py-3 font-medium">R{item.price.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <Badge className={getStockStatus(item).color}>{getStockStatus(item).label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleAdjustStock(item) }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )

  // Render Movements (Stock Adjustment History)
  const renderMovements = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-bold">Stock Movement History</h2>
        <div className="flex gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="sale">Sales</SelectItem>
              <SelectItem value="grn">GRN</SelectItem>
              <SelectItem value="adjustment">Adjustments</SelectItem>
              <SelectItem value="transfer">Transfers</SelectItem>
              <SelectItem value="stocktake">Stocktake</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />Export
          </Button>
        </div>
      </div>

      {/* Movement Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-green-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{movements.filter(m => m.direction === 'in').reduce((s, m) => s + m.quantity, 0)}</p>
            <p className="text-xs text-green-600">Units In (Today)</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{movements.filter(m => m.direction === 'out').reduce((s, m) => s + m.quantity, 0)}</p>
            <p className="text-xs text-red-600">Units Out (Today)</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{movements.filter(m => m.type === 'adjustment').length}</p>
            <p className="text-xs text-blue-600">Adjustments</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{movements.filter(m => m.type === 'transfer_out' || m.type === 'transfer_in').length}</p>
            <p className="text-xs text-purple-600">Transfers</p>
          </CardContent>
        </Card>
      </div>

      {/* Movement List */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-400px)]">
            <div className="divide-y">
              {movements.map(movement => {
                const typeColors: Record<string, string> = {
                  sale: 'text-blue-600',
                  return: 'text-green-600',
                  grn: 'text-green-600',
                  adjustment: 'text-orange-600',
                  transfer_in: 'text-purple-600',
                  transfer_out: 'text-purple-600',
                  stocktake: 'text-cyan-600',
                }
                const typeIcons: Record<string, React.ReactNode> = {
                  sale: <ArrowDownRight className="h-4 w-4" />,
                  return: <ArrowUpRight className="h-4 w-4" />,
                  grn: <Truck className="h-4 w-4" />,
                  adjustment: <Edit className="h-4 w-4" />,
                  transfer_in: <ArrowLeftRight className="h-4 w-4" />,
                  transfer_out: <ArrowLeftRight className="h-4 w-4" />,
                  stocktake: <ClipboardList className="h-4 w-4" />,
                }
                return (
                  <div key={movement.id} className="p-4 hover:bg-gray-50 flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${movement.direction === 'in' ? 'bg-green-100' : 'bg-red-100'} ${typeColors[movement.type]}`}>
                      {typeIcons[movement.type]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{movement.productName}</p>
                        <span className="text-xs text-[#757575]">{movement.sku}</span>
                        {movement.batchNo && <Badge variant="outline" className="text-[10px]">{movement.batchNo}</Badge>}
                      </div>
                      <p className="text-xs text-[#757575]">
                        {movement.type.replace('_', ' ').toUpperCase()} • 
                        {movement.fromLocation && ` From: ${movement.fromLocation}`}
                        {movement.toLocation && ` To: ${movement.toLocation}`}
                        {movement.reason && ` • ${movement.reason}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${movement.direction === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                        {movement.direction === 'in' ? '+' : '-'}{movement.quantity}
                      </p>
                      <p className="text-xs text-[#757575]">R{movement.value.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{movement.user}</p>
                      <p className="text-xs text-[#757575]">{new Date(movement.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )

  // Render Alerts
  const renderAlerts = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-bold flex items-center gap-2">
          <Bell className="h-5 w-5" />Reorder & Stock Alerts
        </h2>
        <Button variant="outline" onClick={() => setReorderAlerts(prev => prev.map(a => ({ ...a, acknowledged: true })))}>
          <CheckCircle2 className="h-4 w-4 mr-2" />Acknowledge All
        </Button>
      </div>

      {/* Alert Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-red-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{reorderAlerts.filter(a => a.type === 'out_of_stock' && !a.acknowledged).length}</p>
            <p className="text-xs text-red-600">Out of Stock</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{reorderAlerts.filter(a => a.type === 'low_stock' && !a.acknowledged).length}</p>
            <p className="text-xs text-orange-600">Low Stock</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{reorderAlerts.filter(a => a.type === 'expiring_soon' && !a.acknowledged).length}</p>
            <p className="text-xs text-amber-600">Expiring Soon</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{reorderAlerts.filter(a => a.type === 'reorder_point' && !a.acknowledged).length}</p>
            <p className="text-xs text-blue-600">At Reorder Point</p>
          </CardContent>
        </Card>
      </div>

      {/* Alert List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Active Alerts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-450px)]">
            <div className="divide-y">
              {reorderAlerts.filter(a => !a.acknowledged).map(alert => {
                const alertColors: Record<string, string> = {
                  out_of_stock: 'border-red-200 bg-red-50',
                  low_stock: 'border-orange-200 bg-orange-50',
                  expiring_soon: 'border-amber-200 bg-amber-50',
                  reorder_point: 'border-blue-200 bg-blue-50',
                }
                const alertIcons: Record<string, React.ReactNode> = {
                  out_of_stock: <XCircle className="h-5 w-5 text-red-600" />,
                  low_stock: <AlertTriangle className="h-5 w-5 text-orange-600" />,
                  expiring_soon: <Clock className="h-5 w-5 text-amber-600" />,
                  reorder_point: <Target className="h-5 w-5 text-blue-600" />,
                }
                return (
                  <div key={alert.id} className={`p-4 border-l-4 ${alertColors[alert.type]}`}>
                    <div className="flex items-start gap-3">
                      {alertIcons[alert.type]}
                      <div className="flex-1">
                        <p className="font-medium text-sm">{alert.message}</p>
                        <p className="text-xs text-[#757575] mt-1">
                          SKU: {alert.item.sku} • Supplier: {alert.item.supplier} • Lead time: {alert.item.supplierLeadTime} days
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setActiveTab('grosupply')}>
                            <ShoppingCart className="h-3 w-3 mr-1" />Order Now
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleAcknowledgeAlert(alert.id)}>
                            <CheckCircle2 className="h-3 w-3 mr-1" />Acknowledge
                          </Button>
                        </div>
                      </div>
                      <Badge variant="outline">{alert.item.stock} left</Badge>
                    </div>
                  </div>
                )
              })}
              {reorderAlerts.filter(a => !a.acknowledged).length === 0 && (
                <div className="p-8 text-center text-[#757575]">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>No active alerts</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )

  // Render Batch Tracking
  const renderBatchTracking = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-bold flex items-center gap-2">
          <Layers className="h-5 w-5" />Batch Tracking & Expiry Management
        </h2>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />Export
        </Button>
      </div>

      {/* Batch Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{inventory.filter(i => i.batchTracked).length}</p>
            <p className="text-xs text-[#757575]">Batch Tracked Items</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{inventory.filter(i => i.batches && i.batches.length > 0).reduce((s, i) => s + (i.batches?.length || 0), 0)}</p>
            <p className="text-xs text-[#757575]">Active Batches</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{inventory.reduce((s, i) => s + (i.batches?.filter(b => b.status === 'expiring_soon').length || 0), 0)}</p>
            <p className="text-xs text-amber-600">Expiring Soon</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{inventory.reduce((s, i) => s + (i.batches?.filter(b => b.status === 'expired').length || 0), 0)}</p>
            <p className="text-xs text-red-600">Expired</p>
          </CardContent>
        </Card>
      </div>

      {/* Batch List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Batch Details</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-400px)]">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Batch No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Quantity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Received</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Expiry</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#757575]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {inventory.filter(i => i.batchTracked && i.batches && i.batches.length > 0).map(item => 
                  item.batches!.map((batch, idx) => (
                    <tr key={`${item.id}-${idx}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-[#757575]">{item.sku}</p>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono">{batch.batchNo}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium">{batch.qty}</span>
                        <span className="text-xs text-[#757575]"> / {item.unit}</span>
                      </td>
                      <td className="px-4 py-3 text-sm">{batch.receivedDate}</td>
                      <td className="px-4 py-3">
                        <span className={`text-sm ${batch.status === 'expired' ? 'text-red-600' : batch.status === 'expiring_soon' ? 'text-amber-600' : ''}`}>
                          {batch.expiry}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`${batch.status === 'expired' ? 'bg-red-100 text-red-700' : batch.status === 'expiring_soon' ? 'bg-amber-100 text-amber-700' : batch.status === 'depleted' ? 'bg-gray-100 text-gray-700' : 'bg-green-100 text-green-700'}`}>
                          {batch.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="ghost" onClick={() => handleAdjustStock(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                ).flat()}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )

  // Render Stock Transfers
  const renderTransfers = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-bold flex items-center gap-2">
          <ArrowLeftRight className="h-5 w-5" />Stock Transfers
        </h2>
        <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setTransferOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />New Transfer
        </Button>
      </div>

      {/* Transfer Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stockTransfers.filter(t => t.status === 'pending').length}</p>
            <p className="text-xs text-[#757575]">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stockTransfers.filter(t => t.status === 'in_transit').length}</p>
            <p className="text-xs text-blue-600">In Transit</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stockTransfers.filter(t => t.status === 'completed').length}</p>
            <p className="text-xs text-green-600">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stockTransfers.reduce((s, t) => s + t.items.reduce((is, i) => is + i.quantity, 0), 0)}</p>
            <p className="text-xs text-[#757575]">Total Units</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transfers */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Recent Transfers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {stockTransfers.length === 0 ? (
            <div className="p-8 text-center text-[#757575]">
              <ArrowLeftRight className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No stock transfers yet</p>
              <Button variant="outline" className="mt-4" onClick={() => setTransferOpen(true)}>Create Transfer</Button>
            </div>
          ) : (
            <div className="divide-y">
              {stockTransfers.map(transfer => (
                <div key={transfer.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-[#757575]" />
                        <span className="font-medium">{transfer.fromLocation}</span>
                        <ArrowRight className="h-4 w-4 text-[#757575]" />
                        <Building2 className="h-4 w-4 text-[#757575]" />
                        <span className="font-medium">{transfer.toLocation}</span>
                      </div>
                    </div>
                    <Badge className={`${transfer.status === 'completed' ? 'bg-green-100 text-green-700' : transfer.status === 'in_transit' ? 'bg-blue-100 text-blue-700' : transfer.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'}`}>
                      {transfer.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-[#757575] mt-1">
                    {transfer.items.length} items • {transfer.items.reduce((s, i) => s + i.quantity, 0)} units • {new Date(transfer.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  // Render Stock Snapshots
  const renderSnapshots = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-bold flex items-center gap-2">
          <Camera className="h-5 w-5" />Stock Snapshots
        </h2>
        <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setSnapshotOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />Create Snapshot
        </Button>
      </div>

      {/* Snapshot List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stockSnapshots.map(snapshot => (
          <Card key={snapshot.id} className="cursor-pointer hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium">{snapshot.name}</p>
                  <p className="text-xs text-[#757575]">{new Date(snapshot.createdAt).toLocaleDateString()}</p>
                </div>
                <Badge variant="outline">{snapshot.itemCount} items</Badge>
              </div>
              <p className="text-lg font-bold">R{snapshot.totalValue.toLocaleString()}</p>
              {snapshot.notes && <p className="text-xs text-[#757575] mt-2">{snapshot.notes}</p>}
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline"><Eye className="h-3 w-3 mr-1" />View</Button>
                <Button size="sm" variant="outline"><Download className="h-3 w-3 mr-1" />Export</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  // Render GroAI
  const renderGroAI = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-bold flex items-center gap-2">
          <Brain className="h-5 w-5 text-[#00897B]" />Gro AI - Inventory Intelligence
        </h2>
      </div>

      {/* AI Insights */}
      <Card className="border-l-4 border-l-[#00897B]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#00897B]" />AI-Powered Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { type: 'alert', title: 'Stock-Out Risk', description: '3 items at risk of stock-out within 3 days. Consider emergency orders.', action: 'View Items', icon: AlertTriangle },
              { type: 'opportunity', title: 'Slow-Moving Stock', description: '12 items have not sold in 30+ days. Consider markdowns.', action: 'View Report', icon: TrendingDown },
              { type: 'optimization', title: 'Order Optimization', description: 'Bulk order from Clover SA could save R2,340 this week.', action: 'Create Order', icon: Target },
              { type: 'insight', title: 'Seasonal Trend', description: 'Beverage sales up 23% this month. Increase stock levels.', action: 'Adjust Stock', icon: Lightbulb },
            ].map((insight, i) => (
              <div key={i} className={`p-4 rounded-lg border ${
                insight.type === 'alert' ? 'border-red-200 bg-red-50' :
                insight.type === 'opportunity' ? 'border-blue-200 bg-blue-50' :
                insight.type === 'optimization' ? 'border-green-200 bg-green-50' :
                'border-amber-200 bg-amber-50'
              }`}>
                <div className="flex items-start gap-3">
                  <insight.icon className={`h-5 w-5 ${
                    insight.type === 'alert' ? 'text-red-600' :
                    insight.type === 'opportunity' ? 'text-blue-600' :
                    insight.type === 'optimization' ? 'text-green-600' :
                    'text-amber-600'
                  }`} />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{insight.title}</h4>
                    <p className="text-xs text-[#757575] mt-1">{insight.description}</p>
                    <Button size="sm" variant="outline" className="mt-2 h-7 text-xs">
                      {insight.action}
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Render GroSupply
  const renderGroSupply = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-bold flex items-center gap-2">
          <Store className="h-5 w-5" />GroSupply Order Suggestions
        </h2>
        {groSupplySuggestions.length > 0 && (
          <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleCreateAllOrders}>
            <ShoppingCart className="h-4 w-4 mr-2" />Order All ({groSupplySuggestions.length})
          </Button>
        )}
      </div>

      {groSupplySuggestions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
            <p className="text-[#757575]">All stock levels are healthy. No reorder suggestions.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {groSupplySuggestions.map(suggestion => (
            <Card key={suggestion.id} className={`${suggestion.urgency === 'critical' ? 'border-red-200' : 'border-orange-200'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${suggestion.urgency === 'critical' ? 'bg-red-100' : 'bg-orange-100'}`}>
                      <AlertTriangle className={`h-5 w-5 ${suggestion.urgency === 'critical' ? 'text-red-600' : 'text-orange-600'}`} />
                    </div>
                    <div>
                      <p className="font-medium">{suggestion.productName}</p>
                      <p className="text-xs text-[#757575]">{suggestion.sku} • Current: {suggestion.currentStock}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">R{suggestion.estimatedCost.toFixed(2)}</p>
                    <p className="text-xs text-[#757575]">{suggestion.suggestedOrder} units • {suggestion.leadTime} days</p>
                  </div>
                  <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => handleOpenOrderDialog(suggestion)}>
                    Order Now
                  </Button>
                </div>
                <p className="text-xs text-[#757575] mt-2">{suggestion.reason} • Supplier: {suggestion.supplier}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )

  // Render Analytics
  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-bold">Inventory Analytics</h2>
        <Button variant="outline" onClick={handleExport}><Download className="h-4 w-4 mr-2" />Export Report</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderStockValueGraph()}
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(
                inventory.reduce((acc, item) => {
                  acc[item.category] = (acc[item.category] || 0) + 1
                  return acc
                }, {} as Record<string, number>)
              ).map(([category, count]) => (
                <div key={category} className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm">{category}</p>
                    <Progress value={(count / inventory.length) * 100} className="h-2 mt-1" />
                  </div>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[#1A1A1A] flex items-center gap-2">
              <Package className="h-5 w-5 text-[#00897B]" />
              Inventory Management
            </h1>
            <p className="text-xs text-[#757575]">Stock control, batch tracking & reorder management</p>
          </div>
          <div className="flex items-center gap-2">
            {unacknowledgedAlerts > 0 && (
              <Badge className="bg-red-100 text-red-700 animate-pulse">
                <BellRing className="h-3 w-3 mr-1" />{unacknowledgedAlerts} Alerts
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-11 bg-transparent">
            <TabsTrigger value="dashboard" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] data-[state=active]:shadow-none rounded-none text-xs">Dashboard</TabsTrigger>
            <TabsTrigger value="products" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] data-[state=active]:shadow-none rounded-none text-xs">Products</TabsTrigger>
            <TabsTrigger value="movements" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] data-[state=active]:shadow-none rounded-none text-xs">Movements</TabsTrigger>
            <TabsTrigger value="alerts" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] data-[state=active]:shadow-none rounded-none text-xs">Alerts {unacknowledgedAlerts > 0 && `(${unacknowledgedAlerts})`}</TabsTrigger>
            <TabsTrigger value="batches" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] data-[state=active]:shadow-none rounded-none text-xs">Batches</TabsTrigger>
            <TabsTrigger value="transfers" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] data-[state=active]:shadow-none rounded-none text-xs">Transfers</TabsTrigger>
            <TabsTrigger value="snapshots" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] data-[state=active]:shadow-none rounded-none text-xs">Snapshots</TabsTrigger>
            <TabsTrigger value="grosupply" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] data-[state=active]:shadow-none rounded-none text-xs">GroSupply</TabsTrigger>
            <TabsTrigger value="groai" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] data-[state=active]:shadow-none rounded-none text-xs">Gro AI</TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] data-[state=active]:shadow-none rounded-none text-xs">Analytics</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'products' && renderProducts()}
          {activeTab === 'movements' && renderMovements()}
          {activeTab === 'alerts' && renderAlerts()}
          {activeTab === 'batches' && renderBatchTracking()}
          {activeTab === 'transfers' && renderTransfers()}
          {activeTab === 'snapshots' && renderSnapshots()}
          {activeTab === 'grosupply' && renderGroSupply()}
          {activeTab === 'groai' && renderGroAI()}
          {activeTab === 'analytics' && renderAnalytics()}
        </div>
      </ScrollArea>

      {/* Stock Adjustment Dialog */}
      <Dialog open={adjustmentOpen} onOpenChange={setAdjustmentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
            <DialogDescription>Adjust stock level for {adjustmentItem?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <p className="text-sm">Current Stock:</p>
              <p className="font-bold text-lg">{adjustmentItem?.stock}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setAdjustmentQty(q => q - 1)}><Minus className="h-4 w-4" /></Button>
              <Input type="number" value={adjustmentQty} onChange={e => setAdjustmentQty(parseInt(e.target.value) || 0)} className="w-20 text-center" />
              <Button variant="outline" size="icon" onClick={() => setAdjustmentQty(q => q + 1)}><Plus className="h-4 w-4" /></Button>
              <p className="text-sm text-[#757575]">New: {Math.max(0, (adjustmentItem?.stock || 0) + adjustmentQty)}</p>
            </div>
            <Select value={adjustmentReason} onValueChange={setAdjustmentReason}>
              <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Stock correction">Stock correction</SelectItem>
                <SelectItem value="Damaged goods">Damaged goods</SelectItem>
                <SelectItem value="Theft reported">Theft reported</SelectItem>
                <SelectItem value="Found during stocktake">Found during stocktake</SelectItem>
                <SelectItem value="Supplier return">Supplier return</SelectItem>
                <SelectItem value="Quality issue">Quality issue</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustmentOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleSaveAdjustment}>Save Adjustment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* GRN Dialog */}
      <Dialog open={grnOpen} onOpenChange={setGrnOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Truck className="h-5 w-5" />Goods Received Note</DialogTitle>
            <DialogDescription>Receive stock from supplier</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Input placeholder="Scan barcode or enter SKU..." value={grnScanInput} onChange={e => setGrnScanInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleGrnScan()} className="flex-1" />
              <Button onClick={handleGrnScan}><Scan className="h-4 w-4 mr-2" />Scan</Button>
            </div>
            
            {grnItems.length > 0 && (
              <div className="border rounded-lg divide-y">
                {grnItems.map((grnItem, index) => (
                  <div key={index} className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">{grnItem.item.name}</p>
                        <p className="text-xs text-[#757575]">{grnItem.item.sku}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveGrnItem(index)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <Label className="text-[10px]">Qty</Label>
                        <Input type="number" value={grnItem.quantity} onChange={e => handleUpdateGrnItem(index, 'quantity', parseInt(e.target.value) || 0)} className="h-8" />
                      </div>
                      <div>
                        <Label className="text-[10px]">Cost</Label>
                        <Input type="number" value={grnItem.cost} onChange={e => handleUpdateGrnItem(index, 'cost', parseFloat(e.target.value) || 0)} className="h-8" />
                      </div>
                      {grnItem.item.batchTracked && (
                        <>
                          <div>
                            <Label className="text-[10px]">Batch No</Label>
                            <Input value={grnItem.batchNo || ''} onChange={e => handleUpdateGrnItem(index, 'batchNo', e.target.value)} className="h-8" placeholder="B12345" />
                          </div>
                          <div>
                            <Label className="text-[10px]">Expiry</Label>
                            <Input type="date" value={grnItem.expiry || ''} onChange={e => handleUpdateGrnItem(index, 'expiry', e.target.value)} className="h-8" />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setGrnItems([]); setGrnOpen(false) }}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleCompleteGrn}><CheckCircle2 className="h-4 w-4 mr-2" />Complete GRN</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Transfer Dialog */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ArrowLeftRight className="h-5 w-5" />Stock Transfer</DialogTitle>
            <DialogDescription>Transfer stock between locations</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>From Location</Label>
                <Select value={newTransfer.fromLocation} onValueChange={v => setNewTransfer(prev => ({ ...prev, fromLocation: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                  <SelectContent>
                    {stockLocations.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>To Location</Label>
                <Select value={newTransfer.toLocation} onValueChange={v => setNewTransfer(prev => ({ ...prev, toLocation: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select destination" /></SelectTrigger>
                  <SelectContent>
                    {stockLocations.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {newTransfer.items.length > 0 && (
              <div className="border rounded-lg divide-y">
                {newTransfer.items.map((item, index) => (
                  <div key={index} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.item.name}</p>
                      <p className="text-xs text-[#757575]">{item.item.sku} • Stock: {item.item.stock}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input type="number" value={item.quantity} onChange={e => handleUpdateTransferQty(index, parseInt(e.target.value) || 0)} className="w-20 h-8" />
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveTransferItem(index)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div>
              <Label>Add Items</Label>
              <Select onValueChange={v => {
                const item = inventory.find(i => i.id === v)
                if (item) handleAddTransferItem(item)
              }}>
                <SelectTrigger><SelectValue placeholder="Search and add products..." /></SelectTrigger>
                <SelectContent>
                  {inventory.filter(i => !newTransfer.items.find(t => t.item.id === i.id)).map(item => (
                    <SelectItem key={item.id} value={item.id}>{item.name} ({item.stock} in stock)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setNewTransfer({ fromLocation: '', toLocation: '', items: [] }); setTransferOpen(false) }}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleCreateTransfer}><CheckCircle2 className="h-4 w-4 mr-2" />Create Transfer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stocktake Type Select Dialog */}
      <Dialog open={stocktakeTypeSelect} onOpenChange={setStocktakeTypeSelect}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5" />Start Stocktake</DialogTitle>
            <DialogDescription>Choose the type of stocktake</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button variant="outline" className="h-20 flex-col" onClick={() => handleStartStocktake('full')}>
              <Package className="h-6 w-6 mb-1" />
              <span className="text-sm">Full Stocktake</span>
              <span className="text-[10px] text-[#757575]">All items</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col" onClick={() => handleStartStocktake('category')}>
              <Layers className="h-6 w-6 mb-1" />
              <span className="text-sm">By Category</span>
              <span className="text-[10px] text-[#757575]">Select category</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col" onClick={() => handleStartStocktake('low_stock')}>
              <AlertTriangle className="h-6 w-6 mb-1" />
              <span className="text-sm">Low Stock Only</span>
              <span className="text-[10px] text-[#757575]">Below reorder point</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col" onClick={() => handleStartStocktake('blind')}>
              <EyeOff className="h-6 w-6 mb-1" />
              <span className="text-sm">Blind Count</span>
              <span className="text-[10px] text-[#757575]">No system qty shown</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stocktake Session Dialog */}
      <Dialog open={stocktakeOpen} onOpenChange={setStocktakeOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Stocktake - {stocktakeSession?.type.replace('_', ' ')}
              {stocktakeSession?.categoryName && `: ${stocktakeSession.categoryName}`}
            </DialogTitle>
            <DialogDescription>
              Started: {stocktakeSession?.startedAt ? new Date(stocktakeSession.startedAt).toLocaleString() : ''} • 
              {stocktakeSession?.items.filter(i => i.countedQty !== null).length || 0} / {stocktakeSession?.items.length || 0} counted
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            <div className="space-y-2">
              {stocktakeSession?.items.map((entry, index) => {
                const variance = entry.countedQty !== null ? entry.countedQty - entry.systemQty : null
                return (
                  <div key={index} className={`p-3 border rounded-lg ${entry.countedQty !== null && variance !== 0 ? 'border-orange-200 bg-orange-50' : ''}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">{entry.item.name}</p>
                        <p className="text-xs text-[#757575]">{entry.item.sku} • {entry.item.category}</p>
                      </div>
                      {stocktakeSession.type !== 'blind' && (
                        <p className="text-sm">System: <span className="font-medium">{entry.systemQty}</span></p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        placeholder="Count"
                        value={entry.countedQty ?? ''}
                        onChange={e => handleUpdateStocktakeCount(index, parseInt(e.target.value) || 0)}
                        className="w-24"
                      />
                      {variance !== null && (
                        <span className={`text-sm font-medium ${variance > 0 ? 'text-green-600' : variance < 0 ? 'text-red-600' : 'text-[#757575]'}`}>
                          {variance > 0 ? '+' : ''}{variance}
                        </span>
                      )}
                      <Input
                        placeholder="Notes..."
                        value={entry.notes}
                        onChange={e => handleUpdateStocktakeCount(index, entry.countedQty ?? 0, e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelStocktake}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleCompleteStocktake}><CheckCircle2 className="h-4 w-4 mr-2" />Complete Stocktake</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Product Dialog */}
      <Dialog open={addProductOpen} onOpenChange={setAddProductOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>Add a new product to your inventory</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <Label>Product Name *</Label>
              <Input value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} placeholder="Enter product name" />
            </div>
            <div>
              <Label>SKU *</Label>
              <Input value={newProduct.sku} onChange={e => setNewProduct(p => ({ ...p, sku: e.target.value }))} placeholder="SKU-001" />
            </div>
            <div>
              <Label>Barcode</Label>
              <Input value={newProduct.barcode} onChange={e => setNewProduct(p => ({ ...p, barcode: e.target.value }))} placeholder="600..." />
            </div>
            <div>
              <Label>Category *</Label>
              <Select value={newProduct.category} onValueChange={v => setNewProduct(p => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {[...new Set(inventory.map(i => i.category))].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Supplier</Label>
              <Input value={newProduct.supplier} onChange={e => setNewProduct(p => ({ ...p, supplier: e.target.value }))} placeholder="Supplier name" />
            </div>
            <div>
              <Label>Selling Price (R) *</Label>
              <Input type="number" value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div>
              <Label>Cost Price (R)</Label>
              <Input type="number" value={newProduct.cost} onChange={e => setNewProduct(p => ({ ...p, cost: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div>
              <Label>Initial Stock</Label>
              <Input type="number" value={newProduct.stock} onChange={e => setNewProduct(p => ({ ...p, stock: parseInt(e.target.value) || 0 }))} />
            </div>
            <div>
              <Label>Location</Label>
              <Select value={newProduct.location} onValueChange={v => setNewProduct(p => ({ ...p, location: v }))}>
                <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent>
                  {stockLocations.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Min Stock</Label>
              <Input type="number" value={newProduct.minStock} onChange={e => setNewProduct(p => ({ ...p, minStock: parseInt(e.target.value) || 5 }))} />
            </div>
            <div>
              <Label>Reorder Point</Label>
              <Input type="number" value={newProduct.reorderPoint} onChange={e => setNewProduct(p => ({ ...p, reorderPoint: parseInt(e.target.value) || 10 }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddProductOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleSaveProduct}>Save Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
            <DialogDescription>Order from {selectedOrderItem?.supplier}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <p className="font-medium">{selectedOrderItem?.productName}</p>
              <p className="text-sm text-[#757575]">{selectedOrderItem?.sku}</p>
            </div>
            <div>
              <Label>Quantity</Label>
              <Input type="number" value={orderQuantity} onChange={e => setOrderQuantity(parseInt(e.target.value) || 0)} />
            </div>
            <div className="flex justify-between text-sm">
              <span>Estimated Cost:</span>
              <span className="font-bold">R{((selectedOrderItem?.estimatedCost || 0) / (selectedOrderItem?.suggestedOrder || 1) * orderQuantity).toFixed(2)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOrderDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleCreateOrder}>Create Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Snapshot Dialog */}
      <Dialog open={snapshotOpen} onOpenChange={setSnapshotOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Stock Snapshot</DialogTitle>
            <DialogDescription>Save current inventory state for future reference</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Snapshot Name</Label>
              <Input value={snapshotName} onChange={e => setSnapshotName(e.target.value)} placeholder="e.g., Month End Stock" />
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea value={snapshotNotes} onChange={e => setSnapshotNotes(e.target.value)} placeholder="Add any notes..." />
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{inventory.length}</p>
                <p className="text-xs text-[#757575]">Items</p>
              </div>
              <div>
                <p className="text-2xl font-bold">R{totalValue.toLocaleString()}</p>
                <p className="text-xs text-[#757575]">Total Value</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSnapshotOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleCreateSnapshot}>Create Snapshot</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Dialog */}
      <BulkImportModal open={bulkImportOpen} onOpenChange={setBulkImportOpen} onImport={handleBulkImport} />

      {/* Toast */}
      {toast?.show && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 ${toast.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-red-600" />}
            <div>
              <p className="font-medium text-sm">{toast.title}</p>
              <p className="text-xs text-[#757575]">{toast.message}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
