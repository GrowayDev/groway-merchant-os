'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import {
  MapPin,
  RotateCcw,
  Leaf,
  Calendar,
  Plus,
  Loader2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  TrendingUp,
  Users,
  Mountain,
  Sprout,
  Target,
  Edit,
  Trash2,
} from 'lucide-react'

// ============================================
// TYPES
// ============================================

interface Camp {
  id: string
  code: string
  name: string
  type: 'CAMP' | 'PEN' | 'PADDOCK' | 'KRAAL'
  section?: string
  areaHectares?: number
  capacity: number
  currentOccupancy: number
  status: 'ACTIVE' | 'RESTING' | 'MAINTENANCE' | 'INACTIVE'
  grassCondition?: number
  lastAssessmentDate?: string
  grazingDaysRemaining?: number
  biomassEstimate?: number
  lastRotatedAt?: string
  rotationHistory: RotationEvent[]
}

interface RotationEvent {
  id: string
  fromCampId: string
  fromCampName: string
  toCampId: string
  toCampName: string
  animalCount: number
  species: string
  rotatedAt: string
  reason?: string
  grassConditionBefore?: number
  grassConditionAfter?: number
}

interface RotationPlan {
  id: string
  name: string
  species: string
  animalCount: number
  currentCampId: string
  currentCampName: string
  nextCampId?: string
  nextCampName?: string
  rotationDate: string
  daysUntilRotation: number
  status: 'ON_SCHEDULE' | 'DUE_NOW' | 'OVERDUE'
}

interface GrassAssessment {
  campId: string
  campName: string
  assessmentDate: string
  grassCondition: number
  biomassEstimate: number
  grazingCapacity: number
  recommendedRest: number
  notes?: string
}

interface CampRotationPlannerProps {
  farmId: string
}

const chartConfig: ChartConfig = {
  occupancy: { label: 'Occupancy', color: '#8B4513' },
  capacity: { label: 'Capacity', color: '#22c55e' },
  condition: { label: 'Condition', color: '#3b82f6' },
}

const campTypeColors: Record<string, string> = {
  CAMP: 'bg-green-100 text-green-800',
  PEN: 'bg-blue-100 text-blue-800',
  PADDOCK: 'bg-amber-100 text-amber-800',
  KRAAL: 'bg-purple-100 text-purple-800',
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-500',
  RESTING: 'bg-amber-500',
  MAINTENANCE: 'bg-red-500',
  INACTIVE: 'bg-gray-400',
}

const grassConditionColors: Record<string, string> = {
  excellent: 'text-green-600 bg-green-100',
  good: 'text-lime-600 bg-lime-100',
  fair: 'text-amber-600 bg-amber-100',
  poor: 'text-orange-600 bg-orange-100',
  critical: 'text-red-600 bg-red-100',
}

// ============================================
// MAIN COMPONENT
// ============================================

export function CampRotationPlanner({ farmId }: CampRotationPlannerProps) {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [camps, setCamps] = useState<Camp[]>([])
  const [rotationPlans, setRotationPlans] = useState<RotationPlan[]>([])
  const [rotationHistory, setRotationHistory] = useState<RotationEvent[]>([])
  const [selectedCamp, setSelectedCamp] = useState<Camp | null>(null)

  // Dialog states
  const [addCampDialogOpen, setAddCampDialogOpen] = useState(false)
  const [rotateDialogOpen, setRotateDialogOpen] = useState(false)
  const [assessmentDialogOpen, setAssessmentDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form states
  const [campForm, setCampForm] = useState({
    code: '',
    name: '',
    type: 'CAMP',
    section: '',
    areaHectares: '',
    capacity: '',
  })

  const [rotationForm, setRotationForm] = useState({
    fromCampId: '',
    toCampId: '',
    animalCount: '',
    species: 'cattle',
    reason: '',
  })

  const [assessmentForm, setAssessmentForm] = useState({
    campId: '',
    grassCondition: '',
    biomassEstimate: '',
    notes: '',
  })

  // Fetch data
  const fetchData = async () => {
    try {
      const sessionStr = localStorage.getItem('groway_session')
      const session = sessionStr ? JSON.parse(sessionStr) : null
      const merchantId = session?.merchantId || 'test-merchant'

      const response = await fetch(
        `/api/merchant-os/agriculture/livestock/camps?merchantId=${merchantId}&farmId=${farmId}`
      )

      if (response.ok) {
        const data = await response.json()
        setCamps(data.camps || [])
        setRotationPlans(data.rotationPlans || [])
        setRotationHistory(data.rotationHistory || [])
      }
    } catch (error) {
      console.error('Failed to fetch camp data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [farmId])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const handleAddCamp = async () => {
    setSubmitting(true)
    try {
      const sessionStr = localStorage.getItem('groway_session')
      const session = sessionStr ? JSON.parse(sessionStr) : null
      const merchantId = session?.merchantId || 'test-merchant'

      const response = await fetch(`/api/merchant-os/agriculture/livestock/camps?merchantId=${merchantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmId,
          ...campForm,
          areaHectares: campForm.areaHectares ? parseFloat(campForm.areaHectares) : null,
          capacity: parseInt(campForm.capacity),
        }),
      })

      if (response.ok) {
        setAddCampDialogOpen(false)
        setCampForm({
          code: '',
          name: '',
          type: 'CAMP',
          section: '',
          areaHectares: '',
          capacity: '',
        })
        fetchData()
      }
    } catch (error) {
      console.error('Failed to add camp:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleRotate = async () => {
    setSubmitting(true)
    try {
      const sessionStr = localStorage.getItem('groway_session')
      const session = sessionStr ? JSON.parse(sessionStr) : null
      const merchantId = session?.merchantId || 'test-merchant'

      const response = await fetch(`/api/merchant-os/agriculture/livestock/camps/rotate?merchantId=${merchantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmId,
          ...rotationForm,
          animalCount: parseInt(rotationForm.animalCount),
        }),
      })

      if (response.ok) {
        setRotateDialogOpen(false)
        setRotationForm({
          fromCampId: '',
          toCampId: '',
          animalCount: '',
          species: 'cattle',
          reason: '',
        })
        fetchData()
      }
    } catch (error) {
      console.error('Failed to rotate:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAssessment = async () => {
    setSubmitting(true)
    try {
      const sessionStr = localStorage.getItem('groway_session')
      const session = sessionStr ? JSON.parse(sessionStr) : null
      const merchantId = session?.merchantId || 'test-merchant'

      const response = await fetch(`/api/merchant-os/agriculture/livestock/camps/assessment?merchantId=${merchantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmId,
          ...assessmentForm,
          grassCondition: parseFloat(assessmentForm.grassCondition),
          biomassEstimate: parseFloat(assessmentForm.biomassEstimate),
        }),
      })

      if (response.ok) {
        setAssessmentDialogOpen(false)
        setAssessmentForm({
          campId: '',
          grassCondition: '',
          biomassEstimate: '',
          notes: '',
        })
        fetchData()
      }
    } catch (error) {
      console.error('Failed to record assessment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Get grass condition label
  const getGrassConditionLabel = (condition: number | undefined) => {
    if (!condition) return { label: 'Unknown', color: 'bg-gray-100 text-gray-800' }
    if (condition >= 80) return { label: 'Excellent', color: grassConditionColors.excellent }
    if (condition >= 60) return { label: 'Good', color: grassConditionColors.good }
    if (condition >= 40) return { label: 'Fair', color: grassConditionColors.fair }
    if (condition >= 20) return { label: 'Poor', color: grassConditionColors.poor }
    return { label: 'Critical', color: grassConditionColors.critical }
  }

  // Stats
  const stats = {
    totalCamps: camps.length,
    activeCamps: camps.filter(c => c.status === 'ACTIVE').length,
    restingCamps: camps.filter(c => c.status === 'RESTING').length,
    totalCapacity: camps.reduce((sum, c) => sum + c.capacity, 0),
    totalOccupancy: camps.reduce((sum, c) => sum + c.currentOccupancy, 0),
    avgGrassCondition: camps.filter(c => c.grassCondition).reduce((sum, c) => sum + (c.grassCondition || 0), 0) / camps.filter(c => c.grassCondition).length || 0,
    rotationsDue: rotationPlans.filter(p => p.status === 'DUE_NOW' || p.status === 'OVERDUE').length,
  }

  // Chart data
  const occupancyData = camps.map(camp => ({
    name: camp.name,
    occupancy: camp.currentOccupancy,
    capacity: camp.capacity,
  }))

  const grassData = camps
    .filter(c => c.grassCondition !== undefined)
    .map(camp => ({
      camp: camp.name,
      condition: camp.grassCondition || 0,
    }))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Camp Rotation Planner
          </h2>
          <p className="text-sm text-gray-500">Manage grazing rotation and camp conditions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAssessmentDialogOpen(true)}>
            <Leaf className="w-4 h-4 mr-2" />
            Grass Assessment
          </Button>
          <Button size="sm" className="bg-amber-600 hover:bg-amber-700" onClick={() => setRotateDialogOpen(true)}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Rotate
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAddCampDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Camp
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Total Camps</p>
            <p className="text-2xl font-bold">{stats.totalCamps}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Active</p>
            <p className="text-2xl font-bold text-green-600">{stats.activeCamps}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Resting</p>
            <p className="text-2xl font-bold text-amber-600">{stats.restingCamps}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Total Capacity</p>
            <p className="text-2xl font-bold">{stats.totalCapacity}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Occupied</p>
            <p className="text-2xl font-bold">{stats.totalOccupancy}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Avg Grass</p>
            <p className="text-2xl font-bold">{stats.avgGrassCondition.toFixed(0)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 flex items-center gap-1">
              {stats.rotationsDue > 0 && <AlertTriangle className="w-3 h-3 text-red-500" />}
              Rotations Due
            </p>
            <p className={`text-2xl font-bold ${stats.rotationsDue > 0 ? 'text-red-600' : ''}`}>
              {stats.rotationsDue}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="camps" className="space-y-4">
        <TabsList>
          <TabsTrigger value="camps">Camps</TabsTrigger>
          <TabsTrigger value="rotations">
            Rotation Plans
            {stats.rotationsDue > 0 && (
              <Badge className="ml-2 bg-red-500">{stats.rotationsDue}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Camps Tab */}
        <TabsContent value="camps">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Camp List */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Camp Overview</CardTitle>
                <CardDescription>All camps and their current status</CardDescription>
              </CardHeader>
              <CardContent>
                {camps.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MapPin className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No camps configured</p>
                    <p className="text-sm">Add camps to start managing rotations</p>
                    <Button className="mt-4" onClick={() => setAddCampDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Camp
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {camps.map((camp) => {
                      const grassLabel = getGrassConditionLabel(camp.grassCondition)
                      const occupancyPercent = (camp.currentOccupancy / camp.capacity) * 100

                      return (
                        <div
                          key={camp.id}
                          className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                            selectedCamp?.id === camp.id
                              ? 'bg-amber-50 border-amber-300'
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedCamp(camp)}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${statusColors[camp.status]}`} />
                                <p className="font-medium">{camp.name}</p>
                              </div>
                              <Badge className={campTypeColors[camp.type] || 'bg-gray-100'}>
                                {camp.type}
                              </Badge>
                              <Badge variant="outline">{camp.code}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              {camp.grassCondition !== undefined && (
                                <Badge className={grassLabel.color}>
                                  {grassLabel.label}
                                </Badge>
                              )}
                              <Button variant="ghost" size="icon">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Area</p>
                              <p className="font-medium">{camp.areaHectares ? `${camp.areaHectares} ha` : 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Capacity</p>
                              <p className="font-medium">{camp.capacity} animals</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Occupied</p>
                              <p className="font-medium">{camp.currentOccupancy}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Grazing Days</p>
                              <p className={`font-medium ${camp.grazingDaysRemaining && camp.grazingDaysRemaining < 7 ? 'text-red-600' : ''}`}>
                                {camp.grazingDaysRemaining || 'N/A'}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                              <span>Occupancy</span>
                              <span>{occupancyPercent.toFixed(0)}%</span>
                            </div>
                            <Progress value={occupancyPercent} className="h-2" />
                          </div>

                          {camp.grazingDaysRemaining !== undefined && camp.grazingDaysRemaining < 7 && (
                            <div className="mt-3 flex items-center gap-2 text-amber-600 text-sm">
                              <AlertTriangle className="w-4 h-4" />
                              <span>Rotation recommended within {camp.grazingDaysRemaining} days</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Selected Camp Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {selectedCamp ? selectedCamp.name : 'Camp Details'}
                </CardTitle>
                <CardDescription>
                  {selectedCamp ? 'Detailed information' : 'Select a camp to view details'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedCamp ? (
                  <div className="text-center py-8 text-gray-500">
                    <Mountain className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>Select a camp</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Status</p>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${statusColors[selectedCamp.status]}`} />
                        <p className="font-medium capitalize">{selectedCamp.status.toLowerCase()}</p>
                      </div>
                    </div>

                    {selectedCamp.grassCondition !== undefined && (
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Grass Condition</p>
                        <div className="flex items-center justify-between">
                          <p className="text-2xl font-bold text-green-600">{selectedCamp.grassCondition}%</p>
                          <Badge className={getGrassConditionLabel(selectedCamp.grassCondition).color}>
                            {getGrassConditionLabel(selectedCamp.grassCondition).label}
                          </Badge>
                        </div>
                        <Progress value={selectedCamp.grassCondition} className="h-2 mt-2" />
                      </div>
                    )}

                    {selectedCamp.biomassEstimate !== undefined && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Biomass Estimate</p>
                        <p className="text-lg font-bold">{selectedCamp.biomassEstimate} kg/ha</p>
                      </div>
                    )}

                    {selectedCamp.lastAssessmentDate && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Last Assessment</p>
                        <p className="font-medium">
                          {new Date(selectedCamp.lastAssessmentDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    <Separator />

                    <div className="space-y-2">
                      <Button
                        className="w-full bg-amber-600 hover:bg-amber-700"
                        onClick={() => {
                          setRotationForm({
                            ...rotationForm,
                            fromCampId: selectedCamp.id,
                            animalCount: selectedCamp.currentOccupancy.toString(),
                          })
                          setRotateDialogOpen(true)
                        }}
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Rotate from {selectedCamp.name}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setAssessmentForm({ ...assessmentForm, campId: selectedCamp.id })
                          setAssessmentDialogOpen(true)
                        }}
                      >
                        <Leaf className="w-4 h-4 mr-2" />
                        Update Grass Assessment
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Rotation Plans Tab */}
        <TabsContent value="rotations">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rotation Schedule</CardTitle>
              <CardDescription>Upcoming and overdue rotations</CardDescription>
            </CardHeader>
            <CardContent>
              {rotationPlans.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No rotation plans</p>
                  <p className="text-sm">Rotations will be generated based on grass conditions</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rotationPlans
                    .sort((a, b) => a.daysUntilRotation - b.daysUntilRotation)
                    .map((plan) => (
                      <div
                        key={plan.id}
                        className={`flex items-center gap-4 p-4 rounded-lg border ${
                          plan.status === 'OVERDUE'
                            ? 'bg-red-50 border-red-200'
                            : plan.status === 'DUE_NOW'
                            ? 'bg-amber-50 border-amber-200'
                            : ''
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <RotateCcw className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{plan.name}</p>
                            <Badge variant="outline">{plan.species}</Badge>
                          </div>
                          <p className="text-sm text-gray-500">
                            {plan.currentCampName} → {plan.nextCampName || 'Pending'}
                            <span className="mx-2">•</span>
                            {plan.animalCount} animals
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge
                            className={
                              plan.status === 'OVERDUE'
                                ? 'bg-red-100 text-red-800'
                                : plan.status === 'DUE_NOW'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-green-100 text-green-800'
                            }
                          >
                            {plan.status === 'OVERDUE'
                              ? 'Overdue'
                              : plan.status === 'DUE_NOW'
                              ? 'Due Now'
                              : `${plan.daysUntilRotation}d`}
                          </Badge>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(plan.rotationDate).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            setRotationForm({
                              fromCampId: plan.currentCampId,
                              toCampId: plan.nextCampId || '',
                              animalCount: plan.animalCount.toString(),
                              species: plan.species,
                              reason: 'Scheduled rotation',
                            })
                            setRotateDialogOpen(true)
                          }}
                        >
                          <ArrowRight className="w-4 h-4 mr-1" />
                          Execute
                        </Button>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rotation History</CardTitle>
              <CardDescription>Past rotation events</CardDescription>
            </CardHeader>
            <CardContent>
              {rotationHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <RotateCcw className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No rotation history</p>
                  <p className="text-sm">Past rotations will appear here</p>
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {rotationHistory.map((event) => (
                      <div key={event.id} className="flex items-center gap-4 p-3 rounded-lg border">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <ArrowRight className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">
                            {event.fromCampName} → {event.toCampName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {event.animalCount} {event.species}
                            {event.reason && ` • ${event.reason}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {new Date(event.rotatedAt).toLocaleDateString()}
                          </p>
                          {event.grassConditionBefore && event.grassConditionAfter && (
                            <p className="text-xs text-gray-400">
                              Grass: {event.grassConditionBefore}% → {event.grassConditionAfter}%
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
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Occupancy Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Camp Occupancy</CardTitle>
                <CardDescription>Current vs capacity by camp</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={occupancyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="capacity" fill="#22c55e" radius={[4, 4, 0, 0]} name="Capacity" />
                      <Bar dataKey="occupancy" fill="#8B4513" radius={[4, 4, 0, 0]} name="Occupied" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Grass Condition Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Grass Condition by Camp</CardTitle>
                <CardDescription>Current grass health percentage</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={grassData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="camp" />
                      <YAxis domain={[0, 100]} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="condition" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Grazing Capacity Radar */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Camp Utilization</CardTitle>
                <CardDescription>Multi-factor analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      data={[
                        { factor: 'Grass Health', value: stats.avgGrassCondition },
                        { factor: 'Occupancy', value: (stats.totalOccupancy / stats.totalCapacity) * 100 },
                        { factor: 'Rest Periods', value: (stats.restingCamps / stats.totalCamps) * 100 },
                        { factor: 'Rotation Rate', value: 75 },
                        { factor: 'Stocking Rate', value: 85 },
                      ]}
                    >
                      <PolarGrid />
                      <PolarAngleAxis dataKey="factor" />
                      <PolarRadiusAxis domain={[0, 100]} />
                      <Radar name="Score" dataKey="value" stroke="#8B4513" fill="#D2691E" fillOpacity={0.5} />
                    </RadarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recommendations</CardTitle>
                <CardDescription>AI-powered suggestions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.rotationsDue > 0 && (
                    <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-800">Rotation Required</p>
                        <p className="text-sm text-red-600">
                          {stats.rotationsDue} camp(s) need immediate rotation to prevent overgrazing
                        </p>
                      </div>
                    </div>
                  )}
                  {stats.avgGrassCondition < 50 && (
                    <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                      <Sprout className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-800">Low Grass Condition</p>
                        <p className="text-sm text-amber-600">
                          Average grass condition is below optimal. Consider extending rest periods.
                        </p>
                      </div>
                    </div>
                  )}
                  {stats.restingCamps < stats.totalCamps * 0.2 && (
                    <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <Target className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-800">Increase Rest Periods</p>
                        <p className="text-sm text-blue-600">
                          Only {((stats.restingCamps / stats.totalCamps) * 100).toFixed(0)}% of camps are resting.
                          Aim for 20-30% to maintain grass health.
                        </p>
                      </div>
                    </div>
                  )}
                  {stats.avgGrassCondition >= 60 && stats.rotationsDue === 0 && (
                    <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-800">Good Management</p>
                        <p className="text-sm text-green-600">
                          Your rotation schedule is on track and grass conditions are healthy.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Camp Dialog */}
      <Dialog open={addCampDialogOpen} onOpenChange={setAddCampDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Camp/Pen</DialogTitle>
            <DialogDescription>Create a new camp or pen for livestock</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Camp Code</Label>
                <Input
                  id="code"
                  placeholder="e.g., C01"
                  value={campForm.code}
                  onChange={(e) => setCampForm({ ...campForm, code: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., North Pasture"
                  value={campForm.name}
                  onChange={(e) => setCampForm({ ...campForm, name: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={campForm.type}
                  onValueChange={(value) => setCampForm({ ...campForm, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CAMP">Camp</SelectItem>
                    <SelectItem value="PADDOCK">Paddock</SelectItem>
                    <SelectItem value="PEN">Pen</SelectItem>
                    <SelectItem value="KRAAL">Kraal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="section">Section</Label>
                <Input
                  id="section"
                  placeholder="e.g., North Section"
                  value={campForm.section}
                  onChange={(e) => setCampForm({ ...campForm, section: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="area">Area (hectares)</Label>
                <Input
                  id="area"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 50"
                  value={campForm.areaHectares}
                  onChange={(e) => setCampForm({ ...campForm, areaHectares: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity (animals)</Label>
                <Input
                  id="capacity"
                  type="number"
                  placeholder="e.g., 100"
                  value={campForm.capacity}
                  onChange={(e) => setCampForm({ ...campForm, capacity: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCampDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddCamp}
              disabled={submitting || !campForm.code || !campForm.name || !campForm.capacity}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Camp'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rotate Dialog */}
      <Dialog open={rotateDialogOpen} onOpenChange={setRotateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Execute Rotation</DialogTitle>
            <DialogDescription>Move animals between camps</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fromCamp">From Camp</Label>
              <Select
                value={rotationForm.fromCampId}
                onValueChange={(value) => setRotationForm({ ...rotationForm, fromCampId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source camp" />
                </SelectTrigger>
                <SelectContent>
                  {camps.filter(c => c.currentOccupancy > 0).map((camp) => (
                    <SelectItem key={camp.id} value={camp.id}>
                      {camp.name} ({camp.currentOccupancy} animals)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="toCamp">To Camp</Label>
              <Select
                value={rotationForm.toCampId}
                onValueChange={(value) => setRotationForm({ ...rotationForm, toCampId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select destination camp" />
                </SelectTrigger>
                <SelectContent>
                  {camps.filter(c => c.id !== rotationForm.fromCampId && c.currentOccupancy < c.capacity).map((camp) => (
                    <SelectItem key={camp.id} value={camp.id}>
                      {camp.name} (Capacity: {camp.capacity - c.currentOccupancy} available)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="animalCount">Number of Animals</Label>
                <Input
                  id="animalCount"
                  type="number"
                  placeholder="e.g., 50"
                  value={rotationForm.animalCount}
                  onChange={(e) => setRotationForm({ ...rotationForm, animalCount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="species">Species</Label>
                <Select
                  value={rotationForm.species}
                  onValueChange={(value) => setRotationForm({ ...rotationForm, species: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cattle">Cattle</SelectItem>
                    <SelectItem value="sheep">Sheep</SelectItem>
                    <SelectItem value="goats">Goats</SelectItem>
                    <SelectItem value="pigs">Pigs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                placeholder="e.g., Scheduled rotation"
                value={rotationForm.reason}
                onChange={(e) => setRotationForm({ ...rotationForm, reason: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRotateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRotate}
              disabled={submitting || !rotationForm.fromCampId || !rotationForm.toCampId || !rotationForm.animalCount}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rotating...
                </>
              ) : (
                'Execute Rotation'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grass Assessment Dialog */}
      <Dialog open={assessmentDialogOpen} onOpenChange={setAssessmentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Grass Assessment</DialogTitle>
            <DialogDescription>Record grass condition for a camp</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="assessmentCamp">Camp</Label>
              <Select
                value={assessmentForm.campId}
                onValueChange={(value) => setAssessmentForm({ ...assessmentForm, campId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select camp" />
                </SelectTrigger>
                <SelectContent>
                  {camps.map((camp) => (
                    <SelectItem key={camp.id} value={camp.id}>
                      {camp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="grassCondition">Grass Condition (%)</Label>
              <Input
                id="grassCondition"
                type="number"
                min="0"
                max="100"
                placeholder="e.g., 75"
                value={assessmentForm.grassCondition}
                onChange={(e) => setAssessmentForm({ ...assessmentForm, grassCondition: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="biomass">Biomass Estimate (kg/ha)</Label>
              <Input
                id="biomass"
                type="number"
                placeholder="e.g., 2500"
                value={assessmentForm.biomassEstimate}
                onChange={(e) => setAssessmentForm({ ...assessmentForm, biomassEstimate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assessmentNotes">Notes</Label>
              <Input
                id="assessmentNotes"
                placeholder="Any observations..."
                value={assessmentForm.notes}
                onChange={(e) => setAssessmentForm({ ...assessmentForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssessmentDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssessment}
              disabled={submitting || !assessmentForm.campId || !assessmentForm.grassCondition}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Recording...
                </>
              ) : (
                'Record Assessment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
