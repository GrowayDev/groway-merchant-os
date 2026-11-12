'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Smartphone,
  Plus,
  Minus,
  Trash2,
  Send,
  Clock,
  CheckCircle2,
  ChefHat,
  Coffee,
  Wine,
  Utensils,
  Salad,
  Pizza,
  Cake,
  Soup,
  Users,
  MapPin,
  RefreshCw,
  Printer,
  X,
  Check,
  Loader2,
  LogOut,
  CreditCard,
  Banknote,
  QrCode,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  Grid,
  ShoppingCart,
  Wifi,
  WifiOff,
  Battery,
  Beer,
  GlassWater,
  Flame,
  Edit2,
  XCircle,
  DollarSign,
} from 'lucide-react'

// ============================================
// STATION CONFIGURATION
// ============================================

const STATIONS = {
  // Kitchen Stations
  'kitchen-grill': { name: 'Grill', type: 'kitchen', icon: Flame, color: '#EF4444', description: 'Grilled items & mains' },
  'kitchen-fryer': { name: 'Fryer', type: 'kitchen', icon: Flame, color: '#F97316', description: 'Fried items' },
  'kitchen-cold': { name: 'Cold Station', type: 'kitchen', icon: Salad, color: '#22C55E', description: 'Salads & cold prep' },
  'kitchen-dessert': { name: 'Dessert', type: 'kitchen', icon: Cake, color: '#EC4899', description: 'Desserts & sweets' },
  // Bar Stations
  'bar-hot': { name: 'Bar - Hot Drinks', type: 'bar', icon: Coffee, color: '#8B5CF6', description: 'Coffee, tea & hot beverages' },
  'bar-cold': { name: 'Bar - Cold Drinks', type: 'bar', icon: GlassWater, color: '#06B6D4', description: 'Cold drinks & alcohol' },
}

// ============================================
// TYPES & INTERFACES
// ============================================

interface Staff {
  id: string
  name: string
  role: string
  color: string
  canVoid: boolean
  canDiscount: boolean
  canRefund: boolean
  canCloseShift: boolean
  canManageStaff: boolean
  canViewReports: boolean
}

interface Shift {
  id: string
  staffId: string
  date: string
  clockIn: string
  clockOut?: string
  status: string
  totalOrders: number
  totalSales: number
  totalTips: number
}

interface MenuItem {
  id: string
  name: string
  price: number
  category: string
  subcategory?: string
  icon: any
  preparationTime: number
  available: boolean
  popular: boolean
  dietary: ('vegetarian' | 'vegan' | 'gluten-free' | 'halaal' | 'kosher')[]
  station: keyof typeof STATIONS
  isAlcoholic?: boolean
  isBeverage?: boolean
}

interface OrderItem extends MenuItem {
  quantity: number
  notes?: string
  modifiers?: { name: string; price: number }[]
  sentToStation: boolean
  sentAt?: string
  orderItemId?: string
  stationName?: string
}

interface RestaurantTable {
  id: string
  number: string
  shape: string
  seats: number
  status: 'available' | 'occupied' | 'reserved' | 'cleaning'
  sectionId: string
  section?: {
    id: string
    name: string
    color: string
  }
  serverId?: string
  server?: {
    id: string
    name: string
  }
}

interface FloorSection {
  id: string
  name: string
  color: string
}

interface POSOrder {
  id: string
  orderNumber: string
  type: string
  tableId?: string
  tableNumber?: string
  staffId?: string
  staffName?: string
  status: string
  kitchenStatus?: string
  subtotal: number
  taxAmount: number
  discountAmount: number
  tipAmount: number
  total: number
  paymentStatus: string
  paidAmount: number
  notes?: string
  items: POSOrderItem[]
  createdAt: string
}

interface POSOrderItem {
  id: string
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
  notes?: string
  status: string
  sentToStation: boolean
  station?: string
}

interface VoidReason {
  id: string
  reason: string
  category: string
  requireManager: boolean
}

interface PaymentMethod {
  id: string
  name: string
  type: string
  icon: string
}

interface TipOption {
  id: string
  percentage: number
  label: string
}

interface StationOrder {
  station: keyof typeof STATIONS
  items: OrderItem[]
  status: 'pending' | 'preparing' | 'ready'
}

// ============================================
// MENU DATA WITH PROPER STATION ROUTING
// ============================================

const menuCategories = [
  { id: 'starters', name: 'Starters', icon: Salad },
  { id: 'mains', name: 'Main Courses', icon: Utensils },
  { id: 'burgers', name: 'Burgers & Sandwiches', icon: Pizza },
  { id: 'hot-drinks', name: 'Hot Beverages', icon: Coffee },
  { id: 'cold-drinks', name: 'Cold Drinks', icon: GlassWater },
  { id: 'alcohol', name: 'Alcohol', icon: Wine },
  { id: 'desserts', name: 'Desserts', icon: Cake },
  { id: 'sides', name: 'Sides', icon: Soup },
]

const sampleMenuItems: MenuItem[] = [
  // Starters - Fried items go to fryer
  { id: 'item-1', name: 'Crispy Calamari', price: 89, category: 'starters', icon: Salad, preparationTime: 12, available: true, popular: true, dietary: [], station: 'kitchen-fryer' },
  { id: 'item-2', name: 'Loaded Nachos', price: 79, category: 'starters', icon: Salad, preparationTime: 10, available: true, popular: false, dietary: ['vegetarian'], station: 'kitchen-grill' },
  { id: 'item-3', name: 'Chicken Wings', price: 99, category: 'starters', icon: Salad, preparationTime: 15, available: true, popular: true, dietary: ['halaal'], station: 'kitchen-fryer' },
  { id: 'item-4', name: 'Garlic Bread', price: 49, category: 'starters', icon: Salad, preparationTime: 8, available: true, popular: false, dietary: ['vegetarian'], station: 'kitchen-grill' },
  { id: 'item-24', name: 'Bruschetta', price: 69, category: 'starters', icon: Salad, preparationTime: 8, available: true, popular: false, dietary: ['vegetarian'], station: 'kitchen-cold' },

  // Mains - Grill station
  { id: 'item-5', name: 'Grilled Sirloin Steak', price: 269, category: 'mains', icon: Utensils, preparationTime: 25, available: true, popular: true, dietary: ['halaal'], station: 'kitchen-grill' },
  { id: 'item-6', name: 'Grilled Salmon', price: 229, category: 'mains', icon: Utensils, preparationTime: 20, available: true, popular: true, dietary: ['gluten-free'], station: 'kitchen-grill' },
  { id: 'item-7', name: 'Chicken Parmesan', price: 189, category: 'mains', icon: Utensils, preparationTime: 22, available: true, popular: false, dietary: ['halaal'], station: 'kitchen-grill' },
  { id: 'item-8', name: 'Vegetable Stir Fry', price: 149, category: 'mains', icon: Utensils, preparationTime: 15, available: true, popular: false, dietary: ['vegetarian', 'vegan', 'gluten-free'], station: 'kitchen-grill' },
  { id: 'item-9', name: 'Lamb Chops', price: 289, category: 'mains', icon: Utensils, preparationTime: 25, available: true, popular: true, dietary: ['halaal'], station: 'kitchen-grill' },

  // Burgers - Grill station
  { id: 'item-10', name: 'Classic Beef Burger', price: 139, category: 'burgers', icon: Pizza, preparationTime: 15, available: true, popular: true, dietary: [], station: 'kitchen-grill' },
  { id: 'item-11', name: 'Chicken Burger', price: 129, category: 'burgers', icon: Pizza, preparationTime: 15, available: true, popular: false, dietary: ['halaal'], station: 'kitchen-grill' },
  { id: 'item-12', name: 'Veggie Burger', price: 119, category: 'burgers', icon: Pizza, preparationTime: 12, available: true, popular: false, dietary: ['vegetarian', 'vegan'], station: 'kitchen-grill' },

  // Hot Beverages - Bar Hot Station
  { id: 'item-17', name: 'Cappuccino', price: 35, category: 'hot-drinks', icon: Coffee, preparationTime: 5, available: true, popular: true, dietary: ['vegetarian'], station: 'bar-hot', isBeverage: true },
  { id: 'item-25', name: 'Espresso', price: 28, category: 'hot-drinks', icon: Coffee, preparationTime: 3, available: true, popular: true, dietary: ['vegan'], station: 'bar-hot', isBeverage: true },
  { id: 'item-26', name: 'Latte', price: 38, category: 'hot-drinks', icon: Coffee, preparationTime: 5, available: true, popular: true, dietary: ['vegetarian'], station: 'bar-hot', isBeverage: true },
  { id: 'item-27', name: 'Americano', price: 30, category: 'hot-drinks', icon: Coffee, preparationTime: 3, available: true, popular: false, dietary: ['vegan'], station: 'bar-hot', isBeverage: true },
  { id: 'item-28', name: 'Hot Chocolate', price: 35, category: 'hot-drinks', icon: Coffee, preparationTime: 5, available: true, popular: false, dietary: ['vegetarian'], station: 'bar-hot', isBeverage: true },
  { id: 'item-29', name: 'Chai Latte', price: 40, category: 'hot-drinks', icon: Coffee, preparationTime: 5, available: true, popular: false, dietary: ['vegetarian'], station: 'bar-hot', isBeverage: true },
  { id: 'item-30', name: 'Tea ( assorted)', price: 25, category: 'hot-drinks', icon: Coffee, preparationTime: 3, available: true, popular: false, dietary: ['vegan'], station: 'bar-hot', isBeverage: true },

  // Cold Drinks - Bar Cold Station
  { id: 'item-13', name: 'Coca-Cola', price: 29, category: 'cold-drinks', icon: GlassWater, preparationTime: 1, available: true, popular: true, dietary: ['vegan'], station: 'bar-cold', isBeverage: true },
  { id: 'item-14', name: 'Fresh Orange Juice', price: 39, category: 'cold-drinks', icon: GlassWater, preparationTime: 3, available: true, popular: false, dietary: ['vegan'], station: 'bar-cold', isBeverage: true },
  { id: 'item-31', name: 'Sparkling Water', price: 25, category: 'cold-drinks', icon: GlassWater, preparationTime: 1, available: true, popular: false, dietary: ['vegan'], station: 'bar-cold', isBeverage: true },
  { id: 'item-32', name: 'Lemonade', price: 32, category: 'cold-drinks', icon: GlassWater, preparationTime: 2, available: true, popular: false, dietary: ['vegan'], station: 'bar-cold', isBeverage: true },
  { id: 'item-33', name: 'Iced Tea', price: 30, category: 'cold-drinks', icon: GlassWater, preparationTime: 2, available: true, popular: false, dietary: ['vegan'], station: 'bar-cold', isBeverage: true },
  { id: 'item-34', name: 'Milkshake', price: 45, category: 'cold-drinks', icon: GlassWater, preparationTime: 5, available: true, popular: true, dietary: ['vegetarian'], station: 'bar-cold', isBeverage: true },

  // Alcohol - Bar Cold Station
  { id: 'item-15', name: 'Craft Beer', price: 49, category: 'alcohol', icon: Beer, preparationTime: 2, available: true, popular: true, dietary: ['vegan'], station: 'bar-cold', isBeverage: true, isAlcoholic: true },
  { id: 'item-16', name: 'House Wine (Glass)', price: 59, category: 'alcohol', icon: Wine, preparationTime: 2, available: true, popular: false, dietary: ['vegan'], station: 'bar-cold', isBeverage: true, isAlcoholic: true },
  { id: 'item-35', name: 'Premium Beer', price: 65, category: 'alcohol', icon: Beer, preparationTime: 2, available: true, popular: true, dietary: ['vegan'], station: 'bar-cold', isBeverage: true, isAlcoholic: true },
  { id: 'item-36', name: 'Champagne (Glass)', price: 85, category: 'alcohol', icon: Wine, preparationTime: 2, available: true, popular: false, dietary: ['vegan'], station: 'bar-cold', isBeverage: true, isAlcoholic: true },
  { id: 'item-37', name: 'Whisky', price: 75, category: 'alcohol', icon: Wine, preparationTime: 2, available: true, popular: true, dietary: ['vegan'], station: 'bar-cold', isBeverage: true, isAlcoholic: true },
  { id: 'item-38', name: 'Cocktail (House)', price: 69, category: 'alcohol', icon: Wine, preparationTime: 5, available: true, popular: true, dietary: ['vegan'], station: 'bar-cold', isBeverage: true, isAlcoholic: true },

  // Desserts - Dessert Station
  { id: 'item-18', name: 'Chocolate Brownie', price: 59, category: 'desserts', icon: Cake, preparationTime: 10, available: true, popular: true, dietary: ['vegetarian'], station: 'kitchen-dessert' },
  { id: 'item-19', name: 'Ice Cream Sundae', price: 49, category: 'desserts', icon: Cake, preparationTime: 5, available: true, popular: false, dietary: ['vegetarian'], station: 'kitchen-dessert' },
  { id: 'item-20', name: 'Cheesecake', price: 69, category: 'desserts', icon: Cake, preparationTime: 5, available: true, popular: true, dietary: ['vegetarian'], station: 'kitchen-dessert' },

  // Sides - Various stations
  { id: 'item-21', name: 'French Fries', price: 39, category: 'sides', icon: Soup, preparationTime: 10, available: true, popular: true, dietary: ['vegetarian', 'vegan'], station: 'kitchen-fryer' },
  { id: 'item-22', name: 'Mashed Potato', price: 35, category: 'sides', icon: Soup, preparationTime: 10, available: true, popular: false, dietary: ['vegetarian'], station: 'kitchen-grill' },
  { id: 'item-23', name: 'Side Salad', price: 35, category: 'sides', icon: Salad, preparationTime: 5, available: true, popular: false, dietary: ['vegetarian', 'vegan', 'gluten-free'], station: 'kitchen-cold' },
]

// ============================================
// MAIN COMPONENT
// ============================================

export function WaiterPadView() {
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentStaff, setCurrentStaff] = useState<Staff | null>(null)
  const [currentShift, setCurrentShift] = useState<Shift | null>(null)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')
  const [showPin, setShowPin] = useState(false)

  // UI state
  const [activeTab, setActiveTab] = useState('order')
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null)
  const [selectedSection, setSelectedSection] = useState('all')
  const [activeCategory, setActiveCategory] = useState('starters')
  const [searchQuery, setSearchQuery] = useState('')
  const [orderNote, setOrderNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [sendingToKitchen, setSendingToKitchen] = useState(false)

  // Cart state
  const [cart, setCart] = useState<OrderItem[]>([])
  const [currentOrder, setCurrentOrder] = useState<POSOrder | null>(null)

  // Data from API
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [sections, setSections] = useState<FloorSection[]>([])
  const [voidReasons, setVoidReasons] = useState<VoidReason[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [tipOptions, setTipOptions] = useState<TipOption[]>([])
  
  // Active Orders state
  const [activeOrders, setActiveOrders] = useState<POSOrder[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)

  // Dialogs
  const [itemNoteDialog, setItemNoteDialog] = useState<string | null>(null)
  const [itemNote, setItemNote] = useState('')
  const [confirmSendDialog, setConfirmSendDialog] = useState(false)
  const [orderSentDialog, setOrderSentDialog] = useState(false)
  const [addTableDialog, setAddTableDialog] = useState(false)
  const [editTableDialog, setEditTableDialog] = useState(false)
  const [deleteTableDialog, setDeleteTableDialog] = useState(false)
  const [tableToEdit, setTableToEdit] = useState<RestaurantTable | null>(null)
  const [tableToDelete, setTableToDelete] = useState<RestaurantTable | null>(null)
  const [paymentDialog, setPaymentDialog] = useState(false)
  const [voidItemDialog, setVoidItemDialog] = useState(false)
  const [voidOrderDialog, setVoidOrderDialog] = useState(false)
  const [clearCartDialog, setClearCartDialog] = useState(false)
  const [itemToVoid, setItemToVoid] = useState<OrderItem | null>(null)
  const [managerOverrideDialog, setManagerOverrideDialog] = useState(false)
  const [printDialog, setPrintDialog] = useState(false)

  // New table form
  const [newTableNumber, setNewTableNumber] = useState('')
  const [newTableSeats, setNewTableSeats] = useState(4)
  const [newTableSection, setNewTableSection] = useState('')
  const [newTableStatus, setNewTableStatus] = useState<'available' | 'occupied' | 'reserved' | 'cleaning'>('available')
  const [savingTable, setSavingTable] = useState(false)
  const [deletingTable, setDeletingTable] = useState(false)

  // Payment state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('')
  const [cashTendered, setCashTendered] = useState('')
  const [selectedTipOption, setSelectedTipOption] = useState<string>('')
  const [customTipAmount, setCustomTipAmount] = useState('')
  const [processingPayment, setProcessingPayment] = useState(false)

  // Void state
  const [selectedVoidReason, setSelectedVoidReason] = useState('')
  const [voidCustomReason, setVoidCustomReason] = useState('')
  const [managerPin, setManagerPin] = useState('')
  const [processingVoid, setProcessingVoid] = useState(false)

  // Print state
  const [printing, setPrinting] = useState(false)

  // Device status
  const [isOnline, setIsOnline] = useState(true)
  const [batteryLevel, setBatteryLevel] = useState(85)

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  // Group cart items by station
  const getStationOrders = useCallback((): StationOrder[] => {
    const stationMap = new Map<keyof typeof STATIONS, OrderItem[]>()
    
    cart.forEach(item => {
      if (!stationMap.has(item.station)) {
        stationMap.set(item.station, [])
      }
      stationMap.get(item.station)!.push(item)
    })

    return Array.from(stationMap.entries()).map(([station, items]) => ({
      station,
      items,
      status: items.every(i => i.sentToStation) ? 'preparing' : 'pending'
    }))
  }, [cart])

  // Get unsent items by station
  const getUnsentByStation = useCallback(() => {
    const unsentItems = cart.filter(item => !item.sentToStation)
    const stationMap = new Map<keyof typeof STATIONS, OrderItem[]>()
    
    unsentItems.forEach(item => {
      if (!stationMap.has(item.station)) {
        stationMap.set(item.station, [])
      }
      stationMap.get(item.station)!.push(item)
    })

    return stationMap
  }, [cart])

  // ============================================
  // AUTH FUNCTIONS
  // ============================================

  const handleLogin = async () => {
    if (pinInput.length < 4) {
      setPinError('PIN must be at least 4 digits')
      return
    }

    setLoading(true)
    setPinError('')

    try {
      const pinResponse = await fetch('/merchant-os/api/pos/staff/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput }),
      })

      const pinData = await pinResponse.json()

      if (pinResponse.ok && pinData.valid && pinData.staff) {
        setCurrentStaff(pinData.staff)
        setIsLoggedIn(true)
        setPinInput('')
        setPinError('')
        await startShift(pinData.staff.id)
        toast.success(`Welcome, ${pinData.staff.name}!`)
      } else {
        setPinError(pinData.error || 'Invalid PIN')
      }
    } catch (error) {
      console.error('Login error:', error)
      setPinError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const startShift = async (staffId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const response = await fetch('/merchant-os/api/pos/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId,
          date: today,
          clockIn: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentShift(data.data)
      }
    } catch (error) {
      console.error('Error starting shift:', error)
    }
  }

  const handleLogout = async () => {
    if (currentShift) {
      try {
        await fetch(`/merchant-os/api/pos/shifts/${currentShift.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clockOut: new Date().toISOString(),
            status: 'completed',
          }),
        })
      } catch (error) {
        console.error('Error ending shift:', error)
      }
    }

    setCurrentStaff(null)
    setCurrentShift(null)
    setIsLoggedIn(false)
    setCart([])
    setCurrentOrder(null)
    setSelectedTable(null)
    toast.success('Logged out successfully')
  }

  // ============================================
  // DATA FETCHING
  // ============================================

  const fetchData = useCallback(async () => {
    try {
      const [tablesRes, sectionsRes, voidReasonsRes, paymentMethodsRes, tipOptionsRes] = await Promise.all([
        fetch('/merchant-os/api/floorplan/tables'),
        fetch('/merchant-os/api/floorplan/sections'),
        fetch('/merchant-os/api/pos/void-reasons'),
        fetch('/merchant-os/api/pos/payments/methods').catch(() => null),
        fetch('/merchant-os/api/pos/payments/tips').catch(() => null),
      ])

      if (tablesRes.ok) {
        const tablesData = await tablesRes.json()
        setTables(tablesData)
      }

      if (sectionsRes.ok) {
        const sectionsData = await sectionsRes.json()
        setSections(sectionsData)
        if (sectionsData.length > 0 && !newTableSection) {
          setNewTableSection(sectionsData[0].id)
        }
      }

      if (voidReasonsRes.ok) {
        const voidData = await voidReasonsRes.json()
        setVoidReasons(voidData.data || voidData || [])
      }

      if (paymentMethodsRes?.ok) {
        const pmData = await paymentMethodsRes.json()
        setPaymentMethods(pmData.data || pmData || [])
      } else {
        setPaymentMethods([
          { id: 'cash', name: 'Cash', type: 'cash', icon: 'banknote' },
          { id: 'card', name: 'Card', type: 'card', icon: 'credit-card' },
          { id: 'mobile', name: 'Mobile Pay', type: 'mobile', icon: 'smartphone' },
        ])
      }

      if (tipOptionsRes?.ok) {
        const tipData = await tipOptionsRes.json()
        setTipOptions(tipData.data || tipData || [])
      } else {
        setTipOptions([
          { id: '1', percentage: 10, label: 'Good' },
          { id: '2', percentage: 15, label: 'Great' },
          { id: '3', percentage: 18, label: 'Excellent' },
          { id: '4', percentage: 20, label: 'Outstanding' },
        ])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }, [newTableSection])

  // Fetch active orders
  const fetchActiveOrders = useCallback(async () => {
    if (!currentStaff) return
    
    setLoadingOrders(true)
    try {
      const response = await fetch(`/merchant-os/api/pos/orders?staffId=${currentStaff.id}&status=open,pending,preparing,ready`)
      
      if (response.ok) {
        const data = await response.json()
        setActiveOrders(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching active orders:', error)
    } finally {
      setLoadingOrders(false)
    }
  }, [currentStaff])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  useEffect(() => {
    if (isLoggedIn && currentStaff) {
      fetchActiveOrders()
      const interval = setInterval(fetchActiveOrders, 10000)
      return () => clearInterval(interval)
    }
  }, [isLoggedIn, currentStaff, fetchActiveOrders])

  // ============================================
  // CART FUNCTIONS
  // ============================================

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id && !i.sentToStation)
      if (existing) {
        return prev.map(i =>
          i.id === item.id && !i.sentToStation
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [...prev, { 
        ...item, 
        quantity: 1, 
        sentToStation: false,
        stationName: STATIONS[item.station]?.name || item.station 
      }]
    })
    toast.success(`Added ${item.name}`, {
      description: `→ ${STATIONS[item.station]?.name || item.station}`
    })
  }

  const removeFromCart = (itemId: string, all: boolean = false) => {
    if (all) {
      setCart(prev => prev.filter(i => i.id !== itemId || i.sentToStation))
    } else {
      setCart(prev => {
        const existing = prev.find(i => i.id === itemId && !i.sentToStation)
        if (existing && existing.quantity > 1) {
          return prev.map(i =>
            i.id === itemId && !i.sentToStation
              ? { ...i, quantity: i.quantity - 1 }
              : i
          )
        }
        return prev.filter(i => i.id !== itemId || i.sentToStation)
      })
    }
  }

  const addItemNote = (itemId: string, note: string) => {
    setCart(prev =>
      prev.map(i =>
        i.id === itemId ? { ...i, notes: note } : i
      )
    )
    setItemNoteDialog(null)
    setItemNote('')
  }

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const cartTax = cartSubtotal * 0.15
  const cartTotal = cartSubtotal + cartTax
  const unsentItems = cart.filter(item => !item.sentToStation)
  const sentItems = cart.filter(item => item.sentToStation)

  // ============================================
  // ORDER FUNCTIONS
  // ============================================

  const sendToStations = async () => {
    if (unsentItems.length === 0) return

    setSendingToKitchen(true)
    setConfirmSendDialog(false)

    try {
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}`
      const unsentByStation = getUnsentByStation()

      // Determine order type based on table selection
      const orderType = selectedTable ? 'dine-in' : 'takeaway'

      // Create order with items
      const response = await fetch('/merchant-os/api/pos/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber,
          type: orderType,
          tableId: selectedTable?.id || null,
          tableNumber: selectedTable?.number || null,
          sectionId: selectedTable?.sectionId || null,
          staffId: currentStaff?.id,
          staffName: currentStaff?.name,
          items: unsentItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
            notes: item.notes,
            station: item.station,
            stationName: STATIONS[item.station]?.name,
            isBeverage: item.isBeverage,
            isAlcoholic: item.isAlcoholic,
          })),
          subtotal: cartSubtotal,
          taxAmount: cartTax,
          total: cartTotal,
          notes: orderNote,
        }),
      })

      if (response.ok) {
        const orderData = await response.json()

        // Mark items as sent
        setCart(prev =>
          prev.map(item =>
            !item.sentToStation
              ? { ...item, sentToStation: true, sentAt: new Date().toISOString() }
              : item
          )
        )

        // Update table status if table is selected
        if (selectedTable) {
          await fetch(`/merchant-os/api/floorplan/tables/${selectedTable.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'occupied' }),
          })
        }

        setCurrentOrder(orderData.data)
        setOrderSentDialog(true)
        
        // Refresh tables
        fetchData()
        
        // Show which stations received orders
        const stationNames = Array.from(unsentByStation.keys()).map(s => STATIONS[s]?.name).join(', ')
        toast.success(`Order ${orderNumber} sent to: ${stationNames}`, {
          description: orderType === 'dine-in' 
            ? `Table ${selectedTable?.number}` 
            : 'Takeaway order'
        })
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Order creation failed:', errorData)
        throw new Error(errorData.error || 'Failed to create order')
      }
    } catch (error) {
      console.error('Error sending to stations:', error)
      toast.error('Failed to send order')
    } finally {
      setSendingToKitchen(false)
    }
  }

  // ============================================
  // PAYMENT FUNCTIONS
  // ============================================

  const openPaymentDialog = () => {
    setSelectedPaymentMethod('')
    setSelectedTipOption('')
    setCustomTipAmount('')
    setCashTendered('')
    setPaymentDialog(true)
  }

  const getTipAmount = () => {
    if (customTipAmount) return parseFloat(customTipAmount) || 0
    if (selectedTipOption) {
      const tip = tipOptions.find(t => t.id === selectedTipOption)
      if (tip) return cartTotal * (tip.percentage / 100)
    }
    return 0
  }

  const getChange = () => {
    if (selectedPaymentMethod === 'cash' && cashTendered) {
      const tendered = parseFloat(cashTendered) || 0
      return Math.max(0, tendered - (cartTotal + getTipAmount()))
    }
    return 0
  }

  const processPayment = async () => {
    if (!selectedPaymentMethod) {
      toast.error('Please select a payment method')
      return
    }

    if (selectedPaymentMethod === 'cash' && parseFloat(cashTendered) < cartTotal + getTipAmount()) {
      toast.error('Cash tendered is less than total')
      return
    }

    setProcessingPayment(true)

    try {
      // Create order first if not exists
      let orderId = currentOrder?.id
      
      if (!orderId && cart.length > 0) {
        const orderNumber = `ORD-${Date.now().toString().slice(-6)}`
        const orderResponse = await fetch('/merchant-os/api/pos/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderNumber,
            type: selectedTable ? 'dine-in' : 'takeaway',
            tableId: selectedTable?.id,
            tableNumber: selectedTable?.number,
            staffId: currentStaff?.id,
            staffName: currentStaff?.name,
            items: cart.map(item => ({
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.price,
              totalPrice: item.price * item.quantity,
              notes: item.notes,
              station: item.station,
            })),
            subtotal: cartSubtotal,
            taxAmount: cartTax,
            total: cartTotal,
          }),
        })
        
        if (orderResponse.ok) {
          const orderData = await orderResponse.json()
          orderId = orderData.data.id
        }
      }

      const response = await fetch('/merchant-os/api/pos/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          amount: cartTotal,
          method: selectedPaymentMethod,
          tipAmount: getTipAmount(),
          cashTendered: selectedPaymentMethod === 'cash' ? parseFloat(cashTendered) : null,
          changeGiven: selectedPaymentMethod === 'cash' ? getChange() : null,
          processedBy: currentStaff?.id,
          pin: '0000', // Skip PIN for now (already authenticated)
        }),
      })

      if (response.ok) {
        if (orderId) {
          await fetch(`/merchant-os/api/pos/orders/${orderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paymentStatus: 'paid',
              paidAmount: cartTotal + getTipAmount(),
              tipAmount: getTipAmount(),
              status: 'closed',
              closedAt: new Date().toISOString(),
            }),
          })
        }

        if (selectedTable) {
          await fetch(`/merchant-os/api/floorplan/tables/${selectedTable.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'cleaning' }),
          })
        }

        setPaymentDialog(false)
        setCart([])
        setCurrentOrder(null)
        setSelectedTable(null)
        setActiveTab('tables')
        fetchData()
        toast.success('Payment processed successfully!')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Payment failed')
      }
    } catch (error: any) {
      console.error('Payment error:', error)
      toast.error(error.message || 'Failed to process payment')
    } finally {
      setProcessingPayment(false)
    }
  }

  // ============================================
  // PRINT FUNCTION
  // ============================================

  const handlePrint = async (printType: 'all' | 'kitchen' | 'bar' | 'receipt') => {
    setPrinting(true)
    
    try {
      const response = await fetch('/merchant-os/api/pos/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: currentOrder?.id,
          orderNumber: currentOrder?.orderNumber || `ORD-${Date.now().toString().slice(-6)}`,
          tableNumber: selectedTable?.number,
          staffName: currentStaff?.name,
          items: cart,
          subtotal: cartSubtotal,
          taxAmount: cartTax,
          total: cartTotal,
          notes: orderNote,
          printType,
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        toast.success(data.message || 'Printed successfully!')
        setPrintDialog(false)
      } else {
        throw new Error('Print failed')
      }
    } catch (error) {
      console.error('Print error:', error)
      toast.error('Failed to print. Please check printer connection.')
    } finally {
      setPrinting(false)
    }
  }

  // ============================================
  // VOID FUNCTIONS
  // ============================================

  const handleVoidOrder = async () => {
    if (!selectedVoidReason && !voidCustomReason) {
      toast.error('Please select or enter a void reason')
      return
    }

    if (!currentStaff) {
      toast.error('Staff not identified')
      return
    }

    setProcessingVoid(true)

    try {
      if (currentOrder?.id) {
        // Void existing order via API
        const response = await fetch(`/merchant-os/api/pos/orders/${currentOrder.id}/void`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            voidType: 'order',
            reasonId: selectedVoidReason,
            customReason: voidCustomReason,
            voidedBy: currentStaff.id,
            pin: '0000', // Already authenticated
          }),
        })

        if (response.ok) {
          toast.success('Order voided successfully')
        } else {
          const errorData = await response.json()
          if (errorData.requiresManager) {
            setManagerOverrideDialog(true)
            return
          }
          throw new Error(errorData.error || 'Void failed')
        }
      }

      // Clear local state
      setCart([])
      setCurrentOrder(null)
      setVoidOrderDialog(false)
      setSelectedVoidReason('')
      setVoidCustomReason('')
      
      if (selectedTable) {
        await fetch(`/merchant-os/api/floorplan/tables/${selectedTable.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'available' }),
        })
        fetchData()
      }
      
      setSelectedTable(null)
      setActiveTab('tables')
    } catch (error: any) {
      console.error('Void error:', error)
      toast.error(error.message || 'Failed to void order')
    } finally {
      setProcessingVoid(false)
    }
  }

  // ============================================
  // TABLE MANAGEMENT
  // ============================================

  const filteredTables = tables.filter(table =>
    selectedSection === 'all' || table.sectionId === selectedSection
  )

  const getTableStatusColor = (table: RestaurantTable) => {
    switch (table.status) {
      case 'available': return { bg: 'bg-green-900/30', border: 'border-green-700', text: 'text-green-400' }
      case 'occupied': return { bg: 'bg-red-900/30', border: 'border-red-700', text: 'text-red-400' }
      case 'reserved': return { bg: 'bg-amber-900/30', border: 'border-amber-700', text: 'text-amber-400' }
      case 'cleaning': return { bg: 'bg-gray-900/30', border: 'border-gray-600', text: 'text-gray-400' }
      default: return { bg: 'bg-gray-900/30', border: 'border-gray-600', text: 'text-gray-400' }
    }
  }

  const addNewTable = async () => {
    if (!newTableNumber.trim()) {
      toast.error('Please enter a table number')
      return
    }
    if (!newTableSection) {
      toast.error('Please select a section')
      return
    }

    setSavingTable(true)
    try {
      const response = await fetch('/merchant-os/api/floorplan/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: newTableNumber,
          seats: newTableSeats,
          sectionId: newTableSection,
          status: 'available',
          shape: 'circle',
        }),
      })

      if (response.ok) {
        const newTable = await response.json()
        setTables(prev => [...prev, newTable])
        setAddTableDialog(false)
        setNewTableNumber('')
        setNewTableSeats(4)
        toast.success(`Table ${newTableNumber} added successfully`)
      } else {
        throw new Error('Failed to create table')
      }
    } catch (error) {
      console.error('Error adding table:', error)
      toast.error('Failed to add table')
    } finally {
      setSavingTable(false)
    }
  }

  const openEditTableDialog = (table: RestaurantTable, e: React.MouseEvent) => {
    e.stopPropagation()
    setTableToEdit(table)
    setNewTableNumber(table.number)
    setNewTableSeats(table.seats)
    setNewTableSection(table.sectionId)
    setNewTableStatus(table.status as any)
    setEditTableDialog(true)
  }

  const updateTable = async () => {
    if (!tableToEdit) return

    setSavingTable(true)
    try {
      const response = await fetch(`/merchant-os/api/floorplan/tables/${tableToEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: newTableNumber,
          seats: newTableSeats,
          sectionId: newTableSection,
          status: newTableStatus,
        }),
      })

      if (response.ok) {
        const updatedTable = await response.json()
        setTables(prev => prev.map(t => t.id === tableToEdit.id ? { ...t, ...updatedTable } : t))
        setEditTableDialog(false)
        setTableToEdit(null)
        toast.success(`Table ${newTableNumber} updated successfully`)
      }
    } catch (error) {
      console.error('Error updating table:', error)
      toast.error('Failed to update table')
    } finally {
      setSavingTable(false)
    }
  }

  const openDeleteTableDialog = (table: RestaurantTable, e: React.MouseEvent) => {
    e.stopPropagation()
    setTableToDelete(table)
    setDeleteTableDialog(true)
  }

  const deleteTable = async () => {
    if (!tableToDelete) return

    setDeletingTable(true)
    try {
      const response = await fetch(`/merchant-os/api/floorplan/tables/${tableToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setTables(prev => prev.filter(t => t.id !== tableToDelete.id))
        setDeleteTableDialog(false)
        setTableToDelete(null)
        toast.success(`Table ${tableToDelete.number} deleted`)
      }
    } catch (error) {
      console.error('Error deleting table:', error)
      toast.error('Failed to delete table')
    } finally {
      setDeletingTable(false)
    }
  }

  // Quick status change for table
  const quickChangeTableStatus = async (table: RestaurantTable, newStatus: 'available' | 'occupied' | 'reserved' | 'cleaning', e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await fetch(`/merchant-os/api/floorplan/tables/${table.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      setTables(prev => prev.map(t => t.id === table.id ? { ...t, status: newStatus } : t))
      toast.success(`Table ${table.number} marked as ${newStatus}`)
    } catch (error) {
      toast.error('Failed to update table status')
    }
  }

  // ============================================
  // MENU FILTERING
  // ============================================

  const filteredItems = sampleMenuItems.filter(item => {
    const matchesCategory = item.category === activeCategory
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && (searchQuery ? matchesSearch : true) && item.available
  })

  // Get status badge for active orders
  const getOrderStatusBadge = (order: POSOrder) => {
    const kitchenStatus = order.kitchenStatus || order.status
    
    switch (kitchenStatus) {
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>
      case 'preparing':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Preparing</Badge>
      case 'ready':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Ready</Badge>
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">{kitchenStatus}</Badge>
    }
  }

  // ============================================
  // RENDER
  // ============================================

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-4">
        <Card className="w-full max-w-sm bg-[#1A1A1A] border-gray-700">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-[#00897B] rounded-2xl flex items-center justify-center mb-4">
              <Smartphone className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-white">WaiterPad</CardTitle>
            <p className="text-gray-400 text-sm">Enter your PIN to login</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Input
                type={showPin ? 'text' : 'password'}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter PIN"
                className="bg-[#0D0D0D] border-gray-700 text-white text-center text-2xl tracking-widest h-14"
                maxLength={6}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                onClick={() => setShowPin(!showPin)}
              >
                {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>

            {pinError && (
              <Alert className="bg-red-900/20 border-red-700">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-400">{pinError}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((key, i) => (
                <Button
                  key={i}
                  className={`h-14 text-xl font-semibold ${
                    key === null ? 'invisible' :
                    key === 'del' ? 'bg-red-600 hover:bg-red-700 text-white' :
                    'bg-gray-600 hover:bg-gray-500 text-white'
                  }`}
                  onClick={() => {
                    if (key === 'del') setPinInput(prev => prev.slice(0, -1))
                    else if (typeof key === 'number') setPinInput(prev => prev + key)
                  }}
                >
                  {key === 'del' ? <X className="h-6 w-6" /> : key}
                </Button>
              ))}
            </div>

            <Button
              className="w-full h-14 bg-[#00897B] hover:bg-[#00695C] text-xl"
              onClick={handleLogin}
            >
              <Lock className="h-5 w-5 mr-2" />
              Login
            </Button>

            <p className="text-center text-gray-500 text-xs">
              Demo PINs: Manager=1234, Supervisor=5678, Waiter=1111, 2222
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main App
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#1A1A1A] border-b border-gray-700 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: currentStaff?.color || '#00897B' }}>
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-medium">{currentStaff?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{currentStaff?.role}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {selectedTable && (
              <Badge className="bg-[#00897B] text-white">
                Table {selectedTable.number}
              </Badge>
            )}

            <div className="flex items-center gap-1 text-xs text-gray-400">
              {isOnline ? <Wifi className="h-4 w-4 text-green-400" /> : <WifiOff className="h-4 w-4 text-red-400" />}
              <Battery className="h-4 w-4" />
              <span>{batteryLevel}%</span>
            </div>

            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-gray-400">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="bg-[#1A1A1A] border-b border-gray-700 justify-start rounded-none p-0 h-10 sm:h-12">
          <TabsTrigger value="tables" className="data-[state=active]:bg-[#00897B] data-[state=active]:text-white rounded-none h-10 sm:h-12 px-3 sm:px-4 text-sm">
            <Grid className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Tables</span>
          </TabsTrigger>
          <TabsTrigger value="order" className="data-[state=active]:bg-[#00897B] data-[state=active]:text-white rounded-none h-10 sm:h-12 px-3 sm:px-4 text-sm">
            <ShoppingCart className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Order</span> {cart.length > 0 && `(${cart.length})`}
          </TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:bg-[#00897B] data-[state=active]:text-white rounded-none h-10 sm:h-12 px-3 sm:px-4 text-sm">
            <Clock className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Active</span>
            {activeOrders.length > 0 && (
              <Badge className="ml-1 bg-amber-500 text-xs">{activeOrders.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          {/* TABLES TAB */}
          <TabsContent value="tables" className="m-0 h-full overflow-auto p-3">
            <div className="flex gap-2 mb-4 flex-wrap">
              <Button
                variant={selectedSection === 'all' ? 'default' : 'outline'}
                size="sm"
                className={selectedSection === 'all' ? 'bg-[#00897B]' : 'border-gray-600 text-gray-400'}
                onClick={() => setSelectedSection('all')}
              >
                All
              </Button>
              {sections.map(section => (
                <Button
                  key={section.id}
                  variant={selectedSection === section.id ? 'default' : 'outline'}
                  size="sm"
                  style={selectedSection === section.id ? { backgroundColor: section.color } : {}}
                  className={selectedSection === section.id ? 'text-white' : 'border-gray-600 text-gray-400'}
                  onClick={() => setSelectedSection(section.id)}
                >
                  {section.name}
                </Button>
              ))}
            </div>

            <div className="mb-4">
              <Button
                variant="outline"
                className="border-dashed border-gray-600 text-gray-400 w-full"
                onClick={() => setAddTableDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Table
              </Button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
              {filteredTables.map(table => {
                const colorStyle = getTableStatusColor(table)

                return (
                  <Card
                    key={table.id}
                    className={`cursor-pointer transition-all ${colorStyle.bg} ${colorStyle.border} border-2 group relative ${selectedTable?.id === table.id ? 'ring-2 ring-[#00897B]' : ''}`}
                    onClick={() => {
                      setSelectedTable(table)
                      setActiveTab('order')
                    }}
                  >
                    <CardContent className="p-2 sm:p-3 text-center">
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 bg-gray-800/80 hover:bg-gray-700 text-gray-300"
                          onClick={(e) => openEditTableDialog(table, e)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 bg-red-900/80 hover:bg-red-800 text-red-300"
                          onClick={(e) => openDeleteTableDialog(table, e)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>

                      <p className={`text-2xl font-bold ${colorStyle.text}`}>{table.number}</p>

                      {table.section && (
                        <Badge
                          className="mt-1 text-[10px]"
                          style={{ backgroundColor: table.section.color, color: 'white' }}
                        >
                          {table.section.name}
                        </Badge>
                      )}

                      <div className="flex items-center justify-center gap-1 mt-1 text-gray-500">
                        <Users className="h-3 w-3" />
                        <span className="text-xs">{table.seats}</span>
                      </div>

                      <Badge
                        className={`mt-2 ${
                          table.status === 'available' ? 'bg-green-100 text-green-700' :
                          table.status === 'occupied' ? 'bg-red-100 text-red-700' :
                          table.status === 'reserved' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {table.status}
                      </Badge>

                      {/* Quick status change buttons on hover */}
                      <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity grid grid-cols-2 gap-1">
                        {table.status !== 'available' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-[10px] bg-green-600/50 hover:bg-green-600 text-white"
                            onClick={(e) => quickChangeTableStatus(table, 'available', e)}
                          >
                            Free
                          </Button>
                        )}
                        {table.status === 'available' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-[10px] bg-red-600/50 hover:bg-red-600 text-white"
                            onClick={(e) => quickChangeTableStatus(table, 'occupied', e)}
                          >
                            Seat
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-[10px] bg-amber-600/50 hover:bg-amber-600 text-white"
                          onClick={(e) => quickChangeTableStatus(table, 'reserved', e)}
                        >
                          Reserve
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {filteredTables.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No tables found</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setAddTableDialog(true)}
                >
                  Add Your First Table
                </Button>
              </div>
            )}
          </TabsContent>

          {/* ORDER TAB */}
          <TabsContent value="order" className="m-0 h-full overflow-hidden flex flex-col">
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
              {/* Menu Section */}
              <div className="flex-1 flex flex-col lg:border-r border-gray-700 lg:h-full h-1/2 overflow-hidden">
                {/* Category Tabs - Scrollable */}
                <div className="flex gap-1 p-1 sm:p-2 bg-[#1A1A1A] overflow-x-auto scrollbar-hide">
                  {menuCategories.map(cat => (
                    <Button
                      key={cat.id}
                      size="sm"
                      className={`flex-shrink-0 ${activeCategory === cat.id 
                        ? 'bg-[#00897B] text-white hover:bg-[#00695C]' 
                        : 'bg-gray-700 text-white border-gray-600 hover:bg-gray-600'
                      }`}
                      onClick={() => setActiveCategory(cat.id)}
                    >
                      <cat.icon className="h-4 w-4 sm:mr-1" />
                      <span className="hidden sm:inline text-xs">{cat.name}</span>
                    </Button>
                  ))}
                </div>

                {/* Search */}
                <div className="p-2 border-b border-gray-700">
                  <div className="relative">
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search menu..."
                      className="bg-[#1A1A1A] border-gray-700 pl-9"
                    />
                  </div>
                </div>

                {/* Menu Items */}
                <ScrollArea className="flex-1">
                  <div className="p-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2">
                    {filteredItems.map(item => {
                      const station = STATIONS[item.station]
                      const StationIcon = station?.icon || Utensils
                      
                      return (
                        <Card
                          key={item.id}
                          className={`bg-[#1A1A1A] border-gray-700 cursor-pointer hover:border-[#00897B] transition-all ${!item.available ? 'opacity-50' : ''}`}
                          onClick={() => item.available && addToCart(item)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-sm text-white">{item.name}</p>
                                <p className="text-[#00897B] font-bold text-lg">R{item.price}</p>
                              </div>
                              {item.popular && (
                                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px]">
                                  Popular
                                </Badge>
                              )}
                            </div>
                            
                            {/* Station Badge */}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge 
                                className="text-[10px] px-2"
                                style={{ backgroundColor: station?.color + '30', color: station?.color, borderColor: station?.color }}
                              >
                                <StationIcon className="h-3 w-3 mr-1" />
                                {station?.name}
                              </Badge>
                              {item.isAlcoholic && (
                                <Badge className="bg-purple-500/20 text-purple-400 text-[10px]">
                                  18+
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 mt-2 text-gray-400">
                              <Clock className="h-3 w-3" />
                              <span className="text-xs">{item.preparationTime}min</span>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </ScrollArea>
              </div>

              {/* Cart Section - Responsive */}
              <div className="lg:w-80 w-full flex flex-col bg-[#1A1A1A] lg:h-full h-1/2 overflow-hidden">
                <div className="p-3 border-b border-gray-700 flex-shrink-0">
                  <h3 className="font-medium flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Current Order
                    {cart.length > 0 && (
                      <Badge className="bg-[#00897B] ml-2">{cart.length} items</Badge>
                    )}
                  </h3>
                </div>

                <ScrollArea className="flex-1 p-2 min-h-0">
                  {/* Station Grouped Items */}
                  {Array.from(getUnsentByStation().entries()).map(([station, items]) => {
                    const stationInfo = STATIONS[station]
                    const StationIcon = stationInfo?.icon || Utensils
                    
                    return (
                      <div key={station} className="mb-4">
                        <div className="flex items-center gap-2 mb-2 px-1">
                          <Badge 
                            className="text-xs"
                            style={{ backgroundColor: stationInfo?.color + '30', color: stationInfo?.color }}
                          >
                            <StationIcon className="h-3 w-3 mr-1" />
                            {stationInfo?.name}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {items.reduce((sum, i) => sum + i.quantity, 0)} items
                          </span>
                        </div>
                        
                        {items.map(item => (
                          <div key={item.id} className="bg-[#0D0D0D] rounded-lg p-2 mb-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">{item.name}</p>
                              <span className="text-sm">R{item.price * item.quantity}</span>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFromCart(item.id)}>
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="text-sm w-6 text-center">{item.quantity}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => addToCart(item)}>
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-red-400"
                                onClick={() => { setItemToVoid(item); setVoidItemDialog(true) }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })}

                  {/* Sent Items */}
                  {sentItems.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 font-medium mb-2">SENT TO STATIONS ✓</p>
                      {sentItems.map((item, idx) => (
                        <div key={`sent-${item.id}-${idx}`} className="bg-[#0D0D0D] rounded-lg p-2 opacity-70 mb-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium flex items-center gap-2">
                              {item.name}
                              <CheckCircle2 className="h-3 w-3 text-green-400" />
                            </p>
                            <span className="text-sm">R{item.price * item.quantity}</span>
                          </div>
                          <Badge 
                            className="text-[10px] mt-1"
                            style={{ backgroundColor: STATIONS[item.station]?.color + '30', color: STATIONS[item.station]?.color }}
                          >
                            {STATIONS[item.station]?.name}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  {cart.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Cart is empty</p>
                      <p className="text-xs mt-1">Select items from the menu</p>
                    </div>
                  )}
                </ScrollArea>

                {/* Order Note */}
                <div className="p-2 border-t border-gray-700 flex-shrink-0">
                  <Textarea
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    placeholder="Add order note..."
                    className="bg-[#0D0D0D] border-gray-700 text-sm"
                    rows={1}
                  />
                </div>

                {/* Summary & Actions - Sticky on mobile */}
                <div className="p-2 sm:p-3 border-t border-gray-700 space-y-2 flex-shrink-0 bg-[#1A1A1A]">
                  {/* Order Summary - Compact */}
                  <div className="bg-[#0D0D0D] rounded-lg p-2 sm:p-3">
                    <div className="flex justify-between items-center">
                      <div className="text-xs sm:text-sm text-gray-400">
                        <span>Sub: R{cartSubtotal.toFixed(0)}</span>
                        <span className="mx-1">|</span>
                        <span>VAT: R{cartTax.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg sm:text-xl">
                        <span className="text-[#00897B]">R{cartTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons - Responsive */}
                  <div className="space-y-2">
                    {/* Primary Actions - Side by side on larger screens */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Send to Stations - Primary Action */}
                      <Button
                        className="h-12 sm:h-14 text-sm sm:text-lg font-bold bg-[#00897B] hover:bg-[#00695C]"
                        disabled={unsentItems.length === 0}
                        onClick={() => setConfirmSendDialog(true)}
                      >
                        {sendingToKitchen ? (
                          <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                        )}
                        <span className="hidden sm:inline">SEND TO STATIONS</span>
                        <span className="sm:hidden">SEND</span>
                        {unsentItems.length > 0 && <span className="ml-1">({unsentItems.length})</span>}
                      </Button>

                      {/* Pay Button */}
                      <Button
                        className="h-12 sm:h-14 text-sm sm:text-lg font-bold bg-green-600 hover:bg-green-700"
                        disabled={cart.length === 0}
                        onClick={openPaymentDialog}
                      >
                        <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                        PAY R{cartTotal.toFixed(0)}
                      </Button>
                    </div>

                    {/* Utility Buttons */}
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        className="h-10 sm:h-12 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs sm:text-sm"
                        disabled={cart.length === 0}
                        onClick={() => setPrintDialog(true)}
                      >
                        <Printer className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        Print
                      </Button>
                      <Button
                        className="h-10 sm:h-12 bg-red-600 hover:bg-red-700 text-white font-medium text-xs sm:text-sm"
                        disabled={cart.length === 0}
                        onClick={() => setVoidOrderDialog(true)}
                      >
                        <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        Void
                      </Button>
                      <Button
                        className="h-10 sm:h-12 bg-gray-600 hover:bg-gray-700 text-white font-medium text-xs sm:text-sm"
                        disabled={cart.length === 0}
                        onClick={() => setClearCartDialog(true)}
                      >
                        <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        Clear
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ACTIVE ORDERS TAB */}
          <TabsContent value="active" className="m-0 h-full overflow-auto p-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Active Orders</h2>
              <Button variant="outline" size="sm" onClick={fetchActiveOrders} disabled={loadingOrders}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingOrders ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {loadingOrders ? (
              <div className="text-center py-12 text-gray-500">
                <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin" />
                <p>Loading orders...</p>
              </div>
            ) : activeOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No active orders</p>
                <p className="text-xs mt-1">Orders will appear here when they're being prepared</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeOrders.map(order => (
                  <Card key={order.id} className="bg-[#1A1A1A] border-gray-700 hover:border-[#00897B] transition-colors cursor-pointer"
                    onClick={() => {
                      // Load order into cart for editing
                      if (order.items && order.items.length > 0) {
                        const orderItems: OrderItem[] = order.items.map(item => ({
                          id: item.id || `item-${Date.now()}-${Math.random()}`,
                          name: item.name,
                          price: item.unitPrice,
                          quantity: item.quantity,
                          category: 'imported',
                          icon: Utensils,
                          preparationTime: 10,
                          available: true,
                          popular: false,
                          dietary: [],
                          station: (item.station as keyof typeof STATIONS) || 'kitchen-grill',
                          sentToStation: item.sentToStation || false,
                          notes: item.notes,
                        }))
                        setCart(orderItems)
                        setCurrentOrder(order)
                        // Find and set the table if applicable
                        if (order.tableId) {
                          const table = tables.find(t => t.id === order.tableId)
                          if (table) setSelectedTable(table)
                        }
                        setActiveTab('order')
                        toast.success(`Loaded order ${order.orderNumber}`)
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{order.orderNumber}</span>
                            {getOrderStatusBadge(order)}
                            <Badge variant="outline" className="border-gray-600 text-gray-400">
                              {order.type}
                            </Badge>
                          </div>
                          {order.tableNumber && (
                            <p className="text-sm text-gray-400 mt-1">
                              Table {order.tableNumber}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(order.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#00897B]">R{order.total.toFixed(2)}</p>
                          <Badge className={`mt-1 ${order.paymentStatus === 'paid' ? 'bg-green-500' : order.paymentStatus === 'partial' ? 'bg-amber-500' : 'bg-red-500'}`}>
                            {order.paymentStatus}
                          </Badge>
                        </div>
                      </div>
                      
                      <Separator className="my-3 bg-gray-700" />
                      
                      <div className="space-y-1">
                        {order.items.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span>{item.quantity}x {item.name}</span>
                            <span className="text-gray-400">R{item.totalPrice.toFixed(2)}</span>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <p className="text-xs text-gray-500">+{order.items.length - 3} more items</p>
                        )}
                      </div>
                      
                      {/* Quick Actions for Active Order */}
                      <div className="mt-3 pt-3 border-t border-gray-700 flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 border-[#00897B] text-[#00897B] hover:bg-[#00897B] hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation()
                            // Load order for editing
                            if (order.items && order.items.length > 0) {
                              const orderItems: OrderItem[] = order.items.map(item => ({
                                id: item.id || `item-${Date.now()}-${Math.random()}`,
                                name: item.name,
                                price: item.unitPrice,
                                quantity: item.quantity,
                                category: 'imported',
                                icon: Utensils,
                                preparationTime: 10,
                                available: true,
                                popular: false,
                                dietary: [],
                                station: (item.station as keyof typeof STATIONS) || 'kitchen-grill',
                                sentToStation: item.sentToStation || false,
                                notes: item.notes,
                              }))
                              setCart(orderItems)
                              setCurrentOrder(order)
                              if (order.tableId) {
                                const table = tables.find(t => t.id === order.tableId)
                                if (table) setSelectedTable(table)
                              }
                              setActiveTab('order')
                              toast.success(`Editing order ${order.orderNumber}`)
                            }
                          }}
                        >
                          <Edit2 className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 border-green-600 text-green-400 hover:bg-green-600 hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation()
                            // Load order and open payment
                            if (order.items && order.items.length > 0) {
                              const orderItems: OrderItem[] = order.items.map(item => ({
                                id: item.id || `item-${Date.now()}-${Math.random()}`,
                                name: item.name,
                                price: item.unitPrice,
                                quantity: item.quantity,
                                category: 'imported',
                                icon: Utensils,
                                preparationTime: 10,
                                available: true,
                                popular: false,
                                dietary: [],
                                station: (item.station as keyof typeof STATIONS) || 'kitchen-grill',
                                sentToStation: item.sentToStation || false,
                                notes: item.notes,
                              }))
                              setCart(orderItems)
                              setCurrentOrder(order)
                              if (order.tableId) {
                                const table = tables.find(t => t.id === order.tableId)
                                if (table) setSelectedTable(table)
                              }
                              openPaymentDialog()
                            }
                          }}
                        >
                          <CreditCard className="h-3 w-3 mr-1" />
                          Pay
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 border-amber-600 text-amber-400 hover:bg-amber-600 hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation()
                            // Print this order
                            handlePrint('all')
                          }}
                        >
                          <Printer className="h-3 w-3 mr-1" />
                          Print
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>

      {/* ============================================ */}
      {/* DIALOGS */}
      {/* ============================================ */}

      {/* Confirm Send Dialog */}
      <Dialog open={confirmSendDialog} onOpenChange={setConfirmSendDialog}>
        <DialogContent className="bg-[#1A1A1A] text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-[#00897B]" />
              Send to Stations
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedTable 
                ? `Route order for Table ${selectedTable.number} to preparation stations`
                : 'Route takeaway order to preparation stations'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* Order Type Indicator */}
            <div className={`rounded-lg p-3 ${selectedTable ? 'bg-teal-900/30 border border-teal-700' : 'bg-purple-900/30 border border-purple-700'}`}>
              <div className="flex items-center gap-2">
                {selectedTable ? (
                  <>
                    <MapPin className="h-4 w-4 text-teal-400" />
                    <span className="font-medium text-teal-300">Dine-In Order</span>
                    <span className="text-teal-400 ml-2">Table {selectedTable.number}</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 text-purple-400" />
                    <span className="font-medium text-purple-300">Takeaway Order</span>
                  </>
                )}
              </div>
            </div>
            
            {/* Station Routing Summary */}
            {Array.from(getUnsentByStation().entries()).map(([station, items]) => {
              const stationInfo = STATIONS[station]
              const StationIcon = stationInfo?.icon || Utensils
              
              return (
                <div key={station} className="bg-[#0D0D0D] rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge 
                      style={{ backgroundColor: stationInfo?.color + '30', color: stationInfo?.color }}
                    >
                      <StationIcon className="h-3 w-3 mr-1" />
                      {stationInfo?.name}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {stationInfo?.type === 'kitchen' ? 'Kitchen Order' : 'Bar Order'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {items.map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.name}</span>
                        <span className="text-gray-400">R{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            
            {/* Total Items Count */}
            <div className="bg-[#0D0D0D] rounded-lg p-3 flex justify-between items-center">
              <span className="text-gray-400">Total Items</span>
              <span className="font-bold text-lg">{unsentItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmSendDialog(false)} className="border-gray-600">
              Cancel
            </Button>
            <Button
              className="bg-[#00897B] hover:bg-[#00695C]"
              onClick={sendToStations}
              disabled={sendingToKitchen}
            >
              {sendingToKitchen ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send to All Stations
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Sent Dialog */}
      <Dialog open={orderSentDialog} onOpenChange={setOrderSentDialog}>
        <DialogContent className="bg-[#1A1A1A] text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-green-400 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Order Routed to Stations
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Items have been sent to their respective preparation stations.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-[#0D0D0D] rounded-lg p-3 space-y-2">
              {Array.from(getStationOrders()).map(({ station, items }) => {
                const stationInfo = STATIONS[station]
                return (
                  <div key={station} className="flex items-center gap-2">
                    <Badge 
                      style={{ backgroundColor: stationInfo?.color + '30', color: stationInfo?.color }}
                    >
                      {stationInfo?.name}
                    </Badge>
                    <span className="text-sm text-gray-400">
                      {items.length} items
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOrderSentDialog(false)} className="border-gray-600">
              Continue Ordering
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => { setOrderSentDialog(false); openPaymentDialog(); }}>
              <CreditCard className="h-4 w-4 mr-2" />
              Proceed to Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog - REDESIGNED with white background */}
      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent className="bg-white text-gray-900 border-gray-200 max-w-md">
          <DialogHeader className="border-b border-gray-200 pb-4">
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-green-600" />
              Process Payment
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Table {selectedTable?.number || 'N/A'} • Server: {currentStaff?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Order Summary - Clear and visible */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-medium text-gray-700 mb-2">Order Summary</h4>
              <div className="space-y-1 text-sm max-h-32 overflow-y-auto">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-gray-600">
                    <span>{item.quantity}x {item.name}</span>
                    <span className="font-medium">R{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <Separator className="my-3 bg-gray-300" />
              <div className="space-y-1">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>R{cartSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>VAT (15%)</span>
                  <span>R{cartTax.toFixed(2)}</span>
                </div>
                <Separator className="my-2 bg-gray-300" />
                <div className="flex justify-between font-bold text-lg text-gray-900">
                  <span>Total</span>
                  <span>R{cartTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Tip Selection - Clear interface */}
            <div>
              <Label className="text-sm font-medium text-gray-700">Add Tip</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {tipOptions.map(tip => (
                  <Button
                    key={tip.id}
                    variant={selectedTipOption === tip.id ? 'default' : 'outline'}
                    size="sm"
                    className={`h-12 ${selectedTipOption === tip.id ? 'bg-green-600 hover:bg-green-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                    onClick={() => { setSelectedTipOption(tip.id); setCustomTipAmount('') }}
                  >
                    <div className="text-center">
                      <div className="font-bold">{tip.percentage}%</div>
                      <div className="text-xs opacity-75">R{(cartTotal * tip.percentage / 100).toFixed(0)}</div>
                    </div>
                  </Button>
                ))}
              </div>
              <div className="mt-2">
                <Input
                  type="number"
                  value={customTipAmount}
                  onChange={(e) => { setCustomTipAmount(e.target.value); setSelectedTipOption('') }}
                  placeholder="Custom tip amount (R)"
                  className="border-gray-300 focus:border-green-500"
                />
              </div>
              {getTipAmount() > 0 && (
                <p className="text-sm text-green-600 font-medium mt-2">
                  Tip: R{getTipAmount().toFixed(2)}
                </p>
              )}
            </div>

            {/* Grand Total */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex justify-between font-bold text-xl text-green-700">
                <span>Grand Total</span>
                <span>R{(cartTotal + getTipAmount()).toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method - Large, colorful buttons with distinct styling */}
            <div>
              <Label className="text-sm font-semibold text-gray-800 mb-2 block">Select Payment Method</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {paymentMethods.map(method => {
                  const isSelected = selectedPaymentMethod === method.id
                  let bgColor = 'bg-gray-50 border-gray-200'
                  let selectedBg = 'bg-green-600 border-green-600'
                  let iconColor = 'text-gray-500'
                  let selectedIconColor = 'text-white'
                  
                  // Distinct colors for each payment type
                  if (method.type === 'cash') {
                    bgColor = 'bg-amber-50 border-amber-300'
                    selectedBg = 'bg-amber-500 border-amber-500'
                    iconColor = 'text-amber-600'
                  } else if (method.type === 'card') {
                    bgColor = 'bg-sky-50 border-sky-300'
                    selectedBg = 'bg-sky-600 border-sky-600'
                    iconColor = 'text-sky-600'
                  } else if (method.type === 'mobile') {
                    bgColor = 'bg-purple-50 border-purple-300'
                    selectedBg = 'bg-purple-600 border-purple-600'
                    iconColor = 'text-purple-600'
                  }
                  
                  return (
                    <Button
                      key={method.id}
                      variant="outline"
                      className={`h-24 flex-col border-2 transition-all duration-200 ${
                        isSelected 
                          ? `${selectedBg} text-white shadow-lg scale-105 ring-2 ring-offset-2 ring-green-400` 
                          : `${bgColor} ${iconColor} hover:scale-102 hover:shadow-md`
                      }`}
                      onClick={() => setSelectedPaymentMethod(method.id)}
                    >
                      <div className={`p-2 rounded-full mb-1 ${isSelected ? 'bg-white/20' : 'bg-white/50'}`}>
                        {method.type === 'cash' && <Banknote className="h-7 w-7" />}
                        {method.type === 'card' && <CreditCard className="h-7 w-7" />}
                        {method.type === 'mobile' && <QrCode className="h-7 w-7" />}
                      </div>
                      <span className="text-sm font-bold">{method.name}</span>
                      {isSelected && (
                        <Check className="h-4 w-4 mt-1 absolute top-2 right-2 bg-white rounded-full text-green-600" />
                      )}
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* Cash tendered - Enhanced visibility */}
            {selectedPaymentMethod === 'cash' && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border-2 border-amber-300 shadow-md">
                <div className="flex items-center gap-2 mb-3">
                  <Banknote className="h-5 w-5 text-amber-600" />
                  <Label className="text-base font-bold text-amber-800">Cash Received</Label>
                </div>
                <Input
                  type="number"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  placeholder="0.00"
                  className="text-2xl font-bold border-2 border-amber-300 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 h-14 text-center"
                />
                {/* Quick cash buttons */}
                <div className="flex gap-2 mt-3 flex-wrap">
                  {[100, 200, 300, 500].map(amount => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      className="border-amber-300 bg-white hover:bg-amber-100 text-amber-700 font-bold"
                      onClick={() => setCashTendered(amount.toString())}
                    >
                      R{amount}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-amber-300 bg-white hover:bg-amber-100 text-amber-700 font-bold"
                    onClick={() => setCashTendered(Math.ceil(cartTotal + getTipAmount()).toString())}
                  >
                    Exact
                  </Button>
                </div>
                {/* Change display - Prominent styling */}
                {parseFloat(cashTendered) >= cartTotal + getTipAmount() && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl border-2 border-green-400 shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-green-700">Change Due</span>
                      <span className="text-3xl font-black text-green-600">R{getChange().toFixed(2)}</span>
                    </div>
                    <div className="mt-2 text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      Sufficient cash received
                    </div>
                  </div>
                )}
                {cashTendered && parseFloat(cashTendered) < cartTotal + getTipAmount() && (
                  <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-300">
                    <span className="text-red-600 font-medium flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Still need: R{((cartTotal + getTipAmount()) - parseFloat(cashTendered)).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-gray-200 pt-4">
            <Button variant="outline" onClick={() => setPaymentDialog(false)} className="border-gray-300">
              Cancel
            </Button>
            <Button
              className="h-14 px-8 text-lg font-bold bg-green-600 hover:bg-green-700"
              onClick={processPayment}
              disabled={processingPayment || !selectedPaymentMethod}
            >
              {processingPayment ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Check className="h-5 w-5 mr-2" />
              )}
              PROCESS PAYMENT
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Void Item Dialog */}
      <Dialog open={voidItemDialog} onOpenChange={setVoidItemDialog}>
        <DialogContent className="bg-[#1A1A1A] text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-red-400">Remove Item</DialogTitle>
            <DialogDescription className="text-gray-400">
              Remove {itemToVoid?.name} from order
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setVoidItemDialog(false); setItemToVoid(null) }} className="border-gray-600">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (itemToVoid) {
                  setCart(prev => prev.filter(i => i.id !== itemToVoid.id))
                  setVoidItemDialog(false)
                  setItemToVoid(null)
                  toast.success('Item removed')
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Void Order Dialog - With reason selection */}
      <Dialog open={voidOrderDialog} onOpenChange={setVoidOrderDialog}>
        <DialogContent className="bg-[#1A1A1A] text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Void Order
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              This will cancel the entire order. Please provide a reason.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label className="text-sm">Select Reason</Label>
              <Select value={selectedVoidReason} onValueChange={setSelectedVoidReason}>
                <SelectTrigger className="mt-1 bg-[#0D0D0D] border-gray-700">
                  <SelectValue placeholder="Choose a reason..." />
                </SelectTrigger>
                <SelectContent>
                  {voidReasons.map(reason => (
                    <SelectItem key={reason.id} value={reason.id}>
                      {reason.reason} {reason.requireManager && '(Requires Manager)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Or enter custom reason</Label>
              <Textarea
                value={voidCustomReason}
                onChange={(e) => setVoidCustomReason(e.target.value)}
                placeholder="Describe why you're voiding this order..."
                className="mt-1 bg-[#0D0D0D] border-gray-700"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setVoidOrderDialog(false); setSelectedVoidReason(''); setVoidCustomReason('') }} className="border-gray-600">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleVoidOrder}
              disabled={processingVoid || (!selectedVoidReason && !voidCustomReason)}
            >
              {processingVoid ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Void Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Cart Dialog */}
      <Dialog open={clearCartDialog} onOpenChange={setClearCartDialog}>
        <DialogContent className="bg-[#1A1A1A] text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Clear Cart</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to remove all items from the cart?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-[#0D0D0D] rounded-lg p-3">
              <p className="text-sm text-gray-400">
                This will remove {cart.length} items worth R{cartTotal.toFixed(2)}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearCartDialog(false)} className="border-gray-600">
              Keep Items
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setCart([])
                setClearCartDialog(false)
                toast.success('Cart cleared')
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Dialog */}
      <Dialog open={printDialog} onOpenChange={setPrintDialog}>
        <DialogContent className="bg-[#1A1A1A] text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Print Order
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Print order for Table {selectedTable?.number}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-[#0D0D0D] rounded-lg p-4 space-y-3">
              <div className="text-center border-b border-gray-700 pb-3">
                <h3 className="font-bold text-lg">Table {selectedTable?.number}</h3>
                <p className="text-xs text-gray-400">{new Date().toLocaleString()}</p>
                <p className="text-xs text-gray-400">Server: {currentStaff?.name}</p>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.name}</span>
                    <span className="text-gray-400">R{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-700 pt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal</span>
                  <span>R{cartSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">VAT (15%)</span>
                  <span>R{cartTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-1">
                  <span>Total</span>
                  <span className="text-[#00897B]">R{cartTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col gap-2">
            <div className="grid grid-cols-2 gap-2 w-full">
              <Button
                variant="outline"
                onClick={() => handlePrint('kitchen')}
                disabled={printing}
                className="border-gray-600"
              >
                <ChefHat className="h-4 w-4 mr-2" />
                Kitchen
              </Button>
              <Button
                variant="outline"
                onClick={() => handlePrint('bar')}
                disabled={printing}
                className="border-gray-600"
              >
                <Wine className="h-4 w-4 mr-2" />
                Bar
              </Button>
            </div>
            <Button
              className="w-full bg-[#00897B] hover:bg-[#00695C]"
              onClick={() => handlePrint('all')}
              disabled={printing}
            >
              {printing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Printer className="h-4 w-4 mr-2" />
              )}
              Print All Tickets
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Table Dialogs */}
      <Dialog open={addTableDialog} onOpenChange={setAddTableDialog}>
        <DialogContent className="bg-[#1A1A1A] text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Add New Table</DialogTitle>
            <DialogDescription className="text-gray-400">
              Add a new table to your floor plan.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label className="text-sm">Table Number/Name</Label>
              <Input
                value={newTableNumber}
                onChange={(e) => setNewTableNumber(e.target.value)}
                placeholder="e.g., 15 or P1"
                className="mt-1 bg-[#0D0D0D] border-gray-700"
              />
            </div>
            <div>
              <Label className="text-sm">Number of Seats</Label>
              <Input
                type="number"
                value={newTableSeats}
                onChange={(e) => setNewTableSeats(parseInt(e.target.value) || 4)}
                className="mt-1 bg-[#0D0D0D] border-gray-700"
              />
            </div>
            <div>
              <Label className="text-sm">Section</Label>
              <Select value={newTableSection} onValueChange={setNewTableSection}>
                <SelectTrigger className="mt-1 bg-[#0D0D0D] border-gray-700">
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map(section => (
                    <SelectItem key={section.id} value={section.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: section.color }} />
                        {section.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddTableDialog(false)} className="border-gray-600">
              Cancel
            </Button>
            <Button
              className="bg-[#00897B] hover:bg-[#00695C]"
              onClick={addNewTable}
              disabled={savingTable || sections.length === 0}
            >
              {savingTable ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Add Table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editTableDialog} onOpenChange={setEditTableDialog}>
        <DialogContent className="bg-[#1A1A1A] text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Edit Table</DialogTitle>
            <DialogDescription className="text-gray-400">Update table details</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label className="text-sm">Table Number/Name</Label>
              <Input
                value={newTableNumber}
                onChange={(e) => setNewTableNumber(e.target.value)}
                className="mt-1 bg-[#0D0D0D] border-gray-700"
              />
            </div>
            <div>
              <Label className="text-sm">Number of Seats</Label>
              <Input
                type="number"
                value={newTableSeats}
                onChange={(e) => setNewTableSeats(parseInt(e.target.value) || 4)}
                className="mt-1 bg-[#0D0D0D] border-gray-700"
              />
            </div>
            <div>
              <Label className="text-sm">Status</Label>
              <Select value={newTableStatus} onValueChange={(v: any) => setNewTableStatus(v)}>
                <SelectTrigger className="mt-1 bg-[#0D0D0D] border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTableDialog(false)} className="border-gray-600">
              Cancel
            </Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={updateTable} disabled={savingTable}>
              {savingTable ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTableDialog} onOpenChange={setDeleteTableDialog}>
        <DialogContent className="bg-[#1A1A1A] text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Delete Table</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete Table {tableToDelete?.number}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTableDialog(false)} className="border-gray-600">
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteTable} disabled={deletingTable}>
              {deletingTable ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manager Override Dialog */}
      <Dialog open={managerOverrideDialog} onOpenChange={setManagerOverrideDialog}>
        <DialogContent className="bg-[#1A1A1A] text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Manager Approval Required</DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter manager PIN to authorize this action
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="password"
              value={managerPin}
              onChange={(e) => setManagerPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Manager PIN"
              className="bg-[#0D0D0D] border-gray-700 text-center text-xl tracking-widest"
              maxLength={6}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManagerOverrideDialog(false)} className="border-gray-600">
              Cancel
            </Button>
            <Button
              className="bg-[#00897B] hover:bg-[#00695C]"
              onClick={async () => {
                if (managerPin.length < 4) {
                  toast.error('PIN must be at least 4 digits')
                  return
                }
                try {
                  const res = await fetch('/merchant-os/api/pos/staff/verify-pin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pin: managerPin }),
                  })
                  const data = await res.json()
                  if (res.ok && data.valid && (data.staff.role === 'manager' || data.staff.role === 'admin')) {
                    setManagerOverrideDialog(false)
                    setManagerPin('')
                    toast.success('Manager approved')
                  } else {
                    toast.error('Invalid manager PIN')
                  }
                } catch {
                  toast.error('Verification failed')
                }
              }}
            >
              Authorize
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
