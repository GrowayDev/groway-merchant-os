'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Menu, X, Home, QrCode, CreditCard, Smartphone, PiggyBank, Settings,
  Bell, Search, Plus, ArrowUpRight, ArrowDownRight, MoreHorizontal,
  Eye, Edit, Trash2, Download, RefreshCw, CheckCircle2, AlertCircle,
  Clock, TrendingUp, DollarSign, Users, Package, Store, Building2,
  MapPin, Phone, Mail, ChevronRight, BarChart3, PieChart, Activity,
  Shield, Key, Zap, Wallet, Send, Receive, Nfc, Wifi, Bluetooth,
  Battery, Signal, Printer, Camera, Lock, LogOut, User, HelpCircle,
  FileText, Calendar, Filter, ShoppingBag, Briefcase, Target, Layers
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'

// Types
interface Device {
  id: string
  serialNumber: string
  name: string
  type: 'qr_terminal' | 'smartpos' | 'tablet' | 'softpos'
  status: 'active' | 'inactive' | 'offline' | 'maintenance'
  batteryLevel?: number
  signalStrength?: number
  lastActive: Date
  firmwareVersion: string
  location?: string
  totalTransactions: number
  totalRevenue: number
}

interface Transaction {
  id: string
  amount: number
  currency: string
  type: 'payment' | 'refund' | 'payout'
  status: 'completed' | 'pending' | 'failed' | 'reversed'
  paymentMethod: 'card' | 'nfc' | 'qr' | 'mobile_money' | 'eft'
  deviceId: string
  customerMaskedCard?: string
  createdAt: Date
  settlementStatus: 'settled' | 'pending' | 'processing'
}

interface LendingFacility {
  id: string
  type: 'working_capital' | 'equipment' | 'bnpl' | 'inventory' | 'growth'
  approvedLimit: number
  usedAmount: number
  availableAmount: number
  interestRate: number
  status: 'active' | 'pending' | 'closed' | 'overdue'
  nextPaymentDate?: Date
  nextPaymentAmount?: number
  totalRepaid: number
}

interface LoanApplication {
  id: string
  type: string
  requestedAmount: number
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected'
  createdAt: Date
  purpose?: string
}

// Login Screen
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#00695C] via-[#00897B] to-[#4CAF50] p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-2xl">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <Link href="/" className="inline-block">
                <img src="/groway-logo.png" alt="Groway" className="h-12 w-auto mx-auto mb-4" />
              </Link>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Nfc className="h-5 w-5 text-[#00897B]" />
                <h1 className="text-2xl font-bold text-[#1A1A1A]">Gopay Portal</h1>
              </div>
              <p className="text-sm text-[#757575]">Merchant Dashboard</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email"
                  type="email" 
                  placeholder="merchant@business.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password"
                  type="password" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              
              <Button 
                className="w-full bg-[#00897B] hover:bg-[#00695C] text-white py-5"
                onClick={onLogin}
              >
                Sign In
              </Button>
            </div>

            <div className="mt-6 p-4 bg-[#E0F2F1] rounded-lg">
              <p className="text-xs text-[#00695C] text-center">
                <strong>Demo Mode:</strong> Click Sign In to explore the portal
              </p>
            </div>

            <div className="mt-6 text-center">
              <Link href="/gopay" className="text-sm text-[#757575] hover:text-[#00897B]">
                ← Back to Gopay Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Main Dashboard
function GopayDashboard() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Data states
  const [devices, setDevices] = useState<Device[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [lendingFacilities, setLendingFacilities] = useState<LendingFacility[]>([])
  const [loanApplications, setLoanApplications] = useState<LoanApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Dialog states
  const [showAddDevice, setShowAddDevice] = useState(false)
  const [showApplyLoan, setShowApplyLoan] = useState(false)
  const [showDeviceDetails, setShowDeviceDetails] = useState<Device | null>(null)
  const [showTransactionDetails, setShowTransactionDetails] = useState<Transaction | null>(null)
  
  // Form states
  const [deviceForm, setDeviceForm] = useState({ 
    name: '', type: 'qr_terminal', serialNumber: '', location: '' 
  })
  const [loanForm, setLoanForm] = useState({
    type: 'working_capital', amount: '', purpose: ''
  })

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'devices', label: 'My Devices', icon: QrCode },
    { id: 'transactions', label: 'Transactions', icon: Activity },
    { id: 'lending', label: 'Lending', icon: PiggyBank },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settlements', label: 'Settlements', icon: Wallet },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  // Mock data initialization
  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setDevices([
        { id: '1', serialNumber: 'GP-QR-001', name: 'Main QR Terminal', type: 'qr_terminal', status: 'active', batteryLevel: 85, signalStrength: 92, lastActive: new Date(), firmwareVersion: '2.1.4', location: 'Main Store', totalTransactions: 1245, totalRevenue: 156780 },
        { id: '2', serialNumber: 'GP-SP-001', name: 'SmartPOS Counter', type: 'smartpos', status: 'active', batteryLevel: 100, signalStrength: 98, lastActive: new Date(), firmwareVersion: '3.0.1', location: 'Main Store', totalTransactions: 892, totalRevenue: 234500 },
        { id: '3', serialNumber: 'GP-QR-002', name: 'Mobile Terminal', type: 'qr_terminal', status: 'offline', batteryLevel: 12, signalStrength: 0, lastActive: new Date(Date.now() - 86400000), firmwareVersion: '2.1.3', location: 'Market Stall', totalTransactions: 156, totalRevenue: 23450 },
        { id: '4', serialNumber: 'GP-TB-001', name: 'Restaurant Tablet', type: 'tablet', status: 'active', batteryLevel: 67, signalStrength: 85, lastActive: new Date(), firmwareVersion: '4.2.0', location: 'Restaurant', totalTransactions: 567, totalRevenue: 89000 },
        { id: '5', serialNumber: 'GP-SOFT-001', name: 'Delivery SoftPOS', type: 'softpos', status: 'active', lastActive: new Date(), firmwareVersion: '1.5.2', totalTransactions: 89, totalRevenue: 12300 },
      ])

      setTransactions([
        { id: 'TXN001', amount: 450.00, currency: 'ZAR', type: 'payment', status: 'completed', paymentMethod: 'nfc', deviceId: '2', customerMaskedCard: '**** **** **** 4521', createdAt: new Date(), settlementStatus: 'settled' },
        { id: 'TXN002', amount: 125.50, currency: 'ZAR', type: 'payment', status: 'completed', paymentMethod: 'qr', deviceId: '1', createdAt: new Date(Date.now() - 3600000), settlementStatus: 'pending' },
        { id: 'TXN003', amount: 89.00, currency: 'ZAR', type: 'refund', status: 'completed', paymentMethod: 'card', deviceId: '2', customerMaskedCard: '**** **** **** 7832', createdAt: new Date(Date.now() - 7200000), settlementStatus: 'processing' },
        { id: 'TXN004', amount: 2350.00, currency: 'ZAR', type: 'payment', status: 'completed', paymentMethod: 'eft', deviceId: '4', createdAt: new Date(Date.now() - 10800000), settlementStatus: 'settled' },
        { id: 'TXN005', amount: 67.80, currency: 'ZAR', type: 'payment', status: 'failed', paymentMethod: 'card', deviceId: '1', customerMaskedCard: '**** **** **** 1245', createdAt: new Date(Date.now() - 14400000), settlementStatus: 'pending' },
        { id: 'TXN006', amount: 189.00, currency: 'ZAR', type: 'payment', status: 'completed', paymentMethod: 'mobile_money', deviceId: '5', createdAt: new Date(Date.now() - 18000000), settlementStatus: 'settled' },
      ])

      setLendingFacilities([
        { id: 'LF001', type: 'working_capital', approvedLimit: 150000, usedAmount: 75000, availableAmount: 75000, interestRate: 18.5, status: 'active', nextPaymentDate: new Date(Date.now() + 604800000), nextPaymentAmount: 8500, totalRepaid: 45000 },
        { id: 'LF002', type: 'equipment', approvedLimit: 50000, usedAmount: 35000, availableAmount: 15000, interestRate: 15.0, status: 'active', nextPaymentDate: new Date(Date.now() + 1209600000), nextPaymentAmount: 3200, totalRepaid: 15000 },
      ])

      setLoanApplications([
        { id: 'LA001', type: 'inventory', requestedAmount: 100000, status: 'approved', createdAt: new Date(Date.now() - 259200000), purpose: 'Stock up for festive season' },
        { id: 'LA002', type: 'growth', requestedAmount: 250000, status: 'under_review', createdAt: new Date(Date.now() - 86400000), purpose: 'Open second branch' },
      ])

      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // Handlers
  const handleAddDevice = async () => {
    if (!deviceForm.name || !deviceForm.serialNumber) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' })
      return
    }
    setSaving(true)
    await new Promise(r => setTimeout(r, 1000))
    const newDevice: Device = {
      id: String(devices.length + 1),
      serialNumber: deviceForm.serialNumber,
      name: deviceForm.name,
      type: deviceForm.type as Device['type'],
      status: 'inactive',
      lastActive: new Date(),
      firmwareVersion: '1.0.0',
      location: deviceForm.location,
      totalTransactions: 0,
      totalRevenue: 0,
    }
    setDevices(prev => [newDevice, ...prev])
    setShowAddDevice(false)
    setDeviceForm({ name: '', type: 'qr_terminal', serialNumber: '', location: '' })
    toast({ title: 'Success', description: 'Device added successfully' })
    setSaving(false)
  }

  const handleApplyForLoan = async () => {
    if (!loanForm.amount) {
      toast({ title: 'Error', description: 'Please enter loan amount', variant: 'destructive' })
      return
    }
    setSaving(true)
    await new Promise(r => setTimeout(r, 1000))
    const newApplication: LoanApplication = {
      id: `LA${String(loanApplications.length + 1).padStart(3, '0')}`,
      type: loanForm.type,
      requestedAmount: parseFloat(loanForm.amount),
      status: 'submitted',
      createdAt: new Date(),
      purpose: loanForm.purpose,
    }
    setLoanApplications(prev => [newApplication, ...prev])
    setShowApplyLoan(false)
    setLoanForm({ type: 'working_capital', amount: '', purpose: '' })
    toast({ title: 'Success', description: 'Loan application submitted successfully' })
    setSaving(false)
  }

  // Calculations
  const totalRevenue = transactions.filter(t => t.type === 'payment' && t.status === 'completed').reduce((s, t) => s + t.amount, 0)
  const totalRefunds = transactions.filter(t => t.type === 'refund').reduce((s, t) => s + t.amount, 0)
  const pendingSettlement = transactions.filter(t => t.settlementStatus === 'pending').reduce((s, t) => s + t.amount, 0)
  const activeDevices = devices.filter(d => d.status === 'active').length
  const totalLendingAvailable = lendingFacilities.reduce((s, f) => s + f.availableAmount, 0)
  const totalLendingUsed = lendingFacilities.reduce((s, f) => s + f.usedAmount, 0)

  const getDeviceTypeLabel = (type: string) => {
    switch (type) {
      case 'qr_terminal': return 'QR Terminal'
      case 'smartpos': return 'SmartPOS'
      case 'tablet': return 'Business Tablet'
      case 'softpos': return 'SoftPOS'
      default: return type
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': case 'completed': case 'settled': case 'approved': return 'bg-green-100 text-green-700'
      case 'pending': case 'submitted': case 'under_review': case 'processing': return 'bg-amber-100 text-amber-700'
      case 'inactive': case 'offline': case 'failed': case 'rejected': return 'bg-red-100 text-red-700'
      case 'maintenance': case 'reversed': case 'overdue': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'card': return CreditCard
      case 'nfc': return Nfc
      case 'qr': return QrCode
      case 'mobile_money': return Smartphone
      case 'eft': return Building2
      default: return DollarSign
    }
  }

  const getLendingTypeLabel = (type: string) => {
    switch (type) {
      case 'working_capital': return 'Working Capital'
      case 'equipment': return 'Equipment Finance'
      case 'bnpl': return 'BNPL'
      case 'inventory': return 'Inventory Funding'
      case 'growth': return 'Growth Loan'
      default: return type
    }
  }

  // Render functions
  const renderOverview = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[#00897B]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575] mb-1">Today's Revenue</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">R {totalRevenue.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#E0F2F1] flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-[#00897B]" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight className="h-3 w-3 text-green-500" />
              <span className="text-xs text-green-600">+18.5%</span>
              <span className="text-xs text-[#757575]">vs yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575] mb-1">Transactions</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">{transactions.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Activity className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575] mb-1">Active Devices</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">{activeDevices}/{devices.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <QrCode className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575] mb-1">Available Credit</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">R {totalLendingAvailable.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <PiggyBank className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => setShowAddDevice(true)}>
          <Plus className="h-5 w-5" />
          <span className="text-xs">Add Device</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex-col gap-2">
          <QrCode className="h-5 w-5" />
          <span className="text-xs">Generate QR</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => setShowApplyLoan(true)}>
          <PiggyBank className="h-5 w-5" />
          <span className="text-xs">Apply for Loan</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex-col gap-2">
          <Download className="h-5 w-5" />
          <span className="text-xs">Export Report</span>
        </Button>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
              <Button variant="ghost" size="sm" className="text-[#00897B]" onClick={() => setActiveTab('transactions')}>
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.slice(0, 5).map((txn) => {
                const PaymentIcon = getPaymentMethodIcon(txn.paymentMethod)
                return (
                  <div key={txn.id} className="flex items-center justify-between p-3 rounded-lg bg-[#FAFAFA] hover:bg-gray-100 cursor-pointer" onClick={() => setShowTransactionDetails(txn)}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${txn.type === 'refund' ? 'bg-red-100' : 'bg-[#E0F2F1]'}`}>
                        <PaymentIcon className={`h-5 w-5 ${txn.type === 'refund' ? 'text-red-500' : 'text-[#00897B]'}`} />
                      </div>
                      <div>
                        <p className="font-medium text-[#1A1A1A] text-sm">{txn.id}</p>
                        <p className="text-xs text-[#757575]">{txn.paymentMethod.toUpperCase()} • {new Date(txn.createdAt).toLocaleTimeString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${txn.type === 'refund' ? 'text-red-600' : 'text-[#1A1A1A]'}`}>
                        {txn.type === 'refund' ? '-' : '+'}R {txn.amount.toLocaleString()}
                      </p>
                      <Badge className={`text-[10px] ${getStatusColor(txn.status)}`}>{txn.status}</Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Device Status */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Device Status</CardTitle>
              <Button variant="ghost" size="sm" className="text-[#00897B]" onClick={() => setActiveTab('devices')}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {devices.slice(0, 4).map((device) => (
                <div key={device.id} className="flex items-center justify-between p-3 rounded-lg bg-[#FAFAFA] cursor-pointer hover:bg-gray-100" onClick={() => setShowDeviceDetails(device)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#E0F2F1] flex items-center justify-center">
                      {device.type === 'qr_terminal' && <QrCode className="h-5 w-5 text-[#00897B]" />}
                      {device.type === 'smartpos' && <CreditCard className="h-5 w-5 text-[#00897B]" />}
                      {device.type === 'tablet' && <Smartphone className="h-5 w-5 text-[#00897B]" />}
                      {device.type === 'softpos' && <Nfc className="h-5 w-5 text-[#00897B]" />}
                    </div>
                    <div>
                      <p className="font-medium text-[#1A1A1A] text-sm">{device.name}</p>
                      <p className="text-xs text-[#757575]">{device.serialNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {device.batteryLevel !== undefined && (
                      <div className="flex items-center gap-1">
                        <Battery className={`h-3.5 w-3.5 ${device.batteryLevel > 50 ? 'text-green-500' : device.batteryLevel > 20 ? 'text-amber-500' : 'text-red-500'}`} />
                        <span className="text-xs text-[#757575]">{device.batteryLevel}%</span>
                      </div>
                    )}
                    <Badge className={`text-[10px] ${getStatusColor(device.status)}`}>{device.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settlement Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Settlement Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-[#FAFAFA]">
              <p className="text-xs text-[#757575] mb-1">Settled Today</p>
              <p className="text-xl font-bold text-green-600">R {(totalRevenue - pendingSettlement).toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-lg bg-[#FAFAFA]">
              <p className="text-xs text-[#757575] mb-1">Pending Settlement</p>
              <p className="text-xl font-bold text-amber-600">R {pendingSettlement.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-lg bg-[#FAFAFA]">
              <p className="text-xs text-[#757575] mb-1">Processing</p>
              <p className="text-xl font-bold text-blue-600">R {Math.floor(pendingSettlement * 0.3).toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-lg bg-[#FAFAFA]">
              <p className="text-xs text-[#757575] mb-1">Next Settlement</p>
              <p className="text-xl font-bold text-[#1A1A1A]">Tomorrow 09:00</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderDevices = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
            <Input placeholder="Search devices..." className="pl-9" />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setShowAddDevice(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Device
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map((device) => (
          <Card key={device.id} className="cursor-pointer hover:border-[#00897B]/30 transition-colors" onClick={() => setShowDeviceDetails(device)}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-[#E0F2F1] flex items-center justify-center">
                    {device.type === 'qr_terminal' && <QrCode className="h-6 w-6 text-[#00897B]" />}
                    {device.type === 'smartpos' && <CreditCard className="h-6 w-6 text-[#00897B]" />}
                    {device.type === 'tablet' && <Smartphone className="h-6 w-6 text-[#00897B]" />}
                    {device.type === 'softpos' && <Nfc className="h-6 w-6 text-[#00897B]" />}
                  </div>
                  <div>
                    <p className="font-medium text-[#1A1A1A]">{device.name}</p>
                    <p className="text-xs text-[#757575]">{device.serialNumber}</p>
                  </div>
                </div>
                <Badge className={getStatusColor(device.status)}>{device.status}</Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[#757575]">Type</span>
                  <span className="font-medium">{getDeviceTypeLabel(device.type)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#757575]">Location</span>
                  <span className="font-medium">{device.location || 'Unassigned'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#757575]">Transactions</span>
                  <span className="font-medium">{device.totalTransactions.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#757575]">Revenue</span>
                  <span className="font-medium text-[#00897B]">R {device.totalRevenue.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {device.batteryLevel !== undefined && (
                    <div className="flex items-center gap-1">
                      <Battery className={`h-4 w-4 ${device.batteryLevel > 50 ? 'text-green-500' : device.batteryLevel > 20 ? 'text-amber-500' : 'text-red-500'}`} />
                      <span className="text-xs">{device.batteryLevel}%</span>
                    </div>
                  )}
                  {device.signalStrength !== undefined && (
                    <div className="flex items-center gap-1">
                      <Signal className={`h-4 w-4 ${device.signalStrength > 70 ? 'text-green-500' : device.signalStrength > 40 ? 'text-amber-500' : 'text-red-500'}`} />
                      <span className="text-xs">{device.signalStrength}%</span>
                    </div>
                  )}
                </div>
                <span className="text-xs text-[#757575]">v{device.firmwareVersion}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  const renderTransactions = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
            <Input placeholder="Search transactions..." className="pl-9" />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="payment">Payments</SelectItem>
              <SelectItem value="refund">Refunds</SelectItem>
              <SelectItem value="payout">Payouts</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" /> Export
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575] mb-1">Total Volume</p>
            <p className="text-xl font-bold text-[#1A1A1A]">R {totalRevenue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575] mb-1">Transactions</p>
            <p className="text-xl font-bold text-[#1A1A1A]">{transactions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575] mb-1">Refunds</p>
            <p className="text-xl font-bold text-red-600">R {totalRefunds.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575] mb-1">Avg Transaction</p>
            <p className="text-xl font-bold text-[#1A1A1A]">R {(totalRevenue / transactions.length).toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#FAFAFA] border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Transaction</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Method</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Settlement</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((txn) => {
                  const PaymentIcon = getPaymentMethodIcon(txn.paymentMethod)
                  return (
                    <tr key={txn.id} className="hover:bg-[#FAFAFA] cursor-pointer" onClick={() => setShowTransactionDetails(txn)}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#1A1A1A] text-sm">{txn.id}</p>
                        <p className="text-xs text-[#757575]">{txn.customerMaskedCard || 'Mobile Payment'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={txn.type === 'refund' ? 'border-red-200 text-red-700' : 'border-green-200 text-green-700'}>
                          {txn.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <PaymentIcon className="h-4 w-4 text-[#757575]" />
                          <span className="text-sm">{txn.paymentMethod.replace('_', ' ').toUpperCase()}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${txn.type === 'refund' ? 'text-red-600' : 'text-[#1A1A1A]'}`}>
                          {txn.type === 'refund' ? '-' : '+'}R {txn.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={getStatusColor(txn.status)}>{txn.status}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={txn.settlementStatus === 'settled' ? 'border-green-200 text-green-700' : 'border-amber-200 text-amber-700'}>
                          {txn.settlementStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#757575]">
                        {new Date(txn.createdAt).toLocaleDateString()} {new Date(txn.createdAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderLending = () => (
    <div className="space-y-6">
      {/* Credit Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[#FF8F00]">
          <CardContent className="p-4">
            <p className="text-xs text-[#757575] mb-1">Total Credit Limit</p>
            <p className="text-2xl font-bold text-[#1A1A1A]">R {(totalLendingAvailable + totalLendingUsed).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <p className="text-xs text-[#757575] mb-1">Credit Used</p>
            <p className="text-2xl font-bold text-[#1A1A1A]">R {totalLendingUsed.toLocaleString()}</p>
            <Progress value={(totalLendingUsed / (totalLendingAvailable + totalLendingUsed)) * 100} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <p className="text-xs text-[#757575] mb-1">Available Credit</p>
            <p className="text-2xl font-bold text-green-600">R {totalLendingAvailable.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <p className="text-xs text-[#757575] mb-1">Next Payment</p>
            <p className="text-2xl font-bold text-[#1A1A1A]">R 8,500</p>
            <p className="text-xs text-[#757575] mt-1">Due in 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Facilities */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Active Credit Facilities</CardTitle>
            <Button className="bg-[#FF8F00] hover:bg-[#F57C00]" onClick={() => setShowApplyLoan(true)}>
              <Plus className="h-4 w-4 mr-2" /> Apply for Credit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#FAFAFA] border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Facility Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Approved Limit</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Used</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Available</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Rate</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Next Payment</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lendingFacilities.map((facility) => (
                  <tr key={facility.id} className="hover:bg-[#FAFAFA]">
                    <td className="px-4 py-3 font-medium text-[#1A1A1A]">{getLendingTypeLabel(facility.type)}</td>
                    <td className="px-4 py-3">R {facility.approvedLimit.toLocaleString()}</td>
                    <td className="px-4 py-3">R {facility.usedAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-green-600 font-medium">R {facility.availableAmount.toLocaleString()}</td>
                    <td className="px-4 py-3">{facility.interestRate}% p.a.</td>
                    <td className="px-4 py-3">
                      {facility.nextPaymentDate && (
                        <div>
                          <p className="font-medium">R {facility.nextPaymentAmount?.toLocaleString()}</p>
                          <p className="text-xs text-[#757575]">{new Date(facility.nextPaymentDate).toLocaleDateString()}</p>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={getStatusColor(facility.status)}>{facility.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Loan Applications */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Recent Applications</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#FAFAFA] border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Application ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Purpose</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loanApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-[#FAFAFA]">
                    <td className="px-4 py-3 font-medium text-[#1A1A1A]">{app.id}</td>
                    <td className="px-4 py-3">{getLendingTypeLabel(app.type)}</td>
                    <td className="px-4 py-3">R {app.requestedAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-[#757575]">{app.purpose || '-'}</td>
                    <td className="px-4 py-3">
                      <Badge className={getStatusColor(app.status)}>{app.status.replace('_', ' ')}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#757575]">{new Date(app.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderAnalytics = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Revenue Analytics</CardTitle>
          <CardDescription>Transaction trends over the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-[#757575] mx-auto mb-2" />
              <p className="text-[#757575]">Revenue chart visualization</p>
              <p className="text-xs text-[#757575]">Integration with charting library needed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['Card', 'NFC', 'QR Code', 'Mobile Money', 'EFT'].map((method, idx) => {
                const percentages = [35, 28, 20, 12, 5]
                return (
                  <div key={method}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[#1A1A1A]">{method}</span>
                      <span className="font-medium">{percentages[idx]}%</span>
                    </div>
                    <Progress value={percentages[idx]} className="h-2" />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Device Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {devices.slice(0, 4).map((device) => {
                const percentage = (device.totalRevenue / totalRevenue) * 100
                return (
                  <div key={device.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[#1A1A1A]">{device.name}</span>
                      <span className="font-medium">R {device.totalRevenue.toLocaleString()}</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderSettlements = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <DollarSign className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-sm text-[#757575] mb-1">Total Settled</p>
            <p className="text-3xl font-bold text-[#1A1A1A]">R {(totalRevenue - pendingSettlement).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Clock className="h-12 w-12 text-amber-500 mx-auto mb-3" />
            <p className="text-sm text-[#757575] mb-1">Pending Settlement</p>
            <p className="text-3xl font-bold text-[#1A1A1A]">R {pendingSettlement.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <RefreshCw className="h-12 w-12 text-blue-500 mx-auto mb-3" />
            <p className="text-sm text-[#757575] mb-1">Processing</p>
            <p className="text-3xl font-bold text-[#1A1A1A]">R {Math.floor(pendingSettlement * 0.3).toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Settlement Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { date: 'Tomorrow', amount: 45000, status: 'scheduled' },
              { date: 'In 2 days', amount: 32000, status: 'scheduled' },
              { date: 'In 3 days', amount: 28000, status: 'pending' },
            ].map((settlement, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-lg bg-[#FAFAFA]">
                <div>
                  <p className="font-medium text-[#1A1A1A]">{settlement.date}</p>
                  <p className="text-sm text-[#757575]">Automatic settlement to bank account</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[#1A1A1A]">R {settlement.amount.toLocaleString()}</p>
                  <Badge className={settlement.status === 'scheduled' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                    {settlement.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Business Name</Label>
            <Input defaultValue="My Business" className="mt-1.5" />
          </div>
          <div>
            <Label>Trading Name</Label>
            <Input defaultValue="My Trading Name" className="mt-1.5" />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Contact Email</Label>
              <Input defaultValue="merchant@business.com" className="mt-1.5" />
            </div>
            <div>
              <Label>Contact Phone</Label>
              <Input defaultValue="+27 11 123 4567" className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label>Settlement Bank Account</Label>
            <Select defaultValue="fnb">
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fnb">FNB Business Account **** 4521</SelectItem>
                <SelectItem value="standard">Standard Bank **** 7832</SelectItem>
                <SelectItem value="absa">ABSA **** 1245</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="bg-[#00897B] hover:bg-[#00695C]">Save Changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {['Transaction alerts', 'Settlement notifications', 'Low battery alerts', 'Marketing updates'].map((pref, idx) => (
            <div key={idx} className="flex items-center justify-between py-2">
              <span className="text-[#1A1A1A]">{pref}</span>
              <input type="checkbox" defaultChecked className="h-4 w-4" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview()
      case 'devices': return renderDevices()
      case 'transactions': return renderTransactions()
      case 'lending': return renderLending()
      case 'analytics': return renderAnalytics()
      case 'settlements': return renderSettlements()
      case 'settings': return renderSettings()
      default: return renderOverview()
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 hidden lg:flex flex-col transition-all duration-300`}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {sidebarOpen && (
            <Link href="/gopay" className="flex items-center gap-2">
              <img src="/groway-logo.png" alt="Groway" className="h-7 w-auto" />
              <span className="text-sm font-semibold text-[#00897B]">Gopay</span>
            </Link>
          )}
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="h-4 w-4" />
          </Button>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                activeTab === item.id
                  ? 'bg-[#E0F2F1] text-[#00897B] font-medium'
                  : 'text-[#757575] hover:bg-[#FAFAFA]'
              }`}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <Link href="/gopay">
            <Button variant="ghost" className="w-full justify-start text-[#757575]">
              <LogOut className="h-4 w-4 mr-2" />
              {sidebarOpen && 'Back to Gopay'}
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-[#1A1A1A]">
                {navItems.find(n => n.id === activeTab)?.label || 'Overview'}
              </h1>
              <p className="text-xs text-[#757575]">Gopay Merchant Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5 text-[#757575]" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">3</span>
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-[#00897B] text-white text-xs">MB</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 text-[#00897B] animate-spin" />
            </div>
          ) : (
            renderContent()
          )}
        </main>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden">
          <div className="w-72 bg-white h-full">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <Link href="/gopay" className="flex items-center gap-2">
                <img src="/groway-logo.png" alt="Groway" className="h-7 w-auto" />
                <span className="text-sm font-semibold text-[#00897B]">Gopay</span>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <nav className="p-2 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false) }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    activeTab === item.id ? 'bg-[#E0F2F1] text-[#00897B] font-medium' : 'text-[#757575] hover:bg-[#FAFAFA]'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Add Device Dialog */}
      <Dialog open={showAddDevice} onOpenChange={setShowAddDevice}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Device</DialogTitle>
            <DialogDescription>Register a new payment device to your merchant account</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Device Name *</Label>
              <Input value={deviceForm.name} onChange={(e) => setDeviceForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g., Counter 1 Terminal" className="mt-1.5" />
            </div>
            <div>
              <Label>Serial Number *</Label>
              <Input value={deviceForm.serialNumber} onChange={(e) => setDeviceForm(prev => ({ ...prev, serialNumber: e.target.value }))} placeholder="GP-XXXX-XXX" className="mt-1.5" />
            </div>
            <div>
              <Label>Device Type</Label>
              <Select value={deviceForm.type} onValueChange={(v) => setDeviceForm(prev => ({ ...prev, type: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="qr_terminal">QR Terminal</SelectItem>
                  <SelectItem value="smartpos">SmartPOS</SelectItem>
                  <SelectItem value="tablet">Business Tablet</SelectItem>
                  <SelectItem value="softpos">SoftPOS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Location</Label>
              <Input value={deviceForm.location} onChange={(e) => setDeviceForm(prev => ({ ...prev, location: e.target.value }))} placeholder="e.g., Main Store" className="mt-1.5" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDevice(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleAddDevice} disabled={saving}>
              {saving ? 'Adding...' : 'Add Device'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Apply for Loan Dialog */}
      <Dialog open={showApplyLoan} onOpenChange={setShowApplyLoan}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for Credit</DialogTitle>
            <DialogDescription>Submit a loan application based on your transaction history</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Loan Type</Label>
              <Select value={loanForm.type} onValueChange={(v) => setLoanForm(prev => ({ ...prev, type: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="working_capital">Working Capital</SelectItem>
                  <SelectItem value="equipment">Equipment Finance</SelectItem>
                  <SelectItem value="inventory">Inventory Funding</SelectItem>
                  <SelectItem value="growth">Growth Loan</SelectItem>
                  <SelectItem value="bnpl">BNPL Setup</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Requested Amount (ZAR) *</Label>
              <Input type="number" value={loanForm.amount} onChange={(e) => setLoanForm(prev => ({ ...prev, amount: e.target.value }))} placeholder="50000" className="mt-1.5" />
            </div>
            <div>
              <Label>Purpose</Label>
              <Textarea value={loanForm.purpose} onChange={(e) => setLoanForm(prev => ({ ...prev, purpose: e.target.value }))} placeholder="Describe how you plan to use the funds..." className="mt-1.5" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApplyLoan(false)}>Cancel</Button>
            <Button className="bg-[#FF8F00] hover:bg-[#F57C00]" onClick={handleApplyForLoan} disabled={saving}>
              {saving ? 'Submitting...' : 'Submit Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Device Details Dialog */}
      <Dialog open={!!showDeviceDetails} onOpenChange={() => setShowDeviceDetails(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{showDeviceDetails?.name}</DialogTitle>
            <DialogDescription>{showDeviceDetails?.serialNumber}</DialogDescription>
          </DialogHeader>
          {showDeviceDetails && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge className={getStatusColor(showDeviceDetails.status)}>{showDeviceDetails.status}</Badge>
                <span className="text-sm text-[#757575]">{getDeviceTypeLabel(showDeviceDetails.type)}</span>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[#757575]">Location</p>
                  <p className="font-medium">{showDeviceDetails.location || 'Unassigned'}</p>
                </div>
                <div>
                  <p className="text-[#757575]">Firmware</p>
                  <p className="font-medium">v{showDeviceDetails.firmwareVersion}</p>
                </div>
                <div>
                  <p className="text-[#757575]">Total Transactions</p>
                  <p className="font-medium">{showDeviceDetails.totalTransactions.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[#757575]">Total Revenue</p>
                  <p className="font-medium text-[#00897B]">R {showDeviceDetails.totalRevenue.toLocaleString()}</p>
                </div>
                {showDeviceDetails.batteryLevel !== undefined && (
                  <div>
                    <p className="text-[#757575]">Battery</p>
                    <div className="flex items-center gap-2">
                      <Progress value={showDeviceDetails.batteryLevel} className="h-2 w-16" />
                      <span className="font-medium">{showDeviceDetails.batteryLevel}%</span>
                    </div>
                  </div>
                )}
                {showDeviceDetails.signalStrength !== undefined && (
                  <div>
                    <p className="text-[#757575]">Signal</p>
                    <div className="flex items-center gap-2">
                      <Progress value={showDeviceDetails.signalStrength} className="h-2 w-16" />
                      <span className="font-medium">{showDeviceDetails.signalStrength}%</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">Restart Device</Button>
                <Button variant="outline" className="flex-1">Update Firmware</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Transaction Details Dialog */}
      <Dialog open={!!showTransactionDetails} onOpenChange={() => setShowTransactionDetails(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Transaction {showTransactionDetails?.id}</DialogTitle>
            <DialogDescription>Transaction details</DialogDescription>
          </DialogHeader>
          {showTransactionDetails && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge className={getStatusColor(showTransactionDetails.status)}>{showTransactionDetails.status}</Badge>
                <Badge variant="outline">{showTransactionDetails.paymentMethod.toUpperCase()}</Badge>
              </div>
              <div className="text-center py-4">
                <p className={`text-4xl font-bold ${showTransactionDetails.type === 'refund' ? 'text-red-600' : 'text-[#1A1A1A]'}`}>
                  {showTransactionDetails.type === 'refund' ? '-' : '+'}R {showTransactionDetails.amount.toLocaleString()}
                </p>
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#757575]">Type</span>
                  <span className="font-medium">{showTransactionDetails.type}</span>
                </div>
                {showTransactionDetails.customerMaskedCard && (
                  <div className="flex justify-between">
                    <span className="text-[#757575]">Card</span>
                    <span className="font-medium">{showTransactionDetails.customerMaskedCard}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#757575]">Date</span>
                  <span className="font-medium">{new Date(showTransactionDetails.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#757575]">Settlement</span>
                  <Badge variant="outline" className={showTransactionDetails.settlementStatus === 'settled' ? 'border-green-200 text-green-700' : 'border-amber-200 text-amber-700'}>
                    {showTransactionDetails.settlementStatus}
                  </Badge>
                </div>
              </div>
              <Button variant="outline" className="w-full">Print Receipt</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Main Page Component
export default function GopayPortalPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => setIsLoggedIn(true)} />
  }

  return <GopayDashboard />
}
