'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
  Star,
  TrendingUp,
  TrendingDown,
  Crown,
  Gift,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Coins,
  ShoppingBag,
  Heart,
  Send,
  Filter,
  Download,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Award,
  Sparkles,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Zap,
  Brain,
  Lightbulb,
  TrendingUp as TrendIcon,
  Users as UsersIcon,
  Coins as CoinsIcon,
  X,
  Save,
  Settings,
  Bell,
  Bot,
  MessageSquare,
  Megaphone,
  RefreshCw,
  ArrowRight,
} from 'lucide-react'

// Custom WhatsApp Icon (lucide-react doesn't include brand icons)
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
)

// Types
interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  avatar?: string
  segment: 'champion' | 'loyal' | 'potential' | 'at_risk' | 'new' | 'dormant'
  rfmScore: { r: number; f: number; m: number }
  totalSpent: number
  totalOrders: number
  avgOrderValue: number
  lastVisit: string
  joinedDate: string
  loyaltyPoints: number
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum'
  tags: string[]
  notes?: string
  preferences?: string[]
  birthday?: string
  lifetimeValue: number
  churnProbability: number
  nextBestOffer?: string
}

interface LoyaltyTier {
  id: string
  name: string
  minPoints: number
  maxPoints: number
  discount: number
  color: string
  icon: typeof Crown
  benefits: string[]
  pointsMultiplier: number
  isActive: boolean
}

interface LoyaltyReward {
  id: string
  name: string
  pointsCost: number
  description: string
  category: 'discount' | 'free_item' | 'voucher' | 'experience'
  isActive: boolean
}

interface Campaign {
  id: string
  name: string
  type: 'whatsapp' | 'sms' | 'email' | 'push'
  targetSegment: string
  status: 'draft' | 'scheduled' | 'active' | 'completed'
  sentCount: number
  openedCount: number
  clickedCount: number
  revenue: number
  scheduledDate?: string
  createdAt: string
}

interface GroAIInsight {
  id: string
  type: 'churn_alert' | 'opportunity' | 'trend' | 'recommendation'
  title: string
  description: string
  action: string
  impact: 'high' | 'medium' | 'low'
  affectedCustomers: number
  potentialRevenue: number
}

// Purchase History interface
interface PurchaseRecord {
  id: string
  customerId: string
  date: string
  items: { name: string; quantity: number; price: number }[]
  total: number
  paymentMethod: string
  staffMember?: string
  location?: string
  notes?: string
}

// Communication Log interface
interface CommunicationRecord {
  id: string
  customerId: string
  type: 'whatsapp' | 'sms' | 'email' | 'call' | 'in_person'
  direction: 'outbound' | 'inbound'
  subject?: string
  message: string
  date: string
  staffMember?: string
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'received'
}

// Referral Program interface
interface ReferralRecord {
  id: string
  referrerId: string
  referrerName: string
  referredId?: string
  referredName?: string
  status: 'pending' | 'completed' | 'rewarded'
  rewardType: 'points' | 'discount' | 'cash'
  rewardValue: number
  createdAt: string
  completedAt?: string
}

// Generate mock purchase history
const generatePurchaseHistory = (): PurchaseRecord[] => [
  { id: 'PUR-001', customerId: 'CUS-001', date: '2026-02-15', items: [{ name: 'Hair Treatment', quantity: 1, price: 350 }, { name: 'Manicure', quantity: 1, price: 150 }], total: 500, paymentMethod: 'Card', staffMember: 'Nomsa', location: 'Main Branch' },
  { id: 'PUR-002', customerId: 'CUS-001', date: '2026-02-08', items: [{ name: 'Spa Package', quantity: 1, price: 850 }], total: 850, paymentMethod: 'Card', staffMember: 'Thabo', location: 'Main Branch' },
  { id: 'PUR-003', customerId: 'CUS-001', date: '2026-01-28', items: [{ name: 'Haircut', quantity: 1, price: 200 }, { name: 'Hair Treatment', quantity: 1, price: 350 }], total: 550, paymentMethod: 'Cash', staffMember: 'Nomsa', location: 'Main Branch' },
  { id: 'PUR-004', customerId: 'CUS-006', date: '2026-02-15', items: [{ name: 'VIP Package', quantity: 1, price: 1200 }, { name: 'Product Bundle', quantity: 2, price: 350 }], total: 1900, paymentMethod: 'Card', staffMember: 'Nomsa', location: 'Main Branch' },
  { id: 'PUR-005', customerId: 'CUS-002', date: '2026-02-14', items: [{ name: 'Haircut', quantity: 1, price: 200 }], total: 200, paymentMethod: 'Card', staffMember: 'Thabo', location: 'Main Branch' },
  { id: 'PUR-006', customerId: 'CUS-005', date: '2026-02-14', items: [{ name: 'New Client Package', quantity: 1, price: 297 }], total: 297, paymentMethod: 'Cash', staffMember: 'Nomsa', location: 'Main Branch' },
]

// Generate mock communication log
const generateCommunicationLog = (): CommunicationRecord[] => [
  { id: 'COM-001', customerId: 'CUS-001', type: 'whatsapp', direction: 'outbound', subject: 'Appointment Reminder', message: 'Hi Thandi! Your appointment is tomorrow at 2pm. See you soon!', date: '2026-02-14 10:30', staffMember: 'System', status: 'read' },
  { id: 'COM-002', customerId: 'CUS-001', type: 'whatsapp', direction: 'inbound', message: 'Thanks! I will be there.', date: '2026-02-14 10:35', status: 'received' },
  { id: 'COM-003', customerId: 'CUS-001', type: 'email', direction: 'outbound', subject: 'Your February Statement', message: 'Dear Thandi, please find your February statement attached. Total: R500', date: '2026-02-01 09:00', staffMember: 'System', status: 'delivered' },
  { id: 'COM-004', customerId: 'CUS-004', type: 'sms', direction: 'outbound', subject: 'We Miss You!', message: 'Hi Johan! We miss you. Come back for 25% off your next visit. Valid until end of month.', date: '2026-02-10 14:00', staffMember: 'Marketing', status: 'delivered' },
  { id: 'COM-005', customerId: 'CUS-006', type: 'call', direction: 'outbound', subject: 'VIP Follow-up', message: 'Called to discuss upcoming VIP event. Customer interested in attending.', date: '2026-02-12 11:00', staffMember: 'Nomsa', status: 'delivered' },
  { id: 'COM-006', customerId: 'CUS-005', type: 'whatsapp', direction: 'outbound', subject: 'Welcome!', message: 'Welcome to our loyalty program, Precious! You earned 180 points from your first visit.', date: '2026-02-14 16:00', staffMember: 'System', status: 'read' },
]

// Generate mock referrals
const generateReferrals = (): ReferralRecord[] => [
  { id: 'REF-001', referrerId: 'CUS-001', referrerName: 'Thandi Mbeki', referredName: 'Precious Ndlovu', status: 'completed', rewardType: 'points', rewardValue: 500, createdAt: '2026-02-01', completedAt: '2026-02-14' },
  { id: 'REF-002', referrerId: 'CUS-006', referrerName: 'David Mokoena', referredName: 'Sipho Dlamini', status: 'rewarded', rewardType: 'discount', rewardValue: 100, createdAt: '2025-09-10', completedAt: '2025-09-20' },
  { id: 'REF-003', referrerId: 'CUS-002', referrerName: 'Sipho Dlamini', status: 'pending', rewardType: 'points', rewardValue: 500, createdAt: '2026-02-15' },
]

// Loyalty tiers configuration
const defaultLoyaltyTiers: LoyaltyTier[] = [
  { id: 'bronze', name: 'Bronze', minPoints: 0, maxPoints: 499, discount: 2, color: 'bg-orange-100 text-orange-700', icon: Award, benefits: ['2% discount on all purchases', 'Birthday reward', 'Member-only offers'], pointsMultiplier: 1, isActive: true },
  { id: 'silver', name: 'Silver', minPoints: 500, maxPoints: 1999, discount: 5, color: 'bg-gray-100 text-gray-700', icon: Star, benefits: ['5% discount on all purchases', 'Priority queue', 'Early access to sales', 'Birthday reward'], pointsMultiplier: 1.25, isActive: true },
  { id: 'gold', name: 'Gold', minPoints: 2000, maxPoints: 4999, discount: 10, color: 'bg-yellow-100 text-yellow-700', icon: Crown, benefits: ['10% discount on all purchases', 'Free delivery', 'VIP events', 'Dedicated support', 'Birthday reward + bonus points'], pointsMultiplier: 1.5, isActive: true },
  { id: 'platinum', name: 'Platinum', minPoints: 5000, maxPoints: 999999, discount: 15, color: 'bg-purple-100 text-purple-700', icon: Sparkles, benefits: ['15% discount on all purchases', 'Free premium delivery', 'Exclusive products', 'Personal account manager', 'Monthly bonus points', 'Anniversary rewards'], pointsMultiplier: 2, isActive: true },
]

// Generate mock customers with enhanced data
const generateCustomers = (): Customer[] => [
  { id: 'CUS-001', name: 'Thandi Mbeki', phone: '+27 82 123 4567', email: 'thandi.m@email.com', segment: 'champion', rfmScore: { r: 5, f: 5, m: 5 }, totalSpent: 15680, totalOrders: 47, avgOrderValue: 334, lastVisit: '2026-02-15', joinedDate: '2024-06-15', loyaltyPoints: 3140, loyaltyTier: 'gold', tags: ['Regular', 'Weekend', 'High Value'], preferences: ['Vegetarian options', 'No onions'], birthday: '1985-03-22', lifetimeValue: 45000, churnProbability: 0.05, nextBestOffer: 'VIP Spa Package - 20% off' },
  { id: 'CUS-002', name: 'Sipho Dlamini', phone: '+27 83 234 5678', email: 'sipho.d@email.com', segment: 'loyal', rfmScore: { r: 4, f: 4, m: 4 }, totalSpent: 8920, totalOrders: 28, avgOrderValue: 319, lastVisit: '2026-02-14', joinedDate: '2024-09-20', loyaltyPoints: 1780, loyaltyTier: 'silver', tags: ['Lunch regular'], preferences: ['Extra sauce'], birthday: '1990-07-15', lifetimeValue: 25000, churnProbability: 0.15, nextBestOffer: 'Loyalty Reward - Double Points Weekend' },
  { id: 'CUS-003', name: 'Nomsa Zulu', phone: '+27 84 345 6789', email: 'nomsa.z@email.com', segment: 'potential', rfmScore: { r: 3, f: 3, m: 4 }, totalSpent: 4200, totalOrders: 12, avgOrderValue: 350, lastVisit: '2026-02-10', joinedDate: '2025-01-05', loyaltyPoints: 840, loyaltyTier: 'silver', tags: ['High value', 'Growing'], preferences: [], birthday: '1995-11-08', lifetimeValue: 15000, churnProbability: 0.25, nextBestOffer: 'Upgrade to Gold - Bonus 500 Points' },
  { id: 'CUS-004', name: 'Johan van der Berg', phone: '+27 82 456 7890', email: 'johan.vdb@email.com', segment: 'at_risk', rfmScore: { r: 2, f: 3, m: 3 }, totalSpent: 5600, totalOrders: 15, avgOrderValue: 373, lastVisit: '2026-01-20', joinedDate: '2024-11-10', loyaltyPoints: 1120, loyaltyTier: 'silver', tags: ['At risk', 'Previous VIP'], preferences: ['Gluten-free'], birthday: '1982-05-30', lifetimeValue: 18000, churnProbability: 0.65, nextBestOffer: 'We Miss You - 25% Off Your Next Visit' },
  { id: 'CUS-005', name: 'Precious Ndlovu', phone: '+27 76 567 8901', email: 'precious.n@email.com', segment: 'new', rfmScore: { r: 5, f: 1, m: 2 }, totalSpent: 890, totalOrders: 3, avgOrderValue: 297, lastVisit: '2026-02-14', joinedDate: '2026-02-01', loyaltyPoints: 180, loyaltyTier: 'bronze', tags: ['New customer', 'Referred'], preferences: [], birthday: '1998-09-12', lifetimeValue: 8000, churnProbability: 0.35, nextBestOffer: 'New Member Welcome - Free Service' },
  { id: 'CUS-006', name: 'David Mokoena', phone: '+27 72 678 9012', email: 'david.m@email.com', segment: 'champion', rfmScore: { r: 5, f: 5, m: 5 }, totalSpent: 22450, totalOrders: 68, avgOrderValue: 330, lastVisit: '2026-02-15', joinedDate: '2024-03-01', loyaltyPoints: 4490, loyaltyTier: 'platinum', tags: ['VIP', 'Weekday lunch', 'Office orders', 'Influencer'], preferences: ['Large portions', 'Extra napkins'], birthday: '1978-12-25', lifetimeValue: 75000, churnProbability: 0.02, nextBestOffer: 'Platinum Exclusive - Early Access to New Menu' },
  { id: 'CUS-007', name: 'Lerato Molefe', phone: '+27 81 789 0123', email: 'lerato.m@email.com', segment: 'loyal', rfmScore: { r: 4, f: 4, m: 3 }, totalSpent: 6780, totalOrders: 22, avgOrderValue: 308, lastVisit: '2026-02-13', joinedDate: '2024-08-15', loyaltyPoints: 1360, loyaltyTier: 'silver', tags: ['Regular', 'Family orders'], preferences: [], birthday: '1992-04-18', lifetimeValue: 22000, churnProbability: 0.18, nextBestOffer: 'Family Bundle - Save R150' },
  { id: 'CUS-008', name: 'Michael Smith', phone: '+27 83 890 1234', email: 'michael.s@email.com', segment: 'dormant', rfmScore: { r: 1, f: 2, m: 3 }, totalSpent: 3200, totalOrders: 8, avgOrderValue: 400, lastVisit: '2025-10-15', joinedDate: '2025-02-20', loyaltyPoints: 640, loyaltyTier: 'bronze', tags: ['Dormant', 'Win-back needed'], preferences: [], birthday: '1988-08-05', lifetimeValue: 5000, churnProbability: 0.92, nextBestOffer: 'Come Back & Get 30% Off' },
]

// Generate GroAI insights
const generateInsights = (): GroAIInsight[] => [
  { id: 'INS-001', type: 'churn_alert', title: 'High Churn Risk Detected', description: '8 customers have not visited in 45+ days with high historical spend. Immediate win-back recommended.', action: 'Launch win-back campaign', impact: 'high', affectedCustomers: 8, potentialRevenue: 12500 },
  { id: 'INS-002', type: 'opportunity', title: 'Upgrade Opportunity', description: '12 Silver tier customers are within 200 points of Gold. Targeted push could upgrade them.', action: 'Send upgrade incentive', impact: 'medium', affectedCustomers: 12, potentialRevenue: 8400 },
  { id: 'INS-003', type: 'trend', title: 'Birthday Month Opportunity', description: '23 customers have birthdays in the next 30 days. Birthday campaigns have 3.5x higher engagement.', action: 'Schedule birthday offers', impact: 'medium', affectedCustomers: 23, potentialRevenue: 6200 },
  { id: 'INS-004', type: 'recommendation', title: 'VIP Services Upsell', description: 'Your top 5 customers qualify for premium services. Potential revenue increase of R3,200/month.', action: 'Enable VIP services', impact: 'low', affectedCustomers: 5, potentialRevenue: 3200 },
]

// Segment colors
const segmentColors: Record<Customer['segment'], string> = {
  champion: 'bg-purple-100 text-purple-700',
  loyal: 'bg-green-100 text-green-700',
  potential: 'bg-blue-100 text-blue-700',
  at_risk: 'bg-orange-100 text-orange-700',
  new: 'bg-cyan-100 text-cyan-700',
  dormant: 'bg-gray-100 text-gray-500',
}

// Component
export function CRMView() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loyaltyTiers, setLoyaltyTiers] = useState<LoyaltyTier[]>(defaultLoyaltyTiers)
  const [insights] = useState<GroAIInsight[]>(generateInsights)
  const [purchaseHistory] = useState<PurchaseRecord[]>(generatePurchaseHistory)
  const [communicationLog] = useState<CommunicationRecord[]>(generateCommunicationLog)
  const [referrals, setReferrals] = useState<ReferralRecord[]>(generateReferrals)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  
  const [activeTab, setActiveTab] = useState<string>('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [segmentFilter, setSegmentFilter] = useState<string>('all')
  const [tierFilter, setTierFilter] = useState<string>('all')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [addCustomerOpen, setAddCustomerOpen] = useState(false)
  const [messageOpen, setMessageOpen] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', birthday: '' })

  // Get merchant ID from session
  const getMerchantId = useCallback(() => {
    if (typeof window !== 'undefined') {
      const sessionStr = localStorage.getItem('groway_session')
      const session = sessionStr ? JSON.parse(sessionStr) : null
      return session?.merchantId || 'merchant-001'
    }
    return 'merchant-001'
  }, [])

  // Fetch customers from API
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const merchantId = getMerchantId()
      const response = await fetch(`/merchant-os/api/customers?merchantId=${merchantId}`)
      const result = await response.json()
      
      if (result.success) {
        // Map API data to component format with computed fields
        const mappedCustomers: Customer[] = result.data.map((c: any) => ({
          id: c.id,
          name: c.name,
          phone: c.phone || '',
          email: c.email,
          segment: c.segment || 'new',
          rfmScore: { r: 3, f: 3, m: 3 }, // Default RFM
          totalSpent: c.totalSpent || 0,
          totalOrders: c.visitCount || 0,
          avgOrderValue: c.visitCount > 0 ? c.totalSpent / c.visitCount : 0,
          lastVisit: c.lastVisit || new Date().toISOString().split('T')[0],
          joinedDate: c.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
          loyaltyPoints: c.loyaltyPoints || 0,
          loyaltyTier: c.loyaltyTier || 'bronze',
          tags: c.tags || [],
          notes: c.notes,
          preferences: [],
          birthday: '',
          lifetimeValue: c.totalSpent * 3,
          churnProbability: 0.2,
          nextBestOffer: 'Welcome offer - 10% off next visit'
        }))
        setCustomers(mappedCustomers)
      } else {
        setError(result.error || 'Failed to fetch customers')
      }
    } catch (err) {
      console.error('Error fetching customers:', err)
      setError('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }, [getMerchantId])

  // Load customers on mount
  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])
  
  // Loyalty management states
  const [loyaltyEditOpen, setLoyaltyEditOpen] = useState(false)
  const [editingTier, setEditingTier] = useState<LoyaltyTier | null>(null)
  const [loyaltyRewardsOpen, setLoyaltyRewardsOpen] = useState(false)
  const [rewards, setRewards] = useState<LoyaltyReward[]>([
    { id: 'RWD-001', name: 'R50 Discount Voucher', pointsCost: 500, description: 'Get R50 off your next purchase', category: 'discount', isActive: true },
    { id: 'RWD-002', name: 'Free Hair Treatment', pointsCost: 2000, description: 'Complimentary deep conditioning treatment', category: 'free_item', isActive: true },
    { id: 'RWD-003', name: 'VIP Spa Day Pass', pointsCost: 5000, description: 'Full day access to VIP spa facilities', category: 'experience', isActive: true },
    { id: 'RWD-004', name: 'Product Sample Pack', pointsCost: 100, description: 'Curated sample pack of premium products', category: 'free_item', isActive: true },
  ])
  const [editingReward, setEditingReward] = useState<LoyaltyReward | null>(null)
  const [customerDetailTab, setCustomerDetailTab] = useState<string>('overview')
  const [referralDialogOpen, setReferralDialogOpen] = useState(false)
  const [newReferral, setNewReferral] = useState({ referrerId: '', referredName: '', rewardType: 'points' as 'points' | 'discount' | 'cash', rewardValue: 500 })

  // Computed stats
  const totalCustomers = customers.length
  const activeCustomers = customers.filter(c => c.segment !== 'dormant').length
  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0)
  const avgLifetimeValue = totalRevenue / totalCustomers
  const atRiskCustomers = customers.filter(c => c.churnProbability > 0.5)
  const highValueCustomers = customers.filter(c => c.lifetimeValue > 20000)

  const segmentCounts = {
    champion: customers.filter(c => c.segment === 'champion').length,
    loyal: customers.filter(c => c.segment === 'loyal').length,
    potential: customers.filter(c => c.segment === 'potential').length,
    at_risk: customers.filter(c => c.segment === 'at_risk').length,
    new: customers.filter(c => c.segment === 'new').length,
    dormant: customers.filter(c => c.segment === 'dormant').length,
  }

  const tierCounts = {
    platinum: customers.filter(c => c.loyaltyTier === 'platinum').length,
    gold: customers.filter(c => c.loyaltyTier === 'gold').length,
    silver: customers.filter(c => c.loyaltyTier === 'silver').length,
    bronze: customers.filter(c => c.loyaltyTier === 'bronze').length,
  }

  // Filtered customers
  const filteredCustomers = useMemo(() => customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSegment = segmentFilter === 'all' || c.segment === segmentFilter
    const matchesTier = tierFilter === 'all' || c.loyaltyTier === tierFilter
    return matchesSearch && matchesSegment && matchesTier
  }), [customers, searchQuery, segmentFilter, tierFilter])

  // Get tier info
  const getTierInfo = (tier: Customer['loyaltyTier']) => loyaltyTiers.find(t => t.id === tier)!

  // Format currency
  const formatCurrency = (amount: number) => `R${amount.toLocaleString()}`

  // Get initials
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase()

  // Handle loyalty tier save
  const handleSaveTier = (tier: LoyaltyTier) => {
    setLoyaltyTiers(prev => prev.map(t => t.id === tier.id ? tier : t))
    setLoyaltyEditOpen(false)
    setEditingTier(null)
  }

  // Handle tier delete
  const handleDeleteTier = (tierId: string) => {
    setLoyaltyTiers(prev => prev.filter(t => t.id !== tierId))
    setLoyaltyEditOpen(false)
    setEditingTier(null)
  }

  // Handle reward save
  const handleSaveReward = (reward: LoyaltyReward) => {
    if (reward.id) {
      setRewards(prev => prev.map(r => r.id === reward.id ? reward : r))
    } else {
      setRewards(prev => [...prev, { ...reward, id: `RWD-${Date.now()}` }])
    }
    setLoyaltyRewardsOpen(false)
    setEditingReward(null)
  }

  // Handle reward delete
  const handleDeleteReward = (rewardId: string) => {
    setRewards(prev => prev.filter(r => r.id !== rewardId))
    setLoyaltyRewardsOpen(false)
    setEditingReward(null)
  }

  // Handle add new customer
  const handleAddCustomer = async () => {
    if (!newCustomer.name.trim()) {
      setError('Customer name is required')
      return
    }

    try {
      setSaving(true)
      const merchantId = getMerchantId()
      
      const response = await fetch('/merchant-os/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId,
          name: newCustomer.name.trim(),
          phone: newCustomer.phone.trim() || null,
          email: newCustomer.email.trim() || null,
          segment: 'new'
        })
      })

      const result = await response.json()

      if (result.success) {
        // Add the new customer to the list
        const newCustomerData: Customer = {
          id: result.data.id,
          name: result.data.name,
          phone: result.data.phone || '',
          email: result.data.email,
          segment: 'new',
          rfmScore: { r: 5, f: 1, m: 2 },
          totalSpent: 0,
          totalOrders: 0,
          avgOrderValue: 0,
          lastVisit: new Date().toISOString().split('T')[0],
          joinedDate: new Date().toISOString().split('T')[0],
          loyaltyPoints: 0,
          loyaltyTier: 'bronze',
          tags: [],
          notes: '',
          preferences: [],
          birthday: newCustomer.birthday || '',
          lifetimeValue: 0,
          churnProbability: 0.35,
          nextBestOffer: 'New Member Welcome - 10% Off'
        }
        setCustomers(prev => [newCustomerData, ...prev])
        setAddCustomerOpen(false)
        setNewCustomer({ name: '', phone: '', email: '', birthday: '' })
        setError(null)
      } else {
        setError(result.error || 'Failed to add customer')
      }
    } catch (err) {
      console.error('Error adding customer:', err)
      setError('Failed to add customer')
    } finally {
      setSaving(false)
    }
  }

  // Handle delete customer
  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return

    try {
      const response = await fetch(`/merchant-os/api/customers/${customerId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        setCustomers(prev => prev.filter(c => c.id !== customerId))
        setSelectedCustomer(null)
      } else {
        setError(result.error || 'Failed to delete customer')
      }
    } catch (err) {
      console.error('Error deleting customer:', err)
      setError('Failed to delete customer')
    }
  }

  // Render GroAI Insights Panel
  const renderGroAIInsights = () => (
    <Card className="border-l-4 border-l-[#00897B]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Bot className="h-4 w-4 text-[#00897B]" />
          GroAI Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {insights.map(insight => {
            const impactColors = {
              high: 'bg-red-100 text-red-700 border-red-200',
              medium: 'bg-amber-100 text-amber-700 border-amber-200',
              low: 'bg-green-100 text-green-700 border-green-200',
            }
            const typeIcons = {
              churn_alert: AlertCircle,
              opportunity: Lightbulb,
              trend: TrendIcon,
              recommendation: Target,
            }
            const TypeIcon = typeIcons[insight.type]
            return (
              <div key={insight.id} className={`p-3 rounded-lg border ${impactColors[insight.impact]} bg-white`}>
                <div className="flex items-start gap-3">
                  <TypeIcon className="h-5 w-5 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{insight.title}</h4>
                      <Badge variant="outline" className="text-[10px]">{insight.impact}</Badge>
                    </div>
                    <p className="text-xs text-[#757575] mt-1">{insight.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1">
                          <UsersIcon className="h-3 w-3" />{insight.affectedCustomers} customers
                        </span>
                        <span className="flex items-center gap-1">
                          <CoinsIcon className="h-3 w-3" />{formatCurrency(insight.potentialRevenue)}
                        </span>
                      </div>
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        {insight.action}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )

  // Render Overview
  const renderOverview = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-[#00897B]" />
          <span className="ml-2 text-[#757575]">Loading customers...</span>
        </div>
      )
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button variant="outline" onClick={fetchCustomers}>
            <RefreshCw className="h-4 w-4 mr-2" />Retry
          </Button>
        </div>
      )
    }

    return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-[#00897B]">
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Total Customers</p>
            <p className="text-2xl font-bold">{totalCustomers}</p>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />+12 this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Active Rate</p>
            <p className="text-2xl font-bold">{totalCustomers > 0 ? Math.round(activeCustomers / totalCustomers * 100) : 0}%</p>
            <Progress value={totalCustomers > 0 ? activeCustomers / totalCustomers * 100 : 0} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Total Revenue</p>
            <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
            <p className="text-xs text-[#757575]">Lifetime</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Avg Lifetime Value</p>
            <p className="text-2xl font-bold">{formatCurrency(Math.round(avgLifetimeValue))}</p>
            <p className="text-xs text-[#757575]">Per customer</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">At Risk</p>
            <p className="text-2xl font-bold text-orange-600">{atRiskCustomers.length}</p>
            <p className="text-xs text-orange-600">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* GroAI Insights */}
      {renderGroAIInsights()}

      {/* RFM Segment Distribution & Loyalty Tiers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <PieChart className="h-4 w-4 text-[#00897B]" />
              Customer Segments (RFM)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'Champions', count: segmentCounts.champion, color: 'bg-purple-500', desc: 'Best customers - top 20%' },
                { name: 'Loyal', count: segmentCounts.loyal, color: 'bg-green-500', desc: 'Regular buyers' },
                { name: 'Potential', count: segmentCounts.potential, color: 'bg-blue-500', desc: 'Growing engagement' },
                { name: 'At Risk', count: segmentCounts.at_risk, color: 'bg-orange-500', desc: 'Need attention' },
                { name: 'New', count: segmentCounts.new, color: 'bg-cyan-500', desc: 'Recently acquired' },
                { name: 'Dormant', count: segmentCounts.dormant, color: 'bg-gray-400', desc: 'Inactive 90+ days' },
              ].map(segment => (
                <div key={segment.name} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${segment.color}`} />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">{segment.name}</span>
                      <span className="text-sm font-bold">{segment.count}</span>
                    </div>
                    <Progress value={(segment.count / totalCustomers) * 100} className="h-1.5 mt-1" />
                    <p className="text-[10px] text-[#757575] mt-0.5">{segment.desc}</p>
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
                <Crown className="h-4 w-4 text-yellow-500" />
                Loyalty Tiers
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => { setEditingTier(null); setLoyaltyEditOpen(true) }}>
                <Settings className="h-3 w-3 mr-1" />
                Configure
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loyaltyTiers.map(tier => {
                const count = tierCounts[tier.id as keyof typeof tierCounts]
                const Icon = tier.icon
                return (
                  <div key={tier.id} className={`flex items-center gap-3 p-3 rounded-lg ${tier.color}`}>
                    <Icon className="h-5 w-5" />
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{tier.name}</span>
                        <Badge variant="secondary">{count} customers</Badge>
                      </div>
                      <p className="text-xs opacity-80">{tier.discount}% discount • {tier.minPoints.toLocaleString()}+ points • {tier.pointsMultiplier}x multiplier</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers & At Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              Top Customers (by LTV)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {highValueCustomers.slice(0, 5).map((customer, i) => (
              <div 
                key={customer.id} 
                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                onClick={() => setSelectedCustomer(customer)}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                  {i + 1}
                </div>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-[#E0F2F1] text-[#00897B] text-xs">
                    {getInitials(customer.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">{customer.name}</p>
                  <p className="text-xs text-[#757575]">{customer.totalOrders} orders</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#00897B]">{formatCurrency(customer.lifetimeValue)}</p>
                  <Badge className={getTierInfo(customer.loyaltyTier).color}>
                    {customer.loyaltyTier}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                At Risk Customers
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => setMessageOpen(true)}>
                <Send className="h-3 w-3 mr-1" />
                Win-back Campaign
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {atRiskCustomers.length === 0 ? (
              <p className="text-sm text-[#757575] text-center py-4">No at-risk customers</p>
            ) : (
              atRiskCustomers.map(customer => (
                <div 
                  key={customer.id} 
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  onClick={() => setSelectedCustomer(customer)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-orange-100 text-orange-700 text-xs">
                      {getInitials(customer.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{customer.name}</p>
                    <p className="text-xs text-[#757575]">Last visit: {customer.lastVisit}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatCurrency(customer.totalSpent)}</p>
                    <p className="text-xs text-orange-600">{Math.round(customer.churnProbability * 100)}% churn risk</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelectedCustomer(customer); setMessageOpen(true); }}>
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    )
  }

  // Render Customer List
  const renderCustomers = () => (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
          <Input placeholder="Search customers..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={segmentFilter} onValueChange={setSegmentFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Segment" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Segments</SelectItem>
            <SelectItem value="champion">Champions</SelectItem>
            <SelectItem value="loyal">Loyal</SelectItem>
            <SelectItem value="potential">Potential</SelectItem>
            <SelectItem value="at_risk">At Risk</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="dormant">Dormant</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Tier" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="platinum">Platinum</SelectItem>
            <SelectItem value="gold">Gold</SelectItem>
            <SelectItem value="silver">Silver</SelectItem>
            <SelectItem value="bronze">Bronze</SelectItem>
          </SelectContent>
        </Select>
        <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setAddCustomerOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />Add Customer
        </Button>
      </div>

      {/* Customer List */}
      <ScrollArea className="flex-1">
        <div className="space-y-2">
          {filteredCustomers.map(customer => {
            const tierInfo = getTierInfo(customer.loyaltyTier)
            const TierIcon = tierInfo.icon
            return (
              <Card key={customer.id} className="cursor-pointer hover:shadow-md transition-all" onClick={() => setSelectedCustomer(customer)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-[#E0F2F1] text-[#00897B]">
                        {getInitials(customer.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate">{customer.name}</h4>
                        <Badge className={segmentColors[customer.segment]}>
                          {customer.segment.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-[#757575] mt-1">
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{customer.phone}</span>
                        <span className="flex items-center gap-1"><ShoppingBag className="h-3 w-3" />{customer.totalOrders} orders</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Last: {customer.lastVisit}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold text-[#00897B]">{formatCurrency(customer.totalSpent)}</p>
                        <div className={`flex items-center gap-1 text-xs ${tierInfo.color} px-2 py-0.5 rounded-full`}>
                          <TierIcon className="h-3 w-3" />
                          {customer.loyaltyTier}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelectedCustomer(customer); setMessageOpen(true); }}>
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </div>
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

  // Render Loyalty Management
  const renderLoyalty = () => (
    <div className="space-y-6">
      {/* Program Overview */}
      <Card className="bg-gradient-to-r from-[#00897B] to-[#4CAF50] text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                <Gift className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Groway Rewards</h2>
                <p className="opacity-80">Earn 1 point per R5 spent • Redeem for discounts & rewards</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30" onClick={() => setLoyaltyRewardsOpen(true)}>
                <Gift className="h-4 w-4 mr-2" />Manage Rewards
              </Button>
              <Button variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30" onClick={() => { setEditingTier(null); setLoyaltyEditOpen(true) }}>
                <Settings className="h-4 w-4 mr-2" />Configure Tiers
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tier Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Tier Configuration</CardTitle>
              <Button size="sm" variant="outline" onClick={() => { setEditingTier(null); setLoyaltyEditOpen(true) }}>
                <Plus className="h-3 w-3 mr-1" />Add Tier
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loyaltyTiers.map(tier => {
                const count = tierCounts[tier.id as keyof typeof tierCounts]
                const Icon = tier.icon
                return (
                  <div key={tier.id} className={`p-4 rounded-lg border-2 ${tier.color} border-transparent hover:border-[#00897B]/30 transition-all`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        <span className="font-bold">{tier.name}</span>
                        {!tier.isActive && <Badge variant="secondary">Inactive</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{count} customers</Badge>
                        <Button size="sm" variant="ghost" onClick={() => { setEditingTier(tier); setLoyaltyEditOpen(true) }}>
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="opacity-70">Points:</span> {tier.minPoints.toLocaleString()} - {tier.maxPoints === 999999 ? '∞' : tier.maxPoints.toLocaleString()}</div>
                      <div><span className="opacity-70">Discount:</span> {tier.discount}%</div>
                      <div><span className="opacity-70">Multiplier:</span> {tier.pointsMultiplier}x</div>
                      <div><span className="opacity-70">Status:</span> {tier.isActive ? 'Active' : 'Inactive'}</div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {tier.benefits.slice(0, 3).map((benefit, i) => (
                        <Badge key={i} variant="outline" className="text-[10px]">{benefit}</Badge>
                      ))}
                      {tier.benefits.length > 3 && (
                        <Badge variant="outline" className="text-[10px]">+{tier.benefits.length - 3} more</Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Points Activity (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">+12,450</p>
                <p className="text-xs text-green-600">Points Earned</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">-4,200</p>
                <p className="text-xs text-blue-600">Points Redeemed</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">R2,100</p>
                <p className="text-xs text-purple-600">Discounts Given</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">89%</p>
                <p className="text-xs text-orange-600">Redemption Rate</p>
              </div>
            </div>
            
            {/* Recent Redemptions */}
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Recent Redemptions</h4>
              <div className="space-y-2">
                {[
                  { customer: 'David Mokoena', points: 500, discount: 'R25', time: '2 hours ago' },
                  { customer: 'Thandi Mbeki', points: 1000, discount: 'R50', time: '5 hours ago' },
                  { customer: 'Sipho Dlamini', points: 250, discount: 'R12.50', time: 'Yesterday' },
                ].map((r, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                    <Gift className="h-4 w-4 text-[#00897B]" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{r.customer}</p>
                      <p className="text-xs text-[#757575]">{r.time}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600">-{r.points} pts</p>
                      <p className="text-xs text-green-600">→ {r.discount} off</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // Render Campaigns
  const renderCampaigns = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-bold">Marketing Campaigns</h2>
        <Button className="bg-[#00897B] hover:bg-[#00695C]">
          <Plus className="h-4 w-4 mr-2" />New Campaign
        </Button>
      </div>

      {/* Campaign Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-green-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">4</p>
            <p className="text-xs text-green-600">Active Campaigns</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">2,847</p>
            <p className="text-xs text-blue-600">Messages Sent</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">18.5%</p>
            <p className="text-xs text-purple-600">Open Rate</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">R4,280</p>
            <p className="text-xs text-orange-600">Revenue Generated</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign List */}
      <div className="space-y-3">
        {[
          { name: 'Win-back Campaign', type: 'whatsapp', target: 'At Risk Customers', sent: 45, opened: 12, revenue: 890, status: 'active' },
          { name: 'Weekend Special', type: 'sms', target: 'All Loyalty Members', sent: 156, opened: 28, revenue: 2150, status: 'active' },
          { name: 'New Customer Welcome', type: 'whatsapp', target: 'New Customers', sent: 12, opened: 8, revenue: 340, status: 'active' },
          { name: 'Valentine\'s Promo', type: 'email', target: 'All Customers', sent: 280, opened: 52, revenue: 3200, status: 'completed' },
        ].map((campaign, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${campaign.type === 'whatsapp' ? 'bg-green-100' : campaign.type === 'sms' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                  {campaign.type === 'whatsapp' ? <MessageCircle className="h-5 w-5 text-green-600" /> : campaign.type === 'sms' ? <MessageSquare className="h-5 w-5 text-blue-600" /> : <Mail className="h-5 w-5 text-purple-600" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{campaign.name}</h4>
                    <Badge className={campaign.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                      {campaign.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#757575]">{campaign.target}</p>
                </div>
                <div className="flex gap-6 text-sm">
                  <div className="text-center">
                    <p className="font-bold">{campaign.sent}</p>
                    <p className="text-xs text-[#757575]">Sent</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold">{campaign.opened}</p>
                    <p className="text-xs text-[#757575]">Opened</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-[#00897B]">R{campaign.revenue}</p>
                    <p className="text-xs text-[#757575]">Revenue</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">View</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  // Render Referrals
  const renderReferrals = () => {
    const pendingReferrals = referrals.filter(r => r.status === 'pending')
    const completedReferrals = referrals.filter(r => r.status === 'completed' || r.status === 'rewarded')
    const totalRewardsGiven = referrals.filter(r => r.status === 'rewarded').reduce((sum, r) => sum + r.rewardValue, 0)

    const handleCreateReferral = () => {
      if (!newReferral.referrerId || !newReferral.referredName) return
      
      const referrer = customers.find(c => c.id === newReferral.referrerId)
      const referral: ReferralRecord = {
        id: `REF-${Date.now()}`,
        referrerId: newReferral.referrerId,
        referrerName: referrer?.name || 'Unknown',
        referredName: newReferral.referredName,
        status: 'pending',
        rewardType: newReferral.rewardType,
        rewardValue: newReferral.rewardValue,
        createdAt: new Date().toISOString().split('T')[0]
      }
      
      setReferrals(prev => [referral, ...prev])
      setReferralDialogOpen(false)
      setNewReferral({ referrerId: '', referredName: '', rewardType: 'points', rewardValue: 500 })
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-bold">Referral Program</h2>
            <p className="text-sm text-[#757575]">Track customer referrals and rewards</p>
          </div>
          <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setReferralDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />New Referral
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-purple-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{referrals.length}</p>
              <p className="text-xs text-purple-600">Total Referrals</p>
            </CardContent>
          </Card>
          <Card className="bg-amber-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{pendingReferrals.length}</p>
              <p className="text-xs text-amber-600">Pending</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{completedReferrals.length}</p>
              <p className="text-xs text-green-600">Completed</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalRewardsGiven)}</p>
              <p className="text-xs text-blue-600">Rewards Given</p>
            </CardContent>
          </Card>
        </div>

        {/* Program Settings */}
        <Card className="border-l-4 border-l-[#00897B]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Referral Program Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-[#757575]">Referrer Reward</p>
                <p className="font-bold">500 points</p>
                <p className="text-xs text-green-600">When referral completes 1st purchase</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-[#757575]">Referred Discount</p>
                <p className="font-bold">10% off first visit</p>
                <p className="text-xs text-green-600">Automatic on first purchase</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-[#757575]">Validity Period</p>
                <p className="font-bold">90 days</p>
                <p className="text-xs text-[#757575]">From referral creation</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Referrals */}
        {pendingReferrals.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                Pending Referrals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pendingReferrals.map(ref => (
                  <div key={ref.id} className="flex items-center gap-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{ref.referrerName}</span>
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                        <span className="text-[#757575]">{ref.referredName}</span>
                      </div>
                      <p className="text-xs text-[#757575]">Created: {ref.createdAt}</p>
                    </div>
                    <Badge className="bg-amber-100 text-amber-700">Awaiting First Purchase</Badge>
                    <Button size="sm" variant="outline">Send Reminder</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completed Referrals */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">All Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {referrals.map(ref => (
                <div key={ref.id} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-[#E0F2F1] text-[#00897B] text-xs">
                          {getInitials(ref.referrerName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{ref.referrerName}</span>
                          <ArrowRight className="h-3 w-3 text-gray-400" />
                          <span className="text-[#757575]">{ref.referredName || 'Pending'}</span>
                        </div>
                        <p className="text-xs text-[#757575]">{ref.createdAt}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={
                      ref.status === 'rewarded' ? 'bg-green-100 text-green-700' :
                      ref.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }>
                      {ref.status}
                    </Badge>
                    <p className="text-xs text-[#757575] mt-1">
                      {ref.rewardType === 'points' ? `${ref.rewardValue} pts` : formatCurrency(ref.rewardValue)} reward
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Tabs */}
      <div className="bg-white border-b px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-transparent h-12">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <PieChart className="h-4 w-4 mr-2" />Overview
            </TabsTrigger>
            <TabsTrigger value="customers" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <Users className="h-4 w-4 mr-2" />Customers
            </TabsTrigger>
            <TabsTrigger value="loyalty" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <Gift className="h-4 w-4 mr-2" />Loyalty
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <Megaphone className="h-4 w-4 mr-2" />Campaigns
            </TabsTrigger>
            <TabsTrigger value="referrals" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
              <User className="h-4 w-4 mr-2" />Referrals
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'customers' && renderCustomers()}
        {activeTab === 'loyalty' && renderLoyalty()}
        {activeTab === 'campaigns' && renderCampaigns()}
        {activeTab === 'referrals' && renderReferrals()}
      </ScrollArea>

      {/* Customer Detail Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={() => { setSelectedCustomer(null); setCustomerDetailTab('overview'); }}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedCustomer && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Customer Profile
                  <Badge className={segmentColors[selectedCustomer.segment]}>
                    {selectedCustomer.segment.replace('_', ' ')}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              
              {/* Customer Header */}
              <div className="flex items-start gap-4 pb-4 border-b">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-[#E0F2F1] text-[#00897B] text-xl">
                    {getInitials(selectedCustomer.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{selectedCustomer.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getTierInfo(selectedCustomer.loyaltyTier).color}>
                      {getTierInfo(selectedCustomer.loyaltyTier).name} Tier
                    </Badge>
                    <Badge variant="outline" className="text-purple-600 border-purple-200">
                      LTV: {formatCurrency(selectedCustomer.lifetimeValue)}
                    </Badge>
                  </div>
                  <div className="flex gap-4 mt-2 text-sm text-[#757575]">
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{selectedCustomer.phone}</span>
                    {selectedCustomer.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{selectedCustomer.email}</span>}
                    {selectedCustomer.birthday && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{selectedCustomer.birthday}</span>}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <Tabs value={customerDetailTab} onValueChange={setCustomerDetailTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="purchases">Purchases</TabsTrigger>
                  <TabsTrigger value="communications">Messages</TabsTrigger>
                  <TabsTrigger value="ltv">LTV</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                {customerDetailTab === 'overview' && (
                  <div className="space-y-4 mt-4">
                    {/* RFM Score */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-[#00897B]">{selectedCustomer.rfmScore.r}</p>
                        <p className="text-xs text-[#757575]">Recency (1-5)</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-[#00897B]">{selectedCustomer.rfmScore.f}</p>
                        <p className="text-xs text-[#757575]">Frequency (1-5)</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-[#00897B]">{selectedCustomer.rfmScore.m}</p>
                        <p className="text-xs text-[#757575]">Monetary (1-5)</p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-3">
                      <div className="text-center p-3 border rounded-lg">
                        <p className="text-lg font-bold text-[#00897B]">{formatCurrency(selectedCustomer.totalSpent)}</p>
                        <p className="text-xs text-[#757575]">Total Spent</p>
                      </div>
                      <div className="text-center p-3 border rounded-lg">
                        <p className="text-lg font-bold">{selectedCustomer.totalOrders}</p>
                        <p className="text-xs text-[#757575]">Orders</p>
                      </div>
                      <div className="text-center p-3 border rounded-lg">
                        <p className="text-lg font-bold">{formatCurrency(selectedCustomer.avgOrderValue)}</p>
                        <p className="text-xs text-[#757575]">Avg Order</p>
                      </div>
                      <div className="text-center p-3 border rounded-lg">
                        <p className="text-lg font-bold text-purple-600">{selectedCustomer.loyaltyPoints.toLocaleString()}</p>
                        <p className="text-xs text-[#757575]">Points</p>
                      </div>
                    </div>

                    {/* GroAI Next Best Offer */}
                    {selectedCustomer.nextBestOffer && (
                      <div className="p-3 bg-[#E0F2F1] rounded-lg border border-[#00897B]/20">
                        <div className="flex items-center gap-2 text-[#00897B]">
                          <Bot className="h-4 w-4" />
                          <span className="text-sm font-medium">GroAI Recommendation</span>
                        </div>
                        <p className="text-sm mt-1">{selectedCustomer.nextBestOffer}</p>
                      </div>
                    )}

                    {/* Tags */}
                    <div>
                      <p className="text-xs text-[#757575] mb-2">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedCustomer.tags.map(tag => (
                          <Badge key={tag} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                    </div>

                    {/* Preferences */}
                    {selectedCustomer.preferences && selectedCustomer.preferences.length > 0 && (
                      <div>
                        <p className="text-xs text-[#757575] mb-2">Preferences</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedCustomer.preferences.map(pref => (
                            <Badge key={pref} variant="outline">{pref}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Purchases Tab */}
                {customerDetailTab === 'purchases' && (
                  <div className="mt-4">
                    <div className="space-y-2">
                      {purchaseHistory
                        .filter(p => p.customerId === selectedCustomer.id)
                        .map(purchase => (
                          <Card key={purchase.id}>
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <ShoppingBag className="h-4 w-4 text-[#00897B]" />
                                  <span className="font-medium text-sm">{purchase.id}</span>
                                  <span className="text-xs text-[#757575]">{purchase.date}</span>
                                </div>
                                <span className="font-bold text-[#00897B]">{formatCurrency(purchase.total)}</span>
                              </div>
                              <div className="space-y-1">
                                {purchase.items.map((item, i) => (
                                  <div key={i} className="flex justify-between text-sm text-[#757575]">
                                    <span>{item.name} x{item.quantity}</span>
                                    <span>{formatCurrency(item.price * item.quantity)}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="flex items-center gap-4 mt-2 text-xs text-[#757575]">
                                <span>{purchase.paymentMethod}</span>
                                {purchase.staffMember && <span>Staff: {purchase.staffMember}</span>}
                                {purchase.location && <span>{purchase.location}</span>}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      {purchaseHistory.filter(p => p.customerId === selectedCustomer.id).length === 0 && (
                        <div className="text-center py-8 text-[#757575]">
                          <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No purchase history found</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Communications Tab */}
                {customerDetailTab === 'communications' && (
                  <div className="mt-4">
                    <div className="space-y-2">
                      {communicationLog
                        .filter(c => c.customerId === selectedCustomer.id)
                        .map(comm => (
                          <div key={comm.id} className={`p-3 rounded-lg border ${comm.direction === 'inbound' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                {comm.type === 'whatsapp' && <WhatsAppIcon className="h-4 w-4 text-green-600" />}
                                {comm.type === 'sms' && <MessageSquare className="h-4 w-4 text-blue-600" />}
                                {comm.type === 'email' && <Mail className="h-4 w-4 text-purple-600" />}
                                {comm.type === 'call' && <Phone className="h-4 w-4 text-orange-600" />}
                                <span className="text-xs font-medium capitalize">{comm.type}</span>
                                <Badge variant="outline" className="text-[10px]">{comm.direction}</Badge>
                              </div>
                              <span className="text-xs text-[#757575]">{comm.date}</span>
                            </div>
                            {comm.subject && <p className="text-xs font-medium text-[#1A1A1A]">{comm.subject}</p>}
                            <p className="text-sm text-[#757575] mt-1">{comm.message}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-[10px]">{comm.status}</Badge>
                              {comm.staffMember && <span className="text-[10px] text-[#757575]">by {comm.staffMember}</span>}
                            </div>
                          </div>
                        ))}
                      {communicationLog.filter(c => c.customerId === selectedCustomer.id).length === 0 && (
                        <div className="text-center py-8 text-[#757575]">
                          <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No communication history found</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* LTV Tab */}
                {customerDetailTab === 'ltv' && (
                  <div className="mt-4 space-y-4">
                    <Card className="bg-gradient-to-r from-[#00897B] to-[#4CAF50] text-white">
                      <CardContent className="p-6">
                        <p className="text-sm opacity-80">Customer Lifetime Value</p>
                        <p className="text-4xl font-bold">{formatCurrency(selectedCustomer.lifetimeValue)}</p>
                        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="opacity-80">Total Revenue</p>
                            <p className="font-bold">{formatCurrency(selectedCustomer.totalSpent)}</p>
                          </div>
                          <div>
                            <p className="opacity-80">Avg Order Value</p>
                            <p className="font-bold">{formatCurrency(selectedCustomer.avgOrderValue)}</p>
                          </div>
                          <div>
                            <p className="opacity-80">Visit Count</p>
                            <p className="font-bold">{selectedCustomer.totalOrders}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* LTV Breakdown */}
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Predicted Future Value</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold text-[#00897B]">{formatCurrency(Math.round(selectedCustomer.lifetimeValue * 1.5))}</p>
                          <p className="text-xs text-[#757575]">Based on current behavior</p>
                          <Progress value={selectedCustomer.churnProbability * 100} className="h-1.5 mt-2" />
                          <p className="text-xs mt-1">
                            <span className={selectedCustomer.churnProbability > 0.5 ? 'text-red-600' : 'text-green-600'}>
                              {Math.round((1 - selectedCustomer.churnProbability) * 100)}% retention probability
                            </span>
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Customer Health</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Recency Score</span>
                              <span className="font-bold">{selectedCustomer.rfmScore.r}/5</span>
                            </div>
                            <Progress value={selectedCustomer.rfmScore.r * 20} className="h-1.5" />
                            <div className="flex justify-between text-sm">
                              <span>Frequency Score</span>
                              <span className="font-bold">{selectedCustomer.rfmScore.f}/5</span>
                            </div>
                            <Progress value={selectedCustomer.rfmScore.f * 20} className="h-1.5" />
                            <div className="flex justify-between text-sm">
                              <span>Monetary Score</span>
                              <span className="font-bold">{selectedCustomer.rfmScore.m}/5</span>
                            </div>
                            <Progress value={selectedCustomer.rfmScore.m * 20} className="h-1.5" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Loyalty Progress */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Gift className="h-4 w-4" />
                          Loyalty Progress
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span>{selectedCustomer.loyaltyPoints.toLocaleString()} points</span>
                              <span>{getTierInfo(selectedCustomer.loyaltyTier).name}</span>
                            </div>
                            <Progress 
                              value={(selectedCustomer.loyaltyPoints / getTierInfo(selectedCustomer.loyaltyTier).maxPoints) * 100} 
                              className="h-2" 
                            />
                            {selectedCustomer.loyaltyTier !== 'platinum' && (
                              <p className="text-xs text-[#757575] mt-1">
                                {getTierInfo(selectedCustomer.loyaltyTier).maxPoints - selectedCustomer.loyaltyPoints} points to next tier
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </Tabs>

              {/* Actions */}
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <Button className="flex-1 bg-[#00897B] hover:bg-[#00695C]" onClick={() => { setSelectedCustomer(null); setMessageOpen(true); }}>
                  <MessageCircle className="h-4 w-4 mr-2" />Send Message
                </Button>
                <Button variant="outline" className="flex-1">
                  <Gift className="h-4 w-4 mr-2" />Add Points
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => handleDeleteCustomer(selectedCustomer.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />Delete
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Customer Dialog */}
      <Dialog open={addCustomerOpen} onOpenChange={setAddCustomerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>Enter customer details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-[#757575]">Full Name</Label>
              <Input placeholder="Customer name" value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs text-[#757575]">Phone Number</Label>
              <Input placeholder="+27 XX XXX XXXX" value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs text-[#757575]">Email (Optional)</Label>
              <Input placeholder="email@example.com" value={newCustomer.email} onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs text-[#757575]">Birthday (Optional)</Label>
              <Input type="date" value={newCustomer.birthday} onChange={e => setNewCustomer({ ...newCustomer, birthday: e.target.value })} />
            </div>
          </div>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddCustomerOpen(false); setError(null); }}>Cancel</Button>
            <Button 
              className="bg-[#00897B] hover:bg-[#00695C]" 
              onClick={handleAddCustomer}
              disabled={saving || !newCustomer.name.trim()}
            >
              {saving ? 'Adding...' : 'Add Customer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Message Dialog */}
      <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Message</DialogTitle>
            <DialogDescription>Send WhatsApp or SMS to customer</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 bg-green-50 border-green-200">
                <WhatsAppIcon className="h-4 w-4 mr-2 text-green-600" />WhatsApp
              </Button>
              <Button variant="outline" className="flex-1">
                <MessageSquare className="h-4 w-4 mr-2" />SMS
              </Button>
            </div>
            <div>
              <Label className="text-xs text-[#757575]">Message</Label>
              <Textarea placeholder="Type your message..." value={messageText} onChange={e => setMessageText(e.target.value)} rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setMessageOpen(false)}>
              <Send className="h-4 w-4 mr-2" />Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Loyalty Tier Edit Dialog */}
      <Dialog open={loyaltyEditOpen} onOpenChange={setLoyaltyEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTier?.id ? 'Edit Loyalty Tier' : 'Add New Loyalty Tier'}</DialogTitle>
            <DialogDescription>Configure tier settings and benefits</DialogDescription>
          </DialogHeader>
          {editingTier && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Tier Name</Label>
                  <Input value={editingTier.name} onChange={e => setEditingTier({ ...editingTier, name: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Discount (%)</Label>
                  <Input type="number" value={editingTier.discount} onChange={e => setEditingTier({ ...editingTier, discount: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs">Min Points</Label>
                  <Input type="number" value={editingTier.minPoints} onChange={e => setEditingTier({ ...editingTier, minPoints: parseInt(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label className="text-xs">Max Points</Label>
                  <Input type="number" value={editingTier.maxPoints === 999999 ? '' : editingTier.maxPoints} onChange={e => setEditingTier({ ...editingTier, maxPoints: parseInt(e.target.value) || 999999 })} placeholder="Leave empty for unlimited" />
                </div>
                <div>
                  <Label className="text-xs">Points Multiplier</Label>
                  <Input type="number" step="0.25" value={editingTier.pointsMultiplier} onChange={e => setEditingTier({ ...editingTier, pointsMultiplier: parseFloat(e.target.value) || 1 })} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Benefits (one per line)</Label>
                <Textarea 
                  value={editingTier.benefits.join('\n')} 
                  onChange={e => setEditingTier({ ...editingTier, benefits: e.target.value.split('\n').filter(b => b.trim()) })}
                  rows={4}
                  placeholder="Enter benefits, one per line"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editingTier.isActive} onCheckedChange={checked => setEditingTier({ ...editingTier, isActive: checked })} />
                <Label className="text-xs">Active</Label>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            {editingTier?.id && (
              <Button variant="destructive" onClick={() => handleDeleteTier(editingTier.id)}>
                <Trash2 className="h-4 w-4 mr-2" />Delete
              </Button>
            )}
            <Button variant="outline" onClick={() => setLoyaltyEditOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => editingTier && handleSaveTier(editingTier)}>
              <Save className="h-4 w-4 mr-2" />Save Tier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Loyalty Rewards Dialog */}
      <Dialog open={loyaltyRewardsOpen} onOpenChange={setLoyaltyRewardsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Loyalty Rewards</DialogTitle>
            <DialogDescription>Create and manage rewards that customers can redeem with points</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setEditingReward({ id: '', name: '', pointsCost: 0, description: '', category: 'discount', isActive: true })}>
                <Plus className="h-4 w-4 mr-2" />Add Reward
              </Button>
            </div>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {rewards.map(reward => (
                  <div key={reward.id} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className={`p-2 rounded-lg ${reward.category === 'discount' ? 'bg-green-100' : reward.category === 'free_item' ? 'bg-blue-100' : reward.category === 'voucher' ? 'bg-purple-100' : 'bg-orange-100'}`}>
                      <Gift className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{reward.name}</h4>
                        {!reward.isActive && <Badge variant="secondary">Inactive</Badge>}
                      </div>
                      <p className="text-xs text-[#757575]">{reward.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#00897B]">{reward.pointsCost} pts</p>
                      <p className="text-xs text-[#757575]">{reward.category}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setEditingReward(reward)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDeleteReward(reward.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLoyaltyRewardsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
