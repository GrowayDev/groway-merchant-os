/**
 * Settlement Processing Service
 * 
 * Processes payment settlements, reconciles transactions, and generates reports.
 * Runs on port 3005
 */

import { PrismaClient } from '../../node_modules/@prisma/client'

const prisma = new PrismaClient()
const PORT = 3005

// Types
interface SettlementTransaction {
  id: string
  transactionId: string
  grossAmount: number
  feeAmount: number
  netAmount: number
  paymentMethod: string
  transactionDate: Date
}

interface SettlementConfig {
  autoSettle: boolean
  settlementHour: number // Hour of day to process (0-23)
  minBatchAmount: number
  maxBatchTransactions: number
  settlementDays: string[] // Days of week to settle
  excludeWeekends: boolean
}

// Default configuration
const DEFAULT_CONFIG: SettlementConfig = {
  autoSettle: true,
  settlementHour: 17, // 5 PM SAST
  minBatchAmount: 100, // R100 minimum
  maxBatchTransactions: 500,
  settlementDays: ['1', '2', '3', '4', '5'], // Mon-Fri
  excludeWeekends: true,
}

// In-memory config store (would be DB in production)
const merchantConfigs = new Map<string, SettlementConfig>()

/**
 * Get settlement config for merchant
 */
async function getMerchantConfig(merchantId: string): Promise<SettlementConfig> {
  if (merchantConfigs.has(merchantId)) {
    return merchantConfigs.get(merchantId)!
  }
  
  // Try to load from DB
  const config = await prisma.systemConfig.findUnique({
    where: { key: `settlement_${merchantId}` },
  })
  
  if (config) {
    const parsed = JSON.parse(config.value || '{}')
    merchantConfigs.set(merchantId, { ...DEFAULT_CONFIG, ...parsed })
    return merchantConfigs.get(merchantId)!
  }
  
  return DEFAULT_CONFIG
}

/**
 * Calculate fees based on payment method
 */
function calculateFees(amount: number, paymentMethod: string): {
  grossAmount: number
  feeAmount: number
  netAmount: number
  feePercent: number
} {
  // South African payment method fees (approximate)
  const feeRates: Record<string, number> = {
    card: 0.0295, // 2.95% card fee
    card_credit: 0.035, // 3.5% credit card
    card_debit: 0.018, // 1.8% debit card
    qr: 0.0125, // 1.25% QR payments
    ewallet: 0.02, // 2% e-wallet
    instant_eft: 0.015, // 1.5% instant EFT
    payshap: 0.005, // 0.5% PayShap
    cash: 0, // No fee for cash
  }
  
  const feePercent = feeRates[paymentMethod] || 0.025
  const feeAmount = Math.round(amount * feePercent * 100) / 100
  
  return {
    grossAmount: amount,
    feeAmount,
    netAmount: Math.round((amount - feeAmount) * 100) / 100,
    feePercent: feePercent * 100,
  }
}

/**
 * Get pending transactions for settlement
 */
async function getPendingTransactions(merchantId: string, since: Date): Promise<SettlementTransaction[]> {
  // Get transactions from various sources
  
  // From Gopay transactions
  const gopayTransactions = await prisma.gopayTransaction.findMany({
    where: {
      merchantId,
      status: 'completed',
      settledAt: null,
      createdAt: { gte: since },
    },
    select: {
      id: true,
      amount: true,
      paymentMethod: true,
      createdAt: true,
    },
  })
  
  // From merchant transactions
  const merchantTransactions = await prisma.transaction.findMany({
    where: {
      merchantId,
      status: 'completed',
      type: { in: ['sale', 'payment'] },
      createdAt: { gte: since },
    },
    select: {
      id: true,
      total: true,
      paymentMethod: true,
      createdAt: true,
    },
  })
  
  // Combine and format
  const transactions: SettlementTransaction[] = []
  
  for (const tx of gopayTransactions) {
    const fees = calculateFees(tx.amount, tx.paymentMethod || 'card')
    transactions.push({
      id: tx.id,
      transactionId: tx.id,
      grossAmount: fees.grossAmount,
      feeAmount: fees.feeAmount,
      netAmount: fees.netAmount,
      paymentMethod: tx.paymentMethod || 'card',
      transactionDate: tx.createdAt,
    })
  }
  
  for (const tx of merchantTransactions) {
    const fees = calculateFees(tx.total, tx.paymentMethod || 'card')
    transactions.push({
      id: tx.id,
      transactionId: tx.id,
      grossAmount: fees.grossAmount,
      feeAmount: fees.feeAmount,
      netAmount: fees.netAmount,
      paymentMethod: tx.paymentMethod || 'card',
      transactionDate: tx.createdAt,
    })
  }
  
  return transactions.sort((a, b) => a.transactionDate.getTime() - b.transactionDate.getTime())
}

/**
 * Generate settlement batch number
 */
function generateBatchNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `SET-${year}${month}${day}-${random}`
}

/**
 * Create settlement batch
 */
async function createSettlementBatch(
  merchantId: string,
  transactions: SettlementTransaction[]
): Promise<{ batchId: string; batchNumber: string }> {
  const batchNumber = generateBatchNumber()
  
  // Calculate totals
  const grossAmount = transactions.reduce((sum, tx) => sum + tx.grossAmount, 0)
  const feeAmount = transactions.reduce((sum, tx) => sum + tx.feeAmount, 0)
  const netAmount = transactions.reduce((sum, tx) => sum + tx.netAmount, 0)
  
  // Determine period
  const periodStart = transactions[0]?.transactionDate || new Date()
  const periodEnd = transactions[transactions.length - 1]?.transactionDate || new Date()
  
  // Create batch
  const batch = await prisma.settlementBatch.create({
    data: {
      merchantId,
      batchNumber,
      batchType: 'payment',
      grossAmount,
      feeAmount,
      netAmount,
      transactionCount: transactions.length,
      periodStart,
      periodEnd,
      status: 'pending',
    },
  })
  
  // Create batch transactions
  for (const tx of transactions) {
    await prisma.settlementTransaction.create({
      data: {
        batchId: batch.id,
        transactionId: tx.transactionId,
        grossAmount: tx.grossAmount,
        feeAmount: tx.feeAmount,
        netAmount: tx.netAmount,
        paymentMethod: tx.paymentMethod,
        transactionDate: tx.transactionDate,
        status: 'pending',
      },
    })
  }
  
  console.log(`[SETTLEMENT] Created batch ${batchNumber} with ${transactions.length} transactions, total: R${netAmount.toFixed(2)}`)
  
  return {
    batchId: batch.id,
    batchNumber: batch.batchNumber,
  }
}

/**
 * Process pending batches
 */
async function processPendingBatches(): Promise<{ processed: number; total: number }> {
  const pendingBatches = await prisma.settlementBatch.findMany({
    where: { status: 'pending' },
    include: { transactions: true },
  })
  
  let processed = 0
  
  for (const batch of pendingBatches) {
    try {
      // Mark as processing
      await prisma.settlementBatch.update({
        where: { id: batch.id },
        data: { status: 'processing' },
      })
      
      // Simulate processing (in production, would call bank API)
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Mark transactions as settled
      for (const tx of batch.transactions) {
        await prisma.settlementTransaction.update({
          where: { id: tx.id },
          data: { status: 'settled', settledAt: new Date() },
        })
        
        // Update original transaction
        if (tx.transactionId) {
          await prisma.transaction.updateMany({
            where: { id: tx.transactionId },
            data: { settledAt: new Date() },
          }).catch(() => {}) // Ignore if not found
          
          await prisma.gopayTransaction.updateMany({
            where: { id: tx.transactionId },
            data: { settledAt: new Date() },
          }).catch(() => {}) // Ignore if not found
        }
      }
      
      // Mark batch as completed
      await prisma.settlementBatch.update({
        where: { id: batch.id },
        data: {
          status: 'completed',
          processedAt: new Date(),
        },
      })
      
      console.log(`[SETTLEMENT] Processed batch ${batch.batchNumber}`)
      processed++
    } catch (error) {
      console.error(`[SETTLEMENT] Failed to process batch ${batch.batchNumber}:`, error)
      
      await prisma.settlementBatch.update({
        where: { id: batch.id },
        data: { status: 'failed' },
      })
    }
  }
  
  return { processed, total: pendingBatches.length }
}

/**
 * Run settlement for all merchants
 */
async function runSettlements(): Promise<void> {
  console.log('[SETTLEMENT] Starting settlement run...')
  
  const merchants = await prisma.merchant.findMany({
    where: { status: 'active' },
    select: { id: true, name: true },
  })
  
  let totalBatches = 0
  let totalTransactions = 0
  let totalAmount = 0
  
  for (const merchant of merchants) {
    const config = await getMerchantConfig(merchant.id)
    
    if (!config.autoSettle) {
      console.log(`[SETTLEMENT] Auto-settlement disabled for ${merchant.name}`)
      continue
    }
    
    // Get last settlement
    const lastSettlement = await prisma.settlementBatch.findFirst({
      where: { merchantId: merchant.id, status: 'completed' },
      orderBy: { periodEnd: 'desc' },
    })
    
    const since = lastSettlement?.periodEnd || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    
    // Get pending transactions
    const transactions = await getPendingTransactions(merchant.id, since)
    
    if (transactions.length === 0) {
      console.log(`[SETTLEMENT] No pending transactions for ${merchant.name}`)
      continue
    }
    
    // Check minimum amount
    const totalNet = transactions.reduce((sum, tx) => sum + tx.netAmount, 0)
    if (totalNet < config.minBatchAmount) {
      console.log(`[SETTLEMENT] ${merchant.name}: Below minimum (R${totalNet.toFixed(2)} < R${config.minBatchAmount})`)
      continue
    }
    
    // Split into batches if needed
    const batches = []
    for (let i = 0; i < transactions.length; i += config.maxBatchTransactions) {
      batches.push(transactions.slice(i, i + config.maxBatchTransactions))
    }
    
    // Create batches
    for (const batchTransactions of batches) {
      await createSettlementBatch(merchant.id, batchTransactions)
      totalBatches++
      totalTransactions += batchTransactions.length
      totalAmount += batchTransactions.reduce((sum, tx) => sum + tx.netAmount, 0)
    }
  }
  
  console.log(`[SETTLEMENT] Created ${totalBatches} batches, ${totalTransactions} transactions, R${totalAmount.toFixed(2)} total`)
}

/**
 * HTTP Server
 */
async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const path = url.pathname
  
  // Health check
  if (path === '/health') {
    return Response.json({
      status: 'healthy',
      service: 'settlement-processor',
      timestamp: new Date().toISOString(),
    })
  }
  
  // Get settlement status for merchant
  if (path === '/status' && request.method === 'GET') {
    const merchantId = url.searchParams.get('merchantId')
    if (!merchantId) {
      return Response.json({ error: 'merchantId required' }, { status: 400 })
    }
    
    const lastBatch = await prisma.settlementBatch.findFirst({
      where: { merchantId },
      orderBy: { createdAt: 'desc' },
    })
    
    const pendingCount = await prisma.settlementBatch.count({
      where: { merchantId, status: 'pending' },
    })
    
    return Response.json({
      lastBatch: lastBatch ? {
        batchNumber: lastBatch.batchNumber,
        status: lastBatch.status,
        netAmount: lastBatch.netAmount,
        createdAt: lastBatch.createdAt,
      } : null,
      pendingBatches: pendingCount,
    })
  }
  
  // Trigger manual settlement
  if (path === '/run' && request.method === 'POST') {
    const body = await request.json().catch(() => ({}))
    const merchantId = body.merchantId
    
    if (merchantId) {
      const merchant = await prisma.merchant.findUnique({
        where: { id: merchantId },
      })
      if (!merchant) {
        return Response.json({ error: 'Merchant not found' }, { status: 404 })
      }
      
      const transactions = await getPendingTransactions(merchantId, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      
      if (transactions.length === 0) {
        return Response.json({ message: 'No pending transactions' })
      }
      
      const { batchId, batchNumber } = await createSettlementBatch(merchantId, transactions)
      
      return Response.json({
        batchId,
        batchNumber,
        transactionCount: transactions.length,
        netAmount: transactions.reduce((sum, tx) => sum + tx.netAmount, 0),
      })
    }
    
    await runSettlements()
    return Response.json({ message: 'Settlement run completed' })
  }
  
  // Process pending batches
  if (path === '/process' && request.method === 'POST') {
    const result = await processPendingBatches()
    return Response.json(result)
  }
  
  // Get batches for merchant
  if (path === '/batches' && request.method === 'GET') {
    const merchantId = url.searchParams.get('merchantId')
    if (!merchantId) {
      return Response.json({ error: 'merchantId required' }, { status: 400 })
    }
    
    const batches = await prisma.settlementBatch.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
    
    return Response.json({ batches })
  }
  
  // Update config
  if (path === '/config' && request.method === 'PUT') {
    const body = await request.json()
    const { merchantId, config } = body
    
    if (!merchantId) {
      return Response.json({ error: 'merchantId required' }, { status: 400 })
    }
    
    merchantConfigs.set(merchantId, { ...DEFAULT_CONFIG, ...config })
    
    // Save to DB
    await prisma.systemConfig.upsert({
      where: { key: `settlement_${merchantId}` },
      create: {
        key: `settlement_${merchantId}`,
        value: JSON.stringify(config),
        category: 'settlement',
      },
      update: {
        value: JSON.stringify(config),
      },
    })
    
    return Response.json({ success: true, config: merchantConfigs.get(merchantId) })
  }
  
  return Response.json({ error: 'Not found' }, { status: 404 })
}

// Main
async function main() {
  console.log(`[SETTLEMENT] Service starting on port ${PORT}`)
  
  // Process any pending batches on startup
  await processPendingBatches()
  
  // Schedule settlement runs
  // Run at configured hour each day
  const CHECK_INTERVAL = 60 * 60 * 1000 // Check every hour
  setInterval(async () => {
    const now = new Date()
    const hour = now.getHours()
    
    // Run at 17:00 (5 PM) SAST
    if (hour === 17) {
      const dayOfWeek = now.getDay().toString()
      const config = DEFAULT_CONFIG
      
      if (config.settlementDays.includes(dayOfWeek)) {
        await runSettlements()
        await processPendingBatches()
      }
    }
  }, CHECK_INTERVAL)
  
  // Start HTTP server
  const server = Bun.serve({
    port: PORT,
    fetch: handleRequest,
  })
  
  console.log(`[SETTLEMENT] HTTP server listening on port ${PORT}`)
}

main().catch(console.error)
