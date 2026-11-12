'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
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
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Building2,
  CreditCard,
  RefreshCw,
  Plus,
  CheckCircle,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Search,
  Eye,
  Link2,
  Unlink,
  Clock,
  AlertCircle,
  Loader2,
  MoreVertical,
  Calendar,
  ChevronDown,
  ExternalLink,
  Settings,
  Trash2,
  Sparkles,
  Zap,
  FileText,
  Upload,
  Download,
  Check,
  ArrowRight,
  AlertTriangle,
  Wand2,
  FileSpreadsheet,
  Sheet,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { useMerchantData } from '../hooks/useMerchantData'
import { EmptyState } from './EmptyState'

// Types
interface BankAccount {
  id: string
  bankCode: 'fnb' | 'capitec' | 'standard_bank' | 'absa' | 'nedbank' | 'investec'
  bankName: string
  accountNumber: string
  accountNumberMasked: string
  accountHolderName: string
  accountType: 'cheque' | 'savings' | 'credit' | 'money_market'
  lastSyncAt: string | null
  connectionStatus: 'connected' | 'disconnected' | 'syncing' | 'error'
  balance: number
  currency: string
  branchCode?: string
  apiCredentials?: {
    apiKey?: string
    apiSecret?: string
  }
}

interface BankTransaction {
  id: string
  bankAccountId: string
  date: string
  description: string
  reference: string
  amount: number
  type: 'debit' | 'credit'
  category: string
  isReconciled: boolean
  reconciledTo?: {
    type: 'sale' | 'purchase' | 'journal'
    id: string
    reference: string
  }
  notes?: string
  balance: number
  createdAt: string
}

interface ReconciliationSuggestion {
  id: string
  transactionId: string
  transaction: BankTransaction
  matchType: 'exact' | 'amount' | 'reference' | 'date'
  confidence: 'high' | 'medium' | 'low'
  suggestedMatch: {
    type: 'sale' | 'purchase' | 'journal'
    id: string
    reference: string
    amount: number
    date: string
    customerName?: string
  }
  reason: string
}

interface BankStatement {
  id: string
  bankAccountId: string
  fileName: string
  uploadDate: string
  periodStart: string
  periodEnd: string
  status: 'pending' | 'processing' | 'imported' | 'error'
  transactionCount: number
  matchedCount: number
  newCount: number
  duplicateCount: number
}

interface StatementTransaction {
  id: string
  date: string
  description: string
  reference: string
  amount: number
  type: 'debit' | 'credit'
  balance: number
  status: 'new' | 'matched' | 'duplicate'
  matchedTransactionId?: string
}

interface ReconciliationForm {
  referenceType: 'sale' | 'purchase' | 'journal'
  referenceId: string
  notes: string
}

interface AddBankForm {
  bankCode: 'fnb' | 'capitec' | 'standard_bank' | 'absa' | 'nedbank' | 'investec' | ''
  accountNumber: string
  accountHolderName: string
  accountType: 'cheque' | 'savings' | 'credit' | 'money_market'
  apiKey: string
  apiSecret: string
}

// Bank Configuration
const BANKS_CONFIG = {
  fnb: { name: 'FNB', logo: 'FNB', color: '#00A651', branchCode: '250655' },
  capitec: { name: 'Capitec', logo: 'Capitec', color: '#E31837', branchCode: '470010' },
  standard_bank: { name: 'Standard Bank', logo: 'Standard Bank', color: '#0033A0', branchCode: '051001' },
  absa: { name: 'Absa', logo: 'Absa', color: '#E31837', branchCode: '632005' },
  nedbank: { name: 'Nedbank', logo: 'Nedbank', color: '#00703C', branchCode: '198765' },
  investec: { name: 'Investec', logo: 'Investec', color: '#003087', branchCode: '580105' },
}

// Component
export function BankFeedView() {
  // Get merchant context
  const { merchantId, isLoading: isAuthLoading } = useMerchantData()
  
  // State Management
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [transactions, setTransactions] = useState<BankTransaction[]>([])
  const [suggestions, setSuggestions] = useState<ReconciliationSuggestion[]>([])
  const [statements, setStatements] = useState<BankStatement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [syncingAccounts, setSyncingAccounts] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState('transactions')
  const [dataError, setDataError] = useState<string | null>(null)
  
  // Filters
  const [dateFilter, setDateFilter] = useState<{ from: string; to: string }>({
    from: '',
    to: '',
  })
  const [accountFilter, setAccountFilter] = useState<string>('all')
  const [reconciledFilter, setReconciledFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Dialogs
  const [addBankDialogOpen, setAddBankDialogOpen] = useState(false)
  const [reconcileDialogOpen, setReconcileDialogOpen] = useState(false)
  const [transactionDetailOpen, setTransactionDetailOpen] = useState(false)
  const [importStatementOpen, setImportStatementOpen] = useState(false)
  const [statementMatchOpen, setStatementMatchOpen] = useState(false)
  const [autoReconcileOpen, setAutoReconcileOpen] = useState(false)
  
  // Forms
  const [addBankForm, setAddBankForm] = useState<AddBankForm>({
    bankCode: '',
    accountNumber: '',
    accountHolderName: '',
    accountType: 'cheque',
    apiKey: '',
    apiSecret: '',
  })
  const [reconciliationForm, setReconciliationForm] = useState<ReconciliationForm>({
    referenceType: 'sale',
    referenceId: '',
    notes: '',
  })
  
  // Selected Items
  const [selectedTransaction, setSelectedTransaction] = useState<BankTransaction | null>(null)
  const [selectedStatement, setSelectedStatement] = useState<BankStatement | null>(null)
  const [selectedSuggestion, setSelectedSuggestion] = useState<ReconciliationSuggestion | null>(null)
  
  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  // Fetch data from API
  const fetchBankAccounts = useCallback(async () => {
    if (!merchantId) return
    try {
      const response = await fetch('/merchant-os/api/bank-feeds/accounts')
      const data = await response.json()
      if (data.success) {
        setAccounts(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error)
    }
  }, [merchantId])

  const fetchTransactions = useCallback(async () => {
    if (!merchantId) return
    try {
      const response = await fetch('/merchant-os/api/bank-feeds/transactions')
      const data = await response.json()
      if (data.success) {
        setTransactions(data.data || [])
        // Generate suggestions from unreconciled transactions
        const unreconciled = (data.data || []).filter((t: BankTransaction) => !t.isReconciled)
        // For now, we'll leave suggestions empty until we implement the AI matching
        setSuggestions([])
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  }, [merchantId])

  const fetchData = useCallback(async () => {
    if (!merchantId) return
    setIsLoading(true)
    setDataError(null)
    try {
      await Promise.all([fetchBankAccounts(), fetchTransactions()])
    } catch (error) {
      console.error('Error fetching bank data:', error)
      setDataError('Failed to load bank data')
    } finally {
      setIsLoading(false)
    }
  }, [merchantId, fetchBankAccounts, fetchTransactions])

  // Fetch data on mount
  useEffect(() => {
    if (merchantId) {
      fetchData()
    } else if (!isAuthLoading) {
      setIsLoading(false)
    }
  }, [merchantId, isAuthLoading, fetchData])

  // Format Currency
  const formatCurrency = useCallback((amount: number) => {
    const prefix = amount < 0 ? '-R' : 'R'
    return `${prefix}${Math.abs(amount).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }, [])

  // Format Date
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }, [])

  // Format DateTime
  const formatDateTime = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }, [])

  // Get Status Badge Variant
  const getStatusBadge = (status: BankAccount['connectionStatus']) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" />Connected</Badge>
      case 'disconnected':
        return <Badge variant="secondary"><X className="w-3 h-3 mr-1" />Disconnected</Badge>
      case 'syncing':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Syncing</Badge>
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Error</Badge>
    }
  }

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(txn => {
      // Account filter
      if (accountFilter !== 'all' && txn.bankAccountId !== accountFilter) return false
      
      // Reconciled filter
      if (reconciledFilter === 'reconciled' && !txn.isReconciled) return false
      if (reconciledFilter === 'unreconciled' && txn.isReconciled) return false
      
      // Date filter
      if (dateFilter.from && txn.date < dateFilter.from) return false
      if (dateFilter.to && txn.date > dateFilter.to) return false
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          txn.description.toLowerCase().includes(query) ||
          txn.reference.toLowerCase().includes(query) ||
          txn.category.toLowerCase().includes(query)
        )
      }
      
      return true
    })
  }, [transactions, accountFilter, reconciledFilter, dateFilter, searchQuery])

  // Stats
  const stats = useMemo(() => {
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0)
    const connectedAccounts = accounts.filter(a => a.connectionStatus === 'connected').length
    const unreconciledCount = transactions.filter(t => !t.isReconciled).length
    const unreconciledAmount = transactions
      .filter(t => !t.isReconciled)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const pendingSuggestions = suggestions.length
    
    return {
      totalBalance,
      connectedAccounts,
      totalAccounts: accounts.length,
      unreconciledCount,
      unreconciledAmount,
      pendingSuggestions,
    }
  }, [accounts, transactions, suggestions])

  // Sync All Accounts
  const handleSyncAll = useCallback(async () => {
    if (!merchantId) return
    setIsLoading(true)
    const connectedAccountIds = accounts
      .filter(a => a.connectionStatus === 'connected')
      .map(a => a.id)
    
    setSyncingAccounts(connectedAccountIds)
    
    try {
      // Call sync API for each connected account
      await Promise.all(connectedAccountIds.map(id => 
        fetch(`/merchant-os/api/bank-feeds/accounts/${id}/sync`, { method: 'POST' })
      ))
      
      // Refresh data
      await fetchData()
      showToast('All accounts synced successfully', 'success')
    } catch (error) {
      showToast('Failed to sync some accounts', 'error')
    } finally {
      setSyncingAccounts([])
      setIsLoading(false)
    }
  }, [accounts, merchantId, fetchData, showToast])

  // Sync Single Account
  const handleSyncAccount = useCallback(async (accountId: string) => {
    setSyncingAccounts(prev => [...prev, accountId])
    
    setAccounts(prev => prev.map(acc => {
      if (acc.id === accountId) {
        return { ...acc, connectionStatus: 'syncing' as const }
      }
      return acc
    }))
    
    try {
      await fetch(`/merchant-os/api/bank-feeds/accounts/${accountId}/sync`, { method: 'POST' })
      await fetchData()
      showToast('Account synced successfully', 'success')
    } catch (error) {
      showToast('Failed to sync account', 'error')
    } finally {
      setSyncingAccounts(prev => prev.filter(id => id !== accountId))
    }
  }, [fetchData, showToast])

  // Add Bank Account
  const handleAddBankAccount = useCallback(async () => {
    if (!addBankForm.bankCode || !addBankForm.accountNumber || !addBankForm.accountHolderName) {
      showToast('Please fill in all required fields', 'error')
      return
    }

    try {
      const response = await fetch('/merchant-os/api/bank-feeds/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addBankForm),
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchBankAccounts()
        setAddBankDialogOpen(false)
        setAddBankForm({
          bankCode: '',
          accountNumber: '',
          accountHolderName: '',
          accountType: 'cheque',
          apiKey: '',
          apiSecret: '',
        })
        showToast('Bank account connected successfully', 'success')
      } else {
        showToast(data.error || 'Failed to add bank account', 'error')
      }
    } catch (error) {
      showToast('Failed to add bank account', 'error')
    }
  }, [addBankForm, fetchBankAccounts, showToast])

  // Disconnect Account
  const handleDisconnectAccount = useCallback((accountId: string) => {
    setAccounts(prev => prev.map(acc => {
      if (acc.id === accountId) {
        return { ...acc, connectionStatus: 'disconnected' as const }
      }
      return acc
    }))
    showToast('Account disconnected', 'info')
  }, [showToast])

  // Reconnect Account
  const handleReconnectAccount = useCallback(async (accountId: string) => {
    setAccounts(prev => prev.map(acc => {
      if (acc.id === accountId) {
        return { ...acc, connectionStatus: 'syncing' as const }
      }
      return acc
    }))
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setAccounts(prev => prev.map(acc => {
      if (acc.id === accountId) {
        return { ...acc, connectionStatus: 'connected' as const }
      }
      return acc
    }))
    showToast('Account reconnected successfully', 'success')
  }, [showToast])

  // Reconcile Transaction
  const handleReconcile = useCallback(async () => {
    if (!selectedTransaction || !reconciliationForm.referenceId) {
      showToast('Please enter a reference ID', 'error')
      return
    }

    setTransactions(prev => prev.map(txn => {
      if (txn.id === selectedTransaction.id) {
        return {
          ...txn,
          isReconciled: true,
          reconciledTo: {
            type: reconciliationForm.referenceType,
            id: `REF-${Date.now()}`,
            reference: reconciliationForm.referenceId,
          },
          notes: reconciliationForm.notes,
        }
      }
      return txn
    }))
    
    // Remove from suggestions if present
    setSuggestions(prev => prev.filter(s => s.transactionId !== selectedTransaction.id))
    
    setReconcileDialogOpen(false)
    setReconciliationForm({
      referenceType: 'sale',
      referenceId: '',
      notes: '',
    })
    setSelectedTransaction(null)
    showToast('Transaction reconciled successfully', 'success')
  }, [selectedTransaction, reconciliationForm, showToast])

  // Accept Suggestion
  const handleAcceptSuggestion = useCallback((suggestion: ReconciliationSuggestion) => {
    setTransactions(prev => prev.map(txn => {
      if (txn.id === suggestion.transactionId) {
        return {
          ...txn,
          isReconciled: true,
          reconciledTo: {
            type: suggestion.suggestedMatch.type,
            id: suggestion.suggestedMatch.id,
            reference: suggestion.suggestedMatch.reference,
          },
        }
      }
      return txn
    }))
    
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id))
    showToast('Suggestion accepted and transaction reconciled', 'success')
  }, [showToast])

  // Reject Suggestion
  const handleRejectSuggestion = useCallback((suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId))
    showToast('Suggestion rejected', 'info')
  }, [showToast])

  // Auto-Reconcile All
  const handleAutoReconcileAll = useCallback(async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    suggestions.forEach(suggestion => {
      if (suggestion.confidence === 'high') {
        handleAcceptSuggestion(suggestion)
      }
    })
    
    setIsLoading(false)
    setAutoReconcileOpen(false)
    showToast('Auto-reconciliation complete', 'success')
  }, [suggestions, handleAcceptSuggestion, showToast])

  // Open Reconcile Dialog
  const openReconcileDialog = useCallback((txn: BankTransaction) => {
    setSelectedTransaction(txn)
    setReconciliationForm({
      referenceType: 'sale',
      referenceId: '',
      notes: txn.notes || '',
    })
    setReconcileDialogOpen(true)
  }, [])

  // Open Transaction Detail
  const openTransactionDetail = useCallback((txn: BankTransaction) => {
    setSelectedTransaction(txn)
    setTransactionDetailOpen(true)
  }, [])

  // Get confidence color
  const getConfidenceColor = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high':
        return 'bg-green-100 text-green-700'
      case 'medium':
        return 'bg-amber-100 text-amber-700'
      case 'low':
        return 'bg-red-100 text-red-700'
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-500' :
          toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        } text-white flex items-center gap-2`}>
          {toast.type === 'success' && <CheckCircle className="w-4 h-4" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Bank Feed Integration</h1>
          <p className="text-sm text-gray-500">Connect and sync your bank accounts for automatic transaction imports</p>
        </div>
        <div className="flex items-center gap-2">
          {stats.pendingSuggestions > 0 && (
            <Button variant="outline" onClick={() => setActiveTab('suggestions')} className="relative">
              <Sparkles className="w-4 h-4 mr-2" />
              Suggestions
              <Badge className="ml-2 bg-amber-500 text-white">{stats.pendingSuggestions}</Badge>
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleSyncAll}
            disabled={isLoading || stats.connectedAccounts === 0}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Sync All
          </Button>
          <Button onClick={() => setAddBankDialogOpen(true)} style={{ backgroundColor: '#00897B' }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Bank Account
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Balance</p>
                <p className="text-xl font-semibold">{formatCurrency(stats.totalBalance)}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-teal-50 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Connected Accounts</p>
                <p className="text-xl font-semibold">{stats.connectedAccounts} / {stats.totalAccounts}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Unreconciled</p>
                <p className="text-xl font-semibold">{stats.unreconciledCount} transactions</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Auto-Suggestions</p>
                <p className="text-xl font-semibold">{stats.pendingSuggestions} pending</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="suggestions">
            Auto-Suggestions
            {stats.pendingSuggestions > 0 && (
              <Badge className="ml-2 bg-amber-500 text-white">{stats.pendingSuggestions}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="statements">Statements</TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Bank Transactions</CardTitle>
                  <CardDescription>View and reconcile imported transactions</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search transactions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                  
                  {/* Filters Popover */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Filter className="w-4 h-4 mr-2" />
                        Filters
                        {(accountFilter !== 'all' || reconciledFilter !== 'all' || dateFilter.from || dateFilter.to) && (
                          <Badge variant="secondary" className="ml-2">Active</Badge>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="end">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium">Bank Account</Label>
                          <Select value={accountFilter} onValueChange={setAccountFilter}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="All accounts" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Accounts</SelectItem>
                              {accounts.map(acc => (
                                <SelectItem key={acc.id} value={acc.id}>
                                  {acc.bankName} - {acc.accountNumberMasked}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium">Reconciliation Status</Label>
                          <Select value={reconciledFilter} onValueChange={setReconciledFilter}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="All statuses" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              <SelectItem value="reconciled">Reconciled</SelectItem>
                              <SelectItem value="unreconciled">Unreconciled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium">Date Range</Label>
                          <div className="grid grid-cols-2 gap-2 mt-1">
                            <Input
                              type="date"
                              placeholder="From"
                              value={dateFilter.from}
                              onChange={(e) => setDateFilter(prev => ({ ...prev, from: e.target.value }))}
                            />
                            <Input
                              type="date"
                              placeholder="To"
                              value={dateFilter.to}
                              onChange={(e) => setDateFilter(prev => ({ ...prev, to: e.target.value }))}
                            />
                          </div>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setAccountFilter('all')
                            setReconciledFilter('all')
                            setDateFilter({ from: '', to: '' })
                          }}
                        >
                          Clear Filters
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No transactions found</p>
                  <p className="text-sm mt-1">Try adjusting your filters or sync your accounts</p>
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Reconciled</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map(txn => (
                        <TableRow key={txn.id}>
                          <TableCell className="whitespace-nowrap">
                            <span className="text-sm">{formatDate(txn.date)}</span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{txn.description}</p>
                              <p className="text-xs text-gray-500">{txn.reference}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {txn.type === 'credit' ? (
                                <ArrowDownRight className="w-4 h-4 text-green-600" />
                              ) : (
                                <ArrowUpRight className="w-4 h-4 text-red-600" />
                              )}
                              <span className={`font-medium ${txn.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                {txn.type === 'credit' ? '+' : '-'}{formatCurrency(Math.abs(txn.amount))}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal">
                              {txn.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {txn.isReconciled ? (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Yes
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <X className="w-3 h-3 mr-1" />
                                No
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openTransactionDetail(txn)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {!txn.isReconciled && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openReconcileDialog(txn)}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {/* Pagination placeholder */}
              {filteredTransactions.length > 0 && (
                <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
                  <p>Showing {filteredTransactions.length} of {transactions.length} transactions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Accounts Tab */}
        <TabsContent value="accounts">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Connected Bank Accounts</CardTitle>
              <CardDescription>Manage your connected bank accounts and sync settings</CardDescription>
            </CardHeader>
            <CardContent>
              {accounts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No bank accounts connected</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setAddBankDialogOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Connect Your First Account
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {accounts.map(account => (
                    <Card key={account.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div 
                              className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                              style={{ backgroundColor: BANKS_CONFIG[account.bankCode].color }}
                            >
                              {BANKS_CONFIG[account.bankCode].logo.substring(0, 2)}
                            </div>
                            <div>
                              <p className="font-medium">{account.bankName}</p>
                              <p className="text-sm text-gray-500">{account.accountNumberMasked}</p>
                            </div>
                          </div>
                          {getStatusBadge(account.connectionStatus)}
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Account Holder</span>
                            <span className="font-medium truncate ml-2">{account.accountHolderName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Account Type</span>
                            <span className="capitalize">{account.accountType}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Balance</span>
                            <span className="font-medium">{formatCurrency(account.balance)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Last Sync</span>
                            <span>{account.lastSyncAt ? formatDateTime(account.lastSyncAt) : 'Never'}</span>
                          </div>
                        </div>

                        <Separator className="my-3" />

                        <div className="flex items-center justify-between">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSyncAccount(account.id)}
                            disabled={account.connectionStatus !== 'connected' || syncingAccounts.includes(account.id)}
                          >
                            {syncingAccounts.includes(account.id) ? (
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4 mr-1" />
                            )}
                            Sync
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {account.connectionStatus === 'connected' && (
                                <DropdownMenuItem onClick={() => handleDisconnectAccount(account.id)}>
                                  <Unlink className="w-4 h-4 mr-2" />
                                  Disconnect
                                </DropdownMenuItem>
                              )}
                              {account.connectionStatus === 'disconnected' && (
                                <DropdownMenuItem onClick={() => handleReconnectAccount(account.id)}>
                                  <Link2 className="w-4 h-4 mr-2" />
                                  Reconnect
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Auto-Suggestions Tab */}
        <TabsContent value="suggestions">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    Auto-Reconciliation Suggestions
                  </CardTitle>
                  <CardDescription>AI-powered matching suggestions for unreconciled transactions</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setAutoReconcileOpen(true)} disabled={suggestions.length === 0}>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Auto-Reconcile All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {suggestions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No pending suggestions</p>
                  <p className="text-sm mt-1">All transactions have been reconciled or no matches found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {suggestions.map(suggestion => (
                    <Card key={suggestion.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getConfidenceColor(suggestion.confidence)}>
                                {suggestion.confidence} confidence
                              </Badge>
                              <Badge variant="outline">
                                {suggestion.matchType} match
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              {/* Transaction */}
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Bank Transaction</p>
                                <p className="font-medium text-sm">{suggestion.transaction.description}</p>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-xs text-gray-500">{formatDate(suggestion.transaction.date)}</span>
                                  <span className={`font-medium ${suggestion.transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                    {suggestion.transaction.type === 'credit' ? '+' : '-'}{formatCurrency(Math.abs(suggestion.transaction.amount))}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Match */}
                              <div className="bg-green-50 p-3 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Suggested Match</p>
                                <p className="font-medium text-sm">{suggestion.suggestedMatch.reference}</p>
                                <p className="text-xs text-gray-500">{suggestion.suggestedMatch.customerName || suggestion.suggestedMatch.type}</p>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-xs text-gray-500">{formatDate(suggestion.suggestedMatch.date)}</span>
                                  <span className="font-medium text-green-600">
                                    {formatCurrency(suggestion.suggestedMatch.amount)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-600 mt-3 flex items-center gap-2">
                              <AlertCircle className="h-4 w-4" />
                              {suggestion.reason}
                            </p>
                          </div>
                          
                          <div className="flex flex-col gap-2 ml-4">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleAcceptSuggestion(suggestion)}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectSuggestion(suggestion.id)}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statements Tab */}
        <TabsContent value="statements">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Bank Statement Imports</CardTitle>
                  <CardDescription>Import and match bank statements manually</CardDescription>
                </div>
                <Button onClick={() => setImportStatementOpen(true)} style={{ backgroundColor: '#00897B' }}>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Statement
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {statements.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No statements imported</p>
                  <p className="text-sm mt-1">Upload a bank statement to import transactions</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File Name</TableHead>
                      <TableHead>Bank Account</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Transactions</TableHead>
                      <TableHead>Matched</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statements.map(statement => {
                      const account = accounts.find(a => a.id === statement.bankAccountId)
                      return (
                        <TableRow key={statement.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Sheet className="h-4 w-4 text-gray-400" />
                              <span className="font-medium text-sm">{statement.fileName}</span>
                            </div>
                          </TableCell>
                          <TableCell>{account?.bankName} - {account?.accountNumberMasked}</TableCell>
                          <TableCell>
                            {formatDate(statement.periodStart)} - {formatDate(statement.periodEnd)}
                          </TableCell>
                          <TableCell>{statement.transactionCount}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-green-600">{statement.matchedCount}</span>
                              {statement.newCount > 0 && (
                                <span className="text-blue-600">+{statement.newCount} new</span>
                              )}
                              {statement.duplicateCount > 0 && (
                                <span className="text-gray-500">{statement.duplicateCount} dup</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              statement.status === 'imported' ? 'bg-green-100 text-green-700' :
                              statement.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                              statement.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }>
                              {statement.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" onClick={() => { setSelectedStatement(statement); setStatementMatchOpen(true) }}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Bank Account Dialog */}
      <Dialog open={addBankDialogOpen} onOpenChange={setAddBankDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Bank Account</DialogTitle>
            <DialogDescription>
              Link your bank account to automatically import transactions
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm font-medium">Bank <span className="text-red-500">*</span></Label>
              <Select 
                value={addBankForm.bankCode} 
                onValueChange={(value) => setAddBankForm(prev => ({ ...prev, bankCode: value as AddBankForm['bankCode'] }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select your bank" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BANKS_CONFIG).map(([code, config]) => (
                    <SelectItem key={code} value={code}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-5 w-5 rounded flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: config.color }}
                        >
                          {config.logo.substring(0, 2)}
                        </div>
                        {config.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Account Number <span className="text-red-500">*</span></Label>
              <Input
                className="mt-1"
                placeholder="Enter account number"
                value={addBankForm.accountNumber}
                onChange={(e) => setAddBankForm(prev => ({ ...prev, accountNumber: e.target.value }))}
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium">Account Holder Name <span className="text-red-500">*</span></Label>
              <Input
                className="mt-1"
                placeholder="Name as it appears on account"
                value={addBankForm.accountHolderName}
                onChange={(e) => setAddBankForm(prev => ({ ...prev, accountHolderName: e.target.value }))}
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium">Account Type</Label>
              <Select 
                value={addBankForm.accountType} 
                onValueChange={(value) => setAddBankForm(prev => ({ ...prev, accountType: value as AddBankForm['accountType'] }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cheque">Cheque Account</SelectItem>
                  <SelectItem value="savings">Savings Account</SelectItem>
                  <SelectItem value="credit">Credit Card</SelectItem>
                  <SelectItem value="money_market">Money Market</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Separator />
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-medium mb-2">API Credentials (Optional)</p>
              <p className="text-xs text-gray-500 mb-3">
                Some banks require API credentials for direct integration
              </p>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">API Key</Label>
                  <Input
                    className="mt-1"
                    placeholder="Enter API key"
                    value={addBankForm.apiKey}
                    onChange={(e) => setAddBankForm(prev => ({ ...prev, apiKey: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-xs">API Secret</Label>
                  <Input
                    className="mt-1"
                    type="password"
                    placeholder="Enter API secret"
                    value={addBankForm.apiSecret}
                    onChange={(e) => setAddBankForm(prev => ({ ...prev, apiSecret: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddBankDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddBankAccount} style={{ backgroundColor: '#00897B' }}>
              <Link2 className="w-4 h-4 mr-2" />
              Connect Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reconciliation Dialog */}
      <Dialog open={reconcileDialogOpen} onOpenChange={setReconcileDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reconcile Transaction</DialogTitle>
            <DialogDescription>
              Link this transaction to a sale, purchase, or journal entry
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{selectedTransaction.description}</p>
                  <p className="text-xs text-gray-500">{selectedTransaction.reference}</p>
                </div>
                <div className={`font-medium ${selectedTransaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedTransaction.type === 'credit' ? '+' : '-'}{formatCurrency(Math.abs(selectedTransaction.amount))}
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Reference Type <span className="text-red-500">*</span></Label>
              <Select 
                value={reconciliationForm.referenceType} 
                onValueChange={(value) => setReconciliationForm(prev => ({ ...prev, referenceType: value as ReconciliationForm['referenceType'] }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">Sale / Invoice</SelectItem>
                  <SelectItem value="purchase">Purchase / Bill</SelectItem>
                  <SelectItem value="journal">Journal Entry</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Reference ID / Number <span className="text-red-500">*</span></Label>
              <Input
                className="mt-1"
                placeholder={`Enter ${reconciliationForm.referenceType} number (e.g., INV-2026-001)`}
                value={reconciliationForm.referenceId}
                onChange={(e) => setReconciliationForm(prev => ({ ...prev, referenceId: e.target.value }))}
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium">Notes</Label>
              <Input
                className="mt-1"
                placeholder="Optional notes for this reconciliation"
                value={reconciliationForm.notes}
                onChange={(e) => setReconciliationForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setReconcileDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReconcile} style={{ backgroundColor: '#00897B' }}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Reconcile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Detail Dialog */}
      <Dialog open={transactionDetailOpen} onOpenChange={setTransactionDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium">{selectedTransaction.description}</p>
                    <p className="text-sm text-gray-500">{selectedTransaction.reference}</p>
                  </div>
                  <div className={`text-lg font-semibold ${selectedTransaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedTransaction.type === 'credit' ? '+' : '-'}{formatCurrency(Math.abs(selectedTransaction.amount))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Date</p>
                    <p className="font-medium">{formatDate(selectedTransaction.date)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Category</p>
                    <p className="font-medium">{selectedTransaction.category}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Type</p>
                    <Badge variant="outline" className="font-normal capitalize">
                      {selectedTransaction.type}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-gray-500">Balance After</p>
                    <p className="font-medium">{formatCurrency(selectedTransaction.balance)}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Reconciliation Status</p>
                {selectedTransaction.isReconciled ? (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="w-4 h-4" />
                      <span className="font-medium">Reconciled</span>
                    </div>
                    {selectedTransaction.reconciledTo && (
                      <div className="mt-2 text-sm text-green-600">
                        <p>Linked to: <span className="font-medium capitalize">{selectedTransaction.reconciledTo.type}</span></p>
                        <p>Reference: <span className="font-medium">{selectedTransaction.reconciledTo.reference}</span></p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-amber-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-amber-700">
                      <AlertCircle className="w-4 h-4" />
                      <span className="font-medium">Unreconciled</span>
                    </div>
                    <Button
                      size="sm"
                      className="mt-2"
                      style={{ backgroundColor: '#00897B' }}
                      onClick={() => {
                        setTransactionDetailOpen(false)
                        openReconcileDialog(selectedTransaction)
                      }}
                    >
                      Reconcile Now
                    </Button>
                  </div>
                )}
              </div>
              
              {selectedTransaction.notes && (
                <div>
                  <p className="text-sm font-medium mb-1">Notes</p>
                  <p className="text-sm text-gray-600">{selectedTransaction.notes}</p>
                </div>
              )}
              
              <div className="text-xs text-gray-400">
                <p>Transaction ID: {selectedTransaction.id}</p>
                <p>Imported: {formatDateTime(selectedTransaction.createdAt)}</p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransactionDetailOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Statement Dialog */}
      <Dialog open={importStatementOpen} onOpenChange={setImportStatementOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Import Bank Statement</DialogTitle>
            <DialogDescription>
              Upload a bank statement file (CSV, OFX, or PDF)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm font-medium">Bank Account</Label>
              <Select>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.bankName} - {acc.accountNumberMasked}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">Drag and drop your statement file here</p>
              <p className="text-xs text-gray-400 mt-1">or click to browse</p>
              <Input type="file" className="mt-4" accept=".csv,.ofx,.pdf" />
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-blue-700">
                <strong>Supported formats:</strong> CSV, OFX, QIF, PDF (text-based)
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Statements are automatically matched against existing transactions to detect duplicates.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportStatementOpen(false)}>
              Cancel
            </Button>
            <Button style={{ backgroundColor: '#00897B' }}>
              <Upload className="w-4 h-4 mr-2" />
              Import Statement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auto-Reconcile Confirmation Dialog */}
      <Dialog open={autoReconcileOpen} onOpenChange={setAutoReconcileOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-purple-500" />
              Auto-Reconcile
            </DialogTitle>
            <DialogDescription>
              This will automatically accept all high-confidence suggestions
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="bg-amber-50 p-3 rounded-lg flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-700">
                <p className="font-medium">Review before proceeding</p>
                <p className="mt-1">{suggestions.filter(s => s.confidence === 'high').length} high-confidence matches will be automatically reconciled.</p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAutoReconcileOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAutoReconcileAll} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
              Proceed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Statement Match Detail Dialog */}
      <Dialog open={statementMatchOpen} onOpenChange={setStatementMatchOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Statement Import Details</DialogTitle>
            <DialogDescription>
              {selectedStatement?.fileName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedStatement && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Period</p>
                  <p className="font-medium">{formatDate(selectedStatement.periodStart)} - {formatDate(selectedStatement.periodEnd)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Imported</p>
                  <p className="font-medium">{formatDateTime(selectedStatement.uploadDate)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{selectedStatement.matchedCount}</p>
                  <p className="text-xs text-gray-500">Matched</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{selectedStatement.newCount}</p>
                  <p className="text-xs text-gray-500">New</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-2xl font-bold text-gray-600">{selectedStatement.duplicateCount}</p>
                  <p className="text-xs text-gray-500">Duplicates</p>
                </div>
              </div>
              
              <div className="pt-4">
                <Progress 
                  value={(selectedStatement.matchedCount / selectedStatement.transactionCount) * 100} 
                  className="h-2"
                />
                <p className="text-xs text-gray-500 mt-1 text-center">
                  {Math.round((selectedStatement.matchedCount / selectedStatement.transactionCount) * 100)}% matched
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatementMatchOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default BankFeedView
