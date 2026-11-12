'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  VisuallyHidden,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  CreditCard,
  Coins,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Zap,
  Bot,
  Target,
  AlertCircle,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  Clock,
  Building2,
  QrCode,
  Smartphone,
  Banknote,
  Wallet,
  Globe,
  Shield,
  Settings,
  PieChart,
  BarChart3,
  Activity,
  Link2,
  Unlink2,
  Plus,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
  TestTube,
  AlertTriangle,
  Info,
  Server,
  Route,
  Percent,
  Calendar,
  FileText,
  Download,
  Filter,
  Edit,
  Trash2,
  Save,
  X,
} from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useMerchantData } from '../hooks/useMerchantData'
import { EmptyState, NoDataEmptyState } from './EmptyState'

// ============================================
// TYPES
// ============================================

interface PaymentProcessor {
  id: string
  name: string
  type: 'card' | 'qr' | 'ewallet' | 'bank' | 'crypto'
  status: 'active' | 'inactive' | 'pending' | 'error'
  logo?: string
  supportedMethods: string[]
  fees: {
    percentage: number
    fixed: number
    currency: string
  }
  settlementDays: number
  minTransaction: number
  maxTransaction: number
  countries: string[]
  lastTransaction?: string
  totalVolume: number
  transactionCount: number
  apiKey?: string
  webhookUrl?: string
  testMode: boolean
}

interface Transaction {
  id: string
  processorId: string
  processorName: string
  amount: number
  currency: string
  method: 'card' | 'qr' | 'ewallet' | 'bank' | 'cash'
  status: 'pending' | 'processing' | 'approved' | 'declined' | 'refunded' | 'cancelled'
  reference: string
  customerInfo?: {
    name?: string
    email?: string
    phone?: string
  }
  cardInfo?: {
    type: 'visa' | 'mastercard' | 'amex' | 'unionpay' | 'other'
    lastFour: string
  }
  fees: number
  netAmount: number
  createdAt: string
  settledAt?: string
  metadata?: Record<string, unknown>
}

interface Settlement {
  id: string
  processorId: string
  processorName: string
  amount: number
  fees: number
  netAmount: number
  transactionCount: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  bankAccount: string
  reference: string
  scheduledDate: string
  completedDate?: string
}

// Payment Method for merchant configuration
interface PaymentMethod {
  id: string
  name: string
  type: 'card' | 'qr' | 'eft' | 'cash' | 'wallet' | 'voucher' | 'account'
  processorId: string
  processorName: string
  isActive: boolean
  isDefault: boolean
  displayOrder: number
  minAmount: number
  maxAmount: number
  feeOverride?: {
    percentage: number
    fixed: number
  }
  icon: string
  description: string
  createdAt: string
  updatedAt: string
}

// Settlement Report for detailed reporting
interface SettlementReport {
  id: string
  period: string
  startDate: string
  endDate: string
  processorId: string
  processorName: string
  totalTransactions: number
  totalAmount: number
  totalFees: number
  netAmount: number
  status: 'draft' | 'generated' | 'reconciled' | 'paid'
  generatedAt: string
  paidAt?: string
  bankReference?: string
  // Additional fields for the dialog
  startDate?: string
  endDate?: string
}

// Fee Tracking per transaction
interface FeeTransaction {
  id: string
  transactionId: string
  processorId: string
  processorName: string
  grossAmount: number
  feePercentage: number
  feeFixed: number
  totalFee: number
  netAmount: number
  feeType: 'transaction' | 'settlement' | 'chargeback' | 'refund'
  createdAt: string
}

interface RoutingRule {
  id: string
  name: string
  priority: number
  conditions: {
    type: 'amount' | 'method' | 'time' | 'customer' | 'card_type'
    operator: 'equals' | 'greater_than' | 'less_than' | 'contains'
    value: string | number
  }[]
  processorId: string
  processorName: string
  active: boolean
}

interface GatewayStats {
  totalVolume: number
  totalFees: number
  netRevenue: number
  transactionCount: number
  approvalRate: number
  avgTransaction: number
  pendingSettlements: number
  todayVolume: number
}

// ============================================
// SAMPLE DATA - REMOVED - Data now fetched from API
// ============================================

// ============================================
// COMPONENT
// ============================================

export function PaymentGatewayView() {
  // Get merchant data from session
  const { merchantId, isLoading: isLoadingMerchant } = useMerchantData()
  
  const [activeTab, setActiveTab] = useState('dashboard')
  const [processors, setProcessors] = useState<PaymentProcessor[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [routingRules, setRoutingRules] = useState<RoutingRule[]>([])
  const [selectedProcessor, setSelectedProcessor] = useState<PaymentProcessor | null>(null)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [processorDetailOpen, setProcessorDetailOpen] = useState(false)
  const [transactionDetailOpen, setTransactionDetailOpen] = useState(false)
  const [addProcessorOpen, setAddProcessorOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // Payment Methods state
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null)
  const [paymentMethodDialogOpen, setPaymentMethodDialogOpen] = useState(false)
  const [paymentMethodForm, setPaymentMethodForm] = useState<Partial<PaymentMethod>>({
    name: '',
    type: 'card',
    processorId: '',
    isActive: true,
    isDefault: false,
    minAmount: 0,
    maxAmount: 100000,
    description: '',
  })
  
  // Settlement Reports state
  const [settlementReports, setSettlementReports] = useState<SettlementReport[]>([])
  const [selectedSettlementReport, setSelectedSettlementReport] = useState<SettlementReport | null>(null)
  const [settlementReportDialogOpen, setSettlementReportDialogOpen] = useState(false)
  
  // Fee Transactions state
  const [feeTransactions, setFeeTransactions] = useState<FeeTransaction[]>([])

  // Stats
  const stats: GatewayStats = {
    totalVolume: processors.reduce((sum, p) => sum + p.totalVolume, 0),
    totalFees: transactions.reduce((sum, t) => sum + t.fees, 0),
    netRevenue: transactions.reduce((sum, t) => sum + t.netAmount, 0),
    transactionCount: processors.reduce((sum, p) => sum + p.transactionCount, 0),
    approvalRate: transactions.length > 0 ? (transactions.filter(t => t.status === 'approved').length / transactions.length) * 100 : 0,
    avgTransaction: transactions.length > 0 ? transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length : 0,
    pendingSettlements: settlements.filter(s => s.status === 'pending' || s.status === 'processing').reduce((sum, s) => sum + s.netAmount, 0),
    todayVolume: transactions.filter(t => new Date(t.createdAt).toDateString() === new Date().toDateString()).reduce((sum, t) => sum + t.amount, 0),
  }

  // Fetch data from API
  useEffect(() => {
    if (!merchantId) return
    
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch processors
        const processorsRes = await fetch(`/merchant-os/api/payments/processors?merchantId=${merchantId}`)
        if (processorsRes.ok) {
          const data = await processorsRes.json()
          setProcessors(data.processors || [])
        }
        
        // Fetch transactions
        const transactionsRes = await fetch(`/merchant-os/api/payments/transactions?merchantId=${merchantId}`)
        if (transactionsRes.ok) {
          const data = await transactionsRes.json()
          setTransactions(data.transactions || [])
        }
        
        // Fetch settlements
        const settlementsRes = await fetch(`/merchant-os/api/payments/settlements?merchantId=${merchantId}`)
        if (settlementsRes.ok) {
          const data = await settlementsRes.json()
          setSettlements(data.settlements || [])
        }
        
        // Fetch payment methods
        const methodsRes = await fetch(`/merchant-os/api/payments/methods?merchantId=${merchantId}`)
        if (methodsRes.ok) {
          const data = await methodsRes.json()
          setPaymentMethods(data.methods || [])
        }
        
        // Fetch routing rules
        const rulesRes = await fetch(`/merchant-os/api/payments/routing-rules?merchantId=${merchantId}`)
        if (rulesRes.ok) {
          const data = await rulesRes.json()
          setRoutingRules(data.rules || [])
        }
        
        // Fetch fee transactions
        const feesRes = await fetch(`/merchant-os/api/payments/fee-transactions?merchantId=${merchantId}`)
        if (feesRes.ok) {
          const data = await feesRes.json()
          setFeeTransactions(data.fees || [])
        }
        
        // Fetch settlement reports
        const reportsRes = await fetch(`/merchant-os/api/payments/settlement-reports?merchantId=${merchantId}`)
        if (reportsRes.ok) {
          const data = await reportsRes.json()
          setSettlementReports(data.reports || [])
        }
      } catch (error) {
        console.error('Error fetching payment gateway data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [merchantId])

  const formatCurrency = (amount: number) => `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'approved':
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'pending':
      case 'processing':
        return 'bg-amber-100 text-amber-700'
      case 'inactive':
      case 'declined':
      case 'failed':
        return 'bg-red-100 text-red-700'
      case 'refunded':
      case 'cancelled':
        return 'bg-gray-100 text-gray-700'
      case 'error':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'card': return <CreditCard className="h-4 w-4" />
      case 'qr': return <QrCode className="h-4 w-4" />
      case 'ewallet': return <Wallet className="h-4 w-4" />
      case 'bank': return <Building2 className="h-4 w-4" />
      case 'cash': return <Banknote className="h-4 w-4" />
      default: return <Coins className="h-4 w-4" />
    }
  }

  const getProcessorIcon = (type: string) => {
    switch (type) {
      case 'card': return <CreditCard className="h-5 w-5" />
      case 'qr': return <QrCode className="h-5 w-5" />
      case 'ewallet': return <Wallet className="h-5 w-5" />
      case 'bank': return <Building2 className="h-5 w-5" />
      default: return <Coins className="h-5 w-5" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-[#00897B]" />
          <p className="text-[#757575]">Loading payment gateway...</p>
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
              <CreditCard className="h-5 w-5 text-[#00897B]" />
              Payment Gateway
            </h1>
            <p className="text-sm text-[#757575]">Multi-processor payment orchestration & settlement management</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <TestTube className="h-4 w-4 mr-2" />
              Test Mode
            </Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setAddProcessorOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Processor
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-12 bg-transparent">
            <TabsTrigger value="dashboard" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] data-[state=active]:shadow-none rounded-none">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="processors" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] data-[state=active]:shadow-none rounded-none">
              Processors
            </TabsTrigger>
            <TabsTrigger value="payment-methods" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] data-[state=active]:shadow-none rounded-none">
              Payment Methods
            </TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] data-[state=active]:shadow-none rounded-none">
              Transactions
            </TabsTrigger>
            <TabsTrigger value="settlements" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] data-[state=active]:shadow-none rounded-none">
              Settlements
            </TabsTrigger>
            <TabsTrigger value="routing" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] data-[state=active]:shadow-none rounded-none">
              Routing
            </TabsTrigger>
            <TabsTrigger value="fees" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] data-[state=active]:shadow-none rounded-none">
              Fees & Rates
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-[#00897B]">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[#757575] mb-1">Total Volume</p>
                        <p className="text-2xl font-bold text-[#1A1A1A]">{formatCurrency(stats.totalVolume)}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          <span className="text-xs text-green-500">+18.5%</span>
                          <span className="text-xs text-[#757575]">vs last month</span>
                        </div>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-[#E0F2F1] flex items-center justify-center">
                        <Coins className="h-6 w-6 text-[#00897B]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[#757575] mb-1">Transactions</p>
                        <p className="text-2xl font-bold text-[#1A1A1A]">{stats.transactionCount.toLocaleString()}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-xs text-[#757575]">Today: {transactions.length}</span>
                        </div>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                        <Activity className="h-6 w-6 text-blue-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[#757575] mb-1">Approval Rate</p>
                        <p className="text-2xl font-bold text-[#1A1A1A]">{stats.approvalRate}%</p>
                        <div className="flex items-center gap-1 mt-1">
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          <span className="text-xs text-green-500">+2.1%</span>
                        </div>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[#757575] mb-1">Pending Settlements</p>
                        <p className="text-2xl font-bold text-[#1A1A1A]">{formatCurrency(stats.pendingSettlements)}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-amber-500" />
                          <span className="text-xs text-amber-600">Next: Tomorrow</span>
                        </div>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
                        <Clock className="h-6 w-6 text-amber-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Processor Volume & Recent Transactions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Processor Volume */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Volume by Processor</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {processors.filter(p => p.status === 'active').map(processor => {
                        const percentage = (processor.totalVolume / stats.totalVolume) * 100
                        return (
                          <div key={processor.id} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                {getProcessorIcon(processor.type)}
                                <span className="font-medium">{processor.name}</span>
                              </div>
                              <div className="text-right">
                                <span className="font-medium">{formatCurrency(processor.totalVolume)}</span>
                                <span className="text-[#757575] ml-2">({percentage.toFixed(1)}%)</span>
                              </div>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Transactions */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
                      <Button variant="ghost" size="sm" className="text-xs text-[#00897B]" onClick={() => setActiveTab('transactions')}>
                        View All
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {transactions.slice(0, 6).map(txn => (
                        <div key={txn.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer" onClick={() => {
                          setSelectedTransaction(txn)
                          setTransactionDetailOpen(true)
                        }}>
                          <div className="w-10 h-10 rounded-full bg-[#F5F5F5] flex items-center justify-center">
                            {getMethodIcon(txn.method)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-[#1A1A1A]">{txn.customerInfo?.name || 'Walk-in'}</p>
                              <Badge className={getStatusColor(txn.status)} variant="outline">
                                {txn.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-[#757575]">{txn.processorName} • {txn.id}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-green-600">+{formatCurrency(txn.amount)}</p>
                            <p className="text-xs text-[#757575]">{new Date(txn.createdAt).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* GroAI Payment Insights */}
              <Card className="border-l-4 border-l-[#00897B]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Bot className="h-4 w-4 text-[#00897B]" />
                    GroAI Payment Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { type: 'opportunity', title: 'Cost Savings Available', description: 'Switch EFT transactions to Ozow to save R1,245/month in fees.', action: 'Review Routing', priority: 'high' },
                      { type: 'alert', title: 'High Decline Rate', description: 'Yoco decline rate increased to 4.2%. Consider routing high-value to Paystack.', action: 'Adjust Rules', priority: 'high' },
                      { type: 'trend', title: 'QR Payments Growing', description: 'Gropay QR volume up 34% this month. Consider promoting QR for lower fees.', action: 'View Report', priority: 'medium' },
                      { type: 'recommendation', title: 'Settlement Optimization', description: 'Consolidating settlements could improve cash flow by R15,000/week.', action: 'Learn More', priority: 'low' },
                    ].map((insight, i) => (
                      <div key={i} className={`p-3 rounded-lg border ${
                        insight.priority === 'high' ? 'border-red-200 bg-red-50' :
                        insight.priority === 'medium' ? 'border-amber-200 bg-amber-50' :
                        'border-green-200 bg-green-50'
                      }`}>
                        <div className="flex items-start gap-3">
                          {insight.type === 'opportunity' && <Lightbulb className="h-5 w-5 text-amber-600" />}
                          {insight.type === 'alert' && <AlertCircle className="h-5 w-5 text-red-600" />}
                          {insight.type === 'trend' && <TrendingUp className="h-5 w-5 text-blue-600" />}
                          {insight.type === 'recommendation' && <Target className="h-5 w-5 text-green-600" />}
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{insight.title}</h4>
                            <p className="text-xs text-[#757575] mt-1">{insight.description}</p>
                            <Button size="sm" variant="outline" className="mt-2 h-7 text-xs">
                              {insight.action}
                              <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Fee Breakdown */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Fee Breakdown (This Month)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-red-50 rounded-lg text-center">
                      <p className="text-xs text-[#757575] mb-1">Total Fees Paid</p>
                      <p className="text-xl font-bold text-red-600">{formatCurrency(stats.totalFees)}</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg text-center">
                      <p className="text-xs text-[#757575] mb-1">Avg Fee Rate</p>
                      <p className="text-xl font-bold text-blue-600">2.1%</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg text-center">
                      <p className="text-xs text-[#757575] mb-1">Potential Savings</p>
                      <p className="text-xl font-bold text-green-600">{formatCurrency(1245)}</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg text-center">
                      <p className="text-xs text-[#757575] mb-1">Net Revenue</p>
                      <p className="text-xl font-bold text-purple-600">{formatCurrency(stats.netRevenue)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Processors Tab */}
          {activeTab === 'processors' && (
            <div className="space-y-6">
              {/* Active Processors */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Active Processors</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {processors.filter(p => p.status === 'active').map(processor => (
                    <Card 
                      key={processor.id} 
                      className="cursor-pointer hover:border-[#00897B] hover:shadow-md transition-all"
                      onClick={() => {
                        setSelectedProcessor(processor)
                        setProcessorDetailOpen(true)
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-[#E0F2F1] flex items-center justify-center text-[#00897B]">
                              {getProcessorIcon(processor.type)}
                            </div>
                            <div>
                              <p className="font-medium text-[#1A1A1A]">{processor.name}</p>
                              <p className="text-xs text-[#757575]">{processor.supportedMethods.length} payment methods</p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(processor.status)}>
                            {processor.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-[#757575]">Volume</p>
                            <p className="font-medium">{formatCurrency(processor.totalVolume)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-[#757575]">Transactions</p>
                            <p className="font-medium">{processor.transactionCount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-[#757575]">Fee Rate</p>
                            <p className="font-medium">{processor.fees.percentage}%{processor.fees.fixed > 0 ? ` + R${processor.fees.fixed}` : ''}</p>
                          </div>
                          <div>
                            <p className="text-xs text-[#757575]">Settlement</p>
                            <p className="font-medium">T+{processor.settlementDays}</p>
                          </div>
                        </div>
                        
                        <Separator className="my-3" />
                        
                        <div className="flex items-center justify-between">
                          <div className="flex gap-1">
                            {processor.supportedMethods.slice(0, 4).map(method => (
                              <Badge key={method} variant="outline" className="text-[10px]">{method}</Badge>
                            ))}
                          </div>
                          <Button variant="ghost" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Pending/Inactive Processors */}
              {processors.filter(p => p.status !== 'active').length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-4">Pending Setup</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {processors.filter(p => p.status !== 'active').map(processor => (
                      <Card key={processor.id} className="border-dashed">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                              {getProcessorIcon(processor.type)}
                            </div>
                            <div>
                              <p className="font-medium text-[#1A1A1A]">{processor.name}</p>
                              <Badge className={getStatusColor(processor.status)}>
                                {processor.status}
                              </Badge>
                            </div>
                          </div>
                          <Button className="w-full bg-[#00897B] hover:bg-[#00695C]">
                            <Link2 className="h-4 w-4 mr-2" />
                            Connect
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Payment Methods Tab */}
          {activeTab === 'payment-methods' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Payment Methods</h2>
                  <p className="text-sm text-[#757575]">Configure payment methods available at checkout</p>
                </div>
                <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => {
                  setSelectedPaymentMethod(null)
                  setPaymentMethodForm({
                    name: '',
                    type: 'card',
                    processorId: '',
                    isActive: true,
                    isDefault: false,
                    minAmount: 0,
                    maxAmount: 100000,
                    description: '',
                  })
                  setPaymentMethodDialogOpen(true)
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Method
                </Button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-[#757575]">Active Methods</p>
                    <p className="text-2xl font-bold text-green-600">{paymentMethods.filter(m => m.isActive).length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-[#757575]">Inactive</p>
                    <p className="text-2xl font-bold text-gray-400">{paymentMethods.filter(m => !m.isActive).length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-[#757575]">Default Method</p>
                    <p className="text-sm font-bold text-[#00897B]">{paymentMethods.find(m => m.isDefault)?.name || 'None'}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-[#757575]">Processors Used</p>
                    <p className="text-2xl font-bold">{new Set(paymentMethods.map(m => m.processorId)).size}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Payment Methods Table */}
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Processor</TableHead>
                        <TableHead>Amount Range</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Default</TableHead>
                        <TableHead className="w-24">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentMethods.sort((a, b) => a.displayOrder - b.displayOrder).map((method) => (
                        <TableRow key={method.id} className={!method.isActive ? 'opacity-50' : ''}>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">{method.displayOrder}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getMethodIcon(method.type)}
                              <div>
                                <p className="font-medium">{method.name}</p>
                                <p className="text-xs text-[#757575]">{method.description}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">{method.type}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{method.processorName}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{formatCurrency(method.minAmount)} - {formatCurrency(method.maxAmount)}</span>
                          </TableCell>
                          <TableCell>
                            <Badge className={method.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                              {method.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {method.isDefault && (
                              <Badge className="bg-[#00897B] text-white">Default</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => {
                                setSelectedPaymentMethod(method)
                                setPaymentMethodForm(method)
                                setPaymentMethodDialogOpen(true)
                              }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-500" onClick={() => {
                                setPaymentMethods(prev => prev.filter(m => m.id !== method.id))
                              }}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex gap-4 items-center">
                <div className="relative flex-1 max-w-sm">
                  <Input placeholder="Search transactions..." />
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="declined">Declined</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="all">
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Processor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Processors</SelectItem>
                    {processors.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  More Filters
                </Button>
              </div>

              {/* Transaction Table */}
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Transaction</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Processor</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Method</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Fee</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Time</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-[#757575]">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {transactions.map(txn => (
                          <tr key={txn.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => {
                            setSelectedTransaction(txn)
                            setTransactionDetailOpen(true)
                          }}>
                            <td className="px-4 py-3">
                              <div>
                                <p className="text-sm font-medium">{txn.id}</p>
                                <p className="text-xs text-[#757575]">{txn.customerInfo?.name || 'Walk-in'}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">{txn.processorName}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {getMethodIcon(txn.method)}
                                <span className="text-sm capitalize">{txn.method}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm font-medium">{formatCurrency(txn.amount)}</td>
                            <td className="px-4 py-3 text-sm text-red-600">-{formatCurrency(txn.fees)}</td>
                            <td className="px-4 py-3">
                              <Badge className={getStatusColor(txn.status)}>{txn.status}</Badge>
                            </td>
                            <td className="px-4 py-3 text-sm text-[#757575]">
                              {new Date(txn.createdAt).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Settlements Tab */}
          {activeTab === 'settlements' && (
            <div className="space-y-6">
              {/* Settlement Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-amber-500">
                  <CardContent className="p-4">
                    <p className="text-xs text-[#757575] mb-1">Pending Settlements</p>
                    <p className="text-2xl font-bold text-[#1A1A1A]">{formatCurrency(stats.pendingSettlements)}</p>
                    <p className="text-xs text-amber-600 mt-1">{settlements.filter(s => s.status === 'pending').length} batches pending</p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <p className="text-xs text-[#757575] mb-1">Next Settlement</p>
                    <p className="text-2xl font-bold text-[#1A1A1A]">Tomorrow</p>
                    <p className="text-xs text-blue-600 mt-1">Estimated: {formatCurrency(45000)}</p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <p className="text-xs text-[#757575] mb-1">Settled This Month</p>
                    <p className="text-2xl font-bold text-[#1A1A1A]">{formatCurrency(890000)}</p>
                    <p className="text-xs text-green-600 mt-1">12 batches completed</p>
                  </CardContent>
                </Card>
              </div>

              {/* Settlement Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Settlement Schedule</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Reference</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Processor</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Transactions</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Gross Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Fees</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Net Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Bank Account</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {settlements.map(settlement => (
                          <tr key={settlement.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium">{settlement.reference}</td>
                            <td className="px-4 py-3 text-sm">{settlement.processorName}</td>
                            <td className="px-4 py-3 text-sm">{settlement.transactionCount}</td>
                            <td className="px-4 py-3 text-sm">{formatCurrency(settlement.amount)}</td>
                            <td className="px-4 py-3 text-sm text-red-600">-{formatCurrency(settlement.fees)}</td>
                            <td className="px-4 py-3 text-sm font-medium text-green-600">{formatCurrency(settlement.netAmount)}</td>
                            <td className="px-4 py-3 text-sm">{settlement.bankAccount}</td>
                            <td className="px-4 py-3">
                              <Badge className={getStatusColor(settlement.status)}>{settlement.status}</Badge>
                            </td>
                            <td className="px-4 py-3 text-sm text-[#757575]">
                              {new Date(settlement.scheduledDate).toLocaleDateString('en-ZA')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Routing Tab */}
          {activeTab === 'routing' && (
            <div className="space-y-6">
              {/* Routing Overview */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Transaction Routing Rules</h2>
                  <p className="text-sm text-[#757575]">Configure intelligent routing to optimize costs and approval rates</p>
                </div>
                <Button className="bg-[#00897B] hover:bg-[#00695C]">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rule
                </Button>
              </div>

              {/* Routing Rules */}
              <div className="space-y-4">
                {routingRules.sort((a, b) => a.priority - b.priority).map(rule => (
                  <Card key={rule.id} className={rule.active ? '' : 'opacity-60'}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[#E0F2F1] flex items-center justify-center text-[#00897B] font-bold">
                            {rule.priority}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{rule.name}</h3>
                              <Badge variant="outline" className={rule.active ? 'border-green-300 text-green-700' : 'border-gray-300 text-gray-500'}>
                                {rule.active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <p className="text-sm text-[#757575]">
                              Route to <span className="font-medium text-[#1A1A1A]">{rule.processorName}</span> when:
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch checked={rule.active} />
                          <Button variant="ghost" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-4 ml-14 flex flex-wrap gap-2">
                        {rule.conditions.map((condition, i) => (
                          <Badge key={i} variant="outline" className="bg-gray-50">
                            {condition.type} {condition.operator} {condition.value}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Default Fallback */}
              <Card className="border-dashed">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold">
                      ∞
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">Default Fallback</h3>
                      <p className="text-sm text-[#757575]">
                        Route to <span className="font-medium text-[#1A1A1A]">Yoco</span> when no other rules match
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Fees Tab */}
          {activeTab === 'fees' && (
            <div className="space-y-6">
              {/* Fee Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Processor Fee Comparison</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Processor</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Card Rate</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">QR Rate</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">EFT Rate</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Settlement</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#757575]">Best For</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {processors.filter(p => p.status === 'active').map(p => (
                          <tr key={p.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {getProcessorIcon(p.type)}
                                <span className="font-medium">{p.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">{p.fees.percentage}%{p.fees.fixed > 0 ? ` + R${p.fees.fixed}` : ''}</td>
                            <td className="px-4 py-3 text-sm">{p.id === 'gropay' ? '1.25% + R0.50' : '-'}</td>
                            <td className="px-4 py-3 text-sm">{p.id === 'ozow' ? '1.5%' : '-'}</td>
                            <td className="px-4 py-3 text-sm">T+{p.settlementDays}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {p.id === 'yoco' && <Badge variant="outline" className="text-[10px]">Card Present</Badge>}
                                {p.id === 'payfast' && <Badge variant="outline" className="text-[10px]">Online</Badge>}
                                {p.id === 'paystack' && <Badge variant="outline" className="text-[10px]">High Value</Badge>}
                                {p.id === 'ozow' && <Badge variant="outline" className="text-[10px]">Instant EFT</Badge>}
                                {p.id === 'gropay' && <Badge variant="outline" className="text-[10px]">QR Payments</Badge>}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Fee Calculator */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Fee Calculator</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Transaction Amount</label>
                      <Input type="number" placeholder="0.00" className="text-lg" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Payment Method</label>
                      <Select defaultValue="card">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="card">Card Payment</SelectItem>
                          <SelectItem value="qr">QR Payment</SelectItem>
                          <SelectItem value="eft">Instant EFT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Recommended Processor</label>
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-lg font-bold text-green-700">Paystack</p>
                        <p className="text-sm text-green-600">Fee: R15.50 (1.55%)</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Processor Detail Dialog */}
      <Dialog open={processorDetailOpen} onOpenChange={setProcessorDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          {selectedProcessor && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-[#E0F2F1] flex items-center justify-center text-[#00897B]">
                    {getProcessorIcon(selectedProcessor.type)}
                  </div>
                  {selectedProcessor.name}
                </DialogTitle>
                <DialogDescription>
                  {selectedProcessor.type.toUpperCase()} Processor • {selectedProcessor.status}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-[#757575]">Fee Rate</p>
                    <p className="text-lg font-bold">{selectedProcessor.fees.percentage}%{selectedProcessor.fees.fixed > 0 ? ` + R${selectedProcessor.fees.fixed}` : ''}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-[#757575]">Settlement</p>
                    <p className="text-lg font-bold">T+{selectedProcessor.settlementDays}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-[#757575]">Min Transaction</p>
                    <p className="text-lg font-bold">{formatCurrency(selectedProcessor.minTransaction)}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-[#757575]">Max Transaction</p>
                    <p className="text-lg font-bold">{formatCurrency(selectedProcessor.maxTransaction)}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-[#757575] mb-2">Supported Methods</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProcessor.supportedMethods.map(method => (
                      <Badge key={method} variant="outline">{method}</Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-[#757575] mb-2">Countries</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProcessor.countries.map(country => (
                      <Badge key={country} className="bg-[#E0F2F1] text-[#00897B]">{country}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setProcessorDetailOpen(false)}>Close</Button>
                <Button className="bg-[#00897B] hover:bg-[#00695C]">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Transaction Detail Dialog */}
      <Dialog open={transactionDetailOpen} onOpenChange={setTransactionDetailOpen}>
        <DialogContent className="sm:max-w-md">
          {selectedTransaction && (
            <>
              <DialogHeader>
                <DialogTitle>Transaction Details</DialogTitle>
                <DialogDescription>{selectedTransaction.id}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="p-4 bg-[#E0F2F1] rounded-lg text-center">
                  <p className="text-3xl font-bold text-[#00897B]">{formatCurrency(selectedTransaction.amount)}</p>
                  <Badge className={getStatusColor(selectedTransaction.status)}>{selectedTransaction.status}</Badge>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#757575]">Processor</span>
                    <span className="font-medium">{selectedTransaction.processorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#757575]">Method</span>
                    <span className="font-medium capitalize">{selectedTransaction.method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#757575]">Reference</span>
                    <span className="font-medium">{selectedTransaction.reference}</span>
                  </div>
                  {selectedTransaction.cardInfo && (
                    <div className="flex justify-between">
                      <span className="text-[#757575]">Card</span>
                      <span className="font-medium capitalize">{selectedTransaction.cardInfo.type} ****{selectedTransaction.cardInfo.lastFour}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-[#757575]">Fee</span>
                    <span className="font-medium text-red-600">-{formatCurrency(selectedTransaction.fees)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#757575]">Net Amount</span>
                    <span className="font-bold text-green-600">{formatCurrency(selectedTransaction.netAmount)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-[#757575]">Customer</span>
                    <span className="font-medium">{selectedTransaction.customerInfo?.name || 'Walk-in'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#757575]">Time</span>
                    <span className="font-medium">{new Date(selectedTransaction.createdAt).toLocaleString('en-ZA')}</span>
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setTransactionDetailOpen(false)}>Close</Button>
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Receipt
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Processor Dialog */}
      <Dialog open={addProcessorOpen} onOpenChange={setAddProcessorOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Payment Processor</DialogTitle>
            <DialogDescription>
              Connect a new payment processor to your account
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'Yoco', type: 'card', status: 'active' },
                { name: 'PayFast', type: 'ewallet', status: 'active' },
                { name: 'Paystack', type: 'card', status: 'active' },
                { name: 'Ozow', type: 'bank', status: 'active' },
                { name: 'Peach Payments', type: 'card', status: 'pending' },
                { name: 'iVeri', type: 'card', status: 'pending' },
              ].filter(p => !processors.find(existing => existing.name === p.name)).map(processor => (
                <Card key={processor.name} className="cursor-pointer hover:border-[#00897B]">
                  <CardContent className="p-4 flex items-center gap-3">
                    {getProcessorIcon(processor.type)}
                    <div>
                      <p className="font-medium">{processor.name}</p>
                      <p className="text-xs text-[#757575] capitalize">{processor.type}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddProcessorOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Method Dialog */}
      <Dialog open={paymentMethodDialogOpen} onOpenChange={setPaymentMethodDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedPaymentMethod ? 'Edit Payment Method' : 'Add Payment Method'}</DialogTitle>
            <DialogDescription>
              Configure a payment method for checkout
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Method Name</Label>
                <Input 
                  placeholder="e.g., Card Payment" 
                  value={paymentMethodForm.name || ''}
                  onChange={(e) => setPaymentMethodForm(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Type</Label>
                <Select 
                  value={paymentMethodForm.type || 'card'} 
                  onValueChange={(val) => setPaymentMethodForm(prev => ({ ...prev, type: val as PaymentMethod['type'] }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="qr">QR Code</SelectItem>
                    <SelectItem value="eft">EFT</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="wallet">Wallet</SelectItem>
                    <SelectItem value="voucher">Voucher</SelectItem>
                    <SelectItem value="account">Account</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Processor</Label>
                <Select 
                  value={paymentMethodForm.processorId || ''} 
                  onValueChange={(val) => {
                    const proc = processors.find(p => p.id === val)
                    setPaymentMethodForm(prev => ({ 
                      ...prev, 
                      processorId: val,
                      processorName: proc?.name || ''
                    }))
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select processor" />
                  </SelectTrigger>
                  <SelectContent>
                    {processors.filter(p => p.status === 'active').map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                    <SelectItem value="internal">Internal (Cash/Manual)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Display Order</Label>
                <Input 
                  type="number" 
                  value={paymentMethodForm.displayOrder || 1}
                  onChange={(e) => setPaymentMethodForm(prev => ({ ...prev, displayOrder: Number(e.target.value) }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Min Amount (R)</Label>
                <Input 
                  type="number" 
                  value={paymentMethodForm.minAmount || 0}
                  onChange={(e) => setPaymentMethodForm(prev => ({ ...prev, minAmount: Number(e.target.value) }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Max Amount (R)</Label>
                <Input 
                  type="number" 
                  value={paymentMethodForm.maxAmount || 100000}
                  onChange={(e) => setPaymentMethodForm(prev => ({ ...prev, maxAmount: Number(e.target.value) }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Description</Label>
              <Textarea 
                placeholder="Brief description of this payment method"
                value={paymentMethodForm.description || ''}
                onChange={(e) => setPaymentMethodForm(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch 
                  checked={paymentMethodForm.isActive ?? true}
                  onCheckedChange={(checked) => setPaymentMethodForm(prev => ({ ...prev, isActive: checked }))}
                />
                <Label className="text-sm">Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={paymentMethodForm.isDefault ?? false}
                  onCheckedChange={(checked) => setPaymentMethodForm(prev => ({ ...prev, isDefault: checked }))}
                />
                <Label className="text-sm">Default</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentMethodDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => {
              if (selectedPaymentMethod) {
                // Edit existing
                setPaymentMethods(prev => prev.map(m => 
                  m.id === selectedPaymentMethod.id 
                    ? { ...m, ...paymentMethodForm, updatedAt: new Date().toISOString() } as PaymentMethod
                    : m
                ))
              } else {
                // Add new
                const newMethod: PaymentMethod = {
                  id: `pm-${Date.now()}`,
                  name: paymentMethodForm.name || '',
                  type: paymentMethodForm.type || 'card',
                  processorId: paymentMethodForm.processorId || '',
                  processorName: paymentMethodForm.processorName || '',
                  isActive: paymentMethodForm.isActive ?? true,
                  isDefault: paymentMethodForm.isDefault ?? false,
                  displayOrder: paymentMethodForm.displayOrder || paymentMethods.length + 1,
                  minAmount: paymentMethodForm.minAmount || 0,
                  maxAmount: paymentMethodForm.maxAmount || 100000,
                  icon: paymentMethodForm.type || 'credit-card',
                  description: paymentMethodForm.description || '',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
                setPaymentMethods(prev => [...prev, newMethod])
              }
              setPaymentMethodDialogOpen(false)
            }}>
              <Save className="h-4 w-4 mr-2" />
              {selectedPaymentMethod ? 'Update' : 'Add'} Method
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settlement Report Dialog */}
      <Dialog open={settlementReportDialogOpen} onOpenChange={setSettlementReportDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          {selectedSettlementReport && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Settlement Report - {selectedSettlementReport.period}
                  <Badge className={getStatusColor(selectedSettlementReport.status)}>
                    {selectedSettlementReport.status}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  {selectedSettlementReport.processorName} • {selectedSettlementReport.totalTransactions} transactions
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <p className="text-xs text-[#757575]">Total Amount</p>
                    <p className="text-lg font-bold text-blue-600">{formatCurrency(selectedSettlementReport.totalAmount)}</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg text-center">
                    <p className="text-xs text-[#757575]">Total Fees</p>
                    <p className="text-lg font-bold text-red-600">{formatCurrency(selectedSettlementReport.totalFees)}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg text-center">
                    <p className="text-xs text-[#757575]">Net Amount</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(selectedSettlementReport.netAmount)}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-xs text-[#757575]">Transactions</p>
                    <p className="text-lg font-bold">{selectedSettlementReport.totalTransactions}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-[#757575]">Period</p>
                    <p className="font-medium">{new Date(selectedSettlementReport.startDate).toLocaleDateString('en-ZA')} - {new Date(selectedSettlementReport.endDate).toLocaleDateString('en-ZA')}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-[#757575]">Generated</p>
                    <p className="font-medium">{new Date(selectedSettlementReport.generatedAt).toLocaleString('en-ZA')}</p>
                  </div>
                  {selectedSettlementReport.bankReference && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-[#757575]">Bank Reference</p>
                      <p className="font-medium">{selectedSettlementReport.bankReference}</p>
                    </div>
                  )}
                  {selectedSettlementReport.paidAt && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-xs text-green-600">Paid At</p>
                      <p className="font-medium text-green-700">{new Date(selectedSettlementReport.paidAt).toLocaleString('en-ZA')}</p>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSettlementReportDialogOpen(false)}>Close</Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PaymentGatewayView
