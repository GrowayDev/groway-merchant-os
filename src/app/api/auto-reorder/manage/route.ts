import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/auto-reorder/manage - Get all auto-reorder configurations and alerts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const enabled = searchParams.get('enabled')
    const alertStatus = searchParams.get('alertStatus')
    const alertType = searchParams.get('alertType')
    const limit = parseInt(searchParams.get('limit') || '100')

    // Build where clauses
    const configWhere: Record<string, unknown> = {}
    if (merchantId) configWhere.merchantId = merchantId
    if (enabled !== null) configWhere.enabled = enabled === 'true'

    const alertWhere: Record<string, unknown> = { status: 'active' }
    if (merchantId) alertWhere.merchantId = merchantId
    if (alertStatus) alertWhere.status = alertStatus
    if (alertType) alertWhere.alertType = alertType

    // Get auto-reorder configs
    const configs = await db.autoReorderConfig.findMany({
      where: configWhere,
      orderBy: { sku: 'asc' },
      take: limit
    })

    // Get active alerts
    const alerts = await db.stockAlert.findMany({
      where: alertWhere,
      orderBy: [
        { severity: 'desc' },
        { triggeredAt: 'desc' }
      ],
      take: limit
    })

    // Get alert counts by type
    const alertCounts = await db.stockAlert.groupBy({
      by: ['alertType', 'severity'],
      where: { status: 'active', ...(merchantId && { merchantId }) },
      _count: { id: true }
    })

    // Get configs needing reorder
    const needingReorder = configs.filter(c => {
      // In real implementation, would check current stock against reorder point
      return c.enabled
    })

    // Calculate summary stats
    const summary = {
      totalConfigs: configs.length,
      enabledConfigs: configs.filter(c => c.enabled).length,
      activeAlerts: alerts.length,
      criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
      warningAlerts: alerts.filter(a => a.severity === 'warning').length,
      alertsByType: alertCounts.reduce((acc, a) => {
        const key = `${a.alertType}_${a.severity}`
        acc[key] = a._count.id
        return acc
      }, {} as Record<string, number>)
    }

    return NextResponse.json({
      configs,
      alerts,
      summary,
      needingReorder: needingReorder.slice(0, 20)
    })
  } catch (error) {
    console.error('Error fetching auto-reorder data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch auto-reorder data' },
      { status: 500 }
    )
  }
}

// POST /api/auto-reorder/manage - Create or update auto-reorder configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      merchantId,
      productId,
      sku,
      productName,
      enabled = true,
      reorderPoint,
      reorderQty,
      safetyStock,
      maxStock,
      preferredSupplierId,
      backupSupplierId,
      triggerType = 'automatic',
      triggerThreshold = 0.3,
      autoRfqEnabled = true,
      rfqExpiryHours = 24
    } = body

    if (!sku) {
      return NextResponse.json(
        { error: 'SKU is required' },
        { status: 400 }
      )
    }

    if (!reorderPoint || !reorderQty || !safetyStock) {
      return NextResponse.json(
        { error: 'reorderPoint, reorderQty, and safetyStock are required' },
        { status: 400 }
      )
    }

    // Check if config already exists
    const existingConfig = await db.autoReorderConfig.findUnique({
      where: {
        merchantId_sku: {
          merchantId: merchantId || 'default',
          sku
        }
      }
    })

    let config
    if (existingConfig) {
      config = await db.autoReorderConfig.update({
        where: { id: existingConfig.id },
        data: {
          productId,
          productName,
          enabled,
          reorderPoint,
          reorderQty,
          safetyStock,
          maxStock,
          preferredSupplierId,
          backupSupplierId,
          triggerType,
          triggerThreshold,
          autoRfqEnabled,
          rfqExpiryHours,
          updatedAt: new Date()
        }
      })
    } else {
      config = await db.autoReorderConfig.create({
        data: {
          id: `reorder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          merchantId: merchantId || 'default',
          productId,
          sku,
          productName,
          enabled,
          reorderPoint,
          reorderQty,
          safetyStock,
          maxStock,
          preferredSupplierId,
          backupSupplierId,
          triggerType,
          triggerThreshold,
          autoRfqEnabled,
          rfqExpiryHours
        }
      })
    }

    return NextResponse.json({
      success: true,
      config,
      message: existingConfig ? 'Configuration updated' : 'Configuration created'
    })
  } catch (error) {
    console.error('Error creating/updating auto-reorder config:', error)
    return NextResponse.json(
      { error: 'Failed to create/update auto-reorder configuration' },
      { status: 500 }
    )
  }
}

// PUT /api/auto-reorder/manage - Batch update configurations
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { merchantId, configs } = body

    if (!Array.isArray(configs) || configs.length === 0) {
      return NextResponse.json(
        { error: 'configs array is required' },
        { status: 400 }
      )
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    for (const config of configs) {
      try {
        await db.autoReorderConfig.upsert({
          where: {
            merchantId_sku: {
              merchantId: merchantId || 'default',
              sku: config.sku
            }
          },
          create: {
            id: `reorder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            merchantId: merchantId || 'default',
            sku: config.sku,
            productName: config.productName,
            enabled: config.enabled ?? true,
            reorderPoint: config.reorderPoint,
            reorderQty: config.reorderQty,
            safetyStock: config.safetyStock,
            maxStock: config.maxStock,
            preferredSupplierId: config.preferredSupplierId,
            triggerType: config.triggerType || 'automatic'
          },
          update: {
            enabled: config.enabled,
            reorderPoint: config.reorderPoint,
            reorderQty: config.reorderQty,
            safetyStock: config.safetyStock,
            maxStock: config.maxStock,
            preferredSupplierId: config.preferredSupplierId,
            updatedAt: new Date()
          }
        })
        results.success++
      } catch (error) {
        results.failed++
        results.errors.push(`Failed to update ${config.sku}`)
      }
    }

    return NextResponse.json({
      success: true,
      results
    })
  } catch (error) {
    console.error('Error batch updating auto-reorder configs:', error)
    return NextResponse.json(
      { error: 'Failed to batch update configurations' },
      { status: 500 }
    )
  }
}
