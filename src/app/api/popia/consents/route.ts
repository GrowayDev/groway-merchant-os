import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/popia/consents - List consent records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: Record<string, unknown> = {}
    
    if (status && status !== 'all') {
      where.status = status
    }
    
    if (type && type !== 'all') {
      where.consentType = type
    }

    if (search) {
      where.OR = [
        { userEmail: { contains: search } },
        { userPhone: { contains: search } },
        { userName: { contains: search } }
      ]
    }

    const [consents, total] = await Promise.all([
      db.consentRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      db.consentRecord.count({ where })
    ])

    // Get stats
    const stats = await db.consentRecord.groupBy({
      by: ['consentType', 'status'],
      _count: true
    })

    return NextResponse.json({
      consents,
      total,
      stats: stats.reduce((acc, s) => {
        const key = `${s.consentType}_${s.status}`
        acc[key] = s._count
        return acc
      }, {} as Record<string, number>),
      limit,
      offset
    })
  } catch (error) {
    console.error('Error fetching consents:', error)
    return NextResponse.json({ error: 'Failed to fetch consents' }, { status: 500 })
  }
}

// POST /api/popia/consents - Create a new consent record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      userEmail,
      userPhone,
      userName,
      consentType,
      consentSource,
      consentVersion,
      preferences,
      legalBasis,
      thirdParties,
      expiresAt,
      ipAddress,
      userAgent,
      deviceType,
      location
    } = body

    // Validate required fields
    if (!consentType || !consentSource) {
      return NextResponse.json({ 
        error: 'Missing required fields: consentType, consentSource' 
      }, { status: 400 })
    }

    // Need at least one identifier
    if (!userId && !userEmail && !userPhone) {
      return NextResponse.json({ 
        error: 'At least one user identifier is required: userId, userEmail, or userPhone' 
      }, { status: 400 })
    }

    // Create the consent record
    const consent = await db.consentRecord.create({
      data: {
        id: `consent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        userEmail,
        userPhone,
        userName,
        consentType,
        consentSource,
        consentVersion,
        status: 'active',
        preferences: preferences ? JSON.stringify(preferences) : null,
        legalBasis: legalBasis || 'consent',
        thirdParties: thirdParties ? JSON.stringify(thirdParties) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        ipAddress,
        userAgent,
        deviceType,
        location,
        updatedAt: new Date()
      }
    })

    // Log the consent
    await db.auditLog.create({
      data: {
        id: `audit-${Date.now()}`,
        action: 'create',
        category: 'consent',
        actorName: userName || userEmail || userPhone || 'Unknown',
        targetType: 'consent_record',
        targetId: consent.id,
        targetName: `${consentType} consent`,
        details: `Consent granted for ${consentType} via ${consentSource}`,
        ipAddress,
        userAgent,
        createdAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      consent
    })
  } catch (error) {
    console.error('Error creating consent:', error)
    return NextResponse.json({ error: 'Failed to create consent' }, { status: 500 })
  }
}
