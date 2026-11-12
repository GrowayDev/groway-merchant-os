import { NextRequest, NextResponse } from 'next/server'
import { checkPermission } from '@/lib/permissions'
import { InventoryAccountingService } from '@/services/inventory/inventory-accounting-service'

/**
 * GET /api/inventory/cogs
 * Get Cost of Goods Sold calculation for a period
 * 
 * Query params:
 * - merchantId: required
 * - startDate: required (YYYY-MM-DD)
 * - endDate: required (YYYY-MM-DD)
 * - productId: optional
 * - categoryId: optional
 */
export async function GET(request: NextRequest) {
  const permissionCheck = await checkPermission(request, 'can_view_reports')
  
  if (!permissionCheck.allowed) {
    return permissionCheck.error
  }

  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const productId = searchParams.get('productId')
    const categoryId = searchParams.get('categoryId')

    if (!merchantId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'merchantId, startDate, and endDate are required' },
        { status: 400 }
      )
    }

    const cogs = await InventoryAccountingService.calculateCOGS(
      merchantId,
      new Date(startDate),
      new Date(endDate),
      {
        productId: productId || undefined,
        categoryId: categoryId || undefined,
      }
    )

    // Get comparison with previous period
    const start = new Date(startDate)
    const end = new Date(endDate)
    const periodDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    
    const prevStart = new Date(start)
    prevStart.setDate(prevStart.getDate() - periodDays)
    const prevEnd = new Date(start)
    prevEnd.setDate(prevEnd.getDate() - 1)

    const prevCogs = await InventoryAccountingService.calculateCOGS(
      merchantId,
      prevStart,
      prevEnd,
      {
        productId: productId || undefined,
        categoryId: categoryId || undefined,
      }
    )

    // Calculate period comparison
    const comparison = {
      revenueChange: cogs.totals.totalRevenue - prevCogs.totals.totalRevenue,
      revenueChangePercent: prevCogs.totals.totalRevenue > 0 
        ? ((cogs.totals.totalRevenue - prevCogs.totals.totalRevenue) / prevCogs.totals.totalRevenue) * 100 
        : 0,
      cogsChange: cogs.totals.totalCOGS - prevCogs.totals.totalCOGS,
      cogsChangePercent: prevCogs.totals.totalCOGS > 0 
        ? ((cogs.totals.totalCOGS - prevCogs.totals.totalCOGS) / prevCogs.totals.totalCOGS) * 100 
        : 0,
      grossProfitChange: cogs.totals.totalGrossProfit - prevCogs.totals.totalGrossProfit,
      grossMarginChange: cogs.totals.avgGrossMargin - prevCogs.totals.avgGrossMargin,
    }

    return NextResponse.json({
      success: true,
      data: {
        period: {
          start: startDate,
          end: endDate,
        },
        items: cogs.items,
        totals: cogs.totals,
        comparison,
        previousPeriod: {
          start: prevStart.toISOString().split('T')[0],
          end: prevEnd.toISOString().split('T')[0],
          totals: prevCogs.totals,
        },
      },
    })
  } catch (error) {
    console.error('Get COGS error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate COGS', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
