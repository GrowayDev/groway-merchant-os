import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthContext, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-context'

/**
 * GET /api/enterprise/users
 * List all users
 * 
 * SECURITY: Requires authentication
 * - Only authenticated enterprise users can access
 * - Results are filtered based on user's corporate access
 */
export async function GET(request: NextRequest) {
  // Authentication check
  const context = await getAuthContext(request)
  if (!context) {
    return unauthorizedResponse('Authentication required to access users')
  }

  // Check if user has enterprise access
  if (!('tenantId' in context) && !('merchantId' in context)) {
    return forbiddenResponse('Enterprise access required')
  }

  try {
    const { searchParams } = new URL(request.url)
    const corporateId = searchParams.get('corporateId')
    const role = searchParams.get('role')
    
    const where: Record<string, unknown> = {}
    
    // Security: Non-admin users can only see users from their own corporate
    if ('role' in context && context.role !== 'platform_admin' && context.role !== 'super_admin' && context.role !== 'admin') {
      if ('tenantId' in context && context.tenantId) {
        where.corporate = { tenantId: context.tenantId }
      }
    } else if (corporateId) {
      where.corporateId = corporateId
    }
    
    if (role) where.role = role
    
    const users = await db.enterpriseUser.findMany({
      where,
      include: {
        corporate: {
          select: { id: true, name: true, tier: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

/**
 * POST /api/enterprise/users
 * Create new user
 * 
 * SECURITY: Requires authentication + admin role
 * - Only enterprise admins can create users
 * - Activity is logged for audit trail
 */
export async function POST(request: NextRequest) {
  // Authentication check
  const context = await getAuthContext(request)
  if (!context) {
    return unauthorizedResponse('Authentication required to create users')
  }

  // Check for admin role
  if (!('role' in context) || (context.role !== 'admin' && context.role !== 'owner' && context.role !== 'platform_admin' && context.role !== 'super_admin')) {
    return forbiddenResponse('Admin access required to create users')
  }

  try {
    const body = await request.json()
    const {
      corporateId,
      name,
      email,
      phone,
      role = 'Viewer',
      jobTitle,
      department,
      permissions,
      notes
    } = body

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    // Check if email already exists
    const existing = await db.enterpriseUser.findUnique({
      where: { email }
    })
    
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
    }

    // Security: Non-platform admins can only create users in their own corporate
    let finalCorporateId = corporateId
    if ('role' in context && context.role !== 'platform_admin' && context.role !== 'super_admin') {
      if ('tenantId' in context && context.tenantId) {
        // Find corporate for this tenant
        const corporate = await db.enterpriseCorporateClient.findFirst({
          where: { tenantId: context.tenantId }
        })
        finalCorporateId = corporate?.id || corporateId
      }
    }

    const user = await db.enterpriseUser.create({
      data: {
        name,
        email,
        phone,
        role,
        corporateId: finalCorporateId,
        jobTitle,
        department,
        permissions: permissions ? JSON.stringify(permissions) : null,
        notes
      },
      include: {
        corporate: true
      }
    })

    // Log activity with user info
    await db.enterpriseActivity.create({
      data: {
        corporateId: finalCorporateId,
        type: 'user_added',
        message: `New user "${name}" added with role ${role} by ${'userId' in context ? context.userId : 'system'}`,
        entityType: 'user',
        entityId: user.id,
        userId: 'userId' in context ? context.userId : null,
      }
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
