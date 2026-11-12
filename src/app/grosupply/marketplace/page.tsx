'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Truck,
  ArrowLeft,
  Search,
  Filter,
  MapPin,
  Star,
  Building2,
  Package,
  CheckCircle2,
  Award,
  Utensils,
  Wine,
  ShoppingBag,
  Scissors,
  Shirt,
  Pill,
  Hotel,
  Wrench,
  Smartphone,
  Dumbbell,
  Baby,
  Briefcase,
  Store,
  Phone,
  Mail,
  Globe,
  Clock,
  X,
  MessageSquare,
  CreditCard,
  ShieldCheck,
  Tag,
  DollarSign,
  TrendingUp,
  Grid3X3,
  ListFilter,
  ShoppingBasket,
  Plus,
  Minus,
  ShoppingCart
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
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
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'

// Business Verticals with icons
const businessVerticals = [
  { id: 'all', name: 'All Verticals', icon: Store },
  { id: 'Food & Bev', name: 'Food & Beverage', icon: Utensils },
  { id: 'Liquor', name: 'Liquor & Nightlife', icon: Wine },
  { id: 'Grocery & FMCG', name: 'Grocery & FMCG', icon: ShoppingBag },
  { id: 'Health & Beauty', name: 'Health & Beauty', icon: Scissors },
  { id: 'Fashion & Apparel', name: 'Fashion & Apparel', icon: Shirt },
  { id: 'Health & Pharmacy', name: 'Health & Pharmacy', icon: Pill },
  { id: 'Hospitality', name: 'Hospitality', icon: Hotel },
  { id: 'Hardware & Building', name: 'Hardware & Building', icon: Wrench },
  { id: 'Electronics & Tech', name: 'Electronics & Tech', icon: Smartphone },
  { id: 'Sport & Leisure', name: 'Sport & Leisure', icon: Dumbbell },
  { id: 'Childcare & Education', name: 'Childcare & Education', icon: Baby },
  { id: 'Professional Services', name: 'Professional Services', icon: Briefcase },
]

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

// Source type colors
const getSourceTypeColor = (type: string) => {
  switch (type) {
    case 'wholesale': return 'bg-amber-100 text-amber-800'
    case 'sku_catalog': return 'bg-emerald-100 text-emerald-800'
    default: return 'bg-gray-100 text-gray-600'
  }
}

// Category colors
const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    'Food & Bev': 'bg-orange-100 text-orange-800',
    'Grocery & FMCG': 'bg-green-100 text-green-800',
    'Liquor': 'bg-purple-100 text-purple-800',
    'Health & Beauty': 'bg-pink-100 text-pink-800',
    'Beverages': 'bg-blue-100 text-blue-800',
    'Cleaning': 'bg-cyan-100 text-cyan-800',
  }
  return colors[category] || 'bg-gray-100 text-gray-600'
}

interface Supplier {
  id: string
  name: string
  code: string
  contactPerson?: string
  email?: string
  phone?: string
  city?: string
  province?: string
  supplierType: string
  tier: string
  bbbeeLevel?: number
  rating: number
  reviewCount: number
  deliveryDays: number
  minOrderValue: number
  paymentTerms: string
  categories: string[]
  verticals: string[]
  subVerticals: string[]
  fulfillmentRate: number
  status: string
  verificationStatus: string
}

interface CatalogProduct {
  id: string
  sku: string
  sourceType: string
  vertical: string
  subVertical?: string
  category: string
  subCategory?: string
  description: string
  brand?: string
  packSize: string
  unit: string
  vatRate: number
  costPrice: number
  retailPrice: number
  grossMargin: number
  minOrderQty: number
  leadDays: number
  inStock: boolean
  notes?: string
  verticalsServed?: string[]
  wholesaler?: {
    id: string
    name: string
    code: string
    type: string
  }
  supplier?: {
    name: string
    tier: string
  }
}

interface Aggregation {
  name: string
  count: number
}

interface CatalogResponse {
  products: CatalogProduct[]
  total: number
  aggregations: {
    verticals: Aggregation[]
    categories: Aggregation[]
  }
  wholesalers: { id: string; name: string; code: string; type: string }[]
}

function MarketplaceContent() {
  const searchParams = useSearchParams()
  const initialVertical = searchParams.get('vertical') || 'all'
  const initialTab = searchParams.get('tab') || 'suppliers'

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(initialTab)
  const [selectedVertical, setSelectedVertical] = useState(initialVertical)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTier, setSelectedTier] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedWholesaler, setSelectedWholesaler] = useState('all')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000])
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null)
  
  // Cart state
  const [cartItemCount, setCartItemCount] = useState(0)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [showCartSuccess, setShowCartSuccess] = useState(false)
  const [isCreatingRFQ, setIsCreatingRFQ] = useState(false)
  const [showRFQSuccess, setShowRFQSuccess] = useState(false)
  
  // Aggregations
  const [verticalAggs, setVerticalAggs] = useState<Aggregation[]>([])
  const [categoryAggs, setCategoryAggs] = useState<Aggregation[]>([])
  const [wholesalersList, setWholesalersList] = useState<{ id: string; name: string; code: string; type: string }[]>([])
  const [totalProducts, setTotalProducts] = useState(0)
  const [totalSuppliers, setTotalSuppliers] = useState(0)

  // Fetch cart count
  const fetchCartCount = async () => {
    try {
      const response = await fetch('/merchant-os/api/grosupply/cart?merchantId=demo-merchant')
      const data = await response.json()
      setCartItemCount(data.cart?.totalItems || 0)
    } catch (error) {
      console.error('Error fetching cart:', error)
    }
  }

  // Add item to cart
  const addToCart = async (product: CatalogProduct) => {
    setIsAddingToCart(true)
    try {
      const response = await fetch('/merchant-os/api/grosupply/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: 'demo-merchant',
          supplierId: product.supplier?.name ? undefined : undefined,
          items: [{
            sku: product.sku,
            description: product.description,
            quantity: product.minOrderQty || 1,
            unitPrice: product.costPrice,
            unit: product.unit
          }]
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setCartItemCount(prev => prev + 1)
        setShowCartSuccess(true)
        setTimeout(() => setShowCartSuccess(false), 2000)
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
    } finally {
      setIsAddingToCart(false)
    }
  }

  // Request Quote (RFQ) for product
  const requestQuote = async (product: CatalogProduct) => {
    setIsCreatingRFQ(true)
    try {
      const response = await fetch('/merchant-os/api/grosupply/marketplace/rfq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: 'demo-merchant',
          supplierId: product.supplier?.name || undefined,
          items: [{
            sku: product.sku,
            description: product.description,
            quantity: product.minOrderQty || 1,
            unit: product.unit,
            notes: `Requesting quote for ${product.brand || ''} ${product.description}`
          }],
          notes: `Quote request from GroSupply Marketplace`
        })
      })
      
      if (response.ok) {
        setShowRFQSuccess(true)
        setTimeout(() => setShowRFQSuccess(false), 3000)
      }
    } catch (error) {
      console.error('Error creating RFQ:', error)
    } finally {
      setIsCreatingRFQ(false)
    }
  }

  // Load cart count on mount
  useEffect(() => {
    fetchCartCount()
  }, [])

  // Fetch suppliers
  useEffect(() => {
    const fetchSuppliers = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        params.append('status', 'active')
        
        if (selectedVertical && selectedVertical !== 'all') {
          const verticalName = businessVerticals.find(v => v.id === selectedVertical)?.name
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
        setTotalSuppliers(data.suppliers?.length || 0)
      } catch (error) {
        console.error('Error fetching suppliers:', error)
        setSuppliers([])
      } finally {
        setIsLoading(false)
      }
    }

    if (activeTab === 'suppliers') {
      fetchSuppliers()
    }
  }, [selectedVertical, selectedTier, searchQuery, selectedType, activeTab])

  // Fetch catalog products
  useEffect(() => {
    const fetchCatalog = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        params.append('status', 'active')
        
        if (selectedVertical && selectedVertical !== 'all') {
          params.append('vertical', selectedVertical)
        }
        
        if (selectedCategory && selectedCategory !== 'all') {
          params.append('category', selectedCategory)
        }
        
        if (selectedWholesaler && selectedWholesaler !== 'all') {
          params.append('wholesalerId', selectedWholesaler)
        }
        
        if (searchQuery) {
          params.append('search', searchQuery)
        }
        
        params.append('minPrice', String(priceRange[0]))
        params.append('maxPrice', String(priceRange[1]))
        params.append('limit', '100')

        const response = await fetch(`/merchant-os/api/grosupply/catalog?${params.toString()}`)
        const data: CatalogResponse = await response.json()
        
        setCatalogProducts(data.products || [])
        setTotalProducts(data.total || 0)
        setVerticalAggs(data.aggregations?.verticals || [])
        setCategoryAggs(data.aggregations?.categories || [])
        setWholesalersList(data.wholesalers || [])
      } catch (error) {
        console.error('Error fetching catalog:', error)
        setCatalogProducts([])
      } finally {
        setIsLoading(false)
      }
    }

    if (activeTab === 'catalog') {
      fetchCatalog()
    }
  }, [selectedVertical, selectedCategory, selectedWholesaler, searchQuery, priceRange, activeTab])

  const currentVertical = businessVerticals.find(v => v.id === selectedVertical)

  return (
    <div className="flex-1 flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 border-r border-gray-200 bg-white p-4">
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">Business Verticals</h3>
          <div className="space-y-1">
            {businessVerticals.map(vertical => {
              const Icon = vertical.icon
              const isActive = selectedVertical === vertical.id
              const count = activeTab === 'catalog' 
                ? verticalAggs.find(v => v.name === vertical.name)?.count || 0
                : verticalAggs.find(v => v.name === vertical.id)?.count || 0
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
                  {count > 0 && count !== 1 && (
                    <span className="text-xs text-[#757575]">{count}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {activeTab === 'catalog' && (
          <>
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">Categories</h3>
              <ScrollArea className="h-48">
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      selectedCategory === 'all' 
                        ? 'bg-[#E0F2F1] text-[#00897B] font-medium' 
                        : 'text-[#757575] hover:bg-gray-100'
                    }`}
                  >
                    All Categories
                  </button>
                  {categoryAggs.slice(0, 15).map(cat => (
                    <button
                      key={cat.name}
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                        selectedCategory === cat.name 
                          ? 'bg-[#E0F2F1] text-[#00897B] font-medium' 
                          : 'text-[#757575] hover:bg-gray-100'
                      }`}
                    >
                      <span className="flex-1">{cat.name}</span>
                      <span className="text-xs text-[#757575]">{cat.count}</span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">Wholesaler</h3>
              <ScrollArea className="h-48">
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedWholesaler('all')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      selectedWholesaler === 'all' 
                        ? 'bg-[#E0F2F1] text-[#00897B] font-medium' 
                        : 'text-[#757575] hover:bg-gray-100'
                    }`}
                  >
                    All Wholesalers
                  </button>
                  {wholesalersList.map(w => (
                    <button
                      key={w.id}
                      onClick={() => setSelectedWholesaler(w.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                        selectedWholesaler === w.id 
                          ? 'bg-[#E0F2F1] text-[#00897B] font-medium' 
                          : 'text-[#757575] hover:bg-gray-100'
                      }`}
                    >
                      <span className="flex-1">{w.name}</span>
                      <Badge variant="outline" className="text-[10px]">{w.type}</Badge>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}

        {activeTab === 'suppliers' && (
          <>
            <div className="border-t border-gray-200 pt-4">
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
            </div>

            <div className="border-t border-gray-200 pt-4">
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
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-[#1A1A1A] flex items-center gap-2">
                <Store className="h-5 w-5 text-[#00897B]" />
                Supplier Marketplace
              </h1>
              <p className="text-sm text-[#757575]">
                {activeTab === 'suppliers' 
                  ? `${totalSuppliers} verified suppliers`
                  : `${totalProducts} products in catalog`}
              </p>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
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
                          {businessVerticals.map(v => (
                            <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Search */}
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
                <Input
                  placeholder={activeTab === 'suppliers' ? "Search suppliers..." : "Search products..."}
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Cart Button - Links to Merchant OS */}
              <Link href="/merchant-os/app?tab=procurement">
                <Button variant="outline" size="sm" className="relative">
                  <ShoppingCart className="h-4 w-4" />
                  {cartItemCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-[#00897B] text-white text-[10px]">
                      {cartItemCount}
                    </Badge>
                  )}
                </Button>
              </Link>

              <Link href="/grosupply/supplier/onboarding">
                <Button className="bg-[#00897B] hover:bg-[#00695C] hidden sm:flex">
                  Become a Supplier
                </Button>
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-gray-100">
                <TabsTrigger value="suppliers" className="data-[state=active]:bg-white">
                  <Building2 className="h-4 w-4 mr-2" />
                  Suppliers ({totalSuppliers})
                </TabsTrigger>
                <TabsTrigger value="catalog" className="data-[state=active]:bg-white">
                  <Package className="h-4 w-4 mr-2" />
                  Product Catalog ({totalProducts})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-4 sm:p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="animate-spin h-8 w-8 border-2 border-[#00897B] border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-[#757575]">Loading...</p>
                </div>
              </div>
            ) : activeTab === 'suppliers' ? (
              suppliers.length === 0 ? (
                <div className="text-center py-16">
                  <Store className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">No Suppliers Found</h3>
                  <p className="text-[#757575] mb-4">No suppliers match your search criteria.</p>
                  <Link href="/grosupply/supplier/onboarding">
                    <Button className="bg-[#00897B] hover:bg-[#00695C]">
                      Register as a Supplier
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {suppliers.map((supplier) => {
                    const TypeIcon = getSupplierTypeIcon(supplier.supplierType)
                    return (
                      <Card 
                        key={supplier.id}
                        className="border border-gray-200 hover:border-[#00897B]/30 hover:shadow-md transition-all cursor-pointer"
                        onClick={() => setSelectedSupplier(supplier)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg bg-[#E0F2F1] flex items-center justify-center text-[#00897B]">
                                <TypeIcon className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-[#1A1A1A]">{supplier.name}</p>
                                  {supplier.verificationStatus === 'verified' && (
                                    <CheckCircle2 className="h-4 w-4 text-[#00897B]" />
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
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )
            ) : (
              // Catalog Products Tab
              catalogProducts.length === 0 ? (
                <div className="text-center py-16">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">No Products Found</h3>
                  <p className="text-[#757575]">No products match your filters.</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-[#757575]">
                      {totalProducts} products found
                    </p>
                    {currentVertical?.id !== 'all' && (
                      <Badge className="bg-[#E0F2F1] text-[#00897B]">
                        {currentVertical?.name}
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {catalogProducts.map((product) => (
                      <Card 
                        key={product.id}
                        className="border border-gray-200 hover:border-[#00897B]/30 hover:shadow-md transition-all cursor-pointer"
                        onClick={() => setSelectedProduct(product)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <Badge className={getSourceTypeColor(product.sourceType)} variant="secondary">
                              {product.sourceType === 'wholesale' ? 'Wholesale' : 'SKU'}
                            </Badge>
                            <Badge className={getCategoryColor(product.category)} variant="outline">
                              {product.category}
                            </Badge>
                          </div>

                          <h4 className="font-medium text-[#1A1A1A] line-clamp-2 mb-1">
                            {product.description}
                          </h4>
                          
                          <div className="flex items-center gap-2 mb-2">
                            {product.brand && (
                              <span className="text-xs text-[#757575]">{product.brand}</span>
                            )}
                            <span className="text-xs text-[#757575]">• {product.packSize}</span>
                          </div>

                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="text-xs text-[#757575]">Cost Price</p>
                              <p className="font-bold text-amber-600">R{product.costPrice.toFixed(2)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-[#757575]">Trade Price</p>
                              <p className="font-bold text-emerald-600">R{product.retailPrice.toFixed(2)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-[#757575]">Margin</p>
                              <p className="font-bold text-[#00897B]">{(product.grossMargin * 100).toFixed(0)}%</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-[#757575]" />
                              <span>{product.leadDays}d lead</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Package className="h-3 w-3 text-[#757575]" />
                              <span>Min: {product.minOrderQty}</span>
                            </div>
                            {product.inStock ? (
                              <Badge className="bg-green-100 text-green-700">In Stock</Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-700">Out of Stock</Badge>
                            )}
                          </div>

                          {product.wholesaler && (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <p className="text-xs text-[#757575]">
                                Source: <span className="font-medium">{product.wholesaler.name}</span>
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Supplier Detail Dialog */}
      <Dialog open={!!selectedSupplier} onOpenChange={() => setSelectedSupplier(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedSupplier && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedSupplier.name}
                  {selectedSupplier.verificationStatus === 'verified' && (
                    <Badge className="bg-[#E0F2F1] text-[#00897B]">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-bold">{selectedSupplier.rating.toFixed(1)}</span>
                    </div>
                    <p className="text-xs text-[#757575]">{selectedSupplier.reviewCount} reviews</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Clock className="h-4 w-4 text-[#00897B]" />
                      <span className="font-bold">{selectedSupplier.deliveryDays}d</span>
                    </div>
                    <p className="text-xs text-[#757575]">Delivery</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <span className="font-bold text-[#00897B]">{selectedSupplier.fulfillmentRate}%</span>
                    <p className="text-xs text-[#757575]">Fulfillment</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <span className="font-bold">L{selectedSupplier.bbbeeLevel || '-'}</span>
                    <p className="text-xs text-[#757575]">B-BBEE</p>
                  </div>
                </div>

                <Separator />

                {selectedSupplier.verticals && selectedSupplier.verticals.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Verticals Served</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedSupplier.verticals.map((v, idx) => (
                        <Badge key={idx} variant="outline" className="border-[#00897B]/30 text-[#00897B]">
                          {v}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button className="flex-1 bg-[#00897B] hover:bg-[#00695C]">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Request Quote
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Package className="h-4 w-4 mr-2" />
                    View Products
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Product Detail Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedProduct.description}
                  <Badge className={getSourceTypeColor(selectedProduct.sourceType)} variant="secondary">
                    {selectedProduct.sourceType === 'wholesale' ? 'Wholesale' : 'SKU Catalog'}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div className="flex items-center gap-4">
                  <Badge variant="outline">{selectedProduct.sku}</Badge>
                  {selectedProduct.brand && (
                    <span className="text-sm text-[#757575]">Brand: {selectedProduct.brand}</span>
                  )}
                  <span className="text-sm text-[#757575]">Pack: {selectedProduct.packSize}</span>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-amber-50 rounded-lg p-3 text-center border border-amber-200">
                    <p className="text-xs text-amber-700 mb-1">Cost Price</p>
                    <p className="font-bold text-lg text-amber-800">R{selectedProduct.costPrice.toFixed(2)}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-3 text-center border border-emerald-200">
                    <p className="text-xs text-emerald-700 mb-1">Trade Price</p>
                    <p className="font-bold text-lg text-emerald-800">R{selectedProduct.retailPrice.toFixed(2)}</p>
                  </div>
                  <div className="bg-[#E0F2F1] rounded-lg p-3 text-center border border-[#00897B]/30">
                    <p className="text-xs text-[#00897B] mb-1">Margin</p>
                    <p className="font-bold text-lg text-[#00897B]">{(selectedProduct.grossMargin * 100).toFixed(1)}%</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-[#757575] mb-1">VAT</p>
                    <p className="font-bold text-lg">{selectedProduct.vatRate}%</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[#757575]">Category</p>
                    <p className="font-medium">{selectedProduct.category}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#757575]">Vertical</p>
                    <p className="font-medium">{selectedProduct.vertical}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#757575]">Lead Time</p>
                    <p className="font-medium">{selectedProduct.leadDays} days</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#757575]">Min Order</p>
                    <p className="font-medium">{selectedProduct.minOrderQty} units</p>
                  </div>
                </div>

                {selectedProduct.wholesaler && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-[#757575]">Source</p>
                    <p className="font-medium">{selectedProduct.wholesaler.name}</p>
                    <p className="text-xs text-[#757575]">{selectedProduct.wholesaler.type}</p>
                  </div>
                )}

                {selectedProduct.notes && (
                  <div>
                    <p className="text-xs text-[#757575]">Notes</p>
                    <p className="text-sm">{selectedProduct.notes}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button 
                    className="flex-1 bg-[#00897B] hover:bg-[#00695C]"
                    onClick={() => addToCart(selectedProduct)}
                    disabled={isAddingToCart}
                  >
                    <ShoppingBasket className="h-4 w-4 mr-2" />
                    {isAddingToCart ? 'Adding...' : showCartSuccess ? 'Added!' : 'Add to Order'}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => requestQuote(selectedProduct)}
                    disabled={isCreatingRFQ}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {isCreatingRFQ ? 'Requesting...' : showRFQSuccess ? 'RFQ Sent!' : 'Request Quote'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function SupplierMarketplacePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/grosupply" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#00897B] flex items-center justify-center">
                <Truck className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-[#1A1A1A]">GroSupply</span>
            </Link>

            <div className="flex items-center gap-4">
              <Link href="/grosupply/supplier/login" className="hidden sm:block text-sm font-medium text-[#00897B] hover:underline">
                Supplier Login
              </Link>
              <Link href="/grosupply" className="flex items-center gap-1.5 text-sm font-medium text-[#757575] hover:text-[#00897B] transition-colors">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Home
              </Link>
              <Link href="/grosupply/supplier/onboarding" className="hidden sm:block">
                <Button variant="outline" size="sm" className="border-[#00897B] text-[#00897B]">
                  <Award className="h-4 w-4 mr-2" />
                  Become a Supplier
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-2 border-[#00897B] border-t-transparent rounded-full" />
        </div>
      }>
        <MarketplaceContent />
      </Suspense>

      {/* Footer */}
      <footer className="mt-auto py-4 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs text-[#757575]">© 2024 Groway. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
