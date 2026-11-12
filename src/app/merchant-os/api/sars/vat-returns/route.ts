import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Date validation helper
const isValidDate = (date: string): boolean => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(date)) return false
  const parsed = new Date(date)
  return !isNaN(parsed.getTime())
}

// GET /api/sars/vat-returns - List VAT returns with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const status = searchParams.get('status')
    const periodStart = searchParams.get('periodStart')
    const periodEnd = searchParams.get('periodEnd')

    // Build where clause
    const where: Record<string, unknown> = {}
    
    if (merchantId) {
      where.merchantId = merchantId
    }
    
    if (status) {
      const validStatuses = ['draft', 'ready', 'submitted', 'paid', 'refunded']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        )
      }
      where.status = status
    }

    if (periodStart && periodEnd) {
      // Filter by period range
      if (!isValidDate(periodStart) || !isValidDate(periodEnd)) {
        return NextResponse.json(
          { error: 'Invalid date format for periodStart or periodEnd. Use YYYY-MM-DD' },
          { status: 400 }
        )
      }
      where.OR = [
        { periodStart: { gte: periodStart, lte: periodEnd } },
        { periodEnd: { gte: periodStart, lte: periodEnd } }
      ]
    }

    const vatReturns = await db.vatReturnSubmission.findMany({
      where,
      orderBy: [
        { periodStart: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(vatReturns)
  } catch (error) {
    console.error('Error fetching VAT returns:', error)
    return NextResponse.json(
      { error: 'Failed to fetch VAT returns' },
      { status: 500 }
    )
  }
}

// POST /api/sars/vat-returns - Create a new VAT return
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      merchantId,
      periodStart,
      periodEnd,
      outputVat,
      inputVat,
      totalSales,
      capitalGoods,
      totalPurchases,
      exports,
      zeroRated,
      paymentDueDate,
      status
    } = body

    // Validate required fields
    if (!merchantId || !periodStart || !periodEnd) {
      return NextResponse.json(
        { error: 'Missing required fields: merchantId, periodStart, periodEnd' },
        { status: 400 }
      )
    }

    // Validate date formats
    if (!isValidDate(periodStart)) {
      return NextResponse.json(
        { error: 'Invalid periodStart format. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }

    if (!isValidDate(periodEnd)) {
      return NextResponse.json(
        { error: 'Invalid periodEnd format. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }

    // Validate paymentDueDate if provided
    if (paymentDueDate && !isValidDate(paymentDueDate)) {
      return NextResponse.json(
        { error: 'Invalid paymentDueDate format. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }

    // Validate period order
    if (new Date(periodStart) >= new Date(periodEnd)) {
      return NextResponse.json(
        { error: 'periodStart must be before periodEnd' },
        { status: 400 }
      )
    }

    // Check for existing VAT return for this period
    const existing = await db.vatReturnSubmission.findUnique({
      where: {
        merchantId_periodStart_periodEnd: {
          merchantId,
          periodStart,
          periodEnd
        }
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'VAT return already exists for this period. Use PUT to update.' },
        { status: 409 }
      )
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ['draft', 'ready', 'submitted', 'paid', 'refunded']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Calculate netVat = outputVat - inputVat
    const outputVatValue = outputVat ?? 0
    const inputVatValue = inputVat ?? 0
    const netVat = outputVatValue - inputVatValue

    const vatReturn = await db.vatReturnSubmission.create({
      data: {
        merchantId,
        periodStart,
        periodEnd,
        outputVat: outputVatValue,
        inputVat: inputVatValue,
        netVat,
        totalSales: totalSales ?? 0,
        capitalGoods: capitalGoods ?? 0,
        totalPurchases: totalPurchases ?? 0,
        exports: exports ?? 0,
        zeroRated: zeroRated ?? 0,
        status: status ?? 'draft',
        paymentDueDate
      }
    })

    return NextResponse.json(vatReturn, { status: 201 })
  } catch (error) {
    console.error('Error creating VAT return:', error)
    return NextResponse.json(
      { error: 'Failed to create VAT return' },
      { status: 500 }
    )
  }
}
