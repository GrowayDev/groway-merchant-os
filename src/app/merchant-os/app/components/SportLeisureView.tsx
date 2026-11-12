'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from 'sonner'
import {
  Dumbbell,
  Users,
  Calendar,
  Clock,
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  LogIn,
  LogOut,
  Key,
  DoorOpen,
  Timer,
  TrendingUp,
  TrendingDown,
  Activity,
  Heart,
  Zap,
  Target,
  Award,
  Star,
  Crown,
  Sparkles,
  Settings,
  Bell,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
  Download,
  Printer,
  Send,
  Phone,
  Mail,
  MapPin,
  User,
  Barcode,
  ShieldCheck,
  Ban,
  Snowflake,
  Play,
  Pause,
  Square,
  Building2,
  Car,
  Waves,
  Circle,
  Coffee,
  Wifi,
  Tv,
  CircleDot,
} from 'lucide-react'

// Types
type MembershipStatus = 'active' | 'expired' | 'frozen' | 'cancelled' | 'pending'
type MembershipTier = 'basic' | 'standard' | 'premium' | 'vip'
type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'failed' | 'refunded'
type AccessStatus = 'granted' | 'denied' | 'expired' | 'frozen'
type FacilityType = 'court' | 'pool' | 'studio' | 'gym' | 'field' | 'track'
type BookingStatus = 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'no_show'
type ClassStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'

interface Member {
  id: string
  name: string
  email: string
  phone: string
  avatar?: string
  membershipId: string
  membershipTier: MembershipTier
  membershipStatus: MembershipStatus
  joinDate: string
  expiryDate: string
  freezeStartDate?: string
  freezeEndDate?: string
  balance: number
  visits: number
  lastVisit?: string
  personalTrainer?: string
  emergencyContact: string
  emergencyPhone: string
  medicalNotes?: string
  createdAt: string
}

interface MembershipPlan {
  id: string
  name: string
  tier: MembershipTier
  price: number
  duration: number // months
  features: string[]
  maxFreezeDays: number
  guestPasses: number
  personalTrainingIncluded: number
  facilityAccess: string[]
  isActive: boolean
}

interface CheckIn {
  id: string
  memberId: string
  memberName: string
  membershipId: string
  membershipTier: MembershipTier
  timestamp: string
  type: 'check_in' | 'check_out'
  accessPoint: string
  status: AccessStatus
  photo?: string
  notes?: string
}

interface Class {
  id: string
  name: string
  instructor: string
  type: string
  capacity: number
  enrolled: number
  date: string
  startTime: string
  endTime: string
  duration: number
  studio: string
  status: ClassStatus
  level: 'beginner' | 'intermediate' | 'advanced' | 'all'
  price: number
  waitlist: number
}

interface ClassBooking {
  id: string
  classId: string
  className: string
  memberId: string
  memberName: string
  status: BookingStatus
  bookedAt: string
  attended?: boolean
}

interface Facility {
  id: string
  name: string
  type: FacilityType
  capacity: number
  status: 'available' | 'occupied' | 'maintenance' | 'reserved'
  hourlyRate: number
  amenities: string[]
  openingHours: { open: string; close: string }
  rules?: string
}

interface FacilityBooking {
  id: string
  facilityId: string
  facilityName: string
  memberId: string
  memberName: string
  date: string
  startTime: string
  endTime: string
  duration: number
  totalAmount: number
  status: BookingStatus
  paymentStatus: PaymentStatus
  notes?: string
}

interface Invoice {
  id: string
  memberId: string
  memberName: string
  membershipId: string
  amount: number
  tax: number
  total: number
  dueDate: string
  paidDate?: string
  status: PaymentStatus
  items: { description: string; amount: number }[]
  paymentMethod?: string
}

interface PTSession {
  id: string
  memberId: string
  memberName: string
  trainerId: string
  trainerName: string
  date: string
  time: string
  duration: number
  type: 'single' | 'package'
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  notes?: string
}

interface GuestPass {
  id: string
  memberId: string
  memberName: string
  guestName: string
  guestPhone: string
  issuedDate: string
  expiryDate: string
  used: boolean
  usedDate?: string
}

// Sample data generators
const generateMembers = (): Member[] => [
  { id: 'M001', name: 'John Smith', email: 'john.smith@email.com', phone: '+27 82 123 4567', membershipId: 'GYM-2024-001', membershipTier: 'premium', membershipStatus: 'active', joinDate: '2024-01-15', expiryDate: '2025-01-15', balance: 0, visits: 87, lastVisit: '2026-04-10', personalTrainer: 'Sarah Johnson', emergencyContact: 'Jane Smith', emergencyPhone: '+27 83 234 5678', medicalNotes: 'Knee injury - avoid high impact', createdAt: '2024-01-15' },
  { id: 'M002', name: 'Emily Davis', email: 'emily.d@email.com', phone: '+27 84 345 6789', membershipId: 'GYM-2024-002', membershipTier: 'vip', membershipStatus: 'active', joinDate: '2023-06-01', expiryDate: '2025-06-01', balance: -250, visits: 156, lastVisit: '2026-04-12', personalTrainer: 'Mike Brown', emergencyContact: 'Robert Davis', emergencyPhone: '+27 85 456 7890', createdAt: '2023-06-01' },
  { id: 'M003', name: 'Michael Johnson', email: 'm.johnson@email.com', phone: '+27 86 567 8901', membershipId: 'GYM-2024-003', membershipTier: 'standard', membershipStatus: 'frozen', joinDate: '2024-03-20', expiryDate: '2025-03-20', freezeStartDate: '2026-03-01', freezeEndDate: '2026-05-01', balance: 0, visits: 45, lastVisit: '2026-02-28', emergencyContact: 'Lisa Johnson', emergencyPhone: '+27 87 678 9012', createdAt: '2024-03-20' },
  { id: 'M004', name: 'Sarah Williams', email: 'sarah.w@email.com', phone: '+27 88 789 0123', membershipId: 'GYM-2024-004', membershipTier: 'basic', membershipStatus: 'expired', joinDate: '2024-08-10', expiryDate: '2026-02-10', balance: 450, visits: 23, lastVisit: '2026-01-15', emergencyContact: 'Tom Williams', emergencyPhone: '+27 89 890 1234', createdAt: '2024-08-10' },
  { id: 'M005', name: 'David Brown', email: 'd.brown@email.com', phone: '+27 90 901 2345', membershipId: 'GYM-2025-001', membershipTier: 'premium', membershipStatus: 'active', joinDate: '2025-01-05', expiryDate: '2026-01-05', balance: 0, visits: 67, lastVisit: '2026-04-11', emergencyContact: 'Mary Brown', emergencyPhone: '+27 91 012 3456', createdAt: '2025-01-05' },
  { id: 'M006', name: 'Lisa Anderson', email: 'lisa.a@email.com', phone: '+27 92 123 4567', membershipId: 'GYM-2025-002', membershipTier: 'vip', membershipStatus: 'active', joinDate: '2024-11-15', expiryDate: '2025-11-15', balance: 0, visits: 89, lastVisit: '2026-04-12', personalTrainer: 'Sarah Johnson', emergencyContact: 'Peter Anderson', emergencyPhone: '+27 93 234 5678', createdAt: '2024-11-15' },
  { id: 'M007', name: 'James Wilson', email: 'j.wilson@email.com', phone: '+27 94 234 5678', membershipId: 'GYM-2025-003', membershipTier: 'standard', membershipStatus: 'active', joinDate: '2025-02-01', expiryDate: '2026-02-01', balance: -120, visits: 34, lastVisit: '2026-04-09', emergencyContact: 'Anna Wilson', emergencyPhone: '+27 95 345 6789', createdAt: '2025-02-01' },
  { id: 'M008', name: 'Amanda Lee', email: 'amanda.lee@email.com', phone: '+27 96 345 6789', membershipId: 'GYM-2025-004', membershipTier: 'premium', membershipStatus: 'pending', joinDate: '2026-04-12', expiryDate: '2027-04-12', balance: 999, visits: 0, emergencyContact: 'Kevin Lee', emergencyPhone: '+27 97 456 7890', createdAt: '2026-04-12' },
]

const generateMembershipPlans = (): MembershipPlan[] => [
  { id: 'P001', name: 'Basic', tier: 'basic', price: 299, duration: 1, features: ['Gym floor access', 'Locker room', 'Basic equipment'], maxFreezeDays: 14, guestPasses: 0, personalTrainingIncluded: 0, facilityAccess: ['gym'], isActive: true },
  { id: 'P002', name: 'Standard', tier: 'standard', price: 499, duration: 1, features: ['Full gym access', 'Group classes', 'Locker room', 'Sauna access'], maxFreezeDays: 30, guestPasses: 2, personalTrainingIncluded: 1, facilityAccess: ['gym', 'studio', 'pool'], isActive: true },
  { id: 'P003', name: 'Premium', tier: 'premium', price: 799, duration: 1, features: ['Full facility access', 'All classes', 'Priority booking', 'Towel service', 'Nutrition consultation'], maxFreezeDays: 45, guestPasses: 5, personalTrainingIncluded: 4, facilityAccess: ['gym', 'studio', 'pool', 'court'], isActive: true },
  { id: 'P004', name: 'VIP', tier: 'vip', price: 1499, duration: 1, features: ['Unlimited access', 'Personal trainer (monthly)', 'VIP lounge', 'Free parking', 'Premium locker', 'Spa access', 'Guest passes unlimited'], maxFreezeDays: 60, guestPasses: 99, personalTrainingIncluded: 8, facilityAccess: ['all'], isActive: true },
]

const generateCheckIns = (): CheckIn[] => [
  { id: 'C001', memberId: 'M001', memberName: 'John Smith', membershipId: 'GYM-2024-001', membershipTier: 'premium', timestamp: '2026-04-12 06:15:00', type: 'check_in', accessPoint: 'Main Entrance', status: 'granted' },
  { id: 'C002', memberId: 'M002', memberName: 'Emily Davis', membershipId: 'GYM-2024-002', membershipTier: 'vip', timestamp: '2026-04-12 06:30:00', type: 'check_in', accessPoint: 'Main Entrance', status: 'granted' },
  { id: 'C003', memberId: 'M005', memberName: 'David Brown', membershipId: 'GYM-2025-001', membershipTier: 'premium', timestamp: '2026-04-12 07:00:00', type: 'check_in', accessPoint: 'Main Entrance', status: 'granted' },
  { id: 'C004', memberId: 'M004', memberName: 'Sarah Williams', membershipId: 'GYM-2024-004', membershipTier: 'basic', timestamp: '2026-04-12 07:15:00', type: 'check_in', accessPoint: 'Main Entrance', status: 'denied' },
  { id: 'C005', memberId: 'M006', memberName: 'Lisa Anderson', membershipId: 'GYM-2025-002', membershipTier: 'vip', timestamp: '2026-04-12 07:45:00', type: 'check_in', accessPoint: 'VIP Entrance', status: 'granted' },
  { id: 'C006', memberId: 'M001', memberName: 'John Smith', membershipId: 'GYM-2024-001', membershipTier: 'premium', timestamp: '2026-04-12 08:00:00', type: 'check_out', accessPoint: 'Main Exit', status: 'granted' },
  { id: 'C007', memberId: 'M007', memberName: 'James Wilson', membershipId: 'GYM-2025-003', membershipTier: 'standard', timestamp: '2026-04-12 08:15:00', type: 'check_in', accessPoint: 'Main Entrance', status: 'granted' },
  { id: 'C008', memberId: 'M003', memberName: 'Michael Johnson', membershipId: 'GYM-2024-003', membershipTier: 'standard', timestamp: '2026-04-12 08:30:00', type: 'check_in', accessPoint: 'Main Entrance', status: 'frozen' },
]

const generateClasses = (): Class[] => [
  { id: 'CL001', name: 'Morning Yoga', instructor: 'Sarah Johnson', type: 'Yoga', capacity: 25, enrolled: 22, date: '2026-04-12', startTime: '06:00', endTime: '07:00', duration: 60, studio: 'Studio A', status: 'scheduled', level: 'all', price: 0, waitlist: 3 },
  { id: 'CL002', name: 'HIIT Bootcamp', instructor: 'Mike Brown', type: 'HIIT', capacity: 20, enrolled: 20, date: '2026-04-12', startTime: '07:00', endTime: '07:45', duration: 45, studio: 'Studio B', status: 'scheduled', level: 'intermediate', price: 0, waitlist: 5 },
  { id: 'CL003', name: 'Spinning Class', instructor: 'Jessica Lee', type: 'Cycling', capacity: 15, enrolled: 12, date: '2026-04-12', startTime: '08:00', endTime: '09:00', duration: 60, studio: 'Spin Room', status: 'scheduled', level: 'all', price: 0, waitlist: 0 },
  { id: 'CL004', name: 'Pilates', instructor: 'Emma Davis', type: 'Pilates', capacity: 18, enrolled: 16, date: '2026-04-12', startTime: '09:00', endTime: '10:00', duration: 60, studio: 'Studio A', status: 'scheduled', level: 'beginner', price: 0, waitlist: 2 },
  { id: 'CL005', name: 'CrossFit WOD', instructor: 'James Wilson', type: 'CrossFit', capacity: 12, enrolled: 12, date: '2026-04-12', startTime: '10:00', endTime: '11:00', duration: 60, studio: 'CrossFit Box', status: 'scheduled', level: 'advanced', price: 50, waitlist: 4 },
  { id: 'CL006', name: 'Zumba', instructor: 'Maria Garcia', type: 'Dance', capacity: 30, enrolled: 25, date: '2026-04-12', startTime: '17:00', endTime: '18:00', duration: 60, studio: 'Studio B', status: 'scheduled', level: 'all', price: 0, waitlist: 0 },
  { id: 'CL007', name: 'Boxing Basics', instructor: 'Champion Mike', type: 'Boxing', capacity: 10, enrolled: 8, date: '2026-04-12', startTime: '18:00', endTime: '19:00', duration: 60, studio: 'Boxing Ring', status: 'scheduled', level: 'beginner', price: 75, waitlist: 0 },
  { id: 'CL008', name: 'Aqua Aerobics', instructor: 'Lisa Thompson', type: 'Aquatics', capacity: 20, enrolled: 18, date: '2026-04-12', startTime: '19:00', endTime: '20:00', duration: 60, studio: 'Main Pool', status: 'scheduled', level: 'all', price: 0, waitlist: 1 },
]

const generateFacilities = (): Facility[] => [
  { id: 'F001', name: 'Basketball Court 1', type: 'court', capacity: 20, status: 'available', hourlyRate: 150, amenities: ['Basketball Hoops', 'Scoreboard', 'Bleachers'], openingHours: { open: '06:00', close: '22:00' }, rules: 'Court shoes required. No food or drinks on court.' },
  { id: 'F002', name: 'Basketball Court 2', type: 'court', capacity: 20, status: 'occupied', hourlyRate: 150, amenities: ['Basketball Hoops', 'Scoreboard', 'Bleachers'], openingHours: { open: '06:00', close: '22:00' } },
  { id: 'F003', name: 'Tennis Court 1', type: 'court', capacity: 4, status: 'available', hourlyRate: 100, amenities: ['Net', 'Lights', 'Seating'], openingHours: { open: '06:00', close: '21:00' } },
  { id: 'F004', name: 'Tennis Court 2', type: 'court', capacity: 4, status: 'maintenance', hourlyRate: 100, amenities: ['Net', 'Lights', 'Seating'], openingHours: { open: '06:00', close: '21:00' }, rules: 'Surface resurfacing in progress.' },
  { id: 'F005', name: 'Main Pool', type: 'pool', capacity: 50, status: 'available', hourlyRate: 0, amenities: ['Lanes', 'Diving Board', 'Kids Area', 'Lifeguard'], openingHours: { open: '05:30', close: '21:00' } },
  { id: 'F006', name: 'Lap Pool', type: 'pool', capacity: 20, status: 'available', hourlyRate: 0, amenities: ['8 Lanes', 'Temperature Controlled'], openingHours: { open: '05:30', close: '21:00' } },
  { id: 'F007', name: 'Studio A', type: 'studio', capacity: 30, status: 'occupied', hourlyRate: 200, amenities: ['Mirrors', 'Sound System', 'AC', 'Wood Floor'], openingHours: { open: '06:00', close: '22:00' } },
  { id: 'F008', name: 'Studio B', type: 'studio', capacity: 25, status: 'available', hourlyRate: 200, amenities: ['Mirrors', 'Sound System', 'AC', 'Wood Floor'], openingHours: { open: '06:00', close: '22:00' } },
  { id: 'F009', name: 'Soccer Field', type: 'field', capacity: 30, status: 'available', hourlyRate: 300, amenities: ['Goals', 'Lights', 'Artificial Turf'], openingHours: { open: '07:00', close: '22:00' } },
  { id: 'F010', name: 'Running Track', type: 'track', capacity: 100, status: 'available', hourlyRate: 0, amenities: ['400m Track', 'Lane Markings', 'Timing System'], openingHours: { open: '05:00', close: '22:00' } },
]

const generateFacilityBookings = (): FacilityBooking[] => [
  { id: 'FB001', facilityId: 'F002', facilityName: 'Basketball Court 2', memberId: 'M001', memberName: 'John Smith', date: '2026-04-12', startTime: '10:00', endTime: '12:00', duration: 2, totalAmount: 300, status: 'confirmed', paymentStatus: 'paid' },
  { id: 'FB002', facilityId: 'F003', facilityName: 'Tennis Court 1', memberId: 'M006', memberName: 'Lisa Anderson', date: '2026-04-12', startTime: '14:00', endTime: '16:00', duration: 2, totalAmount: 200, status: 'confirmed', paymentStatus: 'paid' },
  { id: 'FB003', facilityId: 'F009', facilityName: 'Soccer Field', memberId: 'M005', memberName: 'David Brown', date: '2026-04-13', startTime: '09:00', endTime: '11:00', duration: 2, totalAmount: 600, status: 'pending', paymentStatus: 'pending' },
  { id: 'FB004', facilityId: 'F007', facilityName: 'Studio A', memberId: 'M002', memberName: 'Emily Davis', date: '2026-04-12', startTime: '15:00', endTime: '17:00', duration: 2, totalAmount: 400, status: 'confirmed', paymentStatus: 'paid' },
]

const generateInvoices = (): Invoice[] => [
  { id: 'INV001', memberId: 'M001', memberName: 'John Smith', membershipId: 'GYM-2024-001', amount: 799, tax: 119.85, total: 918.85, dueDate: '2026-04-05', paidDate: '2026-04-03', status: 'paid', items: [{ description: 'Premium Membership - April 2026', amount: 799 }], paymentMethod: 'Credit Card' },
  { id: 'INV002', memberId: 'M002', memberName: 'Emily Davis', membershipId: 'GYM-2024-002', amount: 1499, tax: 224.85, total: 1723.85, dueDate: '2026-04-05', paidDate: '2026-04-01', status: 'paid', items: [{ description: 'VIP Membership - April 2026', amount: 1499 }], paymentMethod: 'Debit Order' },
  { id: 'INV003', memberId: 'M004', memberName: 'Sarah Williams', membershipId: 'GYM-2024-004', amount: 299, tax: 44.85, total: 343.85, dueDate: '2026-03-05', status: 'overdue', items: [{ description: 'Basic Membership - March 2026', amount: 299 }] },
  { id: 'INV004', memberId: 'M007', memberName: 'James Wilson', membershipId: 'GYM-2025-003', amount: 499, tax: 74.85, total: 573.85, dueDate: '2026-04-15', status: 'pending', items: [{ description: 'Standard Membership - April 2026', amount: 499 }] },
  { id: 'INV005', memberId: 'M008', memberName: 'Amanda Lee', membershipId: 'GYM-2025-004', amount: 799, tax: 119.85, total: 918.85, dueDate: '2026-04-20', status: 'pending', items: [{ description: 'Premium Membership - First Month', amount: 799 }, { description: 'Joining Fee', amount: 0 }] },
]

const generatePTSessions = (): PTSession[] => [
  { id: 'PT001', memberId: 'M001', memberName: 'John Smith', trainerId: 'T001', trainerName: 'Sarah Johnson', date: '2026-04-12', time: '09:00', duration: 60, type: 'package', status: 'scheduled', notes: 'Focus on upper body strength' },
  { id: 'PT002', memberId: 'M002', memberName: 'Emily Davis', trainerId: 'T002', trainerName: 'Mike Brown', date: '2026-04-12', time: '10:00', duration: 60, type: 'package', status: 'scheduled', notes: 'Weight loss program - Week 8' },
  { id: 'PT003', memberId: 'M006', memberName: 'Lisa Anderson', trainerId: 'T001', trainerName: 'Sarah Johnson', date: '2026-04-12', time: '14:00', duration: 60, type: 'single', status: 'scheduled' },
  { id: 'PT004', memberId: 'M001', memberName: 'John Smith', trainerId: 'T001', trainerName: 'Sarah Johnson', date: '2026-04-11', time: '09:00', duration: 60, type: 'package', status: 'completed' },
  { id: 'PT005', memberId: 'M005', memberName: 'David Brown', trainerId: 'T002', trainerName: 'Mike Brown', date: '2026-04-13', time: '11:00', duration: 60, type: 'single', status: 'scheduled' },
]

const generateGuestPasses = (): GuestPass[] => [
  { id: 'GP001', memberId: 'M002', memberName: 'Emily Davis', guestName: 'Tom Harris', guestPhone: '+27 82 111 2222', issuedDate: '2026-04-10', expiryDate: '2026-04-17', used: false },
  { id: 'GP002', memberId: 'M006', memberName: 'Lisa Anderson', guestName: 'Rachel Green', guestPhone: '+27 83 333 4444', issuedDate: '2026-04-11', expiryDate: '2026-04-18', used: false },
  { id: 'GP003', memberId: 'M001', memberName: 'John Smith', guestName: 'Mike Chen', guestPhone: '+27 84 555 6666', issuedDate: '2026-04-05', expiryDate: '2026-04-12', used: true, usedDate: '2026-04-06' },
]

// Utility functions
const formatCurrency = (amount: number) => `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })
}

const formatDateTime = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const getTierColor = (tier: MembershipTier) => {
  switch (tier) {
    case 'basic': return 'bg-gray-100 text-gray-700'
    case 'standard': return 'bg-blue-100 text-blue-700'
    case 'premium': return 'bg-purple-100 text-purple-700'
    case 'vip': return 'bg-yellow-100 text-yellow-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': case 'paid': case 'granted': case 'available': case 'confirmed': case 'completed': return 'bg-green-100 text-green-700'
    case 'expired': case 'overdue': case 'denied': case 'cancelled': return 'bg-red-100 text-red-700'
    case 'frozen': return 'bg-blue-100 text-blue-700'
    case 'pending': case 'scheduled': return 'bg-amber-100 text-amber-700'
    case 'maintenance': case 'occupied': case 'in_progress': return 'bg-purple-100 text-purple-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

const getTierIcon = (tier: MembershipTier) => {
  switch (tier) {
    case 'basic': return User
    case 'standard': return Star
    case 'premium': return Crown
    case 'vip': return Sparkles
    default: return User
  }
}

const getFacilityIcon = (type: FacilityType) => {
  switch (type) {
    case 'court': return Circle
    case 'pool': return Waves
    case 'studio': return Activity
    case 'gym': return Dumbbell
    case 'field': return Target
    case 'track': return Timer
    default: return Building2
  }
}

export function SportLeisureView() {
  // State
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(false)
  
  // Data
  const [members, setMembers] = useState<Member[]>(generateMembers)
  const [membershipPlans] = useState<MembershipPlan[]>(generateMembershipPlans)
  const [checkIns] = useState<CheckIn[]>(generateCheckIns)
  const [classes, setClasses] = useState<Class[]>(generateClasses)
  const [facilities] = useState<Facility[]>(generateFacilities)
  const [facilityBookings, setFacilityBookings] = useState<FacilityBooking[]>(generateFacilityBookings)
  const [invoices] = useState<Invoice[]>(generateInvoices)
  const [ptSessions, setPtSessions] = useState<PTSession[]>(generatePTSessions)
  const [guestPasses, setGuestPasses] = useState<GuestPass[]>(generateGuestPasses)
  
  // Dialog states
  const [memberDialogOpen, setMemberDialogOpen] = useState(false)
  const [memberDetailOpen, setMemberDetailOpen] = useState(false)
  const [freezeDialogOpen, setFreezeDialogOpen] = useState(false)
  const [classBookingDialogOpen, setClassBookingDialogOpen] = useState(false)
  const [facilityBookingDialogOpen, setFacilityBookingDialogOpen] = useState(false)
  const [guestPassDialogOpen, setGuestPassDialogOpen] = useState(false)
  const [ptSessionDialogOpen, setPtSessionDialogOpen] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  
  // Selected items
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null)
  
  // Forms
  const [newMember, setNewMember] = useState({
    name: '', email: '', phone: '', membershipTier: 'basic' as MembershipTier,
    emergencyContact: '', emergencyPhone: '', medicalNotes: ''
  })
  const [freezeForm, setFreezeForm] = useState({ startDate: '', endDate: '', reason: '' })
  const [newGuestPass, setNewGuestPass] = useState({ guestName: '', guestPhone: '' })
  const [newPTSession, setNewPTSession] = useState({ date: '', time: '', duration: 60, notes: '' })
  
  // Search/filter
  const [memberSearch, setMemberSearch] = useState('')
  const [memberFilter, setMemberFilter] = useState('all')
  const [classSearch, setClassSearch] = useState('')
  const [facilityFilter, setFacilityFilter] = useState('all')
  
  // Stats
  const stats = useMemo(() => {
    const activeMembers = members.filter(m => m.membershipStatus === 'active').length
    const frozenMembers = members.filter(m => m.membershipStatus === 'frozen').length
    const expiredMembers = members.filter(m => m.membershipStatus === 'expired').length
    const pendingMembers = members.filter(m => m.membershipStatus === 'pending').length
    
    const todayCheckIns = checkIns.filter(c => c.timestamp.startsWith('2026-04-12') && c.type === 'check_in')
    const grantedAccess = todayCheckIns.filter(c => c.status === 'granted').length
    const deniedAccess = todayCheckIns.filter(c => c.status !== 'granted').length
    
    const currentlyIn = todayCheckIns.filter(c => c.status === 'granted').length -
      checkIns.filter(c => c.timestamp.startsWith('2026-04-12') && c.type === 'check_out').length
    
    const scheduledClasses = classes.filter(c => c.status === 'scheduled').length
    const totalEnrolled = classes.reduce((sum, c) => sum + c.enrolled, 0)
    const avgOccupancy = Math.round((totalEnrolled / classes.reduce((sum, c) => sum + c.capacity, 0)) * 100)
    
    const availableFacilities = facilities.filter(f => f.status === 'available').length
    const occupiedFacilities = facilities.filter(f => f.status === 'occupied').length
    
    const paidInvoices = invoices.filter(i => i.status === 'paid').length
    const pendingInvoices = invoices.filter(i => i.status === 'pending' || i.status === 'overdue').length
    const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0)
    const outstandingAmount = invoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + i.total, 0)
    
    const upcomingPTS = ptSessions.filter(p => p.status === 'scheduled').length
    
    return {
      totalMembers: members.length,
      activeMembers,
      frozenMembers,
      expiredMembers,
      pendingMembers,
      todayCheckIns: todayCheckIns.length,
      grantedAccess,
      deniedAccess,
      currentlyIn: Math.max(0, currentlyIn),
      scheduledClasses,
      totalEnrolled,
      avgOccupancy,
      availableFacilities,
      occupiedFacilities,
      totalFacilities: facilities.length,
      paidInvoices,
      pendingInvoices,
      totalRevenue,
      outstandingAmount,
      upcomingPTS,
      activeGuestPasses: guestPasses.filter(g => !g.used && new Date(g.expiryDate) >= new Date()).length,
    }
  }, [members, checkIns, classes, facilities, invoices, ptSessions, guestPasses])
  
  // Filtered data
  const filteredMembers = useMemo(() => members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.email.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.membershipId.toLowerCase().includes(memberSearch.toLowerCase())
    const matchesFilter = memberFilter === 'all' || m.membershipStatus === memberFilter
    return matchesSearch && matchesFilter
  }), [members, memberSearch, memberFilter])
  
  const filteredClasses = useMemo(() => classes.filter(c => {
    return c.name.toLowerCase().includes(classSearch.toLowerCase()) ||
      c.instructor.toLowerCase().includes(classSearch.toLowerCase()) ||
      c.type.toLowerCase().includes(classSearch.toLowerCase())
  }), [classes, classSearch])
  
  const filteredFacilities = useMemo(() => facilities.filter(f => {
    return facilityFilter === 'all' || f.type === facilityFilter
  }), [facilities, facilityFilter])
  
  // Handlers
  const handleAddMember = () => {
    if (!newMember.name || !newMember.email || !newMember.phone) {
      toast.error('Please fill all required fields')
      return
    }
    
    const plan = membershipPlans.find(p => p.tier === newMember.membershipTier)
    const member: Member = {
      id: `M${String(members.length + 1).padStart(3, '0')}`,
      ...newMember,
      membershipId: `GYM-2026-${String(members.length + 1).padStart(3, '0')}`,
      membershipStatus: 'pending',
      joinDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + (plan?.duration || 1) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      balance: plan?.price || 0,
      visits: 0,
      createdAt: new Date().toISOString(),
    }
    
    setMembers([member, ...members])
    setMemberDialogOpen(false)
    setNewMember({ name: '', email: '', phone: '', membershipTier: 'basic', emergencyContact: '', emergencyPhone: '', medicalNotes: '' })
    toast.success('Member added successfully')
  }
  
  const handleFreezeMembership = () => {
    if (!selectedMember || !freezeForm.startDate || !freezeForm.endDate) {
      toast.error('Please fill all fields')
      return
    }
    
    setMembers(members.map(m => m.id === selectedMember.id ? {
      ...m,
      membershipStatus: 'frozen',
      freezeStartDate: freezeForm.startDate,
      freezeEndDate: freezeForm.endDate,
    } : m))
    
    setFreezeDialogOpen(false)
    setFreezeForm({ startDate: '', endDate: '', reason: '' })
    toast.success('Membership frozen successfully')
  }
  
  const handleUnfreezeMembership = (member: Member) => {
    setMembers(members.map(m => m.id === member.id ? {
      ...m,
      membershipStatus: 'active',
      freezeStartDate: undefined,
      freezeEndDate: undefined,
    } : m))
    toast.success('Membership unfrozen successfully')
  }
  
  const handleBookClass = () => {
    if (!selectedClass) return
    
    if (selectedClass.enrolled >= selectedClass.capacity) {
      toast.error('Class is full')
      return
    }
    
    setClasses(classes.map(c => c.id === selectedClass.id ? {
      ...c,
      enrolled: c.enrolled + 1,
    } : c))
    
    setClassBookingDialogOpen(false)
    toast.success('Booked into class successfully')
  }
  
  const handleIssueGuestPass = () => {
    if (!selectedMember || !newGuestPass.guestName || !newGuestPass.guestPhone) {
      toast.error('Please fill all fields')
      return
    }
    
    const pass: GuestPass = {
      id: `GP${String(guestPasses.length + 1).padStart(3, '0')}`,
      memberId: selectedMember.id,
      memberName: selectedMember.name,
      guestName: newGuestPass.guestName,
      guestPhone: newGuestPass.guestPhone,
      issuedDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      used: false,
    }
    
    setGuestPasses([pass, ...guestPasses])
    setGuestPassDialogOpen(false)
    setNewGuestPass({ guestName: '', guestPhone: '' })
    toast.success('Guest pass issued successfully')
  }
  
  // Render Dashboard
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="bg-[#E0F2F1]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#00897B]" />
              <span className="text-sm text-[#757575]">Active Members</span>
            </div>
            <p className="text-2xl font-bold text-[#00897B] mt-1">{stats.activeMembers}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <LogIn className="h-5 w-5 text-green-600" />
              <span className="text-sm text-[#757575]">Today Check-ins</span>
            </div>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.todayCheckIns}</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-[#757575]">Currently In</span>
            </div>
            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.currentlyIn}</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <span className="text-sm text-[#757575]">Classes Today</span>
            </div>
            <p className="text-2xl font-bold text-purple-600 mt-1">{stats.scheduledClasses}</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DoorOpen className="h-5 w-5 text-amber-600" />
              <span className="text-sm text-[#757575]">Available Facilities</span>
            </div>
            <p className="text-2xl font-bold text-amber-600 mt-1">{stats.availableFacilities}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-green-600" />
              <span className="text-sm text-[#757575]">Revenue (MTD)</span>
            </div>
            <p className="text-lg font-bold text-green-600 mt-1">{formatCurrency(stats.totalRevenue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {stats.deniedAccess > 0 && (
        <Alert className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Access Alerts</AlertTitle>
          <AlertDescription className="text-red-700">
            {stats.deniedAccess} access denied attempts today. Check member status or expired memberships.
          </AlertDescription>
        </Alert>
      )}

      {stats.pendingMembers > 0 && (
        <Alert className="bg-amber-50 border-amber-200">
          <Clock className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Pending Registrations</AlertTitle>
          <AlertDescription className="text-amber-700">
            {stats.pendingMembers} new member registrations awaiting payment confirmation.
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Actions & Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#00897B]" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Button className="h-auto py-4 flex-col bg-[#00897B] hover:bg-[#00695C]" onClick={() => setMemberDialogOpen(true)}>
              <UserPlus className="h-5 w-5 mb-1" />
              <span className="text-xs">New Member</span>
            </Button>
            <Button className="h-auto py-4 flex-col bg-[#00897B] hover:bg-[#00695C]" onClick={() => setActiveTab('access')}>
              <LogIn className="h-5 w-5 mb-1" />
              <span className="text-xs">Check In</span>
            </Button>
            <Button className="h-auto py-4 flex-col" variant="outline" onClick={() => setActiveTab('classes')}>
              <Calendar className="h-5 w-5 mb-1" />
              <span className="text-xs">Book Class</span>
            </Button>
            <Button className="h-auto py-4 flex-col" variant="outline" onClick={() => setActiveTab('facilities')}>
              <DoorOpen className="h-5 w-5 mb-1" />
              <span className="text-xs">Book Facility</span>
            </Button>
            <Button className="h-auto py-4 flex-col" variant="outline" onClick={() => setGuestPassDialogOpen(true)}>
              <Key className="h-5 w-5 mb-1" />
              <span className="text-xs">Guest Pass</span>
            </Button>
            <Button className="h-auto py-4 flex-col" variant="outline" onClick={() => setActiveTab('billing')}>
              <CreditCard className="h-5 w-5 mb-1" />
              <span className="text-xs">Payments</span>
            </Button>
          </CardContent>
        </Card>

        {/* Today's Classes */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#00897B]" />
                Today's Classes
              </CardTitle>
              <Badge variant="outline">{stats.scheduledClasses} scheduled</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {classes.slice(0, 5).map(cls => (
                  <div key={cls.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer"
                    onClick={() => { setSelectedClass(cls); setClassBookingDialogOpen(true) }}>
                    <div>
                      <p className="text-sm font-medium">{cls.name}</p>
                      <p className="text-xs text-[#757575]">{cls.startTime} - {cls.endTime} • {cls.instructor}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#00897B]">{cls.enrolled}/{cls.capacity}</p>
                      <Progress value={(cls.enrolled / cls.capacity) * 100} className="w-12 h-1" />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Recent Check-ins */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#00897B]" />
                Recent Check-ins
              </CardTitle>
              <Badge variant="outline" className="bg-green-50 text-green-700">{stats.currentlyIn} inside</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {checkIns.filter(c => c.type === 'check_in').slice(0, 6).map(checkIn => (
                  <div key={checkIn.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className={getTierColor(checkIn.membershipTier)}>
                          {checkIn.memberName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{checkIn.memberName}</p>
                        <p className="text-xs text-[#757575]">{checkIn.timestamp.split(' ')[1]}</p>
                      </div>
                    </div>
                    <Badge className={checkIn.status === 'granted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                      {checkIn.status === 'granted' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                      {checkIn.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Revenue & Membership Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#00897B]" />
              Membership Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                {(['vip', 'premium', 'standard', 'basic'] as MembershipTier[]).map(tier => {
                  const count = members.filter(m => m.membershipTier === tier).length
                  const Icon = getTierIcon(tier)
                  return (
                    <div key={tier} className={`p-3 rounded-lg ${getTierColor(tier)}`}>
                      <Icon className="h-4 w-4 mb-1" />
                      <p className="text-xl font-bold">{count}</p>
                      <p className="text-xs capitalize">{tier}</p>
                    </div>
                  )
                })}
              </div>
              <Separator />
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-green-600">{stats.activeMembers}</p>
                  <p className="text-xs text-[#757575]">Active</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-blue-600">{stats.frozenMembers}</p>
                  <p className="text-xs text-[#757575]">Frozen</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-red-600">{stats.expiredMembers}</p>
                  <p className="text-xs text-[#757575]">Expired</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[#00897B]" />
              Financial Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-green-50">
                  <p className="text-xs text-[#757575]">Collected (MTD)</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</p>
                </div>
                <div className="p-4 rounded-lg bg-red-50">
                  <p className="text-xs text-[#757575]">Outstanding</p>
                  <p className="text-xl font-bold text-red-600">{formatCurrency(stats.outstandingAmount)}</p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-green-600">{stats.paidInvoices}</p>
                  <p className="text-xs text-[#757575]">Paid Invoices</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-amber-600">{stats.pendingInvoices}</p>
                  <p className="text-xs text-[#757575]">Pending/Overdue</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Personal Training & Guest Passes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-[#00897B]" />
                Upcoming PT Sessions
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => setPtSessionDialogOpen(true)}>
                <Plus className="h-3 w-3 mr-1" />Schedule
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ptSessions.filter(p => p.status === 'scheduled').slice(0, 4).map(session => (
                <div key={session.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                  <div>
                    <p className="text-sm font-medium">{session.memberName}</p>
                    <p className="text-xs text-[#757575]">{session.trainerName} • {session.date} {session.time}</p>
                  </div>
                  <Badge variant="outline">{session.duration}min</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Key className="h-4 w-4 text-[#00897B]" />
                Active Guest Passes
              </CardTitle>
              <Badge variant="outline">{stats.activeGuestPasses} active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {guestPasses.filter(g => !g.used && new Date(g.expiryDate) >= new Date()).slice(0, 4).map(pass => (
                <div key={pass.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                  <div>
                    <p className="text-sm font-medium">{pass.guestName}</p>
                    <p className="text-xs text-[#757575]">Hosted by {pass.memberName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-amber-600">Expires {formatDate(pass.expiryDate)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // Render Members Tab
  const renderMembers = () => (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
            <Input
              placeholder="Search members..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Select value={memberFilter} onValueChange={setMemberFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="frozen">Frozen</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setMemberDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />Add Member
        </Button>
      </div>

      {/* Members Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Membership ID</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Visits</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map(member => (
                <TableRow key={member.id} className="cursor-pointer hover:bg-gray-50" onClick={() => { setSelectedMember(member); setMemberDetailOpen(true) }}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className={getTierColor(member.membershipTier)}>
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-xs text-[#757575]">{member.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{member.membershipId}</TableCell>
                  <TableCell>
                    <Badge className={getTierColor(member.membershipTier)}>
                      {member.membershipTier.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(member.membershipStatus)}>
                      {member.membershipStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(member.joinDate)}</TableCell>
                  <TableCell className={member.membershipStatus === 'expired' ? 'text-red-600' : ''}>
                    {formatDate(member.expiryDate)}
                  </TableCell>
                  <TableCell>{member.visits}</TableCell>
                  <TableCell className={member.balance < 0 ? 'text-red-600 font-medium' : member.balance > 0 ? 'text-green-600 font-medium' : ''}>
                    {formatCurrency(Math.abs(member.balance))}
                    {member.balance < 0 && ' OWED'}
                    {member.balance > 0 && ' CREDIT'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedMember(member); setMemberDetailOpen(true) }}>
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

      {filteredMembers.length === 0 && (
        <div className="text-center py-12 text-[#757575]">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No members found</p>
        </div>
      )}
    </div>
  )

  // Render Classes Tab
  const renderClasses = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
            <Input
              placeholder="Search classes..."
              value={classSearch}
              onChange={(e) => setClassSearch(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
        </div>
        <Button className="bg-[#00897B] hover:bg-[#00695C]">
          <Plus className="h-4 w-4 mr-2" />Add Class
        </Button>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClasses.map(cls => (
          <Card key={cls.id} className="hover:border-[#00897B] transition-colors cursor-pointer" onClick={() => { setSelectedClass(cls); setClassBookingDialogOpen(true) }}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold">{cls.name}</h4>
                  <p className="text-sm text-[#757575]">{cls.instructor}</p>
                </div>
                <Badge className={getStatusColor(cls.status)}>{cls.status}</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-[#757575]">
                  <Clock className="h-4 w-4" />
                  <span>{cls.startTime} - {cls.endTime}</span>
                </div>
                <div className="flex items-center gap-2 text-[#757575]">
                  <MapPin className="h-4 w-4" />
                  <span>{cls.studio}</span>
                </div>
                <div className="flex items-center gap-2 text-[#757575]">
                  <Users className="h-4 w-4" />
                  <span>{cls.enrolled}/{cls.capacity} enrolled</span>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[#757575]">Capacity</span>
                  <span className="font-medium">{Math.round((cls.enrolled / cls.capacity) * 100)}%</span>
                </div>
                <Progress value={(cls.enrolled / cls.capacity) * 100} className="h-2" />
              </div>
              {cls.waitlist > 0 && (
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-amber-600">{cls.waitlist} on waitlist</span>
                  <Badge variant="outline" className="text-[10px]">{cls.level}</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  // Render Access Tab
  const renderAccess = () => (
    <div className="space-y-6">
      {/* Quick Check-in */}
      <Card className="bg-gradient-to-r from-[#00897B]/10 to-[#00897B]/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <LogIn className="h-5 w-5 text-[#00897B]" />
                Quick Check-in
              </h3>
              <p className="text-sm text-[#757575] mt-1">Scan member card or enter membership ID</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
                <Input placeholder="Enter ID or scan..." className="pl-9 w-48" />
              </div>
              <Button className="bg-[#00897B] hover:bg-[#00695C]">
                Check In
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Access Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-green-50">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="h-8 w-8 mx-auto text-green-600 mb-2" />
            <p className="text-2xl font-bold text-green-600">{stats.grantedAccess}</p>
            <p className="text-sm text-[#757575]">Granted</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50">
          <CardContent className="p-4 text-center">
            <XCircle className="h-8 w-8 mx-auto text-red-600 mb-2" />
            <p className="text-2xl font-bold text-red-600">{stats.deniedAccess}</p>
            <p className="text-sm text-[#757575]">Denied</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto text-blue-600 mb-2" />
            <p className="text-2xl font-bold text-blue-600">{stats.currentlyIn}</p>
            <p className="text-sm text-[#757575]">Currently Inside</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50">
          <CardContent className="p-4 text-center">
            <Key className="h-8 w-8 mx-auto text-purple-600 mb-2" />
            <p className="text-2xl font-bold text-purple-600">{stats.activeGuestPasses}</p>
            <p className="text-sm text-[#757575]">Active Guest Passes</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Access Log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#00897B]" />
            Today's Access Log
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Membership</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Access Point</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {checkIns.map(checkIn => (
                <TableRow key={checkIn.id}>
                  <TableCell className="font-mono text-sm">{checkIn.timestamp.split(' ')[1]}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className={`text-[10px] ${getTierColor(checkIn.membershipTier)}`}>
                          {checkIn.memberName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{checkIn.memberName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTierColor(checkIn.membershipTier)}>
                      {checkIn.membershipTier.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={checkIn.type === 'check_in' ? 'bg-green-50' : 'bg-blue-50'}>
                      {checkIn.type === 'check_in' ? <LogIn className="h-3 w-3 mr-1" /> : <LogOut className="h-3 w-3 mr-1" />}
                      {checkIn.type.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{checkIn.accessPoint}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(checkIn.status)}>
                      {checkIn.status === 'granted' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                      {checkIn.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )

  // Render Facilities Tab
  const renderFacilities = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select value={facilityFilter} onValueChange={setFacilityFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="court">Courts</SelectItem>
              <SelectItem value="pool">Pools</SelectItem>
              <SelectItem value="studio">Studios</SelectItem>
              <SelectItem value="field">Fields</SelectItem>
              <SelectItem value="track">Tracks</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setFacilityBookingDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />Book Facility
        </Button>
      </div>

      {/* Facilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFacilities.map(facility => {
          const Icon = getFacilityIcon(facility.type)
          return (
            <Card key={facility.id} className={`cursor-pointer hover:border-[#00897B] transition-colors ${facility.status === 'maintenance' ? 'opacity-60' : ''}`}
              onClick={() => { setSelectedFacility(facility); setFacilityBookingDialogOpen(true) }}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      facility.status === 'available' ? 'bg-green-100 text-green-600' :
                      facility.status === 'occupied' ? 'bg-purple-100 text-purple-600' :
                      facility.status === 'reserved' ? 'bg-amber-100 text-amber-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{facility.name}</h4>
                      <p className="text-xs text-[#757575] capitalize">{facility.type}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(facility.status)}>{facility.status}</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-[#757575]">
                    <Users className="h-4 w-4" />
                    <span>Capacity: {facility.capacity}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#757575]">
                    <Clock className="h-4 w-4" />
                    <span>{facility.openingHours.open} - {facility.openingHours.close}</span>
                  </div>
                  {facility.hourlyRate > 0 && (
                    <div className="flex items-center gap-2 text-[#00897B] font-medium">
                      <CreditCard className="h-4 w-4" />
                      <span>{formatCurrency(facility.hourlyRate)}/hour</span>
                    </div>
                  )}
                </div>
                {facility.amenities.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {facility.amenities.slice(0, 3).map((amenity, i) => (
                      <Badge key={i} variant="outline" className="text-[10px]">{amenity}</Badge>
                    ))}
                    {facility.amenities.length > 3 && (
                      <Badge variant="outline" className="text-[10px]">+{facility.amenities.length - 3}</Badge>
                    )}
                  </div>
                )}
                {facility.rules && (
                  <p className="mt-2 text-xs text-amber-600">{facility.rules}</p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Upcoming Bookings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#00897B]" />
            Upcoming Facility Bookings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Facility</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facilityBookings.map(booking => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">{booking.facilityName}</TableCell>
                  <TableCell>{booking.memberName}</TableCell>
                  <TableCell>{formatDate(booking.date)}</TableCell>
                  <TableCell>{booking.startTime} - {booking.endTime}</TableCell>
                  <TableCell>{booking.duration}h</TableCell>
                  <TableCell className="font-medium">{formatCurrency(booking.totalAmount)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                      <Badge className={getStatusColor(booking.paymentStatus)}>{booking.paymentStatus}</Badge>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )

  // Render Billing Tab
  const renderBilling = () => (
    <div className="space-y-6">
      {/* Billing Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-green-50">
          <CardContent className="p-4">
            <p className="text-sm text-[#757575]">Collected (MTD)</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50">
          <CardContent className="p-4">
            <p className="text-sm text-[#757575]">Outstanding</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.outstandingAmount)}</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="p-4">
            <p className="text-sm text-[#757575]">Paid Invoices</p>
            <p className="text-2xl font-bold text-blue-600">{stats.paidInvoices}</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50">
          <CardContent className="p-4">
            <p className="text-sm text-[#757575]">Pending/Overdue</p>
            <p className="text-2xl font-bold text-amber-600">{stats.pendingInvoices}</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[#00897B]" />
              Recent Invoices
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />Export
              </Button>
              <Button variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-1" />Print
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Membership</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Paid Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map(invoice => (
                <TableRow key={invoice.id} className="cursor-pointer hover:bg-gray-50">
                  <TableCell className="font-mono">{invoice.id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{invoice.memberName}</p>
                      <p className="text-xs text-[#757575]">{invoice.membershipId}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTierColor(members.find(m => m.id === invoice.memberId)?.membershipTier || 'basic')}>
                      {members.find(m => m.id === invoice.memberId)?.membershipTier.toUpperCase() || 'BASIC'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{formatCurrency(invoice.total)}</p>
                      <p className="text-xs text-[#757575]">ex. VAT {formatCurrency(invoice.tax)}</p>
                    </div>
                  </TableCell>
                  <TableCell className={invoice.status === 'overdue' ? 'text-red-600 font-medium' : ''}>{formatDate(invoice.dueDate)}</TableCell>
                  <TableCell>{invoice.paidDate ? formatDate(invoice.paidDate) : '-'}</TableCell>
                  <TableCell>{invoice.paymentMethod || '-'}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(invoice.status)}>{invoice.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Membership Plans */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-4 w-4 text-[#00897B]" />
            Membership Plans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {membershipPlans.map(plan => {
              const Icon = getTierIcon(plan.tier)
              return (
                <Card key={plan.id} className={`border-2 ${plan.tier === 'premium' ? 'border-[#00897B]' : ''}`}>
                  <CardContent className="p-4">
                    <div className="text-center mb-4">
                      <Icon className={`h-8 w-8 mx-auto mb-2 ${getTierColor(plan.tier).split(' ')[1]}`} />
                      <h4 className="font-bold">{plan.name}</h4>
                      <p className="text-2xl font-bold text-[#00897B]">{formatCurrency(plan.price)}</p>
                      <p className="text-xs text-[#757575]">per month</p>
                    </div>
                    <Separator className="my-3" />
                    <ul className="space-y-1 text-xs text-[#757575]">
                      {plan.features.slice(0, 3).map((feature, i) => (
                        <li key={i} className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                          {feature}
                        </li>
                      ))}
                      {plan.features.length > 3 && (
                        <li className="text-[#00897B]">+{plan.features.length - 3} more</li>
                      )}
                    </ul>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-center">
                      <div className="p-1 bg-gray-50 rounded">
                        <p className="font-medium">{plan.guestPasses}</p>
                        <p className="text-[#757575]">Guest Passes</p>
                      </div>
                      <div className="p-1 bg-gray-50 rounded">
                        <p className="font-medium">{plan.personalTrainingIncluded}</p>
                        <p className="text-[#757575]">PT Sessions</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="h-full flex flex-col bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-[#00897B]" />
              Sport & Leisure Management
            </h1>
            <p className="text-sm text-[#757575]">Membership, classes, facilities, and billing management</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-[#E0F2F1] text-[#00897B] border-[#00897B]/30">
              <Users className="h-3 w-3 mr-1" />
              {stats.activeMembers} Active
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Activity className="h-3 w-3 mr-1" />
              {stats.currentlyIn} Inside
            </Badge>
            <Button variant="outline" size="sm" onClick={() => setLoading(!loading)}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
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
                <Activity className="h-4 w-4 mr-1" />Dashboard
              </TabsTrigger>
              <TabsTrigger value="members" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Users className="h-4 w-4 mr-1" />Members
              </TabsTrigger>
              <TabsTrigger value="classes" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Calendar className="h-4 w-4 mr-1" />Classes
              </TabsTrigger>
              <TabsTrigger value="access" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Key className="h-4 w-4 mr-1" />Access
              </TabsTrigger>
              <TabsTrigger value="facilities" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <DoorOpen className="h-4 w-4 mr-1" />Facilities
              </TabsTrigger>
              <TabsTrigger value="billing" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <CreditCard className="h-4 w-4 mr-1" />Billing
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 p-4">
            <TabsContent value="dashboard" className="m-0">{renderDashboard()}</TabsContent>
            <TabsContent value="members" className="m-0">{renderMembers()}</TabsContent>
            <TabsContent value="classes" className="m-0">{renderClasses()}</TabsContent>
            <TabsContent value="access" className="m-0">{renderAccess()}</TabsContent>
            <TabsContent value="facilities" className="m-0">{renderFacilities()}</TabsContent>
            <TabsContent value="billing" className="m-0">{renderBilling()}</TabsContent>
          </ScrollArea>
        </Tabs>
      </div>

      {/* Add Member Dialog */}
      <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Member</DialogTitle>
            <DialogDescription>Register a new gym member</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Full Name *</Label>
                <Input value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} placeholder="John Smith" />
              </div>
              <div>
                <Label>Phone *</Label>
                <Input value={newMember.phone} onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })} placeholder="+27 82 123 4567" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email *</Label>
                <Input value={newMember.email} onChange={(e) => setNewMember({ ...newMember, email: e.target.value })} placeholder="email@example.com" type="email" />
              </div>
              <div>
                <Label>Membership Tier</Label>
                <Select value={newMember.membershipTier} onValueChange={(v) => setNewMember({ ...newMember, membershipTier: v as MembershipTier })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {membershipPlans.map(plan => (
                      <SelectItem key={plan.id} value={plan.tier}>{plan.name} - {formatCurrency(plan.price)}/mo</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Emergency Contact</Label>
                <Input value={newMember.emergencyContact} onChange={(e) => setNewMember({ ...newMember, emergencyContact: e.target.value })} placeholder="Contact name" />
              </div>
              <div>
                <Label>Emergency Phone</Label>
                <Input value={newMember.emergencyPhone} onChange={(e) => setNewMember({ ...newMember, emergencyPhone: e.target.value })} placeholder="+27 83 234 5678" />
              </div>
            </div>
            <div>
              <Label>Medical Notes</Label>
              <Textarea value={newMember.medicalNotes} onChange={(e) => setNewMember({ ...newMember, medicalNotes: e.target.value })} placeholder="Any medical conditions or injuries..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMemberDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleAddMember}>Add Member</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Member Detail Dialog */}
      <Dialog open={memberDetailOpen} onOpenChange={setMemberDetailOpen}>
        <DialogContent className="sm:max-w-2xl">
          {selectedMember && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className={getTierColor(selectedMember.membershipTier)}>
                      {selectedMember.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p>{selectedMember.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getTierColor(selectedMember.membershipTier)}>{selectedMember.membershipTier.toUpperCase()}</Badge>
                      <Badge className={getStatusColor(selectedMember.membershipStatus)}>{selectedMember.membershipStatus}</Badge>
                    </div>
                  </div>
                </DialogTitle>
                <DialogDescription>{selectedMember.membershipId}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-[#757575]">Email</p>
                    <p className="font-medium">{selectedMember.email}</p>
                  </div>
                  <div>
                    <p className="text-[#757575]">Phone</p>
                    <p className="font-medium">{selectedMember.phone}</p>
                  </div>
                  <div>
                    <p className="text-[#757575]">Visits</p>
                    <p className="font-medium">{selectedMember.visits}</p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-[#757575]">Join Date</p>
                    <p className="font-medium">{formatDate(selectedMember.joinDate)}</p>
                  </div>
                  <div>
                    <p className="text-[#757575]">Expiry Date</p>
                    <p className={`font-medium ${selectedMember.membershipStatus === 'expired' ? 'text-red-600' : ''}`}>{formatDate(selectedMember.expiryDate)}</p>
                  </div>
                  <div>
                    <p className="text-[#757575]">Balance</p>
                    <p className={`font-medium ${selectedMember.balance < 0 ? 'text-red-600' : selectedMember.balance > 0 ? 'text-green-600' : ''}`}>
                      {formatCurrency(Math.abs(selectedMember.balance))}
                      {selectedMember.balance < 0 && ' OWED'}
                    </p>
                  </div>
                </div>
                {selectedMember.membershipStatus === 'frozen' && selectedMember.freezeStartDate && (
                  <>
                    <Separator />
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-800 flex items-center gap-2">
                        <Snowflake className="h-4 w-4" />
                        Membership Frozen
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        From {formatDate(selectedMember.freezeStartDate)} to {formatDate(selectedMember.freezeEndDate || '')}
                      </p>
                    </div>
                  </>
                )}
                {selectedMember.medicalNotes && (
                  <>
                    <Separator />
                    <div className="p-3 bg-amber-50 rounded-lg">
                      <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Medical Notes
                      </p>
                      <p className="text-xs text-amber-700 mt-1">{selectedMember.medicalNotes}</p>
                    </div>
                  </>
                )}
                {selectedMember.emergencyContact && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-[#757575]">Emergency Contact</p>
                        <p className="font-medium">{selectedMember.emergencyContact}</p>
                      </div>
                      <div>
                        <p className="text-[#757575]">Emergency Phone</p>
                        <p className="font-medium">{selectedMember.emergencyPhone}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <DialogFooter className="flex-col gap-2">
                <div className="flex gap-2 w-full">
                  <Button variant="outline" className="flex-1">
                    <Edit className="h-4 w-4 mr-2" />Edit
                  </Button>
                  {selectedMember.membershipStatus === 'active' && (
                    <Button variant="outline" className="flex-1" onClick={() => setFreezeDialogOpen(true)}>
                      <Snowflake className="h-4 w-4 mr-2" />Freeze
                    </Button>
                  )}
                  {selectedMember.membershipStatus === 'frozen' && (
                    <Button variant="outline" className="flex-1" onClick={() => handleUnfreezeMembership(selectedMember)}>
                      <Play className="h-4 w-4 mr-2" />Unfreeze
                    </Button>
                  )}
                  <Button className="flex-1 bg-[#00897B] hover:bg-[#00695C]">
                    Renew
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Freeze Membership Dialog */}
      <Dialog open={freezeDialogOpen} onOpenChange={setFreezeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Freeze Membership</DialogTitle>
            <DialogDescription>Temporarily suspend this membership</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={freezeForm.startDate} onChange={(e) => setFreezeForm({ ...freezeForm, startDate: e.target.value })} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" value={freezeForm.endDate} onChange={(e) => setFreezeForm({ ...freezeForm, endDate: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Reason</Label>
              <Textarea value={freezeForm.reason} onChange={(e) => setFreezeForm({ ...freezeForm, reason: e.target.value })} placeholder="Medical, travel, etc." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFreezeDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleFreezeMembership}>Freeze Membership</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Class Booking Dialog */}
      <Dialog open={classBookingDialogOpen} onOpenChange={setClassBookingDialogOpen}>
        <DialogContent>
          {selectedClass && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedClass.name}</DialogTitle>
                <DialogDescription>{selectedClass.instructor} • {selectedClass.studio}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-[#757575]">Time</p>
                    <p className="font-medium">{selectedClass.startTime} - {selectedClass.endTime}</p>
                  </div>
                  <div>
                    <p className="text-[#757575]">Duration</p>
                    <p className="font-medium">{selectedClass.duration} minutes</p>
                  </div>
                  <div>
                    <p className="text-[#757575]">Level</p>
                    <Badge variant="outline">{selectedClass.level}</Badge>
                  </div>
                  <div>
                    <p className="text-[#757575]">Availability</p>
                    <p className={`font-medium ${selectedClass.enrolled >= selectedClass.capacity ? 'text-red-600' : 'text-green-600'}`}>
                      {selectedClass.enrolled}/{selectedClass.capacity} enrolled
                    </p>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Class Capacity</span>
                    <span>{Math.round((selectedClass.enrolled / selectedClass.capacity) * 100)}%</span>
                  </div>
                  <Progress value={(selectedClass.enrolled / selectedClass.capacity) * 100} className="h-2" />
                </div>
                {selectedClass.waitlist > 0 && (
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <p className="text-sm text-amber-800">
                      <Users className="h-4 w-4 inline mr-1" />
                      {selectedClass.waitlist} people on waitlist
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setClassBookingDialogOpen(false)}>Cancel</Button>
                <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleBookClass} disabled={selectedClass.enrolled >= selectedClass.capacity}>
                  {selectedClass.enrolled >= selectedClass.capacity ? 'Join Waitlist' : 'Book Class'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Guest Pass Dialog */}
      <Dialog open={guestPassDialogOpen} onOpenChange={setGuestPassDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue Guest Pass</DialogTitle>
            <DialogDescription>Create a guest pass for a visitor</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Sponsoring Member</Label>
              <Select value={selectedMember?.id} onValueChange={(v) => setSelectedMember(members.find(m => m.id === v) || null)}>
                <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                <SelectContent>
                  {members.filter(m => m.membershipStatus === 'active').map(member => (
                    <SelectItem key={member.id} value={member.id}>{member.name} ({member.membershipId})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Guest Name</Label>
                <Input value={newGuestPass.guestName} onChange={(e) => setNewGuestPass({ ...newGuestPass, guestName: e.target.value })} placeholder="Guest name" />
              </div>
              <div>
                <Label>Guest Phone</Label>
                <Input value={newGuestPass.guestPhone} onChange={(e) => setNewGuestPass({ ...newGuestPass, guestPhone: e.target.value })} placeholder="+27 XX XXX XXXX" />
              </div>
            </div>
            <div className="p-3 bg-[#E0F2F1] rounded-lg">
              <p className="text-sm text-[#00897B]">
                Guest pass valid for 7 days from issue date.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGuestPassDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleIssueGuestPass}>Issue Pass</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Facility Booking Dialog */}
      <Dialog open={facilityBookingDialogOpen} onOpenChange={setFacilityBookingDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          {selectedFacility && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {(() => { const Icon = getFacilityIcon(selectedFacility.type); return <Icon className="h-5 w-5 text-[#00897B]" /> })()}
                  {selectedFacility.name}
                </DialogTitle>
                <DialogDescription>Book this facility</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-[#757575]">Status</p>
                    <Badge className={getStatusColor(selectedFacility.status)}>{selectedFacility.status}</Badge>
                  </div>
                  <div>
                    <p className="text-[#757575]">Hourly Rate</p>
                    <p className="font-medium">{selectedFacility.hourlyRate > 0 ? formatCurrency(selectedFacility.hourlyRate) : 'Free'}</p>
                  </div>
                  <div>
                    <p className="text-[#757575]">Capacity</p>
                    <p className="font-medium">{selectedFacility.capacity} people</p>
                  </div>
                  <div>
                    <p className="text-[#757575]">Hours</p>
                    <p className="font-medium">{selectedFacility.openingHours.open} - {selectedFacility.openingHours.close}</p>
                  </div>
                </div>
                {selectedFacility.amenities.length > 0 && (
                  <div>
                    <p className="text-sm text-[#757575] mb-2">Amenities</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedFacility.amenities.map((amenity, i) => (
                        <Badge key={i} variant="outline">{amenity}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {selectedFacility.rules && (
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <p className="text-sm text-amber-800">{selectedFacility.rules}</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setFacilityBookingDialogOpen(false)}>Cancel</Button>
                <Button className="bg-[#00897B] hover:bg-[#00695C]" disabled={selectedFacility.status !== 'available'}>
                  Book Facility
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* PT Session Dialog */}
      <Dialog open={ptSessionDialogOpen} onOpenChange={setPtSessionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule PT Session</DialogTitle>
            <DialogDescription>Book a personal training session</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Member</Label>
              <Select value={selectedMember?.id} onValueChange={(v) => setSelectedMember(members.find(m => m.id === v) || null)}>
                <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                <SelectContent>
                  {members.filter(m => m.membershipStatus === 'active').map(member => (
                    <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Date</Label>
                <Input type="date" value={newPTSession.date} onChange={(e) => setNewPTSession({ ...newPTSession, date: e.target.value })} />
              </div>
              <div>
                <Label>Time</Label>
                <Input type="time" value={newPTSession.time} onChange={(e) => setNewPTSession({ ...newPTSession, time: e.target.value })} />
              </div>
              <div>
                <Label>Duration</Label>
                <Select value={String(newPTSession.duration)} onValueChange={(v) => setNewPTSession({ ...newPTSession, duration: parseInt(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="45">45 min</SelectItem>
                    <SelectItem value="60">60 min</SelectItem>
                    <SelectItem value="90">90 min</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={newPTSession.notes} onChange={(e) => setNewPTSession({ ...newPTSession, notes: e.target.value })} placeholder="Training focus, goals, etc." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPtSessionDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]">Schedule Session</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
