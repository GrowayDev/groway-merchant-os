/**
 * WhatsApp Webhook Handler
 * Handles incoming webhook events from WhatsApp Business API
 */

import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

const WHATSAPP_SERVICE_URL = 'http://localhost:3005'

// Webhook verification
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')
  
  // Get verify token from config
  const config = await db.integrationConfig.findFirst({
    where: {
      provider: 'whatsapp',
      service: 'messaging',
      isActive: true,
    },
  })
  
  let verifyToken = ''
  if (config) {
    const credentials = JSON.parse(config.credentials)
    verifyToken = credentials.webhookVerifyToken
  }
  
  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[WHATSAPP WEBHOOK] Verified')
    return new NextResponse(challenge, { status: 200 })
  }
  
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
}

// Webhook handler for incoming events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('[WHATSAPP WEBHOOK] Received:', JSON.stringify(body, null, 2))
    
    // Forward to WhatsApp service
    const response = await fetch(`${WHATSAPP_SERVICE_URL}/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    
    // Process webhook data
    const entry = body.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value
    
    if (value) {
      // Handle message status updates
      if (value.statuses) {
        for (const status of value.statuses) {
          await db.notificationQueue.updateMany({
            where: { externalId: status.id },
            data: {
              status: mapWhatsAppStatus(status.status),
              deliveredAt: status.status === 'delivered' ? new Date() : undefined,
              lastError: status.errors?.[0]?.message,
            },
          })
        }
      }
      
      // Handle incoming messages
      if (value.messages) {
        for (const message of value.messages) {
          // Store incoming message (could be used for two-way communication)
          console.log('[WHATSAPP WEBHOOK] Incoming message:', {
            from: message.from,
            type: message.type,
            timestamp: message.timestamp,
          })
          
          // You could store this in a separate table for inbox/CRM features
          // await db.whatsappIncomingMessage.create(...)
        }
      }
      
      // Handle message errors
      if (value.errors) {
        for (const error of value.errors) {
          console.error('[WHATSAPP WEBHOOK] Error:', error)
        }
      }
    }
    
    return NextResponse.json({ status: 'received' })
  } catch (error) {
    console.error('[WHATSAPP WEBHOOK] Error:', error)
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}

// Map WhatsApp status to our status
function mapWhatsAppStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'sent': 'sent',
    'delivered': 'delivered',
    'read': 'delivered',
    'failed': 'failed',
    'undelivered': 'failed',
    'pending': 'pending',
  }
  
  return statusMap[status] || status
}
