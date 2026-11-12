import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getMerchantIdWithDevFallback } from '@/lib/auth-context'

// GET /api/accounting/bank-accounts - List bank accounts and transactions
export async function GET(request: NextRequest) {
  try {
    // Get merchant ID from auth context with dev fallback
    const merchantId = getMerchantIdWithDevFallback(request)
    if (!merchantId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      }, { status: 401 })
    }

    // Get bank accounts from chart of accounts (accounts with subType 'Bank Account')
    const bankAccountRecords = await db.account.findMany({
      where: {
        merchantId,
        subType: 'Bank Account',
        isActive: true,
      },
      orderBy: { code: 'asc' },
    })

    // Transform to bank account format expected by the frontend
    const accounts = bankAccountRecords.map(acc => ({
      id: acc.id,
      bankName: acc.name.replace(' Business Cheque', '').replace(' Business Savings', '').replace(' Cheque', '').replace(' Savings', ''),
      accountNumber: '****' + acc.code.slice(-4),
      accountType: acc.name.toLowerCase().includes('savings') ? 'savings' : 'cheque' as 'cheque' | 'savings',
      balance: acc.balance,
      lastReconciled: acc.updatedAt,
      statementBalance: acc.balance,
      difference: 0,
      status: 'connected' as const,
      currency: acc.currency || 'ZAR',
      branchCode: '000000',
    }))

    // Get related bank transactions (from journal entries involving bank accounts)
    const bankAccountIds = bankAccountRecords.map(a => a.id)
    
    // For now, return empty transactions - can be enhanced with actual bank transaction tracking
    const transactions: any[] = []

    return NextResponse.json({
      success: true,
      accounts,
      transactions,
      summary: {
        totalAccounts: accounts.length,
        totalBalance: accounts.reduce((sum, a) => sum + a.balance, 0),
        connectedAccounts: accounts.filter(a => a.status === 'connected').length,
      }
    })
  } catch (error) {
    console.error('Error fetching bank accounts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bank accounts' },
      { status: 500 }
    )
  }
}
