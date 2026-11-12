/**
 * Platform Tenants API
 * Tenant management for multi-tenant architecture
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createTenant, addUserToTenant, getTenantContext } from '@/lib/platform/tenant-context'
import { getRateLimitHeaders, checkCombinedRateLimit } from '@/lib/platform/rate-limiter'

// GET /api/platform/tenants - List tenants
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const plan = searchParams.get('plan')
    const search = searchParams.get('search')
    
    const offset = (page - 1) * limit
    
    const where: Record<string, unknown> = {}
    
    if (status) where.status = status
    if (plan) where.plan = plan
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { slug: { contains: search } },
      ]
    }
    
    const [tenants, total] = await Promise.all([
      db.platformTenant.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { TenantUser: true },
          },
        },
      }),
      db.platformTenant.count({ where }),
    ])
    
    return NextResponse.json({
      tenants: tenants.map(t => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        domain: t.domain,
        plan: t.plan,
        status: t.status,
        maxUsers: t.maxUsers,
        maxMerchants: t.maxMerchants,
        userCount: t._count.TenantUser,
        createdAt: t.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('List tenants error:', error)
    return NextResponse.json(
      { error: 'Failed to list tenants' },
      { status: 500 }
    )
  }
}

// POST /api/platform/tenants - Create tenant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Rate limit check
    const currentTenant = await getTenantContext()
    const tenantId = currentTenant?.tenantId || 'anonymous'
    const rateLimit = checkCombinedRateLimit(tenantId, '/api/platform/tenants', currentTenant?.plan || 'starter')
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      )
    }
    
    const { name, slug, plan, domain, features, settings, ownerId, ownerType } = body
    
    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      )
    }
    
    // Create tenant
    const result = await createTenant({
      name,
      slug,
      plan: plan || 'starter',
      domain,
      features,
      settings,
    })
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }
    
    // Add owner if provided
    if (ownerId && result.tenant) {
      await addUserToTenant({
        tenantId: result.tenant.tenantId,
        userId: ownerId,
        userType: ownerType || 'merchant',
        role: 'owner',
        permissions: ['*'],
      })
    }
    
    return NextResponse.json({
      success: true,
      tenant: result.tenant,
    }, { status: 201 })
  } catch (error) {
    console.error('Create tenant error:', error)
    return NextResponse.json(
      { error: 'Failed to create tenant' },
      { status: 500 }
    )
  }
}
