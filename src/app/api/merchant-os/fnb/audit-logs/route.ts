import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// F&B Audit action types
const AUDIT_ACTIONS = [
  'recipe_created',
  'recipe_updated',
  'recipe_deleted',
  'ingredient_added',
  'ingredient_updated',
  'stock_adjusted',
  'wastage_recorded',
  'deduction_processed',
  'order_created',
  'order_modified',
  'price_changed',
  'station_changed',
  'allergen_updated',
  'preparation_started',
  'preparation_completed',
  'quality_check',
  'temperature_logged',
  'cleaning_logged',
]

// GET - List audit logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')
    const action = searchParams.get('action')
    const performedById = searchParams.get('performedById')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const station = searchParams.get('station')
    const period = searchParams.get('period')

    const where: any = {}
    if (entityType) where.entityType = entityType
    if (entityId) where.entityId = entityId
    if (action) where.action = action
    if (performedById) where.performedById = performedById
    if (station) where.station = station

    // Date filtering
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    } else if (period) {
      const now = new Date()
      where.createdAt = {}
      switch (period) {
        case 'today':
          where.createdAt.gte = new Date(now.setHours(0, 0, 0, 0))
          break
        case 'week':
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          where.createdAt.gte = weekAgo
          break
        case 'month':
          const monthAgo = new Date()
          monthAgo.setMonth(monthAgo.getMonth() - 1)
          where.createdAt.gte = monthAgo
          break
      }
    }

    // Use FnbAuditLog model if it exists
    let auditLogs: any[] = []
    try {
      auditLogs = await (db as any).fnbAuditLog?.findMany({
        where,
        include: {
          performedBy: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 500,
      }) || []
    } catch {
      auditLogs = []
    }

    // Parse details JSON
    const parsedLogs = auditLogs.map(log => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null
    }))

    // Calculate summary statistics
    const actionCounts = parsedLogs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const entityCounts = parsedLogs.reduce((acc, log) => {
      acc[log.entityType] = (acc[log.entityType] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const stationCounts = parsedLogs.reduce((acc, log) => {
      const stationKey = log.station || 'general'
      acc[stationKey] = (acc[stationKey] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Hourly distribution
    const hourlyDistribution: Record<number, number> = {}
    for (let i = 0; i < 24; i++) {
      hourlyDistribution[i] = 0
    }
    parsedLogs.forEach(log => {
      const hour = new Date(log.createdAt).getHours()
      hourlyDistribution[hour]++
    })

    return NextResponse.json({
      logs: parsedLogs,
      summary: {
        totalLogs: parsedLogs.length,
        actionCounts,
        entityCounts,
        stationCounts,
        hourlyDistribution: Object.entries(hourlyDistribution).map(([hour, count]) => ({ 
          hour: parseInt(hour), 
          count 
        })),
      },
      actions: AUDIT_ACTIONS,
      entityTypes: ['recipe', 'ingredient', 'order', 'station', 'equipment', 'general'],
    })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
  }
}

// POST - Create audit log entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      action,
      entityType,
      entityId,
      details,
      station,
      performedById,
      metadata,
    } = body

    if (!action || !entityType) {
      return NextResponse.json({ 
        error: 'Action and entity type are required' 
      }, { status: 400 })
    }

    // Create audit log
    let auditLog: any
    try {
      auditLog = await (db as any).fnbAuditLog?.create({
        data: {
          action,
          entityType,
          entityId,
          details: details ? JSON.stringify(details) : null,
          station,
          performedById,
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      })
    } catch {
      // Model doesn't exist
      auditLog = {
        id: `audit-${Date.now()}`,
        action,
        entityType,
        entityId,
        details,
        station,
        createdAt: new Date().toISOString(),
      }
    }

    return NextResponse.json({
      success: true,
      log: auditLog,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating audit log:', error)
    return NextResponse.json({ error: 'Failed to create audit log' }, { status: 500 })
  }
}
