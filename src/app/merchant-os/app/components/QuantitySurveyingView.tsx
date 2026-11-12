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
  Calculator,
  FileText,
  Building2,
  DollarSign,
  Calendar,
  Plus,
  Search,
  Download,
  Printer,
  RefreshCw,
  Eye,
  Edit,
  Clock,
  TrendingUp,
  TrendingDown,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Award,
  Briefcase,
  Scale,
  ClipboardList,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileSignature,
  BookOpen,
  Layers,
  GitBranch,
  FileSpreadsheet,
  Users,
  BarChart3,
  Percent,
  Hash,
  MapPin,
  CreditCard,
  Settings,
} from 'lucide-react'

// Types specific to Quantity Surveying
type ProjectStatus = 'planning' | 'tender' | 'construction' | 'practical_completion' | 'final_account' | 'closed'
type ContractType = 'jbcc' | 'fidic' | 'gcc' | 'nec' | 'colto' | 'custom'
type CertificateType = 'interim' | 'final' | 'variation' | 'advance' | 'retention'
type SACQSPCategory = 'candidate' | 'professional' | 'registered' | 'retired'
type SACQSPStatus = 'active' | 'pending_renewal' | 'lapsed' | 'suspended'
type VariationStatus = 'pending' | 'approved' | 'rejected' | 'incorporated'
type BOQStatus = 'draft' | 'tender' | 'awarded' | 'final'

interface QSProject {
  id: string
  projectNumber: string
  projectName: string
  client: string
  clientContact: string
  location: string
  province: string
  contractType: ContractType
  contractValue: number
  originalContractValue: number
  variationsTotal: number
  certifiedToDate: number
  retentionHeld: number
  retentionReleased: number
  status: ProjectStatus
  startDate: string
  practicalCompletionDate?: string
  finalCompletionDate?: string
  cidbGrade: string
  cidbNumber?: string
  nhbrcEnrolled: boolean
  nhbrcEnrolmentFee: number
  principalAgent: string
  contractor: string
  boqStatus: BOQStatus
  progress: number
  createdAt: string
}

interface BillOfQuantities {
  id: string
  projectId: string
  projectNumber: string
  projectName: string
  boqNumber: string
  revision: string
  measuringSystem: 'ssmbw' | 'custom'
  status: BOQStatus
  totalAmount: number
  preliminaryAmount: number
  contingencyAmount: number
  provisionalSums: number
  sections: BOQSection[]
  preparedBy: string
  preparedDate: string
  checkedBy?: string
  checkedDate?: string
}

interface BOQSection {
  id: string
  code: string
  name: string
  description: string
  amount: number
  percentage: number
}

interface VariationOrder {
  id: string
  variationNumber: string
  projectId: string
  projectNumber: string
  projectName: string
  description: string
  reason: string
  amount: number
  extensionOfTime: number // days
  status: VariationStatus
  submittedDate: string
  approvedDate?: string
  approvedBy?: string
  incorporatedInCertificate?: string
  documents: string[]
}

interface PaymentCertificate {
  id: string
  certificateNumber: string
  certificateType: CertificateType
  projectId: string
  projectNumber: string
  projectName: string
  certificateDate: string
  valuationPeriodStart: string
  valuationPeriodEnd: string
  workDoneAmount: number
  materialsOnSiteAmount: number
  retentionAmount: number
  previousCertifiedAmount: number
  currentCertifiedAmount: number
  netAmountDue: number
  vatAmount: number
  totalDue: number
  status: 'draft' | 'issued' | 'paid'
  issuedDate?: string
  paidDate?: string
}

interface SACQSPRegistration {
  id: string
  practitionerName: string
  registrationNumber: string
  category: SACQSPCategory
  status: SACQSPStatus
  registrationDate: string
  expiryDate: string
  practiceName?: string
  practiceNumber?: string
  practiceRegistrationType?: 'sole' | 'partnership' | 'company'
  cpdPoints: number
  cpdRequired: number
  cpdPeriod: string
  renewalReminder: boolean
  lastRenewalDate?: string
}

interface CPDActivity {
  id: string
  practitionerId: string
  practitionerName: string
  title: string
  type: 'course' | 'seminar' | 'workshop' | 'publication' | 'presentation' | 'committee' | 'research'
  points: number
  date: string
  provider: string
  certificateUrl?: string
  verified: boolean
}

interface TenderDocument {
  id: string
  projectId: string
  projectNumber: string
  projectName: string
  documentType: 'invitation' | 'boq' | 'specifications' | 'drawings' | 'conditions' | 'addendum'
  documentNumber: string
  revision: string
  issueDate: string
  closingDate: string
  numberOfTenderers: number
  tendersReceived: number
  status: 'preparation' | 'issued' | 'closed' | 'adjudicated' | 'awarded'
  recommendedTenderer?: string
  recommendedAmount?: number
}

export function QuantitySurveyingView() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Data states
  const [projects, setProjects] = useState<QSProject[]>([])
  const [boqs, setBoqs] = useState<BillOfQuantities[]>([])
  const [variations, setVariations] = useState<VariationOrder[]>([])
  const [certificates, setCertificates] = useState<PaymentCertificate[]>([])
  const [sacqspRegistrations, setSacqspRegistrations] = useState<SACQSPRegistration[]>([])
  const [cpdActivities, setCpdActivities] = useState<CPDActivity[]>([])
  const [tenders, setTenders] = useState<TenderDocument[]>([])

  // Dialog states
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false)
  const [newVariationDialogOpen, setNewVariationDialogOpen] = useState(false)
  const [newCertificateDialogOpen, setNewCertificateDialogOpen] = useState(false)
  const [cpdDialogOpen, setCpdDialogOpen] = useState(false)

  // Update time
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Mock data
  useEffect(() => {
    const timer = setTimeout(() => {
      setProjects([
        {
          id: 'proj-1',
          projectNumber: 'QS-2026-001',
          projectName: 'Luxury Residential Development - Sandton',
          client: 'Horizon Properties (Pty) Ltd',
          clientContact: 'Johan van der Berg',
          location: '123 Rivonia Road, Sandton',
          province: 'Gauteng',
          contractType: 'jbcc',
          contractValue: 45000000,
          originalContractValue: 42000000,
          variationsTotal: 3000000,
          certifiedToDate: 28500000,
          retentionHeld: 1425000,
          retentionReleased: 0,
          status: 'construction',
          startDate: '2025-06-01',
          cidbGrade: '9GB',
          cidbNumber: 'CIDB-123456',
          nhbrcEnrolled: true,
          nhbrcEnrolmentFee: 112500,
          principalAgent: 'RMB Architects',
          contractor: 'Murray & Roberts Construction',
          boqStatus: 'awarded',
          progress: 65,
          createdAt: '2025-04-15'
        },
        {
          id: 'proj-2',
          projectNumber: 'QS-2026-002',
          projectName: 'Commercial Office Park - Pretoria',
          client: 'Tshwane Development Corporation',
          clientContact: 'Thandi Ndlovu',
          location: '475 Steve Biko Road, Pretoria',
          province: 'Gauteng',
          contractType: 'fidic',
          contractValue: 85000000,
          originalContractValue: 85000000,
          variationsTotal: 0,
          certifiedToDate: 21250000,
          retentionHeld: 1062500,
          retentionReleased: 0,
          status: 'construction',
          startDate: '2025-09-01',
          cidbGrade: '9GB',
          cidbNumber: 'CIDB-234567',
          nhbrcEnrolled: false,
          nhbrcEnrolmentFee: 0,
          principalAgent: 'Boogertman Architects',
          contractor: 'WBHO Construction',
          boqStatus: 'awarded',
          progress: 25,
          createdAt: '2025-07-20'
        },
        {
          id: 'proj-3',
          projectNumber: 'QS-2026-003',
          projectName: 'Municipal Sports Complex - Durban',
          client: 'eThekwini Municipality',
          clientContact: 'Sipho Mkhize',
          location: '15 Kings Park Avenue, Durban',
          province: 'KwaZulu-Natal',
          contractType: 'gcc',
          contractValue: 35000000,
          originalContractValue: 35000000,
          variationsTotal: 1500000,
          certifiedToDate: 35000000,
          retentionHeld: 0,
          retentionReleased: 1750000,
          status: 'final_account',
          startDate: '2024-01-15',
          practicalCompletionDate: '2025-12-20',
          cidbGrade: '8GB',
          cidbNumber: 'CIDB-345678',
          nhbrcEnrolled: false,
          nhbrcEnrolmentFee: 0,
          principalAgent: 'Sutherland Architects',
          contractor: 'Group Five Construction',
          boqStatus: 'final',
          progress: 100,
          createdAt: '2024-01-10'
        },
        {
          id: 'proj-4',
          projectNumber: 'QS-2026-004',
          projectName: 'Private Hospital Extension - Cape Town',
          client: 'Netcare Health Services',
          clientContact: 'Dr. Sarah Williams',
          location: '890 Main Road, Claremont, Cape Town',
          province: 'Western Cape',
          contractType: 'jbcc',
          contractValue: 62000000,
          originalContractValue: 60000000,
          variationsTotal: 2000000,
          certifiedToDate: 15500000,
          retentionHeld: 775000,
          retentionReleased: 0,
          status: 'construction',
          startDate: '2025-11-01',
          cidbGrade: '9GB',
          cidbNumber: 'CIDB-456789',
          nhbrcEnrolled: false,
          nhbrcEnrolmentFee: 0,
          principalAgent: 'AECOM SA',
          contractor: 'Stefanutti Stocks',
          boqStatus: 'awarded',
          progress: 25,
          createdAt: '2025-10-01'
        },
        {
          id: 'proj-5',
          projectNumber: 'QS-2026-005',
          projectName: 'Affordable Housing Development - Polokwane',
          client: 'Limpopo Housing Department',
          clientContact: 'Kgosi Molepo',
          location: 'Extension 22, Polokwane',
          province: 'Limpopo',
          contractType: 'nec',
          contractValue: 18000000,
          originalContractValue: 18000000,
          variationsTotal: 500000,
          certifiedToDate: 4500000,
          retentionHeld: 225000,
          retentionReleased: 0,
          status: 'construction',
          startDate: '2026-01-15',
          cidbGrade: '7GB',
          cidbNumber: 'CIDB-567890',
          nhbrcEnrolled: true,
          nhbrcEnrolmentFee: 45000,
          principalAgent: 'Indigo Architects',
          contractor: 'Raubex Construction',
          boqStatus: 'awarded',
          progress: 25,
          createdAt: '2026-01-05'
        },
      ])

      setBoqs([
        {
          id: 'boq-1',
          projectId: 'proj-1',
          projectNumber: 'QS-2026-001',
          projectName: 'Luxury Residential Development - Sandton',
          boqNumber: 'BOQ-2026-001',
          revision: 'C',
          measuringSystem: 'ssmbw',
          status: 'awarded',
          totalAmount: 42000000,
          preliminaryAmount: 2100000,
          contingencyAmount: 1050000,
          provisionalSums: 850000,
          sections: [
            { id: 's1', code: 'A', name: 'Preliminaries', description: 'General requirements and site setup', amount: 2100000, percentage: 5 },
            { id: 's2', code: 'B', name: 'Earthworks', description: 'Excavation and filling', amount: 2520000, percentage: 6 },
            { id: 's3', code: 'C', name: 'Concrete Work', description: 'Foundations and structural concrete', amount: 6300000, percentage: 15 },
            { id: 's4', code: 'D', name: 'Masonry', description: 'Brickwork and blockwork', amount: 3360000, percentage: 8 },
            { id: 's5', code: 'E', name: 'Roofing', description: 'Roof structure and covering', amount: 1680000, percentage: 4 },
            { id: 's6', code: 'F', name: 'Joinery', description: 'Doors, windows, and fittings', amount: 2940000, percentage: 7 },
            { id: 's7', code: 'G', name: 'Finishes', description: 'Plaster, tiling, painting', amount: 4620000, percentage: 11 },
            { id: 's8', code: 'H', name: 'Mechanical', description: 'HVAC and plumbing', amount: 5880000, percentage: 14 },
            { id: 's9', code: 'J', name: 'Electrical', description: 'Electrical installation', amount: 5040000, percentage: 12 },
            { id: 's10', code: 'K', name: 'External Works', description: 'Paving, landscaping, services', amount: 2520000, percentage: 6 },
            { id: 's11', code: 'L', name: 'Contingency', description: 'Provisional sum for unforeseen', amount: 1050000, percentage: 2.5 },
            { id: 's12', code: 'M', name: 'Provisional Sums', description: 'Nominated sub-contractors', amount: 850000, percentage: 2 },
          ],
          preparedBy: 'Thabo Mokoena PrQS',
          preparedDate: '2025-04-01',
          checkedBy: 'Susan van Niekerk PrQS',
          checkedDate: '2025-04-10'
        },
        {
          id: 'boq-2',
          projectId: 'proj-3',
          projectNumber: 'QS-2026-003',
          projectName: 'Municipal Sports Complex - Durban',
          boqNumber: 'BOQ-2024-003',
          revision: 'F',
          measuringSystem: 'ssmbw',
          status: 'final',
          totalAmount: 36500000,
          preliminaryAmount: 1825000,
          contingencyAmount: 0,
          provisionalSums: 0,
          sections: [
            { id: 's1', code: 'A', name: 'Preliminaries', description: 'General requirements', amount: 1825000, percentage: 5 },
            { id: 's2', code: 'B', name: 'Earthworks', description: 'Site preparation', amount: 2190000, percentage: 6 },
            { id: 's3', code: 'C', name: 'Structural Frame', description: 'Steel and concrete structure', amount: 10950000, percentage: 30 },
            { id: 's4', code: 'D', name: 'Roofing & Cladding', description: 'Roof and wall cladding', amount: 4745000, percentage: 13 },
            { id: 's5', code: 'E', name: 'Internal Finishes', description: 'Floors, walls, ceilings', amount: 3650000, percentage: 10 },
            { id: 's6', code: 'F', name: 'Services', description: 'Mechanical and electrical', amount: 9125000, percentage: 25 },
            { id: 's7', code: 'G', name: 'External Works', description: 'Parking, landscaping', amount: 4015000, percentage: 11 },
          ],
          preparedBy: 'David Naidoo PrQS',
          preparedDate: '2024-01-05',
          checkedBy: 'Thabo Mokoena PrQS',
          checkedDate: '2024-01-12'
        },
      ])

      setVariations([
        {
          id: 'var-1',
          variationNumber: 'VO-2026-001',
          projectId: 'proj-1',
          projectNumber: 'QS-2026-001',
          projectName: 'Luxury Residential Development - Sandton',
          description: 'Additional underground parking level due to municipal requirement changes',
          reason: 'Statutory requirement - Town Planning Amendment',
          amount: 1500000,
          extensionOfTime: 45,
          status: 'approved',
          submittedDate: '2025-10-15',
          approvedDate: '2025-11-01',
          approvedBy: 'Horizon Properties (Pty) Ltd',
          incorporatedInCertificate: 'CERT-2026-005',
          documents: ['VO-001-Drawings.pdf', 'VO-001-Costing.xlsx']
        },
        {
          id: 'var-2',
          variationNumber: 'VO-2026-002',
          projectId: 'proj-1',
          projectNumber: 'QS-2026-001',
          projectName: 'Luxury Residential Development - Sandton',
          description: 'Upgrade of kitchen finishes to premium specifications',
          reason: 'Client request for specification enhancement',
          amount: 800000,
          extensionOfTime: 0,
          status: 'approved',
          submittedDate: '2025-11-20',
          approvedDate: '2025-12-05',
          approvedBy: 'Horizon Properties (Pty) Ltd',
          incorporatedInCertificate: 'CERT-2026-007',
          documents: ['VO-002-Specs.pdf']
        },
        {
          id: 'var-3',
          variationNumber: 'VO-2026-003',
          projectId: 'proj-1',
          projectNumber: 'QS-2026-001',
          projectName: 'Luxury Residential Development - Sandton',
          description: 'Installation of solar PV system and battery storage',
          reason: 'Client request for green energy solution',
          amount: 700000,
          extensionOfTime: 14,
          status: 'pending',
          submittedDate: '2026-02-01',
          documents: ['VO-003-Proposal.pdf', 'VO-003-Quotations.pdf']
        },
        {
          id: 'var-4',
          variationNumber: 'VO-2026-004',
          projectId: 'proj-4',
          projectNumber: 'QS-2026-004',
          projectName: 'Private Hospital Extension - Cape Town',
          description: 'Additional medical gas outlets and upgraded HVAC system for ICU',
          reason: 'Operational requirement change',
          amount: 2000000,
          extensionOfTime: 21,
          status: 'approved',
          submittedDate: '2026-01-10',
          approvedDate: '2026-01-25',
          approvedBy: 'Netcare Health Services',
          incorporatedInCertificate: 'CERT-2026-003',
          documents: ['VO-004-Medical.pdf', 'VO-004-HVAC.pdf']
        },
        {
          id: 'var-5',
          variationNumber: 'VO-2026-005',
          projectId: 'proj-5',
          projectNumber: 'QS-2026-005',
          projectName: 'Affordable Housing Development - Polokwane',
          description: 'Additional boundary wall and security features',
          reason: 'Client request for enhanced security',
          amount: 500000,
          extensionOfTime: 7,
          status: 'pending',
          submittedDate: '2026-02-10',
          documents: ['VO-005-Security.pdf']
        },
      ])

      setCertificates([
        {
          id: 'cert-1',
          certificateNumber: 'CERT-2026-007',
          certificateType: 'interim',
          projectId: 'proj-1',
          projectNumber: 'QS-2026-001',
          projectName: 'Luxury Residential Development - Sandton',
          certificateDate: '2026-02-01',
          valuationPeriodStart: '2026-01-01',
          valuationPeriodEnd: '2026-01-31',
          workDoneAmount: 28500000,
          materialsOnSiteAmount: 1200000,
          retentionAmount: 1425000,
          previousCertifiedAmount: 25800000,
          currentCertifiedAmount: 2700000,
          netAmountDue: 2430000,
          vatAmount: 364500,
          totalDue: 2794500,
          status: 'issued',
          issuedDate: '2026-02-05'
        },
        {
          id: 'cert-2',
          certificateNumber: 'CERT-2026-004',
          certificateType: 'interim',
          projectId: 'proj-2',
          projectNumber: 'QS-2026-002',
          projectName: 'Commercial Office Park - Pretoria',
          certificateDate: '2026-02-01',
          valuationPeriodStart: '2026-01-01',
          valuationPeriodEnd: '2026-01-31',
          workDoneAmount: 21250000,
          materialsOnSiteAmount: 3500000,
          retentionAmount: 1062500,
          previousCertifiedAmount: 18000000,
          currentCertifiedAmount: 3250000,
          netAmountDue: 2925000,
          vatAmount: 438750,
          totalDue: 3363750,
          status: 'paid',
          issuedDate: '2026-02-03',
          paidDate: '2026-02-14'
        },
        {
          id: 'cert-3',
          certificateNumber: 'CERT-2026-003',
          certificateType: 'interim',
          projectId: 'proj-4',
          projectNumber: 'QS-2026-004',
          projectName: 'Private Hospital Extension - Cape Town',
          certificateDate: '2026-02-01',
          valuationPeriodStart: '2026-01-01',
          valuationPeriodEnd: '2026-01-31',
          workDoneAmount: 15500000,
          materialsOnSiteAmount: 2000000,
          retentionAmount: 775000,
          previousCertifiedAmount: 12750000,
          currentCertifiedAmount: 2750000,
          netAmountDue: 2475000,
          vatAmount: 371250,
          totalDue: 2846250,
          status: 'issued',
          issuedDate: '2026-02-07'
        },
        {
          id: 'cert-4',
          certificateNumber: 'CERT-2025-012',
          certificateType: 'final',
          projectId: 'proj-3',
          projectNumber: 'QS-2026-003',
          projectName: 'Municipal Sports Complex - Durban',
          certificateDate: '2026-01-20',
          valuationPeriodStart: '2025-12-01',
          valuationPeriodEnd: '2025-12-31',
          workDoneAmount: 36500000,
          materialsOnSiteAmount: 0,
          retentionAmount: 0,
          previousCertifiedAmount: 33250000,
          currentCertifiedAmount: 3250000,
          netAmountDue: 3250000,
          vatAmount: 487500,
          totalDue: 3737500,
          status: 'paid',
          issuedDate: '2026-01-25',
          paidDate: '2026-02-10'
        },
      ])

      setSacqspRegistrations([
        {
          id: 'sacqsp-1',
          practitionerName: 'Thabo Mokoena',
          registrationNumber: 'SACQSP-2015-1234',
          category: 'professional',
          status: 'active',
          registrationDate: '2015-06-15',
          expiryDate: '2026-06-30',
          practiceName: 'Mokoena Quantity Surveyors (Pty) Ltd',
          practiceNumber: 'P-QS-2018-456',
          practiceRegistrationType: 'company',
          cpdPoints: 28,
          cpdRequired: 25,
          cpdPeriod: '2025-2026',
          renewalReminder: true,
          lastRenewalDate: '2025-06-15'
        },
        {
          id: 'sacqsp-2',
          practitionerName: 'Susan van Niekerk',
          registrationNumber: 'SACQSP-2018-5678',
          category: 'professional',
          status: 'active',
          registrationDate: '2018-03-20',
          expiryDate: '2026-03-31',
          practiceName: 'Mokoena Quantity Surveyors (Pty) Ltd',
          practiceNumber: 'P-QS-2018-456',
          practiceRegistrationType: 'company',
          cpdPoints: 22,
          cpdRequired: 25,
          cpdPeriod: '2025-2026',
          renewalReminder: true,
          lastRenewalDate: '2025-03-20'
        },
        {
          id: 'sacqsp-3',
          practitionerName: 'David Naidoo',
          registrationNumber: 'SACQSP-2020-9012',
          category: 'professional',
          status: 'active',
          registrationDate: '2020-08-01',
          expiryDate: '2026-08-31',
          cpdPoints: 30,
          cpdRequired: 25,
          cpdPeriod: '2025-2026',
          renewalReminder: true,
          lastRenewalDate: '2025-08-01'
        },
        {
          id: 'sacqsp-4',
          practitionerName: 'Lerato Mahlangu',
          registrationNumber: 'SACQSP-2023-3456',
          category: 'candidate',
          status: 'active',
          registrationDate: '2023-01-15',
          expiryDate: '2027-01-31',
          cpdPoints: 15,
          cpdRequired: 15,
          cpdPeriod: '2025-2026',
          renewalReminder: true
        },
      ])

      setCpdActivities([
        {
          id: 'cpd-1',
          practitionerId: 'sacqsp-1',
          practitionerName: 'Thabo Mokoena',
          title: 'JBCC Contract Update Seminar 2025',
          type: 'seminar',
          points: 3,
          date: '2025-09-15',
          provider: 'SA Institute of Quantity Surveyors',
          verified: true
        },
        {
          id: 'cpd-2',
          practitionerId: 'sacqsp-1',
          practitionerName: 'Thabo Mokoena',
          title: 'Advanced Cost Estimation Techniques',
          type: 'course',
          points: 5,
          date: '2025-11-20',
          provider: 'University of Pretoria',
          verified: true
        },
        {
          id: 'cpd-3',
          practitionerId: 'sacqsp-1',
          practitionerName: 'Thabo Mokoena',
          title: 'SACQSP Annual Conference 2025',
          type: 'seminar',
          points: 4,
          date: '2025-08-10',
          provider: 'SACQSP',
          verified: true
        },
        {
          id: 'cpd-4',
          practitionerId: 'sacqsp-2',
          practitionerName: 'Susan van Niekerk',
          title: 'NEC4 Contract Management',
          type: 'workshop',
          points: 6,
          date: '2025-10-05',
          provider: 'NEC Contracts',
          verified: true
        },
        {
          id: 'cpd-5',
          practitionerId: 'sacqsp-2',
          practitionerName: 'Susan van Niekerk',
          title: 'Green Building Cost Analysis',
          type: 'course',
          points: 4,
          date: '2025-12-01',
          provider: 'Green Building Council SA',
          verified: false
        },
        {
          id: 'cpd-6',
          practitionerId: 'sacqsp-3',
          practitionerName: 'David Naidoo',
          title: 'FIDIC Contracts Masterclass',
          type: 'course',
          points: 8,
          date: '2025-07-22',
          provider: 'FIDIC International',
          verified: true
        },
        {
          id: 'cpd-7',
          practitionerId: 'sacqsp-4',
          practitionerName: 'Lerato Mahlangu',
          title: 'Measurement Principles (SSMBW)',
          type: 'course',
          points: 5,
          date: '2025-06-15',
          provider: 'SAIQS',
          verified: true
        },
      ])

      setTenders([
        {
          id: 'tender-1',
          projectId: 'proj-1',
          projectNumber: 'QS-2026-001',
          projectName: 'Luxury Residential Development - Sandton',
          documentType: 'boq',
          documentNumber: 'T-2025-001',
          revision: 'A',
          issueDate: '2025-04-15',
          closingDate: '2025-05-15',
          numberOfTenderers: 8,
          tendersReceived: 6,
          status: 'awarded',
          recommendedTenderer: 'Murray & Roberts Construction',
          recommendedAmount: 42000000
        },
        {
          id: 'tender-2',
          projectId: 'proj-6',
          projectNumber: 'QS-2026-006',
          projectName: 'School Renovation Project - Soweto',
          documentType: 'invitation',
          documentNumber: 'T-2026-002',
          revision: 'A',
          issueDate: '2026-02-01',
          closingDate: '2026-03-01',
          numberOfTenderers: 12,
          tendersReceived: 0,
          status: 'issued'
        },
      ])

      setLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // Stats
  const stats = {
    activeProjects: projects.filter(p => !['closed', 'final_account'].includes(p.status)).length,
    totalContractValue: projects.reduce((sum, p) => sum + p.contractValue, 0),
    totalVariations: variations.reduce((sum, v) => sum + v.amount, 0),
    pendingVariations: variations.filter(v => v.status === 'pending').length,
    approvedVariations: variations.filter(v => v.status === 'approved').length,
    totalCertified: certificates.reduce((sum, c) => sum + c.currentCertifiedAmount, 0),
    certificatesIssued: certificates.filter(c => c.status === 'issued').length,
    certificatesPaid: certificates.filter(c => c.status === 'paid').length,
    sacqspActive: sacqspRegistrations.filter(s => s.status === 'active').length,
    cpdCompliant: sacqspRegistrations.filter(s => s.cpdPoints >= s.cpdRequired).length,
    cpdNonCompliant: sacqspRegistrations.filter(s => s.cpdPoints < s.cpdRequired).length,
    retentionHeld: projects.reduce((sum, p) => sum + p.retentionHeld, 0),
  }

  const formatCurrency = (amount: number) => {
    return `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 0 })}`
    }

  const formatCurrencyDetailed = (amount: number) => {
    return `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`
  }

  const getContractTypeLabel = (type: ContractType) => {
    const labels: Record<ContractType, string> = {
      jbcc: 'JBCC',
      fidic: 'FIDIC',
      gcc: 'GCC 2015',
      nec: 'NEC4',
      colto: 'COLTO',
      custom: 'Custom'
    }
    return labels[type]
  }

  const getProjectStatusBadge = (status: ProjectStatus) => {
    const colors: Record<ProjectStatus, string> = {
      planning: 'bg-gray-100 text-gray-700',
      tender: 'bg-blue-100 text-blue-700',
      construction: 'bg-green-100 text-green-700',
      practical_completion: 'bg-yellow-100 text-yellow-700',
      final_account: 'bg-orange-100 text-orange-700',
      closed: 'bg-gray-100 text-gray-700'
    }
    const labels: Record<ProjectStatus, string> = {
      planning: 'Planning',
      tender: 'Tender',
      construction: 'Construction',
      practical_completion: 'Practical Completion',
      final_account: 'Final Account',
      closed: 'Closed'
    }
    return <Badge className={colors[status]}>{labels[status]}</Badge>
  }

  const getVariationStatusBadge = (status: VariationStatus) => {
    const colors: Record<VariationStatus, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      incorporated: 'bg-blue-100 text-blue-700'
    }
    return <Badge className={colors[status]}>{status}</Badge>
  }

  const getCertificateStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      issued: 'bg-blue-100 text-blue-700',
      paid: 'bg-green-100 text-green-700'
    }
    return <Badge className={colors[status]}>{status}</Badge>
  }

  const getSACQSPStatusBadge = (status: SACQSPStatus) => {
    const colors: Record<SACQSPStatus, string> = {
      active: 'bg-green-100 text-green-700',
      pending_renewal: 'bg-yellow-100 text-yellow-700',
      lapsed: 'bg-red-100 text-red-700',
      suspended: 'bg-red-100 text-red-700'
    }
    return <Badge className={colors[status]}>{status.replace('_', ' ')}</Badge>
  }

  const getSACQSPCategoryBadge = (category: SACQSPCategory) => {
    const colors: Record<SACQSPCategory, string> = {
      candidate: 'bg-blue-100 text-blue-700',
      professional: 'bg-green-100 text-green-700',
      registered: 'bg-purple-100 text-purple-700',
      retired: 'bg-gray-100 text-gray-700'
    }
    return <Badge className={colors[category]}>{category}</Badge>
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
              <Calculator className="h-5 w-5 text-[#00897B]" />
              Quantity Surveying Practice
            </h1>
            <p className="text-sm text-[#757575]">Cost management, BOQ, variations, payment certificates & SACQSP compliance</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-mono font-bold">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              <p className="text-xs text-[#757575]">{currentTime.toLocaleDateString()}</p>
            </div>

            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setNewProjectDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />New Project
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-10 gap-2">
          <div className="bg-[#E0F2F1] rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-[#00897B]">{stats.activeProjects}</p>
            <p className="text-[9px] text-[#757575]">Active Projects</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <p className="text-sm font-bold text-green-600">{formatCurrency(stats.totalContractValue)}</p>
            <p className="text-[9px] text-[#757575]">Contract Value</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-2 text-center">
            <p className="text-sm font-bold text-purple-600">{formatCurrency(stats.totalVariations)}</p>
            <p className="text-[9px] text-[#757575]">Variations</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-yellow-600">{stats.pendingVariations}</p>
            <p className="text-[9px] text-[#757575]">Pending VOs</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-2 text-center">
            <p className="text-sm font-bold text-blue-600">{formatCurrency(stats.totalCertified)}</p>
            <p className="text-[9px] text-[#757575]">Certified</p>
          </div>
          <div className="bg-cyan-50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-cyan-600">{stats.certificatesIssued}</p>
            <p className="text-[9px] text-[#757575]">Certificates Issued</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-2 text-center">
            <p className="text-sm font-bold text-orange-600">{formatCurrency(stats.retentionHeld)}</p>
            <p className="text-[9px] text-[#757575]">Retention Held</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-green-600">{stats.sacqspActive}</p>
            <p className="text-[9px] text-[#757575]">SACQSP Active</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-green-600">{stats.cpdCompliant}</p>
            <p className="text-[9px] text-[#757575]">CPD Compliant</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-amber-600">{stats.cpdNonCompliant}</p>
            <p className="text-[9px] text-[#757575]">CPD Due</p>
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
              <TabsTrigger value="projects" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Building2 className="h-4 w-4 mr-1" />Projects
              </TabsTrigger>
              <TabsTrigger value="boq" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <FileSpreadsheet className="h-4 w-4 mr-1" />BOQ
              </TabsTrigger>
              <TabsTrigger value="variations" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <GitBranch className="h-4 w-4 mr-1" />Variations
              </TabsTrigger>
              <TabsTrigger value="certificates" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <FileSignature className="h-4 w-4 mr-1" />Certificates
              </TabsTrigger>
              <TabsTrigger value="sacqsp" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <ShieldCheck className="h-4 w-4 mr-1" />SACQSP
              </TabsTrigger>
              <TabsTrigger value="cpd" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <BookOpen className="h-4 w-4 mr-1" />CPD
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 p-4">
            {/* Overview Tab */}
            <TabsContent value="overview" className="m-0">
              <div className="grid grid-cols-2 gap-4">
                {/* Active Projects Summary */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-[#00897B]" />
                      Active Projects
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {projects.filter(p => !['closed'].includes(p.status)).slice(0, 5).map(project => (
                        <div key={project.id} className="p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-sm truncate">{project.projectName}</p>
                            {getProjectStatusBadge(project.status)}
                          </div>
                          <div className="flex items-center justify-between text-xs text-[#757575]">
                            <span>{project.projectNumber} | {getContractTypeLabel(project.contractType)}</span>
                            <span>{project.progress}%</span>
                          </div>
                          <Progress value={project.progress} className="h-1.5 mt-1" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Pending Variations */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <GitBranch className="h-5 w-5 text-orange-600" />
                      Pending Variation Orders
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {variations.filter(v => v.status === 'pending').map(variation => (
                        <div key={variation.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{variation.variationNumber}</p>
                            <p className="text-xs text-[#757575] truncate">{variation.description}</p>
                          </div>
                          <div className="text-right ml-2">
                            <p className="font-bold text-sm text-orange-600">{formatCurrency(variation.amount)}</p>
                            <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C] h-6 text-xs">Review</Button>
                          </div>
                        </div>
                      ))}
                      {variations.filter(v => v.status === 'pending').length === 0 && (
                        <p className="text-center text-sm text-green-600 py-4">No pending variations</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Certificates */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileSignature className="h-5 w-5 text-[#00897B]" />
                      Recent Payment Certificates
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {certificates.slice(0, 4).map(cert => (
                        <div key={cert.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded ${cert.certificateType === 'final' ? 'bg-purple-100' : 'bg-blue-100'}`}>
                              <FileSignature className={`h-4 w-4 ${cert.certificateType === 'final' ? 'text-purple-600' : 'text-blue-600'}`} />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{cert.certificateNumber}</p>
                              <p className="text-xs text-[#757575]">{cert.certificateType} | {cert.certificateDate}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm">{formatCurrency(cert.netAmountDue)}</p>
                            {getCertificateStatusBadge(cert.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* SACQSP Compliance */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-[#00897B]" />
                      SACQSP Registration Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {sacqspRegistrations.map(reg => (
                        <div key={reg.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded ${reg.status === 'active' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                              <Award className={`h-4 w-4 ${reg.status === 'active' ? 'text-green-600' : 'text-yellow-600'}`} />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{reg.practitionerName}</p>
                              <p className="text-xs text-[#757575]">{reg.registrationNumber}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getSACQSPCategoryBadge(reg.category)}
                            <div className="text-right">
                              <p className="text-xs font-medium">{reg.cpdPoints}/{reg.cpdRequired}</p>
                              <Progress value={(reg.cpdPoints / reg.cpdRequired) * 100} className="h-1 w-12" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Contract Value Distribution */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-[#00897B]" />
                      Contract Type Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {['jbcc', 'fidic', 'gcc', 'nec'].map(type => {
                        const typeProjects = projects.filter(p => p.contractType === type)
                        const typeValue = typeProjects.reduce((sum, p) => sum + p.contractValue, 0)
                        const percentage = (typeValue / stats.totalContractValue) * 100
                        if (typeProjects.length === 0) return null
                        return (
                          <div key={type} className="p-2 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{getContractTypeLabel(type)}</span>
                              <span className="text-xs text-[#757575]">{typeProjects.length} projects</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Progress value={percentage} className="h-2 flex-1" />
                              <span className="text-xs font-medium">{percentage.toFixed(1)}%</span>
                            </div>
                            <p className="text-xs text-[#757575] mt-1">{formatCurrency(typeValue)}</p>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="h-5 w-5 text-[#00897B]" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      <div className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg">
                        <div className="p-1.5 rounded bg-blue-100">
                          <FileSignature className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Certificate CERT-2026-007 issued</p>
                          <p className="text-xs text-[#757575]">Luxury Residential Development | {formatCurrency(2430000)}</p>
                          <p className="text-xs text-[#757575]">2 hours ago</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg">
                        <div className="p-1.5 rounded bg-yellow-100">
                          <GitBranch className="h-4 w-4 text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Variation VO-2026-003 submitted</p>
                          <p className="text-xs text-[#757575]">Solar PV installation | {formatCurrency(700000)}</p>
                          <p className="text-xs text-[#757575]">1 day ago</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg">
                        <div className="p-1.5 rounded bg-green-100">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Certificate CERT-2026-004 paid</p>
                          <p className="text-xs text-[#757575]">Commercial Office Park | {formatCurrency(2925000)}</p>
                          <p className="text-xs text-[#757575]">2 days ago</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Project Portfolio</h2>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Search projects..." className="pl-9 w-64" />
                  </div>
                  <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setNewProjectDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />New Project
                  </Button>
                </div>
              </div>

              <div className="bg-white rounded-lg border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left p-3 font-medium">Project</th>
                        <th className="text-left p-3 font-medium">Client</th>
                        <th className="text-left p-3 font-medium">Contract</th>
                        <th className="text-right p-3 font-medium">Contract Value</th>
                        <th className="text-right p-3 font-medium">Variations</th>
                        <th className="text-right p-3 font-medium">Certified</th>
                        <th className="text-right p-3 font-medium">Retention</th>
                        <th className="text-center p-3 font-medium">Progress</th>
                        <th className="text-center p-3 font-medium">Status</th>
                        <th className="text-center p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map(project => (
                        <tr key={project.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            <div>
                              <p className="font-medium">{project.projectName}</p>
                              <p className="text-xs text-[#757575]">{project.projectNumber}</p>
                              <p className="text-xs text-[#757575]">{project.location}</p>
                            </div>
                          </td>
                          <td className="p-3">
                            <p className="font-medium">{project.client}</p>
                            <p className="text-xs text-[#757575]">{project.clientContact}</p>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline">{getContractTypeLabel(project.contractType)}</Badge>
                            <p className="text-xs text-[#757575] mt-1">{project.cidbGrade}</p>
                            {project.nhbrcEnrolled && (
                              <p className="text-xs text-green-600">NHBRC Enrolled</p>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <p className="font-medium">{formatCurrency(project.contractValue)}</p>
                            {project.originalContractValue !== project.contractValue && (
                              <p className="text-xs text-[#757575]">Orig: {formatCurrency(project.originalContractValue)}</p>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <p className={`font-medium ${project.variationsTotal > 0 ? 'text-orange-600' : ''}`}>
                              {formatCurrency(project.variationsTotal)}
                            </p>
                          </td>
                          <td className="p-3 text-right">
                            <p className="font-medium">{formatCurrency(project.certifiedToDate)}</p>
                            <p className="text-xs text-[#757575]">{((project.certifiedToDate / project.contractValue) * 100).toFixed(1)}%</p>
                          </td>
                          <td className="p-3 text-right">
                            <p className="font-medium text-orange-600">{formatCurrency(project.retentionHeld)}</p>
                            {project.retentionReleased > 0 && (
                              <p className="text-xs text-green-600">Released: {formatCurrency(project.retentionReleased)}</p>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <div className="w-16 mx-auto">
                              <Progress value={project.progress} className="h-2" />
                              <p className="text-xs mt-1">{project.progress}%</p>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            {getProjectStatusBadge(project.status)}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button size="sm" variant="ghost"><Eye className="h-4 w-4" /></Button>
                              <Button size="sm" variant="ghost"><Edit className="h-4 w-4" /></Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* BOQ Tab */}
            <TabsContent value="boq" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Bill of Quantities</h2>
                <div className="flex gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Layers className="h-3 w-3" /> SSMBW Standard
                  </Badge>
                  <Button className="bg-[#00897B] hover:bg-[#00695C]">
                    <Plus className="h-4 w-4 mr-2" />New BOQ
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {boqs.map(boq => (
                  <Card key={boq.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold">{boq.boqNumber}</p>
                            <Badge variant="outline">Rev {boq.revision}</Badge>
                            <Badge className={boq.status === 'final' ? 'bg-green-100 text-green-700' : boq.status === 'awarded' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}>
                              {boq.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-[#757575] mt-1">{boq.projectName}</p>
                          <p className="text-xs text-[#757575]">Measuring System: {boq.measuringSystem.toUpperCase()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-[#00897B]">{formatCurrency(boq.totalAmount)}</p>
                          <p className="text-xs text-[#757575]">Prepared: {boq.preparedDate}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4 mb-4">
                        <div className="bg-gray-50 rounded-lg p-2 text-center">
                          <p className="text-xs text-[#757575]">Preliminaries</p>
                          <p className="font-medium">{formatCurrency(boq.preliminaryAmount)}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2 text-center">
                          <p className="text-xs text-[#757575]">Contingency</p>
                          <p className="font-medium">{formatCurrency(boq.contingencyAmount)}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2 text-center">
                          <p className="text-xs text-[#757575]">Provisional Sums</p>
                          <p className="font-medium">{formatCurrency(boq.provisionalSums)}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2 text-center">
                          <p className="text-xs text-[#757575]">Sections</p>
                          <p className="font-medium">{boq.sections.length}</p>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <p className="text-sm font-medium mb-2">Section Breakdown (SSMBW)</p>
                        <div className="grid grid-cols-6 gap-2">
                          {boq.sections.map(section => (
                            <div key={section.id} className="bg-gray-50 rounded p-2 text-center">
                              <p className="text-xs font-bold">{section.code}</p>
                              <p className="text-[10px] text-[#757575] truncate">{section.name}</p>
                              <p className="text-xs font-medium mt-1">{formatCurrency(section.amount)}</p>
                              <p className="text-[10px] text-[#757575]">{section.percentage}%</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <div className="flex items-center gap-4 text-xs text-[#757575]">
                          <span>Prepared by: {boq.preparedBy}</span>
                          {boq.checkedBy && <span>Checked by: {boq.checkedBy}</span>}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Download className="h-3 w-3 mr-1" />Export
                          </Button>
                          <Button size="sm" variant="outline">
                            <Printer className="h-3 w-3 mr-1" />Print
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Variations Tab */}
            <TabsContent value="variations" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Variation Orders</h2>
                <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setNewVariationDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />New Variation
                </Button>
              </div>

              <div className="space-y-3">
                {variations.map(variation => (
                  <Card key={variation.id} className={variation.status === 'pending' ? 'border-yellow-300' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg ${
                            variation.status === 'approved' ? 'bg-green-100' :
                            variation.status === 'pending' ? 'bg-yellow-100' :
                            variation.status === 'rejected' ? 'bg-red-100' : 'bg-blue-100'
                          }`}>
                            <GitBranch className={`h-5 w-5 ${
                              variation.status === 'approved' ? 'text-green-600' :
                              variation.status === 'pending' ? 'text-yellow-600' :
                              variation.status === 'rejected' ? 'text-red-600' : 'text-blue-600'
                            }`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold">{variation.variationNumber}</p>
                              {getVariationStatusBadge(variation.status)}
                            </div>
                            <p className="text-sm text-[#757575] mt-1">{variation.projectName}</p>
                            <p className="text-sm mt-2">{variation.description}</p>
                            <p className="text-xs text-[#757575] mt-1">Reason: {variation.reason}</p>
                            {variation.extensionOfTime > 0 && (
                              <p className="text-xs text-orange-600 mt-1">
                                <Clock className="h-3 w-3 inline mr-1" />
                                EOT: {variation.extensionOfTime} days
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-[#00897B]">{formatCurrency(variation.amount)}</p>
                          <p className="text-xs text-[#757575]">Submitted: {variation.submittedDate}</p>
                          {variation.approvedDate && (
                            <p className="text-xs text-green-600">Approved: {variation.approvedDate}</p>
                          )}
                          {variation.incorporatedInCertificate && (
                            <p className="text-xs text-blue-600">In: {variation.incorporatedInCertificate}</p>
                          )}
                          {variation.status === 'pending' && (
                            <div className="flex gap-2 mt-2">
                              <Button size="sm" className="bg-green-600 hover:bg-green-700">Approve</Button>
                              <Button size="sm" variant="destructive">Reject</Button>
                            </div>
                          )}
                        </div>
                      </div>
                      {variation.documents.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-[#757575] mb-1">Documents</p>
                          <div className="flex gap-2">
                            {variation.documents.map((doc, idx) => (
                              <Badge key={idx} variant="outline" className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />{doc}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Certificates Tab */}
            <TabsContent value="certificates" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Payment Certificates</h2>
                <div className="flex gap-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Certificate Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="interim">Interim</SelectItem>
                      <SelectItem value="final">Final</SelectItem>
                      <SelectItem value="variation">Variation</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setNewCertificateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />New Certificate
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {certificates.map(cert => (
                  <Card key={cert.id} className={cert.status === 'issued' ? 'border-blue-300' : cert.status === 'paid' ? 'border-green-300' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg ${
                            cert.certificateType === 'final' ? 'bg-purple-100' :
                            cert.status === 'paid' ? 'bg-green-100' : 'bg-blue-100'
                          }`}>
                            <FileSignature className={`h-5 w-5 ${
                              cert.certificateType === 'final' ? 'text-purple-600' :
                              cert.status === 'paid' ? 'text-green-600' : 'text-blue-600'
                            }`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold">{cert.certificateNumber}</p>
                              <Badge variant="outline">{cert.certificateType}</Badge>
                              {getCertificateStatusBadge(cert.status)}
                            </div>
                            <p className="text-sm text-[#757575] mt-1">{cert.projectName}</p>
                            <p className="text-xs text-[#757575]">
                              Period: {cert.valuationPeriodStart} - {cert.valuationPeriodEnd}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-[#00897B]">{formatCurrency(cert.netAmountDue)}</p>
                          <p className="text-xs text-[#757575]">VAT: {formatCurrency(cert.vatAmount)}</p>
                          <p className="text-lg font-bold">{formatCurrency(cert.totalDue)}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-5 gap-4 mt-4 pt-4 border-t">
                        <div className="text-center">
                          <p className="text-xs text-[#757575]">Work Done</p>
                          <p className="font-medium">{formatCurrency(cert.workDoneAmount)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-[#757575]">Materials on Site</p>
                          <p className="font-medium">{formatCurrency(cert.materialsOnSiteAmount)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-[#757575]">Retention</p>
                          <p className="font-medium text-orange-600">{formatCurrency(cert.retentionAmount)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-[#757575]">Previous Certified</p>
                          <p className="font-medium">{formatCurrency(cert.previousCertifiedAmount)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-[#757575]">Current Amount</p>
                          <p className="font-bold text-green-600">{formatCurrency(cert.currentCertifiedAmount)}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <div className="text-xs text-[#757575]">
                          Certificate Date: {cert.certificateDate}
                          {cert.issuedDate && ` | Issued: ${cert.issuedDate}`}
                          {cert.paidDate && ` | Paid: ${cert.paidDate}`}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />View
                          </Button>
                          <Button size="sm" variant="outline">
                            <Printer className="h-3 w-3 mr-1" />Print
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="h-3 w-3 mr-1" />PDF
                          </Button>
                          {cert.status === 'issued' && (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                              Mark Paid
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* SACQSP Tab */}
            <TabsContent value="sacqsp" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">SACQSP Registration</h2>
                  <p className="text-sm text-[#757575]">South African Council for the Quantity Surveying Profession</p>
                </div>
                <Button className="bg-[#00897B] hover:bg-[#00695C]">
                  <Plus className="h-4 w-4 mr-2" />Add Practitioner
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <Card className="bg-green-50">
                  <CardContent className="p-4 text-center">
                    <ShieldCheck className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-600">{stats.sacqspActive}</p>
                    <p className="text-sm text-[#757575]">Active Registrations</p>
                  </CardContent>
                </Card>
                <Card className="bg-blue-50">
                  <CardContent className="p-4 text-center">
                    <Award className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-600">{sacqspRegistrations.filter(s => s.category === 'professional').length}</p>
                    <p className="text-sm text-[#757575]">Professional QS</p>
                  </CardContent>
                </Card>
                <Card className="bg-purple-50">
                  <CardContent className="p-4 text-center">
                    <BookOpen className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-purple-600">{sacqspRegistrations.filter(s => s.category === 'candidate').length}</p>
                    <p className="text-sm text-[#757575]">Candidate QS</p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-3">
                {sacqspRegistrations.map(reg => (
                  <Card key={reg.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg ${reg.status === 'active' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                            <Award className={`h-5 w-5 ${reg.status === 'active' ? 'text-green-600' : 'text-yellow-600'}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold">{reg.practitionerName}</p>
                              {getSACQSPCategoryBadge(reg.category)}
                              {getSACQSPStatusBadge(reg.status)}
                            </div>
                            <p className="text-sm text-[#757575]">{reg.registrationNumber}</p>
                            {reg.practiceName && (
                              <p className="text-sm text-[#757575] mt-1">
                                <Building2 className="h-3 w-3 inline mr-1" />
                                {reg.practiceName} ({reg.practiceNumber})
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-[#757575]">Registration Period</p>
                          <p className="font-medium">{reg.registrationDate} - {reg.expiryDate}</p>
                          <div className="mt-2">
                            <p className="text-xs text-[#757575]">CPD Points ({reg.cpdPeriod})</p>
                            <div className="flex items-center justify-end gap-2">
                              <Progress value={(reg.cpdPoints / reg.cpdRequired) * 100} className="h-2 w-16" />
                              <span className={`text-sm font-medium ${reg.cpdPoints >= reg.cpdRequired ? 'text-green-600' : 'text-orange-600'}`}>
                                {reg.cpdPoints}/{reg.cpdRequired}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            {reg.cpdPoints >= reg.cpdRequired ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-orange-600" />
                            )}
                            <span className="text-sm">
                              CPD {reg.cpdPoints >= reg.cpdRequired ? 'Compliant' : `${reg.cpdRequired - reg.cpdPoints} points needed`}
                            </span>
                          </div>
                          {reg.renewalReminder && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />Renewal Reminder Active
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <BookOpen className="h-3 w-3 mr-1" />CPD Log
                          </Button>
                          <Button size="sm" variant="outline">
                            <RefreshCw className="h-3 w-3 mr-1" />Renew
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Practice Registration Info */}
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-[#00897B]" />
                    Practice Registration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="font-medium">Mokoena Quantity Surveyors (Pty) Ltd</p>
                      <p className="text-sm text-[#757575]">Practice Number: P-QS-2018-456</p>
                      <p className="text-sm text-[#757575]">Registration Type: Company</p>
                      <Badge className="mt-2 bg-green-100 text-green-700">Active</Badge>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-[#757575] mb-2">Annual Renewal Status</p>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Current Year: 2026</span>
                      </div>
                      <p className="text-xs text-[#757575] mt-2">Next Renewal: 31 December 2026</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* CPD Tab */}
            <TabsContent value="cpd" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Continuing Professional Development</h2>
                <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setCpdDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />Add Activity
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                {sacqspRegistrations.map(reg => (
                  <Card key={reg.id} className={reg.cpdPoints < reg.cpdRequired ? 'border-orange-300' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${reg.cpdPoints >= reg.cpdRequired ? 'bg-green-100' : 'bg-orange-100'}`}>
                            <Award className={`h-5 w-5 ${reg.cpdPoints >= reg.cpdRequired ? 'text-green-600' : 'text-orange-600'}`} />
                          </div>
                          <div>
                            <p className="font-bold">{reg.practitionerName}</p>
                            <p className="text-xs text-[#757575]">{reg.registrationNumber}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{reg.cpdPoints}/{reg.cpdRequired}</p>
                          <Progress value={(reg.cpdPoints / reg.cpdRequired) * 100} className="h-2 w-24" />
                          <Badge className={`mt-2 ${reg.cpdPoints >= reg.cpdRequired ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {reg.cpdPoints >= reg.cpdRequired ? 'Compliant' : `${reg.cpdRequired - reg.cpdPoints} points needed`}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Recent CPD Activities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {cpdActivities.map(activity => (
                      <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded ${activity.verified ? 'bg-green-100' : 'bg-gray-100'}`}>
                            {activity.verified ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <Clock className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{activity.title}</p>
                            <p className="text-xs text-[#757575]">
                              {activity.practitionerName} | {activity.type} | {activity.provider}
                            </p>
                            <p className="text-xs text-[#757575]">{activity.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="text-green-600">+{activity.points} points</Badge>
                          {!activity.verified && (
                            <p className="text-xs text-orange-600 mt-1">Pending verification</p>
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

      {/* New Project Dialog */}
      <Dialog open={newProjectDialogOpen} onOpenChange={setNewProjectDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
            <DialogDescription>Create a new quantity surveying project</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label>Project Name</Label>
              <Input placeholder="Enter project name" />
            </div>
            <div>
              <Label>Project Number</Label>
              <Input placeholder="QS-2026-XXX" />
            </div>
            <div>
              <Label>Client</Label>
              <Input placeholder="Client name" />
            </div>
            <div>
              <Label>Client Contact</Label>
              <Input placeholder="Contact person" />
            </div>
            <div>
              <Label>Location</Label>
              <Input placeholder="Project address" />
            </div>
            <div>
              <Label>Province</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select province" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gauteng">Gauteng</SelectItem>
                  <SelectItem value="western_cape">Western Cape</SelectItem>
                  <SelectItem value="kzn">KwaZulu-Natal</SelectItem>
                  <SelectItem value="eastern_cape">Eastern Cape</SelectItem>
                  <SelectItem value="limpopo">Limpopo</SelectItem>
                  <SelectItem value="mpumalanga">Mpumalanga</SelectItem>
                  <SelectItem value="north_west">North West</SelectItem>
                  <SelectItem value="free_state">Free State</SelectItem>
                  <SelectItem value="northern_cape">Northern Cape</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Contract Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select contract type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jbcc">JBCC</SelectItem>
                  <SelectItem value="fidic">FIDIC</SelectItem>
                  <SelectItem value="gcc">GCC 2015</SelectItem>
                  <SelectItem value="nec">NEC4</SelectItem>
                  <SelectItem value="colto">COLTO</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>CIDB Grade</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select CIDB grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1gb">1GB</SelectItem>
                  <SelectItem value="2gb">2GB</SelectItem>
                  <SelectItem value="3gb">3GB</SelectItem>
                  <SelectItem value="4gb">4GB</SelectItem>
                  <SelectItem value="5gb">5GB</SelectItem>
                  <SelectItem value="6gb">6GB</SelectItem>
                  <SelectItem value="7gb">7GB</SelectItem>
                  <SelectItem value="8gb">8GB</SelectItem>
                  <SelectItem value="9gb">9GB</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Contract Value</Label>
              <Input type="number" placeholder="0.00" />
            </div>
            <div>
              <Label>Start Date</Label>
              <Input type="date" />
            </div>
            <div className="col-span-2">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="nhbrc" className="rounded" />
                <Label htmlFor="nhbrc">NHBRC Enrolment Required</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewProjectDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]">Create Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Variation Dialog */}
      <Dialog open={newVariationDialogOpen} onOpenChange={setNewVariationDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>New Variation Order</DialogTitle>
            <DialogDescription>Submit a new variation order</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Project</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.projectNumber} - {p.projectName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea placeholder="Describe the variation" />
            </div>
            <div>
              <Label>Reason</Label>
              <Textarea placeholder="Reason for variation" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Amount</Label>
                <Input type="number" placeholder="0.00" />
              </div>
              <div>
                <Label>Extension of Time (days)</Label>
                <Input type="number" placeholder="0" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewVariationDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]">Submit Variation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Certificate Dialog */}
      <Dialog open={newCertificateDialogOpen} onOpenChange={setNewCertificateDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>New Payment Certificate</DialogTitle>
            <DialogDescription>Generate a new payment certificate</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Project</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.filter(p => p.status === 'construction').map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.projectNumber} - {p.projectName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Certificate Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="interim">Interim Certificate</SelectItem>
                  <SelectItem value="final">Final Certificate</SelectItem>
                  <SelectItem value="variation">Variation Certificate</SelectItem>
                  <SelectItem value="advance">Advance Payment Certificate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valuation Period Start</Label>
                <Input type="date" />
              </div>
              <div>
                <Label>Valuation Period End</Label>
                <Input type="date" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewCertificateDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]">Generate Certificate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CPD Activity Dialog */}
      <Dialog open={cpdDialogOpen} onOpenChange={setCpdDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Add CPD Activity</DialogTitle>
            <DialogDescription>Record a new CPD activity</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Practitioner</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select practitioner" />
                </SelectTrigger>
                <SelectContent>
                  {sacqspRegistrations.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.practitionerName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Activity Title</Label>
              <Input placeholder="Enter activity title" />
            </div>
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
                  <SelectItem value="publication">Publication</SelectItem>
                  <SelectItem value="presentation">Presentation</SelectItem>
                  <SelectItem value="committee">Committee Work</SelectItem>
                  <SelectItem value="research">Research</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>CPD Points</Label>
                <Input type="number" placeholder="0" />
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" />
              </div>
            </div>
            <div>
              <Label>Provider</Label>
              <Input placeholder="Training provider / institution" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCpdDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]">Add Activity</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
