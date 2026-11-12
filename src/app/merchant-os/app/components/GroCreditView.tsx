'use client'

/**
 * GroCredit - Merchant Working Capital Facility
 * 
 * Algorithm-based credit scoring that measures sales performance
 * to determine credit qualification. Integrates with Inventory
 * Intelligence and Supply Intelligence for seamless operations.
 * 
 * 4-Tier System: Starter | Business | Enterprise | Seasonal
 * Interest Rate: Repo + 5-8% p.a. (risk-based)
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  PiggyBank,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Clock,
  Coins,
  Percent,
  Calendar,
  Bot,
  Lightbulb,
  Target,
  Zap,
  Brain,
  Shield,
  Star,
  Award,
  Lock,
  Sparkles,
  FileText,
  ChevronRight,
  Info,
  Calculator,
  Loader2,
  Building2,
  BarChart3,
  ArrowRight,
  CheckCircle,
  XCircle,
  Hourglass,
  Send,
  RefreshCw,
  Plus,
  Activity,
  Package,
  ShoppingCart,
  LineChart,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  AlertTriangle,
  BadgeCheck,
  Settings,
  HelpCircle,
  Scale,
  Users,
  Store,
  ShoppingBag,
  Boxes,
  Truck,
} from 'lucide-react'
import { useMerchantData } from '../hooks/useMerchantData'
import { EmptyState, NoDataEmptyState } from './EmptyState'

// ============================================
// TYPES & INTERFACES
// ============================================

// Credit Tiers based on spec
type CreditTier = 'starter' | 'business' | 'enterprise' | 'seasonal'

interface TierConfig {
  name: string
  color: string
  bgColor: string
  borderColor: string
  minMonthlySales: number
  maxLimit: number
  baseRate: number // Repo + baseRate
  features: string[]
  icon: typeof Star
}

const TIER_CONFIGS: Record<CreditTier, TierConfig> = {
  starter: {
    name: 'Starter',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    minMonthlySales: 10000,
    maxLimit: 50000,
    baseRate: 8, // Repo + 8%
    features: ['Basic credit limit', 'Standard processing', 'Monthly reviews'],
    icon: Star
  },
  business: {
    name: 'Business',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
    minMonthlySales: 50000,
    maxLimit: 200000,
    baseRate: 7, // Repo + 7%
    features: ['Higher limits', 'Priority processing', 'Flexible repayment', 'GroSupply integration'],
    icon: Award
  },
  enterprise: {
    name: 'Enterprise',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-300',
    minMonthlySales: 200000,
    maxLimit: 1000000,
    baseRate: 6, // Repo + 6%
    features: ['Maximum limits', 'Instant approval', 'Dedicated support', 'Custom terms', 'Multi-branch'],
    icon: Shield
  },
  seasonal: {
    name: 'Seasonal',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-300',
    minMonthlySales: 30000,
    maxLimit: 150000,
    baseRate: 5.5, // Repo + 5.5%
    features: ['Flexible terms', 'Peak season boosts', 'Interest holidays', 'Variable limits'],
    icon: Calendar
  }
}

// Current SARB Repo Rate (as of 2026)
const REPO_RATE = 8.25

// Sales Performance Data (from POS/Analytics integration)
interface SalesPerformance {
  dailyAverage: number
  weeklyTrend: number // percentage
  monthlyTotal: number
  monthlyGrowth: number // percentage
  peakDay: string
  peakDaySales: number
  transactionCount: number
  averageTransaction: number
  consistency: number // 0-100 score
  ytdTotal: number
  lastThreeMonths: number[]
}

// Inventory Intelligence Data
interface InventoryIntelligence {
  stockTurnoverRate: number // times per year
  daysOfStock: number
  lowStockAlerts: number
  reorderFrequency: number // orders per month
  topMovingCategories: string[]
  deadStockRatio: number // percentage
  grossMarginReturn: number // GMROI
}

// Supply Intelligence Data
interface SupplyIntelligence {
  supplierReliabilityScore: number // 0-100
  averageDeliveryDays: number
  activeSuppliers: number
  pendingOrders: number
  onTimeDeliveryRate: number // percentage
  bulkDiscountOpportunities: number
  monthlyProcurementSpend: number
}

// GroCredit Score Breakdown
interface CreditScoreBreakdown {
  salesPerformance: {
    score: number
    weight: number
    factors: { name: string; value: number; impact: 'positive' | 'negative' | 'neutral' }[]
  }
  operationalConsistency: {
    score: number
    weight: number
    factors: { name: string; value: number; impact: 'positive' | 'negative' | 'neutral' }[]
  }
  inventoryHealth: {
    score: number
    weight: number
    factors: { name: string; value: number; impact: 'positive' | 'negative' | 'neutral' }[]
  }
  supplyReliability: {
    score: number
    weight: number
    factors: { name: string; value: number; impact: 'positive' | 'negative' | 'neutral' }[]
  }
  overallScore: number
  tier: CreditTier
  confidence: number
}

// Credit Facility
interface CreditFacility {
  id: string
  tier: CreditTier
  approvedLimit: number
  availableCredit: number
  usedCredit: number
  interestRate: number // Repo + tier base rate
  status: 'active' | 'suspended' | 'under_review' | 'pending_activation'
  activatedAt: string
  nextReviewDate: string
  repaymentTerms: {
    minimumPaymentPercent: number
    dueDate: number // day of month
    lateFeePercent: number
  }
  ncaCompliant: boolean
  businessType: 'sole_proprietor' | 'pty_ltd' | 'cc' | 'other'
}

// Draw Transaction
interface DrawTransaction {
  id: string
  reference: string
  amount: number
  purpose: 'inventory_purchase' | 'working_capital' | 'emergency' | 'grosupply_order'
  linkedPOId?: string
  linkedSupplier?: string
  status: 'pending' | 'processed' | 'reconciled'
  createdAt: string
  interestAccrued: number
  repaymentDate: string
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

const formatCurrency = (amount: number) => {
  return `R${Math.abs(amount).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const formatPercent = (value: number) => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

const getDaysUntil = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

// ============================================
// MAIN COMPONENT
// ============================================

export function GroCreditView() {
  // Get merchant data from session
  const { merchantId, isLoading: isLoadingMerchant } = useMerchantData()
  
  // State
  const [activeTab, setActiveTab] = useState<string>('overview')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  
  // Data states
  const [salesPerformance, setSalesPerformance] = useState<SalesPerformance | null>(null)
  const [inventoryIntelligence, setInventoryIntelligence] = useState<InventoryIntelligence | null>(null)
  const [supplyIntelligence, setSupplyIntelligence] = useState<SupplyIntelligence | null>(null)
  const [creditScore, setCreditScore] = useState<CreditScoreBreakdown | null>(null)
  const [facility, setFacility] = useState<CreditFacility | null>(null)
  const [drawTransactions, setDrawTransactions] = useState<DrawTransaction[]>([])
  
  // Dialog states
  const [drawDialogOpen, setDrawDialogOpen] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [applyDialogOpen, setApplyDialogOpen] = useState(false)
  const [algorithmDialogOpen, setAlgorithmDialogOpen] = useState(false)
  const [groSupplyOrderDialogOpen, setGroSupplyOrderDialogOpen] = useState(false)
  
  // Form states
  const [drawAmount, setDrawAmount] = useState<number>(0)
  const [drawPurpose, setDrawPurpose] = useState<string>('working_capital')
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [applicationForm, setApplicationForm] = useState({
    businessType: 'pty_ltd' as 'sole_proprietor' | 'pty_ltd' | 'cc' | 'other',
    tradingYears: '',
    requestedTier: 'business' as CreditTier,
    purpose: '',
    acceptNCA: false,
    acceptTerms: false
  })

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!merchantId) return
    setLoading(true)
    try {
      // Fetch from API endpoints
      const [salesRes, inventoryRes, supplyRes, creditRes, facilityRes, transactionsRes] = await Promise.all([
        fetch(`/merchant-os/api/grocredit/sales-performance?merchantId=${merchantId}`),
        fetch(`/merchant-os/api/grocredit/inventory-intelligence?merchantId=${merchantId}`),
        fetch(`/merchant-os/api/grocredit/supply-intelligence?merchantId=${merchantId}`),
        fetch(`/merchant-os/api/grocredit/credit-score?merchantId=${merchantId}`),
        fetch(`/merchant-os/api/grocredit/facility?merchantId=${merchantId}`),
        fetch(`/merchant-os/api/grocredit/transactions?merchantId=${merchantId}`)
      ])
      
      if (salesRes.ok) {
        const data = await salesRes.json()
        setSalesPerformance(data.salesPerformance || null)
      }
      
      if (inventoryRes.ok) {
        const data = await inventoryRes.json()
        setInventoryIntelligence(data.inventoryIntelligence || null)
      }
      
      if (supplyRes.ok) {
        const data = await supplyRes.json()
        setSupplyIntelligence(data.supplyIntelligence || null)
      }
      
      if (creditRes.ok) {
        const data = await creditRes.json()
        setCreditScore(data.creditScore || null)
      }
      
      if (facilityRes.ok) {
        const data = await facilityRes.json()
        setFacility(data.facility || null)
      }
      
      if (transactionsRes.ok) {
        const data = await transactionsRes.json()
        setDrawTransactions(data.transactions || [])
      }
      
    } catch (error) {
      console.error('Error fetching GroCredit data:', error)
      toast.error('Failed to load credit data')
    } finally {
      setLoading(false)
    }
  }, [merchantId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Calculate recommended credit limit based on algorithm
  const recommendedLimit = useMemo(() => {
    if (!salesPerformance || !creditScore) return 0
    
    // Algorithm: Based on monthly sales * credit score factor * tier multiplier
    const baseLimit = salesPerformance.monthlyTotal * 0.6 // 60% of monthly sales as base
    const scoreMultiplier = creditScore.overallScore / 100
    const tierMultiplier = creditScore.tier === 'enterprise' ? 1.5 :
                          creditScore.tier === 'business' ? 1.0 :
                          creditScore.tier === 'seasonal' ? 0.8 : 0.5
    
    return Math.round(baseLimit * scoreMultiplier * tierMultiplier)
  }, [salesPerformance, creditScore])

  // Calculate interest for amount
  const calculateInterest = (amount: number, months: number = 1) => {
    if (!facility) return 0
    const monthlyRate = facility.interestRate / 100 / 12
    return amount * monthlyRate * months
  }

  // Handle draw
  const handleDraw = async () => {
    if (!facility || drawAmount <= 0 || drawAmount > facility.availableCredit) {
      toast.error('Invalid draw amount')
      return
    }
    
    setProcessing(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const newDraw: DrawTransaction = {
        id: `DRW-${Date.now()}`,
        reference: `GC-DRW-${new Date().getFullYear()}-${String(drawTransactions.length + 1).padStart(3, '0')}`,
        amount: drawAmount,
        purpose: drawPurpose as any,
        status: 'processed',
        createdAt: new Date().toISOString(),
        interestAccrued: calculateInterest(drawAmount),
        repaymentDate: `${new Date().getFullYear()}-${String(new Date().getMonth() + 2).padStart(2, '0')}-25`
      }
      
      setDrawTransactions(prev => [newDraw, ...prev])
      setFacility(prev => prev ? {
        ...prev,
        availableCredit: prev.availableCredit - drawAmount,
        usedCredit: prev.usedCredit + drawAmount
      } : null)
      
      setDrawDialogOpen(false)
      setDrawAmount(0)
      toast.success(`Successfully drew ${formatCurrency(drawAmount)}`)
    } catch (error) {
      toast.error('Failed to process draw')
    } finally {
      setProcessing(false)
    }
  }

  // Handle payment
  const handlePayment = async () => {
    if (!facility || paymentAmount <= 0) {
      toast.error('Invalid payment amount')
      return
    }
    
    setProcessing(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const actualPayment = Math.min(paymentAmount, facility.usedCredit)
      
      setFacility(prev => prev ? {
        ...prev,
        availableCredit: prev.availableCredit + actualPayment,
        usedCredit: prev.usedCredit - actualPayment
      } : null)
      
      setPaymentDialogOpen(false)
      setPaymentAmount(0)
      toast.success(`Payment of ${formatCurrency(actualPayment)} processed successfully`)
    } catch (error) {
      toast.error('Failed to process payment')
    } finally {
      setProcessing(false)
    }
  }

  // Handle GroSupply order payment
  const handleGroSupplyPayment = async (poId: string, amount: number) => {
    if (!facility || amount > facility.availableCredit) {
      toast.error('Insufficient credit available')
      return
    }
    
    setProcessing(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const newDraw: DrawTransaction = {
        id: `DRW-${Date.now()}`,
        reference: `GC-GS-${new Date().getFullYear()}-${String(drawTransactions.length + 1).padStart(3, '0')}`,
        amount,
        purpose: 'grosupply_order',
        linkedPOId: poId,
        status: 'processed',
        createdAt: new Date().toISOString(),
        interestAccrued: calculateInterest(amount),
        repaymentDate: `${new Date().getFullYear()}-${String(new Date().getMonth() + 2).padStart(2, '0')}-25`
      }
      
      setDrawTransactions(prev => [newDraw, ...prev])
      setFacility(prev => prev ? {
        ...prev,
        availableCredit: prev.availableCredit - amount,
        usedCredit: prev.usedCredit + amount
      } : null)
      
      setGroSupplyOrderDialogOpen(false)
      toast.success(`GroSupply order ${poId} paid via GroCredit`)
    } catch (error) {
      toast.error('Failed to process GroSupply payment')
    } finally {
      setProcessing(false)
    }
  }

  // Get tier badge
  const TierBadge = ({ tier }: { tier: CreditTier }) => {
    const config = TIER_CONFIGS[tier]
    const Icon = config.icon
    return (
      <Badge className={`${config.bgColor} ${config.color} border ${config.borderColor}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.name}
      </Badge>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#00897B] mx-auto mb-4" />
          <p className="text-sm text-[#757575]">Analyzing your business performance...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <PiggyBank className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#1A1A1A]">GroCredit</h2>
                <Badge className="bg-gradient-to-r from-violet-500 to-purple-500 text-white text-[10px]">
                  <Sparkles className="h-3 w-3 mr-1" />
                  WORKING CAPITAL
                </Badge>
              </div>
              <p className="text-xs text-[#757575]">Algorithm-Based Merchant Financing</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {facility && <TierBadge tier={facility.tier} />}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAlgorithmDialogOpen(true)}
            >
              <Brain className="h-4 w-4 mr-1" />
              How It Works
            </Button>
            {facility?.status === 'active' && (
              <Button
                className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
                size="sm"
                onClick={() => setDrawDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Draw Funds
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-3 bg-white border-b border-gray-200">
        <div className="flex gap-1 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: Wallet },
            { id: 'algorithm', label: 'Credit Algorithm', icon: Brain },
            { id: 'intelligence', label: 'Intelligence Integration', icon: Activity },
            { id: 'transactions', label: 'Transactions', icon: CreditCard },
            { id: 'compliance', label: 'NCA Compliance', icon: Scale },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-violet-50 text-violet-700 border-b-2 border-violet-500'
                  : 'text-[#757575] hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Credit Score Hero Card */}
            <Card className="border-l-4 border-l-violet-500 bg-gradient-to-r from-violet-50 to-purple-50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs text-[#757575] mb-1">Your GroCredit Score</p>
                    <div className="flex items-center gap-4">
                      <span className="text-5xl font-bold text-violet-600">
                        {creditScore?.overallScore || 0}
                      </span>
                      <div className="flex flex-col gap-1">
                        <TierBadge tier={creditScore?.tier || 'starter'} />
                        <span className="text-[10px] text-[#757575]">out of 100</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(recommendedLimit)}</div>
                    <p className="text-xs text-[#757575]">Recommended Limit</p>
                    <p className="text-[10px] text-violet-600 mt-1">{creditScore?.confidence}% confidence</p>
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {creditScore && Object.entries({
                    salesPerformance: 'Sales',
                    operationalConsistency: 'Operations',
                    inventoryHealth: 'Inventory',
                    supplyReliability: 'Supply'
                  }).map(([key, label]) => {
                    const data = creditScore[key as keyof CreditScoreBreakdown] as any
                    if (!data || typeof data.score === 'undefined') return null
                    return (
                      <div key={key} className="text-center p-2 rounded-lg bg-white/60">
                        <p className="text-[10px] text-[#757575]">{label}</p>
                        <p className="text-lg font-bold text-[#1A1A1A]">{data.score}</p>
                        <p className="text-[10px] text-violet-600">{data.weight}% weight</p>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Credit Facility Status */}
            {facility && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-[#757575]">Available Credit</p>
                        <Wallet className="h-4 w-4 text-green-500" />
                      </div>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(facility.availableCredit)}</p>
                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[#757575]">Utilization</span>
                          <span>{Math.round((facility.usedCredit / facility.approvedLimit) * 100)}%</span>
                        </div>
                        <Progress value={(facility.usedCredit / facility.approvedLimit) * 100} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-[#757575]">Used Credit</p>
                        <CreditCard className="h-4 w-4 text-amber-500" />
                      </div>
                      <p className="text-2xl font-bold text-amber-600">{formatCurrency(facility.usedCredit)}</p>
                      <p className="text-xs text-[#757575] mt-2">
                        Interest: {facility.interestRate}% APR (Repo + {TIER_CONFIGS[facility.tier].baseRate}%)
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-[#757575]">Approved Limit</p>
                        <BadgeCheck className="h-4 w-4 text-violet-500" />
                      </div>
                      <p className="text-2xl font-bold text-[#1A1A1A]">{formatCurrency(facility.approvedLimit)}</p>
                      <p className="text-xs text-[#757575] mt-2">
                        Review: {getDaysUntil(facility.nextReviewDate)} days
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
                    onClick={() => setDrawDialogOpen(true)}
                    disabled={facility.availableCredit <= 0}
                  >
                    <Coins className="h-4 w-4 mr-2" />
                    Draw Funds
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setPaymentDialogOpen(true)}
                    disabled={facility.usedCredit <= 0}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Make Payment
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setGroSupplyOrderDialogOpen(true)}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Pay GroSupplier
                  </Button>
                </div>
              </>
            )}

            {/* Sales Performance Summary */}
            {salesPerformance && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Sales Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-[#1A1A1A]">{formatCurrency(salesPerformance.monthlyTotal)}</p>
                      <p className="text-xs text-[#757575]">Monthly Revenue</p>
                      <p className="text-xs text-green-600 mt-1">{formatPercent(salesPerformance.monthlyGrowth)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-[#1A1A1A]">{formatCurrency(salesPerformance.dailyAverage)}</p>
                      <p className="text-xs text-[#757575]">Daily Average</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-[#1A1A1A]">{salesPerformance.transactionCount}</p>
                      <p className="text-xs text-[#757575]">Transactions</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-[#1A1A1A]">{salesPerformance.consistency}%</p>
                      <p className="text-xs text-[#757575]">Consistency Score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tier Progression */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Tier Progression</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  {(Object.keys(TIER_CONFIGS) as CreditTier[]).map((tier, idx) => {
                    const config = TIER_CONFIGS[tier]
                    const Icon = config.icon
                    const isActive = facility?.tier === tier
                    const isPast = Object.keys(TIER_CONFIGS).indexOf(facility?.tier || 'starter') > idx
                    
                    return (
                      <div key={tier} className="flex items-center">
                        <div className={`flex flex-col items-center ${isActive ? 'scale-110' : ''}`}>
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                            isActive ? `${config.bgColor} ${config.borderColor}` :
                            isPast ? `${config.bgColor}` : 'bg-gray-100 border-gray-200'
                          }`}>
                            <Icon className={`h-5 w-5 ${isActive || isPast ? config.color : 'text-gray-400'}`} />
                          </div>
                          <span className={`text-[10px] mt-1 font-medium ${isActive ? config.color : 'text-[#757575]'}`}>
                            {config.name}
                          </span>
                          {isActive && (
                            <span className="text-[10px] text-violet-600">Current</span>
                          )}
                        </div>
                        {idx < 3 && (
                          <ArrowRight className={`h-4 w-4 mx-2 ${isPast ? 'text-violet-400' : 'text-gray-200'}`} />
                        )}
                      </div>
                    )
                  })}
                </div>
                
                {/* Next tier requirements */}
                {facility && facility.tier !== 'enterprise' && salesPerformance && (
                  <div className="mt-4 p-3 bg-violet-50 rounded-lg">
                    <p className="text-xs font-medium text-violet-700">
                      Upgrade to {TIER_CONFIGS[Object.keys(TIER_CONFIGS)[Object.keys(TIER_CONFIGS).indexOf(facility.tier) + 1] as CreditTier].name}:
                    </p>
                    <p className="text-xs text-violet-600 mt-1">
                      Current: {formatCurrency(salesPerformance.monthlyTotal)}/mo · 
                      Required: {formatCurrency(TIER_CONFIGS[Object.keys(TIER_CONFIGS)[Object.keys(TIER_CONFIGS).indexOf(facility.tier) + 1] as CreditTier].minMonthlySales)}/mo
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* CREDIT ALGORITHM TAB */}
        {activeTab === 'algorithm' && creditScore && salesPerformance && (
          <div className="space-y-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Brain className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1A1A1A]">GroCredit Algorithm</h3>
                    <p className="text-xs text-[#757575]">Multi-factor credit scoring based on your business performance</p>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-lg mb-4">
                  <p className="text-sm text-blue-700">
                    <strong>How it works:</strong> GroCredit analyzes your sales data, inventory velocity, 
                    supplier reliability, and operational consistency to determine your creditworthiness. 
                    This algorithm runs nightly and adjusts your limit based on real performance.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Score Factors */}
            {[
              { key: 'salesPerformance', label: 'Sales Performance', icon: TrendingUp, color: 'text-green-500', weight: 40 },
              { key: 'operationalConsistency', label: 'Operational Consistency', icon: Activity, color: 'text-blue-500', weight: 20 },
              { key: 'inventoryHealth', label: 'Inventory Health', icon: Package, color: 'text-amber-500', weight: 20 },
              { key: 'supplyReliability', label: 'Supply Chain Reliability', icon: Truck, color: 'text-purple-500', weight: 20 },
            ].map(({ key, label, icon: Icon, color, weight }) => {
              const data = creditScore[key as keyof CreditScoreBreakdown] as any
              if (!data || !data.factors) return null
              
              return (
                <Card key={key}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${color}`} />
                        {label}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{weight}% weight</Badge>
                        <span className="text-lg font-bold">{data.score}</span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {data.factors.map((factor: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                          <div className="flex items-center gap-2">
                            {factor.impact === 'positive' && <ArrowUpRight className="h-4 w-4 text-green-500" />}
                            {factor.impact === 'negative' && <ArrowDownRight className="h-4 w-4 text-red-500" />}
                            {factor.impact === 'neutral' && <Minus className="h-4 w-4 text-gray-400" />}
                            <span className="text-sm">{factor.name}</span>
                          </div>
                          <span className="text-sm font-medium">
                            {typeof factor.value === 'number' && factor.value > 1000 
                              ? formatCurrency(factor.value)
                              : factor.value % 1 === 0 
                                ? factor.value 
                                : `${factor.value}%`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {/* Limit Calculation */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-violet-500" />
                  Credit Limit Calculation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm">Monthly Revenue Base (60%)</span>
                    <span className="font-medium">{formatCurrency(salesPerformance.monthlyTotal * 0.6)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm">Credit Score Multiplier</span>
                    <span className="font-medium">{(creditScore.overallScore / 100).toFixed(2)}x</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm">Tier Multiplier ({TIER_CONFIGS[creditScore.tier].name})</span>
                    <span className="font-medium">
                      {(creditScore.tier === 'enterprise' ? 1.5 :
                        creditScore.tier === 'business' ? 1.0 :
                        creditScore.tier === 'seasonal' ? 0.8 : 0.5).toFixed(1)}x
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center p-3 bg-violet-50 rounded-lg">
                    <span className="font-medium">Recommended Limit</span>
                    <span className="text-xl font-bold text-violet-600">{formatCurrency(recommendedLimit)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* INTELLIGENCE INTEGRATION TAB */}
        {activeTab === 'intelligence' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-4 rounded-lg border border-violet-200">
              <h3 className="font-medium text-violet-700 mb-2">Intelligence Fusion</h3>
              <p className="text-sm text-violet-600">
                GroCredit integrates with Inventory Intelligence and Supply Intelligence to provide 
                seamless working capital that adapts to your business operations.
              </p>
            </div>

            {/* Inventory Intelligence */}
            {inventoryIntelligence && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Boxes className="h-4 w-4 text-amber-500" />
                    Inventory Intelligence Integration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-amber-50 rounded-lg">
                      <p className="text-xs text-[#757575]">Stock Turnover</p>
                      <p className="text-xl font-bold">{inventoryIntelligence.stockTurnoverRate}x/year</p>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-lg">
                      <p className="text-xs text-[#757575]">Days of Stock</p>
                      <p className="text-xl font-bold">{inventoryIntelligence.daysOfStock} days</p>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-lg">
                      <p className="text-xs text-[#757575]">Low Stock Alerts</p>
                      <p className="text-xl font-bold">{inventoryIntelligence.lowStockAlerts}</p>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-lg">
                      <p className="text-xs text-[#757575]">GMROI</p>
                      <p className="text-xl font-bold">{inventoryIntelligence.grossMarginReturn}%</p>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 text-green-700">
                      <Zap className="h-4 w-4" />
                      <span className="text-sm font-medium">Auto-Reorder Credit</span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      When inventory hits reorder point, GroCredit can automatically fund the purchase order.
                    </p>
                    <Button size="sm" variant="outline" className="mt-2">
                      <Settings className="h-3 w-3 mr-1" />
                      Configure Auto-Fund
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Supply Intelligence */}
            {supplyIntelligence && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Truck className="h-4 w-4 text-blue-500" />
                    Supply Intelligence Integration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-[#757575]">Supplier Reliability</p>
                      <p className="text-xl font-bold">{supplyIntelligence.supplierReliabilityScore}%</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-[#757575]">On-Time Delivery</p>
                      <p className="text-xl font-bold">{supplyIntelligence.onTimeDeliveryRate}%</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-[#757575]">Active Suppliers</p>
                      <p className="text-xl font-bold">{supplyIntelligence.activeSuppliers}</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-[#757575]">Monthly Spend</p>
                      <p className="text-xl font-bold">{formatCurrency(supplyIntelligence.monthlyProcurementSpend)}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-violet-50 rounded-lg border border-violet-200">
                    <div className="flex items-center gap-2 text-violet-700">
                      <ShoppingCart className="h-4 w-4" />
                      <span className="text-sm font-medium">GroSupply Instant Pay</span>
                    </div>
                    <p className="text-xs text-violet-600 mt-1">
                      Pay GroSupply orders instantly with GroCredit. Earn supplier discounts for early payment.
                    </p>
                    {supplyIntelligence.bulkDiscountOpportunities > 0 && (
                      <div className="mt-2 p-2 bg-white rounded border border-violet-200">
                        <p className="text-xs text-violet-600">
                          💰 {supplyIntelligence.bulkDiscountOpportunities} bulk discount opportunities available
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Integration Benefits */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Integration Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { icon: Zap, title: 'Instant Stock Funding', desc: 'Auto-fund reorder when inventory runs low' },
                    { icon: Percent, title: 'Early Payment Discounts', desc: 'Capture supplier discounts with GroCredit' },
                    { icon: TrendingUp, title: 'Dynamic Limits', desc: 'Credit grows with your sales performance' },
                    { icon: Shield, title: 'Risk Protection', desc: 'Supplier reliability factors into your score' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <item.icon className="h-5 w-5 text-violet-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">{item.title}</p>
                        <p className="text-xs text-[#757575]">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TRANSACTIONS TAB */}
        {activeTab === 'transactions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[#1A1A1A]">Draw Transactions</h3>
              <Button
                size="sm"
                className="bg-violet-500 hover:bg-violet-600"
                onClick={() => setDrawDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                New Draw
              </Button>
            </div>

            {drawTransactions.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CreditCard className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-[#757575]">No transactions yet</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setDrawDialogOpen(true)}
                  >
                    Draw Funds
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {drawTransactions.map((tx) => (
                  <Card key={tx.id} className="hover:border-violet-300 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            tx.purpose === 'grosupply_order' ? 'bg-blue-100' :
                            tx.purpose === 'inventory_purchase' ? 'bg-amber-100' :
                            'bg-violet-100'
                          }`}>
                            {tx.purpose === 'grosupply_order' ? (
                              <ShoppingCart className="h-5 w-5 text-blue-600" />
                            ) : tx.purpose === 'inventory_purchase' ? (
                              <Package className="h-5 w-5 text-amber-600" />
                            ) : (
                              <Coins className="h-5 w-5 text-violet-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-[#1A1A1A]">{tx.reference}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-[#757575] capitalize">
                                {tx.purpose.replace('_', ' ')}
                              </p>
                              {tx.linkedPOId && (
                                <Badge variant="outline" className="text-[10px]">
                                  {tx.linkedPOId}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-[#1A1A1A]">{formatCurrency(tx.amount)}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-[#757575]">
                              {new Date(tx.createdAt).toLocaleDateString()}
                            </p>
                            <Badge className={`${
                              tx.status === 'reconciled' ? 'bg-green-100 text-green-700' :
                              tx.status === 'processed' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {tx.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t flex justify-between text-xs">
                        <span className="text-[#757575]">Interest Accrued: <span className="font-medium">{formatCurrency(tx.interestAccrued)}</span></span>
                        <span className="text-[#757575]">Repayment: <span className="font-medium">{new Date(tx.repaymentDate).toLocaleDateString()}</span></span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* NCA COMPLIANCE TAB */}
        {activeTab === 'compliance' && (
          <div className="space-y-4">
            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <Scale className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1A1A1A]">National Credit Act (NCA) Compliance</h3>
                    <p className="text-xs text-[#757575]">Regulatory framework for credit providers</p>
                  </div>
                </div>
                
                <div className="bg-amber-50 p-3 rounded-lg">
                  <p className="text-sm text-amber-700">
                    GroCredit is an NCA-regulated credit facility. Sole proprietors receive full 
                    affordability assessments per NCA requirements. Pty Ltd and Close Corporations 
                    fall under commercial credit provisions.
                  </p>
                </div>
              </CardContent>
            </Card>

            {facility && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Your Compliance Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-[#757575]" />
                        <span className="text-sm">Business Type</span>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700 capitalize">
                        {facility.businessType.replace('_', ' ')}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <BadgeCheck className="h-4 w-4 text-[#757575]" />
                        <span className="text-sm">NCA Compliant</span>
                      </div>
                      <Badge className={facility.ncaCompliant ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                        {facility.ncaCompliant ? 'Yes' : 'Pending'}
                      </Badge>
                    </div>

                    {facility.businessType === 'sole_proprietor' && (
                      <div className="p-3 bg-violet-50 rounded-lg border border-violet-200">
                        <p className="text-sm font-medium text-violet-700">Sole Proprietor Requirements</p>
                        <ul className="text-xs text-violet-600 mt-2 space-y-1">
                          <li>✓ Affordability assessment completed</li>
                          <li>✓ Pre-agreement disclosure provided</li>
                          <li>✓ Credit agreement signed</li>
                          <li>✓ Cooling-off period explained</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* NCA Information */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Consumer Rights Under NCA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {[
                    'Right to apply for credit (Section 60)',
                    'Right to reasons for credit being refused (Section 62)',
                    'Right to information in official language (Section 63)',
                    'Right to access and correct credit records (Section 72)',
                    'Right to dispute incorrect information (Section 72)',
                    'Cooling-off period (5 business days for pre-agreement)',
                    'Right to surrender goods (Section 127)',
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-[#757575]">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* NCR Registration */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">National Credit Regulator (NCR)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium">GroCredit is an NCR-Registered Credit Provider</p>
                  <p className="text-xs text-[#757575] mt-1">NCRCP Registration Number: NCRCPXXXX</p>
                  <p className="text-xs text-[#757575]">Contact: 0860 627 627 | www.ncr.org.za</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </ScrollArea>

      {/* DIALOGS */}
      
      {/* Draw Funds Dialog */}
      <Dialog open={drawDialogOpen} onOpenChange={setDrawDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Draw Funds</DialogTitle>
            <DialogDescription>
              Available: {facility ? formatCurrency(facility.availableCredit) : 'R0.00'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm font-medium">Amount (ZAR)</Label>
              <Input
                type="number"
                value={drawAmount || ''}
                onChange={(e) => setDrawAmount(Number(e.target.value))}
                placeholder="0.00"
                className="mt-1"
              />
              {facility && (
                <div className="flex gap-2 mt-2">
                  {[5000, 10000, 25000, facility.availableCredit].slice(0, 3).map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setDrawAmount(amount)}
                    >
                      {formatCurrency(amount)}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium">Purpose</Label>
              <Select value={drawPurpose} onValueChange={setDrawPurpose}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="working_capital">Working Capital</SelectItem>
                  <SelectItem value="inventory_purchase">Inventory Purchase</SelectItem>
                  <SelectItem value="grosupply_order">GroSupply Order</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {drawAmount > 0 && facility && (
              <div className="p-3 bg-violet-50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Interest Rate</span>
                  <span className="font-medium">{facility.interestRate}% APR</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span>Est. Monthly Interest</span>
                  <span className="font-medium text-amber-600">{formatCurrency(calculateInterest(drawAmount))}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span>Repayment Date</span>
                  <span className="font-medium">
                    {new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString('en-ZA', { month: 'long', day: 'numeric' })}
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDrawDialogOpen(false)}>Cancel</Button>
            <Button
              className="bg-gradient-to-r from-violet-500 to-purple-500"
              onClick={handleDraw}
              disabled={processing || !facility || drawAmount <= 0 || drawAmount > facility.availableCredit}
            >
              {processing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Coins className="h-4 w-4 mr-2" />
              )}
              Draw {formatCurrency(drawAmount)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Make Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Make Payment</DialogTitle>
            <DialogDescription>
              Outstanding: {facility ? formatCurrency(facility.usedCredit) : 'R0.00'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm font-medium">Payment Amount (ZAR)</Label>
              <Input
                type="number"
                value={paymentAmount || ''}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                placeholder="0.00"
                className="mt-1"
              />
              {facility && (
                <div className="flex gap-2 mt-2">
                  {[
                    Math.round(facility.usedCredit * 0.25),
                    Math.round(facility.usedCredit * 0.5),
                    facility.usedCredit
                  ].map((amount, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setPaymentAmount(amount)}
                    >
                      {formatCurrency(amount)}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
            <Button
              className="bg-green-500 hover:bg-green-600"
              onClick={handlePayment}
              disabled={processing || paymentAmount <= 0}
            >
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Pay {formatCurrency(paymentAmount)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* GroSupply Order Payment Dialog */}
      <Dialog open={groSupplyOrderDialogOpen} onOpenChange={setGroSupplyOrderDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Pay GroSupplier with GroCredit</DialogTitle>
            <DialogDescription>
              Select a pending order to pay using your credit facility
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-3">
              {/* Mock pending orders */}
              {[
                { id: 'PO-2024-0921', supplier: 'ABC Distributors', amount: 15000, items: 12 },
                { id: 'PO-2024-0925', supplier: 'Fresh Produce Ltd', amount: 8500, items: 8 },
                { id: 'PO-2024-0928', supplier: 'National Beverages', amount: 22000, items: 25 },
              ].map((order) => (
                <Card key={order.id} className="cursor-pointer hover:border-violet-300" 
                  onClick={() => handleGroSupplyPayment(order.id, order.amount)}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <ShoppingCart className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{order.id}</p>
                          <p className="text-xs text-[#757575]">{order.supplier} · {order.items} items</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(order.amount)}</p>
                        <Button size="sm" variant="outline" className="mt-1">
                          Pay Now
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGroSupplyOrderDialogOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* How It Works Dialog */}
      <Dialog open={algorithmDialogOpen} onOpenChange={setAlgorithmDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-violet-500" />
              How GroCredit Works
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                {[
                  { step: 1, icon: Activity, title: 'Analyze', desc: 'Monitor sales performance daily' },
                  { step: 2, icon: Brain, title: 'Score', desc: 'Algorithm calculates creditworthiness' },
                  { step: 3, icon: Award, title: 'Qualify', desc: 'Determine tier and limit' },
                  { step: 4, icon: Zap, title: 'Fund', desc: 'Access working capital instantly' },
                ].map((item) => (
                  <div key={item.step} className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-2">
                      <item.icon className="h-5 w-5 text-violet-600" />
                    </div>
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-[10px] text-[#757575] mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-violet-50 rounded-lg">
                <h4 className="font-medium text-violet-700 mb-2">The Algorithm Factors</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span>Sales Performance (40%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <span>Operational Consistency (20%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-amber-500" />
                    <span>Inventory Health (20%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-purple-500" />
                    <span>Supply Reliability (20%)</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-700 mb-2">Protecting the Lender</h4>
                <p className="text-sm text-green-600">
                  The algorithm protects both parties by ensuring credit limits are based on actual 
                  business performance. If sales decline, the limit adjusts accordingly. This 
                  prevents over-extension and ensures sustainable credit.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setAlgorithmDialogOpen(false)}>Got It</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
