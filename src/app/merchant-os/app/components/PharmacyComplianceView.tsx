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
  Pill,
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
  FlaskConical,
  Syringe,
  PillIcon,
} from 'lucide-react'

// Types
type ScheduleType = 'schedule_1' | 'schedule_2' | 'schedule_3' | 'schedule_4' | 'schedule_5' | 'schedule_6' | 'otc'
type ScriptStatus = 'pending' | 'dispensed' | 'partially_dispensed' | 'cancelled'

interface PharmacistOnDuty {
  id: string
  name: string
  sapcNumber: string
  shift: 'morning' | 'afternoon' | 'evening' | 'night'
  startTime: string
  endTime: string
  status: 'active' | 'on_break' | 'off_duty'
}

interface ScriptLog {
  id: string
  scriptNumber: string
  patientName: string
  patientId: string
  prescriberName: string
  prescriberPracticeNumber: string
  diagnosis?: string
  items: ScriptItem[]
  totalValue: number
  status: ScriptStatus
  scheduleType: ScheduleType
  dispensedBy: string
  verifiedBy: string
  createdAt: string
  dispensedAt?: string
}

interface ScriptItem {
  id: string
  productName: string
  nappiCode: string
  quantity: number
  dosage: string
  frequency: string
  price: number
}

interface ControlledSubstance {
  id: string
  substanceName: string
  schedule: ScheduleType
  batchNumber: string
  quantityReceived: number
  quantityDispensed: number
  quantityRemaining: number
  expiryDate: string
  supplier: string
  lastAuditDate: string
  lastAuditBy: string
  discrepancies: number
}

interface MedicineReturn {
  id: string
  productName: string
  batchNumber: string
  quantity: number
  returnReason: 'expired' | 'damaged' | 'recalled' | 'patient_return'
  status: 'pending' | 'approved' | 'disposed'
  initiatedBy: string
  approvedBy?: string
  createdAt: string
  disposalDate?: string
  disposalMethod?: string
}

interface SAHPRAInspection {
  id: string
  inspectionType: 'routine' | 'complaint' | 'follow_up' | 'license_renewal'
  scheduledDate: string
  inspectorName?: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'failed'
  findings?: string
  correctiveActions?: string
  score?: number
  passed?: boolean
}

export function PharmacyComplianceView() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Data states
  const [pharmacistOnDuty, setPharmacistOnDuty] = useState<PharmacistOnDuty | null>(null)
  const [scriptLogs, setScriptLogs] = useState<ScriptLog[]>([])
  const [controlledSubstances, setControlledSubstances] = useState<ControlledSubstance[]>([])
  const [medicineReturns, setMedicineReturns] = useState<MedicineReturn[]>([])
  const [inspections, setInspections] = useState<SAHPRAInspection[]>([])

  // Dialog states
  const [scriptDialogOpen, setScriptDialogOpen] = useState(false)
  const [returnDialogOpen, setReturnDialogOpen] = useState(false)
  const [auditDialogOpen, setAuditDialogOpen] = useState(false)

  // Form states
  const [newReturn, setNewReturn] = useState({
    productName: '',
    batchNumber: '',
    quantity: 0,
    returnReason: 'expired' as MedicineReturn['returnReason'],
    notes: '',
  })

  // Update time
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Mock data
  useEffect(() => {
    const timer = setTimeout(() => {
      setPharmacistOnDuty({
        id: '1',
        name: 'Dr. Sarah Mokoena',
        sapcNumber: 'SAPC-123456',
        shift: 'morning',
        startTime: '08:00',
        endTime: '16:00',
        status: 'active',
      })

      setScriptLogs([
        {
          id: '1',
          scriptNumber: 'RX-2026-001',
          patientName: 'John Dlamini',
          patientId: 'ID-123456789',
          prescriberName: 'Dr. Thandi Zwane',
          prescriberPracticeNumber: 'MP-123456',
          diagnosis: 'Hypertension',
          items: [
            { id: '1', productName: 'Enalapril 10mg', nappiCode: 'NAP-123', quantity: 30, dosage: '10mg', frequency: 'Once daily', price: 150 },
          ],
          totalValue: 150,
          status: 'dispensed',
          scheduleType: 'schedule_3',
          dispensedBy: 'Dr. Sarah Mokoena',
          verifiedBy: 'Dr. Sarah Mokoena',
          createdAt: new Date().toISOString(),
          dispensedAt: new Date().toISOString(),
        },
        {
          id: '2',
          scriptNumber: 'RX-2026-002',
          patientName: 'Maria Santos',
          patientId: 'ID-987654321',
          prescriberName: 'Dr. Peter van der Merwe',
          prescriberPracticeNumber: 'MP-654321',
          diagnosis: 'Chronic pain',
          items: [
            { id: '1', productName: 'Tramadol 50mg', nappiCode: 'NAP-456', quantity: 20, dosage: '50mg', frequency: 'Twice daily', price: 280 },
          ],
          totalValue: 280,
          status: 'pending',
          scheduleType: 'schedule_5',
          dispensedBy: '',
          verifiedBy: '',
          createdAt: new Date().toISOString(),
        },
      ])

      setControlledSubstances([
        {
          id: '1',
          substanceName: 'Morphine Sulfate 10mg/mL',
          schedule: 'schedule_6',
          batchNumber: 'BTH-2026-001',
          quantityReceived: 100,
          quantityDispensed: 45,
          quantityRemaining: 55,
          expiryDate: '2027-06-30',
          supplier: 'Pharma Dynamics',
          lastAuditDate: '2026-02-01',
          lastAuditBy: 'Dr. Sarah Mokoena',
          discrepancies: 0,
        },
        {
          id: '2',
          substanceName: 'Codeine Phosphate 30mg',
          schedule: 'schedule_5',
          batchNumber: 'BTH-2026-002',
          quantityReceived: 500,
          quantityDispensed: 320,
          quantityRemaining: 180,
          expiryDate: '2027-12-31',
          supplier: 'Adcock Ingram',
          lastAuditDate: '2026-02-10',
          lastAuditBy: 'Dr. Sarah Mokoena',
          discrepancies: 0,
        },
      ])

      setMedicineReturns([
        {
          id: '1',
          productName: 'Amoxicillin 250mg',
          batchNumber: 'BTH-2025-099',
          quantity: 50,
          returnReason: 'expired',
          status: 'pending',
          initiatedBy: 'Pharmacy Assistant',
          createdAt: '2026-02-10',
        },
      ])

      setInspections([
        {
          id: '1',
          inspectionType: 'routine',
          scheduledDate: '2026-03-15',
          status: 'scheduled',
        },
        {
          id: '2',
          inspectionType: 'license_renewal',
          scheduledDate: '2026-06-01',
          status: 'scheduled',
        },
      ])

      setLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // Stats
  const stats = {
    scriptsToday: scriptLogs.filter(s => new Date(s.createdAt).toDateString() === new Date().toDateString()).length,
    pendingScripts: scriptLogs.filter(s => s.status === 'pending').length,
    controlledStock: controlledSubstances.reduce((sum, s) => sum + s.quantityRemaining, 0),
    lowStockItems: controlledSubstances.filter(s => s.quantityRemaining < 20).length,
    pendingReturns: medicineReturns.filter(r => r.status === 'pending').length,
    upcomingInspections: inspections.filter(i => i.status === 'scheduled').length,
    discrepancies: controlledSubstances.reduce((sum, s) => sum + s.discrepancies, 0),
  }

  const getScheduleBadge = (schedule: ScheduleType) => {
    const colors: Record<ScheduleType, string> = {
      schedule_1: 'bg-gray-100 text-gray-700',
      schedule_2: 'bg-green-100 text-green-700',
      schedule_3: 'bg-blue-100 text-blue-700',
      schedule_4: 'bg-yellow-100 text-yellow-700',
      schedule_5: 'bg-orange-100 text-orange-700',
      schedule_6: 'bg-red-100 text-red-700',
      otc: 'bg-purple-100 text-purple-700',
    }
    const labels: Record<ScheduleType, string> = {
      schedule_1: 'Schedule 1',
      schedule_2: 'Schedule 2',
      schedule_3: 'Schedule 3',
      schedule_4: 'Schedule 4',
      schedule_5: 'Schedule 5',
      schedule_6: 'Schedule 6',
      otc: 'OTC',
    }
    return <Badge className={colors[schedule]}>{labels[schedule]}</Badge>
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      dispensed: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      scheduled: 'bg-purple-100 text-purple-700',
      expired: 'bg-red-100 text-red-700',
    }
    return <Badge className={colors[status] || 'bg-gray-100 text-gray-700'}>{status}</Badge>
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
              <Pill className="h-5 w-5 text-[#00897B]" />
              Pharmacy Compliance
            </h1>
            <p className="text-sm text-[#757575]">SAHPRA compliance, script logs & controlled substances</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-mono font-bold">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              <p className="text-xs text-[#757575]">{currentTime.toLocaleDateString()}</p>
            </div>

            {/* Pharmacist Status */}
            {pharmacistOnDuty ? (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                pharmacistOnDuty.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}>
                <UserCheck className="h-5 w-5" />
                <div>
                  <span className="font-medium">{pharmacistOnDuty.name}</span>
                  <p className="text-xs">{pharmacistOnDuty.sapcNumber}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 text-red-700">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">No Pharmacist on Duty</span>
              </div>
            )}

            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-8 gap-3">
          <div className="bg-[#E0F2F1] rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-[#00897B]">{stats.scriptsToday}</p>
            <p className="text-[10px] text-[#757575]">Scripts Today</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-yellow-600">{stats.pendingScripts}</p>
            <p className="text-[10px] text-[#757575]">Pending</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-blue-600">{stats.controledStock}</p>
            <p className="text-[10px] text-[#757575]">Controlled Stock</p>
          </div>
          <div className="bg-red-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-red-600">{stats.lowStockItems}</p>
            <p className="text-[10px] text-[#757575]">Low Stock</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-orange-600">{stats.pendingReturns}</p>
            <p className="text-[10px] text-[#757575]">Returns</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-purple-600">{stats.upcomingInspections}</p>
            <p className="text-[10px] text-[#757575]">Inspections</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-amber-600">{stats.discrepancies}</p>
            <p className="text-[10px] text-[#757575]">Discrepancies</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-green-600">Active</p>
            <p className="text-[10px] text-[#757575]">License</p>
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
              <TabsTrigger value="scripts" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <FileText className="h-4 w-4 mr-1" />Scripts
              </TabsTrigger>
              <TabsTrigger value="controlled" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Lock className="h-4 w-4 mr-1" />Controlled Substances
              </TabsTrigger>
              <TabsTrigger value="returns" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Trash2 className="h-4 w-4 mr-1" />Returns
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
                {/* Quick Script Check */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-5 w-5 text-[#00897B]" />
                      Pending Scripts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {scriptLogs.filter(s => s.status === 'pending').slice(0, 3).map(script => (
                        <div key={script.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{script.scriptNumber}</p>
                            <p className="text-xs text-[#757575]">{script.patientName}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getScheduleBadge(script.scheduleType)}
                            <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C]">Dispense</Button>
                          </div>
                        </div>
                      ))}
                      {stats.pendingScripts === 0 && (
                        <p className="text-center text-sm text-[#757575] py-4">No pending scripts</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Controlled Substance Alert */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-[#00897B]" />
                      Stock Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {controlledSubstances.filter(s => s.quantityRemaining < 20).map(substance => (
                        <div key={substance.id} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{substance.substanceName}</p>
                            <p className="text-xs text-[#757575]">Batch: {substance.batchNumber}</p>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-red-100 text-red-700">{substance.quantityRemaining} units</Badge>
                          </div>
                        </div>
                      ))}
                      {stats.lowStockItems === 0 && (
                        <p className="text-center text-sm text-[#757575] py-4">All stock levels normal</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Upcoming Inspections */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-[#00897B]" />
                      SAHPRA Inspections
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {inspections.filter(i => i.status === 'scheduled').map(inspection => (
                        <div key={inspection.id} className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm capitalize">{inspection.inspectionType.replace('_', ' ')}</p>
                            <p className="text-xs text-[#757575]">{inspection.scheduledDate}</p>
                          </div>
                          <Badge className="bg-purple-100 text-purple-700">Scheduled</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Pharmacist Schedule */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-5 w-5 text-[#00897B]" />
                      Pharmacist on Duty
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {pharmacistOnDuty ? (
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-green-200">
                            <UserCheck className="h-5 w-5 text-green-700" />
                          </div>
                          <div>
                            <p className="font-medium">{pharmacistOnDuty.name}</p>
                            <p className="text-sm text-[#757575]">SAPC: {pharmacistOnDuty.sapcNumber}</p>
                            <p className="text-xs text-[#757575]">{pharmacistOnDuty.startTime} - {pharmacistOnDuty.endTime}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-red-50 rounded-lg">
                        <p className="text-red-700 font-medium">No pharmacist currently on duty</p>
                        <p className="text-xs text-red-600">Controlled substances cannot be dispensed</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Scripts Tab */}
            <TabsContent value="scripts" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Script Dispensing Log</h2>
                <Button className="bg-[#00897B] hover:bg-[#00695C]">
                  <Plus className="h-4 w-4 mr-2" />New Script
                </Button>
              </div>

              <div className="space-y-3">
                {scriptLogs.map(script => (
                  <Card key={script.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg ${script.status === 'pending' ? 'bg-yellow-100' : 'bg-green-100'}`}>
                            {script.status === 'pending' ? (
                              <Clock className="h-5 w-5 text-yellow-600" />
                            ) : (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold">{script.scriptNumber}</p>
                              {getScheduleBadge(script.scheduleType)}
                              {getStatusBadge(script.status)}
                            </div>
                            <p className="text-sm text-[#757575]">Patient: {script.patientName} ({script.patientId})</p>
                            <p className="text-sm text-[#757575]">Prescriber: {script.prescriberName} ({script.prescriberPracticeNumber})</p>
                            <div className="mt-2 space-y-1">
                              {script.items.map(item => (
                                <div key={item.id} className="text-sm flex items-center gap-2">
                                  <Pill className="h-3 w-3 text-[#00897B]" />
                                  <span>{item.productName} x{item.quantity} - {item.dosage} {item.frequency}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">R{script.totalValue.toFixed(2)}</p>
                          <p className="text-xs text-[#757575]">{new Date(script.createdAt).toLocaleString()}</p>
                          {script.status === 'pending' && (
                            <Button size="sm" className="mt-2 bg-[#00897B] hover:bg-[#00695C]">Dispense</Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Controlled Substances Tab */}
            <TabsContent value="controlled" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Controlled Substances Register</h2>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setAuditDialogOpen(true)}>
                    <ClipboardList className="h-4 w-4 mr-2" />Perform Audit
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />Export Report
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {controlledSubstances.map(substance => (
                  <Card key={substance.id} className={substance.quantityRemaining < 20 ? 'border-red-300' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="p-2 rounded-lg bg-red-100">
                            <Lock className="h-5 w-5 text-red-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold">{substance.substanceName}</p>
                              {getScheduleBadge(substance.schedule)}
                            </div>
                            <p className="text-sm text-[#757575]">Batch: {substance.batchNumber} | Supplier: {substance.supplier}</p>
                            <p className="text-sm text-[#757575]">Expiry: {substance.expiryDate}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <p className="text-lg font-bold text-blue-600">{substance.quantityReceived}</p>
                              <p className="text-xs text-[#757575]">Received</p>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-orange-600">{substance.quantityDispensed}</p>
                              <p className="text-xs text-[#757575]">Dispensed</p>
                            </div>
                            <div>
                              <p className={`text-lg font-bold ${substance.quantityRemaining < 20 ? 'text-red-600' : 'text-green-600'}`}>
                                {substance.quantityRemaining}
                              </p>
                              <p className="text-xs text-[#757575]">Remaining</p>
                            </div>
                          </div>
                          {substance.discrepancies > 0 && (
                            <Badge className="mt-2 bg-red-100 text-red-700">
                              <AlertTriangle className="h-3 w-3 mr-1" />{substance.discrepancies} discrepancies
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t text-sm text-[#757575]">
                        Last audit: {substance.lastAuditDate} by {substance.lastAuditBy}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Returns Tab */}
            <TabsContent value="returns" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Medicine Returns & Disposals</h2>
                <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setReturnDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />New Return
                </Button>
              </div>

              <div className="space-y-3">
                {medicineReturns.map(ret => (
                  <Card key={ret.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-orange-100">
                            <Trash2 className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-medium">{ret.productName}</p>
                            <p className="text-sm text-[#757575]">Batch: {ret.batchNumber} | Qty: {ret.quantity}</p>
                            <p className="text-sm text-[#757575]">Reason: {ret.returnReason}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(ret.status)}
                          {ret.status === 'pending' && (
                            <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C]">Approve</Button>
                          )}
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
                <h2 className="text-lg font-semibold">SAHPRA Inspections</h2>
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />Schedule Inspection
                </Button>
              </div>

              <div className="space-y-3">
                {inspections.map(inspection => (
                  <Card key={inspection.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-purple-100">
                            <ClipboardList className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium capitalize">{inspection.inspectionType.replace('_', ' ')}</p>
                            <p className="text-sm text-[#757575]">Scheduled: {inspection.scheduledDate}</p>
                            {inspection.inspectorName && (
                              <p className="text-sm text-[#757575]">Inspector: {inspection.inspectorName}</p>
                            )}
                          </div>
                        </div>
                        {getStatusBadge(inspection.status)}
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
