'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Shield,
  Activity,
  Users,
  FileCheck,
  AlertTriangle,
  Headphones,
  BarChart3,
  Settings,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  LogOut,
  User,
  Clock,
  Building2,
  ScrollText,
  Moon,
  Sun,
  Lock,
  CreditCard,
  Store,
  Smartphone,
  Wallet,
  Briefcase,
  Network,
  Layers,
  Zap,
  Globe
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AdminViewType } from '../page'

interface AdminLayoutProps {
  children: React.ReactNode
  activeView: AdminViewType
  setActiveView: (view: AdminViewType) => void
}

const navigationItems = [
  { id: 'apps', label: 'Application Switcher', icon: Layers, badge: null },
  { id: 'dashboard', label: 'Platform Dashboard', icon: Activity, badge: null },
  { id: 'tenants', label: 'Tenant Management', icon: Building2, badge: null },
  { id: 'merchants', label: 'Merchant Management', icon: Users, badge: '23' },
  { id: 'users', label: 'User Management', icon: User, badge: '156' },
  { id: 'compliance', label: 'Compliance Center', icon: FileCheck, badge: '45' },
  { id: 'fraud', label: 'Fraud Detection', icon: AlertTriangle, badge: '8' },
  { id: 'support', label: 'Support Tools', icon: Headphones, badge: '12' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, badge: null },
  { id: 'audit', label: 'Audit Trail', icon: ScrollText, badge: null },
  { id: 'settings', label: 'Settings', icon: Settings, badge: null },
]

// Application Switcher - All Groway Applications
const applications = [
  {
    id: 'admin-console',
    name: 'Admin Console',
    description: 'Platform management & oversight',
    icon: Shield,
    href: '/admin-console',
    color: '#00897B',
    status: 'active' as const,
  },
  {
    id: 'merchant-os',
    name: 'Merchant OS',
    description: 'POS & business management',
    icon: Store,
    href: '/merchant-os',
    color: '#4CAF50',
    status: 'active' as const,
  },
  {
    id: 'gopay',
    name: 'GoPay',
    description: 'Payment gateway & devices',
    icon: CreditCard,
    href: '/gopay',
    color: '#00897B',
    status: 'active' as const,
  },
  {
    id: 'consumer-wallet',
    name: 'Consumer Wallet',
    description: 'Consumer financial services',
    icon: Wallet,
    href: '/consumer-wallet',
    color: '#FF8F00',
    status: 'active' as const,
  },
  {
    id: 'salesforce',
    name: 'Field Salesforce',
    description: 'Sales team management',
    icon: Briefcase,
    href: '/salesforce',
    color: '#7C3AED',
    status: 'active' as const,
  },
  {
    id: 'agent-network',
    name: 'Agent Network',
    description: 'Referral & commission system',
    icon: Network,
    href: '/agent-network',
    color: '#EC4899',
    status: 'active' as const,
  },
  {
    id: 'grosupply',
    name: 'GroSupply',
    description: 'B2B marketplace & procurement',
    icon: Layers,
    href: '/grosupply',
    color: '#14B8A6',
    status: 'active' as const,
  },
  {
    id: 'grosell',
    name: 'GroSell',
    description: 'E-commerce & online selling',
    icon: Globe,
    href: '/grosell',
    color: '#8B5CF6',
    status: 'active' as const,
  },
  {
    id: 'grocredit',
    name: 'GroCredit',
    description: 'Lending & credit services',
    icon: Zap,
    href: '/grocredit',
    color: '#F59E0B',
    status: 'active' as const,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Multi-tenant management',
    icon: Building2,
    href: '/enterprise',
    color: '#6366F1',
    status: 'active' as const,
  },
]

const systemStatus = {
  overall: 'operational' as const,
  services: [
    { name: 'Payment Gateway', status: 'operational' },
    { name: 'QR Service', status: 'operational' },
    { name: 'Wallet Service', status: 'operational' },
    { name: 'KYC Service', status: 'degraded' },
  ]
}

export default function AdminLayout({ children, activeView, setActiveView }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState<string>('')
  const [darkMode, setDarkMode] = useState(false)

  // Initialize and update time only on client to avoid hydration mismatch
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-ZA', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        hour12: false 
      }))
    }
    
    updateTime() // Set initial time on mount
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  const getSystemStatusColor = () => {
    switch (systemStatus.overall) {
      case 'operational':
        return 'bg-green-500'
      case 'degraded':
        return 'bg-amber-500'
      case 'down':
        return 'bg-red-500'
      default:
        return 'bg-green-500'
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-ZA', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: false 
    })
  }

  return (
    <div className={`min-h-screen bg-[#0F172A] ${darkMode ? 'dark' : ''}`}>
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 bg-[#1E293B] border-b border-gray-700/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X className="h-5 w-5 text-gray-300" /> : <Menu className="h-5 w-5 text-gray-300" />}
          </button>
          
          <Link href="/admin-console" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#00897B] text-white flex items-center justify-center">
              <Shield className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold text-white">Admin Console</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getSystemStatusColor()}`} />
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-[#00897B] text-white text-xs">JD</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="absolute left-0 top-0 h-full w-64 bg-[#1E293B] border-r border-gray-700/50 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id as AdminViewType)
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    activeView === item.id
                      ? 'bg-[#00897B] text-white'
                      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.badge && (
                    <Badge className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5">
                      {item.badge}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside 
          className={`hidden lg:flex flex-col bg-[#1E293B] border-r border-gray-700/50 transition-all duration-300 ${
            sidebarOpen ? 'w-64' : 'w-20'
          }`}
        >
          {/* Logo & App Switcher */}
          <div className="p-4 border-b border-gray-700/50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full hover:bg-gray-700/30 rounded-lg p-1 -m-1 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-[#00897B] text-white flex items-center justify-center flex-shrink-0">
                    <Shield className="h-5 w-5" />
                  </div>
                  {sidebarOpen && (
                    <div className="flex-1 text-left">
                      <div className="text-sm font-bold text-white">Admin Console</div>
                      <div className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        Switch App
                        <ChevronDown className="h-3 w-3" />
                      </div>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72 bg-[#1E293B] border-gray-700 text-white">
                <DropdownMenuLabel className="text-gray-400 text-xs">Groway Applications</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-700" />
                {applications.map((app) => {
                  const AppIcon = app.icon
                  const isActive = app.id === 'admin-console'
                  return (
                    <DropdownMenuItem key={app.id} asChild>
                      <Link 
                        href={app.href}
                        className={`flex items-center gap-3 py-2.5 ${isActive ? 'bg-[#00897B]/20' : ''}`}
                      >
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${app.color}20`, color: app.color }}
                        >
                          <AppIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{app.name}</p>
                          <p className="text-xs text-gray-400">{app.description}</p>
                        </div>
                        {isActive && (
                          <Badge className="bg-[#00897B] text-white text-[9px] px-1.5">Active</Badge>
                        )}
                      </Link>
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* System Status */}
          {sidebarOpen && (
            <div className="p-4 border-b border-gray-700/50">
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                <div className={`w-2 h-2 rounded-full ${getSystemStatusColor()}`} />
                <span className="capitalize">{systemStatus.overall}</span>
              </div>
              <div className="text-[10px] text-gray-500">
                {systemStatus.services.filter(s => s.status === 'operational').length}/{systemStatus.services.length} services up
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as AdminViewType)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  activeView === item.id
                    ? 'bg-[#00897B] text-white'
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                }`}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {sidebarOpen && (
                  <>
                    <span className="text-sm font-medium">{item.label}</span>
                    {item.badge && (
                      <Badge className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </button>
            ))}
          </nav>

          {/* Collapse Button */}
          <div className="p-4 border-t border-gray-700/50">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-700/50 hover:text-white transition-colors"
            >
              <Menu className="h-4 w-4" />
              {sidebarOpen && <span className="text-xs">Collapse</span>}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Top Bar */}
          <header className="sticky top-0 z-30 bg-[#1E293B]/95 backdrop-blur-sm border-b border-gray-700/50 px-4 lg:px-6 py-3">
            <div className="flex items-center justify-between">
              {/* Search & Time */}
              <div className="flex items-center gap-4">
                <div className="relative hidden sm:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Search merchants, transactions..." 
                    className="pl-10 w-64 lg:w-80 bg-[#0F172A] border-gray-600 text-white placeholder:text-gray-500 text-sm"
                  />
                </div>
                
                <div className="hidden md:flex items-center gap-2 text-gray-400 text-sm">
                  <Clock className="h-4 w-4" />
                  <span className="font-mono">{currentTime ? `${currentTime} SAST` : '--:--:-- SAST'}</span>
                </div>
              </div>

              {/* Right Actions */}
              <div className="flex items-center gap-3">
                {/* Status Badge */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0F172A] border border-gray-700">
                  <div className={`w-2 h-2 rounded-full ${getSystemStatusColor()}`} />
                  <span className="text-xs text-gray-300 capitalize">{systemStatus.overall}</span>
                </div>

                {/* Notifications */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative text-gray-300 hover:text-white hover:bg-gray-700/50">
                      <Bell className="h-4 w-4" />
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                        7
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 bg-[#1E293B] border-gray-700 text-white">
                    <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-700" />
                    <div className="max-h-64 overflow-y-auto">
                      <DropdownMenuItem className="flex flex-col items-start gap-1 py-3 hover:bg-gray-700/50">
                        <span className="text-sm font-medium">High-value transaction flagged</span>
                        <span className="text-xs text-gray-400">Merchant #8821 - R250,000</span>
                        <span className="text-[10px] text-gray-500">2 min ago</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex flex-col items-start gap-1 py-3 hover:bg-gray-700/50">
                        <span className="text-sm font-medium">KYC verification pending</span>
                        <span className="text-xs text-gray-400">23 merchants awaiting review</span>
                        <span className="text-[10px] text-gray-500">15 min ago</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex flex-col items-start gap-1 py-3 hover:bg-gray-700/50">
                        <span className="text-sm font-medium">System alert: KYC Service degraded</span>
                        <span className="text-xs text-gray-400">Performance issues detected</span>
                        <span className="text-[10px] text-gray-500">1 hour ago</span>
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 text-gray-300 hover:text-white hover:bg-gray-700/50">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-[#00897B] text-white text-xs">JD</AvatarFallback>
                      </Avatar>
                      <div className="hidden md:block text-left">
                        <div className="text-sm font-medium">John Doe</div>
                        <div className="text-[10px] text-gray-400">Super Admin</div>
                      </div>
                      <ChevronDown className="h-4 w-4 hidden md:block" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-[#1E293B] border-gray-700 text-white">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span>John Doe</span>
                        <span className="text-xs font-normal text-gray-400">john.doe@groway.co.za</span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-700" />
                    <DropdownMenuItem className="hover:bg-gray-700/50">
                      <User className="h-4 w-4 mr-2" />
                      Profile Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-gray-700/50">
                      <Lock className="h-4 w-4 mr-2" />
                      Security
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDarkMode(!darkMode)} className="hover:bg-gray-700/50">
                      {darkMode ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                      {darkMode ? 'Light Mode' : 'Dark Mode'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gray-700" />
                    <DropdownMenuItem className="text-red-400 hover:bg-gray-700/50">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-[#1E293B] border-t border-gray-700/50 px-4 lg:px-6 py-3">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <Shield className="h-3 w-3" />
                <span>Admin Console v2.4.1</span>
                <span className="text-gray-600">|</span>
                <span>Session: 2h 34m</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  Groway (Pty) Ltd
                </span>
                <span className="text-gray-500">All actions are logged</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}
