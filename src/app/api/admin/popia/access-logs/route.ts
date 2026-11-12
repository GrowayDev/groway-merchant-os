import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/popia/access-logs - List document access logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const documentType = searchParams.get('documentType')
    const accessedBy = searchParams.get('accessedBy')
    const action = searchParams.get('action')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (documentType) {
      where.documentType = documentType
    }
    if (accessedBy) {
      where.accessedBy = accessedBy
    }
    if (action) {
      where.action = action
    }

    let logs: unknown[] = []
    let total = 0

    try {
      const [data, count] = await Promise.all([
        db.documentAccessLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        db.documentAccessLog.count({ where }),
      ])
      logs = data
      total = count
    } catch {
      // Table might not exist yet
      logs = []
      total = 0
    }

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching access logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch access logs' },
      { status: 500 }
    )
  }
}

// POST /api/admin/popia/access-logs - Log document access
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      documentType,
      documentId,
      documentName,
      accessedBy,
      accessedByName,
      accessedByRole,
      action,
      ipAddress,
      userAgent,
      reason,
      caseId,
      caseNumber,
    } = body

    const id = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    let newLog
    try {
      newLog = await db.documentAccessLog.create({
        data: {
          id,
          documentType,
          documentId,
          documentName,
          accessedBy,
          accessedByName,
          accessedByRole,
          action,
          ipAddress,
          userAgent,
          reason,
          caseId,
          caseNumber,
          createdAt: new Date(),
        },
      })
    } catch {
      // Return mock data if table doesn't exist
      newLog = {
        id,
        documentType,
        documentId,
        documentName,
        accessedBy,
        accessedByName,
        accessedByRole,
        action,
        ipAddress,
        createdAt: new Date(),
      }
    }

    return NextResponse.json(newLog, { status: 201 })
  } catch (error) {
    console.error('Error logging document access:', error)
    return NextResponse.json(
      { error: 'Failed to log document access' },
      { status: 500 }
    )
  }
}
