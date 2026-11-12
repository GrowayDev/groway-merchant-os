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
  Ham,
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
  Baby,
  Calendar,
  TrendingUp,
  Droplets,
} from 'lucide-react'

// =====================================================
// PIGGERY TYPES
// =====================================================

interface PigAnimal {
  id: string
  identificationNumber: string
  breed: string
  gender: 'boar' | 'sow' | 'gilt' | 'piglet_male' | 'piglet_female' | 'barrow'
  dateOfBirth: string
  weightBirth?: number
  weightCurrent?: number
  purpose: 'meat' | 'breeding'
  status: 'active' | 'sold' | 'slaughtered' | 'deceased'
  healthStatus: 'healthy' | 'sick' | 'quarantine'
  location: string
  sireId?: string
  damId?: string
  // Sow specific
  parity?: number
  lastFarrowingDate?: string
  totalBorn?: number
  totalWeaned?: number
  // Growth tracking
  adg?: number // Average Daily Gain
  fcr?: number // Feed Conversion Ratio
  daysToMarket?: number
  legalMarkingCompliant: boolean
}

interface FarrowingRecord {
  id: string
  sowId: string
  date: string
  totalBorn: number
  bornAlive: number
  stillborn: number
  mummified: number
  avgBirthWeight: number
  weaningDate?: string
  weanedCount?: number
  weaningWeight?: number
}

// =====================================================
// CONSTANTS - SOUTH AFRICAN PIG BREEDS
// =====================================================

const pigBreeds = [
  { value: 'landrace', label: 'Landrace', type: 'commercial' },
  { value: 'large_white', label: 'Large White (Yorkshire)', type: 'commercial' },
  { value: 'duroc', label: 'Duroc', type: 'commercial' },
  { value: 'hampshire', label: 'Hampshire', type: 'commercial' },
  { value: 'pietrain', label: 'Pietrain', type: 'commercial' },
  { value: 'large_black', label: 'Large Black', type: 'heritage' },
  { value: 'kolbroek', label: 'Kolbroek', type: 'indigenous' },
  { value: 'windsnyer', label: 'Windsnyer', type: 'indigenous' },
  { value: 'kune_kune', label: 'Kune Kune', type: 'heritage' },
]

const genderLabels: Record<string, string> = {
  boar: 'Boar ♂',
  sow: 'Sow ♀',
  gilt: 'Gilt ♀',
  piglet_male: 'Male Piglet ♂',
  piglet_female: 'Female Piglet ♀',
  barrow: 'Barrow ♂',
}

const productionStages = [
  { stage: 'Farrowing', days: '0-28', key: 'farrowing' },
  { stage: 'Nursery', days: '28-70', key: 'nursery' },
  { stage: 'Grower', days: '70-120', key: 'grower' },
  { stage: 'Finisher', days: '120-180', key: 'finisher' },
]

// Helper functions
const formatWeight = (weight?: number) => weight ? `${weight.toLocaleString()} kg` : 'N/A'
const formatCurrency = (amount: number) => `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`

const calculateAge = (dob: string) => {
  const birth = new Date(dob)
  const today = new Date()
  const days = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24))
  if (days < 30) return `${days} days`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} mo`
  return `${Math.floor(months / 12)}y ${months % 12}mo`
}

const calculateADG = (birthWeight: number, currentWeight: number, days: number) => {
  if (days <= 0) return 0
  return ((currentWeight - birthWeight) / days * 1000).toFixed(0) // grams per day
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

export function PiggeryView() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [genderFilter, setGenderFilter] = useState('all')

  const [pigs, setPigs] = useState<PigAnimal[]>([])
  const [farrowingRecords, setFarrowingRecords] = useState<FarrowingRecord[]>([])
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [farrowingDialogOpen, setFarrowingDialogOpen] = useState(false)
  const [feedDialogOpen, setFeedDialogOpen] = useState(false)

  const [newPig, setNewPig] = useState({
    identificationNumber: '',
    breed: '',
    gender: 'gilt' as PigAnimal['gender'],
    dateOfBirth: '',
    weightBirth: '',
    purpose: 'meat' as PigAnimal['purpose'],
    location: '',
    damId: '',
  })

  useEffect(() => {
    setTimeout(() => setLoading(false), 500)
  }, [])

  const stats = useMemo(() => {
    const active = pigs.filter(p => p.status === 'active')
    const boars = active.filter(p => p.gender === 'boar').length
    const sows = active.filter(p => p.gender === 'sow').length
    const gilts = active.filter(p => p.gender === 'gilt').length
    const piglets = active.filter(p => p.gender.includes('piglet')).length
    const finishers = active.filter(p => p.gender === 'barrow' && p.weightCurrent && p.weightCurrent >= 90).length
    const totalWeight = active.reduce((sum, p) => sum + (p.weightCurrent || 0), 0)
    const avgWeight = active.length > 0 ? Math.round(totalWeight / active.length) : 0
    const healthIssues = active.filter(p => p.healthStatus !== 'healthy').length

    // Calculate FCR and ADG averages
    const pigsWithADG = active.filter(p => p.adg)
    const avgADG = pigsWithADG.length > 0 ? pigsWithADG.reduce((sum, p) => sum + (p.adg || 0), 0) / pigsWithADG.length : 0

    // Farrowing stats
    const totalBorn = farrowingRecords.reduce((sum, r) => sum + r.totalBorn, 0)
    const avgLitterSize = farrowingRecords.length > 0 ? totalBorn / farrowingRecords.length : 0
    const avgWeaningRate = farrowingRecords.length > 0
      ? farrowingRecords.reduce((sum, r) => sum + ((r.weanedCount || 0) / r.bornAlive * 100), 0) / farrowingRecords.length
      : 0

    const nonCompliant = active.filter(p => !p.legalMarkingCompliant).length

    return {
      total: active.length,
      boars,
      sows,
      gilts,
      piglets,
      finishers,
      totalWeight,
      avgWeight,
      healthIssues,
      avgADG: avgADG.toFixed(0),
      avgLitterSize: avgLitterSize.toFixed(1),
      avgWeaningRate: avgWeaningRate.toFixed(1),
      nonCompliant,
    }
  }, [pigs, farrowingRecords])

  const filteredPigs = useMemo(() => pigs.filter(p => {
    const matchesSearch = p.identificationNumber.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesGender = genderFilter === 'all' || p.gender === genderFilter
    return matchesSearch && matchesGender
  }), [pigs, searchQuery, genderFilter])

  const handleAddPig = () => {
    const pig: PigAnimal = {
      id: `pig-${Date.now()}`,
      ...newPig,
      weightBirth: parseFloat(newPig.weightBirth) || undefined,
      status: 'active',
      healthStatus: 'healthy',
      legalMarkingCompliant: false,
    }
    setPigs(prev => [...prev, pig])
    setAddDialogOpen(false)
    setNewPig({
      identificationNumber: '',
      breed: '',
      gender: 'gilt',
      dateOfBirth: '',
      weightBirth: '',
      purpose: 'meat',
      location: '',
      damId: '',
    })
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
          <Ham className="h-5 w-5 text-[#00897B]" />
          <h2 className="font-semibold text-[#1A1A1A]">Piggery Management</h2>
          <Badge variant="outline" className="bg-pink-50 text-pink-700">
            {stats.total} pigs
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />Refresh
          </Button>
          <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />Add Pig
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-4 pt-2 bg-white border-b">
          <TabsList className="bg-transparent h-10 flex-wrap">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Dashboard</TabsTrigger>
            <TabsTrigger value="herd" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Herd</TabsTrigger>
            <TabsTrigger value="farrowing" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Farrowing</TabsTrigger>
            <TabsTrigger value="growth" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Growth</TabsTrigger>
            <TabsTrigger value="feed" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Feed</TabsTrigger>
            <TabsTrigger value="health" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Health</TabsTrigger>
            <TabsTrigger value="sales" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Sales</TabsTrigger>
            <TabsTrigger value="compliance" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Compliance</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Dashboard */}
          <TabsContent value="dashboard" className="m-0 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <StatCard icon={Ham} label="Total Herd" value={stats.total} subValue="animals" />
              <StatCard icon={Scale} label="Avg Weight" value={formatWeight(stats.avgWeight)} subValue={`total: ${formatWeight(stats.totalWeight)}`} />
              <StatCard icon={Heart} label="Health Issues" value={stats.healthIssues} subValue="need attention" iconColor="#ef4444" />
              <StatCard icon={TrendingUp} label="Avg ADG" value={`${stats.avgADG} g/d`} subValue="growth rate" />
              <StatCard icon={Baby} label="Piglets" value={stats.piglets} subValue="young stock" />
              <StatCard icon={Target} label="Finishers" value={stats.finishers} subValue="ready for market" />
            </div>

            {/* Herd Composition */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#00897B]" />
                    Herd Composition
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pigs.length === 0 ? (
                    <EmptyState icon={Ham} title="No Pigs Registered" description="Start by adding your breeding stock or piglets." actionLabel="Add First Pig" onAction={() => setAddDialogOpen(true)} />
                  ) : (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg text-center">
                        <p className="text-3xl font-bold text-blue-700">{stats.boars}</p>
                        <p className="text-sm text-blue-600">Boars ♂</p>
                      </div>
                      <div className="p-4 bg-pink-50 rounded-lg text-center">
                        <p className="text-3xl font-bold text-pink-700">{stats.sows}</p>
                        <p className="text-sm text-pink-600">Sows ♀</p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg text-center">
                        <p className="text-3xl font-bold text-purple-700">{stats.gilts}</p>
                        <p className="text-sm text-purple-600">Gilts ♀</p>
                      </div>
                      <div className="p-4 bg-orange-50 rounded-lg text-center">
                        <p className="text-3xl font-bold text-orange-700">{stats.piglets}</p>
                        <p className="text-sm text-orange-600">Piglets</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg text-center">
                        <p className="text-3xl font-bold text-green-700">{stats.finishers}</p>
                        <p className="text-sm text-green-600">Finishers</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg text-center">
                        <p className="text-2xl font-bold text-gray-700">{stats.avgLitterSize}</p>
                        <p className="text-sm text-gray-600">Avg Litter</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-[#00897B]" />
                    Production Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Avg Litter Size</span>
                        <span className="font-medium">{stats.avgLitterSize} piglets</span>
                      </div>
                      <Progress value={parseFloat(stats.avgLitterSize) * 5} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Weaning Rate</span>
                        <span className="font-medium">{stats.avgWeaningRate}%</span>
                      </div>
                      <Progress value={parseFloat(stats.avgWeaningRate)} className="h-2 [&>div]:bg-green-500" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Avg Daily Gain</span>
                        <span className="font-medium">{stats.avgADG} g/day</span>
                      </div>
                      <Progress value={parseFloat(stats.avgADG) / 8} className="h-2 [&>div]:bg-blue-500" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Target FCR</span>
                        <span className="font-medium">2.5:1</span>
                      </div>
                      <Progress value={62.5} className="h-2 [&>div]:bg-purple-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Production Stages */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#00897B]" />
                  Production Stages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {productionStages.map((stage, i) => (
                    <div key={stage.key} className={`p-4 rounded-lg ${i === 0 ? 'bg-pink-50' : i === 1 ? 'bg-orange-50' : i === 2 ? 'bg-blue-50' : 'bg-green-50'}`}>
                      <p className={`font-medium ${i === 0 ? 'text-pink-700' : i === 1 ? 'text-orange-700' : i === 2 ? 'text-blue-700' : 'text-green-700'}`}>
                        {stage.stage}
                      </p>
                      <p className="text-xs text-[#757575]">{stage.days} days</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* SA Compliance */}
            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-amber-500" />
                  SA Piggery Compliance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Animal Identification Act</p>
                      <p className="text-[#757575]">Ear notching or tagging required for traceability</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium">African Swine Fever (ASF)</p>
                      <p className="text-[#757575]">Monitor for symptoms, strict biosecurity essential</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Waste Management</p>
                      <p className="text-[#757575]">Comply with NEM:BA waste disposal regulations</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Movement Permits</p>
                      <p className="text-[#757575]">Health certificates required for animal movements</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Herd Tab */}
          <TabsContent value="herd" className="m-0 space-y-4">
            <div className="flex gap-2 items-center flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Input placeholder="Search by tag number..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger className="w-[130px]"><SelectValue placeholder="Gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="boar">Boars</SelectItem>
                  <SelectItem value="sow">Sows</SelectItem>
                  <SelectItem value="gilt">Gilts</SelectItem>
                  <SelectItem value="piglet_male">Male Piglets</SelectItem>
                  <SelectItem value="piglet_female">Female Piglets</SelectItem>
                </SelectContent>
              </Select>
              <Button className="bg-[#00897B]" onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />Add
              </Button>
            </div>

            {filteredPigs.length === 0 ? (
              <Card><CardContent className="py-8"><EmptyState icon={Ham} title="No Pigs Found" description="Start by adding your herd." actionLabel="Add First Pig" onAction={() => setAddDialogOpen(true)} /></CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPigs.map(pig => (
                  <Card key={pig.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium text-sm">{pig.identificationNumber}</p>
                          <p className="text-xs text-[#757575]">{pig.breed}</p>
                        </div>
                        <Badge className={pig.healthStatus === 'healthy' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                          {pig.healthStatus}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                        <div><span className="text-[#757575]">Gender:</span> <span className="ml-1 font-medium">{genderLabels[pig.gender]}</span></div>
                        <div><span className="text-[#757575]">Age:</span> <span className="ml-1 font-medium">{calculateAge(pig.dateOfBirth)}</span></div>
                        <div><span className="text-[#757575]">Weight:</span> <span className="ml-1 font-medium">{formatWeight(pig.weightCurrent)}</span></div>
                        <div><span className="text-[#757575]">Location:</span> <span className="ml-1 font-medium">{pig.location || 'N/A'}</span></div>
                      </div>
                      {pig.adg && <Badge variant="outline" className="text-xs mr-2">ADG: {pig.adg}g/d</Badge>}
                      {pig.parity !== undefined && <Badge variant="outline" className="text-xs">Parity: {pig.parity}</Badge>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Other Tabs */}
          <TabsContent value="farrowing" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={Baby} title="Farrowing Records" description="Track sow farrowing, litter sizes, weaning rates, and piglet mortality." actionLabel="Add Farrowing Record" onAction={() => setFarrowingDialogOpen(true)} /></CardContent></Card>
          </TabsContent>
          <TabsContent value="growth" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={TrendingUp} title="Growth Tracking" description="Monitor ADG, FCR, days to market, and weight gains by batch." actionLabel="Add Growth Record" /></CardContent></Card>
          </TabsContent>
          <TabsContent value="feed" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={Target} title="Feed Management" description="Track feed consumption, FCR, feed costs, and inventory." actionLabel="Add Feed Record" onAction={() => setFeedDialogOpen(true)} /></CardContent></Card>
          </TabsContent>
          <TabsContent value="health" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={Heart} title="Health & Vaccinations" description="Manage vaccination schedules, treatments, and health checks." actionLabel="Add Health Record" /></CardContent></Card>
          </TabsContent>
          <TabsContent value="sales" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={DollarSign} title="Sales & Marketing" description="Record sales to abattoirs, auctions, or private buyers." actionLabel="Record Sale" /></CardContent></Card>
          </TabsContent>
          <TabsContent value="compliance" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={ShieldCheck} title="Compliance" description="Track identification, health certificates, and movement permits." actionLabel="Add Compliance Item" /></CardContent></Card>
          </TabsContent>
        </div>
      </Tabs>

      {/* Add Pig Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Ham className="h-5 w-5 text-[#00897B]" />Register Pig</DialogTitle>
            <DialogDescription>Add a new pig to your herd</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tag Number *</Label>
                <Input value={newPig.identificationNumber} onChange={(e) => setNewPig(prev => ({ ...prev, identificationNumber: e.target.value }))} placeholder="e.g., P-2024-001" />
              </div>
              <div>
                <Label>Breed *</Label>
                <Select value={newPig.breed} onValueChange={(v) => setNewPig(prev => ({ ...prev, breed: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select breed" /></SelectTrigger>
                  <SelectContent>
                    {pigBreeds.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Gender *</Label>
                <Select value={newPig.gender} onValueChange={(v) => setNewPig(prev => ({ ...prev, gender: v as PigAnimal['gender'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boar">Boar ♂</SelectItem>
                    <SelectItem value="sow">Sow ♀</SelectItem>
                    <SelectItem value="gilt">Gilt ♀</SelectItem>
                    <SelectItem value="piglet_male">Male Piglet ♂</SelectItem>
                    <SelectItem value="piglet_female">Female Piglet ♀</SelectItem>
                    <SelectItem value="barrow">Barrow ♂</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date of Birth *</Label>
                <Input type="date" value={newPig.dateOfBirth} onChange={(e) => setNewPig(prev => ({ ...prev, dateOfBirth: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Birth Weight (kg)</Label>
                <Input type="number" value={newPig.weightBirth} onChange={(e) => setNewPig(prev => ({ ...prev, weightBirth: e.target.value }))} placeholder="e.g., 1.4" />
              </div>
              <div>
                <Label>Purpose *</Label>
                <Select value={newPig.purpose} onValueChange={(v) => setNewPig(prev => ({ ...prev, purpose: v as PigAnimal['purpose'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meat">Meat Production</SelectItem>
                    <SelectItem value="breeding">Breeding Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Location (Pen)</Label>
              <Input value={newPig.location} onChange={(e) => setNewPig(prev => ({ ...prev, location: e.target.value }))} placeholder="e.g., Farrowing Pen 1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleAddPig} disabled={!newPig.identificationNumber || !newPig.breed || !newPig.dateOfBirth}>
              Register
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
