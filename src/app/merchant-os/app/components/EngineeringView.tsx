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
  Building2,
  Cog,
  Zap,
  Wrench,
  HardHat,
  FileText,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  Download,
  Printer,
  Eye,
  Edit,
  TrendingUp,
  TrendingDown,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  AlertCircle,
  Award,
  Briefcase,
  UserCheck,
  ClipboardList,
  FileCheck,
  Users,
  Target,
  Milestone,
  Timer,
  Receipt,
  Building,
  MapPin,
  BookOpen,
  BadgeCheck,
  RefreshCw,
  Ban,
} from 'lucide-react'

// Types specific to Engineering Services in South Africa
type ProjectStatus = 'planning' | 'design' | 'approval' | 'construction' | 'inspection' | 'completed' | 'on_hold' | 'cancelled'
type EngineeringDiscipline = 'civil' | 'structural' | 'electrical' | 'mechanical' | 'geotechnical' | 'environmental' | 'project_management'
type ECSARegistrationLevel = 'candidate' | 'professional_engineer' | 'professional_engineering_technologist' | 'professional_certificated_engineer' | 'professional_engineering_technician'
type CPDCategory = 'category_1' | 'category_2' | 'category_3'
type DeliverableType = 'drawings' | 'specifications' | 'reports' | 'calculations' | 'models' | 'bills_of_quantities'
type SubmissionStatus = 'pending' | 'submitted' | 'approved' | 'rejected' | 'revision_required'
type AuthorityType = 'municipality' | 'provincial' | 'national' | 'nhbrc' | 'cidb' | 'sabs'

interface EngineeringProject {
  id: string
  projectNumber: string
  title: string
  discipline: EngineeringDiscipline
  client: Client
  location: string
  province: string
  projectValue: number
  feeAmount: number
  feeType: 'fixed' | 'percentage' | 'hourly' | 'hybrid'
  status: ProjectStatus
  startDate: string
  estimatedCompletion: string
  actualCompletion?: string
  progress: number
  projectManager: string
  teamMembers: TeamMember[]
  milestones: Milestone[]
  deliverables: Deliverable[]
  billableHours: number
  budgetedHours: number
  expenses: number
  cidbGrade?: string
  nhbrcRequired: boolean
  nhbrcEnrollmentNumber?: string
  createdAt: string
}

interface Client {
  id: string
  name: string
  contactPerson: string
  phone: string
  email: string
  address: string
  type: 'government' | 'private' | 'municipal' | 'parastatal'
}

interface TeamMember {
  id: string
  name: string
  role: string
  ecsaNumber?: string
  ecsaLevel?: ECSARegistrationLevel
  hourlyRate: number
}

interface Milestone {
  id: string
  name: string
  description: string
  dueDate: string
  completedDate?: string
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  billingAmount: number
  billed: boolean
}

interface Deliverable {
  id: string
  type: DeliverableType
  title: string
  description: string
  revision: string
  status: 'draft' | 'review' | 'approved' | 'issued'
  issuedDate?: string
  issuedTo?: string
}

interface TimeEntry {
  id: string
  projectId: string
  projectName: string
  staffId: string
  staffName: string
  date: string
  hours: number
  description: string
  billable: boolean
  hourlyRate: number
  totalAmount: number
  approved: boolean
}

interface ExpenseEntry {
  id: string
  projectId: string
  projectName: string
  date: string
  category: 'travel' | 'materials' | 'testing' | 'printing' | 'consultant' | 'other'
  description: string
  amount: number
  receiptAvailable: boolean
  approved: boolean
  invoiceToClient: boolean
}

interface ECSARegistration {
  id: string
  staffId: string
  staffName: string
  ecsaNumber: string
  registrationLevel: ECSARegistrationLevel
  registrationDate: string
  expiryDate: string
  status: 'active' | 'pending_renewal' | 'expired' | 'suspended'
  certificateUrl?: string
  disciplines: string[]
}

interface CPDRecord {
  id: string
  staffId: string
  staffName: string
  activityTitle: string
  category: CPDCategory
  points: number
  activityDate: string
  provider: string
  certificateUrl?: string
  verified: boolean
  cycleYear: number
  cyclePointsTotal: number
  cyclePointsRequired: number
}

interface LocalAuthoritySubmission {
  id: string
  projectId: string
  projectName: string
  authorityType: AuthorityType
  authorityName: string
  submissionType: string
  referenceNumber?: string
  submittedDate: string
  status: SubmissionStatus
  approvedDate?: string
  comments?: string
  documents: DocumentRecord[]
}

interface DocumentRecord {
  id: string
  name: string
  type: string
  status: 'pending' | 'uploaded' | 'verified'
  uploadedAt?: string
}

interface SABSStandard {
  id: string
  code: string
  title: string
  category: string
  lastRevision: string
  applicable: boolean
}

export function EngineeringView() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Data states
  const [projects, setProjects] = useState<EngineeringProject[]>([])
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([])
  const [ecsaRegistrations, setEcsaRegistrations] = useState<ECSARegistration[]>([])
  const [cpdRecords, setCpdRecords] = useState<CPDRecord[]>([])
  const [authoritySubmissions, setAuthoritySubmissions] = useState<LocalAuthoritySubmission[]>([])
  const [sabsStandards, setSabsStandards] = useState<SABSStandard[]>([])

  // Dialog states
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false)
  const [newTimeEntryDialogOpen, setNewTimeEntryDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<EngineeringProject | null>(null)

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
          projectNumber: 'ENG-2026-001',
          title: 'Water Treatment Plant Upgrade - Ekurhuleni',
          discipline: 'civil',
          client: {
            id: 'client-1',
            name: 'Ekurhuleni Metropolitan Municipality',
            contactPerson: 'Mr. Thabo Molefe',
            phone: '0119990000',
            email: 'tmolefe@ekurhuleni.gov.za',
            address: 'Germiston, Gauteng',
            type: 'municipal'
          },
          location: 'Germiston',
          province: 'Gauteng',
          projectValue: 45000000,
          feeAmount: 3150000,
          feeType: 'percentage',
          status: 'construction',
          startDate: '2025-06-01',
          estimatedCompletion: '2027-03-31',
          progress: 45,
          projectManager: 'Pr.Eng. Sarah Ndlovu',
          teamMembers: [
            { id: 'tm-1', name: 'Pr.Eng. Sarah Ndlovu', role: 'Project Manager', ecsaNumber: '20050001', ecsaLevel: 'professional_engineer', hourlyRate: 1200 },
            { id: 'tm-2', name: 'Pr.Tech. John Mokoena', role: 'Structural Engineer', ecsaNumber: '20100045', ecsaLevel: 'professional_engineering_technologist', hourlyRate: 950 },
            { id: 'tm-3', name: 'Cand.Eng. Thembi Sithole', role: 'Graduate Engineer', ecsaNumber: '20230123', ecsaLevel: 'candidate', hourlyRate: 450 },
          ],
          milestones: [
            { id: 'm-1', name: 'Preliminary Design', description: 'Concept and preliminary design approval', dueDate: '2025-08-31', completedDate: '2025-08-28', status: 'completed', billingAmount: 630000, billed: true },
            { id: 'm-2', name: 'Detailed Design', description: 'Complete detailed design package', dueDate: '2025-12-15', completedDate: '2025-12-10', status: 'completed', billingAmount: 945000, billed: true },
            { id: 'm-3', name: 'Tender Documentation', description: 'Prepare and issue tender documents', dueDate: '2026-01-31', completedDate: '2026-01-28', status: 'completed', billingAmount: 315000, billed: true },
            { id: 'm-4', name: 'Construction Phase', description: 'Construction monitoring and supervision', dueDate: '2027-03-31', status: 'in_progress', billingAmount: 1260000, billed: false },
          ],
          deliverables: [
            { id: 'del-1', type: 'drawings', title: 'Civil Layout Drawings', description: 'Complete civil layout package', revision: 'Rev C', status: 'approved' },
            { id: 'del-2', type: 'specifications', title: 'Technical Specifications', description: 'Full technical specs document', revision: 'Rev B', status: 'issued', issuedDate: '2026-01-15', issuedTo: 'Ekurhuleni Municipality' },
          ],
          billableHours: 1850,
          budgetedHours: 2400,
          expenses: 185000,
          cidbGrade: '7CE',
          nhbrcRequired: true,
          nhbrcEnrollmentNumber: 'NHBRC-2026-GP-001234',
          createdAt: '2025-05-15'
        },
        {
          id: 'proj-2',
          projectNumber: 'ENG-2026-002',
          title: 'Shopping Centre Structural Design - Polokwane',
          discipline: 'structural',
          client: {
            id: 'client-2',
            name: 'Limpopo Developments (Pty) Ltd',
            contactPerson: 'Ms. Lerato Makhura',
            phone: '0152950000',
            email: 'lerato@limpopodev.co.za',
            address: 'Polokwane, Limpopo',
            type: 'private'
          },
          location: 'Polokwane',
          province: 'Limpopo',
          projectValue: 28000000,
          feeAmount: 1960000,
          feeType: 'fixed',
          status: 'design',
          startDate: '2026-01-15',
          estimatedCompletion: '2026-10-30',
          progress: 25,
          projectManager: 'Pr.Eng. James van der Berg',
          teamMembers: [
            { id: 'tm-4', name: 'Pr.Eng. James van der Berg', role: 'Lead Structural Engineer', ecsaNumber: '19980012', ecsaLevel: 'professional_engineer', hourlyRate: 1300 },
            { id: 'tm-5', name: 'Pr.Tech. Nomzamo Dlamini', role: 'Structural Technician', ecsaNumber: '20150112', ecsaLevel: 'professional_engineering_technician', hourlyRate: 750 },
          ],
          milestones: [
            { id: 'm-5', name: 'Concept Design', description: 'Initial concept and feasibility', dueDate: '2026-02-28', completedDate: '2026-02-25', status: 'completed', billingAmount: 392000, billed: true },
            { id: 'm-6', name: 'Detailed Design', description: 'Complete structural design', dueDate: '2026-06-30', status: 'in_progress', billingAmount: 980000, billed: false },
            { id: 'm-7', name: 'Construction Monitoring', description: 'Site supervision and inspections', dueDate: '2026-10-30', status: 'pending', billingAmount: 588000, billed: false },
          ],
          deliverables: [
            { id: 'del-3', type: 'calculations', title: 'Structural Calculations', description: 'Complete structural analysis', revision: 'Rev A', status: 'review' },
          ],
          billableHours: 420,
          budgetedHours: 1600,
          expenses: 45000,
          cidbGrade: '5SE',
          nhbrcRequired: true,
          nhbrcEnrollmentNumber: 'NHBRC-2026-LP-000567',
          createdAt: '2026-01-10'
        },
        {
          id: 'proj-3',
          projectNumber: 'ENG-2026-003',
          title: 'Factory Electrical Installation - East London',
          discipline: 'electrical',
          client: {
            id: 'client-3',
            name: 'Auto Parts Manufacturing SA',
            contactPerson: 'Mr. Rajen Naidoo',
            phone: '0437040000',
            email: 'rnaidoo@autoparts.co.za',
            address: 'East London, Eastern Cape',
            type: 'private'
          },
          location: 'East London',
          province: 'Eastern Cape',
          projectValue: 12000000,
          feeAmount: 960000,
          feeType: 'fixed',
          status: 'approval',
          startDate: '2026-02-01',
          estimatedCompletion: '2026-08-31',
          progress: 35,
          projectManager: 'Pr.Eng. David Naidu',
          teamMembers: [
            { id: 'tm-6', name: 'Pr.Eng. David Naidu', role: 'Lead Electrical Engineer', ecsaNumber: '20020089', ecsaLevel: 'professional_engineer', hourlyRate: 1100 },
          ],
          milestones: [
            { id: 'm-8', name: 'Design Complete', description: 'Electrical design package', dueDate: '2026-03-31', completedDate: '2026-03-28', status: 'completed', billingAmount: 480000, billed: true },
            { id: 'm-9', name: 'Municipal Approval', description: 'Submission and approval from municipality', dueDate: '2026-05-15', status: 'in_progress', billingAmount: 240000, billed: false },
          ],
          deliverables: [
            { id: 'del-4', type: 'drawings', title: 'Electrical Layout Drawings', description: 'Single line diagrams and layouts', revision: 'Rev B', status: 'approved' },
          ],
          billableHours: 280,
          budgetedHours: 750,
          expenses: 22000,
          cidbGrade: '4EP',
          nhbrcRequired: false,
          createdAt: '2026-01-25'
        },
      ])

      setTimeEntries([
        {
          id: 'te-1',
          projectId: 'proj-1',
          projectName: 'Water Treatment Plant Upgrade - Ekurhuleni',
          staffId: 'tm-1',
          staffName: 'Pr.Eng. Sarah Ndlovu',
          date: '2026-04-12',
          hours: 6.5,
          description: 'Site meeting with contractor and client',
          billable: true,
          hourlyRate: 1200,
          totalAmount: 7800,
          approved: true
        },
        {
          id: 'te-2',
          projectId: 'proj-1',
          projectName: 'Water Treatment Plant Upgrade - Ekurhuleni',
          staffId: 'tm-3',
          staffName: 'Cand.Eng. Thembi Sithole',
          date: '2026-04-12',
          hours: 8,
          description: 'Review of structural calculations',
          billable: true,
          hourlyRate: 450,
          totalAmount: 3600,
          approved: true
        },
        {
          id: 'te-3',
          projectId: 'proj-2',
          projectName: 'Shopping Centre Structural Design - Polokwane',
          staffId: 'tm-4',
          staffName: 'Pr.Eng. James van der Berg',
          date: '2026-04-12',
          hours: 4,
          description: 'Design review and client meeting',
          billable: true,
          hourlyRate: 1300,
          totalAmount: 5200,
          approved: false
        },
        {
          id: 'te-4',
          projectId: 'proj-3',
          projectName: 'Factory Electrical Installation - East London',
          staffId: 'tm-6',
          staffName: 'Pr.Eng. David Naidu',
          date: '2026-04-11',
          hours: 5,
          description: 'Municipal submission preparation',
          billable: true,
          hourlyRate: 1100,
          totalAmount: 5500,
          approved: true
        },
      ])

      setExpenses([
        {
          id: 'exp-1',
          projectId: 'proj-1',
          projectName: 'Water Treatment Plant Upgrade',
          date: '2026-04-10',
          category: 'travel',
          description: 'Site visit - fuel and accommodation',
          amount: 3500,
          receiptAvailable: true,
          approved: true,
          invoiceToClient: true
        },
        {
          id: 'exp-2',
          projectId: 'proj-1',
          projectName: 'Water Treatment Plant Upgrade',
          date: '2026-04-08',
          category: 'testing',
          description: 'Concrete cube testing - SANAS accredited lab',
          amount: 8500,
          receiptAvailable: true,
          approved: true,
          invoiceToClient: true
        },
        {
          id: 'exp-3',
          projectId: 'proj-2',
          projectName: 'Shopping Centre Structural Design',
          date: '2026-04-05',
          category: 'printing',
          description: 'Drawing prints for client meeting',
          amount: 1200,
          receiptAvailable: true,
          approved: true,
          invoiceToClient: true
        },
      ])

      setEcsaRegistrations([
        {
          id: 'ecsa-1',
          staffId: 'tm-1',
          staffName: 'Pr.Eng. Sarah Ndlovu',
          ecsaNumber: '20050001',
          registrationLevel: 'professional_engineer',
          registrationDate: '2005-06-15',
          expiryDate: '2026-06-30',
          status: 'pending_renewal',
          disciplines: ['Civil Engineering', 'Structural Engineering'],
        },
        {
          id: 'ecsa-2',
          staffId: 'tm-2',
          staffName: 'Pr.Tech. John Mokoena',
          ecsaNumber: '20100045',
          registrationLevel: 'professional_engineering_technologist',
          registrationDate: '2010-03-20',
          expiryDate: '2027-03-31',
          status: 'active',
          disciplines: ['Structural Engineering'],
        },
        {
          id: 'ecsa-3',
          staffId: 'tm-4',
          staffName: 'Pr.Eng. James van der Berg',
          ecsaNumber: '19980012',
          registrationLevel: 'professional_engineer',
          registrationDate: '1998-09-01',
          expiryDate: '2026-09-30',
          status: 'active',
          disciplines: ['Structural Engineering', 'Civil Engineering'],
        },
        {
          id: 'ecsa-4',
          staffId: 'tm-3',
          staffName: 'Cand.Eng. Thembi Sithole',
          ecsaNumber: '20230123',
          registrationLevel: 'candidate',
          registrationDate: '2023-01-15',
          expiryDate: '2028-01-15',
          status: 'active',
          disciplines: ['Civil Engineering'],
        },
      ])

      setCpdRecords([
        {
          id: 'cpd-1',
          staffId: 'tm-1',
          staffName: 'Pr.Eng. Sarah Ndlovu',
          activityTitle: 'SAICE Annual Conference 2025',
          category: 'category_1',
          points: 3,
          activityDate: '2025-10-15',
          provider: 'SAICE',
          verified: true,
          cycleYear: 2025,
          cyclePointsTotal: 18,
          cyclePointsRequired: 25
        },
        {
          id: 'cpd-2',
          staffId: 'tm-1',
          staffName: 'Pr.Eng. Sarah Ndlovu',
          activityTitle: 'SANS 10400-XA Training',
          category: 'category_1',
          points: 2,
          activityDate: '2025-08-20',
          provider: 'SAICE Professional Development',
          verified: true,
          cycleYear: 2025,
          cyclePointsTotal: 18,
          cyclePointsRequired: 25
        },
        {
          id: 'cpd-3',
          staffId: 'tm-2',
          staffName: 'Pr.Tech. John Mokoena',
          activityTitle: 'Structural Design Workshop',
          category: 'category_1',
          points: 2,
          activityDate: '2026-02-10',
          provider: 'ECSA Accredited Provider',
          verified: true,
          cycleYear: 2026,
          cyclePointsTotal: 8,
          cyclePointsRequired: 20
        },
        {
          id: 'cpd-4',
          staffId: 'tm-4',
          staffName: 'Pr.Eng. James van der Berg',
          activityTitle: 'Engineering Ethics Seminar',
          category: 'category_2',
          points: 1,
          activityDate: '2026-03-05',
          provider: 'ECSA',
          verified: true,
          cycleYear: 2026,
          cyclePointsTotal: 12,
          cyclePointsRequired: 25
        },
      ])

      setAuthoritySubmissions([
        {
          id: 'sub-1',
          projectId: 'proj-1',
          projectName: 'Water Treatment Plant Upgrade',
          authorityType: 'municipality',
          authorityName: 'Ekurhuleni Metropolitan Municipality',
          submissionType: 'Building Plans Approval',
          referenceNumber: 'EMM-BP-2026-0456',
          submittedDate: '2026-01-20',
          status: 'approved',
          approvedDate: '2026-02-15',
          documents: [
            { id: 'doc-1', name: 'Building Plans', type: 'drawings', status: 'verified' },
            { id: 'doc-2', name: 'Engineering Certificates', type: 'certificates', status: 'verified' },
          ]
        },
        {
          id: 'sub-2',
          projectId: 'proj-1',
          projectName: 'Water Treatment Plant Upgrade',
          authorityType: 'nhbrc',
          authorityName: 'NHBRC',
          submissionType: 'Enrolment Application',
          referenceNumber: 'NHBRC-2026-GP-001234',
          submittedDate: '2026-01-10',
          status: 'approved',
          approvedDate: '2026-01-25',
          documents: [
            { id: 'doc-3', name: 'Enrolment Form', type: 'form', status: 'verified' },
          ]
        },
        {
          id: 'sub-3',
          projectId: 'proj-3',
          projectName: 'Factory Electrical Installation',
          authorityType: 'municipality',
          authorityName: 'Buffalo City Metropolitan Municipality',
          submissionType: 'Electrical Installation Approval',
          submittedDate: '2026-04-05',
          status: 'submitted',
          documents: [
            { id: 'doc-4', name: 'Single Line Diagrams', type: 'drawings', status: 'uploaded' },
            { id: 'doc-5', name: 'Load Schedule', type: 'document', status: 'uploaded' },
          ]
        },
        {
          id: 'sub-4',
          projectId: 'proj-2',
          projectName: 'Shopping Centre Structural Design',
          authorityType: 'municipality',
          authorityName: 'Polokwane Municipality',
          submissionType: 'Building Plans Approval',
          submittedDate: '2026-03-20',
          status: 'revision_required',
          comments: 'Additional structural details required for basement parking',
          documents: [
            { id: 'doc-6', name: 'Building Plans', type: 'drawings', status: 'uploaded' },
          ]
        },
      ])

      setSabsStandards([
        { id: 'sabs-1', code: 'SANS 10400', title: 'Application of the National Building Regulations', category: 'Building', lastRevision: '2023', applicable: true },
        { id: 'sabs-2', code: 'SANS 10160', title: 'Basis of Structural Design', category: 'Structural', lastRevision: '2011', applicable: true },
        { id: 'sabs-3', code: 'SANS 10162', title: 'The Structural Use of Steel', category: 'Structural', lastRevision: '2011', applicable: true },
        { id: 'sabs-4', code: 'SANS 10100', title: 'The Structural Use of Concrete', category: 'Structural', lastRevision: '2023', applicable: true },
        { id: 'sabs-5', code: 'SANS 10142', title: 'The Wiring of Premises', category: 'Electrical', lastRevision: '2022', applicable: true },
        { id: 'sabs-6', code: 'SANS 1042', title: 'Code of Practice for Water Reticulation', category: 'Civil', lastRevision: '2018', applicable: true },
      ])

      setLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // Stats
  const stats = {
    activeProjects: projects.filter(p => !['completed', 'cancelled'].includes(p.status)).length,
    totalProjectValue: projects.reduce((sum, p) => sum + p.projectValue, 0),
    totalFees: projects.reduce((sum, p) => sum + p.feeAmount, 0),
    totalBillableHours: timeEntries.filter(t => t.billable).reduce((sum, t) => sum + t.hours, 0),
    unbilledHours: timeEntries.filter(t => t.billable && !t.approved).reduce((sum, t) => sum + t.hours, 0),
    pendingExpenses: expenses.filter(e => !e.approved).reduce((sum, e) => sum + e.amount, 0),
    ecsaActive: ecsaRegistrations.filter(r => r.status === 'active').length,
    ecsaPendingRenewal: ecsaRegistrations.filter(r => r.status === 'pending_renewal').length,
    cpdCompliant: cpdRecords.filter(c => c.cyclePointsTotal >= c.cyclePointsRequired).length,
    pendingSubmissions: authoritySubmissions.filter(s => ['pending', 'submitted'].includes(s.status)).length,
    milestonesDue: projects.reduce((sum, p) => sum + p.milestones.filter(m => m.status === 'in_progress' || m.status === 'overdue').length, 0),
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      planning: 'bg-yellow-100 text-yellow-700',
      design: 'bg-blue-100 text-blue-700',
      approval: 'bg-orange-100 text-orange-700',
      construction: 'bg-purple-100 text-purple-700',
      inspection: 'bg-cyan-100 text-cyan-700',
      completed: 'bg-green-100 text-green-700',
      on_hold: 'bg-gray-100 text-gray-700',
      cancelled: 'bg-red-100 text-red-700',
      pending: 'bg-yellow-100 text-yellow-700',
      submitted: 'bg-blue-100 text-blue-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      revision_required: 'bg-orange-100 text-orange-700',
      active: 'bg-green-100 text-green-700',
      pending_renewal: 'bg-orange-100 text-orange-700',
      expired: 'bg-red-100 text-red-700',
      suspended: 'bg-gray-100 text-gray-700',
      in_progress: 'bg-blue-100 text-blue-700',
      overdue: 'bg-red-100 text-red-700',
      draft: 'bg-gray-100 text-gray-700',
      review: 'bg-yellow-100 text-yellow-700',
      issued: 'bg-green-100 text-green-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const getDisciplineIcon = (discipline: EngineeringDiscipline) => {
    const icons = {
      civil: <Building2 className="h-4 w-4" />,
      structural: <Building className="h-4 w-4" />,
      electrical: <Zap className="h-4 w-4" />,
      mechanical: <Cog className="h-4 w-4" />,
      geotechnical: <HardHat className="h-4 w-4" />,
      environmental: <Target className="h-4 w-4" />,
      project_management: <ClipboardList className="h-4 w-4" />,
    }
    return icons[discipline] || <Wrench className="h-4 w-4" />
  }

  const getECSALabel = (level: ECSARegistrationLevel) => {
    const labels = {
      candidate: 'Cand.Eng.',
      professional_engineer: 'Pr.Eng.',
      professional_engineering_technologist: 'Pr.Tech.Eng.',
      professional_certificated_engineer: 'Pr.Cert.Eng.',
      professional_engineering_technician: 'Pr.Tech.',
    }
    return labels[level] || level
  }

  const formatCurrency = (amount: number) => {
    return `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 0 })}`
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
              <HardHat className="h-5 w-5 text-[#00897B]" />
              Engineering Services Management
            </h1>
            <p className="text-sm text-[#757575]">Project management, ECSA compliance, CPD tracking & authority submissions</p>
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
            <p className="text-sm font-bold text-green-600">{formatCurrency(stats.totalFees)}</p>
            <p className="text-[9px] text-[#757575]">Total Fees</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-blue-600">{stats.totalBillableHours}</p>
            <p className="text-[9px] text-[#757575]">Billable Hours</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-orange-600">{stats.unbilledHours}</p>
            <p className="text-[9px] text-[#757575]">Unbilled Hours</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-purple-600">{stats.milestonesDue}</p>
            <p className="text-[9px] text-[#757575]">Milestones Due</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-green-600">{stats.ecsaActive}</p>
            <p className="text-[9px] text-[#757575]">ECSA Active</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-yellow-600">{stats.ecsaPendingRenewal}</p>
            <p className="text-[9px] text-[#757575]">Renewal Due</p>
          </div>
          <div className="bg-cyan-50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-cyan-600">{stats.cpdCompliant}</p>
            <p className="text-[9px] text-[#757575]">CPD Compliant</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-orange-600">{stats.pendingSubmissions}</p>
            <p className="text-[9px] text-[#757575]">Pending Submissions</p>
          </div>
          <div className="bg-red-50 rounded-lg p-2 text-center">
            <p className="text-sm font-bold text-red-600">{formatCurrency(stats.pendingExpenses)}</p>
            <p className="text-[9px] text-[#757575]">Pending Expenses</p>
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
                <ClipboardList className="h-4 w-4 mr-1" />Projects
              </TabsTrigger>
              <TabsTrigger value="timesheet" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Timer className="h-4 w-4 mr-1" />Timesheet
              </TabsTrigger>
              <TabsTrigger value="expenses" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Receipt className="h-4 w-4 mr-1" />Expenses
              </TabsTrigger>
              <TabsTrigger value="ecsa" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <ShieldCheck className="h-4 w-4 mr-1" />ECSA
              </TabsTrigger>
              <TabsTrigger value="cpd" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <BookOpen className="h-4 w-4 mr-1" />CPD
              </TabsTrigger>
              <TabsTrigger value="submissions" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <FileCheck className="h-4 w-4 mr-1" />Submissions
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 p-4">
            {/* Overview Tab */}
            <TabsContent value="overview" className="m-0">
              <div className="grid grid-cols-2 gap-4">
                {/* Active Projects */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-[#00897B]" />
                      Active Projects
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {projects.filter(p => !['completed', 'cancelled'].includes(p.status)).map(project => (
                        <div key={project.id} className="p-2 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100" onClick={() => setSelectedProject(project)}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getDisciplineIcon(project.discipline)}
                              <div>
                                <p className="font-medium text-sm line-clamp-1">{project.title}</p>
                                <p className="text-xs text-[#757575]">{project.projectNumber} | {project.discipline}</p>
                              </div>
                            </div>
                            <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-xs">
                            <span className="text-[#757575]">Value: {formatCurrency(project.projectValue)}</span>
                            <span className="text-[#757575]">{project.progress}% complete</span>
                          </div>
                          <Progress value={project.progress} className="h-1 mt-1" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* ECSA Registration Alerts */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-orange-600" />
                      ECSA Registration Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {ecsaRegistrations.filter(r => r.status === 'pending_renewal').map(reg => (
                        <div key={reg.id} className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                            <div>
                              <p className="font-medium text-sm">{reg.staffName}</p>
                              <p className="text-xs text-[#757575]">Expires: {reg.expiryDate}</p>
                            </div>
                          </div>
                          <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C]">Renew</Button>
                        </div>
                      ))}
                      {ecsaRegistrations.filter(r => r.status === 'pending_renewal').length === 0 && (
                        <p className="text-center text-sm text-green-600 py-4">All registrations current</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Milestones Due */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Milestone className="h-5 w-5 text-[#00897B]" />
                      Milestones Due
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {projects.flatMap(p => p.milestones.filter(m => m.status === 'in_progress' || m.status === 'overdue').map(m => ({ ...m, projectName: p.title }))).map(milestone => (
                        <div key={milestone.id} className={`p-2 rounded-lg ${milestone.status === 'overdue' ? 'bg-red-50' : 'bg-blue-50'}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{milestone.name}</p>
                              <p className="text-xs text-[#757575]">{milestone.projectName}</p>
                            </div>
                            <Badge className={getStatusColor(milestone.status)}>{milestone.status}</Badge>
                          </div>
                          <div className="mt-1 flex items-center justify-between text-xs">
                            <span className="text-[#757575]">Due: {milestone.dueDate}</span>
                            <span className="font-medium text-green-600">{formatCurrency(milestone.billingAmount)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Timesheet */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Timer className="h-5 w-5 text-[#00897B]" />
                      Recent Time Entries
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {timeEntries.slice(0, 4).map(entry => (
                        <div key={entry.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{entry.staffName}</p>
                            <p className="text-xs text-[#757575]">{entry.projectName.substring(0, 25)}...</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm">{entry.hours}h</p>
                            <p className="text-xs text-green-600">{formatCurrency(entry.totalAmount)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Authority Submissions */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileCheck className="h-5 w-5 text-[#00897B]" />
                      Authority Submissions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {authoritySubmissions.map(submission => (
                        <div key={submission.id} className="p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{submission.submissionType}</p>
                              <p className="text-xs text-[#757575]">{submission.authorityName}</p>
                            </div>
                            <Badge className={getStatusColor(submission.status)}>{submission.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* CPD Progress */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-[#00897B]" />
                      CPD Progress (3-Year Cycle)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {ecsaRegistrations.filter(r => r.registrationLevel !== 'candidate').map(reg => {
                        const cpd = cpdRecords.find(c => c.staffId === reg.staffId)
                        const points = cpd?.cyclePointsTotal || 0
                        const required = cpd?.cyclePointsRequired || 25
                        return (
                          <div key={reg.id} className="p-2 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium text-sm">{reg.staffName}</p>
                              <span className="text-xs">{points}/{required} points</span>
                            </div>
                            <Progress value={(points / required) * 100} className="h-2" />
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Engineering Projects</h2>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Search projects..." className="pl-9 w-64" />
                  </div>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Discipline" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Disciplines</SelectItem>
                      <SelectItem value="civil">Civil</SelectItem>
                      <SelectItem value="structural">Structural</SelectItem>
                      <SelectItem value="electrical">Electrical</SelectItem>
                      <SelectItem value="mechanical">Mechanical</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setNewProjectDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />New Project
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {projects.map(project => (
                  <Card key={project.id} className="cursor-pointer hover:border-[#00897B]" onClick={() => setSelectedProject(project)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="p-2 bg-[#E0F2F1] rounded-lg">
                            {getDisciplineIcon(project.discipline)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold">{project.projectNumber}</p>
                              <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                              {project.cidbGrade && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">CIDB {project.cidbGrade}</Badge>
                              )}
                            </div>
                            <p className="text-sm font-medium mt-1">{project.title}</p>
                            <p className="text-sm text-[#757575]">{project.client.name}</p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-[#757575]">
                              <MapPin className="h-3 w-3" />
                              <span>{project.location}, {project.province}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-[#00897B]">{formatCurrency(project.projectValue)}</p>
                          <p className="text-sm text-[#757575]">Fee: {formatCurrency(project.feeAmount)}</p>
                          <p className="text-xs text-[#757575]">{project.progress}% complete</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-4">
                        <Progress value={project.progress} className="h-2" />
                      </div>

                      {/* Milestones */}
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs text-[#757575] mb-2">Milestones</p>
                        <div className="flex flex-wrap gap-2">
                          {project.milestones.map(milestone => (
                            <div key={milestone.id} className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                              milestone.status === 'completed' ? 'bg-green-100 text-green-700' :
                              milestone.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                              milestone.status === 'overdue' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {milestone.status === 'completed' ? (
                                <CheckCircle2 className="h-3 w-3" />
                              ) : milestone.status === 'overdue' ? (
                                <AlertCircle className="h-3 w-3" />
                              ) : (
                                <Clock className="h-3 w-3" />
                              )}
                              {milestone.name}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Stats Row */}
                      <div className="mt-4 pt-4 border-t grid grid-cols-4 gap-4 text-center text-xs">
                        <div>
                          <p className="text-[#757575]">Budgeted Hours</p>
                          <p className="font-medium">{project.budgetedHours}h</p>
                        </div>
                        <div>
                          <p className="text-[#757575]">Billable Hours</p>
                          <p className="font-medium">{project.billableHours}h</p>
                        </div>
                        <div>
                          <p className="text-[#757575]">Expenses</p>
                          <p className="font-medium">{formatCurrency(project.expenses)}</p>
                        </div>
                        <div>
                          <p className="text-[#757575]">Team Size</p>
                          <p className="font-medium">{project.teamMembers.length}</p>
                        </div>
                      </div>

                      {/* NHBRC Badge */}
                      {project.nhbrcRequired && (
                        <div className="mt-4 pt-4 border-t flex items-center gap-2 text-xs">
                          <ShieldCheck className="h-4 w-4 text-green-600" />
                          <span className="text-green-600">NHBRC Enrolled: {project.nhbrcEnrollmentNumber}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Timesheet Tab */}
            <TabsContent value="timesheet" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Time Tracking</h2>
                <div className="flex gap-2">
                  <Select defaultValue="this-week">
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="this-week">This Week</SelectItem>
                      <SelectItem value="last-week">Last Week</SelectItem>
                      <SelectItem value="this-month">This Month</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setNewTimeEntryDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />Log Time
                  </Button>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-4 mb-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Timer className="h-8 w-8 mx-auto text-[#00897B] mb-2" />
                    <p className="text-2xl font-bold">{stats.totalBillableHours}</p>
                    <p className="text-xs text-[#757575]">Total Hours</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <DollarSign className="h-8 w-8 mx-auto text-green-600 mb-2" />
                    <p className="text-2xl font-bold">{formatCurrency(timeEntries.reduce((sum, t) => sum + t.totalAmount, 0))}</p>
                    <p className="text-xs text-[#757575]">Total Value</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Clock className="h-8 w-8 mx-auto text-orange-600 mb-2" />
                    <p className="text-2xl font-bold">{stats.unbilledHours}</p>
                    <p className="text-xs text-[#757575]">Unbilled Hours</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Users className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                    <p className="text-2xl font-bold">{new Set(timeEntries.map(t => t.staffId)).size}</p>
                    <p className="text-xs text-[#757575]">Staff Logged</p>
                  </CardContent>
                </Card>
              </div>

              {/* Time Entries Table */}
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left p-3 text-xs font-medium text-[#757575]">Date</th>
                          <th className="text-left p-3 text-xs font-medium text-[#757575]">Staff</th>
                          <th className="text-left p-3 text-xs font-medium text-[#757575]">Project</th>
                          <th className="text-left p-3 text-xs font-medium text-[#757575]">Description</th>
                          <th className="text-center p-3 text-xs font-medium text-[#757575]">Hours</th>
                          <th className="text-right p-3 text-xs font-medium text-[#757575]">Rate</th>
                          <th className="text-right p-3 text-xs font-medium text-[#757575]">Amount</th>
                          <th className="text-center p-3 text-xs font-medium text-[#757575]">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {timeEntries.map(entry => (
                          <tr key={entry.id} className="border-b hover:bg-gray-50">
                            <td className="p-3 text-sm">{entry.date}</td>
                            <td className="p-3 text-sm">{entry.staffName}</td>
                            <td className="p-3 text-sm max-w-48 truncate">{entry.projectName}</td>
                            <td className="p-3 text-sm text-[#757575] max-w-48 truncate">{entry.description}</td>
                            <td className="p-3 text-sm text-center font-medium">{entry.hours}</td>
                            <td className="p-3 text-sm text-right">{formatCurrency(entry.hourlyRate)}/h</td>
                            <td className="p-3 text-sm text-right font-medium text-green-600">{formatCurrency(entry.totalAmount)}</td>
                            <td className="p-3 text-center">
                              <Badge className={entry.approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                                {entry.approved ? 'Approved' : 'Pending'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Expenses Tab */}
            <TabsContent value="expenses" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Expenses & Disbursements</h2>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />Export
                  </Button>
                  <Button className="bg-[#00897B] hover:bg-[#00695C]">
                    <Plus className="h-4 w-4 mr-2" />Add Expense
                  </Button>
                </div>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Receipt className="h-8 w-8 mx-auto text-[#00897B] mb-2" />
                    <p className="text-2xl font-bold">{formatCurrency(expenses.reduce((sum, e) => sum + e.amount, 0))}</p>
                    <p className="text-xs text-[#757575]">Total Expenses</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <CheckCircle2 className="h-8 w-8 mx-auto text-green-600 mb-2" />
                    <p className="text-2xl font-bold">{formatCurrency(expenses.filter(e => e.approved).reduce((sum, e) => sum + e.amount, 0))}</p>
                    <p className="text-xs text-[#757575]">Approved</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Clock className="h-8 w-8 mx-auto text-orange-600 mb-2" />
                    <p className="text-2xl font-bold">{formatCurrency(stats.pendingExpenses)}</p>
                    <p className="text-xs text-[#757575]">Pending Approval</p>
                  </CardContent>
                </Card>
              </div>

              {/* Expenses List */}
              <div className="space-y-3">
                {expenses.map(expense => (
                  <Card key={expense.id} className={!expense.approved ? 'border-orange-300' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg ${expense.category === 'travel' ? 'bg-blue-100' : expense.category === 'testing' ? 'bg-purple-100' : 'bg-gray-100'}`}>
                            {expense.category === 'travel' ? <MapPin className="h-5 w-5 text-blue-600" /> :
                             expense.category === 'testing' ? <FileCheck className="h-5 w-5 text-purple-600" /> :
                             <Receipt className="h-5 w-5 text-gray-600" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{expense.description}</p>
                              {!expense.approved && (
                                <Badge className="bg-orange-100 text-orange-700">Pending</Badge>
                              )}
                              {expense.invoiceToClient && (
                                <Badge className="bg-green-100 text-green-700">Billable</Badge>
                              )}
                            </div>
                            <p className="text-sm text-[#757575]">Project: {expense.projectName}</p>
                            <p className="text-sm text-[#757575]">Category: {expense.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{formatCurrency(expense.amount)}</p>
                          <p className="text-xs text-[#757575]">{expense.date}</p>
                          {expense.receiptAvailable && (
                            <p className="text-xs text-green-600 mt-1">Receipt attached</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* ECSA Tab */}
            <TabsContent value="ecsa" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">ECSA Registration Management</h2>
                  <p className="text-sm text-[#757575]">Engineering Council of South Africa - Professional Registration Tracking</p>
                </div>
                <Button className="bg-[#00897B] hover:bg-[#00695C]">
                  <Plus className="h-4 w-4 mr-2" />Add Registration
                </Button>
              </div>

              {/* ECSA Info Banner */}
              <Card className="mb-4 bg-[#E0F2F1] border-[#00897B]">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="h-6 w-6 text-[#00897B]" />
                    <div>
                      <p className="font-medium text-[#00895B]">ECSA Registration Requirements</p>
                      <p className="text-sm text-[#757575]">All engineering professionals must be registered with ECSA to practice in South Africa. Registration levels include Candidate, Professional Engineer (Pr.Eng.), Professional Engineering Technologist (Pr.Tech.Eng.), Professional Certificated Engineer (Pr.Cert.Eng.), and Professional Engineering Technician (Pr.Tech.).</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Registrations Grid */}
              <div className="grid grid-cols-2 gap-4">
                {ecsaRegistrations.map(reg => (
                  <Card key={reg.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${reg.status === 'active' ? 'bg-green-100' : reg.status === 'pending_renewal' ? 'bg-orange-100' : 'bg-red-100'}`}>
                            <BadgeCheck className={`h-5 w-5 ${reg.status === 'active' ? 'text-green-600' : reg.status === 'pending_renewal' ? 'text-orange-600' : 'text-red-600'}`} />
                          </div>
                          <div>
                            <p className="font-bold">{reg.staffName}</p>
                            <p className="text-sm text-[#00897B]">{getECSALabel(reg.registrationLevel)}</p>
                            <p className="text-xs text-[#757575]">ECSA No: {reg.ecsaNumber}</p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(reg.status)}>{reg.status}</Badge>
                      </div>

                      <div className="mt-4 pt-4 border-t">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-[#757575]">Registration Date</p>
                            <p className="font-medium">{reg.registrationDate}</p>
                          </div>
                          <div>
                            <p className="text-[#757575]">Expiry Date</p>
                            <p className={`font-medium ${reg.status === 'pending_renewal' ? 'text-orange-600' : ''}`}>{reg.expiryDate}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3">
                        <p className="text-xs text-[#757575] mb-1">Disciplines</p>
                        <div className="flex flex-wrap gap-1">
                          {reg.disciplines.map((disc, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{disc}</Badge>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Eye className="h-3 w-3 mr-1" />View Certificate
                        </Button>
                        <Button size="sm" className="flex-1 bg-[#00897B] hover:bg-[#00695C]">
                          <RefreshCw className="h-3 w-3 mr-1" />Renew
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* CPD Tab */}
            <TabsContent value="cpd" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">CPD Points Tracking</h2>
                  <p className="text-sm text-[#757575]">Continuing Professional Development - 3-Year Cycle Requirements</p>
                </div>
                <Button className="bg-[#00897B] hover:bg-[#00695C]">
                  <Plus className="h-4 w-4 mr-2" />Add CPD Activity
                </Button>
              </div>

              {/* CPD Info Banner */}
              <Card className="mb-4 bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-700">CPD Requirements (3-Year Cycle)</p>
                      <p className="text-sm text-[#757575]">Professional Engineers: 25 points required per 3-year cycle | Professional Engineering Technologists: 20 points | Professional Engineering Technicians: 15 points. Points are earned through Category 1 (structured learning), Category 2 (self-study), and Category 3 (professional activities).</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CPD Progress by Staff */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {ecsaRegistrations.filter(r => r.registrationLevel !== 'candidate').map(reg => {
                  const cpd = cpdRecords.find(c => c.staffId === reg.staffId)
                  const points = cpd?.cyclePointsTotal || 0
                  const required = cpd?.cyclePointsRequired || 25
                  const percentage = Math.min((points / required) * 100, 100)
                  return (
                    <Card key={reg.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-bold">{reg.staffName}</p>
                            <p className="text-xs text-[#757575]">{getECSALabel(reg.registrationLevel)}</p>
                          </div>
                          <Badge className={points >= required ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}>
                            {points >= required ? 'Compliant' : 'In Progress'}
                          </Badge>
                        </div>
                        <div className="mt-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>CPD Points</span>
                            <span className="font-medium">{points}/{required}</span>
                          </div>
                          <Progress value={percentage} className={`h-2 ${points >= required ? '[&>div]:bg-green-500' : '[&>div]:bg-orange-500'}`} />
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Recent CPD Activities */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Recent CPD Activities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {cpdRecords.map(cpd => (
                      <div key={cpd.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${cpd.category === 'category_1' ? 'bg-blue-100' : cpd.category === 'category_2' ? 'bg-purple-100' : 'bg-green-100'}`}>
                            <BookOpen className={`h-4 w-4 ${cpd.category === 'category_1' ? 'text-blue-600' : cpd.category === 'category_2' ? 'text-purple-600' : 'text-green-600'}`} />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{cpd.activityTitle}</p>
                            <p className="text-xs text-[#757575]">{cpd.staffName} | {cpd.provider}</p>
                            <p className="text-xs text-[#757575]">Category: {cpd.category.replace('_', ' ').toUpperCase()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#00897B]">{cpd.points} points</p>
                          <p className="text-xs text-[#757575]">{cpd.activityDate}</p>
                          {cpd.verified ? (
                            <Badge className="bg-green-100 text-green-700 text-xs">Verified</Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-700 text-xs">Pending</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Submissions Tab */}
            <TabsContent value="submissions" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">Local Authority & Statutory Submissions</h2>
                  <p className="text-sm text-[#757575]">Municipal approvals, NHBRC, CIDB, and SABS submissions</p>
                </div>
                <Button className="bg-[#00897B] hover:bg-[#00695C]">
                  <Plus className="h-4 w-4 mr-2" />New Submission
                </Button>
              </div>

              {/* SABS Standards Reference */}
              <Card className="mb-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#00897B]" />
                    Applicable SABS/SANS Standards
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {sabsStandards.filter(s => s.applicable).map(standard => (
                      <Badge key={standard.id} variant="outline" className="bg-white border-gray-200 hover:bg-gray-50 cursor-pointer">
                        {standard.code}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Submissions List */}
              <div className="space-y-3">
                {authoritySubmissions.map(submission => (
                  <Card key={submission.id} className={
                    submission.status === 'approved' ? 'border-green-300' :
                    submission.status === 'rejected' ? 'border-red-300' :
                    submission.status === 'revision_required' ? 'border-orange-300' : ''
                  }>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg ${
                            submission.authorityType === 'municipality' ? 'bg-blue-100' :
                            submission.authorityType === 'nhbrc' ? 'bg-green-100' :
                            submission.authorityType === 'cidb' ? 'bg-purple-100' :
                            'bg-gray-100'
                          }`}>
                            {submission.authorityType === 'municipality' ? <Building className="h-5 w-5 text-blue-600" /> :
                             submission.authorityType === 'nhbrc' ? <ShieldCheck className="h-5 w-5 text-green-600" /> :
                             submission.authorityType === 'cidb' ? <Award className="h-5 w-5 text-purple-600" /> :
                             <FileText className="h-5 w-5 text-gray-600" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold">{submission.submissionType}</p>
                              <Badge className={getStatusColor(submission.status)}>{submission.status}</Badge>
                            </div>
                            <p className="text-sm text-[#757575]">{submission.authorityName}</p>
                            <p className="text-sm text-[#757575]">Project: {submission.projectName}</p>
                            {submission.referenceNumber && (
                              <p className="text-xs text-[#00897B]">Ref: {submission.referenceNumber}</p>
                            )}
                            {submission.comments && (
                              <p className="text-xs text-orange-600 mt-1 bg-orange-50 p-2 rounded">{submission.comments}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-[#757575]">Submitted</p>
                          <p className="font-medium">{submission.submittedDate}</p>
                          {submission.approvedDate && (
                            <>
                              <p className="text-sm text-green-600 mt-1">Approved</p>
                              <p className="font-medium text-green-600">{submission.approvedDate}</p>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Documents */}
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs text-[#757575] mb-2">Documents ({submission.documents.length})</p>
                        <div className="flex flex-wrap gap-2">
                          {submission.documents.map(doc => (
                            <div key={doc.id} className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded text-xs">
                              <FileText className="h-3 w-3" />
                              <span>{doc.name}</span>
                              {doc.status === 'verified' ? (
                                <CheckCircle2 className="h-3 w-3 text-green-600" />
                              ) : (
                                <Clock className="h-3 w-3 text-orange-600" />
                              )}
                            </div>
                          ))}
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

      {/* New Project Dialog */}
      <Dialog open={newProjectDialogOpen} onOpenChange={setNewProjectDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Engineering Project</DialogTitle>
            <DialogDescription>Set up a new engineering project with milestones and deliverables</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="projectNumber">Project Number</Label>
              <Input id="projectNumber" placeholder="ENG-2026-XXX" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discipline">Discipline</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select discipline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="civil">Civil Engineering</SelectItem>
                  <SelectItem value="structural">Structural Engineering</SelectItem>
                  <SelectItem value="electrical">Electrical Engineering</SelectItem>
                  <SelectItem value="mechanical">Mechanical Engineering</SelectItem>
                  <SelectItem value="geotechnical">Geotechnical Engineering</SelectItem>
                  <SelectItem value="environmental">Environmental Engineering</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="title">Project Title</Label>
              <Input id="title" placeholder="Enter project title" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client">Client Name</Label>
              <Input id="client" placeholder="Enter client name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientType">Client Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="government">Government</SelectItem>
                  <SelectItem value="municipal">Municipal</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="parastatal">Parastatal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" placeholder="City/Town" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="province">Province</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select province" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GP">Gauteng</SelectItem>
                  <SelectItem value="WC">Western Cape</SelectItem>
                  <SelectItem value="KZN">KwaZulu-Natal</SelectItem>
                  <SelectItem value="EC">Eastern Cape</SelectItem>
                  <SelectItem value="LP">Limpopo</SelectItem>
                  <SelectItem value="MP">Mpumalanga</SelectItem>
                  <SelectItem value="NW">North West</SelectItem>
                  <SelectItem value="FS">Free State</SelectItem>
                  <SelectItem value="NC">Northern Cape</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectValue">Project Value (R)</Label>
              <Input id="projectValue" type="number" placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feeAmount">Professional Fee (R)</Label>
              <Input id="feeAmount" type="number" placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feeType">Fee Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select fee type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Fee</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="hourly">Hourly Rate</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cidbGrade">CIDB Grade</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1CE">1CE</SelectItem>
                  <SelectItem value="2CE">2CE</SelectItem>
                  <SelectItem value="3CE">3CE</SelectItem>
                  <SelectItem value="4CE">4CE</SelectItem>
                  <SelectItem value="5CE">5CE</SelectItem>
                  <SelectItem value="6CE">6CE</SelectItem>
                  <SelectItem value="7CE">7CE</SelectItem>
                  <SelectItem value="8CE">8CE</SelectItem>
                  <SelectItem value="9CE">9CE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="nhbrc" className="rounded" />
              <Label htmlFor="nhbrc">NHBRC Enrollment Required (for structural projects)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewProjectDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setNewProjectDialogOpen(false)}>Create Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Time Entry Dialog */}
      <Dialog open={newTimeEntryDialogOpen} onOpenChange={setNewTimeEntryDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Log Time Entry</DialogTitle>
            <DialogDescription>Record billable hours for a project</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.projectNumber} - {p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hours">Hours</Label>
                <Input id="hours" type="number" step="0.5" placeholder="0" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Describe the work performed" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="billable" defaultChecked className="rounded" />
              <Label htmlFor="billable">Billable</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewTimeEntryDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setNewTimeEntryDialogOpen(false)}>Log Time</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project Details Dialog */}
      <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedProject && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {getDisciplineIcon(selectedProject.discipline)}
                  {selectedProject.title}
                </DialogTitle>
                <DialogDescription>
                  {selectedProject.projectNumber} | {selectedProject.discipline.charAt(0).toUpperCase() + selectedProject.discipline.slice(1)} Engineering
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Progress */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Project Progress</span>
                    <span className="text-sm">{selectedProject.progress}%</span>
                  </div>
                  <Progress value={selectedProject.progress} className="h-2" />
                </div>

                {/* Project Info */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-[#757575]">Client</p>
                    <p className="font-medium">{selectedProject.client.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#757575]">Project Value</p>
                    <p className="font-medium">{formatCurrency(selectedProject.projectValue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#757575]">Professional Fee</p>
                    <p className="font-medium">{formatCurrency(selectedProject.feeAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#757575]">Location</p>
                    <p className="font-medium">{selectedProject.location}, {selectedProject.province}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#757575]">Project Manager</p>
                    <p className="font-medium">{selectedProject.projectManager}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#757575]">Status</p>
                    <Badge className={getStatusColor(selectedProject.status)}>{selectedProject.status}</Badge>
                  </div>
                </div>

                {/* Team */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Project Team</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.teamMembers.map(member => (
                      <div key={member.id} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                        <Users className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">{member.name}</p>
                          <p className="text-xs text-[#757575]">{member.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Milestones */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Milestones & Billing</h4>
                  <div className="space-y-2">
                    {selectedProject.milestones.map(milestone => (
                      <div key={milestone.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          {milestone.status === 'completed' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : milestone.status === 'overdue' ? (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-blue-600" />
                          )}
                          <div>
                            <p className="text-sm font-medium">{milestone.name}</p>
                            <p className="text-xs text-[#757575]">Due: {milestone.dueDate}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-600">{formatCurrency(milestone.billingAmount)}</p>
                          {milestone.billed ? (
                            <Badge className="bg-green-100 text-green-700 text-xs">Billed</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-700 text-xs">Not Billed</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Deliverables */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Deliverables</h4>
                  <div className="space-y-2">
                    {selectedProject.deliverables.map(del => (
                      <div key={del.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">{del.title}</p>
                          <p className="text-xs text-[#757575]">{del.type} | {del.revision}</p>
                        </div>
                        <Badge className={getStatusColor(del.status)}>{del.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* NHBRC/CIDB Info */}
                {(selectedProject.cidbGrade || selectedProject.nhbrcRequired) && (
                  <div className="p-3 bg-green-50 rounded-lg flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-green-600" />
                    <div className="text-sm">
                      {selectedProject.cidbGrade && <span>CIDB Grade: {selectedProject.cidbGrade} | </span>}
                      {selectedProject.nhbrcEnrollmentNumber && <span>NHBRC: {selectedProject.nhbrcEnrollmentNumber}</span>}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedProject(null)}>Close</Button>
                <Button className="bg-[#00897B] hover:bg-[#00695C]">Log Time</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
