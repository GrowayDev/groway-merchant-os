import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/merchant-os/inventory/stats - Get inventory statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const branchId = searchParams.get('branchId')

    if (!merchantId) {
      // Return mock data for demo
      return NextResponse.json({
        stats: {
          totalSKUs: 156,
          totalValue: 245680.50,
          outOfStock: 3,
          lowStock: 12,
          expiringWithin30Days: 5,
          avgTurnoverDays: 14.5,
          unitsReceivedToday: 48,
          unitsSoldToday: 156,
          netChangeToday: -108
        },
        alerts: {
          critical: [
            { id: '1', type: 'out_of_stock', productName: 'Frozen Chips 2kg', sku: 'ING-FC-001', severity: 'critical' },
            { id: '2', type: 'out_of_stock', productName: 'Ketchup 500ml', sku: 'ING-KT-001', severity: 'critical' },
            { id: '3', type: 'out_of_stock', productName: 'Mayo 1L', sku: 'ING-MA-001', severity: 'critical' }
          ],
          lowStock: [
            { id: '4', type: 'low_stock', productName: 'Cheddar Cheese Slices', sku: 'ING-CS-001', current: 12, reorder: 40 },
            { id: '5', type: 'low_stock', productName: 'Burger Buns (6-pack)', sku: 'ING-BB-001', current: 68, reorder: 100 }
          ],
          expiring: [
            { id: '6', type: 'expiring', productName: 'Cheddar Cheese Slices', sku: 'ING-CS-001', batchNo: 'CH-2026-021', expiry: '2026-02-28', qty: 12 },
            { id: '7', type: 'expiring', productName: 'Milk 2L', sku: 'BEV-ML-001', batchNo: 'ML-2026-019', expiry: '2026-03-01', qty: 8 }
          ]
        },
        topMovers: [
          { name: 'Coca-Cola 500ml', sku: 'BEV-CC-001', velocity: 85, trend: 'up' },
          { name: 'Beef Patty (Frozen)', sku: 'ING-BP-001', velocity: 45, trend: 'up' },
          { name: 'Burger Buns (6-pack)', sku: 'ING-BB-001', velocity: 38, trend: 'down' },
          { name: 'Fanta 500ml', sku: 'BEV-FA-001', velocity: 42, trend: 'stable' },
          { name: 'Burger Box (Pack 100)', sku: 'PKG-BB-001', velocity: 55, trend: 'up' }
        ],
        categoryBreakdown: [
          { category: 'Ingredients', count: 45, value: 89450.00 },
          { category: 'Beverages', count: 32, value: 67890.00 },
          { category: 'Packaging', count: 28, value: 34560.00 },
          { category: 'Chicken', count: 18, value: 28900.00 },
          { category: 'Sides', count: 15, value: 12340.00 },
          { category: 'Desserts', count: 12, value: 9540.00 },
          { category: 'Sauces', count: 6, value: 3000.00 }
        ]
      })
    }

    // Get products for merchant
    const products = await db.product.findMany({
      where: { merchantId },
      include: {
        category: true
      }
    })

    const totalSKUs = products.length
    const totalValue = products.reduce((sum, p) => sum + (p.costPrice * p.stockQuantity), 0)
    const outOfStock = products.filter(p => p.stockQuantity === 0).length
    const lowStock = products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= p.reorderPoint).length

    // Get movements today
    const today = new Date().toISOString().split('T')[0]
    const movementsToday = await db.stockMovement.findMany({
      where: {
        productId: { in: products.map(p => p.id) },
        branchId: branchId || undefined,
        createdAt: {
          gte: new Date(today)
        }
      }
    })

    const unitsReceivedToday = movementsToday
      .filter(m => m.direction === 'in')
      .reduce((sum, m) => sum + m.quantity, 0)
    const unitsSoldToday = movementsToday
      .filter(m => m.type === 'sale')
      .reduce((sum, m) => sum + m.quantity, 0)

    return NextResponse.json({
      stats: {
        totalSKUs,
        totalValue,
        outOfStock,
        lowStock,
        expiringWithin30Days: 0,
        avgTurnoverDays: 14.5,
        unitsReceivedToday,
        unitsSoldToday,
        netChangeToday: unitsReceivedToday - unitsSoldToday
      }
    })
  } catch (error) {
    console.error('Error fetching inventory stats:', error)
    return NextResponse.json({ error: 'Failed to fetch inventory stats' }, { status: 500 })
  }
}
