import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Generate unique payment number
async function generatePaymentNumber() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  
  const lastPayment = await db.supplierPayment.findFirst({
    where: { number: { startsWith: `PAY-${year}${month}` } },
    orderBy: { number: 'desc' }
  })
  
  if (lastPayment) {
    const lastNum = parseInt(lastPayment.number.split('-').pop() || '0')
    return `PAY-${year}${month}-${String(lastNum + 1).padStart(4, '0')}`
  }
  
  return `PAY-${year}${month}-0001`
}

// GET /api/supplier/settlements - Get supplier payments/settlements
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get('supplierId')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!supplierId) {
      return NextResponse.json({ error: 'Supplier ID is required' }, { status: 400 })
    }

    const where: any = { supplierId }

    if (status) {
      where.status = status
    }

    if (type) {
      where.settlementType = type
    }

    if (search) {
      where.OR = [
        { number: { contains: search } },
        { reference: { contains: search } }
      ]
    }

    const [payments, total] = await Promise.all([
      db.supplierPayment.findMany({
        where,
        include: {
          invoice: {
            select: { number: true, buyerName: true, totalAmount: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      db.supplierPayment.count({ where })
    ])

    // Get settlement account info
    const account = await db.supplierSettlementAccount.findUnique({
      where: { supplierId }
    })

    // Calculate stats
    const stats = {
      total,
      pending: await db.supplierPayment.count({ where: { supplierId, status: 'pending' } }),
      processing: await db.supplierPayment.count({ where: { supplierId, status: 'processing' } }),
      completed: await db.supplierPayment.count({ where: { supplierId, status: 'completed' } }),
      failed: await db.supplierPayment.count({ where: { supplierId, status: 'failed' } }),
      totalPaid: await db.supplierPayment.aggregate({
        where: { supplierId, status: 'completed' },
        _sum: { netAmount: true }
      }),
      pendingAmount: await db.supplierPayment.aggregate({
        where: { supplierId, status: { in: ['pending', 'processing'] } },
        _sum: { amount: true }
      }),
      thisMonth: await db.supplierPayment.aggregate({
        where: {
          supplierId,
          status: 'completed',
          processedAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        },
        _sum: { netAmount: true }
      })
    }

    // Get invoice stats
    const invoiceStats = {
      outstanding: await db.supplierInvoice.aggregate({
        where: { supplierId, status: { in: ['submitted', 'approved', 'partial'] } },
        _sum: { balanceDue: true }
      }),
      overdue: await db.supplierInvoice.aggregate({
        where: {
          supplierId,
          status: 'overdue'
        },
        _sum: { balanceDue: true }
      })
    }

    return NextResponse.json({
      payments,
      total,
      account,
      stats: {
        ...stats,
        totalPaid: stats.totalPaid._sum.netAmount || 0,
        pendingAmount: stats.pendingAmount._sum.amount || 0,
        thisMonth: stats.thisMonth._sum.netAmount || 0,
        outstandingInvoices: invoiceStats.outstanding._sum.balanceDue || 0,
        overdueInvoices: invoiceStats.overdue._sum.balanceDue || 0
      }
    })
  } catch (error) {
    console.error('Error fetching settlements:', error)
    return NextResponse.json({ error: 'Failed to fetch settlements' }, { status: 500 })
  }
}

// POST /api/supplier/settlements - Record a payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { supplierId, invoiceId, amount, paymentMethod, reference, settlementType, notes } = body

    // Calculate fees based on settlement type
    let fees = 0
    switch (settlementType) {
      case 'instant':
        fees = amount * 0.025 // 2.5% instant fee
        break
      case 'net30':
        fees = 0 // No fee for net30
        break
      default:
        fees = amount * 0.01 // 1% standard fee
    }

    const netAmount = amount - fees

    const payment = await db.supplierPayment.create({
      data: {
        number: await generatePaymentNumber(),
        supplierId,
        invoiceId,
        amount,
        paymentMethod: paymentMethod || 'bank_transfer',
        reference,
        settlementType: settlementType || 'standard',
        fees,
        netAmount,
        status: 'pending',
        notes
      },
      include: {
        invoice: { select: { number: true, buyerName: true } }
      }
    })

    return NextResponse.json({ payment })
  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
  }
}

// PUT /api/supplier/settlements - Update payment status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, action, ...updates } = body

    const payment = await db.supplierPayment.findUnique({
      where: { id }
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    let newStatus = payment.status
    let updateData: any = {}

    switch (action) {
      case 'process':
        newStatus = 'processing'
        break

      case 'complete':
        newStatus = 'completed'
        updateData.processedAt = new Date()

        // If linked to invoice, update invoice payment status
        if (payment.invoiceId) {
          const invoice = await db.supplierInvoice.findUnique({
            where: { id: payment.invoiceId }
          })
          if (invoice) {
            const newAmountPaid = invoice.amountPaid + payment.amount
            const newBalanceDue = invoice.totalAmount - newAmountPaid

            await db.supplierInvoice.update({
              where: { id: payment.invoiceId },
              data: {
                amountPaid: newAmountPaid,
                balanceDue: Math.max(0, newBalanceDue),
                status: newBalanceDue <= 0 ? 'paid' : 'partial',
                paidAt: newBalanceDue <= 0 ? new Date() : undefined
              }
            })
          }
        }
        break

      case 'fail':
        newStatus = 'failed'
        updateData.failureReason = updates.failureReason
        break

      case 'reverse':
        newStatus = 'reversed'
        // Reverse the invoice payment if applicable
        if (payment.invoiceId) {
          const invoice = await db.supplierInvoice.findUnique({
            where: { id: payment.invoiceId }
          })
          if (invoice) {
            const newAmountPaid = invoice.amountPaid - payment.amount
            const newBalanceDue = invoice.totalAmount - newAmountPaid

            await db.supplierInvoice.update({
              where: { id: payment.invoiceId },
              data: {
                amountPaid: Math.max(0, newAmountPaid),
                balanceDue: newBalanceDue,
                status: 'approved'
              }
            })
          }
        }
        break
    }

    const updated = await db.supplierPayment.update({
      where: { id },
      data: {
        ...updateData,
        ...updates,
        status: newStatus
      }
    })

    return NextResponse.json({ payment: updated })
  } catch (error) {
    console.error('Error updating payment:', error)
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 })
  }
}
