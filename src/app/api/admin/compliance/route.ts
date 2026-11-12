import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/compliance - List all compliance items
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    
    if (type) {
      where.type = type;
    }
    if (status) {
      where.status = status;
    }
    if (priority) {
      where.priority = priority;
    }

    const [items, total] = await Promise.all([
      db.complianceItem.findMany({
        where,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      db.complianceItem.count({ where }),
    ]);

    // Also get POPIA requests and AML alerts counts
    const [popiaCount, amlCount] = await Promise.all([
      db.popiaRequest.count({ where: { status: 'pending' } }),
      db.amlAlert.count({ where: { status: 'new' } }),
    ]);

    return NextResponse.json({
      items,
      stats: {
        popiaPending: popiaCount,
        amlNewAlerts: amlCount,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching compliance items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compliance items' },
      { status: 500 }
    );
  }
}

// POST /api/admin/compliance - Create a new compliance item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type,
      merchantId,
      merchantName,
      submittedAt,
      priority = 'medium',
      documents,
      notes,
    } = body;

    if (!type) {
      return NextResponse.json(
        { error: 'Type is required' },
        { status: 400 }
      );
    }

    const item = await db.complianceItem.create({
      data: {
        type,
        merchantId,
        merchantName,
        submittedAt: submittedAt || new Date().toISOString().split('T')[0],
        priority,
        documents: documents ? JSON.stringify(documents) : null,
        notes: notes ? JSON.stringify(notes) : null,
        status: 'pending',
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'compliance_item_created',
        category: 'compliance',
        actorName: 'System',
        targetType: 'compliance_item',
        targetId: item.id,
        targetName: `${type} - ${merchantName || 'Unknown'}`,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating compliance item:', error);
    return NextResponse.json(
      { error: 'Failed to create compliance item' },
      { status: 500 }
    );
  }
}
