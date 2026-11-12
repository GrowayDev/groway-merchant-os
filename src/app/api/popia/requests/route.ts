import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/popia/requests - List POPIA requests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const overdue = searchParams.get('overdue') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: Record<string, unknown> = {}
    
    if (status && status !== 'all') {
      where.status = status
    }
    
    if (type && type !== 'all') {
      where.requestType = type
    }

    if (overdue) {
      where.dueDate = { lt: new Date() }
      where.status = { notIn: ['completed', 'rejected'] }
    }

    const [requests, total] = await Promise.all([
      db.pOPIARequest.findMany({
        where,
        orderBy: [
          { dueDate: 'asc' },
          { createdAt: 'desc' }
        ],
        take: limit,
        skip: offset
      }),
      db.pOPIARequest.count({ where })
    ])

    // Calculate days remaining for each request
    const requestsWithDaysRemaining = requests.map(req => ({
      ...req,
      daysRemaining: Math.ceil((new Date(req.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      isOverdue: new Date(req.dueDate) < new Date() && !['completed', 'rejected'].includes(req.status)
    }))

    return NextResponse.json({
      requests: requestsWithDaysRemaining,
      total,
      limit,
      offset
    })
  } catch (error) {
    console.error('Error fetching POPIA requests:', error)
    return NextResponse.json({ error: 'Failed to fetch POPIA requests' }, { status: 500 })
  }
}

// POST /api/popia/requests - Create a new POPIA request (public endpoint for data subjects)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      requestType,
      requesterName,
      requesterEmail,
      requesterPhone,
      requesterIdNumber,
      description,
      dataCategories
    } = body

    // Validate required fields
    if (!requestType || !requesterName || !requesterEmail) {
      return NextResponse.json({ 
        error: 'Missing required fields: requestType, requesterName, requesterEmail' 
      }, { status: 400 })
    }

    // Validate request type
    const validTypes = ['access', 'correction', 'deletion', 'objection', 'portability']
    if (!validTypes.includes(requestType)) {
      return NextResponse.json({ 
        error: `Invalid request type. Must be one of: ${validTypes.join(', ')}` 
      }, { status: 400 })
    }

    // Calculate due date (30 days from now per POPIA)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 30)

    // Create the request
    const popiaRequest = await db.pOPIARequest.create({
      data: {
        id: `popia-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        requestType,
        requesterName,
        requesterEmail,
        requesterPhone,
        requesterIdNumber,
        description,
        dataCategories: dataCategories ? JSON.stringify(dataCategories) : null,
        identityVerified: false,
        status: 'pending',
        dueDate,
        updatedAt: new Date()
      }
    })

    // Log the request creation
    await db.auditLog.create({
      data: {
        id: `audit-${Date.now()}`,
        action: 'create',
        category: 'popia',
        actorName: requesterName,
        targetType: 'popia_request',
        targetId: popiaRequest.id,
        targetName: `POPIA ${requestType} request`,
        details: `POPIA ${requestType} request submitted by ${requesterEmail}`,
        createdAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      request: popiaRequest,
      message: 'Your POPIA request has been submitted. You will receive a response within 30 days.'
    })
  } catch (error) {
    console.error('Error creating POPIA request:', error)
    return NextResponse.json({ error: 'Failed to create POPIA request' }, { status: 500 })
  }
}
