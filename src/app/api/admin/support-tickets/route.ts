import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/support-tickets - List all support tickets
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    
    if (status) {
      where.status = status;
    }
    if (priority) {
      where.priority = priority;
    }
    if (category) {
      where.category = category;
    }

    const [tickets, total] = await Promise.all([
      db.supportTicket.findMany({
        where,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      db.supportTicket.count({ where }),
    ]);

    return NextResponse.json({
      tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch support tickets' },
      { status: 500 }
    );
  }
}

// POST /api/admin/support-tickets - Create a new support ticket
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      subject,
      merchantId,
      merchantName,
      category = 'other',
      priority = 'medium',
      assignee,
      initialMessage,
    } = body;

    if (!subject) {
      return NextResponse.json(
        { error: 'Subject is required' },
        { status: 400 }
      );
    }

    const messages = initialMessage
      ? JSON.stringify([
          {
            id: 1,
            content: initialMessage,
            sender: 'system',
            timestamp: new Date().toISOString(),
          },
        ])
      : null;

    const ticket = await db.supportTicket.create({
      data: {
        subject,
        merchantId,
        merchantName,
        category,
        priority,
        assignee,
        messages,
        status: 'open',
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'support_ticket_created',
        category: 'system',
        actorName: 'System',
        targetType: 'support_ticket',
        targetId: ticket.id,
        targetName: subject,
      },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    return NextResponse.json(
      { error: 'Failed to create support ticket' },
      { status: 500 }
    );
  }
}
