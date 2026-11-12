'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  Truck,
  LayoutDashboard,
  FileText,
  Package,
  Receipt,
  Wallet,
  BarChart3,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  Building2,
  MessageSquare,
  BookOpen,
  DollarSign,
  Brain
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'

// Supplier Auth Context
interface SupplierUser {
  id: string
  name: string
  email: string
  companyName: string
  tier: string
  verificationStatus: string
}

interface SupplierAuthContextType {
  supplier: SupplierUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const SupplierAuthContext = createContext<SupplierAuthContextType>({
  supplier: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => false,
  logout: () => {},
})

export const useSupplierAuth = () => useContext(SupplierAuthContext)

// Navigation Items
const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/grosupply/supplier/portal' },
  { id: 'groai', label: 'GroAI', icon: Brain, href: '/grosupply/supplier/portal/groai' },
  { id: 'orders', label: 'Orders', icon: Package, href: '/grosupply/supplier/portal/orders', badge: 3 },
  { id: 'rfqs', label: 'RFQs', icon: FileText, href: '/grosupply/supplier/portal/rfqs', badge: 5 },
  { id: 'invoices', label: 'Invoices', icon: Receipt, href: '/grosupply/supplier/portal/invoices' },
  { id: 'products', label: 'Products', icon: BarChart3, href: '/grosupply/supplier/portal/products' },
  { id: 'pricing', label: 'Pricing', icon: DollarSign, href: '/grosupply/supplier/portal/pricing' },
  { id: 'catalogs', label: 'Catalogs', icon: BookOpen, href: '/grosupply/supplier/portal/catalogs' },
  { id: 'settlements', label: 'Settlements', icon: Wallet, href: '/grosupply/supplier/portal/settlements' },
  { id: 'disputes', label: 'Disputes', icon: MessageSquare, href: '/grosupply/supplier/portal/disputes' },
  { id: 'profile', label: 'Profile', icon: Settings, href: '/grosupply/supplier/portal/profile' },
]

export default function SupplierPortalLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [supplier, setSupplier] = useState<SupplierUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const sessionStr = localStorage.getItem('grosupply_supplier_session')
        if (sessionStr) {
          const session = JSON.parse(sessionStr)
          if (session.expiresAt > Date.now()) {
            setSupplier(session.supplier)
          } else {
            localStorage.removeItem('grosupply_supplier_session')
            router.push('/grosupply/supplier/login')
          }
        } else {
          // For demo purposes, auto-login with demo supplier
          const demoSupplier: SupplierUser = {
            id: 'sup_demo_001',
            name: 'Demo Supplier',
            email: 'supplier@grosupply.co.za',
            companyName: 'Demo Wholesale SA',
            tier: 'gold',
            verificationStatus: 'verified'
          }
          setSupplier(demoSupplier)
          localStorage.setItem('grosupply_supplier_session', JSON.stringify({
            supplier: demoSupplier,
            expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
          }))
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      } finally {
        setIsLoading(false)
      }
    }
    checkAuth()
  }, [router])

  const logout = () => {
    localStorage.removeItem('grosupply_supplier_session')
    setSupplier(null)
    router.push('/grosupply/supplier/login')
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    // Demo login - in production this would call an API
    const demoSupplier: SupplierUser = {
      id: 'sup_demo_001',
      name: email.split('@')[0],
      email,
      companyName: 'Demo Supplier',
      tier: 'gold',
      verificationStatus: 'verified'
    }
    setSupplier(demoSupplier)
    localStorage.setItem('grosupply_supplier_session', JSON.stringify({
      supplier: demoSupplier,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000
    }))
    return true
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-[#00897B] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-[#757575]">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <SupplierAuthContext.Provider value={{ supplier, isAuthenticated: !!supplier, isLoading, login, logout }}>
      <div className="min-h-screen flex bg-[#FAFAFA]">
        {/* Desktop Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} hidden lg:flex flex-col bg-white border-r border-gray-200 transition-all duration-300`}>
          {/* Logo */}
          <div className="p-4 border-b border-gray-200">
            <Link href="/grosupply" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#00897B] flex items-center justify-center">
                <Truck className="h-4 w-4 text-white" />
              </div>
              {sidebarOpen && (
                <div>
                  <span className="text-sm font-bold text-[#1A1A1A]">GroSupply</span>
                  <Badge variant="outline" className="ml-2 text-[10px] border-[#00897B]/30 text-[#00897B]">Supplier</Badge>
                </div>
              )}
            </Link>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 p-3">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/grosupply/supplier/portal' && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                      isActive
                        ? 'bg-[#E0F2F1] text-[#00897B] font-medium'
                        : 'text-[#757575] hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {sidebarOpen && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0.5">
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </Link>
                )
              })}
            </nav>
          </ScrollArea>

          {/* User Info & Logout */}
          {sidebarOpen && supplier && (
            <div className="p-3 border-t border-gray-200">
              <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg mb-2">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-[#00897B] text-white">
                    {supplier.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1A1A1A] truncate">{supplier.name}</p>
                  <p className="text-xs text-[#757575] truncate">{supplier.companyName}</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                size="sm"
                onClick={logout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          )}

          {/* Collapse Toggle */}
          <button
            className="p-3 border-t border-gray-200 hover:bg-gray-50"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <div className={`flex items-center justify-center transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`}>
              <svg className="h-4 w-4 text-[#757575]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </div>
          </button>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header */}
          <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 lg:px-6">
            <div className="flex items-center justify-between">
              {/* Mobile Menu Button */}
              <button
                className="lg:hidden p-2 -ml-2"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5 text-[#757575]" />
              </button>

              {/* Page Title - Mobile */}
              <h1 className="lg:hidden text-base font-semibold text-[#1A1A1A]">
                {navItems.find(item => pathname === item.href || (item.href !== '/grosupply/supplier/portal' && pathname.startsWith(item.href)))?.label || 'Dashboard'}
              </h1>

              {/* Desktop Title */}
              <div className="hidden lg:block">
                <h1 className="text-lg font-semibold text-[#1A1A1A]">
                  {navItems.find(item => pathname === item.href || (item.href !== '/grosupply/supplier/portal' && pathname.startsWith(item.href)))?.label || 'Dashboard'}
                </h1>
                <p className="text-xs text-[#757575] mt-0.5">
                  {supplier?.companyName} • {supplier?.tier.charAt(0).toUpperCase() + supplier?.tier.slice(1)} Tier
                </p>
              </div>

              {/* Right Actions */}
              <div className="flex items-center gap-2">
                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5 text-[#757575]" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                </Button>

                {/* User Avatar - Desktop */}
                {supplier && (
                  <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-gray-200">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-[#00897B] text-white text-xs">
                        {supplier.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-auto p-4 lg:p-6">
            {children}
          </main>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-72 bg-white flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <Link href="/grosupply" className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#00897B] flex items-center justify-center">
                    <Truck className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-lg font-bold text-[#1A1A1A]">GroSupply</span>
                </Link>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X className="h-5 w-5 text-[#757575]" />
                </button>
              </div>

              {/* Navigation */}
              <ScrollArea className="flex-1 p-3">
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/grosupply/supplier/portal' && pathname.startsWith(item.href))
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
                          isActive
                            ? 'bg-[#E0F2F1] text-[#00897B] font-medium'
                            : 'text-[#757575]'
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0.5">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    )
                  })}
                </nav>
              </ScrollArea>

              {/* User Info */}
              {supplier && (
                <div className="p-3 border-t border-gray-200">
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg mb-2">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-[#00897B] text-white">
                        {supplier.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A1A1A] truncate">{supplier.name}</p>
                      <p className="text-xs text-[#757575] truncate">{supplier.companyName}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    size="sm"
                    onClick={() => {
                      logout()
                      setMobileMenuOpen(false)
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </SupplierAuthContext.Provider>
  )
}
