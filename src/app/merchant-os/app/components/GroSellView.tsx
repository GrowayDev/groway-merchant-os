'use client'

/**
 * GroSell - WhatsApp Commerce Dashboard
 * 
 * WhatsApp-based commerce with:
 * - BNPL (2 installments, interest-free)
 * - Layby support
 * - SASSA beneficiary optimization
 * - Compliance layers
 */

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { toast } from 'sonner'
import {
  MessageSquare,
  ShoppingCart,
  CreditCard,
  PiggyBank,
  TrendingUp,
  Users,
  Package,
  CheckCircle2,
  Clock,
  AlertCircle,
  Send,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Percent,
  Shield,
  Smartphone,
  Bot,
  Settings,
  BarChart3,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  ExternalLink,
  Copy,
  CheckCircle,
  XCircle,
  Hourglass,
  Wallet,
  Gift,
  Sparkles,
  Building2,
} from 'lucide-react'

// Types
interface Conversation {
  id: string
  customerPhone: string
  customerName?: string
  status: string
  lastMessageAt?: Date
  lastMessageText?: string
  messageCount: number
  orderCount: number
  totalSpent: number
  vertical?: string
}

interface Order {
  id: string
  orderNumber: string
  customerPhone: string
  customerName?: string
  total: number
  status: string
  paymentStatus: string
  paymentMethod?: string
  createdAt: Date
  itemCount: number
  bnplPlan?: BNPLPlan
  laybyPlan?: LaybyPlan
}

interface BNPLPlan {
  id: string
  totalAmount: number
  firstInstallment: number
  secondInstallment: number
  firstDueDate: string
  secondDueDate: string
  firstPaidAt?: Date
  secondPaidAt?: Date
  status: string
  isSassaBeneficiary: boolean
}

interface LaybyPlan {
  id: string
  laybyNumber: string
  totalAmount: number
  depositAmount: number
  totalPaid: number
  balanceAmount: number
  installmentCount: number
  installmentsPaid: number
  status: string
}

// Mock data for demo
const mockConversations: Conversation[] = [
  {
    id: 'conv_001',
    customerPhone: '+27817184013',
    customerName: 'Thandi Mokoena',
    status: 'active',
    lastMessageAt: new Date(),
    lastMessageText: 'I want to order bread and milk',
    messageCount: 12,
    orderCount: 3,
    totalSpent: 450,
    vertical: 'Grocery & FMCG'
  },
  {
    id: 'conv_002',
    customerPhone: '+27821234567',
    customerName: 'Sipho Ndlovu',
    status: 'active',
    lastMessageAt: new Date(Date.now() - 30 * 60 * 1000),
    lastMessageText: 'Can I pay with BNPL?',
    messageCount: 8,
    orderCount: 1,
    totalSpent: 890,
    vertical: 'Liquor & Nightlife'
  },
  {
    id: 'conv_003',
    customerPhone: '+27837654321',
    customerName: 'Maria Santos',
    status: 'active',
    lastMessageAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    lastMessageText: 'What are your trading hours?',
    messageCount: 4,
    orderCount: 0,
    totalSpent: 0,
    vertical: 'Food & Beverage'
  }
]

const mockOrders: Order[] = [
  {
    id: 'order_001',
    orderNumber: 'GS-2024-ABC12345',
    customerPhone: '+27817184013',
    customerName: 'Thandi Mokoena',
    total: 450,
    status: 'processing',
    paymentStatus: 'paid',
    paymentMethod: 'card',
    createdAt: new Date(),
    itemCount: 5
  },
  {
    id: 'order_002',
    orderNumber: 'GS-2024-DEF67890',
    customerPhone: '+27821234567',
    customerName: 'Sipho Ndlovu',
    total: 890,
    status: 'pending',
    paymentStatus: 'deposit_paid',
    paymentMethod: 'bnpl',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    itemCount: 3,
    bnplPlan: {
      id: 'bnpl_001',
      totalAmount: 890,
      firstInstallment: 445,
      secondInstallment: 445,
      firstDueDate: '2024-12-20',
      secondDueDate: '2025-01-03',
      firstPaidAt: new Date(),
      status: 'partially_paid',
      isSassaBeneficiary: true
    }
  },
  {
    id: 'order_003',
    orderNumber: 'GS-2024-GHI11223',
    customerPhone: '+27837654321',
    customerName: 'Maria Santos',
    total: 1200,
    status: 'pending',
    paymentStatus: 'deposit_paid',
    paymentMethod: 'layby',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    itemCount: 2,
    laybyPlan: {
      id: 'layby_001',
      laybyNumber: 'LY-2024-LAYBY001',
      totalAmount: 1200,
      depositAmount: 120,
      totalPaid: 520,
      balanceAmount: 680,
      installmentCount: 6,
      installmentsPaid: 4,
      status: 'active'
    }
  }
]

const formatCurrency = (amount: number) => {
  return `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'confirmed': return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'processing': return 'bg-purple-100 text-purple-700 border-purple-200'
    case 'ready': return 'bg-green-100 text-green-700 border-green-200'
    case 'delivered': return 'bg-gray-100 text-gray-700 border-gray-200'
    case 'cancelled': return 'bg-red-100 text-red-700 border-red-200'
    case 'partially_paid': return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'paid': return 'bg-green-100 text-green-700 border-green-200'
    case 'active': return 'bg-green-100 text-green-700 border-green-200'
    case 'completed': return 'bg-green-100 text-green-700 border-green-200'
    default: return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

export function GroSellView() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations)
  const [orders, setOrders] = useState<Order[]>(mockOrders)
  
  // Dialogs
  const [newMessageDialog, setNewMessageDialog] = useState(false)
  const [orderDetailDialog, setOpenOrderDetailDialog] = useState(false)
  const [bnplDialog, setBnplDialog] = useState(false)
  const [laybyDialog, setLaybyDialog] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  
  // Form state
  const [newMessage, setNewMessage] = useState({
    phone: '',
    message: ''
  })

  // Stats
  const stats = {
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    activeBNPL: orders.filter(o => o.paymentMethod === 'bnpl' && o.bnplPlan?.status === 'partially_paid').length,
    activeLayby: orders.filter(o => o.paymentMethod === 'layby' && o.laybyPlan?.status === 'active').length,
    totalRevenue: orders.reduce((sum, o) => sum + o.total, 0),
    activeConversations: conversations.filter(c => c.status === 'active').length
  }

  const handleSendMessage = async () => {
    if (!newMessage.phone || !newMessage.message) {
      toast.error('Please enter phone number and message')
      return
    }

    try {
      const response = await fetch('/api/grosell/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: 'demo_merchant',
          customerPhone: newMessage.phone,
          message: newMessage.message
        })
      })

      if (response.ok) {
        toast.success('Message sent successfully')
        setNewMessageDialog(false)
        setNewMessage({ phone: '', message: '' })
      } else {
        toast.error('Failed to send message')
      }
    } catch (error) {
      toast.error('Failed to send message')
    }
  }

  const handleUpdateOrderStatus = async (orderId: string, action: string) => {
    try {
      const response = await fetch('/api/grosell/order', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action })
      })

      if (response.ok) {
        toast.success(`Order ${action} successfully`)
        // Refresh orders
        setOrders(orders.map(o => {
          if (o.id === orderId) {
            return { ...o, status: action }
          }
          return o
        }))
      } else {
        toast.error('Failed to update order')
      }
    } catch (error) {
      toast.error('Failed to update order')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#1A1A1A]">GroSell</h2>
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[10px]">
                  <Sparkles className="h-3 w-3 mr-1" />
                  WHATSAPP COMMERCE
                </Badge>
              </div>
              <p className="text-xs text-[#757575]">WhatsApp-powered sales with BNPL & Layby</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-green-300 text-green-600">
              <Smartphone className="h-3 w-3 mr-1" />
              Mock Mode
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNewMessageDialog(true)}
            >
              <Send className="h-4 w-4 mr-1" />
              New Message
            </Button>
            <Button
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              size="sm"
            >
              <Settings className="h-4 w-4 mr-1" />
              Configure
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-3 bg-white border-b border-gray-200">
        <div className="flex gap-1 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'conversations', label: 'Conversations', icon: MessageSquare },
            { id: 'orders', label: 'Orders', icon: ShoppingCart },
            { id: 'bnpl', label: 'BNPL', icon: CreditCard },
            { id: 'layby', label: 'Layby', icon: PiggyBank },
            { id: 'compliance', label: 'Compliance', icon: Shield },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-green-50 text-green-700 border-b-2 border-green-500'
                  : 'text-[#757575] hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <ShoppingCart className="h-4 w-4 text-green-500" />
                    <Badge variant="secondary" className="text-[10px]">{stats.totalOrders}</Badge>
                  </div>
                  <p className="text-2xl font-bold text-[#1A1A1A]">{stats.totalOrders}</p>
                  <p className="text-xs text-[#757575]">Total Orders</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                  </div>
                  <p className="text-2xl font-bold text-amber-600">{stats.pendingOrders}</p>
                  <p className="text-xs text-[#757575]">Pending</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <CreditCard className="h-4 w-4 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{stats.activeBNPL}</p>
                  <p className="text-xs text-[#757575]">Active BNPL</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <PiggyBank className="h-4 w-4 text-purple-500" />
                  </div>
                  <p className="text-2xl font-bold text-purple-600">{stats.activeLayby}</p>
                  <p className="text-xs text-[#757575]">Active Layby</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</p>
                  <p className="text-xs text-[#757575]">Revenue</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Users className="h-4 w-4 text-teal-500" />
                  </div>
                  <p className="text-2xl font-bold text-teal-600">{stats.activeConversations}</p>
                  <p className="text-xs text-[#757575]">Conversations</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-3">
                  <Button
                    variant="outline"
                    className="h-auto py-3 flex flex-col items-center gap-2"
                    onClick={() => setNewMessageDialog(true)}
                  >
                    <Send className="h-5 w-5 text-green-500" />
                    <span className="text-xs">Send Message</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-3 flex flex-col items-center gap-2"
                    onClick={() => setActiveTab('orders')}
                  >
                    <ShoppingCart className="h-5 w-5 text-blue-500" />
                    <span className="text-xs">View Orders</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-3 flex flex-col items-center gap-2"
                    onClick={() => setActiveTab('bnpl')}
                  >
                    <CreditCard className="h-5 w-5 text-purple-500" />
                    <span className="text-xs">BNPL Plans</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-3 flex flex-col items-center gap-2"
                    onClick={() => setActiveTab('layby')}
                  >
                    <PiggyBank className="h-5 w-5 text-amber-500" />
                    <span className="text-xs">Layby Plans</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Conversations */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Recent Conversations</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('conversations')}>
                    View All
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {conversations.slice(0, 3).map((conv) => (
                    <div key={conv.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <Users className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{conv.customerName || conv.customerPhone}</p>
                          <p className="text-xs text-[#757575] truncate max-w-[200px]">{conv.lastMessageText}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(conv.status)}>{conv.status}</Badge>
                        <p className="text-xs text-[#757575] mt-1">{formatDate(conv.lastMessageAt!)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* BNPL & Layby Summary */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-blue-500" />
                    BNPL Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#757575]">Active Plans</span>
                      <span className="font-medium">{stats.activeBNPL}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#757575]">Installments</span>
                      <span className="font-medium">2 (Interest-Free)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#757575]">SASSA Optimized</span>
                      <Badge className="bg-green-100 text-green-700 text-[10px]">Enabled</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <PiggyBank className="h-4 w-4 text-purple-500" />
                    Layby Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#757575]">Active Plans</span>
                      <span className="font-medium">{stats.activeLayby}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#757575]">Installments</span>
                      <span className="font-medium">6 (Flexible)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#757575]">Min Deposit</span>
                      <span className="font-medium">10%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* CONVERSATIONS TAB */}
        {activeTab === 'conversations' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input placeholder="Search conversations..." className="pl-9 w-64" />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-1" />
                  Filter
                </Button>
              </div>
              <Button onClick={() => setNewMessageDialog(true)}>
                <Plus className="h-4 w-4 mr-1" />
                New Conversation
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  {conversations.map((conv) => (
                    <div key={conv.id} className="p-4 hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                            <Users className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{conv.customerName || 'Unknown'}</p>
                              {conv.vertical && (
                                <Badge variant="outline" className="text-[10px]">{conv.vertical}</Badge>
                              )}
                            </div>
                            <p className="text-sm text-[#757575]">{conv.customerPhone}</p>
                            <p className="text-xs text-[#757575] mt-1 truncate max-w-[300px]">
                              {conv.lastMessageText}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(conv.status)}>{conv.status}</Badge>
                          <p className="text-xs text-[#757575] mt-1">
                            {conv.messageCount} messages · {conv.orderCount} orders
                          </p>
                          <p className="text-xs text-[#757575]">{formatDate(conv.lastMessageAt!)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Select defaultValue="all">
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="all">
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Payment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payment</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="bnpl">BNPL</SelectItem>
                    <SelectItem value="layby">Layby</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-1" />
                Create Order
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  {orders.map((order) => (
                    <div 
                      key={order.id} 
                      className="p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setSelectedOrder(order)
                        setOpenOrderDetailDialog(true)
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <ShoppingCart className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{order.orderNumber}</p>
                              {order.paymentMethod === 'bnpl' && (
                                <Badge className="bg-blue-100 text-blue-700 text-[10px]">BNPL</Badge>
                              )}
                              {order.paymentMethod === 'layby' && (
                                <Badge className="bg-purple-100 text-purple-700 text-[10px]">Layby</Badge>
                              )}
                            </div>
                            <p className="text-sm text-[#757575]">{order.customerName || order.customerPhone}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(order.total)}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                            <Badge className={getStatusColor(order.paymentStatus)}>{order.paymentStatus}</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* BNPL TAB */}
        {activeTab === 'bnpl' && (
          <div className="space-y-4">
            <Card className="border-l-4 border-l-blue-500 bg-blue-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-700">Buy Now, Pay Later</h3>
                    <p className="text-sm text-blue-600 mt-1">
                      Split purchases into <strong>2 interest-free installments</strong>. SASSA beneficiaries get payment dates aligned to grant days.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats.activeBNPL}</p>
                  <p className="text-sm text-[#757575]">Active Plans</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">2</p>
                  <p className="text-sm text-[#757575]">Installments (Interest-Free)</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-purple-600">R2,000</p>
                  <p className="text-sm text-[#757575]">Max (SASSA)</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Active BNPL Plans</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  {orders.filter(o => o.bnplPlan).map((order) => (
                    <div key={order.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{order.orderNumber}</p>
                          {order.bnplPlan?.isSassaBeneficiary && (
                            <Badge className="bg-green-100 text-green-700 text-[10px]">
                              <Gift className="h-3 w-3 mr-1" />
                              SASSA
                            </Badge>
                          )}
                        </div>
                        <Badge className={getStatusColor(order.bnplPlan?.status || '')}>
                          {order.bnplPlan?.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="p-3 rounded-lg bg-gray-50">
                          <p className="text-xs text-[#757575] mb-1">1st Installment</p>
                          <p className="font-bold">{formatCurrency(order.bnplPlan?.firstInstallment || 0)}</p>
                          <div className="flex items-center gap-1 mt-1">
                            {order.bnplPlan?.firstPaidAt ? (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            ) : (
                              <Clock className="h-3 w-3 text-amber-500" />
                            )}
                            <span className="text-xs text-[#757575]">
                              {order.bnplPlan?.firstPaidAt ? 'Paid' : `Due ${order.bnplPlan?.firstDueDate}`}
                            </span>
                          </div>
                        </div>
                        <div className="p-3 rounded-lg bg-gray-50">
                          <p className="text-xs text-[#757575] mb-1">2nd Installment</p>
                          <p className="font-bold">{formatCurrency(order.bnplPlan?.secondInstallment || 0)}</p>
                          <div className="flex items-center gap-1 mt-1">
                            {order.bnplPlan?.secondPaidAt ? (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            ) : (
                              <Clock className="h-3 w-3 text-amber-500" />
                            )}
                            <span className="text-xs text-[#757575]">
                              {order.bnplPlan?.secondPaidAt ? 'Paid' : `Due ${order.bnplPlan?.secondDueDate}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* LAYBY TAB */}
        {activeTab === 'layby' && (
          <div className="space-y-4">
            <Card className="border-l-4 border-l-purple-500 bg-purple-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <PiggyBank className="h-5 w-5 text-purple-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-purple-700">Layby Plans</h3>
                    <p className="text-sm text-purple-600 mt-1">
                      Flexible payment plans with <strong>10% minimum deposit</strong>. Up to 6 installments with weekly, biweekly, or monthly frequency.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-purple-600">{stats.activeLayby}</p>
                  <p className="text-sm text-[#757575]">Active Plans</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">6</p>
                  <p className="text-sm text-[#757575]">Max Installments</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-amber-600">10%</p>
                  <p className="text-sm text-[#757575]">Min Deposit</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Active Layby Plans</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  {orders.filter(o => o.laybyPlan).map((order) => (
                    <div key={order.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{order.laybyPlan?.laybyNumber}</p>
                          <span className="text-sm text-[#757575]">({order.orderNumber})</span>
                        </div>
                        <Badge className={getStatusColor(order.laybyPlan?.status || '')}>
                          {order.laybyPlan?.status}
                        </Badge>
                      </div>
                      
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-[#757575]">Progress</span>
                          <span>{order.laybyPlan?.installmentsPaid}/{order.laybyPlan?.installmentCount} installments</span>
                        </div>
                        <Progress 
                          value={(order.laybyPlan?.installmentsPaid || 0) / (order.laybyPlan?.installmentCount || 1) * 100} 
                          className="h-2"
                        />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-[#757575]">Total</p>
                          <p className="font-medium">{formatCurrency(order.laybyPlan?.totalAmount || 0)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#757575]">Paid</p>
                          <p className="font-medium text-green-600">{formatCurrency(order.laybyPlan?.totalPaid || 0)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#757575]">Balance</p>
                          <p className="font-medium text-amber-600">{formatCurrency(order.laybyPlan?.balanceAmount || 0)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* COMPLIANCE TAB */}
        {activeTab === 'compliance' && (
          <div className="space-y-4">
            <Card className="border-l-4 border-l-red-500 bg-red-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-700">Compliance Layers</h3>
                    <p className="text-sm text-red-600 mt-1">
                      Vertical-specific compliance requirements including age verification (Liquor), SAHPRA gate (Pharmacy), and consent forms (Health & Beauty).
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-3 gap-4">
              <Card className="border-l-4 border-l-amber-500">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-amber-500" />
                    <p className="font-medium">Age Verification</p>
                  </div>
                  <p className="text-sm text-[#757575]">Required for Liquor & Nightlife</p>
                  <p className="text-xs text-[#757575] mt-1">Min age: 18 years</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    <p className="font-medium">SAHPRA Gate</p>
                  </div>
                  <p className="text-sm text-[#757575]">Required for Pharmacy</p>
                  <p className="text-xs text-[#757575] mt-1">License verification</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-purple-500" />
                    <p className="font-medium">Consent Forms</p>
                  </div>
                  <p className="text-sm text-[#757575]">Required for Health & Beauty</p>
                  <p className="text-xs text-[#757575] mt-1">Treatment consent</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </ScrollArea>

      {/* New Message Dialog */}
      <Dialog open={newMessageDialog} onOpenChange={setNewMessageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send WhatsApp Message</DialogTitle>
            <DialogDescription>
              Send a message to a customer via WhatsApp
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Phone Number</Label>
              <Input
                placeholder="+27..."
                value={newMessage.phone}
                onChange={(e) => setNewMessage({ ...newMessage, phone: e.target.value })}
              />
            </div>
            <div>
              <Label>Message</Label>
              <textarea
                className="w-full min-h-[100px] p-3 rounded-md border border-gray-300 text-sm"
                placeholder="Type your message..."
                value={newMessage.message}
                onChange={(e) => setNewMessage({ ...newMessage, message: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewMessageDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendMessage}>
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Detail Dialog */}
      <Dialog open={orderDetailDialog} onOpenChange={setOpenOrderDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg">{selectedOrder.orderNumber}</p>
                  <p className="text-sm text-[#757575]">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <div className="flex gap-2">
                  <Badge className={getStatusColor(selectedOrder.status)}>{selectedOrder.status}</Badge>
                  <Badge className={getStatusColor(selectedOrder.paymentStatus)}>{selectedOrder.paymentStatus}</Badge>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#757575]">Customer</p>
                  <p className="font-medium">{selectedOrder.customerName || 'Unknown'}</p>
                  <p className="text-sm text-[#757575]">{selectedOrder.customerPhone}</p>
                </div>
                <div>
                  <p className="text-xs text-[#757575]">Total</p>
                  <p className="text-xl font-bold">{formatCurrency(selectedOrder.total)}</p>
                  <p className="text-sm text-[#757575]">{selectedOrder.itemCount} items</p>
                </div>
              </div>

              {selectedOrder.bnplPlan && (
                <>
                  <Separator />
                  <div>
                    <p className="font-medium mb-2">BNPL Plan</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-gray-50">
                        <p className="text-xs text-[#757575]">1st Installment</p>
                        <p className="font-bold">{formatCurrency(selectedOrder.bnplPlan.firstInstallment)}</p>
                        <p className="text-xs text-[#757575]">Due: {selectedOrder.bnplPlan.firstDueDate}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-gray-50">
                        <p className="text-xs text-[#757575]">2nd Installment</p>
                        <p className="font-bold">{formatCurrency(selectedOrder.bnplPlan.secondInstallment)}</p>
                        <p className="text-xs text-[#757575]">Due: {selectedOrder.bnplPlan.secondDueDate}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {selectedOrder.laybyPlan && (
                <>
                  <Separator />
                  <div>
                    <p className="font-medium mb-2">Layby Plan</p>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-3 rounded-lg bg-gray-50">
                        <p className="text-xs text-[#757575]">Total</p>
                        <p className="font-bold">{formatCurrency(selectedOrder.laybyPlan.totalAmount)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-gray-50">
                        <p className="text-xs text-[#757575]">Paid</p>
                        <p className="font-bold text-green-600">{formatCurrency(selectedOrder.laybyPlan.totalPaid)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-gray-50">
                        <p className="text-xs text-[#757575]">Balance</p>
                        <p className="font-bold text-amber-600">{formatCurrency(selectedOrder.laybyPlan.balanceAmount)}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenOrderDetailDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
