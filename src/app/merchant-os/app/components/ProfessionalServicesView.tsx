'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  Building2,
  Users,
  FileText,
  ShieldCheck,
  Clock,
  Calendar,
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
  BookOpen,
  Award,
  TrendingUp,
  TrendingDown,
  Banknote,
  Scale,
  Briefcase,
  FileSignature,
  CreditCard,
  UserCheck,
  Building,
  Globe,
  Mail,
  Phone,
  MapPin,
  Loader2,
  ChevronRight,
  ExternalLink,
  Bell,
  Settings,
  BarChart3,
  PieChart,
  Activity,
  Stethoscope,
  HardHat,
  Calculator,
  ScaleIcon,
  Heart,
  Pill,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  FileStack,
  FolderOpen,
  UserPlus,
  ClipboardCheck,
  GraduationCap,
  Target,
  Info,
} from 'lucide-react'

// Types
type RegistrationStatus = 'valid' | 'expiring_soon' | 'expired' | 'pending_renewal'
type MatterStatus = 'open' | 'in_progress' | 'pending' | 'closed' | 'archived'
type TransactionType = 'deposit' | 'withdrawal' | 'transfer' | 'fee'

// South African Professional Councils
const SA_COUNCILS = {
  HPCSA: {
    name: 'Health Professions Council of South Africa',
    shortName: 'HPCSA',
    icon: Stethoscope,
    color: 'emerald',
    cpdRequirement: { points: 30, period: 'yearly', description: '30 CEU per year' },
    website: 'https://www.hpcsa.co.za',
  },
  ECSA: {
    name: 'Engineering Council of South Africa',
    shortName: 'ECSA',
    icon: HardHat,
    color: 'orange',
    cpdRequirement: { points: 25, period: '3-years', description: '25 points per 3 years' },
    website: 'https://www.ecsa.co.za',
  },
  SAICA: {
    name: 'South African Institute of Chartered Accountants',
    shortName: 'SAICA',
    icon: Calculator,
    color: 'blue',
    cpdRequirement: { points: 120, period: '3-years', description: '120 hours per 3 years' },
    website: 'https://www.saica.co.za',
  },
  LPC: {
    name: 'Legal Practice Council',
    shortName: 'LPC',
    icon: Scale,
    color: 'purple',
    cpdRequirement: { points: 5, period: 'yearly', description: '5 points per year' },
    website: 'https://www.lpc.org.za',
  },
  SANC: {
    name: 'South African Nursing Council',
    shortName: 'SANC',
    icon: Heart,
    color: 'pink',
    cpdRequirement: { points: 30, period: 'yearly', description: '30 CEU per year' },
    website: 'https://www.sanc.co.za',
  },
  SAPC: {
    name: 'South African Pharmacy Council',
    shortName: 'SAPC',
    icon: Pill,
    color: 'teal',
    cpdRequirement: { points: 40, period: 'yearly', description: '40 CEU per year' },
    website: 'https://www.sapc.za.org',
  },
}

interface StaffMember {
  id: string
  name: string
  email: string
  role: string
  council: keyof typeof SA_COUNCILS
  registrationNumber: string
  registrationStatus: RegistrationStatus
  registrationExpiry: string
  cpdPoints: number
  cpdRequired: number
  cpdPeriod: string
  lastActivity: string
  specialization?: string
  photoUrl?: string
}

interface ClientMatter {
  id: string
  matterNumber: string
  clientName: string
  clientEmail: string
  clientPhone: string
  matterType: string
  description: string
  status: MatterStatus
  openedDate: string
  dueDate?: string
  closedDate?: string
  assignedStaff: string
  documents: number
  billableHours: number
  totalFees: number
  lastActivity: string
}

interface TrustTransaction {
  id: string
  transactionDate: string
  transactionType: TransactionType
  matterReference: string
  clientName: string
  description: string
  reference: string
  amount: number
  balance: number
  reconciled: boolean
  reconciledDate?: string
  reconciledBy?: string
  status: 'pending' | 'cleared' | 'flagged'
}

interface CPDActivity {
  id: string
  staffId: string
  staffName: string
  title: string
  type: 'course' | 'seminar' | 'workshop' | 'publication' | 'presentation' | 'webinar' | 'self_study'
  provider: string
  date: string
  points: number
  certificateUrl?: string
  verified: boolean
  council: keyof typeof SA_COUNCILS
}

interface PracticeDetails {
  name: string
  type: 'legal' | 'accounting' | 'medical' | 'engineering' | 'pharmacy' | 'consulting'
  registrationNumber: string
  vatNumber: string
  address: string
  phone: string
  email: string
  website?: string
  primaryCouncil: keyof typeof SA_COUNCILS
  practiceCertificateExpiry: string
  fidelityFundExpiry?: string
}

interface ProfessionalServicesViewProps {
  subVerticalId?: string
  subVerticalName?: string
}

export function ProfessionalServicesView({ subVerticalId, subVerticalName }: ProfessionalServicesViewProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Determine practice type based on sub-vertical
  const getPracticeConfig = () => {
    const configs: Record<string, { type: string; council: keyof typeof SA_COUNCILS; title: string }> = {
      'medical-practice': { type: 'medical', council: 'HPCSA', title: 'Medical Practice' },
      'dental-practice': { type: 'medical', council: 'HPCSA', title: 'Dental Practice' },
      'legal-practice': { type: 'legal', council: 'LPC', title: 'Legal Practice' },
      'accounting-practice': { type: 'accounting', council: 'SAICA', title: 'Accounting Practice' },
      'engineering-practice': { type: 'engineering', council: 'ECSA', title: 'Engineering Practice' },
      'pharmacy-practice': { type: 'pharmacy', council: 'SAPC', title: 'Pharmacy Practice' },
      'architecture-practice': { type: 'architecture', council: 'ECSA', title: 'Architecture Practice' },
      'nursing-practice': { type: 'nursing', council: 'SANC', title: 'Nursing Services' },
      'consulting': { type: 'consulting', council: 'SAICA', title: 'Consulting Practice' },
    }
    return configs[subVerticalId || ''] || { type: 'legal', council: 'LPC', title: 'Professional Services' }
  }

  const practiceConfig = getPracticeConfig()

  // Data states
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [matters, setMatters] = useState<ClientMatter[]>([])
  const [trustTransactions, setTrustTransactions] = useState<TrustTransaction[]>([])
  const [cpdActivities, setCpdActivities] = useState<CPDActivity[]>([])
  const [practiceDetails, setPracticeDetails] = useState<PracticeDetails | null>(null)

  // Dialog states
  const [staffDialogOpen, setStaffDialogOpen] = useState(false)
  const [matterDialogOpen, setMatterDialogOpen] = useState(false)
  const [trustDialogOpen, setTrustDialogOpen] = useState(false)
  const [cpdDialogOpen, setCpdDialogOpen] = useState(false)
  const [clientDialogOpen, setClientDialogOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [selectedMatter, setSelectedMatter] = useState<ClientMatter | null>(null)

  // Update time
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Mock data
  useEffect(() => {
    const timer = setTimeout(() => {
      setPracticeDetails({
        name: 'Ndaba & Associates',
        type: 'legal',
        registrationNumber: 'LPC-2026-78945',
        vatNumber: '4455667788',
        address: '123 Smith Street, Durban, 4001',
        phone: '+27 31 123 4567',
        email: 'info@ndabaassociates.co.za',
        website: 'www.ndabaassociates.co.za',
        primaryCouncil: 'LPC',
        practiceCertificateExpiry: '2027-03-15',
        fidelityFundExpiry: '2026-12-31',
      })

      setStaff([
        {
          id: '1',
          name: 'Sipho Ndaba',
          email: 'sipho@ndabaassociates.co.za',
          role: 'Senior Partner',
          council: 'LPC',
          registrationNumber: 'LPC-2026-12345',
          registrationStatus: 'valid',
          registrationExpiry: '2027-06-30',
          cpdPoints: 4.5,
          cpdRequired: 5,
          cpdPeriod: '2026',
          lastActivity: '2026-02-14',
          specialization: 'Commercial Litigation',
        },
        {
          id: '2',
          name: 'Thandi Zwane',
          email: 'thandi@ndabaassociates.co.za',
          role: 'Associate',
          council: 'LPC',
          registrationNumber: 'LPC-2026-67890',
          registrationStatus: 'expiring_soon',
          registrationExpiry: '2026-03-31',
          cpdPoints: 3,
          cpdRequired: 5,
          cpdPeriod: '2026',
          lastActivity: '2026-02-13',
          specialization: 'Family Law',
        },
        {
          id: '3',
          name: 'Dr. James Mokoena',
          email: 'james@healthclinic.co.za',
          role: 'Medical Director',
          council: 'HPCSA',
          registrationNumber: 'MP-0678901',
          registrationStatus: 'valid',
          registrationExpiry: '2027-12-31',
          cpdPoints: 28,
          cpdRequired: 30,
          cpdPeriod: '2026',
          lastActivity: '2026-02-14',
          specialization: 'General Practice',
        },
        {
          id: '4',
          name: 'Nomsa Dube',
          email: 'nomsa@engineering.co.za',
          role: 'Principal Engineer',
          council: 'ECSA',
          registrationNumber: 'ECSA-2018-4567',
          registrationStatus: 'expired',
          registrationExpiry: '2025-12-31',
          cpdPoints: 22,
          cpdRequired: 25,
          cpdPeriod: '2023-2025',
          lastActivity: '2026-02-10',
          specialization: 'Civil Engineering',
        },
        {
          id: '5',
          name: 'Peter van der Merwe',
          email: 'peter@accountants.co.za',
          role: 'Senior Accountant',
          council: 'SAICA',
          registrationNumber: 'SAICA-123456',
          registrationStatus: 'valid',
          registrationExpiry: '2028-06-30',
          cpdPoints: 95,
          cpdRequired: 120,
          cpdPeriod: '2024-2026',
          lastActivity: '2026-02-14',
          specialization: 'Taxation',
        },
        {
          id: '6',
          name: 'Sister Grace Mthembu',
          email: 'grace@nursing.co.za',
          role: 'Professional Nurse',
          council: 'SANC',
          registrationNumber: 'SANC-456789',
          registrationStatus: 'pending_renewal',
          registrationExpiry: '2026-02-28',
          cpdPoints: 25,
          cpdRequired: 30,
          cpdPeriod: '2025-2026',
          lastActivity: '2026-02-12',
          specialization: 'Critical Care',
        },
        {
          id: '7',
          name: 'Pharmacist John Naidoo',
          email: 'john@pharmacy.co.za',
          role: 'Responsible Pharmacist',
          council: 'SAPC',
          registrationNumber: 'SAPC-789012',
          registrationStatus: 'valid',
          registrationExpiry: '2027-04-30',
          cpdPoints: 38,
          cpdRequired: 40,
          cpdPeriod: '2026',
          lastActivity: '2026-02-14',
          specialization: 'Community Pharmacy',
        },
      ])

      setMatters([
        {
          id: '1',
          matterNumber: 'MAT-2026-001',
          clientName: 'ABC Construction (Pty) Ltd',
          clientEmail: 'contracts@abcconstruction.co.za',
          clientPhone: '+27 11 234 5678',
          matterType: 'Commercial Litigation',
          description: 'Breach of contract dispute regarding construction project',
          status: 'open',
          openedDate: '2026-01-10',
          dueDate: '2026-06-30',
          assignedStaff: 'Sipho Ndaba',
          documents: 45,
          billableHours: 120,
          totalFees: 180000,
          lastActivity: '2026-02-14',
        },
        {
          id: '2',
          matterNumber: 'MAT-2026-002',
          clientName: 'XYZ Holdings',
          clientEmail: 'legal@xyzholdings.co.za',
          clientPhone: '+27 21 987 6543',
          matterType: 'Contract Review',
          description: 'Review of merger and acquisition agreement',
          status: 'in_progress',
          openedDate: '2026-01-15',
          dueDate: '2026-03-15',
          assignedStaff: 'Thandi Zwane',
          documents: 23,
          billableHours: 45,
          totalFees: 67500,
          lastActivity: '2026-02-13',
        },
        {
          id: '3',
          matterNumber: 'MAT-2026-003',
          clientName: 'Maria da Silva',
          clientEmail: 'maria.dasilva@email.com',
          clientPhone: '+27 82 123 4567',
          matterType: 'Family Law',
          description: 'Divorce proceedings and asset division',
          status: 'pending',
          openedDate: '2026-02-01',
          assignedStaff: 'Thandi Zwane',
          documents: 12,
          billableHours: 8,
          totalFees: 12000,
          lastActivity: '2026-02-10',
        },
        {
          id: '4',
          matterNumber: 'MAT-2025-045',
          clientName: 'TechStart Solutions',
          clientEmail: 'info@techstart.co.za',
          clientPhone: '+27 12 345 6789',
          matterType: 'Intellectual Property',
          description: 'Trademark registration and protection',
          status: 'closed',
          openedDate: '2025-08-15',
          closedDate: '2026-01-30',
          assignedStaff: 'Sipho Ndaba',
          documents: 18,
          billableHours: 35,
          totalFees: 52500,
          lastActivity: '2026-01-30',
        },
      ])

      setTrustTransactions([
        {
          id: '1',
          transactionDate: '2026-02-14',
          transactionType: 'deposit',
          matterReference: 'MAT-2026-001',
          clientName: 'ABC Construction (Pty) Ltd',
          description: 'Initial retainer deposit',
          reference: 'DEP-2026-001',
          amount: 100000,
          balance: 450000,
          reconciled: true,
          reconciledDate: '2026-02-14',
          reconciledBy: 'Sipho Ndaba',
          status: 'cleared',
        },
        {
          id: '2',
          transactionDate: '2026-02-12',
          transactionType: 'withdrawal',
          matterReference: 'MAT-2026-001',
          clientName: 'ABC Construction (Pty) Ltd',
          description: 'Payment to expert witness',
          reference: 'WD-2026-001',
          amount: -25000,
          balance: 350000,
          reconciled: true,
          reconciledDate: '2026-02-12',
          reconciledBy: 'Thandi Zwane',
          status: 'cleared',
        },
        {
          id: '3',
          transactionDate: '2026-02-10',
          transactionType: 'deposit',
          matterReference: 'MAT-2026-002',
          clientName: 'XYZ Holdings',
          description: 'M&A transaction retainer',
          reference: 'DEP-2026-002',
          amount: 150000,
          balance: 375000,
          reconciled: false,
          status: 'pending',
        },
        {
          id: '4',
          transactionDate: '2026-02-08',
          transactionType: 'fee',
          matterReference: 'MAT-2026-001',
          clientName: 'ABC Construction (Pty) Ltd',
          description: 'Professional fees - February',
          reference: 'FEE-2026-002',
          amount: -45000,
          balance: 225000,
          reconciled: false,
          status: 'pending',
        },
      ])

      setCpdActivities([
        {
          id: '1',
          staffId: '1',
          staffName: 'Sipho Ndaba',
          title: 'Legal Ethics Update 2026',
          type: 'seminar',
          provider: 'Legal Education and Development',
          date: '2026-01-20',
          points: 2,
          verified: true,
          council: 'LPC',
        },
        {
          id: '2',
          staffId: '1',
          staffName: 'Sipho Ndaba',
          title: 'Commercial Law Practice',
          type: 'course',
          provider: 'LPC Continuing Education',
          date: '2026-02-05',
          points: 2.5,
          verified: true,
          council: 'LPC',
        },
        {
          id: '3',
          staffId: '2',
          staffName: 'Thandi Zwane',
          title: 'Family Law Conference',
          type: 'seminar',
          provider: 'Family Law Association',
          date: '2026-01-15',
          points: 3,
          verified: true,
          council: 'LPC',
        },
        {
          id: '4',
          staffId: '3',
          staffName: 'Dr. James Mokoena',
          title: 'Advanced Cardiac Life Support',
          type: 'course',
          provider: 'HPCSA Accredited Provider',
          date: '2026-02-01',
          points: 15,
          verified: true,
          council: 'HPCSA',
        },
        {
          id: '5',
          staffId: '3',
          staffName: 'Dr. James Mokoena',
          title: 'Medical Ethics Workshop',
          type: 'workshop',
          provider: 'Medical Association of SA',
          date: '2026-02-10',
          points: 8,
          verified: true,
          council: 'HPCSA',
        },
      ])

      setLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // Stats calculations
  const stats = {
    totalActiveClients: new Set(matters.filter(m => m.status !== 'closed').map(m => m.clientName)).size,
    openMatters: matters.filter(m => m.status === 'open' || m.status === 'in_progress' || m.status === 'pending').length,
    staffComplianceRate: staff.length > 0 
      ? Math.round((staff.filter(s => s.registrationStatus === 'valid').length / staff.length) * 100) 
      : 0,
    trustBalance: trustTransactions.length > 0 ? trustTransactions[0].balance : 0,
    expiringRegistrations: staff.filter(s => s.registrationStatus === 'expiring_soon' || s.registrationStatus === 'pending_renewal').length,
    expiredRegistrations: staff.filter(s => s.registrationStatus === 'expired').length,
    cpdCompliant: staff.filter(s => s.cpdPoints >= s.cpdRequired).length,
    cpdNonCompliant: staff.filter(s => s.cpdPoints < s.cpdRequired).length,
    unreconciledTransactions: trustTransactions.filter(t => !t.reconciled).length,
  }

  // Helper functions
  const getRegistrationStatusBadge = (status: RegistrationStatus) => {
    const config: Record<RegistrationStatus, { color: string; icon: React.ReactNode; label: string }> = {
      valid: { color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle2 className="h-3 w-3" />, label: 'Valid' },
      expiring_soon: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <AlertTriangle className="h-3 w-3" />, label: 'Expiring Soon' },
      expired: { color: 'bg-red-100 text-red-700 border-red-200', icon: <XCircle className="h-3 w-3" />, label: 'Expired' },
      pending_renewal: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <Clock className="h-3 w-3" />, label: 'Renewal Pending' },
    }
    const { color, icon, label } = config[status]
    return (
      <Badge className={`${color} flex items-center gap-1`}>
        {icon}
        {label}
      </Badge>
    )
  }

  const getStatusIndicator = (status: RegistrationStatus) => {
    const colors: Record<RegistrationStatus, string> = {
      valid: 'bg-green-500',
      expiring_soon: 'bg-amber-500',
      expired: 'bg-red-500',
      pending_renewal: 'bg-blue-500',
    }
    return <span className={`inline-block h-2.5 w-2.5 rounded-full ${colors[status]}`} />
  }

  const formatCurrency = (amount: number) => {
    return `R${Math.abs(amount).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`
  }

  const getMatterStatusBadge = (status: MatterStatus) => {
    const config: Record<MatterStatus, { color: string; label: string }> = {
      open: { color: 'bg-blue-100 text-blue-700', label: 'Open' },
      in_progress: { color: 'bg-purple-100 text-purple-700', label: 'In Progress' },
      pending: { color: 'bg-amber-100 text-amber-700', label: 'Pending' },
      closed: { color: 'bg-gray-100 text-gray-700', label: 'Closed' },
      archived: { color: 'bg-gray-50 text-gray-500', label: 'Archived' },
    }
    const { color, label } = config[status]
    return <Badge className={color}>{label}</Badge>
  }

  const getCouncilBadge = (council: keyof typeof SA_COUNCILS) => {
    const config = SA_COUNCILS[council]
    const Icon = config.icon
    const colorMap: Record<string, string> = {
      emerald: 'bg-emerald-100 text-emerald-700',
      orange: 'bg-orange-100 text-orange-700',
      blue: 'bg-blue-100 text-blue-700',
      purple: 'bg-purple-100 text-purple-700',
      pink: 'bg-pink-100 text-pink-700',
      teal: 'bg-teal-100 text-teal-700',
    }
    return (
      <Badge className={`${colorMap[config.color]} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.shortName}
      </Badge>
    )
  }

  const getDaysUntilExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate)
    const today = new Date()
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
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
              <Briefcase className="h-5 w-5 text-[#00897B]" />
              {practiceConfig.title}
            </h1>
            <p className="text-sm text-[#757575]">{SA_COUNCILS[practiceConfig.council].name} compliance, CPD tracking & practice management</p>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-emerald-700">{stats.totalActiveClients}</p>
                  <p className="text-xs text-emerald-600">Active Clients</p>
                </div>
                <div className="p-2 bg-emerald-200/50 rounded-lg">
                  <Users className="h-5 w-5 text-emerald-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-700">{stats.openMatters}</p>
                  <p className="text-xs text-blue-600">Open Matters</p>
                </div>
                <div className="p-2 bg-blue-200/50 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-purple-700">{stats.staffComplianceRate}%</p>
                  <p className="text-xs text-purple-600">Staff Compliance</p>
                </div>
                <div className="p-2 bg-purple-200/50 rounded-lg">
                  <ShieldCheck className="h-5 w-5 text-purple-700" />
                </div>
              </div>
              <Progress value={stats.staffComplianceRate} className="h-1.5 mt-2" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-teal-50 to-teal-100/50 border-teal-200">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold text-teal-700">{formatCurrency(stats.trustBalance)}</p>
                  <p className="text-xs text-teal-600">Trust Balance</p>
                </div>
                <div className="p-2 bg-teal-200/50 rounded-lg">
                  <Banknote className="h-5 w-5 text-teal-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert Bar */}
        {(stats.expiringRegistrations > 0 || stats.expiredRegistrations > 0 || stats.unreconciledTransactions > 0) && (
          <div className="mt-3 flex gap-2 flex-wrap">
            {stats.expiredRegistrations > 0 && (
              <Badge className="bg-red-100 text-red-700 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {stats.expiredRegistrations} Expired Registration{stats.expiredRegistrations > 1 ? 's' : ''}
              </Badge>
            )}
            {stats.expiringRegistrations > 0 && (
              <Badge className="bg-amber-100 text-amber-700 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {stats.expiringRegistrations} Expiring Soon
              </Badge>
            )}
            {stats.unreconciledTransactions > 0 && (
              <Badge className="bg-orange-100 text-orange-700 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {stats.unreconciledTransactions} Unreconciled Transaction{stats.unreconciledTransactions > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex-1 flex flex-col min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="bg-white border-b border-gray-200 px-4">
            <TabsList className="bg-transparent h-12">
              <TabsTrigger value="overview" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                Overview
              </TabsTrigger>
              <TabsTrigger value="practice" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Building2 className="h-4 w-4 mr-1" />Practice
              </TabsTrigger>
              <TabsTrigger value="staff" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <UserCheck className="h-4 w-4 mr-1" />Staff Compliance
              </TabsTrigger>
              <TabsTrigger value="matters" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <FileStack className="h-4 w-4 mr-1" />Client & Matters
              </TabsTrigger>
              <TabsTrigger value="trust" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Banknote className="h-4 w-4 mr-1" />Trust Account
              </TabsTrigger>
              <TabsTrigger value="cpd" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <GraduationCap className="h-4 w-4 mr-1" />CPD
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 p-4">
            {/* Overview Tab */}
            <TabsContent value="overview" className="m-0 space-y-4">
              {/* Quick Actions */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button 
                  className="h-auto py-4 flex-col gap-2 bg-[#00897B] hover:bg-[#00695C] cursor-pointer"
                  onClick={() => setClientDialogOpen(true)}
                  type="button"
                >
                  <UserPlus className="h-5 w-5" />
                  <span className="text-sm">New Client</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex-col gap-2 cursor-pointer hover:bg-[#E0F2F1] hover:text-[#00897B] hover:border-[#00897B]"
                  onClick={() => setMatterDialogOpen(true)}
                  type="button"
                >
                  <FileText className="h-5 w-5" />
                  <span className="text-sm">New Matter</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex-col gap-2 cursor-pointer hover:bg-[#E0F2F1] hover:text-[#00897B] hover:border-[#00897B]"
                  onClick={() => setTrustDialogOpen(true)}
                  type="button"
                >
                  <CreditCard className="h-5 w-5" />
                  <span className="text-sm">Trust Deposit</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex-col gap-2 cursor-pointer hover:bg-[#E0F2F1] hover:text-[#00897B] hover:border-[#00897B]"
                  onClick={() => setCpdDialogOpen(true)}
                  type="button"
                >
                  <BookOpen className="h-5 w-5" />
                  <span className="text-sm">Log CPD</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Registration Alerts */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      Registration Alerts
                    </CardTitle>
                    <CardDescription>Staff requiring attention</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {staff.filter(s => s.registrationStatus !== 'valid').map(member => (
                        <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            {getStatusIndicator(member.registrationStatus)}
                            <div>
                              <p className="font-medium text-sm">{member.name}</p>
                              <p className="text-xs text-[#757575]">{member.role} • {SA_COUNCILS[member.council].shortName}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {member.registrationStatus === 'expired' ? (
                              <Badge className="bg-red-100 text-red-700">
                                Expired {Math.abs(getDaysUntilExpiry(member.registrationExpiry))}d ago
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-100 text-amber-700">
                                {getDaysUntilExpiry(member.registrationExpiry)}d left
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                      {staff.filter(s => s.registrationStatus === 'valid').length === staff.length && (
                        <div className="text-center py-4 text-sm text-[#757575]">
                          <CheckCircle2 className="h-8 w-8 mx-auto text-green-500 mb-2" />
                          All registrations are valid
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* CPD Progress Summary */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-5 w-5 text-[#00897B]" />
                      CPD Progress
                    </CardTitle>
                    <CardDescription>Continuing professional development tracking</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {staff.map(member => (
                        <div key={member.id} className="p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{member.name}</p>
                              {getCouncilBadge(member.council)}
                            </div>
                            <span className={`text-sm font-bold ${member.cpdPoints >= member.cpdRequired ? 'text-green-600' : 'text-amber-600'}`}>
                              {member.cpdPoints}/{member.cpdRequired}
                            </span>
                          </div>
                          <Progress 
                            value={(member.cpdPoints / member.cpdRequired) * 100} 
                            className={`h-2 ${member.cpdPoints >= member.cpdRequired ? '[&>div]:bg-green-500' : '[&>div]:bg-amber-500'}`}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Matters */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FolderOpen className="h-5 w-5 text-[#00897B]" />
                      Recent Matters
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {matters.slice(0, 4).map(matter => (
                        <div key={matter.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded ${matter.status === 'closed' ? 'bg-gray-200' : 'bg-blue-100'}`}>
                              <FileText className={`h-4 w-4 ${matter.status === 'closed' ? 'text-gray-500' : 'text-blue-600'}`} />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{matter.matterNumber}</p>
                              <p className="text-xs text-[#757575]">{matter.clientName}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getMatterStatusBadge(matter.status)}
                            <Button variant="ghost" size="sm">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Trust Account Summary */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Banknote className="h-5 w-5 text-[#00897B]" />
                      Trust Account
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center mb-4">
                      <p className="text-3xl font-bold text-[#1A1A1A]">{formatCurrency(stats.trustBalance)}</p>
                      <p className="text-sm text-[#757575]">Current Balance</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-green-50 rounded-lg p-2 text-center">
                        <p className="text-lg font-bold text-green-700">
                          {formatCurrency(trustTransactions.filter(t => t.transactionType === 'deposit').reduce((sum, t) => sum + t.amount, 0))}
                        </p>
                        <p className="text-xs text-green-600">Deposits</p>
                      </div>
                      <div className="bg-red-50 rounded-lg p-2 text-center">
                        <p className="text-lg font-bold text-red-700">
                          {formatCurrency(Math.abs(trustTransactions.filter(t => t.transactionType !== 'deposit').reduce((sum, t) => sum + t.amount, 0)))}
                        </p>
                        <p className="text-xs text-red-600">Withdrawals</p>
                      </div>
                    </div>
                    {stats.unreconciledTransactions > 0 && (
                      <div className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                        <span className="text-sm text-orange-700">{stats.unreconciledTransactions} unreconciled</span>
                        <Button size="sm" variant="outline" className="h-7 text-xs">Reconcile</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Practice Management Tab */}
            <TabsContent value="practice" className="m-0 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Practice Management</h2>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />Edit Details
                </Button>
              </div>

              {practiceDetails && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-[#00897B]" />
                        Practice Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-[#757575]">Practice Name</Label>
                          <p className="font-medium">{practiceDetails.name}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-[#757575]">Practice Type</Label>
                          <p className="font-medium capitalize">{practiceDetails.type}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-[#757575]">Registration Number</Label>
                          <p className="font-medium">{practiceDetails.registrationNumber}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-[#757575]">VAT Number</Label>
                          <p className="font-medium">{practiceDetails.vatNumber}</p>
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-[#757575]" />
                          <span>{practiceDetails.address}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-[#757575]" />
                          <span>{practiceDetails.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-[#757575]" />
                          <span>{practiceDetails.email}</span>
                        </div>
                        {practiceDetails.website && (
                          <div className="flex items-center gap-2 text-sm">
                            <Globe className="h-4 w-4 text-[#757575]" />
                            <a href={`https://${practiceDetails.website}`} className="text-[#00897B] hover:underline">
                              {practiceDetails.website}
                            </a>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-[#00897B]" />
                        Council Registration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {getCouncilBadge(practiceDetails.primaryCouncil)}
                          <div>
                            <p className="font-medium">{SA_COUNCILS[practiceDetails.primaryCouncil].name}</p>
                            <p className="text-xs text-[#757575]">Primary Council</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-2 border rounded-lg">
                          <div>
                            <p className="text-sm font-medium">Practice Certificate</p>
                            <p className="text-xs text-[#757575]">Primary registration document</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{practiceDetails.practiceCertificateExpiry}</p>
                            <Badge className={`${
                              getDaysUntilExpiry(practiceDetails.practiceCertificateExpiry) > 90 
                                ? 'bg-green-100 text-green-700' 
                                : getDaysUntilExpiry(practiceDetails.practiceCertificateExpiry) > 30 
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-red-100 text-red-700'
                            }`}>
                              {getDaysUntilExpiry(practiceDetails.practiceCertificateExpiry) > 0 
                                ? `${getDaysUntilExpiry(practiceDetails.practiceCertificateExpiry)} days`
                                : 'Expired'}
                            </Badge>
                          </div>
                        </div>

                        {practiceDetails.fidelityFundExpiry && (
                          <div className="flex items-center justify-between p-2 border rounded-lg">
                            <div>
                              <p className="text-sm font-medium">Fidelity Fund Certificate</p>
                              <p className="text-xs text-[#757575]">Required for legal practices</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">{practiceDetails.fidelityFundExpiry}</p>
                              <Badge className={`${
                                getDaysUntilExpiry(practiceDetails.fidelityFundExpiry) > 90 
                                  ? 'bg-green-100 text-green-700' 
                                  : getDaysUntilExpiry(practiceDetails.fidelityFundExpiry) > 30 
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-red-100 text-red-700'
                              }`}>
                                {getDaysUntilExpiry(practiceDetails.fidelityFundExpiry) > 0 
                                  ? `${getDaysUntilExpiry(practiceDetails.fidelityFundExpiry)} days`
                                  : 'Expired'}
                              </Badge>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* South African Councils Reference */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Award className="h-5 w-5 text-[#00897B]" />
                        South African Professional Councils
                      </CardTitle>
                      <CardDescription>CPD requirements and registration information</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {Object.entries(SA_COUNCILS).map(([key, council]) => {
                          const Icon = council.icon
                          const colorMap: Record<string, string> = {
                            emerald: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
                            orange: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
                            blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
                            purple: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
                            pink: 'bg-pink-50 border-pink-200 hover:bg-pink-100',
                            teal: 'bg-teal-50 border-teal-200 hover:bg-teal-100',
                          }
                          const textColorMap: Record<string, string> = {
                            emerald: 'text-emerald-700',
                            orange: 'text-orange-700',
                            blue: 'text-blue-700',
                            purple: 'text-purple-700',
                            pink: 'text-pink-700',
                            teal: 'text-teal-700',
                          }
                          return (
                            <div 
                              key={key}
                              className={`p-3 rounded-lg border ${colorMap[council.color]} cursor-pointer transition-colors`}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <Icon className={`h-5 w-5 ${textColorMap[council.color]}`} />
                                <span className={`font-semibold text-sm ${textColorMap[council.color]}`}>{council.shortName}</span>
                              </div>
                              <p className="text-xs text-[#757575] mb-1">{council.cpdRequirement.description}</p>
                              <p className="text-[10px] text-[#757575] truncate">{council.name}</p>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Staff Compliance Tab */}
            <TabsContent value="staff" className="m-0 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Staff Compliance</h2>
                  <p className="text-sm text-[#757575]">Professional registrations and CPD tracking</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />Export Report
                  </Button>
                  <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setStaffDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />Add Staff
                  </Button>
                </div>
              </div>

              {/* Compliance Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-3 text-center">
                    <p className="text-2xl font-bold text-green-700">{staff.filter(s => s.registrationStatus === 'valid').length}</p>
                    <p className="text-xs text-green-600">Valid Registrations</p>
                  </CardContent>
                </Card>
                <Card className="bg-amber-50 border-amber-200">
                  <CardContent className="p-3 text-center">
                    <p className="text-2xl font-bold text-amber-700">{stats.expiringRegistrations}</p>
                    <p className="text-xs text-amber-600">Expiring Soon</p>
                  </CardContent>
                </Card>
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="p-3 text-center">
                    <p className="text-2xl font-bold text-red-700">{stats.expiredRegistrations}</p>
                    <p className="text-xs text-red-600">Expired</p>
                  </CardContent>
                </Card>
                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="p-3 text-center">
                    <p className="text-2xl font-bold text-purple-700">{stats.cpdCompliant}/{staff.length}</p>
                    <p className="text-xs text-purple-600">CPD Compliant</p>
                  </CardContent>
                </Card>
              </div>

              {/* Staff List */}
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Staff Member</TableHead>
                        <TableHead>Council</TableHead>
                        <TableHead>Registration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>CPD Progress</TableHead>
                        <TableHead>Renewal Alert</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staff.map(member => (
                        <TableRow key={member.id} className={!member.registrationStatus || member.registrationStatus === 'expired' ? 'bg-red-50/50' : ''}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${
                                member.registrationStatus === 'valid' ? 'bg-green-100' :
                                member.registrationStatus === 'expiring_soon' ? 'bg-amber-100' :
                                member.registrationStatus === 'pending_renewal' ? 'bg-blue-100' :
                                'bg-red-100'
                              }`}>
                                {getStatusIndicator(member.registrationStatus)}
                              </div>
                              <div>
                                <p className="font-medium">{member.name}</p>
                                <p className="text-xs text-[#757575]">{member.role}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getCouncilBadge(member.council)}</TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">{member.registrationNumber}</p>
                              <p className="text-xs text-[#757575]">Expires: {member.registrationExpiry}</p>
                            </div>
                          </TableCell>
                          <TableCell>{getRegistrationStatusBadge(member.registrationStatus)}</TableCell>
                          <TableCell>
                            <div className="w-32">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs">{member.cpdPoints}/{member.cpdRequired}</span>
                                <span className={`text-xs ${member.cpdPoints >= member.cpdRequired ? 'text-green-600' : 'text-amber-600'}`}>
                                  {Math.round((member.cpdPoints / member.cpdRequired) * 100)}%
                                </span>
                              </div>
                              <Progress 
                                value={(member.cpdPoints / member.cpdRequired) * 100}
                                className={`h-2 ${member.cpdPoints >= member.cpdRequired ? '[&>div]:bg-green-500' : '[&>div]:bg-amber-500'}`}
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            {member.registrationStatus === 'expired' ? (
                              <Badge className="bg-red-100 text-red-700">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Renew Now
                              </Badge>
                            ) : member.registrationStatus === 'expiring_soon' ? (
                              <Badge className="bg-amber-100 text-amber-700">
                                <Clock className="h-3 w-3 mr-1" />
                                {getDaysUntilExpiry(member.registrationExpiry)} days
                              </Badge>
                            ) : member.registrationStatus === 'pending_renewal' ? (
                              <Badge className="bg-blue-100 text-blue-700">
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Processing
                              </Badge>
                            ) : (
                              <span className="text-xs text-[#757575]">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => { setSelectedStaff(member); setStaffDialogOpen(true) }}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Client & Matters Tab */}
            <TabsContent value="matters" className="m-0 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Client & Matter Management</h2>
                  <p className="text-sm text-[#757575]">{matters.length} matters on record</p>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
                    <Input placeholder="Search matters..." className="pl-9 w-64" />
                  </div>
                  <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setMatterDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />New Matter
                  </Button>
                </div>
              </div>

              {/* Matter Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-3 text-center">
                    <p className="text-2xl font-bold text-blue-700">{matters.filter(m => m.status === 'open').length}</p>
                    <p className="text-xs text-blue-600">Open</p>
                  </CardContent>
                </Card>
                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="p-3 text-center">
                    <p className="text-2xl font-bold text-purple-700">{matters.filter(m => m.status === 'in_progress').length}</p>
                    <p className="text-xs text-purple-600">In Progress</p>
                  </CardContent>
                </Card>
                <Card className="bg-amber-50 border-amber-200">
                  <CardContent className="p-3 text-center">
                    <p className="text-2xl font-bold text-amber-700">{matters.filter(m => m.status === 'pending').length}</p>
                    <p className="text-xs text-amber-600">Pending</p>
                  </CardContent>
                </Card>
                <Card className="bg-gray-50 border-gray-200">
                  <CardContent className="p-3 text-center">
                    <p className="text-2xl font-bold text-gray-700">{matters.filter(m => m.status === 'closed').length}</p>
                    <p className="text-xs text-gray-600">Closed</p>
                  </CardContent>
                </Card>
              </div>

              {/* Matters List */}
              <div className="space-y-3">
                {matters.map(matter => (
                  <Card key={matter.id} className={matter.status === 'closed' ? 'opacity-70' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg ${
                            matter.status === 'open' ? 'bg-blue-100' :
                            matter.status === 'in_progress' ? 'bg-purple-100' :
                            matter.status === 'pending' ? 'bg-amber-100' :
                            'bg-gray-100'
                          }`}>
                            <FileText className={`h-5 w-5 ${
                              matter.status === 'open' ? 'text-blue-600' :
                              matter.status === 'in_progress' ? 'text-purple-600' :
                              matter.status === 'pending' ? 'text-amber-600' :
                              'text-gray-600'
                            }`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-bold">{matter.matterNumber}</p>
                              {getMatterStatusBadge(matter.status)}
                            </div>
                            <p className="text-sm text-[#1A1A1A]">{matter.clientName}</p>
                            <p className="text-sm text-[#757575]">{matter.matterType}</p>
                            <p className="text-xs text-[#757575] mt-1">{matter.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-[#757575]">Assigned to</p>
                          <p className="font-medium">{matter.assignedStaff}</p>
                          <div className="mt-2 text-sm">
                            <p className="text-[#757575]">Opened: {matter.openedDate}</p>
                            {matter.dueDate && <p className="text-[#757575]">Due: {matter.dueDate}</p>}
                          </div>
                        </div>
                      </div>
                      <Separator className="my-3" />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-[#757575]">
                          <span className="flex items-center gap-1">
                            <FileStack className="h-4 w-4" />
                            {matter.documents} documents
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {matter.billableHours} hrs
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {formatCurrency(matter.totalFees)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <FolderOpen className="h-4 w-4 mr-1" />Files
                          </Button>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />View
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Trust Accounting Tab */}
            <TabsContent value="trust" className="m-0 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Trust Accounting</h2>
                  <p className="text-sm text-[#757575]">Client trust account management & reconciliation</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />Export
                  </Button>
                  <Button variant="outline" size="sm">
                    <Printer className="h-4 w-4 mr-2" />Statement
                  </Button>
                  <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setTrustDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />New Transaction
                  </Button>
                </div>
              </div>

              {/* Trust Account Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="md:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Account Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg">
                        <p className="text-3xl font-bold text-teal-700">{formatCurrency(stats.trustBalance)}</p>
                        <p className="text-sm text-teal-600">Current Balance</p>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                        <p className="text-3xl font-bold text-green-700">
                          {formatCurrency(trustTransactions.filter(t => t.transactionType === 'deposit').reduce((sum, t) => sum + t.amount, 0))}
                        </p>
                        <p className="text-sm text-green-600">Total Deposits</p>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg">
                        <p className="text-3xl font-bold text-red-700">
                          {formatCurrency(Math.abs(trustTransactions.filter(t => t.transactionType !== 'deposit').reduce((sum, t) => sum + t.amount, 0)))}
                        </p>
                        <p className="text-sm text-red-600">Total Withdrawals</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Reconciliation Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#757575]">Reconciled</span>
                        <Badge className="bg-green-100 text-green-700">
                          {trustTransactions.filter(t => t.reconciled).length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#757575]">Pending</span>
                        <Badge className="bg-orange-100 text-orange-700">
                          {trustTransactions.filter(t => !t.reconciled).length}
                        </Badge>
                      </div>
                      <Separator />
                      <Button className="w-full bg-[#00897B] hover:bg-[#00695C]" size="sm">
                        <ClipboardCheck className="h-4 w-4 mr-2" />Start Reconciliation
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Transactions List */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Matter / Client</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trustTransactions.map(tx => (
                        <TableRow key={tx.id} className={!tx.reconciled ? 'bg-orange-50/50' : ''}>
                          <TableCell className="text-sm">{tx.transactionDate}</TableCell>
                          <TableCell>
                            <Badge className={`${
                              tx.transactionType === 'deposit' ? 'bg-green-100 text-green-700' :
                              tx.transactionType === 'withdrawal' ? 'bg-red-100 text-red-700' :
                              tx.transactionType === 'fee' ? 'bg-purple-100 text-purple-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {tx.transactionType === 'deposit' ? <ArrowUpRight className="h-3 w-3 mr-1" /> :
                               tx.transactionType === 'withdrawal' ? <ArrowDownRight className="h-3 w-3 mr-1" /> :
                               <CreditCard className="h-3 w-3 mr-1" />}
                              {tx.transactionType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">{tx.matterReference}</p>
                              <p className="text-xs text-[#757575]">{tx.clientName}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{tx.description}</TableCell>
                          <TableCell className="text-sm text-[#757575]">{tx.reference}</TableCell>
                          <TableCell className={`text-right font-medium ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {tx.amount >= 0 ? '+' : '-'}{formatCurrency(tx.amount)}
                          </TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(tx.balance)}</TableCell>
                          <TableCell>
                            {tx.reconciled ? (
                              <Badge className="bg-green-100 text-green-700">
                                <CheckCircle2 className="h-3 w-3 mr-1" />Reconciled
                              </Badge>
                            ) : (
                              <Badge className="bg-orange-100 text-orange-700">
                                <Clock className="h-3 w-3 mr-1" />Pending
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {!tx.reconciled && (
                              <Button size="sm" variant="outline">Reconcile</Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* CPD Management Tab */}
            <TabsContent value="cpd" className="m-0 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">CPD Management</h2>
                  <p className="text-sm text-[#757575]">Continuing Professional Development tracking</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <BarChart3 className="h-4 w-4 mr-2" />Reports
                  </Button>
                  <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setCpdDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />Log Activity
                  </Button>
                </div>
              </div>

              {/* CPD Summary by Council */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {Object.entries(SA_COUNCILS).map(([key, council]) => {
                  const councilStaff = staff.filter(s => s.council === key)
                  const compliant = councilStaff.filter(s => s.cpdPoints >= s.cpdRequired).length
                  const Icon = council.icon
                  const colorMap: Record<string, string> = {
                    emerald: 'border-emerald-200 bg-emerald-50',
                    orange: 'border-orange-200 bg-orange-50',
                    blue: 'border-blue-200 bg-blue-50',
                    purple: 'border-purple-200 bg-purple-50',
                    pink: 'border-pink-200 bg-pink-50',
                    teal: 'border-teal-200 bg-teal-50',
                  }
                  const textColorMap: Record<string, string> = {
                    emerald: 'text-emerald-700',
                    orange: 'text-orange-700',
                    blue: 'text-blue-700',
                    purple: 'text-purple-700',
                    pink: 'text-pink-700',
                    teal: 'text-teal-700',
                  }
                  return (
                    <Card key={key} className={colorMap[council.color]}>
                      <CardContent className="p-3 text-center">
                        <Icon className={`h-6 w-6 mx-auto mb-2 ${textColorMap[council.color]}`} />
                        <p className="font-bold text-sm">{council.shortName}</p>
                        <p className="text-xs text-[#757575] mb-1">{council.cpdRequirement.description}</p>
                        <Separator className="my-2" />
                        <p className={`text-lg font-bold ${textColorMap[council.color]}`}>
                          {compliant}/{councilStaff.length}
                        </p>
                        <p className="text-xs text-[#757575]">Compliant</p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Staff CPD Progress */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Staff CPD Progress</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Staff Member</TableHead>
                        <TableHead>Council</TableHead>
                        <TableHead>CPD Period</TableHead>
                        <TableHead>Points Earned</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staff.map(member => (
                        <TableRow key={member.id} className={member.cpdPoints < member.cpdRequired ? 'bg-amber-50/50' : ''}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{member.name}</p>
                              <p className="text-xs text-[#757575]">{member.role}</p>
                            </div>
                          </TableCell>
                          <TableCell>{getCouncilBadge(member.council)}</TableCell>
                          <TableCell className="text-sm">{member.cpdPeriod}</TableCell>
                          <TableCell>
                            <span className={`font-bold ${member.cpdPoints >= member.cpdRequired ? 'text-green-600' : 'text-amber-600'}`}>
                              {member.cpdPoints}
                            </span>
                            <span className="text-[#757575]"> / {member.cpdRequired}</span>
                          </TableCell>
                          <TableCell>
                            <div className="w-32">
                              <Progress 
                                value={(member.cpdPoints / member.cpdRequired) * 100}
                                className={`h-2 ${member.cpdPoints >= member.cpdRequired ? '[&>div]:bg-green-500' : '[&>div]:bg-amber-500'}`}
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            {member.cpdPoints >= member.cpdRequired ? (
                              <Badge className="bg-green-100 text-green-700">
                                <CheckCircle2 className="h-3 w-3 mr-1" />Compliant
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-100 text-amber-700">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {member.cpdRequired - member.cpdPoints} needed
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4 mr-1" />View
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Plus className="h-4 w-4 mr-1" />Log
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Recent CPD Activities */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-[#00897B]" />
                    Recent CPD Activities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {cpdActivities.map(activity => (
                      <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded ${activity.verified ? 'bg-green-100' : 'bg-amber-100'}`}>
                            <GraduationCap className={`h-4 w-4 ${activity.verified ? 'text-green-600' : 'text-amber-600'}`} />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{activity.title}</p>
                            <p className="text-xs text-[#757575]">
                              {activity.staffName} • {activity.type} • {activity.provider}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-bold text-[#00897B]">+{activity.points} pts</p>
                            <p className="text-xs text-[#757575]">{activity.date}</p>
                          </div>
                          {activity.verified ? (
                            <Badge className="bg-green-100 text-green-700">Verified</Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-700">Pending</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>

      {/* Staff Dialog */}
      <Dialog open={staffDialogOpen} onOpenChange={setStaffDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedStaff ? 'Staff Details' : 'Add New Staff Member'}</DialogTitle>
            <DialogDescription>
              {selectedStaff ? 'View or edit staff registration details' : 'Add a new professional staff member'}
            </DialogDescription>
          </DialogHeader>
          {selectedStaff && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-[#757575]">Full Name</Label>
                  <p className="font-medium">{selectedStaff.name}</p>
                </div>
                <div>
                  <Label className="text-xs text-[#757575]">Role</Label>
                  <p className="font-medium">{selectedStaff.role}</p>
                </div>
                <div>
                  <Label className="text-xs text-[#757575]">Email</Label>
                  <p className="font-medium">{selectedStaff.email}</p>
                </div>
                <div>
                  <Label className="text-xs text-[#757575]">Council</Label>
                  <div className="mt-1">{getCouncilBadge(selectedStaff.council)}</div>
                </div>
                <div>
                  <Label className="text-xs text-[#757575]">Registration Number</Label>
                  <p className="font-medium">{selectedStaff.registrationNumber}</p>
                </div>
                <div>
                  <Label className="text-xs text-[#757575]">Registration Status</Label>
                  <div className="mt-1">{getRegistrationStatusBadge(selectedStaff.registrationStatus)}</div>
                </div>
              </div>
              <Separator />
              <div>
                <Label className="text-xs text-[#757575]">CPD Progress</Label>
                <div className="mt-2 flex items-center gap-4">
                  <Progress value={(selectedStaff.cpdPoints / selectedStaff.cpdRequired) * 100} className="flex-1" />
                  <span className="font-bold">{selectedStaff.cpdPoints}/{selectedStaff.cpdRequired}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setStaffDialogOpen(false); setSelectedStaff(null) }}>
              Close
            </Button>
            {!selectedStaff && (
              <Button className="bg-[#00897B] hover:bg-[#00695C]">Add Staff</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CPD Dialog */}
      <Dialog open={cpdDialogOpen} onOpenChange={setCpdDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log CPD Activity</DialogTitle>
            <DialogDescription>Record a new continuing professional development activity</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Staff Member</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name} ({SA_COUNCILS[s.council].shortName})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Activity Title</Label>
              <Input placeholder="Enter activity title" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Activity Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="course">Course</SelectItem>
                    <SelectItem value="seminar">Seminar</SelectItem>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="webinar">Webinar</SelectItem>
                    <SelectItem value="publication">Publication</SelectItem>
                    <SelectItem value="presentation">Presentation</SelectItem>
                    <SelectItem value="self_study">Self Study</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Points Earned</Label>
                <Input type="number" placeholder="0" />
              </div>
            </div>
            <div>
              <Label>Provider</Label>
              <Input placeholder="Training provider or organization" />
            </div>
            <div>
              <Label>Date Completed</Label>
              <Input type="date" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCpdDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]">Log Activity</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Trust Transaction Dialog */}
      <Dialog open={trustDialogOpen} onOpenChange={setTrustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Trust Transaction</DialogTitle>
            <DialogDescription>Record a deposit, withdrawal, or transfer</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Transaction Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="withdrawal">Withdrawal</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Matter Reference</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select matter" />
                </SelectTrigger>
                <SelectContent>
                  {matters.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.matterNumber} - {m.clientName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount</Label>
              <Input type="number" placeholder="0.00" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea placeholder="Transaction description" />
            </div>
            <div>
              <Label>Reference</Label>
              <Input placeholder="Bank reference or receipt number" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTrustDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]">Record Transaction</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Matter Dialog */}
      <Dialog open={matterDialogOpen} onOpenChange={setMatterDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedMatter ? 'Matter Details' : 'New Matter'}</DialogTitle>
            <DialogDescription>
              {selectedMatter ? 'View matter details and documents' : 'Create a new client matter'}
            </DialogDescription>
          </DialogHeader>
          {selectedMatter && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-[#757575]">Matter Number</Label>
                  <p className="font-medium">{selectedMatter.matterNumber}</p>
                </div>
                <div>
                  <Label className="text-xs text-[#757575]">Status</Label>
                  <div className="mt-1">{getMatterStatusBadge(selectedMatter.status)}</div>
                </div>
                <div>
                  <Label className="text-xs text-[#757575]">Client</Label>
                  <p className="font-medium">{selectedMatter.clientName}</p>
                </div>
                <div>
                  <Label className="text-xs text-[#757575]">Matter Type</Label>
                  <p className="font-medium">{selectedMatter.matterType}</p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xl font-bold">{selectedMatter.documents}</p>
                  <p className="text-xs text-[#757575]">Documents</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xl font-bold">{selectedMatter.billableHours}</p>
                  <p className="text-xs text-[#757575]">Billable Hours</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xl font-bold">{formatCurrency(selectedMatter.totalFees)}</p>
                  <p className="text-xs text-[#757575]">Total Fees</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setMatterDialogOpen(false); setSelectedMatter(null) }}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
