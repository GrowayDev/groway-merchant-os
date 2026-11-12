import { NextRequest, NextResponse } from 'next/server'

// Bank Account Type
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
  createdAt: string
  updatedAt: string
}

// In-memory store for demo purposes
let bankAccounts: BankAccount[] = [
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
    createdAt: '2025-06-01T10:00:00Z',
    updatedAt: '2026-01-15T14:30:00Z',
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
    createdAt: '2025-08-15T08:00:00Z',
    updatedAt: '2026-01-15T12:00:00Z',
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
    createdAt: '2025-09-01T14:00:00Z',
    updatedAt: '2026-01-14T18:00:00Z',
  },
]

const BANKS_CONFIG = {
  fnb: { name: 'FNB', branchCode: '250655' },
  capitec: { name: 'Capitec', branchCode: '470010' },
  standard_bank: { name: 'Standard Bank', branchCode: '051001' },
  absa: { name: 'Absa', branchCode: '632005' },
  nedbank: { name: 'Nedbank', branchCode: '198765' },
  investec: { name: 'Investec', branchCode: '580105' },
}

// GET /api/merchant-os/api/bank-feeds/accounts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  
  let filteredAccounts = bankAccounts
  
  if (status && status !== 'all') {
    filteredAccounts = bankAccounts.filter(acc => acc.connectionStatus === status)
  }
  
  return NextResponse.json({
    success: true,
    data: filteredAccounts,
    count: filteredAccounts.length,
  })
}

// POST /api/merchant-os/api/bank-feeds/accounts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bankCode, accountNumber, accountHolderName, accountType, apiKey, apiSecret } = body
    
    if (!bankCode || !accountNumber || !accountHolderName) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: bankCode, accountNumber, accountHolderName',
      }, { status: 400 })
    }
    
    // Validate bank code
    if (!BANKS_CONFIG[bankCode as keyof typeof BANKS_CONFIG]) {
      return NextResponse.json({
        success: false,
        error: 'Invalid bank code. Supported banks: fnb, capitec, standard_bank, absa, nedbank, investec',
      }, { status: 400 })
    }
    
    const bankConfig = BANKS_CONFIG[bankCode as keyof typeof BANKS_CONFIG]
    const maskedNumber = accountNumber.slice(0, 4) + '****' + accountNumber.slice(-4)
    
    const newAccount: BankAccount = {
      id: `ACC-${Date.now()}`,
      bankCode: bankCode as BankAccount['bankCode'],
      bankName: bankConfig.name,
      accountNumber,
      accountNumberMasked: maskedNumber,
      accountHolderName,
      accountType: accountType || 'cheque',
      lastSyncAt: null,
      connectionStatus: 'connected',
      balance: 0,
      currency: 'ZAR',
      branchCode: bankConfig.branchCode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    bankAccounts.push(newAccount)
    
    return NextResponse.json({
      success: true,
      data: newAccount,
      message: 'Bank account connected successfully',
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to create bank account',
    }, { status: 500 })
  }
}
