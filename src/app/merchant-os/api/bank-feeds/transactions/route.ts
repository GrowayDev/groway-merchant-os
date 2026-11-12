import { NextRequest, NextResponse } from 'next/server'

// Bank Transaction Type
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

// In-memory store for demo purposes
const bankTransactions: BankTransaction[] = [
  {
    id: 'TXN-001',
    bankAccountId: 'ACC-001',
    date: '2026-01-15',
    description: 'POS Settlement - Store Main',
    reference: 'POS-20260115-001',
    amount: 45670.00,
    type: 'credit',
    category: 'Sales',
    isReconciled: true,
    reconciledTo: { type: 'sale', id: 'SAL-001', reference: 'INV-2026-045' },
    balance: 156780.45,
    createdAt: '2026-01-15T14:30:00',
  },
  {
    id: 'TXN-002',
    bankAccountId: 'ACC-001',
    date: '2026-01-14',
    description: 'EFT Payment - GroSupply SA',
    reference: 'EFT-78901',
    amount: -15670.00,
    type: 'debit',
    category: 'Inventory',
    isReconciled: true,
    reconciledTo: { type: 'purchase', id: 'PUR-001', reference: 'PO-2026-012' },
    balance: 111110.45,
    createdAt: '2026-01-14T10:15:00',
  },
  {
    id: 'TXN-003',
    bankAccountId: 'ACC-001',
    date: '2026-01-14',
    description: 'Debit Order - ABSA Rental',
    reference: 'DO-RENT-0114',
    amount: -27600.00,
    type: 'debit',
    category: 'Rent',
    isReconciled: false,
    balance: 126780.45,
    createdAt: '2026-01-14T08:00:00',
  },
  {
    id: 'TXN-004',
    bankAccountId: 'ACC-001',
    date: '2026-01-13',
    description: 'Customer Payment - Sipho Dlamini',
    reference: 'CUST-DLAMINI',
    amount: 5750.00,
    type: 'credit',
    category: 'Receivables',
    isReconciled: true,
    reconciledTo: { type: 'sale', id: 'SAL-002', reference: 'INV-2026-038' },
    balance: 154380.45,
    createdAt: '2026-01-13T16:45:00',
  },
  {
    id: 'TXN-005',
    bankAccountId: 'ACC-001',
    date: '2026-01-13',
    description: 'Bank Charges - Monthly Fees',
    reference: 'FEE-JAN-2026',
    amount: -450.00,
    type: 'debit',
    category: 'Bank Charges',
    isReconciled: false,
    balance: 148630.45,
    createdAt: '2026-01-13T00:00:00',
  },
  {
    id: 'TXN-006',
    bankAccountId: 'ACC-002',
    date: '2026-01-15',
    description: 'Interest Credit',
    reference: 'INT-JAN-001',
    amount: 450.00,
    type: 'credit',
    category: 'Interest',
    isReconciled: false,
    balance: 89450.00,
    createdAt: '2026-01-15T00:00:00',
  },
  {
    id: 'TXN-007',
    bankAccountId: 'ACC-002',
    date: '2026-01-12',
    description: 'Transfer from Main Account',
    reference: 'TRF-0112',
    amount: 15000.00,
    type: 'credit',
    category: 'Transfer',
    isReconciled: false,
    balance: 89000.00,
    createdAt: '2026-01-12T11:30:00',
  },
  {
    id: 'TXN-008',
    bankAccountId: 'ACC-001',
    date: '2026-01-12',
    description: 'Yoco Settlement - Card Sales',
    reference: 'YOCO-110125',
    amount: 23450.00,
    type: 'credit',
    category: 'Sales',
    isReconciled: false,
    balance: 133630.45,
    createdAt: '2026-01-12T17:00:00',
  },
  {
    id: 'TXN-009',
    bankAccountId: 'ACC-001',
    date: '2026-01-11',
    description: 'Vodacom Business - Data Services',
    reference: 'VOD-JAN-2026',
    amount: -2800.00,
    type: 'debit',
    category: 'Telecommunications',
    isReconciled: false,
    balance: 110180.45,
    createdAt: '2026-01-11T09:00:00',
  },
  {
    id: 'TXN-010',
    bankAccountId: 'ACC-001',
    date: '2026-01-10',
    description: 'Cash Deposit - Daily Takings',
    reference: 'DEP-1001',
    amount: 12500.00,
    type: 'credit',
    category: 'Sales',
    isReconciled: false,
    balance: 112980.45,
    createdAt: '2026-01-10T18:30:00',
  },
]

// GET /api/merchant-os/api/bank-feeds/transactions
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const accountId = searchParams.get('accountId')
  const reconciled = searchParams.get('reconciled')
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  
  let filteredTransactions = [...bankTransactions]
  
  // Filter by account
  if (accountId && accountId !== 'all') {
    filteredTransactions = filteredTransactions.filter(txn => txn.bankAccountId === accountId)
  }
  
  // Filter by reconciliation status
  if (reconciled === 'true') {
    filteredTransactions = filteredTransactions.filter(txn => txn.isReconciled)
  } else if (reconciled === 'false') {
    filteredTransactions = filteredTransactions.filter(txn => !txn.isReconciled)
  }
  
  // Filter by date range
  if (dateFrom) {
    filteredTransactions = filteredTransactions.filter(txn => txn.date >= dateFrom)
  }
  if (dateTo) {
    filteredTransactions = filteredTransactions.filter(txn => txn.date <= dateTo)
  }
  
  // Search filter
  if (search) {
    const searchLower = search.toLowerCase()
    filteredTransactions = filteredTransactions.filter(txn =>
      txn.description.toLowerCase().includes(searchLower) ||
      txn.reference.toLowerCase().includes(searchLower) ||
      txn.category.toLowerCase().includes(searchLower)
    )
  }
  
  // Sort by date descending
  filteredTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  
  // Pagination
  const total = filteredTransactions.length
  const totalPages = Math.ceil(total / limit)
  const offset = (page - 1) * limit
  const paginatedTransactions = filteredTransactions.slice(offset, offset + limit)
  
  // Calculate stats
  const unreconciledCount = bankTransactions.filter(t => !t.isReconciled).length
  const unreconciledAmount = bankTransactions
    .filter(t => !t.isReconciled)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  
  return NextResponse.json({
    success: true,
    data: paginatedTransactions,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
    stats: {
      totalTransactions: bankTransactions.length,
      unreconciledCount,
      unreconciledAmount,
    },
  })
}
