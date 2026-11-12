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
  Fish,
  Heart,
  Syringe,
  Scale,
  Thermometer,
  Beaker,
  Droplets,
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
  MapPin,
  Wind,
} from 'lucide-react'

// =====================================================
// AQUACULTURE TYPES
// =====================================================

interface Pond {
  id: string
  pondName: string
  pondNumber: string
  pondType: 'earthen' | 'concrete' | 'cage' | 'tank' | 'raceway'
  surfaceArea: number // m²
  depth: number // meters
  capacity: number // m³
  status: 'stocked' | 'fallow' | 'preparing' | 'harvesting' | 'maintenance'
  waterSource: 'river' | 'dam' | 'borehole' | 'recirculating'
  stockDensity?: number // fish per m³
  currentStock?: number
  avgWeight?: number
  species?: string
  stockingDate?: string
  expectedHarvestDate?: string
  lastWaterTest?: string
}

interface FishStock {
  id: string
  pondId: string
  pondName: string
  species: string
  batchNumber: string
  stockCount: number
  avgWeight: number // grams
  stockingDate: string
  source: string
  healthStatus: 'healthy' | 'disease' | 'mortality_spike'
  feedType?: string
  feedingRate?: number // % body weight per day
}

interface WaterQualityRecord {
  id: string
  pondId: string
  pondName: string
  testDate: string
  temperature: number // °C
  ph: number
  dissolvedOxygen: number // mg/L
  ammonia: number // mg/L
  nitrite: number // mg/L
  nitrate: number // mg/L
  turbidity: number // NTU
  notes?: string
}

// =====================================================
// CONSTANTS - SOUTH AFRICAN AQUACULTURE
// =====================================================

const fishSpecies = [
  { value: 'tilapia', label: 'Tilapia (Oreochromis)', type: 'freshwater', tempRange: '22-32°C' },
  { value: 'trout', label: 'Trout (Rainbow)', type: 'freshwater', tempRange: '10-18°C' },
  { value: 'catfish', label: 'Catfish (Sharp-tooth)', type: 'freshwater', tempRange: '18-30°C' },
  { value: 'bass', label: 'Largemouth Bass', type: 'freshwater', tempRange: '18-28°C' },
  { value: 'carp', label: 'Carp (Common)', type: 'freshwater', tempRange: '15-30°C' },
  { value: 'koi', label: 'Koi', type: 'ornamental', tempRange: '15-25°C' },
  { value: 'abalone', label: 'Abalone', type: 'marine', tempRange: '12-18°C' },
  { value: 'mussel', label: 'Mussels', type: 'marine', tempRange: '10-20°C' },
  { value: 'prawn', label: 'Prawns (Freshwater)', type: 'freshwater', tempRange: '25-32°C' },
]

const pondTypes = [
  { value: 'earthen', label: 'Earthen Pond' },
  { value: 'concrete', label: 'Concrete Pond' },
  { value: 'cage', label: 'Cage Culture' },
  { value: 'tank', label: 'Tank System' },
  { value: 'raceway', label: 'Raceway' },
]

const waterQualityStandards = [
  { parameter: 'Temperature', min: 20, max: 30, unit: '°C', optimal: '22-28' },
  { parameter: 'pH', min: 6.5, max: 9.0, unit: '', optimal: '7.0-8.5' },
  { parameter: 'Dissolved Oxygen', min: 4, max: 12, unit: 'mg/L', optimal: '5-8' },
  { parameter: 'Ammonia (NH3)', min: 0, max: 0.05, unit: 'mg/L', optimal: '<0.02' },
  { parameter: 'Nitrite (NO2)', min: 0, max: 0.5, unit: 'mg/L', optimal: '<0.1' },
]

// Helper functions
const formatNumber = (n: number) => n.toLocaleString()
const formatWeight = (g: number) => g >= 1000 ? `${(g / 1000).toFixed(2)} kg` : `${g} g`
const formatCurrency = (amount: number) => `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`

const getPondStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    stocked: 'bg-green-100 text-green-700',
    fallow: 'bg-gray-100 text-gray-700',
    preparing: 'bg-orange-100 text-orange-700',
    harvesting: 'bg-amber-100 text-amber-700',
    maintenance: 'bg-red-100 text-red-700',
  }
  return colors[status] || 'bg-gray-100 text-gray-700'
}

const getWaterQualityColor = (value: number, min: number, max: number) => {
  if (value < min || value > max) return 'text-red-600'
  return 'text-green-600'
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

export function AquacultureView() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')

  const [ponds, setPonds] = useState<Pond[]>([])
  const [fishStock, setFishStock] = useState<FishStock[]>([])
  const [waterRecords, setWaterRecords] = useState<WaterQualityRecord[]>([])
  const [addPondDialogOpen, setAddPondDialogOpen] = useState(false)
  const [stockingDialogOpen, setStockingDialogOpen] = useState(false)
  const [waterTestDialogOpen, setWaterTestDialogOpen] = useState(false)

  const [newPond, setNewPond] = useState({
    pondName: '',
    pondNumber: '',
    pondType: 'earthen' as Pond['pondType'],
    surfaceArea: '',
    depth: '',
    waterSource: 'dam' as Pond['waterSource'],
  })

  useEffect(() => {
    setTimeout(() => setLoading(false), 500)
  }, [])

  const stats = useMemo(() => {
    const totalPonds = ponds.length
    const stockedPonds = ponds.filter(p => p.status === 'stocked').length
    const totalStock = ponds.reduce((sum, p) => sum + (p.currentStock || 0), 0)
    const totalBiomass = ponds.reduce((sum, p) => sum + ((p.currentStock || 0) * (p.avgWeight || 0)), 0)
    const avgStockDensity = ponds.filter(p => p.stockDensity).reduce((sum, p) => sum + (p.stockDensity || 0), 0) / (stockedPonds || 1)
    const healthIssues = fishStock.filter(s => s.healthStatus !== 'healthy').length
    const waterTestsNeeded = ponds.filter(p => !p.lastWaterTest || new Date(p.lastWaterTest) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length

    return {
      totalPonds,
      stockedPonds,
      fallowPonds: totalPonds - stockedPonds,
      totalStock,
      totalBiomass,
      avgStockDensity: avgStockDensity.toFixed(1),
      healthIssues,
      waterTestsNeeded,
    }
  }, [ponds, fishStock])

  const handleAddPond = () => {
    const pond: Pond = {
      id: `pond-${Date.now()}`,
      ...newPond,
      surfaceArea: parseFloat(newPond.surfaceArea) || 0,
      depth: parseFloat(newPond.depth) || 0,
      capacity: (parseFloat(newPond.surfaceArea) || 0) * (parseFloat(newPond.depth) || 0),
      status: 'fallow',
    }
    setPonds(prev => [...prev, pond])
    setAddPondDialogOpen(false)
    setNewPond({
      pondName: '',
      pondNumber: '',
      pondType: 'earthen',
      surfaceArea: '',
      depth: '',
      waterSource: 'dam',
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
          <Fish className="h-5 w-5 text-[#00897B]" />
          <h2 className="font-semibold text-[#1A1A1A]">Aquaculture Management</h2>
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {stats.stockedPonds}/{stats.totalPonds} ponds
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />Refresh
          </Button>
          <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setAddPondDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />Add Pond
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-4 pt-2 bg-white border-b">
          <TabsList className="bg-transparent h-10 flex-wrap">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Dashboard</TabsTrigger>
            <TabsTrigger value="ponds" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Ponds</TabsTrigger>
            <TabsTrigger value="stock" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Fish Stock</TabsTrigger>
            <TabsTrigger value="water" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Water Quality</TabsTrigger>
            <TabsTrigger value="feed" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Feeding</TabsTrigger>
            <TabsTrigger value="health" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Health</TabsTrigger>
            <TabsTrigger value="harvest" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Harvest</TabsTrigger>
            <TabsTrigger value="compliance" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Compliance</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Dashboard */}
          <TabsContent value="dashboard" className="m-0 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <StatCard icon={Fish} label="Total Fish Stock" value={formatNumber(stats.totalStock)} subValue="fish" />
              <StatCard icon={Scale} label="Total Biomass" value={formatWeight(stats.totalBiomass)} subValue="estimated" />
              <StatCard icon={Droplets} label="Stocked Ponds" value={stats.stockedPonds} subValue={`of ${stats.totalPonds} total`} />
              <StatCard icon={Target} label="Avg Density" value={`${stats.avgStockDensity} fish/m³`} subValue="stocking rate" />
              <StatCard icon={Heart} label="Health Issues" value={stats.healthIssues} subValue="need attention" iconColor="#ef4444" />
              <StatCard icon={Beaker} label="Water Tests Due" value={stats.waterTestsNeeded} subValue="overdue" iconColor="#f59e0b" />
            </div>

            {/* Ponds Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Droplets className="h-5 w-5 text-[#00897B]" />
                    Ponds Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {ponds.length === 0 ? (
                    <EmptyState icon={Fish} title="No Ponds Registered" description="Start by adding your ponds or tanks." actionLabel="Add First Pond" onAction={() => setAddPondDialogOpen(true)} />
                  ) : (
                    <div className="space-y-3">
                      {ponds.slice(0, 5).map(pond => (
                        <div key={pond.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{pond.pondName} ({pond.pondNumber})</span>
                            <Badge className={getPondStatusColor(pond.status)}>{pond.status}</Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs text-[#757575]">
                            <span>{pond.surfaceArea} m² × {pond.depth}m</span>
                            <span>{pond.species || 'No stock'} • {formatNumber(pond.currentStock || 0)}</span>
                          </div>
                          <Progress value={pond.currentStock ? (pond.currentStock / 5000) * 100 : 0} className="h-1.5 mt-2" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Beaker className="h-5 w-5 text-[#00897B]" />
                    Water Quality Standards
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {waterQualityStandards.map((param, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium">{param.parameter}</span>
                          <span className="text-xs text-[#757575] ml-2">({param.optimal} {param.unit})</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {param.min}-{param.max} {param.unit}
                        </Badge>
                      </div>
                    ))}
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
                  <Button variant="outline" className="h-auto py-3 flex-col" onClick={() => setAddPondDialogOpen(true)}>
                    <Droplets className="h-5 w-5 mb-1 text-[#00897B]" />
                    <span className="text-xs">Add Pond</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex-col" onClick={() => setStockingDialogOpen(true)}>
                    <Fish className="h-5 w-5 mb-1 text-blue-500" />
                    <span className="text-xs">Stock Fish</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex-col" onClick={() => setWaterTestDialogOpen(true)}>
                    <Beaker className="h-5 w-5 mb-1 text-green-500" />
                    <span className="text-xs">Water Test</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex-col">
                    <Target className="h-5 w-5 mb-1 text-amber-500" />
                    <span className="text-xs">Feed Fish</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex-col">
                    <Syringe className="h-5 w-5 mb-1 text-red-500" />
                    <span className="text-xs">Health Check</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex-col">
                    <Truck className="h-5 w-5 mb-1 text-orange-500" />
                    <span className="text-xs">Harvest</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* SA Compliance */}
            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-amber-500" />
                  SA Aquaculture Compliance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Aquaculture License</p>
                      <p className="text-[#757575]">Required from DAFF for commercial fish farming</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Water Use License</p>
                      <p className="text-[#757575]">Required for water abstraction from DWS</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Environmental Impact</p>
                      <p className="text-[#757575]">EIA may be required for large operations</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Health Certificates</p>
                      <p className="text-[#757575]">Required for fish movement and sales</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other Tabs */}
          <TabsContent value="ponds" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={Droplets} title="Pond Management" description="Manage ponds, tanks, cages, and raceways." actionLabel="Add Pond" onAction={() => setAddPondDialogOpen(true)} /></CardContent></Card>
          </TabsContent>
          <TabsContent value="stock" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={Fish} title="Fish Stock Management" description="Track fish batches, species, stocking dates, and growth." actionLabel="Add Stock" onAction={() => setStockingDialogOpen(true)} /></CardContent></Card>
          </TabsContent>
          <TabsContent value="water" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={Beaker} title="Water Quality" description="Monitor pH, oxygen, ammonia, nitrite, and temperature." actionLabel="Add Water Test" onAction={() => setWaterTestDialogOpen(true)} /></CardContent></Card>
          </TabsContent>
          <TabsContent value="feed" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={Target} title="Feeding Management" description="Track feed types, rates, FCR, and schedules." actionLabel="Add Feed Record" /></CardContent></Card>
          </TabsContent>
          <TabsContent value="health" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={Heart} title="Fish Health" description="Monitor disease, mortality, treatments, and biosecurity." actionLabel="Add Health Record" /></CardContent></Card>
          </TabsContent>
          <TabsContent value="harvest" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={Truck} title="Harvest & Sales" description="Record harvests, grading, and sales to market." actionLabel="Add Harvest" /></CardContent></Card>
          </TabsContent>
          <TabsContent value="compliance" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={ShieldCheck} title="Compliance" description="Track licenses, permits, and regulatory requirements." actionLabel="Add Compliance Item" /></CardContent></Card>
          </TabsContent>
        </div>
      </Tabs>

      {/* Add Pond Dialog */}
      <Dialog open={addPondDialogOpen} onOpenChange={setAddPondDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Droplets className="h-5 w-5 text-[#00897B]" />Add Pond/Tank</DialogTitle>
            <DialogDescription>Register a new pond or tank</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Pond Name *</Label>
                <Input value={newPond.pondName} onChange={(e) => setNewPond(prev => ({ ...prev, pondName: e.target.value }))} placeholder="e.g., Production Pond 1" />
              </div>
              <div>
                <Label>Pond Number</Label>
                <Input value={newPond.pondNumber} onChange={(e) => setNewPond(prev => ({ ...prev, pondNumber: e.target.value }))} placeholder="e.g., P-01" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Pond Type *</Label>
                <Select value={newPond.pondType} onValueChange={(v) => setNewPond(prev => ({ ...prev, pondType: v as Pond['pondType'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {pondTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Water Source</Label>
                <Select value={newPond.waterSource} onValueChange={(v) => setNewPond(prev => ({ ...prev, waterSource: v as Pond['waterSource'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="river">River</SelectItem>
                    <SelectItem value="dam">Dam</SelectItem>
                    <SelectItem value="borehole">Borehole</SelectItem>
                    <SelectItem value="recirculating">Recirculating</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Surface Area (m²) *</Label>
                <Input type="number" value={newPond.surfaceArea} onChange={(e) => setNewPond(prev => ({ ...prev, surfaceArea: e.target.value }))} placeholder="e.g., 1000" />
              </div>
              <div>
                <Label>Depth (m) *</Label>
                <Input type="number" step="0.1" value={newPond.depth} onChange={(e) => setNewPond(prev => ({ ...prev, depth: e.target.value }))} placeholder="e.g., 1.5" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddPondDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleAddPond} disabled={!newPond.pondName || !newPond.surfaceArea || !newPond.depth}>
              Add Pond
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
