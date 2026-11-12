'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Shield, AlertTriangle, Clock, CheckCircle, XCircle, FileText,
  User, Mail, Phone, Calendar, Search, Filter, Plus, Download,
  Eye, Edit2, Trash2, ChevronDown, ChevronRight, Send, Users,
  Database, Lock, FileCheck, AlertCircle, RefreshCw, MoreHorizontal,
  ClipboardList, UserCheck, Building2, MessageSquare, Bell
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// Types
interface POPIARequest {
  id: string
  requestType: 'access' | 'correction' | 'deletion' | 'objection' | 'portability'
  requesterName: string
  requesterEmail: string
  requesterPhone?: string
  requesterIdNumber?: string
  description?: string
  dataCategories?: string
  identityVerified: boolean
  identityVerifiedBy?: string
  identityVerifiedAt?: string
  status: 'pending' | 'processing' | 'completed' | 'rejected'
  assignedTo?: string
  assignedToName?: string
  assignedAt?: string
  submittedAt: string
  dueDate: string
  completedAt?: string
  responseNotes?: string
  rejectionReason?: string
  dataProvidedAt?: string
  dataDeletedAt?: string
  verifiedBy?: string
  verifiedByName?: string
  createdAt: string
  updatedAt: string
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
  status: 'active' | 'withdrawn' | 'expired'
  grantedAt: string
  withdrawnAt?: string
  withdrawnReason?: string
  ipAddress?: string
  userAgent?: string
  deviceType?: string
  location?: string
  legalBasis: string
  thirdParties?: string
  expiresAt?: string
  createdByName?: string
}

interface DocumentAccessLog {
  id: string
  documentType: string
  documentId: string
  documentName?: string
  accessedBy: string
  accessedByName: string
  accessedByRole: string
  action: string
  ipAddress?: string
  userAgent?: string
  reason?: string
  caseId?: string
  caseNumber?: string
  createdAt: string
}

// POPIA Request Types
const REQUEST_TYPES = [
  { value: 'access', label: 'Data Access', description: 'Request access to personal data' },
  { value: 'correction', label: 'Data Correction', description: 'Request correction of inaccurate data' },
  { value: 'deletion', label: 'Data Deletion', description: 'Request deletion of personal data' },
  { value: 'objection', label: 'Objection', description: 'Object to processing of personal data' },
  { value: 'portability', label: 'Data Portability', description: 'Request data in portable format' },
]

// Consent Types
const CONSENT_TYPES = [
  { value: 'marketing', label: 'Marketing Communications' },
  { value: 'data_processing', label: 'Data Processing' },
  { value: 'third_party_sharing', label: 'Third Party Sharing' },
  { value: 'cookies', label: 'Cookies & Tracking' },
  { value: 'location', label: 'Location Services' },
  { value: 'sms', label: 'SMS Notifications' },
  { value: 'email', label: 'Email Notifications' },
  { value: 'whatsapp', label: 'WhatsApp Communications' },
]

// Legal Basis Options
const LEGAL_BASIS_OPTIONS = [
  { value: 'consent', label: 'Consent' },
  { value: 'contract', label: 'Contract' },
  { value: 'legal_obligation', label: 'Legal Obligation' },
  { value: 'vital_interest', label: 'Vital Interest' },
  { value: 'public_task', label: 'Public Task' },
  { value: 'legitimate_interest', label: 'Legitimate Interest' },
]

// Status Colors
const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    case 'processing': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30'
    case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30'
    case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30'
    case 'withdrawn': return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    case 'expired': return 'bg-red-500/20 text-red-400 border-red-500/30'
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }
}

// Calculate days remaining
const getDaysRemaining = (dueDate: string) => {
  const due = new Date(dueDate)
  const now = new Date()
  const diffTime = due.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export default function POPIAComplianceView() {
  const [activeTab, setActiveTab] = useState('requests')
  const [requests, setRequests] = useState<POPIARequest[]>([])
  const [consents, setConsents] = useState<ConsentRecord[]>([])
  const [accessLogs, setAccessLogs] = useState<DocumentAccessLog[]>([])
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    overdueRequests: 0,
    completedThisMonth: 0,
    totalConsents: 0,
    activeConsents: 0,
    withdrawnConsents: 0,
    documentAccessCount: 0,
    avgResponseTime: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  // Dialogs
  const [newRequestOpen, setNewRequestOpen] = useState(false)
  const [viewRequestOpen, setViewRequestOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<POPIARequest | null>(null)
  const [newConsentOpen, setNewConsentOpen] = useState(false)

  // New request form
  const [newRequest, setNewRequest] = useState({
    requestType: 'access',
    requesterName: '',
    requesterEmail: '',
    requesterPhone: '',
    requesterIdNumber: '',
    description: '',
  })

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [requestsRes, consentsRes, logsRes, statsRes] = await Promise.all([
        fetch('/api/admin/popia/requests'),
        fetch('/api/admin/popia/consents'),
        fetch('/api/admin/popia/access-logs'),
        fetch('/api/admin/popia/stats'),
      ])

      if (requestsRes.ok) {
        const data = await requestsRes.json()
        setRequests(data.requests || [])
      }
      if (consentsRes.ok) {
        const data = await consentsRes.json()
        setConsents(data.consents || [])
      }
      if (logsRes.ok) {
        const data = await logsRes.json()
        setAccessLogs(data.logs || [])
      }
      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data.stats || stats)
      }
    } catch (error) {
      console.error('Error fetching POPIA data:', error)
      // Use demo data if API fails
      setDemoData()
    } finally {
      setIsLoading(false)
    }
  }, [])

  const setDemoData = () => {
    const now = new Date()
    const demoRequests: POPIARequest[] = [
      {
        id: 'popia_001',
        requestType: 'access',
        requesterName: 'John Smith',
        requesterEmail: 'john.smith@email.com',
        requesterPhone: '+27821234567',
        description: 'Requesting access to all personal data held by the company',
        identityVerified: true,
        status: 'pending',
        submittedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        dueDate: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'popia_002',
        requestType: 'deletion',
        requesterName: 'Sarah Johnson',
        requesterEmail: 'sarah.j@email.com',
        requesterPhone: '+27829876543',
        description: 'Please delete all my personal data as I am closing my account',
        identityVerified: true,
        status: 'processing',
        assignedTo: 'admin_001',
        assignedToName: 'Compliance Officer',
        submittedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        dueDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'popia_003',
        requestType: 'correction',
        requesterName: 'Michael Brown',
        requesterEmail: 'mbrown@email.com',
        description: 'My address is incorrect, please update it',
        identityVerified: true,
        status: 'completed',
        submittedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        dueDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'popia_004',
        requestType: 'objection',
        requesterName: 'Lisa Wilson',
        requesterEmail: 'lisa.w@email.com',
        description: 'I object to my data being used for marketing purposes',
        identityVerified: false,
        status: 'pending',
        submittedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        dueDate: new Date(now.getTime() + 27 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'popia_005',
        requestType: 'portability',
        requesterName: 'David Lee',
        requesterEmail: 'david.lee@email.com',
        description: 'Request data export in machine-readable format',
        identityVerified: true,
        status: 'rejected',
        rejectionReason: 'Unable to verify identity - ID document expired',
        submittedAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]

    const demoConsents: ConsentRecord[] = [
      {
        id: 'consent_001',
        userEmail: 'user1@email.com',
        userName: 'Alice Cooper',
        consentType: 'marketing',
        consentSource: 'website',
        status: 'active',
        grantedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        legalBasis: 'consent',
        ipAddress: '192.168.1.1',
        deviceType: 'desktop',
      },
      {
        id: 'consent_002',
        userEmail: 'user2@email.com',
        userName: 'Bob Martin',
        consentType: 'whatsapp',
        consentSource: 'mobile_app',
        status: 'active',
        grantedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        legalBasis: 'consent',
        ipAddress: '10.0.0.1',
        deviceType: 'mobile',
      },
      {
        id: 'consent_003',
        userEmail: 'user3@email.com',
        userName: 'Carol Davis',
        consentType: 'data_processing',
        consentSource: 'in_store',
        status: 'withdrawn',
        grantedAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        withdrawnAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        withdrawnReason: 'No longer using the service',
        legalBasis: 'consent',
      },
    ]

    setRequests(demoRequests)
    setConsents(demoConsents)
    setStats({
      totalRequests: 5,
      pendingRequests: 2,
      overdueRequests: 0,
      completedThisMonth: 1,
      totalConsents: 3,
      activeConsents: 2,
      withdrawnConsents: 1,
      documentAccessCount: 156,
      avgResponseTime: 18,
    })
  }

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Filter requests
  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.requesterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.requesterEmail.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter
    const matchesType = typeFilter === 'all' || request.requestType === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  // Handle create request
  const handleCreateRequest = async () => {
    try {
      const response = await fetch('/api/admin/popia/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRequest),
      })
      if (response.ok) {
        fetchData()
        setNewRequestOpen(false)
        setNewRequest({
          requestType: 'access',
          requesterName: '',
          requesterEmail: '',
          requesterPhone: '',
          requesterIdNumber: '',
          description: '',
        })
      }
    } catch (error) {
      console.error('Error creating request:', error)
    }
  }

  // Handle update request status
  const handleUpdateStatus = async (requestId: string, status: string, notes?: string) => {
    try {
      await fetch('/api/admin/popia/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: requestId, status, responseNotes: notes }),
      })
      fetchData()
    } catch (error) {
      console.error('Error updating request:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="h-6 w-6 text-[#00897B]" />
            POPIA Compliance Center
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Protection of Personal Information Act compliance management
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchData}
            disabled={isLoading}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            size="sm" 
            className="bg-[#00897B] hover:bg-[#00796B]"
            onClick={() => setNewRequestOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-[#1E293B] border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Requests</CardTitle>
            <FileText className="h-4 w-4 text-[#00897B]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalRequests}</div>
            <p className="text-xs text-gray-400 mt-1">{stats.pendingRequests} pending</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1E293B] border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.overdueRequests}</div>
            <p className="text-xs text-amber-400 mt-1">Past 30-day deadline</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1E293B] border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Active Consents</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.activeConsents}</div>
            <p className="text-xs text-gray-400 mt-1">{stats.withdrawnConsents} withdrawn</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1E293B] border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-[#00897B]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.avgResponseTime} days</div>
            <div className="mt-2">
              <Progress value={(stats.avgResponseTime / 30) * 100} className="h-1.5 bg-gray-700" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#1E293B] border-gray-700">
          <TabsTrigger value="requests" className="data-[state=active]:bg-[#00897B]">
            <FileText className="h-4 w-4 mr-2" />
            Data Requests
          </TabsTrigger>
          <TabsTrigger value="consents" className="data-[state=active]:bg-[#00897B]">
            <UserCheck className="h-4 w-4 mr-2" />
            Consent Management
          </TabsTrigger>
          <TabsTrigger value="access-logs" className="data-[state=active]:bg-[#00897B]">
            <Database className="h-4 w-4 mr-2" />
            Access Logs
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-[#00897B]">
            <Lock className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Data Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#1E293B] border-gray-600 text-white"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] bg-[#1E293B] border-gray-600 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#1E293B] border-gray-600 text-white">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px] bg-[#1E293B] border-gray-600 text-white">
                <SelectValue placeholder="Request Type" />
              </SelectTrigger>
              <SelectContent className="bg-[#1E293B] border-gray-600 text-white">
                <SelectItem value="all">All Types</SelectItem>
                {REQUEST_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Requests Table */}
          <Card className="bg-[#1E293B] border-gray-700">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700 hover:bg-gray-800/50">
                    <TableHead className="text-gray-400">Requester</TableHead>
                    <TableHead className="text-gray-400">Type</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400">Days Left</TableHead>
                    <TableHead className="text-gray-400">Submitted</TableHead>
                    <TableHead className="text-gray-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                        No requests found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRequests.map((request) => {
                      const daysRemaining = getDaysRemaining(request.dueDate)
                      const isOverdue = daysRemaining < 0
                      const isUrgent = daysRemaining >= 0 && daysRemaining <= 7

                      return (
                        <TableRow key={request.id} className="border-gray-700 hover:bg-gray-800/50">
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-white font-medium">{request.requesterName}</span>
                              <span className="text-gray-400 text-sm">{request.requesterEmail}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-gray-600 text-gray-300">
                              {REQUEST_TYPES.find(t => t.value === request.requestType)?.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(request.status)}>
                              {request.status}
                            </Badge>
                            {!request.identityVerified && request.status === 'pending' && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <AlertCircle className="h-4 w-4 text-amber-400 ml-2 inline" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Identity not verified</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'text-gray-300'}`}>
                              <Clock className="h-4 w-4" />
                              <span>{isOverdue ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days`}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {new Date(request.submittedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                                      onClick={() => {
                                        setSelectedRequest(request)
                                        setViewRequestOpen(true)
                                      }}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>View Details</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-white">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-[#1E293B] border-gray-600 text-white">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator className="bg-gray-700" />
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(request.id, 'processing')}>
                                    Start Processing
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(request.id, 'completed')}>
                                    Mark Complete
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(request.id, 'rejected')}>
                                    Reject
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-gray-700" />
                                  <DropdownMenuItem className="text-red-400">
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Consent Management Tab */}
        <TabsContent value="consents" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Consent Records</h3>
            <Button size="sm" className="bg-[#00897B] hover:bg-[#00796B]" onClick={() => setNewConsentOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Record Consent
            </Button>
          </div>

          <Card className="bg-[#1E293B] border-gray-700">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700 hover:bg-gray-800/50">
                    <TableHead className="text-gray-400">User</TableHead>
                    <TableHead className="text-gray-400">Consent Type</TableHead>
                    <TableHead className="text-gray-400">Source</TableHead>
                    <TableHead className="text-gray-400">Legal Basis</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400">Granted</TableHead>
                    <TableHead className="text-gray-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                        No consent records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    consents.map((consent) => (
                      <TableRow key={consent.id} className="border-gray-700 hover:bg-gray-800/50">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-white">{consent.userName || 'Unknown'}</span>
                            <span className="text-gray-400 text-sm">{consent.userEmail || consent.userPhone}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-gray-600 text-gray-300">
                            {CONSENT_TYPES.find(t => t.value === consent.consentType)?.label || consent.consentType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-300">{consent.consentSource}</TableCell>
                        <TableCell className="text-gray-300">
                          {LEGAL_BASIS_OPTIONS.find(b => b.value === consent.legalBasis)?.label || consent.legalBasis}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(consent.status)}>
                            {consent.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {new Date(consent.grantedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-white">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-[#1E293B] border-gray-600 text-white">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator className="bg-gray-700" />
                              <DropdownMenuItem>View Details</DropdownMenuItem>
                              <DropdownMenuItem>Withdraw Consent</DropdownMenuItem>
                              <DropdownMenuItem>Export Record</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Access Logs Tab */}
        <TabsContent value="access-logs" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Document Access Logs</h3>
            <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
              <Download className="h-4 w-4 mr-2" />
              Export Logs
            </Button>
          </div>

          <Card className="bg-[#1E293B] border-gray-700">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700 hover:bg-gray-800/50">
                    <TableHead className="text-gray-400">Document</TableHead>
                    <TableHead className="text-gray-400">Accessed By</TableHead>
                    <TableHead className="text-gray-400">Action</TableHead>
                    <TableHead className="text-gray-400">IP Address</TableHead>
                    <TableHead className="text-gray-400">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accessLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                        No access logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    accessLogs.slice(0, 10).map((log) => (
                      <TableRow key={log.id} className="border-gray-700 hover:bg-gray-800/50">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-white">{log.documentName || log.documentType}</span>
                            <span className="text-gray-400 text-sm">{log.documentId}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-white">{log.accessedByName}</span>
                            <span className="text-gray-400 text-sm">{log.accessedByRole}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-gray-600 text-gray-300">
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-300">{log.ipAddress || '-'}</TableCell>
                        <TableCell className="text-gray-300">
                          {new Date(log.createdAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card className="bg-[#1E293B] border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">POPIA Compliance Settings</CardTitle>
              <CardDescription className="text-gray-400">
                Configure data protection and privacy settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-white font-medium flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-[#00897B]" />
                  Data Retention
                </h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Customer Data Retention (years)</Label>
                    <Input type="number" defaultValue={7} className="bg-[#0F172A] border-gray-600 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Transaction Data Retention (years)</Label>
                    <Input type="number" defaultValue={5} className="bg-[#0F172A] border-gray-600 text-white" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-white font-medium flex items-center gap-2">
                  <Bell className="h-4 w-4 text-[#00897B]" />
                  Notifications
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-300">Request Deadline Reminders</Label>
                      <p className="text-gray-400 text-sm">Get notified 7 days before deadline</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-300">Overdue Alerts</Label>
                      <p className="text-gray-400 text-sm">Daily alerts for overdue requests</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-300">Consent Withdrawal Notifications</Label>
                      <p className="text-gray-400 text-sm">Alert when a user withdraws consent</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-white font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#00897B]" />
                  Information Officer
                </h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Information Officer Name</Label>
                    <Input placeholder="Enter name" className="bg-[#0F172A] border-gray-600 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Contact Email</Label>
                    <Input type="email" placeholder="popia@company.co.za" className="bg-[#0F172A] border-gray-600 text-white" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                  Cancel
                </Button>
                <Button className="bg-[#00897B] hover:bg-[#00796B]">
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Request Dialog */}
      <Dialog open={newRequestOpen} onOpenChange={setNewRequestOpen}>
        <DialogContent className="bg-[#1E293B] border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>New POPIA Request</DialogTitle>
            <DialogDescription className="text-gray-400">
              Create a new data subject request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Request Type</Label>
              <Select value={newRequest.requestType} onValueChange={(v) => setNewRequest({...newRequest, requestType: v})}>
                <SelectTrigger className="bg-[#0F172A] border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1E293B] border-gray-600 text-white">
                  {REQUEST_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div>{type.label}</div>
                        <div className="text-xs text-gray-400">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Requester Name</Label>
              <Input
                value={newRequest.requesterName}
                onChange={(e) => setNewRequest({...newRequest, requesterName: e.target.value})}
                className="bg-[#0F172A] border-gray-600 text-white"
                placeholder="Full name"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Email</Label>
              <Input
                type="email"
                value={newRequest.requesterEmail}
                onChange={(e) => setNewRequest({...newRequest, requesterEmail: e.target.value})}
                className="bg-[#0F172A] border-gray-600 text-white"
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Phone (Optional)</Label>
              <Input
                value={newRequest.requesterPhone}
                onChange={(e) => setNewRequest({...newRequest, requesterPhone: e.target.value})}
                className="bg-[#0F172A] border-gray-600 text-white"
                placeholder="+27"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Description</Label>
              <Textarea
                value={newRequest.description}
                onChange={(e) => setNewRequest({...newRequest, description: e.target.value})}
                className="bg-[#0F172A] border-gray-600 text-white"
                placeholder="Describe the request..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700" onClick={() => setNewRequestOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-[#00897B] hover:bg-[#00796B]" onClick={handleCreateRequest}>
              Create Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Request Dialog */}
      <Dialog open={viewRequestOpen} onOpenChange={setViewRequestOpen}>
        <DialogContent className="bg-[#1E293B] border-gray-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#00897B]" />
              Request Details
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{selectedRequest.requesterName}</h3>
                  <p className="text-gray-400">{selectedRequest.requesterEmail}</p>
                </div>
                <Badge className={getStatusColor(selectedRequest.status)}>
                  {selectedRequest.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-gray-400 text-sm">Request Type</Label>
                  <p className="text-white">{REQUEST_TYPES.find(t => t.value === selectedRequest.requestType)?.label}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-400 text-sm">Days Remaining</Label>
                  <p className={`font-medium ${getDaysRemaining(selectedRequest.dueDate) < 0 ? 'text-red-400' : 'text-white'}`}>
                    {getDaysRemaining(selectedRequest.dueDate)} days
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-400 text-sm">Submitted</Label>
                  <p className="text-white">{new Date(selectedRequest.submittedAt).toLocaleDateString()}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-400 text-sm">Due Date</Label>
                  <p className="text-white">{new Date(selectedRequest.dueDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-gray-400 text-sm">Description</Label>
                <p className="text-white bg-[#0F172A] p-3 rounded-lg">{selectedRequest.description || 'No description provided'}</p>
              </div>

              {selectedRequest.identityVerified && (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  <span>Identity verified</span>
                </div>
              )}

              {selectedRequest.responseNotes && (
                <div className="space-y-1">
                  <Label className="text-gray-400 text-sm">Response Notes</Label>
                  <p className="text-white bg-[#0F172A] p-3 rounded-lg">{selectedRequest.responseNotes}</p>
                </div>
              )}

              {selectedRequest.rejectionReason && (
                <div className="space-y-1">
                  <Label className="text-gray-400 text-sm">Rejection Reason</Label>
                  <p className="text-red-400 bg-[#0F172A] p-3 rounded-lg">{selectedRequest.rejectionReason}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700" onClick={() => setViewRequestOpen(false)}>
              Close
            </Button>
            {selectedRequest?.status === 'pending' && (
              <Button className="bg-[#00897B] hover:bg-[#00796B]" onClick={() => {
                handleUpdateStatus(selectedRequest.id, 'processing')
                setViewRequestOpen(false)
              }}>
                Start Processing
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Consent Dialog */}
      <Dialog open={newConsentOpen} onOpenChange={setNewConsentOpen}>
        <DialogContent className="bg-[#1E293B] border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Record Consent</DialogTitle>
            <DialogDescription className="text-gray-400">
              Record a new user consent
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">User Name</Label>
              <Input className="bg-[#0F172A] border-gray-600 text-white" placeholder="Full name" />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Email</Label>
              <Input type="email" className="bg-[#0F172A] border-gray-600 text-white" placeholder="email@example.com" />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Consent Type</Label>
              <Select>
                <SelectTrigger className="bg-[#0F172A] border-gray-600 text-white">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-[#1E293B] border-gray-600 text-white">
                  {CONSENT_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Legal Basis</Label>
              <Select>
                <SelectTrigger className="bg-[#0F172A] border-gray-600 text-white">
                  <SelectValue placeholder="Select basis" />
                </SelectTrigger>
                <SelectContent className="bg-[#1E293B] border-gray-600 text-white">
                  {LEGAL_BASIS_OPTIONS.map(basis => (
                    <SelectItem key={basis.value} value={basis.value}>{basis.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Source</Label>
              <Select>
                <SelectTrigger className="bg-[#0F172A] border-gray-600 text-white">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent className="bg-[#1E293B] border-gray-600 text-white">
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="mobile_app">Mobile App</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="in_store">In-Store</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700" onClick={() => setNewConsentOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-[#00897B] hover:bg-[#00796B]" onClick={() => setNewConsentOpen(false)}>
              Record Consent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
