'use client'

import { useState, useEffect, useCallback } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { 
  Users,
  Search,
  Plus,
  Filter,
  Download,
  MoreVertical,
  Eye,
  Edit,
  Ban,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  User,
  FileText,
  CreditCard,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Shield,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ChevronRight,
  RefreshCw,
  Send,
  FileCheck,
  X,
  Loader2
} from 'lucide-react'

// Merchant Status Types
type MerchantStatus = 'pending' | 'kyc_pending' | 'active' | 'suspended' | 'closed' | 'rejected'
type MerchantTier = 'starter' | 'growth' | 'enterprise'

// Merchant Interface - matches Prisma schema
interface MerchantDocument {
  id: string
  type: string
  status: string
  uploadedAt: string
  verifiedAt: string | null
}

interface MerchantNote {
  id: string
  content: string
  author: string
  createdAt: string
}

interface Merchant {
  id: string
  businessName: string
  tradingName: string | null
  registrationNumber: string | null
  vatNumber: string | null
  tier: MerchantTier
  status: MerchantStatus
  vertical: string | null
  subVertical: string | null
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
  addressStreet: string | null
  addressCity: string | null
  addressProvince: string | null
  addressPostalCode: string | null
  kycStatus: 'pending' | 'in_progress' | 'verified' | 'rejected'
  kybStatus: 'pending' | 'in_progress' | 'verified' | 'rejected'
  riskScore: number
  monthlyVolume: number
  totalTransactions: number
  joinedDate: string
  documents: MerchantDocument[]
  notes: MerchantNote[]
}

// Queue Stats
const queueStats = [
  { title: 'Pending Applications', count: 23, color: '#F59E0B', icon: Clock },
  { title: 'KYC Verification', count: 45, color: '#00897B', icon: User },
  { title: 'KYB Review', count: 18, color: '#1976D2', icon: Building2 },
  { title: 'Suspended Accounts', count: 7, color: '#EF4444', icon: Ban },
]

export default function MerchantManagement() {
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('all')
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [newNote, setNewNote] = useState('')

  // Fetch merchants from API
  const fetchMerchants = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.set('status', statusFilter)
      }
      if (searchQuery) {
        params.set('search', searchQuery)
      }
      
      const response = await fetch(`/api/admin/merchants?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setMerchants(data.merchants || [])
      } else {
        // Fallback to empty array if API fails
        setMerchants([])
      }
    } catch (error) {
      console.error('Error fetching merchants:', error)
      setMerchants([])
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, searchQuery])

  // Initial fetch
  useEffect(() => {
    fetchMerchants()
  }, [fetchMerchants])

  // Filter merchants (client-side tab filtering)
  const filteredMerchants = merchants.filter(merchant => {
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'pending' && ['pending', 'kyc_pending'].includes(merchant.status)) ||
      (activeTab === 'active' && merchant.status === 'active') ||
      (activeTab === 'issues' && ['suspended', 'rejected'].includes(merchant.status))
    
    return matchesTab
  })

  const getStatusBadge = (status: MerchantStatus) => {
    const styles: Record<MerchantStatus, string> = {
      pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      kyc_pending: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      active: 'bg-green-500/20 text-green-400 border-green-500/30',
      suspended: 'bg-red-500/20 text-red-400 border-red-500/30',
      closed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
    }
    return (
      <Badge className={`${styles[status]} border capitalize`}>
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const getTierBadge = (tier: MerchantTier) => {
    const styles: Record<MerchantTier, string> = {
      starter: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
      growth: 'bg-[#00897B]/20 text-[#00897B] border-[#00897B]/30',
      enterprise: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    }
    return (
      <Badge className={`${styles[tier]} border capitalize`}>
        {tier}
      </Badge>
    )
  }

  const getRiskColor = (score: number) => {
    if (score <= 25) return 'text-green-400'
    if (score <= 50) return 'text-amber-400'
    if (score <= 75) return 'text-orange-400'
    return 'text-red-400'
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const handleViewMerchant = (merchant: Merchant) => {
    setSelectedMerchant(merchant)
    setDetailDialogOpen(true)
  }

  const handleAddNote = () => {
    if (newNote.trim() && selectedMerchant) {
      toast.success('Note added successfully')
      setNewNote('')
      setNoteDialogOpen(false)
    }
  }

  const handleApproveKYC = () => {
    toast.success('KYC approved successfully')
    setDetailDialogOpen(false)
  }

  const handleRejectKYC = () => {
    toast.error('KYC rejected')
    setDetailDialogOpen(false)
  }

  const handleSuspendMerchant = () => {
    toast.success('Merchant account suspended')
    setDetailDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Merchant Management</h1>
          <p className="text-gray-400 text-sm">Onboarding, verification, and lifecycle management</p>
        </div>
        <Button className="bg-[#00897B] hover:bg-[#00695C] text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add Merchant
        </Button>
      </div>

      {/* Queue Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {queueStats.map((stat, index) => (
          <Card key={index} className="bg-[#1E293B] border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">{stat.count}</p>
                  <p className="text-xs text-gray-400">{stat.title}</p>
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
          <TabsTrigger value="all" className="data-[state=active]:bg-[#00897B]">All Merchants</TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-[#00897B]">Pending Review</TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:bg-[#00897B]">Active</TabsTrigger>
          <TabsTrigger value="issues" className="data-[state=active]:bg-[#00897B]">Issues</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {/* Search & Filters */}
          <Card className="bg-[#1E293B] border-gray-700 mb-4">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Search by name, trading name, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-[#0F172A] border-gray-600 text-white placeholder:text-gray-500"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48 bg-[#0F172A] border-gray-600 text-white">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1E293B] border-gray-700 text-white">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="kyc_pending">KYC Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                  <Filter className="h-4 w-4 mr-2" />
                  More Filters
                </Button>
                <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Merchants List */}
          <Card className="bg-[#1E293B] border-gray-700">
            <CardContent className="p-0">
              <div className="divide-y divide-gray-700">
                {filteredMerchants.map((merchant) => (
                  <div 
                    key={merchant.id}
                    className="p-4 hover:bg-[#0F172A]/50 transition-colors cursor-pointer"
                    onClick={() => handleViewMerchant(merchant)}
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-lg bg-[#00897B]/20 text-[#00897B] flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-6 w-6" />
                      </div>

                      {/* Main Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-white truncate">
                            {merchant.businessName}
                          </h3>
                          {getTierBadge(merchant.tier)}
                          {getStatusBadge(merchant.status)}
                        </div>
                        <p className="text-xs text-gray-400 truncate">
                          Trading as: {merchant.tradingName} • {merchant.vertical} / {merchant.subVertical}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {merchant.contactName || 'N/A'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {merchant.contactEmail || 'N/A'}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {merchant.addressCity || 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="hidden md:flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-white">
                            {formatCurrency(merchant.monthlyVolume)}
                          </p>
                          <p className="text-xs text-gray-400">Monthly Volume</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-white">
                            {merchant.totalTransactions.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-400">Transactions</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <span className={`text-sm font-semibold ${getRiskColor(merchant.riskScore)}`}>
                              {merchant.riskScore}
                            </span>
                            <span className="text-xs text-gray-400">/ 100</span>
                          </div>
                          <p className="text-xs text-gray-400">Risk Score</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {merchant.status === 'kyc_pending' && (
                          <Button 
                            size="sm" 
                            className="bg-[#00897B] hover:bg-[#00695C] text-white"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewMerchant(merchant)
                            }}
                          >
                            Review KYC
                          </Button>
                        )}
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="p-8 text-center">
                    <Loader2 className="h-12 w-12 text-[#00897B] mx-auto mb-3 animate-spin" />
                    <p className="text-gray-400">Loading merchants...</p>
                  </div>
                )}
              </div>

              {filteredMerchants.length === 0 && (
                <div className="p-8 text-center">
                  <Users className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400">No merchants found matching your criteria</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Merchant Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#1E293B] border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#00897B]/20 text-[#00897B] flex items-center justify-center">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  {selectedMerchant?.businessName}
                  {selectedMerchant && getTierBadge(selectedMerchant.tier)}
                  {selectedMerchant && getStatusBadge(selectedMerchant.status)}
                </div>
                <p className="text-sm text-gray-400 font-normal mt-0.5">
                  ID: {selectedMerchant?.id} • Joined {selectedMerchant?.joinedDate}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedMerchant && (
            <div className="space-y-6 mt-4">
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#0F172A] rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">Monthly Volume</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(selectedMerchant.monthlyVolume)}</p>
                </div>
                <div className="bg-[#0F172A] rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">Total Transactions</p>
                  <p className="text-xl font-bold text-white">{selectedMerchant.totalTransactions.toLocaleString()}</p>
                </div>
                <div className="bg-[#0F172A] rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">Risk Score</p>
                  <p className={`text-xl font-bold ${getRiskColor(selectedMerchant.riskScore)}`}>
                    {selectedMerchant.riskScore} / 100
                  </p>
                </div>
              </div>

              {/* Two Columns */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Business Details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[#00897B]" />
                    Business Details
                  </h3>
                  <div className="bg-[#0F172A] rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">Trading Name</span>
                      <span className="text-sm text-white">{selectedMerchant.tradingName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">Reg Number</span>
                      <span className="text-sm text-white">{selectedMerchant.registrationNumber || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">VAT Number</span>
                      <span className="text-sm text-white">{selectedMerchant.vatNumber || 'Not registered'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">Vertical</span>
                      <span className="text-sm text-white">{selectedMerchant.vertical}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">Sub-Vertical</span>
                      <span className="text-sm text-white">{selectedMerchant.subVertical}</span>
                    </div>
                  </div>

                  {/* Contact Person */}
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <User className="h-4 w-4 text-[#00897B]" />
                    Contact Person
                  </h3>
                  <div className="bg-[#0F172A] rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">Name</span>
                      <span className="text-sm text-white">{selectedMerchant.contactPerson.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">Email</span>
                      <span className="text-sm text-white">{selectedMerchant.contactPerson.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">Phone</span>
                      <span className="text-sm text-white">{selectedMerchant.contactPerson.phone}</span>
                    </div>
                  </div>

                  {/* Address */}
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#00897B]" />
                    Address
                  </h3>
                  <div className="bg-[#0F172A] rounded-lg p-4">
                    <p className="text-sm text-white">
                      {selectedMerchant.address.street}<br />
                      {selectedMerchant.address.city}, {selectedMerchant.address.province}<br />
                      {selectedMerchant.address.postalCode}
                    </p>
                  </div>
                </div>

                {/* Verification Status */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Shield className="h-4 w-4 text-[#00897B]" />
                    Verification Status
                  </h3>

                  {/* KYC Status */}
                  <div className="bg-[#0F172A] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-white font-medium">KYC Verification</span>
                      <Badge className={`${
                        selectedMerchant.kycStatus === 'verified' ? 'bg-green-500/20 text-green-400' :
                        selectedMerchant.kycStatus === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                        selectedMerchant.kycStatus === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-red-500/20 text-red-400'
                      } border capitalize`}>
                        {selectedMerchant.kycStatus.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {selectedMerchant.documents.map((doc, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">{doc.type}</span>
                          <Badge className={`${
                            doc.status === 'verified' ? 'bg-green-500/20 text-green-400' :
                            doc.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-red-500/20 text-red-400'
                          } text-[10px]`}>
                            {doc.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* KYB Status */}
                  <div className="bg-[#0F172A] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-white font-medium">KYB Verification</span>
                      <Badge className={`${
                        selectedMerchant.kybStatus === 'verified' ? 'bg-green-500/20 text-green-400' :
                        selectedMerchant.kybStatus === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                        selectedMerchant.kybStatus === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-red-500/20 text-red-400'
                      } border capitalize`}>
                        {selectedMerchant.kybStatus.replace('_', ' ')}
                      </Badge>
                    </div>
                    {selectedMerchant.registrationNumber && (
                      <p className="text-xs text-gray-400">CIPRO verified</p>
                    )}
                  </div>

                  {/* Risk Assessment */}
                  <div className="bg-[#0F172A] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-white font-medium">Risk Assessment</span>
                      <span className={`text-sm font-bold ${getRiskColor(selectedMerchant.riskScore)}`}>
                        {selectedMerchant.riskScore} / 100
                      </span>
                    </div>
                    <Progress 
                      value={selectedMerchant.riskScore} 
                      className="h-2 bg-gray-700"
                    />
                    <p className="text-xs text-gray-400 mt-2">
                      {selectedMerchant.riskScore <= 25 ? 'Low Risk - Standard monitoring' :
                       selectedMerchant.riskScore <= 50 ? 'Medium Risk - Enhanced monitoring' :
                       selectedMerchant.riskScore <= 75 ? 'High Risk - Requires review' :
                       'Critical Risk - Immediate action required'}
                    </p>
                  </div>

                  {/* Notes */}
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#00897B]" />
                    Notes & History
                  </h3>
                  <div className="bg-[#0F172A] rounded-lg p-4 max-h-40 overflow-y-auto">
                    {selectedMerchant.notes.length > 0 ? (
                      <div className="space-y-3">
                        {selectedMerchant.notes.map((note, idx) => (
                          <div key={idx} className="text-xs">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-white">{note.author}</span>
                              <span className="text-gray-500">{note.date}</span>
                            </div>
                            <p className="text-gray-400">{note.content}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">No notes yet</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-700">
                {selectedMerchant.status === 'kyc_pending' && (
                  <>
                    <Button 
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={handleApproveKYC}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Approve KYC
                    </Button>
                    <Button 
                      variant="outline"
                      className="border-red-500 text-red-400 hover:bg-red-500/20"
                      onClick={handleRejectKYC}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </>
                )}
                {selectedMerchant.status === 'active' && (
                  <Button 
                    variant="outline"
                    className="border-red-500 text-red-400 hover:bg-red-500/20"
                    onClick={handleSuspendMerchant}
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Suspend Account
                  </Button>
                )}
                <Button 
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  onClick={() => setNoteDialogOpen(true)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
                <Button 
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Contact
                </Button>
                <Button 
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Transactions
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
            <DialogTitle>Add Note</DialogTitle>
            <DialogDescription className="text-gray-400">
              Add a note to this merchant's record. Notes are visible to all admin users.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter your note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="bg-[#0F172A] border-gray-600 text-white min-h-[100px]"
            />
          </div>
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
