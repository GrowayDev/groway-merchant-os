'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import {
  Egg,
  Heart,
  Syringe,
  Scale,
  Users,
  AlertTriangle,
  ShieldCheck,
  Plus,
  RefreshCw,
  Target,
  DollarSign,
  Truck,
  Droplets,
  Thermometer,
  Beaker,
  TrendingUp,
  Calendar,
} from 'lucide-react'

// =====================================================
// POULTRY FARMING TYPES
// =====================================================

interface PoultryBatch {
  id: string
  batchNumber: string
  birdType: 'broiler' | 'layer' | 'dual_purpose' | 'duck' | 'turkey' | 'guinea_fowl'
  breed: string
  quantityPlaced: number
  quantityCurrent: number
  placementDate: string
  expectedSlaughterDate?: string
  hatchery?: string
  houseId: string
  houseName: string
  status: 'active' | 'sold' | 'depleted'
  mortality: number
  culls: number
  avgWeight?: number
  feedConsumedKg: number
  // Layer specific
  eggsProduced?: number
  eggsToday?: number
  layRate?: number
  // Compliance
  vaccinationStatus: 'up_to_date' | 'overdue' | 'pending'
  biosecurityCheck: boolean
}

interface DailyRecord {
  id: string
  batchId: string
  date: string
  mortality: number
  culls: number
  feedKg: number
  waterL: number
  eggsCollected?: number
  avgWeight?: number
  temperature?: number
  humidity?: number
  notes?: string
}

// =====================================================
// CONSTANTS
// =====================================================

const birdTypes = [
  { value: 'broiler', label: 'Broiler', purpose: 'meat', cycleDays: 42 },
  { value: 'layer', label: 'Layer', purpose: 'eggs', cycleDays: 72 },
  { value: 'dual_purpose', label: 'Dual Purpose', purpose: 'both', cycleDays: 60 },
  { value: 'duck', label: 'Duck', purpose: 'meat_eggs', cycleDays: 56 },
  { value: 'turkey', label: 'Turkey', purpose: 'meat', cycleDays: 120 },
  { value: 'guinea_fowl', label: 'Guinea Fowl', purpose: 'meat', cycleDays: 98 },
]

const poultryBreeds = [
  { value: 'ross_308', label: 'Ross 308', type: 'broiler' },
  { value: 'cobb_500', label: 'Cobb 500', type: 'broiler' },
  { value: 'hubbard', label: 'Hubbard', type: 'broiler' },
  { value: 'hy_line_brown', label: 'Hy-Line Brown', type: 'layer' },
  { value: 'hendrix', label: 'Hendrix', type: 'layer' },
  { value: 'lohmann_brown', label: 'Lohmann Brown', type: 'layer' },
  { value: 'potchefstroom_koekoek', label: 'Potchefstroom Koekoek', type: 'dual_purpose' },
  { value: 'ovambo', label: 'Ovambo', type: 'dual_purpose' },
  { value: 'venda', label: 'Venda', type: 'dual_purpose' },
  { value: 'pekin_duck', label: 'Pekin Duck', type: 'duck' },
]

// Helper
const formatNumber = (n: number) => n.toLocaleString()

const calculateMortalityRate = (batch: PoultryBatch) => {
  const lost = batch.quantityPlaced - batch.quantityCurrent
  return batch.quantityPlaced > 0 ? ((lost / batch.quantityPlaced) * 100).toFixed(1) : '0'
}

const calculateFCR = (batch: PoultryBatch) => {
  if (!batch.avgWeight || batch.quantityCurrent === 0) return 'N/A'
  const totalWeight = batch.avgWeight * batch.quantityCurrent
  return (batch.feedConsumedKg / totalWeight).toFixed(2)
}

// Empty State
function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: {
  icon: React.ElementType
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-[#E0F2F1] flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-[#00897B]" />
      </div>
      <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">{title}</h3>
      <p className="text-sm text-[#757575] max-w-sm mb-4">{description}</p>
      {actionLabel && onAction && (
        <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={onAction}>
          <Plus className="h-4 w-4 mr-2" />{actionLabel}
        </Button>
      )}
    </div>
  )
}

// Stat Card
function StatCard({ icon: Icon, label, value, subValue, iconColor = '#00897B' }: {
  icon: React.ElementType
  label: string
  value: string | number
  subValue?: string
  iconColor?: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="h-4 w-4" style={{ color: iconColor }} />
          <span className="text-xs text-[#757575]">{label}</span>
        </div>
        <p className="text-2xl font-bold">{value}</p>
        {subValue && <p className="text-xs text-[#757575]">{subValue}</p>}
      </CardContent>
    </Card>
  )
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export function PoultryFarmingView() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  
  const [batches, setBatches] = useState<PoultryBatch[]>([])
  const [addBatchDialogOpen, setAddBatchDialogOpen] = useState(false)
  const [dailyRecordDialogOpen, setDailyRecordDialogOpen] = useState(false)
  
  const [newBatch, setNewBatch] = useState({
    batchNumber: '',
    birdType: 'broiler' as PoultryBatch['birdType'],
    breed: '',
    quantityPlaced: '',
    placementDate: '',
    hatchery: '',
    houseId: '',
    houseName: '',
  })

  useEffect(() => {
    setTimeout(() => setLoading(false), 500)
  }, [])

  const stats = useMemo(() => {
    const active = batches.filter(b => b.status === 'active')
    const totalBirds = active.reduce((sum, b) => sum + b.quantityCurrent, 0)
    const totalMortality = active.reduce((sum, b) => sum + b.mortality, 0)
    const totalFeed = active.reduce((sum, b) => sum + b.feedConsumedKg, 0)
    const totalEggs = active.reduce((sum, b) => sum + (b.eggsProduced || 0), 0)
    const eggsToday = active.reduce((sum, b) => sum + (b.eggsToday || 0), 0)
    const broilers = active.filter(b => b.birdType === 'broiler').reduce((sum, b) => sum + b.quantityCurrent, 0)
    const layers = active.filter(b => b.birdType === 'layer').reduce((sum, b) => sum + b.quantityCurrent, 0)
    const avgLayRate = layers > 0 ? active.filter(b => b.birdType === 'layer').reduce((sum, b) => sum + (b.layRate || 0), 0) / active.filter(b => b.birdType === 'layer').length : 0
    const vaccinationOverdue = active.filter(b => b.vaccinationStatus === 'overdue').length
    const biosecurityIssues = active.filter(b => !b.biosecurityCheck).length

    return {
      totalBatches: active.length,
      totalBirds,
      totalMortality,
      mortalityRate: totalBirds + totalMortality > 0 ? ((totalMortality / (totalBirds + totalMortality)) * 100).toFixed(1) : '0',
      totalFeed,
      totalEggs,
      eggsToday,
      broilers,
      layers,
      avgLayRate: avgLayRate.toFixed(1),
      vaccinationOverdue,
      biosecurityIssues,
    }
  }, [batches])

  const handleAddBatch = () => {
    const batch: PoultryBatch = {
      id: `batch-${Date.now()}`,
      ...newBatch,
      quantityPlaced: parseInt(newBatch.quantityPlaced) || 0,
      quantityCurrent: parseInt(newBatch.quantityPlaced) || 0,
      status: 'active',
      mortality: 0,
      culls: 0,
      feedConsumedKg: 0,
      vaccinationStatus: 'pending',
      biosecurityCheck: false,
    }
    setBatches(prev => [...prev, batch])
    setAddBatchDialogOpen(false)
    setNewBatch({
      batchNumber: '',
      birdType: 'broiler',
      breed: '',
      quantityPlaced: '',
      placementDate: '',
      hatchery: '',
      houseId: '',
      houseName: '',
    })
  }

  if (loading) {
    return <div className="flex-1 flex items-center justify-center bg-[#FAFAFA]"><RefreshCw className="h-8 w-8 animate-spin text-[#00897B]" /></div>
  }

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b">
        <div className="flex items-center gap-2">
          <Egg className="h-5 w-5 text-[#00897B]" />
          <h2 className="font-semibold text-[#1A1A1A]">Poultry Farming</h2>
          <Badge variant="outline" className="bg-amber-50 text-amber-700">{formatNumber(stats.totalBirds)} birds</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><RefreshCw className="h-4 w-4 mr-1" />Refresh</Button>
          <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setAddBatchDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />New Batch
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-4 pt-2 bg-white border-b">
          <TabsList className="bg-transparent h-10 flex-wrap">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Dashboard</TabsTrigger>
            <TabsTrigger value="batches" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Batches</TabsTrigger>
            <TabsTrigger value="eggs" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Egg Production</TabsTrigger>
            <TabsTrigger value="feed" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Feed</TabsTrigger>
            <TabsTrigger value="health" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Health</TabsTrigger>
            <TabsTrigger value="biosecurity" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Biosecurity</TabsTrigger>
            <TabsTrigger value="compliance" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Compliance</TabsTrigger>
          </TabsList>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {/* Dashboard */}
          <TabsContent value="dashboard" className="m-0 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <StatCard icon={Egg} label="Total Birds" value={formatNumber(stats.totalBirds)} subValue={`${stats.totalBatches} batches`} />
              <StatCard icon={Heart} label="Mortality" value={`${stats.mortalityRate}%`} subValue={`${formatNumber(stats.totalMortality)} birds`} iconColor="#ef4444" />
              <StatCard icon={Target} label="Broilers" value={formatNumber(stats.broilers)} subValue="meat birds" />
              <StatCard icon={Egg} label="Layers" value={formatNumber(stats.layers)} subValue={`${stats.avgLayRate}% lay rate`} />
              <StatCard icon={Syringe} label="Vaccinations" value={stats.vaccinationOverdue} subValue="overdue" iconColor="#f59e0b" />
              <StatCard icon={ShieldCheck} label="Biosecurity" value={stats.biosecurityIssues} subValue="issues" iconColor="#ef4444" />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2"><Target className="h-5 w-5 text-[#00897B]" />Batch Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  {batches.length === 0 ? (
                    <EmptyState icon={Egg} title="No Batches" description="Start by placing your first batch." actionLabel="New Batch" onAction={() => setAddBatchDialogOpen(true)} />
                  ) : (
                    <div className="space-y-3">
                      {batches.filter(b => b.status === 'active').slice(0, 5).map(batch => (
                        <div key={batch.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{batch.batchNumber}</span>
                            <Badge variant="outline">{birdTypes.find(t => t.value === batch.birdType)?.label}</Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs text-[#757575]">
                            <span>{formatNumber(batch.quantityCurrent)} birds</span>
                            <span>Mortality: {calculateMortalityRate(batch)}%</span>
                          </div>
                          <Progress value={(batch.quantityCurrent / batch.quantityPlaced) * 100} className="h-1.5 mt-2" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2"><Droplets className="h-5 w-5 text-[#00897B]" />Egg Production (Today)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <p className="text-4xl font-bold text-[#00897B]">{formatNumber(stats.eggsToday)}</p>
                    <p className="text-sm text-[#757575]">eggs collected today</p>
                    <p className="text-xs text-[#757575] mt-2">Total: {formatNumber(stats.totalEggs)} eggs this cycle</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="p-3 bg-amber-50 rounded-lg text-center">
                      <p className="text-lg font-bold text-amber-700">{stats.avgLayRate}%</p>
                      <p className="text-xs text-amber-600">Avg Lay Rate</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg text-center">
                      <p className="text-lg font-bold text-green-700">{stats.layers > 0 ? Math.round(stats.eggsToday / stats.layers * 100) : 0}%</p>
                      <p className="text-xs text-green-600">Today&apos;s Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* SA Compliance */}
            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-amber-500" />SA Poultry Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Avian Influenza (Bird Flu)</p>
                      <p className="text-[#757575]">Monitor and report any unusual mortality to state vet</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Newcastle Disease</p>
                      <p className="text-[#757575]">Mandatory vaccination per DAFF requirements</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Biosecurity Standards</p>
                      <p className="text-[#757575]">Maintain records of visitor logs and vehicle movements</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Feed & Water Records</p>
                      <p className="text-[#757575]">Document feed sources and water quality tests</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Other Tabs */}
          <TabsContent value="batches" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={Egg} title="Batch Management" description="Track bird placements, growth, and performance." actionLabel="New Batch" onAction={() => setAddBatchDialogOpen(true)} /></CardContent></Card>
          </TabsContent>
          <TabsContent value="eggs" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={Egg} title="Egg Production" description="Track daily egg collection, grades, and quality." actionLabel="Record Collection" /></CardContent></Card>
          </TabsContent>
          <TabsContent value="feed" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={Target} title="Feed Management" description="Track feed consumption, FCR, and costs." actionLabel="Add Feed Record" /></CardContent></Card>
          </TabsContent>
          <TabsContent value="health" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={Heart} title="Health & Vaccinations" description="Manage vaccination schedules and health records." actionLabel="Add Health Record" /></CardContent></Card>
          </TabsContent>
          <TabsContent value="biosecurity" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={ShieldCheck} title="Biosecurity" description="Visitor logs, vehicle disinfection, and PPE records." actionLabel="Add Record" /></CardContent></Card>
          </TabsContent>
          <TabsContent value="compliance" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={ShieldCheck} title="Compliance" description="DAFF requirements, health certificates, and movement permits." actionLabel="Add Item" /></CardContent></Card>
          </TabsContent>
        </div>
      </Tabs>
      
      {/* Add Batch Dialog */}
      <Dialog open={addBatchDialogOpen} onOpenChange={setAddBatchDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Egg className="h-5 w-5 text-[#00897B]" />New Batch Placement</DialogTitle>
            <DialogDescription>Record a new batch placement</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Batch Number *</Label>
                <Input value={newBatch.batchNumber} onChange={(e) => setNewBatch(prev => ({ ...prev, batchNumber: e.target.value }))} placeholder="e.g., B-2024-001" />
              </div>
              <div>
                <Label>Bird Type *</Label>
                <Select value={newBatch.birdType} onValueChange={(v) => setNewBatch(prev => ({ ...prev, birdType: v as PoultryBatch['birdType'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {birdTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Breed *</Label>
                <Select value={newBatch.breed} onValueChange={(v) => setNewBatch(prev => ({ ...prev, breed: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select breed" /></SelectTrigger>
                  <SelectContent>
                    {poultryBreeds.filter(b => newBatch.birdType === 'broiler' ? b.type === 'broiler' : newBatch.birdType === 'layer' ? b.type === 'layer' : true).map(b => (
                      <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Quantity Placed *</Label>
                <Input type="number" value={newBatch.quantityPlaced} onChange={(e) => setNewBatch(prev => ({ ...prev, quantityPlaced: e.target.value }))} placeholder="e.g., 1000" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Placement Date *</Label>
                <Input type="date" value={newBatch.placementDate} onChange={(e) => setNewBatch(prev => ({ ...prev, placementDate: e.target.value }))} />
              </div>
              <div>
                <Label>Hatchery</Label>
                <Input value={newBatch.hatchery} onChange={(e) => setNewBatch(prev => ({ ...prev, hatchery: e.target.value }))} placeholder="e.g., Elite Chicks" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>House/Pen *</Label>
                <Input value={newBatch.houseName} onChange={(e) => setNewBatch(prev => ({ ...prev, houseName: e.target.value }))} placeholder="e.g., House 1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddBatchDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleAddBatch} disabled={!newBatch.batchNumber || !newBatch.breed || !newBatch.quantityPlaced || !newBatch.placementDate}>
              Create Batch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
