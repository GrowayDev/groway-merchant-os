'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Home,
  Store,
  Receipt,
  Search,
  MoreHorizontal,
  ShoppingCart,
  Users,
  Clock,
  Bell,
  Settings,
  ChevronLeft,
  Menu,
  X,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  QrCode,
  Wallet,
  CheckCircle2,
  DollarSign,
  Package,
  MapPin,
  ChefHat,
  Calendar,
  Building2,
  Gift,
  Megaphone,
  UserCog,
  Calculator,
  Route,
  GraduationCap,
  Globe,
  Wifi,
  Printer,
  ShieldCheck,
  Hotel,
  Utensils,
  Smartphone,
  LucideIcon,
  ArrowLeft,
  Grid,
  List,
  LayoutGrid,
  Layers,
  ArrowUp,
  ChevronUp,
  LucideProps,
} from 'lucide-react'

// ============================================
// CONTEXT & TYPES
// ============================================

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

// ============================================
// RESPONSIVE PROVIDER
// ============================================

export function ResponsiveProvider({ children }: { children: React.ReactNode }) {
  const [screenWidth, setScreenWidth] = useState(1024)
  const [mobileAppMode, setMobileAppMode] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth)
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = screenWidth < 640
  const isTablet = screenWidth >= 640 && screenWidth < 1024
  const isDesktop = screenWidth >= 1024

  return (
    <ResponsiveContext.Provider value={{ 
      isMobile, 
      isTablet, 
      isDesktop, 
      screenWidth,
      mobileAppMode,
      setMobileAppMode 
    }}>
      {children}
    </ResponsiveContext.Provider>
  )
}

// ============================================
// MOBILE BOTTOM TAB BAR
// ============================================

interface MobileTabItem {
  id: string
  icon: LucideIcon
  label: string
  badge?: number
}

interface MobileBottomNavProps {
  currentView: string
  onViewChange: (view: string) => void
  cartCount?: number
  orderCount?: number
}

export function MobileBottomNav({ 
  currentView, 
  onViewChange, 
  cartCount = 0,
  orderCount = 0 
}: MobileBottomNavProps) {
  const tabs: MobileTabItem[] = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'pos', icon: Store, label: 'POS', badge: cartCount },
    { id: 'orders', icon: Receipt, label: 'Orders', badge: orderCount },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'more', icon: MoreHorizontal, label: 'More' },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
      <div className="grid grid-cols-5 h-16">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onViewChange(tab.id)}
            className={`flex flex-col items-center justify-center gap-1 relative transition-colors ${
              currentView === tab.id 
                ? 'text-[#00897B]' 
                : 'text-gray-500 active:bg-gray-100'
            }`}
          >
            <div className="relative">
              <tab.icon className="h-5 w-5" />
              {tab.badge && tab.badge > 0 && (
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
  )
}

// ============================================
// MOBILE CART OVERLAY
// ============================================

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  category?: string
}

interface MobileCartOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: CartItem[]
  onUpdateQuantity: (id: string, delta: number) => void
  onRemove: (id: string) => void
  onCheckout: () => void
  subtotal: number
  vat: number
  total: number
  onQuickCharge?: (amount: number) => void
}

export function MobileCartOverlay({
  open,
  onOpenChange,
  items,
  onUpdateQuantity,
  onRemove,
  onCheckout,
  subtotal,
  vat,
  total,
  onQuickCharge,
}: MobileCartOverlayProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:hidden h-[90vh] p-0 flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>Shopping Cart</DialogTitle>
        </DialogHeader>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-[#00897B]" />
            <span className="font-semibold">Current Sale</span>
            {items.length > 0 && (
              <Badge variant="secondary">{items.length} items</Badge>
            )}
          </div>
          <button onClick={() => onOpenChange(false)} className="p-2 -mr-2">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Quick Charge - When Empty */}
        {items.length === 0 && (
          <div className="p-4 border-b border-gray-200">
            <p className="text-xs font-medium text-gray-500 mb-3">Quick Charge</p>
            <div className="grid grid-cols-4 gap-2">
              {[50, 100, 200, 500].map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  className="h-12 text-sm font-medium hover:bg-[#E0F2F1] hover:text-[#00897B] hover:border-[#00897B] transition-colors"
                  onClick={() => onQuickCharge?.(amount)}
                >
                  R{amount}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Cart Items */}
        <ScrollArea className="flex-1 p-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 font-medium">Cart is empty</p>
              <p className="text-sm text-gray-400 mt-1">Add items from the menu</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-[#1A1A1A]">{item.name}</p>
                      <p className="text-sm text-gray-500">R{item.price.toFixed(2)} each</p>
                    </div>
                    <button
                      onClick={() => onRemove(item.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 active:bg-gray-100"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="text-lg font-semibold w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, 1)}
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

        {/* Footer with Totals */}
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
            disabled={items.length === 0}
            onClick={onCheckout}
          >
            <CreditCard className="h-5 w-5 mr-2" />
            Pay R{total.toFixed(2)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============================================
// MOBILE MORE MENU (Sheet)
// ============================================

interface NavItem {
  id: string
  icon: LucideIcon
  label: string
}

interface MobileMoreMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentView: string
  onViewChange: (view: string) => void
  navCategories: { name: string; items: NavItem[] }[]
}

export function MobileMoreMenu({
  open,
  onOpenChange,
  currentView,
  onViewChange,
  navCategories,
}: MobileMoreMenuProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
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
                      onViewChange(item.id)
                      onOpenChange(false)
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
  )
}

// ============================================
// MOBILE SEARCH OVERLAY
// ============================================

interface MobileSearchOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  results: { id: string; name: string; price: number; category?: string }[]
  onSelect: (item: any) => void
}

export function MobileSearchOverlay({
  open,
  onOpenChange,
  searchQuery,
  onSearchChange,
  results,
  onSelect,
}: MobileSearchOverlayProps) {
  const inputRef = useState<HTMLInputElement | null>(null)

  useEffect(() => {
    if (open) {
      // Focus input when opened
      setTimeout(() => {
        const input = document.getElementById('mobile-search-input')
        input?.focus()
      }, 100)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:hidden h-[90vh] p-0 flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>Search Products</DialogTitle>
        </DialogHeader>
        {/* Search Header */}
        <div className="p-4 border-b border-gray-200 flex items-center gap-3">
          <button onClick={() => onOpenChange(false)} className="p-2 -ml-2">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </button>
          <Input
            id="mobile-search-input"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search products, categories..."
            className="flex-1 h-12 text-base"
          />
        </div>

        {/* Results */}
        <ScrollArea className="flex-1">
          {searchQuery && results.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No results found</p>
              <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
            </div>
          ) : searchQuery ? (
            <div className="p-4 space-y-2">
              {results.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelect(item)
                    onSearchChange('')
                    onOpenChange(false)
                  }}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg active:bg-gray-100"
                >
                  <div>
                    <p className="font-medium text-[#1A1A1A]">{item.name}</p>
                    {item.category && (
                      <p className="text-sm text-gray-500">{item.category}</p>
                    )}
                  </div>
                  <span className="font-bold text-[#00897B]">R{item.price.toFixed(2)}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Search products</p>
              <p className="text-sm text-gray-400 mt-1">Type to search menu items</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

// ============================================
// MOBILE ORDERS VIEW
// ============================================

interface MobileOrdersViewProps {
  orders: {
    id: string
    orderNumber: string
    customerName?: string
    items: number
    total: number
    status: string
    createdAt: string
  }[]
  onViewOrder: (orderId: string) => void
}

export function MobileOrdersView({ orders, onViewOrder }: MobileOrdersViewProps) {
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
    <div className="p-4 space-y-4">
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

// ============================================
// MOBILE FLOATING CART BUTTON
// ============================================

interface MobileFloatingCartButtonProps {
  itemCount: number
  total: number
  onClick: () => void
}

export function MobileFloatingCartButton({ 
  itemCount, 
  total, 
  onClick 
}: MobileFloatingCartButtonProps) {
  if (itemCount === 0) return null

  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 bg-[#00897B] text-white rounded-full shadow-lg flex items-center gap-3 pl-4 pr-2 py-2 z-40 active:bg-[#00695C]"
    >
      <ShoppingCart className="h-5 w-5" />
      <span className="font-medium">{itemCount}</span>
      <div className="bg-white/20 rounded-full px-3 py-1">
        <span className="font-bold">R{total.toFixed(0)}</span>
      </div>
      <ChevronUp className="h-4 w-4" />
    </button>
  )
}

// ============================================
// TABLET SIDEBAR (Icons Only)
// ============================================

interface TabletSidebarProps {
  currentView: string
  onViewChange: (view: string) => void
  navCategories: { name: string; items: NavItem[] }[]
  onExpand: () => void
}

export function TabletSidebar({
  currentView,
  onViewChange,
  navCategories,
  onExpand,
}: TabletSidebarProps) {
  // Flatten items for icon-only view
  const allItems = navCategories.flatMap(cat => cat.items)
  const mainItems = allItems.slice(0, 8) // Show first 8 icons

  return (
    <aside className="w-16 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-3 border-b border-gray-200 flex justify-center">
        <img src="/groway-logo.png" alt="Groway" className="h-7 w-auto" />
      </div>

      {/* Navigation Icons */}
      <ScrollArea className="flex-1">
        <nav className="p-2 space-y-1">
          {mainItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
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

      {/* Expand Button */}
      <div className="p-2 border-t border-gray-200">
        <button
          onClick={onExpand}
          className="w-full flex items-center justify-center p-3 rounded-lg text-gray-500 hover:bg-gray-100"
          title="Expand menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </aside>
  )
}

// ============================================
// RESPONSIVE TOP BAR
// ============================================

interface ResponsiveTopBarProps {
  title: string
  subtitle?: string
  showBack?: boolean
  onBack?: () => void
  actions?: React.ReactNode
  onMenuClick?: () => void
}

export function ResponsiveTopBar({
  title,
  subtitle,
  showBack,
  onBack,
  actions,
  onMenuClick,
}: ResponsiveTopBarProps) {
  const { isMobile, isTablet } = useResponsive()

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mobile/Tablet Menu Button */}
          {(isMobile || isTablet) && !showBack && onMenuClick && (
            <button onClick={onMenuClick} className="p-2 -ml-2 text-gray-500">
              <Menu className="h-5 w-5" />
            </button>
          )}
          
          {/* Back Button */}
          {showBack && onBack && (
            <button onClick={onBack} className="p-2 -ml-2 text-gray-500">
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          
          <div>
            <h1 className="text-base md:text-lg font-semibold text-[#1A1A1A]">{title}</h1>
            {subtitle && (
              <p className="text-xs text-[#757575] hidden sm:block">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Time Badge - Hidden on Mobile */}
          {!isMobile && (
            <Badge variant="secondary" className="bg-[#E0F2F1] text-[#00897B]">
              <Clock className="h-3 w-3 mr-1" />
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Badge>
          )}
          
          {actions}
          
          {/* Settings - Hidden on Mobile (in More menu) */}
          {!isMobile && (
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

// ============================================
// RESPONSIVE PRODUCT GRID
// ============================================

interface ResponsiveProductGridProps {
  products: {
    id: string
    name: string
    price: number
    category?: string
    icon?: LucideIcon
  }[]
  onSelect: (product: any) => void
}

export function ResponsiveProductGrid({ products, onSelect }: ResponsiveProductGridProps) {
  const { isMobile, isTablet } = useResponsive()

  return (
    <div className={`grid gap-3 ${
      isMobile 
        ? 'grid-cols-2' 
        : isTablet 
          ? 'grid-cols-3' 
          : 'grid-cols-4 lg:grid-cols-5'
    }`}>
      {products.map((product, index) => (
        <button
          key={product.id || index}
          onClick={() => onSelect(product)}
          className={`bg-white rounded-lg border border-gray-200 p-3 text-center active:bg-gray-50 transition-colors ${
            isMobile ? 'min-h-[100px]' : 'min-h-[120px]'
          }`}
        >
          {product.icon && (
            <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-[#E0F2F1] text-[#00897B] flex items-center justify-center">
              <product.icon className="h-5 w-5" />
            </div>
          )}
          <p className={`font-medium text-[#1A1A1A] mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            {product.name}
          </p>
          <p className={`font-bold text-[#00897B] ${isMobile ? 'text-sm' : 'text-base'}`}>
            R{product.price.toFixed(2)}
          </p>
        </button>
      ))}
    </div>
  )
}

// ============================================
// DESKTOP SIDEBAR (Full with Categories)
// ============================================

interface DesktopSidebarProps {
  currentView: string
  onViewChange: (view: string) => void
  navCategories: { name: string; items: NavItem[] }[]
  collapsed: boolean
  onToggleCollapse: () => void
  onBack: () => void
}

export function DesktopSidebar({
  currentView,
  onViewChange,
  navCategories,
  collapsed,
  onToggleCollapse,
  onBack,
}: DesktopSidebarProps) {
  return (
    <aside className={`${collapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}>
      {/* Logo */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <img src="/groway-logo.png" alt="Groway" className="h-7 w-auto" />
          {!collapsed && (
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
              {!collapsed && (
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
                    onClick={() => onViewChange(item.id)}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Back & Collapse */}
      <div className="border-t border-gray-200">
        <button
          className="w-full p-2 text-[#757575] hover:bg-gray-100 flex items-center gap-2 px-3"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
          {!collapsed && <span className="text-sm">Back to Setup</span>}
        </button>
        <button
          className="w-full p-2 text-[#757575] hover:bg-gray-100"
          onClick={onToggleCollapse}
        >
          <ChevronLeft className={`h-4 w-4 mx-auto transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </aside>
  )
}

// Export all components
export { useResponsive }
