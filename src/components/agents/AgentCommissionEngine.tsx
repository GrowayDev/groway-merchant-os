'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  Filter
} from 'lucide-react'

// Types
interface Agent {
  id: string
  name: string
  tier: string
  totalCommission: number
  pendingCommission: number
  referrals: number
}

interface Commission {
  id: string
  agentId: string
  referralId?: string
  amount: number
  commissionType: string
  description?: string
  status: string
  approvedBy?: string
  approvedByName?: string
  approvedAt?: Date
  paidAt?: Date
  payoutReference?: string
  createdAt: Date
  Agent?: {
    id: string
    name: string
    tier: string
  }
}

interface TierConfig {
  tier: string
  rate: number
  minReferrals: number
  color: string
  benefits: string[]
}

const tierConfigs: TierConfig[] = [
  { tier: 'bronze', rate: 5, minReferrals: 0, color: '#CD7F32', benefits: ['5% commission', 'Basic training', 'Marketing materials'] },
  { tier: 'silver', rate: 7, minReferrals: 10, color: '#C0C0C0', benefits: ['7% commission', 'Priority support', 'Bonus incentives'] },
  { tier: 'gold', rate: 10, minReferrals: 25, color: '#FFD700', benefits: ['10% commission', 'Dedicated manager', 'Quarterly bonuses'] },
  { tier: 'platinum', rate: 12, minReferrals: 50, color: '#E5E4E2', benefits: ['12% commission', 'VIP support', 'Annual retreat', 'Stock options'] }
]

export default function AgentCommissionEngine() {
  const [loading, setLoading] = useState(true)
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [summary, setSummary] = useState({
    pending: { amount: 0, count: 0 },
    approved: { amount: 0, count: 0 },
    paid: { amount: 0, count: 0 },
    cancelled: { amount: 0, count: 0 }
  })

  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false)
  const [processing, setProcessing] = useState(false)

  // Payout form
  const [payoutAmount, setPayoutAmount] = useState('')
  const [payoutAgent, setPayoutAgent] = useState('')

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.append('status', filterStatus)
      if (filterType !== 'all') params.append('type', filterType)

      const response = await fetch(`/api/agents/commissions?${params}`)
      if (response.ok) {
        const data = await response.json()
        setCommissions(data.commissions || [])
        setSummary(data.summary || {})
      }

      // Fetch agents
      const agentsResponse = await fetch('/api/agents')
      if (agentsResponse.ok) {
        const agentsData = await agentsResponse.json()
        setAgents(agentsData.agents || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }, [filterStatus, filterType])

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await fetchData()
      setLoading(false)
    }
    loadData()
  }, [fetchData])

  // Approve commission
  const approveCommission = async (commission: Commission) => {
    setProcessing(true)
    try {
      const response = await fetch('/api/agents/commissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commissionId: commission.id,
          action: 'approve',
          approvedBy: 'admin-001',
          approvedByName: 'Admin User'
        })
      })

      if (response.ok) {
        toast.success('Commission approved')
        fetchData()
        setDetailDialogOpen(false)
      }
    } catch {
      toast.error('Failed to approve commission')
    }
    setProcessing(false)
  }

  // Pay commission
  const payCommission = async (commission: Commission) => {
    setProcessing(true)
    try {
      const response = await fetch('/api/agents/commissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commissionId: commission.id,
          action: 'pay'
        })
      })

      if (response.ok) {
        toast.success('Commission paid successfully')
        fetchData()
        setDetailDialogOpen(false)
      }
    } catch {
      toast.error('Failed to process payment')
    }
    setProcessing(false)
  }

  // Bulk payout
  const processBulkPayout = async () => {
    if (!payoutAgent || !payoutAmount) {
      toast.error('Please select an agent and enter amount')
      return
    }

    setProcessing(true)
    try {
      // Get all approved commissions for this agent
      const agentCommissions = commissions.filter(
        c => c.agentId === payoutAgent && c.status === 'approved'
      )

      for (const comm of agentCommissions) {
        await fetch('/api/agents/commissions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            commissionId: comm.id,
            action: 'pay'
          })
        })
      }

      toast.success(`Paid ${agentCommissions.length} commissions`)
      setPayoutDialogOpen(false)
      fetchData()
    } catch {
      toast.error('Failed to process bulk payout')
    }
    setProcessing(false)
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
      paid: 'bg-green-500/20 text-green-400 border-green-500/30',
      cancelled: 'bg-red-500/20 text-red-400 border-red-500/30'
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
      override: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      bonus: 'bg-green-500/20 text-green-400 border-green-500/30'
    }
    return <Badge className={`${styles[type] || 'bg-gray-500/20 text-gray-400'} border capitalize`}>
      {type}
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
            Tier-based commissions, rules engine, and payout management
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
            onClick={() => setPayoutDialogOpen(true)}
          >
            <Send className="h-4 w-4 mr-2" />
            Process Payout
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[#1E293B] border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-500/20 text-amber-400">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(summary.pending?.amount || 0)}</p>
            <p className="text-xs text-gray-400">Pending ({summary.pending?.count || 0})</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1E293B] border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-500/20 text-blue-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(summary.approved?.amount || 0)}</p>
            <p className="text-xs text-gray-400">Approved ({summary.approved?.count || 0})</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1E293B] border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-500/20 text-green-400">
                <Banknote className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(summary.paid?.amount || 0)}</p>
            <p className="text-xs text-gray-400">Paid ({summary.paid?.count || 0})</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1E293B] border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-500/20 text-purple-400">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{agents.length}</p>
            <p className="text-xs text-gray-400">Active Agents</p>
          </CardContent>
        </Card>
      </div>

      {/* Tier Configuration */}
      <Card className="bg-[#1E293B] border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Award className="h-4 w-4 text-[#00897B]" />
            Commission Tiers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            {tierConfigs.map((config) => (
              <div 
                key={config.tier}
                className="p-4 rounded-lg bg-[#0F172A] border border-gray-700"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-white font-medium capitalize">{config.tier}</h4>
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: config.color, color: '#000' }}
                  >
                    {config.rate}%
                  </div>
                </div>
                <div className="space-y-1 text-xs text-gray-400">
                  <p>Min Referrals: {config.minReferrals}</p>
                  {config.benefits.map((benefit, i) => (
                    <p key={i} className="text-gray-500">• {benefit}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Commission List */}
        <div className="lg:col-span-2">
          <Card className="bg-[#1E293B] border-gray-700">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-base">Commission Records</CardTitle>
                <div className="flex gap-2">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-28 bg-[#0F172A] border-gray-600 text-white text-sm">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-28 bg-[#0F172A] border-gray-600 text-white text-sm">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="signup">Signup</SelectItem>
                      <SelectItem value="transaction">Transaction</SelectItem>
                      <SelectItem value="override">Override</SelectItem>
                      <SelectItem value="bonus">Bonus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {commissions.map((commission) => (
                    <div 
                      key={commission.id}
                      className="p-4 rounded-lg bg-[#0F172A] border border-gray-700/50 cursor-pointer hover:border-gray-600"
                      onClick={() => { setSelectedCommission(commission); setDetailDialogOpen(true); }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#00897B]/20 text-[#00897B]">
                            {commission.commissionType === 'signup' ? <Users className="h-5 w-5" /> :
                             commission.commissionType === 'transaction' ? <CreditCard className="h-5 w-5" /> :
                             <Percent className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="text-white font-medium">{commission.Agent?.name || 'Unknown Agent'}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {getTypeBadge(commission.commissionType)}
                              {commission.Agent && getTierBadge(commission.Agent.tier)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">{formatCurrency(commission.amount)}</p>
                          {getStatusBadge(commission.status)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{formatDate(commission.createdAt)}</span>
                        {commission.payoutReference && (
                          <span>Ref: {commission.payoutReference}</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {commissions.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No commissions found</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <Card className="bg-[#1E293B] border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start bg-[#00897B] hover:bg-[#00695C] text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Manual Commission
              </Button>
              <Button variant="outline" className="w-full justify-start border-gray-600 text-gray-300">
                <Calculator className="h-4 w-4 mr-2" />
                Calculate Bonus
              </Button>
              <Button variant="outline" className="w-full justify-start border-gray-600 text-gray-300">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button variant="outline" className="w-full justify-start border-gray-600 text-gray-300">
                <Settings className="h-4 w-4 mr-2" />
                Configure Rules
              </Button>
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card className="bg-[#1E293B] border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-400" />
                Top Earners (Month)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {agents.slice(0, 5).map((agent, index) => (
                  <div key={agent.id} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-amber-500 text-amber-900' :
                      index === 1 ? 'bg-gray-400 text-gray-900' :
                      index === 2 ? 'bg-amber-700 text-amber-100' :
                      'bg-gray-700 text-gray-300'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm">{agent.name}</p>
                      <p className="text-xs text-gray-400">{agent.referrals} referrals</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#00897B] font-medium">{formatCurrency(agent.totalCommission)}</p>
                      {getTierBadge(agent.tier)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Commission Breakdown */}
          <Card className="bg-[#1E293B] border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <PieChart className="h-4 w-4 text-[#00897B]" />
                By Type
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
      </div>

      {/* Commission Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-md bg-[#1E293B] border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#00897B]" />
              Commission Details
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              ID: {selectedCommission?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedCommission && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {getTypeBadge(selectedCommission.commissionType)}
                {getStatusBadge(selectedCommission.status)}
                {selectedCommission.Agent && getTierBadge(selectedCommission.Agent.tier)}
              </div>

              <div className="bg-[#0F172A] p-4 rounded-lg text-center">
                <p className="text-gray-400 text-sm">Amount</p>
                <p className="text-3xl font-bold text-white">{formatCurrency(selectedCommission.amount)}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-[#0F172A] p-3 rounded-lg">
                  <p className="text-gray-400">Agent</p>
                  <p className="text-white">{selectedCommission.Agent?.name || 'N/A'}</p>
                </div>
                <div className="bg-[#0F172A] p-3 rounded-lg">
                  <p className="text-gray-400">Created</p>
                  <p className="text-white">{formatDate(selectedCommission.createdAt)}</p>
                </div>
              </div>

              {selectedCommission.description && (
                <div className="bg-[#0F172A] p-3 rounded-lg">
                  <p className="text-gray-400 text-sm">Description</p>
                  <p className="text-white text-sm">{selectedCommission.description}</p>
                </div>
              )}

              {selectedCommission.approvedByName && (
                <div className="text-xs text-gray-500">
                  Approved by {selectedCommission.approvedByName} on {formatDate(selectedCommission.approvedAt!)}
                </div>
              )}

              {/* Actions */}
              {selectedCommission.status === 'pending' && (
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => approveCommission(selectedCommission)}
                  disabled={processing}
                >
                  {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  Approve
                </Button>
              )}

              {selectedCommission.status === 'approved' && (
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => payCommission(selectedCommission)}
                  disabled={processing}
                >
                  {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Banknote className="h-4 w-4 mr-2" />}
                  Process Payment
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Payout Dialog */}
      <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
        <DialogContent className="max-w-md bg-[#1E293B] border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-[#00897B]" />
              Process Payout
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Pay approved commissions to agents
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Select Agent</Label>
              <Select value={payoutAgent} onValueChange={setPayoutAgent}>
                <SelectTrigger className="bg-[#0F172A] border-gray-600 text-white">
                  <SelectValue placeholder="Choose agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name} - {formatCurrency(agent.pendingCommission)} pending
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {payoutAgent && (
              <div className="bg-[#0F172A] p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Pending Commissions</span>
                  <span className="text-white">
                    {commissions.filter(c => c.agentId === payoutAgent && c.status === 'approved').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Amount</span>
                  <span className="text-[#00897B] font-bold">
                    {formatCurrency(
                      commissions
                        .filter(c => c.agentId === payoutAgent && c.status === 'approved')
                        .reduce((sum, c) => sum + c.amount, 0)
                    )}
                  </span>
                </div>
              </div>
            )}

            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5" />
                <div className="text-sm">
                  <p className="text-amber-400 font-medium">Payment Confirmation</p>
                  <p className="text-gray-400">This will process all approved commissions for the selected agent.</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              className="border-gray-600 text-gray-300"
              onClick={() => setPayoutDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              className="bg-[#00897B] hover:bg-[#00695C] text-white"
              onClick={processBulkPayout}
              disabled={processing || !payoutAgent}
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Process Payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
