/**
 * WhatsApp Notification Service
 * Handles WhatsApp Business API integration, E-Receipts, and multi-channel notifications
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

// ============================================
// TYPES & INTERFACES
// ============================================

interface WhatsAppMessage {
  to: string;
  type: 'text' | 'template' | 'interactive';
  text?: { body: string };
  template?: {
    name: string;
    language: { code: string };
    components: any[];
  };
  interactive?: any;
}

interface EReceiptData {
  receiptNumber: string;
  transactionNumber: string;
  merchantName: string;
  merchantAddress?: string;
  merchantPhone?: string;
  customerName?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  vatAmount: number;
  total: number;
  paymentMethod: string;
  date: string;
  time: string;
}

interface NotificationPayload {
  merchantId: string;
  recipientType: 'customer' | 'merchant' | 'staff';
  recipientId?: string;
  recipientPhone: string;
  recipientEmail?: string;
  recipientName?: string;
  channel: 'whatsapp' | 'sms' | 'email';
  templateCode?: string;
  subject?: string;
  body: string;
  referenceType?: string;
  referenceId?: string;
  priority?: number;
}

// ============================================
// WHATSAPP BUSINESS API
// ============================================

/**
 * Send WhatsApp message via Business API
 */
async function sendWhatsAppMessage(
  merchantId: string,
  message: WhatsAppMessage
): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    // Get WhatsApp channel configuration
    const channel = await prisma.notificationChannel.findUnique({
      where: {
        merchantId_channel: {
          merchantId,
          channel: 'whatsapp',
        },
      },
    });

    if (!channel || channel.status !== 'active') {
      return {
        success: false,
        error: 'WhatsApp channel not configured or inactive',
      };
    }

    // In production, this would call the actual WhatsApp Business API
    // POST https://graph.facebook.com/v17.0/{phone-number-id}/messages
    // Headers: Authorization: Bearer {access-token}

    console.log(`[WhatsApp] Sending message to ${message.to}`);
    console.log(`[WhatsApp] Using Business ID: ${channel.whatsappBusinessId}`);

    // Simulate API call
    const simulatedMessageId = `wamid.${Date.now()}`;

    // Update channel stats
    await prisma.notificationChannel.update({
      where: { id: channel.id },
      data: {
        totalSent: { increment: 1 },
        lastSentAt: new Date(),
      },
    });

    return {
      success: true,
      messageId: simulatedMessageId,
    };
  } catch (error) {
    console.error('[WhatsApp] Error sending message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send WhatsApp template message
 */
async function sendWhatsAppTemplate(
  merchantId: string,
  to: string,
  templateCode: string,
  variables: Record<string, string>
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const template = await prisma.notificationTemplate.findUnique({
      where: { code: templateCode },
    });

    if (!template || template.channel !== 'whatsapp') {
      return { success: false, error: 'Template not found or invalid channel' };
    }

    // Replace variables in body
    let body = template.body;
    for (const [key, value] of Object.entries(variables)) {
      body = body.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    return sendWhatsAppMessage(merchantId, {
      to: formatPhone(to),
      type: template.whatsappTemplateId ? 'template' : 'text',
      text: { body },
      template: template.whatsappTemplateId ? {
        name: template.whatsappTemplateId,
        language: { code: 'en' },
        components: [{
          type: 'body',
          parameters: Object.entries(variables).map(([key, value]) => ({
            type: 'text',
            text: value,
          })),
        }],
      } : undefined,
    });
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ============================================
// E-RECEIPT SYSTEM
// ============================================

/**
 * Generate and send E-Receipt via WhatsApp
 */
async function sendEReceipt(
  merchantId: string,
  receiptData: EReceiptData,
  customerPhone: string
): Promise<{
  success: boolean;
  receiptId?: string;
  messageId?: string;
  error?: string;
}> {
  try {
    // Create E-Receipt record
    const receipt = await prisma.eReceipt.create({
      data: {
        merchantId,
        transactionId: receiptData.transactionNumber,
        transactionNumber: receiptData.transactionNumber,
        customerName: receiptData.customerName,
        customerPhone: formatPhone(customerPhone),
        receiptNumber: receiptData.receiptNumber,
        receiptData: JSON.stringify(receiptData),
        sentViaWhatsapp: false,
        status: 'active',
      },
    });

    // Generate receipt message
    const message = formatReceiptMessage(receiptData);

    // Send via WhatsApp
    const result = await sendWhatsAppMessage(merchantId, {
      to: formatPhone(customerPhone),
      type: 'text',
      text: { body: message },
    });

    if (result.success) {
      // Update receipt with delivery info
      await prisma.eReceipt.update({
        where: { id: receipt.id },
        data: {
          sentViaWhatsapp: true,
          whatsappSentAt: new Date(),
          whatsappMessageId: result.messageId,
        },
      });

      // Log the notification
      await prisma.notificationLog.create({
        data: {
          merchantId,
          recipientType: 'customer',
          recipientPhone: formatPhone(customerPhone),
          recipientName: receiptData.customerName,
          channel: 'whatsapp',
          templateCode: 'ereceipt_whatsapp',
          bodyPreview: message.substring(0, 200),
          referenceType: 'transaction',
          referenceId: receiptData.transactionNumber,
          status: 'sent',
          providerMessageId: result.messageId,
          cost: 0.35,
          sentAt: new Date(),
        },
      });

      return {
        success: true,
        receiptId: receipt.id,
        messageId: result.messageId,
      };
    } else {
      return {
        success: false,
        error: result.error,
      };
    }
  } catch (error) {
    console.error('[EReceipt] Error sending e-receipt:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Format receipt message for WhatsApp
 */
function formatReceiptMessage(data: EReceiptData): string {
  const items = data.items
    .map(item => `${item.quantity}x ${item.name} - R${item.total.toFixed(2)}`)
    .join('\n');

  return `🧾 *E-RECEIPT*
━━━━━━━━━━━━━━━━━━━
*${data.merchantName}*
${data.merchantAddress || ''}
Tel: ${data.merchantPhone || 'N/A'}

*Receipt #:* ${data.receiptNumber}
*Date:* ${data.date}
*Time:* ${data.time}
━━━━━━━━━━━━━━━━━━━
${items}
━━━━━━━━━━━━━━━━━━━
*Subtotal:* R${data.subtotal.toFixed(2)}
*VAT (15%):* R${data.vatAmount.toFixed(2)}
*TOTAL:* R${data.total.toFixed(2)}
━━━━━━━━━━━━━━━━━━━
*Payment:* ${data.paymentMethod.toUpperCase()}

Thank you for your business! 🙏
Powered by Groway Merchant OS`;
}

// ============================================
// NOTIFICATION QUEUE PROCESSOR
// ============================================

/**
 * Process pending notifications from queue
 */
async function processNotificationQueue(): Promise<{
  processed: number;
  sent: number;
  failed: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let processed = 0;
  let sent = 0;
  let failed = 0;

  try {
    // Get pending notifications ordered by priority
    const pending = await prisma.notificationQueue.findMany({
      where: {
        status: 'queued',
        OR: [
          { scheduledAt: null },
          { scheduledAt: { lte: new Date() } },
        ],
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
      take: 100,
    });

    for (const notification of pending) {
      processed++;

      try {
        // Mark as processing
        await prisma.notificationQueue.update({
          where: { id: notification.id },
          data: { status: 'processing' },
        });

        let result: { success: boolean; messageId?: string; error?: string };

        if (notification.channel === 'whatsapp') {
          result = await sendWhatsAppMessage(notification.merchantId, {
            to: notification.recipientPhone || '',
            type: 'text',
            text: { body: notification.body },
          });
        } else if (notification.channel === 'sms') {
          // SMS sending (stub)
          result = { success: true, messageId: `sms_${Date.now()}` };
        } else if (notification.channel === 'email') {
          // Email sending (stub)
          result = { success: true, messageId: `email_${Date.now()}` };
        } else {
          result = { success: false, error: 'Unknown channel' };
        }

        if (result.success) {
          // Mark as sent
          await prisma.notificationQueue.update({
            where: { id: notification.id },
            data: {
              status: 'sent',
              sentAt: new Date(),
              providerMessageId: result.messageId,
            },
          });

          // Log success
          await prisma.notificationLog.create({
            data: {
              merchantId: notification.merchantId,
              recipientType: notification.recipientType as 'customer' | 'merchant' | 'staff',
              recipientId: notification.recipientId,
              recipientPhone: notification.recipientPhone,
              recipientEmail: notification.recipientEmail,
              recipientName: notification.recipientName,
              channel: notification.channel as 'whatsapp' | 'sms' | 'email',
              templateCode: notification.templateCode,
              bodyPreview: notification.body?.substring(0, 200),
              referenceType: notification.referenceType,
              referenceId: notification.referenceId,
              status: 'sent',
              providerMessageId: result.messageId,
              cost: notification.channel === 'whatsapp' ? 0.35 : notification.channel === 'sms' ? 0.50 : 0.005,
              sentAt: new Date(),
            },
          });

          sent++;
        } else {
          // Handle failure
          const retryCount = notification.retryCount + 1;
          const shouldRetry = retryCount < notification.maxRetries;

          await prisma.notificationQueue.update({
            where: { id: notification.id },
            data: {
              status: shouldRetry ? 'queued' : 'failed',
              failedAt: shouldRetry ? null : new Date(),
              retryCount,
              nextRetryAt: shouldRetry
                ? new Date(Date.now() + Math.pow(2, retryCount) * 60000)
                : null,
              providerError: result.error,
            },
          });

          if (!shouldRetry) {
            failed++;
            errors.push(`Notification ${notification.id}: ${result.error}`);
          }
        }
      } catch (error) {
        failed++;
        errors.push(`Notification ${notification.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  } catch (error) {
    errors.push(`Queue error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return { processed, sent, failed, errors };
}

// ============================================
// NOTIFICATION MANAGEMENT
// ============================================

/**
 * Queue a new notification
 */
async function queueNotification(payload: NotificationPayload): Promise<{
  success: boolean;
  queueId?: string;
  error?: string;
}> {
  try {
    const notification = await prisma.notificationQueue.create({
      data: {
        merchantId: payload.merchantId,
        recipientType: payload.recipientType,
        recipientId: payload.recipientId,
        recipientPhone: payload.recipientPhone ? formatPhone(payload.recipientPhone) : null,
        recipientEmail: payload.recipientEmail,
        recipientName: payload.recipientName,
        channel: payload.channel,
        templateCode: payload.templateCode,
        subject: payload.subject,
        body: payload.body,
        referenceType: payload.referenceType,
        referenceId: payload.referenceId,
        priority: payload.priority || 5,
        status: 'queued',
        cost: payload.channel === 'whatsapp' ? 0.35 : payload.channel === 'sms' ? 0.50 : 0.005,
      },
    });

    return { success: true, queueId: notification.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get notification statistics
 */
async function getNotificationStats(merchantId?: string) {
  const where = merchantId ? { merchantId } : {};

  const [queueStats, todayLogs, whatsappStats] = await Promise.all([
    prisma.notificationQueue.groupBy({
      by: ['status'],
      where,
      _count: true,
    }),
    prisma.notificationLog.count({
      where: {
        ...where,
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
    prisma.notificationLog.aggregate({
      where: {
        ...where,
        channel: 'whatsapp',
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
      _sum: { cost: true },
      _count: true,
    }),
  ]);

  return {
    queue: queueStats.reduce((acc, stat) => {
      acc[stat.status] = stat._count;
      return acc;
    }, {} as Record<string, number>),
    todaySent: todayLogs,
    whatsappToday: whatsappStats._count,
    whatsappCostToday: whatsappStats._sum.cost || 0,
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatPhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '+27' + cleaned.substring(1);
  }
  if (!cleaned.startsWith('+')) {
    cleaned = '+27' + cleaned;
  }
  return cleaned;
}

function generateReceiptNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RCP-${timestamp}-${random}`;
}

// ============================================
// HTTP SERVER
// ============================================

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
    // Health check
    if (url.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'healthy',
        service: 'whatsapp-notification-service',
        port: PORT,
        timestamp: new Date().toISOString(),
      }));
      return;
    }

    // Get stats
    if (url.pathname === '/stats') {
      const merchantId = url.searchParams.get('merchantId') || undefined;
      const stats = await getNotificationStats(merchantId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(stats));
      return;
    }

    // Send E-Receipt
    if (url.pathname === '/ereceipt' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const data = JSON.parse(body);
          const result = await sendEReceipt(
            data.merchantId,
            data.receiptData,
            data.customerPhone
          );
          res.writeHead(result.success ? 200 : 400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid request body' }));
        }
      });
      return;
    }

    // Send WhatsApp message
    if (url.pathname === '/whatsapp/send' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const data = JSON.parse(body);
          const result = await sendWhatsAppMessage(data.merchantId, {
            to: formatPhone(data.to),
            type: data.type || 'text',
            text: data.text,
            template: data.template,
          });
          res.writeHead(result.success ? 200 : 400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid request body' }));
        }
      });
      return;
    }

    // Send template message
    if (url.pathname === '/whatsapp/template' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const data = JSON.parse(body);
          const result = await sendWhatsAppTemplate(
            data.merchantId,
            data.to,
            data.templateCode,
            data.variables || {}
          );
          res.writeHead(result.success ? 200 : 400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid request body' }));
        }
      });
      return;
    }

    // Queue notification
    if (url.pathname === '/queue' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const data = JSON.parse(body);
          const result = await queueNotification(data);
          res.writeHead(result.success ? 201 : 400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid request body' }));
        }
      });
      return;
    }

    // Process queue
    if (url.pathname === '/process' && req.method === 'POST') {
      const result = await processNotificationQueue();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return;
    }

    // Generate receipt number
    if (url.pathname === '/receipt-number') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ receiptNumber: generateReceiptNumber() }));
      return;
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));

  } catch (error) {
    console.error('[WhatsApp Service] Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Internal error' }));
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`[WhatsApp Service] Started on port ${PORT}`);
  console.log(`[WhatsApp Service] E-Receipt system ready`);
  console.log(`[WhatsApp Service] Notification queue processor ready`);

  // Process queue every 10 seconds
  setInterval(async () => {
    const result = await processNotificationQueue();
    if (result.processed > 0) {
      console.log(`[WhatsApp Service] Processed ${result.processed} notifications (sent: ${result.sent}, failed: ${result.failed})`);
    }
  }, 10000);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[WhatsApp Service] Shutting down...');
  await prisma.$disconnect();
  server.close();
  process.exit(0);
});
