'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Building2,
  Package,
  Truck,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Star,
  RefreshCw,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  BarChart3,
  Globe,
  Phone,
  Mail,
  FileText,
  Filter,
  Search,
  ChevronRight,
  Store,
  ShoppingCart,
  Tag,
  MapPin,
  Users,
  Box,
  CreditCard,
  Zap,
  Bot,
  Target,
  Lightbulb,
  AlertTriangle,
  Info,
  MessageSquare,
  Send,
  Award,
  SlidersHorizontal,
  Percent,
  Scale,
} from 'lucide-react'
import { useMerchantData } from '../hooks/useMerchantData'
import { EmptyState, NoDataEmptyState } from './EmptyState'

// ============================================
// TYPES
// ============================================

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

// Supplier Rating/Review interface
interface SupplierReview {
  id: string
  supplierId: string
  merchantId: string
  merchantName: string
  rating: number
  title: string
  comment: string
  date: string
  verified: boolean
  helpful: number
  categories: {
    quality: number
    delivery: number
    communication: number
    value: number
  }
}

// Product for comparison interface
interface SupplierProduct {
  id: string
  supplierId: string
  name: string
  category: string
  unit: string
  minOrderQty: number
  price: number
  bulkPrices: { minQty: number; price: number; discount: number }[]
  inStock: boolean
  leadTime: number
  sku: string
}

// Bulk Discount tier interface
interface BulkDiscount {
  id: string
  supplierId: string
  category: string
  minQty: number
  maxQty?: number
  discountPercent: number
  description: string
}

// ============================================
// BUSINESS VERTICALS CONFIG
// ============================================

const BUSINESS_VERTICALS = [
  { id: 'all', name: 'All Verticals', icon: Store, description: 'Browse all suppliers' },
  { id: 'fnb', name: 'Food & Beverage', icon: Package, description: 'Restaurants, cafes, caterers' },
  { id: 'liquor', name: 'Liquor & Nightlife', icon: ShoppingCart, description: 'Bars, clubs, bottle stores' },
  { id: 'grocery', name: 'Grocery & FMCG', icon: Building2, description: 'Supermarkets, spaza shops' },
  { id: 'health-beauty', name: 'Health & Beauty', icon: Star, description: 'Salons, spas, barbers' },
  { id: 'fashion', name: 'Fashion & Apparel', icon: Tag, description: 'Clothing stores, boutiques' },
  { id: 'pharmacy', name: 'Health & Pharmacy', icon: Package, description: 'Pharmacies, clinics' },
  { id: 'hospitality', name: 'Hospitality', icon: Building2, description: 'Hotels, guesthouses, B&Bs' },
  { id: 'hardware', name: 'Hardware & Building', icon: Truck, description: 'Hardware stores, builders' },
  { id: 'electronics', name: 'Electronics & Tech', icon: Package, description: 'Electronics retailers' },
  { id: 'sport', name: 'Sport & Leisure', icon: Target, description: 'Sports shops, gyms' },
  { id: 'childcare', name: 'Childcare & Education', icon: Users, description: 'Schools, daycares' },
  { id: 'professional', name: 'Professional Services', icon: Building2, description: 'Offices, professional services' },
]

// ============================================
// HELPER FUNCTIONS
// ============================================

const getTierColor = (tier: string) => {
  switch (tier) {
    case 'platinum': return 'bg-gray-200 text-gray-800 border-gray-400'
    case 'gold': return 'bg-yellow-100 text-yellow-800 border-yellow-400'
    case 'silver': return 'bg-gray-100 text-gray-600 border-gray-300'
    case 'bronze': return 'bg-amber-100 text-amber-800 border-amber-400'
    default: return 'bg-gray-100 text-gray-600'
  }
}

const getSupplierTypeIcon = (type: string) => {
  switch (type) {
    case 'manufacturer': return Building2
    case 'distributor': return Truck
    case 'wholesaler': return Package
    case 'farmer': return Store
    default: return Building2
  }
}

// ============================================
// MAIN COMPONENT
// ============================================

export function GroSupplyMarketplaceView() {
  // Get merchant data from session
  const { merchantId, isLoading: isLoadingMerchant } = useMerchantData()
  
  const [activeTab, setActiveTab] = useState('marketplace')
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedVertical, setSelectedVertical] = useState('all')
  const [selectedTier, setSelectedTier] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [supplierDetailOpen, setSupplierDetailOpen] = useState(false)
  const [compareProductsOpen, setCompareProductsOpen] = useState(false)
  const [selectedProductsForCompare, setSelectedProductsForCompare] = useState<SupplierProduct[]>([])
  const [bulkDiscountsOpen, setBulkDiscountsOpen] = useState(false)

  // Data from API (no mock data)
  const [supplierReviews, setSupplierReviews] = useState<SupplierReview[]>([])
  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>([])
  const [bulkDiscounts, setBulkDiscounts] = useState<BulkDiscount[]>([])

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

  // Stats
  const stats = useMemo(() => ({
    totalSuppliers: suppliers.length,
    verifiedCount: suppliers.filter(s => s.verificationStatus === 'verified').length,
    goldCount: suppliers.filter(s => s.tier === 'gold').length,
    avgRating: suppliers.length > 0 
      ? (suppliers.reduce((sum, s) => sum + s.rating, 0) / suppliers.length).toFixed(1)
      : '0.0',
  }), [suppliers])

  // Current vertical info
  const currentVertical = BUSINESS_VERTICALS.find(v => v.id === selectedVertical)

  // Format payment terms
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

  if (isLoading && suppliers.length === 0) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-[#00897B]" />
          <p className="text-[#757575]">Loading marketplace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#1A1A1A] flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-[#00897B]" />
              GroMarket
            </h1>
            <p className="text-sm text-[#757575]">B2B Supplier Marketplace - {stats.totalSuppliers} suppliers available</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCompareProductsOpen(true)}>
              <Package className="h-4 w-4 mr-2" />
              Compare Products
            </Button>
            <Button variant="outline" size="sm" onClick={() => setBulkDiscountsOpen(true)}>
              <Percent className="h-4 w-4 mr-2" />
              Bulk Discounts
            </Button>
            <Button variant="outline" size="sm">
              <MessageSquare className="h-4 w-4 mr-2" />
              Messages
            </Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]">
              <Plus className="h-4 w-4 mr-2" />
              Become a Supplier
            </Button>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 border-r border-gray-200 bg-white overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">Business Verticals</h3>
            <div className="space-y-1">
              {BUSINESS_VERTICALS.map(vertical => {
                const Icon = vertical.icon
                const isActive = selectedVertical === vertical.id
                const count = selectedVertical === 'all' || vertical.id === 'all' 
                  ? '' 
                  : suppliers.filter(s => s.verticals?.some(v => v.includes(vertical.name))).length
                
                return (
                  <button
                    key={vertical.id}
                    onClick={() => setSelectedVertical(vertical.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                      isActive 
                        ? 'bg-[#E0F2F1] text-[#00897B] font-medium' 
                        : 'text-[#757575] hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1 text-left">{vertical.name}</span>
                    {count && <span className="text-xs text-[#757575]">{count}</span>}
                  </button>
                )
              })}
            </div>

            <Separator className="my-4" />

            <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">Supplier Tier</h3>
            <div className="space-y-1">
              {['all', 'platinum', 'gold', 'silver', 'bronze'].map(tier => (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm capitalize transition-all ${
                    selectedTier === tier 
                      ? 'bg-[#E0F2F1] text-[#00897B] font-medium' 
                      : 'text-[#757575] hover:bg-gray-100'
                  }`}
                >
                  {tier === 'all' ? 'All Tiers' : tier}
                </button>
              ))}
            </div>

            <Separator className="my-4" />

            <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">Supplier Type</h3>
            <div className="space-y-1">
              {['all', 'manufacturer', 'distributor', 'wholesaler', 'farmer'].map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm capitalize transition-all ${
                    selectedType === type 
                      ? 'bg-[#E0F2F1] text-[#00897B] font-medium' 
                      : 'text-[#757575] hover:bg-gray-100'
                  }`}
                >
                  {type === 'all' ? 'All Types' : type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search Bar */}
          <div className="bg-white border-b border-gray-200 px-6 py-3">
            <div className="flex gap-4 items-center">
              {/* Mobile Filter Sheet */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold mb-2">Business Verticals</h3>
                      <Select value={selectedVertical} onValueChange={setSelectedVertical}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BUSINESS_VERTICALS.map(v => (
                            <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold mb-2">Supplier Tier</h3>
                      <Select value={selectedTier} onValueChange={setSelectedTier}>
                        <SelectTrigger>
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
                    <div>
                      <h3 className="text-sm font-semibold mb-2">Supplier Type</h3>
                      <Select value={selectedType} onValueChange={setSelectedType}>
                        <SelectTrigger>
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
                  </div>
                </SheetContent>
              </Sheet>

              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
                <Input
                  placeholder="Search suppliers..." 
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <p className="text-sm text-[#757575]">
                {suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''}
                {currentVertical?.id !== 'all' && (
                  <Badge className="ml-2 bg-[#E0F2F1] text-[#00897B]">
                    {currentVertical?.name}
                  </Badge>
                )}
              </p>
            </div>
          </div>

          {/* Supplier Grid */}
          <ScrollArea className="flex-1 p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="h-8 w-8 animate-spin text-[#00897B]" />
              </div>
            ) : suppliers.length === 0 ? (
              <div className="text-center py-16">
                <Store className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">No Suppliers Found</h3>
                <p className="text-[#757575] mb-4">
                  {currentVertical?.id !== 'all'
                    ? `No suppliers found for ${currentVertical?.name}. Try a different vertical.`
                    : 'No suppliers match your search criteria.'}
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
                          <div className="flex flex-wrap gap-1 mb-2">
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
                          <div className="flex flex-wrap gap-1">
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

            {/* GroAI Recommendations */}
            {!isLoading && suppliers.length > 0 && (
              <Card className="mt-6 border-l-4 border-l-[#00897B]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Bot className="h-4 w-4 text-[#00897B]" />
                    GroAI Procurement Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { type: 'opportunity', title: 'Bulk Order Savings', description: 'Order from Gold tier suppliers to unlock volume discounts. Estimated savings: 8-15%.', action: 'View Deals', priority: 'high' },
                      { type: 'alert', title: 'New Suppliers Available', description: `${stats.verifiedCount} verified suppliers match your business vertical. Explore new partnerships.`, action: 'Browse', priority: 'medium' },
                      { type: 'trend', title: 'B-BBEE Compliance', description: 'Filter by B-BBEE level to meet procurement compliance requirements.', action: 'Filter Now', priority: 'low' },
                      { type: 'recommendation', title: 'Fast Delivery Options', description: `${suppliers.filter(s => s.deliveryDays <= 2).length} suppliers offer 1-2 day delivery in your area.`, action: 'View Fast Delivery', priority: 'medium' },
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
            )}
          </ScrollArea>
        </div>
      </div>

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

      {/* Compare Products Dialog */}
      <Dialog open={compareProductsOpen} onOpenChange={setCompareProductsOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-[#00897B]" />
              Compare Products
            </DialogTitle>
            <DialogDescription>
              Compare products from different suppliers to find the best value
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Product Selection */}
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <Label className="text-xs text-[#757575]">Select Products to Compare</Label>
                <Select onValueChange={(value) => {
                  const product = supplierProducts.find(p => p.id === value)
                  if (product && selectedProductsForCompare.length < 4 && !selectedProductsForCompare.find(p => p.id === value)) {
                    setSelectedProductsForCompare(prev => [...prev, product])
                  }
                }}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a product..." />
                  </SelectTrigger>
                  <SelectContent>
                    {supplierProducts.map(p => (
                      <SelectItem key={p.id} value={p.id} disabled={selectedProductsForCompare.find(sp => sp.id === p.id) !== undefined}>
                        {p.name} - {suppliers.find(s => s.id === p.supplierId)?.name || 'Unknown'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-[#757575] mt-4">{selectedProductsForCompare.length}/4 selected</p>
            </div>

            {/* Selected Products */}
            {selectedProductsForCompare.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {selectedProductsForCompare.map(product => (
                  <Badge key={product.id} variant="secondary" className="px-3 py-1">
                    {product.name}
                    <button 
                      className="ml-2 hover:text-red-500"
                      onClick={() => setSelectedProductsForCompare(prev => prev.filter(p => p.id !== product.id))}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Comparison Table */}
            {selectedProductsForCompare.length > 0 && (
              <Card>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-3 font-medium">Attribute</th>
                        {selectedProductsForCompare.map(p => (
                          <th key={p.id} className="text-left p-3 font-medium">
                            {p.name}
                            <p className="text-xs text-[#757575] font-normal">{suppliers.find(s => s.id === p.supplierId)?.name}</p>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr>
                        <td className="p-3 bg-gray-50 font-medium">Price</td>
                        {selectedProductsForCompare.map(p => {
                          const lowest = Math.min(...selectedProductsForCompare.map(sp => sp.price))
                          return (
                            <td key={p.id} className={`p-3 ${p.price === lowest ? 'bg-green-50 text-green-700 font-bold' : ''}`}>
                              R{p.price}/{p.unit}
                              {p.price === lowest && <Badge className="ml-2 bg-green-100 text-green-700 text-[10px]">Best Price</Badge>}
                            </td>
                          )
                        })}
                      </tr>
                      <tr>
                        <td className="p-3 bg-gray-50 font-medium">Category</td>
                        {selectedProductsForCompare.map(p => (
                          <td key={p.id} className="p-3">{p.category}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 bg-gray-50 font-medium">SKU</td>
                        {selectedProductsForCompare.map(p => (
                          <td key={p.id} className="p-3 font-mono text-xs">{p.sku}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 bg-gray-50 font-medium">Min Order</td>
                        {selectedProductsForCompare.map(p => {
                          const lowest = Math.min(...selectedProductsForCompare.map(sp => sp.minOrderQty))
                          return (
                            <td key={p.id} className={`p-3 ${p.minOrderQty === lowest ? 'bg-green-50 text-green-700' : ''}`}>
                              {p.minOrderQty} {p.unit}
                            </td>
                          )
                        })}
                      </tr>
                      <tr>
                        <td className="p-3 bg-gray-50 font-medium">Lead Time</td>
                        {selectedProductsForCompare.map(p => {
                          const lowest = Math.min(...selectedProductsForCompare.map(sp => sp.leadTime))
                          return (
                            <td key={p.id} className={`p-3 ${p.leadTime === lowest ? 'bg-green-50 text-green-700' : ''}`}>
                              {p.leadTime} day{p.leadTime > 1 ? 's' : ''}
                            </td>
                          )
                        })}
                      </tr>
                      <tr>
                        <td className="p-3 bg-gray-50 font-medium">Bulk Pricing</td>
                        {selectedProductsForCompare.map(p => (
                          <td key={p.id} className="p-3">
                            <div className="space-y-1">
                              {p.bulkPrices.map((bp, i) => (
                                <div key={i} className="text-xs">
                                  {bp.minQty}+ units: R{bp.price} ({bp.discount}% off)
                                </div>
                              ))}
                            </div>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 bg-gray-50 font-medium">In Stock</td>
                        {selectedProductsForCompare.map(p => (
                          <td key={p.id} className="p-3">
                            <Badge className={p.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                              {p.inStock ? 'Yes' : 'No'}
                            </Badge>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}

            {selectedProductsForCompare.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-[#757575]">Select products above to compare</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedProductsForCompare([])}>Clear Selection</Button>
            <Button variant="outline" onClick={() => setCompareProductsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Discounts Dialog */}
      <Dialog open={bulkDiscountsOpen} onOpenChange={setBulkDiscountsOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-amber-600" />
              Bulk Order Discounts
            </DialogTitle>
            <DialogDescription>
              Save more when you order in bulk. Check out the available discounts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Discount Summary */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-amber-600">{bulkDiscounts.length}</p>
                  <p className="text-xs text-amber-600">Active Discount Tiers</p>
                </CardContent>
              </Card>
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">Up to {Math.max(...bulkDiscounts.map(d => d.discountPercent))}%</p>
                  <p className="text-xs text-green-600">Maximum Discount</p>
                </CardContent>
              </Card>
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{new Set(bulkDiscounts.map(d => d.category)).size}</p>
                  <p className="text-xs text-blue-600">Product Categories</p>
                </CardContent>
              </Card>
            </div>

            {/* Discounts by Category */}
            {Array.from(new Set(bulkDiscounts.map(d => d.category))).map(category => (
              <Card key={category}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {bulkDiscounts.filter(d => d.category === category).map(discount => {
                      const supplier = suppliers.find(s => s.id === discount.supplierId)
                      return (
                        <div key={discount.id} className="flex items-center gap-4 p-3 bg-gradient-to-r from-amber-50 to-green-50 rounded-lg border">
                          <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                            <span className="font-bold text-amber-700">{discount.discountPercent}%</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{discount.description}</span>
                            </div>
                            <p className="text-xs text-[#757575]">Supplier: {supplier?.name || 'Unknown'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {discount.minQty}{discount.maxQty ? ` - ${discount.maxQty}` : '+'} units
                            </p>
                            <Button size="sm" variant="outline">
                              View Products
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Tip */}
            <Card className="border-l-4 border-l-[#00897B] bg-[#E0F2F1]/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="h-5 w-5 text-[#00897B]" />
                  <div>
                    <h4 className="font-medium text-sm">Bulk Ordering Tip</h4>
                    <p className="text-xs text-[#757575] mt-1">
                      Combine orders with other merchants in your area to reach bulk discount thresholds. 
                      Contact suppliers directly to negotiate custom bulk rates for regular orders.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDiscountsOpen(false)}>Close</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]">
              <Send className="h-4 w-4 mr-2" />
              Request Bulk Quote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
