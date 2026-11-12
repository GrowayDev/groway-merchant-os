import { NextRequest, NextResponse } from 'next/server'
import { checkPermission } from '@/lib/permissions'
import { JAXForecastingService } from '@/services/inventory/jax-forecasting-service'

/**
 * GET /api/inventory/reorder-suggestions
 * Get intelligent reorder suggestions based on AI forecasting
 * 
 * Query params:
 * - merchantId: required
 * - maxBudget: optional (maximum budget for orders)
 * - supplierId: optional (filter by supplier)
 * - priority: optional (filter by priority)
 */
export async function GET(request: NextRequest) {
  const permissionCheck = await checkPermission(request, 'can_view_inventory')
  
  if (!permissionCheck.allowed) {
    return permissionCheck.error
  }

  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const maxBudget = searchParams.get('maxBudget')
    const supplierId = searchParams.get('supplierId')
    const priority = searchParams.get('priority')

    if (!merchantId) {
      return NextResponse.json(
        { error: 'merchantId is required' },
        { status: 400 }
      )
    }

    const suggestions = await JAXForecastingService.getReorderSuggestions(merchantId, {
      maxBudget: maxBudget ? parseFloat(maxBudget) : undefined,
      supplierId: supplierId || undefined,
    })

    // Filter by priority if specified
    let filteredSuggestions = suggestions
    if (priority) {
      filteredSuggestions = suggestions.filter(s => s.priority === priority)
    }

    // Calculate summary metrics
    const metrics = {
      totalSuggestions: filteredSuggestions.length,
      totalValue: filteredSuggestions.reduce((sum, s) => sum + s.estimatedCost, 0),
      criticalCount: filteredSuggestions.filter(s => s.priority === 'critical').length,
      highCount: filteredSuggestions.filter(s => s.priority === 'high').length,
      mediumCount: filteredSuggestions.filter(s => s.priority === 'medium').length,
      lowCount: filteredSuggestions.filter(s => s.priority === 'low').length,
      avgLeadTime: filteredSuggestions.length > 0
        ? filteredSuggestions.reduce((sum, s) => sum + s.leadTime, 0) / filteredSuggestions.length
        : 0,
      bySupplier: filteredSuggestions.reduce((acc, s) => {
        const name = s.supplierName || 'Unknown'
        acc[name] = (acc[name] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      potentialStockouts: filteredSuggestions.filter(s => 
        s.priority === 'critical' || s.priority === 'high'
      ).length,
    }

    // Group by urgency
    const groupedByUrgency = {
      immediate: filteredSuggestions.filter(s => s.priority === 'critical'),
      thisWeek: filteredSuggestions.filter(s => s.priority === 'high'),
      thisMonth: filteredSuggestions.filter(s => s.priority === 'medium'),
      later: filteredSuggestions.filter(s => s.priority === 'low'),
    }

    return NextResponse.json({
      success: true,
      data: {
        suggestions: filteredSuggestions,
        metrics,
        groupedByUrgency,
      },
    })
  } catch (error) {
    console.error('Get reorder suggestions error:', error)
    return NextResponse.json(
      { error: 'Failed to get reorder suggestions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/inventory/reorder-suggestions
 * Convert suggestions to purchase orders
 * 
 * Body:
 * - merchantId: required
 * - suggestionIds: required (array of product IDs to order)
 * - supplierId: optional (override supplier)
 */
export async function POST(request: NextRequest) {
  const permissionCheck = await checkPermission(request, 'can_create_purchase_order')
  
  if (!permissionCheck.allowed) {
    return permissionCheck.error
  }

  const session = permissionCheck.session!

  try {
    const body = await request.json()
    const { merchantId, suggestionIds, supplierId } = body

    if (!merchantId || !suggestionIds || !Array.isArray(suggestionIds)) {
      return NextResponse.json(
        { error: 'merchantId and suggestionIds array are required' },
        { status: 400 }
      )
    }

    // Get all suggestions
    const allSuggestions = await JAXForecastingService.getReorderSuggestions(merchantId)
    
    // Filter to selected suggestions
    const selectedSuggestions = allSuggestions.filter(s => 
      suggestionIds.includes(s.productId)
    )

    if (selectedSuggestions.length === 0) {
      return NextResponse.json(
        { error: 'No valid suggestions found' },
        { status: 400 }
      )
    }

    // Group by supplier
    const bySupplier: Record<string, typeof selectedSuggestions> = {}
    
    selectedSuggestions.forEach(s => {
      const supplier = supplierId || s.supplierId || 'unknown'
      if (!bySupplier[supplier]) bySupplier[supplier] = []
      bySupplier[supplier].push(s)
    })

    // Create purchase orders for each supplier
    const createdOrders = []

    for (const [supId, items] of Object.entries(bySupplier)) {
      // Generate PO number
      const { db } = await import('@/lib/db')
      const count = await db.purchaseOrder.count()
      const number = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`

      const totalValue = items.reduce((sum, i) => sum + i.estimatedCost, 0)

      // Create purchase order
      const po = await db.purchaseOrder.create({
        data: {
          merchantId,
          number,
          supplierId: supId !== 'unknown' ? supId : null,
          status: 'draft',
          subtotal: totalValue,
          vat: totalValue * 0.15, // 15% VAT
          total: totalValue * 1.15,
          requestedDate: new Date().toISOString().split('T')[0],
          createdBy: session.userId,
          items: {
            create: items.map(item => ({
              sku: item.sku,
              description: item.productName,
              quantity: item.suggestedQty,
              unitPrice: item.estimatedCost / item.suggestedQty,
              totalPrice: item.estimatedCost,
              unit: 'each',
            })),
          },
        },
        include: {
          items: true,
        },
      })

      createdOrders.push(po)
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdOrders.length} purchase order(s)`,
      data: {
        orders: createdOrders,
        totalItems: selectedSuggestions.length,
        totalValue: selectedSuggestions.reduce((sum, s) => sum + s.estimatedCost, 0),
      },
    })
  } catch (error) {
    console.error('Create purchase orders from suggestions error:', error)
    return NextResponse.json(
      { error: 'Failed to create purchase orders', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
