import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/support-tickets/[id] - Get a specific support ticket
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const ticket = await db.supportTicket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Support ticket not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Error fetching support ticket:', error);
    return NextResponse.json(
      { error: 'Failed to fetch support ticket' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/support-tickets/[id] - Update a support ticket
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existingTicket = await db.supportTicket.findUnique({
      where: { id },
    });

    if (!existingTicket) {
      return NextResponse.json(
        { error: 'Support ticket not found' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    const allowedFields = ['status', 'priority', 'category', 'assignee', 'messages'];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const ticket = await db.supportTicket.update({
      where: { id },
      data: updateData,
    });

    // Create audit log for status changes
    if (body.status && body.status !== existingTicket.status) {
      await db.auditLog.create({
        data: {
          action: `support_ticket_${body.status}`,
          category: 'system',
          actorName: body.actorName || 'System',
          targetType: 'support_ticket',
          targetId: id,
          targetName: ticket.subject,
          details: JSON.stringify({
            previousStatus: existingTicket.status,
            newStatus: body.status,
          }),
        },
      });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Error updating support ticket:', error);
    return NextResponse.json(
      { error: 'Failed to update support ticket' },
      { status: 500 }
    );
  }
}
