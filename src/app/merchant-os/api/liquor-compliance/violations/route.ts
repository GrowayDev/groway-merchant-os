import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

// GET - List all violations
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const resolved = searchParams.get('resolved')
    const type = searchParams.get('type')
    
    const where: any = {}
    if (resolved !== null) where.resolved = resolved === 'true'
    if (type) where.type = type
    
    const violations = await db.tradingViolation.findMany({
      where,
      orderBy: { occurredAt: 'desc' },
      take: limit,
      skip: offset,
    })
    
    const total = await db.tradingViolation.count({ where })
    
    // Stats
    const stats = {
      total: await db.tradingViolation.count(),
      unresolved: await db.tradingViolation.count({ where: { resolved: false } }),
      blocked: await db.tradingViolation.count({ where: { blocked: true } }),
      overridden: await db.tradingViolation.count({ where: { overrideCode: { not: null } } }),
    }
    
    return NextResponse.json({
      data: violations,
      total,
      stats,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error fetching violations:', error)
    return NextResponse.json({ error: 'Failed to fetch violations' }, { status: 500 })
  }
}

// POST - Log a violation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const violation = await db.tradingViolation.create({
      data: {
        violationId: `TV-${Date.now()}-${nanoid(6)}`,
        type: body.type,
        occurredAt: new Date(),
        productId: body.productId,
        productName: body.productName,
        attemptedBy: body.attemptedBy,
        terminalId: body.terminalId,
        blocked: body.blocked ?? true,
        overrideCode: body.overrideCode,
        overriddenBy: body.overriddenBy,
        overrideReason: body.overrideReason,
        notes: body.notes,
      },
    })
    
    return NextResponse.json(violation, { status: 201 })
  } catch (error) {
    console.error('Error creating violation:', error)
    return NextResponse.json({ error: 'Failed to create violation' }, { status: 500 })
  }
}
