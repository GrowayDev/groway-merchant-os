import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Audit log categories for F&B
export const FNB_AUDIT_CATEGORIES = [
  'recipe_created',
  'recipe_modified',
  'recipe_deleted',
  'wastage_created',
  'wastage_approved',
  'wastage_rejected',
  'stock_adjusted',
  'prep_completed',
  'prep_cancelled',
  'quality_check_passed',
  'quality_check_failed',
  'allergen_updated',
  'price_changed',
  'station_assigned',
  'order_sent_to_kitchen',
  'order_modified',
  'order_cancelled',
  'temperature_logged',
  'expiry_marked',
  'inventory_count',
]

// GET /api/fnb/audit - Fetch audit logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const branchId = searchParams.get('branchId')
    const category = searchParams.get('category')
    const userId = searchParams.get('userId')
    const targetType = searchParams.get('targetType')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '100')

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
    }

    const where: any = { merchantId }
    if (branchId) where.branchId = branchId
    if (category) where.action = category
    if (userId) where.actorId = userId
    if (targetType) where.targetType = targetType
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59')
    }

    const logs = await db.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // Get summary stats
    const stats = {
      total: logs.length,
      byCategory: {} as Record<string, number>,
      byActor: {} as Record<string, number>,
    }

    logs.forEach(log => {
      stats.byCategory[log.action] = (stats.byCategory[log.action] || 0) + 1
      if (log.actorName) {
        stats.byActor[log.actorName] = (stats.byActor[log.actorName] || 0) + 1
      }
    })

    return NextResponse.json({
      success: true,
      data: logs,
      stats,
    })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
  }
}

// POST /api/fnb/audit - Create audit log entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      merchantId,
      branchId,
      action,
      actorId,
      actorName,
      targetType,
      targetId,
      targetName,
      details,
      metadata,
      ipAddress,
      userAgent,
    } = body

    if (!merchantId || !action) {
      return NextResponse.json({ error: 'merchantId and action are required' }, { status: 400 })
    }

    const log = await db.auditLog.create({
      data: {
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        action,
        category: 'fnb',
        actorId,
        actorName: actorName || 'System',
        targetType,
        targetId,
        targetName,
        details,
        ipAddress,
        userAgent,
      },
    })

    return NextResponse.json({
      success: true,
      data: log,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating audit log:', error)
    return NextResponse.json({ error: 'Failed to create audit log' }, { status: 500 })
  }
}

// GET /api/fnb/audit/export - Export audit logs
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const format = searchParams.get('format') || 'csv'

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
    }

    const where: any = { merchantId, category: 'fnb' }
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59')
    }

    const logs = await db.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 1000,
    })

    if (format === 'csv') {
      const headers = ['Timestamp', 'Action', 'Actor', 'Target Type', 'Target', 'Details', 'IP Address']
      const rows = logs.map(log => [
        log.createdAt.toISOString(),
        log.action,
        log.actorName || '',
        log.targetType || '',
        log.targetName || '',
        `"${(log.details || '').replace(/"/g, '""')}"`,
        log.ipAddress || '',
      ])

      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="fnb-audit-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: logs,
    })
  } catch (error) {
    console.error('Error exporting audit logs:', error)
    return NextResponse.json({ error: 'Failed to export audit logs' }, { status: 500 })
  }
}
