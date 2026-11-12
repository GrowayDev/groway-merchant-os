import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/fraud-alerts/[id] - Get a specific fraud alert
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const alert = await db.fraudAlert.findUnique({
      where: { id },
    });

    if (!alert) {
      return NextResponse.json(
        { error: 'Fraud alert not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(alert);
  } catch (error) {
    console.error('Error fetching fraud alert:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fraud alert' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/fraud-alerts/[id] - Update a fraud alert (status, notes, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existingAlert = await db.fraudAlert.findUnique({
      where: { id },
    });

    if (!existingAlert) {
      return NextResponse.json(
        { error: 'Fraud alert not found' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    const allowedFields = ['status', 'severity', 'assignedTo', 'notes'];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const alert = await db.fraudAlert.update({
      where: { id },
      data: updateData,
    });

    // Create audit log for status changes
    if (body.status && body.status !== existingAlert.status) {
      await db.auditLog.create({
        data: {
          action: `fraud_alert_${body.status}`,
          category: 'compliance',
          actorName: body.actorName || 'System',
          targetType: 'fraud_alert',
          targetId: id,
          targetName: existingAlert.description?.substring(0, 50) || 'Alert',
          details: JSON.stringify({
            previousStatus: existingAlert.status,
            newStatus: body.status,
          }),
        },
      });
    }

    return NextResponse.json(alert);
  } catch (error) {
    console.error('Error updating fraud alert:', error);
    return NextResponse.json(
      { error: 'Failed to update fraud alert' },
      { status: 500 }
    );
  }
}
