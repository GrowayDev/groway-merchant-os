import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

// GET /api/users/[id] - Get a single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const includeTenantMemberships = searchParams.get('includeTenants') === 'true';
    const includeActivity = searchParams.get('includeActivity') === 'true';

    // Try to find consumer user
    const consumerUser = await db.consumerUser.findUnique({
      where: { id },
      select: {
        id: true,
        phone: true,
        email: true,
        firstName: true,
        lastName: true,
        idNumber: true,
        idType: true,
        dateOfBirth: true,
        nationality: true,
        kycLevel: true,
        kycStatus: true,
        kycVerifiedAt: true,
        languagePreference: true,
        accountStatus: true,
        freezeReason: true,
        frozenAt: true,
        createdAt: true,
        updatedAt: true,
        ConsumerWallet: {
          select: {
            balanceCents: true,
            reservedCents: true,
            totalReceivedCents: true,
            totalSentCents: true,
          },
        },
        ConsumerLoyalty: {
          select: {
            tier: true,
            points: true,
            totalEarned: true,
          },
        },
      },
    });

    if (consumerUser) {
      // Get tenant memberships if requested
      let tenantMemberships: Array<{
        id: string;
        tenantId: string;
        tenantName: string;
        role: string;
        status: string;
        lastActiveAt: Date | null;
      }> = [];
      
      if (includeTenantMemberships) {
        tenantMemberships = await db.tenantUser.findMany({
          where: { userId: id, userType: 'consumer' },
          select: {
            id: true,
            tenantId: true,
            role: true,
            status: true,
            lastActiveAt: true,
            PlatformTenant: {
              select: { name: true },
            },
          },
        }).then(results => results.map(r => ({
          id: r.id,
          tenantId: r.tenantId,
          tenantName: r.PlatformTenant?.name || '',
          role: r.role,
          status: r.status,
          lastActiveAt: r.lastActiveAt,
        })));
      }

      // Get recent activity if requested
      let recentActivity: Array<{
        id: string;
        transactionType: string;
        amountCents: bigint;
        status: string;
        createdAt: Date;
      }> = [];
      
      if (includeActivity) {
        recentActivity = await db.consumerTransaction.findMany({
          where: { userId: id },
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            transactionType: true,
            amountCents: true,
            status: true,
            createdAt: true,
          },
        });
      }

      return NextResponse.json({
        user: {
          ...consumerUser,
          type: 'consumer',
          fullName: `${consumerUser.firstName || ''} ${consumerUser.lastName || ''}`.trim(),
          tenantMemberships,
          recentActivity,
        },
      });
    }

    // Try to find admin user
    const adminUser = await db.adminUser.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        phone: true,
        mfaEnabled: true,
        status: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (adminUser) {
      // Get tenant memberships if requested
      let tenantMemberships: Array<{
        id: string;
        tenantId: string;
        tenantName: string;
        role: string;
        status: string;
        lastActiveAt: Date | null;
      }> = [];
      
      if (includeTenantMemberships) {
        tenantMemberships = await db.tenantUser.findMany({
          where: { userId: id, userType: 'admin' },
          select: {
            id: true,
            tenantId: true,
            role: true,
            status: true,
            lastActiveAt: true,
            PlatformTenant: {
              select: { name: true },
            },
          },
        }).then(results => results.map(r => ({
          id: r.id,
          tenantId: r.tenantId,
          tenantName: r.PlatformTenant?.name || '',
          role: r.role,
          status: r.status,
          lastActiveAt: r.lastActiveAt,
        })));
      }

      return NextResponse.json({
        user: {
          ...adminUser,
          type: 'admin',
          fullName: adminUser.name,
          tenantMemberships,
        },
      });
    }

    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update a user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { 
      firstName, 
      lastName, 
      email, 
      name,
      status,
      role,
      kycStatus,
      tenantId,
      tenantRole,
      permissions,
    } = body;

    const now = new Date();
    let updatedUser;

    // Try to update consumer user
    const consumerUser = await db.consumerUser.findUnique({ where: { id } });
    
    if (consumerUser) {
      updatedUser = await db.consumerUser.update({
        where: { id },
        data: {
          ...(firstName !== undefined && { firstName }),
          ...(lastName !== undefined && { lastName }),
          ...(email !== undefined && { email }),
          ...(status !== undefined && { accountStatus: status }),
          ...(kycStatus !== undefined && { kycStatus }),
          updatedAt: now,
        },
      });

      // Update tenant membership if specified
      if (tenantId) {
        await db.tenantUser.updateMany({
          where: { userId: id, tenantId },
          data: {
            ...(tenantRole && { role: tenantRole }),
            ...(permissions && { permissions: JSON.stringify(permissions) }),
            updatedAt: now,
          },
        });
      }

      // Create audit log
      await db.auditLogEntry.create({
        data: {
          id: randomUUID(),
          tenantId: tenantId || null,
          userId: id,
          userType: 'consumer',
          action: 'user_updated',
          category: 'user_management',
          targetType: 'user',
          targetId: id,
          details: JSON.stringify(body),
          createdAt: now,
        },
      });

      return NextResponse.json({
        success: true,
        user: updatedUser,
      });
    }

    // Try to update admin user
    const adminUser = await db.adminUser.findUnique({ where: { id } });
    
    if (adminUser) {
      updatedUser = await db.adminUser.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(email !== undefined && { email }),
          ...(role !== undefined && { role }),
          ...(status !== undefined && { status }),
          updatedAt: now,
        },
      });

      // Update tenant membership if specified
      if (tenantId) {
        await db.tenantUser.updateMany({
          where: { userId: id, tenantId },
          data: {
            ...(tenantRole && { role: tenantRole }),
            ...(permissions && { permissions: JSON.stringify(permissions) }),
            updatedAt: now,
          },
        });
      }

      // Create audit log
      await db.auditLogEntry.create({
        data: {
          id: randomUUID(),
          tenantId: tenantId || null,
          userId: id,
          userType: 'admin',
          action: 'user_updated',
          category: 'user_management',
          targetType: 'user',
          targetId: id,
          details: JSON.stringify(body),
          createdAt: now,
        },
      });

      return NextResponse.json({
        success: true,
        user: updatedUser,
      });
    }

    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete/deactivate a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const hardDelete = searchParams.get('hard') === 'true';
    const tenantId = searchParams.get('tenantId');

    const now = new Date();

    // Try to find consumer user
    const consumerUser = await db.consumerUser.findUnique({ where: { id } });
    
    if (consumerUser) {
      if (hardDelete) {
        // Actually delete the user
        await db.consumerUser.delete({ where: { id } });
      } else {
        // Soft delete - deactivate
        await db.consumerUser.update({
          where: { id },
          data: {
            accountStatus: 'deleted',
            updatedAt: now,
          },
        });
      }

      // Remove from tenant if specified
      if (tenantId) {
        await db.tenantUser.deleteMany({
          where: { userId: id, tenantId },
        });
      }

      // Create audit log
      await db.auditLogEntry.create({
        data: {
          id: randomUUID(),
          tenantId: tenantId || null,
          userId: id,
          userType: 'consumer',
          action: hardDelete ? 'user_deleted' : 'user_deactivated',
          category: 'user_management',
          targetType: 'user',
          targetId: id,
          createdAt: now,
        },
      });

      return NextResponse.json({
        success: true,
        message: hardDelete ? 'User deleted' : 'User deactivated',
      });
    }

    // Try to find admin user
    const adminUser = await db.adminUser.findUnique({ where: { id } });
    
    if (adminUser) {
      if (hardDelete) {
        await db.adminUser.delete({ where: { id } });
      } else {
        await db.adminUser.update({
          where: { id },
          data: {
            status: 'deleted',
            updatedAt: now,
          },
        });
      }

      // Remove from tenant if specified
      if (tenantId) {
        await db.tenantUser.deleteMany({
          where: { userId: id, tenantId },
        });
      }

      // Create audit log
      await db.auditLogEntry.create({
        data: {
          id: randomUUID(),
          tenantId: tenantId || null,
          userId: id,
          userType: 'admin',
          action: hardDelete ? 'user_deleted' : 'user_deactivated',
          category: 'user_management',
          targetType: 'user',
          targetId: id,
          createdAt: now,
        },
      });

      return NextResponse.json({
        success: true,
        message: hardDelete ? 'User deleted' : 'User deactivated',
      });
    }

    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
