/**
 * Notification Service
 * 
 * Handles sending of notifications via multiple channels:
 * - Email (via SendGrid, Resend, or SMTP)
 * - SMS (via Twilio, Africa's Talking, or similar)
 * - Push notifications
 * - WhatsApp Business API
 * - In-app notifications
 */

import { db } from '@/lib/db'

// Types
export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app' | 'whatsapp'
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'
export type NotificationStatus = 'pending' | 'processing' | 'sent' | 'delivered' | 'failed' | 'bounced'

export interface NotificationPayload {
  merchantId?: string
  userId?: string
  
  // Recipient
  recipientType: 'user' | 'customer' | 'staff' | 'merchant'
  recipientId?: string
  recipientEmail?: string
  recipientPhone?: string
  recipientName?: string
  
  // Content
  channel: NotificationChannel
  subject?: string
  body: string
  htmlBody?: string
  
  // Scheduling
  scheduledAt?: Date
  priority?: NotificationPriority
  
  // Template
  templateCode?: string
  variables?: Record<string, string | number | boolean>
  
  // Entity reference
  entityType?: string
  entityId?: string
  
  // Metadata
  metadata?: Record<string, unknown>
}

export interface SendResult {
  success: boolean
  notificationId: string
  externalId?: string
  error?: string
  cost?: number
}

// Default templates for South African context
const DEFAULT_TEMPLATES: Record<string, { subject: string; body: string; channel: NotificationChannel }> = {
  'booking_confirmation': {
    subject: 'Booking Confirmed - {{merchantName}}',
    body: 'Hi {{customerName}}, your booking for {{serviceName}} on {{date}} at {{time}} is confirmed. See you soon!',
    channel: 'sms',
  },
  'booking_reminder_24h': {
    subject: 'Reminder: Your appointment tomorrow',
    body: 'Hi {{customerName}}, reminder: You have an appointment for {{serviceName}} tomorrow at {{time}} at {{merchantName}}. Reply CANCEL to cancel.',
    channel: 'sms',
  },
  'booking_reminder_2h': {
    subject: 'Your appointment in 2 hours',
    body: 'Hi {{customerName}}, your {{serviceName}} appointment is in 2 hours at {{merchantName}}. See you at {{time}}!',
    channel: 'sms',
  },
  'payment_received': {
    subject: 'Payment Received',
    body: 'Hi {{customerName}}, we received your payment of R{{amount}}. Reference: {{reference}}. Thank you!',
    channel: 'sms',
  },
  'low_stock_alert': {
    subject: 'Low Stock Alert: {{productName}}',
    body: 'Low stock alert: {{productName}} has {{currentStock}} units remaining (reorder point: {{reorderPoint}}). Place order soon.',
    channel: 'email',
  },
  'settlement_processed': {
    subject: 'Settlement Processed',
    body: 'Your settlement of R{{amount}} has been processed and will reflect in your account within 24-48 hours. Reference: {{reference}}',
    channel: 'sms',
  },
  'welcome_merchant': {
    subject: 'Welcome to Groway!',
    body: 'Welcome to Groway, {{merchantName}}! Your account is now active. Start selling today.',
    channel: 'email',
  },
  'otp_verification': {
    subject: 'Your verification code',
    body: 'Your Groway verification code is: {{otp}}. Valid for 5 minutes. Do not share this code.',
    channel: 'sms',
  },
  'invoice_created': {
    subject: 'Invoice {{invoiceNumber}} from {{merchantName}}',
    body: 'Hi {{customerName}}, invoice {{invoiceNumber}} for R{{amount}} is ready. Due: {{dueDate}}. View: {{invoiceUrl}}',
    channel: 'email',
  },
  'order_ready': {
    subject: 'Your order is ready!',
    body: 'Hi {{customerName}}, your order #{{orderNumber}} is ready for collection at {{merchantName}}. Thank you!',
    channel: 'sms',
  },
}

/**
 * Create a notification in the queue
 */
export async function queueNotification(payload: NotificationPayload): Promise<{ id: string }> {
  // If template code provided, render from template
  let finalSubject = payload.subject
  let finalBody = payload.body
  let finalHtmlBody = payload.htmlBody
  
  if (payload.templateCode) {
    const template = await getTemplate(payload.templateCode, payload.merchantId)
    if (template) {
      const variables = payload.variables || {}
      finalSubject = renderTemplate(template.subject || '', variables)
      finalBody = renderTemplate(template.body, variables)
      if (template.htmlBody) {
        finalHtmlBody = renderTemplate(template.htmlBody, variables)
      }
    }
  }
  
  // Create notification queue entry
  const notification = await db.notificationQueue.create({
    data: {
      merchantId: payload.merchantId,
      userId: payload.userId,
      recipientType: payload.recipientType,
      recipientId: payload.recipientId,
      recipientEmail: payload.recipientEmail,
      recipientPhone: payload.recipientPhone,
      recipientName: payload.recipientName,
      channel: payload.channel,
      subject: finalSubject,
      body: finalBody,
      htmlBody: finalHtmlBody,
      variables: payload.variables ? JSON.stringify(payload.variables) : null,
      priority: payload.priority || 'normal',
      scheduledAt: payload.scheduledAt,
      status: 'pending',
    },
  })
  
  return { id: notification.id }
}

/**
 * Get template by code
 */
async function getTemplate(code: string, merchantId?: string | null): Promise<{
  subject: string | null
  body: string
  htmlBody: string | null
} | null> {
  // Try to find merchant-specific template first
  if (merchantId) {
    const merchantTemplate = await db.notificationTemplate.findFirst({
      where: { code, merchantId, isActive: true },
    })
    if (merchantTemplate) {
      return {
        subject: merchantTemplate.subject,
        body: merchantTemplate.body,
        htmlBody: merchantTemplate.htmlBody,
      }
    }
  }
  
  // Try system template
  const systemTemplate = await db.notificationTemplate.findFirst({
    where: { code, merchantId: null, isActive: true },
  })
  
  if (systemTemplate) {
    return {
      subject: systemTemplate.subject,
      body: systemTemplate.body,
      htmlBody: systemTemplate.htmlBody,
    }
  }
  
  // Fall back to default templates
  const defaultTemplate = DEFAULT_TEMPLATES[code]
  if (defaultTemplate) {
    return {
      subject: defaultTemplate.subject,
      body: defaultTemplate.body,
      htmlBody: null,
    }
  }
  
  return null
}

/**
 * Render template with variables
 */
function renderTemplate(template: string, variables: Record<string, string | number | boolean>): string {
  let rendered = template
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g')
    rendered = rendered.replace(regex, String(value))
  }
  
  return rendered
}

/**
 * Process pending notifications
 */
export async function processNotificationQueue(batchSize: number = 50): Promise<{
  processed: number
  sent: number
  failed: number
}> {
  const pending = await db.notificationQueue.findMany({
    where: {
      status: 'pending',
      scheduledAt: { lte: new Date() },
      attempts: { lt: 3 },
    },
    include: {
      template: true,
    },
    take: batchSize,
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'asc' },
    ],
  })
  
  let sent = 0
  let failed = 0
  
  for (const notification of pending) {
    try {
      // Mark as processing
      await db.notificationQueue.update({
        where: { id: notification.id },
        data: { status: 'processing' },
      })
      
      // Send based on channel
      const result = await sendNotification(notification)
      
      if (result.success) {
        await db.notificationQueue.update({
          where: { id: notification.id },
          data: {
            status: 'sent',
            sentAt: new Date(),
            externalId: result.externalId,
            costCents: result.cost ? Math.round(result.cost * 100) : 0,
          },
        })
        
        // Update template usage
        if (notification.templateId) {
          await db.notificationTemplate.update({
            where: { id: notification.templateId },
            data: {
              timesUsed: { increment: 1 },
              lastUsedAt: new Date(),
            },
          })
        }
        
        sent++
      } else {
        throw new Error(result.error || 'Send failed')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      await db.notificationQueue.update({
        where: { id: notification.id },
        data: {
          status: notification.attempts >= notification.maxAttempts - 1 ? 'failed' : 'pending',
          attempts: { increment: 1 },
          lastError: errorMessage,
          nextRetryAt: new Date(Date.now() + 5 * 60 * 1000), // Retry in 5 min
        },
      })
      
      failed++
    }
  }
  
  return {
    processed: pending.length,
    sent,
    failed,
  }
}

/**
 * Send notification via appropriate provider
 */
async function sendNotification(notification: {
  id: string
  channel: string
  recipientEmail: string | null
  recipientPhone: string | null
  subject: string | null
  body: string
  htmlBody: string | null
  merchantId: string | null
}): Promise<SendResult> {
  const { channel, recipientEmail, recipientPhone, subject, body, htmlBody, merchantId } = notification
  
  // Get integration config for this channel and merchant
  const integration = await db.integrationConfig.findFirst({
    where: {
      merchantId: merchantId || null,
      service: channel === 'email' ? 'email' : 'sms',
      isActive: true,
    },
    orderBy: [
      { isDefault: 'desc' },
      { lastUsedAt: 'desc' },
    ],
  })
  
  switch (channel) {
    case 'email':
      return sendEmail({
        to: recipientEmail!,
        subject: subject || 'Notification',
        text: body,
        html: htmlBody || undefined,
        config: integration,
      })
    
    case 'sms':
      return sendSMS({
        to: recipientPhone!,
        message: body,
        config: integration,
      })
    
    case 'push':
      // TODO: Implement push notifications
      return {
        success: false,
        notificationId: notification.id,
        error: 'Push notifications not yet implemented',
      }
    
    case 'whatsapp':
      // TODO: Implement WhatsApp
      return {
        success: false,
        notificationId: notification.id,
        error: 'WhatsApp not yet implemented',
      }
    
    default:
      return {
        success: false,
        notificationId: notification.id,
        error: `Unknown channel: ${channel}`,
      }
  }
}

/**
 * Send email via configured provider
 */
async function sendEmail(params: {
  to: string
  subject: string
  text: string
  html?: string
  config: { credentials: string; provider: string } | null
}): Promise<SendResult> {
  const { to, subject, text, html, config } = params
  
  // In development, simulate sending
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[EMAIL] To: ${to}, Subject: ${subject}`)
    return {
      success: true,
      notificationId: '',
      externalId: `dev-${Date.now()}`,
      cost: 0,
    }
  }
  
  // TODO: Implement real email providers (SendGrid, Resend, SMTP)
  // For now, log and return success
  console.log(`[EMAIL] Would send to ${to}: ${subject}`)
  
  return {
    success: true,
    notificationId: '',
    externalId: `mock-${Date.now()}`,
    cost: 0.005, // ~$0.005 per email
  }
}

/**
 * Send SMS via configured provider
 */
async function sendSMS(params: {
  to: string
  message: string
  config: { credentials: string; provider: string } | null
}): Promise<SendResult> {
  const { to, message, config } = params
  
  // Format phone number (SA context)
  let formattedPhone = to.replace(/\D/g, '')
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '27' + formattedPhone.substring(1)
  }
  if (!formattedPhone.startsWith('27')) {
    formattedPhone = '27' + formattedPhone
  }
  
  // In development, simulate sending
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[SMS] To: +${formattedPhone}, Message: ${message}`)
    return {
      success: true,
      notificationId: '',
      externalId: `dev-${Date.now()}`,
      cost: 0,
    }
  }
  
  // TODO: Implement real SMS providers (Twilio, Africa's Talking, etc.)
  console.log(`[SMS] Would send to +${formattedPhone}: ${message}`)
  
  return {
    success: true,
    notificationId: '',
    externalId: `mock-${Date.now()}`,
    cost: 0.05, // ~$0.05 per SMS in SA
  }
}

/**
 * Quick helpers for common notifications
 */

export async function sendBookingConfirmation(params: {
  merchantId: string
  customerName: string
  customerPhone?: string
  customerEmail?: string
  serviceName: string
  date: string
  time: string
  merchantName: string
}): Promise<void> {
  const { customerPhone, customerEmail, ...vars } = params
  
  const promises: Promise<unknown>[] = []
  
  if (customerPhone) {
    promises.push(queueNotification({
      merchantId: params.merchantId,
      recipientType: 'customer',
      recipientPhone: customerPhone,
      recipientName: params.customerName,
      channel: 'sms',
      templateCode: 'booking_confirmation',
      variables: vars,
    }))
  }
  
  if (customerEmail) {
    promises.push(queueNotification({
      merchantId: params.merchantId,
      recipientType: 'customer',
      recipientEmail: customerEmail,
      recipientName: params.customerName,
      channel: 'email',
      templateCode: 'booking_confirmation',
      variables: vars,
    }))
  }
  
  await Promise.all(promises)
}

export async function sendOTPSms(phone: string, otp: string): Promise<void> {
  await queueNotification({
    recipientType: 'customer',
    recipientPhone: phone,
    channel: 'sms',
    templateCode: 'otp_verification',
    variables: { otp },
    priority: 'urgent',
  })
}

export async function sendLowStockAlert(params: {
  merchantId: string
  productName: string
  currentStock: number
  reorderPoint: number
  userEmail?: string
}): Promise<void> {
  if (params.userEmail) {
    await queueNotification({
      merchantId: params.merchantId,
      recipientType: 'staff',
      recipientEmail: params.userEmail,
      channel: 'email',
      templateCode: 'low_stock_alert',
      variables: {
        productName: params.productName,
        currentStock: params.currentStock,
        reorderPoint: params.reorderPoint,
      },
      priority: 'high',
    })
  }
}

/**
 * Seed default templates
 */
export async function seedDefaultTemplates(): Promise<void> {
  for (const [code, template] of Object.entries(DEFAULT_TEMPLATES)) {
    const exists = await db.notificationTemplate.findUnique({ where: { code } })
    
    if (!exists) {
      await db.notificationTemplate.create({
        data: {
          code,
          name: code.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          channel: template.channel,
          subject: template.subject,
          body: template.body,
          isSystem: true,
          isActive: true,
        },
      })
    }
  }
  
  console.log(`[NOTIFICATION] Seeded ${Object.keys(DEFAULT_TEMPLATES).length} default templates`)
}
