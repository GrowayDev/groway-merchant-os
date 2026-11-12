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
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { 
  AlertTriangle,
  Bell,
  Search,
  Clock,
  CheckCircle2,
  User,
  Zap,
  Shield,
  FileText,
  Globe,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  RefreshCw,
  Plus,
  ChevronRight,
  AlertCircle,
  Send,
  Settings,
  Users,
  MoreHorizontal
} from 'lucide-react'

type AlertType = 'fraud' | 'system' | 'compliance' | 'support' | 'security' | 'operational'
type AlertSeverity = 'low' | 'medium' | 'high' | 'critical'
type AlertStatus = 'new' | 'acknowledged' | 'investigating' | 'resolved' | 'escalated' | 'closed'

interface SystemAlert {
  id: string
  alertType: AlertType
  severity: AlertSeverity
  status: AlertStatus
  title: string
  description: string
  source: string
  sourceApp?: string
  entityType?: string
  entityId?: string
  entityName?: string
  riskScore: number
  impactLevel: string
  assignedTo?: string
  assignedToName?: string
  escalationLevel: number
  createdAt: string
  notificationSent: boolean
}

interface DashboardStats {
  totalAlerts: number
  newAlerts: number
  criticalAlerts: number
  unassignedAlerts: number
}

export default function AlertingCenterView() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [alerts, setAlerts] = useState<SystemAlert[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [selectedAlert, setSelectedAlert] = useState<SystemAlert | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false)
  const [resolution, setResolution] = useState('')
  const [escalateDialogOpen, setEscalateDialogOpen] = useState(false)
  const [escalationReason, setEscalationReason] = useState('')

  const fetchDashboard = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/alerts?view=dashboard')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setAlerts(data.recentAlerts || [])
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    }
    setLoading(false)
  }, [])

  const fetchAlerts = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.append('status', filterStatus)
      if (filterSeverity !== 'all') params.append('severity', filterSeverity)
      if (filterType !== 'all') params.append('alertType', filterType)
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(`/api/admin/alerts?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAlerts(data.alerts)
      }
    } catch (error) {
      console.error('Error fetching alerts:', error)
    }
  }, [filterStatus, filterSeverity, filterType, searchQuery])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  useEffect(() => {
    if (activeTab === 'alerts') {
      fetchAlerts()
    }
  }, [activeTab, fetchAlerts])

  const handleAlertAction = async (action: string, alertId: string, data?: Record<string, unknown>) => {
    try {
      const response = await fetch('/api/admin/alerts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: alertId, action, ...data })
      })

      if (response.ok) {
        toast.success(`Alert ${action} successful`)
        fetchAlerts()
        fetchDashboard()
        setDetailDialogOpen(false)
        setResolveDialogOpen(false)
        setEscalateDialogOpen(false)
        setResolution('')
        setEscalationReason('')
      } else {
        toast.error('Action failed')
      }
    } catch (error) {
      toast.error('Action failed')
    }
  }

  const getSeverityBadge = (severity: AlertSeverity) => {
    const styles: Record<AlertSeverity, string> = {
      low: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      medium: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      high: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      critical: 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse',
    }
    return <Badge className={`${styles[severity]} border capitalize`}>{severity}</Badge>
  }

  const getStatusBadge = (status: AlertStatus) => {
    const styles: Record<AlertStatus, string> = {
      new: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      acknowledged: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      investigating: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      resolved: 'bg-green-500/20 text-green-400 border-green-500/30',
      escalated: 'bg-red-500/20 text-red-400 border-red-500/30',
      closed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    }
    return <Badge className={`${styles[status]} border capitalize`}>{status}</Badge>
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'fraud': return <Shield className="h-4 w-4" />
      case 'system': return <Zap className="h-4 w-4" />
      case 'compliance': return <FileText className="h-4 w-4" />
      case 'support': return <Users className="h-4 w-4" />
      case 'security': return <AlertTriangle className="h-4 w-4" />
      case 'operational': return <Settings className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-ZA', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const statsCards = stats ? [
    { label: 'Critical Alerts', value: stats.criticalAlerts, icon: AlertCircle, color: '#EF4444', trend: 'up' },
    { label: 'New Alerts', value: stats.newAlerts, icon: Bell, color: '#F59E0B', trend: 'stable' },
    { label: 'Unassigned', value: stats.unassignedAlerts, icon: User, color: '#3B82F6', trend: 'down' },
    { label: 'Total Active', value: stats.totalAlerts, icon: AlertTriangle, color: '#8B5CF6', trend: 'stable' },
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
            <Bell className="h-6 w-6 text-[#00897B]" />
            Alerting Center
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Real-time alerting, notifications, and escalation management
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
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Alert
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                {stat.trend === 'up' && <ArrowUpRight className="h-3 w-3 text-red-400" />}
                {stat.trend === 'down' && <ArrowDownRight className="h-3 w-3 text-green-400" />}
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
        <TabsList className="bg-[#1E293B] border border-gray-700 grid grid-cols-4 w-full max-w-xl">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-[#00897B]">Dashboard</TabsTrigger>
          <TabsTrigger value="alerts" className="data-[state=active]:bg-[#00897B]">All Alerts</TabsTrigger>
          <TabsTrigger value="escalation" className="data-[state=active]:bg-[#00897B]">Escalation</TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-[#00897B]">Settings</TabsTrigger>
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
                    {alerts.map((alert) => (
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
                            {getTypeIcon(alert.alertType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-sm font-medium text-white truncate">{alert.title}</p>
                              {getSeverityBadge(alert.severity)}
                            </div>
                            <p className="text-xs text-gray-400 truncate">{alert.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(alert.status)}
                          <span className="text-xs text-gray-500">{formatDate(alert.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                    {alerts.length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No alerts</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Alert Distribution */}
            <Card className="bg-[#1E293B] border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-base">By Type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {['fraud', 'system', 'compliance', 'support', 'security'].map((type) => {
                  const count = alerts.filter(a => a.alertType === type).length
                  const percent = alerts.length > 0 ? (count / alerts.length) * 100 : 0
                  return (
                    <div key={type}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400 capitalize">{type}</span>
                        <span className="text-white">{count}</span>
                      </div>
                      <Progress value={percent} className="h-2 bg-gray-700 [&>div]:bg-[#00897B]" />
                    </div>
                  )
                })}
                <Separator className="bg-gray-700" />
                <div className="text-center">
                  <p className="text-xs text-gray-400">Notification Channels</p>
                  <div className="flex justify-center gap-2 mt-2">
                    <Badge className="bg-green-500/20 text-green-400 border-0">Email</Badge>
                    <Badge className="bg-blue-500/20 text-blue-400 border-0">SMS</Badge>
                    <Badge className="bg-purple-500/20 text-purple-400 border-0">Push</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Escalation Levels */}
          <Card className="bg-[#1E293B] border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-base">Escalation Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                {[
                  { level: 1, name: 'Tier 1 Support', sla: '15 min', color: '#10B981' },
                  { level: 2, name: 'Senior Support', sla: '30 min', color: '#F59E0B' },
                  { level: 3, name: 'Team Lead', sla: '1 hour', color: '#EF4444' },
                  { level: 4, name: 'Management', sla: '2 hours', color: '#8B5CF6' },
                ].map((tier) => (
                  <div key={tier.level} className="p-4 rounded-lg bg-[#0F172A] border border-gray-700/50">
                    <div className="flex items-center gap-2 mb-2">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: tier.color }}
                      >
                        {tier.level}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{tier.name}</p>
                        <p className="text-xs text-gray-400">SLA: {tier.sla}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Alerts Tab */}
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
                    <SelectItem value="acknowledged">Acknowledged</SelectItem>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="escalated">Escalated</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
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
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-32 bg-[#0F172A] border-gray-600 text-white">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="fraud">Fraud</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Alert List */}
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {alerts.map((alert) => (
                    <div 
                      key={alert.id}
                      className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                        alert.severity === 'critical' 
                          ? 'bg-red-500/10 border-red-500/30' 
                          : alert.severity === 'high'
                          ? 'bg-amber-500/10 border-amber-500/30'
                          : 'bg-[#0F172A] border-gray-700/50'
                      }`}
                      onClick={() => { setSelectedAlert(alert); setDetailDialogOpen(true); }}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          alert.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                          alert.severity === 'high' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {getTypeIcon(alert.alertType)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-white">{alert.title}</p>
                            {getSeverityBadge(alert.severity)}
                            {getStatusBadge(alert.status)}
                          </div>
                          <p className="text-xs text-gray-400">
                            {alert.entityName || 'N/A'} • {formatDate(alert.createdAt)}
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
                          <p className="text-xs text-gray-400">Risk</p>
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
                      <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No alerts match your criteria</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Escalation Tab */}
        <TabsContent value="escalation" className="mt-4">
          <Card className="bg-[#1E293B] border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-base">Escalation Workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.filter(a => a.status === 'escalated').map((alert) => (
                  <div key={alert.id} className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(alert.alertType)}
                        <p className="text-sm font-medium text-white">{alert.title}</p>
                      </div>
                      <Badge className="bg-red-500/20 text-red-400 border-0">
                        Level {alert.escalationLevel}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 mb-3">{alert.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Escalated: {formatDate(alert.createdAt)}
                      </span>
                      <Button 
                        size="sm" 
                        className="bg-[#00897B] hover:bg-[#00695C]"
                        onClick={() => { setSelectedAlert(alert); setDetailDialogOpen(true); }}
                      >
                        Take Action
                      </Button>
                    </div>
                  </div>
                ))}
                {alerts.filter(a => a.status === 'escalated').length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No escalated alerts</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-4">
          <Card className="bg-[#1E293B] border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-base">Alert Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-white">Notification Channels</h3>
                  <div className="space-y-2">
                    {['Email', 'SMS', 'Push Notification', 'Webhook', 'Slack'].map((channel) => (
                      <div key={channel} className="flex items-center justify-between p-3 rounded-lg bg-[#0F172A] border border-gray-700/50">
                        <span className="text-sm text-gray-300">{channel}</span>
                        <input type="checkbox" defaultChecked className="accent-[#00897B]" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-white">Alert Types</h3>
                  <div className="space-y-2">
                    {[
                      { type: 'Fraud Alerts', enabled: true },
                      { type: 'System Alerts', enabled: true },
                      { type: 'Compliance Alerts', enabled: true },
                      { type: 'Support Alerts', enabled: false },
                      { type: 'Security Alerts', enabled: true },
                    ].map((item) => (
                      <div key={item.type} className="flex items-center justify-between p-3 rounded-lg bg-[#0F172A] border border-gray-700/50">
                        <span className="text-sm text-gray-300">{item.type}</span>
                        <input type="checkbox" defaultChecked={item.enabled} className="accent-[#00897B]" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Alert Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl bg-[#1E293B] border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAlert && getTypeIcon(selectedAlert.alertType)}
              {selectedAlert?.title}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              ID: {selectedAlert?.id} • Created: {selectedAlert && formatDate(selectedAlert.createdAt)}
            </DialogDescription>
          </DialogHeader>

          {selectedAlert && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {getSeverityBadge(selectedAlert.severity)}
                {getStatusBadge(selectedAlert.status)}
                {selectedAlert.escalationLevel > 0 && (
                  <Badge className="bg-red-500/20 text-red-400 border-0">
                    Escalation Level {selectedAlert.escalationLevel}
                  </Badge>
                )}
              </div>

              <div className="p-4 rounded-lg bg-[#0F172A] border border-gray-700/50">
                <p className="text-sm text-gray-300">{selectedAlert.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Type</p>
                  <p className="text-white capitalize">{selectedAlert.alertType}</p>
                </div>
                <div>
                  <p className="text-gray-400">Risk Score</p>
                  <p className={`font-bold ${
                    selectedAlert.riskScore >= 80 ? 'text-red-400' :
                    selectedAlert.riskScore >= 60 ? 'text-amber-400' : 'text-blue-400'
                  }`}>{selectedAlert.riskScore}</p>
                </div>
                <div>
                  <p className="text-gray-400">Entity</p>
                  <p className="text-white">{selectedAlert.entityName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-400">Assigned To</p>
                  <p className="text-white">{selectedAlert.assignedToName || 'Unassigned'}</p>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-gray-700">
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    onClick={() => handleAlertAction('acknowledge', selectedAlert.id)}
                    disabled={selectedAlert.status !== 'new'}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Acknowledge
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="border-amber-500 text-amber-400 hover:bg-amber-500/20"
                    onClick={() => setEscalateDialogOpen(true)}
                    disabled={selectedAlert.status === 'resolved'}
                  >
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Escalate
                  </Button>
                </div>
                <Button 
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => setResolveDialogOpen(true)}
                  disabled={selectedAlert.status === 'resolved'}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Resolve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent className="bg-[#1E293B] border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Resolve Alert</DialogTitle>
            <DialogDescription>Provide resolution details for this alert.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter resolution details..."
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="bg-[#0F172A] border-gray-600 text-white min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-gray-600 text-gray-300" onClick={() => setResolveDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => handleAlertAction('resolve', selectedAlert?.id || '', { resolution })}
            >
              Resolve Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Escalate Dialog */}
      <Dialog open={escalateDialogOpen} onOpenChange={setEscalateDialogOpen}>
        <DialogContent className="bg-[#1E293B] border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Escalate Alert</DialogTitle>
            <DialogDescription>Provide reason for escalation.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter escalation reason..."
              value={escalationReason}
              onChange={(e) => setEscalationReason(e.target.value)}
              className="bg-[#0F172A] border-gray-600 text-white min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-gray-600 text-gray-300" onClick={() => setEscalateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => handleAlertAction('escalate', selectedAlert?.id || '', { reason: escalationReason })}
            >
              Escalate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
