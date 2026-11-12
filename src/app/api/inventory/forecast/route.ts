import { NextRequest, NextResponse } from 'next/server'
import { checkPermission } from '@/lib/permissions'
import { JAXForecastingService } from '@/services/inventory/jax-forecasting-service'

/**
 * GET /api/inventory/forecast
 * Get demand forecasts for products
 * 
 * Query params:
 * - merchantId: required
 * - productId: optional (single product forecast)
 * - categoryId: optional (filter by category)
 * - lowStockOnly: optional (only show low stock items)
 * - includeReorder: optional (only show items needing reorder)
 */
export async function GET(request: NextRequest) {
  const permissionCheck = await checkPermission(request, 'can_view_inventory')
  
  if (!permissionCheck.allowed) {
    return permissionCheck.error
  }

  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const productId = searchParams.get('productId')
    const categoryId = searchParams.get('categoryId')
    const lowStockOnly = searchParams.get('lowStockOnly') === 'true'
    const includeReorder = searchParams.get('includeReorder') === 'true'

    if (!merchantId) {
      return NextResponse.json(
        { error: 'merchantId is required' },
        { status: 400 }
      )
    }

    // Single product forecast
    if (productId) {
      const forecast = await JAXForecastingService.getProductForecast(merchantId, productId)
      
      if (!forecast) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }

      // Get sales patterns
      const patterns = await JAXForecastingService.getSalesPatterns(merchantId, productId)

      return NextResponse.json({
        success: true,
        data: {
          forecast,
          patterns,
        },
      })
    }

    // All products forecast
    const forecasts = await JAXForecastingService.getAllForecasts(merchantId, {
      categoryId: categoryId || undefined,
      lowStockOnly,
      includeReorder,
    })

    // Calculate summary metrics
    const metrics = {
      totalProducts: forecasts.length,
      criticalRisk: forecasts.filter(f => f.stockOutRisk === 'critical').length,
      highRisk: forecasts.filter(f => f.stockOutRisk === 'high').length,
      mediumRisk: forecasts.filter(f => f.stockOutRisk === 'medium').length,
      lowRisk: forecasts.filter(f => f.stockOutRisk === 'low').length,
      totalReorderValue: forecasts
        .filter(f => f.reorderRecommended)
        .reduce((sum, f) => sum + f.estimatedCost, 0),
      avgConfidence: forecasts.length > 0 
        ? forecasts.reduce((sum, f) => sum + f.confidence, 0) / forecasts.length 
        : 0,
      increasingTrend: forecasts.filter(f => f.trend === 'increasing').length,
      decreasingTrend: forecasts.filter(f => f.trend === 'decreasing').length,
    }

    return NextResponse.json({
      success: true,
      data: {
        forecasts,
        metrics,
      },
    })
  } catch (error) {
    console.error('Get forecast error:', error)
    return NextResponse.json(
      { error: 'Failed to get forecast', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
