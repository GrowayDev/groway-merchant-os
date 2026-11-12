/**
 * WhatsApp Notification Service
 * 
 * Handles WhatsApp Business API integration for:
 * - E-receipts
 * - Booking confirmations
 * - Appointment reminders
 * - Order updates
 * - Marketing messages
 * 
 * Runs on port 3005
 */

import { PrismaClient } from '../../node_modules/@prisma/client'

const prisma = new PrismaClient()
const PORT = 3005

// WhatsApp Business API Configuration
interface WhatsAppConfig {
  accessToken: string
  phoneNumberId: string
  businessAccountId: string
  webhookVerifyToken: string
  appId: string
  appSecret: string
}

// Types
interface WhatsAppMessage {
  to: string
  type: 'text' | 'template' | 'image' | 'document' | 'interactive'
  text?: {
    body: string
    preview_url?: boolean
  }
  template?: {
    name: string
    language: {
      code: string
    }
    components?: WhatsAppTemplateComponent[]
  }
  image?: {
    link: string
    caption?: string
  }
  document?: {
    link: string
    filename: string
    caption?: string
  }
  interactive?: {
    type: 'button' | 'list' | 'cta_url'
    body?: { text: string }
    action?: Record<string, unknown>
  }
}

interface WhatsAppTemplateComponent {
  type: 'header' | 'body' | 'button'
  parameters: Array<{
    type: 'text' | 'image' | 'document' | 'video'
    text?: string
    image?: { link: string }
    document?: { link: string; filename: string }
  }>
}

interface EReceiptData {
  businessName: string
  businessAddress?: string
  businessPhone?: string
  receiptNumber: string
  date: string
  time: string
  items: Array<{
    name: string
    quantity: number
    price: number
    total: number
  }>
  subtotal: number
  discount?: number
  tax: number
  total: number
  paymentMethod: string
  customerName?: string
  cashierName?: string
  footer?: string
}

interface QueuedMessage {
  id: string
  merchantId: string | null
  recipientPhone: string | null
  recipientName: string | null
  channel: string
  subject: string | null
  body: string
  htmlBody: string | null
  templateId: string | null
  variables: string | null
  status: string
  priority: string
  scheduledAt: Date | null
  attempts: number
  maxAttempts: number
  externalId: string | null
  lastError: string | null
}

// Get WhatsApp configuration for merchant
async function getWhatsAppConfig(merchantId?: string): Promise<WhatsAppConfig | null> {
  // Check for merchant-specific config
  if (merchantId) {
    const merchantConfig = await prisma.integrationConfig.findFirst({
      where: {
        merchantId,
        provider: 'whatsapp',
        service: 'messaging',
        isActive: true,
      },
    })
    
    if (merchantConfig) {
      const credentials = JSON.parse(merchantConfig.credentials)
      return {
        accessToken: credentials.accessToken,
        phoneNumberId: credentials.phoneNumberId,
        businessAccountId: credentials.businessAccountId,
        webhookVerifyToken: credentials.webhookVerifyToken,
        appId: credentials.appId,
        appSecret: credentials.appSecret,
      }
    }
  }
  
  // Check for system default config
  const systemConfig = await prisma.integrationConfig.findFirst({
    where: {
      merchantId: null,
      provider: 'whatsapp',
      service: 'messaging',
      isActive: true,
    },
  })
  
  if (systemConfig) {
    const credentials = JSON.parse(systemConfig.credentials)
    return {
      accessToken: credentials.accessToken,
      phoneNumberId: credentials.phoneNumberId,
      businessAccountId: credentials.businessAccountId,
      webhookVerifyToken: credentials.webhookVerifyToken,
      appId: credentials.appId,
      appSecret: credentials.appSecret,
    }
  }
  
  return null
}

// Format phone number for WhatsApp (E.164 format)
function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '')
  
  // South African numbers
  if (cleaned.startsWith('0')) {
    cleaned = '27' + cleaned.substring(1)
  }
  
  // Add + if not present
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned
  }
  
  return cleaned
}

// Send WhatsApp message via Business API
async function sendWhatsAppMessage(
  config: WhatsAppConfig,
  message: WhatsAppMessage
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const url = `https://graph.facebook.com/v18.0/${config.phoneNumberId}/messages`
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: message.to,
        ...message,
      }),
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      console.error('[WHATSAPP] API Error:', JSON.stringify(data, null, 2))
      return {
        success: false,
        error: data.error?.message || `HTTP ${response.status}`,
      }
    }
    
    return {
      success: true,
      messageId: data.messages?.[0]?.id,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Send text message
async function sendTextMessage(
  config: WhatsAppConfig,
  to: string,
  text: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return sendWhatsAppMessage(config, {
    to: formatPhoneNumber(to),
    type: 'text',
    text: {
      body: text,
      preview_url: true,
    },
  })
}

// Send template message
async function sendTemplateMessage(
  config: WhatsAppConfig,
  to: string,
  templateName: string,
  languageCode: string,
  components?: WhatsAppTemplateComponent[]
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return sendWhatsAppMessage(config, {
    to: formatPhoneNumber(to),
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      components,
    },
  })
}

// Generate e-receipt message
function generateReceiptMessage(receipt: EReceiptData): string {
  const lines = [
    `*${receipt.businessName}*`,
    receipt.businessAddress || '',
    receipt.businessPhone || '',
    '',
    '━━━━━━━━━━━━━━━━━━━━━━',
    `*RECEIPT: ${receipt.receiptNumber}*`,
    `Date: ${receipt.date}`,
    `Time: ${receipt.time}`,
    '━━━━━━━━━━━━━━━━━━━━━━',
    '',
  ]
  
  // Items
  for (const item of receipt.items) {
    lines.push(`${item.name}`)
    lines.push(`  ${item.quantity} x R${item.price.toFixed(2)} = R${item.total.toFixed(2)}`)
  }
  
  lines.push('')
  lines.push('━━━━━━━━━━━━━━━━━━━━━━')
  
  lines.push(`Subtotal: R${receipt.subtotal.toFixed(2)}`)
  if (receipt.discount && receipt.discount > 0) {
    lines.push(`Discount: -R${receipt.discount.toFixed(2)}`)
  }
  lines.push(`VAT (15%): R${receipt.tax.toFixed(2)}`)
  lines.push(`*TOTAL: R${receipt.total.toFixed(2)}*`)
  lines.push('')
  lines.push(`Payment: ${receipt.paymentMethod}`)
  
  if (receipt.customerName) {
    lines.push(`Customer: ${receipt.customerName}`)
  }
  if (receipt.cashierName) {
    lines.push(`Served by: ${receipt.cashierName}`)
  }
  
  lines.push('')
  lines.push('━━━━━━━━━━━━━━━━━━━━━━')
  lines.push(receipt.footer || 'Thank you for your business!')
  lines.push('')
  lines.push('_Powered by GroPoint_')
  
  return lines.filter(Boolean).join('\n')
}

// Send e-receipt
async function sendReceipt(
  config: WhatsAppConfig,
  to: string,
  receipt: EReceiptData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const message = generateReceiptMessage(receipt)
  return sendTextMessage(config, to, message)
}

// Send booking confirmation
async function sendBookingConfirmation(
  config: WhatsAppConfig,
  to: string,
  data: {
    customerName: string
    serviceName: string
    staffName: string
    date: string
    time: string
    duration: number
    price: number
    businessName: string
    businessAddress?: string
    businessPhone?: string
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const message = [
    `*Booking Confirmation*`,
    '',
    `Hi ${data.customerName}! 👋`,
    '',
    `Your appointment has been confirmed:`,
    '',
    `💇 *${data.serviceName}*`,
    `📅 ${data.date}`,
    `⏰ ${data.time} (${data.duration} mins)`,
    `👤 with ${data.staffName}`,
    `💰 R${data.price.toFixed(2)}`,
    '',
    `📍 ${data.businessName}`,
    data.businessAddress || '',
    data.businessPhone || '',
    '',
    `Please arrive 5 minutes early.`,
    '',
    `Reply CANCEL to cancel this booking.`,
    '',
    `_Powered by GroPoint_`,
  ].filter(Boolean).join('\n')
  
  return sendTextMessage(config, to, message)
}

// Send appointment reminder
async function sendAppointmentReminder(
  config: WhatsAppConfig,
  to: string,
  data: {
    customerName: string
    serviceName: string
    staffName: string
    date: string
    time: string
    businessName: string
    businessPhone?: string
    hoursUntil: number
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const timeText = data.hoursUntil === 24 
    ? 'tomorrow' 
    : `in ${data.hoursUntil} hours`
  
  const message = [
    `*Appointment Reminder* ⏰`,
    '',
    `Hi ${data.customerName},`,
    '',
    `This is a friendly reminder that your appointment is ${timeText}:`,
    '',
    `💇 *${data.serviceName}*`,
    `📅 ${data.date}`,
    `⏰ ${data.time}`,
    `👤 with ${data.staffName}`,
    '',
    `📍 ${data.businessName}`,
    data.businessPhone ? `📞 ${data.businessPhone}` : '',
    '',
    `See you soon!`,
    '',
    `_Powered by GroPoint_`,
  ].filter(Boolean).join('\n')
  
  return sendTextMessage(config, to, message)
}

// Send order update
async function sendOrderUpdate(
  config: WhatsAppConfig,
  to: string,
  data: {
    customerName: string
    orderNumber: string
    status: string
    estimatedTime?: string
    businessName: string
    message?: string
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const statusEmoji: Record<string, string> = {
    'confirmed': '✅',
    'preparing': '👨‍🍳',
    'ready': '🎉',
    'dispatched': '🚗',
    'delivered': '📦',
    'cancelled': '❌',
  }
  
  const emoji = statusEmoji[data.status.toLowerCase()] || '📋'
  
  const text = [
    `*Order Update* ${emoji}`,
    '',
    `Hi ${data.customerName},`,
    '',
    `Your order #${data.orderNumber} status:`,
    `*${data.status.toUpperCase()}*`,
    '',
    data.estimatedTime ? `Estimated time: ${data.estimatedTime}` : '',
    data.message || '',
    '',
    `📍 ${data.businessName}`,
    '',
    `_Powered by GroPoint_`,
  ].filter(Boolean).join('\n')
  
  return sendTextMessage(config, to, text)
}

// Process queued messages
async function processQueuedMessages(): Promise<{ sent: number; failed: number }> {
  const now = new Date()
  
  // Get pending WhatsApp messages
  const messages = await prisma.notificationQueue.findMany({
    where: {
      channel: 'whatsapp',
      status: 'pending',
      OR: [
        { scheduledAt: null },
        { scheduledAt: { lte: now } },
      ],
      attempts: { lt: 3 },
    },
    take: 100,
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'asc' },
    ],
  }) as QueuedMessage[]
  
  let sent = 0
  let failed = 0
  
  for (const msg of messages) {
    try {
      if (!msg.recipientPhone) {
        await prisma.notificationQueue.update({
          where: { id: msg.id },
          data: { status: 'failed', lastError: 'No recipient phone' },
        })
        failed++
        continue
      }
      
      // Get config
      const config = await getWhatsAppConfig(msg.merchantId || undefined)
      if (!config) {
        console.log(`[WHATSAPP] No config found for message ${msg.id}`)
        await prisma.notificationQueue.update({
          where: { id: msg.id },
          data: { 
            status: 'failed', 
            lastError: 'WhatsApp not configured',
          },
        })
        failed++
        continue
      }
      
      // Mark as processing
      await prisma.notificationQueue.update({
        where: { id: msg.id },
        data: { status: 'processing' },
      })
      
      // Parse variables
      const variables = msg.variables ? JSON.parse(msg.variables) : {}
      
      // Send message
      let result
      if (msg.templateId) {
        // Template message
        const template = await prisma.notificationTemplate.findUnique({
          where: { id: msg.templateId },
        })
        
        if (template) {
          const components: WhatsAppTemplateComponent[] = []
          if (Object.keys(variables).length > 0) {
            components.push({
              type: 'body',
              parameters: Object.values(variables).map(v => ({
                type: 'text',
                text: String(v),
              })),
            })
          }
          
          result = await sendTemplateMessage(
            config,
            msg.recipientPhone,
            template.code,
            'en',
            components.length > 0 ? components : undefined
          )
        }
      } else {
        // Text message
        result = await sendTextMessage(config, msg.recipientPhone, msg.body)
      }
      
      if (result.success) {
        await prisma.notificationQueue.update({
          where: { id: msg.id },
          data: {
            status: 'sent',
            sentAt: new Date(),
            externalId: result.messageId,
          },
        })
        console.log(`[WHATSAPP] Sent message ${msg.id} to ${msg.recipientPhone}`)
        sent++
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      console.error(`[WHATSAPP] Failed to send message ${msg.id}:`, errorMessage)
      
      await prisma.notificationQueue.update({
        where: { id: msg.id },
        data: {
          status: msg.attempts >= msg.maxAttempts - 1 ? 'failed' : 'pending',
          attempts: { increment: 1 },
          lastError: errorMessage,
        },
      })
      
      failed++
    }
  }
  
  return { sent, failed }
}

// Queue a notification
async function queueNotification(data: {
  merchantId?: string
  recipientType: string
  recipientId?: string
  recipientPhone?: string
  recipientEmail?: string
  recipientName?: string
  body: string
  templateCode?: string
  variables?: Record<string, string>
  priority?: string
  scheduledAt?: Date
}): Promise<{ id: string }> {
  // Find template if specified
  let templateId: string | null = null
  if (data.templateCode) {
    const template = await prisma.notificationTemplate.findFirst({
      where: {
        code: data.templateCode,
        channel: 'whatsapp',
        isActive: true,
        OR: [
          { merchantId: data.merchantId || null },
          { isSystem: true },
        ],
      },
    })
    templateId = template?.id || null
  }
  
  const notification = await prisma.notificationQueue.create({
    data: {
      merchantId: data.merchantId || null,
      recipientType: data.recipientType,
      recipientId: data.recipientId || null,
      recipientPhone: data.recipientPhone || null,
      recipientEmail: data.recipientEmail || null,
      recipientName: data.recipientName || null,
      channel: 'whatsapp',
      body: data.body,
      templateId,
      variables: data.variables ? JSON.stringify(data.variables) : null,
      priority: data.priority || 'normal',
      scheduledAt: data.scheduledAt || null,
      status: 'pending',
    },
  })
  
  return { id: notification.id }
}

// HTTP Server
async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const path = url.pathname
  
  // Health check
  if (path === '/health') {
    return Response.json({
      status: 'healthy',
      service: 'whatsapp-service',
      timestamp: new Date().toISOString(),
    })
  }
  
  // Webhook verification
  if (path === '/webhook' && request.method === 'GET') {
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')
    
    // Get verify token from config
    const config = await getWhatsAppConfig()
    
    if (mode === 'subscribe' && token === config?.webhookVerifyToken) {
      console.log('[WHATSAPP] Webhook verified')
      return new Response(challenge, { status: 200 })
    }
    
    return Response.json({ error: 'Verification failed' }, { status: 403 })
  }
  
  // Webhook handler (incoming messages)
  if (path === '/webhook' && request.method === 'POST') {
    const body = await request.json()
    
    // Process webhook data (status updates, incoming messages, etc.)
    console.log('[WHATSAPP] Webhook received:', JSON.stringify(body, null, 2))
    
    // Handle message status updates
    if (body.entry?.[0]?.changes?.[0]?.value?.statuses) {
      const statuses = body.entry[0].changes[0].value.statuses
      for (const status of statuses) {
        await prisma.notificationQueue.updateMany({
          where: { externalId: status.id },
          data: {
            status: status.status,
            deliveredAt: status.status === 'delivered' ? new Date() : undefined,
          },
        })
      }
    }
    
    return Response.json({ status: 'received' })
  }
  
  // Process queue
  if (path === '/process' && request.method === 'POST') {
    const result = await processQueuedMessages()
    return Response.json(result)
  }
  
  // Send receipt
  if (path === '/send/receipt' && request.method === 'POST') {
    const body = await request.json()
    const { merchantId, to, receipt } = body
    
    const config = await getWhatsAppConfig(merchantId)
    if (!config) {
      return Response.json({ error: 'WhatsApp not configured' }, { status: 400 })
    }
    
    const result = await sendReceipt(config, to, receipt)
    
    if (result.success) {
      // Log to notification queue
      await queueNotification({
        merchantId,
        recipientType: 'customer',
        recipientPhone: to,
        recipientName: receipt.customerName,
        body: generateReceiptMessage(receipt),
        priority: 'high',
      })
    }
    
    return Response.json(result)
  }
  
  // Send booking confirmation
  if (path === '/send/booking' && request.method === 'POST') {
    const body = await request.json()
    const { merchantId, to, data } = body
    
    const config = await getWhatsAppConfig(merchantId)
    if (!config) {
      return Response.json({ error: 'WhatsApp not configured' }, { status: 400 })
    }
    
    const result = await sendBookingConfirmation(config, to, data)
    return Response.json(result)
  }
  
  // Send appointment reminder
  if (path === '/send/reminder' && request.method === 'POST') {
    const body = await request.json()
    const { merchantId, to, data } = body
    
    const config = await getWhatsAppConfig(merchantId)
    if (!config) {
      return Response.json({ error: 'WhatsApp not configured' }, { status: 400 })
    }
    
    const result = await sendAppointmentReminder(config, to, data)
    return Response.json(result)
  }
  
  // Send order update
  if (path === '/send/order' && request.method === 'POST') {
    const body = await request.json()
    const { merchantId, to, data } = body
    
    const config = await getWhatsAppConfig(merchantId)
    if (!config) {
      return Response.json({ error: 'WhatsApp not configured' }, { status: 400 })
    }
    
    const result = await sendOrderUpdate(config, to, data)
    return Response.json(result)
  }
  
  // Queue notification
  if (path === '/queue' && request.method === 'POST') {
    const body = await request.json()
    const result = await queueNotification(body)
    return Response.json(result)
  }
  
  // Get stats
  if (path === '/stats' && request.method === 'GET') {
    const merchantId = url.searchParams.get('merchantId')
    
    const where = { channel: 'whatsapp', ...(merchantId && { merchantId }) }
    
    const [pending, sent, failed, delivered] = await Promise.all([
      prisma.notificationQueue.count({ where: { ...where, status: 'pending' } }),
      prisma.notificationQueue.count({ where: { ...where, status: 'sent' } }),
      prisma.notificationQueue.count({ where: { ...where, status: 'failed' } }),
      prisma.notificationQueue.count({ where: { ...where, status: 'delivered' } }),
    ])
    
    return Response.json({ pending, sent, failed, delivered })
  }
  
  // Test connection
  if (path === '/test' && request.method === 'POST') {
    const body = await request.json()
    const { merchantId, to } = body
    
    const config = await getWhatsAppConfig(merchantId)
    if (!config) {
      return Response.json({ error: 'WhatsApp not configured' }, { status: 400 })
    }
    
    const result = await sendTextMessage(
      config,
      to,
      '👋 Hello! This is a test message from GroPoint. Your WhatsApp integration is working correctly!'
    )
    
    return Response.json(result)
  }
  
  return Response.json({ error: 'Not found' }, { status: 404 })
}

// Main
async function main() {
  console.log(`[WHATSAPP] Service starting on port ${PORT}`)
  
  // Process queue on startup
  await processQueuedMessages()
  
  // Check queue every 10 seconds
  const PROCESS_INTERVAL = 10 * 1000
  setInterval(async () => {
    await processQueuedMessages()
  }, PROCESS_INTERVAL)
  
  // Start HTTP server
  const server = Bun.serve({
    port: PORT,
    fetch: handleRequest,
  })
  
  console.log(`[WHATSAPP] HTTP server listening on port ${PORT}`)
}

main().catch(console.error)
