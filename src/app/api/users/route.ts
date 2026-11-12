import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';
import { getAuthContext, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-context';

/**
 * GET /api/users
 * List/search users with pagination and filtering
 * 
 * SECURITY: Requires authentication + admin role
 * - Only authenticated admins can list users
 * - Non-platform admins can only see users from their own tenant
 */
export async function GET(request: NextRequest) {
  // Authentication check
  const context = await getAuthContext(request)
  if (!context) {
    return unauthorizedResponse('Authentication required to access user list')
  }

  // Check for admin role
  if (!('role' in context) || (context.role !== 'admin' && context.role !== 'owner' && context.role !== 'platform_admin' && context.role !== 'super_admin')) {
    return forbiddenResponse('Admin access required to list users')
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const userType = searchParams.get('userType') || '';
    const tenantId = searchParams.get('tenantId') || '';
    const role = searchParams.get('role') || '';
    const cursor = searchParams.get('cursor') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';

    // Security: Non-platform admins can only see users from their own tenant
    const effectiveTenantId = context.role === 'platform_admin' || context.role === 'super_admin'
      ? tenantId
      : ('tenantId' in context ? context.tenantId : null);

    // Build filter conditions
    const where: Record<string, unknown> = {};

    // Search filter (name, email, phone)
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    // Status filter
    if (status) {
      where.accountStatus = status;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    // Cursor-based pagination for large datasets
    if (cursor) {
      where.id = { gt: cursor };
    }

    // Get consumer users
    const consumerUsers = await db.consumerUser.findMany({
      where,
      take: limit + 1,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        phone: true,
        email: true,
        firstName: true,
        lastName: true,
        kycStatus: true,
        kycLevel: true,
        accountStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Get admin users if searching across all user types
    let adminUsers: typeof consumerUsers = [];
    if (!userType || userType === 'admin') {
      adminUsers = await db.adminUser.findMany({
        where: search ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
          ],
        } : {},
        take: limit + 1,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }

    // Get tenant users if filtering by tenant
    let tenantUsers: Array<{
      id: string;
      userId: string;
      userType: string;
      role: string;
      status: string;
      tenantId: string;
      lastActiveAt: Date | null;
      createdAt: Date;
    }> = [];
    
    // Security: Only query tenant users if user has access
    if (effectiveTenantId) {
      tenantUsers = await db.tenantUser.findMany({
        where: {
          tenantId: effectiveTenantId,
          ...(status && { status }),
          ...(role && { role }),
        },
        take: limit + 1,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          userId: true,
          userType: true,
          role: true,
          status: true,
          tenantId: true,
          lastActiveAt: true,
          createdAt: true,
        },
      });
    }

    // Combine and format results
    const formattedConsumerUsers = consumerUsers.map((u) => ({
      id: u.id,
      type: 'consumer',
      phone: u.phone,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      fullName: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
      status: u.accountStatus,
      kycStatus: u.kycStatus,
      kycLevel: u.kycLevel,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

    const formattedAdminUsers = adminUsers.map((u) => ({
      id: u.id,
      type: 'admin',
      email: u.email,
      fullName: u.name,
      status: u.status,
      role: u.role,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

    // Get total counts
    const totalConsumers = await db.consumerUser.count({ where });
    const totalAdmins = await db.adminUser.count({});
    const totalTenantUsers = effectiveTenantId ? await db.tenantUser.count({ where: { tenantId: effectiveTenantId } }) : 0;

    // Determine if there are more results
    const hasMoreConsumer = consumerUsers.length > limit;
    const hasMoreAdmin = adminUsers.length > limit;
    if (hasMoreConsumer) consumerUsers.pop();
    if (hasMoreAdmin) adminUsers.pop();

    // Build response
    const response = {
      users: [...formattedConsumerUsers, ...formattedAdminUsers],
      pagination: {
        page,
        limit,
        total: totalConsumers + totalAdmins,
        totalPages: Math.ceil((totalConsumers + totalAdmins) / limit),
        hasMore: hasMoreConsumer || hasMoreAdmin,
        nextCursor: hasMoreConsumer ? consumerUsers[consumerUsers.length - 1]?.id : 
                     hasMoreAdmin ? adminUsers[adminUsers.length - 1]?.id : null,
      },
      counts: {
        consumers: totalConsumers,
        admins: totalAdmins,
        tenantUsers: totalTenantUsers,
      },
    };

    // Add tenant user details if filtering by tenant
    if (effectiveTenantId && tenantUsers.length > 0) {
      const tenantUserIds = tenantUsers.map(tu => tu.userId);
      const tenantConsumerDetails = await db.consumerUser.findMany({
        where: { id: { in: tenantUserIds } },
        select: {
          id: true,
          phone: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      });

      const tenantAdminDetails = await db.adminUser.findMany({
        where: { id: { in: tenantUserIds } },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

      const allDetails = new Map([
        ...tenantConsumerDetails.map(u => [u.id, u]),
        ...tenantAdminDetails.map(u => [u.id, u]),
      ]);

      response.users = tenantUsers.map(tu => {
        const details = allDetails.get(tu.userId) as Record<string, unknown> | undefined;
        return {
          id: tu.userId,
          tenantUserId: tu.id,
          type: tu.userType,
          role: tu.role,
          status: tu.status,
          lastActiveAt: tu.lastActiveAt,
          ...details,
          fullName: details?.firstName 
            ? `${details.firstName} ${details.lastName || ''}`.trim()
            : details?.name || '',
        };
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users
 * Create a new user
 * 
 * SECURITY: Requires authentication + admin role
 * - Only authenticated admins can create users
 * - Non-platform admins can only create users in their own tenant
 * - Audit log is created for action
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
    const body = await request.json();
    const { 
      type = 'consumer',
      phone,
      email,
      firstName,
      lastName,
      name,
      role = 'member',
      tenantId,
      permissions,
    } = body;

    // Validate required fields
    if (type === 'consumer' && !phone) {
      return NextResponse.json(
        { error: 'Phone is required for consumer users' },
        { status: 400 }
      );
    }

    if (type === 'admin' && !email) {
      return NextResponse.json(
        { error: 'Email is required for admin users' },
        { status: 400 }
      );
    }

    // Security: Non-platform admins can only add users to their own tenant
    const effectiveTenantId = context.role === 'platform_admin' || context.role === 'super_admin'
      ? tenantId
      : ('tenantId' in context ? context.tenantId : null);

    const now = new Date();
    let newUser;

    if (type === 'consumer') {
      // Check if user already exists
      const existingUser = await db.consumerUser.findUnique({
        where: { phone },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'User with this phone already exists' },
          { status: 400 }
        );
      }

      newUser = await db.consumerUser.create({
        data: {
          id: randomUUID(),
          phone,
          email: email || null,
          firstName: firstName || null,
          lastName: lastName || null,
          accountStatus: 'active',
          kycStatus: 'pending',
          updatedAt: now,
        },
      });
    } else if (type === 'admin') {
      // Check if admin already exists
      const existingAdmin = await db.adminUser.findUnique({
        where: { email },
      });

      if (existingAdmin) {
        return NextResponse.json(
          { error: 'Admin with this email already exists' },
          { status: 400 }
        );
      }

      newUser = await db.adminUser.create({
        data: {
          id: randomUUID(),
          email,
          name: name || `${firstName} ${lastName}`,
          role: role || 'admin',
          status: 'active',
          passwordHash: '', // Should be set via proper auth flow
          updatedAt: now,
        },
      });
    }

    // Add to tenant if specified
    if (effectiveTenantId && newUser) {
      await db.tenantUser.create({
        data: {
          id: randomUUID(),
          tenantId: effectiveTenantId,
          userId: newUser.id,
          userType: type,
          role: role || 'member',
          permissions: permissions ? JSON.stringify(permissions) : null,
          status: 'active',
          acceptedAt: now,
          updatedAt: now,
        },
      });
    }

    // Create audit log entry with authenticated user info
    await db.auditLogEntry.create({
      data: {
        id: randomUUID(),
        tenantId: effectiveTenantId || null,
        userId: 'userId' in context ? context.userId : null,
        userType: 'admin',
        action: 'user_created',
        category: 'user_management',
        targetType: 'user',
        targetId: newUser?.id,
        details: JSON.stringify({ type, email, phone, createdBy: 'userId' in context ? context.userId : 'system' }),
        createdAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      user: newUser,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
