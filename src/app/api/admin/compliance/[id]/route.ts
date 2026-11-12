import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/compliance/[id] - Get a specific compliance item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const item = await db.complianceItem.findUnique({
      where: { id },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Compliance item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error fetching compliance item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compliance item' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/compliance/[id] - Update a compliance item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existingItem = await db.complianceItem.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Compliance item not found' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    const allowedFields = ['status', 'priority', 'assignedTo', 'documents', 'notes'];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const item = await db.complianceItem.update({
      where: { id },
      data: updateData,
    });

    // Create audit log for status changes
    if (body.status && body.status !== existingItem.status) {
      await db.auditLog.create({
        data: {
          action: `compliance_${body.status}`,
          category: 'compliance',
          actorName: body.actorName || 'System',
          targetType: 'compliance_item',
          targetId: id,
          targetName: `${existingItem.type} - ${existingItem.merchantName || 'Unknown'}`,
          details: JSON.stringify({
            previousStatus: existingItem.status,
            newStatus: body.status,
          }),
        },
      });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error updating compliance item:', error);
    return NextResponse.json(
      { error: 'Failed to update compliance item' },
      { status: 500 }
    );
  }
}
