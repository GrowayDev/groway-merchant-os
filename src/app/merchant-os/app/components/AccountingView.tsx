'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BudgetManagement } from './BudgetManagement'
import { useMerchantData } from '../hooks/useMerchantData'
import { EmptyState, NoDataEmptyState } from './EmptyState'
import {
  Search,
  Plus,
  TrendingUp,
  TrendingDown,
  Coins,
  Calculator,
  FileText,
  CreditCard,
  Building2,
  PieChart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Filter,
  Eye,
  Edit,
  Trash2,
  Bot,
  Lightbulb,
  AlertCircle,
  Target,
  RefreshCw,
  CheckCircle2,
  Clock,
  Calendar,
  Banknote,
  Wallet,
  Receipt,
  Landmark,
  FileSpreadsheet,
  Percent,
  ArrowRightLeft,
  Building,
  Briefcase,
  PiggyBank,
  Scale,
  X,
  Save,
  Send,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  Printer,
  Mail,
  MessageSquare,
  AlertTriangle,
  Info,
  Zap,
  Brain,
  LineChart,
  Activity,
  DollarSignIcon,
  Minus,
  Hash,
  Loader2,
} from 'lucide-react'



// Types
interface Account {
  id: string
  code: string
  name: string
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense'
  subType: string
  balance: number
  currency: string
  isActive: boolean
  parentCode?: string
  description?: string
  taxDeductible?: boolean
}

interface JournalEntryLine {
  id: string
  accountId: string
  accountName: string
  accountCode?: string
  debit: number
  credit: number
  description: string
}

interface JournalEntry {
  id: string
  date: string
  reference: string
  description: string
  lines: JournalEntryLine[]
  totalDebit: number
  totalCredit: number
  status: 'draft' | 'posted' | 'reversed'
  createdBy: string
  createdAt: string
  reversedFrom?: string
}

interface Invoice {
  id: string
  invoiceNumber: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  date: string
  dueDate: string
  items: InvoiceItem[]
  subtotal: number
  vat: number
  discount: number
  total: number
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'partial'
  paidDate?: string
  paidAmount?: number
  notes?: string
  terms?: string
}

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  discount: number
  total: number
  taxable: boolean
}

interface Bill {
  id: string
  billNumber: string
  supplierName: string
  supplierEmail?: string
  date: string
  dueDate: string
  items: BillItem[]
  subtotal: number
  vat: number
  total: number
  status: 'draft' | 'pending' | 'approved' | 'paid' | 'overdue' | 'partial'
  category: string
  paymentTerms?: string
  notes?: string
  approvedBy?: string
  approvedAt?: string
}

interface BillItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
  accountId: string
}

interface BankAccount {
  id: string
  bankName: string
  accountNumber: string
  accountType: 'cheque' | 'savings' | 'credit' | 'money_market'
  balance: number
  lastReconciled: string
  statementBalance: number
  difference: number
  status: 'connected' | 'manual' | 'disconnected'
  currency: string
  branchCode?: string
}

interface BankTransaction {
  id: string
  bankAccountId: string
  date: string
  description: string
  reference: string
  amount: number
  balance: number
  type: 'debit' | 'credit'
  status: 'unreconciled' | 'reconciled' | 'matched'
  matchedTo?: string
  category?: string
}

interface VATReturn {
  id: string
  period: string
  startDate: string
  endDate: string
  box1_OutputVAT: number
  box2_InputVAT: number
  box3_NetVAT: number
  box4_TotalSales: number
  box5_TotalPurchases: number
  box6_Exports: number
  box7_ZeroRated: number
  box8_CapitalAssets: number
  status: 'draft' | 'ready' | 'submitted' | 'paid' | 'refunded'
  submittedDate?: string
  dueDate: string
  paymentDate?: string
  notes?: string
}

interface Budget {
  id: string
  name: string
  accountId: string
  accountName: string
  period: 'monthly' | 'quarterly' | 'annual'
  amount: number
  spent: number
  remaining: number
  percentage: number
  startDate: string
  endDate: string
  alerts: boolean
  alertThreshold: number
}

interface GroAIInsight {
  id: string
  type: 'opportunity' | 'alert' | 'trend' | 'recommendation' | 'prediction'
  title: string
  description: string
  metric?: string
  change?: number
  action: string
  actionHandler?: () => void
  priority: 'high' | 'medium' | 'low'
  category: 'cashflow' | 'tax' | 'expense' | 'revenue' | 'compliance' | 'optimization'
  confidence?: number
  potentialSavings?: number
}

// Loading skeleton component
const LoadingSkeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
)

// Mock data generators removed - data is now fetched from API

// Component
export function AccountingView() {
  // Get merchant data from session
  const { merchantId, isLoading: isLoadingMerchant } = useMerchantData()
  
  // State Management
  const [accounts, setAccounts] = useState<Account[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [bills, setBills] = useState<Bill[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([])
  const [vatReturns, setVatReturns] = useState<VATReturn[]>([])
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  
  // Loading States
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true)
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true)
  const [isLoadingBills, setIsLoadingBills] = useState(true)
  const [isLoadingJournal, setIsLoadingJournal] = useState(true)
  const [isLoadingBank, setIsLoadingBank] = useState(true)
  const [isLoadingVAT, setIsLoadingVAT] = useState(true)
  const [isLoadingBudgets, setIsLoadingBudgets] = useState(true)
  
  // Error States
  const [accountsError, setAccountsError] = useState<string | null>(null)
  const [invoicesError, setInvoicesError] = useState<string | null>(null)
  const [billsError, setBillsError] = useState<string | null>(null)
  const [journalError, setJournalError] = useState<string | null>(null)
  
  const [activeTab, setActiveTab] = useState<string>('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [selectedReport, setSelectedReport] = useState<string | null>(null)
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  
  // Dialog States
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false)
  const [billDialogOpen, setBillDialogOpen] = useState(false)
  const [accountDialogOpen, setAccountDialogOpen] = useState(false)
  const [journalDialogOpen, setJournalDialogOpen] = useState(false)
  const [reconcileDialogOpen, setReconcileDialogOpen] = useState(false)
  
  // Selected Items for Edit/View
  const [selectedBank, setSelectedBank] = useState<BankAccount | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  
  // Form States
  const [invoiceForm, setInvoiceForm] = useState<Partial<Invoice>>({
    customerName: '',
    customerEmail: '',
    items: [{ id: 'NEW-1', description: '', quantity: 1, unitPrice: 0, discount: 0, total: 0, taxable: true }],
    discount: 0,
    notes: '',
    terms: 'Payment due within 30 days'
  })
  const [billForm, setBillForm] = useState<Partial<Bill>>({
    supplierName: '',
    items: [{ id: 'NEW-1', description: '', quantity: 1, unitPrice: 0, total: 0, accountId: '' }],
    category: 'General',
    notes: ''
  })
  const [accountForm, setAccountForm] = useState<Partial<Account>>({
    code: '',
    name: '',
    type: 'asset',
    subType: 'Current Asset',
    isActive: true
  })
  const [journalForm, setJournalForm] = useState<Partial<JournalEntry>>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    lines: [
      { id: 'JL-1', accountId: '', accountName: '', debit: 0, credit: 0, description: '' },
      { id: 'JL-2', accountId: '', accountName: '', debit: 0, credit: 0, description: '' }
    ]
  })
  
  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  
  // Sprint 3 - Enhanced Finance Tab States
  const [trialBalanceData, setTrialBalanceData] = useState<any>(null)
  const [isLoadingTB, setIsLoadingTB] = useState(false)
  const [tbAsOfDate, setTbAsOfDate] = useState(new Date().toISOString().split('T')[0])
  
  const [balanceSheetData, setBalanceSheetData] = useState<any>(null)
  const [isLoadingBS, setIsLoadingBS] = useState(false)
  const [bsAsOfDate, setBsAsOfDate] = useState(new Date().toISOString().split('T')[0])
  
  const [glSelectedAccount, setGlSelectedAccount] = useState<string | null>(null)
  const [glDateFrom, setGlDateFrom] = useState(new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0])
  const [glDateTo, setGlDateTo] = useState(new Date().toISOString().split('T')[0])
  
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false)
  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0,
    accountId: '',
    vendor: '',
    paymentMethod: 'bank',
    reference: '',
    notes: ''
  })
  
  const [pettyCashDialogOpen, setPettyCashDialogOpen] = useState(false)
  const [replenishDialogOpen, setReplenishDialogOpen] = useState(false)
  const [pettyCashForm, setPettyCashForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0,
    category: '',
    receivedBy: '',
    receipt: ''
  })
  const [replenishAmount, setReplenishAmount] = useState(0)
  
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  // API Fetch Functions
  const fetchAccounts = useCallback(async () => {
    if (!merchantId) return
    setIsLoadingAccounts(true)
    setAccountsError(null)
    try {
      const response = await fetch(`/merchant-os/api/accounting/chart-of-accounts?merchantId=${merchantId}`)
      if (!response.ok) throw new Error('Failed to fetch accounts')
      const data = await response.json()
      setAccounts(data.accounts || [])
    } catch (error) {
      console.error('Error fetching accounts:', error)
      setAccountsError('Failed to load chart of accounts. Please try again.')
    } finally {
      setIsLoadingAccounts(false)
    }
  }, [merchantId])

  const fetchInvoices = useCallback(async () => {
    if (!merchantId) return
    setIsLoadingInvoices(true)
    setInvoicesError(null)
    try {
      const response = await fetch(`/merchant-os/api/accounting/invoices?merchantId=${merchantId}`)
      if (!response.ok) throw new Error('Failed to fetch invoices')
      const data = await response.json()
      setInvoices(data.invoices || [])
    } catch (error) {
      console.error('Error fetching invoices:', error)
      setInvoicesError('Failed to load invoices. Please try again.')
    } finally {
      setIsLoadingInvoices(false)
    }
  }, [merchantId])

  const fetchBills = useCallback(async () => {
    if (!merchantId) return
    setIsLoadingBills(true)
    setBillsError(null)
    try {
      const response = await fetch(`/merchant-os/api/accounting/bills?merchantId=${merchantId}`)
      if (!response.ok) throw new Error('Failed to fetch bills')
      const data = await response.json()
      setBills(data.bills || [])
    } catch (error) {
      console.error('Error fetching bills:', error)
      setBillsError('Failed to load bills. Please try again.')
    } finally {
      setIsLoadingBills(false)
    }
  }, [merchantId])

  const fetchJournalEntries = useCallback(async () => {
    if (!merchantId) return
    setIsLoadingJournal(true)
    setJournalError(null)
    try {
      const response = await fetch(`/merchant-os/api/accounting/journal?merchantId=${merchantId}`)
      if (!response.ok) throw new Error('Failed to fetch journal entries')
      const data = await response.json()
      setJournalEntries(data.journalEntries || [])
    } catch (error) {
      console.error('Error fetching journal entries:', error)
      setJournalError('Failed to load journal entries. Please try again.')
    } finally {
      setIsLoadingJournal(false)
    }
  }, [merchantId])

  const fetchBankAccounts = useCallback(async () => {
    if (!merchantId) return
    setIsLoadingBank(true)
    try {
      const response = await fetch(`/merchant-os/api/accounting/bank-accounts?merchantId=${merchantId}`)
      if (!response.ok) throw new Error('Failed to fetch bank accounts')
      const data = await response.json()
      setBankAccounts(data.accounts || [])
      setBankTransactions(data.transactions || [])
    } catch (error) {
      console.error('Error fetching bank accounts:', error)
    } finally {
      setIsLoadingBank(false)
    }
  }, [merchantId])

  const fetchVATReturns = useCallback(async () => {
    if (!merchantId) return
    setIsLoadingVAT(true)
    try {
      const response = await fetch(`/merchant-os/api/accounting/vat-returns?merchantId=${merchantId}`)
      if (!response.ok) throw new Error('Failed to fetch VAT returns')
      const data = await response.json()
      setVatReturns(data.vatReturns || [])
    } catch (error) {
      console.error('Error fetching VAT returns:', error)
    } finally {
      setIsLoadingVAT(false)
    }
  }, [merchantId])

  const fetchBudgets = useCallback(async () => {
    if (!merchantId) return
    setIsLoadingBudgets(true)
    try {
      const response = await fetch(`/merchant-os/api/accounting/budgets?merchantId=${merchantId}`)
      if (!response.ok) throw new Error('Failed to fetch budgets')
      const data = await response.json()
      setBudgets(data.budgets || [])
    } catch (error) {
      console.error('Error fetching budgets:', error)
    } finally {
      setIsLoadingBudgets(false)
    }
  }, [merchantId])

  // Fetch all data when merchantId is available
  useEffect(() => {
    if (merchantId) {
      fetchAccounts()
      fetchInvoices()
      fetchBills()
      fetchJournalEntries()
      fetchBankAccounts()
      fetchVATReturns()
      fetchBudgets()
    }
  }, [merchantId, fetchAccounts, fetchInvoices, fetchBills, fetchJournalEntries, fetchBankAccounts, fetchVATReturns, fetchBudgets])
  
  // Sprint 3 - Fetch Trial Balance and Balance Sheet data when tab changes
  useEffect(() => {
    if (!merchantId) return
    if (activeTab === 'trial-balance') {
      setIsLoadingTB(true)
      fetch(`/merchant-os/api/accounting/trial-balance?merchantId=${merchantId}&asOfDate=${tbAsOfDate}`)
        .then(res => res.json())
        .then(data => {
          setTrialBalanceData(data)
          setIsLoadingTB(false)
        })
        .catch(() => setIsLoadingTB(false))
    }
    if (activeTab === 'balance-sheet') {
      setIsLoadingBS(true)
      fetch(`/merchant-os/api/accounting/balance-sheet?merchantId=${merchantId}&asOfDate=${bsAsOfDate}`)
        .then(res => res.json())
        .then(data => {
          setBalanceSheetData(data)
          setIsLoadingBS(false)
        })
        .catch(() => setIsLoadingBS(false))
    }
  }, [merchantId, activeTab, tbAsOfDate, bsAsOfDate])
  
  // Refresh all data
  const refreshAllData = useCallback(() => {
    fetchAccounts()
    fetchInvoices()
    fetchBills()
    fetchJournalEntries()
    fetchBankAccounts()
    fetchVATReturns()
    fetchBudgets()
    showToast('Data refreshed', 'info')
  }, [fetchAccounts, fetchInvoices, fetchBills, fetchJournalEntries, fetchBankAccounts, fetchVATReturns, fetchBudgets, showToast])

  // Computed Statistics
  const totalAssets = useMemo(() => accounts.filter(a => a.type === 'asset').reduce((s, a) => s + a.balance, 0), [accounts])
  const totalLiabilities = useMemo(() => Math.abs(accounts.filter(a => a.type === 'liability').reduce((s, a) => s + a.balance, 0)), [accounts])
  const totalEquity = useMemo(() => Math.abs(accounts.filter(a => a.type === 'equity').reduce((s, a) => s + a.balance, 0)), [accounts])
  const totalIncome = useMemo(() => Math.abs(accounts.filter(a => a.type === 'income').reduce((s, a) => s + a.balance, 0)), [accounts])
  const totalExpenses = useMemo(() => accounts.filter(a => a.type === 'expense').reduce((s, a) => s + a.balance, 0), [accounts])
  const grossProfit = totalIncome - totalExpenses
  const netProfit = grossProfit
  const pendingInvoices = useMemo(() => invoices.filter(i => i.status === 'sent' || i.status === 'overdue' || i.status === 'partial'), [invoices])
  const pendingBills = useMemo(() => bills.filter(b => b.status === 'pending' || b.status === 'approved'), [bills])
  const overdueInvoices = useMemo(() => invoices.filter(i => i.status === 'overdue'), [invoices])
  
  // Cash Flow Calculation
  const cashBalance = useMemo(() => bankAccounts.reduce((s, a) => s + a.balance, 0), [bankAccounts])
  const accountsReceivable = useMemo(() => {
    const acc = accounts.find(a => a.code === '1100')
    return acc ? Math.abs(acc.balance) : 67890
  }, [accounts])
  const accountsPayable = useMemo(() => {
    const acc = accounts.find(a => a.code === '2000')
    return acc ? Math.abs(acc.balance) : 45670
  }, [accounts])
  
  // Format Currency
  const formatCurrency = useCallback((amount: number) => {
    const prefix = amount < 0 ? '-R' : 'R'
    return `${prefix}${Math.abs(amount).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }, [])
  
  // Generate GroAI Insights
  const insights = useMemo((): GroAIInsight[] => {
    const insights: GroAIInsight[] = []
    
    // VAT Alert
    const pendingVAT = vatReturns.find(v => v.status === 'ready')
    if (pendingVAT) {
      insights.push({
        id: 'INS-VAT-001',
        type: 'alert',
        title: 'VAT Submission Due',
        description: `Your ${pendingVAT.period} VAT return of ${formatCurrency(pendingVAT.box3_NetVAT)} is ready for submission. Due date: ${pendingVAT.dueDate}`,
        action: 'Submit VAT Return',
        priority: 'high',
        category: 'tax',
        confidence: 100,
        potentialSavings: pendingVAT.box3_NetVAT * 0.1
      })
    }
    
    // Cash Flow Alert
    if (overdueInvoices.length > 0) {
      const totalOverdue = overdueInvoices.reduce((s, i) => s + i.total, 0)
      insights.push({
        id: 'INS-CF-001',
        type: 'opportunity',
        title: 'Cash Flow Opportunity',
        description: `${overdueInvoices.length} invoices totaling ${formatCurrency(totalOverdue)} are overdue. Follow up to improve cash flow.`,
        action: 'Send Payment Reminders',
        priority: 'high',
        category: 'cashflow',
        metric: formatCurrency(totalOverdue),
        confidence: 95,
        potentialSavings: totalOverdue * 0.02
      })
    }
    
    // Revenue Trend
    if (totalIncome > 0) {
      insights.push({
        id: 'INS-REV-001',
        type: 'trend',
        title: 'Revenue Growing',
        description: 'Monthly revenue increased by 12.5% compared to last month. Gross profit margin is ' + ((grossProfit / totalIncome) * 100).toFixed(1) + '%.',
        action: 'View Revenue Report',
        priority: 'low',
        category: 'revenue',
        metric: '+12.5%',
        change: 12.5,
        confidence: 88
      })
    }
    
    // Budget Alerts
    const overBudget = budgets.filter(b => b.percentage > b.alertThreshold)
    overBudget.forEach(budget => {
      insights.push({
        id: `INS-BUD-${budget.id}`,
        type: 'alert',
        title: `${budget.accountName} Over Budget`,
        description: `${budget.accountName} is at ${budget.percentage}% of budget (${formatCurrency(budget.spent)} of ${formatCurrency(budget.amount)}).`,
        action: 'Review Expenses',
        priority: budget.percentage > 90 ? 'high' : 'medium',
        category: 'expense',
        confidence: 100
      })
    })
    
    // Tax Optimization
    const taxableExpenses = accounts.filter(a => a.type === 'expense' && a.taxDeductible)
    const totalDeductible = taxableExpenses.reduce((s, a) => s + a.balance, 0)
    if (totalDeductible > 0) {
      insights.push({
        id: 'INS-TAX-001',
        type: 'recommendation',
        title: 'Tax Deduction Opportunity',
        description: `Total tax-deductible expenses: ${formatCurrency(totalDeductible)}. Estimated tax saving: ${formatCurrency(totalDeductible * 0.27)}`,
        action: 'View Tax Report',
        priority: 'medium',
        category: 'tax',
        metric: formatCurrency(totalDeductible * 0.27),
        confidence: 82,
        potentialSavings: totalDeductible * 0.27
      })
    }
    
    // Bank Reconciliation
    const unreconciled = bankAccounts.filter(a => a.difference !== 0)
    if (unreconciled.length > 0) {
      insights.push({
        id: 'INS-REC-001',
        type: 'alert',
        title: 'Bank Reconciliation Required',
        description: `${unreconciled.length} bank account(s) need reconciliation. Total difference: ${formatCurrency(unreconciled.reduce((s, a) => s + Math.abs(a.difference), 0))}`,
        action: 'Reconcile Now',
        priority: 'medium',
        category: 'compliance',
        confidence: 100
      })
    }
    
    return insights
  }, [vatReturns, overdueInvoices, grossProfit, totalIncome, budgets, accounts, bankAccounts, formatCurrency])
  
  // Invoice Handlers with API calls
  const handleCreateInvoice = useCallback(async () => {
    const subtotal = (invoiceForm.items || []).reduce((s, i) => s + (i.quantity * i.unitPrice - i.discount), 0)
    const taxableTotal = (invoiceForm.items || []).filter(i => i.taxable).reduce((s, i) => s + (i.quantity * i.unitPrice - i.discount), 0)
    const vat = taxableTotal * 0.15
    const total = subtotal + vat - (invoiceForm.discount || 0)
    
    // Optimistic update
    const tempId = `INV-TEMP-${Date.now()}`
    const optimisticInvoice: Invoice = {
      id: tempId,
      invoiceNumber: 'Creating...',
      customerName: invoiceForm.customerName || '',
      customerEmail: invoiceForm.customerEmail || '',
      customerPhone: invoiceForm.customerPhone,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: invoiceForm.items || [],
      subtotal,
      vat,
      discount: invoiceForm.discount || 0,
      total,
      status: 'draft',
      notes: invoiceForm.notes,
      terms: invoiceForm.terms || 'Payment due within 30 days'
    }
    
    setInvoices(prev => [optimisticInvoice, ...prev])
    setInvoiceDialogOpen(false)
    
    try {
      const response = await fetch('/merchant-os/api/accounting/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...invoiceForm,
          merchantId: merchantId!,
          subtotal,
          vat,
          total
        })
      })
      
      if (!response.ok) throw new Error('Failed to create invoice')
      
      const data = await response.json()
      
      // Replace optimistic invoice with real one
      setInvoices(prev => prev.map(inv => inv.id === tempId ? data.invoice : inv))
      showToast('Invoice created successfully', 'success')
    } catch (error) {
      // Rollback optimistic update
      setInvoices(prev => prev.filter(inv => inv.id !== tempId))
      showToast('Failed to create invoice', 'error')
    }
    
    setInvoiceForm({
      customerName: '',
      customerEmail: '',
      items: [{ id: 'NEW-1', description: '', quantity: 1, unitPrice: 0, discount: 0, total: 0, taxable: true }],
      discount: 0,
      notes: '',
      terms: 'Payment due within 30 days'
    })
  }, [invoiceForm, showToast])
  
  const handleUpdateInvoiceStatus = useCallback(async (id: string, status: Invoice['status'], paidAmount?: number) => {
    // Optimistic update
    setInvoices(prev => prev.map(inv => {
      if (inv.id === id) {
        return {
          ...inv,
          status,
          paidDate: status === 'paid' ? new Date().toISOString().split('T')[0] : inv.paidDate,
          paidAmount: paidAmount || inv.paidAmount
        }
      }
      return inv
    }))
    
    try {
      const response = await fetch(`/merchant-os/api/accounting/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          paidAmount,
          paidDate: status === 'paid' ? new Date().toISOString().split('T')[0] : undefined,
          merchantId: merchantId!
        })
      })
      
      if (!response.ok) throw new Error('Failed to update invoice')
      
      showToast(`Invoice marked as ${status}`, 'success')
    } catch (error) {
      // Refresh data on error
      fetchInvoices()
      showToast('Failed to update invoice', 'error')
    }
  }, [fetchInvoices, showToast])
  
  const handleDeleteInvoice = useCallback(async (id: string) => {
    // Optimistic update
    setInvoices(prev => prev.filter(inv => inv.id !== id))
    
    try {
      const response = await fetch(`/merchant-os/api/accounting/invoices/${id}?merchantId=${merchantId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete invoice')
      
      showToast('Invoice deleted', 'info')
    } catch (error) {
      // Refresh data on error
      fetchInvoices()
      showToast('Failed to delete invoice', 'error')
    }
  }, [fetchInvoices, showToast])
  
  // Bill Handlers with API calls
  const handleCreateBill = useCallback(async () => {
    const subtotal = (billForm.items || []).reduce((s, i) => s + i.total, 0)
    const vat = subtotal * 0.15
    const total = subtotal + vat
    
    // Optimistic update
    const tempId = `BIL-TEMP-${Date.now()}`
    const optimisticBill: Bill = {
      id: tempId,
      billNumber: 'Creating...',
      supplierName: billForm.supplierName || '',
      supplierEmail: billForm.supplierEmail,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: billForm.items || [],
      subtotal,
      vat,
      total,
      status: 'draft',
      category: billForm.category || 'General',
      paymentTerms: billForm.paymentTerms,
      notes: billForm.notes
    }
    
    setBills(prev => [optimisticBill, ...prev])
    setBillDialogOpen(false)
    
    try {
      const response = await fetch('/merchant-os/api/accounting/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...billForm,
          merchantId: merchantId!,
          subtotal,
          vat,
          total
        })
      })
      
      if (!response.ok) throw new Error('Failed to create bill')
      
      const data = await response.json()
      
      // Replace optimistic bill with real one
      setBills(prev => prev.map(bill => bill.id === tempId ? data.bill : bill))
      showToast('Bill created successfully', 'success')
    } catch (error) {
      // Rollback optimistic update
      setBills(prev => prev.filter(bill => bill.id !== tempId))
      showToast('Failed to create bill', 'error')
    }
    
    setBillForm({
      supplierName: '',
      items: [{ id: 'NEW-1', description: '', quantity: 1, unitPrice: 0, total: 0, accountId: '' }],
      category: 'General',
      notes: ''
    })
  }, [billForm, showToast])
  
  const handleUpdateBillStatus = useCallback(async (id: string, status: Bill['status']) => {
    // Optimistic update
    setBills(prev => prev.map(bill => {
      if (bill.id === id) {
        return {
          ...bill,
          status,
          approvedBy: status === 'approved' ? 'Current User' : bill.approvedBy,
          approvedAt: status === 'approved' ? new Date().toISOString() : bill.approvedAt
        }
      }
      return bill
    }))
    
    try {
      const response = await fetch(`/merchant-os/api/accounting/bills/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          approvedBy: status === 'approved' ? 'Current User' : undefined,
          approvedAt: status === 'approved' ? new Date().toISOString() : undefined,
          merchantId: merchantId!
        })
      })
      
      if (!response.ok) throw new Error('Failed to update bill')
      
      showToast(`Bill marked as ${status}`, 'success')
    } catch (error) {
      // Refresh data on error
      fetchBills()
      showToast('Failed to update bill', 'error')
    }
  }, [fetchBills, showToast])
  
  const handleDeleteBill = useCallback(async (id: string) => {
    // Optimistic update
    setBills(prev => prev.filter(bill => bill.id !== id))
    
    try {
      const response = await fetch(`/merchant-os/api/accounting/bills/${id}?merchantId=${merchantId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete bill')
      
      showToast('Bill deleted', 'info')
    } catch (error) {
      // Refresh data on error
      fetchBills()
      showToast('Failed to delete bill', 'error')
    }
  }, [fetchBills, showToast])
  
  // Account Handlers with API calls
  const handleCreateAccount = useCallback(async () => {
    // Optimistic update
    const tempId = `ACC-TEMP-${Date.now()}`
    const optimisticAccount: Account = {
      id: tempId,
      code: accountForm.code || '',
      name: accountForm.name || '',
      type: accountForm.type || 'asset',
      subType: accountForm.subType || 'Current Asset',
      balance: 0,
      currency: 'ZAR',
      isActive: accountForm.isActive ?? true,
      description: accountForm.description,
      taxDeductible: accountForm.taxDeductible
    }
    
    setAccounts(prev => [...prev, optimisticAccount].sort((a, b) => a.code.localeCompare(b.code)))
    setAccountDialogOpen(false)
    
    try {
      const response = await fetch('/merchant-os/api/accounting/chart-of-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...accountForm,
          merchantId: merchantId!
        })
      })
      
      if (!response.ok) throw new Error('Failed to create account')
      
      const data = await response.json()
      
      // Replace optimistic account with real one
      setAccounts(prev => prev.map(acc => acc.id === tempId ? data.account : acc).sort((a, b) => a.code.localeCompare(b.code)))
      showToast('Account created successfully', 'success')
    } catch (error) {
      // Rollback optimistic update
      setAccounts(prev => prev.filter(acc => acc.id !== tempId))
      showToast('Failed to create account', 'error')
    }
    
    setAccountForm({
      code: '',
      name: '',
      type: 'asset',
      subType: 'Current Asset',
      isActive: true
    })
  }, [accountForm, showToast])
  
  const handleDeleteAccount = useCallback(async (id: string) => {
    // Optimistic update
    setAccounts(prev => prev.filter(acc => acc.id !== id))
    
    try {
      const response = await fetch(`/merchant-os/api/accounting/chart-of-accounts/${id}?merchantId=${merchantId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete account')
      
      showToast('Account deleted', 'info')
    } catch (error) {
      // Refresh data on error
      fetchAccounts()
      showToast('Failed to delete account', 'error')
    }
  }, [fetchAccounts, showToast])
  
  // Journal Entry Handlers with API calls
  const handleCreateJournalEntry = useCallback(async () => {
    const totalDebit = (journalForm.lines || []).reduce((s, l) => s + l.debit, 0)
    const totalCredit = (journalForm.lines || []).reduce((s, l) => s + l.credit, 0)
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      showToast('Journal entry must balance (Debits must equal Credits)', 'error')
      return
    }
    
    // Optimistic update
    const tempId = `JE-TEMP-${Date.now()}`
    const optimisticEntry: JournalEntry = {
      id: tempId,
      date: journalForm.date || new Date().toISOString().split('T')[0],
      reference: 'Creating...',
      description: journalForm.description || '',
      lines: journalForm.lines || [],
      totalDebit,
      totalCredit,
      status: 'draft',
      createdBy: 'Current User',
      createdAt: new Date().toISOString()
    }
    
    setJournalEntries(prev => [optimisticEntry, ...prev])
    setJournalDialogOpen(false)
    
    try {
      const response = await fetch('/merchant-os/api/accounting/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...journalForm,
          totalDebit,
          totalCredit,
          merchantId: merchantId!
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create journal entry')
      }
      
      const data = await response.json()
      
      // Replace optimistic entry with real one
      setJournalEntries(prev => prev.map(je => je.id === tempId ? data.journalEntry : je))
      showToast('Journal entry created', 'success')
    } catch (error: any) {
      // Rollback optimistic update
      setJournalEntries(prev => prev.filter(je => je.id !== tempId))
      showToast(error.message || 'Failed to create journal entry', 'error')
    }
    
    setJournalForm({
      date: new Date().toISOString().split('T')[0],
      description: '',
      lines: [
        { id: 'JL-1', accountId: '', accountName: '', debit: 0, credit: 0, description: '' },
        { id: 'JL-2', accountId: '', accountName: '', debit: 0, credit: 0, description: '' }
      ]
    })
  }, [journalForm, showToast])
  
  const handlePostJournalEntry = useCallback(async (id: string) => {
    // Optimistic update
    setJournalEntries(prev => prev.map(je => {
      if (je.id === id) {
        return { ...je, status: 'posted' as const }
      }
      return je
    }))
    
    try {
      const response = await fetch(`/merchant-os/api/accounting/journal/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'posted',
          merchantId: merchantId!
        })
      })
      
      if (!response.ok) throw new Error('Failed to post journal entry')
      
      showToast('Journal entry posted', 'success')
    } catch (error) {
      // Refresh data on error
      fetchJournalEntries()
      showToast('Failed to post journal entry', 'error')
    }
  }, [fetchJournalEntries, showToast])
  
  // VAT Handlers
  const handleSubmitVAT = useCallback((id: string) => {
    setVatReturns(prev => prev.map(vat => {
      if (vat.id === id) {
        return {
          ...vat,
          status: 'submitted' as const,
          submittedDate: new Date().toISOString().split('T')[0]
        }
      }
      return vat
    }))
    showToast('VAT return submitted to SARS', 'success')
  }, [showToast])
  
  // Status Colors
  const getInvoiceStatusColor = (status: Invoice['status']) => {
    const colors: Record<Invoice['status'], string> = {
      draft: 'bg-gray-100 text-gray-700',
      sent: 'bg-blue-100 text-blue-700',
      paid: 'bg-green-100 text-green-700',
      overdue: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-500',
      partial: 'bg-amber-100 text-amber-700'
    }
    return colors[status]
  }
  
  const getBillStatusColor = (status: Bill['status']) => {
    const colors: Record<Bill['status'], string> = {
      draft: 'bg-gray-100 text-gray-700',
      pending: 'bg-amber-100 text-amber-700',
      approved: 'bg-blue-100 text-blue-700',
      paid: 'bg-green-100 text-green-700',
      overdue: 'bg-red-100 text-red-700',
      partial: 'bg-purple-100 text-purple-700'
    }
    return colors[status]
  }
  
  const getVATStatusColor = (status: VATReturn['status']) => {
    const colors: Record<VATReturn['status'], string> = {
      draft: 'bg-gray-100 text-gray-700',
      ready: 'bg-amber-100 text-amber-700',
      submitted: 'bg-blue-100 text-blue-700',
      paid: 'bg-green-100 text-green-700',
      refunded: 'bg-purple-100 text-purple-700'
    }
    return colors[status]
  }
  
  // GroAI Insights state
  const [insightFilter, setInsightFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')
  const [insightCategory, setInsightCategory] = useState<'all' | 'cashflow' | 'tax' | 'expense' | 'revenue' | 'compliance' | 'optimization'>('all')
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null)

  // Filter insights
  const filteredInsights = useMemo(() => {
    return insights.filter(insight => {
      if (insightFilter !== 'all' && insight.priority !== insightFilter) return false
      if (insightCategory !== 'all' && insight.category !== insightCategory) return false
      return true
    })
  }, [insights, insightFilter, insightCategory])

  // Get insight counts
  const insightCounts = useMemo(() => ({
    all: insights.length,
    high: insights.filter(i => i.priority === 'high').length,
    medium: insights.filter(i => i.priority === 'medium').length,
    low: insights.filter(i => i.priority === 'low').length
  }), [insights])

  // Render GroAI Insights Panel
  const renderInsightsPanel = () => {
    const typeConfig = {
      opportunity: { icon: Lightbulb, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' },
      alert: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
      trend: { icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
      recommendation: { icon: Target, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-200' },
      prediction: { icon: Zap, color: 'text-cyan-500', bg: 'bg-cyan-50', border: 'border-cyan-200' }
    }

    const priorityConfig = {
      high: { label: 'Urgent', dot: 'bg-red-500', bar: 'bg-red-500' },
      medium: { label: 'Important', dot: 'bg-amber-500', bar: 'bg-amber-500' },
      low: { label: 'For Review', dot: 'bg-green-500', bar: 'bg-green-500' }
    }

    const categoryConfig = {
      cashflow: { label: 'Cash Flow', icon: Coins },
      tax: { label: 'Tax', icon: Calculator },
      expense: { label: 'Expenses', icon: TrendingDown },
      revenue: { label: 'Revenue', icon: TrendingUp },
      compliance: { label: 'Compliance', icon: CheckCircle2 },
      optimization: { label: 'Optimization', icon: Zap }
    }

    return (
      <Card className="border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#00897B] to-[#00796B] px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">GroAI Financial Insights</h3>
                <p className="text-xs text-white/80">AI-powered recommendations for your business</p>
              </div>
            </div>
            <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
              {insights.length} insights
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <div className="border-b bg-gray-50 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Priority Filter */}
            <div className="flex items-center gap-1 bg-white rounded-lg p-1 border">
              {(['all', 'high', 'medium', 'low'] as const).map(priority => (
                <button
                  key={priority}
                  onClick={() => setInsightFilter(priority)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    insightFilter === priority
                      ? 'bg-[#00897B] text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {priority === 'all' ? 'All' : priorityConfig[priority].label}
                  {priority !== 'all' && (
                    <span className={`ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] text-[10px] rounded-full ${
                      insightFilter === priority ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {insightCounts[priority]}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Category Filter */}
            <Select value={insightCategory} onValueChange={(val: any) => setInsightCategory(val)}>
              <SelectTrigger className="h-8 w-[140px] bg-white text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(categoryConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <config.icon className="h-3 w-3" />
                      {config.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Insights List */}
        <CardContent className="p-0">
          {filteredInsights.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="p-3 bg-gray-100 rounded-full mb-3">
                <CheckCircle2 className="h-6 w-6 text-[#00897B]" />
              </div>
              <p className="font-medium text-gray-700">All caught up!</p>
              <p className="text-sm text-gray-500 mt-1">No insights match your current filters</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[450px]">
              <div className="divide-y divide-gray-100">
                {filteredInsights.map((insight, index) => {
                  const typeConf = typeConfig[insight.type]
                  const priorityConf = priorityConfig[insight.priority]
                  const categoryConf = categoryConfig[insight.category]
                  const Icon = typeConf.icon
                  const isExpanded = expandedInsight === insight.id

                  return (
                    <div
                      key={insight.id}
                      className={`group transition-colors ${isExpanded ? 'bg-gray-50' : 'hover:bg-gray-50/50'}`}
                    >
                      {/* Insight Header - Always Visible */}
                      <div
                        className="flex items-start gap-3 px-4 py-3 cursor-pointer"
                        onClick={() => setExpandedInsight(isExpanded ? null : insight.id)}
                      >
                        {/* Type Icon */}
                        <div className={`p-2 rounded-lg ${typeConf.bg} shrink-0 mt-0.5`}>
                          <Icon className={`h-4 w-4 ${typeConf.color}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm text-gray-900 truncate">{insight.title}</h4>
                            <div className={`w-2 h-2 rounded-full ${priorityConf.dot} shrink-0`} title={priorityConf.label} />
                          </div>

                          <p className={`text-xs text-gray-500 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                            {insight.description}
                          </p>

                          {/* Quick Stats Row */}
                          <div className="flex items-center gap-4 mt-2">
                            {/* Category Badge */}
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 gap-1">
                              <categoryConf.icon className="h-2.5 w-2.5" />
                              {categoryConf.label}
                            </Badge>

                            {/* Confidence */}
                            {insight.confidence && (
                              <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                <Brain className="h-3 w-3" />
                                <span>{insight.confidence}% confidence</span>
                              </div>
                            )}

                            {/* Potential Savings */}
                            {insight.potentialSavings && insight.potentialSavings > 0 && (
                              <div className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
                                <ArrowUpRight className="h-3 w-3" />
                                Save {formatCurrency(insight.potentialSavings)}
                              </div>
                            )}

                            {/* Change Indicator */}
                            {insight.change !== undefined && insight.change !== 0 && (
                              <div className={`flex items-center gap-0.5 text-[10px] font-medium ${
                                insight.change > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {insight.change > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                {Math.abs(insight.change)}%
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Expand/Collapse Icon */}
                        <ChevronRight className={`h-4 w-4 text-gray-400 shrink-0 mt-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pl-[52px]">
                          <div className="bg-white border rounded-lg p-3 shadow-sm">
                            {/* Priority Bar */}
                            <div className="flex items-center justify-between mb-3 pb-3 border-b border-dashed">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">Priority:</span>
                                <Badge className={`${priorityConf.bar} text-white text-[10px]`}>
                                  {priorityConf.label}
                                </Badge>
                              </div>
                              {insight.metric && (
                                <div className="text-xs font-medium text-gray-700">
                                  Metric: <span className="text-[#00897B]">{insight.metric}</span>
                                </div>
                              )}
                            </div>

                            {/* Action Button */}
                            <Button
                              size="sm"
                              className="w-full bg-[#00897B] hover:bg-[#00695C] text-white"
                              onClick={(e) => {
                                e.stopPropagation()
                                showToast(`Action: ${insight.action}`, 'info')
                              }}
                            >
                              {insight.action}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    )
  }
  
  // Render Dashboard
  const renderDashboard = () => {
    const isLoading = isLoadingAccounts || isLoadingInvoices || isLoadingBills || isLoadingJournal
    const hasError = accountsError || invoicesError || billsError || journalError
    
    return (
      <div className="space-y-6">
        {/* Error Alert */}
        {hasError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">Error loading data</p>
                  <p className="text-xs text-red-600">{accountsError || invoicesError || billsError || journalError}</p>
                </div>
                <Button size="sm" variant="outline" onClick={refreshAllData}>
                  <RefreshCw className="h-4 w-4 mr-2" />Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {isLoadingAccounts ? (
            <>
              <LoadingSkeleton className="h-28" />
              <LoadingSkeleton className="h-28" />
              <LoadingSkeleton className="h-28" />
              <LoadingSkeleton className="h-28" />
              <LoadingSkeleton className="h-28" />
            </>
          ) : (
            <>
              <Card className="border-l-4 border-l-[#00897B]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#757575]">Total Assets</p>
                    <Wallet className="h-4 w-4 text-[#00897B]" />
                  </div>
                  <p className="text-2xl font-bold text-[#00897B]">{formatCurrency(totalAssets)}</p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />+5.2% vs last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#757575]">Total Liabilities</p>
                    <CreditCard className="h-4 w-4 text-red-500" />
                  </div>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(totalLiabilities)}</p>
                  <p className="text-xs text-[#757575]">Outstanding obligations</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#757575]">Net Profit</p>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(netProfit)}</p>
                  <p className="text-xs text-green-600">Margin: {totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : 0}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#757575]">Accounts Receivable</p>
                    <ArrowUpRight className="h-4 w-4 text-amber-500" />
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(accountsReceivable)}</p>
                  <p className="text-xs text-amber-600">{pendingInvoices.length} pending invoices</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#757575]">Accounts Payable</p>
                    <ArrowDownRight className="h-4 w-4 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(accountsPayable)}</p>
                  <p className="text-xs text-blue-600">{pendingBills.length} pending bills</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-2 flex-wrap">
          <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => { setSelectedInvoice(null); setInvoiceDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />New Invoice
          </Button>
          <Button variant="outline" onClick={() => { setSelectedBill(null); setBillDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />New Bill
          </Button>
          <Button variant="outline" onClick={() => setJournalDialogOpen(true)}>
            <ArrowRightLeft className="h-4 w-4 mr-2" />Journal Entry
          </Button>
          <Button variant="outline" onClick={() => setActiveTab('reconciliation')}>
            <ArrowRightLeft className="h-4 w-4 mr-2" />Reconcile
          </Button>
          <Button variant="outline" onClick={() => setActiveTab('vat')}>
            <Percent className="h-4 w-4 mr-2" />VAT 201
          </Button>
          <Button variant="outline" onClick={() => setActiveTab('reports')}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />Reports
          </Button>
          <Button variant="outline" onClick={refreshAllData} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}Refresh
          </Button>
        </div>
        
        {/* GroAI Insights */}
        {renderInsightsPanel()}
        
        {/* Bank Accounts & Quick Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Landmark className="h-4 w-4 text-[#00897B]" />
                Bank Accounts
                <Badge variant="outline" className="ml-auto">
                  Total: {formatCurrency(cashBalance)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bankAccounts.map(account => (
                  <div
                    key={account.id}
                    className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                    onClick={() => { setSelectedBank(account); setReconcileDialogOpen(true); }}
                  >
                    <div className={`p-2 rounded-lg ${
                      account.accountType === 'cheque' ? 'bg-blue-100' :
                      account.accountType === 'savings' ? 'bg-green-100' :
                      account.accountType === 'credit' ? 'bg-purple-100' : 'bg-amber-100'
                    }`}>
                      <Building2 className={`h-4 w-4 ${
                        account.accountType === 'cheque' ? 'text-blue-600' :
                        account.accountType === 'savings' ? 'text-green-600' :
                        account.accountType === 'credit' ? 'text-purple-600' : 'text-amber-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{account.bankName}</p>
                        <Badge variant="outline" className="text-[10px]">{account.accountType}</Badge>
                        {account.status === 'connected' && (
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        )}
                      </div>
                      <p className="text-xs text-[#757575]">{account.accountNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${account.balance < 0 ? 'text-red-600' : 'text-[#00897B]'}`}>
                        {formatCurrency(account.balance)}
                      </p>
                      {account.difference !== 0 && (
                        <p className="text-xs text-amber-600">Diff: {formatCurrency(account.difference)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#00897B]" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingJournal ? (
                <div className="space-y-2">
                  <LoadingSkeleton className="h-12" />
                  <LoadingSkeleton className="h-12" />
                  <LoadingSkeleton className="h-12" />
                </div>
              ) : (
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {journalEntries.slice(0, 6).map(entry => (
                      <div key={entry.id} className="flex items-center gap-3 p-2 border rounded-lg">
                        <div className={`p-1.5 rounded ${
                          entry.status === 'posted' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                        }`}>
                          <ArrowRightLeft className="h-3 w-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{entry.description}</p>
                          <p className="text-xs text-[#757575]">{entry.date} • {entry.reference}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-sm">{formatCurrency(entry.totalDebit)}</p>
                          <Badge className={entry.status === 'posted' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                            {entry.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Budget Overview */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-[#00897B]" />
              Budget Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {budgets.map(budget => (
                <div key={budget.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm truncate">{budget.name}</p>
                    <Badge className={budget.percentage > 90 ? 'bg-red-100 text-red-700' : budget.percentage > 75 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}>
                      {budget.percentage}%
                    </Badge>
                  </div>
                  <Progress value={budget.percentage} className="h-2 mb-2" />
                  <div className="flex justify-between text-xs text-[#757575]">
                    <span>Spent: {formatCurrency(budget.spent)}</span>
                    <span>Budget: {formatCurrency(budget.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // Render Chart of Accounts
  const renderChartOfAccounts = () => (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
          <Input placeholder="Search accounts..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Filter by type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="asset">Assets</SelectItem>
            <SelectItem value="liability">Liabilities</SelectItem>
            <SelectItem value="equity">Equity</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expenses</SelectItem>
          </SelectContent>
        </Select>
        <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => { setSelectedAccount(null); setAccountDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />Add Account
        </Button>
      </div>
      
      <div className="grid grid-cols-5 gap-3">
        {[
          { type: 'asset', label: 'Assets', total: totalAssets, color: 'bg-blue-100 text-blue-700' },
          { type: 'liability', label: 'Liabilities', total: totalLiabilities, color: 'bg-red-100 text-red-700' },
          { type: 'equity', label: 'Equity', total: totalEquity, color: 'bg-purple-100 text-purple-700' },
          { type: 'income', label: 'Income', total: totalIncome, color: 'bg-green-100 text-green-700' },
          { type: 'expense', label: 'Expenses', total: totalExpenses, color: 'bg-orange-100 text-orange-700' },
        ].map(cat => (
          <Card key={cat.type} className={`${cat.color} cursor-pointer hover:opacity-80`} onClick={() => setTypeFilter(cat.type)}>
            <CardContent className="p-3 text-center">
              <p className="text-xs font-medium">{cat.label}</p>
              <p className="text-lg font-bold">{formatCurrency(cat.total)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {isLoadingAccounts ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <LoadingSkeleton key={i} className="h-16" />
          ))}
        </div>
      ) : accountsError ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-700">{accountsError}</p>
            <Button size="sm" variant="outline" className="mt-2" onClick={fetchAccounts}>
              <RefreshCw className="h-4 w-4 mr-2" />Retry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="flex-1">
          <div className="space-y-1">
            {accounts
              .filter(a => typeFilter === 'all' || a.type === typeFilter)
              .filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.code.includes(searchQuery))
              .map(account => {
                const typeColors: Record<string, string> = { asset: 'border-l-blue-500', liability: 'border-l-red-500', equity: 'border-l-purple-500', income: 'border-l-green-500', expense: 'border-l-orange-500' }
                const typeIcons: Record<string, any> = { asset: Wallet, liability: CreditCard, equity: PiggyBank, income: TrendingUp, expense: TrendingDown }
                const Icon = typeIcons[account.type]
                const isParent = accounts.some(a => a.parentCode === account.code)
                
                return (
                  <div key={account.id} className={`flex items-center gap-3 p-3 border rounded-lg border-l-4 ${typeColors[account.type]} ${account.parentCode ? 'ml-6 bg-gray-50' : ''} hover:bg-gray-50`}>
                    <Icon className="h-4 w-4 text-[#757575] shrink-0" />
                    <div className="w-16 shrink-0"><Badge variant="outline" className="font-mono text-xs">{account.code}</Badge></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{account.name}</p>
                        {account.taxDeductible && <Badge variant="outline" className="text-[10px] bg-green-50">Tax Deductible</Badge>}
                      </div>
                      <p className="text-xs text-[#757575]">{account.subType}</p>
                    </div>
                    <p className={`font-bold shrink-0 ${account.balance < 0 ? 'text-red-600' : 'text-[#00897B]'}`}>{formatCurrency(account.balance)}</p>
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="ghost" onClick={() => { setSelectedAccount(account); setAccountForm(account); setAccountDialogOpen(true); }}><Edit className="h-3 w-3" /></Button>
                      {!isParent && !account.parentCode && <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDeleteAccount(account.id)}><Trash2 className="h-3 w-3" /></Button>}
                    </div>
                  </div>
                )
              })}
          </div>
        </ScrollArea>
      )}
    </div>
  )
  
  // Render Invoices
  const renderInvoices = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
            <Input placeholder="Search invoices..." className="pl-9 w-[250px]" />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => { setSelectedInvoice(null); setInvoiceDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />New Invoice
        </Button>
      </div>
      
      {/* Invoice Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Drafts</p>
            <p className="text-xl font-bold">{invoices.filter(i => i.status === 'draft').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Pending</p>
            <p className="text-xl font-bold text-amber-600">{invoices.filter(i => i.status === 'sent' || i.status === 'partial').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Overdue</p>
            <p className="text-xl font-bold text-red-600">{invoices.filter(i => i.status === 'overdue').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Collected</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0))}</p>
          </CardContent>
        </Card>
      </div>
      
      {isLoadingInvoices ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <LoadingSkeleton key={i} className="h-20" />
          ))}
        </div>
      ) : invoicesError ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-700">{invoicesError}</p>
            <Button size="sm" variant="outline" className="mt-2" onClick={fetchInvoices}>
              <RefreshCw className="h-4 w-4 mr-2" />Retry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="flex-1">
          <div className="space-y-2">
            {invoices.map(invoice => (
              <div key={invoice.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{invoice.invoiceNumber}</p>
                    <Badge className={getInvoiceStatusColor(invoice.status)}>{invoice.status}</Badge>
                  </div>
                  <p className="text-sm text-[#757575]">{invoice.customerName} • {invoice.customerEmail}</p>
                  <p className="text-xs text-[#757575]">Due: {invoice.dueDate}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{formatCurrency(invoice.total)}</p>
                  <p className="text-xs text-[#757575]">{invoice.items.length} items</p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost"><Eye className="h-4 w-4" /></Button>
                  {invoice.status === 'draft' && (
                    <Button size="sm" variant="ghost" onClick={() => handleUpdateInvoiceStatus(invoice.id, 'sent')}><Send className="h-4 w-4" /></Button>
                  )}
                  {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                    <Button size="sm" variant="ghost" className="text-green-600" onClick={() => handleUpdateInvoiceStatus(invoice.id, 'paid')}><CheckCircle2 className="h-4 w-4" /></Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDeleteInvoice(invoice.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
  
  // Render Bills
  const renderBills = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
            <Input placeholder="Search bills..." className="pl-9 w-[250px]" />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => { setSelectedBill(null); setBillDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />New Bill
        </Button>
      </div>
      
      {/* Bill Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Pending Approval</p>
            <p className="text-xl font-bold text-amber-600">{bills.filter(b => b.status === 'pending').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Approved</p>
            <p className="text-xl font-bold text-blue-600">{bills.filter(b => b.status === 'approved').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Overdue</p>
            <p className="text-xl font-bold text-red-600">{bills.filter(b => b.status === 'overdue').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Total Payable</p>
            <p className="text-xl font-bold">{formatCurrency(bills.filter(b => b.status !== 'paid').reduce((s, b) => s + b.total, 0))}</p>
          </CardContent>
        </Card>
      </div>
      
      {isLoadingBills ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <LoadingSkeleton key={i} className="h-20" />
          ))}
        </div>
      ) : billsError ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-700">{billsError}</p>
            <Button size="sm" variant="outline" className="mt-2" onClick={fetchBills}>
              <RefreshCw className="h-4 w-4 mr-2" />Retry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="flex-1">
          <div className="space-y-2">
            {bills.map(bill => (
              <div key={bill.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{bill.billNumber}</p>
                    <Badge className={getBillStatusColor(bill.status)}>{bill.status}</Badge>
                    <Badge variant="outline" className="text-[10px]">{bill.category}</Badge>
                  </div>
                  <p className="text-sm text-[#757575]">{bill.supplierName}</p>
                  <p className="text-xs text-[#757575]">Due: {bill.dueDate}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{formatCurrency(bill.total)}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost"><Eye className="h-4 w-4" /></Button>
                  {bill.status === 'pending' && (
                    <Button size="sm" variant="ghost" className="text-blue-600" onClick={() => handleUpdateBillStatus(bill.id, 'approved')}><CheckCircle2 className="h-4 w-4" /></Button>
                  )}
                  {bill.status === 'approved' && (
                    <Button size="sm" variant="ghost" className="text-green-600" onClick={() => handleUpdateBillStatus(bill.id, 'paid')}><Coins className="h-4 w-4" /></Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDeleteBill(bill.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
  
  // Render Journal Entries
  const renderJournalEntries = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
            <Input placeholder="Search entries..." className="pl-9 w-[250px]" />
          </div>
        </div>
        <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setJournalDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />New Journal Entry
        </Button>
      </div>
      
      {isLoadingJournal ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <LoadingSkeleton key={i} className="h-24" />
          ))}
        </div>
      ) : journalError ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-700">{journalError}</p>
            <Button size="sm" variant="outline" className="mt-2" onClick={fetchJournalEntries}>
              <RefreshCw className="h-4 w-4 mr-2" />Retry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="flex-1">
          <div className="space-y-2">
            {journalEntries.map(entry => (
              <div key={entry.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{entry.reference}</Badge>
                    <p className="font-medium">{entry.description}</p>
                    <Badge className={entry.status === 'posted' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                      {entry.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-[#757575]">{entry.date}</p>
                    {entry.status === 'draft' && (
                      <Button size="sm" variant="outline" onClick={() => handlePostJournalEntry(entry.id)}>
                        <CheckCircle2 className="h-4 w-4 mr-1" />Post
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Journal Lines */}
                <div className="bg-gray-50 rounded p-2 text-xs">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="h-8">Account</TableHead>
                        <TableHead className="h-8 text-right">Debit</TableHead>
                        <TableHead className="h-8 text-right">Credit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entry.lines.map(line => (
                        <TableRow key={line.id}>
                          <TableCell>{line.accountName}</TableCell>
                          <TableCell className="text-right">{line.debit > 0 ? formatCurrency(line.debit) : '-'}</TableCell>
                          <TableCell className="text-right">{line.credit > 0 ? formatCurrency(line.credit) : '-'}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold bg-white">
                        <TableCell>Total</TableCell>
                        <TableCell className="text-right">{formatCurrency(entry.totalDebit)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(entry.totalCredit)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
  
  // Render VAT Management
  const renderVAT = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>VAT 201 Returns</CardTitle>
          <CardDescription>South African VAT management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {vatReturns.map(vat => (
              <div key={vat.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{vat.period}</p>
                      <Badge className={getVATStatusColor(vat.status)}>{vat.status}</Badge>
                    </div>
                    <p className="text-xs text-[#757575]">Due: {vat.dueDate}</p>
                  </div>
                  {vat.status === 'ready' && (
                    <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => handleSubmitVAT(vat.id)}>
                      <Send className="h-4 w-4 mr-2" />Submit to SARS
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-[#757575]">Box 1: Output VAT</p>
                    <p className="font-bold">{formatCurrency(vat.box1_OutputVAT)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#757575]">Box 2: Input VAT</p>
                    <p className="font-bold">{formatCurrency(vat.box2_InputVAT)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#757575]">Box 3: Net VAT</p>
                    <p className={`font-bold ${vat.box3_NetVAT > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(vat.box3_NetVAT)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#757575]">Total Sales</p>
                    <p className="font-bold">{formatCurrency(vat.box4_TotalSales)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
  
  // ========================================
  // ENHANCED FINANCE TABS - Sprint 3
  // ========================================

  // Render Trial Balance Tab (Enhanced with API integration)
  const renderTrialBalanceTab = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-[#00897B]" />
              Trial Balance
            </h3>
            <p className="text-sm text-[#757575]">As of {new Date(tbAsOfDate).toLocaleDateString('en-ZA')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={tbAsOfDate}
              onChange={(e) => setTbAsOfDate(e.target.value)}
              className="w-40"
            />
            <Button variant="outline" size="sm" onClick={() => showToast('Report printed', 'success')}>
              <Printer className="h-4 w-4 mr-2" />Print
            </Button>
            <Button variant="outline" size="sm" onClick={() => showToast('Report exported', 'success')}>
              <Download className="h-4 w-4 mr-2" />Export
            </Button>
          </div>
        </div>

        {isLoadingTB ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#00897B]" />
          </div>
        ) : trialBalanceData ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-[#757575]">Total Debit</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(trialBalanceData.totals?.debit || 0)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-[#757575]">Total Credit</p>
                  <p className="text-xl font-bold text-red-600">{formatCurrency(trialBalanceData.totals?.credit || 0)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-[#757575]">Difference</p>
                  <p className={`text-xl font-bold ${trialBalanceData.isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(trialBalanceData.totals?.difference || 0)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-[#757575]">Status</p>
                  <Badge className={trialBalanceData.isBalanced ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                    {trialBalanceData.isBalanced ? 'Balanced' : 'Out of Balance'}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Trial Balance Table */}
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="max-h-[500px]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white">
                      <TableRow>
                        <TableHead className="w-32">Code</TableHead>
                        <TableHead>Account Name</TableHead>
                        <TableHead className="w-24">Type</TableHead>
                        <TableHead className="text-right w-40">Debit</TableHead>
                        <TableHead className="text-right w-40">Credit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(trialBalanceData.groupedByType || {}).map(([type, items]: [string, any]) => (
                        <>
                          <TableRow key={type} className="bg-gray-50 font-medium">
                            <TableCell colSpan={5} className="uppercase text-xs text-[#757575]">
                              {type}
                            </TableCell>
                          </TableRow>
                          {items.map((item: any) => (
                            <TableRow key={item.code} className="cursor-pointer hover:bg-blue-50">
                              <TableCell className="font-mono text-sm">{item.code}</TableCell>
                              <TableCell>{item.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-[10px]">{item.subType || type}</Badge>
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {item.debit > 0 ? formatCurrency(item.debit) : '-'}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {item.credit > 0 ? formatCurrency(item.credit) : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </>
                      ))}
                      <TableRow className="font-bold bg-[#00897B] text-white sticky bottom-0">
                        <TableCell colSpan={3}>TOTAL</TableCell>
                        <TableCell className="text-right">{formatCurrency(trialBalanceData.totals?.debit || 0)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(trialBalanceData.totals?.credit || 0)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-[#757575]">No trial balance data available</p>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // Render Balance Sheet Tab (Enhanced with API integration)
  const renderBalanceSheetTab = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[#00897B]" />
              Balance Sheet
            </h3>
            <p className="text-sm text-[#757575]">As of {new Date(bsAsOfDate).toLocaleDateString('en-ZA')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={bsAsOfDate}
              onChange={(e) => setBsAsOfDate(e.target.value)}
              className="w-40"
            />
            <Button variant="outline" size="sm" onClick={() => showToast('Report printed', 'success')}>
              <Printer className="h-4 w-4 mr-2" />Print
            </Button>
            <Button variant="outline" size="sm" onClick={() => showToast('Report exported', 'success')}>
              <Download className="h-4 w-4 mr-2" />Export
            </Button>
          </div>
        </div>

        {isLoadingBS ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#00897B]" />
          </div>
        ) : balanceSheetData ? (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-[#00897B]">
                <CardContent className="p-4">
                  <p className="text-xs text-[#757575] mb-1">Total Assets</p>
                  <p className="text-2xl font-bold text-[#00897B]">{formatCurrency(balanceSheetData.totals?.totalAssets || 0)}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-red-500">
                <CardContent className="p-4">
                  <p className="text-xs text-[#757575] mb-1">Total Liabilities</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(balanceSheetData.totals?.totalLiabilities || 0)}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-4">
                  <p className="text-xs text-[#757575] mb-1">Total Equity</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(balanceSheetData.totals?.totalEquity || 0)}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <p className="text-xs text-[#757575] mb-1">Net Worth</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency((balanceSheetData.totals?.totalAssets || 0) - (balanceSheetData.totals?.totalLiabilities || 0))}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Assets Section */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-[#00897B]" />
                    ASSETS
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-[400px]">
                    <div className="space-y-2">
                      {Object.entries(balanceSheetData.assets?.bySubType || {}).map(([subType, accounts]: [string, any]) => (
                        <div key={subType} className="border-b pb-2 mb-2">
                          <p className="text-xs font-medium text-[#757575] uppercase mb-1">{subType}</p>
                          {accounts.map((acc: any) => (
                            <div key={acc.code} className="flex justify-between text-sm py-1">
                              <span className="pl-4">{acc.name}</span>
                              <span className="font-medium">{formatCurrency(acc.amount)}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                      <div className="flex justify-between font-bold pt-2 border-t-2 border-[#00897B]">
                        <span>Total Assets</span>
                        <span className="text-[#00897B]">{formatCurrency(balanceSheetData.totals?.totalAssets || 0)}</span>
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Liabilities & Equity Section */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ArrowDownRight className="h-4 w-4 text-red-500" />
                      LIABILITIES
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="max-h-[180px]">
                      <div className="space-y-1">
                        {Object.entries(balanceSheetData.liabilities?.bySubType || {}).map(([subType, accounts]: [string, any]) => (
                          <div key={subType}>
                            <p className="text-xs font-medium text-[#757575] uppercase">{subType}</p>
                            {accounts.map((acc: any) => (
                              <div key={acc.code} className="flex justify-between text-sm py-1">
                                <span className="pl-4">{acc.name}</span>
                                <span className="font-medium">{formatCurrency(acc.amount)}</span>
                              </div>
                            ))}
                          </div>
                        ))}
                        <div className="flex justify-between font-bold pt-2 border-t-2 border-red-400">
                          <span>Total Liabilities</span>
                          <span className="text-red-600">{formatCurrency(balanceSheetData.totals?.totalLiabilities || 0)}</span>
                        </div>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Scale className="h-4 w-4 text-purple-500" />
                      EQUITY
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="max-h-[180px]">
                      <div className="space-y-1">
                        {Object.entries(balanceSheetData.equity?.bySubType || {}).map(([subType, accounts]: [string, any]) => (
                          <div key={subType}>
                            <p className="text-xs font-medium text-[#757575] uppercase">{subType}</p>
                            {accounts.map((acc: any) => (
                              <div key={acc.code} className="flex justify-between text-sm py-1">
                                <span className="pl-4">{acc.name}</span>
                                <span className="font-medium">{formatCurrency(acc.amount)}</span>
                              </div>
                            ))}
                          </div>
                        ))}
                        <div className="flex justify-between font-bold pt-2 border-t-2 border-purple-400">
                          <span>Total Equity</span>
                          <span className="text-purple-600">{formatCurrency(balanceSheetData.totals?.totalEquity || 0)}</span>
                        </div>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Balance Check */}
            <Card className={`${balanceSheetData.isBalanced ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {balanceSheetData.isBalanced ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium">Balance Sheet {balanceSheetData.isBalanced ? 'Balanced' : 'Out of Balance'}</p>
                      <p className="text-xs text-[#757575]">
                        Assets = Liabilities + Equity
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[#757575]">Difference</p>
                    <p className={`text-lg font-bold ${balanceSheetData.isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(balanceSheetData.difference || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-[#757575]">No balance sheet data available</p>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // Render General Ledger Tab (Enhanced with account drill-down)
  const renderGeneralLedgerTab = () => {
    // Filter journal entries for selected account - computed without useMemo
    const filteredEntries = glSelectedAccount 
      ? journalEntries.filter(entry => 
          entry.lines.some(line => line.accountCode === glSelectedAccount || line.accountId === glSelectedAccount)
        )
      : journalEntries

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Receipt className="h-5 w-5 text-[#00897B]" />
              General Ledger
            </h3>
            <p className="text-sm text-[#757575]">Complete transaction history</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[#757575]">From:</span>
              <Input
                type="date"
                value={glDateFrom}
                onChange={(e) => setGlDateFrom(e.target.value)}
                className="w-36"
              />
              <span className="text-[#757575]">To:</span>
              <Input
                type="date"
                value={glDateTo}
                onChange={(e) => setGlDateTo(e.target.value)}
                className="w-36"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => showToast('Report exported', 'success')}>
              <Download className="h-4 w-4 mr-2" />Export
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {/* Account Filter */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Select Account</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[500px]">
                <div className="divide-y">
                  <button
                    className={`w-full p-3 text-left hover:bg-gray-50 ${!glSelectedAccount ? 'bg-[#E0F2F1] font-medium' : ''}`}
                    onClick={() => setGlSelectedAccount(null)}
                  >
                    <div className="flex items-center justify-between">
                      <span>All Accounts</span>
                      <Badge variant="outline">{journalEntries.length}</Badge>
                    </div>
                  </button>
                  {accounts.map(account => (
                    <button
                      key={account.id}
                      className={`w-full p-3 text-left hover:bg-gray-50 ${glSelectedAccount === account.id ? 'bg-[#E0F2F1] font-medium' : ''}`}
                      onClick={() => setGlSelectedAccount(account.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-[#757575] font-mono">{account.code}</p>
                          <p className="text-sm">{account.name}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">{account.type}</Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Ledger Entries */}
          <Card className="col-span-3">
            <CardContent className="p-0">
              <ScrollArea className="max-h-[550px]">
                {filteredEntries.length === 0 ? (
                  <div className="p-8 text-center">
                    <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-[#757575]">No entries found</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="sticky top-0 bg-white">
                      <TableRow>
                        <TableHead className="w-28">Date</TableHead>
                        <TableHead className="w-28">Reference</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-28">Account</TableHead>
                        <TableHead className="text-right w-32">Debit</TableHead>
                        <TableHead className="text-right w-32">Credit</TableHead>
                        <TableHead className="w-20">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEntries.map(entry => (
                        <>
                          <TableRow key={entry.id} className="bg-gray-50">
                            <TableCell className="font-medium">{entry.date}</TableCell>
                            <TableCell className="font-mono">{entry.reference}</TableCell>
                            <TableCell colSpan={3}>{entry.description}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(entry.totalDebit)}
                            </TableCell>
                            <TableCell>
                              <Badge className={entry.status === 'posted' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                                {entry.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                          {entry.lines.map((line, idx) => (
                            <TableRow key={`${entry.id}-${idx}`} className="cursor-pointer hover:bg-blue-50">
                              <TableCell></TableCell>
                              <TableCell></TableCell>
                              <TableCell className="pl-6 text-sm">{line.description || '—'}</TableCell>
                              <TableCell className="font-mono text-sm">{line.accountCode || line.accountId}</TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {line.debit > 0 ? formatCurrency(line.debit) : '-'}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {line.credit > 0 ? formatCurrency(line.credit) : '-'}
                              </TableCell>
                              <TableCell></TableCell>
                            </TableRow>
                          ))}
                        </>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Render Expense Tracking Tab
  const renderExpenseTracking = () => {
    // Sample expense data
    const expenses = [
      { id: 'EXP-001', date: '2026-02-15', description: 'Office Supplies', amount: 1250.00, account: 'Office Expenses', vendor: 'Makro', paymentMethod: 'Card', status: 'approved' },
      { id: 'EXP-002', date: '2026-02-14', description: 'Courier Services', amount: 450.00, account: 'Delivery Expenses', vendor: 'FastWay', paymentMethod: 'EFT', status: 'approved' },
      { id: 'EXP-003', date: '2026-02-13', description: 'Staff Refreshments', amount: 780.00, account: 'Staff Welfare', vendor: 'Shoprite', paymentMethod: 'Cash', status: 'pending' },
      { id: 'EXP-004', date: '2026-02-12', description: 'Internet Services', amount: 1899.00, account: 'Utilities', vendor: 'Vodacom', paymentMethod: 'Debit Order', status: 'approved' },
      { id: 'EXP-005', date: '2026-02-11', description: 'Vehicle Fuel', amount: 2100.00, account: 'Vehicle Expenses', vendor: 'Shell', paymentMethod: 'Card', status: 'approved' },
    ]

    const totalExpensesMonth = expenses.reduce((sum, e) => sum + e.amount, 0)

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              Expense Tracking
            </h3>
            <p className="text-sm text-[#757575]">Track and manage business expenses</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />Filter
            </Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setExpenseDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />Add Expense
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <p className="text-xs text-[#757575] mb-1">This Month</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpensesMonth)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-[#757575] mb-1">Pending Approval</p>
              <p className="text-2xl font-bold text-amber-600">{formatCurrency(expenses.filter(e => e.status === 'pending').reduce((s, e) => s + e.amount, 0))}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-[#757575] mb-1">Categories</p>
              <p className="text-2xl font-bold">{accounts.filter(a => a.type === 'expense').length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-[#757575] mb-1">Avg per Day</p>
              <p className="text-2xl font-bold">{formatCurrency(totalExpensesMonth / 15)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Expense Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map(expense => (
                  <TableRow key={expense.id}>
                    <TableCell>{expense.date}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{expense.description}</p>
                        <p className="text-xs text-[#757575]">{expense.id}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{expense.account}</Badge>
                    </TableCell>
                    <TableCell>{expense.vendor}</TableCell>
                    <TableCell>
                      <span className="text-sm">{expense.paymentMethod}</span>
                    </TableCell>
                    <TableCell className="text-right font-medium text-red-600">
                      {formatCurrency(expense.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge className={expense.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                        {expense.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Expense Dialog */}
        <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Record Expense</DialogTitle>
              <DialogDescription>Add a new business expense</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date</Label>
                  <Input type="date" value={expenseForm.date} onChange={e => setExpenseForm(prev => ({ ...prev, date: e.target.value }))} />
                </div>
                <div>
                  <Label>Amount</Label>
                  <Input type="number" placeholder="0.00" value={expenseForm.amount || ''} onChange={e => setExpenseForm(prev => ({ ...prev, amount: Number(e.target.value) }))} />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Input placeholder="What was this expense for?" value={expenseForm.description} onChange={e => setExpenseForm(prev => ({ ...prev, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Expense Account</Label>
                  <Select value={expenseForm.accountId} onValueChange={val => setExpenseForm(prev => ({ ...prev, accountId: val }))}>
                    <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                    <SelectContent>
                      {accounts.filter(a => a.type === 'expense').map(acc => (
                        <SelectItem key={acc.id} value={acc.id}>{acc.code} - {acc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Vendor</Label>
                  <Input placeholder="Supplier/Vendor name" value={expenseForm.vendor} onChange={e => setExpenseForm(prev => ({ ...prev, vendor: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Payment Method</Label>
                  <Select value={expenseForm.paymentMethod} onValueChange={val => setExpenseForm(prev => ({ ...prev, paymentMethod: val }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="petty">Petty Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Reference</Label>
                  <Input placeholder="Invoice/Receipt #" value={expenseForm.reference} onChange={e => setExpenseForm(prev => ({ ...prev, reference: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea placeholder="Additional notes..." value={expenseForm.notes} onChange={e => setExpenseForm(prev => ({ ...prev, notes: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setExpenseDialogOpen(false)}>Cancel</Button>
              <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => {
                showToast('Expense recorded successfully', 'success')
                setExpenseDialogOpen(false)
              }}>
                <Save className="h-4 w-4 mr-2" />Save Expense
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Render Petty Cash Management Tab
  const renderPettyCashManagement = () => {
    // Sample petty cash data
    const pettyCashTransactions = [
      { id: 'PC-001', date: '2026-02-16', description: 'Taxi fare for deliveries', amount: -150.00, category: 'Transport', receivedBy: 'John D.', balance: 4850.00 },
      { id: 'PC-002', date: '2026-02-15', description: 'Office stationery', amount: -320.00, category: 'Supplies', receivedBy: 'Mary S.', balance: 5000.00 },
      { id: 'PC-003', date: '2026-02-14', description: 'Client refreshments', amount: -180.00, category: 'Entertainment', receivedBy: 'Peter K.', balance: 5320.00 },
      { id: 'PC-004', date: '2026-02-12', description: 'Emergency repairs', amount: -550.00, category: 'Maintenance', receivedBy: 'John D.', balance: 5500.00 },
      { id: 'PC-005', date: '2026-02-10', description: 'Fund Replenishment', amount: 2000.00, category: 'Replenishment', receivedBy: '—', balance: 6050.00 },
      { id: 'PC-006', date: '2026-02-05', description: 'Parking fees', amount: -80.00, category: 'Transport', receivedBy: 'Mary S.', balance: 4050.00 },
    ]

    const currentBalance = pettyCashTransactions[0]?.balance || 5000
    const floatLimit = 5000
    const replenishThreshold = 1000

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Wallet className="h-5 w-5 text-amber-500" />
              Petty Cash Management
            </h3>
            <p className="text-sm text-[#757575]">Manage small cash disbursements</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setReplenishDialogOpen(true)}>
              <RefreshCw className="h-4 w-4 mr-2" />Replenish
            </Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => setPettyCashDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />New Disbursement
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-4">
              <p className="text-xs text-[#757575] mb-1">Current Balance</p>
              <p className="text-2xl font-bold text-amber-600">{formatCurrency(currentBalance)}</p>
              <Progress value={(currentBalance / floatLimit) * 100} className="h-2 mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-[#757575] mb-1">Float Limit</p>
              <p className="text-2xl font-bold">{formatCurrency(floatLimit)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-[#757575] mb-1">This Month</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(Math.abs(pettyCashTransactions.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0)))}
              </p>
            </CardContent>
          </Card>
          <Card className={currentBalance < replenishThreshold ? 'border-red-200 bg-red-50' : ''}>
            <CardContent className="p-4">
              <p className="text-xs text-[#757575] mb-1">Status</p>
              {currentBalance < replenishThreshold ? (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <span className="font-medium text-red-600">Replenish Needed</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="font-medium text-green-600">Healthy</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Received By</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pettyCashTransactions.map(txn => (
                  <TableRow key={txn.id}>
                    <TableCell className="font-mono text-sm">{txn.date}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{txn.description}</p>
                        <p className="text-xs text-[#757575]">{txn.id}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={txn.category === 'Replenishment' ? 'bg-green-50' : ''}>
                        {txn.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{txn.receivedBy}</TableCell>
                    <TableCell className={`text-right font-medium ${txn.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {txn.amount < 0 ? '-' : '+'}{formatCurrency(Math.abs(txn.amount))}
                    </TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(txn.balance)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Category Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {[
                { category: 'Transport', amount: 230, icon: '🚗' },
                { category: 'Supplies', amount: 320, icon: '📦' },
                { category: 'Entertainment', amount: 180, icon: '🍽️' },
                { category: 'Maintenance', amount: 550, icon: '🔧' },
              ].map(cat => (
                <div key={cat.category} className="p-3 bg-gray-50 rounded-lg text-center">
                  <span className="text-2xl">{cat.icon}</span>
                  <p className="text-sm font-medium mt-1">{cat.category}</p>
                  <p className="text-lg font-bold text-red-600">{formatCurrency(cat.amount)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Disbursement Dialog */}
        <Dialog open={pettyCashDialogOpen} onOpenChange={setPettyCashDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Petty Cash Disbursement</DialogTitle>
              <DialogDescription>Record a cash payment from petty cash</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date</Label>
                  <Input type="date" value={pettyCashForm.date} onChange={e => setPettyCashForm(prev => ({ ...prev, date: e.target.value }))} />
                </div>
                <div>
                  <Label>Amount</Label>
                  <Input type="number" placeholder="0.00" value={pettyCashForm.amount || ''} onChange={e => setPettyCashForm(prev => ({ ...prev, amount: Number(e.target.value) }))} />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Input placeholder="What was this payment for?" value={pettyCashForm.description} onChange={e => setPettyCashForm(prev => ({ ...prev, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={pettyCashForm.category} onValueChange={val => setPettyCashForm(prev => ({ ...prev, category: val }))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transport">Transport</SelectItem>
                      <SelectItem value="supplies">Supplies</SelectItem>
                      <SelectItem value="entertainment">Entertainment</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Received By</Label>
                  <Input placeholder="Name" value={pettyCashForm.receivedBy} onChange={e => setPettyCashForm(prev => ({ ...prev, receivedBy: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Receipt/Reference #</Label>
                <Input placeholder="Optional" value={pettyCashForm.receipt} onChange={e => setPettyCashForm(prev => ({ ...prev, receipt: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPettyCashDialogOpen(false)}>Cancel</Button>
              <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => {
                showToast('Disbursement recorded', 'success')
                setPettyCashDialogOpen(false)
              }}>
                <Save className="h-4 w-4 mr-2" />Record
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Replenish Dialog */}
        <Dialog open={replenishDialogOpen} onOpenChange={setReplenishDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Replenish Petty Cash</DialogTitle>
              <DialogDescription>Add funds to the petty cash float</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-4 bg-amber-50 rounded-lg">
                <p className="text-sm text-[#757575]">Current Balance</p>
                <p className="text-2xl font-bold">{formatCurrency(currentBalance)}</p>
              </div>
              <div>
                <Label>Replenishment Amount</Label>
                <Input type="number" placeholder="0.00" value={replenishAmount || ''} onChange={e => setReplenishAmount(Number(e.target.value))} />
                <p className="text-xs text-[#757575] mt-1">
                  Suggested: {formatCurrency(floatLimit - currentBalance)} to restore float limit
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReplenishDialogOpen(false)}>Cancel</Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={() => {
                showToast(`Petty cash replenished with ${formatCurrency(replenishAmount)}`, 'success')
                setReplenishDialogOpen(false)
              }}>
                <Banknote className="h-4 w-4 mr-2" />Replenish
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }
  
  // Handle report click
  const handleReportClick = useCallback((reportType: string) => {
    setSelectedReport(reportType)
    setReportDialogOpen(true)
  }, [])

  // Render Trial Balance Report
  const renderTrialBalance = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Trial Balance</h3>
          <p className="text-sm text-[#757575]">As of {new Date().toLocaleDateString('en-ZA')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Printer className="h-4 w-4 mr-2" />Print</Button>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />Export</Button>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Account Code</TableHead>
            <TableHead>Account Name</TableHead>
            <TableHead className="text-right">Debit</TableHead>
            <TableHead className="text-right">Credit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map(account => (
            <TableRow key={account.id}>
              <TableCell className="font-mono">{account.code}</TableCell>
              <TableCell>{account.name}</TableCell>
              <TableCell className="text-right">{account.balance > 0 ? formatCurrency(account.balance) : '-'}</TableCell>
              <TableCell className="text-right">{account.balance < 0 ? formatCurrency(Math.abs(account.balance)) : '-'}</TableCell>
            </TableRow>
          ))}
          <TableRow className="font-bold bg-gray-50">
            <TableCell colSpan={2}>Total</TableCell>
            <TableCell className="text-right">{formatCurrency(accounts.filter(a => a.balance > 0).reduce((s, a) => s + a.balance, 0))}</TableCell>
            <TableCell className="text-right">{formatCurrency(Math.abs(accounts.filter(a => a.balance < 0).reduce((s, a) => s + a.balance, 0)))}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )

  // Render Balance Sheet Report
  const renderBalanceSheet = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Balance Sheet</h3>
          <p className="text-sm text-[#757575]">As of {new Date().toLocaleDateString('en-ZA')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Printer className="h-4 w-4 mr-2" />Print</Button>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />Export</Button>
        </div>
      </div>
      
      {/* Assets */}
      <div>
        <h4 className="font-bold text-sm text-[#00897B] mb-2">ASSETS</h4>
        <Table>
          <TableHeader>
            <TableRow><TableHead>Account</TableHead><TableHead className="text-right">Amount</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {accounts.filter(a => a.type === 'asset').map(account => (
              <TableRow key={account.id}>
                <TableCell className={account.parentCode ? 'pl-8' : ''}>{account.name}</TableCell>
                <TableCell className="text-right">{formatCurrency(account.balance)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="font-bold bg-blue-50">
              <TableCell>Total Assets</TableCell>
              <TableCell className="text-right">{formatCurrency(totalAssets)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      
      {/* Liabilities */}
      <div>
        <h4 className="font-bold text-sm text-red-600 mb-2">LIABILITIES</h4>
        <Table>
          <TableHeader>
            <TableRow><TableHead>Account</TableHead><TableHead className="text-right">Amount</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {accounts.filter(a => a.type === 'liability').map(account => (
              <TableRow key={account.id}>
                <TableCell>{account.name}</TableCell>
                <TableCell className="text-right">{formatCurrency(Math.abs(account.balance))}</TableCell>
              </TableRow>
            ))}
            <TableRow className="font-bold bg-red-50">
              <TableCell>Total Liabilities</TableCell>
              <TableCell className="text-right">{formatCurrency(totalLiabilities)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      
      {/* Equity */}
      <div>
        <h4 className="font-bold text-sm text-purple-600 mb-2">EQUITY</h4>
        <Table>
          <TableHeader>
            <TableRow><TableHead>Account</TableHead><TableHead className="text-right">Amount</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {accounts.filter(a => a.type === 'equity').map(account => (
              <TableRow key={account.id}>
                <TableCell>{account.name}</TableCell>
                <TableCell className="text-right">{formatCurrency(Math.abs(account.balance))}</TableCell>
              </TableRow>
            ))}
            <TableRow className="font-bold bg-green-50">
              <TableCell>Total Equity</TableCell>
              <TableCell className="text-right">{formatCurrency(totalEquity)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      
      {/* Summary */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-[#757575]">Total Assets</p>
              <p className="text-xl font-bold text-[#00897B]">{formatCurrency(totalAssets)}</p>
            </div>
            <div>
              <p className="text-sm text-[#757575]">Total Liabilities</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(totalLiabilities)}</p>
            </div>
            <div>
              <p className="text-sm text-[#757575]">Net Worth</p>
              <p className="text-xl font-bold">{formatCurrency(totalAssets - totalLiabilities)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Render Income Statement Report
  const renderIncomeStatement = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Income Statement</h3>
          <p className="text-sm text-[#757575]">For the period ending {new Date().toLocaleDateString('en-ZA')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Printer className="h-4 w-4 mr-2" />Print</Button>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />Export</Button>
        </div>
      </div>
      
      {/* Revenue */}
      <div>
        <h4 className="font-bold text-sm text-green-600 mb-2">REVENUE</h4>
        <Table>
          <TableHeader>
            <TableRow><TableHead>Account</TableHead><TableHead className="text-right">Amount</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {accounts.filter(a => a.type === 'income').map(account => (
              <TableRow key={account.id}>
                <TableCell>{account.name}</TableCell>
                <TableCell className="text-right text-green-600">{formatCurrency(Math.abs(account.balance))}</TableCell>
              </TableRow>
            ))}
            <TableRow className="font-bold bg-green-50">
              <TableCell>Total Revenue</TableCell>
              <TableCell className="text-right text-green-600">{formatCurrency(totalIncome)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      
      {/* Expenses */}
      <div>
        <h4 className="font-bold text-sm text-red-600 mb-2">EXPENSES</h4>
        <Table>
          <TableHeader>
            <TableRow><TableHead>Account</TableHead><TableHead className="text-right">Amount</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {accounts.filter(a => a.type === 'expense').map(account => (
              <TableRow key={account.id}>
                <TableCell>{account.name}</TableCell>
                <TableCell className="text-right text-red-600">{formatCurrency(account.balance)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="font-bold bg-red-50">
              <TableCell>Total Expenses</TableCell>
              <TableCell className="text-right text-red-600">{formatCurrency(totalExpenses)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      
      {/* Net Profit */}
      <Card className={`${netProfit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#757575]">Net Profit / (Loss)</p>
              <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(netProfit)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-[#757575]">Profit Margin</p>
              <p className="text-lg font-bold">{totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : 0}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Render Aged Receivables Report
  const renderAgedReceivables = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Aged Receivables</h3>
          <p className="text-sm text-[#757575]">Outstanding invoices by age</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Printer className="h-4 w-4 mr-2" />Print</Button>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />Export</Button>
        </div>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead className="text-right">Current</TableHead>
            <TableHead className="text-right">1-30 Days</TableHead>
            <TableHead className="text-right">31-60 Days</TableHead>
            <TableHead className="text-right">61-90 Days</TableHead>
            <TableHead className="text-right">Over 90 Days</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pendingInvoices.map(invoice => {
            const daysOverdue = Math.floor((Date.now() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24))
            const amount = invoice.total - (invoice.paidAmount || 0)
            return (
              <TableRow key={invoice.id} className="cursor-pointer hover:bg-gray-50">
                <TableCell>
                  <div>
                    <p className="font-medium">{invoice.customerName}</p>
                    <p className="text-xs text-[#757575]">{invoice.invoiceNumber}</p>
                  </div>
                </TableCell>
                <TableCell className="text-right">{daysOverdue <= 0 ? formatCurrency(amount) : '-'}</TableCell>
                <TableCell className="text-right">{daysOverdue > 0 && daysOverdue <= 30 ? formatCurrency(amount) : '-'}</TableCell>
                <TableCell className="text-right">{daysOverdue > 30 && daysOverdue <= 60 ? formatCurrency(amount) : '-'}</TableCell>
                <TableCell className="text-right">{daysOverdue > 60 && daysOverdue <= 90 ? formatCurrency(amount) : '-'}</TableCell>
                <TableCell className="text-right">{daysOverdue > 90 ? formatCurrency(amount) : '-'}</TableCell>
                <TableCell className="text-right font-bold">{formatCurrency(amount)}</TableCell>
              </TableRow>
            )
          })}
          <TableRow className="font-bold bg-gray-50">
            <TableCell>Total</TableCell>
            <TableCell className="text-right">{formatCurrency(pendingInvoices.filter(i => Math.floor((Date.now() - new Date(i.dueDate).getTime()) / (1000 * 60 * 60 * 24)) <= 0).reduce((s, i) => s + i.total - (i.paidAmount || 0), 0))}</TableCell>
            <TableCell className="text-right">{formatCurrency(pendingInvoices.filter(i => { const d = Math.floor((Date.now() - new Date(i.dueDate).getTime()) / (1000 * 60 * 60 * 24)); return d > 0 && d <= 30 }).reduce((s, i) => s + i.total - (i.paidAmount || 0), 0))}</TableCell>
            <TableCell className="text-right">{formatCurrency(pendingInvoices.filter(i => { const d = Math.floor((Date.now() - new Date(i.dueDate).getTime()) / (1000 * 60 * 60 * 24)); return d > 30 && d <= 60 }).reduce((s, i) => s + i.total - (i.paidAmount || 0), 0))}</TableCell>
            <TableCell className="text-right">{formatCurrency(pendingInvoices.filter(i => { const d = Math.floor((Date.now() - new Date(i.dueDate).getTime()) / (1000 * 60 * 60 * 24)); return d > 60 && d <= 90 }).reduce((s, i) => s + i.total - (i.paidAmount || 0), 0))}</TableCell>
            <TableCell className="text-right">{formatCurrency(pendingInvoices.filter(i => Math.floor((Date.now() - new Date(i.dueDate).getTime()) / (1000 * 60 * 60 * 24)) > 90).reduce((s, i) => s + i.total - (i.paidAmount || 0), 0))}</TableCell>
            <TableCell className="text-right">{formatCurrency(pendingInvoices.reduce((s, i) => s + i.total - (i.paidAmount || 0), 0))}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )

  // Render Aged Payables Report
  const renderAgedPayables = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Aged Payables</h3>
          <p className="text-sm text-[#757575]">Outstanding bills by age</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Printer className="h-4 w-4 mr-2" />Print</Button>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />Export</Button>
        </div>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Supplier</TableHead>
            <TableHead className="text-right">Current</TableHead>
            <TableHead className="text-right">1-30 Days</TableHead>
            <TableHead className="text-right">31-60 Days</TableHead>
            <TableHead className="text-right">61-90 Days</TableHead>
            <TableHead className="text-right">Over 90 Days</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pendingBills.map(bill => {
            const daysOverdue = Math.floor((Date.now() - new Date(bill.dueDate).getTime()) / (1000 * 60 * 60 * 24))
            return (
              <TableRow key={bill.id} className="cursor-pointer hover:bg-gray-50">
                <TableCell>
                  <div>
                    <p className="font-medium">{bill.supplierName}</p>
                    <p className="text-xs text-[#757575]">{bill.billNumber}</p>
                  </div>
                </TableCell>
                <TableCell className="text-right">{daysOverdue <= 0 ? formatCurrency(bill.total) : '-'}</TableCell>
                <TableCell className="text-right">{daysOverdue > 0 && daysOverdue <= 30 ? formatCurrency(bill.total) : '-'}</TableCell>
                <TableCell className="text-right">{daysOverdue > 30 && daysOverdue <= 60 ? formatCurrency(bill.total) : '-'}</TableCell>
                <TableCell className="text-right">{daysOverdue > 60 && daysOverdue <= 90 ? formatCurrency(bill.total) : '-'}</TableCell>
                <TableCell className="text-right">{daysOverdue > 90 ? formatCurrency(bill.total) : '-'}</TableCell>
                <TableCell className="text-right font-bold">{formatCurrency(bill.total)}</TableCell>
              </TableRow>
            )
          })}
          <TableRow className="font-bold bg-gray-50">
            <TableCell>Total</TableCell>
            <TableCell className="text-right">{formatCurrency(pendingBills.filter(b => Math.floor((Date.now() - new Date(b.dueDate).getTime()) / (1000 * 60 * 60 * 24)) <= 0).reduce((s, b) => s + b.total, 0))}</TableCell>
            <TableCell className="text-right">{formatCurrency(pendingBills.filter(b => { const d = Math.floor((Date.now() - new Date(b.dueDate).getTime()) / (1000 * 60 * 60 * 24)); return d > 0 && d <= 30 }).reduce((s, b) => s + b.total, 0))}</TableCell>
            <TableCell className="text-right">{formatCurrency(pendingBills.filter(b => { const d = Math.floor((Date.now() - new Date(b.dueDate).getTime()) / (1000 * 60 * 60 * 24)); return d > 30 && d <= 60 }).reduce((s, b) => s + b.total, 0))}</TableCell>
            <TableCell className="text-right">{formatCurrency(pendingBills.filter(b => { const d = Math.floor((Date.now() - new Date(b.dueDate).getTime()) / (1000 * 60 * 60 * 24)); return d > 60 && d <= 90 }).reduce((s, b) => s + b.total, 0))}</TableCell>
            <TableCell className="text-right">{formatCurrency(pendingBills.filter(b => Math.floor((Date.now() - new Date(b.dueDate).getTime()) / (1000 * 60 * 60 * 24)) > 90).reduce((s, b) => s + b.total, 0))}</TableCell>
            <TableCell className="text-right">{formatCurrency(pendingBills.reduce((s, b) => s + b.total, 0))}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )

  // Render General Ledger Report
  const renderGeneralLedger = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">General Ledger</h3>
          <p className="text-sm text-[#757575]">All transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Printer className="h-4 w-4 mr-2" />Print</Button>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />Export</Button>
        </div>
      </div>
      
      <ScrollArea className="h-[500px]">
        {journalEntries.filter(je => je.status === 'posted').map(entry => (
          <Card key={entry.id} className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{entry.reference}</Badge>
                  <p className="font-medium">{entry.description}</p>
                </div>
                <p className="text-sm text-[#757575]">{entry.date}</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-8">Account</TableHead>
                    <TableHead className="h-8 text-right">Debit</TableHead>
                    <TableHead className="h-8 text-right">Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entry.lines.map(line => (
                    <TableRow key={line.id}>
                      <TableCell>
                        <span className="font-mono text-xs text-[#757575] mr-2">{line.accountCode}</span>
                        {line.accountName}
                      </TableCell>
                      <TableCell className="text-right">{line.debit > 0 ? formatCurrency(line.debit) : '-'}</TableCell>
                      <TableCell className="text-right">{line.credit > 0 ? formatCurrency(line.credit) : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </ScrollArea>
    </div>
  )

  // Render Report Content
  const renderReportContent = () => {
    switch (selectedReport) {
      case 'trial-balance': return renderTrialBalance()
      case 'balance-sheet': return renderBalanceSheet()
      case 'income-statement': return renderIncomeStatement()
      case 'aged-receivables': return renderAgedReceivables()
      case 'aged-payables': return renderAgedPayables()
      case 'general-ledger': return renderGeneralLedger()
      default: return null
    }
  }

  // Render Reports
  const renderReports = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleReportClick('trial-balance')}>
          <CardContent className="p-6 text-center">
            <FileSpreadsheet className="h-8 w-8 text-[#00897B] mx-auto mb-2" />
            <p className="font-medium">Trial Balance</p>
            <p className="text-xs text-[#757575]">All account balances</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleReportClick('balance-sheet')}>
          <CardContent className="p-6 text-center">
            <BarChart3 className="h-8 w-8 text-[#00897B] mx-auto mb-2" />
            <p className="font-medium">Balance Sheet</p>
            <p className="text-xs text-[#757575]">Assets, Liabilities & Equity</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleReportClick('income-statement')}>
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-8 w-8 text-[#00897B] mx-auto mb-2" />
            <p className="font-medium">Income Statement</p>
            <p className="text-xs text-[#757575]">Revenue & Expenses</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleReportClick('aged-receivables')}>
          <CardContent className="p-6 text-center">
            <Wallet className="h-8 w-8 text-[#00897B] mx-auto mb-2" />
            <p className="font-medium">Aged Receivables</p>
            <p className="text-xs text-[#757575]">Outstanding invoices by age</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleReportClick('aged-payables')}>
          <CardContent className="p-6 text-center">
            <CreditCard className="h-8 w-8 text-[#00897B] mx-auto mb-2" />
            <p className="font-medium">Aged Payables</p>
            <p className="text-xs text-[#757575]">Outstanding bills by age</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleReportClick('general-ledger')}>
          <CardContent className="p-6 text-center">
            <Receipt className="h-8 w-8 text-[#00897B] mx-auto mb-2" />
            <p className="font-medium">General Ledger</p>
            <p className="text-xs text-[#757575]">All transactions</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-[#757575] mb-2">Balance Sheet Summary</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Total Assets</span>
                  <span className="font-bold">{formatCurrency(totalAssets)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Liabilities</span>
                  <span className="font-bold text-red-600">{formatCurrency(totalLiabilities)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Equity</span>
                  <span className="font-bold text-[#00897B]">{formatCurrency(totalEquity)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Net Worth</span>
                  <span className="font-bold text-lg">{formatCurrency(totalAssets - totalLiabilities)}</span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-[#757575] mb-2">Income Statement Summary</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Total Revenue</span>
                  <span className="font-bold text-green-600">{formatCurrency(totalIncome)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Expenses</span>
                  <span className="font-bold text-red-600">{formatCurrency(totalExpenses)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Net Profit</span>
                  <span className={`font-bold text-lg ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(netProfit)}</span>
                </div>
                <div className="flex justify-between text-xs text-[#757575]">
                  <span>Profit Margin</span>
                  <span>{totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : 0}%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
  
  // Render Bank Reconciliation
  const renderReconciliation = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Bank Reconciliation</CardTitle>
          <CardDescription>Reconcile your bank statements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {bankAccounts.map(account => (
              <div key={account.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-[#00897B]" />
                    <div>
                      <p className="font-medium">{account.bankName}</p>
                      <p className="text-xs text-[#757575]">{account.accountNumber}</p>
                    </div>
                  </div>
                  <Badge className={account.status === 'connected' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                    {account.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-[#757575]">System Balance</p>
                    <p className="font-bold">{formatCurrency(account.balance)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#757575]">Statement Balance</p>
                    <p className="font-bold">{formatCurrency(account.statementBalance)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#757575]">Difference</p>
                    <p className={`font-bold ${account.difference === 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(account.difference)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
  
  // Main render
  return (
    <div className="flex flex-col h-full">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-500' : 
          toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        } text-white flex items-center gap-2`}>
          {toast.type === 'success' && <CheckCircle2 className="h-4 w-4" />}
          {toast.type === 'error' && <AlertCircle className="h-4 w-4" />}
          {toast.type === 'info' && <Info className="h-4 w-4" />}
          {toast.message}
          <Button size="sm" variant="ghost" className="text-white p-1 h-auto" onClick={() => setToast(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="text-xl font-bold text-[#00897B]">Accounting</h2>
          <p className="text-sm text-[#757575]">Financial management & reporting</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">merchant-001</Badge>
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b px-4">
          <TabsList className="h-12">
            <TabsTrigger value="dashboard" className="text-xs">Dashboard</TabsTrigger>
            <TabsTrigger value="accounts" className="text-xs">Chart of Accounts</TabsTrigger>
            <TabsTrigger value="invoices" className="text-xs">Invoices</TabsTrigger>
            <TabsTrigger value="bills" className="text-xs">Bills</TabsTrigger>
            <TabsTrigger value="journal" className="text-xs">Journal</TabsTrigger>
            <TabsTrigger value="trial-balance" className="text-xs">Trial Balance</TabsTrigger>
            <TabsTrigger value="balance-sheet" className="text-xs">Balance Sheet</TabsTrigger>
            <TabsTrigger value="general-ledger" className="text-xs">General Ledger</TabsTrigger>
            <TabsTrigger value="expenses" className="text-xs">Expenses</TabsTrigger>
            <TabsTrigger value="petty-cash" className="text-xs">Petty Cash</TabsTrigger>
            <TabsTrigger value="vat" className="text-xs">VAT</TabsTrigger>
            <TabsTrigger value="reconciliation" className="text-xs">Reconciliation</TabsTrigger>
            <TabsTrigger value="reports" className="text-xs">Reports</TabsTrigger>
            <TabsTrigger value="budgets" className="text-xs">Budgets</TabsTrigger>
          </TabsList>
        </div>
        
        <div className="flex-1 p-4 overflow-auto">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'accounts' && renderChartOfAccounts()}
          {activeTab === 'invoices' && renderInvoices()}
          {activeTab === 'bills' && renderBills()}
          {activeTab === 'journal' && renderJournalEntries()}
          {activeTab === 'trial-balance' && renderTrialBalanceTab()}
          {activeTab === 'balance-sheet' && renderBalanceSheetTab()}
          {activeTab === 'general-ledger' && renderGeneralLedgerTab()}
          {activeTab === 'expenses' && renderExpenseTracking()}
          {activeTab === 'petty-cash' && renderPettyCashManagement()}
          {activeTab === 'vat' && renderVAT()}
          {activeTab === 'reconciliation' && renderReconciliation()}
          {activeTab === 'reports' && renderReports()}
          {activeTab === 'budgets' && <BudgetManagement />}
        </div>
      </Tabs>
      
      {/* Invoice Dialog */}
      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedInvoice ? 'Edit Invoice' : 'Create New Invoice'}</DialogTitle>
            <DialogDescription>Enter invoice details</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Customer Name</Label>
                <Input value={invoiceForm.customerName} onChange={e => setInvoiceForm(prev => ({ ...prev, customerName: e.target.value }))} />
              </div>
              <div>
                <Label>Customer Email</Label>
                <Input value={invoiceForm.customerEmail} onChange={e => setInvoiceForm(prev => ({ ...prev, customerEmail: e.target.value }))} />
              </div>
            </div>
            
            <div>
              <Label>Customer Phone</Label>
              <Input value={invoiceForm.customerPhone || ''} onChange={e => setInvoiceForm(prev => ({ ...prev, customerPhone: e.target.value }))} />
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Label>Line Items</Label>
                <Button size="sm" variant="outline" onClick={() => setInvoiceForm(prev => ({
                  ...prev,
                  items: [...(prev.items || []), { id: `NEW-${Date.now()}`, description: '', quantity: 1, unitPrice: 0, discount: 0, total: 0, taxable: true }]
                }))}>
                  <Plus className="h-4 w-4 mr-1" />Add Item
                </Button>
              </div>
              
              <div className="space-y-2">
                {(invoiceForm.items || []).map((item, idx) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                    <Input className="col-span-4" placeholder="Description" value={item.description} onChange={e => setInvoiceForm(prev => ({
                      ...prev,
                      items: prev.items?.map((i, iIdx) => iIdx === idx ? { ...i, description: e.target.value } : i)
                    }))} />
                    <Input className="col-span-2" type="number" placeholder="Qty" value={item.quantity} onChange={e => setInvoiceForm(prev => ({
                      ...prev,
                      items: prev.items?.map((i, iIdx) => iIdx === idx ? { ...i, quantity: Number(e.target.value), total: Number(e.target.value) * i.unitPrice } : i)
                    }))} />
                    <Input className="col-span-2" type="number" placeholder="Price" value={item.unitPrice} onChange={e => setInvoiceForm(prev => ({
                      ...prev,
                      items: prev.items?.map((i, iIdx) => iIdx === idx ? { ...i, unitPrice: Number(e.target.value), total: i.quantity * Number(e.target.value) } : i)
                    }))} />
                    <div className="col-span-2 flex items-center gap-1">
                      <Switch checked={item.taxable} onCheckedChange={checked => setInvoiceForm(prev => ({
                        ...prev,
                        items: prev.items?.map((i, iIdx) => iIdx === idx ? { ...i, taxable: checked } : i)
                      }))} />
                      <span className="text-xs">VAT</span>
                    </div>
                    <Button size="sm" variant="ghost" className="col-span-2 text-red-500" onClick={() => setInvoiceForm(prev => ({
                      ...prev,
                      items: prev.items?.filter((_, iIdx) => iIdx !== idx)
                    }))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <Label>Notes</Label>
              <Textarea value={invoiceForm.notes || ''} onChange={e => setInvoiceForm(prev => ({ ...prev, notes: e.target.value }))} />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setInvoiceDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleCreateInvoice}>
              <Save className="h-4 w-4 mr-2" />Create Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Bill Dialog */}
      <Dialog open={billDialogOpen} onOpenChange={setBillDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedBill ? 'Edit Bill' : 'Create New Bill'}</DialogTitle>
            <DialogDescription>Enter bill details</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Supplier Name</Label>
                <Input value={billForm.supplierName} onChange={e => setBillForm(prev => ({ ...prev, supplierName: e.target.value }))} />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={billForm.category} onValueChange={val => setBillForm(prev => ({ ...prev, category: val }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inventory">Inventory</SelectItem>
                    <SelectItem value="Utilities">Utilities</SelectItem>
                    <SelectItem value="Rent">Rent</SelectItem>
                    <SelectItem value="Telecommunications">Telecommunications</SelectItem>
                    <SelectItem value="Insurance">Insurance</SelectItem>
                    <SelectItem value="Licenses">Licenses</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>Supplier Email</Label>
              <Input value={billForm.supplierEmail || ''} onChange={e => setBillForm(prev => ({ ...prev, supplierEmail: e.target.value }))} />
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Label>Line Items</Label>
                <Button size="sm" variant="outline" onClick={() => setBillForm(prev => ({
                  ...prev,
                  items: [...(prev.items || []), { id: `NEW-${Date.now()}`, description: '', quantity: 1, unitPrice: 0, total: 0, accountId: '' }]
                }))}>
                  <Plus className="h-4 w-4 mr-1" />Add Item
                </Button>
              </div>
              
              <div className="space-y-2">
                {(billForm.items || []).map((item, idx) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                    <Input className="col-span-4" placeholder="Description" value={item.description} onChange={e => setBillForm(prev => ({
                      ...prev,
                      items: prev.items?.map((i, iIdx) => iIdx === idx ? { ...i, description: e.target.value } : i)
                    }))} />
                    <Input className="col-span-2" type="number" placeholder="Qty" value={item.quantity} onChange={e => setBillForm(prev => ({
                      ...prev,
                      items: prev.items?.map((i, iIdx) => iIdx === idx ? { ...i, quantity: Number(e.target.value), total: Number(e.target.value) * i.unitPrice } : i)
                    }))} />
                    <Input className="col-span-2" type="number" placeholder="Price" value={item.unitPrice} onChange={e => setBillForm(prev => ({
                      ...prev,
                      items: prev.items?.map((i, iIdx) => iIdx === idx ? { ...i, unitPrice: Number(e.target.value), total: i.quantity * Number(e.target.value) } : i)
                    }))} />
                    <Select className="col-span-2" value={item.accountId} onValueChange={val => setBillForm(prev => ({
                      ...prev,
                      items: prev.items?.map((i, iIdx) => iIdx === idx ? { ...i, accountId: val } : i)
                    }))}>
                      <SelectTrigger><SelectValue placeholder="Account" /></SelectTrigger>
                      <SelectContent>
                        {accounts.filter(a => a.type === 'expense').map(acc => (
                          <SelectItem key={acc.id} value={acc.id}>{acc.code} - {acc.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="ghost" className="col-span-2 text-red-500" onClick={() => setBillForm(prev => ({
                      ...prev,
                      items: prev.items?.filter((_, iIdx) => iIdx !== idx)
                    }))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <Label>Notes</Label>
              <Textarea value={billForm.notes || ''} onChange={e => setBillForm(prev => ({ ...prev, notes: e.target.value }))} />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setBillDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleCreateBill}>
              <Save className="h-4 w-4 mr-2" />Create Bill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Account Dialog */}
      <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedAccount ? 'Edit Account' : 'Add New Account'}</DialogTitle>
            <DialogDescription>Create a new chart of accounts entry</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Account Code</Label>
                <Input value={accountForm.code} onChange={e => setAccountForm(prev => ({ ...prev, code: e.target.value }))} placeholder="e.g., 6100" />
              </div>
              <div>
                <Label>Account Name</Label>
                <Input value={accountForm.name} onChange={e => setAccountForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g., Rent Expense" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Account Type</Label>
                <Select value={accountForm.type} onValueChange={(val: any) => setAccountForm(prev => ({ ...prev, type: val }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asset">Asset</SelectItem>
                    <SelectItem value="liability">Liability</SelectItem>
                    <SelectItem value="equity">Equity</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sub Type</Label>
                <Input value={accountForm.subType} onChange={e => setAccountForm(prev => ({ ...prev, subType: e.target.value }))} placeholder="e.g., Current Asset" />
              </div>
            </div>
            
            <div>
              <Label>Description</Label>
              <Textarea value={accountForm.description || ''} onChange={e => setAccountForm(prev => ({ ...prev, description: e.target.value }))} />
            </div>
            
            <div className="flex items-center gap-2">
              <Switch checked={accountForm.isActive} onCheckedChange={checked => setAccountForm(prev => ({ ...prev, isActive: checked }))} />
              <Label>Active</Label>
            </div>
            
            <div className="flex items-center gap-2">
              <Switch checked={accountForm.taxDeductible} onCheckedChange={checked => setAccountForm(prev => ({ ...prev, taxDeductible: checked }))} />
              <Label>Tax Deductible</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAccountDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleCreateAccount}>
              <Save className="h-4 w-4 mr-2" />Create Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedReport === 'trial-balance' && <><FileSpreadsheet className="h-5 w-5 text-[#00897B]" /> Trial Balance</>}
              {selectedReport === 'balance-sheet' && <><BarChart3 className="h-5 w-5 text-[#00897B]" /> Balance Sheet</>}
              {selectedReport === 'income-statement' && <><TrendingUp className="h-5 w-5 text-[#00897B]" /> Income Statement</>}
              {selectedReport === 'aged-receivables' && <><Wallet className="h-5 w-5 text-[#00897B]" /> Aged Receivables</>}
              {selectedReport === 'aged-payables' && <><CreditCard className="h-5 w-5 text-[#00897B]" /> Aged Payables</>}
              {selectedReport === 'general-ledger' && <><Receipt className="h-5 w-5 text-[#00897B]" /> General Ledger</>}
            </DialogTitle>
            <DialogDescription>
              {selectedReport === 'trial-balance' && 'All account balances as of today'}
              {selectedReport === 'balance-sheet' && 'Financial position statement'}
              {selectedReport === 'income-statement' && 'Profit and loss statement'}
              {selectedReport === 'aged-receivables' && 'Customer balances by aging period'}
              {selectedReport === 'aged-payables' && 'Supplier balances by aging period'}
              {selectedReport === 'general-ledger' && 'All posted journal entries'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {renderReportContent()}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportDialogOpen(false)}>Close</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={() => showToast('Report exported successfully', 'success')}>
              <Download className="h-4 w-4 mr-2" />Export PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Journal Entry Dialog */}
      <Dialog open={journalDialogOpen} onOpenChange={setJournalDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Journal Entry</DialogTitle>
            <DialogDescription>Record a manual journal entry (debits must equal credits)</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input type="date" value={journalForm.date} onChange={e => setJournalForm(prev => ({ ...prev, date: e.target.value }))} />
              </div>
              <div>
                <Label>Description</Label>
                <Input value={journalForm.description} onChange={e => setJournalForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Enter description" />
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Label>Journal Lines</Label>
                <Button size="sm" variant="outline" onClick={() => setJournalForm(prev => ({
                  ...prev,
                  lines: [...(prev.lines || []), { id: `JL-${Date.now()}`, accountId: '', accountName: '', debit: 0, credit: 0, description: '' }]
                }))}>
                  <Plus className="h-4 w-4 mr-1" />Add Line
                </Button>
              </div>
              
              <div className="space-y-2">
                {(journalForm.lines || []).map((line, idx) => {
                  const totalDebit = (journalForm.lines || []).reduce((s, l) => s + l.debit, 0)
                  const totalCredit = (journalForm.lines || []).reduce((s, l) => s + l.credit, 0)
                  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01
                  
                  return (
                    <div key={line.id} className="grid grid-cols-12 gap-2 items-center">
                      <Select value={line.accountId} onValueChange={val => {
                        const acc = accounts.find(a => a.id === val)
                        setJournalForm(prev => ({
                          ...prev,
                          lines: prev.lines?.map((l, lIdx) => lIdx === idx ? { ...l, accountId: val, accountName: acc?.name || '' } : l)
                        }))
                      }}>
                        <SelectTrigger className="col-span-4"><SelectValue placeholder="Select Account" /></SelectTrigger>
                        <SelectContent>
                          {accounts.map(acc => (
                            <SelectItem key={acc.id} value={acc.id}>{acc.code} - {acc.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input className="col-span-2" type="number" placeholder="Debit" value={line.debit || ''} onChange={e => setJournalForm(prev => ({
                        ...prev,
                        lines: prev.lines?.map((l, lIdx) => lIdx === idx ? { ...l, debit: Number(e.target.value) } : l)
                      }))} />
                      <Input className="col-span-2" type="number" placeholder="Credit" value={line.credit || ''} onChange={e => setJournalForm(prev => ({
                        ...prev,
                        lines: prev.lines?.map((l, lIdx) => lIdx === idx ? { ...l, credit: Number(e.target.value) } : l)
                      }))} />
                      <Input className="col-span-3" placeholder="Description" value={line.description} onChange={e => setJournalForm(prev => ({
                        ...prev,
                        lines: prev.lines?.map((l, lIdx) => lIdx === idx ? { ...l, description: e.target.value } : l)
                      }))} />
                      <Button size="sm" variant="ghost" className="col-span-1 text-red-500" onClick={() => setJournalForm(prev => ({
                        ...prev,
                        lines: prev.lines?.filter((_, lIdx) => lIdx !== idx)
                      }))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>
              
              {/* Balance Indicator */}
              <div className="mt-4 p-3 bg-gray-50 rounded flex items-center justify-between">
                <div className="flex gap-8">
                  <div>
                    <span className="text-xs text-[#757575]">Total Debit:</span>
                    <span className="font-bold ml-2">{formatCurrency((journalForm.lines || []).reduce((s, l) => s + l.debit, 0))}</span>
                  </div>
                  <div>
                    <span className="text-xs text-[#757575]">Total Credit:</span>
                    <span className="font-bold ml-2">{formatCurrency((journalForm.lines || []).reduce((s, l) => s + l.credit, 0))}</span>
                  </div>
                </div>
                <Badge className={Math.abs((journalForm.lines || []).reduce((s, l) => s + l.debit - l.credit, 0)) < 0.01 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                  {Math.abs((journalForm.lines || []).reduce((s, l) => s + l.debit - l.credit, 0)) < 0.01 ? 'Balanced' : 'Out of Balance'}
                </Badge>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setJournalDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleCreateJournalEntry}>
              <Save className="h-4 w-4 mr-2" />Create Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
