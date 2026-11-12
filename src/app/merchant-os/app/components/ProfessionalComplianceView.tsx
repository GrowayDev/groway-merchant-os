'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
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
import {
  ShieldCheck,
  FileText,
  AlertTriangle,
  Calendar,
  UserCheck,
  Clock,
  Beaker,
  ClipboardList,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Search,
  Download,
  Printer,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  History,
  Users,
  Building2,
  FileWarning,
  Timer,
  Lock,
  Unlock,
  BadgeCheck,
  Ban,
  Loader2,
  Scale,
  Banknote,
  Briefcase,
  FileSignature,
  Fingerprint,
  Shield,
  BookOpen,
  Award,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'

// Types
type FICAStatus = 'pending' | 'verified' | 'rejected' | 'expired'
type TrustAccountType = 'client' | 'business' | 'trust'
type ProfessionalType = 'attorney' | 'accountant' | 'consultant' | 'other'

interface FICARecord {
  id: string
  clientName: string
  clientIdNumber: string
  clientType: 'individual' | 'company'
  documentType: 'id' | 'passport' | 'proof_of_address' | 'company_registration'
  documentNumber: string
  verifiedBy: string
  verificationDate: string
  status: FICAStatus
  expiryDate: string
  notes?: string
}

interface TrustAccountEntry {
  id: string
  accountName: string
  accountType: TrustAccountType
  matterReference: string
  clientName: string
  transactionType: 'deposit' | 'withdrawal' | 'transfer'
  amount: number
  balance: number
  description: string
  reference: string
  reconciled: boolean
  reconciledDate?: string
  reconciledBy?: string
  createdAt: string
}

interface ProfessionalIndemnity {
  id: string
  provider: string
  policyNumber: string
  coverageAmount: number
  startDate: string
  endDate: string
  status: 'active' | 'expired' | 'pending_renewal'
  certificateUrl?: string
}

interface CPDRecord {
  id: string
  staffName: string
  staffId: string
  professionalBody: string
  membershipNumber: string
  cpdPoints: number
  requiredPoints: number
  period: string
  activities: CPDActivity[]
}

interface CPDActivity {
  id: string
  title: string
  type: 'course' | 'seminar' | 'workshop' | 'publication' | 'presentation'
  points: number
  date: string
  provider: string
  certificateUrl?: string
}

interface MatterFile {
  id: string
  matterNumber: string
  clientName: string
  matterType: string
  status: 'open' | 'closed' | 'archived'
  openedDate: string
  closedDate?: string
  responsibleStaff: string
  documents: number
  lastActivity: string
}

export function ProfessionalComplianceView() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Data states
  const [ficaRecords, setFicaRecords] = useState<FICARecord[]>([])
  const [trustAccountEntries, setTrustAccountEntries] = useState<TrustAccountEntry[]>([])
  const [indemnityInsurance, setIndemnityInsurance] = useState<ProfessionalIndemnity[]>([])
  const [cpdRecords, setCpdRecords] = useState<CPDRecord[]>([])
  const [matters, setMatters] = useState<MatterFile[]>([])

  // Dialog states
  const [ficaDialogOpen, setFicaDialogOpen] = useState(false)
  const [trustDialogOpen, setTrustDialogOpen] = useState(false)
  const [cpdDialogOpen, setCpdDialogOpen] = useState(false)

  // Update time
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Mock data
  useEffect(() => {
    const timer = setTimeout(() => {
      setFicaRecords([
        {
          id: '1',
          clientName: 'ABC Construction (Pty) Ltd',
          clientIdNumber: '2026/123456/07',
          clientType: 'company',
          documentType: 'company_registration',
          documentNumber: 'CR-2026-12345',
          verifiedBy: 'Sipho Ndaba',
          verificationDate: '2026-01-15',
          status: 'verified',
          expiryDate: '2027-01-15',
        },
        {
          id: '2',
          clientName: 'John Dlamini',
          clientIdNumber: '8001015800084',
          clientType: 'individual',
          documentType: 'id',
          documentNumber: 'ID-800101-5800',
          verifiedBy: 'Thandi Zwane',
          verificationDate: '2026-02-01',
          status: 'pending',
          expiryDate: '2027-02-01',
        },
      ])

      setTrustAccountEntries([
        {
          id: '1',
          accountName: 'Client Trust Account',
          accountType: 'trust',
          matterReference: 'MAT-2026-001',
          clientName: 'ABC Construction',
          transactionType: 'deposit',
          amount: 50000,
          balance: 125000,
          description: 'Deposit for litigation matter',
          reference: 'DEP-2026-001',
          reconciled: true,
          reconciledDate: '2026-02-10',
          reconciledBy: 'Sipho Ndaba',
          createdAt: '2026-02-10T10:00:00',
        },
        {
          id: '2',
          accountName: 'Client Trust Account',
          accountType: 'trust',
          matterReference: 'MAT-2026-002',
          clientName: 'XYZ Holdings',
          transactionType: 'withdrawal',
          amount: -25000,
          balance: 100000,
          description: 'Payment to vendor on behalf of client',
          reference: 'WD-2026-001',
          reconciled: false,
          createdAt: '2026-02-12T14:30:00',
        },
      ])

      setIndemnityInsurance([
        {
          id: '1',
          provider: 'Hollard Professional Insurance',
          policyNumber: 'PI-2026-789456',
          coverageAmount: 5000000,
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          status: 'active',
        },
        {
          id: '2',
          provider: 'AIG Professional Liability',
          policyNumber: 'PL-2025-123456',
          coverageAmount: 2000000,
          startDate: '2025-01-01',
          endDate: '2026-01-01',
          status: 'expired',
        },
      ])

      setCpdRecords([
        {
          id: '1',
          staffName: 'Sipho Ndaba',
          staffId: 'STF-001',
          professionalBody: 'Legal Practice Council',
          membershipNumber: 'LPC-2026-12345',
          cpdPoints: 18,
          requiredPoints: 24,
          period: '2026',
          activities: [
            { id: '1', title: 'Legal Ethics Seminar', type: 'seminar', points: 4, date: '2026-01-20', provider: 'LPC' },
            { id: '2', title: 'Commercial Law Update', type: 'course', points: 6, date: '2026-02-05', provider: 'LEAD' },
          ],
        },
        {
          id: '2',
          staffName: 'Thandi Zwane',
          staffId: 'STF-002',
          professionalBody: 'SAICA',
          membershipNumber: 'SAICA-2026-67890',
          cpdPoints: 35,
          requiredPoints: 40,
          period: '2026',
          activities: [
            { id: '1', title: 'IFRS Updates Workshop', type: 'workshop', points: 8, date: '2026-01-15', provider: 'SAICA' },
          ],
        },
      ])

      setMatters([
        {
          id: '1',
          matterNumber: 'MAT-2026-001',
          clientName: 'ABC Construction',
          matterType: 'Commercial Litigation',
          status: 'open',
          openedDate: '2026-01-10',
          responsibleStaff: 'Sipho Ndaba',
          documents: 45,
          lastActivity: '2026-02-14',
        },
        {
          id: '2',
          matterNumber: 'MAT-2026-002',
          clientName: 'XYZ Holdings',
          matterType: 'Contract Review',
          status: 'closed',
          openedDate: '2025-11-15',
          closedDate: '2026-01-30',
          responsibleStaff: 'Thandi Zwane',
          documents: 23,
          lastActivity: '2026-01-30',
        },
      ])

      setLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // Stats
  const stats = {
    pendingFICA: ficaRecords.filter(f => f.status === 'pending').length,
    verifiedFICA: ficaRecords.filter(f => f.status === 'verified').length,
    unreconciledTransactions: trustAccountEntries.filter(t => !t.reconciled).length,
    trustBalance: trustAccountEntries[0]?.balance || 0,
    activeInsurance: indemnityInsurance.filter(i => i.status === 'active').length,
    expiredInsurance: indemnityInsurance.filter(i => i.status === 'expired').length,
    cpdCompliant: cpdRecords.filter(c => c.cpdPoints >= c.requiredPoints).length,
    cpdNonCompliant: cpdRecords.filter(c => c.cpdPoints < c.requiredPoints).length,
    openMatters: matters.filter(m => m.status === 'open').length,
  }

  const getFICAStatusBadge = (status: FICAStatus) => {
    const colors: Record<FICAStatus, string> = {
      verified: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      rejected: 'bg-red-100 text-red-700',
      expired: 'bg-gray-100 text-gray-700',
    }
    return <Badge className={colors[status]}>{status}</Badge>
  }

  const formatCurrency = (amount: number) => {
    return `R${Math.abs(amount).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#FAFAFA] min-h-0">
        <Loader2 className="h-8 w-8 animate-spin text-[#00897B]" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-[#FAFAFA] min-h-0">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-[#00897B]" />
              Professional Compliance
            </h1>
            <p className="text-sm text-[#757575]">FICA/AML, trust accounts, PI insurance & CPD tracking</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-mono font-bold">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              <p className="text-xs text-[#757575]">{currentTime.toLocaleDateString()}</p>
            </div>

            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-8 gap-3">
          <div className="bg-[#E0F2F1] rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-[#00897B]">{stats.verifiedFICA}</p>
            <p className="text-[10px] text-[#757575]">FICA Verified</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-yellow-600">{stats.pendingFICA}</p>
            <p className="text-[10px] text-[#757575]">FICA Pending</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-blue-600">{formatCurrency(stats.trustBalance)}</p>
            <p className="text-[10px] text-[#757575]">Trust Balance</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-orange-600">{stats.unreconciledTransactions}</p>
            <p className="text-[10px] text-[#757575]">Unreconciled</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-green-600">{stats.activeInsurance}</p>
            <p className="text-[10px] text-[#757575]">Active PI</p>
          </div>
          <div className="bg-red-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-red-600">{stats.expiredInsurance}</p>
            <p className="text-[10px] text-[#757575]">Expired PI</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-purple-600">{stats.cpdCompliant}</p>
            <p className="text-[10px] text-[#757575]">CPD Compliant</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-amber-600">{stats.cpdNonCompliant}</p>
            <p className="text-[10px] text-[#757575]">CPD Due</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 flex flex-col min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="bg-white border-b border-gray-200 px-4">
            <TabsList className="bg-transparent h-12">
              <TabsTrigger value="overview" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                Overview
              </TabsTrigger>
              <TabsTrigger value="fica" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Fingerprint className="h-4 w-4 mr-1" />FICA/AML
              </TabsTrigger>
              <TabsTrigger value="trust" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Banknote className="h-4 w-4 mr-1" />Trust Account
              </TabsTrigger>
              <TabsTrigger value="insurance" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <Shield className="h-4 w-4 mr-1" />PI Insurance
              </TabsTrigger>
              <TabsTrigger value="cpd" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <BookOpen className="h-4 w-4 mr-1" />CPD
              </TabsTrigger>
              <TabsTrigger value="matters" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <FileText className="h-4 w-4 mr-1" />Matter Files
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 p-4">
            {/* Overview Tab */}
            <TabsContent value="overview" className="m-0">
              <div className="grid grid-cols-2 gap-4">
                {/* FICA Alerts */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Fingerprint className="h-5 w-5 text-[#00897B]" />
                      FICA Pending Verification
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {ficaRecords.filter(f => f.status === 'pending').map(record => (
                        <div key={record.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{record.clientName}</p>
                            <p className="text-xs text-[#757575]">{record.clientIdNumber}</p>
                          </div>
                          <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C]">Verify</Button>
                        </div>
                      ))}
                      {stats.pendingFICA === 0 && (
                        <p className="text-center text-sm text-[#757575] py-4">No pending FICA verifications</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Trust Account Alerts */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Banknote className="h-5 w-5 text-[#00897B]" />
                      Unreconciled Transactions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {trustAccountEntries.filter(t => !t.reconciled).map(entry => (
                        <div key={entry.id} className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{entry.description}</p>
                            <p className="text-xs text-[#757575]">{entry.matterReference} | {entry.clientName}</p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${entry.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {entry.amount >= 0 ? '+' : '-'}{formatCurrency(entry.amount)}
                            </p>
                            <Button size="sm" variant="outline">Reconcile</Button>
                          </div>
                        </div>
                      ))}
                      {stats.unreconciledTransactions === 0 && (
                        <p className="text-center text-sm text-[#757575] py-4">All transactions reconciled</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Insurance Status */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Shield className="h-5 w-5 text-[#00897B]" />
                      Professional Indemnity Insurance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {indemnityInsurance.filter(i => i.status === 'active')[0] ? (
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{indemnityInsurance[0].provider}</p>
                            <p className="text-sm text-[#757575]">{indemnityInsurance[0].policyNumber}</p>
                            <p className="text-sm text-green-700">Coverage: {formatCurrency(indemnityInsurance[0].coverageAmount)}</p>
                          </div>
                          <Badge className="bg-green-100 text-green-700">Active</Badge>
                        </div>
                        <p className="text-xs text-[#757575] mt-2">Expires: {indemnityInsurance[0].endDate}</p>
                      </div>
                    ) : (
                      <div className="p-3 bg-red-50 rounded-lg">
                        <p className="text-red-700 font-medium">No active insurance policy</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* CPD Status */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-[#00897B]" />
                      CPD Compliance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {cpdRecords.map(record => (
                        <div key={record.id} className="p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{record.staffName}</p>
                              <p className="text-xs text-[#757575]">{record.professionalBody}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-sm">{record.cpdPoints}/{record.requiredPoints}</p>
                              <Progress value={(record.cpdPoints / record.requiredPoints) * 100} className="h-1.5 w-16" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* FICA/AML Tab */}
            <TabsContent value="fica" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">FICA/AML Compliance</h2>
                <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setFICADialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />New Verification
                </Button>
              </div>

              <div className="space-y-3">
                {ficaRecords.map(record => (
                  <Card key={record.id} className={record.status === 'rejected' ? 'border-red-300' : record.status === 'pending' ? 'border-yellow-300' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg ${
                            record.status === 'verified' ? 'bg-green-100' :
                            record.status === 'pending' ? 'bg-yellow-100' :
                            'bg-red-100'
                          }`}>
                            <Fingerprint className={`h-5 w-5 ${
                              record.status === 'verified' ? 'text-green-600' :
                              record.status === 'pending' ? 'text-yellow-600' :
                              'text-red-600'
                            }`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold">{record.clientName}</p>
                              <Badge variant="outline">{record.clientType}</Badge>
                            </div>
                            <p className="text-sm text-[#757575]">ID: {record.clientIdNumber}</p>
                            <p className="text-sm text-[#757575]">Document: {record.documentType.replace('_', ' ')} ({record.documentNumber})</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {getFICAStatusBadge(record.status)}
                          <p className="text-xs text-[#757575] mt-2">Verified: {record.verificationDate}</p>
                          <p className="text-xs text-[#757575]">Expires: {record.expiryDate}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Trust Account Tab */}
            <TabsContent value="trust" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">Trust Account Register</h2>
                  <p className="text-sm text-[#757575]">Balance: {formatCurrency(stats.trustBalance)}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />Export
                  </Button>
                  <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setTrustDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />New Transaction
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {trustAccountEntries.map(entry => (
                  <Card key={entry.id} className={!entry.reconciled ? 'border-orange-300' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg ${entry.amount >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                            {entry.amount >= 0 ? (
                              <ArrowUpRight className="h-5 w-5 text-green-600" />
                            ) : (
                              <ArrowDownRight className="h-5 w-5 text-red-600" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{entry.description}</p>
                              {!entry.reconciled && (
                                <Badge className="bg-orange-100 text-orange-700">Unreconciled</Badge>
                              )}
                            </div>
                            <p className="text-sm text-[#757575]">Matter: {entry.matterReference} | Client: {entry.clientName}</p>
                            <p className="text-sm text-[#757575]">Ref: {entry.reference}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-lg ${entry.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {entry.amount >= 0 ? '+' : '-'}{formatCurrency(entry.amount)}
                          </p>
                          <p className="text-xs text-[#757575]">Balance: {formatCurrency(entry.balance)}</p>
                          <p className="text-xs text-[#757575]">{new Date(entry.createdAt).toLocaleString()}</p>
                          {!entry.reconciled && (
                            <Button size="sm" className="mt-2 bg-[#00897B] hover:bg-[#00695C]">Reconcile</Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Insurance Tab */}
            <TabsContent value="insurance" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Professional Indemnity Insurance</h2>
                <Button className="bg-[#00897B] hover:bg-[#00695C]">
                  <Plus className="h-4 w-4 mr-2" />Add Policy
                </Button>
              </div>

              <div className="space-y-3">
                {indemnityInsurance.map(policy => (
                  <Card key={policy.id} className={policy.status === 'expired' ? 'border-red-300' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg ${policy.status === 'active' ? 'bg-green-100' : 'bg-red-100'}`}>
                            <Shield className={`h-5 w-5 ${policy.status === 'active' ? 'text-green-600' : 'text-red-600'}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold">{policy.provider}</p>
                              <Badge className={policy.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                                {policy.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-[#757575]">Policy: {policy.policyNumber}</p>
                            <p className="text-sm text-green-700 font-medium">Coverage: {formatCurrency(policy.coverageAmount)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-[#757575]">Period</p>
                          <p className="font-medium">{policy.startDate} - {policy.endDate}</p>
                          <Button size="sm" variant="outline" className="mt-2">
                            <Download className="h-3 w-3 mr-1" />Certificate
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* CPD Tab */}
            <TabsContent value="cpd" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Continuing Professional Development</h2>
                <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setCpdDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />Add Activity
                </Button>
              </div>

              <div className="space-y-3">
                {cpdRecords.map(record => (
                  <Card key={record.id} className={record.cpdPoints < record.requiredPoints ? 'border-amber-300' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg ${record.cpdPoints >= record.requiredPoints ? 'bg-green-100' : 'bg-amber-100'}`}>
                            <Award className={`h-5 w-5 ${record.cpdPoints >= record.requiredPoints ? 'text-green-600' : 'text-amber-600'}`} />
                          </div>
                          <div>
                            <p className="font-bold">{record.staffName}</p>
                            <p className="text-sm text-[#757575]">{record.professionalBody} ({record.membershipNumber})</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{record.cpdPoints}/{record.requiredPoints}</p>
                          <Progress value={(record.cpdPoints / record.requiredPoints) * 100} className="h-2 w-24" />
                          <Badge className={`mt-2 ${record.cpdPoints >= record.requiredPoints ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {record.cpdPoints >= record.requiredPoints ? 'Compliant' : `${record.requiredPoints - record.cpdPoints} points needed`}
                          </Badge>
                        </div>
                      </div>

                      <div className="border-t pt-3">
                        <p className="text-xs font-medium text-[#757575] mb-2">Recent Activities</p>
                        <div className="grid grid-cols-2 gap-2">
                          {record.activities.map(activity => (
                            <div key={activity.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div>
                                <p className="text-sm font-medium">{activity.title}</p>
                                <p className="text-xs text-[#757575]">{activity.type} | {activity.date}</p>
                              </div>
                              <Badge variant="outline">+{activity.points}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Matter Files Tab */}
            <TabsContent value="matters" className="m-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Client Matter Files</h2>
                <Button variant="outline">
                  <Search className="h-4 w-4 mr-2" />Search Matters
                </Button>
              </div>

              <div className="space-y-3">
                {matters.map(matter => (
                  <Card key={matter.id} className={matter.status === 'closed' ? 'opacity-70' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg ${matter.status === 'open' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                            <FileText className={`h-5 w-5 ${matter.status === 'open' ? 'text-blue-600' : 'text-gray-600'}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold">{matter.matterNumber}</p>
                              <Badge className={matter.status === 'open' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}>
                                {matter.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-[#757575]">{matter.clientName}</p>
                            <p className="text-sm text-[#757575]">{matter.matterType}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-[#757575]">Documents</p>
                          <p className="font-medium">{matter.documents} files</p>
                          <p className="text-sm text-[#757575] mt-2">Responsible</p>
                          <p className="font-medium">{matter.responsibleStaff}</p>
                          <Button size="sm" variant="outline" className="mt-2">View Files</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  )
}
