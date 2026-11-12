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
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { 
  Shield,
  FileText,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Calendar,
  Database,
  RefreshCw,
  Send,
  ChevronRight,
  User,
  AlertCircle,
  AlertTriangle,
  History,
  Loader2,
  Trash2,
  Ban,
  Plus,
  Download,
  Upload,
  Users,
  Bell,
  FileWarning,
  ClipboardCheck,
  Lock,
  Globe,
  Mail,
  Phone,
  Building2
} from 'lucide-react'

// Types
interface POPIARequest {
  id: string
  requestType: string
  requesterName: string
  requesterEmail: string
  requesterPhone?: string
  requesterIdNumber?: string
  description?: string
  dataCategories?: string
  identityVerified: boolean
  status: string
  submittedAt: Date
  dueDate: Date
  completedAt?: Date
  responseNotes?: string
  rejectionReason?: string
  assignedTo?: string
  assignedToName?: string
  daysRemaining?: number
  isOverdue?: boolean
}

interface ConsentRecord {
  id: string
  userId?: string
  userEmail?: string
  userPhone?: string
  userName?: string
  consentType: string
  consentSource: string
  consentVersion?: string
  status: string
  grantedAt: Date
  withdrawnAt?: Date
  withdrawnReason?: string
  ipAddress?: string
  userAgent?: string
  preferences?: string
  legalBasis: string
  expiresAt?: Date
  createdAt: Date
}

interface DataBreachRecord {
  id: string
  breachTitle: string
  breachDescription: string
  breachType: string
  breachCategory: string
  detectedAt: Date
  affectedRecords: number
  affectedDataSubjects: number
  severity: string
  status: string
  regulatorNotified: boolean
  subjectsNotified: boolean
}

interface PrivacyAssessment {
  id: string
  projectName: string
  projectDescription: string
  projectOwner: string
  riskLevel: string
  status: string
  assessmentDate: Date
}

export default function POPIAComplianceCenter() {
  const [activeTab, setActiveTab] = useState('requests')
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<POPIARequest[]>([])
  const [consents, setConsents] = useState<ConsentRecord[]>([])
  const [breaches, setBreaches] = useState<DataBreachRecord[]>([])
  const [assessments, setAssessments] = useState<PrivacyAssessment[]>([])
  
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  
  // Dialogs
  const [selectedRequest, setSelectedRequest] = useState<POPIARequest | null>(null)
  const [requestDialogOpen, setRequestDialogOpen] = useState(false)
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [actionType, setActionType] = useState('')
  const [actionNotes, setActionNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [processing, setProcessing] = useState(false)
  
  // Stats
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    overdueRequests: 0,
    completedThisMonth: 0,
    avgResponseTime: 0,
    totalConsents: 0,
    activeConsents: 0,
    withdrawnConsents: 0
  })

  // Fetch data
  const fetchRequests = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.append('status', filterStatus)
      if (filterType !== 'all') params.append('type', filterType)
      if (searchQuery) params.append('search', searchQuery)
      
      const response = await fetch(`/api/popia/requests?${params}`)
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests || [])
        
        // Calculate stats
        const pending = data.requests.filter((r: POPIARequest) => r.status === 'pending' || r.status === 'processing').length
        const overdue = data.requests.filter((r: POPIARequest) => r.isOverdue).length
        const completedThisMonth = data.requests.filter((r: POPIARequest) => {
          if (r.status !== 'completed' || !r.completedAt) return false
          const completed = new Date(r.completedAt)
          const now = new Date()
          return completed.getMonth() === now.getMonth() && completed.getFullYear() === now.getFullYear()
        }).length
        
        setStats(prev => ({
          ...prev,
          totalRequests: data.total,
          pendingRequests: pending,
          overdueRequests: overdue,
          completedThisMonth
        }))
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
    }
  }, [filterStatus, filterType, searchQuery])

  const fetchConsents = async () => {
    try {
      const response = await fetch('/api/popia/consents')
      if (response.ok) {
        const data = await response.json()
        setConsents(data.consents || [])
        setStats(prev => ({
          ...prev,
          totalConsents: data.total,
          activeConsents: data.consents?.filter((c: ConsentRecord) => c.status === 'active').length || 0,
          withdrawnConsents: data.consents?.filter((c: ConsentRecord) => c.status === 'withdrawn').length || 0
        }))
      }
    } catch (error) {
      console.error('Error fetching consents:', error)
    }
  }

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchRequests(), fetchConsents()])
      
      // Mock data for breaches and assessments
      setBreaches([
        {
          id: 'breach-001',
          breachTitle: 'Unauthorized Database Access',
          breachDescription: 'Attempted SQL injection attack detected and blocked',
          breachType: 'confidentiality',
          breachCategory: 'hacking',
          detectedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          affectedRecords: 0,
          affectedDataSubjects: 0,
          severity: 'medium',
          status: 'contained',
          regulatorNotified: false,
          subjectsNotified: false
        }
      ])
      
      setAssessments([
        {
          id: 'pia-001',
          projectName: 'Consumer Wallet Enhanced Analytics',
          projectDescription: 'Adding predictive analytics to wallet usage patterns',
          projectOwner: 'Data Team',
          riskLevel: 'medium',
          status: 'approved',
          assessmentDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        },
        {
          id: 'pia-002',
          projectName: 'Third-party Marketing Integration',
          projectDescription: 'Integration with marketing automation platform',
          projectOwner: 'Marketing',
          riskLevel: 'high',
          status: 'under_review',
          assessmentDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        }
      ])
      
      setLoading(false)
    }
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handle request action
  const handleRequestAction = async () => {
    if (!selectedRequest || !actionType) return
    
    setProcessing(true)
    try {
      const body: Record<string, unknown> = {
        action: actionType,
        adminId: 'admin-001',
        adminName: 'Compliance Officer'
      }
      
      if (actionType === 'complete' || actionType === 'add_notes' || actionType === 'extend_deadline') {
        body.notes = actionNotes
      }
      
      if (actionType === 'reject') {
        body.rejectionReason = rejectionReason
      }
      
      const response = await fetch(`/api/popia/requests/${selectedRequest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      if (response.ok) {
        toast.success(`Request ${actionType} successful`)
        setActionDialogOpen(false)
        setRequestDialogOpen(false)
        setActionNotes('')
        setRejectionReason('')
        fetchRequests()
      } else {
        toast.error('Action failed')
      }
    } catch {
      toast.error('Action failed')
    }
    setProcessing(false)
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      processing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      completed: 'bg-green-500/20 text-green-400 border-green-500/30',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
      active: 'bg-green-500/20 text-green-400 border-green-500/30',
      withdrawn: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      expired: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      draft: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      under_review: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      approved: 'bg-green-500/20 text-green-400 border-green-500/30',
      detected: 'bg-red-500/20 text-red-400 border-red-500/30',
      investigating: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      contained: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      resolved: 'bg-green-500/20 text-green-400 border-green-500/30',
      closed: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
    return <Badge className={`${styles[status] || 'bg-gray-500/20 text-gray-400'} border capitalize`}>
      {status.replace('_', ' ')}
    </Badge>
  }

  // Get severity badge
  const getSeverityBadge = (severity: string) => {
    const styles: Record<string, string> = {
      low: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      critical: 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse'
    }
    return <Badge className={`${styles[severity]} border capitalize`}>{severity}</Badge>
  }

  // Get request type label
  const getRequestTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      access: 'Data Access',
      correction: 'Data Correction',
      deletion: 'Data Deletion',
      objection: 'Objection to Processing',
      portability: 'Data Portability'
    }
    return labels[type] || type
  }

  // Format date
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-ZA', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Stats cards
  const statsCards = [
    { label: 'Pending Requests', value: stats.pendingRequests, icon: Clock, color: '#F59E0B' },
    { label: 'Overdue', value: stats.overdueRequests, icon: AlertTriangle, color: '#EF4444' },
    { label: 'Completed (Month)', value: stats.completedThisMonth, icon: CheckCircle2, color: '#10B981' },
    { label: 'Active Consents', value: stats.activeConsents, icon: Shield, color: '#00897B' },
    { label: 'Data Breaches', value: breaches.filter(b => b.status !== 'closed').length, icon: AlertCircle, color: '#EF4444' },
    { label: 'PIAs Pending', value: assessments.filter(a => a.status === 'under_review').length, icon: ClipboardCheck, color: '#8B5CF6' }
  ]

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
            POPIA Compliance Center
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Data subject requests, consent management, privacy assessments
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
            onClick={() => { fetchRequests(); fetchConsents(); }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            size="sm"
            className="bg-[#00897B] hover:bg-[#00695C] text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statsCards.map((stat, index) => (
          <Card key={index} className="bg-[#1E293B] border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}20`, color: stat.color }}
                >
                  <stat.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-gray-400">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Compliance Score */}
      <Card className="bg-[#1E293B] border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">POPIA Compliance Score</h3>
              <p className="text-sm text-gray-400">Based on request response time, consent management, and breach handling</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-[#00897B]">94%</p>
              <p className="text-sm text-green-400">+2% from last month</p>
            </div>
          </div>
          <Progress value={94} className="h-2 mt-4 bg-gray-700" />
          <div className="grid grid-cols-4 gap-4 mt-4 text-center text-sm">
            <div>
              <p className="text-gray-400">Request Response</p>
              <p className="text-white font-medium">98%</p>
            </div>
            <div>
              <p className="text-gray-400">Consent Tracking</p>
              <p className="text-white font-medium">100%</p>
            </div>
            <div>
              <p className="text-gray-400">Breach Response</p>
              <p className="text-white font-medium">90%</p>
            </div>
            <div>
              <p className="text-gray-400">PIA Completion</p>
              <p className="text-white font-medium">88%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[#1E293B] border border-gray-700 grid grid-cols-5 w-full max-w-3xl">
          <TabsTrigger value="requests" className="data-[state=active]:bg-[#00897B]">
            <Mail className="h-4 w-4 mr-2" />
            Requests
          </TabsTrigger>
          <TabsTrigger value="consents" className="data-[state=active]:bg-[#00897B]">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Consents
          </TabsTrigger>
          <TabsTrigger value="breaches" className="data-[state=active]:bg-[#00897B]">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Breaches
          </TabsTrigger>
          <TabsTrigger value="assessments" className="data-[state=active]:bg-[#00897B]">
            <ClipboardCheck className="h-4 w-4 mr-2" />
            PIAs
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-[#00897B]">
            <Lock className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Requests Tab */}
        <TabsContent value="requests" className="mt-4">
          <Card className="bg-[#1E293B] border-gray-700">
            <CardContent className="p-4">
              {/* Filters */}
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Search by name, email, phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-[#0F172A] border-gray-600 text-white"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-36 bg-[#0F172A] border-gray-600 text-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-36 bg-[#0F172A] border-gray-600 text-white">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="access">Access</SelectItem>
                    <SelectItem value="correction">Correction</SelectItem>
                    <SelectItem value="deletion">Deletion</SelectItem>
                    <SelectItem value="objection">Objection</SelectItem>
                    <SelectItem value="portability">Portability</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Request List */}
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {requests.map((request) => (
                    <div 
                      key={request.id}
                      className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                        request.isOverdue 
                          ? 'bg-red-500/10 border-red-500/30' 
                          : 'bg-[#0F172A] border-gray-700/50 hover:border-gray-600'
                      }`}
                      onClick={() => { setSelectedRequest(request); setRequestDialogOpen(true); }}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          request.requestType === 'deletion' ? 'bg-red-500/20 text-red-400' :
                          request.requestType === 'access' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-purple-500/20 text-purple-400'
                        }`}>
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-white">{request.requesterName}</p>
                            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 capitalize">
                              {getRequestTypeLabel(request.requestType)}
                            </Badge>
                            {request.isOverdue && (
                              <Badge className="bg-red-500/20 text-red-400 border-0 animate-pulse">
                                OVERDUE
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">
                            {request.requesterEmail} • Due: {formatDate(request.dueDate)}
                            {request.daysRemaining !== undefined && !request.isOverdue && (
                              <span className="ml-2">({request.daysRemaining} days left)</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {!request.identityVerified && (
                          <Badge className="bg-amber-500/20 text-amber-400 border-0">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            ID Unverified
                          </Badge>
                        )}
                        {getStatusBadge(request.status)}
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                  {requests.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No POPIA requests found</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Consents Tab */}
        <TabsContent value="consents" className="mt-4">
          <Card className="bg-[#1E293B] border-gray-700">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-base">Consent Records</CardTitle>
                <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C] text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Record Consent
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {consents.map((consent) => (
                    <div 
                      key={consent.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-[#0F172A] border border-gray-700/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          consent.status === 'active' ? 'bg-green-500/20 text-green-400' :
                          consent.status === 'withdrawn' ? 'bg-gray-500/20 text-gray-400' :
                          'bg-amber-500/20 text-amber-400'
                        }`}>
                          {consent.status === 'active' ? <CheckCircle2 className="h-5 w-5" /> : <Ban className="h-5 w-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-white">
                              {consent.userName || consent.userEmail || consent.userPhone || 'Anonymous'}
                            </p>
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 capitalize">
                              {consent.consentType.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-400">
                            Source: {consent.consentSource} • Legal Basis: {consent.legalBasis}
                          </p>
                          <p className="text-xs text-gray-400">
                            Granted: {formatDate(consent.grantedAt)}
                            {consent.expiresAt && ` • Expires: ${formatDate(consent.expiresAt)}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {getStatusBadge(consent.status)}
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                  {consents.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No consent records found</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Breaches Tab */}
        <TabsContent value="breaches" className="mt-4">
          <Card className="bg-[#1E293B] border-gray-700">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-base">Data Breach Register</CardTitle>
                <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Report Breach
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {breaches.map((breach) => (
                    <div 
                      key={breach.id}
                      className={`p-4 rounded-lg border ${
                        breach.severity === 'critical' || breach.severity === 'high'
                          ? 'bg-red-500/10 border-red-500/30'
                          : 'bg-[#0F172A] border-gray-700/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-medium">{breach.breachTitle}</h4>
                        <div className="flex items-center gap-2">
                          {getSeverityBadge(breach.severity)}
                          {getStatusBadge(breach.status)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">{breach.breachDescription}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Detected: {formatDate(breach.detectedAt)}</span>
                        <span>•</span>
                        <span>Records Affected: {breach.affectedRecords}</span>
                        <span>•</span>
                        <span>Subjects Affected: {breach.affectedDataSubjects}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        {breach.regulatorNotified ? (
                          <Badge className="bg-green-500/20 text-green-400 border-0">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Regulator Notified
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/20 text-amber-400 border-0">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Regulator Pending
                          </Badge>
                        )}
                        {breach.subjectsNotified ? (
                          <Badge className="bg-green-500/20 text-green-400 border-0">
                            <Users className="h-3 w-3 mr-1" />
                            Subjects Notified
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/20 text-amber-400 border-0">
                            <Users className="h-3 w-3 mr-1" />
                            Subjects Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {breaches.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                      <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No data breaches recorded</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Impact Assessments Tab */}
        <TabsContent value="assessments" className="mt-4">
          <Card className="bg-[#1E293B] border-gray-700">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-base">Privacy Impact Assessments</CardTitle>
                <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C] text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  New PIA
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {assessments.map((assessment) => (
                    <div 
                      key={assessment.id}
                      className="p-4 rounded-lg bg-[#0F172A] border border-gray-700/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-medium">{assessment.projectName}</h4>
                        <div className="flex items-center gap-2">
                          {getSeverityBadge(assessment.riskLevel)}
                          {getStatusBadge(assessment.status)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">{assessment.projectDescription}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Owner: {assessment.projectOwner}</span>
                        <span>•</span>
                        <span>Assessed: {formatDate(assessment.assessmentDate)}</span>
                      </div>
                    </div>
                  ))}
                  {assessments.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                      <ClipboardCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No privacy impact assessments</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-[#1E293B] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-base">Data Retention Policies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-[#0F172A] rounded-lg">
                  <div>
                    <p className="text-white text-sm font-medium">Consumer KYC Data</p>
                    <p className="text-xs text-gray-400">Identity documents and verification records</p>
                  </div>
                  <span className="text-[#00897B] font-medium">7 years</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#0F172A] rounded-lg">
                  <div>
                    <p className="text-white text-sm font-medium">Transaction Records</p>
                    <p className="text-xs text-gray-400">Payment and transaction history</p>
                  </div>
                  <span className="text-[#00897B] font-medium">5 years</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#0F172A] rounded-lg">
                  <div>
                    <p className="text-white text-sm font-medium">Consent Records</p>
                    <p className="text-xs text-gray-400">User consent and preferences</p>
                  </div>
                  <span className="text-[#00897B] font-medium">3 years</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#0F172A] rounded-lg">
                  <div>
                    <p className="text-white text-sm font-medium">Marketing Data</p>
                    <p className="text-xs text-gray-400">Campaign and engagement data</p>
                  </div>
                  <span className="text-[#00897B] font-medium">1 year</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1E293B] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-base">Compliance Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">Auto-notify on overdue</p>
                    <p className="text-xs text-gray-400">Send alerts when requests are overdue</p>
                  </div>
                  <Checkbox defaultChecked />
                </div>
                <Separator className="bg-gray-700" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">Weekend deadline extension</p>
                    <p className="text-xs text-gray-400">Extend deadlines falling on weekends</p>
                  </div>
                  <Checkbox defaultChecked />
                </div>
                <Separator className="bg-gray-700" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">Consent expiry warnings</p>
                    <p className="text-xs text-gray-400">Notify before consents expire</p>
                  </div>
                  <Checkbox defaultChecked />
                </div>
                <Separator className="bg-gray-700" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">Auto-archive completed</p>
                    <p className="text-xs text-gray-400">Archive requests after completion</p>
                  </div>
                  <Checkbox />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Request Detail Dialog */}
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1E293B] border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#00897B]" />
              POPIA Request Details
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Request ID: {selectedRequest?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {/* Request Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0F172A] p-3 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Request Type</p>
                  <p className="text-white font-medium">{getRequestTypeLabel(selectedRequest.requestType)}</p>
                </div>
                <div className="bg-[#0F172A] p-3 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Status</p>
                  {getStatusBadge(selectedRequest.status)}
                </div>
              </div>

              {/* Requester Info */}
              <div className="bg-[#0F172A] p-4 rounded-lg space-y-3">
                <h4 className="text-white font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-[#00897B]" />
                  Requester Information
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-400">Name</p>
                    <p className="text-white">{selectedRequest.requesterName}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Email</p>
                    <p className="text-white">{selectedRequest.requesterEmail}</p>
                  </div>
                  {selectedRequest.requesterPhone && (
                    <div>
                      <p className="text-gray-400">Phone</p>
                      <p className="text-white">{selectedRequest.requesterPhone}</p>
                    </div>
                  )}
                  {selectedRequest.requesterIdNumber && (
                    <div>
                      <p className="text-gray-400">ID Number</p>
                      <p className="text-white">{selectedRequest.requesterIdNumber}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-[#0F172A] p-4 rounded-lg space-y-3">
                <h4 className="text-white font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#00897B]" />
                  Timeline
                </h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Submitted</p>
                    <p className="text-white">{formatDate(selectedRequest.submittedAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-sm">Due Date</p>
                    <p className={selectedRequest.isOverdue ? 'text-red-400 font-medium' : 'text-white'}>
                      {formatDate(selectedRequest.dueDate)}
                    </p>
                  </div>
                </div>
                <Progress 
                  value={Math.max(0, Math.min(100, 100 - (selectedRequest.daysRemaining || 0) / 30 * 100))} 
                  className={`h-2 ${selectedRequest.isOverdue ? 'bg-red-900' : 'bg-gray-700'}`}
                />
                {selectedRequest.isOverdue && (
                  <p className="text-red-400 text-sm flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    This request is overdue by {Math.abs(selectedRequest.daysRemaining || 0)} days
                  </p>
                )}
              </div>

              {/* Description */}
              {selectedRequest.description && (
                <div className="bg-[#0F172A] p-4 rounded-lg">
                  <h4 className="text-white font-medium mb-2">Request Description</h4>
                  <p className="text-gray-300 text-sm">{selectedRequest.description}</p>
                </div>
              )}

              {/* Identity Verification */}
              <div className={`p-4 rounded-lg ${selectedRequest.identityVerified ? 'bg-green-500/10 border border-green-500/30' : 'bg-amber-500/10 border border-amber-500/30'}`}>
                <div className="flex items-center gap-2">
                  {selectedRequest.identityVerified ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                      <span className="text-green-400 font-medium">Identity Verified</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-amber-400" />
                      <span className="text-amber-400 font-medium">Identity Not Verified</span>
                    </>
                  )}
                </div>
                {!selectedRequest.identityVerified && (
                  <Button 
                    size="sm" 
                    className="mt-3 bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={() => {
                      setActionType('verify_identity')
                      setActionDialogOpen(true)
                    }}
                  >
                    Verify Identity
                  </Button>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {selectedRequest.status === 'pending' && (
                  <Button 
                    className="bg-[#00897B] hover:bg-[#00695C] text-white"
                    onClick={() => {
                      setActionType('start_processing')
                      setActionDialogOpen(true)
                    }}
                  >
                    Start Processing
                  </Button>
                )}
                {selectedRequest.status !== 'completed' && selectedRequest.status !== 'rejected' && (
                  <>
                    <Button 
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => {
                        setActionType('complete')
                        setActionDialogOpen(true)
                      }}
                    >
                      Complete Request
                    </Button>
                    <Button 
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      onClick={() => {
                        setActionType('extend_deadline')
                        setActionDialogOpen(true)
                      }}
                    >
                      Extend Deadline
                    </Button>
                    <Button 
                      variant="outline"
                      className="border-red-600 text-red-400 hover:bg-red-900/20"
                      onClick={() => {
                        setActionType('reject')
                        setActionDialogOpen(true)
                      }}
                    >
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="bg-[#1E293B] border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'verify_identity' && 'Verify Identity'}
              {actionType === 'start_processing' && 'Start Processing'}
              {actionType === 'complete' && 'Complete Request'}
              {actionType === 'extend_deadline' && 'Extend Deadline'}
              {actionType === 'reject' && 'Reject Request'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {actionType === 'reject' && (
              <div>
                <Label className="text-gray-300">Rejection Reason</Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter the reason for rejection..."
                  className="mt-2 bg-[#0F172A] border-gray-600 text-white"
                />
              </div>
            )}

            {['complete', 'extend_deadline'].includes(actionType) && (
              <div>
                <Label className="text-gray-300">Notes</Label>
                <Textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Add any notes..."
                  className="mt-2 bg-[#0F172A] border-gray-600 text-white"
                />
              </div>
            )}

            {actionType === 'extend_deadline' && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg">
                <p className="text-amber-400 text-sm">
                  The deadline will be extended by 30 days as permitted by POPIA. This extension can only be applied once.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              className="border-gray-600 text-gray-300"
              onClick={() => setActionDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              className={`${actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#00897B] hover:bg-[#00695C]'} text-white`}
              onClick={handleRequestAction}
              disabled={processing}
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
