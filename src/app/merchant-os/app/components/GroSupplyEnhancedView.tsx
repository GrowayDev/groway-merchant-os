'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { 
  Package,
  ShoppingCart,
  FileText,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Search,
  Plus,
  ChevronRight,
  CreditCard,
  Building2,
  ArrowRight,
  RefreshCw,
  BarChart3,
  Bot,
  Lightbulb,
  Target,
  Zap,
  Brain,
  ArrowUpRight,
  ArrowDownRight,
  Timer,
  BoxIcon,
  Sparkles,
  Send,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Download,
  Upload,
  Bell,
  Star,
  AlertTriangle,
  Info,
  X,
  Save,
  MessageSquare,
  Calculator,
  PiggyBank,
  Award,
  Users,
  MapPin,
  Phone,
  Mail,
  Globe,
  FileSpreadsheet,
  Percent,
  Activity,
  Layers,
  Grid3X3,
  ScanLine,
  Loader2,
} from 'lucide-react'

// ============================================
// TYPES
// ============================================

interface Supplier {
  id: string
  name: string
  tier: string
  supplierType: string
  rating: number
  reviewCount: number
  verificationStatus: string
  bbbeeLevel: number
  categories: string[]
  city: string
  province: string
  phone: string
  email: string
  deliveryDays: number
  fulfillmentRate: number
  paymentTerms: string
  minOrderValue: number
  status: string
  _count?: {
    PurchaseOrder: number
    SupplierQuote: number
    RFQ: number
  }
}

interface CatalogProduct {
  id: string
  sku: string
  description: string
  category: string
  subCategory: string | null
  brand: string | null
  packSize: string
  unit: string
  costPrice: number
  retailPrice: number
  vatRate: number
  minOrderQty: number
  leadDays: number
  inStock: boolean
  vertical: string
  supplierId: string | null
  wholesalerId: string | null
  Supplier?: { name: string; tier: string } | null
  Wholesaler?: { name: string; code: string } | null
}

interface PurchaseOrderItem {
  id: string
  sku: string
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
  unit: string
  receivedQty: number
}

interface PurchaseOrder {
  id: string
  number: string
  supplierId: string
  status: string
  subtotal: number
  vat: number
  deliveryCost: number
  total: number
  deliveryAddress: string | null
  requestedDate: string | null
  trackingNumber: string | null
  estimatedDelivery: string | null
  notes: string | null
  createdAt: string
  supplier: { id: string; name: string; tier: string } | null
  items: PurchaseOrderItem[]
  _count?: { items: number; grns: number }
}

interface GroAIInsight {
  id: string
  type: 'opportunity' | 'alert' | 'trend' | 'recommendation'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  category: 'cost_saving' | 'stock' | 'supplier' | 'efficiency'
  action: string
  potentialSavings?: number
  confidence: number
}

// ============================================
// MAIN COMPONENT
// ============================================

export function GroSupplyEnhancedView() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  
  // Dialog states
  const [reorderDialogOpen, setReorderDialogOpen] = useState(false)
  const [quickOrderDialogOpen, setQuickOrderDialogOpen] = useState(false)
  const [poDetailOpen, setPODetailOpen] = useState(false)
  const [supplierDetailOpen, setSupplierDetailOpen] = useState(false)
  const [alertsConfigOpen, setAlertsConfigOpen] = useState(false)
  const [createPODialogOpen, setCreatePODialogOpen] = useState(false)
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // New PO form state
  const [newPOItems, setNewPOItems] = useState<Array<{
    sku: string
    description: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>>([])
  const [newPOSupplierId, setNewPOSupplierId] = useState('')
  const [newPONotes, setNewPONotes] = useState('')

  // ============================================
  // DATA FETCHING
  // ============================================

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true)
      try {
        // Fetch all data in parallel
        const [suppliersRes, catalogRes, poRes] = await Promise.all([
          fetch('/merchant-os/api/grosupply/suppliers?status=active'),
          fetch('/merchant-os/api/grosupply/catalog?status=active&limit=100'),
          fetch('/merchant-os/api/grosupply/po')
        ])

        const suppliersData = await suppliersRes.json()
        const catalogData = await catalogRes.json()
        const poData = await poRes.json()

        if (suppliersData.suppliers) {
          setSuppliers(suppliersData.suppliers)
        }
        if (catalogData.products) {
          setCatalogProducts(catalogData.products)
        }
        if (poData.purchaseOrders) {
          setPurchaseOrders(poData.purchaseOrders)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchAllData()
  }, [])

  // Refresh purchase orders
  const refreshPurchaseOrders = useCallback(async () => {
    try {
      const res = await fetch('/merchant-os/api/grosupply/po')
      const data = await res.json()
      if (data.purchaseOrders) {
        setPurchaseOrders(data.purchaseOrders)
      }
    } catch (error) {
      console.error('Error refreshing purchase orders:', error)
    }
  }, [])

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const stats = useMemo(() => {
    const pendingApproval = purchaseOrders.filter(po => po.status === 'draft' || po.status === 'pending_approval').length
    const inTransit = purchaseOrders.filter(po => po.status === 'dispatched' || po.status === 'in_transit').length
    const totalInventoryValue = catalogProducts.reduce((s, p) => s + p.costPrice * p.minOrderQty, 0)
    
    return {
      totalSuppliers: suppliers.length,
      activeOrders: purchaseOrders.filter(po => !['delivered', 'cancelled'].includes(po.status)).length,
      pendingApprovals: pendingApproval,
      inTransit,
      totalInventoryValue,
      catalogProducts: catalogProducts.length,
    }
  }, [suppliers, purchaseOrders, catalogProducts])

  const groAIInsights = useMemo((): GroAIInsight[] => {
    const insights: GroAIInsight[] = []
    
    // Active suppliers
    if (suppliers.length > 0) {
      insights.push({
        id: 'INS-001',
        type: 'opportunity',
        title: `${suppliers.length} Active Suppliers`,
        description: 'You have verified suppliers ready to fulfill orders.',
        impact: 'high',
        category: 'supplier',
        action: 'View Suppliers',
        confidence: 100
      })
    }

    // Catalog products available
    if (catalogProducts.length > 0) {
      insights.push({
        id: 'INS-002',
        type: 'trend',
        title: `${catalogProducts.length} Products in Catalog`,
        description: 'Browse products from your suppliers and wholesalers.',
        impact: 'medium',
        category: 'efficiency',
        action: 'View Catalog',
        confidence: 100
      })
    }

    // Pending orders
    if (stats.pendingApprovals > 0) {
      insights.push({
        id: 'INS-003',
        type: 'alert',
        title: `${stats.pendingApprovals} Orders Pending`,
        description: 'You have orders waiting to be processed.',
        impact: 'high',
        category: 'efficiency',
        action: 'Review Orders',
        confidence: 100
      })
    }

    // In transit
    if (stats.inTransit > 0) {
      insights.push({
        id: 'INS-004',
        type: 'trend',
        title: `${stats.inTransit} Orders In Transit`,
        description: 'Track your orders in real-time.',
        impact: 'medium',
        category: 'stock',
        action: 'Track Orders',
        confidence: 100
      })
    }

    return insights
  }, [suppliers, catalogProducts, stats])

  // ============================================
  // HANDLERS
  // ============================================

  const formatCurrency = useCallback((amount: number) => {
    return `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }, [])

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return 'bg-gray-200 text-gray-800 border-gray-400'
      case 'gold': return 'bg-yellow-100 text-yellow-800 border-yellow-400'
      case 'silver': return 'bg-gray-100 text-gray-600 border-gray-300'
      case 'bronze': return 'bg-amber-100 text-amber-800 border-amber-400'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const getPOStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700'
      case 'pending_approval': return 'bg-amber-100 text-amber-700'
      case 'approved': 
      case 'sent': return 'bg-blue-100 text-blue-700'
      case 'confirmed':
      case 'processing': return 'bg-purple-100 text-purple-700'
      case 'dispatched':
      case 'in_transit': return 'bg-indigo-100 text-indigo-700'
      case 'delivered': return 'bg-green-100 text-green-700'
      case 'cancelled': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  // Create purchase order via API
  const handleCreatePurchaseOrder = useCallback(async () => {
    if (!newPOSupplierId || newPOItems.length === 0) {
      setToastMessage('Please select a supplier and add items')
      setTimeout(() => setToastMessage(null), 3000)
      return
    }

    setIsSubmitting(true)
    try {
      const subtotal = newPOItems.reduce((sum, item) => sum + item.totalPrice, 0)
      const vat = subtotal * 0.15
      const total = subtotal + vat

      const response = await fetch('/merchant-os/api/grosupply/po', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: newPOSupplierId,
          items: newPOItems,
          subtotal,
          vat,
          total,
          notes: newPONotes,
          status: 'draft'
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setToastMessage(`Purchase Order ${data.purchaseOrder.number} created successfully!`)
        setCreatePODialogOpen(false)
        setNewPOItems([])
        setNewPOSupplierId('')
        setNewPONotes('')
        refreshPurchaseOrders()
      } else {
        setToastMessage(data.error || 'Failed to create purchase order')
      }
    } catch (error) {
      console.error('Error creating PO:', error)
      setToastMessage('Failed to create purchase order')
    } finally {
      setIsSubmitting(false)
      setTimeout(() => setToastMessage(null), 3000)
    }
  }, [newPOSupplierId, newPOItems, newPONotes, refreshPurchaseOrders])

  // Add catalog item to new PO
  const handleAddToPO = useCallback((product: CatalogProduct) => {
    setNewPOItems(prev => {
      const existing = prev.find(item => item.sku === product.sku)
      if (existing) {
        return prev.map(item => 
          item.sku === product.sku 
            ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
            : item
        )
      }
      return [...prev, {
        sku: product.sku,
        description: product.description,
        quantity: product.minOrderQty || 1,
        unitPrice: product.costPrice,
        totalPrice: product.costPrice * (product.minOrderQty || 1)
      }]
    })
    setToastMessage(`Added ${product.description} to order`)
    setTimeout(() => setToastMessage(null), 2000)
  }, [])

  // Update PO item quantity
  const handleUpdatePOItemQty = useCallback((sku: string, quantity: number) => {
    setNewPOItems(prev => prev.map(item => 
      item.sku === sku 
        ? { ...item, quantity, totalPrice: quantity * item.unitPrice }
        : item
    ))
  }, [])

  // Remove item from PO
  const handleRemovePOItem = useCallback((sku: string) => {
    setNewPOItems(prev => prev.filter(item => item.sku !== sku))
  }, [])

  // Send PO to supplier
  const handleSendPO = useCallback(async (poId: string) => {
    try {
      const response = await fetch('/merchant-os/api/grosupply/po', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: poId, action: 'send' })
      })

      if (response.ok) {
        setToastMessage('Purchase Order sent to supplier!')
        refreshPurchaseOrders()
      }
    } catch (error) {
      console.error('Error sending PO:', error)
    } finally {
      setTimeout(() => setToastMessage(null), 3000)
    }
  }, [refreshPurchaseOrders])

  // Handle GroAI Insight actions
  const handleInsightAction = useCallback((insight: GroAIInsight) => {
    switch (insight.action) {
      case 'View Suppliers':
        setActiveTab('suppliers')
        break
      case 'View Catalog':
        setActiveTab('catalog')
        break
      case 'Review Orders':
        setActiveTab('orders')
        break
      case 'Track Orders':
        setActiveTab('tracking')
        break
      default:
        setActiveTab('orders')
    }
  }, [])

  // Export inventory
  const handleExportInventory = useCallback(() => {
    const csvContent = [
      ['SKU', 'Description', 'Category', 'Cost Price', 'Retail Price', 'Supplier'].join(','),
      ...catalogProducts.map(p => [
        p.sku,
        `"${p.description.replace(/"/g, '""')}"`,
        p.category,
        p.costPrice,
        p.retailPrice,
        p.Supplier?.name || p.Wholesaler?.name || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `catalog-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    setToastMessage('Catalog exported successfully')
    setTimeout(() => setToastMessage(null), 3000)
  }, [catalogProducts])

  // ============================================
  // RENDER
  // ============================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-[#00897B]" />
        <span className="ml-2 text-[#757575]">Loading GroSupply Pro...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4 sticky top-0 bg-white z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#1A1A1A] flex items-center gap-2">
              <Package className="h-5 w-5 text-[#00897B]" />
              GroSupply Pro
            </h1>
            <p className="text-sm text-[#757575]">Smart procurement with AI-powered savings</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-50 border-green-200 text-green-700">
              <Sparkles className="h-3 w-3 mr-1" />
              {suppliers.length} Suppliers
            </Badge>
            <Button variant="outline" size="sm" onClick={() => setCreatePODialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b border-gray-200 px-6 bg-white">
          <TabsList className="h-12 bg-transparent">
            <TabsTrigger value="dashboard" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] rounded-none">
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] rounded-none">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Orders
              {stats.pendingApprovals > 0 && (
                <Badge className="ml-2 bg-amber-100 text-amber-700 text-[10px]">{stats.pendingApprovals}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] rounded-none">
              <Building2 className="h-4 w-4 mr-2" />
              Suppliers
            </TabsTrigger>
            <TabsTrigger value="catalog" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] rounded-none">
              <Layers className="h-4 w-4 mr-2" />
              Catalog
            </TabsTrigger>
            <TabsTrigger value="tracking" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] rounded-none">
              <Truck className="h-4 w-4 mr-2" />
              Tracking
              {stats.inTransit > 0 && (
                <Badge className="ml-2 bg-indigo-100 text-indigo-700 text-[10px]">{stats.inTransit}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="flex-1 m-0 overflow-auto p-6">
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <Card className="border-l-4 border-l-[#00897B]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#757575]">Active Suppliers</p>
                      <p className="text-2xl font-bold">{stats.totalSuppliers}</p>
                    </div>
                    <Building2 className="h-8 w-8 text-[#00897B]/20" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-amber-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#757575]">Pending Approval</p>
                      <p className="text-2xl font-bold text-amber-600">{stats.pendingApprovals}</p>
                    </div>
                    <FileText className="h-8 w-8 text-amber-200" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-indigo-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#757575]">In Transit</p>
                      <p className="text-2xl font-bold text-indigo-600">{stats.inTransit}</p>
                    </div>
                    <Truck className="h-8 w-8 text-indigo-200" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-[#757575]">Catalog Products</p>
                  <p className="text-xl font-bold">{stats.catalogProducts}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-[#757575]">Active Orders</p>
                  <p className="text-xl font-bold">{stats.activeOrders}</p>
                </CardContent>
              </Card>
            </div>

            {/* GroAI Insights */}
            <Card className="border-l-4 border-l-[#00897B]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bot className="h-4 w-4 text-[#00897B]" />
                  GroAI Procurement Insights
                  <Badge variant="outline" className="ml-auto">{groAIInsights.length} insights</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {groAIInsights.map(insight => {
                    const typeIcons = { opportunity: Lightbulb, alert: AlertTriangle, trend: TrendingUp, recommendation: Target }
                    const impactColors = { high: 'border-red-200 bg-red-50', medium: 'border-amber-200 bg-amber-50', low: 'border-green-200 bg-green-50' }
                    const Icon = typeIcons[insight.type]
                    
                    return (
                      <div key={insight.id} className={`p-3 rounded-lg border ${impactColors[insight.impact]}`}>
                        <div className="flex items-start gap-3">
                          <Icon className={`h-5 w-5 shrink-0 ${
                            insight.impact === 'high' ? 'text-red-600' : 
                            insight.impact === 'medium' ? 'text-amber-600' : 'text-green-600'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{insight.title}</h4>
                            <p className="text-xs text-[#757575] mt-1 line-clamp-2">{insight.description}</p>
                            <div className="flex items-center justify-between mt-2">
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleInsightAction(insight)}>
                                {insight.action}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => setCreatePODialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Purchase Order
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('catalog')}>
                  <Layers className="h-4 w-4 mr-2" />
                  Browse Product Catalog
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={handleExportInventory}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export Catalog Report
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => setAlertsConfigOpen(true)}>
                  <Bell className="h-4 w-4 mr-2" />
                  Configure Alerts
                </Button>
              </CardContent>
            </Card>

            {/* Recent Orders */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Recent Purchase Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {purchaseOrders.length === 0 ? (
                  <div className="text-center py-8 text-[#757575]">
                    <Package className="h-8 w-8 mx-auto mb-2" />
                    <p>No purchase orders yet</p>
                    <Button className="mt-4 bg-[#00897B] hover:bg-[#00695C]" onClick={() => setCreatePODialogOpen(true)}>
                      Create First Order
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {purchaseOrders.slice(0, 5).map(po => (
                      <div 
                        key={po.id} 
                        className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                        onClick={() => { setSelectedPO(po); setPODetailOpen(true); }}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getPOStatusColor(po.status)}`}>
                          <ShoppingCart className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{po.number}</p>
                          <p className="text-xs text-[#757575]">{po.supplier?.name || 'Unknown Supplier'}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-sm">{formatCurrency(po.total)}</p>
                          <Badge className={`text-[10px] ${getPOStatusColor(po.status)}`}>
                            {po.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="flex-1 m-0 overflow-auto p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Purchase Orders</h3>
              <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setCreatePODialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Order
              </Button>
            </div>

            {purchaseOrders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h4 className="font-medium">No Purchase Orders</h4>
                  <p className="text-sm text-[#757575]">Create your first purchase order</p>
                  <Button className="mt-4 bg-[#00897B] hover:bg-[#00695C]" onClick={() => setCreatePODialogOpen(true)}>
                    Create Order
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseOrders.map(po => (
                      <TableRow 
                        key={po.id} 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => { setSelectedPO(po); setPODetailOpen(true); }}
                      >
                        <TableCell className="font-medium">{po.number}</TableCell>
                        <TableCell>{po.supplier?.name || 'Unknown'}</TableCell>
                        <TableCell>{po._count?.items || po.items?.length || 0}</TableCell>
                        <TableCell className="font-bold">{formatCurrency(po.total)}</TableCell>
                        <TableCell>
                          <Badge className={getPOStatusColor(po.status)}>
                            {po.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(po.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          {po.status === 'draft' && (
                            <Button 
                              size="sm" 
                              className="bg-[#00897B] hover:bg-[#00695C]"
                              onClick={(e) => { e.stopPropagation(); handleSendPO(po.id); }}
                            >
                              Send
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="flex-1 m-0 overflow-auto p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Your Suppliers</h3>
            </div>

            {suppliers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h4 className="font-medium">No Suppliers Found</h4>
                  <p className="text-sm text-[#757575]">Suppliers will appear here once added</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suppliers.map(supplier => (
                  <Card 
                    key={supplier.id}
                    className="cursor-pointer hover:border-[#00897B] transition-colors"
                    onClick={() => { setSelectedSupplier(supplier); setSupplierDetailOpen(true); }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-[#E0F2F1] flex items-center justify-center text-[#00897B] font-bold text-lg">
                            {supplier.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{supplier.name}</p>
                              {supplier.verificationStatus === 'verified' && (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              )}
                            </div>
                            <p className="text-xs text-[#757575] capitalize">{supplier.supplierType}</p>
                          </div>
                        </div>
                        <Badge className={getTierColor(supplier.tier)} variant="outline">
                          {supplier.tier}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm mb-3">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-medium">{supplier.rating?.toFixed(1) || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[#757575]">
                          <MapPin className="h-4 w-4" />
                          {supplier.city}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs text-center mb-3">
                        <div className="p-2 bg-gray-50 rounded">
                          <p className="font-medium">{supplier.deliveryDays}d</p>
                          <p className="text-[#757575]">Delivery</p>
                        </div>
                        <div className="p-2 bg-gray-50 rounded">
                          <p className="font-medium">{supplier.fulfillmentRate}%</p>
                          <p className="text-[#757575]">Fulfill</p>
                        </div>
                        <div className="p-2 bg-gray-50 rounded">
                          <p className="font-medium">L{supplier.bbbeeLevel}</p>
                          <p className="text-[#757575]">B-BBEE</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          className="flex-1 bg-[#00897B] hover:bg-[#00695C]"
                          onClick={(e) => {
                            e.stopPropagation()
                            setNewPOSupplierId(supplier.id)
                            setCreatePODialogOpen(true)
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Order
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Catalog Tab */}
        <TabsContent value="catalog" className="flex-1 m-0 overflow-auto p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Product Catalog</h2>
                <p className="text-sm text-[#757575]">{catalogProducts.length} products from suppliers and wholesalers</p>
              </div>
              <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setCreatePODialogOpen(true)}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Create Order ({newPOItems.length})
              </Button>
            </div>

            {catalogProducts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h4 className="font-medium">No Products in Catalog</h4>
                  <p className="text-sm text-[#757575]">Products from your suppliers will appear here</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {catalogProducts.map(product => (
                  <Card key={product.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{product.description}</p>
                          <p className="text-xs text-[#757575]">{product.sku}</p>
                          <Badge variant="outline" className="text-[10px] mt-1">{product.category}</Badge>
                        </div>
                      </div>
                      
                      <Separator className="my-3" />
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#757575]">Cost Price</span>
                          <span className="font-medium">{formatCurrency(product.costPrice)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#757575]">Supplier</span>
                          <span className="text-xs truncate max-w-[120px]">{product.Supplier?.name || product.Wholesaler?.name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#757575]">Lead Time</span>
                          <span>{product.leadDays} days</span>
                        </div>
                      </div>
                      
                      <Button 
                        size="sm" 
                        className="w-full mt-3 bg-[#00897B] hover:bg-[#00695C]"
                        onClick={() => handleAddToPO(product)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add to Order
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tracking Tab */}
        <TabsContent value="tracking" className="flex-1 m-0 overflow-auto p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Order Tracking</h3>
            
            {purchaseOrders.filter(po => ['dispatched', 'in_transit'].includes(po.status)).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Truck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h4 className="font-medium">No Orders In Transit</h4>
                  <p className="text-sm text-[#757575]">Orders will appear here once dispatched</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {purchaseOrders.filter(po => ['dispatched', 'in_transit'].includes(po.status)).map(po => (
                  <Card key={po.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">{po.number}</CardTitle>
                          <p className="text-sm text-[#757575]">{po.supplier?.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(po.total)}</p>
                          <Badge className={getPOStatusColor(po.status)}>
                            {po.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-[#757575] mb-1">
                          <span>Order Progress</span>
                          <span>{po.status === 'in_transit' ? '90%' : '75%'}</span>
                        </div>
                        <Progress value={po.status === 'in_transit' ? 90 : 75} className="h-2" />
                      </div>

                      {po.trackingNumber && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-[#757575]">Tracking Number</p>
                              <p className="font-medium">{po.trackingNumber}</p>
                            </div>
                            <Button variant="outline" size="sm">
                              <Globe className="h-4 w-4 mr-2" />
                              Track
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Purchase Order Dialog */}
      <Dialog open={createPODialogOpen} onOpenChange={setCreatePODialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
            <DialogDescription>
              Select a supplier and add products from the catalog
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Supplier Selection */}
            <div className="space-y-2">
              <Label>Select Supplier</Label>
              <Select value={newPOSupplierId} onValueChange={setNewPOSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.tier})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Current Items */}
            {newPOItems.length > 0 && (
              <div className="space-y-2">
                <Label>Order Items ({newPOItems.length})</Label>
                <div className="border rounded-lg divide-y">
                  {newPOItems.map(item => (
                    <div key={item.sku} className="p-3 flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.description}</p>
                        <p className="text-xs text-[#757575]">{item.sku}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleUpdatePOItemQty(item.sku, parseInt(e.target.value) || 1)}
                          className="w-20"
                          min={1}
                        />
                        <span className="font-medium w-24 text-right">{formatCurrency(item.totalPrice)}</span>
                        <Button variant="ghost" size="sm" onClick={() => handleRemovePOItem(item.sku)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-bold p-3 bg-gray-50 rounded">
                  <span>Total</span>
                  <span>{formatCurrency(newPOItems.reduce((s, i) => s + i.totalPrice, 0))}</span>
                </div>
              </div>
            )}

            {/* Add Products */}
            <div className="space-y-2">
              <Label>Add Products from Catalog</Label>
              <ScrollArea className="h-48 border rounded-lg">
                <div className="p-2 space-y-1">
                  {catalogProducts.map(product => (
                    <div 
                      key={product.id}
                      className="p-2 border rounded flex items-center justify-between hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">{product.description}</p>
                        <p className="text-xs text-[#757575]">{formatCurrency(product.costPrice)} • {product.Supplier?.name || product.Wholesaler?.name}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleAddToPO(product)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea 
                placeholder="Add any special instructions..."
                value={newPONotes}
                onChange={(e) => setNewPONotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreatePODialogOpen(false)}>Cancel</Button>
            <Button 
              className="bg-[#00897B] hover:bg-[#00695C]"
              disabled={newPOItems.length === 0 || !newPOSupplierId || isSubmitting}
              onClick={handleCreatePurchaseOrder}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Create Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PO Detail Dialog */}
      <Dialog open={poDetailOpen} onOpenChange={setPODetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedPO && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedPO.number}
                  <Badge className={getPOStatusColor(selectedPO.status)}>
                    {selectedPO.status.replace('_', ' ')}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  Supplier: {selectedPO.supplier?.name || 'Unknown'} • Created: {new Date(selectedPO.createdAt).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Items */}
                {selectedPO.items && selectedPO.items.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Order Items</Label>
                    <div className="mt-2 border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>SKU</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedPO.items.map((item, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                              <TableCell>{item.description}</TableCell>
                              <TableCell className="text-right">{item.quantity}</TableCell>
                              <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                              <TableCell className="text-right font-medium">{formatCurrency(item.totalPrice)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* Totals */}
                <div className="flex justify-end">
                  <div className="w-48 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#757575]">Subtotal</span>
                      <span>{formatCurrency(selectedPO.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#757575]">VAT (15%)</span>
                      <span>{formatCurrency(selectedPO.vat)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>{formatCurrency(selectedPO.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {selectedPO.status === 'draft' && (
                  <div className="flex gap-2 pt-4">
                    <Button 
                      className="flex-1 bg-[#00897B] hover:bg-[#00695C]"
                      onClick={() => { handleSendPO(selectedPO.id); setPODetailOpen(false); }}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send to Supplier
                    </Button>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setPODetailOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Supplier Detail Dialog */}
      <Dialog open={supplierDetailOpen} onOpenChange={setSupplierDetailOpen}>
        <DialogContent className="max-w-2xl">
          {selectedSupplier && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-[#E0F2F1] flex items-center justify-center text-[#00897B] font-bold text-lg">
                    {selectedSupplier.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      {selectedSupplier.name}
                      {selectedSupplier.verificationStatus === 'verified' && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <p className="text-sm text-[#757575] font-normal capitalize">
                      {selectedSupplier.supplierType} • {selectedSupplier.tier} tier
                    </p>
                  </div>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-lg font-bold">{selectedSupplier._count?.PurchaseOrder || 0}</p>
                    <p className="text-xs text-[#757575]">Orders</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-lg font-bold">{selectedSupplier.fulfillmentRate}%</p>
                    <p className="text-xs text-[#757575]">Fulfillment</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-lg font-bold">{selectedSupplier.deliveryDays}d</p>
                    <p className="text-xs text-[#757575]">Delivery</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-lg font-bold">{selectedSupplier.rating?.toFixed(1) || 'N/A'}</p>
                    <p className="text-xs text-[#757575]">Rating</p>
                  </div>
                </div>

                {/* Contact & Location */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Contact Information</Label>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-[#757575]" />
                        {selectedSupplier.phone || 'N/A'}
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-[#757575]" />
                        {selectedSupplier.email || 'N/A'}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-[#757575]" />
                        {selectedSupplier.city}, {selectedSupplier.province}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Business Details</Label>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-[#757575]" />
                        B-BBEE Level {selectedSupplier.bbbeeLevel}
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-[#757575]" />
                        Min Order: {formatCurrency(selectedSupplier.minOrderValue)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Categories */}
                {selectedSupplier.categories && selectedSupplier.categories.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Categories</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedSupplier.categories.map((cat, idx) => (
                        <Badge key={idx} variant="outline">{cat}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSupplierDetailOpen(false)}>Close</Button>
                <Button 
                  className="bg-[#00897B] hover:bg-[#00695C]" 
                  onClick={() => {
                    setSupplierDetailOpen(false)
                    setNewPOSupplierId(selectedSupplier.id)
                    setCreatePODialogOpen(true)
                  }}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Create Order
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Alerts Configuration Dialog */}
      <Dialog open={alertsConfigOpen} onOpenChange={setAlertsConfigOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Configure Stock Alerts</DialogTitle>
            <DialogDescription>
              Set up automatic alerts for low stock and order notifications
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Order Status Updates</p>
                <p className="text-sm text-[#757575]">Get notified when order status changes</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Delivery Alerts</p>
                <p className="text-sm text-[#757575]">Track delivery progress</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Price Change Alerts</p>
                <p className="text-sm text-[#757575]">Notify when supplier prices change</p>
              </div>
              <Switch />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAlertsConfigOpen(false)}>Cancel</Button>
            <Button 
              className="bg-[#00897B] hover:bg-[#00695C]" 
              onClick={() => { 
                setAlertsConfigOpen(false)
                setToastMessage('Alert settings saved')
                setTimeout(() => setToastMessage(null), 3000)
              }}
            >
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-[#1A1A1A] text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50">
          <CheckCircle2 className="h-4 w-4 text-green-400" />
          {toastMessage}
        </div>
      )}
    </div>
  )
}

export default GroSupplyEnhancedView
