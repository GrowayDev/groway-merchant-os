'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Search,
  Plus,
  User,
  Users,
  Clock,
  Calendar,
  CalendarDays,
  Coins,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  Mail,
  Phone,
  Shield,
  Briefcase,
  UserCheck,
  UserX,
  Timer,
  Coffee,
  LogIn,
  LogOut,
  FileText,
  Download,
  Filter,
  MoreVertical,
  Eye,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  AlertCircle,
  Award,
  Ban,
  Bot,
  Brain,
  Lightbulb,
  Target,
  PieChart,
  BarChart3,
  Calculator,
  Receipt,
  CreditCard,
  Wallet,
  PiggyBank,
  TrendingUp as TrendIcon,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Send,
  MessageSquare,
  FileWarning,
  Scale,
  Gavel,
  AlertTriangle,
  UserPlus,
  IdCard,
  BadgeCheck,
  Building2,
  MapPin,
  DollarSign,
  Percent,
  Star,
  Trophy,
  Zap,
  Activity,
  Users2,
  CalendarClock,
  ClipboardCheck,
  X,
} from 'lucide-react'

// Types
interface Employee {
  id: string
  employeeNumber: string
  name: string
  phone: string
  email: string
  idNumber: string
  role: string
  department: string
  position: string
  status: 'active' | 'on_leave' | 'terminated' | 'suspended' | 'probation'
  employmentType: 'permanent' | 'contract' | 'casual' | 'part_time'
  clockedIn: boolean
  clockInTime?: string
  weeklyHours: number
  targetHours: number
  monthlyHours: number
  hourlyRate: number
  monthlySalary: number
  startDate: string
  endDate?: string
  probationEndDate?: string
  permissions: string[]
  avatar?: string
  bankDetails: {
    bank: string
    accountNumber: string
    accountType: string
  }
  taxNumber: string
  leaveBalance: {
    annual: number
    sick: number
    family: number
    study: number
  }
  ytdEarnings: number
  ytdDeductions: number
  manager: string
  notes: string[]
  // Commission fields
  commissionRate?: number
  ytdCommission?: number
  monthlyCommission?: number
  // Performance fields
  performanceScore?: number
  salesTarget?: number
  salesAchieved?: number
  attendanceRate?: number
}

interface TimeEntry {
  id: string
  employeeId: string
  employeeName: string
  date: string
  clockIn: string
  clockOut?: string
  breakMinutes: number
  hours: number
  overtimeHours: number
  status: 'complete' | 'in_progress' | 'missed_clock_out' | 'absent'
  location?: string
  notes?: string
}

interface LeaveRequest {
  id: string
  employeeId: string
  employeeName: string
  type: 'annual' | 'sick' | 'family' | 'study' | 'maternity' | 'paternity' | 'unpaid'
  startDate: string
  endDate: string
  days: number
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  reason: string
  approvedBy?: string
  approvedDate?: string
  attachmentUrl?: string
}

interface PayRun {
  id: string
  period: string
  payDate: string
  status: 'draft' | 'processing' | 'completed' | 'failed'
  totalEmployees: number
  totalGross: number
  totalDeductions: number
  totalNet: number
  createdAt: string
}

interface DisciplinaryRecord {
  id: string
  employeeId: string
  employeeName: string
  type: 'verbal_warning' | 'written_warning' | 'final_warning' | 'suspension' | 'dismissal'
  offence: string
  description: string
  date: string
  status: 'pending' | 'scheduled' | 'completed' | 'appealed'
  outcome?: string
  issuedBy: string
  witnesses?: string[]
  attachmentUrl?: string
  appealDate?: string
  appealOutcome?: string
}

interface GroAIInsight {
  id: string
  type: 'compliance' | 'cost' | 'productivity' | 'risk'
  title: string
  description: string
  action: string
  priority: 'high' | 'medium' | 'low'
}

interface Shift {
  id: string
  employeeId: string
  employeeName: string
  date: string
  startTime: string
  endTime: string
  breakMinutes: number
  role: string
  location: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'absent' | 'late'
  notes?: string
}

interface CommissionRecord {
  id: string
  employeeId: string
  employeeName: string
  date: string
  type: 'sales' | 'service' | 'bonus' | 'referral'
  amount: number
  description: string
  status: 'pending' | 'approved' | 'paid'
  saleAmount?: number
  commissionRate: number
}

interface PerformanceMetric {
  employeeId: string
  employeeName: string
  period: string
  salesTarget: number
  salesAchieved: number
  targetAchieved: number
  avgTransactionValue: number
  customerSatisfaction: number
  attendanceRate: number
  punctualityScore: number
  totalCommission: number
  rank: number
}

// Roles configuration
const roles = [
  { id: 'manager', name: 'Manager', color: 'bg-purple-100 text-purple-700', permissions: ['all'], salary: 25000 },
  { id: 'supervisor', name: 'Supervisor', color: 'bg-blue-100 text-blue-700', permissions: ['pos', 'inventory', 'reports'], salary: 18000 },
  { id: 'cashier', name: 'Cashier', color: 'bg-green-100 text-green-700', permissions: ['pos', 'customers'], salary: 8500 },
  { id: 'chef', name: 'Chef/Kitchen', color: 'bg-orange-100 text-orange-700', permissions: ['kitchen', 'inventory'], salary: 12000 },
  { id: 'waiter', name: 'Waiter', color: 'bg-cyan-100 text-cyan-700', permissions: ['pos', 'customers'], salary: 6500 },
  { id: 'stock_clerk', name: 'Stock Clerk', color: 'bg-gray-100 text-gray-700', permissions: ['inventory'], salary: 7500 },
  { id: 'cleaner', name: 'Cleaner', color: 'bg-yellow-100 text-yellow-700', permissions: ['cleaning'], salary: 5500 },
]

// Shift templates
const shiftTemplates = [
  { name: 'Morning', startTime: '06:00', endTime: '14:00', breakMinutes: 30 },
  { name: 'Afternoon', startTime: '14:00', endTime: '22:00', breakMinutes: 30 },
  { name: 'Full Day', startTime: '08:00', endTime: '17:00', breakMinutes: 60 },
  { name: 'Night', startTime: '22:00', endTime: '06:00', breakMinutes: 45 },
]

// Generate mock employees
const generateEmployees = (): Employee[] => [
  { id: 'EMP-001', employeeNumber: 'GRO-001', name: 'Sipho Ndaba', phone: '+27 82 111 2222', email: 'sipho.n@groway.co.za', idNumber: '8501015800081', role: 'manager', department: 'Operations', position: 'General Manager', status: 'active', employmentType: 'permanent', clockedIn: true, clockInTime: '08:00', weeklyHours: 42, targetHours: 45, monthlyHours: 180, hourlyRate: 143, monthlySalary: 25000, startDate: '2024-01-15', permissions: ['all'], bankDetails: { bank: 'FNB', accountNumber: '****4521', accountType: 'Cheque' }, taxNumber: '1234567890', leaveBalance: { annual: 15, sick: 30, family: 3, study: 2 }, ytdEarnings: 50000, ytdDeductions: 12500, manager: 'Owner', notes: ['Excellent performance', 'Due for review Q2'], commissionRate: 5, ytdCommission: 12500, monthlyCommission: 2500, performanceScore: 92, salesTarget: 100000, salesAchieved: 118000, attendanceRate: 98 },
  { id: 'EMP-002', employeeNumber: 'GRO-002', name: 'Thandi Zwane', phone: '+27 83 222 3333', email: 'thandi.z@groway.co.za', idNumber: '9002150240085', role: 'supervisor', department: 'Front of House', position: 'Shift Supervisor', status: 'active', employmentType: 'permanent', clockedIn: true, clockInTime: '09:30', weeklyHours: 38, targetHours: 40, monthlyHours: 165, hourlyRate: 103, monthlySalary: 18000, startDate: '2024-03-20', permissions: ['pos', 'inventory', 'reports'], bankDetails: { bank: 'Capitec', accountNumber: '****7891', accountType: 'Savings' }, taxNumber: '2345678901', leaveBalance: { annual: 12, sick: 30, family: 3, study: 3 }, ytdEarnings: 36000, ytdDeductions: 9000, manager: 'Sipho Ndaba', notes: [], commissionRate: 3, ytdCommission: 5400, monthlyCommission: 1800, performanceScore: 88, salesTarget: 75000, salesAchieved: 82000, attendanceRate: 95 },
  { id: 'EMP-003', employeeNumber: 'GRO-003', name: 'Johan Botha', phone: '+27 84 333 4444', email: 'johan.b@groway.co.za', idNumber: '8803125679082', role: 'chef', department: 'Kitchen', position: 'Head Chef', status: 'active', employmentType: 'permanent', clockedIn: true, clockInTime: '07:00', weeklyHours: 45, targetHours: 45, monthlyHours: 195, hourlyRate: 69, monthlySalary: 12000, startDate: '2024-02-01', permissions: ['kitchen', 'inventory'], bankDetails: { bank: 'Standard', accountNumber: '****3456', accountType: 'Cheque' }, taxNumber: '3456789012', leaveBalance: { annual: 14, sick: 28, family: 3, study: 0 }, ytdEarnings: 24000, ytdDeductions: 6000, manager: 'Sipho Ndaba', notes: ['Food safety certified'], performanceScore: 90, attendanceRate: 97 },
  { id: 'EMP-004', employeeNumber: 'GRO-004', name: 'Precious Mokoena', phone: '+27 85 444 5555', email: 'precious.m@groway.co.za', idNumber: '9508120580089', role: 'cashier', department: 'Front of House', position: 'Senior Cashier', status: 'active', employmentType: 'permanent', clockedIn: false, weeklyHours: 32, targetHours: 40, monthlyHours: 140, hourlyRate: 49, monthlySalary: 8500, startDate: '2024-06-10', permissions: ['pos', 'customers'], bankDetails: { bank: 'TymeBank', accountNumber: '****2345', accountType: 'Savings' }, taxNumber: '4567890123', leaveBalance: { annual: 10, sick: 30, family: 3, study: 0 }, ytdEarnings: 17000, ytdDeductions: 4250, manager: 'Thandi Zwane', notes: [], commissionRate: 2, ytdCommission: 2100, monthlyCommission: 850, performanceScore: 85, salesTarget: 50000, salesAchieved: 54000, attendanceRate: 92 },
  { id: 'EMP-005', employeeNumber: 'GRO-005', name: 'David Khumalo', phone: '+27 86 555 6666', email: 'david.k@groway.co.za', idNumber: '9105015801087', role: 'waiter', department: 'Front of House', position: 'Waiter', status: 'on_leave', employmentType: 'permanent', clockedIn: false, weeklyHours: 28, targetHours: 35, monthlyHours: 120, hourlyRate: 37, monthlySalary: 6500, startDate: '2024-05-15', permissions: ['pos', 'customers'], bankDetails: { bank: 'Absa', accountNumber: '****6789', accountType: 'Savings' }, taxNumber: '5678901234', leaveBalance: { annual: 5, sick: 30, family: 3, study: 0 }, ytdEarnings: 13000, ytdDeductions: 3250, manager: 'Thandi Zwane', notes: ['Currently on annual leave'], commissionRate: 5, ytdCommission: 3200, monthlyCommission: 1200, performanceScore: 78, salesTarget: 30000, salesAchieved: 28000, attendanceRate: 88 },
  { id: 'EMP-006', employeeNumber: 'GRO-006', name: 'Nomsa Dlamini', phone: '+27 87 666 7777', email: 'nomsa.d@groway.co.za', idNumber: '9708150480092', role: 'stock_clerk', department: 'Operations', position: 'Stock Controller', status: 'active', employmentType: 'permanent', clockedIn: false, weeklyHours: 35, targetHours: 40, monthlyHours: 150, hourlyRate: 43, monthlySalary: 7500, startDate: '2024-07-01', permissions: ['inventory'], bankDetails: { bank: 'Nedbank', accountNumber: '****8901', accountType: 'Savings' }, taxNumber: '6789012345', leaveBalance: { annual: 8, sick: 30, family: 3, study: 0 }, ytdEarnings: 15000, ytdDeductions: 3750, manager: 'Sipho Ndaba', notes: [], performanceScore: 82, attendanceRate: 94 },
  { id: 'EMP-007', employeeNumber: 'GRO-007', name: 'Michael Peters', phone: '+27 88 777 8888', email: 'michael.p@groway.co.za', idNumber: '8901245679084', role: 'chef', department: 'Kitchen', position: 'Sous Chef', status: 'probation', employmentType: 'permanent', clockedIn: true, clockInTime: '10:00', weeklyHours: 40, targetHours: 45, monthlyHours: 175, hourlyRate: 66, monthlySalary: 11500, startDate: '2024-12-01', probationEndDate: '2026-03-01', permissions: ['kitchen', 'inventory'], bankDetails: { bank: 'FNB', accountNumber: '****1234', accountType: 'Cheque' }, taxNumber: '7890123456', leaveBalance: { annual: 6, sick: 30, family: 3, study: 0 }, ytdEarnings: 11500, ytdDeductions: 2875, manager: 'Johan Botha', notes: ['Probation period - review due March 2026'], performanceScore: 75, attendanceRate: 90 },
  { id: 'EMP-008', employeeNumber: 'GRO-008', name: 'Grace Nkosi', phone: '+27 89 888 9999', email: 'grace.n@groway.co.za', idNumber: '9805200480088', role: 'cashier', department: 'Front of House', position: 'Cashier', status: 'active', employmentType: 'casual', clockedIn: true, clockInTime: '14:00', weeklyHours: 25, targetHours: 30, monthlyHours: 100, hourlyRate: 45, monthlySalary: 0, startDate: '2024-08-15', permissions: ['pos', 'customers'], bankDetails: { bank: 'Capitec', accountNumber: '****5678', accountType: 'Savings' }, taxNumber: '8901234567', leaveBalance: { annual: 0, sick: 0, family: 0, study: 0 }, ytdEarnings: 9000, ytdDeductions: 0, manager: 'Thandi Zwane', notes: ['Casual employee - no leave benefits'], commissionRate: 2, ytdCommission: 1100, monthlyCommission: 450, performanceScore: 80, salesTarget: 35000, salesAchieved: 38000, attendanceRate: 85 },
]

const generateLeaveRequests = (): LeaveRequest[] => [
  { id: 'LV-001', employeeId: 'EMP-005', employeeName: 'David Khumalo', type: 'annual', startDate: '2026-02-14', endDate: '2026-02-21', days: 5, status: 'approved', reason: 'Family vacation', approvedBy: 'Sipho Ndaba', approvedDate: '2026-02-10' },
  { id: 'LV-002', employeeId: 'EMP-002', employeeName: 'Thandi Zwane', type: 'sick', startDate: '2026-02-20', endDate: '2026-02-21', days: 2, status: 'pending', reason: 'Doctor appointment and recovery', attachmentUrl: '/documents/medical-cert.pdf' },
  { id: 'LV-003', employeeId: 'EMP-004', employeeName: 'Precious Mokoena', type: 'family', startDate: '2026-02-28', endDate: '2026-02-28', days: 1, status: 'pending', reason: 'Child school event' },
  { id: 'LV-004', employeeId: 'EMP-006', employeeName: 'Nomsa Dlamini', type: 'study', startDate: '2026-03-15', endDate: '2026-03-19', days: 5, status: 'pending', reason: 'Final exams for diploma' },
]

const generatePayRuns = (): PayRun[] => [
  { id: 'PR-2026-01', period: 'January 2026', payDate: '2026-01-31', status: 'completed', totalEmployees: 8, totalGross: 92000, totalDeductions: 23000, totalNet: 69000, createdAt: '2026-01-25' },
  { id: 'PR-2026-02', period: 'February 2026', payDate: '2026-02-28', status: 'processing', totalEmployees: 8, totalGross: 95000, totalDeductions: 23750, totalNet: 71250, createdAt: '2026-02-20' },
]

const generateDisciplinaryRecords = (): DisciplinaryRecord[] => [
  { id: 'DIS-001', employeeId: 'EMP-004', employeeName: 'Precious Mokoena', type: 'verbal_warning', offence: 'Tardiness', description: 'Late arrival on 3 occasions in January 2026', date: '2026-02-05', status: 'completed', outcome: 'Verbal warning issued, employee acknowledged', issuedBy: 'Thandi Zwane', witnesses: ['David Khumalo'] },
  { id: 'DIS-002', employeeId: 'EMP-008', employeeName: 'Grace Nkosi', type: 'written_warning', offence: 'Cash shortage', description: 'Cash drawer shortage of R150 on 2026-02-10', date: '2026-02-12', status: 'completed', outcome: 'Written warning issued, repayment plan agreed', issuedBy: 'Thandi Zwane', attachmentUrl: '/documents/warning-grace.pdf' },
]

const generateInsights = (): GroAIInsight[] => [
  { id: 'INS-001', type: 'compliance', title: 'UIF Submission Due', description: 'UIF declaration for February 2026 is due by 7th March. Ensure all employee data is up to date.', action: 'Submit UIF declaration', priority: 'high' },
  { id: 'INS-002', type: 'cost', title: 'Overtime Costs Increasing', description: 'Overtime costs are 23% higher than budgeted. Consider hiring additional casual staff for peak periods.', action: 'Review overtime policy', priority: 'medium' },
  { id: 'INS-003', type: 'productivity', title: 'Clock-in Pattern Detected', description: 'Late arrivals increased by 15% this month. Consider implementing a flexible work policy or addressing team morale.', action: 'Schedule team meeting', priority: 'medium' },
  { id: 'INS-004', type: 'risk', title: 'Probation Review Due', description: 'Michael Peters (GRO-007) probation period ends on 1st March 2026. Schedule performance review.', action: 'Schedule probation review', priority: 'high' },
]

// Generate shifts for the current week
const generateShifts = (employees: Employee[]): Shift[] => {
  const shifts: Shift[] = []
  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay() + 1) // Monday
  
  const roles = ['cashier', 'waiter', 'chef', 'supervisor']
  const locations = ['Front Counter', 'Kitchen', 'Dining Area', 'Drive-thru']
  
  for (let day = 0; day < 7; day++) {
    const date = new Date(startOfWeek)
    date.setDate(startOfWeek.getDate() + day)
    const dateStr = date.toISOString().split('T')[0]
    
    employees.filter(e => e.status === 'active' || e.status === 'probation').forEach((emp, idx) => {
      const shiftType = idx % 3
      shifts.push({
        id: `SHF-${dateStr}-${emp.id}`,
        employeeId: emp.id,
        employeeName: emp.name,
        date: dateStr,
        startTime: shiftType === 0 ? '06:00' : shiftType === 1 ? '14:00' : '08:00',
        endTime: shiftType === 0 ? '14:00' : shiftType === 1 ? '22:00' : '17:00',
        breakMinutes: 30,
        role: emp.role,
        location: locations[idx % locations.length],
        status: date < today ? 'completed' : date.toDateString() === today.toDateString() ? 'scheduled' : 'scheduled',
      })
    })
  }
  
  return shifts
}

// Generate commission records
const generateCommissions = (employees: Employee[]): CommissionRecord[] => {
  const records: CommissionRecord[] = []
  
  employees.filter(e => e.commissionRate && e.commissionRate > 0).forEach(emp => {
    // Generate a few commission records per employee
    for (let i = 0; i < 3; i++) {
      const saleAmount = Math.floor(Math.random() * 5000) + 500
      records.push({
        id: `COM-${emp.id}-${i}`,
        employeeId: emp.id,
        employeeName: emp.name,
        date: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        type: i === 0 ? 'sales' : i === 1 ? 'service' : 'bonus',
        amount: Math.round(saleAmount * (emp.commissionRate || 0) / 100),
        description: i === 0 ? 'Sales commission' : i === 1 ? 'Service upsell commission' : 'Monthly performance bonus',
        status: i === 0 ? 'paid' : i === 1 ? 'approved' : 'pending',
        saleAmount,
        commissionRate: emp.commissionRate || 0,
      })
    }
  })
  
  return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

// Generate performance metrics
const generatePerformanceMetrics = (employees: Employee[]): PerformanceMetric[] => {
  return employees
    .filter(e => e.status === 'active' || e.status === 'probation')
    .map((emp, idx) => ({
      employeeId: emp.id,
      employeeName: emp.name,
      period: 'February 2026',
      salesTarget: emp.salesTarget || 50000,
      salesAchieved: emp.salesAchieved || 45000,
      targetAchieved: Math.round(((emp.salesAchieved || 45000) / (emp.salesTarget || 50000)) * 100),
      avgTransactionValue: Math.floor(Math.random() * 200) + 150,
      customerSatisfaction: Math.floor(Math.random() * 20) + 80,
      attendanceRate: emp.attendanceRate || 90,
      punctualityScore: Math.floor(Math.random() * 15) + 85,
      totalCommission: emp.monthlyCommission || 0,
      rank: 0,
    }))
    .sort((a, b) => b.targetAchieved - a.targetAchieved)
    .map((emp, idx) => ({ ...emp, rank: idx + 1 }))
}

// Component
export function StaffHRMView() {
  const [employees, setEmployees] = useState<Employee[]>(generateEmployees)
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(generateLeaveRequests)
  const [payRuns] = useState<PayRun[]>(generatePayRuns)
  const [disciplinaryRecords] = useState<DisciplinaryRecord[]>(generateDisciplinaryRecords)
  const [insights] = useState<GroAIInsight[]>(generateInsights)
  const [shifts, setShifts] = useState<Shift[]>(() => generateShifts(employees))
  const [commissions, setCommissions] = useState<CommissionRecord[]>(() => generateCommissions(employees))
  const [performanceMetrics] = useState<PerformanceMetric[]>(() => generatePerformanceMetrics(employees))
  
  const [activeTab, setActiveTab] = useState<string>('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  
  // Dialog states
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false)
  const [clockInOpen, setClockInOpen] = useState(false)
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [payrollDialogOpen, setPayrollDialogOpen] = useState(false)
  const [disciplinaryDialogOpen, setDisciplinaryDialogOpen] = useState(false)
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [newEmployee, setNewEmployee] = useState({ name: '', phone: '', email: '', role: 'cashier', hourlyRate: 45, monthlySalary: 0 })
  
  // New dialog states
  const [shiftDialogOpen, setShiftDialogOpen] = useState(false)
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null)
  const [newLeaveOpen, setNewLeaveOpen] = useState(false)
  const [newLeave, setNewLeave] = useState({ employeeId: '', type: 'annual', startDate: '', endDate: '', reason: '' })
  const [scheduleWeekStart, setScheduleWeekStart] = useState(() => {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay() + 1)
    return startOfWeek
  })
  const [commissionDialogOpen, setCommissionDialogOpen] = useState(false)
  const [newCommission, setNewCommission] = useState({ employeeId: '', type: 'sales', amount: 0, description: '', saleAmount: 0 })

  // Computed stats
  const totalEmployees = employees.length
  const activeEmployees = employees.filter(e => e.status === 'active' || e.status === 'probation').length
  const currentlyClockedIn = employees.filter(e => e.clockedIn).length
  const onLeave = employees.filter(e => e.status === 'on_leave').length
  const monthlyPayroll = employees.reduce((s, e) => s + (e.monthlySalary || e.hourlyRate * e.monthlyHours * 4.33), 0)
  const pendingLeave = leaveRequests.filter(l => l.status === 'pending').length
  const probationEmployees = employees.filter(e => e.status === 'probation')
  const totalMonthlyCommission = employees.reduce((s, e) => s + (e.monthlyCommission || 0), 0)
  const pendingCommissions = commissions.filter(c => c.status === 'pending').reduce((s, c) => s + c.amount, 0)

  // Get role info
  const getRoleInfo = (roleId: string) => roles.find(r => r.id === roleId) || roles[roles.length - 1]

  // Get initials
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase()

  // Filtered employees
  const filteredEmployees = useMemo(() => employees.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.employeeNumber.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'all' || e.role === roleFilter
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  }), [employees, searchQuery, roleFilter, statusFilter])

  // Clock in/out handler
  const handleClockToggle = (employee: Employee) => {
    setEmployees(prev => prev.map(e => {
      if (e.id === employee.id) {
        return {
          ...e,
          clockedIn: !e.clockedIn,
          clockInTime: !e.clockedIn ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
        }
      }
      return e
    }))
  }

  // Approve leave
  const handleLeaveAction = (leaveId: string, action: 'approve' | 'reject') => {
    setLeaveRequests(prev => prev.map(l => 
      l.id === leaveId ? { ...l, status: action === 'approve' ? 'approved' : 'rejected' } : l
    ))
  }

  // Format currency
  const formatCurrency = (amount: number) => `R${amount.toLocaleString()}`

  // Get days in week
  const getWeekDays = (startDate: Date) => {
    const days = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      days.push(date)
    }
    return days
  }

  // Render GroAI Insights
  const renderGroAIInsights = () => (
    <Card className="border-l-4 border-l-[#00897B]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Bot className="h-4 w-4 text-[#00897B]" />
          GroAI HR Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {insights.map(insight => {
            const typeIcons = {
              compliance: Shield,
              cost: Coins,
              productivity: TrendingUp,
              risk: AlertTriangle,
            }
            const priorityColors = {
              high: 'border-red-200 bg-red-50',
              medium: 'border-amber-200 bg-amber-50',
              low: 'border-green-200 bg-green-50',
            }
            const Icon = typeIcons[insight.type]
            return (
              <div key={insight.id} className={`p-3 rounded-lg border ${priorityColors[insight.priority]}`}>
                <div className="flex items-start gap-3">
                  <Icon className={`h-5 w-5 mt-0.5 ${insight.priority === 'high' ? 'text-red-600' : insight.priority === 'medium' ? 'text-amber-600' : 'text-green-600'}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{insight.title}</h4>
                      <Badge variant="outline" className="text-[10px]">{insight.priority}</Badge>
                    </div>
                    <p className="text-xs text-[#757575] mt-1">{insight.description}</p>
                    <Button size="sm" variant="outline" className="mt-2 h-7 text-xs">
                      {insight.action}
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )

  // Render Dashboard
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="border-l-4 border-l-[#00897B]">
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Total Staff</p>
            <p className="text-2xl font-bold">{totalEmployees}</p>
            <p className="text-xs text-[#757575]">{activeEmployees} active</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Clocked In</p>
            <p className="text-2xl font-bold text-green-600">{currentlyClockedIn}</p>
            <p className="text-xs text-green-600">Currently working</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">On Leave</p>
            <p className="text-2xl font-bold text-orange-600">{onLeave}</p>
            <p className="text-xs text-orange-600">Absent today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Monthly Payroll</p>
            <p className="text-2xl font-bold">{formatCurrency(monthlyPayroll)}</p>
            <p className="text-xs text-[#757575]">Estimated</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Commissions</p>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalMonthlyCommission)}</p>
            <p className="text-xs text-purple-600">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Pending Leave</p>
            <p className="text-2xl font-bold text-blue-600">{pendingLeave}</p>
            <p className="text-xs text-blue-600">Requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 flex-wrap">
        <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setOnboardingOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />Onboard Employee
        </Button>
        <Button variant="outline" onClick={() => setClockInOpen(true)}>
          <LogIn className="h-4 w-4 mr-2" />Clock In/Out
        </Button>
        <Button variant="outline" onClick={() => setActiveTab('schedule')}>
          <CalendarDays className="h-4 w-4 mr-2" />Shift Schedule
        </Button>
        <Button variant="outline" onClick={() => setLeaveDialogOpen(true)}>
          <Calendar className="h-4 w-4 mr-2" />Leave Requests
        </Button>
        <Button variant="outline" onClick={() => setActiveTab('commissions')}>
          <DollarSign className="h-4 w-4 mr-2" />Commissions
        </Button>
        <Button variant="outline" onClick={() => setActiveTab('performance')}>
          <BarChart3 className="h-4 w-4 mr-2" />Performance
        </Button>
      </div>

      {/* GroAI Insights */}
      {renderGroAIInsights()}

      {/* Currently Working & Pending Leave */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Timer className="h-4 w-4 text-green-500" />
              Currently Working
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {employees.filter(e => e.clockedIn).map(employee => {
              const roleInfo = getRoleInfo(employee.role)
              return (
                <div key={employee.id} className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-green-200 text-green-700 text-sm">
                        {getInitials(employee.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{employee.name}</p>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[10px] ${roleInfo.color}`}>{roleInfo.name}</Badge>
                      <span className="text-xs text-[#757575]">Since {employee.clockInTime}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleClockToggle(employee)}>
                    <LogOut className="h-3 w-3 mr-1" />Out
                  </Button>
                </div>
              )
            })}
            {currentlyClockedIn === 0 && (
              <p className="text-sm text-[#757575] text-center py-4">No one is currently clocked in</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-500" />
              Pending Leave Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {leaveRequests.filter(l => l.status === 'pending').map(leave => (
              <div key={leave.id} className="flex items-center gap-3 p-2 bg-orange-50 rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-orange-200 text-orange-700 text-sm">
                    {getInitials(leave.employeeName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">{leave.employeeName}</p>
                  <p className="text-xs text-[#757575]">{leave.type} leave • {leave.days} day(s)</p>
                  <p className="text-xs text-[#757575]">{leave.startDate} - {leave.endDate}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleLeaveAction(leave.id, 'approve')}>
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleLeaveAction(leave.id, 'reject')}>
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {leaveRequests.filter(l => l.status === 'pending').length === 0 && (
              <p className="text-sm text-[#757575] text-center py-4">No pending requests</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview & Commission Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              Top Performers This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {performanceMetrics.slice(0, 5).map((metric, idx) => (
                <div key={metric.employeeId} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-gray-200 text-gray-700' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{metric.employeeName}</p>
                    <p className="text-xs text-[#757575]">{metric.targetAchieved}% of target</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">{formatCurrency(metric.salesAchieved)}</p>
                    <p className="text-xs text-[#757575]">Achieved</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Coins className="h-4 w-4 text-purple-500" />
                Commission Summary
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => setCommissionDialogOpen(true)}>
                <Plus className="h-3 w-3 mr-1" />Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4 text-center">
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-lg font-bold text-purple-600">{formatCurrency(totalMonthlyCommission)}</p>
                <p className="text-[10px] text-purple-600">Total Monthly</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <p className="text-lg font-bold text-amber-600">{formatCurrency(pendingCommissions)}</p>
                <p className="text-[10px] text-amber-600">Pending</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-lg font-bold text-green-600">{formatCurrency(commissions.filter(c => c.status === 'paid').reduce((s, c) => s + c.amount, 0))}</p>
                <p className="text-[10px] text-green-600">Paid</p>
              </div>
            </div>
            <Separator className="my-3" />
            <div className="space-y-2">
              {commissions.slice(0, 4).map(commission => (
                <div key={commission.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium">{commission.employeeName}</p>
                    <p className="text-xs text-[#757575]">{commission.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatCurrency(commission.amount)}</p>
                    <Badge className={`text-[10px] ${commission.status === 'paid' ? 'bg-green-100 text-green-700' : commission.status === 'approved' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                      {commission.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // Render Employees List
  const renderEmployees = () => (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
          <Input placeholder="Search employees..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="probation">Probation</SelectItem>
            <SelectItem value="on_leave">On Leave</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="terminated">Terminated</SelectItem>
          </SelectContent>
        </Select>
        <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setOnboardingOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />Onboard Employee
        </Button>
      </div>

      {/* Employee List */}
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filteredEmployees.map(employee => {
            const roleInfo = getRoleInfo(employee.role)
            return (
              <Card key={employee.id} className="cursor-pointer hover:shadow-md transition-all" onClick={() => setSelectedEmployee(employee)}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-[#E0F2F1] text-[#00897B]">
                          {getInitials(employee.name)}
                        </AvatarFallback>
                      </Avatar>
                      {employee.clockedIn && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                          <Timer className="h-2.5 w-2.5 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate">{employee.name}</h4>
                        <span className="text-xs text-[#757575]">{employee.employeeNumber}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`text-[10px] ${roleInfo.color}`}>{roleInfo.name}</Badge>
                        {employee.status === 'probation' && <Badge className="bg-blue-100 text-blue-700 text-[10px]">Probation</Badge>}
                        {employee.status === 'on_leave' && <Badge className="bg-orange-100 text-orange-700 text-[10px]">On Leave</Badge>}
                        {employee.status === 'suspended' && <Badge className="bg-red-100 text-red-700 text-[10px]">Suspended</Badge>}
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-[#757575]">
                        <span>{employee.department}</span>
                        <span>{employee.employmentType}</span>
                        {employee.commissionRate && <span className="text-purple-600">{employee.commissionRate}% comm</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{formatCurrency(employee.monthlySalary || employee.hourlyRate * employee.monthlyHours * 4.33)}</p>
                      <p className="text-xs text-[#757575]">{employee.weeklyHours}h/week</p>
                      <Button 
                        size="sm" 
                        variant={employee.clockedIn ? 'outline' : 'default'}
                        className={`mt-2 ${!employee.clockedIn ? 'bg-green-600 hover:bg-green-700' : ''}`}
                        onClick={(e) => { e.stopPropagation(); handleClockToggle(employee); }}
                      >
                        {employee.clockedIn ? <><LogOut className="h-3 w-3 mr-1" />Out</> : <><LogIn className="h-3 w-3 mr-1" />In</>}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )

  // Render Shift Schedule Calendar
  const renderShiftSchedule = () => {
    const weekDays = getWeekDays(scheduleWeekStart)
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const hours = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00']
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="font-bold">Shift Schedule</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => {
                const prevWeek = new Date(scheduleWeekStart)
                prevWeek.setDate(scheduleWeekStart.getDate() - 7)
                setScheduleWeekStart(prevWeek)
              }}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                {weekDays[0].toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })} - {weekDays[6].toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              <Button variant="outline" size="sm" onClick={() => {
                const nextWeek = new Date(scheduleWeekStart)
                nextWeek.setDate(scheduleWeekStart.getDate() + 7)
                setScheduleWeekStart(nextWeek)
              }}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />Export
            </Button>
            <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setShiftDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />Add Shift
            </Button>
          </div>
        </div>

        {/* Schedule Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-green-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{shifts.filter(s => s.status === 'completed').length}</p>
              <p className="text-xs text-green-600">Completed</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{shifts.filter(s => s.status === 'scheduled').length}</p>
              <p className="text-xs text-blue-600">Scheduled</p>
            </CardContent>
          </Card>
          <Card className="bg-amber-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{shifts.filter(s => s.status === 'in_progress').length}</p>
              <p className="text-xs text-amber-600">In Progress</p>
            </CardContent>
          </Card>
          <Card className="bg-red-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{shifts.filter(s => s.status === 'absent').length}</p>
              <p className="text-xs text-red-600">Absent</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{shifts.reduce((s, sh) => s + (parseInt(sh.endTime) - parseInt(sh.startTime)), 0)}h</p>
              <p className="text-xs text-[#757575]">Total Hours</p>
            </CardContent>
          </Card>
        </div>

        {/* Calendar Grid */}
        <Card>
          <CardContent className="p-4">
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Header */}
                <div className="grid grid-cols-8 gap-1 mb-2">
                  <div className="p-2 text-xs font-medium text-[#757575]">Time</div>
                  {weekDays.map((day, idx) => (
                    <div key={idx} className={`p-2 text-center text-xs font-medium ${day.toDateString() === new Date().toDateString() ? 'bg-[#00897B] text-white rounded' : ''}`}>
                      <p>{dayNames[idx]}</p>
                      <p className="font-bold">{day.getDate()}</p>
                    </div>
                  ))}
                </div>
                
                {/* Time slots */}
                {hours.map((hour, hourIdx) => (
                  <div key={hour} className="grid grid-cols-8 gap-1">
                    <div className="p-2 text-xs text-[#757575] border-t">{hour}</div>
                    {weekDays.map((day, dayIdx) => {
                      const dayStr = day.toISOString().split('T')[0]
                      const shiftAtTime = shifts.find(s => 
                        s.date === dayStr && 
                        s.startTime <= hour && 
                        s.endTime > hour
                      )
                      return (
                        <div key={dayIdx} className="border-t min-h-[40px] p-1">
                          {shiftAtTime && shiftAtTime.startTime === hour && (
                            <div 
                              className="p-1 text-[10px] rounded cursor-pointer hover:opacity-80 bg-[#00897B]/10 border-l-2 border-[#00897B]"
                              onClick={() => setSelectedShift(shiftAtTime)}
                            >
                              <p className="font-medium truncate">{shiftAtTime.employeeName}</p>
                              <p className="text-[#757575]">{shiftAtTime.startTime}-{shiftAtTime.endTime}</p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Shifts */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Today's Shifts</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {shifts.filter(s => s.date === new Date().toISOString().split('T')[0]).map(shift => (
                <div key={shift.id} className="p-3 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-[#E0F2F1] text-[#00897B] text-xs">
                        {getInitials(shift.employeeName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{shift.employeeName}</p>
                      <p className="text-xs text-[#757575]">{shift.startTime} - {shift.endTime} • {shift.location}</p>
                    </div>
                  </div>
                  <Badge className={`${shift.status === 'completed' ? 'bg-green-100 text-green-700' : shift.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : shift.status === 'absent' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                    {shift.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Render Time & Attendance
  const renderTimeAttendance = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-bold">Time & Attendance</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setClockInOpen(true)}>
            <LogIn className="h-4 w-4 mr-2" />Quick Clock In/Out
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />Export Timesheet
          </Button>
        </div>
      </div>

      {/* Today's Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-green-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{currentlyClockedIn}</p>
            <p className="text-xs text-green-600">Currently Working</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{onLeave}</p>
            <p className="text-xs text-orange-600">On Leave</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{totalEmployees - currentlyClockedIn - onLeave}</p>
            <p className="text-xs text-blue-600">Not Clocked In</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{employees.reduce((s, e) => s + e.weeklyHours, 0)}h</p>
            <p className="text-xs text-[#757575]">Total Hours This Week</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{Math.round(employees.reduce((s, e) => s + (e.attendanceRate || 0), 0) / employees.length)}%</p>
            <p className="text-xs text-purple-600">Avg Attendance</p>
          </CardContent>
        </Card>
      </div>

      {/* Employee Time Status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Today's Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {employees.filter(e => e.status === 'active' || e.status === 'probation').map(emp => (
              <div key={emp.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-[#E0F2F1] text-[#00897B] text-sm">
                      {getInitials(emp.name)}
                    </AvatarFallback>
                  </Avatar>
                  {emp.clockedIn && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{emp.name}</p>
                  <p className="text-xs text-[#757575]">{emp.position}</p>
                </div>
                <div className="text-right">
                  {emp.clockedIn ? (
                    <div>
                      <p className="text-sm font-medium text-green-600">Working</p>
                      <p className="text-xs text-[#757575]">Since {emp.clockInTime}</p>
                    </div>
                  ) : emp.status === 'on_leave' ? (
                    <div>
                      <p className="text-sm font-medium text-orange-600">On Leave</p>
                    </div>
                  ) : (
                    <p className="text-sm text-[#757575]">Not clocked in</p>
                  )}
                </div>
                <Button 
                  size="sm" 
                  variant={emp.clockedIn ? 'outline' : 'default'}
                  className={!emp.clockedIn ? 'bg-green-600 hover:bg-green-700' : ''}
                  onClick={() => handleClockToggle(emp)}
                >
                  {emp.clockedIn ? <><LogOut className="h-3 w-3 mr-1" />Clock Out</> : <><LogIn className="h-3 w-3 mr-1" />Clock In</>}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Render Leave Management
  const renderLeave = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-bold">Leave Management</h2>
        <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setNewLeaveOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />Request Leave
        </Button>
      </div>

      {/* Leave Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-orange-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{leaveRequests.filter(l => l.status === 'pending').length}</p>
            <p className="text-xs text-orange-600">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{leaveRequests.filter(l => l.status === 'approved').length}</p>
            <p className="text-xs text-green-600">Approved</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{leaveRequests.filter(l => l.status === 'rejected').length}</p>
            <p className="text-xs text-red-600">Rejected</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{employees.reduce((s, e) => s + e.leaveBalance.annual, 0)}</p>
            <p className="text-xs text-[#757575]">Total Annual Days</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{employees.reduce((s, e) => s + e.leaveBalance.sick, 0)}</p>
            <p className="text-xs text-[#757575]">Total Sick Days</p>
          </CardContent>
        </Card>
      </div>

      {/* Leave Balance by Employee */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Leave Balances</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {employees.map(emp => (
              <div key={emp.id} className="p-3 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-[#E0F2F1] text-[#00897B] text-xs">
                      {getInitials(emp.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{emp.name}</p>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-center text-xs">
                    <div>
                      <p className="font-bold">{emp.leaveBalance.annual}</p>
                      <p className="text-[#757575]">Annual</p>
                    </div>
                    <div>
                      <p className="font-bold">{emp.leaveBalance.sick}</p>
                      <p className="text-[#757575]">Sick</p>
                    </div>
                    <div>
                      <p className="font-bold">{emp.leaveBalance.family}</p>
                      <p className="text-[#757575]">Family</p>
                    </div>
                    <div>
                      <p className="font-bold">{emp.leaveBalance.study}</p>
                      <p className="text-[#757575]">Study</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Leave Requests */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Leave Requests</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {leaveRequests.map(leave => (
              <div key={leave.id} className="p-3 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-orange-100 text-orange-700 text-xs">
                      {getInitials(leave.employeeName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{leave.employeeName}</p>
                      <Badge variant="outline" className="text-[10px]">{leave.type}</Badge>
                    </div>
                    <p className="text-xs text-[#757575]">{leave.startDate} - {leave.endDate} ({leave.days} days)</p>
                    <p className="text-xs text-[#757575]">{leave.reason}</p>
                  </div>
                  <Badge className={`${leave.status === 'approved' ? 'bg-green-100 text-green-700' : leave.status === 'rejected' ? 'bg-red-100 text-red-700' : leave.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'}`}>
                    {leave.status}
                  </Badge>
                  {leave.status === 'pending' && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleLeaveAction(leave.id, 'approve')}>
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleLeaveAction(leave.id, 'reject')}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Render Commission Tracking
  const renderCommissions = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-bold flex items-center gap-2">
          <DollarSign className="h-5 w-5" />Commission Tracking
        </h2>
        <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setCommissionDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />Add Commission
        </Button>
      </div>

      {/* Commission Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-purple-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalMonthlyCommission)}</p>
            <p className="text-xs text-purple-600">This Month</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{formatCurrency(commissions.filter(c => c.status === 'paid').reduce((s, c) => s + c.amount, 0))}</p>
            <p className="text-xs text-green-600">Paid Out</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(commissions.filter(c => c.status === 'approved').reduce((s, c) => s + c.amount, 0))}</p>
            <p className="text-xs text-blue-600">Approved</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(pendingCommissions)}</p>
            <p className="text-xs text-amber-600">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{employees.filter(e => e.commissionRate && e.commissionRate > 0).length}</p>
            <p className="text-xs text-[#757575]">Commission Staff</p>
          </CardContent>
        </Card>
      </div>

      {/* Commission by Employee */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Commission by Employee</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {employees.filter(e => e.commissionRate && e.commissionRate > 0).map(emp => (
                <div key={emp.id} className="p-3 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-purple-100 text-purple-700">
                        {getInitials(emp.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{emp.name}</p>
                      <p className="text-xs text-[#757575]">{emp.position}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-purple-600">{formatCurrency(emp.monthlyCommission || 0)}</p>
                      <p className="text-xs text-[#757575]">{emp.commissionRate}% rate</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Recent Commissions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y max-h-80 overflow-y-auto">
              {commissions.slice(0, 10).map(commission => (
                <div key={commission.id} className="p-3 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <Percent className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{commission.employeeName}</p>
                      <p className="text-xs text-[#757575]">{commission.description}</p>
                      <p className="text-xs text-[#757575]">{commission.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{formatCurrency(commission.amount)}</p>
                      <Badge className={`text-[10px] ${commission.status === 'paid' ? 'bg-green-100 text-green-700' : commission.status === 'approved' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                        {commission.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // Render Performance Metrics
  const renderPerformance = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-bold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />Performance Metrics
        </h2>
        <div className="flex gap-2">
          <Select defaultValue="month">
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />Export
          </Button>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-green-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{formatCurrency(performanceMetrics.reduce((s, m) => s + m.salesAchieved, 0))}</p>
            <p className="text-xs text-green-600">Total Sales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{Math.round(performanceMetrics.reduce((s, m) => s + m.targetAchieved, 0) / performanceMetrics.length)}%</p>
            <p className="text-xs text-[#757575]">Avg Target Achievement</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{formatCurrency(Math.round(performanceMetrics.reduce((s, m) => s + m.avgTransactionValue, 0) / performanceMetrics.length))}</p>
            <p className="text-xs text-[#757575]">Avg Transaction</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{Math.round(performanceMetrics.reduce((s, m) => s + m.customerSatisfaction, 0) / performanceMetrics.length)}%</p>
            <p className="text-xs text-blue-600">Customer Satisfaction</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{Math.round(performanceMetrics.reduce((s, m) => s + m.attendanceRate, 0) / performanceMetrics.length)}%</p>
            <p className="text-xs text-purple-600">Avg Attendance</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Leaderboard */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            Performance Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Sales Target</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Achieved</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">%</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Avg Trans</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">CSAT</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Attendance</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {performanceMetrics.map((metric, idx) => {
                  const emp = employees.find(e => e.id === metric.employeeId)
                  return (
                    <tr key={metric.employeeId} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-gray-200 text-gray-700' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                          {idx + 1}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-[#E0F2F1] text-[#00897B] text-xs">
                              {getInitials(metric.employeeName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{metric.employeeName}</p>
                            <p className="text-xs text-[#757575]">{emp?.position}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{formatCurrency(metric.salesTarget)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-green-600">{formatCurrency(metric.salesAchieved)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Progress value={metric.targetAchieved} className="w-16 h-2" />
                          <span className={`text-xs font-medium ${metric.targetAchieved >= 100 ? 'text-green-600' : metric.targetAchieved >= 80 ? 'text-amber-600' : 'text-red-600'}`}>
                            {metric.targetAchieved}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{formatCurrency(metric.avgTransactionValue)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium ${metric.customerSatisfaction >= 90 ? 'text-green-600' : metric.customerSatisfaction >= 80 ? 'text-amber-600' : 'text-red-600'}`}>
                          {metric.customerSatisfaction}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium ${metric.attendanceRate >= 95 ? 'text-green-600' : metric.attendanceRate >= 85 ? 'text-amber-600' : 'text-red-600'}`}>
                          {metric.attendanceRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-purple-600">{formatCurrency(metric.totalCommission)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Render Payroll
  const renderPayroll = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-bold">Payroll</h2>
        <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setPayrollDialogOpen(true)}>
          <Calculator className="h-4 w-4 mr-2" />Run Payroll
        </Button>
      </div>

      {/* Payroll Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[#00897B]">
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Monthly Payroll</p>
            <p className="text-2xl font-bold">{formatCurrency(monthlyPayroll)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Total Commission</p>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalMonthlyCommission)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Est. Deductions</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(Math.round(monthlyPayroll * 0.25))}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Net Pay</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(Math.round(monthlyPayroll * 0.75))}</p>
          </CardContent>
        </Card>
      </div>

      {/* Pay Runs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Pay Runs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {payRuns.map(run => (
              <div key={run.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium">{run.period}</p>
                    <p className="text-xs text-[#757575]">Pay date: {run.payDate}</p>
                  </div>
                  <Badge className={run.status === 'completed' ? 'bg-green-100 text-green-700' : run.status === 'processing' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}>
                    {run.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <p className="text-[#757575]">Employees</p>
                    <p className="font-medium">{run.totalEmployees}</p>
                  </div>
                  <div>
                    <p className="text-[#757575]">Gross</p>
                    <p className="font-medium">{formatCurrency(run.totalGross)}</p>
                  </div>
                  <div>
                    <p className="text-[#757575]">Deductions</p>
                    <p className="font-medium text-red-600">-{formatCurrency(run.totalDeductions)}</p>
                  </div>
                  <div>
                    <p className="text-[#757575]">Net Pay</p>
                    <p className="font-medium text-[#00897B]">{formatCurrency(run.totalNet)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[#1A1A1A] flex items-center gap-2">
              <Users className="h-5 w-5 text-[#00897B]" />
              Staff & HR Management
            </h1>
            <p className="text-xs text-[#757575]">Employee management, scheduling, payroll & performance</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Timer className="h-3 w-3 mr-1" />{currentlyClockedIn} working
            </Badge>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-11 bg-transparent flex-wrap">
            <TabsTrigger value="dashboard" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] data-[state=active]:shadow-none rounded-none text-xs">Dashboard</TabsTrigger>
            <TabsTrigger value="employees" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] data-[state=active]:shadow-none rounded-none text-xs">Employees</TabsTrigger>
            <TabsTrigger value="schedule" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] data-[state=active]:shadow-none rounded-none text-xs">Schedule</TabsTrigger>
            <TabsTrigger value="attendance" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] data-[state=active]:shadow-none rounded-none text-xs">Attendance</TabsTrigger>
            <TabsTrigger value="leave" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] data-[state=active]:shadow-none rounded-none text-xs">Leave</TabsTrigger>
            <TabsTrigger value="commissions" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] data-[state=active]:shadow-none rounded-none text-xs">Commissions</TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] data-[state=active]:shadow-none rounded-none text-xs">Performance</TabsTrigger>
            <TabsTrigger value="payroll" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] data-[state=active]:shadow-none rounded-none text-xs">Payroll</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'employees' && renderEmployees()}
          {activeTab === 'schedule' && renderShiftSchedule()}
          {activeTab === 'attendance' && renderTimeAttendance()}
          {activeTab === 'leave' && renderLeave()}
          {activeTab === 'commissions' && renderCommissions()}
          {activeTab === 'performance' && renderPerformance()}
          {activeTab === 'payroll' && renderPayroll()}
        </div>
      </ScrollArea>

      {/* Clock In/Out Dialog */}
      <Dialog open={clockInOpen} onOpenChange={setClockInOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick Clock In/Out</DialogTitle>
            <DialogDescription>Select an employee to clock in or out</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 py-4 max-h-[60vh] overflow-y-auto">
            {employees.filter(e => e.status === 'active' || e.status === 'probation').map(emp => (
              <Button
                key={emp.id}
                variant={emp.clockedIn ? 'outline' : 'default'}
                className={`h-auto p-3 justify-start ${!emp.clockedIn ? 'bg-green-600 hover:bg-green-700' : ''}`}
                onClick={() => { handleClockToggle(emp); setClockInOpen(false) }}
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={!emp.clockedIn ? 'bg-green-200 text-green-700' : 'bg-gray-200 text-gray-700'}>
                      {getInitials(emp.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="text-sm font-medium">{emp.name}</p>
                    <p className="text-xs opacity-80">{emp.clockedIn ? 'Clock Out' : 'Clock In'}</p>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Onboarding Dialog */}
      <Dialog open={onboardingOpen} onOpenChange={setOnboardingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Onboard New Employee</DialogTitle>
            <DialogDescription>Add a new employee to your team</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Full Name</Label>
                <Input value={newEmployee.name} onChange={e => setNewEmployee(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={newEmployee.role} onValueChange={v => setNewEmployee(p => ({ ...p, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phone</Label>
                <Input value={newEmployee.phone} onChange={e => setNewEmployee(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={newEmployee.email} onChange={e => setNewEmployee(p => ({ ...p, email: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Hourly Rate</Label>
                <Input type="number" value={newEmployee.hourlyRate} onChange={e => setNewEmployee(p => ({ ...p, hourlyRate: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label>Monthly Salary</Label>
                <Input type="number" value={newEmployee.monthlySalary} onChange={e => setNewEmployee(p => ({ ...p, monthlySalary: parseFloat(e.target.value) || 0 }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOnboardingOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setOnboardingOpen(false)}>Onboard Employee</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave Dialog */}
      <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Requests</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto">
            {leaveRequests.map(leave => (
              <div key={leave.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{leave.employeeName}</p>
                    <p className="text-xs text-[#757575]">{leave.type} • {leave.days} days</p>
                    <p className="text-xs text-[#757575]">{leave.startDate} - {leave.endDate}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${leave.status === 'approved' ? 'bg-green-100 text-green-700' : leave.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {leave.status}
                    </Badge>
                    {leave.status === 'pending' && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => handleLeaveAction(leave.id, 'approve')}><CheckCircle2 className="h-4 w-4 text-green-600" /></Button>
                        <Button size="sm" variant="outline" onClick={() => handleLeaveAction(leave.id, 'reject')}><XCircle className="h-4 w-4 text-red-600" /></Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Leave Request Dialog */}
      <Dialog open={newLeaveOpen} onOpenChange={setNewLeaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Leave Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Employee</Label>
              <Select value={newLeave.employeeId} onValueChange={v => setNewLeave(p => ({ ...p, employeeId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Leave Type</Label>
              <Select value={newLeave.type} onValueChange={v => setNewLeave(p => ({ ...p, type: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">Annual Leave</SelectItem>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="family">Family Responsibility</SelectItem>
                  <SelectItem value="study">Study Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={newLeave.startDate} onChange={e => setNewLeave(p => ({ ...p, startDate: e.target.value }))} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" value={newLeave.endDate} onChange={e => setNewLeave(p => ({ ...p, endDate: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Reason</Label>
              <Textarea value={newLeave.reason} onChange={e => setNewLeave(p => ({ ...p, reason: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewLeaveOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setNewLeaveOpen(false)}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Commission Dialog */}
      <Dialog open={commissionDialogOpen} onOpenChange={setCommissionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Commission</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Employee</Label>
              <Select value={newCommission.employeeId} onValueChange={v => setNewCommission(p => ({ ...p, employeeId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {employees.filter(e => e.commissionRate && e.commissionRate > 0).map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.name} ({e.commissionRate}%)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type</Label>
              <Select value={newCommission.type} onValueChange={v => setNewCommission(p => ({ ...p, type: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales Commission</SelectItem>
                  <SelectItem value="service">Service Commission</SelectItem>
                  <SelectItem value="bonus">Bonus</SelectItem>
                  <SelectItem value="referral">Referral Bonus</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sale Amount</Label>
              <Input type="number" value={newCommission.saleAmount} onChange={e => setNewCommission(p => ({ ...p, saleAmount: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={newCommission.description} onChange={e => setNewCommission(p => ({ ...p, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommissionDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setCommissionDialogOpen(false)}>Add Commission</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Employee Detail Dialog */}
      <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-[#E0F2F1] text-[#00897B] text-xl">
                    {getInitials(selectedEmployee.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-bold">{selectedEmployee.name}</h3>
                  <p className="text-sm text-[#757575]">{selectedEmployee.position}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getRoleInfo(selectedEmployee.role).color}>{getRoleInfo(selectedEmployee.role).name}</Badge>
                    <Badge className={`${selectedEmployee.status === 'active' ? 'bg-green-100 text-green-700' : selectedEmployee.status === 'probation' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                      {selectedEmployee.status}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-[#757575]">Employee Number</p>
                    <p className="font-bold">{selectedEmployee.employeeNumber}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-[#757575]">Department</p>
                    <p className="font-bold">{selectedEmployee.department}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-[#757575]">Monthly Salary</p>
                    <p className="font-bold">{formatCurrency(selectedEmployee.monthlySalary || selectedEmployee.hourlyRate * selectedEmployee.monthlyHours * 4.33)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-[#757575]">Employment Type</p>
                    <p className="font-bold capitalize">{selectedEmployee.employmentType.replace('_', ' ')}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div className="text-center p-2 bg-green-50 rounded">
                  <p className="text-lg font-bold">{selectedEmployee.leaveBalance.annual}</p>
                  <p className="text-[10px] text-green-600">Annual Leave</p>
                </div>
                <div className="text-center p-2 bg-red-50 rounded">
                  <p className="text-lg font-bold">{selectedEmployee.leaveBalance.sick}</p>
                  <p className="text-[10px] text-red-600">Sick Leave</p>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded">
                  <p className="text-lg font-bold">{selectedEmployee.attendanceRate || 0}%</p>
                  <p className="text-[10px] text-blue-600">Attendance</p>
                </div>
                <div className="text-center p-2 bg-purple-50 rounded">
                  <p className="text-lg font-bold">{formatCurrency(selectedEmployee.monthlyCommission || 0)}</p>
                  <p className="text-[10px] text-purple-600">Commission</p>
                </div>
              </div>

              <div className="text-xs text-[#757575]">
                <p><strong>Email:</strong> {selectedEmployee.email}</p>
                <p><strong>Phone:</strong> {selectedEmployee.phone}</p>
                <p><strong>Start Date:</strong> {selectedEmployee.startDate}</p>
                <p><strong>Manager:</strong> {selectedEmployee.manager}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Shift Dialog */}
      <Dialog open={shiftDialogOpen} onOpenChange={setShiftDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Shift</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-[#757575]">Shift creation form would go here...</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShiftDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setShiftDialogOpen(false)}>Save Shift</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
