'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
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
  Baby,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Download,
  Printer,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Heart,
  Activity,
  DollarSign,
  CreditCard,
  Receipt,
  FileText,
  ClipboardList,
  Camera,
  Image,
  MessageSquare,
  Bell,
  Settings,
  UserCheck,
  UserX,
  LogIn,
  LogOut,
  Moon,
  Sun,
  Coffee,
  Utensils,
  Bed,
  Bandage,
  ShieldCheck,
  Award,
  BookOpen,
  Target,
  Star,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Home,
  Building2,
  GraduationCap,
  Trophy,
  Smile,
  Frown,
  Meh,
  ThumbsUp,
  Send,
  Paperclip,
  MoreVertical,
  ChevronRight,
  ChevronLeft,
  Filter,
  Folder,
  Zap,
  Timer,
  Wallet,
  PiggyBank,
  Percent,
  Gift,
  Sparkles,
  CircleDot,
  LucideIcon,
} from 'lucide-react'

// =====================================================
// TYPE DEFINITIONS
// =====================================================

type AttendanceStatus = 'present' | 'absent' | 'late' | 'picked_up_early' | 'not_checked_in'
type CheckStatus = 'checked_in' | 'checked_out' | 'not_checked_in'
type AgeGroup = 'infant' | 'toddler' | 'preschool' | 'pre_k' | 'kindergarten' | 'school_age'
type MealType = 'breakfast' | 'morning_snack' | 'lunch' | 'afternoon_snack' | 'dinner'
type ActivityType = 'educational' | 'physical' | 'creative' | 'social' | 'rest'
type ComplianceStatus = 'compliant' | 'expiring_soon' | 'expired' | 'missing'
type FeeStatus = 'paid' | 'pending' | 'overdue' | 'waived'
type IncidentSeverity = 'minor' | 'moderate' | 'serious' | 'critical'
type MilestoneCategory = 'motor' | 'cognitive' | 'language' | 'social' | 'self_care'

interface EmergencyContact {
  id: string
  name: string
  relationship: string
  phone: string
  alternatePhone?: string
  email?: string
  isPrimary: boolean
  authorizedPickup: boolean
}

interface Allergy {
  id: string
  allergen: string
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening'
  symptoms: string[]
  actionPlan?: string
}

interface ImmunizationRecord {
  id: string
  vaccineName: string
  dateAdministered: string
  nextDueDate?: string
  administeredBy: string
  batchNumber?: string
  status: ComplianceStatus
}

interface Child {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: 'male' | 'female' | 'other'
  profileImage?: string
  enrollmentDate: string
  status: 'active' | 'waitlist' | 'withdrawn' | 'graduated'
  ageGroup: AgeGroup
  classId: string
  medicalRecordNumber: string
  allergies: Allergy[]
  specialNeeds?: string
  dietaryRestrictions?: string[]
  emergencyContacts: EmergencyContact[]
  immunizations: ImmunizationRecord[]
  primaryGuardian: {
    name: string
    relationship: string
    phone: string
    email: string
    address: string
  }
  secondaryGuardian?: {
    name: string
    relationship: string
    phone: string
    email: string
  }
  enrollmentType: 'full_time' | 'part_time' | 'drop_in'
  schedule: string[]
  billingInfo: {
    feePlan: string
    monthlyFee: number
    siblingDiscount: number
    paymentMethod: string
  }
  checkInStatus: CheckStatus
  checkInTime?: string
  checkOutTime?: string
}

interface ClassRoom {
  id: string
  name: string
  ageGroup: AgeGroup
  minAge: number
  maxAge: number
  capacity: number
  currentEnrollment: number
  staffRatio: string
  assignedStaff: StaffMember[]
  schedule: {
    openTime: string
    closeTime: string
  }
  roomNumber: string
  status: 'active' | 'full' | 'closed'
}

interface StaffMember {
  id: string
  name: string
  role: string
  phone: string
  email: string
  qualifications: string[]
  certifications: { name: string; expiryDate: string }[]
  status: 'active' | 'on_leave' | 'inactive'
  avatar?: string
}

interface AttendanceRecord {
  id: string
  childId: string
  child: Child
  date: string
  status: AttendanceStatus
  checkInTime?: string
  checkOutTime?: string
  checkedInBy?: string
  checkedOutBy?: string
  notes?: string
  latePickup?: boolean
  latePickupFee?: number
}

interface DailyReport {
  id: string
  childId: string
  child: Child
  date: string
  meals: {
    type: MealType
    time: string
    amount: 'none' | 'some' | 'most' | 'all'
    notes?: string
  }[]
  naps: {
    startTime: string
    endTime: string
    duration: number
    quality: 'good' | 'fair' | 'poor'
  }[]
  activities: {
    type: ActivityType
    description: string
    participation: 'enthusiastic' | 'engaged' | 'reluctant' | 'did_not_participate'
  }[]
  incidents?: {
    type: string
    description: string
    severity: IncidentSeverity
    actionTaken: string
    reportedTo: string
  }[]
  diaperChanges?: {
    time: string
    type: 'wet' | 'soiled' | 'both'
  }[]
  mood: 'happy' | 'content' | 'fussy' | 'upset'
  notes: string
  photos: string[]
  createdBy: string
  createdAt: string
}

interface FeeRecord {
  id: string
  childId: string
  child: Child
  type: 'monthly_tuition' | 'registration' | 'late_pickup' | 'late_fee' | 'activity' | 'other'
  amount: number
  dueDate: string
  paidDate?: string
  status: FeeStatus
  siblingDiscount: number
  totalAmount: number
  paymentMethod?: string
  invoiceNumber: string
  notes?: string
}

interface Milestone {
  id: string
  childId: string
  category: MilestoneCategory
  name: string
  description: string
  ageRange: { min: number; max: number }
  achievedDate?: string
  status: 'not_started' | 'in_progress' | 'achieved' | 'concerning'
  notes?: string
}

interface ComplianceItem {
  id: string
  type: 'immunization' | 'safety_inspection' | 'staff_certification' | 'fire_drill' | 'health_inspection'
  name: string
  dueDate: string
  completedDate?: string
  status: ComplianceStatus
  assignedTo?: string
  notes?: string
  documentUrl?: string
}

interface ParentNotification {
  id: string
  childId: string
  childName: string
  type: 'daily_report' | 'incident' | 'reminder' | 'photo' | 'announcement' | 'billing'
  title: string
  message: string
  sentAt: string
  read: boolean
  photoUrl?: string
}

// =====================================================
// MOCK DATA GENERATORS
// =====================================================

const ageGroupLabels: Record<AgeGroup, string> = {
  infant: 'Infants (0-12 months)',
  toddler: 'Toddlers (1-2 years)',
  preschool: 'Preschool (3-4 years)',
  pre_k: 'Pre-K (4-5 years)',
  kindergarten: 'Kindergarten (5-6 years)',
  school_age: 'School Age (6+ years)',
}

const generateMockChildren = (): Child[] => [
  {
    id: 'CHD-001',
    firstName: 'Emma',
    lastName: 'Johnson',
    dateOfBirth: '2022-06-15',
    gender: 'female',
    enrollmentDate: '2024-01-10',
    status: 'active',
    ageGroup: 'toddler',
    classId: 'CLS-001',
    medicalRecordNumber: 'MRN-2024-001',
    allergies: [
      { id: 'ALG-001', allergen: 'Peanuts', severity: 'severe', symptoms: ['Hives', 'Difficulty breathing'], actionPlan: 'Administer EpiPen, call 911' }
    ],
    dietaryRestrictions: ['No nuts', 'No shellfish'],
    emergencyContacts: [
      { id: 'EC-001', name: 'Sarah Johnson', relationship: 'Mother', phone: '555-0101', isPrimary: true, authorizedPickup: true },
      { id: 'EC-002', name: 'Michael Johnson', relationship: 'Father', phone: '555-0102', isPrimary: false, authorizedPickup: true },
    ],
    immunizations: [
      { id: 'IMM-001', vaccineName: 'DTaP', dateAdministered: '2023-06-15', administeredBy: 'Dr. Smith', status: 'compliant' },
      { id: 'IMM-002', vaccineName: 'MMR', dateAdministered: '2023-09-20', nextDueDate: '2026-09-20', administeredBy: 'Dr. Smith', status: 'compliant' },
    ],
    primaryGuardian: { name: 'Sarah Johnson', relationship: 'Mother', phone: '555-0101', email: 'sarah.j@email.com', address: '123 Oak Street' },
    secondaryGuardian: { name: 'Michael Johnson', relationship: 'Father', phone: '555-0102', email: 'michael.j@email.com' },
    enrollmentType: 'full_time',
    schedule: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    billingInfo: { feePlan: 'Full Time', monthlyFee: 1200, siblingDiscount: 0, paymentMethod: 'Credit Card' },
    checkInStatus: 'checked_in',
    checkInTime: '08:15',
  },
  {
    id: 'CHD-002',
    firstName: 'Liam',
    lastName: 'Williams',
    dateOfBirth: '2021-03-20',
    gender: 'male',
    enrollmentDate: '2023-09-01',
    status: 'active',
    ageGroup: 'preschool',
    classId: 'CLS-002',
    medicalRecordNumber: 'MRN-2024-002',
    allergies: [],
    emergencyContacts: [
      { id: 'EC-003', name: 'Jennifer Williams', relationship: 'Mother', phone: '555-0201', isPrimary: true, authorizedPickup: true },
    ],
    immunizations: [
      { id: 'IMM-003', vaccineName: 'DTaP', dateAdministered: '2022-03-20', administeredBy: 'Dr. Lee', status: 'compliant' },
    ],
    primaryGuardian: { name: 'Jennifer Williams', relationship: 'Mother', phone: '555-0201', email: 'jen.w@email.com', address: '456 Maple Ave' },
    enrollmentType: 'full_time',
    schedule: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    billingInfo: { feePlan: 'Full Time', monthlyFee: 1100, siblingDiscount: 0, paymentMethod: 'Bank Transfer' },
    checkInStatus: 'checked_in',
    checkInTime: '07:45',
  },
  {
    id: 'CHD-003',
    firstName: 'Olivia',
    lastName: 'Brown',
    dateOfBirth: '2023-01-10',
    gender: 'female',
    enrollmentDate: '2024-02-15',
    status: 'active',
    ageGroup: 'infant',
    classId: 'CLS-003',
    medicalRecordNumber: 'MRN-2024-003',
    allergies: [
      { id: 'ALG-002', allergen: 'Lactose', severity: 'moderate', symptoms: ['Stomach upset', 'Rash'] }
    ],
    dietaryRestrictions: ['Lactose-free formula'],
    emergencyContacts: [
      { id: 'EC-004', name: 'David Brown', relationship: 'Father', phone: '555-0301', isPrimary: true, authorizedPickup: true },
      { id: 'EC-005', name: 'Lisa Brown', relationship: 'Mother', phone: '555-0302', isPrimary: false, authorizedPickup: true },
    ],
    immunizations: [
      { id: 'IMM-004', vaccineName: 'Hepatitis B', dateAdministered: '2023-01-10', administeredBy: 'Dr. Chen', status: 'compliant' },
    ],
    primaryGuardian: { name: 'David Brown', relationship: 'Father', phone: '555-0301', email: 'david.b@email.com', address: '789 Pine Road' },
    enrollmentType: 'full_time',
    schedule: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    billingInfo: { feePlan: 'Infant Full Time', monthlyFee: 1400, siblingDiscount: 0, paymentMethod: 'Credit Card' },
    checkInStatus: 'not_checked_in',
  },
  {
    id: 'CHD-004',
    firstName: 'Noah',
    lastName: 'Davis',
    dateOfBirth: '2019-08-25',
    gender: 'male',
    enrollmentDate: '2022-09-01',
    status: 'active',
    ageGroup: 'pre_k',
    classId: 'CLS-004',
    medicalRecordNumber: 'MRN-2024-004',
    allergies: [],
    specialNeeds: 'Speech therapy sessions on Wednesdays',
    emergencyContacts: [
      { id: 'EC-006', name: 'Amanda Davis', relationship: 'Mother', phone: '555-0401', isPrimary: true, authorizedPickup: true },
    ],
    immunizations: [
      { id: 'IMM-005', vaccineName: 'Varicella', dateAdministered: '2021-08-25', administeredBy: 'Dr. Wilson', status: 'compliant' },
    ],
    primaryGuardian: { name: 'Amanda Davis', relationship: 'Mother', phone: '555-0401', email: 'amanda.d@email.com', address: '321 Elm Street' },
    enrollmentType: 'full_time',
    schedule: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    billingInfo: { feePlan: 'Full Time', monthlyFee: 1050, siblingDiscount: 0, paymentMethod: 'Check' },
    checkInStatus: 'checked_in',
    checkInTime: '08:30',
  },
  {
    id: 'CHD-005',
    firstName: 'Sophia',
    lastName: 'Martinez',
    dateOfBirth: '2020-11-12',
    gender: 'female',
    enrollmentDate: '2023-06-01',
    status: 'active',
    ageGroup: 'preschool',
    classId: 'CLS-002',
    medicalRecordNumber: 'MRN-2024-005',
    allergies: [],
    emergencyContacts: [
      { id: 'EC-007', name: 'Maria Martinez', relationship: 'Mother', phone: '555-0501', isPrimary: true, authorizedPickup: true },
      { id: 'EC-008', name: 'Carlos Martinez', relationship: 'Father', phone: '555-0502', isPrimary: false, authorizedPickup: true },
    ],
    immunizations: [
      { id: 'IMM-006', vaccineName: 'DTaP', dateAdministered: '2022-11-12', nextDueDate: '2024-03-01', administeredBy: 'Dr. Garcia', status: 'expiring_soon' },
    ],
    primaryGuardian: { name: 'Maria Martinez', relationship: 'Mother', phone: '555-0501', email: 'maria.m@email.com', address: '555 Cedar Lane' },
    enrollmentType: 'part_time',
    schedule: ['Monday', 'Wednesday', 'Friday'],
    billingInfo: { feePlan: 'Part Time', monthlyFee: 700, siblingDiscount: 0, paymentMethod: 'Credit Card' },
    checkInStatus: 'not_checked_in',
  },
  {
    id: 'CHD-006',
    firstName: 'Lucas',
    lastName: 'Anderson',
    dateOfBirth: '2018-04-05',
    gender: 'male',
    enrollmentDate: '2021-09-01',
    status: 'active',
    ageGroup: 'kindergarten',
    classId: 'CLS-005',
    medicalRecordNumber: 'MRN-2024-006',
    allergies: [
      { id: 'ALG-003', allergen: 'Bee Stings', severity: 'life_threatening', symptoms: ['Anaphylaxis'], actionPlan: 'Administer EpiPen immediately, call 911' }
    ],
    emergencyContacts: [
      { id: 'EC-009', name: 'Robert Anderson', relationship: 'Father', phone: '555-0601', isPrimary: true, authorizedPickup: true },
    ],
    immunizations: [
      { id: 'IMM-007', vaccineName: 'All Required', dateAdministered: '2023-04-05', administeredBy: 'Dr. Brown', status: 'compliant' },
    ],
    primaryGuardian: { name: 'Robert Anderson', relationship: 'Father', phone: '555-0601', email: 'robert.a@email.com', address: '888 Birch Drive' },
    enrollmentType: 'full_time',
    schedule: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    billingInfo: { feePlan: 'Kindergarten', monthlyFee: 950, siblingDiscount: 10, paymentMethod: 'Bank Transfer' },
    checkInStatus: 'checked_in',
    checkInTime: '08:00',
  },
]

const generateMockClasses = (): ClassRoom[] => [
  {
    id: 'CLS-001',
    name: 'Little Explorers',
    ageGroup: 'toddler',
    minAge: 1,
    maxAge: 2,
    capacity: 12,
    currentEnrollment: 8,
    staffRatio: '1:4',
    assignedStaff: [
      { id: 'STF-001', name: 'Ms. Rachel Green', role: 'Lead Teacher', phone: '555-1001', email: 'rachel@greenwood.com', qualifications: ['Early Childhood Education', 'CPR Certified'], certifications: [{ name: 'CPR', expiryDate: '2026-06-15' }], status: 'active' },
      { id: 'STF-002', name: 'Ms. Monica Torres', role: 'Assistant Teacher', phone: '555-1002', email: 'monica@greenwood.com', qualifications: ['Child Development'], certifications: [{ name: 'CPR', expiryDate: '2026-03-20' }], status: 'active' },
    ],
    schedule: { openTime: '07:00', closeTime: '18:00' },
    roomNumber: 'Room 101',
    status: 'active',
  },
  {
    id: 'CLS-002',
    name: 'Busy Bees',
    ageGroup: 'preschool',
    minAge: 3,
    maxAge: 4,
    capacity: 18,
    currentEnrollment: 16,
    staffRatio: '1:8',
    assignedStaff: [
      { id: 'STF-003', name: 'Ms. Sarah Johnson', role: 'Lead Teacher', phone: '555-1003', email: 'sarah.j@greenwood.com', qualifications: ['Early Childhood Education', 'Special Needs'], certifications: [{ name: 'CPR', expiryDate: '2026-08-10' }], status: 'active' },
      { id: 'STF-004', name: 'Mr. David Lee', role: 'Assistant Teacher', phone: '555-1004', email: 'david.l@greenwood.com', qualifications: ['Child Psychology'], certifications: [{ name: 'CPR', expiryDate: '2026-05-15' }], status: 'active' },
    ],
    schedule: { openTime: '07:00', closeTime: '18:00' },
    roomNumber: 'Room 201',
    status: 'active',
  },
  {
    id: 'CLS-003',
    name: 'Nurturing Nook',
    ageGroup: 'infant',
    minAge: 0,
    maxAge: 1,
    capacity: 8,
    currentEnrollment: 6,
    staffRatio: '1:3',
    assignedStaff: [
      { id: 'STF-005', name: 'Ms. Emily Chen', role: 'Lead Teacher', phone: '555-1005', email: 'emily.c@greenwood.com', qualifications: ['Infant Care Specialist', 'Early Childhood Education'], certifications: [{ name: 'CPR', expiryDate: '2026-04-01' }], status: 'active' },
      { id: 'STF-006', name: 'Ms. Lisa Park', role: 'Assistant Teacher', phone: '555-1006', email: 'lisa.p@greenwood.com', qualifications: ['Infant Care'], certifications: [{ name: 'CPR', expiryDate: '2026-07-20' }], status: 'active' },
    ],
    schedule: { openTime: '07:00', closeTime: '18:00' },
    roomNumber: 'Room 102',
    status: 'active',
  },
  {
    id: 'CLS-004',
    name: 'Pre-K Scholars',
    ageGroup: 'pre_k',
    minAge: 4,
    maxAge: 5,
    capacity: 20,
    currentEnrollment: 18,
    staffRatio: '1:10',
    assignedStaff: [
      { id: 'STF-007', name: 'Ms. Amanda White', role: 'Lead Teacher', phone: '555-1007', email: 'amanda.w@greenwood.com', qualifications: ['Early Childhood Education', 'Reading Specialist'], certifications: [{ name: 'CPR', expiryDate: '2026-09-15' }], status: 'active' },
    ],
    schedule: { openTime: '07:00', closeTime: '18:00' },
    roomNumber: 'Room 202',
    status: 'active',
  },
  {
    id: 'CLS-005',
    name: 'Kindergarten Prep',
    ageGroup: 'kindergarten',
    minAge: 5,
    maxAge: 6,
    capacity: 22,
    currentEnrollment: 20,
    staffRatio: '1:11',
    assignedStaff: [
      { id: 'STF-008', name: 'Mr. James Wilson', role: 'Lead Teacher', phone: '555-1008', email: 'james.w@greenwood.com', qualifications: ['Elementary Education', 'Early Childhood'], certifications: [{ name: 'CPR', expiryDate: '2026-10-01' }], status: 'active' },
    ],
    schedule: { openTime: '07:00', closeTime: '18:00' },
    roomNumber: 'Room 203',
    status: 'active',
  },
]

const generateMockAttendance = (children: Child[]): AttendanceRecord[] => {
  const today = new Date().toISOString().split('T')[0]
  return children.map(child => ({
    id: `ATT-${child.id}`,
    childId: child.id,
    child,
    date: today,
    status: child.checkInStatus === 'checked_in' ? 'present' : 'not_checked_in',
    checkInTime: child.checkInTime,
    checkedInBy: 'Parent',
    notes: child.checkInStatus === 'checked_in' ? '' : undefined,
  }))
}

const generateMockFees = (children: Child[]): FeeRecord[] => {
  const fees: FeeRecord[] = []
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  children.forEach(child => {
    // Monthly tuition
    fees.push({
      id: `FEE-${child.id}-TUITION`,
      childId: child.id,
      child,
      type: 'monthly_tuition',
      amount: child.billingInfo.monthlyFee,
      dueDate: new Date(currentYear, currentMonth, 5).toISOString().split('T')[0],
      paidDate: currentMonth % 2 === 0 ? new Date(currentYear, currentMonth, 3).toISOString().split('T')[0] : undefined,
      status: currentMonth % 2 === 0 ? 'paid' : 'pending',
      siblingDiscount: child.billingInfo.siblingDiscount,
      totalAmount: child.billingInfo.monthlyFee * (1 - child.billingInfo.siblingDiscount / 100),
      invoiceNumber: `INV-2026-${child.id.slice(-3)}`,
      paymentMethod: child.billingInfo.paymentMethod,
    })
  })
  
  return fees
}

const generateMockDailyReports = (children: Child[]): DailyReport[] => {
  const today = new Date().toISOString().split('T')[0]
  return children.filter(c => c.checkInStatus === 'checked_in').slice(0, 3).map(child => ({
    id: `DR-${child.id}`,
    childId: child.id,
    child,
    date: today,
    meals: [
      { type: 'breakfast', time: '08:30', amount: 'most', notes: 'Enjoyed pancakes' },
      { type: 'morning_snack', time: '10:00', amount: 'all', notes: 'Apple slices' },
      { type: 'lunch', time: '12:00', amount: 'some', notes: 'Chicken and rice' },
    ],
    naps: [
      { startTime: '13:00', endTime: '14:30', duration: 90, quality: 'good' },
    ],
    activities: [
      { type: 'educational', description: 'Letter recognition activities', participation: 'enthusiastic' },
      { type: 'physical', description: 'Outdoor play time', participation: 'engaged' },
      { type: 'creative', description: 'Finger painting', participation: 'enthusiastic' },
    ],
    mood: 'happy',
    notes: 'Great day! Had fun with friends.',
    photos: [],
    createdBy: 'Ms. Rachel Green',
    createdAt: today,
  }))
}

const generateMockCompliance = (): ComplianceItem[] => [
  { id: 'CMP-001', type: 'fire_drill', name: 'Monthly Fire Drill', dueDate: '2026-02-28', status: 'compliant', completedDate: '2026-02-15' },
  { id: 'CMP-002', type: 'health_inspection', name: 'Quarterly Health Inspection', dueDate: '2026-03-15', status: 'expiring_soon' },
  { id: 'CMP-003', type: 'safety_inspection', name: 'Playground Safety Check', dueDate: '2026-04-01', status: 'compliant', completedDate: '2026-02-01' },
  { id: 'CMP-004', type: 'staff_certification', name: 'Staff CPR Certification Renewal', dueDate: '2026-03-20', status: 'expiring_soon', assignedTo: 'Ms. Monica Torres' },
  { id: 'CMP-005', type: 'immunization', name: 'Child Immunization Records Review', dueDate: '2026-02-28', status: 'compliant', completedDate: '2026-02-10' },
]

const generateMockNotifications = (children: Child[]): ParentNotification[] => [
  {
    id: 'NOT-001',
    childId: 'CHD-001',
    childName: 'Emma Johnson',
    type: 'daily_report',
    title: 'Daily Report Ready',
    message: "Emma had a wonderful day! She enjoyed outdoor play and made new friends.",
    sentAt: new Date().toISOString(),
    read: false,
  },
  {
    id: 'NOT-002',
    childId: 'CHD-002',
    childName: 'Liam Williams',
    type: 'photo',
    title: 'New Photo Shared',
    message: "Liam enjoying art class today!",
    sentAt: new Date(Date.now() - 3600000).toISOString(),
    read: true,
  },
  {
    id: 'NOT-003',
    childId: 'CHD-003',
    childName: 'Olivia Brown',
    type: 'reminder',
    title: 'Immunization Due',
    message: "Olivia's next immunization is due next month. Please schedule with your pediatrician.",
    sentAt: new Date(Date.now() - 86400000).toISOString(),
    read: false,
  },
]

const generateMockMilestones = (children: Child[]): Milestone[] => {
  const milestones: Milestone[] = []
  children.slice(0, 4).forEach(child => {
    milestones.push(
      { id: `ML-${child.id}-1`, childId: child.id, category: 'motor', name: 'Running with confidence', description: 'Can run without falling frequently', ageRange: { min: 24, max: 36 }, status: child.ageGroup === 'toddler' ? 'in_progress' : 'achieved', achievedDate: child.ageGroup === 'preschool' ? '2025-06-15' : undefined },
      { id: `ML-${child.id}-2`, childId: child.id, category: 'language', name: 'Two-word phrases', description: 'Uses two-word phrases consistently', ageRange: { min: 18, max: 24 }, status: 'achieved', achievedDate: '2025-03-10' },
      { id: `ML-${child.id}-3`, childId: child.id, category: 'social', name: 'Parallel play', description: 'Engages in parallel play with other children', ageRange: { min: 18, max: 30 }, status: 'achieved', achievedDate: '2025-01-20' },
      { id: `ML-${child.id}-4`, childId: child.id, category: 'cognitive', name: 'Color recognition', description: 'Can identify basic colors', ageRange: { min: 30, max: 42 }, status: child.ageGroup === 'preschool' ? 'in_progress' : child.ageGroup === 'toddler' ? 'not_started' : 'achieved' },
    )
  })
  return milestones
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export function ChildcareView() {
  // State
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [ageGroupFilter, setAgeGroupFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  // Data states
  const [children, setChildren] = useState<Child[]>([])
  const [classes, setClasses] = useState<ClassRoom[]>([])
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [fees, setFees] = useState<FeeRecord[]>([])
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([])
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([])
  const [notifications, setNotifications] = useState<ParentNotification[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  
  // Dialog states
  const [childDialogOpen, setChildDialogOpen] = useState(false)
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false)
  const [dailyReportDialogOpen, setDailyReportDialogOpen] = useState(false)
  const [feeDialogOpen, setFeeDialogOpen] = useState(false)
  const [classDialogOpen, setClassDialogOpen] = useState(false)
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)
  const [selectedClass, setSelectedClass] = useState<ClassRoom | null>(null)
  
  // Load mock data
  useEffect(() => {
    const timer = setTimeout(() => {
      const mockChildren = generateMockChildren()
      const mockClasses = generateMockClasses()
      
      setChildren(mockChildren)
      setClasses(mockClasses)
      setAttendance(generateMockAttendance(mockChildren))
      setFees(generateMockFees(mockChildren))
      setDailyReports(generateMockDailyReports(mockChildren))
      setComplianceItems(generateMockCompliance())
      setNotifications(generateMockNotifications(mockChildren))
      setMilestones(generateMockMilestones(mockChildren))
      setLoading(false)
    }, 500)
    
    return () => clearTimeout(timer)
  }, [])
  
  // Computed stats
  const stats = useMemo(() => {
    const presentToday = children.filter(c => c.checkInStatus === 'checked_in').length
    const totalEnrolled = children.filter(c => c.status === 'active').length
    const pendingFees = fees.filter(f => f.status === 'pending' || f.status === 'overdue').reduce((sum, f) => sum + f.totalAmount, 0)
    const overdueFees = fees.filter(f => f.status === 'overdue').reduce((sum, f) => sum + f.totalAmount, 0)
    const expiringCompliance = complianceItems.filter(c => c.status === 'expiring_soon' || c.status === 'expired').length
    const totalCapacity = classes.reduce((sum, c) => sum + c.capacity, 0)
    const totalEnrollment = classes.reduce((sum, c) => sum + c.currentEnrollment, 0)
    const availableSpots = totalCapacity - totalEnrollment
    const unreadNotifications = notifications.filter(n => !n.read).length
    const childrenWithAllergies = children.filter(c => c.allergies.length > 0).length
    const missingImmunizations = children.filter(c => c.immunizations.some(i => i.status === 'expiring_soon' || i.status === 'expired' || i.status === 'missing')).length
    
    return {
      totalEnrolled,
      presentToday,
      attendanceRate: totalEnrolled > 0 ? Math.round((presentToday / totalEnrolled) * 100) : 0,
      pendingFees,
      overdueFees,
      monthlyRevenue: fees.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.totalAmount, 0),
      expiringCompliance,
      totalCapacity,
      totalEnrollment,
      availableSpots,
      utilizationRate: totalCapacity > 0 ? Math.round((totalEnrollment / totalCapacity) * 100) : 0,
      unreadNotifications,
      childrenWithAllergies,
      missingImmunizations,
    }
  }, [children, fees, complianceItems, classes, notifications])
  
  // Helper functions
  const formatCurrency = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  
  const getAgeGroupBadge = (ageGroup: AgeGroup) => {
    const colors: Record<AgeGroup, string> = {
      infant: 'bg-pink-100 text-pink-700',
      toddler: 'bg-orange-100 text-orange-700',
      preschool: 'bg-green-100 text-green-700',
      pre_k: 'bg-blue-100 text-blue-700',
      kindergarten: 'bg-purple-100 text-purple-700',
      school_age: 'bg-teal-100 text-teal-700',
    }
    return <Badge className={`${colors[ageGroup]} text-xs`}>{ageGroupLabels[ageGroup].split(' ')[0]}</Badge>
  }
  
  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      waitlist: 'bg-yellow-100 text-yellow-700',
      withdrawn: 'bg-gray-100 text-gray-700',
      graduated: 'bg-blue-100 text-blue-700',
      present: 'bg-green-100 text-green-700',
      absent: 'bg-red-100 text-red-700',
      late: 'bg-orange-100 text-orange-700',
      not_checked_in: 'bg-gray-100 text-gray-500',
      paid: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      overdue: 'bg-red-100 text-red-700',
      compliant: 'bg-green-100 text-green-700',
      expiring_soon: 'bg-yellow-100 text-yellow-700',
      expired: 'bg-red-100 text-red-700',
      missing: 'bg-red-100 text-red-700',
    }
    return <Badge className={`${colors[status] || 'bg-gray-100 text-gray-700'} text-xs`}>{status.replace('_', ' ')}</Badge>
  }
  
  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      mild: 'bg-green-100 text-green-700',
      moderate: 'bg-yellow-100 text-yellow-700',
      severe: 'bg-orange-100 text-orange-700',
      life_threatening: 'bg-red-100 text-red-700',
    }
    return <Badge className={colors[severity]}>{severity.replace('_', ' ')}</Badge>
  }
  
  const getChildInitials = (child: Child) => `${child.firstName[0]}${child.lastName[0]}`
  
  const calculateAge = (dob: string) => {
    const birth = new Date(dob)
    const today = new Date()
    let years = today.getFullYear() - birth.getFullYear()
    let months = today.getMonth() - birth.getMonth()
    if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
      years--
      months += 12
    }
    return { years, months }
  }
  
  const formatAge = (dob: string) => {
    const age = calculateAge(dob)
    if (age.years === 0) return `${age.months}mo`
    return `${age.years}y ${age.months}mo`
  }
  
  // Filter children
  const filteredChildren = useMemo(() => children.filter(child => {
    const matchesSearch = `${child.firstName} ${child.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      child.medicalRecordNumber.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesAgeGroup = ageGroupFilter === 'all' || child.ageGroup === ageGroupFilter
    const matchesStatus = statusFilter === 'all' || child.status === statusFilter
    return matchesSearch && matchesAgeGroup && matchesStatus
  }), [children, searchQuery, ageGroupFilter, statusFilter])
  
  // Handlers
  const handleCheckIn = (child: Child) => {
    setChildren(prev => prev.map(c => 
      c.id === child.id 
        ? { 
            ...c, 
            checkInStatus: 'checked_in' as CheckStatus, 
            checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
          }
        : c
    ))
    setAttendance(prev => prev.map(a => 
      a.childId === child.id 
        ? { ...a, status: 'present' as AttendanceStatus, checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        : a
    ))
    setCheckInDialogOpen(false)
  }
  
  const handleCheckOut = (child: Child) => {
    setChildren(prev => prev.map(c => 
      c.id === child.id 
        ? { 
            ...c, 
            checkInStatus: 'checked_out' as CheckStatus, 
            checkOutTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
          }
        : c
    ))
    setAttendance(prev => prev.map(a => 
      a.childId === child.id 
        ? { ...a, checkOutTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        : a
    ))
  }
  
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#FAFAFA] min-h-0">
        <RefreshCw className="h-8 w-8 animate-spin text-[#00897B]" />
      </div>
    )
  }
  
  // =====================================================
  // RENDER FUNCTIONS
  // =====================================================
  
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="border-l-4 border-l-[#00897B]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-[#00897B]" />
              <span className="text-xs text-[#757575]">Enrolled</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalEnrolled}</p>
            <p className="text-xs text-[#757575]">children</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-xs text-[#757575]">Present Today</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.presentToday}</p>
            <p className="text-xs text-green-600">{stats.attendanceRate}% attendance</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-[#757575]">Pending Fees</span>
            </div>
            <p className="text-lg font-bold text-amber-600">{formatCurrency(stats.pendingFees)}</p>
            <p className="text-xs text-red-600">{formatCurrency(stats.overdueFees)} overdue</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Home className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-[#757575]">Capacity</span>
            </div>
            <p className="text-2xl font-bold">{stats.utilizationRate}%</p>
            <p className="text-xs text-[#757575]">{stats.availableSpots} spots available</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span className="text-xs text-[#757575]">Compliance Alerts</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">{stats.expiringCompliance}</p>
            <p className="text-xs text-[#757575]">need attention</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Bell className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-[#757575]">Notifications</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.unreadNotifications}</p>
            <p className="text-xs text-[#757575]">unread</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Actions */}
      <div className="flex gap-2 flex-wrap">
        <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setChildDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />Enroll Child
        </Button>
        <Button variant="outline" onClick={() => setCheckInDialogOpen(true)}>
          <LogIn className="h-4 w-4 mr-2" />Check In/Out
        </Button>
        <Button variant="outline" onClick={() => setDailyReportDialogOpen(true)}>
          <ClipboardList className="h-4 w-4 mr-2" />Daily Report
        </Button>
        <Button variant="outline" onClick={() => setActiveTab('billing')}>
          <Receipt className="h-4 w-4 mr-2" />Billing
        </Button>
        <Button variant="outline" onClick={() => setActiveTab('compliance')}>
          <ShieldCheck className="h-4 w-4 mr-2" />Compliance
        </Button>
      </div>
      
      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Attendance */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#00897B]" />
              Today's Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 mb-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[#757575]">Present</span>
                  <span className="font-bold">{stats.presentToday}/{stats.totalEnrolled}</span>
                </div>
                <Progress value={stats.attendanceRate} className="h-3" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Checked In</span>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {children.filter(c => c.checkInStatus === 'checked_in').slice(0, 5).map(child => (
                    <div key={child.id} className="flex items-center justify-between text-xs">
                      <span>{child.firstName} {child.lastName[0]}.</span>
                      <span className="text-[#757575]">{child.checkInTime}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Not Checked In</span>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {children.filter(c => c.checkInStatus === 'not_checked_in').slice(0, 5).map(child => (
                    <div key={child.id} className="flex items-center justify-between text-xs">
                      <span>{child.firstName} {child.lastName[0]}.</span>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 text-xs text-[#00897B]"
                        onClick={() => { setSelectedChild(child); setCheckInDialogOpen(true) }}
                      >
                        Check In
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Alerts & Reminders */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Alerts & Reminders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.childrenWithAllergies > 0 && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium text-red-700">Allergy Alert</span>
                  </div>
                  <p className="text-xs text-red-600">{stats.childrenWithAllergies} children with allergies on site today</p>
                </div>
              )}
              
              {stats.missingImmunizations > 0 && (
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-700">Immunization Due</span>
                  </div>
                  <p className="text-xs text-yellow-600">{stats.missingImmunizations} children need immunization updates</p>
                </div>
              )}
              
              {complianceItems.filter(c => c.status === 'expiring_soon').map(item => (
                <div key={item.id} className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium text-amber-700">{item.name}</span>
                  </div>
                  <p className="text-xs text-amber-600">Due: {item.dueDate}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Class Overview & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#00897B]" />
              Class Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {classes.map(cls => (
                <div key={cls.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer" onClick={() => { setSelectedClass(cls); setActiveTab('classes') }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#E0F2F1] flex items-center justify-center">
                      <GraduationCap className="h-5 w-5 text-[#00897B]" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{cls.name}</p>
                      <p className="text-xs text-[#757575]">{ageGroupLabels[cls.ageGroup].split('(')[0].trim()} • {cls.roomNumber}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{cls.currentEnrollment}/{cls.capacity}</p>
                    <p className="text-xs text-[#757575]">Ratio: {cls.staffRatio}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#00897B]" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dailyReports.slice(0, 4).map(report => (
                <div key={report.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-[#E0F2F1] text-[#00897B] text-xs">
                      {getChildInitials(report.child)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{report.child.firstName}'s Daily Report</p>
                    <p className="text-xs text-[#757575]">Mood: {report.mood} • Created by {report.createdBy}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {report.mood === 'happy' ? <Smile className="h-3 w-3 mr-1 text-green-500" /> : 
                     report.mood === 'fussy' ? <Frown className="h-3 w-3 mr-1 text-orange-500" /> : 
                     <Meh className="h-3 w-3 mr-1 text-blue-500" />}
                    {report.mood}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
  
  const renderChildrenTab = () => (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
          <Input 
            placeholder="Search children..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            className="pl-9" 
          />
        </div>
        <Select value={ageGroupFilter} onValueChange={setAgeGroupFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Age Group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Age Groups</SelectItem>
            {Object.entries(ageGroupLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="waitlist">Waitlist</SelectItem>
            <SelectItem value="withdrawn">Withdrawn</SelectItem>
            <SelectItem value="graduated">Graduated</SelectItem>
          </SelectContent>
        </Select>
        <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setChildDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />Enroll Child
        </Button>
      </div>
      
      {/* Children List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredChildren.map(child => (
          <Card 
            key={child.id} 
            className={`hover:border-[#00897B]/30 transition-colors cursor-pointer ${child.checkInStatus === 'checked_in' ? 'border-l-4 border-l-green-400' : ''}`}
            onClick={() => { setSelectedChild(child); setChildDialogOpen(true) }}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className={`text-sm ${child.gender === 'female' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                    {getChildInitials(child)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{child.firstName} {child.lastName}</h3>
                    {getAgeGroupBadge(child.ageGroup)}
                    {getStatusBadge(child.status)}
                    {child.checkInStatus === 'checked_in' && (
                      <Badge className="bg-green-100 text-green-700 text-xs">Checked In</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-[#757575]">
                    <span>Age: {formatAge(child.dateOfBirth)}</span>
                    <span>•</span>
                    <span>{child.enrollmentType.replace('_', ' ')}</span>
                    <span>•</span>
                    <span>{child.medicalRecordNumber}</span>
                  </div>
                  
                  {child.allergies.length > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <Heart className="h-3 w-3 text-red-500" />
                      <div className="flex gap-1 flex-wrap">
                        {child.allergies.map(allergy => (
                          <Badge key={allergy.id} variant="outline" className="text-xs border-red-200 text-red-600">
                            {allergy.allergen}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="text-xs text-[#757575]">
                      Parent: {child.primaryGuardian.name}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7"
                        onClick={(e) => { e.stopPropagation(); setSelectedChild(child); handleCheckIn(child) }}
                      >
                        <LogIn className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7"
                        onClick={(e) => { e.stopPropagation() }}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
  
  const renderAttendanceTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Daily Attendance</h2>
          <p className="text-sm text-[#757575]">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />Select Date
          </Button>
          <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setCheckInDialogOpen(true)}>
            <LogIn className="h-4 w-4 mr-2" />Check In/Out
          </Button>
        </div>
      </div>
      
      {/* Attendance Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-green-50">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-green-600">{children.filter(c => c.checkInStatus === 'checked_in').length}</p>
            <p className="text-xs text-green-700">Present</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-50">
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 text-gray-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-600">{children.filter(c => c.checkInStatus === 'not_checked_in').length}</p>
            <p className="text-xs text-gray-600">Not Checked In</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50">
          <CardContent className="p-4 text-center">
            <XCircle className="h-6 w-6 text-red-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-red-600">0</p>
            <p className="text-xs text-red-600">Absent</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50">
          <CardContent className="p-4 text-center">
            <Timer className="h-6 w-6 text-orange-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-orange-600">0</p>
            <p className="text-xs text-orange-600">Late Pickups</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Attendance List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Attendance Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {children.map(child => (
              <div 
                key={child.id} 
                className={`flex items-center justify-between p-3 rounded-lg ${
                  child.checkInStatus === 'checked_in' ? 'bg-green-50 border border-green-200' : 
                  child.checkInStatus === 'checked_out' ? 'bg-gray-50' : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={`text-xs ${child.gender === 'female' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                      {getChildInitials(child)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{child.firstName} {child.lastName}</p>
                    <p className="text-xs text-[#757575]">{child.medicalRecordNumber}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    {child.checkInStatus === 'checked_in' && (
                      <>
                        <p className="text-green-600 font-medium">Checked In: {child.checkInTime}</p>
                        {child.checkOutTime && <p className="text-gray-500 text-xs">Out: {child.checkOutTime}</p>}
                      </>
                    )}
                    {child.checkInStatus === 'checked_out' && (
                      <p className="text-gray-500 font-medium">Checked Out: {child.checkOutTime}</p>
                    )}
                    {child.checkInStatus === 'not_checked_in' && (
                      <p className="text-gray-400">Not checked in</p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {child.checkInStatus !== 'checked_in' && (
                      <Button 
                        size="sm" 
                        className="bg-[#00897B] hover:bg-[#00695C] h-8"
                        onClick={() => handleCheckIn(child)}
                      >
                        <LogIn className="h-3 w-3 mr-1" />In
                      </Button>
                    )}
                    {child.checkInStatus === 'checked_in' && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8"
                        onClick={() => handleCheckOut(child)}
                      >
                        <LogOut className="h-3 w-3 mr-1" />Out
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
  
  const renderClassesTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Class & Room Management</h2>
        <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setClassDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />Add Class
        </Button>
      </div>
      
      {/* Capacity Overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Capacity Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#757575]">Overall Utilization</span>
                <span className="font-bold">{stats.utilizationRate}%</span>
              </div>
              <Progress value={stats.utilizationRate} className="h-3" />
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">{stats.totalEnrollment}/{stats.totalCapacity}</p>
              <p className="text-xs text-[#757575]">Total Enrollment</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Class Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {classes.map(cls => {
          const classChildren = children.filter(c => c.classId === cls.id)
          const presentChildren = classChildren.filter(c => c.checkInStatus === 'checked_in')
          const utilizationPercent = Math.round((cls.currentEnrollment / cls.capacity) * 100)
          
          return (
            <Card key={cls.id} className="hover:border-[#00897B]/30 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-[#00897B]" />
                      {cls.name}
                    </CardTitle>
                    <p className="text-sm text-[#757575]">{cls.roomNumber} • {ageGroupLabels[cls.ageGroup]}</p>
                  </div>
                  <Badge className={cls.status === 'full' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>
                    {cls.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Capacity */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[#757575]">Capacity: {cls.currentEnrollment}/{cls.capacity}</span>
                    <span className="text-xs font-medium">{utilizationPercent}%</span>
                  </div>
                  <Progress value={utilizationPercent} className="h-2" />
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 bg-green-50 rounded">
                    <p className="font-bold text-green-600">{presentChildren.length}</p>
                    <p className="text-[#757575]">Present</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="font-bold">{cls.staffRatio}</p>
                    <p className="text-[#757575]">Ratio</p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded">
                    <p className="font-bold">{cls.schedule.openTime}</p>
                    <p className="text-[#757575]">Opens</p>
                  </div>
                </div>
                
                {/* Staff */}
                <div>
                  <p className="text-xs font-medium text-[#757575] mb-2">Assigned Staff</p>
                  <div className="flex gap-2 flex-wrap">
                    {cls.assignedStaff.map(staff => (
                      <div key={staff.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[10px] bg-[#E0F2F1] text-[#00897B]">
                            {staff.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-xs font-medium">{staff.name}</p>
                          <p className="text-[10px] text-[#757575]">{staff.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Eye className="h-3 w-3 mr-1" />View Details
                  </Button>
                  <Button size="sm" variant="outline">
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
  
  const renderBillingTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Billing & Fee Management</h2>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />Export
          </Button>
          <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setFeeDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />Add Fee
          </Button>
        </div>
      </div>
      
      {/* Billing Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-green-50">
          <CardContent className="p-4">
            <p className="text-xs text-[#757575] mb-1">Collected This Month</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(stats.monthlyRevenue)}</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50">
          <CardContent className="p-4">
            <p className="text-xs text-[#757575] mb-1">Pending</p>
            <p className="text-xl font-bold text-yellow-600">{formatCurrency(stats.pendingFees)}</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50">
          <CardContent className="p-4">
            <p className="text-xs text-[#757575] mb-1">Overdue</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(stats.overdueFees)}</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50">
          <CardContent className="p-4">
            <p className="text-xs text-[#757575] mb-1">Expected Monthly</p>
            <p className="text-xl font-bold text-purple-600">{formatCurrency(children.reduce((s, c) => s + c.billingInfo.monthlyFee, 0))}</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Fee Types */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <PiggyBank className="h-4 w-4 text-[#00897B]" />
              Fee Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {['Full Time', 'Part Time', 'Infant Full Time', 'Kindergarten'].map(plan => (
                <div key={plan} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm">{plan}</span>
                  <span className="text-sm font-medium">${plan === 'Full Time' ? '1,100' : plan === 'Part Time' ? '700' : plan === 'Infant Full Time' ? '1,400' : '950'}/mo</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Gift className="h-4 w-4 text-[#00897B]" />
              Discounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-sm">Sibling Discount</span>
                <Badge className="bg-green-100 text-green-700">10% off</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-sm">Employee Discount</span>
                <Badge className="bg-green-100 text-green-700">15% off</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-sm">Late Pickup Fee</span>
                <Badge className="bg-orange-100 text-orange-700">$15/15min</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[#00897B]" />
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { method: 'Credit Card', count: children.filter(c => c.billingInfo.paymentMethod === 'Credit Card').length },
                { method: 'Bank Transfer', count: children.filter(c => c.billingInfo.paymentMethod === 'Bank Transfer').length },
                { method: 'Check', count: children.filter(c => c.billingInfo.paymentMethod === 'Check').length },
              ].map(({ method, count }) => (
                <div key={method} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm">{method}</span>
                  <span className="text-sm font-medium">{count} families</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Outstanding Invoices */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Outstanding Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {fees.filter(f => f.status === 'pending' || f.status === 'overdue').map(fee => (
              <div key={fee.id} className={`flex items-center justify-between p-3 rounded-lg ${fee.status === 'overdue' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-[#E0F2F1] text-[#00897B]">
                      {getChildInitials(fee.child)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{fee.child.firstName} {fee.child.lastName}</p>
                    <p className="text-xs text-[#757575]">{fee.invoiceNumber} • Due: {fee.dueDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(fee.totalAmount)}</p>
                    {fee.siblingDiscount > 0 && (
                      <p className="text-xs text-green-600">{fee.siblingDiscount}% sibling discount applied</p>
                    )}
                  </div>
                  {getStatusBadge(fee.status)}
                  <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C]">
                    <Send className="h-3 w-3 mr-1" />Remind
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
  
  const renderReportsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Daily Reports & Compliance</h2>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />Select Date
          </Button>
          <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setDailyReportDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />New Report
          </Button>
        </div>
      </div>
      
      {/* Daily Reports Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-[#00897B]" />
            Today's Daily Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dailyReports.map(report => (
              <div key={report.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-[#E0F2F1] text-[#00897B]">
                        {getChildInitials(report.child)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{report.child.firstName} {report.child.lastName}</h3>
                      <p className="text-xs text-[#757575]">Report by {report.createdBy}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {report.mood === 'happy' ? (
                      <Badge className="bg-green-100 text-green-700"><Smile className="h-3 w-3 mr-1" />Happy</Badge>
                    ) : report.mood === 'fussy' ? (
                      <Badge className="bg-orange-100 text-orange-700"><Frown className="h-3 w-3 mr-1" />Fussy</Badge>
                    ) : (
                      <Badge className="bg-blue-100 text-blue-700"><Meh className="h-3 w-3 mr-1" />Content</Badge>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-3">
                  {/* Meals */}
                  <div>
                    <p className="text-xs font-medium text-[#757575] mb-2 flex items-center gap-1">
                      <Utensils className="h-3 w-3" />Meals
                    </p>
                    <div className="space-y-1">
                      {report.meals.map((meal, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="capitalize">{meal.type.replace('_', ' ')}</span>
                          <Badge variant="outline" className="text-[10px]">{meal.amount}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Naps */}
                  <div>
                    <p className="text-xs font-medium text-[#757575] mb-2 flex items-center gap-1">
                      <Moon className="h-3 w-3" />Naps
                    </p>
                    <div className="space-y-1">
                      {report.naps.map((nap, idx) => (
                        <div key={idx} className="text-xs">
                          <span>{nap.startTime} - {nap.endTime}</span>
                          <Badge variant="outline" className="ml-2 text-[10px]">{nap.duration}min</Badge>
                        </div>
                      ))}
                      {report.naps.length === 0 && <span className="text-xs text-[#757575]">No naps today</span>}
                    </div>
                  </div>
                  
                  {/* Activities */}
                  <div>
                    <p className="text-xs font-medium text-[#757575] mb-2 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />Activities
                    </p>
                    <div className="space-y-1">
                      {report.activities.slice(0, 3).map((activity, idx) => (
                        <div key={idx} className="text-xs">
                          <span className="capitalize">{activity.type}</span>
                          <span className="text-[#757575]"> - {activity.participation}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t">
                  <p className="text-xs text-[#757575] italic">"{report.notes}"</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost"><Camera className="h-3 w-3 mr-1" />Photos</Button>
                    <Button size="sm" variant="ghost"><MessageSquare className="h-3 w-3 mr-1" />Message Parent</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Compliance Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#00897B]" />
            Compliance Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {complianceItems.map(item => (
              <div key={item.id} className={`p-3 rounded-lg border ${
                item.status === 'compliant' ? 'bg-green-50 border-green-200' :
                item.status === 'expiring_soon' ? 'bg-yellow-50 border-yellow-200' :
                'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {item.type === 'fire_drill' && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                    {item.type === 'health_inspection' && <Heart className="h-4 w-4 text-blue-500" />}
                    {item.type === 'safety_inspection' && <ShieldCheck className="h-4 w-4 text-green-500" />}
                    {item.type === 'staff_certification' && <Award className="h-4 w-4 text-purple-500" />}
                    {item.type === 'immunization' && <Activity className="h-4 w-4 text-pink-500" />}
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-[#757575]">Due: {item.dueDate}</p>
                    </div>
                  </div>
                  {getStatusBadge(item.status)}
                </div>
                {item.assignedTo && (
                  <p className="text-xs text-[#757575] mt-2">Assigned to: {item.assignedTo}</p>
                )}
                {item.completedDate && (
                  <p className="text-xs text-green-600 mt-2">Completed: {item.completedDate}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Milestones */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-5 w-5 text-[#00897B]" />
            Recent Milestones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {milestones.filter(m => m.status === 'achieved').slice(0, 5).map(milestone => {
              const child = children.find(c => c.id === milestone.childId)
              return (
                <div key={milestone.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <Trophy className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{child?.firstName} - {milestone.name}</p>
                      <p className="text-xs text-[#757575]">{milestone.category} • Achieved: {milestone.achievedDate}</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700">Achieved</Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
  
  // =====================================================
  // MAIN RENDER
  // =====================================================
  
  return (
    <div className="flex-1 flex flex-col bg-[#FAFAFA] min-h-0">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
              <Baby className="h-5 w-5 text-[#00897B]" />
              Childcare Management
            </h1>
            <p className="text-sm text-[#757575]">Comprehensive childcare and education management system</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="relative">
              <Bell className="h-4 w-4" />
              {stats.unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {stats.unreadNotifications}
                </span>
              )}
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />Refresh
            </Button>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex-1 flex flex-col min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="bg-white border-b border-gray-200 px-4">
            <TabsList className="bg-transparent h-12">
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <BarChart3 className="h-4 w-4 mr-2" />Dashboard
              </TabsTrigger>
              <TabsTrigger value="children" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Users className="h-4 w-4 mr-2" />Children
              </TabsTrigger>
              <TabsTrigger value="attendance" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Calendar className="h-4 w-4 mr-2" />Attendance
              </TabsTrigger>
              <TabsTrigger value="classes" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Building2 className="h-4 w-4 mr-2" />Classes
              </TabsTrigger>
              <TabsTrigger value="billing" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <DollarSign className="h-4 w-4 mr-2" />Billing
              </TabsTrigger>
              <TabsTrigger value="reports" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <ClipboardList className="h-4 w-4 mr-2" />Reports
              </TabsTrigger>
            </TabsList>
          </div>
          
          <ScrollArea className="flex-1 p-4">
            <TabsContent value="dashboard" className="m-0">{renderDashboard()}</TabsContent>
            <TabsContent value="children" className="m-0">{renderChildrenTab()}</TabsContent>
            <TabsContent value="attendance" className="m-0">{renderAttendanceTab()}</TabsContent>
            <TabsContent value="classes" className="m-0">{renderClassesTab()}</TabsContent>
            <TabsContent value="billing" className="m-0">{renderBillingTab()}</TabsContent>
            <TabsContent value="reports" className="m-0">{renderReportsTab()}</TabsContent>
          </ScrollArea>
        </Tabs>
      </div>
      
      {/* Check In/Out Dialog */}
      <Dialog open={checkInDialogOpen} onOpenChange={setCheckInDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5 text-[#00897B]" />
              Check In / Check Out
            </DialogTitle>
            <DialogDescription>Select a child to check in or out</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
              <Input placeholder="Search children..." className="pl-9" />
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {children.map(child => (
                <div 
                  key={child.id} 
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    child.checkInStatus === 'checked_in' ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-[#E0F2F1] text-[#00897B]">
                        {getChildInitials(child)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{child.firstName} {child.lastName}</p>
                      <p className="text-xs text-[#757575]">{child.checkInStatus === 'checked_in' ? `In since ${child.checkInTime}` : 'Not checked in'}</p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    className={child.checkInStatus === 'checked_in' ? 'bg-gray-600 hover:bg-gray-700' : 'bg-[#00897B] hover:bg-[#00695C]'}
                    onClick={() => {
                      if (child.checkInStatus === 'checked_in') {
                        handleCheckOut(child)
                      } else {
                        handleCheckIn(child)
                      }
                    }}
                  >
                    {child.checkInStatus === 'checked_in' ? <LogOut className="h-3 w-3 mr-1" /> : <LogIn className="h-3 w-3 mr-1" />}
                    {child.checkInStatus === 'checked_in' ? 'Out' : 'In'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Child Enrollment Dialog */}
      <Dialog open={childDialogOpen} onOpenChange={setChildDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-[#00897B]" />
              {selectedChild ? 'Child Profile' : 'Enroll New Child'}
            </DialogTitle>
            <DialogDescription>
              {selectedChild ? 'View or edit child information' : 'Enter child and guardian information'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedChild ? (
            <div className="space-y-6">
              {/* Child Info */}
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className={`text-lg ${selectedChild.gender === 'female' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                    {getChildInitials(selectedChild)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{selectedChild.firstName} {selectedChild.lastName}</h3>
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    {getAgeGroupBadge(selectedChild.ageGroup)}
                    {getStatusBadge(selectedChild.status)}
                    <Badge variant="outline" className="text-xs">{selectedChild.medicalRecordNumber}</Badge>
                  </div>
                  <p className="text-sm text-[#757575] mt-1">
                    DOB: {selectedChild.dateOfBirth} • Age: {formatAge(selectedChild.dateOfBirth)}
                  </p>
                </div>
              </div>
              
              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-[#757575]">Primary Guardian</Label>
                  <p className="font-medium">{selectedChild.primaryGuardian.name}</p>
                  <p className="text-sm text-[#757575]">{selectedChild.primaryGuardian.relationship}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-3 w-3" />
                    <span>{selectedChild.primaryGuardian.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-3 w-3" />
                    <span>{selectedChild.primaryGuardian.email}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-[#757575]">Enrollment</Label>
                  <p className="font-medium capitalize">{selectedChild.enrollmentType.replace('_', ' ')}</p>
                  <p className="text-sm text-[#757575]">Since: {selectedChild.enrollmentDate}</p>
                  <p className="text-sm font-medium">Fee: {formatCurrency(selectedChild.billingInfo.monthlyFee)}/mo</p>
                  {selectedChild.billingInfo.siblingDiscount > 0 && (
                    <Badge className="bg-green-100 text-green-700">{selectedChild.billingInfo.siblingDiscount}% sibling discount</Badge>
                  )}
                </div>
              </div>
              
              {/* Allergies */}
              {selectedChild.allergies.length > 0 && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <Label className="text-xs text-red-700 flex items-center gap-1 mb-2">
                    <Heart className="h-3 w-3" /> Allergies
                  </Label>
                  <div className="space-y-2">
                    {selectedChild.allergies.map(allergy => (
                      <div key={allergy.id} className="flex items-center justify-between">
                        <span className="font-medium">{allergy.allergen}</span>
                        {getSeverityBadge(allergy.severity)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Emergency Contacts */}
              <div>
                <Label className="text-xs text-[#757575] mb-2 block">Emergency Contacts</Label>
                <div className="space-y-2">
                  {selectedChild.emergencyContacts.map(contact => (
                    <div key={contact.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{contact.name}</p>
                        <p className="text-xs text-[#757575]">{contact.relationship}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{contact.phone}</span>
                        {contact.isPrimary && <Badge className="bg-blue-100 text-blue-700 text-[10px]">Primary</Badge>}
                        {contact.authorizedPickup && <Badge className="bg-green-100 text-green-700 text-[10px]">Pickup</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Immunizations */}
              <div>
                <Label className="text-xs text-[#757575] mb-2 block flex items-center gap-1">
                  <Activity className="h-3 w-3" /> Immunization Records
                </Label>
                <div className="space-y-2">
                  {selectedChild.immunizations.map(imm => (
                    <div key={imm.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{imm.vaccineName}</p>
                        <p className="text-xs text-[#757575]">Administered: {imm.dateAdministered}</p>
                      </div>
                      {getStatusBadge(imm.status)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <p className="text-sm text-[#757575]">New child enrollment form would go here...</p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => { setChildDialogOpen(false); setSelectedChild(null) }}>
              Close
            </Button>
            {selectedChild && (
              <Button className="bg-[#00897B] hover:bg-[#00695C]">
                <Edit className="h-4 w-4 mr-2" />Edit Profile
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Daily Report Dialog */}
      <Dialog open={dailyReportDialogOpen} onOpenChange={setDailyReportDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-[#00897B]" />
              Create Daily Report
            </DialogTitle>
            <DialogDescription>Document daily activities, meals, and observations</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Child</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select child" />
                  </SelectTrigger>
                  <SelectContent>
                    {children.filter(c => c.checkInStatus === 'checked_in').map(child => (
                      <SelectItem key={child.id} value={child.id}>
                        {child.firstName} {child.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
            </div>
            
            <div className="space-y-3">
              <Label>Meals</Label>
              <div className="grid grid-cols-2 gap-2">
                {['breakfast', 'morning_snack', 'lunch', 'afternoon_snack'].map(meal => (
                  <div key={meal} className="flex items-center gap-2 p-2 border rounded-lg">
                    <Utensils className="h-4 w-4 text-[#757575]" />
                    <span className="text-sm capitalize flex-1">{meal.replace('_', ' ')}</span>
                    <Select>
                      <SelectTrigger className="w-20 h-8">
                        <SelectValue placeholder="--" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="some">Some</SelectItem>
                        <SelectItem value="most">Most</SelectItem>
                        <SelectItem value="all">All</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <Label>Overall Mood</Label>
              <div className="flex gap-2 mt-2">
                <Button variant="outline" className="flex-1"><Smile className="h-4 w-4 mr-1 text-green-500" />Happy</Button>
                <Button variant="outline" className="flex-1"><Meh className="h-4 w-4 mr-1 text-blue-500" />Content</Button>
                <Button variant="outline" className="flex-1"><Frown className="h-4 w-4 mr-1 text-orange-500" />Fussy</Button>
              </div>
            </div>
            
            <div>
              <Label>Notes</Label>
              <Textarea placeholder="Enter any observations or notes..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDailyReportDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]">
              <Save className="h-4 w-4 mr-2" />Save Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Missing import
const Save = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
)
