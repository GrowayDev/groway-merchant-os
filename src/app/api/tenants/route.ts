import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

// GET /api/tenants - List tenants
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const plan = searchParams.get('plan') || '';

    const where: Record<string, unknown> = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { slug: { contains: search } },
        { domain: { contains: search } },
      ];
    }
    
    if (status) where.status = status;
    if (plan) where.plan = plan;

    const tenants = await db.platformTenant.findMany({
      where,
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { createdAt: 'desc' },
      include: {
        TenantSubscription: {
          select: {
            planName: true,
            status: true,
            currentPeriodEnd: true,
          },
        },
        _count: {
          select: {
            TenantUser: true,
            TenantInvitation: true,
          },
        },
      },
    });

    const total = await db.platformTenant.count({ where });

    return NextResponse.json({
      tenants: tenants.map(t => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        logo: t.logo,
        primaryColor: t.primaryColor,
        domain: t.domain,
        status: t.status,
        plan: t.plan,
        maxUsers: t.maxUsers,
        maxMerchants: t.maxMerchants,
        features: t.features ? JSON.parse(t.features) : [],
        settings: t.settings ? JSON.parse(t.settings) : {},
        createdAt: t.createdAt,
        subscription: t.TenantSubscription,
        userCount: t._count.TenantUser,
        invitationCount: t._count.TenantInvitation,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenants' },
      { status: 500 }
    );
  }
}

// POST /api/tenants - Create a new tenant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      slug,
      logo,
      primaryColor,
      domain,
      plan = 'starter',
      maxUsers = 10,
      maxMerchants = 1,
      features,
      settings,
      ownerId,
      ownerEmail,
    } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // Check if slug is already taken
    const existingTenant = await db.platformTenant.findUnique({
      where: { slug },
    });

    if (existingTenant) {
      return NextResponse.json(
        { error: 'Slug is already taken' },
        { status: 400 }
      );
    }

    // Check if domain is already taken
    if (domain) {
      const existingDomain = await db.platformTenant.findUnique({
        where: { domain },
      });

      if (existingDomain) {
        return NextResponse.json(
          { error: 'Domain is already taken' },
          { status: 400 }
        );
      }
    }

    const now = new Date();
    const tenantId = randomUUID();

    // Create tenant
    const tenant = await db.platformTenant.create({
      data: {
        id: tenantId,
        name,
        slug,
        logo: logo || null,
        primaryColor: primaryColor || null,
        domain: domain || null,
        status: 'active',
        plan,
        maxUsers,
        maxMerchants,
        features: features ? JSON.stringify(features) : null,
        settings: settings ? JSON.stringify(settings) : null,
        updatedAt: now,
      },
    });

    // Create default subscription
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
    await db.tenantSubscription.create({
      data: {
        id: randomUUID(),
        tenantId,
        planId: plan,
        planName: plan.charAt(0).toUpperCase() + plan.slice(1),
        billingCycle: 'monthly',
        status: 'trialing',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        amount: 0,
        updatedAt: now,
      },
    });

    // Add owner if provided
    if (ownerId || ownerEmail) {
      let userId = ownerId;

      // If only email provided, find or create user
      if (!userId && ownerEmail) {
        const existingUser = await db.consumerUser.findFirst({
          where: { email: ownerEmail },
        });

        if (existingUser) {
          userId = existingUser.id;
        } else {
          // Create a new user (they'll need to complete registration)
          const newUser = await db.consumerUser.create({
            data: {
              id: randomUUID(),
              phone: `pending_${randomUUID().slice(0, 8)}`,
              email: ownerEmail,
              accountStatus: 'pending',
              kycStatus: 'pending',
              updatedAt: now,
            },
          });
          userId = newUser.id;
        }
      }

      if (userId) {
        await db.tenantUser.create({
          data: {
            id: randomUUID(),
            tenantId,
            userId,
            userType: 'admin',
            role: 'owner',
            permissions: JSON.stringify(['*']),
            status: 'active',
            acceptedAt: now,
            updatedAt: now,
          },
        });
      }
    }

    // Create audit log
    await db.auditLogEntry.create({
      data: {
        id: randomUUID(),
        tenantId,
        action: 'tenant_created',
        category: 'tenant_management',
        targetType: 'tenant',
        targetId: tenantId,
        details: JSON.stringify({ name, slug, plan }),
        createdAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
        plan: tenant.plan,
      },
    });
  } catch (error) {
    console.error('Error creating tenant:', error);
    return NextResponse.json(
      { error: 'Failed to create tenant' },
      { status: 500 }
    );
  }
}
