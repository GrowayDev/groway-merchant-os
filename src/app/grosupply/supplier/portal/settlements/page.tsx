'use client'

import { useState, useEffect } from 'react'
import {
  Wallet,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Download,
  Filter,
  Banknote,
  CreditCard,
  QrCode,
  Zap,
  AlertCircle,
  Building2,
  Receipt,
  ArrowRight,
  RefreshCw,
  Eye,
  ChevronRight,
  Info,
  Bell,
  Settings,
  Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { useSupplierAuth } from '../layout'

interface Settlement {
  id: string
  amount: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  invoice: string
  orderNumber: string
  merchant: string
  method: 'instant' | 'standard' | 'scheduled'
  createdAt: string
  completedAt?: string
  estimatedArrival?: string
  reference?: string
  fee: number
  netAmount: number
  bankAccount?: {
    bank: string
    accountLast4: string
  }
}

interface PaymentSchedule {
  id: string
  invoice: string
  merchant: string
  amount: number
  scheduledDate: string
  status: 'scheduled' | 'processing' | 'completed'
}

interface BankAccount {
  id: string
  bank: string
  accountName: string
  accountNumber: string
  accountType: 'checking' | 'savings'
  isDefault: boolean
  verified: boolean
}

const mockSettlements: Settlement[] = [
  {
    id: 'SET-001',
    amount: 1587.00,
    status: 'pending',
    invoice: 'INV-2026-0500',
    orderNumber: 'PO-2026-00125',
    merchant: 'City Butchery',
    method: 'instant',
    createdAt: '2026-01-16T10:00:00',
    estimatedArrival: '2026-01-16T14:00:00',
    fee: 23.81,
    netAmount: 1563.19,
    bankAccount: { bank: 'FNB', accountLast4: '4567' }
  },
  {
    id: 'SET-002',
    amount: 2696.75,
    status: 'processing',
    invoice: 'INV-2026-0504',
    orderNumber: 'PO-2026-00124',
    merchant: 'Fresh Market SA',
    method: 'standard',
    createdAt: '2026-01-15T14:00:00',
    estimatedArrival: '2026-01-17T16:00:00',
    reference: 'PAY-2026-89234',
    fee: 13.48,
    netAmount: 2683.27,
    bankAccount: { bank: 'FNB', accountLast4: '4567' }
  },
  {
    id: 'SET-003',
    amount: 3306.25,
    status: 'completed',
    invoice: 'INV-2026-0503',
    orderNumber: 'PO-2026-00123',
    merchant: 'QuickSpar Foods',
    method: 'instant',
    createdAt: '2026-01-14T09:00:00',
    completedAt: '2026-01-14T13:00:00',
    reference: 'PAY-2026-89150',
    fee: 49.59,
    netAmount: 3256.66,
    bankAccount: { bank: 'FNB', accountLast4: '4567' }
  },
  {
    id: 'SET-004',
    amount: 4250.00,
    status: 'completed',
    invoice: 'INV-2026-0495',
    orderNumber: 'PO-2026-00110',
    merchant: 'Metro Supermarket',
    method: 'standard',
    createdAt: '2026-01-10T11:00:00',
    completedAt: '2026-01-12T10:00:00',
    reference: 'PAY-2026-88900',
    fee: 21.25,
    netAmount: 4228.75,
    bankAccount: { bank: 'FNB', accountLast4: '4567' }
  },
  {
    id: 'SET-005',
    amount: 890.00,
    status: 'completed',
    invoice: 'INV-2026-0490',
    orderNumber: 'PO-2026-00105',
    merchant: 'Corner Cafe',
    method: 'instant',
    createdAt: '2026-01-08T16:00:00',
    completedAt: '2026-01-08T20:00:00',
    reference: 'PAY-2026-88750',
    fee: 13.35,
    netAmount: 876.65,
    bankAccount: { bank: 'FNB', accountLast4: '4567' }
  },
  {
    id: 'SET-006',
    amount: 1250.00,
    status: 'failed',
    invoice: 'INV-2026-0485',
    orderNumber: 'PO-2026-00100',
    merchant: 'Test Customer',
    method: 'instant',
    createdAt: '2026-01-07T14:00:00',
    fee: 0,
    netAmount: 1250.00
  }
]

const mockScheduledPayments: PaymentSchedule[] = [
  { id: 'SCH-001', invoice: 'INV-2026-0510', merchant: 'New Customer A', amount: 2100.00, scheduledDate: '2026-01-20', status: 'scheduled' },
  { id: 'SCH-002', invoice: 'INV-2026-0511', merchant: 'New Customer B', amount: 1850.00, scheduledDate: '2026-01-22', status: 'scheduled' },
]

const mockBankAccounts: BankAccount[] = [
  { id: 'BA-001', bank: 'FNB', accountName: 'Demo Supplier Pty Ltd', accountNumber: '****4567', accountType: 'checking', isDefault: true, verified: true },
  { id: 'BA-002', bank: 'Capitec', accountName: 'Demo Supplier Pty Ltd', accountNumber: '****8901', accountType: 'savings', isDefault: false, verified: true },
]

export default function SupplierSettlementsPage() {
  const { supplier } = useSupplierAuth()
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [scheduledPayments, setScheduledPayments] = useState<PaymentSchedule[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null)
  const [addBankDialogOpen, setAddBankDialogOpen] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setSettlements(mockSettlements)
      setScheduledPayments(mockScheduledPayments)
      setBankAccounts(mockBankAccounts)
      setIsLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [supplier])

  const pendingAmount = settlements.filter(s => s.status === 'pending').reduce((sum, s) => sum + s.amount, 0)
  const processingAmount = settlements.filter(s => s.status === 'processing').reduce((sum, s) => sum + s.amount, 0)
  const completedAmount = settlements.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.netAmount, 0)
  const scheduledAmount = scheduledPayments.reduce((sum, s) => sum + s.amount, 0)

  const thisMonthSettled = settlements
    .filter(s => s.status === 'completed' && s.completedAt && new Date(s.completedAt).getMonth() === new Date().getMonth())
    .reduce((sum, s) => sum + s.netAmount, 0)

  const formatCurrency = (amount: number) => 
    `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('en-ZA', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const statusConfig: Record<string, { color: string; bgColor: string; label: string }> = {
    pending: { color: 'text-amber-700', bgColor: 'bg-amber-100', label: 'Pending' },
    processing: { color: 'text-blue-700', bgColor: 'bg-blue-100', label: 'Processing' },
    completed: { color: 'text-green-700', bgColor: 'bg-green-100', label: 'Completed' },
    failed: { color: 'text-red-700', bgColor: 'bg-red-100', label: 'Failed' },
  }

  const methodConfig: Record<string, { label: string; fee: string; time: string; icon: typeof Zap }> = {
    instant: { label: 'Instant (4h)', fee: '1.5%', time: '4 hours', icon: Zap },
    standard: { label: 'Standard (T+1)', fee: '0.5%', time: '1-2 business days', icon: Clock },
    scheduled: { label: 'Net 30', fee: 'Free', time: '30 days', icon: Calendar },
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-[#00897B] border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Settlements</h1>
          <p className="text-[#757575]">Track your GroSettle payments and payouts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export History
          </Button>
          <Button variant="outline" onClick={() => setAddBankDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Bank Account
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-amber-400">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#757575]">Pending Settlement</p>
                <p className="text-2xl font-bold">{formatCurrency(pendingAmount)}</p>
                <p className="text-xs text-amber-600 mt-1">{settlements.filter(s => s.status === 'pending').length} settlement(s)</p>
              </div>
              <Clock className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-400">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#757575]">Processing</p>
                <p className="text-2xl font-bold">{formatCurrency(processingAmount)}</p>
                <p className="text-xs text-blue-600 mt-1">Arriving in 1-2 days</p>
              </div>
              <RefreshCw className="h-8 w-8 text-blue-400 animate-spin" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-400">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#757575]">Settled This Month</p>
                <p className="text-2xl font-bold">{formatCurrency(thisMonthSettled)}</p>
                <p className="text-xs text-green-600 mt-1">{settlements.filter(s => s.status === 'completed').length} payments</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-400">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#757575]">Scheduled</p>
                <p className="text-2xl font-bold">{formatCurrency(scheduledAmount)}</p>
                <p className="text-xs text-purple-600 mt-1">{scheduledPayments.length} upcoming</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* GroSettle Options Info */}
      <Card className="bg-gradient-to-r from-[#E0F2F1] to-[#E8F5E9]">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#00897B] flex items-center justify-center flex-shrink-0">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[#1A1A1A]">GroSettle Payment Options</h3>
              <div className="grid grid-cols-3 gap-6 mt-3">
                <div className="bg-white/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-4 w-4 text-amber-500" />
                    <span className="font-medium">Instant (4h)</span>
                  </div>
                  <p className="text-sm text-[#757575]">1.5% fee • Fastest payout</p>
                  <p className="text-xs text-[#00897B]">Best for urgent cash flow</p>
                </div>
                <div className="bg-white/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Standard (T+1)</span>
                  </div>
                  <p className="text-sm text-[#757575]">0.5% fee • Next business day</p>
                  <p className="text-xs text-[#00897B]">Balanced speed & cost</p>
                </div>
                <div className="bg-white/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-purple-500" />
                    <span className="font-medium">Net 30</span>
                  </div>
                  <p className="text-sm text-[#757575]">No fee • 30 days terms</p>
                  <p className="text-xs text-[#00897B]">Maximum savings</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="history" className="space-y-4">
        <TabsList>
          <TabsTrigger value="history">Settlement History</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled ({scheduledPayments.length})</TabsTrigger>
          <TabsTrigger value="accounts">Bank Accounts</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">All Settlements</CardTitle>
                <div className="flex gap-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {settlements.map((settlement) => {
                    const config = statusConfig[settlement.status]
                    const methodInfo = methodConfig[settlement.method]
                    const MethodIcon = methodInfo.icon

                    return (
                      <div 
                        key={settlement.id} 
                        className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-all"
                        onClick={() => setSelectedSettlement(settlement)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                              {settlement.status === 'completed' ? (
                                <CheckCircle2 className={`h-6 w-6 ${config.color}`} />
                              ) : settlement.status === 'processing' ? (
                                <RefreshCw className={`h-6 w-6 ${config.color} animate-spin`} />
                              ) : settlement.status === 'failed' ? (
                                <AlertCircle className={`h-6 w-6 ${config.color}`} />
                              ) : (
                                <Clock className={`h-6 w-6 ${config.color}`} />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-[#1A1A1A]">{formatCurrency(settlement.amount)}</p>
                                <Badge className={`${config.bgColor} ${config.color} border-0`}>{config.label}</Badge>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-[#757575] mt-1">
                                <span className="flex items-center gap-1">
                                  <Receipt className="h-3.5 w-3.5" />
                                  {settlement.invoice}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Building2 className="h-3.5 w-3.5" />
                                  {settlement.merchant}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="mb-1">
                              <MethodIcon className="h-3 w-3 mr-1" />
                              {methodInfo.label}
                            </Badge>
                            <p className="text-xs text-[#757575]">{formatDate(settlement.createdAt)}</p>
                            {settlement.bankAccount && (
                              <p className="text-xs text-[#757575]">{settlement.bankAccount.bank} •{settlement.bankAccount.accountLast4}</p>
                            )}
                          </div>
                        </div>
                        {settlement.status === 'completed' && settlement.completedAt && (
                          <div className="mt-2 pt-2 border-t text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Settled on {formatDateTime(settlement.completedAt)} • Reference: {settlement.reference}
                          </div>
                        )}
                        {settlement.status === 'processing' && settlement.estimatedArrival && (
                          <div className="mt-2 pt-2 border-t text-xs text-blue-600 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Expected by {formatDateTime(settlement.estimatedArrival)}
                          </div>
                        )}
                        {settlement.status === 'failed' && (
                          <div className="mt-2 pt-2 border-t text-xs text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Payment failed - Please contact support
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Scheduled Payments</CardTitle>
              <CardDescription>Payments scheduled for future dates</CardDescription>
            </CardHeader>
            <CardContent>
              {scheduledPayments.length === 0 ? (
                <div className="text-center py-8 text-[#757575]">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No scheduled payments</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scheduledPayments.map((payment) => (
                    <div key={payment.id} className="border rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                          <Calendar className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                          <p className="text-sm text-[#757575]">{payment.invoice} • {payment.merchant}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatDate(payment.scheduledDate)}</p>
                        <Badge variant="outline">Scheduled</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Bank Accounts</CardTitle>
                <Button size="sm" onClick={() => setAddBankDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Account
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bankAccounts.map((account) => (
                  <div key={account.id} className="border rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-[#E0F2F1] flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-[#00897B]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{account.bank}</p>
                          {account.isDefault && (
                            <Badge className="bg-[#00897B] text-white">Default</Badge>
                          )}
                          {account.verified && (
                            <Badge variant="outline" className="text-green-600 border-green-200">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-[#757575]">{account.accountName}</p>
                        <p className="text-xs text-[#757575]">{account.accountNumber} • {account.accountType}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Settlement Detail Dialog */}
      <Dialog open={!!selectedSettlement} onOpenChange={(open) => !open && setSelectedSettlement(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settlement Details</DialogTitle>
            <DialogDescription>{selectedSettlement?.id}</DialogDescription>
          </DialogHeader>
          {selectedSettlement && (
            <div className="space-y-4 py-4">
              <div className="text-center p-4 bg-[#E0F2F1] rounded-lg">
                <p className="text-3xl font-bold text-[#00897B]">{formatCurrency(selectedSettlement.amount)}</p>
                <Badge className={`${statusConfig[selectedSettlement.status].bgColor} ${statusConfig[selectedSettlement.status].color} border-0 mt-2`}>
                  {statusConfig[selectedSettlement.status].label}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[#757575]">Invoice</p>
                  <p className="font-medium">{selectedSettlement.invoice}</p>
                </div>
                <div>
                  <p className="text-[#757575]">Order</p>
                  <p className="font-medium">{selectedSettlement.orderNumber}</p>
                </div>
                <div>
                  <p className="text-[#757575]">Merchant</p>
                  <p className="font-medium">{selectedSettlement.merchant}</p>
                </div>
                <div>
                  <p className="text-[#757575]">Payment Method</p>
                  <p className="font-medium">{methodConfig[selectedSettlement.method].label}</p>
                </div>
                <div>
                  <p className="text-[#757575]">Processing Fee</p>
                  <p className="font-medium text-red-600">-{formatCurrency(selectedSettlement.fee)}</p>
                </div>
                <div>
                  <p className="text-[#757575]">Net Amount</p>
                  <p className="font-semibold text-green-600">{formatCurrency(selectedSettlement.netAmount)}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#757575]">Created</span>
                  <span>{formatDateTime(selectedSettlement.createdAt)}</span>
                </div>
                {selectedSettlement.completedAt && (
                  <div className="flex justify-between">
                    <span className="text-[#757575]">Completed</span>
                    <span className="text-green-600">{formatDateTime(selectedSettlement.completedAt)}</span>
                  </div>
                )}
                {selectedSettlement.reference && (
                  <div className="flex justify-between">
                    <span className="text-[#757575]">Reference</span>
                    <span className="font-mono">{selectedSettlement.reference}</span>
                  </div>
                )}
                {selectedSettlement.bankAccount && (
                  <div className="flex justify-between">
                    <span className="text-[#757575]">Bank Account</span>
                    <span>{selectedSettlement.bankAccount.bank} •{selectedSettlement.bankAccount.accountLast4}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSettlement(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Bank Account Dialog */}
      <Dialog open={addBankDialogOpen} onOpenChange={setAddBankDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Bank Account</DialogTitle>
            <DialogDescription>Link a bank account for receiving settlements</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Bank</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select bank" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fnb">FNB (First National Bank)</SelectItem>
                  <SelectItem value="standard">Standard Bank</SelectItem>
                  <SelectItem value="absa">Absa</SelectItem>
                  <SelectItem value="capitec">Capitec</SelectItem>
                  <SelectItem value="nedbank">Nedbank</SelectItem>
                  <SelectItem value="investec">Investec</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Account Holder Name</Label>
              <Input placeholder="Account holder name" />
            </div>
            <div>
              <Label>Account Number</Label>
              <Input placeholder="Account number" />
            </div>
            <div>
              <Label>Account Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Cheque/Current</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
              <Info className="h-4 w-4 inline mr-2" />
              Verification may take 1-2 business days. A small deposit will be made to verify the account.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddBankDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => setAddBankDialogOpen(false)} className="bg-[#00897B] hover:bg-[#00695C]">
              Add Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
