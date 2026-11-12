import { NextRequest, NextResponse } from 'next/server'
import { checkPermission } from '@/lib/permissions'
import { 
  getMerchantAuditLogs, 
  getAuditTrail, 
  getUserActionSummary,
  auditLog 
} from '@/lib/services/audit-service'
import { db } from '@/lib/db'

// GET /api/audit - Get audit logs
export async function GET(request: NextRequest) {
  const searchParams = new URL(request.url).searchParams
  const scope = searchParams.get('scope') || 'merchant' // 'merchant' or 'platform'
  
  // Platform scope - for multi-tenant user management
  if (scope === 'platform') {
    const tenantId = searchParams.get('tenantId')
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')
    const category = searchParams.get('category')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    try {
      const where: Record<string, unknown> = {}
      if (tenantId) where.tenantId = tenantId
      if (userId) where.userId = userId
      if (action) where.action = { contains: action }
      if (category) where.category = category
      if (startDate || endDate) {
        where.createdAt = {}
        if (startDate) where.createdAt.gte = new Date(startDate)
        if (endDate) where.createdAt.lte = new Date(endDate)
      }
      
      const logs = await db.auditLogEntry.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: 'desc' },
      })
      
      const total = await db.auditLogEntry.count({ where })
      
      return NextResponse.json({
        logs: logs.map(l => ({
          id: l.id,
          tenantId: l.tenantId,
          userId: l.userId,
          userType: l.userType,
          action: l.action,
          category: l.category,
          targetType: l.targetType,
          targetId: l.targetId,
          details: l.details ? JSON.parse(l.details) : null,
          ipAddress: l.ipAddress,
          userAgent: l.userAgent,
          createdAt: l.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    } catch (error) {
      console.error('Get platform audit logs error:', error)
      return NextResponse.json(
        { error: 'Failed to get platform audit logs' },
        { status: 500 }
      )
    }
  }
  
  // Merchant scope - existing functionality
  const permissionCheck = await checkPermission(request, 'can_view_reports')
  
  if (!permissionCheck.allowed) {
    return permissionCheck.error
  }
  
  const merchantId = permissionCheck.session!.merchantId
  
  const entity = searchParams.get('entity')
  const action = searchParams.get('action')
  const userId = searchParams.get('userId')
  const entityId = searchParams.get('entityId')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')
  const userStats = searchParams.get('userStats') === 'true'
  
  try {
    // Get user action summary
    if (userStats && userId) {
      const stats = await getUserActionSummary(merchantId, userId)
      return NextResponse.json(stats)
    }
    
    // Get audit trail for specific entity
    if (entity && entityId) {
      const trail = await getAuditTrail(entity as any, entityId, { limit, offset })
      return NextResponse.json(trail)
    }
    
    // Get merchant audit logs
    const result = await getMerchantAuditLogs(merchantId, {
      entity: entity as any,
      action: action as any,
      userId: userId || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit,
      offset,
    })
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Get audit logs error:', error)
    return NextResponse.json(
      { error: 'Failed to get audit logs' },
      { status: 500 }
    )
  }
}

// POST /api/audit - Create audit log entry
export async function POST(request: NextRequest) {
  const permissionCheck = await checkPermission(request, 'can_view_inventory')
  
  if (!permissionCheck.allowed) {
    return permissionCheck.error
  }
  
  const session = permissionCheck.session!
  
  try {
    const body = await request.json()
    
    const logId = await auditLog({
      action: body.action,
      entity: body.entity,
      entityId: body.entityId,
      oldValue: body.oldValue,
      newValue: body.newValue,
      changes: body.changes,
      context: {
        merchantId: session.merchantId,
        userId: session.userId,
        ...body.context,
      },
      status: body.status,
      errorMessage: body.errorMessage,
      metadata: body.metadata,
    })
    
    return NextResponse.json({ success: true, logId })
  } catch (error) {
    console.error('Create audit log error:', error)
    return NextResponse.json(
      { error: 'Failed to create audit log' },
      { status: 500 }
    )
  }
}
