import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

// Rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000
const RATE_LIMIT_MAX = 100

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

// GET /api/gopay/settlements - List settlements
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 'unknown'
    const rateLimit = checkRateLimit(ip)
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const status = searchParams.get('status')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    // Build where clause
    const where: Record<string, unknown> = {}
    if (merchantId) where.merchantId = merchantId
    if (status) where.status = status
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) (where.createdAt as Record<string, string>).gte = dateFrom
      if (dateTo) (where.createdAt as Record<string, string>).lte = dateTo
    }

    // Get total count
    const total = await db.GopaySettlement.count({ where })

    // Get settlements
    const settlements = await db.GopaySettlement.findMany({
      where,
      include: {
        merchant: {
          select: {
            id: true,
            businessName: true,
            tradingName: true,
            merchantCode: true,
            bankName: true,
            bankAccount: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    // Get aggregated stats
    const stats = await db.GopaySettlement.aggregate({
      where,
      _count: { id: true },
      _sum: { amount: true, feeAmount: true, netAmount: true }
    })

    // Get pending settlements
    const pendingStats = await db.GopaySettlement.aggregate({
      where: { status: 'pending' },
      _count: { id: true },
      _sum: { amount: true }
    })

    return NextResponse.json({
      success: true,
      data: settlements.map(s => ({
        id: s.id,
        settlementReference: s.settlementReference,
        merchantId: s.merchantId,
        merchant: s.merchant,
        periodStart: s.periodStart,
        periodEnd: s.periodEnd,
        amount: s.amount,
        feeAmount: s.feeAmount,
        feePercent: s.feePercent,
        netAmount: s.netAmount,
        transactionCount: s.transactionCount,
        status: s.status,
        processedAt: s.processedAt,
        paidAt: s.paidAt,
        paymentReference: s.paymentReference,
        createdAt: s.createdAt
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        total: stats._count.id,
        totalAmount: stats._sum.amount || 0,
        totalFees: stats._sum.feeAmount || 0,
        totalNet: stats._sum.netAmount || 0,
        pending: {
          count: pendingStats._count.id,
          amount: pendingStats._sum.amount || 0
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
    console.error('Error fetching settlements:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settlements' },
      { status: 500 }
    )
  }
}

// POST /api/gopay/settlements - Create a new settlement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      merchantId,
      periodStart,
      periodEnd,
      amount,
      feePercent = 2.5,
      transactionCount
    } = body

    // Validate required fields
    if (!merchantId || !periodStart || !periodEnd || !amount) {
      return NextResponse.json(
        { success: false, error: 'Merchant ID, period start, period end, and amount are required' },
        { status: 400 }
      )
    }

    // Get merchant
    const merchant = await db.GopayMerchant.findUnique({
      where: { id: merchantId }
    })

    if (!merchant) {
      return NextResponse.json(
        { success: false, error: 'Merchant not found' },
        { status: 404 }
      )
    }

    // Calculate fees
    const feeAmount = amount * (feePercent / 100)
    const netAmount = amount - feeAmount

    // Generate settlement reference
    const settlementReference = `SET${Date.now().toString().slice(-10)}${nanoid(4).toUpperCase()}`

    // Create settlement
    const settlement = await db.GopaySettlement.create({
      data: {
        id: `set_${nanoid(12)}`,
        settlementReference,
        merchantId,
        periodStart,
        periodEnd,
        amount,
        feeAmount,
        feePercent,
        netAmount,
        transactionCount: transactionCount || 0,
        status: 'pending'
      }
    })

    // Create audit log
    await db.auditLogEntry.create({
      data: {
        id: `audit_${Date.now()}_${nanoid(8)}`,
        action: 'gopay_settlement_created',
        category: 'gopay',
        targetType: 'settlement',
        targetId: settlement.id,
        details: JSON.stringify({
          merchantId,
          settlementReference,
          amount,
          netAmount
        }),
        createdAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: settlement,
      message: 'Settlement created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating settlement:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create settlement' },
      { status: 500 }
    )
  }
}

// PUT /api/gopay/settlements - Process a settlement (update status)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { settlementId, status, paymentReference } = body

    if (!settlementId || !status) {
      return NextResponse.json(
        { success: false, error: 'Settlement ID and status are required' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {
      status,
      updatedAt: new Date()
    }

    if (status === 'processing') {
      updateData.processedAt = new Date()
    }

    if (status === 'paid') {
      updateData.paidAt = new Date()
      if (paymentReference) updateData.paymentReference = paymentReference
    }

    const settlement = await db.GopaySettlement.update({
      where: { id: settlementId },
      data: updateData
    })

    // Create audit log
    await db.auditLogEntry.create({
      data: {
        id: `audit_${Date.now()}_${nanoid(8)}`,
        action: 'gopay_settlement_updated',
        category: 'gopay',
        targetType: 'settlement',
        targetId: settlementId,
        details: JSON.stringify({
          status,
          paymentReference
        }),
        createdAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: settlement,
      message: 'Settlement updated successfully'
    })
  } catch (error) {
    console.error('Error updating settlement:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update settlement' },
      { status: 500 }
    )
  }
}
