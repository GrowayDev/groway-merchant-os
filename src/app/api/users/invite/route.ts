import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';
import { hash } from 'bcryptjs';

// POST /api/users/invite - Send user invitations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      emails, 
      tenantId, 
      role = 'member', 
      permissions,
      invitedBy,
      invitedByName,
    } = body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: 'Emails array is required' },
        { status: 400 }
      );
    }

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    // Verify tenant exists
    const tenant = await db.platformTenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Check tenant user limit
    const currentUsers = await db.tenantUser.count({
      where: { tenantId, status: 'active' },
    });

    if (currentUsers + emails.length > tenant.maxUsers) {
      return NextResponse.json(
        { error: `Tenant user limit reached. Maximum: ${tenant.maxUsers}` },
        { status: 400 }
      );
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const results = {
      success: [] as string[],
      failed: [] as { email: string; error: string }[],
      invitations: [] as Array<{
        id: string;
        email: string;
        token: string;
        expiresAt: Date;
      }>,
    };

    for (const email of emails) {
      try {
        // Check if user already exists
        const existingUser = await db.consumerUser.findFirst({
          where: { email },
        });

        // Check for existing pending invitation
        const existingInvitation = await db.tenantInvitation.findFirst({
          where: {
            email,
            tenantId,
            status: 'pending',
            expiresAt: { gt: now },
          },
        });

        if (existingInvitation) {
          results.failed.push({ email, error: 'Pending invitation already exists' });
          continue;
        }

        // Check if already a member
        if (existingUser) {
          const existingMembership = await db.tenantUser.findFirst({
            where: { userId: existingUser.id, tenantId },
          });

          if (existingMembership) {
            results.failed.push({ email, error: 'User is already a member' });
            continue;
          }
        }

        // Generate unique token
        const token = randomUUID();

        // Create invitation
        const invitation = await db.tenantInvitation.create({
          data: {
            id: randomUUID(),
            tenantId,
            email,
            role,
            permissions: permissions ? JSON.stringify(permissions) : null,
            invitedBy: invitedBy || 'system',
            invitedByName: invitedByName || 'System',
            token,
            status: 'pending',
            expiresAt,
            updatedAt: now,
          },
        });

        results.success.push(email);
        results.invitations.push({
          id: invitation.id,
          email,
          token,
          expiresAt,
        });

        // In a real implementation, send email here
        // For now, we'll just log it
        console.log(`Invitation sent to ${email} for tenant ${tenant.name}`);
        console.log(`Invitation link: ${process.env.NEXT_PUBLIC_APP_URL}/invite/accept?token=${token}`);

      } catch (error) {
        results.failed.push({ email, error: String(error) });
      }
    }

    // Create audit log
    await db.auditLogEntry.create({
      data: {
        id: randomUUID(),
        tenantId,
        userId: invitedBy,
        action: 'invitations_sent',
        category: 'user_management',
        targetType: 'invitation',
        details: JSON.stringify({
          count: results.success.length,
          emails: results.success,
        }),
        createdAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      results: {
        successCount: results.success.length,
        failedCount: results.failed.length,
        success: results.success,
        failed: results.failed,
        invitations: results.invitations,
      },
    });
  } catch (error) {
    console.error('Error sending invitations:', error);
    return NextResponse.json(
      { error: 'Failed to send invitations' },
      { status: 500 }
    );
  }
}

// GET /api/users/invite - List invitations
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get('tenantId');
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Record<string, unknown> = {};
    if (tenantId) where.tenantId = tenantId;
    if (status) where.status = status;

    const invitations = await db.tenantInvitation.findMany({
      where,
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { createdAt: 'desc' },
      include: {
        PlatformTenant: {
          select: { name: true, slug: true },
        },
      },
    });

    const total = await db.tenantInvitation.count({ where });

    return NextResponse.json({
      invitations: invitations.map(inv => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        permissions: inv.permissions ? JSON.parse(inv.permissions) : null,
        invitedBy: inv.invitedBy,
        invitedByName: inv.invitedByName,
        status: inv.status,
        expiresAt: inv.expiresAt,
        acceptedAt: inv.acceptedAt,
        createdAt: inv.createdAt,
        tenant: inv.PlatformTenant,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    );
  }
}

// PUT /api/users/invite - Accept/decline invitation
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, action, userId, firstName, lastName, phone, password } = body;

    if (!token || !action) {
      return NextResponse.json(
        { error: 'Token and action are required' },
        { status: 400 }
      );
    }

    const invitation = await db.tenantInvitation.findUnique({
      where: { token },
      include: { PlatformTenant: true },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: 'Invitation already processed' },
        { status: 400 }
      );
    }

    const now = new Date();
    if (invitation.expiresAt < now) {
      await db.tenantInvitation.update({
        where: { id: invitation.id },
        data: { status: 'expired', updatedAt: now },
      });
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      );
    }

    if (action === 'decline') {
      await db.tenantInvitation.update({
        where: { id: invitation.id },
        data: { status: 'declined', updatedAt: now },
      });

      return NextResponse.json({
        success: true,
        message: 'Invitation declined',
      });
    }

    if (action === 'accept') {
      // Find or create user
      let user;
      
      // Check if user exists by email
      const existingConsumer = await db.consumerUser.findFirst({
        where: { email: invitation.email },
      });

      if (existingConsumer) {
        user = existingConsumer;
      } else if (userId) {
        // Use provided userId
        user = await db.consumerUser.findUnique({ where: { id: userId } });
      } else {
        // Create new user
        if (!phone || !password) {
          return NextResponse.json(
            { error: 'Phone and password required for new user' },
            { status: 400 }
          );
        }

        const hashedPassword = await hash(password, 10);
        user = await db.consumerUser.create({
          data: {
            id: randomUUID(),
            phone,
            email: invitation.email,
            firstName: firstName || null,
            lastName: lastName || null,
            pinHash: hashedPassword,
            accountStatus: 'active',
            kycStatus: 'pending',
            updatedAt: now,
          },
        });

        // Create wallet
        await db.consumerWallet.create({
          data: {
            id: randomUUID(),
            userId: user.id,
          },
        });
      }

      if (!user) {
        return NextResponse.json(
          { error: 'Could not find or create user' },
          { status: 500 }
        );
      }

      // Create tenant membership
      await db.tenantUser.create({
        data: {
          id: randomUUID(),
          tenantId: invitation.tenantId,
          userId: user.id,
          userType: 'consumer',
          role: invitation.role,
          permissions: invitation.permissions,
          status: 'active',
          invitedBy: invitation.invitedBy,
          invitedAt: invitation.createdAt,
          acceptedAt: now,
          updatedAt: now,
        },
      });

      // Update invitation status
      await db.tenantInvitation.update({
        where: { id: invitation.id },
        data: { status: 'accepted', acceptedAt: now, updatedAt: now },
      });

      // Create audit log
      await db.auditLogEntry.create({
        data: {
          id: randomUUID(),
          tenantId: invitation.tenantId,
          userId: user.id,
          userType: 'consumer',
          action: 'invitation_accepted',
          category: 'user_management',
          targetType: 'invitation',
          targetId: invitation.id,
          createdAt: now,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Invitation accepted',
        user: {
          id: user.id,
          email: user.email,
          tenant: invitation.PlatformTenant,
        },
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use: accept, decline' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing invitation:', error);
    return NextResponse.json(
      { error: 'Failed to process invitation' },
      { status: 500 }
    );
  }
}
