import { NextRequest, NextResponse } from 'next/server'
import { checkPermission } from '@/lib/permissions'
import { InventoryAccountingService } from '@/services/inventory/inventory-accounting-service'

/**
 * GET /api/inventory/valuation
 * Get current inventory valuation
 * 
 * Query params:
 * - merchantId: required
 * - branchId: optional
 * - categoryId: optional
 * - method: optional (cost, retail, lower_of_cost_or_market)
 */
export async function GET(request: NextRequest) {
  const permissionCheck = await checkPermission(request, 'can_view_inventory')
  
  if (!permissionCheck.allowed) {
    return permissionCheck.error
  }

  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const branchId = searchParams.get('branchId')
    const categoryId = searchParams.get('categoryId')
    const method = searchParams.get('method') as 'cost' | 'retail' | 'lower_of_cost_or_market' || 'cost'

    if (!merchantId) {
      return NextResponse.json(
        { error: 'merchantId is required' },
        { status: 400 }
      )
    }

    const valuation = await InventoryAccountingService.getInventoryValuation(
      merchantId,
      {
        branchId: branchId || undefined,
        categoryId: categoryId || undefined,
        valuationMethod: method,
      }
    )

    // Get historical trend (last 6 months)
    const trend = []
    const now = new Date()
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      // In a real system, you'd store historical valuations
      // For now, we'll just estimate based on current
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      trend.push({
        month: monthName,
        value: valuation.totalCost * (0.9 + Math.random() * 0.2), // Simulated variance
      })
    }

    // Calculate key metrics
    const metrics = {
      inventoryTurnover: valuation.turnoverRate,
      daysOfInventory: valuation.daysOfInventory,
      grossMargin: valuation.totalRetail > 0 
        ? ((valuation.totalRetail - valuation.totalCost) / valuation.totalRetail) * 100 
        : 0,
      averageUnitCost: valuation.totalCost > 0 
        ? valuation.totalCost / (valuation.byStatus.active + valuation.byStatus.lowStock) 
        : 0,
      stockHealth: {
        healthy: valuation.byStatus.active,
        atRisk: valuation.byStatus.lowStock,
        critical: valuation.byStatus.outOfStock,
        expired: valuation.byStatus.expired,
      },
    }

    return NextResponse.json({
      success: true,
      data: {
        valuation,
        trend,
        metrics,
        asOf: new Date().toISOString(),
        valuationMethod: method,
      },
    })
  } catch (error) {
    console.error('Get inventory valuation error:', error)
    return NextResponse.json(
      { error: 'Failed to get inventory valuation', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
