'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Search,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Link2,
  Unlink,
  Settings,
  Play,
  Pause,
  TestTube,
  ChevronRight,
  Building2,
  ShoppingCart,
  Truck,
  Wifi,
  WifiOff,
  Activity,
  FileText,
  DollarSign,
  Package,
  Calendar,
  ExternalLink,
  Eye,
  Edit,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Info,
  Zap,
  Database,
  Globe,
  CreditCard,
  Receipt,
  Users,
  MapPin,
  Car,
  Utensils,
  Timer,
} from 'lucide-react'

// =====================================================
// TYPES
// =====================================================

interface Connection {
  id: string
  provider: string
  providerName: string
  providerLogo?: string
  status: 'pending' | 'connected' | 'error' | 'disconnected'
  displayName?: string
  externalOrgName?: string
  syncEnabled: boolean
  syncFrequency: string
  lastSyncAt?: string
  lastSyncStatus?: string
  lastSyncError?: string
  mappingCount?: number
  productMappingCount?: number
  menuMappingCount?: number
  syncLogCount?: number
  pendingOrders?: number
  activeOrders?: number
  webhookVerified?: boolean
  commissionRate?: number
  createdAt: string
}

interface SyncLog {
  id: string
  connectionId: string
  syncType: string
  direction: string
  status: string
  startedAt: string
  completedAt?: string
  durationMs?: number
  recordsProcessed: number
  recordsCreated: number
  recordsUpdated: number
  recordsFailed: number
  errorMessage?: string
  IntegrationConnection?: {
    provider: string
    displayName?: string
  }
}

interface DeliveryOrder {
  id: string
  platform: string
  externalOrderId: string
  externalOrderNumber?: string
  orderType: string
  orderStatus: string
  totalAmount: number
  customerName?: string
  orderCreatedAt: string
  DeliveryOrderItem?: {
    id: string
    itemName: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }[]
}

// =====================================================
// MOCK DATA
// =====================================================

const mockAccountingConnections: Connection[] = [
  {
    id: 'ACCT-1',
    provider: 'xero',
    providerName: 'Xero',
    status: 'connected',
    displayName: 'Xero - Main Business',
    externalOrgName: 'Demo Business Pty Ltd',
    syncEnabled: true,
    syncFrequency: 'hourly',
    lastSyncAt: new Date(Date.now() - 3600000).toISOString(),
    lastSyncStatus: 'success',
    mappingCount: 45,
    syncLogCount: 128,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'ACCT-2',
    provider: 'sage',
    providerName: 'Sage',
    status: 'pending',
    displayName: 'Sage - Pending Setup',
    syncEnabled: false,
    syncFrequency: 'daily',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  }
]

const mockEcommerceConnections: Connection[] = [
  {
    id: 'ECOM-1',
    provider: 'shopify',
    providerName: 'Shopify',
    status: 'connected',
    displayName: 'Shopify - Online Store',
    externalOrgName: 'demo-store.myshopify.com',
    syncEnabled: true,
    syncFrequency: 'hourly',
    lastSyncAt: new Date(Date.now() - 1800000).toISOString(),
    lastSyncStatus: 'success',
    productMappingCount: 156,
    syncLogCount: 89,
    webhookVerified: true,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'ECOM-2',
    provider: 'woocommerce',
    providerName: 'WooCommerce',
    status: 'error',
    displayName: 'WooCommerce - Main Site',
    externalOrgName: 'mystore.co.za',
    syncEnabled: true,
    syncFrequency: 'hourly',
    lastSyncAt: new Date(Date.now() - 86400000).toISOString(),
    lastSyncStatus: 'failed',
    lastSyncError: 'API rate limit exceeded',
    productMappingCount: 89,
    syncLogCount: 45,
    webhookVerified: true,
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
  }
]

const mockDeliveryConnections: Connection[] = [
  {
    id: 'DELIV-1',
    provider: 'ubereats',
    providerName: 'Uber Eats',
    status: 'connected',
    displayName: 'Uber Eats - Main Location',
    externalOrgName: 'Burger Palace',
    syncEnabled: true,
    syncFrequency: 'realtime',
    lastSyncAt: new Date(Date.now() - 60000).toISOString(),
    lastSyncStatus: 'success',
    menuMappingCount: 67,
    pendingOrders: 3,
    activeOrders: 5,
    webhookVerified: true,
    commissionRate: 30,
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'DELIV-2',
    provider: 'mrd',
    providerName: 'Mr D Food',
    status: 'connected',
    displayName: 'Mr D - All Locations',
    externalOrgName: 'Burger Palace SA',
    syncEnabled: true,
    syncFrequency: 'realtime',
    lastSyncAt: new Date(Date.now() - 120000).toISOString(),
    lastSyncStatus: 'success',
    menuMappingCount: 67,
    pendingOrders: 1,
    activeOrders: 2,
    webhookVerified: true,
    commissionRate: 25,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  }
]

const mockSyncLogs: SyncLog[] = [
  {
    id: 'SYNC-1',
    connectionId: 'ACCT-1',
    syncType: 'incremental',
    direction: 'bidirectional',
    status: 'completed',
    startedAt: new Date(Date.now() - 3600000).toISOString(),
    completedAt: new Date(Date.now() - 3599000).toISOString(),
    durationMs: 1000,
    recordsProcessed: 45,
    recordsCreated: 2,
    recordsUpdated: 12,
    recordsFailed: 0,
    IntegrationConnection: { provider: 'xero', displayName: 'Xero' }
  },
  {
    id: 'SYNC-2',
    connectionId: 'ECOM-1',
    syncType: 'full',
    direction: 'outbound',
    status: 'completed',
    startedAt: new Date(Date.now() - 7200000).toISOString(),
    completedAt: new Date(Date.now() - 7180000).toISOString(),
    durationMs: 20000,
    recordsProcessed: 156,
    recordsCreated: 3,
    recordsUpdated: 24,
    recordsFailed: 1,
    IntegrationConnection: { provider: 'shopify', displayName: 'Shopify' }
  },
  {
    id: 'SYNC-3',
    connectionId: 'ECOM-2',
    syncType: 'incremental',
    direction: 'inbound',
    status: 'failed',
    startedAt: new Date(Date.now() - 86400000).toISOString(),
    completedAt: new Date(Date.now() - 8639000).toISOString(),
    durationMs: 1000,
    recordsProcessed: 0,
    recordsCreated: 0,
    recordsUpdated: 0,
    recordsFailed: 1,
    errorMessage: 'API rate limit exceeded',
    IntegrationConnection: { provider: 'woocommerce', displayName: 'WooCommerce' }
  }
]

const mockDeliveryOrders: DeliveryOrder[] = [
  {
    id: 'DO-1',
    platform: 'ubereats',
    externalOrderId: 'UE-12345',
    externalOrderNumber: '#12345',
    orderType: 'delivery',
    orderStatus: 'preparing',
    totalAmount: 245.00,
    customerName: 'John D.',
    orderCreatedAt: new Date(Date.now() - 600000).toISOString(),
    DeliveryOrderItem: [
      { id: 'ITEM-1', itemName: 'Burger Combo', quantity: 2, unitPrice: 89.99, totalPrice: 179.98 },
      { id: 'ITEM-2', itemName: 'Coca-Cola 500ml', quantity: 2, unitPrice: 22.50, totalPrice: 45.00 }
    ]
  },
  {
    id: 'DO-2',
    platform: 'mrd',
    externalOrderId: 'MRD-67890',
    externalOrderNumber: '#67890',
    orderType: 'pickup',
    orderStatus: 'pending',
    totalAmount: 189.50,
    customerName: 'Sarah M.',
    orderCreatedAt: new Date(Date.now() - 300000).toISOString(),
    DeliveryOrderItem: [
      { id: 'ITEM-3', itemName: 'Chicken Wings', quantity: 1, unitPrice: 69.99, totalPrice: 69.99 },
      { id: 'ITEM-4', itemName: 'Pizza Margherita', quantity: 1, unitPrice: 119.99, totalPrice: 119.99 }
    ]
  }
]

// =====================================================
// HELPER FUNCTIONS
// =====================================================

const getStatusBadge = (status: string) => {
  const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', color: string }> = {
    connected: { variant: 'default', color: 'bg-green-500' },
    pending: { variant: 'secondary', color: 'bg-yellow-500' },
    error: { variant: 'destructive', color: 'bg-red-500' },
    disconnected: { variant: 'outline', color: 'bg-gray-500' },
    completed: { variant: 'default', color: 'bg-green-500' },
    failed: { variant: 'destructive', color: 'bg-red-500' },
    running: { variant: 'secondary', color: 'bg-blue-500' },
  }
  const config = variants[status] || variants.pending
  return (
    <Badge variant={config.variant} className={`${config.color} text-white`}>
      {status}
    </Badge>
  )
}

const formatTimeAgo = (date: string) => {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount)
}

// =====================================================
// COMPONENT
// =====================================================

export function IntegrationsView() {
  // State
  const [activeTab, setActiveTab] = useState('dashboard')
  const [accountingConnections, setAccountingConnections] = useState<Connection[]>(mockAccountingConnections)
  const [ecommerceConnections, setEcommerceConnections] = useState<Connection[]>(mockEcommerceConnections)
  const [deliveryConnections, setDeliveryConnections] = useState<Connection[]>(mockDeliveryConnections)
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>(mockSyncLogs)
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrder[]>(mockDeliveryOrders)
  
  // Dialogs
  const [connectDialogOpen, setConnectDialogOpen] = useState(false)
  const [connectionDetailOpen, setConnectionDetailOpen] = useState(false)
  const [orderDetailOpen, setOrderDetailOpen] = useState(false)
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
  
  // Selected items
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null)
  const [connectType, setConnectType] = useState<'accounting' | 'ecommerce' | 'delivery'>('accounting')
  const [connectProvider, setConnectProvider] = useState('')
  
  // Form state
  const [connectForm, setConnectForm] = useState({
    storeUrl: '',
    apiKey: '',
    apiSecret: '',
    storeName: ''
  })

  // Computed values
  const totalConnections = accountingConnections.length + ecommerceConnections.length + deliveryConnections.length
  const connectedCount = [...accountingConnections, ...ecommerceConnections, ...deliveryConnections].filter(c => c.status === 'connected').length
  const errorCount = [...accountingConnections, ...ecommerceConnections, ...deliveryConnections].filter(c => c.status === 'error').length
  const pendingDeliveryOrders = deliveryOrders.filter(o => o.orderStatus === 'pending').length

  // Handlers
  const handleConnect = (type: 'accounting' | 'ecommerce' | 'delivery') => {
    setConnectType(type)
    setConnectProvider('')
    setConnectForm({ storeUrl: '', apiKey: '', apiSecret: '', storeName: '' })
    setConnectDialogOpen(true)
  }

  const handleConnectionClick = (connection: Connection) => {
    setSelectedConnection(connection)
    setConnectionDetailOpen(true)
  }

  const handleOrderClick = (order: DeliveryOrder) => {
    setSelectedOrder(order)
    setOrderDetailOpen(true)
  }

  const handleTestConnection = async (connectionId: string) => {
    // Mock test - in production, this would call the API
    console.log('Testing connection:', connectionId)
    return true
  }

  const handleSync = async (connectionId: string, type: 'accounting' | 'ecommerce' | 'delivery') => {
    // Mock sync - in production, this would call the API
    console.log('Syncing:', connectionId, type)
  }

  const handleDisconnect = async (connectionId: string) => {
    // Mock disconnect
    console.log('Disconnecting:', connectionId)
    setConnectionDetailOpen(false)
  }

  // Render Dashboard
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[#00897B]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575]">Total Connections</p>
                <p className="text-2xl font-bold">{totalConnections}</p>
              </div>
              <Link2 className="h-8 w-8 text-[#00897B] opacity-50" />
            </div>
            <p className="text-xs text-green-600 mt-2">{connectedCount} active</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575]">Accounting</p>
                <p className="text-2xl font-bold">{accountingConnections.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575]">E-commerce</p>
                <p className="text-2xl font-bold">{ecommerceConnections.length}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575]">Delivery</p>
                <p className="text-2xl font-bold">{deliveryConnections.length}</p>
              </div>
              <Truck className="h-8 w-8 text-orange-500 opacity-50" />
            </div>
            {pendingDeliveryOrders > 0 && (
              <p className="text-xs text-orange-600 mt-2">{pendingDeliveryOrders} pending orders</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Error Alert */}
      {errorCount > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="font-medium text-red-800">Integration Errors Detected</p>
                <p className="text-sm text-red-600">
                  {errorCount} integration{errorCount > 1 ? 's' : ''} require attention. Check connection settings.
                </p>
              </div>
              <Button variant="outline" size="sm" className="ml-auto" onClick={() => setActiveTab('logs')}>
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="flex gap-2 flex-wrap">
        <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => handleConnect('accounting')}>
          <Plus className="h-4 w-4 mr-2" />Add Accounting
        </Button>
        <Button variant="outline" onClick={() => handleConnect('ecommerce')}>
          <Plus className="h-4 w-4 mr-2" />Add E-commerce
        </Button>
        <Button variant="outline" onClick={() => handleConnect('delivery')}>
          <Plus className="h-4 w-4 mr-2" />Add Delivery
        </Button>
      </div>

      {/* Connected Services */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Accounting */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4" />Accounting
              </CardTitle>
              <Badge variant="outline">{accountingConnections.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {accountingConnections.length === 0 ? (
              <Button variant="outline" className="w-full" onClick={() => handleConnect('accounting')}>
                <Plus className="h-4 w-4 mr-2" />Connect
              </Button>
            ) : (
              <div className="space-y-2">
                {accountingConnections.map(conn => (
                  <div
                    key={conn.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                    onClick={() => handleConnectionClick(conn)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${conn.status === 'connected' ? 'bg-green-500' : conn.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                      <div>
                        <p className="text-sm font-medium">{conn.providerName}</p>
                        <p className="text-xs text-[#757575]">{conn.externalOrgName || 'Not configured'}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#757575]" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* E-commerce */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />E-commerce
              </CardTitle>
              <Badge variant="outline">{ecommerceConnections.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {ecommerceConnections.length === 0 ? (
              <Button variant="outline" className="w-full" onClick={() => handleConnect('ecommerce')}>
                <Plus className="h-4 w-4 mr-2" />Connect
              </Button>
            ) : (
              <div className="space-y-2">
                {ecommerceConnections.map(conn => (
                  <div
                    key={conn.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                    onClick={() => handleConnectionClick(conn)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${conn.status === 'connected' ? 'bg-green-500' : conn.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                      <div>
                        <p className="text-sm font-medium">{conn.providerName}</p>
                        <p className="text-xs text-[#757575]">{conn.externalOrgName || 'Not configured'}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#757575]" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delivery */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Truck className="h-4 w-4" />Delivery
              </CardTitle>
              <Badge variant="outline">{deliveryConnections.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {deliveryConnections.length === 0 ? (
              <Button variant="outline" className="w-full" onClick={() => handleConnect('delivery')}>
                <Plus className="h-4 w-4 mr-2" />Connect
              </Button>
            ) : (
              <div className="space-y-2">
                {deliveryConnections.map(conn => (
                  <div
                    key={conn.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                    onClick={() => handleConnectionClick(conn)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${conn.status === 'connected' ? 'bg-green-500' : conn.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                      <div>
                        <p className="text-sm font-medium">{conn.providerName}</p>
                        <p className="text-xs text-[#757575]">
                          {conn.pendingOrders && conn.pendingOrders > 0 
                            ? `${conn.pendingOrders} pending` 
                            : conn.externalOrgName || 'Connected'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#757575]" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Sync Activity */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />Recent Sync Activity
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-[#00897B]" onClick={() => setActiveTab('logs')}>
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {syncLogs.slice(0, 5).map(log => (
              <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {log.status === 'completed' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : log.status === 'failed' ? (
                    <XCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{log.IntegrationConnection?.displayName || log.IntegrationConnection?.provider}</p>
                    <p className="text-xs text-[#757575]">
                      {log.syncType} sync • {log.direction}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#757575]">{formatTimeAgo(log.startedAt)}</p>
                  <p className="text-xs text-[#757575]">{log.recordsProcessed} records</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Delivery Orders Preview */}
      {deliveryOrders.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Utensils className="h-4 w-4" />Active Delivery Orders
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-[#00897B]" onClick={() => setActiveTab('delivery-orders')}>
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {deliveryOrders.slice(0, 3).map(order => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                  onClick={() => handleOrderClick(order)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      order.orderStatus === 'pending' ? 'bg-yellow-500' :
                      order.orderStatus === 'preparing' ? 'bg-blue-500' :
                      'bg-green-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium">{order.externalOrderNumber || order.externalOrderId}</p>
                      <p className="text-xs text-[#757575]">{order.platform} • {order.customerName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(order.totalAmount)}</p>
                    <Badge variant="outline" className="text-xs">{order.orderStatus}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  // Render Sync Logs
  const renderSyncLogs = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Sync Logs</h2>
          <p className="text-sm text-[#757575]">View synchronization history and status</p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="running">Running</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="accounting">Accounting</SelectItem>
              <SelectItem value="ecommerce">E-commerce</SelectItem>
              <SelectItem value="delivery">Delivery</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Records</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {syncLogs.map(log => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {log.IntegrationConnection?.provider === 'xero' && <Building2 className="h-4 w-4 text-blue-500" />}
                      {log.IntegrationConnection?.provider === 'shopify' && <ShoppingCart className="h-4 w-4 text-purple-500" />}
                      {log.IntegrationConnection?.provider === 'woocommerce' && <ShoppingCart className="h-4 w-4 text-purple-500" />}
                      {log.IntegrationConnection?.provider === 'ubereats' && <Truck className="h-4 w-4 text-orange-500" />}
                      {log.IntegrationConnection?.provider === 'mrd' && <Truck className="h-4 w-4 text-orange-500" />}
                      <span className="font-medium">{log.IntegrationConnection?.displayName || log.IntegrationConnection?.provider}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.syncType}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(log.status)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <span className="text-green-600">+{log.recordsCreated}</span>
                      {' / '}
                      <span className="text-blue-600">↑{log.recordsUpdated}</span>
                      {log.recordsFailed > 0 && (
                        <>
                          {' / '}
                          <span className="text-red-600">✗{log.recordsFailed}</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.durationMs ? `${(log.durationMs / 1000).toFixed(1)}s` : '-'}
                  </TableCell>
                  <TableCell className="text-[#757575]">
                    {formatTimeAgo(log.startedAt)}
                  </TableCell>
                  <TableCell>
                    {log.errorMessage && (
                      <div className="flex items-center gap-1 text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-xs truncate max-w-[150px]">{log.errorMessage}</span>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )

  // Render Delivery Orders
  const renderDeliveryOrders = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Delivery Orders</h2>
          <p className="text-sm text-[#757575]">Orders from connected delivery platforms</p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="ubereats">Uber Eats</SelectItem>
              <SelectItem value="mrd">Mr D Food</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="preparing">Preparing</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Orders Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Pending</p>
            <p className="text-2xl font-bold">{deliveryOrders.filter(o => o.orderStatus === 'pending').length}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Preparing</p>
            <p className="text-2xl font-bold">{deliveryOrders.filter(o => o.orderStatus === 'preparing').length}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Ready</p>
            <p className="text-2xl font-bold">{deliveryOrders.filter(o => o.orderStatus === 'ready').length}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#00897B]">
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Today's Total</p>
            <p className="text-2xl font-bold">{formatCurrency(deliveryOrders.reduce((sum, o) => sum + o.totalAmount, 0))}</p>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveryOrders.map(order => (
                <TableRow key={order.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleOrderClick(order)}>
                  <TableCell className="font-medium">{order.externalOrderNumber || order.externalOrderId}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{order.platform}</Badge>
                  </TableCell>
                  <TableCell className="capitalize">{order.orderType}</TableCell>
                  <TableCell>{order.customerName || '-'}</TableCell>
                  <TableCell>{order.DeliveryOrderItem?.length || 0} items</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(order.totalAmount)}</TableCell>
                  <TableCell>{getStatusBadge(order.orderStatus)}</TableCell>
                  <TableCell className="text-[#757575]">{formatTimeAgo(order.orderCreatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleOrderClick(order); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )

  // Render Settings
  const renderSettings = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Integration Settings</h2>
        <p className="text-sm text-[#757575]">Configure global integration preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Sync Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Auto-sync enabled</p>
                <p className="text-xs text-[#757575]">Automatically sync data with connected platforms</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Sync frequency</p>
                <p className="text-xs text-[#757575]">How often to sync data</p>
              </div>
              <Select defaultValue="hourly">
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">Real-time</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Retry failed syncs</p>
                <p className="text-xs text-[#757575]">Automatically retry failed sync operations</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Sync errors</p>
                <p className="text-xs text-[#757575]">Notify when sync operations fail</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">New orders</p>
                <p className="text-xs text-[#757575]">Notify for new delivery orders</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Connection issues</p>
                <p className="text-xs text-[#757575]">Notify when connections fail</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Webhook Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <div className="flex gap-2">
                <Input value={`${process.env.BASE_URL || 'https://demo.local'}/api/integrations/webhook`} readOnly />
                <Button variant="outline">Copy</Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Verify webhook signatures</p>
                <p className="text-xs text-[#757575]">Validate incoming webhook payloads</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Data Retention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Keep sync logs</p>
                <p className="text-xs text-[#757575]">How long to keep sync history</p>
              </div>
              <Select defaultValue="90">
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Archive old orders</p>
                <p className="text-xs text-[#757575]">Move completed orders to archive</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Integrations</h1>
          <p className="text-[#757575]">Manage connections to external services and platforms</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="logs">
              Sync Logs
              {errorCount > 0 && (
                <Badge variant="destructive" className="ml-2">{errorCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="delivery-orders">
              Delivery Orders
              {pendingDeliveryOrders > 0 && (
                <Badge variant="secondary" className="ml-2">{pendingDeliveryOrders}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">{renderDashboard()}</TabsContent>
          <TabsContent value="logs">{renderSyncLogs()}</TabsContent>
          <TabsContent value="delivery-orders">{renderDeliveryOrders()}</TabsContent>
          <TabsContent value="settings">{renderSettings()}</TabsContent>
        </Tabs>

        {/* Connect Dialog */}
        <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Connect Integration</DialogTitle>
              <DialogDescription>
                Select a provider and enter your credentials to connect.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select value={connectProvider} onValueChange={setConnectProvider}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {connectType === 'accounting' && (
                      <>
                        <SelectItem value="xero">Xero</SelectItem>
                        <SelectItem value="sage">Sage</SelectItem>
                        <SelectItem value="quickbooks">QuickBooks</SelectItem>
                      </>
                    )}
                    {connectType === 'ecommerce' && (
                      <>
                        <SelectItem value="shopify">Shopify</SelectItem>
                        <SelectItem value="woocommerce">WooCommerce</SelectItem>
                      </>
                    )}
                    {connectType === 'delivery' && (
                      <>
                        <SelectItem value="ubereats">Uber Eats</SelectItem>
                        <SelectItem value="mrd">Mr D Food</SelectItem>
                        <SelectItem value="doordash">DoorDash</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {(connectType === 'ecommerce' || connectType === 'delivery') && (
                <div className="space-y-2">
                  <Label>Store URL</Label>
                  <Input
                    placeholder={connectType === 'ecommerce' ? 'your-store.myshopify.com' : 'your-business'}
                    value={connectForm.storeUrl}
                    onChange={(e) => setConnectForm({ ...connectForm, storeUrl: e.target.value })}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>API Key</Label>
                <Input
                  placeholder="Enter your API key"
                  value={connectForm.apiKey}
                  onChange={(e) => setConnectForm({ ...connectForm, apiKey: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>API Secret</Label>
                <Input
                  type="password"
                  placeholder="Enter your API secret"
                  value={connectForm.apiSecret}
                  onChange={(e) => setConnectForm({ ...connectForm, apiSecret: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input
                  placeholder="My Store"
                  value={connectForm.storeName}
                  onChange={(e) => setConnectForm({ ...connectForm, storeName: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConnectDialogOpen(false)}>Cancel</Button>
              <Button className="bg-[#00897B] hover:bg-[#00695C]">Connect</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Connection Detail Dialog */}
        <Dialog open={connectionDetailOpen} onOpenChange={setConnectionDetailOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedConnection?.providerName}</DialogTitle>
              <DialogDescription>
                {selectedConnection?.externalOrgName || 'Connection details'}
              </DialogDescription>
            </DialogHeader>
            {selectedConnection && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#757575]">Status</span>
                  {getStatusBadge(selectedConnection.status)}
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#757575]">Auto-sync</span>
                  <Switch checked={selectedConnection.syncEnabled} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#757575]">Sync Frequency</span>
                  <Badge variant="outline">{selectedConnection.syncFrequency}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#757575]">Last Sync</span>
                  <span className="text-sm">{selectedConnection.lastSyncAt ? formatTimeAgo(selectedConnection.lastSyncAt) : 'Never'}</span>
                </div>
                {selectedConnection.lastSyncError && (
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-800 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {selectedConnection.lastSyncError}
                    </p>
                  </div>
                )}
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-2xl font-bold">{selectedConnection.mappingCount || selectedConnection.productMappingCount || selectedConnection.menuMappingCount || 0}</p>
                    <p className="text-xs text-[#757575]">Mappings</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-2xl font-bold">{selectedConnection.syncLogCount || 0}</p>
                    <p className="text-xs text-[#757575]">Sync Logs</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => selectedConnection && handleTestConnection(selectedConnection.id)}>
                <TestTube className="h-4 w-4 mr-2" />Test
              </Button>
              <Button variant="outline" onClick={() => selectedConnection && handleSync(selectedConnection.id, 'accounting')}>
                <RefreshCw className="h-4 w-4 mr-2" />Sync Now
              </Button>
              <Button variant="destructive" onClick={() => selectedConnection && handleDisconnect(selectedConnection.id)}>
                <Unlink className="h-4 w-4 mr-2" />Disconnect
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Order Detail Dialog */}
        <Dialog open={orderDetailOpen} onOpenChange={setOrderDetailOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Order {selectedOrder?.externalOrderNumber || selectedOrder?.externalOrderId}</DialogTitle>
              <DialogDescription>
                {selectedOrder?.platform} • {selectedOrder?.orderType}
              </DialogDescription>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#757575]">Status</span>
                  {getStatusBadge(selectedOrder.orderStatus)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#757575]">Customer</span>
                  <span className="text-sm font-medium">{selectedOrder.customerName || 'N/A'}</span>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-2">Order Items</p>
                  <div className="space-y-2">
                    {selectedOrder.DeliveryOrderItem?.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <p className="text-sm font-medium">{item.itemName}</p>
                          <p className="text-xs text-[#757575]">x{item.quantity}</p>
                        </div>
                        <p className="text-sm font-medium">{formatCurrency(item.totalPrice)}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total</span>
                  <span className="text-lg font-bold">{formatCurrency(selectedOrder.totalAmount)}</span>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setOrderDetailOpen(false)}>Close</Button>
              <Button className="bg-[#00897B] hover:bg-[#00695C]">Accept Order</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
