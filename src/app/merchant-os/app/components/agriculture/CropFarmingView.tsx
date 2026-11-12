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
  Wheat,
  Leaf,
  TreeDeciduous,
  Droplets,
  Sun,
  CloudRain,
  Thermometer,
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
  Beaker,
  Sprout,
} from 'lucide-react'

// =====================================================
// CROP FARMING TYPES
// =====================================================

interface CropField {
  id: string
  fieldName: string
  fieldNumber: string
  totalHectares: number
  soilType: string
  irrigationType: 'rain_fed' | 'center_pivot' | 'drip' | 'flood' | 'sprinkler'
  status: 'planted' | 'growing' | 'harvesting' | 'fallow' | 'preparing'
  currentCrop?: string
  plantingDate?: string
  expectedHarvestDate?: string
  actualHarvestDate?: string
  expectedYield?: number
  actualYield?: number
  yieldUnit: string
  notes?: string
}

interface CropRecord {
  id: string
  fieldId: string
  fieldName: string
  cropType: string
  variety: string
  season: string
  plantingDate: string
  harvestDate?: string
  hectaresPlanted: number
  expectedYield: number
  actualYield?: number
  yieldUnit: string
  totalInputCost: number
  revenue?: number
  status: 'planted' | 'growing' | 'harvested' | 'failed'
}

interface InputApplication {
  id: string
  fieldId: string
  type: 'fertilizer' | 'pesticide' | 'herbicide' | 'seed' | 'lime'
  productName: string
  applicationDate: string
  quantity: number
  unit: string
  cost: number
  applicator?: string
  notes?: string
}

// =====================================================
// CONSTANTS - SOUTH AFRICAN CROPS
// =====================================================

const cropTypes = [
  // Grain Crops
  { value: 'maize', label: 'Maize (Corn)', category: 'grain', season: 'summer' },
  { value: 'wheat', label: 'Wheat', category: 'grain', season: 'winter' },
  { value: 'barley', label: 'Barley', category: 'grain', season: 'winter' },
  { value: 'sorghum', label: 'Sorghum', category: 'grain', season: 'summer' },
  { value: 'sunflower', label: 'Sunflower', category: 'oilseed', season: 'summer' },
  { value: 'soybeans', label: 'Soybeans', category: 'legume', season: 'summer' },
  { value: 'groundnuts', label: 'Groundnuts', category: 'legume', season: 'summer' },
  // Vegetables
  { value: 'potato', label: 'Potatoes', category: 'vegetable', season: 'year_round' },
  { value: 'tomato', label: 'Tomatoes', category: 'vegetable', season: 'summer' },
  { value: 'onion', label: 'Onions', category: 'vegetable', season: 'winter' },
  { value: 'cabbage', label: 'Cabbage', category: 'vegetable', season: 'winter' },
  { value: 'carrot', label: 'Carrots', category: 'vegetable', season: 'winter' },
  // Fruit
  { value: 'citrus', label: 'Citrus', category: 'fruit', season: 'year_round' },
  { value: 'apple', label: 'Apples', category: 'fruit', season: 'year_round' },
  { value: 'grape', label: 'Grapes', category: 'fruit', season: 'year_round' },
  { value: 'avocado', label: 'Avocado', category: 'fruit', season: 'year_round' },
  // Sugarcane
  { value: 'sugarcane', label: 'Sugarcane', category: 'industrial', season: 'year_round' },
]

const soilTypes = [
  'Sand', 'Loamy Sand', 'Sandy Loam', 'Loam', 'Silt Loam', 'Clay Loam', 'Clay', 'Peat'
]

const irrigationTypes = [
  { value: 'rain_fed', label: 'Rain-fed (Dryland)' },
  { value: 'center_pivot', label: 'Center Pivot' },
  { value: 'drip', label: 'Drip Irrigation' },
  { value: 'sprinkler', label: 'Sprinkler' },
  { value: 'flood', label: 'Flood Irrigation' },
]

const saProvinces = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
  'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'
]

// Helper functions
const formatHectares = (ha: number) => `${ha.toLocaleString()} ha`
const formatYield = (yield_: number, unit: string) => `${yield_.toLocaleString()} ${unit}`
const formatCurrency = (amount: number) => `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    planted: 'bg-green-100 text-green-700',
    growing: 'bg-blue-100 text-blue-700',
    harvesting: 'bg-amber-100 text-amber-700',
    harvested: 'bg-purple-100 text-purple-700',
    fallow: 'bg-gray-100 text-gray-700',
    preparing: 'bg-orange-100 text-orange-700',
    failed: 'bg-red-100 text-red-700',
  }
  return colors[status] || 'bg-gray-100 text-gray-700'
}

const getCropIcon = (category: string) => {
  switch (category) {
    case 'grain': return Wheat
    case 'vegetable': return Leaf
    case 'fruit': return TreeDeciduous
    case 'industrial': return Sprout
    default: return Leaf
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

export function CropFarmingView() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')

  const [fields, setFields] = useState<CropField[]>([])
  const [cropRecords, setCropRecords] = useState<CropRecord[]>([])
  const [inputApplications, setInputApplications] = useState<InputApplication[]>([])
  const [addFieldDialogOpen, setAddFieldDialogOpen] = useState(false)
  const [plantingDialogOpen, setPlantingDialogOpen] = useState(false)
  const [applicationDialogOpen, setApplicationDialogOpen] = useState(false)

  const [newField, setNewField] = useState({
    fieldName: '',
    fieldNumber: '',
    totalHectares: '',
    soilType: 'Loam',
    irrigationType: 'rain_fed' as CropField['irrigationType'],
  })

  useEffect(() => {
    setTimeout(() => setLoading(false), 500)
  }, [])

  const stats = useMemo(() => {
    const totalHectares = fields.reduce((sum, f) => sum + f.totalHectares, 0)
    const plantedHectares = fields.filter(f => f.status === 'planted' || f.status === 'growing')
      .reduce((sum, f) => sum + f.totalHectares, 0)
    const activeCrops = [...new Set(fields.filter(f => f.currentCrop).map(f => f.currentCrop))]
    const harvestedYield = cropRecords.filter(r => r.status === 'harvested' && r.actualYield)
      .reduce((sum, r) => sum + (r.actualYield || 0), 0)
    const totalRevenue = cropRecords.filter(r => r.revenue)
      .reduce((sum, r) => sum + (r.revenue || 0), 0)
    const totalInputCost = inputApplications.reduce((sum, a) => sum + a.cost, 0)

    return {
      totalFields: fields.length,
      totalHectares,
      plantedHectares,
      fallowHectares: totalHectares - plantedHectares,
      activeCrops: activeCrops.length,
      harvestedYield,
      totalRevenue,
      totalInputCost,
      profitMargin: totalRevenue > 0 ? ((totalRevenue - totalInputCost) / totalRevenue * 100).toFixed(1) : '0',
    }
  }, [fields, cropRecords, inputApplications])

  const handleAddField = () => {
    const field: CropField = {
      id: `field-${Date.now()}`,
      ...newField,
      totalHectares: parseFloat(newField.totalHectares) || 0,
      status: 'fallow',
      yieldUnit: 't/ha',
    }
    setFields(prev => [...prev, field])
    setAddFieldDialogOpen(false)
    setNewField({
      fieldName: '',
      fieldNumber: '',
      totalHectares: '',
      soilType: 'Loam',
      irrigationType: 'rain_fed',
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
          <Wheat className="h-5 w-5 text-[#00897B]" />
          <h2 className="font-semibold text-[#1A1A1A]">Crop Farming</h2>
          <Badge variant="outline" className="bg-green-50 text-green-700">
            {formatHectares(stats.totalHectares)}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />Refresh
          </Button>
          <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setAddFieldDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />Add Field
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-4 pt-2 bg-white border-b">
          <TabsList className="bg-transparent h-10 flex-wrap">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Dashboard</TabsTrigger>
            <TabsTrigger value="fields" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Fields</TabsTrigger>
            <TabsTrigger value="planting" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Planting</TabsTrigger>
            <TabsTrigger value="inputs" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Inputs</TabsTrigger>
            <TabsTrigger value="irrigation" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Irrigation</TabsTrigger>
            <TabsTrigger value="harvest" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Harvest</TabsTrigger>
            <TabsTrigger value="storage" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Storage</TabsTrigger>
            <TabsTrigger value="compliance" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Compliance</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Dashboard */}
          <TabsContent value="dashboard" className="m-0 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <StatCard icon={MapPin} label="Total Fields" value={stats.totalFields} subValue={`${formatHectares(stats.totalHectares)}`} />
              <StatCard icon={Sprout} label="Planted Area" value={formatHectares(stats.plantedHectares)} subValue={`${formatHectares(stats.fallowHectares)} fallow`} />
              <StatCard icon={Wheat} label="Active Crops" value={stats.activeCrops} subValue="crop types" />
              <StatCard icon={Target} label="Harvested Yield" value={stats.harvestedYield.toLocaleString()} subValue="tons total" />
              <StatCard icon={DollarSign} label="Revenue" value={formatCurrency(stats.totalRevenue)} subValue={`${stats.profitMargin}% margin`} />
              <StatCard icon={Beaker} label="Input Costs" value={formatCurrency(stats.totalInputCost)} subValue="fertilizer, seed, etc." iconColor="#ef4444" />
            </div>

            {/* Fields Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-[#00897B]" />
                    Fields Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {fields.length === 0 ? (
                    <EmptyState icon={Wheat} title="No Fields Registered" description="Start by adding your farm fields." actionLabel="Add First Field" onAction={() => setAddFieldDialogOpen(true)} />
                  ) : (
                    <div className="space-y-3">
                      {fields.slice(0, 5).map(field => (
                        <div key={field.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{field.fieldName} ({field.fieldNumber})</span>
                            <Badge className={getStatusColor(field.status)}>{field.status}</Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs text-[#757575]">
                            <span>{formatHectares(field.totalHectares)}</span>
                            <span>{field.currentCrop || 'No crop'}</span>
                          </div>
                          <Progress value={(field.actualYield || 0) / (field.expectedYield || 10) * 100} className="h-1.5 mt-2" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wheat className="h-5 w-5 text-[#00897B]" />
                    Crop Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-amber-50 rounded-lg text-center">
                      <Wheat className="h-8 w-8 mx-auto mb-2 text-amber-600" />
                      <p className="font-medium">Grain Crops</p>
                      <p className="text-xs text-[#757575]">Maize, Wheat, Barley</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg text-center">
                      <Leaf className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <p className="font-medium">Vegetables</p>
                      <p className="text-xs text-[#757575]">Potatoes, Tomatoes</p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg text-center">
                      <TreeDeciduous className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                      <p className="font-medium">Fruit Orchards</p>
                      <p className="text-xs text-[#757575]">Citrus, Apples, Grapes</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg text-center">
                      <Sprout className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                      <p className="font-medium">Industrial</p>
                      <p className="text-xs text-[#757575]">Sugarcane, Sunflower</p>
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
                  <Button variant="outline" className="h-auto py-3 flex-col" onClick={() => setAddFieldDialogOpen(true)}>
                    <MapPin className="h-5 w-5 mb-1 text-[#00897B]" />
                    <span className="text-xs">Add Field</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex-col" onClick={() => setPlantingDialogOpen(true)}>
                    <Sprout className="h-5 w-5 mb-1 text-green-500" />
                    <span className="text-xs">Plant Crop</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex-col" onClick={() => setApplicationDialogOpen(true)}>
                    <Beaker className="h-5 w-5 mb-1 text-blue-500" />
                    <span className="text-xs">Apply Input</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex-col">
                    <Droplets className="h-5 w-5 mb-1 text-cyan-500" />
                    <span className="text-xs">Irrigation</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex-col">
                    <Target className="h-5 w-5 mb-1 text-amber-500" />
                    <span className="text-xs">Harvest</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex-col">
                    <Truck className="h-5 w-5 mb-1 text-orange-500" />
                    <span className="text-xs">Sell Produce</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* SA Compliance */}
            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-amber-500" />
                  SA Crop Farming Compliance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Fertilizer Registration</p>
                      <p className="text-[#757575]">Register with DAFF for fertilizer and agrochemical use</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Water Use License</p>
                      <p className="text-[#757575]">Required for irrigation from DWS</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium">GlobalGAP Certification</p>
                      <p className="text-[#757575]">Required for export market access</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Pesticide Records</p>
                      <p className="text-[#757575]">Maintain application records per Fertilizers Act</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other Tabs */}
          <TabsContent value="fields" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={MapPin} title="Field Management" description="Manage your farm fields, soil types, and irrigation systems." actionLabel="Add Field" onAction={() => setAddFieldDialogOpen(true)} /></CardContent></Card>
          </TabsContent>
          <TabsContent value="planting" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={Sprout} title="Planting Records" description="Track planting dates, varieties, and expected yields." actionLabel="Add Planting Record" onAction={() => setPlantingDialogOpen(true)} /></CardContent></Card>
          </TabsContent>
          <TabsContent value="inputs" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={Beaker} title="Input Management" description="Track fertilizer, pesticide, and herbicide applications." actionLabel="Add Application" onAction={() => setApplicationDialogOpen(true)} /></CardContent></Card>
          </TabsContent>
          <TabsContent value="irrigation" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={Droplets} title="Irrigation Management" description="Schedule irrigation, track water usage, and monitor systems." actionLabel="Add Irrigation Record" /></CardContent></Card>
          </TabsContent>
          <TabsContent value="harvest" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={Target} title="Harvest Records" description="Record harvest dates, yields, and quality grades." actionLabel="Add Harvest Record" /></CardContent></Card>
          </TabsContent>
          <TabsContent value="storage" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={Wheat} title="Storage Management" description="Manage silos, warehouses, and grain quality." actionLabel="Add Storage Record" /></CardContent></Card>
          </TabsContent>
          <TabsContent value="compliance" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={ShieldCheck} title="Compliance" description="Track certifications, audits, and regulatory requirements." actionLabel="Add Compliance Item" /></CardContent></Card>
          </TabsContent>
        </div>
      </Tabs>

      {/* Add Field Dialog */}
      <Dialog open={addFieldDialogOpen} onOpenChange={setAddFieldDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-[#00897B]" />Add Field</DialogTitle>
            <DialogDescription>Register a new field on your farm</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Field Name *</Label>
                <Input value={newField.fieldName} onChange={(e) => setNewField(prev => ({ ...prev, fieldName: e.target.value }))} placeholder="e.g., North Block" />
              </div>
              <div>
                <Label>Field Number</Label>
                <Input value={newField.fieldNumber} onChange={(e) => setNewField(prev => ({ ...prev, fieldNumber: e.target.value }))} placeholder="e.g., F-01" />
              </div>
            </div>
            <div>
              <Label>Total Hectares *</Label>
              <Input type="number" value={newField.totalHectares} onChange={(e) => setNewField(prev => ({ ...prev, totalHectares: e.target.value }))} placeholder="e.g., 50" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Soil Type</Label>
                <Select value={newField.soilType} onValueChange={(v) => setNewField(prev => ({ ...prev, soilType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {soilTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Irrigation Type</Label>
                <Select value={newField.irrigationType} onValueChange={(v) => setNewField(prev => ({ ...prev, irrigationType: v as CropField['irrigationType'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {irrigationTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddFieldDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleAddField} disabled={!newField.fieldName || !newField.totalHectares}>
              Add Field
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
