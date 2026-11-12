'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
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
  BarChart3
} from 'lucide-react'

// Fraud Alert Types
type AlertType = 'velocity' | 'amount' | 'location' | 'device' | 'behavior' | 'pattern'
type AlertSeverity = 'low' | 'medium' | 'high' | 'critical'
type AlertStatus = 'new' | 'investigating' | 'resolved' | 'escalated' | 'false_positive'

interface FraudAlert {
  id: string
  type: AlertType
  severity: AlertSeverity
  status: AlertStatus
  merchantId: string
  merchantName: string
  transactionId: string
  amount: number
  timestamp: string
  description: string
  riskScore: number
  rule: string
  details: {
    device?: string
    location?: string
    ipAddress?: string
    previousTransactions?: number
    timeDiff?: string
  }
  assignedTo?: string
  notes: { date: string; author: string; content: string }[]
}

interface MonitoringRule {
  id: string
  name: string
  type: AlertType
  status: 'active' | 'paused' | 'disabled'
  triggers24h: number
  threshold: string
  action: 'alert' | 'block' | 'review'
  priority: number
}

// Sample Data
const fraudAlerts: FraudAlert[] = [
  {
    id: 'FA-001',
    type: 'velocity',
    severity: 'critical',
    status: 'new',
    merchantId: 'M-8821',
    merchantName: 'Quick Mart Sandton',
    transactionId: 'TXN-998877',
    amount: 250000,
    timestamp: '2025-03-10T14:32:00',
    description: 'Multiple high-value transactions within 10 minutes',
    riskScore: 92,
    rule: 'High Velocity Rule',
    details: {
      device: 'Gropay P8D',
      location: 'Sandton City Mall',
      previousTransactions: 5,
      timeDiff: '8 minutes'
    },
    notes: []
  },
  {
    id: 'FA-002',
    type: 'location',
    severity: 'high',
    status: 'investigating',
    merchantId: 'M-4521',
    merchantName: 'Cape Town Electronics',
    transactionId: 'TXN-887766',
    amount: 85000,
    timestamp: '2025-03-10T13:45:00',
    description: 'Transaction from unexpected location',
    riskScore: 78,
    rule: 'Geolocation Anomaly',
    details: {
      device: 'Mobile App',
      location: 'Lagos, Nigeria',
      ipAddress: '41.xxx.xxx.xxx',
      previousTransactions: 12
    },
    assignedTo: 'John D.',
    notes: [
      { date: '2025-03-10 14:00', author: 'John D.', content: 'Contacting merchant to verify' }
    ]
  },
  {
    id: 'FA-003',
    type: 'amount',
    severity: 'high',
    status: 'new',
    merchantId: 'M-7788',
    merchantName: 'Luxury Goods SA',
    transactionId: 'TXN-776655',
    amount: 475000,
    timestamp: '2025-03-10T11:20:00',
    description: 'Transaction amount exceeds normal pattern',
    riskScore: 85,
    rule: 'High Value Alert',
    details: {
      device: 'Gropay A11',
      location: 'Melrose Arch',
      previousTransactions: 23,
      timeDiff: '2 hours'
    },
    notes: []
  },
  {
    id: 'FA-004',
    type: 'behavior',
    severity: 'medium',
    status: 'resolved',
    merchantId: 'M-3344',
    merchantName: 'Daily Fresh Market',
    transactionId: 'TXN-665544',
    amount: 15000,
    timestamp: '2025-03-10T09:15:00',
    description: 'Unusual transaction pattern detected',
    riskScore: 55,
    rule: 'Behavior Pattern',
    details: {
      device: 'Gropay P9',
      location: 'Durban Central',
      previousTransactions: 8
    },
    assignedTo: 'Sarah M.',
    notes: [
      { date: '2025-03-10 10:30', author: 'Sarah M.', content: 'Verified with merchant - legitimate bulk order' }
    ]
  },
  {
    id: 'FA-005',
    type: 'device',
    severity: 'low',
    status: 'false_positive',
    merchantId: 'M-5566',
    merchantName: 'Corner Café',
    transactionId: 'TXN-554433',
    amount: 2500,
    timestamp: '2025-03-10T08:00:00',
    description: 'New device detected for merchant',
    riskScore: 25,
    rule: 'New Device Alert',
    details: {
      device: 'Gropay Y90B',
      location: 'Johannesburg CBD',
      ipAddress: '169.xxx.xxx.xxx'
    },
    notes: []
  },
]

const monitoringRules: MonitoringRule[] = [
  { id: 'R-001', name: 'Velocity Check', type: 'velocity', status: 'active', triggers24h: 1240, threshold: '>5 txns/10min', action: 'alert', priority: 1 },
  { id: 'R-002', name: 'Geolocation Anomaly', type: 'location', status: 'active', triggers24h: 340, threshold: '>500km from usual', action: 'review', priority: 2 },
  { id: 'R-003', name: 'High Value Alert', type: 'amount', status: 'active', triggers24h: 89, threshold: '>R100,000', action: 'alert', priority: 1 },
  { id: 'R-004', name: 'New Device Detection', type: 'device', status: 'active', triggers24h: 520, threshold: 'First transaction', action: 'alert', priority: 3 },
  { id: 'R-005', name: 'Behavior Pattern', type: 'behavior', status: 'active', triggers24h: 156, threshold: 'AI-detected anomaly', action: 'alert', priority: 2 },
  { id: 'R-006', name: 'Night Transaction Block', type: 'pattern', status: 'paused', triggers24h: 0, threshold: '00:00-05:00 >R10,000', action: 'block', priority: 1 },
]

export default function FraudDetection() {
  const [activeTab, setActiveTab] = useState('alerts')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [newNote, setNewNote] = useState('')

  const stats = [
    { label: 'Active Alerts', value: '8', change: '+3', color: '#EF4444', icon: AlertTriangle },
    { label: 'Investigating', value: '12', change: '+2', color: '#F59E0B', icon: Eye },
    { label: 'Resolved Today', value: '45', change: '+15', color: '#10B981', icon: CheckCircle2 },
    { label: 'False Positives', value: '23', change: '+5', color: '#6B7280', icon: XCircle },
  ]

  const getSeverityBadge = (severity: AlertSeverity) => {
    const styles: Record<AlertSeverity, string> = {
      low: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      medium: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      high: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    }
    return <Badge className={`${styles[severity]} border capitalize`}>{severity}</Badge>
  }

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

  const getTypeIcon = (type: AlertType) => {
    switch (type) {
      case 'velocity': return <Zap className="h-4 w-4" />
      case 'amount': return <CreditCard className="h-4 w-4" />
      case 'location': return <MapPin className="h-4 w-4" />
      case 'device': return <Shield className="h-4 w-4" />
      case 'behavior': return <User className="h-4 w-4" />
      case 'pattern': return <BarChart3 className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const handleInvestigate = () => {
    toast.success('Alert marked for investigation')
    setDetailDialogOpen(false)
  }

  const handleResolve = () => {
    toast.success('Alert resolved')
    setDetailDialogOpen(false)
  }

  const handleEscalate = () => {
    toast.success('Alert escalated to senior team')
    setDetailDialogOpen(false)
  }

  const handleFalsePositive = () => {
    toast.success('Alert marked as false positive')
    setDetailDialogOpen(false)
  }

  const handleAddNote = () => {
    if (newNote.trim()) {
      toast.success('Note added')
      setNewNote('')
      setNoteDialogOpen(false)
    }
  }

  const toggleRule = (ruleId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active'
    toast.success(`Rule ${newStatus === 'active' ? 'activated' : 'paused'}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Fraud Detection</h1>
          <p className="text-gray-400 text-sm">Transaction monitoring, alerts, and risk scoring</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
            <Settings className="h-4 w-4 mr-2" />
            Configure Rules
          </Button>
          <Button className="bg-[#00897B] hover:bg-[#00695C] text-white">
            <Bell className="h-4 w-4 mr-2" />
            Alert Settings
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-[#1E293B] border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <span className="text-xs text-green-400">{stat.change}</span>
                  </div>
                  <p className="text-xs text-gray-400">{stat.label}</p>
                </div>
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}20`, color: stat.color }}
                >
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[#1E293B] border border-gray-700">
          <TabsTrigger value="alerts" className="data-[state=active]:bg-[#00897B]">Alert Queue</TabsTrigger>
          <TabsTrigger value="rules" className="data-[state=active]:bg-[#00897B]">Monitoring Rules</TabsTrigger>
          <TabsTrigger value="cases" className="data-[state=active]:bg-[#00897B]">Case Management</TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-[#00897B]">Analytics</TabsTrigger>
        </TabsList>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="mt-4">
          <Card className="bg-[#1E293B] border-gray-700">
            <CardContent className="p-4">
              <div className="flex gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Search by merchant, transaction ID, or amount..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-[#0F172A] border-gray-600 text-white"
                  />
                </div>
                <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>

              <div className="space-y-3">
                {fraudAlerts.map((alert) => (
                  <div 
                    key={alert.id}
                    className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                      alert.severity === 'critical' 
                        ? 'bg-red-500/10 border-red-500/30 hover:border-red-500/50' 
                        : alert.severity === 'high'
                        ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50'
                        : 'bg-[#0F172A] border-gray-700/50 hover:border-gray-600'
                    }`}
                    onClick={() => {
                      setSelectedAlert(alert)
                      setDetailDialogOpen(true)
                    }}
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
                          <p className="text-sm font-medium text-white">{alert.merchantName}</p>
                          {getSeverityBadge(alert.severity)}
                          {getStatusBadge(alert.status)}
                        </div>
                        <p className="text-xs text-gray-400">
                          {alert.description} • {formatCurrency(alert.amount)} • {alert.timestamp}
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
              </div>
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
                {monitoringRules.map((rule) => (
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
                        {getTypeIcon(rule.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-white">{rule.name}</p>
                          <Badge className={`${
                            rule.status === 'active' ? 'bg-green-500/20 text-green-400' :
                            rule.status === 'paused' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-gray-500/20 text-gray-400'
                          } capitalize`}>
                            {rule.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-400">
                          Threshold: {rule.threshold} • Action: {rule.action}
                        </p>
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
                        onClick={() => toggleRule(rule.id, rule.status)}
                      >
                        {rule.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cases Tab */}
        <TabsContent value="cases" className="mt-4">
          <Card className="bg-[#1E293B] border-gray-700">
            <CardContent className="p-6">
              <div className="text-center">
                <Shield className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">Case management coming soon</p>
                <p className="text-xs text-gray-500 mt-1">Track and manage fraud investigations</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-[#1E293B] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#00897B]" />
                  Alert Trends (7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-end justify-between gap-2 px-2">
                  {[65, 45, 78, 52, 88, 72, 95].map((height, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div 
                        className="w-full bg-gradient-to-t from-[#00897B] to-[#4CAF50] rounded-t"
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-[10px] text-gray-500">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1E293B] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-base">Alert Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Velocity</span>
                      <span className="text-white">42%</span>
                    </div>
                    <Progress value={42} className="h-2 bg-gray-700" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Location</span>
                      <span className="text-white">28%</span>
                    </div>
                    <Progress value={28} className="h-2 bg-gray-700" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Amount</span>
                      <span className="text-white">18%</span>
                    </div>
                    <Progress value={18} className="h-2 bg-gray-700" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Behavior</span>
                      <span className="text-white">12%</span>
                    </div>
                    <Progress value={12} className="h-2 bg-gray-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Alert Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl bg-[#1E293B] border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className={`h-5 w-5 ${
                selectedAlert?.severity === 'critical' ? 'text-red-400' :
                selectedAlert?.severity === 'high' ? 'text-amber-400' : 'text-blue-400'
              }`} />
              Fraud Alert Details
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Alert ID: {selectedAlert?.id} • Transaction: {selectedAlert?.transactionId}
            </DialogDescription>
          </DialogHeader>

          {selectedAlert && (
            <div className="space-y-4">
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
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
                  <p className="text-2xl font-bold text-white">{formatCurrency(selectedAlert.amount)}</p>
                  <p className="text-xs text-gray-400">Amount</p>
                </div>
                <div className="bg-[#0F172A] rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-white">{selectedAlert.merchantId}</p>
                  <p className="text-xs text-gray-400">Merchant ID</p>
                </div>
              </div>

              {/* Details */}
              <div className="bg-[#0F172A] rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-400">Merchant:</span>
                    <span className="text-white ml-2">{selectedAlert.merchantName}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Rule Triggered:</span>
                    <span className="text-white ml-2">{selectedAlert.rule}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Device:</span>
                    <span className="text-white ml-2">{selectedAlert.details.device || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Location:</span>
                    <span className="text-white ml-2">{selectedAlert.details.location || 'N/A'}</span>
                  </div>
                  {selectedAlert.details.ipAddress && (
                    <div>
                      <span className="text-gray-400">IP Address:</span>
                      <span className="text-white ml-2">{selectedAlert.details.ipAddress}</span>
                    </div>
                  )}
                  {selectedAlert.details.previousTransactions && (
                    <div>
                      <span className="text-gray-400">Previous Transactions:</span>
                      <span className="text-white ml-2">{selectedAlert.details.previousTransactions}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selectedAlert.notes.length > 0 && (
                <div className="bg-[#0F172A] rounded-lg p-4">
                  <p className="text-sm font-medium text-white mb-2">Investigation Notes</p>
                  <div className="space-y-2">
                    {selectedAlert.notes.map((note, idx) => (
                      <div key={idx} className="text-xs">
                        <span className="text-gray-400">{note.author} • {note.date}</span>
                        <p className="text-white mt-1">{note.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleInvestigate}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Investigate
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleResolve}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Resolve
                </Button>
                <Button 
                  variant="outline"
                  className="border-red-500 text-red-400 hover:bg-red-500/20"
                  onClick={handleEscalate}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Escalate
                </Button>
                <Button 
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  onClick={handleFalsePositive}
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
              onClick={handleAddNote}
              className="bg-[#00897B] hover:bg-[#00695C] text-white"
            >
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
