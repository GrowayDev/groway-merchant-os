'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import {
  Circle,
  PiggyBank,
  Cloud,
  Mountain,
  Feather,
  Plus,
  Scale,
  Baby,
  ArrowRightLeft,
  Heart,
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  MapPin,
  Scale as WeightIcon,
  Syringe,
  Skull,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react'

// Custom species icons (using available lucide icons)
const CowIcon = Circle
const PigIcon = PiggyBank
const SheepIcon = Cloud
const GoatIcon = Mountain
const BirdIcon = Feather

// ============================================
// TYPES
// ============================================

interface SpeciesData {
  species: string
  count: number
  healthy: number
  sick: number
  quarantined: number
  recentAlerts: number
  color: string
}

interface HerdDistribution {
  classification: string
  count: number
  percentage: number
  color: string
}

interface LifecycleStage {
  stage: string
  count: number
  species: string
}

interface RecentActivity {
  id: string
  type: 'weight' | 'breeding' | 'health' | 'movement' | 'birth'
  title: string
  description: string
  timestamp: string
  icon: React.ReactNode
}

interface Alert {
  id: string
  type: 'birth' | 'vaccination' | 'underperforming' | 'mortality'
  title: string
  message: string
  severity: 'high' | 'medium' | 'low'
  dueDate?: string
  animalTag?: string
}

interface ProductionMetrics {
  totalAnimals: number
  bySpecies: { species: string; count: number }[]
  avgDailyGain: number | null
  breedingSuccessRate: number | null
  mortalityRate: number | null
}

interface LivestockDashboardProps {
  farmId: string
  subVerticalColor?: string
}

// ============================================
// SPECIES CONFIGURATION
// ============================================

const speciesConfig: Record<string, { name: string; icon: React.ElementType; color: string; bgColor: string }> = {
  cattle: { name: 'Cattle', icon: CowIcon, color: '#8B4513', bgColor: 'bg-amber-100' },
  pigs: { name: 'Pigs', icon: PigIcon, color: '#FF69B4', bgColor: 'bg-pink-100' },
  sheep: { name: 'Sheep', icon: SheepIcon, color: '#D2B48C', bgColor: 'bg-stone-100' },
  goats: { name: 'Goats', icon: GoatIcon, color: '#A0522D', bgColor: 'bg-orange-100' },
  poultry: { name: 'Poultry', icon: BirdIcon, color: '#FFD700', bgColor: 'bg-yellow-100' },
}

const classificationColors: Record<string, string> = {
  breeding: '#22c55e',
  commercial: '#3b82f6',
  replacement: '#f59e0b',
  cull: '#ef4444',
}

const chartConfig: ChartConfig = {
  breeding: { label: 'Breeding', color: '#22c55e' },
  commercial: { label: 'Commercial', color: '#3b82f6' },
  replacement: { label: 'Replacement', color: '#f59e0b' },
  cull: { label: 'Cull', color: '#ef4444' },
}

// ============================================
// MAIN COMPONENT
// ============================================

export function LivestockDashboard({ farmId }: LivestockDashboardProps) {
  // State
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [speciesData, setSpeciesData] = useState<SpeciesData[]>([])
  const [herdDistribution, setHerdDistribution] = useState<HerdDistribution[]>([])
  const [lifecycleStages, setLifecycleStages] = useState<LifecycleStage[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [metrics, setMetrics] = useState<ProductionMetrics | null>(null)

  // Dialog states
  const [addAnimalDialogOpen, setAddAnimalDialogOpen] = useState(false)
  const [recordWeightDialogOpen, setRecordWeightDialogOpen] = useState(false)
  const [recordBirthDialogOpen, setRecordBirthDialogOpen] = useState(false)
  const [recordMovementDialogOpen, setRecordMovementDialogOpen] = useState(false)
  const [recordHealthDialogOpen, setRecordHealthDialogOpen] = useState(false)

  // Form states
  const [submitting, setSubmitting] = useState(false)

  // Add Animal Form
  const [animalForm, setAnimalForm] = useState({
    animalType: 'cattle',
    breed: '',
    gender: 'female',
    identificationNumber: '',
    dateOfBirth: '',
    purpose: 'commercial',
    weightBirth: '',
    location: '',
  })

  // Weight Form
  const [weightForm, setWeightForm] = useState({
    animalId: '',
    weight: '',
    bodyConditionScore: '3',
    notes: '',
  })

  // Birth Form
  const [birthForm, setBirthForm] = useState({
    damId: '',
    sireId: '',
    offspringCount: '1',
    birthDate: '',
    complications: '',
  })

  // Movement Form
  const [movementForm, setMovementForm] = useState({
    animalId: '',
    movementType: 'transfer',
    fromLocation: '',
    toLocation: '',
    reason: '',
    permitNumber: '',
  })

  // Health Form
  const [healthForm, setHealthForm] = useState({
    animalId: '',
    recordType: 'checkup',
    description: '',
    treatment: '',
    medication: '',
    dosage: '',
    veterinarian: '',
  })

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      const sessionStr = localStorage.getItem('groway_session')
      const session = sessionStr ? JSON.parse(sessionStr) : null
      const merchantId = session?.merchantId || 'test-merchant'

      const response = await fetch(
        `/api/merchant-os/agriculture/livestock/dashboard?merchantId=${merchantId}&farmId=${farmId}`
      )

      if (response.ok) {
        const data = await response.json()
        setSpeciesData(data.speciesData || [])
        setHerdDistribution(data.herdDistribution || [])
        setLifecycleStages(data.lifecycleStages || [])
        setRecentActivity(data.recentActivity || [])
        setAlerts(data.alerts || [])
        setMetrics(data.metrics || null)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [farmId])

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true)
    fetchDashboardData()
  }

  // Handle form submissions
  const handleAddAnimal = async () => {
    setSubmitting(true)
    try {
      const sessionStr = localStorage.getItem('groway_session')
      const session = sessionStr ? JSON.parse(sessionStr) : null
      const merchantId = session?.merchantId || 'test-merchant'

      const response = await fetch(`/api/merchant-os/agriculture/livestock?merchantId=${merchantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...animalForm,
          farmId,
          weightBirth: animalForm.weightBirth ? parseFloat(animalForm.weightBirth) : null,
        }),
      })

      if (response.ok) {
        setAddAnimalDialogOpen(false)
        setAnimalForm({
          animalType: 'cattle',
          breed: '',
          gender: 'female',
          identificationNumber: '',
          dateOfBirth: '',
          purpose: 'commercial',
          weightBirth: '',
          location: '',
        })
        fetchDashboardData()
      }
    } catch (error) {
      console.error('Failed to add animal:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleRecordWeight = async () => {
    setSubmitting(true)
    try {
      const sessionStr = localStorage.getItem('groway_session')
      const session = sessionStr ? JSON.parse(sessionStr) : null
      const merchantId = session?.merchantId || 'test-merchant'

      const response = await fetch(`/api/merchant-os/agriculture/livestock/weight?merchantId=${merchantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...weightForm,
          weight: parseFloat(weightForm.weight),
          bodyConditionScore: parseInt(weightForm.bodyConditionScore),
        }),
      })

      if (response.ok) {
        setRecordWeightDialogOpen(false)
        setWeightForm({
          animalId: '',
          weight: '',
          bodyConditionScore: '3',
          notes: '',
        })
        fetchDashboardData()
      }
    } catch (error) {
      console.error('Failed to record weight:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleRecordBirth = async () => {
    setSubmitting(true)
    try {
      const sessionStr = localStorage.getItem('groway_session')
      const session = sessionStr ? JSON.parse(sessionStr) : null
      const merchantId = session?.merchantId || 'test-merchant'

      const response = await fetch(`/api/merchant-os/agriculture/livestock/breeding?merchantId=${merchantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...birthForm,
          offspringCount: parseInt(birthForm.offspringCount),
          actualBirthDate: birthForm.birthDate,
        }),
      })

      if (response.ok) {
        setRecordBirthDialogOpen(false)
        setBirthForm({
          damId: '',
          sireId: '',
          offspringCount: '1',
          birthDate: '',
          complications: '',
        })
        fetchDashboardData()
      }
    } catch (error) {
      console.error('Failed to record birth:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleRecordMovement = async () => {
    setSubmitting(true)
    try {
      const sessionStr = localStorage.getItem('groway_session')
      const session = sessionStr ? JSON.parse(sessionStr) : null
      const merchantId = session?.merchantId || 'test-merchant'

      const response = await fetch(`/api/merchant-os/agriculture/livestock/movement?merchantId=${merchantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movementForm),
      })

      if (response.ok) {
        setRecordMovementDialogOpen(false)
        setMovementForm({
          animalId: '',
          movementType: 'transfer',
          fromLocation: '',
          toLocation: '',
          reason: '',
          permitNumber: '',
        })
        fetchDashboardData()
      }
    } catch (error) {
      console.error('Failed to record movement:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleRecordHealth = async () => {
    setSubmitting(true)
    try {
      const sessionStr = localStorage.getItem('groway_session')
      const session = sessionStr ? JSON.parse(sessionStr) : null
      const merchantId = session?.merchantId || 'test-merchant'

      const response = await fetch(`/api/merchant-os/agriculture/livestock/health?merchantId=${merchantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(healthForm),
      })

      if (response.ok) {
        setRecordHealthDialogOpen(false)
        setHealthForm({
          animalId: '',
          recordType: 'checkup',
          description: '',
          treatment: '',
          medication: '',
          dosage: '',
          veterinarian: '',
        })
        fetchDashboardData()
      }
    } catch (error) {
      console.error('Failed to record health event:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Get severity badge
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge variant="destructive">High</Badge>
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>
      default:
        return <Badge variant="outline">Low</Badge>
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          <p className="text-gray-500">Loading livestock dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Livestock Dashboard</h1>
            <p className="text-sm text-gray-500">Monitor and manage your livestock operations</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-700"
              onClick={() => setAddAnimalDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Animal
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          {/* Species Overview Cards */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Species Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {Object.entries(speciesConfig).map(([key, config]) => {
                const data = speciesData.find(s => s.species === key) || {
                  species: key,
                  count: 0,
                  healthy: 0,
                  sick: 0,
                  quarantined: 0,
                  recentAlerts: 0,
                }
                const Icon = config.icon

                return (
                  <Card
                    key={key}
                    className="overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div
                      className="h-1"
                      style={{ backgroundColor: config.color }}
                    />
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.bgColor}`}
                        >
                          <Icon className="w-5 h-5" style={{ color: config.color }} />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">{config.name}</p>
                          <p className="text-2xl font-bold">{data.count}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Healthy
                          </span>
                          <span className="font-medium">{data.healthy}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-red-600 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Sick
                          </span>
                          <span className="font-medium">{data.sick}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-amber-600 flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            Quarantined
                          </span>
                          <span className="font-medium">{data.quarantined}</span>
                        </div>
                      </div>
                      {data.recentAlerts > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <Badge variant="outline" className="text-xs">
                            {data.recentAlerts} recent alert{data.recentAlerts > 1 ? 's' : ''}
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </section>

          {/* Quick Actions & Alerts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
                <CardDescription>Record common livestock events</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-auto py-3 flex flex-col gap-1"
                  onClick={() => setAddAnimalDialogOpen(true)}
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-xs">Add Animal</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-3 flex flex-col gap-1"
                  onClick={() => setRecordWeightDialogOpen(true)}
                >
                  <Scale className="w-5 h-5" />
                  <span className="text-xs">Record Weight</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-3 flex flex-col gap-1"
                  onClick={() => setRecordBirthDialogOpen(true)}
                >
                  <Baby className="w-5 h-5" />
                  <span className="text-xs">Record Birth</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-3 flex flex-col gap-1"
                  onClick={() => setRecordMovementDialogOpen(true)}
                >
                  <ArrowRightLeft className="w-5 h-5" />
                  <span className="text-xs">Record Movement</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-3 flex flex-col gap-1 col-span-2"
                  onClick={() => setRecordHealthDialogOpen(true)}
                >
                  <Heart className="w-5 h-5" />
                  <span className="text-xs">Record Health Event</span>
                </Button>
              </CardContent>
            </Card>

            {/* Alerts Widget */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    Alerts & Reminders
                  </CardTitle>
                  <Badge variant="secondary">{alerts.length} active</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No active alerts</p>
                    <p className="text-sm">All systems are running smoothly</p>
                  </div>
                ) : (
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {alerts.map((alert) => (
                        <div
                          key={alert.id}
                          className="flex items-start gap-3 p-3 rounded-lg border bg-gray-50"
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              alert.type === 'birth'
                                ? 'bg-pink-100'
                                : alert.type === 'vaccination'
                                ? 'bg-blue-100'
                                : alert.type === 'underperforming'
                                ? 'bg-amber-100'
                                : 'bg-red-100'
                            }`}
                          >
                            {alert.type === 'birth' && <Baby className="w-4 h-4 text-pink-600" />}
                            {alert.type === 'vaccination' && <Syringe className="w-4 h-4 text-blue-600" />}
                            {alert.type === 'underperforming' && <TrendingDown className="w-4 h-4 text-amber-600" />}
                            {alert.type === 'mortality' && <Skull className="w-4 h-4 text-red-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium text-sm truncate">{alert.title}</p>
                              {getSeverityBadge(alert.severity)}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{alert.message}</p>
                            {alert.dueDate && (
                              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Due: {new Date(alert.dueDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Herd Structure & Activity Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Herd Structure Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Herd Structure</CardTitle>
                <CardDescription>Distribution by classification</CardDescription>
              </CardHeader>
              <CardContent>
                {herdDistribution.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No herd data available</p>
                    <p className="text-sm">Add animals to see distribution</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-6">
                    <ChartContainer config={chartConfig} className="h-48 w-48">
                      <PieChart>
                        <Pie
                          data={herdDistribution}
                          dataKey="count"
                          nameKey="classification"
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={2}
                        >
                          {herdDistribution.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={classificationColors[entry.classification] || '#888'}
                            />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ChartContainer>
                    <div className="flex-1 space-y-3">
                      {herdDistribution.map((item) => (
                        <div key={item.classification} className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: classificationColors[item.classification] }}
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm capitalize">{item.classification}</span>
                              <span className="text-sm font-medium">{item.count}</span>
                            </div>
                            <Progress value={item.percentage} className="h-1 mt-1" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity Feed */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <CardDescription>Latest livestock events</CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No recent activity</p>
                    <p className="text-sm">Events will appear here as they occur</p>
                  </div>
                ) : (
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {recentActivity.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-start gap-3 p-3 rounded-lg border"
                        >
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                            {activity.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{activity.title}</p>
                            <p className="text-xs text-gray-500">{activity.description}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(activity.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Production Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Production Metrics</CardTitle>
              <CardDescription>Key performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-500 mb-1">Total Animals</p>
                    <p className="text-3xl font-bold">{metrics.totalAnimals}</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-500 mb-1">Avg Daily Gain</p>
                    <p className="text-3xl font-bold">
                      {metrics.avgDailyGain !== null ? `${metrics.avgDailyGain.toFixed(2)} kg` : 'N/A'}
                    </p>
                    {metrics.avgDailyGain !== null && (
                      <p className="text-xs text-gray-400">per day</p>
                    )}
                  </div>
                  <div className="text-center p-4 rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-500 mb-1">Breeding Success</p>
                    <p className="text-3xl font-bold">
                      {metrics.breedingSuccessRate !== null
                        ? `${metrics.breedingSuccessRate.toFixed(1)}%`
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-500 mb-1">Mortality Rate</p>
                    <p className={`text-3xl font-bold ${metrics.mortalityRate && metrics.mortalityRate > 5 ? 'text-red-600' : ''}`}>
                      {metrics.mortalityRate !== null
                        ? `${metrics.mortalityRate.toFixed(1)}%`
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No metrics available</p>
                  <p className="text-sm">Add animals and record events to see metrics</p>
                </div>
              )}

              {/* Species breakdown chart */}
              {metrics && metrics.bySpecies.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Animals by Species</h4>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metrics.bySpecies}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="species" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="count" fill="#8B4513" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ============================================ */}
      {/* DIALOGS */}
      {/* ============================================ */}

      {/* Add Animal Dialog */}
      <Dialog open={addAnimalDialogOpen} onOpenChange={setAddAnimalDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Animal</DialogTitle>
            <DialogDescription>Register a new animal in your livestock inventory</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="animalType">Species</Label>
              <Select
                value={animalForm.animalType}
                onValueChange={(value) => setAnimalForm({ ...animalForm, animalType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select species" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(speciesConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="breed">Breed</Label>
              <Input
                id="breed"
                placeholder="e.g., Brahman, Duroc, Merino"
                value={animalForm.breed}
                onChange={(e) => setAnimalForm({ ...animalForm, breed: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={animalForm.gender}
                  onValueChange={(value) => setAnimalForm({ ...animalForm, gender: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose</Label>
                <Select
                  value={animalForm.purpose}
                  onValueChange={(value) => setAnimalForm({ ...animalForm, purpose: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breeding">Breeding</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="replacement">Replacement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="identificationNumber">Tag/ID Number</Label>
              <Input
                id="identificationNumber"
                placeholder="e.g., C001, P123"
                value={animalForm.identificationNumber}
                onChange={(e) => setAnimalForm({ ...animalForm, identificationNumber: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={animalForm.dateOfBirth}
                  onChange={(e) => setAnimalForm({ ...animalForm, dateOfBirth: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weightBirth">Birth Weight (kg)</Label>
                <Input
                  id="weightBirth"
                  type="number"
                  placeholder="e.g., 35"
                  value={animalForm.weightBirth}
                  onChange={(e) => setAnimalForm({ ...animalForm, weightBirth: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location/Camp</Label>
              <Input
                id="location"
                placeholder="e.g., Camp A, North Pasture"
                value={animalForm.location}
                onChange={(e) => setAnimalForm({ ...animalForm, location: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddAnimalDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddAnimal}
              disabled={submitting || !animalForm.identificationNumber}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Animal'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Weight Dialog */}
      <Dialog open={recordWeightDialogOpen} onOpenChange={setRecordWeightDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Weight</DialogTitle>
            <DialogDescription>Record a weight measurement for an animal</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="weightAnimalId">Animal ID / Tag Number</Label>
              <Input
                id="weightAnimalId"
                placeholder="e.g., C001"
                value={weightForm.animalId}
                onChange={(e) => setWeightForm({ ...weightForm, animalId: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="e.g., 450"
                  value={weightForm.weight}
                  onChange={(e) => setWeightForm({ ...weightForm, weight: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bcs">Body Condition Score (1-5)</Label>
                <Select
                  value={weightForm.bodyConditionScore}
                  onValueChange={(value) => setWeightForm({ ...weightForm, bodyConditionScore: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((score) => (
                      <SelectItem key={score} value={score.toString()}>
                        {score} {score === 1 ? '(Very Thin)' : score === 3 ? '(Ideal)' : score === 5 ? '(Obese)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="weightNotes">Notes</Label>
              <Textarea
                id="weightNotes"
                placeholder="Any observations or notes..."
                value={weightForm.notes}
                onChange={(e) => setWeightForm({ ...weightForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecordWeightDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRecordWeight}
              disabled={submitting || !weightForm.animalId || !weightForm.weight}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Recording...
                </>
              ) : (
                'Record Weight'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Birth Dialog */}
      <Dialog open={recordBirthDialogOpen} onOpenChange={setRecordBirthDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Birth</DialogTitle>
            <DialogDescription>Record a birthing event and offspring details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="damId">Dam (Mother) ID</Label>
                <Input
                  id="damId"
                  placeholder="e.g., C001"
                  value={birthForm.damId}
                  onChange={(e) => setBirthForm({ ...birthForm, damId: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sireId">Sire (Father) ID</Label>
                <Input
                  id="sireId"
                  placeholder="e.g., C050"
                  value={birthForm.sireId}
                  onChange={(e) => setBirthForm({ ...birthForm, sireId: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birthDate">Birth Date</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={birthForm.birthDate}
                  onChange={(e) => setBirthForm({ ...birthForm, birthDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="offspringCount">Number of Offspring</Label>
                <Input
                  id="offspringCount"
                  type="number"
                  min="1"
                  value={birthForm.offspringCount}
                  onChange={(e) => setBirthForm({ ...birthForm, offspringCount: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="complications">Complications</Label>
              <Textarea
                id="complications"
                placeholder="Any birthing complications or notes..."
                value={birthForm.complications}
                onChange={(e) => setBirthForm({ ...birthForm, complications: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecordBirthDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRecordBirth}
              disabled={submitting || !birthForm.damId || !birthForm.birthDate}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Recording...
                </>
              ) : (
                'Record Birth'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Movement Dialog */}
      <Dialog open={recordMovementDialogOpen} onOpenChange={setRecordMovementDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Movement</DialogTitle>
            <DialogDescription>Record an animal movement or transfer</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="movementAnimalId">Animal ID</Label>
                <Input
                  id="movementAnimalId"
                  placeholder="e.g., C001"
                  value={movementForm.animalId}
                  onChange={(e) => setMovementForm({ ...movementForm, animalId: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="movementType">Movement Type</Label>
                <Select
                  value={movementForm.movementType}
                  onValueChange={(value) => setMovementForm({ ...movementForm, movementType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transfer">Camp Transfer</SelectItem>
                    <SelectItem value="purchase">Purchase/Intake</SelectItem>
                    <SelectItem value="sale">Sale</SelectItem>
                    <SelectItem value="death">Death</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fromLocation">From Location</Label>
                <Input
                  id="fromLocation"
                  placeholder="e.g., Camp A"
                  value={movementForm.fromLocation}
                  onChange={(e) => setMovementForm({ ...movementForm, fromLocation: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="toLocation">To Location</Label>
                <Input
                  id="toLocation"
                  placeholder="e.g., Camp B"
                  value={movementForm.toLocation}
                  onChange={(e) => setMovementForm({ ...movementForm, toLocation: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="permitNumber">Permit Number</Label>
                <Input
                  id="permitNumber"
                  placeholder="If applicable"
                  value={movementForm.permitNumber}
                  onChange={(e) => setMovementForm({ ...movementForm, permitNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Input
                  id="reason"
                  placeholder="e.g., Grazing rotation"
                  value={movementForm.reason}
                  onChange={(e) => setMovementForm({ ...movementForm, reason: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecordMovementDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRecordMovement}
              disabled={submitting || !movementForm.animalId}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Recording...
                </>
              ) : (
                'Record Movement'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Health Event Dialog */}
      <Dialog open={recordHealthDialogOpen} onOpenChange={setRecordHealthDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Health Event</DialogTitle>
            <DialogDescription>Record a health checkup, treatment, or vaccination</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="healthAnimalId">Animal ID</Label>
                <Input
                  id="healthAnimalId"
                  placeholder="e.g., C001"
                  value={healthForm.animalId}
                  onChange={(e) => setHealthForm({ ...healthForm, animalId: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recordType">Event Type</Label>
                <Select
                  value={healthForm.recordType}
                  onValueChange={(value) => setHealthForm({ ...healthForm, recordType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checkup">Health Checkup</SelectItem>
                    <SelectItem value="vaccination">Vaccination</SelectItem>
                    <SelectItem value="treatment">Treatment</SelectItem>
                    <SelectItem value="illness">Illness Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the health event..."
                value={healthForm.description}
                onChange={(e) => setHealthForm({ ...healthForm, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="medication">Medication</Label>
                <Input
                  id="medication"
                  placeholder="e.g., Antibiotics"
                  value={healthForm.medication}
                  onChange={(e) => setHealthForm({ ...healthForm, medication: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dosage">Dosage</Label>
                <Input
                  id="dosage"
                  placeholder="e.g., 10ml"
                  value={healthForm.dosage}
                  onChange={(e) => setHealthForm({ ...healthForm, dosage: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="veterinarian">Veterinarian</Label>
              <Input
                id="veterinarian"
                placeholder="Name of attending vet"
                value={healthForm.veterinarian}
                onChange={(e) => setHealthForm({ ...healthForm, veterinarian: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecordHealthDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRecordHealth}
              disabled={submitting || !healthForm.animalId || !healthForm.description}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Recording...
                </>
              ) : (
                'Record Event'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default LivestockDashboard
