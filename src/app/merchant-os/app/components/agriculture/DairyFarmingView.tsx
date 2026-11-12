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
  Droplets,
  Heart,
  Syringe,
  Scale,
  Thermometer,
  Beaker,
  AlertTriangle,
  ShieldCheck,
  Plus,
  RefreshCw,
  Target,
  DollarSign,
  Truck,
  Calendar,
  TrendingUp,
  Users,
  Clock,
} from 'lucide-react'

// =====================================================
// DAIRY FARMING TYPES
// =====================================================

interface DairyAnimal {
  id: string
  identificationNumber: string
  breed: string
  gender: 'cow' | 'heifer' | 'calf_female' | 'calf_male' | 'bull'
  dateOfBirth: string
  weightCurrent?: number
  status: 'active' | 'dry' | 'sold' | 'deceased'
  healthStatus: 'healthy' | 'sick' | 'mastitis' | 'lameness'
  lactationNumber?: number
  daysInMilk?: number
  lastCalvingDate?: string
  expectedCalvingDate?: string
  dryOffDate?: string
  avgDailyYield?: number
  totalLactationYield?: number
  // Quality metrics
  avgButterfat?: number
  avgProtein?: number
  sccCount?: number // Somatic Cell Count
  bactoscan?: number
  location: string
  legalMarkingCompliant: boolean
}

interface MilkRecord {
  id: string
  date: string
  shift: 'morning' | 'afternoon' | 'evening'
  totalLiters: number
  avgButterfat: number
  avgProtein: number
  sccCount: number
  bactoscan: number
  temperature: number
  tankLevel: number
  collector?: string
  receiptNumber?: string
}

interface TankRecord {
  id: string
  date: string
  tankId: string
  capacity: number
  currentLevel: number
  temperature: number
  cleaningStatus: 'clean' | 'pending' | 'in_progress'
  lastCleaned: string
}

// =====================================================
// CONSTANTS - SOUTH AFRICAN DAIRY BREEDS
// =====================================================

const dairyBreeds = [
  { value: 'holstein', label: 'Holstein Friesian', type: 'dairy' },
  { value: 'jersey', label: 'Jersey', type: 'dairy' },
  { value: 'guernsey', label: 'Guernsey', type: 'dairy' },
  { value: 'aryshire', label: 'Ayrshire', type: 'dairy' },
  { value: 'brown_swiss', label: 'Brown Swiss', type: 'dairy' },
  { value: 'sahiwal', label: 'Sahiwal', type: 'dual' },
  { value: 'milking_shorthorn', label: 'Milking Shorthorn', type: 'dairy' },
]

const milkQualityStandards = [
  { metric: 'Butterfat', min: 3.2, max: 5.0, unit: '%' },
  { metric: 'Protein', min: 3.0, max: 4.0, unit: '%' },
  { metric: 'SCC', min: 0, max: 400000, unit: 'cells/ml' },
  { metric: 'Bactoscan', min: 0, max: 100000, unit: 'cfu/ml' },
  { metric: 'Temperature', min: 2, max: 4, unit: '°C' },
]

// Helper functions
const formatLiters = (liters: number) => `${liters.toLocaleString()} L`
const formatCurrency = (amount: number) => `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`

const calculateAge = (dob: string) => {
  const birth = new Date(dob)
  const today = new Date()
  const months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth())
  if (months < 12) return `${months} mo`
  const years = Math.floor(months / 12)
  const rem = months % 12
  return rem > 0 ? `${years}y ${rem}mo` : `${years}y`
}

const getDIMColor = (dim: number) => {
  if (dim < 100) return 'text-green-600'
  if (dim < 200) return 'text-blue-600'
  if (dim < 305) return 'text-amber-600'
  return 'text-red-600'
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

export function DairyFarmingView() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')

  const [animals, setAnimals] = useState<DairyAnimal[]>([])
  const [milkRecords, setMilkRecords] = useState<MilkRecord[]>([])
  const [tanks, setTanks] = useState<TankRecord[]>([])
  const [addAnimalDialogOpen, setAddAnimalDialogOpen] = useState(false)
  const [milkRecordDialogOpen, setMilkRecordDialogOpen] = useState(false)

  const [newAnimal, setNewAnimal] = useState({
    identificationNumber: '',
    breed: '',
    gender: 'heifer' as DairyAnimal['gender'],
    dateOfBirth: '',
    lactationNumber: '',
    lastCalvingDate: '',
    location: '',
  })

  const [newMilkRecord, setNewMilkRecord] = useState({
    date: new Date().toISOString().split('T')[0],
    shift: 'morning' as MilkRecord['shift'],
    totalLiters: '',
    avgButterfat: '',
    avgProtein: '',
    sccCount: '',
    temperature: '3.5',
  })

  useEffect(() => {
    setTimeout(() => setLoading(false), 500)
  }, [])

  const stats = useMemo(() => {
    const active = animals.filter(a => a.status !== 'sold' && a.status !== 'deceased')
    const milking = active.filter(a => a.status === 'active' && a.daysInMilk && a.daysInMilk < 305)
    const dry = active.filter(a => a.status === 'dry')
    const heifers = active.filter(a => a.gender === 'heifer').length
    const calves = active.filter(a => a.gender.includes('calf')).length
    const bulls = active.filter(a => a.gender === 'bull').length

    const totalDailyYield = milking.reduce((sum, a) => sum + (a.avgDailyYield || 0), 0)
    const avgYield = milking.length > 0 ? totalDailyYield / milking.length : 0
    const avgDIM = milking.length > 0 ? milking.reduce((sum, a) => sum + (a.daysInMilk || 0), 0) / milking.length : 0

    const healthIssues = active.filter(a => a.healthStatus !== 'healthy').length
    const mastitisCases = active.filter(a => a.healthStatus === 'mastitis').length

    const todayMilk = milkRecords.filter(r => r.date === new Date().toISOString().split('T')[0])
    const todayTotal = todayMilk.reduce((sum, r) => sum + r.totalLiters, 0)

    const avgSCC = milkRecords.length > 0 ? milkRecords.reduce((sum, r) => sum + r.sccCount, 0) / milkRecords.length : 0
    const avgButterfat = milkRecords.length > 0 ? milkRecords.reduce((sum, r) => sum + r.avgButterfat, 0) / milkRecords.length : 0

    const nonCompliant = active.filter(a => !a.legalMarkingCompliant).length

    return {
      totalHerd: active.length,
      milkingCows: milking.length,
      dryCows: dry.length,
      heifers,
      calves,
      bulls,
      totalDailyYield,
      avgYield: avgYield.toFixed(1),
      avgDIM: Math.round(avgDIM),
      healthIssues,
      mastitisCases,
      todayMilk: todayTotal,
      avgSCC: Math.round(avgSCC),
      avgButterfat: avgButterfat.toFixed(2),
      nonCompliant,
    }
  }, [animals, milkRecords])

  const handleAddAnimal = () => {
    const animal: DairyAnimal = {
      id: `dairy-${Date.now()}`,
      ...newAnimal,
      lactationNumber: parseInt(newAnimal.lactationNumber) || undefined,
      status: 'active',
      healthStatus: 'healthy',
      legalMarkingCompliant: false,
    }
    setAnimals(prev => [...prev, animal])
    setAddAnimalDialogOpen(false)
    setNewAnimal({
      identificationNumber: '',
      breed: '',
      gender: 'heifer',
      dateOfBirth: '',
      lactationNumber: '',
      lastCalvingDate: '',
      location: '',
    })
  }

  const handleAddMilkRecord = () => {
    const record: MilkRecord = {
      id: `milk-${Date.now()}`,
      ...newMilkRecord,
      totalLiters: parseFloat(newMilkRecord.totalLiters) || 0,
      avgButterfat: parseFloat(newMilkRecord.avgButterfat) || 0,
      avgProtein: parseFloat(newMilkRecord.avgProtein) || 0,
      sccCount: parseInt(newMilkRecord.sccCount) || 0,
      temperature: parseFloat(newMilkRecord.temperature) || 3.5,
      bactoscan: 0,
      tankLevel: 0,
    }
    setMilkRecords(prev => [...prev, record])
    setMilkRecordDialogOpen(false)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#FAFAFA]">
        <RefreshCw className="h-8 w-8 animate-spin text-[#00897B]" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b">
        <div className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-[#00897B]" />
          <h2 className="font-semibold text-[#1A1A1A]">Dairy Farming</h2>
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {stats.milkingCows} milking
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />Refresh
          </Button>
          <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setAddAnimalDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />Add Animal
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-4 pt-2 bg-white border-b">
          <TabsList className="bg-transparent h-10 flex-wrap">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Dashboard</TabsTrigger>
            <TabsTrigger value="herd" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Herd</TabsTrigger>
            <TabsTrigger value="production" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Milk Production</TabsTrigger>
            <TabsTrigger value="quality" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Quality</TabsTrigger>
            <TabsTrigger value="tanks" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Cooling Tanks</TabsTrigger>
            <TabsTrigger value="breeding" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Breeding</TabsTrigger>
            <TabsTrigger value="health" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Health</TabsTrigger>
            <TabsTrigger value="compliance" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Compliance</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Dashboard */}
          <TabsContent value="dashboard" className="m-0 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <StatCard icon={Droplets} label="Today's Milk" value={formatLiters(stats.todayMilk)} subValue={`${stats.milkingCows} cows`} />
              <StatCard icon={TrendingUp} label="Avg Yield" value={`${stats.avgYield} L/cow`} subValue="daily average" />
              <StatCard icon={Beaker} label="Avg Butterfat" value={`${stats.avgButterfat}%`} subValue="quality metric" />
              <StatCard icon={Thermometer} label="Avg SCC" value={stats.avgSCC.toLocaleString()} subValue="cells/ml" iconColor={stats.avgSCC > 400000 ? '#ef4444' : '#00897B'} />
              <StatCard icon={Heart} label="Health Issues" value={stats.healthIssues} subValue={`${stats.mastitisCases} mastitis`} iconColor="#ef4444" />
              <StatCard icon={Clock} label="Avg DIM" value={`${stats.avgDIM} days`} subValue="days in milk" />
            </div>

            {/* Herd Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#00897B]" />
                    Herd Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {animals.length === 0 ? (
                    <EmptyState icon={Droplets} title="No Dairy Animals" description="Start by adding your dairy herd." actionLabel="Add First Animal" onAction={() => setAddAnimalDialogOpen(true)} />
                  ) : (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg text-center">
                        <p className="text-3xl font-bold text-blue-700">{stats.milkingCows}</p>
                        <p className="text-sm text-blue-600">Milking</p>
                      </div>
                      <div className="p-4 bg-amber-50 rounded-lg text-center">
                        <p className="text-3xl font-bold text-amber-700">{stats.dryCows}</p>
                        <p className="text-sm text-amber-600">Dry</p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg text-center">
                        <p className="text-3xl font-bold text-purple-700">{stats.heifers}</p>
                        <p className="text-sm text-purple-600">Heifers</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg text-center">
                        <p className="text-3xl font-bold text-green-700">{stats.calves}</p>
                        <p className="text-sm text-green-600">Calves</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg text-center">
                        <p className="text-3xl font-bold text-gray-700">{stats.bulls}</p>
                        <p className="text-sm text-gray-600">Bulls</p>
                      </div>
                      <div className="p-4 bg-pink-50 rounded-lg text-center">
                        <p className="text-2xl font-bold text-pink-700">{stats.avgYield}L</p>
                        <p className="text-sm text-pink-600">Avg Daily</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Beaker className="h-5 w-5 text-[#00897B]" />
                    Milk Quality
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Butterfat</span>
                        <span className="font-medium">{stats.avgButterfat}%</span>
                      </div>
                      <Progress value={(parseFloat(stats.avgButterfat) / 5) * 100} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>SCC Level</span>
                        <span className={`font-medium ${stats.avgSCC > 400000 ? 'text-red-600' : 'text-green-600'}`}>
                          {stats.avgSCC > 400000 ? 'High' : 'Normal'}
                        </span>
                      </div>
                      <Progress value={Math.min((stats.avgSCC / 400000) * 100, 100)} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Today&apos;s Production</span>
                        <span className="font-medium">{formatLiters(stats.todayMilk)}</span>
                      </div>
                      <Progress value={(stats.todayMilk / (stats.milkingCows * 25)) * 100} className="h-2 [&>div]:bg-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  <Button variant="outline" className="h-auto py-3 flex-col" onClick={() => setMilkRecordDialogOpen(true)}>
                    <Droplets className="h-5 w-5 mb-1 text-[#00897B]" />
                    <span className="text-xs">Record Milk</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex-col" onClick={() => setAddAnimalDialogOpen(true)}>
                    <Plus className="h-5 w-5 mb-1 text-[#00897B]" />
                    <span className="text-xs">Add Animal</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex-col">
                    <Syringe className="h-5 w-5 mb-1 text-green-500" />
                    <span className="text-xs">Health</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex-col">
                    <Beaker className="h-5 w-5 mb-1 text-blue-500" />
                    <span className="text-xs">Quality Test</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex-col">
                    <Thermometer className="h-5 w-5 mb-1 text-amber-500" />
                    <span className="text-xs">Tank Check</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex-col">
                    <Truck className="h-5 w-5 mb-1 text-orange-500" />
                    <span className="text-xs">Collection</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* SA Compliance */}
            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-amber-500" />
                  SA Dairy Compliance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Milk Recording Scheme</p>
                      <p className="text-[#757575]">Register with SA Milk Recording Scheme for performance data</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Food Safety Standards</p>
                      <p className="text-[#757575]">Comply with R961 (Regulations relating to milk and dairy products)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Brucellosis Testing</p>
                      <p className="text-[#757575]">Annual testing required for all dairy herds</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Cooling Requirements</p>
                      <p className="text-[#757575]">Milk must be cooled to 4°C within 2 hours of milking</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other Tabs */}
          <TabsContent value="herd" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={Droplets} title="Herd Management" description="Manage your dairy herd including cows, heifers, and calves." actionLabel="Add Animal" onAction={() => setAddAnimalDialogOpen(true)} /></CardContent></Card>
          </TabsContent>
          <TabsContent value="production" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={Droplets} title="Milk Production" description="Record daily milk yields by shift and track production trends." actionLabel="Record Milk" onAction={() => setMilkRecordDialogOpen(true)} /></CardContent></Card>
          </TabsContent>
          <TabsContent value="quality" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={Beaker} title="Milk Quality" description="Track butterfat, protein, SCC, and bactoscan results." actionLabel="Add Quality Test" /></CardContent></Card>
          </TabsContent>
          <TabsContent value="tanks" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={Thermometer} title="Cooling Tanks" description="Monitor tank levels, temperatures, and cleaning schedules." actionLabel="Add Tank" /></CardContent></Card>
          </TabsContent>
          <TabsContent value="breeding" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={Target} title="Breeding Management" description="Track AI records, pregnancy checks, calving dates, and dry periods." actionLabel="Add Breeding Record" /></CardContent></Card>
          </TabsContent>
          <TabsContent value="health" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={Heart} title="Health & Mastitis Control" description="Manage herd health, mastitis cases, and treatment records." actionLabel="Add Health Record" /></CardContent></Card>
          </TabsContent>
          <TabsContent value="compliance" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={ShieldCheck} title="Compliance" description="Track dairy standards compliance, milk tests, and certifications." actionLabel="Add Compliance Item" /></CardContent></Card>
          </TabsContent>
        </div>
      </Tabs>

      {/* Add Animal Dialog */}
      <Dialog open={addAnimalDialogOpen} onOpenChange={setAddAnimalDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Droplets className="h-5 w-5 text-[#00897B]" />Register Dairy Animal</DialogTitle>
            <DialogDescription>Add a new dairy animal to your herd</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tag Number *</Label>
                <Input value={newAnimal.identificationNumber} onChange={(e) => setNewAnimal(prev => ({ ...prev, identificationNumber: e.target.value }))} placeholder="e.g., D-2024-001" />
              </div>
              <div>
                <Label>Breed *</Label>
                <Select value={newAnimal.breed} onValueChange={(v) => setNewAnimal(prev => ({ ...prev, breed: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select breed" /></SelectTrigger>
                  <SelectContent>
                    {dairyBreeds.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Gender *</Label>
                <Select value={newAnimal.gender} onValueChange={(v) => setNewAnimal(prev => ({ ...prev, gender: v as DairyAnimal['gender'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cow">Cow ♀</SelectItem>
                    <SelectItem value="heifer">Heifer ♀</SelectItem>
                    <SelectItem value="calf_female">Heifer Calf ♀</SelectItem>
                    <SelectItem value="calf_male">Bull Calf ♂</SelectItem>
                    <SelectItem value="bull">Bull ♂</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date of Birth *</Label>
                <Input type="date" value={newAnimal.dateOfBirth} onChange={(e) => setNewAnimal(prev => ({ ...prev, dateOfBirth: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Lactation Number</Label>
                <Input type="number" value={newAnimal.lactationNumber} onChange={(e) => setNewAnimal(prev => ({ ...prev, lactationNumber: e.target.value }))} placeholder="e.g., 2" />
              </div>
              <div>
                <Label>Last Calving Date</Label>
                <Input type="date" value={newAnimal.lastCalvingDate} onChange={(e) => setNewAnimal(prev => ({ ...prev, lastCalvingDate: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Location</Label>
              <Input value={newAnimal.location} onChange={(e) => setNewAnimal(prev => ({ ...prev, location: e.target.value }))} placeholder="e.g., Milking Parlour" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddAnimalDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleAddAnimal} disabled={!newAnimal.identificationNumber || !newAnimal.breed || !newAnimal.dateOfBirth}>
              Register
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Milk Record Dialog */}
      <Dialog open={milkRecordDialogOpen} onOpenChange={setMilkRecordDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Droplets className="h-5 w-5 text-[#00897B]" />Record Milk Production</DialogTitle>
            <DialogDescription>Enter today&apos;s milk collection</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date *</Label>
                <Input type="date" value={newMilkRecord.date} onChange={(e) => setNewMilkRecord(prev => ({ ...prev, date: e.target.value }))} />
              </div>
              <div>
                <Label>Shift *</Label>
                <Select value={newMilkRecord.shift} onValueChange={(v) => setNewMilkRecord(prev => ({ ...prev, shift: v as MilkRecord['shift'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="afternoon">Afternoon</SelectItem>
                    <SelectItem value="evening">Evening</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Total Liters *</Label>
              <Input type="number" value={newMilkRecord.totalLiters} onChange={(e) => setNewMilkRecord(prev => ({ ...prev, totalLiters: e.target.value }))} placeholder="e.g., 450" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Butterfat %</Label>
                <Input type="number" step="0.1" value={newMilkRecord.avgButterfat} onChange={(e) => setNewMilkRecord(prev => ({ ...prev, avgButterfat: e.target.value }))} placeholder="e.g., 3.8" />
              </div>
              <div>
                <Label>Protein %</Label>
                <Input type="number" step="0.1" value={newMilkRecord.avgProtein} onChange={(e) => setNewMilkRecord(prev => ({ ...prev, avgProtein: e.target.value }))} placeholder="e.g., 3.2" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>SCC (cells/ml)</Label>
                <Input type="number" value={newMilkRecord.sccCount} onChange={(e) => setNewMilkRecord(prev => ({ ...prev, sccCount: e.target.value }))} placeholder="e.g., 150000" />
              </div>
              <div>
                <Label>Temperature (°C)</Label>
                <Input type="number" step="0.1" value={newMilkRecord.temperature} onChange={(e) => setNewMilkRecord(prev => ({ ...prev, temperature: e.target.value }))} placeholder="e.g., 3.5" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMilkRecordDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleAddMilkRecord} disabled={!newMilkRecord.totalLiters}>
              Save Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
