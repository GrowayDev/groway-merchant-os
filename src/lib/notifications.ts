/**
 * Notification System Library
 * Handles WhatsApp, SMS, and Email notifications for Merchant OS
 */

import { db } from './db';
import { nanoid } from 'nanoid';

// Types
export type NotificationChannel = 'whatsapp' | 'sms' | 'email' | 'push';
export type NotificationStatus = 'queued' | 'processing' | 'sent' | 'delivered' | 'failed' | 'cancelled';
export type NotificationPriority = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface NotificationRecipient {
  type: 'customer' | 'merchant' | 'staff';
  id?: string;
  phone?: string;
  email?: string;
  name?: string;
}

export interface SendNotificationOptions {
  merchantId: string;
  channel: NotificationChannel;
  recipient: NotificationRecipient;
  templateCode?: string;
  subject?: string;
  body?: string;
  variables?: Record<string, any>;
  referenceType?: string;
  referenceId?: string;
  scheduledAt?: Date;
  priority?: NotificationPriority;
}

export interface TemplateVariables {
  // Customer
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  
  // Transaction
  transaction_number?: string;
  transaction_date?: string;
  transaction_time?: string;
  amount?: string;
  total?: string;
  subtotal?: string;
  tax?: string;
  discount?: string;
  payment_method?: string;
  
  // Items
  items?: Array<{
    name: string;
    quantity: number;
    price: string;
    total: string;
  }>;
  
  // Merchant
  merchant_name?: string;
  merchant_phone?: string;
  merchant_address?: string;
  
  // Receipt
  receipt_number?: string;
  receipt_url?: string;
  
  // Appointment
  appointment_date?: string;
  appointment_time?: string;
  service_name?: string;
  staff_name?: string;
  
  // Order
  order_number?: string;
  order_status?: string;
  estimated_time?: string;
  
  // Credit/Payment
  credit_limit?: string;
  available_credit?: string;
  payment_due_date?: string;
  payment_amount?: string;
  
  // General
  [key: string]: any;
}

/**
 * Queue a notification for sending
 */
export async function queueNotification(options: SendNotificationOptions): Promise<string> {
  const notificationId = nanoid();
  
  // Get template if specified
  let template = null;
  let renderedBody = options.body || '';
  let subject = options.subject || '';
  
  if (options.templateCode) {
    template = await db.notificationTemplate.findUnique({
      where: { code: options.templateCode }
    });
    
    if (template) {
      renderedBody = renderTemplate(template.body, options.variables || {});
      subject = template.subject ? renderTemplate(template.subject, options.variables || {}) : '';
    }
  }
  
  // Validate recipient has required contact info
  if (options.channel === 'whatsapp' || options.channel === 'sms') {
    if (!options.recipient.phone) {
      throw new Error('Phone number required for WhatsApp/SMS notifications');
    }
    // Format phone number to E.164
    options.recipient.phone = formatPhoneNumber(options.recipient.phone);
  }
  
  if (options.channel === 'email') {
    if (!options.recipient.email) {
      throw new Error('Email required for email notifications');
    }
  }
  
  // Calculate cost
  const cost = await calculateNotificationCost(options.merchantId, options.channel);
  
  // Create notification in queue
  const notification = await db.notificationQueue.create({
    data: {
      id: notificationId,
      merchantId: options.merchantId,
      recipientType: options.recipient.type,
      recipientId: options.recipient.id,
      recipientPhone: options.recipient.phone,
      recipientEmail: options.recipient.email,
      recipientName: options.recipient.name,
      channel: options.channel,
      templateCode: options.templateCode,
      subject,
      body: renderedBody,
      variables: options.variables ? JSON.stringify(options.variables) : null,
      referenceType: options.referenceType,
      referenceId: options.referenceId,
      status: 'queued',
      priority: options.priority || 5,
      scheduledAt: options.scheduledAt,
      cost,
    }
  });
  
  return notification.id;
}

/**
 * Send notification immediately (bypass queue)
 */
export async function sendNotificationImmediate(options: SendNotificationOptions): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    // Update to processing
    const channel = await getChannelConfig(options.merchantId, options.channel);
    
    if (!channel || channel.status !== 'active') {
      return { success: false, error: `${options.channel} channel not configured or inactive` };
    }
    
    let result: { success: boolean; messageId?: string; error?: string };
    
    switch (options.channel) {
      case 'whatsapp':
        result = await sendViaWhatsApp(channel, options);
        break;
      case 'sms':
        result = await sendViaSMS(channel, options);
        break;
      case 'email':
        result = await sendViaEmail(channel, options);
        break;
      default:
        return { success: false, error: 'Unsupported channel' };
    }
    
    // Update channel stats
    if (result.success) {
      await db.notificationChannel.update({
        where: { id: channel.id },
        data: {
          totalSent: { increment: 1 },
          lastSentAt: new Date()
        }
      });
    } else {
      await db.notificationChannel.update({
        where: { id: channel.id },
        data: { totalFailed: { increment: 1 } }
      });
    }
    
    return result;
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Process queued notifications
 */
export async function processNotificationQueue(limit: number = 50): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const now = new Date();
  
  // Get queued notifications ready to send
  const notifications = await db.notificationQueue.findMany({
    where: {
      status: 'queued',
      OR: [
        { scheduledAt: null },
        { scheduledAt: { lte: now } }
      ],
      OR: [
        { nextRetryAt: null },
        { nextRetryAt: { lte: now } }
      ]
    },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'asc' }
    ],
    take: limit,
    include: {
      template: true
    }
  });
  
  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  
  for (const notification of notifications) {
    processed++;
    
    // Mark as processing
    await db.notificationQueue.update({
      where: { id: notification.id },
      data: { status: 'processing' }
    });
    
    const result = await sendNotificationImmediate({
      merchantId: notification.merchantId,
      channel: notification.channel as NotificationChannel,
      recipient: {
        type: notification.recipientType as 'customer' | 'merchant' | 'staff',
        id: notification.recipientId || undefined,
        phone: notification.recipientPhone || undefined,
        email: notification.recipientEmail || undefined,
        name: notification.recipientName || undefined,
      },
      templateCode: notification.templateCode || undefined,
      subject: notification.subject || undefined,
      body: notification.body,
      variables: notification.variables ? JSON.parse(notification.variables) : undefined,
      referenceType: notification.referenceType || undefined,
      referenceId: notification.referenceId || undefined,
    });
    
    if (result.success) {
      succeeded++;
      
      // Update notification status
      await db.notificationQueue.update({
        where: { id: notification.id },
        data: {
          status: 'sent',
          sentAt: new Date(),
          providerMessageId: result.messageId,
        }
      });
      
      // Log the notification
      await logNotification(notification, 'sent', result.messageId);
      
    } else {
      failed++;
      
      // Handle retry
      const retryCount = notification.retryCount + 1;
      
      if (retryCount < notification.maxRetries) {
        // Schedule retry with exponential backoff
        const nextRetry = new Date(now.getTime() + Math.pow(2, retryCount) * 60000);
        
        await db.notificationQueue.update({
          where: { id: notification.id },
          data: {
            status: 'queued',
            retryCount,
            nextRetryAt: nextRetry,
            providerError: result.error,
          }
        });
      } else {
        // Max retries reached, mark as failed
        await db.notificationQueue.update({
          where: { id: notification.id },
          data: {
            status: 'failed',
            failedAt: new Date(),
            providerError: result.error,
          }
        });
        
        // Log failure
        await logNotification(notification, 'failed', undefined, result.error);
      }
    }
  }
  
  return { processed, succeeded, failed };
}

/**
 * Send E-Receipt via WhatsApp
 */
export async function sendReceiptViaWhatsApp(
  merchantId: string,
  transactionData: {
    transactionId: string;
    transactionNumber: string;
    customerPhone: string;
    customerName?: string;
    total: number;
    items: Array<{ name: string; quantity: number; price: number; total: number }>;
    paymentMethod: string;
    merchantName: string;
    merchantAddress?: string;
  }
): Promise<{ success: boolean; receiptId: string; messageId?: string; error?: string }> {
  
  // Generate receipt number
  const receiptNumber = `RCPT-${Date.now()}-${nanoid(6).toUpperCase()}`;
  
  // Create receipt record
  const receipt = await db.eReceipt.create({
    data: {
      merchantId,
      transactionId: transactionData.transactionId,
      transactionNumber: transactionData.transactionNumber,
      customerPhone: formatPhoneNumber(transactionData.customerPhone),
      customerName: transactionData.customerName,
      receiptNumber,
      receiptData: JSON.stringify(transactionData),
      status: 'active',
    }
  });
  
  // Format currency
  const formatAmount = (amount: number) => `R${amount.toFixed(2)}`;
  
  // Build receipt message
  const itemsText = transactionData.items
    .map(item => `• ${item.name} x${item.quantity} - ${formatAmount(item.total)}`)
    .join('\n');
  
  const total = transactionData.items.reduce((sum, item) => sum + item.total, 0);
  
  const message = `🧾 *Digital Receipt*

*${transactionData.merchantName}*
${transactionData.merchantAddress || ''}

━━━━━━━━━━━━━━━━━━
*Transaction:* ${transactionData.transactionNumber}
*Date:* ${new Date().toLocaleDateString('en-ZA')}
*Time:* ${new Date().toLocaleTimeString('en-ZA')}

${itemsText}

━━━━━━━━━━━━━━━━━━
*Subtotal:* ${formatAmount(total)}
*Payment:* ${transactionData.paymentMethod}
*TOTAL:* ${formatAmount(total)}
━━━━━━━━━━━━━━━━━━

Thank you for your purchase! 🙏

_Retain this message as proof of purchase_`;

  // Send via WhatsApp
  const result = await sendNotificationImmediate({
    merchantId,
    channel: 'whatsapp',
    recipient: {
      type: 'customer',
      phone: transactionData.customerPhone,
      name: transactionData.customerName,
    },
    body: message,
    referenceType: 'transaction',
    referenceId: transactionData.transactionId,
    priority: 8,
  });
  
  // Update receipt with send status
  if (result.success) {
    await db.eReceipt.update({
      where: { id: receipt.id },
      data: {
        sentViaWhatsapp: true,
        whatsappSentAt: new Date(),
        whatsappMessageId: result.messageId,
      }
    });
  }
  
  return {
    success: result.success,
    receiptId: receipt.id,
    messageId: result.messageId,
    error: result.error,
  };
}

// ============================================
// Helper Functions
// ============================================

/**
 * Render template with variables
 */
function renderTemplate(template: string, variables: Record<string, any>): string {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, String(value));
  }
  
  return result;
}

/**
 * Format phone number to E.164
 */
function formatPhoneNumber(phone: string): string {
  // Remove spaces, dashes, parentheses
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // If starts with 0, replace with +27
  if (cleaned.startsWith('0')) {
    cleaned = '+27' + cleaned.substring(1);
  }
  
  // If doesn't start with +, add +27
  if (!cleaned.startsWith('+')) {
    cleaned = '+27' + cleaned;
  }
  
  return cleaned;
}

/**
 * Get channel configuration
 */
async function getChannelConfig(merchantId: string, channel: NotificationChannel) {
  return db.notificationChannel.findUnique({
    where: {
      merchantId_channel: {
        merchantId,
        channel,
      }
    }
  });
}

/**
 * Calculate notification cost
 */
async function calculateNotificationCost(merchantId: string, channel: NotificationChannel): Promise<number> {
  const channelConfig = await getChannelConfig(merchantId, channel);
  
  if (!channelConfig) return 0;
  
  switch (channel) {
    case 'whatsapp':
      return channelConfig.costPerWhatsapp;
    case 'sms':
      return channelConfig.costPerSms;
    case 'email':
      return channelConfig.costPerEmail;
    default:
      return 0;
  }
}

/**
 * Log notification to history
 */
async function logNotification(
  notification: any,
  status: 'sent' | 'delivered' | 'failed',
  messageId?: string,
  error?: string
): Promise<void> {
  await db.notificationLog.create({
    data: {
      merchantId: notification.merchantId,
      recipientType: notification.recipientType,
      recipientId: notification.recipientId,
      recipientPhone: notification.recipientPhone,
      recipientEmail: notification.recipientEmail,
      recipientName: notification.recipientName,
      channel: notification.channel,
      templateCode: notification.templateCode,
      subject: notification.subject,
      bodyPreview: notification.body?.substring(0, 200),
      referenceType: notification.referenceType,
      referenceId: notification.referenceId,
      status,
      providerMessageId: messageId,
      providerError: error,
      cost: notification.cost,
      sentAt: new Date(),
    }
  });
}

/**
 * Send via WhatsApp Business API
 */
async function sendViaWhatsApp(
  channel: any,
  options: SendNotificationOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  
  if (!channel.whatsappAccessToken || !channel.whatsappPhoneId) {
    return { success: false, error: 'WhatsApp not configured' };
  }
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${channel.whatsappPhoneId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${channel.whatsappAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: options.recipient.phone,
          type: 'text',
          text: {
            body: options.body,
          }
        })
      }
    );
    
    const data = await response.json();
    
    if (response.ok && data.messages?.[0]?.id) {
      return { success: true, messageId: data.messages[0].id };
    } else {
      return { 
        success: false, 
        error: data.error?.message || 'WhatsApp API error' 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Network error' 
    };
  }
}

/**
 * Send via SMS (Africa's Talking / Twilio)
 */
async function sendViaSMS(
  channel: any,
  options: SendNotificationOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  
  if (!channel.smsApiKey || !options.recipient.phone) {
    return { success: false, error: 'SMS not configured' };
  }
  
  // For now, simulate SMS sending
  // In production, integrate with Africa's Talking or Twilio
  console.log(`[SMS] To: ${options.recipient.phone}, Body: ${options.body?.substring(0, 100)}...`);
  
  return { success: true, messageId: `sms-${Date.now()}` };
}

/**
 * Send via Email (SendGrid / Resend)
 */
async function sendViaEmail(
  channel: any,
  options: SendNotificationOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  
  if (!channel.emailApiKey || !options.recipient.email) {
    return { success: false, error: 'Email not configured' };
  }
  
  // For now, simulate email sending
  // In production, integrate with SendGrid or Resend
  console.log(`[EMAIL] To: ${options.recipient.email}, Subject: ${options.subject}`);
  
  return { success: true, messageId: `email-${Date.now()}` };
}

/**
 * Get notification settings for merchant
 */
export async function getNotificationSettings(merchantId: string) {
  let settings = await db.notificationSettings.findUnique({
    where: { merchantId }
  });
  
  if (!settings) {
    // Create default settings
    settings = await db.notificationSettings.create({
      data: { merchantId }
    });
  }
  
  return settings;
}

/**
 * Update notification settings
 */
export async function updateNotificationSettings(
  merchantId: string,
  updates: Partial<{
    whatsappEnabled: boolean;
    whatsappSendReceipts: boolean;
    smsEnabled: boolean;
    emailEnabled: boolean;
    reminder24hEnabled: boolean;
    reminder2hEnabled: boolean;
    reminderChannel: string;
  }>
) {
  return db.notificationSettings.upsert({
    where: { merchantId },
    create: { merchantId, ...updates },
    update: updates,
  });
}

/**
 * Create notification channel
 */
export async function createNotificationChannel(
  merchantId: string,
  channel: NotificationChannel,
  config: {
    whatsappNumber?: string;
    whatsappBusinessId?: string;
    whatsappPhoneId?: string;
    whatsappAccessToken?: string;
    smsProvider?: string;
    smsSenderId?: string;
    emailProvider?: string;
    emailFrom?: string;
    emailFromName?: string;
  }
) {
  return db.notificationChannel.upsert({
    where: {
      merchantId_channel: { merchantId, channel }
    },
    create: {
      merchantId,
      channel,
      ...config,
      status: 'pending',
    },
    update: {
      ...config,
      status: 'pending',
    }
  });
}

/**
 * Verify WhatsApp channel
 */
export async function verifyWhatsAppChannel(merchantId: string): Promise<boolean> {
  const channel = await getChannelConfig(merchantId, 'whatsapp');
  
  if (!channel?.whatsappAccessToken || !channel?.whatsappPhoneId) {
    return false;
  }
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${channel.whatsappPhoneId}`,
      {
        headers: {
          'Authorization': `Bearer ${channel.whatsappAccessToken}`,
        }
      }
    );
    
    if (response.ok) {
      await db.notificationChannel.update({
        where: { id: channel.id },
        data: { status: 'active' }
      });
      return true;
    }
    
    return false;
  } catch {
    return false;
  }
}

export default {
  queueNotification,
  sendNotificationImmediate,
  processNotificationQueue,
  sendReceiptViaWhatsApp,
  getNotificationSettings,
  updateNotificationSettings,
  createNotificationChannel,
  verifyWhatsAppChannel,
};
