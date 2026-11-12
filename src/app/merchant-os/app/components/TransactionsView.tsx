'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Search,
  Download,
  CreditCard,
  Banknote,
  QrCode,
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  Receipt,
  ArrowUpRight,
  Calendar,
  Loader2,
  RefreshCw,
  AlertCircle,
  Coins,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface TransactionItem {
  name: string
  qty: number
  price: number
}

interface Transaction {
  id: string
  transactionNumber?: string
  date: string
  time: string
  amount: number
  subtotal: number
  vat: number
  method: 'cash' | 'card' | 'qr' | 'wallet'
  items: TransactionItem[]
  customer?: string
  customerName?: string
  status: 'completed' | 'refunded' | 'voided'
  cashier: string
}

const MERCHANT_ID = 'merchant-001'

const paymentIcons = {
  cash: Banknote,
  card: CreditCard,
  qr: QrCode,
  wallet: Wallet,
}

const paymentLabels = {
  cash: 'Cash',
  card: 'Card',
  qr: 'QR Pay',
  wallet: 'Wallet',
}

const statusColors = {
  completed: 'bg-green-100 text-green-700',
  refunded: 'bg-orange-100 text-orange-700',
  voided: 'bg-red-100 text-red-700',
}

export function TransactionsView() {
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [methodFilter, setMethodFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null)

  // Fetch transactions from API
  const fetchTransactions = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/merchant-os/api/pos/transactions?merchantId=${MERCHANT_ID}`)

      if (!response.ok) {
        throw new Error('Failed to fetch transactions')
      }

      const result = await response.json()

      // API returns { success: true, data: transactions, pagination: {...} }
      const transactionsData = result.data || []

      // Transform API data to match our interface
      const formattedTransactions = transactionsData.map((txn: any) => ({
        id: txn.id,
        transactionNumber: txn.number,
        date: txn.createdAt ? txn.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
        time: txn.createdAt ? new Date(txn.createdAt).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }) : '00:00',
        amount: txn.total || 0,
        subtotal: txn.subtotal || 0,
        vat: txn.taxAmount || 0,
        method: txn.paymentMethod || 'cash',
        items: (txn.items || []).map((item: any) => ({
          name: item.name,
          qty: item.quantity,
          price: item.unitPrice,
        })),
        customer: txn.customerName,
        status: txn.status || 'completed',
        cashier: txn.staffName || 'Staff',
      }))

      setTransactions(formattedTransactions)
    } catch (err) {
      console.error('Error fetching transactions:', err)
      setError('Failed to load transactions')
      toast({
        title: 'Error',
        description: 'Failed to load transactions. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  // Load transactions on mount
  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  // Filter transactions
  const filteredTransactions = transactions.filter(txn => {
    const matchesSearch = 
      txn.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (txn.customer?.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesMethod = methodFilter === 'all' || txn.method === methodFilter
    const matchesStatus = statusFilter === 'all' || txn.status === statusFilter
    
    let matchesDate = true
    if (dateFilter === 'today') {
      matchesDate = txn.date === new Date().toISOString().split('T')[0]
    } else if (dateFilter === 'yesterday') {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      matchesDate = txn.date === yesterday.toISOString().split('T')[0]
    } else if (dateFilter === 'week') {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      matchesDate = new Date(txn.date) >= weekAgo
    }
    
    return matchesSearch && matchesMethod && matchesStatus && matchesDate
  })

  // Calculate totals
  const totals = filteredTransactions.reduce((acc, txn) => {
    if (txn.status === 'completed') {
      acc.total += txn.amount
      acc.count++
    }
    return acc
  }, { total: 0, count: 0 })

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A]">Transactions</h1>
            <p className="text-sm text-[#757575]">
              {isLoading ? 'Loading...' : `${filteredTransactions.length} transactions found`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchTransactions} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
            <Input
              placeholder="Search by ID or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
            </SelectContent>
          </Select>
          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="qr">QR Pay</SelectItem>
              <SelectItem value="wallet">Wallet</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
              <SelectItem value="voided">Voided</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-[#757575]">Completed</p>
              <p className="text-sm font-semibold text-[#1A1A1A]">{totals.count}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#E0F2F1] flex items-center justify-center">
              <Coins className="h-4 w-4 text-[#00897B]" />
            </div>
            <div>
              <p className="text-xs text-[#757575]">Total Revenue</p>
              <p className="text-sm font-semibold text-[#1A1A1A]">R{totals.total.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <Card>
            <div className="divide-y divide-gray-100">
              {filteredTransactions.map((txn, i) => {
                const PaymentIcon = paymentIcons[txn.method]
                return (
                  <button
                    key={i}
                    className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
                    onClick={() => setSelectedTxn(txn)}
                  >
                    <div className="w-10 h-10 rounded-full bg-[#F5F5F5] flex items-center justify-center">
                      <PaymentIcon className="h-5 w-5 text-[#757575]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-[#1A1A1A]">{txn.id}</p>
                        <Badge variant="secondary" className={`text-[10px] ${statusColors[txn.status]}`}>
                          {txn.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-[#757575] mt-0.5">
                        {txn.customer || 'Walk-in'} • {txn.items.length} items
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${txn.status === 'completed' ? 'text-green-600' : 'text-[#757575]'}`}>
                        {txn.status === 'completed' ? '+' : ''}R{txn.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-[#757575] flex items-center gap-1 justify-end">
                        <Clock className="h-3 w-3" />
                        {txn.time}
                      </p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-[#757575]" />
                  </button>
                )
              })}
            </div>
          </Card>
        </div>
      </ScrollArea>

      {/* Transaction Detail Dialog */}
      <Dialog open={!!selectedTxn} onOpenChange={() => setSelectedTxn(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Transaction Details
            </DialogTitle>
            <DialogDescription>
              {selectedTxn?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTxn && (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-[#757575]">Status</span>
                <Badge className={statusColors[selectedTxn.status]}>
                  {selectedTxn.status.charAt(0).toUpperCase() + selectedTxn.status.slice(1)}
                </Badge>
              </div>
              
              {/* Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[#757575]">Date</p>
                  <p className="font-medium">{selectedTxn.date}</p>
                </div>
                <div>
                  <p className="text-[#757575]">Time</p>
                  <p className="font-medium">{selectedTxn.time}</p>
                </div>
                <div>
                  <p className="text-[#757575]">Payment</p>
                  <p className="font-medium">{paymentLabels[selectedTxn.method]}</p>
                </div>
                <div>
                  <p className="text-[#757575]">Cashier</p>
                  <p className="font-medium">{selectedTxn.cashier}</p>
                </div>
              </div>
              
              {/* Items */}
              <div>
                <p className="text-sm font-medium mb-2">Items</p>
                <div className="space-y-2">
                  {selectedTxn.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-[#757575]">
                        {item.name} ×{item.qty}
                      </span>
                      <span>R{(item.price * item.qty).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Totals */}
              <div className="border-t pt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-[#757575]">Subtotal</span>
                  <span>R{selectedTxn.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#757575]">VAT (15%)</span>
                  <span>R{selectedTxn.vat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2">
                  <span>Total</span>
                  <span>R{selectedTxn.amount.toFixed(2)}</span>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1">
                  <Receipt className="h-4 w-4 mr-2" />
                  Print Receipt
                </Button>
                {selectedTxn.status === 'completed' && (
                  <Button variant="outline" className="flex-1 text-orange-600 hover:text-orange-700">
                    <XCircle className="h-4 w-4 mr-2" />
                    Refund
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
