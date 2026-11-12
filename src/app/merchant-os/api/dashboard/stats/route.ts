import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withDevModeBypass } from '@/lib/auth-middleware'

// GET /merchant-os/api/dashboard/stats - Dashboard Statistics
export const GET = withDevModeBypass(async (request, { user, isDevBypass }) => {
  try {
    // Log warning if dev bypass is being used
    if (isDevBypass) {
      console.warn('[Auth] Using dev mode bypass for dashboard stats - not recommended for production')
    }

    const { searchParams } = new URL(request.url)
    // Use authenticated user's merchantId, fallback to query param for backwards compatibility
    const merchantId = user?.merchantId || searchParams.get('merchantId')
    const branchId = user?.branchId || searchParams.get('branchId')

    if (!merchantId) {
      return NextResponse.json(
        { success: false, error: 'merchantId is required' },
        { status: 400 }
      )
    }

    const today = new Date()
    const startOfDay = new Date(today.setHours(0, 0, 0, 0))
    const startOfYesterday = new Date(startOfDay)
    startOfYesterday.setDate(startOfYesterday.getDate() - 1)

    // Build where clause
    const whereClause: any = {
      merchantId,
      status: 'completed'
    }
    if (branchId) whereClause.branchId = branchId

    // Get today's transactions
    const todayTransactions = await db.transaction.findMany({
      where: {
        ...whereClause,
        createdAt: { gte: startOfDay }
      },
      include: {
        TransactionItem: true
      }
    })

    // Get yesterday's transactions for comparison
    const yesterdayTransactions = await db.transaction.findMany({
      where: {
        ...whereClause,
        createdAt: {
          gte: startOfYesterday,
          lt: startOfDay
        }
      },
      select: { total: true }
    })

    // Calculate today's stats
    const todaySales = todayTransactions.reduce((sum, t) => sum + t.total, 0)
    const todayTransactionCount = todayTransactions.length
    const avgTransaction = todayTransactionCount > 0 ? todaySales / todayTransactionCount : 0
    const yesterdaySales = yesterdayTransactions.reduce((sum, t) => sum + t.total, 0)

    // Sales change percentage
    const salesChange = yesterdaySales > 0 
      ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 
      : 0

    // Top products today
    const productSales: Record<string, { name: string; sold: number; revenue: number }> = {}
    todayTransactions.forEach(t => {
      t.TransactionItem?.forEach(item => {
        if (!productSales[item.name]) {
          productSales[item.name] = { name: item.name, sold: 0, revenue: 0 }
        }
        productSales[item.name].sold += item.quantity
        productSales[item.name].revenue += item.total
      })
    })

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // Hourly sales for today
    const hourlySales: { hour: string; amount: number }[] = []
    for (let h = 8; h <= 20; h++) {
      const hourTxns = todayTransactions.filter(t => new Date(t.createdAt).getHours() === h)
      hourlySales.push({
        hour: `${h.toString().padStart(2, '0')}:00`,
        amount: hourTxns.reduce((sum, t) => sum + t.total, 0)
      })
    }

    // Payment method breakdown
    const paymentMethods: Record<string, { method: string; count: number; amount: number }> = {}
    todayTransactions.forEach(t => {
      const method = t.paymentMethod || 'cash'
      if (!paymentMethods[method]) {
        paymentMethods[method] = { method, count: 0, amount: 0 }
      }
      paymentMethods[method].count++
      paymentMethods[method].amount += t.total
    })

    const paymentBreakdown = Object.values(paymentMethods)

    // Recent transactions (last 12)
    const recentTransactions = await db.transaction.findMany({
      where: {
        ...whereClause,
        createdAt: { gte: startOfDay }
      },
      select: {
        id: true,
        number: true,
        total: true,
        paymentMethod: true,
        createdAt: true,
        customerName: true,
        TransactionItem: {
          select: { quantity: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 12
    })

    // Low stock items count
    const lowStockCount = await db.product.count({
      where: {
        merchantId,
        currentStock: { lte: 10 }
      }
    })

    // Customer count (unique customers today)
    const uniqueCustomers = new Set(
      todayTransactions
        .filter(t => t.customerId)
        .map(t => t.customerId)
    )
    const returningCustomers = uniqueCustomers.size

    return NextResponse.json({
      success: true,
      data: {
        todaySales,
        todayTransactions: todayTransactionCount,
        avgTransaction,
        salesChange: parseFloat(salesChange.toFixed(2)),
        customersToday: todayTransactionCount, // Approximate
        returningCustomers,
        topProducts,
        hourlySales,
        paymentMethods: paymentBreakdown,
        recentTransactions: recentTransactions.map(t => ({
          id: t.id,
          number: t.number,
          time: new Date(t.createdAt).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }),
          amount: t.total,
          method: t.paymentMethod || 'cash',
          items: t.TransactionItem?.reduce((sum, i) => sum + i.quantity, 0) || 0,
          customer: t.customerName
        })),
        alerts: {
          lowStock: lowStockCount,
          pendingOrders: 0,
        }
      }
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
})
