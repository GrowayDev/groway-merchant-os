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
  Compass,
  Users,
  FileText,
  DollarSign,
  Calendar,
  Phone,
  MapPin,
  CheckCircle2,
  XCircle,
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
  CreditCard,
  Banknote,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  AlertCircle,
  Award,
  Briefcase,
  Scale,
  Wallet,
  UserCheck,
  ClipboardList,
  FileCode,
  Layers,
  Ruler,
  HardHat,
  FileCheck,
  Clock3,
  Building,
  Home,
  PenTool,
  FileSpreadsheet,
  Users2,
  AlertTriangle,
  CheckCircle,
  CalendarClock,
  GraduationCap,
  IdCard,
  BookOpen,
  Target,
  BarChart3,
} from 'lucide-react'

// Types specific to Architecture Practice
type ProjectPhase = 'concept' | 'design_development' | 'construction_docs' | 'tender' | 'construction_admin'
type ProjectStatus = 'active' | 'on_hold' | 'completed' | 'cancelled'
type ProjectType = 'residential' | 'commercial' | 'industrial' | 'institutional' | 'mixed_use' | 'renovation'
type SACAPCategory = 'candidate' | 'professional' | 'senior_professional'
type CPDStatus = 'pending' | 'approved' | 'rejected'
type NBRStatus = 'pending' | 'compliant' | 'non_compliant' | 'requires_review'

interface ProjectPhaseData {
  id: string
  phase: ProjectPhase
  name: string
  percentage: number
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold'
  startDate?: string
  endDate?: string
  hoursLogged: number
  estimatedHours: number
  billingPercentage: number
}

interface ArchitectProject {
  id: string
  projectNumber: string
  name: string
  client: Client
  projectType: ProjectType
  status: ProjectStatus
  currentPhase: ProjectPhase
  phases: ProjectPhaseData[]
  totalValue: number
  invoicedAmount: number
  outstandingAmount: number
  siteAddress: string
  municipality: string
  province: string
  cidbGrade?: string
  nbrCompliance: NBRStatus
  sansStandards: string[]
  submissionDate?: string
  approvalDate?: string
  assignedArchitect: Architect
  consultants: Consultant[]
  documents: ProjectDocument[]
  expenses: ProjectExpense[]
  createdAt: string
  deadline: string
}

interface Client {
  id: string
  name: string
  contactPerson: string
  phone: string
  email: string
  address: string
  type: 'individual' | 'company'
  companyReg?: string
}

interface Architect {
  id: string
  name: string
  sacapNumber: string
  sacapCategory: SACAPCategory
  specialization: string
  status: 'available' | 'busy' | 'on_leave'
  currentProjects: number
  cpdPoints: number
  cpdRequired: number
  renewalDate: string
}

interface Consultant {
  id: string
  name: string
  company: string
  discipline: 'structural_engineer' | 'mep_engineer' | 'quantity_surveyor' | 'town_planner' | 'heritage' | 'other'
  contactPerson: string
  phone: string
  email: string
  fee: number
  status: 'appointed' | 'pending' | 'completed'
}

interface ProjectDocument {
  id: string
  name: string
  type: 'concept_design' | 'design_development' | 'construction_drawing' | 'specification' | 'municipal_submission' | 'other'
  version: string
  revision: string
  status: 'draft' | 'issued' | 'approved' | 'superseded'
  issuedDate?: string
  issuedTo?: string
}

interface ProjectExpense {
  id: string
  description: string
  category: 'travel' | 'printing' | 'consultant_fee' | 'municipal_fee' | 'equipment' | 'other'
  amount: number
  date: string
  receiptAttached: boolean
  status: 'pending' | 'approved' | 'invoiced'
}

interface CPDActivity {
  id: string
  title: string
  category: 'category_1' | 'category_2' | 'category_3'
  points: number
  date: string
  provider: string
  certificateNumber?: string
  status: CPDStatus
  notes?: string
}

interface SACAPCompliance {
  id: string
  category: 'registration' | 'cpd' | 'practice' | 'renewal'
  description: string
  status: 'compliant' | 'pending' | 'non_compliant' | 'expiring_soon'
  expiryDate?: string
  points?: number
  requiredPoints?: number
  practiceNumber?: string
}

interface MunicipalSubmission {
  id: string
  projectNumber: string
  projectName: string
  municipality: string
  submissionType: 'building_plan' | 'town_planning' | 'rezoning' | 'departure' | 'heritage'
  submissionDate: string
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'requires_changes'
  referenceNumber?: string
  comments?: string
}

const PHASE_LABELS: Record<ProjectPhase, string> = {
  concept: 'Concept Design',
  design_development: 'Design Development',
  construction_docs: 'Construction Documentation',
  tender: 'Tender',
  construction_admin: 'Construction Administration',
}

const PHASE_ICONS: Record<ProjectPhase, React.ElementType> = {
  concept: PenTool,
  design_development: Layers,
  construction_docs: FileCode,
  tender: ClipboardList,
  construction_admin: HardHat,
}

export function ArchitectureView() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Data states
  const [projects, setProjects] = useState<ArchitectProject[]>([])
  const [architects, setArchitects] = useState<Architect[]>([])
  const [cpdActivities, setCpdActivities] = useState<CPDActivity[]>([])
  const [complianceItems, setComplianceItems] = useState<SACAPCompliance[]>([])
  const [municipalSubmissions, setMunicipalSubmissions] = useState<MunicipalSubmission[]>([])
  const [recentActivity, setRecentActivity] = useState<{time: string; action: string; project?: string; user?: string}[]>([])

  // Dialog states
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<ArchitectProject | null>(null)

  // Update time
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Mock data
  useEffect(() => {
    const timer = setTimeout(() => {
      setArchitects([
        {
          id: 'arch-1',
          name: 'Thabo Molefe',
          sacapNumber: 'SACAP/2018/PROF/0001234',
          sacapCategory: 'professional',
          specialization: 'Commercial & Mixed-Use',
          status: 'busy',
          currentProjects: 3,
          cpdPoints: 18,
          cpdRequired: 25,
          renewalDate: '2026-03-31',
        },
        {
          id: 'arch-2',
          name: 'Sarah van Niekerk',
          sacapNumber: 'SACAP/2015/SRPROF/0000567',
          sacapCategory: 'senior_professional',
          specialization: 'Residential & Heritage',
          status: 'available',
          currentProjects: 2,
          cpdPoints: 28,
          cpdRequired: 25,
          renewalDate: '2027-06-30',
        },
        {
          id: 'arch-3',
          name: 'Mpho Dlamini',
          sacapNumber: 'SACAP/2022/CAND/0002345',
          sacapCategory: 'candidate',
          specialization: 'Industrial',
          status: 'busy',
          currentProjects: 1,
          cpdPoints: 12,
          cpdRequired: 20,
          renewalDate: '2026-09-30',
        },
      ])

      setProjects([
        {
          id: 'proj-1',
          projectNumber: 'ARCH-2026-001',
          name: 'Sandton Corporate Campus',
          client: {
            id: 'client-1',
            name: 'Premier Properties (Pty) Ltd',
            contactPerson: 'Johan Botha',
            phone: '0115551234',
            email: 'johan.botha@premierprops.co.za',
            address: '145 Main Street, Sandton',
            type: 'company',
            companyReg: '2015/123456/07',
          },
          projectType: 'commercial',
          status: 'active',
          currentPhase: 'design_development',
          phases: [
            { id: 'p1-1', phase: 'concept', name: 'Concept Design', percentage: 100, status: 'completed', hoursLogged: 48, estimatedHours: 45, billingPercentage: 15 },
            { id: 'p1-2', phase: 'design_development', name: 'Design Development', percentage: 60, status: 'in_progress', hoursLogged: 32, estimatedHours: 60, billingPercentage: 25 },
            { id: 'p1-3', phase: 'construction_docs', name: 'Construction Documentation', percentage: 0, status: 'not_started', hoursLogged: 0, estimatedHours: 80, billingPercentage: 30 },
            { id: 'p1-4', phase: 'tender', name: 'Tender', percentage: 0, status: 'not_started', hoursLogged: 0, estimatedHours: 25, billingPercentage: 15 },
            { id: 'p1-5', phase: 'construction_admin', name: 'Construction Admin', percentage: 0, status: 'not_started', hoursLogged: 0, estimatedHours: 40, billingPercentage: 15 },
          ],
          totalValue: 850000,
          invoicedAmount: 340000,
          outstandingAmount: 510000,
          siteAddress: '45 Rivonia Road, Sandton',
          municipality: 'City of Johannesburg',
          province: 'Gauteng',
          cidbGrade: '7GB',
          nbrCompliance: 'compliant',
          sansStandards: ['SANS 10400-A', 'SANS 10400-XA', 'SANS 10400-T'],
          assignedArchitect: {
            id: 'arch-1',
            name: 'Thabo Molefe',
            sacapNumber: 'SACAP/2018/PROF/0001234',
            sacapCategory: 'professional',
            specialization: 'Commercial & Mixed-Use',
            status: 'busy',
            currentProjects: 3,
            cpdPoints: 18,
            cpdRequired: 25,
            renewalDate: '2026-03-31',
          },
          consultants: [
            { id: 'c1', name: 'Structural Solutions', company: 'Structural Solutions CC', discipline: 'structural_engineer', contactPerson: 'Mike Stevens', phone: '0115555678', email: 'mike@structsol.co.za', fee: 180000, status: 'appointed' },
            { id: 'c2', name: 'MEP Consultants', company: 'Integrated Services (Pty) Ltd', discipline: 'mep_engineer', contactPerson: 'Lisa Wong', phone: '0115559012', email: 'lisa@integrated.co.za', fee: 120000, status: 'appointed' },
            { id: 'c3', name: 'QS Associates', company: 'QS Associates', discipline: 'quantity_surveyor', contactPerson: 'David Naidoo', phone: '0115553456', email: 'david@qsa.co.za', fee: 85000, status: 'pending' },
          ],
          documents: [
            { id: 'd1', name: 'Site Analysis Report', type: 'concept_design', version: '1.0', revision: 'A', status: 'approved', issuedDate: '2026-01-15', issuedTo: 'Client' },
            { id: 'd2', name: 'Concept Design Package', type: 'concept_design', version: '2.0', revision: 'B', status: 'approved', issuedDate: '2026-01-28', issuedTo: 'Client' },
            { id: 'd3', name: 'DD Package - Rev C', type: 'design_development', version: '1.0', revision: 'C', status: 'issued', issuedDate: '2026-02-12', issuedTo: 'Client, Consultants' },
          ],
          expenses: [
            { id: 'e1', description: 'Site visit - Sandton', category: 'travel', amount: 850, date: '2026-02-05', receiptAttached: true, status: 'approved' },
            { id: 'e2', description: 'Municipal submission fee', category: 'municipal_fee', amount: 4500, date: '2026-02-10', receiptAttached: true, status: 'approved' },
            { id: 'e3', description: 'Large format printing - DD drawings', category: 'printing', amount: 2200, date: '2026-02-12', receiptAttached: true, status: 'pending' },
          ],
          createdAt: '2026-01-10',
          deadline: '2026-08-30',
        },
        {
          id: 'proj-2',
          projectNumber: 'ARCH-2026-002',
          name: 'Dainfern Residential Estate',
          client: {
            id: 'client-2',
            name: 'Dainfern Developers (Pty) Ltd',
            contactPerson: 'Amanda Nxumalo',
            phone: '0114651234',
            email: 'amanda@dainfern.co.za',
            address: 'Dainfern Estate, Fourways',
            type: 'company',
            companyReg: '2019/789012/07',
          },
          projectType: 'residential',
          status: 'active',
          currentPhase: 'construction_docs',
          phases: [
            { id: 'p2-1', phase: 'concept', name: 'Concept Design', percentage: 100, status: 'completed', hoursLogged: 36, estimatedHours: 35, billingPercentage: 15 },
            { id: 'p2-2', phase: 'design_development', name: 'Design Development', percentage: 100, status: 'completed', hoursLogged: 52, estimatedHours: 50, billingPercentage: 25 },
            { id: 'p2-3', phase: 'construction_docs', name: 'Construction Documentation', percentage: 40, status: 'in_progress', hoursLogged: 35, estimatedHours: 90, billingPercentage: 30 },
            { id: 'p2-4', phase: 'tender', name: 'Tender', percentage: 0, status: 'not_started', hoursLogged: 0, estimatedHours: 20, billingPercentage: 15 },
            { id: 'p2-5', phase: 'construction_admin', name: 'Construction Admin', percentage: 0, status: 'not_started', hoursLogged: 0, estimatedHours: 35, billingPercentage: 15 },
          ],
          totalValue: 520000,
          invoicedAmount: 234000,
          outstandingAmount: 286000,
          siteAddress: 'Erf 2345, Dainfern Estate',
          municipality: 'City of Johannesburg',
          province: 'Gauteng',
          cidbGrade: '5GB',
          nbrCompliance: 'compliant',
          sansStandards: ['SANS 10400-A', 'SANS 10400-XA', 'SANS 10400-K'],
          assignedArchitect: {
            id: 'arch-2',
            name: 'Sarah van Niekerk',
            sacapNumber: 'SACAP/2015/SRPROF/0000567',
            sacapCategory: 'senior_professional',
            specialization: 'Residential & Heritage',
            status: 'available',
            currentProjects: 2,
            cpdPoints: 28,
            cpdRequired: 25,
            renewalDate: '2027-06-30',
          },
          consultants: [
            { id: 'c4', name: 'Structural Dynamics', company: 'Structural Dynamics', discipline: 'structural_engineer', contactPerson: 'John Smith', phone: '0115552345', email: 'john@structdyn.co.za', fee: 95000, status: 'appointed' },
          ],
          documents: [
            { id: 'd4', name: 'Concept Approval', type: 'concept_design', version: '1.0', revision: 'A', status: 'approved', issuedDate: '2025-12-15', issuedTo: 'Client' },
            { id: 'd5', name: 'Construction Drawings', type: 'construction_drawing', version: '0.4', revision: 'D', status: 'draft', issuedDate: '2026-02-14', issuedTo: 'Internal Review' },
          ],
          expenses: [],
          createdAt: '2025-12-01',
          deadline: '2026-06-15',
        },
        {
          id: 'proj-3',
          projectNumber: 'ARCH-2026-003',
          name: 'Soweto Community Centre',
          client: {
            id: 'client-3',
            name: 'City of Johannesburg',
            contactPerson: 'Thandiwe Mokoena',
            phone: '0117557890',
            email: 'tmokoena@joburg.org.za',
            address: '158 Civic Boulevard, Braamfontein',
            type: 'company',
            companyReg: 'Public Entity',
          },
          projectType: 'institutional',
          status: 'active',
          currentPhase: 'tender',
          phases: [
            { id: 'p3-1', phase: 'concept', name: 'Concept Design', percentage: 100, status: 'completed', hoursLogged: 56, estimatedHours: 55, billingPercentage: 15 },
            { id: 'p3-2', phase: 'design_development', name: 'Design Development', percentage: 100, status: 'completed', hoursLogged: 72, estimatedHours: 70, billingPercentage: 25 },
            { id: 'p3-3', phase: 'construction_docs', name: 'Construction Documentation', percentage: 100, status: 'completed', hoursLogged: 95, estimatedHours: 90, billingPercentage: 30 },
            { id: 'p3-4', phase: 'tender', name: 'Tender', percentage: 50, status: 'in_progress', hoursLogged: 15, estimatedHours: 30, billingPercentage: 15 },
            { id: 'p3-5', phase: 'construction_admin', name: 'Construction Admin', percentage: 0, status: 'not_started', hoursLogged: 0, estimatedHours: 50, billingPercentage: 15 },
          ],
          totalValue: 1200000,
          invoicedAmount: 900000,
          outstandingAmount: 300000,
          siteAddress: 'Orlando East, Soweto',
          municipality: 'City of Johannesburg',
          province: 'Gauteng',
          cidbGrade: '7CE',
          nbrCompliance: 'compliant',
          sansStandards: ['SANS 10400-A', 'SANS 10400-XA', 'SANS 10400-S', 'SANS 10400-T'],
          assignedArchitect: {
            id: 'arch-1',
            name: 'Thabo Molefe',
            sacapNumber: 'SACAP/2018/PROF/0001234',
            sacapCategory: 'professional',
            specialization: 'Commercial & Mixed-Use',
            status: 'busy',
            currentProjects: 3,
            cpdPoints: 18,
            cpdRequired: 25,
            renewalDate: '2026-03-31',
          },
          consultants: [
            { id: 'c5', name: 'Structural Solutions', company: 'Structural Solutions CC', discipline: 'structural_engineer', contactPerson: 'Mike Stevens', phone: '0115555678', email: 'mike@structsol.co.za', fee: 250000, status: 'appointed' },
            { id: 'c6', name: 'MEP Consultants', company: 'Integrated Services (Pty) Ltd', discipline: 'mep_engineer', contactPerson: 'Lisa Wong', phone: '0115559012', email: 'lisa@integrated.co.za', fee: 180000, status: 'appointed' },
            { id: 'c7', name: 'Town Planners SA', company: 'Town Planners SA', discipline: 'town_planner', contactPerson: 'Peter Molefe', phone: '0115554567', email: 'peter@tpsa.co.za', fee: 45000, status: 'completed' },
          ],
          documents: [
            { id: 'd6', name: 'Tender Document Set', type: 'specification', version: '1.0', revision: 'A', status: 'issued', issuedDate: '2026-02-08', issuedTo: 'Tender Board' },
          ],
          expenses: [
            { id: 'e4', description: 'Public participation workshop', category: 'travel', amount: 1200, date: '2026-01-20', receiptAttached: true, status: 'invoiced' },
          ],
          createdAt: '2025-09-15',
          deadline: '2027-03-30',
        },
      ])

      setCpdActivities([
        {
          id: 'cpd-1',
          title: 'SANS 10400-XA Energy Efficiency Update',
          category: 'category_1',
          points: 5,
          date: '2026-01-15',
          provider: 'SAIA',
          certificateNumber: 'SAIA-2026-XA-001',
          status: 'approved',
        },
        {
          id: 'cpd-2',
          title: 'Professional Practice Management',
          category: 'category_1',
          points: 3,
          date: '2026-01-28',
          provider: 'SACAP',
          certificateNumber: 'SACAP-PPM-00234',
          status: 'approved',
        },
        {
          id: 'cpd-3',
          title: 'BIM Coordination Workshop',
          category: 'category_2',
          points: 4,
          date: '2026-02-05',
          provider: 'Autodesk Africa',
          certificateNumber: 'ADO-AFR-2026-567',
          status: 'approved',
        },
        {
          id: 'cpd-4',
          title: 'Green Building Design Principles',
          category: 'category_1',
          points: 6,
          date: '2026-02-20',
          provider: 'Green Building Council SA',
          status: 'pending',
        },
      ])

      setComplianceItems([
        { id: 'comp-1', category: 'registration', description: 'SACAP Professional Registration', status: 'compliant', expiryDate: '2026-03-31', practiceNumber: 'PRAC-2026-000123' },
        { id: 'comp-2', category: 'cpd', description: 'Continuing Professional Development', status: 'pending', points: 18, requiredPoints: 25 },
        { id: 'comp-3', category: 'practice', description: 'Practice Number Validation', status: 'compliant', practiceNumber: 'PRAC-2026-000123' },
        { id: 'comp-4', category: 'renewal', description: 'Annual Registration Renewal', status: 'expiring_soon', expiryDate: '2026-03-31' },
      ])

      setMunicipalSubmissions([
        {
          id: 'ms-1',
          projectNumber: 'ARCH-2026-001',
          projectName: 'Sandton Corporate Campus',
          municipality: 'City of Johannesburg',
          submissionType: 'building_plan',
          submissionDate: '2026-02-10',
          status: 'under_review',
          referenceNumber: 'BP-2026-CJ-005678',
        },
        {
          id: 'ms-2',
          projectNumber: 'ARCH-2026-002',
          projectName: 'Dainfern Residential Estate',
          municipality: 'City of Johannesburg',
          submissionType: 'building_plan',
          submissionDate: '2026-02-12',
          status: 'submitted',
          referenceNumber: 'BP-2026-CJ-006123',
        },
        {
          id: 'ms-3',
          projectNumber: 'ARCH-2026-003',
          projectName: 'Soweto Community Centre',
          municipality: 'City of Johannesburg',
          submissionType: 'building_plan',
          submissionDate: '2025-11-20',
          status: 'approved',
          referenceNumber: 'BP-2025-CJ-004321',
          comments: 'Approved with conditions - see attached schedule',
        },
      ])

      setRecentActivity([
        { time: '2026-02-14 14:32', action: 'DD drawings issued to client', project: 'ARCH-2026-001', user: 'Thabo Molefe' },
        { time: '2026-02-14 11:15', action: 'Municipal submission confirmed', project: 'ARCH-2026-002', user: 'Sarah van Niekerk' },
        { time: '2026-02-14 09:45', action: 'Tender documents uploaded', project: 'ARCH-2026-003', user: 'Thabo Molefe' },
        { time: '2026-02-13 16:20', action: 'CPD activity logged', user: 'Thabo Molefe' },
        { time: '2026-02-13 14:10', action: 'Consultant fee approved', project: 'ARCH-2026-001', user: 'Sarah van Niekerk' },
        { time: '2026-02-12 10:30', action: 'Invoice generated', project: 'ARCH-2026-002', user: 'System' },
      ])

      setLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // Stats
  const stats = {
    activeProjects: projects.filter(p => p.status === 'active').length,
    pendingInvoices: projects.reduce((sum, p) => sum + p.outstandingAmount, 0),
    cpdPoints: architects.reduce((sum, a) => sum + a.cpdPoints, 0),
    cpdRequired: architects.reduce((sum, a) => sum + a.cpdRequired, 0),
    totalHoursLogged: projects.reduce((sum, p) => sum + p.phases.reduce((s, ph) => s + ph.hoursLogged, 0), 0),
    totalProjectValue: projects.reduce((sum, p) => sum + p.totalValue, 0),
    submittedPlans: municipalSubmissions.filter(s => s.status === 'submitted' || s.status === 'under_review').length,
    complianceScore: Math.round((complianceItems.filter(c => c.status === 'compliant').length / complianceItems.length) * 100),
    documentsIssued: projects.reduce((sum, p) => sum + p.documents.filter(d => d.status === 'issued' || d.status === 'approved').length, 0),
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      on_hold: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-gray-100 text-gray-700',
      cancelled: 'bg-red-100 text-red-700',
      pending: 'bg-yellow-100 text-yellow-700',
      in_progress: 'bg-purple-100 text-purple-700',
      not_started: 'bg-gray-100 text-gray-700',
      completed_phase: 'bg-green-100 text-green-700',
      compliant: 'bg-green-100 text-green-700',
      non_compliant: 'bg-red-100 text-red-700',
      requires_review: 'bg-orange-100 text-orange-700',
      submitted: 'bg-blue-100 text-blue-700',
      under_review: 'bg-purple-100 text-purple-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      requires_changes: 'bg-orange-100 text-orange-700',
      expiring_soon: 'bg-orange-100 text-orange-700',
      appointed: 'bg-green-100 text-green-700',
      draft: 'bg-gray-100 text-gray-700',
      issued: 'bg-blue-100 text-blue-700',
      superseded: 'bg-gray-100 text-gray-500',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const getSACAPCategoryColor = (category: SACAPCategory) => {
    const colors: Record<SACAPCategory, string> = {
      candidate: 'bg-blue-100 text-blue-700',
      professional: 'bg-green-100 text-green-700',
      senior_professional: 'bg-purple-100 text-purple-700',
    }
    return colors[category]
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
              <Building2 className="h-5 w-5 text-[#00897B]" />
              Architecture Practice Management
            </h1>
            <p className="text-sm text-[#757575]">Projects, billing, CPD tracking & SACAP compliance</p>
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
          <div className="bg-blue-50 rounded-lg p-2 text-center">
            <p className="text-sm font-bold text-blue-600">{formatCurrency(stats.pendingInvoices)}</p>
            <p className="text-[9px] text-[#757575]">Pending Invoices</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-purple-600">{stats.cpdPoints}/{stats.cpdRequired}</p>
            <p className="text-[9px] text-[#757575]">CPD Points</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-green-600">{stats.complianceScore}%</p>
            <p className="text-[9px] text-[#757575]">SACAP Status</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-orange-600">{stats.submittedPlans}</p>
            <p className="text-[9px] text-[#757575]">Plans Submitted</p>
          </div>
          <div className="bg-cyan-50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-cyan-600">{stats.totalHoursLogged}h</p>
            <p className="text-[9px] text-[#757575]">Hours Logged</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <p className="text-sm font-bold text-green-600">{formatCurrency(stats.totalProjectValue)}</p>
            <p className="text-[9px] text-[#757575]">Project Value</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-blue-600">{stats.documentsIssued}</p>
            <p className="text-[9px] text-[#757575]">Docs Issued</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-gray-600">{architects.length}</p>
            <p className="text-[9px] text-[#757575]">Architects</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-green-600">{projects.filter(p => p.nbrCompliance === 'compliant').length}</p>
            <p className="text-[9px] text-[#757575]">NBR Compliant</p>
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
              <TabsTrigger value="billing" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <DollarSign className="h-4 w-4 mr-1" />Billing
              </TabsTrigger>
              <TabsTrigger value="cpd" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <GraduationCap className="h-4 w-4 mr-1" />CPD Tracking
              </TabsTrigger>
              <TabsTrigger value="sacap" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <ShieldCheck className="h-4 w-4 mr-1" />SACAP
              </TabsTrigger>
              <TabsTrigger value="municipal" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Building className="h-4 w-4 mr-1" />Municipal
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
                    <div className="space-y-2">
                      {projects.filter(p => p.status === 'active').slice(0, 4).map(project => (
                        <div key={project.id} className="p-2 bg-[#E0F2F1] rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{project.name}</p>
                              <p className="text-xs text-[#757575]">{project.projectNumber} | {project.client.name}</p>
                            </div>
                            <div className="text-right">
                              <Badge className={getStatusColor(project.currentPhase)}>{PHASE_LABELS[project.currentPhase]}</Badge>
                              <p className="text-xs text-[#757575] mt-1">{formatCurrency(project.outstandingAmount)} due</p>
                            </div>
                          </div>
                          <div className="mt-2">
                            <Progress 
                              value={project.phases.reduce((sum, p) => sum + p.percentage, 0) / project.phases.length} 
                              className="h-1.5"
                            />
                            <p className="text-xs text-[#757575] mt-1">
                              {Math.round(project.phases.reduce((sum, p) => sum + p.percentage, 0) / project.phases.length)}% complete
                            </p>
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
                      <GraduationCap className="h-5 w-5 text-purple-600" />
                      CPD Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {architects.map(arch => (
                        <div key={arch.id} className="p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{arch.name}</p>
                              <Badge className={getSACAPCategoryColor(arch.sacapCategory)}>{arch.sacapCategory.replace('_', ' ')}</Badge>
                            </div>
                            <p className="text-sm font-bold">{arch.cpdPoints}/{arch.cpdRequired}</p>
                          </div>
                          <Progress 
                            value={(arch.cpdPoints / arch.cpdRequired) * 100} 
                            className={`h-2 ${arch.cpdPoints >= arch.cpdRequired ? 'bg-green-200' : 'bg-orange-200'}`}
                          />
                          <p className="text-xs text-[#757575] mt-1">Renewal: {arch.renewalDate}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Municipal Submissions */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building className="h-5 w-5 text-[#00897B]" />
                      Municipal Submissions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {municipalSubmissions.slice(0, 3).map(submission => (
                        <div key={submission.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{submission.projectName}</p>
                            <p className="text-xs text-[#757575]">{submission.referenceNumber}</p>
                          </div>
                          <Badge className={getStatusColor(submission.status)}>{submission.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* SACAP Compliance */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-[#00897B]" />
                      SACAP Compliance Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {complianceItems.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            {item.status === 'compliant' ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : item.status === 'expiring_soon' ? (
                              <AlertCircle className="h-4 w-4 text-orange-600" />
                            ) : (
                              <Clock className="h-4 w-4 text-yellow-600" />
                            )}
                            <div>
                              <p className="text-sm">{item.description}</p>
                              {item.points !== undefined && (
                                <p className="text-xs text-[#757575]">{item.points}/{item.requiredPoints} points</p>
                              )}
                              {item.expiryDate && (
                                <p className="text-xs text-[#757575]">Expires: {item.expiryDate}</p>
                              )}
                            </div>
                          </div>
                          <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock3 className="h-5 w-5 text-[#00897B]" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-[#00897B] rounded-full" />
                            <div>
                              <p className="text-sm">{activity.action}</p>
                              {activity.project && (
                                <p className="text-xs text-[#757575]">{activity.project}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-[#757575]">{activity.user}</p>
                            <p className="text-xs text-gray-400">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Projects</h2>
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

              <div className="space-y-3">
                {projects.map(project => (
                  <Card key={project.id} className="cursor-pointer hover:border-[#00897B]" onClick={() => setSelectedProject(project)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="p-2 rounded-lg bg-[#E0F2F1]">
                            <Building2 className="h-5 w-5 text-[#00897B]" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold">{project.name}</p>
                              <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                              <Badge className="bg-gray-100 text-gray-700">{project.projectType}</Badge>
                            </div>
                            <p className="text-sm text-[#757575]">{project.projectNumber}</p>
                            <p className="text-sm text-[#757575]">{project.siteAddress}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <p className="text-xs text-[#757575]">Client: {project.client.name}</p>
                              <p className="text-xs text-[#757575]">Architect: {project.assignedArchitect.name}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-[#00897B]">{formatCurrency(project.totalValue)}</p>
                          <p className="text-xs text-orange-600">{formatCurrency(project.outstandingAmount)} outstanding</p>
                          <Badge className={getStatusColor(project.nbrCompliance)}>NBR: {project.nbrCompliance}</Badge>
                        </div>
                      </div>

                      {/* Phase Progress */}
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center gap-1">
                          {project.phases.map((phase, index) => {
                            const PhaseIcon = PHASE_ICONS[phase.phase]
                            return (
                              <div key={phase.id} className="flex items-center flex-1">
                                <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                                  phase.status === 'completed' ? 'bg-green-100 text-green-700' :
                                  phase.status === 'in_progress' ? 'bg-purple-100 text-purple-700' :
                                  'bg-gray-100 text-gray-500'
                                }`}>
                                  <PhaseIcon className="h-3 w-3" />
                                  <span className="hidden lg:inline">{PHASE_LABELS[phase.phase]}</span>
                                </div>
                                {index < project.phases.length - 1 && (
                                  <div className={`h-0.5 flex-1 ${
                                    phase.status === 'completed' ? 'bg-green-400' : 'bg-gray-200'
                                  }`} />
                                )}
                              </div>
                            )
                          })}
                        </div>
                        <div className="grid grid-cols-5 gap-2 mt-2">
                          {project.phases.map(phase => (
                            <div key={phase.id} className="text-center">
                              <p className="text-xs text-[#757575]">{phase.percentage}%</p>
                              <p className="text-xs text-[#757575]">{phase.hoursLogged}/{phase.estimatedHours}h</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Consultants & Documents */}
                      <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-xs font-medium text-[#757575]">Consultants ({project.consultants.length})</p>
                          <div className="mt-1 space-y-1">
                            {project.consultants.slice(0, 2).map(c => (
                              <div key={c.id} className="flex items-center gap-1">
                                <Users2 className="h-3 w-3 text-gray-400" />
                                <span className="text-xs">{c.discipline.replace('_', ' ')}</span>
                                <Badge className={getStatusColor(c.status)}>{c.status}</Badge>
                              </div>
                            ))}
                            {project.consultants.length > 2 && (
                              <p className="text-xs text-[#757575]">+{project.consultants.length - 2} more</p>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-[#757575]">SANS Standards</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {project.sansStandards.map((standard, i) => (
                              <Badge key={i} className="bg-blue-50 text-blue-700 text-[10px]">{standard}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-[#757575]">Documents ({project.documents.length})</p>
                          <p className="text-xs text-[#757575] mt-1">
                            {project.documents.filter(d => d.status === 'approved').length} approved | {' '}
                            {project.documents.filter(d => d.status === 'issued').length} issued
                          </p>
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
                <h2 className="text-lg font-semibold">Progress Billing</h2>
                <Button className="bg-[#00897B] hover:bg-[#00695C]">
                  <Plus className="h-4 w-4 mr-2" />Generate Invoice
                </Button>
              </div>

              <div className="space-y-3">
                {projects.map(project => (
                  <Card key={project.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="font-bold">{project.projectNumber}</p>
                          <p className="text-sm text-[#757575]">{project.name}</p>
                          <p className="text-xs text-[#757575]">Client: {project.client.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-[#00897B]">{formatCurrency(project.totalValue)}</p>
                          <p className="text-sm text-green-600">{formatCurrency(project.invoicedAmount)} invoiced</p>
                          <p className="text-sm text-orange-600">{formatCurrency(project.outstandingAmount)} outstanding</p>
                        </div>
                      </div>

                      {/* Billing by Phase */}
                      <div className="border rounded-lg p-3">
                        <p className="text-xs font-medium text-[#757575] mb-2">Billing Progress by Phase</p>
                        <div className="space-y-2">
                          {project.phases.map(phase => {
                            const phaseValue = (project.totalValue * phase.billingPercentage) / 100
                            const invoicedAmount = (project.totalValue * phase.billingPercentage * phase.percentage) / 100
                            return (
                              <div key={phase.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div className="flex items-center gap-2">
                                  <Badge className={getStatusColor(phase.status)}>{PHASE_LABELS[phase.phase]}</Badge>
                                  <span className="text-xs text-[#757575]">{phase.billingPercentage}%</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <p className="text-xs text-[#757575]">{formatCurrency(phaseValue)} total</p>
                                    <p className="text-xs font-medium">{formatCurrency(invoicedAmount)} ({phase.percentage}%)</p>
                                  </div>
                                  <Progress value={phase.percentage} className="w-20 h-2" />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* CPD Tracking Tab */}
            <TabsContent value="cpd" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Continuing Professional Development</h2>
                <Button className="bg-[#00897B] hover:bg-[#00695C]">
                  <Plus className="h-4 w-4 mr-2" />Log CPD Activity
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* CPD Summary by Architect */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">CPD Points Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {architects.map(arch => (
                        <div key={arch.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-medium">{arch.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={getSACAPCategoryColor(arch.sacapCategory)}>{arch.sacapCategory.replace('_', ' ')}</Badge>
                                <span className="text-xs text-[#757575]">{arch.sacapNumber}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-lg font-bold ${arch.cpdPoints >= arch.cpdRequired ? 'text-green-600' : 'text-orange-600'}`}>
                                {arch.cpdPoints}/{arch.cpdRequired}
                              </p>
                              <p className="text-xs text-[#757575]">points</p>
                            </div>
                          </div>
                          <Progress 
                            value={(arch.cpdPoints / arch.cpdRequired) * 100} 
                            className={`h-2 ${arch.cpdPoints >= arch.cpdRequired ? 'bg-green-200' : 'bg-orange-200'}`}
                          />
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-[#757575]">Renewal: {arch.renewalDate}</p>
                            {arch.cpdPoints < arch.cpdRequired && (
                              <Badge className="bg-orange-100 text-orange-700">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                {arch.cpdRequired - arch.cpdPoints} points needed
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* CPD Activities */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Recent CPD Activities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {cpdActivities.map(activity => (
                        <div key={activity.id} className="p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{activity.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={
                                  activity.category === 'category_1' ? 'bg-green-100 text-green-700' :
                                  activity.category === 'category_2' ? 'bg-blue-100 text-blue-700' :
                                  'bg-purple-100 text-purple-700'
                                }>
                                  {activity.category.replace('_', ' ')}
                                </Badge>
                                <span className="text-xs text-[#757575]">{activity.provider}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-[#00897B]">{activity.points} pts</p>
                              <Badge className={getStatusColor(activity.status)}>{activity.status}</Badge>
                            </div>
                          </div>
                          {activity.certificateNumber && (
                            <p className="text-xs text-[#757575] mt-1">Cert: {activity.certificateNumber}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* CPD Categories Info */}
                <Card className="col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">CPD Category Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Award className="h-5 w-5 text-green-600" />
                          <p className="font-medium">Category 1</p>
                        </div>
                        <p className="text-xs text-[#757575]">Verifiable activities - courses, seminars, workshops</p>
                        <p className="text-sm font-bold text-green-600 mt-1">Min 15 points required</p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="h-5 w-5 text-blue-600" />
                          <p className="font-medium">Category 2</p>
                        </div>
                        <p className="text-xs text-[#757575]">Self-study, research, publications</p>
                        <p className="text-sm font-bold text-blue-600 mt-1">Max 5 points allowed</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="h-5 w-5 text-purple-600" />
                          <p className="font-medium">Category 3</p>
                        </div>
                        <p className="text-xs text-[#757575]">Professional service, mentoring</p>
                        <p className="text-sm font-bold text-purple-600 mt-1">Max 5 points allowed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* SACAP Tab */}
            <TabsContent value="sacap" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">SACAP Compliance</h2>
                <Button className="bg-[#00897B] hover:bg-[#00695C]">
                  <RefreshCw className="h-4 w-4 mr-2" />Sync with SACAP
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Registration Details */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <IdCard className="h-5 w-5 text-[#00897B]" />
                      Registration Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {architects.map(arch => (
                        <div key={arch.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{arch.name}</p>
                              <p className="text-xs text-[#757575]">{arch.sacapNumber}</p>
                            </div>
                            <Badge className={getSACAPCategoryColor(arch.sacapCategory)}>
                              {arch.sacapCategory.replace('_', ' ')}
                            </Badge>
                          </div>
                          <Separator className="my-2" />
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="text-[#757575]">Specialization</p>
                              <p className="font-medium">{arch.specialization}</p>
                            </div>
                            <div>
                              <p className="text-[#757575]">Renewal Date</p>
                              <p className="font-medium">{arch.renewalDate}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Compliance Checklist */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-[#00897B]" />
                      Compliance Checklist
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {complianceItems.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            {item.status === 'compliant' ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : item.status === 'expiring_soon' ? (
                              <AlertCircle className="h-5 w-5 text-orange-600" />
                            ) : (
                              <Clock className="h-5 w-5 text-yellow-600" />
                            )}
                            <div>
                              <p className="font-medium">{item.description}</p>
                              {item.practiceNumber && (
                                <p className="text-xs text-[#757575]">Practice No: {item.practiceNumber}</p>
                              )}
                              {item.expiryDate && (
                                <p className="text-xs text-[#757575]">Expiry: {item.expiryDate}</p>
                              )}
                              {item.points !== undefined && (
                                <p className="text-xs text-[#757575]">Points: {item.points}/{item.requiredPoints}</p>
                              )}
                            </div>
                          </div>
                          <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Practice Number Validation */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileCheck className="h-5 w-5 text-[#00897B]" />
                      Practice Number Validation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-green-50 rounded-lg text-center">
                      <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                      <p className="font-bold text-green-700">Practice Number Valid</p>
                      <p className="text-sm text-green-600">PRAC-2026-000123</p>
                      <p className="text-xs text-[#757575] mt-2">Last verified: {new Date().toLocaleDateString()}</p>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="p-2 bg-gray-50 rounded text-center">
                        <p className="text-xs text-[#757575]">Valid From</p>
                        <p className="font-medium">2026-01-01</p>
                      </div>
                      <div className="p-2 bg-gray-50 rounded text-center">
                        <p className="text-xs text-[#757575]">Valid Until</p>
                        <p className="font-medium">2026-12-31</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Renewal Reminders */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CalendarClock className="h-5 w-5 text-orange-600" />
                      Renewal Reminders
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="p-3 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-orange-700">Annual Registration Renewal</p>
                            <p className="text-xs text-[#757575]">Due: 2026-03-31</p>
                          </div>
                          <Badge className="bg-orange-100 text-orange-700">45 days</Badge>
                        </div>
                      </div>
                      <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-yellow-700">Thabo Molefe - CPD Points</p>
                            <p className="text-xs text-[#757575]">7 points required by renewal</p>
                          </div>
                          <Badge className="bg-yellow-100 text-yellow-700">Action</Badge>
                        </div>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-green-700">Sarah van Niekerk - CPD Complete</p>
                            <p className="text-xs text-[#757575]">Renewal: 2027-06-30</p>
                          </div>
                          <Badge className="bg-green-100 text-green-700">On Track</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Municipal Tab */}
            <TabsContent value="municipal" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Municipal Submissions</h2>
                <Button className="bg-[#00897B] hover:bg-[#00695C]">
                  <Plus className="h-4 w-4 mr-2" />New Submission
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Submission Status */}
                <Card className="col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Building Plan Submissions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {municipalSubmissions.map(submission => (
                        <div key={submission.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${
                                submission.status === 'approved' ? 'bg-green-100' :
                                submission.status === 'under_review' ? 'bg-purple-100' :
                                submission.status === 'submitted' ? 'bg-blue-100' :
                                'bg-orange-100'
                              }`}>
                                <FileCode className={`h-5 w-5 ${
                                  submission.status === 'approved' ? 'text-green-600' :
                                  submission.status === 'under_review' ? 'text-purple-600' :
                                  submission.status === 'submitted' ? 'text-blue-600' :
                                  'text-orange-600'
                                }`} />
                              </div>
                              <div>
                                <p className="font-medium">{submission.projectName}</p>
                                <p className="text-xs text-[#757575]">{submission.projectNumber}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge className="bg-gray-100 text-gray-700">{submission.submissionType}</Badge>
                                  <span className="text-xs text-[#757575]">{submission.municipality}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className={getStatusColor(submission.status)}>{submission.status}</Badge>
                              {submission.referenceNumber && (
                                <p className="text-xs text-[#757575] mt-1">{submission.referenceNumber}</p>
                              )}
                              <p className="text-xs text-[#757575]">Submitted: {submission.submissionDate}</p>
                            </div>
                          </div>
                          {submission.comments && (
                            <div className="mt-2 p-2 bg-white rounded text-xs">
                              <p className="text-[#757575]">{submission.comments}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* NBR Compliance */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Scale className="h-5 w-5 text-[#00897B]" />
                      NBR Compliance Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {projects.map(project => (
                        <div key={project.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{project.name}</p>
                            <p className="text-xs text-[#757575]">{project.projectNumber}</p>
                          </div>
                          <Badge className={getStatusColor(project.nbrCompliance)}>
                            {project.nbrCompliance}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* CIDB Grading */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-[#00897B]" />
                      CIDB Grading Awareness
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {projects.filter(p => p.cidbGrade).map(project => (
                        <div key={project.id} className="p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{project.name}</p>
                              <p className="text-xs text-[#757575]">{project.projectNumber}</p>
                            </div>
                            <Badge className="bg-blue-100 text-blue-700">{project.cidbGrade}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-700">
                        CIDB grading indicates contractor capability. Projects may require contractors of specific grades based on value and complexity.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>

      {/* New Project Dialog */}
      <Dialog open={newProjectDialogOpen} onOpenChange={setNewProjectDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>Add a new architecture project to your practice management system.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name</Label>
              <Input id="projectName" placeholder="Enter project name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectNumber">Project Number</Label>
              <Input id="projectNumber" placeholder="Auto-generated" disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client-1">Premier Properties (Pty) Ltd</SelectItem>
                  <SelectItem value="client-2">Dainfern Developers (Pty) Ltd</SelectItem>
                  <SelectItem value="client-3">City of Johannesburg</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectType">Project Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                  <SelectItem value="institutional">Institutional</SelectItem>
                  <SelectItem value="mixed_use">Mixed Use</SelectItem>
                  <SelectItem value="renovation">Renovation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="siteAddress">Site Address</Label>
              <Input id="siteAddress" placeholder="Enter site address" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="municipality">Municipality</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select municipality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="coj">City of Johannesburg</SelectItem>
                  <SelectItem value="cot">City of Tshwane</SelectItem>
                  <SelectItem value="eke">Ekurhuleni</SelectItem>
                  <SelectItem value="cape">City of Cape Town</SelectItem>
                  <SelectItem value="ethekwini">eThekwini</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="province">Province</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select province" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gauteng">Gauteng</SelectItem>
                  <SelectItem value="wc">Western Cape</SelectItem>
                  <SelectItem value="kzn">KwaZulu-Natal</SelectItem>
                  <SelectItem value="ec">Eastern Cape</SelectItem>
                  <SelectItem value="fs">Free State</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalValue">Total Project Value (ZAR)</Label>
              <Input id="totalValue" type="number" placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Project Deadline</Label>
              <Input id="deadline" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignedArchitect">Lead Architect</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select architect" />
                </SelectTrigger>
                <SelectContent>
                  {architects.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name} ({a.sacapCategory})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewProjectDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setNewProjectDialogOpen(false)}>
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
