/**
 * WhatsApp API Routes
 * Main endpoint for WhatsApp notification operations
 */

import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

const WHATSAPP_SERVICE_URL = 'http://localhost:3005'

// Get WhatsApp configuration status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    
    // Check if WhatsApp is configured
    const config = await db.integrationConfig.findFirst({
      where: {
        provider: 'whatsapp',
        service: 'messaging',
        isActive: true,
        ...(merchantId && { merchantId }),
      },
    })
    
    // Get stats from WhatsApp service
    const statsResponse = await fetch(`${WHATSAPP_SERVICE_URL}/stats?${merchantId ? `merchantId=${merchantId}` : ''}`)
    const stats = await statsResponse.json()
    
    // Get recent notifications
    const recentNotifications = await db.notificationQueue.findMany({
      where: {
        channel: 'whatsapp',
        ...(merchantId && { merchantId }),
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
    
    return NextResponse.json({
      configured: !!config,
      healthStatus: config?.healthStatus || 'unknown',
      stats,
      recentNotifications,
    })
  } catch (error) {
    console.error('[WHATSAPP API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get WhatsApp status' },
      { status: 500 }
    )
  }
}

// Queue a WhatsApp notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, merchantId, to, data, templateCode, variables, priority, scheduledAt } = body
    
    // Validate phone number
    if (!to && action !== 'process') {
      return NextResponse.json(
        { error: 'Recipient phone number required' },
        { status: 400 }
      )
    }
    
    switch (action) {
      case 'receipt':
        // Send e-receipt
        const receiptResponse = await fetch(`${WHATSAPP_SERVICE_URL}/send/receipt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ merchantId, to, receipt: data }),
        })
        const receiptResult = await receiptResponse.json()
        return NextResponse.json(receiptResult)
        
      case 'booking':
        // Send booking confirmation
        const bookingResponse = await fetch(`${WHATSAPP_SERVICE_URL}/send/booking`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ merchantId, to, data }),
        })
        const bookingResult = await bookingResponse.json()
        return NextResponse.json(bookingResult)
        
      case 'reminder':
        // Send appointment reminder
        const reminderResponse = await fetch(`${WHATSAPP_SERVICE_URL}/send/reminder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ merchantId, to, data }),
        })
        const reminderResult = await reminderResponse.json()
        return NextResponse.json(reminderResult)
        
      case 'order':
        // Send order update
        const orderResponse = await fetch(`${WHATSAPP_SERVICE_URL}/send/order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ merchantId, to, data }),
        })
        const orderResult = await orderResponse.json()
        return NextResponse.json(orderResult)
        
      case 'queue':
        // Queue a generic notification
        const queueResponse = await fetch(`${WHATSAPP_SERVICE_URL}/queue`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            merchantId,
            recipientType: 'customer',
            recipientPhone: to,
            recipientName: data?.recipientName,
            body: data?.body || data?.message,
            templateCode,
            variables,
            priority,
            scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
          }),
        })
        const queueResult = await queueResponse.json()
        return NextResponse.json(queueResult)
        
      case 'test':
        // Test WhatsApp connection
        const testResponse = await fetch(`${WHATSAPP_SERVICE_URL}/test`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ merchantId, to }),
        })
        const testResult = await testResponse.json()
        return NextResponse.json(testResult)
        
      case 'process':
        // Manually trigger queue processing
        const processResponse = await fetch(`${WHATSAPP_SERVICE_URL}/process`, {
          method: 'POST',
        })
        const processResult = await processResponse.json()
        return NextResponse.json(processResult)
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('[WHATSAPP API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process WhatsApp request' },
      { status: 500 }
    )
  }
}
