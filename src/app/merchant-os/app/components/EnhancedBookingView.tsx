'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
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
  Calendar,
  Clock,
  User,
  Users,
  Plus,
  Scissors,
  Search,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Timer,
  Sparkles,
  MessageSquare,
  MoreHorizontal,
  X,
  Edit,
  Trash2,
  Eye,
  Code,
  Send,
  Smartphone,
  CreditCard,
  Coins,
  Copy,
  Globe,
  Bell,
  BellRing,
  Settings,
  TrendingUp,
  Wallet,
  Percent,
  Check,
  ExternalLink,
  ShoppingCart,
  Package as PackageIcon,
  Gift,
  Ticket,
  Star,
  Palette,
  FileText,
} from 'lucide-react'

// Types
interface Stylist {
  id: string
  name: string
  avatar: string
  specialties: string[]
  rating: number
  status: 'available' | 'busy' | 'break' | 'off'
  color: string
}

interface Service {
  id: string
  name: string
  category: string
  duration: number // in minutes
  price: number
  description?: string
  depositRequired?: boolean
  depositAmount?: number
  depositPercentage?: number
}

// Service Combo for bundled services
interface ServiceCombo {
  id: string
  name: string
  services: string[] // service IDs
  bundledPrice: number
  totalDuration: number
  discount: number // percentage off
  category: string
}

// Client Colour Formula (Hair Salon)
interface ColourFormula {
  id: string
  customerId: string
  customerName: string
  brand: string
  developer: string // e.g., "20 vol", "30 vol"
  tone: string
  formula: string
  stylistId: string
  lastUsed: string
  notes?: string
}

// Client Patch Test Status
interface PatchTest {
  id: string
  customerId: string
  customerName: string
  testDate: string
  expiryDate: string
  status: 'valid' | 'expired' | 'pending'
  products: string[]
}

// Membership Plan (Barber)
interface MembershipPlan {
  id: string
  name: string
  monthlyFee: number
  includedServices: { serviceId: string; quantity: number }[]
  rollover: boolean
  active: boolean
}

// Client Membership
interface ClientMembership {
  id: string
  customerId: string
  customerName: string
  planId: string
  planName: string
  startDate: string
  renewalDate: string
  servicesRemaining: Record<string, number>
  status: 'active' | 'paused' | 'cancelled'
}

// Loyalty Tier (Nail Salon)
interface LoyaltyTier {
  id: string
  name: 'Bronze' | 'Silver' | 'Gold' | 'Platinum'
  minSpend: number
  maxSpend: number
  earnRate: number // points per R10
  perks: string[]
  birthdayDiscount: number
}

// Treatment Package (Spa)
interface TreatmentPackage {
  id: string
  name: string
  description: string
  treatments: { serviceId: string; quantity: number }[]
  price: number
  validityMonths: number
  sessionsTotal: number
}

// Client Package
interface ClientPackage {
  id: string
  customerId: string
  customerName: string
  packageId: string
  packageName: string
  purchaseDate: string
  expiryDate: string
  sessionsRemaining: number
  sessionsTotal: number
}

// Gift Voucher
interface GiftVoucher {
  id: string
  code: string
  type: 'monetary' | 'service'
  amount?: number
  serviceId?: string
  serviceName?: string
  purchaserName: string
  recipientName?: string
  issueDate: string
  expiryDate: string
  balance: number
  status: 'active' | 'redeemed' | 'expired' | 'partial'
}

// Consent Form (Aesthetic Clinic)
interface ConsentForm {
  id: string
  name: string
  treatmentTypes: string[]
  template: string
  required: boolean
}

// Signed Consent
interface SignedConsent {
  id: string
  customerId: string
  customerName: string
  formId: string
  formName: string
  treatmentType: string
  signedAt: string
  signatureMethod: 'tablet' | 'sms_link'
  ipAddress?: string
  pdfUrl?: string
}

// Treatment Plan (Aesthetic Clinic)
interface TreatmentPlan {
  id: string
  customerId: string
  customerName: string
  name: string
  totalSessions: number
  completedSessions: number
  startDate: string
  estimatedEndDate: string
  treatments: {
    serviceId: string
    serviceName: string
    scheduledDate?: string
    status: 'pending' | 'completed' | 'cancelled'
  }[]
  notes?: string
}

// Tattoo Project
interface TattooProject {
  id: string
  customerId: string
  customerName: string
  description: string
  estimatedHours: number
  hourlyRate?: number
  fixedPrice?: number
  depositAmount: number
  depositPaid: boolean
  sessions: {
    id: string
    date: string
    hours: number
    notes: string
    status: 'scheduled' | 'completed'
  }[]
  referenceImages: string[]
  status: 'enquiry' | 'quoted' | 'in_progress' | 'completed'
}

// Nail Design
interface NailDesign {
  id: string
  name: string
  imageUrl: string
  category: string
  addOnPrice: number
  popularity: number
}

// Infill Intelligence (Lash & Brow)
interface InfillRule {
  maxDaysForInfill: number
  behavior: 'advisory' | 'block'
  overrideRequiresManager: boolean
}

interface Appointment {
  id: string
  customerId: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  stylistId: string
  serviceId: string
  date: string
  time: string
  duration: number
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show'
  notes?: string
  total: number
  depositAmount?: number
  depositPaid?: boolean
  depositMethod?: 'online' | 'in-store' | 'wallet'
  reminderSent?: boolean
  reminderSentAt?: string
  secondReminderSent?: boolean
  source: 'in-store' | 'online' | 'phone' | 'walk-in'
}

interface WalkIn {
  id: string
  customerName: string
  phone?: string
  service: string
  stylistPreference?: string
  waitTime: number
  position: number
  status: 'waiting' | 'called' | 'seated'
}

interface SMSReminder {
  id: string
  appointmentId: string
  customerName: string
  customerPhone: string
  service: string
  date: string
  time: string
  sentAt: string
  status: 'sent' | 'delivered' | 'failed'
  type: 'confirmation' | 'reminder_24h' | 'reminder_2h'
}

interface BookingSettings {
  onlineBookingEnabled: boolean
  requireDeposit: boolean
  defaultDepositPercentage: number
  sendConfirmationSMS: boolean
  sendReminder24h: boolean
  sendReminder2h: boolean
  allowOnlineReschedule: boolean
  allowOnlineCancel: boolean
  cancellationPolicy: 'flexible' | 'moderate' | 'strict'
  minBookingNotice: number // hours
  maxAdvanceBooking: number // days
  autoConfirmBookings: boolean
  sendWhatsApp: boolean
  whatsappBusinessNumber?: string
}

// Reminder Template
interface ReminderTemplate {
  id: string
  name: string
  type: 'confirmation' | 'reminder_24h' | 'reminder_2h' | 'custom'
  channel: 'sms' | 'whatsapp' | 'both'
  subject?: string
  message: string
  active: boolean
}

// Deposit Rule
interface DepositRule {
  id: string
  name: string
  serviceCategory?: string
  serviceId?: string
  depositType: 'percentage' | 'fixed'
  depositValue: number
  minAmount: number
  nonRefundable: boolean
  active: boolean
}

// Sample Data
const sampleStylists: Stylist[] = [
  { id: 's1', name: 'Nomsa Dlamini', avatar: '👩🏿', specialties: ['Haircut', 'Coloring', 'Braids'], rating: 4.9, status: 'available', color: '#00897B' },
  { id: 's2', name: 'Thabo Molefe', avatar: '👨🏿', specialties: ['Haircut', 'Fade', 'Beard'], rating: 4.8, status: 'busy', color: '#FF6B6B' },
  { id: 's3', name: 'Zanele Nkosi', avatar: '👩🏿', specialties: ['Nails', 'Manicure', 'Pedicure'], rating: 4.7, status: 'available', color: '#4ECDC4' },
  { id: 's4', name: 'Kagiso Mokoena', avatar: '👨🏿', specialties: ['Haircut', 'Styling', 'Treatment'], rating: 4.6, status: 'break', color: '#9B59B6' },
  { id: 's5', name: 'Lerato Sithole', avatar: '👩🏿', specialties: ['Makeup', 'Facial', 'Spa'], rating: 4.9, status: 'off', color: '#E74C3C' },
]

const sampleServices: Service[] = [
  { id: 'sv1', name: 'Haircut - Ladies', category: 'Hair', duration: 45, price: 180, description: 'Wash, cut & style', depositRequired: true, depositAmount: 50 },
  { id: 'sv2', name: 'Haircut - Gentlemen', category: 'Hair', duration: 30, price: 120, description: 'Cut & style', depositRequired: false },
  { id: 'sv3', name: 'Fade Cut', category: 'Hair', duration: 35, price: 150, description: 'Precision fade', depositRequired: false },
  { id: 'sv4', name: 'Hair Coloring', category: 'Hair', duration: 120, price: 650, description: 'Full color', depositRequired: true, depositAmount: 200 },
  { id: 'sv5', name: 'Braids - Medium', category: 'Hair', duration: 240, price: 850, description: 'Medium box braids', depositRequired: true, depositPercentage: 30 },
  { id: 'sv6', name: 'Manicure', category: 'Nails', duration: 45, price: 180, description: 'File, shape & polish', depositRequired: false },
  { id: 'sv7', name: 'Pedicure', category: 'Nails', duration: 60, price: 250, description: 'Soak, scrub & polish', depositRequired: false },
  { id: 'sv8', name: 'Gel Nails', category: 'Nails', duration: 75, price: 350, description: 'Full set gel', depositRequired: true, depositAmount: 100 },
  { id: 'sv9', name: 'Facial Treatment', category: 'Spa', duration: 60, price: 450, description: 'Deep cleanse facial', depositRequired: true, depositAmount: 100 },
  { id: 'sv10', name: 'Beard Trim', category: 'Hair', duration: 20, price: 80, description: 'Shape & trim', depositRequired: false },
  { id: 'sv11', name: 'Wash & Blow Dry', category: 'Hair', duration: 30, price: 150, description: 'Wash & style', depositRequired: false },
  { id: 'sv12', name: 'Full Spa Package', category: 'Spa', duration: 180, price: 1200, description: 'Facial, massage & nails', depositRequired: true, depositPercentage: 25 },
]

const sampleAppointments: Appointment[] = [
  { id: 'a1', customerId: 'c1', customerName: 'Precious Mokoena', customerPhone: '082 123 4567', customerEmail: 'precious@email.com', stylistId: 's1', serviceId: 'sv1', date: '2026-02-20', time: '09:00', duration: 45, status: 'confirmed', total: 180, depositAmount: 50, depositPaid: true, depositMethod: 'online', reminderSent: true, reminderSentAt: '2026-02-19 09:00', source: 'online' },
  { id: 'a2', customerId: 'c2', customerName: 'John Khumalo', customerPhone: '083 234 5678', stylistId: 's2', serviceId: 'sv3', date: '2026-02-20', time: '09:30', duration: 35, status: 'in-progress', total: 150, source: 'walk-in' },
  { id: 'a3', customerId: 'c3', customerName: 'Dineo Tshabalala', customerPhone: '084 345 6789', customerEmail: 'dineo@email.com', stylistId: 's3', serviceId: 'sv6', date: '2026-02-20', time: '10:00', duration: 45, status: 'scheduled', total: 180, reminderSent: false, source: 'phone' },
  { id: 'a4', customerId: 'c4', customerName: 'Sipho Ndaba', customerPhone: '085 456 7890', customerEmail: 'sipho@email.com', stylistId: 's1', serviceId: 'sv4', date: '2026-02-20', time: '11:00', duration: 120, status: 'scheduled', total: 650, depositAmount: 200, depositPaid: true, depositMethod: 'wallet', reminderSent: true, reminderSentAt: '2026-02-19 11:00', source: 'online' },
  { id: 'a5', customerId: 'c5', customerName: 'Mpho Mokoena', customerPhone: '086 567 8901', stylistId: 's4', serviceId: 'sv2', date: '2026-02-20', time: '14:00', duration: 30, status: 'scheduled', total: 120, reminderSent: false, source: 'in-store' },
  { id: 'a6', customerId: 'c6', customerName: 'Thandi Nkosi', customerPhone: '087 678 9012', customerEmail: 'thandi@email.com', stylistId: 's3', serviceId: 'sv8', date: '2026-02-20', time: '15:00', duration: 75, status: 'scheduled', total: 350, depositAmount: 100, depositPaid: false, reminderSent: false, source: 'online' },
]

const sampleWalkIns: WalkIn[] = [
  { id: 'w1', customerName: 'Walk-in Customer', phone: '', service: 'Haircut - Gentlemen', waitTime: 5, position: 1, status: 'waiting' },
  { id: 'w2', customerName: 'Siphiwe Mabaso', phone: '082 999 8888', service: 'Fade Cut', stylistPreference: 'Thabo', waitTime: 12, position: 2, status: 'waiting' },
]

const sampleReminders: SMSReminder[] = [
  { id: 'r1', appointmentId: 'a1', customerName: 'Precious Mokoena', customerPhone: '082 123 4567', service: 'Haircut - Ladies', date: '2026-02-20', time: '09:00', sentAt: '2026-02-19 09:00', status: 'delivered', type: 'confirmation' },
  { id: 'r2', appointmentId: 'a4', customerName: 'Sipho Ndaba', customerPhone: '085 456 7890', service: 'Hair Coloring', date: '2026-02-20', time: '11:00', sentAt: '2026-02-19 11:00', status: 'delivered', type: 'confirmation' },
  { id: 'r3', appointmentId: 'a1', customerName: 'Precious Mokoena', customerPhone: '082 123 4567', service: 'Haircut - Ladies', date: '2026-02-20', time: '09:00', sentAt: '2026-02-19 09:00', status: 'delivered', type: 'reminder_24h' },
]

// Service Combos
const sampleServiceCombos: ServiceCombo[] = [
  { id: 'c1', name: 'Cut & Colour Special', services: ['sv1', 'sv4'], bundledPrice: 750, totalDuration: 165, discount: 10, category: 'Hair' },
  { id: 'c2', name: 'Full Glam Package', services: ['sv1', 'sv6', 'sv9'], bundledPrice: 650, totalDuration: 150, discount: 15, category: 'Packages' },
  { id: 'c3', name: 'Nails & Spa Combo', services: ['sv6', 'sv7', 'sv9'], bundledPrice: 750, totalDuration: 165, discount: 12, category: 'Spa' },
  { id: 'c4', name: 'Gentleman\'s Package', services: ['sv2', 'sv10', 'sv11'], bundledPrice: 280, totalDuration: 80, discount: 10, category: 'Hair' },
]

// Colour Formulas
const sampleColourFormulas: ColourFormula[] = [
  { id: 'cf1', customerId: 'c1', customerName: 'Precious Mokoena', brand: 'L\'Oreal', developer: '20 vol', tone: 'Ash Blonde 9.1', formula: '2 tubes 9.1 + 1 tube 10.1', stylistId: 's1', lastUsed: '2026-01-15', notes: 'Leave for 35 mins' },
  { id: 'cf2', customerId: 'c4', customerName: 'Sipho Ndaba', brand: 'Wella', developer: '30 vol', tone: 'Chocolate Brown 5.0', formula: '1 tube 5.0 + 1/2 tube 5.7', stylistId: 's1', lastUsed: '2026-02-01' },
]

// Patch Tests
const samplePatchTests: PatchTest[] = [
  { id: 'pt1', customerId: 'c1', customerName: 'Precious Mokoena', testDate: '2026-02-10', expiryDate: '2026-08-10', status: 'valid', products: ['Hair Dye', 'Bleach'] },
  { id: 'pt2', customerId: 'c4', customerName: 'Sipho Ndaba', testDate: '2025-08-01', expiryDate: '2026-02-01', status: 'expired', products: ['Hair Dye'] },
]

// Membership Plans
const sampleMembershipPlans: MembershipPlan[] = [
  { id: 'mp1', name: 'Basic Cut Club', monthlyFee: 299, includedServices: [{ serviceId: 'sv2', quantity: 4 }], rollover: false, active: true },
  { id: 'mp2', name: 'VIP Grooming', monthlyFee: 499, includedServices: [{ serviceId: 'sv2', quantity: 4 }, { serviceId: 'sv10', quantity: 4 }], rollover: true, active: true },
  { id: 'mp3', name: 'Unlimited Basic', monthlyFee: 799, includedServices: [{ serviceId: 'sv2', quantity: 99 }], rollover: false, active: true },
]

// Client Memberships
const sampleClientMemberships: ClientMembership[] = [
  { id: 'cm1', customerId: 'c2', customerName: 'John Khumalo', planId: 'mp1', planName: 'Basic Cut Club', startDate: '2026-01-01', renewalDate: '2026-03-01', servicesRemaining: { sv2: 2 }, status: 'active' },
  { id: 'cm2', customerId: 'c5', customerName: 'Mpho Mokoena', planId: 'mp2', planName: 'VIP Grooming', startDate: '2026-01-15', renewalDate: '2026-04-15', servicesRemaining: { sv2: 3, sv10: 4 }, status: 'active' },
]

// Loyalty Tiers
const sampleLoyaltyTiers: LoyaltyTier[] = [
  { id: 'lt1', name: 'Bronze', minSpend: 0, maxSpend: 2999, earnRate: 1, perks: ['Birthday 10% off'], birthdayDiscount: 10 },
  { id: 'lt2', name: 'Silver', minSpend: 3000, maxSpend: 7999, earnRate: 1.5, perks: ['Priority booking', 'Birthday 15% off'], birthdayDiscount: 15 },
  { id: 'lt3', name: 'Gold', minSpend: 8000, maxSpend: 999999, earnRate: 2, perks: ['Free design upgrade', 'Birthday 20% off', 'VIP queue'], birthdayDiscount: 20 },
]

// Treatment Packages
const sampleTreatmentPackages: TreatmentPackage[] = [
  { id: 'tp1', name: 'Spa Day Package', description: 'Facial, massage & manicure', treatments: [{ serviceId: 'sv9', quantity: 1 }, { serviceId: 'sv6', quantity: 1 }], price: 850, validityMonths: 6, sessionsTotal: 3 },
  { id: 'tp2', name: 'Monthly Glow', description: '4x Facials over 3 months', treatments: [{ serviceId: 'sv9', quantity: 4 }], price: 1600, validityMonths: 3, sessionsTotal: 4 },
]

// Client Packages
const sampleClientPackages: ClientPackage[] = [
  { id: 'cp1', customerId: 'c1', customerName: 'Precious Mokoena', packageId: 'tp1', packageName: 'Spa Day Package', purchaseDate: '2026-01-15', expiryDate: '2026-07-15', sessionsRemaining: 2, sessionsTotal: 3 },
  { id: 'cp2', customerId: 'c3', customerName: 'Dineo Tshabalala', packageId: 'tp2', packageName: 'Monthly Glow', purchaseDate: '2026-02-01', expiryDate: '2026-05-01', sessionsRemaining: 4, sessionsTotal: 4 },
]

// Gift Vouchers
const sampleGiftVouchers: GiftVoucher[] = [
  { id: 'gv1', code: 'GRW-2026-ABCD1234', type: 'monetary', amount: 500, purchaserName: 'Thabo Molefe', recipientName: 'Nomsa Dlamini', issueDate: '2026-02-10', expiryDate: '2027-02-10', balance: 500, status: 'active' },
  { id: 'gv2', code: 'GRW-2026-EFGH5678', type: 'service', serviceId: 'sv9', serviceName: 'Facial Treatment', purchaserName: 'Kagiso Mokoena', issueDate: '2026-02-15', expiryDate: '2027-02-15', balance: 450, status: 'active' },
  { id: 'gv3', code: 'GRW-2026-IJKL9012', type: 'monetary', amount: 300, purchaserName: 'Lerato Sithole', issueDate: '2025-12-01', expiryDate: '2026-12-01', balance: 150, status: 'partial' },
]

// Consent Forms
const sampleConsentForms: ConsentForm[] = [
  { id: 'cf1', name: 'Laser Treatment Consent', treatmentTypes: ['Laser Hair Removal', 'IPL'], template: 'Standard laser consent form...', required: true },
  { id: 'cf2', name: 'Chemical Peel Consent', treatmentTypes: ['Chemical Peel', 'Microdermabrasion'], template: 'Chemical peel consent...', required: true },
  { id: 'cf3', name: 'Injectable Treatment Consent', treatmentTypes: ['Botox', 'Fillers'], template: 'Injectable consent form...', required: true },
]

// Signed Consents
const sampleSignedConsents: SignedConsent[] = [
  { id: 'sc1', customerId: 'c1', customerName: 'Precious Mokoena', formId: 'cf1', formName: 'Laser Treatment Consent', treatmentType: 'Laser Hair Removal', signedAt: '2026-02-10', signatureMethod: 'tablet' },
  { id: 'sc2', customerId: 'c3', customerName: 'Dineo Tshabalala', formId: 'cf2', formName: 'Chemical Peel Consent', treatmentType: 'Chemical Peel', signedAt: '2026-02-15', signatureMethod: 'sms_link' },
]

// Treatment Plans
const sampleTreatmentPlans: TreatmentPlan[] = [
  { id: 'tp1', customerId: 'c1', customerName: 'Precious Mokoena', name: 'Laser Hair Removal - Full Legs', totalSessions: 8, completedSessions: 3, startDate: '2026-01-15', estimatedEndDate: '2026-07-15', treatments: [
    { serviceId: 'laser1', serviceName: 'Laser Session 1', scheduledDate: '2026-01-15', status: 'completed' },
    { serviceId: 'laser2', serviceName: 'Laser Session 2', scheduledDate: '2026-02-15', status: 'completed' },
    { serviceId: 'laser3', serviceName: 'Laser Session 3', scheduledDate: '2026-03-15', status: 'pending' },
  ]},
]

// Tattoo Projects
const sampleTattooProjects: TattooProject[] = [
  { id: 'tat1', customerId: 'c2', customerName: 'John Khumalo', description: 'Full sleeve - tribal design', estimatedHours: 20, hourlyRate: 800, depositAmount: 2000, depositPaid: true, sessions: [
    { id: 'ts1', date: '2026-02-10', hours: 4, notes: 'Outline completed', status: 'completed' },
    { id: 'ts2', date: '2026-03-10', hours: 4, notes: 'Shading upper arm', status: 'scheduled' },
  ], referenceImages: ['/tattoo-ref1.jpg'], status: 'in_progress' },
  { id: 'tat2', customerId: 'c6', customerName: 'Thandi Nkosi', description: 'Small butterfly on wrist', estimatedHours: 2, fixedPrice: 1200, depositAmount: 400, depositPaid: true, sessions: [
    { id: 'ts3', date: '2026-02-20', hours: 2, notes: '', status: 'scheduled' },
  ], referenceImages: [], status: 'quoted' },
]

// Nail Designs
const sampleNailDesigns: NailDesign[] = [
  { id: 'nd1', name: 'French Tip Classic', imageUrl: '/designs/french-tip.jpg', category: 'Classic', addOnPrice: 0, popularity: 95 },
  { id: 'nd2', name: 'Ombre Glow', imageUrl: '/designs/ombre.jpg', category: 'Gradient', addOnPrice: 50, popularity: 88 },
  { id: 'nd3', name: 'Glitter Glam', imageUrl: '/designs/glitter.jpg', category: 'Sparkle', addOnPrice: 80, popularity: 82 },
  { id: 'nd4', name: 'Floral Art', imageUrl: '/designs/floral.jpg', category: 'Art', addOnPrice: 100, popularity: 75 },
  { id: 'nd5', name: 'Geometric Modern', imageUrl: '/designs/geometric.jpg', category: 'Modern', addOnPrice: 120, popularity: 70 },
  { id: 'nd6', name: 'Chrome Mirror', imageUrl: '/designs/chrome.jpg', category: 'Special Effects', addOnPrice: 150, popularity: 85 },
]

// Infill Rules (Lash & Brow)
const sampleInfillRules: InfillRule = {
  maxDaysForInfill: 21,
  behavior: 'advisory',
  overrideRequiresManager: false
}

// Sample Reminder Templates
const sampleReminderTemplates: ReminderTemplate[] = [
  { id: 'rt1', name: 'Booking Confirmation', type: 'confirmation', channel: 'both', message: 'Hi {customer_name}, your booking at {business_name} is confirmed for {date} at {time}. Service: {service}. Amount: R{amount}. Reply CANCEL to cancel.', active: true },
  { id: 'rt2', name: '24-Hour Reminder', type: 'reminder_24h', channel: 'both', message: 'Hi {customer_name}, reminder: your appointment at {business_name} is tomorrow at {time}. See you soon!', active: true },
  { id: 'rt3', name: '2-Hour Reminder', type: 'reminder_2h', channel: 'sms', message: 'Hi {customer_name}, your appointment at {business_name} is in 2 hours ({time}). Please arrive 5 mins early.', active: true },
  { id: 'rt4', name: 'Deposit Request', type: 'custom', channel: 'both', subject: 'Deposit Required', message: 'Hi {customer_name}, a deposit of R{deposit_amount} is required for your booking on {date}. Pay here: {payment_link}', active: true },
]

// Sample Deposit Rules
const sampleDepositRules: DepositRule[] = [
  { id: 'dr1', name: 'Default Percentage', depositType: 'percentage', depositValue: 20, minAmount: 100, nonRefundable: true, active: true },
  { id: 'dr2', name: 'High-Value Services', serviceCategory: 'Hair', depositType: 'percentage', depositValue: 30, minAmount: 500, nonRefundable: true, active: true },
  { id: 'dr3', name: 'Spa Treatments', serviceCategory: 'Spa', depositType: 'fixed', depositValue: 200, minAmount: 0, nonRefundable: false, active: true },
  { id: 'dr4', name: 'Weekend Bookings', depositType: 'percentage', depositValue: 50, minAmount: 0, nonRefundable: true, active: false },
]

// Time slots for the day
const timeSlots = Array.from({ length: 22 }, (_, i) => {
  const hour = Math.floor(8 + i / 2)
  const minute = i % 2 === 0 ? '00' : '30'
  return `${hour.toString().padStart(2, '0')}:${minute}`
})

// Props interface for booking callback
interface EnhancedBookingViewProps {
  onProceedToPOS?: (booking: {
    appointmentId: string
    serviceName: string
    servicePrice: number
    category: string
    customerName: string
    customerPhone?: string
    customerId?: string
    depositPaid?: boolean
    depositAmount?: number
  }) => void
}

export function EnhancedBookingView({ onProceedToPOS }: EnhancedBookingViewProps = {}) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedTab, setSelectedTab] = useState('calendar')
  const [selectedStylist, setSelectedStylist] = useState<string | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>(sampleAppointments)
  const [walkIns, setWalkIns] = useState<WalkIn[]>(sampleWalkIns)
  const [reminders, setReminders] = useState<SMSReminder[]>(sampleReminders)
  const [searchQuery, setSearchQuery] = useState('')
  
  // CRUD State for all Health & Beauty entities
  const [services, setServices] = useState<Service[]>(sampleServices)
  const [stylists, setStylists] = useState<Stylist[]>(sampleStylists)
  const [serviceCombos, setServiceCombos] = useState<ServiceCombo[]>(sampleServiceCombos)
  const [colourFormulas, setColourFormulas] = useState<ColourFormula[]>(sampleColourFormulas)
  const [patchTests, setPatchTests] = useState<PatchTest[]>(samplePatchTests)
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>(sampleMembershipPlans)
  const [clientMemberships, setClientMemberships] = useState<ClientMembership[]>(sampleClientMemberships)
  const [loyaltyTiers, setLoyaltyTiers] = useState<LoyaltyTier[]>(sampleLoyaltyTiers)
  const [treatmentPackages, setTreatmentPackages] = useState<TreatmentPackage[]>(sampleTreatmentPackages)
  const [clientPackages, setClientPackages] = useState<ClientPackage[]>(sampleClientPackages)
  const [giftVouchers, setGiftVouchers] = useState<GiftVoucher[]>(sampleGiftVouchers)
  const [consentForms, setConsentForms] = useState<ConsentForm[]>(sampleConsentForms)
  const [signedConsents, setSignedConsents] = useState<SignedConsent[]>(sampleSignedConsents)
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>(sampleTreatmentPlans)
  const [tattooProjects, setTattooProjects] = useState<TattooProject[]>(sampleTattooProjects)
  const [nailDesigns, setNailDesigns] = useState<NailDesign[]>(sampleNailDesigns)
  const [reminderTemplates, setReminderTemplates] = useState<ReminderTemplate[]>(sampleReminderTemplates)
  const [depositRules, setDepositRules] = useState<DepositRule[]>(sampleDepositRules)
  
  // Dialog states
  const [newBookingOpen, setNewBookingOpen] = useState(false)
  const [appointmentDetailOpen, setAppointmentDetailOpen] = useState(false)
  const [sendReminderOpen, setSendReminderOpen] = useState(false)
  const [collectDepositOpen, setCollectDepositOpen] = useState(false)
  const [widgetSettingsOpen, setWidgetSettingsOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  
  // CRUD Dialog states
  const [comboDialogOpen, setComboDialogOpen] = useState(false)
  const [packageDialogOpen, setPackageDialogOpen] = useState(false)
  const [voucherDialogOpen, setVoucherDialogOpen] = useState(false)
  const [membershipDialogOpen, setMembershipDialogOpen] = useState(false)
  const [consentDialogOpen, setConsentDialogOpen] = useState(false)
  const [projectDialogOpen, setProjectDialogOpen] = useState(false)
  const [designDialogOpen, setDesignDialogOpen] = useState(false)
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false)
  const [stylistDialogOpen, setStylistDialogOpen] = useState(false)
  const [formulaDialogOpen, setFormulaDialogOpen] = useState(false)
  const [patchTestDialogOpen, setPatchTestDialogOpen] = useState(false)
  const [tierDialogOpen, setTierDialogOpen] = useState(false)
  const [planDialogOpen, setPlanDialogOpen] = useState(false)
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [depositRuleDialogOpen, setDepositRuleDialogOpen] = useState(false)
  
  // Edit states
  const [editingCombo, setEditingCombo] = useState<ServiceCombo | null>(null)
  const [editingPackage, setEditingPackage] = useState<TreatmentPackage | null>(null)
  const [editingVoucher, setEditingVoucher] = useState<GiftVoucher | null>(null)
  const [editingMembership, setEditingMembership] = useState<MembershipPlan | null>(null)
  const [editingConsent, setEditingConsent] = useState<ConsentForm | null>(null)
  const [editingProject, setEditingProject] = useState<TattooProject | null>(null)
  const [editingDesign, setEditingDesign] = useState<NailDesign | null>(null)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [editingStylist, setEditingStylist] = useState<Stylist | null>(null)
  const [editingFormula, setEditingFormula] = useState<ColourFormula | null>(null)
  const [editingPatchTest, setEditingPatchTest] = useState<PatchTest | null>(null)
  const [editingTier, setEditingTier] = useState<LoyaltyTier | null>(null)
  const [editingPlan, setEditingPlan] = useState<TreatmentPlan | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<ReminderTemplate | null>(null)
  const [editingDepositRule, setEditingDepositRule] = useState<DepositRule | null>(null)
  
  // Form states
  const [comboForm, setComboForm] = useState({ name: '', services: [] as string[], bundledPrice: 0, discount: 10, category: 'Hair' })
  const [packageForm, setPackageForm] = useState({ name: '', description: '', price: 0, validityMonths: 6, sessionsTotal: 1 })
  const [voucherForm, setVoucherForm] = useState({ type: 'monetary' as 'monetary' | 'service', amount: 0, purchaserName: '', recipientName: '' })
  const [membershipForm, setMembershipForm] = useState({ name: '', monthlyFee: 0, rollover: false })
  const [consentForm, setConsentFormData] = useState({ name: '', treatmentTypes: '', required: true })
  const [projectForm, setProjectForm] = useState({ customerName: '', description: '', estimatedHours: 0, depositAmount: 0 })
  const [designForm, setDesignForm] = useState({ name: '', category: '', addOnPrice: 0 })
  const [serviceForm, setServiceForm] = useState({ name: '', category: '', duration: 30, price: 0, depositRequired: false, depositAmount: 0 })
  const [tierForm, setTierForm] = useState({ name: 'Bronze' as 'Bronze' | 'Silver' | 'Gold' | 'Platinum', minSpend: 0, maxSpend: 999999, earnRate: 1, birthdayDiscount: 10, perks: '' })
  const [templateForm, setTemplateForm] = useState({ name: '', type: 'confirmation' as 'confirmation' | 'reminder_24h' | 'reminder_2h' | 'custom', channel: 'both' as 'sms' | 'whatsapp' | 'both', subject: '', message: '' })
  const [depositRuleForm, setDepositRuleForm] = useState({ name: '', serviceCategory: 'all', depositType: 'percentage' as 'percentage' | 'fixed', depositValue: 20, minAmount: 0, nonRefundable: true })
  
  // Booking settings
  const [bookingSettings, setBookingSettings] = useState<BookingSettings>({
    onlineBookingEnabled: true,
    requireDeposit: true,
    defaultDepositPercentage: 20,
    sendConfirmationSMS: true,
    sendReminder24h: true,
    sendReminder2h: true,
    allowOnlineReschedule: true,
    allowOnlineCancel: true,
    cancellationPolicy: 'moderate',
    minBookingNotice: 2,
    maxAdvanceBooking: 30,
    autoConfirmBookings: false,
    sendWhatsApp: true,
    whatsappBusinessNumber: '+27123456789',
  })
  
  // New booking form
  const [newBooking, setNewBooking] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    stylistId: '',
    serviceId: '',
    date: selectedDate,
    time: '09:00',
    notes: '',
    collectDeposit: false,
    depositAmount: 0,
  })

  // Get appointments for selected date
  const dayAppointments = useMemo(() => {
    return appointments.filter(a => a.date === selectedDate)
  }, [appointments, selectedDate])

  // Stats
  const stats = useMemo(() => {
    const todayAppts = appointments.filter(a => a.date === selectedDate)
    const completed = todayAppts.filter(a => a.status === 'completed').length
    const scheduled = todayAppts.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length
    const inProgress = todayAppts.filter(a => a.status === 'in-progress').length
    const totalRevenue = todayAppts.reduce((sum, a) => sum + a.total, 0)
    const totalDeposits = todayAppts.filter(a => a.depositPaid).reduce((sum, a) => sum + (a.depositAmount || 0), 0)
    const pendingDeposits = todayAppts.filter(a => a.depositAmount && !a.depositPaid).reduce((sum, a) => sum + (a.depositAmount || 0), 0)
    const onlineBookings = todayAppts.filter(a => a.source === 'online').length
    
    return { 
      completed, 
      scheduled, 
      inProgress, 
      total: todayAppts.length, 
      totalRevenue, 
      totalDeposits,
      pendingDeposits,
      waiting: walkIns.length,
      onlineBookings,
    }
  }, [appointments, selectedDate, walkIns])

  // Get service by ID
  const getService = (id: string) => services.find(s => s.id === id)
  const getStylist = (id: string) => stylists.find(s => s.id === id)
  
  // ========== CRUD FUNCTIONS ==========
  
  // Service Combos CRUD
  const handleSaveCombo = () => {
    if (editingCombo) {
      setServiceCombos(prev => prev.map(c => c.id === editingCombo.id ? { 
        ...c, 
        ...comboForm,
        totalDuration: comboForm.services.reduce((sum, sId) => sum + (getService(sId)?.duration || 0), 0)
      } : c))
    } else {
      const newCombo: ServiceCombo = {
        id: `c${Date.now()}`,
        ...comboForm,
        totalDuration: comboForm.services.reduce((sum, sId) => sum + (getService(sId)?.duration || 0), 0)
      }
      setServiceCombos(prev => [...prev, newCombo])
    }
    setComboDialogOpen(false)
    setEditingCombo(null)
    setComboForm({ name: '', services: [], bundledPrice: 0, discount: 10, category: 'Hair' })
  }
  
  const handleDeleteCombo = (id: string) => {
    setServiceCombos(prev => prev.filter(c => c.id !== id))
  }
  
  // Treatment Packages CRUD
  const handleSavePackage = () => {
    if (editingPackage) {
      setTreatmentPackages(prev => prev.map(p => p.id === editingPackage.id ? { ...p, ...packageForm } : p))
    } else {
      const newPackage: TreatmentPackage = {
        id: `tp${Date.now()}`,
        ...packageForm,
        treatments: []
      }
      setTreatmentPackages(prev => [...prev, newPackage])
    }
    setPackageDialogOpen(false)
    setEditingPackage(null)
    setPackageForm({ name: '', description: '', price: 0, validityMonths: 6, sessionsTotal: 1 })
  }
  
  const handleDeletePackage = (id: string) => {
    setTreatmentPackages(prev => prev.filter(p => p.id !== id))
  }
  
  const handleSellPackage = (pkg: TreatmentPackage, customerId: string, customerName: string) => {
    const expiryDate = new Date()
    expiryDate.setMonth(expiryDate.getMonth() + pkg.validityMonths)
    const newClientPackage: ClientPackage = {
      id: `cp${Date.now()}`,
      customerId,
      customerName,
      packageId: pkg.id,
      packageName: pkg.name,
      purchaseDate: new Date().toISOString().split('T')[0],
      expiryDate: expiryDate.toISOString().split('T')[0],
      sessionsRemaining: pkg.sessionsTotal,
      sessionsTotal: pkg.sessionsTotal
    }
    setClientPackages(prev => [...prev, newClientPackage])
  }
  
  // Gift Vouchers CRUD
  const generateVoucherCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = 'GRW-' + new Date().getFullYear() + '-'
    for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length))
    return code
  }
  
  const handleSaveVoucher = () => {
    const expiryDate = new Date()
    expiryDate.setFullYear(expiryDate.getFullYear() + 3) // 3-year expiry per SA regulation
    
    if (editingVoucher) {
      setGiftVouchers(prev => prev.map(v => v.id === editingVoucher.id ? { ...v, ...voucherForm } : v))
    } else {
      const newVoucher: GiftVoucher = {
        id: `gv${Date.now()}`,
        code: generateVoucherCode(),
        ...voucherForm,
        balance: voucherForm.amount,
        purchaserName: voucherForm.purchaserName,
        issueDate: new Date().toISOString().split('T')[0],
        expiryDate: expiryDate.toISOString().split('T')[0],
        status: 'active'
      }
      setGiftVouchers(prev => [...prev, newVoucher])
    }
    setVoucherDialogOpen(false)
    setEditingVoucher(null)
    setVoucherForm({ type: 'monetary', amount: 0, purchaserName: '', recipientName: '' })
  }
  
  const handleDeleteVoucher = (id: string) => {
    setGiftVouchers(prev => prev.filter(v => v.id !== id))
  }
  
  const handleRedeemVoucher = (voucher: GiftVoucher, amount: number) => {
    const newBalance = voucher.balance - amount
    setGiftVouchers(prev => prev.map(v => v.id === voucher.id ? {
      ...v,
      balance: newBalance,
      status: newBalance <= 0 ? 'redeemed' : 'partial'
    } : v))
  }
  
  // Membership Plans CRUD
  const handleSaveMembership = () => {
    if (editingMembership) {
      setMembershipPlans(prev => prev.map(m => m.id === editingMembership.id ? { ...m, ...membershipForm } : m))
    } else {
      const newMembership: MembershipPlan = {
        id: `mp${Date.now()}`,
        ...membershipForm,
        includedServices: [],
        active: true
      }
      setMembershipPlans(prev => [...prev, newMembership])
    }
    setMembershipDialogOpen(false)
    setEditingMembership(null)
    setMembershipForm({ name: '', monthlyFee: 0, rollover: false })
  }
  
  const handleDeleteMembership = (id: string) => {
    setMembershipPlans(prev => prev.filter(m => m.id !== id))
  }
  
  const handleToggleMembership = (id: string) => {
    setMembershipPlans(prev => prev.map(m => m.id === id ? { ...m, active: !m.active } : m))
  }
  
  // Consent Forms CRUD
  const handleSaveConsent = () => {
    if (editingConsent) {
      setConsentForms(prev => prev.map(c => c.id === editingConsent.id ? { 
        ...c, 
        ...consentForm,
        treatmentTypes: consentForm.treatmentTypes.split(',').map(t => t.trim())
      } : c))
    } else {
      const newConsent: ConsentForm = {
        id: `cf${Date.now()}`,
        name: consentForm.name,
        treatmentTypes: consentForm.treatmentTypes.split(',').map(t => t.trim()),
        template: 'Standard consent form...',
        required: consentForm.required
      }
      setConsentForms(prev => [...prev, newConsent])
    }
    setConsentDialogOpen(false)
    setEditingConsent(null)
    setConsentFormData({ name: '', treatmentTypes: '', required: true })
  }
  
  const handleDeleteConsent = (id: string) => {
    setConsentForms(prev => prev.filter(c => c.id !== id))
  }
  
  // Tattoo Projects CRUD
  const handleSaveProject = () => {
    if (editingProject) {
      setTattooProjects(prev => prev.map(p => p.id === editingProject.id ? { ...p, ...projectForm } : p))
    } else {
      const newProject: TattooProject = {
        id: `tat${Date.now()}`,
        customerId: `c${Date.now()}`,
        customerName: projectForm.customerName,
        description: projectForm.description,
        estimatedHours: projectForm.estimatedHours,
        depositAmount: projectForm.depositAmount,
        depositPaid: false,
        sessions: [],
        referenceImages: [],
        status: 'enquiry'
      }
      setTattooProjects(prev => [...prev, newProject])
    }
    setProjectDialogOpen(false)
    setEditingProject(null)
    setProjectForm({ customerName: '', description: '', estimatedHours: 0, depositAmount: 0 })
  }
  
  const handleDeleteProject = (id: string) => {
    setTattooProjects(prev => prev.filter(p => p.id !== id))
  }
  
  const handleAddProjectSession = (projectId: string, date: string, hours: number, notes: string) => {
    setTattooProjects(prev => prev.map(p => p.id === projectId ? {
      ...p,
      sessions: [...p.sessions, { id: `ts${Date.now()}`, date, hours, notes, status: 'scheduled' }]
    } : p))
  }
  
  const handleCompleteSession = (projectId: string, sessionId: string) => {
    setTattooProjects(prev => prev.map(p => p.id === projectId ? {
      ...p,
      sessions: p.sessions.map(s => s.id === sessionId ? { ...s, status: 'completed' as const } : s)
    } : p))
  }
  
  // Nail Designs CRUD
  const handleSaveDesign = () => {
    if (editingDesign) {
      setNailDesigns(prev => prev.map(d => d.id === editingDesign.id ? { ...d, ...designForm } : d))
    } else {
      const newDesign: NailDesign = {
        id: `nd${Date.now()}`,
        ...designForm,
        imageUrl: '/designs/placeholder.jpg',
        popularity: 50
      }
      setNailDesigns(prev => [...prev, newDesign])
    }
    setDesignDialogOpen(false)
    setEditingDesign(null)
    setDesignForm({ name: '', category: '', addOnPrice: 0 })
  }
  
  const handleDeleteDesign = (id: string) => {
    setNailDesigns(prev => prev.filter(d => d.id !== id))
  }
  
  // Services CRUD
  const handleSaveService = () => {
    if (editingService) {
      setServices(prev => prev.map(s => s.id === editingService.id ? { ...s, ...serviceForm, id: editingService.id } : s))
    } else {
      const newService: Service = {
        id: `sv${Date.now()}`,
        ...serviceForm
      }
      setServices(prev => [...prev, newService])
    }
    setServiceDialogOpen(false)
    setEditingService(null)
    setServiceForm({ name: '', category: '', duration: 30, price: 0, depositRequired: false, depositAmount: 0 })
  }
  
  const handleDeleteService = (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id))
  }
  
  // Stylists CRUD
  const handleSaveStylist = (stylist: Partial<Stylist>) => {
    if (editingStylist) {
      setStylists(prev => prev.map(s => s.id === editingStylist.id ? { ...s, ...stylist } : s))
    } else {
      const newStylist: Stylist = {
        id: `s${Date.now()}`,
        name: stylist.name || '',
        avatar: '👤',
        specialties: stylist.specialties || [],
        rating: 4.5,
        status: 'available',
        color: '#00897B',
        ...stylist
      }
      setStylists(prev => [...prev, newStylist])
    }
    setStylistDialogOpen(false)
    setEditingStylist(null)
  }
  
  const handleDeleteStylist = (id: string) => {
    setStylists(prev => prev.filter(s => s.id !== id))
  }
  
  // Colour Formulas CRUD
  const handleSaveFormula = (formula: Partial<ColourFormula>) => {
    if (editingFormula) {
      setColourFormulas(prev => prev.map(f => f.id === editingFormula.id ? { ...f, ...formula } : f))
    } else {
      const newFormula: ColourFormula = {
        id: `cf${Date.now()}`,
        customerId: `c${Date.now()}`,
        lastUsed: new Date().toISOString().split('T')[0],
        stylistId: '',
        ...formula
      } as ColourFormula
      setColourFormulas(prev => [...prev, newFormula])
    }
    setFormulaDialogOpen(false)
    setEditingFormula(null)
  }
  
  const handleDeleteFormula = (id: string) => {
    setColourFormulas(prev => prev.filter(f => f.id !== id))
  }
  
  // Patch Tests CRUD
  const handleSavePatchTest = (test: Partial<PatchTest>) => {
    if (editingPatchTest) {
      setPatchTests(prev => prev.map(t => t.id === editingPatchTest.id ? { ...t, ...test } : t))
    } else {
      const expiryDate = new Date()
      expiryDate.setMonth(expiryDate.getMonth() + 6)
      const newTest: PatchTest = {
        id: `pt${Date.now()}`,
        customerId: `c${Date.now()}`,
        testDate: new Date().toISOString().split('T')[0],
        expiryDate: expiryDate.toISOString().split('T')[0],
        status: 'valid',
        products: [],
        ...test
      } as PatchTest
      setPatchTests(prev => [...prev, newTest])
    }
    setPatchTestDialogOpen(false)
    setEditingPatchTest(null)
  }
  
  const handleDeletePatchTest = (id: string) => {
    setPatchTests(prev => prev.filter(t => t.id !== id))
  }
  
  // Loyalty Tiers CRUD
  const handleSaveTier = () => {
    const perksArray = tierForm.perks.split(',').map(p => p.trim()).filter(p => p)
    
    if (editingTier) {
      setLoyaltyTiers(prev => prev.map(t => t.id === editingTier.id ? { 
        ...t, 
        name: tierForm.name,
        minSpend: tierForm.minSpend,
        maxSpend: tierForm.maxSpend,
        earnRate: tierForm.earnRate,
        birthdayDiscount: tierForm.birthdayDiscount,
        perks: perksArray
      } : t))
    } else {
      const newTier: LoyaltyTier = {
        id: `lt${Date.now()}`,
        name: tierForm.name,
        minSpend: tierForm.minSpend,
        maxSpend: tierForm.maxSpend,
        earnRate: tierForm.earnRate,
        birthdayDiscount: tierForm.birthdayDiscount,
        perks: perksArray
      }
      setLoyaltyTiers(prev => [...prev, newTier])
    }
    setTierDialogOpen(false)
    setEditingTier(null)
    setTierForm({ name: 'Bronze', minSpend: 0, maxSpend: 999999, earnRate: 1, birthdayDiscount: 10, perks: '' })
  }
  
  const handleDeleteTier = (id: string) => {
    setLoyaltyTiers(prev => prev.filter(t => t.id !== id))
  }
  
  // Treatment Plans CRUD
  const handleSavePlan = (plan: Partial<TreatmentPlan>) => {
    if (editingPlan) {
      setTreatmentPlans(prev => prev.map(p => p.id === editingPlan.id ? { ...p, ...plan } : p))
    } else {
      const newPlan: TreatmentPlan = {
        id: `tp${Date.now()}`,
        customerId: `c${Date.now()}`,
        totalSessions: 1,
        completedSessions: 0,
        startDate: new Date().toISOString().split('T')[0],
        estimatedEndDate: '',
        treatments: [],
        ...plan
      } as TreatmentPlan
      setTreatmentPlans(prev => [...prev, newPlan])
    }
    setPlanDialogOpen(false)
    setEditingPlan(null)
  }
  
  const handleDeletePlan = (id: string) => {
    setTreatmentPlans(prev => prev.filter(p => p.id !== id))
  }
  
  const handleCompletePlanSession = (planId: string) => {
    setTreatmentPlans(prev => prev.map(p => p.id === planId ? {
      ...p,
      completedSessions: Math.min(p.completedSessions + 1, p.totalSessions)
    } : p))
  }

  // Reminder Templates CRUD
  const handleSaveTemplate = () => {
    if (editingTemplate) {
      setReminderTemplates(prev => prev.map(t => t.id === editingTemplate.id ? { 
        ...t, 
        name: templateForm.name,
        type: templateForm.type,
        channel: templateForm.channel,
        subject: templateForm.subject,
        message: templateForm.message
      } : t))
    } else {
      const newTemplate: ReminderTemplate = {
        id: `rt${Date.now()}`,
        name: templateForm.name,
        type: templateForm.type,
        channel: templateForm.channel,
        subject: templateForm.subject,
        message: templateForm.message,
        active: true
      }
      setReminderTemplates(prev => [...prev, newTemplate])
    }
    setTemplateDialogOpen(false)
    setEditingTemplate(null)
    setTemplateForm({ name: '', type: 'confirmation', channel: 'both', subject: '', message: '' })
  }
  
  const handleDeleteTemplate = (id: string) => {
    setReminderTemplates(prev => prev.filter(t => t.id !== id))
  }
  
  const handleToggleTemplate = (id: string) => {
    setReminderTemplates(prev => prev.map(t => t.id === id ? { ...t, active: !t.active } : t))
  }

  // Deposit Rules CRUD
  const handleSaveDepositRule = () => {
    if (editingDepositRule) {
      setDepositRules(prev => prev.map(r => r.id === editingDepositRule.id ? { 
        ...r, 
        name: depositRuleForm.name,
        serviceCategory: depositRuleForm.serviceCategory,
        depositType: depositRuleForm.depositType,
        depositValue: depositRuleForm.depositValue,
        minAmount: depositRuleForm.minAmount,
        nonRefundable: depositRuleForm.nonRefundable
      } : r))
    } else {
      const newRule: DepositRule = {
        id: `dr${Date.now()}`,
        name: depositRuleForm.name,
        serviceCategory: depositRuleForm.serviceCategory,
        depositType: depositRuleForm.depositType,
        depositValue: depositRuleForm.depositValue,
        minAmount: depositRuleForm.minAmount,
        nonRefundable: depositRuleForm.nonRefundable,
        active: true
      }
      setDepositRules(prev => [...prev, newRule])
    }
    setDepositRuleDialogOpen(false)
    setEditingDepositRule(null)
    setDepositRuleForm({ name: '', serviceCategory: '', depositType: 'percentage', depositValue: 20, minAmount: 0, nonRefundable: true })
  }
  
  const handleDeleteDepositRule = (id: string) => {
    setDepositRules(prev => prev.filter(r => r.id !== id))
  }
  
  const handleToggleDepositRule = (id: string) => {
    setDepositRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r))
  }

  // Navigate dates
  const navigateDate = (direction: 'prev' | 'next') => {
    const current = new Date(selectedDate)
    current.setDate(current.getDate() + (direction === 'next' ? 1 : -1))
    setSelectedDate(current.toISOString().split('T')[0])
  }

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  // Generate Widget Embed Code
  const generateWidgetCode = () => {
    const businessName = "Nomsa's Beauty Salon"
    const primaryColor = "#00897B"
    
    return `<!-- Groway Booking Widget -->
<script src="https://booking.groway.co.za/widget.js"></script>
<script>
  GrowayBooking.init({
    businessId: 'biz_abc123',
    businessName: '${businessName}',
    primaryColor: '${primaryColor}',
    position: 'bottom-right',
    showServices: true,
    showStaff: true,
    requireDeposit: ${bookingSettings.requireDeposit},
    depositPercentage: ${bookingSettings.defaultDepositPercentage},
    allowReschedule: ${bookingSettings.allowOnlineReschedule},
    allowCancel: ${bookingSettings.allowOnlineCancel},
    cancellationPolicy: '${bookingSettings.cancellationPolicy}',
    minNotice: ${bookingSettings.minBookingNotice},
    maxAdvance: ${bookingSettings.maxAdvanceBooking},
    language: 'en-ZA',
    currency: 'ZAR'
  });
</script>
<!-- End Groway Booking Widget -->`
  }

  // Generate Online Booking Page URL
  const generateBookingPageUrl = () => {
    return `https://book.groway.co.za/nomsa-beauty-salon`
  }

  // Create new appointment
  const handleCreateBooking = () => {
    const service = getService(newBooking.serviceId)
    if (!service) return

    const depositAmount = newBooking.collectDeposit ? 
      (service.depositAmount || Math.round(service.price * (bookingSettings.defaultDepositPercentage / 100))) : 0

    const appointment: Appointment = {
      id: `a${Date.now()}`,
      customerId: `c${Date.now()}`,
      customerName: newBooking.customerName,
      customerPhone: newBooking.customerPhone,
      customerEmail: newBooking.customerEmail,
      stylistId: newBooking.stylistId,
      serviceId: newBooking.serviceId,
      date: newBooking.date,
      time: newBooking.time,
      duration: service.duration,
      status: 'scheduled',
      notes: newBooking.notes,
      total: service.price,
      depositAmount: depositAmount,
      depositPaid: false,
      source: 'in-store',
    }

    setAppointments(prev => [...prev, appointment])
    setNewBookingOpen(false)
    setNewBooking({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      stylistId: '',
      serviceId: '',
      date: selectedDate,
      time: '09:00',
      notes: '',
      collectDeposit: false,
      depositAmount: 0,
    })
  }

  // Update appointment status
  const updateAppointmentStatus = (id: string, status: Appointment['status']) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a))
  }

  // Send SMS Reminder
  const handleSendReminder = (appointmentId: string, type: 'confirmation' | 'reminder_24h' | 'reminder_2h') => {
    const appointment = appointments.find(a => a.id === appointmentId)
    if (!appointment) return
    
    const service = getService(appointment.serviceId)
    const reminder: SMSReminder = {
      id: `r${Date.now()}`,
      appointmentId,
      customerName: appointment.customerName,
      customerPhone: appointment.customerPhone,
      service: service?.name || '',
      date: appointment.date,
      time: appointment.time,
      sentAt: new Date().toISOString(),
      status: 'sent',
      type,
    }
    
    setReminders(prev => [...prev, reminder])
    
    // Update appointment reminder status
    if (type === 'reminder_24h') {
      setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, reminderSent: true, reminderSentAt: new Date().toISOString() } : a))
    } else if (type === 'reminder_2h') {
      setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, secondReminderSent: true } : a))
    }
    
    setSendReminderOpen(false)
  }

  // Collect Deposit
  const handleCollectDeposit = (method: 'online' | 'in-store' | 'wallet') => {
    if (!selectedAppointment) return
    
    setAppointments(prev => prev.map(a => 
      a.id === selectedAppointment.id ? { 
        ...a, 
        depositPaid: true, 
        depositMethod: method,
        status: 'confirmed'
      } : a
    ))
    
    setCollectDepositOpen(false)
    setAppointmentDetailOpen(false)
  }

  // Call walk-in
  const callWalkIn = (id: string) => {
    setWalkIns(prev => prev.map(w => w.id === id ? { ...w, status: 'called' } : w))
  }

  // Available time slots (not booked)
  const getAvailableSlots = (stylistId: string) => {
    const stylistAppts = dayAppointments.filter(a => a.stylistId === stylistId)
    const bookedTimes = stylistAppts.map(a => a.time)
    return timeSlots.filter(t => !bookedTimes.includes(t))
  }

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  // Render calendar grid
  const renderCalendarGrid = () => {
    const hours = Array.from({ length: 11 }, (_, i) => i + 8) // 8 AM to 6 PM
    
    return (
      <div className="relative overflow-auto">
        {/* Time column */}
        <div className="flex">
          <div className="w-16 flex-shrink-0 border-r border-gray-200">
            <div className="h-12 border-b border-gray-200 bg-gray-50" />
            {hours.map(hour => (
              <div key={hour} className="h-16 border-b border-gray-100 flex items-start justify-end pr-2 pt-1">
                <span className="text-xs text-gray-500">{hour.toString().padStart(2, '0')}:00</span>
              </div>
            ))}
          </div>

          {/* Stylist columns */}
          <div className="flex-1 flex overflow-x-auto">
            {sampleStylists.filter(s => s.status !== 'off').map(stylist => (
              <div key={stylist.id} className="w-48 flex-shrink-0 border-r border-gray-200">
                {/* Stylist header */}
                <div 
                  className="h-12 border-b border-gray-200 p-2 flex items-center gap-2 cursor-pointer hover:bg-gray-50"
                  style={{ backgroundColor: stylist.status === 'available' ? `${stylist.color}10` : 'transparent' }}
                  onClick={() => setSelectedStylist(stylist.id)}
                >
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                    style={{ backgroundColor: stylist.color + '20' }}
                  >
                    {stylist.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#1A1A1A] truncate">{stylist.name}</p>
                    <div className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        stylist.status === 'available' ? 'bg-green-500' :
                        stylist.status === 'busy' ? 'bg-amber-500' :
                        stylist.status === 'break' ? 'bg-blue-500' : 'bg-gray-300'
                      }`} />
                      <span className="text-[9px] text-gray-500 capitalize">{stylist.status}</span>
                    </div>
                  </div>
                </div>

                {/* Time slots */}
                <div className="relative">
                  {hours.map(hour => (
                    <div key={hour} className="h-16 border-b border-gray-100 hover:bg-gray-50" />
                  ))}

                  {/* Appointments */}
                  {dayAppointments
                    .filter(a => a.stylistId === stylist.id)
                    .map(appointment => {
                      const service = getService(appointment.serviceId)
                      const startHour = parseInt(appointment.time.split(':')[0])
                      const startMinute = parseInt(appointment.time.split(':')[1])
                      const top = ((startHour - 8) * 64) + (startMinute / 60 * 64)
                      const height = (appointment.duration / 60) * 64

                      return (
                        <div
                          key={appointment.id}
                          className={`absolute left-1 right-1 rounded-md p-1.5 cursor-pointer overflow-hidden ${
                            appointment.status === 'completed' ? 'bg-green-100 border border-green-200' :
                            appointment.status === 'in-progress' ? 'bg-blue-100 border border-blue-200' :
                            appointment.status === 'cancelled' ? 'bg-red-50 border border-red-200 opacity-50' :
                            appointment.source === 'online' ? 'bg-purple-100 border border-purple-200' :
                            'bg-[#00897B]/10 border border-[#00897B]/30'
                          }`}
                          style={{ top, height }}
                          onClick={() => {
                            setSelectedAppointment(appointment)
                            setAppointmentDetailOpen(true)
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-medium text-[#1A1A1A] truncate">
                              {appointment.customerName}
                            </p>
                            {appointment.depositPaid && (
                              <Coins className="h-3 w-3 text-green-600" />
                            )}
                            {appointment.source === 'online' && (
                              <Globe className="h-3 w-3 text-purple-600" />
                            )}
                          </div>
                          <p className="text-[9px] text-gray-600 truncate">
                            {service?.name}
                          </p>
                          <p className="text-[9px] text-[#00897B] font-medium">
                            {appointment.time} ({appointment.duration}min)
                          </p>
                        </div>
                      )
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#1A1A1A] flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#00897B]" />
              Booking & Appointments
            </h1>
            <p className="text-sm text-[#757575]">Manage appointments, online bookings, deposits & SMS reminders</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setWidgetSettingsOpen(true)}>
              <Code className="h-4 w-4" />
              Online Widget
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Eye className="h-4 w-4" />
              Today
            </Button>
            <Button 
              className="bg-[#00897B] hover:bg-[#00695C] gap-2"
              onClick={() => setNewBookingOpen(true)}
            >
              <Plus className="h-4 w-4" />
              New Booking
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-8 gap-3 px-6 py-3 bg-gray-50 border-b border-gray-200">
        <Card className="p-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#1A1A1A]">{stats.total}</p>
              <p className="text-[10px] text-[#757575]">Today's Bookings</p>
            </div>
          </div>
        </Card>
        <Card className="p-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#1A1A1A]">{stats.scheduled}</p>
              <p className="text-[10px] text-[#757575]">Scheduled</p>
            </div>
          </div>
        </Card>
        <Card className="p-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
              <Globe className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#1A1A1A]">{stats.onlineBookings}</p>
              <p className="text-[10px] text-[#757575]">Online Bookings</p>
            </div>
          </div>
        </Card>
        <Card className="p-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
              <Coins className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#1A1A1A]">R{stats.totalDeposits}</p>
              <p className="text-[10px] text-[#757575]">Deposits Collected</p>
            </div>
          </div>
        </Card>
        <Card className="p-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
              <AlertCircle className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#1A1A1A]">R{stats.pendingDeposits}</p>
              <p className="text-[10px] text-[#757575]">Pending Deposits</p>
            </div>
          </div>
        </Card>
        <Card className="p-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#1A1A1A]">{stats.waiting}</p>
              <p className="text-[10px] text-[#757575]">Walk-ins</p>
            </div>
          </div>
        </Card>
        <Card className="p-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#1A1A1A]">{stats.completed}</p>
              <p className="text-[10px] text-[#757575]">Completed</p>
            </div>
          </div>
        </Card>
        <Card className="p-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#00897B]/10 text-[#00897B] flex items-center justify-center">
              <span className="text-sm font-bold">R</span>
            </div>
            <div>
              <p className="text-lg font-bold text-[#1A1A1A]">R{stats.totalRevenue.toLocaleString()}</p>
              <p className="text-[10px] text-[#757575]">Revenue</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col">
        <div className="px-6 pt-4 border-b border-gray-200">
          <TabsList className="bg-transparent">
            <TabsTrigger value="calendar" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <Calendar className="h-4 w-4 mr-2" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="list" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <Clock className="h-4 w-4 mr-2" />
              List View
            </TabsTrigger>
            <TabsTrigger value="online" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <Globe className="h-4 w-4 mr-2" />
              Online Bookings
            </TabsTrigger>
            <TabsTrigger value="reminders" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <Bell className="h-4 w-4 mr-2" />
              SMS Reminders
            </TabsTrigger>
            <TabsTrigger value="deposits" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <CreditCard className="h-4 w-4 mr-2" />
              Deposits
            </TabsTrigger>
            <TabsTrigger value="walkins" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <Users className="h-4 w-4 mr-2" />
              Walk-in Queue
            </TabsTrigger>
            <TabsTrigger value="services" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <Scissors className="h-4 w-4 mr-2" />
              Services
            </TabsTrigger>
            <TabsTrigger value="combos" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <PackageIcon className="h-4 w-4 mr-2" />
              Combos
            </TabsTrigger>
            <TabsTrigger value="packages" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <Gift className="h-4 w-4 mr-2" />
              Packages
            </TabsTrigger>
            <TabsTrigger value="vouchers" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <Ticket className="h-4 w-4 mr-2" />
              Vouchers
            </TabsTrigger>
            <TabsTrigger value="memberships" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <CreditCard className="h-4 w-4 mr-2" />
              Memberships
            </TabsTrigger>
            <TabsTrigger value="loyalty" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <Star className="h-4 w-4 mr-2" />
              Loyalty
            </TabsTrigger>
            <TabsTrigger value="consent" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <FileText className="h-4 w-4 mr-2" />
              Consent
            </TabsTrigger>
            <TabsTrigger value="projects" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <Palette className="h-4 w-4 mr-2" />
              Projects
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="calendar" className="flex-1 m-0 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Date Navigation */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" onClick={() => navigateDate('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-center">
                  <p className="text-sm font-medium text-[#1A1A1A]">{formatDate(selectedDate)}</p>
                </div>
                <Button variant="outline" size="icon" onClick={() => navigateDate('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-xs text-[#757575]">
                  <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-purple-100 border border-purple-200" /> Online</span>
                  <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-[#00897B]/10 border border-[#00897B]/30" /> In-Store</span>
                  <span className="flex items-center gap-1"><Coins className="h-3 w-3 text-green-600" /> Deposit</span>
                </div>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-md"
                />
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-auto">
              {renderCalendarGrid()}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="list" className="flex-1 m-0 overflow-auto p-6">
          <div className="space-y-3">
            {dayAppointments.map(appointment => {
              const stylist = getStylist(appointment.stylistId)
              const service = getService(appointment.serviceId)
              
              return (
                <Card key={appointment.id} className="cursor-pointer hover:border-[#00897B] transition-colors"
                  onClick={() => {
                    setSelectedAppointment(appointment)
                    setAppointmentDetailOpen(true)
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-[#E0F2F1] text-[#00897B] flex items-center justify-center text-lg">
                          {stylist?.avatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-[#1A1A1A]">{appointment.customerName}</p>
                            {appointment.source === 'online' && (
                              <Badge className="bg-purple-100 text-purple-700 text-[10px]">Online</Badge>
                            )}
                            {appointment.depositPaid && (
                              <Badge className="bg-green-100 text-green-700 text-[10px]">Deposit</Badge>
                            )}
                          </div>
                          <p className="text-sm text-[#757575]">{service?.name} • {stylist?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium text-[#1A1A1A]">{appointment.time}</p>
                          <p className="text-sm text-[#757575]">{appointment.duration} min</p>
                        </div>
                        <Badge className={
                          appointment.status === 'completed' ? 'bg-green-100 text-green-700' :
                          appointment.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                          appointment.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          appointment.status === 'confirmed' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-700'
                        }>
                          {appointment.status}
                        </Badge>
                        <p className="font-bold text-[#00897B]">R{appointment.total}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Online Bookings Tab */}
        <TabsContent value="online" className="flex-1 m-0 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Online Booking Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Online Booking Settings
                </CardTitle>
                <CardDescription>
                  Configure how customers can book online
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Online Booking</Label>
                    <p className="text-xs text-[#757575]">Allow customers to book through your website</p>
                  </div>
                  <Switch 
                    checked={bookingSettings.onlineBookingEnabled}
                    onCheckedChange={(checked) => setBookingSettings(prev => ({ ...prev, onlineBookingEnabled: checked }))}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Deposit</Label>
                    <p className="text-xs text-[#757575]">Require deposit for online bookings</p>
                  </div>
                  <Switch 
                    checked={bookingSettings.requireDeposit}
                    onCheckedChange={(checked) => setBookingSettings(prev => ({ ...prev, requireDeposit: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Default Deposit %</Label>
                    <p className="text-xs text-[#757575]">Percentage of service price</p>
                  </div>
                  <Select 
                    value={bookingSettings.defaultDepositPercentage.toString()}
                    onValueChange={(v) => setBookingSettings(prev => ({ ...prev, defaultDepositPercentage: parseInt(v) }))}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10%</SelectItem>
                      <SelectItem value="20">20%</SelectItem>
                      <SelectItem value="25">25%</SelectItem>
                      <SelectItem value="30">30%</SelectItem>
                      <SelectItem value="50">50%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-Confirm Bookings</Label>
                    <p className="text-xs text-[#757575]">Automatically confirm online bookings</p>
                  </div>
                  <Switch 
                    checked={bookingSettings.autoConfirmBookings}
                    onCheckedChange={(checked) => setBookingSettings(prev => ({ ...prev, autoConfirmBookings: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow Rescheduling</Label>
                    <p className="text-xs text-[#757575]">Let customers reschedule online</p>
                  </div>
                  <Switch 
                    checked={bookingSettings.allowOnlineReschedule}
                    onCheckedChange={(checked) => setBookingSettings(prev => ({ ...prev, allowOnlineReschedule: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow Cancellation</Label>
                    <p className="text-xs text-[#757575]">Let customers cancel online</p>
                  </div>
                  <Switch 
                    checked={bookingSettings.allowOnlineCancel}
                    onCheckedChange={(checked) => setBookingSettings(prev => ({ ...prev, allowOnlineCancel: checked }))}
                  />
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Min. Notice (hours)</Label>
                    <Input 
                      type="number" 
                      value={bookingSettings.minBookingNotice}
                      onChange={(e) => setBookingSettings(prev => ({ ...prev, minBookingNotice: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label>Max. Advance (days)</Label>
                    <Input 
                      type="number" 
                      value={bookingSettings.maxAdvanceBooking}
                      onChange={(e) => setBookingSettings(prev => ({ ...prev, maxAdvanceBooking: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>
                <div>
                  <Label>Cancellation Policy</Label>
                  <Select 
                    value={bookingSettings.cancellationPolicy}
                    onValueChange={(v: 'flexible' | 'moderate' | 'strict') => setBookingSettings(prev => ({ ...prev, cancellationPolicy: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flexible">Flexible - Full refund 24h before</SelectItem>
                      <SelectItem value="moderate">Moderate - 50% refund 24h before</SelectItem>
                      <SelectItem value="strict">Strict - No refund within 48h</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Widget Embed Code */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Website Widget
                  </CardTitle>
                  <CardDescription>
                    Add booking widget to your website
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-gray-900 rounded-lg">
                    <pre className="text-xs text-green-400 overflow-x-auto whitespace-pre-wrap">
                      {generateWidgetCode()}
                    </pre>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full gap-2"
                    onClick={() => copyToClipboard(generateWidgetCode())}
                  >
                    <Copy className="h-4 w-4" />
                    Copy Widget Code
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Booking Page URL
                  </CardTitle>
                  <CardDescription>
                    Share your direct booking page
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input value={generateBookingPageUrl()} readOnly />
                    <Button 
                      variant="outline"
                      onClick={() => copyToClipboard(generateBookingPageUrl())}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button variant="outline" className="w-full gap-2" asChild>
                    <a href={generateBookingPageUrl()} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      Preview Booking Page
                    </a>
                  </Button>
                </CardContent>
              </Card>

              {/* Online Booking Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Online Booking Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-purple-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-purple-700">{stats.onlineBookings}</p>
                      <p className="text-xs text-purple-600">Today's Online</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-green-700">87%</p>
                      <p className="text-xs text-green-600">Confirmation Rate</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-blue-700">R450</p>
                      <p className="text-xs text-blue-600">Avg. Online Value</p>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-amber-700">15%</p>
                      <p className="text-xs text-amber-600">No-show Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* SMS Reminders Tab */}
        <TabsContent value="reminders" className="flex-1 m-0 overflow-auto p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#1A1A1A]">SMS & WhatsApp Reminders</h3>
                <p className="text-sm text-[#757575]">Manage automated reminders and templates</p>
              </div>
              <Button 
                className="bg-[#00897B] hover:bg-[#00695C] gap-2"
                onClick={() => {
                  setEditingTemplate(null)
                  setTemplateForm({ name: '', type: 'confirmation', channel: 'both', subject: '', message: '' })
                  setTemplateDialogOpen(true)
                }}
              >
                <Plus className="h-4 w-4" />
                Create Template
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Reminder Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BellRing className="h-4 w-4" />
                    Reminder Settings
                  </CardTitle>
                  <CardDescription>
                    Configure automatic reminders
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Confirmation SMS</Label>
                      <p className="text-xs text-[#757575]">Send when booking is made</p>
                    </div>
                    <Switch 
                      checked={bookingSettings.sendConfirmationSMS}
                      onCheckedChange={(checked) => setBookingSettings(prev => ({ ...prev, sendConfirmationSMS: checked }))}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>24-Hour Reminder</Label>
                      <p className="text-xs text-[#757575]">Send 24 hours before</p>
                    </div>
                    <Switch 
                      checked={bookingSettings.sendReminder24h}
                      onCheckedChange={(checked) => setBookingSettings(prev => ({ ...prev, sendReminder24h: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>2-Hour Reminder</Label>
                      <p className="text-xs text-[#757575]">Send 2 hours before</p>
                    </div>
                    <Switch 
                      checked={bookingSettings.sendReminder2h}
                      onCheckedChange={(checked) => setBookingSettings(prev => ({ ...prev, sendReminder2h: checked }))}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>WhatsApp Reminders</Label>
                      <p className="text-xs text-[#757575]">Send via WhatsApp</p>
                    </div>
                    <Switch 
                      checked={bookingSettings.sendWhatsApp}
                      onCheckedChange={(checked) => setBookingSettings(prev => ({ ...prev, sendWhatsApp: checked }))}
                    />
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-green-700 font-medium">WhatsApp Business API</p>
                    <p className="text-xs text-green-600">Connected • R0.15 per message</p>
                  </div>
                </CardContent>
              </Card>

              {/* Reminder Templates */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Message Templates
                  </CardTitle>
                  <CardDescription>
                    Customizable message templates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {reminderTemplates.map(template => (
                        <div key={template.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            template.channel === 'sms' ? 'bg-blue-100 text-blue-600' :
                            template.channel === 'whatsapp' ? 'bg-green-100 text-green-600' :
                            'bg-purple-100 text-purple-600'
                          }`}>
                            {template.channel === 'sms' ? <Smartphone className="h-4 w-4" /> :
                             template.channel === 'whatsapp' ? <MessageSquare className="h-4 w-4" /> :
                             <Send className="h-4 w-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-[#1A1A1A]">{template.name}</p>
                              <Badge className={
                                template.type === 'confirmation' ? 'bg-blue-100 text-blue-700' :
                                template.type === 'reminder_24h' ? 'bg-amber-100 text-amber-700' :
                                template.type === 'reminder_2h' ? 'bg-purple-100 text-purple-700' :
                                'bg-gray-100 text-gray-700'
                              }>
                                {template.type.replace('_', ' ')}
                              </Badge>
                              <Badge className={template.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                                {template.active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <p className="text-xs text-[#757575] mt-1 line-clamp-2">{template.message}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7"
                              onClick={() => {
                                setEditingTemplate(template)
                                setTemplateForm({ 
                                  name: template.name, 
                                  type: template.type, 
                                  channel: template.channel, 
                                  subject: template.subject || '', 
                                  message: template.message 
                                })
                                setTemplateDialogOpen(true)
                              }}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7"
                              onClick={() => handleToggleTemplate(template.id)}
                            >
                              <Settings className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteTemplate(template.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Reminder History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Reminder History
                </CardTitle>
                <CardDescription>
                  Recently sent reminders
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  <div className="space-y-3">
                    {reminders.map(reminder => (
                      <div key={reminder.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          reminder.type === 'confirmation' ? 'bg-blue-100 text-blue-600' :
                          reminder.type === 'reminder_24h' ? 'bg-amber-100 text-amber-600' :
                          'bg-purple-100 text-purple-600'
                        }`}>
                          {reminder.type === 'confirmation' ? <Check className="h-4 w-4" /> :
                           reminder.type === 'reminder_24h' ? <Bell className="h-4 w-4" /> :
                           <BellRing className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[#1A1A1A]">{reminder.customerName}</p>
                          <p className="text-xs text-[#757575]">{reminder.service} • {reminder.date} at {reminder.time}</p>
                        </div>
                        <div className="text-right">
                          <Badge className={
                            reminder.status === 'delivered' ? 'bg-green-100 text-green-700' :
                            reminder.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                            'bg-red-100 text-red-700'
                          }>
                            {reminder.status}
                          </Badge>
                          <p className="text-xs text-[#757575] mt-1">
                            {reminder.type === 'confirmation' ? 'Confirmation' :
                             reminder.type === 'reminder_24h' ? '24h Reminder' : '2h Reminder'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Deposits Tab */}
        <TabsContent value="deposits" className="flex-1 m-0 overflow-auto p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#1A1A1A]">Deposit Management</h3>
                <p className="text-sm text-[#757575]">Configure deposit rules and track deposits</p>
              </div>
              <Button 
                className="bg-[#00897B] hover:bg-[#00695C] gap-2"
                onClick={() => {
                  setEditingDepositRule(null)
                  setDepositRuleForm({ name: '', serviceCategory: '', depositType: 'percentage', depositValue: 20, minAmount: 0, nonRefundable: true })
                  setDepositRuleDialogOpen(true)
                }}
              >
                <Plus className="h-4 w-4" />
                Add Deposit Rule
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Deposit Summary */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      Deposit Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-xl font-bold text-green-700">R{stats.totalDeposits}</p>
                        <p className="text-xs text-green-600">Collected Today</p>
                      </div>
                      <div className="p-3 bg-red-50 rounded-lg">
                        <p className="text-xl font-bold text-red-700">R{stats.pendingDeposits}</p>
                        <p className="text-xs text-red-600">Pending</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#757575]">Deposits Required</span>
                        <span className="font-medium">{dayAppointments.filter(a => a.depositAmount).length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#757575]">Deposits Paid</span>
                        <span className="font-medium text-green-600">{dayAppointments.filter(a => a.depositPaid).length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#757575]">Deposit Rate</span>
                        <span className="font-medium">
                          {dayAppointments.filter(a => a.depositAmount).length > 0 ?
                            Math.round((dayAppointments.filter(a => a.depositPaid).length / dayAppointments.filter(a => a.depositAmount).length) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Percent className="h-4 w-4" />
                      Deposit Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Require Deposits</Label>
                      <Switch 
                        checked={bookingSettings.requireDeposit}
                        onCheckedChange={(checked) => setBookingSettings(prev => ({ ...prev, requireDeposit: checked }))}
                      />
                    </div>
                    <div>
                      <Label>Default Percentage</Label>
                      <Select 
                        value={bookingSettings.defaultDepositPercentage.toString()}
                        onValueChange={(v) => setBookingSettings(prev => ({ ...prev, defaultDepositPercentage: parseInt(v) }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10%</SelectItem>
                          <SelectItem value="20">20%</SelectItem>
                          <SelectItem value="25">25%</SelectItem>
                          <SelectItem value="30">30%</SelectItem>
                          <SelectItem value="50">50%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-lg">
                      <p className="text-xs text-amber-700">
                        Deposits are non-refundable if customer no-shows. 
                        Deposits can be applied to final bill.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Deposit Rules */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Deposit Rules
                  </CardTitle>
                  <CardDescription>
                    Configure deposit requirements by service
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-48">
                    <div className="space-y-3">
                      {depositRules.map(rule => (
                        <div key={rule.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            rule.depositType === 'percentage' ? 'bg-purple-100 text-purple-600' : 'bg-amber-100 text-amber-600'
                          }`}>
                            {rule.depositType === 'percentage' ? <Percent className="h-4 w-4" /> : <Coins className="h-4 w-4" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-[#1A1A1A]">{rule.name}</p>
                              <Badge className={rule.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                                {rule.active ? 'Active' : 'Inactive'}
                              </Badge>
                              {rule.nonRefundable && (
                                <Badge className="bg-amber-100 text-amber-700">Non-refundable</Badge>
                              )}
                            </div>
                            <p className="text-xs text-[#757575]">
                              {rule.serviceCategory || 'All services'} • 
                              {rule.depositType === 'percentage' ? ` ${rule.depositValue}% deposit` : ` R${rule.depositValue} fixed`}
                              {rule.minAmount > 0 && ` • Min: R${rule.minAmount}`}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7"
                              onClick={() => {
                                setEditingDepositRule(rule)
                                setDepositRuleForm({ 
                                  name: rule.name, 
                                  serviceCategory: rule.serviceCategory || '', 
                                  depositType: rule.depositType, 
                                  depositValue: rule.depositValue, 
                                  minAmount: rule.minAmount, 
                                  nonRefundable: rule.nonRefundable 
                                })
                                setDepositRuleDialogOpen(true)
                              }}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7"
                              onClick={() => handleToggleDepositRule(rule.id)}
                            >
                              <Settings className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteDepositRule(rule.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Pending Deposits */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Pending Deposits
                </CardTitle>
                <CardDescription>
                  Appointments awaiting deposit payment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  <div className="space-y-3">
                    {dayAppointments.filter(a => a.depositAmount && !a.depositPaid).map(appointment => {
                      const service = getService(appointment.serviceId)
                      const stylist = getStylist(appointment.stylistId)
                      
                      return (
                        <div key={appointment.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                          <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                            <AlertCircle className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-[#1A1A1A]">{appointment.customerName}</p>
                            <p className="text-xs text-[#757575]">{service?.name} • {stylist?.name}</p>
                            <p className="text-xs text-[#757575]">{appointment.date} at {appointment.time}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-red-600">R{appointment.depositAmount}</p>
                            <p className="text-xs text-[#757575]">of R{appointment.total}</p>
                          </div>
                          <Button 
                            size="sm" 
                            className="bg-[#00897B] hover:bg-[#00695C]"
                            onClick={() => {
                              setSelectedAppointment(appointment)
                              setCollectDepositOpen(true)
                            }}
                          >
                            Collect
                          </Button>
                        </div>
                      )
                    })}
                    {dayAppointments.filter(a => a.depositAmount && !a.depositPaid).length === 0 && (
                      <div className="text-center py-8">
                        <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-green-500" />
                        <p className="text-sm text-[#757575]">All deposits collected!</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="walkins" className="flex-1 m-0 overflow-auto p-6">
          <div className="max-w-2xl mx-auto">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Walk-in Queue
                </CardTitle>
                <CardDescription>
                  Customers waiting without appointments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {walkIns.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-green-500" />
                    <p className="text-sm text-[#757575]">No walk-ins waiting</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {walkIns.map((walkIn, index) => (
                      <div key={walkIn.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                          #{walkIn.position}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-[#1A1A1A]">{walkIn.customerName || 'Walk-in Customer'}</p>
                          <p className="text-sm text-[#757575]">{walkIn.service}</p>
                          {walkIn.stylistPreference && (
                            <p className="text-xs text-[#00897B]">Prefers: {walkIn.stylistPreference}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-[#757575]">Waiting: {walkIn.waitTime} min</p>
                          <Badge className={walkIn.status === 'waiting' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}>
                            {walkIn.status}
                          </Badge>
                        </div>
                        {walkIn.status === 'waiting' && (
                          <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => callWalkIn(walkIn.id)}>
                            Call
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Button className="w-full" variant="outline" onClick={() => {
              setNewBooking({ ...newBooking, customerName: 'Walk-in Customer' })
              setNewBookingOpen(true)
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Walk-in
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="services" className="flex-1 m-0 overflow-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(
              sampleServices.reduce((acc, service) => {
                if (!acc[service.category]) acc[service.category] = []
                acc[service.category].push(service)
                return acc
              }, {} as Record<string, Service[]>)
            ).map(([category, services]) => (
              <Card key={category}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {services.map(service => (
                      <div key={service.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-[#1A1A1A]">{service.name}</p>
                            {service.depositRequired && (
                              <Badge className="bg-amber-100 text-amber-700 text-[10px]">Deposit</Badge>
                            )}
                          </div>
                          <p className="text-xs text-[#757575]">{service.duration} min</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#00897B]">R{service.price}</p>
                          {service.depositRequired && (
                            <p className="text-xs text-amber-600">+R{service.depositAmount || Math.round(service.price * (service.depositPercentage || 20) / 100)} deposit</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Service Combos Tab */}
        <TabsContent value="combos" className="flex-1 m-0 overflow-auto p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#1A1A1A]">Service Combos</h3>
                <p className="text-sm text-[#757575]">Bundle services with discounted pricing</p>
              </div>
              <Button 
                className="bg-[#00897B] hover:bg-[#00695C] gap-2"
                onClick={() => {
                  setEditingCombo(null)
                  setComboForm({ name: '', services: [], bundledPrice: 0, discount: 10, category: 'Hair' })
                  setComboDialogOpen(true)
                }}
              >
                <Plus className="h-4 w-4" />
                Create Combo
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {serviceCombos.map(combo => (
                <Card key={combo.id} className="hover:border-[#00897B] transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{combo.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-700">-{combo.discount}%</Badge>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={() => {
                              setEditingCombo(combo)
                              setComboForm({ 
                                name: combo.name, 
                                services: combo.services, 
                                bundledPrice: combo.bundledPrice, 
                                discount: combo.discount, 
                                category: combo.category 
                              })
                              setComboDialogOpen(true)
                            }}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteCombo(combo.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <CardDescription>{combo.category}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        {combo.services.map(serviceId => {
                          const service = services.find(s => s.id === serviceId)
                          return service ? (
                            <div key={serviceId} className="flex items-center justify-between text-sm">
                              <span className="text-[#757575]">{service.name}</span>
                              <span className="text-[#1A1A1A]">R{service.price}</span>
                            </div>
                          ) : null
                        })}
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-[#757575]">Bundle Price</p>
                          <p className="text-lg font-bold text-[#00897B]">R{combo.bundledPrice}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-[#757575]">Total Duration</p>
                          <p className="text-sm font-medium">{combo.totalDuration} min</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Treatment Packages Tab */}
        <TabsContent value="packages" className="flex-1 m-0 overflow-auto p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#1A1A1A]">Treatment Packages</h3>
                <p className="text-sm text-[#757575]">Multi-session packages with session tracking</p>
              </div>
              <Button 
                className="bg-[#00897B] hover:bg-[#00695C] gap-2"
                onClick={() => {
                  setEditingPackage(null)
                  setPackageForm({ name: '', description: '', price: 0, validityMonths: 6, sessionsTotal: 1 })
                  setPackageDialogOpen(true)
                }}
              >
                <Plus className="h-4 w-4" />
                Create Package
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Package Templates */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-[#757575] uppercase tracking-wide">Available Packages</h4>
                {treatmentPackages.map(pkg => (
                  <Card key={pkg.id} className="hover:border-[#00897B] transition-colors">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{pkg.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-[#00897B]">R{pkg.price}</p>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7"
                              onClick={() => {
                                setEditingPackage(pkg)
                                setPackageForm({ 
                                  name: pkg.name, 
                                  description: pkg.description, 
                                  price: pkg.price, 
                                  validityMonths: pkg.validityMonths, 
                                  sessionsTotal: pkg.sessionsTotal 
                                })
                                setPackageDialogOpen(true)
                              }}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-red-600 hover:text-red-700"
                              onClick={() => handleDeletePackage(pkg.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <CardDescription>{pkg.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#757575]">{pkg.sessionsTotal} sessions • {pkg.validityMonths} months validity</span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            // Quick sell to walk-in
                            handleSellPackage(pkg, `c${Date.now()}`, 'Walk-in Customer')
                          }}
                        >
                          Sell Package
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Active Client Packages */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-[#757575] uppercase tracking-wide">Active Client Packages</h4>
                {clientPackages.map(cp => (
                  <Card key={cp.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium text-[#1A1A1A]">{cp.customerName}</p>
                          <p className="text-sm text-[#757575]">{cp.packageName}</p>
                        </div>
                        <Badge className={cp.sessionsRemaining > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                          {cp.sessionsRemaining}/{cp.sessionsTotal} sessions
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#757575]">Purchased</span>
                          <span>{cp.purchaseDate}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#757575]">Expires</span>
                          <span className={new Date(cp.expiryDate) < new Date() ? 'text-red-600' : ''}>{cp.expiryDate}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-[#00897B] h-2 rounded-full" 
                            style={{ width: `${(cp.sessionsRemaining / cp.sessionsTotal) * 100}%` }}
                          />
                        </div>
                        {cp.sessionsRemaining > 0 && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full mt-2"
                            onClick={() => {
                              setClientPackages(prev => prev.map(p => p.id === cp.id ? {
                                ...p,
                                sessionsRemaining: p.sessionsRemaining - 1
                              } : p))
                            }}
                          >
                            Use Session
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Gift Vouchers Tab */}
        <TabsContent value="vouchers" className="flex-1 m-0 overflow-auto p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#1A1A1A]">Gift Vouchers</h3>
                <p className="text-sm text-[#757575]">Issue and manage gift vouchers (3-year expiry per SA regulation)</p>
              </div>
              <Button 
                className="bg-[#00897B] hover:bg-[#00695C] gap-2"
                onClick={() => {
                  setEditingVoucher(null)
                  setVoucherForm({ type: 'monetary', amount: 0, purchaserName: '', recipientName: '' })
                  setVoucherDialogOpen(true)
                }}
              >
                <Plus className="h-4 w-4" />
                Issue Voucher
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Stats */}
              <Card className="p-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#00897B]">{giftVouchers.filter(v => v.status === 'active' || v.status === 'partial').length}</p>
                  <p className="text-sm text-[#757575]">Active Vouchers</p>
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">R{giftVouchers.reduce((sum, v) => sum + v.balance, 0)}</p>
                  <p className="text-sm text-[#757575]">Total Outstanding</p>
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">R500</p>
                  <p className="text-sm text-[#757575]">Avg. Voucher Value</p>
                </div>
              </Card>
            </div>

            {/* Voucher List */}
            <div className="space-y-3">
              {giftVouchers.map(voucher => (
                <Card key={voucher.id} className="hover:border-[#00897B] transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                          <Ticket className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-mono font-medium text-[#1A1A1A]">{voucher.code}</p>
                            <Badge className={
                              voucher.status === 'active' ? 'bg-green-100 text-green-700' :
                              voucher.status === 'partial' ? 'bg-amber-100 text-amber-700' :
                              voucher.status === 'redeemed' ? 'bg-gray-100 text-gray-700' :
                              'bg-red-100 text-red-700'
                            }>
                              {voucher.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-[#757575]">
                            {voucher.type === 'monetary' ? `R${voucher.amount} value` : voucher.serviceName}
                            {voucher.recipientName && ` • For: ${voucher.recipientName}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm text-[#757575]">Balance</p>
                          <p className="font-bold text-[#00897B]">R{voucher.balance}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-[#757575]">Expires</p>
                          <p className="text-sm">{voucher.expiryDate}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              if (voucher.balance > 0) {
                                handleRedeemVoucher(voucher, voucher.balance)
                              }
                            }}
                            disabled={voucher.balance <= 0}
                          >
                            Redeem
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteVoucher(voucher.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Memberships Tab */}
        <TabsContent value="memberships" className="flex-1 m-0 overflow-auto p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#1A1A1A]">Membership Plans</h3>
                <p className="text-sm text-[#757575]">Manage subscription plans for regular customers</p>
              </div>
              <Button 
                className="bg-[#00897B] hover:bg-[#00695C] gap-2"
                onClick={() => {
                  setEditingMembership(null)
                  setMembershipForm({ name: '', monthlyFee: 0, rollover: false })
                  setMembershipDialogOpen(true)
                }}
              >
                <Plus className="h-4 w-4" />
                Create Plan
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Membership Plans */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-[#757575] uppercase tracking-wide">Plans</h4>
                {membershipPlans.map(plan => (
                  <Card key={plan.id} className="hover:border-[#00897B] transition-colors">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{plan.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          {plan.rollover && <Badge className="bg-blue-100 text-blue-700">Rollover</Badge>}
                          <Badge className={plan.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                            {plan.active ? 'Active' : 'Inactive'}
                          </Badge>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7"
                              onClick={() => handleToggleMembership(plan.id)}
                            >
                              <Settings className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteMembership(plan.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[#757575]">Monthly Fee</span>
                          <span className="font-bold text-[#00897B]">R{plan.monthlyFee}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[#757575]">Included Services</span>
                          <span className="text-sm">
                            {plan.includedServices.map(s => `${s.quantity}x ${services.find(svc => svc.id === s.serviceId)?.name || s.serviceId}`).join(', ')}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Active Memberships */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-[#757575] uppercase tracking-wide">Active Members</h4>
                {clientMemberships.map(membership => (
                  <Card key={membership.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium text-[#1A1A1A]">{membership.customerName}</p>
                          <p className="text-sm text-[#757575]">{membership.planName}</p>
                        </div>
                        <Badge className="bg-green-100 text-green-700">{membership.status}</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#757575]">Renewal Date</span>
                          <span>{membership.renewalDate}</span>
                        </div>
                        <div className="text-sm">
                          <p className="text-[#757575] mb-1">Services Remaining</p>
                          <div className="flex gap-2 flex-wrap">
                            {Object.entries(membership.servicesRemaining).map(([serviceId, count]) => {
                              const service = sampleServices.find(s => s.id === serviceId)
                              return (
                                <Badge key={serviceId} variant="outline">
                                  {service?.name || serviceId}: {count}
                                </Badge>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Loyalty Tab */}
        <TabsContent value="loyalty" className="flex-1 m-0 overflow-auto p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#1A1A1A]">Loyalty Programme</h3>
                <p className="text-sm text-[#757575]">Tiered loyalty with points and perks</p>
              </div>
              <Button 
                className="bg-[#00897B] hover:bg-[#00695C] gap-2"
                onClick={() => {
                  setEditingTier(null)
                  setTierDialogOpen(true)
                }}
              >
                <Plus className="h-4 w-4" />
                Add Tier
              </Button>
            </div>

            {/* Loyalty Tiers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {loyaltyTiers.map(tier => (
                <Card key={tier.id} className={`relative overflow-hidden ${tier.name === 'Gold' ? 'border-amber-400' : tier.name === 'Silver' ? 'border-gray-300' : 'border-amber-600'}`}>
                  {tier.name === 'Gold' && (
                    <div className="absolute top-0 right-0 bg-amber-400 text-white text-xs px-2 py-1 rounded-bl">
                      Most Popular
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className={`h-6 w-6 ${tier.name === 'Gold' ? 'text-amber-500' : tier.name === 'Silver' ? 'text-gray-400' : 'text-amber-600'}`} fill={tier.name === 'Gold' ? '#F59E0B' : tier.name === 'Silver' ? '#9CA3AF' : '#D97706'} />
                        <CardTitle className="text-lg">{tier.name}</CardTitle>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => {
                            setEditingTier(tier)
                            setTierForm({ 
                              name: tier.name, 
                              minSpend: tier.minSpend, 
                              maxSpend: tier.maxSpend, 
                              earnRate: tier.earnRate, 
                              birthdayDiscount: tier.birthdayDiscount, 
                              perks: tier.perks.join(', ') 
                            })
                            setTierDialogOpen(true)
                          }}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteTier(tier.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      R{tier.minSpend.toLocaleString()} - R{tier.maxSpend.toLocaleString()} spend
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#757575]">Earn Rate</span>
                      <span className="font-medium">{tier.earnRate}pt per R10</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#757575]">Birthday Discount</span>
                      <span className="font-medium">{tier.birthdayDiscount}%</span>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-sm text-[#757575] mb-2">Perks</p>
                      <div className="space-y-1">
                        {tier.perks.map((perk, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-500" />
                            <span>{perk}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Consent Forms Tab */}
        <TabsContent value="consent" className="flex-1 m-0 overflow-auto p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#1A1A1A]">Consent Forms</h3>
                <p className="text-sm text-[#757575]">Digital consent management for treatments</p>
              </div>
              <Button 
                className="bg-[#00897B] hover:bg-[#00695C] gap-2"
                onClick={() => {
                  setEditingConsent(null)
                  setConsentFormData({ name: '', treatmentTypes: '', required: true })
                  setConsentDialogOpen(true)
                }}
              >
                <Plus className="h-4 w-4" />
                Create Form
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Consent Form Templates */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-[#757575] uppercase tracking-wide">Form Templates</h4>
                {consentForms.map(form => (
                  <Card key={form.id} className="hover:border-[#00897B] transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-[#1A1A1A]">{form.name}</p>
                            <p className="text-xs text-[#757575]">{form.treatmentTypes.join(', ')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {form.required && <Badge className="bg-red-100 text-red-700">Required</Badge>}
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7"
                              onClick={() => {
                                setEditingConsent(form)
                                setConsentFormData({ 
                                  name: form.name, 
                                  treatmentTypes: form.treatmentTypes.join(', '), 
                                  required: form.required 
                                })
                                setConsentDialogOpen(true)
                              }}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteConsent(form.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">Preview</Button>
                        <Button variant="outline" size="sm" className="flex-1">Send for Signature</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Recently Signed Consents */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-[#757575] uppercase tracking-wide">Recently Signed</h4>
                {sampleSignedConsents.map(consent => (
                  <Card key={consent.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-[#1A1A1A]">{consent.customerName}</p>
                          <p className="text-sm text-[#757575]">{consent.formName}</p>
                          <p className="text-xs text-[#757575]">Treatment: {consent.treatmentType}</p>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-green-100 text-green-700">Signed</Badge>
                          <p className="text-xs text-[#757575] mt-1">{consent.signedAt}</p>
                          <p className="text-xs text-[#757575]">via {consent.signatureMethod}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tattoo/Art Projects Tab */}
        <TabsContent value="projects" className="flex-1 m-0 overflow-auto p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#1A1A1A]">Projects</h3>
                <p className="text-sm text-[#757575]">Multi-session tattoo and art projects</p>
              </div>
              <Button 
                className="bg-[#00897B] hover:bg-[#00695C] gap-2"
                onClick={() => {
                  setEditingProject(null)
                  setProjectForm({ customerName: '', description: '', estimatedHours: 0, depositAmount: 0 })
                  setProjectDialogOpen(true)
                }}
              >
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {tattooProjects.map(project => (
                <Card key={project.id} className="hover:border-[#00897B] transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{project.customerName}</CardTitle>
                        <CardDescription>{project.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={
                          project.status === 'completed' ? 'bg-green-100 text-green-700' :
                          project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          project.status === 'quoted' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-700'
                        }>
                          {project.status.replace('_', ' ')}
                        </Badge>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={() => {
                              setEditingProject(project)
                              setProjectForm({ 
                                customerName: project.customerName, 
                                description: project.description, 
                                estimatedHours: project.estimatedHours, 
                                depositAmount: project.depositAmount 
                              })
                              setProjectDialogOpen(true)
                            }}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteProject(project.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-[#757575]">Estimated Hours</p>
                        <p className="font-medium">{project.estimatedHours}h</p>
                      </div>
                      <div>
                        <p className="text-[#757575]">Pricing</p>
                        <p className="font-medium">
                          {project.fixedPrice ? `R${project.fixedPrice} fixed` : `R${project.hourlyRate}/hr`}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#757575]">Deposit</p>
                        <p className="font-medium">
                          R{project.depositAmount} {project.depositPaid ? '✓' : '(pending)'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#757575]">Sessions</p>
                        <p className="font-medium">
                          {project.sessions.filter(s => s.status === 'completed').length}/{project.sessions.length}
                        </p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-[#757575]">Sessions</p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const date = prompt('Enter session date (YYYY-MM-DD):')
                            const hours = prompt('Enter hours:') || '2'
                            const notes = prompt('Enter notes (optional):') || ''
                            if (date) {
                              handleAddProjectSession(project.id, date, parseFloat(hours), notes)
                            }
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Session
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {project.sessions.map(session => (
                          <div key={session.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <p className="text-sm font-medium">{session.date}</p>
                              <p className="text-xs text-[#757575]">{session.hours}h {session.notes && `• ${session.notes}`}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {session.status === 'scheduled' && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="h-6 text-green-600"
                                  onClick={() => handleCompleteSession(project.id, session.id)}
                                >
                                  Complete
                                </Button>
                              )}
                              <Badge className={session.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
                                {session.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {!project.depositPaid && (
                      <Button 
                        variant="outline" 
                        className="w-full border-amber-500 text-amber-600"
                        onClick={() => {
                          setTattooProjects(prev => prev.map(p => p.id === project.id ? { ...p, depositPaid: true } : p))
                        }}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Mark Deposit Paid (R{project.depositAmount})
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* New Booking Dialog */}
      <Dialog open={newBookingOpen} onOpenChange={setNewBookingOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Booking</DialogTitle>
            <DialogDescription>
              Schedule an appointment for a customer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-[#1A1A1A] mb-1 block">Customer Name</label>
                <Input 
                  value={newBooking.customerName}
                  onChange={(e) => setNewBooking(prev => ({ ...prev, customerName: e.target.value }))}
                  placeholder="Enter name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#1A1A1A] mb-1 block">Phone</label>
                <Input 
                  value={newBooking.customerPhone}
                  onChange={(e) => setNewBooking(prev => ({ ...prev, customerPhone: e.target.value }))}
                  placeholder="082 123 4567"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-[#1A1A1A] mb-1 block">Email (for reminders)</label>
              <Input 
                type="email"
                value={newBooking.customerEmail}
                onChange={(e) => setNewBooking(prev => ({ ...prev, customerEmail: e.target.value }))}
                placeholder="customer@email.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-[#1A1A1A] mb-1 block">Service</label>
                <Select value={newBooking.serviceId} onValueChange={(v) => {
                  const service = getService(v)
                  setNewBooking(prev => ({ 
                    ...prev, 
                    serviceId: v,
                    collectDeposit: service?.depositRequired || false,
                    depositAmount: service?.depositAmount || 0
                  }))
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {sampleServices.map(service => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} - R{service.price} ({service.duration}min)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-[#1A1A1A] mb-1 block">Stylist</label>
                <Select value={newBooking.stylistId} onValueChange={(v) => setNewBooking(prev => ({ ...prev, stylistId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select stylist" />
                  </SelectTrigger>
                  <SelectContent>
                    {sampleStylists.filter(s => s.status !== 'off').map(stylist => (
                      <SelectItem key={stylist.id} value={stylist.id}>
                        {stylist.name} ({stylist.specialties.slice(0, 2).join(', ')})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-[#1A1A1A] mb-1 block">Date</label>
                <Input 
                  type="date"
                  value={newBooking.date}
                  onChange={(e) => setNewBooking(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#1A1A1A] mb-1 block">Time</label>
                <Select value={newBooking.time} onValueChange={(v) => setNewBooking(prev => ({ ...prev, time: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.slice(0, 20).map(slot => (
                      <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Deposit Collection Option */}
            {newBooking.serviceId && getService(newBooking.serviceId)?.depositRequired && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-amber-700">Collect Deposit</Label>
                  <Switch 
                    checked={newBooking.collectDeposit}
                    onCheckedChange={(checked) => setNewBooking(prev => ({ ...prev, collectDeposit: checked }))}
                  />
                </div>
                {newBooking.collectDeposit && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-amber-600">Deposit Amount:</span>
                    <span className="font-bold text-amber-700">R{newBooking.depositAmount}</span>
                  </div>
                )}
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium text-[#1A1A1A] mb-1 block">Notes</label>
              <Input 
                value={newBooking.notes}
                onChange={(e) => setNewBooking(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Special requests..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewBookingOpen(false)}>Cancel</Button>
            <Button 
              className="bg-[#00897B] hover:bg-[#00695C]"
              disabled={!newBooking.customerName || !newBooking.serviceId || !newBooking.stylistId}
              onClick={handleCreateBooking}
            >
              Create Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appointment Detail Dialog */}
      <Dialog open={appointmentDetailOpen} onOpenChange={setAppointmentDetailOpen}>
        <DialogContent className="sm:max-w-md">
          {selectedAppointment && (
            <>
              <DialogHeader>
                <DialogTitle>Appointment Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-lg bg-[#E0F2F1] text-[#00897B] flex items-center justify-center text-2xl">
                    {getStylist(selectedAppointment.stylistId)?.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-lg text-[#1A1A1A]">{selectedAppointment.customerName}</p>
                      {selectedAppointment.source === 'online' && (
                        <Badge className="bg-purple-100 text-purple-700 text-[10px]">Online</Badge>
                      )}
                    </div>
                    <p className="text-sm text-[#757575]">{selectedAppointment.customerPhone}</p>
                    {selectedAppointment.customerEmail && (
                      <p className="text-xs text-[#757575]">{selectedAppointment.customerEmail}</p>
                    )}
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-[#757575]">Service</p>
                    <p className="font-medium text-[#1A1A1A]">{getService(selectedAppointment.serviceId)?.name}</p>
                  </div>
                  <div>
                    <p className="text-[#757575]">Stylist</p>
                    <p className="font-medium text-[#1A1A1A]">{getStylist(selectedAppointment.stylistId)?.name}</p>
                  </div>
                  <div>
                    <p className="text-[#757575]">Date & Time</p>
                    <p className="font-medium text-[#1A1A1A]">{selectedAppointment.time} ({selectedAppointment.duration}min)</p>
                  </div>
                  <div>
                    <p className="text-[#757575]">Status</p>
                    <Badge className={
                      selectedAppointment.status === 'completed' ? 'bg-green-100 text-green-700' :
                      selectedAppointment.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                      selectedAppointment.status === 'confirmed' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }>
                      {selectedAppointment.status}
                    </Badge>
                  </div>
                </div>

                {/* Deposit Status */}
                {selectedAppointment.depositAmount && (
                  <div className="p-3 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[#757575]">Deposit</span>
                      {selectedAppointment.depositPaid ? (
                        <Badge className="bg-green-100 text-green-700">Paid</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700">Unpaid</Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#757575]">Amount:</span>
                      <span className="font-bold text-[#1A1A1A]">R{selectedAppointment.depositAmount}</span>
                    </div>
                    {selectedAppointment.depositPaid && selectedAppointment.depositMethod && (
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-[#757575]">Method:</span>
                        <span className="text-xs capitalize">{selectedAppointment.depositMethod}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-[#757575]">Total</span>
                  <span className="text-lg font-bold text-[#00897B]">R{selectedAppointment.total}</span>
                </div>

                {/* Reminder Status */}
                {selectedAppointment.reminderSent && (
                  <div className="flex items-center gap-2 text-xs text-green-600">
                    <Check className="h-3 w-3" />
                    Reminder sent at {selectedAppointment.reminderSentAt}
                  </div>
                )}
              </div>
              <DialogFooter className="flex-col gap-2">
                <div className="flex gap-2 w-full">
                  {/* Deposit Collection Button */}
                  {selectedAppointment.depositAmount && !selectedAppointment.depositPaid && (
                    <Button 
                      variant="outline" 
                      className="flex-1 border-amber-500 text-amber-600"
                      onClick={() => setCollectDepositOpen(true)}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Collect Deposit
                    </Button>
                  )}
                  
                  {/* Send Reminder Button */}
                  {!selectedAppointment.reminderSent && selectedAppointment.status === 'scheduled' && (
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setSendReminderOpen(true)}
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      Send Reminder
                    </Button>
                  )}
                </div>
                
                <div className="flex gap-2 w-full">
                  {selectedAppointment.status === 'scheduled' && (
                    <>
                      <Button variant="outline" className="flex-1" onClick={() => {
                        updateAppointmentStatus(selectedAppointment.id, 'confirmed')
                        setAppointmentDetailOpen(false)
                      }}>
                        Confirm
                      </Button>
                      <Button className="flex-1 bg-[#00897B] hover:bg-[#00695C]" onClick={() => {
                        updateAppointmentStatus(selectedAppointment.id, 'in-progress')
                        setAppointmentDetailOpen(false)
                      }}>
                        Start Service
                      </Button>
                    </>
                  )}
                  {selectedAppointment.status === 'confirmed' && (
                    <Button className="w-full bg-[#00897B] hover:bg-[#00695C]" onClick={() => {
                      updateAppointmentStatus(selectedAppointment.id, 'in-progress')
                      setAppointmentDetailOpen(false)
                    }}>
                      Start Service
                    </Button>
                  )}
                  {selectedAppointment.status === 'in-progress' && (
                    <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => {
                      updateAppointmentStatus(selectedAppointment.id, 'completed')
                      setAppointmentDetailOpen(false)
                    }}>
                      Complete Service
                    </Button>
                  )}
                </div>
                
                {/* Create POS Sale Button */}
                {(selectedAppointment.status === 'in-progress' || selectedAppointment.status === 'completed') && onProceedToPOS && (
                  <div className="flex gap-2 w-full">
                    <Button 
                      className="w-full bg-[#00897B] hover:bg-[#00695C] gap-2"
                      onClick={() => {
                        const service = getService(selectedAppointment.serviceId)
                        if (service && onProceedToPOS) {
                          onProceedToPOS({
                            appointmentId: selectedAppointment.id,
                            serviceName: service.name,
                            servicePrice: selectedAppointment.total,
                            category: service.category,
                            customerName: selectedAppointment.customerName,
                            customerPhone: selectedAppointment.customerPhone,
                            customerId: selectedAppointment.customerId,
                            depositPaid: selectedAppointment.depositPaid,
                            depositAmount: selectedAppointment.depositAmount,
                          })
                          setAppointmentDetailOpen(false)
                        }
                      }}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Create POS Sale
                    </Button>
                  </div>
                )}
                <div className="flex gap-2 w-full">
                  <Button variant="ghost" size="sm" className="flex-1 text-red-500 hover:text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Send Reminder Dialog */}
      <Dialog open={sendReminderOpen} onOpenChange={setSendReminderOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Send SMS Reminder
            </DialogTitle>
            <DialogDescription>
              Send a reminder to {selectedAppointment?.customerName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-[#1A1A1A] mb-2">Message Preview:</p>
              <p className="text-sm text-[#757575]">
                Hi {selectedAppointment?.customerName}, this is a reminder of your appointment at Nomsa's Beauty Salon on {selectedAppointment?.date} at {selectedAppointment?.time}. Service: {getService(selectedAppointment?.serviceId || '')?.name}. Reply CANCEL to cancel.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button 
                variant="outline" 
                className="flex flex-col h-auto py-2"
                onClick={() => handleSendReminder(selectedAppointment?.id || '', 'confirmation')}
              >
                <Check className="h-4 w-4 mb-1" />
                <span className="text-xs">Confirmation</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex flex-col h-auto py-2"
                onClick={() => handleSendReminder(selectedAppointment?.id || '', 'reminder_24h')}
              >
                <Bell className="h-4 w-4 mb-1" />
                <span className="text-xs">24h Reminder</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex flex-col h-auto py-2"
                onClick={() => handleSendReminder(selectedAppointment?.id || '', 'reminder_2h')}
              >
                <BellRing className="h-4 w-4 mb-1" />
                <span className="text-xs">2h Reminder</span>
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendReminderOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Collect Deposit Dialog */}
      <Dialog open={collectDepositOpen} onOpenChange={setCollectDepositOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Collect Deposit
            </DialogTitle>
            <DialogDescription>
              Collect R{selectedAppointment?.depositAmount} deposit from {selectedAppointment?.customerName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-3">
              <Button 
                variant="outline" 
                className="flex flex-col h-auto py-4 border-[#00897B] text-[#00897B] hover:bg-[#E0F2F1]"
                onClick={() => handleCollectDeposit('online')}
              >
                <Globe className="h-6 w-6 mb-2" />
                <span className="text-sm font-medium">Online Pay</span>
                <span className="text-xs text-[#757575]">Card/EFT</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex flex-col h-auto py-4 border-[#00897B] text-[#00897B] hover:bg-[#E0F2F1]"
                onClick={() => handleCollectDeposit('wallet')}
              >
                <Wallet className="h-6 w-6 mb-2" />
                <span className="text-sm font-medium">Gopay Wallet</span>
                <span className="text-xs text-[#757575]">Instant</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex flex-col h-auto py-4 border-[#00897B] text-[#00897B] hover:bg-[#E0F2F1]"
                onClick={() => handleCollectDeposit('in-store')}
              >
                <Coins className="h-6 w-6 mb-2" />
                <span className="text-sm font-medium">In-Store</span>
                <span className="text-xs text-[#757575]">Cash/Card</span>
              </Button>
            </div>
            <div className="p-3 bg-green-50 rounded-lg text-center">
              <p className="text-xs text-green-600">Deposit will be applied to final bill</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCollectDepositOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Widget Settings Dialog */}
      <Dialog open={widgetSettingsOpen} onOpenChange={setWidgetSettingsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Online Booking Widget
            </DialogTitle>
            <DialogDescription>
              Add online booking to your website or share your booking page
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Widget Preview */}
            <div className="p-6 bg-gray-100 rounded-lg text-center">
              <p className="text-xs text-[#757575] mb-4">Widget Preview</p>
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-[#00897B] text-white rounded-full shadow-lg">
                <Calendar className="h-5 w-5" />
                <span className="text-sm font-medium">Book Now</span>
              </div>
            </div>
            
            {/* Embed Code */}
            <div>
              <Label className="text-sm font-medium">Embed Code</Label>
              <div className="mt-2 p-4 bg-gray-900 rounded-lg">
                <pre className="text-xs text-green-400 overflow-x-auto whitespace-pre-wrap">
                  {generateWidgetCode()}
                </pre>
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-2 gap-2"
                onClick={() => copyToClipboard(generateWidgetCode())}
              >
                <Copy className="h-4 w-4" />
                Copy to Clipboard
              </Button>
            </div>

            {/* Direct Link */}
            <div>
              <Label className="text-sm font-medium">Direct Booking Link</Label>
              <div className="flex gap-2 mt-2">
                <Input value={generateBookingPageUrl()} readOnly />
                <Button 
                  variant="outline"
                  onClick={() => copyToClipboard(generateBookingPageUrl())}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setWidgetSettingsOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== CRUD DIALOGS ========== */}

      {/* Service Combo Dialog */}
      <Dialog open={comboDialogOpen} onOpenChange={setComboDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCombo ? 'Edit Combo' : 'Create Service Combo'}</DialogTitle>
            <DialogDescription>Bundle services with discounted pricing</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Combo Name</Label>
              <Input 
                value={comboForm.name}
                onChange={(e) => setComboForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Cut & Colour Special"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={comboForm.category} onValueChange={(v) => setComboForm(prev => ({ ...prev, category: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hair">Hair</SelectItem>
                  <SelectItem value="Nails">Nails</SelectItem>
                  <SelectItem value="Spa">Spa</SelectItem>
                  <SelectItem value="Packages">Packages</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Included Services</Label>
              <div className="border rounded-lg p-3 max-h-40 overflow-auto space-y-2">
                {services.map(service => (
                  <div key={service.id} className="flex items-center gap-2">
                    <Checkbox 
                      checked={comboForm.services.includes(service.id)}
                      onCheckedChange={(checked) => {
                        setComboForm(prev => ({
                          ...prev,
                          services: checked 
                            ? [...prev.services, service.id]
                            : prev.services.filter(id => id !== service.id)
                        }))
                      }}
                    />
                    <span className="text-sm flex-1">{service.name}</span>
                    <span className="text-xs text-[#757575]">R{service.price}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Bundle Price (R)</Label>
                <Input 
                  type="number"
                  value={comboForm.bundledPrice}
                  onChange={(e) => setComboForm(prev => ({ ...prev, bundledPrice: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label>Discount (%)</Label>
                <Input 
                  type="number"
                  value={comboForm.discount}
                  onChange={(e) => setComboForm(prev => ({ ...prev, discount: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            {comboForm.services.length > 0 && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-[#757575] mb-1">Total Original Price</p>
                <p className="font-bold">R{comboForm.services.reduce((sum, id) => sum + (services.find(s => s.id === id)?.price || 0), 0)}</p>
                <p className="text-xs text-green-600">Savings: R{comboForm.services.reduce((sum, id) => sum + (services.find(s => s.id === id)?.price || 0), 0) - comboForm.bundledPrice}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComboDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleSaveCombo}>
              {editingCombo ? 'Update' : 'Create'} Combo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Treatment Package Dialog */}
      <Dialog open={packageDialogOpen} onOpenChange={setPackageDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPackage ? 'Edit Package' : 'Create Treatment Package'}</DialogTitle>
            <DialogDescription>Multi-session treatment packages</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Package Name</Label>
              <Input 
                value={packageForm.name}
                onChange={(e) => setPackageForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Monthly Glow"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea 
                value={packageForm.description}
                onChange={(e) => setPackageForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Package description..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Price (R)</Label>
                <Input 
                  type="number"
                  value={packageForm.price}
                  onChange={(e) => setPackageForm(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label>Sessions</Label>
                <Input 
                  type="number"
                  value={packageForm.sessionsTotal}
                  onChange={(e) => setPackageForm(prev => ({ ...prev, sessionsTotal: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div>
                <Label>Valid (months)</Label>
                <Input 
                  type="number"
                  value={packageForm.validityMonths}
                  onChange={(e) => setPackageForm(prev => ({ ...prev, validityMonths: parseInt(e.target.value) || 6 }))}
                />
              </div>
            </div>
            {packageForm.sessionsTotal > 0 && packageForm.price > 0 && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-[#757575]">Price per session</p>
                <p className="font-bold">R{Math.round(packageForm.price / packageForm.sessionsTotal)}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPackageDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleSavePackage}>
              {editingPackage ? 'Update' : 'Create'} Package
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Gift Voucher Dialog */}
      <Dialog open={voucherDialogOpen} onOpenChange={setVoucherDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingVoucher ? 'Edit Voucher' : 'Issue Gift Voucher'}</DialogTitle>
            <DialogDescription>3-year expiry per South African regulation</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Voucher Type</Label>
              <Select value={voucherForm.type} onValueChange={(v: 'monetary' | 'service') => setVoucherForm(prev => ({ ...prev, type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monetary">Monetary Value</SelectItem>
                  <SelectItem value="service">Specific Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {voucherForm.type === 'monetary' ? (
              <div>
                <Label>Amount (R)</Label>
                <Input 
                  type="number"
                  value={voucherForm.amount}
                  onChange={(e) => setVoucherForm(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
                  placeholder="500"
                />
              </div>
            ) : (
              <div>
                <Label>Service</Label>
                <Select onValueChange={(v) => setVoucherForm(prev => ({ ...prev, amount: services.find(s => s.id === v)?.price || 0 }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name} - R{s.price}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Purchaser Name</Label>
              <Input 
                value={voucherForm.purchaserName}
                onChange={(e) => setVoucherForm(prev => ({ ...prev, purchaserName: e.target.value }))}
                placeholder="Customer name"
              />
            </div>
            <div>
              <Label>Recipient Name (Optional)</Label>
              <Input 
                value={voucherForm.recipientName}
                onChange={(e) => setVoucherForm(prev => ({ ...prev, recipientName: e.target.value }))}
                placeholder="Gift recipient"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVoucherDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleSaveVoucher}>
              Issue Voucher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Membership Plan Dialog */}
      <Dialog open={membershipDialogOpen} onOpenChange={setMembershipDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingMembership ? 'Edit Plan' : 'Create Membership Plan'}</DialogTitle>
            <DialogDescription>Subscription plans for regular customers</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Plan Name</Label>
              <Input 
                value={membershipForm.name}
                onChange={(e) => setMembershipForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Basic Cut Club"
              />
            </div>
            <div>
              <Label>Monthly Fee (R)</Label>
              <Input 
                type="number"
                value={membershipForm.monthlyFee}
                onChange={(e) => setMembershipForm(prev => ({ ...prev, monthlyFee: parseInt(e.target.value) || 0 }))}
                placeholder="299"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Service Rollover</Label>
                <p className="text-xs text-[#757575]">Unused services roll to next month</p>
              </div>
              <Switch 
                checked={membershipForm.rollover}
                onCheckedChange={(checked) => setMembershipForm(prev => ({ ...prev, rollover: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMembershipDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleSaveMembership}>
              {editingMembership ? 'Update' : 'Create'} Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Consent Form Dialog */}
      <Dialog open={consentDialogOpen} onOpenChange={setConsentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingConsent ? 'Edit Form' : 'Create Consent Form'}</DialogTitle>
            <DialogDescription>Digital consent for treatments</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Form Name</Label>
              <Input 
                value={consentForm.name}
                onChange={(e) => setConsentFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Laser Treatment Consent"
              />
            </div>
            <div>
              <Label>Treatment Types (comma-separated)</Label>
              <Input 
                value={consentForm.treatmentTypes}
                onChange={(e) => setConsentFormData(prev => ({ ...prev, treatmentTypes: e.target.value }))}
                placeholder="Laser Hair Removal, IPL, Skin Rejuvenation"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Required for Booking</Label>
                <p className="text-xs text-[#757575]">Must sign before appointment</p>
              </div>
              <Switch 
                checked={consentForm.required}
                onCheckedChange={(checked) => setConsentFormData(prev => ({ ...prev, required: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConsentDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleSaveConsent}>
              {editingConsent ? 'Update' : 'Create'} Form
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tattoo Project Dialog */}
      <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProject ? 'Edit Project' : 'New Tattoo Project'}</DialogTitle>
            <DialogDescription>Multi-session tattoo tracking</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Customer Name</Label>
              <Input 
                value={projectForm.customerName}
                onChange={(e) => setProjectForm(prev => ({ ...prev, customerName: e.target.value }))}
                placeholder="Customer name"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea 
                value={projectForm.description}
                onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Tattoo description..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Estimated Hours</Label>
                <Input 
                  type="number"
                  value={projectForm.estimatedHours}
                  onChange={(e) => setProjectForm(prev => ({ ...prev, estimatedHours: parseFloat(e.target.value) || 0 }))}
                  placeholder="10"
                />
              </div>
              <div>
                <Label>Deposit (R)</Label>
                <Input 
                  type="number"
                  value={projectForm.depositAmount}
                  onChange={(e) => setProjectForm(prev => ({ ...prev, depositAmount: parseInt(e.target.value) || 0 }))}
                  placeholder="2000"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProjectDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleSaveProject}>
              {editingProject ? 'Update' : 'Create'} Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Service Dialog */}
      <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingService ? 'Edit Service' : 'Add New Service'}</DialogTitle>
            <DialogDescription>Configure service details and pricing</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Service Name</Label>
              <Input 
                value={serviceForm.name}
                onChange={(e) => setServiceForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Haircut - Ladies"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={serviceForm.category} onValueChange={(v) => setServiceForm(prev => ({ ...prev, category: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hair">Hair</SelectItem>
                    <SelectItem value="Nails">Nails</SelectItem>
                    <SelectItem value="Spa">Spa</SelectItem>
                    <SelectItem value="Makeup">Makeup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Duration (min)</Label>
                <Input 
                  type="number"
                  value={serviceForm.duration}
                  onChange={(e) => setServiceForm(prev => ({ ...prev, duration: parseInt(e.target.value) || 30 }))}
                />
              </div>
            </div>
            <div>
              <Label>Price (R)</Label>
              <Input 
                type="number"
                value={serviceForm.price}
                onChange={(e) => setServiceForm(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Require Deposit</Label>
                <p className="text-xs text-[#757575]">Require deposit for this service</p>
              </div>
              <Switch 
                checked={serviceForm.depositRequired}
                onCheckedChange={(checked) => setServiceForm(prev => ({ ...prev, depositRequired: checked }))}
              />
            </div>
            {serviceForm.depositRequired && (
              <div>
                <Label>Deposit Amount (R)</Label>
                <Input 
                  type="number"
                  value={serviceForm.depositAmount}
                  onChange={(e) => setServiceForm(prev => ({ ...prev, depositAmount: parseInt(e.target.value) || 0 }))}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setServiceDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleSaveService}>
              {editingService ? 'Update' : 'Add'} Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Loyalty Tier Dialog */}
      <Dialog open={tierDialogOpen} onOpenChange={setTierDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTier ? 'Edit Tier' : 'Add Loyalty Tier'}</DialogTitle>
            <DialogDescription>Configure loyalty tier benefits</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Tier Name</Label>
              <Select value={tierForm.name} onValueChange={(v: 'Bronze' | 'Silver' | 'Gold' | 'Platinum') => setTierForm(prev => ({ ...prev, name: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bronze">Bronze</SelectItem>
                  <SelectItem value="Silver">Silver</SelectItem>
                  <SelectItem value="Gold">Gold</SelectItem>
                  <SelectItem value="Platinum">Platinum</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Min Spend (R)</Label>
                <Input 
                  type="number"
                  value={tierForm.minSpend}
                  onChange={(e) => setTierForm(prev => ({ ...prev, minSpend: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label>Max Spend (R)</Label>
                <Input 
                  type="number"
                  value={tierForm.maxSpend}
                  onChange={(e) => setTierForm(prev => ({ ...prev, maxSpend: parseInt(e.target.value) || 999999 }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Earn Rate (pts per R10)</Label>
                <Input 
                  type="number"
                  step="0.5"
                  value={tierForm.earnRate}
                  onChange={(e) => setTierForm(prev => ({ ...prev, earnRate: parseFloat(e.target.value) || 1 }))}
                />
              </div>
              <div>
                <Label>Birthday Discount (%)</Label>
                <Input 
                  type="number"
                  value={tierForm.birthdayDiscount}
                  onChange={(e) => setTierForm(prev => ({ ...prev, birthdayDiscount: parseInt(e.target.value) || 10 }))}
                />
              </div>
            </div>
            <div>
              <Label>Perks (comma-separated)</Label>
              <Textarea 
                value={tierForm.perks}
                onChange={(e) => setTierForm(prev => ({ ...prev, perks: e.target.value }))}
                placeholder="Priority booking, Birthday 15% off, VIP queue"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTierDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleSaveTier}>
              {editingTier ? 'Update' : 'Add'} Tier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reminder Template Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create Message Template'}</DialogTitle>
            <DialogDescription>Customizable message for SMS and WhatsApp</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Template Name</Label>
              <Input 
                value={templateForm.name}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Booking Confirmation"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={templateForm.type} onValueChange={(v: 'confirmation' | 'reminder_24h' | 'reminder_2h' | 'custom') => setTemplateForm(prev => ({ ...prev, type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirmation">Confirmation</SelectItem>
                    <SelectItem value="reminder_24h">24h Reminder</SelectItem>
                    <SelectItem value="reminder_2h">2h Reminder</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Channel</Label>
                <Select value={templateForm.channel} onValueChange={(v: 'sms' | 'whatsapp' | 'both') => setTemplateForm(prev => ({ ...prev, channel: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sms">SMS Only</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp Only</SelectItem>
                    <SelectItem value="both">Both SMS & WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {templateForm.channel !== 'sms' && (
              <div>
                <Label>Subject (WhatsApp Header)</Label>
                <Input 
                  value={templateForm.subject}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="e.g., Appointment Confirmation"
                />
              </div>
            )}
            <div>
              <Label>Message</Label>
              <Textarea 
                value={templateForm.message}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Hi {customer_name}, your booking at {business_name} is confirmed for {date} at {time}..."
                rows={4}
              />
              <p className="text-xs text-[#757575] mt-1">
                Variables: {'{customer_name}, {business_name}, {service}, {date}, {time}, {amount}, {deposit_amount}, {payment_link}'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleSaveTemplate}>
              {editingTemplate ? 'Update' : 'Create'} Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deposit Rule Dialog */}
      <Dialog open={depositRuleDialogOpen} onOpenChange={setDepositRuleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingDepositRule ? 'Edit Rule' : 'Add Deposit Rule'}</DialogTitle>
            <DialogDescription>Configure deposit requirements</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Rule Name</Label>
              <Input 
                value={depositRuleForm.name}
                onChange={(e) => setDepositRuleForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., High-Value Services"
              />
            </div>
            <div>
              <Label>Service Category (optional)</Label>
              <Select value={depositRuleForm.serviceCategory} onValueChange={(v) => setDepositRuleForm(prev => ({ ...prev, serviceCategory: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Hair">Hair</SelectItem>
                  <SelectItem value="Nails">Nails</SelectItem>
                  <SelectItem value="Spa">Spa</SelectItem>
                  <SelectItem value="Makeup">Makeup</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Deposit Type</Label>
                <Select value={depositRuleForm.depositType} onValueChange={(v: 'percentage' | 'fixed') => setDepositRuleForm(prev => ({ ...prev, depositType: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{depositRuleForm.depositType === 'percentage' ? 'Percentage (%)' : 'Amount (R)'}</Label>
                <Input 
                  type="number"
                  value={depositRuleForm.depositValue}
                  onChange={(e) => setDepositRuleForm(prev => ({ ...prev, depositValue: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div>
              <Label>Minimum Booking Value (R)</Label>
              <Input 
                type="number"
                value={depositRuleForm.minAmount}
                onChange={(e) => setDepositRuleForm(prev => ({ ...prev, minAmount: parseInt(e.target.value) || 0 }))}
                placeholder="0 = no minimum"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Non-Refundable</Label>
                <p className="text-xs text-[#757575]">Forfeit on no-show</p>
              </div>
              <Switch 
                checked={depositRuleForm.nonRefundable}
                onCheckedChange={(checked) => setDepositRuleForm(prev => ({ ...prev, nonRefundable: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDepositRuleDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleSaveDepositRule}>
              {editingDepositRule ? 'Update' : 'Add'} Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
