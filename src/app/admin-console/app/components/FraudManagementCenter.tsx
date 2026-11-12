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
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { 
  AlertTriangle,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  TrendingUp,
  TrendingDown,
  Shield,
  Zap,
  User,
  CreditCard,
  MapPin,
  Calendar,
  ChevronRight,
  Bell,
  Settings,
  Play,
  Pause,
  BarChart3,
  FileText,
  Globe,
  Smartphone,
  Ban,
  AlertCircle,
  Activity,
  Users,
  DollarSign,
  RefreshCw,
  Plus,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react'

// Types
type AlertType = 'velocity' | 'amount' | 'location' | 'device' | 'behavior' | 'pattern' | 'aml' | 'kyc'
type AlertSeverity = 'low' | 'medium' | 'high' | 'critical'
type AlertStatus = 'new' | 'investigating' | 'resolved' | 'escalated' | 'false_positive'

interface FraudAlert {
  id: string
  type: AlertType
  severity: AlertSeverity
  status: AlertStatus
  merchantId?: string
  merchantName?: string
  userId?: string
  userName?: string
  transactionId?: string
  amount?: number
  currency?: string
  description: string
  riskScore: number
  rule?: string
  details?: string
  source?: string
  sourceApp?: string
  assignedTo?: string
  assignedToName?: string
  ipAddress?: string
  deviceId?: string
  location?: string
  createdAt: string
  FraudAlertNote?: { id: string; authorName: string; content: string; createdAt: string }[]
}

interface FraudCase {
  id: string
  caseNumber: string
  title: string
  status: string
  priority: string
  type: string
  totalAmount: number
  assignedToName?: string
  createdAt: string
}

interface FraudRule {
  id: string
  name: string
  code: string
  category: string
  status: string
  priority: number
  triggers24h: number
  autoAction: boolean
  description?: string
}

interface RiskProfile {
  id: string
  entityType: string
  entityId: string
  riskScore: number
  riskLevel: string
  status: string
  lastAssessmentAt?: string
}

interface DashboardStats {
  totalAlerts: number
  newAlerts: number
  investigatingAlerts: number
  resolvedToday: number
  criticalAlerts: number
  openCases: number
  escalatedCases: number
  resolvedCases: number
  activeRules: number
  totalTriggers: number
}

export default function FraudManagementCenter() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [alerts, setAlerts] = useState<FraudAlert[]>([])
  const [cases, setCases] = useState<FraudCase[]>([])
  const [rules, setRules] = useState<FraudRule[]>([])
  const [profiles, setProfiles] = useState<RiskProfile[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [createCaseDialogOpen, setCreateCaseDialogOpen] = useState(false)

  // Fetch functions
  const fetchDashboard = async () => {
    try {
      const response = await fetch('/api/admin/fraud?view=dashboard')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setAlerts(data.recentAlerts || [])
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    }
  }

  const fetchAlerts = async () => {
    try {
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.append('status', filterStatus)
      if (filterSeverity !== 'all') params.append('severity', filterSeverity)
      if (searchQuery) params.append('search', searchQuery)
      params.append('limit', '100')

      const response = await fetch(`/api/admin/fraud?view=alerts&${params}`)
      if (response.ok) {
        const data = await response.json()
        setAlerts(data.alerts)
      }
    } catch (error) {
      console.error('Error fetching alerts:', error)
    }
  }

  const fetchCases = async () => {
    try {
      const response = await fetch('/api/admin/fraud?view=cases')
      if (response.ok) {
        const data = await response.json()
        setCases(data.cases)
      }
    } catch (error) {
      console.error('Error fetching cases:', error)
    }
  }

  const fetchRules = async () => {
    try {
      const response = await fetch('/api/admin/fraud?view=rules')
      if (response.ok) {
        const data = await response.json()
        setRules(data.rules)
      }
    } catch (error) {
      console.error('Error fetching rules:', error)
    }
  }

  const fetchProfiles = async () => {
    try {
      const response = await fetch('/api/admin/fraud?view=profiles')
      if (response.ok) {
        const data = await response.json()
        setProfiles(data.profiles)
      }
    } catch (error) {
      console.error('Error fetching profiles:', error)
    }
  }

  // Initial fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/admin/fraud?view=dashboard')
        if (response.ok) {
          const data = await response.json()
          setStats(data.stats)
          setAlerts(data.recentAlerts || [])
        }
      } catch (error) {
        console.error('Error fetching dashboard:', error)
      }
      setLoading(false)
    }
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Tab-based fetching
  useEffect(() => {
    const fetchData = async () => {
      if (activeTab === 'alerts') await fetchAlerts()
      if (activeTab === 'cases') await fetchCases()
      if (activeTab === 'rules') await fetchRules()
      if (activeTab === 'profiles') await fetchProfiles()
    }
    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // Handle alert action
  const handleAlertAction = async (action: string, alertId: string, data?: Record<string, unknown>) => {
    try {
      const response = await fetch('/api/admin/fraud', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, id: alertId, ...data })
      })

      if (response.ok) {
        toast.success(`Alert ${action} successful`)
        fetchAlerts()
        fetchDashboard()
        setDetailDialogOpen(false)
      } else {
        toast.error('Action failed')
      }
    } catch (error) {
      toast.error('Action failed')
    }
  }

  // Handle rule toggle
  const handleRuleToggle = async (ruleId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active'
    try {
      const response = await fetch('/api/admin/fraud', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_rule', id: ruleId, status: newStatus })
      })

      if (response.ok) {
        toast.success(`Rule ${newStatus === 'active' ? 'activated' : 'paused'}`)
        fetchRules()
      }
    } catch (error) {
      toast.error('Failed to update rule')
    }
  }

  // Get severity badge
  const getSeverityBadge = (severity: AlertSeverity) => {
    const styles: Record<AlertSeverity, string> = {
      low: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      medium: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      high: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      critical: 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse',
    }
    return <Badge className={`${styles[severity]} border capitalize`}>{severity}</Badge>
  }

  // Get status badge
  const getStatusBadge = (status: AlertStatus) => {
    const styles: Record<AlertStatus, string> = {
      new: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      investigating: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      resolved: 'bg-green-500/20 text-green-400 border-green-500/30',
      escalated: 'bg-red-500/20 text-red-400 border-red-500/30',
      false_positive: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    }
    return <Badge className={`${styles[status]} border capitalize`}>{status.replace('_', ' ')}</Badge>
  }

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'velocity': return <Zap className="h-4 w-4" />
      case 'amount': return <CreditCard className="h-4 w-4" />
      case 'location': return <MapPin className="h-4 w-4" />
      case 'device': return <Smartphone className="h-4 w-4" />
      case 'behavior': return <User className="h-4 w-4" />
      case 'pattern': return <BarChart3 className="h-4 w-4" />
      case 'aml': return <Shield className="h-4 w-4" />
      case 'kyc': return <FileText className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  // Get source app badge
  const getSourceAppBadge = (sourceApp?: string) => {
    if (!sourceApp) return null
    const colors: Record<string, string> = {
      merchant_os: 'bg-[#00897B]/20 text-[#00897B]',
      consumer_wallet: 'bg-purple-500/20 text-purple-400',
      gopay: 'bg-blue-500/20 text-blue-400',
      grosell: 'bg-green-500/20 text-green-400',
      agent_network: 'bg-amber-500/20 text-amber-400',
    }
    const color = colors[sourceApp] || 'bg-gray-500/20 text-gray-400'
    return (
      <Badge className={`${color} border-0 text-xs`}>
        {sourceApp.replace('_', ' ')}
      </Badge>
    )
  }

  // Format currency
  const formatCurrency = (value?: number, currency = 'ZAR') => {
    if (!value) return 'N/A'
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(value)
  }

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-ZA', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Stats cards data
  const statsCards = stats ? [
    { label: 'Critical Alerts', value: stats.criticalAlerts, icon: AlertCircle, color: '#EF4444', trend: 'up' },
    { label: 'New Alerts', value: stats.newAlerts, icon: Bell, color: '#F59E0B', trend: 'stable' },
    { label: 'Investigating', value: stats.investigatingAlerts, icon: Eye, color: '#3B82F6', trend: 'down' },
    { label: 'Resolved Today', value: stats.resolvedToday, icon: CheckCircle2, color: '#10B981', trend: 'up' },
    { label: 'Open Cases', value: stats.openCases, icon: FileText, color: '#8B5CF6', trend: 'stable' },
    { label: 'Active Rules', value: stats.activeRules, icon: Shield, color: '#00897B', trend: 'stable' },
  ] : []

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
            <Shield className="h-6 w-6 text-[#00897B]" />
            Fraud Management Center
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Real-time monitoring, detection, and response across all applications
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
            onClick={() => { fetchDashboard(); fetchAlerts(); }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            size="sm"
            className="bg-[#00897B] hover:bg-[#00695C] text-white"
            onClick={() => setCreateCaseDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Case
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statsCards.map((stat, index) => (
          <Card key={index} className="bg-[#1E293B] border-gray-700 hover:border-gray-600 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}20`, color: stat.color }}
                >
                  <stat.icon className="h-4 w-4" />
                </div>
                {stat.trend === 'up' && <ArrowUpRight className="h-3 w-3 text-green-400" />}
                {stat.trend === 'down' && <ArrowDownRight className="h-3 w-3 text-red-400" />}
                {stat.trend === 'stable' && <Minus className="h-3 w-3 text-gray-500" />}
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-gray-400">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[#1E293B] border border-gray-700 grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-[#00897B]">Dashboard</TabsTrigger>
          <TabsTrigger value="alerts" className="data-[state=active]:bg-[#00897B]">Alerts</TabsTrigger>
          <TabsTrigger value="cases" className="data-[state=active]:bg-[#00897B]">Cases</TabsTrigger>
          <TabsTrigger value="rules" className="data-[state=active]:bg-[#00897B]">Rules</TabsTrigger>
          <TabsTrigger value="profiles" className="data-[state=active]:bg-[#00897B]">Profiles</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="mt-4 space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Recent Alerts */}
            <Card className="bg-[#1E293B] border-gray-700 md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-base flex items-center justify-between">
                  <span>Recent Alerts</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-gray-400 hover:text-white"
                    onClick={() => setActiveTab('alerts')}
                  >
                    View All <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80">
                  <div className="space-y-2">
                    {alerts.slice(0, 15).map((alert) => (
                      <div 
                        key={alert.id}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                          alert.severity === 'critical' 
                            ? 'bg-red-500/10 border-red-500/30 hover:border-red-500/50' 
                            : alert.severity === 'high'
                            ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50'
                            : 'bg-[#0F172A] border-gray-700/50 hover:border-gray-600'
                        }`}
                        onClick={() => { setSelectedAlert(alert); setDetailDialogOpen(true); }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            alert.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                            alert.severity === 'high' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {getTypeIcon(alert.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-sm font-medium text-white truncate">
                                {alert.merchantName || alert.userName || 'Unknown'}
                              </p>
                              {getSeverityBadge(alert.severity)}
                            </div>
                            <p className="text-xs text-gray-400 truncate">{alert.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className={`text-sm font-bold ${
                              alert.riskScore >= 80 ? 'text-red-400' :
                              alert.riskScore >= 60 ? 'text-amber-400' : 'text-blue-400'
                            }`}>
                              {alert.riskScore}
                            </p>
                            <p className="text-xs text-gray-500">{formatDate(alert.createdAt)}</p>
                          </div>
                          {getSourceAppBadge(alert.sourceApp)}
                        </div>
                      </div>
                    ))}
                    {alerts.length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No alerts</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-[#1E293B] border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-base">Alert Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Velocity</span>
                    <span className="text-white">42%</span>
                  </div>
                  <Progress value={42} className="h-2 bg-gray-700 [&>div]:bg-[#00897B]" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Amount</span>
                    <span className="text-white">28%</span>
                  </div>
                  <Progress value={28} className="h-2 bg-gray-700 [&>div]:bg-blue-500" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Location</span>
                    <span className="text-white">18%</span>
                  </div>
                  <Progress value={18} className="h-2 bg-gray-700 [&>div]:bg-amber-500" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Behavior</span>
                    <span className="text-white">12%</span>
                  </div>
                  <Progress value={12} className="h-2 bg-gray-700 [&>div]:bg-purple-500" />
                </div>

                <Separator className="bg-gray-700" />

                <div>
                  <p className="text-xs text-gray-400 mb-2">Top Source Apps</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white">Merchant OS</span>
                      <span className="text-sm text-gray-400">156</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white">Consumer Wallet</span>
                      <span className="text-sm text-gray-400">98</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white">GoPay</span>
                      <span className="text-sm text-gray-400">67</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Status */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="bg-[#1E293B] border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Detection Engine</p>
                    <p className="text-xs text-green-400">Operational</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#1E293B] border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Rule Engine</p>
                    <p className="text-xs text-green-400">10 Rules Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#1E293B] border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Globe className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">IP Blacklist</p>
                    <p className="text-xs text-blue-400">1,247 IPs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#1E293B] border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <Users className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Risk Profiles</p>
                    <p className="text-xs text-amber-400">845 Entities</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="mt-4">
          <Card className="bg-[#1E293B] border-gray-700">
            <CardContent className="p-4">
              {/* Filters */}
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Search alerts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-[#0F172A] border-gray-600 text-white"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32 bg-[#0F172A] border-gray-600 text-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="escalated">Escalated</SelectItem>
                    <SelectItem value="false_positive">False Positive</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                  <SelectTrigger className="w-32 bg-[#0F172A] border-gray-600 text-white">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severity</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Alert List */}
              <ScrollArea className="h-[600px]">
                <div className="space-y-2">
                  {alerts.map((alert) => (
                    <div 
                      key={alert.id}
                      className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                        alert.severity === 'critical' 
                          ? 'bg-red-500/10 border-red-500/30 hover:border-red-500/50' 
                          : alert.severity === 'high'
                          ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50'
                          : 'bg-[#0F172A] border-gray-700/50 hover:border-gray-600'
                      }`}
                      onClick={() => { setSelectedAlert(alert); setDetailDialogOpen(true); }}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          alert.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                          alert.severity === 'high' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {getTypeIcon(alert.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-white">
                              {alert.merchantName || alert.userName || 'Unknown Entity'}
                            </p>
                            {getSeverityBadge(alert.severity)}
                            {getStatusBadge(alert.status)}
                            {getSourceAppBadge(alert.sourceApp)}
                          </div>
                          <p className="text-xs text-gray-400">
                            {alert.description} • {formatCurrency(alert.amount)} • {formatDate(alert.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={`text-lg font-bold ${
                            alert.riskScore >= 80 ? 'text-red-400' :
                            alert.riskScore >= 60 ? 'text-amber-400' : 'text-blue-400'
                          }`}>
                            {alert.riskScore}
                          </p>
                          <p className="text-xs text-gray-400">Risk Score</p>
                        </div>
                        <Button 
                          size="sm"
                          className="bg-[#00897B] hover:bg-[#00695C] text-white"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedAlert(alert)
                            setDetailDialogOpen(true)
                          }}
                        >
                          Review
                        </Button>
                      </div>
                    </div>
                  ))}
                  {alerts.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                      <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No alerts match your criteria</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cases Tab */}
        <TabsContent value="cases" className="mt-4">
          <Card className="bg-[#1E293B] border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center justify-between">
                <span>Case Management</span>
                <Button 
                  size="sm" 
                  className="bg-[#00897B] hover:bg-[#00695C]"
                  onClick={() => setCreateCaseDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" /> New Case
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {cases.map((fraudCase) => (
                    <div 
                      key={fraudCase.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-[#0F172A] border border-gray-700/50 hover:border-gray-600 cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          fraudCase.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
                          fraudCase.priority === 'high' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-white">{fraudCase.caseNumber}</p>
                            <Badge className={`
                              ${fraudCase.status === 'open' ? 'bg-blue-500/20 text-blue-400' : ''}
                              ${fraudCase.status === 'investigating' ? 'bg-amber-500/20 text-amber-400' : ''}
                              ${fraudCase.status === 'resolved' ? 'bg-green-500/20 text-green-400' : ''}
                              ${fraudCase.status === 'escalated' ? 'bg-red-500/20 text-red-400' : ''}
                              border-0 capitalize
                            `}>
                              {fraudCase.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-white">{fraudCase.title}</p>
                          <p className="text-xs text-gray-400">
                            {formatCurrency(fraudCase.totalAmount)} • {fraudCase.assignedToName || 'Unassigned'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  ))}
                  {cases.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No cases yet</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setCreateCaseDialogOpen(true)}
                      >
                        Create First Case
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="mt-4">
          <Card className="bg-[#1E293B] border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-base">Monitoring Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rules.map((rule) => (
                  <div 
                    key={rule.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-[#0F172A] border border-gray-700/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        rule.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        rule.status === 'paused' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {getTypeIcon(rule.category)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-white">{rule.name}</p>
                          <Badge className={`
                            ${rule.status === 'active' ? 'bg-green-500/20 text-green-400' : ''}
                            ${rule.status === 'paused' ? 'bg-amber-500/20 text-amber-400' : ''}
                            ${rule.status === 'disabled' ? 'bg-gray-500/20 text-gray-400' : ''}
                            capitalize
                          `}>
                            {rule.status}
                          </Badge>
                          {rule.autoAction && (
                            <Badge className="bg-red-500/20 text-red-400 border-0">Auto-block</Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">{rule.description || rule.code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-white">{rule.triggers24h.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">Triggers/24h</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        onClick={() => handleRuleToggle(rule.id, rule.status)}
                      >
                        {rule.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                ))}
                {rules.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <Settings className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No rules configured</p>
                    <p className="text-xs mt-1">Rules will be seeded automatically</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profiles Tab */}
        <TabsContent value="profiles" className="mt-4">
          <Card className="bg-[#1E293B] border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-base">Risk Profiles</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {profiles.map((profile) => (
                    <div 
                      key={profile.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        profile.riskLevel === 'critical' ? 'bg-red-500/10 border-red-500/30' :
                        profile.riskLevel === 'high' ? 'bg-amber-500/10 border-amber-500/30' :
                        'bg-[#0F172A] border-gray-700/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          profile.riskLevel === 'critical' ? 'bg-red-500/20 text-red-400' :
                          profile.riskLevel === 'high' ? 'bg-amber-500/20 text-amber-400' :
                          profile.riskLevel === 'medium' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {profile.entityType === 'consumer' ? <User className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{profile.entityId}</p>
                          <p className="text-xs text-gray-400 capitalize">{profile.entityType} • {profile.status}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-24">
                          <Progress 
                            value={profile.riskScore} 
                            className={`h-2 bg-gray-700 ${
                              profile.riskScore >= 80 ? '[&>div]:bg-red-500' :
                              profile.riskScore >= 60 ? '[&>div]:bg-amber-500' :
                              '[&>div]:bg-green-500'
                            }`}
                          />
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${
                            profile.riskScore >= 80 ? 'text-red-400' :
                            profile.riskScore >= 60 ? 'text-amber-400' : 'text-green-400'
                          }`}>
                            {profile.riskScore}
                          </p>
                          <p className="text-xs text-gray-400 capitalize">{profile.riskLevel}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {profiles.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No risk profiles yet</p>
                      <p className="text-xs mt-1">Profiles are created automatically during fraud checks</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Alert Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-[#1E293B] border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className={`h-5 w-5 ${
                selectedAlert?.severity === 'critical' ? 'text-red-400' :
                selectedAlert?.severity === 'high' ? 'text-amber-400' : 'text-blue-400'
              }`} />
              Alert Details
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              ID: {selectedAlert?.id} • Created: {selectedAlert?.createdAt && formatDate(selectedAlert.createdAt)}
            </DialogDescription>
          </DialogHeader>

          {selectedAlert && (
            <div className="space-y-4">
              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-[#0F172A] rounded-lg p-3 text-center">
                  <p className={`text-2xl font-bold ${
                    selectedAlert.riskScore >= 80 ? 'text-red-400' :
                    selectedAlert.riskScore >= 60 ? 'text-amber-400' : 'text-blue-400'
                  }`}>
                    {selectedAlert.riskScore}
                  </p>
                  <p className="text-xs text-gray-400">Risk Score</p>
                </div>
                <div className="bg-[#0F172A] rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-white">{formatCurrency(selectedAlert.amount)}</p>
                  <p className="text-xs text-gray-400">Amount</p>
                </div>
                <div className="bg-[#0F172A] rounded-lg p-3 text-center">
                  <p className="text-sm font-bold text-white capitalize">{selectedAlert.type}</p>
                  <p className="text-xs text-gray-400">Type</p>
                </div>
                <div className="bg-[#0F172A] rounded-lg p-3 text-center">
                  {getSeverityBadge(selectedAlert.severity)}
                  <p className="text-xs text-gray-400 mt-1">Severity</p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="bg-[#0F172A] rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Merchant:</span>
                    <span className="text-white ml-2">{selectedAlert.merchantName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Consumer:</span>
                    <span className="text-white ml-2">{selectedAlert.userName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Transaction ID:</span>
                    <span className="text-white ml-2 font-mono">{selectedAlert.transactionId || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Rule:</span>
                    <span className="text-white ml-2">{selectedAlert.rule || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Source App:</span>
                    <span className="text-white ml-2 capitalize">{selectedAlert.sourceApp?.replace('_', ' ') || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Status:</span>
                    <span className="ml-2">{getStatusBadge(selectedAlert.status)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">IP Address:</span>
                    <span className="text-white ml-2 font-mono">{selectedAlert.ipAddress || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Device ID:</span>
                    <span className="text-white ml-2 font-mono text-xs">{selectedAlert.deviceId || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Location:</span>
                    <span className="text-white ml-2">{selectedAlert.location || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Assigned To:</span>
                    <span className="text-white ml-2">{selectedAlert.assignedToName || 'Unassigned'}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedAlert.FraudAlertNote && selectedAlert.FraudAlertNote.length > 0 && (
                <div className="bg-[#0F172A] rounded-lg p-4">
                  <p className="text-sm font-medium text-white mb-2">Investigation Notes</p>
                  <div className="space-y-2">
                    {selectedAlert.FraudAlertNote.map((note) => (
                      <div key={note.id} className="text-xs border-l-2 border-[#00897B] pl-3">
                        <p className="text-gray-400">{note.authorName} • {formatDate(note.createdAt)}</p>
                        <p className="text-white mt-1">{note.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => handleAlertAction('update_alert', selectedAlert.id, { status: 'investigating' })}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Investigate
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleAlertAction('update_alert', selectedAlert.id, { 
                    status: 'resolved',
                    resolvedBy: 'admin',
                    resolvedByName: 'Admin User'
                  })}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Resolve
                </Button>
                <Button 
                  variant="outline"
                  className="border-red-500 text-red-400 hover:bg-red-500/20"
                  onClick={() => handleAlertAction('update_alert', selectedAlert.id, { 
                    status: 'escalated',
                    escalatedTo: 'senior',
                    escalatedToName: 'Senior Analyst'
                  })}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Escalate
                </Button>
                <Button 
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  onClick={() => handleAlertAction('update_alert', selectedAlert.id, { 
                    status: 'false_positive',
                    falsePositive: true
                  })}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  False Positive
                </Button>
                <Button 
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  onClick={() => setNoteDialogOpen(true)}
                >
                  Add Note
                </Button>
                <Button 
                  variant="outline"
                  className="border-red-600 text-red-400 hover:bg-red-600/20"
                  onClick={() => handleAlertAction('update_alert', selectedAlert.id, { blockedAction: true })}
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Block Entity
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="max-w-md bg-[#1E293B] border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Add Investigation Note</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Enter your note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="bg-[#0F172A] border-gray-600 text-white min-h-[100px]"
          />
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setNoteDialogOpen(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedAlert && newNote.trim()) {
                  handleAlertAction('add_note', selectedAlert.id, {
                    authorId: 'admin',
                    authorName: 'Admin User',
                    content: newNote
                  })
                  setNewNote('')
                  setNoteDialogOpen(false)
                }
              }}
              className="bg-[#00897B] hover:bg-[#00695C] text-white"
            >
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Case Dialog */}
      <Dialog open={createCaseDialogOpen} onOpenChange={setCreateCaseDialogOpen}>
        <DialogContent className="max-w-lg bg-[#1E293B] border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Create Fraud Case</DialogTitle>
            <DialogDescription className="text-gray-400">
              Open a new investigation case
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-400 text-xs">Case Title</Label>
              <Input 
                className="bg-[#0F172A] border-gray-600 text-white mt-1"
                placeholder="e.g., Suspicious transaction pattern from Merchant X"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-400 text-xs">Type</Label>
                <Select defaultValue="transaction_fraud">
                  <SelectTrigger className="bg-[#0F172A] border-gray-600 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transaction_fraud">Transaction Fraud</SelectItem>
                    <SelectItem value="identity_fraud">Identity Fraud</SelectItem>
                    <SelectItem value="money_laundering">Money Laundering</SelectItem>
                    <SelectItem value="account_takeover">Account Takeover</SelectItem>
                    <SelectItem value="chargeback">Chargeback</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-400 text-xs">Priority</Label>
                <Select defaultValue="medium">
                  <SelectTrigger className="bg-[#0F172A] border-gray-600 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-gray-400 text-xs">Description</Label>
              <Textarea 
                className="bg-[#0F172A] border-gray-600 text-white mt-1"
                placeholder="Describe the case details..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setCreateCaseDialogOpen(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                toast.success('Case created successfully')
                setCreateCaseDialogOpen(false)
                fetchCases()
              }}
              className="bg-[#00897B] hover:bg-[#00695C] text-white"
            >
              Create Case
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
