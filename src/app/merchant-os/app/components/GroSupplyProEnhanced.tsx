'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
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
  Sparkles,
  Send,
  Eye,
  Edit,
  Download,
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
  Percent,
  Activity,
  Layers,
  Box,
  Link2,
  Store,
  ClipboardList,
  History,
  BoxIcon,
} from 'lucide-react'

// ============================================
// TYPES
// ============================================

interface InventoryItem {
  id: string
  sku: string
  name: string
  category: string
  currentStock: number
  reorderPoint: number
  maxStock: number
  unitCost: number
  sellingPrice: number
  unit: string
  lastRestocked: string
  supplier: string
  supplierId: string
  leadTime: number
  monthlyUsage: number
  stockStatus: 'critical' | 'low' | 'adequate' | 'overstock'
}

interface Supplier {
  id: string
  name: string
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  type: 'manufacturer' | 'distributor' | 'wholesaler' | 'farmer'
  rating: number
  reviewCount: number
  verified: boolean
  bbbeeLevel: number
  categories: string[]
  location: { city: string; province: string }
  contact: { phone: string; email: string }
  stats: {
    products: number
    orders: number
    fulfillmentRate: number
    avgDeliveryDays: number
    onTimeRate: number
  }
  paymentTerms: string[]
  minOrderValue: number
  lastOrder?: string
  totalSpent: number
  status: 'active' | 'inactive'
}

interface SupplierProduct {
  id: string
  supplierId: string
  supplierName: string
  sku: string
  name: string
  category: string
  basePrice: number
  costPrice: number
  unit: string
  minOrderQty: number
  maxOrderQty?: number
  leadTime: number
  inStock: boolean
  stockQty?: number
  bulkPricing: { minQty: number; maxQty?: number; discountPercent: number; discountedPrice?: number }[]
}

interface ReorderSuggestion {
  id: string
  sku: string
  productName: string
  currentStock: number
  reorderPoint: number
  suggestedQty: number
  estimatedCost: number
  urgency: 'critical' | 'high' | 'medium' | 'low'
  bestSupplier: string
  bestSupplierId: string
  bestPrice: number
  leadTime: number
  reason: string
  daysUntilStockout: number
  bulkDiscounts?: { minQty: number; discountPercent: number }[]
}

interface PurchaseOrder {
  id: string
  number: string
  supplierId: string
  supplierName: string
  status: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'confirmed' | 'processing' | 'dispatched' | 'in_transit' | 'delivered' | 'cancelled'
  items: {
    sku: string
    description: string
    quantity: number
    unitPrice: number
    total: number
    receivedQty: number
  }[]
  subtotal: number
  vat: number
  total: number
  paymentStatus: 'pending' | 'partial' | 'paid'
  paymentMethod?: string
  deliveryAddress: string
  requestedDate: string
  estimatedDelivery?: string
  trackingNumber?: string
  createdAt: string
  approvedBy?: string
  approvedAt?: string
  notes?: string
  isAutoOrder: boolean
  trackingEvents?: TrackingEvent[]
}

interface TrackingEvent {
  id: string
  stage: string
  status: string
  title: string
  description?: string
  location?: string
  timestamp: string
  createdBy?: string
}

interface QuotationRequest {
  id: string
  number: string
  status: string
  supplierId: string
  supplierName: string
  items: { sku: string; productName: string; quantity: number; unit: string; currentPrice?: number }[]
  totalItems: number
  estimatedValue: number
  requiredBy: string
  notes?: string
  createdAt: string
  response?: QuotationResponse
}

interface QuotationResponse {
  id: string
  status: string
  subtotal: number
  discount: number
  deliveryCost: number
  vat: number
  total: number
  deliveryDays: number
  paymentTerms?: string
  validUntil: string
  notes?: string
  items: { sku: string; productName: string; quantity: number; unitPrice: number; discountPercent: number; totalPrice: number; inStock: boolean }[]
  submittedAt: string
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
// SAMPLE DATA
// ============================================

const sampleInventoryItems: InventoryItem[] = [
  { id: 'INV-001', sku: 'MAIZE-1KG', name: 'Maize Meal 1kg', category: 'Dry Goods', currentStock: 15, reorderPoint: 50, maxStock: 200, unitCost: 18.50, sellingPrice: 25.00, unit: 'bags', lastRestocked: '2026-02-10', supplier: 'Pride Milling Co', supplierId: 'sup-001', leadTime: 2, monthlyUsage: 120, stockStatus: 'critical' },
  { id: 'INV-002', sku: 'RICE-2KG', name: 'Rice 2kg', category: 'Dry Goods', currentStock: 45, reorderPoint: 30, maxStock: 150, unitCost: 32.00, sellingPrice: 45.00, unit: 'bags', lastRestocked: '2026-02-15', supplier: 'Pride Milling Co', supplierId: 'sup-001', leadTime: 2, monthlyUsage: 80, stockStatus: 'adequate' },
  { id: 'INV-003', sku: 'SUGAR-1KG', name: 'White Sugar 1kg', category: 'Dry Goods', currentStock: 8, reorderPoint: 40, maxStock: 120, unitCost: 22.00, sellingPrice: 30.00, unit: 'bags', lastRestocked: '2026-02-05', supplier: 'Metro Wholesale', supplierId: 'sup-002', leadTime: 1, monthlyUsage: 100, stockStatus: 'critical' },
  { id: 'INV-004', sku: 'MILK-1L', name: 'Full Cream Milk 1L', category: 'Dairy', currentStock: 25, reorderPoint: 60, maxStock: 150, unitCost: 18.00, sellingPrice: 28.00, unit: 'liters', lastRestocked: '2026-02-18', supplier: 'Clover SA', supplierId: 'sup-003', leadTime: 1, monthlyUsage: 180, stockStatus: 'low' },
  { id: 'INV-005', sku: 'BREAD-W', name: 'White Bread', category: 'Bakery', currentStock: 30, reorderPoint: 40, maxStock: 80, unitCost: 12.00, sellingPrice: 18.00, unit: 'loaves', lastRestocked: '2026-02-19', supplier: 'Albany Bakeries', supplierId: 'sup-004', leadTime: 1, monthlyUsage: 120, stockStatus: 'low' },
  { id: 'INV-006', sku: 'COOKING-OIL-750', name: 'Cooking Oil 750ml', category: 'Oils', currentStock: 80, reorderPoint: 30, maxStock: 100, unitCost: 28.00, sellingPrice: 42.00, unit: 'bottles', lastRestocked: '2026-02-12', supplier: 'Metro Wholesale', supplierId: 'sup-002', leadTime: 1, monthlyUsage: 60, stockStatus: 'adequate' },
  { id: 'INV-007', sku: 'TOMATO-1KG', name: 'Fresh Tomatoes', category: 'Fresh Produce', currentStock: 12, reorderPoint: 20, maxStock: 50, unitCost: 25.00, sellingPrice: 35.00, unit: 'kg', lastRestocked: '2026-02-18', supplier: 'Freshmark', supplierId: 'sup-005', leadTime: 1, monthlyUsage: 45, stockStatus: 'low' },
  { id: 'INV-008', sku: 'ONION-1KG', name: 'Brown Onions', category: 'Fresh Produce', currentStock: 3, reorderPoint: 15, maxStock: 40, unitCost: 18.00, sellingPrice: 25.00, unit: 'kg', lastRestocked: '2026-02-15', supplier: 'Freshmark', supplierId: 'sup-005', leadTime: 1, monthlyUsage: 35, stockStatus: 'critical' },
]

const sampleSuppliers: Supplier[] = [
  { id: 'sup-001', name: 'Pride Milling Co', tier: 'gold', type: 'manufacturer', rating: 4.7, reviewCount: 234, verified: true, bbbeeLevel: 1, categories: ['Dry Goods', 'Grains', 'Flour'], location: { city: 'Johannesburg', province: 'Gauteng' }, contact: { phone: '+27 11 234 5678', email: 'orders@pride.co.za' }, stats: { products: 156, orders: 2340, fulfillmentRate: 97.5, avgDeliveryDays: 2, onTimeRate: 96 }, paymentTerms: ['Net 30', 'Net 60'], minOrderValue: 500, totalSpent: 125000, status: 'active', lastOrder: '2026-02-15' },
  { id: 'sup-002', name: 'Metro Wholesale', tier: 'platinum', type: 'distributor', rating: 4.9, reviewCount: 567, verified: true, bbbeeLevel: 2, categories: ['Groceries', 'Beverages', 'Snacks', 'Household'], location: { city: 'Johannesburg', province: 'Gauteng' }, contact: { phone: '+27 11 345 6789', email: 'trade@metro.co.za' }, stats: { products: 450, orders: 5670, fulfillmentRate: 98.2, avgDeliveryDays: 1, onTimeRate: 98 }, paymentTerms: ['Net 30', 'Net 60', 'Net 90'], minOrderValue: 300, totalSpent: 285000, status: 'active', lastOrder: '2026-02-18' },
  { id: 'sup-003', name: 'Clover SA', tier: 'gold', type: 'manufacturer', rating: 4.8, reviewCount: 345, verified: true, bbbeeLevel: 2, categories: ['Dairy', 'Beverages', 'Fresh Foods'], location: { city: 'Pretoria', province: 'Gauteng' }, contact: { phone: '+27 12 456 7890', email: 'orders@clover.co.za' }, stats: { products: 120, orders: 3450, fulfillmentRate: 96.8, avgDeliveryDays: 1, onTimeRate: 95 }, paymentTerms: ['Net 30', 'Weekly'], minOrderValue: 200, totalSpent: 98000, status: 'active', lastOrder: '2026-02-17' },
  { id: 'sup-004', name: 'Albany Bakeries', tier: 'gold', type: 'manufacturer', rating: 4.6, reviewCount: 189, verified: true, bbbeeLevel: 2, categories: ['Bakery', 'Bread', 'Pastries'], location: { city: 'Johannesburg', province: 'Gauteng' }, contact: { phone: '+27 11 567 8901', email: 'wholesale@albany.co.za' }, stats: { products: 45, orders: 2890, fulfillmentRate: 95.5, avgDeliveryDays: 1, onTimeRate: 94 }, paymentTerms: ['Net 30'], minOrderValue: 100, totalSpent: 45000, status: 'active', lastOrder: '2026-02-19' },
  { id: 'sup-005', name: 'Freshmark (Shoprite)', tier: 'gold', type: 'distributor', rating: 4.5, reviewCount: 156, verified: true, bbbeeLevel: 1, categories: ['Fresh Produce', 'Fruits', 'Vegetables'], location: { city: 'Cape Town', province: 'Western Cape' }, contact: { phone: '+27 21 678 9012', email: 'supply@freshmark.co.za' }, stats: { products: 200, orders: 1890, fulfillmentRate: 94.2, avgDeliveryDays: 2, onTimeRate: 92 }, paymentTerms: ['Net 30', 'COD'], minOrderValue: 150, totalSpent: 32000, status: 'active', lastOrder: '2026-02-18' },
]

const samplePurchaseOrders: PurchaseOrder[] = [
  { 
    id: 'PO-001', 
    number: 'PO-2026-0001', 
    supplierId: 'sup-001', 
    supplierName: 'Pride Milling Co', 
    status: 'delivered', 
    items: [
      { sku: 'MAIZE-1KG', description: 'Maize Meal 1kg', quantity: 100, unitPrice: 18.50, total: 1850, receivedQty: 100 }
    ], 
    subtotal: 1850, 
    vat: 277.50, 
    total: 2127.50, 
    paymentStatus: 'paid', 
    paymentMethod: 'EFT', 
    deliveryAddress: '123 Main Street, Johannesburg', 
    requestedDate: '2026-02-12', 
    estimatedDelivery: '2026-02-14', 
    trackingNumber: 'TRK-001', 
    createdAt: '2026-02-10', 
    approvedBy: 'John Dlamini', 
    approvedAt: '2026-02-10', 
    isAutoOrder: false,
    trackingEvents: [
      { id: 't1', stage: 'submitted', status: 'completed', title: 'Order Submitted', description: 'PO sent to supplier', timestamp: '2026-02-10T09:00:00Z' },
      { id: 't2', stage: 'confirmed', status: 'completed', title: 'Order Confirmed', description: 'Supplier confirmed order', timestamp: '2026-02-10T14:00:00Z' },
      { id: 't3', stage: 'dispatched', status: 'completed', title: 'Dispatched', description: 'Order dispatched from warehouse', location: 'Johannesburg', timestamp: '2026-02-13T08:00:00Z' },
      { id: 't4', stage: 'in_transit', status: 'completed', title: 'In Transit', description: 'Order on the way', location: 'En route', timestamp: '2026-02-13T12:00:00Z' },
      { id: 't5', stage: 'delivered', status: 'completed', title: 'Delivered', description: 'Order delivered successfully', location: '123 Main Street', timestamp: '2026-02-14T09:30:00Z' },
    ]
  },
  { 
    id: 'PO-002', 
    number: 'PO-2026-0002', 
    supplierId: 'sup-002', 
    supplierName: 'Metro Wholesale', 
    status: 'in_transit', 
    items: [
      { sku: 'SUGAR-1KG', description: 'White Sugar 1kg', quantity: 50, unitPrice: 22.00, total: 1100, receivedQty: 0 }
    ], 
    subtotal: 1100, 
    vat: 165, 
    total: 1265, 
    paymentStatus: 'pending', 
    deliveryAddress: '123 Main Street, Johannesburg', 
    requestedDate: '2026-02-20', 
    estimatedDelivery: '2026-02-20', 
    trackingNumber: 'TRK-002', 
    createdAt: '2026-02-18', 
    approvedBy: 'John Dlamini', 
    approvedAt: '2026-02-18', 
    isAutoOrder: true,
    trackingEvents: [
      { id: 't1', stage: 'submitted', status: 'completed', title: 'Order Submitted', description: 'PO sent to supplier', timestamp: '2026-02-18T10:00:00Z' },
      { id: 't2', stage: 'confirmed', status: 'completed', title: 'Order Confirmed', description: 'Supplier confirmed order', timestamp: '2026-02-18T15:00:00Z' },
      { id: 't3', stage: 'processing', status: 'completed', title: 'Processing', description: 'Order being prepared', location: 'Metro DC Johannesburg', timestamp: '2026-02-19T08:00:00Z' },
      { id: 't4', stage: 'dispatched', status: 'completed', title: 'Dispatched', description: 'Order dispatched', location: 'Johannesburg', timestamp: '2026-02-20T06:00:00Z' },
      { id: 't5', stage: 'in_transit', status: 'active', title: 'In Transit', description: 'Order on the way', location: 'En route to delivery', timestamp: '2026-02-20T08:00:00Z' },
    ]
  },
  { 
    id: 'PO-003', 
    number: 'PO-2026-0003', 
    supplierId: 'sup-003', 
    supplierName: 'Clover SA', 
    status: 'pending_approval', 
    items: [
      { sku: 'MILK-1L', description: 'Full Cream Milk 1L', quantity: 100, unitPrice: 18.00, total: 1800, receivedQty: 0 }
    ], 
    subtotal: 1800, 
    vat: 270, 
    total: 2070, 
    paymentStatus: 'pending', 
    deliveryAddress: '123 Main Street, Johannesburg', 
    requestedDate: '2026-02-21', 
    createdAt: '2026-02-19', 
    isAutoOrder: true, 
    notes: 'Auto-generated: Stock below reorder point'
  },
]

// ============================================
// MAIN COMPONENT
// ============================================

export function GroSupplyProEnhanced() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [inventory, setInventory] = useState<InventoryItem[]>(sampleInventoryItems)
  const [suppliers] = useState<Supplier[]>(sampleSuppliers)
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(samplePurchaseOrders)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Dialog states
  const [reorderDialogOpen, setReorderDialogOpen] = useState(false)
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false)
  const [quotationDialogOpen, setQuotationDialogOpen] = useState(false)
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState<string>('')
  const [orderNotes, setOrderNotes] = useState('')
  
  // ============================================
  // COMPUTED VALUES
  // ============================================

  const reorderSuggestions = useMemo((): ReorderSuggestion[] => {
    return inventory
      .filter(item => item.currentStock <= item.reorderPoint)
      .map(item => {
        const daysUntilStockout = item.currentStock > 0 ? Math.ceil(item.currentStock / (item.monthlyUsage / 30)) : 0
        const suggestedQty = Math.max(item.reorderPoint - item.currentStock + item.monthlyUsage, item.reorderPoint * 1.5)
        const supplier = suppliers.find(s => s.id === item.supplierId)
        
        // Simulated bulk discounts
        const bulkDiscounts = [
          { minQty: 50, discountPercent: 5 },
          { minQty: 100, discountPercent: 10 },
          { minQty: 200, discountPercent: 15 },
        ]
        
        return {
          id: `RO-${item.id}`,
          sku: item.sku,
          productName: item.name,
          currentStock: item.currentStock,
          reorderPoint: item.reorderPoint,
          suggestedQty: Math.ceil(suggestedQty),
          estimatedCost: suggestedQty * item.unitCost,
          urgency: daysUntilStockout <= 2 ? 'critical' : daysUntilStockout <= 5 ? 'high' : 'medium',
          bestSupplier: supplier?.name || item.supplier,
          bestSupplierId: item.supplierId,
          bestPrice: item.unitCost,
          leadTime: item.leadTime,
          reason: item.currentStock === 0 ? 'Out of stock' : `Will run out in ~${daysUntilStockout} days`,
          daysUntilStockout,
          bulkDiscounts
        }
      })
      .sort((a, b) => a.daysUntilStockout - b.daysUntilStockout)
  }, [inventory, suppliers])

  const stats = useMemo(() => {
    const criticalStock = inventory.filter(i => i.stockStatus === 'critical').length
    const lowStock = inventory.filter(i => i.stockStatus === 'low').length
    const totalInventoryValue = inventory.reduce((s, i) => s + i.currentStock * i.unitCost, 0)
    const totalMonthlySpend = inventory.reduce((s, i) => s + i.monthlyUsage * i.unitCost, 0)
    const pendingApprovals = purchaseOrders.filter(po => po.status === 'pending_approval').length
    const inTransit = purchaseOrders.filter(po => po.status === 'in_transit' || po.status === 'dispatched').length
    
    return {
      criticalStock,
      lowStock,
      totalInventoryValue,
      totalMonthlySpend,
      pendingApprovals,
      inTransit,
      totalSuppliers: suppliers.filter(s => s.status === 'active').length,
      activeOrders: purchaseOrders.filter(po => !['delivered', 'cancelled'].includes(po.status)).length,
    }
  }, [inventory, purchaseOrders, suppliers])

  const groAIInsights = useMemo((): GroAIInsight[] => {
    const insights: GroAIInsight[] = []
    
    // Critical stock alerts
    if (stats.criticalStock > 0) {
      insights.push({
        id: 'INS-001',
        type: 'alert',
        title: `${stats.criticalStock} items critically low`,
        description: `${reorderSuggestions.filter(r => r.urgency === 'critical').length} items will stock out within 2 days. Immediate action required.`,
        impact: 'high',
        category: 'stock',
        action: 'Review & Order Now',
        potentialSavings: stats.totalMonthlySpend * 0.05,
        confidence: 95
      })
    }
    
    // Cost saving opportunity
    const bulkDiscountOpportunity = inventory.filter(i => i.monthlyUsage > 50)
    if (bulkDiscountOpportunity.length > 0) {
      const potentialSavings = bulkDiscountOpportunity.reduce((s, i) => s + i.monthlyUsage * i.unitCost * 0.08, 0)
      insights.push({
        id: 'INS-002',
        type: 'opportunity',
        title: 'Bulk Order Savings Available',
        description: `${bulkDiscountOpportunity.length} products qualify for bulk discounts. Estimated savings: R${potentialSavings.toFixed(0)}/month`,
        impact: 'high',
        category: 'cost_saving',
        action: 'View Bulk Deals',
        potentialSavings,
        confidence: 88
      })
    }
    
    // Delivery tracking
    if (stats.inTransit > 0) {
      insights.push({
        id: 'INS-003',
        type: 'trend',
        title: `${stats.inTransit} Orders In Transit`,
        description: 'Track your orders in real-time for better inventory planning.',
        impact: 'medium',
        category: 'efficiency',
        action: 'Track Orders',
        confidence: 100
      })
    }
    
    return insights
  }, [stats, reorderSuggestions, inventory])

  // ============================================
  // HANDLERS
  // ============================================

  const formatCurrency = useCallback((amount: number) => {
    return `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }, [])

  const getStockStatusColor = (status: InventoryItem['stockStatus']) => {
    switch (status) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200'
      case 'low': return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'adequate': return 'bg-green-100 text-green-700 border-green-200'
      case 'overstock': return 'bg-blue-100 text-blue-700 border-blue-200'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getTierColor = (tier: Supplier['tier']) => {
    switch (tier) {
      case 'platinum': return 'bg-gray-200 text-gray-800 border-gray-400'
      case 'gold': return 'bg-yellow-100 text-yellow-800 border-yellow-400'
      case 'silver': return 'bg-gray-100 text-gray-600 border-gray-300'
      case 'bronze': return 'bg-amber-100 text-amber-800 border-amber-400'
    }
  }

  const getPOStatusColor = (status: PurchaseOrder['status']) => {
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

  const handleApprovePO = useCallback((poId: string) => {
    setPurchaseOrders(prev => prev.map(po => 
      po.id === poId ? { ...po, status: 'approved', approvedBy: 'Current User', approvedAt: new Date().toISOString() } : po
    ))
  }, [])

  const handleCreateOrder = useCallback(() => {
    if (selectedItems.length === 0 || !selectedSupplier) return
    
    const selectedInventory = inventory.filter(i => selectedItems.includes(i.id))
    const supplier = suppliers.find(s => s.id === selectedSupplier)
    if (!supplier) return
    
    const items = selectedInventory.map(item => ({
      sku: item.sku,
      description: item.name,
      quantity: item.reorderPoint - item.currentStock + item.monthlyUsage,
      unitPrice: item.unitCost,
      total: (item.reorderPoint - item.currentStock + item.monthlyUsage) * item.unitCost,
      receivedQty: 0
    }))
    
    const subtotal = items.reduce((s, i) => s + i.total, 0)
    
    const newPO: PurchaseOrder = {
      id: `PO-${Date.now()}`,
      number: `PO-2026-${String(purchaseOrders.length + 1).padStart(4, '0')}`,
      supplierId: selectedSupplier,
      supplierName: supplier.name,
      status: 'pending_approval',
      items,
      subtotal,
      vat: subtotal * 0.15,
      total: subtotal * 1.15,
      paymentStatus: 'pending',
      deliveryAddress: '123 Main Street, Johannesburg',
      requestedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
      isAutoOrder: false,
      notes: orderNotes || undefined
    }
    
    setPurchaseOrders(prev => [newPO, ...prev])
    setOrderDialogOpen(false)
    setSelectedItems([])
    setSelectedSupplier('')
    setOrderNotes('')
  }, [selectedItems, selectedSupplier, inventory, suppliers, purchaseOrders, orderNotes])

  const handleViewTracking = useCallback((po: PurchaseOrder) => {
    setSelectedPO(po)
    setTrackingDialogOpen(true)
  }, [])

  // ============================================
  // RENDER
  // ============================================

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
            <p className="text-sm text-[#757575]">Smart procurement with AI-powered savings & stock tracking</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-50 border-green-200 text-green-700">
              <Link2 className="h-3 w-3 mr-1" />
              Inventory Synced
            </Badge>
            <Button variant="outline" size="sm" onClick={() => setReorderDialogOpen(true)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reorder ({reorderSuggestions.length})
            </Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setOrderDialogOpen(true)}>
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
              {stats.activeOrders > 0 && (
                <Badge className="ml-2 bg-blue-100 text-blue-700 text-[10px]">{stats.activeOrders}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="tracking" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] rounded-none">
              <Truck className="h-4 w-4 mr-2" />
              Tracking
              {stats.inTransit > 0 && (
                <Badge className="ml-2 bg-indigo-100 text-indigo-700 text-[10px]">{stats.inTransit}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="quotations" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] rounded-none">
              <FileText className="h-4 w-4 mr-2" />
              Quotations
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] rounded-none">
              <Building2 className="h-4 w-4 mr-2" />
              Suppliers
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="flex-1 m-0 overflow-auto p-6">
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Card className="border-l-4 border-l-red-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#757575]">Critical Stock</p>
                      <p className="text-2xl font-bold text-red-600">{stats.criticalStock}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-200" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-amber-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#757575]">Low Stock</p>
                      <p className="text-2xl font-bold text-amber-600">{stats.lowStock}</p>
                    </div>
                    <Clock className="h-8 w-8 text-amber-200" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#757575]">Pending Approval</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.pendingApprovals}</p>
                    </div>
                    <FileText className="h-8 w-8 text-blue-200" />
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
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-[#757575]">Inventory Value</p>
                  <p className="text-xl font-bold">{formatCurrency(stats.totalInventoryValue)}</p>
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
                            {insight.potentialSavings && (
                              <p className="text-xs text-green-600 font-medium mt-2">
                                Save {formatCurrency(insight.potentialSavings)}/mo
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Urgent Reorders & Active Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Urgent Reorders */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    Urgent Reorders Required
                    {reorderSuggestions.length > 0 && (
                      <Badge className="bg-red-100 text-red-700 ml-2">{reorderSuggestions.length}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {reorderSuggestions.length === 0 ? (
                    <div className="text-center py-8 text-[#757575]">
                      <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <p>All stock levels healthy</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {reorderSuggestions.slice(0, 5).map(suggestion => (
                        <div key={suggestion.id} className="flex items-center gap-3 p-3 border rounded-lg">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            suggestion.urgency === 'critical' ? 'bg-red-100 text-red-600' :
                            suggestion.urgency === 'high' ? 'bg-amber-100 text-amber-600' :
                            'bg-yellow-100 text-yellow-600'
                          }`}>
                            <Timer className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{suggestion.productName}</p>
                            <p className="text-xs text-[#757575]">
                              Stock: {suggestion.currentStock} | Order: {suggestion.suggestedQty}
                            </p>
                            <p className="text-xs text-[#757575]">
                              Supplier: {suggestion.bestSupplier}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold text-sm">{formatCurrency(suggestion.estimatedCost)}</p>
                            <p className="text-xs text-red-600">{suggestion.daysUntilStockout}d left</p>
                            {suggestion.bulkDiscounts && suggestion.bulkDiscounts.length > 0 && (
                              <p className="text-xs text-green-600">
                                <Percent className="h-3 w-3 inline" />
                                Up to {suggestion.bulkDiscounts[suggestion.bulkDiscounts.length - 1].discountPercent}% off
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {reorderSuggestions.length > 5 && (
                    <Button variant="outline" className="w-full mt-3" onClick={() => setReorderDialogOpen(true)}>
                      View All {reorderSuggestions.length} Items
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Active Orders */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-blue-500" />
                    Active Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {purchaseOrders.filter(po => !['delivered', 'cancelled'].includes(po.status)).length === 0 ? (
                    <div className="text-center py-8 text-[#757575]">
                      <Package className="h-8 w-8 mx-auto mb-2" />
                      <p>No active orders</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {purchaseOrders.filter(po => !['delivered', 'cancelled'].includes(po.status)).map(po => (
                        <div key={po.id} className="flex items-center gap-3 p-3 border rounded-lg">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getPOStatusColor(po.status)}`}>
                            {po.status === 'in_transit' || po.status === 'dispatched' ? 
                              <Truck className="h-5 w-5" /> : 
                              po.status === 'pending_approval' ? 
                              <Clock className="h-5 w-5" /> :
                              <Package className="h-5 w-5" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{po.number}</p>
                            <p className="text-xs text-[#757575]">{po.supplierName}</p>
                            <p className="text-xs text-[#757575]">{po.items.length} items</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold text-sm">{formatCurrency(po.total)}</p>
                            <Badge className={`text-[10px] ${getPOStatusColor(po.status)}`}>
                              {po.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleViewTracking(po)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="flex-1 m-0 overflow-auto p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
                <Input 
                  placeholder="Search orders..." 
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setOrderDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Order
              </Button>
            </div>

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
                    <TableHead>Delivery</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrders.map(po => (
                    <TableRow key={po.id}>
                      <TableCell className="font-medium">{po.number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{po.supplierName}</p>
                          {po.isAutoOrder && (
                            <Badge className="text-[10px] bg-purple-100 text-purple-700">Auto</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{po.items.length}</TableCell>
                      <TableCell>{formatCurrency(po.total)}</TableCell>
                      <TableCell>
                        <Badge className={getPOStatusColor(po.status)}>
                          {po.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{po.createdAt}</TableCell>
                      <TableCell>
                        {po.trackingNumber ? (
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-indigo-500" />
                            <span className="text-xs">{po.trackingNumber}</span>
                          </div>
                        ) : po.estimatedDelivery ? (
                          <span className="text-xs">{po.estimatedDelivery}</span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {po.status === 'pending_approval' && (
                            <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => handleApprovePO(po.id)}>
                              Approve
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleViewTracking(po)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
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
                          <p className="text-sm text-[#757575]">{po.supplierName}</p>
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
                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-[#757575] mb-1">
                          <span>Order Progress</span>
                          <span>
                            {po.status === 'in_transit' ? '90%' : po.status === 'dispatched' ? '75%' : '50%'}
                          </span>
                        </div>
                        <Progress value={
                          po.status === 'delivered' ? 100 :
                          po.status === 'in_transit' ? 90 :
                          po.status === 'dispatched' ? 75 :
                          po.status === 'confirmed' ? 50 :
                          25
                        } className="h-2" />
                      </div>

                      {/* Tracking Timeline */}
                      {po.trackingEvents && po.trackingEvents.length > 0 && (
                        <div className="space-y-3">
                          {po.trackingEvents.map((event, idx) => (
                            <div key={event.id} className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  event.status === 'completed' ? 'bg-green-100 text-green-600' :
                                  event.status === 'active' ? 'bg-blue-100 text-blue-600' :
                                  'bg-gray-100 text-gray-400'
                                }`}>
                                  {event.status === 'completed' ? <CheckCircle2 className="h-4 w-4" /> :
                                   event.status === 'active' ? <Truck className="h-4 w-4" /> :
                                   <Clock className="h-4 w-4" />}
                                </div>
                                {idx < po.trackingEvents!.length - 1 && (
                                  <div className={`w-0.5 h-8 ${
                                    event.status === 'completed' ? 'bg-green-200' : 'bg-gray-200'
                                  }`} />
                                )}
                              </div>
                              <div className="flex-1 pb-3">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-sm">{event.title}</p>
                                  {event.status === 'active' && (
                                    <Badge className="text-[10px] bg-blue-100 text-blue-700">Current</Badge>
                                  )}
                                </div>
                                {event.description && (
                                  <p className="text-xs text-[#757575]">{event.description}</p>
                                )}
                                <div className="flex items-center gap-2 text-xs text-[#757575] mt-1">
                                  <span>{new Date(event.timestamp).toLocaleString()}</span>
                                  {event.location && (
                                    <>
                                      <span>•</span>
                                      <MapPin className="h-3 w-3" />
                                      <span>{event.location}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {po.trackingNumber && (
                        <div className="mt-4 pt-4 border-t flex items-center justify-between">
                          <div>
                            <p className="text-xs text-[#757575]">Tracking Number</p>
                            <p className="font-medium">{po.trackingNumber}</p>
                          </div>
                          <Button variant="outline" size="sm">
                            <Globe className="h-4 w-4 mr-2" />
                            Track on Carrier
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Quotations Tab */}
        <TabsContent value="quotations" className="flex-1 m-0 overflow-auto p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Quotations & Price Requests</h3>
              <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setQuotationDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Request Quote
              </Button>
            </div>

            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h4 className="font-medium">No Active Quotations</h4>
                <p className="text-sm text-[#757575]">Request quotes from suppliers to compare prices</p>
                <Button variant="outline" className="mt-4" onClick={() => setQuotationDialogOpen(true)}>
                  <Send className="h-4 w-4 mr-2" />
                  Request Quote from Supplier
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="flex-1 m-0 overflow-auto p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Your Suppliers</h3>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
                <Input placeholder="Search suppliers..." className="pl-9" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suppliers.map(supplier => (
                <Card key={supplier.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-[#E0F2F1] flex items-center justify-center text-[#00897B] font-bold">
                          {supplier.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{supplier.name}</p>
                            {supplier.verified && (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <p className="text-xs text-[#757575] capitalize">{supplier.type}</p>
                        </div>
                      </div>
                      <Badge className={getTierColor(supplier.tier)} variant="outline">
                        {supplier.tier}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium">{supplier.rating.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[#757575]">
                        <MapPin className="h-4 w-4" />
                        {supplier.location.city}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs text-center mb-3">
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="font-medium">{supplier.stats.avgDeliveryDays}d</p>
                        <p className="text-[#757575]">Delivery</p>
                      </div>
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="font-medium">{supplier.stats.fulfillmentRate}%</p>
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
                      <Button size="sm" className="flex-1 bg-[#00897B] hover:bg-[#00695C]">
                        <Plus className="h-4 w-4 mr-1" />
                        Order
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Order Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
            <DialogDescription>
              Select items from inventory to order from suppliers
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Supplier Selection */}
            <div className="space-y-2">
              <Label>Select Supplier</Label>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
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

            {/* Items Selection */}
            <div className="space-y-2">
              <Label>Select Items to Order</Label>
              <ScrollArea className="h-64 border rounded-lg">
                <div className="p-2 space-y-2">
                  {reorderSuggestions.map(item => (
                    <div 
                      key={item.id} 
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedItems.includes(item.id) ? 'border-[#00897B] bg-[#E0F2F1]' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        if (selectedItems.includes(item.id)) {
                          setSelectedItems(prev => prev.filter(i => i !== item.id))
                        } else {
                          setSelectedItems(prev => [...prev, item.id])
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{item.productName}</p>
                          <p className="text-xs text-[#757575]">
                            Current: {item.currentStock} | Suggested: {item.suggestedQty}
                          </p>
                          {item.bulkDiscounts && item.bulkDiscounts.length > 0 && (
                            <p className="text-xs text-green-600">
                              Bulk discounts available: up to {item.bulkDiscounts[item.bulkDiscounts.length-1].discountPercent}% off
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm">{formatCurrency(item.estimatedCost)}</p>
                          <p className="text-xs text-red-600">{item.daysUntilStockout}d left</p>
                        </div>
                      </div>
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
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOrderDialogOpen(false)}>Cancel</Button>
            <Button 
              className="bg-[#00897B] hover:bg-[#00695C]"
              disabled={selectedItems.length === 0 || !selectedSupplier}
              onClick={handleCreateOrder}
            >
              Create Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tracking Detail Dialog */}
      <Dialog open={trackingDialogOpen} onOpenChange={setTrackingDialogOpen}>
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
                  {selectedPO.supplierName} • {selectedPO.items.length} items • {formatCurrency(selectedPO.total)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Order Progress</span>
                    <span>
                      {selectedPO.status === 'delivered' ? '100%' :
                       selectedPO.status === 'in_transit' ? '90%' :
                       selectedPO.status === 'dispatched' ? '75%' :
                       selectedPO.status === 'confirmed' ? '50%' : '25%'}
                    </span>
                  </div>
                  <Progress value={
                    selectedPO.status === 'delivered' ? 100 :
                    selectedPO.status === 'in_transit' ? 90 :
                    selectedPO.status === 'dispatched' ? 75 :
                    selectedPO.status === 'confirmed' ? 50 :
                    25
                  } className="h-3" />
                </div>

                {/* Status Steps */}
                <div className="flex justify-between">
                  {['Submitted', 'Confirmed', 'Processing', 'Dispatched', 'Delivered'].map((step, idx) => {
                    const statusOrder = ['draft', 'submitted', 'confirmed', 'processing', 'dispatched', 'in_transit', 'delivered']
                    const currentIdx = statusOrder.indexOf(selectedPO.status)
                    const stepIdx = idx + 1
                    const isComplete = currentIdx > stepIdx
                    const isCurrent = currentIdx === stepIdx || (selectedPO.status === 'in_transit' && step === 'Dispatched')
                    
                    return (
                      <div key={step} className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isComplete ? 'bg-green-100 text-green-600' :
                          isCurrent ? 'bg-[#00897B] text-white' :
                          'bg-gray-100 text-gray-400'
                        }`}>
                          {isComplete ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                        </div>
                        <p className={`text-xs mt-1 ${isCurrent ? 'font-medium' : 'text-[#757575]'}`}>
                          {step}
                        </p>
                      </div>
                    )
                  })}
                </div>

                {/* Tracking Timeline */}
                {selectedPO.trackingEvents && selectedPO.trackingEvents.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Tracking History</h4>
                    <div className="space-y-3">
                      {selectedPO.trackingEvents.map((event, idx) => (
                        <div key={event.id} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              event.status === 'completed' ? 'bg-green-100 text-green-600' :
                              event.status === 'active' ? 'bg-blue-100 text-blue-600' :
                              'bg-gray-100 text-gray-400'
                            }`}>
                              {event.status === 'completed' ? <CheckCircle2 className="h-4 w-4" /> :
                               event.status === 'active' ? <Truck className="h-4 w-4" /> :
                               <Clock className="h-4 w-4" />}
                            </div>
                            {idx < selectedPO.trackingEvents!.length - 1 && (
                              <div className={`w-0.5 h-8 ${
                                event.status === 'completed' ? 'bg-green-200' : 'bg-gray-200'
                              }`} />
                            )}
                          </div>
                          <div className="flex-1 pb-3">
                            <p className="font-medium text-sm">{event.title}</p>
                            {event.description && (
                              <p className="text-xs text-[#757575]">{event.description}</p>
                            )}
                            <div className="flex items-center gap-2 text-xs text-[#757575] mt-1">
                              <span>{new Date(event.timestamp).toLocaleString()}</span>
                              {event.location && (
                                <>
                                  <span>•</span>
                                  <MapPin className="h-3 w-3" />
                                  <span>{event.location}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Order Items */}
                <div>
                  <h4 className="font-medium mb-3">Order Items</h4>
                  <div className="border rounded-lg">
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
                        {selectedPO.items.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Delivery Info */}
                {selectedPO.trackingNumber && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[#757575]">Tracking Number</p>
                        <p className="font-medium">{selectedPO.trackingNumber}</p>
                      </div>
                      <Button variant="outline">
                        <Globe className="h-4 w-4 mr-2" />
                        Track on Carrier
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setTrackingDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reorder Dialog */}
      <Dialog open={reorderDialogOpen} onOpenChange={setReorderDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reorder Suggestions</DialogTitle>
            <DialogDescription>
              Items that need to be reordered based on current stock levels and usage
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {reorderSuggestions.map(item => (
                  <div key={item.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{item.productName}</p>
                          <Badge className={
                            item.urgency === 'critical' ? 'bg-red-100 text-red-700' :
                            item.urgency === 'high' ? 'bg-amber-100 text-amber-700' :
                            'bg-yellow-100 text-yellow-700'
                          }>
                            {item.urgency}
                          </Badge>
                        </div>
                        <p className="text-sm text-[#757575]">SKU: {item.sku}</p>
                        <p className="text-sm text-[#757575]">
                          Current Stock: {item.currentStock} | Reorder Point: {item.reorderPoint}
                        </p>
                        <p className="text-sm text-[#757575]">
                          Supplier: {item.bestSupplier} | Lead Time: {item.leadTime} days
                        </p>
                        {item.bulkDiscounts && item.bulkDiscounts.length > 0 && (
                          <div className="mt-2 flex gap-2">
                            {item.bulkDiscounts.map((d, idx) => (
                              <Badge key={idx} variant="outline" className="text-green-600 border-green-200">
                                Buy {d.minQty}+ save {d.discountPercent}%
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(item.estimatedCost)}</p>
                        <p className="text-sm text-red-600">{item.daysUntilStockout} days until stockout</p>
                        <Button size="sm" className="mt-2 bg-[#00897B] hover:bg-[#00695C]">
                          Order Now
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReorderDialogOpen(false)}>Close</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]">
              Order All Critical Items
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quotation Dialog */}
      <Dialog open={quotationDialogOpen} onOpenChange={setQuotationDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request Quotation</DialogTitle>
            <DialogDescription>
              Send a quote request to suppliers for pricing and availability
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Supplier</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Choose suppliers" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Items to Quote</Label>
              <div className="border rounded-lg p-4">
                <p className="text-sm text-[#757575]">
                  Add items from your inventory that you want pricing for. You can specify quantities and any special requirements.
                </p>
                <Button variant="outline" size="sm" className="mt-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Items
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Required By</Label>
              <Input type="date" />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea placeholder="Any special requirements or questions..." />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setQuotationDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]">
              <Send className="h-4 w-4 mr-2" />
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default GroSupplyProEnhanced
