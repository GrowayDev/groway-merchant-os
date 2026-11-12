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
import { toast } from 'sonner'
import { 
  FileCheck,
  UserCheck,
  Building2,
  AlertTriangle,
  FileText,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Download,
  Calendar,
  Shield,
  Database,
  RefreshCw,
  Send,
  ChevronRight,
  User,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  IdCard,
  Home,
  Briefcase,
  FileImage,
  AlertCircle,
  History,
  ExternalLink,
  Loader2,
  Trash2,
  RotateCcw,
  UserPlus,
  Ban
} from 'lucide-react'

// Types
interface DocumentUser {
  id: string
  firstName?: string
  lastName?: string
  phone: string
  email?: string
  idNumber?: string
  dateOfBirth?: string
  kycStatus: string
  kycLevel: number
  kycVerifiedAt?: Date
  accountStatus: string
}

interface DocumentMerchant {
  id: string
  businessName: string
  tradingName?: string
  registrationNumber?: string
  vatNumber?: string
  kycStatus: string
  kybStatus: string
  riskScore: number
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  addressStreet?: string
  addressCity?: string
  addressProvince?: string
  addressPostalCode?: string
  tier: string
  status: string
}

interface Document {
  id: string
  documentType: string
  documentCategory?: string
  fileName: string
  fileUrl: string
  fileSize?: number
  fileType?: string
  status: string
  uploadedAt?: Date
  verifiedBy?: string
  verifiedByName?: string
  verifiedAt?: Date
  verificationNotes?: string
  rejectionReason?: string
  documentNumber?: string
  documentCountry?: string
  issueDate?: string
  expiryDate?: string
  extractedData?: string
  isClear?: boolean
  isComplete?: boolean
  isExpired?: boolean
  tamperScore?: number
  reviewAssignedTo?: string
  reviewAssignedAt?: Date
  reviewPriority?: string
  createdAt: Date
  updatedAt: Date
  documentSource: string
  entityName: string
  entityType: string
  ConsumerUser?: DocumentUser
  AdminMerchant?: DocumentMerchant
}

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
}

interface AMLAlert {
  id: string
  type: string
  entityName: string
  entityType: string
  triggeredAt: string
  severity: string
  status: string
  matchScore: number
  details: string
}

interface AccessLog {
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
  createdAt: Date
}

interface DocumentStats {
  consumer: { pending: number; verified: number; rejected: number }
  merchant: { pending: number; verified: number; rejected: number }
  totalPending: number
  totalVerified: number
  totalRejected: number
}

export default function ComplianceCenter() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [documents, setDocuments] = useState<Document[]>([])
  const [stats, setStats] = useState<DocumentStats | null>(null)
  const [popiaRequests, setPopiaRequests] = useState<POPIARequest[]>([])
  const [amlAlerts, setAmlAlerts] = useState<AMLAlert[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterSource, setFilterSource] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  
  // Document detail dialog
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [documentAccessLogs, setDocumentAccessLogs] = useState<AccessLog[]>([])
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false)
  const [documentLoading, setDocumentLoading] = useState(false)
  const [verificationNotes, setVerificationNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [extractedData, setExtractedData] = useState<Record<string, string>>({})
  
  // POPIA dialog
  const [selectedPOPIA, setSelectedPOPIA] = useState<POPIARequest | null>(null)
  const [popiaDialogOpen, setPopiaDialogOpen] = useState(false)
  
  // AML dialog
  const [selectedAML, setSelectedAML] = useState<AMLAlert | null>(null)
  const [amlDialogOpen, setAmlDialogOpen] = useState(false)

  // Fetch functions
  const fetchDocuments = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.append('status', filterStatus)
      if (filterSource !== 'all') params.append('documentType', filterSource)
      if (filterPriority !== 'all') params.append('priority', filterPriority)
      if (searchQuery) params.append('search', searchQuery)
      params.append('limit', '100')

      const response = await fetch(`/api/admin/documents?${params}`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    }
  }, [filterStatus, filterSource, filterPriority, searchQuery])

  const fetchPOPIARequests = async () => {
    try {
      const response = await fetch('/api/admin/compliance?type=popia')
      if (response.ok) {
        const data = await response.json()
        // Mock data for now
        setPopiaRequests([
          {
            id: 'popia-001',
            requestType: 'access',
            requesterName: 'Jane Smith',
            requesterEmail: 'jane.smith@email.com',
            requesterPhone: '+27821234500',
            description: 'Requesting access to all personal data held by Groways',
            identityVerified: false,
            status: 'pending',
            submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
          },
          {
            id: 'popia-002',
            requestType: 'deletion',
            requesterName: 'Michael Brown',
            requesterEmail: 'm.brown@email.com',
            description: 'Requesting deletion of all my personal data',
            identityVerified: true,
            status: 'processing',
            submittedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          },
        ])
      }
    } catch (error) {
      console.error('Error fetching POPIA requests:', error)
    }
  }

  const fetchAMLAlerts = async () => {
    try {
      const response = await fetch('/api/admin/compliance?type=aml')
      if (response.ok) {
        // Mock data
        setAmlAlerts([
          {
            id: 'aml-001',
            type: 'sanctions',
            entityName: 'International Traders SA',
            entityType: 'organization',
            triggeredAt: new Date().toISOString(),
            severity: 'critical',
            status: 'new',
            matchScore: 95,
            details: 'Potential match with EU sanctions list - Company Directors'
          },
          {
            id: 'aml-002',
            type: 'pep',
            entityName: 'Mohammed Al-Farsi',
            entityType: 'individual',
            triggeredAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            severity: 'high',
            status: 'investigating',
            matchScore: 78,
            details: 'Potential Politically Exposed Person match - Foreign Government Official'
          },
        ])
      }
    } catch (error) {
      console.error('Error fetching AML alerts:', error)
    }
  }

  // Initial fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchDocuments(), fetchPOPIARequests(), fetchAMLAlerts()])
      setLoading(false)
    }
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Seed demo data
  const seedDemoData = async () => {
    try {
      const response = await fetch('/api/admin/documents/seed', { method: 'POST' })
      if (response.ok) {
        toast.success('Demo data seeded successfully')
        fetchDocuments()
        fetchPOPIARequests()
        fetchAMLAlerts()
      }
    } catch {
      toast.error('Failed to seed demo data')
    }
  }

  // Fetch document details
  const fetchDocumentDetails = async (doc: Document) => {
    setDocumentLoading(true)
    try {
      const response = await fetch(`/api/admin/documents/${doc.id}?documentSource=${doc.documentSource}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedDocument(data.document)
        setDocumentAccessLogs(data.accessLogs || [])
        if (data.document.extractedData) {
          try {
            setExtractedData(JSON.parse(data.document.extractedData))
          } catch {
            setExtractedData({})
          }
        }
        setDocumentDialogOpen(true)
      }
    } catch (error) {
      console.error('Error fetching document details:', error)
    }
    setDocumentLoading(false)
  }

  // Handle document action
  const handleDocumentAction = async (action: string) => {
    if (!selectedDocument) return

    try {
      const body: Record<string, unknown> = {
        action,
        documentSource: selectedDocument.documentSource,
        verifiedBy: 'admin',
        verifiedByName: 'Admin User',
      }

      if (action === 'verify') {
        body.notes = verificationNotes
        body.extractedData = extractedData
      } else if (action === 'reject') {
        body.rejectionReason = rejectionReason
      } else if (action === 'request_resubmission') {
        body.notes = verificationNotes
      }

      const response = await fetch(`/api/admin/documents/${selectedDocument.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        toast.success(`Document ${action}ed successfully`)
        setDocumentDialogOpen(false)
        fetchDocuments()
        setVerificationNotes('')
        setRejectionReason('')
        setExtractedData({})
      } else {
        toast.error('Action failed')
      }
    } catch {
      toast.error('Action failed')
    }
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      under_review: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      verified: 'bg-green-500/20 text-green-400 border-green-500/30',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
      expired: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      new: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      investigating: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      cleared: 'bg-green-500/20 text-green-400 border-green-500/30',
      escalated: 'bg-red-500/20 text-red-400 border-red-500/30',
      processing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      completed: 'bg-green-500/20 text-green-400 border-green-500/30',
    }
    return <Badge className={`${styles[status] || 'bg-gray-500/20 text-gray-400'} border capitalize`}>
      {status.replace('_', ' ')}
    </Badge>
  }

  // Get priority badge
  const getPriorityBadge = (priority?: string) => {
    if (!priority) return null
    const styles: Record<string, string> = {
      low: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      normal: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      high: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      urgent: 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse',
    }
    return <Badge className={`${styles[priority] || ''} border capitalize`}>{priority}</Badge>
  }

  // Get severity badge for AML
  const getSeverityBadge = (severity: string) => {
    const styles: Record<string, string> = {
      low: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      medium: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      high: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      critical: 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse',
    }
    return <Badge className={`${styles[severity]} border capitalize`}>{severity}</Badge>
  }

  // Get document type label
  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      sa_id: 'SA ID Document',
      passport: 'Passport',
      proof_of_address: 'Proof of Address',
      selfie: 'Selfie Verification',
      bank_statement: 'Bank Statement',
      proof_of_income: 'Proof of Income',
    }
    return labels[type] || type
  }

  // Get document type icon
  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'sa_id':
      case 'passport':
        return <IdCard className="h-5 w-5" />
      case 'proof_of_address':
        return <Home className="h-5 w-5" />
      case 'selfie':
        return <User className="h-5 w-5" />
      case 'bank_statement':
      case 'proof_of_income':
        return <FileText className="h-5 w-5" />
      default:
        return <FileImage className="h-5 w-5" />
    }
  }

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Format date
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString('en-ZA', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Stats cards
  const statsCards = stats ? [
    { label: 'Pending Review', value: stats.totalPending, icon: Clock, color: '#F59E0B' },
    { label: 'Verified', value: stats.totalVerified, icon: CheckCircle2, color: '#10B981' },
    { label: 'Rejected', value: stats.totalRejected, icon: XCircle, color: '#EF4444' },
    { label: 'Consumer Docs', value: stats.consumer.pending, icon: User, color: '#8B5CF6' },
    { label: 'Merchant Docs', value: stats.merchant.pending, icon: Building2, color: '#3B82F6' },
    { label: 'POPIA Requests', value: popiaRequests.filter(r => r.status === 'pending').length, icon: FileText, color: '#EC4899' },
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
            Compliance Center
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            KYC, KYB, POPIA, AML monitoring and document verification
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
            onClick={() => { fetchDocuments(); fetchPOPIARequests(); fetchAMLAlerts(); }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            size="sm"
            className="bg-[#00897B] hover:bg-[#00695C] text-white"
            onClick={seedDemoData}
          >
            <Database className="h-4 w-4 mr-2" />
            Seed Demo Data
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[#1E293B] border border-gray-700 grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="overview" className="data-[state=active]:bg-[#00897B]">Overview</TabsTrigger>
          <TabsTrigger value="documents" className="data-[state=active]:bg-[#00897B]">Documents</TabsTrigger>
          <TabsTrigger value="popia" className="data-[state=active]:bg-[#00897B]">POPIA</TabsTrigger>
          <TabsTrigger value="aml" className="data-[state=active]:bg-[#00897B]">AML</TabsTrigger>
          <TabsTrigger value="sars" className="data-[state=active]:bg-[#00897B]">SARS</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Pending Documents */}
            <Card className="bg-[#1E293B] border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-400" />
                  Documents Pending Review
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80">
                  <div className="space-y-2">
                    {documents.filter(d => d.status === 'pending' || d.status === 'under_review').slice(0, 10).map((doc) => (
                      <div 
                        key={doc.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-[#0F172A] border border-gray-700/50 cursor-pointer hover:border-gray-600 transition-colors"
                        onClick={() => fetchDocumentDetails(doc)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            doc.reviewPriority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                            doc.reviewPriority === 'high' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {getDocumentTypeIcon(doc.documentType)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{doc.entityName}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-400">{getDocumentTypeLabel(doc.documentType)}</span>
                              {getPriorityBadge(doc.reviewPriority)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(doc.status)}
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    ))}
                    {documents.filter(d => d.status === 'pending').length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        <FileCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No pending documents</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-[#1E293B] border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <History className="h-4 w-4 text-[#00897B]" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80">
                  <div className="space-y-3">
                    {documentAccessLogs.slice(0, 10).map((log, idx) => (
                      <div key={log.id || idx} className="flex items-start gap-3 p-3 rounded-lg bg-[#0F172A]">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          log.action === 'verify' ? 'bg-green-500/20 text-green-400' :
                          log.action === 'reject' ? 'bg-red-500/20 text-red-400' :
                          log.action === 'upload' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {log.action === 'verify' ? <CheckCircle2 className="h-4 w-4" /> :
                           log.action === 'reject' ? <XCircle className="h-4 w-4" /> :
                           log.action === 'upload' ? <FileText className="h-4 w-4" /> :
                           <Eye className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-white capitalize">
                            {log.action} - {log.documentName}
                          </p>
                          <p className="text-xs text-gray-400">
                            By {log.accessedByName} • {formatDate(log.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {documentAccessLogs.length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No recent activity</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Compliance Metrics */}
          <Card className="bg-[#1E293B] border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <BarChart className="h-4 w-4 text-[#00897B]" />
                Compliance Metrics (This Month)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#0F172A] rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">KYC Approval Rate</p>
                  <p className="text-2xl font-bold text-white">94.2%</p>
                  <Progress value={94.2} className="h-1 mt-2 bg-gray-700" />
                </div>
                <div className="bg-[#0F172A] rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">Avg Verification Time</p>
                  <p className="text-2xl font-bold text-white">2.3 days</p>
                  <p className="text-xs text-green-400 mt-1">-0.5 days vs last month</p>
                </div>
                <div className="bg-[#0F172A] rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">POPIA Compliance</p>
                  <p className="text-2xl font-bold text-white">100%</p>
                  <p className="text-xs text-gray-400 mt-1">Within 30-day SLA</p>
                </div>
                <div className="bg-[#0F172A] rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">AML False Positives</p>
                  <p className="text-2xl font-bold text-white">12%</p>
                  <p className="text-xs text-amber-400 mt-1">+2% vs last month</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-4">
          <Card className="bg-[#1E293B] border-gray-700">
            <CardContent className="p-4">
              {/* Filters */}
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Search documents..."
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
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterSource} onValueChange={setFilterSource}>
                  <SelectTrigger className="w-36 bg-[#0F172A] border-gray-600 text-white">
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="consumer_kyc">Consumer KYC</SelectItem>
                    <SelectItem value="merchant_document">Merchant</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-32 bg-[#0F172A] border-gray-600 text-white">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Document List */}
              <ScrollArea className="h-[600px]">
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div 
                      key={doc.id}
                      className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                        doc.status === 'rejected' ? 'bg-red-500/10 border-red-500/30' :
                        doc.status === 'verified' ? 'bg-green-500/10 border-green-500/30' :
                        doc.reviewPriority === 'urgent' ? 'bg-red-500/10 border-red-500/30' :
                        'bg-[#0F172A] border-gray-700/50 hover:border-gray-600'
                      }`}
                      onClick={() => fetchDocumentDetails(doc)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          doc.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                          doc.status === 'verified' ? 'bg-green-500/20 text-green-400' :
                          doc.entityType === 'consumer' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {getDocumentTypeIcon(doc.documentType)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-white">{doc.entityName}</p>
                            {doc.reviewPriority === 'urgent' && (
                              <Badge className="bg-red-500/20 text-red-400 border-0 animate-pulse">URGENT</Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">
                            {getDocumentTypeLabel(doc.documentType)} • {formatFileSize(doc.fileSize)} • {formatDate(doc.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {getStatusBadge(doc.status)}
                        {getPriorityBadge(doc.reviewPriority)}
                        <Badge className={`${doc.entityType === 'consumer' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'} border-0 capitalize`}>
                          {doc.entityType}
                        </Badge>
                        <Button 
                          size="sm"
                          className="bg-[#00897B] hover:bg-[#00695C] text-white"
                          onClick={(e) => { e.stopPropagation(); fetchDocumentDetails(doc); }}
                        >
                          Review
                        </Button>
                      </div>
                    </div>
                  ))}
                  {documents.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                      <FileCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No documents found</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={seedDemoData}
                      >
                        Seed Demo Data
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* POPIA Tab */}
        <TabsContent value="popia" className="mt-4">
          <Card className="bg-[#1E293B] border-gray-700">
            <CardContent className="p-4">
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {popiaRequests.map((request) => (
                    <div 
                      key={request.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-[#0F172A] border border-gray-700/50 cursor-pointer hover:border-gray-600"
                      onClick={() => { setSelectedPOPIA(request); setPopiaDialogOpen(true); }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-white">{request.requesterName}</p>
                            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 capitalize">
                              {request.requestType}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-400">
                            {request.requesterEmail} • Due: {formatDate(request.dueDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {getStatusBadge(request.status)}
                        {!request.identityVerified && (
                          <Badge className="bg-amber-500/20 text-amber-400 border-0">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            ID Unverified
                          </Badge>
                        )}
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AML Tab */}
        <TabsContent value="aml" className="mt-4">
          <Card className="bg-[#1E293B] border-gray-700">
            <CardContent className="p-4">
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {amlAlerts.map((alert) => (
                    <div 
                      key={alert.id}
                      className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                        alert.severity === 'critical' 
                          ? 'bg-red-500/10 border-red-500/30 hover:border-red-500/50' 
                          : alert.severity === 'high'
                          ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50'
                          : 'bg-[#0F172A] border-gray-700/50 hover:border-gray-600'
                      }`}
                      onClick={() => { setSelectedAML(alert); setAmlDialogOpen(true); }}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          alert.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                          alert.severity === 'high' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-white">{alert.entityName}</p>
                            {getSeverityBadge(alert.severity)}
                          </div>
                          <p className="text-xs text-gray-400">
                            {alert.type.replace('_', ' ')} • Match Score: {alert.matchScore}%
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {getStatusBadge(alert.status)}
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SARS Tab */}
        <TabsContent value="sars" className="mt-4">
          <Card className="bg-[#1E293B] border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-400" />
                SARS Reporting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-[#0F172A] rounded-lg p-4 border border-gray-700">
                  <h4 className="text-sm font-medium text-white mb-3">VAT 201 Submissions</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Current Period</span>
                      <span className="text-white">Feb 2026</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Due Date</span>
                      <span className="text-amber-400">Mar 25, 2026</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status</span>
                      <Badge className="bg-green-500/20 text-green-400">Ready to Submit</Badge>
                    </div>
                  </div>
                  <Button className="w-full mt-4 bg-[#00897B] hover:bg-[#00695C] text-white">
                    Generate VAT 201
                  </Button>
                </div>

                <div className="bg-[#0F172A] rounded-lg p-4 border border-gray-700">
                  <h4 className="text-sm font-medium text-white mb-3">IRP5 Reconciliations</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tax Year</span>
                      <span className="text-white">2025/2026</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Employees</span>
                      <span className="text-white">1,247</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status</span>
                      <Badge className="bg-amber-500/20 text-amber-400">In Progress</Badge>
                    </div>
                  </div>
                  <Button className="w-full mt-4 border-gray-600 text-gray-300 hover:bg-gray-700" variant="outline">
                    View IRP5 Summary
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Document Detail Dialog */}
      <Dialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-[#1E293B] border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-[#00897B]" />
              Document Review
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Review and verify the submitted document
            </DialogDescription>
          </DialogHeader>
          
          {documentLoading ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="h-8 w-8 animate-spin text-[#00897B]" />
            </div>
          ) : selectedDocument ? (
            <div className="grid md:grid-cols-2 gap-4 overflow-y-auto max-h-[60vh]">
              {/* Document Preview */}
              <div className="space-y-4">
                <Card className="bg-[#0F172A] border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>Document Preview</span>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(selectedDocument.status)}
                        {getPriorityBadge(selectedDocument.reviewPriority)}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Mock document preview */}
                    <div className="aspect-[4/3] bg-gray-800 rounded-lg flex items-center justify-center border border-gray-600 relative overflow-hidden">
                      <div className="text-center">
                        {getDocumentTypeIcon(selectedDocument.documentType)}
                        <p className="text-white text-lg font-medium mt-2">{getDocumentTypeLabel(selectedDocument.documentType)}</p>
                        <p className="text-gray-400 text-sm">{selectedDocument.fileName}</p>
                        <p className="text-gray-500 text-xs mt-1">{formatFileSize(selectedDocument.fileSize)}</p>
                      </div>
                      {/* Document type overlay */}
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-[#00897B]/20 text-[#00897B] border-0">
                          {selectedDocument.documentCategory?.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Full
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Access History */}
                <Card className="bg-[#0F172A] border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Access History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-32">
                      <div className="space-y-2 text-xs">
                        {documentAccessLogs.slice(0, 5).map((log, idx) => (
                          <div key={log.id || idx} className="flex justify-between">
                            <span className="text-gray-300 capitalize">{log.action}</span>
                            <span className="text-gray-500">{formatDate(log.createdAt)}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Entity & Verification Info */}
              <div className="space-y-4">
                {/* Entity Info */}
                <Card className="bg-[#0F172A] border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      {selectedDocument.entityType === 'consumer' ? <User className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                      {selectedDocument.entityType === 'consumer' ? 'Consumer Details' : 'Merchant Details'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedDocument.ConsumerUser ? (
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-white">
                            {selectedDocument.ConsumerUser.firstName} {selectedDocument.ConsumerUser.lastName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-300">{selectedDocument.ConsumerUser.phone}</span>
                        </div>
                        {selectedDocument.ConsumerUser.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-300">{selectedDocument.ConsumerUser.email}</span>
                          </div>
                        )}
                        {selectedDocument.ConsumerUser.idNumber && (
                          <div className="flex items-center gap-2">
                            <IdCard className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-300">{selectedDocument.ConsumerUser.idNumber}</span>
                          </div>
                        )}
                        <Separator className="bg-gray-700" />
                        <div className="flex justify-between">
                          <span className="text-gray-400">KYC Status</span>
                          {getStatusBadge(selectedDocument.ConsumerUser.kycStatus)}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">KYC Level</span>
                          <span className="text-white">Level {selectedDocument.ConsumerUser.kycLevel}</span>
                        </div>
                      </div>
                    ) : selectedDocument.AdminMerchant ? (
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <span className="text-white">{selectedDocument.AdminMerchant.businessName}</span>
                        </div>
                        {selectedDocument.AdminMerchant.tradingName && (
                          <div className="text-gray-300 text-xs">
                            Trading as: {selectedDocument.AdminMerchant.tradingName}
                          </div>
                        )}
                        {selectedDocument.AdminMerchant.registrationNumber && (
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-300">{selectedDocument.AdminMerchant.registrationNumber}</span>
                          </div>
                        )}
                        <Separator className="bg-gray-700" />
                        <div className="flex justify-between">
                          <span className="text-gray-400">KYC Status</span>
                          {getStatusBadge(selectedDocument.AdminMerchant.kycStatus)}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">KYB Status</span>
                          {getStatusBadge(selectedDocument.AdminMerchant.kybStatus)}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Risk Score</span>
                          <span className="text-white">{selectedDocument.AdminMerchant.riskScore}/100</span>
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>

                {/* Document Details */}
                <Card className="bg-[#0F172A] border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Document Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Type</span>
                        <span className="text-white">{getDocumentTypeLabel(selectedDocument.documentType)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Uploaded</span>
                        <span className="text-gray-300">{formatDate(selectedDocument.createdAt)}</span>
                      </div>
                      {selectedDocument.documentNumber && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Doc Number</span>
                          <span className="text-gray-300">{selectedDocument.documentNumber}</span>
                        </div>
                      )}
                      {selectedDocument.expiryDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Expiry</span>
                          <span className={selectedDocument.isExpired ? 'text-red-400' : 'text-gray-300'}>
                            {selectedDocument.expiryDate}
                          </span>
                        </div>
                      )}
                      {selectedDocument.verifiedAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Verified</span>
                          <span className="text-gray-300">{formatDate(selectedDocument.verifiedAt)}</span>
                        </div>
                      )}
                      {selectedDocument.verifiedByName && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Verified By</span>
                          <span className="text-gray-300">{selectedDocument.verifiedByName}</span>
                        </div>
                      )}
                      {selectedDocument.rejectionReason && (
                        <div className="mt-2 p-2 bg-red-500/10 rounded border border-red-500/30">
                          <p className="text-xs text-red-400 font-medium">Rejection Reason:</p>
                          <p className="text-xs text-red-300">{selectedDocument.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Verification Actions */}
                {selectedDocument.status !== 'verified' && selectedDocument.status !== 'rejected' && (
                  <Card className="bg-[#0F172A] border-gray-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Verification Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-gray-400 text-xs">Verification Notes</Label>
                        <Textarea 
                          value={verificationNotes}
                          onChange={(e) => setVerificationNotes(e.target.value)}
                          placeholder="Enter verification notes..."
                          className="bg-[#0F172A] border-gray-600 text-white text-sm mt-1"
                          rows={3}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleDocumentAction('verify')}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Verify
                        </Button>
                        <Button 
                          variant="outline"
                          className="border-red-500 text-red-400 hover:bg-red-500/20"
                          onClick={() => {
                            if (!rejectionReason) {
                              toast.error('Please enter a rejection reason')
                              return
                            }
                            handleDocumentAction('reject')
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                      
                      <div>
                        <Label className="text-gray-400 text-xs">Rejection Reason (if rejecting)</Label>
                        <Textarea 
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Enter rejection reason..."
                          className="bg-[#0F172A] border-gray-600 text-white text-sm mt-1"
                          rows={2}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant="outline"
                          className="border-amber-500 text-amber-400 hover:bg-amber-500/20"
                          onClick={() => handleDocumentAction('request_resubmission')}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Request Resubmission
                        </Button>
                        <Button 
                          variant="outline"
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          onClick={() => handleDocumentAction('assign_reviewer')}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Assign Reviewer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* POPIA Request Dialog */}
      <Dialog open={popiaDialogOpen} onOpenChange={setPopiaDialogOpen}>
        <DialogContent className="max-w-lg bg-[#1E293B] border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-400" />
              POPIA Request
            </DialogTitle>
          </DialogHeader>
          
          {selectedPOPIA && (
            <div className="space-y-4">
              <div className="bg-[#0F172A] rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 capitalize">
                    {selectedPOPIA.requestType}
                  </Badge>
                  {getStatusBadge(selectedPOPIA.status)}
                </div>
                <Separator className="bg-gray-700" />
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-400 text-xs">Requester</p>
                    <p className="text-white">{selectedPOPIA.requesterName}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Email</p>
                    <p className="text-white">{selectedPOPIA.requesterEmail}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Submitted</p>
                    <p className="text-white">{formatDate(selectedPOPIA.submittedAt)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Due Date</p>
                    <p className={new Date(selectedPOPIA.dueDate) < new Date() ? 'text-red-400' : 'text-amber-400'}>
                      {formatDate(selectedPOPIA.dueDate)}
                    </p>
                  </div>
                </div>
                {selectedPOPIA.description && (
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Description</p>
                    <p className="text-sm text-white">{selectedPOPIA.description}</p>
                  </div>
                )}
              </div>

              {!selectedPOPIA.identityVerified && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-amber-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>Identity not verified - verify requester identity before processing</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button 
                  className="flex-1 bg-[#00897B] hover:bg-[#00695C] text-white"
                  onClick={() => { toast.success('POPIA request completed'); setPopiaDialogOpen(false); }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Complete
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Contact Requester
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AML Alert Dialog */}
      <Dialog open={amlDialogOpen} onOpenChange={setAmlDialogOpen}>
        <DialogContent className="max-w-lg bg-[#1E293B] border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className={`h-5 w-5 ${
                selectedAML?.severity === 'critical' ? 'text-red-400' :
                selectedAML?.severity === 'high' ? 'text-amber-400' : 'text-blue-400'
              }`} />
              AML Alert Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedAML && (
            <div className="space-y-4">
              <div className="bg-[#0F172A] rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(selectedAML.severity)}
                    {getStatusBadge(selectedAML.status)}
                  </div>
                  <Badge className="bg-gray-500/20 text-gray-400 border-0 capitalize">
                    {selectedAML.entityType}
                  </Badge>
                </div>
                <Separator className="bg-gray-700" />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Entity</span>
                    <span className="text-white">{selectedAML.entityName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Type</span>
                    <span className="text-white capitalize">{selectedAML.type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Match Score</span>
                    <span className={`font-bold ${
                      selectedAML.matchScore >= 80 ? 'text-red-400' :
                      selectedAML.matchScore >= 60 ? 'text-amber-400' : 'text-blue-400'
                    }`}>
                      {selectedAML.matchScore}%
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Details</p>
                  <p className="text-sm text-white">{selectedAML.details}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => { toast.success('AML alert cleared'); setAmlDialogOpen(false); }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1 border-red-500 text-red-400 hover:bg-red-500/20"
                  onClick={() => { toast.success('AML alert escalated'); setAmlDialogOpen(false); }}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Escalate
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Missing import
function BarChart(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" x2="12" y1="20" y2="10" />
      <line x1="18" x2="18" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="16" />
    </svg>
  )
}
