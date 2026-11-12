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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle,
  Activity,
  Scale,
  Heart,
  Calendar,
  Clock,
  Zap,
  RefreshCw,
  Loader2,
  Settings,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart,
  Eye,
  Info,
  Lightbulb,
  Shield,
  DollarSign,
} from 'lucide-react'

// ============================================
// TYPES
// ============================================

interface GrowthPrediction {
  id: string
  animalTag: string
  species: string
  breed: string
  currentWeight: number
  currentAge: number
  predictedWeights: { date: string; weight: number; confidence: number }[]
  targetWeight: number
  estimatedDateToTarget: string
  averageDailyGain: number
  predictedDailyGain: number
  feedEfficiency: number
  marketReadiness: {
    score: number
    estimatedValue: number
    optimalSaleDate: string
    daysToOptimal: number
  }
  factors: {
    name: string
    impact: 'positive' | 'negative' | 'neutral'
    value: number
    description: string
  }[]
}

interface HealthPrediction {
  id: string
  animalTag: string
  species: string
  riskScore: number // 0-100, higher = higher risk
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  predictions: {
    condition: string
    probability: number
    timeFrame: string
    prevention: string[]
  }[]
  healthScore: number // 0-100, higher = better
  recommendations: {
    priority: 'high' | 'medium' | 'low'
    action: string
    impact: string
    deadline?: string
  }[]
  lastCheckup: string
  nextCheckup: string
}

interface HerdForecast {
  totalAnimals: number
  projectedGrowth: number
  projectedRevenue: number
  projectedCosts: number
  projectedProfit: number
  monthlyProjections: {
    month: string
    animals: number
    revenue: number
    costs: number
    profit: number
  }[]
  insights: {
    type: 'opportunity' | 'warning' | 'info'
    title: string
    description: string
    action?: string
  }[]
}

interface PredictiveAnalyticsProps {
  farmId: string
}

const chartConfig: ChartConfig = {
  actual: { label: 'Actual', color: '#8B4513' },
  predicted: { label: 'Predicted', color: '#F59E0B' },
  confidence: { label: 'Confidence', color: '#22C55E' },
  weight: { label: 'Weight', color: '#8B4513' },
  revenue: { label: 'Revenue', color: '#22C55E' },
  costs: { label: 'Costs', color: '#EF4444' },
  profit: { label: 'Profit', color: '#3B82F6' },
}

// Mock growth prediction
const mockGrowthPrediction: GrowthPrediction = {
  id: 'gp-1',
  animalTag: 'C001',
  species: 'Cattle',
  breed: 'Brahman',
  currentWeight: 420,
  currentAge: 18,
  predictedWeights: [
    { date: '2025-07', weight: 420, confidence: 100 },
    { date: '2025-08', weight: 445, confidence: 95 },
    { date: '2025-09', weight: 472, confidence: 90 },
    { date: '2025-10', weight: 498, confidence: 85 },
    { date: '2025-11', weight: 522, confidence: 80 },
    { date: '2025-12', weight: 545, confidence: 75 },
  ],
  targetWeight: 550,
  estimatedDateToTarget: '2025-12-15',
  averageDailyGain: 1.2,
  predictedDailyGain: 1.1,
  feedEfficiency: 6.2,
  marketReadiness: {
    score: 72,
    estimatedValue: 12500,
    optimalSaleDate: '2026-01-15',
    daysToOptimal: 195,
  },
  factors: [
    { name: 'Breed Genetics', impact: 'positive', value: 15, description: 'Brahman breed has excellent growth potential' },
    { name: 'Current Health', impact: 'positive', value: 10, description: 'Good body condition and no health issues' },
    { name: 'Feed Quality', impact: 'neutral', value: 0, description: 'Standard feed quality' },
    { name: 'Season', impact: 'negative', value: -5, description: 'Winter months may reduce growth rate' },
    { name: 'Age', impact: 'positive', value: 8, description: 'Optimal growth phase' },
  ],
}

// Mock health prediction
const mockHealthPrediction: HealthPrediction = {
  id: 'hp-1',
  animalTag: 'C001',
  species: 'Cattle',
  riskScore: 25,
  riskLevel: 'low',
  predictions: [
    {
      condition: 'Respiratory Infection',
      probability: 8,
      timeFrame: 'Next 30 days',
      prevention: ['Ensure proper ventilation', 'Monitor temperature', 'Vaccination up to date'],
    },
    {
      condition: 'Parasitic Infection',
      probability: 15,
      timeFrame: 'Next 60 days',
      prevention: ['Regular deworming', 'Pasture rotation', 'Monitor grazing patterns'],
    },
    {
      condition: 'Nutritional Deficiency',
      probability: 5,
      timeFrame: 'Next 90 days',
      prevention: ['Balanced diet', 'Mineral supplements', 'Regular weight monitoring'],
    },
  ],
  healthScore: 85,
  recommendations: [
    { priority: 'medium', action: 'Schedule routine vaccination booster', impact: 'Prevents common diseases', deadline: '2025-08-15' },
    { priority: 'low', action: 'Consider mineral supplement adjustment', impact: 'May improve growth rate by 5%' },
    { priority: 'low', action: 'Monitor weight weekly for trend analysis', impact: 'Early detection of issues' },
  ],
  lastCheckup: '2025-06-15',
  nextCheckup: '2025-09-15',
}

// Mock herd forecast
const mockHerdForecast: HerdForecast = {
  totalAnimals: 245,
  projectedGrowth: 12,
  projectedRevenue: 1850000,
  projectedCosts: 925000,
  projectedProfit: 925000,
  monthlyProjections: [
    { month: 'Jul 2025', animals: 245, revenue: 150000, costs: 75000, profit: 75000 },
    { month: 'Aug 2025', animals: 252, revenue: 160000, costs: 78000, profit: 82000 },
    { month: 'Sep 2025', animals: 260, revenue: 175000, costs: 80000, profit: 95000 },
    { month: 'Oct 2025', animals: 268, revenue: 180000, costs: 82000, profit: 98000 },
    { month: 'Nov 2025', animals: 275, revenue: 190000, costs: 85000, profit: 105000 },
    { month: 'Dec 2025', animals: 280, revenue: 200000, costs: 88000, profit: 112000 },
  ],
  insights: [
    {
      type: 'opportunity',
      title: 'Optimal Sale Window',
      description: '15 cattle will reach optimal market weight in December 2025. Consider forward contracts now.',
      action: 'Review sale strategy',
    },
    {
      type: 'warning',
      title: 'Feed Cost Increase',
      description: 'Feed prices projected to increase 8% in Q4. Consider forward purchasing.',
      action: 'Plan feed procurement',
    },
    {
      type: 'info',
      title: 'Breeding Season',
      description: '45 breeding females due for service in August. Prepare breeding program.',
      action: 'Schedule breeding',
    },
  ],
}

// ============================================
// MAIN COMPONENT
// ============================================

export function PredictiveAnalytics({ farmId }: PredictiveAnalyticsProps) {
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedAnimal, setSelectedAnimal] = useState('C001')
  const [growthPrediction, setGrowthPrediction] = useState<GrowthPrediction>(mockGrowthPrediction)
  const [healthPrediction, setHealthPrediction] = useState<HealthPrediction>(mockHealthPrediction)
  const [herdForecast, setHerdForecast] = useState<HerdForecast>(mockHerdForecast)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedPrediction, setSelectedPrediction] = useState<string | null>(null)

  // Refresh predictions
  const refreshPredictions = async () => {
    setRefreshing(true)
    try {
      const sessionStr = localStorage.getItem('groway_session')
      const session = sessionStr ? JSON.parse(sessionStr) : null
      const merchantId = session?.merchantId || 'test-merchant'

      const response = await fetch(
        `/api/merchant-os/agriculture/livestock/predictions?merchantId=${merchantId}&farmId=${farmId}&animalTag=${selectedAnimal}`
      )

      if (response.ok) {
        const data = await response.json()
        setGrowthPrediction(data.growth || mockGrowthPrediction)
        setHealthPrediction(data.health || mockHealthPrediction)
        setHerdForecast(data.herd || mockHerdForecast)
      }
    } catch (error) {
      console.error('Failed to refresh predictions:', error)
    } finally {
      setRefreshing(false)
    }
  }

  // Get risk level color
  const getRiskColor = (level: HealthPrediction['riskLevel']) => {
    const colors = {
      low: 'text-green-600 bg-green-100',
      medium: 'text-amber-600 bg-amber-100',
      high: 'text-orange-600 bg-orange-100',
      critical: 'text-red-600 bg-red-100',
    }
    return colors[level]
  }

  // Get insight icon
  const getInsightIcon = (type: HerdForecast['insights'][0]['type']) => {
    switch (type) {
      case 'opportunity':
        return <Lightbulb className="w-5 h-5 text-green-600" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Predictive Analytics
          </h2>
          <p className="text-sm text-gray-500">AI-powered growth forecasting and health predictions</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedAnimal} onValueChange={setSelectedAnimal}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select animal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="C001">C001 - Brahman</SelectItem>
              <SelectItem value="C045">C045 - Angus</SelectItem>
              <SelectItem value="S012">S012 - Merino</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={refreshPredictions} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* AI Insights Banner */}
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-purple-900">AI-Powered Predictions</h3>
              <p className="text-sm text-purple-700 mt-1">
                Predictions are based on historical data, breed characteristics, health records, and environmental factors.
                Confidence levels decrease over time as more variables come into play.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prediction Scores */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Scale className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Current Weight</p>
                <p className="text-xl font-bold">{growthPrediction.currentWeight} kg</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Predicted ADG</p>
                <p className="text-xl font-bold">{growthPrediction.predictedDailyGain} kg/d</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Heart className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Health Score</p>
                <p className="text-xl font-bold">{healthPrediction.healthScore}/100</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Risk Level</p>
                <Badge className={getRiskColor(healthPrediction.riskLevel)}>
                  {healthPrediction.riskLevel.toUpperCase()}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="growth" className="space-y-4">
        <TabsList>
          <TabsTrigger value="growth">
            <TrendingUp className="w-4 h-4 mr-2" />
            Growth Forecast
          </TabsTrigger>
          <TabsTrigger value="health">
            <Heart className="w-4 h-4 mr-2" />
            Health Predictions
          </TabsTrigger>
          <TabsTrigger value="herd">
            <BarChart3 className="w-4 h-4 mr-2" />
            Herd Forecast
          </TabsTrigger>
        </TabsList>

        {/* Growth Forecast Tab */}
        <TabsContent value="growth">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Growth Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Weight Projection</CardTitle>
                <CardDescription>Predicted growth trajectory with confidence intervals</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={growthPrediction.predictedWeights}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={['auto', 'dataMax + 50']} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="weight"
                        stroke="#8B4513"
                        fill="#F59E0B"
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <p className="text-xs text-gray-500">Target Weight</p>
                    <p className="text-xl font-bold text-amber-600">{growthPrediction.targetWeight} kg</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Est. date: {new Date(growthPrediction.estimatedDateToTarget).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-gray-500">Market Readiness</p>
                    <p className="text-xl font-bold text-green-600">{growthPrediction.marketReadiness.score}%</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {growthPrediction.marketReadiness.daysToOptimal} days to optimal
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Growth Factors */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Growth Factors</CardTitle>
                <CardDescription>Variables affecting prediction</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {growthPrediction.factors.map((factor, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        factor.impact === 'positive' ? 'bg-green-100' :
                        factor.impact === 'negative' ? 'bg-red-100' : 'bg-gray-100'
                      }`}>
                        {factor.impact === 'positive' ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : factor.impact === 'negative' ? (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        ) : (
                          <Activity className="w-4 h-4 text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">{factor.name}</p>
                          <span className={`text-sm font-bold ${
                            factor.impact === 'positive' ? 'text-green-600' :
                            factor.impact === 'negative' ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {factor.value > 0 ? '+' : ''}{factor.value}%
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{factor.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <p className="font-medium text-green-800">Estimated Value</p>
                  </div>
                  <p className="text-2xl font-bold text-green-700">
                    R {growthPrediction.marketReadiness.estimatedValue.toLocaleString()}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Optimal sale: {new Date(growthPrediction.marketReadiness.optimalSaleDate).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Health Predictions Tab */}
        <TabsContent value="health">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Health Score & Risk */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Health Assessment</CardTitle>
                <CardDescription>AI-predicted health risks and scores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center gap-8 mb-6">
                  <div className="text-center">
                    <div className="relative w-32 h-32">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="#E5E7EB"
                          strokeWidth="12"
                          fill="none"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="#22C55E"
                          strokeWidth="12"
                          fill="none"
                          strokeDasharray={`${(healthPrediction.healthScore / 100) * 352} 352`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold">{healthPrediction.healthScore}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Health Score</p>
                  </div>

                  <div className="text-center">
                    <div className="relative w-32 h-32">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="#E5E7EB"
                          strokeWidth="12"
                          fill="none"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke={healthPrediction.riskScore > 50 ? '#EF4444' : healthPrediction.riskScore > 25 ? '#F59E0B' : '#22C55E'}
                          strokeWidth="12"
                          fill="none"
                          strokeDasharray={`${(healthPrediction.riskScore / 100) * 352} 352`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold">{healthPrediction.riskScore}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Risk Score</p>
                  </div>
                </div>

                <Separator />

                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Last Checkup</p>
                    <p className="text-sm">{new Date(healthPrediction.lastCheckup).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Next Checkup</p>
                    <p className="text-sm">{new Date(healthPrediction.nextCheckup).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Risk Predictions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Condition Probabilities</CardTitle>
                <CardDescription>AI-predicted health risks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {healthPrediction.predictions.map((pred, idx) => (
                    <div key={idx} className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">{pred.condition}</p>
                        <Badge className={
                          pred.probability > 20 ? 'bg-red-100 text-red-800' :
                          pred.probability > 10 ? 'bg-amber-100 text-amber-800' :
                          'bg-green-100 text-green-800'
                        }>
                          {pred.probability}% probability
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">{pred.timeFrame}</p>
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">Prevention:</p>
                        <ul className="text-xs text-gray-500 space-y-1">
                          {pred.prevention.map((p, i) => (
                            <li key={i} className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-green-500" />
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Health Recommendations</CardTitle>
                <CardDescription>AI-generated health action items</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {healthPrediction.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border ${
                        rec.priority === 'high' ? 'bg-red-50 border-red-200' :
                        rec.priority === 'medium' ? 'bg-amber-50 border-amber-200' :
                        'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <Badge className={
                        rec.priority === 'high' ? 'bg-red-500' :
                        rec.priority === 'medium' ? 'bg-amber-500' :
                        'bg-gray-500'
                      }>
                        {rec.priority}
                      </Badge>
                      <p className="font-medium mt-2">{rec.action}</p>
                      <p className="text-sm text-gray-500 mt-1">{rec.impact}</p>
                      {rec.deadline && (
                        <p className="text-xs text-gray-400 mt-2">
                          <Clock className="w-3 h-3 inline mr-1" />
                          By: {new Date(rec.deadline).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Herd Forecast Tab */}
        <TabsContent value="herd">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly Projections */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">6-Month Financial Projection</CardTitle>
                <CardDescription>Revenue, costs, and profit forecast</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={herdForecast.monthlyProjections}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="revenue" fill="#22C55E" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="costs" fill="#EF4444" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="profit" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>

                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="p-3 bg-green-50 rounded-lg text-center">
                    <p className="text-xs text-gray-500">Projected Revenue</p>
                    <p className="text-lg font-bold text-green-600">
                      R {(herdForecast.projectedRevenue / 1000).toFixed(0)}K
                    </p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg text-center">
                    <p className="text-xs text-gray-500">Projected Costs</p>
                    <p className="text-lg font-bold text-red-600">
                      R {(herdForecast.projectedCosts / 1000).toFixed(0)}K
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <p className="text-xs text-gray-500">Projected Profit</p>
                    <p className="text-lg font-bold text-blue-600">
                      R {(herdForecast.projectedProfit / 1000).toFixed(0)}K
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">AI Insights</CardTitle>
                <CardDescription>Actionable recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {herdForecast.insights.map((insight, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border ${
                        insight.type === 'opportunity' ? 'bg-green-50 border-green-200' :
                        insight.type === 'warning' ? 'bg-amber-50 border-amber-200' :
                        'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {getInsightIcon(insight.type)}
                        <div className="flex-1">
                          <p className="font-medium text-sm">{insight.title}</p>
                          <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                          {insight.action && (
                            <Button variant="link" size="sm" className="p-0 h-auto mt-2">
                              {insight.action} →
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Herd Summary */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-base">Herd Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <p className="text-xs text-gray-500">Total Animals</p>
                    <p className="text-2xl font-bold">{herdForecast.totalAnimals}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <p className="text-xs text-gray-500">Projected Growth</p>
                    <p className="text-2xl font-bold text-green-600">+{herdForecast.projectedGrowth}%</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <p className="text-xs text-gray-500">Avg Animal Value</p>
                    <p className="text-2xl font-bold">R 12.5K</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <p className="text-xs text-gray-500">Profit Margin</p>
                    <p className="text-2xl font-bold text-blue-600">50%</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <p className="text-xs text-gray-500">ROI</p>
                    <p className="text-2xl font-bold text-purple-600">100%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
