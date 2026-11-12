import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomBytes } from 'crypto'
import { getAuthContext, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-context'

/**
 * GET /api/enterprise/apikeys
 * List all API keys
 * 
 * SECURITY: Requires authentication + admin role
 * - Only authenticated enterprise admins can access
 * - Results are filtered based on corporate access
 */
export async function GET(request: NextRequest) {
  // Authentication check
  const context = await getAuthContext(request)
  if (!context) {
    return unauthorizedResponse('Authentication required to access API keys')
  }

  // Check for admin role
  if (!('role' in context) || (context.role !== 'admin' && context.role !== 'owner' && context.role !== 'platform_admin' && context.role !== 'super_admin')) {
    return forbiddenResponse('Admin access required to view API keys')
  }

  try {
    const { searchParams } = new URL(request.url)
    const queryCorporateId = searchParams.get('corporateId')
    
    // Security: Determine corporateId with validation
    let corporateId: string | null = null
    
    if ('role' in context && (context.role === 'platform_admin' || context.role === 'super_admin')) {
      // Platform admin can query any corporate
      corporateId = queryCorporateId
    } else if ('tenantId' in context && context.tenantId) {
      // Regular admin - find their corporate
      const corporate = await db.enterpriseCorporateClient.findFirst({
        where: { tenantId: context.tenantId }
      })
      corporateId = corporate?.id || null
    }
    
    if (!corporateId) {
      return NextResponse.json({ error: 'Corporate access required' }, { status: 400 })
    }
    
    const apiKeys = await db.enterpriseApiKey.findMany({
      where: { corporateId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        status: true,
        lastUsed: true,
        createdAt: true,
        expiresAt: true,
        createdBy: true,
        notes: true
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({ apiKeys })
  } catch (error) {
    console.error('Error fetching API keys:', error)
    return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 })
  }
}

/**
 * POST /api/enterprise/apikeys
 * Create new API key
 * 
 * SECURITY: Requires authentication + admin role
 * - Only authenticated enterprise admins can create API keys
 * - API key can only be created for the authenticated user's corporate
 * - Activity is logged for audit trail
 */
export async function POST(request: NextRequest) {
  // Authentication check
  const context = await getAuthContext(request)
  if (!context) {
    return unauthorizedResponse('Authentication required to create API keys')
  }

  // Check for admin role
  if (!('role' in context) || (context.role !== 'admin' && context.role !== 'owner' && context.role !== 'platform_admin' && context.role !== 'super_admin')) {
    return forbiddenResponse('Admin access required to create API keys')
  }

  try {
    const body = await request.json()
    const {
      name,
      permissions = ['read'],
      expiresAt,
      notes
    } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: 'API key name is required' }, { status: 400 })
    }

    // Security: Determine corporateId from authenticated context
    let corporateId: string | null = null
    
    if ('role' in context && (context.role === 'platform_admin' || context.role === 'super_admin')) {
      // Platform admin - use corporateId from body
      corporateId = body.corporateId
      if (!corporateId) {
        return NextResponse.json({ error: 'corporateId is required' }, { status: 400 })
      }
    } else if ('tenantId' in context && context.tenantId) {
      // Regular admin - find their corporate
      const corporate = await db.enterpriseCorporateClient.findFirst({
        where: { tenantId: context.tenantId }
      })
      corporateId = corporate?.id || null
    }
    
    if (!corporateId) {
      return NextResponse.json({ error: 'Corporate access required' }, { status: 400 })
    }

    // Generate API key
    const rawKey = randomBytes(32).toString('hex')
    const keyPrefix = `pk_live_${rawKey.substring(0, 8)}****`
    const keyHash = rawKey // In production, this should be hashed

    const apiKey = await db.enterpriseApiKey.create({
      data: {
        name,
        keyPrefix,
        keyHash,
        corporateId,
        permissions: JSON.stringify(permissions),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: 'userId' in context ? context.userId : 'system',
        notes
      }
    })

    // Log activity with user info
    await db.enterpriseActivity.create({
      data: {
        corporateId,
        type: 'api_key_created',
        message: `API key "${name}" created by ${'userId' in context ? context.userId : 'system'}`,
        entityType: 'api_key',
        entityId: apiKey.id,
        userId: 'userId' in context ? context.userId : null,
      }
    })

    // Return the full key only on creation
    return NextResponse.json({ 
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        fullKey: rawKey, // Only shown once
        permissions: apiKey.permissions,
        status: apiKey.status,
        createdAt: apiKey.createdAt
      }
    })
  } catch (error) {
    console.error('Error creating API key:', error)
    return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 })
  }
}
