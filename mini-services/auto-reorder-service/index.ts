/**
 * Auto-Reorder Background Service
 * 
 * Monitors stock levels and generates RFQs when hitting reorder points
 * Considers lead times and sales velocity
 * 
 * Port: 3004
 */

import { PrismaClient } from '../../node_modules/@prisma/client'

const prisma = new PrismaClient()
const PORT = 3004

// Types
interface StockAlert {
  productId: string
  productName: string
  sku: string
  merchantId: string
  merchantName: string
  currentStock: number
  reorderPoint: number
  reorderQuantity: number
  daysUntilStockout: number | null
  suggestedOrderQty: number
  supplierId?: string
  supplierName?: string
  leadTimeDays: number
  lastCostPrice: number
  category: string
}

interface ReorderConfig {
  enabled: boolean
  checkIntervalMinutes: number
  autoGenerateRFQ: boolean
  safetyStockDays: number
  maxOrderValue: number
  preferredSupplierOnly: boolean
}

// Default config
const DEFAULT_CONFIG: ReorderConfig = {
  enabled: true,
  checkIntervalMinutes: 60,
  autoGenerateRFQ: true,
  safetyStockDays: 7,
  maxOrderValue: 50000,
  preferredSupplierOnly: false,
}

// In-memory store for merchant configs (would be DB in production)
const merchantConfigs = new Map<string, ReorderConfig>()

/**
 * Calculate sales velocity for a product (units per day)
 */
async function calculateSalesVelocity(productId: string, days: number = 30): Promise<number> {
  const since = new Date()
  since.setDate(since.getDate() - days)

  // Get stock movements for sales
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
 * Calculate days until stockout based on velocity
 */
function calculateDaysUntilStockout(currentStock: number, velocity: number): number | null {
  if (velocity <= 0) return null
  return Math.floor(currentStock / velocity)
}

/**
 * Calculate suggested order quantity
 */
function calculateOrderQuantity(
  currentStock: number,
  reorderPoint: number,
  reorderQuantity: number,
  velocity: number,
  leadTimeDays: number,
  safetyStockDays: number
): number {
  // If no velocity, use default reorder quantity
  if (velocity <= 0) {
    return Math.max(reorderQuantity, reorderPoint * 2)
  }

  // Calculate demand during lead time + safety stock
  const demandDuringLeadTime = velocity * leadTimeDays
  const safetyStock = velocity * safetyStockDays
  const targetStock = demandDuringLeadTime + safetyStock

  // Order enough to reach target
  const needed = targetStock - currentStock
  
  // Round up to nearest reasonable quantity
  if (needed <= 0) return reorderQuantity
  
  // Round to nearest 10 or 100 based on size
  if (needed < 50) return Math.ceil(needed / 10) * 10
  if (needed < 500) return Math.ceil(needed / 50) * 50
  return Math.ceil(needed / 100) * 100
}

/**
 * Get supplier for product (prefer primary, fallback to any)
 */
async function getSupplierForProduct(productId: string, merchantId: string): Promise<{
  supplierId: string
  supplierName: string
  leadTimeDays: number
  lastCostPrice: number
} | null> {
  // Check if product has a preferred supplier
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      costPrice: true,
      sku: true,
    },
  })

  if (!product) return null

  // Look for recent purchase orders for this SKU
  const recentPO = await prisma.purchaseOrderItem.findFirst({
    where: {
      sku: product.sku,
      po: {
        merchantId,
        status: 'delivered',
      },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      unitPrice: true,
      po: {
        select: {
          supplierId: true,
          supplier: {
            select: {
              name: true,
              deliveryDays: true,
              avgLeadTime: true,
            },
          },
        },
      },
    },
  })

  if (recentPO) {
    return {
      supplierId: recentPO.po.supplierId,
      supplierName: recentPO.po.supplier.name,
      leadTimeDays: recentPO.po.supplier.avgLeadTime || recentPO.po.supplier.deliveryDays || 7,
      lastCostPrice: recentPO.unitPrice,
    }
  }

  // Fallback: Get any active supplier for this merchant
  const supplier = await prisma.supplier.findFirst({
    where: {
      status: 'active',
      purchaseOrders: {
        some: { merchantId },
      },
    },
    orderBy: { rating: 'desc' },
    select: {
      id: true,
      name: true,
      deliveryDays: true,
      avgLeadTime: true,
    },
  })

  if (supplier) {
    return {
      supplierId: supplier.id,
      supplierName: supplier.name,
      leadTimeDays: supplier.avgLeadTime || supplier.deliveryDays || 7,
      lastCostPrice: product.costPrice || 0,
    }
  }

  return null
}

/**
 * Check all products for a merchant and find reorder candidates
 */
async function checkMerchantStock(merchantId: string): Promise<StockAlert[]> {
  const config = merchantConfigs.get(merchantId) || DEFAULT_CONFIG
  
  if (!config.enabled) return []

  const alerts: StockAlert[] = []

  // Get all active products with inventory tracking
  const products = await prisma.product.findMany({
    where: {
      merchantId,
      isActive: true,
      trackInventory: true,
    },
    include: {
      category: {
        select: { name: true },
      },
    },
  })

  for (const product of products) {
    // Check if below reorder point
    if (product.currentStock > product.reorderPoint) continue

    // Calculate velocity
    const velocity = await calculateSalesVelocity(product.id)
    const daysUntilStockout = calculateDaysUntilStockout(product.currentStock, velocity)

    // Get supplier info
    const supplierInfo = await getSupplierForProduct(product.id, merchantId)

    // Calculate suggested quantity
    const suggestedQty = calculateOrderQuantity(
      product.currentStock,
      product.reorderPoint,
      product.reorderQuantity,
      velocity,
      supplierInfo?.leadTimeDays || 7,
      config.safetyStockDays
    )

    alerts.push({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      merchantId,
      merchantName: '', // Will be filled by caller
      currentStock: product.currentStock,
      reorderPoint: product.reorderPoint,
      reorderQuantity: product.reorderQuantity,
      daysUntilStockout,
      suggestedOrderQty: suggestedQty,
      supplierId: supplierInfo?.supplierId,
      supplierName: supplierInfo?.supplierName,
      leadTimeDays: supplierInfo?.leadTimeDays || 7,
      lastCostPrice: supplierInfo?.lastCostPrice || product.costPrice || 0,
      category: product.category?.name || 'Uncategorized',
    })
  }

  return alerts
}

/**
 * Generate RFQ for stock alerts
 */
async function generateRFQ(
  merchantId: string,
  alerts: StockAlert[],
  userId?: string
): Promise<string> {
  // Group by supplier
  const bySupplier = new Map<string, StockAlert[]>()
  
  for (const alert of alerts) {
    const key = alert.supplierId || 'no-supplier'
    if (!bySupplier.has(key)) {
      bySupplier.set(key, [])
    }
    bySupplier.get(key)!.push(alert)
  }

  const rfqIds: string[] = []

  // Create RFQ for each supplier
  for (const [supplierId, supplierAlerts] of bySupplier) {
    if (supplierId === 'no-supplier') continue

    // Generate RFQ number
    const count = await prisma.rFQ.count()
    const rfqNumber = `RFQ-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`

    // Calculate required by date (lead time + buffer)
    const maxLeadTime = Math.max(...supplierAlerts.map(a => a.leadTimeDays))
    const requiredBy = new Date()
    requiredBy.setDate(requiredBy.getDate() + maxLeadTime + 3)

    const rfq = await prisma.rFQ.create({
      data: {
        number: rfqNumber,
        supplierId,
        status: 'open',
        requiredBy: requiredBy.toISOString().split('T')[0],
        notes: 'Auto-generated from stock monitoring',
        createdBy: userId,
        items: {
          create: supplierAlerts.map(alert => ({
            sku: alert.sku,
            description: alert.productName,
            quantity: alert.suggestedOrderQty,
            unit: 'each',
            notes: `Current stock: ${alert.currentStock}, Reorder point: ${alert.reorderPoint}`,
          })),
        },
      },
    })

    rfqIds.push(rfq.id)
    console.log(`[RFQ] Created ${rfqNumber} for supplier ${supplierId} with ${supplierAlerts.length} items`)
  }

  return rfqIds[0] // Return first RFQ ID
}

/**
 * Main stock check cycle
 */
async function runStockCheck(): Promise<void> {
  console.log('[AUTO-REORDER] Starting stock check cycle...')
  const startTime = Date.now()

  try {
    // Get all active merchants
    const merchants = await prisma.merchant.findMany({
      where: {
        status: 'active',
      },
      select: {
        id: true,
        name: true,
      },
    })

    console.log(`[AUTO-REORDER] Checking ${merchants.length} merchants`)

    let totalAlerts = 0
    let rfqsGenerated = 0

    for (const merchant of merchants) {
      const alerts = await checkMerchantStock(merchant.id)
      
      if (alerts.length === 0) continue

      totalAlerts += alerts.length

      // Add merchant name to alerts
      alerts.forEach(a => a.merchantName = merchant.name)

      console.log(`[AUTO-REORDER] Merchant "${merchant.name}": ${alerts.length} items need reorder`)

      // Log each alert
      for (const alert of alerts) {
        console.log(`  - ${alert.productName} (${alert.sku}): Stock ${alert.currentStock} / Reorder at ${alert.reorderPoint}`)
      }

      // Generate RFQ if auto-generate is enabled
      const config = merchantConfigs.get(merchant.id) || DEFAULT_CONFIG
      if (config.autoGenerateRFQ && alerts.some(a => a.supplierId)) {
        try {
          await generateRFQ(merchant.id, alerts.filter(a => a.supplierId))
          rfqsGenerated++
        } catch (error) {
          console.error(`[AUTO-REORDER] Failed to generate RFQ for merchant ${merchant.id}:`, error)
        }
      }
    }

    const duration = Date.now() - startTime
    console.log(`[AUTO-REORDER] Check complete in ${duration}ms. Total alerts: ${totalAlerts}, RFQs generated: ${rfqsGenerated}`)

  } catch (error) {
    console.error('[AUTO-REORDER] Error during stock check:', error)
  }
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
      service: 'auto-reorder',
      timestamp: new Date().toISOString(),
    })
  }

  // Get stock alerts for a merchant
  if (path === '/alerts' && request.method === 'GET') {
    const merchantId = url.searchParams.get('merchantId')
    if (!merchantId) {
      return Response.json({ error: 'merchantId required' }, { status: 400 })
    }

    const alerts = await checkMerchantStock(merchantId)
    return Response.json({ alerts })
  }

  // Trigger manual stock check
  if (path === '/check' && request.method === 'POST') {
    const body = await request.json().catch(() => ({}))
    const merchantId = body.merchantId

    if (merchantId) {
      const merchant = await prisma.merchant.findUnique({
        where: { id: merchantId },
        select: { name: true },
      })
      if (!merchant) {
        return Response.json({ error: 'Merchant not found' }, { status: 404 })
      }

      const alerts = await checkMerchantStock(merchantId)
      alerts.forEach(a => a.merchantName = merchant.name)
      
      return Response.json({
        merchantId,
        merchantName: merchant.name,
        alertCount: alerts.length,
        alerts,
      })
    }

    // Run full check
    await runStockCheck()
    return Response.json({ message: 'Stock check completed' })
  }

  // Generate RFQ manually
  if (path === '/rfq' && request.method === 'POST') {
    const body = await request.json()
    const { merchantId, productIds, userId } = body

    if (!merchantId || !productIds?.length) {
      return Response.json({ error: 'merchantId and productIds required' }, { status: 400 })
    }

    // Get specific products
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        merchantId,
      },
    })

    const alerts: StockAlert[] = products.map(p => ({
      productId: p.id,
      productName: p.name,
      sku: p.sku,
      merchantId,
      merchantName: '',
      currentStock: p.currentStock,
      reorderPoint: p.reorderPoint,
      reorderQuantity: p.reorderQuantity,
      daysUntilStockout: null,
      suggestedOrderQty: p.reorderQuantity,
      leadTimeDays: 7,
      lastCostPrice: p.costPrice || 0,
      category: '',
    }))

    const rfqId = await generateRFQ(merchantId, alerts, userId)
    return Response.json({ rfqId, itemCount: alerts.length })
  }

  // Update merchant config
  if (path === '/config' && request.method === 'PUT') {
    const body = await request.json()
    const { merchantId, config } = body

    if (!merchantId) {
      return Response.json({ error: 'merchantId required' }, { status: 400 })
    }

    merchantConfigs.set(merchantId, { ...DEFAULT_CONFIG, ...config })
    return Response.json({ success: true, config: merchantConfigs.get(merchantId) })
  }

  // Get merchant config
  if (path === '/config' && request.method === 'GET') {
    const merchantId = url.searchParams.get('merchantId')
    if (!merchantId) {
      return Response.json({ error: 'merchantId required' }, { status: 400 })
    }

    const config = merchantConfigs.get(merchantId) || DEFAULT_CONFIG
    return Response.json({ config })
  }

  return Response.json({ error: 'Not found' }, { status: 404 })
}

// Start server
async function main() {
  console.log(`[AUTO-REORDER] Service starting on port ${PORT}`)

  // Run initial check
  await runStockCheck()

  // Schedule periodic checks (every 60 minutes)
  const CHECK_INTERVAL = 60 * 60 * 1000
  setInterval(runStockCheck, CHECK_INTERVAL)

  // Start HTTP server
  const server = Bun.serve({
    port: PORT,
    fetch: handleRequest,
  })

  console.log(`[AUTO-REORDER] HTTP server listening on port ${PORT}`)
  console.log(`[AUTO-REORDER] Stock checks scheduled every ${CHECK_INTERVAL / 60000} minutes`)
}

main().catch(console.error)
