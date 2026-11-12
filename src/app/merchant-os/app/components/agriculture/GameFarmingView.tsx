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
  Bird,
  Heart,
  Syringe,
  Scale,
  TreeDeciduous,
  Camera,
  Users,
  AlertTriangle,
  ShieldCheck,
  Plus,
  RefreshCw,
  Target,
  DollarSign,
  Truck,
  Calendar,
  TrendingUp,
  MapPin,
  Compass,
  Medal,
} from 'lucide-react'

// =====================================================
// GAME FARMING TYPES
// =====================================================

interface GameAnimal {
  id: string
  species: string
  identificationNumber?: string
  gender: 'male' | 'female' | 'young_male' | 'young_female'
  estimatedAge?: number
  estimatedWeight?: number
  status: 'active' | 'hunted' | 'sold' | 'deceased' | 'translocated'
  location: string
  healthStatus: 'healthy' | 'injured' | 'diseased'
  trophyQuality?: 'gold' | 'silver' | 'bronze' | 'measurement'
  measurements?: {
    hornLength?: number // cm
    hornSpread?: number // cm
    bodyLength?: number // cm
  }
  acquisitionDate?: string
  acquisitionSource?: string
  permitNumber?: string
  notes?: string
}

interface HuntingRecord {
  id: string
  date: string
  species: string
  animalId?: string
  hunterName: string
  hunterNationality: string
  huntingPermit: string
  trophyType: 'trophy' | 'biltong' | 'cull'
  trophyFee: number
  dailyRate: number
  totalAmount: number
  measurements?: {
    hornLength: number
    hornSpread: number
    rowlandWardScore?: number
  }
  professionalHunter?: string
  skinners?: string
  notes?: string
}

interface EcoTourismRecord {
  id: string
  date: string
  activityType: 'game_drive' | 'walking_safari' | 'bird_watching' | 'photography' | 'bush_dinner'
  guestCount: number
  guideName: string
  revenue: number
  duration: number // hours
  notes?: string
}

// =====================================================
// CONSTANTS - SOUTH AFRICAN GAME SPECIES
// =====================================================

const gameSpecies = [
  // Plains Game
  { value: 'impala', label: 'Impala', category: 'plains' },
  { value: 'kudu', label: 'Greater Kudu', category: 'plains' },
  { value: 'wildebeest', label: 'Blue Wildebeest', category: 'plains' },
  { value: 'zebra', label: 'Plains Zebra', category: 'plains' },
  { value: 'springbok', label: 'Springbok', category: 'plains' },
  { value: 'blesbok', label: 'Blesbok', category: 'plains' },
  { value: 'warthog', label: 'Warthog', category: 'plains' },
  { value: 'giraffe', label: 'Giraffe', category: 'plains' },
  { value: 'eland', label: 'Eland', category: 'plains' },
  { value: 'hartebeest', label: 'Red Hartebeest', category: 'plains' },
  { value: 'nyala', label: 'Nyala', category: 'plains' },
  { value: 'waterbuck', label: 'Waterbuck', category: 'plains' },
  // Big Five
  { value: 'lion', label: 'Lion', category: 'big_five' },
  { value: 'leopard', label: 'Leopard', category: 'big_five' },
  { value: 'elephant', label: 'Elephant', category: 'big_five' },
  { value: 'buffalo', label: 'Cape Buffalo', category: 'big_five' },
  { value: 'rhino', label: 'Rhino', category: 'big_five' },
  // Birds
  { value: 'ostrich', label: 'Ostrich', category: 'bird' },
  { value: 'guinea_fowl', label: 'Guinea Fowl', category: 'bird' },
]

const trophyCategories = [
  { value: 'trophy', label: 'Trophy Hunt', color: 'bg-amber-100 text-amber-700' },
  { value: 'biltong', label: 'Biltong Hunt', color: 'bg-green-100 text-green-700' },
  { value: 'cull', label: 'Culling', color: 'bg-gray-100 text-gray-700' },
]

// Helper functions
const formatCurrency = (amount: number) => `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`
const formatWeight = (kg?: number) => kg ? `${kg.toLocaleString()} kg` : 'N/A'

const getSpeciesIcon = (category: string) => {
  switch (category) {
    case 'big_five': return '🦁'
    case 'plains': return '🦌'
    case 'bird': return '🦃'
    default: return '🐾'
  }
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

export function GameFarmingView() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')

  const [animals, setAnimals] = useState<GameAnimal[]>([])
  const [huntingRecords, setHuntingRecords] = useState<HuntingRecord[]>([])
  const [ecoTourismRecords, setEcoTourismRecords] = useState<EcoTourismRecord[]>([])
  const [addAnimalDialogOpen, setAddAnimalDialogOpen] = useState(false)
  const [huntingDialogOpen, setHuntingDialogOpen] = useState(false)

  const [newAnimal, setNewAnimal] = useState({
    species: '',
    gender: 'male' as GameAnimal['gender'],
    estimatedAge: '',
    estimatedWeight: '',
    location: '',
    permitNumber: '',
  })

  useEffect(() => {
    setTimeout(() => setLoading(false), 500)
  }, [])

  const stats = useMemo(() => {
    const active = animals.filter(a => a.status === 'active')
    const totalAnimals = active.length
    const speciesCount = [...new Set(active.map(a => a.species))].length
    const males = active.filter(a => a.gender === 'male').length
    const females = active.filter(a => a.gender === 'female').length
    const young = active.filter(a => a.gender.includes('young')).length
    const healthIssues = active.filter(a => a.healthStatus !== 'healthy').length
    const trophyAnimals = active.filter(a => a.trophyQuality).length

    const totalHuntingRevenue = huntingRecords.reduce((sum, r) => sum + r.totalAmount, 0)
    const totalEcoRevenue = ecoTourismRecords.reduce((sum, r) => sum + r.revenue, 0)
    const totalGuests = ecoTourismRecords.reduce((sum, r) => sum + r.guestCount, 0)

    return {
      totalAnimals,
      speciesCount,
      males,
      females,
      young,
      healthIssues,
      trophyAnimals,
      totalHuntingRevenue,
      totalEcoRevenue,
      totalRevenue: totalHuntingRevenue + totalEcoRevenue,
      totalGuests,
      huntingCount: huntingRecords.length,
      ecoToursCount: ecoTourismRecords.length,
    }
  }, [animals, huntingRecords, ecoTourismRecords])

  const handleAddAnimal = () => {
    const animal: GameAnimal = {
      id: `game-${Date.now()}`,
      ...newAnimal,
      estimatedAge: parseInt(newAnimal.estimatedAge) || undefined,
      estimatedWeight: parseFloat(newAnimal.estimatedWeight) || undefined,
      status: 'active',
      healthStatus: 'healthy',
    }
    setAnimals(prev => [...prev, animal])
    setAddAnimalDialogOpen(false)
    setNewAnimal({
      species: '',
      gender: 'male',
      estimatedAge: '',
      estimatedWeight: '',
      location: '',
      permitNumber: '',
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
          <Bird className="h-5 w-5 text-[#00897B]" />
          <h2 className="font-semibold text-[#1A1A1A]">Game Farming</h2>
          <Badge variant="outline" className="bg-amber-50 text-amber-700">
            {stats.totalAnimals} animals
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
            <TabsTrigger value="wildlife" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Wildlife</TabsTrigger>
            <TabsTrigger value="hunting" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Hunting</TabsTrigger>
            <TabsTrigger value="ecotourism" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Eco-Tourism</TabsTrigger>
            <TabsTrigger value="breeding" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Breeding</TabsTrigger>
            <TabsTrigger value="health" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Health</TabsTrigger>
            <TabsTrigger value="permits" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Permits</TabsTrigger>
            <TabsTrigger value="compliance" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Compliance</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Dashboard */}
          <TabsContent value="dashboard" className="m-0 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <StatCard icon={Bird} label="Total Game" value={stats.totalAnimals} subValue={`${stats.speciesCount} species`} />
              <StatCard icon={Target} label="Trophy Animals" value={stats.trophyAnimals} subValue="trophy quality" />
              <StatCard icon={Heart} label="Health Issues" value={stats.healthIssues} subValue="need attention" iconColor="#ef4444" />
              <StatCard icon={Compass} label="Hunts This Season" value={stats.huntingCount} subValue="recorded" />
              <StatCard icon={Camera} label="Eco-Tour Guests" value={stats.totalGuests} subValue="visitors" />
              <StatCard icon={DollarSign} label="Total Revenue" value={formatCurrency(stats.totalRevenue)} subValue={`${formatCurrency(stats.totalHuntingRevenue)} hunting`} />
            </div>

            {/* Wildlife Composition */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bird className="h-5 w-5 text-[#00897B]" />
                    Wildlife Composition
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {animals.length === 0 ? (
                    <EmptyState icon={Bird} title="No Game Registered" description="Start by adding your wildlife inventory." actionLabel="Add First Animal" onAction={() => setAddAnimalDialogOpen(true)} />
                  ) : (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg text-center">
                        <p className="text-3xl font-bold text-blue-700">{stats.males}</p>
                        <p className="text-sm text-blue-600">Males ♂</p>
                      </div>
                      <div className="p-4 bg-pink-50 rounded-lg text-center">
                        <p className="text-3xl font-bold text-pink-700">{stats.females}</p>
                        <p className="text-sm text-pink-600">Females ♀</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg text-center">
                        <p className="text-3xl font-bold text-green-700">{stats.young}</p>
                        <p className="text-sm text-green-600">Young</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-[#00897B]" />
                    Revenue Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Hunting Revenue</span>
                        <span className="font-medium">{formatCurrency(stats.totalHuntingRevenue)}</span>
                      </div>
                      <Progress value={stats.totalRevenue > 0 ? (stats.totalHuntingRevenue / stats.totalRevenue) * 100 : 0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Eco-Tourism Revenue</span>
                        <span className="font-medium">{formatCurrency(stats.totalEcoRevenue)}</span>
                      </div>
                      <Progress value={stats.totalRevenue > 0 ? (stats.totalEcoRevenue / stats.totalRevenue) * 100 : 0} className="h-2 [&>div]:bg-green-500" />
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Total Revenue</span>
                        <span className="font-bold text-[#00897B]">{formatCurrency(stats.totalRevenue)}</span>
                      </div>
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
                  <Button variant="outline" className="h-auto py-3 flex-col" onClick={() => setAddAnimalDialogOpen(true)}>
                    <Bird className="h-5 w-5 mb-1 text-[#00897B]" />
                    <span className="text-xs">Add Animal</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex-col" onClick={() => setHuntingDialogOpen(true)}>
                    <Target className="h-5 w-5 mb-1 text-amber-500" />
                    <span className="text-xs">Record Hunt</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex-col">
                    <Camera className="h-5 w-5 mb-1 text-blue-500" />
                    <span className="text-xs">Eco-Tour</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex-col">
                    <Syringe className="h-5 w-5 mb-1 text-green-500" />
                    <span className="text-xs">Health Check</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex-col">
                    <Medal className="h-5 w-5 mb-1 text-purple-500" />
                    <span className="text-xs">Trophy Score</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex-col">
                    <Truck className="h-5 w-5 mb-1 text-orange-500" />
                    <span className="text-xs">Translocate</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* SA Compliance */}
            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-amber-500" />
                  SA Game Farming Compliance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Game Farm Permit</p>
                      <p className="text-[#757575]">Required from provincial nature conservation</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Hunting Permits</p>
                      <p className="text-[#757575]">Permits required for each hunting activity</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Threatened Species</p>
                      <p className="text-[#757575]">Special permits for TOPS listed species</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Translocation Permits</p>
                      <p className="text-[#757575]">Required for moving game between properties</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other Tabs */}
          <TabsContent value="wildlife" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={Bird} title="Wildlife Management" description="Track game animals, species diversity, and population dynamics." actionLabel="Add Animal" onAction={() => setAddAnimalDialogOpen(true)} /></CardContent></Card>
          </TabsContent>
          <TabsContent value="hunting" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={Target} title="Hunting Records" description="Manage trophy hunts, biltong hunts, and culling operations." actionLabel="Add Hunt Record" onAction={() => setHuntingDialogOpen(true)} /></CardContent></Card>
          </TabsContent>
          <TabsContent value="ecotourism" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={Camera} title="Eco-Tourism" description="Track game drives, safaris, and guest activities." actionLabel="Add Tour Record" /></CardContent></Card>
          </TabsContent>
          <TabsContent value="breeding" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={TreeDeciduous} title="Breeding Programs" description="Manage breeding projects and genetic diversity." actionLabel="Add Breeding Record" /></CardContent></Card>
          </TabsContent>
          <TabsContent value="health" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={Heart} title="Wildlife Health" description="Track disease surveillance, vaccinations, and interventions." actionLabel="Add Health Record" /></CardContent></Card>
          </TabsContent>
          <TabsContent value="permits" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={ShieldCheck} title="Permits & Licenses" description="Manage hunting permits, translocation permits, and TOPS registrations." actionLabel="Add Permit" /></CardContent></Card>
          </TabsContent>
          <TabsContent value="compliance" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={ShieldCheck} title="Compliance" description="Track regulations, audits, and nature conservation requirements." actionLabel="Add Compliance Item" /></CardContent></Card>
          </TabsContent>
        </div>
      </Tabs>

      {/* Add Animal Dialog */}
      <Dialog open={addAnimalDialogOpen} onOpenChange={setAddAnimalDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Bird className="h-5 w-5 text-[#00897B]" />Add Game Animal</DialogTitle>
            <DialogDescription>Add a new animal to your wildlife inventory</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Species *</Label>
                <Select value={newAnimal.species} onValueChange={(v) => setNewAnimal(prev => ({ ...prev, species: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select species" /></SelectTrigger>
                  <SelectContent>
                    {gameSpecies.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Gender *</Label>
                <Select value={newAnimal.gender} onValueChange={(v) => setNewAnimal(prev => ({ ...prev, gender: v as GameAnimal['gender'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Adult Male ♂</SelectItem>
                    <SelectItem value="female">Adult Female ♀</SelectItem>
                    <SelectItem value="young_male">Young Male ♂</SelectItem>
                    <SelectItem value="young_female">Young Female ♀</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Estimated Age (years)</Label>
                <Input type="number" value={newAnimal.estimatedAge} onChange={(e) => setNewAnimal(prev => ({ ...prev, estimatedAge: e.target.value }))} placeholder="e.g., 5" />
              </div>
              <div>
                <Label>Estimated Weight (kg)</Label>
                <Input type="number" value={newAnimal.estimatedWeight} onChange={(e) => setNewAnimal(prev => ({ ...prev, estimatedWeight: e.target.value }))} placeholder="e.g., 200" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Location (Camp)</Label>
                <Input value={newAnimal.location} onChange={(e) => setNewAnimal(prev => ({ ...prev, location: e.target.value }))} placeholder="e.g., Northern Camp" />
              </div>
              <div>
                <Label>Permit Number</Label>
                <Input value={newAnimal.permitNumber} onChange={(e) => setNewAnimal(prev => ({ ...prev, permitNumber: e.target.value }))} placeholder="e.g., GF-2024-001" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddAnimalDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleAddAnimal} disabled={!newAnimal.species}>
              Add Animal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
