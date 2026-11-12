'use client'

import { useState, useEffect } from 'react'
import {
  Receipt,
  Upload,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Eye,
  Search,
  Filter,
  DollarSign,
  Calendar,
  TrendingUp,
  ArrowRight,
  Package,
  Building2,
  Link2,
  Unlink,
  Plus,
  Send,
  X,
  Check,
  FileCheck,
  FileX,
  RefreshCw,
  Printer,
  MoreVertical
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
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
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSupplierAuth } from '../layout'

interface InvoiceItem {
  id: string
  sku: string
  name: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number
  poQuantity?: number
  grnQuantity?: number
  status: 'matched' | 'variance' | 'pending'
  variance?: number
}

interface Invoice {
  id: string
  number: string
  order: {
    id: string
    poNumber: string
    merchant: string
  }
  items: InvoiceItem[]
  subtotal: number
  vat: number
  total: number
  status: 'draft' | 'pending' | 'matched' | 'partial_match' | 'variance' | 'approved' | 'paid'
  paymentStatus: 'pending' | 'processing' | 'paid'
  submittedAt?: string
  matchedAt?: string
  paidAt?: string
  dueDate: string
  matchDetails?: {
    poTotal: number
    grnTotal: number
    invoiceTotal: number
    variance: number
    variancePercent: number
    matchStatus: 'matched' | 'variance' | 'pending'
  }
  notes?: string
  documents: {
    type: string
    name: string
    url: string
  }[]
}

const mockInvoices: Invoice[] = [
  {
    id: 'INV-001',
    number: 'INV-2026-0500',
    order: { id: 'ORD-003', poNumber: 'PO-2026-00125', merchant: 'City Butchery' },
    items: [
      { id: 'ITM-001', sku: 'PK-001', name: 'Vacuum Pack Bags 500pcs', quantity: 2, unit: 'box', unitPrice: 450.00, totalPrice: 900.00, poQuantity: 2, grnQuantity: 2, status: 'matched' },
      { id: 'ITM-002', sku: 'CL-002', name: 'Meat Safe Sanitizer 5L', quantity: 4, unit: 'container', unitPrice: 120.00, totalPrice: 480.00, poQuantity: 4, grnQuantity: 4, status: 'matched' },
    ],
    subtotal: 1380.00,
    vat: 207.00,
    total: 1587.00,
    status: 'matched',
    paymentStatus: 'pending',
    submittedAt: '2026-01-15',
    matchedAt: '2026-01-16',
    dueDate: '2026-01-30',
    matchDetails: {
      poTotal: 1587.00,
      grnTotal: 1587.00,
      invoiceTotal: 1587.00,
      variance: 0,
      variancePercent: 0,
      matchStatus: 'matched'
    },
    documents: [
      { type: 'invoice', name: 'INV-2026-0500.pdf', url: '#' },
      { type: 'pod', name: 'POD-2026-0500.pdf', url: '#' }
    ]
  },
  {
    id: 'INV-002',
    number: 'INV-2026-0501',
    order: { id: 'ORD-004', poNumber: 'PO-2026-00126', merchant: 'Metro Supermarket' },
    items: [
      { id: 'ITM-003', sku: 'FP-004', name: 'Banana Box 18kg', quantity: 5, unit: 'box', unitPrice: 280.00, totalPrice: 1400.00, poQuantity: 5, grnQuantity: 5, status: 'matched' },
      { id: 'ITM-004', sku: 'FP-005', name: 'Apple Box 15kg', quantity: 3, unit: 'box', unitPrice: 320.00, totalPrice: 960.00, poQuantity: 3, grnQuantity: 2, status: 'variance', variance: 1 },
    ],
    subtotal: 2360.00,
    vat: 354.00,
    total: 2714.00,
    status: 'variance',
    paymentStatus: 'pending',
    submittedAt: '2026-01-16',
    dueDate: '2026-01-31',
    matchDetails: {
      poTotal: 2714.00,
      grnTotal: 2394.00,
      invoiceTotal: 2714.00,
      variance: 320.00,
      variancePercent: 11.8,
      matchStatus: 'variance'
    },
    documents: [
      { type: 'invoice', name: 'INV-2026-0501.pdf', url: '#' }
    ],
    notes: 'GRN shows only 2 Apple boxes received. Investigating discrepancy.'
  },
  {
    id: 'INV-003',
    number: 'INV-2026-0502',
    order: { id: 'ORD-005', poNumber: 'PO-2026-00127', merchant: 'Corner Cafe' },
    items: [
      { id: 'ITM-005', sku: 'BV-002', name: 'Coca-Cola 2L', quantity: 2, unit: 'case', unitPrice: 180.00, totalPrice: 360.00, poQuantity: 2, grnQuantity: undefined, status: 'pending' },
      { id: 'ITM-006', sku: 'SN-001', name: 'Potato Chips Mixed', quantity: 5, unit: 'box', unitPrice: 95.00, totalPrice: 475.00, poQuantity: 5, grnQuantity: undefined, status: 'pending' },
    ],
    subtotal: 835.00,
    vat: 125.25,
    total: 960.25,
    status: 'pending',
    paymentStatus: 'pending',
    submittedAt: '2026-01-17',
    dueDate: '2026-02-01',
    documents: [
      { type: 'invoice', name: 'INV-2026-0502.pdf', url: '#' }
    ]
  },
  {
    id: 'INV-004',
    number: 'INV-2026-0503',
    order: { id: 'ORD-001', poNumber: 'PO-2026-00123', merchant: 'QuickSpar Foods' },
    items: [
      { id: 'ITM-007', sku: 'FP-001', name: 'Fresh Produce Bundle', quantity: 10, unit: 'pack', unitPrice: 150.00, totalPrice: 1500.00, poQuantity: 10, grnQuantity: 10, status: 'matched' },
      { id: 'ITM-008', sku: 'DR-001', name: 'Full Cream Milk 2L', quantity: 20, unit: 'bottle', unitPrice: 32.50, totalPrice: 650.00, poQuantity: 20, grnQuantity: 20, status: 'matched' },
      { id: 'ITM-009', sku: 'DR-002', name: 'Cheddar Cheese 1kg', quantity: 5, unit: 'block', unitPrice: 145.00, totalPrice: 725.00, poQuantity: 5, grnQuantity: 5, status: 'matched' },
    ],
    subtotal: 2875.00,
    vat: 431.25,
    total: 3306.25,
    status: 'paid',
    paymentStatus: 'paid',
    submittedAt: '2026-01-10',
    matchedAt: '2026-01-11',
    paidAt: '2026-01-15',
    dueDate: '2026-01-25',
    matchDetails: {
      poTotal: 3306.25,
      grnTotal: 3306.25,
      invoiceTotal: 3306.25,
      variance: 0,
      variancePercent: 0,
      matchStatus: 'matched'
    },
    documents: [
      { type: 'invoice', name: 'INV-2026-0503.pdf', url: '#' },
      { type: 'pod', name: 'POD-2026-0503.pdf', url: '#' }
    ]
  },
  {
    id: 'INV-005',
    number: 'INV-2026-0504',
    order: { id: 'ORD-002', poNumber: 'PO-2026-00124', merchant: 'Fresh Market SA' },
    items: [
      { id: 'ITM-010', sku: 'FP-002', name: 'Organic Salad Mix', quantity: 25, unit: 'pack', unitPrice: 45.00, totalPrice: 1125.00, poQuantity: 25, grnQuantity: 25, status: 'matched' },
      { id: 'ITM-011', sku: 'FP-003', name: 'Cherry Tomatoes 500g', quantity: 15, unit: 'punnet', unitPrice: 38.00, totalPrice: 570.00, poQuantity: 15, grnQuantity: 15, status: 'matched' },
      { id: 'ITM-012', sku: 'DR-003', name: 'Greek Yogurt 1kg', quantity: 10, unit: 'tub', unitPrice: 65.00, totalPrice: 650.00, poQuantity: 10, grnQuantity: 10, status: 'matched' },
    ],
    subtotal: 2345.00,
    vat: 351.75,
    total: 2696.75,
    status: 'approved',
    paymentStatus: 'processing',
    submittedAt: '2026-01-14',
    matchedAt: '2026-01-15',
    dueDate: '2026-01-29',
    matchDetails: {
      poTotal: 2696.75,
      grnTotal: 2696.75,
      invoiceTotal: 2696.75,
      variance: 0,
      variancePercent: 0,
      matchStatus: 'matched'
    },
    documents: [
      { type: 'invoice', name: 'INV-2026-0504.pdf', url: '#' }
    ]
  }
]

export default function SupplierInvoicesPage() {
  const { supplier } = useSupplierAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [newInvoiceDialogOpen, setNewInvoiceDialogOpen] = useState(false)

  // New invoice form
  const [newInvoice, setNewInvoice] = useState({
    orderNumber: '',
    invoiceNumber: '',
    amount: '',
    notes: ''
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      setInvoices(mockInvoices)
      setIsLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [supplier])

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.order.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.order.merchant.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    pending: invoices.filter(i => i.status === 'pending' || i.status === 'draft').length,
    matched: invoices.filter(i => i.status === 'matched' || i.status === 'approved').length,
    variance: invoices.filter(i => i.status === 'variance').length,
    paid: invoices.filter(i => i.status === 'paid').length,
    totalPending: invoices.filter(i => i.paymentStatus !== 'paid').reduce((sum, i) => sum + i.total, 0),
    totalPaid: invoices.filter(i => i.paymentStatus === 'paid').reduce((sum, i) => sum + i.total, 0)
  }

  const formatCurrency = (amount: number) => 
    `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const statusConfig: Record<string, { color: string; bgColor: string; label: string; icon: typeof FileText }> = {
    draft: { color: 'text-gray-700', bgColor: 'bg-gray-100', label: 'Draft', icon: FileText },
    pending: { color: 'text-amber-700', bgColor: 'bg-amber-100', label: 'Pending Match', icon: Clock },
    matched: { color: 'text-blue-700', bgColor: 'bg-blue-100', label: 'Matched', icon: Link2 },
    partial_match: { color: 'text-purple-700', bgColor: 'bg-purple-100', label: 'Partial Match', icon: Link2 },
    variance: { color: 'text-red-700', bgColor: 'bg-red-100', label: 'Variance', icon: Unlink },
    approved: { color: 'text-teal-700', bgColor: 'bg-teal-100', label: 'Approved', icon: CheckCircle2 },
    paid: { color: 'text-green-700', bgColor: 'bg-green-100', label: 'Paid', icon: CheckCircle2 },
  }

  const handleSubmitInvoice = () => {
    if (!newInvoice.invoiceNumber || !newInvoice.orderNumber || !newInvoice.amount) return

    const invoice: Invoice = {
      id: `INV-${String(invoices.length + 1).padStart(3, '0')}`,
      number: newInvoice.invoiceNumber,
      order: {
        id: `ORD-${invoices.length + 1}`,
        poNumber: newInvoice.orderNumber,
        merchant: 'New Customer'
      },
      items: [
        { id: 'ITM-001', sku: 'N/A', name: 'Invoice Item', quantity: 1, unit: 'unit', unitPrice: parseFloat(newInvoice.amount), totalPrice: parseFloat(newInvoice.amount), status: 'pending' }
      ],
      subtotal: parseFloat(newInvoice.amount),
      vat: parseFloat(newInvoice.amount) * 0.15,
      total: parseFloat(newInvoice.amount) * 1.15,
      status: 'pending',
      paymentStatus: 'pending',
      submittedAt: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: newInvoice.notes,
      documents: []
    }

    setInvoices(prev => [invoice, ...prev])
    setNewInvoiceDialogOpen(false)
    setNewInvoice({ orderNumber: '', invoiceNumber: '', amount: '', notes: '' })
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
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Invoices</h1>
          <p className="text-[#757575]">Submit and track your invoices with 3-way matching</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setUploadDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload PDF
          </Button>
          <Button onClick={() => setNewInvoiceDialogOpen(true)} className="bg-[#00897B] hover:bg-[#00695C]">
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-amber-400">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{stats.pending}</p>
            <p className="text-xs text-[#757575]">Pending Match</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-400">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{stats.matched}</p>
            <p className="text-xs text-[#757575]">Matched</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-400">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{stats.variance}</p>
            <p className="text-xs text-[#757575]">Variance</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-400">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{stats.paid}</p>
            <p className="text-xs text-[#757575]">Paid</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-[#00897B]">{formatCurrency(stats.totalPending)}</p>
            <p className="text-xs text-[#757575]">Pending Payment</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
          <Input placeholder="Search invoices..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending Match</SelectItem>
            <SelectItem value="matched">Matched</SelectItem>
            <SelectItem value="variance">Variance</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoices List */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({invoices.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
          <TabsTrigger value="matched">Matched ({stats.matched})</TabsTrigger>
          <TabsTrigger value="variance">Variance ({stats.variance})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3 mt-4">
          {filteredInvoices.map((invoice) => {
            const config = statusConfig[invoice.status]
            const StatusIcon = config.icon
            return (
              <Card key={invoice.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedInvoice(invoice)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                        <StatusIcon className={`h-6 w-6 ${config.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-[#1A1A1A]">{invoice.number}</p>
                          <Badge className={`${config.bgColor} ${config.color} border-0`}>{config.label}</Badge>
                          {invoice.matchDetails?.variance && invoice.matchDetails.variance > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {invoice.matchDetails.variancePercent.toFixed(1)}% variance
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-[#757575]">
                          <span className="flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5" />
                            {invoice.order.poNumber}
                          </span>
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5" />
                            {invoice.order.merchant}
                          </span>
                          <span>{invoice.items.length} items</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-[#757575] mt-1">
                          <span>Submitted: {formatDate(invoice.submittedAt || '')}</span>
                          <span>Due: {formatDate(invoice.dueDate)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-[#1A1A1A]">{formatCurrency(invoice.total)}</p>
                      <div className="flex items-center gap-2 justify-end mt-2">
                        {invoice.paymentStatus === 'paid' && (
                          <Badge className="bg-green-100 text-green-700 border-0">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Paid
                          </Badge>
                        )}
                        {invoice.paymentStatus === 'processing' && (
                          <Badge className="bg-blue-100 text-blue-700 border-0">
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            Processing
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>

        <TabsContent value="pending" className="space-y-3 mt-4">
          {filteredInvoices.filter(i => i.status === 'pending' || i.status === 'draft').map((invoice) => (
            <Card key={invoice.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedInvoice(invoice)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-amber-500" />
                    <div>
                      <p className="font-semibold">{invoice.number}</p>
                      <p className="text-sm text-[#757575]">{invoice.order.merchant} • Awaiting GRN for matching</p>
                    </div>
                  </div>
                  <p className="font-bold">{formatCurrency(invoice.total)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="matched" className="space-y-3 mt-4">
          {filteredInvoices.filter(i => i.status === 'matched' || i.status === 'approved').map((invoice) => (
            <Card key={invoice.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedInvoice(invoice)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Link2 className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-semibold">{invoice.number}</p>
                      <p className="text-sm text-[#757575]">{invoice.order.merchant} • 3-way match complete</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(invoice.total)}</p>
                    <p className="text-xs text-[#757575]">{invoice.status === 'approved' ? 'Approved for payment' : 'Awaiting approval'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="variance" className="space-y-3 mt-4">
          {filteredInvoices.filter(i => i.status === 'variance').map((invoice) => (
            <Card key={invoice.id} className="hover:shadow-md transition-shadow cursor-pointer border-red-200" onClick={() => setSelectedInvoice(invoice)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Unlink className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="font-semibold">{invoice.number}</p>
                      <p className="text-sm text-red-600">Discrepancy detected - requires attention</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(invoice.total)}</p>
                    <p className="text-xs text-red-600">Variance: {formatCurrency(invoice.matchDetails?.variance || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Invoice Detail Dialog */}
      <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl">{selectedInvoice?.number}</DialogTitle>
                <DialogDescription>{selectedInvoice?.order.merchant} • {selectedInvoice?.order.poNumber}</DialogDescription>
              </div>
              {selectedInvoice && (
                <Badge className={`${statusConfig[selectedInvoice.status].bgColor} ${statusConfig[selectedInvoice.status].color} border-0`}>
                  {statusConfig[selectedInvoice.status].label}
                </Badge>
              )}
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-6 pr-4">
              {/* 3-Way Match Visualization */}
              {selectedInvoice?.matchDetails && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">3-Way Match Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-2">
                          <FileText className="h-8 w-8 text-blue-600" />
                        </div>
                        <p className="text-xs text-[#757575]">Purchase Order</p>
                        <p className="font-semibold">{formatCurrency(selectedInvoice.matchDetails.poTotal)}</p>
                      </div>
                      <ArrowRight className="h-6 w-6 text-gray-400" />
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-lg bg-purple-100 flex items-center justify-center mx-auto mb-2">
                          <Package className="h-8 w-8 text-purple-600" />
                        </div>
                        <p className="text-xs text-[#757575]">Goods Received</p>
                        <p className="font-semibold">{formatCurrency(selectedInvoice.matchDetails.grnTotal)}</p>
                      </div>
                      <ArrowRight className="h-6 w-6 text-gray-400" />
                      <div className="text-center">
                        <div className={`w-16 h-16 rounded-lg ${selectedInvoice.matchDetails.matchStatus === 'matched' ? 'bg-green-100' : 'bg-red-100'} flex items-center justify-center mx-auto mb-2`}>
                          <Receipt className={`h-8 w-8 ${selectedInvoice.matchDetails.matchStatus === 'matched' ? 'text-green-600' : 'text-red-600'}`} />
                        </div>
                        <p className="text-xs text-[#757575]">Invoice</p>
                        <p className="font-semibold">{formatCurrency(selectedInvoice.matchDetails.invoiceTotal)}</p>
                      </div>
                    </div>
                    {selectedInvoice.matchDetails.variance > 0 && (
                      <div className="mt-4 p-3 bg-red-50 rounded-lg text-center">
                        <p className="text-sm text-red-700">
                          <AlertCircle className="h-4 w-4 inline mr-1" />
                          Variance detected: {formatCurrency(selectedInvoice.matchDetails.variance)} ({selectedInvoice.matchDetails.variancePercent.toFixed(1)}%)
                        </p>
                      </div>
                    )}
                    {selectedInvoice.matchDetails.matchStatus === 'matched' && (
                      <div className="mt-4 p-3 bg-green-50 rounded-lg text-center">
                        <p className="text-sm text-green-700">
                          <CheckCircle2 className="h-4 w-4 inline mr-1" />
                          All documents match - Invoice approved for payment
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Invoice Items */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Invoice Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {selectedInvoice?.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded ${item.status === 'matched' ? 'bg-green-100' : item.status === 'variance' ? 'bg-red-100' : 'bg-amber-100'} flex items-center justify-center`}>
                            {item.status === 'matched' ? (
                              <FileCheck className="h-4 w-4 text-green-600" />
                            ) : item.status === 'variance' ? (
                              <FileX className="h-4 w-4 text-red-600" />
                            ) : (
                              <Clock className="h-4 w-4 text-amber-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-[#757575]">{item.sku} • {item.quantity} {item.unit} × {formatCurrency(item.unitPrice)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(item.totalPrice)}</p>
                          {item.status === 'variance' && item.variance && (
                            <p className="text-xs text-red-600">GRN: {item.grnQuantity} / PO: {item.poQuantity}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#757575]">Subtotal</span>
                      <span>{selectedInvoice && formatCurrency(selectedInvoice.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#757575]">VAT (15%)</span>
                      <span>{selectedInvoice && formatCurrency(selectedInvoice.vat)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-[#00897B]">{selectedInvoice && formatCurrency(selectedInvoice.total)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#757575]">Submitted</span>
                      <span>{selectedInvoice?.submittedAt && formatDate(selectedInvoice.submittedAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#757575]">Due Date</span>
                      <span>{selectedInvoice && formatDate(selectedInvoice.dueDate)}</span>
                    </div>
                    {selectedInvoice?.matchedAt && (
                      <div className="flex justify-between">
                        <span className="text-[#757575]">Matched</span>
                        <span>{formatDate(selectedInvoice.matchedAt)}</span>
                      </div>
                    )}
                    {selectedInvoice?.paidAt && (
                      <div className="flex justify-between">
                        <span className="text-[#757575]">Paid</span>
                        <span className="text-green-600">{formatDate(selectedInvoice.paidAt)}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Documents */}
              {selectedInvoice?.documents && selectedInvoice.documents.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Attached Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      {selectedInvoice.documents.map((doc, i) => (
                        <Button key={i} variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-2" />
                          {doc.name}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              {selectedInvoice?.notes && (
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-[#757575]">{selectedInvoice.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="mt-4">
            <div className="flex items-center justify-between w-full">
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
              <Button variant="outline" onClick={() => setSelectedInvoice(null)}>
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Invoice Dialog */}
      <Dialog open={newInvoiceDialogOpen} onOpenChange={setNewInvoiceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
            <DialogDescription>Submit a new invoice for an order</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Invoice Number *</Label>
              <Input placeholder="e.g., INV-2026-0001" value={newInvoice.invoiceNumber} onChange={(e) => setNewInvoice(prev => ({ ...prev, invoiceNumber: e.target.value }))} />
            </div>
            <div>
              <Label>Related PO Number *</Label>
              <Input placeholder="e.g., PO-2026-00123" value={newInvoice.orderNumber} onChange={(e) => setNewInvoice(prev => ({ ...prev, orderNumber: e.target.value }))} />
            </div>
            <div>
              <Label>Amount (R) *</Label>
              <Input type="number" placeholder="0.00" value={newInvoice.amount} onChange={(e) => setNewInvoice(prev => ({ ...prev, amount: e.target.value }))} />
              <p className="text-xs text-[#757575] mt-1">VAT (15%) will be calculated automatically</p>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea placeholder="Any additional notes..." rows={3} value={newInvoice.notes} onChange={(e) => setNewInvoice(prev => ({ ...prev, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewInvoiceDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitInvoice} disabled={!newInvoice.invoiceNumber || !newInvoice.orderNumber || !newInvoice.amount} className="bg-[#00897B] hover:bg-[#00695C]">
              <Send className="h-4 w-4 mr-2" />
              Submit Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Invoice PDF</DialogTitle>
            <DialogDescription>Upload your invoice PDF for automatic processing</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-[#757575]" />
              <p className="text-sm text-[#757575] mb-2">Drag and drop your invoice PDF here</p>
              <Button variant="outline">Browse Files</Button>
            </div>
            <div className="mt-4 space-y-3">
              <Input placeholder="Invoice Number" />
              <Input placeholder="Related PO Number" />
              <Input type="number" placeholder="Invoice Amount (R)" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => setUploadDialogOpen(false)} className="bg-[#00897B] hover:bg-[#00695C]">
              <Upload className="h-4 w-4 mr-2" />Upload Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
