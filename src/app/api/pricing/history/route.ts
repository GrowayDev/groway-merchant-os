import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

async function getSession(request: NextRequest) {
  const sessionToken = request.cookies.get('groway_session')?.value
  if (!sessionToken) return null
  
  try {
    return await db.merchantSession.findFirst({
      where: { 
        token: sessionToken,
        expiresAt: { gt: new Date() }
      },
      include: { user: true, merchant: true },
    })
  } catch {
    return null
  }
}

// GET /api/pricing/history - Get price and cost history
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all' // 'price', 'cost', 'all'
    const productId = searchParams.get('productId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const priceHistory = type === 'cost' ? [] : await db.priceHistory.findMany({
      where: {
        merchantId: session.merchantId,
        ...(productId && { productId }),
      },
      include: {
        product: { select: { name: true, sku: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    const costHistory = type === 'price' ? [] : await db.costHistory.findMany({
      where: {
        merchantId: session.merchantId,
        ...(productId && { productId }),
      },
      include: {
        product: { select: { name: true, sku: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    // Combine and sort by date
    const combined = [
      ...priceHistory.map(h => ({ ...h, type: 'price' as const })),
      ...costHistory.map(h => ({ ...h, type: 'cost' as const })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    // Group by month for chart data
    const monthlyStats = await getMonthlyStats(session.merchantId)

    return NextResponse.json({
      success: true,
      history: combined.slice(0, limit),
      stats: {
        totalChanges: combined.length,
        priceIncreases: priceHistory.filter(h => h.priceChange > 0).length,
        priceDecreases: priceHistory.filter(h => h.priceChange < 0).length,
        costIncreases: costHistory.filter(h => h.costChange > 0).length,
        avgPriceChange: priceHistory.length > 0 
          ? priceHistory.reduce((sum, h) => sum + h.priceChangePercent, 0) / priceHistory.length 
          : 0,
        avgCostChange: costHistory.length > 0 
          ? costHistory.reduce((sum, h) => sum + h.costChangePercent, 0) / costHistory.length 
          : 0,
      },
      monthlyStats,
      hasMore: combined.length > limit,
    })
  } catch (error) {
    console.error('Get pricing history error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    )
  }
}

async function getMonthlyStats(merchantId: string) {
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  try {
    const history = await db.priceHistory.findMany({
      where: {
        merchantId,
        createdAt: { gte: sixMonthsAgo },
      },
      select: {
        createdAt: true,
        priceChangePercent: true,
        newMargin: true,
      },
    })

    // Group by month
    const monthlyData: Record<string, { changes: number; avgChange: number; avgMargin: number }> = {}
    
    history.forEach(h => {
      const month = h.createdAt.toISOString().slice(0, 7) // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { changes: 0, avgChange: 0, avgMargin: 0 }
      }
      monthlyData[month].changes++
      monthlyData[month].avgChange += h.priceChangePercent
      monthlyData[month].avgMargin += h.newMargin
    })

    // Calculate averages
    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      changes: data.changes,
      avgChange: data.changes > 0 ? data.avgChange / data.changes : 0,
      avgMargin: data.changes > 0 ? data.avgMargin / data.changes : 0,
    })).sort((a, b) => a.month.localeCompare(b.month))
  } catch {
    return []
  }
}
