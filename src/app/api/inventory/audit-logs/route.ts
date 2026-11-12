/**
 * Inventory Audit Log API
 * 
 * Phase 11: Compliance & Reporting
 * Tracks all inventory-related actions for compliance
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/inventory/audit-logs - Get audit logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const action = searchParams.get('action')
    const userId = searchParams.get('userId')
    const productId = searchParams.get('productId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId required' }, { status: 400 })
    }

    // Build where clause
    const where: Record<string, unknown> = { merchantId }

    if (action) {
      where.action = action
    }
    if (userId) {
      where.userId = userId
    }
    if (productId) {
      where.entityId = productId
    }
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        (where.createdAt as Record<string, unknown>).gte = new Date(startDate)
      }
      if (endDate) {
        (where.createdAt as Record<string, unknown>).lte = new Date(endDate)
      }
    }

    const logs = await db.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    const total = await db.auditLog.count({ where })

    return NextResponse.json({
      logs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + logs.length < total,
      },
    })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
  }
}

// POST /api/inventory/audit-logs - Create audit log entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      merchantId,
      action,
      entityType,
      entityId,
      userId,
      userName,
      oldValue,
      newValue,
      metadata,
    } = body

    if (!merchantId || !action || !entityType) {
      return NextResponse.json(
        { error: 'merchantId, action, and entityType required' },
        { status: 400 }
      )
    }

    const log = await db.auditLog.create({
      data: {
        merchantId,
        action,
        entityType,
        entityId,
        userId,
        userName,
        oldValue: oldValue ? JSON.stringify(oldValue) : null,
        newValue: newValue ? JSON.stringify(newValue) : null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    })

    return NextResponse.json({ log })
  } catch (error) {
    console.error('Error creating audit log:', error)
    return NextResponse.json({ error: 'Failed to create audit log' }, { status: 500 })
  }
}
