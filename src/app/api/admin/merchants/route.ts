import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthContext, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-context';

/**
 * GET /api/admin/merchants
 * List all merchants
 * 
 * SECURITY: Requires authentication + admin role
 * - Only platform admins can list all merchants
 * - Audit log is created for access
 */
export async function GET(request: NextRequest) {
  // Authentication check
  const context = await getAuthContext(request)
  if (!context) {
    return unauthorizedResponse('Authentication required to access merchant list')
  }

  // SECURITY: Only platform admins can list all merchants
  if (!('role' in context) || (context.role !== 'platform_admin' && context.role !== 'super_admin')) {
    return forbiddenResponse('Platform admin access required to list all merchants')
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const tier = searchParams.get('tier');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    
    if (status) {
      where.status = status;
    }
    if (tier) {
      where.tier = tier;
    }
    if (search) {
      where.OR = [
        { businessName: { contains: search } },
        { tradingName: { contains: search } },
        { contactEmail: { contains: search } },
      ];
    }

    const [merchants, total] = await Promise.all([
      db.adminMerchant.findMany({
        where,
        include: {
          documents: true,
          notes: {
            orderBy: { createdAt: 'desc' },
            take: 3,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.adminMerchant.count({ where }),
    ]);

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'merchants_listed',
        category: 'merchant',
        actorId: 'userId' in context ? context.userId : null,
        actorName: 'userId' in context ? context.userId : 'Unknown',
        targetType: 'merchant',
        targetId: 'all',
        targetName: 'Merchant List',
        details: JSON.stringify({ filters: { status, tier, search }, pagination: { page, limit } }),
      },
    });

    return NextResponse.json({
      merchants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching merchants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch merchants' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/merchants
 * Create a new merchant
 * 
 * SECURITY: Requires authentication + admin role
 * - Only platform admins can create merchants
 * - Audit log is created for action
 */
export async function POST(request: NextRequest) {
  // Authentication check
  const context = await getAuthContext(request)
  if (!context) {
    return unauthorizedResponse('Authentication required to create merchants')
  }

  // SECURITY: Only platform admins can create merchants
  if (!('role' in context) || (context.role !== 'platform_admin' && context.role !== 'super_admin')) {
    return forbiddenResponse('Platform admin access required to create merchants')
  }

  try {
    const body = await request.json();
    const {
      businessName,
      tradingName,
      registrationNumber,
      vatNumber,
      tier = 'starter',
      vertical,
      subVertical,
      contactName,
      contactEmail,
      contactPhone,
      addressStreet,
      addressCity,
      addressProvince,
      addressPostalCode,
    } = body;

    if (!businessName) {
      return NextResponse.json(
        { error: 'Business name is required' },
        { status: 400 }
      );
    }

    const merchant = await db.adminMerchant.create({
      data: {
        businessName,
        tradingName,
        registrationNumber,
        vatNumber,
        tier,
        vertical,
        subVertical,
        contactName,
        contactEmail,
        contactPhone,
        addressStreet,
        addressCity,
        addressProvince,
        addressPostalCode,
        status: 'pending',
        kycStatus: 'pending',
        kybStatus: 'pending',
      },
    });

    // Create audit log with authenticated user info
    await db.auditLog.create({
      data: {
        action: 'merchant_created',
        category: 'merchant',
        actorId: 'userId' in context ? context.userId : null,
        actorName: 'userId' in context ? context.userId : 'System',
        targetType: 'merchant',
        targetId: merchant.id,
        targetName: businessName,
        details: JSON.stringify({ businessName, tier }),
      },
    });

    return NextResponse.json(merchant, { status: 201 });
  } catch (error) {
    console.error('Error creating merchant:', error);
    return NextResponse.json(
      { error: 'Failed to create merchant' },
      { status: 500 }
    );
  }
}
