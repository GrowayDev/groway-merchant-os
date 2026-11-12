'use client'

import { useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileText,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Clock,
  Send,
  Download,
  RefreshCw,
  Plus,
  Building2,
  Link2,
  Unlink,
  Eye,
  Edit,
  Trash2,
  Shield,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Copy,
  ChevronRight,
  Info,
  Bot,
  Lightbulb,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'

// Types
interface SARSConfig {
  id: string
  taxNumber: string
  taxType: 'VAT' | 'PAYE' | 'Income Tax' | 'All'
  vatReturnFrequency: 'monthly' | 'bi-monthly'
  efilingStatus: 'connected' | 'pending' | 'error' | 'disconnected'
  lastSync?: string
  registeredName: string
  tradingName: string
  registeredAddress: string
  taxYearEnd: string
}

interface VATReturn {
  id: string
  periodStart: string
  periodEnd: string
  box1_OutputVAT: number
  box2_InputVAT: number
  box3_NetVAT: number
  box4_TotalSales: number
  box5_TotalPurchases: number
  box6_Exports: number
  box7_ZeroRated: number
  box8_CapitalAssets: number
  status: 'draft' | 'ready' | 'submitted' | 'paid' | 'refunded'
  dueDate: string
  submittedDate?: string
  paymentDate?: string
  sarsReference?: string
  notes?: string
}

interface SubmissionHistory {
  id: string
  vatReturnId: string
  period: string
  sarsReference: string
  submittedDate: string
  amount: number
  status: 'accepted' | 'pending' | 'rejected'
  confirmationUrl?: string
}

interface ComplianceItem {
  id: string
  name: string
  description: string
  status: 'compliant' | 'warning' | 'non-compliant' | 'pending'
  dueDate?: string
  lastChecked: string
  details?: string
}

interface GroAIInsight {
  id: string
  type: 'opportunity' | 'alert' | 'recommendation'
  title: string
  description: string
  action: string
  priority: 'high' | 'medium' | 'low'
}

// Sample Data
const generateSARSConfig = (): SARSConfig => ({
  id: 'SARS-001',
  taxNumber: '4923456789',
  taxType: 'All',
  vatReturnFrequency: 'bi-monthly',
  efilingStatus: 'connected',
  lastSync: '2026-02-16T10:30:00',
  registeredName: 'ABC Trading (Pty) Ltd',
  tradingName: 'ABC Store',
  registeredAddress: '123 Main Street, Johannesburg, 2001',
  taxYearEnd: 'February',
})

const generateVATReturns = (): VATReturn[] => [
  {
    id: 'VAT-2026-001',
    periodStart: '2025-12-01',
    periodEnd: '2026-01-31',
    box1_OutputVAT: 45670,
    box2_InputVAT: 32450,
    box3_NetVAT: 13220,
    box4_TotalSales: 304466.67,
    box5_TotalPurchases: 216333.33,
    box6_Exports: 0,
    box7_ZeroRated: 0,
    box8_CapitalAssets: 0,
    status: 'paid',
    dueDate: '2026-02-28',
    submittedDate: '2026-02-25',
    paymentDate: '2026-02-27',
    sarsReference: 'SARS-VAT-202601-789456',
  },
  {
    id: 'VAT-2026-002',
    periodStart: '2026-02-01',
    periodEnd: '2026-03-31',
    box1_OutputVAT: 52340,
    box2_InputVAT: 28760,
    box3_NetVAT: 23580,
    box4_TotalSales: 348933.33,
    box5_TotalPurchases: 191733.33,
    box6_Exports: 0,
    box7_ZeroRated: 12500,
    box8_CapitalAssets: 0,
    status: 'ready',
    dueDate: '2026-04-28',
    notes: 'Ready for submission',
  },
  {
    id: 'VAT-2026-003',
    periodStart: '2026-04-01',
    periodEnd: '2026-05-31',
    box1_OutputVAT: 0,
    box2_InputVAT: 0,
    box3_NetVAT: 0,
    box4_TotalSales: 0,
    box5_TotalPurchases: 0,
    box6_Exports: 0,
    box7_ZeroRated: 0,
    box8_CapitalAssets: 0,
    status: 'draft',
    dueDate: '2026-06-28',
    notes: 'Current period',
  },
]

const generateSubmissionHistory = (): SubmissionHistory[] => [
  {
    id: 'SUB-001',
    vatReturnId: 'VAT-2026-001',
    period: 'Dec 2025 - Jan 2026',
    sarsReference: 'SARS-VAT-202601-789456',
    submittedDate: '2026-02-25',
    amount: 13220,
    status: 'accepted',
    confirmationUrl: 'https://efiling.sars.gov.za/confirmation/789456',
  },
  {
    id: 'SUB-002',
    vatReturnId: 'VAT-2025-006',
    period: 'Oct - Nov 2025',
    sarsReference: 'SARS-VAT-202511-654321',
    submittedDate: '2025-12-22',
    amount: 18750,
    status: 'accepted',
    confirmationUrl: 'https://efiling.sars.gov.za/confirmation/654321',
  },
  {
    id: 'SUB-003',
    vatReturnId: 'VAT-2025-005',
    period: 'Aug - Sep 2025',
    sarsReference: 'SARS-VAT-202509-456789',
    submittedDate: '2025-10-24',
    amount: 21340,
    status: 'accepted',
    confirmationUrl: 'https://efiling.sars.gov.za/confirmation/456789',
  },
]

const generateComplianceChecklist = (): ComplianceItem[] => [
  {
    id: 'COMP-001',
    name: 'VAT Registration',
    description: 'Valid VAT registration with SARS',
    status: 'compliant',
    lastChecked: '2026-02-16',
    details: 'Registered since 2020',
  },
  {
    id: 'COMP-002',
    name: 'VAT Returns Up to Date',
    description: 'All VAT returns submitted on time',
    status: 'compliant',
    lastChecked: '2026-02-16',
    details: 'Last return submitted: Jan 2026',
  },
  {
    id: 'COMP-003',
    name: 'Outstanding VAT Payments',
    description: 'No outstanding VAT payments due',
    status: 'compliant',
    lastChecked: '2026-02-16',
  },
  {
    id: 'COMP-004',
    name: 'Tax Clearance Certificate',
    description: 'Valid tax clearance certificate',
    status: 'warning',
    lastChecked: '2026-02-16',
    dueDate: '2026-03-15',
    details: 'Expires in 28 days',
  },
  {
    id: 'COMP-005',
    name: 'PAYE Registration',
    description: 'Registered for PAYE with SARS',
    status: 'compliant',
    lastChecked: '2026-02-16',
    details: '5 employees registered',
  },
  {
    id: 'COMP-006',
    name: 'EMP201 Submissions',
    description: 'Monthly PAYE declarations submitted',
    status: 'compliant',
    lastChecked: '2026-02-16',
    details: 'Last EMP201: Jan 2026',
  },
  {
    id: 'COMP-007',
    name: 'Provisional Tax',
    description: 'Provisional tax payments up to date',
    status: 'pending',
    lastChecked: '2026-02-16',
    dueDate: '2026-02-28',
    details: 'Second provisional payment due',
  },
  {
    id: 'COMP-008',
    name: 'eFiling Connection',
    description: 'Active SARS eFiling integration',
    status: 'compliant',
    lastChecked: '2026-02-16',
    details: 'Connected and syncing',
  },
]

// Component
export function SarsEfilingView() {
  // State Management
  const [config, setConfig] = useState<SARSConfig>(generateSARSConfig)
  const [vatReturns, setVatReturns] = useState<VATReturn[]>(generateVATReturns)
  const [submissionHistory] = useState<SubmissionHistory[]>(generateSubmissionHistory)
  const [complianceItems] = useState<ComplianceItem[]>(generateComplianceChecklist)
  
  const [activeTab, setActiveTab] = useState<string>('overview')
  const [isSyncing, setIsSyncing] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedVATReturn, setSelectedVATReturn] = useState<VATReturn | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  
  // Form states for new VAT return
  const [newVATForm, setNewVATForm] = useState({
    periodStart: '',
    periodEnd: '',
    box1_OutputVAT: 0,
    box2_InputVAT: 0,
    box4_TotalSales: 0,
    box5_TotalPurchases: 0,
    box6_Exports: 0,
    box7_ZeroRated: 0,
    box8_CapitalAssets: 0,
  })

  // Format Currency
  const formatCurrency = useCallback((amount: number) => {
    const prefix = amount < 0 ? '-R' : 'R'
    return `${prefix}${Math.abs(amount).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }, [])

  // Format Date
  const formatDate = useCallback((dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }, [])

  // Calculate Net VAT
  const calculatedNetVAT = useMemo(() => {
    return newVATForm.box1_OutputVAT - newVATForm.box2_InputVAT
  }, [newVATForm.box1_OutputVAT, newVATForm.box2_InputVAT])

  // Sync with SARS
  const handleSync = useCallback(async () => {
    setIsSyncing(true)
    // Simulate sync
    setTimeout(() => {
      setConfig(prev => ({
        ...prev,
        lastSync: new Date().toISOString(),
      }))
      setIsSyncing(false)
    }, 2000)
  }, [])

  // Create VAT Return
  const handleCreateVATReturn = useCallback(() => {
    const newReturn: VATReturn = {
      id: `VAT-${Date.now()}`,
      periodStart: newVATForm.periodStart,
      periodEnd: newVATForm.periodEnd,
      box1_OutputVAT: newVATForm.box1_OutputVAT,
      box2_InputVAT: newVATForm.box2_InputVAT,
      box3_NetVAT: calculatedNetVAT,
      box4_TotalSales: newVATForm.box4_TotalSales,
      box5_TotalPurchases: newVATForm.box5_TotalPurchases,
      box6_Exports: newVATForm.box6_Exports,
      box7_ZeroRated: newVATForm.box7_ZeroRated,
      box8_CapitalAssets: newVATForm.box8_CapitalAssets,
      status: 'draft',
      dueDate: new Date(newVATForm.periodEnd).toISOString().split('T')[0],
    }
    setVatReturns(prev => [...prev, newReturn])
    setCreateDialogOpen(false)
    setNewVATForm({
      periodStart: '',
      periodEnd: '',
      box1_OutputVAT: 0,
      box2_InputVAT: 0,
      box4_TotalSales: 0,
      box5_TotalPurchases: 0,
      box6_Exports: 0,
      box7_ZeroRated: 0,
      box8_CapitalAssets: 0,
    })
  }, [newVATForm, calculatedNetVAT])

  // Submit VAT Return
  const handleSubmitVATReturn = useCallback((id: string) => {
    setVatReturns(prev => prev.map(vat => {
      if (vat.id === id) {
        return {
          ...vat,
          status: 'submitted' as const,
          submittedDate: new Date().toISOString().split('T')[0],
          sarsReference: `SARS-VAT-${Date.now()}`,
        }
      }
      return vat
    }))
  }, [])

  // Delete VAT Return
  const handleDeleteVATReturn = useCallback((id: string) => {
    setVatReturns(prev => prev.filter(vat => vat.id !== id))
  }, [])

  // Get status badge variant and color
  const getStatusBadge = useCallback((status: VATReturn['status'] | ComplianceItem['status']) => {
    const styles: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', className: string }> = {
      draft: { variant: 'secondary', className: 'bg-gray-100 text-gray-700' },
      ready: { variant: 'default', className: 'bg-blue-100 text-blue-700' },
      submitted: { variant: 'default', className: 'bg-amber-100 text-amber-700' },
      paid: { variant: 'default', className: 'bg-green-100 text-green-700' },
      refunded: { variant: 'default', className: 'bg-purple-100 text-purple-700' },
      compliant: { variant: 'default', className: 'bg-green-100 text-green-700' },
      warning: { variant: 'default', className: 'bg-amber-100 text-amber-700' },
      'non-compliant': { variant: 'destructive', className: 'bg-red-100 text-red-700' },
      pending: { variant: 'secondary', className: 'bg-gray-100 text-gray-700' },
      accepted: { variant: 'default', className: 'bg-green-100 text-green-700' },
      rejected: { variant: 'destructive', className: 'bg-red-100 text-red-700' },
    }
    return styles[status] || { variant: 'secondary', className: '' }
  }, [])

  // Get eFiling status badge
  const getEfilingStatusBadge = useCallback((status: SARSConfig['efilingStatus']) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-700 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" />Connected</Badge>
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-700 border-red-200"><AlertCircle className="w-3 h-3 mr-1" />Error</Badge>
      case 'disconnected':
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200"><Unlink className="w-3 h-3 mr-1" />Disconnected</Badge>
      default:
        return null
    }
  }, [])

  // GroAI Insights
  const insights = useMemo((): GroAIInsight[] => {
    const insights: GroAIInsight[] = []
    
    // VAT return due
    const readyReturn = vatReturns.find(v => v.status === 'ready')
    if (readyReturn) {
      insights.push({
        id: 'INS-001',
        type: 'alert',
        title: 'VAT Return Ready for Submission',
        description: `Your VAT return for ${formatDate(readyReturn.periodStart)} - ${formatDate(readyReturn.periodEnd)} (${formatCurrency(readyReturn.box3_NetVAT)}) is ready to submit. Due: ${formatDate(readyReturn.dueDate)}`,
        action: 'Submit Now',
        priority: 'high',
      })
    }
    
    // Tax clearance warning
    const taxClearance = complianceItems.find(c => c.id === 'COMP-004')
    if (taxClearance && taxClearance.status === 'warning') {
      insights.push({
        id: 'INS-002',
        type: 'alert',
        title: 'Tax Clearance Expiring Soon',
        description: `Your tax clearance certificate expires on ${formatDate(taxClearance.dueDate || '')}. Renew now to avoid compliance issues.`,
        action: 'Renew Certificate',
        priority: 'medium',
      })
    }
    
    // Provisional tax
    const provisionalTax = complianceItems.find(c => c.id === 'COMP-007')
    if (provisionalTax && provisionalTax.status === 'pending') {
      insights.push({
        id: 'INS-003',
        type: 'recommendation',
        title: 'Provisional Tax Payment Due',
        description: `Second provisional tax payment is due by ${formatDate(provisionalTax.dueDate || '')}. Calculate and pay to avoid penalties.`,
        action: 'Calculate & Pay',
        priority: 'high',
      })
    }
    
    // Input VAT opportunity
    const totalInputVAT = vatReturns.reduce((sum, v) => sum + v.box2_InputVAT, 0)
    if (totalInputVAT > 0) {
      insights.push({
        id: 'INS-004',
        type: 'opportunity',
        title: 'VAT Input Recovery',
        description: `Total input VAT of ${formatCurrency(totalInputVAT)} available for recovery this period. Ensure all supplier invoices are captured.`,
        action: 'View Details',
        priority: 'low',
      })
    }
    
    return insights
  }, [vatReturns, complianceItems, formatCurrency, formatDate])

  // Compliance Score
  const complianceScore = useMemo(() => {
    const compliant = complianceItems.filter(c => c.status === 'compliant').length
    return Math.round((compliant / complianceItems.length) * 100)
  }, [complianceItems])

  return (
    <div className="h-full flex flex-col bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#00897B] flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[#1A1A1A]">SARS eFiling Integration</h1>
              <p className="text-sm text-[#757575]">Manage your tax submissions and compliance</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getEfilingStatusBadge(config.efilingStatus)}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={isSyncing}
              className="border-[#00897B] text-[#00897B] hover:bg-[#00897B]/10"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync with SARS'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="bg-white border-b px-6">
            <TabsList className="bg-transparent h-auto p-0 gap-4">
              <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] data-[state=active]:shadow-none rounded-none px-1 py-3">Overview</TabsTrigger>
              <TabsTrigger value="vat-returns" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] data-[state=active]:shadow-none rounded-none px-1 py-3">VAT Returns</TabsTrigger>
              <TabsTrigger value="submissions" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] data-[state=active]:shadow-none rounded-none px-1 py-3">Submission History</TabsTrigger>
              <TabsTrigger value="compliance" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] data-[state=active]:shadow-none rounded-none px-1 py-3">Compliance</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-6">
              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-0 space-y-6">
                {/* Tax Configuration Card */}
                <Card className="border-none shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-[#1A1A1A] flex items-center gap-2">
                      <Shield className="w-5 h-5 text-[#00897B]" />
                      Tax Configuration
                    </CardTitle>
                    <CardDescription>Your SARS registration details</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="space-y-1">
                        <p className="text-xs text-[#757575] uppercase tracking-wide">Tax Number</p>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-[#1A1A1A]">{config.taxNumber}</p>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => navigator.clipboard.writeText(config.taxNumber)}>
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-[#757575] uppercase tracking-wide">Tax Type</p>
                        <Badge variant="secondary" className="bg-[#00897B]/10 text-[#00897B]">{config.taxType}</Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-[#757575] uppercase tracking-wide">VAT Return Frequency</p>
                        <p className="text-[#1A1A1A] capitalize">{config.vatReturnFrequency.replace('-', '-')}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-[#757575] uppercase tracking-wide">eFiling Status</p>
                        {getEfilingStatusBadge(config.efilingStatus)}
                      </div>
                    </div>
                    <Separator className="my-4" />
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="space-y-1">
                        <p className="text-xs text-[#757575] uppercase tracking-wide">Registered Name</p>
                        <p className="text-[#1A1A1A]">{config.registeredName}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-[#757575] uppercase tracking-wide">Trading Name</p>
                        <p className="text-[#1A1A1A]">{config.tradingName}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-[#757575] uppercase tracking-wide">Tax Year End</p>
                        <p className="text-[#1A1A1A]">{config.taxYearEnd}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-[#757575] uppercase tracking-wide">Last Sync</p>
                        <p className="text-[#1A1A1A]">{config.lastSync ? formatDate(config.lastSync) : 'Never'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-none shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-[#757575] uppercase tracking-wide">Compliance Score</p>
                          <p className="text-2xl font-semibold text-[#1A1A1A]">{complianceScore}%</p>
                        </div>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${complianceScore >= 80 ? 'bg-green-100' : complianceScore >= 60 ? 'bg-amber-100' : 'bg-red-100'}`}>
                          <CheckCircle className={`w-5 h-5 ${complianceScore >= 80 ? 'text-green-600' : complianceScore >= 60 ? 'text-amber-600' : 'text-red-600'}`} />
                        </div>
                      </div>
                      <Progress value={complianceScore} className="h-1 mt-2" />
                    </CardContent>
                  </Card>
                  <Card className="border-none shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-[#757575] uppercase tracking-wide">VAT Returns</p>
                          <p className="text-2xl font-semibold text-[#1A1A1A]">{vatReturns.length}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-[#00897B]/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-[#00897B]" />
                        </div>
                      </div>
                      <p className="text-xs text-[#757575] mt-2">{vatReturns.filter(v => v.status === 'ready').length} ready to submit</p>
                    </CardContent>
                  </Card>
                  <Card className="border-none shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-[#757575] uppercase tracking-wide">Pending VAT</p>
                          <p className="text-2xl font-semibold text-[#1A1A1A]">
                            {formatCurrency(vatReturns.filter(v => v.status === 'ready').reduce((sum, v) => sum + v.box3_NetVAT, 0))}
                          </p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                          <Clock className="w-5 h-5 text-amber-600" />
                        </div>
                      </div>
                      <p className="text-xs text-[#757575] mt-2">Due this period</p>
                    </CardContent>
                  </Card>
                  <Card className="border-none shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-[#757575] uppercase tracking-wide">Submissions</p>
                          <p className="text-2xl font-semibold text-[#1A1A1A]">{submissionHistory.length}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <Send className="w-5 h-5 text-green-600" />
                        </div>
                      </div>
                      <p className="text-xs text-[#757575] mt-2">All accepted</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions & Insights */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Quick Actions */}
                  <Card className="border-none shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-[#1A1A1A] text-base">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button variant="outline" className="w-full justify-start h-auto py-3 px-4" onClick={() => setCreateDialogOpen(true)}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#00897B]/10 flex items-center justify-center">
                            <Plus className="w-4 h-4 text-[#00897B]" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-[#1A1A1A]">Create VAT Return</p>
                            <p className="text-xs text-[#757575]">Start a new VAT return for the current period</p>
                          </div>
                        </div>
                      </Button>
                      <Button variant="outline" className="w-full justify-start h-auto py-3 px-4" onClick={() => setActiveTab('vat-returns')}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-[#1A1A1A]">View VAT Returns</p>
                            <p className="text-xs text-[#757575]">Manage your VAT return submissions</p>
                          </div>
                        </div>
                      </Button>
                      <Button variant="outline" className="w-full justify-start h-auto py-3 px-4" onClick={() => setActiveTab('compliance')}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-[#1A1A1A]">Compliance Checklist</p>
                            <p className="text-xs text-[#757575]">Check your tax compliance status</p>
                          </div>
                        </div>
                      </Button>
                      <Button variant="outline" className="w-full justify-start h-auto py-3 px-4" asChild>
                        <a href="https://efiling.sars.gov.za" target="_blank" rel="noopener noreferrer">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                              <ExternalLink className="w-4 h-4 text-purple-600" />
                            </div>
                            <div className="text-left">
                              <p className="font-medium text-[#1A1A1A]">Open SARS eFiling</p>
                              <p className="text-xs text-[#757575]">Access the official SARS eFiling portal</p>
                            </div>
                          </div>
                        </a>
                      </Button>
                    </CardContent>
                  </Card>

                  {/* GroAI Insights */}
                  <Card className="border-none shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-[#1A1A1A] text-base flex items-center gap-2">
                        <Bot className="w-5 h-5 text-[#00897B]" />
                        GroAI Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {insights.map((insight) => (
                        <div
                          key={insight.id}
                          className={`p-3 rounded-lg border ${
                            insight.type === 'alert' ? 'bg-amber-50 border-amber-200' :
                            insight.type === 'opportunity' ? 'bg-green-50 border-green-200' :
                            'bg-blue-50 border-blue-200'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 ${
                              insight.type === 'alert' ? 'text-amber-600' :
                              insight.type === 'opportunity' ? 'text-green-600' :
                              'text-blue-600'
                            }`}>
                              {insight.type === 'alert' ? (
                                <AlertTriangle className="w-4 h-4" />
                              ) : insight.type === 'opportunity' ? (
                                <TrendingUp className="w-4 h-4" />
                              ) : (
                                <Lightbulb className="w-4 h-4" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-[#1A1A1A] text-sm">{insight.title}</p>
                              <p className="text-xs text-[#757575] mt-1">{insight.description}</p>
                              <Button variant="link" size="sm" className="h-auto p-0 mt-2 text-[#00897B]">
                                {insight.action} <ChevronRight className="w-3 h-3 ml-1" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* VAT Returns Tab */}
              <TabsContent value="vat-returns" className="mt-0 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[#1A1A1A]">VAT Returns</h2>
                    <p className="text-sm text-[#757575]">Manage your VAT return submissions</p>
                  </div>
                  <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-[#00897B] hover:bg-[#00897B]/90">
                        <Plus className="w-4 h-4 mr-2" /> Create VAT Return
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Create New VAT Return</DialogTitle>
                        <DialogDescription>Enter the details for the new VAT return period</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="periodStart">Period Start</Label>
                            <Input
                              id="periodStart"
                              type="date"
                              value={newVATForm.periodStart}
                              onChange={(e) => setNewVATForm(prev => ({ ...prev, periodStart: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="periodEnd">Period End</Label>
                            <Input
                              id="periodEnd"
                              type="date"
                              value={newVATForm.periodEnd}
                              onChange={(e) => setNewVATForm(prev => ({ ...prev, periodEnd: e.target.value }))}
                            />
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          <h4 className="font-medium text-[#1A1A1A]">VAT Calculations</h4>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="box1">Box 1: Output VAT (15%)</Label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#757575]">R</span>
                                <Input
                                  id="box1"
                                  type="number"
                                  className="pl-8"
                                  value={newVATForm.box1_OutputVAT || ''}
                                  onChange={(e) => setNewVATForm(prev => ({ ...prev, box1_OutputVAT: parseFloat(e.target.value) || 0 }))}
                                />
                              </div>
                              <p className="text-xs text-[#757575]">VAT charged on sales</p>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="box2">Box 2: Input VAT (15%)</Label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#757575]">R</span>
                                <Input
                                  id="box2"
                                  type="number"
                                  className="pl-8"
                                  value={newVATForm.box2_InputVAT || ''}
                                  onChange={(e) => setNewVATForm(prev => ({ ...prev, box2_InputVAT: parseFloat(e.target.value) || 0 }))}
                                />
                              </div>
                              <p className="text-xs text-[#757575]">VAT paid on purchases</p>
                            </div>
                          </div>

                          <div className="p-4 bg-[#FAFAFA] rounded-lg border">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-[#1A1A1A]">Box 3: Net VAT</p>
                                <p className="text-xs text-[#757575]">Output VAT - Input VAT</p>
                              </div>
                              <p className={`text-xl font-semibold ${calculatedNetVAT >= 0 ? 'text-[#00897B]' : 'text-green-600'}`}>
                                {formatCurrency(calculatedNetVAT)}
                              </p>
                            </div>
                            {calculatedNetVAT < 0 && (
                              <p className="text-xs text-green-600 mt-2">Refund due from SARS</p>
                            )}
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          <h4 className="font-medium text-[#1A1A1A]">Additional Information</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="box4">Box 4: Total Sales (excl. VAT)</Label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#757575]">R</span>
                                <Input
                                  id="box4"
                                  type="number"
                                  className="pl-8"
                                  value={newVATForm.box4_TotalSales || ''}
                                  onChange={(e) => setNewVATForm(prev => ({ ...prev, box4_TotalSales: parseFloat(e.target.value) || 0 }))}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="box5">Box 5: Total Purchases (excl. VAT)</Label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#757575]">R</span>
                                <Input
                                  id="box5"
                                  type="number"
                                  className="pl-8"
                                  value={newVATForm.box5_TotalPurchases || ''}
                                  onChange={(e) => setNewVATForm(prev => ({ ...prev, box5_TotalPurchases: parseFloat(e.target.value) || 0 }))}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="box6">Box 6: Exports</Label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#757575]">R</span>
                                <Input
                                  id="box6"
                                  type="number"
                                  className="pl-8"
                                  value={newVATForm.box6_Exports || ''}
                                  onChange={(e) => setNewVATForm(prev => ({ ...prev, box6_Exports: parseFloat(e.target.value) || 0 }))}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="box7">Box 7: Zero-Rated Supplies</Label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#757575]">R</span>
                                <Input
                                  id="box7"
                                  type="number"
                                  className="pl-8"
                                  value={newVATForm.box7_ZeroRated || ''}
                                  onChange={(e) => setNewVATForm(prev => ({ ...prev, box7_ZeroRated: parseFloat(e.target.value) || 0 }))}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="box8">Box 8: Capital Assets</Label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#757575]">R</span>
                                <Input
                                  id="box8"
                                  type="number"
                                  className="pl-8"
                                  value={newVATForm.box8_CapitalAssets || ''}
                                  onChange={(e) => setNewVATForm(prev => ({ ...prev, box8_CapitalAssets: parseFloat(e.target.value) || 0 }))}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                        <Button className="bg-[#00897B] hover:bg-[#00897B]/90" onClick={handleCreateVATReturn}>Create VAT Return</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <Card className="border-none shadow-sm">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Period</TableHead>
                          <TableHead className="text-right">Output VAT (Box 1)</TableHead>
                          <TableHead className="text-right">Input VAT (Box 2)</TableHead>
                          <TableHead className="text-right">Net VAT (Box 3)</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vatReturns.map((vatReturn) => {
                          const statusStyle = getStatusBadge(vatReturn.status)
                          return (
                            <TableRow key={vatReturn.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium text-[#1A1A1A]">{formatDate(vatReturn.periodStart)} - {formatDate(vatReturn.periodEnd)}</p>
                                  <p className="text-xs text-[#757575]">{vatReturn.id}</p>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-mono">{formatCurrency(vatReturn.box1_OutputVAT)}</TableCell>
                              <TableCell className="text-right font-mono">{formatCurrency(vatReturn.box2_InputVAT)}</TableCell>
                              <TableCell className="text-right">
                                <span className={`font-mono font-medium ${vatReturn.box3_NetVAT >= 0 ? 'text-[#1A1A1A]' : 'text-green-600'}`}>
                                  {formatCurrency(vatReturn.box3_NetVAT)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge variant={statusStyle.variant} className={statusStyle.className}>
                                  {vatReturn.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <p className="text-[#1A1A1A]">{formatDate(vatReturn.dueDate)}</p>
                                {vatReturn.submittedDate && (
                                  <p className="text-xs text-[#757575]">Submitted: {formatDate(vatReturn.submittedDate)}</p>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setSelectedVATReturn(vatReturn)
                                      setViewDialogOpen(true)
                                    }}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  {vatReturn.status === 'draft' && (
                                    <Button variant="ghost" size="icon">
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  )}
                                  {vatReturn.status === 'ready' && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-[#00897B]"
                                      onClick={() => handleSubmitVATReturn(vatReturn.id)}
                                    >
                                      <Send className="w-4 h-4" />
                                    </Button>
                                  )}
                                  {vatReturn.status === 'draft' && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-red-500"
                                      onClick={() => handleDeleteVATReturn(vatReturn.id)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Submission History Tab */}
              <TabsContent value="submissions" className="mt-0 space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-[#1A1A1A]">Submission History</h2>
                  <p className="text-sm text-[#757575]">Track your SARS submissions and reference numbers</p>
                </div>

                <Card className="border-none shadow-sm">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Period</TableHead>
                          <TableHead>SARS Reference</TableHead>
                          <TableHead>Submitted Date</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {submissionHistory.map((submission) => {
                          const statusStyle = getStatusBadge(submission.status)
                          return (
                            <TableRow key={submission.id}>
                              <TableCell>
                                <p className="font-medium text-[#1A1A1A]">{submission.period}</p>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <p className="font-mono text-sm">{submission.sarsReference}</p>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => navigator.clipboard.writeText(submission.sarsReference)}
                                  >
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell>
                                <p className="text-[#1A1A1A]">{formatDate(submission.submittedDate)}</p>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="font-mono font-medium">{formatCurrency(submission.amount)}</span>
                              </TableCell>
                              <TableCell>
                                <Badge variant={statusStyle.variant} className={statusStyle.className}>
                                  {submission.status === 'accepted' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                  {submission.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                                  {submission.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                                  {submission.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {submission.confirmationUrl && (
                                  <Button variant="outline" size="sm" asChild>
                                    <a href={submission.confirmationUrl} target="_blank" rel="noopener noreferrer">
                                      <Download className="w-4 h-4 mr-2" />
                                      Confirmation
                                    </a>
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Compliance Tab */}
              <TabsContent value="compliance" className="mt-0 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[#1A1A1A]">Compliance Checklist</h2>
                    <p className="text-sm text-[#757575]">Monitor your tax compliance status</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#757575]">Overall Score:</span>
                    <Badge className={`${complianceScore >= 80 ? 'bg-green-100 text-green-700' : complianceScore >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      {complianceScore}%
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-3">
                  {complianceItems.map((item) => {
                    const statusStyle = getStatusBadge(item.status)
                    return (
                      <Card key={item.id} className="border-none shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 ${
                                item.status === 'compliant' ? 'text-green-600' :
                                item.status === 'warning' ? 'text-amber-600' :
                                item.status === 'non-compliant' ? 'text-red-600' :
                                'text-gray-400'
                              }`}>
                                {item.status === 'compliant' ? (
                                  <CheckCircle2 className="w-5 h-5" />
                                ) : item.status === 'warning' ? (
                                  <AlertTriangle className="w-5 h-5" />
                                ) : item.status === 'non-compliant' ? (
                                  <XCircle className="w-5 h-5" />
                                ) : (
                                  <Clock className="w-5 h-5" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-[#1A1A1A]">{item.name}</p>
                                <p className="text-sm text-[#757575]">{item.description}</p>
                                {item.details && (
                                  <p className="text-xs text-[#00897B] mt-1">{item.details}</p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant={statusStyle.variant} className={statusStyle.className}>
                                {item.status}
                              </Badge>
                              {item.dueDate && (
                                <p className="text-xs text-[#757575] mt-1">Due: {formatDate(item.dueDate)}</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </div>

      {/* View VAT Return Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>VAT Return Details</DialogTitle>
            <DialogDescription>
              {selectedVATReturn && `${formatDate(selectedVATReturn.periodStart)} - ${formatDate(selectedVATReturn.periodEnd)}`}
            </DialogDescription>
          </DialogHeader>
          {selectedVATReturn && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#FAFAFA] rounded-lg">
                  <p className="text-xs text-[#757575] uppercase tracking-wide">Return ID</p>
                  <p className="font-mono text-[#1A1A1A]">{selectedVATReturn.id}</p>
                </div>
                <div className="p-4 bg-[#FAFAFA] rounded-lg">
                  <p className="text-xs text-[#757575] uppercase tracking-wide">Status</p>
                  <Badge variant={getStatusBadge(selectedVATReturn.status).variant} className={getStatusBadge(selectedVATReturn.status).className}>
                    {selectedVATReturn.status}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium text-[#1A1A1A]">VAT Calculation</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-[#757575]">Box 1: Output VAT</p>
                    <p className="font-mono font-medium text-[#1A1A1A]">{formatCurrency(selectedVATReturn.box1_OutputVAT)}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-[#757575]">Box 2: Input VAT</p>
                    <p className="font-mono font-medium text-[#1A1A1A]">{formatCurrency(selectedVATReturn.box2_InputVAT)}</p>
                  </div>
                </div>
                <div className="p-4 bg-[#00897B]/5 border border-[#00897B]/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[#1A1A1A]">Box 3: Net VAT</p>
                      <p className="text-xs text-[#757575]">Amount payable to / refundable from SARS</p>
                    </div>
                    <p className={`text-xl font-semibold ${selectedVATReturn.box3_NetVAT >= 0 ? 'text-[#00897B]' : 'text-green-600'}`}>
                      {formatCurrency(selectedVATReturn.box3_NetVAT)}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium text-[#1A1A1A]">Additional Information</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-[#757575]">Box 4: Total Sales</p>
                    <p className="font-mono text-[#1A1A1A]">{formatCurrency(selectedVATReturn.box4_TotalSales)}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-[#757575]">Box 5: Total Purchases</p>
                    <p className="font-mono text-[#1A1A1A]">{formatCurrency(selectedVATReturn.box5_TotalPurchases)}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-[#757575]">Box 6: Exports</p>
                    <p className="font-mono text-[#1A1A1A]">{formatCurrency(selectedVATReturn.box6_Exports)}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-[#757575]">Box 7: Zero-Rated</p>
                    <p className="font-mono text-[#1A1A1A]">{formatCurrency(selectedVATReturn.box7_ZeroRated)}</p>
                  </div>
                  <div className="p-3 border rounded-lg col-span-2">
                    <p className="text-xs text-[#757575]">Box 8: Capital Assets</p>
                    <p className="font-mono text-[#1A1A1A]">{formatCurrency(selectedVATReturn.box8_CapitalAssets)}</p>
                  </div>
                </div>
              </div>

              {selectedVATReturn.sarsReference && (
                <>
                  <Separator />
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <p className="font-medium text-green-800">Submitted to SARS</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-green-700">Reference Number</p>
                        <p className="font-mono text-green-900">{selectedVATReturn.sarsReference}</p>
                      </div>
                      <div>
                        <p className="text-xs text-green-700">Submitted Date</p>
                        <p className="text-green-900">{formatDate(selectedVATReturn.submittedDate || '')}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {selectedVATReturn.notes && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-[#757575]">Notes</p>
                  <p className="text-sm text-[#1A1A1A]">{selectedVATReturn.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
            {selectedVATReturn?.status === 'ready' && (
              <Button
                className="bg-[#00897B] hover:bg-[#00897B]/90"
                onClick={() => {
                  if (selectedVATReturn) {
                    handleSubmitVATReturn(selectedVATReturn.id)
                    setViewDialogOpen(false)
                  }
                }}
              >
                <Send className="w-4 h-4 mr-2" /> Submit to SARS
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SarsEfilingView
