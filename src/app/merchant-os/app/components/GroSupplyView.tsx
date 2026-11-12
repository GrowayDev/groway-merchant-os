'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
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
import { Progress } from '@/components/ui/progress'
import { 
  Package,
  ShoppingCart,
  FileText,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Coins,
  Building2,
  Search,
  Plus,
  ChevronRight,
  TrendingUp,
  Calendar,
  CreditCard,
  X,
  Eye,
  Send,
  ArrowRight,
  Timer,
  BoxIcon,
  Zap,
  Sparkles,
  BarChart3,
  Star,
  MapPin,
  Award,
  Phone,
  Mail,
  Globe,
  Store,
  Filter,
  SlidersHorizontal,
  RefreshCw,
  Users,
  Loader2,
} from 'lucide-react'
import { useMerchantData } from '../hooks/useMerchantData'
import { EmptyState } from './EmptyState'

// Business Verticals configuration
const BUSINESS_VERTICALS = [
  { id: 'all', name: 'All Verticals', icon: Store },
  { id: 'fnb', name: 'Food & Beverage', icon: Package },
  { id: 'liquor', name: 'Liquor & Nightlife', icon: ShoppingCart },
  { id: 'grocery', name: 'Grocery & FMCG', icon: Building2 },
  { id: 'health-beauty', name: 'Health & Beauty', icon: Star },
  { id: 'fashion', name: 'Fashion & Apparel', icon: Award },
  { id: 'pharmacy', name: 'Health & Pharmacy', icon: Package },
  { id: 'hospitality', name: 'Hospitality', icon: Building2 },
  { id: 'hardware', name: 'Hardware & Building', icon: Truck },
  { id: 'electronics', name: 'Electronics & Tech', icon: Package },
  { id: 'sport', name: 'Sport & Leisure', icon: MapPin },
  { id: 'childcare', name: 'Childcare & Education', icon: Users },
  { id: 'professional', name: 'Professional Services', icon: Building2 },
]

// Types
interface Supplier {
  id: string
  name: string
  code: string
  contactPerson?: string
  email?: string
  phone?: string
  website?: string
  address?: string
  city?: string
  province?: string
  supplierType: string
  tier: string
  bbbeeLevel?: number
  rating: number
  reviewCount: number
  deliveryDays: number
  minOrderValue: number
  minOrderUnit?: string
  paymentTerms: string
  categories: string[]
  verticals: string[]
  subVerticals: string[]
  fulfillmentRate: number
  notes?: string
  status: string
  verificationStatus: string
  _count?: {
    purchaseOrders: number
    quotes: number
    rfqs: number
  }
}

// Tier colors
const getTierColor = (tier: string) => {
  switch (tier) {
    case 'platinum': return 'bg-gray-200 text-gray-800 border-gray-400'
    case 'gold': return 'bg-yellow-100 text-yellow-800 border-yellow-400'
    case 'silver': return 'bg-gray-100 text-gray-600 border-gray-300'
    case 'bronze': return 'bg-amber-100 text-amber-800 border-amber-400'
    default: return 'bg-gray-100 text-gray-600'
  }
}

// Supplier type icons
const getSupplierTypeIcon = (type: string) => {
  switch (type) {
    case 'manufacturer': return Building2
    case 'distributor': return Truck
    case 'wholesaler': return Package
    case 'farmer': return Store
    default: return Building2
  }
}

export function GroSupplyView() {
  // Get merchant context
  const { merchantId, isLoading: isLoadingMerchant } = useMerchantData()
  
  const [selectedTab, setSelectedTab] = useState('dashboard')
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedVertical, setSelectedVertical] = useState('all')
  const [selectedTier, setSelectedTier] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [supplierDetailOpen, setSupplierDetailOpen] = useState(false)
  
  // GroCredit facility state
  const [creditFacility, setCreditFacility] = useState<{
    approvedLimit: number
    availableCredit: number
    usedCredit: number
    interestRate: number
    status: string
  } | null>(null)
  const [isLoadingCredit, setIsLoadingCredit] = useState(true)
  
  // Fetch suppliers from API
  useEffect(() => {
    const fetchSuppliers = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        params.append('status', 'active')
        
        if (selectedVertical && selectedVertical !== 'all') {
          const verticalName = BUSINESS_VERTICALS.find(v => v.id === selectedVertical)?.name
          if (verticalName) {
            params.append('vertical', verticalName)
          }
        }
        
        if (selectedTier && selectedTier !== 'all') {
          params.append('tier', selectedTier)
        }
        
        if (searchQuery) {
          params.append('search', searchQuery)
        }

        const response = await fetch(`/merchant-os/api/grosupply/suppliers?${params.toString()}`)
        const data = await response.json()
        
        let filteredSuppliers = data.suppliers || []
        if (selectedType && selectedType !== 'all') {
          filteredSuppliers = filteredSuppliers.filter((s: Supplier) => s.supplierType === selectedType)
        }
        
        setSuppliers(filteredSuppliers)
      } catch (error) {
        console.error('Error fetching suppliers:', error)
        setSuppliers([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchSuppliers()
  }, [selectedVertical, selectedTier, searchQuery, selectedType])
  
  // Fetch GroCredit facility data
  useEffect(() => {
    const fetchCreditFacility = async () => {
      if (!merchantId) return
      setIsLoadingCredit(true)
      try {
        const response = await fetch(`/merchant-os/api/grocredit/facility?merchantId=${merchantId}`)
        if (response.ok) {
          const data = await response.json()
          setCreditFacility(data.facility || null)
        }
      } catch (error) {
        console.error('Error fetching credit facility:', error)
      } finally {
        setIsLoadingCredit(false)
      }
    }
    
    fetchCreditFacility()
  }, [merchantId])

  // Stats
  const stats = useMemo(() => {
    const goldCount = suppliers.filter(s => s.tier === 'gold').length
    const silverCount = suppliers.filter(s => s.tier === 'silver').length
    const bronzeCount = suppliers.filter(s => s.tier === 'bronze').length
    const verifiedCount = suppliers.filter(s => s.verificationStatus === 'verified').length
    const avgRating = suppliers.length > 0 
      ? suppliers.reduce((sum, s) => sum + s.rating, 0) / suppliers.length 
      : 0
    
    return {
      total: suppliers.length,
      gold: goldCount,
      silver: silverCount,
      bronze: bronzeCount,
      verified: verifiedCount,
      avgRating: avgRating.toFixed(1)
    }
  }, [suppliers])

  // Group suppliers by tier for dashboard
  const suppliersByTier = useMemo(() => ({
    gold: suppliers.filter(s => s.tier === 'gold').slice(0, 5),
    silver: suppliers.filter(s => s.tier === 'silver').slice(0, 5),
    bronze: suppliers.filter(s => s.tier === 'bronze').slice(0, 5),
  }), [suppliers])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'verified':
        return 'bg-green-100 text-green-700'
      case 'pending':
        return 'bg-amber-100 text-amber-700'
      case 'inactive':
      case 'suspended':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const formatPaymentTerms = (terms: string) => {
    switch (terms) {
      case 'cod': return 'COD'
      case 'net7': return 'Net 7'
      case 'net15': return 'Net 15'
      case 'net30': return 'Net 30'
      case 'net60': return 'Net 60'
      default: return terms.toUpperCase()
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
              <Package className="h-5 w-5 text-[#00897B]" />
              GroSupply
            </h1>
            <p className="text-sm text-[#757575]">B2B Supplier Management & Procurement</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-[#E0F2F1] text-[#00897B] border-[#00897B]/20">
              <Sparkles className="h-3 w-3 mr-1" />
              {stats.total} Active Suppliers
            </Badge>
            <Button className="bg-[#00897B] hover:bg-[#00695C]">
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 px-6">
          <TabsList className="h-12 bg-transparent">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <Building2 className="h-4 w-4 mr-2" />
              Suppliers
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="rfq" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <FileText className="h-4 w-4 mr-2" />
              RFQs
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="flex-1 m-0 overflow-auto p-6">
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Card className="border-l-4 border-l-[#00897B]">
                <CardContent className="p-4">
                  <p className="text-xs text-[#757575] mb-1">Total Suppliers</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-yellow-500">
                <CardContent className="p-4">
                  <p className="text-xs text-[#757575] mb-1">Gold Tier</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.gold}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-gray-400">
                <CardContent className="p-4">
                  <p className="text-xs text-[#757575] mb-1">Silver Tier</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.silver}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-amber-500">
                <CardContent className="p-4">
                  <p className="text-xs text-[#757575] mb-1">Bronze Tier</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.bronze}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <p className="text-xs text-[#757575] mb-1">Verified</p>
                  <p className="text-2xl font-bold text-green-600">{stats.verified}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-[#757575] mb-1">Avg Rating</p>
                  <p className="text-2xl font-bold flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    {stats.avgRating}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Top Suppliers by Tier */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Gold Suppliers */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Award className="h-4 w-4 text-yellow-500" />
                    Gold Suppliers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {suppliersByTier.gold.map(supplier => (
                      <div 
                        key={supplier.id} 
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => { setSelectedSupplier(supplier); setSupplierDetailOpen(true); }}
                      >
                        <div className="w-10 h-10 rounded-lg bg-yellow-100 text-yellow-600 flex items-center justify-center font-bold">
                          {supplier.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{supplier.name}</p>
                          <div className="flex items-center gap-1 text-xs text-[#757575]">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            {supplier.rating.toFixed(1)}
                            {supplier.city && (
                              <>
                                <span className="mx-1">•</span>
                                <MapPin className="h-3 w-3" />
                                {supplier.city}
                              </>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-[#757575]" />
                      </div>
                    ))}
                    {suppliersByTier.gold.length === 0 && (
                      <p className="text-sm text-[#757575] text-center py-4">No gold suppliers</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Silver Suppliers */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Award className="h-4 w-4 text-gray-400" />
                    Silver Suppliers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {suppliersByTier.silver.map(supplier => (
                      <div 
                        key={supplier.id} 
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => { setSelectedSupplier(supplier); setSupplierDetailOpen(true); }}
                      >
                        <div className="w-10 h-10 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center font-bold">
                          {supplier.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{supplier.name}</p>
                          <div className="flex items-center gap-1 text-xs text-[#757575]">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            {supplier.rating.toFixed(1)}
                            {supplier.city && (
                              <>
                                <span className="mx-1">•</span>
                                <MapPin className="h-3 w-3" />
                                {supplier.city}
                              </>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-[#757575]" />
                      </div>
                    ))}
                    {suppliersByTier.silver.length === 0 && (
                      <p className="text-sm text-[#757575] text-center py-4">No silver suppliers</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Bronze Suppliers */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Award className="h-4 w-4 text-amber-600" />
                    Bronze Suppliers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {suppliersByTier.bronze.map(supplier => (
                      <div 
                        key={supplier.id} 
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => { setSelectedSupplier(supplier); setSupplierDetailOpen(true); }}
                      >
                        <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                          {supplier.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{supplier.name}</p>
                          <div className="flex items-center gap-1 text-xs text-[#757575]">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            {supplier.rating.toFixed(1)}
                            {supplier.city && (
                              <>
                                <span className="mx-1">•</span>
                                <MapPin className="h-3 w-3" />
                                {supplier.city}
                              </>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-[#757575]" />
                      </div>
                    ))}
                    {suppliersByTier.bronze.length === 0 && (
                      <p className="text-sm text-[#757575] text-center py-4">No bronze suppliers</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* GroCredit Widget */}
            <Card className="border-l-4 border-l-[#00897B]">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-[#00897B]" />
                  GroCredit Facility
                </CardTitle>
                <CardDescription>Merchant working capital for supplier payments</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingCredit ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[#00897B]" />
                  </div>
                ) : creditFacility ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gradient-to-br from-[#00897B] to-[#4CAF50] rounded-xl text-white">
                      <p className="text-sm opacity-80">Available Credit</p>
                      <p className="text-3xl font-bold">R{creditFacility.availableCredit?.toLocaleString('en-ZA') || '0'}</p>
                      <div className="mt-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="opacity-80">Used</span>
                          <span>R{creditFacility.usedCredit?.toLocaleString('en-ZA') || '0'} / R{creditFacility.approvedLimit?.toLocaleString('en-ZA') || '0'}</span>
                        </div>
                        <Progress 
                          value={creditFacility.approvedLimit > 0 ? (creditFacility.usedCredit / creditFacility.approvedLimit) * 100 : 0} 
                          className="h-2 bg-white/20" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start" disabled={!creditFacility || creditFacility.status !== 'active'}>
                        <Coins className="h-4 w-4 mr-2" />
                        Draw Funds
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        View Statements
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start">
                        <Calendar className="h-4 w-4 mr-2" />
                        Repayment Schedule
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Zap className="h-4 w-4 mr-2" />
                        Increase Limit
                      </Button>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    icon={CreditCard}
                    title="No Credit Facility"
                    description="Apply for GroCredit to get working capital for supplier payments"
                    action={{
                      label: "Apply for GroCredit",
                      onClick: () => window.location.href = '/merchant-os?tab=GroCredit'
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="flex-1 m-0 overflow-auto">
          <div className="flex h-full">
            {/* Filters Sidebar */}
            <div className="hidden lg:block w-64 border-r border-gray-200 bg-white p-4">
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3 flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </h3>
                
                {/* Vertical Filter */}
                <div className="mb-4">
                  <label className="text-xs text-[#757575] mb-2 block">Business Vertical</label>
                  <Select value={selectedVertical} onValueChange={setSelectedVertical}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_VERTICALS.map(vertical => (
                        <SelectItem key={vertical.id} value={vertical.id}>
                          {vertical.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tier Filter */}
                <div className="mb-4">
                  <label className="text-xs text-[#757575] mb-2 block">Supplier Tier</label>
                  <Select value={selectedTier} onValueChange={setSelectedTier}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tiers</SelectItem>
                      <SelectItem value="platinum">Platinum</SelectItem>
                      <SelectItem value="gold">Gold</SelectItem>
                      <SelectItem value="silver">Silver</SelectItem>
                      <SelectItem value="bronze">Bronze</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Type Filter */}
                <div className="mb-4">
                  <label className="text-xs text-[#757575] mb-2 block">Supplier Type</label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="manufacturer">Manufacturer</SelectItem>
                      <SelectItem value="distributor">Distributor</SelectItem>
                      <SelectItem value="wholesaler">Wholesaler</SelectItem>
                      <SelectItem value="farmer">Farmer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setSelectedVertical('all')
                    setSelectedTier('all')
                    setSelectedType('all')
                    setSearchQuery('')
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset Filters
                </Button>
              </div>
            </div>

            {/* Supplier List */}
            <div className="flex-1 flex flex-col">
              {/* Search Header */}
              <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex gap-4 items-center">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
                    <Input
                      placeholder="Search suppliers..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="lg:hidden">
                    <Select value={selectedVertical} onValueChange={setSelectedVertical}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BUSINESS_VERTICALS.map(vertical => (
                          <SelectItem key={vertical.id} value={vertical.id}>
                            {vertical.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-sm text-[#757575]">
                    {suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Supplier Grid */}
              <ScrollArea className="flex-1 p-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-[#00897B]" />
                      <p className="text-[#757575]">Loading suppliers...</p>
                    </div>
                  </div>
                ) : suppliers.length === 0 ? (
                  <div className="text-center py-16">
                    <Store className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">No Suppliers Found</h3>
                    <p className="text-[#757575] mb-4">
                      No suppliers match your current filters
                    </p>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setSelectedVertical('all')
                        setSelectedTier('all')
                        setSelectedType('all')
                        setSearchQuery('')
                      }}
                    >
                      Reset Filters
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {suppliers.map((supplier) => {
                      const TypeIcon = getSupplierTypeIcon(supplier.supplierType)
                      return (
                        <Card 
                          key={supplier.id}
                          className="cursor-pointer hover:border-[#00897B]/30 hover:shadow-md transition-all"
                          onClick={() => { setSelectedSupplier(supplier); setSupplierDetailOpen(true); }}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-[#E0F2F1] flex items-center justify-center text-[#00897B]">
                                  <TypeIcon className="h-5 w-5" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-[#1A1A1A] line-clamp-1">{supplier.name}</p>
                                    {supplier.verificationStatus === 'verified' && (
                                      <CheckCircle2 className="h-4 w-4 text-[#00897B] shrink-0" />
                                    )}
                                  </div>
                                  <p className="text-xs text-[#757575] capitalize">{supplier.supplierType}</p>
                                </div>
                              </div>
                              <Badge className={getTierColor(supplier.tier)} variant="outline">
                                {supplier.tier}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-4 text-sm mb-3">
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                <span className="font-medium">{supplier.rating.toFixed(1)}</span>
                                <span className="text-[#757575]">({supplier.reviewCount})</span>
                              </div>
                              {supplier.city && (
                                <div className="flex items-center gap-1 text-[#757575]">
                                  <MapPin className="h-4 w-4" />
                                  {supplier.city}
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-xs text-center mb-3">
                              <div className="p-2 bg-gray-50 rounded">
                                <p className="font-medium">{supplier.deliveryDays}d</p>
                                <p className="text-[#757575]">Delivery</p>
                              </div>
                              <div className="p-2 bg-gray-50 rounded">
                                <p className="font-medium">{supplier.fulfillmentRate}%</p>
                                <p className="text-[#757575]">Fulfill</p>
                              </div>
                              <div className="p-2 bg-gray-50 rounded">
                                <p className="font-medium">L{supplier.bbbeeLevel || '-'}</p>
                                <p className="text-[#757575]">B-BBEE</p>
                              </div>
                            </div>

                            {/* Verticals */}
                            {supplier.verticals && supplier.verticals.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {supplier.verticals.slice(0, 2).map((v, idx) => (
                                  <Badge key={idx} variant="outline" className="text-[10px]">
                                    {v}
                                  </Badge>
                                ))}
                                {supplier.verticals.length > 2 && (
                                  <Badge variant="outline" className="text-[10px]">
                                    +{supplier.verticals.length - 2}
                                  </Badge>
                                )}
                              </div>
                            )}

                            {/* Categories */}
                            {supplier.categories && supplier.categories.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {supplier.categories.slice(0, 3).map((cat, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-[10px] bg-gray-100">
                                    {cat}
                                  </Badge>
                                ))}
                                {supplier.categories.length > 3 && (
                                  <Badge variant="secondary" className="text-[10px] bg-gray-100">
                                    +{supplier.categories.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="flex-1 m-0 overflow-auto p-6">
          <div className="text-center py-16">
            <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">Purchase Orders</h3>
            <p className="text-[#757575] mb-4">
              Manage your supplier orders and track deliveries
            </p>
            <Button className="bg-[#00897B] hover:bg-[#00695C]">
              <Plus className="h-4 w-4 mr-2" />
              Create Purchase Order
            </Button>
          </div>
        </TabsContent>

        {/* RFQ Tab */}
        <TabsContent value="rfq" className="flex-1 m-0 overflow-auto p-6">
          <div className="text-center py-16">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">Request for Quotations</h3>
            <p className="text-[#757575] mb-4">
              Create RFQs and receive competitive quotes from suppliers
            </p>
            <Button className="bg-[#00897B] hover:bg-[#00695C]">
              <Plus className="h-4 w-4 mr-2" />
              Create RFQ
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Supplier Detail Dialog */}
      <Dialog open={supplierDetailOpen} onOpenChange={setSupplierDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedSupplier && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedSupplier.name}
                  {selectedSupplier.verificationStatus === 'verified' && (
                    <Badge className="bg-green-100 text-green-700">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription>
                  {selectedSupplier.code} • {selectedSupplier.supplierType}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Badge className={getTierColor(selectedSupplier.tier)} variant="outline">
                      {selectedSupplier.tier}
                    </Badge>
                    <p className="text-xs text-[#757575] mt-1">Tier</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold">{selectedSupplier.rating.toFixed(1)}</p>
                    <Star className="h-4 w-4 mx-auto text-yellow-500 fill-yellow-500" />
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold">{selectedSupplier.fulfillmentRate}%</p>
                    <p className="text-xs text-[#757575]">Fulfillment</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold">L{selectedSupplier.bbbeeLevel || '-'}</p>
                    <p className="text-xs text-[#757575]">B-BBEE</p>
                  </div>
                </div>

                {/* Contact Info */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Contact Information</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedSupplier.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-[#757575]" />
                        {selectedSupplier.phone}
                      </div>
                    )}
                    {selectedSupplier.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-[#757575]" />
                        {selectedSupplier.email}
                      </div>
                    )}
                    {selectedSupplier.website && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="h-4 w-4 text-[#757575]" />
                        {selectedSupplier.website}
                      </div>
                    )}
                    {selectedSupplier.city && selectedSupplier.province && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-[#757575]" />
                        {selectedSupplier.city}, {selectedSupplier.province}
                      </div>
                    )}
                  </div>
                </div>

                {/* Verticals & Categories */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Verticals Served</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedSupplier.verticals?.map((v, idx) => (
                        <Badge key={idx} className="bg-[#E0F2F1] text-[#00897B]">
                          {v}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Categories</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedSupplier.categories?.map((cat, idx) => (
                        <Badge key={idx} variant="outline">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Order Terms */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Order Terms</h4>
                  <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-[#757575]">Min Order</p>
                      <p className="font-medium">
                        {selectedSupplier.minOrderValue > 0 
                          ? `R${selectedSupplier.minOrderValue}` 
                          : selectedSupplier.minOrderUnit || 'None'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#757575]">Payment Terms</p>
                      <p className="font-medium">{formatPaymentTerms(selectedSupplier.paymentTerms)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#757575]">Delivery</p>
                      <p className="font-medium">{selectedSupplier.deliveryDays} days</p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedSupplier.notes && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Notes</h4>
                    <p className="text-sm text-[#757575]">{selectedSupplier.notes}</p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSupplierDetailOpen(false)}>
                  Close
                </Button>
                <Button className="bg-[#00897B] hover:bg-[#00695C]">
                  <Send className="h-4 w-4 mr-2" />
                  Request Quote
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
