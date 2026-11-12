/**
 * Platform Tenant Individual Operations API
 * Update, delete, and get individual tenants
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/platform/tenants/[id] - Get single tenant
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const tenant = await db.platformTenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: { TenantUser: true },
        },
      },
    })
    
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        domain: tenant.domain,
        plan: tenant.plan,
        status: tenant.status,
        maxUsers: tenant.maxUsers,
        maxMerchants: tenant.maxMerchants,
        features: tenant.features ? JSON.parse(tenant.features) : [],
        settings: tenant.settings ? JSON.parse(tenant.settings) : {},
        userCount: tenant._count.TenantUser,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
      },
    })
  } catch (error) {
    console.error('Get tenant error:', error)
    return NextResponse.json(
      { error: 'Failed to get tenant' },
      { status: 500 }
    )
  }
}

// PUT /api/platform/tenants/[id] - Update tenant
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const { name, slug, domain, plan, status, features, settings, maxUsers, maxMerchants } = body
    
    // Check if tenant exists
    const existing = await db.platformTenant.findUnique({
      where: { id },
    })
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }
    
    // If slug is being changed, check for duplicates
    if (slug && slug !== existing.slug) {
      const slugExists = await db.platformTenant.findUnique({
        where: { slug },
      })
      
      if (slugExists) {
        return NextResponse.json(
          { error: 'Tenant slug already exists' },
          { status: 400 }
        )
      }
    }
    
    // Update tenant
    const tenant = await db.platformTenant.update({
      where: { id },
      data: {
        name: name || existing.name,
        slug: slug || existing.slug,
        domain: domain !== undefined ? domain : existing.domain,
        plan: plan || existing.plan,
        status: status || existing.status,
        maxUsers: maxUsers !== undefined ? maxUsers : existing.maxUsers,
        maxMerchants: maxMerchants !== undefined ? maxMerchants : existing.maxMerchants,
        features: features ? JSON.stringify(features) : existing.features,
        settings: settings ? JSON.stringify(settings) : existing.settings,
        updatedAt: new Date(),
      },
    })
    
    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        domain: tenant.domain,
        plan: tenant.plan,
        status: tenant.status,
        maxUsers: tenant.maxUsers,
        maxMerchants: tenant.maxMerchants,
      },
    })
  } catch (error) {
    console.error('Update tenant error:', error)
    return NextResponse.json(
      { error: 'Failed to update tenant' },
      { status: 500 }
    )
  }
}

// DELETE /api/platform/tenants/[id] - Delete tenant (soft delete by setting status)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check if tenant exists
    const existing = await db.platformTenant.findUnique({
      where: { id },
    })
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }
    
    // Soft delete - set status to suspended
    await db.platformTenant.update({
      where: { id },
      data: {
        status: 'suspended',
        updatedAt: new Date(),
      },
    })
    
    return NextResponse.json({
      success: true,
      message: 'Tenant has been suspended',
    })
  } catch (error) {
    console.error('Delete tenant error:', error)
    return NextResponse.json(
      { error: 'Failed to delete tenant' },
      { status: 500 }
    )
  }
}
