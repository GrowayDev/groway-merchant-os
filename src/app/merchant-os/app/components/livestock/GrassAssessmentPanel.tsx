'use client'

import { useState, useRef } from 'react'
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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from 'recharts'
import {
  Leaf,
  Camera,
  Upload,
  Brain,
  Target,
  CheckCircle,
  AlertTriangle,
  Loader2,
  TrendingUp,
  TrendingDown,
  MapPin,
  Sprout,
  Sun,
  Droplets,
  Save,
  Clock,
  Eye,
} from 'lucide-react'

// ============================================
// TYPES
// ============================================

interface GrassAssessment {
  id: string
  campId?: string
  campName?: string
  imageUrl: string
  analyzedAt: string
  
  // Grass Metrics
  grassCondition: number // 0-100
  biomassEstimate: number // kg/ha
  grazingCapacity: number // LSU/ha
  daysUntilRotation: number
  
  // Vegetation Analysis
  dominantGrassTypes: string[]
  vegetationHeight: number // cm
  groundCoverage: number // %
  weedPresence: number // %
  
  // Quality Indicators
  nutritionalValue: 'excellent' | 'good' | 'fair' | 'poor'
  proteinContent: number // %
  digestibility: number // %
  
  // Conditions
  soilCondition: string
  moistureLevel: 'wet' | 'moist' | 'dry' | 'very_dry'
  signsOfOvergrazing: boolean
  barePatches: number // %
  
  // Recommendations
  recommendations: string[]
  rotationUrgency: 'immediate' | 'soon' | 'normal' | 'low'
  
  // Confidence
  confidenceLevel: number
}

interface CampGrassSummary {
  campId: string
  campName: string
  lastAssessment: string
  grassCondition: number
  trend: 'improving' | 'stable' | 'declining'
  grazingDaysRemaining: number
  rotationPriority: 'high' | 'medium' | 'low'
}

interface GrassAssessmentPanelProps {
  farmId: string
}

const chartConfig: ChartConfig = {
  condition: { label: 'Grass Condition', color: '#22c55e' },
  biomass: { label: 'Biomass', color: '#8B4513' },
}

const qualityColors: Record<string, string> = {
  excellent: 'bg-green-100 text-green-800',
  good: 'bg-lime-100 text-lime-800',
  fair: 'bg-amber-100 text-amber-800',
  poor: 'bg-red-100 text-red-800',
}

const urgencyColors: Record<string, string> = {
  immediate: 'bg-red-100 text-red-800 border-red-300',
  soon: 'bg-amber-100 text-amber-800 border-amber-300',
  normal: 'bg-blue-100 text-blue-800 border-blue-300',
  low: 'bg-green-100 text-green-800 border-green-300',
}

const moistureLabels: Record<string, string> = {
  wet: 'Wet (Recent Rain)',
  moist: 'Moist (Good)',
  dry: 'Dry',
  very_dry: 'Very Dry (Needs Water)',
}

// ============================================
// MAIN COMPONENT
// ============================================

export function GrassAssessmentPanel({ farmId }: GrassAssessmentPanelProps) {
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [assessments, setAssessments] = useState<GrassAssessment[]>([])
  const [selectedAssessment, setSelectedAssessment] = useState<GrassAssessment | null>(null)
  
  // Upload state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(null)
  const [selectedCampId, setSelectedCampId] = useState('')
  const [selectedCampName, setSelectedCampName] = useState('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Mock camps for selection
  const camps = [
    { id: 'camp-1', name: 'North Pasture' },
    { id: 'camp-2', name: 'South Camp' },
    { id: 'camp-3', name: 'East Paddock' },
    { id: 'camp-4', name: 'West Field' },
  ]

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setCurrentPhoto(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Analyze grass image using AI
  const analyzeGrass = async () => {
    if (!currentPhoto) return
    
    setAnalyzing(true)
    try {
      const sessionStr = localStorage.getItem('groway_session')
      const session = sessionStr ? JSON.parse(sessionStr) : null
      const merchantId = session?.merchantId || 'test-merchant'

      const response = await fetch('/api/merchant-os/agriculture/livestock/ai/grass-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmId,
          merchantId,
          campId: selectedCampId,
          campName: selectedCampName,
          imageUrl: currentPhoto,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const assessment: GrassAssessment = {
          id: data.id || `ga-${Date.now()}`,
          campId: selectedCampId,
          campName: selectedCampName,
          imageUrl: currentPhoto,
          analyzedAt: new Date().toISOString(),
          grassCondition: data.grassCondition,
          biomassEstimate: data.biomassEstimate,
          grazingCapacity: data.grazingCapacity,
          daysUntilRotation: data.daysUntilRotation,
          dominantGrassTypes: data.dominantGrassTypes || [],
          vegetationHeight: data.vegetationHeight,
          groundCoverage: data.groundCoverage,
          weedPresence: data.weedPresence,
          nutritionalValue: data.nutritionalValue,
          proteinContent: data.proteinContent,
          digestibility: data.digestibility,
          soilCondition: data.soilCondition,
          moistureLevel: data.moistureLevel,
          signsOfOvergrazing: data.signsOfOvergrazing,
          barePatches: data.barePatches,
          recommendations: data.recommendations || [],
          rotationUrgency: data.rotationUrgency,
          confidenceLevel: data.confidenceLevel,
        }
        
        setAssessments(prev => [assessment, ...prev])
        setSelectedAssessment(assessment)
        setUploadDialogOpen(false)
        setCurrentPhoto(null)
        setSelectedCampId('')
        setSelectedCampName('')
      }
    } catch (error) {
      console.error('Failed to analyze grass:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  // Get condition label
  const getConditionLabel = (condition: number) => {
    if (condition >= 80) return { label: 'Excellent', color: 'text-green-600' }
    if (condition >= 60) return { label: 'Good', color: 'text-lime-600' }
    if (condition >= 40) return { label: 'Fair', color: 'text-amber-600' }
    if (condition >= 20) return { label: 'Poor', color: 'text-orange-600' }
    return { label: 'Critical', color: 'text-red-600' }
  }

  // Trend chart data
  const trendData = [
    { month: 'Jan', condition: 75 },
    { month: 'Feb', condition: 78 },
    { month: 'Mar', condition: 72 },
    { month: 'Apr', condition: 65 },
    { month: 'May', condition: 58 },
    { month: 'Jun', condition: 62 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Sprout className="w-5 h-5" />
            Grass Condition Assessment
          </h2>
          <p className="text-sm text-gray-500">AI-powered pasture health analysis</p>
        </div>
        <Button 
          size="sm" 
          className="bg-green-600 hover:bg-green-700"
          onClick={() => setUploadDialogOpen(true)}
        >
          <Camera className="w-4 h-4 mr-2" />
          Assess Pasture
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <Leaf className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Avg Condition</p>
                <p className="text-xl font-bold">68%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Camps Assessed</p>
                <p className="text-xl font-bold">{assessments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Need Attention</p>
                <p className="text-xl font-bold text-red-600">2</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Avg Biomass</p>
                <p className="text-xl font-bold">2.4t/ha</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <Target className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Grazing Capacity</p>
                <p className="text-xl font-bold">3.2 LSU/ha</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="assessments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assessments">Recent Assessments</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="guide">Photo Guide</TabsTrigger>
        </TabsList>

        {/* Recent Assessments Tab */}
        <TabsContent value="assessments">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Assessments List */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Grass Assessments</CardTitle>
                <CardDescription>AI-analyzed pasture conditions</CardDescription>
              </CardHeader>
              <CardContent>
                {assessments.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Sprout className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium">No assessments yet</p>
                    <p className="text-sm mb-4">Upload a pasture photo to analyze grass condition</p>
                    <Button onClick={() => setUploadDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
                      <Camera className="w-4 h-4 mr-2" />
                      Assess Pasture
                    </Button>
                  </div>
                ) : (
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {assessments.map((assessment) => {
                        const conditionLabel = getConditionLabel(assessment.grassCondition)
                        
                        return (
                          <div
                            key={assessment.id}
                            className={`flex gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                              selectedAssessment?.id === assessment.id
                                ? 'bg-green-50 border-green-300'
                                : 'hover:bg-gray-50'
                            }`}
                            onClick={() => setSelectedAssessment(assessment)}
                          >
                            {/* Thumbnail */}
                            <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                              <img
                                src={assessment.imageUrl}
                                alt="Pasture"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            
                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium">{assessment.campName || 'Unknown Camp'}</p>
                                <Badge className={qualityColors[assessment.nutritionalValue]}>
                                  {assessment.nutritionalValue}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center gap-4">
                                <div>
                                  <p className="text-sm text-gray-500">Condition</p>
                                  <p className={`text-lg font-bold ${conditionLabel.color}`}>
                                    {assessment.grassCondition}%
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Biomass</p>
                                  <p className="text-lg font-bold">{assessment.biomassEstimate} kg/ha</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Rotation</p>
                                  <Badge className={urgencyColors[assessment.rotationUrgency]}>
                                    {assessment.daysUntilRotation} days
                                  </Badge>
                                </div>
                              </div>
                              
                              <p className="text-xs text-gray-400 mt-2">
                                {new Date(assessment.analyzedAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Assessment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {selectedAssessment ? 'Analysis Details' : 'Select Assessment'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedAssessment ? (
                  <div className="text-center py-8 text-gray-500">
                    <Eye className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>Select an assessment to view details</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Image */}
                    <div className="rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={selectedAssessment.imageUrl}
                        alt="Pasture"
                        className="w-full h-40 object-cover"
                      />
                    </div>

                    {/* Condition */}
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Grass Condition</p>
                      <p className="text-3xl font-bold text-green-600">
                        {selectedAssessment.grassCondition}%
                      </p>
                      <Progress value={selectedAssessment.grassCondition} className="h-2 mt-2" />
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">Biomass</p>
                        <p className="text-lg font-bold">{selectedAssessment.biomassEstimate} kg/ha</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">Grazing Capacity</p>
                        <p className="text-lg font-bold">{selectedAssessment.grazingCapacity} LSU/ha</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">Vegetation Height</p>
                        <p className="text-lg font-bold">{selectedAssessment.vegetationHeight} cm</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">Ground Coverage</p>
                        <p className="text-lg font-bold">{selectedAssessment.groundCoverage}%</p>
                      </div>
                    </div>

                    <Separator />

                    {/* Vegetation Analysis */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Dominant Grass Types</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedAssessment.dominantGrassTypes.map((grass, idx) => (
                          <Badge key={idx} variant="outline">{grass}</Badge>
                        ))}
                      </div>
                    </div>

                    {/* Quality Metrics */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">Protein Content</p>
                        <p className="text-lg font-bold">{selectedAssessment.proteinContent}%</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">Digestibility</p>
                        <p className="text-lg font-bold">{selectedAssessment.digestibility}%</p>
                      </div>
                    </div>

                    {/* Conditions */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Moisture Level</span>
                        <Badge variant="outline">{moistureLabels[selectedAssessment.moistureLevel]}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Weed Presence</span>
                        <span className="font-medium">{selectedAssessment.weedPresence}%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Bare Patches</span>
                        <span className="font-medium">{selectedAssessment.barePatches}%</span>
                      </div>
                      {selectedAssessment.signsOfOvergrazing && (
                        <div className="flex items-center gap-2 text-red-600 text-sm">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Signs of overgrazing detected</span>
                        </div>
                      )}
                    </div>

                    {/* Recommendations */}
                    {selectedAssessment.recommendations.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Recommendations</p>
                        <div className="space-y-2">
                          {selectedAssessment.recommendations.map((rec, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-sm">
                              <Target className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{rec}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      <Save className="w-4 h-4 mr-2" />
                      Save Assessment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Grass Condition Trend</CardTitle>
                <CardDescription>6-month condition history</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[0, 100]} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="condition"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={{ fill: '#22c55e' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Camp Comparison</CardTitle>
                <CardDescription>Condition by camp</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { camp: 'North', condition: 72 },
                        { camp: 'South', condition: 58 },
                        { camp: 'East', condition: 65 },
                        { camp: 'West', condition: 78 },
                      ]}
                    >
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
          </div>
        </TabsContent>

        {/* Photo Guide Tab */}
        <TabsContent value="guide">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">How to Capture Pasture Photos</CardTitle>
              <CardDescription>Follow these guidelines for accurate assessments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Best Practices
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Sun className="w-5 h-5 text-amber-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Good Lighting</p>
                        <p className="text-sm text-gray-500">Take photos during midday for even lighting</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-blue-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Include Reference</p>
                        <p className="text-sm text-gray-500">Place a quadrat or measuring stick in frame</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Target className="w-5 h-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Capture Variety</p>
                        <p className="text-sm text-gray-500">Take multiple photos across the camp</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    Avoid These
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Camera className="w-5 h-5 text-red-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Angled Shots</p>
                        <p className="text-sm text-gray-500">Keep camera parallel to ground</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Droplets className="w-5 h-5 text-red-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Wet Grass</p>
                        <p className="text-sm text-gray-500">Avoid photos after rain or heavy dew</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Leaf className="w-5 h-5 text-red-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Selective Areas</p>
                        <p className="text-sm text-gray-500">Capture representative areas, not just best patches</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Assess Pasture Condition</DialogTitle>
            <DialogDescription>
              Upload a photo of your pasture for AI analysis
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Camp Selection */}
            <div className="space-y-2">
              <Label htmlFor="campSelect">Select Camp/Paddock</Label>
              <Select
                value={selectedCampId}
                onValueChange={(value) => {
                  setSelectedCampId(value)
                  const camp = camps.find(c => c.id === value)
                  setSelectedCampName(camp?.name || '')
                }}
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

            {/* Photo Upload */}
            <div className="space-y-2">
              <Label>Photo</Label>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              {currentPhoto ? (
                <div className="relative">
                  <img
                    src={currentPhoto}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => setCurrentPhoto(null)}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Click to upload pasture photo</p>
                  <p className="text-xs text-gray-400 mt-1">Take photo looking down at grass</p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={analyzeGrass}
              disabled={!currentPhoto || analyzing}
              className="bg-green-600 hover:bg-green-700"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Analyze Pasture
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
