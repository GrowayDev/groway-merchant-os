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
  Sun,
  Heart,
  Syringe,
  Scale,
  Droplets,
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
  Flower2,
  Beaker,
} from 'lucide-react'

// Custom Bee Icon
function BeeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="12" cy="12" rx="4" ry="6" />
      <path d="M8 12h8" />
      <path d="M9 8h6" />
      <path d="M9 16h6" />
      <path d="M12 6V4" />
      <path d="M10 5l4 0" />
      <path d="M6 10c-2-1-3-3-2-5" />
      <path d="M18 10c2-1 3-3 2-5" />
    </svg>
  )
}

// =====================================================
// BEEKEEPING TYPES
// =====================================================

interface Hive {
  id: string
  hiveNumber: string
  hiveType: 'langstroth' | 'top_bar' | 'flow_hive' | 'kenyan' | 'warre'
  location: string
  status: 'active' | 'inactive' | 'swarmed' | 'dead' | 'nuc'
  colonyStrength: 'strong' | 'medium' | 'weak' | 'queenless'
  queenStatus: 'present' | 'needs_replacement' | 'new_queen' | 'unknown'
  queenOrigin?: string
  queenYear?: number
  framesCount: number
  broodFrames?: number
  honeyFrames?: number
  lastInspection?: string
  nextInspection?: string
  healthNotes?: string
}

interface HarvestRecord {
  id: string
  hiveId: string
  hiveNumber: string
  harvestDate: string
  honeyWeight: number // kg
  honeyType: string
  supersHarvested: number
  moistureContent?: number
  extractionMethod: 'manual' | 'centrifugal' | 'crush_strain'
  quality: 'grade_a' | 'grade_b' | 'processing'
  salesValue?: number
  notes?: string
}

interface InspectionRecord {
  id: string
  hiveId: string
  hiveNumber: string
  inspectionDate: string
  colonyStrength: 'strong' | 'medium' | 'weak' | 'queenless'
  queenSpotted: boolean
  broodPattern: 'excellent' | 'good' | 'fair' | 'poor' | 'none'
  diseaseSigns: boolean
  pestSigns: boolean
  honeyStores: 'abundant' | 'adequate' | 'low' | 'critical'
  pollenStores: 'abundant' | 'adequate' | 'low'
  temperament: 'calm' | 'normal' | 'defensive' | 'aggressive'
  actionsTaken?: string
  notes?: string
}

// =====================================================
// CONSTANTS - SOUTH AFRICAN BEEKEEPING
// =====================================================

const hiveTypes = [
  { value: 'langstroth', label: 'Langstroth', frames: 10 },
  { value: 'top_bar', label: 'Top Bar Hive', frames: 28 },
  { value: 'flow_hive', label: 'Flow Hive', frames: 6 },
  { value: 'kenyan', label: 'Kenyan Top Bar', frames: 28 },
  { value: 'warre', label: 'Warré Hive', frames: 8 },
]

const honeyTypes = [
  { value: 'wildflower', label: 'Wildflower Honey' },
  { value: 'eucalyptus', label: 'Eucalyptus Honey' },
  { value: 'citrus', label: 'Citrus Honey' },
  { value: 'fynbos', label: 'Fynbos Honey' },
  { value: 'bushveld', label: 'Bushveld Honey' },
  { value: 'bluegum', label: 'Bluegum Honey' },
  { value: 'lucerne', label: 'Lucerne Honey' },
  { value: 'macadamia', label: 'Macadamia Honey' },
]

const saNectarFlows = [
  { season: 'Spring (Sep-Nov)', flow: 'High', source: 'Wildflowers, Eucalyptus' },
  { season: 'Summer (Dec-Feb)', flow: 'Medium', source: 'Citrus, Fynbos' },
  { season: 'Autumn (Mar-May)', flow: 'Low', source: 'Late Eucalyptus' },
  { season: 'Winter (Jun-Aug)', flow: 'Minimal', source: 'Maintenance feeding' },
]

const commonDiseases = [
  'American Foulbrood (AFB)',
  'European Foulbrood (EFB)',
  'Nosema',
  'Chalkbrood',
  'Sacbrood',
  'Varroa Mites',
  'Small Hive Beetle',
  'Wax Moths',
]

// Helper functions
const formatWeight = (kg: number) => `${kg.toLocaleString()} kg`
const formatCurrency = (amount: number) => `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`

const getHiveStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-gray-100 text-gray-700',
    swarmed: 'bg-amber-100 text-amber-700',
    dead: 'bg-red-100 text-red-700',
    nuc: 'bg-blue-100 text-blue-700',
  }
  return colors[status] || 'bg-gray-100 text-gray-700'
}

const getColonyStrengthColor = (strength: string) => {
  const colors: Record<string, string> = {
    strong: 'text-green-600',
    medium: 'text-amber-600',
    weak: 'text-orange-600',
    queenless: 'text-red-600',
  }
  return colors[strength] || 'text-gray-600'
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

export function BeekeepingView() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')

  const [hives, setHives] = useState<Hive[]>([])
  const [harvestRecords, setHarvestRecords] = useState<HarvestRecord[]>([])
  const [inspectionRecords, setInspectionRecords] = useState<InspectionRecord[]>([])
  const [addHiveDialogOpen, setAddHiveDialogOpen] = useState(false)
  const [harvestDialogOpen, setHarvestDialogOpen] = useState(false)
  const [inspectionDialogOpen, setInspectionDialogOpen] = useState(false)

  const [newHive, setNewHive] = useState({
    hiveNumber: '',
    hiveType: 'langstroth' as Hive['hiveType'],
    location: '',
    framesCount: '10',
    queenOrigin: '',
  })

  useEffect(() => {
    setTimeout(() => setLoading(false), 500)
  }, [])

  const stats = useMemo(() => {
    const totalHives = hives.length
    const activeHives = hives.filter(h => h.status === 'active' || h.status === 'nuc').length
    const strongColonies = hives.filter(h => h.colonyStrength === 'strong').length
    const weakColonies = hives.filter(h => h.colonyStrength === 'weak' || h.colonyStrength === 'queenless').length
    const queensNeedingReplacement = hives.filter(h => h.queenStatus === 'needs_replacement').length
    const inspectionsNeeded = hives.filter(h => !h.nextInspection || new Date(h.nextInspection) <= new Date()).length

    const totalHoneyHarvested = harvestRecords.reduce((sum, r) => sum + r.honeyWeight, 0)
    const totalRevenue = harvestRecords.reduce((sum, r) => sum + (r.salesValue || 0), 0)
    const avgYieldPerHive = activeHives > 0 ? totalHoneyHarvested / activeHives : 0

    const diseaseSigns = inspectionRecords.filter(r => r.diseaseSigns || r.pestSigns).length

    return {
      totalHives,
      activeHives,
      inactiveHives: totalHives - activeHives,
      strongColonies,
      weakColonies,
      queensNeedingReplacement,
      inspectionsNeeded,
      totalHoneyHarvested,
      totalRevenue,
      avgYieldPerHive: avgYieldPerHive.toFixed(1),
      diseaseSigns,
    }
  }, [hives, harvestRecords, inspectionRecords])

  const handleAddHive = () => {
    const hive: Hive = {
      id: `hive-${Date.now()}`,
      ...newHive,
      framesCount: parseInt(newHive.framesCount) || 10,
      status: 'active',
      colonyStrength: 'medium',
      queenStatus: 'unknown',
    }
    setHives(prev => [...prev, hive])
    setAddHiveDialogOpen(false)
    setNewHive({
      hiveNumber: '',
      hiveType: 'langstroth',
      location: '',
      framesCount: '10',
      queenOrigin: '',
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
          <BeeIcon className="h-5 w-5 text-[#00897B]" />
          <h2 className="font-semibold text-[#1A1A1A]">Beekeeping Management</h2>
          <Badge variant="outline" className="bg-amber-50 text-amber-700">
            {stats.activeHives}/{stats.totalHives} hives
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />Refresh
          </Button>
          <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setAddHiveDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />Add Hive
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-4 pt-2 bg-white border-b">
          <TabsList className="bg-transparent h-10 flex-wrap">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Dashboard</TabsTrigger>
            <TabsTrigger value="hives" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Hives</TabsTrigger>
            <TabsTrigger value="inspections" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Inspections</TabsTrigger>
            <TabsTrigger value="harvest" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Harvest</TabsTrigger>
            <TabsTrigger value="health" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Health</TabsTrigger>
            <TabsTrigger value="queens" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Queens</TabsTrigger>
            <TabsTrigger value="pollination" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Pollination</TabsTrigger>
            <TabsTrigger value="compliance" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Compliance</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Dashboard */}
          <TabsContent value="dashboard" className="m-0 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <StatCard icon={BeeIcon} label="Active Hives" value={stats.activeHives} subValue={`of ${stats.totalHives} total`} />
              <StatCard icon={Droplets} label="Honey Harvested" value={formatWeight(stats.totalHoneyHarvested)} subValue={`${stats.avgYieldPerHive} kg/hive avg`} />
              <StatCard icon={Target} label="Strong Colonies" value={stats.strongColonies} subValue="colony strength" />
              <StatCard icon={AlertTriangle} label="Weak Colonies" value={stats.weakColonies} subValue="need attention" iconColor="#ef4444" />
              <StatCard icon={Calendar} label="Inspections Due" value={stats.inspectionsNeeded} subValue="overdue" iconColor="#f59e0b" />
              <StatCard icon={DollarSign} label="Revenue" value={formatCurrency(stats.totalRevenue)} subValue="honey sales" />
            </div>

            {/* Hive Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BeeIcon className="h-5 w-5 text-[#00897B]" />
                    Hive Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {hives.length === 0 ? (
                    <EmptyState icon={BeeIcon} title="No Hives Registered" description="Start by adding your apiary." actionLabel="Add First Hive" onAction={() => setAddHiveDialogOpen(true)} />
                  ) : (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-green-50 rounded-lg text-center">
                        <p className="text-3xl font-bold text-green-700">{stats.strongColonies}</p>
                        <p className="text-sm text-green-600">Strong</p>
                      </div>
                      <div className="p-4 bg-amber-50 rounded-lg text-center">
                        <p className="text-3xl font-bold text-amber-700">{stats.activeHives - stats.strongColonies - stats.weakColonies}</p>
                        <p className="text-sm text-amber-600">Medium</p>
                      </div>
                      <div className="p-4 bg-red-50 rounded-lg text-center">
                        <p className="text-3xl font-bold text-red-700">{stats.weakColonies}</p>
                        <p className="text-sm text-red-600">Weak</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Flower2 className="h-5 w-5 text-[#00897B]" />
                    Nectar Flow Calendar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {saNectarFlows.map((flow, i) => (
                      <div key={i} className="flex items-center justify-between text-sm p-2 rounded-lg bg-gray-50">
                        <div>
                          <span className="font-medium">{flow.season}</span>
                          <span className="text-[#757575] ml-2">({flow.source})</span>
                        </div>
                        <Badge variant="outline" className={
                          flow.flow === 'High' ? 'bg-green-100 text-green-700' :
                          flow.flow === 'Medium' ? 'bg-amber-100 text-amber-700' :
                          flow.flow === 'Low' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-700'
                        }>
                          {flow.flow}
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
                  <Button variant="outline" className="h-auto py-3 flex-col" onClick={() => setAddHiveDialogOpen(true)}>
                    <BeeIcon className="h-5 w-5 mb-1 text-[#00897B]" />
                    <span className="text-xs">Add Hive</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex-col" onClick={() => setInspectionDialogOpen(true)}>
                    <Target className="h-5 w-5 mb-1 text-blue-500" />
                    <span className="text-xs">Inspect</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex-col" onClick={() => setHarvestDialogOpen(true)}>
                    <Droplets className="h-5 w-5 mb-1 text-amber-500" />
                    <span className="text-xs">Harvest</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex-col">
                    <Heart className="h-5 w-5 mb-1 text-red-500" />
                    <span className="text-xs">Health Check</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex-col">
                    <Flower2 className="h-5 w-5 mb-1 text-green-500" />
                    <span className="text-xs">Pollination</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex-col">
                    <Syringe className="h-5 w-5 mb-1 text-purple-500" />
                    <span className="text-xs">Treat</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* SA Compliance */}
            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-amber-500" />
                  SA Beekeeping Compliance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Apiary Registration</p>
                      <p className="text-[#757575]">Register with provincial agriculture department</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Honey Standards</p>
                      <p className="text-[#757575]">Comply with SA honey regulations (R961)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Disease Control</p>
                      <p className="text-[#757575]">Report AFB to state vet immediately</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Labeling Requirements</p>
                      <p className="text-[#757575]">Proper labeling per food safety regulations</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other Tabs */}
          <TabsContent value="hives" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={BeeIcon} title="Hive Management" description="Manage your apiary, hive locations, and equipment." actionLabel="Add Hive" onAction={() => setAddHiveDialogOpen(true)} /></CardContent></Card>
          </TabsContent>
          <TabsContent value="inspections" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={Target} title="Hive Inspections" description="Record regular inspections, brood patterns, and colony health." actionLabel="Add Inspection" onAction={() => setInspectionDialogOpen(true)} /></CardContent></Card>
          </TabsContent>
          <TabsContent value="harvest" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={Droplets} title="Honey Harvest" description="Track honey extraction, yields, and quality grades." actionLabel="Add Harvest" onAction={() => setHarvestDialogOpen(true)} /></CardContent></Card>
          </TabsContent>
          <TabsContent value="health" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={Heart} title="Colony Health" description="Monitor diseases, pests, and treatment records." actionLabel="Add Health Record" /></CardContent></Card>
          </TabsContent>
          <TabsContent value="queens" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={BeeIcon} title="Queen Management" description="Track queen status, origins, and replacement schedules." actionLabel="Add Queen Record" /></CardContent></Card>
          </TabsContent>
          <TabsContent value="pollination" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={Flower2} title="Pollination Services" description="Manage pollination contracts and hive movements." actionLabel="Add Pollination Contract" /></CardContent></Card>
          </TabsContent>
          <TabsContent value="compliance" className="m-0">
            <Card><CardContent className="py-8"><EmptyState icon={ShieldCheck} title="Compliance" description="Track apiary registration, health certificates, and labeling." actionLabel="Add Compliance Item" /></CardContent></Card>
          </TabsContent>
        </div>
      </Tabs>

      {/* Add Hive Dialog */}
      <Dialog open={addHiveDialogOpen} onOpenChange={setAddHiveDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><BeeIcon className="h-5 w-5 text-[#00897B]" />Add Hive</DialogTitle>
            <DialogDescription>Register a new hive in your apiary</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Hive Number *</Label>
                <Input value={newHive.hiveNumber} onChange={(e) => setNewHive(prev => ({ ...prev, hiveNumber: e.target.value }))} placeholder="e.g., H-001" />
              </div>
              <div>
                <Label>Hive Type *</Label>
                <Select value={newHive.hiveType} onValueChange={(v) => setNewHive(prev => ({ ...prev, hiveType: v as Hive['hiveType'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {hiveTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Location *</Label>
              <Input value={newHive.location} onChange={(e) => setNewHive(prev => ({ ...prev, location: e.target.value }))} placeholder="e.g., Apiary Site A, North Field" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Frame Count</Label>
                <Input type="number" value={newHive.framesCount} onChange={(e) => setNewHive(prev => ({ ...prev, framesCount: e.target.value }))} placeholder="e.g., 10" />
              </div>
              <div>
                <Label>Queen Origin</Label>
                <Input value={newHive.queenOrigin} onChange={(e) => setNewHive(prev => ({ ...prev, queenOrigin: e.target.value }))} placeholder="e.g., Carniolan, Italian" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddHiveDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleAddHive} disabled={!newHive.hiveNumber || !newHive.location}>
              Add Hive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
