'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MapPin,
  Navigation,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  Users,
  TrendingUp,
  Trophy,
  Target,
  Route,
  Car,
  Play,
  Pause,
  Flag,
  Camera,
  RefreshCw,
  Plus,
  ChevronRight,
  Map,
  Phone,
  Building2,
  User,
  Loader2,
  Timer,
  Zap,
  Award,
  AlertTriangle,
  BarChart3,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Filter,
  Download,
  Search,
  Briefcase,
  Activity,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Sun,
  Moon,
  LayoutGrid,
  List
} from 'lucide-react'

// Types
interface SalesVisit {
  id: string
  salesRepId: string
  salesRepName: string
  visitType: string
  purpose: string
  notes?: string
  outcome?: string
  customerId?: string
  customerName: string
  customerPhone?: string
  customerEmail?: string
  customerAddress?: string
  checkInLat?: number
  checkInLng?: number
  checkInAddress?: string
  checkInAt?: Date
  checkOutAt?: Date
  durationMinutes?: number
  routeOrder: number
  plannedDate?: string
  plannedTime?: string
  followUpRequired: boolean
  followUpDate?: string
  followUpNotes?: string
  revenueGenerated: number
  dealsClosed: number
  status: string
  createdAt: Date
  updatedAt: Date
}

interface SalesRoute {
  id: string
  salesRepId: string
  salesRepName: string
  routeDate: string
  routeName?: string
  totalVisits: number
  completedVisits: number
  totalDistance: number
  totalDuration: number
  optimizedOrder?: string
  optimizationScore?: number
  status: string
  startedAt?: Date
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

interface SalesRep {
  id: string
  name: string
  email: string
  phone: string
  province: string
  visitsToday: number
  visitsThisMonth: number
  targetVisits: number
  completionRate: number
  totalKm: number
  avgDuration: number
  revenueGenerated: number
  dealsClosed: number
  rank: number
  status: string
}

interface LeaderboardEntry {
  rank: number
  salesRepId: string
  salesRepName: string
  visits: number
  conversions: number
  revenue: number
  score: number
  avatar?: string
}

// Demo data
const demoSalesReps: SalesRep[] = [
  {
    id: 'sr-001',
    name: 'Thabo Molefe',
    email: 'thabo.molefe@groway.co.za',
    phone: '+27 82 123 4567',
    province: 'Gauteng',
    visitsToday: 3,
    visitsThisMonth: 23,
    targetVisits: 40,
    completionRate: 87,
    totalKm: 456.8,
    avgDuration: 45,
    revenueGenerated: 125000,
    dealsClosed: 8,
    rank: 3,
    status: 'active'
  },
  {
    id: 'sr-002',
    name: 'Nomsa Dlamini',
    email: 'nomsa.dlamini@groway.co.za',
    phone: '+27 83 234 5678',
    province: 'Gauteng',
    visitsToday: 5,
    visitsThisMonth: 38,
    targetVisits: 40,
    completionRate: 95,
    totalKm: 623.2,
    avgDuration: 38,
    revenueGenerated: 198000,
    dealsClosed: 12,
    rank: 1,
    status: 'active'
  },
  {
    id: 'sr-003',
    name: 'Johan van der Berg',
    email: 'johan.vdb@groway.co.za',
    phone: '+27 84 345 6789',
    province: 'Western Cape',
    visitsToday: 2,
    visitsThisMonth: 35,
    targetVisits: 40,
    completionRate: 88,
    totalKm: 512.5,
    avgDuration: 42,
    revenueGenerated: 156000,
    dealsClosed: 10,
    rank: 2,
    status: 'active'
  },
  {
    id: 'sr-004',
    name: 'Priya Naidoo',
    email: 'priya.naidoo@groway.co.za',
    phone: '+27 85 456 7890',
    province: 'KwaZulu-Natal',
    visitsToday: 4,
    visitsThisMonth: 28,
    targetVisits: 35,
    completionRate: 80,
    totalKm: 389.3,
    avgDuration: 50,
    revenueGenerated: 98000,
    dealsClosed: 6,
    rank: 4,
    status: 'active'
  },
  {
    id: 'sr-005',
    name: 'Sipho Zulu',
    email: 'sipho.zulu@groway.co.za',
    phone: '+27 86 567 8901',
    province: 'Gauteng',
    visitsToday: 1,
    visitsThisMonth: 25,
    targetVisits: 40,
    completionRate: 63,
    totalKm: 301.7,
    avgDuration: 55,
    revenueGenerated: 75000,
    dealsClosed: 5,
    rank: 5,
    status: 'active'
  }
]

const demoVisits: SalesVisit[] = [
  {
    id: 'v-001',
    salesRepId: 'sr-001',
    salesRepName: 'Thabo Molefe',
    visitType: 'demo',
    purpose: 'new_business',
    notes: 'Product demo for new POS system',
    outcome: null,
    customerName: 'Spaza Store SA',
    customerPhone: '+27 72 111 2222',
    customerAddress: '12 DF Malan Dr, Mamelodi',
    checkInLat: -25.7461,
    checkInLng: 28.2181,
    plannedDate: new Date().toISOString().split('T')[0],
    plannedTime: '10:00',
    followUpRequired: false,
    revenueGenerated: 0,
    dealsClosed: 0,
    routeOrder: 1,
    status: 'planned',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'v-002',
    salesRepId: 'sr-001',
    salesRepName: 'Thabo Molefe',
    visitType: 'follow_up',
    purpose: 'account_management',
    notes: 'Quarterly business review',
    outcome: null,
    customerName: 'Cafe Sunrise',
    customerPhone: '+27 73 222 3333',
    customerAddress: '45 Stanza Bopape St, Sunnyside',
    plannedDate: new Date().toISOString().split('T')[0],
    plannedTime: '14:00',
    followUpRequired: false,
    revenueGenerated: 0,
    dealsClosed: 0,
    routeOrder: 2,
    status: 'planned',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'v-003',
    salesRepId: 'sr-002',
    salesRepName: 'Nomsa Dlamini',
    visitType: 'scheduled',
    purpose: 'new_business',
    notes: 'Initial meeting with prospect',
    outcome: 'successful',
    customerName: 'Tech Solutions Ltd',
    customerPhone: '+27 74 333 4444',
    customerAddress: '78 Steve Biko Rd, Arcadia',
    checkInLat: -25.7489,
    checkInLng: 28.2134,
    checkInAt: new Date(Date.now() - 3600000),
    checkOutAt: new Date(Date.now() - 1800000),
    durationMinutes: 30,
    plannedDate: new Date().toISOString().split('T')[0],
    plannedTime: '09:00',
    followUpRequired: true,
    followUpDate: new Date(Date.now() + 7 * 24 * 3600000).toISOString().split('T')[0],
    followUpNotes: 'Send pricing proposal',
    revenueGenerated: 45000,
    dealsClosed: 0,
    routeOrder: 1,
    status: 'completed',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'v-004',
    salesRepId: 'sr-002',
    salesRepName: 'Nomsa Dlamini',
    visitType: 'training',
    purpose: 'support',
    notes: 'Staff training on new POS features',
    outcome: null,
    customerName: 'Metro Supermarket',
    customerPhone: '+27 75 444 5555',
    customerAddress: '123 Church St, Pretoria CBD',
    plannedDate: new Date().toISOString().split('T')[0],
    plannedTime: '11:30',
    followUpRequired: false,
    revenueGenerated: 0,
    dealsClosed: 0,
    routeOrder: 2,
    status: 'in_progress',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

export default function SalesforceView() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [visits, setVisits] = useState<SalesVisit[]>([])
  const [routes, setRoutes] = useState<SalesRoute[]>([])
  const [salesReps, setSalesReps] = useState<SalesRep[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [selectedVisit, setSelectedVisit] = useState<SalesVisit | null>(null)
  const [selectedSalesRep, setSelectedSalesRep] = useState<SalesRep | null>(null)
  const [visitDialogOpen, setVisitDialogOpen] = useState(false)
  const [salesRepDialogOpen, setSalesRepDialogOpen] = useState(false)
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('today')
  
  // Form state
  const [visitNotes, setVisitNotes] = useState('')
  const [visitOutcome, setVisitOutcome] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')
  const [followUpNotes, setFollowUpNotes] = useState('')

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Try to fetch from API
      const response = await fetch('/api/salesforce/visits')
      if (response.ok) {
        const data = await response.json()
        if (data.data && data.data.length > 0) {
          setVisits(data.data)
        } else {
          setVisits(demoVisits)
        }
      } else {
        setVisits(demoVisits)
      }
      
      // Set demo data for now
      setSalesReps(demoSalesReps)
      
      // Generate leaderboard from sales reps
      setLeaderboard(demoSalesReps.map((rep, index) => ({
        rank: rep.rank,
        salesRepId: rep.id,
        salesRepName: rep.name,
        visits: rep.visitsThisMonth,
        conversions: rep.dealsClosed,
        revenue: rep.revenueGenerated,
        score: Math.round(rep.visitsThisMonth * 2 + rep.dealsClosed * 10 + rep.revenueGenerated / 1000)
      })).sort((a, b) => b.score - a.score))
      
    } catch (error) {
      console.error('Error fetching data:', error)
      setVisits(demoVisits)
      setSalesReps(demoSalesReps)
    }
    setLoading(false)
  }, [])

  // Initial load
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Format time
  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString('en-ZA', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Format date
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-ZA', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      planned: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      in_progress: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      completed: 'bg-green-500/20 text-green-400 border-green-500/30',
      cancelled: 'bg-red-500/20 text-red-400 border-red-500/30'
    }
    return <Badge className={`${styles[status] || 'bg-gray-500/20 text-gray-400'} border capitalize`}>
      {status.replace('_', ' ')}
    </Badge>
  }

  // Get visit type badge
  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      scheduled: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      unscheduled: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      follow_up: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      demo: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      training: 'bg-pink-500/20 text-pink-400 border-pink-500/30'
    }
    return <Badge className={`${styles[type] || 'bg-gray-500/20 text-gray-400'} border capitalize`}>
      {type.replace('_', ' ')}
    </Badge>
  }

  // Get outcome badge
  const getOutcomeBadge = (outcome: string) => {
    const styles: Record<string, string> = {
      successful: 'bg-green-500/20 text-green-400 border-green-500/30',
      unsuccessful: 'bg-red-500/20 text-red-400 border-red-500/30',
      follow_up_needed: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      closed_won: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      closed_lost: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
    return <Badge className={`${styles[outcome] || 'bg-gray-500/20 text-gray-400'} border capitalize`}>
      {outcome.replace('_', ' ')}
    </Badge>
  }

  // Calculate summary stats
  const totalVisitsToday = salesReps.reduce((sum, rep) => sum + rep.visitsToday, 0)
  const totalVisitsMonth = salesReps.reduce((sum, rep) => sum + rep.visitsThisMonth, 0)
  const totalRevenue = salesReps.reduce((sum, rep) => sum + rep.revenueGenerated, 0)
  const totalDeals = salesReps.reduce((sum, rep) => sum + rep.dealsClosed, 0)
  const avgCompletionRate = Math.round(salesReps.reduce((sum, rep) => sum + rep.completionRate, 0) / salesReps.length)

  // Filter visits
  const filteredVisits = visits.filter(visit => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (!visit.customerName.toLowerCase().includes(query) &&
          !visit.salesRepName.toLowerCase().includes(query) &&
          !visit.customerAddress?.toLowerCase().includes(query)) {
        return false
      }
    }
    if (statusFilter !== 'all' && visit.status !== statusFilter) return false
    if (typeFilter !== 'all' && visit.visitType !== typeFilter) return false
    return true
  })

  // Handle visit update
  const handleUpdateVisit = async () => {
    if (!selectedVisit) return
    
    toast.success('Visit updated successfully')
    setVisitDialogOpen(false)
    fetchData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-[#00897B]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-[#00897B]" />
            Salesforce Management
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Visit tracking, route optimization, and performance management
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
            onClick={() => setScheduleDialogOpen(true)}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Visit
          </Button>
          <Button 
            size="sm"
            className="bg-[#00897B] hover:bg-[#00695C] text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Route
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-[#1E293B] border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#00897B]/20 text-[#00897B]">
                <Calendar className="h-5 w-5" />
              </div>
              <TrendingUp className="h-4 w-4 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-white">{totalVisitsToday}</p>
            <p className="text-xs text-gray-400">Visits Today</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1E293B] border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-500/20 text-blue-400">
                <Target className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{totalVisitsMonth}</p>
            <p className="text-xs text-gray-400">Monthly Visits</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1E293B] border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-500/20 text-green-400">
                <DollarSign className="h-5 w-5" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(totalRevenue)}</p>
            <p className="text-xs text-gray-400">Revenue Generated</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1E293B] border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-500/20 text-purple-400">
                <Award className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{totalDeals}</p>
            <p className="text-xs text-gray-400">Deals Closed</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1E293B] border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-500/20 text-amber-400">
                <Activity className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{avgCompletionRate}%</p>
            <p className="text-xs text-gray-400">Avg Completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#1E293B] border border-gray-700 grid grid-cols-4 w-full max-w-xl">
          <TabsTrigger value="overview" className="data-[state=active]:bg-[#00897B]">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="visits" className="data-[state=active]:bg-[#00897B]">
            <MapPin className="h-4 w-4 mr-2" />
            Visits
          </TabsTrigger>
          <TabsTrigger value="routes" className="data-[state=active]:bg-[#00897B]">
            <Route className="h-4 w-4 mr-2" />
            Routes
          </TabsTrigger>
          <TabsTrigger value="team" className="data-[state=active]:bg-[#00897B]">
            <Users className="h-4 w-4 mr-2" />
            Team
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Recent Activity */}
            <div className="lg:col-span-2 space-y-4">
              {/* Active Visits */}
              <Card className="bg-[#1E293B] border-gray-700">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-base flex items-center gap-2">
                      <Play className="h-4 w-4 text-amber-400" />
                      Active Visits
                    </CardTitle>
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                      {visits.filter(v => v.status === 'in_progress').length} in progress
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[250px]">
                    <div className="space-y-3">
                      {visits.filter(v => v.status === 'in_progress' || v.status === 'planned').slice(0, 5).map((visit) => (
                        <div 
                          key={visit.id}
                          className="p-4 rounded-lg bg-[#0F172A] border border-gray-700/50 cursor-pointer hover:border-gray-600"
                          onClick={() => { setSelectedVisit(visit); setVisitDialogOpen(true); }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#00897B]/20 text-[#00897B]">
                                {visit.visitType === 'demo' ? <Zap className="h-5 w-5" /> : 
                                 visit.visitType === 'training' ? <Award className="h-5 w-5" /> :
                                 <MapPin className="h-5 w-5" />}
                              </div>
                              <div>
                                <p className="text-white font-medium">{visit.customerName}</p>
                                <p className="text-xs text-gray-400">{visit.salesRepName}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getTypeBadge(visit.visitType)}
                              {getStatusBadge(visit.status)}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {visit.plannedTime || 'TBD'}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {visit.customerAddress?.split(',')[0]}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Performance Chart */}
              <Card className="bg-[#1E293B] border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[#00897B]" />
                    Weekly Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                      const visits = Math.floor(Math.random() * 15) + 5
                      const maxVisits = 20
                      return (
                        <div key={day} className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 w-8">{day}</span>
                          <div className="flex-1 h-4 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-[#00897B] to-[#4CAF50] rounded-full flex items-center justify-end pr-2"
                              style={{ width: `${(visits / maxVisits) * 100}%` }}
                            >
                              {visits > 8 && (
                                <span className="text-[10px] text-white font-medium">{visits}</span>
                              )}
                            </div>
                          </div>
                          {visits <= 8 && (
                            <span className="text-xs text-gray-400 w-6">{visits}</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Leaderboard */}
            <div className="space-y-4">
              <Card className="bg-[#1E293B] border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-base flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-400" />
                    Leaderboard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {leaderboard.map((entry) => (
                      <div 
                        key={entry.salesRepId}
                        className="flex items-center gap-3 p-2 rounded-lg bg-[#0F172A] hover:bg-[#0F172A]/80 cursor-pointer"
                        onClick={() => {
                          const rep = salesReps.find(r => r.id === entry.salesRepId)
                          if (rep) {
                            setSelectedSalesRep(rep)
                            setSalesRepDialogOpen(true)
                          }
                        }}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          entry.rank === 1 ? 'bg-amber-500 text-amber-900' :
                          entry.rank === 2 ? 'bg-gray-400 text-gray-900' :
                          entry.rank === 3 ? 'bg-amber-700 text-amber-100' :
                          'bg-gray-700 text-gray-300'
                        }`}>
                          {entry.rank}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm truncate">{entry.salesRepName}</p>
                          <p className="text-xs text-gray-400">{entry.visits} visits • {entry.conversions} deals</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[#00897B] font-bold">{entry.score}</p>
                          <p className="text-xs text-gray-500">pts</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Follow-ups Required */}
              <Card className="bg-[#1E293B] border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    Follow-ups Required
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {visits.filter(v => v.followUpRequired).map((visit) => (
                      <div key={visit.id} className="p-3 rounded-lg bg-[#0F172A] border border-amber-500/20">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-white text-sm">{visit.customerName}</p>
                          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                            {visit.followUpDate ? formatDate(visit.followUpDate) : 'Pending'}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-400">{visit.followUpNotes}</p>
                      </div>
                    ))}
                    {visits.filter(v => v.followUpRequired).length === 0 && (
                      <div className="text-center py-4 text-gray-400 text-sm">
                        No follow-ups pending
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Visits Tab */}
        <TabsContent value="visits" className="mt-4">
          <Card className="bg-[#1E293B] border-gray-700">
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <CardTitle className="text-white text-base">Visit Management</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      placeholder="Search visits..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-48 bg-[#0F172A] border-gray-600 text-white text-sm"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-28 bg-[#0F172A] border-gray-600 text-white text-sm">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-28 bg-[#0F172A] border-gray-600 text-white text-sm">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="demo">Demo</SelectItem>
                      <SelectItem value="follow_up">Follow Up</SelectItem>
                      <SelectItem value="training">Training</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" className="border-gray-600 text-gray-300">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700 hover:bg-transparent">
                      <TableHead className="text-gray-400">Customer</TableHead>
                      <TableHead className="text-gray-400">Sales Rep</TableHead>
                      <TableHead className="text-gray-400">Type</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                      <TableHead className="text-gray-400">Time</TableHead>
                      <TableHead className="text-gray-400">Location</TableHead>
                      <TableHead className="text-gray-400">Outcome</TableHead>
                      <TableHead className="text-gray-400 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVisits.map((visit) => (
                      <TableRow key={visit.id} className="border-gray-700 hover:bg-[#0F172A]/50">
                        <TableCell>
                          <div>
                            <p className="text-white font-medium">{visit.customerName}</p>
                            <p className="text-xs text-gray-400">{visit.customerPhone}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-white text-sm">{visit.salesRepName}</p>
                        </TableCell>
                        <TableCell>{getTypeBadge(visit.visitType)}</TableCell>
                        <TableCell>{getStatusBadge(visit.status)}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-white text-sm">{visit.plannedTime || 'TBD'}</p>
                            <p className="text-xs text-gray-400">{visit.plannedDate ? formatDate(visit.plannedDate) : 'No date'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-white text-sm max-w-[150px] truncate">{visit.customerAddress}</p>
                        </TableCell>
                        <TableCell>
                          {visit.outcome ? getOutcomeBadge(visit.outcome) : <span className="text-gray-500 text-sm">-</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#1E293B] border-gray-700 text-white">
                              <DropdownMenuItem 
                                className="hover:bg-gray-700/50"
                                onClick={() => { setSelectedVisit(visit); setVisitDialogOpen(true); }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem className="hover:bg-gray-700/50">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-400 hover:bg-gray-700/50">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Cancel
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {filteredVisits.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No visits found matching your filters</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Routes Tab */}
        <TabsContent value="routes" className="mt-4">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Route Optimization */}
            <Card className="bg-[#1E293B] border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Route className="h-4 w-4 text-[#00897B]" />
                  Route Optimization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Map Placeholder */}
                  <div className="aspect-video bg-[#0F172A] rounded-lg border border-gray-700 flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <Map className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Route Map Visualization</p>
                      <p className="text-xs text-gray-500">Integrated mapping coming soon</p>
                    </div>
                  </div>
                  
                  {/* Optimized Route List */}
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">Optimized Order</p>
                    {visits.filter(v => v.status === 'planned').slice(0, 5).map((visit, index) => (
                      <div key={visit.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#0F172A] border border-gray-700/50">
                        <div className="w-8 h-8 rounded-full bg-[#00897B] flex items-center justify-center text-white text-sm font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm truncate">{visit.customerName}</p>
                          <p className="text-xs text-gray-400 truncate">{visit.customerAddress}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white text-sm">{visit.plannedTime}</p>
                          <p className="text-xs text-gray-500">{index > 0 ? `${Math.round(Math.random() * 15 + 5)} km` : 'Start'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Button className="w-full bg-[#00897B] hover:bg-[#00695C] text-white">
                    <Navigation className="h-4 w-4 mr-2" />
                    Optimize Routes
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Route Stats */}
            <Card className="bg-[#1E293B] border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Car className="h-4 w-4 text-blue-400" />
                  Today's Routes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {salesReps.slice(0, 4).map((rep) => (
                    <div key={rep.id} className="p-4 rounded-lg bg-[#0F172A] border border-gray-700/50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#00897B]/20 flex items-center justify-center text-[#00897B] font-bold">
                            {rep.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-white font-medium">{rep.name}</p>
                            <p className="text-xs text-gray-400">{rep.visitsToday} visits scheduled</p>
                          </div>
                        </div>
                        <Badge className={`${rep.visitsToday > 0 ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                          {rep.visitsToday > 0 ? 'Active' : 'Idle'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded bg-[#1E293B]">
                          <p className="text-white font-medium">{rep.totalKm.toFixed(1)}</p>
                          <p className="text-xs text-gray-400">km total</p>
                        </div>
                        <div className="p-2 rounded bg-[#1E293B]">
                          <p className="text-white font-medium">{rep.avgDuration}</p>
                          <p className="text-xs text-gray-400">min/visit</p>
                        </div>
                        <div className="p-2 rounded bg-[#1E293B]">
                          <p className="text-white font-medium">{rep.completionRate}%</p>
                          <p className="text-xs text-gray-400">completion</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="mt-4">
          <Card className="bg-[#1E293B] border-gray-700">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-base">Sales Team Performance</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    className={viewMode === 'grid' ? 'bg-[#00897B] text-white' : 'border-gray-600 text-gray-300'}
                    onClick={() => setViewMode('grid')}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    className={viewMode === 'list' ? 'bg-[#00897B] text-white' : 'border-gray-600 text-gray-300'}
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {viewMode === 'grid' ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {salesReps.map((rep) => (
                    <Card 
                      key={rep.id} 
                      className="bg-[#0F172A] border-gray-700 cursor-pointer hover:border-gray-600"
                      onClick={() => { setSelectedSalesRep(rep); setSalesRepDialogOpen(true); }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-full bg-[#00897B]/20 flex items-center justify-center text-[#00897B] font-bold text-lg">
                            {rep.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-white font-medium">{rep.name}</p>
                            <p className="text-xs text-gray-400">{rep.province}</p>
                          </div>
                          <div className="ml-auto">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              rep.rank === 1 ? 'bg-amber-500 text-amber-900' :
                              rep.rank === 2 ? 'bg-gray-400 text-gray-900' :
                              rep.rank === 3 ? 'bg-amber-700 text-amber-100' :
                              'bg-gray-700 text-gray-300'
                            } text-sm font-bold`}>
                              {rep.rank}
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Monthly Target</span>
                            <span className="text-white">{rep.visitsThisMonth}/{rep.targetVisits}</span>
                          </div>
                          <Progress value={(rep.visitsThisMonth / rep.targetVisits) * 100} className="h-2 bg-gray-700" />
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="p-2 rounded bg-[#1E293B]">
                            <p className="text-white font-medium">{rep.dealsClosed}</p>
                            <p className="text-gray-400">deals</p>
                          </div>
                          <div className="p-2 rounded bg-[#1E293B]">
                            <p className="text-white font-medium">{formatCurrency(rep.revenueGenerated)}</p>
                            <p className="text-gray-400">revenue</p>
                          </div>
                          <div className="p-2 rounded bg-[#1E293B]">
                            <p className="text-white font-medium">{rep.completionRate}%</p>
                            <p className="text-gray-400">rate</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700 hover:bg-transparent">
                        <TableHead className="text-gray-400">Rep</TableHead>
                        <TableHead className="text-gray-400">Province</TableHead>
                        <TableHead className="text-gray-400">Visits</TableHead>
                        <TableHead className="text-gray-400">Target</TableHead>
                        <TableHead className="text-gray-400">Progress</TableHead>
                        <TableHead className="text-gray-400">Deals</TableHead>
                        <TableHead className="text-gray-400">Revenue</TableHead>
                        <TableHead className="text-gray-400">Rank</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesReps.map((rep) => (
                        <TableRow 
                          key={rep.id} 
                          className="border-gray-700 hover:bg-[#0F172A]/50 cursor-pointer"
                          onClick={() => { setSelectedSalesRep(rep); setSalesRepDialogOpen(true); }}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#00897B]/20 flex items-center justify-center text-[#00897B] font-bold text-sm">
                                {rep.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div>
                                <p className="text-white font-medium">{rep.name}</p>
                                <p className="text-xs text-gray-400">{rep.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-white">{rep.province}</TableCell>
                          <TableCell className="text-white">{rep.visitsThisMonth}</TableCell>
                          <TableCell className="text-white">{rep.targetVisits}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={(rep.visitsThisMonth / rep.targetVisits) * 100} className="h-2 w-20 bg-gray-700" />
                              <span className="text-xs text-gray-400">{Math.round((rep.visitsThisMonth / rep.targetVisits) * 100)}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-white">{rep.dealsClosed}</TableCell>
                          <TableCell className="text-white">{formatCurrency(rep.revenueGenerated)}</TableCell>
                          <TableCell>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              rep.rank === 1 ? 'bg-amber-500 text-amber-900' :
                              rep.rank === 2 ? 'bg-gray-400 text-gray-900' :
                              rep.rank === 3 ? 'bg-amber-700 text-amber-100' :
                              'bg-gray-700 text-gray-300'
                            }`}>
                              {rep.rank}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Visit Detail Dialog */}
      <Dialog open={visitDialogOpen} onOpenChange={setVisitDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1E293B] border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[#00897B]" />
              Visit Details
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedVisit?.customerName} - {selectedVisit?.customerAddress}
            </DialogDescription>
          </DialogHeader>

          {selectedVisit && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getTypeBadge(selectedVisit.visitType)}
                {getStatusBadge(selectedVisit.status)}
                {selectedVisit.outcome && getOutcomeBadge(selectedVisit.outcome)}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-[#0F172A] p-3 rounded-lg">
                  <p className="text-gray-400 text-xs">Sales Rep</p>
                  <p className="text-white font-medium">{selectedVisit.salesRepName}</p>
                </div>
                <div className="bg-[#0F172A] p-3 rounded-lg">
                  <p className="text-gray-400 text-xs">Scheduled</p>
                  <p className="text-white font-medium">{selectedVisit.plannedTime || 'TBD'}</p>
                </div>
                <div className="bg-[#0F172A] p-3 rounded-lg">
                  <p className="text-gray-400 text-xs">Purpose</p>
                  <p className="text-white font-medium capitalize">{selectedVisit.purpose.replace('_', ' ')}</p>
                </div>
                <div className="bg-[#0F172A] p-3 rounded-lg">
                  <p className="text-gray-400 text-xs">Duration</p>
                  <p className="text-white font-medium">{selectedVisit.durationMinutes || '—'} min</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-[#0F172A] p-4 rounded-lg">
                <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#00897B]" />
                  Customer Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400 text-xs">Name</p>
                    <p className="text-white">{selectedVisit.customerName}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Phone</p>
                    <p className="text-white">{selectedVisit.customerPhone || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Email</p>
                    <p className="text-white">{selectedVisit.customerEmail || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Address</p>
                    <p className="text-white">{selectedVisit.customerAddress || '—'}</p>
                  </div>
                </div>
              </div>

              {/* GPS Location */}
              {selectedVisit.checkInLat && selectedVisit.checkInLng && (
                <div className="bg-[#0F172A] p-4 rounded-lg">
                  <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-[#00897B]" />
                    GPS Location
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400 text-xs">Check-in</p>
                      <p className="text-white">{selectedVisit.checkInAt ? formatTime(selectedVisit.checkInAt) : '—'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Check-out</p>
                      <p className="text-white">{selectedVisit.checkOutAt ? formatTime(selectedVisit.checkOutAt) : '—'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Coordinates</p>
                      <p className="text-white text-xs font-mono">
                        {selectedVisit.checkInLat.toFixed(6)}, {selectedVisit.checkInLng.toFixed(6)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Address</p>
                      <p className="text-white text-xs">{selectedVisit.checkInAddress || '—'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedVisit.notes && (
                <div className="bg-[#0F172A] p-4 rounded-lg">
                  <h4 className="text-white font-medium mb-2">Notes</h4>
                  <p className="text-gray-300 text-sm">{selectedVisit.notes}</p>
                </div>
              )}

              {/* Follow-up */}
              {selectedVisit.followUpRequired && (
                <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-lg">
                  <h4 className="text-amber-400 font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Follow-up Required
                  </h4>
                  <p className="text-gray-300 text-sm">
                    Date: {selectedVisit.followUpDate ? formatDate(selectedVisit.followUpDate) : 'Not set'}
                  </p>
                  {selectedVisit.followUpNotes && (
                    <p className="text-gray-400 text-sm mt-1">{selectedVisit.followUpNotes}</p>
                  )}
                </div>
              )}

              <Separator className="bg-gray-700" />

              {/* Performance */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0F172A] p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-400">{formatCurrency(selectedVisit.revenueGenerated)}</p>
                  <p className="text-xs text-gray-400">Revenue Generated</p>
                </div>
                <div className="bg-[#0F172A] p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-[#00897B]">{selectedVisit.dealsClosed}</p>
                  <p className="text-xs text-gray-400">Deals Closed</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              className="border-gray-600 text-gray-300"
              onClick={() => setVisitDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sales Rep Detail Dialog */}
      <Dialog open={salesRepDialogOpen} onOpenChange={setSalesRepDialogOpen}>
        <DialogContent className="max-w-2xl bg-[#1E293B] border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-[#00897B]" />
              Sales Representative
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedSalesRep?.email}
            </DialogDescription>
          </DialogHeader>

          {selectedSalesRep && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#00897B]/20 flex items-center justify-center text-[#00897B] font-bold text-xl">
                  {selectedSalesRep.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedSalesRep.name}</h3>
                  <p className="text-gray-400">{selectedSalesRep.province}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`${selectedSalesRep.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                      {selectedSalesRep.status}
                    </Badge>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      selectedSalesRep.rank === 1 ? 'bg-amber-500 text-amber-900' :
                      selectedSalesRep.rank === 2 ? 'bg-gray-400 text-gray-900' :
                      selectedSalesRep.rank === 3 ? 'bg-amber-700 text-amber-100' :
                      'bg-gray-700 text-gray-300'
                    } text-sm font-bold`}>
                      #{selectedSalesRep.rank}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#0F172A] p-3 rounded-lg text-center">
                  <p className="text-xl font-bold text-white">{selectedSalesRep.visitsThisMonth}</p>
                  <p className="text-xs text-gray-400">Monthly Visits</p>
                </div>
                <div className="bg-[#0F172A] p-3 rounded-lg text-center">
                  <p className="text-xl font-bold text-white">{selectedSalesRep.dealsClosed}</p>
                  <p className="text-xs text-gray-400">Deals Closed</p>
                </div>
                <div className="bg-[#0F172A] p-3 rounded-lg text-center">
                  <p className="text-xl font-bold text-green-400">{formatCurrency(selectedSalesRep.revenueGenerated)}</p>
                  <p className="text-xs text-gray-400">Revenue</p>
                </div>
                <div className="bg-[#0F172A] p-3 rounded-lg text-center">
                  <p className="text-xl font-bold text-white">{selectedSalesRep.totalKm.toFixed(0)} km</p>
                  <p className="text-xs text-gray-400">Distance</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Monthly Target Progress</span>
                  <span className="text-white">{selectedSalesRep.visitsThisMonth}/{selectedSalesRep.targetVisits} ({selectedSalesRep.completionRate}%)</span>
                </div>
                <Progress value={(selectedSalesRep.visitsThisMonth / selectedSalesRep.targetVisits) * 100} className="h-3 bg-gray-700" />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-[#0F172A] p-3 rounded-lg">
                  <p className="text-gray-400 text-xs">Phone</p>
                  <p className="text-white">{selectedSalesRep.phone}</p>
                </div>
                <div className="bg-[#0F172A] p-3 rounded-lg">
                  <p className="text-gray-400 text-xs">Avg Duration</p>
                  <p className="text-white">{selectedSalesRep.avgDuration} min/visit</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              className="border-gray-600 text-gray-300"
              onClick={() => setSalesRepDialogOpen(false)}
            >
              Close
            </Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C] text-white">
              View Full Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Visit Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="max-w-md bg-[#1E293B] border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#00897B]" />
              Schedule New Visit
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Create a new visit for a sales representative
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Sales Representative</Label>
              <Select>
                <SelectTrigger className="bg-[#0F172A] border-gray-600 text-white">
                  <SelectValue placeholder="Select rep" />
                </SelectTrigger>
                <SelectContent>
                  {salesReps.map((rep) => (
                    <SelectItem key={rep.id} value={rep.id}>{rep.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Visit Type</Label>
              <Select>
                <SelectTrigger className="bg-[#0F172A] border-gray-600 text-white">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="demo">Demo</SelectItem>
                  <SelectItem value="follow_up">Follow Up</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Purpose</Label>
              <Select>
                <SelectTrigger className="bg-[#0F172A] border-gray-600 text-white">
                  <SelectValue placeholder="Select purpose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new_business">New Business</SelectItem>
                  <SelectItem value="account_management">Account Management</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="collection">Collection</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Date</Label>
                <Input type="date" className="bg-[#0F172A] border-gray-600 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Time</Label>
                <Input type="time" className="bg-[#0F172A] border-gray-600 text-white" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Customer Name</Label>
              <Input placeholder="Enter customer name" className="bg-[#0F172A] border-gray-600 text-white" />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Address</Label>
              <Input placeholder="Enter address" className="bg-[#0F172A] border-gray-600 text-white" />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Notes</Label>
              <Textarea 
                placeholder="Add notes..."
                className="bg-[#0F172A] border-gray-600 text-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              className="border-gray-600 text-gray-300"
              onClick={() => setScheduleDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C] text-white">
              <Plus className="h-4 w-4 mr-2" />
              Schedule Visit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
