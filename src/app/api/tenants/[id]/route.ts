import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

// GET /api/tenants/[id] - Get single tenant
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const includeUsers = searchParams.get('includeUsers') === 'true';
    const includeStats = searchParams.get('includeStats') === 'true';

    const tenant = await db.platformTenant.findUnique({
      where: { id },
      include: {
        TenantSubscription: true,
        ...(includeUsers && {
          TenantUser: {
            take: 100,
            orderBy: { createdAt: 'desc' },
          },
        }),
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Get statistics
    let stats = null;
    if (includeStats) {
      const [userCount, activeUserCount, invitationCount, pendingInvitations] = await Promise.all([
        db.tenantUser.count({ where: { tenantId: id } }),
        db.tenantUser.count({ where: { tenantId: id, status: 'active' } }),
        db.tenantInvitation.count({ where: { tenantId: id } }),
        db.tenantInvitation.count({ where: { tenantId: id, status: 'pending' } }),
      ]);

      stats = {
        totalUsers: userCount,
        activeUsers: activeUserCount,
        totalInvitations: invitationCount,
        pendingInvitations,
        usersLimit: tenant.maxUsers,
        usersRemaining: Math.max(0, tenant.maxUsers - userCount),
      };
    }

    // Get user details if requested
    let users = null;
    if (includeUsers && tenant.TenantUser) {
      const userIds = tenant.TenantUser.map(tu => tu.userId);
      const consumerDetails = await db.consumerUser.findMany({
        where: { id: { in: userIds } },
        select: { id: true, phone: true, email: true, firstName: true, lastName: true, accountStatus: true },
      });
      const adminDetails = await db.adminUser.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true, name: true, status: true },
      });
      
      const userDetailsMap = new Map([
        ...consumerDetails.map(u => [u.id, { ...u, type: 'consumer' }]),
        ...adminDetails.map(u => [u.id, { ...u, type: 'admin' }]),
      ]);

      users = tenant.TenantUser.map(tu => {
        const details = userDetailsMap.get(tu.userId) as Record<string, unknown> | undefined;
        return {
          id: tu.id,
          userId: tu.userId,
          userType: tu.userType,
          role: tu.role,
          permissions: tu.permissions ? JSON.parse(tu.permissions) : null,
          status: tu.status,
          lastActiveAt: tu.lastActiveAt,
          createdAt: tu.createdAt,
          ...details,
        };
      });
    }

    return NextResponse.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        logo: tenant.logo,
        primaryColor: tenant.primaryColor,
        domain: tenant.domain,
        status: tenant.status,
        plan: tenant.plan,
        maxUsers: tenant.maxUsers,
        maxMerchants: tenant.maxMerchants,
        features: tenant.features ? JSON.parse(tenant.features) : [],
        settings: tenant.settings ? JSON.parse(tenant.settings) : {},
        createdAt: tenant.createdAt,
        subscription: tenant.TenantSubscription,
        stats,
        users,
      },
    });
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenant' },
      { status: 500 }
    );
  }
}

// PUT /api/tenants/[id] - Update tenant
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      slug,
      logo,
      primaryColor,
      domain,
      status,
      plan,
      maxUsers,
      maxMerchants,
      features,
      settings,
    } = body;

    const existingTenant = await db.platformTenant.findUnique({ where: { id } });
    if (!existingTenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Check slug uniqueness if changing
    if (slug && slug !== existingTenant.slug) {
      const slugExists = await db.platformTenant.findUnique({ where: { slug } });
      if (slugExists) {
        return NextResponse.json(
          { error: 'Slug is already taken' },
          { status: 400 }
        );
      }
    }

    // Check domain uniqueness if changing
    if (domain && domain !== existingTenant.domain) {
      const domainExists = await db.platformTenant.findUnique({ where: { domain } });
      if (domainExists) {
        return NextResponse.json(
          { error: 'Domain is already taken' },
          { status: 400 }
        );
      }
    }

    const now = new Date();
    const updatedTenant = await db.platformTenant.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(logo !== undefined && { logo }),
        ...(primaryColor !== undefined && { primaryColor }),
        ...(domain !== undefined && { domain }),
        ...(status !== undefined && { status }),
        ...(plan !== undefined && { plan }),
        ...(maxUsers !== undefined && { maxUsers }),
        ...(maxMerchants !== undefined && { maxMerchants }),
        ...(features !== undefined && { features: JSON.stringify(features) }),
        ...(settings !== undefined && { settings: JSON.stringify(settings) }),
        updatedAt: now,
      },
    });

    // Create audit log
    await db.auditLogEntry.create({
      data: {
        id: randomUUID(),
        tenantId: id,
        action: 'tenant_updated',
        category: 'tenant_management',
        targetType: 'tenant',
        targetId: id,
        details: JSON.stringify(body),
        createdAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      tenant: updatedTenant,
    });
  } catch (error) {
    console.error('Error updating tenant:', error);
    return NextResponse.json(
      { error: 'Failed to update tenant' },
      { status: 500 }
    );
  }
}

// DELETE /api/tenants/[id] - Delete/deactivate tenant
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const hardDelete = searchParams.get('hard') === 'true';

    const tenant = await db.platformTenant.findUnique({ where: { id } });
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    const now = new Date();

    if (hardDelete) {
      // This will cascade delete all related records
      await db.platformTenant.delete({ where: { id } });
    } else {
      // Soft delete - deactivate
      await db.platformTenant.update({
        where: { id },
        data: { status: 'deleted', updatedAt: now },
      });
    }

    // Create audit log (before deleting)
    await db.auditLogEntry.create({
      data: {
        id: randomUUID(),
        tenantId: hardDelete ? null : id,
        action: hardDelete ? 'tenant_deleted' : 'tenant_deactivated',
        category: 'tenant_management',
        targetType: 'tenant',
        targetId: id,
        details: JSON.stringify({ name: tenant.name, slug: tenant.slug }),
        createdAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      message: hardDelete ? 'Tenant deleted' : 'Tenant deactivated',
    });
  } catch (error) {
    console.error('Error deleting tenant:', error);
    return NextResponse.json(
      { error: 'Failed to delete tenant' },
      { status: 500 }
    );
  }
}
