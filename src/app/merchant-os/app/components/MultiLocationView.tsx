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
  MapPin,
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
} from 'lucide-react'

// ============================================
// TYPES
// ============================================

interface Location {
  id: string
  name: string
  type: 'store' | 'warehouse' | 'kiosk' | 'franchise'
  status: 'active' | 'inactive' | 'maintenance'
  address: {
    street: string
    city: string
    province: string
    postalCode: string
    country: string
  }
  contact: {
    phone: string
    email: string
    manager: string
  }
  operatingHours: {
    open: string
    close: string
    days: string[]
  }
  stats: {
    dailyRevenue: number
    monthlyRevenue: number
    staff: number
    inventory: number
    transactions: number
  }
  coordinates?: {
    lat: number
    lng: number
  }
  createdAt: string
}

interface Transfer {
  id: string
  fromLocation: string
  fromLocationName: string
  toLocation: string
  toLocationName: string
  status: 'draft' | 'pending' | 'in_transit' | 'received' | 'cancelled'
  items: {
    sku: string
    name: string
    quantity: number
    condition?: 'good' | 'damaged'
  }[]
  totalItems: number
  requestedBy: string
  approvedBy?: string
  shippedBy?: string
  receivedBy?: string
  createdAt: string
  updatedAt: string
  estimatedArrival?: string
  notes?: string
}

interface LocationPerformance {
  locationId: string
  locationName: string
  revenue: number
  growth: number
  transactions: number
  avgBasket: number
  topProducts: { name: string; sold: number }[]
  staffProductivity: number
  inventoryTurnover: number
}

// ============================================
// SAMPLE DATA
// ============================================

const sampleLocations: Location[] = [
  {
    id: 'loc-001',
    name: 'Main Street Store',
    type: 'store',
    status: 'active',
    address: {
      street: '123 Main Street',
      city: 'Johannesburg',
      province: 'Gauteng',
      postalCode: '2001',
      country: 'South Africa',
    },
    contact: {
      phone: '+27 11 123 4567',
      email: 'mainstreet@groway.co.za',
      manager: 'Thabo Mokoena',
    },
    operatingHours: {
      open: '08:00',
      close: '20:00',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    },
    stats: {
      dailyRevenue: 45670,
      monthlyRevenue: 1285000,
      staff: 12,
      inventory: 2456,
      transactions: 156,
    },
    coordinates: { lat: -26.2041, lng: 28.0473 },
    createdAt: '2024-01-15',
  },
  {
    id: 'loc-002',
    name: 'Sandton City Mall',
    type: 'store',
    status: 'active',
    address: {
      street: 'Sandton City, 5th Floor',
      city: 'Sandton',
      province: 'Gauteng',
      postalCode: '2196',
      country: 'South Africa',
    },
    contact: {
      phone: '+27 11 234 5678',
      email: 'sandton@groway.co.za',
      manager: 'Nomsa Dlamini',
    },
    operatingHours: {
      open: '09:00',
      close: '21:00',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
    stats: {
      dailyRevenue: 78900,
      monthlyRevenue: 2345000,
      staff: 18,
      inventory: 3421,
      transactions: 289,
    },
    coordinates: { lat: -26.1076, lng: 28.0567 },
    createdAt: '2024-03-01',
  },
  {
    id: 'loc-003',
    name: 'Central Warehouse',
    type: 'warehouse',
    status: 'active',
    address: {
      street: '45 Industrial Road',
      city: 'Johannesburg',
      province: 'Gauteng',
      postalCode: '2041',
      country: 'South Africa',
    },
    contact: {
      phone: '+27 11 345 6789',
      email: 'warehouse@groway.co.za',
      manager: 'Johan van der Berg',
    },
    operatingHours: {
      open: '06:00',
      close: '18:00',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    },
    stats: {
      dailyRevenue: 0,
      monthlyRevenue: 0,
      staff: 8,
      inventory: 12456,
      transactions: 0,
    },
    coordinates: { lat: -26.1951, lng: 28.0401 },
    createdAt: '2023-06-01',
  },
  {
    id: 'loc-004',
    name: 'Cape Town Branch',
    type: 'store',
    status: 'active',
    address: {
      street: 'V&A Waterfront, Shop 45',
      city: 'Cape Town',
      province: 'Western Cape',
      postalCode: '8001',
      country: 'South Africa',
    },
    contact: {
      phone: '+27 21 456 7890',
      email: 'capetown@groway.co.za',
      manager: 'Sarah Williams',
    },
    operatingHours: {
      open: '09:00',
      close: '21:00',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
    stats: {
      dailyRevenue: 52300,
      monthlyRevenue: 1567000,
      staff: 15,
      inventory: 2890,
      transactions: 198,
    },
    coordinates: { lat: -33.9047, lng: 18.4230 },
    createdAt: '2024-06-15',
  },
  {
    id: 'loc-005',
    name: 'Durban Beach Front',
    type: 'kiosk',
    status: 'active',
    address: {
      street: 'North Beach Promenade',
      city: 'Durban',
      province: 'KwaZulu-Natal',
      postalCode: '4001',
      country: 'South Africa',
    },
    contact: {
      phone: '+27 31 567 8901',
      email: 'durban@groway.co.za',
      manager: 'Priya Naidoo',
    },
    operatingHours: {
      open: '10:00',
      close: '22:00',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
    stats: {
      dailyRevenue: 23450,
      monthlyRevenue: 678000,
      staff: 4,
      inventory: 567,
      transactions: 89,
    },
    coordinates: { lat: -29.8587, lng: 31.0218 },
    createdAt: '2024-09-01',
  },
  {
    id: 'loc-006',
    name: 'Pretoria Franchise',
    type: 'franchise',
    status: 'inactive',
    address: {
      street: 'Menlyn Park Shopping Centre',
      city: 'Pretoria',
      province: 'Gauteng',
      postalCode: '0063',
      country: 'South Africa',
    },
    contact: {
      phone: '+27 12 678 9012',
      email: 'pretoria@groway.co.za',
      manager: 'David Smith',
    },
    operatingHours: {
      open: '09:00',
      close: '20:00',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
    stats: {
      dailyRevenue: 0,
      monthlyRevenue: 0,
      staff: 10,
      inventory: 1890,
      transactions: 0,
    },
    coordinates: { lat: -25.7890, lng: 28.2750 },
    createdAt: '2025-01-15',
  },
]

const sampleTransfers: Transfer[] = [
  {
    id: 'TRF-001',
    fromLocation: 'loc-003',
    fromLocationName: 'Central Warehouse',
    toLocation: 'loc-001',
    toLocationName: 'Main Street Store',
    status: 'in_transit',
    items: [
      { sku: 'SKU-001', name: 'Coca-Cola 500ml', quantity: 100 },
      { sku: 'SKU-002', name: 'Bread White', quantity: 50 },
      { sku: 'SKU-003', name: 'Milk 1L', quantity: 30 },
    ],
    totalItems: 180,
    requestedBy: 'Thabo Mokoena',
    approvedBy: 'Johan van der Berg',
    shippedBy: 'Truck Driver A',
    createdAt: '2026-02-10T08:00:00Z',
    updatedAt: '2026-02-10T14:30:00Z',
    estimatedArrival: '2026-02-11T10:00:00Z',
    notes: 'Urgent restock request',
  },
  {
    id: 'TRF-002',
    fromLocation: 'loc-003',
    fromLocationName: 'Central Warehouse',
    toLocation: 'loc-002',
    toLocationName: 'Sandton City Mall',
    status: 'pending',
    items: [
      { sku: 'SKU-004', name: 'Coffee Beans 1kg', quantity: 25 },
      { sku: 'SKU-005', name: 'Sugar 2kg', quantity: 40 },
    ],
    totalItems: 65,
    requestedBy: 'Nomsa Dlamini',
    createdAt: '2026-02-10T09:00:00Z',
    updatedAt: '2026-02-10T09:00:00Z',
  },
  {
    id: 'TRF-003',
    fromLocation: 'loc-001',
    fromLocationName: 'Main Street Store',
    toLocation: 'loc-002',
    toLocationName: 'Sandton City Mall',
    status: 'received',
    items: [
      { sku: 'SKU-006', name: 'Promotional Display', quantity: 5 },
    ],
    totalItems: 5,
    requestedBy: 'Nomsa Dlamini',
    approvedBy: 'Thabo Mokoena',
    shippedBy: 'Staff Member B',
    receivedBy: 'Staff Member C',
    createdAt: '2026-02-08T10:00:00Z',
    updatedAt: '2026-02-09T11:00:00Z',
    notes: 'Marketing materials transfer',
  },
  {
    id: 'TRF-004',
    fromLocation: 'loc-002',
    fromLocationName: 'Sandton City Mall',
    toLocation: 'loc-004',
    toLocationName: 'Cape Town Branch',
    status: 'draft',
    items: [
      { sku: 'SKU-007', name: 'Premium Gift Set', quantity: 20 },
    ],
    totalItems: 20,
    requestedBy: 'Sarah Williams',
    createdAt: '2026-02-10T11:00:00Z',
    updatedAt: '2026-02-10T11:00:00Z',
  },
]

const performanceData: LocationPerformance[] = [
  {
    locationId: 'loc-002',
    locationName: 'Sandton City Mall',
    revenue: 2345000,
    growth: 15.4,
    transactions: 8670,
    avgBasket: 270.50,
    topProducts: [
      { name: 'Premium Coffee Blend', sold: 234 },
      { name: 'Artisan Sandwich', sold: 189 },
      { name: 'Fresh Juice', sold: 156 },
    ],
    staffProductivity: 92,
    inventoryTurnover: 4.2,
  },
  {
    locationId: 'loc-004',
    locationName: 'Cape Town Branch',
    revenue: 1567000,
    growth: 22.1,
    transactions: 5940,
    avgBasket: 263.70,
    topProducts: [
      { name: 'Local Wine Selection', sold: 178 },
      { name: 'Fresh Seafood', sold: 145 },
      { name: 'Craft Beer Pack', sold: 123 },
    ],
    staffProductivity: 88,
    inventoryTurnover: 3.8,
  },
  {
    locationId: 'loc-001',
    locationName: 'Main Street Store',
    revenue: 1285000,
    growth: 8.2,
    transactions: 4680,
    avgBasket: 274.60,
    topProducts: [
      { name: 'Daily Essentials Bundle', sold: 312 },
      { name: 'Fresh Bread', sold: 289 },
      { name: 'Milk 2L', sold: 267 },
    ],
    staffProductivity: 85,
    inventoryTurnover: 5.1,
  },
  {
    locationId: 'loc-005',
    locationName: 'Durban Beach Front',
    revenue: 678000,
    growth: 31.5,
    transactions: 2670,
    avgBasket: 254.00,
    topProducts: [
      { name: 'Ice Cream Cone', sold: 456 },
      { name: 'Cold Drinks', sold: 378 },
      { name: 'Beach Snacks', sold: 234 },
    ],
    staffProductivity: 95,
    inventoryTurnover: 6.2,
  },
]

// ============================================
// COMPONENT
// ============================================

export function MultiLocationView() {
  const [activeTab, setActiveTab] = useState('overview')
  const [locations, setLocations] = useState<Location[]>(sampleLocations)
  const [transfers, setTransfers] = useState<Transfer[]>(sampleTransfers)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null)
  const [locationDetailOpen, setLocationDetailOpen] = useState(false)
  const [transferDetailOpen, setTransferDetailOpen] = useState(false)
  const [newTransferOpen, setNewTransferOpen] = useState(false)
  const [newLocationOpen, setNewLocationOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Consolidated stats
  const consolidatedStats = {
    totalLocations: locations.filter(l => l.status === 'active').length,
    totalRevenue: locations.reduce((sum, l) => sum + l.stats.monthlyRevenue, 0),
    totalStaff: locations.reduce((sum, l) => sum + l.stats.staff, 0),
    totalInventory: locations.reduce((sum, l) => sum + l.stats.inventory, 0),
    pendingTransfers: transfers.filter(t => t.status === 'pending' || t.status === 'in_transit').length,
  }

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  const formatCurrency = (amount: number) => `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'received':
        return 'bg-green-100 text-green-700'
      case 'pending':
      case 'in_transit':
        return 'bg-amber-100 text-amber-700'
      case 'inactive':
      case 'cancelled':
        return 'bg-gray-100 text-gray-700'
      case 'maintenance':
      case 'draft':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'store': return <Store className="h-5 w-5" />
      case 'warehouse': return <Warehouse className="h-5 w-5" />
      case 'kiosk': return <ShoppingBag className="h-5 w-5" />
      case 'franchise': return <Building2 className="h-5 w-5" />
      default: return <Building2 className="h-5 w-5" />
    }
  }

  const getTransferStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      case 'in_transit': return <Truck className="h-4 w-4" />
      case 'received': return <CheckCircle2 className="h-4 w-4" />
      case 'cancelled': return <X className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-[#00897B]" />
          <p className="text-[#757575]">Loading locations...</p>
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
              Multi-Location Management
            </h1>
            <p className="text-sm text-[#757575]">Branch management, inventory transfers & consolidated reporting</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setNewLocationOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Location
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
            <TabsTrigger value="locations" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] data-[state=active]:shadow-none rounded-none">
              Locations
            </TabsTrigger>
            <TabsTrigger value="transfers" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] data-[state=active]:shadow-none rounded-none">
              Transfers
            </TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] data-[state=active]:shadow-none rounded-none">
              Performance
            </TabsTrigger>
            <TabsTrigger value="consolidated" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] data-[state=active]:shadow-none rounded-none">
              Consolidated Reports
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
                        <p className="text-xs text-[#757575] mb-1">Active Locations</p>
                        <p className="text-2xl font-bold text-[#1A1A1A]">{consolidatedStats.totalLocations}</p>
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
                        <p className="text-xs text-[#757575] mb-1">Monthly Revenue</p>
                        <p className="text-2xl font-bold text-[#1A1A1A]">{formatCurrency(consolidatedStats.totalRevenue)}</p>
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
                        <p className="text-xs text-[#757575] mb-1">Total Staff</p>
                        <p className="text-2xl font-bold text-[#1A1A1A]">{consolidatedStats.totalStaff}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[#757575] mb-1">Total Inventory</p>
                        <p className="text-2xl font-bold text-[#1A1A1A]">{consolidatedStats.totalInventory.toLocaleString()}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                        <Package className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[#757575] mb-1">Pending Transfers</p>
                        <p className="text-2xl font-bold text-[#1A1A1A]">{consolidatedStats.pendingTransfers}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                        <Truck className="h-5 w-5 text-amber-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Location Map Placeholder & Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Map Placeholder */}
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Location Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#E0F2F1] to-[#B2DFDB]" />
                      <div className="relative z-10 text-center">
                        <Globe className="h-12 w-12 mx-auto mb-2 text-[#00897B]" />
                        <p className="text-sm text-[#757575]">Map View - {consolidatedStats.totalLocations} locations across South Africa</p>
                        <div className="flex justify-center gap-4 mt-4">
                          {['Gauteng', 'Western Cape', 'KwaZulu-Natal'].map(province => (
                            <Badge key={province} variant="outline" className="bg-white">
                              {province}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full justify-start bg-[#00897B] hover:bg-[#00695C]" onClick={() => setNewTransferOpen(true)}>
                      <ArrowLeftRight className="h-4 w-4 mr-2" />
                      New Transfer Request
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => setNewLocationOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Location
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Consolidated Report
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Settings className="h-4 w-4 mr-2" />
                      Location Permissions
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Active Locations Grid */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Active Locations</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {locations.filter(l => l.status === 'active').map(location => (
                    <Card 
                      key={location.id} 
                      className="cursor-pointer hover:border-[#00897B] hover:shadow-md transition-all"
                      onClick={() => {
                        setSelectedLocation(location)
                        setLocationDetailOpen(true)
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-[#E0F2F1] flex items-center justify-center text-[#00897B]">
                              {getTypeIcon(location.type)}
                            </div>
                            <div>
                              <p className="font-medium text-[#1A1A1A]">{location.name}</p>
                              <p className="text-xs text-[#757575]">{location.address.city}, {location.address.province}</p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(location.status)}>
                            {location.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-[#757575]">Daily Revenue</p>
                            <p className="font-medium">{formatCurrency(location.stats.dailyRevenue)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-[#757575]">Staff</p>
                            <p className="font-medium">{location.stats.staff}</p>
                          </div>
                          <div>
                            <p className="text-xs text-[#757575]">Inventory</p>
                            <p className="font-medium">{location.stats.inventory.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-[#757575]">Transactions</p>
                            <p className="font-medium">{location.stats.transactions}</p>
                          </div>
                        </div>
                        
                        <Separator className="my-3" />
                        
                        <div className="flex items-center justify-between text-xs text-[#757575]">
                          <span>{location.operatingHours.open} - {location.operatingHours.close}</span>
                          <span>Manager: {location.contact.manager.split(' ')[0]}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Recent Transfers */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">Recent Transfers</CardTitle>
                    <Button variant="ghost" size="sm" className="text-xs text-[#00897B]" onClick={() => setActiveTab('transfers')}>
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {transfers.slice(0, 4).map(transfer => (
                      <div 
                        key={transfer.id} 
                        className="p-4 hover:bg-gray-50 cursor-pointer flex items-center gap-4"
                        onClick={() => {
                          setSelectedTransfer(transfer)
                          setTransferDetailOpen(true)
                        }}
                      >
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          {getTransferStatusIcon(transfer.status)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{transfer.fromLocationName}</p>
                            <ArrowRight className="h-4 w-4 text-[#757575]" />
                            <p className="font-medium text-sm">{transfer.toLocationName}</p>
                          </div>
                          <p className="text-xs text-[#757575]">{transfer.totalItems} items • {transfer.id}</p>
                        </div>
                        <Badge className={getStatusColor(transfer.status)}>
                          {transfer.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* GroAI Insights */}
              <Card className="border-l-4 border-l-[#00897B]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Bot className="h-4 w-4 text-[#00897B]" />
                    GroAI Location Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { type: 'opportunity', title: 'Durban Growth Opportunity', description: 'Durban Beach Front shows 31.5% growth. Consider expanding operating hours.', action: 'View Analysis', priority: 'high' },
                      { type: 'alert', title: 'Pretoria Franchise Inactive', description: 'Pretoria location has been inactive for 45 days. Follow up with franchisee.', action: 'Contact Owner', priority: 'high' },
                      { type: 'trend', title: 'Inventory Optimization', description: 'Central Warehouse has excess stock. Recommend redistribution to Cape Town.', action: 'Create Transfer', priority: 'medium' },
                      { type: 'recommendation', title: 'Staff Allocation', description: 'Sandton could benefit from 2 additional staff during peak hours (12-2pm).', action: 'View Schedule', priority: 'low' },
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

          {/* Locations Tab */}
          {activeTab === 'locations' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex gap-4 items-center">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
                  <Input placeholder="Search locations..." className="pl-9" />
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="store">Store</SelectItem>
                    <SelectItem value="warehouse">Warehouse</SelectItem>
                    <SelectItem value="kiosk">Kiosk</SelectItem>
                    <SelectItem value="franchise">Franchise</SelectItem>
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
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Locations Table */}
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Location</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Address</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Manager</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Staff</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Monthly Revenue</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Status</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-[#757575]">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {locations.map(location => (
                          <tr key={location.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => {
                            setSelectedLocation(location)
                            setLocationDetailOpen(true)
                          }}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded bg-[#E0F2F1] flex items-center justify-center text-[#00897B]">
                                  {getTypeIcon(location.type)}
                                </div>
                                <span className="font-medium">{location.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm capitalize">{location.type}</td>
                            <td className="px-4 py-3 text-sm">{location.address.city}, {location.address.province}</td>
                            <td className="px-4 py-3 text-sm">{location.contact.manager}</td>
                            <td className="px-4 py-3 text-sm">{location.stats.staff}</td>
                            <td className="px-4 py-3 text-sm font-medium">{formatCurrency(location.stats.monthlyRevenue)}</td>
                            <td className="px-4 py-3">
                              <Badge className={getStatusColor(location.status)}>{location.status}</Badge>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
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

          {/* Transfers Tab */}
          {activeTab === 'transfers' && (
            <div className="space-y-6">
              {/* Transfer Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-gray-600">{transfers.filter(t => t.status === 'draft').length}</p>
                    <p className="text-xs text-[#757575]">Draft</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-amber-600">{transfers.filter(t => t.status === 'pending').length}</p>
                    <p className="text-xs text-[#757575]">Pending</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{transfers.filter(t => t.status === 'in_transit').length}</p>
                    <p className="text-xs text-[#757575]">In Transit</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{transfers.filter(t => t.status === 'received').length}</p>
                    <p className="text-xs text-[#757575]">Received</p>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <div className="flex gap-4 items-center">
                <Select defaultValue="all">
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setNewTransferOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Transfer
                </Button>
              </div>

              {/* Transfers List */}
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Transfer ID</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">From</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">To</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Items</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Requested By</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">ETA</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-[#757575]">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {transfers.map(transfer => (
                          <tr key={transfer.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => {
                            setSelectedTransfer(transfer)
                            setTransferDetailOpen(true)
                          }}>
                            <td className="px-4 py-3 font-medium text-sm">{transfer.id}</td>
                            <td className="px-4 py-3 text-sm">{transfer.fromLocationName}</td>
                            <td className="px-4 py-3 text-sm">{transfer.toLocationName}</td>
                            <td className="px-4 py-3 text-sm">{transfer.totalItems}</td>
                            <td className="px-4 py-3 text-sm">{transfer.requestedBy}</td>
                            <td className="px-4 py-3">
                              <Badge className={getStatusColor(transfer.status)}>
                                <div className="flex items-center gap-1">
                                  {getTransferStatusIcon(transfer.status)}
                                  {transfer.status.replace('_', ' ')}
                                </div>
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm text-[#757575]">
                              {transfer.estimatedArrival ? new Date(transfer.estimatedArrival).toLocaleDateString('en-ZA') : '-'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
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

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              {/* Performance Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {performanceData.sort((a, b) => b.revenue - a.revenue).map((perf, index) => (
                  <Card key={perf.locationId}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#E0F2F1] text-[#00897B] flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </span>
                          {perf.locationName}
                        </CardTitle>
                        <div className={`flex items-center gap-1 text-sm ${perf.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {perf.growth >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                          {perf.growth}%
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-[#757575]">Revenue</p>
                          <p className="text-lg font-bold">{formatCurrency(perf.revenue)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#757575]">Transactions</p>
                          <p className="text-lg font-bold">{perf.transactions.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#757575]">Avg Basket</p>
                          <p className="text-lg font-bold">R{perf.avgBasket.toFixed(0)}</p>
                        </div>
                      </div>
                      
                      <Separator className="my-3" />
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#757575]">Staff Productivity</span>
                          <span className="font-medium">{perf.staffProductivity}%</span>
                        </div>
                        <Progress value={perf.staffProductivity} className="h-2" />
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-[#757575]">Inventory Turnover</span>
                          <span className="font-medium">{perf.inventoryTurnover}x/month</span>
                        </div>
                      </div>
                      
                      <Separator className="my-3" />
                      
                      <div>
                        <p className="text-xs text-[#757575] mb-2">Top Products</p>
                        <div className="space-y-1">
                          {perf.topProducts.slice(0, 3).map((product, i) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span>{product.name}</span>
                              <span className="text-[#757575]">{product.sold} sold</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Consolidated Reports Tab */}
          {activeTab === 'consolidated' && (
            <div className="space-y-6">
              {/* Report Types */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { title: 'Consolidated P&L', description: 'Profit & Loss across all locations', icon: BarChart3 },
                  { title: 'Inventory Summary', description: 'Stock levels across locations', icon: Package },
                  { title: 'Staff Report', description: 'Headcount and productivity', icon: Users },
                  { title: 'Sales Analysis', description: 'Revenue and transaction trends', icon: TrendingUp },
                  { title: 'Transfer History', description: 'Inter-branch movement log', icon: ArrowLeftRight },
                  { title: 'Custom Report', description: 'Build your own report', icon: FileText },
                ].map((report, i) => (
                  <Card key={i} className="cursor-pointer hover:border-[#00897B] hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#E0F2F1] flex items-center justify-center text-[#00897B]">
                          <report.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">{report.title}</p>
                          <p className="text-xs text-[#757575]">{report.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Consolidated Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Consolidated Financial Summary</CardTitle>
                  <CardDescription>Month-to-date performance across all locations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-xs text-[#757575]">Total Revenue</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(consolidatedStats.totalRevenue)}</p>
                      <p className="text-xs text-green-600 mt-1">+12.4% vs last month</p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg">
                      <p className="text-xs text-[#757575]">Total Costs</p>
                      <p className="text-2xl font-bold text-red-600">{formatCurrency(consolidatedStats.totalRevenue * 0.68)}</p>
                      <p className="text-xs text-red-600 mt-1">68% of revenue</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-xs text-[#757575]">Gross Profit</p>
                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(consolidatedStats.totalRevenue * 0.32)}</p>
                      <p className="text-xs text-blue-600 mt-1">32% margin</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="text-xs text-[#757575]">Net Profit</p>
                      <p className="text-2xl font-bold text-purple-600">{formatCurrency(consolidatedStats.totalRevenue * 0.18)}</p>
                      <p className="text-xs text-purple-600 mt-1">18% net margin</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Location Detail Dialog */}
      <Dialog open={locationDetailOpen} onOpenChange={setLocationDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          {selectedLocation && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-[#E0F2F1] flex items-center justify-center text-[#00897B]">
                    {getTypeIcon(selectedLocation.type)}
                  </div>
                  {selectedLocation.name}
                </DialogTitle>
                <DialogDescription>
                  {selectedLocation.type.charAt(0).toUpperCase() + selectedLocation.type.slice(1)} • {selectedLocation.address.city}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-[#757575]">Daily Revenue</p>
                    <p className="text-lg font-bold">{formatCurrency(selectedLocation.stats.dailyRevenue)}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-[#757575]">Monthly Revenue</p>
                    <p className="text-lg font-bold">{formatCurrency(selectedLocation.stats.monthlyRevenue)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-[#757575] mb-2">Address</p>
                  <div className="p-3 bg-gray-50 rounded-lg space-y-1 text-sm">
                    <p>{selectedLocation.address.street}</p>
                    <p>{selectedLocation.address.city}, {selectedLocation.address.province}</p>
                    <p>{selectedLocation.address.postalCode}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-[#757575] mb-2">Contact</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-[#757575]" />
                      <span>{selectedLocation.contact.manager}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-[#757575]" />
                      <span>{selectedLocation.contact.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-[#757575]" />
                      <span>{selectedLocation.contact.email}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-[#757575] mb-2">Operating Hours</p>
                  <p className="text-sm">
                    {selectedLocation.operatingHours.open} - {selectedLocation.operatingHours.close}
                  </p>
                  <p className="text-xs text-[#757575]">{selectedLocation.operatingHours.days.join(', ')}</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setLocationDetailOpen(false)}>Close</Button>
                <Button className="bg-[#00897B] hover:bg-[#00695C]">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Transfer Detail Dialog */}
      <Dialog open={transferDetailOpen} onOpenChange={setTransferDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          {selectedTransfer && (
            <>
              <DialogHeader>
                <DialogTitle>Transfer {selectedTransfer.id}</DialogTitle>
                <DialogDescription>
                  {selectedTransfer.fromLocationName} → {selectedTransfer.toLocationName}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-[#757575]">Status</span>
                  <Badge className={getStatusColor(selectedTransfer.status)}>
                    {selectedTransfer.status.replace('_', ' ')}
                  </Badge>
                </div>

                <div>
                  <p className="text-xs text-[#757575] mb-2">Items ({selectedTransfer.totalItems} total)</p>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {selectedTransfer.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-[#757575]">{item.sku}</p>
                        </div>
                        <span className="font-medium">×{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#757575]">Requested By</span>
                    <span>{selectedTransfer.requestedBy}</span>
                  </div>
                  {selectedTransfer.approvedBy && (
                    <div className="flex justify-between">
                      <span className="text-[#757575]">Approved By</span>
                      <span>{selectedTransfer.approvedBy}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[#757575]">Created</span>
                    <span>{new Date(selectedTransfer.createdAt).toLocaleString('en-ZA')}</span>
                  </div>
                  {selectedTransfer.estimatedArrival && (
                    <div className="flex justify-between">
                      <span className="text-[#757575]">ETA</span>
                      <span>{new Date(selectedTransfer.estimatedArrival).toLocaleString('en-ZA')}</span>
                    </div>
                  )}
                </div>

                {selectedTransfer.notes && (
                  <div className="p-3 bg-amber-50 rounded-lg text-sm">
                    <p className="font-medium text-amber-700">Notes</p>
                    <p className="text-amber-600">{selectedTransfer.notes}</p>
                  </div>
                )}
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setTransferDetailOpen(false)}>Close</Button>
                {selectedTransfer.status === 'pending' && (
                  <Button className="bg-green-600 hover:bg-green-700">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                )}
                {selectedTransfer.status === 'in_transit' && (
                  <Button className="bg-[#00897B] hover:bg-[#00695C]">
                    <Package className="h-4 w-4 mr-2" />
                    Mark Received
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* New Transfer Dialog */}
      <Dialog open={newTransferOpen} onOpenChange={setNewTransferOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Stock Transfer</DialogTitle>
            <DialogDescription>
              Create a transfer request between locations
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">From Location</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(loc => (
                      <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">To Location</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(loc => (
                      <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Notes</label>
              <Input placeholder="Optional notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewTransferOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]">
              Create Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Location Dialog */}
      <Dialog open={newLocationOpen} onOpenChange={setNewLocationOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Location</DialogTitle>
            <DialogDescription>
              Register a new branch, warehouse, or kiosk
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Location Name</label>
                <Input placeholder="e.g., Sandton City Mall" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="store">Store</SelectItem>
                    <SelectItem value="warehouse">Warehouse</SelectItem>
                    <SelectItem value="kiosk">Kiosk</SelectItem>
                    <SelectItem value="franchise">Franchise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Address</label>
              <Input placeholder="Street address" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">City</label>
                <Input placeholder="City" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Province</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gauteng">Gauteng</SelectItem>
                    <SelectItem value="western_cape">Western Cape</SelectItem>
                    <SelectItem value="kzn">KwaZulu-Natal</SelectItem>
                    <SelectItem value="eastern_cape">Eastern Cape</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Manager Name</label>
              <Input placeholder="Manager name" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewLocationOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]">
              Add Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default MultiLocationView
