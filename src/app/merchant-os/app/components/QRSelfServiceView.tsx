'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  QrCode,
  Smartphone,
  Utensils,
  ShoppingCart,
  Clock,
  CheckCircle2,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Wallet,
  MessageCircle,
  Bell,
  Settings,
  Eye,
  Copy,
  Download,
  Share2,
  RefreshCw,
  Users,
  Timer,
  ChefHat,
  Flame,
  Snowflake,
  Pizza,
  Wine,
  Cake,
  Salad,
  Soup,
  Coffee,
  Star,
  Heart,
  ExternalLink,
  Wifi,
} from 'lucide-react'

// Types
type OrderStatus = 'cart' | 'placed' | 'preparing' | 'ready' | 'served' | 'paid'
type MenuCategory = 'starters' | 'mains' | 'sides' | 'desserts' | 'drinks' | 'specials'

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: MenuCategory
  image?: string
  dietary: string[]
  allergens: string[]
  spicyLevel?: number
  popular: boolean
  preparationTime: number
  available: boolean
}

interface CartItem extends MenuItem {
  quantity: number
  notes?: string
  modifiers?: { name: string; price: number }[]
}

interface TableOrder {
  id: string
  tableNumber: string
  items: CartItem[]
  status: OrderStatus
  total: number
  placedAt?: Date
  estimatedReady?: Date
}

// Sample menu data
const menuItems: MenuItem[] = [
  // Starters
  { id: '1', name: 'Garlic Bread', description: 'Toasted bread with garlic butter and herbs', price: 35, category: 'starters', dietary: [], allergens: ['gluten', 'dairy'], popular: true, preparationTime: 5, available: true },
  { id: '2', name: 'Calamari Rings', description: 'Crispy fried calamari with lemon aioli', price: 75, category: 'starters', dietary: [], allergens: ['shellfish'], popular: false, preparationTime: 10, available: true },
  { id: '3', name: 'Spring Rolls (4pc)', description: 'Vegetable spring rolls with sweet chili sauce', price: 45, category: 'starters', dietary: ['vegan'], allergens: ['gluten'], popular: true, preparationTime: 8, available: true },
  { id: '4', name: 'Chicken Livers Peri-Peri', description: 'Spicy Portuguese-style chicken livers', price: 68, category: 'starters', dietary: [], allergens: [], spicyLevel: 3, popular: false, preparationTime: 12, available: true },
  
  // Mains
  { id: '5', name: 'Sirloin Steak (300g)', description: 'Grilled sirloin with choice of sauce, served with chips and salad', price: 185, category: 'mains', dietary: [], allergens: [], popular: true, preparationTime: 20, available: true },
  { id: '6', name: 'Grilled Salmon', description: 'Atlantic salmon with lemon butter sauce and seasonal vegetables', price: 175, category: 'mains', dietary: ['gluten-free'], allergens: ['fish'], popular: true, preparationTime: 15, available: true },
  { id: '7', name: 'Lamb Chops (4pc)', description: 'Grilled lamb chops with rosemary and garlic', price: 195, category: 'mains', dietary: [], allergens: [], popular: false, preparationTime: 18, available: true },
  { id: '8', name: 'Vegetable Curry', description: 'Spiced vegetable curry with basmati rice and naan', price: 95, category: 'mains', dietary: ['vegan', 'gluten-free'], allergens: [], spicyLevel: 2, popular: false, preparationTime: 15, available: true },
  { id: '9', name: 'Bobotie', description: 'Traditional Cape Malay dish with yellow rice and sambals', price: 95, category: 'mains', dietary: [], allergens: ['eggs'], popular: true, preparationTime: 12, available: true },
  { id: '10', name: 'Peri-Peri Chicken (Half)', description: 'Flame-grilled chicken with peri-peri sauce', price: 125, category: 'mains', dietary: [], allergens: [], spicyLevel: 2, popular: true, preparationTime: 20, available: true },
  
  // Sides
  { id: '11', name: 'French Fries', description: 'Crispy golden fries', price: 28, category: 'sides', dietary: ['vegan'], allergens: [], popular: false, preparationTime: 8, available: true },
  { id: '12', name: 'Creamed Spinach', description: 'Creamy spinach with nutmeg', price: 32, category: 'sides', dietary: ['vegetarian'], allergens: ['dairy'], popular: false, preparationTime: 5, available: true },
  { id: '13', name: 'Rice', description: 'Steamed basmati rice', price: 25, category: 'sides', dietary: ['vegan', 'gluten-free'], allergens: [], popular: false, preparationTime: 3, available: true },
  { id: '14', name: 'Chakalaka', description: 'Spicy vegetable relish', price: 28, category: 'sides', dietary: ['vegan'], allergens: [], popular: false, preparationTime: 3, available: true },
  
  // Desserts
  { id: '15', name: 'Malva Pudding', description: 'Warm sponge pudding with apricot jam and custard', price: 55, category: 'desserts', dietary: ['vegetarian'], allergens: ['gluten', 'dairy', 'eggs'], popular: true, preparationTime: 8, available: true },
  { id: '16', name: 'Ice Cream (2 scoops)', description: 'Choice of vanilla, chocolate, or strawberry', price: 35, category: 'desserts', dietary: ['vegetarian'], allergens: ['dairy'], popular: false, preparationTime: 2, available: true },
  { id: '17', name: 'Chocolate Brownie', description: 'Warm brownie with ice cream and chocolate sauce', price: 58, category: 'desserts', dietary: ['vegetarian'], allergens: ['gluten', 'dairy', 'eggs'], popular: true, preparationTime: 5, available: true },
  
  // Drinks
  { id: '18', name: 'Coca-Cola 330ml', description: 'Classic Coke', price: 18, category: 'drinks', dietary: ['vegan'], allergens: [], popular: false, preparationTime: 1, available: true },
  { id: '19', name: 'Fresh Orange Juice', description: 'Freshly squeezed orange juice', price: 28, category: 'drinks', dietary: ['vegan'], allergens: [], popular: false, preparationTime: 2, available: true },
  { id: '20', name: 'Coffee', description: 'Espresso-based coffee', price: 22, category: 'drinks', dietary: ['vegan'], allergens: [], popular: false, preparationTime: 3, available: true },
  { id: '21', name: 'House Wine (Glass)', description: 'Red or White', price: 45, category: 'drinks', dietary: ['vegan'], allergens: ['sulphites'], popular: false, preparationTime: 1, available: true },
]

const categoryConfig: Record<MenuCategory, { name: string; icon: any; color: string }> = {
  starters: { name: 'Starters', icon: Salad, color: 'bg-amber-100 text-amber-700' },
  mains: { name: 'Mains', icon: Utensils, color: 'bg-red-100 text-red-700' },
  sides: { name: 'Sides', icon: Soup, color: 'bg-orange-100 text-orange-700' },
  desserts: { name: 'Desserts', icon: Cake, color: 'bg-pink-100 text-pink-700' },
  drinks: { name: 'Drinks', icon: Wine, color: 'bg-purple-100 text-purple-700' },
  specials: { name: "Chef's Specials", icon: Star, color: 'bg-yellow-100 text-yellow-700' },
}

export function QRSelfServiceView() {
  const [tableNumber, setTableNumber] = useState('12')
  const [cart, setCart] = useState<CartItem[]>([])
  const [activeCategory, setActiveCategory] = useState<MenuCategory>('starters')
  const [order, setOrder] = useState<TableOrder | null>(null)
  const [viewMode, setViewMode] = useState<'menu' | 'cart' | 'status' | 'admin'>('admin')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [itemDetailOpen, setItemDetailOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [itemNotes, setItemNotes] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // QR Code settings
  const [qrSettings, setQrSettings] = useState({
    enabled: true,
    autoAcceptOrders: true,
    requirePayment: false,
    maxItemsPerOrder: 20,
    allowCallWaiter: true,
    showPrepTime: true,
    wifiSsid: 'Groway-Guest',
    wifiPassword: 'Welcome2026',
  })

  // Update time
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Calculate totals
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const cartVat = cartTotal * 0.15
  const cartGrandTotal = cartTotal + cartVat
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  // Add to cart
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { ...item, quantity: 1 }]
    })
    toast.success(`${item.name} added to cart`)
  }

  // Update quantity
  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQty = item.quantity + delta
        return newQty > 0 ? { ...item, quantity: newQty } : item
      }
      return item
    }).filter(item => item.quantity > 0))
  }

  // Remove from cart
  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId))
  }

  // Place order
  const placeOrder = () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty')
      return
    }
    
    const newOrder: TableOrder = {
      id: `ORD-${Date.now()}`,
      tableNumber,
      items: cart,
      status: 'placed',
      total: cartGrandTotal,
      placedAt: new Date(),
      estimatedReady: new Date(Date.now() + 20 * 60000), // 20 min from now
    }
    
    setOrder(newOrder)
    setCart([])
    setViewMode('status')
    toast.success('Order placed successfully!')
  }

  // Get time remaining
  const getTimeRemaining = () => {
    if (!order?.estimatedReady) return null
    const remaining = Math.floor((order.estimatedReady.getTime() - currentTime.getTime()) / 60000)
    return Math.max(0, remaining)
  }

  // Copy QR URL
  const copyQRUrl = () => {
    const url = `${window.location.origin}/order/${tableNumber}`
    navigator.clipboard.writeText(url)
    toast.success('QR URL copied to clipboard!')
  }

  // Generate QR data for printing
  const qrUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/order/${tableNumber}`
    : ''

  return (
    <div className="h-full flex flex-col bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
              <QrCode className="h-5 w-5 text-[#00897B]" />
              QR Self-Service Ordering
            </h1>
            <p className="text-sm text-[#757575]">Let customers order directly from their phone</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label className="text-sm">Table:</Label>
              <Input 
                value={tableNumber} 
                onChange={(e) => setTableNumber(e.target.value)}
                className="w-20 h-8"
              />
            </div>
            
            <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
              <Settings className="h-4 w-4 mr-1" />Settings
            </Button>
            
            <Switch
              checked={qrSettings.enabled}
              onCheckedChange={(checked) => setQrSettings(prev => ({ ...prev, enabled: checked }))}
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="mt-4">
          <TabsList className="bg-gray-100">
            <TabsTrigger value="admin">QR Management</TabsTrigger>
            <TabsTrigger value="menu">Menu Preview</TabsTrigger>
            <TabsTrigger value="cart">Cart ({cartItemCount})</TabsTrigger>
            <TabsTrigger value="status">Order Status</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {/* QR Management Tab */}
        {viewMode === 'admin' && (
          <div className="h-full p-6">
            <div className="max-w-4xl mx-auto grid grid-cols-2 gap-6">
              {/* QR Code Card */}
              <Card className="border-2 border-[#00897B]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-[#00897B]" />
                    Table {tableNumber} QR Code
                  </CardTitle>
                  <CardDescription>
                    Print and display this QR code on the table
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* QR Code Placeholder */}
                  <div className="w-64 h-64 mx-auto bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <QrCode className="h-32 w-32 mx-auto text-[#00897B] opacity-50" />
                      <p className="text-sm text-[#757575] mt-2">Scan to Order</p>
                      <p className="text-xs text-[#00897B] font-medium">Table {tableNumber}</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-[#757575] mb-1">Order URL:</p>
                    <div className="flex items-center gap-2">
                      <Input 
                        value={qrUrl} 
                        readOnly 
                        className="h-8 text-sm bg-white"
                      />
                      <Button size="sm" variant="outline" onClick={copyQRUrl}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button className="bg-[#00897B] hover:bg-[#00695C]">
                      <Download className="h-4 w-4 mr-2" />Download QR
                    </Button>
                    <Button variant="outline">
                      <Printer className="h-4 w-4 mr-2" />Print
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Stats & Settings */}
              <div className="space-y-4">
                {/* Today's Stats */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Today's QR Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-[#00897B]">47</p>
                        <p className="text-xs text-[#757575]">Orders</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-amber-600">R8,450</p>
                        <p className="text-xs text-[#757575]">Revenue</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">R180</p>
                        <p className="text-xs text-[#757575]">Avg Order</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">12m</p>
                        <p className="text-xs text-[#757575]">Avg Time</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Settings */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Quick Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-[#00897B]" />
                        <span className="text-sm">Auto-accept orders</span>
                      </div>
                      <Switch
                        checked={qrSettings.autoAcceptOrders}
                        onCheckedChange={(checked) => setQrSettings(prev => ({ ...prev, autoAcceptOrders: checked }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-[#00897B]" />
                        <span className="text-sm">Require payment upfront</span>
                      </div>
                      <Switch
                        checked={qrSettings.requirePayment}
                        onCheckedChange={(checked) => setQrSettings(prev => ({ ...prev, requirePayment: checked }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-[#00897B]" />
                        <span className="text-sm">Show prep time</span>
                      </div>
                      <Switch
                        checked={qrSettings.showPrepTime}
                        onCheckedChange={(checked) => setQrSettings(prev => ({ ...prev, showPrepTime: checked }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-[#00897B]" />
                        <span className="text-sm">Allow call waiter</span>
                      </div>
                      <Switch
                        checked={qrSettings.allowCallWaiter}
                        onCheckedChange={(checked) => setQrSettings(prev => ({ ...prev, allowCallWaiter: checked }))}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* WiFi Card */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Wifi className="h-4 w-4" />
                      Guest WiFi
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-[#757575]">SSID</Label>
                        <Input 
                          value={qrSettings.wifiSsid}
                          onChange={(e) => setQrSettings(prev => ({ ...prev, wifiSsid: e.target.value }))}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-[#757575]">Password</Label>
                        <Input 
                          value={qrSettings.wifiPassword}
                          onChange={(e) => setQrSettings(prev => ({ ...prev, wifiPassword: e.target.value }))}
                          className="h-8"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-[#757575]">WiFi credentials shown on customer's phone</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Menu Preview Tab */}
        {viewMode === 'menu' && (
          <div className="h-full flex">
            {/* Categories */}
            <div className="w-48 bg-white border-r border-gray-200">
              <ScrollArea className="h-full">
                <div className="p-3 space-y-1">
                  {Object.entries(categoryConfig).map(([key, config]) => {
                    const count = menuItems.filter(i => i.category === key && i.available).length
                    if (count === 0) return null
                    
                    return (
                      <button
                        key={key}
                        onClick={() => setActiveCategory(key as MenuCategory)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all ${
                          activeCategory === key 
                            ? 'bg-[#E0F2F1] text-[#00897B] font-medium' 
                            : 'text-[#757575] hover:bg-gray-100'
                        }`}
                      >
                        <config.icon className="h-4 w-4" />
                        <span className="flex-1">{config.name}</span>
                        <Badge variant="outline" className="text-[10px]">{count}</Badge>
                      </button>
                    )
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Menu Items */}
            <ScrollArea className="flex-1 p-4">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {menuItems
                  .filter(item => item.category === activeCategory && item.available)
                  .map((item) => {
                    const config = categoryConfig[item.category]
                    const inCart = cart.find(i => i.id === item.id)
                    
                    return (
                      <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="h-32 bg-gray-100 relative">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <config.icon className="h-12 w-12 text-gray-300" />
                          </div>
                          {item.popular && (
                            <Badge className="absolute top-2 left-2 bg-yellow-500 text-white">
                              <Star className="h-3 w-3 mr-1" />Popular
                            </Badge>
                          )}
                          {inCart && (
                            <Badge className="absolute top-2 right-2 bg-[#00897B] text-white">
                              {inCart.quantity} in cart
                            </Badge>
                          )}
                        </div>
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="font-medium text-sm">{item.name}</h3>
                            <p className="font-bold text-[#00897B]">R{item.price}</p>
                          </div>
                          <p className="text-xs text-[#757575] mb-2 line-clamp-2">{item.description}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              {item.dietary.map(d => (
                                <Badge key={d} className="text-[8px] px-1 bg-green-100 text-green-700">{d[0].toUpperCase()}</Badge>
                              ))}
                              {item.spicyLevel && (
                                <span className="text-red-500 text-xs">{'🌶️'.repeat(item.spicyLevel)}</span>
                              )}
                            </div>
                            <Button 
                              size="sm" 
                              className="bg-[#00897B] hover:bg-[#00695C]"
                              onClick={() => addToCart(item)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
              </div>
            </ScrollArea>

            {/* Cart Sidebar */}
            {cart.length > 0 && (
              <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
                <div className="p-3 border-b border-gray-200">
                  <h3 className="font-medium flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Your Cart ({cartItemCount})
                  </h3>
                </div>
                
                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="font-medium w-6 text-center">{item.quantity}</span>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <p className="text-xs text-[#757575]">R{item.price} each</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">R{(item.price * item.quantity).toFixed(0)}</p>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 text-red-400"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                <div className="p-3 border-t border-gray-200 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>R{cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>VAT (15%)</span>
                    <span>R{cartVat.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>R{cartGrandTotal.toFixed(2)}</span>
                  </div>
                  <Button 
                    className="w-full bg-[#00897B] hover:bg-[#00695C]"
                    onClick={placeOrder}
                  >
                    Place Order
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Order Status Tab */}
        {viewMode === 'status' && (
          <div className="h-full flex items-center justify-center p-6">
            {order ? (
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle className="text-center">
                    Order {order.id}
                  </CardTitle>
                  <CardDescription className="text-center">
                    Table {order.tableNumber}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Status Progress */}
                  <div className="space-y-2">
                    {[
                      { key: 'placed', label: 'Order Placed', icon: CheckCircle2 },
                      { key: 'preparing', label: 'Preparing', icon: ChefHat },
                      { key: 'ready', label: 'Ready', icon: Bell },
                      { key: 'served', label: 'Served', icon: Utensils },
                    ].map((step, index) => {
                      const statusOrder = ['placed', 'preparing', 'ready', 'served']
                      const currentIndex = statusOrder.indexOf(order.status)
                      const stepIndex = statusOrder.indexOf(step.key)
                      const isActive = stepIndex === currentIndex
                      const isPast = stepIndex < currentIndex
                      
                      return (
                        <div 
                          key={step.key}
                          className={`flex items-center gap-3 p-2 rounded-lg ${
                            isActive ? 'bg-[#E0F2F1]' : isPast ? 'bg-green-50' : 'bg-gray-50'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isActive ? 'bg-[#00897B] text-white' : 
                            isPast ? 'bg-green-600 text-white' : 
                            'bg-gray-200 text-gray-400'
                          }`}>
                            <step.icon className="h-4 w-4" />
                          </div>
                          <span className={`font-medium ${
                            isActive ? 'text-[#00897B]' : 
                            isPast ? 'text-green-600' : 
                            'text-gray-400'
                          }`}>
                            {step.label}
                          </span>
                          {isActive && step.key === 'preparing' && (
                            <Badge className="ml-auto">~{getTimeRemaining()} min</Badge>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  
                  {/* Items */}
                  <div>
                    <p className="text-xs font-medium text-[#757575] mb-2">ORDER ITEMS</p>
                    <div className="space-y-1">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>{item.quantity}x {item.name}</span>
                          <span className="text-[#757575]">R{(item.price * item.quantity).toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>R{order.total.toFixed(2)}</span>
                  </div>
                  
                  {/* Call Waiter */}
                  <Button variant="outline" className="w-full">
                    <Users className="h-4 w-4 mr-2" />Call Waiter
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center text-[#757575]">
                <Clock className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No active order</p>
                <p className="text-sm">Place an order to see its status here</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>QR Ordering Settings</DialogTitle>
            <DialogDescription>
              Configure how customers interact with the QR ordering system
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Order Settings</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Max items per order</Label>
                  <Input 
                    type="number" 
                    value={qrSettings.maxItemsPerOrder}
                    onChange={(e) => setQrSettings(prev => ({ ...prev, maxItemsPerOrder: parseInt(e.target.value) || 20 }))}
                  />
                </div>
                <div className="flex items-end">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={qrSettings.autoAcceptOrders}
                      onCheckedChange={(checked) => setQrSettings(prev => ({ ...prev, autoAcceptOrders: checked }))}
                    />
                    <Label>Auto-accept</Label>
                  </div>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Payment</h4>
              <div className="flex items-center gap-2">
                <Switch
                  checked={qrSettings.requirePayment}
                  onCheckedChange={(checked) => setQrSettings(prev => ({ ...prev, requirePayment: checked }))}
                />
                <Label>Require payment before placing order</Label>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Customer Features</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={qrSettings.showPrepTime}
                    onCheckedChange={(checked) => setQrSettings(prev => ({ ...prev, showPrepTime: checked }))}
                  />
                  <Label>Show estimated preparation time</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={qrSettings.allowCallWaiter}
                    onCheckedChange={(checked) => setQrSettings(prev => ({ ...prev, allowCallWaiter: checked }))}
                  />
                  <Label>Allow "Call Waiter" button</Label>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setSettingsOpen(false)}>
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Add Printer import
import { Printer } from 'lucide-react'
