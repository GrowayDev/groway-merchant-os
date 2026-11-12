/**
 * Expiry Monitor Background Service
 * 
 * Monitors batch expiry dates and generates alerts
 * Configurable warning periods: 7, 14, 30 days
 * 
 * Port: 3005
 */

import { PrismaClient } from '../../node_modules/@prisma/client'

const prisma = new PrismaClient()
const PORT = 3005

// Types
interface ExpiryAlert {
  batchId: string
  batchNo: string
  productId: string
  productName: string
  sku: string
  merchantId: string
  merchantName: string
  locationId?: string
  locationName?: string
  quantity: number
  expiryDate: string
  daysUntilExpiry: number
  alertLevel: 'critical' | 'warning' | 'notice'
  action: 'dispose' | 'discount' | 'return' | 'sell_soon'
  estimatedValue: number
}

interface ExpiryConfig {
  enabled: boolean
  criticalDays: number    // Days for critical alert (e.g., 7)
  warningDays: number     // Days for warning alert (e.g., 14)
  noticeDays: number      // Days for notice alert (e.g., 30)
  checkIntervalMinutes: number
  autoMarkExpired: boolean
  notifyOnExpiry: boolean
}

// Default config
const DEFAULT_CONFIG: ExpiryConfig = {
  enabled: true,
  criticalDays: 7,
  warningDays: 14,
  noticeDays: 30,
  checkIntervalMinutes: 60,
  autoMarkExpired: true,
  notifyOnExpiry: true,
}

// In-memory store for configs
const merchantConfigs = new Map<string, ExpiryConfig>()

/**
 * Calculate days until expiry
 */
function calculateDaysUntilExpiry(expiryDate: string | Date): number {
  const expiry = new Date(expiryDate)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  expiry.setHours(0, 0, 0, 0)
  
  const diffMs = expiry.getTime() - now.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Determine alert level based on days until expiry
 */
function getAlertLevel(daysUntilExpiry: number, config: ExpiryConfig): 'critical' | 'warning' | 'notice' | null {
  if (daysUntilExpiry <= config.criticalDays) return 'critical'
  if (daysUntilExpiry <= config.warningDays) return 'warning'
  if (daysUntilExpiry <= config.noticeDays) return 'notice'
  return null
}

/**
 * Suggest action based on days until expiry
 */
function suggestAction(daysUntilExpiry: number, quantity: number): 'dispose' | 'discount' | 'return' | 'sell_soon' {
  if (daysUntilExpiry < 0) return 'dispose'
  if (daysUntilExpiry <= 3) return 'discount'
  if (daysUntilExpiry <= 7 && quantity > 50) return 'return'
  return 'sell_soon'
}

/**
 * Check all batches for expiry alerts
 */
async function checkExpiryAlerts(): Promise<ExpiryAlert[]> {
  console.log('[EXPIRY-MONITOR] Starting expiry check cycle...')
  const startTime = Date.now()
  
  const allAlerts: ExpiryAlert[] = []
  
  try {
    // Get all active batches with expiry dates
    const batches = await prisma.inventoryBatch.findMany({
      where: {
        status: 'active',
        quantity: { gt: 0 },
        expiryDate: { not: null },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            merchantId: true,
            costPrice: true,
            merchant: { select: { name: true } },
          },
        },
        location: { select: { id: true, name: true } },
      },
    })

    console.log(`[EXPIRY-MONITOR] Checking ${batches.length} batches with expiry dates`)

    for (const batch of batches) {
      if (!batch.expiryDate) continue
      
      const config = merchantConfigs.get(batch.product.merchantId) || DEFAULT_CONFIG
      if (!config.enabled) continue

      const daysUntilExpiry = calculateDaysUntilExpiry(batch.expiryDate)
      const alertLevel = getAlertLevel(daysUntilExpiry, config)
      
      if (!alertLevel) continue

      // Skip already expired if auto-mark is enabled
      if (daysUntilExpiry < 0 && config.autoMarkExpired) {
        await prisma.inventoryBatch.update({
          where: { id: batch.id },
          data: { status: 'expired' },
        })
        console.log(`[EXPIRY-MONITOR] Marked batch ${batch.batchNo} as expired`)
        continue
      }

      allAlerts.push({
        batchId: batch.id,
        batchNo: batch.batchNo,
        productId: batch.product.id,
        productName: batch.product.name,
        sku: batch.product.sku,
        merchantId: batch.product.merchantId,
        merchantName: batch.product.merchant.name,
        locationId: batch.locationId || undefined,
        locationName: batch.location?.name,
        quantity: batch.quantity,
        expiryDate: batch.expiryDate.toISOString().split('T')[0],
        daysUntilExpiry,
        alertLevel,
        action: suggestAction(daysUntilExpiry, batch.quantity),
        estimatedValue: batch.quantity * (batch.product.costPrice || 0),
      })
    }

    // Log summary
    const critical = allAlerts.filter(a => a.alertLevel === 'critical').length
    const warning = allAlerts.filter(a => a.alertLevel === 'warning').length
    const notice = allAlerts.filter(a => a.alertLevel === 'notice').length
    
    const duration = Date.now() - startTime
    console.log(`[EXPIRY-MONITOR] Check complete in ${duration}ms. Critical: ${critical}, Warning: ${warning}, Notice: ${notice}`)

  } catch (error) {
    console.error('[EXPIRY-MONITOR] Error during expiry check:', error)
  }

  return allAlerts
}

/**
 * Get expiry alerts for a specific merchant
 */
async function getMerchantExpiryAlerts(merchantId: string): Promise<ExpiryAlert[]> {
  const config = merchantConfigs.get(merchantId) || DEFAULT_CONFIG
  if (!config.enabled) return []

  const batches = await prisma.inventoryBatch.findMany({
    where: {
      product: { merchantId },
      status: 'active',
      quantity: { gt: 0 },
      expiryDate: { not: null },
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          merchantId: true,
          costPrice: true,
        },
      },
      location: { select: { id: true, name: true } },
    },
  })

  const alerts: ExpiryAlert[] = []

  for (const batch of batches) {
    if (!batch.expiryDate) continue

    const daysUntilExpiry = calculateDaysUntilExpiry(batch.expiryDate)
    const alertLevel = getAlertLevel(daysUntilExpiry, config)
    
    if (!alertLevel) continue

    alerts.push({
      batchId: batch.id,
      batchNo: batch.batchNo,
      productId: batch.product.id,
      productName: batch.product.name,
      sku: batch.product.sku,
      merchantId,
      merchantName: '',
      locationId: batch.locationId || undefined,
      locationName: batch.location?.name,
      quantity: batch.quantity,
      expiryDate: batch.expiryDate.toISOString().split('T')[0],
      daysUntilExpiry,
      alertLevel,
      action: suggestAction(daysUntilExpiry, batch.quantity),
      estimatedValue: batch.quantity * (batch.product.costPrice || 0),
    })
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
      service: 'expiry-monitor',
      timestamp: new Date().toISOString(),
    })
  }

  // Get all expiry alerts
  if (path === '/alerts' && request.method === 'GET') {
    const merchantId = url.searchParams.get('merchantId')
    
    if (merchantId) {
      const alerts = await getMerchantExpiryAlerts(merchantId)
      return Response.json({ alerts })
    }

    const alerts = await checkExpiryAlerts()
    return Response.json({ alerts })
  }

  // Get alerts by level
  if (path === '/alerts/critical' && request.method === 'GET') {
    const alerts = await checkExpiryAlerts()
    return Response.json({ alerts: alerts.filter(a => a.alertLevel === 'critical') })
  }

  // Mark batch as expired
  if (path === '/batch/expire' && request.method === 'POST') {
    const body = await request.json()
    const { batchId } = body

    if (!batchId) {
      return Response.json({ error: 'batchId required' }, { status: 400 })
    }

    await prisma.inventoryBatch.update({
      where: { id: batchId },
      data: { status: 'expired' },
    })

    return Response.json({ success: true, batchId })
  }

  // Extend expiry date
  if (path === '/batch/extend' && request.method === 'POST') {
    const body = await request.json()
    const { batchId, newExpiryDate, reason } = body

    if (!batchId || !newExpiryDate) {
      return Response.json({ error: 'batchId and newExpiryDate required' }, { status: 400 })
    }

    await prisma.inventoryBatch.update({
      where: { id: batchId },
      data: {
        expiryDate: new Date(newExpiryDate),
        notes: reason ? `Extended: ${reason}` : undefined,
      },
    })

    return Response.json({ success: true, batchId, newExpiryDate })
  }

  // Get config
  if (path === '/config' && request.method === 'GET') {
    const merchantId = url.searchParams.get('merchantId')
    if (!merchantId) {
      return Response.json({ error: 'merchantId required' }, { status: 400 })
    }

    const config = merchantConfigs.get(merchantId) || DEFAULT_CONFIG
    return Response.json({ config })
  }

  // Update config
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
    const alerts = await checkExpiryAlerts()
    return Response.json({ message: 'Check completed', alertCount: alerts.length })
  }

  return Response.json({ error: 'Not found' }, { status: 404 })
}

// Start server
async function main() {
  console.log(`[EXPIRY-MONITOR] Service starting on port ${PORT}`)

  // Run initial check
  await checkExpiryAlerts()

  // Schedule periodic checks (every 60 minutes)
  const CHECK_INTERVAL = 60 * 60 * 1000
  setInterval(checkExpiryAlerts, CHECK_INTERVAL)

  // Start HTTP server
  const server = Bun.serve({
    port: PORT,
    fetch: handleRequest,
  })

  console.log(`[EXPIRY-MONITOR] HTTP server listening on port ${PORT}`)
  console.log(`[EXPIRY-MONITOR] Checks scheduled every ${CHECK_INTERVAL / 60000} minutes`)
}

main().catch(console.error)
