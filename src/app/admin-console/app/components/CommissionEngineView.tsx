'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import {
  DollarSign,
  Calculator,
  Users,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  Download,
  RefreshCw,
  Plus,
  Eye,
  ChevronRight,
  Award,
  Percent,
  CreditCard,
  Banknote,
  PieChart,
  BarChart3,
  Settings,
  Loader2,
  AlertTriangle,
  Filter,
  FileText,
  Zap,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Play,
  Pause,
  Edit,
  Trash2,
  Copy,
  CalendarDays,
  Clock4,
  Building2,
  Timer,
  Target,
  Gift,
  Network,
  ChevronDown,
  Info,
  Sliders
} from 'lucide-react'

// Types
interface Agent {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  tier: string
  status: string
  totalReferrals: number
  activeReferrals: number
  totalEarnings: number
  pendingEarnings: number
  paidEarnings: number
  commissionRate: number
  createdAt: Date
}

interface CommissionRule {
  id: string
  ruleName: string
  ruleType: string
  minAmount: number
  maxAmount: number | null
  commissionRate: number
  fixedAmount: number
  capAmount: number | null
  bronzeMultiplier: number
  silverMultiplier: number
  goldMultiplier: number
  platinumMultiplier: number
  active: boolean
  validFrom: Date | null
  validTo: Date | null
}

interface CommissionPayout {
  id: string
  payoutRef: string
  agentId: string
  periodStart: string
  periodEnd: string
  totalCommission: number
  totalAdjustments: number
  netAmount: number
  signupCommissions: number
  transactionCommissions: number
  overrideCommissions: number
  bonusAmount: number
  status: string
  paidAt: Date | null
  paymentMethod: string | null
  bankName: string | null
  accountNumber: string | null
  createdAt: Date
}

interface CommissionDispute {
  id: string
  commissionId: string
  agentId: string
  agentName: string
  amount: number
  reason: string
  status: string
  createdAt: Date
}

interface PerformanceMetric {
  agentId: string
  agentName: string
  tier: string
  totalCommissions: number
  totalReferrals: number
  conversionRate: number
  avgCommissionValue: number
  trend: number
}

// Tier configuration
const tierConfigs = [
  { tier: 'bronze', rate: 5, minReferrals: 0, color: '#CD7F32', label: 'Bronze' },
  { tier: 'silver', rate: 7, minReferrals: 10, color: '#C0C0C0', label: 'Silver' },
  { tier: 'gold', rate: 10, minReferrals: 25, color: '#FFD700', label: 'Gold' },
  { tier: 'platinum', rate: 12, minReferrals: 50, color: '#E5E4E2', label: 'Platinum' }
]

export default function CommissionEngineView() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Data states
  const [agents, setAgents] = useState<Agent[]>([])
  const [rules, setRules] = useState<CommissionRule[]>([])
  const [payouts, setPayouts] = useState<CommissionPayout[]>([])
  const [disputes, setDisputes] = useState<CommissionDispute[]>([])
  const [performance, setPerformance] = useState<PerformanceMetric[]>([])
  
  // Summary stats
  const [summary, setSummary] = useState({
    totalPending: 0,
    totalApproved: 0,
    totalPaid: 0,
    totalAgents: 0,
    activeAgents: 0,
    thisMonth: { amount: 0, count: 0 },
    lastMonth: { amount: 0, count: 0 }
  })

  // Dialog states
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false)
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false)
  const [calculatorDialogOpen, setCalculatorDialogOpen] = useState(false)
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  
  // Selected items
  const [selectedRule, setSelectedRule] = useState<CommissionRule | null>(null)
  const [selectedPayout, setSelectedPayout] = useState<CommissionPayout | null>(null)
  const [selectedDispute, setSelectedDispute] = useState<CommissionDispute | null>(null)
  
  // Form states
  const [processing, setProcessing] = useState(false)
  
  // Calculator states
  const [calcAgentId, setCalcAgentId] = useState('')
  const [calcAmount, setCalcAmount] = useState('')
  const [calcType, setCalcType] = useState('signup')
  const [calcResult, setCalcResult] = useState<{
    baseCommission: number
    tierMultiplier: number
    finalCommission: number
    breakdown: { label: string; amount: number }[]
  } | null>(null)

  // Rule form
  const [ruleForm, setRuleForm] = useState({
    ruleName: '',
    ruleType: 'signup',
    minAmount: 0,
    maxAmount: 0,
    commissionRate: 5,
    fixedAmount: 0,
    capAmount: 0,
    bronzeMultiplier: 1.0,
    silverMultiplier: 1.25,
    goldMultiplier: 1.5,
    platinumMultiplier: 2.0,
    active: true
  })

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      // Fetch agents
      const agentsRes = await fetch('/api/agents?limit=100')
      if (agentsRes.ok) {
        const agentsData = await agentsRes.json()
        setAgents(agentsData.agents || [])
      }

      // Fetch rules
      const rulesRes = await fetch('/api/admin/commissions/rules')
      if (rulesRes.ok) {
        const rulesData = await rulesRes.json()
        setRules(rulesData.rules || [])
      }

      // Fetch payouts
      const payoutsRes = await fetch('/api/admin/commissions/payouts')
      if (payoutsRes.ok) {
        const payoutsData = await payoutsRes.json()
        setPayouts(payoutsData.payouts || [])
      }

      // Set summary from agents
      setSummary(prev => ({
        ...prev,
        totalAgents: agents.length,
        activeAgents: agents.filter(a => a.status === 'active').length
      }))

      // Generate demo disputes
      setDisputes([
        { id: 'dsp-001', commissionId: 'comm-005', agentId: 'agent-001', agentName: 'Thabo Molefe', amount: 250, reason: 'Incorrect tier multiplier applied', status: 'open', createdAt: new Date() },
        { id: 'dsp-002', commissionId: 'comm-012', agentId: 'agent-003', agentName: 'Johan van der Berg', amount: 180, reason: 'Referral not credited correctly', status: 'investigating', createdAt: new Date() }
      ])

      // Generate demo performance
      setPerformance([
        { agentId: 'agent-001', agentName: 'Nomsa Dlamini', tier: 'platinum', totalCommissions: 12500, totalReferrals: 52, conversionRate: 78, avgCommissionValue: 240, trend: 15 },
        { agentId: 'agent-002', agentName: 'Thabo Molefe', tier: 'gold', totalCommissions: 8500, totalReferrals: 34, conversionRate: 65, avgCommissionValue: 250, trend: 8 },
        { agentId: 'agent-003', agentName: 'Priya Naidoo', tier: 'gold', totalCommissions: 7200, totalReferrals: 28, conversionRate: 72, avgCommissionValue: 257, trend: -5 },
        { agentId: 'agent-004', agentName: 'Johan van der Berg', tier: 'silver', totalCommissions: 4500, totalReferrals: 15, conversionRate: 60, avgCommissionValue: 300, trend: 22 },
        { agentId: 'agent-005', agentName: 'Sipho Zulu', tier: 'bronze', totalCommissions: 2200, totalReferrals: 8, conversionRate: 55, avgCommissionValue: 275, trend: 10 }
      ])

    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load data')
    }
  }, [agents.length])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await fetchData()
      setLoading(false)
    }
    loadData()
  }, [])

  // Save rule
  const saveRule = async () => {
    setProcessing(true)
    try {
      const method = selectedRule ? 'PUT' : 'POST'
      const body = selectedRule 
        ? { ...ruleForm, id: selectedRule.id }
        : ruleForm

      const response = await fetch('/api/admin/commissions/rules', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        toast.success(selectedRule ? 'Rule updated' : 'Rule created')
        setRuleDialogOpen(false)
        fetchData()
        resetRuleForm()
      } else {
        toast.error('Failed to save rule')
      }
    } catch {
      toast.error('Failed to save rule')
    }
    setProcessing(false)
  }

  // Delete rule
  const deleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return
    
    try {
      const response = await fetch(`/api/admin/commissions/rules?id=${ruleId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Rule deleted')
        fetchData()
      }
    } catch {
      toast.error('Failed to delete rule')
    }
  }

  // Calculate commission
  const calculateCommission = async () => {
    if (!calcAgentId || !calcAmount) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      const response = await fetch('/api/admin/commissions/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: calcAgentId,
          amount: parseFloat(calcAmount),
          type: calcType
        })
      })

      if (response.ok) {
        const data = await response.json()
        setCalcResult(data)
      }
    } catch {
      toast.error('Calculation failed')
    }
  }

  // Process payout
  const processPayout = async (payoutId: string) => {
    setProcessing(true)
    try {
      const response = await fetch('/api/admin/commissions/payouts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payoutId,
          action: 'process'
        })
      })

      if (response.ok) {
        toast.success('Payout processed successfully')
        fetchData()
      }
    } catch {
      toast.error('Failed to process payout')
    }
    setProcessing(false)
  }

  // Export to CSV
  const exportToCSV = (type: 'payouts' | 'performance' | 'rules') => {
    let csv = ''
    let filename = ''

    if (type === 'payouts') {
      csv = 'Reference,Agent,Period,Amount,Status,Created\n'
      payouts.forEach(p => {
        csv += `${p.payoutRef},${p.agentId},${p.periodStart} to ${p.periodEnd},${p.netAmount},${p.status},${new Date(p.createdAt).toLocaleDateString()}\n`
      })
      filename = 'payouts-export.csv'
    } else if (type === 'performance') {
      csv = 'Agent,Tier,Total Commissions,Referrals,Conversion Rate,Avg Value,Trend\n'
      performance.forEach(p => {
        csv += `${p.agentName},${p.tier},${p.totalCommissions},${p.totalReferrals},${p.conversionRate}%,${p.avgCommissionValue},${p.trend}%\n`
      })
      filename = 'performance-export.csv'
    } else if (type === 'rules') {
      csv = 'Rule Name,Type,Rate,Fixed Amount,Bronze Mult,Silver Mult,Gold Mult,Platinum Mult,Status\n'
      rules.forEach(r => {
        csv += `${r.ruleName},${r.ruleType},${r.commissionRate}%,${r.fixedAmount},${r.bronzeMultiplier},${r.silverMultiplier},${r.goldMultiplier},${r.platinumMultiplier},${r.active ? 'Active' : 'Inactive'}\n`
      })
      filename = 'rules-export.csv'
    }

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Export completed')
  }

  // Reset rule form
  const resetRuleForm = () => {
    setRuleForm({
      ruleName: '',
      ruleType: 'signup',
      minAmount: 0,
      maxAmount: 0,
      commissionRate: 5,
      fixedAmount: 0,
      capAmount: 0,
      bronzeMultiplier: 1.0,
      silverMultiplier: 1.25,
      goldMultiplier: 1.5,
      platinumMultiplier: 2.0,
      active: true
    })
    setSelectedRule(null)
  }

  // Edit rule
  const editRule = (rule: CommissionRule) => {
    setSelectedRule(rule)
    setRuleForm({
      ruleName: rule.ruleName,
      ruleType: rule.ruleType,
      minAmount: rule.minAmount,
      maxAmount: rule.maxAmount || 0,
      commissionRate: rule.commissionRate,
      fixedAmount: rule.fixedAmount,
      capAmount: rule.capAmount || 0,
      bronzeMultiplier: rule.bronzeMultiplier,
      silverMultiplier: rule.silverMultiplier,
      goldMultiplier: rule.goldMultiplier,
      platinumMultiplier: rule.platinumMultiplier,
      active: rule.active
    })
    setRuleDialogOpen(true)
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  // Format date
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-ZA', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      approved: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      processing: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      paid: 'bg-green-500/20 text-green-400 border-green-500/30',
      failed: 'bg-red-500/20 text-red-400 border-red-500/30',
      cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
      open: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      investigating: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      resolved: 'bg-green-500/20 text-green-400 border-green-500/30'
    }
    return <Badge className={`${styles[status] || 'bg-gray-500/20 text-gray-400'} border capitalize`}>
      {status}
    </Badge>
  }

  // Get tier badge
  const getTierBadge = (tier: string) => {
    const config = tierConfigs.find(t => t.tier === tier) || tierConfigs[0]
    return (
      <Badge 
        className="capitalize"
        style={{ backgroundColor: `${config.color}20`, color: config.color, borderColor: config.color }}
      >
        {tier}
      </Badge>
    )
  }

  // Get type badge
  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      signup: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      transaction: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      subscription: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      tier_override: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      bonus: 'bg-green-500/20 text-green-400 border-green-500/30'
    }
    return <Badge className={`${styles[type] || 'bg-gray-500/20 text-gray-400'} border capitalize`}>
      {type.replace('_', ' ')}
    </Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-[#00897B]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-[#00897B]" />
            Commission Engine
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Configure rules, manage tiers, process payouts, and track agent performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
            onClick={fetchData}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            size="sm"
            className="bg-[#00897B] hover:bg-[#00695C] text-white"
            onClick={() => { resetRuleForm(); setRuleDialogOpen(true); }}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Rule
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="bg-[#1E293B] border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-500/20 text-amber-400">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(summary.totalPending)}</p>
            <p className="text-xs text-gray-400">Pending</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1E293B] border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-500/20 text-blue-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(summary.totalApproved)}</p>
            <p className="text-xs text-gray-400">Approved</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1E293B] border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-500/20 text-green-400">
                <Banknote className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(summary.totalPaid)}</p>
            <p className="text-xs text-gray-400">Paid</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1E293B] border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-500/20 text-purple-400">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{summary.totalAgents}</p>
            <p className="text-xs text-gray-400">Total Agents</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1E293B] border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-cyan-500/20 text-cyan-400">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(summary.thisMonth.amount)}</p>
            <p className="text-xs text-gray-400">This Month</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1E293B] border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-orange-500/20 text-orange-400">
                <AlertCircle className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{disputes.filter(d => d.status !== 'resolved').length}</p>
            <p className="text-xs text-gray-400">Open Disputes</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#1E293B] border-gray-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-[#00897B]">Overview</TabsTrigger>
          <TabsTrigger value="rules" className="data-[state=active]:bg-[#00897B]">Rules</TabsTrigger>
          <TabsTrigger value="tiers" className="data-[state=active]:bg-[#00897B]">Tier Management</TabsTrigger>
          <TabsTrigger value="payouts" className="data-[state=active]:bg-[#00897B]">Payouts</TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-[#00897B]">Performance</TabsTrigger>
          <TabsTrigger value="disputes" className="data-[state=active]:bg-[#00897B]">Disputes</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <Card className="bg-[#1E293B] border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[#00897B]" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full justify-start bg-[#00897B] hover:bg-[#00695C] text-white"
                  onClick={() => setCalculatorDialogOpen(true)}
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Commission Calculator
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-gray-600 text-gray-300"
                  onClick={() => setActiveTab('rules')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Rules
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-gray-600 text-gray-300"
                  onClick={() => setActiveTab('payouts')}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Process Payouts
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-gray-600 text-gray-300"
                  onClick={() => setActiveTab('disputes')}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  View Disputes ({disputes.filter(d => d.status !== 'resolved').length})
                </Button>
              </CardContent>
            </Card>

            {/* Tier Distribution */}
            <Card className="bg-[#1E293B] border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Award className="h-4 w-4 text-[#00897B]" />
                  Agent Tiers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tierConfigs.map(tier => {
                    const count = agents.filter(a => a.tier === tier.tier).length || Math.floor(Math.random() * 20 + 5)
                    const total = agents.length || 50
                    const percentage = (count / total) * 100
                    return (
                      <div key={tier.tier}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tier.color }} />
                            <span className="text-sm text-gray-300 capitalize">{tier.tier}</span>
                          </div>
                          <span className="text-sm text-white font-medium">{count} agents</span>
                        </div>
                        <Progress value={percentage} className="h-2 bg-gray-700" />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Commission by Type */}
            <Card className="bg-[#1E293B] border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-[#00897B]" />
                  Commission Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500" />
                      <span className="text-sm text-gray-300">Signup</span>
                    </div>
                    <span className="text-white font-medium">{formatCurrency(25000)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-cyan-500" />
                      <span className="text-sm text-gray-300">Transaction</span>
                    </div>
                    <span className="text-white font-medium">{formatCurrency(15000)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500" />
                      <span className="text-sm text-gray-300">Override</span>
                    </div>
                    <span className="text-white font-medium">{formatCurrency(5000)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm text-gray-300">Bonus</span>
                    </div>
                    <span className="text-white font-medium">{formatCurrency(8500)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performers */}
          <Card className="bg-[#1E293B] border-gray-700">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  Top Performers (Month)
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-gray-400" onClick={() => setActiveTab('performance')}>
                  View All <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-5 gap-4">
                {performance.slice(0, 5).map((p, index) => (
                  <div key={p.agentId} className="p-4 rounded-lg bg-[#0F172A] border border-gray-700">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-amber-500 text-amber-900' :
                        index === 1 ? 'bg-gray-400 text-gray-900' :
                        index === 2 ? 'bg-amber-700 text-amber-100' :
                        'bg-gray-700 text-gray-300'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{p.agentName}</p>
                        {getTierBadge(p.tier)}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Commissions</span>
                        <span className="text-[#00897B] font-medium">{formatCurrency(p.totalCommissions)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Referrals</span>
                        <span className="text-white">{p.totalReferrals}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Trend</span>
                        <span className={p.trend >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {p.trend >= 0 ? <ArrowUpRight className="h-3 w-3 inline" /> : <ArrowDownRight className="h-3 w-3 inline" />}
                          {Math.abs(p.trend)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Payouts */}
          <Card className="bg-[#1E293B] border-gray-700">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-base">Recent Payouts</CardTitle>
                <Button variant="ghost" size="sm" className="text-gray-400" onClick={() => setActiveTab('payouts')}>
                  View All <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700 hover:bg-transparent">
                    <TableHead className="text-gray-400">Reference</TableHead>
                    <TableHead className="text-gray-400">Agent</TableHead>
                    <TableHead className="text-gray-400">Period</TableHead>
                    <TableHead className="text-gray-400">Amount</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(payouts.length > 0 ? payouts : [
                    { id: '1', payoutRef: 'PAY-2024-001', agentId: 'Nomsa Dlamini', periodStart: '2024-01', periodEnd: '2024-01-31', netAmount: 12500, status: 'paid', createdAt: new Date(), paidAt: new Date(), totalCommission: 12500, totalAdjustments: 0, signupCommissions: 5000, transactionCommissions: 7500, overrideCommissions: 0, bonusAmount: 0, paymentMethod: null, bankName: null, accountNumber: null },
                    { id: '2', payoutRef: 'PAY-2024-002', agentId: 'Thabo Molefe', periodStart: '2024-01', periodEnd: '2024-01-31', netAmount: 8500, status: 'processing', createdAt: new Date(), paidAt: null, totalCommission: 8500, totalAdjustments: 0, signupCommissions: 3000, transactionCommissions: 5500, overrideCommissions: 0, bonusAmount: 0, paymentMethod: null, bankName: null, accountNumber: null },
                    { id: '3', payoutRef: 'PAY-2024-003', agentId: 'Priya Naidoo', periodStart: '2024-01', periodEnd: '2024-01-31', netAmount: 7200, status: 'pending', createdAt: new Date(), paidAt: null, totalCommission: 7200, totalAdjustments: 0, signupCommissions: 2000, transactionCommissions: 5200, overrideCommissions: 0, bonusAmount: 0, paymentMethod: null, bankName: null, accountNumber: null }
                  ]).slice(0, 5).map(payout => (
                    <TableRow key={payout.id} className="border-gray-700 hover:bg-gray-700/30">
                      <TableCell className="text-white font-mono">{payout.payoutRef}</TableCell>
                      <TableCell className="text-white">{payout.agentId}</TableCell>
                      <TableCell className="text-gray-400">{payout.periodStart} - {payout.periodEnd}</TableCell>
                      <TableCell className="text-[#00897B] font-medium">{formatCurrency(payout.netAmount)}</TableCell>
                      <TableCell>{getStatusBadge(payout.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Commission Rules</h3>
              <p className="text-gray-400 text-sm">Configure how commissions are calculated</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-gray-600 text-gray-300" onClick={() => exportToCSV('rules')}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C] text-white" onClick={() => { resetRuleForm(); setRuleDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(rules.length > 0 ? rules : [
              { id: '1', ruleName: 'Standard Signup Commission', ruleType: 'signup', minAmount: 0, maxAmount: null, commissionRate: 5, fixedAmount: 0, capAmount: null, bronzeMultiplier: 1.0, silverMultiplier: 1.25, goldMultiplier: 1.5, platinumMultiplier: 2.0, active: true, validFrom: null, validTo: null },
              { id: '2', ruleName: 'Transaction Commission', ruleType: 'transaction', minAmount: 0, maxAmount: null, commissionRate: 2, fixedAmount: 0, capAmount: 500, bronzeMultiplier: 1.0, silverMultiplier: 1.25, goldMultiplier: 1.5, platinumMultiplier: 2.0, active: true, validFrom: null, validTo: null },
              { id: '3', ruleName: 'Override Commission (Level 1)', ruleType: 'tier_override', minAmount: 0, maxAmount: null, commissionRate: 1, fixedAmount: 0, capAmount: null, bronzeMultiplier: 0.5, silverMultiplier: 0.75, goldMultiplier: 1.0, platinumMultiplier: 1.25, active: true, validFrom: null, validTo: null },
              { id: '4', ruleName: 'Subscription Commission', ruleType: 'subscription', minAmount: 0, maxAmount: null, commissionRate: 10, fixedAmount: 50, capAmount: null, bronzeMultiplier: 1.0, silverMultiplier: 1.25, goldMultiplier: 1.5, platinumMultiplier: 2.0, active: true, validFrom: null, validTo: null },
              { id: '5', ruleName: 'High Value Transaction Bonus', ruleType: 'bonus', minAmount: 10000, maxAmount: null, commissionRate: 0, fixedAmount: 100, capAmount: 500, bronzeMultiplier: 1.0, silverMultiplier: 1.25, goldMultiplier: 1.5, platinumMultiplier: 2.0, active: true, validFrom: null, validTo: null },
              { id: '6', ruleName: 'Inactive Rule Example', ruleType: 'signup', minAmount: 0, maxAmount: null, commissionRate: 8, fixedAmount: 0, capAmount: null, bronzeMultiplier: 1.0, silverMultiplier: 1.25, goldMultiplier: 1.5, platinumMultiplier: 2.0, active: false, validFrom: null, validTo: null }
            ]).map(rule => (
              <Card key={rule.id} className={`bg-[#1E293B] border-gray-700 ${!rule.active ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-sm">{rule.ruleName}</CardTitle>
                    <div className="flex items-center gap-1">
                      {rule.active ? (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>
                      ) : (
                        <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Inactive</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {getTypeBadge(rule.ruleType)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-400">Rate</span>
                      <p className="text-white font-medium">{rule.commissionRate}%</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Fixed</span>
                      <p className="text-white font-medium">{formatCurrency(rule.fixedAmount)}</p>
                    </div>
                    {rule.capAmount && (
                      <div className="col-span-2">
                        <span className="text-gray-400">Cap</span>
                        <p className="text-white font-medium">{formatCurrency(rule.capAmount)}</p>
                      </div>
                    )}
                  </div>

                  <Separator className="bg-gray-700" />

                  <div className="grid grid-cols-4 gap-1 text-xs">
                    <div className="text-center">
                      <div className="text-gray-400">Bronze</div>
                      <div className="text-white font-medium">{rule.bronzeMultiplier}x</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-400">Silver</div>
                      <div className="text-white font-medium">{rule.silverMultiplier}x</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-400">Gold</div>
                      <div className="text-white font-medium">{rule.goldMultiplier}x</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-400">Platinum</div>
                      <div className="text-white font-medium">{rule.platinumMultiplier}x</div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1 border-gray-600 text-gray-300" onClick={() => editRule(rule)}>
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="border-red-600/50 text-red-400 hover:bg-red-500/20" onClick={() => deleteRule(rule.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tier Management Tab */}
        <TabsContent value="tiers" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Tier Management</h3>
              <p className="text-gray-400 text-sm">Configure tier levels and multipliers</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tierConfigs.map((tier) => {
              const count = agents.filter(a => a.tier === tier.tier).length || Math.floor(Math.random() * 20 + 5)
              return (
                <Card key={tier.tier} className="bg-[#1E293B] border-gray-700">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white text-base capitalize">{tier.tier}</CardTitle>
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{ backgroundColor: tier.color, color: '#000' }}
                      >
                        {tier.rate}%
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-400">Base Rate</span>
                        <p className="text-white font-medium">{tier.rate}%</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Min Referrals</span>
                        <p className="text-white font-medium">{tier.minReferrals}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-400">Active Agents</span>
                        <p className="text-white font-medium">{count}</p>
                      </div>
                    </div>

                    <Separator className="bg-gray-700" />

                    <div>
                      <span className="text-gray-400 text-sm">Benefits</span>
                      <ul className="text-xs text-gray-300 mt-1 space-y-1">
                        <li>• {tier.rate}% commission rate</li>
                        {tier.minReferrals > 0 && <li>• Requires {tier.minReferrals} referrals</li>}
                        {tier.tier === 'silver' && <li>• Priority support</li>}
                        {tier.tier === 'gold' && <li>• Dedicated manager</li>}
                        {tier.tier === 'platinum' && <li>• VIP support & bonuses</li>}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Tier Progression Chart */}
          <Card className="bg-[#1E293B] border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#00897B]" />
                Tier Progression Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4 h-48">
                {tierConfigs.map((tier, index) => (
                  <div key={tier.tier} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full rounded-t-lg flex items-end justify-center"
                      style={{ 
                        backgroundColor: `${tier.color}40`,
                        height: `${(tier.minReferrals + 10) * 1.5}px`,
                        minHeight: '40px'
                      }}
                    >
                      <div 
                        className="w-full rounded-t-lg"
                        style={{ 
                          backgroundColor: tier.color,
                          height: `${(index + 1) * 30}px`
                        }}
                      />
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-white text-sm font-medium capitalize">{tier.tier}</p>
                      <p className="text-gray-400 text-xs">{tier.minReferrals} referrals</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payouts Tab */}
        <TabsContent value="payouts" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Payout Management</h3>
              <p className="text-gray-400 text-sm">Schedule and process commission payouts</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-gray-600 text-gray-300" onClick={() => exportToCSV('payouts')}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C] text-white" onClick={() => setPayoutDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Payout
              </Button>
            </div>
          </div>

          {/* Payout Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-[#1E293B] border-gray-700">
              <CardContent className="p-4">
                <p className="text-gray-400 text-xs">Pending</p>
                <p className="text-2xl font-bold text-amber-400">{formatCurrency(15000)}</p>
              </CardContent>
            </Card>
            <Card className="bg-[#1E293B] border-gray-700">
              <CardContent className="p-4">
                <p className="text-gray-400 text-xs">Processing</p>
                <p className="text-2xl font-bold text-purple-400">{formatCurrency(8500)}</p>
              </CardContent>
            </Card>
            <Card className="bg-[#1E293B] border-gray-700">
              <CardContent className="p-4">
                <p className="text-gray-400 text-xs">Paid This Month</p>
                <p className="text-2xl font-bold text-green-400">{formatCurrency(45000)}</p>
              </CardContent>
            </Card>
            <Card className="bg-[#1E293B] border-gray-700">
              <CardContent className="p-4">
                <p className="text-gray-400 text-xs">Failed</p>
                <p className="text-2xl font-bold text-red-400">{formatCurrency(0)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Payouts Table */}
          <Card className="bg-[#1E293B] border-gray-700">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700 hover:bg-transparent">
                    <TableHead className="text-gray-400">Reference</TableHead>
                    <TableHead className="text-gray-400">Agent</TableHead>
                    <TableHead className="text-gray-400">Period</TableHead>
                    <TableHead className="text-gray-400">Signup</TableHead>
                    <TableHead className="text-gray-400">Transaction</TableHead>
                    <TableHead className="text-gray-400">Override</TableHead>
                    <TableHead className="text-gray-400">Bonus</TableHead>
                    <TableHead className="text-gray-400">Total</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(payouts.length > 0 ? payouts : [
                    { id: '1', payoutRef: 'PAY-2024-001', agentId: 'agent-001', periodStart: 'Jan 2024', periodEnd: 'Jan 31, 2024', totalCommission: 12500, totalAdjustments: 0, netAmount: 12500, signupCommissions: 5000, transactionCommissions: 7500, overrideCommissions: 0, bonusAmount: 0, status: 'paid', createdAt: new Date(), paidAt: new Date(), paymentMethod: 'eft', bankName: 'FNB', accountNumber: '****1234' },
                    { id: '2', payoutRef: 'PAY-2024-002', agentId: 'agent-002', periodStart: 'Jan 2024', periodEnd: 'Jan 31, 2024', totalCommission: 8500, totalAdjustments: 0, netAmount: 8500, signupCommissions: 3000, transactionCommissions: 5500, overrideCommissions: 0, bonusAmount: 0, status: 'processing', createdAt: new Date(), paidAt: null, paymentMethod: null, bankName: 'Standard Bank', accountNumber: '****5678' },
                    { id: '3', payoutRef: 'PAY-2024-003', agentId: 'agent-003', periodStart: 'Jan 2024', periodEnd: 'Jan 31, 2024', totalCommission: 7200, totalAdjustments: -200, netAmount: 7000, signupCommissions: 2000, transactionCommissions: 5200, overrideCommissions: 500, bonusAmount: 0, status: 'pending', createdAt: new Date(), paidAt: null, paymentMethod: null, bankName: null, accountNumber: null },
                    { id: '4', payoutRef: 'PAY-2024-004', agentId: 'agent-004', periodStart: 'Jan 2024', periodEnd: 'Jan 31, 2024', totalCommission: 4500, totalAdjustments: 0, netAmount: 4500, signupCommissions: 1500, transactionCommissions: 2500, overrideCommissions: 0, bonusAmount: 500, status: 'approved', createdAt: new Date(), paidAt: null, paymentMethod: null, bankName: null, accountNumber: null },
                    { id: '5', payoutRef: 'PAY-2024-005', agentId: 'agent-005', periodStart: 'Jan 2024', periodEnd: 'Jan 31, 2024', totalCommission: 2200, totalAdjustments: 0, netAmount: 2200, signupCommissions: 800, transactionCommissions: 1400, overrideCommissions: 0, bonusAmount: 0, status: 'pending', createdAt: new Date(), paidAt: null, paymentMethod: null, bankName: null, accountNumber: null }
                  ]).map(payout => (
                    <TableRow key={payout.id} className="border-gray-700 hover:bg-gray-700/30">
                      <TableCell className="font-mono text-white">{payout.payoutRef}</TableCell>
                      <TableCell className="text-white">{agents.find(a => a.id === payout.agentId)?.firstName || payout.agentId}</TableCell>
                      <TableCell className="text-gray-400">{payout.periodStart}</TableCell>
                      <TableCell className="text-gray-300">{formatCurrency(payout.signupCommissions)}</TableCell>
                      <TableCell className="text-gray-300">{formatCurrency(payout.transactionCommissions)}</TableCell>
                      <TableCell className="text-gray-300">{formatCurrency(payout.overrideCommissions)}</TableCell>
                      <TableCell className="text-gray-300">{formatCurrency(payout.bonusAmount)}</TableCell>
                      <TableCell className="text-[#00897B] font-medium">{formatCurrency(payout.netAmount)}</TableCell>
                      <TableCell>{getStatusBadge(payout.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-white" onClick={() => { setSelectedPayout(payout); setDetailDialogOpen(true); }}>
                            <Eye className="h-3 w-3" />
                          </Button>
                          {(payout.status === 'pending' || payout.status === 'approved') && (
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-green-400 hover:text-green-300" onClick={() => processPayout(payout.id)}>
                              <Send className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Agent Performance</h3>
              <p className="text-gray-400 text-sm">Track agent metrics and achievements</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-gray-600 text-gray-300" onClick={() => exportToCSV('performance')}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Performance Table */}
          <Card className="bg-[#1E293B] border-gray-700">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700 hover:bg-transparent">
                    <TableHead className="text-gray-400">Rank</TableHead>
                    <TableHead className="text-gray-400">Agent</TableHead>
                    <TableHead className="text-gray-400">Tier</TableHead>
                    <TableHead className="text-gray-400">Total Commissions</TableHead>
                    <TableHead className="text-gray-400">Referrals</TableHead>
                    <TableHead className="text-gray-400">Conversion</TableHead>
                    <TableHead className="text-gray-400">Avg Value</TableHead>
                    <TableHead className="text-gray-400">Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {performance.map((p, index) => (
                    <TableRow key={p.agentId} className="border-gray-700 hover:bg-gray-700/30">
                      <TableCell>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-amber-500 text-amber-900' :
                          index === 1 ? 'bg-gray-400 text-gray-900' :
                          index === 2 ? 'bg-amber-700 text-amber-100' :
                          'bg-gray-700 text-gray-300'
                        }`}>
                          {index + 1}
                        </div>
                      </TableCell>
                      <TableCell className="text-white font-medium">{p.agentName}</TableCell>
                      <TableCell>{getTierBadge(p.tier)}</TableCell>
                      <TableCell className="text-[#00897B] font-medium">{formatCurrency(p.totalCommissions)}</TableCell>
                      <TableCell className="text-white">{p.totalReferrals}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={p.conversionRate} className="w-16 h-2 bg-gray-700" />
                          <span className="text-white text-sm">{p.conversionRate}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-white">{formatCurrency(p.avgCommissionValue)}</TableCell>
                      <TableCell>
                        <span className={`flex items-center ${p.trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {p.trend >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                          {Math.abs(p.trend)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Disputes Tab */}
        <TabsContent value="disputes" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Commission Disputes</h3>
              <p className="text-gray-400 text-sm">Handle commission-related disputes</p>
            </div>
          </div>

          {/* Dispute Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-[#1E293B] border-gray-700">
              <CardContent className="p-4">
                <p className="text-gray-400 text-xs">Open</p>
                <p className="text-2xl font-bold text-orange-400">{disputes.filter(d => d.status === 'open').length}</p>
              </CardContent>
            </Card>
            <Card className="bg-[#1E293B] border-gray-700">
              <CardContent className="p-4">
                <p className="text-gray-400 text-xs">Investigating</p>
                <p className="text-2xl font-bold text-cyan-400">{disputes.filter(d => d.status === 'investigating').length}</p>
              </CardContent>
            </Card>
            <Card className="bg-[#1E293B] border-gray-700">
              <CardContent className="p-4">
                <p className="text-gray-400 text-xs">Resolved</p>
                <p className="text-2xl font-bold text-green-400">{disputes.filter(d => d.status === 'resolved').length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Disputes List */}
          <div className="space-y-4">
            {disputes.map(dispute => (
              <Card key={dispute.id} className="bg-[#1E293B] border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-orange-500/20 text-orange-400">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{dispute.agentName}</p>
                          {getStatusBadge(dispute.status)}
                        </div>
                        <p className="text-gray-400 text-sm">{dispute.reason}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>Dispute ID: {dispute.id}</span>
                          <span>Commission ID: {dispute.commissionId}</span>
                          <span>Created: {formatDate(dispute.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">{formatCurrency(dispute.amount)}</p>
                      <div className="flex gap-2 mt-2">
                        {dispute.status === 'open' && (
                          <Button size="sm" variant="outline" className="border-cyan-600 text-cyan-400 hover:bg-cyan-500/20">
                            Investigate
                          </Button>
                        )}
                        {dispute.status !== 'resolved' && (
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {disputes.length === 0 && (
              <Card className="bg-[#1E293B] border-gray-700">
                <CardContent className="p-8 text-center">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-green-400 mb-3" />
                  <p className="text-white font-medium">No Active Disputes</p>
                  <p className="text-gray-400 text-sm">All commission disputes have been resolved</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Rule Editor Dialog */}
      <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1E293B] border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-[#00897B]" />
              {selectedRule ? 'Edit Commission Rule' : 'New Commission Rule'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Configure how commissions are calculated for this rule
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Rule Name</Label>
                  <Input 
                    value={ruleForm.ruleName}
                    onChange={(e) => setRuleForm({ ...ruleForm, ruleName: e.target.value })}
                    placeholder="e.g., Standard Signup Commission"
                    className="bg-[#0F172A] border-gray-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Rule Type</Label>
                  <Select value={ruleForm.ruleType} onValueChange={(v) => setRuleForm({ ...ruleForm, ruleType: v })}>
                    <SelectTrigger className="bg-[#0F172A] border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="signup">Signup</SelectItem>
                      <SelectItem value="transaction">Transaction</SelectItem>
                      <SelectItem value="subscription">Subscription</SelectItem>
                      <SelectItem value="tier_override">Tier Override</SelectItem>
                      <SelectItem value="bonus">Bonus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator className="bg-gray-700" />

            {/* Rates */}
            <div className="space-y-4">
              <h4 className="text-white font-medium flex items-center gap-2">
                <Percent className="h-4 w-4 text-[#00897B]" />
                Commission Rates
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Commission Rate (%)</Label>
                  <Input 
                    type="number"
                    value={ruleForm.commissionRate}
                    onChange={(e) => setRuleForm({ ...ruleForm, commissionRate: parseFloat(e.target.value) || 0 })}
                    className="bg-[#0F172A] border-gray-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Fixed Amount (R)</Label>
                  <Input 
                    type="number"
                    value={ruleForm.fixedAmount}
                    onChange={(e) => setRuleForm({ ...ruleForm, fixedAmount: parseFloat(e.target.value) || 0 })}
                    className="bg-[#0F172A] border-gray-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Cap Amount (R)</Label>
                  <Input 
                    type="number"
                    value={ruleForm.capAmount}
                    onChange={(e) => setRuleForm({ ...ruleForm, capAmount: parseFloat(e.target.value) || 0 })}
                    className="bg-[#0F172A] border-gray-600 text-white"
                    placeholder="Optional"
                  />
                </div>
              </div>
            </div>

            <Separator className="bg-gray-700" />

            {/* Tier Multipliers */}
            <div className="space-y-4">
              <h4 className="text-white font-medium flex items-center gap-2">
                <Award className="h-4 w-4 text-[#00897B]" />
                Tier Multipliers
              </h4>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#CD7F32' }} />
                    Bronze
                  </Label>
                  <Input 
                    type="number"
                    step="0.1"
                    value={ruleForm.bronzeMultiplier}
                    onChange={(e) => setRuleForm({ ...ruleForm, bronzeMultiplier: parseFloat(e.target.value) || 1 })}
                    className="bg-[#0F172A] border-gray-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#C0C0C0' }} />
                    Silver
                  </Label>
                  <Input 
                    type="number"
                    step="0.1"
                    value={ruleForm.silverMultiplier}
                    onChange={(e) => setRuleForm({ ...ruleForm, silverMultiplier: parseFloat(e.target.value) || 1 })}
                    className="bg-[#0F172A] border-gray-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FFD700' }} />
                    Gold
                  </Label>
                  <Input 
                    type="number"
                    step="0.1"
                    value={ruleForm.goldMultiplier}
                    onChange={(e) => setRuleForm({ ...ruleForm, goldMultiplier: parseFloat(e.target.value) || 1 })}
                    className="bg-[#0F172A] border-gray-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#E5E4E2' }} />
                    Platinum
                  </Label>
                  <Input 
                    type="number"
                    step="0.1"
                    value={ruleForm.platinumMultiplier}
                    onChange={(e) => setRuleForm({ ...ruleForm, platinumMultiplier: parseFloat(e.target.value) || 1 })}
                    className="bg-[#0F172A] border-gray-600 text-white"
                  />
                </div>
              </div>
            </div>

            <Separator className="bg-gray-700" />

            {/* Amount Range */}
            <div className="space-y-4">
              <h4 className="text-white font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-[#00897B]" />
                Amount Range (Optional)
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Minimum Amount (R)</Label>
                  <Input 
                    type="number"
                    value={ruleForm.minAmount}
                    onChange={(e) => setRuleForm({ ...ruleForm, minAmount: parseFloat(e.target.value) || 0 })}
                    className="bg-[#0F172A] border-gray-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Maximum Amount (R)</Label>
                  <Input 
                    type="number"
                    value={ruleForm.maxAmount}
                    onChange={(e) => setRuleForm({ ...ruleForm, maxAmount: parseFloat(e.target.value) || 0 })}
                    className="bg-[#0F172A] border-gray-600 text-white"
                    placeholder="Leave empty for no max"
                  />
                </div>
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-300">Active Status</Label>
                <p className="text-xs text-gray-500">Enable or disable this rule</p>
              </div>
              <Switch 
                checked={ruleForm.active}
                onCheckedChange={(checked) => setRuleForm({ ...ruleForm, active: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="border-gray-600 text-gray-300" onClick={() => setRuleDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C] text-white" onClick={saveRule} disabled={processing}>
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {selectedRule ? 'Update Rule' : 'Create Rule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Commission Calculator Dialog */}
      <Dialog open={calculatorDialogOpen} onOpenChange={setCalculatorDialogOpen}>
        <DialogContent className="max-w-md bg-[#1E293B] border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-[#00897B]" />
              Commission Calculator
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Calculate commission for an agent
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Select Agent</Label>
              <Select value={calcAgentId} onValueChange={setCalcAgentId}>
                <SelectTrigger className="bg-[#0F172A] border-gray-600 text-white">
                  <SelectValue placeholder="Choose agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.firstName} {agent.lastName} ({agent.tier})
                    </SelectItem>
                  ))}
                  {agents.length === 0 && [
                    <SelectItem key="agent-001" value="agent-001">Nomsa Dlamini (platinum)</SelectItem>,
                    <SelectItem key="agent-002" value="agent-002">Thabo Molefe (gold)</SelectItem>,
                    <SelectItem key="agent-003" value="agent-003">Priya Naidoo (gold)</SelectItem>,
                    <SelectItem key="agent-004" value="agent-004">Johan van der Berg (silver)</SelectItem>,
                    <SelectItem key="agent-005" value="agent-005">Sipho Zulu (bronze)</SelectItem>
                  ]}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Transaction Amount (R)</Label>
              <Input 
                type="number"
                value={calcAmount}
                onChange={(e) => setCalcAmount(e.target.value)}
                placeholder="Enter amount"
                className="bg-[#0F172A] border-gray-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Commission Type</Label>
              <Select value={calcType} onValueChange={setCalcType}>
                <SelectTrigger className="bg-[#0F172A] border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="signup">Signup</SelectItem>
                  <SelectItem value="transaction">Transaction</SelectItem>
                  <SelectItem value="override">Override</SelectItem>
                  <SelectItem value="bonus">Bonus</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full bg-[#00897B] hover:bg-[#00695C] text-white" onClick={calculateCommission}>
              Calculate
            </Button>

            {calcResult && (
              <div className="bg-[#0F172A] p-4 rounded-lg space-y-3">
                <div className="text-center">
                  <p className="text-gray-400 text-sm">Final Commission</p>
                  <p className="text-3xl font-bold text-[#00897B]">{formatCurrency(calcResult.finalCommission)}</p>
                </div>
                <Separator className="bg-gray-700" />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Base Commission</span>
                    <span className="text-white">{formatCurrency(calcResult.baseCommission)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tier Multiplier</span>
                    <span className="text-white">{calcResult.tierMultiplier}x</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Payout Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-md bg-[#1E293B] border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-[#00897B]" />
              Payout Details
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Reference: {selectedPayout?.payoutRef}
            </DialogDescription>
          </DialogHeader>

          {selectedPayout && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedPayout.status)}
              </div>

              <div className="bg-[#0F172A] p-4 rounded-lg text-center">
                <p className="text-gray-400 text-sm">Net Amount</p>
                <p className="text-3xl font-bold text-[#00897B]">{formatCurrency(selectedPayout.netAmount)}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-[#0F172A] p-3 rounded-lg">
                  <p className="text-gray-400">Period</p>
                  <p className="text-white">{selectedPayout.periodStart}</p>
                </div>
                <div className="bg-[#0F172A] p-3 rounded-lg">
                  <p className="text-gray-400">Total Commission</p>
                  <p className="text-white">{formatCurrency(selectedPayout.totalCommission)}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-xs">
                <div className="bg-[#0F172A] p-2 rounded-lg text-center">
                  <p className="text-gray-400">Signup</p>
                  <p className="text-white font-medium">{formatCurrency(selectedPayout.signupCommissions)}</p>
                </div>
                <div className="bg-[#0F172A] p-2 rounded-lg text-center">
                  <p className="text-gray-400">Trans</p>
                  <p className="text-white font-medium">{formatCurrency(selectedPayout.transactionCommissions)}</p>
                </div>
                <div className="bg-[#0F172A] p-2 rounded-lg text-center">
                  <p className="text-gray-400">Override</p>
                  <p className="text-white font-medium">{formatCurrency(selectedPayout.overrideCommissions)}</p>
                </div>
                <div className="bg-[#0F172A] p-2 rounded-lg text-center">
                  <p className="text-gray-400">Bonus</p>
                  <p className="text-white font-medium">{formatCurrency(selectedPayout.bonusAmount)}</p>
                </div>
              </div>

              {selectedPayout.bankName && (
                <div className="bg-[#0F172A] p-3 rounded-lg">
                  <p className="text-gray-400 text-sm">Payment Details</p>
                  <p className="text-white">{selectedPayout.bankName} - {selectedPayout.accountNumber}</p>
                </div>
              )}

              {selectedPayout.paidAt && (
                <p className="text-xs text-gray-500 text-center">
                  Paid on {formatDate(selectedPayout.paidAt)}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule Payout Dialog */}
      <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
        <DialogContent className="max-w-md bg-[#1E293B] border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-[#00897B]" />
              Schedule Payout
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Create a new payout batch for agents
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Period Start</Label>
              <Input type="date" className="bg-[#0F172A] border-gray-600 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Period End</Label>
              <Input type="date" className="bg-[#0F172A] border-gray-600 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Payment Method</Label>
              <Select>
                <SelectTrigger className="bg-[#0F172A] border-gray-600 text-white">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eft">EFT</SelectItem>
                  <SelectItem value="wallet">Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-amber-400 mt-0.5" />
                <div className="text-sm">
                  <p className="text-amber-400 font-medium">Auto-calculation</p>
                  <p className="text-gray-400">The system will automatically calculate commissions for all approved payouts in the selected period.</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="border-gray-600 text-gray-300" onClick={() => setPayoutDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C] text-white">
              Schedule Payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
