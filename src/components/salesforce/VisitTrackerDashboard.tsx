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
  BarChart3
} from 'lucide-react'

// Types
interface Visit {
  id: string
  type: string
  status: string
  leadId?: string
  merchantId?: string
  schedule: {
    scheduledAt: Date
    completedAt?: Date
    cancelledAt?: Date
  }
  location: {
    address: string
    latitude?: number
    longitude?: number
  }
  checkIn?: {
    at?: Date
    latitude?: number
    longitude?: number
    photo?: string
    checkOutAt?: Date
  }
  outcome?: {
    result?: string
    notes?: string
    nextAction?: string
    nextActionDate?: Date
  }
  demo?: {
    completed: boolean
    duration?: number
    features?: string[]
  }
  cancelReason?: string
}

interface Agent {
  id: string
  name: string
  visitsThisMonth: number
  targetVisits: number
  completionRate: number
  rank: number
  totalKm: number
  avgDuration: number
}

interface LeaderboardEntry {
  rank: number
  agentId: string
  agentName: string
  visits: number
  conversions: number
  score: number
  avatar?: string
}

export default function SalesforceVisitTracker() {
  const [activeTab, setActiveTab] = useState('today')
  const [loading, setLoading] = useState(true)
  const [visits, setVisits] = useState<Visit[]>([])
  const [todayVisits, setTodayVisits] = useState<Visit[]>([])
  const [upcomingVisits, setUpcomingVisits] = useState<Visit[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null)
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false)
  const [visitDialogOpen, setVisitDialogOpen] = useState(false)
  const [checkingIn, setCheckingIn] = useState(false)
  
  // GPS state
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [gettingLocation, setGettingLocation] = useState(false)
  
  // Check-in form
  const [checkInNotes, setCheckInNotes] = useState('')
  const [visitOutcome, setVisitOutcome] = useState('')
  const [nextAction, setNextAction] = useState('')
  
  // Agent stats
  const [agent, setAgent] = useState<Agent>({
    id: 'sales-demo-001',
    name: 'Thabo Molefe',
    visitsThisMonth: 23,
    targetVisits: 40,
    completionRate: 87,
    rank: 3,
    totalKm: 456.8,
    avgDuration: 45
  })

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/salesforce/visits')
      if (response.ok) {
        const data = await response.json()
        setVisits(data.data || [])
        
        // Filter today's visits
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayEnd = new Date(today)
        todayEnd.setHours(23, 59, 59, 999)
        
        const todayV = (data.data || []).filter((v: Visit) => {
          const schedDate = new Date(v.schedule.scheduledAt)
          return schedDate >= today && schedDate <= todayEnd
        })
        setTodayVisits(todayV)
        
        // Upcoming visits
        const upcoming = (data.data || []).filter((v: Visit) => 
          v.status === 'scheduled' && new Date(v.schedule.scheduledAt) > new Date()
        )
        setUpcomingVisits(upcoming)
      }
      
      // Mock leaderboard
      setLeaderboard([
        { rank: 1, agentId: 's-001', agentName: 'Nomsa Dlamini', visits: 38, conversions: 12, score: 152 },
        { rank: 2, agentId: 's-002', agentName: 'Johan van der Berg', visits: 35, conversions: 10, score: 140 },
        { rank: 3, agentId: 'sales-demo-001', agentName: 'Thabo Molefe', visits: 23, conversions: 8, score: 92 },
        { rank: 4, agentId: 's-003', agentName: 'Priya Naidoo', visits: 28, conversions: 6, score: 84 },
        { rank: 5, agentId: 's-004', agentName: 'Sipho Zulu', visits: 25, conversions: 5, score: 75 }
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }, [])

  // Get current location
  const getCurrentLocation = async () => {
    setGettingLocation(true)
    try {
      if (navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000
          })
        })
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
        toast.success('Location acquired')
      } else {
        // Use mock location for demo
        setCurrentLocation({ lat: -25.7461, lng: 28.2181 })
        toast.info('Using demo location')
      }
    } catch {
      // Use mock location
      setCurrentLocation({ lat: -25.7461, lng: 28.2181 })
      toast.info('Using demo location')
    }
    setGettingLocation(false)
  }

  // Check-in to visit
  const handleCheckIn = async () => {
    if (!selectedVisit || !currentLocation) {
      toast.error('Please get your location first')
      return
    }
    
    setCheckingIn(true)
    try {
      const response = await fetch('/api/salesforce/visits', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitId: selectedVisit.id,
          action: 'check_in',
          data: {
            latitude: currentLocation.lat,
            longitude: currentLocation.lng
          }
        })
      })
      
      if (response.ok) {
        toast.success('Check-in successful!')
        setCheckInDialogOpen(false)
        fetchData()
      }
    } catch {
      toast.error('Check-in failed')
    }
    setCheckingIn(false)
  }

  // Complete visit
  const handleCompleteVisit = async () => {
    if (!selectedVisit) return
    
    setCheckingIn(true)
    try {
      const response = await fetch('/api/salesforce/visits', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitId: selectedVisit.id,
          action: 'complete',
          data: {
            outcome: visitOutcome,
            notes: checkInNotes,
            nextAction
          }
        })
      })
      
      if (response.ok) {
        toast.success('Visit completed!')
        setVisitDialogOpen(false)
        setCheckInNotes('')
        setVisitOutcome('')
        setNextAction('')
        fetchData()
        
        // Update agent stats
        setAgent(prev => ({
          ...prev,
          visitsThisMonth: prev.visitsThisMonth + 1
        }))
      }
    } catch {
      toast.error('Failed to complete visit')
    }
    setCheckingIn(false)
  }

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await fetchData()
      setLoading(false)
    }
    loadData()
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

  // Get status badge
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      in_progress: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      completed: 'bg-green-500/20 text-green-400 border-green-500/30',
      cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
      no_show: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
    return <Badge className={`${styles[status] || 'bg-gray-500/20 text-gray-400'} border capitalize`}>
      {status.replace('_', ' ')}
    </Badge>
  }

  // Get visit type badge
  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      prospecting: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      demo: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      follow_up: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      training: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      closing: 'bg-green-500/20 text-green-400 border-green-500/30'
    }
    return <Badge className={`${styles[type] || 'bg-gray-500/20 text-gray-400'} border capitalize`}>
      {type.replace('_', ' ')}
    </Badge>
  }

  // Calculate progress
  const progressPercentage = Math.round((agent.visitsThisMonth / agent.targetVisits) * 100)

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
            <MapPin className="h-6 w-6 text-[#00897B]" />
            Visit Tracker
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            GPS check-in, route optimization, and performance tracking
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
            onClick={getCurrentLocation}
            disabled={gettingLocation}
          >
            {gettingLocation ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Navigation className="h-4 w-4 mr-2" />}
            {currentLocation ? 'Update Location' : 'Get Location'}
          </Button>
          <Button 
            size="sm"
            className="bg-[#00897B] hover:bg-[#00695C] text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Visit
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[#1E293B] border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#00897B]/20 text-[#00897B]">
                <Target className="h-5 w-5" />
              </div>
              <Trophy className="h-4 w-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-white">{agent.visitsThisMonth}/{agent.targetVisits}</p>
            <p className="text-xs text-gray-400">Monthly Target</p>
            <Progress value={progressPercentage} className="h-1 mt-2 bg-gray-700" />
          </CardContent>
        </Card>
        
        <Card className="bg-[#1E293B] border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-500/20 text-green-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{agent.completionRate}%</p>
            <p className="text-xs text-gray-400">Completion Rate</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1E293B] border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-500/20 text-blue-400">
                <Car className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{agent.totalKm} km</p>
            <p className="text-xs text-gray-400">Distance Traveled</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1E293B] border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-500/20 text-purple-400">
                <Timer className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{agent.avgDuration} min</p>
            <p className="text-xs text-gray-400">Avg Visit Duration</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Visits */}
        <div className="lg:col-span-2 space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-[#1E293B] border border-gray-700 grid grid-cols-3 w-full max-w-md">
              <TabsTrigger value="today" className="data-[state=active]:bg-[#00897B]">
                <Calendar className="h-4 w-4 mr-2" />
                Today
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="data-[state=active]:bg-[#00897B]">
                <Clock className="h-4 w-4 mr-2" />
                Upcoming
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-[#00897B]">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                History
              </TabsTrigger>
            </TabsList>

            {/* Today's Visits */}
            <TabsContent value="today" className="mt-4">
              <Card className="bg-[#1E293B] border-gray-700">
                <CardContent className="p-4">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {todayVisits.length > 0 ? todayVisits.map((visit) => (
                        <div 
                          key={visit.id}
                          className="p-4 rounded-lg bg-[#0F172A] border border-gray-700/50 cursor-pointer hover:border-gray-600"
                          onClick={() => { setSelectedVisit(visit); setVisitDialogOpen(true); }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#00897B]/20 text-[#00897B]">
                                {visit.type === 'demo' ? <Zap className="h-5 w-5" /> : 
                                 visit.type === 'closing' ? <Award className="h-5 w-5" /> :
                                 <MapPin className="h-5 w-5" />}
                              </div>
                              <div>
                                <p className="text-white font-medium">{formatTime(visit.schedule.scheduledAt)}</p>
                                <p className="text-xs text-gray-400">{visit.location.address}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getTypeBadge(visit.type)}
                              {getStatusBadge(visit.status)}
                            </div>
                          </div>
                          
                          {visit.status === 'scheduled' && (
                            <Button 
                              size="sm"
                              className="w-full bg-[#00897B] hover:bg-[#00695C] text-white"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedVisit(visit)
                                setCheckInDialogOpen(true)
                              }}
                            >
                              <Navigation className="h-4 w-4 mr-2" />
                              Check In
                            </Button>
                          )}
                          
                          {visit.status === 'in_progress' && (
                            <Button 
                              size="sm"
                              className="w-full bg-green-600 hover:bg-green-700 text-white"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedVisit(visit)
                                setVisitDialogOpen(true)
                              }}
                            >
                              <Flag className="h-4 w-4 mr-2" />
                              Complete Visit
                            </Button>
                          )}
                        </div>
                      )) : (
                        <div className="text-center py-8 text-gray-400">
                          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No visits scheduled for today</p>
                          <Button size="sm" className="mt-4 bg-[#00897B] hover:bg-[#00695C] text-white">
                            Schedule a Visit
                          </Button>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Upcoming Visits */}
            <TabsContent value="upcoming" className="mt-4">
              <Card className="bg-[#1E293B] border-gray-700">
                <CardContent className="p-4">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {upcomingVisits.map((visit) => (
                        <div 
                          key={visit.id}
                          className="p-4 rounded-lg bg-[#0F172A] border border-gray-700/50"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-white font-medium">{formatDate(visit.schedule.scheduledAt)}</p>
                              <p className="text-xs text-gray-400">{formatTime(visit.schedule.scheduledAt)} - {visit.location.address}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {getTypeBadge(visit.type)}
                              {getStatusBadge(visit.status)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* History */}
            <TabsContent value="history" className="mt-4">
              <Card className="bg-[#1E293B] border-gray-700">
                <CardContent className="p-4">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {visits.filter(v => v.status === 'completed' || v.status === 'cancelled').map((visit) => (
                        <div 
                          key={visit.id}
                          className="p-4 rounded-lg bg-[#0F172A] border border-gray-700/50"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-white font-medium">{formatDate(visit.schedule.scheduledAt)}</p>
                              <p className="text-xs text-gray-400">{visit.location.address}</p>
                              {visit.outcome?.result && (
                                <p className="text-xs text-gray-500 mt-1">Outcome: {visit.outcome.result}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {getTypeBadge(visit.type)}
                              {getStatusBadge(visit.status)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Route Optimization */}
          <Card className="bg-[#1E293B] border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Route className="h-4 w-4 text-[#00897B]" />
                Optimized Route
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todayVisits.slice(0, 4).map((visit, index) => (
                  <div key={visit.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#00897B] flex items-center justify-center text-white text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm">{visit.location.address}</p>
                      <p className="text-xs text-gray-400">{formatTime(visit.schedule.scheduledAt)}</p>
                    </div>
                    {index < todayVisits.length - 1 && (
                      <div className="text-xs text-gray-500">
                        {Math.round(Math.random() * 20 + 5)} km
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <Button className="w-full mt-4 bg-[#00897B] hover:bg-[#00695C] text-white">
                <Navigation className="h-4 w-4 mr-2" />
                Start Navigation
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Leaderboard & Stats */}
        <div className="space-y-4">
          {/* Leaderboard */}
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
                    key={entry.agentId}
                    className={`flex items-center gap-3 p-2 rounded-lg ${
                      entry.agentId === agent.id 
                        ? 'bg-[#00897B]/20 border border-[#00897B]/30' 
                        : 'bg-[#0F172A]'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      entry.rank === 1 ? 'bg-amber-500 text-amber-900' :
                      entry.rank === 2 ? 'bg-gray-400 text-gray-900' :
                      entry.rank === 3 ? 'bg-amber-700 text-amber-100' :
                      'bg-gray-700 text-gray-300'
                    }`}>
                      {entry.rank}
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm">{entry.agentName}</p>
                      <p className="text-xs text-gray-400">{entry.visits} visits • {entry.conversions} conversions</p>
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

          {/* Performance Chart */}
          <Card className="bg-[#1E293B] border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#00897B]" />
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                  const visits = Math.floor(Math.random() * 5) + 1
                  return (
                    <div key={day} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-8">{day}</span>
                      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#00897B] rounded-full"
                          style={{ width: `${visits * 20}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-6">{visits}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Current Location */}
          <Card className="bg-[#1E293B] border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-500/20 text-green-400">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-white font-medium">Current Location</p>
                  <p className="text-xs text-gray-400">
                    {currentLocation 
                      ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`
                      : 'Not detected'}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full border-gray-600 text-gray-300"
                onClick={getCurrentLocation}
                disabled={gettingLocation}
              >
                {gettingLocation ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Navigation className="h-4 w-4 mr-2" />}
                Update Location
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Check-in Dialog */}
      <Dialog open={checkInDialogOpen} onOpenChange={setCheckInDialogOpen}>
        <DialogContent className="max-w-md bg-[#1E293B] border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[#00897B]" />
              Check In
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedVisit?.location.address}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* GPS Status */}
            <div className={`p-4 rounded-lg ${currentLocation ? 'bg-green-500/10 border border-green-500/30' : 'bg-amber-500/10 border border-amber-500/30'}`}>
              <div className="flex items-center gap-2">
                {currentLocation ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                    <span className="text-green-400">GPS Location Ready</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                    <span className="text-amber-400">GPS Location Required</span>
                  </>
                )}
              </div>
              {currentLocation && (
                <p className="text-xs text-gray-400 mt-2">
                  {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                </p>
              )}
            </div>

            {/* Photo option */}
            <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-600 rounded-lg">
              <Button variant="outline" className="border-gray-600 text-gray-300">
                <Camera className="h-4 w-4 mr-2" />
                Take Photo (Optional)
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              className="border-gray-600 text-gray-300"
              onClick={() => setCheckInDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              className="bg-[#00897B] hover:bg-[#00695C] text-white"
              onClick={handleCheckIn}
              disabled={checkingIn || !currentLocation}
            >
              {checkingIn ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Confirm Check-in
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Visit Detail Dialog */}
      <Dialog open={visitDialogOpen} onOpenChange={setVisitDialogOpen}>
        <DialogContent className="max-w-lg bg-[#1E293B] border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#00897B]" />
              Visit Details
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedVisit?.location.address}
            </DialogDescription>
          </DialogHeader>

          {selectedVisit && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getTypeBadge(selectedVisit.type)}
                {getStatusBadge(selectedVisit.status)}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-[#0F172A] p-3 rounded-lg">
                  <p className="text-gray-400">Scheduled</p>
                  <p className="text-white">{formatTime(selectedVisit.schedule.scheduledAt)}</p>
                </div>
                <div className="bg-[#0F172A] p-3 rounded-lg">
                  <p className="text-gray-400">Duration</p>
                  <p className="text-white">{selectedVisit.demo?.duration || '45'} min</p>
                </div>
              </div>

              {selectedVisit.status === 'in_progress' && (
                <>
                  <Separator className="bg-gray-700" />
                  
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-gray-300">Visit Outcome</Label>
                      <Select value={visitOutcome} onValueChange={setVisitOutcome}>
                        <SelectTrigger className="bg-[#0F172A] border-gray-600 text-white">
                          <SelectValue placeholder="Select outcome" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="converted">Converted - Sale Made</SelectItem>
                          <SelectItem value="interested">Interested - Follow Up</SelectItem>
                          <SelectItem value="demo_completed">Demo Completed</SelectItem>
                          <SelectItem value="not_interested">Not Interested</SelectItem>
                          <SelectItem value="follow_up">Needs Follow Up</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-300">Notes</Label>
                      <Textarea
                        value={checkInNotes}
                        onChange={(e) => setCheckInNotes(e.target.value)}
                        placeholder="Add visit notes..."
                        className="bg-[#0F172A] border-gray-600 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-300">Next Action</Label>
                      <Input
                        value={nextAction}
                        onChange={(e) => setNextAction(e.target.value)}
                        placeholder="e.g., Schedule follow-up call"
                        className="bg-[#0F172A] border-gray-600 text-white"
                      />
                    </div>
                  </div>
                </>
              )}
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
            {selectedVisit?.status === 'in_progress' && (
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleCompleteVisit}
                disabled={checkingIn}
              >
                {checkingIn ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Flag className="h-4 w-4 mr-2" />}
                Complete Visit
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
