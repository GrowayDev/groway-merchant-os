import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verify } from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// Rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000
const RATE_LIMIT_MAX = 200

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const record = rateLimitStore.get(ip)
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetTime: now + RATE_LIMIT_WINDOW }
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime }
  }
  
  record.count++
  return { allowed: true, remaining: RATE_LIMIT_MAX - record.count, resetTime: record.resetTime }
}

interface TransactionFilters {
  category?: string
  status?: string
  direction?: string
  transactionType?: string
  dateFrom?: Date
  dateTo?: Date
  minAmount?: number
  maxAmount?: number
  search?: string
}

// GET /api/wallet/transactions - Get transaction history with pagination
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 'unknown'
    const rateLimit = checkRateLimit(ip)
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetTime.toString()
          }
        }
      )
    }

    // Authentication
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let decoded: { userId: string }
    try {
      decoded = verify(token, JWT_SECRET) as { userId: string }
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const cursor = searchParams.get('cursor')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build filters
    const filters: TransactionFilters = {}
    
    const category = searchParams.get('category')
    if (category && category !== 'all') filters.category = category
    
    const status = searchParams.get('status')
    if (status && status !== 'all') filters.status = status
    
    const direction = searchParams.get('direction')
    if (direction && direction !== 'all') filters.direction = direction
    
    const transactionType = searchParams.get('transactionType')
    if (transactionType && transactionType !== 'all') filters.transactionType = transactionType
    
    const dateFrom = searchParams.get('dateFrom')
    if (dateFrom) filters.dateFrom = new Date(dateFrom)
    
    const dateTo = searchParams.get('dateTo')
    if (dateTo) filters.dateTo = new Date(dateTo + 'T23:59:59.999Z')
    
    const minAmount = searchParams.get('minAmount')
    if (minAmount) filters.minAmount = parseFloat(minAmount)
    
    const maxAmount = searchParams.get('maxAmount')
    if (maxAmount) filters.maxAmount = parseFloat(maxAmount)
    
    const search = searchParams.get('search')
    if (search) filters.search = search.toLowerCase()

    // Build where clause
    const where: Record<string, unknown> = { userId: decoded.userId }
    
    // Note: SQLite is case-insensitive by default, so no need for mode option
    if (filters.category) where.category = filters.category
    if (filters.status) where.status = filters.status
    if (filters.direction) where.direction = filters.direction
    if (filters.transactionType) where.transactionType = filters.transactionType
    
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {}
      if (filters.dateFrom) (where.createdAt as Record<string, Date>).gte = filters.dateFrom
      if (filters.dateTo) (where.createdAt as Record<string, Date>).lte = filters.dateTo
    }
    
    if (filters.minAmount || filters.maxAmount) {
      const minCents = filters.minAmount ? BigInt(Math.round(filters.minAmount * 100)) : null
      const maxCents = filters.maxAmount ? BigInt(Math.round(filters.maxAmount * 100)) : null
      
      if (minCents || maxCents) {
        where.netAmountCents = {}
        if (minCents) (where.netAmountCents as Record<string, bigint>).gte = minCents
        if (maxCents) (where.netAmountCents as Record<string, bigint>).lte = maxCents
      }
    }

    // Get total count
    const total = await db.consumerTransaction.count({ where })

    // Build query with cursor or offset pagination
    const query: Record<string, unknown> = {
      where,
      orderBy: { [sortBy]: sortOrder },
      take: limit + 1
    }

    if (cursor) {
      query.cursor = { id: cursor }
      query.skip = 1
    } else {
      query.skip = (page - 1) * limit
    }

    let transactions = await db.consumerTransaction.findMany(query)

    // Apply search filter in-memory for better performance
    if (filters.search) {
      transactions = transactions.filter((tx: Record<string, unknown>) => {
        const searchFields = [
          tx.description,
          tx.counterpartyName,
          tx.merchantName,
          tx.reference,
          tx.category
        ].filter(Boolean).map(f => String(f).toLowerCase())
        
        return searchFields.some(f => f.includes(filters.search!))
      })
    }

    // Determine pagination info
    const hasMore = transactions.length > limit
    const results = hasMore ? transactions.slice(0, limit) : transactions
    const nextCursor = hasMore && results.length > 0 ? results[results.length - 1].id : null

    // Calculate summary stats
    const stats = await db.consumerTransaction.aggregate({
      where,
      _count: { id: true },
      _sum: {
        amountCents: true,
        feeCents: true,
        netAmountCents: true
      }
    })

    // Format response
    const formattedTransactions = results.map((tx: Record<string, unknown>) => ({
      id: tx.id,
      transactionType: tx.transactionType,
      direction: tx.direction,
      amount: Number(tx.amountCents) / 100,
      fee: Number(tx.feeCents) / 100,
      netAmount: Number(tx.netAmountCents) / 100,
      absoluteAmount: Math.abs(Number(tx.netAmountCents)) / 100,
      currency: tx.currency || 'ZAR',
      status: tx.status,
      category: tx.category || 'Other',
      description: tx.description,
      reference: tx.reference,
      counterparty: {
        id: tx.counterpartyId,
        name: tx.counterpartyName,
        phone: tx.counterpartyPhone,
        type: tx.counterpartyType
      },
      merchant: {
        id: tx.merchantId,
        name: tx.merchantName
      },
      paymentMethod: tx.paymentMethod,
      cardLastFour: tx.cardLastFour,
      createdAt: tx.createdAt,
      processedAt: tx.processedAt,
      completedAt: tx.completedAt,
      disputed: !!tx.disputedAt,
      disputeStatus: tx.disputeStatus
    }))

    return NextResponse.json({
      success: true,
      data: {
        transactions: formattedTransactions,
        pagination: {
          page: cursor ? undefined : page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore,
          nextCursor,
          prevCursor: null
        },
        summary: {
          count: stats._count.id || 0,
          totalAmount: Number(stats._sum.amountCents || 0) / 100,
          totalFees: Number(stats._sum.feeCents || 0) / 100,
          netAmount: Number(stats._sum.netAmountCents || 0) / 100
        },
        filters: {
          category: filters.category || null,
          status: filters.status || null,
          direction: filters.direction || null,
          transactionType: filters.transactionType || null,
          dateFrom: filters.dateFrom?.toISOString() || null,
          dateTo: filters.dateTo?.toISOString() || null,
          minAmount: filters.minAmount || null,
          maxAmount: filters.maxAmount || null,
          search: filters.search || null
        }
      }
    }, {
      headers: {
        'X-Total-Count': total.toString(),
        'X-Page': page.toString(),
        'X-Per-Page': limit.toString(),
        'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString()
      }
    })
  } catch (error) {
    console.error('Wallet transactions error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}
