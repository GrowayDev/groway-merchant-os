/**
 * Inventory Integration Service
 * Connects GroSupply procurement with Inventory module
 * 
 * Phase 4 Implementation:
 * - 4-a: Auto-Create Inventory on PO Delivery
 * - 4-b: 3-Way GRN Matching (PO vs Invoice vs Received)
 * - 4-c: Batch Creation on GRN
 * - 4-d: Weighted Average Cost Calculation
 */

import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// ============================================
// Types
// ============================================

interface GRNItem {
  id: string
  sku: string
  description: string | null
  orderedQty: number
  receivedQty: number
  rejectedQty: number
  rejectReason: string | null
  batchNumber: string | null
  expiryDate: string | null
  unitPrice: number
}

interface GRNWithDetails {
  id: string
  number: string
  poId: string
  status: string
  items: GRNItem[]
  po: {
    id: string
    number: string
    supplierId: string
    merchantId: string
    branchId?: string | null
    items: Array<{
      id: string
      sku: string
      description: string
      quantity: number
      unitPrice: number
      receivedQty: number
    }>
    supplier?: {
      id: string
      name: string
    } | null
  }
  receivedBy?: string | null
}

interface ThreeWayMatchResult {
  sku: string
  description: string
  poQuantity: number
  invoiceQuantity: number | null
  receivedQuantity: number
  matched: boolean
  variance: number
  varianceType: 'none' | 'over' | 'under' | 'missing_invoice'
  unitPrice: number
  totalValue: number
}

// ============================================
// 4-a: Auto-Create Inventory on PO Delivery
// ============================================

/**
 * Process GRN completion and update inventory
 * This is called when a GRN is completed to:
 * 1. Create stock movements for each item
 * 2. Update product stock on hand
 * 3. Create batches if batch tracking is required
 * 4. Update weighted average cost
 */
export async function processGRNInventoryUpdate(
  grn: GRNWithDetails,
  userId?: string,
  userName?: string
): Promise<{
  success: boolean
  movements: Array<{ id: string; sku: string; quantity: number }>
  batches: Array<{ id: string; batchNumber: string; sku: string }>
  errors: Array<{ sku: string; error: string }>
}> {
  const movements: Array<{ id: string; sku: string; quantity: number }> = []
  const batches: Array<{ id: string; batchNumber: string; sku: string }> = []
  const errors: Array<{ sku: string; error: string }> = []

  const merchantId = grn.po.merchantId
  const branchId = grn.po.branchId

  // Get or create default branch if not specified
  let targetBranchId = branchId
  if (!targetBranchId) {
    const defaultBranch = await db.branch.findFirst({
      where: { merchantId }
    })
    if (defaultBranch) {
      targetBranchId = defaultBranch.id
    } else {
      return {
        success: false,
        movements: [],
        batches: [],
        errors: [{ sku: 'N/A', error: 'No branch found for merchant' }]
      }
    }
  }

  for (const item of grn.items) {
    if (item.receivedQty <= 0) continue

    try {
      // Find product by SKU
      const product = await db.product.findFirst({
        where: {
          merchantId,
          sku: item.sku
        }
      })

      if (!product) {
        // Auto-create product if not exists
        const newProduct = await db.product.create({
          data: {
            merchantId,
            sku: item.sku,
            name: item.description || item.sku,
            description: item.description,
            costPrice: item.unitPrice,
            sellingPrice: item.unitPrice * 1.3, // Default 30% margin
            currentStock: 0,
            unit: 'each'
          }
        })

        // Process inventory for new product
        const result = await processItemInventory(
          newProduct.id,
          merchantId,
          targetBranchId,
          item,
          grn,
          userId,
          userName
        )
        
        if (result.movement) movements.push(result.movement)
        if (result.batch) batches.push(result.batch)
      } else {
        // Process inventory for existing product
        const result = await processItemInventory(
          product.id,
          merchantId,
          targetBranchId,
          item,
          grn,
          userId,
          userName
        )
        
        if (result.movement) movements.push(result.movement)
        if (result.batch) batches.push(result.batch)
      }
    } catch (error) {
      console.error(`Error processing GRN item ${item.sku}:`, error)
      errors.push({
        sku: item.sku,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  return {
    success: errors.length === 0,
    movements,
    batches,
    errors
  }
}

/**
 * Process inventory for a single GRN item
 */
async function processItemInventory(
  productId: string,
  merchantId: string,
  branchId: string,
  item: GRNItem,
  grn: GRNWithDetails,
  userId?: string,
  userName?: string
): Promise<{
  movement?: { id: string; sku: string; quantity: number }
  batch?: { id: string; batchNumber: string; sku: string }
}> {
  const result: { movement?: { id: string; sku: string; quantity: number }; batch?: { id: string; batchNumber: string; sku: string } } = {}

  // Get current product stock
  const product = await db.product.findUnique({
    where: { id: productId }
  })

  if (!product) {
    throw new Error(`Product not found: ${productId}`)
  }

  const previousStock = product.currentStock
  const newStock = previousStock + item.receivedQty

  // Use transaction for atomic updates
  await db.$transaction(async (tx) => {
    // 1. Create batch if batch number provided or product requires batch tracking
    let batchId: string | null = null
    
    if (item.batchNumber) {
      // Check if batch already exists
      let batch = await tx.inventoryBatch.findFirst({
        where: {
          merchantId,
          branchId,
          productId,
          batchNumber: item.batchNumber
        }
      })

      if (batch) {
        // Update existing batch
        batch = await tx.inventoryBatch.update({
          where: { id: batch.id },
          data: {
            currentQty: { increment: item.receivedQty },
            availableQty: { increment: item.receivedQty },
            initialQty: { increment: item.receivedQty }
          }
        })
        batchId = batch.id
      } else {
        // Create new batch
        const newBatch = await tx.inventoryBatch.create({
          data: {
            merchantId,
            branchId,
            productId,
            batchNumber: item.batchNumber,
            initialQty: item.receivedQty,
            currentQty: item.receivedQty,
            availableQty: item.receivedQty,
            unitCost: item.unitPrice,
            totalValue: item.receivedQty * item.unitPrice,
            expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
            sourceType: 'grn',
            sourceId: grn.id,
            status: 'active'
          }
        })
        batchId = newBatch.id
        result.batch = { id: newBatch.id, batchNumber: item.batchNumber, sku: item.sku }
      }

      // Create batch transaction
      await tx.batchTransaction.create({
        data: {
          batchId,
          type: 'received',
          quantity: item.receivedQty,
          balanceAfter: item.receivedQty,
          unitCost: item.unitPrice,
          totalCost: item.receivedQty * item.unitPrice,
          referenceType: 'grn',
          referenceId: grn.id,
          referenceNumber: grn.number,
          performedBy: userId,
          performedByName: userName,
          notes: `Received via GRN ${grn.number}`
        }
      })
    }

    // 2. Create stock movement
    const idempotencyKey = `grn-${grn.id}-${item.sku}`
    
    const movement = await tx.stockMovement.create({
      data: {
        merchantId,
        branchId,
        productId,
        batchId,
        idempotencyKey,
        type: 'grn',
        direction: 'in',
        quantity: item.receivedQty,
        previousStock,
        newStock,
        unitCost: item.unitPrice,
        totalCost: item.receivedQty * item.unitPrice,
        referenceType: 'grn',
        referenceId: grn.id,
        referenceNumber: grn.number,
        performedBy: userId,
        performedByName: userName,
        notes: `GRN ${grn.number} from ${grn.po.supplier?.name || 'Supplier'}`
      }
    })
    
    result.movement = { id: movement.id, sku: item.sku, quantity: item.receivedQty }

    // 3. Update product stock and weighted average cost
    const newCostPrice = calculateWeightedAverageCost(
      previousStock,
      product.costPrice,
      item.receivedQty,
      item.unitPrice
    )

    await tx.product.update({
      where: { id: productId },
      data: {
        currentStock: newStock,
        costPrice: newCostPrice,
        lastSoldAt: product.lastSoldAt // Keep existing
      }
    })

    // 4. Create cost history record
    await tx.costHistory.create({
      data: {
        productId,
        previousCost: product.costPrice,
        newCost: newCostPrice,
        reason: 'grn_receipt',
        referenceType: 'grn',
        referenceId: grn.id,
        referenceNumber: grn.number,
        createdBy: userId,
        createdByName: userName
      }
    })
  })

  return result
}

// ============================================
// 4-b: 3-Way GRN Matching
// ============================================

/**
 * Perform 3-way matching: PO vs Invoice vs Received
 * Returns match status for each line item
 */
export async function performThreeWayMatch(
  grnId: string
): Promise<{
  matched: boolean
  items: ThreeWayMatchResult[]
  summary: {
    totalItems: number
    matchedItems: number
    varianceItems: number
    totalVarianceValue: number
  }
}> {
  const grn = await db.goodsReceivedNote.findUnique({
    where: { id: grnId },
    include: {
      items: true,
      po: {
        include: {
          items: true
        }
      }
    }
  })

  if (!grn || !grn.po) {
    throw new Error('GRN or PO not found')
  }

  const matchResults: ThreeWayMatchResult[] = []

  // Get invoice quantities if available (from supplier invoices linked to PO)
  // For now, we'll use null for invoice quantities until invoice module is integrated
  const invoiceQuantities: Map<string, number> = new Map()

  for (const grnItem of grn.items) {
    const poItem = grn.po.items.find(pi => pi.sku === grnItem.sku)
    const invoiceQty = invoiceQuantities.get(grnItem.sku) || null

    const poQty = poItem?.quantity || 0
    const receivedQty = grnItem.receivedQty

    let variance = receivedQty - poQty
    let matched = false
    let varianceType: 'none' | 'over' | 'under' | 'missing_invoice' = 'none'

    // Check match status
    if (invoiceQty !== null) {
      // Full 3-way match
      matched = poQty === invoiceQty && invoiceQty === receivedQty
      variance = receivedQty - poQty
      varianceType = variance === 0 ? 'none' : variance > 0 ? 'over' : 'under'
    } else {
      // 2-way match (PO vs Received only)
      matched = poQty === receivedQty
      varianceType = matched ? 'none' : variance > 0 ? 'over' : 'under'
    }

    // Allow 5% tolerance
    const tolerance = poQty * 0.05
    if (Math.abs(variance) <= tolerance) {
      matched = true
      varianceType = 'none'
    }

    matchResults.push({
      sku: grnItem.sku,
      description: grnItem.description || poItem?.description || '',
      poQuantity: poQty,
      invoiceQuantity: invoiceQty,
      receivedQuantity: receivedQty,
      matched,
      variance,
      varianceType,
      unitPrice: grnItem.unitPrice,
      totalValue: receivedQty * grnItem.unitPrice
    })
  }

  const summary = {
    totalItems: matchResults.length,
    matchedItems: matchResults.filter(r => r.matched).length,
    varianceItems: matchResults.filter(r => !r.matched).length,
    totalVarianceValue: matchResults.reduce((sum, r) => sum + (r.variance * r.unitPrice), 0)
  }

  return {
    matched: summary.varianceItems === 0,
    items: matchResults,
    summary
  }
}

// ============================================
// 4-c: Batch Creation on GRN
// ============================================

/**
 * Auto-generate batch number if not provided
 */
export function generateBatchNumber(
  supplierCode?: string,
  productSku?: string,
  date?: Date
): string {
  const d = date || new Date()
  const year = d.getFullYear().toString().slice(-2)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  
  const prefix = supplierCode?.substring(0, 3).toUpperCase() || 'GRN'
  const product = productSku?.substring(0, 4).toUpperCase() || 'ITEM'
  
  return `${prefix}-${product}-${year}${month}${day}-${random}`
}

/**
 * Create batches for GRN items that require batch tracking
 */
export async function createBatchesForGRN(
  grnId: string,
  merchantId: string,
  branchId: string
): Promise<Array<{ id: string; batchNumber: string; sku: string }>> {
  const grn = await db.goodsReceivedNote.findUnique({
    where: { id: grnId },
    include: {
      items: true,
      po: {
        include: {
          supplier: true
        }
      }
    }
  })

  if (!grn) {
    throw new Error('GRN not found')
  }

  const batches: Array<{ id: string; batchNumber: string; sku: string }> = []

  for (const item of grn.items) {
    if (item.receivedQty <= 0) continue

    // Find product to check if batch tracking is required
    const product = await db.product.findFirst({
      where: {
        merchantId,
        sku: item.sku
      }
    })

    // Skip if product doesn't exist or doesn't require batch tracking
    if (!product) continue

    // Generate batch number if not provided
    const batchNumber = item.batchNumber || generateBatchNumber(
      grn.po.supplier?.name,
      item.sku,
      new Date()
    )

    // Check if batch already exists
    const existingBatch = await db.inventoryBatch.findFirst({
      where: {
        merchantId,
        branchId,
        productId: product.id,
        batchNumber
      }
    })

    if (!existingBatch) {
      const batch = await db.inventoryBatch.create({
        data: {
          merchantId,
          branchId,
          productId: product.id,
          batchNumber,
          initialQty: item.receivedQty,
          currentQty: item.receivedQty,
          availableQty: item.receivedQty,
          unitCost: item.unitPrice,
          totalValue: item.receivedQty * item.unitPrice,
          expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
          sourceType: 'grn',
          sourceId: grnId,
          status: 'active'
        }
      })

      batches.push({
        id: batch.id,
        batchNumber: batch.batchNumber,
        sku: item.sku
      })
    }
  }

  return batches
}

// ============================================
// 4-d: Weighted Average Cost Calculation
// ============================================

/**
 * Calculate weighted average cost
 * Formula: (existingQty × oldCost + newQty × newCost) / (existingQty + newQty)
 */
export function calculateWeightedAverageCost(
  existingQty: number,
  existingCost: number,
  newQty: number,
  newCost: number
): number {
  if (existingQty <= 0) return newCost
  if (newQty <= 0) return existingCost

  const totalQty = existingQty + newQty
  const totalCost = (existingQty * existingCost) + (newQty * newCost)
  
  return Math.round((totalCost / totalQty) * 100) / 100 // Round to 2 decimal places
}

// ============================================
// Stock Alert Generation
// ============================================

/**
 * Generate stock alerts based on current stock levels
 */
export async function generateStockAlerts(
  merchantId: string,
  branchId?: string
): Promise<Array<{ type: string; productId: string; message: string }>> {
  const alerts: Array<{ type: string; productId: string; message: string }> = []

  // Get all products with low stock or out of stock
  const products = await db.product.findMany({
    where: {
      merchantId,
      currentStock: { lte: db.product.fields.lowStockThreshold }
    }
  })

  for (const product of products) {
    if (product.currentStock <= 0) {
      alerts.push({
        type: 'out_of_stock',
        productId: product.id,
        message: `${product.name} (${product.sku}) is out of stock`
      })
    } else if (product.currentStock <= product.lowStockThreshold) {
      alerts.push({
        type: 'low_stock',
        productId: product.id,
        message: `${product.name} (${product.sku}) is low on stock (${product.currentStock} remaining)`
      })
    }
  }

  // Check for expiring batches
  const expiringBatches = await db.inventoryBatch.findMany({
    where: {
      merchantId,
      branchId: branchId || undefined,
      expiryDate: {
        lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        gte: new Date()
      },
      status: 'active',
      currentQty: { gt: 0 }
    },
    include: {
      product: true
    }
  })

  for (const batch of expiringBatches) {
    const daysUntilExpiry = Math.ceil(
      (batch.expiryDate!.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
    )

    alerts.push({
      type: 'expiring_soon',
      productId: batch.productId,
      message: `${batch.product.name} (Batch: ${batch.batchNumber}) expires in ${daysUntilExpiry} days`
    })
  }

  return alerts
}

// ============================================
// FIFO Consumption Helpers
// ============================================

/**
 * Get batches for FIFO consumption (oldest/expiring first)
 */
export async function getFIFOBatches(
  productId: string,
  branchId: string
): Promise<Array<{
  id: string
  batchNumber: string
  currentQty: number
  unitCost: number
  expiryDate: Date | null
  receivedAt: Date
}>> {
  const batches = await db.inventoryBatch.findMany({
    where: {
      productId,
      branchId,
      status: 'active',
      currentQty: { gt: 0 }
    },
    orderBy: [
      { expiryDate: 'asc' },  // Expire date first (FEFO for perishables)
      { createdAt: 'asc' }    // Then received date (FIFO)
    ]
  })

  return batches.map(b => ({
    id: b.id,
    batchNumber: b.batchNumber,
    currentQty: b.currentQty,
    unitCost: b.unitCost,
    expiryDate: b.expiryDate,
    receivedAt: b.createdAt
  }))
}

/**
 * Calculate batch consumption for a given quantity
 */
export async function calculateFIFOConsumption(
  productId: string,
  branchId: string,
  quantity: number
): Promise<{
  success: boolean
  consumptions: Array<{
    batchId: string
    batchNumber: string
    quantity: number
    unitCost: number
    totalCost: number
  }>
  shortfall: number
}> {
  const batches = await getFIFOBatches(productId, branchId)
  
  const consumptions: Array<{
    batchId: string
    batchNumber: string
    quantity: number
    unitCost: number
    totalCost: number
  }> = []

  let remaining = quantity

  for (const batch of batches) {
    if (remaining <= 0) break

    const consumeQty = Math.min(batch.currentQty, remaining)
    
    consumptions.push({
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      quantity: consumeQty,
      unitCost: batch.unitCost,
      totalCost: consumeQty * batch.unitCost
    })

    remaining -= consumeQty
  }

  return {
    success: remaining === 0,
    consumptions,
    shortfall: remaining
  }
}
