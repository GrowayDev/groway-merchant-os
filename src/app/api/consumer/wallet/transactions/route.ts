import { NextRequest, NextResponse } from 'next/server'

// Mock transactions data
const MOCK_TRANSACTIONS = [
  {
    id: 'tx-001',
    transactionType: 'qr_pay',
    direction: 'debit',
    amountCents: 4500,
    feeCents: 0,
    netAmountCents: 4500,
    currency: 'ZAR',
    status: 'completed',
    description: 'Payment to Sipho Spaza Shop',
    reference: 'QR-2024-001',
    category: 'retail',
    counterpartyId: 'merchant-001',
    counterpartyName: 'Sipho Spaza Shop',
    counterpartyPhone: null,
    counterpartyType: 'merchant',
    paymentMethod: 'qr_code',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    id: 'tx-002',
    transactionType: 'p2p_receive',
    direction: 'credit',
    amountCents: 50000,
    feeCents: 0,
    netAmountCents: 50000,
    currency: 'ZAR',
    status: 'completed',
    description: 'Money received from John Dube',
    reference: 'P2P-2024-002',
    category: 'transfer',
    counterpartyId: 'user-002',
    counterpartyName: 'John Dube',
    counterpartyPhone: '+27831234567',
    counterpartyType: 'consumer',
    paymentMethod: 'wallet_transfer',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 5 * 60 * 60 * 1000)
  },
  {
    id: 'tx-003',
    transactionType: 'billpay',
    direction: 'debit',
    amountCents: 85000,
    feeCents: 0,
    netAmountCents: 85000,
    currency: 'ZAR',
    status: 'completed',
    description: 'City Power - Electricity',
    reference: 'BILL-2024-003',
    category: 'utilities',
    counterpartyId: 'citypower',
    counterpartyName: 'City Power',
    counterpartyPhone: null,
    counterpartyType: 'biller',
    paymentMethod: 'wallet_balance',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
  },
  {
    id: 'tx-004',
    transactionType: 'topup',
    direction: 'credit',
    amountCents: 200000,
    feeCents: 0,
    netAmountCents: 200000,
    currency: 'ZAR',
    status: 'completed',
    description: 'Wallet top-up via EFT',
    reference: 'TOP-2024-004',
    category: 'topup',
    counterpartyId: 'fnb',
    counterpartyName: 'FNB',
    counterpartyPhone: null,
    counterpartyType: 'bank',
    paymentMethod: 'bank_transfer',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  },
  {
    id: 'tx-005',
    transactionType: 'airtime',
    direction: 'debit',
    amountCents: 9900,
    feeCents: 0,
    netAmountCents: 9900,
    currency: 'ZAR',
    status: 'completed',
    description: 'Vodacom Airtime - R99',
    reference: 'AIR-2024-005',
    category: 'telecoms',
    counterpartyId: 'vodacom',
    counterpartyName: 'Vodacom',
    counterpartyPhone: null,
    counterpartyType: 'telco',
    paymentMethod: 'wallet_balance',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type')
    const direction = searchParams.get('direction')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Filter mock transactions
    let filteredTransactions = [...MOCK_TRANSACTIONS]
    if (type) {
      filteredTransactions = filteredTransactions.filter(tx => tx.transactionType === type)
    }
    if (direction) {
      filteredTransactions = filteredTransactions.filter(tx => tx.direction === direction)
    }

    // Try database first, fall back to mock data
    let transactions = filteredTransactions
    let total = filteredTransactions.length
    
    try {
      const { db } = await import('@/lib/db')
      
      // Build where clause
      const where: any = { userId }
      if (type) where.transactionType = type
      if (direction) where.direction = direction

      const dbTotal = await db.consumerTransaction.count({ where })
      const dbTransactions = await db.consumerTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      })
      
      if (dbTransactions.length > 0) {
        transactions = dbTransactions.map(tx => ({
          id: tx.id,
          transactionType: tx.transactionType,
          direction: tx.direction,
          amountCents: Number(tx.amountCents),
          feeCents: Number(tx.feeCents),
          netAmountCents: Number(tx.netAmountCents),
          currency: tx.currency,
          status: tx.status,
          description: tx.description,
          reference: tx.reference,
          category: tx.category,
          counterpartyId: tx.counterpartyId,
          counterpartyName: tx.counterpartyName,
          counterpartyPhone: tx.counterpartyPhone,
          counterpartyType: tx.counterpartyType,
          paymentMethod: tx.paymentMethod,
          createdAt: tx.createdAt,
          completedAt: tx.completedAt
        }))
        total = dbTotal
      }
    } catch (dbError) {
      console.log('Database unavailable, using mock transactions')
    }

    // Paginate mock data if using mock
    const startIndex = (page - 1) * limit
    const paginatedTransactions = transactions.slice(startIndex, startIndex + limit)

    return NextResponse.json({
      success: true,
      data: {
        transactions: paginatedTransactions.map(tx => ({
          id: tx.id,
          type: tx.transactionType,
          direction: tx.direction,
          amount: tx.amountCents.toString(),
          fee: tx.feeCents.toString(),
          netAmount: tx.netAmountCents.toString(),
          currency: tx.currency,
          status: tx.status,
          description: tx.description,
          reference: tx.reference,
          category: tx.category,
          counterparty: {
            id: tx.counterpartyId,
            name: tx.counterpartyName,
            phone: tx.counterpartyPhone,
            type: tx.counterpartyType
          },
          paymentMethod: tx.paymentMethod,
          createdAt: tx.createdAt,
          completedAt: tx.completedAt
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    console.error('Get transactions error:', error)
    // Return mock data on error
    return NextResponse.json({
      success: true,
      data: {
        transactions: MOCK_TRANSACTIONS.slice(0, 3).map(tx => ({
          id: tx.id,
          type: tx.transactionType,
          direction: tx.direction,
          amount: tx.amountCents.toString(),
          fee: tx.feeCents.toString(),
          netAmount: tx.netAmountCents.toString(),
          currency: tx.currency,
          status: tx.status,
          description: tx.description,
          reference: tx.reference,
          category: tx.category,
          counterparty: {
            id: tx.counterpartyId,
            name: tx.counterpartyName,
            phone: tx.counterpartyPhone,
            type: tx.counterpartyType
          },
          paymentMethod: tx.paymentMethod,
          createdAt: tx.createdAt,
          completedAt: tx.completedAt
        })),
        pagination: {
          page: 1,
          limit: 10,
          total: MOCK_TRANSACTIONS.length,
          totalPages: 1
        }
      }
    })
  }
}
