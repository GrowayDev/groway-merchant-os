/**
 * Auto-RFQ Service
 * Automatically generates RFQs when stock reaches reorder points
 * 
 * Phase 4-d Implementation
 */

import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// ============================================
// Types
// ============================================

interface ReorderCheck {
  productId: string
  productSku: string
  productName: string
  currentStock: number
  reorderPoint: number
  reorderQty: number
  daysOfStock: number
  urgency: 'critical' | 'high' | 'normal'
  preferredSupplier?: {
    id: string
    name: string
    leadTime: number
  }
  estimatedCost?: number
}

interface AutoRFQResult {
  rfqId: string
  rfqNumber: string
  itemCount: number
  estimatedValue: number
  items: Array<{
    productId: string
    sku: string
    name: string
    quantity: number
    estimatedCost: number
  }>
}

// ============================================
// Main Functions
// ============================================

/**
 * Check all products for reorder needs
 * Returns list of products that need reordering
 */
export async function checkReorderPoints(
  merchantId: string,
  branchId?: string
): Promise<ReorderCheck[]> {
  // Get all products that track inventory
  const products = await db.product.findMany({
    where: {
      merchantId,
      trackInventory: true,
      isActive: true,
      // Only products at or below reorder point
      currentStock: { lte: db.product.fields.reorderPoint }
    }
  })

  const reorderChecks: ReorderCheck[] = []

  for (const product of products) {
    // Calculate days of stock remaining
    // Use average daily sales (simplified - in production, calculate from historical data)
    const avgDailySales = product.timesSold > 0 
      ? product.timesSold / 30 // Assume last 30 days
      : 1 // Default assumption

    const daysOfStock = avgDailySales > 0 
      ? Math.ceil(product.currentStock / avgDailySales)
      : 999 // No sales history = plenty of stock

    // Determine urgency
    let urgency: 'critical' | 'high' | 'normal' = 'normal'
    if (product.currentStock <= 0) {
      urgency = 'critical'
    } else if (daysOfStock <= 7) {
      urgency = 'high'
    } else if (daysOfStock <= 14) {
      urgency = 'normal'
    }

    // Get preferred supplier from recent POs
    const recentPO = await db.purchaseOrder.findFirst({
      where: {
        merchantId,
        items: {
          some: { sku: product.sku }
        },
        status: { in: ['completed', 'delivered'] }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            rating: true
          }
        }
      }
    })

    const preferredSupplier = recentPO?.supplier ? {
      id: recentPO.supplier.id,
      name: recentPO.supplier.name,
      leadTime: 7 // Default lead time
    } : undefined

    reorderChecks.push({
      productId: product.id,
      productSku: product.sku,
      productName: product.name,
      currentStock: product.currentStock,
      reorderPoint: product.reorderPoint,
      reorderQty: product.reorderQuantity || product.reorderPoint * 2,
      daysOfStock,
      urgency,
      preferredSupplier,
      estimatedCost: product.costPrice * (product.reorderQuantity || product.reorderPoint * 2)
    })
  }

  // Sort by urgency
  return reorderChecks.sort((a, b) => {
    const urgencyOrder = { critical: 0, high: 1, normal: 2 }
    return urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
  })
}

/**
 * Generate RFQ number
 */
function generateRFQNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `RFQ-${year}${month}-${random}`
}

/**
 * Auto-create RFQ from reorder check
 */
export async function createAutoRFQ(
  merchantId: string,
  items: ReorderCheck[],
  userId?: string,
  userName?: string
): Promise<AutoRFQResult> {
  const rfqNumber = generateRFQNumber()

  // Group items by preferred supplier
  const supplierGroups = new Map<string, ReorderCheck[]>()
  const itemsWithoutSupplier: ReorderCheck[] = []

  for (const item of items) {
    if (item.preferredSupplier) {
      const existing = supplierGroups.get(item.preferredSupplier.id) || []
      existing.push(item)
      supplierGroups.set(item.preferredSupplier.id, existing)
    } else {
      itemsWithoutSupplier.push(item)
    }
  }

  // If we have multiple suppliers, create separate RFQs per supplier
  // For now, we'll create one consolidated RFQ
  const allItems = items.map(item => ({
    productId: item.productId,
    sku: item.productSku,
    name: item.productName,
    quantity: item.reorderQty,
    estimatedCost: item.estimatedCost || 0
  }))

  // Find or get all active suppliers
  const suppliers = await db.supplier.findMany({
    where: {
      merchantId,
      status: 'active'
    },
    take: 5 // Limit to 5 suppliers for RFQ
  })

  // Create RFQ
  const rfq = await db.requestForQuotation.create({
    data: {
      number: rfqNumber,
      merchantId,
      status: 'draft',
      requestedBy: userId,
      requestedByName: userName,
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days validity
      notes: 'Auto-generated from inventory reorder alerts',
      internalNotes: `Auto-generated based on ${items.length} products at reorder point`,
      items: {
        create: allItems.map(item => ({
          sku: item.sku,
          description: item.name,
          quantity: item.quantity,
          unit: 'each',
          estimatedUnitPrice: item.estimatedCost / item.quantity || 0
        }))
      }
    },
    include: {
      items: true
    }
  })

  // Create supplier RFQs
  for (const supplier of suppliers) {
    await db.supplierRFQ.create({
      data: {
        rfqId: rfq.id,
        supplierId: supplier.id,
        status: 'pending',
        sentAt: new Date()
      }
    })
  }

  // Create stock alert for tracking
  for (const item of items) {
    await db.stockAlert.create({
      data: {
        merchantId,
        productId: item.productId,
        type: item.currentStock <= 0 ? 'out_of_stock' : 'low_stock',
        severity: item.urgency === 'critical' ? 'critical' : 'warning',
        status: 'active',
        message: `${item.productName} at reorder point (${item.currentStock} remaining)`,
        currentValue: item.currentStock,
        thresholdValue: item.reorderPoint,
        daysOfStock: item.daysOfStock
      }
    })
  }

  return {
    rfqId: rfq.id,
    rfqNumber: rfq.number,
    itemCount: allItems.length,
    estimatedValue: allItems.reduce((sum, i) => sum + i.estimatedCost, 0),
    items: allItems
  }
}

/**
 * Process auto-RFQ for a merchant
 * This is the main entry point for the auto-RFQ workflow
 */
export async function processAutoRFQ(
  merchantId: string,
  options?: {
    branchId?: string
    minUrgency?: 'critical' | 'high' | 'normal'
    autoCreate?: boolean
    userId?: string
    userName?: string
  }
): Promise<{
  needsReorder: ReorderCheck[]
  rfqCreated: boolean
  rfq?: AutoRFQResult
  message: string
}> {
  // Check reorder points
  const reorderItems = await checkReorderPoints(
    merchantId, 
    options?.branchId
  )

  if (reorderItems.length === 0) {
    return {
      needsReorder: [],
      rfqCreated: false,
      message: 'No products at reorder point'
    }
  }

  // Filter by minimum urgency
  const filteredItems = options?.minUrgency 
    ? reorderItems.filter(item => {
        const urgencyLevel = { critical: 0, high: 1, normal: 2 }
        return urgencyLevel[item.urgency] <= urgencyLevel[options.minUrgency!]
      })
    : reorderItems

  if (filteredItems.length === 0) {
    return {
      needsReorder: reorderItems,
      rfqCreated: false,
      message: `${reorderItems.length} products need reorder but filtered by urgency`
    }
  }

  // Auto-create RFQ if requested
  if (options?.autoCreate) {
    const rfq = await createAutoRFQ(
      merchantId,
      filteredItems,
      options.userId,
      options.userName
    )

    return {
      needsReorder: reorderItems,
      rfqCreated: true,
      rfq,
      message: `RFQ ${rfq.rfqNumber} created for ${rfq.itemCount} items`
    }
  }

  return {
    needsReorder: reorderItems,
    rfqCreated: false,
    message: `${filteredItems.length} products need reorder`
  }
}

/**
 * Get reorder suggestions with supplier recommendations
 */
export async function getReorderSuggestions(
  merchantId: string
): Promise<Array<ReorderCheck & {
  suppliers: Array<{
    id: string
    name: string
    rating: number
    lastOrderDate?: Date
    lastUnitPrice?: number
  }>
}>> {
  const reorderItems = await checkReorderPoints(merchantId)

  const suggestions = await Promise.all(
    reorderItems.map(async (item) => {
      // Get suppliers that have supplied this SKU before
      const supplierHistory = await db.purchaseOrder.findMany({
        where: {
          merchantId,
          items: {
            some: { sku: item.productSku }
          }
        },
        include: {
          supplier: true,
          items: {
            where: { sku: item.productSku }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 3
      })

      const suppliers = supplierHistory.map(po => ({
        id: po.supplier?.id || '',
        name: po.supplier?.name || 'Unknown',
        rating: po.supplier?.rating || 0,
        lastOrderDate: po.createdAt,
        lastUnitPrice: po.items[0]?.unitPrice
      }))

      return {
        ...item,
        suppliers
      }
    })
  )

  return suggestions
}

/**
 * Calculate reorder quantity using EOQ formula
 * EOQ = sqrt((2 * D * S) / H)
 * Where:
 * D = Annual demand
 * S = Order cost (fixed cost per order)
 * H = Holding cost (cost to hold one unit for a year)
 */
export function calculateEOQ(
  annualDemand: number,
  orderCost: number = 50, // Default R50 per order
  holdingCostPercent: number = 0.25 // Default 25% of unit cost per year
): number {
  if (annualDemand <= 0) return 0

  const holdingCost = orderCost * holdingCostPercent
  if (holdingCost <= 0) return annualDemand / 12 // Monthly demand as fallback

  const eoq = Math.sqrt((2 * annualDemand * orderCost) / holdingCost)
  
  return Math.round(eoq)
}

/**
 * Calculate safety stock
 * Safety Stock = Z * σ * √L
 * Where:
 * Z = Service level factor (e.g., 1.65 for 95% service level)
 * σ = Standard deviation of demand
 * L = Lead time in days
 */
export function calculateSafetyStock(
  demandStdDev: number,
  leadTimeDays: number,
  serviceLevelFactor: number = 1.65 // 95% service level
): number {
  return Math.round(serviceLevelFactor * demandStdDev * Math.sqrt(leadTimeDays))
}

/**
 * Calculate reorder point
 * Reorder Point = (Average Daily Demand * Lead Time) + Safety Stock
 */
export function calculateReorderPoint(
  avgDailyDemand: number,
  leadTimeDays: number,
  safetyStock: number
): number {
  return Math.round((avgDailyDemand * leadTimeDays) + safetyStock)
}
