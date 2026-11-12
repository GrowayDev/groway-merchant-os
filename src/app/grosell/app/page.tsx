'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  MessageCircle,
  ShoppingCart,
  Package,
  Users,
  Settings,
  TrendingUp,
  Plus,
  Search,
  Phone,
  Send,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  ChefHat,
  Truck,
  MoreVertical,
  ExternalLink,
  Copy,
  QrCode,
  Image as ImageIcon,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  Sparkles,
  Smartphone,
  Globe,
  Zap,
  Menu,
  X,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

// Types
interface GroSellProduct {
  id: string
  name: string
  description?: string
  category?: string
  price: number
  compareAtPrice?: number
  stockQuantity: number
  images?: string
  isActive: boolean
  isFeatured: boolean
  viewCount: number
  orderCount: number
}

interface GroSellOrder {
  id: string
  orderNumber: string
  customerPhone: string
  customerName?: string
  status: string
  paymentStatus: string
  total: number
  items: Array<{
    id: string
    productName: string
    quantity: number
    unitPrice: number
    total: number
  }>
  createdAt: string
}

interface GroSellCustomer {
  id: string
  phone: string
  name?: string
  totalOrders: number
  totalSpent: number
  lastOrderAt?: string
}

interface GroSellSettings {
  whatsappNumber: string
  businessName: string
  greetingMessage: string
  catalogEnabled: boolean
}

// Default WhatsApp number
const DEFAULT_WHATSAPP = '+27817184013'

// Order status configurations
const orderStatuses = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  { value: 'preparing', label: 'Preparing', color: 'bg-orange-100 text-orange-800', icon: ChefHat },
  { value: 'ready', label: 'Ready', color: 'bg-green-100 text-green-800', icon: Package },
  { value: 'delivered', label: 'Delivered', color: 'bg-teal-100 text-teal-800', icon: Truck },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
]

export default function GroSellDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [products, setProducts] = useState<GroSellProduct[]>([])
  const [orders, setOrders] = useState<GroSellOrder[]>([])
  const [customers, setCustomers] = useState<GroSellCustomer[]>([])
  const [settings, setSettings] = useState<GroSellSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Dialogs
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [orderDetailOpen, setOrderDetailOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<GroSellOrder | null>(null)
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false)
  
  // Product form
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    stockQuantity: '0',
    isActive: true
  })

  // Stats
  const stats = {
    totalProducts: products.length,
    activeProducts: products.filter(p => p.isActive).length,
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    todayRevenue: orders
      .filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString())
      .reduce((sum, o) => sum + o.total, 0),
    totalCustomers: customers.length
  }

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const merchantId = 'demo-merchant'
        
        const [productsRes, ordersRes, customersRes, settingsRes] = await Promise.all([
          fetch(`/grosell/api/products?merchantId=${merchantId}`),
          fetch(`/grosell/api/orders?merchantId=${merchantId}`),
          fetch(`/grosell/api/customers?merchantId=${merchantId}`),
          fetch(`/grosell/api/settings?merchantId=${merchantId}`)
        ])
        
        if (productsRes.ok) {
          const data = await productsRes.json()
          setProducts(data.products || [])
        }
        
        if (ordersRes.ok) {
          const data = await ordersRes.json()
          setOrders(data.orders || [])
        }
        
        if (customersRes.ok) {
          const data = await customersRes.json()
          setCustomers(data.customers || [])
        }
        
        if (settingsRes.ok) {
          const data = await settingsRes.json()
          setSettings(data.settings)
        }
      } catch (error) {
        console.error('Error fetching GroSell data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  // WhatsApp click-to-chat link
  const getWhatsAppLink = (phone?: string) => {
    const number = phone || settings?.whatsappNumber || DEFAULT_WHATSAPP
    const cleanNumber = number.replace(/\D/g, '')
    return `https://wa.me/${cleanNumber}`
  }

  // Copy WhatsApp link
  const copyWhatsAppLink = () => {
    const link = getWhatsAppLink()
    navigator.clipboard.writeText(link)
  }

  // Create product
  const handleCreateProduct = async () => {
    try {
      const response = await fetch('/grosell/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: 'demo-merchant',
          ...productForm,
          price: parseFloat(productForm.price),
          stockQuantity: parseInt(productForm.stockQuantity)
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setProducts([...products, data.product])
        setProductDialogOpen(false)
        setProductForm({ name: '', description: '', category: '', price: '', stockQuantity: '0', isActive: true })
      }
    } catch (error) {
      console.error('Error creating product:', error)
    }
  }

  // Update order status
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const response = await fetch('/grosell/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status })
      })
      
      if (response.ok) {
        setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o))
      }
    } catch (error) {
      console.error('Error updating order:', error)
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount)
  }

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-ZA', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-[#1A1A1A]">GroSell</h1>
                <p className="text-xs text-[#757575]">WhatsApp Commerce</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setWhatsappDialogOpen(true)}
                className="gap-2"
              >
                <Phone className="h-4 w-4" />
                Share WhatsApp Link
              </Button>
              <Link href="/grosell">
                <Button variant="ghost" size="sm">
                  Back to Landing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#E0F2F1] text-[#00897B] flex items-center justify-center">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-[#757575]">Products</p>
                  <p className="text-xl font-bold text-[#1A1A1A]">{stats.totalProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-[#757575]">Pending</p>
                  <p className="text-xl font-bold text-[#1A1A1A]">{stats.pendingOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-[#757575]">Orders</p>
                  <p className="text-xl font-bold text-[#1A1A1A]">{stats.totalOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-[#757575]">Today</p>
                  <p className="text-xl font-bold text-[#1A1A1A]">{formatCurrency(stats.todayRevenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-[#757575]">Customers</p>
                  <p className="text-xl font-bold text-[#1A1A1A]">{stats.totalCustomers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#25D366]/10 text-[#25D366] flex items-center justify-center">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-[#757575]">WhatsApp</p>
                  <p className="text-sm font-bold text-[#25D366]">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Recent Orders */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Recent Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8 text-[#757575]">Loading...</div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-[#757575]">No orders yet</p>
                      <p className="text-xs text-[#757575] mt-1">Share your WhatsApp link to start receiving orders</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {orders.slice(0, 10).map(order => {
                          const status = orderStatuses.find(s => s.value === order.status) || orderStatuses[0]
                          return (
                            <div 
                              key={order.id} 
                              className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer"
                              onClick={() => {
                                setSelectedOrder(order)
                                setOrderDetailOpen(true)
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full ${status.color} flex items-center justify-center`}>
                                  <status.icon className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{order.orderNumber}</p>
                                  <p className="text-xs text-[#757575]">{order.customerName || order.customerPhone}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-sm">{formatCurrency(order.total)}</p>
                                <p className="text-xs text-[#757575]">{formatDate(order.createdAt)}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      className="w-full justify-start gap-3 bg-[#25D366] hover:bg-[#128C7E]"
                      onClick={() => setWhatsappDialogOpen(true)}
                    >
                      <Send className="h-4 w-4" />
                      Share WhatsApp Link
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-3"
                      onClick={() => setProductDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Add Product
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-3">
                      <QrCode className="h-4 w-4" />
                      Generate QR Code
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-3">
                      <BarChart3 className="h-4 w-4" />
                      View Analytics
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-semibold">WhatsApp Number</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-[#25D366]/5 border border-[#25D366]/20">
                      <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center">
                        <Phone className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">{settings?.whatsappNumber || DEFAULT_WHATSAPP}</p>
                        <p className="text-xs text-[#757575]">Click-to-chat active</p>
                      </div>
                    </div>
                    <p className="text-xs text-[#757575] mt-3">
                      Customers can message you directly. No Business API required.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">All Orders</CardTitle>
                  <div className="flex items-center gap-2">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Filter status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        {orderStatuses.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-[#757575]">Loading...</div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                    <p className="text-[#757575] font-medium">No orders yet</p>
                    <p className="text-sm text-[#757575] mt-1">Share your WhatsApp link to start receiving orders</p>
                    <Button className="mt-4 gap-2" onClick={() => setWhatsappDialogOpen(true)}>
                      <Send className="h-4 w-4" />
                      Share WhatsApp Link
                    </Button>
                  </div>
                ) : (
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-3">
                      {orders.map(order => {
                        const status = orderStatuses.find(s => s.value === order.status) || orderStatuses[0]
                        return (
                          <div key={order.id} className="p-4 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full ${status.color} flex items-center justify-center`}>
                                  <status.icon className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="font-semibold">{order.orderNumber}</p>
                                  <p className="text-sm text-[#757575]">{order.customerName || order.customerPhone}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">{formatCurrency(order.total)}</p>
                                <p className="text-xs text-[#757575]">{formatDate(order.createdAt)}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 mb-3">
                              {order.items.slice(0, 3).map((item, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {item.quantity}x {item.productName}
                                </Badge>
                              ))}
                              {order.items.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{order.items.length - 3} more
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Select 
                                value={order.status} 
                                onValueChange={(value) => handleUpdateOrderStatus(order.id, value)}
                              >
                                <SelectTrigger className="w-[140px] h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {orderStatuses.map(s => (
                                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="gap-2"
                                onClick={() => {
                                  const link = getWhatsAppLink(order.customerPhone)
                                  window.open(link, '_blank')
                                }}
                              >
                                <MessageCircle className="h-4 w-4" />
                                Message Customer
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Products</CardTitle>
                  <Button onClick={() => setProductDialogOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Product
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-[#757575]">Loading...</div>
                ) : products.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                    <p className="text-[#757575] font-medium">No products yet</p>
                    <p className="text-sm text-[#757575] mt-1">Add your first product to start selling on WhatsApp</p>
                    <Button className="mt-4 gap-2" onClick={() => setProductDialogOpen(true)}>
                      <Plus className="h-4 w-4" />
                      Add First Product
                    </Button>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {products.map(product => (
                      <div key={product.id} className="p-4 rounded-lg border border-gray-200 hover:border-[#00897B]/30 transition-colors">
                        <div className="aspect-square rounded-lg bg-gray-100 mb-3 flex items-center justify-center">
                          {product.images ? (
                            <img src={product.images.split(',')[0]} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <ImageIcon className="h-12 w-12 text-gray-300" />
                          )}
                        </div>
                        <h3 className="font-medium text-sm">{product.name}</h3>
                        <p className="text-xs text-[#757575] mb-2">{product.category}</p>
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-[#00897B]">{formatCurrency(product.price)}</p>
                          <Badge variant={product.stockQuantity > 0 ? "secondary" : "destructive"} className="text-xs">
                            {product.stockQuantity} in stock
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Customers</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
                    <Input 
                      placeholder="Search customers..." 
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-[#757575]">Loading...</div>
                ) : customers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                    <p className="text-[#757575] font-medium">No customers yet</p>
                    <p className="text-sm text-[#757575] mt-1">Customers will appear here after they place orders</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {customers
                        .filter(c => 
                          searchQuery === '' || 
                          c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.phone.includes(searchQuery)
                        )
                        .map(customer => (
                        <div key={customer.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#00897B]/10 flex items-center justify-center">
                              <Users className="h-5 w-5 text-[#00897B]" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{customer.name || 'Unknown'}</p>
                              <p className="text-xs text-[#757575]">{customer.phone}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{customer.totalOrders} orders</p>
                            <p className="text-xs text-[#757575]">{formatCurrency(customer.totalSpent)} spent</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">WhatsApp Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">WhatsApp Number</Label>
                    <Input 
                      className="mt-1.5"
                      value={settings?.whatsappNumber || DEFAULT_WHATSAPP}
                      readOnly
                    />
                    <p className="text-xs text-[#757575] mt-1">
                      This is the number customers will message
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Business Name</Label>
                    <Input 
                      className="mt-1.5"
                      placeholder="Your business name"
                      defaultValue={settings?.businessName}
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Greeting Message</Label>
                    <Textarea 
                      className="mt-1.5"
                      placeholder="Welcome message customers see"
                      defaultValue={settings?.greetingMessage}
                      rows={3}
                    />
                  </div>
                  
                  <Button className="w-full">Save Settings</Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">WhatsApp Business API</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 mb-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-900">Upgrade to Business API</p>
                        <p className="text-sm text-blue-700 mt-1">
                          Get automated messages, chatbots, and template messages when you upgrade to WhatsApp Business API.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm">Click-to-chat (current)</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 opacity-50">
                      <Clock className="h-5 w-5 text-gray-400" />
                      <span className="text-sm">Automated replies (requires API)</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 opacity-50">
                      <Clock className="h-5 w-5 text-gray-400" />
                      <span className="text-sm">Template messages (requires API)</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 opacity-50">
                      <Clock className="h-5 w-5 text-gray-400" />
                      <span className="text-sm">Chatbot flows (requires API)</span>
                    </div>
                  </div>
                  
                  <Button variant="outline" className="w-full mt-4">
                    Learn About Business API
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Product Dialog */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Add a product to your WhatsApp catalog
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Product Name *</Label>
              <Input 
                className="mt-1.5"
                placeholder="e.g. Chicken Burger"
                value={productForm.name}
                onChange={(e) => setProductForm({...productForm, name: e.target.value})}
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium">Description</Label>
              <Textarea 
                className="mt-1.5"
                placeholder="Product description"
                value={productForm.description}
                onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Category</Label>
                <Select 
                  value={productForm.category} 
                  onValueChange={(v) => setProductForm({...productForm, category: v})}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="food">Food</SelectItem>
                    <SelectItem value="drinks">Drinks</SelectItem>
                    <SelectItem value="groceries">Groceries</SelectItem>
                    <SelectItem value="clothing">Clothing</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="services">Services</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Price (R) *</Label>
                <Input 
                  type="number"
                  className="mt-1.5"
                  placeholder="0.00"
                  value={productForm.price}
                  onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                />
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Stock Quantity</Label>
              <Input 
                type="number"
                className="mt-1.5"
                value={productForm.stockQuantity}
                onChange={(e) => setProductForm({...productForm, stockQuantity: e.target.value})}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateProduct} disabled={!productForm.name || !productForm.price}>
              Add Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Share Dialog */}
      <Dialog open={whatsappDialogOpen} onOpenChange={setWhatsappDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share Your WhatsApp Link</DialogTitle>
            <DialogDescription>
              Customers can click this link to message you directly on WhatsApp
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-[#25D366]/5 border border-[#25D366]/20">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-[#25D366]" />
                <code className="text-sm font-mono">{getWhatsAppLink()}</code>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={copyWhatsAppLink}
              >
                <Copy className="h-4 w-4" />
                Copy Link
              </Button>
              <Button 
                className="gap-2 bg-[#25D366] hover:bg-[#128C7E]"
                onClick={() => window.open(getWhatsAppLink(), '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
                Test Link
              </Button>
            </div>
            
            <div className="p-3 rounded-lg bg-gray-50">
              <p className="text-xs text-[#757575]">
                <strong>Tip:</strong> Share this link on your social media, website, or business cards. 
                When customers click it, WhatsApp will open with your number pre-filled.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Detail Dialog */}
      <Dialog open={orderDetailOpen} onOpenChange={setOrderDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order {selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div>
                  <p className="font-medium">{selectedOrder.customerName || 'Customer'}</p>
                  <p className="text-sm text-[#757575]">{selectedOrder.customerPhone}</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="gap-2"
                  onClick={() => window.open(getWhatsAppLink(selectedOrder.customerPhone), '_blank')}
                >
                  <MessageCircle className="h-4 w-4" />
                  Message
                </Button>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Items</p>
                <div className="space-y-2">
                  {selectedOrder.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span>{item.quantity}x {item.productName}</span>
                      <span className="font-medium">{formatCurrency(item.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between font-semibold">
                <span>Total</span>
                <span className="text-[#00897B]">{formatCurrency(selectedOrder.total)}</span>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Status</p>
                <Select 
                  value={selectedOrder.status} 
                  onValueChange={(value) => {
                    handleUpdateOrderStatus(selectedOrder.id, value)
                    setSelectedOrder({...selectedOrder, status: value})
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {orderStatuses.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
