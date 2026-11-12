import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

// South African Trading Violation Types
const VIOLATION_TYPES = {
  after_hours: {
    name: 'After Hours Sale',
    description: 'Attempted sale outside permitted trading hours',
    severity: 'high',
    autoBlock: true
  },
  restricted_day: {
    name: 'Restricted Day',
    description: 'Attempted sale on a restricted day (e.g., certain public holidays)',
    severity: 'high',
    autoBlock: true
  },
  underage_sale: {
    name: 'Underage Sale',
    description: 'Attempted sale to person under 18',
    severity: 'critical',
    autoBlock: true
  },
  license_breach: {
    name: 'License Breach',
    description: 'Sale outside license conditions',
    severity: 'high',
    autoBlock: true
  },
  intoxicated_person: {
    name: 'Sale to Intoxicated Person',
    description: 'Attempted sale to visibly intoxicated person',
    severity: 'medium',
    autoBlock: false
  },
  manager_override: {
    name: 'Manager Override',
    description: 'Manager override of blocked sale',
    severity: 'low',
    autoBlock: false
  }
} as const

// GET - Trading violations
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const resolved = searchParams.get('resolved')
    const type = searchParams.get('type')
    const severity = searchParams.get('severity')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    const where: Record<string, unknown> = {}
    if (resolved !== null) where.resolved = resolved === 'true'
    if (type) where.type = type
    
    // Date filtering
    if (startDate && endDate) {
      where.occurredAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }
    
    const violations = await db.tradingViolation.findMany({
      where,
      orderBy: { occurredAt: 'desc' },
      take: limit,
      skip: offset,
    })
    
    const total = await db.tradingViolation.count({ where })
    
    // Filter by severity if requested (post-query filter)
    let filteredViolations = violations
    if (severity) {
      filteredViolations = violations.filter(v => {
        const vType = VIOLATION_TYPES[v.type as keyof typeof VIOLATION_TYPES]
        return vType && vType.severity === severity
      })
    }
    
    // Statistics
    const stats = {
      total: await db.tradingViolation.count(),
      unresolved: await db.tradingViolation.count({ where: { resolved: false } }),
      blocked: await db.tradingViolation.count({ where: { blocked: true } }),
      overridden: await db.tradingViolation.count({ where: { overrideCode: { not: null } } }),
      today: await db.tradingViolation.count({
        where: {
          occurredAt: {
            gte: new Date(new Date().toISOString().split('T')[0])
          }
        }
      })
    }
    
    // By type breakdown
    const byType = await db.tradingViolation.groupBy({
      by: ['type'],
      _count: { id: true }
    })
    
    // Unresolved high-priority violations
    const unresolvedHigh = await db.tradingViolation.findMany({
      where: {
        resolved: false,
        type: { in: ['after_hours', 'underage_sale', 'license_breach'] }
      },
      orderBy: { occurredAt: 'desc' },
      take: 10
    })
    
    // Recent manager overrides
    const recentOverrides = await db.tradingViolation.findMany({
      where: {
        overrideCode: { not: null }
      },
      orderBy: { occurredAt: 'desc' },
      take: 10
    })
    
    return NextResponse.json({
      success: true,
      data: filteredViolations,
      pagination: { total, limit, offset },
      stats,
      byType: byType.map(t => ({
        type: t.type,
        count: t._count.id,
        info: VIOLATION_TYPES[t.type as keyof typeof VIOLATION_TYPES]
      })),
      unresolvedHighPriority: unresolvedHigh,
      recentOverrides,
      violationTypes: VIOLATION_TYPES
    })
  } catch (error) {
    console.error('Error fetching violations:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch violations' },
      { status: 500 }
    )
  }
}

// POST - Log a violation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.type) {
      return NextResponse.json(
        { success: false, error: 'Violation type is required' },
        { status: 400 }
      )
    }
    
    const violationType = VIOLATION_TYPES[body.type as keyof typeof VIOLATION_TYPES]
    if (!violationType) {
      return NextResponse.json(
        { success: false, error: 'Invalid violation type' },
        { status: 400 }
      )
    }
    
    const violation = await db.tradingViolation.create({
      data: {
        violationId: `TV-${Date.now()}-${nanoid(6)}`,
        type: body.type,
        occurredAt: new Date(),
        productId: body.productId,
        productName: body.productName,
        attemptedBy: body.attemptedBy,
        terminalId: body.terminalId,
        blocked: body.blocked ?? violationType.autoBlock ?? true,
        overrideCode: body.overrideCode,
        overriddenBy: body.overriddenBy,
        overrideReason: body.overrideReason,
        notes: body.notes,
        resolved: false,
      },
    })
    
    return NextResponse.json({
      success: true,
      data: violation,
      severity: violationType.severity,
      message: violation.blocked 
        ? 'Sale blocked and violation logged' 
        : 'Violation logged'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating violation:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create violation' },
      { status: 500 }
    )
  }
}

// PATCH - Resolve a violation
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'Violation ID is required' },
        { status: 400 }
      )
    }
    
    const violation = await db.tradingViolation.update({
      where: { id: body.id },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy: body.resolvedBy,
        notes: body.notes,
        updatedAt: new Date()
      }
    })
    
    return NextResponse.json({
      success: true,
      data: violation,
      message: 'Violation resolved'
    })
  } catch (error) {
    console.error('Error resolving violation:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to resolve violation' },
      { status: 500 }
    )
  }
}
