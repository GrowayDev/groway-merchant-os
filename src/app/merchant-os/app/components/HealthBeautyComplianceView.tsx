'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
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
  Scissors,
  FileText,
  AlertTriangle,
  Calendar,
  UserCheck,
  Clock,
  Beaker,
  ClipboardList,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Search,
  Download,
  Printer,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  History,
  Users,
  Building2,
  FileWarning,
  Timer,
  Lock,
  Unlock,
  BadgeCheck,
  Ban,
  Loader2,
  SprayCan,
  Sparkles,
  Heart,
  TestTube,
  Droplets,
  Flame,
} from 'lucide-react'

// Types
type SterilizationMethod = 'autoclave' | 'chemical' | 'uv' | 'dry_heat' | 'none'
type EquipmentStatus = 'operational' | 'maintenance' | 'broken' | 'cleaning'
type CertificateType = 'first_aid' | 'cpr' | 'sterilization' | 'chemical_safety' | 'infection_control'

interface SterilizationLog {
  id: string
  equipmentName: string
  equipmentId: string
  method: SterilizationMethod
  temperature?: number
  duration?: number
  cycleNumber: string
  performedBy: string
  verifiedBy?: string
  status: 'passed' | 'failed' | 'pending'
  notes?: string
  timestamp: string
}

interface EquipmentRecord {
  id: string
  name: string
  type: string
  serialNumber: string
  purchaseDate: string
  lastServiceDate: string
  nextServiceDate: string
  status: EquipmentStatus
  serviceHistory: ServiceRecord[]
}

interface ServiceRecord {
  id: string
  date: string
  type: 'routine' | 'repair' | 'calibration' | 'cleaning'
  performedBy: string
  notes: string
  cost: number
}

interface StaffCertificate {
  id: string
  staffName: string
  certificateType: CertificateType
  issueDate: string
  expiryDate: string
  issuedBy: string
  certificateNumber: string
  status: 'valid' | 'expired' | 'expiring_soon'
}

interface ChemicalRegister {
  id: string
  productName: string
  chemicalName: string
  sdsDate: string
  quantity: number
  unit: string
  storageLocation: string
  hazardClass: string
  expiryDate: string
  supplier: string
}

interface SafetyInspection {
  id: string
  inspectionType: 'fire_safety' | 'first_aid' | 'hygiene' | 'equipment' | 'chemical'
  scheduledDate: string
  inspectorName?: string
  status: 'scheduled' | 'in_progress' | 'passed' | 'failed' | 'pending_review'
  findings?: string
  correctiveActions?: string
  score?: number
}

export function HealthBeautyComplianceView() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Data states
  const [sterilizationLogs, setSterilizationLogs] = useState<SterilizationLog[]>([])
  const [equipment, setEquipment] = useState<EquipmentRecord[]>([])
  const [certificates, setCertificates] = useState<StaffCertificate[]>([])
  const [chemicals, setChemicals] = useState<ChemicalRegister[]>([])
  const [inspections, setInspections] = useState<SafetyInspection[]>([])

  // Dialog states
  const [sterilizationDialogOpen, setSterilizationDialogOpen] = useState(false)
  const [equipmentDialogOpen, setEquipmentDialogOpen] = useState(false)
  const [chemicalDialogOpen, setChemicalDialogOpen] = useState(false)

  // Update time
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Mock data
  useEffect(() => {
    const timer = setTimeout(() => {
      setSterilizationLogs([
        {
          id: '1',
          equipmentName: 'Scissors Set A',
          equipmentId: 'EQ-001',
          method: 'autoclave',
          temperature: 121,
          duration: 30,
          cycleNumber: 'CL-2026-001',
          performedBy: 'Thandi Zwane',
          verifiedBy: 'Sipho Ndaba',
          status: 'passed',
          timestamp: new Date().toISOString(),
        },
        {
          id: '2',
          equipmentName: 'Clipper Blades',
          equipmentId: 'EQ-002',
          method: 'chemical',
          cycleNumber: 'CL-2026-002',
          performedBy: 'Maria Santos',
          status: 'pending',
          timestamp: new Date().toISOString(),
        },
      ])

      setEquipment([
        {
          id: '1',
          name: 'Autoclave Sterilizer',
          type: 'Sterilization',
          serialNumber: 'AC-2024-001',
          purchaseDate: '2024-01-15',
          lastServiceDate: '2026-01-10',
          nextServiceDate: '2026-07-10',
          status: 'operational',
          serviceHistory: [],
        },
        {
          id: '2',
          name: 'Hair Dryer Station',
          type: 'Hair Equipment',
          serialNumber: 'HD-2023-005',
          purchaseDate: '2023-06-20',
          lastServiceDate: '2025-12-15',
          nextServiceDate: '2026-06-15',
          status: 'operational',
          serviceHistory: [],
        },
        {
          id: '3',
          name: 'Nail UV Lamp',
          type: 'Nail Equipment',
          serialNumber: 'UV-2024-012',
          purchaseDate: '2024-03-10',
          lastServiceDate: '2025-11-20',
          nextServiceDate: '2026-05-20',
          status: 'maintenance',
          serviceHistory: [],
        },
      ])

      setCertificates([
        {
          id: '1',
          staffName: 'Thandi Zwane',
          certificateType: 'first_aid',
          issueDate: '2025-06-15',
          expiryDate: '2027-06-15',
          issuedBy: 'St John Ambulance',
          certificateNumber: 'FA-2025-12345',
          status: 'valid',
        },
        {
          id: '2',
          staffName: 'Sipho Ndaba',
          certificateType: 'infection_control',
          issueDate: '2024-02-10',
          expiryDate: '2026-02-10',
          issuedBy: 'Health Department SA',
          certificateNumber: 'IC-2024-67890',
          status: 'expiring_soon',
        },
        {
          id: '3',
          staffName: 'Maria Santos',
          certificateType: 'cpr',
          issueDate: '2025-01-20',
          expiryDate: '2026-01-20',
          issuedBy: 'Red Cross SA',
          certificateNumber: 'CPR-2025-11111',
          status: 'expired',
        },
      ])

      setChemicals([
        {
          id: '1',
          productName: 'Barbicide Disinfectant',
          chemicalName: 'Benzalkonium Chloride',
          sdsDate: '2025-01-15',
          quantity: 5,
          unit: 'liters',
          storageLocation: 'Cleaning Cabinet A',
          hazardClass: 'Irritant',
          expiryDate: '2027-01-15',
          supplier: 'Beauty Supply SA',
        },
        {
          id: '2',
          productName: 'Acetone',
          chemicalName: 'Propanone',
          sdsDate: '2025-03-20',
          quantity: 2,
          unit: 'liters',
          storageLocation: 'Flammable Cabinet B',
          hazardClass: 'Flammable',
          expiryDate: '2026-09-20',
          supplier: 'Chemical Solutions Ltd',
        },
      ])

      setInspections([
        {
          id: '1',
          inspectionType: 'hygiene',
          scheduledDate: '2026-03-01',
          status: 'scheduled',
        },
        {
          id: '2',
          inspectionType: 'fire_safety',
          scheduledDate: '2026-04-15',
          status: 'scheduled',
        },
        {
          id: '3',
          inspectionType: 'equipment',
          scheduledDate: '2026-02-01',
          status: 'passed',
          score: 95,
        },
      ])

      setLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // Stats
  const stats = {
    sterilizationsToday: sterilizationLogs.filter(s => 
      new Date(s.timestamp).toDateString() === new Date().toDateString()
    ).length,
    pendingSterilizations: sterilizationLogs.filter(s => s.status === 'pending').length,
    equipmentMaintenance: equipment.filter(e => e.status === 'maintenance').length,
    expiredCertificates: certificates.filter(c => c.status === 'expired').length,
    expiringCertificates: certificates.filter(c => c.status === 'expiring_soon').length,
    upcomingInspections: inspections.filter(i => i.status === 'scheduled').length,
    chemicalsExpiringSoon: chemicals.filter(c => {
      const expiry = new Date(c.expiryDate)
      const threeMonths = new Date()
      threeMonths.setMonth(threeMonths.getMonth() + 3)
      return expiry <= threeMonths
    }).length,
  }

  const getMethodBadge = (method: SterilizationMethod) => {
    const colors: Record<SterilizationMethod, string> = {
      autoclave: 'bg-blue-100 text-blue-700',
      chemical: 'bg-purple-100 text-purple-700',
      uv: 'bg-yellow-100 text-yellow-700',
      dry_heat: 'bg-orange-100 text-orange-700',
      none: 'bg-gray-100 text-gray-700',
    }
    const labels: Record<SterilizationMethod, string> = {
      autoclave: 'Autoclave',
      chemical: 'Chemical',
      uv: 'UV Light',
      dry_heat: 'Dry Heat',
      none: 'None',
    }
    return <Badge className={colors[method]}>{labels[method]}</Badge>
  }

  const getCertificateTypeLabel = (type: CertificateType) => {
    const labels: Record<CertificateType, string> = {
      first_aid: 'First Aid',
      cpr: 'CPR',
      sterilization: 'Sterilization',
      chemical_safety: 'Chemical Safety',
      infection_control: 'Infection Control',
    }
    return labels[type]
  }

  const getHazardBadge = (hazardClass: string) => {
    if (hazardClass.toLowerCase().includes('flammable')) {
      return <Badge className="bg-red-100 text-red-700"><Flame className="h-3 w-3 mr-1" />{hazardClass}</Badge>
    }
    if (hazardClass.toLowerCase().includes('irritant')) {
      return <Badge className="bg-yellow-100 text-yellow-700">{hazardClass}</Badge>
    }
    return <Badge className="bg-gray-100 text-gray-700">{hazardClass}</Badge>
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#FAFAFA] min-h-0">
        <Loader2 className="h-8 w-8 animate-spin text-[#00897B]" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-[#FAFAFA] min-h-0">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#00897B]" />
              Health & Beauty Compliance
            </h1>
            <p className="text-sm text-[#757575]">Sterilization logs, equipment maintenance & safety certificates</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-mono font-bold">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              <p className="text-xs text-[#757575]">{currentTime.toLocaleDateString()}</p>
            </div>

            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-7 gap-3">
          <div className="bg-[#E0F2F1] rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-[#00897B]">{stats.sterilizationsToday}</p>
            <p className="text-[10px] text-[#757575]">Sterilizations Today</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-yellow-600">{stats.pendingSterilizations}</p>
            <p className="text-[10px] text-[#757575]">Pending</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-orange-600">{stats.equipmentMaintenance}</p>
            <p className="text-[10px] text-[#757575]">In Maintenance</p>
          </div>
          <div className="bg-red-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-red-600">{stats.expiredCertificates}</p>
            <p className="text-[10px] text-[#757575]">Expired Certs</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-amber-600">{stats.expiringCertificates}</p>
            <p className="text-[10px] text-[#757575]">Expiring Soon</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-purple-600">{stats.upcomingInspections}</p>
            <p className="text-[10px] text-[#757575]">Inspections</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-blue-600">{stats.chemicalsExpiringSoon}</p>
            <p className="text-[10px] text-[#757575]">Chemicals Expiring</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 flex flex-col min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="bg-white border-b border-gray-200 px-4">
            <TabsList className="bg-transparent h-12">
              <TabsTrigger value="overview" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                Overview
              </TabsTrigger>
              <TabsTrigger value="sterilization" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <SprayCan className="h-4 w-4 mr-1" />Sterilization
              </TabsTrigger>
              <TabsTrigger value="equipment" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Scissors className="h-4 w-4 mr-1" />Equipment
              </TabsTrigger>
              <TabsTrigger value="certificates" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <BadgeCheck className="h-4 w-4 mr-1" />Staff Certificates
              </TabsTrigger>
              <TabsTrigger value="chemicals" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <TestTube className="h-4 w-4 mr-1" />Chemicals
              </TabsTrigger>
              <TabsTrigger value="inspections" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <ClipboardList className="h-4 w-4 mr-1" />Inspections
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 p-4">
            {/* Overview Tab */}
            <TabsContent value="overview" className="m-0">
              <div className="grid grid-cols-2 gap-4">
                {/* Quick Sterilization */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <SprayCan className="h-5 w-5 text-[#00897B]" />
                      Pending Sterilizations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {sterilizationLogs.filter(s => s.status === 'pending').map(log => (
                        <div key={log.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{log.equipmentName}</p>
                            <p className="text-xs text-[#757575]">By: {log.performedBy}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getMethodBadge(log.method)}
                            <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C]">Verify</Button>
                          </div>
                        </div>
                      ))}
                      {stats.pendingSterilizations === 0 && (
                        <p className="text-center text-sm text-[#757575] py-4">No pending sterilizations</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Certificate Alerts */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-[#00897B]" />
                      Certificate Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {certificates.filter(c => c.status === 'expired' || c.status === 'expiring_soon').map(cert => (
                        <div key={cert.id} className={`flex items-center justify-between p-2 rounded-lg ${
                          cert.status === 'expired' ? 'bg-red-50' : 'bg-amber-50'
                        }`}>
                          <div>
                            <p className="font-medium text-sm">{cert.staffName}</p>
                            <p className="text-xs text-[#757575]">{getCertificateTypeLabel(cert.certificateType)}</p>
                          </div>
                          <Badge className={cert.status === 'expired' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}>
                            {cert.status === 'expired' ? 'Expired' : 'Expiring'}
                          </Badge>
                        </div>
                      ))}
                      {(stats.expiredCertificates + stats.expiringCertificates) === 0 && (
                        <p className="text-center text-sm text-[#757575] py-4">All certificates up to date</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Equipment Status */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Scissors className="h-5 w-5 text-[#00897B]" />
                      Equipment Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {equipment.filter(e => e.status !== 'operational').map(eq => (
                        <div key={eq.id} className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{eq.name}</p>
                            <p className="text-xs text-[#757575]">Next service: {eq.nextServiceDate}</p>
                          </div>
                          <Badge className="bg-orange-100 text-orange-700">{eq.status}</Badge>
                        </div>
                      ))}
                      {stats.equipmentMaintenance === 0 && (
                        <p className="text-center text-sm text-[#757575] py-4">All equipment operational</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Upcoming Inspections */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-[#00897B]" />
                      Upcoming Inspections
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {inspections.filter(i => i.status === 'scheduled').map(insp => (
                        <div key={insp.id} className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm capitalize">{insp.inspectionType.replace('_', ' ')}</p>
                            <p className="text-xs text-[#757575]">{insp.scheduledDate}</p>
                          </div>
                          <Badge className="bg-purple-100 text-purple-700">Scheduled</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Sterilization Tab */}
            <TabsContent value="sterilization" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Sterilization Log</h2>
                <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setSterilizationDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />New Entry
                </Button>
              </div>

              <div className="space-y-3">
                {sterilizationLogs.map(log => (
                  <Card key={log.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg ${log.status === 'passed' ? 'bg-green-100' : log.status === 'failed' ? 'bg-red-100' : 'bg-yellow-100'}`}>
                            {log.status === 'passed' ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : log.status === 'failed' ? (
                              <XCircle className="h-5 w-5 text-red-600" />
                            ) : (
                              <Clock className="h-5 w-5 text-yellow-600" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold">{log.equipmentName}</p>
                              {getMethodBadge(log.method)}
                            </div>
                            <p className="text-sm text-[#757575]">ID: {log.equipmentId} | Cycle: {log.cycleNumber}</p>
                            {log.method === 'autoclave' && (
                              <p className="text-sm text-[#757575]">
                                Temp: {log.temperature}°C | Duration: {log.duration} min
                              </p>
                            )}
                            <p className="text-sm text-[#757575]">By: {log.performedBy}</p>
                            {log.verifiedBy && (
                              <p className="text-sm text-green-600">Verified by: {log.verifiedBy}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={
                            log.status === 'passed' ? 'bg-green-100 text-green-700' :
                            log.status === 'failed' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }>
                            {log.status}
                          </Badge>
                          <p className="text-xs text-[#757575] mt-2">{new Date(log.timestamp).toLocaleString()}</p>
                          {log.status === 'pending' && (
                            <Button size="sm" className="mt-2 bg-[#00897B] hover:bg-[#00695C]">Verify</Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Equipment Tab */}
            <TabsContent value="equipment" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Equipment Maintenance</h2>
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />Schedule Service
                </Button>
              </div>

              <div className="space-y-3">
                {equipment.map(eq => (
                  <Card key={eq.id} className={eq.status === 'broken' ? 'border-red-300' : eq.status === 'maintenance' ? 'border-orange-300' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg ${
                            eq.status === 'operational' ? 'bg-green-100' :
                            eq.status === 'maintenance' ? 'bg-orange-100' :
                            'bg-red-100'
                          }`}>
                            <Scissors className={`h-5 w-5 ${
                              eq.status === 'operational' ? 'text-green-600' :
                              eq.status === 'maintenance' ? 'text-orange-600' :
                              'text-red-600'
                            }`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold">{eq.name}</p>
                              <Badge className={
                                eq.status === 'operational' ? 'bg-green-100 text-green-700' :
                                eq.status === 'maintenance' ? 'bg-orange-100 text-orange-700' :
                                'bg-red-100 text-red-700'
                              }>
                                {eq.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-[#757575]">Type: {eq.type} | S/N: {eq.serialNumber}</p>
                            <p className="text-sm text-[#757575]">Purchased: {eq.purchaseDate}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-[#757575]">Last Service</p>
                          <p className="font-medium">{eq.lastServiceDate}</p>
                          <p className="text-sm text-[#757575] mt-2">Next Service</p>
                          <p className="font-medium text-[#00897B]">{eq.nextServiceDate}</p>
                          <Button size="sm" variant="outline" className="mt-2">Service History</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Certificates Tab */}
            <TabsContent value="certificates" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Staff Certificates</h2>
                <Button className="bg-[#00897B] hover:bg-[#00695C]">
                  <Plus className="h-4 w-4 mr-2" />Add Certificate
                </Button>
              </div>

              <div className="space-y-3">
                {certificates.map(cert => (
                  <Card key={cert.id} className={cert.status === 'expired' ? 'border-red-300' : cert.status === 'expiring_soon' ? 'border-amber-300' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg ${
                            cert.status === 'valid' ? 'bg-green-100' :
                            cert.status === 'expiring_soon' ? 'bg-amber-100' :
                            'bg-red-100'
                          }`}>
                            <BadgeCheck className={`h-5 w-5 ${
                              cert.status === 'valid' ? 'text-green-600' :
                              cert.status === 'expiring_soon' ? 'text-amber-600' :
                              'text-red-600'
                            }`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold">{cert.staffName}</p>
                              <Badge variant="outline">{getCertificateTypeLabel(cert.certificateType)}</Badge>
                            </div>
                            <p className="text-sm text-[#757575]">Certificate: {cert.certificateNumber}</p>
                            <p className="text-sm text-[#757575]">Issued by: {cert.issuedBy}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={
                            cert.status === 'valid' ? 'bg-green-100 text-green-700' :
                            cert.status === 'expiring_soon' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }>
                            {cert.status === 'valid' ? 'Valid' : cert.status === 'expiring_soon' ? 'Expiring Soon' : 'Expired'}
                          </Badge>
                          <p className="text-sm text-[#757575] mt-2">Expires</p>
                          <p className={`font-medium ${cert.status !== 'valid' ? 'text-red-600' : ''}`}>{cert.expiryDate}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Chemicals Tab */}
            <TabsContent value="chemicals" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Chemical Register (SDS)</h2>
                <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setChemicalDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />Add Chemical
                </Button>
              </div>

              <div className="space-y-3">
                {chemicals.map(chem => (
                  <Card key={chem.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="p-2 rounded-lg bg-blue-100">
                            <Droplets className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold">{chem.productName}</p>
                              {getHazardBadge(chem.hazardClass)}
                            </div>
                            <p className="text-sm text-[#757575]">Active: {chem.chemicalName}</p>
                            <p className="text-sm text-[#757575]">Storage: {chem.storageLocation}</p>
                            <p className="text-sm text-[#757575]">Quantity: {chem.quantity} {chem.unit}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-[#757575]">SDS Date</p>
                          <p className="font-medium">{chem.sdsDate}</p>
                          <p className="text-sm text-[#757575] mt-2">Expires</p>
                          <p className="font-medium">{chem.expiryDate}</p>
                          <Button size="sm" variant="outline" className="mt-2">
                            <Download className="h-3 w-3 mr-1" />SDS
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Inspections Tab */}
            <TabsContent value="inspections" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Safety Inspections</h2>
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />Schedule Inspection
                </Button>
              </div>

              <div className="space-y-3">
                {inspections.map(insp => (
                  <Card key={insp.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg ${
                            insp.status === 'passed' ? 'bg-green-100' :
                            insp.status === 'failed' ? 'bg-red-100' :
                            'bg-purple-100'
                          }`}>
                            <ClipboardList className={`h-5 w-5 ${
                              insp.status === 'passed' ? 'text-green-600' :
                              insp.status === 'failed' ? 'text-red-600' :
                              'text-purple-600'
                            }`} />
                          </div>
                          <div>
                            <p className="font-bold capitalize">{insp.inspectionType.replace('_', ' ')}</p>
                            <p className="text-sm text-[#757575]">Scheduled: {insp.scheduledDate}</p>
                            {insp.inspectorName && (
                              <p className="text-sm text-[#757575]">Inspector: {insp.inspectorName}</p>
                            )}
                            {insp.findings && (
                              <p className="text-sm text-[#757575] mt-2">{insp.findings}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={
                            insp.status === 'passed' ? 'bg-green-100 text-green-700' :
                            insp.status === 'failed' ? 'bg-red-100 text-red-700' :
                            'bg-purple-100 text-purple-700'
                          }>
                            {insp.status}
                          </Badge>
                          {insp.score && (
                            <p className="mt-2 text-lg font-bold text-[#00897B]">{insp.score}%</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  )
}
