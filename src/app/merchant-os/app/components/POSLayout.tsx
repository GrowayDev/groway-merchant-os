'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  VisuallyHidden,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { getAllSKUs } from '../data/skuCatalog'
import { MerchantDashboard } from './MerchantDashboard'
import { TransactionsView } from './TransactionsView'
import { InventoryView } from './InventoryView'
import { CRMView } from './CRMView'
import { StaffHRMView } from './StaffHRMView'
import { MarketingView } from './MarketingView'
import { AccountingView } from './AccountingView'
import { EnhancedBookingView } from './EnhancedBookingView'
import { VouchersAndGiftCardsView } from './VouchersAndGiftCardsView'
import { GroSupplyView } from './GroSupplyView'
import { GroSupplyEnhancedView } from './GroSupplyEnhancedView'
import { GroCreditView } from './GroCreditView'
import { HardwareIntegration } from './HardwareIntegration'
import { OfflineModeManager, OfflineModeProvider, OfflineStatusBadge, useOfflineMode } from './OfflineModeManager'
import { PaymentGatewayView } from './PaymentGatewayView'
import { MultiLocationView } from './MultiLocationView'
import { EnterprisePortalView } from './EnterprisePortalView'
import { GroSupplyMarketplaceView } from './GroSupplyMarketplaceView'
import { TrainingView } from './TrainingView'
import { SettingsView } from './SettingsView'
import { DigitalQRMenuView } from './DigitalQRMenuView'
import { TableFloorPlanView } from './TableFloorPlanView'
import { KitchenDisplayView } from './KitchenDisplayView'
import { RecipeEngineView } from './RecipeEngineView'
import { OnlineBookingWidget } from './OnlineBookingWidget'
import { BillSplittingView } from './BillSplittingView'
import { CourseManagementView } from './CourseManagementView'
import { QRSelfServiceView } from './QRSelfServiceView'
import { LiquorComplianceView } from './LiquorComplianceView'
import { HotelManagementView } from './HotelManagementView'
import { CustomerFacingView } from './CustomerFacingView'
import { WaiterPadView } from './WaiterPadView'
import { HealthBeautyView } from './HealthBeautyView'
import { SarsEfilingView } from './SarsEfilingView'
import { BankFeedView } from './BankFeedView'
import { CourierIntegrationView } from './CourierIntegrationView'
import { WhatsAppBusinessView } from './WhatsAppBusinessView'
import { NotificationCenter } from '../../components/NotificationCenter'
import { HardwareBuildingView } from './HardwareBuildingView'
import { PricingManagementView } from './PricingManagementView'
import { SalesReportView } from './SalesReportView'
import { FnbManagementView } from './FnbManagementView'
import { ProfessionalComplianceView } from './ProfessionalComplianceView'
import { FuneralServicesView } from './FuneralServicesView'
import { AutoRepairView } from './AutoRepairView'
import { DryCleaningView } from './DryCleaningView'
import { RealEstateView } from './RealEstateView'
import { ArchitectureView } from './ArchitectureView'
import { EngineeringView } from './EngineeringView'
import { QuantitySurveyingView } from './QuantitySurveyingView'
import { MedicalPracticeView } from './MedicalPracticeView'
import { DentalPracticeView } from './DentalPracticeView'
import { ChildcareView } from './ChildcareView'
import { SportLeisureView } from './SportLeisureView'
import { ElectronicsTechView } from './ElectronicsTechView'
import { AgricultureView } from './AgricultureView'
import {
  Store, 
  ArrowLeft,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Trash2,
  Search,
  CreditCard,
  Banknote,
  QrCode,
  Wallet,
  ShoppingCart,
  User,
  Users,
  Package,
  BarChart3,
  Settings,
  Bell,
  Zap,
  Clock,
  LucideIcon,
  CheckCircle2,
  Receipt,
  Home,
  X,
  Printer,
  Megaphone,
  Calculator,
  UserCog,
  Gift,
  MoreHorizontal,
  Calendar,
  Building2,
  Wifi,
  WifiOff,
  Route,
  GraduationCap,
  MapPin,
  ChefHat,
  Globe,
  Utensils,
  ShieldCheck,
  Hotel,
  Smartphone,
  Coins,
  PiggyBank,
  TrendingUp,
  Menu,
  ChevronUp,
  FileText,
  Truck,
  MessageSquare,
  Wrench,
  Scissors,
  Scale,
  Shirt,
  Percent,
  Pause,
  Play,
  Edit3,
  ArrowRightLeft,
  Star,
  Phone,
  Mail,
  Baby,
  Dumbbell,
  Leaf,
} from 'lucide-react'
import {
  QuickChargePresets,
  PriceOverrideDialog,
  DiscountDialog,
  SplitPaymentDialog,
  CustomerLookupDialog,
  HoldTransactionDialog,
  ReceiptPreview,
  VoidRefundDialog,
  CartItemWithActions,
} from './POSEnhancedFeatures'
import type {
  CartItem as EnhancedCartItem,
  HeldTransaction,
  Customer,
  SplitPayment,
  Discount,
} from './POSEnhancedFeatures'

interface SubVertical {
  id: string
  name: string
  skuCount: number
  features: string[]
}

interface Vertical {
  id: string
  name: string
  icon: LucideIcon
  subCount: number
  description: string
  subVerticals: SubVertical[]
}

interface POSLayoutProps {
  vertical: Vertical
  subVertical: SubVertical
  vasTiles: string[]
  onBack: () => void
}

// Cart item type - extended with discount and price override support
interface CartItem {
  id: string
  name: string
  price: number
  originalPrice?: number
  quantity: number
  category: string
  customerId?: string
  customerName?: string
  customerPhone?: string
  appointmentId?: string
  discount?: number
  discountType?: 'percentage' | 'fixed'
  priceOverride?: number
  notes?: string
}

// Booking to POS interface
export interface BookingToPOS {
  appointmentId: string
  serviceName: string
  servicePrice: number
  category: string
  customerName: string
  customerPhone?: string
  customerId?: string
  depositPaid?: boolean
  depositAmount?: number
}

type ViewType = 'dashboard' | 'pos' | 'transactions' | 'inventory' | 'pricing' | 'crm' | 'marketing' | 'staff' | 'accounting' | 'booking' | 'widget' | 'giftcards' | 'grosupply' | 'gromarket' | 'hardware' | 'payments' | 'multilocation' | 'offline' | 'training' | 'qrmenu' | 'floorplan' | 'kitchen' | 'recipe' | 'courses' | 'billsplit' | 'qrselfservice' | 'liquor' | 'hotel' | 'customerfacing' | 'waiterpad' | 'healthbeauty' | 'sars' | 'bankfeed' | 'courier' | 'whatsapp' | 'hardwarebuilding' | 'notifications' | 'settings' | 'more' | 'orders' | 'search' | 'grocredit' | 'enterprise' | 'salesreport' | 'fnbmanagement' | 'funeral' | 'autorepair' | 'dryclean' | 'professional' | 'realestate' | 'architecture' | 'engineering' | 'quantitysurveying' | 'medicalpractice' | 'dentalpractice' | 'childcare' | 'sportleisure' | 'electronicstech' | 'grocery' | 'fashion' | 'agriculture'

// Mobile Orders View Component
const MobileOrdersView = ({ orders, onViewOrder }: { orders: any[], onViewOrder: (id: string) => void }) => {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      preparing: 'bg-orange-100 text-orange-700',
      ready: 'bg-green-100 text-green-700',
      completed: 'bg-gray-100 text-gray-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-yellow-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-yellow-600">
            {orders.filter(o => o.status === 'pending').length}
          </p>
          <p className="text-xs text-gray-500">Pending</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-orange-600">
            {orders.filter(o => o.status === 'preparing').length}
          </p>
          <p className="text-xs text-gray-500">Preparing</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-600">
            {orders.filter(o => o.status === 'ready').length}
          </p>
          <p className="text-xs text-gray-500">Ready</p>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No orders yet</p>
          </div>
        ) : (
          orders.map((order) => (
            <button
              key={order.id}
              onClick={() => onViewOrder(order.id)}
              className="w-full bg-white rounded-lg border border-gray-200 p-4 text-left active:bg-gray-50"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-[#1A1A1A]">{order.orderNumber}</p>
                  {order.customerName && (
                    <p className="text-sm text-gray-500">{order.customerName}</p>
                  )}
                </div>
                <Badge className={getStatusColor(order.status)}>
                  {order.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{order.items} items</span>
                <span className="font-bold text-[#00897B]">R{order.total.toFixed(2)}</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

// Responsive context
interface ResponsiveContextType {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  screenWidth: number
  mobileAppMode: boolean
  setMobileAppMode: (mode: boolean) => void
}

const ResponsiveContext = createContext<ResponsiveContextType>({
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  screenWidth: 1024,
  mobileAppMode: false,
  setMobileAppMode: () => {},
})

export const useResponsive = () => useContext(ResponsiveContext)

export function POSLayout({ vertical, subVertical, vasTiles, onBack }: POSLayoutProps) {
  // Offline mode hook - must be used within OfflineModeProvider
  const offlineMode = useOfflineMode()
  
  // Responsive state
  const [screenWidth, setScreenWidth] = useState(1024)
  const [mobileAppMode, setMobileAppMode] = useState(false)
  
  // Core state
  const [currentView, setCurrentView] = useState<ViewType>('dashboard')
  const [cart, setCart] = useState<CartItem[]>([])
  const [bookingData, setBookingData] = useState<BookingToPOS | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [saleComplete, setSaleComplete] = useState(false)
  const [offlineTransactionSaved, setOfflineTransactionSaved] = useState(false)
  
  // Enhanced POS Features state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [cartDiscount, setCartDiscount] = useState<Discount | null>(null)
  const [heldTransactions, setHeldTransactions] = useState<HeldTransaction[]>([])
  const [completedTransaction, setCompletedTransaction] = useState<{
    id: string
    number: string
    items: CartItem[]
    subtotal: number
    discount?: number
    vat: number
    total: number
    paymentMethod?: string
    customerName?: string
    createdAt: Date
  } | null>(null)
  
  // Dialog states
  const [priceOverrideOpen, setPriceOverrideOpen] = useState(false)
  const [itemDiscountOpen, setItemDiscountOpen] = useState(false)
  const [cartDiscountOpen, setCartDiscountOpen] = useState(false)
  const [splitPaymentOpen, setSplitPaymentOpen] = useState(false)
  const [customerLookupOpen, setCustomerLookupOpen] = useState(false)
  const [holdTransactionOpen, setHoldTransactionOpen] = useState(false)
  const [receiptPreviewOpen, setReceiptPreviewOpen] = useState(false)
  const [voidRefundOpen, setVoidRefundOpen] = useState(false)
  const [voidRefundMode, setVoidRefundMode] = useState<'void' | 'refund'>('void')
  const [selectedItemForEdit, setSelectedItemForEdit] = useState<CartItem | null>(null)
  const [isSplitPayment, setIsSplitPayment] = useState(false)
  const [splitPayments, setSplitPayments] = useState<SplitPayment[]>([])
  
  // Mobile-specific state
  const [mobileCartOpen, setMobileCartOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false)
  
  // Responsive breakpoints
  const isMobile = screenWidth < 640 || mobileAppMode
  const isTablet = screenWidth >= 640 && screenWidth < 1024
  const isDesktop = screenWidth >= 1024 && !mobileAppMode
  
  // Track screen size
  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Get SKUs for this vertical/sub-vertical
  const skus = getAllSKUs(vertical.id, subVertical.id)
  
  // Get unique categories
  const categories = ['all', ...new Set(skus.map(sku => sku.category))]
  
  // Filter SKUs by search and category
  const filteredSKUs = skus.filter(sku => {
    const matchesSearch = sku.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === 'all' || sku.category === activeCategory
    return matchesSearch && matchesCategory
  })

  // Cart calculations with discount and price override support
  const itemsSubtotal = cart.reduce((sum, item) => {
    const effectivePrice = item.priceOverride ?? item.price
    const itemTotal = effectivePrice * item.quantity
    const itemDiscount = item.discount || 0
    return sum + (itemTotal - itemDiscount)
  }, 0)
  
  // Apply cart-level discount
  const cartDiscountAmount = cartDiscount
    ? cartDiscount.type === 'percentage'
      ? itemsSubtotal * (cartDiscount.value / 100)
      : cartDiscount.value
    : 0
  
  const subtotal = itemsSubtotal - cartDiscountAmount
  const vat = subtotal * 0.15 // 15% VAT
  const total = subtotal + vat

  const addToCart = (sku: typeof skus[0]) => {
    setCart(prev => {
      const existing = prev.find(item => item.name === sku.name)
      if (existing) {
        return prev.map(item => 
          item.name === sku.name 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { id: Date.now().toString(), name: sku.name, price: sku.price, quantity: 1, category: sku.category }]
    })
  }
  
  // Quick charge handler
  const handleQuickCharge = (amount: number, label?: string) => {
    const quickItem: CartItem = {
      id: `quick-${Date.now()}`,
      name: label || `Quick Charge - R${amount.toFixed(2)}`,
      price: amount,
      quantity: 1,
      category: 'Quick Charge'
    }
    setCart([quickItem])
  }

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta
        return newQty > 0 ? { ...item, quantity: newQty } : item
      }
      return item
    }).filter(item => item.quantity > 0))
  }

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  const clearCart = () => {
    setCart([])
    setSelectedPayment(null)
    setBookingData(null)
    setSelectedCustomer(null)
    setCartDiscount(null)
    setIsSplitPayment(false)
    setSplitPayments([])
  }
  
  // Price override handler
  const handlePriceOverride = (itemId: string, newPrice: number, reason: string) => {
    setCart(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          priceOverride: newPrice,
          originalPrice: item.originalPrice || item.price,
          notes: reason
        }
      }
      return item
    }))
  }
  
  // Discount handlers
  const handleItemDiscount = (discount: Discount, itemId?: string) => {
    if (!itemId) return
    setCart(prev => prev.map(item => {
      if (item.id === itemId) {
        const effectivePrice = item.priceOverride ?? item.price
        const discountAmount = discount.type === 'percentage'
          ? effectivePrice * item.quantity * (discount.value / 100)
          : discount.value
        return {
          ...item,
          discount: discountAmount,
          discountType: discount.type
        }
      }
      return item
    }))
  }
  
  const handleCartDiscount = (discount: Discount) => {
    setCartDiscount(discount)
  }
  
  // Hold transaction handlers
  const handleHoldTransaction = (notes?: string) => {
    const heldTx: HeldTransaction = {
      id: `held-${Date.now()}`,
      items: [...cart],
      subtotal: itemsSubtotal,
      discount: cartDiscountAmount,
      discountType: cartDiscount?.type || 'fixed',
      notes,
      customerName: selectedCustomer?.name || bookingData?.customerName,
      customerId: selectedCustomer?.id || bookingData?.customerId,
      heldAt: new Date()
    }
    setHeldTransactions(prev => [...prev, heldTx])
    clearCart()
  }
  
  const handleResumeTransaction = (transaction: HeldTransaction) => {
    setCart(transaction.items)
    if (transaction.customerName) {
      setSelectedCustomer({
        id: transaction.customerId || '',
        name: transaction.customerName
      })
    }
    if (transaction.discount > 0) {
      setCartDiscount({
        type: transaction.discountType,
        value: transaction.discount
      })
    }
    setHeldTransactions(prev => prev.filter(t => t.id !== transaction.id))
  }
  
  const handleDeleteHeldTransaction = (id: string) => {
    setHeldTransactions(prev => prev.filter(t => t.id !== id))
  }
  
  // Split payment handler
  const handleSplitPaymentComplete = (payments: SplitPayment[]) => {
    setSplitPayments(payments)
    setIsSplitPayment(true)
    // Process the sale with split payments
    processSale(payments)
  }
  
  // Process sale
  const processSale = async (payments?: SplitPayment[]) => {
    const sessionStr = localStorage.getItem('groway_session')
    const session = sessionStr ? JSON.parse(sessionStr) : null
    const merchantId = session?.merchantId || 'merchant-001'
    const branchId = session?.branchId || 'branch-001'
    
    const transactionNumber = `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
    
    setCheckoutOpen(false)
    setSaleComplete(true)
    setOfflineTransactionSaved(false)

    // Check if offline
    if (!offlineMode.isOnline) {
      try {
        await offlineMode.addTransaction({
          type: 'sale',
          amount: total,
          items: cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.priceOverride ?? item.price,
          })),
          paymentMethod: isSplitPayment ? 'split' : (selectedPayment || 'cash'),
          verticalId: vertical.id,
          subVerticalId: subVertical.id,
          cashierId: session?.userId,
          notes: bookingData ? `Booking: ${bookingData.customerName}` : undefined,
        })
        setOfflineTransactionSaved(true)
      } catch (error) {
        console.error('Failed to save offline transaction:', error)
      }
      
      setTimeout(() => {
        clearCart()
        setSaleComplete(false)
        setOfflineTransactionSaved(false)
      }, 3000)
      return
    }

    // Online - save transaction
    try {
      const response = await fetch('/merchant-os/api/pos/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId,
          branchId,
          items: cart.map(item => ({
            name: item.name,
            price: item.priceOverride ?? item.price,
            quantity: item.quantity,
            category: item.category,
            discount: item.discount,
            customerId: item.customerId || selectedCustomer?.id,
            customerName: item.customerName || selectedCustomer?.name,
          })),
          subtotal,
          discount: cartDiscountAmount,
          vatAmount: vat,
          total,
          paymentMethod: isSplitPayment ? 'split' : (selectedPayment || 'cash'),
          splitPayments: isSplitPayment ? splitPayments : undefined,
          customerName: selectedCustomer?.name || bookingData?.customerName,
          customerId: selectedCustomer?.id || bookingData?.customerId,
          appointmentId: bookingData?.appointmentId,
          depositApplied: bookingData?.depositPaid ? bookingData?.depositAmount : 0,
        })
      })

      if (response.ok) {
        const result = await response.json()
        // Set completed transaction for receipt
        setCompletedTransaction({
          id: result.data?.id || transactionNumber,
          number: result.data?.number || transactionNumber,
          items: cart,
          subtotal,
          discount: cartDiscountAmount,
          vat,
          total,
          paymentMethod: isSplitPayment ? 'split' : (selectedPayment || 'cash'),
          customerName: selectedCustomer?.name || bookingData?.customerName,
          createdAt: new Date()
        })
        
        if (offlineMode.metrics.pendingSync > 0) {
          offlineMode.syncNow()
        }
      } else {
        await offlineMode.addTransaction({
          type: 'sale',
          amount: total,
          items: cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.priceOverride ?? item.price,
          })),
          paymentMethod: isSplitPayment ? 'split' : (selectedPayment || 'cash'),
          verticalId: vertical.id,
          subVerticalId: subVertical.id,
          cashierId: session?.userId,
        })
        setOfflineTransactionSaved(true)
      }
    } catch (error) {
      console.error('Transaction error:', error)
      try {
        await offlineMode.addTransaction({
          type: 'sale',
          amount: total,
          items: cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.priceOverride ?? item.price,
          })),
          paymentMethod: isSplitPayment ? 'split' : (selectedPayment || 'cash'),
          verticalId: vertical.id,
          subVerticalId: subVertical.id,
          cashierId: session?.userId,
        })
        setOfflineTransactionSaved(true)
      } catch (offlineError) {
        console.error('Failed to save offline transaction:', offlineError)
      }
    }

    setTimeout(() => {
      clearCart()
      setSaleComplete(false)
      setOfflineTransactionSaved(false)
    }, 3000)
  }

  // Add booking service to cart
  const addBookingToCart = (booking: BookingToPOS) => {
    setBookingData(booking)
    setCart([{
      id: `booking-${booking.appointmentId}`,
      name: booking.serviceName,
      price: booking.servicePrice,
      quantity: 1,
      category: booking.category,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      customerId: booking.customerId,
      appointmentId: booking.appointmentId,
    }])
    setCurrentView('pos')
    setCheckoutOpen(true)
  }

  // Handle booking from external source
  const handleBookingToPOS = (booking: BookingToPOS) => {
    addBookingToCart(booking)
  }

  const handleCheckout = () => {
    setCheckoutOpen(true)
  }

  // Complete sale with selected payment
  const completeSale = async () => {
    await processSale()
  }

  // Navigation organized into 9 categories
  interface NavItem {
    id: ViewType
    icon: LucideIcon
    label: string
  }

  interface NavCategory {
    name: string
    items: NavItem[]
  }

  const getNavCategories = (): NavCategory[] => {
    const categories: NavCategory[] = []

    // 1. Overview
    categories.push({
      name: 'Overview',
      items: [
        { id: 'dashboard', icon: Home, label: 'Dashboard' },
      ]
    })

    // 2. Sales
    const salesItems: NavItem[] = [
      { id: 'pos', icon: Store, label: 'POS' },
    ]
    
    // Food & Beverage specific
    if (vertical.id === 'fnb') {
      salesItems.push({ id: 'waiterpad', icon: Smartphone, label: 'WaiterPad' })
      salesItems.push({ id: 'floorplan', icon: MapPin, label: 'Floor Plan' })
      salesItems.push({ id: 'kitchen', icon: ChefHat, label: 'Kitchen Display' })
      salesItems.push({ id: 'courses', icon: Utensils, label: 'Course Management' })
      salesItems.push({ id: 'billsplit', icon: Users, label: 'Bill Splitting' })
      salesItems.push({ id: 'qrselfservice', icon: QrCode, label: 'QR Self-Service' })
    }
    
    categories.push({ name: 'Sales', items: salesItems })

    // 3. Bookings & Services (ONLY for Health & Beauty)
    // Bookings and Online Widget are EXCLUSIVE to Health & Beauty vertical
    if (vertical.id === 'health-beauty') {
      categories.push({
        name: 'Bookings',
        items: [
          { id: 'booking', icon: Calendar, label: 'Bookings' },
          { id: 'widget', icon: Globe, label: 'Online Widget' },
        ]
      })
    }

    // 4. Operations
    const operationsItems: NavItem[] = [
      { id: 'inventory', icon: Package, label: 'Inventory' },
      { id: 'pricing', icon: Coins, label: 'Pricing' },
    ]
    
    if (vertical.id === 'fnb') {
      operationsItems.push({ id: 'recipe', icon: ChefHat, label: 'Recipe Engine' })
      operationsItems.push({ id: 'fnbmanagement', icon: ChefHat, label: 'F&B Management' })
    }

    if (vertical.id === 'hospitality') {
      operationsItems.push({ id: 'hotel', icon: Hotel, label: 'Hotel Management' })
    }

    // Childcare & Education - Sub-vertical specific operations
    if (vertical.id === 'childcare') {
      operationsItems.push({ id: 'childcare', icon: Baby, label: 'Childcare Management' })
    }

    // Sport & Leisure - Sub-vertical specific operations
    if (vertical.id === 'sport-leisure') {
      operationsItems.push({ id: 'sportleisure', icon: Dumbbell, label: 'Club Management' })
    }

    // Electronics & Tech - Sub-vertical specific operations
    if (vertical.id === 'electronics') {
      operationsItems.push({ id: 'electronicstech', icon: Smartphone, label: 'Tech Services' })
    }

    // Hardware & Building - Sub-vertical specific operations  
    if (vertical.id === 'hardware') {
      operationsItems.push({ id: 'hardwarebuilding', icon: Wrench, label: 'Building Supplies' })
    }

    // Professional Services - Subvertical specific operations
    if (vertical.id === 'professional-services') {
      // Each subvertical has unique operations
      if (subVertical.id === 'funeral-home') {
        operationsItems.push({ id: 'funeral', icon: FileText, label: 'Funeral Management' })
      } else if (subVertical.id === 'auto-repair') {
        operationsItems.push({ id: 'autorepair', icon: Wrench, label: 'Workshop & Job Cards' })
      } else if (subVertical.id === 'legal-services') {
        operationsItems.push({ id: 'professional', icon: Scale, label: 'Legal Practice' })
      } else if (subVertical.id === 'accounting') {
        operationsItems.push({ id: 'accounting', icon: Calculator, label: 'Practice Management' })
      } else if (subVertical.id === 'dry-cleaning') {
        operationsItems.push({ id: 'dryclean', icon: Shirt, label: 'Laundry Management' })
      } else if (subVertical.id === 'tutoring-school') {
        operationsItems.push({ id: 'courses', icon: GraduationCap, label: 'Course Management' })
      } else if (subVertical.id === 'real-estate') {
        operationsItems.push({ id: 'realestate', icon: Building2, label: 'Estate Agency' })
      } else if (subVertical.id === 'architecture') {
        operationsItems.push({ id: 'architecture', icon: Building2, label: 'Architecture Practice' })
      } else if (subVertical.id === 'engineering') {
        operationsItems.push({ id: 'engineering', icon: Wrench, label: 'Engineering Practice' })
      } else if (subVertical.id === 'quantity-surveying') {
        operationsItems.push({ id: 'quantitysurveying', icon: Calculator, label: 'QS Practice' })
      } else if (subVertical.id === 'medical-practice') {
        operationsItems.push({ id: 'medicalpractice', icon: FileText, label: 'Medical Practice' })
      } else if (subVertical.id === 'dental-practice') {
        operationsItems.push({ id: 'dentalpractice', icon: FileText, label: 'Dental Practice' })
      }
    }

    // Agriculture - Farm management operations
    if (vertical.id === 'agriculture') {
      operationsItems.push({ id: 'agriculture', icon: Leaf, label: 'Farm Management' })
    }

    categories.push({ name: 'Operations', items: operationsItems })

    // 5. Finance
    categories.push({
      name: 'Finance',
      items: [
        { id: 'salesreport', icon: BarChart3, label: 'Sales Report' },
        { id: 'transactions', icon: Receipt, label: 'Transactions' },
        { id: 'accounting', icon: Calculator, label: 'Accounting' },
        { id: 'payments', icon: Route, label: 'Payment Gateway' },
        { id: 'grocredit', icon: PiggyBank, label: 'GroCredit' },
      ]
    })

    // 6. Customers
    categories.push({
      name: 'Customers',
      items: [
        { id: 'crm', icon: Users, label: 'CRM & Loyalty' },
        { id: 'marketing', icon: Megaphone, label: 'Marketing' },
      ]
    })

    // 7. Staff
    categories.push({
      name: 'Staff',
      items: [
        { id: 'staff', icon: UserCog, label: 'Staff & HR' },
        { id: 'training', icon: GraduationCap, label: 'Training' },
      ]
    })

    // 8. Growth
    const growthItems: NavItem[] = [
      { id: 'giftcards', icon: Gift, label: 'Gift Cards' },
      { id: 'grosupply', icon: Building2, label: 'GroSupply' },
      { id: 'gromarket', icon: ShoppingCart, label: 'GroMarket' },
      { id: 'customerfacing', icon: Globe, label: 'Customer Facing' },
    ]
    
    if (vertical.id === 'fnb' || vertical.id === 'hospitality') {
      growthItems.unshift({ id: 'qrmenu', icon: QrCode, label: 'QR Menu' })
    }
    
    categories.push({ name: 'Growth', items: growthItems })

    // 9. Settings
    const settingsItems: NavItem[] = [
      { id: 'enterprise', icon: Building2, label: 'Enterprise Portal' },
      { id: 'multilocation', icon: Building2, label: 'Multi-Location' },
      { id: 'notifications', icon: Bell, label: 'Notifications' },
      { id: 'hardware', icon: Printer, label: 'Hardware' },
      { id: 'offline', icon: Wifi, label: 'Offline Mode' },
      { id: 'settings', icon: Settings, label: 'Settings' },
    ]
    
    // Add Liquor Compliance for applicable verticals
    if (['fnb', 'liquor', 'hospitality'].includes(vertical.id)) {
      settingsItems.splice(2, 0, { id: 'liquor', icon: ShieldCheck, label: 'Liquor Compliance' })
    }
    
    // Add Health & Beauty Compliance for health-beauty vertical
    if (vertical.id === 'health-beauty') {
      settingsItems.splice(2, 0, { id: 'healthbeauty', icon: Scissors, label: 'Health & Beauty' })
    }
    
    categories.push({ name: 'Settings', items: settingsItems })

    return categories
  }

  const navCategories = getNavCategories()

  const renderMainContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <MerchantDashboard 
            verticalName={vertical.name}
            subVerticalName={subVertical.name}
            onNewSale={() => setCurrentView('pos')}
            onNavigate={(view) => setCurrentView(view as ViewType)}
          />
        )
      case 'salesreport':
        return <SalesReportView />
      case 'transactions':
        return <TransactionsView />
      case 'inventory':
        return <InventoryView verticalId={vertical.id} subVerticalId={subVertical.id} />
      case 'pricing':
        return <PricingManagementView />
      case 'crm':
        return <CRMView />
      case 'marketing':
        return <MarketingView />
      case 'staff':
        return <StaffHRMView />
      case 'accounting':
        return <AccountingView />
      case 'booking':
        return <EnhancedBookingView onProceedToPOS={handleBookingToPOS} />
      case 'widget':
        return <OnlineBookingWidget />
      case 'giftcards':
        return <VouchersAndGiftCardsView />
      case 'grosupply':
        return <GroSupplyEnhancedView />
      case 'gromarket':
        return <GroSupplyMarketplaceView />
      case 'payments':
        return <PaymentGatewayView />
      case 'grocredit':
        return <GroCreditView />
      case 'multilocation':
        return <MultiLocationView />
      case 'enterprise':
        return <EnterprisePortalView />
      case 'hardware':
        return <HardwareIntegration />
      case 'offline':
        return <OfflineModeManager />
      case 'training':
        return <TrainingView />
      case 'settings':
        return <SettingsView />
      case 'qrmenu':
        return <DigitalQRMenuView />
      case 'floorplan':
        return (
          <div className="flex-1 overflow-hidden">
            <TableFloorPlanView />
          </div>
        )
      case 'kitchen':
        return (
          <div className="flex-1 overflow-hidden">
            <KitchenDisplayView />
          </div>
        )
      case 'recipe':
        return (
          <div className="flex-1 overflow-hidden">
            <RecipeEngineView />
          </div>
        )
      case 'fnbmanagement':
        return (
          <div className="flex-1 overflow-hidden">
            <FnbManagementView />
          </div>
        )
      case 'courses':
        return (
          <div className="flex-1 overflow-hidden">
            <CourseManagementView />
          </div>
        )
      case 'billsplit':
        return (
          <div className="flex-1 overflow-hidden">
            <BillSplittingView />
          </div>
        )
      case 'qrselfservice':
        return (
          <div className="flex-1 overflow-hidden">
            <QRSelfServiceView />
          </div>
        )
      case 'liquor':
        return (
          <div className="flex-1 overflow-hidden">
            <LiquorComplianceView />
          </div>
        )
      case 'healthbeauty':
        return (
          <div className="flex-1 overflow-hidden">
            <HealthBeautyView />
          </div>
        )
      case 'hotel':
        return (
          <div className="flex-1 overflow-hidden">
            <HotelManagementView />
          </div>
        )
      case 'customerfacing':
        return (
          <div className="flex-1 overflow-hidden">
            <CustomerFacingView />
          </div>
        )
      case 'waiterpad':
        return (
          <div className="flex-1 overflow-hidden">
            <WaiterPadView />
          </div>
        )
      case 'sars':
        return (
          <div className="flex-1 overflow-hidden">
            <SarsEfilingView />
          </div>
        )
      case 'bankfeed':
        return (
          <div className="flex-1 overflow-hidden">
            <BankFeedView />
          </div>
        )
      case 'courier':
        return (
          <div className="flex-1 overflow-hidden">
            <CourierIntegrationView />
          </div>
        )
      case 'whatsapp':
        return (
          <div className="flex-1 overflow-hidden">
            <WhatsAppBusinessView />
          </div>
        )
      case 'hardwarebuilding':
        return (
          <div className="flex-1 overflow-hidden">
            <HardwareBuildingView />
          </div>
        )
      case 'notifications':
        return (
          <div className="flex-1 overflow-auto p-6">
            <NotificationCenter />
          </div>
        )
      case 'funeral':
        return (
          <div className="flex-1 overflow-hidden">
            <FuneralServicesView />
          </div>
        )
      case 'autorepair':
        return (
          <div className="flex-1 overflow-hidden">
            <AutoRepairView />
          </div>
        )
      case 'dryclean':
        return (
          <div className="flex-1 overflow-hidden">
            <DryCleaningView />
          </div>
        )
      case 'professional':
        return (
          <div className="flex-1 overflow-hidden">
            <ProfessionalComplianceView />
          </div>
        )
      case 'realestate':
        return (
          <div className="flex-1 overflow-hidden">
            <RealEstateView />
          </div>
        )
      case 'architecture':
        return (
          <div className="flex-1 overflow-hidden">
            <ArchitectureView />
          </div>
        )
      case 'engineering':
        return (
          <div className="flex-1 overflow-hidden">
            <EngineeringView />
          </div>
        )
      case 'quantitysurveying':
        return (
          <div className="flex-1 overflow-hidden">
            <QuantitySurveyingView />
          </div>
        )
      case 'medicalpractice':
        return (
          <div className="flex-1 overflow-hidden">
            <MedicalPracticeView />
          </div>
        )
      case 'dentalpractice':
        return (
          <div className="flex-1 overflow-hidden">
            <DentalPracticeView />
          </div>
        )
      case 'childcare':
        return (
          <div className="flex-1 overflow-hidden">
            <ChildcareView />
          </div>
        )
      case 'sportleisure':
        return (
          <div className="flex-1 overflow-hidden">
            <SportLeisureView />
          </div>
        )
      case 'electronicstech':
        return (
          <div className="flex-1 overflow-hidden">
            <ElectronicsTechView />
          </div>
        )
      case 'agriculture':
        return (
          <div className="flex-1 overflow-hidden">
            <AgricultureView subVerticalId={subVertical.id} />
          </div>
        )
      case 'pos':
      default:
        return (
          <div className="flex-1 flex overflow-hidden">
            {/* Product Grid */}
            <div className="flex-1 flex flex-col min-w-0 p-4">
              {/* Search & Categories */}
              <div className="mb-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <ScrollArea className="w-full">
                  <div className="flex gap-2 pb-2">
                    {categories.map((category) => (
                      <Button
                        key={category}
                        variant={activeCategory === category ? 'default' : 'outline'}
                        size="sm"
                        className={`text-xs ${
                          activeCategory === category 
                            ? 'bg-[#00897B] hover:bg-[#00695C]' 
                            : 'border-gray-200'
                        }`}
                        onClick={() => setActiveCategory(category)}
                      >
                        {category === 'all' ? 'All' : category}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Product Grid */}
              <ScrollArea className="flex-1">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {filteredSKUs.map((sku, index) => (
                    <Card 
                      key={index}
                      className="cursor-pointer hover:border-[#00897B] hover:shadow-md transition-all duration-200"
                      onClick={() => addToCart(sku)}
                    >
                      <CardContent className="p-3 text-center">
                        <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-[#E0F2F1] text-[#00897B] flex items-center justify-center">
                          <sku.icon className="h-5 w-5" />
                        </div>
                        <h4 className="text-xs font-medium text-[#1A1A1A] mb-1 line-clamp-2">{sku.name}</h4>
                        <p className="text-sm font-bold text-[#00897B]">R{sku.price.toFixed(2)}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Cart Sidebar */}
            <aside className="w-80 bg-white border-l border-gray-200 flex flex-col">
              {/* Cart Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-[#1A1A1A] flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Current Sale
                  </h2>
                  <div className="flex items-center gap-1">
                    {heldTransactions.length > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setHoldTransactionOpen(true)}
                        className="text-xs text-amber-600"
                      >
                        <Pause className="h-3 w-3 mr-1" />
                        {heldTransactions.length}
                      </Button>
                    )}
                    {cart.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearCart} className="text-xs text-red-500 hover:text-red-600">
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Cart Items */}
              <ScrollArea className="flex-1 p-4">
                {cart.length === 0 ? (
                  <div className="space-y-4">
                    <div className="text-center py-4">
                      <ShoppingCart className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm text-[#757575]">Cart is empty</p>
                      <p className="text-xs text-gray-400 mt-1">Tap products or use Quick Charge</p>
                    </div>
                    
                    {/* Enhanced Quick Charge Presets */}
                    <QuickChargePresets onSelectAmount={handleQuickCharge} />
                    
                    {/* Held Transactions indicator */}
                    {heldTransactions.length > 0 && (
                      <button
                        className="w-full flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800"
                        onClick={() => setHoldTransactionOpen(true)}
                      >
                        <div className="flex items-center gap-2">
                          <Pause className="h-4 w-4" />
                          <span className="text-sm font-medium">{heldTransactions.length} held sale{heldTransactions.length > 1 ? 's' : ''}</span>
                        </div>
                        <Play className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <CartItemWithActions
                        key={item.id}
                        item={item}
                        onUpdateQuantity={updateQuantity}
                        onRemove={removeFromCart}
                        onPriceOverride={(item) => {
                          setSelectedItemForEdit(item)
                          setPriceOverrideOpen(true)
                        }}
                        onItemDiscount={(item) => {
                          setSelectedItemForEdit(item)
                          setItemDiscountOpen(true)
                        }}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Cart Summary */}
              <div className="p-4 border-t border-gray-200 space-y-3">
                {/* Customer Info */}
                {selectedCustomer && (
                  <div className="p-3 bg-[#E0F2F1] rounded-lg space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[#00897B]">
                        <User className="h-4 w-4" />
                        <span className="text-xs font-semibold">{selectedCustomer.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0"
                        onClick={() => setSelectedCustomer(null)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    {selectedCustomer.loyaltyPoints !== undefined && selectedCustomer.loyaltyPoints > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-amber-500" />
                        <span className="text-xs text-amber-600">{selectedCustomer.loyaltyPoints} points</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Booking Customer Info */}
                {bookingData && (
                  <div className="p-3 bg-[#E0F2F1] rounded-lg space-y-1">
                    <div className="flex items-center gap-2 text-[#00897B]">
                      <Calendar className="h-4 w-4" />
                      <span className="text-xs font-semibold">Booking Sale</span>
                    </div>
                    <p className="text-sm font-medium text-[#1A1A1A]">{bookingData.customerName}</p>
                    {bookingData.customerPhone && (
                      <p className="text-xs text-[#757575]">{bookingData.customerPhone}</p>
                    )}
                    {bookingData.depositPaid && bookingData.depositAmount && (
                      <div className="flex items-center gap-1 mt-1">
                        <Badge className="bg-green-100 text-green-700 text-[10px]">
                          Deposit Paid: R{bookingData.depositAmount.toFixed(2)}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setCustomerLookupOpen(true)}
                  >
                    <User className="h-3 w-3 mr-1" />
                    {selectedCustomer ? 'Change' : 'Customer'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setCartDiscountOpen(true)}
                    disabled={cart.length === 0}
                  >
                    <Percent className="h-3 w-3 mr-1" />
                    Discount
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setHoldTransactionOpen(true)}
                    disabled={cart.length === 0}
                  >
                    <Pause className="h-3 w-3 mr-1" />
                    Hold
                  </Button>
                </div>
                
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-[#757575]">
                    <span>Items Subtotal</span>
                    <span>R{itemsSubtotal.toFixed(2)}</span>
                  </div>
                  {cartDiscountAmount > 0 && (
                    <div className="flex justify-between text-red-500">
                      <span>Cart Discount</span>
                      <span>-R{cartDiscountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#757575]">
                    <span>Subtotal</span>
                    <span>R{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#757575]">
                    <span>VAT (15%)</span>
                    <span>R{vat.toFixed(2)}</span>
                  </div>
                  {bookingData?.depositPaid && bookingData?.depositAmount && (
                    <>
                      <Separator />
                      <div className="flex justify-between text-green-600">
                        <span>Deposit Deduction</span>
                        <span>-R{bookingData.depositAmount.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-[#1A1A1A]">
                    <span>Total</span>
                    <span>R{(bookingData?.depositPaid && bookingData?.depositAmount 
                      ? total - bookingData.depositAmount 
                      : total).toFixed(2)}</span>
                  </div>
                </div>
                
                {/* Payment Buttons */}
                <div className="space-y-2">
                  <Button 
                    className="w-full bg-[#00897B] hover:bg-[#00695C] text-white font-semibold"
                    disabled={cart.length === 0}
                    onClick={handleCheckout}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay R{(bookingData?.depositPaid && bookingData?.depositAmount 
                      ? total - bookingData.depositAmount 
                      : total).toFixed(2)}
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full"
                    disabled={cart.length === 0}
                    onClick={() => setSplitPaymentOpen(true)}
                  >
                    <ArrowRightLeft className="mr-2 h-4 w-4" />
                    Split Payment
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        )
    }
  }

  // Mobile Bottom Tab Bar data
  const mobileTabs = [
    { id: 'dashboard', icon: Home, label: 'Home' },
    { id: 'pos', icon: Store, label: 'POS', badge: cart.length },
    { id: 'orders', icon: Receipt, label: 'Orders' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'more', icon: MoreHorizontal, label: 'More' },
  ]



  // ========== RENDER ==========
  return (
    <div className={`min-h-screen flex bg-[#FAFAFA] ${isMobile ? 'pb-16' : ''}`}>
      {/* Global Offline Banner */}
      {!offlineMode.isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white text-center py-2 text-sm font-medium z-[100] flex items-center justify-center gap-2">
          <WifiOff className="h-4 w-4" />
          <span>You're offline - Transactions will be saved locally</span>
          {offlineMode.metrics.pendingSync > 0 && (
            <Badge className="bg-white/20 text-white ml-2">
              {offlineMode.metrics.pendingSync} pending
            </Badge>
          )}
        </div>
      )}
      
      {/* Mobile Layout */}
      {isMobile && (
        <>
          {/* Main Content - Full Screen */}
          <main className={`flex-1 flex flex-col min-w-0 ${!offlineMode.isOnline ? 'mt-9' : ''}`}>
            {/* Top Bar */}
            <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-30">
              <div className="flex items-center justify-between">
                <h1 className="text-base font-semibold text-[#1A1A1A]">
                  {currentView === 'dashboard' ? 'Dashboard' : 
                   currentView === 'pos' ? 'POS' :
                   currentView === 'orders' ? 'Orders' : subVertical.name}
                </h1>
                <div className="flex items-center gap-2">
                  {/* Offline Status */}
                  <OfflineStatusBadge />
                  {/* Mobile App Mode Toggle */}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setMobileAppMode(!mobileAppMode)}
                    className="text-xs"
                  >
                    <Smartphone className="h-4 w-4 mr-1" />
                    {mobileAppMode ? 'Exit' : 'App Mode'}
                  </Button>
                </div>
              </div>
            </header>
            
            {/* Content */}
            {currentView === 'orders' ? (
              <div className="flex-1 overflow-auto p-4">
                <MobileOrdersView 
                  orders={[
                    { id: '1', orderNumber: 'ORD-001', customerName: 'John D.', items: 3, total: 250, status: 'pending', createdAt: new Date().toISOString() },
                    { id: '2', orderNumber: 'ORD-002', customerName: 'Sarah M.', items: 2, total: 180, status: 'preparing', createdAt: new Date().toISOString() },
                    { id: '3', orderNumber: 'ORD-003', items: 1, total: 95, status: 'ready', createdAt: new Date().toISOString() },
                  ]}
                  onViewOrder={(id) => {}}
                />
              </div>
            ) : currentView === 'pos' ? (
              <div className="flex-1 flex flex-col p-4">
                {/* Category Pills */}
                <ScrollArea className="w-full mb-4">
                  <div className="flex gap-2 pb-2">
                    {categories.map((category) => (
                      <Button
                        key={category}
                        variant={activeCategory === category ? 'default' : 'outline'}
                        size="sm"
                        className={`text-xs ${
                          activeCategory === category 
                            ? 'bg-[#00897B] hover:bg-[#00695C]' 
                            : 'border-gray-200'
                        }`}
                        onClick={() => setActiveCategory(category)}
                      >
                        {category === 'all' ? 'All' : category}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
                
                {/* Product Grid */}
                <ScrollArea className="flex-1">
                  <div className="grid grid-cols-2 gap-3">
                    {filteredSKUs.map((sku, index) => (
                      <button
                        key={index}
                        onClick={() => addToCart(sku)}
                        className="bg-white rounded-lg border border-gray-200 p-4 text-center active:bg-gray-50"
                      >
                        <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-[#E0F2F1] text-[#00897B] flex items-center justify-center">
                          <sku.icon className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-medium text-[#1A1A1A] mb-1 line-clamp-2">{sku.name}</p>
                        <p className="text-base font-bold text-[#00897B]">R{sku.price.toFixed(2)}</p>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              renderMainContent()
            )}
            
            {/* Floating Cart Button for Mobile */}
            {cart.length > 0 && currentView === 'pos' && (
              <button
                onClick={() => setMobileCartOpen(true)}
                className="fixed bottom-20 right-4 bg-[#00897B] text-white rounded-full shadow-lg flex items-center gap-3 pl-4 pr-2 py-2 z-40 active:bg-[#00695C]"
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="font-medium">{cart.length}</span>
                <div className="bg-white/20 rounded-full px-3 py-1">
                  <span className="font-bold">R{total.toFixed(0)}</span>
                </div>
              </button>
            )}
          </main>
          
          {/* Bottom Navigation */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
            <div className="grid grid-cols-5 h-16">
              {mobileTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === 'search') {
                      setMobileSearchOpen(true)
                    } else if (tab.id === 'more') {
                      setMobileMoreOpen(true)
                    } else {
                      setCurrentView(tab.id as ViewType)
                    }
                  }}
                  className={`flex flex-col items-center justify-center gap-1 relative transition-colors ${
                    currentView === tab.id 
                      ? 'text-[#00897B]' 
                      : 'text-gray-500 active:bg-gray-100'
                  }`}
                >
                  <div className="relative">
                    <tab.icon className="h-5 w-5" />
                    {'badge' in tab && tab.badge && tab.badge > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center px-1">
                        {tab.badge > 99 ? '99+' : tab.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Mobile Cart Overlay */}
          <Dialog open={mobileCartOpen} onOpenChange={setMobileCartOpen}>
            <DialogContent className="sm:hidden h-[90vh] p-0 flex flex-col max-w-full">
              <DialogHeader className="sr-only">
                <DialogTitle>Shopping Cart</DialogTitle>
              </DialogHeader>
              <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-[#00897B]" />
                  <span className="font-semibold">Current Sale</span>
                  {cart.length > 0 && (
                    <Badge variant="secondary">{cart.length} items</Badge>
                  )}
                </div>
                <button onClick={() => setMobileCartOpen(false)} className="p-2 -mr-2">
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <ScrollArea className="flex-1 p-4">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 font-medium">Cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-medium text-[#1A1A1A]">{item.name}</p>
                            <p className="text-sm text-gray-500">R{item.price.toFixed(2)} each</p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 active:bg-gray-100"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="text-lg font-semibold w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 active:bg-gray-100"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          <span className="text-lg font-bold text-[#00897B]">
                            R{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              <div className="p-4 border-t border-gray-200 bg-white space-y-3">
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span>
                    <span>R{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>VAT (15%)</span>
                    <span>R{vat.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg text-[#1A1A1A]">
                    <span>Total</span>
                    <span className="text-[#00897B]">R{total.toFixed(2)}</span>
                  </div>
                </div>
                <Button
                  className="w-full h-14 bg-[#00897B] hover:bg-[#00695C] text-lg font-semibold"
                  disabled={cart.length === 0}
                  onClick={() => {
                    setMobileCartOpen(false)
                    setCheckoutOpen(true)
                  }}
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Pay R{total.toFixed(2)}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Mobile Search Overlay */}
          <Dialog open={mobileSearchOpen} onOpenChange={setMobileSearchOpen}>
            <DialogContent className="sm:hidden h-[90vh] p-0 flex flex-col max-w-full">
              <DialogHeader className="sr-only">
                <DialogTitle>Search Products</DialogTitle>
              </DialogHeader>
              <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                <button onClick={() => setMobileSearchOpen(false)} className="p-2 -ml-2">
                  <ArrowLeft className="h-5 w-5 text-gray-500" />
                </button>
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="flex-1 h-12 text-base"
                  autoFocus
                />
              </div>
              <ScrollArea className="flex-1">
                {searchQuery && filteredSKUs.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">No results found</p>
                  </div>
                ) : searchQuery ? (
                  <div className="p-4 space-y-2">
                    {filteredSKUs.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          addToCart(item)
                          setSearchQuery('')
                          setMobileSearchOpen(false)
                        }}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg active:bg-gray-100"
                      >
                        <div>
                          <p className="font-medium text-[#1A1A1A]">{item.name}</p>
                          <p className="text-sm text-gray-500">{item.category}</p>
                        </div>
                        <span className="font-bold text-[#00897B]">R{item.price.toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">Search products</p>
                  </div>
                )}
              </ScrollArea>
            </DialogContent>
          </Dialog>

          {/* Mobile More Menu */}
          <Sheet open={mobileMoreOpen} onOpenChange={setMobileMoreOpen}>
            <SheetContent side="bottom" className="h-[80vh] p-0">
              <SheetHeader className="p-4 border-b border-gray-200">
                <SheetTitle className="text-left">All Menu</SheetTitle>
              </SheetHeader>
              <ScrollArea className="flex-1 p-4">
                {navCategories.map((category) => (
                  <div key={category.name} className="mb-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
                      {category.name}
                    </p>
                    <div className="space-y-1">
                      {category.items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setCurrentView(item.id)
                            setMobileMoreOpen(false)
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
                            currentView === item.id 
                              ? 'bg-[#E0F2F1] text-[#00897B]' 
                              : 'text-gray-700 active:bg-gray-100'
                          }`}
                        >
                          <item.icon className="h-5 w-5" />
                          <span className="font-medium">{item.label}</span>
                          {currentView === item.id && (
                            <CheckCircle2 className="h-4 w-4 ml-auto text-[#00897B]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </>
      )}
      
      {/* Tablet Layout */}
      {isTablet && !isMobile && (
        <>
          {/* Icon-only sidebar */}
          <aside className={`w-16 bg-white border-r border-gray-200 flex flex-col ${!offlineMode.isOnline ? 'mt-9' : ''}`}>
            <div className="p-3 border-b border-gray-200 flex justify-center">
              <img src="/groway-logo.png" alt="Groway" className="h-7 w-auto" />
            </div>
            <ScrollArea className="flex-1">
              <nav className="p-2 space-y-1">
                {navCategories.flatMap(c => c.items).slice(0, 10).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`w-full flex items-center justify-center p-3 rounded-lg transition-colors ${
                      currentView === item.id 
                        ? 'bg-[#E0F2F1] text-[#00897B]' 
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                    title={item.label}
                  >
                    <item.icon className="h-5 w-5" />
                  </button>
                ))}
              </nav>
            </ScrollArea>
            <div className="p-2 border-t border-gray-200">
              <button
                onClick={() => setMobileMoreOpen(true)}
                className="w-full flex items-center justify-center p-3 rounded-lg text-gray-500 hover:bg-gray-100"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>
          </aside>
          
          <main className="flex-1 flex flex-col min-w-0">
            <header className="bg-white border-b border-gray-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <h1 className="text-sm font-semibold text-[#1A1A1A]">{subVertical.name}</h1>
                <div className="flex items-center gap-2">
                  <OfflineStatusBadge />
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Bell className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </header>
            {renderMainContent()}
          </main>
          
          {/* Mobile More Menu for Tablet */}
          <Sheet open={mobileMoreOpen} onOpenChange={setMobileMoreOpen}>
            <SheetContent side="bottom" className="h-[80vh] p-0">
              <SheetHeader className="p-4 border-b border-gray-200">
                <SheetTitle className="text-left">All Menu</SheetTitle>
              </SheetHeader>
              <ScrollArea className="flex-1 p-4">
                {navCategories.map((category) => (
                  <div key={category.name} className="mb-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
                      {category.name}
                    </p>
                    <div className="space-y-1">
                      {category.items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setCurrentView(item.id)
                            setMobileMoreOpen(false)
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
                            currentView === item.id 
                              ? 'bg-[#E0F2F1] text-[#00897B]' 
                              : 'text-gray-700 active:bg-gray-100'
                          }`}
                        >
                          <item.icon className="h-5 w-5" />
                          <span className="font-medium">{item.label}</span>
                          {currentView === item.id && (
                            <CheckCircle2 className="h-4 w-4 ml-auto text-[#00897B]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </>
      )}
      
      {/* Desktop Layout - Original */}
      {isDesktop && (
        <>
          {/* Left Sidebar */}
          <aside className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${!offlineMode.isOnline ? 'mt-9' : ''}`}>
            {/* Logo */}
            <div className="p-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <img src="/groway-logo.png" alt="Groway" className="h-7 w-auto" />
                {!sidebarCollapsed && (
                  <Badge variant="outline" className="text-[9px] border-[#00897B]/30 text-[#00897B]">
                    POS
                  </Badge>
                )}
              </div>
            </div>

        {/* Navigation with Categories */}
        <ScrollArea className="flex-1">
          <nav className="p-2">
            {navCategories.map((category) => (
              <div key={category.name} className="mb-2">
                {!sidebarCollapsed && (
                  <p className="text-[10px] font-semibold text-[#9E9E9E] px-3 py-1 uppercase tracking-wide">
                    {category.name}
                  </p>
                )}
                <div className="space-y-0.5">
                  {category.items.map((item) => (
                    <button
                      key={item.id}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                        currentView === item.id 
                          ? 'bg-[#E0F2F1] text-[#00897B] font-medium' 
                          : 'text-[#757575] hover:bg-gray-100'
                      }`}
                      onClick={() => setCurrentView(item.id)}
                    >
                      <item.icon className="h-4 w-4" />
                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* VAS Tiles */}
        {!sidebarCollapsed && (
          <div className="p-2 border-t border-gray-200">
            <p className="text-[10px] font-medium text-[#757575] mb-2">Quick Actions</p>
            <div className="space-y-1">
              {vasTiles.slice(0, 4).map((tile, index) => {
                // Map VAS tile names to their corresponding views
                const getTileAction = (tileName: string): { view?: ViewType; action?: () => void } => {
                  const tileLower = tileName.toLowerCase()
                  
                  if (tileLower.includes('gopay') || tileLower.includes('payment')) {
                    return { view: 'payments' }
                  } else if (tileLower.includes('grosupply') || tileLower.includes('supply')) {
                    return { view: 'grosupply' }
                  } else if (tileLower.includes('grocredit') || tileLower.includes('credit')) {
                    return { view: 'grocredit' }
                  } else if (tileLower.includes('qr') || tileLower.includes('menu')) {
                    return { view: 'qrmenu' }
                  } else if (tileLower.includes('booking') || tileLower.includes('appointment')) {
                    return { view: 'booking' }
                  } else if (tileLower.includes('loyalty') || tileLower.includes('crm')) {
                    return { view: 'crm' }
                  } else if (tileLower.includes('gift') || tileLower.includes('voucher')) {
                    return { view: 'giftcards' }
                  } else if (tileLower.includes('market') || tileLower.includes('store')) {
                    return { view: 'gromarket' }
                  } else if (tileLower.includes('hardware') || tileLower.includes('terminal')) {
                    return { view: 'hardware' }
                  } else if (tileLower.includes('airtime') || tileLower.includes('utility')) {
                    return { view: 'payments' }
                  } else if (tileLower.includes('geo') || tileLower.includes('discovery')) {
                    return { view: 'marketing' }
                  } else if (tileLower.includes('staff') || tileLower.includes('training')) {
                    return { view: 'staff' }
                  } else if (tileLower.includes('inventory') || tileLower.includes('stock')) {
                    return { view: 'inventory' }
                  } else if (tileLower.includes('multi') || tileLower.includes('location')) {
                    return { view: 'multilocation' }
                  }
                  return { view: 'dashboard' }
                }
                
                const tileAction = getTileAction(tile)
                
                return (
                  <button
                    key={index}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-[#757575] hover:bg-gray-100 hover:text-[#00897B] transition-colors"
                    onClick={() => {
                      if (tileAction.view) {
                        setCurrentView(tileAction.view)
                      } else if (tileAction.action) {
                        tileAction.action()
                      }
                    }}
                  >
                    <Zap className="h-3 w-3" />
                    <span className="truncate">{tile}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Back & Collapse */}
        <div className="border-t border-gray-200">
          <button
            className="w-full p-2 text-[#757575] hover:bg-gray-100 flex items-center gap-2 px-3"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
            {!sidebarCollapsed && <span className="text-sm">Back to Setup</span>}
          </button>
          <button
            className="w-full p-2 text-[#757575] hover:bg-gray-100"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <ChevronLeft className={`h-4 w-4 mx-auto transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-sm font-semibold text-[#1A1A1A]">{subVertical.name}</h1>
                <p className="text-[10px] text-[#757575]">{vertical.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-[#E0F2F1] text-[#00897B]">
                <Clock className="h-3 w-3 mr-1" />
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Badge>
              {/* Offline Indicator */}
              <OfflineStatusBadge />
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Bell className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setCurrentView('settings')}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => {
                  // Clear session
                  localStorage.removeItem('groway_session')
                  document.cookie = 'groway_session=; path=/; max-age=0'
                  // Redirect to login
                  window.location.href = '/merchant-os/login'
                }}
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        {renderMainContent()}
      </main>

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Payment Method</DialogTitle>
            <DialogDescription>
              Choose how the customer will pay R{total.toFixed(2)}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            {[
              { id: 'cash', icon: Banknote, label: 'Cash' },
              { id: 'card', icon: CreditCard, label: 'Card' },
              { id: 'qr', icon: QrCode, label: 'QR Pay' },
              { id: 'wallet', icon: Wallet, label: 'Wallet' },
            ].map((method) => (
              <button
                key={method.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedPayment === method.id 
                    ? 'border-[#00897B] bg-[#E0F2F1]' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedPayment(method.id)}
              >
                <method.icon className={`h-6 w-6 mx-auto mb-2 ${
                  selectedPayment === method.id ? 'text-[#00897B]' : 'text-gray-500'
                }`} />
                <p className={`text-sm font-medium ${
                  selectedPayment === method.id ? 'text-[#00897B]' : 'text-[#1A1A1A]'
                }`}>{method.label}</p>
              </button>
            ))}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCheckoutOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-[#00897B] hover:bg-[#00695C]"
              disabled={!selectedPayment}
              onClick={completeSale}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Complete Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={saleComplete} onOpenChange={setSaleComplete}>
        <DialogContent className="sm:max-w-sm text-center">
          <VisuallyHidden>
            <DialogTitle>Payment Successful</DialogTitle>
          </VisuallyHidden>
          <div className="py-6">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${offlineTransactionSaved ? 'bg-amber-100' : 'bg-green-100'}`}>
              {offlineTransactionSaved ? (
                <WifiOff className="h-8 w-8 text-amber-600" />
              ) : (
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              )}
            </div>
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">
              {offlineTransactionSaved ? 'Saved Offline!' : 'Payment Successful!'}
            </h2>
            <p className="text-[#757575] mb-2">
              R{total.toFixed(2)} received via {selectedPayment}
            </p>
            {offlineTransactionSaved && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-amber-700">
                  Transaction saved locally. It will sync automatically when connection is restored.
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  {offlineMode.metrics.pendingSync} transaction(s) pending sync
                </p>
              </div>
            )}
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={() => setReceiptPreviewOpen(true)}>
                <Printer className="h-4 w-4 mr-2" />
                Print Receipt
              </Button>
              <Button
                size="sm"
                className="bg-[#00897B] hover:bg-[#00695C]"
                onClick={() => setSaleComplete(false)}
              >
                New Sale
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Price Override Dialog */}
      <PriceOverrideDialog
        open={priceOverrideOpen}
        onOpenChange={setPriceOverrideOpen}
        item={selectedItemForEdit}
        onApply={handlePriceOverride}
      />

      {/* Item Discount Dialog */}
      <DiscountDialog
        open={itemDiscountOpen}
        onOpenChange={setItemDiscountOpen}
        mode="item"
        item={selectedItemForEdit}
        onApply={handleItemDiscount}
      />

      {/* Cart Discount Dialog */}
      <DiscountDialog
        open={cartDiscountOpen}
        onOpenChange={setCartDiscountOpen}
        mode="cart"
        cartTotal={itemsSubtotal}
        onApply={handleCartDiscount}
      />

      {/* Split Payment Dialog */}
      <SplitPaymentDialog
        open={splitPaymentOpen}
        onOpenChange={setSplitPaymentOpen}
        total={total}
        onComplete={handleSplitPaymentComplete}
      />

      {/* Customer Lookup Dialog */}
      <CustomerLookupDialog
        open={customerLookupOpen}
        onOpenChange={setCustomerLookupOpen}
        onSelect={(customer) => {
          setSelectedCustomer(customer)
          setCustomerLookupOpen(false)
        }}
      />

      {/* Hold Transaction Dialog */}
      <HoldTransactionDialog
        open={holdTransactionOpen}
        onOpenChange={setHoldTransactionOpen}
        heldTransactions={heldTransactions}
        onHold={handleHoldTransaction}
        onResume={handleResumeTransaction}
        onDelete={handleDeleteHeldTransaction}
        hasItems={cart.length > 0}
      />

      {/* Receipt Preview Dialog */}
      <ReceiptPreview
        open={receiptPreviewOpen}
        onOpenChange={setReceiptPreviewOpen}
        transaction={completedTransaction}
        onPrint={() => {
          // In production, this would trigger actual printing
          console.log('Printing receipt...')
          setReceiptPreviewOpen(false)
        }}
        onEmail={(email) => {
          // In production, this would send email
          console.log('Emailing receipt to:', email)
          setReceiptPreviewOpen(false)
        }}
        onSms={(phone) => {
          // In production, this would send SMS
          console.log('SMSing receipt to:', phone)
          setReceiptPreviewOpen(false)
        }}
      />

      {/* Void/Refund Dialog */}
      <VoidRefundDialog
        open={voidRefundOpen}
        onOpenChange={setVoidRefundOpen}
        mode={voidRefundMode}
        transaction={completedTransaction}
        onConfirm={(reason, refundMethod) => {
          // In production, this would process void/refund
          console.log('Processing', voidRefundMode, 'with reason:', reason, 'method:', refundMethod)
          setVoidRefundOpen(false)
        }}
      />
    </>
      )}
    </div>
  )
}
