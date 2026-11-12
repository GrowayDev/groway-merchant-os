import { NextRequest, NextResponse } from 'next/server'
import { checkPermission } from '@/lib/permissions'
import { JAXForecastingService } from '@/services/inventory/jax-forecasting-service'

/**
 * GET /api/inventory/insights
 * Get AI-powered inventory insights and recommendations
 * 
 * Query params:
 * - merchantId: required
 * - type: optional (stockout_risk, overstock, reorder, savings, anomaly)
 * - priority: optional (low, medium, high, critical)
 */
export async function GET(request: NextRequest) {
  const permissionCheck = await checkPermission(request, 'can_view_inventory')
  
  if (!permissionCheck.allowed) {
    return permissionCheck.error
  }

  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const type = searchParams.get('type')
    const priority = searchParams.get('priority')

    if (!merchantId) {
      return NextResponse.json(
        { error: 'merchantId is required' },
        { status: 400 }
      )
    }

    const allInsights = await JAXForecastingService.generateInsights(merchantId)

    // Filter insights
    let insights = allInsights

    if (type) {
      insights = insights.filter(i => i.type === type)
    }

    if (priority) {
      insights = insights.filter(i => i.priority === priority)
    }

    // Calculate insight metrics
    const metrics = {
      totalInsights: insights.length,
      criticalCount: insights.filter(i => i.priority === 'critical').length,
      highCount: insights.filter(i => i.priority === 'high').length,
      mediumCount: insights.filter(i => i.priority === 'medium').length,
      lowCount: insights.filter(i => i.priority === 'low').length,
      byType: {
        stockout_risk: insights.filter(i => i.type === 'stockout_risk').length,
        overstock: insights.filter(i => i.type === 'overstock').length,
        reorder: insights.filter(i => i.type === 'reorder').length,
        savings: insights.filter(i => i.type === 'savings').length,
        anomaly: insights.filter(i => i.type === 'anomaly').length,
      },
      totalPotentialSavings: insights
        .filter(i => i.potentialSavings)
        .reduce((sum, i) => sum + (i.potentialSavings || 0), 0),
      immediateActionRequired: insights.filter(i => i.urgency === 'immediate').length,
    }

    return NextResponse.json({
      success: true,
      data: {
        insights,
        metrics,
      },
    })
  } catch (error) {
    console.error('Get insights error:', error)
    return NextResponse.json(
      { error: 'Failed to get insights', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
