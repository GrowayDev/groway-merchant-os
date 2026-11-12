import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/grosupply/inventory-sync - Get inventory sync status and logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get('supplierId')
    const status = searchParams.get('status')
    const syncType = searchParams.get('syncType')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause for sync logs
    const logWhere: Record<string, unknown> = {}
    if (supplierId) logWhere.supplierId = supplierId
    if (status) logWhere.status = status
    if (syncType) logWhere.syncType = syncType

    // Get sync logs
    const syncLogs = await db.inventorySyncLog.findMany({
      where: logWhere,
      orderBy: { startedAt: 'desc' },
      take: limit,
      skip: offset
    })

    const totalLogs = await db.inventorySyncLog.count({ where: logWhere })

    // Get recent sync stats
    const recentSyncs = await db.inventorySyncLog.groupBy({
      by: ['status'],
      _count: { id: true },
      where: {
        startedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    })

    // Get inventory feed summary
    const feedSummary = await db.supplierInventoryFeed.groupBy({
      by: ['availability'],
      _count: { id: true },
      _sum: { quantityAvailable: true }
    })

    // Get recent price changes
    const recentPriceChanges = await db.priceChangeLog.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    // Get availability alerts
    const availabilityAlerts = await db.supplierInventoryFeed.findMany({
      where: {
        OR: [
          { availability: 'out_of_stock' },
          { availability: 'limited' }
        ]
      },
      take: 20
    })

    return NextResponse.json({
      syncLogs,
      totalLogs,
      stats: {
        recentSyncs: recentSyncs.reduce((acc, s) => {
          acc[s.status] = s._count.id
          return acc
        }, {} as Record<string, number>),
        feedSummary: feedSummary.map(f => ({
          availability: f.availability,
          productCount: f._count.id,
          totalQuantity: f._sum.quantityAvailable || 0
        }))
      },
      recentPriceChanges,
      availabilityAlerts
    })
  } catch (error) {
    console.error('Error fetching inventory sync data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory sync data' },
      { status: 500 }
    )
  }
}

// POST /api/grosupply/inventory-sync - Trigger a new inventory sync
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { supplierId, syncType = 'full', syncSource = 'api' } = body

    if (!supplierId) {
      return NextResponse.json(
        { error: 'Supplier ID is required' },
        { status: 400 }
      )
    }

    // Verify supplier exists
    const supplier = await db.supplier.findUnique({
      where: { id: supplierId }
    })

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      )
    }

    // Create sync log
    const syncLog = await db.inventorySyncLog.create({
      data: {
        id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        supplierId,
        syncType,
        status: 'pending',
        syncSource,
        itemsProcessed: 0,
        itemsUpdated: 0,
        itemsFailed: 0
      }
    })

    // Simulate sync process (in real implementation, this would be a background job)
    // For demo, we'll create mock inventory feed data
    const mockInventoryData = generateMockInventoryData(supplierId, syncType)
    
    let itemsProcessed = 0
    let itemsUpdated = 0
    let itemsFailed = 0
    const errors: string[] = []

    for (const item of mockInventoryData) {
      itemsProcessed++
      try {
        // Upsert inventory feed
        await db.supplierInventoryFeed.upsert({
          where: {
            supplierId_sku: {
              supplierId,
              sku: item.sku
            }
          },
          create: {
            id: `feed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            supplierId,
            ...item
          },
          update: item
        })

        // Check for price changes and log them
        if (syncType === 'price' || syncType === 'full') {
          const existingFeed = await db.supplierInventoryFeed.findUnique({
            where: {
              supplierId_sku: {
                supplierId,
                sku: item.sku
              }
            }
          })

          if (existingFeed && existingFeed.unitPrice !== item.unitPrice) {
            const changePercent = ((item.unitPrice - existingFeed.unitPrice) / existingFeed.unitPrice) * 100
            
            await db.priceChangeLog.create({
              data: {
                id: `price_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                supplierId,
                sku: item.sku,
                oldPrice: existingFeed.unitPrice,
                newPrice: item.unitPrice,
                changePercent,
                changeType: changePercent > 0 ? 'increase' : 'decrease',
                effectiveDate: new Date().toISOString().split('T')[0]
              }
            })
          }
        }

        itemsUpdated++
      } catch (error) {
        itemsFailed++
        errors.push(`Failed to sync ${item.sku}: ${error}`)
      }
    }

    // Update sync log with results
    const completedLog = await db.inventorySyncLog.update({
      where: { id: syncLog.id },
      data: {
        status: itemsFailed === 0 ? 'success' : itemsUpdated > 0 ? 'partial' : 'failed',
        itemsProcessed,
        itemsUpdated,
        itemsFailed,
        errors: errors.length > 0 ? JSON.stringify(errors) : null,
        completedAt: new Date(),
        duration: Date.now() - new Date(syncLog.startedAt).getTime()
      }
    })

    return NextResponse.json({
      success: true,
      syncLog: completedLog,
      summary: {
        itemsProcessed,
        itemsUpdated,
        itemsFailed
      }
    })
  } catch (error) {
    console.error('Error triggering inventory sync:', error)
    return NextResponse.json(
      { error: 'Failed to trigger inventory sync' },
      { status: 500 }
    )
  }
}

// PUT /api/grosupply/inventory-sync - Update stock levels
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { supplierId, updates } = body

    if (!supplierId || !Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Supplier ID and updates array are required' },
        { status: 400 }
      )
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    for (const update of updates) {
      try {
        await db.supplierInventoryFeed.update({
          where: {
            supplierId_sku: {
              supplierId,
              sku: update.sku
            }
          },
          data: {
            quantityAvailable: update.quantityAvailable,
            availability: update.availability || determineAvailability(update.quantityAvailable),
            lastUpdated: new Date()
          }
        })
        results.success++
      } catch (error) {
        results.failed++
        results.errors.push(`Failed to update ${update.sku}`)
      }
    }

    return NextResponse.json({
      success: true,
      results
    })
  } catch (error) {
    console.error('Error updating inventory:', error)
    return NextResponse.json(
      { error: 'Failed to update inventory' },
      { status: 500 }
    )
  }
}

// Helper function to determine availability status
function determineAvailability(quantity: number): string {
  if (quantity <= 0) return 'out_of_stock'
  if (quantity <= 10) return 'limited'
  return 'in_stock'
}

// Generate mock inventory data for demo
function generateMockInventoryData(supplierId: string, syncType: string) {
  const categories = ['Beverages', 'Snacks', 'Dairy', 'Bakery', 'Frozen', 'Household']
  const baseItems = []
  
  for (let i = 1; i <= 25; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)]
    const basePrice = Math.random() * 100 + 10
    
    baseItems.push({
      sku: `SKU-${supplierId.slice(-4)}-${String(i).padStart(4, '0')}`,
      productName: `${category} Product ${i}`,
      quantityAvailable: Math.floor(Math.random() * 500),
      quantityReserved: Math.floor(Math.random() * 50),
      quantityOnOrder: Math.floor(Math.random() * 100),
      unitPrice: parseFloat(basePrice.toFixed(2)),
      costPrice: parseFloat((basePrice * 0.7).toFixed(2)),
      currency: 'ZAR',
      availability: Math.random() > 0.1 ? 'in_stock' : Math.random() > 0.5 ? 'limited' : 'out_of_stock',
      leadTime: Math.floor(Math.random() * 7) + 1,
      minOrderQty: Math.floor(Math.random() * 10) + 1,
      maxOrderQty: Math.random() > 0.5 ? Math.floor(Math.random() * 100) + 50 : null
    })
  }
  
  return baseItems
}
