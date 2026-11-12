'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  Rabbit,
  Heart,
  Syringe,
  Scale,
  Scissors,
  Users,
  AlertTriangle,
  ShieldCheck,
  Plus,
  Search,
  Eye,
  RefreshCw,
  MapPin,
  TrendingUp,
  Calendar,
  Target,
  DollarSign,
  Truck,
  Droplets,
  Leaf,
} from 'lucide-react'

// =====================================================
// SHEEP & GOAT FARMING TYPES
// =====================================================

interface SmallStockAnimal {
  id: string
  identificationNumber: string
  animalType: 'sheep' | 'goat'
  breed: string
  gender: 'ram' | 'ewe' | 'wether' | 'lamb_male' | 'lamb_female' | 'buck' | 'doe' | 'kid_male' | 'kid_female'
  dateOfBirth: string
  weightCurrent?: number
  purpose: 'meat' | 'wool' | 'mohair' | 'dairy' | 'breeding'
  status: 'active' | 'sold' | 'deceased'
  healthStatus: 'healthy' | 'sick' | 'quarantine'
  location: string
  sireId?: string
  damId?: string
  // Wool/Mohair tracking
  lastShearingDate?: string
  fleeceWeight?: number
  micronCount?: number
  // Dairy tracking (goats)
  lactating?: boolean
  dailyMilkYield?: number
  legalMarkingCompliant: boolean
}

// =====================================================
// CONSTANTS - SOUTH AFRICAN SHEEP & GOAT BREEDS
// =====================================================

const sheepBreeds = [
  { value: 'merino', label: 'Merino', purpose: ['wool', 'meat'] },
  { value: 'dorper', label: 'Dorper', purpose: ['meat'] },
  { value: 'dohne_merino', label: 'Dohne Merino', purpose: ['wool', 'meat'] },
  { value: 'south_african_mutton_merino', label: 'SA Mutton Merino', purpose: ['meat', 'wool'] },
  { value: 'awassi', label: 'Awassi', purpose: ['dairy', 'meat'] },
  { value: 'damara', label: 'Damara', purpose: ['meat'] },
  { value: 'blackhead_persian', label: 'Blackhead Persian', purpose: ['meat'] },
  { value: 'van_rooy', label: 'Van Rooy', purpose: ['meat'] },
  { value: 'wiltshire_horn', label: 'Wiltshire Horn', purpose: ['meat'] },
  { value: 'finnsheep', label: 'Finnsheep', purpose: ['meat', 'wool'] },
]

const goatBreeds = [
  { value: 'boer', label: 'Boer Goat', purpose: ['meat'] },
  { value: 'angora', label: 'Angora', purpose: ['mohair'] },
  { value: 'saanen', label: 'Saanen', purpose: ['dairy'] },
  { value: 'toggenburg', label: 'Toggenburg', purpose: ['dairy'] },
  { value: 'alpine', label: 'Alpine', purpose: ['dairy'] },
  { value: 'kiko', label: 'Kiko', purpose: ['meat'] },
  { value: 'savanna', label: 'Savanna', purpose: ['meat'] },
  { value: 'kalahari_red', label: 'Kalahari Red', purpose: ['meat'] },
]

const genderLabels: Record<string, string> = {
  ram: 'Ram ♂',
  ewe: 'Ewe ♀',
  wether: 'Wether ♂',
  lamb_male: 'Ram Lamb ♂',
  lamb_female: 'Ewe Lamb ♀',
  buck: 'Buck ♂',
  doe: 'Doe ♀',
  kid_male: 'Buck Kid ♂',
  kid_female: 'Doe Kid ♀',
}

// Helper
const calculateAge = (dob: string) => {
  const birth = new Date(dob)
  const today = new Date()
  const months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth())
  if (months < 12) return `${months} mo`
  const years = Math.floor(months / 12)
  const rem = months % 12
  return rem > 0 ? `${years}y ${rem}mo` : `${years}y`
}

const formatWeight = (weight?: number) => weight ? `${weight.toLocaleString()} kg` : 'N/A'

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

export function SheepGoatFarmingView() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'sheep' | 'goat'>('all')
  
  const [animals, setAnimals] = useState<SmallStockAnimal[]>([])
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [shearingDialogOpen, setShearingDialogOpen] = useState(false)
  const [healthDialogOpen, setHealthDialogOpen] = useState(false)
  
  const [newAnimal, setNewAnimal] = useState({
    identificationNumber: '',
    animalType: 'sheep' as 'sheep' | 'goat',
    breed: '',
    gender: 'ewe' as SmallStockAnimal['gender'],
    dateOfBirth: '',
    purpose: 'meat' as SmallStockAnimal['purpose'],
    location: '',
  })

  useEffect(() => {
    setTimeout(() => setLoading(false), 500)
  }, [])

  const stats = useMemo(() => {
    const active = animals.filter(a => a.status === 'active')
    const sheep = active.filter(a => a.animalType === 'sheep')
    const goats = active.filter(a => a.animalType === 'goat')
    const rams = active.filter(a => a.gender === 'ram' || a.gender === 'buck').length
    const ewes = active.filter(a => a.gender === 'ewe' || a.gender === 'doe').length
    const lambs = active.filter(a => a.gender.includes('lamb') || a.gender.includes('kid')).length
    const totalWeight = active.reduce((sum, a) => sum + (a.weightCurrent || 0), 0)
    const healthIssues = active.filter(a => a.healthStatus !== 'healthy').length
    const woolProducers = active.filter(a => a.purpose === 'wool').length
    const dairyProducers = active.filter(a => a.purpose === 'dairy').length
    const meatProducers = active.filter(a => a.purpose === 'meat').length
    const nonCompliant = active.filter(a => !a.legalMarkingCompliant).length

    return {
      total: active.length,
      sheep: sheep.length,
      goats: goats.length,
      rams,
      ewes,
      lambs,
      totalWeight,
      avgWeight: active.length > 0 ? Math.round(totalWeight / active.length) : 0,
      healthIssues,
      woolProducers,
      dairyProducers,
      meatProducers,
      nonCompliant,
    }
  }, [animals])

  const filteredAnimals = useMemo(() => animals.filter(a => {
    const matchesSearch = a.identificationNumber.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === 'all' || a.animalType === typeFilter
    return matchesSearch && matchesType
  }), [animals, searchQuery, typeFilter])

  const handleAddAnimal = () => {
    const animal: SmallStockAnimal = {
      id: `ss-${Date.now()}`,
      ...newAnimal,
      status: 'active',
      healthStatus: 'healthy',
      legalMarkingCompliant: false,
    }
    setAnimals(prev => [...prev, animal])
    setAddDialogOpen(false)
    setNewAnimal({
      identificationNumber: '',
      animalType: 'sheep',
      breed: '',
      gender: 'ewe',
      dateOfBirth: '',
      purpose: 'meat',
      location: '',
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
          <Leaf className="h-5 w-5 text-[#00897B]" />
          <h2 className="font-semibold text-[#1A1A1A]">Sheep & Goat Farming</h2>
          <Badge variant="outline" className="bg-amber-50 text-amber-700">
            {stats.sheep} sheep, {stats.goats} goats
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><RefreshCw className="h-4 w-4 mr-1" />Refresh</Button>
          <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setAddDialogOpen(true)}>
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
            <TabsTrigger value="wool_mohair" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Wool/Mohair</TabsTrigger>
            <TabsTrigger value="breeding" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Breeding</TabsTrigger>
            <TabsTrigger value="health" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Health</TabsTrigger>
            <TabsTrigger value="sales" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Sales</TabsTrigger>
            <TabsTrigger value="compliance" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Compliance</TabsTrigger>
          </TabsList>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {/* Dashboard */}
          <TabsContent value="dashboard" className="m-0 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <StatCard icon={Leaf} label="Total Flock" value={stats.total} subValue="animals" />
              <StatCard icon={Scale} label="Total Weight" value={formatWeight(stats.totalWeight)} subValue={`avg: ${formatWeight(stats.avgWeight)}`} />
              <StatCard icon={Heart} label="Health Issues" value={stats.healthIssues} subValue="need attention" iconColor="#ef4444" />
              <StatCard icon={Scissors} label="Wool/Mohair" value={stats.woolProducers} subValue="producers" iconColor="#f59e0b" />
              <StatCard icon={Droplets} label="Dairy" value={stats.dairyProducers} subValue="milking" iconColor="#3b82f6" />
              <StatCard icon={ShieldCheck} label="Non-Compliant" value={stats.nonCompliant} subValue="marking issues" iconColor="#ef4444" />
            </div>
            
            {/* Flock Composition */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#00897B]" />
                    Flock Composition
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {animals.length === 0 ? (
                    <EmptyState icon={Leaf} title="No Animals Registered" description="Start by adding your flock." actionLabel="Add First Animal" onAction={() => setAddDialogOpen(true)} />
                  ) : (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg text-center">
                        <p className="text-3xl font-bold text-blue-700">{stats.rams}</p>
                        <p className="text-sm text-blue-600">Rams/Bucks ♂</p>
                      </div>
                      <div className="p-4 bg-pink-50 rounded-lg text-center">
                        <p className="text-3xl font-bold text-pink-700">{stats.ewes}</p>
                        <p className="text-sm text-pink-600">Ewes/Does ♀</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg text-center">
                        <p className="text-3xl font-bold text-green-700">{stats.lambs}</p>
                        <p className="text-sm text-green-600">Lambs/Kids</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
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
                      <div className="flex justify-between text-sm mb-1"><span>Meat Production</span><span>{stats.meatProducers}</span></div>
                      <Progress value={stats.total > 0 ? (stats.meatProducers / stats.total) * 100 : 0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1"><span>Wool/Mohair</span><span>{stats.woolProducers}</span></div>
                      <Progress value={stats.total > 0 ? (stats.woolProducers / stats.total) * 100 : 0} className="h-2 [&>div]:bg-amber-500" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1"><span>Dairy</span><span>{stats.dairyProducers}</span></div>
                      <Progress value={stats.total > 0 ? (stats.dairyProducers / stats.total) * 100 : 0} className="h-2 [&>div]:bg-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* SA Compliance */}
            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-amber-500" />
                  SA Small Stock Compliance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Animal Identification Act</p>
                      <p className="text-[#757575]">Ear tags or tattoos required for all sheep & goats</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Scrapie Control</p>
                      <p className="text-[#757575]">Monitor for scrapie symptoms, report to state vet</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Internal Parasite Control</p>
                      <p className="text-[#757575]">Regular dosing and dip records required</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Wool/Mohair Marketing</p>
                      <p className="text-[#757575]">Cape Wools / Mohair SA registration</p>
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
                <Input placeholder="Search by tag..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
              </div>
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as 'all' | 'sheep' | 'goat')}>
                <SelectTrigger className="w-[130px]"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="sheep">Sheep</SelectItem>
                  <SelectItem value="goat">Goats</SelectItem>
                </SelectContent>
              </Select>
              <Button className="bg-[#00897B]" onClick={() => setAddDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Add</Button>
            </div>
            
            {filteredAnimals.length === 0 ? (
              <Card><CardContent className="py-8"><EmptyState icon={Leaf} title="No Animals Found" description="Start by adding your flock." actionLabel="Add First Animal" onAction={() => setAddDialogOpen(true)} /></CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAnimals.map(animal => (
                  <Card key={animal.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 bg-[#E0F2F1]">
                            <AvatarFallback className="bg-[#00897B] text-white"><Leaf className="h-5 w-5" /></AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{animal.identificationNumber}</p>
                            <p className="text-xs text-[#757575]">{animal.breed} ({animal.animalType})</p>
                          </div>
                        </div>
                        <Badge className={animal.healthStatus === 'healthy' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                          {animal.healthStatus}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                        <div><span className="text-[#757575]">Gender:</span> <span className="ml-1 font-medium">{genderLabels[animal.gender]}</span></div>
                        <div><span className="text-[#757575]">Age:</span> <span className="ml-1 font-medium">{calculateAge(animal.dateOfBirth)}</span></div>
                        <div><span className="text-[#757575]">Weight:</span> <span className="ml-1 font-medium">{formatWeight(animal.weightCurrent)}</span></div>
                        <div><span className="text-[#757575]">Purpose:</span> <span className="ml-1 font-medium capitalize">{animal.purpose}</span></div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1"><Eye className="h-3 w-3 mr-1" />Details</Button>
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => setHealthDialogOpen(true)}><Syringe className="h-3 w-3 mr-1" />Health</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* Other Tabs */}
          <TabsContent value="wool_mohair" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={Scissors} title="Wool & Mohair Production" description="Track shearing dates, fleece weights, micron counts, and marketing." actionLabel="Add Shearing Record" onAction={() => setShearingDialogOpen(true)} /></CardContent></Card>
          </TabsContent>
          <TabsContent value="breeding" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={Leaf} title="Breeding Management" description="Track mating, lambing, and breeding cycles." actionLabel="Add Breeding Record" /></CardContent></Card>
          </TabsContent>
          <TabsContent value="health" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={Heart} title="Health Records" description="Manage vaccinations, dosing, dipping, and health checks." actionLabel="Add Health Record" onAction={() => setHealthDialogOpen(true)} /></CardContent></Card>
          </TabsContent>
          <TabsContent value="sales" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={DollarSign} title="Sales & Marketing" description="Record sales to auctions, abattoirs, or private buyers." actionLabel="Record Sale" /></CardContent></Card>
          </TabsContent>
          <TabsContent value="compliance" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={ShieldCheck} title="Compliance" description="Track identification, health certificates, and movement permits." actionLabel="Add Compliance Item" /></CardContent></Card>
          </TabsContent>
        </div>
      </Tabs>
      
      {/* Add Animal Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Leaf className="h-5 w-5 text-[#00897B]" />Register Animal</DialogTitle>
            <DialogDescription>Add a new sheep or goat to your flock</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tag Number *</Label>
                <Input value={newAnimal.identificationNumber} onChange={(e) => setNewAnimal(prev => ({ ...prev, identificationNumber: e.target.value }))} placeholder="e.g., S-2024-001" />
              </div>
              <div>
                <Label>Animal Type *</Label>
                <Select value={newAnimal.animalType} onValueChange={(v) => setNewAnimal(prev => ({ ...prev, animalType: v as 'sheep' | 'goat', breed: '', gender: 'ewe' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sheep">Sheep</SelectItem>
                    <SelectItem value="goat">Goat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Breed *</Label>
                <Select value={newAnimal.breed} onValueChange={(v) => setNewAnimal(prev => ({ ...prev, breed: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select breed" /></SelectTrigger>
                  <SelectContent>
                    {(newAnimal.animalType === 'sheep' ? sheepBreeds : goatBreeds).map(b => (
                      <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Gender *</Label>
                <Select value={newAnimal.gender} onValueChange={(v) => setNewAnimal(prev => ({ ...prev, gender: v as SmallStockAnimal['gender'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {newAnimal.animalType === 'sheep' ? (
                      <>
                        <SelectItem value="ram">Ram ♂</SelectItem>
                        <SelectItem value="ewe">Ewe ♀</SelectItem>
                        <SelectItem value="wether">Wether ♂</SelectItem>
                        <SelectItem value="lamb_male">Ram Lamb ♂</SelectItem>
                        <SelectItem value="lamb_female">Ewe Lamb ♀</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="buck">Buck ♂</SelectItem>
                        <SelectItem value="doe">Doe ♀</SelectItem>
                        <SelectItem value="kid_male">Buck Kid ♂</SelectItem>
                        <SelectItem value="kid_female">Doe Kid ♀</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date of Birth *</Label>
                <Input type="date" value={newAnimal.dateOfBirth} onChange={(e) => setNewAnimal(prev => ({ ...prev, dateOfBirth: e.target.value }))} />
              </div>
              <div>
                <Label>Purpose *</Label>
                <Select value={newAnimal.purpose} onValueChange={(v) => setNewAnimal(prev => ({ ...prev, purpose: v as SmallStockAnimal['purpose'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meat">Meat</SelectItem>
                    <SelectItem value="wool">Wool</SelectItem>
                    <SelectItem value="mohair">Mohair</SelectItem>
                    <SelectItem value="dairy">Dairy</SelectItem>
                    <SelectItem value="breeding">Breeding</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Location (Camp)</Label>
              <Input value={newAnimal.location} onChange={(e) => setNewAnimal(prev => ({ ...prev, location: e.target.value }))} placeholder="e.g., Camp 2" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleAddAnimal} disabled={!newAnimal.identificationNumber || !newAnimal.breed || !newAnimal.dateOfBirth}>
              Register
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
