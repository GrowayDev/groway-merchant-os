'use client'

import { useState, useEffect } from 'react'
import {
  Package,
  Truck,
  Eye,
  CheckCircle2,
  Clock,
  MapPin,
  Search,
  RefreshCw,
  DollarSign,
  MessageSquare,
  Send,
  X,
  Check,
  AlertCircle,
  Calendar,
  Phone,
  Mail,
  Building2,
  Box,
  FileText,
  Printer,
  ArrowRight,
  Timer,
  XCircle,
  Route,
  Users,
  Download,
  Layers,
  Trash2,
  FileSpreadsheet
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { useSupplierAuth } from '../layout'

// Extended order data with full details
interface OrderItem {
  id: string
  sku: string
  name: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number
  status: 'pending' | 'confirmed' | 'picked' | 'dispatched' | 'delivered'
}

interface OrderMessage {
  id: string
  sender: 'supplier' | 'buyer' | 'system'
  senderName: string
  content: string
  timestamp: string
  type: 'message' | 'status_change' | 'note'
}

interface Order {
  id: string
  poNumber: string
  merchant: {
    id: string
    name: string
    contactPerson: string
    phone: string
    email: string
    address: string
    city: string
    province: string
  }
  items: OrderItem[]
  totalItems: number
  subtotal: number
  vat: number
  total: number
  status: 'pending' | 'confirmed' | 'processing' | 'dispatched' | 'in_transit' | 'delivered' | 'cancelled'
  paymentStatus: 'pending' | 'partial' | 'paid'
  createdAt: string
  confirmedAt?: string
  dispatchedAt?: string
  deliveredAt?: string
  requestedDelivery: string
  trackingNumber?: string
  courier?: string
  estimatedArrival?: string
  deliveryNotes?: string
  messages: OrderMessage[]
  timeline: {
    status: string
    timestamp: string
    note?: string
  }[]
}

// Bulk dispatch tracking info per order
interface BulkDispatchInfo {
  orderId: string
  trackingNumber: string
  courier: string
}

const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    poNumber: 'PO-2026-00123',
    merchant: {
      id: 'MER-001',
      name: 'QuickSpar Foods',
      contactPerson: 'John Mokoena',
      phone: '+27 82 123 4567',
      email: 'john@quickspar.co.za',
      address: '123 Main Street',
      city: 'Johannesburg',
      province: 'Gauteng'
    },
    items: [
      { id: 'ITM-001', sku: 'FP-001', name: 'Fresh Produce Bundle', description: 'Mixed seasonal vegetables', quantity: 10, unit: 'pack', unitPrice: 150.00, totalPrice: 1500.00, status: 'pending' },
      { id: 'ITM-002', sku: 'DR-001', name: 'Full Cream Milk 2L', description: 'Fresh dairy milk', quantity: 20, unit: 'bottle', unitPrice: 32.50, totalPrice: 650.00, status: 'pending' },
      { id: 'ITM-003', sku: 'DR-002', name: 'Cheddar Cheese 1kg', description: 'Aged cheddar block', quantity: 5, unit: 'block', unitPrice: 145.00, totalPrice: 725.00, status: 'pending' },
      { id: 'ITM-004', sku: 'BV-001', name: 'Orange Juice 1L', description: 'Freshly squeezed', quantity: 15, unit: 'bottle', unitPrice: 28.00, totalPrice: 420.00, status: 'pending' },
      { id: 'ITM-005', sku: 'CL-001', name: 'Industrial Cleaner 5L', description: 'Multi-surface cleaner', quantity: 3, unit: 'container', unitPrice: 85.00, totalPrice: 255.00, status: 'pending' },
    ],
    totalItems: 53,
    subtotal: 3550.00,
    vat: 532.50,
    total: 4082.50,
    status: 'pending',
    paymentStatus: 'pending',
    createdAt: '2026-01-15T08:30:00',
    requestedDelivery: '2026-01-18',
    messages: [
      { id: 'MSG-001', sender: 'buyer', senderName: 'John Mokoena', content: 'Please confirm availability. We need delivery by Friday morning.', timestamp: '2026-01-15T08:35:00', type: 'message' },
      { id: 'MSG-002', sender: 'system', senderName: 'System', content: 'Order received and awaiting supplier confirmation', timestamp: '2026-01-15T08:30:00', type: 'status_change' },
    ],
    timeline: [
      { status: 'Order Placed', timestamp: '2026-01-15T08:30:00', note: 'Purchase order received' }
    ]
  },
  {
    id: 'ORD-002',
    poNumber: 'PO-2026-00124',
    merchant: {
      id: 'MER-002',
      name: 'Fresh Market Cafe',
      contactPerson: 'Sarah van der Berg',
      phone: '+27 83 234 5678',
      email: 'sarah@freshmarket.co.za',
      address: '45 Sandton Drive',
      city: 'Sandton',
      province: 'Gauteng'
    },
    items: [
      { id: 'ITM-006', sku: 'FP-002', name: 'Organic Salad Mix', description: 'Pre-washed mixed greens', quantity: 25, unit: 'pack', unitPrice: 45.00, totalPrice: 1125.00, status: 'confirmed' },
      { id: 'ITM-007', sku: 'FP-003', name: 'Cherry Tomatoes 500g', description: 'Fresh vine tomatoes', quantity: 15, unit: 'punnet', unitPrice: 38.00, totalPrice: 570.00, status: 'confirmed' },
      { id: 'ITM-008', sku: 'DR-003', name: 'Greek Yogurt 1kg', description: 'Plain Greek yogurt', quantity: 10, unit: 'tub', unitPrice: 65.00, totalPrice: 650.00, status: 'confirmed' },
    ],
    totalItems: 50,
    subtotal: 2345.00,
    vat: 351.75,
    total: 2696.75,
    status: 'confirmed',
    paymentStatus: 'pending',
    createdAt: '2026-01-14T14:00:00',
    confirmedAt: '2026-01-14T15:30:00',
    requestedDelivery: '2026-01-17',
    messages: [
      { id: 'MSG-003', sender: 'supplier', senderName: 'Demo Supplier', content: 'Order confirmed. All items in stock.', timestamp: '2026-01-14T15:30:00', type: 'message' },
    ],
    timeline: [
      { status: 'Order Placed', timestamp: '2026-01-14T14:00:00' },
      { status: 'Confirmed', timestamp: '2026-01-14T15:30:00', note: 'All items available' }
    ]
  },
  {
    id: 'ORD-003',
    poNumber: 'PO-2026-00125',
    merchant: {
      id: 'MER-003',
      name: 'City Butchery',
      contactPerson: 'Peter Nkosi',
      phone: '+27 84 345 6789',
      email: 'peter@citybutchery.co.za',
      address: '78 Corner Street',
      city: 'Pretoria',
      province: 'Gauteng'
    },
    items: [
      { id: 'ITM-009', sku: 'PK-001', name: 'Vacuum Pack Bags 500pcs', description: 'Food-grade vacuum bags', quantity: 2, unit: 'box', unitPrice: 450.00, totalPrice: 900.00, status: 'dispatched' },
      { id: 'ITM-010', sku: 'CL-002', name: 'Meat Safe Sanitizer 5L', description: 'Food-safe sanitizer', quantity: 4, unit: 'container', unitPrice: 120.00, totalPrice: 480.00, status: 'dispatched' },
    ],
    totalItems: 6,
    subtotal: 1380.00,
    vat: 207.00,
    total: 1587.00,
    status: 'dispatched',
    paymentStatus: 'pending',
    createdAt: '2026-01-13T09:00:00',
    confirmedAt: '2026-01-13T10:00:00',
    dispatchedAt: '2026-01-14T11:00:00',
    requestedDelivery: '2026-01-16',
    trackingNumber: 'TRK-789456123',
    courier: 'DHL Express',
    estimatedArrival: '2026-01-16T10:00:00',
    messages: [
      { id: 'MSG-004', sender: 'supplier', senderName: 'Demo Supplier', content: 'Your order has been dispatched via DHL Express. Tracking: TRK-789456123', timestamp: '2026-01-14T11:05:00', type: 'message' },
    ],
    timeline: [
      { status: 'Order Placed', timestamp: '2026-01-13T09:00:00' },
      { status: 'Confirmed', timestamp: '2026-01-13T10:00:00' },
      { status: 'Dispatched', timestamp: '2026-01-14T11:00:00', note: 'Via DHL Express' }
    ]
  },
  {
    id: 'ORD-004',
    poNumber: 'PO-2026-00126',
    merchant: {
      id: 'MER-004',
      name: 'Metro Supermarket',
      contactPerson: 'Linda Sithole',
      phone: '+27 85 456 7890',
      email: 'linda@metro.co.za',
      address: '200 Victoria Street',
      city: 'Durban',
      province: 'KwaZulu-Natal'
    },
    items: [
      { id: 'ITM-011', sku: 'FP-004', name: 'Banana Box 18kg', description: 'Ripe bananas', quantity: 5, unit: 'box', unitPrice: 280.00, totalPrice: 1400.00, status: 'delivered' },
      { id: 'ITM-012', sku: 'FP-005', name: 'Apple Box 15kg', description: 'Royal Gala apples', quantity: 3, unit: 'box', unitPrice: 320.00, totalPrice: 960.00, status: 'delivered' },
    ],
    totalItems: 8,
    subtotal: 2360.00,
    vat: 354.00,
    total: 2714.00,
    status: 'delivered',
    paymentStatus: 'paid',
    createdAt: '2026-01-10T11:00:00',
    confirmedAt: '2026-01-10T14:00:00',
    dispatchedAt: '2026-01-11T08:00:00',
    deliveredAt: '2026-01-12T14:00:00',
    requestedDelivery: '2026-01-13',
    trackingNumber: 'TRK-456789012',
    courier: 'The Courier Guy',
    messages: [
      { id: 'MSG-005', sender: 'buyer', senderName: 'Linda Sithole', content: 'Delivery received in good condition. Thank you!', timestamp: '2026-01-12T14:30:00', type: 'message' },
    ],
    timeline: [
      { status: 'Order Placed', timestamp: '2026-01-10T11:00:00' },
      { status: 'Confirmed', timestamp: '2026-01-10T14:00:00' },
      { status: 'Dispatched', timestamp: '2026-01-11T08:00:00', note: 'Via The Courier Guy' },
      { status: 'Delivered', timestamp: '2026-01-12T14:00:00' }
    ]
  },
  {
    id: 'ORD-005',
    poNumber: 'PO-2026-00127',
    merchant: {
      id: 'MER-005',
      name: 'Corner Cafe',
      contactPerson: 'Mike Thompson',
      phone: '+27 86 567 8901',
      email: 'mike@cornercafe.co.za',
      address: '5 Beach Road',
      city: 'Cape Town',
      province: 'Western Cape'
    },
    items: [
      { id: 'ITM-013', sku: 'BV-002', name: 'Coca-Cola 2L', description: 'Case of 12', quantity: 2, unit: 'case', unitPrice: 180.00, totalPrice: 360.00, status: 'pending' },
      { id: 'ITM-014', sku: 'SN-001', name: 'Potato Chips Mixed', description: 'Assorted flavors', quantity: 5, unit: 'box', unitPrice: 95.00, totalPrice: 475.00, status: 'pending' },
    ],
    totalItems: 7,
    subtotal: 835.00,
    vat: 125.25,
    total: 960.25,
    status: 'pending',
    paymentStatus: 'pending',
    createdAt: '2026-01-15T09:00:00',
    requestedDelivery: '2026-01-19',
    messages: [],
    timeline: [
      { status: 'Order Placed', timestamp: '2026-01-15T09:00:00' }
    ]
  }
]

export default function SupplierOrdersPage() {
  const { supplier } = useSupplierAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [activeTab, setActiveTab] = useState('details')

  // Bulk selection state
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set())

  // Dialogs
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [dispatchDialogOpen, setDispatchDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [messageDialogOpen, setMessageDialogOpen] = useState(false)
  
  // Bulk dialogs
  const [bulkConfirmDialogOpen, setBulkConfirmDialogOpen] = useState(false)
  const [bulkDispatchDialogOpen, setBulkDispatchDialogOpen] = useState(false)
  const [bulkCancelDialogOpen, setBulkCancelDialogOpen] = useState(false)

  // Form data
  const [trackingNumber, setTrackingNumber] = useState('')
  const [courierName, setCourierName] = useState('')
  const [estimatedArrival, setEstimatedArrival] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [dispatchNotes, setDispatchNotes] = useState('')

  // Bulk form data
  const [bulkCourier, setBulkCourier] = useState('')
  const [bulkTrackingPrefix, setBulkTrackingPrefix] = useState('')
  const [bulkEstimatedArrival, setBulkEstimatedArrival] = useState('')
  const [bulkCancelReason, setBulkCancelReason] = useState('')
  const [bulkDispatchInfos, setBulkDispatchInfos] = useState<BulkDispatchInfo[]>([])

  useEffect(() => {
    const timer = setTimeout(() => {
      setOrders(mockOrders)
      setIsLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [supplier])

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.merchant.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatCurrency = (amount: number) => 
    `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-ZA', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const statusConfig: Record<string, { color: string; bgColor: string; label: string; icon: typeof Package }> = {
    pending: { color: 'text-amber-700', bgColor: 'bg-amber-100', label: 'Pending Confirmation', icon: Clock },
    confirmed: { color: 'text-blue-700', bgColor: 'bg-blue-100', label: 'Confirmed', icon: Check },
    processing: { color: 'text-purple-700', bgColor: 'bg-purple-100', label: 'Processing', icon: Package },
    dispatched: { color: 'text-indigo-700', bgColor: 'bg-indigo-100', label: 'Dispatched', icon: Truck },
    in_transit: { color: 'text-cyan-700', bgColor: 'bg-cyan-100', label: 'In Transit', icon: Route },
    delivered: { color: 'text-green-700', bgColor: 'bg-green-100', label: 'Delivered', icon: CheckCircle2 },
    cancelled: { color: 'text-red-700', bgColor: 'bg-red-100', label: 'Cancelled', icon: XCircle },
  }

  // Bulk selection handlers
  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) {
        newSet.delete(orderId)
      } else {
        newSet.add(orderId)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedOrderIds.size === filteredOrders.length) {
      setSelectedOrderIds(new Set())
    } else {
      setSelectedOrderIds(new Set(filteredOrders.map(o => o.id)))
    }
  }

  const clearSelection = () => {
    setSelectedOrderIds(new Set())
  }

  const selectedOrders = orders.filter(o => selectedOrderIds.has(o.id))

  // Get orders that can be confirmed (pending status)
  const confirmableOrders = selectedOrders.filter(o => o.status === 'pending')
  const nonConfirmableOrders = selectedOrders.filter(o => o.status !== 'pending')

  // Get orders that can be dispatched (confirmed status)
  const dispatchableOrders = selectedOrders.filter(o => o.status === 'confirmed')
  const nonDispatchableOrders = selectedOrders.filter(o => o.status !== 'confirmed')

  // Get orders that can be cancelled
  const cancellableOrders = selectedOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled')
  const nonCancellableOrders = selectedOrders.filter(o => o.status === 'delivered' || o.status === 'cancelled')

  const confirmOrder = () => {
    if (!selectedOrder) return
    setOrders(prev => prev.map(order => {
      if (order.id === selectedOrder.id) {
        return {
          ...order,
          status: 'confirmed' as const,
          confirmedAt: new Date().toISOString(),
          items: order.items.map(item => ({ ...item, status: 'confirmed' as const })),
          timeline: [
            ...order.timeline,
            { status: 'Confirmed', timestamp: new Date().toISOString(), note: 'Order confirmed by supplier' }
          ]
        }
      }
      return order
    }))
    setConfirmDialogOpen(false)
    setSelectedOrder(null)
  }

  const dispatchOrder = () => {
    if (!selectedOrder || !trackingNumber || !courierName) return
    setOrders(prev => prev.map(order => {
      if (order.id === selectedOrder.id) {
        return {
          ...order,
          status: 'dispatched' as const,
          dispatchedAt: new Date().toISOString(),
          trackingNumber,
          courier: courierName,
          estimatedArrival,
          items: order.items.map(item => ({ ...item, status: 'dispatched' as const })),
          timeline: [
            ...order.timeline,
            { status: 'Dispatched', timestamp: new Date().toISOString(), note: `Via ${courierName} - ${trackingNumber}` }
          ],
          messages: [
            ...order.messages,
            {
              id: `MSG-${Date.now()}`,
              sender: 'supplier' as const,
              senderName: supplier?.name || 'Supplier',
              content: `Order dispatched via ${courierName}. Tracking number: ${trackingNumber}`,
              timestamp: new Date().toISOString(),
              type: 'message' as const
            }
          ]
        }
      }
      return order
    }))
    setDispatchDialogOpen(false)
    setTrackingNumber('')
    setCourierName('')
    setEstimatedArrival('')
    setDispatchNotes('')
  }

  const rejectOrder = () => {
    if (!selectedOrder || !rejectReason) return
    setOrders(prev => prev.map(order => {
      if (order.id === selectedOrder.id) {
        return {
          ...order,
          status: 'cancelled' as const,
          timeline: [
            ...order.timeline,
            { status: 'Cancelled', timestamp: new Date().toISOString(), note: rejectReason }
          ]
        }
      }
      return order
    }))
    setRejectDialogOpen(false)
    setRejectReason('')
    setSelectedOrder(null)
  }

  const sendMessage = () => {
    if (!selectedOrder || !newMessage.trim()) return
    setOrders(prev => prev.map(order => {
      if (order.id === selectedOrder.id) {
        return {
          ...order,
          messages: [
            ...order.messages,
            {
              id: `MSG-${Date.now()}`,
              sender: 'supplier' as const,
              senderName: supplier?.name || 'Supplier',
              content: newMessage,
              timestamp: new Date().toISOString(),
              type: 'message' as const
            }
          ]
        }
      }
      return order
    }))
    setNewMessage('')
  }

  // Bulk confirm orders
  const bulkConfirmOrders = () => {
    const confirmableIds = new Set(confirmableOrders.map(o => o.id))
    setOrders(prev => prev.map(order => {
      if (confirmableIds.has(order.id)) {
        return {
          ...order,
          status: 'confirmed' as const,
          confirmedAt: new Date().toISOString(),
          items: order.items.map(item => ({ ...item, status: 'confirmed' as const })),
          timeline: [
            ...order.timeline,
            { status: 'Confirmed', timestamp: new Date().toISOString(), note: 'Order confirmed by supplier (bulk action)' }
          ]
        }
      }
      return order
    }))
    setBulkConfirmDialogOpen(false)
    clearSelection()
  }

  // Open bulk dispatch dialog and initialize dispatch info
  const openBulkDispatchDialog = (open: boolean) => {
    if (open && dispatchableOrders.length > 0) {
      setBulkDispatchInfos(dispatchableOrders.map(o => ({
        orderId: o.id,
        trackingNumber: '',
        courier: bulkCourier || ''
      })))
    }
    setBulkDispatchDialogOpen(open)
  }

  // Update all bulk dispatch infos when bulk courier changes
  const handleBulkCourierChange = (courier: string) => {
    setBulkCourier(courier)
    setBulkDispatchInfos(prev => prev.map(info => ({ ...info, courier })))
  }

  // Update single dispatch info
  const updateDispatchInfo = (orderId: string, field: 'trackingNumber' | 'courier', value: string) => {
    setBulkDispatchInfos(prev => prev.map(info => 
      info.orderId === orderId ? { ...info, [field]: value } : info
    ))
  }

  // Bulk dispatch orders
  const bulkDispatchOrders = () => {
    const dispatchInfosMap = new Map(bulkDispatchInfos.map(i => [i.orderId, i]))
    const dispatchableIds = new Set(dispatchableOrders.map(o => o.id))
    
    setOrders(prev => prev.map(order => {
      if (dispatchableIds.has(order.id)) {
        const info = dispatchInfosMap.get(order.id)
        return {
          ...order,
          status: 'dispatched' as const,
          dispatchedAt: new Date().toISOString(),
          trackingNumber: info?.trackingNumber || '',
          courier: info?.courier || bulkCourier,
          estimatedArrival: bulkEstimatedArrival,
          items: order.items.map(item => ({ ...item, status: 'dispatched' as const })),
          timeline: [
            ...order.timeline,
            { status: 'Dispatched', timestamp: new Date().toISOString(), note: `Via ${info?.courier || bulkCourier} - ${info?.trackingNumber}` }
          ]
        }
      }
      return order
    }))
    setBulkDispatchDialogOpen(false)
    setBulkCourier('')
    setBulkTrackingPrefix('')
    setBulkEstimatedArrival('')
    setBulkDispatchInfos([])
    clearSelection()
  }

  // Bulk cancel orders
  const bulkCancelOrders = () => {
    const cancellableIds = new Set(cancellableOrders.map(o => o.id))
    setOrders(prev => prev.map(order => {
      if (cancellableIds.has(order.id)) {
        return {
          ...order,
          status: 'cancelled' as const,
          timeline: [
            ...order.timeline,
            { status: 'Cancelled', timestamp: new Date().toISOString(), note: bulkCancelReason }
          ]
        }
      }
      return order
    }))
    setBulkCancelDialogOpen(false)
    setBulkCancelReason('')
    clearSelection()
  }

  // Export orders to CSV
  const exportOrdersToCSV = () => {
    const ordersToExport = selectedOrders.length > 0 ? selectedOrders : filteredOrders
    
    // Create CSV content
    const headers = [
      'PO Number',
      'Merchant',
      'Contact Person',
      'Email',
      'Phone',
      'Address',
      'City',
      'Province',
      'Status',
      'Payment Status',
      'Total',
      'Subtotal',
      'VAT',
      'Created At',
      'Requested Delivery',
      'Tracking Number',
      'Courier',
      'Items Count',
      'Items'
    ]
    
    const rows = ordersToExport.map(order => [
      order.poNumber,
      order.merchant.name,
      order.merchant.contactPerson,
      order.merchant.email,
      order.merchant.phone,
      `"${order.merchant.address}"`,
      order.merchant.city,
      order.merchant.province,
      order.status,
      order.paymentStatus,
      order.total.toString(),
      order.subtotal.toString(),
      order.vat.toString(),
      order.createdAt,
      order.requestedDelivery,
      order.trackingNumber || '',
      order.courier || '',
      order.items.length.toString(),
      `"${order.items.map(i => `${i.name} (${i.quantity} x ${formatCurrency(i.unitPrice)})`).join(', ')}"`
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `orders_export_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  // Print packing slips
  const printPackingSlips = () => {
    // Mock printing - in real app would generate PDFs
    alert(`Printing packing slips for ${selectedOrders.length} selected orders. This would generate printable PDF packing slips in a real implementation.`)
  }

  const stats = {
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    processing: orders.filter(o => o.status === 'processing' || o.status === 'dispatched').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-[#00897B] border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Orders</h1>
          <p className="text-[#757575]">Manage purchase orders from confirmation to delivery</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
            <Input 
              placeholder="Search orders..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="pl-9 w-64" 
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="dispatched">Dispatched</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedOrderIds.size > 0 && (
        <Card className="bg-[#E0F2F1] border-[#00897B]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#00897B] flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#1A1A1A]">{selectedOrderIds.size} orders selected</p>
                    <p className="text-xs text-[#757575]">Select orders below to perform bulk actions</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={clearSelection}
                  className="border-gray-300"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear Selection
                </Button>
                <Separator orientation="vertical" className="h-8" />
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setBulkConfirmDialogOpen(true)}
                  disabled={confirmableOrders.length === 0}
                  className="border-[#00897B] text-[#00897B] hover:bg-[#00897B] hover:text-white disabled:opacity-50"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Confirm ({confirmableOrders.length})
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => openBulkDispatchDialog(true)}
                  disabled={dispatchableOrders.length === 0}
                  className="border-purple-500 text-purple-600 hover:bg-purple-500 hover:text-white disabled:opacity-50"
                >
                  <Truck className="h-4 w-4 mr-1" />
                  Dispatch ({dispatchableOrders.length})
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={printPackingSlips}
                  disabled={selectedOrderIds.size === 0}
                  className="border-gray-300"
                >
                  <Printer className="h-4 w-4 mr-1" />
                  Print Slips
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={exportOrdersToCSV}
                  disabled={selectedOrderIds.size === 0}
                  className="border-gray-300"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setBulkCancelDialogOpen(true)}
                  disabled={cancellableOrders.length === 0}
                  className="border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Cancel ({cancellableOrders.length})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-amber-400">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-[#1A1A1A]">{stats.pending}</p>
                <p className="text-sm text-[#757575]">Pending Confirmation</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-400">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-[#1A1A1A]">{stats.confirmed}</p>
                <p className="text-sm text-[#757575]">Confirmed</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Check className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-400">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-[#1A1A1A]">{stats.processing}</p>
                <p className="text-sm text-[#757575]">Processing/Dispatched</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Truck className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-400">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-[#1A1A1A]">{stats.delivered}</p>
                <p className="text-sm text-[#757575]">Delivered</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Purchase Orders ({filteredOrders.length})</CardTitle>
            {selectedOrderIds.size > 0 && (
              <Badge className="bg-[#00897B] text-white">
                {selectedOrderIds.size} selected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <div className="divide-y">
              {/* Header Row for Selection */}
              <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 border-b font-medium text-sm text-[#757575]">
                <Checkbox
                  checked={selectedOrderIds.size === filteredOrders.length && filteredOrders.length > 0}
                  onCheckedChange={toggleSelectAll}
                  className="data-[state=checked]:bg-[#00897B] data-[state=checked]:border-[#00897B]"
                />
                <span className="w-8">Select all on page</span>
              </div>
              
              {filteredOrders.map((order) => {
                const config = statusConfig[order.status]
                const StatusIcon = config.icon
                const isSelected = selectedOrderIds.has(order.id)
                return (
                  <div 
                    key={order.id} 
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-all ${isSelected ? 'bg-[#E0F2F1]/50' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleOrderSelection(order.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-3 data-[state=checked]:bg-[#00897B] data-[state=checked]:border-[#00897B]"
                        />
                        <div 
                          className={`w-12 h-12 rounded-lg ${config.bgColor} flex items-center justify-center cursor-pointer`}
                          onClick={() => setSelectedOrder(order)}
                        >
                          <StatusIcon className={`h-6 w-6 ${config.color}`} />
                        </div>
                        <div onClick={() => setSelectedOrder(order)}>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-[#1A1A1A]">{order.poNumber}</p>
                            <Badge className={`${config.bgColor} ${config.color} border-0`}>
                              {config.label}
                            </Badge>
                            {order.trackingNumber && (
                              <Badge variant="outline" className="text-xs">
                                <Truck className="h-3 w-3 mr-1" />
                                {order.trackingNumber}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-[#757575]">
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5" />
                              {order.merchant.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Box className="h-3.5 w-3.5" />
                              {order.items.length} items
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              Deliver by {new Date(order.requestedDelivery).toLocaleDateString('en-ZA')}
                            </span>
                          </div>
                          {order.messages.length > 0 && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-[#00897B]">
                              <MessageSquare className="h-3 w-3" />
                              {order.messages.length} messages
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-[#1A1A1A]">{formatCurrency(order.total)}</p>
                        <p className="text-xs text-[#757575]">{formatDate(order.createdAt)}</p>
                        {order.status === 'pending' && (
                          <Button 
                            size="sm" 
                            className="mt-2 bg-[#00897B] hover:bg-[#00695C]"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedOrder(order)
                              setConfirmDialogOpen(true)
                            }}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Confirm
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder && !confirmDialogOpen && !dispatchDialogOpen && !rejectDialogOpen && !messageDialogOpen} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl">{selectedOrder?.poNumber}</DialogTitle>
                <DialogDescription>
                  {selectedOrder?.merchant.name} • {selectedOrder?.items.length} items
                </DialogDescription>
              </div>
              {selectedOrder && (
                <Badge className={`${statusConfig[selectedOrder.status].bgColor} ${statusConfig[selectedOrder.status].color} border-0 text-sm px-3 py-1`}>
                  {statusConfig[selectedOrder.status].label}
                </Badge>
              )}
            </div>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="details">Order Details</TabsTrigger>
              <TabsTrigger value="items">Items ({selectedOrder?.items.length})</TabsTrigger>
              <TabsTrigger value="messages">Messages ({selectedOrder?.messages.length})</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-6">
                {/* Merchant Info */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Buyer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p className="font-medium">{selectedOrder?.merchant.name}</p>
                    <p className="text-[#757575]">{selectedOrder?.merchant.contactPerson}</p>
                    <div className="flex items-center gap-2 text-[#757575]">
                      <Phone className="h-3.5 w-3.5" />
                      {selectedOrder?.merchant.phone}
                    </div>
                    <div className="flex items-center gap-2 text-[#757575]">
                      <Mail className="h-3.5 w-3.5" />
                      {selectedOrder?.merchant.email}
                    </div>
                    <div className="flex items-start gap-2 text-[#757575]">
                      <MapPin className="h-3.5 w-3.5 mt-0.5" />
                      <div>
                        {selectedOrder?.merchant.address}<br />
                        {selectedOrder?.merchant.city}, {selectedOrder?.merchant.province}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Summary */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Order Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#757575]">Order Date</span>
                      <span>{selectedOrder && formatDate(selectedOrder.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#757575]">Requested Delivery</span>
                      <span>{selectedOrder && new Date(selectedOrder.requestedDelivery).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                    </div>
                    {selectedOrder?.trackingNumber && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-[#757575]">Courier</span>
                          <span>{selectedOrder.courier}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#757575]">Tracking #</span>
                          <span className="font-mono">{selectedOrder.trackingNumber}</span>
                        </div>
                      </>
                    )}
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-[#757575]">Subtotal</span>
                      <span>{selectedOrder && formatCurrency(selectedOrder.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#757575]">VAT (15%)</span>
                      <span>{selectedOrder && formatCurrency(selectedOrder.vat)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-[#00897B]">{selectedOrder && formatCurrency(selectedOrder.total)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="items" className="mt-4">
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {selectedOrder?.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#E0F2F1] flex items-center justify-center">
                          <Package className="h-5 w-5 text-[#00897B]" />
                        </div>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-[#757575]">{item.sku} • {item.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="font-medium">{item.quantity}</p>
                          <p className="text-xs text-[#757575]">{item.unit}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-[#757575]">{formatCurrency(item.unitPrice)} each</p>
                          <p className="font-semibold">{formatCurrency(item.totalPrice)}</p>
                        </div>
                        <Badge variant="outline" className={statusConfig[item.status]?.color}>
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="messages" className="mt-4">
              <div className="space-y-4">
                <ScrollArea className="h-[250px]">
                  <div className="space-y-3 pr-4">
                    {selectedOrder?.messages.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={`flex ${msg.sender === 'supplier' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] rounded-lg p-3 ${
                          msg.sender === 'supplier' 
                            ? 'bg-[#E0F2F1] text-[#1A1A1A]' 
                            : msg.sender === 'system'
                            ? 'bg-gray-100 text-[#757575]'
                            : 'bg-gray-200 text-[#1A1A1A]'
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium">
                              {msg.sender === 'supplier' ? 'You' : msg.senderName}
                            </span>
                            <span className="text-xs text-[#757575]">
                              {formatDate(msg.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    {selectedOrder?.messages.length === 0 && (
                      <div className="text-center py-8 text-[#757575]">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No messages yet</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Type a message..." 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <Button onClick={sendMessage} className="bg-[#00897B] hover:bg-[#00695C]">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="mt-4">
              <ScrollArea className="h-[300px]">
                <div className="relative pl-6">
                  {selectedOrder?.timeline.map((event, index) => (
                    <div key={index} className="relative pb-6">
                      {/* Line */}
                      {index < selectedOrder.timeline.length - 1 && (
                        <div className="absolute left-[7px] top-3 bottom-0 w-0.5 bg-gray-200" />
                      )}
                      {/* Dot */}
                      <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full ${
                        index === 0 ? 'bg-[#00897B]' : 'bg-gray-300'
                      }`} />
                      {/* Content */}
                      <div className="ml-6">
                        <p className="font-medium">{event.status}</p>
                        <p className="text-xs text-[#757575]">{formatDate(event.timestamp)}</p>
                        {event.note && (
                          <p className="text-sm text-[#757575] mt-1">{event.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <div className="flex items-center justify-between w-full">
              <div className="flex gap-2">
                {selectedOrder?.status === 'pending' && (
                  <>
                    <Button 
                      variant="outline" 
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => setRejectDialogOpen(true)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button 
                      className="bg-[#00897B] hover:bg-[#00695C]"
                      onClick={() => setConfirmDialogOpen(true)}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Confirm Order
                    </Button>
                  </>
                )}
                {selectedOrder?.status === 'confirmed' && (
                  <Button 
                    className="bg-[#00897B] hover:bg-[#00695C]"
                    onClick={() => setDispatchDialogOpen(true)}
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Dispatch Order
                  </Button>
                )}
              </div>
              <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Order Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to confirm order {selectedOrder?.poNumber}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-[#E0F2F1] rounded-lg p-4 mb-4">
              <p className="font-medium">{selectedOrder?.merchant.name}</p>
              <p className="text-sm text-[#757575]">{selectedOrder?.items.length} items • {selectedOrder && formatCurrency(selectedOrder.total)}</p>
            </div>
            <p className="text-sm text-[#757575]">
              By confirming, you agree to fulfill this order by the requested delivery date.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmOrder} className="bg-[#00897B] hover:bg-[#00695C]">
              <Check className="h-4 w-4 mr-2" />
              Confirm Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dispatch Order Dialog */}
      <Dialog open={dispatchDialogOpen} onOpenChange={setDispatchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dispatch Order</DialogTitle>
            <DialogDescription>
              Enter shipping details for {selectedOrder?.poNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Courier / Logistics Provider *</Label>
              <Select value={courierName} onValueChange={setCourierName}>
                <SelectTrigger>
                  <SelectValue placeholder="Select courier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DHL Express">DHL Express</SelectItem>
                  <SelectItem value="The Courier Guy">The Courier Guy</SelectItem>
                  <SelectItem value="Fastway">Fastway Couriers</SelectItem>
                  <SelectItem value="RAM Hand to Hand">RAM Hand to Hand</SelectItem>
                  <SelectItem value="Own Delivery">Own Delivery Fleet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tracking Number *</Label>
              <Input 
                value={trackingNumber} 
                onChange={(e) => setTrackingNumber(e.target.value)} 
                placeholder="Enter tracking number" 
              />
            </div>
            <div>
              <Label>Estimated Delivery Date</Label>
              <Input 
                type="date" 
                value={estimatedArrival} 
                onChange={(e) => setEstimatedArrival(e.target.value)} 
              />
            </div>
            <div>
              <Label>Delivery Notes (Optional)</Label>
              <Textarea 
                value={dispatchNotes}
                onChange={(e) => setDispatchNotes(e.target.value)}
                placeholder="Any special delivery instructions..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDispatchDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={dispatchOrder} 
              disabled={!trackingNumber || !courierName}
              className="bg-[#00897B] hover:bg-[#00695C]"
            >
              <Truck className="h-4 w-4 mr-2" />
              Confirm Dispatch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Order Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Order</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting {selectedOrder?.poNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Reason for Rejection *</Label>
              <Select value={rejectReason} onValueChange={setRejectReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Out of stock">Items out of stock</SelectItem>
                  <SelectItem value="Cannot meet delivery date">Cannot meet delivery date</SelectItem>
                  <SelectItem value="Price discrepancy">Price discrepancy</SelectItem>
                  <SelectItem value="Product discontinued">Product discontinued</SelectItem>
                  <SelectItem value="Other">Other reason</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 inline mr-2" />
              This action cannot be undone. The buyer will be notified.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={rejectOrder} 
              disabled={!rejectReason}
              variant="destructive"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Confirm Dialog */}
      <Dialog open={bulkConfirmDialogOpen} onOpenChange={setBulkConfirmDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-[#00897B]" />
              Bulk Confirm Orders
            </DialogTitle>
            <DialogDescription>
              Confirm multiple orders at once
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-green-700">{confirmableOrders.length}</p>
                <p className="text-sm text-green-600">Orders will be confirmed</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-amber-700">{nonConfirmableOrders.length}</p>
                <p className="text-sm text-amber-600">Orders skipped (wrong status)</p>
              </div>
            </div>

            {/* Orders to confirm */}
            {confirmableOrders.length > 0 && (
              <div>
                <Label className="mb-2 block">Orders to be confirmed</Label>
                <ScrollArea className="h-[200px] border rounded-lg">
                  <div className="divide-y">
                    {confirmableOrders.map(order => (
                      <div key={order.id} className="flex items-center justify-between p-3">
                        <div>
                          <p className="font-medium">{order.poNumber}</p>
                          <p className="text-xs text-[#757575]">{order.merchant.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(order.total)}</p>
                          <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Warnings */}
            {nonConfirmableOrders.length > 0 && (
              <div className="bg-amber-50 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">Some orders cannot be confirmed</p>
                    <p className="text-sm text-amber-700 mt-1">
                      The following orders are not in "Pending" status and will be skipped:
                    </p>
                    <ul className="mt-2 text-sm text-amber-700 space-y-1">
                      {nonConfirmableOrders.map(order => (
                        <li key={order.id} className="flex items-center gap-2">
                          <span>{order.poNumber}</span>
                          <Badge variant="outline" className="text-xs">
                            {order.status}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={bulkConfirmOrders}
              disabled={confirmableOrders.length === 0}
              className="bg-[#00897B] hover:bg-[#00695C]"
            >
              <Check className="h-4 w-4 mr-2" />
              Confirm {confirmableOrders.length} Orders
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Dispatch Dialog */}
      <Dialog open={bulkDispatchDialogOpen} onOpenChange={setBulkDispatchDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-purple-600" />
              Bulk Dispatch Orders
            </DialogTitle>
            <DialogDescription>
              Set shipping details for multiple orders
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-purple-700">{dispatchableOrders.length}</p>
                <p className="text-sm text-purple-600">Orders will be dispatched</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-amber-700">{nonDispatchableOrders.length}</p>
                <p className="text-sm text-amber-600">Orders skipped (wrong status)</p>
              </div>
            </div>

            {/* Common settings */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <p className="font-medium text-sm text-[#757575]">Common Settings (applies to all orders)</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Default Courier</Label>
                  <Select value={bulkCourier} onValueChange={handleBulkCourierChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select courier for all" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DHL Express">DHL Express</SelectItem>
                      <SelectItem value="The Courier Guy">The Courier Guy</SelectItem>
                      <SelectItem value="Fastway">Fastway Couriers</SelectItem>
                      <SelectItem value="RAM Hand to Hand">RAM Hand to Hand</SelectItem>
                      <SelectItem value="Own Delivery">Own Delivery Fleet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Estimated Delivery Date</Label>
                  <Input 
                    type="date" 
                    value={bulkEstimatedArrival} 
                    onChange={(e) => setBulkEstimatedArrival(e.target.value)} 
                  />
                </div>
              </div>
            </div>

            {/* Individual order tracking */}
            {dispatchableOrders.length > 0 && (
              <div>
                <Label className="mb-2 block">Individual Tracking Numbers (required for each order)</Label>
                <ScrollArea className="h-[250px] border rounded-lg">
                  <div className="divide-y">
                    {dispatchableOrders.map(order => {
                      const dispatchInfo = bulkDispatchInfos.find(i => i.orderId === order.id)
                      return (
                        <div key={order.id} className="p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{order.poNumber}</p>
                              <p className="text-xs text-[#757575]">{order.merchant.name} • {formatCurrency(order.total)}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Select 
                              value={dispatchInfo?.courier || bulkCourier} 
                              onValueChange={(val) => updateDispatchInfo(order.id, 'courier', val)}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Courier" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="DHL Express">DHL Express</SelectItem>
                                <SelectItem value="The Courier Guy">The Courier Guy</SelectItem>
                                <SelectItem value="Fastway">Fastway Couriers</SelectItem>
                                <SelectItem value="RAM Hand to Hand">RAM Hand to Hand</SelectItem>
                                <SelectItem value="Own Delivery">Own Delivery Fleet</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input 
                              placeholder="Tracking Number *"
                              value={dispatchInfo?.trackingNumber || ''}
                              onChange={(e) => updateDispatchInfo(order.id, 'trackingNumber', e.target.value)}
                              className="h-8"
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Warnings */}
            {nonDispatchableOrders.length > 0 && (
              <div className="bg-amber-50 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">Some orders cannot be dispatched</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Only "Confirmed" orders can be dispatched. The following will be skipped:
                    </p>
                    <ul className="mt-2 text-sm text-amber-700 space-y-1">
                      {nonDispatchableOrders.map(order => (
                        <li key={order.id} className="flex items-center gap-2">
                          <span>{order.poNumber}</span>
                          <Badge variant="outline" className="text-xs">
                            {order.status}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDispatchDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={bulkDispatchOrders}
              disabled={dispatchableOrders.length === 0 || !bulkDispatchInfos.every(i => i.trackingNumber && i.courier)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Truck className="h-4 w-4 mr-2" />
              Dispatch {dispatchableOrders.length} Orders
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Cancel Dialog */}
      <Dialog open={bulkCancelDialogOpen} onOpenChange={setBulkCancelDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Bulk Cancel Orders
            </DialogTitle>
            <DialogDescription>
              Cancel multiple orders at once
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-red-700">{cancellableOrders.length}</p>
                <p className="text-sm text-red-600">Orders will be cancelled</p>
              </div>
              <div className="bg-gray-100 rounded-lg p-4">
                <p className="text-2xl font-bold text-gray-700">{nonCancellableOrders.length}</p>
                <p className="text-sm text-gray-600">Orders skipped (delivered/cancelled)</p>
              </div>
            </div>

            {/* Cancellation reason */}
            <div>
              <Label>Reason for Cancellation *</Label>
              <Select value={bulkCancelReason} onValueChange={setBulkCancelReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Out of stock">Items out of stock</SelectItem>
                  <SelectItem value="Cannot meet delivery date">Cannot meet delivery date</SelectItem>
                  <SelectItem value="Customer request">Customer request</SelectItem>
                  <SelectItem value="Price discrepancy">Price discrepancy</SelectItem>
                  <SelectItem value="Product discontinued">Product discontinued</SelectItem>
                  <SelectItem value="Other">Other reason</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Orders to cancel */}
            {cancellableOrders.length > 0 && (
              <div>
                <Label className="mb-2 block">Orders to be cancelled</Label>
                <ScrollArea className="h-[150px] border rounded-lg">
                  <div className="divide-y">
                    {cancellableOrders.map(order => (
                      <div key={order.id} className="flex items-center justify-between p-3">
                        <div>
                          <p className="font-medium">{order.poNumber}</p>
                          <p className="text-xs text-[#757575]">{order.merchant.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(order.total)}</p>
                          <Badge className={`${statusConfig[order.status].bgColor} ${statusConfig[order.status].color} border-0 text-xs`}>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Warning */}
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">This action cannot be undone</p>
                  <p className="text-sm text-red-700 mt-1">
                    All selected orders will be cancelled and the buyers will be notified.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkCancelDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={bulkCancelOrders}
              disabled={cancellableOrders.length === 0 || !bulkCancelReason}
              variant="destructive"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel {cancellableOrders.length} Orders
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
