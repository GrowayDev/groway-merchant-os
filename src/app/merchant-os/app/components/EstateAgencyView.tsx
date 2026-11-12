'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { toast } from 'sonner'
import {
  Home,
  Building2,
  Users,
  DollarSign,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Key,
  FileText,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Calculator,
  CreditCard,
  Wallet,
  Banknote,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Loader2,
  Plus,
  Search,
  Eye,
  Edit,
  RefreshCw,
  ShieldCheck,
  User,
  Briefcase,
  Target,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Eye as EyeIcon,
  Heart,
  Camera,
  Bed,
  Bath,
  Car,
  Ruler,
} from 'lucide-react'

// Types
type PropertyStatus = 'available' | 'under_offer' | 'sold' | 'rented' | 'withdrawn'
type PropertyType = 'house' | 'apartment' | 'townhouse' | 'vacant_land' | 'commercial' | 'farm'
type ListingType = 'sale' | 'rental'
type MandateType = 'sole' | 'open' | 'exclusive'
type TransactionStatus = 'pending' | 'cleared' | 'flagged'

interface Property {
  id: string
  reference: string
  title: string
  type: PropertyType
  listingType: ListingType
  status: PropertyStatus
  address: string
  suburb: string
  city: string
  province: string
  bedrooms?: number
  bathrooms?: number
  garages?: number
  size?: number
  price: number
  monthlyRent?: number
  sellerId: string
  sellerName: string
  sellerPhone: string
  sellerEmail: string
  mandateType: MandateType
  mandateExpiry: string
  description: string
  features: string[]
  images: string[]
  views: number
  enquiries: number
  listedDate: string
  agentId: string
  agentName: string
}

interface Buyer {
  id: string
  name: string
  phone: string
  email: string
  budgetMin: number
  budgetMax: number
  preferredAreas: string[]
  propertyTypes: PropertyType[]
  bedrooms?: number
  notes: string
  status: 'active' | 'looking' | 'found' | 'inactive'
  assignedAgent: string
  createdAt: string
}

interface Sale {
  id: string
  saleNumber: string
  propertyId: string
  propertyRef: string
  propertyAddress: string
  sellerName: string
  buyerName: string
  salePrice: number
  commissionRate: number
  grossCommission: number
  agentCommission: number
  agencyCommission: number
  status: 'pending' | 'approved' | 'transferred' | 'completed' | 'cancelled'
  offerDate: string
  acceptanceDate?: string
  transferDate?: string
  completionDate?: string
  agentId: string
  agentName: string
  notes?: string
}

interface TrustTransaction {
  id: string
  date: string
  type: 'deposit' | 'withdrawal' | 'transfer'
  reference: string
  saleId?: string
  propertyRef?: string
  description: string
  amount: number
  balance: number
  status: TransactionStatus
  reconciled: boolean
}

interface Agent {
  id: string
  name: string
  phone: string
  email: string
  status: 'active' | 'inactive' | 'suspended'
  eaabNumber: string
  ffcExpiry: string
  totalSales: number
  activeListings: number
  commissionYTD: number
  targets: { monthly: number; quarterly: number; yearly: number }
}

// Status configurations
const propertyStatusConfig: Record<PropertyStatus, { label: string; color: string }> = {
  available: { label: 'Available', color: 'bg-green-100 text-green-700' },
  under_offer: { label: 'Under Offer', color: 'bg-amber-100 text-amber-700' },
  sold: { label: 'Sold', color: 'bg-blue-100 text-blue-700' },
  rented: { label: 'Rented', color: 'bg-purple-100 text-purple-700' },
  withdrawn: { label: 'Withdrawn', color: 'bg-gray-100 text-gray-700' },
}

const propertyTypeConfig: Record<PropertyType, { label: string; icon: any }> = {
  house: { label: 'House', icon: Home },
  apartment: { label: 'Apartment', icon: Building2 },
  townhouse: { label: 'Townhouse', icon: Building2 },
  vacant_land: { label: 'Vacant Land', icon: MapPin },
  commercial: { label: 'Commercial', icon: Briefcase },
  farm: { label: 'Farm', icon: Home },
}

// Sample data
const sampleProperties: Property[] = [
  { id: '1', reference: 'PROP-2026-001', title: 'Modern Family Home in Sandton', type: 'house', listingType: 'sale', status: 'available', address: '123 Sandton Drive', suburb: 'Sandton', city: 'Johannesburg', province: 'Gauteng', bedrooms: 4, bathrooms: 3, garages: 2, size: 450, price: 4500000, sellerId: 's1', sellerName: 'John Mokoena', sellerPhone: '+27 82 123 4567', sellerEmail: 'john@email.com', mandateType: 'sole', mandateExpiry: '2026-08-15', description: 'Beautiful modern home with pool', features: ['Pool', 'Garden', 'Security', 'Solar'], images: [], views: 156, enquiries: 12, listedDate: '2026-01-15', agentId: 'a1', agentName: 'Thandi Ndaba' },
  { id: '2', reference: 'PROP-2026-002', title: 'Luxury Penthouse in Rosebank', type: 'apartment', listingType: 'sale', status: 'under_offer', address: '456 Oxford Road', suburb: 'Rosebank', city: 'Johannesburg', province: 'Gauteng', bedrooms: 3, bathrooms: 2, garages: 2, size: 220, price: 3200000, sellerId: 's2', sellerName: 'Sarah van der Berg', sellerPhone: '+27 83 234 5678', sellerEmail: 'sarah@email.com', mandateType: 'exclusive', mandateExpiry: '2026-06-30', description: 'Stunning penthouse with panoramic views', features: ['Balcony', 'Gym', 'Concierge', 'Parking'], images: [], views: 234, enquiries: 28, listedDate: '2025-12-01', agentId: 'a1', agentName: 'Thandi Ndaba' },
  { id: '3', reference: 'PROP-2026-003', title: 'Starter Home in Soweto', type: 'house', listingType: 'sale', status: 'available', address: '789 Vilakazi Street', suburb: 'Orlando West', city: 'Soweto', province: 'Gauteng', bedrooms: 2, bathrooms: 1, garages: 1, size: 85, price: 850000, sellerId: 's3', sellerName: 'David Dlamini', sellerPhone: '+27 84 345 6789', sellerEmail: 'david@email.com', mandateType: 'open', mandateExpiry: '2026-04-30', description: 'Perfect starter home', features: ['Garden', 'Security'], images: [], views: 89, enquiries: 5, listedDate: '2026-02-01', agentId: 'a2', agentName: 'Sipho Mabaso' },
  { id: '4', reference: 'PROP-2026-004', title: 'Commercial Space in Braamfontein', type: 'commercial', listingType: 'rental', status: 'available', address: '100 Jorissen Street', suburb: 'Braamfontein', city: 'Johannesburg', province: 'Gauteng', size: 350, price: 0, monthlyRent: 45000, sellerId: 's4', sellerName: 'Property Holdings Ltd', sellerPhone: '+27 11 555 1234', sellerEmail: 'info@propertyholdings.co.za', mandateType: 'sole', mandateExpiry: '2026-12-31', description: 'Prime office space', features: ['Air Conditioning', 'Parking', 'Reception Area'], images: [], views: 45, enquiries: 3, listedDate: '2026-02-10', agentId: 'a2', agentName: 'Sipho Mabaso' },
]

const sampleBuyers: Buyer[] = [
  { id: '1', name: 'Nomsa Khumalo', phone: '+27 82 555 1234', email: 'nomsa@email.com', budgetMin: 2000000, budgetMax: 3500000, preferredAreas: ['Sandton', 'Rosebank', 'Hyde Park'], propertyTypes: ['house', 'townhouse'], bedrooms: 3, notes: 'Looking for family home with garden', status: 'active', assignedAgent: 'Thandi Ndaba', createdAt: '2026-01-20' },
  { id: '2', name: 'Michael Naidoo', phone: '+27 83 666 2345', email: 'michael@email.com', budgetMin: 700000, budgetMax: 1200000, preferredAreas: ['Soweto', 'Diepkloof', 'Pimville'], propertyTypes: ['house'], bedrooms: 2, notes: 'First-time buyer', status: 'looking', assignedAgent: 'Sipho Mabaso', createdAt: '2026-02-01' },
  { id: '3', name: 'Jane van Rensburg', phone: '+27 84 777 3456', email: 'jane@email.com', budgetMin: 4000000, budgetMax: 6000000, preferredAreas: ['Sandton', 'Bryanston', 'Morningside'], propertyTypes: ['house'], bedrooms: 4, notes: 'Needs pool and garden', status: 'active', assignedAgent: 'Thandi Ndaba', createdAt: '2026-02-05' },
]

const sampleSales: Sale[] = [
  { id: '1', saleNumber: 'SALE-2026-001', propertyId: 'p1', propertyRef: 'PROP-2025-045', propertyAddress: '45 Marshall Street, Marshalltown', sellerName: 'ABC Holdings', buyerName: 'XYZ Investments', salePrice: 2500000, commissionRate: 5, grossCommission: 125000, agentCommission: 62500, agencyCommission: 62500, status: 'transferred', offerDate: '2026-01-10', acceptanceDate: '2026-01-15', transferDate: '2026-02-01', agentId: 'a1', agentName: 'Thandi Ndaba' },
  { id: '2', saleNumber: 'SALE-2026-002', propertyId: 'p2', propertyRef: 'PROP-2026-002', propertyAddress: '456 Oxford Road, Rosebank', sellerName: 'Sarah van der Berg', buyerName: 'Nomsa Khumalo', salePrice: 3100000, commissionRate: 5, grossCommission: 155000, agentCommission: 77500, agencyCommission: 77500, status: 'pending', offerDate: '2026-02-12', agentId: 'a1', agentName: 'Thandi Ndaba' },
]

const sampleTrustTransactions: TrustTransaction[] = [
  { id: '1', date: '2026-02-14', type: 'deposit', reference: 'DEP-001', saleId: '2', propertyRef: 'PROP-2026-002', description: 'Deposit from buyer - Nomsa Khumalo', amount: 310000, balance: 310000, status: 'cleared', reconciled: true },
  { id: '2', date: '2026-02-10', type: 'withdrawal', reference: 'WD-001', saleId: '1', propertyRef: 'PROP-2025-045', description: 'Commission payout - Thandi Ndaba', amount: -62500, balance: 0, status: 'cleared', reconciled: true },
]

const sampleAgents: Agent[] = [
  { id: 'a1', name: 'Thandi Ndaba', phone: '+27 82 123 4567', email: 'thandi@estate.co.za', status: 'active', eaabNumber: 'EAAB-2026-12345', ffcExpiry: '2027-03-31', totalSales: 8, activeListings: 12, commissionYTD: 450000, targets: { monthly: 50000, quarterly: 150000, yearly: 600000 } },
  { id: 'a2', name: 'Sipho Mabaso', phone: '+27 83 234 5678', email: 'sipho@estate.co.za', status: 'active', eaabNumber: 'EAAB-2026-67890', ffcExpiry: '2026-06-30', totalSales: 5, activeListings: 8, commissionYTD: 280000, targets: { monthly: 40000, quarterly: 120000, yearly: 480000 } },
]

export function EstateAgencyView() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  
  // Data states
  const [properties, setProperties] = useState<Property[]>([])
  const [buyers, setBuyers] = useState<Buyer[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [trustTransactions, setTrustTransactions] = useState<TrustTransaction[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  
  // Dialog states
  const [propertyDialogOpen, setPropertyDialogOpen] = useState(false)
  const [buyerDialogOpen, setBuyerDialogOpen] = useState(false)
  const [saleDialogOpen, setSaleDialogOpen] = useState(false)
  
  // Selected items
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  
  // Search/filter
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Initialize data on mount (simulate async data fetch)
  useEffect(() => {
    const timer = setTimeout(() => {
      setProperties(sampleProperties)
      setBuyers(sampleBuyers)
      setSales(sampleSales)
      setTrustTransactions(sampleTrustTransactions)
      setAgents(sampleAgents)
      setLoading(false)
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  // Stats calculation
  const stats = {
    activeListings: properties.filter(p => p.status === 'available').length,
    totalValue: properties.filter(p => p.status === 'available').reduce((sum, p) => sum + p.price, 0),
    underOffer: properties.filter(p => p.status === 'under_offer').length,
    activeBuyers: buyers.filter(b => b.status === 'active' || b.status === 'looking').length,
    pendingSales: sales.filter(s => s.status === 'pending' || s.status === 'approved').length,
    pendingCommission: sales.filter(s => s.status === 'pending').reduce((sum, s) => sum + s.agentCommission, 0),
    trustBalance: trustTransactions.length > 0 ? trustTransactions[0].balance : 0,
    monthSales: sales.filter(s => s.status === 'completed' || s.status === 'transferred').reduce((sum, s) => sum + s.salePrice, 0),
    monthCommission: sales.filter(s => s.status === 'completed' || s.status === 'transferred').reduce((sum, s) => sum + s.grossCommission, 0),
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#FAFAFA] min-h-0">
        <Loader2 className="h-8 w-8 animate-spin text-[#00897B]" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-[#FAFAFA] min-h-0">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
              <Home className="h-5 w-5 text-[#00897B]" />
              Estate Agency
            </h1>
            <p className="text-sm text-[#757575]">Property listings, buyer matching & sales management</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setBuyerDialogOpen(true)}>
              <User className="h-4 w-4 mr-2" />Add Buyer
            </Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setPropertyDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />New Listing
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 sm:grid-cols-9 gap-2">
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-green-600">{stats.activeListings}</p>
            <p className="text-[10px] text-[#757575]">Active Listings</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-blue-600">R{(stats.totalValue / 1000000).toFixed(1)}M</p>
            <p className="text-[10px] text-[#757575]">Portfolio Value</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-amber-600">{stats.underOffer}</p>
            <p className="text-[10px] text-[#757575]">Under Offer</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-purple-600">{stats.activeBuyers}</p>
            <p className="text-[10px] text-[#757575]">Active Buyers</p>
          </div>
          <div className="bg-cyan-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-cyan-600">{stats.pendingSales}</p>
            <p className="text-[10px] text-[#757575]">Pending Sales</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-orange-600">R{stats.pendingCommission.toLocaleString()}</p>
            <p className="text-[10px] text-[#757575]">Pending Comm</p>
          </div>
          <div className="bg-teal-50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-teal-600">R{stats.trustBalance.toLocaleString()}</p>
            <p className="text-[10px] text-[#757575]">Trust Balance</p>
          </div>
          <div className="bg-emerald-50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-emerald-600">R{(stats.monthSales / 1000000).toFixed(1)}M</p>
            <p className="text-[10px] text-[#757575]">Month Sales</p>
          </div>
          <div className="bg-pink-50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-pink-600">R{stats.monthCommission.toLocaleString()}</p>
            <p className="text-[10px] text-[#757575]">Month Comm</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 flex flex-col min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="bg-white border-b border-gray-200 px-4">
            <TabsList className="bg-transparent h-12">
              <TabsTrigger value="overview" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                Overview
              </TabsTrigger>
              <TabsTrigger value="listings" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Home className="h-4 w-4 mr-1" />Listings
              </TabsTrigger>
              <TabsTrigger value="buyers" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Users className="h-4 w-4 mr-1" />Buyers
              </TabsTrigger>
              <TabsTrigger value="sales" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <DollarSign className="h-4 w-4 mr-1" />Sales
              </TabsTrigger>
              <TabsTrigger value="trust" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Wallet className="h-4 w-4 mr-1" />Trust Account
              </TabsTrigger>
              <TabsTrigger value="agents" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <User className="h-4 w-4 mr-1" />Agents
              </TabsTrigger>
              <TabsTrigger value="compliance" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <ShieldCheck className="h-4 w-4 mr-1" />EAAB
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 p-4">
            {/* Overview Tab */}
            <TabsContent value="overview" className="m-0 space-y-4">
              {/* Quick Actions */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button className="h-auto py-4 flex-col gap-2 bg-[#00897B] hover:bg-[#00695C]" onClick={() => setPropertyDialogOpen(true)}>
                  <Home className="h-5 w-5" />
                  <span className="text-sm">New Listing</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => setBuyerDialogOpen(true)}>
                  <Users className="h-5 w-5" />
                  <span className="text-sm">Add Buyer</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => setSaleDialogOpen(true)}>
                  <DollarSign className="h-5 w-5" />
                  <span className="text-sm">Record Sale</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                  <Calculator className="h-5 w-5" />
                  <span className="text-sm">Commission Calc</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Hot Listings */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-[#00897B]" />
                      Hot Listings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {properties.filter(p => p.status === 'available' || p.status === 'under_offer').sort((a, b) => b.enquiries - a.enquiries).slice(0, 5).map(property => (
                        <div 
                          key={property.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                          onClick={() => { setSelectedProperty(property); setPropertyDialogOpen(true) }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg">
                              <Home className="h-4 w-4 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{property.title}</p>
                              <p className="text-xs text-[#757575]">{property.suburb} • R{property.price > 0 ? property.price.toLocaleString() : property.monthlyRent?.toLocaleString() + '/mo'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={propertyStatusConfig[property.status].color}>{propertyStatusConfig[property.status].label}</Badge>
                            <div className="text-right">
                              <p className="text-xs font-medium">{property.views} views</p>
                              <p className="text-xs text-amber-600">{property.enquiries} enquiries</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Pending Sales */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="h-5 w-5 text-amber-500" />
                      Pending Sales
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {sales.filter(s => s.status === 'pending' || s.status === 'approved').map(sale => (
                        <div 
                          key={sale.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                          onClick={() => { setSelectedSale(sale); setSaleDialogOpen(true) }}
                        >
                          <div>
                            <p className="font-medium text-sm">{sale.saleNumber}</p>
                            <p className="text-xs text-[#757575]">{sale.propertyAddress}</p>
                            <p className="text-xs text-[#757575]">{sale.buyerName}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">R{sale.salePrice.toLocaleString()}</p>
                            <p className="text-xs text-green-600">Comm: R{sale.grossCommission.toLocaleString()}</p>
                            <Badge className={sale.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                              {sale.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Agent Performance */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Award className="h-5 w-5 text-[#00897B]" />
                      Agent Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {agents.map(agent => (
                        <div key={agent.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-[#00897B] text-white flex items-center justify-center text-sm font-medium">
                                {agent.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{agent.name}</p>
                                <p className="text-xs text-[#757575]">{agent.activeListings} listings • {agent.totalSales} sales</p>
                              </div>
                            </div>
                            <p className="font-bold text-green-600">R{agent.commissionYTD.toLocaleString()}</p>
                          </div>
                          <Progress value={(agent.commissionYTD / agent.targets.yearly) * 100} className="h-2" />
                          <p className="text-xs text-[#757575] mt-1">{Math.round((agent.commissionYTD / agent.targets.yearly) * 100)}% of annual target</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Trust Account */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-[#00897B]" />
                      Trust Account
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center mb-4">
                      <p className="text-3xl font-bold text-[#1A1A1A]">R{stats.trustBalance.toLocaleString()}</p>
                      <p className="text-sm text-[#757575]">Current Balance</p>
                    </div>
                    <div className="space-y-2">
                      {trustTransactions.slice(0, 4).map(tx => (
                        <div key={tx.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${tx.amount > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="truncate max-w-32">{tx.description}</span>
                          </div>
                          <span className={tx.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                            {tx.amount > 0 ? '+' : ''}R{Math.abs(tx.amount).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Listings Tab */}
            <TabsContent value="listings" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
                    <Input placeholder="Search properties..." className="pl-9 w-64" />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="under_offer">Under Offer</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                      <SelectItem value="rented">Rented</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setPropertyDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />New Listing
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {properties.map(property => (
                  <Card key={property.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { setSelectedProperty(property); setPropertyDialogOpen(true) }}>
                    <div className="h-32 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <Home className="h-12 w-12 text-gray-400" />
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={propertyStatusConfig[property.status].color}>{propertyStatusConfig[property.status].label}</Badge>
                        <Badge variant="outline">{property.listingType === 'sale' ? 'For Sale' : 'For Rent'}</Badge>
                      </div>
                      <p className="font-semibold text-sm line-clamp-1">{property.title}</p>
                      <p className="text-xs text-[#757575] mb-2">{property.suburb}, {property.city}</p>
                      <p className="text-lg font-bold text-[#00897B]">
                        {property.price > 0 ? `R${property.price.toLocaleString()}` : `R${property.monthlyRent?.toLocaleString()}/mo`}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-[#757575]">
                        {property.bedrooms && <span className="flex items-center gap-1"><Bed className="h-3 w-3" />{property.bedrooms}</span>}
                        {property.bathrooms && <span className="flex items-center gap-1"><Bath className="h-3 w-3" />{property.bathrooms}</span>}
                        {property.garages && <span className="flex items-center gap-1"><Car className="h-3 w-3" />{property.garages}</span>}
                        {property.size && <span className="flex items-center gap-1"><Ruler className="h-3 w-3" />{property.size}m²</span>}
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t">
                        <span className="text-xs text-[#757575]">{property.views} views • {property.enquiries} enquiries</span>
                        <span className="text-xs font-medium">{property.agentName}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Buyers Tab */}
            <TabsContent value="buyers" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <Input placeholder="Search buyers..." className="w-64" />
                <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setBuyerDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />Add Buyer
                </Button>
              </div>
              <div className="bg-white rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Areas</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Beds</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {buyers.map(buyer => (
                      <TableRow key={buyer.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{buyer.name}</p>
                            <p className="text-xs text-[#757575]">{buyer.phone}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">R{(buyer.budgetMin / 1000000).toFixed(1)}M - R{(buyer.budgetMax / 1000000).toFixed(1)}M</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {buyer.preferredAreas.slice(0, 2).map(area => (
                              <Badge key={area} variant="outline" className="text-xs">{area}</Badge>
                            ))}
                            {buyer.preferredAreas.length > 2 && (
                              <Badge variant="outline" className="text-xs">+{buyer.preferredAreas.length - 2}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {buyer.propertyTypes.slice(0, 2).map(type => (
                              <Badge key={type} variant="outline" className="text-xs capitalize">{type}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{buyer.bedrooms || 'Any'}</TableCell>
                        <TableCell>
                          <Badge className={buyer.status === 'active' ? 'bg-green-100 text-green-700' : buyer.status === 'looking' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}>
                            {buyer.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{buyer.assignedAgent}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Sales Tab */}
            <TabsContent value="sales" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <Input placeholder="Search sales..." className="w-64" />
                <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setSaleDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />Record Sale
                </Button>
              </div>
              <div className="bg-white rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sale #</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Sale Price</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.map(sale => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-medium">{sale.saleNumber}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{sale.propertyRef}</p>
                            <p className="text-xs text-[#757575] truncate max-w-32">{sale.propertyAddress}</p>
                          </div>
                        </TableCell>
                        <TableCell>{sale.buyerName}</TableCell>
                        <TableCell className="font-bold">R{sale.salePrice.toLocaleString()}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">R{sale.grossCommission.toLocaleString()}</p>
                            <p className="text-xs text-[#757575]">Agent: R{sale.agentCommission.toLocaleString()}</p>
                          </div>
                        </TableCell>
                        <TableCell>{sale.agentName}</TableCell>
                        <TableCell>
                          <Badge className={sale.status === 'completed' ? 'bg-green-100 text-green-700' : sale.status === 'transferred' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}>
                            {sale.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedSale(sale); setSaleDialogOpen(true) }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Trust Account Tab */}
            <TabsContent value="trust" className="m-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-[#757575]">Current Balance</p>
                    <p className="text-3xl font-bold">R{stats.trustBalance.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-[#757575]">Pending Deposits</p>
                    <p className="text-3xl font-bold text-green-600">R{trustTransactions.filter(t => t.amount > 0 && !t.reconciled).reduce((s, t) => s + t.amount, 0).toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-[#757575]">Pending Withdrawals</p>
                    <p className="text-3xl font-bold text-red-600">R{Math.abs(trustTransactions.filter(t => t.amount < 0 && !t.reconciled).reduce((s, t) => s + t.amount, 0)).toLocaleString()}</p>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trustTransactions.map(tx => (
                        <TableRow key={tx.id}>
                          <TableCell>{tx.date}</TableCell>
                          <TableCell className="capitalize">{tx.type}</TableCell>
                          <TableCell className="truncate max-w-48">{tx.description}</TableCell>
                          <TableCell>{tx.reference}</TableCell>
                          <TableCell className={tx.amount > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                            {tx.amount > 0 ? '+' : ''}R{Math.abs(tx.amount).toLocaleString()}
                          </TableCell>
                          <TableCell>R{tx.balance.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge className={tx.status === 'cleared' ? 'bg-green-100 text-green-700' : tx.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}>
                              {tx.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Agents Tab */}
            <TabsContent value="agents" className="m-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agents.map(agent => (
                  <Card key={agent.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-[#00897B] text-white flex items-center justify-center font-bold">
                          {agent.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{agent.name}</p>
                          <p className="text-sm text-[#757575]">{agent.email}</p>
                          <p className="text-xs text-[#757575]">{agent.phone}</p>
                        </div>
                        <Badge className={agent.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                          {agent.status}
                        </Badge>
                      </div>
                      <Separator className="my-3" />
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <p className="text-xl font-bold">{agent.activeListings}</p>
                          <p className="text-xs text-[#757575]">Listings</p>
                        </div>
                        <div>
                          <p className="text-xl font-bold">{agent.totalSales}</p>
                          <p className="text-xs text-[#757575]">Sales</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-green-600">R{(agent.commissionYTD / 1000).toFixed(0)}K</p>
                          <p className="text-xs text-[#757575]">Commission YTD</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Target Progress</span>
                          <span>{Math.round((agent.commissionYTD / agent.targets.yearly) * 100)}%</span>
                        </div>
                        <Progress value={(agent.commissionYTD / agent.targets.yearly) * 100} className="h-2" />
                      </div>
                      <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-[#757575]">
                        <span>EAAB: {agent.eaabNumber}</span>
                        <span>FFC Expires: {agent.ffcExpiry}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* EAAB Compliance Tab */}
            <TabsContent value="compliance" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-[#00897B]" />
                    EAAB Compliance Status
                  </CardTitle>
                  <CardDescription>Estate Agency Affairs Board regulatory compliance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="font-medium">Agency Fidelity Fund Certificate</p>
                        <p className="text-sm text-[#757575]">Valid until 31 December 2026</p>
                      </div>
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="font-medium">Trust Account Audit</p>
                        <p className="text-sm text-[#757575]">Last audit: February 2026</p>
                      </div>
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="p-4 bg-amber-50 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="font-medium">CPD Points</p>
                        <p className="text-sm text-[#757575]">12/15 points completed for 2026</p>
                      </div>
                      <AlertTriangle className="h-6 w-6 text-amber-600" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="font-medium mb-2">Agent FFC Status</p>
                        <div className="space-y-2">
                          {agents.map(agent => (
                            <div key={agent.id} className="flex items-center justify-between text-sm">
                              <span>{agent.name}</span>
                              <div className="flex items-center gap-1">
                                {new Date(agent.ffcExpiry) > new Date() ? 
                                  <CheckCircle2 className="h-4 w-4 text-green-600" /> : 
                                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                                }
                                <span className="text-xs text-[#757575]">{agent.ffcExpiry}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="font-medium mb-2">Regulatory Requirements</p>
                        <ul className="space-y-1 text-sm">
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> FFC Current</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Trust Account Registered</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Audit Submitted</li>
                          <li className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-600" /> CPD In Progress</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  )
}
