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
  Stethoscope,
  Calendar,
  Clock,
  Users,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  History,
  Building2,
  Loader2,
  BadgeCheck,
  ShieldCheck,
  BookOpen,
  Award,
  Activity,
  Heart,
  Smile,
  Beaker,
  CreditCard,
  Banknote,
  Syringe,
  X,
  Radiation,
  ClipboardList,
  ArrowUpRight,
  ArrowDownRight,
  Timer,
} from 'lucide-react'

// Types
type AppointmentStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
type TreatmentPhase = 'examination' | 'treatment' | 'review' | 'completed'
type LabWorkStatus = 'ordered' | 'in_progress' | 'ready' | 'delivered' | 'fitted'
type MedicalAidStatus = 'active' | 'inactive' | 'pending_auth' | 'auth_declined'

interface Patient {
  id: string
  dentalRecordNumber: string
  firstName: string
  lastName: string
  idNumber: string
  dateOfBirth: string
  contactNumber: string
  email: string
  medicalAid: MedicalAidInfo | null
  lastVisit: string
  outstandingBalance: number
  treatmentPlan?: TreatmentPlan
}

interface MedicalAidInfo {
  provider: string
  planName: string
  membershipNumber: string
  dependantCode: string
  status: MedicalAidStatus
  authNumber?: string
}

interface Appointment {
  id: string
  patientId: string
  patientName: string
  dentalRecordNumber: string
  treatmentType: string
  toothNumbers: string[]
  phase: TreatmentPhase
  medicalAid: boolean
  medicalAidName?: string
  status: AppointmentStatus
  scheduledTime: string
  duration: number
  dentistName: string
  notes?: string
}

interface TreatmentPlan {
  id: string
  patientId: string
  patientName: string
  diagnosis: string
  icd10Code: string
  totalEstimate: number
  phases: TreatmentPhaseItem[]
  status: 'active' | 'completed' | 'on_hold'
  createdAt: string
}

interface TreatmentPhaseItem {
  id: string
  phaseNumber: number
  description: string
  toothNumbers: string[]
  procedures: ProcedureItem[]
  estimate: number
  status: 'pending' | 'in_progress' | 'completed'
}

interface ProcedureItem {
  id: string
  code: string
  description: string
  tariff: number
  quantity: number
  total: number
}

interface LabWork {
  id: string
  patientId: string
  patientName: string
  workType: 'crown' | 'bridge' | 'denture' | 'implant' | 'orthodontic' | 'other'
  toothNumbers: string[]
  labName: string
  shade?: string
  status: LabWorkStatus
  orderDate: string
  expectedDate: string
  receivedDate?: string
  cost: number
  notes?: string
}

interface HPCSARecord {
  id: string
  practitionerName: string
  hpcsaNumber: string
  registrationType: string
  registrationDate: string
  expiryDate: string
  status: 'active' | 'expired' | 'pending_renewal'
  practiceCardExpiry: string
}

interface CPDRecord {
  id: string
  staffName: string
  hpcsaNumber: string
  cycleStart: string
  cycleEnd: string
  requiredPoints: number
  earnedPoints: number
  activities: CPDActivity[]
  status: 'compliant' | 'at_risk' | 'non_compliant'
}

interface CPDActivity {
  id: string
  title: string
  type: 'course' | 'seminar' | 'workshop' | 'publication' | 'presentation' | 'online'
  category: 'ethical' | 'clinical' | 'general'
  points: number
  date: string
  provider: string
  certificateUrl?: string
}

interface RadiationSafety {
  id: string
  equipmentType: string
  serialNumber: string
  lastInspection: string
  nextInspection: string
  licenceNumber: string
  licenceExpiry: string
  status: 'compliant' | 'expiring_soon' | 'expired'
}

interface ProfessionalIndemnity {
  id: string
  provider: string
  policyNumber: string
  coverageAmount: number
  startDate: string
  endDate: string
  status: 'active' | 'expired' | 'pending_renewal'
}

export function DentalPracticeView() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Data states
  const [patients, setPatients] = useState<Patient[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([])
  const [labWork, setLabWork] = useState<LabWork[]>([])
  const [hpcsaRecords, setHpcsaRecords] = useState<HPCSARecord[]>([])
  const [cpdRecords, setCpdRecords] = useState<CPDRecord[]>([])
  const [radiationSafety, setRadiationSafety] = useState<RadiationSafety[]>([])
  const [indemnityInsurance, setIndemnityInsurance] = useState<ProfessionalIndemnity[]>([])

  // Dialog states
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false)
  const [labWorkDialogOpen, setLabWorkDialogOpen] = useState(false)
  const [cpdDialogOpen, setCpdDialogOpen] = useState(false)

  // Update time
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Mock data
  useEffect(() => {
    const timer = setTimeout(() => {
      setPatients([
        {
          id: '1',
          dentalRecordNumber: 'DNT-2024-001',
          firstName: 'Thandi',
          lastName: 'Mokoena',
          idNumber: '8501010580084',
          dateOfBirth: '1985-01-01',
          contactNumber: '0821234567',
          email: 'thandi.mokoena@email.com',
          medicalAid: {
            provider: 'Discovery Health',
            planName: 'Comprehensive',
            membershipNumber: 'DH-1234567',
            dependantCode: '01',
            status: 'active',
          },
          lastVisit: '2026-02-10',
          outstandingBalance: 1250.00,
        },
        {
          id: '2',
          dentalRecordNumber: 'DNT-2024-002',
          firstName: 'Johan',
          lastName: 'van der Merwe',
          idNumber: '7802155711088',
          dateOfBirth: '1978-02-15',
          contactNumber: '0839876543',
          email: 'johan.vdm@email.com',
          medicalAid: {
            provider: 'Bonitas',
            planName: 'Standard',
            membershipNumber: 'BON-9876543',
            dependantCode: '00',
            status: 'pending_auth',
          },
          lastVisit: '2026-02-12',
          outstandingBalance: 0,
        },
        {
          id: '3',
          dentalRecordNumber: 'DNT-2024-003',
          firstName: 'Priya',
          lastName: 'Naidoo',
          idNumber: '9006100460089',
          dateOfBirth: '1990-06-10',
          contactNumber: '0845678901',
          email: 'priya.naidoo@email.com',
          medicalAid: null,
          lastVisit: '2026-02-14',
          outstandingBalance: 3500.00,
        },
      ])

      setAppointments([
        {
          id: '1',
          patientId: '1',
          patientName: 'Thandi Mokoena',
          dentalRecordNumber: 'DNT-2024-001',
          treatmentType: 'Root Canal Treatment',
          toothNumbers: ['36'],
          phase: 'treatment',
          medicalAid: true,
          medicalAidName: 'Discovery Health',
          status: 'scheduled',
          scheduledTime: '2026-02-15T09:00:00',
          duration: 60,
          dentistName: 'Dr. Sarah Ndaba',
        },
        {
          id: '2',
          patientId: '2',
          patientName: 'Johan van der Merwe',
          dentalRecordNumber: 'DNT-2024-002',
          treatmentType: 'Crown Fitting',
          toothNumbers: ['17'],
          phase: 'treatment',
          medicalAid: true,
          medicalAidName: 'Bonitas',
          status: 'scheduled',
          scheduledTime: '2026-02-15T10:30:00',
          duration: 45,
          dentistName: 'Dr. Sarah Ndaba',
        },
        {
          id: '3',
          patientId: '3',
          patientName: 'Priya Naidoo',
          dentalRecordNumber: 'DNT-2024-003',
          treatmentType: 'Dental Check-up',
          toothNumbers: [],
          phase: 'examination',
          medicalAid: false,
          status: 'in_progress',
          scheduledTime: '2026-02-15T11:30:00',
          duration: 30,
          dentistName: 'Dr. Sarah Ndaba',
        },
        {
          id: '4',
          patientId: '1',
          patientName: 'Thandi Mokoena',
          dentalRecordNumber: 'DNT-2024-001',
          treatmentType: 'Scaling & Polishing',
          toothNumbers: [],
          phase: 'examination',
          medicalAid: true,
          medicalAidName: 'Discovery Health',
          status: 'completed',
          scheduledTime: '2026-02-14T14:00:00',
          duration: 30,
          dentistName: 'Dr. Sarah Ndaba',
        },
      ])

      setTreatmentPlans([
        {
          id: '1',
          patientId: '1',
          patientName: 'Thandi Mokoena',
          diagnosis: 'Irreversible pulpitis tooth 36',
          icd10Code: 'DA02.0',
          totalEstimate: 8500.00,
          status: 'active',
          createdAt: '2026-02-10',
          phases: [
            {
              id: '1',
              phaseNumber: 1,
              description: 'Root Canal Treatment',
              toothNumbers: ['36'],
              procedures: [
                { id: '1', code: '8101', description: 'Root canal treatment - molar', tariff: 2800, quantity: 1, total: 2800 },
                { id: '2', code: '8301', description: 'Permanent filling', tariff: 850, quantity: 1, total: 850 },
              ],
              estimate: 3650,
              status: 'in_progress',
            },
            {
              id: '2',
              phaseNumber: 2,
              description: 'Crown Placement',
              toothNumbers: ['36'],
              procedures: [
                { id: '3', code: '7210', description: 'Porcelain fused to metal crown', tariff: 4850, quantity: 1, total: 4850 },
              ],
              estimate: 4850,
              status: 'pending',
            },
          ],
        },
        {
          id: '2',
          patientId: '2',
          patientName: 'Johan van der Merwe',
          diagnosis: 'Failed restoration tooth 17',
          icd10Code: 'DA08.1',
          totalEstimate: 5200.00,
          status: 'active',
          createdAt: '2026-02-08',
          phases: [
            {
              id: '1',
              phaseNumber: 1,
              description: 'Crown Preparation & Fitting',
              toothNumbers: ['17'],
              procedures: [
                { id: '1', code: '7210', description: 'Porcelain fused to metal crown', tariff: 4850, quantity: 1, total: 4850 },
                { id: '2', code: '7100', description: 'Crown preparation', tariff: 350, quantity: 1, total: 350 },
              ],
              estimate: 5200,
              status: 'in_progress',
            },
          ],
        },
      ])

      setLabWork([
        {
          id: '1',
          patientId: '2',
          patientName: 'Johan van der Merwe',
          workType: 'crown',
          toothNumbers: ['17'],
          labName: 'Dental Arts Laboratory',
          shade: 'A2',
          status: 'ready',
          orderDate: '2026-02-08',
          expectedDate: '2026-02-15',
          cost: 1850.00,
        },
        {
          id: '2',
          patientId: '1',
          patientName: 'Thandi Mokoena',
          workType: 'crown',
          toothNumbers: ['36'],
          labName: 'Dental Arts Laboratory',
          shade: 'B1',
          status: 'ordered',
          orderDate: '2026-02-14',
          expectedDate: '2026-02-21',
          cost: 1850.00,
        },
        {
          id: '3',
          patientId: '4',
          patientName: 'Sipho Dlamini',
          workType: 'denture',
          toothNumbers: ['33', '34', '35', '36', '37'],
          labName: 'Precision Dental Lab',
          status: 'in_progress',
          orderDate: '2026-02-10',
          expectedDate: '2026-02-24',
          cost: 4500.00,
        },
      ])

      setHpcsaRecords([
        {
          id: '1',
          practitionerName: 'Dr. Sarah Ndaba',
          hpcsaNumber: 'DT 1234567',
          registrationType: 'Dentist',
          registrationDate: '2015-03-15',
          expiryDate: '2026-03-31',
          status: 'active',
          practiceCardExpiry: '2026-12-31',
        },
        {
          id: '2',
          practitionerName: 'Dr. Michael Chen',
          hpcsaNumber: 'DT 2345678',
          registrationType: 'Dentist - Specialist (Orthodontist)',
          registrationDate: '2010-08-01',
          expiryDate: '2026-08-31',
          status: 'active',
          practiceCardExpiry: '2026-12-31',
        },
        {
          id: '3',
          practitionerName: 'Dr. Amina Patel',
          hpcsaNumber: 'DT 3456789',
          registrationType: 'Dentist',
          registrationDate: '2018-01-20',
          expiryDate: '2025-01-31',
          status: 'expired',
          practiceCardExpiry: '2025-12-31',
        },
      ])

      setCpdRecords([
        {
          id: '1',
          staffName: 'Dr. Sarah Ndaba',
          hpcsaNumber: 'DT 1234567',
          cycleStart: '2024-01-01',
          cycleEnd: '2025-12-31',
          requiredPoints: 60,
          earnedPoints: 48,
          status: 'at_risk',
          activities: [
            { id: '1', title: 'Advanced Endodontics Workshop', type: 'workshop', category: 'clinical', points: 15, date: '2024-05-20', provider: 'SADA' },
            { id: '2', title: 'Dental Ethics Update', type: 'course', category: 'ethical', points: 10, date: '2024-08-15', provider: 'HPCSA' },
            { id: '3', title: 'Digital Dentistry Conference', type: 'seminar', category: 'clinical', points: 18, date: '2024-11-10', provider: 'SADA' },
            { id: '4', title: 'Practice Management Seminar', type: 'seminar', category: 'general', points: 5, date: '2025-02-05', provider: 'SADA' },
          ],
        },
        {
          id: '2',
          staffName: 'Dr. Michael Chen',
          hpcsaNumber: 'DT 2345678',
          cycleStart: '2024-01-01',
          cycleEnd: '2025-12-31',
          requiredPoints: 60,
          earnedPoints: 72,
          status: 'compliant',
          activities: [
            { id: '1', title: 'Orthodontic Innovations Conference', type: 'seminar', category: 'clinical', points: 25, date: '2024-03-15', provider: 'SASO' },
            { id: '2', title: 'Ethics in Dental Practice', type: 'online', category: 'ethical', points: 15, date: '2024-06-20', provider: 'HPCSA' },
            { id: '3', title: 'Advanced Wire Bending Techniques', type: 'workshop', category: 'clinical', points: 20, date: '2024-09-10', provider: 'SASO' },
            { id: '4', title: 'Patient Communication Skills', type: 'course', category: 'general', points: 12, date: '2025-01-15', provider: 'SADA' },
          ],
        },
      ])

      setRadiationSafety([
        {
          id: '1',
          equipmentType: 'Intraoral X-ray Unit',
          serialNumber: 'XRAY-2021-001',
          lastInspection: '2025-08-15',
          nextInspection: '2026-08-15',
          licenceNumber: 'RAD-DEN-12345',
          licenceExpiry: '2026-12-31',
          status: 'compliant',
        },
        {
          id: '2',
          equipmentType: 'Panoramic X-ray Unit',
          serialNumber: 'PANO-2020-003',
          lastInspection: '2025-06-20',
          nextInspection: '2026-06-20',
          licenceNumber: 'RAD-DEN-12346',
          licenceExpiry: '2026-12-31',
          status: 'compliant',
        },
      ])

      setIndemnityInsurance([
        {
          id: '1',
          provider: 'MPS (Medical Protection Society)',
          policyNumber: 'MPS-SA-789456',
          coverageAmount: 5000000,
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          status: 'active',
        },
        {
          id: '2',
          provider: 'Hollard Professional Insurance',
          policyNumber: 'HPI-DEN-456789',
          coverageAmount: 3000000,
          startDate: '2025-01-01',
          endDate: '2026-01-01',
          status: 'expired',
        },
      ])

      setLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // Stats
  const stats = {
    todayAppointments: appointments.filter(a => 
      new Date(a.scheduledTime).toDateString() === new Date().toDateString()
    ).length,
    completedToday: appointments.filter(a => 
      a.status === 'completed' && new Date(a.scheduledTime).toDateString() === new Date().toDateString()
    ).length,
    pendingLabWork: labWork.filter(l => l.status !== 'delivered' && l.status !== 'fitted').length,
    readyLabWork: labWork.filter(l => l.status === 'ready').length,
    outstandingAccounts: patients.reduce((sum, p) => sum + p.outstandingBalance, 0),
    activeTreatmentPlans: treatmentPlans.filter(t => t.status === 'active').length,
    hpcsaCompliant: hpcsaRecords.filter(h => h.status === 'active').length,
    hpcsaExpiring: hpcsaRecords.filter(h => h.status === 'expired' || h.status === 'pending_renewal').length,
    cpdCompliant: cpdRecords.filter(c => c.status === 'compliant').length,
    cpdAtRisk: cpdRecords.filter(c => c.status === 'at_risk').length,
    radiationCompliant: radiationSafety.filter(r => r.status === 'compliant').length,
    activeInsurance: indemnityInsurance.filter(i => i.status === 'active').length,
  }

  const formatCurrency = (amount: number) => {
    return `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`
  }

  const getAppointmentStatusBadge = (status: AppointmentStatus) => {
    const colors: Record<AppointmentStatus, string> = {
      scheduled: 'bg-blue-100 text-blue-700',
      in_progress: 'bg-green-100 text-green-700',
      completed: 'bg-gray-100 text-gray-700',
      cancelled: 'bg-red-100 text-red-700',
      no_show: 'bg-orange-100 text-orange-700',
    }
    const labels: Record<AppointmentStatus, string> = {
      scheduled: 'Scheduled',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
      no_show: 'No Show',
    }
    return <Badge className={colors[status]}>{labels[status]}</Badge>
  }

  const getLabWorkStatusBadge = (status: LabWorkStatus) => {
    const colors: Record<LabWorkStatus, string> = {
      ordered: 'bg-blue-100 text-blue-700',
      in_progress: 'bg-yellow-100 text-yellow-700',
      ready: 'bg-green-100 text-green-700',
      delivered: 'bg-purple-100 text-purple-700',
      fitted: 'bg-gray-100 text-gray-700',
    }
    const labels: Record<LabWorkStatus, string> = {
      ordered: 'Ordered',
      in_progress: 'In Progress',
      ready: 'Ready for Fitting',
      delivered: 'Delivered',
      fitted: 'Fitted',
    }
    return <Badge className={colors[status]}>{labels[status]}</Badge>
  }

  const getPhaseBadge = (phase: TreatmentPhase) => {
    const colors: Record<TreatmentPhase, string> = {
      examination: 'bg-blue-100 text-blue-700',
      treatment: 'bg-green-100 text-green-700',
      review: 'bg-purple-100 text-purple-700',
      completed: 'bg-gray-100 text-gray-700',
    }
    const labels: Record<TreatmentPhase, string> = {
      examination: 'Examination',
      treatment: 'Treatment',
      review: 'Review',
      completed: 'Completed',
    }
    return <Badge className={colors[phase]}>{labels[phase]}</Badge>
  }

  const getCPDStatusBadge = (status: CPDRecord['status']) => {
    const colors: Record<CPDRecord['status'], string> = {
      compliant: 'bg-green-100 text-green-700',
      at_risk: 'bg-amber-100 text-amber-700',
      non_compliant: 'bg-red-100 text-red-700',
    }
    const labels: Record<CPDRecord['status'], string> = {
      compliant: 'Compliant',
      at_risk: 'At Risk',
      non_compliant: 'Non-Compliant',
    }
    return <Badge className={colors[status]}>{labels[status]}</Badge>
  }

  const getLabWorkTypeLabel = (type: LabWork['workType']) => {
    const labels: Record<LabWork['workType'], string> = {
      crown: 'Crown',
      bridge: 'Bridge',
      denture: 'Denture',
      implant: 'Implant',
      orthodontic: 'Orthodontic',
      other: 'Other',
    }
    return labels[type]
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
              <Smile className="h-5 w-5 text-[#00897B]" />
              Dental Practice Management
            </h1>
            <p className="text-sm text-[#757575]">HPCSA compliant dental practice operations for South Africa</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-mono font-bold">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              <p className="text-xs text-[#757575]">{currentTime.toLocaleDateString()}</p>
            </div>

            {/* HPCSA Status */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              stats.hpcsaExpiring === 0 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}>
              <ShieldCheck className="h-5 w-5" />
              <div>
                <span className="font-medium">HPCSA</span>
                <p className="text-xs">{stats.hpcsaCompliant}/{hpcsaRecords.length} Active</p>
              </div>
            </div>

            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-8 gap-3">
          <div className="bg-[#E0F2F1] rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-[#00897B]">{stats.todayAppointments}</p>
            <p className="text-[10px] text-[#757575]">Today's Patients</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-blue-600">{stats.pendingLabWork}</p>
            <p className="text-[10px] text-[#757575]">Lab Work Pending</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-green-600">{stats.readyLabWork}</p>
            <p className="text-[10px] text-[#757575]">Ready to Fit</p>
          </div>
          <div className="bg-red-50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-red-600">{formatCurrency(stats.outstandingAccounts)}</p>
            <p className="text-[10px] text-[#757575]">Outstanding</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-purple-600">{stats.activeTreatmentPlans}</p>
            <p className="text-[10px] text-[#757575]">Active Plans</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-amber-600">{stats.cpdAtRisk}</p>
            <p className="text-[10px] text-[#757575]">CPD At Risk</p>
          </div>
          <div className="bg-cyan-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-cyan-600">{stats.radiationCompliant}/{radiationSafety.length}</p>
            <p className="text-[10px] text-[#757575]">X-Ray Compliance</p>
          </div>
          <div className="bg-teal-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-teal-600">{stats.activeInsurance}</p>
            <p className="text-[10px] text-[#757575]">Active PI</p>
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
              <TabsTrigger value="appointments" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Calendar className="h-4 w-4 mr-1" />Appointments
              </TabsTrigger>
              <TabsTrigger value="treatment" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Activity className="h-4 w-4 mr-1" />Treatment Plans
              </TabsTrigger>
              <TabsTrigger value="labwork" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Beaker className="h-4 w-4 mr-1" />Lab Work
              </TabsTrigger>
              <TabsTrigger value="hpcsa" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <ShieldCheck className="h-4 w-4 mr-1" />HPCSA & CPD
              </TabsTrigger>
              <TabsTrigger value="billing" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <CreditCard className="h-4 w-4 mr-1" />Billing
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 p-4">
            {/* Overview Tab */}
            <TabsContent value="overview" className="m-0">
              <div className="grid grid-cols-2 gap-4">
                {/* Today's Appointments */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-[#00897B]" />
                      Today's Appointments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {appointments.filter(a => 
                        new Date(a.scheduledTime).toDateString() === new Date().toDateString()
                      ).map(apt => (
                        <div key={apt.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-12 rounded-full ${
                              apt.status === 'in_progress' ? 'bg-green-500' :
                              apt.status === 'completed' ? 'bg-gray-400' :
                              apt.status === 'cancelled' ? 'bg-red-400' : 'bg-blue-500'
                            }`} />
                            <div>
                              <p className="font-medium text-sm">{apt.patientName}</p>
                              <p className="text-xs text-[#757575]">
                                {new Date(apt.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {apt.treatmentType}
                              </p>
                              {apt.toothNumbers.length > 0 && (
                                <p className="text-xs text-[#757575]">Teeth: {apt.toothNumbers.join(', ')}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {apt.medicalAid && (
                              <Badge variant="outline" className="text-xs">{apt.medicalAidName}</Badge>
                            )}
                            {getAppointmentStatusBadge(apt.status)}
                          </div>
                        </div>
                      ))}
                      {stats.todayAppointments === 0 && (
                        <p className="text-center text-sm text-[#757575] py-4">No appointments today</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Lab Work Ready */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Beaker className="h-5 w-5 text-[#00897B]" />
                      Lab Work Ready for Fitting
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {labWork.filter(l => l.status === 'ready').map(lab => (
                        <div key={lab.id} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{lab.patientName}</p>
                            <p className="text-xs text-[#757575]">{getLabWorkTypeLabel(lab.workType)} - Teeth: {lab.toothNumbers.join(', ')}</p>
                            <p className="text-xs text-[#757575]">Lab: {lab.labName}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-100 text-green-700">Ready</Badge>
                            <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C]">Schedule</Button>
                          </div>
                        </div>
                      ))}
                      {stats.readyLabWork === 0 && (
                        <p className="text-center text-sm text-[#757575] py-4">No lab work ready</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Outstanding Accounts */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-[#00897B]" />
                      Outstanding Accounts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {patients.filter(p => p.outstandingBalance > 0).map(patient => (
                        <div key={patient.id} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{patient.firstName} {patient.lastName}</p>
                            <p className="text-xs text-[#757575]">{patient.dentalRecordNumber}</p>
                            <p className="text-xs text-[#757575]">Last visit: {patient.lastVisit}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-red-600">{formatCurrency(patient.outstandingBalance)}</p>
                            <Button size="sm" variant="outline" className="mt-1">Invoice</Button>
                          </div>
                        </div>
                      ))}
                      {stats.outstandingAccounts === 0 && (
                        <p className="text-center text-sm text-[#757575] py-4">No outstanding accounts</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* HPCSA & CPD Status */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-[#00897B]" />
                      Compliance Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* HPCSA Status */}
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <BadgeCheck className={`h-4 w-4 ${stats.hpcsaExpiring === 0 ? 'text-green-600' : 'text-amber-600'}`} />
                            <span className="text-sm font-medium">HPCSA Registration</span>
                          </div>
                          <Badge className={stats.hpcsaExpiring === 0 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                            {stats.hpcsaCompliant}/{hpcsaRecords.length} Active
                          </Badge>
                        </div>
                      </div>

                      {/* CPD Status */}
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <BookOpen className={`h-4 w-4 ${stats.cpdAtRisk === 0 ? 'text-green-600' : 'text-amber-600'}`} />
                            <span className="text-sm font-medium">CPD Points (60/cycle)</span>
                          </div>
                          <Badge className={stats.cpdAtRisk === 0 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                            {stats.cpdCompliant}/{cpdRecords.length} Compliant
                          </Badge>
                        </div>
                      </div>

                      {/* Radiation Safety */}
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Radiation className="h-4 w-4 text-cyan-600" />
                            <span className="text-sm font-medium">Radiation Safety</span>
                          </div>
                          <Badge className={stats.radiationCompliant === radiationSafety.length ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                            {stats.radiationCompliant}/{radiationSafety.length} Compliant
                          </Badge>
                        </div>
                      </div>

                      {/* PI Insurance */}
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className={`h-4 w-4 ${stats.activeInsurance > 0 ? 'text-green-600' : 'text-red-600'}`} />
                            <span className="text-sm font-medium">Professional Indemnity</span>
                          </div>
                          <Badge className={stats.activeInsurance > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                            {stats.activeInsurance} Active
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Appointments Tab */}
            <TabsContent value="appointments" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Today's Appointments</h2>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />Export
                  </Button>
                  <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setAppointmentDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />New Appointment
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {appointments.map(apt => (
                  <Card key={apt.id} className={
                    apt.status === 'cancelled' ? 'border-red-300 opacity-70' :
                    apt.status === 'in_progress' ? 'border-green-300' : ''
                  }>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg ${
                            apt.status === 'in_progress' ? 'bg-green-100' :
                            apt.status === 'completed' ? 'bg-gray-100' :
                            apt.status === 'cancelled' ? 'bg-red-100' : 'bg-blue-100'
                          }`}>
                            {apt.status === 'in_progress' ? (
                              <Timer className="h-5 w-5 text-green-600" />
                            ) : apt.status === 'completed' ? (
                              <CheckCircle2 className="h-5 w-5 text-gray-600" />
                            ) : apt.status === 'cancelled' ? (
                              <XCircle className="h-5 w-5 text-red-600" />
                            ) : (
                              <Clock className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold">{apt.patientName}</p>
                              <Badge variant="outline" className="text-xs">{apt.dentalRecordNumber}</Badge>
                              {getPhaseBadge(apt.phase)}
                            </div>
                            <p className="text-sm text-[#757575]">{apt.treatmentType}</p>
                            {apt.toothNumbers.length > 0 && (
                              <p className="text-sm text-[#757575]">Teeth: {apt.toothNumbers.join(', ')} (FDI)</p>
                            )}
                            <p className="text-sm text-[#757575]">Dentist: {apt.dentistName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {getAppointmentStatusBadge(apt.status)}
                          <p className="text-sm font-medium mt-2">
                            {new Date(apt.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="text-xs text-[#757575]">{apt.duration} min</p>
                          <div className="mt-2">
                            {apt.medicalAid ? (
                              <Badge className="bg-purple-100 text-purple-700">{apt.medicalAidName}</Badge>
                            ) : (
                              <Badge variant="outline">Private</Badge>
                            )}
                          </div>
                          {apt.status === 'scheduled' && (
                            <Button size="sm" className="mt-2 bg-[#00897B] hover:bg-[#00695C]">Start</Button>
                          )}
                          {apt.status === 'in_progress' && (
                            <Button size="sm" className="mt-2 bg-green-600 hover:bg-green-700">Complete</Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Treatment Plans Tab */}
            <TabsContent value="treatment" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Active Treatment Plans</h2>
                <Button variant="outline">
                  <Search className="h-4 w-4 mr-2" />Search Plans
                </Button>
              </div>

              <div className="space-y-3">
                {treatmentPlans.map(plan => (
                  <Card key={plan.id} className={plan.status === 'active' ? '' : 'opacity-70'}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg ${
                            plan.status === 'active' ? 'bg-green-100' :
                            plan.status === 'completed' ? 'bg-gray-100' : 'bg-amber-100'
                          }`}>
                            <Activity className={`h-5 w-5 ${
                              plan.status === 'active' ? 'text-green-600' :
                              plan.status === 'completed' ? 'text-gray-600' : 'text-amber-600'
                            }`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold">{plan.patientName}</p>
                              <Badge className={
                                plan.status === 'active' ? 'bg-green-100 text-green-700' :
                                plan.status === 'completed' ? 'bg-gray-100 text-gray-700' : 'bg-amber-100 text-amber-700'
                              }>
                                {plan.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-[#757575]">{plan.diagnosis}</p>
                            <p className="text-xs text-[#757575]">ICD-10 DA: {plan.icd10Code}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-[#00897B]">{formatCurrency(plan.totalEstimate)}</p>
                          <p className="text-xs text-[#757575]">Total Estimate</p>
                        </div>
                      </div>

                      <div className="border-t pt-3">
                        <p className="text-xs font-medium text-[#757575] mb-2">Treatment Phases</p>
                        <div className="grid grid-cols-2 gap-2">
                          {plan.phases.map(phase => (
                            <div key={phase.id} className={`p-3 rounded-lg ${
                              phase.status === 'completed' ? 'bg-gray-50' :
                              phase.status === 'in_progress' ? 'bg-green-50' : 'bg-blue-50'
                            }`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Phase {phase.phaseNumber}: {phase.description}</span>
                                <Badge className={
                                  phase.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                                  phase.status === 'in_progress' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                }>
                                  {phase.status}
                                </Badge>
                              </div>
                              {phase.toothNumbers.length > 0 && (
                                <p className="text-xs text-[#757575]">Teeth: {phase.toothNumbers.join(', ')}</p>
                              )}
                              <div className="mt-2 space-y-1">
                                {phase.procedures.map(proc => (
                                  <div key={proc.id} className="flex items-center justify-between text-xs">
                                    <span className="text-[#757575]">{proc.code} - {proc.description}</span>
                                    <span className="font-medium">{formatCurrency(proc.total)}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="flex items-center justify-between mt-2 pt-2 border-t">
                                <span className="text-xs font-medium">Phase Total</span>
                                <span className="text-sm font-bold text-[#00897B]">{formatCurrency(phase.estimate)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Lab Work Tab */}
            <TabsContent value="labwork" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Lab Work Tracking</h2>
                <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setLabWorkDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />New Lab Order
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{labWork.filter(l => l.status === 'ordered').length}</p>
                  <p className="text-xs text-[#757575]">Ordered</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{labWork.filter(l => l.status === 'in_progress').length}</p>
                  <p className="text-xs text-[#757575]">In Progress</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{labWork.filter(l => l.status === 'ready').length}</p>
                  <p className="text-xs text-[#757575]">Ready</p>
                </div>
              </div>

              <div className="space-y-3">
                {labWork.map(lab => (
                  <Card key={lab.id} className={
                    lab.status === 'ready' ? 'border-green-300' :
                    lab.status === 'ordered' ? 'border-blue-300' : ''
                  }>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg ${
                            lab.status === 'ready' ? 'bg-green-100' :
                            lab.status === 'in_progress' ? 'bg-yellow-100' :
                            lab.status === 'ordered' ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            <Beaker className={`h-5 w-5 ${
                              lab.status === 'ready' ? 'text-green-600' :
                              lab.status === 'in_progress' ? 'text-yellow-600' :
                              lab.status === 'ordered' ? 'text-blue-600' : 'text-gray-600'
                            }`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold">{lab.patientName}</p>
                              <Badge variant="outline">{getLabWorkTypeLabel(lab.workType)}</Badge>
                            </div>
                            <p className="text-sm text-[#757575]">Teeth: {lab.toothNumbers.join(', ')} (FDI)</p>
                            <p className="text-sm text-[#757575]">Lab: {lab.labName}</p>
                            {lab.shade && (
                              <p className="text-sm text-[#757575]">Shade: {lab.shade}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          {getLabWorkStatusBadge(lab.status)}
                          <p className="text-sm font-medium mt-2">Cost: {formatCurrency(lab.cost)}</p>
                          <div className="mt-2 text-xs text-[#757575]">
                            <p>Ordered: {lab.orderDate}</p>
                            <p>Expected: {lab.expectedDate}</p>
                          </div>
                          {lab.status === 'ready' && (
                            <Button size="sm" className="mt-2 bg-[#00897B] hover:bg-[#00695C]">Schedule Fitting</Button>
                          )}
                          {lab.status === 'ordered' && (
                            <Button size="sm" variant="outline" className="mt-2">Track</Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* HPCSA & CPD Tab */}
            <TabsContent value="hpcsa" className="m-0">
              <div className="grid grid-cols-2 gap-4">
                {/* HPCSA Registration */}
                <Card className="col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-[#00897B]" />
                      HPCSA Registration Tracking
                    </CardTitle>
                    <CardDescription>Health Professions Council of South Africa registration status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {hpcsaRecords.map(record => (
                        <div key={record.id} className={`p-3 rounded-lg ${
                          record.status === 'active' ? 'bg-green-50' :
                          record.status === 'pending_renewal' ? 'bg-amber-50' : 'bg-red-50'
                        }`}>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${
                                record.status === 'active' ? 'bg-green-100' :
                                record.status === 'pending_renewal' ? 'bg-amber-100' : 'bg-red-100'
                              }`}>
                                <BadgeCheck className={`h-5 w-5 ${
                                  record.status === 'active' ? 'text-green-600' :
                                  record.status === 'pending_renewal' ? 'text-amber-600' : 'text-red-600'
                                }`} />
                              </div>
                              <div>
                                <p className="font-bold">{record.practitionerName}</p>
                                <p className="text-sm text-[#757575]">{record.registrationType}</p>
                                <p className="text-sm text-[#757575]">DT Number: {record.hpcsaNumber}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className={
                                record.status === 'active' ? 'bg-green-100 text-green-700' :
                                record.status === 'pending_renewal' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                              }>
                                {record.status === 'active' ? 'Active' : record.status === 'pending_renewal' ? 'Pending Renewal' : 'Expired'}
                              </Badge>
                              <p className="text-xs text-[#757575] mt-2">Registration Expiry</p>
                              <p className="font-medium">{record.expiryDate}</p>
                              <p className="text-xs text-[#757575] mt-1">Practice Card: {record.practiceCardExpiry}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* CPD Tracking */}
                <Card className="col-span-2">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-[#00897B]" />
                          CPD Points Tracking
                        </CardTitle>
                        <CardDescription>60 points required per 2-year cycle (HPCSA requirement)</CardDescription>
                      </div>
                      <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setCpdDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />Add Activity
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {cpdRecords.map(record => (
                        <div key={record.id} className={`p-4 rounded-lg ${
                          record.status === 'compliant' ? 'bg-green-50' :
                          record.status === 'at_risk' ? 'bg-amber-50' : 'bg-red-50'
                        }`}>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${
                                record.status === 'compliant' ? 'bg-green-100' :
                                record.status === 'at_risk' ? 'bg-amber-100' : 'bg-red-100'
                              }`}>
                                <Award className={`h-5 w-5 ${
                                  record.status === 'compliant' ? 'text-green-600' :
                                  record.status === 'at_risk' ? 'text-amber-600' : 'text-red-600'
                                }`} />
                              </div>
                              <div>
                                <p className="font-bold">{record.staffName}</p>
                                <p className="text-sm text-[#757575]">HPCSA: {record.hpcsaNumber}</p>
                                <p className="text-xs text-[#757575]">Cycle: {record.cycleStart} - {record.cycleEnd}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold">{record.earnedPoints}</span>
                                <span className="text-[#757575]">/ {record.requiredPoints}</span>
                              </div>
                              <Progress value={(record.earnedPoints / record.requiredPoints) * 100} className="h-2 w-24 mt-1" />
                              {getCPDStatusBadge(record.status)}
                            </div>
                          </div>

                          <div className="border-t pt-3">
                            <p className="text-xs font-medium text-[#757575] mb-2">Recent Activities</p>
                            <div className="grid grid-cols-2 gap-2">
                              {record.activities.slice(0, 4).map(activity => (
                                <div key={activity.id} className="flex items-center justify-between p-2 bg-white rounded">
                                  <div>
                                    <p className="text-sm font-medium">{activity.title}</p>
                                    <p className="text-xs text-[#757575]">{activity.type} | {activity.category} | {activity.date}</p>
                                  </div>
                                  <Badge variant="outline" className="text-[#00897B]">+{activity.points}</Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Radiation Safety */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Radiation className="h-5 w-5 text-[#00897B]" />
                      Radiation Safety
                    </CardTitle>
                    <CardDescription>X-ray equipment compliance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {radiationSafety.map(rad => (
                        <div key={rad.id} className={`p-3 rounded-lg ${
                          rad.status === 'compliant' ? 'bg-green-50' : 'bg-amber-50'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{rad.equipmentType}</p>
                              <p className="text-xs text-[#757575]">S/N: {rad.serialNumber}</p>
                              <p className="text-xs text-[#757575]">Licence: {rad.licenceNumber}</p>
                            </div>
                            <Badge className={
                              rad.status === 'compliant' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                            }>
                              {rad.status}
                            </Badge>
                          </div>
                          <div className="mt-2 text-xs text-[#757575]">
                            <p>Next Inspection: {rad.nextInspection}</p>
                            <p>Licence Expiry: {rad.licenceExpiry}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Professional Indemnity */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-[#00897B]" />
                      Professional Indemnity
                    </CardTitle>
                    <CardDescription>Insurance coverage</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {indemnityInsurance.map(policy => (
                        <div key={policy.id} className={`p-3 rounded-lg ${
                          policy.status === 'active' ? 'bg-green-50' : 'bg-red-50'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{policy.provider}</p>
                              <p className="text-xs text-[#757575]">Policy: {policy.policyNumber}</p>
                              <p className="text-sm font-medium text-[#00897B]">
                                Coverage: {formatCurrency(policy.coverageAmount)}
                              </p>
                            </div>
                            <Badge className={
                              policy.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }>
                              {policy.status}
                            </Badge>
                          </div>
                          <p className="mt-2 text-xs text-[#757575]">
                            Period: {policy.startDate} - {policy.endDate}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Billing Tab */}
            <TabsContent value="billing" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Medical Aid Billing & Accounts</h2>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />Export Claims
                  </Button>
                  <Button className="bg-[#00897B] hover:bg-[#00695C]">
                    <Plus className="h-4 w-4 mr-2" />New Claim
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-purple-600">
                    {patients.filter(p => p.medicalAid !== null).length}
                  </p>
                  <p className="text-xs text-[#757575]">Medical Aid Patients</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-green-600">
                    {patients.filter(p => p.medicalAid?.status === 'active').length}
                  </p>
                  <p className="text-xs text-[#757575]">Active Memberships</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-red-600">{formatCurrency(stats.outstandingAccounts)}</p>
                  <p className="text-xs text-[#757575]">Total Outstanding</p>
                </div>
              </div>

              <div className="space-y-3">
                {patients.filter(p => p.medicalAid !== null || p.outstandingBalance > 0).map(patient => (
                  <Card key={patient.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg ${
                            patient.outstandingBalance > 0 ? 'bg-red-100' : 'bg-green-100'
                          }`}>
                            <CreditCard className={`h-5 w-5 ${
                              patient.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'
                            }`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold">{patient.firstName} {patient.lastName}</p>
                              <Badge variant="outline" className="text-xs">{patient.dentalRecordNumber}</Badge>
                            </div>
                            {patient.medicalAid ? (
                              <>
                                <p className="text-sm text-[#757575]">
                                  {patient.medicalAid.provider} - {patient.medicalAid.planName}
                                </p>
                                <p className="text-xs text-[#757575]">
                                  Membership: {patient.medicalAid.membershipNumber} (Dep: {patient.medicalAid.dependantCode})
                                </p>
                                <Badge className={`mt-1 ${
                                  patient.medicalAid.status === 'active' ? 'bg-green-100 text-green-700' :
                                  patient.medicalAid.status === 'pending_auth' ? 'bg-amber-100 text-amber-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {patient.medicalAid.status === 'active' ? 'Active' :
                                   patient.medicalAid.status === 'pending_auth' ? 'Auth Pending' : patient.medicalAid.status}
                                </Badge>
                              </>
                            ) : (
                              <Badge variant="outline" className="mt-1">Private Patient</Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-[#757575]">Outstanding Balance</p>
                          <p className={`text-lg font-bold ${patient.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(patient.outstandingBalance)}
                          </p>
                          <p className="text-xs text-[#757575] mt-1">Last visit: {patient.lastVisit}</p>
                          <div className="flex gap-2 mt-2">
                            <Button size="sm" variant="outline">Invoice</Button>
                            {patient.medicalAid && (
                              <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C]">Claim</Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* SADA Tariff Reference */}
              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-5 w-5 text-[#00897B]" />
                    SADA Dental Tariff Codes Reference
                  </CardTitle>
                  <CardDescription>South African Dental Association tariff codes (ICD-10 DA for dentistry)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="font-medium">8101</p>
                      <p className="text-[#757575]">Root canal - molar</p>
                      <p className="font-bold text-[#00897B]">R2,800</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="font-medium">7210</p>
                      <p className="text-[#757575]">PFM Crown</p>
                      <p className="font-bold text-[#00897B]">R4,850</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="font-medium">8301</p>
                      <p className="text-[#757575]">Permanent filling</p>
                      <p className="font-bold text-[#00897B]">R850</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="font-medium">7100</p>
                      <p className="text-[#757575]">Crown prep</p>
                      <p className="font-bold text-[#00897B]">R350</p>
                    </div>
                  </div>
                  <p className="text-xs text-[#757575] mt-2">
                    Tooth numbering: FDI system (e.g., 36 = lower left first molar)
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  )
}
