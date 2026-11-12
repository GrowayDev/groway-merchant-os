import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

// POST /api/users/bulk - Bulk operations (create, update, delete)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { operation, users, tenantId } = body;

    if (!operation || !users || !Array.isArray(users)) {
      return NextResponse.json(
        { error: 'Operation and users array are required' },
        { status: 400 }
      );
    }

    const now = new Date();
    const results = {
      success: [] as string[],
      failed: [] as { id: string; error: string }[],
    };

    switch (operation) {
      case 'create':
        // Bulk create users
        for (const userData of users) {
          try {
            const { type = 'consumer', phone, email, firstName, lastName, role } = userData;
            
            if (type === 'consumer') {
              if (!phone) {
                results.failed.push({ id: 'unknown', error: 'Phone required for consumer' });
                continue;
              }

              const existingUser = await db.consumerUser.findUnique({ where: { phone } });
              if (existingUser) {
                results.failed.push({ id: phone, error: 'User already exists' });
                continue;
              }

              const newUser = await db.consumerUser.create({
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

              // Add to tenant if specified
              if (tenantId) {
                await db.tenantUser.create({
                  data: {
                    id: randomUUID(),
                    tenantId,
                    userId: newUser.id,
                    userType: 'consumer',
                    role: role || 'member',
                    status: 'active',
                    acceptedAt: now,
                    updatedAt: now,
                  },
                });
              }

              results.success.push(newUser.id);
            } else if (type === 'admin') {
              if (!email) {
                results.failed.push({ id: 'unknown', error: 'Email required for admin' });
                continue;
              }

              const existingAdmin = await db.adminUser.findUnique({ where: { email } });
              if (existingAdmin) {
                results.failed.push({ id: email, error: 'Admin already exists' });
                continue;
              }

              const newAdmin = await db.adminUser.create({
                data: {
                  id: randomUUID(),
                  email,
                  name: `${firstName || ''} ${lastName || ''}`.trim(),
                  role: role || 'admin',
                  status: 'active',
                  passwordHash: '',
                  updatedAt: now,
                },
              });

              results.success.push(newAdmin.id);
            }
          } catch (error) {
            results.failed.push({ id: userData.phone || userData.email || 'unknown', error: String(error) });
          }
        }
        break;

      case 'update':
        // Bulk update users
        for (const userData of users) {
          try {
            const { id, ...updates } = userData;

            if (!id) {
              results.failed.push({ id: 'unknown', error: 'User ID required' });
              continue;
            }

            // Try consumer user first
            const consumerUser = await db.consumerUser.findUnique({ where: { id } });
            if (consumerUser) {
              await db.consumerUser.update({
                where: { id },
                data: {
                  ...(updates.firstName !== undefined && { firstName: updates.firstName }),
                  ...(updates.lastName !== undefined && { lastName: updates.lastName }),
                  ...(updates.email !== undefined && { email: updates.email }),
                  ...(updates.status !== undefined && { accountStatus: updates.status }),
                  updatedAt: now,
                },
              });
              results.success.push(id);
              continue;
            }

            // Try admin user
            const adminUser = await db.adminUser.findUnique({ where: { id } });
            if (adminUser) {
              await db.adminUser.update({
                where: { id },
                data: {
                  ...(updates.name !== undefined && { name: updates.name }),
                  ...(updates.email !== undefined && { email: updates.email }),
                  ...(updates.role !== undefined && { role: updates.role }),
                  ...(updates.status !== undefined && { status: updates.status }),
                  updatedAt: now,
                },
              });
              results.success.push(id);
              continue;
            }

            results.failed.push({ id, error: 'User not found' });
          } catch (error) {
            results.failed.push({ id: userData.id || 'unknown', error: String(error) });
          }
        }
        break;

      case 'delete':
        // Bulk delete/deactivate users
        for (const userData of users) {
          try {
            const { id, hard = false } = userData;

            if (!id) {
              results.failed.push({ id: 'unknown', error: 'User ID required' });
              continue;
            }

            // Try consumer user first
            const consumerUser = await db.consumerUser.findUnique({ where: { id } });
            if (consumerUser) {
              if (hard) {
                await db.consumerUser.delete({ where: { id } });
              } else {
                await db.consumerUser.update({
                  where: { id },
                  data: { accountStatus: 'deleted', updatedAt: now },
                });
              }
              results.success.push(id);
              continue;
            }

            // Try admin user
            const adminUser = await db.adminUser.findUnique({ where: { id } });
            if (adminUser) {
              if (hard) {
                await db.adminUser.delete({ where: { id } });
              } else {
                await db.adminUser.update({
                  where: { id },
                  data: { status: 'deleted', updatedAt: now },
                });
              }
              results.success.push(id);
              continue;
            }

            results.failed.push({ id, error: 'User not found' });
          } catch (error) {
            results.failed.push({ id: userData.id || 'unknown', error: String(error) });
          }
        }
        break;

      case 'addToTenant':
        // Bulk add users to tenant
        for (const userData of users) {
          try {
            const { id, role = 'member' } = userData;

            if (!id || !tenantId) {
              results.failed.push({ id: id || 'unknown', error: 'User ID and tenant ID required' });
              continue;
            }

            // Check if already in tenant
            const existingMembership = await db.tenantUser.findFirst({
              where: { userId: id, tenantId },
            });

            if (existingMembership) {
              results.failed.push({ id, error: 'User already in tenant' });
              continue;
            }

            // Determine user type
            const consumerUser = await db.consumerUser.findUnique({ where: { id } });
            const userType = consumerUser ? 'consumer' : 'admin';

            await db.tenantUser.create({
              data: {
                id: randomUUID(),
                tenantId,
                userId: id,
                userType,
                role,
                status: 'active',
                acceptedAt: now,
                updatedAt: now,
              },
            });

            results.success.push(id);
          } catch (error) {
            results.failed.push({ id: userData.id || 'unknown', error: String(error) });
          }
        }
        break;

      case 'removeFromTenant':
        // Bulk remove users from tenant
        for (const userData of users) {
          try {
            const { id } = userData;

            if (!id || !tenantId) {
              results.failed.push({ id: id || 'unknown', error: 'User ID and tenant ID required' });
              continue;
            }

            await db.tenantUser.deleteMany({
              where: { userId: id, tenantId },
            });

            results.success.push(id);
          } catch (error) {
            results.failed.push({ id: userData.id || 'unknown', error: String(error) });
          }
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid operation. Use: create, update, delete, addToTenant, removeFromTenant' },
          { status: 400 }
        );
    }

    // Create audit log
    await db.auditLogEntry.create({
      data: {
        id: randomUUID(),
        tenantId: tenantId || null,
        action: `bulk_${operation}`,
        category: 'user_management',
        targetType: 'user',
        details: JSON.stringify({
          operation,
          successCount: results.success.length,
          failedCount: results.failed.length,
        }),
        createdAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      operation,
      results: {
        successCount: results.success.length,
        failedCount: results.failed.length,
        success: results.success,
        failed: results.failed,
      },
    });
  } catch (error) {
    console.error('Error in bulk operation:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }
}

// GET /api/users/bulk - Bulk export users (CSV template)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get('tenantId');
    const format = searchParams.get('format') || 'csv';

    // Get users based on filters
    let users: Array<Record<string, unknown>> = [];

    if (tenantId) {
      const tenantUsers = await db.tenantUser.findMany({
        where: { tenantId },
        select: {
          userId: true,
          userType: true,
          role: true,
          status: true,
          createdAt: true,
        },
      });

      // Get user details
      for (const tu of tenantUsers) {
        if (tu.userType === 'consumer') {
          const consumer = await db.consumerUser.findUnique({
            where: { id: tu.userId },
            select: {
              phone: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          });
          if (consumer) {
            users.push({
              id: tu.userId,
              type: tu.userType,
              role: tu.role,
              status: tu.status,
              ...consumer,
            });
          }
        } else {
          const admin = await db.adminUser.findUnique({
            where: { id: tu.userId },
            select: {
              email: true,
              name: true,
            },
          });
          if (admin) {
            users.push({
              id: tu.userId,
              type: tu.userType,
              role: tu.role,
              status: tu.status,
              name: admin.name,
              email: admin.email,
            });
          }
        }
      }
    } else {
      // Get all users
      const consumers = await db.consumerUser.findMany({
        select: {
          id: true,
          phone: true,
          email: true,
          firstName: true,
          lastName: true,
          accountStatus: true,
          createdAt: true,
        },
      });

      users = consumers.map(c => ({
        id: c.id,
        type: 'consumer',
        phone: c.phone,
        email: c.email,
        firstName: c.firstName,
        lastName: c.lastName,
        status: c.accountStatus,
        createdAt: c.createdAt,
      }));
    }

    if (format === 'csv') {
      // Generate CSV
      const headers = ['id', 'type', 'phone', 'email', 'firstName', 'lastName', 'role', 'status'];
      const csvRows = [
        headers.join(','),
        ...users.map(u => headers.map(h => `"${u[h] || ''}"`).join(',')),
      ];
      const csv = csvRows.join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="users-export.csv"',
        },
      });
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error exporting users:', error);
    return NextResponse.json(
      { error: 'Failed to export users' },
      { status: 500 }
    );
  }
}
