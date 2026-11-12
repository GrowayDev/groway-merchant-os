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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts'
import {
  Scale,
  TrendingUp,
  TrendingDown,
  Camera,
  Plus,
  Calendar,
  Loader2,
  RefreshCw,
  Activity,
  Target,
  AlertTriangle,
} from 'lucide-react'

// ============================================
// TYPES
// ============================================

interface WeightRecord {
  id: string
  animalId: string
  animalTag?: string
  weight: number
  weightUnit: string
  method: string
  bodyConditionScore?: number
  daysSinceLast?: number
  weightGain?: number
  adg?: number
  weighedAt: string
  notes?: string
}

interface AnimalWeightHistory {
  animalId: string
  animalTag: string
  species: string
  currentWeight: number
  birthWeight?: number
  records: WeightRecord[]
  avgDailyGain: number | null
  targetWeight?: number
}

interface WeightStats {
  totalWeighed: number
  avgWeight: number
  avgADG: number
  underweight: number
  onTarget: number
  overweight: number
}

interface WeightTrackingPanelProps {
  farmId: string
}

const chartConfig: ChartConfig = {
  weight: { label: 'Weight (kg)', color: '#8B4513' },
  adg: { label: 'ADG (kg/day)', color: '#22c55e' },
  target: { label: 'Target', color: '#f59e0b' },
}

const methodColors: Record<string, string> = {
  MANUAL: 'bg-green-100 text-green-800',
  SCALE: 'bg-blue-100 text-blue-800',
  AI_ESTIMATE: 'bg-purple-100 text-purple-800',
  VISUAL: 'bg-amber-100 text-amber-800',
}

// ============================================
// MAIN COMPONENT
// ============================================

export function WeightTrackingPanel({ farmId }: WeightTrackingPanelProps) {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>([])
  const [animalHistories, setAnimalHistories] = useState<AnimalWeightHistory[]>([])
  const [stats, setStats] = useState<WeightStats | null>(null)
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalWeightHistory | null>(null)
  const [addWeightDialogOpen, setAddWeightDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [weightForm, setWeightForm] = useState({
    animalTag: '',
    weight: '',
    method: 'MANUAL',
    bodyConditionScore: '3',
    notes: '',
  })

  // Fetch data
  const fetchData = async () => {
    try {
      const sessionStr = localStorage.getItem('groway_session')
      const session = sessionStr ? JSON.parse(sessionStr) : null
      const merchantId = session?.merchantId || 'test-merchant'

      const response = await fetch(
        `/api/merchant-os/agriculture/livestock/weight?merchantId=${merchantId}&farmId=${farmId}`
      )

      if (response.ok) {
        const data = await response.json()
        setWeightRecords(data.records || [])
        setAnimalHistories(data.histories || [])
        setStats(data.stats || null)
      }
    } catch (error) {
      console.error('Failed to fetch weight data:', error)
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

  const handleAddWeight = async () => {
    setSubmitting(true)
    try {
      const sessionStr = localStorage.getItem('groway_session')
      const session = sessionStr ? JSON.parse(sessionStr) : null
      const merchantId = session?.merchantId || 'test-merchant'

      const response = await fetch(`/api/merchant-os/agriculture/livestock/weight?merchantId=${merchantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmId,
          ...weightForm,
          weight: parseFloat(weightForm.weight),
          bodyConditionScore: parseInt(weightForm.bodyConditionScore),
        }),
      })

      if (response.ok) {
        setAddWeightDialogOpen(false)
        setWeightForm({
          animalTag: '',
          weight: '',
          method: 'MANUAL',
          bodyConditionScore: '3',
          notes: '',
        })
        fetchData()
      }
    } catch (error) {
      console.error('Failed to add weight record:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Prepare chart data for selected animal
  const chartData = selectedAnimal?.records.map((record, index) => ({
    date: new Date(record.weighedAt).toLocaleDateString(),
    weight: record.weight,
    adg: record.adg || (index > 0 ? (record.weight - selectedAnimal.records[index - 1].weight) / (record.daysSinceLast || 1) : 0),
  })) || []

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
            <Scale className="w-5 h-5" />
            Weight Tracking
          </h2>
          <p className="text-sm text-gray-500">Monitor growth and weight trends</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" className="bg-amber-600 hover:bg-amber-700" onClick={() => setAddWeightDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Record Weight
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">Total Weighed</p>
              <p className="text-2xl font-bold">{stats.totalWeighed}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">Avg Weight</p>
              <p className="text-2xl font-bold">{stats.avgWeight.toFixed(1)} kg</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">Avg ADG</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.avgADG.toFixed(2)} kg/d
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-red-500" />
                Underweight
              </p>
              <p className="text-2xl font-bold text-red-600">{stats.underweight}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Target className="w-3 h-3 text-green-500" />
                On Target
              </p>
              <p className="text-2xl font-bold text-green-600">{stats.onTarget}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-amber-500" />
                Overweight
              </p>
              <p className="text-2xl font-bold text-amber-600">{stats.overweight}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="records" className="space-y-4">
        <TabsList>
          <TabsTrigger value="records">Recent Records</TabsTrigger>
          <TabsTrigger value="history">Animal History</TabsTrigger>
          <TabsTrigger value="trends">Growth Trends</TabsTrigger>
        </TabsList>

        {/* Recent Records Tab */}
        <TabsContent value="records">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Weight Records</CardTitle>
              <CardDescription>Latest weight measurements across all animals</CardDescription>
            </CardHeader>
            <CardContent>
              {weightRecords.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Scale className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No weight records yet</p>
                  <p className="text-sm">Record weights to track growth</p>
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {weightRecords.map((record) => (
                      <div key={record.id} className="flex items-center gap-4 p-3 rounded-lg border hover:bg-gray-50">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                          <Scale className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{record.animalTag || record.animalId}</p>
                            <Badge className={methodColors[record.method] || 'bg-gray-100'}>
                              {record.method.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500">
                            {record.weight} {record.weightUnit}
                            {record.weightGain && ` (${record.weightGain > 0 ? '+' : ''}${record.weightGain.toFixed(1)} kg)`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {record.adg !== undefined && record.adg !== null && (
                              <span className={record.adg >= 0 ? 'text-green-600' : 'text-red-600'}>
                                ADG: {record.adg.toFixed(2)} kg/d
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(record.weighedAt).toLocaleDateString()}
                          </p>
                        </div>
                        {record.bodyConditionScore && (
                          <Badge variant="outline">BCS: {record.bodyConditionScore}/5</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Animal History Tab */}
        <TabsContent value="history">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Animal List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">Animals</CardTitle>
                <CardDescription>Select an animal to view weight history</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {animalHistories.map((animal) => (
                      <div
                        key={animal.animalId}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedAnimal?.animalId === animal.animalId
                            ? 'bg-amber-50 border-amber-300'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedAnimal(animal)}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{animal.animalTag}</p>
                          <Badge variant="outline">{animal.species}</Badge>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-sm text-gray-500">{animal.currentWeight} kg</p>
                          {animal.avgDailyGain !== null && (
                            <p className={`text-xs ${animal.avgDailyGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {animal.avgDailyGain.toFixed(2)} kg/d
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Weight History Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">
                  {selectedAnimal ? `Weight History: ${selectedAnimal.animalTag}` : 'Select an Animal'}
                </CardTitle>
                <CardDescription>Weight progression over time</CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedAnimal ? (
                  <div className="text-center py-12 text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>Select an animal from the list</p>
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Scale className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No weight history available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-xs text-gray-500">Current</p>
                        <p className="text-lg font-bold">{selectedAnimal.currentWeight} kg</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Birth Weight</p>
                        <p className="text-lg font-bold">{selectedAnimal.birthWeight || 'N/A'} kg</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Avg Daily Gain</p>
                        <p className={`text-lg font-bold ${selectedAnimal.avgDailyGain && selectedAnimal.avgDailyGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedAnimal.avgDailyGain?.toFixed(2) || 'N/A'} kg/d
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Records</p>
                        <p className="text-lg font-bold">{selectedAnimal.records.length}</p>
                      </div>
                    </div>

                    {/* Chart */}
                    <ChartContainer config={chartConfig} className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="weight"
                            stroke="#8B4513"
                            strokeWidth={2}
                            dot={{ fill: '#8B4513' }}
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="adg"
                            stroke="#22c55e"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={{ fill: '#22c55e' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>

                    {/* Legend */}
                    <div className="flex items-center justify-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-700" />
                        <span>Weight (kg)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span>ADG (kg/day)</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Growth Trends Tab */}
        <TabsContent value="trends">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Species Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Weight Distribution by Species</CardTitle>
                <CardDescription>Average weights across species</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { species: 'Cattle', avgWeight: 450, count: 120 },
                        { species: 'Sheep', avgWeight: 65, count: 85 },
                        { species: 'Goats', avgWeight: 45, count: 45 },
                        { species: 'Pigs', avgWeight: 110, count: 200 },
                        { species: 'Poultry', avgWeight: 2.5, count: 1500 },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="species" />
                      <YAxis yAxisId="left" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar yAxisId="left" dataKey="avgWeight" fill="#8B4513" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* ADG Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">ADG Performance</CardTitle>
                <CardDescription>Average daily gain by classification</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { classification: 'Breeding', adg: 0.8, target: 0.75 },
                        { classification: 'Commercial', adg: 1.2, target: 1.0 },
                        { classification: 'Replacement', adg: 0.9, target: 0.85 },
                        { classification: 'Weanlings', adg: 1.1, target: 1.0 },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="classification" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="adg" fill="#22c55e" radius={[4, 4, 0, 0]} name="Actual ADG" />
                      <Bar dataKey="target" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Target" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Weight Dialog */}
      <Dialog open={addWeightDialogOpen} onOpenChange={setAddWeightDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Weight</DialogTitle>
            <DialogDescription>Add a weight measurement for an animal</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="animalTag">Animal Tag/ID</Label>
              <Input
                id="animalTag"
                placeholder="e.g., C001"
                value={weightForm.animalTag}
                onChange={(e) => setWeightForm({ ...weightForm, animalTag: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 450"
                  value={weightForm.weight}
                  onChange={(e) => setWeightForm({ ...weightForm, weight: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="method">Method</Label>
                <Select
                  value={weightForm.method}
                  onValueChange={(value) => setWeightForm({ ...weightForm, method: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MANUAL">Manual</SelectItem>
                    <SelectItem value="SCALE">Scale</SelectItem>
                    <SelectItem value="AI_ESTIMATE">AI Estimate</SelectItem>
                    <SelectItem value="VISUAL">Visual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                placeholder="Any observations..."
                value={weightForm.notes}
                onChange={(e) => setWeightForm({ ...weightForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddWeightDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddWeight}
              disabled={submitting || !weightForm.animalTag || !weightForm.weight}
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
    </div>
  )
}
