import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/fraud - Get fraud dashboard data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'dashboard';

    if (view === 'dashboard') {
      // Get dashboard statistics
      const today = new Date().toISOString().split('T')[0];
      
      // Alert stats
      const [totalAlerts, newAlerts, investigatingAlerts, resolvedToday, criticalAlerts] = await Promise.all([
        db.fraudAlert.count(),
        db.fraudAlert.count({ where: { status: 'new' } }),
        db.fraudAlert.count({ where: { status: 'investigating' } }),
        db.fraudAlert.count({ 
          where: { 
            resolvedAt: { gte: new Date(today) } 
          } 
        }),
        db.fraudAlert.count({ where: { severity: 'critical', status: { notIn: ['resolved', 'false_positive'] } } }),
      ]);

      // Case stats
      const [openCases, escalatedCases, resolvedCases] = await Promise.all([
        db.fraudCase.count({ where: { status: { in: ['open', 'investigating'] } } }),
        db.fraudCase.count({ where: { status: 'escalated' } }),
        db.fraudCase.count({ where: { status: 'resolved' } }),
      ]);

      // Rule stats
      const [activeRules, totalTriggers] = await Promise.all([
        db.fraudRule.count({ where: { status: 'active' } }),
        db.fraudRule.aggregate({ _sum: { triggers24h: true } }),
      ]);

      // Recent alerts
      const recentAlerts = await db.fraudAlert.findMany({
        take: 10,
        orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
        include: {
          FraudAlertNote: { take: 1, orderBy: { createdAt: 'desc' } }
        }
      });

      // Fraud metrics for the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const metrics = await db.fraudMetrics.findMany({
        where: { date: { gte: sevenDaysAgo.toISOString().split('T')[0] } },
        orderBy: { date: 'asc' }
      });

      // Alert distribution by type
      const alertsByType = await db.fraudAlert.groupBy({
        by: ['type'],
        _count: { id: true },
        where: { createdAt: { gte: sevenDaysAgo } }
      });

      // Alert distribution by source app
      const alertsBySource = await db.fraudAlert.groupBy({
        by: ['sourceApp'],
        _count: { id: true },
        where: { createdAt: { gte: sevenDaysAgo }, sourceApp: { not: null } }
      });

      // Top risky entities
      const riskyProfiles = await db.riskProfile.findMany({
        where: { riskScore: { gte: 70 } },
        take: 10,
        orderBy: { riskScore: 'desc' }
      });

      return NextResponse.json({
        stats: {
          totalAlerts,
          newAlerts,
          investigatingAlerts,
          resolvedToday,
          criticalAlerts,
          openCases,
          escalatedCases,
          resolvedCases,
          activeRules,
          totalTriggers: totalTriggers._sum.triggers24h || 0,
        },
        recentAlerts,
        metrics,
        alertsByType: alertsByType.map(a => ({ type: a.type, count: a._count.id })),
        alertsBySource: alertsBySource.map(a => ({ source: a.sourceApp, count: a._count.id })),
        riskyProfiles,
      });
    }

    if (view === 'alerts') {
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '50');
      const status = searchParams.get('status');
      const severity = searchParams.get('severity');
      const type = searchParams.get('type');
      const sourceApp = searchParams.get('sourceApp');
      const search = searchParams.get('search');

      const where: Record<string, unknown> = {};
      
      if (status) where.status = status;
      if (severity) where.severity = severity;
      if (type) where.type = type;
      if (sourceApp) where.sourceApp = sourceApp;
      if (search) {
        where.OR = [
          { merchantName: { contains: search } },
          { userName: { contains: search } },
          { transactionId: { contains: search } },
          { description: { contains: search } },
        ];
      }

      const [alerts, total] = await Promise.all([
        db.fraudAlert.findMany({
          where,
          orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
          skip: (page - 1) * limit,
          take: limit,
          include: {
            FraudAlertNote: {
              take: 3,
              orderBy: { createdAt: 'desc' }
            }
          }
        }),
        db.fraudAlert.count({ where }),
      ]);

      return NextResponse.json({
        alerts,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
      });
    }

    if (view === 'rules') {
      const rules = await db.fraudRule.findMany({
        orderBy: [{ priority: 'asc' }, { name: 'asc' }]
      });

      return NextResponse.json({ rules });
    }

    if (view === 'cases') {
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const status = searchParams.get('status');
      const priority = searchParams.get('priority');

      const where: Record<string, unknown> = {};
      if (status) where.status = status;
      if (priority) where.priority = priority;

      const [cases, total] = await Promise.all([
        db.fraudCase.findMany({
          where,
          orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
          skip: (page - 1) * limit,
          take: limit,
          include: {
            FraudCaseAlert: { take: 5 },
            FraudCaseNote: { take: 3, orderBy: { createdAt: 'desc' } },
            FraudCaseAction: { take: 5, orderBy: { performedAt: 'desc' } },
          }
        }),
        db.fraudCase.count({ where }),
      ]);

      return NextResponse.json({
        cases,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
      });
    }

    if (view === 'profiles') {
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '50');
      const entityType = searchParams.get('entityType');
      const riskLevel = searchParams.get('riskLevel');

      const where: Record<string, unknown> = {};
      if (entityType) where.entityType = entityType;
      if (riskLevel) where.riskLevel = riskLevel;

      const [profiles, total] = await Promise.all([
        db.riskProfile.findMany({
          where,
          orderBy: { riskScore: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.riskProfile.count({ where }),
      ]);

      return NextResponse.json({
        profiles,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
      });
    }

    if (view === 'blacklist') {
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '50');

      const [blacklist, total] = await Promise.all([
        db.iPBlacklist.findMany({
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.iPBlacklist.count({ where: { isActive: true } }),
      ]);

      return NextResponse.json({
        blacklist,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
      });
    }

    return NextResponse.json({ error: 'Invalid view parameter' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching fraud data:', error);
    return NextResponse.json({ error: 'Failed to fetch fraud data' }, { status: 500 });
  }
}

// POST /api/admin/fraud - Create alert, case, or rule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    if (action === 'create_alert') {
      const alert = await db.fraudAlert.create({
        data: {
          id: `fa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: data.type,
          severity: data.severity || 'medium',
          merchantId: data.merchantId,
          merchantName: data.merchantName,
          userId: data.userId,
          userName: data.userName,
          transactionId: data.transactionId,
          amount: data.amount,
          description: data.description,
          riskScore: data.riskScore || 50,
          rule: data.rule,
          ruleId: data.ruleId,
          details: data.details ? JSON.stringify(data.details) : null,
          source: data.source || 'manual',
          sourceApp: data.sourceApp,
          ipAddress: data.ipAddress,
          deviceId: data.deviceId,
          location: data.location,
          latitude: data.latitude,
          longitude: data.longitude,
        }
      });

      // Update fraud metrics
      await updateMetrics('alert_created', alert);

      return NextResponse.json(alert, { status: 201 });
    }

    if (action === 'create_case') {
      const caseNumber = `FC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      
      const fraudCase = await db.fraudCase.create({
        data: {
          id: `fc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          caseNumber,
          title: data.title,
          description: data.description,
          type: data.type,
          priority: data.priority || 'medium',
          merchantId: data.merchantId,
          merchantName: data.merchantName,
          userId: data.userId,
          userName: data.userName,
          totalAmount: data.totalAmount || 0,
          transactionCount: data.transactionCount || 0,
          reportedBy: data.reportedBy,
          reportedByName: data.reportedByName,
          tags: data.tags ? JSON.stringify(data.tags) : null,
        }
      });

      return NextResponse.json(fraudCase, { status: 201 });
    }

    if (action === 'create_rule') {
      const rule = await db.fraudRule.create({
        data: {
          id: `fr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: data.name,
          code: data.code,
          description: data.description,
          category: data.category,
          type: data.type || 'threshold',
          priority: data.priority || 1,
          conditions: data.conditions ? JSON.stringify(data.conditions) : null,
          thresholds: data.thresholds ? JSON.stringify(data.thresholds) : null,
          actions: data.actions ? JSON.stringify(data.actions) : null,
          riskScoreWeight: data.riskScoreWeight || 1.0,
          autoAction: data.autoAction || false,
          autoActionType: data.autoActionType,
          cooldownMinutes: data.cooldownMinutes || 60,
        }
      });

      return NextResponse.json(rule, { status: 201 });
    }

    if (action === 'add_to_blacklist') {
      const entry = await db.iPBlacklist.create({
        data: {
          id: `ipbl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ipAddress: data.ipAddress,
          reason: data.reason,
          source: data.source || 'manual',
          riskScore: data.riskScore || 100,
          countryCode: data.countryCode,
          city: data.city,
          isp: data.isp,
          proxyType: data.proxyType,
          addedBy: data.addedBy,
          addedByName: data.addedByName,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        }
      });

      return NextResponse.json(entry, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error creating fraud data:', error);
    return NextResponse.json({ error: 'Failed to create fraud data' }, { status: 500 });
  }
}

// PUT /api/admin/fraud - Update alert, case, or rule
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, id, ...data } = body;

    if (action === 'update_alert') {
      const updateData: Record<string, unknown> = {
        ...data,
        updatedAt: new Date(),
      };

      if (data.status === 'resolved') {
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = data.resolvedBy;
        updateData.resolvedByName = data.resolvedByName;
        updateData.resolution = data.resolution;
        await updateMetrics('alert_resolved', data);
      }

      if (data.status === 'escalated') {
        updateData.escalatedAt = new Date();
        updateData.escalatedTo = data.escalatedTo;
        updateData.escalatedToName = data.escalatedToName;
      }

      if (data.falsePositive) {
        updateData.falsePositive = true;
        await updateMetrics('false_positive', data);
      }

      const alert = await db.fraudAlert.update({
        where: { id },
        data: updateData,
      });

      return NextResponse.json(alert);
    }

    if (action === 'update_case') {
      const updateData: Record<string, unknown> = {
        ...data,
        updatedAt: new Date(),
      };

      if (data.status === 'resolved') {
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = data.resolvedBy;
        updateData.resolvedByName = data.resolvedByName;
        updateData.resolution = data.resolution;
      }

      const fraudCase = await db.fraudCase.update({
        where: { id },
        data: updateData,
      });

      return NextResponse.json(fraudCase);
    }

    if (action === 'update_rule') {
      const rule = await db.fraudRule.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json(rule);
    }

    if (action === 'assign_alert') {
      const alert = await db.fraudAlert.update({
        where: { id },
        data: {
          assignedTo: data.assignedTo,
          assignedToName: data.assignedToName,
          status: 'investigating',
          updatedAt: new Date(),
        },
      });

      return NextResponse.json(alert);
    }

    if (action === 'add_note') {
      const note = await db.fraudAlertNote.create({
        data: {
          id: `fan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          alertId: id,
          authorId: data.authorId,
          authorName: data.authorName,
          content: data.content,
          isInternal: data.isInternal || false,
        }
      });

      return NextResponse.json(note, { status: 201 });
    }

    if (action === 'add_case_action') {
      const caseAction = await db.fraudCaseAction.create({
        data: {
          id: `fca_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          caseId: id,
          actionType: data.actionType,
          description: data.description,
          performedBy: data.performedBy,
          performedByName: data.performedByName,
          result: data.result,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        }
      });

      return NextResponse.json(caseAction, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating fraud data:', error);
    return NextResponse.json({ error: 'Failed to update fraud data' }, { status: 500 });
  }
}

// Helper function to update metrics
async function updateMetrics(action: string, data: Record<string, unknown>) {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const existing = await db.fraudMetrics.findUnique({
      where: { date: today }
    });

    if (existing) {
      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      
      if (action === 'alert_created') {
        updateData.alertsGenerated = existing.alertsGenerated + 1;
        updateData.pendingAlerts = existing.pendingAlerts + 1;
        if (data.severity === 'critical') {
          updateData.criticalAlerts = existing.criticalAlerts + 1;
        }
      }
      
      if (action === 'alert_resolved') {
        updateData.alertsResolved = existing.alertsResolved + 1;
        updateData.pendingAlerts = Math.max(0, existing.pendingAlerts - 1);
        if (data.severity === 'critical') {
          updateData.criticalAlerts = Math.max(0, existing.criticalAlerts - 1);
        }
      }
      
      if (action === 'false_positive') {
        updateData.alertsFalsePositive = existing.alertsFalsePositive + 1;
      }

      await db.fraudMetrics.update({
        where: { date: today },
        data: updateData,
      });
    } else {
      await db.fraudMetrics.create({
        data: {
          id: `fm_${Date.now()}`,
          date: today,
          alertsGenerated: action === 'alert_created' ? 1 : 0,
          pendingAlerts: action === 'alert_created' ? 1 : 0,
          criticalAlerts: action === 'alert_created' && data.severity === 'critical' ? 1 : 0,
          alertsResolved: action === 'alert_resolved' ? 1 : 0,
          alertsFalsePositive: action === 'false_positive' ? 1 : 0,
        }
      });
    }
  } catch (error) {
    console.error('Error updating metrics:', error);
  }
}
