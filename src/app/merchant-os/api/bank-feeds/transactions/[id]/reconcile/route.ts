import { NextRequest, NextResponse } from 'next/server'

// In-memory store
const bankTransactions: any[] = [
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

// POST /api/merchant-os/api/bank-feeds/transactions/[id]/reconcile
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const transactionIndex = bankTransactions.findIndex(txn => txn.id === id)
  
  if (transactionIndex === -1) {
    return NextResponse.json({
      success: false,
      error: 'Transaction not found',
    }, { status: 404 })
  }
  
  const transaction = bankTransactions[transactionIndex]
  
  if (transaction.isReconciled) {
    return NextResponse.json({
      success: false,
      error: 'Transaction is already reconciled',
    }, { status: 400 })
  }
  
  try {
    const body = await request.json()
    const { referenceType, referenceId, notes } = body
    
    if (!referenceType || !referenceId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: referenceType, referenceId',
      }, { status: 400 })
    }
    
    // Validate reference type
    if (!['sale', 'purchase', 'journal'].includes(referenceType)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid reference type. Must be: sale, purchase, or journal',
      }, { status: 400 })
    }
    
    // Update transaction
    bankTransactions[transactionIndex] = {
      ...transaction,
      isReconciled: true,
      reconciledTo: {
        type: referenceType,
        id: `REF-${Date.now()}`,
        reference: referenceId,
      },
      notes: notes || transaction.notes,
    }
    
    // In a real app, this would also create a journal entry linking
    // the bank transaction to the referenced sale/purchase/journal
    
    return NextResponse.json({
      success: true,
      data: bankTransactions[transactionIndex],
      message: 'Transaction reconciled successfully',
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to reconcile transaction',
    }, { status: 500 })
  }
}

// DELETE /api/merchant-os/api/bank-feeds/transactions/[id]/reconcile (Unreconcile)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const transactionIndex = bankTransactions.findIndex(txn => txn.id === id)
  
  if (transactionIndex === -1) {
    return NextResponse.json({
      success: false,
      error: 'Transaction not found',
    }, { status: 404 })
  }
  
  const transaction = bankTransactions[transactionIndex]
  
  if (!transaction.isReconciled) {
    return NextResponse.json({
      success: false,
      error: 'Transaction is not reconciled',
    }, { status: 400 })
  }
  
  // Unreconcile transaction
  bankTransactions[transactionIndex] = {
    ...transaction,
    isReconciled: false,
    reconciledTo: undefined,
  }
  
  return NextResponse.json({
    success: true,
    data: bankTransactions[transactionIndex],
    message: 'Transaction unreconciled successfully',
  })
}
