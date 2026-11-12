import { NextRequest, NextResponse } from 'next/server'

// In-memory store
const bankAccounts: any[] = [
  {
    id: 'ACC-001',
    bankCode: 'fnb',
    bankName: 'FNB',
    accountNumber: '62847934521',
    accountNumberMasked: '6284****4521',
    accountHolderName: 'Groway Enterprises (Pty) Ltd',
    accountType: 'cheque',
    lastSyncAt: '2026-01-15T14:30:00',
    connectionStatus: 'connected',
    balance: 156780.45,
    currency: 'ZAR',
    branchCode: '250655',
  },
  {
    id: 'ACC-002',
    bankCode: 'capitec',
    bankName: 'Capitec',
    accountNumber: '10567892345',
    accountNumberMasked: '1056****9345',
    accountHolderName: 'Groway Enterprises (Pty) Ltd',
    accountType: 'savings',
    lastSyncAt: '2026-01-15T12:00:00',
    connectionStatus: 'connected',
    balance: 89450.00,
    currency: 'ZAR',
    branchCode: '470010',
  },
  {
    id: 'ACC-003',
    bankCode: 'standard_bank',
    bankName: 'Standard Bank',
    accountNumber: '0123456789',
    accountNumberMasked: '0123****6789',
    accountHolderName: 'Groway Enterprises (Pty) Ltd',
    accountType: 'cheque',
    lastSyncAt: '2026-01-14T18:00:00',
    connectionStatus: 'disconnected',
    balance: 45000.00,
    currency: 'ZAR',
    branchCode: '051001',
  },
]

// Sample transactions that would be synced
const sampleTransactions = [
  {
    id: 'TXN-NEW-001',
    bankAccountId: '',
    date: new Date().toISOString().split('T')[0],
    description: 'POS Settlement - Daily',
    reference: `POS-${Date.now()}`,
    amount: 12500.00,
    type: 'credit',
    category: 'Sales',
    isReconciled: false,
    balance: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'TXN-NEW-002',
    bankAccountId: '',
    date: new Date().toISOString().split('T')[0],
    description: 'Bank Charges - Monthly',
    reference: 'FEE-MONTHLY',
    amount: -250.00,
    type: 'debit',
    category: 'Bank Charges',
    isReconciled: false,
    balance: 0,
    createdAt: new Date().toISOString(),
  },
]

// POST /api/merchant-os/api/bank-feeds/accounts/[id]/sync
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const account = bankAccounts.find(acc => acc.id === id)
  
  if (!account) {
    return NextResponse.json({
      success: false,
      error: 'Bank account not found',
    }, { status: 404 })
  }
  
  if (account.connectionStatus !== 'connected') {
    return NextResponse.json({
      success: false,
      error: 'Account is not connected. Please reconnect first.',
    }, { status: 400 })
  }
  
  // Simulate sync delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Update last sync time
  account.lastSyncAt = new Date().toISOString()
  
  // Generate new transactions for demo
  const newTransactions = sampleTransactions.map(txn => ({
    ...txn,
    id: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    bankAccountId: id,
  }))
  
  return NextResponse.json({
    success: true,
    data: {
      account: {
        id: account.id,
        bankName: account.bankName,
        lastSyncAt: account.lastSyncAt,
        balance: account.balance + 12250, // Updated balance after new transactions
      },
      transactionsImported: newTransactions.length,
      transactions: newTransactions,
    },
    message: `Successfully synced ${newTransactions.length} new transactions`,
  })
}
