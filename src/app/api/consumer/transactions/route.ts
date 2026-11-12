import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, getUserId, unauthorizedResponse } from '@/lib/auth-context'

// In-memory transaction storage
const transactionsStore: Map<string, any[]> = new Map()

// Transaction types and categories
const transactionCategories = {
  qr_pay: { icon: 'qr', color: '#4CAF50', label: 'QR Payment' },
  p2p_send: { icon: 'send', color: '#2196F3', label: 'Money Sent' },
  p2p_receive: { icon: 'receive', color: '#8BC34A', label: 'Money Received' },
  payshap_send: { icon: 'bank', color: '#1565C0', label: 'PayShap Sent' },
  payshap_receive: { icon: 'bank', color: '#42A5F5', label: 'PayShap Received' },
  billpay: { icon: 'receipt', color: '#FF9800', label: 'Bill Payment' },
  airtime: { icon: 'phone', color: '#9C27B0', label: 'Airtime' },
  data: { icon: 'wifi', color: '#673AB7', label: 'Data Bundle' },
  topup: { icon: 'wallet', color: '#00BCD4', label: 'Wallet Top-up' },
  withdrawal: { icon: 'banknote', color: '#795548', label: 'Withdrawal' },
  ewa: { icon: 'clock', color: '#2196F3', label: 'Pay+ Access' },
  savings_deposit: { icon: 'piggy', color: '#9C27B0', label: 'Savings Deposit' },
  savings_withdraw: { icon: 'piggy', color: '#E91E63', label: 'Savings Withdrawal' },
  card_payment: { icon: 'card', color: '#607D8B', label: 'Card Payment' },
  bnpl: { icon: 'shopping', color: '#FF5722', label: 'BNPL Purchase' },
  voucher: { icon: 'gift', color: '#E91E63', label: 'Voucher' },
  refund: { icon: 'refresh', color: '#4CAF50', label: 'Refund' },
  fee: { icon: 'alert', color: '#F44336', label: 'Fee' },
}

// GET /api/consumer/transactions - Get all transactions
export async function GET(request: NextRequest) {
  // Get authenticated context
  const context = await getAuthContext(request)
  if (!context) {
    return unauthorizedResponse()
  }
  
  const { searchParams } = new URL(request.url)
  
  // Get userId from params or context
  const userIdResult = getUserId(searchParams, context)
  if (userIdResult instanceof NextResponse) {
    return userIdResult
  }
  const userId = userIdResult
  
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')
  const type = searchParams.get('type')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  
  // Get or create transactions
  let transactions = transactionsStore.get(userId)
  
  if (!transactions) {
    // Create demo transactions
    const now = Date.now()
    const day = 24 * 60 * 60 * 1000
    
    transactions = [
      {
        id: `tx-${now}-1`,
        type: 'qr_pay',
        direction: 'debit',
        amountCents: 45000,
        feeCents: 0,
        counterpartyName: 'Sipho Spaza Shop',
        counterpartyId: 'merchant-001',
        description: 'QR Payment',
        category: 'qr_pay',
        status: 'completed',
        reference: `QR${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: `tx-${now}-2`,
        type: 'p2p_receive',
        direction: 'credit',
        amountCents: 500000,
        feeCents: 0,
        counterpartyName: 'John Dube',
        counterpartyPhone: '+27821234567',
        description: 'Money Received',
        category: 'p2p_receive',
        status: 'completed',
        reference: `P2P${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        createdAt: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: `tx-${now}-3`,
        type: 'billpay',
        direction: 'debit',
        amountCents: 85000,
        feeCents: 0,
        counterpartyName: 'City Power',
        description: 'Electricity - 123456789',
        category: 'billpay',
        status: 'completed',
        reference: `BP${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        createdAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: `tx-${now}-4`,
        type: 'airtime',
        direction: 'debit',
        amountCents: 10000,
        feeCents: 0,
        counterpartyName: 'Vodacom',
        description: 'Airtime - +27821234567',
        category: 'airtime',
        status: 'completed',
        reference: `AT${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: `tx-${now}-5`,
        type: 'ewa',
        direction: 'credit',
        amountCents: 250000,
        feeCents: 7500,
        counterpartyName: 'Pay+ Wage Access',
        description: 'Earned Wage Withdrawal',
        category: 'ewa',
        status: 'completed',
        reference: `EWA${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: `tx-${now}-6`,
        type: 'savings_deposit',
        direction: 'debit',
        amountCents: 50000,
        feeCents: 0,
        counterpartyName: 'Emergency Fund',
        description: 'Savings Deposit',
        category: 'savings_deposit',
        status: 'completed',
        reference: `SAV${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        createdAt: new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: `tx-${now}-7`,
        type: 'payshap_send',
        direction: 'debit',
        amountCents: 150000,
        feeCents: 0,
        counterpartyName: 'Sarah Mokoena',
        counterpartyProxy: 'sarah@email.com',
        description: 'PayShap Transfer',
        category: 'payshap_send',
        status: 'completed',
        reference: `PS${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: `tx-${now}-8`,
        type: 'topup',
        direction: 'credit',
        amountCents: 1000000,
        feeCents: 0,
        counterpartyName: 'FNB Bank Transfer',
        description: 'Wallet Top-up via EFT',
        category: 'topup',
        status: 'completed',
        reference: `TOP${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        createdAt: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]
    transactionsStore.set(userId, transactions)
  }
  
  // Apply filters
  let filtered = [...transactions]
  
  if (type) {
    filtered = filtered.filter(tx => tx.type === type)
  }
  
  if (startDate) {
    const start = new Date(startDate).getTime()
    filtered = filtered.filter(tx => new Date(tx.createdAt).getTime() >= start)
  }
  
  if (endDate) {
    const end = new Date(endDate).getTime()
    filtered = filtered.filter(tx => new Date(tx.createdAt).getTime() <= end)
  }
  
  // Paginate
  const total = filtered.length
  const paginated = filtered.slice(offset, offset + limit)
  
  return NextResponse.json({
    success: true,
    data: {
      transactions: paginated,
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    }
  })
}

// POST /api/consumer/transactions - Create a new transaction
export async function POST(request: NextRequest) {
  try {
    // Get authenticated context
    const context = await getAuthContext(request)
    if (!context) {
      return unauthorizedResponse()
    }
    
    const body = await request.json()
    const { userId: bodyUserId, ...transactionData } = body
    
    // Validate userId - use body param or context
    let userId = bodyUserId
    if (!userId) {
      userId = context.userId
    }
    
    // Security check: ensure user can only access their own data
    if (userId !== context.userId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }
    
    let transactions = transactionsStore.get(userId) || []
    
    const newTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...transactionData,
      reference: `${transactionData.type?.toUpperCase()?.slice(0,3) || 'TX'}${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      status: 'completed',
      createdAt: new Date().toISOString(),
    }
    
    transactions.unshift(newTransaction)
    transactionsStore.set(userId, transactions)
    
    return NextResponse.json({
      success: true,
      data: newTransaction
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to create transaction'
    }, { status: 500 })
  }
}

// GET transaction details
export async function getTransactionDetails(userId: string, transactionId: string) {
  const transactions = transactionsStore.get(userId) || []
  return transactions.find(tx => tx.id === transactionId)
}
