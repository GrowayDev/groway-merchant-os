'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
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
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Eye,
  RefreshCw,
  Calendar,
  FileText,
  Upload,
  User,
  Building2,
  Flame,
  Utensils,
  Heart,
  Thermometer,
  Droplets,
  Wind,
  Zap,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Settings,
  Bell,
  ClipboardList,
} from 'lucide-react'
import { EmptyState, StatCard, TableSkeleton } from '../shared/EmptyState'

// =====================================================
// TYPE DEFINITIONS
// =====================================================

interface SHEInspection {
  id: string
  merchantId: string
  branchId?: string
  complianceType: string
  category: string
  title: string
  description?: string
  responsiblePerson?: string
  dueDate: string
  completedDate?: string
  status: string
  frequency?: string
  nextDueDate?: string
  documentUrl?: string
  notes?: string
  riskLevel?: string
  remedialActions?: string
  verificationRequired: boolean
  verifiedBy?: string
  verifiedAt?: string
  createdAt: string
}

interface SHEIncident {
  id: string
  merchantId: string
  incidentType: string
  incidentDate: string
  incidentTime: string
  location: string
  description: string
  severity: string
  status: string
  injuredPersonName?: string
  rootCause?: string
  correctiveActions?: string
}

interface FoodSafetyInspection {
  id: string
  merchantId: string
  inspectionType: string
  scheduledDate: string
  conductedDate?: string
  status: string
  overallScore?: number
  grade?: string
  findings?: string
  certificateNumber?: string
  certificateExpiry?: string
}

// =====================================================
// CONSTANTS
// =====================================================

const complianceTypes = [
  { value: 'safety', label: 'Safety', icon: ShieldCheck },
  { value: 'health', label: 'Health', icon: Heart },
  { value: 'environment', label: 'Environment', icon: Wind },
  { value: 'fire', label: 'Fire Safety', icon: Flame },
  { value: 'food_safety', label: 'Food Safety', icon: Utensils },
  { value: 'electrical', label: 'Electrical', icon: Zap },
]

const categories = [
  { value: 'inspection', label: 'Inspection' },
  { value: 'training', label: 'Training' },
  { value: 'certification', label: 'Certification' },
  { value: 'incident', label: 'Incident Report' },
  { value: 'audit', label: 'Audit' },
]

const riskLevels = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-700' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-700' },
]

const saAuthorities = [
  'Department of Health',
  'Municipal Health Services',
  'Department of Labour',
  'Fire Department',
  'SABS',
  'Local Municipality'
]

// =====================================================
// HELPER FUNCTIONS
// =====================================================

const getStatusBadge = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    overdue: 'bg-red-100 text-red-700',
    open: 'bg-orange-100 text-orange-700',
    closed: 'bg-gray-100 text-gray-700',
  }
  return <Badge className={colors[status] || 'bg-gray-100 text-gray-700'}>{status.replace('_', ' ')}</Badge>
}

const getRiskBadge = (risk?: string) => {
  if (!risk) return null
  const level = riskLevels.find(r => r.value === risk)
  return level ? <Badge className={level.color}>{level.label}</Badge> : null
}

const getDaysUntil = (date: string) => {
  const target = new Date(date)
  const today = new Date()
  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export function SHEComplianceView() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [inspections, setInspections] = useState<SHEInspection[]>([])
  const [incidents, setIncidents] = useState<SHEIncident[]>([])
  const [foodSafetyInspections, setFoodSafetyInspections] = useState<FoodSafetyInspection[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  
  // Dialog states
  const [inspectionDialogOpen, setInspectionDialogOpen] = useState(false)
  const [incidentDialogOpen, setIncidentDialogOpen] = useState(false)
  
  // Form states
  const [newInspection, setNewInspection] = useState({
    complianceType: 'safety',
    category: 'inspection',
    title: '',
    description: '',
    responsiblePerson: '',
    dueDate: '',
    frequency: '',
    riskLevel: 'medium'
  })
  
  const [newIncident, setNewIncident] = useState({
    incidentType: 'injury',
    incidentDate: '',
    incidentTime: '',
    location: '',
    description: '',
    severity: 'minor'
  })

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const merchantId = localStorage.getItem('merchantId') || 'demo-merchant'
      
      const [inspectionsRes] = await Promise.all([
        fetch(`/api/merchant-os/she-compliance/inspections?merchantId=${merchantId}`)
      ])

      const inspectionsData = await inspectionsRes.json()
      
      setInspections(inspectionsData.inspections || [])
    } catch (error) {
      console.error('Error fetching SHE data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Computed stats
  const stats = useMemo(() => {
    const pending = inspections.filter(i => i.status === 'pending').length
    const completed = inspections.filter(i => i.status === 'completed').length
    const overdue = inspections.filter(i => i.status === 'pending' && getDaysUntil(i.dueDate) < 0).length
    const highRisk = inspections.filter(i => i.riskLevel === 'high' || i.riskLevel === 'critical').length
    const openIncidents = incidents.filter(i => i.status === 'open').length
    
    const complianceRate = inspections.length > 0 
      ? Math.round((completed / inspections.length) * 100) 
      : 0

    return {
      pending,
      completed,
      overdue,
      highRisk,
      openIncidents,
      complianceRate
    }
  }, [inspections, incidents])

  // Filter inspections
  const filteredInspections = useMemo(() => inspections.filter(inspection => {
    const matchesSearch = inspection.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inspection.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    const matchesType = typeFilter === 'all' || inspection.complianceType === typeFilter
    return matchesSearch && matchesType
  }), [inspections, searchQuery, typeFilter])

  // Create inspection
  const handleCreateInspection = async () => {
    try {
      const merchantId = localStorage.getItem('merchantId') || 'demo-merchant'
      
      await fetch(`/api/merchant-os/she-compliance/inspections?merchantId=${merchantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInspection)
      })
      
      setInspectionDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error('Error creating inspection:', error)
    }
  }

  // Create incident
  const handleCreateIncident = async () => {
    try {
      const merchantId = localStorage.getItem('merchantId') || 'demo-merchant'
      
      await fetch(`/api/merchant-os/she-compliance/incidents?merchantId=${merchantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIncident)
      })
      
      setIncidentDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error('Error creating incident:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#FAFAFA] min-h-0">
        <RefreshCw className="h-8 w-8 animate-spin text-[#00897B]" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[#00897B]" />
          <h2 className="font-semibold text-[#1A1A1A]">SHE Compliance</h2>
          <Badge variant="outline">Safety, Health & Environment</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-1" />Refresh
          </Button>
          <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={() => setIncidentDialogOpen(true)}>
            <AlertCircle className="h-4 w-4 mr-1" />Report Incident
          </Button>
          <Button size="sm" className="bg-[#00897B]" onClick={() => setInspectionDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />Add Item
          </Button>
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-4 pt-2 bg-white border-b">
          <TabsList className="bg-transparent h-10">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Dashboard</TabsTrigger>
            <TabsTrigger value="inspections" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Inspections</TabsTrigger>
            <TabsTrigger value="incidents" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Incidents</TabsTrigger>
            <TabsTrigger value="food_safety" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Food Safety</TabsTrigger>
            <TabsTrigger value="certificates" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">Certificates</TabsTrigger>
          </TabsList>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="m-0 space-y-6">
            {/* Compliance Score */}
            <Card className="border-l-4 border-l-[#00897B]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Overall Compliance Score</h3>
                    <p className="text-sm text-[#757575]">Based on completed inspections and audits</p>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-bold text-[#00897B]">{stats.complianceRate}%</p>
                    <p className="text-sm text-[#757575]">{stats.completed} of {inspections.length} completed</p>
                  </div>
                </div>
                <Progress value={stats.complianceRate} className="h-3" />
              </CardContent>
            </Card>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard icon={Clock} label="Pending" value={stats.pending} subValue="items due" iconColor="#f59e0b" />
              <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} subValue="this period" iconColor="#22c55e" />
              <StatCard icon={AlertTriangle} label="Overdue" value={stats.overdue} subValue="need attention" iconColor="#ef4444" />
              <StatCard icon={Activity} label="High Risk" value={stats.highRisk} subValue="items" iconColor="#f97316" />
              <StatCard icon={AlertCircle} label="Open Incidents" value={stats.openIncidents} subValue="active" iconColor="#ef4444" />
            </div>
            
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setInspectionDialogOpen(true)}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#E0F2F1] flex items-center justify-center">
                    <ClipboardList className="h-6 w-6 text-[#00897B]" />
                  </div>
                  <div>
                    <p className="font-medium">Schedule Inspection</p>
                    <p className="text-sm text-[#757575]">Add new compliance check</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setIncidentDialogOpen(true)}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium">Report Incident</p>
                    <p className="text-sm text-[#757575]">Log safety/health incident</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Generate Report</p>
                    <p className="text-sm text-[#757575]">Compliance summary</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Compliance by Type */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Compliance by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {inspections.length === 0 ? (
                  <EmptyState
                    icon={ShieldCheck}
                    title="No Compliance Items"
                    description="Add your first compliance item to start tracking safety, health, and environmental requirements."
                    actionLabel="Add First Item"
                    onAction={() => setInspectionDialogOpen(true)}
                  />
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {complianceTypes.map(type => {
                      const count = inspections.filter(i => i.complianceType === type.value).length
                      const completed = inspections.filter(i => i.complianceType === type.value && i.status === 'completed').length
                      const Icon = type.icon
                      return (
                        <div key={type.value} className="p-4 bg-gray-50 rounded-lg text-center">
                          <Icon className="h-8 w-8 mx-auto mb-2 text-[#00897B]" />
                          <p className="text-lg font-bold">{completed}/{count}</p>
                          <p className="text-xs text-[#757575]">{type.label}</p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Inspections Tab */}
          <TabsContent value="inspections" className="m-0 space-y-4">
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
                <Input
                  placeholder="Search inspections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {complianceTypes.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button className="bg-[#00897B]" onClick={() => setInspectionDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />Add
              </Button>
            </div>
            
            {filteredInspections.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <EmptyState
                    icon={ClipboardList}
                    title="No Inspections Found"
                    description={searchQuery ? "Try adjusting your search" : "Add your first inspection to start tracking compliance."}
                    actionLabel={!searchQuery ? "Add Inspection" : undefined}
                    onAction={!searchQuery ? () => setInspectionDialogOpen(true) : undefined}
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {filteredInspections.map(inspection => (
                  <Card key={inspection.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-lg bg-[#E0F2F1] flex items-center justify-center mt-1">
                            {complianceTypes.find(t => t.value === inspection.complianceType)?.icon && (
                              (() => {
                                const IconComp = complianceTypes.find(t => t.value === inspection.complianceType)!.icon
                                return <IconComp className="h-5 w-5 text-[#00897B]" />
                              })()
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{inspection.title}</p>
                            <p className="text-sm text-[#757575]">{inspection.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Calendar className="h-3 w-3 text-[#757575]" />
                              <span className="text-xs text-[#757575]">Due: {inspection.dueDate}</span>
                              {inspection.responsiblePerson && (
                                <>
                                  <User className="h-3 w-3 text-[#757575] ml-2" />
                                  <span className="text-xs text-[#757575]">{inspection.responsiblePerson}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getRiskBadge(inspection.riskLevel)}
                          {getStatusBadge(inspection.status)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* Incidents Tab */}
          <TabsContent value="incidents" className="m-0">
            <Card>
              <CardContent className="py-8">
                <EmptyState
                  icon={AlertTriangle}
                  title="No Incidents Recorded"
                  description="Report safety, health, and environmental incidents for compliance tracking."
                  actionLabel="Report Incident"
                  onAction={() => setIncidentDialogOpen(true)}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Food Safety Tab */}
          <TabsContent value="food_safety" className="m-0">
            <Card>
              <CardContent className="py-8">
                <EmptyState
                  icon={Utensils}
                  title="Food Safety Inspections"
                  description="Schedule and track municipal health inspections, hygiene audits, and food safety certifications per R638 regulations."
                  actionLabel="Schedule Inspection"
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Certificates Tab */}
          <TabsContent value="certificates" className="m-0">
            <Card>
              <CardContent className="py-8">
                <EmptyState
                  icon={FileText}
                  title="Health & Safety Certificates"
                  description="Track health permits, fire safety certificates, and other regulatory certifications."
                  actionLabel="Add Certificate"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
      
      {/* Add Inspection Dialog */}
      <Dialog open={inspectionDialogOpen} onOpenChange={setInspectionDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-[#00897B]" />
              Add Compliance Item
            </DialogTitle>
            <DialogDescription>
              Schedule a new inspection, audit, or compliance task
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={newInspection.complianceType} onValueChange={(v) => setNewInspection(prev => ({ ...prev, complianceType: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {complianceTypes.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Select value={newInspection.category} onValueChange={(v) => setNewInspection(prev => ({ ...prev, category: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Title</Label>
              <Input 
                value={newInspection.title}
                onChange={(e) => setNewInspection(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Monthly Fire Extinguisher Check"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea 
                value={newInspection.description}
                onChange={(e) => setNewInspection(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Details about this compliance item..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Due Date</Label>
                <Input 
                  type="date"
                  value={newInspection.dueDate}
                  onChange={(e) => setNewInspection(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
              <div>
                <Label>Risk Level</Label>
                <Select value={newInspection.riskLevel} onValueChange={(v) => setNewInspection(prev => ({ ...prev, riskLevel: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {riskLevels.map(r => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Responsible Person</Label>
                <Input 
                  value={newInspection.responsiblePerson}
                  onChange={(e) => setNewInspection(prev => ({ ...prev, responsiblePerson: e.target.value }))}
                  placeholder="Name"
                />
              </div>
              <div>
                <Label>Frequency</Label>
                <Select value={newInspection.frequency} onValueChange={(v) => setNewInspection(prev => ({ ...prev, frequency: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="One-time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInspectionDialogOpen(false)}>Cancel</Button>
            <Button 
              className="bg-[#00897B] hover:bg-[#00695C]"
              onClick={handleCreateInspection}
              disabled={!newInspection.title || !newInspection.dueDate}
            >
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Report Incident Dialog */}
      <Dialog open={incidentDialogOpen} onOpenChange={setIncidentDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Report Incident
            </DialogTitle>
            <DialogDescription>
              Log a safety, health, or environmental incident for compliance tracking
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Incident Type</Label>
                <Select value={newIncident.incidentType} onValueChange={(v) => setNewIncident(prev => ({ ...prev, incidentType: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="injury">Injury</SelectItem>
                    <SelectItem value="near_miss">Near Miss</SelectItem>
                    <SelectItem value="environmental">Environmental</SelectItem>
                    <SelectItem value="fire">Fire</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Severity</Label>
                <Select value={newIncident.severity} onValueChange={(v) => setNewIncident(prev => ({ ...prev, severity: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="serious">Serious</SelectItem>
                    <SelectItem value="fatal">Fatal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input 
                  type="date"
                  value={newIncident.incidentDate}
                  onChange={(e) => setNewIncident(prev => ({ ...prev, incidentDate: e.target.value }))}
                />
              </div>
              <div>
                <Label>Time</Label>
                <Input 
                  type="time"
                  value={newIncident.incidentTime}
                  onChange={(e) => setNewIncident(prev => ({ ...prev, incidentTime: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Location</Label>
              <Input 
                value={newIncident.location}
                onChange={(e) => setNewIncident(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., Kitchen, Storage Room, Parking Lot"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea 
                value={newIncident.description}
                onChange={(e) => setNewIncident(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what happened..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIncidentDialogOpen(false)}>Cancel</Button>
            <Button 
              className="bg-red-600 hover:bg-red-700"
              onClick={handleCreateIncident}
              disabled={!newIncident.description || !newIncident.incidentDate}
            >
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
