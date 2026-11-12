'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  Beef,
  Heart,
  Syringe,
  Scale,
  TrendingUp,
  Calendar,
  MapPin,
  Plus,
  Search,
  Eye,
  RefreshCw,
  Users,
  AlertTriangle,
  CheckCircle2,
  Truck,
  DollarSign,
  Target,
  ShieldCheck,
  GitBranch,
  Droplets,
  Baby,
} from 'lucide-react'

// =====================================================
// TYPE DEFINITIONS - CATTLE FARMING
// =====================================================

interface CattleAnimal {
  id: string
  identificationNumber: string
  breed: string
  gender: 'bull' | 'cow' | 'heifer' | 'steer' | 'calf_male' | 'calf_female'
  dateOfBirth: string
  weightBirth?: number
  weightCurrent?: number
  purpose: 'beef' | 'dairy' | 'breeding' | 'draft'
  status: 'active' | 'sold' | 'slaughtered' | 'deceased'
  healthStatus: 'healthy' | 'sick' | 'recovering' | 'quarantine'
  location: string
  sireId?: string
  damId?: string
  imageUrl?: string
  notes?: string
  registrationDate: string
  lastHealthCheck?: string
  nextVaccination?: string
  nextDipping?: string
  isPregnant?: boolean
  lactating?: boolean
  legalMarkingCompliant: boolean
}

// =====================================================
// CONSTANTS - SOUTH AFRICAN CATTLE FARMING
// =====================================================

const cattleBreeds = [
  // Beef Breeds
  { value: 'afrikaner', label: 'Afrikaner', type: 'beef' },
  { value: 'angus', label: 'Angus', type: 'beef' },
  { value: 'brahman', label: 'Brahman', type: 'beef' },
  { value: 'bonsmara', label: 'Bonsmara', type: 'beef' },
  { value: 'drakensberger', label: 'Drakensberger', type: 'beef' },
  { value: 'hereford', label: 'Hereford', type: 'beef' },
  { value: 'nguni', label: 'Nguni', type: 'beef' },
  { value: 'simmentaler', label: 'Simmentaler', type: 'beef' },
  { value: 'wagyu', label: 'Wagyu', type: 'beef' },
  // Dairy Breeds
  { value: 'holstein', label: 'Holstein', type: 'dairy' },
  { value: 'jersey', label: 'Jersey', type: 'dairy' },
  { value: 'guernsey', label: 'Guernsey', type: 'dairy' },
]

const genderLabels: Record<string, string> = {
  bull: 'Bull',
  cow: 'Cow',
  heifer: 'Heifer',
  steer: 'Steer',
  calf_male: 'Bull Calf',
  calf_female: 'Heifer Calf',
}

// South African Vaccination Schedule
const saVaccinations = [
  { name: 'Anthrax', frequency: 'annual', mandatory: true },
  { name: 'Blackquarter', frequency: 'annual', mandatory: true },
  { name: 'Brucellosis (S19)', frequency: 'once', mandatory: true, heifersOnly: true },
  { name: 'Contagious Abortion', frequency: 'annual', mandatory: true },
  { name: 'Lumpy Skin Disease', frequency: 'annual', mandatory: true },
  { name: 'Rift Valley Fever', frequency: 'annual', mandatory: false },
]

// =====================================================
// HELPER FUNCTIONS
// =====================================================

const formatCurrency = (amount: number) => `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`

const formatWeight = (weight?: number) => weight ? `${weight.toLocaleString()} kg` : 'N/A'

const calculateAge = (dob: string) => {
  const birth = new Date(dob)
  const today = new Date()
  const months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth())
  if (months < 12) return `${months} mo`
  const years = Math.floor(months / 12)
  const rem = months % 12
  return rem > 0 ? `${years}y ${rem}mo` : `${years}y`
}

const getHealthStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    healthy: 'bg-green-100 text-green-700',
    sick: 'bg-red-100 text-red-700',
    recovering: 'bg-yellow-100 text-yellow-700',
    quarantine: 'bg-orange-100 text-orange-700',
  }
  return colors[status] || 'bg-gray-100 text-gray-700'
}

// Empty State Component
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

// Stat Card Component
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

export function CattleFarmingView() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [genderFilter, setGenderFilter] = useState('all')
  
  const [cattle, setCattle] = useState<CattleAnimal[]>([])
  const [addAnimalDialogOpen, setAddAnimalDialogOpen] = useState(false)
  const [breedingDialogOpen, setBreedingDialogOpen] = useState(false)
  const [healthDialogOpen, setHealthDialogOpen] = useState(false)
  const [weightDialogOpen, setWeightDialogOpen] = useState(false)
  const [movementDialogOpen, setMovementDialogOpen] = useState(false)
  const [saleDialogOpen, setSaleDialogOpen] = useState(false)
  const [selectedAnimal, setSelectedAnimal] = useState<CattleAnimal | null>(null)
  const [animalDetailDialogOpen, setAnimalDetailDialogOpen] = useState(false)
  
  const [newAnimal, setNewAnimal] = useState({
    identificationNumber: '',
    breed: '',
    gender: 'heifer' as CattleAnimal['gender'],
    dateOfBirth: '',
    weightBirth: '',
    purpose: 'beef' as CattleAnimal['purpose'],
    location: '',
    sireId: '',
    damId: '',
    notes: '',
  })

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 500)
  }, [])

  // Computed stats
  const stats = useMemo(() => {
    const active = cattle.filter(c => c.status === 'active')
    const bulls = active.filter(c => c.gender === 'bull').length
    const cows = active.filter(c => c.gender === 'cow').length
    const heifers = active.filter(c => c.gender === 'heifer').length
    const steers = active.filter(c => c.gender === 'steer').length
    const calves = active.filter(c => c.gender === 'calf_male' || c.gender === 'calf_female').length
    const totalWeight = active.reduce((sum, c) => sum + (c.weightCurrent || 0), 0)
    const healthIssues = active.filter(c => c.healthStatus !== 'healthy').length
    const pregnantCows = active.filter(c => c.isPregnant).length
    const lactatingCows = active.filter(c => c.lactating).length
    const pendingVacc = active.filter(c => c.nextVaccination && new Date(c.nextVaccination) <= new Date()).length
    const nonCompliant = active.filter(c => !c.legalMarkingCompliant).length

    return {
      total: active.length,
      bulls,
      cows,
      heifers,
      steers,
      calves,
      totalWeight,
      avgWeight: active.length > 0 ? Math.round(totalWeight / active.length) : 0,
      healthIssues,
      pregnantCows,
      lactatingCows,
      pendingVacc,
      nonCompliant,
      breedingRate: cows > 0 ? Math.round((pregnantCows / cows) * 100) : 0,
      beefCattle: active.filter(c => c.purpose === 'beef').length,
      dairyCattle: active.filter(c => c.purpose === 'dairy').length,
      breedingCattle: active.filter(c => c.purpose === 'breeding').length,
    }
  }, [cattle])

  const filteredCattle = useMemo(() => cattle.filter(a => {
    const matchesSearch = a.identificationNumber.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesGender = genderFilter === 'all' || a.gender === genderFilter
    return matchesSearch && matchesGender
  }), [cattle, searchQuery, genderFilter])

  const handleAddAnimal = () => {
    const animal: CattleAnimal = {
      id: `cattle-${Date.now()}`,
      ...newAnimal,
      weightBirth: parseFloat(newAnimal.weightBirth) || undefined,
      status: 'active',
      healthStatus: 'healthy',
      registrationDate: new Date().toISOString(),
      legalMarkingCompliant: false,
    }
    setCattle(prev => [...prev, animal])
    setAddAnimalDialogOpen(false)
    setNewAnimal({
      identificationNumber: '',
      breed: '',
      gender: 'heifer',
      dateOfBirth: '',
      weightBirth: '',
      purpose: 'beef',
      location: '',
      sireId: '',
      damId: '',
      notes: '',
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
          <Beef className="h-5 w-5 text-[#00897B]" />
          <h2 className="font-semibold text-[#1A1A1A]">Cattle Farming</h2>
          <Badge variant="outline" className="bg-green-50 text-green-700">
            {stats.total} head
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />Refresh
          </Button>
          <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setAddAnimalDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />Add Cattle
          </Button>
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-4 pt-2 bg-white border-b">
          <TabsList className="bg-transparent h-10 flex-wrap">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Dashboard</TabsTrigger>
            <TabsTrigger value="herd" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Herd</TabsTrigger>
            <TabsTrigger value="breeding" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Breeding</TabsTrigger>
            <TabsTrigger value="health" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Health</TabsTrigger>
            <TabsTrigger value="weight" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Weight</TabsTrigger>
            <TabsTrigger value="movements" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Movements</TabsTrigger>
            <TabsTrigger value="sales" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Sales</TabsTrigger>
            <TabsTrigger value="compliance" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Compliance</TabsTrigger>
          </TabsList>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {/* Dashboard */}
          <TabsContent value="dashboard" className="m-0 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <StatCard icon={Beef} label="Total Herd" value={stats.total} subValue="active" />
              <StatCard icon={Scale} label="Total Weight" value={formatWeight(stats.totalWeight)} subValue={`avg: ${formatWeight(stats.avgWeight)}`} />
              <StatCard icon={Heart} label="Health Issues" value={stats.healthIssues} subValue="need attention" iconColor="#ef4444" />
              <StatCard icon={Syringe} label="Vaccinations Due" value={stats.pendingVacc} subValue="overdue" iconColor="#f59e0b" />
              <StatCard icon={Droplets} label="Dipping Due" value="0" subValue="overdue" iconColor="#3b82f6" />
              <StatCard icon={ShieldCheck} label="Non-Compliant" value={stats.nonCompliant} subValue="marking issues" iconColor="#ef4444" />
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
                  {cattle.length === 0 ? (
                    <EmptyState
                      icon={Beef}
                      title="No Cattle Registered"
                      description="Start by adding your cattle to track health, breeding, and production."
                      actionLabel="Add First Animal"
                      onAction={() => setAddAnimalDialogOpen(true)}
                    />
                  ) : (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg text-center">
                        <p className="text-3xl font-bold text-blue-700">{stats.bulls}</p>
                        <p className="text-sm text-blue-600">Bulls ♂</p>
                      </div>
                      <div className="p-4 bg-pink-50 rounded-lg text-center">
                        <p className="text-3xl font-bold text-pink-700">{stats.cows}</p>
                        <p className="text-sm text-pink-600">Cows ♀</p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg text-center">
                        <p className="text-3xl font-bold text-purple-700">{stats.heifers}</p>
                        <p className="text-sm text-purple-600">Heifers ♀</p>
                      </div>
                      <div className="p-4 bg-orange-50 rounded-lg text-center">
                        <p className="text-3xl font-bold text-orange-700">{stats.steers}</p>
                        <p className="text-sm text-orange-600">Steers ♂</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg text-center">
                        <p className="text-3xl font-bold text-green-700">{stats.calves}</p>
                        <p className="text-sm text-green-600">Calves</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg text-center">
                        <p className="text-2xl font-bold text-gray-700">{stats.breedingRate}%</p>
                        <p className="text-sm text-gray-600">Pregnancy Rate</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Production Purpose */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-5 w-5 text-[#00897B]" />
                    Production Purpose
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Beef Production</span>
                        <span className="font-medium">{stats.beefCattle} head</span>
                      </div>
                      <Progress value={stats.total > 0 ? (stats.beefCattle / stats.total) * 100 : 0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Dairy Production</span>
                        <span className="font-medium">{stats.dairyCattle} head</span>
                      </div>
                      <Progress value={stats.total > 0 ? (stats.dairyCattle / stats.total) * 100 : 0} className="h-2 [&>div]:bg-blue-500" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Breeding Stock</span>
                        <span className="font-medium">{stats.breedingCattle} head</span>
                      </div>
                      <Progress value={stats.total > 0 ? (stats.breedingCattle / stats.total) * 100 : 0} className="h-2 [&>div]:bg-purple-500" />
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
                    <Plus className="h-5 w-5 mb-1 text-[#00897B]" />
                    <span className="text-xs">Add Animal</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex-col" onClick={() => setBreedingDialogOpen(true)}>
                    <GitBranch className="h-5 w-5 mb-1 text-pink-500" />
                    <span className="text-xs">Breeding</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex-col" onClick={() => setHealthDialogOpen(true)}>
                    <Syringe className="h-5 w-5 mb-1 text-green-500" />
                    <span className="text-xs">Health</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex-col" onClick={() => setWeightDialogOpen(true)}>
                    <Scale className="h-5 w-5 mb-1 text-blue-500" />
                    <span className="text-xs">Weight</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex-col" onClick={() => setMovementDialogOpen(true)}>
                    <Truck className="h-5 w-5 mb-1 text-orange-500" />
                    <span className="text-xs">Movement</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex-col" onClick={() => setSaleDialogOpen(true)}>
                    <DollarSign className="h-5 w-5 mb-1 text-green-600" />
                    <span className="text-xs">Sale</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* SA Compliance */}
            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-amber-500" />
                  South African Compliance Requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Animal Identification Act (Act 6 of 2002)</p>
                      <p className="text-[#757575]">All cattle must be legally marked with brand or tattoo</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Stock Theft Prevention</p>
                      <p className="text-[#757575]">Maintain accurate stock registers for SAPS inspection</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Movement Permits</p>
                      <p className="text-[#757575]">Required for all animal movements between farms</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Brucellosis Control</p>
                      <p className="text-[#757575]">Mandatory S19 vaccination for heifers (4-8 months)</p>
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
                <Input
                  placeholder="Search by tag number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="bull">Bulls</SelectItem>
                  <SelectItem value="cow">Cows</SelectItem>
                  <SelectItem value="heifer">Heifers</SelectItem>
                  <SelectItem value="steer">Steers</SelectItem>
                </SelectContent>
              </Select>
              <Button className="bg-[#00897B]" onClick={() => setAddAnimalDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />Add
              </Button>
            </div>
            
            {filteredCattle.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <EmptyState
                    icon={Beef}
                    title="No Cattle Found"
                    description={searchQuery ? "Try adjusting your search" : "Start by adding your first animal."}
                    actionLabel={!searchQuery ? "Add First Animal" : undefined}
                    onAction={!searchQuery ? () => setAddAnimalDialogOpen(true) : undefined}
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCattle.map(animal => (
                  <Card key={animal.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 bg-[#E0F2F1]">
                            <AvatarFallback className="bg-[#00897B] text-white">
                              <Beef className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{animal.identificationNumber}</p>
                            <p className="text-xs text-[#757575]">{animal.breed}</p>
                          </div>
                        </div>
                        <Badge className={getHealthStatusColor(animal.healthStatus)}>
                          {animal.healthStatus}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                        <div>
                          <span className="text-[#757575]">Gender:</span>
                          <span className="ml-1 font-medium">{genderLabels[animal.gender]}</span>
                        </div>
                        <div>
                          <span className="text-[#757575]">Age:</span>
                          <span className="ml-1 font-medium">{calculateAge(animal.dateOfBirth)}</span>
                        </div>
                        <div>
                          <span className="text-[#757575]">Weight:</span>
                          <span className="ml-1 font-medium">{formatWeight(animal.weightCurrent)}</span>
                        </div>
                        <div>
                          <span className="text-[#757575]">Location:</span>
                          <span className="ml-1 font-medium">{animal.location || 'N/A'}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mb-3">
                        {animal.isPregnant && <Badge className="bg-pink-100 text-pink-700 text-xs">Pregnant</Badge>}
                        {animal.lactating && <Badge className="bg-blue-100 text-blue-700 text-xs">Lactating</Badge>}
                        {!animal.legalMarkingCompliant && <Badge className="bg-red-100 text-red-700 text-xs">⚠ Non-Compliant</Badge>}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => { setSelectedAnimal(animal); setAnimalDetailDialogOpen(true) }}>
                          <Eye className="h-3 w-3 mr-1" />Details
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => setHealthDialogOpen(true)}>
                          <Syringe className="h-3 w-3 mr-1" />Health
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* Other Tabs */}
          <TabsContent value="breeding" className="m-0">
            <Card><CardContent className="py-8">
              <EmptyState icon={GitBranch} title="Breeding Management" description="Track breeding records, pregnancy checks, calving, and genetic lineage." actionLabel="Add Breeding Record" onAction={() => setBreedingDialogOpen(true)} />
            </CardContent></Card>
          </TabsContent>
          <TabsContent value="health" className="m-0">
            <Card><CardContent className="py-8">
              <EmptyState icon={Heart} title="Health & Veterinary Records" description="Manage vaccinations, treatments, dipping, deworming, and health checks." actionLabel="Add Health Record" onAction={() => setHealthDialogOpen(true)} />
            </CardContent></Card>
          </TabsContent>
          <TabsContent value="weight" className="m-0">
            <Card><CardContent className="py-8">
              <EmptyState icon={Scale} title="Weight Management" description="Track weights, calculate ADG, body condition scores, and growth performance." actionLabel="Add Weight Record" onAction={() => setWeightDialogOpen(true)} />
            </CardContent></Card>
          </TabsContent>
          <TabsContent value="movements" className="m-0">
            <Card><CardContent className="py-8">
              <EmptyState icon={Truck} title="Movement Tracking" description="Record animal movements with permits, veterinary certificates, and transport details." actionLabel="Record Movement" onAction={() => setMovementDialogOpen(true)} />
            </CardContent></Card>
          </TabsContent>
          <TabsContent value="sales" className="m-0">
            <Card><CardContent className="py-8">
              <EmptyState icon={DollarSign} title="Sales & Marketing" description="Record sales to auctions, abattoirs, or private buyers." actionLabel="Record Sale" onAction={() => setSaleDialogOpen(true)} />
            </CardContent></Card>
          </TabsContent>
          <TabsContent value="compliance" className="m-0">
            <Card><CardContent className="py-8">
              <EmptyState icon={ShieldCheck} title="SA Agriculture Compliance" description="Track Animal Identification Act compliance, stock theft registers, and movement permits." actionLabel="Add Compliance Item" />
            </CardContent></Card>
          </TabsContent>
        </div>
      </Tabs>
      
      {/* Add Animal Dialog */}
      <Dialog open={addAnimalDialogOpen} onOpenChange={setAddAnimalDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Beef className="h-5 w-5 text-[#00897B]" />
              Register New Animal
            </DialogTitle>
            <DialogDescription>
              Add a new animal to your herd with full traceability
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Identification Number (Ear Tag) *</Label>
                <Input value={newAnimal.identificationNumber} onChange={(e) => setNewAnimal(prev => ({ ...prev, identificationNumber: e.target.value }))} placeholder="e.g., ZA-EC-2024-0001" />
                <p className="text-xs text-[#757575] mt-1">SA format: Province-Herd-Year-Number</p>
              </div>
              <div>
                <Label>Breed *</Label>
                <Select value={newAnimal.breed} onValueChange={(v) => setNewAnimal(prev => ({ ...prev, breed: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select breed" /></SelectTrigger>
                  <SelectContent>
                    {cattleBreeds.map(b => <SelectItem key={b.value} value={b.value}>{b.label} ({b.type})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Gender *</Label>
                <Select value={newAnimal.gender} onValueChange={(v) => setNewAnimal(prev => ({ ...prev, gender: v as CattleAnimal['gender'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bull">Bull ♂</SelectItem>
                    <SelectItem value="cow">Cow ♀</SelectItem>
                    <SelectItem value="heifer">Heifer ♀</SelectItem>
                    <SelectItem value="steer">Steer ♂</SelectItem>
                    <SelectItem value="calf_male">Bull Calf ♂</SelectItem>
                    <SelectItem value="calf_female">Heifer Calf ♀</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date of Birth *</Label>
                <Input type="date" value={newAnimal.dateOfBirth} onChange={(e) => setNewAnimal(prev => ({ ...prev, dateOfBirth: e.target.value }))} />
              </div>
              <div>
                <Label>Birth Weight (kg)</Label>
                <Input type="number" value={newAnimal.weightBirth} onChange={(e) => setNewAnimal(prev => ({ ...prev, weightBirth: e.target.value }))} placeholder="e.g., 35" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Purpose *</Label>
                <Select value={newAnimal.purpose} onValueChange={(v) => setNewAnimal(prev => ({ ...prev, purpose: v as CattleAnimal['purpose'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beef">Beef Production</SelectItem>
                    <SelectItem value="dairy">Dairy Production</SelectItem>
                    <SelectItem value="breeding">Breeding Stock</SelectItem>
                    <SelectItem value="draft">Draft Animal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Location (Camp)</Label>
                <Input value={newAnimal.location} onChange={(e) => setNewAnimal(prev => ({ ...prev, location: e.target.value }))} placeholder="e.g., Camp 1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Sire ID (Father)</Label>
                <Input value={newAnimal.sireId} onChange={(e) => setNewAnimal(prev => ({ ...prev, sireId: e.target.value }))} placeholder="Ear tag number" />
              </div>
              <div>
                <Label>Dam ID (Mother)</Label>
                <Input value={newAnimal.damId} onChange={(e) => setNewAnimal(prev => ({ ...prev, damId: e.target.value }))} placeholder="Ear tag number" />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={newAnimal.notes} onChange={(e) => setNewAnimal(prev => ({ ...prev, notes: e.target.value }))} placeholder="Additional notes..." rows={2} />
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800">South African Compliance</p>
                  <p className="text-amber-700">Ensure the animal is legally marked within 7 days per the Animal Identification Act (Act 6 of 2002).</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddAnimalDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleAddAnimal} disabled={!newAnimal.identificationNumber || !newAnimal.breed || !newAnimal.dateOfBirth}>
              Register Animal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
