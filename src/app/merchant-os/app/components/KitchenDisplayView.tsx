'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
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
  ChefHat,
  Clock,
  Timer,
  CheckCircle2,
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  RefreshCw,
  Play,
  Pause,
  SkipForward,
  Grid3X3,
  LayoutList,
  Plus,
  Trash2,
  Printer,
  Table2,
  Zap,
  Flame,
  Snowflake,
  Pizza,
  Wine,
  Cake,
  Utensils,
  Salad,
  Coffee,
  Soup,
  Maximize,
  Minimize,
  X,
  Loader2,
  GlassWater,
} from 'lucide-react'

// Types
type ItemStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled'
type OrderType = 'dine-in' | 'takeaway' | 'delivery' | 'drive-through'
type Priority = 'normal' | 'high' | 'urgent'
type Station = 'all' | 'grill' | 'fryer' | 'cold' | 'dessert' | 'bar-hot' | 'bar-cold'

interface OrderItem {
  id: string
  name: string
  quantity: number
  notes?: string | null
  modifiers?: string | null
  status: ItemStatus
  station: string
  preparationTime: number
  startedAt?: Date | null
  completedAt?: Date | null
  dietary?: string | null
  allergens?: string | null
  spicyLevel?: number | null
  orderId: string
}

interface KitchenOrder {
  id: string
  orderNumber: string
  type: OrderType
  priority: Priority
  tableNumber?: string | null
  customerName?: string | null
  items: OrderItem[]
  status: 'new' | 'in-progress' | 'ready' | 'completed'
  createdAt: string
  estimatedTime: number
  stationRoutings: { station: string }[]
  notes?: string | null
  waiterName?: string | null
}

interface KitchenStation {
  id: string
  name: string
  icon: string
  color: string
  active: boolean
}

// Station config - matches WaiterPad stations
const stationConfig: { id: Station; name: string; icon: any; color: string; type: 'kitchen' | 'bar' }[] = [
  { id: 'grill', name: 'Grill', icon: Flame, color: '#EF4444', type: 'kitchen' },
  { id: 'fryer', name: 'Fryer', icon: Flame, color: '#F97316', type: 'kitchen' },
  { id: 'cold', name: 'Cold Station', icon: Salad, color: '#22C55E', type: 'kitchen' },
  { id: 'dessert', name: 'Dessert', icon: Cake, color: '#EC4899', type: 'kitchen' },
  { id: 'bar-hot', name: 'Bar - Hot Drinks', icon: Coffee, color: '#8B5CF6', type: 'bar' },
  { id: 'bar-cold', name: 'Bar - Cold Drinks', icon: Wine, color: '#06B6D4', type: 'bar' },
]

const statusColors: Record<ItemStatus, { bg: string; border: string; text: string }> = {
  pending: { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-700' },
  preparing: { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-700' },
  ready: { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-700' },
  served: { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-500' },
  cancelled: { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-700' },
}

const priorityColors: Record<Priority, { bg: string; text: string; border: string }> = {
  normal: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300' },
  high: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
  urgent: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
}

export function KitchenDisplayView() {
  const [orders, setOrders] = useState<KitchenOrder[]>([])
  const [stations, setStations] = useState<KitchenStation[]>([])
  const [activeStation, setActiveStation] = useState<Station>('all')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [fullscreen, setFullscreen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedOrder, setSelectedOrder] = useState<KitchenOrder | null>(null)
  const [orderDetailOpen, setOrderDetailOpen] = useState(false)
  const [newOrderDialogOpen, setNewOrderDialogOpen] = useState(false)
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // New order form
  const [newOrder, setNewOrder] = useState<Partial<KitchenOrder>>({
    type: 'dine-in',
    priority: 'normal',
    items: [],
    notes: '',
  })
  const [newItem, setNewItem] = useState<Partial<OrderItem>>({
    name: '',
    quantity: 1,
    station: 'grill',
    preparationTime: 15,
    notes: '',
  })
  
  // Update time
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Fetch data on mount
  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [activeStation])

  const fetchData = async () => {
    try {
      const status = activeStation === 'all' ? undefined : undefined
      const [ordersRes, stationsRes] = await Promise.all([
        fetch(`/merchant-os/api/kitchen/orders?station=${activeStation}`),
        fetch('/merchant-os/api/kitchen/stations'),
      ])
      
      const ordersData = await ordersRes.json()
      const stationsData = await stationsRes.json()
      
      setOrders(ordersData.map((order: any) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        type: order.type,
        priority: order.priority,
        tableNumber: order.tableNumber,
        customerName: order.customerName,
        status: order.status,
        createdAt: order.createdAt,
        estimatedTime: order.estimatedTime,
        notes: order.notes,
        waiterName: order.waiterName,
        items: order.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          notes: item.notes,
          modifiers: item.modifiers,
          status: item.status,
          station: item.station,
          preparationTime: item.preparationTime,
          startedAt: item.startedAt,
          completedAt: item.completedAt,
          dietary: item.dietary,
          allergens: item.allergens,
          spicyLevel: item.spicyLevel,
          orderId: item.orderId,
        })),
        stationRoutings: order.stationRoutings || [],
      })))
      
      setStations(stationsData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Stats
  const newOrders = orders.filter(o => o.status === 'new').length
  const inProgressOrders = orders.filter(o => o.status === 'in-progress').length
  const readyOrders = orders.filter(o => o.status === 'ready').length
  const totalItems = orders.reduce((sum, o) => sum + o.items.filter(i => i.status !== 'served' && i.status !== 'cancelled').length, 0)
  
  const getTimeRemaining = (order: KitchenOrder) => {
    const elapsed = Math.floor((currentTime.getTime() - new Date(order.createdAt).getTime()) / 60000)
    return order.estimatedTime - elapsed
  }
  
  const filteredOrders = orders.filter(order => {
    if (activeStation === 'all') return order.status !== 'completed'
    return order.stationRoutings.some(s => s.station === activeStation) && order.status !== 'completed'
  }).sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, normal: 2 }
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    }
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })
  
  // Order CRUD
  const createOrder = async () => {
    if (!newOrder.items?.length) {
      toast.error('Add at least one item')
      return
    }
    
    setSaving(true)
    try {
      const res = await fetch('/merchant-os/api/kitchen/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: `ORD-${String(orders.length + 1).padStart(3, '0')}`,
          type: newOrder.type,
          priority: newOrder.priority,
          tableNumber: newOrder.tableNumber,
          customerName: newOrder.customerName,
          notes: newOrder.notes,
          waiterName: newOrder.waiterName,
          estimatedTime: Math.max(...(newOrder.items?.map(i => i.preparationTime) || [15])),
          items: newOrder.items,
          stationRoutings: [...new Set(newOrder.items?.map(i => i.station) || [])],
        }),
      })
      
      if (!res.ok) throw new Error('Failed to create order')
      
      const order = await res.json()
      setOrders(prev => [order, ...prev])
      setNewOrderDialogOpen(false)
      setNewOrder({ type: 'dine-in', priority: 'normal', items: [], notes: '' })
      toast.success('Order created')
    } catch (error) {
      console.error('Error creating order:', error)
      toast.error('Failed to create order')
    } finally {
      setSaving(false)
    }
  }
  
  const updateOrder = async (orderId: string, updates: Partial<KitchenOrder>) => {
    try {
      const res = await fetch(`/merchant-os/api/kitchen/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      
      if (!res.ok) throw new Error('Failed to update order')
      
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updates } : o))
    } catch (error) {
      console.error('Error updating order:', error)
      toast.error('Failed to update order')
    }
  }
  
  const deleteOrder = async (orderId: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/merchant-os/api/kitchen/orders/${orderId}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) throw new Error('Failed to delete order')
      
      setOrders(prev => prev.filter(o => o.id !== orderId))
      setOrderDetailOpen(false)
      toast.success('Order deleted')
    } catch (error) {
      console.error('Error deleting order:', error)
      toast.error('Failed to delete order')
    } finally {
      setSaving(false)
    }
  }
  
  // Item management
  const addItemToOrder = () => {
    if (!newItem.name) {
      toast.error('Item name is required')
      return
    }
    
    const item: OrderItem = {
      id: `temp-${Date.now()}`,
      name: newItem.name,
      quantity: newItem.quantity || 1,
      notes: newItem.notes,
      station: newItem.station || 'grill',
      preparationTime: newItem.preparationTime || 15,
      status: 'pending',
      orderId: '',
    }
    
    setNewOrder(prev => ({
      ...prev,
      items: [...(prev.items || []), item],
    }))
    
    setAddItemDialogOpen(false)
    setNewItem({ name: '', quantity: 1, station: 'grill', preparationTime: 15, notes: '' })
    toast.success('Item added')
  }
  
  const removeItemFromOrder = (itemId: string) => {
    setNewOrder(prev => ({
      ...prev,
      items: prev.items?.filter(i => i.id !== itemId) || [],
    }))
  }
  
  const updateItemStatus = async (orderId: string, itemId: string, status: ItemStatus) => {
    try {
      const res = await fetch(`/merchant-os/api/kitchen/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      
      if (!res.ok) throw new Error('Failed to update item')
      
      setOrders(prev => prev.map(order => {
        if (order.id === orderId) {
          const updatedItems = order.items.map(item => {
            if (item.id === itemId) {
              return { ...item, status }
            }
            return item
          })
          
          let newOrderStatus = order.status
          if (updatedItems.some(i => i.status === 'preparing')) newOrderStatus = 'in-progress'
          if (updatedItems.every(i => i.status === 'ready' || i.status === 'served')) newOrderStatus = 'ready'
          
          return { ...order, items: updatedItems, status: newOrderStatus }
        }
        return order
      }))
    } catch (error) {
      console.error('Error updating item status:', error)
      toast.error('Failed to update item status')
    }
  }
  
  const bumpOrder = async (orderId: string) => {
    await updateOrder(orderId, { status: 'completed' })
    setOrderDetailOpen(false)
    toast.success('Order completed')
  }
  
  const recallOrder = async (orderId: string) => {
    await updateOrder(orderId, { status: 'new' })
    toast.success('Order recalled')
  }
  
  // Render helpers
  const renderDietary = (dietary?: string | null) => {
    if (!dietary) return null
    try {
      const parsed = JSON.parse(dietary)
      // Handle both array and string formats
      const dietaryArr = Array.isArray(parsed) ? parsed : (typeof parsed === 'string' ? [parsed] : [])
      if (dietaryArr.length === 0) return null
      return (
        <div className="flex gap-1">
          {dietaryArr.map((d: string) => (
            <Badge key={d} className="text-[8px] px-1 bg-green-100 text-green-700">
              {d === 'halaal' ? 'H' : d === 'gluten-free' ? 'GF' : d === 'vegan' ? 'V+' : 'V'}
            </Badge>
          ))}
        </div>
      )
    } catch {
      // If JSON parse fails, treat as plain string
      return (
        <Badge className="text-[8px] px-1 bg-green-100 text-green-700">
          {dietary === 'halaal' ? 'H' : dietary === 'gluten-free' ? 'GF' : dietary === 'vegan' ? 'V+' : 'V'}
        </Badge>
      )
    }
  }
  
  const renderOrderCard = (order: KitchenOrder) => {
    const timeRemaining = getTimeRemaining(order)
    const isOverdue = timeRemaining < 0
    const isUrgent = timeRemaining < 5 && timeRemaining >= 0
    const itemsForStation = activeStation === 'all'
      ? order.items.filter(i => i.status !== 'served' && i.status !== 'cancelled')
      : order.items.filter(i => i.station === activeStation && i.status !== 'served' && i.status !== 'cancelled')
    
    if (itemsForStation.length === 0) return null
    
    return (
      <Card
        key={order.id}
        className={`cursor-pointer transition-all hover:shadow-lg ${
          isOverdue ? 'border-red-500 border-2 animate-pulse' :
          isUrgent ? 'border-amber-500 border-2' :
          order.priority === 'urgent' ? 'border-red-300 border-2' :
          order.status === 'ready' ? 'border-green-500 border-2' : ''
        }`}
        onClick={() => { setSelectedOrder(order); setOrderDetailOpen(true) }}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
              <Badge className={`${priorityColors[order.priority].bg} ${priorityColors[order.priority].text}`}>
                {order.priority}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {order.type === 'dine-in' && (
                <Badge className="bg-[#00897B] text-white"><Table2 className="h-3 w-3 mr-1" />{order.tableNumber}</Badge>
              )}
              {order.type === 'takeaway' && (
                <Badge className="bg-purple-100 text-purple-700"><Utensils className="h-3 w-3 mr-1" />Takeaway</Badge>
              )}
              {order.type === 'delivery' && (
                <Badge className="bg-blue-100 text-blue-700"><Utensils className="h-3 w-3 mr-1" />Delivery</Badge>
              )}
              {order.type === 'drive-through' && (
                <Badge className="bg-orange-100 text-orange-700"><Zap className="h-3 w-3 mr-1" />DT</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="h-3 w-3" />
            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            <span className={isOverdue ? 'text-red-600 font-bold' : isUrgent ? 'text-amber-600 font-bold' : ''}>
              {isOverdue ? `${Math.abs(timeRemaining)}m OVERDUE` : `${timeRemaining}m remaining`}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {itemsForStation.map(item => (
            <div key={item.id} className={`p-2 rounded-lg ${statusColors[item.status].bg} ${statusColors[item.status].border} border`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${statusColors[item.status].text}`}>{item.quantity}x</span>
                  <span className="font-medium text-sm">{item.name}</span>
                  {renderDietary(item.dietary)}
                  {item.spicyLevel && <span className="text-red-500 text-xs">{'🌶️'.repeat(item.spicyLevel)}</span>}
                </div>
                <div className="flex items-center gap-1">
                  {item.status === 'pending' && (
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); updateItemStatus(order.id, item.id, 'preparing') }}>
                      <Play className="h-3 w-3 mr-1" />Start
                    </Button>
                  )}
                  {item.status === 'preparing' && (
                    <Button size="sm" variant="outline" className="h-7 text-xs bg-green-50 border-green-300" onClick={(e) => { e.stopPropagation(); updateItemStatus(order.id, item.id, 'ready') }}>
                      <CheckCircle2 className="h-3 w-3 mr-1" />Done
                    </Button>
                  )}
                  {item.status === 'ready' && (
                    <Badge className="bg-green-600 text-white text-xs"><CheckCircle2 className="h-3 w-3 mr-1" />Ready</Badge>
                  )}
                </div>
              </div>
              {item.notes && <p className="text-xs text-amber-700 mt-1 pl-6">📝 {item.notes}</p>}
            </div>
          ))}
          
          {order.notes && (
            <div className="p-2 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-xs text-amber-700">⚠️ {order.notes}</p>
            </div>
          )}
          
          {order.waiterName && <p className="text-xs text-gray-400">👤 {order.waiterName}</p>}
          
          <div className="flex gap-2 pt-2">
            {order.status === 'ready' && (
              <Button className="flex-1 bg-green-600 hover:bg-green-700" size="sm" onClick={(e) => { e.stopPropagation(); bumpOrder(order.id) }}>
                <CheckCircle2 className="h-4 w-4 mr-2" />BUMP
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); /* Print */ }}>
              <Printer className="h-4 w-4 mr-1" />Print
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#1A1A1A]">
        <Loader2 className="h-8 w-8 animate-spin text-[#00897B]" />
      </div>
    )
  }
  
  return (
    <div className={`h-full flex flex-col bg-[#1A1A1A] text-white ${fullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <header className="bg-[#2A2A2A] border-b border-gray-700 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <ChefHat className="h-6 w-6 text-[#00897B]" />
              <h1 className="text-xl font-bold">Kitchen Display</h1>
            </div>
            
            <Tabs value={activeStation} onValueChange={(v) => setActiveStation(v as Station)}>
              <TabsList className="bg-[#3A3A3A]">
                <TabsTrigger value="all" className="data-[state=active]:bg-[#00897B]">All</TabsTrigger>
                {stationConfig.map(station => (
                  <TabsTrigger key={station.id} value={station.id} className="data-[state=active]:bg-[#00897B]">
                    <station.icon className="h-4 w-4 mr-1" style={{ color: station.color }} />
                    {station.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-2xl font-mono">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            
            <div className="flex gap-3">
              <div className="text-center px-3 py-1 bg-amber-600 rounded">
                <p className="text-lg font-bold">{newOrders}</p>
                <p className="text-[10px]">NEW</p>
              </div>
              <div className="text-center px-3 py-1 bg-blue-600 rounded">
                <p className="text-lg font-bold">{inProgressOrders}</p>
                <p className="text-[10px]">IN PROGRESS</p>
              </div>
              <div className="text-center px-3 py-1 bg-green-600 rounded">
                <p className="text-lg font-bold">{readyOrders}</p>
                <p className="text-[10px]">READY</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-white" onClick={() => setSoundEnabled(!soundEnabled)}>
                {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </Button>
              <Button variant="ghost" size="icon" className="text-white" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
                {viewMode === 'grid' ? <LayoutList className="h-5 w-5" /> : <Grid3X3 className="h-5 w-5" />}
              </Button>
              <Button variant="ghost" size="icon" className="text-white" onClick={() => setFullscreen(!fullscreen)}>
                {fullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
              </Button>
              <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setNewOrderDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />New Order
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Orders Grid */}
      <ScrollArea className="flex-1 p-4">
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-3"}>
          {filteredOrders.map(renderOrderCard)}
        </div>
        
        {filteredOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <ChefHat className="h-16 w-16 mb-4" />
            <p className="text-xl">No orders in queue</p>
          </div>
        )}
      </ScrollArea>
      
      {/* Footer */}
      <footer className="bg-[#2A2A2A] border-t border-gray-700 p-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge className="bg-gray-700"><RefreshCw className="h-3 w-3 mr-1" />Auto-refresh</Badge>
          <span className="text-sm text-gray-400">{totalItems} items across {filteredOrders.length} orders</span>
        </div>
        <span className="text-xs text-gray-500">Last updated: {currentTime.toLocaleTimeString()}</span>
      </footer>
      
      {/* New Order Dialog */}
      <Dialog open={newOrderDialogOpen} onOpenChange={setNewOrderDialogOpen}>
        <DialogContent className="sm:max-w-2xl bg-[#2A2A2A] text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Create New Order</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-sm">Order Type</Label>
                <Select value={newOrder.type} onValueChange={(v) => setNewOrder(prev => ({ ...prev, type: v as OrderType }))}>
                  <SelectTrigger className="mt-1 bg-[#3A3A3A] border-gray-600"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dine-in">Dine-In</SelectItem>
                    <SelectItem value="takeaway">Takeaway</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                    <SelectItem value="drive-through">Drive-Through</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Priority</Label>
                <Select value={newOrder.priority} onValueChange={(v) => setNewOrder(prev => ({ ...prev, priority: v as Priority }))}>
                  <SelectTrigger className="mt-1 bg-[#3A3A3A] border-gray-600"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newOrder.type === 'dine-in' && (
                <div>
                  <Label className="text-sm">Table Number</Label>
                  <Input className="mt-1 bg-[#3A3A3A] border-gray-600" value={newOrder.tableNumber || ''} onChange={(e) => setNewOrder(prev => ({ ...prev, tableNumber: e.target.value }))} placeholder="Table #" />
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Customer Name</Label>
                <Input className="mt-1 bg-[#3A3A3A] border-gray-600" value={newOrder.customerName || ''} onChange={(e) => setNewOrder(prev => ({ ...prev, customerName: e.target.value }))} placeholder="Customer name" />
              </div>
              <div>
                <Label className="text-sm">Waiter Name</Label>
                <Input className="mt-1 bg-[#3A3A3A] border-gray-600" value={newOrder.waiterName || ''} onChange={(e) => setNewOrder(prev => ({ ...prev, waiterName: e.target.value }))} placeholder="Waiter name" />
              </div>
            </div>
            
            <div>
              <Label className="text-sm">Notes</Label>
              <Textarea className="mt-1 bg-[#3A3A3A] border-gray-600" value={newOrder.notes || ''} onChange={(e) => setNewOrder(prev => ({ ...prev, notes: e.target.value }))} placeholder="Special instructions..." />
            </div>
            
            <Separator className="bg-gray-700" />
            
            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm">Items ({newOrder.items?.length || 0})</Label>
                <Button variant="outline" size="sm" onClick={() => setAddItemDialogOpen(true)}><Plus className="h-4 w-4 mr-1" />Add Item</Button>
              </div>
              
              {newOrder.items && newOrder.items.length > 0 && (
                <div className="space-y-2">
                  {newOrder.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-[#3A3A3A] rounded">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{item.quantity}x</Badge>
                        <span>{item.name}</span>
                        <Badge variant="secondary" className="text-xs">{item.station}</Badge>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400" onClick={() => removeItemFromOrder(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOrderDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={createOrder} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Item Dialog */}
      <Dialog open={addItemDialogOpen} onOpenChange={setAddItemDialogOpen}>
        <DialogContent className="bg-[#2A2A2A] text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Add Item</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm">Item Name</Label>
              <Input className="mt-1 bg-[#3A3A3A] border-gray-600" value={newItem.name || ''} onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g., Grilled Kingklip" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Quantity</Label>
                <Input type="number" className="mt-1 bg-[#3A3A3A] border-gray-600" value={newItem.quantity || 1} onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))} />
              </div>
              <div>
                <Label className="text-sm">Station</Label>
                <Select value={newItem.station} onValueChange={(v) => setNewItem(prev => ({ ...prev, station: v }))}>
                  <SelectTrigger className="mt-1 bg-[#3A3A3A] border-gray-600"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {stationConfig.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-sm">Prep Time (min)</Label>
              <Input type="number" className="mt-1 bg-[#3A3A3A] border-gray-600" value={newItem.preparationTime || 15} onChange={(e) => setNewItem(prev => ({ ...prev, preparationTime: parseInt(e.target.value) || 15 }))} />
            </div>
            <div>
              <Label className="text-sm">Notes</Label>
              <Input className="mt-1 bg-[#3A3A3A] border-gray-600" value={newItem.notes || ''} onChange={(e) => setNewItem(prev => ({ ...prev, notes: e.target.value }))} placeholder="Special requests..." />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddItemDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={addItemToOrder}>Add Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Order Detail Dialog */}
      <Dialog open={orderDetailOpen} onOpenChange={setOrderDetailOpen}>
        <DialogContent className="sm:max-w-2xl bg-[#2A2A2A] text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedOrder?.orderNumber}
              <Badge className={`${priorityColors[selectedOrder?.priority || 'normal'].bg} ${priorityColors[selectedOrder?.priority || 'normal'].text}`}>
                {selectedOrder?.priority}
              </Badge>
              {selectedOrder?.tableNumber && (
                <Badge className="bg-[#00897B] text-white">Table {selectedOrder.tableNumber}</Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4 py-4">
              {stationConfig.filter(s => selectedOrder.stationRoutings.some(sr => sr.station === s.id)).map(station => {
                const stationItems = selectedOrder.items.filter(i => i.station === station.id)
                if (stationItems.length === 0) return null
                
                return (
                  <div key={station.id}>
                    <div className="flex items-center gap-2 mb-2">
                      <station.icon className="h-4 w-4" style={{ color: station.color }} />
                      <span className="font-medium text-sm">{station.name}</span>
                    </div>
                    <div className="space-y-2">
                      {stationItems.map(item => (
                        <div key={item.id} className={`p-3 rounded-lg ${statusColors[item.status].bg} ${statusColors[item.status].border} border`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`font-bold ${statusColors[item.status].text}`}>{item.quantity}x</span>
                                <span className="font-medium">{item.name}</span>
                                {renderDietary(item.dietary)}
                              </div>
                              {item.notes && <p className="text-sm text-amber-700 mt-1">📝 {item.notes}</p>}
                            </div>
                            <div className="flex gap-2">
                              {item.status === 'pending' && (
                                <Button size="sm" variant="outline" onClick={() => updateItemStatus(selectedOrder.id, item.id, 'preparing')}>
                                  <Play className="h-4 w-4 mr-1" />Start
                                </Button>
                              )}
                              {item.status === 'preparing' && (
                                <Button size="sm" variant="outline" className="bg-green-50 border-green-300 text-green-700" onClick={() => updateItemStatus(selectedOrder.id, item.id, 'ready')}>
                                  <CheckCircle2 className="h-4 w-4 mr-1" />Done
                                </Button>
                              )}
                              {item.status === 'ready' && (
                                <Badge className="bg-green-600 text-white"><CheckCircle2 className="h-4 w-4 mr-1" />Ready</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="destructive" onClick={() => selectedOrder && deleteOrder(selectedOrder.id)} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Trash2 className="h-4 w-4 mr-2" />Delete
            </Button>
            <Button variant="outline" onClick={() => selectedOrder && recallOrder(selectedOrder.id)}>
              <RefreshCw className="h-4 w-4 mr-2" />Recall
            </Button>
            <Button variant="outline"><Printer className="h-4 w-4 mr-2" />Print</Button>
            {selectedOrder?.status === 'ready' && (
              <Button className="bg-green-600 hover:bg-green-700" onClick={() => selectedOrder && bumpOrder(selectedOrder.id)}>
                <CheckCircle2 className="h-4 w-4 mr-2" />BUMP
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
