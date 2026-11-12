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
  CreditCard,
  Building2,
  ShieldCheck,
  Award,
  BookOpen,
  AlertTriangle,
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
  BadgeCheck,
  Loader2,
  Heart,
  Activity,
  DollarSign,
  Send,
  ClipboardList,
  UserCheck,
  FileWarning,
  Syringe,
  Pill,
  Receipt,
  Building,
  ArrowUpRight,
  ArrowDownRight,
  Timer,
} from 'lucide-react'

// Types
type AppointmentStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
type ClaimStatus = 'pending' | 'submitted' | 'approved' | 'rejected' | 'paid'
type MedicalAidProvider = 'discovery' | 'gems' | 'bonitas' | 'medshield' | 'momentum' | 'fedhealth' | 'other'
type ConsultationType = 'consultation' | 'follow_up' | 'procedure' | 'emergency' | 'chronic' | 'pmb'
type HPCSAStatus = 'active' | 'pending_renewal' | 'expired' | 'suspended'

interface Patient {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string
  idNumber: string
  medicalRecordNumber: string
  contactNumber: string
  email?: string
  medicalAid?: {
    provider: MedicalAidProvider
    membershipNumber: string
    dependentCode: string
    planName: string
  }
  chronicConditions?: string[]
  allergies?: string[]
  lastVisit?: string
}

interface Appointment {
  id: string
  patientId: string
  patient: Patient
  date: string
  time: string
  duration: number
  consultationType: ConsultationType
  status: AppointmentStatus
  notes?: string
  icd10Codes?: string[]
  tariffCode?: string
  amount: number
  isPMB: boolean
}

interface MedicalAidClaim {
  id: string
  claimNumber: string
  patientId: string
  patient: Patient
  appointmentId: string
  icd10Codes: string[]
  tariffCodes: string[]
  totalAmount: number
  medicalAid: {
    provider: MedicalAidProvider
    membershipNumber: string
  }
  status: ClaimStatus
  submittedDate?: string
  processedDate?: string
  paidAmount?: number
  rejectionReason?: string
  createdAt: string
}

interface HPCSADetails {
  id: string
  practiceNumber: string
  mpNumber: string
  practitionerName: string
  registrationDate: string
  expiryDate: string
  status: HPCSAStatus
  categories: string[]
  annualCardRenewalDue: string
}

interface CPDRecord {
  id: string
  practitionerId: string
  year: number
  totalPoints: number
  requiredPoints: number
  ethicsPoints: number
  activities: CPDActivity[]
}

interface CPDActivity {
  id: string
  title: string
  type: 'course' | 'seminar' | 'workshop' | 'publication' | 'presentation' | 'online'
  points: number
  ethicsPoints: number
  date: string
  provider: string
  certificateUrl?: string
}

interface ProfessionalIndemnity {
  id: string
  provider: string
  policyNumber: string
  coverageAmount: number
  startDate: string
  endDate: string
  status: 'active' | 'expired' | 'pending_renewal'
  certificateUrl?: string
}

interface DispensingRecord {
  id: string
  patientId: string
  patient: Patient
  date: string
  items: DispensingItem[]
  section56LicenseNumber?: string
  totalAmount: number
}

interface DispensingItem {
  id: string
  productName: string
  nappiCode: string
  quantity: number
  dosage: string
  frequency: string
  price: number
  schedule: number
}

// South African Medical Aid Providers
const MEDICAL_AID_PROVIDERS: { value: MedicalAidProvider; label: string }[] = [
  { value: 'discovery', label: 'Discovery Health' },
  { value: 'gems', label: 'GEMS' },
  { value: 'bonitas', label: 'Bonitas' },
  { value: 'medshield', label: 'Medshield' },
  { value: 'momentum', label: 'Momentum Health' },
  { value: 'fedhealth', label: 'Fedhealth' },
  { value: 'other', label: 'Other' },
]

// Consultation Types
const CONSULTATION_TYPES: { value: ConsultationType; label: string }[] = [
  { value: 'consultation', label: 'Consultation' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'procedure', label: 'Procedure' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'chronic', label: 'Chronic Management' },
  { value: 'pmb', label: 'PMB Condition' },
]

export function MedicalPracticeView() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Data states
  const [patients, setPatients] = useState<Patient[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [claims, setClaims] = useState<MedicalAidClaim[]>([])
  const [hpcsaDetails, setHpcsaDetails] = useState<HPCSADetails | null>(null)
  const [cpdRecord, setCpdRecord] = useState<CPDRecord | null>(null)
  const [indemnityInsurance, setIndemnityInsurance] = useState<ProfessionalIndemnity[]>([])
  const [dispensingRecords, setDispensingRecords] = useState<DispensingRecord[]>([])

  // Dialog states
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false)
  const [claimDialogOpen, setClaimDialogOpen] = useState(false)
  const [patientDialogOpen, setPatientDialogOpen] = useState(false)

  // Update time
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Mock data
  useEffect(() => {
    const timer = setTimeout(() => {
      const mockPatients: Patient[] = [
        {
          id: '1',
          firstName: 'Thandi',
          lastName: 'Dlamini',
          dateOfBirth: '1985-03-15',
          idNumber: '8503150580084',
          medicalRecordNumber: 'MRN-2026-001',
          contactNumber: '082-123-4567',
          email: 'thandi.dlamini@email.co.za',
          medicalAid: {
            provider: 'discovery',
            membershipNumber: 'DH-123456789',
            dependentCode: '00',
            planName: 'KeyCare Plus',
          },
          chronicConditions: ['Hypertension', 'Type 2 Diabetes'],
          allergies: ['Penicillin'],
          lastVisit: '2026-01-20',
        },
        {
          id: '2',
          firstName: 'Sipho',
          lastName: 'Ndaba',
          dateOfBirth: '1978-07-22',
          idNumber: '7807225678091',
          medicalRecordNumber: 'MRN-2026-002',
          contactNumber: '083-234-5678',
          medicalAid: {
            provider: 'gems',
            membershipNumber: 'GEMS-987654321',
            dependentCode: '00',
            planName: 'Sapphire',
          },
          lastVisit: '2026-02-05',
        },
        {
          id: '3',
          firstName: 'Maria',
          lastName: 'Santos',
          dateOfBirth: '1990-11-08',
          idNumber: '9011080123456',
          medicalRecordNumber: 'MRN-2026-003',
          contactNumber: '084-345-6789',
          email: 'maria.santos@email.co.za',
          medicalAid: {
            provider: 'bonitas',
            membershipNumber: 'BON-456789123',
            dependentCode: '01',
            planName: 'BonClassic',
          },
          allergies: ['Sulfa drugs'],
          lastVisit: '2026-02-10',
        },
      ]
      setPatients(mockPatients)

      const mockAppointments: Appointment[] = [
        {
          id: '1',
          patientId: '1',
          patient: mockPatients[0],
          date: new Date().toISOString().split('T')[0],
          time: '09:00',
          duration: 30,
          consultationType: 'follow_up',
          status: 'scheduled',
          icd10Codes: ['I10', 'E11.9'],
          tariffCode: '0190',
          amount: 520,
          isPMB: true,
        },
        {
          id: '2',
          patientId: '2',
          patient: mockPatients[1],
          date: new Date().toISOString().split('T')[0],
          time: '10:00',
          duration: 45,
          consultationType: 'consultation',
          status: 'in_progress',
          notes: 'New patient consultation',
          tariffCode: '0180',
          amount: 680,
          isPMB: false,
        },
        {
          id: '3',
          patientId: '3',
          patient: mockPatients[2],
          date: new Date().toISOString().split('T')[0],
          time: '11:30',
          duration: 30,
          consultationType: 'chronic',
          status: 'scheduled',
          icd10Codes: ['J45.9'],
          tariffCode: '0190',
          amount: 520,
          isPMB: false,
        },
        {
          id: '4',
          patientId: '1',
          patient: mockPatients[0],
          date: new Date().toISOString().split('T')[0],
          time: '14:00',
          duration: 15,
          consultationType: 'pmb',
          status: 'scheduled',
          icd10Codes: ['I10'],
          tariffCode: '0191',
          amount: 420,
          isPMB: true,
        },
      ]
      setAppointments(mockAppointments)

      const mockClaims: MedicalAidClaim[] = [
        {
          id: '1',
          claimNumber: 'CLM-2026-001',
          patientId: '1',
          patient: mockPatients[0],
          appointmentId: 'prev-1',
          icd10Codes: ['I10', 'E11.9'],
          tariffCodes: ['0190'],
          totalAmount: 520,
          medicalAid: {
            provider: 'discovery',
            membershipNumber: 'DH-123456789',
          },
          status: 'submitted',
          submittedDate: '2026-02-12',
          createdAt: '2026-02-12',
        },
        {
          id: '2',
          claimNumber: 'CLM-2026-002',
          patientId: '2',
          patient: mockPatients[1],
          appointmentId: 'prev-2',
          icd10Codes: ['M54.5'],
          tariffCodes: ['0180', '1310'],
          totalAmount: 1250,
          medicalAid: {
            provider: 'gems',
            membershipNumber: 'GEMS-987654321',
          },
          status: 'pending',
          createdAt: '2026-02-14',
        },
        {
          id: '3',
          claimNumber: 'CLM-2026-003',
          patientId: '3',
          patient: mockPatients[2],
          appointmentId: 'prev-3',
          icd10Codes: ['J45.9'],
          tariffCodes: ['0190'],
          totalAmount: 520,
          medicalAid: {
            provider: 'bonitas',
            membershipNumber: 'BON-456789123',
          },
          status: 'paid',
          submittedDate: '2026-02-01',
          processedDate: '2026-02-08',
          paidAmount: 468,
          createdAt: '2026-02-01',
        },
        {
          id: '4',
          claimNumber: 'CLM-2026-004',
          patientId: '1',
          patient: mockPatients[0],
          appointmentId: 'prev-4',
          icd10Codes: ['K21.0'],
          tariffCodes: ['0190', '4201'],
          totalAmount: 850,
          medicalAid: {
            provider: 'discovery',
            membershipNumber: 'DH-123456789',
          },
          status: 'rejected',
          rejectionReason: 'Pre-authorization required for procedure code 4201',
          submittedDate: '2026-02-05',
          createdAt: '2026-02-05',
        },
      ]
      setClaims(mockClaims)

      setHpcsaDetails({
        id: '1',
        practiceNumber: '0123456',
        mpNumber: 'MP-0123456',
        practitionerName: 'Dr. Nomsa Khumalo',
        registrationDate: '2015-06-15',
        expiryDate: '2026-12-31',
        status: 'active',
        categories: ['Medical Practitioner', 'General Practice'],
        annualCardRenewalDue: '2026-11-30',
      })

      setCpdRecord({
        id: '1',
        practitionerId: '1',
        year: 2026,
        totalPoints: 42,
        requiredPoints: 60,
        ethicsPoints: 8,
        activities: [
          { id: '1', title: 'Diabetes Management Update 2026', type: 'course', points: 10, ethicsPoints: 0, date: '2026-01-15', provider: 'HPCSA CPD Portal' },
          { id: '2', title: 'Medical Ethics in Practice', type: 'seminar', points: 8, ethicsPoints: 8, date: '2026-02-01', provider: 'SAMA' },
          { id: '3', title: 'Hypertension Treatment Guidelines', type: 'online', points: 12, ethicsPoints: 0, date: '2026-02-10', provider: 'Discovery Health CPD' },
          { id: '4', title: 'Patient Communication Skills', type: 'workshop', points: 12, ethicsPoints: 0, date: '2026-02-12', provider: 'Medical Practice SA' },
        ],
      })

      setIndemnityInsurance([
        {
          id: '1',
          provider: 'MPS (Medical Protection Society)',
          policyNumber: 'MPS-2026-123456',
          coverageAmount: 5000000,
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          status: 'active',
        },
      ])

      setDispensingRecords([
        {
          id: '1',
          patientId: '1',
          patient: mockPatients[0],
          date: '2026-02-14',
          items: [
            { id: '1', productName: 'Amlodipine 5mg', nappiCode: 'NAP-123456', quantity: 30, dosage: '5mg', frequency: 'Once daily', price: 85, schedule: 3 },
            { id: '2', productName: 'Metformin 500mg', nappiCode: 'NAP-789012', quantity: 60, dosage: '500mg', frequency: 'Twice daily', price: 120, schedule: 3 },
          ],
          section56LicenseNumber: 'S56-2026-001',
          totalAmount: 205,
        },
      ])

      setLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // Stats
  const stats = {
    todaysAppointments: appointments.filter(a => a.date === new Date().toISOString().split('T')[0]).length,
    completedToday: appointments.filter(a => a.status === 'completed').length,
    pendingClaims: claims.filter(c => c.status === 'pending').length,
    submittedClaims: claims.filter(c => c.status === 'submitted').length,
    outstandingClaimsValue: claims.filter(c => c.status === 'submitted' || c.status === 'pending').reduce((sum, c) => sum + c.totalAmount, 0),
    rejectedClaims: claims.filter(c => c.status === 'rejected').length,
    medicalAidDebtors: 42500,
    hpcsaActive: hpcsaDetails?.status === 'active',
    cpdProgress: cpdRecord ? (cpdRecord.totalPoints / cpdRecord.requiredPoints) * 100 : 0,
    cpdEthicsProgress: cpdRecord ? (cpdRecord.ethicsPoints / 10) * 100 : 0, // 10 ethics points required
    nextAppointment: appointments.find(a => a.status === 'scheduled'),
  }

  const formatCurrency = (amount: number) => {
    return `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`
  }

  const getMedicalAidBadge = (provider: MedicalAidProvider) => {
    const colors: Record<MedicalAidProvider, string> = {
      discovery: 'bg-blue-100 text-blue-700',
      gems: 'bg-green-100 text-green-700',
      bonitas: 'bg-purple-100 text-purple-700',
      medshield: 'bg-orange-100 text-orange-700',
      momentum: 'bg-red-100 text-red-700',
      fedhealth: 'bg-teal-100 text-teal-700',
      other: 'bg-gray-100 text-gray-700',
    }
    const providerData = MEDICAL_AID_PROVIDERS.find(p => p.value === provider)
    return <Badge className={colors[provider]}>{providerData?.label || provider}</Badge>
  }

  const getConsultationTypeBadge = (type: ConsultationType) => {
    const colors: Record<ConsultationType, string> = {
      consultation: 'bg-blue-50 text-blue-700',
      follow_up: 'bg-green-50 text-green-700',
      procedure: 'bg-purple-50 text-purple-700',
      emergency: 'bg-red-50 text-red-700',
      chronic: 'bg-orange-50 text-orange-700',
      pmb: 'bg-teal-50 text-teal-700',
    }
    const typeData = CONSULTATION_TYPES.find(t => t.value === type)
    return <Badge className={colors[type]}>{typeData?.label || type}</Badge>
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-700',
      in_progress: 'bg-green-100 text-green-700',
      completed: 'bg-gray-100 text-gray-700',
      cancelled: 'bg-red-100 text-red-700',
      no_show: 'bg-orange-100 text-orange-700',
      pending: 'bg-yellow-100 text-yellow-700',
      submitted: 'bg-blue-100 text-blue-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      paid: 'bg-green-100 text-green-700',
      active: 'bg-green-100 text-green-700',
      expired: 'bg-red-100 text-red-700',
      pending_renewal: 'bg-yellow-100 text-yellow-700',
    }
    return <Badge className={colors[status] || 'bg-gray-100 text-gray-700'}>{status.replace('_', ' ')}</Badge>
  }

  const getHPCSAStatusBadge = (status: HPCSAStatus) => {
    const colors: Record<HPCSAStatus, string> = {
      active: 'bg-green-100 text-green-700',
      pending_renewal: 'bg-yellow-100 text-yellow-700',
      expired: 'bg-red-100 text-red-700',
      suspended: 'bg-red-100 text-red-700',
    }
    return <Badge className={colors[status]}>{status.replace('_', ' ')}</Badge>
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
              <Stethoscope className="h-5 w-5 text-[#00897B]" />
              Medical Practice Management
            </h1>
            <p className="text-sm text-[#757575]">HPCSA compliant practice management for South African healthcare providers</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-mono font-bold">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              <p className="text-xs text-[#757575]">{currentTime.toLocaleDateString()}</p>
            </div>

            {/* HPCSA Status */}
            {hpcsaDetails && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                hpcsaDetails.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                <ShieldCheck className="h-5 w-5" />
                <div>
                  <span className="font-medium">HPCSA: {hpcsaDetails.mpNumber}</span>
                  <p className="text-xs">Expires: {hpcsaDetails.expiryDate}</p>
                </div>
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
            <p className="text-xl font-bold text-[#00897B]">{stats.todaysAppointments}</p>
            <p className="text-[10px] text-[#757575]">Today's Appointments</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-green-600">{stats.completedToday}</p>
            <p className="text-[10px] text-[#757575]">Completed</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-yellow-600">{stats.pendingClaims + stats.submittedClaims}</p>
            <p className="text-[10px] text-[#757575]">Outstanding Claims</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-blue-600">{formatCurrency(stats.outstandingClaimsValue)}</p>
            <p className="text-[10px] text-[#757575]">Claims Value</p>
          </div>
          <div className="bg-red-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-red-600">{stats.rejectedClaims}</p>
            <p className="text-[10px] text-[#757575]">Rejected Claims</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-purple-600">{formatCurrency(stats.medicalAidDebtors)}</p>
            <p className="text-[10px] text-[#757575]">MA Debtors</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-amber-600">{Math.round(stats.cpdProgress)}%</p>
            <p className="text-[10px] text-[#757575]">CPD Progress</p>
          </div>
          <div className="bg-teal-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-teal-600">{stats.hpcsaActive ? 'Active' : 'Review'}</p>
            <p className="text-[10px] text-[#757575]">HPCSA Status</p>
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
              <TabsTrigger value="patients" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Users className="h-4 w-4 mr-1" />Patients
              </TabsTrigger>
              <TabsTrigger value="claims" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Receipt className="h-4 w-4 mr-1" />Claims
              </TabsTrigger>
              <TabsTrigger value="billing" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <CreditCard className="h-4 w-4 mr-1" />Billing
              </TabsTrigger>
              <TabsTrigger value="dispensing" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Pill className="h-4 w-4 mr-1" />Dispensing
              </TabsTrigger>
              <TabsTrigger value="compliance" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <ShieldCheck className="h-4 w-4 mr-1" />HPCSA/CPD
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
                      {appointments.filter(a => a.date === new Date().toISOString().split('T')[0]).map(appointment => (
                        <div key={appointment.id} className={`flex items-center justify-between p-2 rounded-lg ${
                          appointment.status === 'in_progress' ? 'bg-green-50 border border-green-200' :
                          appointment.status === 'completed' ? 'bg-gray-50' : 'bg-blue-50'
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-1 h-10 rounded-full ${
                              appointment.status === 'in_progress' ? 'bg-green-500' :
                              appointment.status === 'completed' ? 'bg-gray-400' : 'bg-blue-500'
                            }`} />
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm">{appointment.patient.firstName} {appointment.patient.lastName}</p>
                                {appointment.isPMB && (
                                  <Badge className="bg-teal-100 text-teal-700 text-[10px]">PMB</Badge>
                                )}
                              </div>
                              <p className="text-xs text-[#757575]">
                                {appointment.time} | {appointment.duration} min | {appointment.consultationType.replace('_', ' ')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {appointment.patient.medicalAid && getMedicalAidBadge(appointment.patient.medicalAid.provider)}
                            {getStatusBadge(appointment.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Outstanding Claims */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-[#00897B]" />
                      Outstanding Claims
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {claims.filter(c => c.status === 'pending' || c.status === 'submitted' || c.status === 'rejected').map(claim => (
                        <div key={claim.id} className={`flex items-center justify-between p-2 rounded-lg ${
                          claim.status === 'rejected' ? 'bg-red-50' : 'bg-yellow-50'
                        }`}>
                          <div>
                            <p className="font-medium text-sm">{claim.patient.firstName} {claim.patient.lastName}</p>
                            <p className="text-xs text-[#757575]">{claim.claimNumber} | {claim.icd10Codes.join(', ')}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm">{formatCurrency(claim.totalAmount)}</p>
                            {getStatusBadge(claim.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* HPCSA Status */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-[#00897B]" />
                      HPCSA Compliance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {hpcsaDetails && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <div>
                            <p className="font-medium">{hpcsaDetails.practitionerName}</p>
                            <p className="text-sm text-[#757575]">MP: {hpcsaDetails.mpNumber} | Practice: {hpcsaDetails.practiceNumber}</p>
                          </div>
                          {getHPCSAStatusBadge(hpcsaDetails.status)}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="p-2 bg-gray-50 rounded">
                            <p className="text-[#757575]">Registration Expiry</p>
                            <p className="font-medium">{hpcsaDetails.expiryDate}</p>
                          </div>
                          <div className="p-2 bg-gray-50 rounded">
                            <p className="text-[#757575]">Card Renewal Due</p>
                            <p className="font-medium">{hpcsaDetails.annualCardRenewalDue}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* CPD Progress */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-[#00897B]" />
                      CPD Progress ({cpdRecord?.year})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {cpdRecord && (
                      <div className="space-y-3">
                        <div className="p-3 bg-amber-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Total Points</span>
                            <span className="font-bold">{cpdRecord.totalPoints}/{cpdRecord.requiredPoints}</span>
                          </div>
                          <Progress value={stats.cpdProgress} className="h-2" />
                          <p className="text-xs text-[#757575] mt-1">
                            {cpdRecord.requiredPoints - cpdRecord.totalPoints} points remaining
                          </p>
                        </div>
                        <div className="p-3 bg-teal-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Ethics Points</span>
                            <span className="font-bold">{cpdRecord.ethicsPoints}/10</span>
                          </div>
                          <Progress value={stats.cpdEthicsProgress} className="h-2" />
                          <p className="text-xs text-[#757575] mt-1">Minimum 10 ethics points required</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="h-5 w-5 text-[#00897B]" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <div className="p-2 rounded-full bg-green-200">
                          <CheckCircle2 className="h-4 w-4 text-green-700" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Claim Paid</p>
                          <p className="text-xs text-[#757575]">CLM-2026-003 | {formatCurrency(468)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <div className="p-2 rounded-full bg-blue-200">
                          <Send className="h-4 w-4 text-blue-700" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Claim Submitted</p>
                          <p className="text-xs text-[#757575]">CLM-2026-001 | Discovery</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                        <div className="p-2 rounded-full bg-red-200">
                          <XCircle className="h-4 w-4 text-red-700" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Claim Rejected</p>
                          <p className="text-xs text-[#757575]">CLM-2026-004 | Auth required</p>
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
                <h2 className="text-lg font-semibold">Appointment Management</h2>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />Calendar View
                  </Button>
                  <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setAppointmentDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />New Appointment
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {appointments.map(appointment => (
                  <Card key={appointment.id} className={appointment.status === 'in_progress' ? 'border-green-300' : appointment.status === 'cancelled' ? 'border-red-300 opacity-70' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg ${
                            appointment.status === 'in_progress' ? 'bg-green-100' :
                            appointment.status === 'completed' ? 'bg-gray-100' :
                            appointment.status === 'cancelled' ? 'bg-red-100' : 'bg-blue-100'
                          }`}>
                            {appointment.status === 'in_progress' ? (
                              <Activity className="h-5 w-5 text-green-600" />
                            ) : appointment.status === 'completed' ? (
                              <CheckCircle2 className="h-5 w-5 text-gray-600" />
                            ) : appointment.status === 'cancelled' ? (
                              <XCircle className="h-5 w-5 text-red-600" />
                            ) : (
                              <Clock className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold">{appointment.patient.firstName} {appointment.patient.lastName}</p>
                              <Badge variant="outline" className="text-xs">{appointment.patient.medicalRecordNumber}</Badge>
                              {getConsultationTypeBadge(appointment.consultationType)}
                              {appointment.isPMB && (
                                <Badge className="bg-teal-100 text-teal-700">PMB</Badge>
                              )}
                              {getStatusBadge(appointment.status)}
                            </div>
                            <p className="text-sm text-[#757575] mt-1">
                              {appointment.time} | {appointment.duration} min | {new Date(appointment.date).toLocaleDateString()}
                            </p>
                            {appointment.icd10Codes && appointment.icd10Codes.length > 0 && (
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-[#757575]">ICD-10:</span>
                                {appointment.icd10Codes.map(code => (
                                  <Badge key={code} variant="outline" className="text-xs">{code}</Badge>
                                ))}
                              </div>
                            )}
                            {appointment.tariffCode && (
                              <p className="text-xs text-[#757575] mt-1">Tariff: {appointment.tariffCode}</p>
                            )}
                            {appointment.notes && (
                              <p className="text-xs text-[#757575] mt-1 italic">{appointment.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{formatCurrency(appointment.amount)}</p>
                          {appointment.patient.medicalAid && (
                            <div className="mt-1">
                              {getMedicalAidBadge(appointment.patient.medicalAid.provider)}
                            </div>
                          )}
                          <div className="flex gap-2 mt-3">
                            {appointment.status === 'scheduled' && (
                              <>
                                <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C]">Start</Button>
                                <Button size="sm" variant="outline">Reschedule</Button>
                              </>
                            )}
                            {appointment.status === 'in_progress' && (
                              <Button size="sm" className="bg-green-600 hover:bg-green-700">Complete</Button>
                            )}
                            {appointment.status === 'completed' && (
                              <Button size="sm" variant="outline">
                                <Receipt className="h-3 w-3 mr-1" />Invoice
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Patients Tab */}
            <TabsContent value="patients" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Patient Management</h2>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
                    <Input placeholder="Search patients..." className="pl-9 w-64" />
                  </div>
                  <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setPatientDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />New Patient
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {patients.map(patient => (
                  <Card key={patient.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="p-2 rounded-lg bg-blue-100">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold">{patient.firstName} {patient.lastName}</p>
                              <Badge variant="outline">{patient.medicalRecordNumber}</Badge>
                            </div>
                            <p className="text-sm text-[#757575]">DOB: {patient.dateOfBirth} | ID: {patient.idNumber}</p>
                            <p className="text-sm text-[#757575]">{patient.contactNumber} {patient.email && `| ${patient.email}`}</p>
                            {patient.medicalAid && (
                              <div className="flex items-center gap-2 mt-1">
                                {getMedicalAidBadge(patient.medicalAid.provider)}
                                <span className="text-xs text-[#757575]">{patient.medicalAid.membershipNumber}/{patient.medicalAid.dependentCode}</span>
                                <span className="text-xs text-[#757575]">({patient.medicalAid.planName})</span>
                              </div>
                            )}
                            {patient.chronicConditions && patient.chronicConditions.length > 0 && (
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-[#757575]">Chronic:</span>
                                {patient.chronicConditions.map(condition => (
                                  <Badge key={condition} className="bg-orange-100 text-orange-700 text-xs">{condition}</Badge>
                                ))}
                              </div>
                            )}
                            {patient.allergies && patient.allergies.length > 0 && (
                              <div className="flex items-center gap-2 mt-1">
                                <AlertTriangle className="h-3 w-3 text-red-500" />
                                <span className="text-xs text-red-600">Allergies: {patient.allergies.join(', ')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-[#757575]">Last Visit</p>
                          <p className="font-medium">{patient.lastVisit || 'New Patient'}</p>
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" variant="outline">
                              <Eye className="h-3 w-3 mr-1" />View
                            </Button>
                            <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C]">
                              <Calendar className="h-3 w-3 mr-1" />Book
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Claims Tab */}
            <TabsContent value="claims" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Medical Aid Claims</h2>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />Export Report
                  </Button>
                  <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setClaimDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />New Claim
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {claims.map(claim => (
                  <Card key={claim.id} className={claim.status === 'rejected' ? 'border-red-300' : claim.status === 'paid' ? 'border-green-300' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg ${
                            claim.status === 'paid' ? 'bg-green-100' :
                            claim.status === 'rejected' ? 'bg-red-100' :
                            claim.status === 'submitted' ? 'bg-blue-100' : 'bg-yellow-100'
                          }`}>
                            {claim.status === 'paid' ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : claim.status === 'rejected' ? (
                              <XCircle className="h-5 w-5 text-red-600" />
                            ) : claim.status === 'submitted' ? (
                              <Send className="h-5 w-5 text-blue-600" />
                            ) : (
                              <Timer className="h-5 w-5 text-yellow-600" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold">{claim.claimNumber}</p>
                              {getMedicalAidBadge(claim.medicalAid.provider)}
                              {getStatusBadge(claim.status)}
                            </div>
                            <p className="text-sm text-[#757575]">Patient: {claim.patient.firstName} {claim.patient.lastName} ({claim.patient.medicalRecordNumber})</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-[#757575]">ICD-10:</span>
                              {claim.icd10Codes.map(code => (
                                <Badge key={code} variant="outline" className="text-xs">{code}</Badge>
                              ))}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-[#757575]">Tariff:</span>
                              {claim.tariffCodes.map(code => (
                                <Badge key={code} variant="outline" className="text-xs">{code}</Badge>
                              ))}
                            </div>
                            {claim.rejectionReason && (
                              <p className="text-xs text-red-600 mt-1">
                                <AlertTriangle className="h-3 w-3 inline mr-1" />
                                {claim.rejectionReason}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{formatCurrency(claim.totalAmount)}</p>
                          {claim.paidAmount && (
                            <p className="text-sm text-green-600">Paid: {formatCurrency(claim.paidAmount)}</p>
                          )}
                          <p className="text-xs text-[#757575] mt-1">Created: {claim.createdAt}</p>
                          {claim.submittedDate && (
                            <p className="text-xs text-[#757575]">Submitted: {claim.submittedDate}</p>
                          )}
                          {claim.processedDate && (
                            <p className="text-xs text-[#757575]">Processed: {claim.processedDate}</p>
                          )}
                          <div className="flex gap-2 mt-3">
                            {claim.status === 'pending' && (
                              <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C]">
                                <Send className="h-3 w-3 mr-1" />Submit
                              </Button>
                            )}
                            {claim.status === 'rejected' && (
                              <Button size="sm" variant="outline">
                                <RefreshCw className="h-3 w-3 mr-1" />Resubmit
                              </Button>
                            )}
                            <Button size="sm" variant="outline">
                              <Eye className="h-3 w-3 mr-1" />Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Billing Tab */}
            <TabsContent value="billing" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Patient Billing & Statements</h2>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Printer className="h-4 w-4 mr-2" />Print Statement
                  </Button>
                  <Button className="bg-[#00897B] hover:bg-[#00695C]">
                    <Receipt className="h-4 w-4 mr-2" />New Invoice
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[#757575]">Total Outstanding</p>
                        <p className="text-2xl font-bold">{formatCurrency(stats.medicalAidDebtors + stats.outstandingClaimsValue)}</p>
                      </div>
                      <div className="p-3 rounded-full bg-red-100">
                        <DollarSign className="h-6 w-6 text-red-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[#757575]">Medical Aid Debtors</p>
                        <p className="text-2xl font-bold">{formatCurrency(stats.medicalAidDebtors)}</p>
                      </div>
                      <div className="p-3 rounded-full bg-blue-100">
                        <Building2 className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[#757575]">Patient Debtors</p>
                        <p className="text-2xl font-bold">R8,250.00</p>
                      </div>
                      <div className="p-3 rounded-full bg-purple-100">
                        <Users className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">NHRPL Pricing Reference</CardTitle>
                  <CardDescription>National Health Reference Price List tariff codes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium">0180</p>
                      <p className="text-sm text-[#757575]">Initial Consultation</p>
                      <p className="text-sm font-bold">{formatCurrency(680)}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium">0190</p>
                      <p className="text-sm text-[#757575]">Follow-up Consultation</p>
                      <p className="text-sm font-bold">{formatCurrency(520)}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium">0191</p>
                      <p className="text-sm text-[#757575]">PMB Consultation</p>
                      <p className="text-sm font-bold">{formatCurrency(420)}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium">1310</p>
                      <p className="text-sm text-[#757575]">Minor Procedure</p>
                      <p className="text-sm font-bold">{formatCurrency(730)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Dispensing Tab */}
            <TabsContent value="dispensing" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">Dispensing Records</h2>
                  <p className="text-sm text-[#757575]">Section 56 License: {dispensingRecords[0]?.section56LicenseNumber || 'Not configured'}</p>
                </div>
                <Button className="bg-[#00897B] hover:bg-[#00695C]">
                  <Plus className="h-4 w-4 mr-2" />New Dispense
                </Button>
              </div>

              <div className="space-y-3">
                {dispensingRecords.map(record => (
                  <Card key={record.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="p-2 rounded-lg bg-purple-100">
                            <Pill className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold">{record.patient.firstName} {record.patient.lastName}</p>
                              <Badge variant="outline">{record.patient.medicalRecordNumber}</Badge>
                            </div>
                            <p className="text-sm text-[#757575]">{record.date}</p>
                            <div className="mt-2 space-y-1">
                              {record.items.map(item => (
                                <div key={item.id} className="flex items-center gap-2 text-sm">
                                  <Badge variant="outline" className="text-xs">Schedule {item.schedule}</Badge>
                                  <span>{item.productName}</span>
                                  <span className="text-[#757575]">x{item.quantity}</span>
                                  <span className="text-[#757575]">| {item.dosage} {item.frequency}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{formatCurrency(record.totalAmount)}</p>
                          <p className="text-xs text-[#757575]">NAPPI codes recorded</p>
                          <Button size="sm" variant="outline" className="mt-2">
                            <Printer className="h-3 w-3 mr-1" />Label
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* HPCSA/CPD Tab */}
            <TabsContent value="compliance" className="m-0">
              <div className="grid grid-cols-2 gap-4">
                {/* HPCSA Details */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-[#00897B]" />
                      HPCSA Registration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {hpcsaDetails && (
                      <div className="space-y-3">
                        <div className={`p-4 rounded-lg ${hpcsaDetails.status === 'active' ? 'bg-green-50' : 'bg-yellow-50'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-bold text-lg">{hpcsaDetails.practitionerName}</p>
                            {getHPCSAStatusBadge(hpcsaDetails.status)}
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-[#757575]">MP Number</p>
                              <p className="font-medium">{hpcsaDetails.mpNumber}</p>
                            </div>
                            <div>
                              <p className="text-[#757575]">Practice Number</p>
                              <p className="font-medium">{hpcsaDetails.practiceNumber}</p>
                            </div>
                            <div>
                              <p className="text-[#757575]">Registration Date</p>
                              <p className="font-medium">{hpcsaDetails.registrationDate}</p>
                            </div>
                            <div>
                              <p className="text-[#757575]">Expiry Date</p>
                              <p className="font-medium">{hpcsaDetails.expiryDate}</p>
                            </div>
                          </div>
                          <Separator className="my-3" />
                          <div>
                            <p className="text-[#757575] text-sm mb-1">Categories</p>
                            <div className="flex flex-wrap gap-1">
                              {hpcsaDetails.categories.map(cat => (
                                <Badge key={cat} variant="outline" className="text-xs">{cat}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Annual Practice Card Renewal</p>
                              <p className="text-sm text-[#757575]">Due: {hpcsaDetails.annualCardRenewalDue}</p>
                            </div>
                            <Button size="sm" variant="outline">Renew</Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Professional Indemnity */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-[#00897B]" />
                      Professional Indemnity Insurance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {indemnityInsurance.filter(i => i.status === 'active')[0] ? (
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-bold">{indemnityInsurance[0].provider}</p>
                          <Badge className="bg-green-100 text-green-700">Active</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-[#757575]">Policy Number</p>
                            <p className="font-medium">{indemnityInsurance[0].policyNumber}</p>
                          </div>
                          <div>
                            <p className="text-[#757575]">Coverage</p>
                            <p className="font-medium text-green-700">{formatCurrency(indemnityInsurance[0].coverageAmount)}</p>
                          </div>
                          <div>
                            <p className="text-[#757575]">Valid From</p>
                            <p className="font-medium">{indemnityInsurance[0].startDate}</p>
                          </div>
                          <div>
                            <p className="text-[#757575]">Valid Until</p>
                            <p className="font-medium">{indemnityInsurance[0].endDate}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="mt-3">
                          <Download className="h-3 w-3 mr-1" />Certificate
                        </Button>
                      </div>
                    ) : (
                      <div className="p-4 bg-red-50 rounded-lg">
                        <p className="text-red-700 font-medium">No active insurance policy</p>
                        <p className="text-sm text-red-600">Please add your professional indemnity insurance details</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* CPD Progress */}
                <Card className="col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-[#00897B]" />
                      Continuing Professional Development (CPD) - {cpdRecord?.year}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {cpdRecord && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-3 bg-amber-50 rounded-lg text-center">
                            <p className="text-3xl font-bold text-amber-600">{cpdRecord.totalPoints}</p>
                            <p className="text-sm text-[#757575]">Total Points</p>
                            <p className="text-xs text-[#757575]">Required: {cpdRecord.requiredPoints}</p>
                          </div>
                          <div className="p-3 bg-teal-50 rounded-lg text-center">
                            <p className="text-3xl font-bold text-teal-600">{cpdRecord.ethicsPoints}</p>
                            <p className="text-sm text-[#757575]">Ethics Points</p>
                            <p className="text-xs text-[#757575]">Required: 10</p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg text-center">
                            <p className="text-3xl font-bold text-gray-600">{cpdRecord.activities.length}</p>
                            <p className="text-sm text-[#757575]">Activities</p>
                            <p className="text-xs text-[#757575]">Recorded</p>
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">CPD Activities</p>
                            <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C]">
                              <Plus className="h-3 w-3 mr-1" />Add Activity
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            {cpdRecord.activities.map(activity => (
                              <div key={activity.id} className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="font-medium text-sm">{activity.title}</p>
                                  <Badge variant="outline">{activity.type}</Badge>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-[#757575]">
                                  <span>{activity.date}</span>
                                  <span>+{activity.points} pts</span>
                                  {activity.ethicsPoints > 0 && (
                                    <Badge className="bg-teal-100 text-teal-700 text-[10px]">+{activity.ethicsPoints} ethics</Badge>
                                  )}
                                </div>
                                <p className="text-xs text-[#757575] mt-1">{activity.provider}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  )
}
