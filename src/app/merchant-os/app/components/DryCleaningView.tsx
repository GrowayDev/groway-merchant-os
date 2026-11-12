'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Shirt,
  Clock,
  Users,
  FileText,
  DollarSign,
  Package,
  Calendar,
  Phone,
  MapPin,
  Truck,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  Download,
  Printer,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  History,
  Building2,
  Timer,
  Droplets,
  Sparkles,
  Loader2,
  CreditCard,
  Banknote,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  UserCheck,
  ClipboardList,
  Tag,
  AlertCircle,
  Repeat,
} from 'lucide-react'

// Types specific to Dry Cleaning / Laundry
type OrderStatus = 'received' | 'sorting' | 'washing' | 'drying' | 'ironing' | 'quality_check' | 'ready' | 'delivered' | 'collected'
type DeliveryStatus = 'pending' | 'out_for_delivery' | 'delivered' | 'failed'
type ServiceType = 'dry_cleaning' | 'laundry' | 'ironing' | 'specialist' | 'alterations' | 'household'
type SubscriptionPlan = 'basic' | 'standard' | 'premium'

interface Customer {
  id: string
  name: string
  phone: string
  email: string
  address: string
  subscription?: Subscription
  totalOrders: number
  lifetimeValue: number
}

interface Subscription {
  id: string
  plan: SubscriptionPlan
  monthlyPrice: number
  itemsPerMonth: number
  itemsUsed: number
  startDate: string
  nextBillingDate: string
  status: 'active' | 'paused' | 'cancelled'
}

interface GarmentItem {
  id: string
  name: string
  type: 'shirt' | 'pants' | 'dress' | 'suit' | 'jacket' | 'coat' | 'bedding' | 'curtains' | 'other'
  service: ServiceType
  quantity: number
  unitPrice: number
  specialInstructions?: string
  stainTreatment?: boolean
  expressService?: boolean
  tagNumber: string
  status: OrderStatus
}

interface LaundryOrder {
  id: string
  orderNumber: string
  customer: Customer
  items: GarmentItem[]
  totalItems: number
  subtotal: number
  expressFee: number
  discount: number
  total: number
  paid: boolean
  paymentMethod?: 'cash' | 'card' | 'eft' | 'subscription'
  status: OrderStatus
  priority: 'normal' | 'express' | 'same_day'
  receivedDate: string
  estimatedReadyDate: string
  actualReadyDate?: string
  deliveryRequired: boolean
  deliveryAddress?: string
  deliveryStatus?: DeliveryStatus
  deliveryDate?: string
  notes: string
  createdAt: string
}

interface DailyStats {
  date: string
  ordersReceived: number
  ordersCompleted: number
  ordersPending: number
  revenue: number
  deliveriesScheduled: number
  deliveriesCompleted: number
}

export function DryCleaningView() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Data states
  const [orders, setOrders] = useState<LaundryOrder[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null)

  // Dialog states
  const [newOrderDialogOpen, setNewOrderDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<LaundryOrder | null>(null)

  // Update time
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Mock data
  useEffect(() => {
    const timer = setTimeout(() => {
      setOrders([
        {
          id: 'ord-1',
          orderNumber: 'DC-2026-001',
          customer: {
            id: 'cust-1',
            name: 'Sarah Johnson',
            phone: '0821234567',
            email: 'sarah.j@email.com',
            address: '123 Main Street, Sandton, 2196',
            subscription: {
              id: 'sub-1',
              plan: 'standard',
              monthlyPrice: 599,
              itemsPerMonth: 20,
              itemsUsed: 12,
              startDate: '2026-01-01',
              nextBillingDate: '2026-03-01',
              status: 'active'
            },
            totalOrders: 15,
            lifetimeValue: 8500
          },
          items: [
            { id: 'item-1', name: 'Silk Blouse', type: 'shirt', service: 'dry_cleaning', quantity: 2, unitPrice: 85, tagNumber: 'TAG-001', status: 'washing', specialInstructions: 'Hand wash only' },
            { id: 'item-2', name: 'Wool Suit', type: 'suit', service: 'dry_cleaning', quantity: 1, unitPrice: 180, tagNumber: 'TAG-002', status: 'dry_cleaning' },
            { id: 'item-3', name: 'Cotton Shirt', type: 'shirt', service: 'laundry', quantity: 5, unitPrice: 35, tagNumber: 'TAG-003', status: 'ironing' },
            { id: 'item-4', name: 'Dress Pants', type: 'pants', service: 'dry_cleaning', quantity: 3, unitPrice: 65, tagNumber: 'TAG-004', status: 'quality_check' },
          ],
          totalItems: 11,
          subtotal: 720,
          expressFee: 0,
          discount: 0,
          total: 720,
          paid: true,
          paymentMethod: 'subscription',
          status: 'washing',
          priority: 'normal',
          receivedDate: '2026-02-14',
          estimatedReadyDate: '2026-02-16',
          deliveryRequired: true,
          deliveryAddress: '123 Main Street, Sandton, 2196',
          deliveryStatus: 'pending',
          notes: '',
          createdAt: '2026-02-14T09:00:00',
        },
        {
          id: 'ord-2',
          orderNumber: 'DC-2026-002',
          customer: {
            id: 'cust-2',
            name: 'Michael Chen',
            phone: '0839876543',
            email: 'm.chen@email.com',
            address: '456 Oak Avenue, Rosebank, 2196',
            totalOrders: 8,
            lifetimeValue: 4200
          },
          items: [
            { id: 'item-5', name: 'Wedding Dress', type: 'dress', service: 'specialist', quantity: 1, unitPrice: 850, tagNumber: 'TAG-005', status: 'quality_check', specialInstructions: 'Vintage lace - extra care', stainTreatment: true },
            { id: 'item-6', name: 'Suit Jacket', type: 'jacket', service: 'dry_cleaning', quantity: 2, unitPrice: 120, tagNumber: 'TAG-006', status: 'ready' },
          ],
          totalItems: 3,
          subtotal: 1090,
          expressFee: 150,
          discount: 0,
          total: 1240,
          paid: true,
          paymentMethod: 'card',
          status: 'quality_check',
          priority: 'express',
          receivedDate: '2026-02-14',
          estimatedReadyDate: '2026-02-15',
          deliveryRequired: false,
          notes: 'Wedding on Saturday - RUSH ORDER',
          createdAt: '2026-02-14T11:30:00',
        },
        {
          id: 'ord-3',
          orderNumber: 'DC-2026-003',
          customer: {
            id: 'cust-3',
            name: 'Priya Naidoo',
            phone: '0845551234',
            email: 'priya.n@email.com',
            address: '789 Pine Road, Melrose, 2196',
            subscription: {
              id: 'sub-2',
              plan: 'premium',
              monthlyPrice: 999,
              itemsPerMonth: 35,
              itemsUsed: 28,
              startDate: '2025-06-01',
              nextBillingDate: '2026-03-01',
              status: 'active'
            },
            totalOrders: 42,
            lifetimeValue: 28000
          },
          items: [
            { id: 'item-7', name: 'King Duvet Cover', type: 'bedding', service: 'dry_cleaning', quantity: 1, unitPrice: 180, tagNumber: 'TAG-007', status: 'received' },
            { id: 'item-8', name: 'King Sheet Set', type: 'bedding', service: 'laundry', quantity: 2, unitPrice: 75, tagNumber: 'TAG-008', status: 'received' },
            { id: 'item-9', name: 'Curtains (Living Room)', type: 'curtains', service: 'dry_cleaning', quantity: 1, unitPrice: 450, tagNumber: 'TAG-009', status: 'received' },
          ],
          totalItems: 4,
          subtotal: 780,
          expressFee: 0,
          discount: 78,
          total: 702,
          paid: true,
          paymentMethod: 'subscription',
          status: 'received',
          priority: 'normal',
          receivedDate: '2026-02-14',
          estimatedReadyDate: '2026-02-18',
          deliveryRequired: true,
          deliveryAddress: '789 Pine Road, Melrose, 2196',
          deliveryStatus: 'pending',
          notes: 'Regular household items',
          createdAt: '2026-02-14T14:00:00',
        },
        {
          id: 'ord-4',
          orderNumber: 'DC-2026-004',
          customer: {
            id: 'cust-4',
            name: 'James Wilson',
            phone: '0728881234',
            email: 'j.wilson@email.com',
            address: '321 Elm Street, Parkhurst, 2193',
            totalOrders: 3,
            lifetimeValue: 1500
          },
          items: [
            { id: 'item-10', name: 'Leather Jacket', type: 'jacket', service: 'specialist', quantity: 1, unitPrice: 350, tagNumber: 'TAG-010', status: 'ready', specialInstructions: 'Leather conditioning required' },
            { id: 'item-11', name: 'Jeans', type: 'pants', service: 'laundry', quantity: 3, unitPrice: 45, tagNumber: 'TAG-011', status: 'ready' },
          ],
          totalItems: 4,
          subtotal: 485,
          expressFee: 0,
          discount: 0,
          total: 485,
          paid: false,
          status: 'ready',
          priority: 'normal',
          receivedDate: '2026-02-13',
          estimatedReadyDate: '2026-02-15',
          actualReadyDate: '2026-02-14',
          deliveryRequired: false,
          notes: '',
          createdAt: '2026-02-13T16:00:00',
        },
      ])

      setSubscriptions([
        { id: 'sub-1', plan: 'standard', monthlyPrice: 599, itemsPerMonth: 20, itemsUsed: 12, startDate: '2026-01-01', nextBillingDate: '2026-03-01', status: 'active' },
        { id: 'sub-2', plan: 'premium', monthlyPrice: 999, itemsPerMonth: 35, itemsUsed: 28, startDate: '2025-06-01', nextBillingDate: '2026-03-01', status: 'active' },
        { id: 'sub-3', plan: 'basic', monthlyPrice: 299, itemsPerMonth: 10, itemsUsed: 10, startDate: '2025-11-01', nextBillingDate: '2026-03-01', status: 'active' },
      ])

      setDailyStats({
        date: '2026-02-14',
        ordersReceived: 12,
        ordersCompleted: 8,
        ordersPending: 15,
        revenue: 4250,
        deliveriesScheduled: 6,
        deliveriesCompleted: 4,
      })

      setLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // Stats
  const stats = {
    activeOrders: orders.filter(o => !['collected', 'delivered'].includes(o.status)).length,
    readyForCollection: orders.filter(o => o.status === 'ready').length,
    inProcess: orders.filter(o => ['washing', 'drying', 'ironing', 'dry_cleaning'].includes(o.status)).length,
    pendingDelivery: orders.filter(o => o.deliveryRequired && o.deliveryStatus === 'pending').length,
    expressOrders: orders.filter(o => o.priority === 'express').length,
    unpaidOrders: orders.filter(o => !o.paid).length,
    activeSubscriptions: subscriptions.filter(s => s.status === 'active').length,
    todayRevenue: dailyStats?.revenue || 0,
    subscriptionRevenue: subscriptions.filter(s => s.status === 'active').reduce((sum, s) => sum + s.monthlyPrice, 0),
  }

  const getStatusColor = (status: OrderStatus) => {
    const colors: Record<OrderStatus, string> = {
      received: 'bg-blue-100 text-blue-700',
      sorting: 'bg-purple-100 text-purple-700',
      washing: 'bg-cyan-100 text-cyan-700',
      drying: 'bg-orange-100 text-orange-700',
      ironing: 'bg-yellow-100 text-yellow-700',
      quality_check: 'bg-pink-100 text-pink-700',
      ready: 'bg-green-100 text-green-700',
      delivered: 'bg-gray-100 text-gray-700',
      collected: 'bg-gray-100 text-gray-700',
    }
    return colors[status]
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      normal: 'bg-blue-100 text-blue-700',
      express: 'bg-orange-100 text-orange-700',
      same_day: 'bg-red-100 text-red-700',
    }
    return colors[priority] || 'bg-gray-100 text-gray-700'
  }

  const formatCurrency = (amount: number) => {
    return `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#FAFAFA] min-h-0">
        <Loader2 className="h-8 w-8 animate-spin text-[#00897B]" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-[#FAFAFA] min-h-0">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
              <Shirt className="h-5 w-5 text-[#00897B]" />
              Laundry & Dry Cleaning Management
            </h1>
            <p className="text-sm text-[#757575]">Order tracking, delivery management, subscriptions & billing</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-mono font-bold">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              <p className="text-xs text-[#757575]">{currentTime.toLocaleDateString()}</p>
            </div>

            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setNewOrderDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />New Order
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-9 gap-3">
          <div className="bg-[#E0F2F1] rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-[#00897B]">{stats.activeOrders}</p>
            <p className="text-[10px] text-[#757575]">Active Orders</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-green-600">{stats.readyForCollection}</p>
            <p className="text-[10px] text-[#757575]">Ready</p>
          </div>
          <div className="bg-cyan-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-cyan-600">{stats.inProcess}</p>
            <p className="text-[10px] text-[#757575]">In Process</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-orange-600">{stats.pendingDelivery}</p>
            <p className="text-[10px] text-[#757575]">Delivery</p>
          </div>
          <div className="bg-red-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-red-600">{stats.expressOrders}</p>
            <p className="text-[10px] text-[#757575]">Express</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-yellow-600">{stats.unpaidOrders}</p>
            <p className="text-[10px] text-[#757575]">Unpaid</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-purple-600">{stats.activeSubscriptions}</p>
            <p className="text-[10px] text-[#757575]">Subscriptions</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-green-600">{formatCurrency(stats.todayRevenue)}</p>
            <p className="text-[10px] text-[#757575]">Today</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-blue-600">{formatCurrency(stats.subscriptionRevenue)}</p>
            <p className="text-[10px] text-[#757575]">Sub MRR</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 flex flex-col min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="bg-white border-b border-gray-200 px-4">
            <TabsList className="bg-transparent h-12">
              <TabsTrigger value="overview" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                Overview
              </TabsTrigger>
              <TabsTrigger value="orders" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <ClipboardList className="h-4 w-4 mr-1" />Orders
              </TabsTrigger>
              <TabsTrigger value="delivery" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Truck className="h-4 w-4 mr-1" />Delivery
              </TabsTrigger>
              <TabsTrigger value="subscriptions" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Repeat className="h-4 w-4 mr-1" />Subscriptions
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 p-4">
            {/* Overview Tab */}
            <TabsContent value="overview" className="m-0">
              <div className="grid grid-cols-2 gap-4">
                {/* Orders Ready for Collection */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Ready for Collection/Delivery
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {orders.filter(o => o.status === 'ready').map(order => (
                        <div key={order.id} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{order.customer.name}</p>
                            <p className="text-xs text-[#757575]">{order.orderNumber} | {order.totalItems} items</p>
                            {order.deliveryRequired && (
                              <p className="text-xs text-orange-600">Delivery to: {order.deliveryAddress?.split(',')[0]}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <Badge className="bg-green-100 text-green-700">Ready</Badge>
                            {!order.paid && (
                              <p className="text-xs text-red-600 mt-1 font-medium">UNPAID: {formatCurrency(order.total)}</p>
                            )}
                            {order.deliveryRequired ? (
                              <Button size="sm" className="mt-1 bg-[#00897B] hover:bg-[#00695C]">Schedule Delivery</Button>
                            ) : (
                              <Button size="sm" variant="outline" className="mt-1">Notify Customer</Button>
                            )}
                          </div>
                        </div>
                      ))}
                      {orders.filter(o => o.status === 'ready').length === 0 && (
                        <p className="text-center text-sm text-[#757575] py-4">No orders ready</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Express Orders */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                      Express / Same-Day Orders
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {orders.filter(o => o.priority !== 'normal').map(order => (
                        <div key={order.id} className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{order.customer.name}</p>
                            <p className="text-xs text-[#757575]">{order.orderNumber}</p>
                            <p className="text-xs text-[#757575]">Ready: {order.estimatedReadyDate}</p>
                          </div>
                          <div className="text-right">
                            <Badge className={getPriorityColor(order.priority)}>{order.priority}</Badge>
                            <p className="text-xs text-[#757575] mt-1">+{formatCurrency(order.expressFee)} fee</p>
                          </div>
                        </div>
                      ))}
                      {orders.filter(o => o.priority !== 'normal').length === 0 && (
                        <p className="text-center text-sm text-[#757575] py-4">No express orders</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Unpaid Orders */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-red-600" />
                      Unpaid Orders
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {orders.filter(o => !o.paid).map(order => (
                        <div key={order.id} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{order.customer.name}</p>
                            <p className="text-xs text-[#757575]">{order.orderNumber}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-red-600">{formatCurrency(order.total)}</p>
                            <Button size="sm" className="mt-1 bg-green-600 hover:bg-green-700">Collect Payment</Button>
                          </div>
                        </div>
                      ))}
                      {orders.filter(o => !o.paid).length === 0 && (
                        <p className="text-center text-sm text-[#757575] py-4">All orders paid</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Today's Stats */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-[#00897B]" />
                      Today's Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{dailyStats?.ordersReceived}</p>
                        <p className="text-xs text-[#757575]">Orders Received</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{dailyStats?.ordersCompleted}</p>
                        <p className="text-xs text-[#757575]">Completed</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <p className="text-2xl font-bold text-orange-600">{dailyStats?.deliveriesScheduled}</p>
                        <p className="text-xs text-[#757575]">Deliveries Scheduled</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">{formatCurrency(dailyStats?.revenue || 0)}</p>
                        <p className="text-xs text-[#757575]">Revenue</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">All Orders</h2>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Search orders..." className="pl-9 w-64" />
                  </div>
                  <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setNewOrderDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />New Order
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {orders.map(order => (
                  <Card key={order.id} className="cursor-pointer hover:border-[#00897B]" onClick={() => setSelectedOrder(order)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="p-2 rounded-lg bg-[#E0F2F1]">
                            <Shirt className="h-5 w-5 text-[#00897B]" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold">{order.orderNumber}</p>
                              <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                              {order.priority !== 'normal' && (
                                <Badge className={getPriorityColor(order.priority)}>{order.priority}</Badge>
                              )}
                              {order.customer.subscription && (
                                <Badge className="bg-purple-100 text-purple-700">{order.customer.subscription.plan}</Badge>
                              )}
                            </div>
                            <p className="text-sm text-[#757575]">{order.customer.name}</p>
                            <p className="text-sm text-[#757575]">{order.customer.phone}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-[#00897B]">{formatCurrency(order.total)}</p>
                          {!order.paid && (
                            <Badge className="bg-red-100 text-red-700">Unpaid</Badge>
                          )}
                          <p className="text-xs text-[#757575] mt-1">{order.totalItems} items</p>
                        </div>
                      </div>

                      {/* Items Summary */}
                      <div className="mt-4 pt-4 border-t">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-[#757575]">Received</p>
                            <p className="font-medium">{order.receivedDate}</p>
                          </div>
                          <div>
                            <p className="text-[#757575]">Est. Ready</p>
                            <p className="font-medium">{order.estimatedReadyDate}</p>
                          </div>
                          <div>
                            <p className="text-[#757575]">Delivery</p>
                            <p className="font-medium">{order.deliveryRequired ? 'Yes' : 'Collection'}</p>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-1">
                          {order.items.map(item => (
                            <Badge key={item.id} variant="outline" className="text-xs">
                              {item.name} x{item.quantity}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Delivery Tab */}
            <TabsContent value="delivery" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Delivery Management</h2>
                <Button className="bg-[#00897B] hover:bg-[#00695C]">
                  <Truck className="h-4 w-4 mr-2" />Start Delivery Run
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <Card className="bg-blue-50">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-blue-600">{orders.filter(o => o.deliveryRequired && o.status === 'ready').length}</p>
                    <p className="text-sm text-[#757575]">Pending Delivery</p>
                  </CardContent>
                </Card>
                <Card className="bg-orange-50">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-orange-600">{orders.filter(o => o.deliveryStatus === 'out_for_delivery').length}</p>
                    <p className="text-sm text-[#757575]">Out for Delivery</p>
                  </CardContent>
                </Card>
                <Card className="bg-green-50">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-green-600">{dailyStats?.deliveriesCompleted || 0}</p>
                    <p className="text-sm text-[#757575]">Delivered Today</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Delivery Queue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {orders.filter(o => o.deliveryRequired && ['ready', 'delivered'].includes(o.status)).map(order => (
                      <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${order.deliveryStatus === 'delivered' ? 'bg-green-100' : 'bg-orange-100'}`}>
                            <MapPin className={`h-4 w-4 ${order.deliveryStatus === 'delivered' ? 'text-green-600' : 'text-orange-600'}`} />
                          </div>
                          <div>
                            <p className="font-medium">{order.customer.name}</p>
                            <p className="text-sm text-[#757575]">{order.deliveryAddress}</p>
                            <p className="text-xs text-[#757575]">{order.customer.phone}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{order.orderNumber}</p>
                          <p className="text-sm text-[#757575]">{order.totalItems} items</p>
                          <Badge className={order.deliveryStatus === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}>
                            {order.deliveryStatus === 'delivered' ? 'Delivered' : 'Pending'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Subscriptions Tab */}
            <TabsContent value="subscriptions" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Subscription Plans</h2>
                <Button className="bg-[#00897B] hover:bg-[#00695C]">
                  <Plus className="h-4 w-4 mr-2" />New Subscription
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card className="border-2 border-gray-200">
                  <CardHeader className="text-center">
                    <CardTitle>Basic</CardTitle>
                    <CardDescription>For light users</CardDescription>
                    <p className="text-3xl font-bold text-[#00897B]">R299<span className="text-sm text-[#757575]">/mo</span></p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" />10 items per month</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" />Standard turnaround</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" />Collection only</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-2 border-[#00897B]">
                  <CardHeader className="text-center">
                    <CardTitle>Standard</CardTitle>
                    <CardDescription>Most popular</CardDescription>
                    <p className="text-3xl font-bold text-[#00897B]">R599<span className="text-sm text-[#757575]">/mo</span></p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" />20 items per month</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" />Priority turnaround</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" />Free delivery</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-2 border-purple-300">
                  <CardHeader className="text-center">
                    <CardTitle>Premium</CardTitle>
                    <CardDescription>For families</CardDescription>
                    <p className="text-3xl font-bold text-purple-600">R999<span className="text-sm text-[#757575]">/mo</span></p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" />35 items per month</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" />Express turnaround</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" />Premium care included</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Active Subscriptions ({subscriptions.filter(s => s.status === 'active').length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {subscriptions.map(sub => (
                      <div key={sub.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-purple-100">
                            <Repeat className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium capitalize">{sub.plan} Plan</p>
                            <p className="text-sm text-[#757575]">Next billing: {sub.nextBillingDate}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(sub.monthlyPrice)}/mo</p>
                          <p className="text-sm text-[#757575]">{sub.itemsUsed}/{sub.itemsPerMonth} items used</p>
                          <Progress value={(sub.itemsUsed / sub.itemsPerMonth) * 100} className="w-24 mt-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  )
}
