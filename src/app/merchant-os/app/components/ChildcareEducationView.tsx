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
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from 'sonner'
import {
  Baby,
  Users,
  Calendar as CalendarIcon,
  DollarSign,
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  Clock,
  Plus,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Sparkles,
  Heart,
  Utensils,
  Moon,
  Camera,
  MessageCircle,
  TrendingUp,
  FileText,
  Phone,
  Mail,
  MapPin,
  Cake,
  Activity,
  Award,
  Send,
  Bell,
  CreditCard,
  Receipt,
  Wallet,
  AlertTriangle,
  Sun,
  Droplets,
  Smile,
  Frown,
  Meh,
  Sticker,
  Star,
  Target,
  User,
} from 'lucide-react'
import { format } from 'date-fns'

// Types
type StudentStatus = 'active' | 'inactive' | 'graduated' | 'transferred'
type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'
type GradeLevel = 'infant' | 'toddler' | 'preschool' | 'prek' | 'kindergarten' | 'grade1' | 'grade2' | 'grade3' | 'grade4' | 'grade5' | 'grade6'
type FeeStatus = 'paid' | 'pending' | 'overdue' | 'partial'
type MealType = 'breakfast' | 'morning_snack' | 'lunch' | 'afternoon_snack' | 'dinner'
type MoodType = 'happy' | 'neutral' | 'sad' | 'tired' | 'sick'

interface Student {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: 'male' | 'female'
  gradeLevel: GradeLevel
  className: string
  status: StudentStatus
  enrollmentDate: string
  parentName: string
  parentPhone: string
  parentEmail: string
  emergencyContact: string
  address: string
  allergies: string[]
  medicalConditions: string[]
  photoUrl?: string
  notes: string
  createdAt: string
}

interface AttendanceRecord {
  id: string
  studentId: string
  studentName: string
  date: string
  status: AttendanceStatus
  checkInTime?: string
  checkOutTime?: string
  notes?: string
}

interface DailyActivity {
  id: string
  studentId: string
  studentName: string
  date: string
  meals: Array<{ type: MealType; time: string; amount: string; notes?: string }>
  naps: Array<{ startTime: string; endTime: string; quality: 'good' | 'fair' | 'poor' }>
  diapers: Array<{ time: string; type: 'wet' | 'soiled' | 'dry'; notes?: string }>
  activities: Array<{ name: string; time: string; participation: 'excellent' | 'good' | 'fair' | 'poor'; notes?: string }>
  mood: MoodType
  notes: string
}

interface Milestone {
  id: string
  studentId: string
  studentName: string
  category: 'motor' | 'language' | 'social' | 'cognitive' | 'self_care'
  name: string
  description: string
  achievedDate: string
  notes?: string
  ageAtAchievement: string
}

interface FeeRecord {
  id: string
  studentId: string
  studentName: string
  feeType: 'tuition' | 'meals' | 'transport' | 'after_care' | 'registration' | 'supplies' | 'other'
  amount: number
  dueDate: string
  paidDate?: string
  status: FeeStatus
  paidAmount: number
  balance: number
  paymentMethod?: string
  notes?: string
}

interface AcademicRecord {
  id: string
  studentId: string
  studentName: string
  term: string
  subject: string
  grade: string
  score?: number
  maxScore?: number
  comments?: string
  teacherName: string
  date: string
}

interface ParentCommunication {
  id: string
  studentId: string
  studentName: string
  type: 'message' | 'call' | 'meeting' | 'note'
  subject: string
  content: string
  direction: 'incoming' | 'outgoing'
  createdAt: string
  staffName: string
  followUpRequired: boolean
  followUpDate?: string
}

// Grade level labels
const gradeLevelLabels: Record<GradeLevel, string> = {
  infant: 'Infant (0-12 mo)',
  toddler: 'Toddler (1-2 yrs)',
  preschool: 'Preschool (3 yrs)',
  prek: 'Pre-K (4 yrs)',
  kindergarten: 'Kindergarten',
  grade1: 'Grade 1',
  grade2: 'Grade 2',
  grade3: 'Grade 3',
  grade4: 'Grade 4',
  grade5: 'Grade 5',
  grade6: 'Grade 6',
}

// Grade level colors
const gradeLevelColors: Record<GradeLevel, { bg: string; text: string }> = {
  infant: { bg: 'bg-pink-100', text: 'text-pink-700' },
  toddler: { bg: 'bg-purple-100', text: 'text-purple-700' },
  preschool: { bg: 'bg-blue-100', text: 'text-blue-700' },
  prek: { bg: 'bg-cyan-100', text: 'text-cyan-700' },
  kindergarten: { bg: 'bg-green-100', text: 'text-green-700' },
  grade1: { bg: 'bg-amber-100', text: 'text-amber-700' },
  grade2: { bg: 'bg-orange-100', text: 'text-orange-700' },
  grade3: { bg: 'bg-red-100', text: 'text-red-700' },
  grade4: { bg: 'bg-rose-100', text: 'text-rose-700' },
  grade5: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  grade6: { bg: 'bg-violet-100', text: 'text-violet-700' },
}

// Student status colors
const studentStatusColors: Record<StudentStatus, { bg: string; text: string }> = {
  active: { bg: 'bg-green-100', text: 'text-green-700' },
  inactive: { bg: 'bg-gray-100', text: 'text-gray-700' },
  graduated: { bg: 'bg-blue-100', text: 'text-blue-700' },
  transferred: { bg: 'bg-amber-100', text: 'text-amber-700' },
}

// Attendance status colors
const attendanceStatusColors: Record<AttendanceStatus, { bg: string; text: string }> = {
  present: { bg: 'bg-green-100', text: 'text-green-700' },
  absent: { bg: 'bg-red-100', text: 'text-red-700' },
  late: { bg: 'bg-amber-100', text: 'text-amber-700' },
  excused: { bg: 'bg-blue-100', text: 'text-blue-700' },
}

// Fee status colors
const feeStatusColors: Record<FeeStatus, { bg: string; text: string }> = {
  paid: { bg: 'bg-green-100', text: 'text-green-700' },
  pending: { bg: 'bg-amber-100', text: 'text-amber-700' },
  overdue: { bg: 'bg-red-100', text: 'text-red-700' },
  partial: { bg: 'bg-orange-100', text: 'text-orange-700' },
}

// Mood colors and icons
const moodConfig: Record<MoodType, { bg: string; text: string; icon: any }> = {
  happy: { bg: 'bg-green-100', text: 'text-green-700', icon: Smile },
  neutral: { bg: 'bg-gray-100', text: 'text-gray-700', icon: Meh },
  sad: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Frown },
  tired: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Moon },
  sick: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertCircle },
}

// Fee type labels
const feeTypeLabels: Record<string, string> = {
  tuition: 'Tuition',
  meals: 'Meals',
  transport: 'Transport',
  after_care: 'After-Care',
  registration: 'Registration',
  supplies: 'Supplies',
  other: 'Other',
}

// Milestone category labels
const milestoneCategoryLabels: Record<string, string> = {
  motor: 'Motor Skills',
  language: 'Language',
  social: 'Social Skills',
  cognitive: 'Cognitive',
  self_care: 'Self-Care',
}

// Sample data
const sampleStudents: Student[] = [
  {
    id: '1',
    firstName: 'Emma',
    lastName: 'Johnson',
    dateOfBirth: '2021-03-15',
    gender: 'female',
    gradeLevel: 'toddler',
    className: 'Butterflies',
    status: 'active',
    enrollmentDate: '2023-01-10',
    parentName: 'Sarah Johnson',
    parentPhone: '+27 82 123 4567',
    parentEmail: 'sarah.j@email.com',
    emergencyContact: 'John Johnson +27 83 234 5678',
    address: '123 Oak Street, Johannesburg',
    allergies: ['Peanuts'],
    medicalConditions: [],
    notes: 'Loves music and dancing',
    createdAt: '2023-01-10',
  },
  {
    id: '2',
    firstName: 'Liam',
    lastName: 'Williams',
    dateOfBirth: '2020-06-22',
    gender: 'male',
    gradeLevel: 'preschool',
    className: 'Ladybugs',
    status: 'active',
    enrollmentDate: '2023-02-01',
    parentName: 'Michael Williams',
    parentPhone: '+27 84 345 6789',
    parentEmail: 'mwilliams@email.com',
    emergencyContact: 'Lisa Williams +27 85 456 7890',
    address: '456 Pine Road, Johannesburg',
    allergies: [],
    medicalConditions: ['Asthma'],
    notes: 'Needs inhaler nearby',
    createdAt: '2023-02-01',
  },
  {
    id: '3',
    firstName: 'Olivia',
    lastName: 'Brown',
    dateOfBirth: '2019-11-08',
    gender: 'female',
    gradeLevel: 'prek',
    className: 'Dragonflies',
    status: 'active',
    enrollmentDate: '2022-08-15',
    parentName: 'Jennifer Brown',
    parentPhone: '+27 86 567 8901',
    parentEmail: 'jbrown@email.com',
    emergencyContact: 'David Brown +27 87 678 9012',
    address: '789 Maple Avenue, Sandton',
    allergies: ['Dairy', 'Eggs'],
    medicalConditions: [],
    notes: 'Very creative, loves art',
    createdAt: '2022-08-15',
  },
  {
    id: '4',
    firstName: 'Noah',
    lastName: 'Davis',
    dateOfBirth: '2018-04-30',
    gender: 'male',
    gradeLevel: 'kindergarten',
    className: 'Sunflowers',
    status: 'active',
    enrollmentDate: '2023-01-05',
    parentName: 'Amanda Davis',
    parentPhone: '+27 88 789 0123',
    parentEmail: 'adavis@email.com',
    emergencyContact: 'Robert Davis +27 89 890 1234',
    address: '321 Elm Street, Sandton',
    allergies: [],
    medicalConditions: [],
    notes: 'Enjoys building blocks',
    createdAt: '2023-01-05',
  },
  {
    id: '5',
    firstName: 'Sophia',
    lastName: 'Miller',
    dateOfBirth: '2017-09-12',
    gender: 'female',
    gradeLevel: 'grade1',
    className: 'Stars',
    status: 'active',
    enrollmentDate: '2022-01-10',
    parentName: 'Emily Miller',
    parentPhone: '+27 81 901 2345',
    parentEmail: 'emiller@email.com',
    emergencyContact: 'James Miller +27 82 012 3456',
    address: '654 Birch Lane, Rosebank',
    allergies: ['Gluten'],
    medicalConditions: [],
    notes: 'Excellent reader',
    createdAt: '2022-01-10',
  },
]

const sampleDailyActivities: DailyActivity[] = [
  {
    id: '1',
    studentId: '1',
    studentName: 'Emma Johnson',
    date: new Date().toISOString().split('T')[0],
    meals: [
      { type: 'breakfast', time: '08:00', amount: 'Full portion', notes: 'Ate well' },
      { type: 'morning_snack', time: '10:00', amount: 'Apple slices', notes: '' },
      { type: 'lunch', time: '12:00', amount: 'Most of portion', notes: 'Left some veggies' },
      { type: 'afternoon_snack', time: '15:00', amount: 'Crackers and cheese', notes: '' },
    ],
    naps: [
      { startTime: '13:00', endTime: '15:00', quality: 'good' },
    ],
    diapers: [
      { time: '09:30', type: 'wet', notes: '' },
      { time: '11:45', type: 'soiled', notes: '' },
      { time: '14:30', type: 'wet', notes: '' },
    ],
    activities: [
      { name: 'Circle Time', time: '09:00', participation: 'excellent', notes: 'Sang songs' },
      { name: 'Art', time: '10:30', participation: 'good', notes: 'Painting' },
      { name: 'Outdoor Play', time: '11:00', participation: 'excellent', notes: 'Loved the slide' },
    ],
    mood: 'happy',
    notes: 'Great day overall! Very engaged in activities.',
  },
  {
    id: '2',
    studentId: '2',
    studentName: 'Liam Williams',
    date: new Date().toISOString().split('T')[0],
    meals: [
      { type: 'breakfast', time: '08:00', amount: 'Full portion', notes: '' },
      { type: 'morning_snack', time: '10:00', amount: 'Fruit cup', notes: '' },
      { type: 'lunch', time: '12:00', amount: 'Full portion', notes: 'Loved the pasta' },
      { type: 'afternoon_snack', time: '15:00', amount: 'Yogurt', notes: '' },
    ],
    naps: [
      { startTime: '13:00', endTime: '14:30', quality: 'fair' },
    ],
    diapers: [],
    activities: [
      { name: 'Circle Time', time: '09:00', participation: 'good', notes: '' },
      { name: 'Story Time', time: '10:30', participation: 'excellent', notes: 'Asked lots of questions' },
      { name: 'Outdoor Play', time: '11:00', participation: 'good', notes: '' },
    ],
    mood: 'happy',
    notes: 'Played well with others. Used inhaler once.',
  },
]

const sampleMilestones: Milestone[] = [
  {
    id: '1',
    studentId: '1',
    studentName: 'Emma Johnson',
    category: 'motor',
    name: 'Walking independently',
    description: 'Can walk without support for 10+ steps',
    achievedDate: '2022-06-15',
    notes: 'Achieved earlier than expected',
    ageAtAchievement: '15 months',
  },
  {
    id: '2',
    studentId: '1',
    studentName: 'Emma Johnson',
    category: 'language',
    name: 'First two-word phrase',
    description: 'Combines two words meaningfully',
    achievedDate: '2023-02-20',
    ageAtAchievement: '23 months',
  },
  {
    id: '3',
    studentId: '2',
    studentName: 'Liam Williams',
    category: 'social',
    name: 'Parallel play',
    description: 'Plays alongside other children',
    achievedDate: '2023-03-01',
    ageAtAchievement: '32 months',
  },
  {
    id: '4',
    studentId: '3',
    studentName: 'Olivia Brown',
    category: 'cognitive',
    name: 'Counts to 10',
    description: 'Can count objects up to 10',
    achievedDate: '2023-05-10',
    ageAtAchievement: '42 months',
  },
]

const sampleFees: FeeRecord[] = [
  {
    id: '1',
    studentId: '1',
    studentName: 'Emma Johnson',
    feeType: 'tuition',
    amount: 4500,
    dueDate: '2024-01-05',
    paidDate: '2024-01-03',
    status: 'paid',
    paidAmount: 4500,
    balance: 0,
    paymentMethod: 'EFT',
  },
  {
    id: '2',
    studentId: '1',
    studentName: 'Emma Johnson',
    feeType: 'meals',
    amount: 800,
    dueDate: '2024-01-05',
    status: 'pending',
    paidAmount: 0,
    balance: 800,
  },
  {
    id: '3',
    studentId: '2',
    studentName: 'Liam Williams',
    feeType: 'tuition',
    amount: 5000,
    dueDate: '2024-01-05',
    status: 'overdue',
    paidAmount: 2500,
    balance: 2500,
  },
  {
    id: '4',
    studentId: '3',
    studentName: 'Olivia Brown',
    feeType: 'tuition',
    amount: 5500,
    dueDate: '2024-01-05',
    paidDate: '2024-01-02',
    status: 'paid',
    paidAmount: 5500,
    balance: 0,
    paymentMethod: 'Credit Card',
  },
  {
    id: '5',
    studentId: '4',
    studentName: 'Noah Davis',
    feeType: 'after_care',
    amount: 1200,
    dueDate: '2024-01-05',
    status: 'partial',
    paidAmount: 600,
    balance: 600,
  },
]

const sampleAcademicRecords: AcademicRecord[] = [
  {
    id: '1',
    studentId: '5',
    studentName: 'Sophia Miller',
    term: 'Term 1 2024',
    subject: 'Reading',
    grade: 'A',
    score: 95,
    maxScore: 100,
    comments: 'Excellent comprehension and fluency',
    teacherName: 'Mrs. Thompson',
    date: '2024-03-15',
  },
  {
    id: '2',
    studentId: '5',
    studentName: 'Sophia Miller',
    term: 'Term 1 2024',
    subject: 'Mathematics',
    grade: 'B+',
    score: 87,
    maxScore: 100,
    comments: 'Good progress in addition and subtraction',
    teacherName: 'Mr. Roberts',
    date: '2024-03-15',
  },
  {
    id: '3',
    studentId: '4',
    studentName: 'Noah Davis',
    term: 'Term 1 2024',
    subject: 'Reading',
    grade: 'B',
    score: 82,
    maxScore: 100,
    comments: 'Improving steadily',
    teacherName: 'Mrs. Thompson',
    date: '2024-03-15',
  },
]

const sampleCommunications: ParentCommunication[] = [
  {
    id: '1',
    studentId: '1',
    studentName: 'Emma Johnson',
    type: 'message',
    subject: 'Allergy reminder',
    content: 'Just a reminder that Emma has a peanut allergy. Please ensure she does not share food.',
    direction: 'outgoing',
    createdAt: '2024-01-10T09:00:00',
    staffName: 'Teacher Sarah',
    followUpRequired: false,
  },
  {
    id: '2',
    studentId: '2',
    studentName: 'Liam Williams',
    type: 'call',
    subject: 'Asthma incident',
    content: 'Liam had a mild asthma episode today. Used inhaler once. He is doing fine now.',
    direction: 'outgoing',
    createdAt: '2024-01-12T14:30:00',
    staffName: 'Nurse Jane',
    followUpRequired: true,
    followUpDate: '2024-01-13',
  },
  {
    id: '3',
    studentId: '3',
    studentName: 'Olivia Brown',
    type: 'meeting',
    subject: 'Progress discussion',
    content: 'Scheduled parent-teacher meeting to discuss Olivia\'s progress and upcoming activities.',
    direction: 'outgoing',
    createdAt: '2024-01-08T11:00:00',
    staffName: 'Director Mary',
    followUpRequired: true,
    followUpDate: '2024-01-15',
  },
]

export function ChildcareEducationView() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  
  // Data states
  const [students, setStudents] = useState<Student[]>([])
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [dailyActivities, setDailyActivities] = useState<DailyActivity[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [fees, setFees] = useState<FeeRecord[]>([])
  const [academicRecords, setAcademicRecords] = useState<AcademicRecord[]>([])
  const [communications, setCommunications] = useState<ParentCommunication[]>([])
  
  // Dialog states
  const [studentDialogOpen, setStudentDialogOpen] = useState(false)
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false)
  const [activityDialogOpen, setActivityDialogOpen] = useState(false)
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false)
  const [feeDialogOpen, setFeeDialogOpen] = useState(false)
  const [communicationDialogOpen, setCommunicationDialogOpen] = useState(false)
  const [studentDetailOpen, setStudentDetailOpen] = useState(false)
  
  // Selected items
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedClass, setSelectedClass] = useState<string>('all')
  
  // Form states
  const [newStudent, setNewStudent] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'male' as 'male' | 'female',
    gradeLevel: 'preschool' as GradeLevel,
    className: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    emergencyContact: '',
    address: '',
    allergies: '',
    medicalConditions: '',
    notes: '',
  })
  
  const [newActivity, setNewActivity] = useState({
    studentId: '',
    meals: '',
    naps: '',
    diapers: '',
    activities: '',
    mood: 'happy' as MoodType,
    notes: '',
  })
  
  const [newMilestone, setNewMilestone] = useState({
    studentId: '',
    category: 'motor' as 'motor' | 'language' | 'social' | 'cognitive' | 'self_care',
    name: '',
    description: '',
    achievedDate: '',
    notes: '',
  })
  
  const [newFee, setNewFee] = useState({
    studentId: '',
    feeType: 'tuition' as FeeRecord['feeType'],
    amount: '',
    dueDate: '',
    notes: '',
  })
  
  const [newCommunication, setNewCommunication] = useState({
    studentId: '',
    type: 'message' as ParentCommunication['type'],
    subject: '',
    content: '',
    followUpRequired: false,
    followUpDate: '',
  })
  
  const [saving, setSaving] = useState(false)
  
  // Search/filter states
  const [studentSearch, setStudentSearch] = useState('')
  const [feeSearch, setFeeSearch] = useState('')
  const [studentFilter, setStudentFilter] = useState<string>('all')
  const [feeFilter, setFeeFilter] = useState<string>('all')

  // Fetch data on mount
  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      // Try to fetch from API, fall back to sample data
      try {
        const studentsRes = await fetch('/merchant-os/api/childcare/students')
        if (studentsRes.ok) {
          const data = await studentsRes.json()
          if (data.length > 0) setStudents(data)
          else setStudents(sampleStudents)
        } else {
          setStudents(sampleStudents)
        }
      } catch {
        setStudents(sampleStudents)
      }
      
      setDailyActivities(sampleDailyActivities)
      setMilestones(sampleMilestones)
      setFees(sampleFees)
      setAcademicRecords(sampleAcademicRecords)
      setCommunications(sampleCommunications)
      
      // Generate today's attendance from students
      const todayAttendance: AttendanceRecord[] = sampleStudents.map(s => ({
        id: `att-${s.id}`,
        studentId: s.id,
        studentName: `${s.firstName} ${s.lastName}`,
        date: new Date().toISOString().split('T')[0],
        status: Math.random() > 0.2 ? 'present' : Math.random() > 0.5 ? 'late' : 'absent',
        checkInTime: Math.random() > 0.2 ? '08:00' : undefined,
        notes: '',
      }))
      setAttendance(todayAttendance)
      
    } finally {
      setLoading(false)
    }
  }

  // Calculate stats
  const stats = {
    totalStudents: students.filter(s => s.status === 'active').length,
    attendanceRate: attendance.length > 0 
      ? Math.round((attendance.filter(a => a.status === 'present' || a.status === 'late').length / attendance.length) * 100)
      : 100,
    feesCollected: fees.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.paidAmount, 0),
    outstandingFees: fees.filter(f => f.status !== 'paid').reduce((sum, f) => sum + f.balance, 0),
    upcomingEvents: 3,
    presentToday: attendance.filter(a => a.status === 'present').length,
    absentToday: attendance.filter(a => a.status === 'absent').length,
    lateToday: attendance.filter(a => a.status === 'late').length,
    overdueFees: fees.filter(f => f.status === 'overdue').length,
  }

  // Create student
  const createStudent = async () => {
    if (!newStudent.firstName || !newStudent.lastName || !newStudent.parentName) {
      toast.error('Please fill all required fields')
      return
    }
    
    setSaving(true)
    try {
      const student: Student = {
        id: `student-${Date.now()}`,
        firstName: newStudent.firstName,
        lastName: newStudent.lastName,
        dateOfBirth: newStudent.dateOfBirth,
        gender: newStudent.gender,
        gradeLevel: newStudent.gradeLevel,
        className: newStudent.className || 'Unassigned',
        status: 'active',
        enrollmentDate: new Date().toISOString().split('T')[0],
        parentName: newStudent.parentName,
        parentPhone: newStudent.parentPhone,
        parentEmail: newStudent.parentEmail,
        emergencyContact: newStudent.emergencyContact,
        address: newStudent.address,
        allergies: newStudent.allergies ? newStudent.allergies.split(',').map(s => s.trim()) : [],
        medicalConditions: newStudent.medicalConditions ? newStudent.medicalConditions.split(',').map(s => s.trim()) : [],
        notes: newStudent.notes,
        createdAt: new Date().toISOString(),
      }
      
      setStudents(prev => [...prev, student])
      toast.success('Student enrolled successfully')
      setStudentDialogOpen(false)
      setNewStudent({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: 'male',
        gradeLevel: 'preschool',
        className: '',
        parentName: '',
        parentPhone: '',
        parentEmail: '',
        emergencyContact: '',
        address: '',
        allergies: '',
        medicalConditions: '',
        notes: '',
      })
    } catch (error) {
      console.error('Error creating student:', error)
      toast.error('Failed to enroll student')
    } finally {
      setSaving(false)
    }
  }

  // Update attendance
  const updateAttendance = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev => prev.map(a => 
      a.studentId === studentId 
        ? { 
            ...a, 
            status,
            checkInTime: status === 'present' || status === 'late' ? '08:00' : undefined 
          } 
        : a
    ))
    toast.success('Attendance updated')
  }

  // Create activity
  const createActivity = async () => {
    if (!newActivity.studentId) {
      toast.error('Please select a student')
      return
    }
    
    setSaving(true)
    try {
      const student = students.find(s => s.id === newActivity.studentId)
      const activity: DailyActivity = {
        id: `activity-${Date.now()}`,
        studentId: newActivity.studentId,
        studentName: student ? `${student.firstName} ${student.lastName}` : '',
        date: new Date().toISOString().split('T')[0],
        meals: [],
        naps: [],
        diapers: [],
        activities: [],
        mood: newActivity.mood,
        notes: newActivity.notes,
      }
      
      setDailyActivities(prev => [...prev, activity])
      toast.success('Daily activity recorded')
      setActivityDialogOpen(false)
      setNewActivity({
        studentId: '',
        meals: '',
        naps: '',
        diapers: '',
        activities: '',
        mood: 'happy',
        notes: '',
      })
    } catch (error) {
      console.error('Error creating activity:', error)
      toast.error('Failed to record activity')
    } finally {
      setSaving(false)
    }
  }

  // Create milestone
  const createMilestone = async () => {
    if (!newMilestone.studentId || !newMilestone.name) {
      toast.error('Please fill all required fields')
      return
    }
    
    setSaving(true)
    try {
      const student = students.find(s => s.id === newMilestone.studentId)
      const milestone: Milestone = {
        id: `milestone-${Date.now()}`,
        studentId: newMilestone.studentId,
        studentName: student ? `${student.firstName} ${student.lastName}` : '',
        category: newMilestone.category,
        name: newMilestone.name,
        description: newMilestone.description,
        achievedDate: newMilestone.achievedDate || new Date().toISOString().split('T')[0],
        notes: newMilestone.notes,
        ageAtAchievement: 'N/A',
      }
      
      setMilestones(prev => [...prev, milestone])
      toast.success('Milestone recorded')
      setMilestoneDialogOpen(false)
      setNewMilestone({
        studentId: '',
        category: 'motor',
        name: '',
        description: '',
        achievedDate: '',
        notes: '',
      })
    } catch (error) {
      console.error('Error creating milestone:', error)
      toast.error('Failed to record milestone')
    } finally {
      setSaving(false)
    }
  }

  // Create fee
  const createFee = async () => {
    if (!newFee.studentId || !newFee.amount) {
      toast.error('Please fill all required fields')
      return
    }
    
    setSaving(true)
    try {
      const student = students.find(s => s.id === newFee.studentId)
      const fee: FeeRecord = {
        id: `fee-${Date.now()}`,
        studentId: newFee.studentId,
        studentName: student ? `${student.firstName} ${student.lastName}` : '',
        feeType: newFee.feeType,
        amount: parseFloat(newFee.amount),
        dueDate: newFee.dueDate || new Date().toISOString().split('T')[0],
        status: 'pending',
        paidAmount: 0,
        balance: parseFloat(newFee.amount),
        notes: newFee.notes,
      }
      
      setFees(prev => [...prev, fee])
      toast.success('Fee record created')
      setFeeDialogOpen(false)
      setNewFee({
        studentId: '',
        feeType: 'tuition',
        amount: '',
        dueDate: '',
        notes: '',
      })
    } catch (error) {
      console.error('Error creating fee:', error)
      toast.error('Failed to create fee record')
    } finally {
      setSaving(false)
    }
  }

  // Create communication
  const createCommunication = async () => {
    if (!newCommunication.studentId || !newCommunication.subject || !newCommunication.content) {
      toast.error('Please fill all required fields')
      return
    }
    
    setSaving(true)
    try {
      const student = students.find(s => s.id === newCommunication.studentId)
      const comm: ParentCommunication = {
        id: `comm-${Date.now()}`,
        studentId: newCommunication.studentId,
        studentName: student ? `${student.firstName} ${student.lastName}` : '',
        type: newCommunication.type,
        subject: newCommunication.subject,
        content: newCommunication.content,
        direction: 'outgoing',
        createdAt: new Date().toISOString(),
        staffName: 'Staff Member',
        followUpRequired: newCommunication.followUpRequired,
        followUpDate: newCommunication.followUpDate,
      }
      
      setCommunications(prev => [...prev, comm])
      toast.success('Communication logged')
      setCommunicationDialogOpen(false)
      setNewCommunication({
        studentId: '',
        type: 'message',
        subject: '',
        content: '',
        followUpRequired: false,
        followUpDate: '',
      })
    } catch (error) {
      console.error('Error creating communication:', error)
      toast.error('Failed to log communication')
    } finally {
      setSaving(false)
    }
  }

  // Filtered data
  const filteredStudents = students.filter(student => {
    const matchesSearch = `${student.firstName} ${student.lastName}`.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.parentName.toLowerCase().includes(studentSearch.toLowerCase())
    const matchesFilter = studentFilter === 'all' || student.status === studentFilter
    return matchesSearch && matchesFilter
  })

  const filteredFees = fees.filter(fee => {
    const matchesSearch = fee.studentName.toLowerCase().includes(feeSearch.toLowerCase())
    const matchesFilter = feeFilter === 'all' || fee.status === feeFilter
    return matchesSearch && matchesFilter
  })

  // Get classes list
  const classesList = [...new Set(students.map(s => s.className))].filter(c => c !== 'Unassigned')

  // Get age from DOB
  const getAge = (dob: string) => {
    const birth = new Date(dob)
    const today = new Date()
    let years = today.getFullYear() - birth.getFullYear()
    let months = today.getMonth() - birth.getMonth()
    if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
      years--
      months += 12
    }
    if (years === 0) return `${months} months`
    if (months === 0) return `${years} year${years > 1 ? 's' : ''}`
    return `${years}y ${months}m`
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#FAFAFA]">
        <Loader2 className="h-8 w-8 animate-spin text-[#00897B]" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
              <Baby className="h-5 w-5 text-[#00897B]" />
              Childcare & Education
            </h1>
            <p className="text-sm text-[#757575]">Student management, attendance, academics & daily activities</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-[#E0F2F1] rounded-lg">
              <GraduationCap className="h-5 w-5 text-[#00897B]" />
              <div>
                <p className="text-xs text-[#757575]">Active Students</p>
                <p className="text-lg font-bold text-[#00897B]">{stats.totalStudents}</p>
              </div>
            </div>
            
            <Button variant="outline" size="sm" onClick={fetchAllData}>
              <RefreshCw className="h-4 w-4 mr-1" />Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-10 gap-2">
          <div className="bg-[#E0F2F1] rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-[#00897B]">{stats.totalStudents}</p>
            <p className="text-[10px] text-[#757575]">Enrolled</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-green-600">{stats.attendanceRate}%</p>
            <p className="text-[10px] text-[#757575]">Attendance</p>
          </div>
          <div className="bg-green-100 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-green-600">{stats.presentToday}</p>
            <p className="text-[10px] text-[#757575]">Present</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-amber-600">{stats.lateToday}</p>
            <p className="text-[10px] text-[#757575]">Late</p>
          </div>
          <div className="bg-red-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-red-600">{stats.absentToday}</p>
            <p className="text-[10px] text-[#757575]">Absent</p>
          </div>
          <div className="bg-emerald-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-emerald-600">R{stats.feesCollected.toLocaleString()}</p>
            <p className="text-[10px] text-[#757575]">Collected</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-orange-600">R{stats.outstandingFees.toLocaleString()}</p>
            <p className="text-[10px] text-[#757575]">Outstanding</p>
          </div>
          <div className="bg-red-100 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-red-600">{stats.overdueFees}</p>
            <p className="text-[10px] text-[#757575]">Overdue</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-purple-600">{milestones.length}</p>
            <p className="text-[10px] text-[#757575]">Milestones</p>
          </div>
          <div className="bg-cyan-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-cyan-600">{stats.upcomingEvents}</p>
            <p className="text-[10px] text-[#757575]">Events</p>
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
              <TabsTrigger value="students" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Users className="h-4 w-4 mr-1" />Students
              </TabsTrigger>
              <TabsTrigger value="attendance" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <ClipboardCheck className="h-4 w-4 mr-1" />Attendance
              </TabsTrigger>
              <TabsTrigger value="academic" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <BookOpen className="h-4 w-4 mr-1" />Academic
              </TabsTrigger>
              <TabsTrigger value="fees" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <DollarSign className="h-4 w-4 mr-1" />Fees
              </TabsTrigger>
              <TabsTrigger value="childcare" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Heart className="h-4 w-4 mr-1" />Daily Care
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 p-4">
            {/* Overview Tab */}
            <TabsContent value="overview" className="m-0">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Quick Stats Cards */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-5 w-5 text-[#00897B]" />
                      Student Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#757575]">Active Enrollment</span>
                        <span className="font-bold text-[#00897B]">{stats.totalStudents}</span>
                      </div>
                      <Progress value={(stats.totalStudents / 50) * 100} className="h-2" />
                      <p className="text-xs text-[#757575]">Capacity: {stats.totalStudents}/50 students</p>
                      
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="p-3 bg-pink-50 rounded-lg">
                          <p className="text-2xl font-bold text-pink-600">{students.filter(s => s.gender === 'female').length}</p>
                          <p className="text-xs text-[#757575]">Girls</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">{students.filter(s => s.gender === 'male').length}</p>
                          <p className="text-xs text-[#757575]">Boys</p>
                        </div>
                      </div>
                      
                      <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => setActiveTab('students')}>
                        View All Students <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Today's Attendance */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ClipboardCheck className="h-5 w-5 text-[#00897B]" />
                      Today&apos;s Attendance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#757575]">Attendance Rate</span>
                        <span className="font-bold text-green-600">{stats.attendanceRate}%</span>
                      </div>
                      <Progress value={stats.attendanceRate} className="h-2" />
                      
                      <div className="grid grid-cols-3 gap-2 mt-4">
                        <div className="p-3 bg-green-50 rounded-lg text-center">
                          <p className="text-xl font-bold text-green-600">{stats.presentToday}</p>
                          <p className="text-[10px] text-[#757575]">Present</p>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-lg text-center">
                          <p className="text-xl font-bold text-amber-600">{stats.lateToday}</p>
                          <p className="text-[10px] text-[#757575]">Late</p>
                        </div>
                        <div className="p-3 bg-red-50 rounded-lg text-center">
                          <p className="text-xl font-bold text-red-600">{stats.absentToday}</p>
                          <p className="text-[10px] text-[#757575]">Absent</p>
                        </div>
                      </div>
                      
                      <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => setActiveTab('attendance')}>
                        Mark Attendance <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Fee Collection */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-[#00897B]" />
                      Fee Collection
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#757575]">Collection Rate</span>
                        <span className="font-bold text-emerald-600">
                          {fees.length > 0 ? Math.round((stats.feesCollected / (stats.feesCollected + stats.outstandingFees)) * 100) : 0}%
                        </span>
                      </div>
                      <Progress value={fees.length > 0 ? (stats.feesCollected / (stats.feesCollected + stats.outstandingFees)) * 100 : 0} className="h-2" />
                      
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="p-3 bg-emerald-50 rounded-lg">
                          <p className="text-lg font-bold text-emerald-600">R{stats.feesCollected.toLocaleString()}</p>
                          <p className="text-xs text-[#757575]">Collected</p>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-lg">
                          <p className="text-lg font-bold text-orange-600">R{stats.outstandingFees.toLocaleString()}</p>
                          <p className="text-xs text-[#757575]">Outstanding</p>
                        </div>
                      </div>
                      
                      <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => setActiveTab('fees')}>
                        Manage Fees <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-[#00897B]" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        className="bg-[#00897B] hover:bg-[#00695C] h-auto py-3 flex-col cursor-pointer"
                        onClick={() => setStudentDialogOpen(true)}
                        type="button"
                      >
                        <Plus className="h-4 w-4 mb-1" />
                        Enroll Student
                      </Button>
                      <Button 
                        className="bg-[#00897B] hover:bg-[#00695C] h-auto py-3 flex-col cursor-pointer"
                        onClick={() => setActivityDialogOpen(true)}
                        type="button"
                      >
                        <Heart className="h-4 w-4 mb-1" />
                        Daily Log
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-auto py-3 flex-col cursor-pointer hover:bg-[#E0F2F1] hover:text-[#00897B] hover:border-[#00897B]" 
                        onClick={() => setActiveTab('attendance')}
                        type="button"
                      >
                        <ClipboardCheck className="h-4 w-4 mb-1" />
                        Attendance
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-auto py-3 flex-col cursor-pointer hover:bg-[#E0F2F1] hover:text-[#00897B] hover:border-[#00897B]" 
                        onClick={() => setActiveTab('fees')}
                        type="button"
                      >
                        <DollarSign className="h-4 w-4 mb-1" />
                        Fee Mgmt
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-auto py-3 flex-col cursor-pointer hover:bg-[#E0F2F1] hover:text-[#00897B] hover:border-[#00897B]" 
                        onClick={() => setCommunicationDialogOpen(true)}
                        type="button"
                      >
                        <MessageCircle className="h-4 w-4 mb-1" />
                        Parent
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-auto py-3 flex-col cursor-pointer hover:bg-[#E0F2F1] hover:text-[#00897B] hover:border-[#00897B]" 
                        onClick={() => setMilestoneDialogOpen(true)}
                        type="button"
                      >
                        <Award className="h-4 w-4 mb-1" />
                        Milestone
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Milestones */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Award className="h-5 w-5 text-[#00897B]" />
                      Recent Milestones
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {milestones.slice(0, 4).map(milestone => (
                        <div key={milestone.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{milestone.studentName}</p>
                            <p className="text-xs text-[#757575]">{milestone.name}</p>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-purple-100 text-purple-700 text-[10px]">
                              {milestoneCategoryLabels[milestone.category]}
                            </Badge>
                            <p className="text-[10px] text-[#757575] mt-1">{milestone.ageAtAchievement}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => setMilestoneDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-1" /> Add Milestone
                    </Button>
                  </CardContent>
                </Card>

                {/* Parent Communications */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-[#00897B]" />
                      Parent Communications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {communications.slice(0, 4).map(comm => (
                        <div key={comm.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{comm.studentName}</p>
                            <p className="text-xs text-[#757575] truncate">{comm.subject}</p>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <Badge className={`${comm.type === 'call' ? 'bg-blue-100 text-blue-700' : comm.type === 'meeting' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'} text-[10px]`}>
                              {comm.type}
                            </Badge>
                            {comm.followUpRequired && (
                              <AlertCircle className="h-3 w-3 text-amber-500" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => setCommunicationDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-1" /> Log Communication
                    </Button>
                  </CardContent>
                </Card>

                {/* Allergy Alerts */}
                <Card className="lg:col-span-3">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2 text-red-600">
                      <AlertTriangle className="h-5 w-5" />
                      Allergy & Medical Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {students.filter(s => s.allergies.length > 0 || s.medicalConditions.length > 0).map(student => (
                        <div key={student.id} className="p-3 bg-red-50 rounded-lg border border-red-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-red-100 text-red-700">
                                  {student.firstName[0]}{student.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm text-red-800">{student.firstName} {student.lastName}</p>
                                <p className="text-[10px] text-red-600">{student.className}</p>
                              </div>
                            </div>
                          </div>
                          {student.allergies.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-1">
                              {student.allergies.map(a => (
                                <Badge key={a} className="bg-red-100 text-red-700 text-[10px]">
                                  🚫 {a}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {student.medicalConditions.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {student.medicalConditions.map(m => (
                                <Badge key={m} className="bg-amber-100 text-amber-700 text-[10px]">
                                  ⚕️ {m}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      {students.filter(s => s.allergies.length > 0 || s.medicalConditions.length > 0).length === 0 && (
                        <div className="col-span-full text-center py-4 text-[#757575]">
                          <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                          <p>No allergy or medical alerts</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Students Tab */}
            <TabsContent value="students" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
                    <Input
                      placeholder="Search students..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                  <Select value={studentFilter} onValueChange={setStudentFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="graduated">Graduated</SelectItem>
                      <SelectItem value="transferred">Transferred</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setStudentDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />Enroll Student
                </Button>
              </div>
              
              <div className="bg-white rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Parent Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map(student => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={student.photoUrl} />
                              <AvatarFallback className={`${student.gender === 'female' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                                {student.firstName[0]}{student.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{student.firstName} {student.lastName}</p>
                              <div className="flex items-center gap-1">
                                {(student.allergies.length > 0 || student.medicalConditions.length > 0) && (
                                  <AlertTriangle className="h-3 w-3 text-red-500" />
                                )}
                                {student.allergies.slice(0, 2).map(a => (
                                  <Badge key={a} className="bg-red-50 text-red-600 text-[10px]">{a}</Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getAge(student.dateOfBirth)}</TableCell>
                        <TableCell>
                          <Badge className={`${gradeLevelColors[student.gradeLevel].bg} ${gradeLevelColors[student.gradeLevel].text}`}>
                            {gradeLevelLabels[student.gradeLevel]}
                          </Badge>
                        </TableCell>
                        <TableCell>{student.className}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{student.parentName}</p>
                            <p className="text-xs text-[#757575]">{student.parentPhone}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${studentStatusColors[student.status].bg} ${studentStatusColors[student.status].text}`}>
                            {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedStudent(student)
                                setStudentDetailOpen(true)
                              }}
                            >
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
              </div>
              
              {filteredStudents.length === 0 && (
                <div className="text-center py-12 text-[#757575]">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No students found</p>
                </div>
              )}
            </TabsContent>

            {/* Attendance Tab */}
            <TabsContent value="attendance" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {format(selectedDate, 'PPP')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {classesList.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-4 mr-4">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-xs text-[#757575]">Present ({stats.presentToday})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <span className="text-xs text-[#757575]">Late ({stats.lateToday})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="text-xs text-[#757575]">Absent ({stats.absentToday})</span>
                    </div>
                  </div>
                  
                  <Button className="bg-[#00897B] hover:bg-[#00695C]">
                    <Download className="h-4 w-4 mr-2" />Export Report
                  </Button>
                </div>
              </div>
              
              <div className="bg-white rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance
                      .filter(a => selectedClass === 'all' || students.find(s => s.id === a.studentId)?.className === selectedClass)
                      .map(record => {
                        const student = students.find(s => s.id === record.studentId)
                        return (
                          <TableRow key={record.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>
                                    {record.studentName.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{record.studentName}</span>
                              </div>
                            </TableCell>
                            <TableCell>{student?.className || '-'}</TableCell>
                            <TableCell>
                              <Badge className={`${attendanceStatusColors[record.status].bg} ${attendanceStatusColors[record.status].text}`}>
                                {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>{record.checkInTime || '-'}</TableCell>
                            <TableCell>{record.checkOutTime || '-'}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-green-600 hover:bg-green-50"
                                  onClick={() => updateAttendance(record.studentId, 'present')}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-amber-600 hover:bg-amber-50"
                                  onClick={() => updateAttendance(record.studentId, 'late')}
                                >
                                  <Clock className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-red-600 hover:bg-red-50"
                                  onClick={() => updateAttendance(record.studentId, 'absent')}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Academic Tab */}
            <TabsContent value="academic" className="m-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Academic Records */}
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-[#00897B]" />
                        Academic Records & Grades
                      </CardTitle>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-2" />Export Report Cards
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-white rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Term</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Grade</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead>Teacher</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {academicRecords.map(record => (
                            <TableRow key={record.id}>
                              <TableCell className="font-medium">{record.studentName}</TableCell>
                              <TableCell>{record.term}</TableCell>
                              <TableCell>{record.subject}</TableCell>
                              <TableCell>
                                <Badge className={`${
                                  record.grade?.startsWith('A') ? 'bg-green-100 text-green-700' :
                                  record.grade?.startsWith('B') ? 'bg-blue-100 text-blue-700' :
                                  record.grade?.startsWith('C') ? 'bg-amber-100 text-amber-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {record.grade}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {record.score !== undefined && record.maxScore && (
                                  <span>{record.score}/{record.maxScore}</span>
                                )}
                              </TableCell>
                              <TableCell>{record.teacherName}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Milestones */}
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Award className="h-5 w-5 text-[#00897B]" />
                        Developmental Milestones
                      </CardTitle>
                      <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setMilestoneDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />Add Milestone
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {milestones.map(milestone => (
                        <div key={milestone.id} className="p-3 bg-gray-50 rounded-lg border">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-sm">{milestone.studentName}</p>
                            <Badge className="bg-purple-100 text-purple-700 text-[10px]">
                              {milestoneCategoryLabels[milestone.category]}
                            </Badge>
                          </div>
                          <p className="font-medium text-[#00897B]">{milestone.name}</p>
                          <p className="text-xs text-[#757575] mt-1">{milestone.description}</p>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t">
                            <span className="text-xs text-[#757575]">Achieved: {milestone.achievedDate}</span>
                            <span className="text-xs font-medium text-purple-600">{milestone.ageAtAchievement}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Fees Tab */}
            <TabsContent value="fees" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
                    <Input
                      placeholder="Search by student name..."
                      value={feeSearch}
                      onChange={(e) => setFeeSearch(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                  <Select value={feeFilter} onValueChange={setFeeFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setFeeDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />Add Fee
                </Button>
              </div>

              {/* Fee Summary Cards */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[#757575]">Total Fees</p>
                        <p className="text-xl font-bold">R{(stats.feesCollected + stats.outstandingFees).toLocaleString()}</p>
                      </div>
                      <Wallet className="h-8 w-8 text-[#00897B] opacity-50" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[#757575]">Collected</p>
                        <p className="text-xl font-bold text-green-600">R{stats.feesCollected.toLocaleString()}</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[#757575]">Outstanding</p>
                        <p className="text-xl font-bold text-orange-600">R{stats.outstandingFees.toLocaleString()}</p>
                      </div>
                      <Clock className="h-8 w-8 text-orange-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[#757575]">Overdue</p>
                        <p className="text-xl font-bold text-red-600">{stats.overdueFees}</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-red-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="bg-white rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Fee Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFees.map(fee => (
                      <TableRow key={fee.id} className={fee.status === 'overdue' ? 'bg-red-50/50' : ''}>
                        <TableCell className="font-medium">{fee.studentName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{feeTypeLabels[fee.feeType]}</Badge>
                        </TableCell>
                        <TableCell>R{fee.amount.toLocaleString()}</TableCell>
                        <TableCell>{fee.dueDate}</TableCell>
                        <TableCell className="text-green-600">R{fee.paidAmount.toLocaleString()}</TableCell>
                        <TableCell className={fee.balance > 0 ? 'text-orange-600 font-medium' : ''}>
                          R{fee.balance.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${feeStatusColors[fee.status].bg} ${feeStatusColors[fee.status].text}`}>
                            {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {fee.status !== 'paid' && (
                              <Button variant="ghost" size="sm" className="text-green-600">
                                <CreditCard className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Receipt className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Childcare Daily Tab */}
            <TabsContent value="childcare" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {format(selectedDate, 'PPP')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setActivityDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />Add Daily Log
                </Button>
              </div>

              {/* Daily Activity Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {dailyActivities.map(activity => {
                  const MoodIcon = moodConfig[activity.mood].icon
                  return (
                    <Card key={activity.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-[#E0F2F1] text-[#00897B]">
                                {activity.studentName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-base">{activity.studentName}</CardTitle>
                              <p className="text-xs text-[#757575]">{activity.date}</p>
                            </div>
                          </div>
                          <Badge className={`${moodConfig[activity.mood].bg} ${moodConfig[activity.mood].text}`}>
                            <MoodIcon className="h-3 w-3 mr-1" />
                            {activity.mood.charAt(0).toUpperCase() + activity.mood.slice(1)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-3">
                          {/* Meals */}
                          <div className="p-2 bg-amber-50 rounded-lg">
                            <div className="flex items-center gap-1 mb-2">
                              <Utensils className="h-4 w-4 text-amber-600" />
                              <span className="text-xs font-medium text-amber-700">Meals</span>
                            </div>
                            <div className="space-y-1">
                              {activity.meals.map((meal, idx) => (
                                <div key={idx} className="text-[10px] text-amber-600">
                                  {meal.time} - {meal.type.replace('_', ' ')}: {meal.amount}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Naps */}
                          <div className="p-2 bg-indigo-50 rounded-lg">
                            <div className="flex items-center gap-1 mb-2">
                              <Moon className="h-4 w-4 text-indigo-600" />
                              <span className="text-xs font-medium text-indigo-700">Naps</span>
                            </div>
                            <div className="space-y-1">
                              {activity.naps.map((nap, idx) => (
                                <div key={idx} className="text-[10px] text-indigo-600">
                                  {nap.startTime} - {nap.endTime} ({nap.quality})
                                </div>
                              ))}
                              {activity.naps.length === 0 && (
                                <div className="text-[10px] text-indigo-400">No naps recorded</div>
                              )}
                            </div>
                          </div>

                          {/* Diapers/Toilet */}
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <div className="flex items-center gap-1 mb-2">
                              <Droplets className="h-4 w-4 text-blue-600" />
                              <span className="text-xs font-medium text-blue-700">Diapers/Toilet</span>
                            </div>
                            <div className="space-y-1">
                              {activity.diapers.map((diaper, idx) => (
                                <div key={idx} className="text-[10px] text-blue-600">
                                  {diaper.time} - {diaper.type}
                                </div>
                              ))}
                              {activity.diapers.length === 0 && (
                                <div className="text-[10px] text-blue-400">None recorded</div>
                              )}
                            </div>
                          </div>

                          {/* Activities */}
                          <div className="p-2 bg-green-50 rounded-lg">
                            <div className="flex items-center gap-1 mb-2">
                              <Activity className="h-4 w-4 text-green-600" />
                              <span className="text-xs font-medium text-green-700">Activities</span>
                            </div>
                            <div className="space-y-1">
                              {activity.activities.map((act, idx) => (
                                <div key={idx} className="text-[10px] text-green-600">
                                  {act.time} - {act.name} ({act.participation})
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {activity.notes && (
                          <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                            <p className="text-xs text-[#757575]">
                              <span className="font-medium">Notes:</span> {activity.notes}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Parent Communication Log */}
              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-[#00897B]" />
                      Parent Communication Log
                    </CardTitle>
                    <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setCommunicationDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />Log Communication
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {communications.map(comm => (
                      <div key={comm.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{comm.studentName}</span>
                            <Badge className={`${
                              comm.type === 'message' ? 'bg-gray-100 text-gray-700' :
                              comm.type === 'call' ? 'bg-blue-100 text-blue-700' :
                              comm.type === 'meeting' ? 'bg-purple-100 text-purple-700' :
                              'bg-amber-100 text-amber-700'
                            } text-[10px]`}>
                              {comm.type}
                            </Badge>
                            {comm.followUpRequired && (
                              <Badge className="bg-amber-100 text-amber-700 text-[10px]">
                                <Bell className="h-3 w-3 mr-1" />Follow-up
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium text-[#1A1A1A]">{comm.subject}</p>
                          <p className="text-xs text-[#757575] mt-1">{comm.content}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-[#757575]">{new Date(comm.createdAt).toLocaleDateString()}</p>
                          <p className="text-[10px] text-[#757575]">by {comm.staffName}</p>
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

      {/* Student Enrollment Dialog */}
      <Dialog open={studentDialogOpen} onOpenChange={setStudentDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-[#00897B]" />
              Enroll New Student
            </DialogTitle>
            <DialogDescription>
              Add a new student to the childcare center
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={newStudent.firstName}
                onChange={(e) => setNewStudent(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="Enter first name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={newStudent.lastName}
                onChange={(e) => setNewStudent(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Enter last name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={newStudent.dateOfBirth}
                onChange={(e) => setNewStudent(prev => ({ ...prev, dateOfBirth: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select 
                value={newStudent.gender} 
                onValueChange={(v) => setNewStudent(prev => ({ ...prev, gender: v as 'male' | 'female' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Grade Level</Label>
              <Select 
                value={newStudent.gradeLevel} 
                onValueChange={(v) => setNewStudent(prev => ({ ...prev, gradeLevel: v as GradeLevel }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(gradeLevelLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="className">Class Name</Label>
              <Input
                id="className"
                value={newStudent.className}
                onChange={(e) => setNewStudent(prev => ({ ...prev, className: e.target.value }))}
                placeholder="e.g., Butterflies, Stars"
              />
            </div>
            
            <Separator className="col-span-2" />
            
            <div className="space-y-2">
              <Label htmlFor="parentName">Parent/Guardian Name *</Label>
              <Input
                id="parentName"
                value={newStudent.parentName}
                onChange={(e) => setNewStudent(prev => ({ ...prev, parentName: e.target.value }))}
                placeholder="Enter parent/guardian name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parentPhone">Phone Number</Label>
              <Input
                id="parentPhone"
                value={newStudent.parentPhone}
                onChange={(e) => setNewStudent(prev => ({ ...prev, parentPhone: e.target.value }))}
                placeholder="+27 XX XXX XXXX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parentEmail">Email</Label>
              <Input
                id="parentEmail"
                type="email"
                value={newStudent.parentEmail}
                onChange={(e) => setNewStudent(prev => ({ ...prev, parentEmail: e.target.value }))}
                placeholder="parent@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyContact">Emergency Contact</Label>
              <Input
                id="emergencyContact"
                value={newStudent.emergencyContact}
                onChange={(e) => setNewStudent(prev => ({ ...prev, emergencyContact: e.target.value }))}
                placeholder="Name + Phone Number"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={newStudent.address}
                onChange={(e) => setNewStudent(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Street address, City"
              />
            </div>
            
            <Separator className="col-span-2" />
            
            <div className="space-y-2">
              <Label htmlFor="allergies">Allergies (comma separated)</Label>
              <Input
                id="allergies"
                value={newStudent.allergies}
                onChange={(e) => setNewStudent(prev => ({ ...prev, allergies: e.target.value }))}
                placeholder="e.g., Peanuts, Dairy"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="medicalConditions">Medical Conditions (comma separated)</Label>
              <Input
                id="medicalConditions"
                value={newStudent.medicalConditions}
                onChange={(e) => setNewStudent(prev => ({ ...prev, medicalConditions: e.target.value }))}
                placeholder="e.g., Asthma, Diabetes"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={newStudent.notes}
                onChange={(e) => setNewStudent(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional information..."
                rows={2}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setStudentDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={createStudent} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enroll Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Daily Activity Dialog */}
      <Dialog open={activityDialogOpen} onOpenChange={setActivityDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-[#00897B]" />
              Log Daily Activity
            </DialogTitle>
            <DialogDescription>
              Record daily care activities for a child
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Student</Label>
              <Select 
                value={newActivity.studentId} 
                onValueChange={(v) => setNewActivity(prev => ({ ...prev, studentId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.filter(s => s.status === 'active').map(student => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.firstName} {student.lastName} ({student.className})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Mood Today</Label>
              <div className="flex gap-2">
                {(['happy', 'neutral', 'sad', 'tired', 'sick'] as MoodType[]).map(mood => {
                  const Icon = moodConfig[mood].icon
                  return (
                    <Button
                      key={mood}
                      type="button"
                      variant={newActivity.mood === mood ? 'default' : 'outline'}
                      className={`flex-1 ${newActivity.mood === mood ? 'bg-[#00897B] hover:bg-[#00695C]' : ''}`}
                      onClick={() => setNewActivity(prev => ({ ...prev, mood }))}
                    >
                      <Icon className="h-4 w-4 mr-1" />
                      {mood.charAt(0).toUpperCase() + mood.slice(1)}
                    </Button>
                  )
                })}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="activityNotes">Notes</Label>
              <Textarea
                id="activityNotes"
                value={newActivity.notes}
                onChange={(e) => setNewActivity(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Notes about the day's activities..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivityDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={createActivity} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Activity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Milestone Dialog */}
      <Dialog open={milestoneDialogOpen} onOpenChange={setMilestoneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-[#00897B]" />
              Record Milestone
            </DialogTitle>
            <DialogDescription>
              Document a developmental milestone achievement
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Student</Label>
              <Select 
                value={newMilestone.studentId} 
                onValueChange={(v) => setNewMilestone(prev => ({ ...prev, studentId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.filter(s => s.status === 'active').map(student => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.firstName} {student.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Category</Label>
              <Select 
                value={newMilestone.category} 
                onValueChange={(v) => setNewMilestone(prev => ({ ...prev, category: v as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(milestoneCategoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="milestoneName">Milestone Name *</Label>
              <Input
                id="milestoneName"
                value={newMilestone.name}
                onChange={(e) => setNewMilestone(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., First steps, Says first word"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="milestoneDesc">Description</Label>
              <Textarea
                id="milestoneDesc"
                value={newMilestone.description}
                onChange={(e) => setNewMilestone(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the achievement..."
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="achievedDate">Date Achieved</Label>
              <Input
                id="achievedDate"
                type="date"
                value={newMilestone.achievedDate}
                onChange={(e) => setNewMilestone(prev => ({ ...prev, achievedDate: e.target.value }))}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setMilestoneDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={createMilestone} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Record Milestone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fee Dialog */}
      <Dialog open={feeDialogOpen} onOpenChange={setFeeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#00897B]" />
              Add Fee Record
            </DialogTitle>
            <DialogDescription>
              Create a new fee record for a student
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Student</Label>
              <Select 
                value={newFee.studentId} 
                onValueChange={(v) => setNewFee(prev => ({ ...prev, studentId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.filter(s => s.status === 'active').map(student => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.firstName} {student.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Fee Type</Label>
              <Select 
                value={newFee.feeType} 
                onValueChange={(v) => setNewFee(prev => ({ ...prev, feeType: v as FeeRecord['feeType'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(feeTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="feeAmount">Amount (R) *</Label>
              <Input
                id="feeAmount"
                type="number"
                value={newFee.amount}
                onChange={(e) => setNewFee(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="feeDueDate">Due Date</Label>
              <Input
                id="feeDueDate"
                type="date"
                value={newFee.dueDate}
                onChange={(e) => setNewFee(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="feeNotes">Notes</Label>
              <Input
                id="feeNotes"
                value={newFee.notes}
                onChange={(e) => setNewFee(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional notes..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeeDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={createFee} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Fee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Communication Dialog */}
      <Dialog open={communicationDialogOpen} onOpenChange={setCommunicationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-[#00897B]" />
              Log Parent Communication
            </DialogTitle>
            <DialogDescription>
              Record a communication with a parent/guardian
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Student</Label>
              <Select 
                value={newCommunication.studentId} 
                onValueChange={(v) => setNewCommunication(prev => ({ ...prev, studentId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.filter(s => s.status === 'active').map(student => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.firstName} {student.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Communication Type</Label>
              <Select 
                value={newCommunication.type} 
                onValueChange={(v) => setNewCommunication(prev => ({ ...prev, type: v as ParentCommunication['type'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="message">Message</SelectItem>
                  <SelectItem value="call">Phone Call</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="note">Note</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="commSubject">Subject *</Label>
              <Input
                id="commSubject"
                value={newCommunication.subject}
                onChange={(e) => setNewCommunication(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Brief subject..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="commContent">Content *</Label>
              <Textarea
                id="commContent"
                value={newCommunication.content}
                onChange={(e) => setNewCommunication(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Details of the communication..."
                rows={3}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Checkbox
                id="followUp"
                checked={newCommunication.followUpRequired}
                onCheckedChange={(checked) => setNewCommunication(prev => ({ 
                  ...prev, 
                  followUpRequired: checked as boolean 
                }))}
              />
              <Label htmlFor="followUp" className="text-sm">Follow-up required</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommunicationDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={createCommunication} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Log Communication
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student Detail Dialog */}
      <Dialog open={studentDetailOpen} onOpenChange={setStudentDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-[#00897B]" />
              Student Profile
            </DialogTitle>
          </DialogHeader>
          
          {selectedStudent && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className={`text-xl ${selectedStudent.gender === 'female' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                    {selectedStudent.firstName[0]}{selectedStudent.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold">{selectedStudent.firstName} {selectedStudent.lastName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`${gradeLevelColors[selectedStudent.gradeLevel].bg} ${gradeLevelColors[selectedStudent.gradeLevel].text}`}>
                      {gradeLevelLabels[selectedStudent.gradeLevel]}
                    </Badge>
                    <Badge className={`${studentStatusColors[selectedStudent.status].bg} ${studentStatusColors[selectedStudent.status].text}`}>
                      {selectedStudent.status}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                {/* Personal Info */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-[#757575]">Personal Information</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Cake className="h-4 w-4 text-[#757575]" />
                      <span>Age: {getAge(selectedStudent.dateOfBirth)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarIcon className="h-4 w-4 text-[#757575]" />
                      <span>DOB: {selectedStudent.dateOfBirth}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-[#757575]" />
                      <span>Class: {selectedStudent.className}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarIcon className="h-4 w-4 text-[#757575]" />
                      <span>Enrolled: {selectedStudent.enrollmentDate}</span>
                    </div>
                  </div>
                </div>
                
                {/* Parent Contact */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-[#757575]">Parent/Guardian</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-[#757575]" />
                      <span>{selectedStudent.parentName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-[#757575]" />
                      <span>{selectedStudent.parentPhone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-[#757575]" />
                      <span>{selectedStudent.parentEmail}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-[#757575]" />
                      <span>{selectedStudent.address}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Allergies & Medical */}
              {(selectedStudent.allergies.length > 0 || selectedStudent.medicalConditions.length > 0) && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <h4 className="font-medium text-sm text-red-700 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Medical Alerts
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedStudent.allergies.map(a => (
                      <Badge key={a} className="bg-red-100 text-red-700">
                        🚫 {a} allergy
                      </Badge>
                    ))}
                    {selectedStudent.medicalConditions.map(m => (
                      <Badge key={m} className="bg-amber-100 text-amber-700">
                        ⚕️ {m}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedStudent.notes && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-sm text-[#757575] mb-1">Notes</h4>
                  <p className="text-sm">{selectedStudent.notes}</p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setStudentDetailOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
