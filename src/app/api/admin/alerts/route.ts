import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/alerts - List all alerts with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const alertType = searchParams.get('alertType');
    const assignedTo = searchParams.get('assignedTo');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;
    const view = searchParams.get('view');

    // Dashboard view with stats
    if (view === 'dashboard') {
      const [
        totalAlerts,
        newAlerts,
        criticalAlerts,
        unassignedAlerts,
        recentAlerts,
        alertsByType,
        alertsBySeverity,
        alertsByStatus,
      ] = await Promise.all([
        db.systemAlert.count(),
        db.systemAlert.count({ where: { status: 'new' } }),
        db.systemAlert.count({ where: { severity: 'critical', status: { notIn: ['resolved', 'closed'] } } }),
        db.systemAlert.count({ where: { assignedTo: null, status: { notIn: ['resolved', 'closed'] } } }),
        db.systemAlert.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
        }),
        db.systemAlert.groupBy({
          by: ['alertType'],
          _count: true,
          where: { status: { notIn: ['resolved', 'closed'] } },
        }),
        db.systemAlert.groupBy({
          by: ['severity'],
          _count: true,
          where: { status: { notIn: ['resolved', 'closed'] } },
        }),
        db.systemAlert.groupBy({
          by: ['status'],
          _count: true,
        }),
      ]);

      return NextResponse.json({
        stats: {
          totalAlerts,
          newAlerts,
          criticalAlerts,
          unassignedAlerts,
          acknowledgedToday: 0,
          resolvedToday: 0,
        },
        recentAlerts,
        distribution: {
          byType: alertsByType.reduce((acc, item) => {
            acc[item.alertType] = item._count;
            return acc;
          }, {} as Record<string, number>),
          bySeverity: alertsBySeverity.reduce((acc, item) => {
            acc[item.severity] = item._count;
            return acc;
          }, {} as Record<string, number>),
          byStatus: alertsByStatus.reduce((acc, item) => {
            acc[item.status] = item._count;
            return acc;
          }, {} as Record<string, number>),
        },
      });
    }

    // Build filter
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (alertType) where.alertType = alertType;
    if (assignedTo) where.assignedTo = assignedTo;

    const [alerts, total] = await Promise.all([
      db.systemAlert.findMany({
        where,
        orderBy: [
          { severity: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
        include: {
          SystemAlertNotification: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      db.systemAlert.count({ where }),
    ]);

    return NextResponse.json({
      alerts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

// POST /api/admin/alerts - Create a new alert
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      alertType,
      severity = 'medium',
      title,
      description,
      source = 'system',
      sourceApp,
      entityType,
      entityId,
      entityName,
      riskScore = 0,
      impactLevel = 'low',
      affectedSystems,
      notificationChannels,
      metadata,
      tags,
    } = body;

    if (!alertType || !title || !description) {
      return NextResponse.json(
        { error: 'alertType, title, and description are required' },
        { status: 400 }
      );
    }

    const alertId = `ALT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const alert = await db.systemAlert.create({
      data: {
        id: alertId,
        alertType,
        severity,
        status: 'new',
        title,
        description,
        source,
        sourceApp,
        entityType,
        entityId,
        entityName,
        riskScore,
        impactLevel,
        affectedSystems: affectedSystems ? JSON.stringify(affectedSystems) : null,
        notificationChannels: notificationChannels ? JSON.stringify(notificationChannels) : null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        tags: tags ? JSON.stringify(tags) : null,
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'alert_created',
        category: 'alerting',
        actorName: 'System',
        targetType: 'system_alert',
        targetId: alert.id,
        targetName: title,
        details: JSON.stringify({ alertType, severity }),
      },
    });

    // Create notifications for enabled channels
    if (notificationChannels) {
      const channels = notificationChannels as Record<string, boolean>;
      const notificationPromises = Object.entries(channels)
        .filter(([, enabled]) => enabled)
        .map(([channel]) =>
          db.systemAlertNotification.create({
            data: {
              id: `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              alertId: alert.id,
              channel,
              status: 'pending',
              recipient: 'admin-team', // Would be resolved based on alert type and assignment rules
            },
          })
        );

      await Promise.all(notificationPromises);

      // Update alert to mark notifications sent
      await db.systemAlert.update({
        where: { id: alert.id },
        data: {
          notificationSent: true,
          notificationSentAt: new Date(),
        },
      });
    }

    return NextResponse.json(alert, { status: 201 });
  } catch (error) {
    console.error('Error creating alert:', error);
    return NextResponse.json(
      { error: 'Failed to create alert' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/alerts - Update an alert (acknowledge, resolve, escalate)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action, ...data } = body;

    if (!id || !action) {
      return NextResponse.json(
        { error: 'id and action are required' },
        { status: 400 }
      );
    }

    const existingAlert = await db.systemAlert.findUnique({ where: { id } });
    if (!existingAlert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    let updateData: Record<string, unknown> = { updatedAt: new Date() };

    switch (action) {
      case 'acknowledge':
        updateData = {
          ...updateData,
          status: 'acknowledged',
          acknowledgedAt: new Date(),
          acknowledgedBy: data.acknowledgedBy || 'system',
        };
        break;

      case 'assign':
        updateData = {
          ...updateData,
          assignedTo: data.assignedTo,
          assignedToName: data.assignedToName,
          assignedAt: new Date(),
          status: existingAlert.status === 'new' ? 'acknowledged' : existingAlert.status,
        };
        break;

      case 'escalate':
        const newLevel = (existingAlert.escalationLevel || 0) + 1;
        updateData = {
          ...updateData,
          status: 'escalated',
          escalationLevel: newLevel,
          escalatedAt: new Date(),
          escalatedTo: data.escalatedTo,
          escalatedToName: data.escalatedToName,
          escalationReason: data.reason,
        };

        // Create escalation record
        await db.systemAlertEscalation.create({
          data: {
            id: `ESC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            alertId: id,
            fromLevel: existingAlert.escalationLevel || 0,
            toLevel: newLevel,
            fromAssignee: existingAlert.assignedTo,
            toAssignee: data.escalatedTo,
            toAssigneeName: data.escalatedToName,
            trigger: data.trigger || 'manual',
            reason: data.reason || 'Manual escalation',
          },
        });
        break;

      case 'resolve':
        updateData = {
          ...updateData,
          status: 'resolved',
          resolvedAt: new Date(),
          resolvedBy: data.resolvedBy || 'system',
          resolvedByName: data.resolvedByName,
          resolution: data.resolution,
          resolutionNotes: data.resolutionNotes,
        };
        break;

      case 'close':
        updateData = {
          ...updateData,
          status: 'closed',
          resolvedAt: new Date(),
          resolvedBy: data.resolvedBy || 'system',
          resolvedByName: data.resolvedByName,
        };
        break;

      case 'add_note':
        await db.systemAlertNote.create({
          data: {
            id: `NOTE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            alertId: id,
            authorId: data.authorId || 'system',
            authorName: data.authorName || 'System',
            content: data.content,
            isInternal: data.isInternal || false,
          },
        });
        break;

      case 'update':
        updateData = {
          ...updateData,
          ...data,
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    const updatedAlert = await db.systemAlert.update({
      where: { id },
      data: updateData,
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        action: `alert_${action}`,
        category: 'alerting',
        actorName: data.actorName || 'System',
        targetType: 'system_alert',
        targetId: id,
        targetName: existingAlert.title,
        details: JSON.stringify({ action, updateData }),
      },
    });

    return NextResponse.json(updatedAlert);
  } catch (error) {
    console.error('Error updating alert:', error);
    return NextResponse.json(
      { error: 'Failed to update alert' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/alerts - Delete an alert
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    await db.systemAlert.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting alert:', error);
    return NextResponse.json(
      { error: 'Failed to delete alert' },
      { status: 500 }
    );
  }
}
