import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthContext, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-context'

/**
 * GET /api/enterprise/clients
 * List all corporate clients
 * 
 * SECURITY: Requires authentication
 * - Only authenticated enterprise users can access
 * - Results are filtered based on user's tenant/corporate access
 */
export async function GET(request: NextRequest) {
  // Authentication check
  const context = await getAuthContext(request)
  if (!context) {
    return unauthorizedResponse('Authentication required to access corporate clients')
  }

  // Check if user has enterprise access
  if (!('tenantId' in context) && !('merchantId' in context)) {
    return forbiddenResponse('Enterprise access required')
  }

  try {
    // Build query based on user's access level
    const whereClause: Record<string, unknown> = {}
    
    // If user is not a platform admin, filter by their corporate/tenant
    if ('role' in context && context.role !== 'platform_admin' && context.role !== 'super_admin') {
      if ('tenantId' in context && context.tenantId) {
        whereClause.tenantId = context.tenantId
      }
    }

    const clients = await db.enterpriseCorporateClient.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      include: {
        _count: {
          select: { merchants: true, users: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({ clients })
  } catch (error) {
    console.error('Error fetching corporate clients:', error)
    return NextResponse.json({ error: 'Failed to fetch corporate clients' }, { status: 500 })
  }
}

/**
 * POST /api/enterprise/clients
 * Create new corporate client
 * 
 * SECURITY: Requires authentication + admin role
 * - Only enterprise admins can create new clients
 * - Activity is logged for audit trail
 */
export async function POST(request: NextRequest) {
  // Authentication check
  const context = await getAuthContext(request)
  if (!context) {
    return unauthorizedResponse('Authentication required to create corporate clients')
  }

  // Check for admin role
  if (!('role' in context) || (context.role !== 'admin' && context.role !== 'owner' && context.role !== 'platform_admin' && context.role !== 'super_admin')) {
    return forbiddenResponse('Admin access required to create corporate clients')
  }

  try {
    const body = await request.json()
    const {
      name,
      tier = 'Silver',
      creditLimit = 0,
      contactPerson,
      contactEmail,
      contactPhone,
      address,
      city,
      province,
      postalCode,
      registrationNumber,
      vatNumber,
      notes
    } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: 'Client name is required' }, { status: 400 })
    }

    // Generate unique code
    const count = await db.enterpriseCorporateClient.count()
    const code = `CC${String(count + 1).padStart(3, '0')}`

    // Get tenantId from context
    const tenantId = 'tenantId' in context ? context.tenantId : null

    const client = await db.enterpriseCorporateClient.create({
      data: {
        code,
        name,
        tier,
        creditLimit: parseFloat(String(creditLimit)) || 0,
        contactPerson,
        contactEmail,
        contactPhone,
        address,
        city,
        province,
        postalCode,
        registrationNumber,
        vatNumber,
        notes,
        tenantId,
      }
    })

    // Log activity with user info
    await db.enterpriseActivity.create({
      data: {
        corporateId: client.id,
        type: 'client_created',
        message: `Corporate client "${name}" created by ${'userId' in context ? context.userId : 'system'}`,
        entityType: 'corporate_client',
        entityId: client.id,
        userId: 'userId' in context ? context.userId : null,
      }
    })

    return NextResponse.json({ client })
  } catch (error) {
    console.error('Error creating corporate client:', error)
    return NextResponse.json({ error: 'Failed to create corporate client' }, { status: 500 })
  }
}
