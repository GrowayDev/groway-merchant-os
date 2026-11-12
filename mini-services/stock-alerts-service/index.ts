/**
 * Stock Alerts Background Service
 * 
 * Monitors stock levels and generates alerts for:
 * - Low stock (below reorder point)
 * - Out of stock
 * - Overstock (above max capacity)
 * - Negative stock (anomaly)
 * 
 * Port: 3006
 */

import { PrismaClient } from '../../node_modules/@prisma/client'

const prisma = new PrismaClient()
const PORT = 3006

// Types
interface StockAlert {
  id: string
  productId: string
  productName: string
  sku: string
  barcode?: string
  merchantId: string
  merchantName: string
  categoryId?: string
  categoryName?: string
  alertType: 'out_of_stock' | 'low_stock' | 'overstock' | 'negative_stock' | 'slow_moving'
  severity: 'critical' | 'high' | 'medium' | 'low'
  currentStock: number
  reorderPoint: number
  maxStock?: number
  daysOfStock?: number
  velocity?: number
  message: string
  suggestedAction: string
  estimatedImpact: number
  createdAt: string
}

interface AlertConfig {
  enabled: boolean
  lowStockThreshold: number    // Percentage of reorder point
  overstockThreshold: number   // Percentage above max
  slowMovingDays: number       // Days without sale for slow moving
  checkIntervalMinutes: number
  notifyOnCritical: boolean
  suppressRepeatedHours: number // Hours to suppress repeated alerts
}

// Default config
const DEFAULT_CONFIG: AlertConfig = {
  enabled: true,
  lowStockThreshold: 100, // At reorder point
  overstockThreshold: 150, // 150% of max
  slowMovingDays: 30,
  checkIntervalMinutes: 30,
  notifyOnCritical: true,
  suppressRepeatedHours: 24,
}

// In-memory store
const merchantConfigs = new Map<string, AlertConfig>()
const recentAlerts = new Map<string, Date>() // To suppress duplicates

/**
 * Calculate sales velocity
 */
async function calculateVelocity(productId: string, days: number = 30): Promise<number> {
  const since = new Date()
  since.setDate(since.getDate() - days)

  const movements = await prisma.stockMovement.findMany({
    where: {
      productId,
      type: 'sale',
      createdAt: { gte: since },
    },
    select: { quantity: true },
  })

  if (movements.length === 0) return 0

  const totalSold = movements.reduce((sum, m) => sum + Math.abs(m.quantity), 0)
  return totalSold / days
}

/**
 * Calculate days of stock remaining
 */
function calculateDaysOfStock(currentStock: number, velocity: number): number | undefined {
  if (velocity <= 0) return undefined
  return Math.floor(currentStock / velocity)
}

/**
 * Check if alert should be suppressed
 */
function shouldSuppress(productId: string, alertType: string): boolean {
  const key = `${productId}-${alertType}`
  const lastAlert = recentAlerts.get(key)
  
  if (!lastAlert) return false

  const config = DEFAULT_CONFIG
  const hoursSince = (Date.now() - lastAlert.getTime()) / (1000 * 60 * 60)
  
  return hoursSince < config.suppressRepeatedHours
}

/**
 * Record alert to suppress duplicates
 */
function recordAlert(productId: string, alertType: string): void {
  const key = `${productId}-${alertType}`
  recentAlerts.set(key, new Date())
}

/**
 * Check all stock levels for alerts
 */
async function checkStockAlerts(): Promise<StockAlert[]> {
  console.log('[STOCK-ALERTS] Starting stock alert check...')
  const startTime = Date.now()
  
  const allAlerts: StockAlert[] = []
  
  try {
    // Get all active products with inventory tracking
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        trackInventory: true,
      },
      include: {
        merchant: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
    })

    console.log(`[STOCK-ALERTS] Checking ${products.length} products`)

    for (const product of products) {
      const config = merchantConfigs.get(product.merchantId) || DEFAULT_CONFIG
      if (!config.enabled) continue

      const velocity = await calculateVelocity(product.id)
      const daysOfStock = calculateDaysOfStock(product.currentStock, velocity)

      // Check for negative stock (anomaly)
      if (product.currentStock < 0) {
        if (!shouldSuppress(product.id, 'negative_stock')) {
          allAlerts.push({
            id: `alert-${product.id}-negative`,
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            barcode: product.barcode || undefined,
            merchantId: product.merchantId,
            merchantName: product.merchant.name,
            categoryId: product.categoryId || undefined,
            categoryName: product.category?.name,
            alertType: 'negative_stock',
            severity: 'critical',
            currentStock: product.currentStock,
            reorderPoint: product.reorderPoint,
            daysOfStock,
            velocity,
            message: `Negative stock detected: ${product.currentStock} units`,
            suggestedAction: 'Investigate and correct stock count immediately',
            estimatedImpact: Math.abs(product.currentStock) * (product.costPrice || 0),
            createdAt: new Date().toISOString(),
          })
          recordAlert(product.id, 'negative_stock')
        }
        continue
      }

      // Check for out of stock
      if (product.currentStock === 0) {
        if (!shouldSuppress(product.id, 'out_of_stock')) {
          allAlerts.push({
            id: `alert-${product.id}-oos`,
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            barcode: product.barcode || undefined,
            merchantId: product.merchantId,
            merchantName: product.merchant.name,
            categoryId: product.categoryId || undefined,
            categoryName: product.category?.name,
            alertType: 'out_of_stock',
            severity: 'critical',
            currentStock: 0,
            reorderPoint: product.reorderPoint,
            daysOfStock: 0,
            velocity,
            message: 'Product is out of stock',
            suggestedAction: 'Reorder immediately from supplier',
            estimatedImpact: velocity * 7 * (product.sellingPrice || 0), // Lost weekly revenue
            createdAt: new Date().toISOString(),
          })
          recordAlert(product.id, 'out_of_stock')
        }
        continue
      }

      // Check for low stock (at or below reorder point)
      if (product.currentStock <= product.reorderPoint) {
        if (!shouldSuppress(product.id, 'low_stock')) {
          const severity = product.currentStock <= product.reorderPoint * 0.5 ? 'critical' : 'high'
          
          allAlerts.push({
            id: `alert-${product.id}-low`,
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            barcode: product.barcode || undefined,
            merchantId: product.merchantId,
            merchantName: product.merchant.name,
            categoryId: product.categoryId || undefined,
            categoryName: product.category?.name,
            alertType: 'low_stock',
            severity,
            currentStock: product.currentStock,
            reorderPoint: product.reorderPoint,
            daysOfStock,
            velocity,
            message: `Low stock: ${product.currentStock} units (reorder at ${product.reorderPoint})`,
            suggestedAction: `Order ${product.reorderQuantity || product.reorderPoint * 2} units from supplier`,
            estimatedImpact: daysOfStock && daysOfStock < 7 ? (7 - daysOfStock) * velocity * (product.sellingPrice || 0) : 0,
            createdAt: new Date().toISOString(),
          })
          recordAlert(product.id, 'low_stock')
        }
        continue
      }

      // Check for overstock (if maxStock is defined)
      if (product.maxStock && product.currentStock > product.maxStock * (config.overstockThreshold / 100)) {
        if (!shouldSuppress(product.id, 'overstock')) {
          allAlerts.push({
            id: `alert-${product.id}-over`,
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            barcode: product.barcode || undefined,
            merchantId: product.merchantId,
            merchantName: product.merchant.name,
            categoryId: product.categoryId || undefined,
            categoryName: product.category?.name,
            alertType: 'overstock',
            severity: 'medium',
            currentStock: product.currentStock,
            reorderPoint: product.reorderPoint,
            maxStock: product.maxStock,
            daysOfStock,
            velocity,
            message: `Overstock: ${product.currentStock} units (max: ${product.maxStock})`,
            suggestedAction: 'Consider running promotion or returning excess to supplier',
            estimatedImpact: (product.currentStock - product.maxStock) * (product.costPrice || 0),
            createdAt: new Date().toISOString(),
          })
          recordAlert(product.id, 'overstock')
        }
      }

      // Check for slow moving stock (no sales in X days)
      if (velocity === 0 && product.currentStock > 0) {
        if (!shouldSuppress(product.id, 'slow_moving')) {
          allAlerts.push({
            id: `alert-${product.id}-slow`,
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            barcode: product.barcode || undefined,
            merchantId: product.merchantId,
            merchantName: product.merchant.name,
            categoryId: product.categoryId || undefined,
            categoryName: product.category?.name,
            alertType: 'slow_moving',
            severity: 'low',
            currentStock: product.currentStock,
            reorderPoint: product.reorderPoint,
            velocity: 0,
            message: `No sales in ${config.slowMovingDays} days (${product.currentStock} units in stock)`,
            suggestedAction: 'Review pricing, run promotion, or consider discontinuing',
            estimatedImpact: product.currentStock * (product.costPrice || 0),
            createdAt: new Date().toISOString(),
          })
          recordAlert(product.id, 'slow_moving')
        }
      }
    }

    // Summary
    const critical = allAlerts.filter(a => a.severity === 'critical').length
    const high = allAlerts.filter(a => a.severity === 'high').length
    const medium = allAlerts.filter(a => a.severity === 'medium').length
    const low = allAlerts.filter(a => a.severity === 'low').length

    const duration = Date.now() - startTime
    console.log(`[STOCK-ALERTS] Check complete in ${duration}ms. Critical: ${critical}, High: ${high}, Medium: ${medium}, Low: ${low}`)

  } catch (error) {
    console.error('[STOCK-ALERTS] Error during check:', error)
  }

  return allAlerts
}

/**
 * Get alerts for a specific merchant
 */
async function getMerchantAlerts(merchantId: string): Promise<StockAlert[]> {
  const config = merchantConfigs.get(merchantId) || DEFAULT_CONFIG
  if (!config.enabled) return []

  const products = await prisma.product.findMany({
    where: {
      merchantId,
      isActive: true,
      trackInventory: true,
    },
    include: {
      category: { select: { id: true, name: true } },
    },
  })

  const alerts: StockAlert[] = []

  for (const product of products) {
    const velocity = await calculateVelocity(product.id)
    const daysOfStock = calculateDaysOfStock(product.currentStock, velocity)

    // Check conditions (simplified version)
    if (product.currentStock === 0) {
      alerts.push({
        id: `alert-${product.id}-oos`,
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        merchantId,
        merchantName: '',
        categoryId: product.categoryId || undefined,
        categoryName: product.category?.name,
        alertType: 'out_of_stock',
        severity: 'critical',
        currentStock: 0,
        reorderPoint: product.reorderPoint,
        daysOfStock: 0,
        velocity,
        message: 'Product is out of stock',
        suggestedAction: 'Reorder immediately',
        estimatedImpact: 0,
        createdAt: new Date().toISOString(),
      })
    } else if (product.currentStock <= product.reorderPoint) {
      alerts.push({
        id: `alert-${product.id}-low`,
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        merchantId,
        merchantName: '',
        categoryId: product.categoryId || undefined,
        categoryName: product.category?.name,
        alertType: 'low_stock',
        severity: 'high',
        currentStock: product.currentStock,
        reorderPoint: product.reorderPoint,
        daysOfStock,
        velocity,
        message: `Low stock: ${product.currentStock} units`,
        suggestedAction: 'Reorder soon',
        estimatedImpact: 0,
        createdAt: new Date().toISOString(),
      })
    }
  }

  return alerts
}

/**
 * HTTP Server for API endpoints
 */
async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const path = url.pathname

  // Health check
  if (path === '/health') {
    return Response.json({
      status: 'healthy',
      service: 'stock-alerts',
      timestamp: new Date().toISOString(),
    })
  }

  // Get all alerts
  if (path === '/alerts' && request.method === 'GET') {
    const merchantId = url.searchParams.get('merchantId')
    const severity = url.searchParams.get('severity')
    const type = url.searchParams.get('type')

    let alerts = merchantId 
      ? await getMerchantAlerts(merchantId)
      : await checkStockAlerts()

    if (severity) {
      alerts = alerts.filter(a => a.severity === severity)
    }
    if (type) {
      alerts = alerts.filter(a => a.alertType === type)
    }

    return Response.json({ alerts })
  }

  // Get critical alerts only
  if (path === '/alerts/critical' && request.method === 'GET') {
    const alerts = await checkStockAlerts()
    return Response.json({ alerts: alerts.filter(a => a.severity === 'critical') })
  }

  // Get alert summary
  if (path === '/summary' && request.method === 'GET') {
    const alerts = await checkStockAlerts()
    
    return Response.json({
      total: alerts.length,
      bySeverity: {
        critical: alerts.filter(a => a.severity === 'critical').length,
        high: alerts.filter(a => a.severity === 'high').length,
        medium: alerts.filter(a => a.severity === 'medium').length,
        low: alerts.filter(a => a.severity === 'low').length,
      },
      byType: {
        out_of_stock: alerts.filter(a => a.alertType === 'out_of_stock').length,
        low_stock: alerts.filter(a => a.alertType === 'low_stock').length,
        overstock: alerts.filter(a => a.alertType === 'overstock').length,
        negative_stock: alerts.filter(a => a.alertType === 'negative_stock').length,
        slow_moving: alerts.filter(a => a.alertType === 'slow_moving').length,
      },
    })
  }

  // Acknowledge alert
  if (path === '/alerts/acknowledge' && request.method === 'POST') {
    const body = await request.json()
    const { alertId } = body

    // In production, store in database
    return Response.json({ success: true, alertId, acknowledgedAt: new Date().toISOString() })
  }

  // Get/update config
  if (path === '/config' && request.method === 'GET') {
    const merchantId = url.searchParams.get('merchantId')
    if (!merchantId) {
      return Response.json({ error: 'merchantId required' }, { status: 400 })
    }

    const config = merchantConfigs.get(merchantId) || DEFAULT_CONFIG
    return Response.json({ config })
  }

  if (path === '/config' && request.method === 'PUT') {
    const body = await request.json()
    const { merchantId, config } = body

    if (!merchantId) {
      return Response.json({ error: 'merchantId required' }, { status: 400 })
    }

    merchantConfigs.set(merchantId, { ...DEFAULT_CONFIG, ...config })
    return Response.json({ success: true, config: merchantConfigs.get(merchantId) })
  }

  // Trigger manual check
  if (path === '/check' && request.method === 'POST') {
    const alerts = await checkStockAlerts()
    return Response.json({ message: 'Check completed', alertCount: alerts.length })
  }

  return Response.json({ error: 'Not found' }, { status: 404 })
}

// Start server
async function main() {
  console.log(`[STOCK-ALERTS] Service starting on port ${PORT}`)

  // Run initial check
  await checkStockAlerts()

  // Schedule periodic checks (every 30 minutes)
  const CHECK_INTERVAL = 30 * 60 * 1000
  setInterval(checkStockAlerts, CHECK_INTERVAL)

  // Start HTTP server
  const server = Bun.serve({
    port: PORT,
    fetch: handleRequest,
  })

  console.log(`[STOCK-ALERTS] HTTP server listening on port ${PORT}`)
  console.log(`[STOCK-ALERTS] Checks scheduled every ${CHECK_INTERVAL / 60000} minutes`)
}

main().catch(console.error)
