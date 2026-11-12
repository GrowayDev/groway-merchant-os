/**
 * Settlement Processor Background Service
 * Handles payment reconciliation and merchant payouts
 * Port: 3005
 */

import { PrismaClient } from '@prisma/client';
import http from 'http';

const prisma = new PrismaClient({
  datasources: {
    db: { url: 'file:../../dev.db' }
  }
});

const PORT = 3005;

interface SettlementBatch {
  merchantId: string;
  totalAmount: number;
  transactionCount: number;
  transactionIds: string[];
}

interface MerchantSettlement {
  merchantId: string;
  merchantName: string;
  grossAmount: number;
  fees: number;
  netAmount: number;
  transactionCount: number;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
}

/**
 * Process pending settlements
 */
async function processSettlements(): Promise<{
  processed: number;
  totalAmount: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let processed = 0;
  let totalAmount = 0;

  try {
    // Get pending settlements
    const pendingSettlements = await prisma.gopaySettlement.findMany({
      where: { status: 'pending' },
      include: {
        merchant: true,
      },
      take: 100,
    });

    console.log(`[Settlement] Found ${pendingSettlements.length} pending settlements`);

    for (const settlement of pendingSettlements) {
      try {
        // Update to processing
        await prisma.gopaySettlement.update({
          where: { id: settlement.id },
          data: { status: 'processing' },
        });

        // Get transactions for this batch
        const transactions = await prisma.gopayTransaction.findMany({
          where: {
            merchantId: settlement.merchantId,
            settlementStatus: 'pending',
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
        });

        // Calculate fees (example: 2.5%)
        const grossAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);
        const feeRate = 0.025;
        const fees = grossAmount * feeRate;
        const netAmount = grossAmount - fees;

        // Simulate bank transfer
        const bankReference = `STL-${Date.now()}-${settlement.merchantId.slice(-4)}`;
        
        // Update settlement
        await prisma.gopaySettlement.update({
          where: { id: settlement.id },
          data: {
            status: 'completed',
            totalAmount: netAmount,
            transactionCount: transactions.length,
            processedAt: new Date(),
            bankReference,
          },
        });

        // Mark transactions as settled
        await prisma.gopayTransaction.updateMany({
          where: {
            id: { in: transactions.map(t => t.id) },
          },
          data: {
            settlementStatus: 'settled',
            settledAt: new Date(),
          },
        });

        processed++;
        totalAmount += netAmount;

        console.log(`[Settlement] Processed ${settlement.batchId}: R${netAmount.toFixed(2)} to ${settlement.merchant.businessName}`);

      } catch (error) {
        errors.push(`Settlement ${settlement.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        // Mark as failed
        await prisma.gopaySettlement.update({
          where: { id: settlement.id },
          data: { status: 'failed' },
        });
      }
    }

  } catch (error) {
    errors.push(`General error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return { processed, totalAmount, errors };
}

/**
 * Generate daily settlements for merchants
 */
async function generateDailySettlements(): Promise<{
  created: number;
  merchants: string[];
}> {
  const merchants: string[] = [];
  let created = 0;

  try {
    // Get merchants with pending transactions
    const merchantsWithPending = await prisma.gopayTransaction.groupBy({
      by: ['merchantId'],
      where: {
        settlementStatus: 'pending',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    for (const merchant of merchantsWithPending) {
      if (!merchant.merchantId) continue;

      // Create settlement batch
      const batchId = `BATCH-${Date.now()}-${merchant.merchantId.slice(-6)}`;

      await prisma.gopaySettlement.create({
        data: {
          merchantId: merchant.merchantId,
          batchId,
          totalAmount: merchant._sum.amount || 0,
          transactionCount: merchant._count.id,
          status: 'pending',
          scheduledAt: new Date(),
        },
      });

      created++;
      merchants.push(merchant.merchantId);

      console.log(`[Settlement] Created batch ${batchId} for merchant ${merchant.merchantId}`);
    }

  } catch (error) {
    console.error('[Settlement] Error generating settlements:', error);
  }

  return { created, merchants };
}

/**
 * Get settlement statistics
 */
async function getSettlementStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [pending, processing, completed, failed] = await Promise.all([
    prisma.gopaySettlement.count({ where: { status: 'pending' } }),
    prisma.gopaySettlement.count({ where: { status: 'processing' } }),
    prisma.gopaySettlement.count({ where: { status: 'completed', processedAt: { gte: today } } }),
    prisma.gopaySettlement.count({ where: { status: 'failed' } }),
  ]);

  const totalSettled = await prisma.gopaySettlement.aggregate({
    where: {
      status: 'completed',
      processedAt: { gte: today },
    },
    _sum: {
      totalAmount: true,
    },
  });

  return {
    pending,
    processing,
    completed,
    failed,
    totalSettledToday: totalSettled._sum.totalAmount || 0,
  };
}

/**
 * Process notification queue
 */
async function processNotificationQueue(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  // This would integrate with the main notification system
  // For now, we'll process any pending notifications
  const pending = await prisma.notificationQueue.findMany({
    where: {
      status: 'queued',
      OR: [
        { scheduledAt: null },
        { scheduledAt: { lte: new Date() } },
      ],
    },
    take: 50,
  });

  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  for (const notification of pending) {
    processed++;
    
    // Simulate sending (in production, this would call actual providers)
    const success = Math.random() > 0.1; // 90% success rate simulation
    
    if (success) {
      await prisma.notificationQueue.update({
        where: { id: notification.id },
        data: {
          status: 'sent',
          sentAt: new Date(),
        },
      });
      succeeded++;
    } else {
      const retryCount = notification.retryCount + 1;
      
      if (retryCount < notification.maxRetries) {
        await prisma.notificationQueue.update({
          where: { id: notification.id },
          data: {
            retryCount,
            nextRetryAt: new Date(Date.now() + Math.pow(2, retryCount) * 60000),
          },
        });
      } else {
        await prisma.notificationQueue.update({
          where: { id: notification.id },
          data: {
            status: 'failed',
            failedAt: new Date(),
          },
        });
        failed++;
      }
    }
  }

  return { processed, succeeded, failed };
}

// HTTP Server for health checks and manual triggers
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  try {
    if (url.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'healthy',
        service: 'settlement-processor',
        timestamp: new Date().toISOString(),
      }));
      return;
    }
    
    if (url.pathname === '/stats') {
      const stats = await getSettlementStats();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(stats));
      return;
    }
    
    if (url.pathname === '/process' && req.method === 'POST') {
      const result = await processSettlements();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return;
    }
    
    if (url.pathname === '/generate' && req.method === 'POST') {
      const result = await generateDailySettlements();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return;
    }
    
    if (url.pathname === '/notifications' && req.method === 'POST') {
      const result = await processNotificationQueue();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return;
    }
    
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    
  } catch (error) {
    console.error('[Settlement] Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Internal error' }));
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`[Settlement] Service started on port ${PORT}`);
  
  // Run periodic tasks
  setInterval(async () => {
    console.log('[Settlement] Running scheduled processing...');
    await processSettlements();
    await processNotificationQueue();
  }, 60000); // Every minute
  
  // Generate settlements daily at 18:00
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const msUntilSixPM = ((18 - hours) * 60 + (0 - minutes)) * 60 * 1000;
  
  setTimeout(async () => {
    console.log('[Settlement] Generating daily settlements...');
    await generateDailySettlements();
    
    // Repeat every 24 hours
    setInterval(async () => {
      await generateDailySettlements();
    }, 24 * 60 * 60 * 1000);
  }, msUntilSixPM > 0 ? msUntilSixPM : msUntilSixPM + 24 * 60 * 60 * 1000);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Settlement] Shutting down...');
  await prisma.$disconnect();
  server.close();
  process.exit(0);
});
