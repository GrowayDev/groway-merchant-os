/**
 * GroSell Compliance API
 * 
 * Compliance layers for different verticals:
 * - Age verification (Liquor)
 * - SAHPRA gate (Pharmacy)
 * - Consent forms (Health & Beauty)
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

// Vertical compliance requirements
const COMPLIANCE_RULES: Record<string, {
  requiresAgeVerification: boolean
  minAge: number
  requiresLicense: boolean
  requiresConsent: boolean
  tradingHours?: { start: string; end: string }
  restrictedDays?: string[]
}> = {
  'liquor_nightlife': {
    requiresAgeVerification: true,
    minAge: 18,
    requiresLicense: true,
    requiresConsent: false,
    tradingHours: { start: '10:00', end: '02:00' },
    restrictedDays: [] // Varies by province
  },
  'health_pharmacy': {
    requiresAgeVerification: false,
    minAge: 0,
    requiresLicense: true, // SAHPRA
    requiresConsent: true,
  },
  'health_beauty': {
    requiresAgeVerification: false,
    minAge: 0,
    requiresLicense: false,
    requiresConsent: true, // For treatments
  },
  'food_beverage': {
    requiresAgeVerification: false,
    minAge: 0,
    requiresLicense: false,
    requiresConsent: false,
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const merchantId = searchParams.get('merchantId')
    const vertical = searchParams.get('vertical')
    const eventType = searchParams.get('eventType')

    if (vertical) {
      // Get compliance rules for vertical
      const rules = COMPLIANCE_RULES[vertical] || null
      return NextResponse.json({
        success: true,
        vertical,
        complianceRequirements: rules
      })
    }

    if (!merchantId) {
      return NextResponse.json({ error: 'Missing merchantId' }, { status: 400 })
    }

    const where: any = { merchantId }
    if (eventType) where.eventType = eventType

    const events = await db.groSellComplianceEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    return NextResponse.json({
      success: true,
      events,
      count: events.length
    })
  } catch (error) {
    console.error('GroSell compliance get error:', error)
    return NextResponse.json({ error: 'Failed to get compliance data' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      merchantId,
      orderId,
      conversationId,
      eventType,
      customerPhone,
      customerName,
      documentType,
      documentNumber,
      metadata
    } = body

    if (!merchantId || !eventType) {
      return NextResponse.json(
        { error: 'Missing required fields: merchantId, eventType' },
        { status: 400 }
      )
    }

    // Create compliance event
    const event = await db.groSellComplianceEvent.create({
      data: {
        id: `gsc_${nanoid(12)}`,
        merchantId,
        orderId,
        conversationId,
        eventType,
        status: 'pending',
        customerPhone,
        customerName,
        documentType,
        documentNumber,
        metadata: metadata ? JSON.stringify(metadata) : null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      event
    })
  } catch (error) {
    console.error('GroSell compliance post error:', error)
    return NextResponse.json({ error: 'Failed to create compliance event' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventId, action, verifiedBy, notes, expiryDate } = body

    if (!eventId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: eventId, action' },
        { status: 400 }
      )
    }

    const event = await db.groSellComplianceEvent.findUnique({
      where: { id: eventId }
    })

    if (!event) {
      return NextResponse.json({ error: 'Compliance event not found' }, { status: 404 })
    }

    let updateData: any = { updatedAt: new Date() }

    switch (action) {
      case 'verify':
        updateData.status = 'passed'
        updateData.verifiedAt = new Date()
        updateData.verifiedBy = verifiedBy
        updateData.notes = notes
        updateData.expiryDate = expiryDate
        break
      case 'reject':
        updateData.status = 'failed'
        updateData.notes = notes
        break
      case 'bypass':
        updateData.status = 'bypassed'
        updateData.verifiedBy = verifiedBy
        updateData.notes = notes || 'Manager override'
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const updatedEvent = await db.groSellComplianceEvent.update({
      where: { id: eventId },
      data: updateData
    })

    // If verification passed and linked to order, update order
    if (action === 'verify' && event.orderId) {
      await db.groSellOrder.update({
        where: { id: event.orderId },
        data: { complianceChecked: true }
      })
    }

    return NextResponse.json({
      success: true,
      event: updatedEvent
    })
  } catch (error) {
    console.error('GroSell compliance put error:', error)
    return NextResponse.json({ error: 'Failed to update compliance event' }, { status: 500 })
  }
}

// Check if order requires compliance verification
export async function checkOrderCompliance(
  merchantId: string,
  vertical: string,
  customerPhone: string
): Promise<{ required: boolean; checks: string[] }> {
  const rules = COMPLIANCE_RULES[vertical]
  
  if (!rules) {
    return { required: false, checks: [] }
  }

  const checks: string[] = []

  if (rules.requiresAgeVerification) {
    // Check if customer already verified
    const existingVerification = await db.groSellComplianceEvent.findFirst({
      where: {
        merchantId,
        customerPhone,
        eventType: 'age_verification',
        status: 'passed'
      }
    })

    if (!existingVerification) {
      checks.push('age_verification')
    }
  }

  if (rules.requiresConsent) {
    checks.push('consent_required')
  }

  if (rules.tradingHours) {
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5)
    if (currentTime < rules.tradingHours.start || currentTime > rules.tradingHours.end) {
      checks.push('outside_trading_hours')
    }
  }

  return {
    required: checks.length > 0,
    checks
  }
}
