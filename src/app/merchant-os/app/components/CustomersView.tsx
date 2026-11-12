'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Search,
  Plus,
  User,
  Users,
  Star,
  TrendingUp,
  TrendingDown,
  Crown,
  Gift,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  ShoppingBag,
  Heart,
  Send,
  Filter,
  Download,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Award,
  Sparkles,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Zap,
} from 'lucide-react'

// Types
interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  avatar?: string
  segment: 'champion' | 'loyal' | 'potential' | 'at_risk' | 'new' | 'dormant'
  rfmScore: { r: number; f: number; m: number }
  totalSpent: number
  totalOrders: number
  avgOrderValue: number
  lastVisit: string
  joinedDate: string
  loyaltyPoints: number
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum'
  tags: string[]
  notes?: string
  preferences?: string[]
}

interface LoyaltyTier {
  name: string
  minPoints: number
  discount: number
  color: string
  icon: typeof Crown
}

// Loyalty tiers configuration
const loyaltyTiers: LoyaltyTier[] = [
  { name: 'Bronze', minPoints: 0, discount: 2, color: 'bg-orange-100 text-orange-700', icon: Award },
  { name: 'Silver', minPoints: 500, discount: 5, color: 'bg-gray-100 text-gray-700', icon: Star },
  { name: 'Gold', minPoints: 2000, discount: 10, color: 'bg-yellow-100 text-yellow-700', icon: Crown },
  { name: 'Platinum', minPoints: 5000, discount: 15, color: 'bg-purple-100 text-purple-700', icon: Sparkles },
]

// Generate mock customers
const generateCustomers = (): Customer[] => [
  { id: 'CUS-001', name: 'Thandi Mbeki', phone: '+27 82 123 4567', email: 'thandi.m@email.com', segment: 'champion', rfmScore: { r: 5, f: 5, m: 5 }, totalSpent: 15680, totalOrders: 47, avgOrderValue: 334, lastVisit: '2026-02-15', joinedDate: '2024-06-15', loyaltyPoints: 3140, loyaltyTier: 'gold', tags: ['Regular', 'Weekend'], preferences: ['Vegetarian options', 'No onions'] },
  { id: 'CUS-002', name: 'Sipho Dlamini', phone: '+27 83 234 5678', email: 'sipho.d@email.com', segment: 'loyal', rfmScore: { r: 4, f: 4, m: 4 }, totalSpent: 8920, totalOrders: 28, avgOrderValue: 319, lastVisit: '2026-02-14', joinedDate: '2024-09-20', loyaltyPoints: 1780, loyaltyTier: 'silver', tags: ['Lunch regular'], preferences: ['Extra sauce'] },
  { id: 'CUS-003', name: 'Nomsa Zulu', phone: '+27 84 345 6789', email: 'nomsa.z@email.com', segment: 'potential', rfmScore: { r: 3, f: 3, m: 4 }, totalSpent: 4200, totalOrders: 12, avgOrderValue: 350, lastVisit: '2026-02-10', joinedDate: '2025-01-05', loyaltyPoints: 840, loyaltyTier: 'silver', tags: ['High value'], preferences: [] },
  { id: 'CUS-004', name: 'Johan van der Berg', phone: '+27 82 456 7890', email: 'johan.vdb@email.com', segment: 'at_risk', rfmScore: { r: 2, f: 3, m: 3 }, totalSpent: 5600, totalOrders: 15, avgOrderValue: 373, lastVisit: '2026-01-20', joinedDate: '2024-11-10', loyaltyPoints: 1120, loyaltyTier: 'silver', tags: ['At risk'], preferences: ['Gluten-free'] },
  { id: 'CUS-005', name: 'Precious Ndlovu', phone: '+27 76 567 8901', email: 'precious.n@email.com', segment: 'new', rfmScore: { r: 5, f: 1, m: 2 }, totalSpent: 890, totalOrders: 3, avgOrderValue: 297, lastVisit: '2026-02-14', joinedDate: '2026-02-01', loyaltyPoints: 180, loyaltyTier: 'bronze', tags: ['New customer'], preferences: [] },
  { id: 'CUS-006', name: 'David Mokoena', phone: '+27 72 678 9012', email: 'david.m@email.com', segment: 'champion', rfmScore: { r: 5, f: 5, m: 5 }, totalSpent: 22450, totalOrders: 68, avgOrderValue: 330, lastVisit: '2026-02-15', joinedDate: '2024-03-01', loyaltyPoints: 4490, loyaltyTier: 'platinum', tags: ['VIP', 'Weekday lunch', 'Office orders'], preferences: ['Large portions', 'Extra napkins'] },
  { id: 'CUS-007', name: 'Lerato Molefe', phone: '+27 81 789 0123', email: 'lerato.m@email.com', segment: 'loyal', rfmScore: { r: 4, f: 4, m: 3 }, totalSpent: 6780, totalOrders: 22, avgOrderValue: 308, lastVisit: '2026-02-13', joinedDate: '2024-08-15', loyaltyPoints: 1360, loyaltyTier: 'silver', tags: ['Regular'], preferences: [] },
  { id: 'CUS-008', name: 'Michael Smith', phone: '+27 83 890 1234', email: 'michael.s@email.com', segment: 'dormant', rfmScore: { r: 1, f: 2, m: 3 }, totalSpent: 3200, totalOrders: 8, avgOrderValue: 400, lastVisit: '2025-10-15', joinedDate: '2025-02-20', loyaltyPoints: 640, loyaltyTier: 'bronze', tags: ['Dormant'], preferences: [] },
  { id: 'CUS-009', name: 'Grace Khumalo', phone: '+27 79 901 2345', email: 'grace.k@email.com', segment: 'potential', rfmScore: { r: 4, f: 3, m: 3 }, totalSpent: 3890, totalOrders: 14, avgOrderValue: 278, lastVisit: '2026-02-11', joinedDate: '2025-06-01', loyaltyPoints: 780, loyaltyTier: 'bronze', tags: ['Growing'], preferences: ['Spicy food'] },
  { id: 'CUS-010', name: 'Ahmed Hassan', phone: '+27 82 012 3456', email: 'ahmed.h@email.com', segment: 'loyal', rfmScore: { r: 4, f: 4, m: 4 }, totalSpent: 9870, totalOrders: 32, avgOrderValue: 308, lastVisit: '2026-02-14', joinedDate: '2024-07-20', loyaltyPoints: 1970, loyaltyTier: 'silver', tags: ['Regular', 'Family orders'], preferences: ['Halaal', 'No pork'] },
  { id: 'CUS-011', name: 'Sarah Williams', phone: '+27 84 123 4567', email: 'sarah.w@email.com', segment: 'at_risk', rfmScore: { r: 2, f: 2, m: 4 }, totalSpent: 7200, totalOrders: 18, avgOrderValue: 400, lastVisit: '2026-01-05', joinedDate: '2024-10-01', loyaltyPoints: 1440, loyaltyTier: 'silver', tags: ['At risk', 'High value'], preferences: [] },
  { id: 'CUS-012', name: 'Peter Nkosi', phone: '+27 73 234 5678', email: 'peter.n@email.com', segment: 'new', rfmScore: { r: 5, f: 1, m: 3 }, totalSpent: 1250, totalOrders: 4, avgOrderValue: 313, lastVisit: '2026-02-13', joinedDate: '2026-01-28', loyaltyPoints: 250, loyaltyTier: 'bronze', tags: ['New', 'Promising'], preferences: [] },
]

// Segment colors
const segmentColors: Record<Customer['segment'], string> = {
  champion: 'bg-purple-100 text-purple-700',
  loyal: 'bg-green-100 text-green-700',
  potential: 'bg-blue-100 text-blue-700',
  at_risk: 'bg-orange-100 text-orange-700',
  new: 'bg-cyan-100 text-cyan-700',
  dormant: 'bg-gray-100 text-gray-500',
}

// Component
export function CustomersView() {
  const [customers] = useState<Customer[]>(generateCustomers)
  const [activeTab, setActiveTab] = useState<string>('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [segmentFilter, setSegmentFilter] = useState<string>('all')
  const [tierFilter, setTierFilter] = useState<string>('all')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [addCustomerOpen, setAddCustomerOpen] = useState(false)
  const [messageOpen, setMessageOpen] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' })

  // Computed stats
  const totalCustomers = customers.length
  const activeCustomers = customers.filter(c => c.segment !== 'dormant').length
  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0)
  const avgLifetimeValue = totalRevenue / totalCustomers

  const segmentCounts = {
    champion: customers.filter(c => c.segment === 'champion').length,
    loyal: customers.filter(c => c.segment === 'loyal').length,
    potential: customers.filter(c => c.segment === 'potential').length,
    at_risk: customers.filter(c => c.segment === 'at_risk').length,
    new: customers.filter(c => c.segment === 'new').length,
    dormant: customers.filter(c => c.segment === 'dormant').length,
  }

  const tierCounts = {
    platinum: customers.filter(c => c.loyaltyTier === 'platinum').length,
    gold: customers.filter(c => c.loyaltyTier === 'gold').length,
    silver: customers.filter(c => c.loyaltyTier === 'silver').length,
    bronze: customers.filter(c => c.loyaltyTier === 'bronze').length,
  }

  // Filtered customers
  const filteredCustomers = useMemo(() => customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSegment = segmentFilter === 'all' || c.segment === segmentFilter
    const matchesTier = tierFilter === 'all' || c.loyaltyTier === tierFilter
    return matchesSearch && matchesSegment && matchesTier
  }), [customers, searchQuery, segmentFilter, tierFilter])

  // Top customers by value
  const topCustomers = [...customers].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5)

  // At risk customers
  const atRiskCustomers = customers.filter(c => c.segment === 'at_risk')

  // Get tier info
  const getTierInfo = (tier: Customer['loyaltyTier']) => loyaltyTiers.find(t => t.name.toLowerCase() === tier)!

  // Format currency
  const formatCurrency = (amount: number) => `R${amount.toLocaleString()}`

  // Get initials
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase()

  // Render Overview
  const renderOverview = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-[#00897B]">
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Total Customers</p>
            <p className="text-2xl font-bold">{totalCustomers}</p>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />+12 this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Active Rate</p>
            <p className="text-2xl font-bold">{Math.round(activeCustomers / totalCustomers * 100)}%</p>
            <Progress value={activeCustomers / totalCustomers * 100} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Total Revenue</p>
            <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
            <p className="text-xs text-[#757575]">Lifetime</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Avg Lifetime Value</p>
            <p className="text-2xl font-bold">{formatCurrency(Math.round(avgLifetimeValue))}</p>
            <p className="text-xs text-[#757575]">Per customer</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Points Outstanding</p>
            <p className="text-2xl font-bold">{customers.reduce((s, c) => s + c.loyaltyPoints, 0).toLocaleString()}</p>
            <p className="text-xs text-[#757575]">Loyalty points</p>
          </CardContent>
        </Card>
      </div>

      {/* RFM Segment Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <PieChart className="h-4 w-4 text-[#00897B]" />
              Customer Segments (RFM)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'Champions', count: segmentCounts.champion, color: 'bg-purple-500', desc: 'Best customers - top 20%' },
                { name: 'Loyal', count: segmentCounts.loyal, color: 'bg-green-500', desc: 'Regular buyers' },
                { name: 'Potential', count: segmentCounts.potential, color: 'bg-blue-500', desc: 'Growing engagement' },
                { name: 'At Risk', count: segmentCounts.at_risk, color: 'bg-orange-500', desc: 'Need attention' },
                { name: 'New', count: segmentCounts.new, color: 'bg-cyan-500', desc: 'Recently acquired' },
                { name: 'Dormant', count: segmentCounts.dormant, color: 'bg-gray-400', desc: 'Inactive 90+ days' },
              ].map(segment => (
                <div key={segment.name} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${segment.color}`} />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">{segment.name}</span>
                      <span className="text-sm font-bold">{segment.count}</span>
                    </div>
                    <Progress value={(segment.count / totalCustomers) * 100} className="h-1.5 mt-1" />
                    <p className="text-[10px] text-[#757575] mt-0.5">{segment.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Crown className="h-4 w-4 text-yellow-500" />
              Loyalty Tiers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loyaltyTiers.map(tier => {
                const count = tierCounts[tier.name.toLowerCase() as keyof typeof tierCounts]
                const Icon = tier.icon
                return (
                  <div key={tier.name} className={`flex items-center gap-3 p-3 rounded-lg ${tier.color}`}>
                    <Icon className="h-5 w-5" />
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{tier.name}</span>
                        <Badge variant="secondary">{count} customers</Badge>
                      </div>
                      <p className="text-xs opacity-80">{tier.discount}% discount • {tier.minPoints.toLocaleString()}+ points</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers & At Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              Top Customers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topCustomers.map((customer, i) => (
              <div 
                key={customer.id} 
                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                onClick={() => setSelectedCustomer(customer)}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                  {i + 1}
                </div>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-[#E0F2F1] text-[#00897B] text-xs">
                    {getInitials(customer.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">{customer.name}</p>
                  <p className="text-xs text-[#757575]">{customer.totalOrders} orders</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#00897B]">{formatCurrency(customer.totalSpent)}</p>
                  <Badge className={getTierInfo(customer.loyaltyTier).color}>
                    {customer.loyaltyTier}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                At Risk Customers
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => setMessageOpen(true)}>
                <Send className="h-3 w-3 mr-1" />
                Win-back Campaign
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {atRiskCustomers.length === 0 ? (
              <p className="text-sm text-[#757575] text-center py-4">No at-risk customers</p>
            ) : (
              atRiskCustomers.map(customer => (
                <div 
                  key={customer.id} 
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  onClick={() => setSelectedCustomer(customer)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-orange-100 text-orange-700 text-xs">
                      {getInitials(customer.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{customer.name}</p>
                    <p className="text-xs text-[#757575]">Last visit: {customer.lastVisit}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatCurrency(customer.totalSpent)}</p>
                    <p className="text-xs text-orange-600">{customer.totalOrders} orders</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelectedCustomer(customer); setMessageOpen(true); }}>
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // Render Customer List
  const renderCustomers = () => (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
          <Input placeholder="Search customers..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={segmentFilter} onValueChange={setSegmentFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Segment" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Segments</SelectItem>
            <SelectItem value="champion">Champions</SelectItem>
            <SelectItem value="loyal">Loyal</SelectItem>
            <SelectItem value="potential">Potential</SelectItem>
            <SelectItem value="at_risk">At Risk</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="dormant">Dormant</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Tier" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="platinum">Platinum</SelectItem>
            <SelectItem value="gold">Gold</SelectItem>
            <SelectItem value="silver">Silver</SelectItem>
            <SelectItem value="bronze">Bronze</SelectItem>
          </SelectContent>
        </Select>
        <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setAddCustomerOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />Add Customer
        </Button>
      </div>

      {/* Customer List */}
      <ScrollArea className="flex-1">
        <div className="space-y-2">
          {filteredCustomers.map(customer => {
            const tierInfo = getTierInfo(customer.loyaltyTier)
            const TierIcon = tierInfo.icon
            return (
              <Card key={customer.id} className="cursor-pointer hover:shadow-md transition-all" onClick={() => setSelectedCustomer(customer)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-[#E0F2F1] text-[#00897B]">
                        {getInitials(customer.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate">{customer.name}</h4>
                        <Badge className={segmentColors[customer.segment]}>
                          {customer.segment.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-[#757575] mt-1">
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{customer.phone}</span>
                        <span className="flex items-center gap-1"><ShoppingBag className="h-3 w-3" />{customer.totalOrders} orders</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Last: {customer.lastVisit}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold text-[#00897B]">{formatCurrency(customer.totalSpent)}</p>
                        <div className={`flex items-center gap-1 text-xs ${tierInfo.color} px-2 py-0.5 rounded-full`}>
                          <TierIcon className="h-3 w-3" />
                          {customer.loyaltyTier}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelectedCustomer(customer); setMessageOpen(true); }}>
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )

  // Render Loyalty
  const renderLoyalty = () => (
    <div className="space-y-6">
      {/* Program Overview */}
      <Card className="bg-gradient-to-r from-[#00897B] to-[#4CAF50] text-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
              <Gift className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Groway Rewards</h2>
              <p className="opacity-80">Earn 1 point per R5 spent • Redeem for discounts</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tier Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tier Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loyaltyTiers.map(tier => {
                const count = tierCounts[tier.name.toLowerCase() as keyof typeof tierCounts]
                const Icon = tier.icon
                return (
                  <div key={tier.name} className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${tier.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{tier.name}</span>
                        <span>{count} ({Math.round(count / totalCustomers * 100)}%)</span>
                      </div>
                      <Progress value={(count / totalCustomers) * 100} className="h-2 mt-1" />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Points Activity (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">+12,450</p>
                <p className="text-xs text-green-600">Points Earned</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">-4,200</p>
                <p className="text-xs text-blue-600">Points Redeemed</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">R2,100</p>
                <p className="text-xs text-purple-600">Discounts Given</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">89%</p>
                <p className="text-xs text-orange-600">Redemption Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Redemptions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Recent Redemptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { customer: 'David Mokoena', points: 500, discount: 'R25', time: '2 hours ago' },
              { customer: 'Thandi Mbeki', points: 1000, discount: 'R50', time: '5 hours ago' },
              { customer: 'Sipho Dlamini', points: 250, discount: 'R12.50', time: 'Yesterday' },
              { customer: 'Johan van der Berg', points: 750, discount: 'R37.50', time: 'Yesterday' },
            ].map((r, i) => (
              <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                <Gift className="h-4 w-4 text-[#00897B]" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{r.customer}</p>
                  <p className="text-xs text-[#757575]">{r.time}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-600">-{r.points} pts</p>
                  <p className="text-xs text-green-600">→ {r.discount} off</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Render Campaigns
  const renderCampaigns = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-bold">Marketing Campaigns</h2>
        <Button className="bg-[#00897B] hover:bg-[#00695C]">
          <Plus className="h-4 w-4 mr-2" />New Campaign
        </Button>
      </div>

      {/* Campaign Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-green-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">4</p>
            <p className="text-xs text-green-600">Active Campaigns</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">2,847</p>
            <p className="text-xs text-blue-600">Messages Sent</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">18.5%</p>
            <p className="text-xs text-purple-600">Open Rate</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">R4,280</p>
            <p className="text-xs text-orange-600">Revenue Generated</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign List */}
      <div className="space-y-3">
        {[
          { name: 'Win-back Campaign', target: 'At Risk Customers', sent: 45, opened: 12, revenue: 890, status: 'active' },
          { name: 'Weekend Special', target: 'All Loyalty Members', sent: 156, opened: 28, revenue: 2150, status: 'active' },
          { name: 'New Customer Welcome', target: 'New Customers', sent: 12, opened: 8, revenue: 340, status: 'active' },
          { name: 'Valentine\'s Promo', target: 'All Customers', sent: 280, opened: 52, revenue: 3200, status: 'completed' },
        ].map((campaign, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${campaign.status === 'active' ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <MessageCircle className={`h-5 w-5 ${campaign.status === 'active' ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{campaign.name}</h4>
                    <Badge className={campaign.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                      {campaign.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#757575]">{campaign.target}</p>
                </div>
                <div className="flex gap-6 text-sm">
                  <div className="text-center">
                    <p className="font-bold">{campaign.sent}</p>
                    <p className="text-xs text-[#757575]">Sent</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold">{campaign.opened}</p>
                    <p className="text-xs text-[#757575]">Opened</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-[#00897B]">R{campaign.revenue}</p>
                    <p className="text-xs text-[#757575]">Revenue</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">View</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Tabs */}
      <div className="bg-white border-b px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-transparent h-12">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <PieChart className="h-4 w-4 mr-2" />Overview
            </TabsTrigger>
            <TabsTrigger value="customers" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <Users className="h-4 w-4 mr-2" />Customers
            </TabsTrigger>
            <TabsTrigger value="loyalty" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <Gift className="h-4 w-4 mr-2" />Loyalty
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <MessageCircle className="h-4 w-4 mr-2" />Campaigns
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'customers' && renderCustomers()}
        {activeTab === 'loyalty' && renderLoyalty()}
        {activeTab === 'campaigns' && renderCampaigns()}
      </ScrollArea>

      {/* Customer Detail Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="sm:max-w-2xl">
          {selectedCustomer && (
            <>
              <DialogHeader>
                <DialogTitle>Customer Profile</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-[#E0F2F1] text-[#00897B] text-xl">
                      {getInitials(selectedCustomer.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">{selectedCustomer.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={segmentColors[selectedCustomer.segment]}>
                        {selectedCustomer.segment.replace('_', ' ')}
                      </Badge>
                      <Badge className={getTierInfo(selectedCustomer.loyaltyTier).color}>
                        {(() => {
                          const tierInfo = getTierInfo(selectedCustomer.loyaltyTier)
                          const TierIcon = tierInfo.icon
                          return TierIcon && <TierIcon className="h-3 w-3 mr-1" />
                        })()}
                        {selectedCustomer.loyaltyTier}
                      </Badge>
                    </div>
                    <div className="flex gap-4 mt-2 text-sm text-[#757575]">
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{selectedCustomer.phone}</span>
                      {selectedCustomer.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{selectedCustomer.email}</span>}
                    </div>
                  </div>
                </div>

                {/* RFM Score */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-[#00897B]">{selectedCustomer.rfmScore.r}</p>
                    <p className="text-xs text-[#757575]">Recency (1-5)</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-[#00897B]">{selectedCustomer.rfmScore.f}</p>
                    <p className="text-xs text-[#757575]">Frequency (1-5)</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-[#00897B]">{selectedCustomer.rfmScore.m}</p>
                    <p className="text-xs text-[#757575]">Monetary (1-5)</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center p-3 border rounded-lg">
                    <p className="text-lg font-bold text-[#00897B]">{formatCurrency(selectedCustomer.totalSpent)}</p>
                    <p className="text-xs text-[#757575]">Total Spent</p>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <p className="text-lg font-bold">{selectedCustomer.totalOrders}</p>
                    <p className="text-xs text-[#757575]">Orders</p>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <p className="text-lg font-bold">{formatCurrency(selectedCustomer.avgOrderValue)}</p>
                    <p className="text-xs text-[#757575]">Avg Order</p>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <p className="text-lg font-bold text-purple-600">{selectedCustomer.loyaltyPoints.toLocaleString()}</p>
                    <p className="text-xs text-[#757575]">Points</p>
                  </div>
                </div>

                {/* Tags & Preferences */}
                <div className="flex flex-wrap gap-2">
                  {selectedCustomer.tags.map(tag => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button className="flex-1 bg-[#00897B] hover:bg-[#00695C]" onClick={() => { setSelectedCustomer(null); setMessageOpen(true); }}>
                    <MessageCircle className="h-4 w-4 mr-2" />Send Message
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Gift className="h-4 w-4 mr-2" />Add Points
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Edit className="h-4 w-4 mr-2" />Edit
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Customer Dialog */}
      <Dialog open={addCustomerOpen} onOpenChange={setAddCustomerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>Enter customer details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-[#757575]">Full Name</label>
              <Input placeholder="Customer name" value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-[#757575]">Phone Number</label>
              <Input placeholder="+27 XX XXX XXXX" value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-[#757575]">Email (Optional)</label>
              <Input placeholder="email@example.com" value={newCustomer.email} onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCustomerOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setAddCustomerOpen(false)}>Add Customer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Message Dialog */}
      <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Send WhatsApp Message
            </DialogTitle>
            <DialogDescription>
              {selectedCustomer ? `Send to ${selectedCustomer.name}` : 'Send to customers'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setMessageText('Hi! We miss you. Come back for 10% off your next order!')}>
                Win-back
              </Button>
              <Button size="sm" variant="outline" onClick={() => setMessageText('Thank you for being a loyal customer! Enjoy 15% off today.')}>
                Loyalty
              </Button>
              <Button size="sm" variant="outline" onClick={() => setMessageText('Check out our weekend specials!')}>
                Promo
              </Button>
            </div>
            <textarea
              className="w-full h-32 p-3 border rounded-lg resize-none text-sm"
              placeholder="Type your message..."
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
            />
            <p className="text-xs text-[#757575]">
              {messageText.length}/1000 characters • WhatsApp Business API
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageOpen(false)}>Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => setMessageOpen(false)}>
              <Send className="h-4 w-4 mr-2" />Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
