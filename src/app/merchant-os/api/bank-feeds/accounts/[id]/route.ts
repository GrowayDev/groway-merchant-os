import { NextRequest, NextResponse } from 'next/server'

// In-memory store (imported from parent route - in production this would be a database)
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

// GET /api/merchant-os/api/bank-feeds/accounts/[id]
export async function GET(
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
  
  return NextResponse.json({
    success: true,
    data: account,
  })
}

// PUT /api/merchant-os/api/bank-feeds/accounts/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const accountIndex = bankAccounts.findIndex(acc => acc.id === id)
  
  if (accountIndex === -1) {
    return NextResponse.json({
      success: false,
      error: 'Bank account not found',
    }, { status: 404 })
  }
  
  try {
    const body = await request.json()
    const { accountHolderName, accountType, connectionStatus } = body
    
    bankAccounts[accountIndex] = {
      ...bankAccounts[accountIndex],
      ...(accountHolderName && { accountHolderName }),
      ...(accountType && { accountType }),
      ...(connectionStatus && { connectionStatus }),
      updatedAt: new Date().toISOString(),
    }
    
    return NextResponse.json({
      success: true,
      data: bankAccounts[accountIndex],
      message: 'Bank account updated successfully',
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to update bank account',
    }, { status: 500 })
  }
}

// DELETE /api/merchant-os/api/bank-feeds/accounts/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const accountIndex = bankAccounts.findIndex(acc => acc.id === id)
  
  if (accountIndex === -1) {
    return NextResponse.json({
      success: false,
      error: 'Bank account not found',
    }, { status: 404 })
  }
  
  bankAccounts.splice(accountIndex, 1)
  
  return NextResponse.json({
    success: true,
    message: 'Bank account deleted successfully',
  })
}
