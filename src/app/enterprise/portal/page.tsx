'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { 
  Building2, Users, Store, BarChart3, CreditCard, LogOut, Menu, X,
  ChevronRight, TrendingUp, DollarSign, ShoppingBag, Bell, Search,
  Plus, MoreHorizontal, Download, Calendar, FileText, Activity,
  Shield, Key, Calculator, RefreshCw, AlertCircle, CheckCircle2,
  MapPin, Phone, Mail, Layers, ArrowUpRight, Eye, Edit, Trash2,
  UserPlus, Package, ArrowLeftRight, Database, Workflow, Palette,
  Headphones, Copy, Truck, User, FileSpreadsheet, Settings, Save
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
import { useToast } from '@/hooks/use-toast'

// Types
interface CorporateClient {
  id: string
  code: string
  name: string
  tier: string
  merchantsCount: number
  monthlyVolume: number
  creditLimit: number
  creditUsed: number
  status: string
  contactPerson?: string
  contactEmail?: string
  contactPhone?: string
  _count?: { merchants: number; users: number }
}

interface Merchant {
  id: string
  code: string
  name: string
  corporateId: string
  corporate?: { id: string; name: string; tier: string }
  location?: string
  status: string
  monthlyRevenue: number
  vertical?: string
  _count?: { inventory: number; customers: number }
}

interface EnterpriseUser {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  corporateId: string
  corporate?: { id: string; name: string }
  status: string
  lastLogin?: Date
}

interface InventoryItem {
  id: string
  sku: string
  name: string
  category?: string
  stock: number
  unit: string
  lowStock: number
  value: number
  merchant?: { id: string; name: string; location?: string }
}

interface Customer {
  id: string
  code: string
  name: string
  email?: string
  phone?: string
  totalSpent: number
  visitCount: number
  locationsCount: number
  tier: string
  lastVisit?: Date
  merchant?: { id: string; name: string }
}

interface Transfer {
  id: string
  code: string
  fromMerchantId: string
  toMerchantId: string
  fromMerchant?: { id: string; name: string; location?: string }
  toMerchant?: { id: string; name: string; location?: string }
  status: string
  itemsCount: number
  totalValue: number
  createdAt: Date
}

interface WhiteLabelSettings {
  id: string
  corporateId: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  logoUrl?: string
  companyName?: string
  tagline?: string
  customDomain?: string
}

interface ApiKey {
  id: string
  name: string
  keyPrefix: string
  permissions?: string
  status: string
  lastUsed?: Date
  createdAt: Date
  fullKey?: string
}

// Login Screen
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#00695C] via-[#00897B] to-[#4CAF50] p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-2xl">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <Link href="/" className="inline-block">
                <img src="/groway-logo.png" alt="Groway" className="h-12 w-auto mx-auto mb-4" />
              </Link>
              <h1 className="text-2xl font-bold text-[#1A1A1A]">Enterprise Portal</h1>
              <p className="text-sm text-[#757575] mt-1">Sign in to manage your enterprise</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="your@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" />
              </div>
              <Button className="w-full bg-[#00897B] hover:bg-[#00695C] text-white py-5" onClick={onLogin}>
                Sign In
              </Button>
            </div>
            <div className="mt-6 p-4 bg-[#E0F2F1] rounded-lg">
              <p className="text-xs text-[#00695C] text-center">
                <strong>Demo Mode:</strong> Click Sign In to explore the portal
              </p>
            </div>
            <div className="mt-6 text-center">
              <Link href="/" className="text-sm text-[#757575] hover:text-[#00897B]">← Back to Groway Home</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Main Dashboard
function DashboardContent() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Data states
  const [clients, setClients] = useState<CorporateClient[]>([])
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [users, setUsers] = useState<EnterpriseUser[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [whiteLabel, setWhiteLabel] = useState<WhiteLabelSettings | null>(null)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  
  // Loading states
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Dialog states
  const [showAddClient, setShowAddClient] = useState(false)
  const [showAddMerchant, setShowAddMerchant] = useState(false)
  const [showAddUser, setShowAddUser] = useState(false)
  const [showAddInventory, setShowAddInventory] = useState(false)
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [showAddTransfer, setShowAddTransfer] = useState(false)
  const [showAddApiKey, setShowAddApiKey] = useState(false)
  const [showWhiteLabel, setShowWhiteLabel] = useState(false)
  const [selectedClient, setSelectedClient] = useState<CorporateClient | null>(null)
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)

  // Form states
  const [clientForm, setClientForm] = useState({ name: '', tier: 'Silver', creditLimit: '', contactPerson: '', contactEmail: '', contactPhone: '' })
  const [merchantForm, setMerchantForm] = useState({ name: '', corporateId: '', location: '', vertical: 'Restaurant' })
  const [userForm, setUserForm] = useState({ name: '', email: '', phone: '', role: 'Viewer', corporateId: '' })
  const [inventoryForm, setInventoryForm] = useState({ sku: '', name: '', category: '', stock: '', unit: 'units', lowStock: '', merchantId: '' })
  const [customerForm, setCustomerForm] = useState({ name: '', email: '', phone: '', tier: 'Bronze', merchantId: '' })
  const [apiKeyForm, setApiKeyForm] = useState({ name: '', permissions: 'read' })
  const [whiteLabelForm, setWhiteLabelForm] = useState({ primaryColor: '#00897B', secondaryColor: '#00695C', accentColor: '#4CAF50', companyName: '', tagline: '' })

  const navItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'clients', label: 'Corporate Clients', icon: Building2 },
    { id: 'merchants', label: 'Merchants', icon: Store },
    { id: 'inventory', label: 'Central Inventory', icon: Package },
    { id: 'transfers', label: 'Inter-Branch Transfers', icon: ArrowLeftRight },
    { id: 'customers', label: 'Unified Customers', icon: Users },
    { id: 'users', label: 'Users & Permissions', icon: Shield },
    { id: 'reports', label: 'Consolidated Reports', icon: FileText },
    { id: 'billing', label: 'Billing & Credit', icon: CreditCard },
    { id: 'api', label: 'API & Integrations', icon: Key },
    { id: 'branding', label: 'White-Label', icon: Palette },
    { id: 'support', label: 'Support', icon: Headphones },
  ]

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [clientsRes, merchantsRes, usersRes, inventoryRes, customersRes, transfersRes] = await Promise.all([
        fetch('/api/enterprise/clients'),
        fetch('/api/enterprise/merchants'),
        fetch('/api/enterprise/users'),
        fetch('/api/enterprise/inventory'),
        fetch('/api/enterprise/customers'),
        fetch('/api/enterprise/transfers')
      ])
      
      if (clientsRes.ok) {
        const data = await clientsRes.json()
        setClients(data.clients || [])
      }
      if (merchantsRes.ok) {
        const data = await merchantsRes.json()
        setMerchants(data.merchants || [])
      }
      if (usersRes.ok) {
        const data = await usersRes.json()
        setUsers(data.users || [])
      }
      if (inventoryRes.ok) {
        const data = await inventoryRes.json()
        setInventory(data.inventory || [])
      }
      if (customersRes.ok) {
        const data = await customersRes.json()
        setCustomers(data.customers || [])
      }
      if (transfersRes.ok) {
        const data = await transfersRes.json()
        setTransfers(data.transfers || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // CRUD Operations
  const handleAddClient = async () => {
    if (!clientForm.name) {
      toast({ title: 'Error', description: 'Name is required', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/enterprise/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientForm)
      })
      if (res.ok) {
        const data = await res.json()
        setClients(prev => [data.client, ...prev])
        setShowAddClient(false)
        setClientForm({ name: '', tier: 'Silver', creditLimit: '', contactPerson: '', contactEmail: '', contactPhone: '' })
        toast({ title: 'Success', description: 'Corporate client added successfully' })
      } else {
        throw new Error('Failed to add client')
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add corporate client', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleAddMerchant = async () => {
    if (!merchantForm.name || !merchantForm.corporateId) {
      toast({ title: 'Error', description: 'Name and Corporate are required', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/enterprise/merchants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merchantForm)
      })
      if (res.ok) {
        const data = await res.json()
        setMerchants(prev => [data.merchant, ...prev])
        setShowAddMerchant(false)
        setMerchantForm({ name: '', corporateId: '', location: '', vertical: 'Restaurant' })
        toast({ title: 'Success', description: 'Merchant added successfully' })
        fetchData()
      } else {
        throw new Error('Failed to add merchant')
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add merchant', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleAddUser = async () => {
    if (!userForm.name || !userForm.email || !userForm.corporateId) {
      toast({ title: 'Error', description: 'Name, email, and corporate are required', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/enterprise/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm)
      })
      if (res.ok) {
        const data = await res.json()
        setUsers(prev => [data.user, ...prev])
        setShowAddUser(false)
        setUserForm({ name: '', email: '', phone: '', role: 'Viewer', corporateId: '' })
        toast({ title: 'Success', description: 'User added successfully' })
      } else {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to add user')
      }
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to add user', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleAddInventory = async () => {
    if (!inventoryForm.sku || !inventoryForm.name || !inventoryForm.merchantId) {
      toast({ title: 'Error', description: 'SKU, name, and merchant are required', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/enterprise/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inventoryForm)
      })
      if (res.ok) {
        const data = await res.json()
        setInventory(prev => [data.item, ...prev])
        setShowAddInventory(false)
        setInventoryForm({ sku: '', name: '', category: '', stock: '', unit: 'units', lowStock: '', merchantId: '' })
        toast({ title: 'Success', description: 'Inventory item added successfully' })
      } else {
        throw new Error('Failed to add inventory')
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add inventory item', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleAddCustomer = async () => {
    if (!customerForm.name || !customerForm.merchantId) {
      toast({ title: 'Error', description: 'Name and merchant are required', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/enterprise/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerForm)
      })
      if (res.ok) {
        const data = await res.json()
        setCustomers(prev => [data.customer, ...prev])
        setShowAddCustomer(false)
        setCustomerForm({ name: '', email: '', phone: '', tier: 'Bronze', merchantId: '' })
        toast({ title: 'Success', description: 'Customer added successfully' })
      } else {
        throw new Error('Failed to add customer')
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add customer', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleAddApiKey = async () => {
    if (!apiKeyForm.name) {
      toast({ title: 'Error', description: 'Name is required', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const corporateId = clients[0]?.id
      if (!corporateId) {
        toast({ title: 'Error', description: 'No corporate client found', variant: 'destructive' })
        return
      }
      const res = await fetch('/api/enterprise/apikeys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...apiKeyForm, corporateId, permissions: [apiKeyForm.permissions] })
      })
      if (res.ok) {
        const data = await res.json()
        setApiKeys(prev => [data.apiKey, ...prev])
        setShowAddApiKey(false)
        setApiKeyForm({ name: '', permissions: 'read' })
        toast({ title: 'Success', description: `API key created: ${data.apiKey.fullKey}. Save this key - it won't be shown again!` })
      } else {
        throw new Error('Failed to create API key')
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create API key', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveWhiteLabel = async () => {
    setSaving(true)
    try {
      const corporateId = clients[0]?.id
      if (!corporateId) {
        toast({ title: 'Error', description: 'No corporate client found', variant: 'destructive' })
        return
      }
      const res = await fetch('/api/enterprise/whitelabel', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ corporateId, ...whiteLabelForm })
      })
      if (res.ok) {
        const data = await res.json()
        setWhiteLabel(data.settings)
        setShowWhiteLabel(false)
        toast({ title: 'Success', description: 'White label settings saved successfully' })
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save white label settings', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClient = async (id: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return
    try {
      const res = await fetch(`/api/enterprise/clients/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setClients(prev => prev.filter(c => c.id !== id))
        toast({ title: 'Success', description: 'Client deleted successfully' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete client', variant: 'destructive' })
    }
  }

  const handleDeleteMerchant = async (id: string) => {
    if (!confirm('Are you sure you want to delete this merchant?')) return
    try {
      const res = await fetch(`/api/enterprise/merchants/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setMerchants(prev => prev.filter(m => m.id !== id))
        toast({ title: 'Success', description: 'Merchant deleted successfully' })
        fetchData()
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete merchant', variant: 'destructive' })
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    try {
      const res = await fetch(`/api/enterprise/users/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== id))
        toast({ title: 'Success', description: 'User deleted successfully' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete user', variant: 'destructive' })
    }
  }

  // Calculate KPIs
  const totalClients = clients.length
  const totalMerchants = merchants.length
  const totalRevenue = merchants.reduce((sum, m) => sum + (m.monthlyRevenue || 0), 0)
  const totalCreditUsed = clients.reduce((sum, c) => sum + (c.creditUsed || 0), 0)
  const totalCreditLimit = clients.reduce((sum, c) => sum + (c.creditLimit || 0), 0)
  const totalInventoryValue = inventory.reduce((sum, i) => sum + (i.value || 0), 0)
  const lowStockItems = inventory.filter(i => i.stock <= i.lowStock).length
  const pendingTransfers = transfers.filter(t => t.status !== 'completed').length

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Enterprise': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'Platinum': return 'bg-slate-100 text-slate-700 border-slate-200'
      case 'Gold': return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'Silver': return 'bg-gray-100 text-gray-700 border-gray-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Owner': return 'bg-purple-100 text-purple-700'
      case 'Admin': return 'bg-blue-100 text-blue-700'
      case 'Manager': return 'bg-green-100 text-green-700'
      case 'Accountant': return 'bg-amber-100 text-amber-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getTransferStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700'
      case 'in_transit': return 'bg-blue-100 text-blue-700'
      case 'pending': return 'bg-amber-100 text-amber-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  // Render functions for each tab
  const renderOverview = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <Card className="border-l-4 border-l-[#00897B]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575] mb-1">Corporate Clients</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">{totalClients}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#E0F2F1] flex items-center justify-center">
                <Building2 className="h-5 w-5 text-[#00897B]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575] mb-1">Total Merchants</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">{totalMerchants}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Store className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575] mb-1">Monthly Revenue</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">R{(totalRevenue / 1000000).toFixed(1)}M</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575] mb-1">Credit Utilization</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">{totalCreditLimit > 0 ? ((totalCreditUsed / totalCreditLimit) * 100).toFixed(0) : 0}%</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-amber-500" />
              </div>
            </div>
            {totalCreditLimit > 0 && <Progress value={(totalCreditUsed / totalCreditLimit) * 100} className="h-1.5 mt-2" />}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575] mb-1">Total Customers</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">{customers.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575] mb-1">Active Alerts</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">{lowStockItems + pendingTransfers}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-rose-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#E0F2F1] to-[#E8F5E9]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-[#00897B]" />
              <div>
                <p className="text-xs text-[#00695C]">Inventory Value</p>
                <p className="text-lg font-bold text-[#00897B]">R{(totalInventoryValue / 1000000).toFixed(2)}M</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ArrowLeftRight className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-xs text-blue-600">Pending Transfers</p>
                <p className="text-lg font-bold text-blue-700">{pendingTransfers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-xs text-amber-600">Low Stock Items</p>
                <p className="text-lg font-bold text-amber-700">{lowStockItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Key className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-xs text-purple-600">Active API Keys</p>
                <p className="text-lg font-bold text-purple-700">{apiKeys.filter(k => k.status === 'active').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Clients */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Top Corporate Clients</CardTitle>
            <Button variant="ghost" size="sm" className="text-[#00897B]" onClick={() => setActiveTab('clients')}>
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-[#757575]">Loading...</div>
          ) : clients.length === 0 ? (
            <div className="text-center py-8 text-[#757575]">No corporate clients yet. Add one to get started!</div>
          ) : (
            <div className="space-y-3">
              {clients.slice(0, 5).map((client) => (
                <div key={client.id} className="flex items-center justify-between p-3 rounded-lg bg-[#FAFAFA] hover:bg-gray-100 cursor-pointer transition-colors" onClick={() => setSelectedClient(client)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#E0F2F1] flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-[#00897B]" />
                    </div>
                    <div>
                      <p className="font-medium text-[#1A1A1A]">{client.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className={`text-[10px] ${getTierColor(client.tier)}`}>{client.tier}</Badge>
                        <span className="text-xs text-[#757575]">{client._count?.merchants || client.merchantsCount || 0} merchants</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#1A1A1A]">R{((client.monthlyVolume || 0) / 1000000).toFixed(1)}M</p>
                    <p className="text-xs text-[#757575]">monthly volume</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const renderClients = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
            <Input placeholder="Search clients..." className="pl-9" />
          </div>
        </div>
        <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setShowAddClient(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Corporate Client
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-8 text-[#757575]">Loading...</div>
          ) : clients.length === 0 ? (
            <div className="text-center py-8 text-[#757575]">No corporate clients yet. Add one to get started!</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#FAFAFA] border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Client</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Tier</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Merchants</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Monthly Volume</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Credit</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-[#757575]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {clients.map((client) => (
                    <tr key={client.id} className="hover:bg-[#FAFAFA] cursor-pointer" onClick={() => setSelectedClient(client)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-[#E0F2F1] flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-[#00897B]" />
                          </div>
                          <div>
                            <p className="font-medium text-[#1A1A1A]">{client.name}</p>
                            <p className="text-xs text-[#757575]">{client.contactPerson || client.contactEmail || client.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={getTierColor(client.tier)}>{client.tier}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#1A1A1A]">{client._count?.merchants || client.merchantsCount || 0}</td>
                      <td className="px-4 py-3 text-sm font-medium text-[#1A1A1A]">R{((client.monthlyVolume || 0) / 1000000).toFixed(1)}M</td>
                      <td className="px-4 py-3">
                        <div className="w-24">
                          <Progress value={client.creditLimit > 0 ? (client.creditUsed / client.creditLimit) * 100 : 0} className="h-1.5" />
                          <p className="text-xs text-[#757575] mt-0.5">{client.creditLimit > 0 ? ((client.creditUsed / client.creditLimit) * 100).toFixed(0) : 0}%</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className="bg-green-100 text-green-700">{client.status || 'Active'}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedClient(client)}><Eye className="h-4 w-4 mr-2" /> View Details</DropdownMenuItem>
                            <DropdownMenuItem><Edit className="h-4 w-4 mr-2" /> Edit Client</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteClient(client.id)}><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const renderMerchants = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
            <Input placeholder="Search merchants..." className="pl-9" />
          </div>
        </div>
        <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setShowAddMerchant(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Merchant
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8 text-[#757575]">Loading...</div>
        ) : merchants.length === 0 ? (
          <div className="col-span-full text-center py-8 text-[#757575]">No merchants yet. Add one to get started!</div>
        ) : (
          merchants.map((merchant) => (
            <Card key={merchant.id} className="cursor-pointer hover:border-[#00897B]/30 transition-colors" onClick={() => setSelectedMerchant(merchant)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#E0F2F1] flex items-center justify-center">
                      <Store className="h-5 w-5 text-[#00897B]" />
                    </div>
                    <div>
                      <p className="font-medium text-[#1A1A1A] text-sm">{merchant.name}</p>
                      <p className="text-xs text-[#757575]">{merchant.code}</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700 text-[10px]">{merchant.status || 'Active'}</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <Building2 className="h-3.5 w-3.5 text-[#757575]" />
                    <span className="text-[#757575]">{merchant.corporate?.name || 'No Corporate'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <MapPin className="h-3.5 w-3.5 text-[#757575]" />
                    <span className="text-[#757575]">{merchant.location || 'No location'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Layers className="h-3.5 w-3.5 text-[#757575]" />
                    <span className="text-[#757575]">{merchant.vertical || 'No vertical'}</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-xs text-[#757575]">Monthly Revenue</span>
                  <span className="text-sm font-semibold text-[#1A1A1A]">R{((merchant.monthlyRevenue || 0) / 1000).toFixed(0)}K</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
            <Input placeholder="Search users..." className="pl-9" />
          </div>
        </div>
        <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setShowAddUser(true)}>
          <UserPlus className="h-4 w-4 mr-2" /> Add User
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-8 text-[#757575]">Loading...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-[#757575]">No users yet. Add one to get started!</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#FAFAFA] border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">User</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Role</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Corporate Client</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-[#757575]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-[#FAFAFA]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-[#00897B] text-white text-xs">
                              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-[#1A1A1A] text-sm">{user.name}</p>
                            <p className="text-xs text-[#757575]">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#757575]">{user.corporate?.name || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <Badge className="bg-green-100 text-green-700">{user.status || 'Active'}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const renderInventory = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
            <Input placeholder="Search inventory..." className="pl-9" />
          </div>
        </div>
        <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setShowAddInventory(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Inventory Item
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-8 text-[#757575]">Loading...</div>
          ) : inventory.length === 0 ? (
            <div className="text-center py-8 text-[#757575]">No inventory items yet. Add one to get started!</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#FAFAFA] border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">SKU</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Category</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Stock</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Value</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Location</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {inventory.map((item) => (
                    <tr key={item.id} className="hover:bg-[#FAFAFA]">
                      <td className="px-4 py-3 text-sm font-mono text-[#1A1A1A]">{item.sku}</td>
                      <td className="px-4 py-3 text-sm font-medium text-[#1A1A1A]">{item.name}</td>
                      <td className="px-4 py-3 text-sm text-[#757575]">{item.category || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${item.stock <= item.lowStock ? 'text-red-600' : 'text-[#1A1A1A]'}`}>
                            {item.stock} {item.unit}
                          </span>
                          {item.stock <= item.lowStock && (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-[#1A1A1A]">R{(item.value || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-[#757575]">{item.merchant?.name || '-'}</td>
                      <td className="px-4 py-3">
                        <Badge className={item.stock <= item.lowStock ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>
                          {item.stock <= item.lowStock ? 'Low Stock' : 'In Stock'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const renderCustomers = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
            <Input placeholder="Search customers..." className="pl-9" />
          </div>
        </div>
        <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setShowAddCustomer(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Customer
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-8 text-[#757575]">Loading...</div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8 text-[#757575]">No customers yet. Add one to get started!</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#FAFAFA] border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Customer</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Contact</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Tier</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Total Spent</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Visits</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Branch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-[#FAFAFA]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-[#00897B] text-white text-xs">
                              {customer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-[#1A1A1A] text-sm">{customer.name}</p>
                            <p className="text-xs text-[#757575]">{customer.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs">
                          <p className="text-[#757575]">{customer.email || '-'}</p>
                          <p className="text-[#757575]">{customer.phone || '-'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={getTierColor(customer.tier)}>{customer.tier}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-[#1A1A1A]">R{(customer.totalSpent || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-[#1A1A1A]">{customer.visitCount || 0}</td>
                      <td className="px-4 py-3 text-sm text-[#757575]">{customer.merchant?.name || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const renderTransfers = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
            <Input placeholder="Search transfers..." className="pl-9" />
          </div>
        </div>
        <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setShowAddTransfer(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Transfer
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-8 text-[#757575]">Loading...</div>
          ) : transfers.length === 0 ? (
            <div className="text-center py-8 text-[#757575]">No transfers yet. Create one to get started!</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#FAFAFA] border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Transfer ID</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">From</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">To</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Items</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Value</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transfers.map((transfer) => (
                    <tr key={transfer.id} className="hover:bg-[#FAFAFA]">
                      <td className="px-4 py-3 text-sm font-mono text-[#1A1A1A]">{transfer.code}</td>
                      <td className="px-4 py-3 text-sm text-[#1A1A1A]">{transfer.fromMerchant?.name || 'Unknown'}</td>
                      <td className="px-4 py-3 text-sm text-[#1A1A1A]">{transfer.toMerchant?.name || 'Unknown'}</td>
                      <td className="px-4 py-3 text-sm text-[#1A1A1A]">{transfer.itemsCount || 0}</td>
                      <td className="px-4 py-3 text-sm font-medium text-[#1A1A1A]">R{(transfer.totalValue || 0).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <Badge className={getTransferStatusColor(transfer.status)}>{transfer.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const renderReports = () => (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#757575]" />
              <Select defaultValue="this-month">
                <SelectTrigger className="w-40"><SelectValue placeholder="Period" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="this-quarter">This Quarter</SelectItem>
                  <SelectItem value="this-year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" className="ml-auto">
              <Download className="h-4 w-4 mr-2" /> Export Report
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-[#757575]">Total Revenue</p>
                <p className="text-xl font-bold text-[#1A1A1A]">R{(totalRevenue / 1000000).toFixed(1)}M</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-[#757575]">Active Merchants</p>
                <p className="text-xl font-bold text-[#1A1A1A]">{totalMerchants}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-[#757575]">Total Customers</p>
                <p className="text-xl font-bold text-[#1A1A1A]">{customers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <Package className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-[#757575]">Inventory Value</p>
                <p className="text-xl font-bold text-[#1A1A1A]">R{(totalInventoryValue / 1000000).toFixed(2)}M</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Revenue by Corporate Client</CardTitle>
          </CardHeader>
          <CardContent>
            {clients.length === 0 ? (
              <div className="text-center py-8 text-[#757575]">No data available</div>
            ) : (
              <div className="space-y-3">
                {clients.slice(0, 5).map((client) => {
                  const percentage = totalRevenue > 0 ? ((client.monthlyVolume || 0) / totalRevenue) * 100 : 0
                  return (
                    <div key={client.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[#1A1A1A]">{client.name}</span>
                        <span className="font-medium text-[#1A1A1A]">R{((client.monthlyVolume || 0) / 1000000).toFixed(1)}M</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Branch Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {merchants.length === 0 ? (
              <div className="text-center py-8 text-[#757575]">No data available</div>
            ) : (
              <div className="space-y-3">
                {merchants.sort((a, b) => (b.monthlyRevenue || 0) - (a.monthlyRevenue || 0)).slice(0, 5).map((merchant) => {
                  const percentage = totalRevenue > 0 ? ((merchant.monthlyRevenue || 0) / totalRevenue) * 100 * 3 : 0
                  return (
                    <div key={merchant.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[#1A1A1A] truncate max-w-[200px]">{merchant.name}</span>
                        <span className="font-medium text-[#1A1A1A]">R{((merchant.monthlyRevenue || 0) / 1000).toFixed(0)}K</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderBilling = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[#00897B]">
          <CardContent className="p-4">
            <p className="text-xs text-[#757575] mb-1">Total Credit Limit</p>
            <p className="text-2xl font-bold text-[#1A1A1A]">R{(totalCreditLimit / 1000000).toFixed(1)}M</p>
            <p className="text-xs text-[#757575] mt-1">Across {totalClients} clients</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <p className="text-xs text-[#757575] mb-1">Credit Utilized</p>
            <p className="text-2xl font-bold text-[#1A1A1A]">R{(totalCreditUsed / 1000000).toFixed(1)}M</p>
            {totalCreditLimit > 0 && <Progress value={(totalCreditUsed / totalCreditLimit) * 100} className="h-1.5 mt-2" />}
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <p className="text-xs text-[#757575] mb-1">Available Credit</p>
            <p className="text-2xl font-bold text-green-600">R{((totalCreditLimit - totalCreditUsed) / 1000000).toFixed(1)}M</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <p className="text-xs text-[#757575] mb-1">Utilization Rate</p>
            <p className="text-2xl font-bold text-amber-600">{totalCreditLimit > 0 ? ((totalCreditUsed / totalCreditLimit) * 100).toFixed(0) : 0}%</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Credit Facilities</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#FAFAFA] border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Corporate Client</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Credit Limit</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Utilized</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Available</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Utilization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-[#FAFAFA]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#E0F2F1] flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-[#00897B]" />
                        </div>
                        <div>
                          <p className="font-medium text-[#1A1A1A] text-sm">{client.name}</p>
                          <Badge variant="outline" className={`text-[10px] mt-0.5 ${getTierColor(client.tier)}`}>{client.tier}</Badge>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-[#1A1A1A]">R{((client.creditLimit || 0) / 1000000).toFixed(1)}M</td>
                    <td className="px-4 py-3 text-[#1A1A1A]">R{((client.creditUsed || 0) / 1000000).toFixed(1)}M</td>
                    <td className="px-4 py-3 text-green-600 font-medium">R{(((client.creditLimit || 0) - (client.creditUsed || 0)) / 1000000).toFixed(1)}M</td>
                    <td className="px-4 py-3">
                      <div className="w-24">
                        <Progress value={client.creditLimit > 0 ? (client.creditUsed / client.creditLimit) * 100 : 0} className="h-2" />
                        <p className="text-xs text-[#757575] mt-0.5">{client.creditLimit > 0 ? ((client.creditUsed / client.creditLimit) * 100).toFixed(0) : 0}%</p>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderApi = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Key className="h-4 w-4 text-[#00897B]" /> API Keys
              </CardTitle>
              <CardDescription className="text-xs mt-1">Manage API keys for programmatic access</CardDescription>
            </div>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setShowAddApiKey(true)}>
              <Plus className="h-4 w-4 mr-2" /> Create API Key
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#FAFAFA] border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Key</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#757575]">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {apiKeys.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-[#757575]">No API keys yet. Create one to get started!</td>
                  </tr>
                ) : (
                  apiKeys.map((key) => (
                    <tr key={key.id} className="hover:bg-[#FAFAFA]">
                      <td className="px-4 py-3 font-medium text-[#1A1A1A] text-sm">{key.name}</td>
                      <td className="px-4 py-3">
                        <code className="text-xs bg-[#FAFAFA] px-2 py-1 rounded">{key.keyPrefix}</code>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={key.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>{key.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#757575]">{new Date(key.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderBranding = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Palette className="h-4 w-4 text-[#00897B]" /> White Label Settings
          </CardTitle>
          <CardDescription className="text-xs mt-1">Customize the look and feel of your portal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Primary Color</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <Input type="color" value={whiteLabelForm.primaryColor} onChange={(e) => setWhiteLabelForm(prev => ({ ...prev, primaryColor: e.target.value }))} className="w-12 h-10 p-1" />
                <Input value={whiteLabelForm.primaryColor} onChange={(e) => setWhiteLabelForm(prev => ({ ...prev, primaryColor: e.target.value }))} className="flex-1" />
              </div>
            </div>
            <div>
              <Label>Secondary Color</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <Input type="color" value={whiteLabelForm.secondaryColor} onChange={(e) => setWhiteLabelForm(prev => ({ ...prev, secondaryColor: e.target.value }))} className="w-12 h-10 p-1" />
                <Input value={whiteLabelForm.secondaryColor} onChange={(e) => setWhiteLabelForm(prev => ({ ...prev, secondaryColor: e.target.value }))} className="flex-1" />
              </div>
            </div>
            <div>
              <Label>Accent Color</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <Input type="color" value={whiteLabelForm.accentColor} onChange={(e) => setWhiteLabelForm(prev => ({ ...prev, accentColor: e.target.value }))} className="w-12 h-10 p-1" />
                <Input value={whiteLabelForm.accentColor} onChange={(e) => setWhiteLabelForm(prev => ({ ...prev, accentColor: e.target.value }))} className="flex-1" />
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Company Name</Label>
              <Input value={whiteLabelForm.companyName} onChange={(e) => setWhiteLabelForm(prev => ({ ...prev, companyName: e.target.value }))} placeholder="Your Company Name" className="mt-1.5" />
            </div>
            <div>
              <Label>Tagline</Label>
              <Input value={whiteLabelForm.tagline} onChange={(e) => setWhiteLabelForm(prev => ({ ...prev, tagline: e.target.value }))} placeholder="Your Tagline" className="mt-1.5" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setWhiteLabelForm({ primaryColor: '#00897B', secondaryColor: '#00695C', accentColor: '#4CAF50', companyName: '', tagline: '' })}>
              Reset to Default
            </Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleSaveWhiteLabel} disabled={saving}>
              <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-6 rounded-lg border-2 border-dashed" style={{ borderColor: whiteLabelForm.primaryColor }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: whiteLabelForm.primaryColor }}>
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg" style={{ color: whiteLabelForm.primaryColor }}>{whiteLabelForm.companyName || 'Your Company'}</h3>
                <p className="text-sm text-[#757575]">{whiteLabelForm.tagline || 'Your tagline here'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" style={{ backgroundColor: whiteLabelForm.primaryColor }}>Primary Button</Button>
              <Button size="sm" variant="outline" style={{ borderColor: whiteLabelForm.primaryColor, color: whiteLabelForm.primaryColor }}>Secondary Button</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderSupport = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Support Center</CardTitle>
          <CardDescription>Get help with your Enterprise Portal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[#E0F2F1] flex items-center justify-center">
                    <FileText className="h-5 w-5 text-[#00897B]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#1A1A1A]">Documentation</p>
                    <p className="text-xs text-[#757575]">Guides and tutorials</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full">View Docs</Button>
              </CardContent>
            </Card>
            <Card className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[#E0F2F1] flex items-center justify-center">
                    <Headphones className="h-5 w-5 text-[#00897B]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#1A1A1A]">Contact Support</p>
                    <p className="text-xs text-[#757575]">24/7 assistance</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full">Contact Us</Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview()
      case 'clients': return renderClients()
      case 'merchants': return renderMerchants()
      case 'inventory': return renderInventory()
      case 'transfers': return renderTransfers()
      case 'customers': return renderCustomers()
      case 'users': return renderUsers()
      case 'reports': return renderReports()
      case 'billing': return renderBilling()
      case 'api': return renderApi()
      case 'branding': return renderBranding()
      case 'support': return renderSupport()
      default: return renderOverview()
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 hidden lg:flex flex-col transition-all duration-300`}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {sidebarOpen && <img src="/groway-logo.png" alt="Groway" className="h-8 w-auto" />}
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
          <Button variant="ghost" className="w-full justify-start text-[#757575]" onClick={() => {}}>
            <LogOut className="h-4 w-4 mr-2" />
            {sidebarOpen && 'Sign Out'}
          </Button>
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
              <p className="text-xs text-[#757575]">Manage your enterprise operations</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5 text-[#757575]" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">3</span>
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-[#00897B] text-white text-xs">EP</AvatarFallback>
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
              <img src="/groway-logo.png" alt="Groway" className="h-8 w-auto" />
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

      {/* Add Client Dialog */}
      <Dialog open={showAddClient} onOpenChange={setShowAddClient}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Corporate Client</DialogTitle>
            <DialogDescription>Add a new corporate client to your enterprise</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Company Name *</Label>
              <Input value={clientForm.name} onChange={(e) => setClientForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Company name" className="mt-1.5" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tier</Label>
                <Select value={clientForm.tier} onValueChange={(v) => setClientForm(prev => ({ ...prev, tier: v }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Silver">Silver</SelectItem>
                    <SelectItem value="Gold">Gold</SelectItem>
                    <SelectItem value="Platinum">Platinum</SelectItem>
                    <SelectItem value="Enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Credit Limit</Label>
                <Input value={clientForm.creditLimit} onChange={(e) => setClientForm(prev => ({ ...prev, creditLimit: e.target.value }))} placeholder="0" className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label>Contact Person</Label>
              <Input value={clientForm.contactPerson} onChange={(e) => setClientForm(prev => ({ ...prev, contactPerson: e.target.value }))} placeholder="Contact name" className="mt-1.5" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input value={clientForm.contactEmail} onChange={(e) => setClientForm(prev => ({ ...prev, contactEmail: e.target.value }))} placeholder="email@company.com" className="mt-1.5" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={clientForm.contactPhone} onChange={(e) => setClientForm(prev => ({ ...prev, contactPhone: e.target.value }))} placeholder="+27 XX XXX XXXX" className="mt-1.5" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddClient(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleAddClient} disabled={saving}>
              {saving ? 'Adding...' : 'Add Client'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Merchant Dialog */}
      <Dialog open={showAddMerchant} onOpenChange={setShowAddMerchant}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Merchant</DialogTitle>
            <DialogDescription>Add a new merchant/branch to a corporate client</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Merchant Name *</Label>
              <Input value={merchantForm.name} onChange={(e) => setMerchantForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Branch name" className="mt-1.5" />
            </div>
            <div>
              <Label>Corporate Client *</Label>
              <Select value={merchantForm.corporateId} onValueChange={(v) => setMerchantForm(prev => ({ ...prev, corporateId: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select corporate client" /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Location</Label>
                <Input value={merchantForm.location} onChange={(e) => setMerchantForm(prev => ({ ...prev, location: e.target.value }))} placeholder="City" className="mt-1.5" />
              </div>
              <div>
                <Label>Vertical</Label>
                <Select value={merchantForm.vertical} onValueChange={(v) => setMerchantForm(prev => ({ ...prev, vertical: v }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Restaurant">Restaurant</SelectItem>
                    <SelectItem value="Grocery">Grocery</SelectItem>
                    <SelectItem value="Pharmacy">Pharmacy</SelectItem>
                    <SelectItem value="QSR">QSR</SelectItem>
                    <SelectItem value="Retail">Retail</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMerchant(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleAddMerchant} disabled={saving}>
              {saving ? 'Adding...' : 'Add Merchant'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>Add a new user to the enterprise portal</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Full Name *</Label>
              <Input value={userForm.name} onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))} placeholder="User name" className="mt-1.5" />
            </div>
            <div>
              <Label>Email *</Label>
              <Input value={userForm.email} onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))} placeholder="email@company.com" type="email" className="mt-1.5" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phone</Label>
                <Input value={userForm.phone} onChange={(e) => setUserForm(prev => ({ ...prev, phone: e.target.value }))} placeholder="+27 XX XXX XXXX" className="mt-1.5" />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={userForm.role} onValueChange={(v) => setUserForm(prev => ({ ...prev, role: v }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Owner">Owner</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Accountant">Accountant</SelectItem>
                    <SelectItem value="Viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Corporate Client *</Label>
              <Select value={userForm.corporateId} onValueChange={(v) => setUserForm(prev => ({ ...prev, corporateId: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select corporate client" /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUser(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleAddUser} disabled={saving}>
              {saving ? 'Adding...' : 'Add User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Inventory Dialog */}
      <Dialog open={showAddInventory} onOpenChange={setShowAddInventory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Inventory Item</DialogTitle>
            <DialogDescription>Add a new inventory item to a merchant</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>SKU *</Label>
                <Input value={inventoryForm.sku} onChange={(e) => setInventoryForm(prev => ({ ...prev, sku: e.target.value }))} placeholder="SKU-001" className="mt-1.5" />
              </div>
              <div>
                <Label>Name *</Label>
                <Input value={inventoryForm.name} onChange={(e) => setInventoryForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Product name" className="mt-1.5" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Input value={inventoryForm.category} onChange={(e) => setInventoryForm(prev => ({ ...prev, category: e.target.value }))} placeholder="Category" className="mt-1.5" />
              </div>
              <div>
                <Label>Unit</Label>
                <Select value={inventoryForm.unit} onValueChange={(v) => setInventoryForm(prev => ({ ...prev, unit: v }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="units">Units</SelectItem>
                    <SelectItem value="kg">Kg</SelectItem>
                    <SelectItem value="liters">Liters</SelectItem>
                    <SelectItem value="tabs">Tabs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Stock</Label>
                <Input value={inventoryForm.stock} onChange={(e) => setInventoryForm(prev => ({ ...prev, stock: e.target.value }))} placeholder="0" type="number" className="mt-1.5" />
              </div>
              <div>
                <Label>Low Stock Threshold</Label>
                <Input value={inventoryForm.lowStock} onChange={(e) => setInventoryForm(prev => ({ ...prev, lowStock: e.target.value }))} placeholder="0" type="number" className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label>Merchant *</Label>
              <Select value={inventoryForm.merchantId} onValueChange={(v) => setInventoryForm(prev => ({ ...prev, merchantId: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select merchant" /></SelectTrigger>
                <SelectContent>
                  {merchants.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddInventory(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleAddInventory} disabled={saving}>
              {saving ? 'Adding...' : 'Add Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Customer Dialog */}
      <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
            <DialogDescription>Add a new customer to a merchant</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Customer Name *</Label>
              <Input value={customerForm.name} onChange={(e) => setCustomerForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Full name" className="mt-1.5" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input value={customerForm.email} onChange={(e) => setCustomerForm(prev => ({ ...prev, email: e.target.value }))} placeholder="email@example.com" className="mt-1.5" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={customerForm.phone} onChange={(e) => setCustomerForm(prev => ({ ...prev, phone: e.target.value }))} placeholder="+27 XX XXX XXXX" className="mt-1.5" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tier</Label>
                <Select value={customerForm.tier} onValueChange={(v) => setCustomerForm(prev => ({ ...prev, tier: v }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bronze">Bronze</SelectItem>
                    <SelectItem value="Silver">Silver</SelectItem>
                    <SelectItem value="Gold">Gold</SelectItem>
                    <SelectItem value="Platinum">Platinum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Merchant *</Label>
                <Select value={customerForm.merchantId} onValueChange={(v) => setCustomerForm(prev => ({ ...prev, merchantId: v }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select merchant" /></SelectTrigger>
                  <SelectContent>
                    {merchants.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCustomer(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleAddCustomer} disabled={saving}>
              {saving ? 'Adding...' : 'Add Customer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add API Key Dialog */}
      <Dialog open={showAddApiKey} onOpenChange={setShowAddApiKey}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>Generate a new API key for programmatic access</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Key Name *</Label>
              <Input value={apiKeyForm.name} onChange={(e) => setApiKeyForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g., Production Key" className="mt-1.5" />
            </div>
            <div>
              <Label>Permissions</Label>
              <Select value={apiKeyForm.permissions} onValueChange={(v) => setApiKeyForm(prev => ({ ...prev, permissions: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="read">Read Only</SelectItem>
                  <SelectItem value="write">Read & Write</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddApiKey(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleAddApiKey} disabled={saving}>
              {saving ? 'Creating...' : 'Create Key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Client Details Dialog */}
      <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedClient?.name}</DialogTitle>
            <DialogDescription>Corporate Client Details</DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge className={getTierColor(selectedClient.tier)}>{selectedClient.tier}</Badge>
                <Badge className="bg-green-100 text-green-700">{selectedClient.status || 'Active'}</Badge>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[#757575]">Contact</p>
                  <p className="font-medium">{selectedClient.contactPerson || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[#757575]">Email</p>
                  <p className="font-medium">{selectedClient.contactEmail || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[#757575]">Phone</p>
                  <p className="font-medium">{selectedClient.contactPhone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[#757575]">Merchants</p>
                  <p className="font-medium">{selectedClient._count?.merchants || selectedClient.merchantsCount || 0}</p>
                </div>
                <div>
                  <p className="text-[#757575]">Monthly Volume</p>
                  <p className="font-medium">R{((selectedClient.monthlyVolume || 0) / 1000000).toFixed(1)}M</p>
                </div>
                <div>
                  <p className="text-[#757575]">Credit Limit</p>
                  <p className="font-medium">R{((selectedClient.creditLimit || 0) / 1000000).toFixed(1)}M</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Merchant Details Dialog */}
      <Dialog open={!!selectedMerchant} onOpenChange={() => setSelectedMerchant(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedMerchant?.name}</DialogTitle>
            <DialogDescription>Merchant Details</DialogDescription>
          </DialogHeader>
          {selectedMerchant && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge className="bg-green-100 text-green-700">{selectedMerchant.status || 'Active'}</Badge>
                <Badge variant="outline">{selectedMerchant.vertical || 'N/A'}</Badge>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[#757575]">Code</p>
                  <p className="font-medium">{selectedMerchant.code}</p>
                </div>
                <div>
                  <p className="text-[#757575]">Location</p>
                  <p className="font-medium">{selectedMerchant.location || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[#757575]">Corporate</p>
                  <p className="font-medium">{selectedMerchant.corporate?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[#757575]">Monthly Revenue</p>
                  <p className="font-medium">R{((selectedMerchant.monthlyRevenue || 0) / 1000).toFixed(0)}K</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedMerchant(null)}>Close</Button>
                <Button variant="destructive" onClick={() => { handleDeleteMerchant(selectedMerchant.id); setSelectedMerchant(null) }}>Delete Merchant</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Main Page Component
export default function EnterprisePortalPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => setIsLoggedIn(true)} />
  }

  return <DashboardContent />
}
