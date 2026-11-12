'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
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
  Wallet,
  QrCode,
  Smartphone,
  Coins,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Plus,
  Settings,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  CreditCard,
  Banknote,
  Building2,
  Zap,
  Bot,
  Target,
  Lightbulb,
  AlertTriangle,
  X,
  Send,
  Download,
  Receipt,
  Gift,
  Users,
  Phone,
  Mail,
  User,
  MapPin,
  Shield,
  Lock,
  Unlock,
  EyeOff,
  Copy,
  Share2,
  MoreHorizontal,
  Bell,
  History,
  PiggyBank,
  Landmark,
  Wifi,
  Bus,
  Tv,
  Droplets,
  Zap as Electricity,
  Flame,
  Home,
  Car,
  GraduationCap,
  Heart,
  ShoppingBag,
  Coffee,
  Utensils,
  Gamepad2,
  Music,
  Ticket,
  Calendar,
  Star,
  Award,
  FileText,
  CheckCircle,
  Loader2,
  Sparkles,
  Train,
  Ticket as TicketIcon,
  Music2,
  Trophy,
  Clapperboard,
  Microscope,
  Handshake,
  BanknoteIcon,
  Percent,
  Calculator,
  FileCheck,
  IdCard,
  Briefcase,
  HomeIcon,
  ShieldCheck,
  Plane,
  CreditCard as CreditCardIcon,
} from 'lucide-react'

// ============================================
// TYPES
// ============================================

interface WalletAccount {
  id: string
  type: 'main' | 'savings' | 'business'
  name: string
  balance: number
  currency: string
  availableBalance: number
  pendingBalance: number
  linkedBank?: {
    bank: string
    accountNumber: string
    accountName: string
  }
}

interface Transaction {
  id: string
  type: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  description: string
  merchant?: string
  category?: string
  reference: string
  fee?: number
  cashback?: number
  createdAt: string
  completedAt?: string
  token?: string
  meterNumber?: string
  units?: string
  recipient?: string
}

interface Biller {
  id: string
  name: string
  category: string
  logo?: string
  accountFormat: string
  minAmount: number
  maxAmount: number
  fee: number
  estimatedTime: string
}

interface Contact {
  id: string
  name: string
  phone: string
  email?: string
  avatar?: string
  recentTransactions: number
  isFavorite: boolean
}

interface GrantApplication {
  id: string
  amount: number
  purpose: string
  status: 'draft' | 'submitted' | 'kyc_pending' | 'approved' | 'rejected' | 'disbursed'
  idNumber: string
  fullName: string
  email: string
  phone: string
  incomeBracket: string
  createdAt: string
  disbursedAt?: string
  reference: string
}

interface BNPLMerchant {
  id: string
  name: string
  logo: string
  category: string
  maxLimit: number
  terms: string[]
}

interface LaybyeMerchant {
  id: string
  name: string
  logo: string
  category: string
  minDeposit: number
  maxTermMonths: number
}

interface InsuranceProduct {
  id: string
  name: string
  type: 'life' | 'funeral' | 'car' | 'home' | 'business' | 'health'
  description: string
  minPremium: number
  maxPremium: number
  coverage: string
  features: string[]
}

interface BusTerminal {
  id: string
  name: string
  city: string
  province: string
  code: string
}

interface BusOperator {
  id: string
  name: string
  logo: string
  routes: string[]
}

interface Event {
  id: string
  name: string
  venue: string
  city: string
  date: string
  time: string
  category: 'concert' | 'sports' | 'theatre' | 'comedy' | 'festival' | 'exhibition'
  imageUrl?: string
  ticketTiers: { name: string; price: number; available: number }[]
}

interface BettingVoucher {
  id: string
  name: string
  brand: string
  platforms: string[]
  denominations: number[]
  logo: string
}

// ============================================
// SAMPLE DATA
// ============================================

const sampleWalletAccounts: WalletAccount[] = [
  {
    id: 'wallet-main',
    type: 'main',
    name: 'Gopay Wallet',
    balance: 4580.50,
    currency: 'ZAR',
    availableBalance: 4500.50,
    pendingBalance: 80.00,
    linkedBank: {
      bank: 'FNB',
      accountNumber: '****4521',
      accountName: 'John Dlamini',
    },
  },
  {
    id: 'wallet-savings',
    type: 'savings',
    name: 'Savings Pocket',
    balance: 12500.00,
    currency: 'ZAR',
    availableBalance: 12500.00,
    pendingBalance: 0,
  },
]

const sampleTransactions: Transaction[] = [
  {
    id: 'TXN001',
    type: 'qr_payment',
    amount: 125.00,
    currency: 'ZAR',
    status: 'completed',
    description: 'Shoprite Canal Walk',
    merchant: 'Shoprite',
    category: 'Groceries',
    reference: 'GP-2024-000001',
    fee: 0,
    cashback: 1.25,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  },
  {
    id: 'TXN002',
    type: 'electricity',
    amount: 500.00,
    currency: 'ZAR',
    status: 'completed',
    description: 'Eskom Prepaid Electricity',
    merchant: 'Eskom',
    category: 'Utilities',
    reference: 'GP-UTIL-2024-000002',
    token: '1234-5678-9012-3456-7890',
    meterNumber: '01234567890',
    units: '125.5 kWh',
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  },
]

const sampleBillers: Biller[] = [
  { id: 'biller-eskom', name: 'Eskom', category: 'electricity', accountFormat: '11-digit meter number', minAmount: 50, maxAmount: 5000, fee: 0, estimatedTime: 'Instant' },
  { id: 'biller-vodacom', name: 'Vodacom', category: 'mobile', accountFormat: 'Cellphone number', minAmount: 5, maxAmount: 1000, fee: 0, estimatedTime: 'Instant' },
  { id: 'biller-mtn', name: 'MTN', category: 'mobile', accountFormat: 'Cellphone number', minAmount: 5, maxAmount: 1000, fee: 0, estimatedTime: 'Instant' },
  { id: 'biller-cellc', name: 'Cell C', category: 'mobile', accountFormat: 'Cellphone number', minAmount: 5, maxAmount: 1000, fee: 0, estimatedTime: 'Instant' },
  { id: 'biller-telkom', name: 'Telkom Mobile', category: 'mobile', accountFormat: 'Cellphone number', minAmount: 5, maxAmount: 1000, fee: 0, estimatedTime: 'Instant' },
  { id: 'biller-dstv', name: 'DStv', category: 'tv', accountFormat: 'Smart card number', minAmount: 50, maxAmount: 5000, fee: 0, estimatedTime: 'Instant' },
]

const bnplMerchants: BNPLMerchant[] = [
  { id: 'bnpl-1', name: 'Game', logo: '🎮', category: 'Electronics', maxLimit: 50000, terms: ['Pay in 3 installments', '0% interest', '6 months to pay'] },
  { id: 'bnpl-2', name: 'Makro', logo: '🏪', category: 'Retail', maxLimit: 75000, terms: ['Pay in 6 installments', '0% interest for first 3 months'] },
  { id: 'bnpl-3', name: 'TAFELBERG', logo: '🛋️', category: 'Furniture', maxLimit: 100000, terms: ['12 months to pay', 'Flexible terms'] },
  { id: 'bnpl-4', name: 'Bradlows', logo: '🛏️', category: 'Furniture', maxLimit: 80000, terms: ['6-24 months', 'Affordable installments'] },
  { id: 'bnpl-5', name: 'Incredible Connection', logo: '💻', category: 'Electronics', maxLimit: 60000, terms: ['Pay in 3', '0% interest'] },
  { id: 'bnpl-6', name: 'HiFi Corp', logo: '🔊', category: 'Electronics', maxLimit: 45000, terms: ['6 months interest-free'] },
]

const laybyeMerchants: LaybyeMerchant[] = [
  { id: 'laybye-1', name: 'Game', logo: '🎮', category: 'General', minDeposit: 10, maxTermMonths: 6 },
  { id: 'laybye-2', name: 'Makro', logo: '🏪', category: 'General', minDeposit: 10, maxTermMonths: 6 },
  { id: 'laybye-3', name: 'Edgars', logo: '👔', category: 'Fashion', minDeposit: 20, maxTermMonths: 3 },
  { id: 'laybye-4', name: 'Jet', logo: '✈️', category: 'Fashion', minDeposit: 15, maxTermMonths: 3 },
  { id: 'laybye-5', name: 'Ackermans', logo: '👶', category: 'Fashion', minDeposit: 10, maxTermMonths: 3 },
  { id: 'laybye-6', name: 'Foschini', logo: '👗', category: 'Fashion', minDeposit: 20, maxTermMonths: 3 },
]

const insuranceProducts: InsuranceProduct[] = [
  { id: 'ins-1', name: 'Family Funeral Cover', type: 'funeral', description: 'Comprehensive funeral cover for you and your family', minPremium: 50, maxPremium: 500, coverage: 'Up to R100,000', features: ['Family coverage', 'Instant payout', 'No medical exams'] },
  { id: 'ins-2', name: 'Term Life Insurance', type: 'life', description: 'Protect your loved ones with life cover', minPremium: 100, maxPremium: 2000, coverage: 'Up to R5,000,000', features: ['Fixed premiums', 'Flexible terms', 'Accidental death benefit'] },
  { id: 'ins-3', name: 'Comprehensive Car Insurance', type: 'car', description: 'Full vehicle protection', minPremium: 300, maxPremium: 3000, coverage: 'Vehicle value', features: ['Theft & hijacking', 'Accident cover', 'Roadside assist'] },
  { id: 'ins-4', name: 'Home Contents Insurance', type: 'home', description: 'Protect your belongings', minPremium: 150, maxPremium: 1500, coverage: 'Up to R500,000', features: ['All-risk items', 'Liability cover', 'Geysers included'] },
  { id: 'ins-5', name: 'Business Liability', type: 'business', description: 'Protect your business', minPremium: 200, maxPremium: 5000, coverage: 'Up to R2,000,000', features: ['Public liability', 'Product liability', 'Professional indemnity'] },
  { id: 'ins-6', name: 'Health Cash Plan', type: 'health', description: 'Daily hospital benefits', minPremium: 100, maxPremium: 1000, coverage: 'R5,000/day', features: ['Hospital cash', 'GP visits', 'Dental & optical'] },
]

const busTerminals: BusTerminal[] = [
  // Gauteng
  { id: 'terminal-1', name: 'Park Station', city: 'Johannesburg', province: 'Gauteng', code: 'JHB' },
  { id: 'terminal-2', name: 'Pretoria Station', city: 'Pretoria', province: 'Gauteng', code: 'PTA' },
  { id: 'terminal-3', name: 'Midrand Gautrain', city: 'Midrand', province: 'Gauteng', code: 'MRD' },
  { id: 'terminal-4', name: 'Centurion', city: 'Centurion', province: 'Gauteng', code: 'CTR' },
  // Western Cape
  { id: 'terminal-5', name: 'Cape Town Station', city: 'Cape Town', province: 'Western Cape', code: 'CPT' },
  { id: 'terminal-6', name: 'Bellville', city: 'Bellville', province: 'Western Cape', code: 'BVL' },
  { id: 'terminal-7', name: 'Stellenbosch', city: 'Stellenbosch', province: 'Western Cape', code: 'STB' },
  // KwaZulu-Natal
  { id: 'terminal-8', name: 'Durban Station', city: 'Durban', province: 'KwaZulu-Natal', code: 'DBN' },
  { id: 'terminal-9', name: 'Pietermaritzburg', city: 'Pietermaritzburg', province: 'KwaZulu-Natal', code: 'PMB' },
  // Eastern Cape
  { id: 'terminal-10', name: 'Port Elizabeth', city: 'Port Elizabeth', province: 'Eastern Cape', code: 'PLZ' },
  { id: 'terminal-11', name: 'East London', city: 'East London', province: 'Eastern Cape', code: 'ELS' },
  // Free State
  { id: 'terminal-12', name: 'Bloemfontein', city: 'Bloemfontein', province: 'Free State', code: 'BFN' },
  // Limpopo
  { id: 'terminal-13', name: 'Polokwane', city: 'Polokwane', province: 'Limpopo', code: 'PTG' },
  // Mpumalanga
  { id: 'terminal-14', name: 'Nelspruit', city: 'Nelspruit', province: 'Mpumalanga', code: 'NLP' },
  // North West
  { id: 'terminal-15', name: 'Rustenburg', city: 'Rustenburg', province: 'North West', code: 'RSB' },
  // Northern Cape
  { id: 'terminal-16', name: 'Kimberley', city: 'Kimberley', province: 'Northern Cape', code: 'KIM' },
]

const busOperators: BusOperator[] = [
  { id: 'op-1', name: 'Greyhound', logo: '🐕', routes: ['National', 'Cross-border'] },
  { id: 'op-2', name: 'Intercape', logo: '🚌', routes: ['National', 'Namibia', 'Mozambique'] },
  { id: 'op-3', name: 'Translux', logo: '🚍', routes: ['National'] },
  { id: 'op-4', name: 'City to City', logo: '🏙️', routes: ['National'] },
  { id: 'op-5', name: 'Eldo Coaches', logo: '🚎', routes: ['National'] },
  { id: 'op-6', name: 'Autopax', logo: '🚐', routes: ['National'] },
]

const sampleEvents: Event[] = [
  { id: 'evt-1', name: 'Miriam Makeba Tribute Concert', venue: 'Sun Arena', city: 'Pretoria', date: '2024-12-15', time: '19:00', category: 'concert', ticketTiers: [{ name: 'General', price: 350, available: 500 }, { name: 'VIP', price: 850, available: 100 }] },
  { id: 'evt-2', name: 'Kaizer Chiefs vs Orlando Pirates', venue: 'FNB Stadium', city: 'Johannesburg', date: '2024-12-21', time: '15:00', category: 'sports', ticketTiers: [{ name: 'Grandstand', price: 150, available: 2000 }, { name: 'Suite', price: 500, available: 50 }] },
  { id: 'evt-3', name: 'Lion King Musical', venue: 'Artscape', city: 'Cape Town', date: '2024-12-18', time: '20:00', category: 'theatre', ticketTiers: [{ name: 'Balcony', price: 250, available: 150 }, { name: 'Stalls', price: 450, available: 80 }] },
  { id: 'evt-4', name: 'Trevor Noah Live', venue: 'GrandWest', city: 'Cape Town', date: '2024-12-22', time: '20:00', category: 'comedy', ticketTiers: [{ name: 'Standard', price: 450, available: 200 }, { name: 'Meet & Greet', price: 1200, available: 20 }] },
  { id: 'evt-5', name: 'Cape Town Jazz Festival', venue: 'CTICC', city: 'Cape Town', date: '2025-01-15', time: '18:00', category: 'festival', ticketTiers: [{ name: 'Day Pass', price: 650, available: 3000 }, { name: 'Weekend', price: 1200, available: 500 }] },
  { id: 'evt-6', name: 'Africa Tech Summit', venue: 'Sandton Convention', city: 'Johannesburg', date: '2025-02-10', time: '09:00', category: 'exhibition', ticketTiers: [{ name: 'Standard', price: 1500, available: 500 }, { name: 'VIP Pass', price: 3500, available: 50 }] },
]

const bettingVouchers: BettingVoucher[] = [
  { id: 'bet-1', name: '1Voucher', brand: '1Voucher', platforms: ['Hollywoodbets', 'Betway', 'Sportingbet', 'SunBet', 'WSB', 'YesPlay'], denominations: [10, 20, 50, 100, 200, 500], logo: '1️⃣' },
  { id: 'bet-2', name: 'OTT Voucher', brand: 'OTT', platforms: ['Hollywoodbets', 'Betway', 'GGBet', 'Sportingbet', 'SunBet'], denominations: [10, 20, 50, 100, 200, 500], logo: '🎰' },
  { id: 'bet-3', name: 'Betway Voucher', brand: 'Betway', platforms: ['Betway'], denominations: [20, 50, 100, 200, 500], logo: '💰' },
  { id: 'bet-4', name: 'Hollywoodbets Voucher', brand: 'Hollywoodbets', platforms: ['Hollywoodbets'], denominations: [20, 50, 100, 200, 500], logo: '⭐' },
  { id: 'bet-5', name: 'Blu Voucher', brand: 'Blu', platforms: ['Hollywoodbets', 'Betway', 'Supabets', 'Bet.co.za'], denominations: [10, 20, 50, 100], logo: '🔵' },
]

// ============================================
// MAIN COMPONENT
// ============================================

export function GopayWalletView() {
  // Core state
  const [activeTab, setActiveTab] = useState('overview')
  const [walletAccounts, setWalletAccounts] = useState<WalletAccount[]>(sampleWalletAccounts)
  const [transactions, setTransactions] = useState<Transaction[]>(sampleTransactions)
  const [billers] = useState<Biller[]>(sampleBillers)
  const [contacts] = useState<Contact[]>([
    { id: 'con1', name: 'Sarah Molefe', phone: '+27 82 123 4567', recentTransactions: 5, isFavorite: true },
    { id: 'con2', name: 'Thabo Kgosiemang', phone: '+27 83 234 5678', recentTransactions: 2, isFavorite: true },
  ])
  const [selectedAccount, setSelectedAccount] = useState<WalletAccount>(sampleWalletAccounts[0])
  const [isLoading, setIsLoading] = useState(true)

  // Dialog states
  const [topupOpen, setTopupOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [payBillOpen, setPayBillOpen] = useState(false)
  const [scanQROpen, setScanQROpen] = useState(false)
  const [selectedBiller, setSelectedBiller] = useState<Biller | null>(null)
  
  // Confirmation dialog
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const [confirmationData, setConfirmationData] = useState<any>(null)
  
  // Grant+ states
  const [grantOpen, setGrantOpen] = useState(false)
  const [grantStep, setGrantStep] = useState(1)
  const [grantForm, setGrantForm] = useState({
    amount: 5000,
    purpose: '',
    idNumber: '',
    fullName: '',
    email: '',
    phone: '',
    incomeBracket: '5000-10000',
    acceptTerms: false,
  })
  
  // BNPL states
  const [bnplOpen, setBnplOpen] = useState(false)
  const [selectedBNPLMerchant, setSelectedBNPLMerchant] = useState<BNPLMerchant | null>(null)
  const [bnplAmount, setBnplAmount] = useState(0)
  const [bnplTerm, setBnplTerm] = useState(3)
  
  // Laybye states
  const [laybyeOpen, setLaybyeOpen] = useState(false)
  const [selectedLaybyeMerchant, setSelectedLaybyeMerchant] = useState<LaybyeMerchant | null>(null)
  const [laybyeAmount, setLaybyeAmount] = useState(0)
  const [laybyeTerm, setLaybyeTerm] = useState(3)
  const [laybyeDeposit, setLaybyeDeposit] = useState(10)
  
  // Insurance states
  const [insuranceOpen, setInsuranceOpen] = useState(false)
  const [selectedInsurance, setSelectedInsurance] = useState<InsuranceProduct | null>(null)
  const [insuranceStep, setInsuranceStep] = useState(1)
  const [insuranceForm, setInsuranceForm] = useState({
    idNumber: '',
    fullName: '',
    email: '',
    phone: '',
    address: '',
    premium: 100,
    acceptTerms: false,
  })
  
  // Transport states
  const [gautrainOpen, setGautrainOpen] = useState(false)
  const [busTicketOpen, setBusTicketOpen] = useState(false)
  const [selectedOrigin, setSelectedOrigin] = useState<BusTerminal | null>(null)
  const [selectedDestination, setSelectedDestination] = useState<BusTerminal | null>(null)
  const [selectedOperator, setSelectedOperator] = useState<BusOperator | null>(null)
  const [travelDate, setTravelDate] = useState('')
  const [fundingSource, setFundingSource] = useState('wallet')
  
  // Events states
  const [eventsOpen, setEventsOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [selectedTier, setSelectedTier] = useState('')
  const [ticketQty, setTicketQty] = useState(1)
  const [eventCategory, setEventCategory] = useState<string>('all')
  
  // Vouchers states
  const [vouchersOpen, setVouchersOpen] = useState(false)
  const [selectedVoucher, setSelectedVoucher] = useState<BettingVoucher | null>(null)
  const [voucherDenomination, setVoucherDenomination] = useState(0)
  const [voucherRecipient, setVoucherRecipient] = useState('')
  
  // Bill payment states
  const [billMeterNumber, setBillMeterNumber] = useState('')
  const [billAmount, setBillAmount] = useState(0)

  // Stats
  const stats = {
    totalBalance: walletAccounts.reduce((sum, a) => sum + a.balance, 0),
    monthlySpent: 4567.00,
    monthlyTopups: 5000.00,
    cashbackEarned: 45.67,
    totalTransactions: transactions.length,
  }

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  const formatCurrency = (amount: number) => `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const generateReference = (prefix: string = 'GP') => {
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `${prefix}-${timestamp}-${random}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
      case 'disbursed':
      case 'approved':
        return 'bg-green-100 text-green-700'
      case 'pending':
      case 'submitted':
      case 'kyc_pending':
        return 'bg-amber-100 text-amber-700'
      case 'failed':
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'qr_payment': return <QrCode className="h-4 w-4" />
      case 'topup': return <Download className="h-4 w-4" />
      case 'bill_payment': return <Receipt className="h-4 w-4" />
      case 'electricity': return <Zap className="h-4 w-4" />
      case 'airtime': return <Phone className="h-4 w-4" />
      case 'transfer_out': return <Send className="h-4 w-4" />
      case 'transfer_in': return <ArrowDownRight className="h-4 w-4" />
      case 'grant': return <Handshake className="h-4 w-4" />
      case 'bnpl': return <CreditCard className="h-4 w-4" />
      case 'laybye': return <ShoppingBag className="h-4 w-4" />
      case 'insurance': return <Shield className="h-4 w-4" />
      case 'gautrain': return <Train className="h-4 w-4" />
      case 'bus': return <Bus className="h-4 w-4" />
      case 'event': return <Ticket className="h-4 w-4" />
      case 'voucher': return <Gift className="h-4 w-4" />
      default: return <Coins className="h-4 w-4" />
    }
  }

  // Handler functions
  const handleBillPayment = () => {
    if (!selectedBiller || !billMeterNumber || billAmount <= 0) return
    
    const token = selectedBiller.category === 'electricity' ? 
      Math.random().toString().substring(2, 6) + '-' + 
      Math.random().toString().substring(2, 6) + '-' + 
      Math.random().toString().substring(2, 6) + '-' + 
      Math.random().toString().substring(2, 6) + '-' + 
      Math.random().toString().substring(2, 6) : undefined
    
    const newTransaction: Transaction = {
      id: `TXN${Date.now()}`,
      type: selectedBiller.category === 'electricity' ? 'electricity' : 
            selectedBiller.category === 'mobile' ? 'airtime' : 'bill_payment',
      amount: billAmount,
      currency: 'ZAR',
      status: 'completed',
      description: `${selectedBiller.name} - ${selectedBiller.category === 'electricity' ? 'Prepaid Electricity' : selectedBiller.category === 'mobile' ? 'Airtime/Data' : 'Bill Payment'}`,
      merchant: selectedBiller.name,
      category: selectedBiller.category,
      reference: generateReference('UTIL'),
      fee: selectedBiller.fee,
      token,
      meterNumber: selectedBiller.category === 'electricity' ? billMeterNumber : undefined,
      units: selectedBiller.category === 'electricity' ? `${(billAmount / 4).toFixed(1)} kWh` : undefined,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    }
    
    setTransactions(prev => [newTransaction, ...prev])
    setWalletAccounts(prev => prev.map(a => 
      a.id === selectedAccount.id 
        ? { ...a, balance: a.balance - billAmount - (selectedBiller.fee || 0) }
        : a
    ))
    
    setConfirmationData({
      type: 'bill',
      title: 'Payment Successful',
      reference: newTransaction.reference,
      amount: billAmount,
      fee: selectedBiller.fee,
      merchant: selectedBiller.name,
      meterNumber: billMeterNumber,
      token,
      units: newTransaction.units,
      date: new Date().toLocaleString(),
    })
    setConfirmationOpen(true)
    setPayBillOpen(false)
    setBillMeterNumber('')
    setBillAmount(0)
    setSelectedBiller(null)
  }

  const handleGrantSubmit = () => {
    const reference = generateReference('GRANT')
    
    setConfirmationData({
      type: 'grant',
      title: 'Grant Application Approved',
      reference,
      amount: grantForm.amount,
      purpose: grantForm.purpose,
      disbursementDate: new Date().toLocaleString(),
      fundedTo: 'Gopay Wallet',
    })
    
    setTransactions(prev => [{
      id: `TXN${Date.now()}`,
      type: 'grant',
      amount: grantForm.amount,
      currency: 'ZAR',
      status: 'completed',
      description: `Grant Received - ${grantForm.purpose}`,
      category: 'Grant',
      reference,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    }, ...prev])
    
    setWalletAccounts(prev => prev.map(a => 
      a.id === 'wallet-main'
        ? { ...a, balance: a.balance + grantForm.amount }
        : a
    ))
    
    setConfirmationOpen(true)
    setGrantOpen(false)
    setGrantStep(1)
    setGrantForm({
      amount: 5000,
      purpose: '',
      idNumber: '',
      fullName: '',
      email: '',
      phone: '',
      incomeBracket: '5000-10000',
      acceptTerms: false,
    })
  }

  const handleBNPLPurchase = () => {
    if (!selectedBNPLMerchant || bnplAmount <= 0) return
    
    const reference = generateReference('BNPL')
    const monthlyPayment = bnplAmount / bnplTerm
    
    setConfirmationData({
      type: 'bnpl',
      title: 'BNPL Purchase Complete',
      reference,
      merchant: selectedBNPLMerchant.name,
      amount: bnplAmount,
      term: bnplTerm,
      monthlyPayment,
      firstPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    })
    
    setConfirmationOpen(true)
    setBnplOpen(false)
    setSelectedBNPLMerchant(null)
    setBnplAmount(0)
    setBnplTerm(3)
  }

  const handleLaybyePurchase = () => {
    if (!selectedLaybyeMerchant || laybyeAmount <= 0) return
    
    const reference = generateReference('LAYBYE')
    const depositAmount = (laybyeAmount * laybyeDeposit) / 100
    const monthlyPayment = (laybyeAmount - depositAmount) / laybyeTerm
    
    setConfirmationData({
      type: 'laybye',
      title: 'Laybye Purchase Started',
      reference,
      merchant: selectedLaybyeMerchant.name,
      totalAmount: laybyeAmount,
      deposit: depositAmount,
      depositPercent: laybyeDeposit,
      term: laybyeTerm,
      monthlyPayment,
      nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    })
    
    setConfirmationData(prev => ({
      ...prev,
      amount: depositAmount,
    }))
    
    setTransactions(prev => [{
      id: `TXN${Date.now()}`,
      type: 'laybye',
      amount: depositAmount,
      currency: 'ZAR',
      status: 'completed',
      description: `Laybye Deposit - ${selectedLaybyeMerchant.name}`,
      category: 'Laybye',
      reference,
      merchant: selectedLaybyeMerchant.name,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    }, ...prev])
    
    setWalletAccounts(prev => prev.map(a => 
      a.id === selectedAccount.id
        ? { ...a, balance: a.balance - depositAmount }
        : a
    ))
    
    setConfirmationOpen(true)
    setLaybyeOpen(false)
    setSelectedLaybyeMerchant(null)
    setLaybyeAmount(0)
    setLaybyeTerm(3)
    setLaybyeDeposit(10)
  }

  const handleInsuranceApplication = () => {
    if (!selectedInsurance) return
    
    const reference = generateReference('INS')
    const policyNumber = `POL-${Date.now().toString(36).toUpperCase()}`
    
    setConfirmationData({
      type: 'insurance',
      title: 'Insurance Application Approved',
      reference,
      policyNumber,
      product: selectedInsurance.name,
      premium: insuranceForm.premium,
      coverage: selectedInsurance.coverage,
      startDate: new Date().toLocaleDateString(),
      debitOrderDate: '1st of each month',
    })
    
    setConfirmationOpen(true)
    setInsuranceOpen(false)
    setInsuranceStep(1)
    setSelectedInsurance(null)
    setInsuranceForm({
      idNumber: '',
      fullName: '',
      email: '',
      phone: '',
      address: '',
      premium: 100,
      acceptTerms: false,
    })
  }

  const handleGautrainTopup = (amount: number) => {
    const reference = generateReference('GT')
    
    setConfirmationData({
      type: 'gautrain',
      title: 'Gautrain Top-up Successful',
      reference,
      amount,
      cardNumber: 'GT-****4521',
      fundingSource: fundingSource === 'wallet' ? 'Gopay Wallet' : 'FNB ****4521',
      newBalance: amount + 150,
      date: new Date().toLocaleString(),
    })
    
    setTransactions(prev => [{
      id: `TXN${Date.now()}`,
      type: 'gautrain',
      amount,
      currency: 'ZAR',
      status: 'completed',
      description: 'Gautrain Card Top-up',
      category: 'Transport',
      reference,
      merchant: 'Gautrain',
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    }, ...prev])
    
    if (fundingSource === 'wallet') {
      setWalletAccounts(prev => prev.map(a => 
        a.id === selectedAccount.id
          ? { ...a, balance: a.balance - amount }
          : a
      ))
    }
    
    setConfirmationOpen(true)
    setGautrainOpen(false)
  }

  const handleBusTicketPurchase = () => {
    if (!selectedOrigin || !selectedDestination || !selectedOperator || !travelDate) return
    
    const reference = generateReference('BUS')
    const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}`
    const amount = 250 + Math.random() * 200 // Simulated price
    
    setConfirmationData({
      type: 'bus',
      title: 'Bus Ticket Purchased',
      reference,
      ticketNumber,
      operator: selectedOperator.name,
      origin: selectedOrigin.name,
      destination: selectedDestination.name,
      date: travelDate,
      seat: `${Math.floor(Math.random() * 40) + 1}`,
      amount,
      qrCode: `BUS-${reference}`,
    })
    
    setTransactions(prev => [{
      id: `TXN${Date.now()}`,
      type: 'bus',
      amount,
      currency: 'ZAR',
      status: 'completed',
      description: `${selectedOperator.name}: ${selectedOrigin.city} → ${selectedDestination.city}`,
      category: 'Transport',
      reference,
      merchant: selectedOperator.name,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    }, ...prev])
    
    setWalletAccounts(prev => prev.map(a => 
      a.id === selectedAccount.id
        ? { ...a, balance: a.balance - amount }
        : a
    ))
    
    setConfirmationOpen(true)
    setBusTicketOpen(false)
    setSelectedOrigin(null)
    setSelectedDestination(null)
    setSelectedOperator(null)
    setTravelDate('')
  }

  const handleEventTicketPurchase = () => {
    if (!selectedEvent || !selectedTier) return
    
    const tier = selectedEvent.ticketTiers.find(t => t.name === selectedTier)
    if (!tier) return
    
    const total = tier.price * ticketQty
    const reference = generateReference('EVT')
    const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}`
    
    setConfirmationData({
      type: 'event',
      title: 'Tickets Purchased',
      reference,
      ticketNumber,
      event: selectedEvent.name,
      venue: selectedEvent.venue,
      date: selectedEvent.date,
      time: selectedEvent.time,
      tier: selectedTier,
      quantity: ticketQty,
      total,
      qrCode: `EVT-${reference}`,
    })
    
    setTransactions(prev => [{
      id: `TXN${Date.now()}`,
      type: 'event',
      amount: total,
      currency: 'ZAR',
      status: 'completed',
      description: `${selectedEvent.name} - ${ticketQty}x ${selectedTier}`,
      category: 'Events',
      reference,
      merchant: selectedEvent.venue,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    }, ...prev])
    
    setWalletAccounts(prev => prev.map(a => 
      a.id === selectedAccount.id
        ? { ...a, balance: a.balance - total }
        : a
    ))
    
    setConfirmationOpen(true)
    setEventsOpen(false)
    setSelectedEvent(null)
    setSelectedTier('')
    setTicketQty(1)
  }

  const handleVoucherPurchase = () => {
    if (!selectedVoucher || voucherDenomination <= 0) return
    
    const reference = generateReference('VCH')
    const pin = Math.random().toString().substring(2, 8)
    const code = `${selectedVoucher.brand.substring(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`
    
    setConfirmationData({
      type: 'voucher',
      title: 'Voucher Purchased',
      reference,
      brand: selectedVoucher.name,
      platforms: selectedVoucher.platforms,
      amount: voucherDenomination,
      code,
      pin,
      recipient: voucherRecipient || 'Self',
      date: new Date().toLocaleString(),
    })
    
    setTransactions(prev => [{
      id: `TXN${Date.now()}`,
      type: 'voucher',
      amount: voucherDenomination,
      currency: 'ZAR',
      status: 'completed',
      description: `${selectedVoucher.name} Voucher`,
      category: 'Vouchers',
      reference,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    }, ...prev])
    
    setWalletAccounts(prev => prev.map(a => 
      a.id === selectedAccount.id
        ? { ...a, balance: a.balance - voucherDenomination }
        : a
    ))
    
    setConfirmationOpen(true)
    setVouchersOpen(false)
    setSelectedVoucher(null)
    setVoucherDenomination(0)
    setVoucherRecipient('')
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-[#00897B]" />
          <p className="text-[#757575]">Loading wallet...</p>
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
              <Wallet className="h-5 w-5 text-[#00897B]" />
              Groway Wallet
            </h1>
            <p className="text-sm text-[#757575]">Mobile payments, grants, BNPL & more</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <QrCode className="h-4 w-4 mr-2" />
              My QR
            </Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setTopupOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Top Up
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 px-2 overflow-x-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-12 bg-transparent flex-nowrap">
            <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] whitespace-nowrap text-xs px-3">Overview</TabsTrigger>
            <TabsTrigger value="pay" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] whitespace-nowrap text-xs px-3">Pay+</TabsTrigger>
            <TabsTrigger value="bills" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] whitespace-nowrap text-xs px-3">Bills</TabsTrigger>
            <TabsTrigger value="grants" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] whitespace-nowrap text-xs px-3">Grants+</TabsTrigger>
            <TabsTrigger value="bnpl" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] whitespace-nowrap text-xs px-3">BNPL</TabsTrigger>
            <TabsTrigger value="laybye" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] whitespace-nowrap text-xs px-3">Laybye</TabsTrigger>
            <TabsTrigger value="insurance" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] whitespace-nowrap text-xs px-3">Insurance</TabsTrigger>
            <TabsTrigger value="transport" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] whitespace-nowrap text-xs px-3">Transport</TabsTrigger>
            <TabsTrigger value="events" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] whitespace-nowrap text-xs px-3">Events</TabsTrigger>
            <TabsTrigger value="vouchers" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] whitespace-nowrap text-xs px-3">Vouchers</TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] whitespace-nowrap text-xs px-3">History</TabsTrigger>
            <TabsTrigger value="cards" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] whitespace-nowrap text-xs px-3">Cards</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Balance Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {walletAccounts.map(account => (
                  <Card 
                    key={account.id}
                    className={`cursor-pointer transition-all ${selectedAccount.id === account.id ? 'border-[#00897B] border-2' : 'hover:border-[#00897B]'}`}
                    onClick={() => setSelectedAccount(account)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-[#757575]">{account.name}</p>
                        <Badge variant="outline" className="capitalize">{account.type}</Badge>
                      </div>
                      <p className="text-2xl font-bold text-[#1A1A1A]">{formatCurrency(account.balance)}</p>
                      {account.linkedBank && (
                        <div className="mt-2 pt-2 border-t text-xs text-[#757575] flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {account.linkedBank.bank} {account.linkedBank.accountNumber}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                {[
                  { icon: Handshake, label: 'Grants+', color: 'bg-emerald-100 text-emerald-600', action: () => setGrantOpen(true) },
                  { icon: CreditCard, label: 'BNPL', color: 'bg-blue-100 text-blue-600', action: () => setBnplOpen(true) },
                  { icon: ShoppingBag, label: 'Laybye', color: 'bg-purple-100 text-purple-600', action: () => setLaybyeOpen(true) },
                  { icon: Shield, label: 'Insurance', color: 'bg-orange-100 text-orange-600', action: () => setInsuranceOpen(true) },
                  { icon: Train, label: 'Gautrain', color: 'bg-cyan-100 text-cyan-600', action: () => setGautrainOpen(true) },
                  { icon: Bus, label: 'Bus Tickets', color: 'bg-amber-100 text-amber-600', action: () => setBusTicketOpen(true) },
                  { icon: Ticket, label: 'Events', color: 'bg-pink-100 text-pink-600', action: () => setEventsOpen(true) },
                  { icon: Gift, label: 'Vouchers', color: 'bg-rose-100 text-rose-600', action: () => setVouchersOpen(true) },
                ].map((item, i) => (
                  <Card key={i} className="cursor-pointer hover:shadow-md transition-all" onClick={item.action}>
                    <CardContent className="p-3 text-center">
                      <div className={`w-10 h-10 rounded-full ${item.color} mx-auto mb-1 flex items-center justify-center`}>
                        <item.icon className="h-5 w-5" />
                      </div>
                      <p className="text-[10px] font-medium">{item.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-[#757575]">Monthly Spending</p>
                  <p className="text-lg font-bold">{formatCurrency(stats.monthlySpent)}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-[#757575]">Monthly Top-ups</p>
                  <p className="text-lg font-bold">{formatCurrency(stats.monthlyTopups)}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-xs text-[#757575]">Cashback Earned</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(stats.cashbackEarned)}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-[#757575]">Transactions</p>
                  <p className="text-lg font-bold">{stats.totalTransactions}</p>
                </div>
              </div>

              {/* Recent Transactions */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
                    <Button variant="ghost" size="sm" className="text-xs text-[#00897B]" onClick={() => setActiveTab('history')}>
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {transactions.slice(0, 5).map(txn => (
                      <div key={txn.id} className="p-4 hover:bg-gray-50 cursor-pointer flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          {getTransactionIcon(txn.type)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{txn.description}</p>
                          <p className="text-xs text-[#757575]">{new Date(txn.createdAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${['topup', 'transfer_in', 'cashback', 'refund', 'grant'].includes(txn.type) ? 'text-green-600' : 'text-[#1A1A1A]'}`}>
                            {['topup', 'transfer_in', 'cashback', 'refund', 'grant'].includes(txn.type) ? '+' : '-'}{formatCurrency(txn.amount)}
                          </p>
                          <Badge className={getStatusColor(txn.status)} variant="outline">
                            {txn.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Pay+ Tab */}
          {activeTab === 'pay' && (
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-48 h-48 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <QrCode className="h-24 w-24 text-gray-400" />
                  </div>
                  <p className="text-lg font-medium mb-2">Scan QR to Pay</p>
                  <p className="text-sm text-[#757575] mb-4">Scan a merchant's QR code to make instant payments</p>
                  <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setScanQROpen(true)}>
                    <QrCode className="h-4 w-4 mr-2" />
                    Open Scanner
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Send Money</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input placeholder="Search contacts or enter phone number..." className="mb-3" />
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {contacts.filter(c => c.isFavorite).map(contact => (
                      <button key={contact.id} className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-100 min-w-[70px]">
                        <div className="w-12 h-12 rounded-full bg-[#E0F2F1] flex items-center justify-center text-[#00897B] font-medium">
                          {contact.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <p className="text-xs font-medium truncate w-full text-center">{contact.name.split(' ')[0]}</p>
                      </button>
                    ))}
                  </div>
                  <Button className="w-full bg-[#00897B] hover:bg-[#00695C] mt-4" onClick={() => setTransferOpen(true)}>
                    <Send className="h-4 w-4 mr-2" />
                    Send Money
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Bills Tab */}
          {activeTab === 'bills' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {[
                  { category: 'electricity', icon: Zap, label: 'Electricity' },
                  { category: 'water', icon: Droplets, label: 'Water' },
                  { category: 'mobile', icon: Phone, label: 'Airtime' },
                  { category: 'internet', icon: Wifi, label: 'Internet' },
                  { category: 'tv', icon: Tv, label: 'TV' },
                  { category: 'municipal', icon: Building2, label: 'Municipal' },
                ].map(item => (
                  <Card key={item.category} className="cursor-pointer hover:border-[#00897B] hover:shadow-md transition-all text-center">
                    <CardContent className="p-4">
                      <item.icon className="h-8 w-8 mx-auto mb-2 text-[#00897B]" />
                      <p className="text-sm font-medium">{item.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-4">Popular Billers</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {billers.map(biller => (
                    <Card 
                      key={biller.id}
                      className="cursor-pointer hover:border-[#00897B] hover:shadow-md transition-all"
                      onClick={() => {
                        setSelectedBiller(biller)
                        setPayBillOpen(true)
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-[#E0F2F1] flex items-center justify-center text-[#00897B]">
                            {biller.category === 'electricity' && <Zap className="h-6 w-6" />}
                            {biller.category === 'mobile' && <Phone className="h-6 w-6" />}
                            {biller.category === 'tv' && <Tv className="h-6 w-6" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{biller.name}</p>
                            <p className="text-xs text-[#757575]">{biller.estimatedTime}</p>
                          </div>
                          {biller.fee === 0 && <Badge className="bg-green-100 text-green-700">Free</Badge>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Grants+ Tab */}
          {activeTab === 'grants' && (
            <div className="space-y-6">
              <Card className="border-emerald-200 bg-emerald-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Handshake className="h-8 w-8 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-emerald-800">Groway Grants+</h2>
                      <p className="text-emerald-600">Instant access to financial support</p>
                    </div>
                  </div>
                  <p className="text-sm text-emerald-700 mb-4">
                    Apply for a grant and receive funds instantly after KYC verification and contract agreement. No waiting periods.
                  </p>
                  <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setGrantOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Apply Now
                  </Button>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['Quick application', 'Instant disbursement', 'Flexible repayment'].map((feature, i) => (
                  <Card key={i}>
                    <CardContent className="p-4 text-center">
                      <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                      <p className="font-medium">{feature}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* BNPL Tab */}
          {activeTab === 'bnpl' && (
            <div className="space-y-6">
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                      <CreditCard className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-blue-800">Buy Now, Pay Later</h2>
                      <p className="text-blue-600">Shop now with flexible payment options</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <h3 className="font-semibold">Available Merchants</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {bnplMerchants.map(merchant => (
                  <Card key={merchant.id} className="cursor-pointer hover:border-blue-400 hover:shadow-md transition-all"
                    onClick={() => { setSelectedBNPLMerchant(merchant); setBnplOpen(true); }}>
                    <CardContent className="p-4 text-center">
                      <div className="text-4xl mb-2">{merchant.logo}</div>
                      <p className="font-medium">{merchant.name}</p>
                      <p className="text-xs text-[#757575]">Up to {formatCurrency(merchant.maxLimit)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Laybye Tab */}
          {activeTab === 'laybye' && (
            <div className="space-y-6">
              <Card className="border-purple-200 bg-purple-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                      <ShoppingBag className="h-8 w-8 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-purple-800">Laybye Purchases</h2>
                      <p className="text-purple-600">Pay over time, own it when done</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <h3 className="font-semibold">Participating Stores</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {laybyeMerchants.map(merchant => (
                  <Card key={merchant.id} className="cursor-pointer hover:border-purple-400 hover:shadow-md transition-all"
                    onClick={() => { setSelectedLaybyeMerchant(merchant); setLaybyeOpen(true); }}>
                    <CardContent className="p-4 text-center">
                      <div className="text-4xl mb-2">{merchant.logo}</div>
                      <p className="font-medium">{merchant.name}</p>
                      <p className="text-xs text-[#757575]">{merchant.minDeposit}% deposit</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Insurance Tab */}
          {activeTab === 'insurance' && (
            <div className="space-y-6">
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                      <Shield className="h-8 w-8 text-orange-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-orange-800">Insurance Products</h2>
                      <p className="text-orange-600">Comprehensive coverage for you and your family</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insuranceProducts.map(product => (
                  <Card key={product.id} className="cursor-pointer hover:border-orange-400 hover:shadow-md transition-all"
                    onClick={() => { setSelectedInsurance(product); setInsuranceOpen(true); }}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                          {product.type === 'funeral' && <Heart className="h-6 w-6" />}
                          {product.type === 'life' && <Users className="h-6 w-6" />}
                          {product.type === 'car' && <Car className="h-6 w-6" />}
                          {product.type === 'home' && <Home className="h-6 w-6" />}
                          {product.type === 'business' && <Briefcase className="h-6 w-6" />}
                          {product.type === 'health' && <Heart className="h-6 w-6" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{product.name}</p>
                          <p className="text-xs text-[#757575]">{product.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">{product.coverage}</Badge>
                            <span className="text-xs font-medium">From R{product.minPremium}/mo</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Transport Tab */}
          {activeTab === 'transport' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="cursor-pointer hover:border-cyan-400 hover:shadow-md transition-all"
                  onClick={() => setGautrainOpen(true)}>
                  <CardContent className="p-6 text-center">
                    <div className="w-20 h-20 rounded-full bg-cyan-100 mx-auto mb-4 flex items-center justify-center">
                      <Train className="h-10 w-10 text-cyan-600" />
                    </div>
                    <h3 className="text-lg font-bold">Gautrain Top-up</h3>
                    <p className="text-sm text-[#757575]">Top up your Gautrain card instantly</p>
                    <Badge className="mt-2 bg-cyan-100 text-cyan-700">Instant</Badge>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:border-amber-400 hover:shadow-md transition-all"
                  onClick={() => setBusTicketOpen(true)}>
                  <CardContent className="p-6 text-center">
                    <div className="w-20 h-20 rounded-full bg-amber-100 mx-auto mb-4 flex items-center justify-center">
                      <Bus className="h-10 w-10 text-amber-600" />
                    </div>
                    <h3 className="text-lg font-bold">Bus Tickets</h3>
                    <p className="text-sm text-[#757575]">Book intercity bus tickets</p>
                    <Badge className="mt-2 bg-amber-100 text-amber-700">National</Badge>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Popular Routes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                {[
                  { from: 'Johannesburg', to: 'Cape Town', duration: '18h' },
                  { from: 'Pretoria', to: 'Durban', duration: '8h' },
                  { from: 'Cape Town', to: 'Port Elizabeth', duration: '12h' },
                ].map((route, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#757575]" />
                      <span className="text-sm">{route.from}</span>
                      <ArrowRight className="h-4 w-4 text-[#757575]" />
                      <span className="text-sm">{route.to}</span>
                    </div>
                    <span className="text-xs text-[#757575]">{route.duration}</span>
                  </div>
                ))}
              </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Events Tab */}
          {activeTab === 'events' && (
            <div className="space-y-6">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {['all', 'concert', 'sports', 'theatre', 'comedy', 'festival', 'exhibition'].map(cat => (
                  <Button
                    key={cat}
                    variant={eventCategory === cat ? 'default' : 'outline'}
                    size="sm"
                    className={eventCategory === cat ? 'bg-[#00897B] hover:bg-[#00695C]' : ''}
                    onClick={() => setEventCategory(cat)}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sampleEvents
                  .filter(e => eventCategory === 'all' || e.category === eventCategory)
                  .map(event => (
                  <Card key={event.id} className="cursor-pointer hover:border-pink-400 hover:shadow-md transition-all overflow-hidden"
                    onClick={() => { setSelectedEvent(event); setEventsOpen(true); }}>
                    <div className="h-32 bg-gradient-to-r from-pink-100 to-purple-100 flex items-center justify-center">
                      {event.category === 'concert' && <Music className="h-12 w-12 text-pink-400" />}
                      {event.category === 'sports' && <Trophy className="h-12 w-12 text-amber-400" />}
                      {event.category === 'theatre' && <Clapperboard className="h-12 w-12 text-purple-400" />}
                      {event.category === 'comedy' && <Star className="h-12 w-12 text-yellow-400" />}
                      {event.category === 'festival' && <Sparkles className="h-12 w-12 text-pink-400" />}
                      {event.category === 'exhibition' && <Microscope className="h-12 w-12 text-blue-400" />}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="capitalize text-[10px]">{event.category}</Badge>
                      </div>
                      <h3 className="font-semibold">{event.name}</h3>
                      <p className="text-xs text-[#757575]">{event.venue}, {event.city}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-[#757575]">{event.date} at {event.time}</span>
                        <span className="text-sm font-bold text-[#00897B]">From R{event.ticketTiers[0].price}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Vouchers Tab */}
          {activeTab === 'vouchers' && (
            <div className="space-y-6">
              <Card className="border-rose-200 bg-rose-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Gamepad2 className="h-8 w-8 text-rose-600" />
                    <div>
                      <h3 className="font-semibold text-rose-800">Betting & Gaming Vouchers</h3>
                      <p className="text-xs text-rose-600">Instant top-up for your favourite betting platforms</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bettingVouchers.map(voucher => (
                  <Card key={voucher.id} className="cursor-pointer hover:border-rose-400 hover:shadow-md transition-all"
                    onClick={() => { setSelectedVoucher(voucher); setVouchersOpen(true); }}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="text-4xl">{voucher.logo}</div>
                        <div className="flex-1">
                          <p className="font-semibold">{voucher.name}</p>
                          <p className="text-xs text-[#757575]">{voucher.platforms.slice(0, 3).join(', ')}{voucher.platforms.length > 3 ? '...' : ''}</p>
                          <div className="flex gap-1 mt-1">
                            {voucher.denominations.slice(0, 4).map(d => (
                              <Badge key={d} variant="outline" className="text-[10px]">R{d}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {transactions.map(txn => (
                      <div key={txn.id} className="p-4 hover:bg-gray-50 cursor-pointer flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          {getTransactionIcon(txn.type)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{txn.description}</p>
                          <div className="flex items-center gap-2 text-xs text-[#757575]">
                            <span>{new Date(txn.createdAt).toLocaleDateString('en-ZA')}</span>
                            <span>•</span>
                            <span>{txn.reference}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${['topup', 'transfer_in', 'cashback', 'refund', 'grant'].includes(txn.type) ? 'text-green-600' : 'text-[#1A1A1A]'}`}>
                            {['topup', 'transfer_in', 'cashback', 'refund', 'grant'].includes(txn.type) ? '+' : '-'}{formatCurrency(txn.amount)}
                          </p>
                          <Badge className={getStatusColor(txn.status)} variant="outline">
                            {txn.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Cards Tab */}
          {activeTab === 'cards' && (
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-[#00897B] to-[#00695C] text-white">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <p className="text-sm opacity-80">Groway Virtual Card</p>
                      <p className="text-xs opacity-60 mt-1">Powered by Mastercard</p>
                    </div>
                    <Wallet className="h-8 w-8 opacity-80" />
                  </div>
                  <p className="text-xl tracking-widest mb-6">•••• •••• •••• 4582</p>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs opacity-60">Card Holder</p>
                      <p className="font-medium">JOHN DLAMINI</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs opacity-60">Expires</p>
                      <p className="font-medium">12/27</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
                  <Eye className="h-5 w-5" />
                  <span className="text-xs">View Details</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
                  <Lock className="h-5 w-5" />
                  <span className="text-xs">Lock Card</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
                  <Settings className="h-5 w-5" />
                  <span className="text-xs">Settings</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
                  <Plus className="h-5 w-5" />
                  <span className="text-xs">Add Card</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Bill Payment Dialog */}
      <Dialog open={payBillOpen} onOpenChange={setPayBillOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pay {selectedBiller?.name || 'Bill'}</DialogTitle>
            <DialogDescription>
              {selectedBiller?.accountFormat}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Account/Meter Number</Label>
              <Input 
                placeholder={selectedBiller?.accountFormat || 'Enter number'}
                value={billMeterNumber}
                onChange={(e) => setBillMeterNumber(e.target.value)}
              />
            </div>
            <div>
              <Label>Amount (R)</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {[50, 100, 200, 500].map(amt => (
                  <Button 
                    key={amt} 
                    variant={billAmount === amt ? 'default' : 'outline'}
                    className={billAmount === amt ? 'bg-[#00897B] hover:bg-[#00695C]' : ''}
                    onClick={() => setBillAmount(amt)}
                  >
                    R{amt}
                  </Button>
                ))}
              </div>
              <Input 
                type="number" 
                placeholder="Or enter custom amount"
                className="mt-2"
                value={billAmount || ''}
                onChange={(e) => setBillAmount(Number(e.target.value))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayBillOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleBillPayment}>
              Pay {formatCurrency(billAmount + (selectedBiller?.fee || 0))}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grant Application Dialog */}
      <Dialog open={grantOpen} onOpenChange={setGrantOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Handshake className="h-5 w-5 text-emerald-600" />
              Apply for Grant+
            </DialogTitle>
          </DialogHeader>
          
          {grantStep === 1 && (
            <div className="space-y-4 py-4">
              <div>
                <Label>Grant Amount</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {[1000, 2500, 5000, 10000].map(amt => (
                    <Button 
                      key={amt} 
                      variant={grantForm.amount === amt ? 'default' : 'outline'}
                      className={grantForm.amount === amt ? 'bg-emerald-600' : ''}
                      onClick={() => setGrantForm(prev => ({ ...prev, amount: amt }))}
                    >
                      R{amt}
                    </Button>
                  ))}
                </div>
                <Input 
                  type="number" 
                  placeholder="Or enter custom amount (R500 - R50,000)"
                  className="mt-2"
                  value={grantForm.amount || ''}
                  onChange={(e) => setGrantForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label>Purpose</Label>
                <Textarea 
                  placeholder="Briefly explain what you need the grant for..."
                  value={grantForm.purpose}
                  onChange={(e) => setGrantForm(prev => ({ ...prev, purpose: e.target.value }))}
                />
              </div>
            </div>
          )}

          {grantStep === 2 && (
            <div className="space-y-4 py-4">
              <div className="bg-emerald-50 p-3 rounded-lg mb-4">
                <p className="text-sm text-emerald-700"><strong>KYC Verification Required</strong></p>
                <p className="text-xs text-emerald-600">Please provide your details for instant verification</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Full Name</Label>
                  <Input 
                    value={grantForm.fullName}
                    onChange={(e) => setGrantForm(prev => ({ ...prev, fullName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>ID Number</Label>
                  <Input 
                    value={grantForm.idNumber}
                    onChange={(e) => setGrantForm(prev => ({ ...prev, idNumber: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <Input 
                  type="email"
                  value={grantForm.email}
                  onChange={(e) => setGrantForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input 
                  value={grantForm.phone}
                  onChange={(e) => setGrantForm(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>
          )}

          {grantStep === 3 && (
            <div className="space-y-4 py-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Grant Application Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-bold">{formatCurrency(grantForm.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Purpose:</span>
                    <span>{grantForm.purpose}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Applicant:</span>
                    <span>{grantForm.fullName}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <input 
                  type="checkbox" 
                  className="mt-1"
                  checked={grantForm.acceptTerms}
                  onChange={(e) => setGrantForm(prev => ({ ...prev, acceptTerms: e.target.checked }))}
                />
                <Label className="text-xs">
                  I agree to the terms and conditions and confirm that the information provided is accurate. Funds will be disbursed instantly upon approval.
                </Label>
              </div>
            </div>
          )}

          <DialogFooter>
            {grantStep > 1 && (
              <Button variant="outline" onClick={() => setGrantStep(prev => prev - 1)}>Back</Button>
            )}
            {grantStep < 3 ? (
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setGrantStep(prev => prev + 1)}>
                Continue
              </Button>
            ) : (
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleGrantSubmit} disabled={!grantForm.acceptTerms}>
                Submit Application
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* BNPL Dialog */}
      <Dialog open={bnplOpen} onOpenChange={setBnplOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Buy Now, Pay Later - {selectedBNPLMerchant?.name}</DialogTitle>
            <DialogDescription>Purchase up to {formatCurrency(selectedBNPLMerchant?.maxLimit || 0)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Purchase Amount</Label>
              <Input 
                type="number" 
                placeholder="Enter amount"
                value={bnplAmount || ''}
                onChange={(e) => setBnplAmount(Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Repayment Term</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {[3, 6, 12].map(months => (
                  <Button 
                    key={months} 
                    variant={bnplTerm === months ? 'default' : 'outline'}
                    className={bnplTerm === months ? 'bg-blue-600' : ''}
                    onClick={() => setBnplTerm(months)}
                  >
                    {months} months
                  </Button>
                ))}
              </div>
              {bnplAmount > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Monthly Payment:</span>
                    <span className="font-bold">{formatCurrency(bnplAmount / bnplTerm)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBnplOpen(false)}>Cancel</Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleBNPLPurchase}>
              Confirm Purchase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Laybye Dialog */}
      <Dialog open={laybyeOpen} onOpenChange={setLaybyeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Laybye - {selectedLaybyeMerchant?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Total Purchase Amount</Label>
              <Input 
                type="number" 
                placeholder="Enter amount"
                value={laybyeAmount || ''}
                onChange={(e) => setLaybyeAmount(Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Deposit Percentage</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {[10, 15, 20].map(pct => (
                  <Button 
                    key={pct} 
                    variant={laybyeDeposit === pct ? 'default' : 'outline'}
                    className={laybyeDeposit === pct ? 'bg-purple-600' : ''}
                    onClick={() => setLaybyeDeposit(pct)}
                  >
                    {pct}%
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label>Term (months)</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {[2, 3, 6].map(months => (
                  <Button 
                    key={months} 
                    variant={laybyeTerm === months ? 'default' : 'outline'}
                    className={laybyeTerm === months ? 'bg-purple-600' : ''}
                    onClick={() => setLaybyeTerm(months)}
                  >
                    {months} months
                  </Button>
                ))}
              </div>
            </div>
            {laybyeAmount > 0 && (
              <div className="p-3 bg-purple-50 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Deposit ({laybyeDeposit}%):</span>
                  <span className="font-bold">{formatCurrency(laybyeAmount * laybyeDeposit / 100)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Monthly Payment:</span>
                  <span className="font-bold">{formatCurrency((laybyeAmount - laybyeAmount * laybyeDeposit / 100) / laybyeTerm)}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLaybyeOpen(false)}>Cancel</Button>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleLaybyePurchase}>
              Start Laybye
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Insurance Dialog */}
      <Dialog open={insuranceOpen} onOpenChange={setInsuranceOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedInsurance?.name || 'Insurance Application'}</DialogTitle>
            <DialogDescription>{selectedInsurance?.description}</DialogDescription>
          </DialogHeader>
          
          {insuranceStep === 1 && (
            <div className="space-y-4 py-4">
              <div>
                <Label>Coverage: {selectedInsurance?.coverage}</Label>
              </div>
              <div>
                <Label>Monthly Premium</Label>
                <Input 
                  type="number"
                  placeholder={`R${selectedInsurance?.minPremium} - R${selectedInsurance?.maxPremium}`}
                  value={insuranceForm.premium || ''}
                  onChange={(e) => setInsuranceForm(prev => ({ ...prev, premium: Number(e.target.value) }))}
                />
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Features</h4>
                <ul className="text-xs space-y-1">
                  {selectedInsurance?.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-orange-500" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {insuranceStep === 2 && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Full Name</Label>
                  <Input 
                    value={insuranceForm.fullName}
                    onChange={(e) => setInsuranceForm(prev => ({ ...prev, fullName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>ID Number</Label>
                  <Input 
                    value={insuranceForm.idNumber}
                    onChange={(e) => setInsuranceForm(prev => ({ ...prev, idNumber: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <Input 
                  type="email"
                  value={insuranceForm.email}
                  onChange={(e) => setInsuranceForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input 
                  value={insuranceForm.phone}
                  onChange={(e) => setInsuranceForm(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div>
                <Label>Address</Label>
                <Textarea 
                  value={insuranceForm.address}
                  onChange={(e) => setInsuranceForm(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
            </div>
          )}

          {insuranceStep === 3 && (
            <div className="space-y-4 py-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Application Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Product:</span>
                    <span className="font-medium">{selectedInsurance?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Coverage:</span>
                    <span>{selectedInsurance?.coverage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monthly Premium:</span>
                    <span className="font-bold">{formatCurrency(insuranceForm.premium)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <input 
                  type="checkbox"
                  className="mt-1"
                  checked={insuranceForm.acceptTerms}
                  onChange={(e) => setInsuranceForm(prev => ({ ...prev, acceptTerms: e.target.checked }))}
                />
                <Label className="text-xs">I agree to the policy terms and authorize monthly debit order</Label>
              </div>
            </div>
          )}

          <DialogFooter>
            {insuranceStep > 1 && (
              <Button variant="outline" onClick={() => setInsuranceStep(prev => prev - 1)}>Back</Button>
            )}
            {insuranceStep < 3 ? (
              <Button className="bg-orange-600 hover:bg-orange-700" onClick={() => setInsuranceStep(prev => prev + 1)}>
                Continue
              </Button>
            ) : (
              <Button className="bg-orange-600 hover:bg-orange-700" onClick={handleInsuranceApplication} disabled={!insuranceForm.acceptTerms}>
                Submit Application
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Gautrain Top-up Dialog */}
      <Dialog open={gautrainOpen} onOpenChange={setGautrainOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Train className="h-5 w-5 text-cyan-600" />
              Gautrain Card Top-up
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Gautrain Card Number</Label>
              <Input placeholder="GT-XXXXXXXXXX" defaultValue="GT-4521345821" />
            </div>
            <div>
              <Label>Top-up Amount</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {[50, 100, 200, 500].map(amt => (
                  <Button key={amt} variant="outline" onClick={() => handleGautrainTopup(amt)}>
                    R{amt}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label>Funding Source</Label>
              <Select value={fundingSource} onValueChange={setFundingSource}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wallet">Gopay Wallet ({formatCurrency(walletAccounts[0].balance)})</SelectItem>
                  <SelectItem value="fnb">FNB ****4521</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGautrainOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bus Ticket Dialog */}
      <Dialog open={busTicketOpen} onOpenChange={setBusTicketOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bus className="h-5 w-5 text-amber-600" />
              Book Bus Ticket
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>From</Label>
                <Select value={selectedOrigin?.id} onValueChange={(v) => setSelectedOrigin(busTerminals.find(t => t.id === v) || null)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select origin" />
                  </SelectTrigger>
                  <SelectContent>
                    {busTerminals.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}, {t.province}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>To</Label>
                <Select value={selectedDestination?.id} onValueChange={(v) => setSelectedDestination(busTerminals.find(t => t.id === v) || null)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {busTerminals.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}, {t.province}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Operator</Label>
              <Select value={selectedOperator?.id} onValueChange={(v) => setSelectedOperator(busOperators.find(o => o.id === v) || null)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select bus operator" />
                </SelectTrigger>
                <SelectContent>
                  {busOperators.map(o => (
                    <SelectItem key={o.id} value={o.id}>
                      <span className="flex items-center gap-2">
                        <span>{o.logo}</span>
                        <span>{o.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Travel Date</Label>
              <Input 
                type="date" 
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBusTicketOpen(false)}>Cancel</Button>
            <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleBusTicketPurchase}>
              Book Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Events Dialog */}
      <Dialog open={eventsOpen} onOpenChange={setEventsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.name}</DialogTitle>
            <DialogDescription>
              {selectedEvent?.venue}, {selectedEvent?.city} • {selectedEvent?.date} at {selectedEvent?.time}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Ticket Type</Label>
              <div className="grid gap-2 mt-2">
                {selectedEvent?.ticketTiers.map(tier => (
                  <button
                    key={tier.name}
                    className={`p-3 rounded-lg border text-left ${selectedTier === tier.name ? 'border-pink-500 bg-pink-50' : 'hover:border-gray-300'}`}
                    onClick={() => setSelectedTier(tier.name)}
                  >
                    <div className="flex justify-between">
                      <span className="font-medium">{tier.name}</span>
                      <span className="font-bold">{formatCurrency(tier.price)}</span>
                    </div>
                    <p className="text-xs text-[#757575]">{tier.available} available</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Quantity</Label>
              <div className="flex items-center gap-4 mt-2">
                <Button variant="outline" size="sm" onClick={() => setTicketQty(Math.max(1, ticketQty - 1))}>-</Button>
                <span className="font-bold">{ticketQty}</span>
                <Button variant="outline" size="sm" onClick={() => setTicketQty(ticketQty + 1)}>+</Button>
              </div>
            </div>
            {selectedTier && (
              <div className="p-3 bg-pink-50 rounded-lg">
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(selectedEvent?.ticketTiers.find(t => t.name === selectedTier)?.price || 0) * ticketQty}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEventsOpen(false)}>Cancel</Button>
            <Button className="bg-pink-600 hover:bg-pink-700" onClick={handleEventTicketPurchase} disabled={!selectedTier}>
              Purchase Tickets
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vouchers Dialog */}
      <Dialog open={vouchersOpen} onOpenChange={setVouchersOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-rose-600" />
              {selectedVoucher?.name}
            </DialogTitle>
            <DialogDescription>
              Use on: {selectedVoucher?.platforms.join(', ')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Select Amount</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {selectedVoucher?.denominations.map(amt => (
                  <Button 
                    key={amt}
                    variant={voucherDenomination === amt ? 'default' : 'outline'}
                    className={voucherDenomination === amt ? 'bg-rose-600' : ''}
                    onClick={() => setVoucherDenomination(amt)}
                  >
                    R{amt}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label>Recipient Phone (optional)</Label>
              <Input 
                placeholder="Leave blank for self"
                value={voucherRecipient}
                onChange={(e) => setVoucherRecipient(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVouchersOpen(false)}>Cancel</Button>
            <Button className="bg-rose-600 hover:bg-rose-700" onClick={handleVoucherPurchase} disabled={voucherDenomination <= 0}>
              Purchase R{voucherDenomination}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              {confirmationData?.title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {/* Reference */}
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <p className="text-xs text-green-600 mb-1">Reference Number</p>
              <p className="text-xl font-mono font-bold text-green-700">{confirmationData?.reference}</p>
            </div>

            {/* Transaction Details */}
            <div className="space-y-2 text-sm">
              {confirmationData?.amount && (
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-bold">{formatCurrency(confirmationData.amount)}</span>
                </div>
              )}
              {confirmationData?.merchant && (
                <div className="flex justify-between">
                  <span>Merchant:</span>
                  <span>{confirmationData.merchant}</span>
                </div>
              )}
              {confirmationData?.date && (
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{confirmationData.date}</span>
                </div>
              )}
              {confirmationData?.token && (
                <div className="p-3 bg-amber-50 rounded-lg">
                  <p className="text-xs text-amber-600 mb-1">Electricity Token</p>
                  <p className="font-mono font-bold text-amber-700">{confirmationData.token}</p>
                </div>
              )}
              {confirmationData?.meterNumber && (
                <div className="flex justify-between">
                  <span>Meter Number:</span>
                  <span>{confirmationData.meterNumber}</span>
                </div>
              )}
              {confirmationData?.units && (
                <div className="flex justify-between">
                  <span>Units:</span>
                  <span className="font-medium">{confirmationData.units}</span>
                </div>
              )}
              {confirmationData?.policyNumber && (
                <div className="flex justify-between">
                  <span>Policy Number:</span>
                  <span className="font-mono">{confirmationData.policyNumber}</span>
                </div>
              )}
              {confirmationData?.ticketNumber && (
                <div className="flex justify-between">
                  <span>Ticket Number:</span>
                  <span className="font-mono">{confirmationData.ticketNumber}</span>
                </div>
              )}
              {confirmationData?.code && (
                <div className="p-3 bg-rose-50 rounded-lg">
                  <p className="text-xs text-rose-600 mb-1">Voucher Code</p>
                  <p className="font-mono font-bold text-rose-700">{confirmationData.code}</p>
                  {confirmationData.pin && (
                    <p className="text-xs mt-1">PIN: {confirmationData.pin}</p>
                  )}
                </div>
              )}
            </div>

            {/* QR Code placeholder */}
            {(confirmationData?.type === 'event' || confirmationData?.type === 'bus') && (
              <div className="p-4 bg-gray-100 rounded-lg text-center">
                <QrCode className="h-16 w-16 mx-auto text-gray-400 mb-2" />
                <p className="text-xs text-[#757575]">Scan QR code at venue</p>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmationOpen(false)}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button className="flex-1 bg-[#00897B] hover:bg-[#00695C]" onClick={() => { setConfirmationOpen(false); setActiveTab('history'); }}>
              <Receipt className="h-4 w-4 mr-2" />
              View in History
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Top Up Dialog */}
      <Dialog open={topupOpen} onOpenChange={setTopupOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Top Up Wallet</DialogTitle>
            <DialogDescription>Add money to your Groway wallet</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-2">
              {[100, 200, 500, 1000, 2000, 5000].map(amount => (
                <Button key={amount} variant="outline" className="h-12">
                  R{amount}
                </Button>
              ))}
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Or enter amount</label>
              <Input type="number" placeholder="0.00" className="text-lg" />
            </div>
            <Select defaultValue="fnb">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fnb">FNB ****4521</SelectItem>
                <SelectItem value="capitec">Capitec ****7890</SelectItem>
                <SelectItem value="card">New Card</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTopupOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]">
              <Plus className="h-4 w-4 mr-2" />
              Top Up
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
