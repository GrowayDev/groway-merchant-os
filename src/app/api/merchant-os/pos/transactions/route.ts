import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

/**
 * GET /api/merchant-os/pos/transactions
 * List transactions with filtering, search, and pagination
 * 
 * Query Parameters:
 * - merchantId: (required) Filter by merchant
 * - branchId: Filter by branch
 * - type: Filter by type (sale, refund, void)
 * - status: Filter by status (pending, completed, cancelled, refunded, voided)
 * - paymentMethod: Filter by payment method (cash, card, qr, wallet)
 * - startDate: Filter from date (YYYY-MM-DD)
 * - endDate: Filter to date (YYYY-MM-DD)
 * - search: Search by transaction number or customer name
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const merchantId = searchParams.get('merchantId')
    const branchId = searchParams.get('branchId')
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const paymentMethod = searchParams.get('paymentMethod')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID required' }, { status: 400 })
    }

    // Build where clause
    const where: Prisma.TransactionWhereInput = {
      merchantId,
    }
    
    if (branchId) where.branchId = branchId
    if (type) where.type = type
    if (status) where.status = status
    if (paymentMethod) where.paymentMethod = paymentMethod

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        // Include the entire end date
        const endDateTime = new Date(endDate)
        endDateTime.setHours(23, 59, 59, 999)
        where.createdAt.lte = endDateTime
      }
    }

    // Search filter
    if (search) {
      where.OR = [
        { number: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get transactions with items
    const transactions = await db.transaction.findMany({
      where,
      include: {
        TransactionItem: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    })

    const total = await db.transaction.count({ where })
    const totalPages = Math.ceil(total / limit)

    // Get summary stats
    const stats = await db.transaction.aggregate({
      where: {
        merchantId,
        status: 'completed',
      },
      _count: { id: true },
      _sum: { total: true },
    })

    return NextResponse.json({
      success: true,
      data: transactions.map(txn => ({
        id: txn.id,
        number: txn.number,
        type: txn.type,
        status: txn.status,
        customerId: txn.customerId,
        customerName: txn.customerName,
        customerPhone: txn.customerPhone,
        subtotal: txn.subtotal,
        discount: txn.discount,
        taxAmount: txn.taxAmount,
        total: txn.total,
        paymentMethod: txn.paymentMethod,
        paymentReference: txn.paymentReference,
        tipAmount: txn.tipAmount,
        tableNumber: txn.tableNumber,
        staffId: txn.staffId,
        staffName: txn.staffName,
        notes: txn.notes,
        completedAt: txn.completedAt,
        cancelledAt: txn.cancelledAt,
        refundedAt: txn.refundedAt,
        createdAt: txn.createdAt,
        items: txn.TransactionItem.map(item => ({
          id: item.id,
          productId: item.productId,
          sku: item.sku,
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          taxRate: item.taxRate,
          taxAmount: item.taxAmount,
          total: item.total,
          modifiers: item.modifiers ? JSON.parse(item.modifiers) : null,
        })),
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      stats: {
        totalCompleted: stats._count.id || 0,
        totalRevenue: stats._sum.total || 0,
      },
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch transactions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
