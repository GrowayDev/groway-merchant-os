'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Building2,
  Users,
  Package,
  Coins,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ArrowLeftRight,
  RefreshCw,
  Plus,
  Settings,
  Eye,
  MoreHorizontal,
  CheckCircle2,
  AlertCircle,
  Clock,
  Truck,
  BarChart3,
  PieChart,
  Activity,
  Globe,
  Phone,
  Mail,
  User,
  Calendar,
  FileText,
  Download,
  Filter,
  Search,
  ChevronRight,
  Store,
  Warehouse,
  ShoppingBag,
  Coffee,
  Pill,
  Scissors,
  Zap,
  Target,
  Bot,
  Lightbulb,
  AlertTriangle,
  Info,
  X,
  Shield,
  CreditCard,
  PiggyBank,
  LineChart,
  Bell,
  Key,
  UserPlus,
  UserCog,
  Building,
  MapPin,
  Briefcase,
  Star,
  Award,
  Lock,
  Unlock,
  Layers,
  Network,
  Crown,
  Settings2,
  PieChart as PieChartIcon,
  BarChart2,
  TrendingUp as TrendingUpIcon,
  Wallet,
  Landmark,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  CalendarDays,
  ChevronDown,
  ExternalLink,
  Calculator,
} from 'lucide-react'

// ============================================
// TYPES
// ============================================

interface CorporateClient {
  id: string
  name: string
  tradingName: string
  registrationNumber: string
  vatNumber: string
  tier: 'silver' | 'gold' | 'platinum' | 'enterprise'
  status: 'active' | 'inactive' | 'pending' | 'suspended'
  contact: {
    primaryContact: string
    email: string
    phone: string
    billingEmail: string
  }
  address: {
    street: string
    city: string
    province: string
    postalCode: string
    country: string
  }
  merchants: string[]
  users: number
  createdAt: string
  billing: {
    monthlyFee: number
    billingCycle: string
    paymentMethod: string
    lastPayment: string
    nextPayment: string
  }
  creditFacility?: {
    limit: number
    used: number
    available: number
    interestRate: number
    nextPayment: string
  }
}

interface Merchant {
  id: string
  corporateId: string
  name: string
  tradingName: string
  vertical: string
  subVertical: string
  type: 'owned' | 'franchise' | 'partner'
  status: 'active' | 'inactive' | 'maintenance'
  location: {
    address: string
    city: string
    province: string
    coordinates?: { lat: number; lng: number }
  }
  manager: {
    name: string
    email: string
    phone: string
  }
  stats: {
    dailyRevenue: number
    monthlyRevenue: number
    transactions: number
    staff: number
    inventory: number
    customers: number
  }
  integrations: string[]
  createdAt: string
}

interface CorporateUser {
  id: string
  corporateId: string
  name: string
  email: string
  role: 'owner' | 'admin' | 'manager' | 'viewer' | 'accountant'
  permissions: string[]
  status: 'active' | 'inactive' | 'pending'
  lastLogin: string
  twoFactorEnabled: boolean
  createdAt: string
}

interface ConsolidatedReport {
  period: string
  totalRevenue: number
  revenueGrowth: number
  totalTransactions: number
  avgTransactionValue: number
  topMerchants: { name: string; revenue: number; growth: number }[]
  topProducts: { name: string; sold: number; revenue: number }[]
  expenses: { category: string; amount: number }[]
  profitMargin: number
  creditUtilization?: number
}

// ============================================
// SAMPLE DATA
// ============================================

const sampleCorporateClients: CorporateClient[] = [
  {
    id: 'corp-001',
    name: 'Khulisa Holdings (Pty) Ltd',
    tradingName: 'Khulisa Group',
    registrationNumber: '2023/123456/07',
    vatNumber: '4123456789',
    tier: 'platinum',
    status: 'active',
    contact: {
      primaryContact: 'Sipho Mokoena',
      email: 'sipho@khulisa.co.za',
      phone: '+27 11 234 5678',
      billingEmail: 'accounts@khulisa.co.za',
    },
    address: {
      street: '123 Rivonia Road',
      city: 'Sandton',
      province: 'Gauteng',
      postalCode: '2196',
      country: 'South Africa',
    },
    merchants: ['merch-001', 'merch-002', 'merch-003', 'merch-004', 'merch-005'],
    users: 12,
    createdAt: '2024-01-15',
    billing: {
      monthlyFee: 15000,
      billingCycle: 'Monthly',
      paymentMethod: 'Debit Order',
      lastPayment: '2026-02-01',
      nextPayment: '2026-03-01',
    },
    creditFacility: {
      limit: 500000,
      used: 125000,
      available: 375000,
      interestRate: 11.5,
      nextPayment: '2026-03-15',
    },
  },
  {
    id: 'corp-002',
    name: 'Nandoni Retail Group',
    tradingName: 'Nandoni Stores',
    registrationNumber: '2022/987654/07',
    vatNumber: '4987654321',
    tier: 'gold',
    status: 'active',
    contact: {
      primaryContact: 'Nandi Zulu',
      email: 'nandi@nandoni.co.za',
      phone: '+27 31 456 7890',
      billingEmail: 'finance@nandoni.co.za',
    },
    address: {
      street: '45 Florida Road',
      city: 'Durban',
      province: 'KwaZulu-Natal',
      postalCode: '4001',
      country: 'South Africa',
    },
    merchants: ['merch-006', 'merch-007', 'merch-008'],
    users: 8,
    createdAt: '2024-03-20',
    billing: {
      monthlyFee: 8500,
      billingCycle: 'Monthly',
      paymentMethod: 'EFT',
      lastPayment: '2026-02-05',
      nextPayment: '2026-03-05',
    },
    creditFacility: {
      limit: 250000,
      used: 78000,
      available: 172000,
      interestRate: 12.25,
      nextPayment: '2026-03-10',
    },
  },
  {
    id: 'corp-003',
    name: 'Cape Fresh Markets',
    tradingName: 'Cape Fresh',
    registrationNumber: '2024/555123/07',
    vatNumber: '4555123456',
    tier: 'silver',
    status: 'pending',
    contact: {
      primaryContact: 'Johan de Wet',
      email: 'johan@capefresh.co.za',
      phone: '+27 21 567 8901',
      billingEmail: 'admin@capefresh.co.za',
    },
    address: {
      street: '78 Long Street',
      city: 'Cape Town',
      province: 'Western Cape',
      postalCode: '8001',
      country: 'South Africa',
    },
    merchants: ['merch-009'],
    users: 4,
    createdAt: '2026-01-10',
    billing: {
      monthlyFee: 3500,
      billingCycle: 'Monthly',
      paymentMethod: 'Credit Card',
      lastPayment: '2026-02-10',
      nextPayment: '2026-03-10',
    },
  },
]

const sampleMerchants: Merchant[] = [
  {
    id: 'merch-001',
    corporateId: 'corp-001',
    name: 'Khulisa Supermarket - Sandton',
    tradingName: 'Khulisa Sandton',
    vertical: 'grocery',
    subVertical: 'superette',
    type: 'owned',
    status: 'active',
    location: {
      address: 'Sandton City Mall',
      city: 'Sandton',
      province: 'Gauteng',
      coordinates: { lat: -26.1076, lng: 28.0567 },
    },
    manager: {
      name: 'Thabo Mokoena',
      email: 'thabo@khulisa.co.za',
      phone: '+27 82 123 4567',
    },
    stats: {
      dailyRevenue: 78500,
      monthlyRevenue: 2345000,
      transactions: 456,
      staff: 18,
      inventory: 3456,
      customers: 2345,
    },
    integrations: ['GroSupply', 'GroCredit', 'Loyalty'],
    createdAt: '2024-01-20',
  },
  {
    id: 'merch-002',
    corporateId: 'corp-001',
    name: 'Khulisa Pharmacy - Rosebank',
    tradingName: 'Khulisa Pharmacy',
    vertical: 'health-pharmacy',
    subVertical: 'pharmacy',
    type: 'owned',
    status: 'active',
    location: {
      address: 'The Zone @ Rosebank',
      city: 'Johannesburg',
      province: 'Gauteng',
      coordinates: { lat: -26.1458, lng: 28.0414 },
    },
    manager: {
      name: 'Dr. Sarah Ndlovu',
      email: 'sarah@khulisa.co.za',
      phone: '+27 83 234 5678',
    },
    stats: {
      dailyRevenue: 45600,
      monthlyRevenue: 1368000,
      transactions: 189,
      staff: 12,
      inventory: 2890,
      customers: 1567,
    },
    integrations: ['GroSupply', 'Medical Aid', 'Prescriptions'],
    createdAt: '2024-02-15',
  },
  {
    id: 'merch-003',
    corporateId: 'corp-001',
    name: 'Khulisa Restaurant - Melrose',
    tradingName: 'Khulisa Kitchen',
    vertical: 'fnb',
    subVertical: 'sitdown',
    type: 'owned',
    status: 'active',
    location: {
      address: 'Melrose Arch',
      city: 'Johannesburg',
      province: 'Gauteng',
      coordinates: { lat: -26.1372, lng: 28.0566 },
    },
    manager: {
      name: 'Peter Ndaba',
      email: 'peter@khulisa.co.za',
      phone: '+27 84 345 6789',
    },
    stats: {
      dailyRevenue: 32400,
      monthlyRevenue: 972000,
      transactions: 234,
      staff: 24,
      inventory: 567,
      customers: 890,
    },
    integrations: ['GroSupply', 'QR Menu', 'Bookings'],
    createdAt: '2024-03-10',
  },
  {
    id: 'merch-004',
    corporateId: 'corp-001',
    name: 'Khulisa Salon - Fourways',
    tradingName: 'Khulisa Beauty',
    vertical: 'health-beauty',
    subVertical: 'hair-salon',
    type: 'franchise',
    status: 'active',
    location: {
      address: 'Fourways Mall',
      city: 'Fourways',
      province: 'Gauteng',
      coordinates: { lat: -26.0256, lng: 28.0142 },
    },
    manager: {
      name: 'Precious Molefe',
      email: 'precious@khulisa.co.za',
      phone: '+27 85 456 7890',
    },
    stats: {
      dailyRevenue: 18500,
      monthlyRevenue: 555000,
      transactions: 67,
      staff: 8,
      inventory: 234,
      customers: 456,
    },
    integrations: ['Bookings', 'Loyalty', 'Marketing'],
    createdAt: '2024-05-01',
  },
  {
    id: 'merch-005',
    corporateId: 'corp-001',
    name: 'Khulisa Liquor - Midrand',
    tradingName: 'Khulisa Liquor Store',
    vertical: 'liquor',
    subVertical: 'liquor-store',
    type: 'owned',
    status: 'inactive',
    location: {
      address: 'Midrand Mall',
      city: 'Midrand',
      province: 'Gauteng',
      coordinates: { lat: -25.9923, lng: 28.1256 },
    },
    manager: {
      name: 'Michael Sithole',
      email: 'michael@khulisa.co.za',
      phone: '+27 86 567 8901',
    },
    stats: {
      dailyRevenue: 0,
      monthlyRevenue: 0,
      transactions: 0,
      staff: 6,
      inventory: 1234,
      customers: 678,
    },
    integrations: ['GroSupply', 'Age Verification'],
    createdAt: '2024-06-15',
  },
  {
    id: 'merch-006',
    corporateId: 'corp-002',
    name: 'Nandoni Supermarket - Durban Central',
    tradingName: 'Nandoni Central',
    vertical: 'grocery',
    subVertical: 'superette',
    type: 'owned',
    status: 'active',
    location: {
      address: ' Workshop Mall',
      city: 'Durban',
      province: 'KwaZulu-Natal',
      coordinates: { lat: -29.8587, lng: 31.0218 },
    },
    manager: {
      name: 'Sipho Dlamini',
      email: 'sipho.d@nandoni.co.za',
      phone: '+27 72 678 9012',
    },
    stats: {
      dailyRevenue: 56700,
      monthlyRevenue: 1701000,
      transactions: 389,
      staff: 15,
      inventory: 2890,
      customers: 1890,
    },
    integrations: ['GroSupply', 'GroCredit', 'Loyalty'],
    createdAt: '2024-04-01',
  },
  {
    id: 'merch-007',
    corporateId: 'corp-002',
    name: 'Nandoni Butchery - Umhlanga',
    tradingName: 'Nandoni Butchery',
    vertical: 'grocery',
    subVertical: 'butchery',
    type: 'owned',
    status: 'active',
    location: {
      address: 'Gateway Mall',
      city: 'Umhlanga',
      province: 'KwaZulu-Natal',
      coordinates: { lat: -29.7267, lng: 31.0694 },
    },
    manager: {
      name: 'Bheki Zulu',
      email: 'bheki@nandoni.co.za',
      phone: '+27 73 789 0123',
    },
    stats: {
      dailyRevenue: 34500,
      monthlyRevenue: 1035000,
      transactions: 198,
      staff: 9,
      inventory: 1234,
      customers: 890,
    },
    integrations: ['GroSupply', 'Inventory'],
    createdAt: '2024-05-15',
  },
  {
    id: 'merch-008',
    corporateId: 'corp-002',
    name: 'Nandoni Cafe - Ballito',
    tradingName: 'Nandoni Cafe',
    vertical: 'fnb',
    subVertical: 'coffee-shop',
    type: 'franchise',
    status: 'active',
    location: {
      address: 'Ballito Junction',
      city: 'Ballito',
      province: 'KwaZulu-Natal',
      coordinates: { lat: -29.5447, lng: 31.2103 },
    },
    manager: {
      name: 'Zanele Nkosi',
      email: 'zanele@nandoni.co.za',
      phone: '+27 74 890 1234',
    },
    stats: {
      dailyRevenue: 12300,
      monthlyRevenue: 369000,
      transactions: 156,
      staff: 6,
      inventory: 189,
      customers: 567,
    },
    integrations: ['QR Menu', 'Bookings', 'Loyalty'],
    createdAt: '2024-08-01',
  },
  {
    id: 'merch-009',
    corporateId: 'corp-003',
    name: 'Cape Fresh Market - V&A',
    tradingName: 'Cape Fresh V&A',
    vertical: 'grocery',
    subVertical: 'farm-stall',
    type: 'owned',
    status: 'active',
    location: {
      address: 'V&A Waterfront',
      city: 'Cape Town',
      province: 'Western Cape',
      coordinates: { lat: -33.9047, lng: 18.4230 },
    },
    manager: {
      name: 'Pieter van Zyl',
      email: 'pieter@capefresh.co.za',
      phone: '+27 76 901 2345',
    },
    stats: {
      dailyRevenue: 28900,
      monthlyRevenue: 867000,
      transactions: 234,
      staff: 8,
      inventory: 1567,
      customers: 1234,
    },
    integrations: ['GroSupply'],
    createdAt: '2026-01-15',
  },
]

const sampleCorporateUsers: CorporateUser[] = [
  {
    id: 'user-001',
    corporateId: 'corp-001',
    name: 'Sipho Mokoena',
    email: 'sipho@khulisa.co.za',
    role: 'owner',
    permissions: ['all'],
    status: 'active',
    lastLogin: '2026-02-10T08:30:00Z',
    twoFactorEnabled: true,
    createdAt: '2024-01-15',
  },
  {
    id: 'user-002',
    corporateId: 'corp-001',
    name: 'Nomsa Dlamini',
    email: 'nomsa@khulisa.co.za',
    role: 'admin',
    permissions: ['merchants', 'users', 'reports', 'billing'],
    status: 'active',
    lastLogin: '2026-02-10T09:15:00Z',
    twoFactorEnabled: true,
    createdAt: '2024-01-20',
  },
  {
    id: 'user-003',
    corporateId: 'corp-001',
    name: 'John Smith',
    email: 'john@khulisa.co.za',
    role: 'accountant',
    permissions: ['reports', 'billing', 'accounting'],
    status: 'active',
    lastLogin: '2026-02-09T16:45:00Z',
    twoFactorEnabled: true,
    createdAt: '2024-02-01',
  },
  {
    id: 'user-004',
    corporateId: 'corp-001',
    name: 'Mary Johnson',
    email: 'mary@khulisa.co.za',
    role: 'manager',
    permissions: ['merchants', 'reports'],
    status: 'active',
    lastLogin: '2026-02-10T07:00:00Z',
    twoFactorEnabled: false,
    createdAt: '2024-02-15',
  },
  {
    id: 'user-005',
    corporateId: 'corp-002',
    name: 'Nandi Zulu',
    email: 'nandi@nandoni.co.za',
    role: 'owner',
    permissions: ['all'],
    status: 'active',
    lastLogin: '2026-02-10T10:00:00Z',
    twoFactorEnabled: true,
    createdAt: '2024-03-20',
  },
]

const consolidatedReport: ConsolidatedReport = {
  period: 'February 2026',
  totalRevenue: 8212000,
  revenueGrowth: 12.5,
  totalTransactions: 18890,
  avgTransactionValue: 434.73,
  topMerchants: [
    { name: 'Khulisa Sandton', revenue: 2345000, growth: 15.2 },
    { name: 'Nandoni Central', revenue: 1701000, growth: 8.7 },
    { name: 'Khulisa Pharmacy', revenue: 1368000, growth: 22.1 },
    { name: 'Nandoni Butchery', revenue: 1035000, growth: 5.3 },
    { name: 'Khulisa Kitchen', revenue: 972000, growth: 18.9 },
  ],
  topProducts: [
    { name: 'Fresh Produce Bundle', sold: 4567, revenue: 228350 },
    { name: 'Premium Meat Pack', sold: 2345, revenue: 351750 },
    { name: 'Monthly Essentials', sold: 1890, revenue: 283500 },
    { name: 'Beverage Cases', sold: 3456, revenue: 172800 },
    { name: 'Personal Care Set', sold: 1234, revenue: 185100 },
  ],
  expenses: [
    { category: 'Inventory', amount: 4567000 },
    { category: 'Staff Costs', amount: 1890000 },
    { category: 'Rent & Utilities', amount: 789000 },
    { category: 'Marketing', amount: 234000 },
    { category: 'Other', amount: 145000 },
  ],
  profitMargin: 28.5,
  creditUtilization: 40.6,
}

// ============================================
// COMPONENT
// ============================================

export function EnterprisePortalView() {
  const [activeTab, setActiveTab] = useState('overview')
  const [corporateClients, setCorporateClients] = useState<CorporateClient[]>(sampleCorporateClients)
  const [merchants, setMerchants] = useState<Merchant[]>(sampleMerchants)
  const [users, setUsers] = useState<CorporateUser[]>(sampleCorporateUsers)
  const [selectedClient, setSelectedClient] = useState<CorporateClient | null>(null)
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null)
  const [selectedUser, setSelectedUser] = useState<CorporateUser | null>(null)
  const [clientDetailOpen, setClientDetailOpen] = useState(false)
  const [merchantDetailOpen, setMerchantDetailOpen] = useState(false)
  const [userDetailOpen, setUserDetailOpen] = useState(false)
  const [newClientOpen, setNewClientOpen] = useState(false)
  const [newMerchantOpen, setNewMerchantOpen] = useState(false)
  const [newUserOpen, setNewUserOpen] = useState(false)
  const [reportPeriod, setReportPeriod] = useState('month')
  const [isLoading, setIsLoading] = useState(true)

  // Aggregated stats
  const aggregatedStats = {
    totalClients: corporateClients.filter(c => c.status === 'active').length,
    totalMerchants: merchants.filter(m => m.status === 'active').length,
    totalUsers: users.filter(u => u.status === 'active').length,
    totalRevenue: merchants.reduce((sum, m) => sum + m.stats.monthlyRevenue, 0),
    totalTransactions: merchants.reduce((sum, m) => sum + m.stats.transactions * 30, 0),
    pendingApprovals: corporateClients.filter(c => c.status === 'pending').length,
    creditUtilized: corporateClients
      .filter(c => c.creditFacility)
      .reduce((sum, c) => sum + (c.creditFacility?.used || 0), 0),
    creditAvailable: corporateClients
      .filter(c => c.creditFacility)
      .reduce((sum, c) => sum + (c.creditFacility?.available || 0), 0),
  }

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  const formatCurrency = (amount: number) => 
    `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700'
      case 'pending':
        return 'bg-amber-100 text-amber-700'
      case 'inactive':
      case 'suspended':
        return 'bg-red-100 text-red-700'
      case 'maintenance':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return <Badge className="bg-gradient-to-r from-slate-600 to-slate-400 text-white"><Crown className="h-3 w-3 mr-1" />Platinum</Badge>
      case 'gold':
        return <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-400 text-white"><Star className="h-3 w-3 mr-1" />Gold</Badge>
      case 'silver':
        return <Badge className="bg-gradient-to-r from-gray-400 to-gray-300 text-white"><Award className="h-3 w-3 mr-1" />Silver</Badge>
      case 'enterprise':
        return <Badge className="bg-gradient-to-r from-purple-600 to-purple-400 text-white"><Building className="h-3 w-3 mr-1" />Enterprise</Badge>
      default:
        return <Badge>{tier}</Badge>
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return <Badge className="bg-purple-100 text-purple-700"><Crown className="h-3 w-3 mr-1" />Owner</Badge>
      case 'admin':
        return <Badge className="bg-blue-100 text-blue-700"><Shield className="h-3 w-3 mr-1" />Admin</Badge>
      case 'manager':
        return <Badge className="bg-green-100 text-green-700"><UserCog className="h-3 w-3 mr-1" />Manager</Badge>
      case 'accountant':
        return <Badge className="bg-amber-100 text-amber-700"><Calculator className="h-3 w-3 mr-1" />Accountant</Badge>
      case 'viewer':
        return <Badge className="bg-gray-100 text-gray-700"><Eye className="h-3 w-3 mr-1" />Viewer</Badge>
      default:
        return <Badge>{role}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-[#00897B]" />
          <p className="text-[#757575]">Loading enterprise data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#1A1A1A] flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#00897B]" />
              Enterprise Portal
            </h1>
            <p className="text-sm text-[#757575]">Corporate client management, multi-merchant oversight & consolidated reporting</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={reportPeriod} onValueChange={setReportPeriod}>
              <SelectTrigger className="w-36">
                <CalendarDays className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setNewClientOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Corporate Client
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-12 bg-transparent">
            <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] data-[state=active]:shadow-none rounded-none">
              Overview
            </TabsTrigger>
            <TabsTrigger value="clients" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] data-[state=active]:shadow-none rounded-none">
              Corporate Clients
            </TabsTrigger>
            <TabsTrigger value="merchants" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] data-[state=active]:shadow-none rounded-none">
              Merchants
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] data-[state=active]:shadow-none rounded-none">
              Users & Permissions
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] data-[state=active]:shadow-none rounded-none">
              Consolidated Reports
            </TabsTrigger>
            <TabsTrigger value="billing" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] data-[state=active]:shadow-none rounded-none">
              Billing & Credit
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <Card className="border-l-4 border-l-[#00897B]">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[#757575] mb-1">Corporate Clients</p>
                        <p className="text-2xl font-bold text-[#1A1A1A]">{aggregatedStats.totalClients}</p>
                        <p className="text-xs text-green-600 mt-1">{aggregatedStats.pendingApprovals} pending</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-[#E0F2F1] flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-[#00897B]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[#757575] mb-1">Active Merchants</p>
                        <p className="text-2xl font-bold text-[#1A1A1A]">{aggregatedStats.totalMerchants}</p>
                        <p className="text-xs text-[#757575] mt-1">{merchants.filter(m => m.type === 'franchise').length} franchises</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                        <Store className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[#757575] mb-1">Monthly Revenue</p>
                        <p className="text-2xl font-bold text-[#1A1A1A]">{formatCurrency(aggregatedStats.totalRevenue)}</p>
                        <p className="text-xs text-green-600 mt-1">+{consolidatedReport.revenueGrowth}% vs last month</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                        <Coins className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[#757575] mb-1">Credit Utilized</p>
                        <p className="text-2xl font-bold text-[#1A1A1A]">{formatCurrency(aggregatedStats.creditUtilized)}</p>
                        <p className="text-xs text-[#757575] mt-1">of {formatCurrency(aggregatedStats.creditUtilized + aggregatedStats.creditAvailable)}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                        <PiggyBank className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[#757575] mb-1">Active Users</p>
                        <p className="text-2xl font-bold text-[#1A1A1A]">{aggregatedStats.totalUsers}</p>
                        <p className="text-xs text-[#757575] mt-1">across all clients</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                        <Users className="h-5 w-5 text-amber-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue Chart & Client Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Revenue Trend</CardTitle>
                    <CardDescription>Monthly consolidated revenue across all merchants</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 relative">
                      {/* Simple SVG Chart */}
                      <svg viewBox="0 0 400 200" className="w-full h-full">
                        <defs>
                          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#00897B" stopOpacity="0.3"/>
                            <stop offset="100%" stopColor="#00897B" stopOpacity="0"/>
                          </linearGradient>
                        </defs>
                        {/* Grid lines */}
                        {[0, 1, 2, 3].map(i => (
                          <line key={i} x1="40" y1={40 + i * 40} x2="380" y2={40 + i * 40} stroke="#E5E7EB" strokeWidth="1"/>
                        ))}
                        {/* Y-axis labels */}
                        <text x="10" y="45" className="text-[10px] fill-gray-500">R8M</text>
                        <text x="10" y="85" className="text-[10px] fill-gray-500">R6M</text>
                        <text x="10" y="125" className="text-[10px] fill-gray-500">R4M</text>
                        <text x="10" y="165" className="text-[10px] fill-gray-500">R2M</text>
                        {/* Revenue line */}
                        <path 
                          d="M50,140 L110,130 L170,110 L230,100 L290,85 L350,70" 
                          fill="none" 
                          stroke="#00897B" 
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {/* Area fill */}
                        <path 
                          d="M50,140 L110,130 L170,110 L230,100 L290,85 L350,70 L350,180 L50,180 Z" 
                          fill="url(#revenueGradient)"
                        />
                        {/* Data points */}
                        {[[50, 140], [110, 130], [170, 110], [230, 100], [290, 85], [350, 70]].map(([x, y], i) => (
                          <circle key={i} cx={x} cy={y} r="5" fill="#00897B"/>
                        ))}
                        {/* X-axis labels */}
                        <text x="50" y="195" className="text-[10px] fill-gray-500">Sep</text>
                        <text x="110" y="195" className="text-[10px] fill-gray-500">Oct</text>
                        <text x="170" y="195" className="text-[10px] fill-gray-500">Nov</text>
                        <text x="230" y="195" className="text-[10px] fill-gray-500">Dec</text>
                        <text x="290" y="195" className="text-[10px] fill-gray-500">Jan</text>
                        <text x="350" y="195" className="text-[10px] fill-gray-500">Feb</text>
                      </svg>
                    </div>
                  </CardContent>
                </Card>

                {/* Client Distribution */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Client Distribution by Tier</CardTitle>
                    <CardDescription>Corporate client segmentation</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { tier: 'platinum', count: 1, revenue: 5240000, color: 'from-slate-600 to-slate-400' },
                        { tier: 'gold', count: 1, revenue: 3105000, color: 'from-yellow-500 to-yellow-400' },
                        { tier: 'silver', count: 1, revenue: 867000, color: 'from-gray-400 to-gray-300' },
                      ].map((item) => (
                        <div key={item.tier} className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${item.color} flex items-center justify-center text-white`}>
                            {item.tier === 'platinum' ? <Crown className="h-5 w-5" /> : 
                             item.tier === 'gold' ? <Star className="h-5 w-5" /> : 
                             <Award className="h-5 w-5" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium capitalize">{item.tier}</p>
                              <p className="text-sm font-semibold">{item.count} client{item.count > 1 ? 's' : ''}</p>
                            </div>
                            <Progress value={(item.revenue / aggregatedStats.totalRevenue) * 100} className="h-2" />
                            <p className="text-xs text-[#757575] mt-1">{formatCurrency(item.revenue)} revenue</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Corporate Clients Grid */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Corporate Clients</h2>
                  <Button variant="ghost" size="sm" className="text-xs text-[#00897B]" onClick={() => setActiveTab('clients')}>
                    View All <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {corporateClients.slice(0, 3).map(client => (
                    <Card 
                      key={client.id} 
                      className="cursor-pointer hover:border-[#00897B] hover:shadow-md transition-all"
                      onClick={() => {
                        setSelectedClient(client)
                        setClientDetailOpen(true)
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-medium text-[#1A1A1A]">{client.tradingName}</p>
                            <p className="text-xs text-[#757575]">{client.name}</p>
                          </div>
                          {getTierBadge(client.tier)}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                          <div>
                            <p className="text-xs text-[#757575]">Merchants</p>
                            <p className="font-medium">{client.merchants.length}</p>
                          </div>
                          <div>
                            <p className="text-xs text-[#757575]">Users</p>
                            <p className="font-medium">{client.users}</p>
                          </div>
                        </div>

                        <Separator className="my-3" />
                        
                        <div className="flex items-center justify-between">
                          <Badge className={getStatusColor(client.status)}>
                            {client.status}
                          </Badge>
                          <p className="text-xs text-[#757575]">{client.address.city}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Top Performing Merchants */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">Top Performing Merchants</CardTitle>
                    <Button variant="ghost" size="sm" className="text-xs text-[#00897B]" onClick={() => setActiveTab('merchants')}>
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {consolidatedReport.topMerchants.map((merchant, i) => (
                      <div key={i} className="p-4 hover:bg-gray-50 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#E0F2F1] flex items-center justify-center text-[#00897B] font-bold">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{merchant.name}</p>
                          <p className="text-xs text-[#757575]">{formatCurrency(merchant.revenue)} revenue</p>
                        </div>
                        <div className="flex items-center gap-1 text-green-600">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-sm font-medium">+{merchant.growth}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Enterprise AI Insights */}
              <Card className="border-l-4 border-l-[#00897B]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Bot className="h-4 w-4 text-[#00897B]" />
                    Enterprise AI Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { type: 'opportunity', title: 'Expansion Opportunity', description: 'Khulisa Group shows 18% growth. Consider offering increased credit facility.', action: 'Review Credit', priority: 'high' },
                      { type: 'alert', title: 'Inactive Merchant Alert', description: 'Khulisa Liquor Midrand inactive for 30+ days. Follow up required.', action: 'Contact Client', priority: 'high' },
                      { type: 'trend', title: 'Seasonal Trend Detected', description: 'Cape Fresh V&A shows 31% growth. Stock optimization recommended.', action: 'View Analysis', priority: 'medium' },
                      { type: 'recommendation', title: 'User Management', description: '3 users without 2FA enabled. Recommend security upgrade.', action: 'Send Reminder', priority: 'low' },
                    ].map((insight, i) => (
                      <div key={i} className={`p-3 rounded-lg border ${
                        insight.priority === 'high' ? 'border-red-200 bg-red-50' :
                        insight.priority === 'medium' ? 'border-amber-200 bg-amber-50' :
                        'border-green-200 bg-green-50'
                      }`}>
                        <div className="flex items-start gap-3">
                          {insight.type === 'opportunity' && <Lightbulb className="h-5 w-5 text-amber-600" />}
                          {insight.type === 'alert' && <AlertTriangle className="h-5 w-5 text-red-600" />}
                          {insight.type === 'trend' && <TrendingUp className="h-5 w-5 text-blue-600" />}
                          {insight.type === 'recommendation' && <Target className="h-5 w-5 text-green-600" />}
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{insight.title}</h4>
                            <p className="text-xs text-[#757575] mt-1">{insight.description}</p>
                            <Button size="sm" variant="outline" className="mt-2 h-7 text-xs">
                              {insight.action}
                              <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Corporate Clients Tab */}
          {activeTab === 'clients' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex gap-4 items-center">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
                  <Input placeholder="Search corporate clients..." className="pl-9" />
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tiers</SelectItem>
                    <SelectItem value="platinum">Platinum</SelectItem>
                    <SelectItem value="gold">Gold</SelectItem>
                    <SelectItem value="silver">Silver</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="all">
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setNewClientOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Client
                </Button>
              </div>

              {/* Clients Table */}
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Client</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Tier</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Merchants</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Users</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Monthly Revenue</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Credit Used</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Status</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-[#757575]">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {corporateClients.map(client => {
                          const clientMerchants = merchants.filter(m => m.corporateId === client.id)
                          const clientRevenue = clientMerchants.reduce((sum, m) => sum + m.stats.monthlyRevenue, 0)
                          return (
                            <tr key={client.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => {
                              setSelectedClient(client)
                              setClientDetailOpen(true)
                            }}>
                              <td className="px-4 py-3">
                                <div>
                                  <p className="font-medium">{client.tradingName}</p>
                                  <p className="text-xs text-[#757575]">{client.contact.primaryContact}</p>
                                </div>
                              </td>
                              <td className="px-4 py-3">{getTierBadge(client.tier)}</td>
                              <td className="px-4 py-3 text-sm">{client.merchants.length}</td>
                              <td className="px-4 py-3 text-sm">{client.users}</td>
                              <td className="px-4 py-3 text-sm font-medium">{formatCurrency(clientRevenue)}</td>
                              <td className="px-4 py-3">
                                {client.creditFacility ? (
                                  <div>
                                    <p className="text-sm font-medium">{formatCurrency(client.creditFacility.used)}</p>
                                    <p className="text-xs text-[#757575]">of {formatCurrency(client.creditFacility.limit)}</p>
                                  </div>
                                ) : (
                                  <span className="text-xs text-[#757575]">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <Badge className={getStatusColor(client.status)}>{client.status}</Badge>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
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
          )}

          {/* Merchants Tab */}
          {activeTab === 'merchants' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex gap-4 items-center">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
                  <Input placeholder="Search merchants..." className="pl-9" />
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Corporate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients</SelectItem>
                    {corporateClients.map(client => (
                      <SelectItem key={client.id} value={client.id}>{client.tradingName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select defaultValue="all">
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Vertical" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Verticals</SelectItem>
                    <SelectItem value="grocery">Grocery</SelectItem>
                    <SelectItem value="fnb">Food & Beverage</SelectItem>
                    <SelectItem value="health-pharmacy">Pharmacy</SelectItem>
                    <SelectItem value="health-beauty">Health & Beauty</SelectItem>
                    <SelectItem value="liquor">Liquor</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="all">
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setNewMerchantOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Merchant
                </Button>
              </div>

              {/* Merchants Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {merchants.map(merchant => (
                  <Card 
                    key={merchant.id} 
                    className="cursor-pointer hover:border-[#00897B] hover:shadow-md transition-all"
                    onClick={() => {
                      setSelectedMerchant(merchant)
                      setMerchantDetailOpen(true)
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-[#E0F2F1] flex items-center justify-center text-[#00897B]">
                            <Store className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="font-medium text-[#1A1A1A]">{merchant.name}</p>
                            <p className="text-xs text-[#757575]">{merchant.location.city}</p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(merchant.status)}>
                          {merchant.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                        <div>
                          <p className="text-xs text-[#757575]">Daily Revenue</p>
                          <p className="font-medium">{formatCurrency(merchant.stats.dailyRevenue)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#757575]">Transactions</p>
                          <p className="font-medium">{merchant.stats.transactions}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#757575]">Staff</p>
                          <p className="font-medium">{merchant.stats.staff}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#757575]">Customers</p>
                          <p className="font-medium">{merchant.stats.customers}</p>
                        </div>
                      </div>

                      <Separator className="my-3" />
                      
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs capitalize">{merchant.vertical}</Badge>
                        <p className="text-xs text-[#757575]">{merchant.manager.name}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Users & Permissions Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex gap-4 items-center">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
                  <Input placeholder="Search users..." className="pl-9" />
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="accountant">Accountant</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="all">
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients</SelectItem>
                    {corporateClients.map(client => (
                      <SelectItem key={client.id} value={client.id}>{client.tradingName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setNewUserOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>

              {/* Users Table */}
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">User</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Corporate Client</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Role</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Permissions</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">2FA</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Last Login</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Status</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-[#757575]">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {users.map(user => {
                          const client = corporateClients.find(c => c.id === user.corporateId)
                          return (
                            <tr key={user.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => {
                              setSelectedUser(user)
                              setUserDetailOpen(true)
                            }}>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-[#E0F2F1] flex items-center justify-center text-[#00897B] font-medium">
                                    {user.name.split(' ').map(n => n[0]).join('')}
                                  </div>
                                  <div>
                                    <p className="font-medium">{user.name}</p>
                                    <p className="text-xs text-[#757575]">{user.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm">{client?.tradingName || '-'}</td>
                              <td className="px-4 py-3">{getRoleBadge(user.role)}</td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-1">
                                  {user.permissions.slice(0, 2).map(p => (
                                    <Badge key={p} variant="outline" className="text-[10px]">{p}</Badge>
                                  ))}
                                  {user.permissions.length > 2 && (
                                    <Badge variant="outline" className="text-[10px]">+{user.permissions.length - 2}</Badge>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                {user.twoFactorEnabled ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                                ) : (
                                  <AlertCircle className="h-5 w-5 text-amber-500" />
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {new Date(user.lastLogin).toLocaleDateString('en-ZA', { 
                                  day: 'numeric', 
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </td>
                              <td className="px-4 py-3">
                                <Badge className={getStatusColor(user.status)}>{user.status}</Badge>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
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
          )}

          {/* Consolidated Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              {/* Report Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Consolidated Report</h2>
                  <p className="text-sm text-[#757575]">{consolidatedReport.period}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-[#757575]">Total Revenue</p>
                      <div className="flex items-center text-green-600 text-xs">
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        +{consolidatedReport.revenueGrowth}%
                      </div>
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(consolidatedReport.totalRevenue)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-[#757575]">Transactions</p>
                    </div>
                    <p className="text-2xl font-bold">{consolidatedReport.totalTransactions.toLocaleString()}</p>
                    <p className="text-xs text-[#757575] mt-1">Avg: {formatCurrency(consolidatedReport.avgTransactionValue)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-[#757575]">Profit Margin</p>
                    </div>
                    <p className="text-2xl font-bold">{consolidatedReport.profitMargin}%</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-[#757575]">Credit Utilization</p>
                    </div>
                    <p className="text-2xl font-bold">{consolidatedReport.creditUtilization}%</p>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue by Merchant & Top Products */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue by Merchant */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Revenue by Merchant</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {consolidatedReport.topMerchants.map((merchant, i) => (
                        <div key={i} className="p-4 flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-[#E0F2F1] flex items-center justify-center text-[#00897B] font-bold text-sm">
                            {i + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium text-sm">{merchant.name}</p>
                              <p className="font-semibold">{formatCurrency(merchant.revenue)}</p>
                            </div>
                            <Progress value={(merchant.revenue / consolidatedReport.totalRevenue) * 100} className="h-1.5" />
                          </div>
                          <div className={`flex items-center text-xs ${merchant.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {merchant.growth >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                            {merchant.growth >= 0 ? '+' : ''}{merchant.growth}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Top Products */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Top Products</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {consolidatedReport.topProducts.map((product, i) => (
                        <div key={i} className="p-4 flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 font-bold text-sm">
                            {i + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{product.name}</p>
                            <p className="text-xs text-[#757575]">{product.sold.toLocaleString()} units sold</p>
                          </div>
                          <p className="font-semibold text-[#00897B]">{formatCurrency(product.revenue)}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Expenses Breakdown */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Expenses Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {consolidatedReport.expenses.map((expense, i) => (
                      <div key={i} className="p-4 bg-gray-50 rounded-lg text-center">
                        <p className="text-xs text-[#757575] mb-1">{expense.category}</p>
                        <p className="font-semibold">{formatCurrency(expense.amount)}</p>
                        <p className="text-xs text-[#757575] mt-1">
                          {((expense.amount / consolidatedReport.expenses.reduce((s, e) => s + e.amount, 0)) * 100).toFixed(1)}%
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Billing & Credit Tab */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              {/* Billing Overview */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-[#757575] mb-1">Monthly Recurring Revenue</p>
                    <p className="text-2xl font-bold">{formatCurrency(aggregatedStats.totalClients * 8500)}</p>
                    <p className="text-xs text-green-600 mt-1">From {aggregatedStats.totalClients} clients</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-[#757575] mb-1">Total Credit Extended</p>
                    <p className="text-2xl font-bold">{formatCurrency(aggregatedStats.creditUtilized + aggregatedStats.creditAvailable)}</p>
                    <p className="text-xs text-[#757575] mt-1">{formatCurrency(aggregatedStats.creditAvailable)} available</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-[#757575] mb-1">Credit Utilized</p>
                    <p className="text-2xl font-bold">{formatCurrency(aggregatedStats.creditUtilized)}</p>
                    <Progress value={(aggregatedStats.creditUtilized / (aggregatedStats.creditUtilized + aggregatedStats.creditAvailable)) * 100} className="h-2 mt-2" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-[#757575] mb-1">Avg Interest Rate</p>
                    <p className="text-2xl font-bold">11.9%</p>
                    <p className="text-xs text-[#757575] mt-1">Repo + spread</p>
                  </CardContent>
                </Card>
              </div>

              {/* Billing Table */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Client Billing Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Client</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Tier</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Monthly Fee</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Credit Limit</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Credit Used</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Next Payment</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {corporateClients.map(client => (
                          <tr key={client.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium">{client.tradingName}</td>
                            <td className="px-4 py-3">{getTierBadge(client.tier)}</td>
                            <td className="px-4 py-3 text-sm">{formatCurrency(client.billing.monthlyFee)}</td>
                            <td className="px-4 py-3 text-sm">{client.creditFacility ? formatCurrency(client.creditFacility.limit) : '-'}</td>
                            <td className="px-4 py-3">
                              {client.creditFacility ? (
                                <div>
                                  <p className="text-sm font-medium">{formatCurrency(client.creditFacility.used)}</p>
                                  <Progress value={(client.creditFacility.used / client.creditFacility.limit) * 100} className="h-1.5 mt-1" />
                                </div>
                              ) : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm">{client.billing.nextPayment}</td>
                            <td className="px-4 py-3">
                              <Badge className={getStatusColor(client.status)}>{client.status}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Client Detail Dialog */}
      <Dialog open={clientDetailOpen} onOpenChange={setClientDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedClient && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedClient.tradingName}
                  {getTierBadge(selectedClient.tier)}
                </DialogTitle>
                <DialogDescription>{selectedClient.name}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[#757575]">Registration Number</p>
                    <p className="text-sm font-medium">{selectedClient.registrationNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#757575]">VAT Number</p>
                    <p className="text-sm font-medium">{selectedClient.vatNumber}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-medium text-[#757575] mb-2">Contact Information</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-[#757575]" />
                      <span>{selectedClient.contact.primaryContact}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-[#757575]" />
                      <span>{selectedClient.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-[#757575]" />
                      <span>{selectedClient.contact.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#757575]" />
                      <span>{selectedClient.address.city}, {selectedClient.address.province}</span>
                    </div>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-medium text-[#757575] mb-2">Merchants ({selectedClient.merchants.length})</p>
                  <div className="space-y-2">
                    {merchants.filter(m => m.corporateId === selectedClient.id).map(merchant => (
                      <div key={merchant.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4 text-[#00897B]" />
                          <span className="text-sm font-medium">{merchant.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{merchant.vertical}</Badge>
                          <Badge className={getStatusColor(merchant.status)}>{merchant.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {selectedClient.creditFacility && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-medium text-[#757575] mb-2">Credit Facility</p>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-3 bg-gray-50 rounded-lg text-center">
                          <p className="text-xs text-[#757575]">Limit</p>
                          <p className="font-semibold">{formatCurrency(selectedClient.creditFacility.limit)}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg text-center">
                          <p className="text-xs text-[#757575]">Used</p>
                          <p className="font-semibold">{formatCurrency(selectedClient.creditFacility.used)}</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg text-center">
                          <p className="text-xs text-[#757575]">Available</p>
                          <p className="font-semibold text-green-600">{formatCurrency(selectedClient.creditFacility.available)}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setClientDetailOpen(false)}>Close</Button>
                <Button className="bg-[#00897B] hover:bg-[#00695C]">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Client
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Merchant Detail Dialog */}
      <Dialog open={merchantDetailOpen} onOpenChange={setMerchantDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedMerchant && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedMerchant.name}
                  <Badge variant="outline" className="capitalize">{selectedMerchant.type}</Badge>
                </DialogTitle>
                <DialogDescription>{selectedMerchant.location.address}, {selectedMerchant.location.city}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-xs text-[#757575]">Daily Revenue</p>
                    <p className="font-semibold">{formatCurrency(selectedMerchant.stats.dailyRevenue)}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-xs text-[#757575]">Monthly Revenue</p>
                    <p className="font-semibold">{formatCurrency(selectedMerchant.stats.monthlyRevenue)}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-xs text-[#757575]">Transactions</p>
                    <p className="font-semibold">{selectedMerchant.stats.transactions}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-xs text-[#757575]">Customers</p>
                    <p className="font-semibold">{selectedMerchant.stats.customers}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-medium text-[#757575] mb-2">Manager</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-[#757575]" />
                      <span>{selectedMerchant.manager.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-[#757575]" />
                      <span>{selectedMerchant.manager.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-[#757575]" />
                      <span>{selectedMerchant.manager.phone}</span>
                    </div>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-medium text-[#757575] mb-2">Integrations</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedMerchant.integrations.map(int => (
                      <Badge key={int} variant="outline">{int}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setMerchantDetailOpen(false)}>Close</Button>
                <Button className="bg-[#00897B] hover:bg-[#00695C]">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in Merchant OS
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* New Client Dialog */}
      <Dialog open={newClientOpen} onOpenChange={setNewClientOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Corporate Client</DialogTitle>
            <DialogDescription>Register a new corporate client for multi-merchant management</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium">Trading Name</label>
                <Input placeholder="e.g., ABC Stores" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium">Registered Name</label>
                <Input placeholder="e.g., ABC Holdings (Pty) Ltd" className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium">Registration Number</label>
                <Input placeholder="2024/123456/07" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium">VAT Number</label>
                <Input placeholder="4123456789" className="mt-1" />
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium">Primary Contact</label>
                <Input placeholder="Contact person name" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium">Email</label>
                <Input type="email" placeholder="email@company.co.za" className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium">Phone</label>
                <Input placeholder="+27 XX XXX XXXX" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium">Tier</label>
                <Select>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="silver">Silver</SelectItem>
                    <SelectItem value="gold">Gold</SelectItem>
                    <SelectItem value="platinum">Platinum</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewClientOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]">
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Merchant Dialog */}
      <Dialog open={newMerchantOpen} onOpenChange={setNewMerchantOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Merchant</DialogTitle>
            <DialogDescription>Add a new merchant to a corporate client</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium">Corporate Client</label>
              <Select>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {corporateClients.map(client => (
                    <SelectItem key={client.id} value={client.id}>{client.tradingName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium">Merchant Name</label>
                <Input placeholder="e.g., Store Name - Location" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium">Type</label>
                <Select>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owned">Owned</SelectItem>
                    <SelectItem value="franchise">Franchise</SelectItem>
                    <SelectItem value="partner">Partner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium">Vertical</label>
                <Select>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select vertical" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grocery">Grocery & FMCG</SelectItem>
                    <SelectItem value="fnb">Food & Beverage</SelectItem>
                    <SelectItem value="health-pharmacy">Health & Pharmacy</SelectItem>
                    <SelectItem value="health-beauty">Health & Beauty</SelectItem>
                    <SelectItem value="liquor">Liquor & Nightlife</SelectItem>
                    <SelectItem value="hospitality">Hospitality</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium">City</label>
                <Input placeholder="City" className="mt-1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewMerchantOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]">
              <Plus className="h-4 w-4 mr-2" />
              Add Merchant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
