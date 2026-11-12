/**
 * GroSell Analytics API
 * 
 * Analytics and reporting for WhatsApp commerce
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const merchantId = searchParams.get('merchantId')
    const eventType = searchParams.get('eventType')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const groupBy = searchParams.get('groupBy') // 'day' | 'hour' | 'vertical'

    if (!merchantId) {
      return NextResponse.json({ error: 'Missing merchantId' }, { status: 400 })
    }

    // Build date filter
    const dateFilter: any = {}
    if (startDate || endDate) {
      dateFilter.createdAt = {}
      if (startDate) dateFilter.createdAt.gte = new Date(startDate)
      if (endDate) dateFilter.createdAt.lte = new Date(endDate)
    }

    // Get analytics events
    const where: any = { merchantId, ...dateFilter }
    if (eventType) where.eventType = eventType

    const events = await db.groSellAnalyticsEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 1000
    })

    // Calculate metrics
    const metrics = {
      totalEvents: events.length,
      messagesSent: events.filter(e => e.eventType === 'message_sent').length,
      messagesReceived: events.filter(e => e.eventType === 'message_received').length,
      ordersCreated: events.filter(e => e.eventType === 'order_created').length,
      ordersCompleted: events.filter(e => e.eventType === 'order_completed').length,
      totalRevenue: events
        .filter(e => e.eventType === 'order_created' && e.value)
        .reduce((sum, e) => sum + (e.value || 0), 0),
      uniqueCustomers: new Set(events.map(e => e.customerPhone).filter(Boolean)).size
    }

    // Group by vertical if requested
    let groupedData = null
    if (groupBy === 'vertical') {
      const verticalGroups: Record<string, { count: number; revenue: number }> = {}
      events.forEach(e => {
        const vertical = e.vertical || 'unknown'
        if (!verticalGroups[vertical]) {
          verticalGroups[vertical] = { count: 0, revenue: 0 }
        }
        verticalGroups[vertical].count++
        verticalGroups[vertical].revenue += e.value || 0
      })
      groupedData = verticalGroups
    }

    // Get additional stats
    const [
      activeConversations,
      pendingOrders,
      activeBNPLPlans,
      activeLaybyPlans
    ] = await Promise.all([
      db.groSellConversation.count({
        where: { merchantId, status: 'active' }
      }),
      db.groSellOrder.count({
        where: { merchantId, status: { in: ['pending', 'confirmed', 'processing'] } }
      }),
      db.groSellBNPLPlan.count({
        where: { merchantId, status: 'active' }
      }),
      db.groSellLaybyPlan.count({
        where: { merchantId, status: 'active' }
      })
    ])

    return NextResponse.json({
      success: true,
      metrics,
      additionalStats: {
        activeConversations,
        pendingOrders,
        activeBNPLPlans,
        activeLaybyPlans
      },
      groupedData,
      events: events.slice(0, 100) // Return last 100 events
    })
  } catch (error) {
    console.error('GroSell analytics get error:', error)
    return NextResponse.json({ error: 'Failed to get analytics' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      merchantId,
      eventType,
      conversationId,
      orderId,
      flowName,
      vertical,
      subVertical,
      customerPhone,
      value,
      metadata
    } = body

    if (!merchantId || !eventType) {
      return NextResponse.json(
        { error: 'Missing required fields: merchantId, eventType' },
        { status: 400 }
      )
    }

    const event = await db.groSellAnalyticsEvent.create({
      data: {
        id: `gsa_${nanoid(12)}`,
        merchantId,
        eventType,
        conversationId,
        orderId,
        flowName,
        vertical,
        subVertical,
        customerPhone,
        value,
        metadata: metadata ? JSON.stringify(metadata) : null,
        createdAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      event
    })
  } catch (error) {
    console.error('GroSell analytics post error:', error)
    return NextResponse.json({ error: 'Failed to create analytics event' }, { status: 500 })
  }
}

import { nanoid } from 'nanoid'
