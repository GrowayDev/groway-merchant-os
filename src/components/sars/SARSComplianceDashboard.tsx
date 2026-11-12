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
  FileText,
  Calculator,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  Download,
  RefreshCw,
  Plus,
  Eye,
  Building2,
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  CreditCard,
  Briefcase,
  Loader2,
  ChevronRight,
  ArrowRight,
  AlertCircle
} from 'lucide-react'

// Types
interface VATReturn {
  id: string
  merchantId: string
  periodStart: string
  periodEnd: string
  outputVat: number
  inputVat: number
  netVat: number
  totalSales: number
  capitalGoods: number
  totalPurchases: number
  exports: number
  zeroRated: number
  status: string
  paymentDueDate?: string
  submittedAt?: Date
  submittedBy?: string
  sarsReference?: string
  createdAt: Date
}

interface PAYEReconciliation {
  id: string
  merchantId: string
  taxYear: string
  period: string
  payrollAmount: number
  payeDeducted: number
  uifDeducted: number
  sdlDeducted: number
  employeesCount: number
  status: string
  dueDate: Date
  submittedAt?: Date
}

interface TaxCalculation {
  type: string
  description: string
  amount: number
  rate: number
  period: string
}

interface FilingCalendar {
  id: string
  type: string
  name: string
  dueDate: Date
  status: string
  description: string
}

export default function SARSComplianceDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [vatReturns, setVatReturns] = useState<VATReturn[]>([])
  const [payeRecords, setPayeRecords] = useState<PAYEReconciliation[]>([])
  const [filingCalendar, setFilingCalendar] = useState<FilingCalendar[]>([])
  
  const [selectedVAT, setSelectedVAT] = useState<VATReturn | null>(null)
  const [vatDialogOpen, setVatDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  // Stats
  const [stats, setStats] = useState({
    totalVatLiability: 0,
    totalPayeLiability: 0,
    pendingFilings: 0,
    complianceScore: 0
  })

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      // Mock VAT returns
      setVatReturns([
        {
          id: 'vat-001',
          merchantId: 'merchant-001',
          periodStart: '2026-02-01',
          periodEnd: '2026-02-28',
          outputVat: 156780.50,
          inputVat: 98450.25,
          netVat: 58330.25,
          totalSales: 1045203.33,
          capitalGoods: 0,
          totalPurchases: 656335.00,
          exports: 0,
          zeroRated: 0,
          status: 'ready',
          paymentDueDate: '2026-03-25',
          createdAt: new Date()
        },
        {
          id: 'vat-002',
          merchantId: 'merchant-001',
          periodStart: '2026-01-01',
          periodEnd: '2026-01-31',
          outputVat: 142350.00,
          inputVat: 87200.00,
          netVat: 55150.00,
          totalSales: 949000.00,
          capitalGoods: 25000,
          totalPurchases: 581333.33,
          exports: 0,
          zeroRated: 0,
          status: 'submitted',
          submittedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          submittedBy: 'admin-001',
          sarsReference: 'SARS-VAT-2026-012345',
          paymentDueDate: '2026-02-25',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        },
        {
          id: 'vat-003',
          merchantId: 'merchant-001',
          periodStart: '2025-12-01',
          periodEnd: '2025-12-31',
          outputVat: 138900.00,
          inputVat: 92100.00,
          netVat: 46800.00,
          totalSales: 926000.00,
          capitalGoods: 0,
          totalPurchases: 614000.00,
          exports: 0,
          zeroRated: 0,
          status: 'paid',
          submittedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          submittedBy: 'admin-001',
          sarsReference: 'SARS-VAT-2025-987654',
          paymentDueDate: '2026-01-25',
          createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        }
      ])
      
      // Mock PAYE records
      setPayeRecords([
        {
          id: 'paye-001',
          merchantId: 'merchant-001',
          taxYear: '2025/2026',
          period: 'February 2026',
          payrollAmount: 2450000,
          payeDeducted: 478500,
          uifDeducted: 24112,
          sdlDeducted: 2450,
          employeesCount: 47,
          status: 'draft',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        },
        {
          id: 'paye-002',
          merchantId: 'merchant-001',
          taxYear: '2025/2026',
          period: 'January 2026',
          payrollAmount: 2420000,
          payeDeducted: 471900,
          uifDeducted: 23816,
          sdlDeducted: 2420,
          employeesCount: 46,
          status: 'submitted',
          dueDate: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000),
          submittedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)
        }
      ])
      
      // Mock filing calendar
      setFilingCalendar([
        {
          id: 'cal-001',
          type: 'VAT201',
          name: 'February 2026 VAT Return',
          dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
          status: 'pending',
          description: 'Bi-monthly VAT submission'
        },
        {
          id: 'cal-002',
          type: 'EMP201',
          name: 'February 2026 PAYE',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: 'pending',
          description: 'Monthly PAYE declaration'
        },
        {
          id: 'cal-003',
          type: 'EMP501',
          name: 'Annual PAYE Reconciliation',
          dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          status: 'pending',
          description: 'Annual employer reconciliation'
        },
        {
          id: 'cal-004',
          type: 'Provisional',
          name: 'Provisional Tax Payment',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'pending',
          description: 'Second provisional tax payment'
        }
      ])
      
      setStats({
        totalVatLiability: 58330.25,
        totalPayeLiability: 505562,
        pendingFilings: 3,
        complianceScore: 98
      })
    } catch (error) {
      console.error('Error fetching SARS data:', error)
    }
  }, [])

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await fetchData()
      setLoading(false)
    }
    loadData()
  }, [fetchData])

  // Submit VAT return
  const submitVATReturn = async (vatReturn: VATReturn) => {
    setSubmitting(true)
    try {
      // Mock submission
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Update local state
      setVatReturns(prev => prev.map(v => 
        v.id === vatReturn.id 
          ? { 
              ...v, 
              status: 'submitted', 
              submittedAt: new Date(),
              submittedBy: 'admin-001',
              sarsReference: `SARS-VAT-${Date.now()}`
            }
          : v
      ))
      
      toast.success('VAT return submitted successfully to SARS eFiling')
      setVatDialogOpen(false)
    } catch {
      toast.error('Failed to submit VAT return')
    }
    setSubmitting(false)
  }

  // Calculate VAT
  const calculateVAT = (sales: number, rate: number = 15): { outputVat: number; salesExcl: number } => {
    const salesExcl = sales / (1 + rate / 100)
    const outputVat = sales - salesExcl
    return { outputVat, salesExcl }
  }

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  // Format date
  const formatDate = (date: string | Date): string => {
    return new Date(date).toLocaleDateString('en-ZA', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      ready: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      submitted: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      paid: 'bg-green-500/20 text-green-400 border-green-500/30',
      refunded: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      overdue: 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse'
    }
    return <Badge className={`${styles[status] || 'bg-gray-500/20 text-gray-400'} border capitalize`}>
      {status}
    </Badge>
  }

  // Get days until due
  const getDaysUntilDue = (dueDate: Date): { days: number; isOverdue: boolean } => {
    const now = new Date()
    const due = new Date(dueDate)
    const diffMs = due.getTime() - now.getTime()
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    return { days, isOverdue: days < 0 }
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
            <Building2 className="h-6 w-6 text-[#00897B]" />
            SARS Tax Compliance
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            VAT returns, PAYE reconciliation, and tax filings
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
            Sync with SARS
          </Button>
          <Button 
            size="sm"
            className="bg-[#00897B] hover:bg-[#00695C] text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Filing
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[#1E293B] border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-500/20 text-amber-400">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalVatLiability)}</p>
            <p className="text-xs text-gray-400">VAT Liability (Current)</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1E293B] border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-500/20 text-blue-400">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalPayeLiability)}</p>
            <p className="text-xs text-gray-400">PAYE Liability (Current)</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1E293B] border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-500/20 text-red-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{stats.pendingFilings}</p>
            <p className="text-xs text-gray-400">Pending Filings</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1E293B] border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-500/20 text-green-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{stats.complianceScore}%</p>
            <p className="text-xs text-gray-400">Compliance Score</p>
            <Progress value={stats.complianceScore} className="h-1 mt-2 bg-gray-700" />
          </CardContent>
        </Card>
      </div>

      {/* Filing Calendar */}
      <Card className="bg-[#1E293B] border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-amber-400" />
            Upcoming Filing Deadlines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            {filingCalendar.map((filing) => {
              const { days, isOverdue } = getDaysUntilDue(filing.dueDate)
              return (
                <div 
                  key={filing.id}
                  className={`p-4 rounded-lg border ${
                    isOverdue 
                      ? 'bg-red-500/10 border-red-500/30' 
                      : days <= 7 
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-[#0F172A] border-gray-700/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={
                      filing.type === 'VAT201' ? 'bg-purple-500/20 text-purple-400' :
                      filing.type === 'EMP201' ? 'bg-blue-500/20 text-blue-400' :
                      filing.type === 'EMP501' ? 'bg-green-500/20 text-green-400' :
                      'bg-amber-500/20 text-amber-400'
                    }>
                      {filing.type}
                    </Badge>
                    {isOverdue && <AlertTriangle className="h-4 w-4 text-red-400" />}
                  </div>
                  <p className="text-white text-sm font-medium mb-1">{filing.name}</p>
                  <p className="text-gray-400 text-xs mb-2">{filing.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Due: {formatDate(filing.dueDate)}</span>
                    <span className={`text-xs font-medium ${isOverdue ? 'text-red-400' : days <= 7 ? 'text-amber-400' : 'text-gray-400'}`}>
                      {isOverdue ? `${Math.abs(days)} days overdue` : `${days} days`}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[#1E293B] border border-gray-700 grid grid-cols-4 w-full max-w-xl">
          <TabsTrigger value="overview" className="data-[state=active]:bg-[#00897B]">Overview</TabsTrigger>
          <TabsTrigger value="vat" className="data-[state=active]:bg-[#00897B]">VAT201</TabsTrigger>
          <TabsTrigger value="paye" className="data-[state=active]:bg-[#00897B]">PAYE</TabsTrigger>
          <TabsTrigger value="calculator" className="data-[state=active]:bg-[#00897B]">Calculator</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Recent VAT Submissions */}
            <Card className="bg-[#1E293B] border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-400" />
                  Recent VAT Submissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {vatReturns.slice(0, 5).map((vat) => (
                      <div 
                        key={vat.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-[#0F172A] border border-gray-700/50 cursor-pointer hover:border-gray-600"
                        onClick={() => { setSelectedVAT(vat); setVatDialogOpen(true); }}
                      >
                        <div>
                          <p className="text-sm text-white">{vat.periodStart} to {vat.periodEnd}</p>
                          <p className="text-xs text-gray-400">Net VAT: {formatCurrency(vat.netVat)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(vat.status)}
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* PAYE Summary */}
            <Card className="bg-[#1E293B] border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-400" />
                  PAYE Summary (Current Tax Year)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#0F172A] p-3 rounded-lg">
                      <p className="text-xs text-gray-400">Total PAYE</p>
                      <p className="text-xl font-bold text-white">{formatCurrency(950400)}</p>
                    </div>
                    <div className="bg-[#0F172A] p-3 rounded-lg">
                      <p className="text-xs text-gray-400">Total UIF</p>
                      <p className="text-xl font-bold text-white">{formatCurrency(47928)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#0F172A] p-3 rounded-lg">
                      <p className="text-xs text-gray-400">Total SDL</p>
                      <p className="text-xl font-bold text-white">{formatCurrency(4870)}</p>
                    </div>
                    <div className="bg-[#0F172A] p-3 rounded-lg">
                      <p className="text-xs text-gray-400">Employees</p>
                      <p className="text-xl font-bold text-white">47</p>
                    </div>
                  </div>
                  <Separator className="bg-gray-700" />
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Tax Year Progress</span>
                    <span className="text-white">10/12 months</span>
                  </div>
                  <Progress value={83} className="h-2 bg-gray-700" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* VAT Tab */}
        <TabsContent value="vat" className="mt-4">
          <Card className="bg-[#1E293B] border-gray-700">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-base">VAT201 Returns</CardTitle>
                <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C] text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create VAT Return
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {vatReturns.map((vat) => (
                    <div 
                      key={vat.id}
                      className="p-4 rounded-lg bg-[#0F172A] border border-gray-700/50 cursor-pointer hover:border-gray-600"
                      onClick={() => { setSelectedVAT(vat); setVatDialogOpen(true); }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-500/20 text-purple-400">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              {new Date(vat.periodStart).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}
                            </p>
                            <p className="text-xs text-gray-400">{vat.periodStart} to {vat.periodEnd}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(vat.status)}
                          {vat.status === 'ready' && (
                            <Button 
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setSelectedVAT(vat); 
                                setVatDialogOpen(true); 
                              }}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Submit
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400 text-xs">Output VAT</p>
                          <p className="text-white">{formatCurrency(vat.outputVat)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">Input VAT</p>
                          <p className="text-white">{formatCurrency(vat.inputVat)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">Net VAT</p>
                          <p className={`font-medium ${vat.netVat > 0 ? 'text-amber-400' : 'text-green-400'}`}>
                            {formatCurrency(vat.netVat)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">Total Sales</p>
                          <p className="text-white">{formatCurrency(vat.totalSales)}</p>
                        </div>
                      </div>
                      
                      {vat.sarsReference && (
                        <div className="mt-3 pt-3 border-t border-gray-700">
                          <p className="text-xs text-gray-500">
                            SARS Ref: {vat.sarsReference} • Submitted: {vat.submittedAt ? formatDate(vat.submittedAt) : 'N/A'}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PAYE Tab */}
        <TabsContent value="paye" className="mt-4">
          <Card className="bg-[#1E293B] border-gray-700">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-base">EMP201 Monthly Declarations</CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="border-gray-600 text-gray-300">
                    <Download className="h-4 w-4 mr-2" />
                    Export IRP5
                  </Button>
                  <Button size="sm" className="bg-[#00897B] hover:bg-[#00695C] text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    New Declaration
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {payeRecords.map((paye) => (
                    <div 
                      key={paye.id}
                      className="p-4 rounded-lg bg-[#0F172A] border border-gray-700/50"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-500/20 text-blue-400">
                            <Users className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-white font-medium">{paye.period}</p>
                            <p className="text-xs text-gray-400">Tax Year: {paye.taxYear}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(paye.status)}
                          {paye.status === 'draft' && (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                              <Send className="h-4 w-4 mr-2" />
                              Submit
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-5 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400 text-xs">Payroll</p>
                          <p className="text-white">{formatCurrency(paye.payrollAmount)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">PAYE</p>
                          <p className="text-white">{formatCurrency(paye.payeDeducted)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">UIF</p>
                          <p className="text-white">{formatCurrency(paye.uifDeducted)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">SDL</p>
                          <p className="text-white">{formatCurrency(paye.sdlDeducted)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">Employees</p>
                          <p className="text-white">{paye.employeesCount}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* EMP501 Reconciliation */}
          <Card className="bg-[#1E293B] border-gray-700 mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base">EMP501 Annual Reconciliation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-[#0F172A] p-4 rounded-lg border border-gray-700">
                  <h4 className="text-white font-medium mb-3">2025/2026 Tax Year</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status</span>
                      <Badge className="bg-amber-500/20 text-amber-400">In Progress</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Months Completed</span>
                      <span className="text-white">10/12</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">IRP5s Generated</span>
                      <span className="text-white">47</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Due Date</span>
                      <span className="text-amber-400">May 31, 2026</span>
                    </div>
                  </div>
                  <Progress value={83} className="h-2 mt-4 bg-gray-700" />
                </div>
                <div className="bg-[#0F172A] p-4 rounded-lg border border-gray-700">
                  <h4 className="text-white font-medium mb-3">Quick Actions</h4>
                  <div className="space-y-2">
                    <Button className="w-full justify-start bg-[#00897B] hover:bg-[#00695C] text-white">
                      <Download className="h-4 w-4 mr-2" />
                      Download IRP5 Summary
                    </Button>
                    <Button variant="outline" className="w-full justify-start border-gray-600 text-gray-300">
                      <Users className="h-4 w-4 mr-2" />
                      Review Employee Data
                    </Button>
                    <Button variant="outline" className="w-full justify-start border-gray-600 text-gray-300">
                      <Calculator className="h-4 w-4 mr-2" />
                      Run Reconciliation
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calculator Tab */}
        <TabsContent value="calculator" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-[#1E293B] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-[#00897B]" />
                  VAT Calculator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Amount (Incl. VAT)</Label>
                  <Input 
                    type="number"
                    placeholder="Enter amount including VAT"
                    className="bg-[#0F172A] border-gray-600 text-white"
                    defaultValue={1000}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">VAT Rate</Label>
                  <Select defaultValue="15">
                    <SelectTrigger className="bg-[#0F172A] border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15% (Standard)</SelectItem>
                      <SelectItem value="0">0% (Zero-rated)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator className="bg-gray-700" />
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Amount (Excl. VAT)</span>
                    <span className="text-white font-medium">R 869.57</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">VAT Amount</span>
                    <span className="text-[#00897B] font-medium">R 130.43</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Amount (Incl. VAT)</span>
                    <span className="text-white font-medium">R 1,000.00</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1E293B] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Percent className="h-4 w-4 text-[#00897B]" />
                  PAYE Calculator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Annual Income</Label>
                  <Input 
                    type="number"
                    placeholder="Enter annual income"
                    className="bg-[#0F172A] border-gray-600 text-white"
                    defaultValue={500000}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Age</Label>
                  <Select defaultValue="under65">
                    <SelectTrigger className="bg-[#0F172A] border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under65">Under 65</SelectItem>
                      <SelectItem value="65to74">65 to 74</SelectItem>
                      <SelectItem value="over75">75 and over</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator className="bg-gray-700" />
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Taxable Income</span>
                    <span className="text-white font-medium">R 500,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tax Before Rebate</span>
                    <span className="text-white font-medium">R 103,252</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Rebate</span>
                    <span className="text-green-400 font-medium">- R 17,235</span>
                  </div>
                  <Separator className="bg-gray-700" />
                  <div className="flex justify-between">
                    <span className="text-gray-400">Annual Tax</span>
                    <span className="text-[#00897B] font-bold text-lg">R 86,017</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Monthly PAYE</span>
                    <span className="text-white font-medium">R 7,168.08</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* VAT Detail Dialog */}
      <Dialog open={vatDialogOpen} onOpenChange={setVatDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1E293B] border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-400" />
              VAT201 Return Details
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Period: {selectedVAT?.periodStart} to {selectedVAT?.periodEnd}
            </DialogDescription>
          </DialogHeader>

          {selectedVAT && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                {getStatusBadge(selectedVAT.status)}
                {selectedVAT.sarsReference && (
                  <span className="text-sm text-gray-400">
                    SARS Ref: {selectedVAT.sarsReference}
                  </span>
                )}
              </div>

              {/* VAT Breakdown */}
              <div className="bg-[#0F172A] p-4 rounded-lg space-y-4">
                <h4 className="text-white font-medium">VAT Calculation</h4>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Output VAT (VAT on Sales)</span>
                    <span className="text-white">{formatCurrency(selectedVAT.outputVat)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Input VAT (VAT on Purchases)</span>
                    <span className="text-white">- {formatCurrency(selectedVAT.inputVat)}</span>
                  </div>
                  <Separator className="bg-gray-700" />
                  <div className="flex justify-between">
                    <span className="text-white font-medium">Net VAT {selectedVAT.netVat > 0 ? 'Payable' : 'Refundable'}</span>
                    <span className={`font-bold text-lg ${selectedVAT.netVat > 0 ? 'text-amber-400' : 'text-green-400'}`}>
                      {formatCurrency(Math.abs(selectedVAT.netVat))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sales Details */}
              <div className="bg-[#0F172A] p-4 rounded-lg space-y-3">
                <h4 className="text-white font-medium">Sales Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Total Sales (Incl. VAT)</p>
                    <p className="text-white">{formatCurrency(selectedVAT.totalSales)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Zero-Rated Sales</p>
                    <p className="text-white">{formatCurrency(selectedVAT.zeroRated)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Exports</p>
                    <p className="text-white">{formatCurrency(selectedVAT.exports)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Capital Goods</p>
                    <p className="text-white">{formatCurrency(selectedVAT.capitalGoods)}</p>
                  </div>
                </div>
              </div>

              {/* Purchase Details */}
              <div className="bg-[#0F172A] p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-400 text-sm">Total Purchases</p>
                    <p className="text-white">{formatCurrency(selectedVAT.totalPurchases)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-sm">Payment Due Date</p>
                    <p className="text-amber-400">{selectedVAT.paymentDueDate ? formatDate(selectedVAT.paymentDueDate) : 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {selectedVAT.status === 'ready' && (
                <div className="flex gap-2">
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => submitVATReturn(selectedVAT)}
                    disabled={submitting}
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                    Submit to SARS
                  </Button>
                  <Button 
                    variant="outline"
                    className="border-gray-600 text-gray-300"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
