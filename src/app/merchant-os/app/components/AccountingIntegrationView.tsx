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
import {
  Search,
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
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
  ChevronDown,
  ChevronRight,
  Printer,
  Mail,
  AlertTriangle,
  Info,
  Zap,
  Brain,
  LineChart,
  Activity,
  Minus,
  Hash,
  Package,
  Layers,
  Settings,
  Link2,
  Play,
  Pause,
  Settings2,
  Database,
  Wifi,
  WifiOff,
  ShoppingCart,
  ClipboardList,
} from 'lucide-react'

// Types
interface JournalEntryLine {
  id: string
  accountCode: string
  accountName: string
  debit: number
  credit: number
  description: string
}

interface JournalEntry {
  id: string
  date: string
  reference: string
  description: string
  eventType: 'stock_receipt' | 'stock_sale' | 'stock_adjustment' | 'stock_transfer' | 'stocktake_variance' | 'manual'
  lines: JournalEntryLine[]
  totalDebit: number
  totalCredit: number
  status: 'draft' | 'pending' | 'posted' | 'reversed'
  createdBy: string
  createdAt: string
  postedAt?: string
  reversedFrom?: string
  sourceReference?: string
}

interface COGSEntry {
  id: string
  date: string
  productId: string
  productName: string
  sku: string
  category: string
  quantity: number
  unitCost: number
  totalCost: number
  saleId?: string
  movementType: 'sale' | 'adjustment' | 'variance'
}

interface COGSSummary {
  category: string
  totalCost: number
  quantity: number
  percentage: number
}

interface VarianceRecord {
  id: string
  stocktakeId: string
  stocktakeDate: string
  productId: string
  productName: string
  sku: string
  category: string
  systemQty: number
  countedQty: number
  variance: number
  unitCost: number
  varianceValue: number
  status: 'pending' | 'approved' | 'rejected' | 'journal_created'
  approvedBy?: string
  approvedAt?: string
  journalEntryId?: string
  notes?: string
}

interface AccountMapping {
  id: string
  eventType: string
  eventTypeName: string
  debitAccountCode: string
  debitAccountName: string
  creditAccountCode: string
  creditAccountName: string
  vatApplicable: boolean
  vatCode?: string
  costCenter?: string
  isActive: boolean
}

interface Account {
  code: string
  name: string
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense'
  subType: string
}

interface InventoryValuePoint {
  date: string
  value: number
  change: number
  changePercent: number
}

interface IntegrationSettings {
  autoPostEnabled: boolean
  postFrequency: 'realtime' | 'hourly' | 'daily'
  lastSync: string
  connectionStatus: 'connected' | 'disconnected' | 'error'
  connectedSystem?: string
  trialBalanceSync: boolean
  syncInterval: number
}

// Standard SA Chart of Accounts for reference
const standardAccounts: Account[] = [
  // Assets
  { code: '1100', name: 'Inventory Asset', type: 'asset', subType: 'Current Asset' },
  { code: '1120', name: 'Work in Progress', type: 'asset', subType: 'Current Asset' },
  { code: '1400', name: 'VAT Input', type: 'asset', subType: 'Current Asset' },
  // Liabilities
  { code: '2100', name: 'Accounts Payable', type: 'liability', subType: 'Current Liability' },
  { code: '2120', name: 'GRN Clearing', type: 'liability', subType: 'Current Liability' },
  { code: '2400', name: 'VAT Payable', type: 'liability', subType: 'Current Liability' },
  { code: '2410', name: 'VAT Input', type: 'liability', subType: 'Current Liability' },
  { code: '2420', name: 'VAT Output', type: 'liability', subType: 'Current Liability' },
  // Income
  { code: '4000', name: 'Sales Revenue', type: 'income', subType: 'Operating Income' },
  { code: '4200', name: 'Inventory Adjustment Income', type: 'income', subType: 'Other Income' },
  // Expenses
  { code: '5000', name: 'Cost of Goods Sold', type: 'expense', subType: 'Cost of Sales' },
  { code: '5100', name: 'Inventory Adjustment', type: 'expense', subType: 'Operating Expense' },
  { code: '5110', name: 'Shrinkage Expense', type: 'expense', subType: 'Operating Expense' },
  { code: '5120', name: 'Inventory Loss', type: 'expense', subType: 'Operating Expense' },
  { code: '5200', name: 'Inventory Write-off', type: 'expense', subType: 'Operating Expense' },
]

// Default Account Mappings
const defaultAccountMappings: AccountMapping[] = [
  {
    id: 'MAP-001',
    eventType: 'stock_receipt',
    eventTypeName: 'Stock Receipt (GRN)',
    debitAccountCode: '1100',
    debitAccountName: 'Inventory Asset',
    creditAccountCode: '2120',
    creditAccountName: 'GRN Clearing',
    vatApplicable: true,
    vatCode: 'INPUT',
    isActive: true,
  },
  {
    id: 'MAP-002',
    eventType: 'stock_sale',
    eventTypeName: 'Stock Sale',
    debitAccountCode: '5000',
    debitAccountName: 'Cost of Goods Sold',
    creditAccountCode: '1100',
    creditAccountName: 'Inventory Asset',
    vatApplicable: false,
    isActive: true,
  },
  {
    id: 'MAP-003',
    eventType: 'stock_adjustment_pos',
    eventTypeName: 'Stock Adjustment (Positive)',
    debitAccountCode: '1100',
    debitAccountName: 'Inventory Asset',
    creditAccountCode: '4200',
    creditAccountName: 'Inventory Adjustment Income',
    vatApplicable: false,
    isActive: true,
  },
  {
    id: 'MAP-004',
    eventType: 'stock_adjustment_neg',
    eventTypeName: 'Stock Adjustment (Negative)',
    debitAccountCode: '5110',
    debitAccountName: 'Shrinkage Expense',
    creditAccountCode: '1100',
    creditAccountName: 'Inventory Asset',
    vatApplicable: false,
    isActive: true,
  },
  {
    id: 'MAP-005',
    eventType: 'stocktake_variance_pos',
    eventTypeName: 'Stocktake Variance (Positive)',
    debitAccountCode: '1100',
    debitAccountName: 'Inventory Asset',
    creditAccountCode: '4200',
    creditAccountName: 'Inventory Adjustment Income',
    vatApplicable: false,
    isActive: true,
  },
  {
    id: 'MAP-006',
    eventType: 'stocktake_variance_neg',
    eventTypeName: 'Stocktake Variance (Negative)',
    debitAccountCode: '5120',
    debitAccountName: 'Inventory Loss',
    creditAccountCode: '1100',
    creditAccountName: 'Inventory Asset',
    vatApplicable: false,
    isActive: true,
  },
  {
    id: 'MAP-007',
    eventType: 'stock_transfer',
    eventTypeName: 'Stock Transfer',
    debitAccountCode: '1100',
    debitAccountName: 'Inventory Asset (Destination)',
    creditAccountCode: '1100',
    creditAccountName: 'Inventory Asset (Source)',
    vatApplicable: false,
    isActive: true,
  },
]

// Generate mock journal entries
const generateJournalEntries = (): JournalEntry[] => [
  {
    id: 'JE-001',
    date: '2026-02-20',
    reference: 'JE-2026-001',
    description: 'Stock Receipt - GRN-2026-042 (GroSupply)',
    eventType: 'stock_receipt',
    lines: [
      { id: 'JEL-001', accountCode: '1100', accountName: 'Inventory Asset', debit: 15670.00, credit: 0, description: 'Stock received from GroSupply' },
      { id: 'JEL-002', accountCode: '2120', accountName: 'GRN Clearing', debit: 0, credit: 15670.00, description: 'Amount owed to GroSupply' },
    ],
    totalDebit: 15670.00,
    totalCredit: 15670.00,
    status: 'posted',
    createdBy: 'System',
    createdAt: '2026-02-20T09:30:00',
    postedAt: '2026-02-20T09:30:00',
    sourceReference: 'GRN-2026-042',
  },
  {
    id: 'JE-002',
    date: '2026-02-20',
    reference: 'JE-2026-002',
    description: 'COGS - Daily Sales (15 Feb 2026)',
    eventType: 'stock_sale',
    lines: [
      { id: 'JEL-003', accountCode: '5000', accountName: 'Cost of Goods Sold', debit: 8450.00, credit: 0, description: 'Cost of goods sold' },
      { id: 'JEL-004', accountCode: '1100', accountName: 'Inventory Asset', debit: 0, credit: 8450.00, description: 'Inventory reduction' },
    ],
    totalDebit: 8450.00,
    totalCredit: 8450.00,
    status: 'posted',
    createdBy: 'System',
    createdAt: '2026-02-20T18:00:00',
    postedAt: '2026-02-20T18:00:00',
    sourceReference: 'SALES-2026-0215',
  },
  {
    id: 'JE-003',
    date: '2026-02-19',
    reference: 'JE-2026-003',
    description: 'Stock Adjustment - Damaged goods',
    eventType: 'stock_adjustment',
    lines: [
      { id: 'JEL-005', accountCode: '5110', accountName: 'Shrinkage Expense', debit: 450.00, credit: 0, description: 'Damaged stock write-off' },
      { id: 'JEL-006', accountCode: '1100', accountName: 'Inventory Asset', debit: 0, credit: 450.00, description: 'Inventory reduction' },
    ],
    totalDebit: 450.00,
    totalCredit: 450.00,
    status: 'posted',
    createdBy: 'Thandi M.',
    createdAt: '2026-02-19T14:20:00',
    postedAt: '2026-02-19T14:20:00',
    sourceReference: 'ADJ-2026-008',
  },
  {
    id: 'JE-004',
    date: '2026-02-18',
    reference: 'JE-2026-004',
    description: 'Stocktake Variance - Monthly count',
    eventType: 'stocktake_variance',
    lines: [
      { id: 'JEL-007', accountCode: '5120', accountName: 'Inventory Loss', debit: 1250.00, credit: 0, description: 'Stocktake shortage' },
      { id: 'JEL-008', accountCode: '1100', accountName: 'Inventory Asset', debit: 0, credit: 1250.00, description: 'Inventory adjustment' },
    ],
    totalDebit: 1250.00,
    totalCredit: 1250.00,
    status: 'posted',
    createdBy: 'Sipho K.',
    createdAt: '2026-02-18T16:45:00',
    postedAt: '2026-02-18T16:45:00',
    sourceReference: 'ST-2026-002',
  },
  {
    id: 'JE-005',
    date: '2026-02-20',
    reference: 'JE-2026-005',
    description: 'Stock Receipt - GRN-2026-043 (Clover SA)',
    eventType: 'stock_receipt',
    lines: [
      { id: 'JEL-009', accountCode: '1100', accountName: 'Inventory Asset', debit: 8900.00, credit: 0, description: 'Dairy products received' },
      { id: 'JEL-010', accountCode: '2120', accountName: 'GRN Clearing', debit: 0, credit: 8900.00, description: 'Amount owed to Clover' },
    ],
    totalDebit: 8900.00,
    totalCredit: 8900.00,
    status: 'pending',
    createdBy: 'System',
    createdAt: '2026-02-20T11:00:00',
    sourceReference: 'GRN-2026-043',
  },
  {
    id: 'JE-006',
    date: '2026-02-20',
    reference: 'JE-2026-006',
    description: 'Inter-Branch Transfer - JHB to CPT',
    eventType: 'stock_transfer',
    lines: [
      { id: 'JEL-011', accountCode: '1100', accountName: 'Inventory Asset (CPT)', debit: 3500.00, credit: 0, description: 'Stock transferred to Cape Town' },
      { id: 'JEL-012', accountCode: '1100', accountName: 'Inventory Asset (JHB)', debit: 0, credit: 3500.00, description: 'Stock transferred from Johannesburg' },
    ],
    totalDebit: 3500.00,
    totalCredit: 3500.00,
    status: 'pending',
    createdBy: 'Maria L.',
    createdAt: '2026-02-20T13:00:00',
    sourceReference: 'TRF-2026-015',
  },
]

// Generate COGS data
const generateCOGSData = (): COGSEntry[] => {
  const products = [
    { name: 'Beef Patty (Frozen)', sku: 'ING-BP-001', category: 'Ingredients' },
    { name: 'Burger Buns (6-pack)', sku: 'ING-BB-001', category: 'Ingredients' },
    { name: 'Cheddar Cheese Slices', sku: 'ING-CS-001', category: 'Ingredients' },
    { name: 'Coca-Cola 500ml', sku: 'BEV-CC-001', category: 'Beverages' },
    { name: 'Chicken Wings (Frozen)', sku: 'CHK-WI-001', category: 'Chicken' },
  ]
  
  return Array.from({ length: 50 }, (_, i) => {
    const product = products[Math.floor(Math.random() * products.length)]
    const quantity = 5 + Math.floor(Math.random() * 50)
    const unitCost = 5 + Math.floor(Math.random() * 40)
    const types: COGSEntry['movementType'][] = ['sale', 'sale', 'sale', 'adjustment', 'variance']
    
    return {
      id: `COGS-${String(i + 1).padStart(6, '0')}`,
      date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
      productId: `PROD-${String(Math.floor(Math.random() * 20) + 1).padStart(4, '0')}`,
      productName: product.name,
      sku: product.sku,
      category: product.category,
      quantity,
      unitCost,
      totalCost: quantity * unitCost,
      saleId: `SALE-${Math.floor(Math.random() * 10000)}`,
      movementType: types[Math.floor(Math.random() * types.length)],
    }
  })
}

// Generate variance records
const generateVarianceRecords = (): VarianceRecord[] => [
  {
    id: 'VAR-001',
    stocktakeId: 'ST-2026-002',
    stocktakeDate: '2026-02-18',
    productId: 'PROD-0003',
    productName: 'Cheddar Cheese Slices',
    sku: 'ING-CS-001',
    category: 'Ingredients',
    systemQty: 45,
    countedQty: 38,
    variance: -7,
    unitCost: 5.20,
    varianceValue: -36.40,
    status: 'approved',
    approvedBy: 'Sipho K.',
    approvedAt: '2026-02-18T16:30:00',
    journalEntryId: 'JE-004',
    notes: 'Possible theft - reviewed CCTV',
  },
  {
    id: 'VAR-002',
    stocktakeId: 'ST-2026-002',
    stocktakeDate: '2026-02-18',
    productId: 'PROD-0001',
    productName: 'Beef Patty (Frozen)',
    sku: 'ING-BP-001',
    category: 'Ingredients',
    systemQty: 145,
    countedQty: 142,
    variance: -3,
    unitCost: 12.00,
    varianceValue: -36.00,
    status: 'approved',
    approvedBy: 'Sipho K.',
    approvedAt: '2026-02-18T16:35:00',
    journalEntryId: 'JE-004',
  },
  {
    id: 'VAR-003',
    stocktakeId: 'ST-2026-002',
    stocktakeDate: '2026-02-18',
    productId: 'PROD-0004',
    productName: 'Coca-Cola 500ml',
    sku: 'BEV-CC-001',
    category: 'Beverages',
    systemQty: 320,
    countedQty: 335,
    variance: 15,
    unitCost: 9.50,
    varianceValue: 142.50,
    status: 'approved',
    approvedBy: 'Sipho K.',
    approvedAt: '2026-02-18T16:40:00',
    journalEntryId: 'JE-004',
    notes: 'Found in back storage',
  },
  {
    id: 'VAR-004',
    stocktakeId: 'ST-2026-003',
    stocktakeDate: '2026-02-20',
    productId: 'PROD-0008',
    productName: 'Chicken Wings (Frozen)',
    sku: 'CHK-WI-001',
    category: 'Chicken',
    systemQty: 38,
    countedQty: 32,
    variance: -6,
    unitCost: 42.00,
    varianceValue: -252.00,
    status: 'pending',
    notes: 'Awaiting manager approval',
  },
  {
    id: 'VAR-005',
    stocktakeId: 'ST-2026-003',
    stocktakeDate: '2026-02-20',
    productId: 'PROD-0002',
    productName: 'Burger Buns (6-pack)',
    sku: 'ING-BB-001',
    category: 'Ingredients',
    systemQty: 68,
    countedQty: 72,
    variance: 4,
    unitCost: 14.00,
    varianceValue: 56.00,
    status: 'pending',
  },
]

// Generate inventory value history
const generateInventoryValueHistory = (): InventoryValuePoint[] => {
  let value = 234560
  return Array.from({ length: 30 }, (_, i) => {
    const change = (Math.random() - 0.45) * 5000
    value = Math.max(200000, value + change)
    return {
      date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
      value: Math.round(value),
      change: Math.round(change),
      changePercent: parseFloat(((change / value) * 100).toFixed(2)),
    }
  })
}

// Component
export function AccountingIntegrationView() {
  // State
  const [activeTab, setActiveTab] = useState('dashboard')
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(generateJournalEntries)
  const [cogsEntries] = useState<COGSEntry[]>(generateCOGSData)
  const [varianceRecords, setVarianceRecords] = useState<VarianceRecord[]>(generateVarianceRecords)
  const [accountMappings, setAccountMappings] = useState<AccountMapping[]>(defaultAccountMappings)
  const [inventoryValueHistory] = useState<InventoryValuePoint[]>(generateInventoryValueHistory)
  const [integrationSettings, setIntegrationSettings] = useState<IntegrationSettings>({
    autoPostEnabled: true,
    postFrequency: 'realtime',
    lastSync: new Date().toISOString(),
    connectionStatus: 'connected',
    connectedSystem: 'Internal Ledger',
    trialBalanceSync: true,
    syncInterval: 5,
  })
  
  // Dialogs
  const [journalDetailOpen, setJournalDetailOpen] = useState(false)
  const [manualJournalOpen, setManualJournalOpen] = useState(false)
  const [previewJournalOpen, setPreviewJournalOpen] = useState(false)
  const [mappingEditOpen, setMappingEditOpen] = useState(false)
  const [varianceApproveOpen, setVarianceApproveOpen] = useState(false)
  
  // Selected items
  const [selectedJournal, setSelectedJournal] = useState<JournalEntry | null>(null)
  const [selectedMapping, setSelectedMapping] = useState<AccountMapping | null>(null)
  const [selectedVariance, setSelectedVariance] = useState<VarianceRecord | null>(null)
  
  // Form states
  const [manualJournalForm, setManualJournalForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    lines: [
      { accountCode: '', accountName: '', debit: 0, credit: 0, description: '' },
      { accountCode: '', accountName: '', debit: 0, credit: 0, description: '' },
    ],
  })
  
  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])
  
  // Computed KPIs
  const journalEntriesToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return journalEntries.filter(je => je.date === today).length
  }, [journalEntries])
  
  const cogsThisMonth = useMemo(() => {
    const thisMonth = new Date().toISOString().slice(0, 7)
    return cogsEntries
      .filter(c => c.date.startsWith(thisMonth))
      .reduce((sum, c) => sum + c.totalCost, 0)
  }, [cogsEntries])
  
  const varianceThisPeriod = useMemo(() => {
    return varianceRecords
      .filter(v => v.status !== 'rejected')
      .reduce((sum, v) => sum + v.varianceValue, 0)
  }, [varianceRecords])
  
  const unpostedEntries = useMemo(() => {
    return journalEntries.filter(je => je.status === 'pending' || je.status === 'draft').length
  }, [journalEntries])
  
  // COGS by category
  const cogsByCategory = useMemo((): COGSSummary[] => {
    const thisMonth = new Date().toISOString().slice(0, 7)
    const filtered = cogsEntries.filter(c => c.date.startsWith(thisMonth))
    const total = filtered.reduce((sum, c) => sum + c.totalCost, 0)
    
    const byCategory: Record<string, { cost: number; qty: number }> = {}
    filtered.forEach(c => {
      if (!byCategory[c.category]) byCategory[c.category] = { cost: 0, qty: 0 }
      byCategory[c.category].cost += c.totalCost
      byCategory[c.category].qty += c.quantity
    })
    
    return Object.entries(byCategory).map(([category, data]) => ({
      category,
      totalCost: data.cost,
      quantity: data.qty,
      percentage: total > 0 ? (data.cost / total) * 100 : 0,
    })).sort((a, b) => b.totalCost - a.totalCost)
  }, [cogsEntries])
  
  // Pending variances
  const pendingVariances = useMemo(() => {
    return varianceRecords.filter(v => v.status === 'pending')
  }, [varianceRecords])
  
  // Format currency
  const formatCurrency = (amount: number) => {
    const prefix = amount < 0 ? '-R' : 'R'
    return `${prefix}${Math.abs(amount).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  
  // Handlers
  const handleViewJournal = (journal: JournalEntry) => {
    setSelectedJournal(journal)
    setJournalDetailOpen(true)
  }
  
  const handlePostJournal = (journalId: string) => {
    setJournalEntries(prev => prev.map(je => 
      je.id === journalId 
        ? { ...je, status: 'posted' as const, postedAt: new Date().toISOString() }
        : je
    ))
    showToast('Journal entry posted successfully', 'success')
  }
  
  const handlePostAllPending = () => {
    const pending = journalEntries.filter(je => je.status === 'pending' || je.status === 'draft')
    if (pending.length === 0) {
      showToast('No pending entries to post', 'info')
      return
    }
    
    setJournalEntries(prev => prev.map(je => 
      (je.status === 'pending' || je.status === 'draft')
        ? { ...je, status: 'posted' as const, postedAt: new Date().toISOString() }
        : je
    ))
    showToast(`${pending.length} journal entries posted`, 'success')
  }
  
  const handleApproveVariance = (varianceId: string) => {
    const variance = varianceRecords.find(v => v.id === varianceId)
    if (!variance) return
    
    // Create journal entry for variance
    const isPositive = variance.variance > 0
    const mapping = accountMappings.find(m => 
      m.eventType === (isPositive ? 'stocktake_variance_pos' : 'stocktake_variance_neg')
    )
    
    if (mapping) {
      const newJournal: JournalEntry = {
        id: `JE-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        reference: `JE-2026-${String(journalEntries.length + 1).padStart(3, '0')}`,
        description: `Stocktake Variance - ${variance.productName}`,
        eventType: 'stocktake_variance',
        lines: [
          {
            id: `JEL-${Date.now()}-1`,
            accountCode: mapping.debitAccountCode,
            accountName: mapping.debitAccountName,
            debit: Math.abs(variance.varianceValue),
            credit: 0,
            description: `Variance from ${variance.stocktakeId}`,
          },
          {
            id: `JEL-${Date.now()}-2`,
            accountCode: mapping.creditAccountCode,
            accountName: mapping.creditAccountName,
            debit: 0,
            credit: Math.abs(variance.varianceValue),
            description: `Variance from ${variance.stocktakeId}`,
          },
        ],
        totalDebit: Math.abs(variance.varianceValue),
        totalCredit: Math.abs(variance.varianceValue),
        status: 'pending',
        createdBy: 'Current User',
        createdAt: new Date().toISOString(),
        sourceReference: variance.stocktakeId,
      }
      
      setJournalEntries(prev => [newJournal, ...prev])
    }
    
    // Update variance status
    setVarianceRecords(prev => prev.map(v =>
      v.id === varianceId
        ? { 
            ...v, 
            status: 'approved' as const, 
            approvedBy: 'Current User',
            approvedAt: new Date().toISOString(),
            journalEntryId: `JE-${Date.now()}`,
          }
        : v
    ))
    
    showToast('Variance approved and journal entry created', 'success')
    setVarianceApproveOpen(false)
  }
  
  const handleSaveMapping = () => {
    if (!selectedMapping) return
    setAccountMappings(prev => prev.map(m =>
      m.id === selectedMapping.id ? selectedMapping : m
    ))
    showToast('Account mapping updated', 'success')
    setMappingEditOpen(false)
  }
  
  const handleSaveSettings = () => {
    showToast('Integration settings saved', 'success')
  }
  
  const handleCreateManualJournal = () => {
    const totalDebit = manualJournalForm.lines.reduce((s, l) => s + l.debit, 0)
    const totalCredit = manualJournalForm.lines.reduce((s, l) => s + l.credit, 0)
    
    if (totalDebit !== totalCredit) {
      showToast('Journal must be balanced (debits = credits)', 'error')
      return
    }
    
    const newJournal: JournalEntry = {
      id: `JE-${Date.now()}`,
      date: manualJournalForm.date,
      reference: `JE-2026-${String(journalEntries.length + 1).padStart(3, '0')}`,
      description: manualJournalForm.description,
      eventType: 'manual',
      lines: manualJournalForm.lines.map((l, i) => ({
        id: `JEL-${Date.now()}-${i}`,
        accountCode: l.accountCode,
        accountName: standardAccounts.find(a => a.code === l.accountCode)?.name || '',
        debit: l.debit,
        credit: l.credit,
        description: l.description,
      })),
      totalDebit,
      totalCredit,
      status: 'draft',
      createdBy: 'Current User',
      createdAt: new Date().toISOString(),
    }
    
    setJournalEntries(prev => [newJournal, ...prev])
    setManualJournalOpen(false)
    setManualJournalForm({
      date: new Date().toISOString().split('T')[0],
      description: '',
      lines: [
        { accountCode: '', accountName: '', debit: 0, credit: 0, description: '' },
        { accountCode: '', accountName: '', debit: 0, credit: 0, description: '' },
      ],
    })
    showToast('Manual journal entry created', 'success')
  }
  
  // Render Dashboard
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[#00897B]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575]">Journal Entries Today</p>
                <p className="text-2xl font-bold">{journalEntriesToday}</p>
              </div>
              <FileText className="h-8 w-8 text-[#00897B] opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575]">COGS This Month</p>
                <p className="text-2xl font-bold">{formatCurrency(cogsThisMonth)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575]">Variance This Period</p>
                <p className="text-2xl font-bold">{formatCurrency(varianceThisPeriod)}</p>
              </div>
              <ArrowRightLeft className="h-8 w-8 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className={`border-l-4 ${unpostedEntries > 0 ? 'border-l-red-500' : 'border-l-green-500'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#757575]">Unposted Entries</p>
                <p className="text-2xl font-bold">{unpostedEntries}</p>
              </div>
              {unpostedEntries > 0 ? (
                <AlertCircle className="h-8 w-8 text-red-500 opacity-50" />
              ) : (
                <CheckCircle2 className="h-8 w-8 text-green-500 opacity-50" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Unposted Alert */}
      {unpostedEntries > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="font-medium text-orange-800">Unposted Journal Entries</p>
                  <p className="text-sm text-orange-600">
                    {unpostedEntries} journal entries are pending posting to the general ledger.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setActiveTab('autojournal')}>
                  View Entries
                </Button>
                <Button size="sm" className="bg-orange-500 hover:bg-orange-600" onClick={handlePostAllPending}>
                  Post All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Quick Actions */}
      <div className="flex gap-2 flex-wrap">
        <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handlePostAllPending}>
          <RefreshCw className="h-4 w-4 mr-2" />Post All Pending
        </Button>
        <Button variant="outline" onClick={() => setActiveTab('cogs')}>
          <BarChart3 className="h-4 w-4 mr-2" />View COGS Report
        </Button>
        <Button variant="outline" onClick={() => setActiveTab('variances')}>
          <ArrowRightLeft className="h-4 w-4 mr-2" />View Variances
        </Button>
        <Button variant="outline" onClick={() => setActiveTab('settings')}>
          <Settings className="h-4 w-4 mr-2" />Sync Settings
        </Button>
      </div>
      
      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Journal Entries */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />Recent Journal Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {journalEntries.slice(0, 5).map(je => (
                <div 
                  key={je.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                  onClick={() => handleViewJournal(je)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate max-w-[200px]">{je.description}</p>
                      <Badge variant={je.status === 'posted' ? 'default' : 'secondary'} className="text-xs">
                        {je.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#757575]">{je.reference} • {je.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(je.totalDebit)}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-3 text-[#00897B]" onClick={() => setActiveTab('autojournal')}>
              View All Entries <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
        
        {/* Inventory Value Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <LineChart className="h-4 w-4" />Inventory Value Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end gap-1">
              {inventoryValueHistory.slice(-14).map((point, i) => {
                const maxVal = Math.max(...inventoryValueHistory.slice(-14).map(p => p.value))
                const minVal = Math.min(...inventoryValueHistory.slice(-14).map(p => p.value))
                const height = ((point.value - minVal) / (maxVal - minVal)) * 100
                return (
                  <div 
                    key={i}
                    className="flex-1 bg-[#00897B] rounded-t opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                    style={{ height: `${Math.max(10, height)}%` }}
                    title={`${point.date}: ${formatCurrency(point.value)}`}
                  />
                )
              })}
            </div>
            <div className="flex justify-between mt-2 text-xs text-[#757575]">
              <span>{inventoryValueHistory[0]?.date}</span>
              <span>Current: {formatCurrency(inventoryValueHistory[inventoryValueHistory.length - 1]?.value || 0)}</span>
              <span>{inventoryValueHistory[inventoryValueHistory.length - 1]?.date}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* GroAI Insights */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-500" />GroAI Accounting Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-700">COGS Alert</span>
              </div>
              <p className="text-xs text-blue-600">COGS ratio is 34.2% this month, 2.1% higher than average. Review supplier pricing.</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium text-orange-700">Variance Spike</span>
              </div>
              <p className="text-xs text-orange-600">Negative variance increased 15% vs last period. Consider tighter inventory controls.</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg border border-green-100">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-green-700">Sync Status</span>
              </div>
              <p className="text-xs text-green-600">All journal entries synced. Trial balance matches inventory valuation report.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
  
  // Render Auto-Journal Tab
  const renderAutoJournal = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Journal Entry Automation</h2>
          <p className="text-sm text-[#757575]">Automatic journal entries triggered by inventory movements</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setManualJournalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />Manual Entry
          </Button>
          <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handlePostAllPending}>
            Post All Pending
          </Button>
        </div>
      </div>
      
      {/* Event Types */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Event Types & Journal Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { type: 'stock_receipt', label: 'Stock Receipt (GRN)', debit: 'Inventory Asset', credit: 'GRN Clearing', icon: Package, color: 'blue' },
              { type: 'stock_sale', label: 'Stock Sale', debit: 'COGS', credit: 'Inventory Asset', icon: ShoppingCart, color: 'green' },
              { type: 'stock_adjustment', label: 'Stock Adjustment', debit: 'Shrinkage/Adj Income', credit: 'Inventory Asset', icon: ArrowRightLeft, color: 'orange' },
              { type: 'stock_transfer', label: 'Stock Transfer', debit: 'Inventory (Dest)', credit: 'Inventory (Source)', icon: ArrowRightLeft, color: 'purple' },
              { type: 'stocktake_variance', label: 'Stocktake Variance', debit: 'Inv Loss/Adj Income', credit: 'Inventory Asset', icon: ClipboardList, color: 'red' },
            ].map(event => (
              <div key={event.type} className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <event.icon className={`h-5 w-5 text-${event.color}-500`} />
                  <span className="font-medium">{event.label}</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-1 text-green-600">
                    <ArrowUpRight className="h-3 w-3" />
                    <span>Dr: {event.debit}</span>
                  </div>
                  <div className="flex items-center gap-1 text-red-600">
                    <ArrowDownRight className="h-3 w-3" />
                    <span>Cr: {event.credit}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Journal Entries Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Journal Entries</CardTitle>
            <div className="flex items-center gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-[150px] h-8">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="stock_receipt">Stock Receipt</SelectItem>
                  <SelectItem value="stock_sale">Stock Sale</SelectItem>
                  <SelectItem value="stock_adjustment">Adjustment</SelectItem>
                  <SelectItem value="stock_transfer">Transfer</SelectItem>
                  <SelectItem value="stocktake_variance">Variance</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-[120px] h-8">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="posted">Posted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {journalEntries.map(je => (
                <TableRow key={je.id}>
                  <TableCell className="font-mono text-xs">{je.reference}</TableCell>
                  <TableCell className="text-sm">{je.date}</TableCell>
                  <TableCell>
                    <p className="text-sm truncate max-w-[200px]">{je.description}</p>
                    <p className="text-xs text-[#757575]">Source: {je.sourceReference}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {je.eventType.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(je.totalDebit)}</TableCell>
                  <TableCell>
                    <Badge className={je.status === 'posted' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}>
                      {je.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleViewJournal(je)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {je.status !== 'posted' && (
                        <Button variant="ghost" size="sm" onClick={() => handlePostJournal(je.id)}>
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
  
  // Render COGS Tab
  const renderCOGS = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Cost of Goods Sold (COGS)</h2>
          <p className="text-sm text-[#757575]">Track and analyze cost of goods sold by category</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />Export Report
          </Button>
        </div>
      </div>
      
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Total COGS (MTD)</p>
            <p className="text-2xl font-bold">{formatCurrency(cogsThisMonth)}</p>
            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />+2.1% vs last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">COGS Ratio</p>
            <p className="text-2xl font-bold">34.2%</p>
            <p className="text-xs text-[#757575]">of revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Avg Unit Cost</p>
            <p className="text-2xl font-bold">{formatCurrency(cogsEntries.reduce((s, c) => s + c.unitCost, 0) / cogsEntries.length || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Gross Margin</p>
            <p className="text-2xl font-bold">65.8%</p>
            <Progress value={65.8} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>
      
      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* COGS by Category */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <PieChart className="h-4 w-4" />COGS by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cogsByCategory.map(cat => (
                <div key={cat.category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{cat.category}</span>
                    <span className="text-sm">{formatCurrency(cat.totalCost)}</span>
                  </div>
                  <Progress value={cat.percentage} className="h-2" />
                  <p className="text-xs text-[#757575] mt-1">
                    {cat.quantity.toLocaleString()} units • {cat.percentage.toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Cost Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <LineChart className="h-4 w-4" />Daily COGS Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end gap-1">
              {Array.from({ length: 14 }, (_, i) => {
                const value = 2000 + Math.random() * 3000
                const height = (value / 5000) * 100
                return (
                  <div 
                    key={i}
                    className="flex-1 bg-blue-500 rounded-t opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                    style={{ height: `${height}%` }}
                    title={`Day ${i + 1}: ${formatCurrency(value)}`}
                  />
                )
              })}
            </div>
            <div className="flex justify-between mt-2 text-xs text-[#757575]">
              <span>7 days ago</span>
              <span>Today</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Margin Analysis */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Margin Analysis by Product</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Units Sold</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Margin</TableHead>
                <TableHead className="text-right">Total COGS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { name: 'Beef Patty (Frozen)', category: 'Ingredients', units: 245, cost: 12.00, price: 22.50, margin: 46.7 },
                { name: 'Coca-Cola 500ml', category: 'Beverages', units: 520, cost: 9.50, price: 18.90, margin: 49.7 },
                { name: 'Chicken Wings', category: 'Chicken', units: 180, cost: 42.00, price: 99.90, margin: 58.0 },
                { name: 'Burger Buns', category: 'Ingredients', units: 310, cost: 14.00, price: 24.00, margin: 41.7 },
                { name: 'Cheddar Cheese', category: 'Ingredients', units: 95, cost: 5.20, price: 8.50, margin: 38.8 },
              ].map((product, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell className="text-right">{product.units}</TableCell>
                  <TableCell className="text-right">{formatCurrency(product.cost)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(product.price)}</TableCell>
                  <TableCell className="text-right">
                    <span className={product.margin > 40 ? 'text-green-600' : 'text-orange-600'}>
                      {product.margin.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(product.units * product.cost)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* FIFO/LIFO Tracking */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">FIFO Cost Layer Tracking</CardTitle>
            <Badge variant="outline">FIFO Method Active</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { product: 'Beef Patty (Frozen)', layers: [{ date: '2026-02-01', qty: 50, cost: 11.50 }, { date: '2026-02-10', qty: 100, cost: 12.00 }, { date: '2026-02-18', qty: 50, cost: 12.50 }], avgCost: 12.00 },
              { product: 'Chicken Wings', layers: [{ date: '2026-02-05', qty: 30, cost: 40.00 }, { date: '2026-02-15', qty: 50, cost: 42.00 }], avgCost: 41.25 },
            ].map((item, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{item.product}</span>
                  <span className="text-sm text-[#757575]">Avg Cost: {formatCurrency(item.avgCost)}</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {item.layers.map((layer, j) => (
                    <div key={j} className="px-2 py-1 bg-white rounded border text-xs">
                      <span className="text-[#757575]">{layer.date}:</span> {layer.qty} @ {formatCurrency(layer.cost)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
  
  // Render Variances Tab
  const renderVariances = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Stocktake Variance Reporting</h2>
          <p className="text-sm text-[#757575]">Track and approve inventory variances</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />Export Report
          </Button>
        </div>
      </div>
      
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Total Variance Value</p>
            <p className={`text-2xl font-bold ${varianceThisPeriod >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(varianceThisPeriod)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Pending Approval</p>
            <p className="text-2xl font-bold text-orange-500">{pendingVariances.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Approved This Period</p>
            <p className="text-2xl font-bold">{varianceRecords.filter(v => v.status === 'approved').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#757575]">Journal Entries Created</p>
            <p className="text-2xl font-bold">{varianceRecords.filter(v => v.journalEntryId).length}</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Variance Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Variance Summary by Stocktake</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stocktake ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Items Counted</TableHead>
                <TableHead className="text-right">Positive Variance</TableHead>
                <TableHead className="text-right">Negative Variance</TableHead>
                <TableHead className="text-right">Net Variance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { id: 'ST-2026-003', date: '2026-02-20', items: 45, positive: 56.00, negative: -252.00, status: 'pending' },
                { id: 'ST-2026-002', date: '2026-02-18', items: 120, positive: 142.50, negative: -72.40, status: 'approved' },
              ].map((st, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono">{st.id}</TableCell>
                  <TableCell>{st.date}</TableCell>
                  <TableCell className="text-right">{st.items}</TableCell>
                  <TableCell className="text-right text-green-600">{formatCurrency(st.positive)}</TableCell>
                  <TableCell className="text-right text-red-600">{formatCurrency(st.negative)}</TableCell>
                  <TableCell className={`text-right font-bold ${(st.positive + st.negative) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(st.positive + st.negative)}
                  </TableCell>
                  <TableCell>
                    <Badge className={st.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}>
                      {st.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Pending Variances */}
      {pendingVariances.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader className="pb-2 bg-orange-50">
            <CardTitle className="text-sm flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-4 w-4" />Variances Awaiting Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">System Qty</TableHead>
                  <TableHead className="text-right">Counted Qty</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingVariances.map(v => (
                  <TableRow key={v.id}>
                    <TableCell>
                      <p className="font-medium">{v.productName}</p>
                      <p className="text-xs text-[#757575]">{v.sku}</p>
                    </TableCell>
                    <TableCell>{v.category}</TableCell>
                    <TableCell className="text-right">{v.systemQty}</TableCell>
                    <TableCell className="text-right">{v.countedQty}</TableCell>
                    <TableCell className={`text-right font-bold ${v.variance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {v.variance > 0 ? '+' : ''}{v.variance}
                    </TableCell>
                    <TableCell className={`text-right font-bold ${v.varianceValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(v.varianceValue)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-green-600 hover:bg-green-50"
                          onClick={() => {
                            setSelectedVariance(v)
                            setVarianceApproveOpen(true)
                          }}
                        >
                          Approve
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50">
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      
      {/* Historical Variances */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Historical Variance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-end gap-2">
            {Array.from({ length: 12 }, (_, i) => {
              const positive = 100 + Math.random() * 200
              const negative = -(150 + Math.random() * 250)
              return (
                <div key={i} className="flex-1 flex flex-col gap-1">
                  <div 
                    className="bg-green-500 rounded-t cursor-pointer"
                    style={{ height: `${(positive / 400) * 80}px` }}
                    title={`Positive: ${formatCurrency(positive)}`}
                  />
                  <div 
                    className="bg-red-500 rounded-b cursor-pointer"
                    style={{ height: `${(Math.abs(negative) / 400) * 80}px` }}
                    title={`Negative: ${formatCurrency(negative)}`}
                  />
                </div>
              )
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-[#757575]">
            <span>Jan</span>
            <span>Dec</span>
          </div>
          <div className="flex justify-center gap-6 mt-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span className="text-xs text-[#757575]">Positive Variance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded" />
              <span className="text-xs text-[#757575]">Negative Variance</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
  
  // Render Account Mapping Tab
  const renderAccountMapping = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Account Mapping</h2>
          <p className="text-sm text-[#757575]">Configure accounts for automatic journal entries</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />Export Mapping
        </Button>
      </div>
      
      {/* Default Account Codes Reference */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Standard SA Chart of Accounts Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {standardAccounts.slice(0, 8).map(acc => (
              <div key={acc.code} className="p-2 bg-gray-50 rounded">
                <p className="text-xs font-mono text-[#757575]">{acc.code}</p>
                <p className="text-sm font-medium">{acc.name}</p>
                <Badge variant="outline" className="text-xs mt-1">{acc.type}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Event Type Mappings */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Event Type → Account Mapping</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Type</TableHead>
                <TableHead>Debit Account</TableHead>
                <TableHead>Credit Account</TableHead>
                <TableHead>VAT</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accountMappings.map(mapping => (
                <TableRow key={mapping.id}>
                  <TableCell className="font-medium">{mapping.eventTypeName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-700 text-xs">Dr</Badge>
                      <span>{mapping.debitAccountCode} - {mapping.debitAccountName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-100 text-red-700 text-xs">Cr</Badge>
                      <span>{mapping.creditAccountCode} - {mapping.creditAccountName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {mapping.vatApplicable ? (
                      <Badge variant="outline" className="text-xs">
                        <Percent className="h-3 w-3 mr-1" />
                        {mapping.vatCode}
                      </Badge>
                    ) : (
                      <span className="text-[#757575]">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch checked={mapping.isActive} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => {
                      setSelectedMapping(mapping)
                      setMappingEditOpen(true)
                    }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Category-Specific Accounts */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Category-Specific Account Overrides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-[#757575]">
            <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No category overrides configured</p>
            <p className="text-xs">Add category-specific COGS accounts for detailed tracking</p>
            <Button variant="outline" size="sm" className="mt-3">
              <Plus className="h-4 w-4 mr-2" />Add Override
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* VAT Account Mapping */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">VAT Account Mapping (15% South Africa)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Percent className="h-4 w-4 text-blue-500" />
                Input VAT (Recoverable)
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-[#757575]">Account Code:</span>
                  <span className="font-mono">2410</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[#757575]">Account Name:</span>
                  <span>VAT Input</span>
                </div>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Percent className="h-4 w-4 text-orange-500" />
                Output VAT (Payable)
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-[#757575]">Account Code:</span>
                  <span className="font-mono">2420</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[#757575]">Account Name:</span>
                  <span>VAT Output</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
  
  // Render Settings Tab
  const renderSettings = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Integration Settings</h2>
          <p className="text-sm text-[#757575]">Configure automatic posting and sync settings</p>
        </div>
        <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleSaveSettings}>
          <Save className="h-4 w-4 mr-2" />Save Settings
        </Button>
      </div>
      
      {/* Connection Status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            {integrationSettings.connectionStatus === 'connected' ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge className={integrationSettings.connectionStatus === 'connected' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                {integrationSettings.connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
              </Badge>
              <span className="text-sm">{integrationSettings.connectedSystem}</span>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#757575]">Last Sync</p>
              <p className="text-sm">{new Date(integrationSettings.lastSync).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Auto-Post Settings */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Auto-Post Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable Auto-Post</p>
              <p className="text-sm text-[#757575]">Automatically post journal entries when created</p>
            </div>
            <Switch 
              checked={integrationSettings.autoPostEnabled}
              onCheckedChange={(checked) => setIntegrationSettings(prev => ({ ...prev, autoPostEnabled: checked }))}
            />
          </div>
          
          <Separator />
          
          <div>
            <p className="font-medium mb-2">Post Frequency</p>
            <div className="flex gap-2">
              {[
                { value: 'realtime', label: 'Real-time', desc: 'Post immediately' },
                { value: 'hourly', label: 'Hourly', desc: 'Batch post every hour' },
                { value: 'daily', label: 'Daily', desc: 'Post at end of day' },
              ].map(freq => (
                <button
                  key={freq.value}
                  className={`flex-1 p-3 border rounded-lg text-left transition-colors ${
                    integrationSettings.postFrequency === freq.value
                      ? 'border-[#00897B] bg-[#E0F2F1]'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setIntegrationSettings(prev => ({ ...prev, postFrequency: freq.value as any }))}
                >
                  <p className="font-medium">{freq.label}</p>
                  <p className="text-xs text-[#757575]">{freq.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Trial Balance Sync */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Trial Balance Sync</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable Trial Balance Sync</p>
              <p className="text-sm text-[#757575]">Sync inventory values with trial balance</p>
            </div>
            <Switch 
              checked={integrationSettings.trialBalanceSync}
              onCheckedChange={(checked) => setIntegrationSettings(prev => ({ ...prev, trialBalanceSync: checked }))}
            />
          </div>
          
          <Separator />
          
          <div>
            <p className="font-medium mb-2">Sync Interval (minutes)</p>
            <Input 
              type="number"
              value={integrationSettings.syncInterval}
              onChange={(e) => setIntegrationSettings(prev => ({ ...prev, syncInterval: parseInt(e.target.value) || 5 }))}
              className="w-32"
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Financial Year Settings */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Financial Year Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-[#757575]">Financial Year Start</Label>
              <Select defaultValue="march">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="january">January (Calendar Year)</SelectItem>
                  <SelectItem value="march">March (SA Standard)</SelectItem>
                  <SelectItem value="july">July</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm text-[#757575]">Current Period</Label>
              <Input value="February 2026" disabled />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* IFRS Compliance */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">IFRS for SMEs Compliance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <CheckCircle2 className="h-5 w-5 text-green-500 mb-2" />
              <p className="font-medium text-green-700">FIFO Valuation</p>
              <p className="text-xs text-green-600">Compliant with IAS 2</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <CheckCircle2 className="h-5 w-5 text-green-500 mb-2" />
              <p className="font-medium text-green-700">Lower of Cost/NRV</p>
              <p className="text-xs text-green-600">Inventory write-down tracking</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
  
  // Main render
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calculator className="h-5 w-5 text-[#00897B]" />
            <div>
              <h1 className="text-lg font-semibold">Accounting Integration</h1>
              <p className="text-xs text-[#757575]">Automatic journal entries for inventory movements</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              VAT: 15%
            </Badge>
            <Badge className="bg-green-100 text-green-700">
              {integrationSettings.connectionStatus === 'connected' ? 'Synced' : 'Offline'}
            </Badge>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b bg-white px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-12 bg-transparent">
            <TabsTrigger value="dashboard" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] rounded-none data-[state=active]:shadow-none">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="autojournal" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] rounded-none data-[state=active]:shadow-none">
              Auto-Journal
            </TabsTrigger>
            <TabsTrigger value="cogs" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] rounded-none data-[state=active]:shadow-none">
              COGS Tracking
            </TabsTrigger>
            <TabsTrigger value="variances" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] rounded-none data-[state=active]:shadow-none">
              Variance Reporting
            </TabsTrigger>
            <TabsTrigger value="mapping" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] rounded-none data-[state=active]:shadow-none">
              Account Mapping
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:border-b-2 data-[state=active]:border-[#00897B] rounded-none data-[state=active]:shadow-none">
              Settings
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'autojournal' && renderAutoJournal()}
        {activeTab === 'cogs' && renderCOGS()}
        {activeTab === 'variances' && renderVariances()}
        {activeTab === 'mapping' && renderAccountMapping()}
        {activeTab === 'settings' && renderSettings()}
      </ScrollArea>
      
      {/* Journal Detail Dialog */}
      <Dialog open={journalDetailOpen} onOpenChange={setJournalDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Journal Entry Details</DialogTitle>
            <DialogDescription>
              {selectedJournal?.reference} - {selectedJournal?.date}
            </DialogDescription>
          </DialogHeader>
          {selectedJournal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-[#757575]">Description</Label>
                  <p className="text-sm">{selectedJournal.description}</p>
                </div>
                <div>
                  <Label className="text-xs text-[#757575]">Source Reference</Label>
                  <p className="text-sm">{selectedJournal.sourceReference}</p>
                </div>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedJournal.lines.map(line => (
                    <TableRow key={line.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-[#757575]">{line.accountCode}</span>
                          <span>{line.accountName}</span>
                        </div>
                        <p className="text-xs text-[#757575]">{line.description}</p>
                      </TableCell>
                      <TableCell className="text-right">
                        {line.debit > 0 ? formatCurrency(line.debit) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {line.credit > 0 ? formatCurrency(line.credit) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-gray-50">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">{formatCurrency(selectedJournal.totalDebit)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(selectedJournal.totalCredit)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              
              <div className="flex items-center justify-between text-sm text-[#757575]">
                <span>Created by: {selectedJournal.createdBy}</span>
                <span>Created: {new Date(selectedJournal.createdAt).toLocaleString()}</span>
              </div>
              
              {selectedJournal.status !== 'posted' && (
                <DialogFooter>
                  <Button variant="outline" onClick={() => setJournalDetailOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    className="bg-[#00897B] hover:bg-[#00695C]"
                    onClick={() => {
                      handlePostJournal(selectedJournal.id)
                      setJournalDetailOpen(false)
                    }}
                  >
                    Post Entry
                  </Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Manual Journal Dialog */}
      <Dialog open={manualJournalOpen} onOpenChange={setManualJournalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Manual Journal Entry</DialogTitle>
            <DialogDescription>
              Create a manual journal entry for inventory adjustments
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input 
                  type="date" 
                  value={manualJournalForm.date}
                  onChange={(e) => setManualJournalForm(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div>
                <Label>Reference</Label>
                <Input value={`JE-2026-${String(journalEntries.length + 1).padStart(3, '0')}`} disabled />
              </div>
            </div>
            
            <div>
              <Label>Description</Label>
              <Textarea 
                value={manualJournalForm.description}
                onChange={(e) => setManualJournalForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter journal entry description..."
              />
            </div>
            
            <div>
              <Label>Lines</Label>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {manualJournalForm.lines.map((line, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Select 
                          value={line.accountCode}
                          onValueChange={(val) => {
                            const newLines = [...manualJournalForm.lines]
                            newLines[i].accountCode = val
                            newLines[i].accountName = standardAccounts.find(a => a.code === val)?.name || ''
                            setManualJournalForm(prev => ({ ...prev, lines: newLines }))
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                          <SelectContent>
                            {standardAccounts.map(acc => (
                              <SelectItem key={acc.code} value={acc.code}>
                                {acc.code} - {acc.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number"
                          className="text-right"
                          value={line.debit || ''}
                          onChange={(e) => {
                            const newLines = [...manualJournalForm.lines]
                            newLines[i].debit = parseFloat(e.target.value) || 0
                            setManualJournalForm(prev => ({ ...prev, lines: newLines }))
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number"
                          className="text-right"
                          value={line.credit || ''}
                          onChange={(e) => {
                            const newLines = [...manualJournalForm.lines]
                            newLines[i].credit = parseFloat(e.target.value) || 0
                            setManualJournalForm(prev => ({ ...prev, lines: newLines }))
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-between mt-2 text-sm">
                <span>Total Debit: {formatCurrency(manualJournalForm.lines.reduce((s, l) => s + l.debit, 0))}</span>
                <span>Total Credit: {formatCurrency(manualJournalForm.lines.reduce((s, l) => s + l.credit, 0))}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualJournalOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleCreateManualJournal}>
              Create Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Variance Approve Dialog */}
      <Dialog open={varianceApproveOpen} onOpenChange={setVarianceApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Variance</DialogTitle>
            <DialogDescription>
              Review and approve this stocktake variance
            </DialogDescription>
          </DialogHeader>
          {selectedVariance && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-[#757575]">Product</Label>
                  <p className="font-medium">{selectedVariance.productName}</p>
                </div>
                <div>
                  <Label className="text-xs text-[#757575]">SKU</Label>
                  <p className="font-mono">{selectedVariance.sku}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-xs text-[#757575]">System Qty</p>
                  <p className="text-xl font-bold">{selectedVariance.systemQty}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-[#757575]">Counted Qty</p>
                  <p className="text-xl font-bold">{selectedVariance.countedQty}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-[#757575]">Variance</p>
                  <p className={`text-xl font-bold ${selectedVariance.variance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedVariance.variance > 0 ? '+' : ''}{selectedVariance.variance}
                  </p>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Variance Value</span>
                  <span className={`text-xl font-bold ${selectedVariance.varianceValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(selectedVariance.varianceValue)}
                  </span>
                </div>
              </div>
              
              {selectedVariance.notes && (
                <div>
                  <Label className="text-xs text-[#757575]">Notes</Label>
                  <p className="text-sm">{selectedVariance.notes}</p>
                </div>
              )}
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> Approving this variance will automatically create a journal entry.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setVarianceApproveOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-green-500 hover:bg-green-600"
              onClick={() => handleApproveVariance(selectedVariance?.id || '')}
            >
              Approve & Create Journal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Mapping Edit Dialog */}
      <Dialog open={mappingEditOpen} onOpenChange={setMappingEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Account Mapping</DialogTitle>
            <DialogDescription>
              Configure the accounts for this event type
            </DialogDescription>
          </DialogHeader>
          {selectedMapping && (
            <div className="space-y-4">
              <div>
                <Label>Event Type</Label>
                <Input value={selectedMapping.eventTypeName} disabled />
              </div>
              
              <div>
                <Label>Debit Account</Label>
                <Select 
                  value={selectedMapping.debitAccountCode}
                  onValueChange={(val) => {
                    const acc = standardAccounts.find(a => a.code === val)
                    setSelectedMapping(prev => prev ? {
                      ...prev,
                      debitAccountCode: val,
                      debitAccountName: acc?.name || ''
                    } : null)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {standardAccounts.map(acc => (
                      <SelectItem key={acc.code} value={acc.code}>
                        {acc.code} - {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Credit Account</Label>
                <Select 
                  value={selectedMapping.creditAccountCode}
                  onValueChange={(val) => {
                    const acc = standardAccounts.find(a => a.code === val)
                    setSelectedMapping(prev => prev ? {
                      ...prev,
                      creditAccountCode: val,
                      creditAccountName: acc?.name || ''
                    } : null)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {standardAccounts.map(acc => (
                      <SelectItem key={acc.code} value={acc.code}>
                        {acc.code} - {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>VAT Applicable</Label>
                  <p className="text-xs text-[#757575]">Apply VAT to this entry</p>
                </div>
                <Switch 
                  checked={selectedMapping.vatApplicable}
                  onCheckedChange={(checked) => setSelectedMapping(prev => prev ? { ...prev, vatApplicable: checked } : null)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setMappingEditOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleSaveMapping}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-500' :
          toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        } text-white`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default AccountingIntegrationView
