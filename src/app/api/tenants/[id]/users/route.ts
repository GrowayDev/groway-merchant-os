import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/tenants/[id]/users - Get users within tenant
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';
    const userType = searchParams.get('userType') || '';
    const cursor = searchParams.get('cursor') || '';

    // Verify tenant exists
    const tenant = await db.platformTenant.findUnique({ where: { id } });
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Build where clause for tenant users
    const where: Record<string, unknown> = { tenantId: id };
    if (role) where.role = role;
    if (status) where.status = status;
    if (userType) where.userType = userType;
    if (cursor) where.id = { gt: cursor };

    // Get tenant users
    const tenantUsers = await db.tenantUser.findMany({
      where,
      take: limit + 1,
      orderBy: { createdAt: 'desc' },
    });

    const hasMore = tenantUsers.length > limit;
    if (hasMore) tenantUsers.pop();

    // Get user details
    const userIds = tenantUsers.map(tu => tu.userId);
    const consumerUsers = await db.consumerUser.findMany({
      where: { 
        id: { in: userIds },
        ...(search && {
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { email: { contains: search } },
            { phone: { contains: search } },
          ],
        }),
      },
      select: {
        id: true,
        phone: true,
        email: true,
        firstName: true,
        lastName: true,
        accountStatus: true,
        kycStatus: true,
        createdAt: true,
      },
    });

    const adminUsers = await db.adminUser.findMany({
      where: { 
        id: { in: userIds },
        ...(search && {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
          ],
        }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        createdAt: true,
      },
    });

    // Create a map of user details
    const userDetailsMap = new Map([
      ...consumerUsers.map(u => [u.id, { ...u, type: 'consumer' }]),
      ...adminUsers.map(u => [u.id, { ...u, type: 'admin' }]),
    ]);

    // Combine tenant users with their details
    const users = tenantUsers
      .filter(tu => userDetailsMap.has(tu.userId))
      .map(tu => {
        const details = userDetailsMap.get(tu.userId) as Record<string, unknown>;
        return {
          tenantUserId: tu.id,
          userId: tu.userId,
          userType: tu.userType,
          role: tu.role,
          permissions: tu.permissions ? JSON.parse(tu.permissions) : null,
          tenantStatus: tu.status,
          lastActiveAt: tu.lastActiveAt,
          invitedAt: tu.invitedAt,
          acceptedAt: tu.acceptedAt,
          ...details,
          fullName: details.firstName 
            ? `${details.firstName} ${details.lastName || ''}`.trim()
            : details.name || '',
        };
      });

    // Get counts
    const totalUsers = await db.tenantUser.count({ where: { tenantId: id } });
    const activeUsers = await db.tenantUser.count({ where: { tenantId: id, status: 'active' } });

    return NextResponse.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
      users,
      pagination: {
        page,
        limit,
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
        hasMore,
        nextCursor: hasMore ? tenantUsers[tenantUsers.length - 1]?.id : null,
      },
      counts: {
        total: totalUsers,
        active: activeUsers,
        limit: tenant.maxUsers,
        remaining: Math.max(0, tenant.maxUsers - totalUsers),
      },
    });
  } catch (error) {
    console.error('Error fetching tenant users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenant users' },
      { status: 500 }
    );
  }
}
